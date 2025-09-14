FROM php:8.2-fpm
WORKDIR /var/www/html
RUN apt-get update && apt-get install -y git curl libonig-dev libzip-dev libpng-dev libjpeg-dev libfreetype6-dev zip unzip \
    && rm -rf /var/lib/apt/lists/*
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) pdo pdo_mysql gd zip opcache
COPY --from=composer:latest /usr/bin/composer /usr/local/bin/composer
EXPOSE 9000