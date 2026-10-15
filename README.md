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
git clone https://github.com/JosManMor/cine_web.git
cd cine_web
cp .env.example .env          # ajustar contraseñas si se desea
docker compose up -d
```

El contenedor `app` ejecuta migraciones y seeders automáticamente al arrancar.

| Servicio | URL |
|----------|-----|
| Aplicación | http://localhost |
| phpMyAdmin | http://localhost:8080 |
| Mailpit (correos) | http://localhost:8025 |
| Frontend Vite (dev) | http://localhost:5173 |

> Credenciales de prueba generadas por el seeder: ver `backend/database/seeders/`.

---

## Arquitectura de contenedores

El proyecto sigue el principio de **un proceso por contenedor**, con arranque ordenado mediante `depends_on` + healthchecks:

| Contenedor | Responsabilidad |
|------------|----------------|
| `cine_mysql` | Base de datos; persiste datos en volumen `mysql_data` |
| `cine_redis` | Caché en memoria y sesiones |
| `cine_app` | PHP-FPM — ejecuta Laravel |
| `cine_apache` | Servidor web — recibe HTTP y reenvía a PHP-FPM |
| `cine_frontend` | Vite con hot-reload para React (solo dev) |
| `cine_mailpit` | Captura correos salientes (solo dev) |

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
