FROM php:8.3-fpm

ARG HOST_UID=1000
ARG HOST_GID=1000

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    git \
    libicu-dev \
    libonig-dev \
    libpng-dev \
    libxml2-dev \
    libzip-dev \
    unzip \
    zip \
    && rm -rf /var/lib/apt/lists/*

RUN docker-php-ext-install \
    pdo \
    pdo_mysql \
    mbstring \
    zip \
    exif \
    pcntl \
    intl

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

# Ajusta www-data al UID/GID del host
RUN groupmod -o -g "${HOST_GID}" www-data \
    && usermod -o -u "${HOST_UID}" -g "${HOST_GID}" www-data

COPY docker/php/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Composer necesita un HOME escribible
ENV COMPOSER_HOME=/tmp/composer

# Ejecutar como el usuario del host
USER www-data

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["php-fpm"]