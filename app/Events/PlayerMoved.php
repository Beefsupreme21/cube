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

    /**
     * @param  array{x: float, y: float, z: float}  $position
     */
    public function __construct(
        public string $gameId,
        public int $playerId,
        public array $position,
        public float $rotation,
        public string $animation = 'idle',
        public bool $crouching = false,
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
            'position' => $this->position,
            'rotation' => $this->rotation,
            'animation' => $this->animation,
            'crouching' => $this->crouching,
        ];
    }
}
