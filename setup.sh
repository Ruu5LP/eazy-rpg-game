#!/bin/bash

# Easy RPG Game Setup Script
# このスクリプトは初回セットアップを自動化します

echo "====================================="
echo "  Easy RPG Game - セットアップ開始"
echo "====================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Dockerがインストールされていません。"
    echo "   Docker Desktopをインストールしてください: https://www.docker.com/products/docker-desktop"
    exit 1
fi

echo "✅ Docker が見つかりました"

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Composeが利用できません。"
    exit 1
fi

echo "✅ Docker Compose が見つかりました"

# Copy .env.example to .env for backend
if [ ! -f backend/.env ]; then
    echo ""
    echo "📝 バックエンドの環境設定ファイルを作成中..."
    cp backend/.env.example backend/.env
    echo "✅ backend/.env を作成しました"
else
    echo "⚠️  backend/.env は既に存在します（スキップ）"
fi

echo ""
echo "🐳 Dockerコンテナをビルド・起動中..."
docker-compose up -d --build

echo ""
echo "⏳ データベースの準備ができるまで待機中..."
sleep 10

echo ""
echo "🗄️  データベースマイグレーションを実行中..."
docker-compose exec -T app php artisan key:generate
docker-compose exec -T app php artisan migrate --force

echo ""
echo "====================================="
echo "  ✅ セットアップ完了！"
echo "====================================="
echo ""
echo "🎮 ゲームを開始するには:"
echo "   ブラウザで http://localhost を開いてください"
echo ""
echo "📚 APIエンドポイント:"
echo "   http://localhost/api"
echo ""
echo "🛠️  開発コマンド:"
echo "   docker-compose logs -f       # ログを表示"
echo "   docker-compose stop          # コンテナを停止"
echo "   docker-compose start         # コンテナを起動"
echo "   docker-compose down          # コンテナを削除"
echo ""
echo "楽しいRPGライフを！ 🎮✨"
