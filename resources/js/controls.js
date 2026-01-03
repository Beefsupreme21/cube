export function setupControls() {
    const keys = {};
    
    document.addEventListener('keydown', (e) => {
        keys[e.key.toLowerCase()] = true;
    });
    
    document.addEventListener('keyup', (e) => {
        keys[e.key.toLowerCase()] = false;
    });
    
    return keys;
}

export function updatePlayerMovement(keys, playerState, deltaTime) {
    // Rotation
    if (keys['a'] || keys['arrowleft']) {
        playerState.rotation += playerState.rotationSpeed * deltaTime;
    }
    if (keys['d'] || keys['arrowright']) {
        playerState.rotation -= playerState.rotationSpeed * deltaTime;
    }
    
    // Movement in facing direction
    const moveDistance = playerState.moveSpeed * deltaTime;
    let moveX = 0;
    let moveZ = 0;
    
    if (keys['w'] || keys['arrowup']) {
        moveX = Math.sin(playerState.rotation) * moveDistance;
        moveZ = Math.cos(playerState.rotation) * moveDistance;
    }
    if (keys['s'] || keys['arrowdown']) {
        moveX = -Math.sin(playerState.rotation) * moveDistance;
        moveZ = -Math.cos(playerState.rotation) * moveDistance;
    }
    
    // Update position
    playerState.position.x += moveX;
    playerState.position.z += moveZ;
    
    // Keep within bounds
    const terrainBounds = 100;
    playerState.position.x = Math.max(-terrainBounds, Math.min(terrainBounds, playerState.position.x));
    playerState.position.z = Math.max(-terrainBounds, Math.min(terrainBounds, playerState.position.z));
    
    // Character height (standing on flat ground)
    playerState.position.y = 1;
    
    // Check if moving
    const isMoving = (keys['w'] || keys['arrowup'] || keys['s'] || keys['arrowdown']);
    
    return { moveX, moveZ, isMoving };
}
