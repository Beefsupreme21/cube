import './bootstrap';
import * as THREE from 'three';
import { createScene, setupLighting, createGround } from './scene';
import { createPlayer, createPlayerState } from './player';
import { setupControls, updatePlayerMovement } from './controls';
import { setupCamera, updateCamera } from './camera';
import { createWalkingAnimation } from './animations';
import { initMultiplayer, updateRemotePlayers, broadcastPosition } from './multiplayer';

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('game-container');
    if (!container) return;

    // Scene setup
    const scene = createScene();
    setupLighting(scene);
    createGround(scene);
    
    const camera = setupCamera(container);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);
    
    // Player
    const player = createPlayer();
    scene.add(player);
    const playerState = createPlayerState();
    
    // Controls
    const keys = setupControls();
    
    // Initialize multiplayer if config is available
    if (window.gameConfig) {
        initMultiplayer(scene, window.gameConfig);
    }
    
    // Animation loop
    const clock = new THREE.Clock();
    
    function animate() {
        requestAnimationFrame(animate);
        
        const deltaTime = clock.getDelta();
        
        // Update movement
        const { isMoving } = updatePlayerMovement(keys, playerState, deltaTime);
        
        // Update player mesh
        player.position.copy(playerState.position);
        player.rotation.y = playerState.rotation;
        
        // Apply walking animation
        createWalkingAnimation(player, isMoving);
        
        // Update camera
        updateCamera(camera, playerState, player);
        
        // Multiplayer: update remote players and broadcast local position
        updateRemotePlayers(deltaTime);
        broadcastPosition(playerState);
        
        renderer.render(scene, camera);
    }
    
    // Handle resize
    window.addEventListener('resize', () => {
        const width = container.clientWidth;
        const height = container.clientHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    });
    
    camera.lookAt(player.position);
    animate();
});
