<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Presence channel for real-time multiplayer with client events
// When you return an array, Laravel treats this as a presence channel
// The channel name here should NOT include "presence-" prefix - Laravel handles that
Broadcast::channel('game.{gameId}', function ($user, $gameId) {
    // Return user info for presence channel (who is online)
    // Since we're using session-based players, get info from session
    $playerId = session('player_id');
    $playerName = session('player_name');
    
    if ($playerId) {
        return [
            'id' => $playerId,
            'name' => $playerName ?? 'Unknown',
        ];
    }
    
    return false;
});
