FROM php:8.2-apache

# Install system dependencies including Node.js
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# Clear cache
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

# Enable Apache modules
RUN a2enmod rewrite headers

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

# Build frontend (now inside backend/resources/frontend)
WORKDIR /var/www/html/resources/frontend

# Install npm dependencies with increased memory and retry logic
RUN npm cache clean --force && \
    npm install --verbose --legacy-peer-deps || \
    (npm cache clean --force && npm install --verbose --legacy-peer-deps) || \
    (npm cache clean --force && npm install --verbose --force)

# Build frontend for production with increased memory
RUN NODE_OPTIONS="--max-old-space-size=4096" npm run build

# Copy built frontend to Laravel public directory (keep Laravel's index.php as fallback)
RUN cp -r /var/www/html/resources/frontend/dist/* /var/www/html/public/

# Set proper permissions for public directory and all files
RUN chown -R www-data:www-data /var/www/html/public \
    && chmod -R 755 /var/www/html/public \
    && find /var/www/html/public -type f -exec chmod 644 {} \; \
    && find /var/www/html/public -type d -exec chmod 755 {} \;

# Configure Apache
RUN echo '<VirtualHost *:80>\n\
    ServerAdmin webmaster@localhost\n\
    DocumentRoot /var/www/html/public\n\
    DirectoryIndex index.html index.php\n\
    \n\
    <Directory /var/www/html/public>\n\
        Options FollowSymLinks\n\
        AllowOverride All\n\
        Require all granted\n\
    </Directory>\n\
    \n\
    ErrorLog ${APACHE_LOG_DIR}/error.log\n\
    CustomLog ${APACHE_LOG_DIR}/access.log combined\n\
</VirtualHost>' > /etc/apache2/sites-available/000-default.conf

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
# Start Apache\n\
apache2-foreground' > /start.sh && chmod +x /start.sh

CMD ["/start.sh"]
