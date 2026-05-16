# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cine Sendera is a cinema management system (ticketing, seat selection, admin dashboard). Stack: **React 18 SPA** (frontend) + **Laravel 13 / PHP 8.3** (backend API) + **MySQL 8** + **Apache**, containerized with Docker Compose.

## Language Standards

- **Code** (variables, functions, classes, DB columns): English
- **User-visible UI content**: Spanish
- **Documentation** (docs/, comments explaining business rules): Spanish
- **Exception**: `CLAUDE.md` se mantiene en inglés por compatibilidad con herramientas y asistentes que consumen este archivo.

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
Services/           → All business logic (PurchaseService, MovieService, AuthService)
Repositories/
  Contracts/        → Interfaces (MovieRepositoryInterface, etc.)
  Eloquent/         → Eloquent implementations
DTOs/               → Data Transfer Objects between layers
Models/             → Eloquent models (User, Movie, Room, Screening, Purchase, PurchaseSeat)
Policies/           → Laravel Policies for authorization per model
```

Current route registration uses `routes/web.php` and `routes/console.php`. If `api.php`, `auth.php`, or `admin.php` are added later, they must also be registered in `backend/bootstrap/app.php`.

## API

- **Base URL**: `/api`
- **Auth**: Laravel Sanctum (Bearer token for SPA)
- **Roles**: `admin`, `cashier`, `client` — stored as ENUM in `users.role`
- **Admin routes** require role `admin`; `purchases.cancel` is available to the owner

## Database — Critical Rules

The source of truth for the schema is `docs/database-design.md`. Key constraints:

**No double-booking:** UNIQUE `(screening_id, row, seat_number)` in `purchase_seats` is the DB-level guarantee. All reservation logic must run inside a transaction:
```php
DB::transaction(function () {
    $taken = PurchaseSeat::lockForUpdate()
        ->where('screening_id', $screeningId)
        ->where('row', $row)
        ->where('seat_number', $seatNumber)
        ->exists();

    if ($taken) throw new SeatAlreadyTakenException();

    PurchaseSeat::create([...]);
});
```

**No `tickets` table.** `ticket_code` lives in `purchase_seats`. Assign it (UUID or unique code) only after `purchases.payment_status = 'completed'`, via an Observer or Queue Job — never inline in the purchase request.

**No soft deletes.** Use `status = 'inactive'` on `users` and `movies` to preserve purchase history.

`purchase_seats.price_paid` stores the historical price — never recalculate from `screenings.base_price` for past purchases.

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
