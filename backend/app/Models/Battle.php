<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Battle extends Model
{
    protected $fillable = [
        'player_id',
        'enemy_id',
        'enemy_hp',
        'is_active',
    ];

    protected $casts = [
        'enemy_hp' => 'integer',
        'is_active' => 'boolean',
    ];

    public function player(): BelongsTo
    {
        return $this->belongsTo(Player::class);
    }

    public function enemy(): BelongsTo
    {
        return $this->belongsTo(Enemy::class);
    }
}
