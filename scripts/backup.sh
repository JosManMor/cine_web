#!/bin/bash
# Respalda la base de datos con mysqldump solo si el disco tiene más del 15% libre.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../backend/.env"
BACKUP_DIR="/var/backups/cine"
LOG_FILE="/var/log/cine_error.log"

# Prefiere variables de entorno (Docker); si no están, lee desde .env
if [ -z "$DB_DATABASE" ] && [ -f "$ENV_FILE" ]; then
    DB_DATABASE=$(grep '^DB_DATABASE=' "$ENV_FILE" | cut -d'=' -f2- | tr -d '"'"'"' ')
    DB_USERNAME=$(grep '^DB_USERNAME=' "$ENV_FILE" | cut -d'=' -f2- | tr -d '"'"'"' ')
    DB_PASSWORD=$(grep '^DB_PASSWORD=' "$ENV_FILE" | cut -d'=' -f2- | tr -d '"'"'"' ')
    DB_HOST=$(grep    '^DB_HOST='     "$ENV_FILE" | cut -d'=' -f2- | tr -d '"'"'"' ')
fi

DB_DATABASE="${DB_DATABASE:-cine_db}"
DB_USERNAME="${DB_USERNAME:-root}"
DB_HOST="${DB_HOST:-127.0.0.1}"

# Comprueba espacio libre en /
FREE=$(df / | awk 'NR==2 {print 100 - $5}' | tr -d '%')

if [ "$FREE" -gt 15 ]; then
    mkdir -p "$BACKUP_DIR"
    BACKUP_FILE="$BACKUP_DIR/cine_backup_$(date +%F_%H%M%S).sql"

    MYSQL_PWD="$DB_PASSWORD" mysqldump \
        -h "$DB_HOST" \
        -u "$DB_USERNAME" \
        "$DB_DATABASE" > "$BACKUP_FILE"

    if [ $? -eq 0 ]; then
        echo "$(date '+%Y-%m-%d %H:%M:%S') [BACKUP] Success: $BACKUP_FILE" >> "$LOG_FILE"
    else
        echo "$(date '+%Y-%m-%d %H:%M:%S') [BACKUP] Error during mysqldump" >> "$LOG_FILE"
        rm -f "$BACKUP_FILE"
    fi
else
    echo "$(date '+%Y-%m-%d %H:%M:%S') [BACKUP] Skipped: disk free ${FREE}% (<= 15%)" >> "$LOG_FILE"
fi
