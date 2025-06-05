import * as THREE from 'three';
import { FBXLoader } from 'https://unpkg.com/three@0.160.1/examples/jsm/loaders/FBXLoader.js';

export let KingObject = null;

export function loadKing(scene, onLoaded) {
  const Kingloader = new FBXLoader();
  Kingloader.load('assets/models/King.fbx', (fbx) => {
    fbx.traverse(child => {
      if (child.isMesh) child.castShadow = true;
    });
    fbx.scale.set(0.05, 0.05, 0.05);
    fbx.visible = false; // 처음에는 보이지 않게
    scene.add(fbx);
    KingObject = fbx;
    if (onLoaded) onLoaded(fbx);
  });
}

// 왕의 위치/회전/표시 제어 함수
export function updateKingOnPlanet(selectedPlanet, littlePrince) {
  if (!KingObject) return;
  if (selectedPlanet.userData.name === '왕의 별') {
    const planetCenter = selectedPlanet.position.clone();
    const princePos = littlePrince.position.clone();
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(littlePrince.quaternion);
    const offset = forward.clone().multiplyScalar(4.0);
    const kingPos = princePos.clone().add(offset);
    KingObject.position.copy(kingPos);

    // 왕의 '아래 방향'을 행성 중심으로 향하게
    const toCenter = new THREE.Vector3().subVectors(planetCenter, kingPos).normalize();
    const modelDown = new THREE.Vector3(0, -1, 0);
    const q = new THREE.Quaternion().setFromUnitVectors(modelDown, toCenter);
    KingObject.setRotationFromQuaternion(q);
    KingObject.rotateY(Math.PI + THREE.MathUtils.degToRad(30));
    KingObject.visible = true;
  } else {
    KingObject.visible = false;
  }
}