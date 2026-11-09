# Módulo 03 — Compras y ticket

[Índice de módulos](README.md) · Anterior: [02 Cartelera](02-cartelera.md) · Siguiente: [04 Admin](04-admin.md)

Cubre la selección de asientos, el checkout, la pantalla del ticket y la cancelación. Límites de asientos, precios, estados y cuándo se genera el `ticket_code` están en [reglas-de-negocio.md](../reglas-de-negocio.md); las restricciones únicas que evitan la doble reserva, en [database-design.md](../database-design.md).

## Pantallas y estado

```mermaid
flowchart LR
    S["/asientos/:screeningId<br/>SeatsPage"] -->|continuar| C["/checkout<br/>CheckoutPage"]
    C -->|409 asiento tomado| S
    C -->|compra registrada| T["/ticket<br/>TicketPage"]
    T --> MT["/mis-entradas (módulo 05)"]
```

| Ruta | Página | Guardia |
| --- | --- | --- |
| `/asientos/:screeningId` | `SeatsPage` | `RequireVerified` |
| `/checkout` | `CheckoutPage` | `RequireVerified` |
| `/ticket` | `TicketPage` | `RequireAuth` |

`BookingContext` conserva entre pantallas `selectedMovie`, `selectedSchedule`, `selectedSeats` y `purchaseResult`. `TicketPage` lee `purchaseResult` de ese contexto; sin él muestra un estado vacío con enlaces a la cartelera y a Mis entradas.

| Componente | Uso |
| --- | --- |
| `seats/SeatMap`, `seatLook.js` | Cuadrícula de asientos y su apariencia por estado |
| `QRCode` | Código QR del ticket |
| `tickets/Poster`, `tickets.js` | Cartel y utilidades de formato de boletos |
| `ui/BtnPrimary`, `PillButton` | Acciones |

El checkout ofrece los métodos `cash` y `card`; la API además acepta `online`.

## Flujo de compra

```mermaid
sequenceDiagram
    actor U as Usuario
    participant F as CheckoutPage
    participant API as PurchaseController
    participant S as PurchaseService
    participant DB as MySQL
    participant O as PurchaseObserver
    U->>F: Confirma asientos y método de pago
    F->>API: POST /api/purchases
    API->>API: PurchaseRequest valida el cuerpo
    API->>S: createPurchase(PurchaseDTO, userId)
    S->>DB: SELECT función con sala
    S->>S: valida función y asientos
    S->>DB: BEGIN, INSERT purchases pendiente
    loop por asiento
        S->>DB: INSERT purchase_seats
        alt clave única duplicada
            S--xAPI: SeatAlreadyTakenException
            API-->>F: 409
        end
    end
    S->>DB: UPDATE payment_status completado
    DB-->>O: evento updated
    O->>DB: UPDATE purchase_seats.ticket_code
    S->>DB: COMMIT
    API-->>F: 201 purchase_id, payment_status
    F->>F: setPurchaseResult y navega a /ticket
```

Si el INSERT lanza el error de clave duplicada, se revierte toda la transacción y el frontend regresa a `SeatsPage` con un aviso.

## Consulta de un ticket y cancelación

```mermaid
sequenceDiagram
    participant F as Cliente
    participant API as PurchaseController
    participant S as PurchaseService
    F->>API: GET /api/tickets/{ticket_code}
    alt el ticket es de otro usuario
        API-->>F: 403
    else es del usuario
        API-->>F: 200 TicketResource
    end
    F->>API: DELETE /api/purchases/{purchaseId}
    API->>S: cancelPurchase(id, userId)
    alt no existe
        S--xAPI: PurchaseNotFoundException (404)
    else ajena
        S--xAPI: UnauthorizedPurchaseException (403)
    else ya cancelada
        S--xAPI: PurchaseAlreadyCancelledException (409)
    else válida
        S-->>API: purchase_status cancelado
        API-->>F: 200
    end
```

El frontend actual no ofrece un botón de cancelación: el endpoint existe pero ninguna pantalla lo invoca.

## Endpoints

Todos exigen `auth:sanctum` y `verified`.

| Método y ruta | Controlador | Respuestas |
| --- | --- | --- |
| `POST /purchases` | `Purchase/PurchaseController@store` | 201, 404 (función), 409 (asiento tomado o función no disponible), 422 |
| `DELETE /purchases/{purchaseId}` | `@cancel` | 200, 403, 404, 409 |
| `GET /tickets/{ticket_code}` | `@showTicket` | 200, 403, 404 |

Esquemas: [api-endpoints.md](../api-endpoints.md).

## Piezas del backend

| Capa | Archivo |
| --- | --- |
| Controlador | `Purchase/PurchaseController` |
| Validación y DTO | `Requests/Purchase/PurchaseRequest`, `DTOs/Purchase/PurchaseDTO` |
| Servicio | `Services/PurchaseService` |
| Repositorio | `PurchaseRepositoryInterface` y su implementación Eloquent |
| Observer | `Observers/PurchaseObserver` (asigna `ticket_code`) |
| Modelos | `Purchase`, `PurchaseSeat` |
| Resources | `PurchaseResource`, `TicketResource` |
| Excepciones | `ScreeningNotAvailableException`, `InvalidSeatException`, `SeatAlreadyTakenException`, `PurchaseNotFoundException`, `UnauthorizedPurchaseException`, `PurchaseAlreadyCancelledException` |
