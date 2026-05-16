# System Design Document — Backend Cine Web (Laravel + LAMP)

---

# 0. Estándares del Proyecto

## Idioma Oficial

Para mantener la consistencia y profesionalismo en el desarrollo, se establecen los siguientes estándares de idioma:

- **Código (Backend & Frontend):** Inglés (nombres de variables, funciones, clases, comentarios técnicos).
- **Base de Datos:** Inglés (nombres de tablas, columnas, índices).
- **Frontend (UI/UX):** Inglés (nombres de componentes, props, archivos). _Nota: El contenido visible para el usuario final será en Español._
- **Documentación:** Español (explicaciones, manuales, guías de arquitectura).

---

# 1. Objetivo del Sistema

Desarrollar un sistema web para gestión y compra de boletos de cine utilizando arquitectura LAMP:

- Linux
- Apache
- MySQL
- PHP (Laravel)

El sistema debe permitir:

- Registro y autenticación segura
- Consulta de cartelera
- Compra de boletos
- Generación de ticket digital
- Automatización y recuperación de servicios mediante Bash
- Hardening básico del servidor

---

# 2. Arquitectura General

## Arquitectura propuesta

Se recomienda utilizar:

- Laravel 12+
- Arquitectura modular tipo Clean Architecture / Layered Architecture
- Patrón Service + Repository
- API REST interna
- MySQL como persistencia
- Redis opcional para cache
- Docker opcional para desarrollo

---

# 3. Principios de Diseño

## Buenas prácticas aplicadas

- SOLID
- Separation of Concerns
- Dependency Injection
- Repository Pattern
- DTOs para transferencia de datos
- Validación mediante Form Requests
- Services para lógica de negocio
- Policies/Gates para autorización
- Transacciones para operaciones críticas
- Hashing de contraseñas con bcrypt/argon2
- Logs centralizados

---

# 4. Arquitectura de Carpetas

```txt
app/
├── Console/
├── Exceptions/
├── Http/
│   ├── Controllers/
│   │   ├── Auth/
│   │   ├── Movie/
│   │   ├── Purchase/
│   │   └── Admin/
│   │
│   ├── Middleware/
│   ├── Requests/
│   │   ├── Auth/
│   │   ├── Movie/
│   │   └── Purchase/
│   │
│   └── Resources/
│
├── Models/
│   ├── User.php
│   ├── Movie.php
│   ├── Purchase.php
│   └── Ticket.php
│
├── Services/
│   ├── Auth/
│   ├── Movie/
│   └── Purchase/
│
├── Repositories/
│   ├── Contracts/
│   └── Eloquent/
│
├── DTOs/
├── Policies/
├── Traits/
├── Helpers/
└── Providers/

database/
├── migrations/
├── seeders/
└── factories/

routes/
├── web.php
├── auth.php
├── api.php
└── admin.php

storage/
└── logs/

scripts/
├── watchdog.sh
├── backup.sh
└── staff_creator.sh
```

---

# 5. Módulos del Sistema

# 5.1 Autenticación

## Funcionalidades

- Registro de usuarios
- Inicio de sesión
- Logout
- Recuperación de contraseña
- Protección CSRF
- Rate limiting

## Tecnologías

- Laravel Breeze o Laravel Fortify
- Sessions
- Middleware `auth`

## Seguridad

Contraseñas usando:

```php
Hash::make($request->password);
```

Laravel utilizará:

- bcrypt
- argon2id

---

# 5.2 Cartelera

## Funcionalidades

- Mostrar películas
- Mostrar imagen
- Mostrar disponibilidad
- Consulta de asientos en tiempo real

## Entidad principal

### Movie

- id
- title
- description
- image
- available_seats
- schedule
- created_at

---

# 5.3 Compra de Boletos

## Flujo

1. Usuario selecciona película
2. Ingresa cantidad de boletos
3. Sistema valida disponibilidad
4. Sistema genera compra
5. Se descuentan asientos
6. Se genera ticket digital

---

# 6. Diseño de Base de Datos

# Tabla `users`

| Campo      | Tipo      |
| ---------- | --------- |
| id         | bigint    |
| name       | varchar   |
| email      | varchar   |
| password   | varchar   |
| role       | varchar   |
| created_at | timestamp |
| updated_at | timestamp |

---

# Tabla `movies`

| Campo           | Tipo      |
| --------------- | --------- |
| id              | bigint    |
| title           | varchar   |
| description     | text      |
| image           | varchar   |
| available_seats | integer   |
| schedule        | datetime  |
| created_at      | timestamp |
| updated_at      | timestamp |

---

# Tabla `purchases`

| Campo      | Tipo      |
| ---------- | --------- |
| id         | bigint    |
| user_id    | bigint    |
| movie_id   | bigint    |
| quantity   | integer   |
| total      | decimal   |
| status     | varchar   |
| created_at | timestamp |
| updated_at | timestamp |

---

# Tabla `tickets`

| Campo        | Tipo      |
| ------------ | --------- |
| id           | bigint    |
| purchase_id  | bigint    |
| ticket_code  | varchar   |
| generated_at | timestamp |

---

# 7. Lógica Crítica de Compra

## Requerimiento

La operación debe ser atómica.

## Solución

Uso de transacciones:

```php
DB::transaction(function () {

    $movie = $this->movieRepository
        ->lockForUpdate()
        ->find($movieId);

    if ($movie->available_seats < $quantity) {
        throw new Exception('No seats available');
    }

    $movie->decrement('available_seats', $quantity);

    $purchase = $this->purchaseRepository->create([
        ...
    ]);

    $this->ticketService->generate($purchase);

});
```

## Beneficios

- Evita sobreventa
- Previene race conditions
- Garantiza consistencia

---

# 8. Patrón Repository

## Objetivo

Separar acceso a datos de la lógica de negocio.

## Ejemplo

- MovieRepositoryInterface
- MovieRepository
- PurchaseRepositoryInterface
- PurchaseRepository

---

# 9. Patrón Service Layer

## Objetivo

Centralizar lógica empresarial.

## Ejemplo

- PurchaseService
- MovieService
- AuthService
- TicketService

---

# 10. API Interna

Para una referencia completa de los endpoints, parámetros y respuestas, consulte el documento:
[Documentación de la API (api-endpoints.md)](api-endpoints.md)

---

# 11. Seguridad Backend

## Validaciones

Laravel Form Requests:

- PurchaseRequest
- RegisterRequest
- LoginRequest

## Protección CSRF

Laravel incluye:

```blade
@csrf
```

## Protección XSS

Blade escapa automáticamente:

```blade
{{ $variable }}
```

## Protección SQL Injection

Uso exclusivo de:

- Eloquent
- Query Builder

## Rate Limiting

```php
Route::middleware('throttle:5,1');
```

---

# 12. Manejo de Logs

## Canal principal

```txt
storage/logs/laravel.log
```

## Logs personalizados

```php
Log::error();
Log::warning();
Log::info();
```

---

# 13. Automatización Bash

# 13.1 Watchdog

## Objetivo

Reiniciar Apache/MySQL automáticamente.

## Servicios monitoreados

- apache2
- mysql

## Flujo

```txt
Verificar servicio
↓
¿Activo?
↓
NO
↓
Reiniciar
↓
Registrar incidente
```

## Log

```txt
/var/log/cine_error.log
```

## Ejemplo básico

```bash
#!/bin/bash

services=("apache2" "mysql")

for service in "${services[@]}"
do
    systemctl is-active --quiet $service

    if [ $? -ne 0 ]; then
        systemctl restart $service

        echo "$(date) - Restarted $service" >> /var/log/cine_error.log
    fi

done
```

---

# 13.2 Backup Script

## Objetivo

Respaldar base de datos.

## Condición

Solo ejecutar si hay más de 15% libre.

## Flujo

```txt
Verificar espacio
↓
¿Libre > 15%?
↓
SI
↓
mysqldump
↓
Guardar respaldo
```

## Ejemplo

```bash
#!/bin/bash

FREE=$(df / | awk 'NR==2 {print 100-$5}' | sed 's/%//')

if [ "$FREE" -gt 15 ]; then

    mysqldump -u root -p cine_db > backup_$(date +%F).sql

else
    echo "Insufficient space"
fi
```

---

# 13.3 Gestión Masiva de Staff

## Objetivo

Crear usuarios Linux automáticamente.

## Ejemplo

```bash
#!/bin/bash

for user in vendedor1 vendedor2 tecnico1
do
    useradd -m -d /home/$user $user

    echo "$user:Password123" | chpasswd

done
```

---

# 14. Hardening y Seguridad

# Firewall UFW

## Política por defecto

```bash
ufw default deny incoming
ufw default allow outgoing
```

## Reglas

```bash
ufw allow 80/tcp
ufw allow 2222/tcp
```

## Activación

```bash
ufw enable
```

---

# Protección SSH

## Cambiar puerto

Archivo:

```txt
/etc/ssh/sshd_config
```

Configuración:

```txt
Port 2222
PermitRootLogin no
PasswordAuthentication yes
```

---

# Protección contra fuerza bruta

## UFW Limit

```bash
ufw limit 2222/tcp
```

---

# 15. Escalabilidad

## Escalabilidad horizontal futura

La arquitectura propuesta permite:

- Separar frontend/backend
- Convertir Laravel en API
- Añadir Redis
- Añadir colas
- Balanceadores
- Microservicios futuros

---

# 16. Estrategia de Deployment

## Producción

Servidor Linux Ubuntu Server:

- Apache2
- PHP 8.3+
- MySQL 8
- Composer
- Git

## Flujo de despliegue

```bash
git pull
composer install
php artisan migrate
php artisan optimize
```

---

# 17. Variables de Entorno

Archivo:

```txt
.env
```

## Variables críticas

```env
APP_ENV=production
APP_DEBUG=false

DB_DATABASE=cine_db
DB_USERNAME=cine_user
DB_PASSWORD=strong_password
```

---

# 18. Cron Jobs

## Watchdog

```cron
*/1 * * * * /scripts/watchdog.sh
```

## Backups

```cron
0 2 * * * /scripts/backup.sh
```

---

# 19. Pruebas Recomendadas

## Backend

- Unit Testing
- Feature Testing
- Purchase flow testing

## Herramientas

- PHPUnit
- Pest

---

# 20. Escenarios de Riesgo

| Riesgo        | Mitigación     |
| ------------- | -------------- |
| Sobreventa    | Transacciones  |
| SQL Injection | ORM            |
| Fuerza bruta  | UFW limit      |
| Caída Apache  | Watchdog       |
| Pérdida DB    | Backups        |
| XSS           | Blade escaping |

---

# 21. Manual de Red

## Tabla de Puertos

| Servicio          | Puerto |
| ----------------- | ------ |
| HTTP              | 80     |
| SSH personalizado | 2222   |
| MySQL Interno     | 3306   |

---

# 22. Estructura del Repositorio

```txt
cine-system/
├── backend/
├── database/
├── scripts/
├── docs/
├── docker/
└── README.md
```

---

# 23. Recomendaciones Finales

## Recomendaciones técnicas

- No usar lógica de negocio en controllers
- No acceder directamente a modelos desde controllers
- Mantener Services pequeños
- Usar interfaces
- Implementar DTOs
- Validar todo input
- Usar transacciones en compras
- Configurar backups automáticos
- Mantener logs rotativos

---

# 24. Tecnologías Recomendadas

| Componente    | Tecnología    |
| ------------- | ------------- |
| Backend       | Laravel       |
| Web Server    | Apache        |
| Base de Datos | MySQL         |
| SO            | Ubuntu Server |
| Scripts       | Bash          |
| Seguridad     | UFW           |
| Testing       | PHPUnit/Pest  |
