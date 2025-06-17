import * as THREE from 'three';
import { GLTFLoader } from 'https://unpkg.com/three@0.160.1/examples/jsm/loaders/GLTFLoader.js';

export let DrunkardObject = null;
export let bottles_on_table = null;
export let Stool = null;
export let bottles_on_floor = null;
export let bottle_w_table = null;
export let oak = null;
export let oak2 = null;
export let trash = null;
export let tv = null;
export let blanket = null;
export let table = null;

const modelConfigs = [
  {
    name: 'DrunkardObject',
    path: 'assets/models/theDrunkard/theDrunkard.glb',
    scale: [5, 5, 5]
  },
  {
    name: 'bottles_on_table',
    path: 'assets/models/theDrunkard/bottles_on_table.glb',
    scale: [3, 3, 3]
  },
  {
    name: 'Stool',
    path: 'assets/models/theDrunkard/wooden_stool.glb',
    scale: [0.025, 0.025, 0.025]
  },
  {
    name: 'bottles_on_floor',
    path: 'assets/models/theDrunkard/bottles_on_floor.glb',
    scale: [3, 3, 3]
  },
  {
    name: 'bottle_w_table',
    path: 'assets/models/theDrunkard/bottle_w_table.glb',
    scale: [3, 3, 3]
  },
  {
    name: 'oak',
    path: 'assets/models/theDrunkard/oak.glb',
    scale: [5, 5, 5]
  },
  {
    name: 'oak2',
    path: 'assets/models/theDrunkard/oak2.glb',
    scale: [5, 5, 5]
  },
  {
    name: 'trash',
    path: 'assets/models/theDrunkard/trash.glb',
    scale: [4, 4, 4]
  },
  {
    name: 'tv',
    path: 'assets/models/theDrunkard/tv.glb',
    scale: [5, 5, 5]
  },
  {
    name: 'blanket',
    path: 'assets/models/theDrunkard/blanket.glb',
    scale: [3, 3, 3]
  },
  {
    name: 'table',
    path: 'assets/models/theDrunkard/table.glb',
    scale: [2, 2, 2]
  }
];

export function loadDrunkard(scene, onLoaded) {
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
      if (config.name === 'DrunkardObject') DrunkardObject = model;
      if (config.name === 'Stool') Stool = model;
      if (config.name === 'bottles_on_table') bottles_on_table = model;
      if (config.name === 'bottles_on_floor') bottles_on_floor = model;
      if (config.name === 'bottle_w_table') bottle_w_table = model; 
      if (config.name === 'oak') oak = model;
      if (config.name === 'oak2') oak2 = model;
      if (config.name === 'trash') trash = model;
      if (config.name === 'tv') tv = model;
      if (config.name === 'blanket') blanket = model;
      if (config.name === 'table') table = model;
    });
    
    if (onLoaded) onLoaded();
  });
}

export function setDrunkardObjectsVisible(visible) {
  if (DrunkardObject) DrunkardObject.visible = visible;
  if (bottles_on_table) bottles_on_table.visible = visible;
  if (Stool) Stool.visible = visible;
  if (bottles_on_floor) bottles_on_floor.visible = visible;
  if (bottle_w_table) bottle_w_table.visible = visible;
  if (oak) oak.visible = visible;
  if (oak2) oak2.visible = visible;
  if (trash) trash.visible = visible;
  if (tv) tv.visible = visible;
  if (blanket) blanket.visible = visible;
  if (table) table.visible = visible;
}

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

export function placeObjectOnPlanetRelativeTo(
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

  // 기준 오브젝트 로컬 좌표계 기반 방향들
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

  // 회전 적용
  const actualForward = forwardHint.clone().applyQuaternion(referenceObj.quaternion);
  const baseQuat = makeQuaternionFromUpAndForward(toCenter.clone(), actualForward);
  targetObj.setRotationFromQuaternion(baseQuat);

  targetObj.rotateX(additionalRotationEuler.x);
  targetObj.rotateY(additionalRotationEuler.y);
  targetObj.rotateZ(additionalRotationEuler.z);
}

// 위치/회전/표시 제어 함수
export function updateDrunkardOnPlanet(selectedPlanet, littlePrince) {
  if (!DrunkardObject) return;
  if (selectedPlanet.userData.name === '술꾼의 별') {
    const planetCenter = selectedPlanet.position.clone();
    const princePos = littlePrince.position.clone();
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(littlePrince.quaternion);
    const offset = forward.clone().multiplyScalar(2.0);
    const DrunkardPos = princePos.clone().add(offset);

    DrunkardObject.position.copy(DrunkardPos);

    const toCenter = new THREE.Vector3().subVectors(planetCenter, DrunkardPos).normalize();
    const modelDown = new THREE.Vector3(0, -1, 0);
    const q = new THREE.Quaternion().setFromUnitVectors(modelDown, toCenter);
    DrunkardObject.setRotationFromQuaternion(q);
    DrunkardObject.rotateY(Math.PI + THREE.MathUtils.degToRad(20));

    // 오브젝트
    placeObjectOnPlanetRelativeTo(
      bottles_on_table,
      DrunkardObject,
      selectedPlanet,
      new THREE.Vector3(5, 0, 0),
      new THREE.Vector3(0, 0, 1),
      new THREE.Euler(THREE.MathUtils.degToRad(30), 0, 0),
      0.7
    );
    placeObjectOnPlanetRelativeTo(
      Stool,
      DrunkardObject,
      selectedPlanet,
      new THREE.Vector3(14, 0, -2),
      new THREE.Vector3(0, 0, 1),
      new THREE.Euler(0, 0, 0),
      0.02
    );
    placeObjectOnPlanetRelativeTo(
      bottles_on_floor,
      DrunkardObject,
      selectedPlanet,
      new THREE.Vector3(-6, 0, 3),
      new THREE.Vector3(0, 0, 1),
      new THREE.Euler(THREE.MathUtils.degToRad(30), 0, 0),
      0.5
    );
    placeObjectOnPlanetRelativeTo(
      bottle_w_table,
      DrunkardObject,
      selectedPlanet,
      new THREE.Vector3(6, 0, 8),
      new THREE.Vector3(0, 0, 0.5),
      new THREE.Euler(THREE.MathUtils.degToRad(20), 0, 0),
      0.35
    );
    placeObjectOnPlanetRelativeTo(
      oak,
      DrunkardObject,
      selectedPlanet,
      new THREE.Vector3(-6, 0, -8),
      new THREE.Vector3(0, 0, 1),
      new THREE.Euler(THREE.MathUtils.degToRad(30), (THREE.MathUtils.degToRad(5)), 0),
      0.5
    );
    placeObjectOnPlanetRelativeTo(
      oak2,
      DrunkardObject,
      selectedPlanet,
      new THREE.Vector3(10, 0, -20),
      new THREE.Vector3(0, 0, 1),
      new THREE.Euler(THREE.MathUtils.degToRad(30), (THREE.MathUtils.degToRad(-5)), 0),
      0.5
    );
    placeObjectOnPlanetRelativeTo(
      trash,
      DrunkardObject,
      selectedPlanet,
      new THREE.Vector3(150, 0, 100),
      new THREE.Vector3(0, 0, THREE.MathUtils.degToRad(30)),
      new THREE.Euler(THREE.MathUtils.degToRad(30), 0, 0),
      0.45
    );
    placeObjectOnPlanetRelativeTo(
      tv,
      DrunkardObject,
      selectedPlanet,
      new THREE.Vector3(-40, 0, 30),
      new THREE.Vector3(0, -1, 0),
      new THREE.Euler(THREE.MathUtils.degToRad(20), 0, 0),
      0.7
    );
    placeObjectOnPlanetRelativeTo(
      blanket,
      DrunkardObject,
      selectedPlanet,
      new THREE.Vector3(-60, 0, -5),
      new THREE.Vector3(0, 0, 1),
      new THREE.Euler(THREE.MathUtils.degToRad(30), 0, 0),
      0.0
    );
    placeObjectOnPlanetRelativeTo(
      table,
      DrunkardObject,
      selectedPlanet,
      new THREE.Vector3(0, 0, 30),
      new THREE.Vector3(0, 0, 1),
      new THREE.Euler(THREE.MathUtils.degToRad(30), 0, 0),
      0.2
    );

    const bottleLight = new THREE.PointLight(0xffbb00, 1, 10, 2);
    bottles_on_floor.add(bottleLight);
    bottles_on_table.add(bottleLight.clone());
    bottle_w_table.add(bottleLight.clone());
    oak.add(bottleLight.clone());
    tv.add(bottleLight.clone());
    setDrunkardObjectsVisible(true);
  } else {
    setDrunkardObjectsVisible(false);
  }
}

let readyForDialogue = false;
let drunkardDialogueEnded = false;

export function handleDrunkardClick(event, { camera, collectRocketFromPlanet }) {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects([DrunkardObject], true);

  if (intersects.length > 0) {
    let target = intersects[0].object;

    while (target && target !== DrunkardObject) {
      target = target.parent;
    }
    if (target === DrunkardObject) {
        if (drunkardDialogueEnded) {
          afterDrunkardDialogue();
        } else if (readyForDialogue) {
        starDrunkardDialogue();
        if (collectRocketFromPlanet) {
          collectRocketFromPlanet('술꾼의 별');
        }
      } else {
        DrunkardDialogue();
      }
    }
  }
}

const dialogueLines = [
    "뭐하냐고? 술 마시지.",
    "잊어버리려고 술을 마시지.",
    "부끄럽다는 걸 잊으려고.",
    "마신다는 게 부끄러워!",
  ];
let dialogueIndex = 0;
let dialogTimeout = null;

function DrunkardDialogue() {
  const dialog = document.getElementById('dialog');
  dialog.textContent = dialogueLines[dialogueIndex];
  dialog.style.display = 'block';

  if (dialogTimeout) clearTimeout(dialogTimeout);
  dialogTimeout = setTimeout(() => {
    dialog.style.display = 'none';
    dialogTimeout = null;
  }, 4000);
  if (dialogueIndex === dialogueLines.length - 1) {
    readyForDialogue = true;
  }
  dialogueIndex = (dialogueIndex + 1) % dialogueLines.length;
}

function starDrunkardDialogue() {
  const dialog = document.getElementById('dialog');
  dialog.textContent = "네가 원하던 걸 주마. 이제 그만 말 걸어, 꼬맹아!";
  dialog.style.display = 'block';

  if (dialogTimeout) clearTimeout(dialogTimeout);
  dialogTimeout = setTimeout(() => {
    dialog.style.display = 'none';
    dialogTimeout = null;
  }, 4000);
  drunkardDialogueEnded = true;
}

function afterDrunkardDialogue() {
  const dialog = document.getElementById('dialog');
  dialog.textContent = "......";
  dialog.style.display = 'block';

  if (dialogTimeout) clearTimeout(dialogTimeout);
  dialogTimeout = setTimeout(() => {
    dialog.style.display = 'none';
    dialogTimeout = null;
  }, 4000);
  drunkardDialogueEnded = true;
}