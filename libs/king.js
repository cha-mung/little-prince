import * as THREE from 'three';
import { FBXLoader } from 'https://unpkg.com/three@0.160.1/examples/jsm/loaders/FBXLoader.js';

export let KingObject = null;

export function loadKing(scene, onLoaded) {
  const Kingloader = new FBXLoader();
  Kingloader.load('assets/models/King.fbx', (fbx) => {
    fbx.traverse(child => {
      if (child.isMesh) child.castShadow = true;
    });
    fbx.scale.set(0.05, 0.05, 0.05);
    fbx.visible = false; // 처음에는 보이지 않게
    scene.add(fbx);
    KingObject = fbx;
    if (onLoaded) onLoaded(fbx);
  });
}