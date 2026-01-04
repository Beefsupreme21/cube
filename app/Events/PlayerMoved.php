<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PlayerMoved implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public string $gameId,
        public string $playerId,
        public float $x,
        public float $y,
        public float $z,
        public float $rotation,
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
        return 'player-moved';
    }

    public function broadcastWith(): array
    {
        return [
            'player_id' => $this->playerId,
            'position' => [
                'x' => $this->x,
                'y' => $this->y,
                'z' => $this->z,
            ],
            'rotation' => $this->rotation,
        ];
    }
}
