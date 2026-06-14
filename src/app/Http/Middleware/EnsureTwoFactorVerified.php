<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureTwoFactorVerified
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!$request->user() || !$request->session()->has('two_factor_passed_at')) {
            return response()->json(['message' => 'Two-factor authentication is required.'], 403);
        }

        return $next($request);
    }
}
