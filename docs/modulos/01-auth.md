# Módulo 01 — Autenticación

Registro, inicio de sesión y cierre de sesión. Todos los demás módulos dependen de saber si el usuario está autenticado y qué rol tiene (`admin`, `cashier`, `client`).

---

## Frontend

### Páginas

No existe una página exclusiva de dashboard post-login; tras autenticarse el usuario regresa a la cartelera con su sesión activa.

| Ruta | Descripción |
|---|---|
| `/register` | Formulario de registro |
| `/login` | Formulario de inicio de sesión |

### Componentes

- `RegisterForm` — campos: nombre, email, contraseña, confirmación.
- `LoginForm` — campos: email, contraseña.
- `AuthGuard` — wrapper que redirige a `/login` si el usuario no está autenticado.

### Estado global

El token y los datos del usuario (`id`, `name`, `role`) se guardan en Context API o Redux al recibir la respuesta del login/registro y se limpian al hacer logout.

---

## Backend

### Archivos involucrados

| Capa | Archivo |
|---|---|
| Controller | `Http/Controllers/Auth/AuthController.php` |
| Requests | `Http/Requests/Auth/RegisterRequest.php`, `LoginRequest.php` |
| Service | `Services/AuthService.php` |
| Model | `Models/User.php` |

### Modelo `User`

Campos relevantes: `id`, `name`, `email`, `password`, `role` (ENUM: `admin`, `cashier`, `client`), `phone`, `status`, `created_at`.

Sin soft delete — para desactivar un usuario usar `status = 'inactive'`.

### Seguridad

- Contraseñas con `Hash::make()` (bcrypt / argon2id).
- Autenticación vía Laravel Sanctum (Bearer Token).
- Rate limiting: `throttle:5,1` en rutas de login.

---

## API

### POST `/register`

**Body:**
```json
{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "password": "password123",
  "password_confirmation": "password123"
}
```

**Respuesta 201:**
```json
{
  "user": { "id": 1, "name": "Juan Pérez", "email": "juan@example.com", "role": "client" },
  "token": "..."
}
```

---

### POST `/login`

**Body:**
```json
{ "email": "juan@example.com", "password": "password123" }
```

**Respuesta 200:**
```json
{
  "user": { "id": 1, "name": "Juan Pérez", "email": "juan@example.com", "role": "client" },
  "token": "..."
}
```

---

### POST `/logout`

**Seguridad:** Bearer Token requerido.

**Respuesta 200:**
```json
{ "message": "Sesión cerrada correctamente." }
```
