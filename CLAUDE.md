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
# 1. Env file lives at the REPO ROOT (loaded via env_file); there is no backend/.env in Docker
cp .env.example .env            # set HOST_UID/HOST_GID (id -u / id -g)

# 2. Install PHP deps (backend/ is mounted as /var/www; entrypoint aborts without vendor/)
docker compose run --rm --no-deps --entrypoint sh app -c "composer install"

# 3. Generate APP_KEY and paste it into the root .env (otherwise the entrypoint
#    creates a temporary in-memory key that changes on every restart)
docker compose run --rm --no-deps --entrypoint php app artisan key:generate --show

# 4. Start all services: redis, app (PHP-FPM), apache :80, mysql :FORWARD_DB_PORT,
#    phpmyadmin :FORWARD_PMA_PORT, mailpit :8025/:1025, frontend (Vite) :5173
docker compose up -d
```

The app entrypoint runs `migrate --force` and `db:seed --force` on every start. Changes to `.env` require `docker compose up -d` (recreate); `restart` does not reload `env_file`. Changes to `docker/php/entrypoint.sh` require `--build` (it is copied into the image).

Networks: `frontend_net` (frontend, apache, app) and `backend_net` (app, mysql, redis, phpmyadmin, mailpit); only `app` joins both.

`composer setup` (from `backend/`, outside Docker) runs: composer install → copy .env → migrate → db:seed. It does **not** run `key:generate`.

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

**No double-booking:** UNIQUE `(screening_id, row, seat_number)` in `purchase_seats` is the DB-level guarantee. Do not use `exists()` as a pre-check — concurrent transactions can both pass the check and still collide on INSERT. Instead, attempt the INSERT directly and catch the duplicate-key exception:

```php
use Illuminate\Database\UniqueConstraintViolationException;

DB::transaction(function () {
    try {
        PurchaseSeat::create([...]);
    } catch (UniqueConstraintViolationException) {
        throw new SeatAlreadyTakenException($row, $seatNumber);
    }
});
```

**No `tickets` table.** `ticket_code` lives in `purchase_seats`. Assign it (UUID or unique code) only after `purchases.payment_status = 'completed'`, via an Observer or Queue Job — never inline in the purchase request.

**No soft deletes.** Use `status = 'inactive'` on `users` and `movies` to preserve purchase history.

`purchase_seats.price_paid` stores the historical price — never recalculate from `screenings.base_price` for past purchases.

## Environment

- Docker (dev): copy root `.env.example` to root `.env` (MySQL: `DB_HOST=mysql`, `DB_DATABASE=cine_db`)
- Docker (prod simulation): copy `.env.prod.example` to `.env.prod`; see `docs/deployment-produccion.md`
- Local (without Docker): `backend/.env` is used; there is no `backend/.env.example`, and Laravel falls back to SQLite when `DB_CONNECTION` is unset

## Frontend Requirements

- **Responsive design is mandatory.** Every component and page must work on mobile (≥ 320px), tablet and desktop viewports. Use `flex-wrap`, relative units, media queries or container queries — never fixed widths/heights that break on small screens.
- Test UI changes at both desktop and mobile (≤ 480px) widths before considering them done.

### Frontend redesign workflow

UI redesigns are done **one view at a time**, each in its own git worktree and branch:

1. **Worktree per view:** `git worktree add -b feat/redesign-<view> .claude/worktrees/redesign-<view> dev`. Never redesign two views in the same worktree; never touch files owned by another view's worktree (shared components go in their own PR first).
2. **Agent:** delegate the implementation to the `voltagent-core-dev:frontend-developer` subagent (React + Tailwind). Use `voltagent-core-dev:ui-designer` only for design-system decisions, and `voltagent-qa-sec:accessibility-tester` / `ui-ux-tester` for review.
3. **Art direction:** follow the `design-taste-frontend` skill (`.agents/skills/design-taste-frontend/SKILL.md`). When the user supplies a reference image, it is the binding art direction; the skill's house rules still apply (no eyebrows, no monospace, no index numbering, no decorative gradients — a scrim over a photograph is allowed).
4. **Styling:** Tailwind CSS v4 (`@tailwindcss/vite`). Design tokens (colors, fonts, radii) live once in `frontend/src/index.css` under `@theme`; reuse them and shared utility classes/components instead of inline `style={{}}` objects or per-component `<style>` blocks. `constants/theme.js` stays only for views not yet migrated.
5. **Visual verification:** take screenshots with Playwright (Playwright MCP, or the skill's `scripts/inspect.mjs`, which drives a real Chrome at 1440 / 768 / 390 px) after each major step and compare them against the reference. Fix every `FAIL` from `inspect.mjs` and `lint.mjs`.
6. **Done means:** `npm run lint`, `npm run test` and `npm run build` pass; screenshots at desktop and ≤ 480px reviewed; UI text in Spanish; then open a PR from `feat/redesign-<view>` to `dev`.

## Testing

Tests use in-memory SQLite regardless of the `.env` DB setting (configured in `phpunit.xml`). Test suites: `Unit` (`tests/Unit/`) and `Feature` (`tests/Feature/`).

## Bash Scripts (`scripts/`)

`scripts/watchdog.sh` — restarts Apache/MySQL if down, logs to `/var/log/cine_error.log` (native server only; not used in Docker)  
`scripts/backup.sh` — `mysqldump` only if disk free > 15% (runs in the prod `cron` container at 02:00)  
`scripts/staff_creator.sh` — bulk Linux user creation for staff (copied into the prod image at `/usr/local/scripts/`)  
`scripts/hardening.sh` — one-time server hardening (UFW, SSH)  
`scripts/cine.cron` — cron file for a native install: watchdog every minute (`*/1 * * * *`), backup at 2 AM (`0 2 * * *`).
