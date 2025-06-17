import * as THREE from 'three';
import { OrbitControls } from 'https://unpkg.com/three@0.160.1/examples/jsm/controls/OrbitControls.js';
import { createPlanetMeshes } from './libs/planets.js';
import { createStarField, rotateStarField } from './libs/background/starfield.js';

// 이벤트 관련 모듈
import { setupKeyboardInput, getNormalizedMouse, setupResizeHandler } from './libs/events.js';

// UI 관련 모듈
import { setupTooltipHandler } from './libs/UI/ui.js';

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
import { loadPlanePrince, planePrince, updatePlanePrinceTravel } from './libs/planePrince.js';
import {updateLandingPrompt} from './libs/landing.js';

// 모델 관련 모듈
import { loadKing, KingObject, updateKingOnPlanet } from './libs/king.js';
import { loadDrunkard, DrunkardObject, updateDrunkardOnPlanet, setDrunkardObjectsVisible } from './libs/drunkard.js';
import { loadBusinessman, BusinessmanObject, updateBusinessmanOnPlanet, setBusinessmanObjectsVisible, handleBusinessmanClick, getBusinessmanTooltipTargets } from './libs/businessman.js';
import { loadLampLighter, LampLighterObject, updateLampLighterOnPlanet, setLampLighterObjectsVisible } from './libs/lamplighter.js';
import { loadGeographer, GeographerObject, updateGeographerOnPlanet, setGeographerObjectsVisible, handleGeographerClick, getGeographerTooltipTargets } from './libs/geographer.js';
import { enterMapMiniGame } from './libs/geographerGame.js';
// 행성 조명 관련 모듈
import { applyPlanetLights, removePlanetLights, updateDynamicLights } from './libs/lights.js';

// 씬 & 카메라 & 렌더러
const scene = new THREE.Scene();
scene.background = new THREE.Color('black');

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 15);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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
let inSpaceTravel = false; // 우주 여행 모드, 초기는 해제

let targetPlanet = null;
let selectedPlanet = null;

let startCamPos = null;
let targetCamPos = null;

let startTarget = null;
let targetTarget = null;

let camMoveFrame = 0;
const camMoveDuration = 60;

let inPlanetView = false;
let autoFollowPrince = false;

// collector
let collectedPlanets = new Set();
let collectedRockets = 0;
const TOTAL_REQUIRED_ROCKETS = 6;
document.getElementById('rocketStatus').style.display = 'block';
updateRocketDisplay();

// 모델 로드
loadLittlePrince(scene);
loadKing(scene);
loadPlanePrince(scene);
loadDrunkard(scene);
loadBusinessman(scene);
loadLampLighter(scene);
loadGeographer(scene);

// 툴팁: hover 시 행성 이름
setupTooltipHandler(raycaster, mouse, camera, tooltip, () =>
  getBusinessmanTooltipTargets(planetMeshes)
);

// 키보드 입력 처리
const keyState = {};
setupKeyboardInput(keyState);

// 리사이징 대응
setupResizeHandler(camera, renderer);

function updateRocketDisplay() {
  const rocketDisplay = document.getElementById('rocketStatus');
  if (rocketDisplay) {
    rocketDisplay.textContent = `🚀 ${collectedRockets}/6`;
    rocketDisplay.style.display = 'block';
  }
}

function collectRocketFromPlanet(planetName) {
  if (collectedPlanets.has(planetName)) return;

  collectedPlanets.add(planetName);
  collectedRockets++;
  updateRocketDisplay();
}

// 행성 클릭 이벤트, 클릭 시 확대 시작
window.addEventListener('click', (event) => {
  if (inPlanetView) return;

  getNormalizedMouse(event, mouse);

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(planetMeshes);

  if (intersects.length > 0) {
    inSpaceTravel = false; // 우주 여행 모드 해제

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
  removePlanetLights(scene);
  if (littlePrince) littlePrince.visible = false;
  if (KingObject) KingObject.visible = false;
  if (DrunkardObject) setDrunkardObjectsVisible(false);
  if (BusinessmanObject) setBusinessmanObjectsVisible(false);
  if (LampLighterObject) setLampLighterObjectsVisible(false);
  if (GeographerObject) setGeographerObjectsVisible(false);

  controls.enabled = true;
  inPlanetView = false;
  selectedPlanet = null;
  backBtn.style.display = 'none';
});

// 별과 사업가 클릭 처리
window.addEventListener('click', (event) => {
  if (!inPlanetView || !selectedPlanet) return;

  handleBusinessmanClick(event, {
    camera,
    collectRocketFromPlanet
  });
});

window.addEventListener('click', e => handleGeographerClick(e, {
  camera,
  startMiniGame: () => enterMapMiniGame(scene, camera) 
}));


// P 키로 우주여행 모드 토글
window.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'p') {
    inSpaceTravel = !inSpaceTravel;
    // 우주여행 진입 시 초기화 필요하면 여기에 추가
  }
});

//----------------------------------------------------
// 애니메이션
function animate(time) {
  requestAnimationFrame(animate);
  updateDynamicLights(time);
  controls.update();

  // 별 회전
  rotateStarField(stars);

  // 우주여행 모드에서 비행기 이동 및 카메라 추적
  if (inSpaceTravel) {
    updatePlanePrinceTravel({ keyState, camera, controls });
  } else {
    // 우주여행 모드가 해제되면 안내문구도 숨김
    updateLandingPrompt(null, null, camera);
    if (planePrince) planePrince.visible = false;
  }

  // 줌인 중일 때 카메라 이동 & 타겟 이동
  if (targetPlanet && camMoveFrame < camMoveDuration) {
    const alpha = camMoveFrame / camMoveDuration;
    camera.position.lerpVectors(startCamPos, targetCamPos, alpha);
    controls.target.lerpVectors(startTarget, targetTarget, alpha);
    camMoveFrame++;

    if (camMoveFrame === camMoveDuration) {
      planetMeshes.forEach(p => p.visible = (p === targetPlanet));
      selectedPlanet = targetPlanet;
      targetPlanet.receiveShadow = true;
      targetPlanet = null;
      inPlanetView = true;
      autoFollowPrince = true; // 왕자 추적 시작

      backBtn.style.display = 'block';

      // 왕자 초기 위치 설정
      if (littlePrince) {
        initPrinceOnPlanet(selectedPlanet, controls, camera);
      }

      updateKingOnPlanet(selectedPlanet, littlePrince);
      updateDrunkardOnPlanet(selectedPlanet, littlePrince);
      updateBusinessmanOnPlanet(selectedPlanet, littlePrince);
      updateLampLighterOnPlanet(selectedPlanet, littlePrince);
      updateGeographerOnPlanet(selectedPlanet, littlePrince);
      applyPlanetLights(scene, selectedPlanet.userData.name);
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