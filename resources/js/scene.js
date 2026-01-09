import * as THREE from 'three';

export function createScene() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a); // Dark background
    
    return scene;
}

export function setupLighting(scene) {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    scene.add(directionalLight);
}


/**
 * Get the ground height at a given X, Z position
 * Returns the Y position the player should be at
 */
export function getGroundHeight(x, z) {
    return 1; // Default ground level (flat ground)
}

/**
 * Create an 8x8 tile grid
 */
function createTileGrid(centerX = 0, centerZ = 0, tileSize = 2, gap = 0.2) {
    const grid = new THREE.Group();
    const gridSize = 8;
    
    // Calculate total size including gaps
    const totalSize = (gridSize * tileSize) + ((gridSize - 1) * gap);
    const startOffset = -totalSize / 2 + tileSize / 2;
    
    // Create alternating colors for checkerboard pattern
    const color1 = new THREE.Color(0x4a7c59); // Dark green
    const color2 = new THREE.Color(0x5a8f4a); // Light green
    
    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            const x = startOffset + col * (tileSize + gap);
            const z = startOffset + row * (tileSize + gap);
            
            // Checkerboard pattern
            const isEven = (row + col) % 2 === 0;
            const tileColor = isEven ? color1 : color2;
            
            // Create tile
            const tileGeometry = new THREE.BoxGeometry(tileSize, 0.1, tileSize);
            const tileMaterial = new THREE.MeshStandardMaterial({ 
                color: tileColor,
                roughness: 0.8,
            });
            const tile = new THREE.Mesh(tileGeometry, tileMaterial);
            tile.position.set(x, 0.05, z);
            tile.receiveShadow = true;
            tile.castShadow = false;
            
            // Store grid position for reference
            tile.userData.gridRow = row;
            tile.userData.gridCol = col;
            
            grid.add(tile);
        }
    }
    
    grid.position.set(centerX, 0, centerZ);
    grid.userData.isTileGrid = true;
    grid.userData.tileSize = tileSize;
    grid.userData.gap = gap;
    grid.userData.gridSize = gridSize;
    
    return grid;
}

/**
 * Create an interactive button/pillar
 */
function createButton(x, z, height = 2) {
    const button = new THREE.Group();
    
    // Pillar base
    const pillarGeometry = new THREE.CylinderGeometry(0.5, 0.6, height, 8);
    const pillarMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x888888,
        metalness: 0.3,
        roughness: 0.7,
    });
    const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
    pillar.position.y = height / 2;
    pillar.castShadow = true;
    pillar.receiveShadow = true;
    button.add(pillar);
    
    // Button top (glowing when active)
    const buttonTopGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.2, 8);
    const buttonTopMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xff6b6b,
        emissive: 0xff6b6b,
        emissiveIntensity: 0.3,
    });
    const buttonTop = new THREE.Mesh(buttonTopGeometry, buttonTopMaterial);
    buttonTop.position.y = height;
    buttonTop.name = 'buttonTop';
    button.add(buttonTop);
    
    button.position.set(x, 0, z);
    button.userData.isButton = true;
    button.userData.interactable = true;
    button.userData.interactionRange = 3; // Distance player needs to be to interact
    
    return button;
}

/**
 * Change all tiles in a grid to a specific color
 */
export function setTileGridColor(tileGrid, color) {
    if (!tileGrid || !tileGrid.userData.isTileGrid) return;
    
    const newColor = new THREE.Color(color);
    tileGrid.traverse((child) => {
        if (child.isMesh && child.material) {
            child.material.color.copy(newColor);
        }
    });
}

/**
 * Get the tile grid from the scene
 */
let tileGridRef = null;

export function getTileGrid() {
    return tileGridRef;
}

/**
 * Create a simple game UI overlay (text in corner)
 */
export function createGameUI() {
    const uiDiv = document.createElement('div');
    uiDiv.id = 'game-ui';
    uiDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 20px;
        color: #00ff00;
        font-family: 'Space Mono', monospace;
        font-size: 24px;
        font-weight: bold;
        pointer-events: none;
        text-shadow: 0 0 10px rgba(0, 255, 0, 0.8);
        z-index: 1000;
        white-space: pre-line;
        line-height: 1.5;
    `;
    uiDiv.textContent = 'SCORE: 0\nWAVE: 1';
    
    document.body.appendChild(uiDiv);
    return uiDiv;
}

/**
 * Update the game UI text
 */
export function setGameUIText(text) {
    const uiDiv = document.getElementById('game-ui');
    if (uiDiv) {
        uiDiv.textContent = text;
    }
}

export function createGround(scene) {
    // Calculate tile grid size to determine ground size
    // Tile grid is 8x8 with tiles of size 2 and gap 0.2
    // Total size = 8 * 2 + 7 * 0.2 = 16 + 1.4 = 17.4
    // Add some margin around it (about 3-4 units on each side)
    const groundSize = 25; // Slightly larger than tile grid
    
    // Create simple black/gray ground
    const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x2a2a2a, // Dark gray
        roughness: 0.9,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, 0, 0); // Center at spawn point
    ground.receiveShadow = true;
    scene.add(ground);
    
    // Add 8x8 tile grid (positioned at spawn point)
    const tileGrid = createTileGrid(0, 0, 2, 0.2);
    scene.add(tileGrid);
    tileGridRef = tileGrid; // Store reference for interaction
    
    // Add interactive button near the tile grid
    const button = createButton(0, 12, 2);
    scene.add(button);
    button.userData.tileGrid = tileGrid; // Link button to tile grid
    
    // Create game UI overlay (text in corner)
    createGameUI();
}
