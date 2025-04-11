import GUI from 'lil-gui';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

import portalVertexShader from './shaders/portal/vertex.glsl';
import portalFragmentShader from './shaders/portal/fragment.glsl';

import firefliesVertexShader from './shaders/fireflies/vertex.glsl';
import firefliesFragmentShader from './shaders/fireflies/fragment.glsl';

/**
 * Base
 */
// Debug
const debugObject = {};
const gui = new GUI();
gui.close();

// Canvas
const canvas = document.querySelector('canvas.webgl');

// Scene
const scene = new THREE.Scene();

/**
 * Loaders
 */
// Texture loader
const textureLoader = new THREE.TextureLoader();

// Draco loader
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('draco/');

// GLTF loader
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

/**
 * Texture
 */
const bakedTexture = textureLoader.load('baked.jpg');
bakedTexture.flipY = false;
bakedTexture.colorSpace = THREE.SRGBColorSpace;

/**
 * Materials
 */
// Baked material
const bakedMaterial = new THREE.MeshBasicMaterial({
  map: bakedTexture,
});

// Pole light material
const poleLightMaterial = new THREE.MeshBasicMaterial({
  color: '#FFBC1D',
});

// Portal light material
debugObject.portalColorStart = '#8006ff';
debugObject.portalColorEnd = '#99ffff';

const portalLightMaterial = new THREE.ShaderMaterial({
  vertexShader: portalVertexShader,
  fragmentShader: portalFragmentShader,
  side: THREE.DoubleSide,
  uniforms: {
    uTime: new THREE.Uniform(0),
    uColorStart: new THREE.Uniform(
      new THREE.Color(debugObject.portalColorStart)
    ),
    uColorEnd: new THREE.Uniform(
      new THREE.Color(debugObject.portalColorEnd)
    ),
  },
});

gui
  .addColor(debugObject, 'portalColorStart')
  .onChange((value) => {
    portalLightMaterial.uniforms.uColorStart.value.set(value);
  });

gui.addColor(debugObject, 'portalColorEnd').onChange((value) => {
  portalLightMaterial.uniforms.uColorEnd.value.set(value);
});

/**
 * Model
 */
gltfLoader.load('portal.glb', (gltf) => {
  gltf.scene.children.find((child) => {
    if (child.name === 'baked') {
      child.material = bakedMaterial;
    }
    if (child.name.includes('poleLight')) {
      child.material = poleLightMaterial;
    }
    if (child.name === 'portalLight') {
      child.material = portalLightMaterial;
    }
  });
  scene.add(gltf.scene);
});

/**
 * Fireflies
 */
const firefliesGeometry = new THREE.BufferGeometry();
const firefliesCount = 30;
const positionArray = new Float32Array(firefliesCount * 3);
const scaleArray = new Float32Array(firefliesCount);

for (let i = 0; i < firefliesCount; i++) {
  const i3 = i * 3;

  positionArray[i3 + 0] = (Math.random() - 0.5) * 4;
  positionArray[i3 + 1] = Math.random() * 1.5;
  positionArray[i3 + 2] = (Math.random() - 0.5) * 4;

  scaleArray[i] = Math.random();
}

firefliesGeometry.setAttribute(
  'position',
  new THREE.BufferAttribute(positionArray, 3)
);

firefliesGeometry.setAttribute(
  'aScale',
  new THREE.BufferAttribute(scaleArray, 1)
);

// Material
const firefliesMaterial = new THREE.ShaderMaterial({
  vertexShader: firefliesVertexShader,
  fragmentShader: firefliesFragmentShader,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  uniforms: {
    uTime: new THREE.Uniform(0),
    uPixelRatio: new THREE.Uniform(
      Math.min(window.devicePixelRatio, 2)
    ),
    uSize: new THREE.Uniform(100),
  },
});

gui
  .add(firefliesMaterial.uniforms.uSize, 'value', 0, 500, 1)
  .name('firefliesSize');

const fireflies = new THREE.Points(
  firefliesGeometry,
  firefliesMaterial
);
scene.add(fireflies);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener('resize', () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Update fireflies
  firefliesMaterial.uniforms.uPixelRatio.value = Math.min(
    window.devicePixelRatio,
    2
  );
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  45,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.x = 4;
camera.position.y = 2;
camera.position.z = 4;
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

debugObject.clearColor = '#330066';
renderer.setClearColor(debugObject.clearColor);
gui.addColor(debugObject, 'clearColor').onChange((value) => {
  renderer.setClearColor(value);
});

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // Update time
  portalLightMaterial.uniforms.uTime.value = elapsedTime;
  firefliesMaterial.uniforms.uTime.value = elapsedTime;

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
