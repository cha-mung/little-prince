import * as THREE from 'three';

let keys = {};
let prince, camera;

export function setupPrinceControls(p, cam) {
  prince = p;
  camera = cam;

  document.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
  document.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

  animate();
}

function animate() {
  requestAnimationFrame(animate);
  if (!prince || !camera) return;

  const speed = 0.1;
  const dir = new THREE.Vector3();

  // 방향 입력
  if (keys['w']) dir.z -= 1;
  if (keys['s']) dir.z += 1;
  if (keys['a']) dir.x -= 1;
  if (keys['d']) dir.x += 1;

  dir.normalize();

  if (dir.lengthSq() > 0.001) {
    // 왕자 이동
    prince.position.add(dir.clone().multiplyScalar(speed));

    // (선택) 왕자 방향 회전
    prince.lookAt(prince.position.clone().add(dir));
  }

  // 카메라는 왕자를 계속 바라봄 (자신은 고정)
  // camera.lookAt(prince.position);
}
