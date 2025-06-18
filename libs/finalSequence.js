import * as THREE from 'three';
import { planePrince } from './planePrince.js';

// 마지막 텍스트 시퀀스
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
const finaleDuration = 360; // 60fps 기준 6초
let whiteFadeOverlay = null;
let arrivalTextDiv = null;

export function showFinaleSequence({ scene, controls, setInSpaceTravel }) {
  finaleTriggered = true;
  setInSpaceTravel(false); // 제어 막기
  controls.enabled = false;

  // 텍스트 오버레이
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

  // 흰색 페이드용 오버레이
  whiteFadeOverlay = document.createElement('div');
  whiteFadeOverlay.style.position = 'fixed';
  whiteFadeOverlay.style.top = 0;
  whiteFadeOverlay.style.left = 0;
  whiteFadeOverlay.style.width = '100%';
  whiteFadeOverlay.style.height = '100%';
  whiteFadeOverlay.style.backgroundColor = '#ffffff';
  whiteFadeOverlay.style.opacity = '0';
  whiteFadeOverlay.style.transition = 'opacity 2s';
  whiteFadeOverlay.style.zIndex = 2000;
  document.body.appendChild(whiteFadeOverlay);

  // 도착 텍스트
  arrivalTextDiv = document.createElement('div');
  arrivalTextDiv.style.position = 'fixed';
  arrivalTextDiv.style.top = '50%';
  arrivalTextDiv.style.left = '50%';
  arrivalTextDiv.style.transform = 'translate(-50%, -50%)';
  arrivalTextDiv.style.fontSize = '2.5em';
  arrivalTextDiv.style.fontWeight = 'bold';
  arrivalTextDiv.style.color = '#333';
  arrivalTextDiv.style.opacity = '0';
  arrivalTextDiv.style.transition = 'opacity 2s';
  arrivalTextDiv.style.zIndex = 3000;
  arrivalTextDiv.textContent = '지구에 도착했습니다.';
  document.body.appendChild(arrivalTextDiv);
}

export function updateFinaleSequence(time, camera, controls, scene, renderer, setInSpaceTravel) {
  finaleFrame++;

  // 텍스트 전환
  if (finaleFrame % 120 === 0 && finaleIndex < finaleTexts.length - 1) {
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

    // 1초 후 하얀색 페이드인
    setTimeout(() => {
      whiteFadeOverlay.style.opacity = '1';
    }, 1000);

    // 2.5초 후 도착 문구 표시
    setTimeout(() => {
      arrivalTextDiv.style.opacity = '1';
    }, 2500);

    // 5초 후 페이지 이동 (예: 지구 장면으로)
    setTimeout(() => {
      window.location.href = '/earthScene.html'; // 원하는 페이지로 변경 가능
    }, 5000);
  }

  renderer.render(scene, camera);
}

// 우주에서 조건 만족하면 자동 트리거
export function checkFinaleTrigger({ collectedRockets, inSpaceTravel, setInSpaceTravel, camera, scene, controls }) {
  if (!finaleTriggered && inSpaceTravel && collectedRockets >= 6) {
    showFinaleSequence({ scene, controls, setInSpaceTravel });
  }
}
