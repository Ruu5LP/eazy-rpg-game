# Claude Code

## 実装前に確認すること

以下のドキュメントを仕様として扱うこと。

- docs/game-design.md
- docs/architecture.md
- docs/coding-rules.md

## 開発ルール

- Issueの目的に沿って実装する
- 既存の設計・命名規則に合わせる
- 関連のない箇所は変更しない
- 仕様変更時は関連ドキュメントも更新する
- 不明な点は既存実装との一貫性を優先する

## 作業完了前

可能な限り以下を実行する。

```bash
npm run build
php artisan test
```
