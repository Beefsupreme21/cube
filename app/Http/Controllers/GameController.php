<?php

namespace App\Http\Controllers;

use App\Events\PlayerJoined;
use App\Events\PlayerLeft;
use App\Events\PlayerMoved;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class GameController extends Controller
{
    // Single game ID for now (can be extended to support multiple lobbies later)
    private const GAME_ID = 'main';

    private const CACHE_KEY = 'game:main:players';

    private const CACHE_TTL = 3600; // 1 hour

    /**
     * Show the game view
     */
    public function show(Request $request): \Illuminate\Contracts\View\View
    {
        $player = $this->getOrCreatePlayer($request);

        return view('game', [
            'playerId' => $player['id'],
            'playerName' => $player['name'],
            'gameId' => self::GAME_ID,
        ]);
    }

    /**
     * Player joins the game
     */
    public function join(Request $request): \Illuminate\Http\JsonResponse
    {
        $validated = $request->validate([
            'player' => ['required', 'array'],
            'player.id' => ['required', 'string'],
            'player.name' => ['required', 'string', 'max:16'],
            'player.color' => ['sometimes', 'string'],
            'position' => ['required', 'array'],
            'position.x' => ['required', 'numeric'],
            'position.y' => ['required', 'numeric'],
            'position.z' => ['required', 'numeric'],
            'rotation' => ['required', 'numeric'],
        ]);

        $player = $validated['player'];
        $position = $validated['position'];
        $rotation = $validated['rotation'];

        // Update session with player info
        $request->session()->put('player_id', $player['id']);
        $request->session()->put('player_name', $player['name']);

        // Store player in cache
        $players = Cache::get(self::CACHE_KEY, []);
        $players[$player['id']] = [
            'player' => $player,
            'position' => $position,
            'rotation' => $rotation,
            'last_seen' => now()->timestamp,
        ];
        Cache::put(self::CACHE_KEY, $players, self::CACHE_TTL);

        // Broadcast player joined to all other players (exclude sender)
        broadcast(new PlayerJoined(
            gameId: self::GAME_ID,
            player: $player,
            position: $position,
            rotation: $rotation,
        ))->toOthers();

        // Return list of existing players (excluding self)
        $otherPlayers = collect($players)
            ->filter(fn ($p) => isset($p['player']['id']) && $p['player']['id'] !== $player['id'])
            ->values()
            ->all();

        return response()->json([
            'success' => true,
            'player' => $player,
            'players' => $otherPlayers,
        ]);
    }

    /**
     * Player moved - broadcast position update
     */
    public function move(Request $request): \Illuminate\Http\JsonResponse
    {
        $validated = $request->validate([
            'player_id' => ['required', 'string'],
            'x' => ['required', 'numeric'],
            'y' => ['required', 'numeric'],
            'z' => ['required', 'numeric'],
            'rotation' => ['required', 'numeric'],
        ]);

        $playerId = $validated['player_id'];
        $position = [
            'x' => $validated['x'],
            'y' => $validated['y'],
            'z' => $validated['z'],
        ];
        $rotation = $validated['rotation'];

        // Update player position in cache
        $players = Cache::get(self::CACHE_KEY, []);
        if (isset($players[$playerId])) {
            $players[$playerId]['position'] = $position;
            $players[$playerId]['rotation'] = $rotation;
            $players[$playerId]['last_seen'] = now()->timestamp;
            Cache::put(self::CACHE_KEY, $players, self::CACHE_TTL);
        }

        // Broadcast movement to all other players (exclude sender)
        broadcast(new PlayerMoved(
            gameId: self::GAME_ID,
            playerId: $playerId,
            position: $position,
            rotation: $rotation,
        ))->toOthers();

        return response()->json(['success' => true]);
    }

    /**
     * Player leaves the game
     */
    public function leave(Request $request): \Illuminate\Http\JsonResponse
    {
        $playerId = $request->session()->get('player_id');

        if (! $playerId) {
            // Try to get from request body (for sendBeacon)
            $data = json_decode($request->getContent(), true);
            $playerId = $data['player_id'] ?? null;
        }

        if ($playerId) {
            // Remove from cache
            $players = Cache::get(self::CACHE_KEY, []);
            unset($players[$playerId]);
            Cache::put(self::CACHE_KEY, $players, self::CACHE_TTL);

            // Broadcast player left
            broadcast(new PlayerLeft(
                gameId: self::GAME_ID,
                playerId: $playerId,
            ));
        }

        return response()->json(['success' => true]);
    }

    /**
     * Get or create a player from session
     *
     * @return array{id: string, name: string, color: string}
     */
    private function getOrCreatePlayer(Request $request): array
    {
        $playerId = $request->session()->get('player_id');
        $playerName = $request->session()->get('player_name');

        if (! $playerId) {
            $playerId = Str::uuid()->toString();
            $request->session()->put('player_id', $playerId);
        }

        if (! $playerName) {
            // Don't set a default - user will enter their name on join screen
            $playerName = '';
        }

        return [
            'id' => $playerId,
            'name' => $playerName,
            'color' => '#e94560',
        ];
    }
}
