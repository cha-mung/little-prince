import * as THREE from 'three';
import { GLTFLoader } from 'https://unpkg.com/three@0.160.1/examples/jsm/loaders/GLTFLoader.js';

export let littlePrince = null;
export let mixer = null;
export let princeAction = null;
export let princeTheta = Math.PI / 2;
export let princePhi = 0;
export let princeRadius = 3;

export function setPrinceTheta(val) { princeTheta = val; }
export function setPrincePhi(val) { princePhi = val; }
export function setPrinceRadius(val) { princeRadius = val; }

export function loadLittlePrince(scene, onLoaded) {
  const loader = new GLTFLoader();
  loader.load('assets/models/LittlePrince.glb', (gltf) => {
    littlePrince = gltf.scene;
    littlePrince.scale.set(3, 2, 4);
    littlePrince.visible = false;
    scene.add(littlePrince);

    mixer = new THREE.AnimationMixer(littlePrince);
    if (gltf.animations && gltf.animations.length > 0) {
      princeAction = mixer.clipAction(gltf.animations[0]);
      princeAction.play();
      princeAction.paused = true;
    }
    if (onLoaded) onLoaded();
  });
}