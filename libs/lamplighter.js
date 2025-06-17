import * as THREE from 'three';
import { GLTFLoader } from 'https://unpkg.com/three@0.160.1/examples/jsm/loaders/GLTFLoader.js';
// import * as dat from 'https://cdn.jsdelivr.net/npm/dat.gui@0.7.9/build/dat.gui.module.js'; //UI

// 전역 모델 변수
export let LampLighterObject = null;
export let lamp_post = null;
export let bed = null;
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
    });

    if (onLoaded) onLoaded();
  });
}

// 표시 여부 제어
export function setLampLighterObjectsVisible(visible) {
  if (LampLighterObject) LampLighterObject.visible = visible;
  if (lamp_post) lamp_post.visible = visible;
  if (bed) bed.visible = visible;
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
      new THREE.Vector3(-10, 0, -5),
      new THREE.Vector3(0, 0, -1),
      new THREE.Euler(
        THREE.MathUtils.degToRad(0),
        THREE.MathUtils.degToRad(180),
        THREE.MathUtils.degToRad(0)),
      0.6
    );

    lampPostLight = new THREE.PointLight(0xffcc66, 70, 13, 1);
    lampPostLight.position.set(-0.5, 0.4, 0.9);
    lamp_post.add(lampPostLight);

    fire = new THREE.PointLight(0xff0000, 10, 4.0, 1);
    fire.position.set(-0.5, 0.24, -0.5);
    LampLighterObject.add(fire);


    // ✅ dat.GUI 설정 추가
    // const gui = new dat.GUI();
    // const lightParams = {
    //   visible: true,
    //   intensity: lampPostLight.intensity,
    //   distance: lampPostLight.distance,
    //   x: lampPostLight.position.x,
    //   y: lampPostLight.position.y,
    //   z: lampPostLight.position.z
    // };

    // gui.add(fire, 'visible').name('불 켜기').onChange(val => fire.visible = val);
    // gui.add(lightParams, 'visible').name('램프 켜기').onChange(val => lampPostLight.visible = val);
    // gui.add(lightParams, 'intensity', 0, 100).name('조명 밝기').onChange(val => lampPostLight.intensity = val);
    // gui.add(lightParams, 'distance', 0, 50).name('조명 거리').onChange(val => lampPostLight.distance = val);
    // gui.add(lightParams, 'y', -5, 10).name('램프 높이').onChange(val => lampPostLight.position.y = val);
    // gui.add(lightParams, 'x', -5, 10).name('램프 x').onChange(val => lampPostLight.position.x = val);
    // gui.add(lightParams, 'z', -5, 10).name('램프 z').onChange(val => lampPostLight.position.z = val);

    setLampLighterObjectsVisible(true);
  } else {
    setLampLighterObjectsVisible(false);
  }
}
