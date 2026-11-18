# Despliegue en k3s (preproducción)

Documentación del workflow de despliegue y de los manifiestos de Kubernetes que lo acompañan. Cubre `k3s-deploy.yml`, `03-mysql.yaml`, `03-mailpit.yaml` y `03-services.yaml`.

> **Alcance.** Solo se documenta lo que se ve en estos cuatro archivos. Los recursos que se mencionan pero no se incluyeron (`01-secrets.yaml`, el ConfigMap `cine-config`, el PVC `mysql-data`, y los Deployments `app`, `queue` y `scheduler`) se describen únicamente por cómo estos archivos los referencian.

## Resumen

| Elemento | Valor |
| --- | --- |
| Namespace | `cine-web` |
| Entorno de GitHub | `preprod` |
| Runner | self-hosted, etiquetas `linux`, `cine-deploy` |
| Imagen de la aplicación | `<usuario>/cine-sendera:<tag>` |
| Verificación | `GET /nginx-health` y `GET /up` vía Traefik |

## 1. Workflow `k3s-deploy.yml`

### Disparadores

El workflow admite dos formas de ejecución:

- **`workflow_call`**: lo invoca otro workflow (p. ej. el de preproducción) con el input `image`, que es la imagen completa (`usuario/cine-sendera:<sha>`).
- **`workflow_dispatch`**: ejecución manual con el input `image_tag`. Sirve para desplegar un SHA concreto o para **hacer rollback** a una versión anterior. La imagen se construye como `${DOCKERHUB_USERNAME}/cine-sendera:<image_tag>`.

### Configuración general

- **Permisos:** `contents: read` (mínimo necesario).
- **Concurrencia:** grupo `deploy-preprod` con `cancel-in-progress: false`. Dos despliegues no corren a la vez; el segundo espera al primero en lugar de cancelarlo.
- **Timeout:** 20 minutos.
- **Variables de entorno del job:**

| Variable | Origen |
| --- | --- |
| `NAMESPACE` | fijo: `cine-web` |
| `DOCKERHUB_USER` | secreto `DOCKERHUB_USERNAME` |
| `BASE_URL` | variable `PREPROD_URL` |
| `INPUT_IMAGE` / `INPUT_TAG` | inputs del workflow |

### Pasos

1. **Checkout.** Acción `actions/checkout` fijada por SHA de commit (v4) y con `persist-credentials: false`, para no dejar el token en el repositorio local del runner.

2. **Resolver imagen.** Si llega `image`, se usa tal cual; si no, se compone con `DOCKERHUB_USER` e `image_tag`. Luego se valida con la expresión `^[A-Za-z0-9._/-]+:[A-Za-z0-9._-]+$` y el job falla si el formato no es válido. Esto evita inyectar valores arbitrarios en los comandos posteriores. El resultado se exporta como `IMAGE`.

3. **Aplicar manifiestos.** Recorre `k8s/*.yaml`, **omite `01-secrets.yaml`** y reemplaza el placeholder `USUARIO/cine-sendera:TAG` por `IMAGE` en una copia temporal. Si queda algún placeholder sin sustituir, el job falla. Después ejecuta `kubectl apply -f` sobre el directorio temporal.
   - Los secretos **no** se aplican desde CI: se gestionan manualmente en el clúster.

4. **Actualizar imagen.** Fija la imagen con `kubectl set image` en:
   - `deployment/app`: contenedores `init-storage` y `app`
   - `deployment/queue`: contenedor `queue`
   - `deployment/scheduler`: contenedor `scheduler`

5. **Esperar rollout.** `kubectl rollout status` para `app` (300 s), `queue` (120 s) y `scheduler` (120 s).

6. **Verificar por Traefik.** Con `curl -fsS --retry 5 --retry-delay 5` comprueba `$BASE_URL/nginx-health` y `$BASE_URL/up`. Valida que el tráfico llega a la aplicación a través del ingress, no solo que los pods estén listos.

7. **Rollback si falló.** Con `if: failure()` ejecuta `kubectl rollout undo` sobre `app`, `queue` y `scheduler` (con `|| true` para que un fallo individual no corte el resto).

### Advertencias

- **Las migraciones no se revierten.** El entrypoint de la aplicación ejecuta `migrate --force` al iniciar; si un despliegue con migraciones falla, `rollout undo` restaura la imagen anterior pero el esquema de base de datos queda como estaba. Las migraciones deben ser compatibles hacia atrás.
- **No hay backups de base de datos** (ver `CLAUDE.md`). Un rollback de imagen no recupera datos.
- El `rollout undo` también se dispara si falla el paso de verificación por Traefik, no solo el rollout.

### Rollback manual

1. En GitHub: **Actions → Deploy to k3s → Run workflow**.
2. En `image_tag` indicar el SHA de la imagen anterior que se quiere restaurar.
3. Confirmar que pasan las verificaciones de `/nginx-health` y `/up`.

## 2. MySQL (`03-mysql.yaml`)

`StatefulSet` de una réplica en `cine-web`.

| Aspecto | Detalle |
| --- | --- |
| Imagen | `mysql:8.0` |
| Puerto | `3306` |
| Configuración | `envFrom` → ConfigMap `cine-config` y Secret `cine-secrets` |
| Datos | PVC `mysql-data` montado en `/var/lib/mysql` |
| ServiceAccount token | no se monta (`automountServiceAccountToken: false`) |

Las variables `MYSQL_USER`, `MYSQL_PASSWORD` y `MYSQL_DATABASE` deben existir en `cine-config` / `cine-secrets`, porque las sondas las usan.

### Sondas

Las tres ejecutan `mysql -h localhost -u$MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE -e 'SELECT 1'`:

| Sonda | Parámetros |
| --- | --- |
| `startupProbe` | espera inicial 40 s, cada 10 s, hasta 10 fallos (≈ 140 s de margen para arrancar) |
| `readinessProbe` | cada 10 s, timeout 5 s |
| `livenessProbe` | cada 10 s, timeout 5 s |

### Recursos

| | CPU | Memoria | Almacenamiento efímero |
| --- | --- | --- | --- |
| Requests | 250m | 512Mi | 512Mi |
| Limits | 1 | 1Gi | 1Gi |

### Notas

- El PVC `mysql-data` se referencia con `volumes`, no con `volumeClaimTemplates`; debe existir en otro manifiesto de `k8s/`.
- Si la memoria supera el límite de 1Gi, el contenedor será terminado por OOM. Vigilar el uso si crece la base de datos.

## 3. Mailpit (`03-mailpit.yaml`)

`Deployment` de una réplica que actúa como servidor SMTP de pruebas con interfaz web.

| Aspecto | Detalle |
| --- | --- |
| Imagen | `axllent/mailpit:v1.31.4` (versión fija) |
| Puertos | `8025` (web, `http`) y `1025` (SMTP, `smtp`) |
| `MP_WEBROOT` | `mailpit` (la interfaz se sirve bajo el prefijo `/mailpit`) |
| Sondas | `readiness` y `liveness` por `tcpSocket` al puerto 8025 |

Recursos: requests 50m CPU / 32Mi memoria / 64Mi efímero; limits 100m CPU / 64Mi memoria / 128Mi efímero.

### Notas

- Sin volumen: los correos capturados **se pierden al reiniciar el pod**.
- El prefijo `/mailpit` indica que se expone detrás de un ingress (Traefik) con esa ruta; la regla de Ingress no forma parte de estos archivos.
- Ningún correo sale a destinatarios reales: Mailpit solo captura. Es adecuado para preproducción, no para producción real.

## 4. Servicios (`03-services.yaml`)

| Servicio | Tipo | Puertos | Selector |
| --- | --- | --- | --- |
| `mysql` | `ClusterIP: None` (headless) | `3306` | `app: mysql` |
| `mailpit` | `ClusterIP` | `8025` (http), `1025` (smtp) | `app: mailpit` |

- `mysql` es **headless**, requisito del `StatefulSet` (`serviceName: mysql`). El DNS resuelve directamente a la IP del pod: `mysql.cine-web.svc.cluster.local`, o simplemente `mysql` dentro del namespace (`DB_HOST=mysql`).
- `mailpit` expone SMTP (`mailpit:1025`) para la aplicación y HTTP (`mailpit:8025`) para el ingress.

## 5. Dependencias entre archivos

```
k3s-deploy.yml
 ├─ aplica k8s/*.yaml (excepto 01-secrets.yaml)
 │    ├─ 03-mysql.yaml     → usa cine-config, cine-secrets, PVC mysql-data
 │    ├─ 03-mailpit.yaml
 │    └─ 03-services.yaml  → expone mysql y mailpit
 └─ actualiza imagen de app / queue / scheduler y verifica /nginx-health y /up
```

## 6. Requisitos previos

- Runner self-hosted con etiquetas `linux` y `cine-deploy` y acceso a `kubectl` contra el clúster k3s.
- Entorno `preprod` en GitHub con el secreto `DOCKERHUB_USERNAME` y la variable `PREPROD_URL`.
- `01-secrets.yaml` (Secret `cine-secrets`) aplicado manualmente en el namespace `cine-web` **antes** del primer despliegue.
- Imagen publicada en Docker Hub con el tag que se va a desplegar.

## 7. Diagnóstico rápido

```bash
kubectl -n cine-web get pods
kubectl -n cine-web rollout status deployment/app
kubectl -n cine-web logs deployment/app --tail=100
kubectl -n cine-web describe pod -l app=mysql
kubectl -n cine-web rollout history deployment/app
```
