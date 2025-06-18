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

  if (!prince) return;

  const speed = 0.1;
  const dir = new THREE.Vector3();

  if (keys['w']) dir.z -= 1;
  if (keys['s']) dir.z += 1;
  if (keys['a']) dir.x -= 1;
  if (keys['d']) dir.x += 1;

  dir.normalize();
  prince.position.add(dir.clone().multiplyScalar(speed));

  // 왕자 바라보는 방향
  if (dir.lengthSq() > 0.01) {
    prince.lookAt(prince.position.clone().add(dir));
  }

  // 카메라 따라오기
  camera.position.lerp(prince.position.clone().add(new THREE.Vector3(0, 5, 10)), 0.05);
  camera.lookAt(prince.position);
}
