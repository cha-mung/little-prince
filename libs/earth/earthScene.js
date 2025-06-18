import * as THREE from 'three';
import { GLTFLoader } from 'https://unpkg.com/three@0.160.1/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'https://unpkg.com/three@0.160.1/examples/jsm/controls/OrbitControls.js';
import { setupPrinceControls } from './princeController.js';

let camera, scene, renderer, controls, prince;

init();
animate();

function init() {
  // 기본 설정
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 5, 10);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // 조명
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(5, 10, 7);
  scene.add(ambientLight, dirLight);

  // 초원 바닥
  const textureLoader = new THREE.TextureLoader();
  const grassTexture = textureLoader.load('../../assets/textures/grass.png');
  grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;
  grassTexture.repeat.set(20, 20);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.MeshLambertMaterial({ map: grassTexture })
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  // 어린왕자 모델 로드
  const loader = new GLTFLoader();
  loader.load('../../assets/models/LittlePrince.glb', (gltf) => {
    prince = gltf.scene;
    prince.scale.set(2, 2, 2);
    prince.position.set(0, 1, 0);
    scene.add(prince);
    setupPrinceControls(prince, camera); // 이동 및 카메라 추적 설정
  });

  // OrbitControls (디버깅용, 선택)
  controls = new OrbitControls(camera, renderer.domElement);

  // 창 크기 대응
  window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
