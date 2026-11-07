#!/usr/bin/env bash
# Despliega en el servidor personal la imagen publicada en Docker Hub usando
# docker-compose.prod.yml. Lo ejecuta el job `deploy` de
# .github/workflows/preprod.yml en el self-hosted runner, desde la raíz del
# checkout del repositorio.
#
# Uso: CINE_IMAGE=usuario/cine-sendera:<sha> DEPLOY_DIR=/opt/cine-sendera scripts/deploy.sh
set -euo pipefail

: "${CINE_IMAGE:?Falta CINE_IMAGE}"
DEPLOY_DIR="${DEPLOY_DIR:-/opt/cine-sendera}"
PROJECT=cine_sendera
COMPOSE=(docker compose -p "$PROJECT" --project-directory "$DEPLOY_DIR" -f "$DEPLOY_DIR/docker-compose.prod.yml")

# .env.prod lo gestiona el administrador del servidor; aquí solo se comprueba
# que exista y sea legible, nunca se crea ni se modifica.
if [ ! -r "$DEPLOY_DIR/.env.prod" ]; then
    echo "[deploy] ERROR: $DEPLOY_DIR/.env.prod no existe o el runner no puede leerlo." >&2
    exit 1
fi

# Mantiene al día la copia del compose de producción y la configuración de
# nginx que monta (ruta relativa ./docker/nginx/prod.conf).
echo "[deploy] Copiando docker-compose.prod.yml y nginx/prod.conf a $DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR/docker/nginx"
install -m 644 docker-compose.prod.yml "$DEPLOY_DIR/docker-compose.prod.yml"
install -m 644 docker/nginx/prod.conf "$DEPLOY_DIR/docker/nginx/prod.conf"

export CINE_IMAGE
echo "[deploy] Descargando $CINE_IMAGE"
docker pull --quiet "$CINE_IMAGE"

# app_www contiene el código de la imagen anterior: se elimina para que se
# repueble desde la nueva. mysql_prod_data NO se toca.
echo "[deploy] Deteniendo servicios y recreando el volumen de la app"
"${COMPOSE[@]}" down --remove-orphans
docker volume rm -f "${PROJECT}_app_www" >/dev/null

echo "[deploy] Levantando servicios"
"${COMPOSE[@]}" up -d --no-build --wait --wait-timeout 300

echo "[deploy] Verificando salud"
curl -fsS --retry 5 --retry-delay 3 http://127.0.0.1/nginx-health >/dev/null
curl -fsS --retry 5 --retry-delay 3 http://127.0.0.1/up >/dev/null

echo "[deploy] Limpiando imágenes antiguas"
docker image prune -f >/dev/null

echo "[deploy] Despliegue completado: $CINE_IMAGE"
