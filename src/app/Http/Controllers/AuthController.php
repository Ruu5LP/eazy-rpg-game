<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Notifications\TwoFactorCodeNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Laravel\Socialite\Facades\Socialite;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:32'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = User::create($validated);
        $devCode = $this->beginTwoFactorChallenge($request, $user);

        return response()->json([
            'requires_2fa' => true,
            'email' => $user->email,
            'message' => 'Account created. Check your email for the login code.',
            'dev_two_factor_code' => $devCode,
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $credentials['email'])->first();

        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $devCode = $this->beginTwoFactorChallenge($request, $user);

        return response()->json([
            'requires_2fa' => true,
            'email' => $user->email,
            'message' => 'Check your email for the login code.',
            'dev_two_factor_code' => $devCode,
        ]);
    }

    public function verifyTwoFactor(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'digits:6'],
        ]);

        $userId = $request->session()->get('pending_2fa_user_id');
        $user = $userId ? User::find($userId) : null;

        if (!$user || !$user->two_factor_code_hash || !$user->two_factor_expires_at) {
            throw ValidationException::withMessages([
                'code' => ['Please start the login flow again.'],
            ]);
        }

        if ($user->two_factor_expires_at->isPast() || $user->two_factor_attempts >= 5) {
            $this->clearTwoFactorChallenge($user);

            throw ValidationException::withMessages([
                'code' => ['The login code has expired. Please sign in again.'],
            ]);
        }

        if (!Hash::check($validated['code'], $user->two_factor_code_hash)) {
            $user->increment('two_factor_attempts');

            throw ValidationException::withMessages([
                'code' => ['The login code is incorrect.'],
            ]);
        }

        $this->clearTwoFactorChallenge($user);
        Auth::login($user);
        $request->session()->regenerate();
        $request->session()->put('two_factor_passed_at', now()->toISOString());
        $request->session()->forget('pending_2fa_user_id');

        return response()->json([
            'user' => $this->serializeUser($user),
            'message' => 'Login complete.',
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user || !$request->session()->has('two_factor_passed_at')) {
            return response()->json(['user' => null], 401);
        }

        return response()->json(['user' => $this->serializeUser($user)]);
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Logged out.']);
    }

    public function redirectToGoogle(): JsonResponse
    {
        return response()->json([
            'url' => Socialite::driver('google')->redirect()->getTargetUrl(),
        ]);
    }

    public function handleGoogleCallback(Request $request): RedirectResponse
    {
        $googleUser = Socialite::driver('google')->user();
        $user = User::where('google_id', $googleUser->getId())
            ->orWhere('email', $googleUser->getEmail())
            ->first();

        if (!$user) {
            $user = User::create([
                'name' => $googleUser->getName() ?: Str::before($googleUser->getEmail(), '@'),
                'email' => $googleUser->getEmail(),
                'password' => Str::password(32),
                'google_id' => $googleUser->getId(),
            ]);
            $user->forceFill(['email_verified_at' => now()])->save();
        } elseif (!$user->google_id) {
            $user->forceFill([
                'google_id' => $googleUser->getId(),
                'email_verified_at' => $user->email_verified_at ?: now(),
            ])->save();
        }

        $this->beginTwoFactorChallenge($request, $user);

        $frontendUrl = rtrim((string) config('app.frontend_url', '/'), '/');
        $query = http_build_query([
            'twoFactor' => '1',
            'email' => $user->email,
            'redirect' => '/game',
        ]);

        return redirect()->away("{$frontendUrl}/auth?{$query}");
    }

    private function beginTwoFactorChallenge(Request $request, User $user): ?string
    {
        $code = (string) random_int(100000, 999999);

        $user->forceFill([
            'two_factor_code_hash' => Hash::make($code),
            'two_factor_expires_at' => now()->addMinutes(10),
            'two_factor_attempts' => 0,
        ])->save();

        Auth::logout();
        $request->session()->regenerate();
        $request->session()->put('pending_2fa_user_id', $user->id);
        $request->session()->forget('two_factor_passed_at');

        $user->notify(new TwoFactorCodeNotification($code));

        if (app()->environment(['local', 'testing']) && in_array(config('mail.default'), ['log', 'array'], true)) {
            return $code;
        }

        return null;
    }

    private function clearTwoFactorChallenge(User $user): void
    {
        $user->forceFill([
            'two_factor_code_hash' => null,
            'two_factor_expires_at' => null,
            'two_factor_attempts' => 0,
        ])->save();
    }

    private function serializeUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
        ];
    }
}
