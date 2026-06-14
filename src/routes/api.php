<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\GameController;
use App\Http\Controllers\AuthController;

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
    Route::post('/verify-2fa', [AuthController::class, 'verifyTwoFactor'])->middleware('throttle:5,1');
    Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth');
    Route::get('/me', [AuthController::class, 'me']);
    Route::get('/google/redirect', [AuthController::class, 'redirectToGoogle'])->middleware('throttle:10,1');
    Route::get('/google/callback', [AuthController::class, 'handleGoogleCallback'])->middleware('throttle:10,1');
});

Route::prefix('game')->middleware(['auth', 'twofactor'])->group(function () {
    Route::post('/command', [GameController::class, 'executeCommand']);
    Route::get('/state', [GameController::class, 'getGameState']);
    Route::post('/new', [GameController::class, 'startNewGame']);
    Route::post('/save', [GameController::class, 'saveGame']);
    Route::post('/load', [GameController::class, 'loadGame']);
});
