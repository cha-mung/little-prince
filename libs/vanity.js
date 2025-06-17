import * as THREE from 'three';
import { GLTFLoader } from 'https://unpkg.com/three@0.160.1/examples/jsm/loaders/GLTFLoader.js';

const modelConfigs = [
  { name: 'box',      path: 'assets/models/theVanity/box.glb',      scale: [2,2,2] },
  { name: 'closetA',  path: 'assets/models/theVanity/closet_a.glb', scale: [7,7,7] },
  { name: 'closetB',  path: 'assets/models/theVanity/closet_b.glb', scale: [7,7,7] },
  { name: 'clothA',   path: 'assets/models/theVanity/cloth_a.glb',  scale: [5,5,5] },
  { name: 'clothB',   path: 'assets/models/theVanity/cloth_b.glb',  scale: [5,5,5] },
  { name: 'clothC',   path: 'assets/models/theVanity/cloth_c.glb',  scale: [5,5,5] },
  { name: 'hatA',     path: 'assets/models/theVanity/hat_a.glb',    scale: [2,2,2] },
  { name: 'hatB',     path: 'assets/models/theVanity/hat_b.glb',    scale: [2,2,2] },
  { name: 'sofa',     path: 'assets/models/theVanity/sofa.glb',     scale: [3.5,3.5,3.5] },
  { name: 'sofa_clone',     path: 'assets/models/theVanity/sofa.glb',     scale: [3.5,3.5,3.5] },
  { name: 'vanity',   path: 'assets/models/theVanity/vanity.glb',   scale: [5,5,5] }
];

// 동적으로 변수에 담기 위한 객체
export  let VanityObject = null;
export const VanityModels = {};
export let vanitymixer = null;
export let vanityAction = null;
export let vanityActionFinished = true;

// 애니메이션 재생/정지

// 애니메이션 업데이트
export function updateVanityAnimation(delta = 0.016) {
  if (vanitymixer) vanitymixer.update(delta);
}
function playVanity() {
  if (vanityAction) vanityAction.paused = false;
  vanityActionFinished = false;
}
function setVanityActionFinished(isFinished){
    if (vanityAction) vanityActionFinished = isFinished;
}
export function loadVanity(scene, onLoaded) {
  const loader = new GLTFLoader();
  Promise.all(
    modelConfigs.map(cfg =>
      new Promise((resolve, reject) => {
        loader.load(cfg.path,
          gltf => resolve({ gltf, cfg }),
          undefined,
          reject
        )
        })
    )
  ).then(results => {
    results.forEach(({ gltf, cfg }) => {
        const model = gltf.scene;
        model.scale.set(...cfg.scale);
        model.visible = false;
        scene.add(model);

        // 그림자 & 머티리얼 설정
        model.traverse(child => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
            const old = child.material;
            child.material = new THREE.MeshStandardMaterial({
                map: old.map || null,
                color: old.color || new THREE.Color(0xffffff),
                metalness: 0.2,
                roughness: 0.8
            });
            }
        }
        });
        // VanityModels.box, VanityModels.closetA, … 에 할당
        if (cfg.name === 'vanity') {
            VanityObject = model;
            vanitymixer = new THREE.AnimationMixer(model);
            vanityAction = vanitymixer.clipAction(gltf.animations[0]);
            vanityAction.play();
            vanityAction.paused = true;

            // 애니메이션 종료 이벤트 리스너
            vanityAction.clampWhenFinished = true;
            vanityAction.loop = THREE.LoopOnce;
            vanitymixer.addEventListener('finished', () => {
                setVanityActionFinished(true);// 여기에 원하는 트리거 동작 추가
                vanitymixer.setTime(0);
            });
        }
        else {
            VanityModels[cfg.name] = model; }
        });

        if (onLoaded) onLoaded();
    });
}

export function setVanityVisible(visible) {
  if(VanityObject) VanityObject.visible = visible;
  Object.values(VanityModels).forEach(m => {
    if (m) m.visible = visible;
  });
}

// 행성 위에 배치할 때 쓰는 헬퍼
function makeQuaternionFromUpAndForward(upDir, forwardHint) {
  const z = forwardHint.clone().normalize();
  const y = upDir.clone().normalize();
  const x = new THREE.Vector3().crossVectors(y, z).normalize();
  z.crossVectors(x, y);
  const m = new THREE.Matrix4().makeBasis(x, y, z);
  return new THREE.Quaternion().setFromRotationMatrix(m);
}

export function placeObjectOnPlanetRelativeTo(
  targetObj, referenceObj, planet, offset,
  forwardHint, rotationEuler = new THREE.Euler(0,0,0),
  heightOffset = 0.05
) {
  if (!targetObj || !referenceObj || !planet) return;
  const center = planet.position.clone();
  const radius = planet.geometry.boundingSphere.radius * planet.scale.x;

  const forward = new THREE.Vector3(0,0,-1).applyQuaternion(referenceObj.quaternion);
  const right   = new THREE.Vector3(1,0,0).applyQuaternion(referenceObj.quaternion);
  const up      = new THREE.Vector3(0,1,0).applyQuaternion(referenceObj.quaternion);

  const worldOff = new THREE.Vector3()
    .addScaledVector(right, offset.x)
    .addScaledVector(up,    offset.y)
    .addScaledVector(forward, offset.z);

  const rawPos = referenceObj.position.clone().add(worldOff);
  const toCenter = new THREE.Vector3().subVectors(center, rawPos).normalize();
  const finalPos = center.clone().addScaledVector(toCenter.negate(), radius + heightOffset);
  targetObj.position.copy(finalPos);

  const actualForward = forwardHint.clone().applyQuaternion(referenceObj.quaternion);
  const quat = makeQuaternionFromUpAndForward(toCenter, actualForward);
  targetObj.setRotationFromQuaternion(quat);
  targetObj.rotateX(rotationEuler.x);
  targetObj.rotateY(rotationEuler.y);
  targetObj.rotateZ(rotationEuler.z);
}

export function updateVanityOnPlanet(selectedPlanet, littlePrince) {
  if (!VanityObject) return;
  if (selectedPlanet.userData.name === '허영쟁이의 별') {
    const planetCenter = selectedPlanet.position.clone();
    const princePos    = littlePrince.position.clone();
    const forward      = new THREE.Vector3(0, 0, -1).applyQuaternion(littlePrince.quaternion);
    const offset       = forward.clone().multiplyScalar(3.5);
    const vanityPos      = princePos.clone().add(offset);
    VanityObject.position.copy(vanityPos);

    const toCenter = new THREE.Vector3().subVectors(planetCenter, vanityPos).normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), toCenter);
    VanityObject.setRotationFromQuaternion(q);
    VanityObject.rotateY(Math.PI + THREE.MathUtils.degToRad(30));
    let base = VanityObject;

    // ex) box는 앞 4m, 0m 위에
    placeObjectOnPlanetRelativeTo(
        VanityModels.box, base, selectedPlanet,
        new THREE.Vector3(10, 0, 0), forward,
        new THREE.Euler(Math.PI/6, 0, 0), 0.5
    );

    // closetA: 왼쪽 3m, 0m 위
    placeObjectOnPlanetRelativeTo(
        VanityModels.closetA, base, selectedPlanet,
        new THREE.Vector3(-6, -3, -10), forward,
        new THREE.Euler(0, Math.PI/1.5, 0), 2.7
    );

    // closetB: 오른쪽 3m
    placeObjectOnPlanetRelativeTo(
        VanityModels.closetB, base, selectedPlanet,
        new THREE.Vector3(6, -3, -10), forward,
        new THREE.Euler(0, -Math.PI/1.5, 0), 2.7
    );

    // clothA, clothB, clothC: 뒤쪽에 삼각형 모양으로
    placeObjectOnPlanetRelativeTo(
        VanityModels.clothA, base, selectedPlanet,
        new THREE.Vector3(-15, -8, 10), forward,
        new THREE.Euler(0, Math.PI, 0), 2
    );
    placeObjectOnPlanetRelativeTo(
        VanityModels.clothB, base, selectedPlanet,
        new THREE.Vector3(0, -8, 0), forward,
        new THREE.Euler(0, Math.PI * 1.1, 0), 2
    );
    placeObjectOnPlanetRelativeTo(
        VanityModels.clothC, base, selectedPlanet,
        new THREE.Vector3(12, -9, 10), forward,
        new THREE.Euler(0, Math.PI * 0.9, 0), 2
    );

    // hatA, hatB: 위쪽에
    placeObjectOnPlanetRelativeTo(
        VanityModels.hatA, base, selectedPlanet,
        new THREE.Vector3(-10, -6, 0), forward,
        new THREE.Euler(Math.PI/9, 0, 0), 0.5
    );
    placeObjectOnPlanetRelativeTo(
        VanityModels.hatB, base, selectedPlanet,
        new THREE.Vector3(10,-6, 0), forward,
        new THREE.Euler(Math.PI/9, 0, 0), 0.5
    );

    // sofa: 앞쪽 2m, 조금 왼쪽
    placeObjectOnPlanetRelativeTo(
        VanityModels.sofa, base, selectedPlanet,
        new THREE.Vector3(3, 0, 7), forward,
        new THREE.Euler( Math.PI/20, Math.PI/7.5, -Math.PI/16), 0.9
    );
    
    placeObjectOnPlanetRelativeTo(
        VanityModels.sofa_clone, base, selectedPlanet,
        new THREE.Vector3(-3, 0, 7), forward,
        new THREE.Euler( Math.PI/20,  Math.PI/7.5, -Math.PI/13), 0.9
    );

    setVanityVisible(true);
    } else {
        setVanityVisible(false);
    }
}

let clapCount = 0;
export function handleVanityClick(event, { camera, collectRocketFromPlanet }) {
  // // Raycaster 셋업
   const raycaster = new THREE.Raycaster();
   const mouse = new THREE.Vector2();
  
   mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
   mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
   raycaster.setFromCamera(mouse, camera);
   const targets = [VanityObject].filter(x => x);
   const intersects = raycaster.intersectObjects(targets, true);
   if (!intersects.length) return;
   let picked = intersects[0].object;
   while (picked && picked !== VanityObject) {
     picked = picked.parent;
   }
   if (picked === VanityObject && vanityActionFinished) {
     // 예: 클릭 시 다이얼로그 표시하거나 로직 실행
     switch(clapCount){
        case 0:
            clapCount++;
            showDialog("아! 아! 숭배자가 납시는군!");
            break;
        case 1:
            clapCount++;
            showDialog("양손을 마주쳐봐");
            break;
        case 2:
            playVanity();
            if (collectRocketFromPlanet) collectRocketFromPlanet('허영쟁이의 별');
            break;
     }
   }
}
let dialogTimeout = null;
function showDialog(text) {
  const dialog = document.getElementById('dialog');
  dialog.textContent = text;
  dialog.style.display = 'block';
  if (dialogTimeout) clearTimeout(dialogTimeout);
  dialogTimeout = setTimeout(() => {
    dialog.style.display = 'none';
    dialogTimeout = null;
  }, 4000);
}
