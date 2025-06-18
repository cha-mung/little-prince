// planet.js와 THREE.js를 사용하여 착륙 안내 및 충돌 체크 기능 구현
import { planets } from './planets.js';
import * as THREE from 'three';

// 착륙 안내 DOM 생성 및 관리
let landingPrompt = null;
function showLandingPrompt(planetPos, planetName, camera) {
  if (!landingPrompt) {
    landingPrompt = document.createElement('div');
    landingPrompt.style.position = 'absolute';
    landingPrompt.style.padding = '8px 16px';
    landingPrompt.style.background = 'rgba(0,0,0,0.7)';
    landingPrompt.style.color = '#fff';
    landingPrompt.style.borderRadius = '10px';
    landingPrompt.style.fontSize = '18px';
    landingPrompt.style.pointerEvents = 'none';
    landingPrompt.style.whiteSpace = 'nowrap'; 

    document.body.appendChild(landingPrompt);
  }

  // 함수 호출 될 때마다 행성 이름 갱신
  landingPrompt.innerText = `"${planetName}"에 착륙하시겠습니까?`;

  // 3D → 2D 변환
  const vector = planetPos.clone().project(camera);
  const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
  const y = (-vector.y * 0.5 + 0.5) * window.innerHeight;
  landingPrompt.style.left = `${x}px`;
  landingPrompt.style.top = `${y - 40}px`;
  landingPrompt.style.display = 'block';
}
function hideLandingPrompt() {
  if (landingPrompt) landingPrompt.style.display = 'none';
}

// 충돌 및 착륙 안내 체크
export function checkLandingAndCollision(planePrince, velocity) {
  let nearPlanetPos = null;
  let nearPlanetName = null;
  let minDist = Infinity;
  let collided = false;

  for (const planet of planets) {
    const planetPos = new THREE.Vector3(...planet.position);
    const dist = planePrince.position.distanceTo(planetPos);
    const planetRadius = planet.size;

    if (dist < planetRadius + 15 && dist < minDist) {
      nearPlanetPos = planetPos;
      nearPlanetName = planet.name;
      minDist = dist;
    }

    // 충돌 방지: plane이 planet 반지름 + 3보다 가까워지면 부드러운 반발력 적용
    if (dist < planetRadius + 3) {
      const dir = planePrince.position.clone().sub(planetPos).normalize();

      // 표면에서 살짝 밀어내기 (lerp로 부드럽게)
      const targetPos = planetPos.clone().add(dir.multiplyScalar(planetRadius + 3));
      planePrince.position.lerp(targetPos, 0.01); // 부드러운 정도 수치

      // velocity가 planet 쪽으로 향하면, planet에서 멀어지는 방향으로 부드럽게 보정
      if (velocity.dot(dir) < 0) {
        velocity.lerp(dir.multiplyScalar(velocity.length() * 0.1 + 0.05), 0.2);
      }
      collided = true;
    }
  }
  return { nearPlanetPos, nearPlanetName, collided };
}

export function updateLandingPrompt(nearPlanetPos, nearPlanetName, camera) {
  if (nearPlanetPos && nearPlanetName) {
    showLandingPrompt(nearPlanetPos, nearPlanetName, camera);
  } else {
    hideLandingPrompt();
  }
}