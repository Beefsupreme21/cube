/**
 * Animation System
 * 
 * Usage:
 *   const animator = new AnimationController(playerMesh);
 *   animator.play('walk');
 *   animator.update(deltaTime); // call each frame
 * 
 * To add new animations, add a function to the `animations` object below.
 */

/**
 * Extract named limbs from a character mesh
 */
function extractLimbs(mesh) {
    return {
        body: mesh.getObjectByName('body'),
        head: mesh.getObjectByName('head'),
        leftArm: mesh.getObjectByName('leftArm'),
        rightArm: mesh.getObjectByName('rightArm'),
        leftLeg: mesh.getObjectByName('leftLeg'),
        rightLeg: mesh.getObjectByName('rightLeg'),
    };
}

/**
 * Animation definitions
 * Each animation is a function: (limbs, time, progress, speed) => void
 * 
 * - limbs: { body, head, leftArm, rightArm, leftLeg, rightLeg }
 * - time: current time in seconds (for continuous animations)
 * - progress: 0-1 for one-shot animations (jump, attack), null for looping
 * - speed: animation speed multiplier
 */
const animations = {
    /**
     * Idle - subtle breathing motion
     */
    idle: (limbs, time) => {
        const breathe = Math.sin(time * 2) * 0.02;
        
        // Subtle body movement
        if (limbs.body) {
            limbs.body.position.y = 0.6 + breathe;
        }
        
        // Reset limbs to neutral
        if (limbs.leftArm) limbs.leftArm.rotation.x = 0;
        if (limbs.rightArm) limbs.rightArm.rotation.x = 0;
        if (limbs.leftLeg) limbs.leftLeg.rotation.x = 0;
        if (limbs.rightLeg) limbs.rightLeg.rotation.x = 0;
    },

    /**
     * Walk - arm and leg swing with body bob
     */
    walk: (limbs, time) => {
        const speed = 8;
        const swing = Math.sin(time * speed);
        
        // Arm swing (opposite to legs)
        if (limbs.leftArm) limbs.leftArm.rotation.x = swing * 0.3;
        if (limbs.rightArm) limbs.rightArm.rotation.x = -swing * 0.3;
        
        // Leg swing
        if (limbs.leftLeg) limbs.leftLeg.rotation.x = -swing * 0.3;
        if (limbs.rightLeg) limbs.rightLeg.rotation.x = swing * 0.3;
        
        // Body bob
        if (limbs.body) {
            limbs.body.position.y = 0.6 + Math.abs(Math.sin(time * speed * 2)) * 0.05;
        }
    },

    /**
     * Run - faster, more exaggerated movement
     */
    run: (limbs, time) => {
        const speed = 14;
        const swing = Math.sin(time * speed);
        
        // More exaggerated arm swing
        if (limbs.leftArm) limbs.leftArm.rotation.x = swing * 0.6;
        if (limbs.rightArm) limbs.rightArm.rotation.x = -swing * 0.6;
        
        // More exaggerated leg swing
        if (limbs.leftLeg) limbs.leftLeg.rotation.x = -swing * 0.5;
        if (limbs.rightLeg) limbs.rightLeg.rotation.x = swing * 0.5;
        
        // Bigger body bob
        if (limbs.body) {
            limbs.body.position.y = 0.6 + Math.abs(Math.sin(time * speed * 2)) * 0.08;
        }
        
        // Slight forward lean
        if (limbs.body) {
            limbs.body.rotation.x = 0.1;
        }
    },

    /**
     * Jump - dynamic jump animation
     * progress: 0 = launch, 0.3 = rising, 0.5 = apex, 0.8 = falling, 1 = land
     */
    jump: (limbs, time, progress) => {
        const p = progress ?? 0;
        
        if (p < 0.3) {
            // Launch phase - crouch to spring
            const launchProgress = p / 0.3;
            
            // Arms swing back then up
            if (limbs.leftArm) limbs.leftArm.rotation.x = -launchProgress * 1.2;
            if (limbs.rightArm) limbs.rightArm.rotation.x = -launchProgress * 1.2;
            
            // Legs extend
            if (limbs.leftLeg) limbs.leftLeg.rotation.x = -launchProgress * 0.3;
            if (limbs.rightLeg) limbs.rightLeg.rotation.x = -launchProgress * 0.3;
            
        } else if (p < 0.7) {
            // Airborne - arms up, legs slightly tucked
            const airProgress = (p - 0.3) / 0.4;
            
            // Arms stay raised
            if (limbs.leftArm) limbs.leftArm.rotation.x = -1.2 + airProgress * 0.3;
            if (limbs.rightArm) limbs.rightArm.rotation.x = -1.2 + airProgress * 0.3;
            
            // Legs tuck slightly at apex
            const tuck = Math.sin(airProgress * Math.PI) * 0.4;
            if (limbs.leftLeg) limbs.leftLeg.rotation.x = tuck;
            if (limbs.rightLeg) limbs.rightLeg.rotation.x = tuck;
            
        } else {
            // Landing phase - arms come down, legs extend
            const landProgress = (p - 0.7) / 0.3;
            
            // Arms swing down
            if (limbs.leftArm) limbs.leftArm.rotation.x = -0.9 * (1 - landProgress);
            if (limbs.rightArm) limbs.rightArm.rotation.x = -0.9 * (1 - landProgress);
            
            // Legs extend for landing
            if (limbs.leftLeg) limbs.leftLeg.rotation.x = 0.2 * (1 - landProgress);
            if (limbs.rightLeg) limbs.rightLeg.rotation.x = 0.2 * (1 - landProgress);
        }
    },

    /**
     * Attack - placeholder for attack animation
     * progress: 0 = wind up, 0.3 = strike, 1 = recovery
     */
    attack: (limbs, time, progress) => {
        const attackPhase = progress ?? 0;
        
        // Right arm swing for attack
        if (limbs.rightArm) {
            if (attackPhase < 0.3) {
                // Wind up - pull back
                limbs.rightArm.rotation.x = -attackPhase * 2;
                limbs.rightArm.rotation.z = attackPhase * 0.5;
            } else if (attackPhase < 0.5) {
                // Strike - swing forward
                const strikeProgress = (attackPhase - 0.3) / 0.2;
                limbs.rightArm.rotation.x = -0.6 + strikeProgress * 1.5;
                limbs.rightArm.rotation.z = 0.15 - strikeProgress * 0.3;
            } else {
                // Recovery - return to neutral
                const recoveryProgress = (attackPhase - 0.5) / 0.5;
                limbs.rightArm.rotation.x = 0.9 * (1 - recoveryProgress);
                limbs.rightArm.rotation.z = -0.15 * (1 - recoveryProgress);
            }
        }
        
        // Body rotation for power
        if (limbs.body) {
            if (attackPhase < 0.5) {
                limbs.body.rotation.y = Math.sin(attackPhase * Math.PI) * 0.2;
            }
        }
    },
};

/**
 * Animation Controller
 * Manages animation state for a single character
 */
export class AnimationController {
    constructor(mesh) {
        this.mesh = mesh;
        this.limbs = extractLimbs(mesh);
        this.currentAnimation = 'idle';
        this.previousAnimation = null;
        this.startTime = 0;
        this.duration = null; // null = looping, number = one-shot duration in seconds
        this.onComplete = null; // callback when one-shot animation finishes
        this.time = 0;
    }

    /**
     * Play an animation
     * @param {string} name - Animation name (idle, walk, run, jump, attack)
     * @param {object} options - { duration, onComplete } for one-shot animations
     */
    play(name, options = {}) {
        if (!animations[name]) {
            console.warn(`[Animation] Unknown animation: ${name}`);
            return;
        }

        // Don't restart if already playing this animation (unless it's a one-shot)
        if (this.currentAnimation === name && !options.duration) {
            return;
        }

        this.previousAnimation = this.currentAnimation;
        this.currentAnimation = name;
        this.startTime = this.time;
        this.duration = options.duration ?? null;
        this.onComplete = options.onComplete ?? null;
    }

    /**
     * Stop current animation and return to idle
     */
    stop() {
        this.currentAnimation = 'idle';
        this.duration = null;
        this.onComplete = null;
    }

    /**
     * Update animation (call each frame)
     * @param {number} deltaTime - Time since last frame in seconds
     */
    update(deltaTime) {
        this.time += deltaTime;

        const anim = animations[this.currentAnimation];
        if (!anim) return;

        // Calculate progress for one-shot animations
        let progress = null;
        if (this.duration !== null) {
            const elapsed = this.time - this.startTime;
            progress = Math.min(elapsed / this.duration, 1);

            // Animation complete
            if (progress >= 1) {
                if (this.onComplete) {
                    this.onComplete();
                }
                this.stop();
                return;
            }
        }

        // Run the animation
        anim(this.limbs, this.time, progress);
    }

    /**
     * Get current animation name
     */
    getCurrent() {
        return this.currentAnimation;
    }

    /**
     * Check if playing a specific animation
     */
    isPlaying(name) {
        return this.currentAnimation === name;
    }
}

// Export animation names for reference
export const ANIMATIONS = Object.keys(animations);
