import * as THREE from 'three';
import { GLTFLoader } from 'https://unpkg.com/three@0.160.1/examples/jsm/loaders/GLTFLoader.js';

export let BusinessmanObject = null;
export let bags = null;
export let box = null;
export let telephone = null;
export let papers = null;
export let clock = null;
export let safe = null;
export let safe2 = null;
export let stars = null;
export let table = null;
export let board = null;
export let books = null;
export let drawer = null;
export let books2 = null;
export let globe = null;
export let building = null;
export let counter = null;
export let star = null;

const modelConfigs = [
    {
        name: 'BusinessmanObject',
        path: 'assets/models/theBusinessman/theBusinessman.glb',
        scale: [5, 5, 5]
    },
    {
        name: 'bags',
        path: 'assets/models/theBusinessman/bags.glb',
        scale: [6, 6, 6]
    },
    {
        name: 'box',   
        path: 'assets/models/theBusinessman/box.glb',
        scale: [5, 5, 5]
    },
    {
        name: 'telephone', 
        path: 'assets/models/theBusinessman/old_telephone.glb',
        scale: [2, 2, 2]
    },
    {
        name: 'papers',
        path: 'assets/models/theBusinessman/papers.glb',
        scale: [4, 4, 4]
    },
    {
        name: 'clock',
        path: 'assets/models/theBusinessman/retro_clock.glb',
        scale: [3, 3, 3]
    },
    {
        name: 'safe',
        path: 'assets/models/theBusinessman/safe.glb', 
        scale: [6, 6, 6]
    },
    {
        name: 'safe2',
        path: 'assets/models/theBusinessman/safe_w_gold.glb',
        scale: [5, 5, 5]
    },
    {
        name: 'stars',
        path: 'assets/models/theBusinessman/stars.glb',
        scale: [3, 3, 3]
    },
    {
        name: 'table',
        path: 'assets/models/theBusinessman/table.glb',
        scale: [6, 6, 6]
    },
    {
        name: 'board',
        path: 'assets/models/theBusinessman/board.glb',
        scale: [5, 5, 5]
    },
    {
        name: 'books',
        path: 'assets/models/theBusinessman/books.glb',
        scale: [3, 3, 3]
    },
    {
        name: 'drawer',
        path: 'assets/models/theBusinessman/drawer.glb',
        scale: [3, 3, 3]
    },
    {
        name: 'books2',
        path: 'assets/models/theBusinessman/books2.glb',
        scale: [3, 3, 3]
    },
    {
        name: 'globe',
        path: 'assets/models/theBusinessman/globe.glb',
        scale: [3, 3, 3]
    },
    {
        name: 'building',
        path: 'assets/models/theBusinessman/building.glb',
        scale: [5, 5, 5]
    },
    {
        name: 'counter', 
        path: 'assets/models/theBusinessman/counter.glb',
        scale: [3, 3, 3]
    },
    {
        name: 'star',
        path: 'assets/models/theBusinessman/star.glb',
        scale: [1, 1, 1]
    }
];

export function loadBusinessman(scene, onLoaded) {
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
      model.name = config.name;
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
      if (config.name === 'BusinessmanObject') BusinessmanObject = model;
        else if (config.name === 'bags') bags = model;
        else if (config.name === 'box') box = model;
        else if (config.name === 'telephone') telephone = model;
        else if (config.name === 'telephone2') telephone2 = model;
        else if (config.name === 'papers') papers = model;
        else if (config.name === 'clock') clock = model;
        else if (config.name === 'safe') safe = model;
        else if (config.name === 'safe2') safe2 = model;
        else if (config.name === 'stars') stars = model;
        else if (config.name === 'table') table = model;
        else if (config.name === 'board') board = model;
        else if (config.name === 'books') books = model;
        else if (config.name === 'drawer') drawer = model;
        else if (config.name === 'books2') books2 = model;
        else if (config.name === 'globe') globe = model;
        else if (config.name === 'building') building = model;
        else if (config.name === 'counter') counter = model;
        else if (config.name === 'star') star = model;
    });
    
    if (onLoaded) onLoaded();
  });
}

export function setBusinessmanObjectsVisible(visible) {
  if (BusinessmanObject) BusinessmanObject.visible = visible;
  if (bags) bags.visible = visible;
  if (box) box.visible = visible;
  if (telephone) telephone.visible = visible;
  if (papers) papers.visible = visible;
  if (clock) clock.visible = visible;
  if (safe) safe.visible = visible;
  if (safe2) safe2.visible = visible;
  if (stars) stars.visible = visible;
  if (table) table.visible = visible;
  if (board) board.visible = visible;
  if (books) books.visible = visible; 
  if (drawer) drawer.visible = visible;
  if (books2) books2.visible = visible;
  if (globe) globe.visible = visible;
  if (building) building.visible = visible;
  if (counter) counter.visible = visible;
  if (star) star.visible = visible;
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
export function updateBusinessmanOnPlanet(selectedPlanet, littlePrince) {
  if (!BusinessmanObject) return;
  if (selectedPlanet.userData.name === '사업가의 별') {
    const planetCenter = selectedPlanet.position.clone();
    const princePos = littlePrince.position.clone();
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(littlePrince.quaternion);
    const offset = forward.clone().multiplyScalar(2.5);
    const BusinessmanPos = princePos.clone().add(offset);

    BusinessmanObject.position.copy(BusinessmanPos);

    const toCenter = new THREE.Vector3().subVectors(planetCenter, BusinessmanPos).normalize();
    const modelDown = new THREE.Vector3(0, -1, 0);
    const q = new THREE.Quaternion().setFromUnitVectors(modelDown, toCenter);
    BusinessmanObject.setRotationFromQuaternion(q);
    BusinessmanObject.rotateY(Math.PI + THREE.MathUtils.degToRad(20));
    BusinessmanObject.rotateX(THREE.MathUtils.degToRad(10));

    // 오브젝트
    placeObjectOnPlanetRelativeTo(
      bags,
      BusinessmanObject,
      selectedPlanet,
      new THREE.Vector3(20, 0, 6),
      new THREE.Vector3(0, 0, 1),
      new THREE.Euler(THREE.MathUtils.degToRad(25), 0, 0),
      0.7
    );
    placeObjectOnPlanetRelativeTo(
      box,
      BusinessmanObject,
      selectedPlanet,
      new THREE.Vector3(-6, 0, -2),
      new THREE.Vector3(-1, 0, 0),
      new THREE.Euler(THREE.MathUtils.degToRad(30), 0, 0),
      0.9
    );
    placeObjectOnPlanetRelativeTo(
      telephone,
      BusinessmanObject,
      selectedPlanet,
      new THREE.Vector3(-5, 0, 5),
      new THREE.Vector3(0, 0, 1),
      new THREE.Euler(THREE.MathUtils.degToRad(30), 0, 0),
      0.2
    );
    placeObjectOnPlanetRelativeTo(
      papers,
      BusinessmanObject,
      selectedPlanet,
      new THREE.Vector3(-10, 0, 20),
      new THREE.Vector3(0, 0, 1),
      new THREE.Euler(THREE.MathUtils.degToRad(70), 0, 0),
      0.0
    );
    placeObjectOnPlanetRelativeTo(
      clock,
      BusinessmanObject,
      selectedPlanet,
      new THREE.Vector3(0, -30, 20),
      new THREE.Vector3(1, 0, 1),
      new THREE.Euler(0, 0, 0),
      0.7
    );
    placeObjectOnPlanetRelativeTo(
      safe,
      BusinessmanObject,
      selectedPlanet,
      new THREE.Vector3(-27, 0, -5),
      new THREE.Vector3(-1, 0, 1),
      new THREE.Euler(THREE.MathUtils.degToRad(10), 0, 0),
      1.5
    );
    placeObjectOnPlanetRelativeTo(
      safe2,
      BusinessmanObject,
      selectedPlanet,
      new THREE.Vector3(5, 0, -4),
      new THREE.Vector3(1, 0, 1),
      new THREE.Euler(THREE.MathUtils.degToRad(10), 0, 0),
      1.2
    );
    placeObjectOnPlanetRelativeTo(
      stars,
      BusinessmanObject,
      selectedPlanet,
      new THREE.Vector3(5, 0, 6),
      new THREE.Vector3(0, 0, 1),
      new THREE.Euler(THREE.MathUtils.degToRad(90), 0, 0),
      0.0
    );
    placeObjectOnPlanetRelativeTo(
      table,
      BusinessmanObject,
      selectedPlanet,
      new THREE.Vector3(20, 0, 40),
      new THREE.Vector3(-1, 0, 1),
      new THREE.Euler(THREE.MathUtils.degToRad(30), 0, 0),
      0.65
    );
    placeObjectOnPlanetRelativeTo(
      board,
      BusinessmanObject,
      selectedPlanet,
      new THREE.Vector3(-8, 0, -15),
      new THREE.Vector3(-0.5, 0, 1),
      new THREE.Euler(0, 0, 0),
      1.5
    );
    placeObjectOnPlanetRelativeTo(
      books,
      BusinessmanObject,
      selectedPlanet,
      new THREE.Vector3(-50, 0, 40),
      new THREE.Vector3(0, 0, 1),
      new THREE.Euler(THREE.MathUtils.degToRad(30), 0, 0),
      0.5
    );
    placeObjectOnPlanetRelativeTo(
      drawer,
      BusinessmanObject,
      selectedPlanet,
      new THREE.Vector3(100, -50, 100),
      new THREE.Vector3(0, 0, 1),
      new THREE.Euler(THREE.MathUtils.degToRad(30), 0, 0),
      0.5
    );
    placeObjectOnPlanetRelativeTo(
      books2,
      BusinessmanObject,
      selectedPlanet,
      new THREE.Vector3(10, 0, -20),
      new THREE.Vector3(0, 0, 1),
      new THREE.Euler(THREE.MathUtils.degToRad(20), 0, 0),
      0.5
    );
    placeObjectOnPlanetRelativeTo(
      globe,
      BusinessmanObject,
      selectedPlanet,
      new THREE.Vector3(-10, -20, 20),
      new THREE.Vector3(0, 0, 1),
      new THREE.Euler(0, 0, 0),
      1.3
    );
    placeObjectOnPlanetRelativeTo(
      building,
      BusinessmanObject,
      selectedPlanet,
      new THREE.Vector3(30, -20, -25),
      new THREE.Vector3(-1, 0, 1),
      new THREE.Euler(THREE.MathUtils.degToRad(20), 0, 0),
      0.9
    );
    placeObjectOnPlanetRelativeTo(
      counter,
      BusinessmanObject,
      selectedPlanet,
      new THREE.Vector3(0, 0, -5),
      new THREE.Vector3(0, 0, 1),
      new THREE.Euler(THREE.MathUtils.degToRad(20), 0, 0),
      0.5
    );
    placeObjectOnPlanetRelativeTo(
      star,
      BusinessmanObject,
      selectedPlanet,
      new THREE.Vector3(2, 0, 4),
      new THREE.Vector3(0, 0, 1),
      new THREE.Euler(THREE.MathUtils.degToRad(90), 0, 0),
      0.0
    );

    const coinLight = new THREE.PointLight(0xffd700, 50, 30, 2);
    bags.add(coinLight);
    stars.add(coinLight.clone());
    box.add(coinLight.clone());
    safe.add(coinLight.clone());
    safe2.add(coinLight.clone());
    papers.add(coinLight.clone());
    const light2 = new THREE.PointLight(0xffd700, 20, 30, 2);
    drawer.add(light2);
    building.add(light2.clone());

    setBusinessmanObjectsVisible(true);    
  } else {
    setBusinessmanObjectsVisible(false);    
  }
}

let readyForDialogue = false;

export function handleBusinessmanClick(event, { camera, collectRocketFromPlanet }) {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects([star, BusinessmanObject], true);

  if (intersects.length > 0) {
    let target = intersects[0].object;

    while (target && target !== star && target !== BusinessmanObject) {
      target = target.parent;
    }
    if (target === star && star.visible) {
      star.visible = false;
      readyForDialogue = true;

      const starStatus = document.getElementById('starStatus');
      if (starStatus) {
        starStatus.style.display = 'block';
      }
    } else if (target === BusinessmanObject) {
      if (readyForDialogue) {
        showBusinessmanDialogue();
        if (collectRocketFromPlanet) {
          collectRocketFromPlanet('사업가의 별');
        }
        if (starStatus) {
          starStatus.style.display = 'none';
        }
      } else {
        BusinessmanDialogue();
      }
    }
  }
}
const dialogueLines1 = [
    "셋 더하기 둘은 다섯, 다섯 더하기 일곱은 열둘.",
    "휴우! 그러니까 오억 일백육십이만 이천칠백삼십 일이네.",
    "아무것도 안 해. 그저 소유할 뿐이지.",
    "저기 떨어진 별을 주워 줘.",
  ];
let dialogueIndex = 0;
let dialogTimeout = null;

function BusinessmanDialogue() {
  const dialog = document.getElementById('dialog');
  dialog.textContent = dialogueLines1[dialogueIndex];
  dialog.style.display = 'block';

  if (dialogTimeout) clearTimeout(dialogTimeout);
  dialogTimeout = setTimeout(() => {
    dialog.style.display = 'none';
    dialogTimeout = null;
  }, 4000);
  dialogueIndex = (dialogueIndex + 1) % dialogueLines1.length;
}

const dialogueLines2 = [
    "별을 줘. 대가로 네가 원하는 걸 줄게.",
    "별은 내 것이야. 내가 제일 먼저 그 생각을 했으니까.",
    "나는 별을 소유하고 있어.",
    "별은 나를 부자로 만들지.",
  ];
let dialogueIndex2 = 0;

function showBusinessmanDialogue() {
  const dialog = document.getElementById('dialog');
  dialog.textContent = dialogueLines2[dialogueIndex2];
  dialog.style.display = 'block';

  if (dialogTimeout) clearTimeout(dialogTimeout);
  dialogTimeout = setTimeout(() => {
    dialog.style.display = 'none';
    dialogTimeout = null;
  }, 4000);
  dialogueIndex2 = (dialogueIndex2 + 1) % dialogueLines2.length;
}
