#!/bin/bash

# Fix Laravel storage permissions
echo "🔧 Laravelのストレージ権限を修正中..."

docker-compose exec app bash -c "
    mkdir -p /var/www/html/storage/logs
    mkdir -p /var/www/html/storage/framework/cache
    mkdir -p /var/www/html/storage/framework/sessions
    mkdir -p /var/www/html/storage/framework/views
    mkdir -p /var/www/html/bootstrap/cache
    chown -R www-data:www-data /var/www/html/storage
    chown -R www-data:www-data /var/www/html/bootstrap/cache
    chmod -R 775 /var/www/html/storage
    chmod -R 775 /var/www/html/bootstrap/cache
    
    # Generate app key if not exists
    if ! grep -q 'APP_KEY=base64:' /var/www/html/.env; then
        php artisan key:generate --force
    fi
    
    echo '✅ 権限の修正が完了しました'
"

echo ""
echo "✅ 完了！ブラウザをリロードしてください。"
