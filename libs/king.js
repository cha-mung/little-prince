import * as THREE from 'three';
import { GLTFLoader } from 'https://unpkg.com/three@0.160.1/examples/jsm/loaders/GLTFLoader.js';

export let KingObject = null;
export let MouseObject = null;
export let furObject = null;
export let furBObject = null;
export let furCObject = null;
export let furDObject = null;
export let furObject_clone = null;
export let furBObject_clone = null;
export let furCObject_clone = null;
export let scrollObject = null;
export let scrollBObject = null;
export let scrollCObject = null;  
export let scrollpileObject = null;
export let scrollpileBObject = null;
export let scrollpileCObject = null;
export let stickObject = null;
export let stepperObject = null;

const modelConfigs = [
  { name: 'KingObject',       path: 'assets/models/theKing/King.glb',       scale: [5, 5, 5] },
  { name: 'MouseObject',       path: 'assets/models/theKing/mouse.glb',       scale: [4, 4, 4] },
  { name: 'furObject',         path: 'assets/models/theKing/fur3.glb',       scale: [2, 2, 2] },
  { name: 'furBObject',        path: 'assets/models/theKing/fur_b.glb',     scale: [2, 2, 2] },
  { name: 'furCObject',        path: 'assets/models/theKing/fur_c.glb',     scale: [2, 2, 2] },
  { name: 'furDObject',        path: 'assets/models/theKing/fur_d.glb',     scale: [2, 2, 2] },
  // clones of fur objects
  { name: 'furObject_clone',   path: 'assets/models/theKing/fur3.glb',       scale: [2, 2, 2] },
  { name: 'furBObject_clone',  path: 'assets/models/theKing/fur_b.glb',     scale: [2, 2, 2] },
  { name: 'furCObject_clone',  path: 'assets/models/theKing/fur_c.glb',     scale: [2, 2, 2] },
  { name: 'scrollObject',      path: 'assets/models/theKing/scroll.glb',     scale: [2, 2, 2] },
  { name: 'scrollBObject',     path: 'assets/models/theKing/scroll_b.glb',   scale: [2, 2, 2] },
  { name: 'scrollCObject',     path: 'assets/models/theKing/scroll_c.glb',   scale: [2, 2, 2] },
  { name: 'scrollpileObject',  path: 'assets/models/theKing/scrollpile.glb', scale: [2, 2, 2] },
  { name: 'scrollpileBObject', path: 'assets/models/theKing/scrollpile_b.glb',scale: [2, 2, 2] },
  { name: 'scrollpileCObject', path: 'assets/models/theKing/scrollpile_c.glb',scale: [2, 2, 2] },
  { name: 'stickObject',       path: 'assets/models/theKing/stick.glb',      scale: [2, 2, 2] },
  { name: 'stepperObject',     path: 'assets/models/theKing/stepper.glb',    scale: [2, 2, 2] }
];

export function loadKing(scene, onLoaded) {
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
      model.visible = false;
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

      // assign to variables
      switch(config.name) {
        case 'KingObject':       KingObject = model; break;
        case 'MouseObject':     MouseObject = model; break;
        case 'furObject':         furObject = model; break;
        case 'furBObject':        furBObject = model; break;
        case 'furCObject':        furCObject = model; break;
        case 'furDObject':        furDObject = model; break;
        case 'furObject_clone':   furObject_clone = model; break;
        case 'furBObject_clone':  furBObject_clone = model; break;
        case 'furCObject_clone':  furCObject_clone = model; break;
        case 'scrollObject':      scrollObject = model; break;
        case 'scrollBObject':     scrollBObject = model; break;
        case 'scrollCObject':     scrollCObject = model; break;
        case 'scrollpileObject':  scrollpileObject = model; break;
        case 'scrollpileBObject': scrollpileBObject = model; break;
        case 'scrollpileCObject': scrollpileCObject = model; break;
        case 'stickObject':       stickObject = model; break;
        case 'stepperObject':     stepperObject = model; break;
      }
    });

    if (onLoaded) onLoaded();
  });
}

export function setKingObjectsVisible(visible) {
  [KingObject, MouseObject, furObject, furBObject, furCObject, furDObject,
   furObject_clone, furBObject_clone, furCObject_clone,
   scrollObject, scrollBObject, scrollCObject,
   scrollpileObject, scrollpileBObject, scrollpileCObject,
   stickObject, stepperObject]
    .forEach(obj => { if (obj) obj.visible = visible; });
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
  targetObj, referenceObj, planet, offset,
  forwardHint, additionalRotationEuler = new THREE.Euler(0, 0, 0),
  heightOffset = 0.05
) {
  if (!targetObj || !referenceObj || !planet) return;

  const planetCenter = planet.position.clone();
  const planetRadius = planet.geometry.boundingSphere.radius * planet.scale.x;

  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(referenceObj.quaternion);
  const right   = new THREE.Vector3(1, 0, 0).applyQuaternion(referenceObj.quaternion);
  const up      = new THREE.Vector3(0, 1, 0).applyQuaternion(referenceObj.quaternion);

  const worldOffset = new THREE.Vector3()
    .addScaledVector(right, offset.x)
    .addScaledVector(up, offset.y)
    .addScaledVector(forward, offset.z);

  const rawPos    = referenceObj.position.clone().add(worldOffset);
  const toCenter  = new THREE.Vector3().subVectors(planetCenter, rawPos).normalize();
  const finalPos  = planetCenter.clone().addScaledVector(toCenter.negate(), planetRadius + heightOffset);
  targetObj.position.copy(finalPos);

  const actualForward = forwardHint.clone().applyQuaternion(referenceObj.quaternion);
  const baseQuat = makeQuaternionFromUpAndForward(toCenter.clone(), actualForward);
  targetObj.setRotationFromQuaternion(baseQuat);
  targetObj.rotateX(additionalRotationEuler.x);
  targetObj.rotateY(additionalRotationEuler.y);
  targetObj.rotateZ(additionalRotationEuler.z);
}

export function updateKingOnPlanet(selectedPlanet, littlePrince) {
  if (!KingObject) return;

  if (selectedPlanet.userData.name === '왕의 별') {
    const planetCenter = selectedPlanet.position.clone();
    const princePos    = littlePrince.position.clone();
    const forward      = new THREE.Vector3(0, 0, -1).applyQuaternion(littlePrince.quaternion);
    const offset       = forward.clone().multiplyScalar(3.5);
    const kingPos      = princePos.clone().add(offset);
    KingObject.position.copy(kingPos);

    const toCenter = new THREE.Vector3().subVectors(planetCenter, kingPos).normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), toCenter);
    KingObject.setRotationFromQuaternion(q);
    KingObject.rotateY(Math.PI + THREE.MathUtils.degToRad(30));

    placeObjectOnPlanetRelativeTo(furObject, KingObject, selectedPlanet,    new THREE.Vector3(15, 10, 10), new THREE.Vector3(0, 0, 1), new THREE.Euler(0, 90, 0), -0.4);
    placeObjectOnPlanetRelativeTo(furBObject, KingObject, selectedPlanet,   new THREE.Vector3(-5, 0, 6),   new THREE.Vector3(0, 0, 1), new THREE.Euler(0, 20, 0), -0.65);
    placeObjectOnPlanetRelativeTo(furCObject, KingObject, selectedPlanet,   new THREE.Vector3(5, 12, -16), new THREE.Vector3(0, 0, 1), new THREE.Euler(0, -40, 0), -0.65);
    placeObjectOnPlanetRelativeTo(furDObject, KingObject, selectedPlanet,   new THREE.Vector3(3, -8, 5),   new THREE.Vector3(0, 0, 1), new THREE.Euler(0, 60, 0), -0.65);

    // fur clones 배치
    placeObjectOnPlanetRelativeTo(furObject_clone, KingObject, selectedPlanet,  new THREE.Vector3(-180, 3, -6),  new THREE.Vector3(0, 0, 1), new THREE.Euler(0, 45, 0), -0.4);
    placeObjectOnPlanetRelativeTo(furBObject_clone, KingObject, selectedPlanet, new THREE.Vector3(0, 0, -100),  new THREE.Vector3(0, 0, 1), new THREE.Euler(0, -30, 0), -0.65);
    placeObjectOnPlanetRelativeTo(furCObject_clone, KingObject, selectedPlanet, new THREE.Vector3(-60, 10, -50), new THREE.Vector3(0, 0, 1), new THREE.Euler(0, 20, 0), -0.65);

    placeObjectOnPlanetRelativeTo(
      scrollpileObject,
      KingObject,
      selectedPlanet,
      new THREE.Vector3(20,0,0),
      new THREE.Vector3(0, 0, 1),
      new THREE.Euler(THREE.MathUtils.degToRad(40), 0, 0),
      0.05
    );

    placeObjectOnPlanetRelativeTo(
      scrollpileBObject,
      scrollpileObject,
      selectedPlanet,
      new THREE.Vector3(80,0,0),
      new THREE.Vector3(0, 0, 1),
      new THREE.Euler(THREE.MathUtils.degToRad(40), 0, 0),
      0.05
    );

    placeObjectOnPlanetRelativeTo(
      scrollpileCObject,
      scrollpileBObject,
      selectedPlanet,
      new THREE.Vector3(300,0,0),
      new THREE.Vector3(0, 0, 1),
      new THREE.Euler(THREE.MathUtils.degToRad(20), 0, 0),
      0.8
    );

    placeObjectOnPlanetRelativeTo(
      scrollObject,
      KingObject,
      selectedPlanet,
      new THREE.Vector3(150, -30, 100),
      new THREE.Vector3(0, 0, THREE.MathUtils.degToRad(30)),
      new THREE.Euler(THREE.MathUtils.degToRad(90), THREE.MathUtils.degToRad(25), THREE.MathUtils.degToRad(-35)),
      0.1
    );

    placeObjectOnPlanetRelativeTo(
      scrollBObject,
      KingObject,
      selectedPlanet,
      new THREE.Vector3(0, 0, -450),
      new THREE.Vector3(0, 0, 1),
      new THREE.Euler(THREE.MathUtils.degToRad(90), THREE.MathUtils.degToRad(25), THREE.MathUtils.degToRad(-35)),
      0.25
    );

    placeObjectOnPlanetRelativeTo(
      scrollCObject,
      KingObject,
      selectedPlanet,
      new THREE.Vector3(100, -15, -120),
      new THREE.Vector3(0, 0, 1),
      new THREE.Euler(THREE.MathUtils.degToRad(90), THREE.MathUtils.degToRad(25), THREE.MathUtils.degToRad(-35)),
      0.1
    );
    placeObjectOnPlanetRelativeTo(MouseObject, scrollpileBObject, selectedPlanet,
      new THREE.Vector3(0, 180, 0),
      new THREE.Vector3(0, 0, -1),
      new THREE.Euler(0, 0, 0), 
      1.35 
    );
    placeObjectOnPlanetRelativeTo(stickObject,      KingObject, selectedPlanet, new THREE.Vector3(40, 90, 10),   new THREE.Vector3(0, 0, 1), new THREE.Euler(45.3, 0, 0), 0.1);
    placeObjectOnPlanetRelativeTo(stepperObject,    KingObject, selectedPlanet, new THREE.Vector3(-5, 0, 0),     new THREE.Vector3(0, 0, 1), new THREE.Euler(0.4, 0.15, 0), 0.35);

    setKingObjectsVisible(true);
  } else {
    setKingObjectsVisible(false);
  }
}

//인터랙션
let dialogueState = 0;
export function handlekingClick(event, { camera, collectRocketFromPlanet }) {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const targets = [KingObject, MouseObject].filter(x => x);
  const intersects = raycaster.intersectObjects(targets, true);
  if (!intersects.length) return;
  let picked = intersects[0].object;
  while (picked && picked !== KingObject && picked !== MouseObject) {
    picked = picked.parent;
  }
  // 1) 쥐 클릭 처리
  if (MouseObject && picked && picked === MouseObject) {
    if (dialogueState === 2) {
      dialogueState = 3;
      showDialog("...귀엽다.");
    }
    return;
  }
  // 2) 왕 클릭 처리
  if (picked === KingObject) {
    switch (dialogueState) {
      case 0:
        dialogueState = 1;
        showDialog(
          "오, 신하가 하나 오는구나!"
        );
        break;
      case 1:
        dialogueState = 2;
        showDialog(
          "흠, 흠! 내 별 어딘가에 늙은 쥐 한 마리가 살고 있다. 그에게 사형을 선고하라."
        );
        break;
      case 3:
        dialogueState = 4;
        showDialog(
          "사형선고를 내리기 싫다고? 떠나겠다니? 그건 안 돼."
        );
        break;
      case 4:
        dialogueState = 5;
        showDialog(
          "......"
        );
        break;
      case 5:
        dialogueState = 6;
        showDialog(
          "그럼, 짐은 너를 대사로 임명하노라. 별을 떠나거라."
        );
        if (collectRocketFromPlanet) collectRocketFromPlanet('왕의 별');
        break;
      case 6:
        showDialog(
          "... 별을 떠나거라."
        );
        break;
      default:
        // 이후 클릭은 무시하거나 다른 행동
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