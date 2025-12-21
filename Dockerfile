FROM php:8.2-fpm

# Install system dependencies including Node.js
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    nginx \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# Clear cache
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

# Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory for backend
WORKDIR /var/www/html

# Copy backend files
COPY backend/ /var/www/html/

# Install Laravel dependencies
RUN composer install --no-interaction --optimize-autoloader || true

# Create storage directories and set permissions
RUN mkdir -p /var/www/html/storage/logs \
    && mkdir -p /var/www/html/storage/framework/{cache,sessions,views} \
    && mkdir -p /var/www/html/bootstrap/cache \
    && chown -R www-data:www-data /var/www/html \
    && chmod -R 775 /var/www/html/storage \
    && chmod -R 775 /var/www/html/bootstrap/cache

# Copy backend nginx configuration
COPY backend/nginx.conf /etc/nginx/sites-available/default

# Set up frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./

# Build frontend for production
RUN npm run build

# Copy built frontend to Laravel public directory
RUN cp -r /app/frontend/dist/* /var/www/html/public/

# Update nginx config to serve both API and frontend
RUN echo 'server { \n\
    listen 80; \n\
    server_name localhost; \n\
    root /var/www/html/public; \n\
    index index.html index.php; \n\
    charset utf-8; \n\
    \n\
    # Serve frontend static files \n\
    location / { \n\
        try_files $uri $uri/ /index.html; \n\
    } \n\
    \n\
    # API routes \n\
    location /api { \n\
        try_files $uri $uri/ /index.php?$query_string; \n\
    } \n\
    \n\
    location = /favicon.ico { access_log off; log_not_found off; } \n\
    location = /robots.txt  { access_log off; log_not_found off; } \n\
    \n\
    error_page 404 /index.php; \n\
    \n\
    location ~ \.php$ { \n\
        fastcgi_pass 127.0.0.1:9000; \n\
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name; \n\
        include fastcgi_params; \n\
    } \n\
    \n\
    location ~ /\.(?!well-known).* { \n\
        deny all; \n\
    } \n\
}' > /etc/nginx/sites-available/default

# Expose port 80
EXPOSE 80

# Start script
WORKDIR /var/www/html
RUN echo '#!/bin/bash\n\
# Ensure storage directories exist and have correct permissions\n\
mkdir -p /var/www/html/storage/logs\n\
mkdir -p /var/www/html/storage/framework/{cache,sessions,views}\n\
mkdir -p /var/www/html/bootstrap/cache\n\
chown -R www-data:www-data /var/www/html/storage\n\
chown -R www-data:www-data /var/www/html/bootstrap/cache\n\
chmod -R 775 /var/www/html/storage\n\
chmod -R 775 /var/www/html/bootstrap/cache\n\
\n\
# Generate app key if not exists\n\
if [ ! -f /var/www/html/.env ]; then\n\
    cp /var/www/html/.env.example /var/www/html/.env\n\
fi\n\
\n\
if ! grep -q "APP_KEY=base64:" /var/www/html/.env; then\n\
    php artisan key:generate --force\n\
fi\n\
\n\
# Start PHP-FPM and Nginx\n\
php-fpm -D\n\
nginx -g "daemon off;"' > /start.sh && chmod +x /start.sh

CMD ["/start.sh"]
