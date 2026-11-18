# Persistencia de datos en k3s (PVC)

Los datos del stack de preproducción se guardan en dos PersistentVolumeClaim
definidos en `k8s/02-pvc.yaml`, con el provisioner `local-path` de k3s.

| PVC | Uso | Acceso | Tamaño |
|-----|-----|--------|--------|
| `mysql-data` | `/var/lib/mysql` (MySQL) | ReadWriteOnce | 5Gi |
| `app-storage` | `/var/www/storage` (app, queue y scheduler) | ReadWriteOnce | 1Gi |

## Reglas importantes

- **Montar solo `/var/www/storage`, nunca `/var/www`.** Un volumen vacío en
  Kubernetes tapa el contenido de la ruta donde se monta, y ocultaría el
  código de la imagen. En Docker Compose esto no pasaba porque Docker puebla
  el volumen desde la imagen.
- **`storage/` vacío necesita inicialización.** El PVC oculta los
  subdirectorios que crea el Dockerfile (`logs`, `framework/cache`,
  `framework/sessions`, `framework/views`). Un initContainer del despliegue de
  la app los recrea y asigna el propietario `www-data` (UID/GID 33).
- **`local-path` está ligado a un nodo.** Con `ReadWriteOnce`, app, queue y
  scheduler deben correr en el mismo nodo. Es válido porque el k3s de
  preproducción es de un solo nodo.

## Advertencia: borrado de datos

El `reclaimPolicy` de `local-path` es `Delete`: borrar el PVC `mysql-data`
elimina la base de datos sin posibilidad de recuperarla. Equivale a
`mysql_prod_data` en Compose, que nunca se borra en las actualizaciones.
`mysql-data` no debe incluirse en ningún procedimiento de limpieza.

## Estado Pending

`local-path` usa `WaitForFirstConsumer`: los PVC aparecen en `Pending` hasta
que un pod los usa. Es lo esperado, no un error.