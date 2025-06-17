import * as THREE from 'three';

// constant world-up vector
const WORLD_UP = new THREE.Vector3(0, 1, 0);

export function updateCameraFollow(camera, controls, targetPosition, followDir, upDir) {
  // build an offset that always uses world-up for the “lift”
  const camOffset = followDir.clone().negate().multiplyScalar(10)
                    .add(WORLD_UP.clone().multiplyScalar(2));
  const targetCamPos = targetPosition.clone().add(camOffset);

  // smoothly move into place
  camera.position.lerp(targetCamPos, 0.1);
  // lock up vector to world Y
  camera.up.copy(WORLD_UP);

  controls.target.copy(targetPosition);
  controls.update();
}

export function rotateCameraByKeys(camera, controls, keyState) {
  const rotateSpeed = 0.02;
  const target = controls.target;

  // always enforce world-up before any rotation
  camera.up.copy(WORLD_UP);

  // Y-axis (left/right)
  if (keyState['arrowleft'] || keyState['arrowright']) {
    const angle = keyState['arrowleft'] ? rotateSpeed : -rotateSpeed;
    camera.position.sub(target);
    camera.position.applyAxisAngle(WORLD_UP, angle);
    camera.position.add(target);
  }

  // tilt (up/down) around camera’s right, but keep up fixed
  if (keyState['arrowup'] || keyState['arrowdown']) {
    const dir   = camera.position.clone().sub(target).normalize();
    const right = new THREE.Vector3().crossVectors(dir, WORLD_UP).normalize();
    const angle = keyState['arrowup'] ? rotateSpeed : -rotateSpeed;

    camera.position.sub(target);
    camera.position.applyAxisAngle(right, angle);
    camera.position.add(target);

    // do NOT rotate camera.up here—keep it at WORLD_UP
  }

  camera.lookAt(target);
}
