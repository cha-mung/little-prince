import * as THREE from 'three';
import { GLTFLoader } from 'https://unpkg.com/three@0.160.1/examples/jsm/loaders/GLTFLoader.js';

// landing 관련 모듈
import { checkLandingAndCollision, updateLandingPrompt } from './landing.js';

export let planePrince = null;

export function loadPlanePrince(scene, onLoaded) {
  const loader = new GLTFLoader();
  loader.load('assets/models/PlanePrince.glb', (gltf) => {
    planePrince = gltf.scene;
    planePrince.scale.set(0.02, 0.02, 0.02);
    planePrince.visible = false;
    scene.add(planePrince);
    if (onLoaded) onLoaded();
  });
}

let velocity = new THREE.Vector3();
let angularVelocity = 0;

// 우주여행 모드 이동 및 카메라 추적
export function updatePlanePrinceTravel({ keyState, camera, controls }) {
  if (!planePrince) return;

  planePrince.visible = true;

  // planet 충돌 및 착륙 안내
  const { nearPlanetPos, nearPlanetName, collided } = checkLandingAndCollision(planePrince, velocity);
  updateLandingPrompt(nearPlanetPos, nearPlanetName, camera);

  // 이동
  const moveSpeed = 0.02;
  const rotSpeed = 0.0015;
  const damping = 0.95;
  const minVelocity = 0.01;
  const angularDamping = 0.95;

  // 가속
  let accel = new THREE.Vector3();
  if (keyState['w']) {
    const forward = new THREE.Vector3(1, 0, 0.8).applyQuaternion(planePrince.quaternion);
    accel.add(forward);
  }
  if (keyState['s']) {
    const backward = new THREE.Vector3(-1, 0, -0.8).applyQuaternion(planePrince.quaternion);
    accel.add(backward);
  }
  if (keyState['arrowup']) {
    accel.y += 1;
  }
  if (keyState['arrowdown']) {
    accel.y -= 1;
  }

  if (accel.lengthSq() > 0) {
    accel.normalize().multiplyScalar(moveSpeed);
    velocity.add(accel);
  }

  // 회전 가속
  if (keyState['a']) {
    angularVelocity += rotSpeed;
  }
  if (keyState['d']) {
    angularVelocity -= rotSpeed;
  }

  // 감쇠
  velocity.multiplyScalar(damping);
  angularVelocity *= angularDamping;

  // 아주 느린 속도/회전은 0으로 처리
  if (velocity.length() < minVelocity) velocity.set(0, 0, 0);
  if (Math.abs(angularVelocity) < 0.001) angularVelocity = 0;

  // 실제 이동/회전
  planePrince.position.add(velocity);
  planePrince.rotateY(angularVelocity);

  // 카메라
  const camBack = new THREE.Vector3(-1, 0, -0.5).applyQuaternion(planePrince.quaternion);
  const camUp = new THREE.Vector3(0, 1, 0).applyQuaternion(planePrince.quaternion);
  const camOffset = camBack.clone().multiplyScalar(5).add(camUp.clone().multiplyScalar(1));
  const baseCamPos = planePrince.position.clone().add(camOffset);

  // 시간 기반으로 부드러운 흔들림 효과
  const t = performance.now() * 0.001;
  const floatStrength = 1.2;
  const floatSpeed = 0.1;

  const floatOffset = new THREE.Vector3(
    Math.sin(t * floatSpeed) * floatStrength,
    Math.sin(t * floatSpeed * 0.7 + 1) * floatStrength * 0.5,
    Math.cos(t * floatSpeed * 0.9 + 2) * floatStrength
  );

  const targetCamPos = baseCamPos.clone().add(floatOffset);

  // 부드럽게 따라가도록 lerp
  if (!updatePlanePrinceTravel._camLerpPos) {
    updatePlanePrinceTravel._camLerpPos = camera.position.clone();
  }
  updatePlanePrinceTravel._camLerpPos.lerp(targetCamPos, 0.15);
  camera.position.copy(updatePlanePrinceTravel._camLerpPos);

  camera.up.copy(camUp);
  controls.target.copy(planePrince.position);
  controls.update();
}