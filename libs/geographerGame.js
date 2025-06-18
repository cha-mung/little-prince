import * as THREE from 'three';
import { setGeographerObjectsVisible } from './geographer.js';

let mapPlane, lensSprite, roseSprite;
let raycaster, mouse, onMapMouseMove, onMapClick;
const lensOffset = new THREE.Vector3(-0.2, 0.5, 0);

/** 미니맵 진입 */
export function enterMapMiniGame(scene, camera, onComplete) {
  setGeographerObjectsVisible(false);

  // 1) 지도 Plane
  const mapTexture = new THREE.TextureLoader().load('assets/textures/geographer_map.png');
  mapPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 4.5),
    new THREE.MeshBasicMaterial({ map: mapTexture, side: THREE.DoubleSide })
  );
  mapPlane.position.set(0, 0, -5);
  camera.add(mapPlane);

  // 2) 렌즈 Sprite
  const lensTexture = new THREE.TextureLoader().load('assets/textures/lens.png');
  lensSprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: lensTexture,
    transparent: true,
    alphaTest: 0.5,
    depthTest: false
  }));
  lensSprite.renderOrder = 999;
  lensSprite.scale.set(3, 3, 3);
  lensSprite.position.set(0, 0, -4.9);
  camera.add(lensSprite);

  // 3) 장미 Sprite (hover만 표시, click은 UV로 판정)
  const roseTexture = new THREE.TextureLoader().load('assets/textures/rose.png');
  roseSprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: roseTexture,
    transparent: true,
    alphaTest: 0.5,
    depthTest: false
  }));
  roseSprite.renderOrder = 998;
  roseSprite.scale.set(1, 1, 1);
  roseSprite.visible = false;
  camera.add(roseSprite);

  // 4) Raycaster / Mouse
  raycaster = new THREE.Raycaster();
  mouse     = new THREE.Vector2();

  // 5) 렌즈 이동 & hover: world to local 변환
  onMapMouseMove = event => {
    event.stopImmediatePropagation();
    event.preventDefault();

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObject(mapPlane);
    if (!hits.length) {
      roseSprite.visible = false;
      return;
    }

    const worldPt = hits[0].point;
    const localPt = camera.worldToLocal(worldPt.clone());
    
    const adjustedPt = localPt.clone().sub(lensOffset);
    lensSprite.position.copy(adjustedPt);

    // hover 시 roseSprite 표시
    const uv = hits[0].uv;
    if (uv.x > 0.65 && uv.x < 0.75 && uv.y > 0.25 && uv.y < 0.35) {
      roseSprite.visible = true;
      roseSprite.position.copy(localPt);
    } else {
      roseSprite.visible = false;
    }
  };

  // 6) 장미 클릭 시 발견
  onMapClick = event => {
    event.stopImmediatePropagation();
    event.preventDefault();

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObject(mapPlane);
    if (!hits.length) return;

    const uv = hits[0].uv;
    if (uv.x > 0.65 && uv.x < 0.75 && uv.y > 0.25 && uv.y < 0.35) {
      const dialog = document.getElementById('dialog');
      if (dialog) {
        dialog.textContent = '🌹 장미를 발견했어요!';
        dialog.style.display = 'block';

        setTimeout(() => {
          dialog.style.display = 'none';
          exitMapMiniGame(scene, camera);
          if (onComplete) {
            onComplete();
          }
        }, 2000);
      } else {
        exitMapMiniGame(scene, camera);
        if (onComplete) {
          onComplete();
        }
      }
    }

  };

  window.addEventListener('mousemove', onMapMouseMove);
  window.addEventListener('click',     onMapClick);

  scene.add(camera);
}

/** 미니맵 종료 */
export function exitMapMiniGame(scene, camera) {
  window.removeEventListener('mousemove', onMapMouseMove);
  window.removeEventListener('click',     onMapClick);

  camera.remove(mapPlane);
  camera.remove(lensSprite);
  camera.remove(roseSprite);

  mapPlane = lensSprite = roseSprite = null;
  raycaster = mouse = onMapMouseMove = onMapClick = null;

  setGeographerObjectsVisible(true);
}
