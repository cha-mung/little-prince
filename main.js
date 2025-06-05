import * as THREE from 'three';
import { OrbitControls } from 'https://unpkg.com/three@0.160.1/examples/jsm/controls/OrbitControls.js';
import { planets, createPlanetMeshes } from './libs/planets.js';
import { createStarField, rotateStarField } from './libs/background/starfield.js';

// 이벤트 관련 모듈
import { setupKeyboardInput, getNormalizedMouse, setupResizeHandler } from './libs/events.js';

// UI 관련 모듈
import { setupPlanetTooltip } from './libs/UI/ui.js';

// 카메라 모듈
import { updateCameraFollow, rotateCameraByKeys } from './libs/camera.js';

// 왕자 모델 및 애니메이션 관련 모듈
import {
  loadLittlePrince, littlePrince, mixer, princeAction,
  princeTheta, princePhi, princeRadius,
  setPrinceTheta, setPrincePhi, setPrinceRadius,
  updatePrinceAnimation, playPrinceWalk, pausePrinceWalk,
  movePrinceOnPlanet, rotatePrinceY, initPrinceOnPlanet
} from './libs/littlePrince.js';

// 비행기 모델 관련 모듈
import { loadPlanePrince, planePrince } from './libs/planePrince.js';

// 왕 모델 관련 모듈
import { loadKing, KingObject, updateKingOnPlanet } from './libs/king.js';

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
const camMoveDuration = 60;
let inSpaceTravel = false; // 우주 여행 모드, 초기는 해제제

// 모델 로드
loadLittlePrince(scene);
loadKing(scene);
loadPlanePrince(scene);

// 툴팁: hover 시 행성 이름
setupPlanetTooltip(raycaster, mouse, planetMeshes, tooltip, camera);

// 키보드 입력 처리
const keyState = {};
setupKeyboardInput(keyState);

// 리사이징 대응
setupResizeHandler(camera, renderer);

// 행성 클릭 이벤트, 클릭 시 확대 시작
let targetPlanet = null;
let selectedPlanet = null;
let startCamPos = null;
let targetCamPos = null;
let startTarget = null;
let targetTarget = null;
let camMoveFrame = 0;
let inPlanetView = false;
let autoFollowPrince = false;

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
  backBtn.style.display = 'none';
});

// PlanePrince 이동 로직 함수
function updatePlanePrinceMovement() {
  if (!planePrince) return;
  const moveSpeed = 0.5;
  const rotSpeed = 0.01;

  // 전진, 후진, 좌우 이동
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

  // 좌/우 회전
  if (keyState['q']) {
    planePrince.rotateY(rotSpeed);
  }
  if (keyState['e']) {
    planePrince.rotateY(-rotSpeed);
  }
}

// P 키로 우주여행 모드 토글
window.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'p') {
    inSpaceTravel = !inSpaceTravel;
    // 우주여행 진입 시 초기화 필요하면 여기에 추가
  }
});

//----------------------------------------------------
// 애니메이션
function animate() {
  requestAnimationFrame(animate);
  controls.update();

  // 별 회전
  rotateStarField(stars);

  // 우주 여행 모드 (PlanePrince 3인칭 시점)
  if (inSpaceTravel && planePrince) {
    planePrince.visible = true;

    // PlanePrince 이동 로직
    updatePlanePrinceMovement();

    // 카메라가 PlanePrince를 따라가도록 (더 멀리 3인칭)
    const camBack = new THREE.Vector3(-1, 0, -0.5).applyQuaternion(planePrince.quaternion);
    const camUp = new THREE.Vector3(0, 1, 0).applyQuaternion(planePrince.quaternion);
    const camOffset = camBack.clone().multiplyScalar(20).add(camUp.clone().multiplyScalar(1));
    camera.position.copy(planePrince.position.clone().add(camOffset));
    camera.up.copy(camUp);
    controls.target.copy(planePrince.position);
    controls.update();
  } else if (planePrince) {
    planePrince.visible = false;
  }

  // 줌인 중일 때 카메라 이동 & 타겟 이동
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
      autoFollowPrince = true; // 왕자 추적 시작

      backBtn.style.display = 'block';

      // 왕자 초기 위치 설정
      if (littlePrince) {
        initPrinceOnPlanet(selectedPlanet, controls, camera);
      }

      // 왕의 별
      updateKingOnPlanet(selectedPlanet, littlePrince);
    }
  }

  // 행성 위 걷기, WASD 이동 처리
  if (inPlanetView && littlePrince && selectedPlanet) {
    // 이동 방향 계산
    const centerToPrince = new THREE.Vector3().subVectors(littlePrince.position, selectedPlanet.position).normalize();
    const camDir = new THREE.Vector3();
    camera.getWorldDirection(camDir);
    const princeForwardDir = camDir.sub(centerToPrince.clone().multiplyScalar(camDir.dot(centerToPrince))).normalize();

    const moveSpeed = 0.03;
    const forward = camDir.sub(centerToPrince.clone().multiplyScalar(camDir.dot(centerToPrince))).normalize();
    const right = new THREE.Vector3().crossVectors(forward, centerToPrince).normalize();
    const tangentMove = new THREE.Vector3();
    if (keyState['w']) tangentMove.add(forward);
    if (keyState['s']) tangentMove.add(forward.clone().negate());
    if (keyState['a']) tangentMove.add(right.clone().negate());
    if (keyState['d']) tangentMove.add(right);

    if (tangentMove.lengthSq() > 0) {
      autoFollowPrince = true; // 왕자 추적 카메라 활성화
      movePrinceOnPlanet(selectedPlanet, tangentMove, 0.03);
      playPrinceWalk();
    } else {
      pausePrinceWalk();
      autoFollowPrince = false;
    }
    if (autoFollowPrince) { // 왕자 추적 카메라
      const princePos = littlePrince.position.clone();
      const camFollowDir = princeForwardDir.clone();
      const up = new THREE.Vector3().subVectors(littlePrince.position, selectedPlanet.position).normalize();
      updateCameraFollow(camera, controls, princePos, camFollowDir, up);
    } else { // 방향키로 카메라 조절
      rotateCameraByKeys(camera, controls, keyState);
    }
  }
  updatePrinceAnimation(0.016);
  renderer.render(scene, camera);
}
animate();