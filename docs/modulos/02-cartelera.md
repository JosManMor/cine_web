# Módulo 02 — Cartelera

Muestra las películas disponibles y el detalle de cada una con sus funciones. Es el punto de entrada principal para el flujo de compra.

---

## Frontend

### Páginas

| Ruta | Descripción |
|---|---|
| `/` | Cartelera principal (Home) |
| `/movies/:id` | Detalle de película con funciones disponibles |

### Componentes

- `MovieCard` — imagen (aspect ratio 2:3), título, género, botón "Comprar". Efecto zoom en hover.
- `MovieGrid` — grid responsivo de `MovieCard`. Filtros por `genre`.
- `HeroSection` — película destacada con imagen grande en la parte superior.
- `ScreeningList` — lista de funciones de una película: hora, formato, idioma, precio, disponibilidad.

### Datos que consume

Del endpoint `GET /movies`:
- `title`, `genre`, `duration_minutes`, `rating`, `poster_url`, `status`

Del endpoint `GET /movies/{id}`:
- Todo lo anterior más `synopsis`, `director`
- Array `screenings[]` con `id`, `start_time`, `format`, `language_type`, `base_price`, `status`
- Dentro de cada `screening`: `room.name`, `room.total_seats`, `room.available_seats`

El usuario selecciona una función (`screening_id`) para continuar al módulo de compra.

### Responsividad

| Breakpoint | Layout |
|---|---|
| Mobile | 1 columna |
| Tablet | 2–3 columnas |
| Desktop | 4+ columnas |

---

## Backend

### Archivos involucrados

| Capa | Archivo |
|---|---|
| Controller | `Http/Controllers/Movie/MovieController.php` |
| Service | `Services/MovieService.php` |
| Repository | `Repositories/Contracts/MovieRepositoryInterface.php`, `Eloquent/MovieRepository.php` |
| Models | `Models/Movie.php`, `Models/Screening.php`, `Models/Room.php` |
| Resource | `Http/Resources/MovieResource.php`, `ScreeningResource.php` |

### Lógica de disponibilidad

`available_seats` **no se almacena** en ninguna tabla. Se calcula al responder:

```php
$available = $screening->room->rows * $screening->room->seats_per_row
           - $screening->purchaseSeats()->where('status', 'active')->count();
```

### Índices relevantes

```sql
CREATE INDEX idx_movies_status ON movies (status);
CREATE INDEX idx_screenings_movie_start ON screenings (movie_id, start_time, status);
```

---

## API

### GET `/movies`

**Respuesta 200:**
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

---

### GET `/movies/{id}`

**Respuesta 200:**
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
