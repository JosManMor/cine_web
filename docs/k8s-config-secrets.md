# Namespace, ConfigMap y Secrets en k3s

Configuración y gestión de variables de entorno para el stack de preproducción en k3s (issue #158, épica #157). Reemplaza el uso de `env_file: .env.prod` de Docker Compose mediante `envFrom` en los Deployments y StatefulSets.

| Recurso | Tipo | Archivo | Descripción |
|---------|------|---------|-------------|
| `cine-web` | Namespace | `k8s/00-namespace.yaml` | Espacio de nombres dedicado para aislar todos los recursos del proyecto. |
| `cine-config` | ConfigMap | `k8s/01-configmap.yaml` | Variables de entorno no sensibles (Laravel, MySQL, Mailpit, Logging, Sesión). |
| `cine-secrets` | Secret | `k8s/01-secrets.yaml` | Claves y credenciales sensibles (plantilla con placeholders en el repositorio). |

## Separación de responsabilidades

- **ConfigMap (`cine-config`):** Contiene la parametrización operativa común consumida por los pods (`app`, `queue`, `scheduler`, `mysql`). Incluye configuraciones de base de datos (`DB_HOST=mysql`, `DB_PORT=3306`), sesión, colas (`QUEUE_CONNECTION=database`), caché, correo (`MAIL_HOST=mailpit`), zona horaria y modo demo.
- **Secret (`cine-secrets`):** Agrupa exclusivamente los valores sensibles: `APP_KEY`, `DB_PASSWORD`, `MYSQL_PASSWORD`, `MYSQL_ROOT_PASSWORD` y `ADMIN_PASSWORD`.

## Variables excluidas

- **`VITE_*`:** Se compilan estáticamente dentro de los assets del frontend al construir la imagen de producción; no se evalúan en tiempo de ejecución.
- **`AWS_*`, `REDIS_*`, `MEMCACHED_*`:** No se utilizan en la arquitectura de preproducción simulada (se emplean colas y sesiones basadas en base de datos).

## Gestión de secretos en entornos reales

Dado que el repositorio es público, `k8s/01-secrets.yaml` solo versiona marcadores (`REEMPLAZAR`). Los valores productivos reales se crean directamente en el clúster:

1. **Creación del secret real:**
   ```bash
   kubectl -n cine-web create secret generic cine-secrets --from-env-file=<archivo-fuera-del-repo>
   ```
2. **Generación de `APP_KEY`:** Debe comenzar con el prefijo `base64:`. Si la clave es inválida o inexistente, el entrypoint de cada pod generará una temporal distinta, impidiendo descifrar sesiones y jobs entre réplicas:
   ```bash
   php artisan key:generate --show
   ```
3. **Consistencia de contraseñas:** `DB_PASSWORD` y `MYSQL_PASSWORD` deben coincidir exactamente para permitir la conexión entre la app y la base de datos.
4. **Registry privado (Docker Hub):** Si la imagen reside en un repositorio privado, se debe crear el secreto de autenticación:
   ```bash
   kubectl -n cine-web create secret docker-registry dockerhub-regcred \
     --docker-server=https://index.docker.io/v1/ \
     --docker-username=<usuario> \
     --docker-password=<token> \
     --docker-email=<correo>
   ```

## Advertencia de CI/CD

El manifiesto `k8s/01-secrets.yaml` **no debe aplicarse** desde los pipelines automáticos de despliegue continuo (CI/CD), ya que sobrescribiría los secretos reales del clúster con los placeholders del repositorio.
