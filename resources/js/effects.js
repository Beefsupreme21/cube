import * as THREE from 'three';

/**
 * Create a dust particle effect at the player's feet
 */
export function createDustEffect() {
    const dustGroup = new THREE.Group();
    dustGroup.name = 'dustEffect';
    
    // Create particle system using Points
    const particleCount = 30;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const lifetimes = new Float32Array(particleCount);
    const sizes = new Float32Array(particleCount);
    
    // Initialize particles (all start inactive)
    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = 0;
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = 0;
        velocities[i * 3] = 0;
        velocities[i * 3 + 1] = 0;
        velocities[i * 3 + 2] = 0;
        lifetimes[i] = 0; // 0 = inactive
        sizes[i] = 0;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    // Create material with texture or simple color
    const material = new THREE.PointsMaterial({
        color: 0xaaaaaa,
        size: 0.2,
        transparent: true,
        opacity: 0.7,
        blending: THREE.NormalBlending,
        depthWrite: false,
        sizeAttenuation: true,
    });
    
    const particles = new THREE.Points(geometry, material);
    dustGroup.add(particles);
    
    // Store data for updates
    dustGroup.userData.particleCount = particleCount;
    dustGroup.userData.positions = positions;
    dustGroup.userData.velocities = velocities;
    dustGroup.userData.lifetimes = lifetimes;
    dustGroup.userData.sizes = sizes;
    dustGroup.userData.particles = particles;
    dustGroup.userData.activeCount = 0;
    
    return dustGroup;
}

/**
 * Emit dust particles at a position (position is in local space relative to dustEffect parent)
 */
export function emitDust(dustEffect, worldPosition, direction, intensity = 1) {
    const { positions, velocities, lifetimes, sizes, particleCount } = dustEffect.userData;
    
    // Convert world position to local space
    const localPosition = new THREE.Vector3();
    dustEffect.parent.worldToLocal(localPosition.copy(worldPosition));
    
    // Emit 2-4 particles per call
    const emitCount = Math.floor(2 + Math.random() * 2) * intensity;
    let emitted = 0;
    
    for (let i = 0; i < particleCount && emitted < emitCount; i++) {
        if (lifetimes[i] <= 0) {
            // Activate this particle
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.5 + Math.random() * 0.5;
            const spread = 0.3;
            
            // Position at feet with slight random offset (in local space)
            positions[i * 3] = localPosition.x + (Math.random() - 0.5) * spread;
            positions[i * 3 + 1] = localPosition.y;
            positions[i * 3 + 2] = localPosition.z + (Math.random() - 0.5) * spread;
            
            // Velocity based on movement direction + random spread
            const dirX = direction.x || 0;
            const dirZ = direction.z || 0;
            velocities[i * 3] = (dirX * 0.3 + Math.cos(angle) * 0.2) * speed;
            velocities[i * 3 + 1] = (0.2 + Math.random() * 0.3) * speed;
            velocities[i * 3 + 2] = (dirZ * 0.3 + Math.sin(angle) * 0.2) * speed;
            
            lifetimes[i] = 0.3 + Math.random() * 0.2; // 0.3-0.5 seconds
            sizes[i] = 0.1 + Math.random() * 0.1;
            emitted++;
        }
    }
    
    dustEffect.userData.positions = positions;
    dustEffect.userData.velocities = velocities;
    dustEffect.userData.lifetimes = lifetimes;
    dustEffect.userData.sizes = sizes;
}

/**
 * Update dust particle system
 */
export function updateDust(dustEffect, deltaTime) {
    const { positions, velocities, lifetimes, sizes, particles, particleCount } = dustEffect.userData;
    const positionAttr = particles.geometry.attributes.position;
    const sizeAttr = particles.geometry.attributes.size;
    
    let activeCount = 0;
    
    for (let i = 0; i < particleCount; i++) {
        if (lifetimes[i] > 0) {
            // Update particle
            lifetimes[i] -= deltaTime;
            
            if (lifetimes[i] > 0) {
                // Update position
                positions[i * 3] += velocities[i * 3] * deltaTime;
                positions[i * 3 + 1] += velocities[i * 3 + 1] * deltaTime;
                positions[i * 3 + 2] += velocities[i * 3 + 2] * deltaTime;
                
                // Apply gravity
                velocities[i * 3 + 1] -= 5 * deltaTime;
                
                // Fade out and shrink
                const lifeRatio = lifetimes[i] / 0.5; // Assuming max lifetime of 0.5
                sizes[i] = (0.1 + Math.random() * 0.1) * lifeRatio; // Shrink as it fades
                
                activeCount++;
            } else {
                // Particle expired, reset
                positions[i * 3] = 0;
                positions[i * 3 + 1] = 0;
                positions[i * 3 + 2] = 0;
                sizes[i] = 0;
            }
        }
    }
    
    // Update geometry attributes
    positionAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
    
    dustEffect.userData.activeCount = activeCount;
}
