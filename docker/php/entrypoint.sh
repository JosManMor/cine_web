#!/bin/sh
set -e

cd /var/www

# ── APP_KEY ──────────────────────────────────────────────────────────────────
if [ -z "$APP_KEY" ]; then
    if [ -f .env ]; then
        FILE_KEY=$(grep '^APP_KEY=' .env | cut -d'=' -f2- | tr -d '[:space:]')
    fi

    if [ -n "$FILE_KEY" ]; then
        APP_KEY="$FILE_KEY"
    else
        APP_KEY=$(php -r "echo 'base64:'.base64_encode(random_bytes(32));")
        [ -f .env ] && sed -i "s|^APP_KEY=.*|APP_KEY=$APP_KEY|" .env
        echo "[entrypoint] APP_KEY generada y guardada en .env"
    fi

    export APP_KEY
fi

if [ ! -f vendor/autoload.php ]; then
    echo "[entrypoint] ERROR: vendor/ not found. Run 'composer install' first." >&2
    exit 1
fi

# ── Base de datos ─────────────────────────────────────────────────────────────
echo "[entrypoint] Ejecutando migraciones..."
php artisan migrate --force --no-interaction

echo "[entrypoint] Ejecutando seeders..."
php artisan db:seed --force --no-interaction

exec "$@"
