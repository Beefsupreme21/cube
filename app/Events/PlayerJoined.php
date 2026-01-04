<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PlayerJoined implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public string $gameId,
        public string $playerId,
        public string $playerName,
        public float $x = 0,
        public float $y = 0,
        public float $z = 0,
        public float $rotation = 0,
    ) {
        //
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('game.'.$this->gameId),
        ];
    }

    public function broadcastAs(): string
    {
        return 'player-joined';
    }

    public function broadcastWith(): array
    {
        return [
            'player_id' => $this->playerId,
            'player_name' => $this->playerName,
            'position' => [
                'x' => $this->x,
                'y' => $this->y,
                'z' => $this->z,
            ],
            'rotation' => $this->rotation,
        ];
    }
}
