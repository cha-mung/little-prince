import * as THREE from 'three';
import { planePrince } from './planePrince.js';

// 마지막 텍스트 시퀀스와 지구
const finaleTexts = [
  "드디어 엔진을 모은 어린왕자는 지구로 향합니다...",
  "그는 그곳에서 중요한 무언가를 다시 만나게 될 것입니다.",
  "이제 지구로의 마지막 여행을 시작하세요."
];

export let finaleTriggered = false;
let finaleOverlay = null;
let finaleTextDiv = null;
let finaleIndex = 0;
let finaleFrame = 0;
const finaleDuration = 540; // 프레임 단위
let earth = null;

export function showFinaleSequence({ scene, controls, setInSpaceTravel }) {
  finaleTriggered = true;
  setInSpaceTravel(false); // 제어 막기
  controls.enabled = false;

  // 오버레이 생성
  finaleOverlay = document.createElement('div');
  finaleOverlay.style.position = 'fixed';
  finaleOverlay.style.top = 0;
  finaleOverlay.style.left = 0;
  finaleOverlay.style.width = '100%';
  finaleOverlay.style.height = '100%';
  finaleOverlay.style.backgroundColor = 'rgba(0,0,0,0.8)';
  finaleOverlay.style.color = '#fff';
  finaleOverlay.style.display = 'flex';
  finaleOverlay.style.alignItems = 'center';
  finaleOverlay.style.justifyContent = 'center';
  finaleOverlay.style.fontSize = '2em';
  finaleOverlay.style.fontFamily = 'serif';
  finaleOverlay.style.zIndex = 1000;
  finaleOverlay.style.transition = 'opacity 1s';
  finaleOverlay.style.flexDirection = 'column';
  finaleOverlay.style.textAlign = 'center';
  
  finaleTextDiv = document.createElement('div');
  finaleTextDiv.id = 'finaleText';
  finaleTextDiv.style.transition = 'opacity 0.5s';
  finaleTextDiv.style.opacity = '1';
  finaleTextDiv.textContent = finaleTexts[0];

  finaleOverlay.appendChild(finaleTextDiv);
  document.body.appendChild(finaleOverlay);
}

export function updateFinaleSequence(time, camera, controls, scene, renderer, setInSpaceTravel) {
  finaleFrame++;

  //텍스트 전환
  if (finaleFrame % 180 === 0 && finaleIndex < finaleTexts.length - 1) {
    finaleIndex++;
    finaleTextDiv.style.opacity = '0';
    setTimeout(() => {
      finaleTextDiv.textContent = finaleTexts[finaleIndex];
      finaleTextDiv.style.opacity = '1';
    }, 500);
  }

  // 시퀀스 종료 후 처리
  if (finaleFrame >= finaleDuration) {
    finaleOverlay.style.opacity = '0';
    setTimeout(() => {
      finaleOverlay.remove();
      controls.enabled = false;
      setInSpaceTravel(true);
      if (planePrince) planePrince.visible = true;
    }, 2000);

    // 지구 등장
    const geometry = new THREE.SphereGeometry(12, 24, 24);
    const material = new THREE.MeshPhongMaterial({ color: '#0077be' });
    earth = new THREE.Mesh(geometry, material);
    earth.castShadow = false;
    earth.receiveShadow = false;
    earth.position.set(-70, 10, -50);
    earth.visible = false;
    earth.userData.name = '지구';
    earth.userData.type = 'earth';
    scene.add(earth);

    earth.visible = true;
  }

  renderer.render(scene, camera);
}


// 우주에서 조건 만족하면 자동 트리거
export function checkFinaleTrigger({ collectedRockets, inSpaceTravel, setInSpaceTravel, camera, scene, controls }) {
  if (!finaleTriggered && inSpaceTravel && collectedRockets >= 6) {
    showFinaleSequence({ scene, controls, setInSpaceTravel });
  }
}