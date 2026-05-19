#!/bin/bash
# Monitorea apache2 y mysql; los reinicia si están caídos y registra el incidente.

LOG_FILE="/var/log/cine_error.log"
SERVICES=("apache2" "mysql")

for service in "${SERVICES[@]}"; do
    if ! systemctl is-active --quiet "$service"; then
        systemctl restart "$service"

        if systemctl is-active --quiet "$service"; then
            echo "$(date '+%Y-%m-%d %H:%M:%S') [RECOVERY] $service restarted successfully" >> "$LOG_FILE"
        else
            echo "$(date '+%Y-%m-%d %H:%M:%S') [ERROR] $service failed to restart" >> "$LOG_FILE"
        fi
    fi
done
