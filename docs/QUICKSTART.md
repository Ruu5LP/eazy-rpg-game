# クイックスタートガイド

このガイドでは、最短でEasy RPG Gameを起動する手順を説明します。

## 前提条件

- Docker Desktopがインストール済み
- ターミナル（コマンドプロンプト）の基本操作ができる

## 3ステップで起動

### ステップ1: リポジトリをクローン

```bash
git clone https://github.com/Ruu5LP/eazy-rpg-game.git
cd eazy-rpg-game
```

### ステップ2: セットアップスクリプトを実行

**Mac/Linux:**
```bash
./setup.sh
```

**Windows (Git Bash):**
```bash
bash setup.sh
```

**Windows (手動セットアップ):**
```bash
# 環境設定ファイルをコピー
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env

# Dockerコンテナを起動
docker-compose up -d

# 10秒待機
timeout /t 10

# データベースセットアップ
docker-compose exec backend php artisan key:generate
docker-compose exec backend php artisan migrate
```

### ステップ3: ブラウザでアクセス

http://localhost:5173 を開く

## 初めてのゲームプレイ

1. ターミナル画面が表示されます
2. `start プレイヤー名` と入力してEnter
3. `explore` で敵を探索
4. `attack` で敵を攻撃
5. 敵を倒すとレベルアップ！

## よく使うコマンド

| コマンド | 説明 |
|---------|------|
| `help` | ヘルプを表示 |
| `status` | ステータスを確認 |
| `explore` | 敵を探索 |
| `attack` | 攻撃 |
| `defend` | 防御 |
| `flee` | 逃げる |

## トラブルシューティング

### 起動しない場合

```bash
# コンテナの状態を確認
docker-compose ps

# ログを確認
docker-compose logs

# 再起動
docker-compose restart
```

### ポートエラーが出る場合

ポート5173や8000が既に使用されている可能性があります。

```bash
# 使用中のプロセスを確認
# Mac/Linux
lsof -i :5173
lsof -i :8000

# Windows
netstat -ano | findstr :5173
netstat -ano | findstr :8000
```

### データベースエラーが出る場合

```bash
# データベースを再セットアップ
docker-compose exec backend php artisan migrate:fresh
```

## 次のステップ

- [完全版README](../README.ja.md) を読む
- [AI統合ガイド](AI_INTEGRATION.md) でAIを追加する
- コードをカスタマイズして自分だけのRPGを作る

## サポート

問題が解決しない場合は、GitHubのIssueで質問してください：
https://github.com/Ruu5LP/eazy-rpg-game/issues

---

**それでは、楽しいRPGライフを！** 🎮✨
