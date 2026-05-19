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

- Laravel 13
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
│   ├── Room.php
│   ├── Screening.php
│   ├── Purchase.php
│   └── PurchaseSeat.php
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

## Entidades principales

### Movie

- id, title, genre, synopsis, duration_minutes, director, rating, poster_url, status, created_at

### Screening

- id, movie_id, room_id, start_time, base_price, format, language_type, status, created_at

### Room

- id, name, rows, seats_per_row, status, created_at

La disponibilidad de asientos se calcula como `rooms.rows × rooms.seats_per_row` menos el conteo de `purchase_seats` activos para esa función. No se almacena `available_seats` en ninguna tabla.

---

# 5.3 Compra de Boletos

## Flujo

1. Usuario selecciona función (`screening_id`)
2. Selecciona asientos individuales (`row` + `seat_number`)
3. Sistema valida disponibilidad en `purchase_seats`
4. Sistema crea `purchases` y los registros en `purchase_seats` dentro de una transacción
5. Al confirmar el pago (`payment_status = completed`), un Observer/Job asigna `ticket_code` a cada `purchase_seat`

---

# 6. Diseño de Base de Datos

El esquema completo, con todas las tablas, columnas, restricciones, índices y decisiones de diseño, se encuentra en:

**[docs/database-design.md](database-design.md)** ← fuente de verdad del esquema

Resumen: 6 tablas — `users`, `movies`, `rooms`, `screenings`, `purchases`, `purchase_seats`. No existe tabla `tickets`; el campo `ticket_code` vive en `purchase_seats`. No hay soft delete; se usa `status` para desactivar registros.

---

# 7. Lógica Crítica de Compra

## Requerimiento

La operación debe ser atómica. La garantía de no doble reserva es el constraint UNIQUE `(screening_id, row, seat_number)` en `purchase_seats`.

## Solución

No usar `exists()` como pre-chequeo: en concurrencia, dos transacciones pueden pasar el check simultáneamente y colisionar igual en el INSERT. El UNIQUE es la garantía real; se captura su excepción y se convierte en un error de dominio:

```php
use Illuminate\Database\UniqueConstraintViolationException;

DB::transaction(function () use ($screeningId, $seats, $purchaseData) {

    $purchase = $this->purchaseRepository->create($purchaseData);

    foreach ($seats as $seat) {
        try {
            PurchaseSeat::create([
                'purchase_id'  => $purchase->id,
                'screening_id' => $screeningId,
                'row'          => $seat['row'],
                'seat_number'  => $seat['seat_number'],
                'price_paid'   => $seat['price'],
            ]);
        } catch (UniqueConstraintViolationException) {
            throw new SeatAlreadyTakenException($seat['row'], $seat['seat_number']);
        }
    }

});
// El ticket_code se asigna en un Observer/Job al confirmar el pago,
// nunca inline en este request.
```

## Beneficios

- Evita doble reserva (constraint UNIQUE como garantía final, no un `exists()` previo)
- El rollback de la transacción deshace todos los inserts si falla alguno
- Garantiza consistencia del precio histórico

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

- PurchaseService — reserva de asientos, confirmación de pago
- MovieService — cartelera, detalle, disponibilidad calculada
- AuthService — registro, login, logout

---

# 10. API Interna

Para una referencia completa de los endpoints, parámetros y respuestas, consulte el documento:
[Documentación de la API (api-endpoints.md)](api-endpoints.md)

## Documentación OpenAPI

Todos los módulos del sistema están documentados con **OpenAPI 3.0** mediante el paquete [`darkaonline/l5-swagger`](https://github.com/DarkaOnLine/L5-Swagger). Las anotaciones viven directamente en los controladores y Form Requests usando atributos PHP (`#[OA\...]`).

La interfaz interactiva (Swagger UI) está disponible en:

```
http://localhost/api/documentation
```

Para regenerar la especificación tras modificar anotaciones:

```bash
php artisan l5-swagger:generate
```

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

**Script:** [`scripts/watchdog.sh`](../scripts/watchdog.sh)

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

**Script:** [`scripts/backup.sh`](../scripts/backup.sh)

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

**Script:** [`scripts/staff_creator.sh`](../scripts/staff_creator.sh)

## Objetivo

Crear usuarios Linux automáticamente.

## Uso

El script está disponible dentro del contenedor `cine_app` en `/usr/local/scripts/staff_creator.sh`.

**Con la lista interna por defecto:**

```bash
docker exec -it cine_app /usr/local/scripts/staff_creator.sh
```

**Con un CSV personalizado (montado desde el host):**

```bash
# Copia el CSV al contenedor
docker cp usuarios.csv cine_app:/tmp/usuarios.csv

# Ejecuta con el archivo
docker exec -it cine_app /usr/local/scripts/staff_creator.sh /tmp/usuarios.csv
```

**En servidor nativo (sin Docker):**

```bash
sudo bash scripts/staff_creator.sh [usuarios.csv]
```

## Formato CSV

```csv
# username,password,grupo
vendedor1,TempPass1!,ventas
tecnico1,TempPass2!,soporte
```

## Ejemplo integrado

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

## Despliegue con Docker (producción)

El scheduling se configura automáticamente al levantar `docker-compose.prod.yml`. El servicio `cron` arranca con [`docker/php/cron-entrypoint.sh`](../docker/php/cron-entrypoint.sh), que registra el job y ejecuta `crond`.

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

> `watchdog.sh` **no aplica en Docker**: `restart: always` en cada servicio ya cubre los reinicios de contenedores caídos.

## Despliegue nativo Linux (sin Docker)

El archivo [`scripts/cine.cron`](../scripts/cine.cron) contiene las entradas listas para instalar.

**Opción A — `/etc/cron.d/` (recomendado):**

```bash
sudo cp scripts/cine.cron /etc/cron.d/cine
sudo chmod 644 /etc/cron.d/cine
```

**Opción B — crontab de root:**

```bash
sudo crontab scripts/cine.cron
```

## Resumen de entradas

| Script | Frecuencia | Docker | Nativo |
|---|---|---|---|
| `watchdog.sh` | `*/1 * * * *` | No aplica | Sí |
| `backup.sh` | `0 2 * * *` | Servicio `cron` | Sí |
| `staff_creator.sh` | — | Manual | Manual |

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
