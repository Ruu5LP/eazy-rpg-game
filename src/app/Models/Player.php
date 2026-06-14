<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Player extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'level',
        'hp',
        'max_hp',
        'mp',
        'max_mp',
        'attack',
        'defense',
        'experience',
        'gold',
    ];

    protected $casts = [
        'level' => 'integer',
        'hp' => 'integer',
        'max_hp' => 'integer',
        'mp' => 'integer',
        'max_mp' => 'integer',
        'attack' => 'integer',
        'defense' => 'integer',
        'experience' => 'integer',
        'gold' => 'integer',
    ];

    public function battles(): HasMany
    {
        return $this->hasMany(Battle::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function gameSessions(): HasMany
    {
        return $this->hasMany(GameSession::class);
    }
}
