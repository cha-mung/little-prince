import * as THREE from 'three';

export const planets = [
  { name: '왕의 별', position: [-50, 0, 20], color: '#ff6666', size: 10, quote: '명령은 이치에 맞아야 해.' },
  { name: '허영심 많은 자', position: [-40, 20, -5], color: '#ffcc00', size: 4, quote: '넌 나를 칭찬하기 위해 존재하잖아.' },
  { name: '술꾼의 별', position: [0, -50, -40], color: '#9999ff', size: 5, quote: '나는 부끄러워서 술을 마셔.' },
  { name: '사업가의 별', position: [40, -25, -30], color: '#66ff99', size: 7, quote: '나는 별을 소유하고 있어.' },
  { name: '점등원의 별', position: [70, 0, 0], color: '#ff99cc', size: 3.5, quote: '규칙은 지켜야 하니까!' },
  { name: '지리학자의 별', position: [0, 5, 15], color: '#ffffff', size: 5.5, quote: '나는 앉아서 관찰만 해.' }
];

// 행성 Mesh 배열을 만들어주는 함수
export function createPlanetMeshes(scene) {
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
  return planetMeshes;
}