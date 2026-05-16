# Módulo 04 — Administración

Panel de control para el rol `admin`. Muestra métricas generales, actividad reciente y estado de las salas. Acceso restringido: cualquier request sin rol `admin` recibe `403 Forbidden`.

---

## Frontend

### Páginas

| Ruta | Descripción |
|---|---|
| `/admin` | Dashboard principal |

### Componentes

- `MetricsPanel` — tarjetas con `tickets_sold`, `daily_sales`, `registered_users` y película más vendida.
- `WeeklySalesChart` — gráfico de barras con ventas por día de la semana (`weekly_sales[]`).
- `ActivityFeed` — lista de eventos recientes con tipo (`success` / `error`) y tiempo relativo.
- `RoomStatusList` — tabla con estado de cada sala: película activa, % de ocupación, asientos disponibles, próxima función.

### Autenticación en el frontend

Antes de renderizar cualquier componente de este módulo, verificar `user.role === 'admin'` en el estado global. Si no, redirigir a `/`.

---

## Backend

### Archivos involucrados

| Capa | Archivo |
|---|---|
| Controller | `Http/Controllers/Admin/AdminController.php` |
| Middleware | `Middleware/EnsureIsAdmin.php` (o Policy/Gate) |
| Models | `Models/Purchase.php`, `Models/PurchaseSeat.php`, `Models/Screening.php`, `Models/Room.php`, `Models/Movie.php`, `Models/User.php` |

### Autorización

Todas las rutas del módulo pasan por el middleware de rol:

```php
// routes/admin.php
Route::middleware(['auth:sanctum', 'role:admin'])->prefix('admin')->group(function () {
    Route::get('metrics',  [AdminController::class, 'metrics']);
    Route::get('activity', [AdminController::class, 'activity']);
    Route::get('rooms',    [AdminController::class, 'rooms']);
});
```

### Cálculos principales

**Métricas:**
```php
$ticketsSold  = PurchaseSeat::where('status', 'active')->count();
$dailySales   = Purchase::where('payment_status', 'completed')
                    ->whereDate('created_at', today())->sum('total_amount');
$usersCount   = User::where('status', 'active')->count();
```

**Estado de sala:** `occupancy_pct = (active_purchase_seats / total_seats) × 100`

---

## API

### GET `/admin/metrics`

**Seguridad:** Bearer Token + rol `admin`.

**Respuesta 200:**
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

### GET `/admin/activity`

**Seguridad:** Bearer Token + rol `admin`.

**Respuesta 200:**
```json
[
  { "type": "success", "message": "Compra exitosa — Inferno Nexus", "time": "hace 2 min" },
  { "type": "error",   "message": "Intento de acceso fallido bloqueado", "time": "hace 2 h" }
]
```

---

### GET `/admin/rooms`

**Seguridad:** Bearer Token + rol `admin`.

**Respuesta 200:**
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
