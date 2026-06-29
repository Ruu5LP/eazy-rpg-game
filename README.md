# Easy RPG Game

ブラウザで動作するアカウント育成型コマンドRPG。探索・戦闘・成長を繰り返しながら自分だけの冒険者を育てます。

## v0.1 機能一覧

- アカウント登録・ログイン（メール認証 / Google OAuth）
- プレイデータのアカウント単位保存（ログイン後に続きから遊べる）
- 探索システム（プレイヤーレベルに応じた敵出現）
- ターン制戦闘（攻撃・防御・逃走・アイテム使用）
- レベルアップ・ステータス成長（Lv1〜Lv5）
- 回復システム（ポーション・宿屋・自然回復）
- ボス戦（Lv5で「魔王ダークロード」に挑戦可能）
- ゲームHUD（HP・EXP・ゴールド・レベル・現在地を常時表示）
- レスポンシブ対応（PC・タブレット・スマートフォン）

## 技術スタック

### バックエンド
- PHP 8.2 / Laravel 12
- MySQL 8.0

### フロントエンド
- TypeScript / React 19 / Vite / TailwindCSS 4

### インフラ
- Docker & Docker Compose

## セットアップ

### 前提条件
- Docker Desktop
- Git

### 自動セットアップ

```bash
git clone https://github.com/Ruu5LP/eazy-rpg-game.git
cd eazy-rpg-game
./setup.sh
```

### 手動セットアップ

```bash
cp src/.env.example src/.env
docker-compose up -d --build
docker-compose exec app php artisan key:generate
docker-compose exec app php artisan migrate
```

ブラウザで `http://localhost` にアクセス。

## ゲームの遊び方

1. **アカウント作成** — メールアドレスで登録し、届いた6桁コードで認証
2. **ストーリーモードを選択** — ログイン後のロビーから開始
3. **探索** — 「すすむ」ボタンでフィールドを探索し敵と遭遇
4. **戦闘** — 「たたかう」「ぼうぎょ」「ポーション」「にげる」で戦闘
5. **回復** — 「宿屋 30G」で HP/MP 全回復、ポーションで HP +30
6. **レベルアップ** — 経験値を積んで Lv5 になったらボスに挑戦

## コマンド一覧

### 探索中
| ボタン | 説明 |
|--------|------|
| すすむ | フィールドを探索（敵と遭遇） |
| ボスに挑む | Lv5 以上で出現。魔王ダークロードに挑戦 |
| アイテム | ポーション所持数を確認 |
| ステータス | 現在のステータスと次レベルまでの経験値を表示 |
| 街に戻る | はじまりの街に戻る |

### 戦闘中
| ボタン | 説明 |
|--------|------|
| たたかう | 通常攻撃 |
| ぼうぎょ | 防御（敵のダメージを軽減） |
| ポーション | HP +30 回復（使い切り） |
| にげる | 75% の確率で逃走成功 |
| ステータス | 現在の状態を確認 |

### 街
| ボタン | 説明 |
|--------|------|
| 冒険に出る | フィールドへ移動 |
| 宿屋 30G | 30G 支払い HP/MP 全回復 |
| アイテム | ポーション所持数を確認 |
| ステータス | ステータスを確認 |

## 開発

```bash
# コンテナへの接続
docker-compose exec app bash

# マイグレーション
php artisan migrate

# テスト
php artisan test

# フロントエンドビルド
npm run build
```

## プロジェクト構造

```
eazy-rpg-game/
├── docker-compose.yml
├── src/                            # Laravel バックエンド
│   ├── app/
│   │   ├── Http/Controllers/       # GameController, AuthController
│   │   ├── Models/                 # Player, Enemy, Battle, GameSession
│   │   └── Services/               # AIService
│   ├── resources/
│   │   └── frontend/               # React フロントエンド
│   │       └── src/
│   │           ├── components/     # TitleScreen, AuthPage, MenuRPG
│   │           └── services/       # api.ts
│   ├── routes/api.php
│   └── tests/Feature/
└── README.md
```

## ライセンス

MIT
