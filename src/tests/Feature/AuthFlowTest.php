<?php

namespace Tests\Feature;

use App\Models\Battle;
use App\Models\Enemy;
use App\Models\GameSession;
use App\Models\Player;
use App\Models\User;
use App\Notifications\TwoFactorCodeNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class AuthFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_register_requires_two_factor_before_game_access(): void
    {
        Notification::fake();

        $response = $this->postJson('/api/auth/register', [
            'name' => 'Hero',
            'email' => 'hero@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertCreated()
            ->assertJson([
                'requires_2fa' => true,
                'email' => 'hero@example.com',
            ]);

        $this->postJson('/api/game/new')->assertUnauthorized();

        $user = User::where('email', 'hero@example.com')->firstOrFail();
        Notification::assertSentTo($user, TwoFactorCodeNotification::class);
    }

    public function test_correct_two_factor_code_logs_in_and_me_returns_user(): void
    {
        Notification::fake();

        $this->postJson('/api/auth/register', [
            'name' => 'Hero',
            'email' => 'hero@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertCreated();

        $user = User::where('email', 'hero@example.com')->firstOrFail();
        $code = $this->sentTwoFactorCodeFor($user);

        $this->postJson('/api/auth/verify-2fa', ['code' => $code])
            ->assertOk()
            ->assertJsonPath('user.email', 'hero@example.com');

        $this->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('user.name', 'Hero');
    }

    public function test_wrong_or_expired_two_factor_code_is_rejected(): void
    {
        Notification::fake();

        $this->postJson('/api/auth/register', [
            'name' => 'Hero',
            'email' => 'hero@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertCreated();

        $user = User::where('email', 'hero@example.com')->firstOrFail();

        $this->postJson('/api/auth/verify-2fa', ['code' => '000000'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('code');

        $code = $this->sentTwoFactorCodeFor($user);
        $user->forceFill([
            'two_factor_code_hash' => Hash::make($code),
            'two_factor_expires_at' => now()->subMinute(),
        ])->save();

        $this->postJson('/api/auth/verify-2fa', ['code' => $code])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('code');
    }

    public function test_game_routes_are_rejected_when_logged_out(): void
    {
        $this->getJson('/api/game/state')->assertUnauthorized();
        $this->postJson('/api/game/new')->assertUnauthorized();
        $this->postJson('/api/game/command', ['command' => 'help'])->assertUnauthorized();
    }

    public function test_dev_login_is_disabled_when_config_is_off(): void
    {
        config(['auth.dev_auto_login.enabled' => false]);

        $this->postJson('/api/auth/dev-login')->assertNotFound();
    }

    public function test_dev_login_creates_two_factor_verified_session_when_enabled(): void
    {
        config([
            'auth.dev_auto_login.enabled' => true,
            'auth.dev_auto_login.email' => 'dev-login@example.com',
            'auth.dev_auto_login.name' => 'Dev Tester',
        ]);

        $this->postJson('/api/auth/dev-login')
            ->assertOk()
            ->assertJsonPath('user.email', 'dev-login@example.com')
            ->assertJsonPath('user.name', 'Dev Tester');

        $this->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('user.email', 'dev-login@example.com');
    }

    public function test_verified_user_can_start_game_with_account_name(): void
    {
        Notification::fake();

        $this->postJson('/api/auth/register', [
            'name' => 'Hero',
            'email' => 'hero@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertCreated();

        $user = User::where('email', 'hero@example.com')->firstOrFail();
        $code = $this->sentTwoFactorCodeFor($user);

        $this->postJson('/api/auth/verify-2fa', ['code' => $code])->assertOk();

        $this->postJson('/api/game/new')
            ->assertOk()
            ->assertJsonPath('game_state.player.name', 'Hero')
            ->assertJsonPath('game_state.location', 'town');

        $this->assertDatabaseHas('players', [
            'user_id' => $user->id,
            'name' => 'Hero',
        ]);

        $session = GameSession::where('user_id', $user->id)->firstOrFail();
        $this->assertSame('town', data_get($session->game_data, 'location'));
    }

    public function test_attack_never_reduces_player_hp_below_zero(): void
    {
        $user = $this->verifiedUserWithStartedGame();
        $player = Player::where('user_id', $user->id)->firstOrFail();
        $session = GameSession::where('user_id', $user->id)->firstOrFail();

        $player->forceFill(['hp' => 1])->save();
        $enemy = Enemy::create([
            'name' => 'オーバーキル',
            'level' => 99,
            'hp' => 999,
            'max_hp' => 999,
            'attack' => 999,
            'defense' => 0,
            'experience_reward' => 1,
            'gold_reward' => 1,
        ]);
        $battle = Battle::create([
            'player_id' => $player->id,
            'enemy_id' => $enemy->id,
            'enemy_hp' => $enemy->hp,
            'is_active' => true,
        ]);
        $session->forceFill(['battle_id' => $battle->id])->save();

        $this->postJson('/api/game/command', ['command' => 'attack'])
            ->assertOk()
            ->assertJsonPath('game_state.location', 'town');

        $this->assertSame(0, $player->refresh()->hp);
        $this->assertNull($session->refresh()->battle_id);
        $this->assertSame('town', data_get($session->game_data, 'location'));
    }

    public function test_defend_never_reduces_player_hp_below_zero(): void
    {
        $user = $this->verifiedUserWithStartedGame();
        $player = Player::where('user_id', $user->id)->firstOrFail();
        $session = GameSession::where('user_id', $user->id)->firstOrFail();

        $player->forceFill(['hp' => 1])->save();
        $enemy = Enemy::create([
            'name' => 'ガード崩し',
            'level' => 99,
            'hp' => 999,
            'max_hp' => 999,
            'attack' => 999,
            'defense' => 0,
            'experience_reward' => 1,
            'gold_reward' => 1,
        ]);
        $battle = Battle::create([
            'player_id' => $player->id,
            'enemy_id' => $enemy->id,
            'enemy_hp' => $enemy->hp,
            'is_active' => true,
        ]);
        $session->forceFill(['battle_id' => $battle->id])->save();

        $this->postJson('/api/game/command', ['command' => 'defend'])
            ->assertOk()
            ->assertJsonPath('game_state.location', 'town');

        $this->assertSame(0, $player->refresh()->hp);
        $this->assertNull($session->refresh()->battle_id);
        $this->assertSame('town', data_get($session->game_data, 'location'));
    }

    public function test_player_levels_up_when_experience_reaches_threshold(): void
    {
        $user = $this->verifiedUserWithStartedGame();
        $player = Player::where('user_id', $user->id)->firstOrFail();
        $session = GameSession::where('user_id', $user->id)->firstOrFail();

        $player->forceFill([
            'level' => 1,
            'hp' => 50,
            'mp' => 20,
            'experience' => 90,
            'attack' => 999,
        ])->save();

        $enemy = Enemy::create([
            'name' => '経験値スライム',
            'level' => 1,
            'hp' => 1,
            'max_hp' => 1,
            'attack' => 1,
            'defense' => 0,
            'experience_reward' => 10,
            'gold_reward' => 1,
        ]);
        $battle = Battle::create([
            'player_id' => $player->id,
            'enemy_id' => $enemy->id,
            'enemy_hp' => $enemy->hp,
            'is_active' => true,
        ]);
        $session->forceFill(['battle_id' => $battle->id])->save();

        $response = $this->postJson('/api/game/command', ['command' => 'attack'])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('game_state.player.level', 2)
            ->assertJsonPath('game_state.player.experience', 100)
            ->assertJsonPath('game_state.player.hp', 120)
            ->assertJsonPath('game_state.player.max_hp', 120)
            ->assertJsonPath('game_state.player.mp', 60)
            ->assertJsonPath('game_state.player.max_mp', 60)
            ->assertJsonPath('game_state.player.attack', 1004)
            ->assertJsonPath('game_state.player.defense', 8);

        $this->assertStringContainsString('レベルアップ！ Lv.2になった！', $response->json('message'));
        $this->assertStringContainsString("ステータスアップ！\n最大HP +20\n最大MP +10\n攻撃力 +5\n防御力 +3", $response->json('message'));
        $this->assertStringContainsString('HPとMPが全回復した！', $response->json('message'));

        $player->refresh();
        $this->assertSame(2, $player->level);
        $this->assertSame(100, $player->experience);
        $this->assertSame(120, $player->max_hp);
        $this->assertSame(120, $player->hp);
        $this->assertSame(60, $player->max_mp);
        $this->assertSame(60, $player->mp);
        $this->assertSame(1004, $player->attack);
        $this->assertSame(8, $player->defense);
    }

    public function test_player_can_gain_multiple_levels_from_one_reward(): void
    {
        $user = $this->verifiedUserWithStartedGame();
        $player = Player::where('user_id', $user->id)->firstOrFail();
        $session = GameSession::where('user_id', $user->id)->firstOrFail();

        $player->forceFill([
            'level' => 1,
            'hp' => 50,
            'mp' => 20,
            'experience' => 290,
            'attack' => 999,
        ])->save();

        $enemy = Enemy::create([
            'name' => '経験値メタル',
            'level' => 1,
            'hp' => 1,
            'max_hp' => 1,
            'attack' => 1,
            'defense' => 0,
            'experience_reward' => 20,
            'gold_reward' => 1,
        ]);
        $battle = Battle::create([
            'player_id' => $player->id,
            'enemy_id' => $enemy->id,
            'enemy_hp' => $enemy->hp,
            'is_active' => true,
        ]);
        $session->forceFill(['battle_id' => $battle->id])->save();

        $response = $this->postJson('/api/game/command', ['command' => 'attack'])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('game_state.player.level', 4)
            ->assertJsonPath('game_state.player.experience', 310)
            ->assertJsonPath('game_state.player.hp', 160)
            ->assertJsonPath('game_state.player.max_hp', 160)
            ->assertJsonPath('game_state.player.mp', 80)
            ->assertJsonPath('game_state.player.max_mp', 80)
            ->assertJsonPath('game_state.player.attack', 1014)
            ->assertJsonPath('game_state.player.defense', 14);

        $this->assertStringContainsString('レベルアップ！ Lv.4になった！', $response->json('message'));
        $this->assertStringContainsString("ステータスアップ！\n最大HP +60\n最大MP +30\n攻撃力 +15\n防御力 +9", $response->json('message'));
        $this->assertStringContainsString('HPとMPが全回復した！', $response->json('message'));

        $player->refresh();
        $this->assertSame(4, $player->level);
        $this->assertSame(310, $player->experience);
        $this->assertSame(160, $player->max_hp);
        $this->assertSame(160, $player->hp);
        $this->assertSame(80, $player->max_mp);
        $this->assertSame(80, $player->mp);
        $this->assertSame(1014, $player->attack);
        $this->assertSame(14, $player->defense);
    }

    public function test_player_can_recover_hp_with_potion(): void
    {
        $user = $this->verifiedUserWithStartedGame();
        $player = Player::where('user_id', $user->id)->firstOrFail();
        $session = GameSession::where('user_id', $user->id)->firstOrFail();

        $player->forceFill(['hp' => 50])->save();

        $this->postJson('/api/game/command', ['command' => 'potion'])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('game_state.player.hp', 80);

        $this->assertSame(80, $player->refresh()->hp);
        $this->assertSame(2, data_get($session->refresh()->game_data, 'items.potion'));
    }

    public function test_player_can_recover_hp_by_resting_outside_battle(): void
    {
        $user = $this->verifiedUserWithStartedGame();
        $player = Player::where('user_id', $user->id)->firstOrFail();

        $player->forceFill(['hp' => 50])->save();

        $this->postJson('/api/game/command', ['command' => 'rest'])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('game_state.player.hp', 60);

        $this->assertSame(60, $player->refresh()->hp);
    }

    public function test_player_recovers_hp_automatically_over_time(): void
    {
        $user = $this->verifiedUserWithStartedGame();
        $player = Player::where('user_id', $user->id)->firstOrFail();
        $session = GameSession::where('user_id', $user->id)->firstOrFail();

        $player->forceFill(['hp' => 50])->save();
        $session->forceFill([
            'game_data' => [
                'items' => ['potion' => 3],
                'natural_regen' => [
                    'last_at' => now()->subSeconds(90)->toIso8601String(),
                ],
            ],
        ])->save();

        $this->getJson('/api/game/state')
            ->assertOk()
            ->assertJsonPath('player.hp', 59)
            ->assertJsonPath('hpRegen.amount', 3)
            ->assertJsonPath('hpRegen.interval_seconds', 30)
            ->assertJsonPath('hpRegen.is_active', true);

        $this->assertSame(59, $player->refresh()->hp);
    }

    public function test_player_can_fully_recover_at_inn_with_gold(): void
    {
        $user = $this->verifiedUserWithStartedGame();
        $player = Player::where('user_id', $user->id)->firstOrFail();

        $player->forceFill([
            'hp' => 1,
            'mp' => 0,
            'gold' => 30,
        ])->save();

        $this->postJson('/api/game/command', ['command' => 'inn'])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('game_state.player.hp', 100)
            ->assertJsonPath('game_state.player.mp', 50)
            ->assertJsonPath('game_state.player.gold', 0);

        $player->refresh();
        $this->assertSame($player->max_hp, $player->hp);
        $this->assertSame($player->max_mp, $player->mp);
        $this->assertSame(0, $player->gold);
    }

    private function sentTwoFactorCodeFor(User $user): string
    {
        $code = null;

        Notification::assertSentTo(
            $user,
            TwoFactorCodeNotification::class,
            function (TwoFactorCodeNotification $notification) use (&$code) {
                $code = $notification->code;

                return true;
            }
        );

        $this->assertNotNull($code);

        return $code;
    }

    private function verifiedUserWithStartedGame(): User
    {
        Notification::fake();

        $this->postJson('/api/auth/register', [
            'name' => 'Hero',
            'email' => 'hero-' . uniqid() . '@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertCreated();

        $user = User::where('name', 'Hero')->latest('id')->firstOrFail();
        $code = $this->sentTwoFactorCodeFor($user);

        $this->postJson('/api/auth/verify-2fa', ['code' => $code])->assertOk();
        $this->postJson('/api/game/new')->assertOk();

        return $user;
    }
}
