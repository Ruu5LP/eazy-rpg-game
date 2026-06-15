<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GameSession extends Model
{
    protected $fillable = [
        'user_id',
        'session_token',
        'player_id',
        'battle_id',
        'game_data',
    ];

    protected $casts = [
        'game_data' => 'array',
    ];

    public function player(): BelongsTo
    {
        return $this->belongsTo(Player::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function battle(): BelongsTo
    {
        return $this->belongsTo(Battle::class);
    }
}
