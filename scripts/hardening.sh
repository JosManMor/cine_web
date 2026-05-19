#!/bin/bash
# Hardening Capa 3 — Servidor Linux (Ubuntu)
# Configura UFW, endurece SSH y establece políticas de acceso perimetral.
# Uso: sudo bash scripts/hardening.sh

set -e
export DEBIAN_FRONTEND=noninteractive

LOG_FILE="/var/log/cine_error.log"
SSH_PORT=2222
SSHD_CONFIG="/etc/ssh/sshd_config"

# ── Verificar root ────────────────────────────────────────────────────────────
if [ "$(id -u)" -ne 0 ]; then
    echo "Este script debe ejecutarse como root: sudo bash $0"
    exit 1
fi

log() { echo "$(date '+%Y-%m-%d %H:%M:%S') [HARDENING] $*" | tee -a "$LOG_FILE"; }

log "Iniciando hardening del servidor..."

# ── 1. Reparar openssh-server ANTES de cualquier apt ─────────────────────────
# apt-get upgrade activa el configure de openssh-server. Si sshd_config es un
# directorio (estado corrupto), el configure falla y bloquea todo lo demás.
# Se repara primero para que apt pueda correr sin errores.
if [ -d "$SSHD_CONFIG" ]; then
    log "AVISO: $SSHD_CONFIG es un directorio — reparando antes de apt..."

    BACKUP_DIR="/etc/ssh/sshd_config_dir_bak_$(date +%F_%H%M%S)"
    mv "$SSHD_CONFIG" "$BACKUP_DIR"
    log "Directorio respaldado en: $BACKUP_DIR"

    # ucf (Update Configuration File) rastrea sshd_config con estado
    # "eliminado por admin". Limpiar su hashfile directamente es más
    # fiable que ucf --purge cuando el estado está muy corrupto.
    UCF_HASH="/var/lib/ucf/hashfile"
    if [ -f "$UCF_HASH" ]; then
        cp "$UCF_HASH" "${UCF_HASH}.bak.$(date +%F)"
        sed -i '\|/etc/ssh/sshd_config|d' "$UCF_HASH"
        log "Entrada sshd_config eliminada del hashfile de ucf."
    fi
    rm -f "/var/lib/ucf/cache/etc/ssh/sshd_config"

    # Ahora dpkg puede instalar el archivo por defecto sin obstáculos
    dpkg --configure -a
    log "openssh-server configurado correctamente."
fi

# ── 2. Actualizar paquetes ────────────────────────────────────────────────────
log "Actualizando paquetes del sistema..."
apt-get update -qq && apt-get upgrade -y -qq

# ── 3. Instalar UFW si no está presente ──────────────────────────────────────
if ! command -v ufw > /dev/null 2>&1; then
    log "Instalando UFW..."
    apt-get install -y ufw
fi

# ── 4. Configurar firewall UFW ────────────────────────────────────────────────
log "Configurando UFW..."

ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 80/tcp         comment 'HTTP — Cine Sendera'
ufw allow "$SSH_PORT"/tcp comment 'SSH personalizado'
ufw limit "$SSH_PORT"/tcp

ufw --force enable
log "UFW activo. Estado:"
ufw status verbose | tee -a "$LOG_FILE"

# ── 5. Endurecer SSH ──────────────────────────────────────────────────────────
log "Configurando SSH en puerto $SSH_PORT..."

if ! command -v sshd > /dev/null 2>&1; then
    log "openssh-server no encontrado — instalando..."
    apt-get install -y openssh-server
fi

if [ ! -f "$SSHD_CONFIG" ]; then
    log "ERROR: $SSHD_CONFIG no existe tras la reparación."
    exit 1
fi

cp "$SSHD_CONFIG" "${SSHD_CONFIG}.bak.$(date +%F)"
log "Backup creado: ${SSHD_CONFIG}.bak.$(date +%F)"

set_sshd() {
    local key="$1" value="$2"
    if grep -qE "^#?${key}" "$SSHD_CONFIG" 2>/dev/null; then
        sed -i "s|^#\?${key}.*|${key} ${value}|" "$SSHD_CONFIG"
    else
        echo "${key} ${value}" >> "$SSHD_CONFIG"
    fi
}

set_sshd "Port"                   "$SSH_PORT"
set_sshd "PermitRootLogin"        "no"
set_sshd "PasswordAuthentication" "yes"
set_sshd "MaxAuthTries"           "4"
set_sshd "LoginGraceTime"         "30"
set_sshd "X11Forwarding"          "no"
set_sshd "AllowTcpForwarding"     "no"

log "Reiniciando servicio SSH..."
# Ubuntu nombra la unidad "ssh", no "sshd"
SSH_SVC=$(systemctl list-units --type=service --plain --no-legend | grep -oE 'ssh(d)?\.service' | head -1 | sed 's/\.service//')
systemctl restart "${SSH_SVC:-ssh}"

# ── 6. Deshabilitar servicios innecesarios ────────────────────────────────────
for svc in avahi-daemon cups bluetooth; do
    if systemctl is-enabled "$svc" > /dev/null 2>&1; then
        systemctl disable --now "$svc"
        log "Servicio deshabilitado: $svc"
    fi
done

# ── 7. Resumen ────────────────────────────────────────────────────────────────
log "Hardening completado."
echo ""
echo "========================================"
echo " Hardening Cine Sendera — Resumen"
echo "========================================"
echo " Firewall : UFW activo"
echo "   - Puerto 80/tcp   : HTTP (abierto)"
echo "   - Puerto 2222/tcp : SSH  (abierto + rate-limit)"
echo "   - Todo lo demás   : denegado"
echo ""
echo " SSH      : puerto $SSH_PORT"
echo "   - PermitRootLogin       : no"
echo "   - MaxAuthTries          : 4"
echo "   - LoginGraceTime        : 30s"
echo ""
echo " IMPORTANTE: reconecta SSH usando el puerto $SSH_PORT"
echo "   ssh -p $SSH_PORT usuario@servidor"
echo "========================================"
