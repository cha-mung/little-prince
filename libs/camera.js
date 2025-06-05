import * as THREE from 'three';

export function updateCameraFollow(camera, controls, targetPosition, followDir, upDir) {
  const camOffset = followDir.clone().negate().multiplyScalar(10).add(upDir.clone().multiplyScalar(2));
  const targetCamPos = targetPosition.clone().add(camOffset);

  camera.position.lerp(targetCamPos, 0.1);
  camera.up.copy(upDir);
  controls.target.copy(targetPosition);
  controls.update();
}

export function rotateCameraByKeys(camera, controls, keyState) {
  const rotateSpeed = 0.02;

  if (keyState['arrowleft'] || keyState['arrowright']) {
    const angle = keyState['arrowleft'] ? rotateSpeed : -rotateSpeed;
    const axis = camera.up.clone().normalize();
    camera.position.sub(controls.target);
    camera.position.applyAxisAngle(axis, angle);
    camera.position.add(controls.target);
  }

  if (keyState['arrowup'] || keyState['arrowdown']) {
    const dir = new THREE.Vector3().subVectors(camera.position, controls.target).normalize();
    const right = new THREE.Vector3().crossVectors(dir, camera.up).normalize();
    const angle = keyState['arrowup'] ? rotateSpeed : -rotateSpeed;
    camera.position.sub(controls.target);
    camera.position.applyAxisAngle(right, angle);
    camera.position.add(controls.target);
    camera.up.applyAxisAngle(right, angle);
  }

  camera.lookAt(controls.target);
}
