# Documentación de la API — Cine Sendera

Este documento detalla los endpoints de la API REST para el sistema de Cine Sendera, basados en el prototipo del frontend y la arquitectura del backend.

---

## 0. Estándares de la API

- **Base URL:** `/api`
- **Formato de datos:** JSON
- **Autenticación:** Laravel Sanctum (Bearer Token) o Sessions (para web tradicional).
- **Idioma de las claves:** Inglés.
- **Idioma de los valores (Contenido):** Español.

---

## 1. Autenticación

### 1.1 Registro de Usuario

**Endpoint:** `POST /register`

**Cuerpo de la solicitud (JSON):**

```json
{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "password": "password123",
  "password_confirmation": "password123"
}
```

**Respuesta exitosa (201 Created):**

```json
{
  "user": {
    "id": 1,
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "role": "client"
  },
  "token": "..."
}
```

### 1.2 Inicio de Sesión

**Endpoint:** `POST /login`

**Cuerpo de la solicitud (JSON):**

```json
{
  "email": "juan@example.com",
  "password": "password123"
}
```

**Respuesta exitosa (200 OK):**

```json
{
  "user": {
    "id": 1,
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "role": "client"
  },
  "token": "..."
}
```

### 1.3 Cerrar Sesión

**Endpoint:** `POST /logout`
**Seguridad:** Requiere autenticación.

**Respuesta exitosa (200 OK):**

```json
{ "message": "Sesión cerrada correctamente." }
```

---

## 2. Cartelera y Películas

### 2.1 Listar Películas

**Endpoint:** `GET /movies`

**Respuesta exitosa (200 OK):**

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

### 2.2 Detalle de Película

**Endpoint:** `GET /movies/{id}`

**Respuesta exitosa (200 OK):**

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

**Endpoint:** `POST /purchases`
**Seguridad:** Requiere autenticación.

**Cuerpo de la solicitud (JSON):**

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

**Respuesta exitosa (201 Created):**

```json
{
  "message": "Compra registrada. En espera de confirmación de pago.",
  "purchase_id": 501,
  "payment_status": "pending"
}
```

> Los `ticket_code` **no se incluyen aquí**. Se asignan mediante un Observer/Job cuando el pago se confirma (`payment_status = completed`). Una vez confirmados, los tickets se consultan con `GET /tickets/{ticket_code}` o desde el historial del usuario.

### 3.2 Obtener Ticket

**Endpoint:** `GET /tickets/{ticket_code}`
**Seguridad:** Requiere autenticación.

**Respuesta exitosa (200 OK):**

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

**Endpoint:** `GET /admin/metrics`
**Seguridad:** Requiere rol `admin`.

**Respuesta exitosa (200 OK):**

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
    {"day": "Lun", "value": 42},
    {"day": "Mar", "value": 68}
  ]
}
```

### 4.2 Actividad Reciente

**Endpoint:** `GET /admin/activity`
**Seguridad:** Requiere rol `admin`.

**Respuesta exitosa (200 OK):**

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

### 4.3 Estado de Salas

**Endpoint:** `GET /admin/rooms`
**Seguridad:** Requiere rol `admin`.

**Respuesta exitosa (200 OK):**

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
