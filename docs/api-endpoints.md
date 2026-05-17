# Documentación de la API — Cine Sendera

---

## 0. Estándares de la API

| Atributo | Valor |
|---|---|
| Base URL | `/api` |
| Formato | JSON (`Content-Type: application/json`, `Accept: application/json`) |
| Autenticación | Laravel Sanctum — Bearer Token |
| Idioma de claves | Inglés |
| Idioma de valores | Español |

### Niveles de protección

| Nivel | Header requerido | Condición extra |
|---|---|---|
| Público | — | — |
| Autenticado | `Authorization: Bearer <token>` | Token Sanctum válido |
| Verificado | `Authorization: Bearer <token>` | + `email_verified_at` no nulo |
| Admin | `Authorization: Bearer <token>` | + `role = admin` |

### Respuestas de error comunes

| Código | Causa |
|---|---|
| 401 | Token ausente, inválido o revocado |
| 403 | Acción no permitida (firma inválida, correo no verificado, rol insuficiente) |
| 422 | Validación fallida — `{ "message": "...", "errors": { "campo": ["..."] } }` |
| 429 | Rate limit superado |

---

## 1. Autenticación

### 1.1 Registro de Usuario

**`POST /register`** — Público

Crea la cuenta con rol `client`, emite un Bearer Token y envía automáticamente un correo de verificación. El token es válido de inmediato para rutas públicas y de verificación; las rutas que exigen `verified` permanecen bloqueadas hasta confirmar el correo.

**Body:**
```json
{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "password": "password123",
  "password_confirmation": "password123"
}
```

| Campo | Reglas |
|---|---|
| `name` | requerido, string, máx. 255 |
| `email` | requerido, email único |
| `password` | requerido, mín. 8 caracteres, confirmado |

**201 Created:**
```json
{
  "user": {
    "id": 1,
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "role": "client"
  },
  "token": "1|abc123..."
}
```

**422** — email ya registrado u otro campo inválido.

---

### 1.2 Inicio de Sesión

**`POST /login`** — Público · `throttle:5,1`

**Body:**
```json
{
  "email": "juan@example.com",
  "password": "password123"
}
```

**200 OK:**
```json
{
  "user": {
    "id": 1,
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "role": "client"
  },
  "token": "2|xyz789..."
}
```

**401** — credenciales incorrectas:
```json
{ "message": "Credenciales incorrectas." }
```

---

### 1.3 Cierre de Sesión

**`POST /logout`** — Autenticado

Revoca únicamente el token usado en la request. El resto de sesiones activas del usuario no se ven afectadas.

**200 OK:**
```json
{ "message": "Sesión cerrada correctamente." }
```

---

### 1.4 Reenviar Correo de Verificación

**`POST /email/verification-notification`** — Autenticado · `throttle:6,1`

Genera un nuevo enlace firmado y lo envía al email del usuario. El enlace apunta al frontend (`FRONTEND_URL/email/verify?...`), no directamente a la API.

**200 OK** (correo enviado):
```json
{ "message": "Correo de verificación enviado." }
```

**204 No Content** — el correo ya estaba verificado, sin cuerpo.

---

### 1.5 Verificar Correo Electrónico

**`GET /email/verify/{id}/{hash}`** — Autenticado · URL firmada (`signed`) · `throttle:6,1`

El frontend llama a este endpoint después de extraer los parámetros del enlace recibido en el correo. Requiere el Bearer Token ya almacenado en el cliente.

| Parámetro | Tipo | Origen | Descripción |
|---|---|---|---|
| `id` | path | URL | ID del usuario |
| `hash` | path | URL | `sha1($user->email)` |
| `expires` | query | URL | Timestamp UNIX de expiración (60 min) |
| `signature` | query | URL | Firma HMAC-SHA256 generada por Laravel |

**200 OK:**
```json
{ "message": "Correo verificado correctamente." }
```

**403** — firma inválida, enlace expirado o hash que no coincide con el email actual.

**401** — token ausente.

---

### Flujo completo de verificación

```
POST /api/register
  │
  ├─→ Respuesta inmediata: { user, token }
  │   El token funciona para rutas públicas y de verificación.
  │
  └─→ Email enviado a juan@example.com
        Enlace: http://frontend:5173/email/verify
                ?id=1
                &hash=<sha1(email)>
                &expires=<timestamp>
                &signature=<hmac>

  Usuario hace clic en el enlace
  │
  └─→ Frontend carga /email/verify, lee los query params
        └─→ GET /api/email/verify/1/<hash>?expires=...&signature=...
              Authorization: Bearer <token almacenado>
              │
              ├─→ 200 OK → email_verified_at seteado
              │   Frontend redirige a la cartelera con acceso completo.
              │
              └─→ 403 → enlace expirado
                  Frontend llama a POST /api/email/verification-notification
                  para generar un nuevo enlace.
```

---

## 2. Cartelera y Películas

### 2.1 Listar Películas

**`GET /movies`** — Público

**200 OK:**
```json
[
  {
    "id": 1,
    "title": "Inferno Nexus",
    "genre": "Acción",
    "duration_minutes": 138,
    "rating": "PG-13",
    "poster_url": "https://cine-sendera.com/images/inferno-nexus.jpg",
    "status": "active"
  }
]
```

---

### 2.2 Detalle de Película

**`GET /movies/{id}`** — Público

**200 OK:**
```json
{
  "id": 1,
  "title": "Inferno Nexus",
  "genre": "Acción",
  "duration_minutes": 138,
  "rating": "PG-13",
  "poster_url": "https://cine-sendera.com/images/inferno-nexus.jpg",
  "synopsis": "Un ex-agente infiltrado debe detener una conspiración global...",
  "director": "María Castillo",
  "status": "active",
  "screenings": [
    {
      "id": 12,
      "start_time": "2025-07-25 14:00:00",
      "format": "2D",
      "language_type": "subtitled",
      "base_price": 90.00,
      "status": "open",
      "room": {
        "id": 1,
        "name": "Sala 1",
        "total_seats": 120,
        "available_seats": 48
      }
    }
  ]
}
```

---

## 3. Compras y Tickets

### 3.1 Crear Compra

**`POST /purchases`** — Verificado

**Body:**
```json
{
  "screening_id": 12,
  "seats": [
    { "row": "A", "seat_number": 3 },
    { "row": "A", "seat_number": 4 }
  ],
  "payment_method": "card",
  "total_amount": 180.00
}
```

**201 Created:**
```json
{
  "message": "Compra registrada. En espera de confirmación de pago.",
  "purchase_id": 501,
  "payment_status": "pending"
}
```

> `ticket_code` no se incluye en esta respuesta. Se asigna mediante un Observer/Job cuando `payment_status` cambia a `completed`. Los tickets se consultan con `GET /tickets/{ticket_code}`.

**409 Conflict** — asiento ya reservado por otra transacción concurrente.

---

### 3.2 Obtener Ticket

**`GET /tickets/{ticket_code}`** — Verificado

**200 OK:**
```json
{
  "ticket_code": "SNDR-2025-7A3F",
  "status": "active",
  "movie_title": "Inferno Nexus",
  "start_time": "2025-07-25 17:30:00",
  "format": "2D",
  "language_type": "subtitled",
  "room": "Sala 1",
  "row": "A",
  "seat_number": 3,
  "price_paid": 90.00,
  "user_name": "Juan Pérez",
  "purchased_at": "2025-07-25 10:30:00"
}
```

---

## 4. Administración (Dashboard)

### 4.1 Métricas Generales

**`GET /admin/metrics`** — Admin

**200 OK:**
```json
{
  "tickets_sold": 247,
  "daily_sales": 20995.00,
  "registered_users": 1482,
  "top_movie": {
    "title": "Inferno Nexus",
    "tickets_sold": 104
  },
  "weekly_sales": [
    { "day": "Lun", "value": 42 },
    { "day": "Mar", "value": 68 }
  ]
}
```

---

### 4.2 Actividad Reciente

**`GET /admin/activity`** — Admin

**200 OK:**
```json
[
  {
    "type": "success",
    "message": "Compra exitosa — Inferno Nexus",
    "time": "hace 2 min"
  },
  {
    "type": "error",
    "message": "Intento de acceso fallido bloqueado",
    "time": "hace 2 h"
  }
]
```

---

### 4.3 Estado de Salas

**`GET /admin/rooms`** — Admin

**200 OK:**
```json
[
  {
    "room": "Sala 1",
    "movie_title": "Inferno Nexus",
    "occupancy_pct": 87,
    "available_seats": 16,
    "next_start_time": "2025-07-25 14:00:00"
  }
]
```
