import * as THREE from 'three';
import { GLTFLoader } from 'https://unpkg.com/three@0.160.1/examples/jsm/loaders/GLTFLoader.js';

export let planePrince = null;

export function loadPlanePrince(scene, onLoaded) {
  const loader = new GLTFLoader();
  loader.load('assets/models/PlanePrince.glb', (gltf) => {
    planePrince = gltf.scene;
    planePrince.scale.set(0.08, 0.08, 0.08);
    planePrince.visible = false;
    scene.add(planePrince);
    if (onLoaded) onLoaded();
  });
}

// 우주여행 모드 이동 및 카메라 추적
export function updatePlanePrinceTravel({ keyState, camera, controls }) {
  if (!planePrince) return;

  planePrince.visible = true;

  // 이동 로직
  const moveSpeed = 0.5;
  const rotSpeed = 0.01;

  if (keyState['w']) {
    const right = new THREE.Vector3(1, 0, 0.8).applyQuaternion(planePrince.quaternion);
    planePrince.position.add(right.multiplyScalar(moveSpeed));
  }
  if (keyState['s']) {
    const left = new THREE.Vector3(-1, 0, -0.8).applyQuaternion(planePrince.quaternion);
    planePrince.position.add(left.multiplyScalar(moveSpeed));
  }
  if (keyState['a']) {
    const forward = new THREE.Vector3(0.8, 0, -1).applyQuaternion(planePrince.quaternion);
    planePrince.position.add(forward.multiplyScalar(moveSpeed));
  }
  if (keyState['d']) {
    const backward = new THREE.Vector3(-0.8, 0, 1).applyQuaternion(planePrince.quaternion);
    planePrince.position.add(backward.multiplyScalar(moveSpeed));
  }

  if (keyState['q']) {
    planePrince.rotateY(rotSpeed);
  }
  if (keyState['e']) {
    planePrince.rotateY(-rotSpeed);
  }

  // 카메라 추적
  const camBack = new THREE.Vector3(-1, 0, -0.5).applyQuaternion(planePrince.quaternion);
  const camUp = new THREE.Vector3(0, 1, 0).applyQuaternion(planePrince.quaternion);
  const camOffset = camBack.clone().multiplyScalar(20).add(camUp.clone().multiplyScalar(1));
  camera.position.copy(planePrince.position.clone().add(camOffset));
  camera.up.copy(camUp);
  controls.target.copy(planePrince.position);
  controls.update();
}