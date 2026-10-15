# Cine Sendera

> Sistema integral de gestión de cine — cartelera, venta de boletos y panel de administración.

![Laravel](https://img.shields.io/badge/Laravel-13-FF2D20?logo=laravel&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![PHP](https://img.shields.io/badge/PHP-8.3-777BB4?logo=php&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)
![Apache](https://img.shields.io/badge/Apache-2.4-D22128?logo=apache&logoColor=white)

---

<!-- Agrega aquí un screenshot o GIF del sistema en funcionamiento -->
<!-- ![Demo](docs/screenshots/demo.gif) -->

---

## Funcionalidades principales

- **Cartelera y funciones** — consulta de películas activas con horarios y salas disponibles
- **Selección de asientos** — mapa interactivo de sala con bloqueo en tiempo real contra doble reserva
- **Venta de boletos** — flujo completo de compra con generación de código de ticket por asiento
- **Panel de administración** — gestión de películas, salas, funciones, usuarios y reportes
- **Roles de acceso** — `admin`, `cashier` y `client` con permisos diferenciados vía Laravel Sanctum
- **Notificaciones por correo** — confirmación de compra y recuperación de contraseña (Mailpit en dev)

---

## Stack

| Capa | Tecnología |
|------|------------|
| Frontend | React 18 + Vite + React Router |
| Backend | Laravel 13 (PHP 8.3) — API REST |
| Base de datos | MySQL 8 |
| Servidor web | Apache 2.4 + PHP-FPM |
| Caché / Sesiones | Redis 7 |
| Contenedores | Docker + Docker Compose |
| Autenticación | Laravel Sanctum (Bearer token) |

---

## Inicio rápido

Requiere Docker y Docker Compose.

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

> **Sobre la `APP_KEY`:** si se deja vacía, el entrypoint genera una clave **temporal** en memoria que cambia en cada reinicio del contenedor e invalida sesiones y cookies cifradas. Tras editar `.env` hay que **recrear** el contenedor (`docker compose up -d app`); `docker compose restart` no recarga `env_file`.

El entrypoint ejecuta automáticamente migraciones y seeders al arrancar. Los servicios inician en orden estricto mediante `depends_on` con condiciones `service_healthy`. El frontend corre dentro del contenedor `cine_frontend`, así que no hace falta Node en el host.

| Servicio     | URL / Puerto                                                                    |
| ------------ | ------------------------------------------------------------------------------- |
| App (API)    | http://localhost                                                                |
| Frontend dev | http://localhost:5173                                                           |
| phpMyAdmin   | http://localhost:`FORWARD_PMA_PORT` (`8081` con `.env.example`; `8080` si no se define) |
| MySQL (host) | `localhost:FORWARD_DB_PORT` (`3308` con `.env.example`; `3306` si no se define) |
| Mailpit      | http://localhost:8025 (SMTP en `:1025`)                                         |

---

## Arquitectura de contenedores

El proyecto sigue el principio de **un proceso por contenedor**, con arranque ordenado mediante `depends_on` + healthchecks:

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

> **Control del orden de arranque:** `app` espera a que `mysql` y `redis` estén en estado `healthy`. `apache` espera a que `app` esté `healthy` (evita errores `502` durante el arranque). `frontend` espera a que `apache` esté `healthy`.

El entorno de producción (`docker-compose.prod.yml`) agrega contenedores de queue worker, scheduler y cron de backup, y elimina los servicios de desarrollo.

---

## Seguridad (producción)

- Apache: cabeceras HTTP de seguridad, `Options -Indexes`, bloqueo de `.env` y archivos sensibles
- Redes Docker separadas: `frontend_net` (Apache ↔ exterior) y `backend_net` (Apache ↔ PHP ↔ MySQL)
- MySQL sin puerto expuesto al host
- UFW: solo puertos 80 y 2222 abiertos; SSH endurecido con `PermitRootLogin no`
- Anti-sobreventa de asientos: `UNIQUE (screening_id, row, seat_number)` + captura de `UniqueConstraintViolationException`
- Rate limiting en login: `throttle:5,1`

---

## Documentación técnica

- [Arquitectura del backend](./docs/backend-architecture.md)
- [Sistema de diseño frontend](./docs/frontend-design-system.md)
- [Entorno Docker y orquestación](./docs/docker-entorno-desarrollo.md)
- [Deployment en producción](./docs/deployment-produccion.md)
- [Diseño de base de datos](./docs/database-design.md)

---

## Comandos de desarrollo

```bash
# Dentro del contenedor app
php artisan test              # suite completa (SQLite en memoria)
php artisan test --filter X   # filtrar por nombre
./vendor/bin/pint             # linting (Laravel Pint)
php artisan migrate:fresh --seed

# Frontend (dentro del contenedor frontend o local)
npm run dev    # Vite dev server
npm run build  # build para producción
```
