# API — Cine Sendera

Referencia de alto nivel de los módulos de la API. Para especificación completa de cada endpoint (body, respuestas, ejemplos, lógica de backend y componentes de frontend) ver los documentos de módulo en [`docs/modulos/`](modulos/README.md).

---

## 0. Estándares

| Atributo          | Valor                                                               |
| ----------------- | ------------------------------------------------------------------- |
| Base URL          | `/api`                                                              |
| Formato           | JSON (`Content-Type: application/json`, `Accept: application/json`) |
| Autenticación     | Laravel Sanctum — Bearer Token                                      |
| Idioma de claves  | Inglés                                                              |
| Idioma de valores | Español                                                             |

### Niveles de protección

| Nivel       | Header requerido                | Condición extra               |
| ----------- | ------------------------------- | ----------------------------- |
| Público     | —                               | —                             |
| Autenticado | `Authorization: Bearer <token>` | Token Sanctum válido          |
| Verificado  | `Authorization: Bearer <token>` | + `email_verified_at` no nulo |
| Admin       | `Authorization: Bearer <token>` | + `role = admin`              |

### Respuestas de error comunes

| Código | Causa                                                                        |
| ------ | ---------------------------------------------------------------------------- |
| 401    | Token ausente, inválido o revocado                                           |
| 403    | Acción no permitida (firma inválida, correo no verificado, rol insuficiente) |
| 422    | Validación fallida — `{ "message": "...", "errors": { "campo": ["..."] } }`  |
| 429    | Rate limit superado                                                          |

---

## 1. Autenticación

Gestiona el ciclo de vida de la sesión: registro, login, logout y verificación de correo. Es la base de la que dependen todos los demás módulos — define si el usuario está autenticado, si tiene el correo verificado y qué rol posee (`admin`, `cashier`, `client`). Sin este módulo no existe control de acceso.

| Endpoint                                | Nivel       | Descripción                                              |
| --------------------------------------- | ----------- | -------------------------------------------------------- |
| `POST /register`                        | Público     | Crea cuenta, emite token y envía correo de verificación  |
| `POST /login`                           | Público     | Autentica credenciales y devuelve token · `throttle:5,1` |
| `POST /logout`                          | Autenticado | Revoca el token de la sesión actual                      |
| `POST /email/verification-notification` | Autenticado | Reenvía el enlace de verificación · `throttle:6,1`       |
| `GET /email/verify/{id}/{hash}`         | Autenticado | Valida la firma del enlace y marca el correo verificado  |

**Documentación completa:** [docs/modulos/01-auth.md](modulos/01-auth.md)

---

## 2. Cartelera y Películas

Expone el catálogo de películas y sus funciones disponibles. Es el punto de entrada del flujo de compra: el usuario navega la cartelera, selecciona una película y elige una función antes de pasar al checkout. Los datos de disponibilidad de asientos se calculan en tiempo real; no se almacena `available_seats` en ninguna tabla.

| Endpoint           | Nivel   | Descripción                                                    |
| ------------------ | ------- | -------------------------------------------------------------- |
| `GET /movies`      | Público | Lista todas las películas activas                              |
| `GET /movies/{id}` | Público | Detalle de película con funciones, sala y asientos disponibles |

**Documentación completa:** [docs/modulos/02-cartelera.md](modulos/02-cartelera.md)

---

## 3. Compras y Tickets

Maneja la reserva atómica de asientos y la generación del ticket digital. Es el módulo de mayor criticidad: una transacción fallida o un doble-booking implica pérdida económica o experiencia degradada. La garantía contra doble reserva descansa en el constraint `UNIQUE (screening_id, row, seat_number)` de `purchase_seats`; el `ticket_code` se asigna solo al confirmarse el pago, vía Observer.

| Endpoint                     | Nivel      | Descripción                                                   |
| ---------------------------- | ---------- | ------------------------------------------------------------- |
| `POST /purchases`            | Verificado | Reserva asientos y confirma la compra en una sola transacción |
| `GET /my-tickets`            | Verificado | Lista todos los tickets activos del usuario autenticado       |
| `GET /tickets/{ticket_code}` | Verificado | Detalle de un ticket individual para mostrar en el QR digital |

**Documentación completa:** [docs/modulos/03-compras.md](modulos/03-compras.md)

---

## 4. Administración

Dashboard exclusivo para el rol `admin`. Centraliza las métricas operativas del cine (ventas, ocupación, actividad) sin exponer datos sensibles a otros roles. Cualquier request con token válido pero sin `role = admin` recibe `403`.

| Endpoint              | Nivel | Descripción                                                       |
| --------------------- | ----- | ----------------------------------------------------------------- |
| `GET /admin/metrics`  | Admin | Totales de tickets, ventas del día, usuarios y película más vista |
| `GET /admin/activity` | Admin | Eventos recientes de compras exitosas y pagos fallidos            |
| `GET /admin/rooms`    | Admin | Estado actual de cada sala: función en curso, ocupación y próxima |

**Documentación completa:** [docs/modulos/04-admin.md](modulos/04-admin.md)
