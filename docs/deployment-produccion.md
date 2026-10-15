# Deployment — Simulación de Producción

Este documento describe cómo levantar y mantener el entorno de producción simulado de Cine Sendera usando `docker-compose.prod.yml`.

---

## Diferencias con el entorno de desarrollo

| Aspecto              | Desarrollo (`docker-compose.yml`)               | Producción (`docker-compose.prod.yml`)               |
| -------------------- | ----------------------------------------------- | ---------------------------------------------------- |
| Archivo de entorno   | `.env` (raíz)                                   | `.env.prod` (raíz)                                   |
| Código fuente        | Bind-mount (`./backend`)                        | Baked en la imagen, servido desde el volumen `app_www` |
| Frontend             | Servicio `frontend` (Vite `:5173`)              | Build estático en `public/build/`                    |
| PHP vendor           | Montado desde host (`composer install` manual)  | Instalado sin `--dev` en la imagen                   |
| Base de datos        | Expuesta en el host (`FORWARD_DB_PORT`)         | Solo accesible en `db_net`                           |
| Redis                | Servicio `redis` (`CACHE_STORE=redis`)          | No incluido (`CACHE_STORE=database`)                 |
| phpMyAdmin           | Incluido                                        | Excluido                                             |
| Mailpit              | Excluido                                        | Incluido (captura emails en :8025)                   |
| Servidor web         | Apache (httpd:2.4)                              | Nginx (nginx:1.27-alpine)                            |
| Redes                | 2 (frontend_net/backend_net)                    | 3 DMZ (public_net/app_net/db_net)                    |
| Queue worker         | No incluido                                     | Contenedor `queue` dedicado                          |
| Scheduler            | No incluido                                     | Contenedor `scheduler` dedicado                      |
| Backups (cron)       | No incluido                                     | Contenedor `cron` (`backup.sh` a las 02:00)          |
| OPcache              | Desactivado (`docker/php/php-dev.ini`)          | Activado y optimizado                                |
| Usuario app          | `www-data` con UID/GID del host                 | `root` (sin `USER`); los workers de PHP-FPM usan `www-data` |
| Variables UID/GID    | Requeridas (`HOST_UID`/`HOST_GID` en `.env`)    | No aplican                                           |
| Límites de recursos  | No                                              | `deploy.resources.limits` por servicio               |

---

## Requisitos previos

- Docker Engine ≥ 24 y Docker Compose v2
- Acceso al repositorio

---

## Primer despliegue

### 1. Crear `.env.prod`

```bash
cp .env.prod.example .env.prod
```

Editar `.env.prod` y ajustar obligatoriamente:

| Variable              | Descripción                                                          |
| --------------------- | -------------------------------------------------------------------- |
| `APP_KEY`             | Dejar vacío; el contenedor lo genera al primer arranque (ver paso 4) |
| `APP_URL`             | URL pública del servidor (ej. `http://192.168.1.10`)                 |
| `DB_PASSWORD`         | Contraseña segura para el usuario de la BD                           |
| `MYSQL_PASSWORD`      | Debe coincidir con `DB_PASSWORD`                                     |
| `MYSQL_ROOT_PASSWORD` | Contraseña root de MySQL                                             |
| `MAIL_*`              | Preconfigurado para Mailpit (no editar)                              |
| `VITE_DEMO_MODE=true` | Banner de demo en el frontend                                        |

> **Importante:** `env_file` en Docker Compose **no soporta comentarios en línea**.  
> Todos los comentarios deben ir en su propia línea (`# comentario`), nunca al final de una línea con valor.

### 2. Construir las imágenes y levantar los servicios

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Esto ejecuta un build multi-etapa:

- **Stage 1** — Instala dependencias PHP sin `--dev`
- **Stage 2** — Compila el frontend React con Vite (incluye `VITE_DEMO_MODE=true` en el bundle)
- **Stage 3** — Imagen final PHP-FPM con el código y los assets listos

Al arrancar, el contenedor `app` ejecuta automáticamente:

1. `php artisan migrate --force`
2. `php artisan db:seed --force` (idempotente, usa `firstOrCreate`)
3. `php artisan config:cache / route:cache / view:cache`

### 3. Verificar que todos los servicios están en pie

```bash
docker compose -f docker-compose.prod.yml ps
```

`app` y `nginx` deben mostrar `healthy`; `mysql` también. `queue`, `scheduler` y `cron` no tienen healthcheck y deben mostrar `Up`.

### 4. Fijar `APP_KEY` de forma permanente

Si `APP_KEY` estaba vacío, el entrypoint generó una clave temporal. Hay que persistirla para que las sesiones no se invaliden al reiniciar:

```bash
# Obtener la clave generada
docker logs cine_app 2>&1 | grep "APP_KEY=base64"

# Pegar la línea completa en .env.prod
# APP_KEY=base64:XXXXXXXXX...=

# Recrear los contenedores para que lean el nuevo .env.prod
# (`restart` NO recarga env_file; hace falta `up -d`, que recrea los servicios cuyo entorno cambió)
docker compose -f docker-compose.prod.yml up -d
```

> Alternativa: generar la clave antes del primer arranque con `docker compose -f docker-compose.prod.yml run --rm --no-deps --entrypoint php app artisan key:generate --show` y pegarla en `.env.prod`.

---

## Actualizar código o frontend

```bash
# 1. Bajar los servicios (NO eliminar el volumen mysql_prod_data)
docker compose -f docker-compose.prod.yml down

# 2. Eliminar el volumen de la app para que se regenere desde la nueva imagen
docker volume rm cine_sendera_app_www

# 3. Rebuildar y levantar
docker compose -f docker-compose.prod.yml up -d --build
```

> El volumen `mysql_prod_data` **nunca** debe eliminarse en actualizaciones; contiene los datos de la BD.

---

## Comandos útiles de operación

```bash
# Ver logs en tiempo real de todos los servicios
docker compose -f docker-compose.prod.yml logs -f

# Ver solo logs de la app PHP
docker logs cine_app -f

# Ver errores de Laravel
docker exec cine_app tail -f /var/www/storage/logs/laravel.log

# Correr un comando artisan puntual
docker exec cine_app php artisan <comando>

# Ver emails capturados por Mailpit
# Abrir en el navegador: http://localhost:8025

# Bajar todo sin borrar volúmenes
docker compose -f docker-compose.prod.yml down

# Bajar todo y borrar volúmenes (¡borra la BD!)
docker compose -f docker-compose.prod.yml down -v
```

---

## Arquitectura de contenedores

```
  Browser
     │ :80 (public_net)
     ▼
 ┌─────────────────────────┐
 │  nginx (nginx:1.27)     │  public_net + app_net
 │  app_www:/var/www (ro)  │
 └────────────┬────────────┘
              │ fcgi → app:9000 (app_net)
              ▼
 ┌─────────────────────────┐
 │  app  (php-fpm 8.3)     │  app_net + db_net
 │  app_www:/var/www (rw)  │
 └────────────┬────────────┘
              │ (db_net)
     ┌────────┼────────────┐
     ▼        ▼            ▼
 [mysql]   [mailpit]   [queue/cron/scheduler]
 :3306     :1025 SMTP
           :8025 UI (expuesto al host)
```

Los servicios `queue`, `scheduler` y `cron` reutilizan la imagen `cine-sendera:prod`. `queue` y `scheduler` comparten el volumen `app_www` con `app`; `cron` no lo monta y guarda los dumps en el volumen `cine_backups`. Solo `nginx` está en `public_net` (además de `app_net`); el resto vive únicamente en `db_net` o en `app_net` + `db_net`.

---

## Solución de problemas frecuentes

| Síntoma                                 | Causa probable                            | Solución                                               |
| --------------------------------------- | ----------------------------------------- | ------------------------------------------------------ |
| `500` en todas las rutas                | `APP_KEY` vacío o con texto de comentario | Ver paso 4 del primer despliegue                       |
| Cambios en `.env.prod` no se aplican    | Se usó `restart` en lugar de `up -d`      | `docker compose -f docker-compose.prod.yml up -d`      |
| `Table 'sessions' not found`            | Migración de sesiones no ejecutada        | Rebuild completo                                       |
| `502 Bad Gateway`                       | Nginx no alcanza PHP-FPM                  | Verificar que `app` está healthy y en `app_net`        |
| `550 Sending from domain not allowed`   | Dominio SMTP no verificado                | Usar `MAIL_MAILER=log` o verificar config de Mailpit   |
| `validation.unique` en lugar de mensaje | Sin archivos `lang/es/`                   | Rebuild para incluir traducciones                      |
