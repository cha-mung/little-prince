import * as THREE from 'three';
import { OrbitControls } from 'https://unpkg.com/three@0.160.1/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.160.1/examples/jsm/loaders/GLTFLoader.js';

// 씬 & 카메라 & 렌더러
const scene = new THREE.Scene();
scene.background = new THREE.Color('black');

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 15);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 조명
scene.add(new THREE.AmbientLight(0xffffff, 0.5));
const light = new THREE.PointLight(0xffffff, 2);
light.position.set(0, 20, 20);
scene.add(light);

// 컨트롤
const controls = new OrbitControls(camera, renderer.domElement);
controls.autoRotate = true;
controls.autoRotateSpeed = 0.5;
controls.target.set(0, 0, 0);
controls.update();

// 별 배경
const starGeometry = new THREE.BufferGeometry();
const starCount = 1000;
const starPositions = [];
for (let i = 0; i < starCount; i++) {
  starPositions.push(
    (Math.random() - 0.5) * 1000,
    (Math.random() - 0.5) * 1000,
    (Math.random() - 0.5) * 1000
  );
}
starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 2.0 });
const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

// 행성 데이터
const planets = [
  { name: '왕의 별', position: [-50, 0, 20], color: '#ff6666', size: 10, quote: '명령은 이치에 맞아야 해.' },
  { name: '허영심 많은 자', position: [-40, 20, -5], color: '#ffcc00', size: 4, quote: '넌 나를 칭찬하기 위해 존재하잖아.' },
  { name: '술꾼의 별', position: [0, -50, -40], color: '#9999ff', size: 5, quote: '나는 부끄러워서 술을 마셔.' },
  { name: '사업가의 별', position: [40, -25, -30], color: '#66ff99', size: 7, quote: '나는 별을 소유하고 있어.' },
  { name: '점등원의 별', position: [70, 0, 0], color: '#ff99cc', size: 3.5, quote: '규칙은 지켜야 하니까!' },
  { name: '지리학자의 별', position: [0, 5, 15], color: '#ffffff', size: 5.5, quote: '나는 앉아서 관찰만 해.' }
];

const planetMeshes = [];
planets.forEach(data => {
  const geometry = new THREE.SphereGeometry(data.size, 32, 32);
  const material = new THREE.MeshStandardMaterial({ color: data.color });
  const sphere = new THREE.Mesh(geometry, material);
  sphere.position.set(...data.position);
  sphere.userData = { quote: data.quote, name: data.name };
  scene.add(sphere);
  planetMeshes.push(sphere);
});

// 요소 참조
const dialog = document.getElementById('dialog');
const tooltip = document.getElementById('tooltip');
const backBtn = document.getElementById('backBtn');

// 상태 변수
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let targetPlanet = null;
let selectedPlanet = null;
let startCamPos = null;
let targetCamPos = null;
let startTarget = null;
let targetTarget = null;
let camMoveFrame = 0;
const camMoveDuration = 60;
let inPlanetView = false;

let littlePrince;
const loader = new GLTFLoader();
loader.load('assets/models/LittlePrince.glb', (gltf) => {
  littlePrince = gltf.scene;
  littlePrince.scale.set(1.5, 1, 2); // 필요 시 크기 조절
  littlePrince.visible = false;
  scene.add(littlePrince);
});

// 툴팁: hover 시 행성 이름
window.addEventListener('mousemove', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(planetMeshes.filter(p => p.visible));

  if (intersects.length > 0) {
    const planet = intersects[0].object;
    tooltip.style.left = `${event.clientX + 10}px`;
    tooltip.style.top = `${event.clientY + 10}px`;
    tooltip.style.display = 'block';
    tooltip.textContent = planet.userData.name;
  } else {
    tooltip.style.display = 'none';
  }
});

// 클릭 시 확대 시작
window.addEventListener('click', (event) => {
  if (inPlanetView) return;

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(planetMeshes);

  if (intersects.length > 0) {
    const planet = intersects[0].object;
    targetPlanet = planet;

    dialog.textContent = `${planet.userData.name}: "${planet.userData.quote}"`;
    dialog.style.display = 'block';
    setTimeout(() => dialog.style.display = 'none', 5000);

    const r = planet.geometry.parameters.radius;
    const offset = new THREE.Vector3(0, r * 1.5, r * 2.5);
    startCamPos = camera.position.clone();
    targetCamPos = planet.position.clone().add(offset);

    startTarget = controls.target.clone();
    targetTarget = planet.position.clone();

    camMoveFrame = 0;
  }
});

// 돌아가기 버튼
backBtn.addEventListener('click', () => {
  planetMeshes.forEach(p => p.visible = true);
  camera.position.set(0, 5, 15);
  controls.target.set(0, 0, 0);
  controls.update();
  if (littlePrince) littlePrince.visible = false;

  controls.enabled = true;
  inPlanetView = false;
  selectedPlanet = null;
  backBtn.style.display = 'none';
});

// 애니메이션
function animate() {
  requestAnimationFrame(animate);
  controls.update();

  if (targetPlanet && camMoveFrame < camMoveDuration) {
    const alpha = camMoveFrame / camMoveDuration;
    camera.position.lerpVectors(startCamPos, targetCamPos, alpha);
    controls.target.lerpVectors(startTarget, targetTarget, alpha);
    camMoveFrame++;

    if (camMoveFrame === camMoveDuration) {
      planetMeshes.forEach(p => p.visible = (p === targetPlanet));
      selectedPlanet = targetPlanet;
      targetPlanet = null;
      inPlanetView = true;
      // controls.enabled = true;              // update()는 계속 되게
      // controls.autoRotate = false;         // 🔴 자동 회전 정지
      // controls.enableRotate = false;       // 🔴 수동 회전도 비활성화
      backBtn.style.display = 'block';
      if (littlePrince) {
        const planet = selectedPlanet;
        const r = planet.geometry.parameters.radius;
        const upOffset = new THREE.Vector3(0, r+0.5, 0); // 위쪽 약간 위에
        littlePrince.position.copy(planet.position).add(upOffset);
        littlePrince.visible = true;
      }
    }
  }

  renderer.render(scene, camera);
}
animate();

// 리사이징 대응
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
