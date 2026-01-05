import './bootstrap';
import * as THREE from 'three';
import { createScene, setupLighting, createGround } from './scene';
import { createCharacterMesh, createPlayerState, updatePlayerColor, updatePlayerClass } from './player';
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
    const colorPicker = document.getElementById('color-picker');
    const classPicker = document.getElementById('class-picker');
    
    if (!container) return;

    // Pre-fill name input with default from server
    if (window.gameConfig?.player?.name) {
        nameInput.value = window.gameConfig.player.name;
    }
    
    // Handle color selection (use saved color from server)
    let selectedColor = window.gameConfig?.player?.color || '#e94560';
    colorPicker.addEventListener('click', (e) => {
        const colorOption = e.target.closest('.color-option');
        if (!colorOption) return;
        
        // Update selected state
        colorPicker.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
        colorOption.classList.add('selected');
        selectedColor = colorOption.dataset.color;
    });
    
    // Handle class selection (use saved class from server)
    let selectedClass = window.gameConfig?.player?.class || 'warrior';
    classPicker.addEventListener('click', (e) => {
        const classOption = e.target.closest('.class-option');
        if (!classOption) return;
        
        // Update selected state
        classPicker.querySelectorAll('.class-option').forEach(opt => opt.classList.remove('selected'));
        classOption.classList.add('selected');
        selectedClass = classOption.dataset.class;
    });
    
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
    
    // Player (create with server-provided color and class)
    const initialColor = window.gameConfig?.player?.color || '#e94560';
    const initialClass = window.gameConfig?.player?.class || 'warrior';
    const player = createCharacterMesh(initialColor, initialClass);
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
        // Update player name, color, and class from input
        const enteredName = nameInput.value.trim() || 'Player';
        window.gameConfig.player.name = enteredName;
        window.gameConfig.player.color = selectedColor;
        window.gameConfig.player.class = selectedClass;
        
        // Update local player mesh appearance
        updatePlayerColor(player, selectedColor);
        updatePlayerClass(player, selectedClass);
        
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
