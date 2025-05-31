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
let mixer;
let princeAction;

const loader = new GLTFLoader();
loader.load('assets/models/LittlePrince.glb', (gltf) => {
  littlePrince = gltf.scene;
  littlePrince.scale.set(1.5, 1, 2); // 필요 시 크기 조절
  littlePrince.visible = false;
  scene.add(littlePrince);
    // 애니메이션 처리
  mixer = new THREE.AnimationMixer(littlePrince);
  if (gltf.animations && gltf.animations.length > 0) {
    princeAction = mixer.clipAction(gltf.animations[0]);
    princeAction.play();  // 일단 play하고
    princeAction.paused = true;  // 멈춰두기
  }
});

let princeTheta = Math.PI / 2; // 세로 각도 (π/2면 적도)
let princePhi = 0;             // 가로 각도 (0~2π)
let princeRadius = 1;          // 행성 반지름 + 약간 위

const keyState = {};

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

window.addEventListener('keydown', (e) => keyState[e.key.toLowerCase()] = true);
window.addEventListener('keyup', (e) => keyState[e.key.toLowerCase()] = false);

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

  // 줌인 중일 때 카메라 이동 & 타겟 이동
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

      backBtn.style.display = 'block';

      // 왕자 초기 위치 설정
      if (littlePrince) {
        const r = selectedPlanet.geometry.parameters.radius;
        princeRadius = r + 1.5;
        princeTheta = Math.PI / 2;
        princePhi = 0;

        const x = princeRadius * Math.sin(princeTheta) * Math.cos(princePhi);
        const y = princeRadius * Math.cos(princeTheta);
        const z = princeRadius * Math.sin(princeTheta) * Math.sin(princePhi);

        const pos = new THREE.Vector3(
          selectedPlanet.position.x + x,
          selectedPlanet.position.y + y,
          selectedPlanet.position.z + z
        );
        const dir = new THREE.Vector3().subVectors(selectedPlanet.position, pos).normalize(); // 행성 중심 → 왕자
        const radius = selectedPlanet.geometry.parameters.radius;
        const offset = 0.5;

        littlePrince.position.copy(
          new THREE.Vector3().copy(selectedPlanet.position).addScaledVector(dir.negate(), radius + offset)
        );

        // 왕자의 Z− 축을 행성 중심으로 향하게 회전
        const modelZMinus = new THREE.Vector3(0, 1, 0); // 왕자 모델의 발 방향
        const q = new THREE.Quaternion().setFromUnitVectors(modelZMinus, dir);
        littlePrince.setRotationFromQuaternion(q);

        littlePrince.visible = true;
      }

    }
  }

  // WASD 이동 처리 (행성 위 걷기)
  if (inPlanetView && littlePrince && selectedPlanet) {
    const moveSpeed = 0.03;

    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(littlePrince.quaternion); // 정면
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(littlePrince.quaternion);   // 오른쪽
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(littlePrince.quaternion);      // 위쪽

    // 왕자의 접선 방향 이동 벡터
    const moveDir = new THREE.Vector3();

    if (keyState['w']) moveDir.add(forward);
    if (keyState['s']) moveDir.sub(forward);
    if (keyState['a']) moveDir.sub(right);
    if (keyState['d']) moveDir.add(right);

    if (moveDir.length() > 0) {
      moveDir.normalize();

      // 현재 왕자 위치 → 행성 중심 벡터
      const centerToPrince = new THREE.Vector3().subVectors(littlePrince.position, selectedPlanet.position).normalize();

      // 이동 방향을 접선 방향으로 투영 (수직 성분 제거)
      const tangentMove = moveDir.clone().sub(centerToPrince.clone().multiplyScalar(moveDir.dot(centerToPrince))).normalize();

      // 반지름 유지하면서 이동
      const nextPos = littlePrince.position.clone().add(tangentMove.multiplyScalar(moveSpeed));
      const newDir = new THREE.Vector3().subVectors(nextPos, selectedPlanet.position).normalize();

      const radius = selectedPlanet.geometry.parameters.radius + 0.5;
      littlePrince.position.copy(
        selectedPlanet.position.clone().addScaledVector(newDir, radius)
      );

      // 왕자 회전: Y-가 행성 중심 향하게
      const modelDown = new THREE.Vector3(0, 1, 0);
      const q = new THREE.Quaternion().setFromUnitVectors(modelDown, newDir);
      littlePrince.setRotationFromQuaternion(q);

      const anyKeyPressed = keyState['w'] || keyState['a'] || keyState['s'] || keyState['d'];
      if (princeAction) {
        if (anyKeyPressed) {
          if (!princeAction.isRunning()) {
            princeAction.reset();      // 처음부터 재생
            princeAction.play();       // 실행
          }
        } else {
          princeAction.stop();         // 정지 (reset과 달리 현재 프레임 유지 X)
        }
      }
    } else {
      // 아무 키도 안 눌렀을 때 애니메이션 정지
      if (princeAction && princeAction.isRunning()) {
        princeAction.stop();
      }
    }
    // 📷 카메라 추적
    const camBack = new THREE.Vector3(0, 0, 1).applyQuaternion(littlePrince.quaternion);
    const camUp = new THREE.Vector3(0, 1, 0).applyQuaternion(littlePrince.quaternion);
    const camOffset = camBack.clone().multiplyScalar(6).add(camUp.clone().multiplyScalar(2));

    const targetCamPos = littlePrince.position.clone().add(camOffset);
    camera.position.lerp(targetCamPos, 0.1);
    camera.up.copy(camUp);
    camera.lookAt(littlePrince.position);
  }
  if (mixer) mixer.update(0.016);  // 약 60fps 기준
  renderer.render(scene, camera);
}
animate();

// 리사이징 대응
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
