import * as THREE from 'three';

export function createScene() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    
    // Add fog for atmosphere
    scene.fog = new THREE.Fog(0x87ceeb, 50, 150);
    
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
 * Create a simple tree
 */
function createTree(x, z, scale = 1) {
    const tree = new THREE.Group();
    
    // Trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.3 * scale, 0.4 * scale, 2 * scale, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 1 * scale;
    trunk.castShadow = true;
    tree.add(trunk);
    
    // Foliage (3 layers of cones)
    const foliageMaterial = new THREE.MeshStandardMaterial({ color: 0x228b22 });
    
    const foliage1 = new THREE.Mesh(
        new THREE.ConeGeometry(1.5 * scale, 2 * scale, 8),
        foliageMaterial
    );
    foliage1.position.y = 2.5 * scale;
    foliage1.castShadow = true;
    tree.add(foliage1);
    
    const foliage2 = new THREE.Mesh(
        new THREE.ConeGeometry(1.2 * scale, 1.5 * scale, 8),
        foliageMaterial
    );
    foliage2.position.y = 3.5 * scale;
    foliage2.castShadow = true;
    tree.add(foliage2);
    
    const foliage3 = new THREE.Mesh(
        new THREE.ConeGeometry(0.8 * scale, 1 * scale, 8),
        foliageMaterial
    );
    foliage3.position.y = 4.3 * scale;
    foliage3.castShadow = true;
    tree.add(foliage3);
    
    tree.position.set(x, 0, z);
    return tree;
}

/**
 * Create a rock
 */
function createRock(x, z, scale = 1) {
    const rockGeometry = new THREE.DodecahedronGeometry(0.5 * scale, 0);
    const rockMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x808080,
        roughness: 0.9,
        flatShading: true,
    });
    const rock = new THREE.Mesh(rockGeometry, rockMaterial);
    rock.position.set(x, 0.3 * scale, z);
    rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    rock.scale.set(
        scale * (0.8 + Math.random() * 0.4),
        scale * (0.6 + Math.random() * 0.3),
        scale * (0.8 + Math.random() * 0.4)
    );
    rock.castShadow = true;
    return rock;
}

/**
 * Create a bush
 */
function createBush(x, z, scale = 1) {
    const bush = new THREE.Group();
    const bushMaterial = new THREE.MeshStandardMaterial({ color: 0x2d5a27 });
    
    // Multiple spheres for bushy look
    for (let i = 0; i < 5; i++) {
        const sphereGeom = new THREE.SphereGeometry(0.3 * scale * (0.8 + Math.random() * 0.4), 8, 8);
        const sphere = new THREE.Mesh(sphereGeom, bushMaterial);
        sphere.position.set(
            (Math.random() - 0.5) * 0.5 * scale,
            0.3 * scale + Math.random() * 0.2 * scale,
            (Math.random() - 0.5) * 0.5 * scale
        );
        sphere.castShadow = true;
        bush.add(sphere);
    }
    
    bush.position.set(x, 0, z);
    return bush;
}

export function createGround(scene) {
    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x4a7c59 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    
    // Red circle at spawn point
    const circleGeometry = new THREE.RingGeometry(2, 2.2, 32);
    const circleMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide });
    const spawnCircle = new THREE.Mesh(circleGeometry, circleMaterial);
    spawnCircle.rotation.x = -Math.PI / 2;
    spawnCircle.position.y = 0.01;
    scene.add(spawnCircle);
    
    // Add trees in a scattered pattern (avoiding spawn area)
    const treePositions = [
        // Near trees
        { x: 15, z: 10, scale: 1.2 },
        { x: -12, z: 15, scale: 1.0 },
        { x: 18, z: -8, scale: 1.1 },
        { x: -15, z: -12, scale: 0.9 },
        { x: 8, z: -18, scale: 1.3 },
        { x: -20, z: 5, scale: 1.0 },
        // Medium distance
        { x: 30, z: 25, scale: 1.4 },
        { x: -28, z: 30, scale: 1.2 },
        { x: 35, z: -20, scale: 1.1 },
        { x: -32, z: -25, scale: 1.3 },
        { x: 25, z: -35, scale: 1.0 },
        { x: -25, z: -35, scale: 1.2 },
        { x: 40, z: 10, scale: 1.1 },
        { x: -38, z: 15, scale: 1.4 },
        // Far trees
        { x: 50, z: 40, scale: 1.5 },
        { x: -45, z: 45, scale: 1.3 },
        { x: 55, z: -30, scale: 1.2 },
        { x: -50, z: -40, scale: 1.4 },
        { x: 35, z: 50, scale: 1.1 },
        { x: -40, z: 55, scale: 1.3 },
        { x: 60, z: 0, scale: 1.5 },
        { x: -55, z: -10, scale: 1.2 },
    ];
    
    treePositions.forEach(pos => {
        scene.add(createTree(pos.x, pos.z, pos.scale));
    });
    
    // Add rocks
    const rockPositions = [
        { x: 10, z: 5, scale: 1.0 },
        { x: -8, z: 8, scale: 0.8 },
        { x: 12, z: -5, scale: 1.2 },
        { x: -10, z: -8, scale: 0.7 },
        { x: 25, z: 15, scale: 1.5 },
        { x: -22, z: 20, scale: 1.1 },
        { x: 30, z: -15, scale: 1.3 },
        { x: -28, z: -18, scale: 0.9 },
        { x: 5, z: 20, scale: 0.6 },
        { x: -5, z: -22, scale: 1.0 },
    ];
    
    rockPositions.forEach(pos => {
        scene.add(createRock(pos.x, pos.z, pos.scale));
    });
    
    // Add bushes
    const bushPositions = [
        { x: 8, z: 12, scale: 1.0 },
        { x: -6, z: 10, scale: 0.8 },
        { x: 14, z: -10, scale: 1.1 },
        { x: -12, z: -6, scale: 0.9 },
        { x: 20, z: 8, scale: 1.2 },
        { x: -18, z: 12, scale: 1.0 },
        { x: 22, z: -18, scale: 0.8 },
        { x: -20, z: -20, scale: 1.1 },
        { x: 35, z: 30, scale: 1.3 },
        { x: -30, z: 35, scale: 1.0 },
        { x: 40, z: -25, scale: 0.9 },
        { x: -35, z: -30, scale: 1.2 },
    ];
    
    bushPositions.forEach(pos => {
        scene.add(createBush(pos.x, pos.z, pos.scale));
    });
}
