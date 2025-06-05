import * as THREE from 'three';
import { OrbitControls } from 'https://unpkg.com/three@0.160.1/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.160.1/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'https://unpkg.com/three@0.160.1/examples/jsm/loaders/FBXLoader.js';
import { planets, createPlanetMeshes } from './libs/planets.js';
import { createStarField, rotateStarField } from './libs/background/starfield.js';

// 이벤트 관련 모듈
import { setupKeyboardInput, getNormalizedMouse } from './libs/events.js';

// UI 관련 모듈
import { setupPlanetTooltip } from './libs/UI/ui.js';

// 왕자 모델 및 애니메이션 관련 모듈
import { loadLittlePrince, littlePrince, mixer, princeAction, princeTheta, princePhi, princeRadius, 
  setPrinceTheta, setPrincePhi, setPrinceRadius} from './libs/littlePrince.js';
import { loadKing, KingObject } from './libs/king.js';

// 씬 & 카메라 & 렌더러
const scene = new THREE.Scene();
scene.background = new THREE.Color('black');

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 15);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 조명
scene.add(new THREE.AmbientLight(0xffffff, 0.5));
const light = new THREE.PointLight(0xffffff, 2);
light.position.set(0, 20, 20);
scene.add(light);

// 컨트롤
const controls = new OrbitControls(camera, renderer.domElement);
controls.autoRotate = true;
controls.autoRotateSpeed = 0.5;
controls.target.set(0, 0, 0);
controls.update();

// 별 배경
const stars = createStarField(scene);

// 행성 생성
const planetMeshes = createPlanetMeshes(scene);

// 요소 참조
const dialog = document.getElementById('dialog');
const tooltip = document.getElementById('tooltip');
const backBtn = document.getElementById('backBtn');

// 상태 변수
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const camMoveDuration = 60; // 카메라 이동 프레임 수

// 왕자 모델 로드
loadLittlePrince(scene);

// 왕의 별 모델 로드 (FBX)
loadKing(scene);

// 툴팁: hover 시 행성 이름
setupPlanetTooltip(raycaster, mouse, planetMeshes, tooltip, camera);

// 키보드 입력 처리
const keyState = {};
setupKeyboardInput(keyState);

// 클릭 시 확대 시작
let targetPlanet = null;
let selectedPlanet = null;
let startCamPos = null;
let targetCamPos = null;
let startTarget = null;
let targetTarget = null;
let camMoveFrame = 0;
let inPlanetView = false;

window.addEventListener('click', (event) => {
  if (inPlanetView) return;

  getNormalizedMouse(event, mouse);

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(planetMeshes);

  if (intersects.length > 0) {
    const planet = intersects[0].object;
    targetPlanet = planet;

    dialog.textContent = `${planet.userData.name}: "${planet.userData.quote}"`;
    dialog.style.display = 'block';
    setTimeout(() => dialog.style.display = 'none', 5000);

    const r = planet.geometry.parameters.radius;
    const offset = new THREE.Vector3(0, r * 1.5, r * 2.5);
    startCamPos = camera.position.clone();
    targetCamPos = planet.position.clone().add(offset);

    startTarget = controls.target.clone();
    targetTarget = planet.position.clone();

    camMoveFrame = 0;
  }
});

// 돌아가기 버튼
backBtn.addEventListener('click', () => {
  planetMeshes.forEach(p => p.visible = true);
  camera.position.set(0, 5, 15);
  camera.up.set(0, 1, 0); 
  controls.target.set(0, 0, 0);
  controls.update();
  if (littlePrince) littlePrince.visible = false;
  if (KingObject) KingObject.visible = false;

  controls.enabled = true;
  inPlanetView = false;
  selectedPlanet = null;
  autoFollowPrince = false; // 왕자 추적 중지
  backBtn.style.display = 'none';
});

let autoFollowPrince = false; // 초기엔 카메라 추적 OFF
let wasFollowing = false;  // 이전 상태 기억

// 애니메이션
function animate() {
  requestAnimationFrame(animate);
  controls.update();

  // 별 회전
  rotateStarField(stars);

  // 줌인 중일 때 카메라 이동 & 타겟 이동
  if (targetPlanet && camMoveFrame < camMoveDuration) {
    const alpha = camMoveFrame / camMoveDuration;
    camera.position.lerpVectors(startCamPos, targetCamPos, alpha);
    controls.target.lerpVectors(startTarget, targetTarget, alpha);
    camMoveFrame++;

    if (camMoveFrame === camMoveDuration) {
      planetMeshes.forEach(p => p.visible = (p === targetPlanet));
      selectedPlanet = targetPlanet;
      targetPlanet = null;
      inPlanetView = true;
      autoFollowPrince = false; // 왕자 추적 시작

      backBtn.style.display = 'block';

      // 왕자 초기 위치 설정
      if (littlePrince) {
        const r = selectedPlanet.geometry.parameters.radius;
        setPrinceRadius(r + 3);
        setPrinceTheta(Math.PI / 2);
        setPrincePhi(0);

        const x = princeRadius * Math.sin(princeTheta) * Math.cos(princePhi);
        const y = princeRadius * Math.cos(princeTheta);
        const z = princeRadius * Math.sin(princeTheta) * Math.sin(princePhi);

        const pos = new THREE.Vector3(
          selectedPlanet.position.x + x,
          selectedPlanet.position.y + y,
          selectedPlanet.position.z + z
        );
        const dir = new THREE.Vector3().subVectors(selectedPlanet.position, pos).normalize(); // 행성 중심 → 왕자
        const radius = selectedPlanet.geometry.parameters.radius;
        const offset = 1;

        littlePrince.position.copy(
          new THREE.Vector3().copy(selectedPlanet.position).addScaledVector(dir.negate(), radius + offset)
        );

        // 왕자의 Z− 축을 행성 중심으로 향하게 회전
        const modelZMinus = new THREE.Vector3(0, 1, 0); // 왕자 모델의 발 방향
        const q = new THREE.Quaternion().setFromUnitVectors(modelZMinus, dir);
        littlePrince.setRotationFromQuaternion(q);

        littlePrince.visible = true;
        controls.autoRotate = false;
        autoFollowPrince = false;
        const camBack = new THREE.Vector3(0, 0, 1).applyQuaternion(littlePrince.quaternion);
        const camUp = new THREE.Vector3(0, 1, 0).applyQuaternion(littlePrince.quaternion);
        const camOffset = camBack.clone().multiplyScalar(10).add(camUp.clone().multiplyScalar(2));

        camera.position.copy(littlePrince.position.clone().add(camOffset));
        camera.up.copy(camUp);
        controls.target.copy(littlePrince.position);  // 마우스 회전 중심
        controls.update();
      }
      if (KingObject) {
        if (selectedPlanet.userData.name === '왕의 별') {
          const planetCenter = selectedPlanet.position.clone();
          const princePos = littlePrince.position.clone();
          // 왕의 위치: 왕자 앞쪽 (구면 위 접선 방향으로)
          const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(littlePrince.quaternion);
          const offset = forward.clone().multiplyScalar(4.0);
          const kingPos = princePos.clone().add(offset);
          KingObject.position.copy(kingPos);

          // 👉 왕의 '아래 방향'을 행성 중심으로 향하게
          const toCenter = new THREE.Vector3().subVectors(planetCenter, kingPos).normalize();
          const modelDown = new THREE.Vector3(0, -1, 0); // FBX 모델의 아래 방향 기준
          const q = new THREE.Quaternion().setFromUnitVectors(modelDown, toCenter);
          KingObject.setRotationFromQuaternion(q);
          KingObject.rotateY(Math.PI + THREE.MathUtils.degToRad(30)); // 15도 덧붙여 조정
          KingObject.visible = true;
        } else {
          KingObject.visible = false;
        }
      }

    }
  }
  // WASD 이동 처리 (행성 위 걷기)
  if (inPlanetView && littlePrince && selectedPlanet) {
    const moveSpeed = 0.03;

    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(littlePrince.quaternion); // 정면
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(littlePrince.quaternion);   // 오른쪽
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(littlePrince.quaternion);      // 위쪽

    // 왕자의 접선 방향 이동 벡터
    const moveDir = new THREE.Vector3();

    if (keyState['w']) moveDir.add(forward);
    if (keyState['s']) moveDir.sub(forward);
    if (keyState['a']) moveDir.sub(right);
    if (keyState['d']) moveDir.add(right);

    if (moveDir.length() > 0) {
      moveDir.normalize();

      // 현재 왕자 위치 → 행성 중심 벡터
      const centerToPrince = new THREE.Vector3().subVectors(littlePrince.position, selectedPlanet.position).normalize();
      const tangentMove = moveDir.clone().sub(centerToPrince.clone().multiplyScalar(moveDir.dot(centerToPrince))).normalize();

      // 반지름 유지하면서 이동
      const nextPos = littlePrince.position.clone().add(tangentMove.multiplyScalar(moveSpeed));
      const newDir = new THREE.Vector3().subVectors(nextPos, selectedPlanet.position).normalize();

      const radius = selectedPlanet.geometry.parameters.radius + 1;
      littlePrince.position.copy(
        selectedPlanet.position.clone().addScaledVector(newDir, radius)
      );

      // 왕자 회전: Y-가 행성 중심 향하게
      const modelDown = new THREE.Vector3(0, 1, 0);
      const q = new THREE.Quaternion().setFromUnitVectors(modelDown, newDir);
      littlePrince.setRotationFromQuaternion(q);

      const anyKeyPressed = keyState['w'] || keyState['a'] || keyState['s'] || keyState['d'];
      if (anyKeyPressed) {
        autoFollowPrince = true; // 키가 눌렸을 때 왕자 추적 시작
        wasFollowing = true;
      }
      if (princeAction && anyKeyPressed && !princeAction.isRunning()) {
            princeAction.reset();      // 처음부터 재생
            princeAction.play();       // 실행
          }
    } else {
      // 아무 키도 안 눌렀을 때 애니메이션 정지
      if (princeAction && princeAction.isRunning()) {
        princeAction.stop();
        autoFollowPrince = false;
        if (wasFollowing) {
          controls.target.copy(littlePrince.position); // 이전 시점 고정
          controls.update();
          wasFollowing = false;
        }
      }
    }
    if (autoFollowPrince) {
      const princePos = littlePrince.position.clone();

      const camBack = new THREE.Vector3(0, 0, 1).applyQuaternion(littlePrince.quaternion);
      const camUp = new THREE.Vector3(0, 1, 0).applyQuaternion(littlePrince.quaternion);

      const camOffset = camBack.multiplyScalar(10).add(camUp.multiplyScalar(2));
      const targetCamPos = princePos.clone().add(camOffset);

      camera.position.lerp(targetCamPos, 0.1);  // 부드럽게 이동
      camera.up.copy(camUp);                   // up 벡터를 항상 왕자 기준으로 고정
      controls.target.copy(princePos);
      controls.update();
    } else {
      const rotateSpeed = 0.02;
      if (keyState['arrowleft'] || keyState['arrowright']) {
        const angle = keyState['arrowleft'] ? rotateSpeed : -rotateSpeed;
        const axis = camera.up.clone().normalize();
        camera.position.sub(controls.target); // 중심 기준 벡터로 변환
        camera.position.applyAxisAngle(axis, angle);
        camera.position.add(controls.target); // 다시 되돌림
      }

      if (keyState['arrowup'] || keyState['arrowdown']) {
        const dir = new THREE.Vector3().subVectors(camera.position, controls.target).normalize();
        const right = new THREE.Vector3().crossVectors(dir, camera.up).normalize();
        const angle = keyState['arrowup'] ? rotateSpeed : -rotateSpeed;
        camera.position.sub(controls.target);
        camera.position.applyAxisAngle(right, angle);
        camera.position.add(controls.target);
        camera.up.applyAxisAngle(right, angle); // up 벡터도 함께 회전
      }
      camera.lookAt(controls.target);
    }
  }
  if (mixer) mixer.update(0.016);  // 약 60fps 기준
  renderer.render(scene, camera);
}
animate();

// 리사이징 대응
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
