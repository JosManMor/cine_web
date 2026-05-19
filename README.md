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
- [Deployment — Simulación de Producción](./docs/deployment-produccion.md)

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
# 1. Copiar y configurar variables de entorno
cp .env.example .env

# 2. Levantar todos los servicios
docker compose up -d

# 3. Levantar el frontend con hot-reload
cd frontend && npm install && npm run dev
```

El entrypoint ejecuta automáticamente migraciones y seeders al arrancar.  
Accesos disponibles:

| Servicio    | URL                        |
|-------------|----------------------------|
| App         | http://localhost            |
| phpMyAdmin  | http://localhost:8080       |
| Mailpit     | http://localhost:8025       |
| Frontend dev| http://localhost:5173       |

---

## 5. Arquitectura de Contenedores

El proyecto usa múltiples contenedores siguiendo el principio de **un proceso por contenedor**, lo que permite escalar, reiniciar y depurar cada responsabilidad de forma independiente.

### Desarrollo (`docker-compose.yml`)

| Contenedor      | Imagen            | Responsabilidad                                      |
|-----------------|-------------------|------------------------------------------------------|
| `cine_app`      | PHP-FPM 8.3       | Ejecuta Laravel; procesa las peticiones PHP          |
| `cine_apache`   | httpd:2.4         | Servidor web; recibe HTTP y reenvía a PHP-FPM        |
| `cine_mysql`    | mysql:8.0         | Base de datos; separado para persistir datos con volumen |
| `cine_phpmyadmin` | phpmyadmin      | GUI de base de datos; solo en desarrollo             |
| `cine_mailpit`  | axllent/mailpit   | Captura correos salientes sin enviarlos; solo en desarrollo |

> **¿Por qué Apache y PHP-FPM separados?**  
> PHP-FPM gestiona procesos PHP de forma eficiente (pool de workers) mientras Apache sirve archivos estáticos directamente sin pasar por PHP. Esta separación refleja el stack LAMP real de producción.

### Producción (`docker-compose.prod.yml`)

| Contenedor        | Imagen              | Responsabilidad                                        |
|-------------------|---------------------|--------------------------------------------------------|
| `cine_app`        | cine-sendera:prod   | PHP-FPM; también ejecuta setup inicial al arrancar     |
| `cine_apache`     | httpd:2.4           | Servidor web en puerto 80                              |
| `cine_mysql`      | mysql:8.0           | Base de datos (sin puerto expuesto al host)            |
| `cine_queue`      | cine-sendera:prod   | Worker de colas Laravel (`queue:work`)                 |
| `cine_scheduler`  | cine-sendera:prod   | Scheduler Laravel (`schedule:run` cada 60 s)           |
| `cine_cron`       | cine-sendera:prod   | Cron del sistema; ejecuta `backup.sh` a las 02:00      |

> En producción no hay phpMyAdmin ni Mailpit. El `watchdog.sh` tampoco aplica porque `restart: always` en cada contenedor cumple esa función.

---

## 6. Scripts de Automatización

Los scripts viven en [`/scripts`](./scripts/) y están integrados en el flujo de despliegue:

| Script | Archivo | Ejecución |
|--------|---------|-----------|
| Watchdog | [`scripts/watchdog.sh`](./scripts/watchdog.sh) | Cron nativo: `*/1 * * * *` — no aplica en Docker |
| Backup BD | [`scripts/backup.sh`](./scripts/backup.sh) | Automática vía contenedor `cine_cron` a las 02:00 |
| Alta de staff | [`scripts/staff_creator.sh`](./scripts/staff_creator.sh) | Manual: `docker exec -it cine_app /usr/local/scripts/staff_creator.sh` |
| Cron file | [`scripts/cine.cron`](./scripts/cine.cron) | Instalación en servidor nativo: `sudo cp scripts/cine.cron /etc/cron.d/cine` |

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

La seguridad está implementada en tres capas:

### Capa 1 — Servidor Apache ([`docker/apache/prod.conf`](./docker/apache/prod.conf))

Activo solo en producción. El archivo de desarrollo ([`docker/apache/000-default.conf`](./docker/apache/000-default.conf)) no incluye estas medidas.

| Medida | Directiva |
|--------|-----------|
| Oculta versión del servidor | `ServerTokens Prod` / `ServerSignature Off` |
| Cabeceras de seguridad HTTP | `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`, `Permissions-Policy` |
| Bloquea archivos sensibles | Deniega acceso a `.env`, `composer.json`, `phpunit.xml`, etc. |
| Deshabilita listado de directorios | `Options -Indexes` |
| Elimina cabecera `X-Powered-By` | `Header always unset X-Powered-By` |

### Capa 2 — Red y contenedores ([`docker-compose.prod.yml`](./docker-compose.prod.yml))

- MySQL **sin puerto expuesto al host** — solo accesible dentro de `backend_net`
- Redes separadas: `frontend_net` (Apache↔exterior) y `backend_net` (Apache↔PHP↔MySQL)
- Límites de memoria y CPU por contenedor (`deploy.resources.limits`)

### Capa 3 — Servidor Linux (documentado en [backend-architecture.md — sección 14](./docs/backend-architecture.md))

Configuración aplicada directamente sobre el servidor Ubuntu:

| Medida | Herramienta |
|--------|-------------|
| Firewall perimetral | UFW — deniega todo entrante excepto puertos 80 y 2222 |
| SSH endurecido | Puerto 2222, `PermitRootLogin no` en `/etc/ssh/sshd_config` |
| Protección fuerza bruta | `ufw limit 2222/tcp` |

### Capa 4 — Aplicación Laravel

| Medida | Implementación |
|--------|----------------|
| Autenticación con tokens | Laravel Sanctum |
| Validación de entrada | Form Requests (`backend/app/Http/Requests/`) |
| Protección CSRF | Middleware integrado de Laravel |
| Anti-sobreventa de boletos | Transacción DB + `UNIQUE` constraint en `purchase_seats` |
| Rate limiting en login | `throttle:5,1` en rutas de autenticación |
