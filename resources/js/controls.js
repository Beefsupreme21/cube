// Physics constants
const GRAVITY = 20;
const JUMP_FORCE = 8;
const GROUND_Y = 1; // Character's base Y position when on ground

export function setupControls() {
    const keys = {};
    
    document.addEventListener('keydown', (e) => {
        keys[e.key.toLowerCase()] = true;
        // Prevent spacebar from scrolling page
        if (e.key === ' ') {
            e.preventDefault();
        }
    });
    
    document.addEventListener('keyup', (e) => {
        keys[e.key.toLowerCase()] = false;
    });
    
    return keys;
}

export function updatePlayerMovement(keys, playerState, deltaTime) {
    // Initialize velocity if not present
    if (!playerState.velocity) {
        playerState.velocity = { x: 0, y: 0, z: 0 };
    }
    if (playerState.isGrounded === undefined) {
        playerState.isGrounded = true;
    }
    
    // Rotation
    if (keys['a'] || keys['arrowleft']) {
        playerState.rotation += playerState.rotationSpeed * deltaTime;
    }
    if (keys['d'] || keys['arrowright']) {
        playerState.rotation -= playerState.rotationSpeed * deltaTime;
    }
    
    // Horizontal movement in facing direction
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
    
    // Update horizontal position
    playerState.position.x += moveX;
    playerState.position.z += moveZ;
    
    // Store velocity for animations/multiplayer
    playerState.velocity.x = moveX / deltaTime;
    playerState.velocity.z = moveZ / deltaTime;
    
    // Jump - only if grounded and spacebar pressed
    let justJumped = false;
    if ((keys[' '] || keys['space']) && playerState.isGrounded) {
        playerState.velocity.y = JUMP_FORCE;
        playerState.isGrounded = false;
        justJumped = true;
    }
    
    // Apply gravity
    if (!playerState.isGrounded) {
        playerState.velocity.y -= GRAVITY * deltaTime;
        playerState.position.y += playerState.velocity.y * deltaTime;
        
        // Check if landed
        if (playerState.position.y <= GROUND_Y) {
            playerState.position.y = GROUND_Y;
            playerState.velocity.y = 0;
            playerState.isGrounded = true;
        }
    } else {
        playerState.position.y = GROUND_Y;
    }
    
    // Keep within bounds
    const terrainBounds = 100;
    playerState.position.x = Math.max(-terrainBounds, Math.min(terrainBounds, playerState.position.x));
    playerState.position.z = Math.max(-terrainBounds, Math.min(terrainBounds, playerState.position.z));
    
    // Check if moving horizontally
    const isMoving = (keys['w'] || keys['arrowup'] || keys['s'] || keys['arrowdown']);
    const isJumping = !playerState.isGrounded;
    
    return { moveX, moveZ, isMoving, isJumping, justJumped };
}
