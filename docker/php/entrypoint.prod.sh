#!/bin/sh
set -e

cd /var/www

# El bloque de setup solo corre cuando el contenedor levanta php-fpm.
# Los workers (queue, scheduler) arrancan directamente sin repetir migraciones.
if [ "$1" = "php-fpm" ]; then
    # Si APP_KEY está vacía, generarla y exportarla para que config:cache la capture.
    # En producción real, fija APP_KEY en .env.prod antes de arrancar.
    if [ -z "$APP_KEY" ]; then
        echo "[prod] AVISO: APP_KEY no configurada — generando clave temporal."
        echo "[prod] Para persistirla entre reinicios, copia la siguiente línea a .env.prod:"
        GENERATED_KEY=$(php artisan key:generate --show --no-interaction)
        echo "[prod] APP_KEY=${GENERATED_KEY}"
        export APP_KEY="${GENERATED_KEY}"
    fi

    echo "[prod] Ejecutando migraciones..."
    php artisan migrate --force

    echo "[prod] Cacheando configuración, rutas y vistas..."
    php artisan config:cache
    php artisan route:cache
    php artisan view:cache

    echo "[prod] Listo."
fi

exec "$@"
