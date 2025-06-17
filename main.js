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
import { loadKing, KingObject, MouseObject, updateKingOnPlanet, setKingObjectsVisible, handlekingClick } from './libs/king.js';
import { loadDrunkard, DrunkardObject, updateDrunkardOnPlanet, setDrunkardObjectsVisible, handleDrunkardClick } from './libs/drunkard.js';
import { loadBusinessman, BusinessmanObject, star, updateBusinessmanOnPlanet, setBusinessmanObjectsVisible, handleBusinessmanClick } from './libs/businessman.js';
import { loadLampLighter, LampLighterObject, updateLampLighterOnPlanet, setLampLighterObjectsVisible, handleLampLighterClick } from './libs/lamplighter.js';
import { loadGeographer, GeographerObject, updateGeographerOnPlanet, setGeographerObjectsVisible, handleGeographerClick } from './libs/geographer.js';

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

// 도입부 텍스트 및 인트로 설정 변수
const introTexts = [
  "옛날 옛적 아주 작은 별이 있었습니다.",
  "그 별에는 어린왕자가 살고 있었죠.",
  "지금, 그 별들을 향한 여행이 시작됩니다."
];
let currentIntroIndex = 0;
let introTextTimer = 0;

// 도입부 오버레이
const introOverlay = document.createElement('div');
introOverlay.style.position = 'fixed';
introOverlay.style.top = 0;
introOverlay.style.left = 0;
introOverlay.style.width = '100%';
introOverlay.style.height = '100%';
introOverlay.style.backgroundColor = 'rgba(0,0,0,0.7)';
introOverlay.style.color = '#fff';
introOverlay.style.display = 'flex';
introOverlay.style.alignItems = 'center';
introOverlay.style.justifyContent = 'center';
introOverlay.style.fontSize = '2em';
introOverlay.style.fontFamily = 'serif';
introOverlay.style.zIndex = 1000;
introOverlay.style.transition = 'opacity 1s';
introOverlay.innerHTML = `<div id="introText" style="
  transition: opacity 0.5s;
  opacity: 1;
">${introTexts[0]}</div>`;
introOverlay.style.flexDirection = 'column';
introOverlay.style.textAlign = 'center';
document.body.appendChild(introOverlay);

// 스킵버튼
const skipButton = document.createElement('button');
skipButton.textContent = '건너뛰기';
skipButton.style.position = 'absolute';
skipButton.style.bottom = '40px';
skipButton.style.right = '40px';
skipButton.style.padding = '10px 20px';
skipButton.style.fontSize = '16px';
skipButton.style.border = 'none';
skipButton.style.borderRadius = '8px';
skipButton.style.backgroundColor = 'rgba(255,255,255,0.8)';
skipButton.style.color = '#000';
skipButton.style.cursor = 'pointer';
skipButton.style.zIndex = '1001';
skipButton.style.boxShadow = '0 0 10px rgba(0,0,0,0.3)';
document.body.appendChild(skipButton);

function skipIntro() {
  introPlaying = false;
  introOverlay.remove();
  skipButton.remove();
  inSpaceTravel = true;
}

skipButton.addEventListener('click', skipIntro);


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
let inSpaceTravel = true; // 우주 여행 모드, 초기는 해제
let introPlaying = true;
let introFrame = 0;
const introDuration = 360; // 6초 (60fps 기준)

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

function getTooltipTargets(planetMeshes) {
  const planetTargets = planetMeshes
    .filter(p => p.visible)
    .map(p => ({ object: p, label: p.userData.name }));

  const extraTargets = [];
  if (BusinessmanObject) {
    extraTargets.push({ object: BusinessmanObject, label: '대화하기' });
  }
  if (star) {
    extraTargets.push({ object: star, label: '줍기' });
  }
  if (DrunkardObject) {
    extraTargets.push({ object: DrunkardObject, label: '대화하기' });
  }
  if (KingObject) {
    extraTargets.push({ object: KingObject, label: '대화하기' });
  }
  if (MouseObject) {
    extraTargets.push({ object: MouseObject, label: '사형선고하기' });
  }

  return [...extraTargets, ...planetTargets];
}

// 툴팁: hover 시 행성 이름
setupTooltipHandler(raycaster, mouse, camera, tooltip, () =>
  getTooltipTargets(planetMeshes)
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
  if (KingObject) setKingObjectsVisible(false);
  if (DrunkardObject) setDrunkardObjectsVisible(false);
  if (BusinessmanObject) setBusinessmanObjectsVisible(false);
  if (LampLighterObject) setLampLighterObjectsVisible(false);
  if (GeographerObject) setGeographerObjectsVisible(false);

  controls.enabled = true;
  inPlanetView = false;
  selectedPlanet = null;
  inSpaceTravel = true;
  backBtn.style.display = 'none';
});

// 별과 사업가 클릭 처리
window.addEventListener('click', (event) => {
  if (!inPlanetView || !selectedPlanet) return;

  handleBusinessmanClick(event, {
    camera,
    collectRocketFromPlanet
  });
  handleDrunkardClick(event, {
    camera,
    collectRocketFromPlanet
  });
  handlekingClick(event, {
    camera,
    collectRocketFromPlanet
  });
  handleGeographerClick(event, {
    camera,
    scene,
    collectRocketFromPlanet
  }),
    handleLampLighterClick(event, {
    camera,
    scene,
    collectRocketFromPlanet
  })
});

// // P 키로 우주여행 모드 토글
// window.addEventListener('keydown', (e) => {
//   if (e.key.toLowerCase() === 'p') {
//     inSpaceTravel = !inSpaceTravel;
//     // 우주여행 진입 시 초기화 필요하면 여기에 추가
//   }
// });

//----------------------------------------------------
// 애니메이션
function animate(time) {
  requestAnimationFrame(animate);
  if (introPlaying) {
    introFrame++;

    // 카메라 회전
    const radius = 200;
    const angle = (introFrame / introDuration) * Math.PI * 2;
    camera.position.x = radius * Math.cos(angle);
    camera.position.z = radius * Math.sin(angle);
    camera.lookAt(0, 0, 0);

    // 텍스트 교체 타이밍 (2초마다)
    if (introFrame % 120 === 0 && currentIntroIndex < introTexts.length - 1) {
      currentIntroIndex++;
      const introTextDiv = document.getElementById('introText');
      introTextDiv.style.opacity = '0';

      setTimeout(() => {
        introTextDiv.textContent = introTexts[currentIntroIndex];
        introTextDiv.style.opacity = '1';
      }, 500); // 페이드 간격
    }

    // 마지막 프레임에서 오버레이 제거
    if (introFrame === introDuration) {
      introOverlay.style.opacity = '0';
      setTimeout(() => {
        introOverlay.remove();
        skipButton.remove();
        introPlaying = false;
        inSpaceTravel = true;
      }, 3000);
    }

    renderer.render(scene, camera);
    return;
  }

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

      updateKingOnPlanet(selectedPlanet, littlePrince, scene);
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

    const moveSpeed = 0.08;
    const forward = camDir.sub(centerToPrince.clone().multiplyScalar(camDir.dot(centerToPrince))).normalize();
    const right = new THREE.Vector3().crossVectors(forward, centerToPrince).normalize();
    const tangentMove = new THREE.Vector3();
    if (keyState['w']) tangentMove.add(forward);
    if (keyState['s']) tangentMove.add(forward.clone().negate());
    if (keyState['a']) tangentMove.add(right.clone().negate());
    if (keyState['d']) tangentMove.add(right);

    if (tangentMove.lengthSq() > 0) {
      autoFollowPrince = true; // 왕자 추적 카메라 활성화
      movePrinceOnPlanet(selectedPlanet, tangentMove, moveSpeed);
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