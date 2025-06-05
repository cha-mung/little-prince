import * as THREE from 'three';

// 별 생성 함수
export function createStarField(scene, starCount = 1000) {
  const starGeometry = new THREE.BufferGeometry();
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
  return stars;
}

// 별 회전 함수
export function rotateStarField(stars) {
  stars.rotation.y += 0.0007;
  stars.rotation.x += 0.0003;
  stars.rotation.z += 0.0002;
}