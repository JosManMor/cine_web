# Módulo 04 — Administración

Panel de control para el rol `admin`. Muestra métricas generales, actividad reciente y estado de las salas.

**Códigos de error de acceso:**
- `401 Unauthorized` — request sin token válido (no autenticado).
- `403 Forbidden` — token válido pero el usuario no tiene rol `admin`.

---

## Frontend

### Páginas

| Ruta | Descripción |
|---|---|
| `/admin` | Dashboard principal |

### Componentes

- `MetricCard` — tarjeta individual reutilizable para `tickets_sold`, `daily_sales`, `registered_users` y película más vendida.
- `WeeklySalesChart` — gráfico de barras con ventas por día de la semana (`weekly_sales[]`). La barra con el valor máximo se resalta en rojo.
- `ActivityFeed` — grid de dos columnas con eventos recientes; punto verde = `success`, rojo = `error`.
- `RoomCard` — tarjeta por sala con badge de estado (`EN FUNCIÓN` / `PRÓXIMA` / `SIN FUNCIÓN`), película en curso o próxima, tiempo restante / tiempo hasta inicio, barra de ocupación y conteo de asientos.

### Archivos

| Archivo | Descripción |
|---|---|
| `src/pages/AdminPage.jsx` | Página principal; carga los tres endpoints en paralelo |
| `src/api/admin.js` | `getAdminMetrics`, `getAdminActivity`, `getAdminRooms` |

### Flujo de carga

1. `useEffect` verifica `user.role === 'admin'`; si no, redirige a `home` antes de hacer ningún fetch.
2. `Promise.all` lanza los tres requests en paralelo.
3. Mientras carga: `Spinner` centrado en pantalla.
4. Si falla algún request: estado de error con botón "Reintentar".
5. El botón "↻ Actualizar" repite el ciclo sin recargar la página.

### Lógica de `RoomCard`

| `status` | Contenido mostrado |
|---|---|
| `showing` | Película actual · tiempo restante · próxima función (si existe) · barra de ocupación |
| `upcoming` | Película próxima · hora de inicio · tiempo hasta que empiece · barra de ocupación |
| `idle` | "Sin funciones programadas" · sin barra de ocupación |

---

## Backend

### Archivos involucrados

| Capa | Archivo |
|---|---|
| Controller | `Http/Controllers/Admin/AdminController.php` |
| Service | `Services/AdminService.php` |
| Middleware | `Http/Middleware/EnsureIsAdmin.php` |
| Routes | `routes/admin.php` |
| Models | `Models/Purchase.php`, `Models/PurchaseSeat.php`, `Models/Screening.php`, `Models/Room.php`, `Models/Movie.php`, `Models/User.php` |

### Autorización

El alias `role` apunta a `EnsureIsAdmin` y está registrado en `bootstrap/app.php`. Las rutas se cargan bajo el prefijo `/api` desde `routes/admin.php`:

```php
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
// top_movie: JOIN purchase_seats → screenings → movies, GROUP BY movie, ORDER BY COUNT DESC
// weekly_sales: 7 queries (Lun–Dom de la semana actual), count de purchases completadas por día
```

**Estado de sala — determinación de `status`:**

```
start_time ≤ now < start_time + movie.duration_minutes  →  showing
start_time > now                                         →  upcoming
ninguna función activa                                   →  idle
```

La ocupación se calcula sobre la función de referencia (actual si `showing`, próxima si `upcoming`):
`occupancy_pct = (active_purchase_seats / total_seats) × 100`

**Actividad — orden:**
Los eventos de compras completadas y pagos fallidos se ordenan por timestamp real antes de convertirse a tiempo relativo (`"hace X min"`), evitando el orden incorrecto por string.

---

## API

### GET `/admin/metrics`

**Seguridad:** Bearer Token requerido (`401` si ausente) + rol `admin` (`403` si no es admin).

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
    { "day": "Mar", "value": 68 },
    { "day": "Mié", "value": 55 },
    { "day": "Jue", "value": 90 },
    { "day": "Vie", "value": 73 },
    { "day": "Sáb", "value": 88 },
    { "day": "Dom", "value": 61 }
  ]
}
```

`top_movie` puede ser `null` si no hay ventas. `weekly_sales` siempre devuelve los 7 días de la semana actual (conteo de purchases completadas, no monto).

---

### GET `/admin/activity`

**Seguridad:** Bearer Token requerido (`401` si ausente) + rol `admin` (`403` si no es admin).

**Respuesta 200:**
```json
[
  { "type": "success", "message": "Compra exitosa — Inferno Nexus", "time": "hace 2 min" },
  { "type": "error",   "message": "Pago fallido bloqueado",          "time": "hace 2 h"  }
]
```

- `success` — purchases con `payment_status = 'completed'` (últimas 10).
- `error` — purchases con `payment_status = 'failed'` (últimas 10).
- Ordenados por `updated_at` descendente antes de convertir a tiempo relativo.

---

### GET `/admin/rooms`

**Seguridad:** Bearer Token requerido (`401` si ausente) + rol `admin` (`403` si no es admin).

**Respuesta 200:**
```json
[
  {
    "room": "Sala 1",
    "status": "showing",
    "current_movie": "Inferno Nexus",
    "current_ends_at": "2025-07-25 16:18:00",
    "next_movie": "Hollow Depths",
    "next_start_time": "2025-07-25 18:00:00",
    "occupancy_pct": 87,
    "available_seats": 16,
    "total_seats": 120
  },
  {
    "room": "Sala 2",
    "status": "upcoming",
    "current_movie": null,
    "current_ends_at": null,
    "next_movie": "Última Vuelta",
    "next_start_time": "2025-07-25 19:30:00",
    "occupancy_pct": 12,
    "available_seats": 105,
    "total_seats": 120
  },
  {
    "room": "Sala 3",
    "status": "idle",
    "current_movie": null,
    "current_ends_at": null,
    "next_movie": null,
    "next_start_time": null,
    "occupancy_pct": 0,
    "available_seats": 80,
    "total_seats": 80
  }
]
```

**Valores de `status`:**

| Valor | Condición |
|---|---|
| `showing` | `start_time ≤ now < start_time + movie.duration_minutes` |
| `upcoming` | Primera función con `start_time > now` |
| `idle` | Sin funciones activas programadas |

`current_ends_at` se calcula como `start_time + movie.duration_minutes`. `occupancy_pct` y `available_seats` son `0` / `total_seats` cuando `status = 'idle'`.
