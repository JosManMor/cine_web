# Deployment — Simulación de Producción

Este documento describe cómo levantar y mantener el entorno de producción simulado de Cine Sendera usando `docker-compose.prod.yml`.

---

## Diferencias con el entorno de desarrollo

| Aspecto              | Desarrollo (`docker-compose.yml`) | Producción (`docker-compose.prod.yml`) |
| -------------------- | --------------------------------- | -------------------------------------- |
| Código fuente        | Bind-mount (`./backend`)          | Baked en la imagen                     |
| Frontend             | Vite dev server                   | Build estático en `public/build/`      |
| PHP vendor           | Montado desde host                | Instalado sin `--dev` en la imagen     |
| Base de datos        | Expuesta en el host (`:3306`)     | Solo accesible en red interna          |
| phpMyAdmin / Mailpit | Incluidos                         | Excluidos                              |
| Queue worker         | No incluido                       | Contenedor `queue` dedicado            |
| Scheduler            | No incluido                       | Contenedor `scheduler` dedicado        |
| OPcache              | Desactivado                       | Activado y optimizado                  |

---

## Requisitos previos

- Docker Engine ≥ 24 y Docker Compose v2
- Acceso al repositorio

---

## Primer despliegue

### 1. Crear `.env.prod`

```bash
cp .env.prod.example .env.prod
```

Editar `.env.prod` y ajustar obligatoriamente:

| Variable              | Descripción                                                          |
| --------------------- | -------------------------------------------------------------------- |
| `APP_KEY`             | Dejar vacío; el contenedor lo genera al primer arranque (ver paso 4) |
| `APP_URL`             | URL pública del servidor (ej. `http://192.168.1.10`)                 |
| `DB_PASSWORD`         | Contraseña segura para el usuario de la BD                           |
| `MYSQL_PASSWORD`      | Debe coincidir con `DB_PASSWORD`                                     |
| `MYSQL_ROOT_PASSWORD` | Contraseña root de MySQL                                             |
| `MAIL_*`              | Credenciales SMTP reales                                             |

> **Importante:** `env_file` en Docker Compose **no soporta comentarios en línea**.  
> Todos los comentarios deben ir en su propia línea (`# comentario`), nunca al final de una línea con valor.

### 2. Construir las imágenes y levantar los servicios

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Esto ejecuta un build multi-etapa:

- **Stage 1** — Instala dependencias PHP sin `--dev`
- **Stage 2** — Compila el frontend React con Vite
- **Stage 3** — Imagen final PHP-FPM con el código y los assets listos

Al arrancar, el contenedor `app` ejecuta automáticamente:

1. `php artisan migrate --force`
2. `php artisan db:seed --force` (idempotente, usa `firstOrCreate`)
3. `php artisan config:cache / route:cache / view:cache`

### 3. Verificar que todos los servicios están en pie

```bash
docker compose -f docker-compose.prod.yml ps
```

Todos deben mostrar estado `Up` o `healthy`.

### 4. Fijar `APP_KEY` de forma permanente

Si `APP_KEY` estaba vacío, el entrypoint generó una clave temporal. Hay que persistirla para que las sesiones no se invaliden al reiniciar:

```bash
# Obtener la clave generada
docker logs cine_app 2>&1 | grep "APP_KEY=base64"

# Pegar la línea completa en .env.prod
# APP_KEY=base64:XXXXXXXXX...=

# Reiniciar para aplicar desde .env.prod
docker compose -f docker-compose.prod.yml restart app queue scheduler
```

---

## Actualizar código o frontend

```bash
# 1. Bajar los servicios (NO eliminar el volumen mysql_prod_data)
docker compose -f docker-compose.prod.yml down

# 2. Eliminar el volumen de la app para que se regenere desde la nueva imagen
docker volume rm cine_sendera_app_www

# 3. Rebuildar y levantar
docker compose -f docker-compose.prod.yml up -d --build
```

> El volumen `mysql_prod_data` **nunca** debe eliminarse en actualizaciones; contiene los datos de la BD.

---

## Comandos útiles de operación

```bash
# Ver logs en tiempo real de todos los servicios
docker compose -f docker-compose.prod.yml logs -f

# Ver solo logs de la app PHP
docker logs cine_app -f

# Ver errores de Laravel
docker exec cine_app tail -f /var/www/storage/logs/laravel.log

# Correr un comando artisan puntual
docker exec cine_app php artisan <comando>

# Bajar todo sin borrar volúmenes
docker compose -f docker-compose.prod.yml down

# Bajar todo y borrar volúmenes (¡borra la BD!)
docker compose -f docker-compose.prod.yml down -v
```

---

## Arquitectura de contenedores

```
  Browser
     │ :80
     ▼
 ┌─────────────────────────┐   frontend_net
 │  apache  (httpd:2.4)    │
 │  /var/www/public  (ro)  │
 └────────────┬────────────┘
              │ fcgi → app:9000        backend_net
              ▼
 ┌─────────────────────────┐
 │  app  (php-fpm 8.3)     │◄─── queue, scheduler
 │  /var/www  (rw)         │
 └────────────┬────────────┘
              │
              ▼
 ┌─────────────────────────┐
 │  mysql  (mysql:8.0)     │
 │  mysql_prod_data        │
 └─────────────────────────┘
```

Los servicios `queue` y `scheduler` reutilizan la imagen `cine-sendera:prod` y comparten el volumen `app_www` con `app`.

---

## Solución de problemas frecuentes

| Síntoma                                 | Causa probable                            | Solución                                               |
| --------------------------------------- | ----------------------------------------- | ------------------------------------------------------ |
| `500` en todas las rutas                | `APP_KEY` vacío o con texto de comentario | Ver paso 4 del primer despliegue                       |
| `Table 'sessions' not found`            | Migración de sesiones no ejecutada        | Rebuild completo                                       |
| MIME type vacío en assets               | `mod_mime` no cargado en Apache           | Verificar `docker/apache/prod.conf`                    |
| `550 Sending from domain not allowed`   | Dominio SMTP no verificado                | Verificar dominio en Mailtrap o usar `MAIL_MAILER=log` |
| `validation.unique` en lugar de mensaje | Sin archivos `lang/es/`                   | Rebuild para incluir traducciones                      |
