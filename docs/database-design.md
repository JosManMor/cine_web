# Diseño de Base de Datos — Cine Sendera

Sistema de simulación de cartelera y venta de entradas. Permite explorar películas, seleccionar asientos, comprar entradas y recibir tickets digitales. Incluye panel administrativo para gestión de películas, funciones y reportes básicos.

**Stack:** React (SPA) + Laravel 13 (PHP 8.3) + MySQL 8 + REST API

---

## Decisiones de diseño

| Decisión | Justificación |
|---|---|
| Sin tabla `seats` | Todas las salas comparten el mismo esquema de asientos (filas × columnas). El mapa se calcula desde `rooms.rows` y `rooms.seats_per_row`; no tiene sentido pre-poblar miles de registros. |
| Solo se almacenan asientos **ocupados** | `purchase_seats` actúa como tabla de ocupación. Un asiento libre es simplemente uno que no aparece en esta tabla para esa función. |
| `role` como ENUM en `users` | Tres roles fijos (admin, cashier, client). Un sistema de permisos granular es sobre-ingeniería para una simulación. |
| `genre` como VARCHAR en `movies` | Catálogo estático y sin relaciones cruzadas; no justifica tabla separada. |
| Sin `promotions` ni `payment_methods` | Fuera del alcance de la simulación. |
| Sin tabla `tickets` | Un asiento comprado y un ticket son lo mismo en el prototipo. `ticket_code` y el estado (used) se mueven directamente a `purchase_seats`. El QR se genera en tiempo real a partir del código; no hay nada que persistir. |
| Sin soft delete | Para desactivar un usuario o película basta con el campo `status`. El borrado lógico complica las consultas sin aportar al prototipo. |
| Sin `end_time` en `screenings` | Dato calculable: `start_time + movies.duration_minutes`. Persistirlo obliga a mantenerlo sincronizado manualmente. |
| `timestamps()` en entidades mutables | `users`, `movies`, `rooms` y `screenings` incluyen `created_at` y `updated_at` para auditoría de cambios de estado (rol, cancelación, desactivación). `purchase_seats` no los tiene: es una tabla de ocupación inmutable una vez creada. |
| `email_verified_at` en `users` | Requerido por `MustVerifyEmail` de Laravel. Permite proteger rutas sensibles (ej. compras) con el middleware `verified`. |
| Sin `remember_token` | La autenticación usa Sanctum Bearer Token; no se usan sesiones persistentes de browser. |

---

## Esquema — 6 tablas de negocio + 1 de infraestructura

### users

| Campo | Tipo | Restricciones |
|---|---|---|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT |
| name | VARCHAR(255) | NOT NULL |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| password | VARCHAR(255) | NOT NULL |
| role | ENUM | NOT NULL DEFAULT `client` → `admin`, `cashier`, `client` |
| phone | VARCHAR(20) | NULLABLE |
| status | ENUM | NOT NULL DEFAULT `active` → `active`, `inactive` |
| email_verified_at | TIMESTAMP | NULLABLE |
| created_at | TIMESTAMP | — |
| updated_at | TIMESTAMP | — |

---

### password_reset_tokens

Tabla de infraestructura de Laravel para el flujo de recuperación de contraseña.

| Campo | Tipo | Restricciones |
|---|---|---|
| email | VARCHAR(255) | PK |
| token | VARCHAR(255) | NOT NULL |
| created_at | TIMESTAMP | NULLABLE |

---

### movies

| Campo | Tipo | Restricciones |
|---|---|---|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT |
| title | VARCHAR(255) | NOT NULL |
| genre | VARCHAR(100) | NULLABLE |
| synopsis | TEXT | NULLABLE |
| duration_minutes | SMALLINT UNSIGNED | NOT NULL |
| director | VARCHAR(255) | NULLABLE |
| rating | VARCHAR(10) | NOT NULL → G, PG, PG-13, R |
| poster_url | VARCHAR(500) | NULLABLE |
| status | ENUM | NOT NULL DEFAULT `active` → `active`, `inactive`, `coming_soon` |
| created_at | TIMESTAMP | — |
| updated_at | TIMESTAMP | — |

---

### rooms

El layout de asientos se define aquí. No hay tabla de asientos individuales.

| Campo | Tipo | Restricciones |
|---|---|---|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT |
| name | VARCHAR(100) | NOT NULL → "Sala 1", "Sala VIP" |
| rows | TINYINT UNSIGNED | NOT NULL → cantidad de filas (A, B, C…) |
| seats_per_row | TINYINT UNSIGNED | NOT NULL → asientos por fila |
| status | ENUM | DEFAULT `active` → `active`, `maintenance` |
| created_at | TIMESTAMP | — |
| updated_at | TIMESTAMP | — |

**Capacidad total:** `rows × seats_per_row` (calculado, no almacenado).

---

### screenings

| Campo | Tipo | Restricciones |
|---|---|---|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT |
| movie_id | BIGINT UNSIGNED | FK → movies.id, NOT NULL |
| room_id | BIGINT UNSIGNED | FK → rooms.id, NOT NULL |
| start_time | DATETIME | NOT NULL |
| base_price | DECIMAL(10,2) | NOT NULL |
| format | ENUM | DEFAULT `2D` → `2D`, `3D`, `IMAX` |
| language_type | ENUM | DEFAULT `subtitled` → `original`, `dubbed`, `subtitled` |
| status | ENUM | DEFAULT `scheduled` → `scheduled`, `open`, `sold_out`, `cancelled`, `finished` |
| created_at | TIMESTAMP | — |
| updated_at | TIMESTAMP | — |

---

### purchases

| Campo | Tipo | Restricciones |
|---|---|---|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT |
| user_id | BIGINT UNSIGNED | FK → users.id, NOT NULL |
| screening_id | BIGINT UNSIGNED | FK → screenings.id, NOT NULL |
| total_amount | DECIMAL(10,2) | NOT NULL |
| payment_method | ENUM | NULLABLE → `cash`, `card`, `online` |
| payment_status | ENUM | DEFAULT `pending` → `pending`, `completed`, `failed`, `refunded` |
| purchase_status | ENUM | DEFAULT `active` → `active`, `cancelled` |
| created_at | TIMESTAMP | — |
| updated_at | TIMESTAMP | — |

---

### purchase_seats

**Tabla de ocupación y tickets.** Solo contiene asientos reservados; los libres no existen como registros. El `ticket_code` se asigna al confirmar el pago; el QR se genera en tiempo real a partir de él.

| Campo | Tipo | Restricciones |
|---|---|---|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT |
| purchase_id | BIGINT UNSIGNED | FK → purchases.id, NOT NULL |
| screening_id | BIGINT UNSIGNED | FK → screenings.id, NOT NULL |
| row | CHAR(2) | NOT NULL → "A", "B", … |
| seat_number | TINYINT UNSIGNED | NOT NULL → 1, 2, 3… |
| price_paid | DECIMAL(10,2) | NOT NULL (precio histórico) |
| ticket_code | VARCHAR(100) | UNIQUE, NULLABLE (se asigna al completar el pago) |
| status | ENUM | DEFAULT `active` → `active`, `cancelled`, `used` |
| **UNIQUE** | — | **(screening_id, row, seat_number)** |

> El constraint UNIQUE en `(screening_id, row, seat_number)` es **la garantía de nivel de BD contra doble reserva**. La lógica de reserva debe ejecutarse dentro de una transacción **intentando insertar** en `purchase_seats` y manejando una posible violación de UNIQUE si otra transacción reservó ese asiento primero. Como alternativa, puede bloquearse una fila padre existente (por ejemplo, en `screenings`) antes de insertar; no debe asumirse que `SELECT ... FOR UPDATE` sobre este par siempre serializa la inserción cuando el asiento aún no existe.

`screening_id` está denormalizado aquí (ya existe en `purchases`) para poder aplicar el constraint UNIQUE directamente sin joins.

---

## Relaciones

```
users         1 ──── * purchases
movies        1 ──── * screenings
rooms         1 ──── * screenings
purchases     1 ──── * purchase_seats
screenings    1 ──── * purchase_seats
```

---

## Reglas de negocio críticas

1. **No doble reserva:** UNIQUE `(screening_id, row, seat_number)` en `purchase_seats` + `DB::transaction()` + `lockForUpdate()`.
2. **Asiento válido:** Antes de insertar en `purchase_seats`, verificar que `row` ∈ `[A .. chr(A + rooms.rows - 1)]` y `seat_number` ∈ `[1 .. rooms.seats_per_row]`.
3. **Ticket post-pago:** Asignar `ticket_code` (UUID o código único) a cada `purchase_seat` cuando `purchases.payment_status = 'completed'`. Nunca inline en el request de compra.
4. **Precio histórico:** `purchase_seats.price_paid` almacena el precio pagado; no recalcular desde `screenings.base_price`.
5. **Desactivación sin borrado:** Usar `status = 'inactive'` en `users` y `movies` para preservar el historial de compras. No hay soft delete.
6. **Cancelación:** Actualizar `purchase_status = 'cancelled'` en `purchases` y `status = 'cancelled'` en `purchase_seats` correspondientes.
7. **Función sold_out:** Una función pasa a `sold_out` cuando el conteo de `purchase_seats` activos para ese `screening_id` alcanza `rooms.rows × rooms.seats_per_row`.

---

## Índices recomendados

```sql
-- Cartelera activa
CREATE INDEX idx_movies_status ON movies (status);

-- Funciones por película y tiempo
CREATE INDEX idx_screenings_movie_start ON screenings (movie_id, start_time, status);

-- Disponibilidad de asientos (consulta más frecuente en el flujo de compra)
CREATE UNIQUE INDEX idx_purchase_seats_unique ON purchase_seats (screening_id, row, seat_number);
CREATE INDEX idx_purchase_seats_screening ON purchase_seats (screening_id, status);

-- Historial de compras por usuario
CREATE INDEX idx_purchases_user ON purchases (user_id, created_at DESC);

-- Validación de tickets en entrada
CREATE UNIQUE INDEX idx_purchase_seats_ticket ON purchase_seats (ticket_code);
```

---

## DER (dbdiagram.io)

```sql
Table users {
  id bigint [pk, increment]
  name varchar(255) [not null]
  email varchar(255) [unique, not null]
  password varchar(255) [not null]
  role varchar(20) [not null, default: "client", note: "admin | cashier | client"]
  phone varchar(20)
  status varchar(20) [not null, default: "active", note: "active | inactive"]
  email_verified_at timestamp
  created_at timestamp
  updated_at timestamp
}

Table password_reset_tokens {
  email varchar(255) [pk]
  token varchar(255) [not null]
  created_at timestamp
}

Table movies {
  id bigint [pk, increment]
  title varchar(255) [not null]
  genre varchar(100)
  synopsis text
  duration_minutes smallint [not null]
  director varchar(255)
  rating varchar(10) [not null, note: "G | PG | PG-13 | R"]
  poster_url varchar(500)
  status varchar(20) [not null, default: "active", note: "active | inactive | coming_soon"]
  created_at timestamp
  updated_at timestamp
}

Table rooms {
  id bigint [pk, increment]
  name varchar(100) [not null]
  rows tinyint [not null]
  seats_per_row tinyint [not null]
  status varchar(20) [default: "active", note: "active | maintenance"]
  created_at timestamp
  updated_at timestamp
}

Table screenings {
  id bigint [pk, increment]
  movie_id bigint [not null]
  room_id bigint [not null]
  start_time datetime [not null]
  base_price decimal(10,2) [not null]
  format varchar(10) [default: "2D", note: "2D | 3D | IMAX"]
  language_type varchar(20) [default: "subtitled", note: "original | dubbed | subtitled"]
  status varchar(20) [default: "scheduled", note: "scheduled | open | sold_out | cancelled | finished"]
  created_at timestamp
  updated_at timestamp
}

Table purchases {
  id bigint [pk, increment]
  user_id bigint [not null]
  screening_id bigint [not null]
  total_amount decimal(10,2) [not null]
  payment_method varchar(20) [note: "cash | card | online"]
  payment_status varchar(20) [default: "pending", note: "pending | completed | failed | refunded"]
  purchase_status varchar(20) [default: "active", note: "active | cancelled"]
  created_at timestamp
  updated_at timestamp
}

Table purchase_seats {
  id bigint [pk, increment]
  purchase_id bigint [not null]
  screening_id bigint [not null]
  row char(2) [not null]
  seat_number tinyint [not null]
  price_paid decimal(10,2) [not null]
  ticket_code varchar(100) [unique]
  status varchar(20) [default: "active", note: "active | cancelled | used"]

  indexes {
    (screening_id, row, seat_number) [unique, note: "garantiza no doble reserva"]
  }
}

Ref: purchases.user_id > users.id
Ref: purchases.screening_id > screenings.id
Ref: screenings.movie_id > movies.id
Ref: screenings.room_id > rooms.id
Ref: purchase_seats.purchase_id > purchases.id [delete: cascade]
Ref: purchase_seats.screening_id > screenings.id
```
