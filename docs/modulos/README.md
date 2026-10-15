# Módulos — Cine Sendera

Cada archivo cubre un módulo funcional completo: páginas y componentes de frontend, controladores y servicios de backend, y los endpoints de API que los conectan.

| Archivo                            | Módulo                | Endpoints                                                       |
| ---------------------------------- | --------------------- | --------------------------------------------------------------- |
| [01-auth.md](01-auth.md)           | Autenticación         | `POST /register`, `POST /login`, `POST /logout`                 |
| [02-cartelera.md](02-cartelera.md) | Cartelera y Películas | `GET /movies`, `GET /movies/{id}`                               |
| [03-compras.md](03-compras.md)     | Compras y Tickets     | `POST /purchases`, `GET /tickets/{ticket_code}`                 |
| [04-admin.md](04-admin.md)         | Administración        | `GET /admin/metrics`, `GET /admin/activity`, `GET /admin/rooms` |

## Documentos de referencia

Los módulos asumen familiaridad con los siguientes documentos transversales:

| Documento                                                 | Contenido                            |
| --------------------------------------------------------- | ------------------------------------ |
| [database-design.md](../database-design.md)               | Esquema de BD, fuente de verdad      |
| [backend-architecture.md](../backend-architecture.md)     | Patrones, carpetas, seguridad, Bash  |
| [frontend-design-system.md](../frontend-design-system.md) | Paleta, tipografía, componentes base |
| [api-endpoints.md](../api-endpoints.md)                   | Referencia completa de la API        |
| [docker-entorno-desarrollo.md](../docker-entorno-desarrollo.md) | Entorno Docker, orquestación, healthchecks y env_file |
| [deployment-produccion.md](../deployment-produccion.md)         | Despliegue en producción simulado con Docker Compose |
| [examen-teorico-resumen-implementacion.md](../examen-teorico-resumen-implementacion.md) | Resumen teórico de la parcial y memoria de implementación |
