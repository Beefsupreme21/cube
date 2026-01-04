import * as THREE from 'three';

// Remote player data store
const remotePlayers = new Map();

// Local player info
let localPlayerId = null;
let localPlayerName = null;
let gameId = null;
let scene = null;
let channel = null;

// Broadcast rate limiting (33ms = 30 updates/sec for smoother gameplay)
const BROADCAST_INTERVAL = 33;
let lastBroadcastTime = 0;
let lastPosition = { x: 0, y: 0, z: 0 };
let lastRotation = 0;

/**
 * Create a remote player mesh (blue color to distinguish from local player)
 */
function createRemotePlayerMesh() {
    const character = new THREE.Group();
    
    // Body (blue for remote players)
    const bodyGeometry = new THREE.BoxGeometry(0.6, 1.2, 0.4);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x4a90d9 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.6;
    body.castShadow = true;
    character.add(body);
    
    // Head
    const headGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffdbac });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.45;
    head.castShadow = true;
    character.add(head);
    
    // Left arm
    const armGeometry = new THREE.BoxGeometry(0.2, 0.8, 0.2);
    const armMaterial = new THREE.MeshStandardMaterial({ color: 0x4a90d9 });
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.5, 0.6, 0);
    leftArm.castShadow = true;
    character.add(leftArm);
    
    // Right arm
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.5, 0.6, 0);
    rightArm.castShadow = true;
    character.add(rightArm);
    
    // Left leg
    const legGeometry = new THREE.BoxGeometry(0.25, 0.8, 0.25);
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0x4a5568 });
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.2, -0.4, 0);
    leftLeg.castShadow = true;
    character.add(leftLeg);
    
    // Right leg
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.2, -0.4, 0);
    rightLeg.castShadow = true;
    character.add(rightLeg);
    
    // Nose/face indicator (blue)
    const noseGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.15);
    const noseMaterial = new THREE.MeshStandardMaterial({ color: 0x4a90d9 });
    const nose = new THREE.Mesh(noseGeometry, noseMaterial);
    nose.position.set(0, 1.45, 0.3);
    character.add(nose);
    
    character.position.set(0, 1, 0);
    return character;
}

/**
 * Add a remote player to the scene
 */
function addRemotePlayer(playerId, playerName, position = { x: 0, y: 0, z: 0 }, rotation = 0) {
    if (playerId === localPlayerId) return; // Don't add ourselves
    if (remotePlayers.has(playerId)) return; // Already exists
    
    const mesh = createRemotePlayerMesh();
    mesh.position.set(position.x, 1, position.z);
    mesh.rotation.y = rotation;
    
    // Store player data with velocity for prediction
    const playerData = {
        mesh,
        name: playerName,
        targetPosition: new THREE.Vector3(position.x, 0, position.z),
        targetRotation: rotation,
        velocity: new THREE.Vector3(0, 0, 0),
        lastUpdateTime: Date.now(),
        previousPosition: new THREE.Vector3(position.x, 0, position.z),
    };
    
    remotePlayers.set(playerId, playerData);
    scene.add(mesh);
    
    console.log(`[Multiplayer] Player joined: ${playerName} (${playerId})`);
}

/**
 * Update a remote player's position with velocity tracking
 */
function updateRemotePlayer(playerId, position, rotation) {
    if (playerId === localPlayerId) return;
    
    const player = remotePlayers.get(playerId);
    if (!player) return;
    
    const now = Date.now();
    const timeDelta = (now - player.lastUpdateTime) / 1000;
    
    // Calculate velocity from position change
    if (timeDelta > 0 && timeDelta < 1) {
        player.velocity.set(
            (position.x - player.targetPosition.x) / timeDelta,
            0,
            (position.z - player.targetPosition.z) / timeDelta
        );
    }
    
    player.previousPosition.copy(player.targetPosition);
    player.targetPosition.set(position.x, 0, position.z);
    player.targetRotation = rotation;
    player.lastUpdateTime = now;
}

/**
 * Remove a remote player from the scene
 */
function removeRemotePlayer(playerId) {
    const player = remotePlayers.get(playerId);
    if (!player) return;
    
    scene.remove(player.mesh);
    remotePlayers.delete(playerId);
    
    console.log(`[Multiplayer] Player left: ${playerId}`);
}

/**
 * Interpolate remote players toward their target positions with prediction
 */
export function updateRemotePlayers(deltaTime) {
    const now = Date.now();
    
    remotePlayers.forEach((player) => {
        // Time since last network update
        const timeSinceUpdate = (now - player.lastUpdateTime) / 1000;
        
        // Predicted position based on velocity (extrapolation)
        const predictedX = player.targetPosition.x + player.velocity.x * Math.min(timeSinceUpdate, 0.1);
        const predictedZ = player.targetPosition.z + player.velocity.z * Math.min(timeSinceUpdate, 0.1);
        
        // Smooth interpolation toward predicted position
        const lerpFactor = Math.min(1, deltaTime * 15); // Faster lerp for responsiveness
        
        player.mesh.position.x += (predictedX - player.mesh.position.x) * lerpFactor;
        player.mesh.position.z += (predictedZ - player.mesh.position.z) * lerpFactor;
        
        // Interpolate rotation (handle wrap-around)
        let rotDiff = player.targetRotation - player.mesh.rotation.y;
        while (rotDiff > Math.PI) rotDiff -= 2 * Math.PI;
        while (rotDiff < -Math.PI) rotDiff += 2 * Math.PI;
        player.mesh.rotation.y += rotDiff * lerpFactor;
        
        // Decay velocity over time if no updates
        if (timeSinceUpdate > 0.1) {
            player.velocity.multiplyScalar(0.9);
        }
    });
}

/**
 * Broadcast local player position via HTTP POST
 */
export function broadcastPosition(playerState) {
    if (!channel) return;
    
    const now = Date.now();
    if (now - lastBroadcastTime < BROADCAST_INTERVAL) return;
    
    const pos = playerState.position;
    const rot = playerState.rotation;
    
    // Only broadcast if position/rotation changed significantly
    const posDelta = Math.abs(pos.x - lastPosition.x) + Math.abs(pos.z - lastPosition.z);
    const rotDelta = Math.abs(rot - lastRotation);
    
    if (posDelta < 0.01 && rotDelta < 0.01) return;
    
    lastBroadcastTime = now;
    lastPosition = { x: pos.x, y: pos.y, z: pos.z };
    lastRotation = rot;
    
    // Send position update to server
    fetch('/game/move', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || '',
        },
        body: JSON.stringify({
            x: pos.x,
            y: pos.y,
            z: pos.z,
            rotation: rot,
        }),
    }).catch(err => console.warn('[Multiplayer] Failed to broadcast position:', err));
}

/**
 * Initialize multiplayer connection using public channel
 */
export function initMultiplayer(gameScene, config) {
    scene = gameScene;
    localPlayerId = config.playerId;
    localPlayerName = config.playerName;
    gameId = config.gameId;
    
    console.log(`[Multiplayer] ========================================`);
    console.log(`[Multiplayer] Initializing multiplayer`);
    console.log(`[Multiplayer] Player ID: ${localPlayerId}`);
    console.log(`[Multiplayer] Player Name: ${localPlayerName}`);
    console.log(`[Multiplayer] Game ID: ${gameId}`);
    console.log(`[Multiplayer] ========================================`);
    
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
            addRemotePlayer(data.player_id, data.player_name, data.position, data.rotation);
        });
        
        // Listen for player moved events
        channel.listen('.player-moved', (data) => {
            updateRemotePlayer(data.player_id, data.position, data.rotation);
        });
        
        // Listen for player left events
        channel.listen('.player-left', (data) => {
            console.log('[Multiplayer] 📤 Received player-left:', data);
            removeRemotePlayer(data.player_id);
        });
        
        console.log('[Multiplayer] Event listeners attached, announcing presence...');
        
        // Announce our presence
        fetch('/game/join', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || '',
            },
            body: JSON.stringify({
                x: 0,
                y: 0,
                z: 0,
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
                  data.players.forEach(player => {
                      if (player.player_id !== localPlayerId) {
                          console.log('[Multiplayer] Adding existing player:', player.player_id);
                          addRemotePlayer(player.player_id, player.player_name, player.position, player.rotation);
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
            player_id: localPlayerId,
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
