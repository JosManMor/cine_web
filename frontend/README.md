# Frontend — Cine Sendera

SPA de React con Vite y Tailwind CSS v4 que consume la API REST de Laravel. Este archivo es el índice del frontend: cada tema vive en un único documento.

## Stack

| Pieza | Versión (según `package.json`) |
|---|---|
| React / React DOM | 19 |
| Vite + `@vitejs/plugin-react` | 8 / 6 |
| Tailwind CSS (`@tailwindcss/vite`) | 4 |
| `react-router-dom` | 6 |
| `axios` | 1 |
| `zod` | 4 |
| `lucide-react`, `qrcode.react` | Iconos y códigos QR |
| Vitest, Testing Library, Playwright | Pruebas unitarias y E2E |

## Dónde está cada cosa

| Necesitas | Documento |
|---|---|
| Estructura de `src/`, rutas, guards, contextos, capa `api/`, validación y pruebas | [docs/frontend-architecture.md](../docs/frontend-architecture.md) |
| Tokens de diseño, tipografía, componentes de UI y reglas visuales | [docs/frontend-design-system.md](../docs/frontend-design-system.md) |
| Flujo funcional de cada módulo (auth, cartelera, compras, admin) | [docs/modulos/README.md](../docs/modulos/README.md) |
| Contratos de los endpoints que consume `src/api/` | [docs/api-endpoints.md](../docs/api-endpoints.md) |
| Reglas de negocio (precios, estados de pago, límites) | [docs/reglas-de-negocio.md](../docs/reglas-de-negocio.md) |
| Levantar el entorno con Docker | [docs/docker-entorno-desarrollo.md](../docs/docker-entorno-desarrollo.md) |

## Comandos

Se ejecutan desde `frontend/`. En Docker el servicio `frontend` ya corre `npm run dev` en el puerto 5173.

| Comando | Qué hace |
|---|---|
| `npm install` | Instala dependencias |
| `npm run dev` | Servidor de desarrollo de Vite; redirige `/api` al backend |
| `npm run build` | Genera el bundle en `backend/public/build` |
| `npm run lint` | ESLint sobre todo el proyecto |
| `npm run test` | Vitest (una pasada); `test:watch` y `test:coverage` como variantes |
| `npm run test:e2e` | Playwright contra `BASE_URL` (por defecto `http://localhost`) |

## Reglas de trabajo

Las reglas completas están en `CLAUDE.md`; aquí solo el resumen para tenerlas a la vista.

- Interfaz responsive obligatoria desde 320 px; se verifica en escritorio y en 480 px o menos.
- Sin emoji en la interfaz. Los iconos nuevos salen de `lucide-react`.
- Texto visible en español; identificadores de código en inglés.
- Los rediseños se hacen una vista por vez, en su propio worktree y rama `feat/redesign-<vista>`, con los tokens de `src/index.css`. Detalle en [docs/frontend-design-system.md](../docs/frontend-design-system.md).
- Una vista rediseñada está terminada cuando pasan `lint`, `test` y `build`.

## Variables de entorno

Vite lee el `.env` de la raíz del repositorio (`envDir` apunta a `..`). El frontend usa solo estas:

| Variable | Uso |
|---|---|
| `VITE_PROXY_TARGET` | Destino del proxy de `/api` en desarrollo (por defecto `http://localhost`) |
| `VITE_DEMO_MODE` | Muestra el aviso de demostración (`DemoBanner`) cuando vale `true` |
| `VITE_MAILPIT_URL` | Enlace del banner al buzón de pruebas; por defecto `/mailpit/` |
