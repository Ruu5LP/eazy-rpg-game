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

# Install npm dependencies with increased memory and retry logic
RUN npm cache clean --force && \
    npm install --verbose --legacy-peer-deps || \
    (npm cache clean --force && npm install --verbose --legacy-peer-deps) || \
    (npm cache clean --force && npm install --verbose --force)

COPY frontend/ ./

# Build frontend for production with increased memory
RUN NODE_OPTIONS="--max-old-space-size=4096" npm run build

# Remove Laravel's default index.php from public to avoid conflicts
RUN rm -f /var/www/html/public/index.php

# Copy built frontend to Laravel public directory
RUN cp -r /app/frontend/dist/* /var/www/html/public/

# Set proper permissions for public directory and all files
RUN chown -R www-data:www-data /var/www/html/public \
    && chmod -R 755 /var/www/html/public \
    && find /var/www/html/public -type f -exec chmod 644 {} \; \
    && find /var/www/html/public -type d -exec chmod 755 {} \;

# Create a new index.php for API routing in a separate directory
RUN mkdir -p /var/www/html/api && \
    echo '<?php\n\
define("LARAVEL_START", microtime(true));\n\
if (file_exists($maintenance = __DIR__."/../../storage/framework/maintenance.php")) {\n\
    require $maintenance;\n\
}\n\
require __DIR__."/../../vendor/autoload.php";\n\
$app = require_once __DIR__."/../../bootstrap/app.php";\n\
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);\n\
$response = $kernel->handle(\n\
    $request = Illuminate\Http\Request::capture()\n\
)->send();\n\
$kernel->terminate($request, $response);' > /var/www/html/api/index.php \
    && chmod 755 /var/www/html/api \
    && chmod 644 /var/www/html/api/index.php

# Update nginx config to serve both API and frontend
RUN echo 'server { \n\
    listen 80; \n\
    server_name localhost; \n\
    root /var/www/html/public; \n\
    index index.html; \n\
    charset utf-8; \n\
    \n\
    # Serve frontend static files first \n\
    location / { \n\
        try_files $uri $uri/ /index.html; \n\
    } \n\
    \n\
    # API routes - use the Laravel router \n\
    location /api { \n\
        alias /var/www/html/api; \n\
        try_files $uri /api/index.php?$query_string; \n\
        \n\
        location ~ \.php$ { \n\
            fastcgi_pass 127.0.0.1:9000; \n\
            fastcgi_param SCRIPT_FILENAME /var/www/html/api/index.php; \n\
            include fastcgi_params; \n\
            fastcgi_param PATH_INFO $fastcgi_path_info; \n\
        } \n\
    } \n\
    \n\
    location = /favicon.ico { access_log off; log_not_found off; } \n\
    location = /robots.txt  { access_log off; log_not_found off; } \n\
    \n\
    # Block access to hidden files \n\
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
# Ensure public directory has correct permissions\n\
chown -R www-data:www-data /var/www/html/public\n\
chmod -R 755 /var/www/html/public\n\
find /var/www/html/public -type f -exec chmod 644 {} \\;\n\
find /var/www/html/public -type d -exec chmod 755 {} \\;\n\
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
# Start PHP-FPM\n\
php-fpm -D\n\
\n\
# Wait for database to be ready\n\
echo "Waiting for database..."\n\
for i in {1..30}; do\n\
    if php artisan migrate:status --force &> /dev/null; then\n\
        echo "Database is ready!"\n\
        break\n\
    fi\n\
    if [ $i -eq 30 ]; then\n\
        echo "Warning: Database might not be ready, but starting anyway..."\n\
    fi\n\
    sleep 1\n\
done\n\
\n\
# Run migrations automatically\n\
echo "Running database migrations..."\n\
php artisan migrate --force || echo "Migration failed or already up to date"\n\
\n\
# Start Nginx\n\
nginx -g "daemon off;"' > /start.sh && chmod +x /start.sh

CMD ["/start.sh"]
