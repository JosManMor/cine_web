# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cine Sendera is a cinema management system (ticketing, seat selection, admin dashboard). Stack: **React 18 SPA** (frontend) + **Laravel 13 / PHP 8.3** (backend API) + **MySQL 8** + **Apache**, containerized with Docker Compose.

## Language Standards

- **Code** (variables, functions, classes, DB columns): English
- **User-visible UI content**: Spanish
- **Documentation** (docs/, comments explaining business rules): Spanish

## Development Setup

```bash
# Start all services (PHP app, Apache :80, MySQL :3306, phpMyAdmin :8080)
docker-compose up -d

# First-time setup inside the PHP container (mounts backend/ as /var/www)
composer setup
# Which runs: composer install → key:generate → migrate → npm install → npm run build
```

## Commands (run from `backend/`)

```bash
# Start dev servers concurrently (PHP server + queue + pail log watcher + Vite)
composer dev

# Run all tests (uses in-memory SQLite, not the dev DB)
composer test

# Run a single test or filter by name
php artisan test --filter PurchaseServiceTest

# Linting (Laravel Pint)
./vendor/bin/pint

# Database
php artisan migrate
php artisan db:seed
php artisan migrate:fresh --seed

# Tinker REPL
php artisan tinker
```

Frontend (from `frontend/`):
```bash
npm install
npm run dev    # Vite dev server
npm run build  # Build to dist/
```

## Backend Architecture (`backend/app/`)

Follows **Service + Repository + DTO** pattern. Never put business logic in controllers.

```
Http/Controllers/   → Thin: validate input, call Service, return Resource
Http/Requests/      → Form Request validation (PurchaseRequest, RegisterRequest, etc.)
Http/Resources/     → JSON response shaping
Services/           → All business logic (PurchaseService, MovieService, TicketService, AuthService)
Repositories/
  Contracts/        → Interfaces (MovieRepositoryInterface, etc.)
  Eloquent/         → Eloquent implementations
DTOs/               → Data Transfer Objects between layers
Models/             → Eloquent models (User, Movie, Screening, Purchase, Ticket, etc.)
Policies/           → Laravel Policies for authorization per model
```

Routes are split: `web.php`, `api.php`, `auth.php`, `admin.php`.

## API

- **Base URL**: `/api`
- **Auth**: Laravel Sanctum (Bearer token for SPA)
- **Roles**: `admin`, `cashier`, `client` — permissions stored in `role_permissions` pivot
- **Admin routes** require role `admin`; `purchases.cancel` is available to the owner

## Database — Critical Rules

The most important constraint: **`(seat_id, screening_id)` in `purchase_seats` is UNIQUE** — this is the DB-level guarantee against double-booking.

All seat reservation logic must use:
```php
DB::transaction(function () {
    $seat = Seat::lockForUpdate()->findOrFail($seatId);
    // validate + insert purchase_seats ...
});
```

Tickets (`tickets` table) are only generated **after** `purchases.payment_status = 'completed'`. Use a Laravel Observer or Queue Job triggered on that state change, never inline in the purchase request.

Soft deletes are used on `users` and `movies` (preserve purchase history). Do not add soft deletes to high-volume tables.

`purchase_seats.price_paid` stores the historical price — never recalculate from current `seat_pricing` for past purchases.

## Environment

- Local (without Docker): `backend/.env` defaults to SQLite (`DB_CONNECTION=sqlite`)
- Docker: root `.env.example` sets MySQL (`DB_HOST=mysql`, `DB_DATABASE=cine_db`)
- Copy the correct `.env.example` to `backend/.env` before running

## Testing

Tests use in-memory SQLite regardless of the `.env` DB setting (configured in `phpunit.xml`). Test suites: `Unit` (`tests/Unit/`) and `Feature` (`tests/Feature/`).

## Planned Bash Scripts (not yet in repo)

`scripts/watchdog.sh` — restarts Apache/MySQL if down, logs to `/var/log/cine_error.log`  
`scripts/backup.sh` — `mysqldump` only if disk free > 15%  
`scripts/staff_creator.sh` — bulk Linux user creation for staff  

Cron: watchdog every minute (`*/1 * * * *`), backup at 2 AM (`0 2 * * *`).
