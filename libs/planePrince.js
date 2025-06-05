import * as THREE from 'three';
import { GLTFLoader } from 'https://unpkg.com/three@0.160.1/examples/jsm/loaders/GLTFLoader.js';

export let planePrince = null;

export function loadPlanePrince(scene, onLoaded) {
  const loader = new GLTFLoader();
  loader.load('assets/models/PlanePrince.glb', (gltf) => {
    planePrince = gltf.scene;
    planePrince.scale.set(0.08, 0.08, 0.08);
    planePrince.visible = false;
    scene.add(planePrince);
    if (onLoaded) onLoaded();
  });
}