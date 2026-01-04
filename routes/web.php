<?php

use App\Http\Controllers\GameController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/game', [GameController::class, 'show']);

// Multiplayer endpoints
Route::post('/game/join', [GameController::class, 'join']);
Route::post('/game/move', [GameController::class, 'move']);
Route::post('/game/leave', [GameController::class, 'leave']);
