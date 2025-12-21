# システムアーキテクチャ

## 概要

Easy RPG Gameは、モダンなWeb技術スタックを使用した3層アーキテクチャのアプリケーションです。

## アーキテクチャ図

```
┌─────────────────────────────────────────────────────────┐
│                       ブラウザ                           │
│                   (localhost:5173)                       │
└─────────────────────┬───────────────────────────────────┘
                      │
                      │ HTTP/REST API
                      │
┌─────────────────────▼───────────────────────────────────┐
│              フロントエンド層                            │
│                                                          │
│  ┌──────────────────────────────────────────────┐      │
│  │   React + TypeScript + TailwindCSS            │      │
│  │   - CommandTerminal Component                 │      │
│  │   - API Service                               │      │
│  │   - State Management                          │      │
│  └──────────────────────────────────────────────┘      │
│                                                          │
│         Container: Node.js 20 + Vite                    │
└─────────────────────┬───────────────────────────────────┘
                      │
                      │ HTTP/JSON
                      │
┌─────────────────────▼───────────────────────────────────┐
│              バックエンド層                              │
│                                                          │
│  ┌──────────────────────────────────────────────┐      │
│  │   Laravel 12 + PHP 8.2                        │      │
│  │   ┌──────────────────────────────────┐       │      │
│  │   │ Controllers (GameController)      │       │      │
│  │   └──────────┬───────────────────────┘       │      │
│  │              │                                │      │
│  │   ┌──────────▼───────────────────────┐       │      │
│  │   │ Services (AIService)              │       │      │
│  │   └──────────┬───────────────────────┘       │      │
│  │              │                                │      │
│  │   ┌──────────▼───────────────────────┐       │      │
│  │   │ Models (Player, Enemy, Battle)   │       │      │
│  │   └──────────┬───────────────────────┘       │      │
│  └──────────────┼──────────────────────────────┘      │
│                 │                                       │
│         Container: PHP 8.2 + FPM                       │
└─────────────────┼───────────────────────────────────────┘
                  │
                  │ PDO/Eloquent
                  │
┌─────────────────▼───────────────────────────────────────┐
│              データベース層                              │
│                                                          │
│  ┌──────────────────────────────────────────────┐      │
│  │   MySQL 8.0                                   │      │
│  │   - players (プレイヤー情報)                  │      │
│  │   - enemies (敵情報)                          │      │
│  │   - battles (戦闘状態)                        │      │
│  │   - game_sessions (セッション)                │      │
│  └──────────────────────────────────────────────┘      │
│                                                          │
│         Container: MySQL 8.0                            │
└─────────────────────────────────────────────────────────┘

         External: AI API (Optional)
              │
              ├─ OpenAI API (GPT-4)
              ├─ Anthropic API (Claude)
              └─ Google Gemini API
```

## 技術スタック詳細

### フロントエンド

#### React 19
- 最新のReact機能を使用
- 関数コンポーネントとHooks
- TypeScriptによる型安全性

#### Vite
- 高速な開発サーバー
- Hot Module Replacement (HMR)
- 最適化されたビルド

#### TailwindCSS 4
- ユーティリティファーストCSS
- レスポンシブデザイン
- ダークモード対応可能

### バックエンド

#### Laravel 12
- 最新のLaravelフレームワーク
- Eloquent ORM
- RESTful APIルーティング
- ミドルウェアによる処理

#### PHP 8.2
- 型宣言
- エラーハンドリング
- パフォーマンス最適化

### データベース

#### MySQL 8.0
- リレーショナルデータベース
- トランザクション対応
- JSON型サポート

### インフラ

#### Docker Compose
- マルチコンテナ管理
- 開発環境の統一
- 簡単なセットアップ

## データフロー

### 1. ゲーム開始フロー

```
User Input: "start プレイヤー"
    ↓
CommandTerminal (React)
    ↓
API Service (fetch)
    ↓
POST /api/game/command
    ↓
GameController::executeCommand()
    ↓
Player::create()
    ↓
MySQL: INSERT INTO players
    ↓
Response: JSON
    ↓
CommandTerminal: メッセージ表示
```

### 2. 戦闘フロー

```
User Input: "attack"
    ↓
CommandTerminal (React)
    ↓
POST /api/game/command
    ↓
GameController::attack()
    ↓
├─ Player情報取得
├─ Battle情報取得
├─ ダメージ計算
├─ AIService::getEnemyAction() [Optional]
│   └─ OpenAI/Anthropic API呼び出し
├─ 敵の反撃処理
└─ データベース更新
    ↓
Response: 戦闘結果
    ↓
CommandTerminal: 結果表示
```

## セキュリティ

### CORS設定
- フロントエンドからのリクエストを許可
- `config/cors.php`で設定

### セッション管理
- Laravelのセッション機能を使用
- データベースにセッションを保存

### APIキー管理
- `.env`ファイルで管理
- Gitにはコミットしない
- 環境変数として設定

## スケーラビリティ

### 現在の構成
- 単一サーバーで動作
- 開発・小規模向け

### 将来の拡張
- ロードバランサーの追加
- データベースのレプリケーション
- Redisによるキャッシング
- キュー処理の追加

## パフォーマンス最適化

### フロントエンド
- Viteによる最適化されたビルド
- 遅延ローディング
- メモ化（React.memo）

### バックエンド
- Eloquentクエリの最適化
- キャッシュの活用
- データベースインデックス

### データベース
- 適切なインデックス設定
- クエリの最適化
- コネクションプーリング

## 開発ワークフロー

```
開発者
  ↓
コード変更
  ↓
Git commit
  ↓
docker-compose up
  ↓
自動リロード (HMR)
  ↓
ブラウザで確認
  ↓
テスト
  ↓
Git push
```

## デプロイメント戦略

### 開発環境
- Docker Composeで完結
- ホットリロード有効
- デバッグモード有効

### 本番環境（推奨）
- Kubernetes / AWS ECS
- 環境変数で設定管理
- ログ集約
- モニタリング

## 監視とログ

### ログ出力
- Laravel: `storage/logs/laravel.log`
- Docker: `docker-compose logs`

### エラートラッキング
- Sentry等の導入を推奨
- エラーの集約と通知

## バックアップ戦略

### データベース
```bash
# バックアップ
docker-compose exec db mysqldump -u root -p eazy_rpg > backup.sql

# リストア
docker-compose exec -T db mysql -u root -p eazy_rpg < backup.sql
```

### ファイル
- Laravelのstorage/appディレクトリ
- 環境設定ファイル（.env）

## 参考資料

- [Laravel Documentation](https://laravel.com/docs)
- [React Documentation](https://react.dev/)
- [Docker Documentation](https://docs.docker.com/)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
