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

    /**
     * @param  array{id: int, name: string, color: string}  $player
     * @param  array{x: float, y: float, z: float}  $position
     */
    public function __construct(
        public string $gameId,
        public array $player,
        public array $position,
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
            'player' => $this->player,
            'position' => $this->position,
            'rotation' => $this->rotation,
        ];
    }
}
