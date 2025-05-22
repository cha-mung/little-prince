import * as THREE from 'three';
import { OrbitControls } from 'https://unpkg.com/three@0.160.1/examples/jsm/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color('black');

// 카메라
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 15);

// 렌더러
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 조명
scene.add(new THREE.AmbientLight(0xffffff, 0.5)); // 전역광
const light = new THREE.PointLight(0xffffff, 2);
light.position.set(0, 20, 20);
scene.add(light);

// 컨트롤
const controls = new OrbitControls(camera, renderer.domElement);
controls.autoRotate = true;
controls.autoRotateSpeed = 0.5;

// 행성 데이터
const planets = [
  { name: '왕의 별', position: [-50, 0, 20], color: '#ff6666', quote: '명령은 이치에 맞아야 해.' },
  { name: '허영심 많은 자', position: [-40, 20, -5], color: '#ffcc00', quote: '넌 나를 칭찬하기 위해 존재하잖아.' },
  { name: '술꾼의 별', position: [0, -50, -40], color: '#9999ff', quote: '나는 부끄러워서 술을 마셔.' },
  { name: '사업가의 별', position: [40, -25, -30], color: '#66ff99', quote: '나는 별을 소유하고 있어.' },
  { name: '점등원의 별', position: [70, 0, 0], color: '#ff99cc', quote: '규칙은 지켜야 하니까!' },
  { name: '지리학자의 별', position: [0, 5, 15], color: '#ffffff', quote: '나는 앉아서 관찰만 해.' }
];

const planetMeshes = [];
planets.forEach(data => {
  const geometry = new THREE.SphereGeometry(5, 32, 32);
  const material = new THREE.MeshStandardMaterial({ color: data.color });
  const sphere = new THREE.Mesh(geometry, material);
  sphere.position.set(...data.position);
  sphere.userData = { quote: data.quote, name: data.name };
  scene.add(sphere);
  planetMeshes.push(sphere);
});

// 별빛 배경
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

// 마우스 관련
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const dialog = document.getElementById('dialog');
const tooltip = document.getElementById('tooltip');

let targetPlanet = null;
let targetCamPos = null;
let startCamPos = null;
let camMoveFrame = 0;
const camMoveDuration = 60;

// hover 시 이름 툴팁
window.addEventListener('mousemove', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(planetMeshes);

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

// 클릭 시 카메라 이동 + 대사
window.addEventListener('click', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(planetMeshes);

  if (intersects.length > 0) {
    const planet = intersects[0].object;
    targetPlanet = planet;

    // 대사 출력
    dialog.textContent = `${planet.userData.name}: "${planet.userData.quote}"`;
    dialog.style.display = 'block';
    setTimeout(() => {
      dialog.style.display = 'none';
    }, 5000);

    // 카메라 이동 준비
    const offset = new THREE.Vector3(0, 10, 15); // 고정된 카메라 방향
    startCamPos = camera.position.clone();
    targetCamPos = new THREE.Vector3().copy(planet.position).add(offset);
    camMoveFrame = 0;
  }
});

// 애니메이션 루프
function animate() {
  requestAnimationFrame(animate);
  controls.update();

  if (targetPlanet && camMoveFrame < camMoveDuration) {
    const alpha = camMoveFrame / camMoveDuration;
    camera.position.lerpVectors(startCamPos, targetCamPos, alpha);
    camMoveFrame++;
  }

  // 항상 바라보게
  if (targetPlanet) {
    camera.lookAt(targetPlanet.position);
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
