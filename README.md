# Easy RPG Game

ブラウザで動作するメニュー選択式RPGゲーム

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
- **Docker & Docker Compose** (統合コンテナ構成)

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

2. 自動セットアップスクリプトを実行
```bash
./setup.sh
```

**または手動セットアップ:**

```bash
# 環境設定
cp backend/.env.example backend/.env

# Docker起動
docker-compose up -d --build

# データベース設定
docker-compose exec app php artisan key:generate
docker-compose exec app php artisan migrate
```

3. ブラウザでアクセス
- ゲーム: http://localhost
- API: http://localhost/api

## ゲームの遊び方

### メニューボタン

ゲームはメニュー選択式です。画面下のボタンをクリックして遊びます：

**開始画面:**
- ゲームを始める - 新しいゲームを開始
- ヘルプ - ゲームの説明を表示

**探索中:**
- すすむ（探索）- 敵を探索
- ステータス - プレイヤーの状態を表示
- アイテム - アイテム管理（開発中）
- ヘルプ - ヘルプを表示

**戦闘中:**
- たたかう - 敵を攻撃
- ぼうぎょ - 防御姿勢をとる
- にげる - 戦闘から逃げる
- ステータス - ステータスを表示

## 開発

### アプリケーションコンテナ

統合コンテナには、バックエンド（Laravel）とフロントエンド（React）の両方が含まれています。

```bash
# コンテナに入る
docker-compose exec app bash

# マイグレーション実行
php artisan migrate

# モデル作成
php artisan make:model ModelName

# コントローラー作成
php artisan make:controller ControllerName
```

### ログ確認

```bash
# 全コンテナのログ
docker-compose logs -f

# アプリケーションコンテナのログ
docker-compose logs -f app
```

## コンテナ構成

このプロジェクトは**2つのDockerコンテナ**で動作します：

1. **appコンテナ**: バックエンド（Laravel）とフロントエンド（React）を統合
   - ポート80でNginx経由でアクセス
   - フロントエンド（静的ファイル）とAPIを同一サーバーで提供
   
2. **dbコンテナ**: MySQLデータベース
   - ポート3306

**利点:**
- 簡単なセットアップ（1つのURLでアクセス）
- CORSの問題なし
- シンプルなテストとデバッグ

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