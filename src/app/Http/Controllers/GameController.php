<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Player;
use App\Models\Enemy;
use App\Models\Battle;
use App\Models\GameSession;
use Carbon\Carbon;

class GameController extends Controller
{
    private const INITIAL_POTIONS = 3;
    private const POTION_HEAL_AMOUNT = 30;
    private const REST_HEAL_AMOUNT = 10;
    private const NATURAL_REGEN_AMOUNT = 3;
    private const NATURAL_REGEN_INTERVAL_SECONDS = 30;
    private const INN_COST = 30;
    private const LEVEL_UP_STAT_GAINS = [
        'max_hp' => 20,
        'max_mp' => 10,
        'attack' => 5,
        'defense' => 3,
    ];

    private function getOrCreateSession(Request $request): GameSession
    {
        $user = $request->user();

        $session = GameSession::firstOrCreate(
            ['user_id' => $user->id],
            [
                'session_token' => $request->session()->getId(),
                'game_data' => [],
            ]
        );

        if ($session->session_token !== $request->session()->getId()) {
            $session->forceFill(['session_token' => $request->session()->getId()])->save();
        }

        return $session;
    }

    public function executeCommand(Request $request): JsonResponse
    {
        $command = strtolower(trim($request->input('command', '')));
        $session = $this->getOrCreateSession($request);

        try {
            $result = $this->processCommand($command, $session);
            $result['game_state'] ??= $this->getGameStateData($session->refresh());
            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'エラーが発生しました: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function getGameState(Request $request): JsonResponse
    {
        $session = $this->getOrCreateSession($request);
        
        $this->applyTimedNaturalRegen($session);
        $session->refresh();

        $player = null;
        if ($session->player_id) {
            $player = Player::find($session->player_id);
        }

        $currentEnemy = null;
        $inBattle = false;
        if ($session->battle_id) {
            $battle = Battle::with('enemy')->find($session->battle_id);
            if ($battle && $battle->is_active) {
                $inBattle = true;
                $currentEnemy = [
                    'name' => $battle->enemy->name,
                    'hp' => $battle->enemy_hp,
                    'max_hp' => $battle->enemy->max_hp,
                    'level' => $battle->enemy->level,
                ];
            }
        }

        return response()->json([
            'player' => $player,
            'inBattle' => $inBattle,
            'currentEnemy' => $currentEnemy,
            'location' => $this->currentLocation($session),
            'hpRegen' => $this->getHpRegenData($session, $player),
        ]);
    }

    public function startNewGame(Request $request): JsonResponse
    {
        $session = $this->getOrCreateSession($request);
        $user = $request->user();
        $name = $user->name;

        $existing = Player::where('user_id', $user->id)->latest('id')->first();

        if ($existing) {
            $session->player_id = $existing->id;
            if (!$session->game_data) {
                $session->game_data = $this->initialGameData();
            }
            $session->save();

            return response()->json([
                'success' => true,
                'message' => "おかえり、{$name}！冒険を再開します。",
                'game_state' => $this->getGameStateData($session->refresh()),
            ]);
        }

        $player = Player::create([
            'user_id' => $user->id,
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
        $session->battle_id = null;
        $session->game_data = $this->initialGameData();
        $session->save();

        return response()->json([
            'success' => true,
            'message' => "{$name}の冒険が始まりました！\nはじまりの街から旅支度を整えましょう。",
            'game_state' => $this->getGameStateData($session),
        ]);
    }

    public function saveGame(Request $request): JsonResponse
    {
        // Auto-save is already implemented, but this endpoint can be used for manual saves
        return response()->json([
            'success' => true,
            'message' => 'ゲームをセーブしました。',
        ]);
    }

    public function loadGame(Request $request): JsonResponse
    {
        $session = $this->getOrCreateSession($request);
        
        if (!$session->player_id) {
            return response()->json([
                'success' => false,
                'message' => 'セーブデータが見つかりません。',
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'ゲームをロードしました。',
            'game_state' => $this->getGameStateData($session),
        ]);
    }

    // Helper to get state data array
    private function getGameStateData(GameSession $session): array
    {
        $this->applyTimedNaturalRegen($session);
        $session->refresh();

        $player = null;
        if ($session->player_id) {
            $player = Player::find($session->player_id);
        }

        $currentEnemy = null;
        $inBattle = false;
        if ($session->battle_id) {
            $battle = Battle::with('enemy')->find($session->battle_id);
            if ($battle && $battle->is_active) {
                $inBattle = true;
                $currentEnemy = [
                    'name' => $battle->enemy->name,
                    'hp' => $battle->enemy_hp,
                    'max_hp' => $battle->enemy->max_hp,
                    'level' => $battle->enemy->level,
                ];
            }
        }

        return [
            'player' => $player,
            'inBattle' => $inBattle,
            'currentEnemy' => $currentEnemy,
            'location' => $this->currentLocation($session),
            'hpRegen' => $this->getHpRegenData($session, $player),
        ];
    }

    // Existing private methods...
    private function processCommand(string $command, GameSession $session): array
    {
        $parts = explode(' ', $command);
        $action = $parts[0] ?? '';
        if ($action === 'use' && ($parts[1] ?? '') === 'potion') {
            $action = 'use_potion';
        }

        // Handle start command specially if called via executeCommand
        if ($action === 'start' || $action === 'はじめる') {
            $user = $session->user;
            $existing = Player::where('user_id', $user->id)->latest('id')->first();

            if ($existing) {
                $session->player_id = $existing->id;
                if (!$session->game_data) {
                    $session->game_data = $this->initialGameData();
                }
                $session->save();

                return [
                    'success' => true,
                    'message' => "おかえり、{$user->name}！冒険を再開します。",
                ];
            }

            $player = Player::create([
                'user_id' => $user->id,
                'name' => $user->name,
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
            $session->battle_id = null;
            $session->game_data = $this->initialGameData();
            $session->save();

            return [
                'success' => true,
                'message' => "{$user->name}の冒険が始まりました！\nはじまりの街から旅支度を整えましょう。",
            ];
        }

        return match($action) {
            'help', 'ヘルプ' => $this->showHelp(),
            'status', 'ステータス' => $this->showStatus($session),
            'attack', 'こうげき' => $this->attack($session),
            'defend', 'ぼうぎょ' => $this->defend($session),
            'flee', 'にげる' => $this->flee($session),
            'explore', 'たんさく' => $this->explore($session),
            'items', 'アイテム' => $this->showItems($session),
            'potion', 'use_potion', 'use-potion', 'heal' => $this->usePotion($session),
            'rest' => $this->rest($session),
            'inn', 'town' => $this->stayAtInn($session),
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

    private function showStatus(GameSession $session): array
    {
        if (!$session->player_id) {
            return [
                'success' => false,
                'message' => "ゲームが開始されていません。",
            ];
        }

        $player = Player::find($session->player_id);
        
        $nextLevelExp = $player->level * 100;
        $remainingExp = max(0, $nextLevelExp - $player->experience);

        $message = "=== {$player->name} のステータス ===\n";
        $message .= "レベル: {$player->level}\n";
        $message .= "HP: {$player->hp}/{$player->max_hp}\n";
        $message .= "MP: {$player->mp}/{$player->max_mp}\n";
        $message .= "攻撃力: {$player->attack}\n";
        $message .= "防御力: {$player->defense}\n";
        $message .= "経験値: {$player->experience} (次Lvまで: {$remainingExp})\n";
        $message .= "ゴールド: {$player->gold}G\n";
        $message .= "ポーション: " . $this->potionCount($session) . "個\n";

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
                'message' => "ゲームが開始されていません。",
            ];
        }

        if ($session->battle_id) {
            $battle = Battle::find($session->battle_id);
            if ($battle && $battle->is_active) {
                return [
                    'success' => false,
                    'message' => "すでに戦闘中です！先に戦闘を終わらせてください。",
                ];
            }
            $session->battle_id = null;
            $session->save();
        }

        $player = Player::find($session->player_id);

        $enemyData = $this->selectEnemyForPlayer($player);

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
        $this->setLocation($session, 'adventure');

        $explorationTexts = [
            "草むらをかき分けると…",
            "足音が聞こえると思ったら…",
            "ふと気配を感じた！",
            "道の陰から突然…",
        ];
        $intro = $explorationTexts[array_rand($explorationTexts)];

        return [
            'success' => true,
            'message' => "{$intro}\n野生の{$enemy->name} (Lv.{$enemy->level})が現れた！\n敵HP: {$enemy->hp}/{$enemy->max_hp}",
        ];
    }

    private function selectEnemyForPlayer(Player $player): array
    {
        $level = $player->level;

        $allEnemies = [
            ['name' => 'スライム',   'level' => 1, 'hp' => 25,  'attack' => 5,  'defense' => 1, 'exp' => 15,  'gold' => 10, 'min_level' => 1, 'max_level' => 3],
            ['name' => 'コウモリ',   'level' => 1, 'hp' => 20,  'attack' => 6,  'defense' => 1, 'exp' => 12,  'gold' => 8,  'min_level' => 1, 'max_level' => 3],
            ['name' => 'ゴブリン',   'level' => 2, 'hp' => 40,  'attack' => 8,  'defense' => 2, 'exp' => 25,  'gold' => 15, 'min_level' => 2, 'max_level' => 4],
            ['name' => 'オーガ',     'level' => 3, 'hp' => 65,  'attack' => 12, 'defense' => 4, 'exp' => 40,  'gold' => 25, 'min_level' => 3, 'max_level' => 5],
            ['name' => 'オーク',     'level' => 3, 'hp' => 70,  'attack' => 11, 'defense' => 5, 'exp' => 38,  'gold' => 28, 'min_level' => 3, 'max_level' => 5],
            ['name' => 'ダークウルフ', 'level' => 4, 'hp' => 90, 'attack' => 15, 'defense' => 5, 'exp' => 55,  'gold' => 35, 'min_level' => 4, 'max_level' => 6],
            ['name' => 'スケルトン', 'level' => 4, 'hp' => 85,  'attack' => 14, 'defense' => 6, 'exp' => 50,  'gold' => 30, 'min_level' => 4, 'max_level' => 6],
        ];

        $candidates = array_filter($allEnemies, fn($e) => $e['min_level'] <= $level && $e['max_level'] >= $level);

        if (empty($candidates)) {
            $candidates = $allEnemies;
        }

        return $candidates[array_rand($candidates)];
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

        if ($player->hp <= 0) {
            $this->returnDefeatedPlayerToTown($session, $battle);
            return [
                'success' => false,
                'message' => "倒されてしまった...\n街へ戻りました。宿屋で回復できます。",
            ];
        }

        // Player attacks
        $damage = max(1, $player->attack - $enemy->defense + rand(-2, 2));
        $battle->enemy_hp = max(0, $battle->enemy_hp - $damage);
        
        $message = "{$player->name}の攻撃！\n{$enemy->name}に{$damage}のダメージ！\n";

        // Check if enemy is defeated
        if ($battle->enemy_hp <= 0) {
            $player->experience += $enemy->experience_reward;
            $player->gold += $enemy->gold_reward;
            $levelUpResult = $this->applyLevelUps($player);
            $player->save();

            $battle->is_active = false;
            $battle->save();

            $session->battle_id = null;
            $session->save();

            $message .= "\n{$enemy->name}を倒した！\n";
            $message .= "経験値 +{$enemy->experience_reward}\n";
            $message .= "ゴールド +{$enemy->gold_reward}\n";
            if ($levelUpResult['levels'] > 0) {
                $message .= "レベルアップ！ Lv.{$player->level}になった！\n";
                $message .= $this->formatLevelUpStatGains($levelUpResult['stat_gains']) . "\n";
                $message .= "HPとMPが全回復した！\n";
            }

            return [
                'success' => true,
                'message' => $message,
            ];
        }

        // Enemy attacks back
        $enemyDamage = max(1, $enemy->attack - $player->defense + rand(-2, 2));
        $player->hp = max(0, $player->hp - $enemyDamage);
        $player->save();

        $battle->save();

        $message .= "{$enemy->name}の反撃！\n{$player->name}に{$enemyDamage}のダメージ！\n";
        $message .= "\n[自分] HP: {$player->hp}/{$player->max_hp}\n";
        $message .= "[{$enemy->name}] HP: {$battle->enemy_hp}/{$enemy->max_hp}\n";

        // Check if player is defeated
        if ($player->hp <= 0) {
            $this->returnDefeatedPlayerToTown($session, $battle);
            $message .= "\n倒されてしまった...\n街へ戻りました。宿屋で回復できます。";
            
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

    /**
     * @return array{levels: int, stat_gains: array{max_hp: int, max_mp: int, attack: int, defense: int}}
     */
    private function applyLevelUps(Player $player): array
    {
        $levelUps = 0;
        $player->level = max(1, $player->level);

        while ($player->experience >= $player->level * 100) {
            $player->level++;
            $levelUps++;
        }

        $statGains = [
            'max_hp' => self::LEVEL_UP_STAT_GAINS['max_hp'] * $levelUps,
            'max_mp' => self::LEVEL_UP_STAT_GAINS['max_mp'] * $levelUps,
            'attack' => self::LEVEL_UP_STAT_GAINS['attack'] * $levelUps,
            'defense' => self::LEVEL_UP_STAT_GAINS['defense'] * $levelUps,
        ];

        if ($levelUps > 0) {
            $player->max_hp += $statGains['max_hp'];
            $player->max_mp += $statGains['max_mp'];
            $player->attack += $statGains['attack'];
            $player->defense += $statGains['defense'];
            $player->hp = $player->max_hp;
            $player->mp = $player->max_mp;
        }

        return [
            'levels' => $levelUps,
            'stat_gains' => $statGains,
        ];
    }

    /**
     * @param array{max_hp: int, max_mp: int, attack: int, defense: int} $statGains
     */
    private function formatLevelUpStatGains(array $statGains): string
    {
        return "ステータスアップ！\n"
            . "最大HP +{$statGains['max_hp']}\n"
            . "最大MP +{$statGains['max_mp']}\n"
            . "攻撃力 +{$statGains['attack']}\n"
            . "防御力 +{$statGains['defense']}";
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
        if (!$battle || !$battle->is_active) {
            return [
                'success' => false,
                'message' => "戦闘中ではありません。",
            ];
        }

        $player = Player::find($session->player_id);
        $enemy = $battle->enemy;

        if ($player->hp <= 0) {
            $this->returnDefeatedPlayerToTown($session, $battle);
            return [
                'success' => false,
                'message' => "倒されてしまった...\n街へ戻りました。宿屋で回復できます。",
            ];
        }

        // Reduced damage when defending
        $enemyDamage = (int) max(0, round(($enemy->attack - $player->defense * 2) / 2 + rand(-1, 1)));
        $player->hp = max(0, $player->hp - $enemyDamage);
        $player->save();

        $message = "{$player->name}は防御姿勢を取った！\n";
        $message .= "{$enemy->name}の攻撃！\n{$player->name}に{$enemyDamage}のダメージ！\n";
        $message .= "\n[自分] HP: {$player->hp}/{$player->max_hp}\n";

        if ($player->hp <= 0) {
            $this->returnDefeatedPlayerToTown($session, $battle);
            $message .= "\n倒されてしまった...\n街へ戻りました。宿屋で回復できます。";
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

        $battle = Battle::with('enemy')->find($session->battle_id);
        if (!$battle || !$battle->is_active) {
            return [
                'success' => false,
                'message' => "戦闘中ではありません。",
            ];
        }

        $fleeChance = 75;
        if (rand(1, 100) <= $fleeChance) {
            $battle->is_active = false;
            $battle->save();

            $session->battle_id = null;
            $session->save();

            return [
                'success' => true,
                'message' => "うまく逃げ出した！",
            ];
        }

        $player = Player::find($session->player_id);
        $enemy = $battle->enemy;
        $enemyDamage = max(1, $enemy->attack - $player->defense + rand(-1, 1));
        $player->hp = max(0, $player->hp - $enemyDamage);
        $player->save();

        $message = "逃げようとしたが失敗した！\n";
        $message .= "{$enemy->name}に{$enemyDamage}のダメージを受けた！\n";
        $message .= "[自分] HP: {$player->hp}/{$player->max_hp}";

        if ($player->hp <= 0) {
            $this->returnDefeatedPlayerToTown($session, $battle);
            $message .= "\n倒されてしまった...\n街へ戻りました。";
        }

        return [
            'success' => true,
            'message' => $message,
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
            'message' => "=== アイテム ===\n\nポーション: " . $this->potionCount($session) . "個\n効果: HPを" . self::POTION_HEAL_AMOUNT . "回復\n使い方: 'potion' または 'use potion'",
        ];
    }

    private function usePotion(GameSession $session): array
    {
        if (!$session->player_id) {
            return [
                'success' => false,
                'message' => 'ゲームが開始されていません。',
            ];
        }

        $player = Player::find($session->player_id);
        if (!$player) {
            return [
                'success' => false,
                'message' => 'プレイヤーが見つかりません。',
            ];
        }

        if ($this->potionCount($session) <= 0) {
            return [
                'success' => false,
                'message' => 'ポーションがありません。Goldがあれば街へ戻って宿屋に泊まれます。',
            ];
        }

        if ($player->hp >= $player->max_hp) {
            return [
                'success' => false,
                'message' => 'HPはすでに満タンです。',
            ];
        }

        $healed = $this->healPlayer($player, self::POTION_HEAL_AMOUNT);
        $this->setPotionCount($session, $this->potionCount($session) - 1);

        return [
            'success' => true,
            'message' => "ポーションを使った！\nHPが{$healed}回復した。\nHP: {$player->hp}/{$player->max_hp}\n残りポーション: " . $this->potionCount($session),
        ];
    }

    private function rest(GameSession $session): array
    {
        if (!$session->player_id) {
            return [
                'success' => false,
                'message' => 'ゲームが開始されていません。',
            ];
        }

        if ($this->hasActiveBattle($session)) {
            return [
                'success' => false,
                'message' => '戦闘中は休めません。ポーションを使うか、先に逃げてください。',
            ];
        }

        $player = Player::find($session->player_id);
        if ($player->hp <= 0) {
            return [
                'success' => false,
                'message' => '倒れているため休めません。街へ戻って宿屋に泊まってください。',
            ];
        }

        $healed = $this->healPlayer($player, self::REST_HEAL_AMOUNT);

        return [
            'success' => true,
            'message' => $healed > 0
                ? "少し休んで自然回復した。\nHPが{$healed}回復した。\nHP: {$player->hp}/{$player->max_hp}"
                : 'HPはすでに満タンです。',
        ];
    }

    private function stayAtInn(GameSession $session): array
    {
        if (!$session->player_id) {
            return [
                'success' => false,
                'message' => 'ゲームが開始されていません。',
            ];
        }

        if ($this->hasActiveBattle($session)) {
            return [
                'success' => false,
                'message' => '戦闘中は街へ戻れません。先に逃げてください。',
            ];
        }

        $player = Player::find($session->player_id);
        if ($player->gold < self::INN_COST) {
            return [
                'success' => false,
                'message' => "Goldが足りません。宿屋には " . self::INN_COST . "G 必要です。\n所持Gold: {$player->gold}G",
            ];
        }

        $healed = max(0, $player->max_hp - $player->hp);
        $player->gold -= self::INN_COST;
        $player->hp = $player->max_hp;
        $player->mp = $player->max_mp;
        $player->save();
        $this->setLocation($session, 'town');

        return [
            'success' => true,
            'message' => "街へ戻り、宿屋に泊まった。\n" . self::INN_COST . "G を支払い、HPとMPが全回復した。\nHP回復量: {$healed}\nGold: {$player->gold}G",
        ];
    }

    private function healPlayer(Player $player, int $amount): int
    {
        $before = $player->hp;
        $player->hp = min($player->max_hp, $player->hp + $amount);
        $player->save();

        return $player->hp - $before;
    }

    private function applyTimedNaturalRegen(GameSession $session): void
    {
        if (!$session->player_id) {
            return;
        }

        $player = Player::find($session->player_id);
        if (!$player) {
            return;
        }

        $now = now();
        $lastRegenAt = $this->lastNaturalRegenAt($session) ?? $now;

        if ($player->hp <= 0 || $player->hp >= $player->max_hp) {
            $this->setLastNaturalRegenAt($session, $now);
            return;
        }

        $elapsedSeconds = max(0, $lastRegenAt->diffInSeconds($now));
        $ticks = intdiv($elapsedSeconds, self::NATURAL_REGEN_INTERVAL_SECONDS);

        if ($ticks <= 0) {
            return;
        }

        $this->healPlayer($player, $ticks * self::NATURAL_REGEN_AMOUNT);
        $this->setLastNaturalRegenAt(
            $session,
            $lastRegenAt->copy()->addSeconds($ticks * self::NATURAL_REGEN_INTERVAL_SECONDS)
        );
    }

    private function getHpRegenData(GameSession $session, ?Player $player): array
    {
        $lastRegenAt = $this->lastNaturalRegenAt($session) ?? now();
        $secondsSinceLast = max(0, $lastRegenAt->diffInSeconds(now()));
        $secondsUntilNext = self::NATURAL_REGEN_INTERVAL_SECONDS - ($secondsSinceLast % self::NATURAL_REGEN_INTERVAL_SECONDS);
        $missingHp = $player ? max(0, $player->max_hp - $player->hp) : 0;
        $ticksUntilFull = $missingHp > 0 ? (int) ceil($missingHp / self::NATURAL_REGEN_AMOUNT) : 0;

        return [
            'amount' => self::NATURAL_REGEN_AMOUNT,
            'interval_seconds' => self::NATURAL_REGEN_INTERVAL_SECONDS,
            'seconds_until_next' => $player && $player->hp > 0 && $missingHp > 0 ? $secondsUntilNext : 0,
            'seconds_until_full' => $ticksUntilFull > 0
                ? (($ticksUntilFull - 1) * self::NATURAL_REGEN_INTERVAL_SECONDS) + $secondsUntilNext
                : 0,
            'is_full' => $missingHp === 0,
            'is_active' => (bool) ($player && $player->hp > 0 && $missingHp > 0),
        ];
    }

    private function lastNaturalRegenAt(GameSession $session): ?Carbon
    {
        $lastRegenAt = data_get($session->game_data, 'natural_regen.last_at');

        return $lastRegenAt ? Carbon::parse($lastRegenAt) : null;
    }

    private function setLastNaturalRegenAt(GameSession $session, Carbon $time): void
    {
        $gameData = $session->game_data ?? [];
        data_set($gameData, 'natural_regen.last_at', $time->toIso8601String());
        $session->game_data = $gameData;
        $session->save();
    }

    private function hasActiveBattle(GameSession $session): bool
    {
        if (!$session->battle_id) {
            return false;
        }

        return Battle::where('id', $session->battle_id)
            ->where('is_active', true)
            ->exists();
    }

    private function returnDefeatedPlayerToTown(GameSession $session, Battle $battle): void
    {
        $battle->is_active = false;
        $battle->save();

        $session->battle_id = null;
        $this->setLocation($session, 'town');
    }

    private function initialGameData(): array
    {
        return [
            'location' => 'town',
            'items' => [
                'potion' => self::INITIAL_POTIONS,
            ],
        ];
    }

    private function currentLocation(GameSession $session): string
    {
        return data_get($session->game_data, 'location', 'adventure');
    }

    private function setLocation(GameSession $session, string $location): void
    {
        $gameData = $session->game_data ?? [];
        data_set($gameData, 'location', $location);
        $session->game_data = $gameData;
        $session->save();
    }

    private function potionCount(GameSession $session): int
    {
        return max(0, (int) data_get($session->game_data, 'items.potion', self::INITIAL_POTIONS));
    }

    private function setPotionCount(GameSession $session, int $count): void
    {
        $gameData = $session->game_data ?? [];
        data_set($gameData, 'items.potion', max(0, $count));
        $session->game_data = $gameData;
        $session->save();
    }
}
