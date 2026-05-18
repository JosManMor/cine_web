#!/bin/sh
set -e

cd /var/www

# El bloque de setup solo corre cuando el contenedor levanta php-fpm.
# Los workers (queue, scheduler) arrancan directamente sin repetir migraciones.
if [ "$1" = "php-fpm" ]; then
    echo "[prod] Ejecutando migraciones..."
    php artisan migrate --force

    echo "[prod] Cacheando configuración, rutas y vistas..."
    php artisan config:cache
    php artisan route:cache
    php artisan view:cache

    echo "[prod] Listo."
fi

exec "$@"
