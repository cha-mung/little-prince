import * as THREE from 'three';
import { GLTFLoader } from 'https://unpkg.com/three@0.160.1/examples/jsm/loaders/GLTFLoader.js';
// import * as dat from 'https://cdn.jsdelivr.net/npm/dat.gui@0.7.9/build/dat.gui.module.js'; //UI
import { startLampMiniGame } from './lamplighterGame.js';

// 전역 모델 변수
export let LampLighterObject = null;
export let lamp_post = null;
export let bed = null;
export let matches = null;
export let matches2 = null;
export let matchBox = null;
export let brokenLamp = null;
export let brokenLamp2 = null;
export let lampPostLight = null;
export let fire = null;

// 모델 구성 리스트
const modelConfigs = [
  {
    name: 'LampLighterObject',
    path: 'assets/models/theLampLighter/thelamplighter.glb',
    scale: [5, 5, 5]
  },
  {
    name: 'lamp_post',
    path: 'assets/models/theLampLighter/lamp_post.glb',
    scale: [7, 7, 7]
  },
  {
    name: 'bed',
    path: 'assets/models/theLampLighter/bed.glb',
    scale: [4.5, 4.5, 4.5]
  },
  {
    name: 'matches',
    path: 'assets/models/theLampLighter/matches.glb',
    scale: [2, 2, 2]
  },
  {
    name: 'matches2',
    path: 'assets/models/theLampLighter/matches2.glb',
    scale: [1.5, 1.5, 1.5]
  },
  {
    name: 'matchBox',
    path: 'assets/models/theLampLighter/matchBox.glb',
    scale: [1, 1, 1]
  },
  {
    name: 'brokenLamp',
    path: 'assets/models/theLampLighter/brokenLamp.glb',
    scale: [1.3, 1.3, 1.3]
  },
  {
    name: 'brokenLamp2',
    path: 'assets/models/theLampLighter/brokenLamp2.glb',
    scale: [1.3, 1.3, 1.3]
  }
];

// 모델 로드 함수
export function loadLampLighter(scene, onLoaded) {
  const loader = new GLTFLoader();

  Promise.all(
    modelConfigs.map(config =>
      new Promise((resolve, reject) => {
        loader.load(config.path, gltf => resolve({ gltf, config }), undefined, reject);
      })
    )
  ).then(results => {
    results.forEach(({ gltf, config }) => {
      const model = gltf.scene;
      model.scale.set(...config.scale);
      scene.add(model);

      model.traverse(child => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
        if (child.material) {
          const oldMat = child.material;
          child.material = new THREE.MeshStandardMaterial({
            map: oldMat.map || null,
            color: oldMat.color || new THREE.Color(0xffffff),
            metalness: 0.2,
            roughness: 0.8
          });
        }
      });

      model.visible = false;

      if (config.name === 'LampLighterObject') LampLighterObject = model;
      if (config.name === 'lamp_post') lamp_post = model;
      if (config.name === 'bed') bed = model;
      if (config.name === 'matches') matches = model;
      if (config.name === 'matches2') matches2 = model;
      if (config.name === 'matchBox') matchBox = model;
      if (config.name === 'brokenLamp') brokenLamp = model;
      if (config.name === 'brokenLamp2') brokenLamp2 = model;
    });

    if (onLoaded) onLoaded();
  });
}

// 표시 여부 제어
export function setLampLighterObjectsVisible(visible) {
  if (LampLighterObject) LampLighterObject.visible = visible;
  if (lamp_post) lamp_post.visible = visible;
  if (bed) bed.visible = visible;
  if (matches) matches.visible = visible;
  if (matches2) matches2.visible = visible;
  if (matchBox) matchBox.visible = visible;
  if (brokenLamp) brokenLamp.visible = visible;
  if (brokenLamp2) brokenLamp2.visible = visible;
}

// 회전용 쿼터니언 생성 함수
function makeQuaternionFromUpAndForward(upDir, forwardHint) {
  const z = forwardHint.clone().normalize();
  const y = upDir.clone().normalize();
  const x = new THREE.Vector3().crossVectors(y, z).normalize();
  z.crossVectors(x, y);

  const m = new THREE.Matrix4();
  m.makeBasis(x, y, z);
  const q = new THREE.Quaternion();
  q.setFromRotationMatrix(m);
  return q;
}

// 배치 함수
function placeObjectOnPlanetRelativeTo(
  targetObj,
  referenceObj,
  planet,
  offset,
  forwardHint,
  additionalRotationEuler = new THREE.Euler(0, 0, 0),
  heightOffset = 0.05
) {
  if (!targetObj || !referenceObj || !planet) return;

  const planetCenter = planet.position.clone();
  const planetRadius = planet.geometry.boundingSphere.radius * planet.scale.x;

  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(referenceObj.quaternion);
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(referenceObj.quaternion);
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(referenceObj.quaternion);

  const worldOffset = new THREE.Vector3()
    .addScaledVector(right, offset.x)
    .addScaledVector(up, offset.y)
    .addScaledVector(forward, offset.z);

  const rawPos = referenceObj.position.clone().add(worldOffset);

  const toCenter = new THREE.Vector3().subVectors(planetCenter, rawPos).normalize();
  const finalPos = planetCenter.clone().addScaledVector(toCenter.negate(), planetRadius + heightOffset);
  targetObj.position.copy(finalPos);

  const actualForward = forwardHint.clone().applyQuaternion(referenceObj.quaternion);
  const baseQuat = makeQuaternionFromUpAndForward(toCenter.clone(), actualForward);
  targetObj.setRotationFromQuaternion(baseQuat);

  targetObj.rotateX(additionalRotationEuler.x);
  targetObj.rotateY(additionalRotationEuler.y);
  targetObj.rotateZ(additionalRotationEuler.z);
}

// 업데이트 함수: 행성 선택 시 호출
export function updateLampLighterOnPlanet(selectedPlanet, littlePrince) {
  if (!LampLighterObject) return;

  if (selectedPlanet.userData.name === '점등원의 별') {
    const planetCenter = selectedPlanet.position.clone();
    const princePos = littlePrince.position.clone();
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(littlePrince.quaternion);
    const offset = forward.clone().multiplyScalar(2.5);
    const LampLighterPos = princePos.clone().add(offset);

    LampLighterObject.position.copy(LampLighterPos);

    const toCenter = new THREE.Vector3().subVectors(planetCenter, LampLighterPos).normalize();
    const modelDown = new THREE.Vector3(0, -1, 0);
    const q = new THREE.Quaternion().setFromUnitVectors(modelDown, toCenter);
    LampLighterObject.position.copy(planetCenter.clone().addScaledVector(toCenter.negate(), selectedPlanet.geometry.boundingSphere.radius * selectedPlanet.scale.x + 2.0));
    LampLighterObject.setRotationFromQuaternion(q);
    LampLighterObject.rotateY(Math.PI + THREE.MathUtils.degToRad(20));

    placeObjectOnPlanetRelativeTo(
      lamp_post,
      LampLighterObject,
      selectedPlanet,
      new THREE.Vector3(-2, 0, 0),
      new THREE.Vector3(0, 0, -5),
      new THREE.Euler(THREE.MathUtils.degToRad(0), 0, 0),
      3.1
    );
    placeObjectOnPlanetRelativeTo(
      bed,
      LampLighterObject,
      selectedPlanet,
      new THREE.Vector3(-8, 0, 1),
      new THREE.Vector3(0, 0, -1),
      new THREE.Euler(
        THREE.MathUtils.degToRad(-5),
        THREE.MathUtils.degToRad(180),
        THREE.MathUtils.degToRad(0)),
      0.6
    );
    placeObjectOnPlanetRelativeTo(
      matches,
      LampLighterObject,
      selectedPlanet,
      new THREE.Vector3(3, 0, 6),
      new THREE.Vector3(0, 0, -1),
      new THREE.Euler(
        THREE.MathUtils.degToRad(110),
        THREE.MathUtils.degToRad(0),
        THREE.MathUtils.degToRad(60)),
      0
    );
    placeObjectOnPlanetRelativeTo(
      matches2,
      LampLighterObject,
      selectedPlanet,
      new THREE.Vector3(-6, 0, 13),
      new THREE.Vector3(0, 0, -1),
      new THREE.Euler(
        THREE.MathUtils.degToRad(110),
        THREE.MathUtils.degToRad(0),
        THREE.MathUtils.degToRad(60)),
      0
    );
    placeObjectOnPlanetRelativeTo(
      matchBox,
      LampLighterObject,
      selectedPlanet,
      new THREE.Vector3(2, 0, 6),
      new THREE.Vector3(0, 0, -1),
      new THREE.Euler(
        THREE.MathUtils.degToRad(80),
        THREE.MathUtils.degToRad(0),
        THREE.MathUtils.degToRad(20)),
      0.1
    );
    placeObjectOnPlanetRelativeTo(
      brokenLamp,
      LampLighterObject,
      selectedPlanet,
      new THREE.Vector3(7, 0, 9),
      new THREE.Vector3(0, 0, -1),
      new THREE.Euler(
        THREE.MathUtils.degToRad(-40),
        THREE.MathUtils.degToRad(0),
        THREE.MathUtils.degToRad(50)),
      0.4
    );
    placeObjectOnPlanetRelativeTo(
      brokenLamp2,
      LampLighterObject,
      selectedPlanet,
      new THREE.Vector3(-7, 0, 9),
      new THREE.Vector3(0, 0, -1),
      new THREE.Euler(
      THREE.MathUtils.degToRad(-40),
      THREE.MathUtils.degToRad(0),
      THREE.MathUtils.degToRad(50)),
      0.4
    );

    lampPostLight = new THREE.PointLight(0xffcc66, 70, 13, 1);
    lampPostLight.position.set(-0.5, 0.4, 0.9);
    lamp_post.add(lampPostLight);

    startLampLightFlicker(); 

    fire = new THREE.PointLight(0xff0000, 10, 4.0, 1);
    fire.position.set(-0.5, 0.24, -0.5);
    LampLighterObject.add(fire);



    setLampLighterObjectsVisible(true);
  } else {
    setLampLighterObjectsVisible(false);
    stopLampLightFlicker();
  }
}

let lampLightToggleInterval = null;
let lampLightOn = true;

function startLampLightFlicker() {
  if (!lampPostLight) return;
  if (lampLightToggleInterval) return;

  lampLightToggleInterval = setInterval(() => {
    lampLightOn = !lampLightOn;
    lampPostLight.visible = lampLightOn;
  }, 2000);
}

function stopLampLightFlicker() {
  if (lampLightToggleInterval) {
    clearInterval(lampLightToggleInterval);
    lampLightToggleInterval = null;
  }
}

let readyForDialogue = false;

export function handleLampLighterClick(event, { camera, scene, collectRocketFromPlanet }) {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects([lamp_post, LampLighterObject], true);

  if (intersects.length > 0) {
    let target = intersects[0].object;

    while (target && target !== lamp_post && target !== LampLighterObject) {
      target = target.parent;
    }
    if (target === lamp_post && lamp_post.visible) {

      // 미니게임 시작
      startLampMiniGame(() => {
      // 미니게임 클리어 후 실행할 로직
      readyForDialogue = true;

      const lamp_postStatus = document.getElementById('lamp_postStatus');
      if (lamp_postStatus) {
        lamp_postStatus.style.display = 'block';
      }
    });
  } else if (target === LampLighterObject) {
      if (readyForDialogue) {
        showLampLighterDialogue();
        if (collectRocketFromPlanet&& dialogueIndex2>=3) {
          collectRocketFromPlanet('점등원의 별');
        }
        if (lamp_postStatus) {
          lamp_postStatus.style.display = 'none';
        }
      } else {
        LampLighterDialogue();
      }
    }
  }
}

const dialogueLines = [
  '안녕, 왜 가로등을 껐냐고? 명령이거든.',
  '왜 가로등을 켰냐고? 명령이거든.',
  '명령은 명령이니까, 나는 끔찍한 일을 하고 있단다.',
  '이 별은 일 분에 한 번씩 도니까, 나는 단 일 초도 쉴 수가 없어.',
  '저 침대에서 쉬고 싶구나. 잠깐 가로등을 맡아주겠니?'
];

let dialogueIndex = 0;
let dialogTimeout = null;
let dialogueline1finished = false;

let dialogueline2finished = false;
function LampLighterDialogue() {
  const dialog = document.getElementById('dialog');
  dialog.textContent = dialogueLines[dialogueIndex];
  dialog.style.display = 'block';

  if (dialogTimeout) clearTimeout(dialogTimeout);
  dialogTimeout = setTimeout(() => {
    dialog.style.display = 'none';
    dialogTimeout = null;
  }, 4000);
  if(dialogueline1finished) return;
  dialogueIndex = (dialogueIndex + 1) % dialogueLines.length;
  if(dialogueIndex === dialogueLines.length-1){
    dialogueline1finished = true;
  }//dialogue1이 끝날 때 다시 반복하지 않고 마지막말만 하도록
}

const dialogueLines2 = [
  '아주 잘하는구나, 덕분에 조금 쉴 수 있었단다.',
  '이 별은 작아서 걸으면 계속 낮이라고?',
  '아냐... 햇빛을 걸으며 쉬는 것보다는 잠을 자고 싶구나.',
  '잠깐이나마 고맙다. 이걸 가져가렴.',
  '쉬고싶다...'
];

let dialogueIndex2 = 0;

function showLampLighterDialogue() {
  const dialog = document.getElementById('dialog');
  dialog.textContent = dialogueLines2[dialogueIndex2];
  dialog.style.display = 'block';

  if (dialogTimeout) clearTimeout(dialogTimeout);
  dialogTimeout = setTimeout(() => {
    dialog.style.display = 'none';
    dialogTimeout = null;
  }, 4000);
  if (dialogueline2finished) return;
  dialogueIndex2 = (dialogueIndex2 + 1) % dialogueLines2.length;
  if (dialogueIndex2 === dialogueLines2.length - 1) {
    dialogueline2finished = true;
  }//dialogue2이 끝날 때 다시 반복하지 않고 마지막말만 하도록
}


