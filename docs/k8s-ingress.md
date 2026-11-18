# Ingress y Exposición de Servicios en k3s (Traefik)

Exposición externa del stack de preproducción mediante Traefik Ingress Controller en k3s (issue #159, épica #157).

| Recurso | Tipo | Archivo | Destino |
|---------|------|---------|---------|
| `cine-ingress` | Ingress | `k8s/05-ingress.yaml` | Service `app:80` (sidecar Nginx) |

## Enrutamiento y resolución de rutas

El Ingress utiliza `ingressClassName: traefik` y redirige todo el tráfico con prefijo `/` al Service `app` en el puerto 80. La resolución de rutas específicas no requiere reglas adicionales en Traefik porque el sidecar Nginx (`docker/nginx/prod.conf` / `nginx-conf`) las gestiona internamente dentro del pod:

- **Frontend SPA (`/`):** Entrega estáticos compilados con fallback a `/build/index.html` para el enrutador del cliente (`react-router-dom`).
- **Backend API (`/api`, `/up`, `/sanctum`):** Pasa mediante FastCGI al contenedor `app` (PHP-FPM en puerto local 9000).
- **Mailpit UI (`/mailpit/`):** Proxy inverso hacia el servicio interno `mailpit:8025`.
- **Health check (`/nginx-health`):** Retorna código HTTP 200 de forma independiente de PHP.

## Soporte para WebSockets

Traefik gestiona las cabeceras `Upgrade` y `Connection` de forma nativa sin requerir configuración adicional de anotaciones. El proxy de Nginx propaga la conexión bidireccional hacia Mailpit, permitiendo la actualización en tiempo real de la bandeja de entrada cuando se disparan correos durante las pruebas o demostraciones.

## Configuración de dominio (Host)

El manifiesto se despliega por defecto sin directiva `host`, lo que equivale al comportamiento `localhost` de Docker Compose. Para vincular un dominio personalizado, basta con descomentar y ajustar el campo `host` en las reglas de `k8s/05-ingress.yaml`:

```yaml
spec:
  rules:
    - host: cine.example.com
      http:
        paths: ...
```

## Consideraciones de despliegue

- **Conflicto en puerto 80:** Traefik escucha en el puerto 80 del nodo. Si el servidor aún ejecuta el stack de Docker Compose, el puerto estará ocupado por el Nginx previo. Es necesario detener Compose antes de levantar el Ingress en el host.
- **TLS:** Queda fuera de alcance para la fase inicial de preproducción en k3s.
