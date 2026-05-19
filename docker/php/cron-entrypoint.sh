#!/bin/sh
set -e

# Exporta las variables de entorno actuales a un archivo que cron puede sourcer,
# ya que los procesos cron no heredan el entorno del contenedor.
printenv | sed "s/'/'\\\\''/g; s/=\(.*\)/='\1'/" > /etc/cron_env

# Registra el job de backup
cat > /etc/cron.d/cine-backup << 'EOF'
0 2 * * * root . /etc/cron_env; /usr/local/scripts/backup.sh >> /proc/1/fd/1 2>&1
EOF
chmod 0644 /etc/cron.d/cine-backup

echo "[cron] Backup job registrado (diario a las 02:00)."
exec cron -f
