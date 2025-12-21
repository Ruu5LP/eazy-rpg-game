# Easy RPG Game

ブラウザで動作するコマンドベースのRPGゲーム

![RPG Game Terminal](docs/screenshot.png)

## 📋 概要

このプロジェクトは、ブラウザ上で動作するテキストベースのRPGゲームです。
コマンドを入力してキャラクターを操作し、敵と戦い、レベルアップを目指します。

## 🚀 技術スタック

### バックエンド
- **PHP 8.2**
- **Laravel 12** (最新版)
- **MySQL 8.0**

### フロントエンド
- **TypeScript**
- **React 19**
- **Vite** (高速ビルドツール)
- **TailwindCSS 4** (ユーティリティファーストCSSフレームワーク)

### インフラ
- **Docker & Docker Compose** (完全なコンテナ化環境)

### AI統合 (オプション)
- **OpenAI API** (GPT-4) - 推奨
- **Anthropic API** (Claude) - 推奨
- **Google Gemini API** - 無料枠あり

## 📦 セットアップ方法

### 前提条件
以下のソフトウェアがインストールされている必要があります：
- Docker Desktop (最新版)
- Git

### 1. リポジトリのクローン

```bash
git clone https://github.com/Ruu5LP/eazy-rpg-game.git
cd eazy-rpg-game
```

### 2. バックエンドの環境設定

```bash
cd backend
cp .env.example .env
```

`.env`ファイルを編集して、必要な設定を行います：
```env
APP_NAME="Easy RPG Game"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=db
DB_PORT=3306
DB_DATABASE=eazy_rpg
DB_USERNAME=root
DB_PASSWORD=secret

# AI統合用（オプション）
OPENAI_API_KEY=your_openai_api_key_here
# または
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

### 3. Docker環境の起動

プロジェクトのルートディレクトリで実行：

```bash
docker-compose up -d
```

初回起動時は、イメージのビルドとダウンロードに数分かかります。

### 4. データベースのマイグレーション

```bash
docker-compose exec backend php artisan migrate
```

### 5. アプリケーションへのアクセス

- **フロントエンド**: http://localhost:5173
- **バックエンドAPI**: http://localhost:8000/api

ブラウザで http://localhost:5173 を開くと、ゲームのターミナル画面が表示されます。

## 🎮 ゲームの遊び方

### 基本コマンド

| コマンド | 説明 |
|---------|------|
| `start <名前>` または `はじめる <名前>` | 新しいゲームを開始します |
| `status` または `ステータス` | プレイヤーの現在の状態を表示 |
| `explore` または `たんさく` | 敵を探索して戦闘を開始 |
| `help` または `ヘルプ` | コマンド一覧を表示 |

### 戦闘コマンド

| コマンド | 説明 |
|---------|------|
| `attack` または `こうげき` | 敵を攻撃します |
| `defend` または `ぼうぎょ` | 防御姿勢をとり、ダメージを軽減 |
| `flee` または `にげる` | 戦闘から逃げます |

### ゲームプレイの流れ

1. `start プレイヤー名` でゲーム開始
2. `explore` で敵を探索
3. 戦闘が始まったら `attack` で攻撃
4. 敵を倒すと経験値とゴールドを獲得
5. `status` で自分の状態を確認

## 🛠 開発

### バックエンド開発

```bash
# コンテナに入る
docker-compose exec backend bash

# マイグレーションの実行
php artisan migrate

# 新しいマイグレーションの作成
php artisan make:migration create_items_table

# 新しいモデルの作成
php artisan make:model Item

# 新しいコントローラーの作成
php artisan make:controller ItemController

# キャッシュのクリア
php artisan cache:clear
php artisan config:clear
```

### フロントエンド開発

```bash
# コンテナに入る
docker-compose exec frontend sh

# 依存関係のインストール
npm install

# 型チェック
npm run type-check

# リント
npm run lint

# ビルド
npm run build
```

### ログの確認

```bash
# 全コンテナのログを表示
docker-compose logs -f

# 特定のコンテナのログを表示
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

### コンテナの管理

```bash
# コンテナの起動
docker-compose up -d

# コンテナの停止
docker-compose stop

# コンテナの削除
docker-compose down

# コンテナの再起動
docker-compose restart

# コンテナの状態確認
docker-compose ps
```

## 🤖 AI統合について

このゲームでは、敵の行動をAIで決定することができます。

### AI統合のメリット
- 敵の行動がより戦略的になる
- 毎回異なる戦闘体験
- 敵のセリフを動的に生成

### 推奨AIサービス

#### 1. OpenAI API (GPT-4)
- **長所**: 最も強力で柔軟
- **短所**: 従量課金制
- **料金**: 約$0.01/1Kトークン

```bash
# .envに追加
OPENAI_API_KEY=sk-xxxxxxxxxxxxx
```

#### 2. Anthropic API (Claude)
- **長所**: 日本語サポートが優秀、安全性が高い
- **短所**: 従量課金制
- **料金**: 約$0.008/1Kトークン

```bash
# .envに追加
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx
```

#### 3. Google Gemini API
- **長所**: 無料枠が大きい
- **短所**: 機能が限定的
- **料金**: 月60リクエストまで無料

### AI統合の実装

`backend/app/Services/AIService.php` にAI統合のテンプレートが用意されています。

実装例：
```php
// OpenAI統合例
composer require openai-php/client

// Anthropic統合例  
composer require anthropic-php/client
```

## 📁 プロジェクト構造

```
eazy-rpg-game/
├── docker-compose.yml          # Docker Compose設定ファイル
├── README.md                   # 英語README
├── README.ja.md               # 日本語README (このファイル)
├── .gitignore                 # Git除外設定
│
├── backend/                   # Laravelバックエンド
│   ├── app/
│   │   ├── Http/
│   │   │   └── Controllers/
│   │   │       └── GameController.php  # ゲームロジック
│   │   ├── Models/            # データベースモデル
│   │   │   ├── Player.php    # プレイヤー
│   │   │   ├── Enemy.php     # 敵
│   │   │   ├── Battle.php    # 戦闘
│   │   │   └── GameSession.php # セッション
│   │   └── Services/
│   │       └── AIService.php  # AI統合サービス
│   ├── database/
│   │   └── migrations/       # データベーススキーマ
│   ├── resources/
│   │   └── frontend/        # Reactフロントエンド
│   │       ├── src/
│   │       │   ├── components/
│   │       │   │   └── CommandTerminal.tsx  # ターミナルUI
│   │       │   ├── services/
│   │       │   │   └── api.ts       # API通信
│   │       │   ├── App.tsx          # メインアプリ
│   │       │   └── index.css        # TailwindCSSスタイル
│   │       └── .env.example         # 環境変数テンプレート
│   ├── routes/
│   │   └── api.php          # APIルート定義
│   ├── Dockerfile           # Dockerコンテナ設定
│   └── .env.example         # 環境変数テンプレート
```

## 🔧 トラブルシューティング

### ポートが既に使用されている

```bash
# 使用中のポートを確認
lsof -i :5173
lsof -i :8000
lsof -i :3306

# コンテナを停止
docker-compose down

# docker-compose.ymlのポート番号を変更
```

### データベース接続エラー

```bash
# データベースコンテナを再起動
docker-compose restart db

# マイグレーションを再実行
docker-compose exec backend php artisan migrate:fresh
```

### フロントエンドがAPIに接続できない

1. `backend/resources/frontend/.env`ファイルを確認
```env
VITE_API_URL=http://localhost:8000
```

2. CORS設定を確認（`backend/config/cors.php`）

3. バックエンドが起動していることを確認
```bash
docker-compose ps
```

### コンテナが起動しない

```bash
# ログを確認
docker-compose logs

# コンテナを再ビルド
docker-compose up -d --build
```

## 🎯 今後の拡張予定

- [ ] インベントリシステム
- [ ] 装備品システム
- [ ] セーブ/ロード機能
- [ ] マルチプレイヤー対応
- [ ] ダンジョン探索
- [ ] クエストシステム
- [ ] アイテムショップ
- [ ] スキルシステム
- [ ] より高度なAI統合

## 📝 ライセンス

MIT License

## 🤝 コントリビューション

プルリクエストを歓迎します！

1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📧 お問い合わせ

質問や提案がある場合は、Issueを作成してください。

## 🙏 謝辞

- Laravel
- React
- TailwindCSS
- Vite
- Docker

---

**楽しいRPGライフを！** 🎮✨
