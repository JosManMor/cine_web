#!/bin/sh
set -e

cd /var/www

# El bloque de setup solo corre cuando el contenedor levanta php-fpm.
# Los workers (queue, scheduler) arrancan directamente sin repetir migraciones.
if [ "$1" = "php-fpm" ]; then
    # Una APP_KEY válida empieza con "base64:". Si está vacía o tiene otro valor
    # (p.ej. el texto del comentario de .env.prod.example) se genera una nueva.
    # En producción real, fija APP_KEY en .env.prod para persistirla entre reinicios.
    case "$APP_KEY" in
        base64:*)
            echo "[prod] APP_KEY configurada."
            ;;
        *)
            echo "[prod] AVISO: APP_KEY inválida o vacía — generando clave temporal."
            echo "[prod] Copia la siguiente línea a .env.prod para persistirla:"
            GENERATED_KEY=$(php artisan key:generate --show --no-interaction)
            echo "[prod] APP_KEY=${GENERATED_KEY}"
            export APP_KEY="${GENERATED_KEY}"
            ;;
    esac

    echo "[prod] Ejecutando migraciones..."
    php artisan migrate --force

    echo "[prod] Cacheando configuración, rutas y vistas..."
    php artisan config:cache
    php artisan route:cache
    php artisan view:cache

    echo "[prod] Listo."
fi

exec "$@"
