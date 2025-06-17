import * as THREE from 'three';
import { GLTFLoader } from 'https://unpkg.com/three@0.160.1/examples/jsm/loaders/GLTFLoader.js';

export let littlePrince = null;
export let mixer = null;
export let princeAction = null;
export let princeTheta = Math.PI / 2;
export let princePhi = 0;
export let princeRadius = 3;

export function setPrinceTheta(val) { princeTheta = val; }
export function setPrincePhi(val) { princePhi = val; }
export function setPrinceRadius(val) { princeRadius = val; }

export function loadLittlePrince(scene, onLoaded) {
  const loader = new GLTFLoader();
  loader.load('assets/models/LittlePrince.glb', (gltf) => {
    littlePrince = gltf.scene;
    littlePrince.scale.set(3, 2, 4);
    littlePrince.visible = false;
    scene.add(littlePrince);

    mixer = new THREE.AnimationMixer(littlePrince);
    if (gltf.animations && gltf.animations.length > 0) {
      princeAction = mixer.clipAction(gltf.animations[0]);
      princeAction.play();
      princeAction.paused = true;
    }
    if (onLoaded) onLoaded();
  });
}

// 애니메이션 업데이트
export function updatePrinceAnimation(delta = 0.016) {
  if (mixer) mixer.update(delta);
}

// 걷기 애니메이션 재생/정지
export function playPrinceWalk() {
  if (princeAction) princeAction.paused = false;
}
export function pausePrinceWalk() {
  if (princeAction) princeAction.paused = true;
}

// 걷기
export function movePrinceOnPlanet(selectedPlanet, tangentMove, moveSpeed = 0.03) {
  if (!littlePrince || !selectedPlanet) return;

  tangentMove.normalize();

  const moveVec = tangentMove.clone().multiplyScalar(moveSpeed);
  const nextPos = littlePrince.position.clone().add(moveVec);
  const newDir = new THREE.Vector3().subVectors(nextPos, selectedPlanet.position).normalize();
  const radius = selectedPlanet.geometry.parameters.radius + 1;
  littlePrince.position.copy(selectedPlanet.position.clone().addScaledVector(newDir, radius));

  // 회전
  const modelDown = new THREE.Vector3(0, 1, 0);
  const q = new THREE.Quaternion().setFromUnitVectors(modelDown, newDir);
  const lookMat = new THREE.Matrix4();
  lookMat.lookAt(new THREE.Vector3(0, 0, 0), tangentMove, newDir);
  const lookQ = new THREE.Quaternion().setFromRotationMatrix(lookMat);
  littlePrince.setRotationFromQuaternion(lookQ);
}

// 임의 각도만큼 왕자 회전
export function rotatePrinceY(angle) {
  if (littlePrince) littlePrince.rotateY(angle);
}

// 행성 위 왕자 초기화, 초기 위치 설정
export function initPrinceOnPlanet(selectedPlanet, controls, camera) {
  if (!selectedPlanet || !littlePrince) return;

  const r = selectedPlanet.geometry.parameters.radius;
  setPrinceRadius(r + 3);
  setPrinceTheta(2*Math.PI);
  setPrincePhi(0);

  const x = princeRadius * Math.sin(princeTheta) * Math.cos(princePhi);
  const y = princeRadius * Math.cos(princeTheta);
  const z = princeRadius * Math.sin(princeTheta) * Math.sin(princePhi);

  const pos = new THREE.Vector3(
    selectedPlanet.position.x + x,
    selectedPlanet.position.y + y,
    selectedPlanet.position.z + z
  );
  const dir = new THREE.Vector3().subVectors(selectedPlanet.position, pos).normalize();
  const radius = selectedPlanet.geometry.parameters.radius;
  const offset = 1; // 왕자와 행성 사이의 거리 오프셋

  littlePrince.position.copy(
    new THREE.Vector3().copy(selectedPlanet.position).addScaledVector(dir.negate(), radius + offset)
  );

  // 왕자의 Z− 축을 행성 중심으로 향하게 회전
  const modelZMinus = new THREE.Vector3(0, 1, 0);
  const q = new THREE.Quaternion().setFromUnitVectors(modelZMinus, dir);
  littlePrince.setRotationFromQuaternion(q);

  littlePrince.visible = true;
  controls.autoRotate = false;

  const camBack = new THREE.Vector3(0, 0, 1).applyQuaternion(littlePrince.quaternion);
  const camUp = new THREE.Vector3(0, 1, 0).applyQuaternion(littlePrince.quaternion);
  const camOffset = camBack.clone().multiplyScalar(10).add(camUp.clone().multiplyScalar(2));

  camera.position.copy(littlePrince.position.clone().add(camOffset));
  camera.up.copy(camUp);
  controls.target.copy(littlePrince.position);
  controls.update();
}