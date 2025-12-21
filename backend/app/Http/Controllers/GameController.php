<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Player;
use App\Models\Enemy;
use App\Models\Battle;
use App\Models\GameSession;

class GameController extends Controller
{
    private function getOrCreateSession(Request $request): GameSession
    {
        $token = $request->session()->getId();
        
        return GameSession::firstOrCreate(
            ['session_token' => $token],
            ['game_data' => json_encode([])]
        );
    }

    public function executeCommand(Request $request): JsonResponse
    {
        $command = strtolower(trim($request->input('command', '')));
        $session = $this->getOrCreateSession($request);

        try {
            $result = $this->processCommand($command, $session);
            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'エラーが発生しました: ' . $e->getMessage(),
            ], 500);
        }
    }

    private function processCommand(string $command, GameSession $session): array
    {
        $parts = explode(' ', $command);
        $action = $parts[0] ?? '';

        return match($action) {
            'help', 'ヘルプ' => $this->showHelp(),
            'start', 'はじめる' => $this->startNewGame($parts, $session),
            'status', 'ステータス' => $this->showStatus($session),
            'attack', 'こうげき' => $this->attack($session),
            'defend', 'ぼうぎょ' => $this->defend($session),
            'flee', 'にげる' => $this->flee($session),
            'explore', 'たんさく' => $this->explore($session),
            'items', 'アイテム' => $this->showItems($session),
            default => [
                'success' => false,
                'message' => "不明なコマンド: {$command}\n'help' でコマンド一覧を表示します。"
            ]
        };
    }

    private function showHelp(): array
    {
        $helpText = <<<HELP
        === Easy RPG ゲームコマンド ===
        
        基本コマンド:
        - start <名前> / はじめる <名前>: 新しいゲームを開始
        - status / ステータス: プレイヤーの状態を表示
        - explore / たんさく: 敵を探索
        
        戦闘コマンド:
        - attack / こうげき: 敵を攻撃
        - defend / ぼうぎょ: 防御姿勢をとる
        - flee / にげる: 戦闘から逃げる
        
        その他:
        - help / ヘルプ: このヘルプを表示
        HELP;

        return [
            'success' => true,
            'message' => $helpText,
        ];
    }

    private function startNewGame(array $parts, GameSession $session): array
    {
        $name = $parts[1] ?? 'プレイヤー';

        $player = Player::create([
            'name' => $name,
            'level' => 1,
            'hp' => 100,
            'max_hp' => 100,
            'mp' => 50,
            'max_mp' => 50,
            'attack' => 10,
            'defense' => 5,
            'experience' => 0,
            'gold' => 100,
        ]);

        $session->player_id = $player->id;
        $session->save();

        return [
            'success' => true,
            'message' => "{$name}の冒険が始まりました！\n\nHP: {$player->hp}/{$player->max_hp}\n攻撃力: {$player->attack}\n防御力: {$player->defense}\nゴールド: {$player->gold}\n\n'explore' で敵を探索できます。",
        ];
    }

    private function showStatus(GameSession $session): array
    {
        if (!$session->player_id) {
            return [
                'success' => false,
                'message' => "ゲームが開始されていません。'start <名前>' でゲームを開始してください。",
            ];
        }

        $player = Player::find($session->player_id);
        
        $message = "=== {$player->name} のステータス ===\n";
        $message .= "レベル: {$player->level}\n";
        $message .= "HP: {$player->hp}/{$player->max_hp}\n";
        $message .= "MP: {$player->mp}/{$player->max_mp}\n";
        $message .= "攻撃力: {$player->attack}\n";
        $message .= "防御力: {$player->defense}\n";
        $message .= "経験値: {$player->experience}\n";
        $message .= "ゴールド: {$player->gold}\n";

        if ($session->battle_id) {
            $battle = Battle::with('enemy')->find($session->battle_id);
            if ($battle && $battle->is_active) {
                $message .= "\n【戦闘中】\n";
                $message .= "敵: {$battle->enemy->name} (Lv.{$battle->enemy->level})\n";
                $message .= "敵HP: {$battle->enemy_hp}/{$battle->enemy->max_hp}\n";
            }
        }

        return [
            'success' => true,
            'message' => $message,
        ];
    }

    private function explore(GameSession $session): array
    {
        if (!$session->player_id) {
            return [
                'success' => false,
                'message' => "ゲームが開始されていません。'start <名前>' でゲームを開始してください。",
            ];
        }

        if ($session->battle_id) {
            $battle = Battle::find($session->battle_id);
            if ($battle && $battle->is_active) {
                return [
                    'success' => false,
                    'message' => "すでに戦闘中です！",
                ];
            }
        }

        $player = Player::find($session->player_id);
        
        // Create or get a random enemy
        $enemyTypes = [
            ['name' => 'スライム', 'level' => 1, 'hp' => 30, 'attack' => 5, 'defense' => 2, 'exp' => 10, 'gold' => 20],
            ['name' => 'ゴブリン', 'level' => 2, 'hp' => 50, 'attack' => 8, 'defense' => 3, 'exp' => 20, 'gold' => 30],
            ['name' => 'オーク', 'level' => 3, 'hp' => 80, 'attack' => 12, 'defense' => 5, 'exp' => 35, 'gold' => 50],
        ];

        $enemyData = $enemyTypes[array_rand($enemyTypes)];
        
        $enemy = Enemy::create([
            'name' => $enemyData['name'],
            'level' => $enemyData['level'],
            'hp' => $enemyData['hp'],
            'max_hp' => $enemyData['hp'],
            'attack' => $enemyData['attack'],
            'defense' => $enemyData['defense'],
            'experience_reward' => $enemyData['exp'],
            'gold_reward' => $enemyData['gold'],
        ]);

        $battle = Battle::create([
            'player_id' => $player->id,
            'enemy_id' => $enemy->id,
            'enemy_hp' => $enemy->hp,
            'is_active' => true,
        ]);

        $session->battle_id = $battle->id;
        $session->save();

        return [
            'success' => true,
            'message' => "野生の{$enemy->name} (Lv.{$enemy->level})が現れた！\nHP: {$enemy->hp}/{$enemy->max_hp}\n\n'attack' で攻撃、'defend' で防御、'flee' で逃げる",
        ];
    }

    private function attack(GameSession $session): array
    {
        if (!$session->battle_id) {
            return [
                'success' => false,
                'message' => "戦闘中ではありません。'explore' で敵を探索してください。",
            ];
        }

        $battle = Battle::with('enemy')->find($session->battle_id);
        if (!$battle || !$battle->is_active) {
            return [
                'success' => false,
                'message' => "戦闘中ではありません。",
            ];
        }

        $player = Player::find($session->player_id);
        $enemy = $battle->enemy;

        // Player attacks
        $damage = max(1, $player->attack - $enemy->defense + rand(-2, 2));
        $battle->enemy_hp -= $damage;
        
        $message = "{$player->name}の攻撃！\n{$enemy->name}に{$damage}のダメージ！\n";

        // Check if enemy is defeated
        if ($battle->enemy_hp <= 0) {
            $player->experience += $enemy->experience_reward;
            $player->gold += $enemy->gold_reward;
            $player->save();

            $battle->is_active = false;
            $battle->save();

            $session->battle_id = null;
            $session->save();

            $message .= "\n{$enemy->name}を倒した！\n";
            $message .= "経験値 +{$enemy->experience_reward}\n";
            $message .= "ゴールド +{$enemy->gold_reward}\n";

            return [
                'success' => true,
                'message' => $message,
            ];
        }

        // Enemy attacks back (AI決定 - ここでLLM APIを呼び出すこともできます)
        $enemyDamage = max(1, $enemy->attack - $player->defense + rand(-2, 2));
        $player->hp -= $enemyDamage;
        $player->save();

        $battle->save();

        $message .= "{$enemy->name}の反撃！\n{$player->name}に{$enemyDamage}のダメージ！\n";
        $message .= "\nプレイヤーHP: {$player->hp}/{$player->max_hp}\n";
        $message .= "敵HP: {$battle->enemy_hp}/{$enemy->max_hp}\n";

        // Check if player is defeated
        if ($player->hp <= 0) {
            $battle->is_active = false;
            $battle->save();
            
            $message .= "\n倒されてしまった...\nゲームオーバー";
            
            return [
                'success' => true,
                'message' => $message,
            ];
        }

        return [
            'success' => true,
            'message' => $message,
        ];
    }

    private function defend(GameSession $session): array
    {
        if (!$session->battle_id) {
            return [
                'success' => false,
                'message' => "戦闘中ではありません。",
            ];
        }

        $battle = Battle::with('enemy')->find($session->battle_id);
        $player = Player::find($session->player_id);
        $enemy = $battle->enemy;

        // Reduced damage when defending
        $enemyDamage = max(0, ($enemy->attack - $player->defense * 2) / 2 + rand(-1, 1));
        $player->hp -= $enemyDamage;
        $player->save();

        $message = "{$player->name}は防御姿勢を取った！\n";
        $message .= "{$enemy->name}の攻撃！\n{$player->name}に{$enemyDamage}のダメージ！\n";
        $message .= "\nプレイヤーHP: {$player->hp}/{$player->max_hp}\n";

        if ($player->hp <= 0) {
            $battle->is_active = false;
            $battle->save();
            $message .= "\n倒されてしまった...\nゲームオーバー";
        }

        return [
            'success' => true,
            'message' => $message,
        ];
    }

    private function flee(GameSession $session): array
    {
        if (!$session->battle_id) {
            return [
                'success' => false,
                'message' => "戦闘中ではありません。",
            ];
        }

        $battle = Battle::find($session->battle_id);
        $battle->is_active = false;
        $battle->save();

        $session->battle_id = null;
        $session->save();

        return [
            'success' => true,
            'message' => "戦闘から逃げ出した！",
        ];
    }

    private function showItems(GameSession $session): array
    {
        if (!$session->player_id) {
            return [
                'success' => false,
                'message' => "ゲームが開始されていません。",
            ];
        }

        return [
            'success' => true,
            'message' => "=== アイテム ===\n\nアイテムシステムは現在開発中です。\n今後のアップデートをお楽しみに！",
        ];
    }
}
