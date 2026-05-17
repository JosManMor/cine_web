# Módulo 03 — Compras y Tickets

Selección de asientos, creación de la compra y visualización del ticket digital. Es el flujo de mayor criticidad porque involucra la reserva atómica de asientos.

---

## Frontend

### Páginas

| Ruta | Descripción |
|---|---|
| `/screenings/:id/seats` | Selección de asientos para una función |
| `/checkout` | Resumen y confirmación de pago |
| `/tickets/:ticket_code` | Ticket digital con QR |

### Componentes

- `SeatPicker` — mapa interactivo de la sala generado desde `room.rows` y `room.seats_per_row`. Estados visuales:
  - **Libre:** borde verde, fondo transparente
  - **Seleccionado:** fondo verde, icono check
  - **Ocupado:** fondo rojo `#FF0000`, icono X
- `OrderSummary` — panel lateral con asientos seleccionados y precio total calculado como `seats.length × screening.base_price`.
- `CheckoutForm` — método de pago (`cash`, `card`, `online`) y botón "Confirmar Compra".
- `TicketCard` — muestra `ticket_code`, película, sala, fila, asiento, hora. Renderiza el QR en cliente a partir de `ticket_code` (ningún dato QR viene del servidor).

### Generación del mapa de asientos

El frontend construye la grilla localmente con los datos de la sala:

```js
// rows = número de filas (ej. 8 → A..H)
// seats_per_row = asientos por fila (ej. 15 → 1..15)
// occupiedSeats = lista de {row, seat_number} del screening
```

Un asiento está ocupado si aparece en `purchase_seats` activos para esa función (el backend los devuelve junto al detalle de la función o en un endpoint dedicado).

### Estado global

El `screening_id` y los asientos seleccionados se mantienen en Context/Redux entre las páginas de selección y checkout.

---

## Backend

### Archivos involucrados

| Capa | Archivo |
|---|---|
| Controller | `Http/Controllers/Purchase/PurchaseController.php` |
| Requests | `Http/Requests/Purchase/PurchaseRequest.php` |
| Service | `Services/PurchaseService.php` |
| Models | `Models/Purchase.php`, `Models/PurchaseSeat.php` |
| Resource | `Http/Resources/PurchaseResource.php` |

### Lógica crítica de reserva

La operación completa va dentro de una transacción. El UNIQUE `(screening_id, row, seat_number)` en `purchase_seats` es la **única** garantía real contra doble reserva. No se usa `exists()` previo porque en concurrencia dos transacciones pueden pasar el check simultáneamente y aun así colisionar en el INSERT. El patrón correcto es intentar el INSERT directamente y capturar la excepción de clave duplicada que MySQL lanza cuando viola el UNIQUE:

```php
use Illuminate\Database\UniqueConstraintViolationException;

DB::transaction(function () use ($screeningId, $seats, $purchaseData) {

    $purchase = $this->purchaseRepository->create($purchaseData);

    foreach ($seats as $seat) {
        try {
            PurchaseSeat::create([
                'purchase_id'  => $purchase->id,
                'screening_id' => $screeningId,
                'row'          => $seat['row'],
                'seat_number'  => $seat['seat_number'],
                'price_paid'   => $seat['price'],
            ]);
        } catch (UniqueConstraintViolationException) {
            throw new SeatAlreadyTakenException($seat['row'], $seat['seat_number']);
        }
    }

});
```

`UniqueConstraintViolationException` está disponible desde Laravel 10. La transacción garantiza que si cualquier asiento falla, ninguno de los insertados anteriormente persiste (rollback automático).

### Asignación del ticket_code

Se asigna **únicamente** cuando `purchases.payment_status` cambia a `completed`, mediante un Observer o Queue Job — nunca inline en el request de compra.

```php
// PurchaseObserver.php
public function updated(Purchase $purchase): void
{
    if ($purchase->wasChanged('payment_status') && $purchase->payment_status === 'completed') {
        foreach ($purchase->purchaseSeats as $seat) {
            $seat->update(['ticket_code' => Str::uuid()]);
        }
    }
}
```

### Validaciones previas al insert

- `row` debe estar en `[A .. chr(ord('A') + room.rows - 1)]`
- `seat_number` debe estar en `[1 .. room.seats_per_row]`
- `price_paid` se toma de `screenings.base_price` en el momento de la compra (no se recalcula después)

### Índices relevantes

```sql
CREATE UNIQUE INDEX idx_purchase_seats_unique ON purchase_seats (screening_id, row, seat_number);
CREATE INDEX idx_purchase_seats_screening ON purchase_seats (screening_id, status);
CREATE UNIQUE INDEX idx_purchase_seats_ticket ON purchase_seats (ticket_code);
```

---

## API

### POST `/purchases`

**Seguridad:** Bearer Token requerido.

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

**Respuesta 201:**
```json
{
  "message": "Compra registrada. En espera de confirmación de pago.",
  "purchase_id": 501,
  "payment_status": "pending"
}
```

> Los `ticket_code` **no se devuelven aquí**. El endpoint crea la compra y reserva los asientos; la asignación de códigos ocurre en un Observer/Job cuando el pago se confirma. El frontend debe consultar el estado del pago por separado y redirigir al usuario a `GET /tickets/{ticket_code}` una vez confirmado.

---

### GET `/my-tickets`

**Seguridad:** Bearer Token requerido.

**Respuesta 200:**
```json
[
  {
    "ticket_code": "3f4a8b2c-...",
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
]
```

> Solo devuelve asientos con `status = 'active'` y `ticket_code IS NOT NULL`. Las compras pendientes de pago no aparecen. Cada asiento es un objeto independiente, incluso si pertenecen a la misma compra.

---

### GET `/tickets/{ticket_code}`

**Seguridad:** Bearer Token requerido.

**Respuesta 200:**
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

> `status` refleja el valor de `purchase_seats.status`: `active` (válido), `used`, `cancelled`.  
> El QR se genera en el cliente a partir de `ticket_code`; el servidor no devuelve datos QR.
