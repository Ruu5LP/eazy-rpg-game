<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\GameController;

Route::prefix('game')->group(function () {
    Route::post('/command', [GameController::class, 'executeCommand']);
});
