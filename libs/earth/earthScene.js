import * as THREE from 'three';
import { GLTFLoader } from 'https://unpkg.com/three@0.160.1/examples/jsm/loaders/GLTFLoader.js';

let camera, scene, renderer;
let prince, fox, sittingPrince;
let mixer = null, princeAction = null;
const clock = new THREE.Clock();

const keys = { w: false, a: false, s: false, d: false };
const moveSpeed = 0.2;
const originX = 0, originZ = 0;

let clouds = [];
let dialogIndex = 0, dialogTimer = null;
let foxClicked = false, princeClicked = false;

const princeMeshes = [];
const foxMeshes = [];
const clickableObjects = [];

let tooltip;  
let isDialogPlaying = false;  // ← 대화 중인지 여부

const dialog = document.getElementById('dialog');
const dialogLines = [
  '여기가 지구? 푸르고 상쾌하다',
  '안녕 넌 누구니? 나랑 같이 놀자',
  '(여우를 클릭하세요)'
];
const foxDialogLines = [
  '<span style="color: orange">난 여우야. 난 슬퍼 미안</span>',
  '<span style="color: orange">난 길들여지지 않았거든</span>',
  '길들인다는 게 무슨 의미야?',
  '<span style="color: orange">길들인다는 건… 서로에게 특별해지는 거야</span>',
  '(어린왕자를 클릭하여 여우 옆에 앉으세요)'
];
const finalDialogLines = [
  '<span style="color: orange">예를 들어 만약 네가 오후 네 시에 온다면</span>',
  '<span style="color: orange">나는 세 시부터 행복해지기 시작하겠지</span>',
  '그래… 길들인다는 건 쉽게 잊히지 않는다는 거구나',
  '아 꽃이 한 송이 있었어. 그 꽃이 나를 길들인 것 같아',
  '보고 싶어 장미가',
  '<span style="color: orange">그리고 마음으로 책임지는 거지</span>',
  '응… 나 이제 정말 조금은 어른이 된 것 같아'
];

init();
animate();

function init() {
  tooltip = document.getElementById('tooltip');

  scene = new THREE.Scene();
  // 배경 그라데이션
  const canvasBG = document.createElement('canvas');
  canvasBG.width = 1; canvasBG.height = 256;
  const ctx = canvasBG.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#87ceeb');
  grad.addColorStop(0.5, '#87ceeb');
  grad.addColorStop(1, '#4682b4');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1, 256);
  scene.background = new THREE.CanvasTexture(canvasBG);

  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(-3.7, 0.1, 10);
  camera.rotation.set(THREE.MathUtils.degToRad(10), 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // 조명
  const ambientLight = new THREE.AmbientLight(0xffffff, 1);
  const dirLight = new THREE.DirectionalLight(0xffffff, 2);
  dirLight.position.set(5, 10, 7);
  scene.add(ambientLight, dirLight);

  // 지면
  const loader = new THREE.TextureLoader();
  const groundGeo = new THREE.PlaneGeometry(200, 200, 128, 128);
  const pos = groundGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i);
    pos.setZ(i, Math.sin(x * 0.1) * Math.cos(y * 0.1) * 2);
  }
  groundGeo.computeVertexNormals();
  const grassTex = loader.load('../../assets/textures/grass.png');
  grassTex.wrapS = grassTex.wrapT = THREE.RepeatWrapping;
  grassTex.repeat.set(20, 20);
  const ground = new THREE.Mesh(
    groundGeo,
    new THREE.MeshLambertMaterial({ map: grassTex })
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  // 구름
  const cloudTex = loader.load('../../assets/textures/cloud.png');
  for (let i = 0; i < 10; i++) {
    const mat = new THREE.SpriteMaterial({
      map: cloudTex,
      transparent: true,
      opacity: Math.random() * 0.3 + 0.4,
      depthWrite: false
    });
    const cloud = new THREE.Sprite(mat);
    const s = Math.random() * 20 + 20;
    cloud.scale.set(s, s * 0.6, 1);
    cloud.position.set(
      Math.random() * 200 - 100,
      40 + Math.random() * 10,
      -50 - Math.random() * 50
    );
    cloud.rotation.z = Math.random() * 0.2 - 0.1;
    scene.add(cloud);
    clouds.push(cloud);
  }

  // Prince 모델
  const gltfLoader = new GLTFLoader();
  gltfLoader.load('../../assets/models/LittlePrince.glb', (gltf) => {
    prince = gltf.scene;
    prince.scale.set(4, 4, 4);
    prince.position.set(originX, 1.5, originZ);
    prince.traverse(child => {
      if (child.isMesh) {
        princeMeshes.push(child);
        clickableObjects.push(child);
      }
    });
    scene.add(prince);

    mixer = new THREE.AnimationMixer(prince);
    if (gltf.animations.length) {
      princeAction = mixer.clipAction(gltf.animations[0]);
      princeAction.play();
      princeAction.paused = true;
    }

    showDialogs(dialogLines);

    // Fox 모델
    const foxPos = prince.position.clone().add(new THREE.Vector3(-3, -1, 0));
    loadExtraModel('../../assets/models/ending/fox.glb', foxPos, 2, (obj) => {
      fox = obj;
      fox.traverse(child => {
        if (child.isMesh) {
          foxMeshes.push(child);
          clickableObjects.push(child);
        }
      });
    });
  });

  // 이벤트 등록
  window.addEventListener('resize', onWindowResize);
  document.addEventListener('keydown', e => {
    if (e.key.toLowerCase() in keys) keys[e.key.toLowerCase()] = true;
  });
  document.addEventListener('keyup', e => {
    if (e.key.toLowerCase() in keys) keys[e.key.toLowerCase()] = false;
  });
  window.addEventListener('click', onSceneClick);
  window.addEventListener('mousemove', onMouseMove);
}

function loadExtraModel(path, position, scale = 1, onLoad) {
  const loader = new GLTFLoader();
  loader.load(path, (gltf) => {
    const obj = gltf.scene;
    obj.position.copy(position);
    obj.scale.set(scale, scale, scale);
    scene.add(obj);
    if (onLoad) onLoad(obj);
  });
}

function onSceneClick(event) {
  // 대화가 재생 중이면 클릭 무시
  if (isDialogPlaying) return;

  const mouse = new THREE.Vector2(
    (event.clientX / window.innerWidth) * 2 - 1,
    -(event.clientY / window.innerHeight) * 2 + 1
  );
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(clickableObjects, false);
  if (!intersects.length) return;

  const clicked = intersects[0].object;

  // 여우 클릭 → 여우 대사
  if (!foxClicked && foxMeshes.includes(clicked)) {
    foxClicked = true;
    showDialogs(foxDialogLines);
    return;
  }

  // 왕자 클릭 → 최종 대사
  if (foxClicked && !princeClicked && princeMeshes.includes(clicked)) {
    princeClicked = true;
    scene.remove(prince);
    const sitPos = fox.position.clone().add(new THREE.Vector3(1.8, 0, 0));
    loadExtraModel('../../assets/models/ending/sittingPrince.glb', sitPos, 2, (obj) => {
      sittingPrince = obj;
      sittingPrince.rotation.y = Math.PI / 2;
      showDialogs(finalDialogLines);
    });
  }
}

function onMouseMove(event) {
  const mouse = new THREE.Vector2(
    (event.clientX / window.innerWidth) * 2 - 1,
    -(event.clientY / window.innerHeight) * 2 + 1
  );
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(clickableObjects, false);

  let label = null;
  if (intersects.length) {
    const hit = intersects[0].object;
    if (!foxClicked && foxMeshes.includes(hit)) {
      label = '여우';
    } else if (!princeClicked && princeMeshes.includes(hit)) {
      label = '어린왕자';
    }
  }

  if (label) {
    document.body.style.cursor = 'pointer';
    tooltip.style.display = 'block';
    tooltip.textContent = label;
    tooltip.style.left = (event.clientX + 10) + 'px';
    tooltip.style.top  = (event.clientY + 10) + 'px';
  } else {
    document.body.style.cursor = 'default';
    tooltip.style.display = 'none';
  }
}

function showDialogs(lines, onComplete) {
  isDialogPlaying = true;
  dialogIndex = 0;
  dialog.style.display = 'block';
  clearInterval(dialogTimer);

  // 첫 문장 즉시
  if (lines.length > 0) {
    dialog.innerHTML = lines[dialogIndex++];
  }

  // 이후 자동 진행
  dialogTimer = setInterval(() => {
    if (dialogIndex >= lines.length) {
      clearInterval(dialogTimer);
      dialog.style.display = 'none';
      isDialogPlaying = false;    // ← 대화 끝
      if (lines === finalDialogLines) {
        showEndMessage();
      }

      if (onComplete) onComplete();
      return;
    }
    dialog.innerHTML = lines[dialogIndex++];
  }, 2500);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function updatePrinceMovement() {
  if (!prince || foxClicked) return;

  const dir = new THREE.Vector3();
  if (keys.w) dir.z -= 1;
  if (keys.s) dir.z += 1;
  if (keys.a) dir.x -= 1;
  if (keys.d) dir.x += 1;

  if (dir.lengthSq() > 0) {
    dir.normalize();
    prince.position.add(dir.multiplyScalar(moveSpeed));
    const angle = Math.atan2(dir.x, dir.z);
    prince.rotation.y = angle + Math.PI;
    playPrinceWalk();
  } else {
    pausePrinceWalk();
  }

  prince.position.x = THREE.MathUtils.clamp(prince.position.x, -10, 1);
  prince.position.z = THREE.MathUtils.clamp(prince.position.z, -10, 2);
}

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  updatePrinceMovement();
  if (mixer) mixer.update(delta);
  clouds.forEach(c => {
    c.position.x += 0.05;
    if (c.position.x > 120) c.position.x = -120;
  });
  renderer.render(scene, camera);
}

function playPrinceWalk() {
  if (princeAction) princeAction.paused = false;
}
function pausePrinceWalk() {
  if (princeAction) princeAction.paused = true;
}
function showEndMessage() {
  const endMessage = document.getElementById('endMessage');
  endMessage.style.display = 'block';

  // 약간의 지연 후 서서히 나타남
  setTimeout(() => {
    endMessage.style.opacity = 1;
  }, 500);
}