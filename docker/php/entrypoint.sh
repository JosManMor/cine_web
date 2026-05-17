#!/bin/sh
set -e

cd /var/www

if [ -z "$APP_KEY" ]; then
    # Try to reuse a key already written to the mounted .env file
    if [ -f .env ]; then
        FILE_KEY=$(grep '^APP_KEY=' .env | cut -d'=' -f2- | tr -d '[:space:]')
    fi

    if [ -n "$FILE_KEY" ]; then
        APP_KEY="$FILE_KEY"
    else
        APP_KEY=$(php -r "echo 'base64:'.base64_encode(random_bytes(32));")
        [ -f .env ] && sed -i "s|^APP_KEY=.*|APP_KEY=$APP_KEY|" .env
        echo "[entrypoint] APP_KEY generated and saved to .env"
    fi

    export APP_KEY
fi

exec "$@"
