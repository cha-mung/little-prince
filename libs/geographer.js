import * as THREE from 'three';
import { GLTFLoader } from 'https://unpkg.com/three@0.160.1/examples/jsm/loaders/GLTFLoader.js';

// 전역 모델 변수
export let GeographerObject = null;
export let oldMap = null;
export let oldMap2 = null;
export let openBook = null;
export let openBook2 = null;
export let stackOfBooks = null;
export let stackOfBooks2 = null;
export let books = null;
export let lens = null;
export let standLamp = null;
export let chair = null;
export let bookdummy = null;

// 모델 구성 리스트
const modelConfigs = [
  {
    name: 'GeographerObject',
    path: 'assets/models/theGeographer/geographer.glb',
    scale: [7, 7, 7]
  },
  {
    name: 'oldMap',
    path: 'assets/models/theGeographer/oldmap.glb',
    scale: [4, 4, 4]
  },
  {
    name: 'oldMap2',
    path: 'assets/models/theGeographer/oldmap2.glb',
    scale: [3, 3, 3]
  },
  {
    name: 'openBook',
    path: 'assets/models/theGeographer/openBook.glb',
    scale: [3, 3, 3]
  },
  {
    name: 'openBook2',
    path: 'assets/models/theGeographer/openBook2.glb',
    scale: [3, 3, 3]
  },
  {
    name: 'stackOfBooks',
    path: 'assets/models/theGeographer/stackOfBooks.glb',
    scale: [4, 4, 4]
  },
    {
    name: 'stackOfBooks2',
    path: 'assets/models/theGeographer/stackOfBooks2.glb',
    scale: [4, 4, 4]
  },
  {
    name: 'books',
    path: 'assets/models/theGeographer/books.glb',
    scale: [4, 4, 4]
  },
  {
    name: 'lens',
    path: 'assets/models/theGeographer/lens.glb',
    scale: [4, 4, 4]
  },
  {
    name: 'standLamp',
    path: 'assets/models/theGeographer/standLamp.glb',
    scale: [6, 6, 6]
  },
  {
    name: 'chair',
    path: 'assets/models/theGeographer/chair.glb',
    scale: [3, 3, 3]
  },
  {
    name: 'bookdummy',
    path: 'assets/models/theGeographer/bookdummy.glb',
    scale: [5, 5, 5]
  }
];

// 모델 로드 함수
export function loadGeographer(scene, onLoaded) {
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

      if (config.name === 'GeographerObject') GeographerObject = model;
      if (config.name === 'oldMap') oldMap = model;
      if (config.name === 'oldMap2') oldMap2 = model;
      if (config.name === 'openBook') openBook = model;
      if (config.name === 'openBook2') openBook2 = model;
      if (config.name === 'stackOfBooks') stackOfBooks = model;
      if (config.name === 'stackOfBooks2') stackOfBooks2 = model;
      if (config.name === 'books') books = model;
      if (config.name === 'lens') lens = model;
      if (config.name === 'standLamp') standLamp = model;
      if (config.name === 'chair') chair = model;
      if (config.name === 'bookdummy') bookdummy = model;
    });

    if (onLoaded) onLoaded();
  });
}

// 표시 여부 제어
export function setGeographerObjectsVisible(visible) {
  if (GeographerObject) GeographerObject.visible = visible;
  if (oldMap) oldMap.visible = visible;
  if (oldMap2) oldMap2.visible = visible;
  if (openBook) openBook.visible = visible;
  if (openBook2) openBook2.visible = visible;
  if (stackOfBooks) stackOfBooks.visible = visible;
  if (stackOfBooks2) stackOfBooks2.visible = visible;
  if (books) books.visible = visible;
  if (lens) lens.visible = visible;
  if (standLamp) standLamp.visible = visible;
  if (chair) chair.visible = visible;
  if (bookdummy) bookdummy.visible = visible;
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
export function updateGeographerOnPlanet(selectedPlanet, littlePrince) {
  if (!GeographerObject) return;

  if (selectedPlanet.userData.name === '지리학자의 별') {
    const planetCenter = selectedPlanet.position.clone();
    const princePos = littlePrince.position.clone();
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(littlePrince.quaternion);
    const offset = forward.clone().multiplyScalar(5.0);
    const GeographerPos = princePos.clone().add(offset);

    GeographerObject.position.copy(GeographerPos);

    // 행성 중심을 향해 정렬
    const toCenter = new THREE.Vector3().subVectors(planetCenter, GeographerPos).normalize();
    const modelDown = new THREE.Vector3(0, -1, 0);
    const q = new THREE.Quaternion().setFromUnitVectors(modelDown, toCenter);
    GeographerObject.position.copy(planetCenter.clone().addScaledVector(toCenter.negate(), selectedPlanet.geometry.boundingSphere.radius * selectedPlanet.scale.x + 1.5));
    GeographerObject.setRotationFromQuaternion(q);
    GeographerObject.rotateX(THREE.MathUtils.degToRad(-10));
    GeographerObject.rotateY(Math.PI + THREE.MathUtils.degToRad(20));
    
    placeObjectOnPlanetRelativeTo(
      oldMap,
      GeographerObject,
      selectedPlanet,
      new THREE.Vector3(6, 0, 3),
      new THREE.Vector3(0, 0, -5),
      new THREE.Euler(
        THREE.MathUtils.degToRad(110), 
        0, 
        THREE.MathUtils.degToRad(180)),
      0
    );
    placeObjectOnPlanetRelativeTo(
      oldMap2,
      GeographerObject,
      selectedPlanet,
      new THREE.Vector3(12, 0, 30),
      new THREE.Vector3(0, 0, -5),
      new THREE.Euler(
        THREE.MathUtils.degToRad(110), 
        0, 
        THREE.MathUtils.degToRad(180)),
      0
    );
    placeObjectOnPlanetRelativeTo(
        openBook,
        GeographerObject,
        selectedPlanet,
        new THREE.Vector3(-7, 0, 10),
        new THREE.Vector3(0, 0, -10),
        new THREE.Euler(
        THREE.MathUtils.degToRad(85),
        THREE.MathUtils.degToRad(0),
        THREE.MathUtils.degToRad(0)),
        0.0
    );
    placeObjectOnPlanetRelativeTo(
        openBook2,
        GeographerObject,
        selectedPlanet,
        new THREE.Vector3(10, 0, 7),
        new THREE.Vector3(0, 0, -10),
        new THREE.Euler(
        THREE.MathUtils.degToRad(85),
        THREE.MathUtils.degToRad(-10),
        THREE.MathUtils.degToRad(0)),
        0.0
    );

    placeObjectOnPlanetRelativeTo(
        stackOfBooks,
        GeographerObject,
        selectedPlanet,
        new THREE.Vector3(-5, 0, 0),
        new THREE.Vector3(0, 0, -1),
        new THREE.Euler(
        THREE.MathUtils.degToRad(0),
        THREE.MathUtils.degToRad(120),
        THREE.MathUtils.degToRad(0)),
        1.3
    );
    placeObjectOnPlanetRelativeTo(
        stackOfBooks2,
        GeographerObject,
        selectedPlanet,
        new THREE.Vector3(4, 0, -4),
        new THREE.Vector3(0, 0, -1),
        new THREE.Euler(
        THREE.MathUtils.degToRad(0),
        THREE.MathUtils.degToRad(120),
        THREE.MathUtils.degToRad(0)),
        1.3
    );
    placeObjectOnPlanetRelativeTo(
        books,
        GeographerObject,
        selectedPlanet,
        new THREE.Vector3(-8, 0, 6),
        new THREE.Vector3(0, 0, -1),
        new THREE.Euler(
        THREE.MathUtils.degToRad(15),
        THREE.MathUtils.degToRad(20),
        THREE.MathUtils.degToRad(0)),
        0.8
    );
    placeObjectOnPlanetRelativeTo(
        lens,
        GeographerObject,
        selectedPlanet,
        new THREE.Vector3(-4, 0, 20),
        new THREE.Vector3(0, 0, -1),
        new THREE.Euler(
        THREE.MathUtils.degToRad(90),
        THREE.MathUtils.degToRad(0),
        THREE.MathUtils.degToRad(0)),
        0.1
    );
    placeObjectOnPlanetRelativeTo(
        standLamp,
        GeographerObject,
        selectedPlanet,
        new THREE.Vector3(6, 0, 0),
        new THREE.Vector3(0, 0, -1),
        new THREE.Euler(
        THREE.MathUtils.degToRad(0),
        THREE.MathUtils.degToRad(0),
        THREE.MathUtils.degToRad(0)),
        2.8
    );
    placeObjectOnPlanetRelativeTo(
        chair,
        GeographerObject,
        selectedPlanet,
        new THREE.Vector3(18, 0, 22),
        new THREE.Vector3(0, 0, -1),
        new THREE.Euler(
        THREE.MathUtils.degToRad(45),
        THREE.MathUtils.degToRad(0),
        THREE.MathUtils.degToRad(0)),
        0.5
    );
    placeObjectOnPlanetRelativeTo(
        bookdummy,
        GeographerObject,
        selectedPlanet,
        new THREE.Vector3(-18, 0, 22),
        new THREE.Vector3(0, 0, -1),
        new THREE.Euler(
        THREE.MathUtils.degToRad(45),
        THREE.MathUtils.degToRad(0),
        THREE.MathUtils.degToRad(0)),
        0.5
    );
    setGeographerObjectsVisible(true);
  } else {
    setGeographerObjectsVisible(false);
  }

  

}


