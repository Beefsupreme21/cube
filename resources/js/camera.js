import * as THREE from 'three';

export function setupCamera(container) {
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 8, 10);
    return camera;
}

export function updateCamera(camera, playerState, playerMesh) {
    const cameraOffset = new THREE.Vector3(0, 3, -5);
    const cameraTarget = playerState.position.clone();
    const offset = cameraOffset.clone();
    
    // Rotate offset based on character rotation
    offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), playerState.rotation);
    
    const desiredCameraPos = cameraTarget.add(offset);
    
    // Smooth camera follow (lerp)
    camera.position.lerp(desiredCameraPos, 0.1);
    camera.lookAt(playerMesh.position);
}
