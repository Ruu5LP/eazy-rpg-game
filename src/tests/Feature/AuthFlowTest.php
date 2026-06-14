<?php

namespace Tests\Feature;

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
            ->assertJsonPath('game_state.player.name', 'Hero');

        $this->assertDatabaseHas('players', [
            'user_id' => $user->id,
            'name' => 'Hero',
        ]);
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
}
