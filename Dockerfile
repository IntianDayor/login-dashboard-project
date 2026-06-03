FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    apache2 \
    php8.3 \
    php8.3-mysql \
    php8.3-zip \
    php8.3-xml \
    php8.3-mbstring \
    libapache2-mod-php8.3 \
    git \
    zip \
    unzip \
    curl \
    && apt-get clean

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

RUN a2enmod rewrite php8.3

WORKDIR /var/www/html

COPY . .

RUN composer install --no-dev --optimize-autoloader

RUN chown -R www-data:www-data assets/uploads \
    && chmod -R 755 assets/uploads

RUN echo '<Directory /var/www/html>\n\
    AllowOverride All\n\
    Require all granted\n\
</Directory>' >> /etc/apache2/apache2.conf

RUN echo "ServerName localhost" >> /etc/apache2/apache2.conf

COPY php.ini /etc/php/8.3/apache2/conf.d/custom.ini

RUN echo 'RedirectMatch ^/$ /pages/login.html' >> /etc/apache2/apache2.conf

EXPOSE 80

CMD ["apache2ctl", "-D", "FOREGROUND"]