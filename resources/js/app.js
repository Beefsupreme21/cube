import './bootstrap';
import * as THREE from 'three';
import { createScene, setupLighting, createGround } from './scene';
import { createPlayer, createPlayerState } from './player';
import { setupControls, updatePlayerMovement } from './controls';
import { setupCamera, updateCamera } from './camera';
import { AnimationController } from './animations';
import { initMultiplayer, updateRemotePlayers, broadcastPosition, updateNameLabels, setAnimation } from './multiplayer';

let gameStarted = false;

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('game-container');
    const joinScreen = document.getElementById('join-screen');
    const joinBtn = document.getElementById('join-btn');
    const nameInput = document.getElementById('player-name-input');
    
    if (!container) return;

    // Pre-fill name input with default from server
    if (window.gameConfig?.player?.name) {
        nameInput.value = window.gameConfig.player.name;
    }
    
    // Focus input
    nameInput.focus();
    
    // Handle enter key on input
    nameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            startGame();
        }
    });
    
    // Handle join button click
    joinBtn.addEventListener('click', startGame);
    
    // Scene setup (initialize but don't start game loop yet)
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
    
    // Animation controller
    const animator = new AnimationController(player);
    
    // Controls
    const keys = setupControls();
    
    // Animation loop
    const clock = new THREE.Clock();
    
    function animate() {
        requestAnimationFrame(animate);
        
        if (!gameStarted) {
            renderer.render(scene, camera);
            return;
        }
        
        const deltaTime = clock.getDelta();
        
        // Update movement
        const { isMoving, isJumping, justJumped } = updatePlayerMovement(keys, playerState, deltaTime);
        
        // Update player mesh
        player.position.copy(playerState.position);
        player.rotation.y = playerState.rotation;
        
        // Update animation based on state
        if (justJumped) {
            // Start jump animation (one-shot)
            animator.play('jump', { duration: 0.6 });
            setAnimation('jump');
        } else if (!isJumping) {
            // Only change to walk/idle if not jumping
            if (isMoving) {
                animator.play('walk');
                setAnimation('walk');
            } else {
                animator.play('idle');
                setAnimation('idle');
            }
        }
        animator.update(deltaTime);
        
        // Update camera
        updateCamera(camera, playerState, player);
        
        // Multiplayer: update remote players and broadcast local position
        updateRemotePlayers(deltaTime);
        updateNameLabels(camera);
        broadcastPosition(playerState);
        
        renderer.render(scene, camera);
    }
    
    function startGame() {
        // Update player name from input
        const enteredName = nameInput.value.trim() || 'Player';
        window.gameConfig.player.name = enteredName;
        
        // Hide join screen
        joinScreen.classList.add('hidden');
        
        // Start game
        gameStarted = true;
        
        // Initialize multiplayer
        if (window.gameConfig) {
            initMultiplayer(scene, window.gameConfig, player, camera, renderer);
        }
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
