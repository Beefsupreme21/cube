import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { AnimationController } from './animations';
import { createCharacterMesh } from './player';

// Remote player data store
const remotePlayers = new Map();

// Local player info
let localPlayer = null;
let gameId = null;
let scene = null;
let channel = null;
let css2DRenderer = null;
let localPlayerMesh = null;
let localPlayerLabel = null;

// Broadcast rate limiting (33ms = 30 updates/sec for smoother gameplay)
const BROADCAST_INTERVAL = 33;
let lastBroadcastTime = 0;
let lastPosition = { x: 0, y: 0, z: 0 };
let lastRotation = 0;
let currentAnimation = 'idle';

/**
 * Create a name label that floats above a player
 */
function createNameLabel(name, isLocal = false) {
    const labelDiv = document.createElement('div');
    labelDiv.className = 'player-label';
    labelDiv.textContent = name;
    labelDiv.style.cssText = `
        color: white;
        font-family: 'Space Mono', monospace;
        font-size: 14px;
        font-weight: bold;
        padding: 4px 8px;
        background: ${isLocal ? 'rgba(233, 69, 96, 0.8)' : 'rgba(74, 144, 217, 0.8)'};
        border-radius: 4px;
        white-space: nowrap;
        pointer-events: none;
        text-shadow: 0 1px 2px rgba(0,0,0,0.5);
    `;
    
    const label = new CSS2DObject(labelDiv);
    label.position.set(0, 2.2, 0); // Above player's head
    return label;
}

/**
 * Create a remote player mesh with their chosen color and class
 */
function createRemotePlayerMesh(player) {
    // Use shared character mesh creation with player's color and class
    const character = createCharacterMesh(player.color || '#4a90d9', player.class || 'warrior');
    
    // Add name label
    const label = createNameLabel(player.name, false);
    character.add(label);
    
    return { mesh: character, label };
}

/**
 * Add a remote player to the scene
 */
function addRemotePlayer(player, position = { x: 0, y: 0, z: 0 }, rotation = 0) {
    if (player.id === localPlayer.id) return; // Don't add ourselves
    if (remotePlayers.has(player.id)) return; // Already exists
    
    const { mesh, label } = createRemotePlayerMesh(player);
    mesh.position.set(position.x, 1, position.z);
    mesh.rotation.y = rotation;
    
    // Create animation controller for this remote player
    const animator = new AnimationController(mesh);
    
    // Store player data with velocity for prediction
    const playerData = {
        player,
        mesh,
        label,
        animator,
        targetPosition: new THREE.Vector3(position.x, 0, position.z),
        targetRotation: rotation,
        velocity: new THREE.Vector3(0, 0, 0),
        lastUpdateTime: Date.now(),
        previousPosition: new THREE.Vector3(position.x, 0, position.z),
    };
    
    remotePlayers.set(player.id, playerData);
    scene.add(mesh);
    
    console.log(`[Multiplayer] Player joined: ${player.name} (${player.id})`);
}

/**
 * Update a remote player's position with velocity tracking
 */
function updateRemotePlayer(playerId, position, rotation, animation = null) {
    if (playerId === localPlayer.id) return;
    
    const playerData = remotePlayers.get(playerId);
    if (!playerData) return;
    
    const now = Date.now();
    const timeDelta = (now - playerData.lastUpdateTime) / 1000;
    
    // Calculate velocity from position change
    if (timeDelta > 0 && timeDelta < 1) {
        playerData.velocity.set(
            (position.x - playerData.targetPosition.x) / timeDelta,
            0,
            (position.z - playerData.targetPosition.z) / timeDelta
        );
    }
    
    playerData.previousPosition.copy(playerData.targetPosition);
    playerData.targetPosition.set(position.x, position.y, position.z);
    playerData.targetRotation = rotation;
    playerData.lastUpdateTime = now;
    
    // Store received animation
    if (animation) {
        playerData.receivedAnimation = animation;
    }
}

/**
 * Remove a remote player from the scene
 */
function removeRemotePlayer(playerId) {
    const playerData = remotePlayers.get(playerId);
    if (!playerData) return;
    
    scene.remove(playerData.mesh);
    remotePlayers.delete(playerId);
    
    console.log(`[Multiplayer] Player left: ${playerId}`);
}

/**
 * Interpolate remote players toward their target positions with prediction
 */
export function updateRemotePlayers(deltaTime) {
    const now = Date.now();
    
    remotePlayers.forEach((playerData) => {
        // Time since last network update
        const timeSinceUpdate = (now - playerData.lastUpdateTime) / 1000;
        
        // Predicted position based on velocity (extrapolation)
        const predictedX = playerData.targetPosition.x + playerData.velocity.x * Math.min(timeSinceUpdate, 0.1);
        const predictedZ = playerData.targetPosition.z + playerData.velocity.z * Math.min(timeSinceUpdate, 0.1);
        
        // Smooth interpolation toward predicted position
        const lerpFactor = Math.min(1, deltaTime * 15); // Faster lerp for responsiveness
        
        playerData.mesh.position.x += (predictedX - playerData.mesh.position.x) * lerpFactor;
        playerData.mesh.position.y += (playerData.targetPosition.y - playerData.mesh.position.y) * lerpFactor;
        playerData.mesh.position.z += (predictedZ - playerData.mesh.position.z) * lerpFactor;
        
        // Interpolate rotation (handle wrap-around)
        let rotDiff = playerData.targetRotation - playerData.mesh.rotation.y;
        while (rotDiff > Math.PI) rotDiff -= 2 * Math.PI;
        while (rotDiff < -Math.PI) rotDiff += 2 * Math.PI;
        playerData.mesh.rotation.y += rotDiff * lerpFactor;
        
        // Decay velocity over time if no updates
        if (timeSinceUpdate > 0.1) {
            playerData.velocity.multiplyScalar(0.9);
        }
        
        // Update animation - use received animation from network
        if (playerData.receivedAnimation) {
            // For one-shot animations like jump, use duration
            if (playerData.receivedAnimation === 'jump' && !playerData.animator.isPlaying('jump')) {
                playerData.animator.play('jump', { duration: 0.6 });
            } else if (playerData.receivedAnimation !== 'jump') {
                playerData.animator.play(playerData.receivedAnimation);
            }
        }
        playerData.animator.update(deltaTime);
    });
}

/**
 * Update CSS2D labels (must be called each frame after main render)
 */
export function updateNameLabels(camera) {
    if (css2DRenderer) {
        css2DRenderer.render(scene, camera);
    }
}

/**
 * Set the current animation to broadcast
 */
export function setAnimation(animationName) {
    currentAnimation = animationName;
}

/**
 * Broadcast local player position via HTTP POST
 */
export function broadcastPosition(playerState) {
    if (!channel || !localPlayer) return;
    
    const now = Date.now();
    if (now - lastBroadcastTime < BROADCAST_INTERVAL) return;
    
    const pos = playerState.position;
    const rot = playerState.rotation;
    
    // Only broadcast if position/rotation changed significantly
    const posDelta = Math.abs(pos.x - lastPosition.x) + Math.abs(pos.z - lastPosition.z) + Math.abs(pos.y - lastPosition.y);
    const rotDelta = Math.abs(rot - lastRotation);
    
    if (posDelta < 0.01 && rotDelta < 0.01) return;
    
    lastBroadcastTime = now;
    lastPosition = { x: pos.x, y: pos.y, z: pos.z };
    lastRotation = rot;
    
    // Send position update to server (include socket ID so we don't receive our own update)
    fetch('/game/move', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || '',
            'X-Socket-ID': window.Echo?.socketId() || '',
        },
        body: JSON.stringify({
            player_id: localPlayer.id,
            x: pos.x,
            y: pos.y,
            z: pos.z,
            rotation: rot,
            animation: currentAnimation,
        }),
    }).catch(err => console.warn('[Multiplayer] Failed to broadcast position:', err));
}

/**
 * Initialize multiplayer connection using public channel
 */
export function initMultiplayer(gameScene, config, playerMesh, camera, renderer) {
    scene = gameScene;
    localPlayer = config.player;
    gameId = config.gameId;
    localPlayerMesh = playerMesh;
    
    console.log(`[Multiplayer] ========================================`);
    console.log(`[Multiplayer] Initializing multiplayer`);
    console.log(`[Multiplayer] Player:`, localPlayer);
    console.log(`[Multiplayer] Game ID: ${gameId}`);
    console.log(`[Multiplayer] ========================================`);
    
    // Setup CSS2D renderer for name labels
    css2DRenderer = new CSS2DRenderer();
    css2DRenderer.setSize(window.innerWidth, window.innerHeight);
    css2DRenderer.domElement.style.position = 'absolute';
    css2DRenderer.domElement.style.top = '0';
    css2DRenderer.domElement.style.pointerEvents = 'none';
    document.getElementById('game-container').appendChild(css2DRenderer.domElement);
    
    // Handle resize for CSS2D renderer
    window.addEventListener('resize', () => {
        css2DRenderer.setSize(window.innerWidth, window.innerHeight);
    });
    
    // Add label to local player
    localPlayerLabel = createNameLabel(localPlayer.name, true);
    localPlayerMesh.add(localPlayerLabel);
    
    // Wait for Echo to be ready
    function setupEcho() {
        if (!window.Echo) {
            console.log('[Multiplayer] Waiting for Echo to be ready...');
            setTimeout(setupEcho, 100);
            return;
        }
        
        console.log('[Multiplayer] Echo is ready, subscribing to channel: game.' + gameId);
        
        // Join public channel (no auth needed)
        channel = window.Echo.channel(`game.${gameId}`);
        
        // Listen for player joined events
        channel.listen('.player-joined', (data) => {
            console.log('[Multiplayer] 📥 Received player-joined:', data);
            addRemotePlayer(data.player, data.position, data.rotation);
        });
        
        // Listen for player moved events
        channel.listen('.player-moved', (data) => {
            updateRemotePlayer(data.player_id, data.position, data.rotation, data.animation);
        });
        
        // Listen for player left events
        channel.listen('.player-left', (data) => {
            console.log('[Multiplayer] 📤 Received player-left:', data);
            removeRemotePlayer(data.player_id);
        });
        
        console.log('[Multiplayer] Event listeners attached, announcing presence...');
        
        // Announce our presence (include socket ID so server can exclude us from broadcast)
        fetch('/game/join', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || '',
                'X-Socket-ID': window.Echo.socketId() || '',
            },
            body: JSON.stringify({
                player: localPlayer,
                position: { x: 0, y: 0, z: 0 },
                rotation: 0,
            }),
        }).then(response => {
              console.log('[Multiplayer] Join response status:', response.status);
              return response.json();
          })
          .then(data => {
              console.log('[Multiplayer] ✅ Joined game successfully!');
              console.log('[Multiplayer] Existing players:', data.players?.length || 0);
              // Add existing players
              if (data.players) {
                  data.players.forEach(p => {
                      if (p.player.id !== localPlayer.id) {
                          console.log('[Multiplayer] Adding existing player:', p.player.name);
                          addRemotePlayer(p.player, p.position, p.rotation);
                      }
                  });
              }
          })
          .catch(err => console.error('[Multiplayer] ❌ Failed to join game:', err));
    }
    
    setupEcho();
    
    // Handle page unload
    window.addEventListener('beforeunload', () => {
        navigator.sendBeacon('/game/leave', JSON.stringify({
            player_id: localPlayer.id,
        }));
    });
}

/**
 * Check if multiplayer is ready
 */
export function isMultiplayerReady() {
    return channel !== null;
}

/**
 * Get count of remote players
 */
export function getRemotePlayerCount() {
    return remotePlayers.size;
}
