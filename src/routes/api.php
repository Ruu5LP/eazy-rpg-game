<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\GameController;

Route::prefix('game')->group(function () {
    Route::post('/command', [GameController::class, 'executeCommand']);
    Route::get('/state', [GameController::class, 'getGameState']);
    Route::post('/new', [GameController::class, 'startNewGame']);
    Route::post('/save', [GameController::class, 'saveGame']);
    Route::post('/load', [GameController::class, 'loadGame']);
});
