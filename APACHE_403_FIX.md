# Apache 403 Forbidden Error - Fix Documentation

## 問題 (Problem)

Dockerコンテナを起動して `http://localhost` にアクセスすると、以下のエラーが表示されていました:

```
Forbidden
You don't have permission to access this resource.
Apache/2.4.65 (Debian) Server at localhost Port 80
```

## 原因 (Root Cause)

1. **ボリュームマウントによる上書き**: `docker-compose.yml` の `./backend:/var/www/html` マウントが、Dockerビルド時に作成されたファイルを上書き
2. **インデックスファイルの欠落**: マウント後、public ディレクトリには Laravel の `index.php` があるが、`index.html`（フロントエンドビルド）が失われる
3. **Apache ディレクトリインデックス**: Dockerfile の Apache 設定に `Options Indexes` があり、インデックスファイルがない場合にディレクトリ一覧を表示しようとする
4. **.htaccess の競合**: `.htaccess` に `-Indexes` があり、ディレクトリ一覧表示をブロックするため、403 Forbidden エラーが発生
5. **ルーティングの問題**: `.htaccess` が無条件に `index.html` にルーティングしようとし、存在しない場合に 403 エラー

## 解決策 (Solution)

### 1. Apache 設定の修正 (Dockerfile)

**変更前:**
```apache
DirectoryIndex index.html
...
Options Indexes FollowSymLinks
```

**変更後:**
```apache
DirectoryIndex index.html index.php
...
Options FollowSymLinks
```

- `Options` から `Indexes` を削除 → ディレクトリ一覧表示を無効化
- `DirectoryIndex` に `index.php` を追加 → フォールバック可能に

### 2. Laravel の index.php を保持 (Dockerfile)

**削除した行:**
```dockerfile
# Remove Laravel's default index.php from public to avoid conflicts
RUN rm -f /var/www/html/public/index.php
```

**理由:**
- Laravel の `index.php` をフォールバックとして使用
- フロントエンドのビルドがない場合でもアプリケーションが動作

### 3. .htaccess のルーティング修正 (backend/public/.htaccess)

**変更前:**
```apache
# Route all other non-file requests to React (index.html)
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.html [L]
```

**変更後:**
```apache
# Route all other non-file requests to React (index.html) if it exists, otherwise to Laravel
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{DOCUMENT_ROOT}/index.html -f
RewriteRule ^ index.html [L]

# Fallback to Laravel for all other requests
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.php [L]
```

**改善点:**
- `index.html` が存在する場合のみルーティング
- 存在しない場合は `index.php` にフォールバック

## 動作の流れ (How It Works)

1. ユーザーが `http://localhost/` にアクセス
2. Apache が DirectoryIndex をチェック: `index.html` → `index.php`
3. .htaccess のリライトルール:
   - `/api/*` リクエスト → Laravel の `index.php`
   - その他のリクエスト → `index.html`（存在する場合）または `index.php`（フォールバック）
4. どの状態でも 403 エラーは発生しない

## テスト結果 (Testing Results)

この修正により:
- ✅ 403 Forbidden エラーが解消
- ✅ フロントエンドがビルドされていない場合、Laravel がアプリケーションを提供
- ✅ フロントエンドビルドが存在する場合、React アプリが提供される
- ✅ API エンドポイント (`/api/*`) が正常に動作

## セキュリティ (Security)

- ✅ CodeQL による脆弱性スキャン完了（問題なし）
- ✅ 変更は設定のみ（Apache 設定と .htaccess ルーティング）
- ✅ コード実行の変更なし

## 使用方法 (Usage)

修正後、通常通りDockerコンテナを起動してください:

```bash
# コンテナのビルドと起動
docker-compose up -d --build

# または setup スクリプトを使用
./setup.sh
```

ブラウザで `http://localhost` にアクセスすると、エラーなくアプリケーションが表示されます。

## 追加情報 (Additional Notes)

- この修正は既存の機能に影響を与えません
- フロントエンドとバックエンドの両方が正常に動作します
- 開発モードと本番モードの両方で機能します
