import './bootstrap';
import * as THREE from 'three';
import { createScene, setupLighting, createGround, getTileGrid, setTileGridColor } from './scene';
import { startWave, checkTileStep, resetGame } from './game';
import { createCharacterMesh, createPlayerState, updatePlayerColor, applyCrouch } from './player';
import { setupControls, updatePlayerMovement } from './controls';
import { setupCamera, updateCamera } from './camera';
import { AnimationController } from './animations';
import { initMultiplayer, updateRemotePlayers, broadcastPosition, updateNameLabels, setAnimation, setCrouching } from './multiplayer';
import { createDustEffect, emitDust, updateDust } from './effects';

let gameStarted = false;

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('game-container');
    const joinScreen = document.getElementById('join-screen');
    const joinBtn = document.getElementById('join-btn');
    const nameInput = document.getElementById('player-name-input');
    const colorPicker = document.getElementById('color-picker');
    
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
    
    // Player (create with server-provided color)
    const initialColor = window.gameConfig?.player?.color || '#e94560';
    const player = createCharacterMesh(initialColor);
    scene.add(player);
    const playerState = createPlayerState();
    
    // Animation controller
    const animator = new AnimationController(player);
    
    // Dust effect for sprinting
    const dustEffect = createDustEffect();
    player.add(dustEffect);
    dustEffect.position.set(0, 0, 0); // At feet level
    
    // Controls
    const keys = setupControls();
    
    // Track F key press (prevent spam)
    let fKeyPressed = false;
    let fKeyJustPressed = false;
    
    document.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 'f' && !fKeyPressed) {
            fKeyPressed = true;
            fKeyJustPressed = true;
        }
    });
    
    document.addEventListener('keyup', (e) => {
        if (e.key.toLowerCase() === 'f') {
            fKeyPressed = false;
        }
    });
    
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
        const { isMoving, isJumping, justJumped, isSprinting, isCrouching } = updatePlayerMovement(keys, playerState, deltaTime);
        
        // Update player mesh
        player.position.copy(playerState.position);
        player.rotation.y = playerState.rotation;
        
        // Check if player stepped on a target tile
        if (gameStarted) {
            checkTileStep(playerState.position);
        }
        
        // Apply crouch pose
        applyCrouch(player, isCrouching, deltaTime);
        setCrouching(isCrouching); // Broadcast crouch state
        
        // Update animation based on state
        if (justJumped) {
            // Start jump animation (one-shot)
            animator.play('jump', { duration: 0.6 });
            setAnimation('jump');
        } else if (!isJumping) {
            // Only change to walk/idle/run if not jumping
            if (isMoving) {
                if (isSprinting) {
                    animator.play('run');
                    setAnimation('run');
                } else {
                    animator.play('walk');
                    setAnimation('walk');
                }
            } else {
                animator.play('idle');
                setAnimation('idle');
            }
        }
        animator.update(deltaTime);
        
        // Emit dust continuously while sprinting and moving
        if (isSprinting && isMoving && !isJumping) {
            const moveDirection = new THREE.Vector3(
                Math.sin(playerState.rotation),
                0,
                Math.cos(playerState.rotation)
            );
            
            // Position dust further behind the player (opposite to movement direction)
            const backwardOffset = 0.8; // Distance behind player (increased from 0.3)
            const footPosition = new THREE.Vector3(
                playerState.position.x - moveDirection.x * backwardOffset,
                playerState.position.y - 0.4, // At feet level
                playerState.position.z - moveDirection.z * backwardOffset
            );
            
            // Emit dust every frame while sprinting (deltaTime will naturally throttle it)
            emitDust(dustEffect, footPosition, moveDirection, deltaTime * 30);
        }
        
        // Update dust effect
        updateDust(dustEffect, deltaTime);
        
        // Update camera
        updateCamera(camera, playerState, player);
        
        // Check for nearby interactables and show prompt
        let nearInteractable = false;
        if (gameStarted) {
            const interactables = [];
            scene.traverse((object) => {
                if (object.userData?.isButton && object.userData?.interactable) {
                    interactables.push(object);
                }
            });
            
            // Check if player is near any interactable
            for (const interactable of interactables) {
                const distance = playerState.position.distanceTo(
                    new THREE.Vector3(interactable.position.x, playerState.position.y, interactable.position.z)
                );
                
                if (distance <= interactable.userData.interactionRange) {
                    nearInteractable = true;
                    break;
                }
            }
        }
        
        // Show/hide interaction prompt
        let promptElement = document.getElementById('interaction-prompt');
        if (nearInteractable) {
            if (!promptElement) {
                promptElement = document.createElement('div');
                promptElement.id = 'interaction-prompt';
                promptElement.style.cssText = `
                    position: fixed;
                    bottom: 100px;
                    left: 50%;
                    transform: translateX(-50%);
                    color: #00ff00;
                    font-family: 'Space Mono', monospace;
                    font-size: 20px;
                    font-weight: bold;
                    pointer-events: none;
                    text-shadow: 0 0 10px rgba(0, 255, 0, 0.8);
                    z-index: 1000;
                    background: rgba(0, 0, 0, 0.7);
                    padding: 12px 24px;
                    border-radius: 8px;
                    border: 2px solid #00ff00;
                `;
                promptElement.textContent = 'Press F to interact';
                document.body.appendChild(promptElement);
            }
            promptElement.style.display = 'block';
        } else {
            if (promptElement) {
                promptElement.style.display = 'none';
            }
        }
        
        // Handle interactions (F key)
        if (fKeyJustPressed && gameStarted) {
            fKeyJustPressed = false;
            
            // Find all interactable objects in scene
            const interactables = [];
            scene.traverse((object) => {
                if (object.userData?.isButton && object.userData?.interactable) {
                    interactables.push(object);
                }
            });
            
            // Check if player is near any interactable
            for (const interactable of interactables) {
                const distance = playerState.position.distanceTo(
                    new THREE.Vector3(interactable.position.x, playerState.position.y, interactable.position.z)
                );
                
                if (distance <= interactable.userData.interactionRange) {
                    // Player is close enough to interact
                    console.log('[Interaction] Button activated!');
                    
                    // Change button appearance (glow)
                    const buttonTop = interactable.getObjectByName('buttonTop');
                    if (buttonTop) {
                        buttonTop.material.emissiveIntensity = 1.0;
                        setTimeout(() => {
                            buttonTop.material.emissiveIntensity = 0.3;
                        }, 200);
                    }
                    
                    // Start the game wave
                    startWave();
                    
                    break; // Only interact with one object at a time
                }
            }
        }
        
        // Multiplayer: update remote players and broadcast local position
        updateRemotePlayers(deltaTime);
        updateNameLabels(camera);
        broadcastPosition(playerState);
        
        renderer.render(scene, camera);
    }
    
    function startGame() {
        // Update player name and color from input
        const enteredName = nameInput.value.trim() || 'Player';
        window.gameConfig.player.name = enteredName;
        window.gameConfig.player.color = selectedColor;
        
        // Update local player mesh appearance
        updatePlayerColor(player, selectedColor);
        
        // Hide join screen
        joinScreen.classList.add('hidden');
        
        // Start game
        gameStarted = true;
        
        // Reset game state
        resetGame();
        
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
