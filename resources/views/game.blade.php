<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title>Game - {{ config('app.name', 'Laravel') }}</title>

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600&family=space-mono:400,700" rel="stylesheet" />

        <!-- Styles / Scripts -->
        @vite(['resources/css/app.css', 'resources/js/app.js'])
        
        <style>
            .join-screen {
                position: fixed;
                inset: 0;
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                font-family: 'Space Mono', monospace;
            }
            
            .join-card {
                background: rgba(255, 255, 255, 0.05);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 16px;
                padding: 48px;
                text-align: center;
                max-width: 500px;
                width: 90%;
            }
            
            .join-title {
                font-size: 2.5rem;
                font-weight: 700;
                color: #e94560;
                margin-bottom: 8px;
                text-transform: uppercase;
                letter-spacing: 4px;
            }
            
            .join-subtitle {
                color: rgba(255, 255, 255, 0.6);
                margin-bottom: 32px;
                font-size: 0.875rem;
            }
            
            .name-input {
                width: 100%;
                padding: 16px 20px;
                font-size: 1.25rem;
                font-family: 'Space Mono', monospace;
                background: rgba(0, 0, 0, 0.3);
                border: 2px solid rgba(255, 255, 255, 0.2);
                border-radius: 8px;
                color: #fff;
                text-align: center;
                outline: none;
                transition: border-color 0.2s, box-shadow 0.2s;
            }
            
            .name-input:focus {
                border-color: #e94560;
                box-shadow: 0 0 20px rgba(233, 69, 96, 0.3);
            }
            
            .name-input::placeholder {
                color: rgba(255, 255, 255, 0.3);
            }
            
            .picker-label {
                display: block;
                color: rgba(255, 255, 255, 0.6);
                font-size: 0.875rem;
                margin-top: 24px;
                margin-bottom: 12px;
            }
            
            .color-picker {
                display: flex;
                justify-content: center;
                gap: 12px;
                flex-wrap: wrap;
            }
            
            .color-option {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                border: 3px solid transparent;
                cursor: pointer;
                transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
            }
            
            .color-option:hover {
                transform: scale(1.1);
            }
            
            .color-option.selected {
                border-color: #fff;
                box-shadow: 0 0 20px currentColor;
                transform: scale(1.15);
            }
            
            .class-picker {
                display: flex;
                justify-content: center;
                gap: 16px;
                flex-wrap: wrap;
            }
            
            .class-option {
                background: rgba(0, 0, 0, 0.3);
                border: 2px solid rgba(255, 255, 255, 0.2);
                border-radius: 12px;
                padding: 16px 20px;
                cursor: pointer;
                transition: all 0.2s;
                text-align: center;
                min-width: 120px;
            }
            
            .class-option:hover {
                border-color: rgba(255, 255, 255, 0.4);
                background: rgba(255, 255, 255, 0.1);
            }
            
            .class-option.selected {
                border-color: #e94560;
                background: rgba(233, 69, 96, 0.2);
                box-shadow: 0 0 20px rgba(233, 69, 96, 0.3);
            }
            
            .class-icon {
                font-size: 2rem;
                margin-bottom: 8px;
            }
            
            .class-name {
                color: #fff;
                font-weight: 700;
                font-size: 0.875rem;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            
            .class-option.selected .class-name {
                color: #e94560;
            }
            
            .join-btn {
                width: 100%;
                margin-top: 24px;
                padding: 16px 32px;
                font-size: 1.125rem;
                font-family: 'Space Mono', monospace;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 2px;
                background: linear-gradient(135deg, #e94560 0%, #c23a51 100%);
                border: none;
                border-radius: 8px;
                color: #fff;
                cursor: pointer;
                transition: transform 0.2s, box-shadow 0.2s;
            }
            
            .join-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 10px 30px rgba(233, 69, 96, 0.4);
            }
            
            .join-btn:active {
                transform: translateY(0);
            }
            
            .join-screen.hidden {
                display: none;
            }
        </style>
    </head>
    <body class="m-0 p-0 overflow-hidden bg-black">
        <!-- Join Screen -->
        <div id="join-screen" class="join-screen">
            <div class="join-card">
                <h1 class="join-title">Cube</h1>
                <p class="join-subtitle">Enter the arena</p>
                
                <input 
                    type="text" 
                    id="player-name-input" 
                    class="name-input" 
                    placeholder="Enter your name"
                    maxlength="16"
                    autocomplete="off"
                >
                
                <label class="picker-label">Choose your class</label>
                <div class="class-picker" id="class-picker">
                    @php $currentClass = $user->class?->value ?? 'warrior'; @endphp
                    <button type="button" class="class-option {{ $currentClass === 'warrior' ? 'selected' : '' }}" data-class="warrior">
                        <div class="class-icon">⚔️</div>
                        <div class="class-name">Warrior</div>
                    </button>
                    <button type="button" class="class-option {{ $currentClass === 'hunter' ? 'selected' : '' }}" data-class="hunter">
                        <div class="class-icon">🏹</div>
                        <div class="class-name">Hunter</div>
                    </button>
                    <button type="button" class="class-option {{ $currentClass === 'mage' ? 'selected' : '' }}" data-class="mage">
                        <div class="class-icon">🔮</div>
                        <div class="class-name">Mage</div>
                    </button>
                </div>
                
                <label class="picker-label">Choose your color</label>
                <div class="color-picker" id="color-picker">
                    @php
                        $colors = ['#e94560', '#4a90d9', '#50c878', '#ffd700', '#ff6b35', '#9b59b6', '#00d4aa', '#ff69b4'];
                    @endphp
                    @foreach($colors as $color)
                        <button type="button" class="color-option {{ $user->color === $color ? 'selected' : '' }}" data-color="{{ $color }}" style="background: {{ $color }};"></button>
                    @endforeach
                </div>
                
                <button id="join-btn" class="join-btn">Join Game</button>
            </div>
        </div>
        
        <!-- Game Container -->
        <div id="game-container" class="w-full h-screen"></div>
        
        <script>
            // Pass server data to JavaScript
            window.gameConfig = {
                player: {
                    id: @json($user->id),
                    name: @json($user->name),
                    color: @json($user->color),
                    class: @json($user->class?->value ?? 'warrior'),
                },
                gameId: @json($gameId),
            };
        </script>
    </body>
</html>
