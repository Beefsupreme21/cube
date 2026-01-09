import * as THREE from 'three';
import { getTileGrid, setTileGridColor, setGameUIText } from './scene';

/**
 * Game state
 */
let gameState = {
    isActive: false,
    currentWave: 0,
    targetColor: null,
    score: 0,
    timeRemaining: 0,
    timerInterval: null,
};

/**
 * ============================================================================
 * RAINBOW COLORS
 * ============================================================================
 * Colors used during the rainbow flash phase.
 * You can add or remove colors here if you want!
 * ============================================================================
 */
const RAINBOW_COLORS = [
    '#ff0000', // Red
    '#ff8800', // Orange
    '#ffff00', // Yellow
    '#00ff00', // Green
    '#0088ff', // Light Blue
    '#0000ff', // Blue
    '#8800ff', // Purple
    '#ff00ff', // Magenta
];

/**
 * ============================================================================
 * WAVE CONFIGURATION
 * ============================================================================
 * 
 * This is where you adjust the difficulty for each wave.
 * Just add a new object to the array to create a new wave!
 * 
 * Properties you can change:
 * - flashSpeed: How fast colors change during rainbow phase (lower = faster)
 *   - Easy: 200-300
 *   - Medium: 100-200
 *   - Hard: 50-100
 * - flashDuration: How long the rainbow flash lasts in milliseconds
 *   - 1000 = 1 second
 *   - 2000 = 2 seconds
 *   - 3000 = 3 seconds
 * - timeLimit: How long player has to find tiles in milliseconds
 *   - 3000 = 3 seconds
 *   - 5000 = 5 seconds
 *   - 7000 = 7 seconds
 * 
 * ============================================================================
 */
export const WAVE_CONFIG = [
    // Wave 1 - Easy: Slow flash, plenty of time
    {
        flashSpeed: 200,
        flashDuration: 2000,
        timeLimit: 5000,
    },
    
    // Wave 2 - Medium: Faster flash
    {
        flashSpeed: 150,
        flashDuration: 2000,
        timeLimit: 5000,
    },
    
    // Wave 3 - Hard: Very fast flash
    {
        flashSpeed: 100,
        flashDuration: 2000,
        timeLimit: 5000,
    },
    
    // Wave 4 - Add more waves here!
    // {
    //     flashSpeed: 80,
    //     flashDuration: 1500,
    //     timeLimit: 4000,
    // },
];

/**
 * Get current wave config, or repeat last wave with increased difficulty
 */
function getWaveConfig(waveNumber) {
    if (waveNumber < WAVE_CONFIG.length) {
        return WAVE_CONFIG[waveNumber];
    }
    // After all configured waves, repeat last wave but harder
    const lastWave = WAVE_CONFIG[WAVE_CONFIG.length - 1];
    return {
        ...lastWave,
        flashSpeed: Math.max(50, lastWave.flashSpeed - 20), // Faster each time
        timeLimit: Math.max(3000, lastWave.timeLimit - 500), // Less time each time
    };
}

/**
 * Get random color from array
 */
function getRandomColor(colors) {
    return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Get all tiles from the grid
 */
function getAllTiles(tileGrid) {
    const tiles = [];
    tileGrid.traverse((child) => {
        if (child.isMesh && child.userData.gridRow !== undefined) {
            tiles.push(child);
        }
    });
    return tiles;
}

/**
 * Start a new wave
 */
export function startWave() {
    const tileGrid = getTileGrid();
    if (!tileGrid) return;
    
    // Clear any existing timer
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
    
    gameState.currentWave++;
    const config = getWaveConfig(gameState.currentWave - 1);
    gameState.isActive = false; // Not active during flash phase
    gameState.timeRemaining = config.timeLimit;
    
    // Pick target color first
    gameState.targetColor = getRandomColor(RAINBOW_COLORS);
    const colorName = getColorName(gameState.targetColor);
    
    // Update UI
    setGameUIText(`SCORE: ${gameState.score}\nWAVE: ${gameState.currentWave}\nFIND: ${colorName.toUpperCase()}`);
    
    // Start flashing sequence (shows target color, then rainbow)
    flashTiles(tileGrid, config);
}

// ============================================================================
// INTERNAL: Flash tiles animation
// ============================================================================
function flashTiles(tileGrid, config) {
    const tiles = getAllTiles(tileGrid);
    const startTime = Date.now();
    let phase = 'target'; // 'target' or 'rainbow'
    
    // First, show all tiles as target color for 1 second
    tiles.forEach(tile => {
        tile.material.color.set(gameState.targetColor);
    });
    
    const flashInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        
        // Show target color for first second
        if (elapsed < 1000 && phase === 'target') {
            return; // Keep showing target color
        }
        
        // Switch to rainbow phase
        if (phase === 'target' && elapsed >= 1000) {
            phase = 'rainbow';
        }
        
        // Rainbow phase - each tile gets a random rainbow color
        if (phase === 'rainbow') {
            if (elapsed >= 1000 + config.flashDuration) {
                clearInterval(flashInterval);
                // Stop flashing and set target tiles
                setTargetColor(tileGrid, config);
                return;
            }
            
            // Each tile gets a random rainbow color independently
            tiles.forEach(tile => {
                const randomColor = getRandomColor(RAINBOW_COLORS);
                tile.material.color.set(randomColor);
            });
        }
    }, config.flashSpeed);
}

// ============================================================================
// INTERNAL: Set target tiles and start timer
// ============================================================================
/**
 * Convert hex color to faint version (very dim)
 */
function makeFaintColor(hexColor, brightness = 0.1) {
    // Remove # if present
    const hex = hexColor.replace('#', '');
    
    // Convert to RGB
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Apply brightness multiplier
    const faintR = Math.floor(r * brightness);
    const faintG = Math.floor(g * brightness);
    const faintB = Math.floor(b * brightness);
    
    // Convert back to hex
    return `#${faintR.toString(16).padStart(2, '0')}${faintG.toString(16).padStart(2, '0')}${faintB.toString(16).padStart(2, '0')}`;
}

function setTargetColor(tileGrid, config) {
    const tiles = getAllTiles(tileGrid);
    
    // Pick ONE random tile to be the target
    const shuffled = [...tiles].sort(() => Math.random() - 0.5);
    const targetTile = shuffled[0];
    
    // Set target tile to target color
    targetTile.material.color.set(gameState.targetColor);
    targetTile.userData.isTarget = true;
    
    // All other tiles get a faint hint of the target color (but much darker)
    const faintColor = makeFaintColor(gameState.targetColor, 0.25);
    tiles.forEach(tile => {
        if (tile !== targetTile) {
            tile.material.color.set(faintColor);
            tile.userData.isTarget = false;
        }
    });
    
    // Game is now active - player can step on tiles
    gameState.isActive = true;
    gameState.timeRemaining = config.timeLimit;
    
    // Start countdown timer
    startTimer(config);
    
    // Update UI
    updateUI();
}

// ============================================================================
// INTERNAL: Timer management
// ============================================================================
function startTimer(config) {
    gameState.timerInterval = setInterval(() => {
        gameState.timeRemaining -= 100;
        
        if (gameState.timeRemaining <= 0) {
            // Time's up! Explode/lose
            gameState.timeRemaining = 0;
            clearInterval(gameState.timerInterval);
            gameState.timerInterval = null;
            explode();
            return;
        }
        
        updateUI();
    }, 100);
}

// ============================================================================
// INTERNAL: Update UI display
// ============================================================================
function updateUI() {
    const colorName = getColorName(gameState.targetColor);
    const seconds = (gameState.timeRemaining / 1000).toFixed(1);
    setGameUIText(`SCORE: ${gameState.score}\nWAVE: ${gameState.currentWave}\nFIND: ${colorName.toUpperCase()}\nTIME: ${seconds}s`);
}

// ============================================================================
// INTERNAL: Convert color hex to name
// ============================================================================
function getColorName(hex) {
    const colorMap = {
        '#ff0000': 'red',
        '#00ff00': 'green',
        '#0000ff': 'blue',
        '#ffff00': 'yellow',
        '#ff00ff': 'magenta',
        '#00ffff': 'cyan',
        '#ff8800': 'orange',
        '#8800ff': 'purple',
    };
    return colorMap[hex.toLowerCase()] || 'color';
}

/**
 * ============================================================================
 * PUBLIC: Check if player stepped on a target tile
 * ============================================================================
 * Call this each frame with the player's position.
 * Automatically handles finding tiles and completing waves.
 */
export function checkTileStep(playerPosition) {
    if (!gameState.isActive || !gameState.targetColor) return;
    
    const tileGrid = getTileGrid();
    if (!tileGrid) return;
    
    const tiles = getAllTiles(tileGrid);
    const tileSize = tileGrid.userData.tileSize || 2;
    
    // Find which tile the player is on
    for (const tile of tiles) {
        const tileWorldPos = new THREE.Vector3();
        tile.getWorldPosition(tileWorldPos);
        
        // Simple distance check
        const halfSize = tileSize / 2;
        const dx = Math.abs(playerPosition.x - tileWorldPos.x);
        const dz = Math.abs(playerPosition.z - tileWorldPos.z);
        
        if (dx < halfSize && dz < halfSize) {
            // Player is on this tile
            if (tile.userData.isTarget) {
                // Found the target tile! Go to next wave immediately
                gameState.score += 100;
                
                // Visual feedback - make tile glow brightly
                tile.material.emissive.set(tile.material.color);
                tile.material.emissiveIntensity = 1.5; // Much brighter!
                
                // Immediately complete wave and go to next
                completeWave();
            }
            break;
        }
    }
}

// ============================================================================
// INTERNAL: Wave completion logic
// ============================================================================
function completeWave() {
    gameState.isActive = false;
    
    // Clear timer
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
    
    // Calculate time bonus (more time remaining = more points)
    const timeBonus = Math.floor(gameState.timeRemaining / 10);
    gameState.score += 500 + timeBonus; // Base bonus + time bonus
    
    // Reset all tiles
    const tileGrid = getTileGrid();
    if (tileGrid) {
        const tiles = getAllTiles(tileGrid);
        tiles.forEach(tile => {
            tile.userData.isTarget = false;
            tile.userData.found = false;
            tile.material.emissive.set(0x000000);
            tile.material.emissiveIntensity = 0;
        });
    }
    
    // Update UI
    setGameUIText(`SCORE: ${gameState.score}\nWAVE: ${gameState.currentWave}\n✅ COMPLETE! ✅`);
    
    // Start next wave after a delay
    setTimeout(() => {
        startWave();
    }, 2000);
}

// ============================================================================
// INTERNAL: Handle time running out
// ============================================================================
function explode() {
    gameState.isActive = false;
    
    // Clear timer
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
    
    // Update UI
    setGameUIText(`SCORE: ${gameState.score}\nWAVE: ${gameState.currentWave}\n💥 TIME'S UP! 💥\nPRESS BUTTON TO RESTART`);
    
    // Reset tiles
    const tileGrid = getTileGrid();
    if (tileGrid) {
        const tiles = getAllTiles(tileGrid);
        tiles.forEach(tile => {
            tile.userData.isTarget = false;
            tile.userData.found = false;
            tile.material.emissive.set(0x000000);
            tile.material.emissiveIntensity = 0;
            // Reset to checkerboard pattern
            const row = tile.userData.gridRow;
            const col = tile.userData.gridCol;
            const isEven = (row + col) % 2 === 0;
            tile.material.color.set(isEven ? 0x4a7c59 : 0x5a8f4a);
        });
    }
    
    // Reset game state
    gameState.currentWave = 0;
    gameState.score = 0;
}

/**
 * ============================================================================
 * PUBLIC: Reset game to initial state
 * ============================================================================
 * Call this to reset everything back to the beginning.
 */
export function resetGame() {
    // Clear timer
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
    }
    
    gameState = {
        isActive: false,
        currentWave: 0,
        targetColor: null,
        tilesFound: 0,
        tilesToFind: 2,
        score: 0,
        timeRemaining: 0,
        timerInterval: null,
    };
    
    // Reset tiles to default colors
    const tileGrid = getTileGrid();
    if (tileGrid) {
        const tiles = getAllTiles(tileGrid);
        tiles.forEach(tile => {
            tile.userData.isTarget = false;
            tile.userData.found = false;
            tile.material.emissive.set(0x000000);
            tile.material.emissiveIntensity = 0;
            // Reset to checkerboard pattern
            const row = tile.userData.gridRow;
            const col = tile.userData.gridCol;
            const isEven = (row + col) % 2 === 0;
            tile.material.color.set(isEven ? 0x4a7c59 : 0x5a8f4a);
        });
    }
    
    setGameUIText('SCORE: 0\nWAVE: 0\nPRESS BUTTON TO START');
}

/**
 * ============================================================================
 * PUBLIC: Get current game state
 * ============================================================================
 * Returns current score, wave, etc. Useful for debugging.
 */
export function getGameState() {
    return { ...gameState };
}

/**
 * ============================================================================
 * INTERNAL FUNCTIONS (Complexity hidden away)
 * ============================================================================
 * Everything below this line is internal implementation.
 * You don't need to understand this to add waves!
 * ============================================================================
 */
