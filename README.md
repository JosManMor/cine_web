# Cine Sendera — Sistema de Gestión de Cine

Sistema web integral para la gestión de cartelera, venta de boletos y administración de un cine, desarrollado bajo la arquitectura LAMP (Linux, Apache, MySQL, PHP/Laravel).

---

## 0. Estándares del Proyecto

Para mantener la consistencia y profesionalismo en el desarrollo, se establecen los siguientes estándares de idioma:

- **Código (Backend & Frontend):** Inglés (nombres de variables, funciones, clases, comentarios técnicos).
- **Base de Datos:** Inglés (nombres de tablas, columnas, índices).
- **Frontend (UI/UX):** Inglés para la estructura técnica, pero el **contenido visible** para el usuario final será en **Español**.
- **Documentación:** Español (explicaciones, manuales, guías de arquitectura).

---

## 1. Documentación

La documentación detallada del proyecto se encuentra en la carpeta `/docs`:

- [Arquitectura del Backend](./docs/backend-architecture.md)
- [Sistema de Diseño Frontend](./docs/frontend-design-system.md)

---

## 2. Tecnologías Principales

- **Backend:** Laravel ^13.8 (PHP 8.3+)
- **Base de Datos:** MySQL 8
- **Frontend:** Vite + Tailwind CSS
- **Servidor:** Apache2 sobre Ubuntu Server
- **Automatización:** Scripts en Bash

---

## 3. Requisitos del Sistema

- Docker y Docker Compose (para desarrollo)
- PHP 8.3+
- Composer
- Node.js & NPM

---

## 4. Instalación Rápida (Desarrollo)

1. Clonar el repositorio.
2. Copiar `backend/.env.example` a `backend/.env` y configurar ahí las credenciales del backend Laravel.
3. Ejecutar `docker-compose up -d`.
4. Entrar al contenedor de PHP (donde `./backend` está montado como `/var/www`) y ejecutar:

   ```bash
   composer install
   php artisan key:generate
   php artisan migrate --seed
   ```

5. Instalar dependencias del frontend (si aplica):

   ```bash
   npm install
   npm run dev
   ```

---

## 5. Scripts de Automatización (Planeado)

Se tiene previsto incorporar scripts de Bash para mantenimiento; **actualmente no están incluidos en este repositorio**:

- `watchdog.sh`: Monitoreo y reinicio de servicios (Apache/MySQL).
- `backup.sh`: Respaldos automáticos de la base de datos.
- `staff_creator.sh`: Gestión masiva de usuarios del sistema.

---

## 6. Seguridad (Hardening)

- Firewall configurado con UFW.
- SSH puerto personalizado (2222).
- Protección contra fuerza bruta.
- Transacciones atómicas para evitar sobreventa de boletos.
