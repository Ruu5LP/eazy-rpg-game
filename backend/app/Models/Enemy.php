<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Enemy extends Model
{
    protected $fillable = [
        'name',
        'level',
        'hp',
        'max_hp',
        'attack',
        'defense',
        'experience_reward',
        'gold_reward',
    ];

    protected $casts = [
        'level' => 'integer',
        'hp' => 'integer',
        'max_hp' => 'integer',
        'attack' => 'integer',
        'defense' => 'integer',
        'experience_reward' => 'integer',
        'gold_reward' => 'integer',
    ];
}
