# Módulo 01 — Autenticación

Registro, inicio de sesión, cierre de sesión y verificación de correo. Todos los demás módulos dependen de saber si el usuario está autenticado, si tiene el correo verificado, y qué rol tiene (`admin`, `cashier`, `client`).

---

## Flujo general

```
┌─────────────────────────────────────────────────────────────────┐
│                        REGISTRO                                  │
│  POST /register → token + email de verificación enviado         │
│  Token válido para rutas públicas y de verificación             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │ ¿Email          │
                    │  verificado?    │
                    └────────┬────────┘
               NO            │              SÍ
    ┌──────────┴──────┐      │      ┌───────┴───────────┐
    │ Acceso limitado │      │      │  Acceso completo  │
    │ (solo lectura,  │      │      │  (compras,        │
    │  cartelera)     │      │      │   tickets, etc.)  │
    └──────────┬──────┘      │      └───────────────────┘
               │     Verificar correo
    ┌──────────▼──────────────────────────────────────────┐
    │  1. Email llega con link → FRONTEND_URL/email/verify │
    │  2. Frontend extrae params del query string          │
    │  3. GET /api/email/verify/{id}/{hash}?...            │
    │     Authorization: Bearer <token>                    │
    │  4. Backend valida firma → email_verified_at = now() │
    └──────────────────────────────────────────────────────┘
```

---

## Niveles de acceso por middleware

| Middleware | Requiere | Rutas ejemplo |
|---|---|---|
| *(ninguno)* | — | `GET /movies`, `GET /movies/{id}` |
| `auth:sanctum` | Bearer Token válido | `POST /logout`, `POST /email/verification-notification` |
| `auth:sanctum` + `verified` | Token + email verificado | `POST /purchases`, `GET /tickets/{code}` |
| `auth:sanctum` + `verified` + policy `admin` | Token + email + rol admin | `GET /admin/metrics`, etc. |

---

## Frontend

### Páginas

| Ruta frontend | Descripción |
|---|---|
| `/register` | Formulario de registro |
| `/login` | Formulario de inicio de sesión |
| `/email/verify` | Recibe los query params del enlace de correo y llama a la API |
| `/email/pending` | Pantalla de "revisa tu bandeja de entrada" post-registro |

### Componentes

- `RegisterForm` — campos: nombre, email, contraseña, confirmación.
- `LoginForm` — campos: email, contraseña.
- `AuthGuard` — redirige a `/login` si no hay token.
- `VerifiedGuard` — redirige a `/email/pending` si el token existe pero `email_verified_at` es null.

### Estado global

El token y los datos del usuario se guardan en `localStorage` / Context API / Redux al recibir la respuesta:

```json
{
  "id": 1,
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "role": "client"
}
```

Al hacer logout se limpian token y estado. El campo `email_verified_at` **no** se expone en el `UserResource` — el frontend lo infiere según si puede acceder o no a rutas protegidas con `verified`.

### Lógica de la página `/email/verify`

```js
// Al montar la página, extraer params del query string y llamar a la API
const { id, hash, expires, signature } = useSearchParams();

await fetch(`/api/email/verify/${id}/${hash}?expires=${expires}&signature=${signature}`, {
  method: 'GET',
  headers: { Authorization: `Bearer ${token}` },
});
// → redirigir a la cartelera tras éxito
```

---

## Backend

### Archivos involucrados

| Capa | Archivo | Responsabilidad |
|---|---|---|
| Controller | `Http/Controllers/Auth/AuthController.php` | register, login, logout |
| Controller | `Http/Controllers/Auth/EmailVerificationController.php` | send, verify |
| Request | `Http/Requests/Auth/RegisterRequest.php` | Validación de registro |
| Request | `Http/Requests/Auth/LoginRequest.php` | Validación de login |
| DTO | `DTOs/Auth/RegisterDTO.php` | Datos de registro entre capas |
| DTO | `DTOs/Auth/LoginDTO.php` | Datos de login entre capas |
| Service | `Services/AuthService.php` | Lógica de negocio de auth |
| Model | `Models/User.php` | Entidad usuario + `MustVerifyEmail` + `HasApiTokens` |
| Notification | `Notifications/VerifyEmailNotification.php` | Override del enlace de verificación |
| Exception | `Exceptions/InvalidCredentialsException.php` | Error 401 auto-renderizable |
| Resource | `Http/Resources/UserResource.php` | Forma la respuesta JSON del usuario |

### Por qué existe `VerifyEmailNotification`

La notificación de Laravel por defecto genera un enlace firmado hacia `/api/email/verify/{id}/{hash}`. Ese enlace **no puede ser visitado directamente** desde un email con Bearer Token — el clic no tiene forma de adjuntar el token.

La clase custom redirige el enlace al frontend (`FRONTEND_URL/email/verify?id=...&hash=...&expires=...&signature=...`). El frontend recibe los parámetros, y los reenvía a la API junto con el Bearer Token ya almacenado en el cliente.

```
FRONTEND_URL=http://localhost:5173   ← configurable por entorno en .env
```

### Seguridad

- Contraseñas hasheadas con bcrypt (Laravel `Hash::make()`).
- Autenticación stateless vía Sanctum Bearer Token.
- Token revocado individualmente en logout (`currentAccessToken()->delete()`).
- Rate limiting: `throttle:5,1` en login, `throttle:6,1` en reenvío de verificación.
- Enlace de verificación es URL firmada (HMAC-SHA256); expira en 60 minutos y no puede reutilizarse.
- El hash del email es SHA-1 y se valida en `EmailVerificationRequest` antes de marcar como verificado.

---

## API

### POST `/api/register`

Crea la cuenta, emite el token y envía el correo de verificación.

**Body:**
```json
{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "password": "password123",
  "password_confirmation": "password123"
}
```

**201 Created:**
```json
{
  "user": { "id": 1, "name": "Juan Pérez", "email": "juan@example.com", "role": "client" },
  "token": "1|abc123..."
}
```

**422 Unprocessable** (validación):
```json
{ "message": "The email has already been taken.", "errors": { "email": ["The email has already been taken."] } }
```

---

### POST `/api/login`

**Seguridad:** Pública. `throttle:5,1`.

**Body:**
```json
{ "email": "juan@example.com", "password": "password123" }
```

**200 OK:**
```json
{
  "user": { "id": 1, "name": "Juan Pérez", "email": "juan@example.com", "role": "client" },
  "token": "2|xyz789..."
}
```

**401 Unauthorized:**
```json
{ "message": "Credenciales incorrectas." }
```

---

### POST `/api/logout`

**Seguridad:** `auth:sanctum`.

Revoca solo el token usado en la request. Otros tokens del mismo usuario (otras sesiones) no se ven afectados.

**200 OK:**
```json
{ "message": "Sesión cerrada correctamente." }
```

**401 Unauthorized** (token ausente o inválido):
```json
{ "message": "Unauthenticated." }
```

---

### POST `/api/email/verification-notification`

**Seguridad:** `auth:sanctum`. `throttle:6,1`.

Reenvía el correo de verificación. El enlace en el correo apunta a `FRONTEND_URL/email/verify?...`.

**200 OK** (correo enviado):
```json
{ "message": "Correo de verificación enviado." }
```

**204 No Content** (ya estaba verificado — sin cuerpo).

---

### GET `/api/email/verify/{id}/{hash}`

**Seguridad:** `auth:sanctum` + `signed` + `throttle:6,1`.

El frontend llama a este endpoint con el Bearer Token almacenado tras extraer los params del enlace de correo.

| Parámetro | Origen | Descripción |
|---|---|---|
| `id` | path | ID del usuario |
| `hash` | path | `sha1($user->email)` |
| `expires` | query | Timestamp UNIX de expiración |
| `signature` | query | Firma HMAC generada por Laravel |

**200 OK:**
```json
{ "message": "Correo verificado correctamente." }
```

**403 Forbidden** (firma inválida, expirada, o hash no coincide):
```json
{ "message": "Invalid signature." }
```

**401 Unauthorized** (sin token):
```json
{ "message": "Unauthenticated." }
```
