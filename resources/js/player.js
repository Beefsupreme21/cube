import * as THREE from 'three';

/**
 * Create a character mesh with the specified color
 * Used for both local and remote players
 */
export function createCharacterMesh(color = '#ff6b6b') {
    const character = new THREE.Group();
    const playerColor = new THREE.Color(color);
    
    // Body
    const bodyGeometry = new THREE.BoxGeometry(0.6, 1.2, 0.4);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: playerColor });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.name = 'body';
    body.position.y = 0.6;
    body.castShadow = true;
    character.add(body);
    
    // Head
    const headGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffdbac });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.name = 'head';
    head.position.y = 1.45;
    head.castShadow = true;
    character.add(head);
    
    // Left arm
    const armGeometry = new THREE.BoxGeometry(0.2, 0.8, 0.2);
    const armMaterial = new THREE.MeshStandardMaterial({ color: playerColor });
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.name = 'leftArm';
    leftArm.position.set(-0.5, 0.6, 0);
    leftArm.castShadow = true;
    character.add(leftArm);
    
    // Right arm
    const rightArm = new THREE.Mesh(armGeometry, armMaterial.clone());
    rightArm.name = 'rightArm';
    rightArm.position.set(0.5, 0.6, 0);
    rightArm.castShadow = true;
    character.add(rightArm);
    
    // Left leg
    const legGeometry = new THREE.BoxGeometry(0.25, 0.8, 0.25);
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0x4a5568 });
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.name = 'leftLeg';
    leftLeg.position.set(-0.2, -0.4, 0);
    leftLeg.castShadow = true;
    character.add(leftLeg);
    
    // Right leg
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial.clone());
    rightLeg.name = 'rightLeg';
    rightLeg.position.set(0.2, -0.4, 0);
    rightLeg.castShadow = true;
    character.add(rightLeg);
    
    // Nose/face indicator
    const noseGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.15);
    const noseMaterial = new THREE.MeshStandardMaterial({ color: playerColor });
    const nose = new THREE.Mesh(noseGeometry, noseMaterial);
    nose.name = 'nose';
    nose.position.set(0, 1.45, 0.3);
    character.add(nose);
    
    character.position.set(0, 1, 0);
    return character;
}

/**
 * Create the local player mesh (default red, will be updated on join)
 */
export function createPlayer() {
    return createCharacterMesh('#ff6b6b');
}

export function createPlayerState() {
    return {
        position: new THREE.Vector3(0, 1, 0), // Start at ground level (y=1)
        velocity: new THREE.Vector3(0, 0, 0),
        rotation: 0,
        moveSpeed: 5,
        rotationSpeed: 3,
        isGrounded: true,
    };
}

/**
 * Update player mesh color
 */
export function updatePlayerColor(playerMesh, hexColor) {
    const color = new THREE.Color(hexColor);
    
    // Update body, arms, and nose
    const body = playerMesh.getObjectByName('body');
    const leftArm = playerMesh.getObjectByName('leftArm');
    const rightArm = playerMesh.getObjectByName('rightArm');
    const nose = playerMesh.getObjectByName('nose');
    
    if (body) body.material.color.copy(color);
    if (leftArm) leftArm.material.color.copy(color);
    if (rightArm) rightArm.material.color.copy(color);
    if (nose) nose.material.color.copy(color);
}

/**
 * Apply crouch pose to player mesh
 * @param {THREE.Group} playerMesh - The player mesh
 * @param {boolean} isCrouching - Whether to crouch or stand
 * @param {number} deltaTime - Time delta for smooth transitions
 */
export function applyCrouch(playerMesh, isCrouching, deltaTime = 0) {
    const body = playerMesh.getObjectByName('body');
    const head = playerMesh.getObjectByName('head');
    const leftLeg = playerMesh.getObjectByName('leftLeg');
    const rightLeg = playerMesh.getObjectByName('rightLeg');
    const nose = playerMesh.getObjectByName('nose');
    
    // Store original positions if not already stored
    if (!playerMesh.userData.originalPositions) {
        playerMesh.userData.originalPositions = {
            bodyY: body ? body.position.y : 0.6,
            headY: head ? head.position.y : 1.45,
            noseY: nose ? nose.position.y : 1.45,
            leftLegY: leftLeg ? leftLeg.position.y : -0.4,
            rightLegY: rightLeg ? rightLeg.position.y : -0.4,
        };
    }
    
    const orig = playerMesh.userData.originalPositions;
    const crouchAmount = playerMesh.userData.crouchAmount || 0;
    
    // Smoothly transition crouch amount
    const targetCrouch = isCrouching ? 1 : 0;
    const lerpSpeed = 15; // How fast to transition
    let newCrouchAmount;
    if (deltaTime > 0) {
        const lerpFactor = Math.min(1, lerpSpeed * deltaTime);
        newCrouchAmount = crouchAmount + (targetCrouch - crouchAmount) * lerpFactor;
    } else {
        newCrouchAmount = targetCrouch;
    }
    playerMesh.userData.crouchAmount = newCrouchAmount;
    
    // Crouch offsets
    const bodyLower = 0.25; // How much to lower body
    const headLower = 0.3; // How much to lower head
    const legBend = 0.15; // How much to bend legs
    const bodyTilt = 0.2; // Forward tilt of body (hunch)
    
    if (body) {
        body.position.y = orig.bodyY - bodyLower * newCrouchAmount;
        body.rotation.x = bodyTilt * newCrouchAmount; // Forward hunch
    }
    
    if (head) {
        head.position.y = orig.headY - headLower * newCrouchAmount;
    }
    
    if (nose) {
        nose.position.y = orig.noseY - headLower * newCrouchAmount;
    }
    
    if (leftLeg) {
        leftLeg.position.y = orig.leftLegY - legBend * newCrouchAmount;
        leftLeg.rotation.x = 0.3 * newCrouchAmount; // Bend leg
    }
    
    if (rightLeg) {
        rightLeg.position.y = orig.rightLegY - legBend * newCrouchAmount;
        rightLeg.rotation.x = 0.3 * newCrouchAmount; // Bend leg
    }
}
