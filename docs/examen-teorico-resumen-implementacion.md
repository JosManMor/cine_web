# Examen teórico y memoria de implementación
## Proyecto integrador: Cine Sendera

### Datos del proyecto
* Proyecto: Cine Sendera (Sistema web de gestión de cartelera y venta de boletos)
* Tecnologías: React 18 con Vite, Laravel 13 con PHP 8.3, Apache 2.4, MySQL 8.0, Redis 7 y Mailpit
* Infraestructura: Docker Engine, Dockerfiles y Docker Compose
* Integrantes: Manuel Alcaraz y equipo de desarrollo
* Fecha: Octubre de 2026

---

## Introducción

En este documento presentamos el resumen de los temas estudiados durante el parcial y explicamos de forma concreta cómo aplicamos esa teoría en nuestro proyecto Cine Sendera. Para cada tema explicamos los conceptos vistos en clase, cómo se implementaron en los archivos de nuestro sistema y cuál fue el principal reto al que nos enfrentamos como equipo al ponerlo en práctica.

---

## Tema 1: Fundamentos de la contenerización y arquitectura LAMP

### Resumen teórico
La contenerización permite empaquetar una aplicación junto con sus dependencias en un entorno aislado. A diferencia de las máquinas virtuales tradicionales que necesitan un sistema operativo completo y un hipervisor, los contenedores comparten el mismo kernel del sistema anfitrión. Esto los hace mucho más ligeros y rápidos al encender.

Esta tecnología funciona gracias a características del kernel de Linux como los namespaces, que aíslan procesos, redes, puntos de montaje y usuarios, y los cgroups, que regulan la cantidad de memoria y procesador que puede consumir cada contenedor. También se sigue la buena práctica de un proceso por contenedor, lo que significa que cada servicio debe correr por separado para no crear sistemas monolíticos difíciles de mantener.

### Implementación en Cine Sendera
Para nuestro sistema separamos las responsabilidades en contenedores individuales:
* cine_apache: Servidor web con imagen httpd:2.4 en el puerto 80. Responde peticiones web y entrega archivos estáticos.
* cine_frontend: Servidor de desarrollo con Node 20 y Vite en el puerto 5173 para la aplicación de React. Redirige peticiones de API a Apache en el puerto 80.
* cine_app: Backend en PHP 8.3 con Laravel escuchando peticiones dinámicas en el puerto 9000 por FastCGI.
* cine_mysql: Base de datos relacional con MySQL 8.0 en el puerto 3306.
* cine_redis: Almacenamiento en memoria con Redis 7 para acelerar consultas y sesiones.
* cine_mailpit: Servidor local de correo en los puertos 1025 y 8025 para probar notificaciones de compras.

### Reto del equipo
Para nosotros el mayor reto en este punto fue desacoplar Apache de PHP. Estábamos acostumbrados a usar paquetes todo en uno donde el servidor web ya procesa PHP de forma directa. Tuvimos que entender cómo funciona el protocolo FastCGI para lograr que Apache recibiera la petición del usuario y la enviara correctamente al contenedor de PHP en el puerto 9000.

---

## Tema 2: Construcción y optimización de imágenes

### Resumen teórico
Las imágenes de Docker se construyen a partir de un Dockerfile y se componen de capas de solo lectura. Docker guarda estas capas en caché para no volver a descargar o compilar lo que no ha cambiado. 

El patrón multi-stage build permite usar varias etapas en un mismo archivo para compilar código o instalar dependencias pesadas y luego copiar únicamente los archivos finales a una imagen limpia. Por su parte, el archivo .dockerignore evita que se copien archivos innecesarios como carpetas de librerías locales, archivos de configuración privada o repositorios de Git.

### Implementación en Cine Sendera
En el archivo docker/php/Dockerfile.prod implementamos tres etapas distintas para generar la imagen de producción:
1. Etapa de Composer: Se descargan las dependencias de Laravel sin paquetes de desarrollo.
2. Etapa de Node: Se compila el frontend de React con Vite para generar los archivos de public/build.
3. Etapa final de PHP: Se parte de una imagen limpia de PHP 8.3, se copian las librerías de la primera etapa y los archivos compilados de la segunda etapa.

```dockerfile
FROM composer:2 AS composer-builder
WORKDIR /app
COPY backend/composer.json backend/composer.lock ./
RUN composer install --no-dev --optimize-autoloader

FROM node:20-alpine AS frontend-builder
WORKDIR /project/frontend
COPY frontend/package*.json ./
RUN npm ci && npm run build

FROM php:8.3-fpm
WORKDIR /var/www
COPY backend/ .
COPY --from=composer-builder /app/vendor ./vendor
COPY --from=frontend-builder /project/backend/public/build ./public/build
```

### Reto del equipo
Nuestro reto principal fue organizar el orden de las instrucciones para no invalidar la caché de Docker a cada momento. Al inicio copiábamos todo el código antes de instalar las dependencias, por lo que cada cambio pequeño volvía a ejecutar npm install y composer install desde cero, haciendo que la construcción tardara muchos minutos.

---

## Tema 3: Persistencia de datos y volúmenes

### Resumen teórico
El almacenamiento dentro de un contenedor es temporal por defecto. Si el contenedor se borra, sus datos desaparecen. Para guardar información se usan dos esquemas principales:
* Named volumes: Volúmenes administrados directamente por Docker. Tienen mejor rendimiento y son independientes de la vida del contenedor, por lo que se usan en bases de datos.
* Bind mounts: Montajes que vinculan una carpeta de la computadora anfitriona dentro del contenedor. Son ideales para desarrollo porque permiten ver cambios en el código de inmediato sin reconstruir la imagen.

### Implementación en Cine Sendera
En nuestro archivo docker-compose.yml combinamos ambos tipos según la necesidad de cada servicio:
* Para MySQL usamos el volumen con nombre mysql_data en la ruta /var/lib/mysql, y para Redis el volumen redis_data en /data.
* Para el código fuente de Laravel y React usamos bind mounts vinculando las carpetas ./backend y ./frontend para trabajar con recarga en vivo.
* Para la configuración de PHP y Apache montamos archivos individuales como php-dev.ini y 000-default.conf.

### Reto del equipo
El problema que más nos costó resolver fueron los permisos de archivos en Linux. Al principio el contenedor creaba carpetas como root dentro de storage y bootstrap/cache, lo que impedía que nosotros pudiéramos editarlas desde el editor de código. Tuvimos que pasar el UID y GID del usuario local como argumentos de construcción para que el contenedor escribiera con los permisos correctos.

---

## Tema 4: Redes en Docker y resolución DNS

### Resumen teórico
Docker cuenta con varios tipos de redes, siendo la red bridge la más común para comunicar contenedores en una misma máquina. Cuando el usuario crea una red bridge propia, Docker activa un servidor DNS interno. Esto permite que los servicios se comuniquen entre sí utilizando sus nombres de servicio en lugar de tener que averiguar o fijar direcciones IP.

### Implementación en Cine Sendera
Definimos una red bridge llamada cine_network donde conectamos todos los servicios. Gracias a esto logramos que:
* Apache envíe peticiones FastCGI a app:9000.
* Laravel se conecte a la base de datos usando DB_HOST=mysql y a la caché usando REDIS_HOST=redis.
* El servidor de Vite en frontend reenvíe peticiones de API usando el destino http://apache en el puerto 80.

| Servicio origen | Servicio destino | Configuración aplicada |
| :--- | :--- | :--- |
| cine_apache | cine_app | proxy:fcgi://app:9000 |
| cine_app | cine_mysql | DB_HOST=mysql en archivo .env |
| cine_app | cine_redis | REDIS_HOST=redis en archivo .env |
| cine_frontend | cine_apache | VITE_PROXY_TARGET=http://apache |

### Reto del equipo
Al principio nos confundía cómo debía comunicarse el frontend con el backend. Intentábamos configurar la URL de la API como localhost o con la IP de la máquina, lo que provocaba errores de CORS o fallas de conexión. El reto fue entender que el frontend dentro de Docker debía usar el nombre de servicio apache y dejar que el servidor web gestionara el paso a PHP.

---

## Tema 5: Definición de servicios con Docker Compose y variables de entorno

### Resumen teórico
Docker Compose permite describir toda una arquitectura multicontenedor en un archivo YAML. Siguiendo buenas prácticas de diseño de software, la configuración debe mantenerse separada del código. La directiva env_file permite cargar variables desde un archivo .env en lugar de escribirlas una por una dentro del Compose, facilitando que cada miembro del equipo tenga sus propios valores locales sin alterar el repositorio.

### Implementación en Cine Sendera
En nuestro docker-compose.yml sustituimos una lista larga de más de cuarenta variables que estaban escritas a mano por la instrucción env_file: .env. Además añadimos variables como FORWARD_DB_PORT y FORWARD_PMA_PORT para que, si alguien en su computadora ya tiene ocupado el puerto 3306 o el 8080, pueda cambiarlo sin modificar el archivo principal.

```yaml
services:
  app:
    env_file:
      - .env

  mysql:
    ports:
      - "${FORWARD_DB_PORT:-3306}:3306"

  phpmyadmin:
    ports:
      - "${FORWARD_PMA_PORT:-8080}:80"
```

### Reto del equipo
El reto fue darnos cuenta de que tener variables repetidas en el archivo Compose y en el archivo .env generaba inconsistencias. Varios integrantes del equipo cambiaban una contraseña en su archivo .env y el contenedor no tomaba el cambio porque seguía fijo en el Compose. Al migrar a env_file resolvimos esas diferencias y dejamos una sola fuente de verdad.

---

## Tema 6: Control de arranque y comprobaciones de estado

### Resumen teórico
Cuando se levantan varios contenedores juntos pueden ocurrir problemas de sincronización. La instrucción depends_on básica solo espera a que el contenedor empiece a correr, pero no espera a que la base de datos o el servidor estén listos para responder. Para solucionar esto se configuran healthchecks con pruebas periódicas, y se usa la condición service_healthy para que un servicio espere formalmente a que el otro esté saludable antes de arrancar.

### Implementación en Cine Sendera
Configuramos pruebas de salud para los servicios críticos:
* MySQL: Ejecuta mysqladmin ping para confirmar que el motor de base de datos responde.
* Redis: Ejecuta redis-cli ping para comprobar que el servicio de caché está activo.
* PHP: Verifica la apertura del socket TCP en el puerto 9000 con un margen de 30 segundos para permitir que corran las migraciones y seeders.
* Apache: Valida mediante una petición HTTP interna que el endpoint /up de Laravel devuelva un código 200.

### Reto del equipo
Este fue uno de los problemas más molestos que tuvimos. Al hacer docker compose up en una máquina limpia, Laravel intentaba ejecutar las migraciones cuando MySQL apenas estaba inicializando tablas, lo que provocaba que el contenedor fallara. También nos pasaba que Apache arrancaba antes que PHP y mostraba un error 502 Bad Gateway. Implementar los healthchecks con service_healthy eliminó por completo esos errores y nos permitió levantar todo el proyecto con un solo comando seguro.

---

## Matriz de cumplimiento de requerimientos

| No. | Requerimiento solicitado | Implementación en Cine Sendera |
| :-: | :--- | :--- |
| 1 | Dockerfiles para cada servicio | Contenedores definidos para frontend, backend PHP, servidor web Apache, MySQL, Redis y Mailpit. |
| 2 | Optimización multi-stage y .dockerignore | Archivo Dockerfile.prod con etapas separadas de Composer y Node, y archivo .dockerignore para excluir archivos locales. |
| 3 | Estrategia de persistencia de datos | Uso de named volumes para MySQL y Redis, junto con bind mounts para el código en desarrollo. |
| 4 | Red personalizada tipo bridge y DNS | Red cine_network con comunicación entre contenedores por nombre de servicio. |
| 5 | Docker Compose funcional | Levantamiento de la arquitectura completa con el comando docker compose up -d. |
| 6 | Variables de entorno y healthchecks | Variables cargadas con env_file y control de arranque mediante condition: service_healthy. |

---

## Conclusión en equipo

Al iniciar el proyecto estábamos acostumbrados a desarrollar de forma tradicional, instalando versiones específicas de PHP, extensiones de base de datos y servidores locales directamente en nuestros equipos personales. Esto provocaba los típicos problemas donde el código funcionaba en la computadora de un compañero pero fallaba en la de otro por diferencias en el sistema operativo o en las librerías instaladas.

La adopción de Docker representó una curva de aprendizaje importante para el equipo, especialmente al comprender cómo interactúan los permisos de usuario entre el sistema anfitrión y los contenedores, y cómo ordenar el arranque para que unos servicios no choquen con otros. Sin embargo, el resultado final justificó el esfuerzo. Hoy en día cualquier integrante del equipo puede clonar el repositorio, configurar su archivo de entorno y tener exactamente los mismos servicios corriendo con un solo comando. Como siguiente paso consideramos que esta misma configuración nos servirá de base para integrar pruebas automatizadas y preparar un despliegue continuo en un servidor real.
