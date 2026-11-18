# Despliegue de preproducción en k3s

El workflow `.github/workflows/k3s-deploy.yml` aplica los manifiestos de `k8s/` en el namespace `cine-web` del servidor de preproducción. Solo se ejecuta desde la rama `pre` y en el runner `cine-deploy`.

## Qué hace el workflow y qué no

El workflow:

- Valida `PREPROD_URL` y la imagen.
- Comprueba que existen `cine-app-secrets` y `cine-mysql-secrets`.
- Crea o actualiza `dockerhub-regcred` con los secrets de GitHub `DOCKERHUB_USERNAME` y `DOCKERHUB_TOKEN`.
- Aplica los manifiestos, sustituyendo los placeholders de imagen y de URL.
- Reinicia `app`, `queue` y `scheduler`, espera a que los rollouts terminen y verifica la aplicación a través de Traefik.

El workflow **no** crea el namespace ni los secrets de la aplicación, porque contienen valores que no deben estar en el repositorio y porque el namespace es un recurso de ámbito de clúster. Los crea un administrador una vez.

Si el despliegue falla después de aplicar los manifiestos, el workflow restaura las imágenes que estaban en marcha. Las migraciones y el ConfigMap no se revierten. En el primer despliegue no hay versión anterior a la que volver.

## Preparación (una sola vez)

1. En GitHub, crear el environment `preprod`, limitado a la rama `pre` (*Deployment branches*), con:
   - Variable `PREPROD_URL`: esquema y host públicos, sin `/` al final (p. ej. `http://cine.example.com`). Se usa también como `APP_URL` y `FRONTEND_URL`.
   - Los secrets `DOCKERHUB_USERNAME` y `DOCKERHUB_TOKEN` ya existen a nivel de repositorio.
2. En el servidor, como administrador del clúster:

   ```bash
   kubectl apply -f k8s/00-namespace.yaml

   kubectl -n cine-web create secret generic cine-app-secrets \
     --from-literal=APP_KEY='base64:...' \
     --from-literal=DB_PASSWORD='...' \
     --from-literal=ADMIN_PASSWORD='...'

   kubectl -n cine-web create secret generic cine-mysql-secrets \
     --from-literal=MYSQL_ROOT_PASSWORD='...'
   ```

   `APP_KEY` se genera con `php artisan key:generate --show`. La plantilla con los nombres de las claves está en `k8s/examples/secrets.example.yaml`; no se aplica tal cual.
3. Dar al usuario del runner permisos sobre el namespace `cine-web` (un `Role` con `RoleBinding` basta, porque el workflow no aplica `00-namespace.yaml`).

## Cambio desde Docker Compose

Compose (`preprod.yml`) y k3s usan el mismo servidor. El nginx de Compose publica el puerto 80, y Traefik de k3s también necesita el 80 y el 443. No pueden funcionar a la vez.

Orden del cambio:

1. Completar la preparación anterior.
2. Parar Compose en el servidor (los volúmenes se conservan), con el mismo proyecto que usa `scripts/deploy.sh`:

   ```bash
   docker compose -p cine_sendera --project-directory /opt/cine-sendera \
     -f /opt/cine-sendera/docker-compose.prod.yml down
   ```

   Mientras k3s esté activo, no fusionar en `pre` cambios que disparen `preprod.yml`: su job `deploy` volvería a levantar Compose.
3. Comprobar que el Service de Traefik obtiene los puertos: `kubectl -n kube-system get svc traefik`.
4. Lanzar el workflow con `workflow_dispatch` desde la rama `pre`, indicando el tag de la imagen.
5. Si algo falla, eliminar los recursos del namespace o parar k3s y volver a levantar Compose.

Los datos de MySQL en el volumen de Compose no se migran: la base de datos de k3s empieza vacía y el entrypoint ejecuta migraciones y seeders.
