import * as THREE from 'three';
import { DrunkardObject } from './drunkard.js';
import { BusinessmanObject, bags, box, stars } from './businessman.js';

const planetLightMap = {
  '술꾼의 별': () => {
    const light1 = new THREE.SpotLight(0x2b1b17, 200, 0, Math.PI / 3, 0.1, 1);
    light1.position.set(10, -100, -80);
    light1.castShadow = true;
    light1.target = DrunkardObject;
    light1.distance = 200;

    const light2 = new THREE.SpotLight(0xffffff, 10, 0, Math.PI / 3, 0.1, 1);
    light2.position.set(10, -100, -85);
    light2.castShadow = true;
    light2.target = DrunkardObject;
    light2.distance = 200;
    light2.userData.basePosition = light2.position.clone();
    light2.userData.baseIntensity = light2.intensity;
    light2.userData.isDynamic = true;

    return [light1, light2];
  },
  '사업가의 별': () => {
    const light1 = new THREE.SpotLight(0xffffff, 100, 0, Math.PI / 4, 0.4, 1);
    light1.position.set(110, -50, -65);
    light1.castShadow = true;
    light1.target = BusinessmanObject;
    light1.distance = 200;

    const light2 = new THREE.SpotLight(0xffffff, 50, 0, Math.PI / 20, 0.8, 1);
    light2.position.set(110, -50, -65);
    light2.castShadow = true;
    light2.target = BusinessmanObject;
    light2.distance = 200;

    return [light1, light2];
  },

  // 기본 조명 (다른 행성)
  default: () => {
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    return [ambient];
  }
};

let activeLights = [];

export function getLightsForPlanet(name) {
  const lightFactory = planetLightMap[name] || planetLightMap.default;
  return lightFactory();
}

export function applyPlanetLights(scene, planetName) {
  removePlanetLights(scene);

  activeLights = getLightsForPlanet(planetName);
  activeLights.forEach(light => {
  // const helper = new THREE.SpotLightHelper(light, 0x00ff00);
  // scene.add(helper);
  scene.add(light);

  });}

export function removePlanetLights(scene) {
  activeLights.forEach(light => scene.remove(light));
  activeLights = [];
}

export function updateDynamicLights(time) {
  const t = time * 0.001;

  activeLights.forEach(light => {
    if (!light.userData.isDynamic) return;

    // 부드러운 위치 진동 
    const offsetX = 0.6 * Math.sin(t + light.id);
    const offsetY = 0.3 * Math.cos(t * 1.2 + light.id);
    light.position.x = light.userData.basePosition.x + offsetX;
    light.position.y = light.userData.basePosition.y + offsetY;

    // 부드러운 밝기 변화 (1.0 ± 0.2)
    const base = light.userData.baseIntensity ?? light.intensity;
    light.intensity = base * (0.9 + 0.2 * Math.sin(t * 1.5 + light.id));
  });
}

