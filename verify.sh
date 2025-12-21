#!/bin/bash

# Verification Script - Easy RPG Game
# このスクリプトはセットアップが正しく完了したかを確認します

echo "====================================="
echo "  Easy RPG Game - 環境確認"
echo "====================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check function
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $1"
        return 0
    else
        echo -e "${RED}✗${NC} $1"
        return 1
    fi
}

ERRORS=0

echo "1. Docker の確認"
echo "-----------------------------------"

# Check Docker
docker --version > /dev/null 2>&1
check_status "Docker がインストールされています"
if [ $? -ne 0 ]; then ((ERRORS++)); fi

# Check Docker Compose
if docker compose version > /dev/null 2>&1; then
    check_status "Docker Compose が利用可能です"
elif command -v docker-compose > /dev/null 2>&1; then
    check_status "Docker Compose が利用可能です"
else
    echo -e "${RED}✗${NC} Docker Compose が利用できません"
    ((ERRORS++))
fi

echo ""
echo "2. コンテナの確認"
echo "-----------------------------------"

# Check containers
if docker-compose ps | grep -q "backend"; then
    if docker-compose ps | grep "backend" | grep -q "Up"; then
        check_status "バックエンドコンテナが起動中"
    else
        echo -e "${RED}✗${NC} バックエンドコンテナが起動していません"
        ((ERRORS++))
    fi
else
    echo -e "${YELLOW}⚠${NC} バックエンドコンテナが見つかりません（未起動）"
    ((ERRORS++))
fi

if docker-compose ps | grep -q "frontend"; then
    if docker-compose ps | grep "frontend" | grep -q "Up"; then
        check_status "フロントエンドコンテナが起動中"
    else
        echo -e "${RED}✗${NC} フロントエンドコンテナが起動していません"
        ((ERRORS++))
    fi
else
    echo -e "${YELLOW}⚠${NC} フロントエンドコンテナが見つかりません（未起動）"
    ((ERRORS++))
fi

if docker-compose ps | grep -q "db"; then
    if docker-compose ps | grep "db" | grep -q "Up"; then
        check_status "データベースコンテナが起動中"
    else
        echo -e "${RED}✗${NC} データベースコンテナが起動していません"
        ((ERRORS++))
    fi
else
    echo -e "${YELLOW}⚠${NC} データベースコンテナが見つかりません（未起動）"
    ((ERRORS++))
fi

echo ""
echo "3. 環境設定ファイルの確認"
echo "-----------------------------------"

if [ -f "backend/.env" ]; then
    check_status "backend/.env が存在します"
else
    echo -e "${RED}✗${NC} backend/.env が存在しません"
    ((ERRORS++))
fi

if [ -f "frontend/.env" ]; then
    check_status "frontend/.env が存在します"
else
    echo -e "${YELLOW}⚠${NC} frontend/.env が存在しません（オプション）"
fi

echo ""
echo "4. API エンドポイントの確認"
echo "-----------------------------------"

# Check backend API
if curl -s http://localhost:8000/up > /dev/null 2>&1; then
    check_status "バックエンドAPI（port 8000）が応答しています"
else
    echo -e "${RED}✗${NC} バックエンドAPI（port 8000）が応答していません"
    ((ERRORS++))
fi

# Check frontend
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    check_status "フロントエンド（port 5173）が応答しています"
else
    echo -e "${RED}✗${NC} フロントエンド（port 5173）が応答していません"
    ((ERRORS++))
fi

echo ""
echo "5. データベースの確認"
echo "-----------------------------------"

# Check database tables
TABLES=$(docker-compose exec -T db mysql -uroot -psecret eazy_rpg -e "SHOW TABLES;" 2>/dev/null | tail -n +2)
if [ -n "$TABLES" ]; then
    check_status "データベーステーブルが作成されています"
    echo "   テーブル: $(echo $TABLES | tr '\n' ', ')"
else
    echo -e "${YELLOW}⚠${NC} データベーステーブルが見つかりません"
    echo "   マイグレーションを実行してください: docker-compose exec backend php artisan migrate"
    ((ERRORS++))
fi

echo ""
echo "====================================="
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ すべての確認項目をクリアしました！${NC}"
    echo ""
    echo "🎮 ゲームを開始できます："
    echo "   http://localhost:5173"
    echo ""
else
    echo -e "${YELLOW}⚠ $ERRORS 個の問題が見つかりました${NC}"
    echo ""
    echo "🔧 トラブルシューティング："
    echo "   1. docker-compose up -d を実行"
    echo "   2. docker-compose logs を確認"
    echo "   3. setup.sh を再実行"
    echo ""
fi
echo "====================================="

exit $ERRORS
