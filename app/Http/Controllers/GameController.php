<?php

namespace App\Http\Controllers;

use App\Enums\PlayerClass;
use App\Events\PlayerJoined;
use App\Events\PlayerLeft;
use App\Events\PlayerMoved;
use App\Models\Game;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class GameController extends Controller
{
    private const DEFAULT_GAME_CODE = 'main';

    /**
     * Show the game view
     */
    public function show(Request $request): \Illuminate\Contracts\View\View
    {
        $user = $this->getOrCreateUser($request);
        $game = $this->getOrCreateGame();

        return view('game', [
            'user' => $user,
            'gameId' => $game->code,
        ]);
    }

    /**
     * Player joins the game
     */
    public function join(Request $request): \Illuminate\Http\JsonResponse
    {
        $validated = $request->validate([
            'player' => ['required', 'array'],
            'player.id' => ['required', 'integer'],
            'player.name' => ['required', 'string', 'max:16'],
            'player.color' => ['sometimes', 'string', 'max:7'],
            'player.class' => ['sometimes', 'string', Rule::enum(PlayerClass::class)],
            'position' => ['required', 'array'],
            'position.x' => ['required', 'numeric'],
            'position.y' => ['required', 'numeric'],
            'position.z' => ['required', 'numeric'],
            'rotation' => ['required', 'numeric'],
        ]);

        $playerData = $validated['player'];
        $position = $validated['position'];
        $rotation = $validated['rotation'];

        // Find and update user
        $user = User::findOrFail($playerData['id']);
        $user->update([
            'name' => $playerData['name'],
            'color' => $playerData['color'] ?? $user->color,
            'class' => $playerData['class'] ?? $user->class?->value ?? 'warrior',
        ]);

        // Get or create game
        $game = $this->getOrCreateGame();

        // Attach user to game (or update if already attached)
        $game->players()->syncWithoutDetaching([
            $user->id => [
                'position_x' => $position['x'],
                'position_y' => $position['y'],
                'position_z' => $position['z'],
                'rotation' => $rotation,
                'last_seen_at' => now(),
            ],
        ]);

        // Broadcast player joined to all other players
        broadcast(new PlayerJoined(
            gameId: $game->code,
            player: [
                'id' => $user->id,
                'name' => $user->name,
                'color' => $user->color,
                'class' => $user->class?->value ?? 'warrior',
            ],
            position: $position,
            rotation: $rotation,
        ))->toOthers();

        // Return list of other active players
        $otherPlayers = $game->activePlayers()
            ->where('users.id', '!=', $user->id)
            ->get()
            ->map(fn (User $player) => [
                'player' => [
                    'id' => $player->id,
                    'name' => $player->name,
                    'color' => $player->color,
                    'class' => $player->class?->value ?? 'warrior',
                ],
                'position' => [
                    'x' => $player->pivot->position_x,
                    'y' => $player->pivot->position_y,
                    'z' => $player->pivot->position_z,
                ],
                'rotation' => $player->pivot->rotation,
            ])
            ->values()
            ->all();

        return response()->json([
            'success' => true,
            'player' => [
                'id' => $user->id,
                'name' => $user->name,
                'color' => $user->color,
                'class' => $user->class?->value ?? 'warrior',
            ],
            'players' => $otherPlayers,
        ]);
    }

    /**
     * Player moved - broadcast position update
     */
    public function move(Request $request): \Illuminate\Http\JsonResponse
    {
        $validated = $request->validate([
            'player_id' => ['required', 'integer'],
            'x' => ['required', 'numeric'],
            'y' => ['required', 'numeric'],
            'z' => ['required', 'numeric'],
            'rotation' => ['required', 'numeric'],
            'animation' => ['sometimes', 'string'],
        ]);

        $playerId = $validated['player_id'];
        $position = [
            'x' => $validated['x'],
            'y' => $validated['y'],
            'z' => $validated['z'],
        ];
        $rotation = $validated['rotation'];
        $animation = $validated['animation'] ?? 'idle';

        // Update player position in database
        $game = $this->getOrCreateGame();
        $game->players()->updateExistingPivot($playerId, [
            'position_x' => $position['x'],
            'position_y' => $position['y'],
            'position_z' => $position['z'],
            'rotation' => $rotation,
            'last_seen_at' => now(),
        ]);

        // Broadcast movement to all other players
        broadcast(new PlayerMoved(
            gameId: $game->code,
            playerId: $playerId,
            position: $position,
            rotation: $rotation,
            animation: $animation,
        ))->toOthers();

        return response()->json(['success' => true]);
    }

    /**
     * Player leaves the game
     */
    public function leave(Request $request): \Illuminate\Http\JsonResponse
    {
        $userId = $request->session()->get('user_id');

        if (! $userId) {
            // Try to get from request body (for sendBeacon)
            $data = json_decode($request->getContent(), true);
            $userId = $data['player_id'] ?? null;
        }

        if ($userId) {
            $game = Game::where('code', self::DEFAULT_GAME_CODE)->first();

            if ($game) {
                // Detach user from game
                $game->players()->detach($userId);

                // Broadcast player left
                broadcast(new PlayerLeft(
                    gameId: $game->code,
                    playerId: $userId,
                ));
            }
        }

        return response()->json(['success' => true]);
    }

    /**
     * Get or create a guest user from session
     */
    private function getOrCreateUser(Request $request): User
    {
        $userId = $request->session()->get('user_id');

        if ($userId) {
            $user = User::find($userId);
            if ($user) {
                return $user;
            }
        }

        // Create a new guest user
        $user = User::create([
            'name' => 'Player',
            'email' => 'guest_'.Str::uuid().'@game.local',
            'password' => Str::random(32),
            'color' => '#e94560',
        ]);

        $request->session()->put('user_id', $user->id);

        return $user;
    }

    /**
     * Get or create the default game
     */
    private function getOrCreateGame(): Game
    {
        return Game::firstOrCreate(
            ['code' => self::DEFAULT_GAME_CODE],
            ['status' => 'active']
        );
    }
}
