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
import {
  loadLittlePrince, littlePrince, mixer, princeAction,
  princeTheta, princePhi, princeRadius,
  setPrinceTheta, setPrincePhi, setPrinceRadius,
  updatePrinceAnimation, playPrinceWalk, pausePrinceWalk,
  movePrinceOnPlanet, rotatePrinceY, initPrinceOnPlanet
} from './libs/littlePrince.js';
import { loadKing, KingObject, updateKingOnPlanet} from './libs/king.js';

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

// 왕자/왕 모델 로드
loadLittlePrince(scene);
loadKing(scene);

// 툴팁: hover 시 행성 이름
setupPlanetTooltip(raycaster, mouse, planetMeshes, tooltip, camera);

// 키보드 입력 처리
const keyState = {};
setupKeyboardInput(keyState);

// 행성 클릭 이벤트, 클릭 시 확대 시작
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
  backBtn.style.display = 'none';
});

let autoFollowPrince = false; // 초기엔 카메라 추적 OFF
let wasFollowing = false;  // 이전 상태 기억

//----------------------------------------------------
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
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(littlePrince.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(littlePrince.quaternion);
    const moveDir = new THREE.Vector3();
    if (keyState['w']) moveDir.add(forward);
    if (keyState['s']) moveDir.sub(forward);
    if (keyState['a']) moveDir.sub(right);
    if (keyState['d']) moveDir.add(right);

    if (moveDir.length() > 0) {
      movePrinceOnPlanet(selectedPlanet, moveDir, 0.03);
      playPrinceWalk();
    } else {
      pausePrinceWalk();
    }

    // 카메라가 항상 littlePrince를 따라가도록
    const camBack = new THREE.Vector3(0, 0, 1).applyQuaternion(littlePrince.quaternion);
    const camUp = new THREE.Vector3(0, 1, 0).applyQuaternion(littlePrince.quaternion);
    const camOffset = camBack.clone().multiplyScalar(10).add(camUp.clone().multiplyScalar(2));
    camera.position.copy(littlePrince.position.clone().add(camOffset));
    camera.up.copy(camUp);
    controls.target.copy(littlePrince.position);
    controls.update();
  }

  updatePrinceAnimation(0.016);
  renderer.render(scene, camera);
}
animate();

// 리사이징 대응
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
