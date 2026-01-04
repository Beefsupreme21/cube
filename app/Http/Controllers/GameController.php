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
        // Get or create player ID from session
        $playerId = $this->getOrCreatePlayerId($request);
        $playerName = $this->getOrCreatePlayerName($request);

        return view('game', [
            'playerId' => $playerId,
            'playerName' => $playerName,
            'gameId' => self::GAME_ID,
        ]);
    }

    /**
     * Player joins the game
     */
    public function join(Request $request): \Illuminate\Http\JsonResponse
    {
        $playerId = $this->getOrCreatePlayerId($request);
        $playerName = $this->getOrCreatePlayerName($request);
        
        $validated = $request->validate([
            'x' => ['required', 'numeric'],
            'y' => ['required', 'numeric'],
            'z' => ['required', 'numeric'],
            'rotation' => ['required', 'numeric'],
        ]);

        // Store player in cache
        $players = Cache::get(self::CACHE_KEY, []);
        $players[$playerId] = [
            'player_id' => $playerId,
            'player_name' => $playerName,
            'position' => [
                'x' => $validated['x'],
                'y' => $validated['y'],
                'z' => $validated['z'],
            ],
            'rotation' => $validated['rotation'],
            'last_seen' => now()->timestamp,
        ];
        Cache::put(self::CACHE_KEY, $players, self::CACHE_TTL);

        // Broadcast player joined to all other players
        broadcast(new PlayerJoined(
            gameId: self::GAME_ID,
            playerId: $playerId,
            playerName: $playerName,
            x: $validated['x'],
            y: $validated['y'],
            z: $validated['z'],
            rotation: $validated['rotation'],
        ));

        // Return list of existing players (excluding self)
        $otherPlayers = collect($players)
            ->filter(fn($p) => $p['player_id'] !== $playerId)
            ->values()
            ->all();

        return response()->json([
            'success' => true,
            'player_id' => $playerId,
            'players' => $otherPlayers,
        ]);
    }

    /**
     * Player moved - broadcast position update
     */
    public function move(Request $request): \Illuminate\Http\JsonResponse
    {
        $playerId = $this->getOrCreatePlayerId($request);
        
        $validated = $request->validate([
            'x' => ['required', 'numeric'],
            'y' => ['required', 'numeric'],
            'z' => ['required', 'numeric'],
            'rotation' => ['required', 'numeric'],
        ]);

        // Update player position in cache
        $players = Cache::get(self::CACHE_KEY, []);
        if (isset($players[$playerId])) {
            $players[$playerId]['position'] = [
                'x' => $validated['x'],
                'y' => $validated['y'],
                'z' => $validated['z'],
            ];
            $players[$playerId]['rotation'] = $validated['rotation'];
            $players[$playerId]['last_seen'] = now()->timestamp;
            Cache::put(self::CACHE_KEY, $players, self::CACHE_TTL);
        }

        // Broadcast movement to all players
        broadcast(new PlayerMoved(
            gameId: self::GAME_ID,
            playerId: $playerId,
            x: $validated['x'],
            y: $validated['y'],
            z: $validated['z'],
            rotation: $validated['rotation'],
        ));

        return response()->json(['success' => true]);
    }

    /**
     * Player leaves the game
     */
    public function leave(Request $request): \Illuminate\Http\JsonResponse
    {
        $playerId = $request->session()->get('player_id');
        
        if (!$playerId) {
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
     * Get or create a unique player ID from session
     */
    private function getOrCreatePlayerId(Request $request): string
    {
        $playerId = $request->session()->get('player_id');

        if (!$playerId) {
            $playerId = Str::uuid()->toString();
            $request->session()->put('player_id', $playerId);
        }

        return $playerId;
    }

    /**
     * Get or create a player name from session
     */
    private function getOrCreatePlayerName(Request $request): string
    {
        $playerName = $request->session()->get('player_name');

        if (!$playerName) {
            $playerName = 'Player ' . Str::random(4);
            $request->session()->put('player_name', $playerName);
        }

        return $playerName;
    }
}
