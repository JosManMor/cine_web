# Frontend Design System — Cine Sendera

---

## 0. Estándares del Proyecto

### Idioma Oficial

Para mantener la consistencia y profesionalismo en el desarrollo, se establecen los siguientes estándares de idioma:

- **Código (Frontend):** Inglés (nombres de variables, funciones, componentes de React/Angular, archivos `.css`, `.ts`, `.js`).
- **Nombres de Componentes:** Inglés (ej. `MovieCard`, `SeatPicker`, `Navbar`).
- **Frontend (UI/UX):** Inglés para la estructura técnica, pero el **contenido visible** para el usuario final será en **Español**.
- **Documentación:** Español (explicaciones, guías de estilo, manuales).

---

## 1. Identidad Visual

### Paleta de Colores

Se busca una estética moderna y cinematográfica (Dark Mode por defecto).

- **Primary (Action):** `#E50914` (Rojo Cine/Netflix) - Para botones principales y llamadas a la acción.
- **Secondary:** `#221F1F` (Negro Carbón) - Fondo principal de la aplicación.
- **Surface:** `#2F2F2F` (Gris Oscuro) - Para tarjetas, modals y contenedores secundarios.
- **Text Primary:** `#FFFFFF` (Blanco) - Texto principal y títulos.
- **Text Secondary:** `#B3B3B3` (Gris Claro) - Para descripciones y metadatos.
- **Success:** `#46D369` (Verde) - Para confirmaciones de compra y asientos disponibles.
- **Error:** `#FF0000` (Rojo) - Para errores de validación y asientos ocupados.

### Tipografía

- **Títulos:** `Montserrat` o `Bebas Neue` (Sans-serif con peso fuerte).
- **Cuerpo:** `Roboto` o `Open Sans` (Para legibilidad).

---

## 2. Componentes de UI (Atomics)

### Botones (`Button`)

- **Primary:** Fondo rojo, texto blanco, bordes redondeados (4px).
- **Secondary:** Fondo gris oscuro, borde rojo, texto blanco.
- **Disabled:** Fondo gris claro, texto gris oscuro.

### Tarjetas de Película (`MovieCard`)

- **Imagen:** Aspect ratio 2:3.
- **Efecto:** Zoom suave al hacer hover.
- **Información:** Título, género y botón de "Comprar".

### Selector de Asientos (`SeatPicker`)

- **Asiento Libre:** Borde verde, fondo transparente.
- **Asiento Seleccionado:** Fondo verde, icono de check.
- **Asiento Ocupado:** Fondo rojo (#FF0000), icono de X.

---

## 3. Estructura de Páginas

### 3.1 Cartelera (Home)

- **Hero Section:** Película destacada con trailer o imagen grande.
- **Grid:** Listado de películas con filtros por género.

### 3.2 Detalle de Película

- Sinopsis extendida.
- Horarios disponibles (Schedule).
- Información de reparto y duración.

### 3.3 Selección de Asientos

- Mapa interactivo de la sala.
- Leyenda de estados de asientos.
- Resumen lateral de precio total.

### 3.4 Checkout / Pago

- Formulario de datos del usuario (si no está autenticado).
- Resumen de la orden.
- Botón de "Confirmar Compra".

### 3.5 Ticket Digital

- Código QR generado por el backend.
- Resumen de la compra (Película, Asientos, Sala, Hora).
- Botón para "Descargar PDF".

---

## 4. Integración con Backend

El frontend se comunicará con el backend a través de la API REST definida en la arquitectura del sistema.

Para una referencia completa de los endpoints, parámetros y respuestas, consulte el documento:
[Documentación de la API (api-endpoints.md)](api-endpoints.md)

### Endpoints Consumidos

- `GET /api/movies` - Obtener lista de películas.
- `GET /api/movies/{id}` - Obtener detalles de una película.
- `POST /api/purchases` - Enviar solicitud de compra.
- `GET /api/tickets/{id}` - Recuperar ticket generado.

### Manejo de Estados

- Uso de Context API o Redux para gestionar el carrito de boletos y la sesión del usuario.
- Notificaciones Toast para feedback de acciones (ej. "Asiento seleccionado", "Compra exitosa").

---

## 5. Responsividad (Mobile First)

- **Mobile:** Layout de una columna para la cartelera.
- **Tablet:** Layout de dos o tres columnas.
- **Desktop:** Layout de grid completo (4+ columnas) y experiencias inmersivas.

---

## 6. Tecnologías Seleccionadas

- **Framework:** React 18+ (Vanilla JavaScript). Se ha seleccionado Vanilla JS para simplificar el desarrollo y mantener la flexibilidad sin la sobrecarga de tipos estáticos de TypeScript.
- **Estilos:** Tailwind prioritariamente y css.
- **Iconos:** Lucide React o FontAwesome.
- **QR:** Librería cliente para renderizar el `ticket_code` como QR.
