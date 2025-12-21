# Easy RPG Game

ブラウザで動作するコマンドベースのRPGゲーム

## 技術スタック

### バックエンド
- **PHP 8.2**
- **Laravel 12** (最新版)
- **MySQL 8.0**

### フロントエンド
- **TypeScript**
- **React 19**
- **Vite**
- **TailwindCSS 4**

### インフラ
- **Docker & Docker Compose**

### AI統合
- 敵のAI行動（将来的にOpenAI/Anthropic APIを統合予定）

## セットアップ方法

### 前提条件
- Docker Desktop がインストールされていること
- Git がインストールされていること

### インストール手順

1. リポジトリをクローン
```bash
git clone <repository-url>
cd eazy-rpg-game
```

2. バックエンドの環境設定
```bash
cd backend
cp .env.example .env
```

3. Docker環境を起動
```bash
# プロジェクトルートで実行
docker-compose up -d
```

4. データベースマイグレーション
```bash
docker-compose exec backend php artisan migrate
```

5. ブラウザでアクセス
- フロントエンド: http://localhost:5173
- バックエンドAPI: http://localhost:8000

## ゲームの遊び方

### 基本コマンド

- `start <名前>` / `はじめる <名前>` - 新しいゲームを開始
- `status` / `ステータス` - プレイヤーの状態を表示
- `explore` / `たんさく` - 敵を探索
- `help` / `ヘルプ` - コマンド一覧を表示

### 戦闘コマンド

- `attack` / `こうげき` - 敵を攻撃
- `defend` / `ぼうぎょ` - 防御姿勢をとる
- `flee` / `にげる` - 戦闘から逃げる

## 開発

### バックエンド開発

```bash
# コンテナに入る
docker-compose exec backend bash

# マイグレーション実行
php artisan migrate

# モデル作成
php artisan make:model ModelName

# コントローラー作成
php artisan make:controller ControllerName
```

### フロントエンド開発

```bash
# コンテナに入る
docker-compose exec frontend sh

# 依存関係のインストール
npm install

# 開発サーバー起動（既に起動中）
npm run dev
```

### ログ確認

```bash
# 全コンテナのログ
docker-compose logs -f

# 特定のコンテナのログ
docker-compose logs -f backend
docker-compose logs -f frontend
```

## AI統合について

現在、敵の行動は簡単なランダムロジックで実装されていますが、将来的には以下のAI APIと統合する予定です：

### 推奨AI選択肢

1. **OpenAI API** (GPT-4)
   - 最も強力な言語モデル
   - 敵の戦略的な行動決定に最適
   - 料金: 従量課金

2. **Anthropic API** (Claude)
   - 安全性と信頼性が高い
   - 日本語サポートが優れている
   - 料金: 従量課金

3. **Google Gemini API**
   - 無料枠が大きい
   - マルチモーダル対応
   - 料金: 無料枠あり

### AI統合の実装方法

`.env`ファイルにAPIキーを追加：

```env
OPENAI_API_KEY=your_api_key_here
# または
ANTHROPIC_API_KEY=your_api_key_here
```

AI統合用のサービスクラスを実装し、`GameController`の敵の行動決定部分で呼び出します。

## プロジェクト構造

```
eazy-rpg-game/
├── docker-compose.yml          # Docker Compose設定
├── backend/                    # Laravelバックエンド
│   ├── app/
│   │   ├── Http/Controllers/   # コントローラー
│   │   └── Models/             # Eloquentモデル
│   ├── database/
│   │   └── migrations/         # データベースマイグレーション
│   ├── routes/
│   │   └── api.php            # APIルート
│   └── Dockerfile
├── frontend/                   # Reactフロントエンド
│   ├── src/
│   │   ├── components/        # Reactコンポーネント
│   │   ├── services/          # APIサービス
│   │   ├── App.tsx           # メインアプリ
│   │   └── index.css         # TailwindCSSスタイル
│   └── Dockerfile
└── README.md
```

## トラブルシューティング

### ポートが既に使用されている

```bash
# 使用中のポートを確認
docker-compose down
# ポート番号を変更する場合はdocker-compose.ymlを編集
```

### データベース接続エラー

```bash
# コンテナを再起動
docker-compose restart db
```

### フロントエンドがAPIに接続できない

- `frontend/.env`ファイルで`VITE_API_URL`が正しいことを確認
- CORSが有効になっていることを確認

## ライセンス

MIT

## コントリビューション

プルリクエストを歓迎します!