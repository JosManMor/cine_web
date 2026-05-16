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

### 1.1 Registro de Usuariov

**Endpoint:** `POST /register`
v
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
  "message": "Código de verificación enviado al correo.",
  "email": "juan@example.com"
}
```

### 1.2 Verificación de Registro (OTP)

**Endpoint:** `POST /register/verify`

**Cuerpo de la solicitud (JSON):**

```json
{
  "email": "juan@example.com",
  "code": "48271"
}
```

**Respuesta exitosa (200 OK):**

```json
{
  "message": "Cuenta verificada con éxito.",
  "user": {
    "id": 1,
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "role": "user"
  }
}
```

### 1.3 Inicio de Sesión

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
    "role": "user"
  },
  "token": "..."
}
```

### 1.4 Cerrar Sesión

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
    "duration": "2h 18m",
    "rating": "8.4",
    "image": "https://cine-sendera.com/images/inferno-nexus.jpg",
    "color": "#E50914",
    "available_seats": 48,
    "total_seats": 120
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
  "duration": "2h 18m",
  "rating": "8.4",
  "image": "https://cine-sendera.com/images/inferno-nexus.jpg",
  "color": "#E50914",
  "synopsis": "Un ex-agente infiltrado debe detener una conspiración global...",
  "cast": "Marco Reyes, Ana Villanueva, Luis Serrano",
  "schedule": ["14:00", "17:30", "21:00"],
  "available_seats": 48,
  "total_seats": 120
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
  "movie_id": 1,
  "schedule": "17:30",
  "seats": ["A3", "A4"],
  "total": 180.0
}
```

**Respuesta exitosa (201 Created):**

```json
{
  "message": "Compra realizada con éxito.",
  "purchase_id": 501,
  "ticket_code": "SNDR-2025-7A3F"
}
```

### 3.2 Obtener Ticket

**Endpoint:** `GET /tickets/{code}`
**Seguridad:** Requiere autenticación.

**Respuesta exitosa (200 OK):**

```json
{
  "ticket_code": "SNDR-2025-7A3F",
  "movie_title": "Inferno Nexus",
  "schedule": "17:30",
  "room": "Sala 1",
  "seats": ["A3", "A4"],
  "user_name": "Juan Pérez",
  "total": 180.0,
  "generated_at": "2025-07-25 10:30:00"
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
    "sold": 104
  },
  "weekly_sales": [
    {"day": "Lun", "value": 42},
    {"day": "Mar", "value": 68},
    ...
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
    "movie_title": "Inferno Nexus",
    "occupancy_pct": 87,
    "available_seats": 48,
    "next_schedule": "14:00"
  }
]
```
