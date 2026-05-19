#!/bin/bash
# Crea usuarios Linux en masa para el personal del cine.
# Uso: ./staff_creator.sh [archivo_usuarios.csv]
#
# Formato del CSV (sin cabecera):
#   username,password,grupo
#   vendedor1,Pass123!,ventas
#
# Si no se pasa archivo, usa la lista interna de ejemplo.

LOG_FILE="/var/log/cine_error.log"
DEFAULT_GROUP="cine_staff"

create_user() {
    local username="$1"
    local password="$2"
    local group="${3:-$DEFAULT_GROUP}"

    # Crea el grupo si no existe
    if ! getent group "$group" > /dev/null 2>&1; then
        groupadd "$group"
    fi

    # Omite si el usuario ya existe
    if id "$username" > /dev/null 2>&1; then
        echo "$(date '+%Y-%m-%d %H:%M:%S') [STAFF] Skipped (already exists): $username" >> "$LOG_FILE"
        return
    fi

    useradd -m -d "/home/$username" -g "$group" -s /bin/bash "$username"
    echo "$username:$password" | chpasswd
    passwd --expire "$username"   # obliga a cambiar la contraseña en el primer login

    echo "$(date '+%Y-%m-%d %H:%M:%S') [STAFF] Created: $username (group: $group)" >> "$LOG_FILE"
    echo "  Usuario creado: $username"
}

# ── Fuente de datos ──────────────────────────────────────────────────────────

if [ -n "$1" ] && [ -f "$1" ]; then
    echo "Leyendo usuarios desde: $1"
    while IFS=',' read -r username password group; do
        [[ "$username" =~ ^#.*$ || -z "$username" ]] && continue
        create_user "$username" "$password" "$group"
    done < "$1"
else
    echo "Usando lista de usuarios por defecto..."
    # username | password | grupo
    USERS=(
        "vendedor1:TempPass1!:ventas"
        "vendedor2:TempPass2!:ventas"
        "tecnico1:TempPass3!:soporte"
        "cajero1:TempPass4!:ventas"
        "supervisor1:TempPass5!:admin_cine"
    )

    for entry in "${USERS[@]}"; do
        IFS=':' read -r username password group <<< "$entry"
        create_user "$username" "$password" "$group"
    done
fi

echo "Proceso completado. Ver log en $LOG_FILE"
