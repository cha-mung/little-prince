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
      new THREE.Vector3(0, 0, -5),
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
      new THREE.Vector3(10, 0, 40),
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
      new THREE.Vector3(-30, 0, 20),
      new THREE.Vector3(0, 0, 1),
      new THREE.Euler(THREE.MathUtils.degToRad(30), 0, 0),
      0.5
    );
    placeObjectOnPlanetRelativeTo(
      drawer,
      BusinessmanObject,
      selectedPlanet,
      new THREE.Vector3(60, 0, 60),
      new THREE.Vector3(0, 0, 1),
      new THREE.Euler(THREE.MathUtils.degToRad(30), 0, 0),
      0.5
    );
    placeObjectOnPlanetRelativeTo(
      books2,
      BusinessmanObject,
      selectedPlanet,
      new THREE.Vector3(20, 0, -30),
      new THREE.Vector3(0, 0, 1),
      new THREE.Euler(THREE.MathUtils.degToRad(20), 0, 0),
      0.5
    );

    setBusinessmanObjectsVisible(true);    
  } else {
    setBusinessmanObjectsVisible(false);    
  }
}
