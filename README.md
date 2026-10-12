# Cine Sendera — Sistema de Gestión de Cine

Sistema web integral para la gestión de cartelera, venta de boletos y administración de un cine, desarrollado bajo la arquitectura LAMP (Linux, Apache, MySQL, PHP/Laravel).

---

## 0. Estándares del Proyecto

- **Código (Backend & Frontend):** Inglés (nombres de variables, funciones, clases, comentarios técnicos).
- **Base de Datos:** Inglés (nombres de tablas, columnas, índices).
- **Frontend (UI/UX):** Inglés para la estructura técnica; el **contenido visible** para el usuario final en **Español**.
- **Documentación:** Español.

---

## 1. Documentación

La documentación detallada se encuentra en `/docs`:

- [Arquitectura del Backend](./docs/backend-architecture.md)
- [Sistema de Diseño Frontend](./docs/frontend-design-system.md)
- [Entorno de Desarrollo y Orquestación Docker](./docs/docker-entorno-desarrollo.md)
- [Deployment — Simulación de Producción](./docs/deployment-produccion.md)
- [Examen Teórico y Memoria Técnica de Implementación](./docs/examen-teorico-resumen-implementacion.md)

---

## 2. Tecnologías Principales

- **Backend:** Laravel ^13.8 (PHP 8.3+)
- **Base de Datos:** MySQL 8
- **Frontend:** React 18 + Vite
- **Servidor:** Apache2
- **Automatización:** Scripts en Bash
- **Contenedores:** Docker + Docker Compose

---

## 3. Requisitos del Sistema

- Docker y Docker Compose
- PHP 8.3+ (solo si se ejecuta fuera de Docker)
- Composer (solo si se ejecuta fuera de Docker)
- Node.js & NPM (solo si se ejecuta fuera de Docker)

---

## 4. Instalación Rápida (Desarrollo)

```bash
# 1. Copiar las variables de entorno (el .env vive en la RAÍZ del proyecto)
cp .env.example .env
#    Ajustar HOST_UID / HOST_GID en .env con los valores de `id -u` e `id -g`

# 2. Instalar dependencias PHP (backend/vendor no se versiona y el entrypoint no arranca sin él)
docker compose run --rm --no-deps --entrypoint sh app -c "composer install"

# 3. Generar la APP_KEY y pegarla en .env como APP_KEY=base64:...
docker compose run --rm --no-deps --entrypoint php app artisan key:generate --show

# 4. Levantar todos los servicios (incluye el frontend Vite con hot-reload)
docker compose up -d
```

> **Nota sobre variables de entorno:** Los servicios `app` y `mysql` leen el `.env` de la raíz (`env_file: .env` e interpolación de Compose). No existe `backend/.env` en Docker. Los comentarios en `.env` deben ir en su propia línea (`# comentario`), nunca al final de una línea con valor.

> **Sobre la `APP_KEY`:** si se deja vacía, el entrypoint genera una clave **temporal** en memoria y la imprime en `docker compose logs app`. Esa clave cambia en cada reinicio del contenedor e invalida sesiones y cookies cifradas, por eso el paso 3 es necesario. Tras editar `.env` hay que **recrear** el contenedor (`docker compose up -d app`); `docker compose restart` no recarga `env_file`.

El entrypoint ejecuta automáticamente migraciones y seeders al arrancar. Los servicios inician en orden estricto mediante `depends_on` con condiciones `service_healthy`. El frontend corre dentro del contenedor `cine_frontend` (`npm ci && npm run dev`), así que no hace falta Node en el host.  
Accesos disponibles:

| Servicio     | URL / Puerto                                                                    |
| ------------ | ------------------------------------------------------------------------------- |
| App (API)    | http://localhost                                                                |
| Frontend dev | http://localhost:5173                                                           |
| phpMyAdmin   | http://localhost:`FORWARD_PMA_PORT` (`8081` con `.env.example`; `8080` si no se define) |
| MySQL (host) | `localhost:FORWARD_DB_PORT` (`3308` con `.env.example`; `3306` si no se define) |
| Mailpit      | http://localhost:8025 (SMTP en `:1025`)                                         |

---

## 5. Arquitectura de Contenedores

El proyecto usa múltiples contenedores siguiendo el principio de **un proceso por contenedor**, lo que permite escalar, reiniciar y depurar cada responsabilidad de forma independiente.

### Desarrollo (`docker-compose.yml`)

| Contenedor        | Imagen                        | Redes                         | Responsabilidad                                         | Healthcheck                               |
| ----------------- | ----------------------------- | ----------------------------- | ------------------------------------------------------- | ----------------------------------------- |
| `cine_redis`      | redis:7-alpine                | `backend_net`                 | Caché en memoria; persiste con volumen `redis_data`     | `redis-cli ping`                          |
| `cine_mysql`      | mysql:8.0                     | `backend_net`                 | Base de datos; persiste datos con volumen `mysql_data`  | `mysqladmin ping`                         |
| `cine_app`        | PHP-FPM 8.3 (build local)     | `frontend_net`, `backend_net` | Ejecuta Laravel; procesa peticiones PHP                 | Socket `:9000` (tras migraciones/seeders) |
| `cine_apache`     | httpd:2.4                     | `frontend_net`                | Servidor web; recibe HTTP y reenvía a PHP-FPM           | HTTP GET `/up` vía `/dev/tcp`             |
| `cine_phpmyadmin` | phpmyadmin/phpmyadmin:5.2.3   | `backend_net`                 | GUI de base de datos; espera a que MySQL esté _healthy_ | -                                         |
| `cine_mailpit`    | axllent/mailpit:v1.31.4       | `backend_net`                 | Captura correos salientes; solo en desarrollo           | Healthcheck propio de la imagen           |
| `cine_frontend`   | node:20-alpine                | `frontend_net`                | Servidor de desarrollo Vite con hot-reload para React   | -                                         |

> **Redes:** `frontend_net` conecta `frontend` ↔ `apache` ↔ `app`; `backend_net` conecta `app` ↔ `mysql`/`redis`/`mailpit` y `phpmyadmin` ↔ `mysql`. `app` es el único servicio en ambas redes, de modo que ni Apache ni el frontend alcanzan la base de datos.

> **Control del orden de arranque (`depends_on` + `healthcheck`):**  
> `app` espera a que `mysql` y `redis` estén en estado `healthy`. `apache` espera a que `app` esté en estado `healthy` (evitando errores `502 Bad Gateway` durante el arranque). `phpmyadmin` espera a que `mysql` esté `healthy`. `frontend` espera a que `apache` esté `healthy`.

> **¿Por qué Apache y PHP-FPM separados?**  
> PHP-FPM gestiona procesos PHP de forma eficiente (pool de workers) mientras Apache sirve archivos estáticos directamente sin pasar por PHP. Esta separación refleja el stack LAMP real de producción.

### Producción (`docker-compose.prod.yml`)

| Contenedor       | Imagen            | Responsabilidad                                    |
| ---------------- | ----------------- | -------------------------------------------------- |
| `cine_app`       | cine-sendera:prod | PHP-FPM; también ejecuta setup inicial al arrancar |
| `cine_apache`    | httpd:2.4         | Servidor web en puerto 80                          |
| `cine_mysql`     | mysql:8.0         | Base de datos (sin puerto expuesto al host)        |
| `cine_queue`     | cine-sendera:prod | Worker de colas Laravel (`queue:work`)             |
| `cine_scheduler` | cine-sendera:prod | Scheduler Laravel (`schedule:run` cada 60 s)       |
| `cine_cron`      | cine-sendera:prod | Cron del sistema; ejecuta `backup.sh` a las 02:00  |

> En producción no hay phpMyAdmin ni Mailpit. El `watchdog.sh` tampoco aplica porque `restart: always` en cada contenedor cumple esa función.

---

## 6. Scripts de Automatización

Los scripts viven en [`/scripts`](./scripts/) y están integrados en el flujo de despliegue:

| Script             | Archivo                                                  | Ejecución                                                                    |
| ------------------ | -------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Hardening servidor | [`scripts/hardening.sh`](./scripts/hardening.sh)         | **Una sola vez**: `sudo bash scripts/hardening.sh`                           |
| Watchdog           | [`scripts/watchdog.sh`](./scripts/watchdog.sh)           | Cron nativo: `*/1 * * * *` — no aplica en Docker                             |
| Backup BD          | [`scripts/backup.sh`](./scripts/backup.sh)               | Automática vía contenedor `cine_cron` a las 02:00                            |
| Alta de staff      | [`scripts/staff_creator.sh`](./scripts/staff_creator.sh) | Manual (solo imagen de producción): `docker exec -it cine_app /usr/local/scripts/staff_creator.sh` |
| Cron file          | [`scripts/cine.cron`](./scripts/cine.cron)               | Instalación en servidor nativo: `sudo cp scripts/cine.cron /etc/cron.d/cine` |

Ver detalles en [docs/backend-architecture.md — sección 13](./docs/backend-architecture.md).

---

## 7. Deployment de Producción

```bash
cp .env.prod.example .env.prod   # editar contraseñas, SMTP y APP_URL
docker compose -f docker-compose.prod.yml up -d --build
```

Ver guía completa en [docs/deployment-produccion.md](./docs/deployment-produccion.md).

---

## 8. Seguridad y Hardening

La seguridad está implementada en cuatro capas:

### Capa 1 — Servidor Apache ([`docker/apache/prod.conf`](./docker/apache/prod.conf))

Activo solo en producción. El archivo de desarrollo ([`docker/apache/000-default.conf`](./docker/apache/000-default.conf)) no incluye estas medidas.

| Medida                             | Directiva                                                                                                |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Oculta versión del servidor        | `ServerTokens Prod` / `ServerSignature Off`                                                              |
| Cabeceras de seguridad HTTP        | `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`, `Permissions-Policy` |
| Bloquea archivos sensibles         | Deniega acceso a `.env`, `composer.json`, `phpunit.xml`, etc.                                            |
| Deshabilita listado de directorios | `Options -Indexes`                                                                                       |
| Elimina cabecera `X-Powered-By`    | `Header always unset X-Powered-By`                                                                       |

### Capa 2 — Red y contenedores ([`docker-compose.prod.yml`](./docker-compose.prod.yml))

- MySQL **sin puerto expuesto al host** — solo accesible dentro de `backend_net`
- Redes separadas: `frontend_net` (Apache↔exterior) y `backend_net` (Apache↔PHP↔MySQL y workers)
- Límites de memoria y CPU por contenedor (`deploy.resources.limits`)

### Capa 3 — Servidor Linux (documentado en [backend-architecture.md — sección 14](./docs/backend-architecture.md))

Configuración aplicada directamente sobre el servidor Ubuntu:

| Medida                  | Herramienta                                                 |
| ----------------------- | ----------------------------------------------------------- |
| Firewall perimetral     | UFW — deniega todo entrante excepto puertos 80 y 2222       |
| SSH endurecido          | Puerto 2222, `PermitRootLogin no` en `/etc/ssh/sshd_config` |
| Protección fuerza bruta | `ufw limit 2222/tcp`                                        |

### Capa 4 — Aplicación Laravel

| Medida                     | Implementación                                           |
| -------------------------- | -------------------------------------------------------- |
| Autenticación con tokens   | Laravel Sanctum                                          |
| Validación de entrada      | Form Requests (`backend/app/Http/Requests/`)             |
| Protección CSRF            | Middleware integrado de Laravel                          |
| Anti-sobreventa de boletos | Transacción DB + `UNIQUE` constraint en `purchase_seats` |
| Rate limiting en login     | `throttle:5,1` en rutas de autenticación                 |

### Permisos de archivos (Docker dev)

El contenedor `app` corre con el UID/GID de tu usuario para no crear archivos de root en `./backend`.
Configúralos en `.env` (copia de `.env.example`):

```bash
id -u # tu UID
id -g # tu GID
```

**Obligatorio si ya tenías el proyecto clonado antes de este cambio** y `backend/storage`,
`backend/bootstrap/cache` o `backend/vendor` fueron creados por root. Corrígelo una vez:

```bash
sudo chown -R $USER:$USER backend/storage backend/bootstrap/cache backend/vendor
```

Luego reconstruye: `docker compose build app && docker compose up -d`.
Si no lo haces, el contenedor `app` terminará con un mensaje de error de permisos.

## Versiones de imágenes

| Servicio   | Imagen                      |
| ---------- | --------------------------- |
| PHP-FPM    | php:8.3-fpm                 |
| MySQL      | mysql:8.0                   |
| Redis      | redis:7-alpine              |
| Apache     | httpd:2.4                   |
| phpMyAdmin | phpmyadmin/phpmyadmin:5.2.3 |
| Mailpit    | axllent/mailpit:v1.31.4     |
| Node       | node:20-alpine              |
| Composer   | composer:2                  |
