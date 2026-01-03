export function createWalkingAnimation(player, isMoving) {
    const time = Date.now() * 0.005; // Animation speed
    
    if (isMoving) {
        // Bobbing up and down
        const bobAmount = Math.sin(time * 8) * 0.05;
        player.position.y += bobAmount;
        
        // Slight arm swing
        if (player.children.length > 2) {
            const leftArm = player.children[2]; // Left arm
            const rightArm = player.children[3]; // Right arm
            
            if (leftArm && rightArm) {
                leftArm.rotation.x = Math.sin(time * 8) * 0.3;
                rightArm.rotation.x = -Math.sin(time * 8) * 0.3;
            }
        }
        
        // Leg movement
        if (player.children.length > 4) {
            const leftLeg = player.children[4]; // Left leg
            const rightLeg = player.children[5]; // Right leg
            
            if (leftLeg && rightLeg) {
                leftLeg.rotation.x = Math.sin(time * 8) * 0.2;
                rightLeg.rotation.x = -Math.sin(time * 8) * 0.2;
            }
        }
    } else {
        // Reset to idle position
        if (player.children.length > 2) {
            const leftArm = player.children[2];
            const rightArm = player.children[3];
            
            if (leftArm && rightArm) {
                leftArm.rotation.x = 0;
                rightArm.rotation.x = 0;
            }
        }
        
        if (player.children.length > 4) {
            const leftLeg = player.children[4];
            const rightLeg = player.children[5];
            
            if (leftLeg && rightLeg) {
                leftLeg.rotation.x = 0;
                rightLeg.rotation.x = 0;
            }
        }
    }
}
