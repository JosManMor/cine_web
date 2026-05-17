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

Campos relevantes: `id`, `name`, `email`, `password`, `role` (ENUM: `admin`, `cashier`, `client`), `phone`, `status`, `email_verified_at`, `created_at`, `updated_at`.

Sin soft delete — para desactivar un usuario usar `status = 'inactive'`.

Implementa `MustVerifyEmail`: Laravel envía automáticamente el correo de verificación al registrarse y expone los métodos `hasVerifiedEmail()` y `markEmailAsVerified()`.

### Archivos adicionales (verificación)

| Capa | Archivo |
|---|---|
| Controller | `Http/Controllers/Auth/EmailVerificationController.php` |
| Notification | `Notifications/VerifyEmailNotification.php` (override opcional) |

### Seguridad

- Contraseñas con `Hash::make()` (bcrypt / argon2id).
- Autenticación vía Laravel Sanctum (Bearer Token).
- Rate limiting: `throttle:5,1` en rutas de login y `throttle:6,1` en reenvío de verificación.
- Los enlaces de verificación son URLs firmadas (`signed` middleware); expiran y no pueden reutilizarse.

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

---

### POST `/email/verification-notification`

Reenvía el correo de verificación al usuario autenticado.

**Seguridad:** Bearer Token requerido. `throttle:6,1`.

**Respuesta 200** (correo enviado):
```json
{ "message": "Correo de verificación enviado." }
```

**Respuesta 204** (ya verificado — sin cuerpo):

---

### GET `/email/verify/{id}/{hash}`

Verifica el correo mediante el enlace firmado recibido por email. Laravel valida la firma y el hash; si son válidos, setea `email_verified_at`.

**Seguridad:** Bearer Token requerido + URL firmada (`signed` middleware). `throttle:6,1`.

**Respuesta 200:**
```json
{ "message": "Correo verificado correctamente." }
```

**Respuesta 403** (firma inválida o expirada):
```json
{ "message": "El enlace de verificación no es válido o ha expirado." }
```

> El enlace incluido en el correo tiene la forma:
> `/api/email/verify/{id}/{hash}?expires=...&signature=...`
> El frontend debe redirigir al usuario a esta URL al hacer clic; la verificación ocurre en el backend.
