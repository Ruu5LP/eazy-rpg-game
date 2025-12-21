# AI統合ガイド

## 概要

Easy RPG Gameでは、敵キャラクターの行動決定にAI（人工知能）を使用することができます。
このドキュメントでは、推奨されるAIサービスの選択と統合方法について説明します。

## AI統合の目的

- **戦略的な敵の行動**: AIが戦況を判断して最適な行動を選択
- **動的な対話**: 敵キャラクターが状況に応じたセリフを生成
- **多様な戦闘体験**: 毎回異なる戦闘パターン

## 推奨AIサービス

### 1. OpenAI API (GPT-4)

#### 特徴
- 最も強力で汎用的な言語モデル
- 日本語サポートが優れている
- 豊富なドキュメントとコミュニティ

#### 料金
- GPT-4: 約$0.03/1K入力トークン、$0.06/1K出力トークン
- GPT-3.5 Turbo: 約$0.0005/1K入力トークン、$0.0015/1K出力トークン

#### セットアップ手順

1. OpenAIアカウントを作成: https://platform.openai.com/signup
2. APIキーを取得: https://platform.openai.com/api-keys
3. `backend/.env`にAPIキーを追加:
```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
```

4. OpenAI PHPクライアントをインストール:
```bash
docker-compose exec backend composer require openai-php/client
```

5. `backend/app/Services/AIService.php`の`callOpenAI`メソッドを実装

#### 実装例

```php
use OpenAI\Client;

private function callOpenAI(array $context): string
{
    $client = OpenAI::client($this->apiKey);
    
    $response = $client->chat()->create([
        'model' => 'gpt-4',
        'messages' => [
            [
                'role' => 'system',
                'content' => 'あなたはRPGの敵キャラクターです。戦況を分析して最適な行動を選択してください。選択肢：attack（攻撃）、defend（防御）、special（特殊技）'
            ],
            [
                'role' => 'user',
                'content' => sprintf(
                    'プレイヤーHP: %d/%d, 敵HP: %d/%d, 前回の行動: %s',
                    $context['player_hp'],
                    $context['player_max_hp'],
                    $context['enemy_hp'],
                    $context['enemy_max_hp'],
                    $context['last_action']
                )
            ]
        ],
        'temperature' => 0.7,
        'max_tokens' => 50,
    ]);
    
    return trim($response->choices[0]->message->content);
}
```

---

### 2. Anthropic API (Claude)

#### 特徴
- 安全性と信頼性を重視した設計
- 日本語の理解と生成が非常に優秀
- 長い文脈を扱える（最大200Kトークン）

#### 料金
- Claude 3 Sonnet: 約$0.003/1K入力トークン、$0.015/1K出力トークン
- Claude 3 Haiku: 約$0.00025/1K入力トークン、$0.00125/1K出力トークン

#### セットアップ手順

1. Anthropicアカウントを作成: https://console.anthropic.com/
2. APIキーを取得
3. `backend/.env`にAPIキーを追加:
```env
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx
```

4. Anthropic PHPクライアントをインストール:
```bash
docker-compose exec backend composer require anthropic-php/client
```

5. `backend/app/Services/AIService.php`の`callAnthropic`メソッドを実装

#### 実装例

```php
use Anthropic\Client;

private function callAnthropic(array $context): string
{
    $client = Anthropic::client($this->apiKey);
    
    $response = $client->messages()->create([
        'model' => 'claude-3-sonnet-20240229',
        'max_tokens' => 100,
        'messages' => [
            [
                'role' => 'user',
                'content' => sprintf(
                    'あなたはRPGの敵キャラクターです。以下の戦況で次の行動を選択してください。
                    プレイヤーHP: %d/%d
                    敵（自分）HP: %d/%d
                    前回の行動: %s
                    
                    選択肢から1つ選んで、その単語だけを返してください：
                    - attack（攻撃）
                    - defend（防御）
                    - special（特殊技）',
                    $context['player_hp'],
                    $context['player_max_hp'],
                    $context['enemy_hp'],
                    $context['enemy_max_hp'],
                    $context['last_action']
                )
            ]
        ],
    ]);
    
    return trim($response->content[0]->text);
}
```

---

### 3. Google Gemini API

#### 特徴
- 無料枠が大きい（月60リクエスト）
- マルチモーダル対応（画像、音声なども処理可能）
- Google Cloud Platformとの統合

#### 料金
- Gemini Pro: 月60リクエストまで無料
- 超過分: 約$0.0001/1K入力トークン、$0.0003/1K出力トークン

#### セットアップ手順

1. Google AI Studioでプロジェクトを作成: https://makersuite.google.com/
2. APIキーを取得
3. `backend/.env`にAPIキーを追加:
```env
GEMINI_API_KEY=xxxxxxxxxxxxx
```

4. Google Gemini PHPクライアントをインストール:
```bash
docker-compose exec backend composer require google/generative-ai-php
```

---

## コスト比較

1回の敵行動決定に必要なトークン数を約100トークンと仮定した場合：

| サービス | 1000回の戦闘コスト | 特徴 |
|---------|-------------------|------|
| OpenAI GPT-4 | 約$9.00 | 最高品質 |
| OpenAI GPT-3.5 | 約$0.20 | コスパ良好 |
| Anthropic Claude 3 Sonnet | 約$1.80 | バランス型 |
| Anthropic Claude 3 Haiku | 約$0.15 | 最安値 |
| Google Gemini Pro | 最初の60回無料 | 無料枠あり |

## 推奨設定

### 開発環境
- **Google Gemini Pro** (無料枠で十分)
- または **Claude 3 Haiku** (低コスト)

### 本番環境（少人数）
- **Claude 3 Haiku** (バランスが良い)
- または **GPT-3.5 Turbo** (OpenAI生態系)

### 本番環境（高品質）
- **Claude 3 Sonnet** (日本語に強い)
- または **GPT-4** (最高品質)

## AI統合なしでも動作します

AIのAPIキーを設定しない場合、ゲームは自動的にシンプルなランダムロジックを使用します。
まずはAIなしで動作を確認し、後からAIを追加することをお勧めします。

## セキュリティ上の注意

- APIキーは絶対にGitにコミットしないでください
- `.env`ファイルは`.gitignore`に含まれています
- 本番環境では環境変数を使用してAPIキーを管理してください

## トラブルシューティング

### API呼び出しが失敗する

1. APIキーが正しいことを確認
2. APIの利用枠を確認
3. ログを確認: `docker-compose logs backend`

### レスポンスが遅い

1. より軽量なモデルを使用（GPT-3.5、Claude Haiku）
2. `max_tokens`の値を減らす
3. タイムアウト設定を調整

### コストが高すぎる

1. キャッシュを実装して同じ状況での呼び出しを減らす
2. より安価なモデルに変更
3. AI呼び出しの頻度を制限（例：5ターンに1回）

## 参考リンク

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Anthropic Claude API Documentation](https://docs.anthropic.com/)
- [Google Gemini API Documentation](https://ai.google.dev/docs)
