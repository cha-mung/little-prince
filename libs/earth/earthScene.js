import * as THREE from 'three';
import { GLTFLoader } from 'https://unpkg.com/three@0.160.1/examples/jsm/loaders/GLTFLoader.js';

let camera, scene, renderer, prince;
let mixer = null;
let princeAction = null;
const clock = new THREE.Clock();

const keys = { w: false, a: false, s: false, d: false };
const moveSpeed = 0.2;

const originX = 0;
const originZ = 0;

let clouds = [];

init();
animate();

function init() {
  scene = new THREE.Scene();

  // 하늘 배경 (그라디언트)
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  const gradient = context.createLinearGradient(0, 0, 0, 256);
  gradient.addColorStop(0, '#87ceeb');
  gradient.addColorStop(0.5, '#87ceeb');
  gradient.addColorStop(1, '#4682b4');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 1, 256);
  scene.background = new THREE.CanvasTexture(canvas);

  // 카메라 설정
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(-3.7, 0.1, 10);
  camera.rotation.set(THREE.MathUtils.degToRad(10), 0, 0);

  // 렌더러 설정
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // 조명
  const ambientLight = new THREE.AmbientLight(0xffffff, 1);
  const dirLight = new THREE.DirectionalLight(0xffffff, 2);
  dirLight.position.set(5, 10, 7);
  scene.add(ambientLight, dirLight);

  // 텍스처 로더
  const textureLoader = new THREE.TextureLoader();

  // 지형 생성
  const geometry = new THREE.PlaneGeometry(200, 200, 128, 128);
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    const height = Math.sin(x * 0.1) * Math.cos(y * 0.1) * 2;
    position.setZ(i, height);
  }
  geometry.computeVertexNormals();

  const grassTexture = textureLoader.load('../../assets/textures/grass.png');
  grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;
  grassTexture.repeat.set(20, 20);

  const ground = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({ map: grassTexture }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // 구름 생성
  const cloudTexture = textureLoader.load('../../assets/textures/cloud.png');
  for (let i = 0; i < 10; i++) {
    const material = new THREE.SpriteMaterial({
      map: cloudTexture,
      transparent: true,
      opacity: Math.random() * 0.3 + 0.4,
      depthWrite: false,
    });
    const cloud = new THREE.Sprite(material);
    const scale = Math.random() * 20 + 20;
    cloud.scale.set(scale, scale * 0.6, 1);
    cloud.position.set(Math.random() * 200 - 100, 40 + Math.random() * 10, -50 - Math.random() * 50);
    cloud.rotation.z = Math.random() * 0.2 - 0.1;
    scene.add(cloud);
    clouds.push(cloud);
  }

  // 어린왕자 모델 로드 및 애니메이션 설정
  const loader = new GLTFLoader();
  loader.load('../../assets/models/LittlePrince.glb', (gltf) => {
    prince = gltf.scene;
    prince.scale.set(4, 4, 4);
    prince.position.set(originX, 1.5, originZ);
    scene.add(prince);

    mixer = new THREE.AnimationMixer(prince);
    if (gltf.animations && gltf.animations.length > 0) {
      princeAction = mixer.clipAction(gltf.animations[0]);
      princeAction.play();
      princeAction.paused = true;
    }

    // 👇 왕자 로드 완료 후 나머지 모델도 -X 방향에 순차 배치
    loadExtraModel('../../assets/models/ending/fox.glb', prince.position.clone().add(new THREE.Vector3(-3, -1, 0)), 2);
    loadExtraModel('../../assets/models/ending/sittingPrince.glb', prince.position.clone().add(new THREE.Vector3(-9, 0, 0)), 2);
  });

  // 키 이벤트
  document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() in keys) keys[e.key.toLowerCase()] = true;
  });
  document.addEventListener('keyup', (e) => {
    if (e.key.toLowerCase() in keys) keys[e.key.toLowerCase()] = false;
  });

  window.addEventListener('resize', onWindowResize);
}

function loadExtraModel(path, position, scale = 1) {
  const loader = new GLTFLoader();
  loader.load(path, (gltf) => {
    const obj = gltf.scene;
    obj.position.copy(position);
    obj.scale.set(scale, scale, scale);
    scene.add(obj);
  });
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function updatePrinceMovement() {
  if (!prince) return;

  const direction = new THREE.Vector3();
  if (keys.w) direction.z -= 1;
  if (keys.s) direction.z += 1;
  if (keys.a) direction.x -= 1;
  if (keys.d) direction.x += 1;

  if (direction.lengthSq() > 0) {
    direction.normalize();
    const moveVector = direction.clone().multiplyScalar(moveSpeed);
    prince.position.add(moveVector);

    const angle = Math.atan2(direction.x, direction.z);
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

  clouds.forEach((cloud) => {
    cloud.position.x += 0.05;
    if (cloud.position.x > 120) cloud.position.x = -120;
  });

  renderer.render(scene, camera);
}

function playPrinceWalk() {
  if (princeAction) princeAction.paused = false;
}
function pausePrinceWalk() {
  if (princeAction) princeAction.paused = true;
}
