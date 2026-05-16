# Análisis del Sistema — Cine Sendera

Sistema de gestión y reserva de entradas de cine (Cinema Management System). Permite a usuarios registrados explorar cartelera, seleccionar asientos, comprar entradas y recibir tickets digitales. Incluye panel administrativo para gestión de películas, funciones, salas y reportes de ventas.

**Stack confirmado:** React (SPA) + Laravel 13 (PHP 8.3) + MySQL/PostgreSQL + REST API

---
/
# Módulos Detectados

| # | Módulo | Descripción |
|---|--------|-------------|
| 1 | **Auth** | Registro, login, verificación de email, recuperación de contraseña |
| 2 | **Cartelera** | Listado y detalle de películas en cartel |
| 3 | **Funciones** | Horarios/proyecciones disponibles por película |
| 4 | **Selección de Asientos** | Mapa interactivo de sala con estados de disponibilidad |
| 5 | **Compra/Reserva** | Flujo de compra, aplicación de promociones, pago |
| 6 | **Tickets** | Generación de tickets digitales con código único/QR |
| 7 | **Perfil de Usuario** | Historial de compras, datos personales |
| 8 | **Admin — Películas** | CRUD de catálogo de películas |
| 9 | **Admin — Salas** | Gestión de salas y distribución de asientos |
| 10 | **Admin — Funciones** | Programación de proyecciones |
| 11 | **Admin — Reportes** | Ventas, ocupación, ingresos |

---

# Entidades

## roles
Catálogo de roles del sistema.

| Campo | Tipo | Restricciones |
|-------|------|---------------|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT |
| name | VARCHAR(50) | UNIQUE, NOT NULL |
| description | TEXT | NULLABLE |
| created_at | TIMESTAMP | DEFAULT CURRENT |
| updated_at | TIMESTAMP | ON UPDATE CURRENT |

## permissions
Permisos granulares por acción.

| Campo | Tipo | Restricciones |
|-------|------|---------------|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT |
| name | VARCHAR(100) | UNIQUE, NOT NULL (ej. `movies.create`) |
| description | TEXT | NULLABLE |

## role_permissions *(pivot)*
Asocia roles con permisos (N:M).

| Campo | Tipo | Restricciones |
|-------|------|---------------|
| role_id | BIGINT UNSIGNED | FK → roles.id |
| permission_id | BIGINT UNSIGNED | FK → permissions.id |
| PK | — | (role_id, permission_id) |

## users
Cuentas de clientes y personal.

| Campo | Tipo | Restricciones |
|-------|------|---------------|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT |
| role_id | BIGINT UNSIGNED | FK → roles.id, NOT NULL, DEFAULT role 'client' |
| name | VARCHAR(255) | NOT NULL |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| email_verified_at | TIMESTAMP | NULLABLE |
| password | VARCHAR(255) | NOT NULL |
| phone | VARCHAR(20) | NULLABLE |
| remember_token | VARCHAR(100) | NULLABLE |
| created_at | TIMESTAMP | — |
| updated_at | TIMESTAMP | — |
| deleted_at | TIMESTAMP | NULLABLE (soft delete) |

## genres
Catálogo de géneros cinematográficos.

| Campo | Tipo | Restricciones |
|-------|------|---------------|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT |
| name | VARCHAR(100) | UNIQUE, NOT NULL |
| description | TEXT | NULLABLE |

## movies
Catálogo de películas.

| Campo | Tipo | Restricciones |
|-------|------|---------------|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT |
| genre_id | BIGINT UNSIGNED | FK → genres.id, NULLABLE |
| title | VARCHAR(255) | NOT NULL |
| synopsis | TEXT | NULLABLE |
| duration_minutes | SMALLINT UNSIGNED | NOT NULL |
| director | VARCHAR(255) | NULLABLE |
| cast | TEXT | NULLABLE |
| rating | VARCHAR(10) | NOT NULL (G, PG, PG-13, R) |
| language | VARCHAR(50) | DEFAULT 'Español' |
| poster_url | VARCHAR(500) | NULLABLE |
| trailer_url | VARCHAR(500) | NULLABLE |
| release_date | DATE | NULLABLE |
| end_date | DATE | NULLABLE |
| status | ENUM | NOT NULL: `active`, `inactive`, `coming_soon` |
| created_at | TIMESTAMP | — |
| updated_at | TIMESTAMP | — |
| deleted_at | TIMESTAMP | NULLABLE |

## rooms
Salas de proyección físicas.

| Campo | Tipo | Restricciones |
|-------|------|---------------|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT |
| name | VARCHAR(100) | NOT NULL (ej. "Sala 1", "Sala VIP") |
| capacity | SMALLINT UNSIGNED | NOT NULL |
| has_3d | BOOLEAN | DEFAULT FALSE |
| has_dolby | BOOLEAN | DEFAULT FALSE |
| status | ENUM | DEFAULT `active`: `active`, `maintenance` |
| created_at | TIMESTAMP | — |
| updated_at | TIMESTAMP | — |

## seat_types
Tipos de asiento (estándar, VIP, accesible).

| Campo | Tipo | Restricciones |
|-------|------|---------------|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT |
| name | VARCHAR(50) | UNIQUE, NOT NULL |
| description | TEXT | NULLABLE |
| price_modifier | DECIMAL(5,2) | DEFAULT 1.00 (multiplicador sobre precio base) |

## seats
Asientos individuales dentro de una sala.

| Campo | Tipo | Restricciones |
|-------|------|---------------|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT |
| room_id | BIGINT UNSIGNED | FK → rooms.id, NOT NULL |
| seat_type_id | BIGINT UNSIGNED | FK → seat_types.id, NOT NULL |
| row | VARCHAR(5) | NOT NULL (A, B, C…) |
| number | SMALLINT UNSIGNED | NOT NULL |
| status | ENUM | DEFAULT `available`: `available`, `maintenance` |
| created_at | TIMESTAMP | — |
| updated_at | TIMESTAMP | — |
| UNIQUE | — | (room_id, row, number) |

## screenings
Proyección específica de una película en una sala y horario.

| Campo | Tipo | Restricciones |
|-------|------|---------------|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT |
| movie_id | BIGINT UNSIGNED | FK → movies.id, NOT NULL |
| room_id | BIGINT UNSIGNED | FK → rooms.id, NOT NULL |
| start_time | DATETIME | NOT NULL |
| end_time | DATETIME | NOT NULL |
| base_price | DECIMAL(10,2) | NOT NULL |
| format | ENUM | DEFAULT `2D`: `2D`, `3D`, `IMAX` |
| language_type | ENUM | DEFAULT `subtitled`: `original`, `dubbed`, `subtitled` |
| status | ENUM | DEFAULT `scheduled`: `scheduled`, `open`, `sold_out`, `cancelled`, `finished` |
| created_at | TIMESTAMP | — |
| updated_at | TIMESTAMP | — |

## seat_pricing
Precio específico por tipo de asiento por función (sobreescribe base_price × modifier).

| Campo | Tipo | Restricciones |
|-------|------|---------------|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT |
| screening_id | BIGINT UNSIGNED | FK → screenings.id, NOT NULL |
| seat_type_id | BIGINT UNSIGNED | FK → seat_types.id, NOT NULL |
| price | DECIMAL(10,2) | NOT NULL |
| UNIQUE | — | (screening_id, seat_type_id) |

## payment_methods
Catálogo de métodos de pago aceptados.

| Campo | Tipo | Restricciones |
|-------|------|---------------|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT |
| name | VARCHAR(50) | UNIQUE, NOT NULL |
| description | TEXT | NULLABLE |
| is_active | BOOLEAN | DEFAULT TRUE |

## promotions
Códigos de descuento y promociones.

| Campo | Tipo | Restricciones |
|-------|------|---------------|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT |
| code | VARCHAR(50) | UNIQUE, NOT NULL |
| description | TEXT | NULLABLE |
| discount_type | ENUM | NOT NULL: `percentage`, `fixed` |
| discount_value | DECIMAL(10,2) | NOT NULL |
| min_purchase | DECIMAL(10,2) | DEFAULT 0.00 |
| max_uses | INTEGER UNSIGNED | NULLABLE (NULL = ilimitado) |
| uses_count | INTEGER UNSIGNED | DEFAULT 0 |
| valid_from | DATETIME | NOT NULL |
| valid_until | DATETIME | NOT NULL |
| is_active | BOOLEAN | DEFAULT TRUE |
| created_at | TIMESTAMP | — |
| updated_at | TIMESTAMP | — |

## purchases
Transacción de compra (cabecera del pedido).

| Campo | Tipo | Restricciones |
|-------|------|---------------|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT |
| user_id | BIGINT UNSIGNED | FK → users.id, NOT NULL |
| screening_id | BIGINT UNSIGNED | FK → screenings.id, NOT NULL |
| payment_method_id | BIGINT UNSIGNED | FK → payment_methods.id, NULLABLE |
| subtotal | DECIMAL(10,2) | NOT NULL |
| discount_amount | DECIMAL(10,2) | DEFAULT 0.00 |
| total_amount | DECIMAL(10,2) | NOT NULL |
| payment_status | ENUM | DEFAULT `pending`: `pending`, `completed`, `failed`, `refunded` |
| purchase_status | ENUM | DEFAULT `active`: `active`, `cancelled` |
| payment_reference | VARCHAR(255) | NULLABLE (referencia externa del pago) |
| purchased_at | TIMESTAMP | NULLABLE (cuando se confirmó el pago) |
| created_at | TIMESTAMP | — |
| updated_at | TIMESTAMP | — |

## purchase_seats *(pivot)*
Asientos específicos seleccionados en una compra.

| Campo | Tipo | Restricciones |
|-------|------|---------------|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT |
| purchase_id | BIGINT UNSIGNED | FK → purchases.id, NOT NULL |
| seat_id | BIGINT UNSIGNED | FK → seats.id, NOT NULL |
| screening_id | BIGINT UNSIGNED | FK → screenings.id, NOT NULL |
| price_paid | DECIMAL(10,2) | NOT NULL |
| status | ENUM | DEFAULT `active`: `active`, `cancelled` |
| UNIQUE | — | (seat_id, screening_id) — **garantiza no doble reserva** |

## tickets
Tickets digitales individuales por asiento-compra.

| Campo | Tipo | Restricciones |
|-------|------|---------------|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT |
| purchase_seat_id | BIGINT UNSIGNED | FK → purchase_seats.id, NOT NULL, UNIQUE |
| ticket_code | VARCHAR(100) | UNIQUE, NOT NULL |
| qr_data | TEXT | NULLABLE (payload JSON para QR) |
| status | ENUM | DEFAULT `valid`: `valid`, `used`, `cancelled` |
| used_at | TIMESTAMP | NULLABLE |
| generated_at | TIMESTAMP | NOT NULL |
| created_at | TIMESTAMP | — |
| updated_at | TIMESTAMP | — |

## purchase_promotions *(pivot)*
Promociones aplicadas a una compra.

| Campo | Tipo | Restricciones |
|-------|------|---------------|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT |
| purchase_id | BIGINT UNSIGNED | FK → purchases.id, NOT NULL |
| promotion_id | BIGINT UNSIGNED | FK → promotions.id, NOT NULL |
| discount_applied | DECIMAL(10,2) | NOT NULL |

---

# Relaciones

```
roles        1 --- * users
roles        * --- * permissions   (via role_permissions)
genres       1 --- * movies
movies       1 --- * screenings
rooms        1 --- * seats
rooms        1 --- * screenings
seat_types   1 --- * seats
seat_types   1 --- * seat_pricing
screenings   1 --- * seat_pricing
screenings   1 --- * purchase_seats
screenings   1 --- * purchases
users        1 --- * purchases
purchases    1 --- * purchase_seats
purchases    * --- * promotions    (via purchase_promotions)
purchase_seats 1 --- 1 tickets
seats        1 --- * purchase_seats
payment_methods 1 --- * purchases
```

---

# Tablas Pivote

| Tabla | Propósito |
|-------|-----------|
| `role_permissions` | Relación N:M entre roles y permisos granulares |
| `purchase_seats` | Detalle de qué asientos forman parte de cada compra; contiene el precio pagado y garantiza unicidad de asiento por función |
| `purchase_promotions` | Registro de qué códigos de descuento se aplicaron a cada compra y el monto descontado |

---

# Reglas de Negocio

1. **Unicidad de asiento por función:** El par `(seat_id, screening_id)` en `purchase_seats` debe ser UNIQUE. Es la restricción más crítica del sistema.
2. **Transacciones atómicas:** La reserva de múltiples asientos debe ocurrir dentro de una transacción de base de datos para prevenir condiciones de carrera.
3. **Bloqueo optimista:** Al seleccionar asientos, usar `SELECT ... FOR UPDATE` o un campo `reserved_until` temporal antes de confirmar el pago.
4. **Generación de tickets solo tras pago confirmado:** `tickets` solo se insertan cuando `purchases.payment_status = 'completed'`.
5. **Un ticket por asiento-compra:** La FK `purchase_seat_id` en `tickets` tiene UNIQUE constraint.
6. **Código de ticket único e irreversible:** `ticket_code` es único en la tabla y no puede reutilizarse aun si se cancela la compra.
7. **Capacidad de sala:** `rooms.capacity` debe coincidir con la cantidad de registros activos en `seats` de esa sala.
8. **Estado de función:** Una función pasa automáticamente a `sold_out` cuando todos sus asientos están reservados; pasa a `finished` cuando `end_time < NOW()`.
9. **Promociones con límite de uso:** `promotions.uses_count` debe incrementarse atómicamente; si `uses_count >= max_uses`, la promoción no es aplicable.
10. **Vigencia de promociones:** Validar `valid_from <= NOW() <= valid_until` al aplicar un código.
11. **Soft delete en usuarios y películas:** Usar `deleted_at` para no perder historial de compras asociado.
12. **Precios históricos:** `purchase_seats.price_paid` almacena el precio real pagado, independientemente de cambios futuros en `seat_pricing`.
13. **Cancelación:** Al cancelar una compra, se actualizan los registros en `purchase_seats`, `tickets` y `purchases` con sus respectivos estados `cancelled`; los asientos vuelven a estar disponibles.
14. **Sala en mantenimiento:** No se pueden crear funciones en salas con `status = 'maintenance'`.
15. **Película activa para funciones:** Solo películas con `status = 'active'` pueden tener funciones programadas.

---

# Diccionario de Datos

```
TABLA: roles
├─ id           BIGINT UNSIGNED    PK, AUTO_INCREMENT
├─ name         VARCHAR(50)        UNIQUE NOT NULL | valores: admin, cashier, client
├─ description  TEXT               NULLABLE
├─ created_at   TIMESTAMP          DEFAULT CURRENT_TIMESTAMP
└─ updated_at   TIMESTAMP          ON UPDATE CURRENT_TIMESTAMP

TABLA: permissions
├─ id           BIGINT UNSIGNED    PK, AUTO_INCREMENT
├─ name         VARCHAR(100)       UNIQUE NOT NULL | formato: recurso.acción
└─ description  TEXT               NULLABLE

TABLA: role_permissions
├─ role_id       BIGINT UNSIGNED   FK → roles.id, ON DELETE CASCADE
├─ permission_id BIGINT UNSIGNED   FK → permissions.id, ON DELETE CASCADE
└─ PK            ────────────────  COMPOSITE (role_id, permission_id)

TABLA: users
├─ id                  BIGINT UNSIGNED  PK, AUTO_INCREMENT
├─ role_id             BIGINT UNSIGNED  FK → roles.id, NOT NULL
├─ name                VARCHAR(255)     NOT NULL
├─ email               VARCHAR(255)     UNIQUE NOT NULL
├─ email_verified_at   TIMESTAMP        NULLABLE
├─ password            VARCHAR(255)     NOT NULL | almacenado como bcrypt
├─ phone               VARCHAR(20)      NULLABLE
├─ remember_token      VARCHAR(100)     NULLABLE
├─ created_at          TIMESTAMP        ─
├─ updated_at          TIMESTAMP        ─
└─ deleted_at          TIMESTAMP        NULLABLE | soft delete

TABLA: genres
├─ id           BIGINT UNSIGNED    PK, AUTO_INCREMENT
├─ name         VARCHAR(100)       UNIQUE NOT NULL
└─ description  TEXT               NULLABLE

TABLA: movies
├─ id               BIGINT UNSIGNED  PK, AUTO_INCREMENT
├─ genre_id         BIGINT UNSIGNED  FK → genres.id, NULLABLE, ON DELETE SET NULL
├─ title            VARCHAR(255)     NOT NULL
├─ synopsis         TEXT             NULLABLE
├─ duration_minutes SMALLINT UNSIGNED NOT NULL | > 0
├─ director         VARCHAR(255)     NULLABLE
├─ cast             TEXT             NULLABLE | JSON array recomendado
├─ rating           VARCHAR(10)      NOT NULL | G, PG, PG-13, R, NC-17
├─ language         VARCHAR(50)      DEFAULT 'Español'
├─ poster_url       VARCHAR(500)     NULLABLE
├─ trailer_url      VARCHAR(500)     NULLABLE
├─ release_date     DATE             NULLABLE
├─ end_date         DATE             NULLABLE
├─ status           ENUM             NOT NULL DEFAULT 'active'
├─ created_at       TIMESTAMP        ─
├─ updated_at       TIMESTAMP        ─
└─ deleted_at       TIMESTAMP        NULLABLE

TABLA: rooms
├─ id         BIGINT UNSIGNED  PK, AUTO_INCREMENT
├─ name       VARCHAR(100)     NOT NULL
├─ capacity   SMALLINT UNSIGNED NOT NULL | debe coincidir con COUNT(seats)
├─ has_3d     BOOLEAN          DEFAULT FALSE
├─ has_dolby  BOOLEAN          DEFAULT FALSE
├─ status     ENUM             DEFAULT 'active'
├─ created_at TIMESTAMP        ─
└─ updated_at TIMESTAMP        ─

TABLA: seat_types
├─ id               BIGINT UNSIGNED  PK, AUTO_INCREMENT
├─ name             VARCHAR(50)      UNIQUE NOT NULL | standard, vip, accessible
├─ description      TEXT             NULLABLE
└─ price_modifier   DECIMAL(5,2)     DEFAULT 1.00 | VIP = 1.50, accesible = 1.00

TABLA: seats
├─ id            BIGINT UNSIGNED  PK, AUTO_INCREMENT
├─ room_id       BIGINT UNSIGNED  FK → rooms.id, NOT NULL, ON DELETE CASCADE
├─ seat_type_id  BIGINT UNSIGNED  FK → seat_types.id, NOT NULL
├─ row           VARCHAR(5)       NOT NULL | A-Z
├─ number        SMALLINT UNSIGNED NOT NULL
├─ status        ENUM             DEFAULT 'available'
├─ created_at    TIMESTAMP        ─
├─ updated_at    TIMESTAMP        ─
└─ UNIQUE        ─────────────    (room_id, row, number)

TABLA: screenings
├─ id             BIGINT UNSIGNED  PK, AUTO_INCREMENT
├─ movie_id       BIGINT UNSIGNED  FK → movies.id, NOT NULL
├─ room_id        BIGINT UNSIGNED  FK → rooms.id, NOT NULL
├─ start_time     DATETIME         NOT NULL
├─ end_time       DATETIME         NOT NULL | calculado: start_time + duration + 15 min
├─ base_price     DECIMAL(10,2)    NOT NULL
├─ format         ENUM             DEFAULT '2D'
├─ language_type  ENUM             DEFAULT 'subtitled'
├─ status         ENUM             DEFAULT 'scheduled'
├─ created_at     TIMESTAMP        ─
└─ updated_at     TIMESTAMP        ─

TABLA: seat_pricing
├─ id            BIGINT UNSIGNED  PK, AUTO_INCREMENT
├─ screening_id  BIGINT UNSIGNED  FK → screenings.id, ON DELETE CASCADE
├─ seat_type_id  BIGINT UNSIGNED  FK → seat_types.id
├─ price         DECIMAL(10,2)    NOT NULL
└─ UNIQUE        ─────────────    (screening_id, seat_type_id)

TABLA: payment_methods
├─ id          BIGINT UNSIGNED  PK, AUTO_INCREMENT
├─ name        VARCHAR(50)      UNIQUE NOT NULL | cash, credit_card, debit_card, online
├─ description TEXT             NULLABLE
└─ is_active   BOOLEAN          DEFAULT TRUE

TABLA: promotions
├─ id              BIGINT UNSIGNED  PK, AUTO_INCREMENT
├─ code            VARCHAR(50)      UNIQUE NOT NULL
├─ description     TEXT             NULLABLE
├─ discount_type   ENUM             NOT NULL | percentage, fixed
├─ discount_value  DECIMAL(10,2)    NOT NULL | % o monto fijo
├─ min_purchase    DECIMAL(10,2)    DEFAULT 0.00
├─ max_uses        INTEGER UNSIGNED NULLABLE | NULL = ilimitado
├─ uses_count      INTEGER UNSIGNED DEFAULT 0
├─ valid_from      DATETIME         NOT NULL
├─ valid_until     DATETIME         NOT NULL
├─ is_active       BOOLEAN          DEFAULT TRUE
├─ created_at      TIMESTAMP        ─
└─ updated_at      TIMESTAMP        ─

TABLA: purchases
├─ id                BIGINT UNSIGNED  PK, AUTO_INCREMENT
├─ user_id           BIGINT UNSIGNED  FK → users.id, NOT NULL
├─ screening_id      BIGINT UNSIGNED  FK → screenings.id, NOT NULL
├─ payment_method_id BIGINT UNSIGNED  FK → payment_methods.id, NULLABLE
├─ subtotal          DECIMAL(10,2)    NOT NULL
├─ discount_amount   DECIMAL(10,2)    DEFAULT 0.00
├─ total_amount      DECIMAL(10,2)    NOT NULL | subtotal - discount_amount
├─ payment_status    ENUM             DEFAULT 'pending'
├─ purchase_status   ENUM             DEFAULT 'active'
├─ payment_reference VARCHAR(255)     NULLABLE
├─ purchased_at      TIMESTAMP        NULLABLE
├─ created_at        TIMESTAMP        ─
└─ updated_at        TIMESTAMP        ─

TABLA: purchase_seats
├─ id            BIGINT UNSIGNED  PK, AUTO_INCREMENT
├─ purchase_id   BIGINT UNSIGNED  FK → purchases.id, ON DELETE CASCADE
├─ seat_id       BIGINT UNSIGNED  FK → seats.id
├─ screening_id  BIGINT UNSIGNED  FK → screenings.id
├─ price_paid    DECIMAL(10,2)    NOT NULL
├─ status        ENUM             DEFAULT 'active'
└─ UNIQUE        ─────────────    (seat_id, screening_id)

TABLA: tickets
├─ id                 BIGINT UNSIGNED  PK, AUTO_INCREMENT
├─ purchase_seat_id   BIGINT UNSIGNED  FK → purchase_seats.id, UNIQUE
├─ ticket_code        VARCHAR(100)     UNIQUE NOT NULL | UUID o NANOID
├─ qr_data            TEXT             NULLABLE | JSON stringificado
├─ status             ENUM             DEFAULT 'valid'
├─ used_at            TIMESTAMP        NULLABLE
├─ generated_at       TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP
├─ created_at         TIMESTAMP        ─
└─ updated_at         TIMESTAMP        ─

TABLA: purchase_promotions
├─ id               BIGINT UNSIGNED  PK, AUTO_INCREMENT
├─ purchase_id      BIGINT UNSIGNED  FK → purchases.id, ON DELETE CASCADE
├─ promotion_id     BIGINT UNSIGNED  FK → promotions.id
└─ discount_applied DECIMAL(10,2)    NOT NULL
```

---

# DER Textual (dbdiagram.io)

```sql
// ==========================================
// CINE SENDERA — DATABASE DIAGRAM
// ==========================================

Table roles {
  id bigint [pk, increment, not null]
  name varchar(50) [unique, not null, note: "admin | cashier | client"]
  description text
  created_at timestamp
  updated_at timestamp
}

Table permissions {
  id bigint [pk, increment, not null]
  name varchar(100) [unique, not null, note: "movies.create | screenings.manage"]
  description text
}

Table role_permissions {
  role_id bigint [not null]
  permission_id bigint [not null]

  indexes {
    (role_id, permission_id) [pk]
  }
}

Table users {
  id bigint [pk, increment, not null]
  role_id bigint [not null]
  name varchar(255) [not null]
  email varchar(255) [unique, not null]
  email_verified_at timestamp
  password varchar(255) [not null]
  phone varchar(20)
  remember_token varchar(100)
  created_at timestamp
  updated_at timestamp
  deleted_at timestamp
}

Table genres {
  id bigint [pk, increment, not null]
  name varchar(100) [unique, not null]
  description text
}

Table movies {
  id bigint [pk, increment, not null]
  genre_id bigint
  title varchar(255) [not null]
  synopsis text
  duration_minutes smallint [not null]
  director varchar(255)
  cast text
  rating varchar(10) [not null, note: "G | PG | PG-13 | R | NC-17"]
  language varchar(50) [default: "Español"]
  poster_url varchar(500)
  trailer_url varchar(500)
  release_date date
  end_date date
  status varchar(20) [not null, default: "active", note: "active|inactive|coming_soon"]
  created_at timestamp
  updated_at timestamp
  deleted_at timestamp
}

Table rooms {
  id bigint [pk, increment, not null]
  name varchar(100) [not null]
  capacity smallint [not null]
  has_3d boolean [default: false]
  has_dolby boolean [default: false]
  status varchar(20) [default: "active", note: "active | maintenance"]
  created_at timestamp
  updated_at timestamp
}

Table seat_types {
  id bigint [pk, increment, not null]
  name varchar(50) [unique, not null, note: "standard | vip | accessible"]
  description text
  price_modifier decimal(5,2) [default: 1.00]
}

Table seats {
  id bigint [pk, increment, not null]
  room_id bigint [not null]
  seat_type_id bigint [not null]
  row varchar(5) [not null]
  number smallint [not null]
  status varchar(20) [default: "available", note: "available | maintenance"]
  created_at timestamp
  updated_at timestamp

  indexes {
    (room_id, row, number) [unique]
  }
}

Table screenings {
  id bigint [pk, increment, not null]
  movie_id bigint [not null]
  room_id bigint [not null]
  start_time datetime [not null]
  end_time datetime [not null]
  base_price decimal(10,2) [not null]
  format varchar(10) [default: "2D", note: "2D | 3D | IMAX"]
  language_type varchar(20) [default: "subtitled", note: "original|dubbed|subtitled"]
  status varchar(20) [default: "scheduled", note: "scheduled|open|sold_out|cancelled|finished"]
  created_at timestamp
  updated_at timestamp
}

Table seat_pricing {
  id bigint [pk, increment, not null]
  screening_id bigint [not null]
  seat_type_id bigint [not null]
  price decimal(10,2) [not null]

  indexes {
    (screening_id, seat_type_id) [unique]
  }
}

Table payment_methods {
  id bigint [pk, increment, not null]
  name varchar(50) [unique, not null]
  description text
  is_active boolean [default: true]
}

Table promotions {
  id bigint [pk, increment, not null]
  code varchar(50) [unique, not null]
  description text
  discount_type varchar(20) [not null, note: "percentage | fixed"]
  discount_value decimal(10,2) [not null]
  min_purchase decimal(10,2) [default: 0.00]
  max_uses int
  uses_count int [default: 0]
  valid_from datetime [not null]
  valid_until datetime [not null]
  is_active boolean [default: true]
  created_at timestamp
  updated_at timestamp
}

Table purchases {
  id bigint [pk, increment, not null]
  user_id bigint [not null]
  screening_id bigint [not null]
  payment_method_id bigint
  subtotal decimal(10,2) [not null]
  discount_amount decimal(10,2) [default: 0.00]
  total_amount decimal(10,2) [not null]
  payment_status varchar(20) [default: "pending", note: "pending|completed|failed|refunded"]
  purchase_status varchar(20) [default: "active", note: "active | cancelled"]
  payment_reference varchar(255)
  purchased_at timestamp
  created_at timestamp
  updated_at timestamp
}

Table purchase_seats {
  id bigint [pk, increment, not null]
  purchase_id bigint [not null]
  seat_id bigint [not null]
  screening_id bigint [not null]
  price_paid decimal(10,2) [not null]
  status varchar(20) [default: "active", note: "active | cancelled"]

  indexes {
    (seat_id, screening_id) [unique, note: "garantiza no doble reserva"]
  }
}

Table tickets {
  id bigint [pk, increment, not null]
  purchase_seat_id bigint [unique, not null]
  ticket_code varchar(100) [unique, not null]
  qr_data text
  status varchar(20) [default: "valid", note: "valid | used | cancelled"]
  used_at timestamp
  generated_at timestamp [not null]
  created_at timestamp
  updated_at timestamp
}

Table purchase_promotions {
  id bigint [pk, increment, not null]
  purchase_id bigint [not null]
  promotion_id bigint [not null]
  discount_applied decimal(10,2) [not null]
}

// ==========================================
// REFERENCIAS
// ==========================================

Ref: users.role_id > roles.id
Ref: role_permissions.role_id > roles.id [delete: cascade]
Ref: role_permissions.permission_id > permissions.id [delete: cascade]
Ref: movies.genre_id > genres.id [delete: set null]
Ref: seats.room_id > rooms.id [delete: cascade]
Ref: seats.seat_type_id > seat_types.id
Ref: screenings.movie_id > movies.id
Ref: screenings.room_id > rooms.id
Ref: seat_pricing.screening_id > screenings.id [delete: cascade]
Ref: seat_pricing.seat_type_id > seat_types.id
Ref: purchases.user_id > users.id
Ref: purchases.screening_id > screenings.id
Ref: purchases.payment_method_id > payment_methods.id
Ref: purchase_seats.purchase_id > purchases.id [delete: cascade]
Ref: purchase_seats.seat_id > seats.id
Ref: purchase_seats.screening_id > screenings.id
Ref: tickets.purchase_seat_id - purchase_seats.id
Ref: purchase_promotions.purchase_id > purchases.id [delete: cascade]
Ref: purchase_promotions.promotion_id > promotions.id
```

---

# Endpoints Sugeridos

## Auth
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
POST   /api/auth/verify-email/{id}/{hash}
```

## Películas (público)
```
GET    /api/movies                    # listado con filtros (genre, status, search)
GET    /api/movies/{id}               # detalle + screenings activos
GET    /api/movies/{id}/screenings    # funciones disponibles de una película
```

## Películas (admin)
```
POST   /api/admin/movies
PUT    /api/admin/movies/{id}
DELETE /api/admin/movies/{id}
```

## Funciones
```
GET    /api/screenings/{id}           # detalle + mapa de asientos con disponibilidad
GET    /api/screenings/{id}/seats     # asientos con status (disponible/ocupado)
POST   /api/admin/screenings
PUT    /api/admin/screenings/{id}
DELETE /api/admin/screenings/{id}
PATCH  /api/admin/screenings/{id}/status
```

## Salas (admin)
```
GET    /api/admin/rooms
POST   /api/admin/rooms
PUT    /api/admin/rooms/{id}
DELETE /api/admin/rooms/{id}
GET    /api/admin/rooms/{id}/seats
POST   /api/admin/rooms/{id}/seats/bulk
```

## Compras
```
POST   /api/purchases                 # crear compra (con asientos, promo opcional)
GET    /api/purchases/{id}            # detalle de compra propia
GET    /api/purchases                 # historial del usuario autenticado
POST   /api/purchases/{id}/cancel
GET    /api/purchases/{id}/tickets    # tickets de una compra
```

## Tickets
```
GET    /api/tickets/{ticket_code}     # validar ticket (para entrada)
PATCH  /api/tickets/{ticket_code}/use # marcar como usado (staff)
```

## Promociones
```
POST   /api/promotions/validate       # validar código antes de compra
GET    /api/admin/promotions
POST   /api/admin/promotions
PUT    /api/admin/promotions/{id}
DELETE /api/admin/promotions/{id}
```

## Reportes (admin)
```
GET    /api/admin/reports/sales       # ventas por período
GET    /api/admin/reports/occupancy   # ocupación por sala/función
GET    /api/admin/reports/revenue     # ingresos por película/período
```

## Catálogos (admin)
```
GET|POST|PUT|DELETE   /api/admin/genres
GET|POST|PUT|DELETE   /api/admin/seat-types
GET|POST              /api/admin/payment-methods
```

---

# Operaciones CRUD por Módulo

| Módulo | Create | Read | Update | Delete | Notas |
|--------|--------|------|--------|--------|-------|
| Usuarios | Registro | Perfil, listado admin | Datos personales | Soft delete | No borrado físico |
| Películas | POST admin | GET público | PUT admin | Soft delete | Requiere género |
| Géneros | POST admin | GET público | PUT admin | DELETE (si sin pelis) | Catálogo |
| Salas | POST admin | GET admin | PUT admin | — | Requiere salas vacías |
| Asientos | POST bulk | GET por sala | PATCH status | — | Solo admin |
| Funciones | POST admin | GET público | PUT admin | Solo si sin compras | Valida solapamiento |
| Compras | POST usuario | GET propio | — | Cancelación controlada | Transacción atómica |
| Tickets | Auto (post-pago) | GET por código | PATCH used | — | Inmutable |
| Promociones | POST admin | GET admin | PUT admin | Soft deactivate | Validar vigencia |

---

# Roles y Permisos

| Permiso | `admin` | `cashier` | `client` |
|---------|---------|-----------|---------|
| `movies.view` | ✓ | ✓ | ✓ |
| `movies.create` | ✓ | — | — |
| `movies.edit` | ✓ | — | — |
| `movies.delete` | ✓ | — | — |
| `screenings.view` | ✓ | ✓ | ✓ |
| `screenings.manage` | ✓ | — | — |
| `rooms.manage` | ✓ | — | — |
| `seats.view` | ✓ | ✓ | ✓ |
| `seats.manage` | ✓ | — | — |
| `purchases.create` | ✓ | ✓ | ✓ |
| `purchases.view_all` | ✓ | ✓ | — |
| `purchases.view_own` | ✓ | ✓ | ✓ |
| `purchases.cancel` | ✓ | ✓ | ✓ (solo la propia) |
| `tickets.validate` | ✓ | ✓ | — |
| `tickets.use` | ✓ | ✓ | — |
| `promotions.manage` | ✓ | — | — |
| `reports.view` | ✓ | — | — |
| `users.manage` | ✓ | — | — |
| `roles.manage` | ✓ | — | — |

---

# Recomendaciones Técnicas

## Índices prioritarios

```sql
-- Búsquedas frecuentes de cartelera
CREATE INDEX idx_movies_status ON movies (status, deleted_at);
CREATE INDEX idx_movies_genre ON movies (genre_id);

-- Funciones activas por película
CREATE INDEX idx_screenings_movie_start ON screenings (movie_id, start_time, status);
CREATE INDEX idx_screenings_room_time ON screenings (room_id, start_time);

-- Disponibilidad de asientos (consulta crítica de rendimiento)
CREATE UNIQUE INDEX idx_purchase_seats_unique ON purchase_seats (seat_id, screening_id);
CREATE INDEX idx_purchase_seats_screening ON purchase_seats (screening_id, status);

-- Historial de compras por usuario
CREATE INDEX idx_purchases_user ON purchases (user_id, created_at DESC);

-- Validación de tickets
CREATE UNIQUE INDEX idx_tickets_code ON tickets (ticket_code);
CREATE INDEX idx_tickets_status ON tickets (status);
```

## Seguridad

- **Autenticación:** Laravel Sanctum (SPA tokens) o Passport (OAuth2) para JWT
- **Autorización:** Policies de Laravel para cada modelo
- **Rate limiting:** `throttle:60,1` en login; `throttle:10,1` en compras
- **SQL Injection:** Siempre usar Eloquent ORM / Query Builder parametrizado
- **XSS:** React escapa por defecto; validar en backend con `strip_tags()`
- **CORS:** Configurar `config/cors.php` para el origen React específico
- **Cifrado:** Datos de pago nunca almacenar; usar tokenización del gateway
- **ticket_code:** Generar con `Str::uuid()` o NANOID (21 caracteres, URL-safe)

## Escalabilidad

- **Condición de carrera en reservas:** Usar `DB::transaction()` + `SELECT ... FOR UPDATE` en `purchase_seats`; considerar Redis con SETNX para lock distribuido en alta concurrencia
- **Caché de disponibilidad:** Cachear mapa de asientos en Redis con TTL de 30 segundos e invalidar en cada reserva confirmada
- **Colas para tickets:** Generar tickets mediante Jobs de Laravel Queue (no en request síncrono)
- **Imágenes:** Almacenar posters en S3/Cloudflare R2; guardar solo la URL en BD
- **Paginación:** Usar cursor pagination en listados grandes (`cursorPaginate()`)
- **Soft deletes:** Mantener en tablas con historial (users, movies); evitar en tablas de alto volumen

## Campos de auditoría recomendados

Para tablas críticas (`purchases`, `tickets`, `screenings`, `movies`), añadir:

```sql
created_by  BIGINT UNSIGNED   FK → users.id  -- quién creó el registro
updated_by  BIGINT UNSIGNED   FK → users.id  -- quién fue el último en modificar
```

Implementar con un `Observer` de Laravel que se auto-registre en `AppServiceProvider`.

## Normalización

El esquema está en **3FN** (Tercera Forma Normal):
- 1FN: todos los campos son atómicos
- 2FN: no hay dependencias parciales de la PK compuesta
- 3FN: no hay dependencias transitivas (`seat_pricing` separa el precio del tipo de asiento, evitando redundancia en `screenings`)

El único campo denormalizado intencional es `purchase_seats.screening_id` (también referenciado desde `purchases.screening_id`), justificado para evitar joins costosos en validación de unicidad de asiento.

## Riesgos identificados

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Doble reserva de asiento | Alta | Crítico | UNIQUE constraint + SELECT FOR UPDATE |
| Overflow de `uses_count` en promos | Media | Alto | Incremento atómico con `DB::statement('UPDATE ... WHERE uses_count < max_uses')` |
| Tickets generados sin pago confirmado | Media | Alto | Observer en `purchases` que solo dispara Job si `payment_status = completed` |
| N+1 en mapa de asientos | Alta | Medio | Eager loading: `with(['seat.seatType', 'purchaseSeats'])` |
| Salas sin asientos asociados | Baja | Medio | Validación en `ScreeningRequest`: verificar `seats.count() > 0` para la sala |
