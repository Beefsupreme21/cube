<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Game extends Model
{
    /** @use HasFactory<\Database\Factories\GameFactory> */
    use HasFactory;

    protected $fillable = [
        'code',
        'status',
    ];

    /**
     * @return BelongsToMany<User, $this>
     */
    public function players(): BelongsToMany
    {
        return $this->belongsToMany(User::class)
            ->withPivot(['position_x', 'position_y', 'position_z', 'rotation', 'last_seen_at'])
            ->withTimestamps();
    }

    /**
     * Get active players (seen in last 30 seconds)
     *
     * @return BelongsToMany<User, $this>
     */
    public function activePlayers(): BelongsToMany
    {
        return $this->players()
            ->wherePivot('last_seen_at', '>=', now()->subSeconds(30));
    }
}
