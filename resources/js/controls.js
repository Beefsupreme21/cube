import { getGroundHeight } from './scene';

// Physics constants
const GRAVITY = 20;
const JUMP_FORCE = 8;

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
    
    // Check for sprint (shift key)
    const isSprinting = keys['shift'] || keys['shiftleft'] || keys['shiftright'];
    // Check for crouch (ctrl key)
    const isCrouching = keys['control'] || keys['ctrl'] || keys['controlleft'] || keys['controlright'];
    const currentMoveSpeed = isSprinting ? (playerState.moveSpeed * 1.8) : (isCrouching ? (playerState.moveSpeed * 0.6) : playerState.moveSpeed);
    
    // Rotation
    if (keys['a'] || keys['arrowleft']) {
        playerState.rotation += playerState.rotationSpeed * deltaTime;
    }
    if (keys['d'] || keys['arrowright']) {
        playerState.rotation -= playerState.rotationSpeed * deltaTime;
    }
    
    // Horizontal movement in facing direction
    const moveDistance = currentMoveSpeed * deltaTime;
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
    
    // Get ground height at current position
    const groundHeight = getGroundHeight(playerState.position.x, playerState.position.z);
    
    // Apply gravity
    if (!playerState.isGrounded) {
        playerState.velocity.y -= GRAVITY * deltaTime;
        playerState.position.y += playerState.velocity.y * deltaTime;
        
        // Check if landed (with small threshold to prevent bouncing)
        if (playerState.position.y <= groundHeight + 0.1) {
            playerState.position.y = groundHeight;
            playerState.velocity.y = 0;
            playerState.isGrounded = true;
        }
    } else {
        // Keep player on ground (follow terrain)
        playerState.position.y = groundHeight;
    }
    
    // Keep within bounds
    const terrainBounds = 100;
    playerState.position.x = Math.max(-terrainBounds, Math.min(terrainBounds, playerState.position.x));
    playerState.position.z = Math.max(-terrainBounds, Math.min(terrainBounds, playerState.position.z));
    
    // Check if moving horizontally
    const isMoving = (keys['w'] || keys['arrowup'] || keys['s'] || keys['arrowdown']);
    const isJumping = !playerState.isGrounded;
    
    return { moveX, moveZ, isMoving, isJumping, justJumped, isSprinting, isCrouching };
}
