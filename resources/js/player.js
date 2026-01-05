import * as THREE from 'three';

/**
 * Class appearance configurations
 */
const CLASS_CONFIG = {
    warrior: {
        bodyScale: 1.2,
        headScale: 1.0,
        accessories: ['sword', 'shield'],
    },
    hunter: {
        bodyScale: 1.0,
        headScale: 1.0,
        accessories: ['bow', 'quiver'],
    },
    mage: {
        bodyScale: 0.9,
        headScale: 1.1,
        accessories: ['staff', 'hat'],
    },
};

/**
 * Create class-specific accessories
 */
function createAccessories(character, playerClass, playerColor) {
    const config = CLASS_CONFIG[playerClass] || CLASS_CONFIG.warrior;
    const metalColor = new THREE.Color(0x888888);
    const woodColor = new THREE.Color(0x8b4513);
    
    config.accessories.forEach(accessory => {
        switch (accessory) {
            case 'sword': {
                // Sword in right hand
                const swordGroup = new THREE.Group();
                swordGroup.name = 'sword';
                
                // Blade
                const bladeGeom = new THREE.BoxGeometry(0.08, 0.6, 0.02);
                const bladeMat = new THREE.MeshStandardMaterial({ color: metalColor, metalness: 0.8, roughness: 0.2 });
                const blade = new THREE.Mesh(bladeGeom, bladeMat);
                blade.position.y = 0.3;
                swordGroup.add(blade);
                
                // Handle
                const handleGeom = new THREE.BoxGeometry(0.06, 0.15, 0.06);
                const handleMat = new THREE.MeshStandardMaterial({ color: woodColor });
                const handle = new THREE.Mesh(handleGeom, handleMat);
                swordGroup.add(handle);
                
                // Guard
                const guardGeom = new THREE.BoxGeometry(0.2, 0.04, 0.04);
                const guard = new THREE.Mesh(guardGeom, bladeMat);
                guard.position.y = 0.08;
                swordGroup.add(guard);
                
                swordGroup.position.set(0.65, 0.3, 0.15);
                swordGroup.rotation.z = -0.3;
                character.add(swordGroup);
                break;
            }
            case 'shield': {
                // Shield on left arm
                const shieldGeom = new THREE.BoxGeometry(0.1, 0.5, 0.4);
                const shieldMat = new THREE.MeshStandardMaterial({ color: playerColor, metalness: 0.3, roughness: 0.7 });
                const shield = new THREE.Mesh(shieldGeom, shieldMat);
                shield.name = 'shield';
                shield.position.set(-0.65, 0.5, 0);
                character.add(shield);
                break;
            }
            case 'bow': {
                // Bow on back
                const bowGroup = new THREE.Group();
                bowGroup.name = 'bow';
                
                // Bow curve (simplified as a bent shape)
                const bowGeom = new THREE.TorusGeometry(0.25, 0.02, 8, 16, Math.PI);
                const bowMat = new THREE.MeshStandardMaterial({ color: woodColor });
                const bow = new THREE.Mesh(bowGeom, bowMat);
                bow.rotation.z = Math.PI / 2;
                bowGroup.add(bow);
                
                // String
                const stringGeom = new THREE.CylinderGeometry(0.005, 0.005, 0.5, 8);
                const stringMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
                const string = new THREE.Mesh(stringGeom, stringMat);
                string.position.x = -0.02;
                bowGroup.add(string);
                
                bowGroup.position.set(0, 0.8, -0.3);
                bowGroup.rotation.y = Math.PI / 2;
                character.add(bowGroup);
                break;
            }
            case 'quiver': {
                // Quiver on back
                const quiverGeom = new THREE.CylinderGeometry(0.08, 0.1, 0.4, 8);
                const quiverMat = new THREE.MeshStandardMaterial({ color: woodColor });
                const quiver = new THREE.Mesh(quiverGeom, quiverMat);
                quiver.name = 'quiver';
                quiver.position.set(0.15, 0.7, -0.25);
                quiver.rotation.x = 0.2;
                character.add(quiver);
                
                // Arrow tips poking out
                for (let i = 0; i < 3; i++) {
                    const arrowGeom = new THREE.ConeGeometry(0.02, 0.08, 4);
                    const arrowMat = new THREE.MeshStandardMaterial({ color: metalColor });
                    const arrow = new THREE.Mesh(arrowGeom, arrowMat);
                    arrow.position.set(0.15 + (i - 1) * 0.04, 0.95, -0.25);
                    character.add(arrow);
                }
                break;
            }
            case 'staff': {
                // Magic staff
                const staffGroup = new THREE.Group();
                staffGroup.name = 'staff';
                
                // Pole
                const poleGeom = new THREE.CylinderGeometry(0.03, 0.04, 1.2, 8);
                const poleMat = new THREE.MeshStandardMaterial({ color: woodColor });
                const pole = new THREE.Mesh(poleGeom, poleMat);
                pole.position.y = 0.4;
                staffGroup.add(pole);
                
                // Crystal orb
                const orbGeom = new THREE.SphereGeometry(0.1, 16, 16);
                const orbMat = new THREE.MeshStandardMaterial({ 
                    color: playerColor, 
                    emissive: playerColor,
                    emissiveIntensity: 0.5,
                    transparent: true,
                    opacity: 0.8,
                });
                const orb = new THREE.Mesh(orbGeom, orbMat);
                orb.name = 'staffOrb';
                orb.position.y = 1.05;
                staffGroup.add(orb);
                
                staffGroup.position.set(0.6, 0.2, 0);
                character.add(staffGroup);
                break;
            }
            case 'hat': {
                // Wizard hat
                const hatGroup = new THREE.Group();
                hatGroup.name = 'hat';
                
                // Brim
                const brimGeom = new THREE.CylinderGeometry(0.35, 0.35, 0.05, 16);
                const hatMat = new THREE.MeshStandardMaterial({ color: playerColor });
                const brim = new THREE.Mesh(brimGeom, hatMat);
                hatGroup.add(brim);
                
                // Cone
                const coneGeom = new THREE.ConeGeometry(0.2, 0.5, 16);
                const cone = new THREE.Mesh(coneGeom, hatMat);
                cone.position.y = 0.25;
                hatGroup.add(cone);
                
                hatGroup.position.set(0, 1.7, 0);
                character.add(hatGroup);
                break;
            }
        }
    });
}

/**
 * Create a character mesh with the specified color and class
 * Used for both local and remote players
 */
export function createCharacterMesh(color = '#ff6b6b', playerClass = 'warrior') {
    const character = new THREE.Group();
    const playerColor = new THREE.Color(color);
    const config = CLASS_CONFIG[playerClass] || CLASS_CONFIG.warrior;
    
    // Body (scaled by class)
    const bodyGeometry = new THREE.BoxGeometry(0.6 * config.bodyScale, 1.2, 0.4 * config.bodyScale);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: playerColor });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.name = 'body';
    body.position.y = 0.6;
    body.castShadow = true;
    character.add(body);
    
    // Head (scaled by class)
    const headGeometry = new THREE.BoxGeometry(0.5 * config.headScale, 0.5 * config.headScale, 0.5 * config.headScale);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffdbac });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.name = 'head';
    head.position.y = 1.45;
    head.castShadow = true;
    character.add(head);
    
    // Left arm (scaled by class)
    const armGeometry = new THREE.BoxGeometry(0.2 * config.bodyScale, 0.8, 0.2 * config.bodyScale);
    const armMaterial = new THREE.MeshStandardMaterial({ color: playerColor });
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.name = 'leftArm';
    leftArm.position.set(-0.5 * config.bodyScale, 0.6, 0);
    leftArm.castShadow = true;
    character.add(leftArm);
    
    // Right arm
    const rightArm = new THREE.Mesh(armGeometry, armMaterial.clone());
    rightArm.name = 'rightArm';
    rightArm.position.set(0.5 * config.bodyScale, 0.6, 0);
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
    nose.position.set(0, 1.45, 0.3 * config.headScale);
    character.add(nose);
    
    // Add class-specific accessories
    createAccessories(character, playerClass, playerColor);
    
    // Store class for later reference
    character.userData.playerClass = playerClass;
    
    character.position.set(0, 1, 0);
    return character;
}

/**
 * Create the local player mesh (default red warrior, will be updated on join)
 */
export function createPlayer() {
    return createCharacterMesh('#ff6b6b', 'warrior');
}

export function createPlayerState() {
    return {
        position: new THREE.Vector3(0, 0, 0),
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
    const shield = playerMesh.getObjectByName('shield');
    const hat = playerMesh.getObjectByName('hat');
    const staffOrb = playerMesh.getObjectByName('staffOrb');
    
    if (body) body.material.color.copy(color);
    if (leftArm) leftArm.material.color.copy(color);
    if (rightArm) rightArm.material.color.copy(color);
    if (nose) nose.material.color.copy(color);
    if (shield) shield.material.color.copy(color);
    if (hat) {
        hat.traverse(child => {
            if (child.isMesh) child.material.color.copy(color);
        });
    }
    if (staffOrb) {
        staffOrb.material.color.copy(color);
        staffOrb.material.emissive.copy(color);
    }
}

/**
 * Update player class (removes old accessories, adds new ones)
 */
export function updatePlayerClass(playerMesh, newClass) {
    const currentClass = playerMesh.userData.playerClass;
    if (currentClass === newClass) return;
    
    // Get current color from body
    const body = playerMesh.getObjectByName('body');
    const playerColor = body ? body.material.color : new THREE.Color('#ff6b6b');
    
    // Remove old accessories
    const accessoryNames = ['sword', 'shield', 'bow', 'quiver', 'staff', 'hat'];
    accessoryNames.forEach(name => {
        const obj = playerMesh.getObjectByName(name);
        if (obj) {
            playerMesh.remove(obj);
            // Dispose of geometry and materials
            obj.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
        }
    });
    
    // Remove arrow tips (they don't have names)
    const arrowsToRemove = [];
    playerMesh.traverse(child => {
        if (child.geometry?.type === 'ConeGeometry' && child.geometry.parameters.radius === 0.02) {
            arrowsToRemove.push(child);
        }
    });
    arrowsToRemove.forEach(arrow => {
        playerMesh.remove(arrow);
        arrow.geometry.dispose();
        arrow.material.dispose();
    });
    
    // Apply new class scaling
    const config = CLASS_CONFIG[newClass] || CLASS_CONFIG.warrior;
    
    // Update body scale
    if (body) {
        body.geometry.dispose();
        body.geometry = new THREE.BoxGeometry(0.6 * config.bodyScale, 1.2, 0.4 * config.bodyScale);
    }
    
    // Update head scale
    const head = playerMesh.getObjectByName('head');
    if (head) {
        head.geometry.dispose();
        head.geometry = new THREE.BoxGeometry(0.5 * config.headScale, 0.5 * config.headScale, 0.5 * config.headScale);
    }
    
    // Update arm positions
    const leftArm = playerMesh.getObjectByName('leftArm');
    const rightArm = playerMesh.getObjectByName('rightArm');
    if (leftArm) {
        leftArm.geometry.dispose();
        leftArm.geometry = new THREE.BoxGeometry(0.2 * config.bodyScale, 0.8, 0.2 * config.bodyScale);
        leftArm.position.x = -0.5 * config.bodyScale;
    }
    if (rightArm) {
        rightArm.geometry.dispose();
        rightArm.geometry = new THREE.BoxGeometry(0.2 * config.bodyScale, 0.8, 0.2 * config.bodyScale);
        rightArm.position.x = 0.5 * config.bodyScale;
    }
    
    // Update nose position
    const nose = playerMesh.getObjectByName('nose');
    if (nose) {
        nose.position.z = 0.3 * config.headScale;
    }
    
    // Add new accessories
    createAccessories(playerMesh, newClass, playerColor);
    
    // Update stored class
    playerMesh.userData.playerClass = newClass;
}
