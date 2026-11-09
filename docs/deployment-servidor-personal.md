# Deployment — Servidor personal (preproducción)

Cada merge (push) a la rama `pre` dispara `.github/workflows/preprod.yml`:

0. **`release`** (GitHub-hosted): ejecuta semantic-release, que calcula la versión, crea el
   tag `vX.Y.Z` y el GitHub Release (ver [Versionado](#versionado)).
1. **`push-prod`** (GitHub-hosted): construye `docker/php/Dockerfile.prod` y publica en Docker Hub
   `<usuario>/cine-sendera:staging`, `<usuario>/cine-sendera:<sha>` y, si hubo versión nueva,
   `<usuario>/cine-sendera:vX.Y.Z`.
2. **`deploy`** (self-hosted runner en el servidor): ejecuta `scripts/deploy.sh`, que copia
   `docker-compose.prod.yml` al servidor y lo levanta con la imagen `:<sha>` recién publicada.

El servidor usa **el mismo `docker-compose.prod.yml` del repositorio**: en `app` y `queue` la
imagen es `${CINE_IMAGE:-cine-sendera:prod}`. El deploy define `CINE_IMAGE` con la imagen de
Docker Hub y levanta con `--no-build`; en local, sin `CINE_IMAGE`, se sigue construyendo
`cine-sendera:prod` como siempre. Cualquier cambio al compose que llegue a `pre` se copia al
servidor en el siguiente despliegue.

Se despliega el tag `:<sha>` (no `:staging`) para que cada despliegue sea reproducible y se
sepa exactamente qué commit está corriendo.

## Versionado

El proyecto se versiona **solo al hacer merge en `pre`** (no existe `main`), con
[SemVer](https://semver.org/lang/es/) y [semantic-release](https://semantic-release.org/)
(configuración en `.releaserc.json`). Nadie elige la versión a mano: se deduce de los
mensajes de commit ([Conventional Commits](https://www.conventionalcommits.org/es/))
desde el último tag.

| Commit | Efecto | Ejemplo |
|---|---|---|
| `fix: …` / `perf: …` | PARCHE (`1.2.0` → `1.2.1`) | `fix(docker): corregir healthcheck` |
| `feat: …` | MENOR (`1.2.0` → `1.3.0`) | `feat(ui): rediseño de la cartelera` |
| `feat!: …` o `BREAKING CHANGE:` en el cuerpo | MAYOR (`1.2.0` → `2.0.0`) | `feat(api)!: renombrar /purchases` |
| `docs`, `chore`, `ci`, `refactor`, `test`, `style`, `build` | ninguno | `docs: actualizar README` |

Si un merge a `pre` no contiene ningún commit que versione, no se crea tag ni release; el
despliegue se hace igual. Los commits `Merge pull request …` se ignoran, así que lo que
cuenta son los mensajes de los commits de cada rama.

Resultado de cada versión:

- Tag de git `vX.Y.Z` sobre el commit desplegado.
- GitHub Release con las notas generadas a partir de los commits.
- Imagen `<usuario>/cine-sendera:vX.Y.Z` (misma imagen que `:<sha>`).

La primera ejecución analiza todo el historial y publica `v1.0.0`.

## Requisitos del servidor

- Linux con Docker Engine y el plugin `docker compose` v2.20+ (usa `up --wait`).
- `curl` instalado.
- Puerto 80 libre y accesible.
- Un usuario dedicado (p. ej. `github-runner`) que pertenezca al grupo `docker`.

## Configuración inicial (una sola vez)

### 1. Instalar el self-hosted runner

En GitHub: *Settings → Actions → Runners → New self-hosted runner* (Linux) y seguir los
comandos que muestra, ejecutándolos como el usuario dedicado. Al configurarlo, añadir la
etiqueta `cine-deploy`:

```bash
./config.sh --url https://github.com/JosManMor/cine_web --token <TOKEN> --labels cine-deploy
sudo ./svc.sh install github-runner
sudo ./svc.sh start
```

### 2. Directorio de despliegue y `.env.prod`

`.env.prod` lo crea y mantiene **solo el administrador** del servidor (partiendo de
`.env.prod.example`). El pipeline nunca lo genera ni lo modifica: únicamente lo lee.

Permisos recomendados (`admin` = tu usuario, `github-runner` = usuario del runner):

```bash
sudo mkdir -p /opt/cine-sendera
sudo chown admin:github-runner /opt/cine-sendera
# rwx dueño y grupo; sticky bit: el runner crea sus archivos
# (docker-compose.prod.yml, docker/) pero no borra ni reemplaza los del admin
sudo chmod 1770 /opt/cine-sendera

sudo chown admin:github-runner /opt/cine-sendera/.env.prod
# admin lee/escribe, el runner solo lee, el resto nada
sudo chmod 640 /opt/cine-sendera/.env.prod
```

| Ruta | Dueño:grupo | Modo |
|---|---|---|
| `/opt/cine-sendera/` | `admin:github-runner` | `1770` |
| `/opt/cine-sendera/.env.prod` | `admin:github-runner` | `640` |
| `docker-compose.prod.yml`, `docker/nginx/prod.conf` | `github-runner` (los copia el deploy) | `644` |

> El usuario del runner pertenece al grupo `docker`, que equivale a root: estos permisos
> evitan modificaciones accidentales del pipeline, no protegen frente a un runner
> comprometido.

En `.env.prod` hay que ajustar al menos: contraseñas de MySQL, `APP_KEY` fija (si no, se
genera una temporal en cada arranque e invalida sesiones) y `APP_URL` / `FRONTEND_URL`.
Para obtener una clave:

```bash
docker run --rm --entrypoint php <usuario>/cine-sendera:staging artisan key:generate --show
```

Para usar otra ruta, definir la variable de repositorio `DEPLOY_DIR`
(*Settings → Secrets and variables → Actions → Variables*).

### 3. Secrets y environment en GitHub

| Nombre | Tipo | Uso |
|---|---|---|
| `DOCKERHUB_USERNAME` | secret | ya existente |
| `DOCKERHUB_TOKEN` | secret | ya existente |
| `DEPLOY_DIR` | variable (opcional) | ruta en el servidor, por defecto `/opt/cine-sendera` |

El job usa el environment `preprod`; GitHub lo crea automáticamente. Opcionalmente se
pueden añadir *required reviewers* para aprobar cada despliegue a mano.

### Seguridad del runner

- Si el repositorio es público, en *Settings → Actions → General* activar
  **"Require approval for all outside collaborators"** para que PRs de forks no puedan
  ejecutar código en el servidor. Solo el job `deploy` (push a `pre`) usa este runner.
- El usuario del runner tiene acceso a Docker, que equivale a root: no usar el runner
  para nada más.

## Qué hace `scripts/deploy.sh`

1. Verifica que `$DEPLOY_DIR/.env.prod` exista y sea legible (no lo crea ni lo modifica).
2. Copia `docker-compose.prod.yml` y `docker/nginx/prod.conf` a `$DEPLOY_DIR`
   (mantiene el compose del servidor al día con el de `pre`).
3. `docker pull` de la imagen `:<sha>`.
4. `down` + elimina el volumen `cine_sendera_app_www` (contiene el código de la imagen
   anterior). **`mysql_prod_data` no se elimina**: los datos persisten.
5. `up -d --no-build --wait`: espera a que todos los servicios estén *healthy* (migraciones
   y seeders corren en el entrypoint de la app).
6. Comprueba `/nginx-health` y `/up`; si fallan, el job falla.
7. Elimina imágenes huérfanas.

## Reinicio diario de la demo

Pre es una simulación: cada día a las 00:05 (hora de `DEMO_TIMEZONE`, por defecto
`America/Mexico_City`) el contenedor `scheduler` ejecuta `php artisan demo:reset`, que:

1. Vacía `purchase_seats`, `purchases` y `users`, junto con `personal_access_tokens`,
   `sessions` y `password_reset_tokens`.
2. Devuelve a `open` las funciones `sold_out`.
3. Ejecuta los seeders, que recrean el administrador con `ADMIN_EMAIL` / `ADMIN_PASSWORD`
   de `.env.prod` (sin ellas la demo se queda sin admin).
4. Mueve cada función ya pasada a un día aleatorio entre mañana y dentro de 7 días,
   conservando la hora y evitando, si es posible, solapes en la misma sala.

Películas, salas y funciones se conservan. El comando solo actúa con `DEMO_MODE=true`
en `.env.prod`; sin esa variable el scheduler no lo programa y una ejecución manual
termina con error sin borrar nada.

Ejecución manual:

```bash
docker exec cine_scheduler php artisan demo:reset
docker exec cine_scheduler php artisan schedule:list
```

## Operación manual

```bash
cd /opt/cine-sendera
docker compose -p cine_sendera -f docker-compose.prod.yml ps
docker compose -p cine_sendera -f docker-compose.prod.yml logs -f app
```

> Si se ejecuta `up` a mano, exportar antes `CINE_IMAGE` con el tag desplegado; sin ella
> compose buscaría la imagen local `cine-sendera:prod`.

Rollback a un commit anterior (su imagen `:<sha>` sigue en Docker Hub), desde un checkout
del repo en el servidor:

```bash
CINE_IMAGE=<usuario>/cine-sendera:<sha-anterior> DEPLOY_DIR=/opt/cine-sendera scripts/deploy.sh
```

> Las migraciones no se revierten automáticamente en un rollback.
