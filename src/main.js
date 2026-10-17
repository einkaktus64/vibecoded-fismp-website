import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import './style.css';

const canvas = document.querySelector('#schematic-scene');
const status = document.querySelector('#build-status');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 500);
camera.position.set(80, 48, 80);
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

scene.add(new THREE.HemisphereLight(0xcdf3f0, 0x1c3937, 2.25));
const keyLight = new THREE.DirectionalLight(0xffe0ae, 3.6);
keyLight.position.set(-45, 65, 45);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.left = -48;
keyLight.shadow.camera.right = 48;
keyLight.shadow.camera.top = 48;
keyLight.shadow.camera.bottom = -48;
keyLight.shadow.bias = -0.00015;
keyLight.shadow.normalBias = 0.035;
keyLight.shadow.radius = 4;
scene.add(keyLight);
const fillLight = new THREE.DirectionalLight(0x5bc8c2, 1.35);
fillLight.position.set(35, 10, -45);
scene.add(fillLight);

const buildRoot = new THREE.Group();
scene.add(buildRoot);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.enablePan = false;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.28;
controls.minPolarAngle = 0.22;
controls.maxPolarAngle = Math.PI * 0.78;
controls.minDistance = 34;
controls.maxDistance = 155;

const colorByBlock = {
  'jack_o_lantern': '#f6a51b',
  'orange_wool': '#f47f22',
  'orange_concrete': '#e36b1a',
  'orange_terracotta': '#a34e24',
  'brown_terracotta': '#8c4728',
  'oxidized_cut_copper': '#4c9c80',
  'prismarine_bricks': '#67b8a3',
  'prismarine': '#48a68e',
  'black_terracotta': '#392d2c',
  'dark_prismarine': '#286d60',
  'sea_pickle': '#e8d65e',
  'white_concrete': '#e9e6d7',
  'white_stained_glass': '#c5e8da',
  'prismarine_brick_slab': '#67b8a3',
  'dark_prismarine_slab': '#286d60',
  'red_concrete': '#a9362e',
  'red_wool': '#b7483e',
};

function blockColor(name) {
  const id = name.slice(name.indexOf(':') + 1).split('[')[0];
  return colorByBlock[id] ?? '#87918a';
}

function pixelMap(color, salt = 0) {
  const size = 16;
  const tile = document.createElement('canvas');
  tile.width = tile.height = size;
  const ctx = tile.getContext('2d');
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);
  const source = new THREE.Color(color);
  for (let y = 0; y < size; y += 2) {
    for (let x = 0; x < size; x += 2) {
      const sample = (x * 19 + y * 13 + salt * 23) % 17;
      if (sample < 5) {
        const shade = source.clone().multiplyScalar(sample % 2 ? 1.13 : 0.86);
        ctx.fillStyle = `#${shade.getHexString()}`;
        ctx.globalAlpha = sample === 0 ? 0.56 : 0.34;
        ctx.fillRect(x, y, sample === 0 ? 2 : 1, sample === 0 ? 2 : 1);
      }
    }
  }
  ctx.globalAlpha = 1;
  const map = new THREE.CanvasTexture(tile);
  map.colorSpace = THREE.SRGBColorSpace;
  map.magFilter = THREE.NearestFilter;
  map.minFilter = THREE.NearestMipmapNearestFilter;
  return map;
}

function makeMaterial(name, index) {
  const blockId = name.slice(name.indexOf(':') + 1).split('[')[0];
  const lantern = blockId === 'jack_o_lantern';
  const glass = blockId === 'white_stained_glass';
  const pickle = blockId === 'sea_pickle';
  const baseColor = blockColor(name);
  return new THREE.MeshStandardMaterial({
    color: '#ffffff',
    map: pixelMap(baseColor, index),
    roughness: glass ? 0.18 : 0.84,
    metalness: blockId === 'oxidized_cut_copper' ? 0.12 : 0.02,
    emissive: lantern ? '#ff8b20' : pickle ? '#d5c848' : '#000000',
    emissiveMap: lantern || pickle ? pixelMap(baseColor, index + 40) : null,
    emissiveIntensity: lantern ? 1.6 : pickle ? 0.36 : 0,
    transparent: glass,
    opacity: glass ? 0.34 : 1,
    depthWrite: !glass,
    flatShading: false,
  });
}

function parseNbt(buffer) {
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  let offset = 0;
  const u8 = () => bytes[offset++];
  const i16 = () => { const value = view.getInt16(offset); offset += 2; return value; };
  const i32 = () => { const value = view.getInt32(offset); offset += 4; return value; };
  const i64 = () => { const value = view.getBigInt64(offset); offset += 8; return Number(value); };
  const f32 = () => { const value = view.getFloat32(offset); offset += 4; return value; };
  const f64 = () => { const value = view.getFloat64(offset); offset += 8; return value; };
  const string = () => {
    const length = view.getUint16(offset);
    offset += 2;
    const value = new TextDecoder().decode(bytes.subarray(offset, offset + length));
    offset += length;
    return value;
  };
  const read = (type) => {
    if (type === 1) return (u8() << 24) >> 24;
    if (type === 2) return i16();
    if (type === 3) return i32();
    if (type === 4) return i64();
    if (type === 5) return f32();
    if (type === 6) return f64();
    if (type === 7) {
      const length = i32();
      const value = bytes.slice(offset, offset + length);
      offset += length;
      return value;
    }
    if (type === 8) return string();
    if (type === 9) {
      const childType = u8();
      const length = i32();
      return Array.from({ length }, () => read(childType));
    }
    if (type === 10) {
      const value = {};
      while (true) {
        const childType = u8();
        if (childType === 0) return value;
        value[string()] = read(childType);
      }
    }
    if (type === 11) {
      const length = i32();
      const value = [];
      for (let i = 0; i < length; i++) value.push(i32());
      return value;
    }
    if (type === 12) {
      const length = i32();
      const value = [];
      for (let i = 0; i < length; i++) value.push(i64());
      return value;
    }
    throw new Error(`Unsupported NBT tag ${type}`);
  };
  const rootType = u8();
  string(); // Root name
  return read(rootType);
}

async function loadSchematic() {
  const response = await fetch('/guardian-reimagined-by-lolochee.schem');
  if (!response.ok) throw new Error('Could not fetch the schematic file.');
  const compressed = await response.arrayBuffer();
  if (!('DecompressionStream' in window)) throw new Error('This browser cannot open compressed schematic files.');
  const decompressed = await new Response(new Blob([compressed]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
  const root = parseNbt(decompressed);
  const schematic = root.Schematic ?? root;
  const { Width: width, Height: height, Length: length, Blocks: blocks } = schematic;
  if (!width || !height || !length || !blocks?.Palette || !blocks?.Data) throw new Error('The schematic is missing its block data.');

  const palette = Object.entries(blocks.Palette).sort((a, b) => a[1] - b[1]).map(([name]) => name);
  const blockData = blocks.Data;
  const positionsById = Array.from({ length: palette.length }, () => []);
  let index = 0;
  for (let y = 0; y < height; y++) {
    for (let z = 0; z < length; z++) {
      for (let x = 0; x < width; x++) {
        let blockId = 0;
        let shift = 0;
        let part;
        do {
          part = blockData[index++];
          blockId |= (part & 0x7f) << shift;
          shift += 7;
        } while (part & 0x80);
        if (blockId !== 0) positionsById[blockId].push([x, y, z]);
      }
    }
  }

  const origin = new THREE.Object3D();
  const cube = new THREE.BoxGeometry(1, 1, 1);
  let renderedBlocks = 0;
  for (let id = 1; id < palette.length; id++) {
    const points = positionsById[id];
    if (!points.length) continue;
    const name = palette[id];
    const blockId = name.slice(name.indexOf(':') + 1).split('[')[0];
    let geometry = cube;
    let yScale = 1;
    let yOffset = 0;
    if (blockId.endsWith('_slab') && name.includes('type=bottom')) { yScale = 0.5; yOffset = -0.25; }
    if (blockId.endsWith('_slab') && name.includes('type=top')) { yScale = 0.5; yOffset = 0.25; }
    if (blockId === 'sea_pickle') { yScale = 0.28; yOffset = -0.36; }
    if (blockId === 'jack_o_lantern') { yScale = 0.92; }
    const mesh = new THREE.InstancedMesh(geometry, makeMaterial(name, id), points.length);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    points.forEach(([x, y, z], instance) => {
      origin.position.set(x - (width - 1) / 2, y - (height - 1) / 2 + yOffset, z - (length - 1) / 2);
      origin.scale.set(1, yScale, 1);
      if (blockId === 'jack_o_lantern') origin.rotation.y = name.includes('south') ? 0 : Math.PI;
      else origin.rotation.y = 0;
      origin.updateMatrix();
      mesh.setMatrixAt(instance, origin.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    buildRoot.add(mesh);
    renderedBlocks += points.length;
  }
  buildRoot.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(buildRoot);
  const center = bounds.getCenter(new THREE.Vector3());
  const sphere = bounds.getBoundingSphere(new THREE.Sphere());
  controls.target.set(center.x - sphere.radius * 0.29, center.y, center.z);
  const verticalHalfFov = THREE.MathUtils.degToRad(camera.fov / 2);
  const horizontalHalfFov = Math.atan(Math.tan(verticalHalfFov) * camera.aspect);
  const distance = Math.max(sphere.radius / Math.sin(Math.min(verticalHalfFov, horizontalHalfFov)) * 0.94, 65);
  const viewDirection = new THREE.Vector3(0.62, 0.39, 0.68).normalize();
  camera.position.copy(controls.target).addScaledVector(viewDirection, distance);
  camera.near = Math.max(0.1, distance / 200);
  camera.far = distance * 8;
  camera.updateProjectionMatrix();
  controls.minDistance = sphere.radius * 1.12;
  controls.maxDistance = sphere.radius * 4.8;
  controls.update();
  controls.saveState();
  status.textContent = `${width} × ${height} × ${length} BLOCKS  ·  ${renderedBlocks.toLocaleString()} PLACED`;
}

function resize() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (!width || !height) return;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.fov = window.innerWidth < 600 ? 42 : 34;
  camera.updateProjectionMatrix();
  if (buildRoot.children.length) {
    const bounds = new THREE.Box3().setFromObject(buildRoot);
    const sphere = bounds.getBoundingSphere(new THREE.Sphere());
    const verticalHalfFov = THREE.MathUtils.degToRad(camera.fov / 2);
    const horizontalHalfFov = Math.atan(Math.tan(verticalHalfFov) * camera.aspect);
    const distance = Math.max(sphere.radius / Math.sin(Math.min(verticalHalfFov, horizontalHalfFov)) * 0.94, 65);
    camera.position.copy(controls.target).addScaledVector(new THREE.Vector3(0.62, 0.39, 0.68).normalize(), distance);
  }
}
new ResizeObserver(resize).observe(canvas.parentElement);
window.addEventListener('resize', resize);
resize();

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
  // Lantern glow gently breathes in the distant water.
  const time = clock.getElapsedTime();
  keyLight.intensity = 3.55 + Math.sin(time * 0.45) * 0.08;
}
animate();

loadSchematic().catch((error) => {
  status.textContent = 'Could not load the build. Use the controls after refreshing.';
  console.error('FiSMP schematic:', error);
});

const rotateButton = document.querySelector('#toggle-rotate');
function updateRotateIcon() {
  rotateButton.querySelector('svg').innerHTML = controls.autoRotate
    ? '<path d="M9 5v14M15 5v14" />'
    : '<path d="m8 5 11 7-11 7V5Z" />';
}
rotateButton.addEventListener('click', () => {
  controls.autoRotate = !controls.autoRotate;
  updateRotateIcon();
  rotateButton.setAttribute('aria-label', controls.autoRotate ? 'Pause automatic rotation' : 'Resume automatic rotation');
  rotateButton.title = controls.autoRotate ? 'Pause rotation' : 'Resume rotation';
});
document.querySelector('#reset-view').addEventListener('click', () => {
  controls.reset();
  controls.autoRotate = true;
  updateRotateIcon();
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));

// Keep the scenic schematic renders gently embedded in the page as it scrolls.
const parallaxArtwork = [...document.querySelectorAll('.parallax-art')];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let parallaxFrame = 0;
function updateParallax() {
  parallaxFrame = 0;
  if (reduceMotion.matches) return;
  for (const artwork of parallaxArtwork) {
    const rect = artwork.parentElement.getBoundingClientRect();
    if (rect.bottom < -120 || rect.top > window.innerHeight + 120) continue;
    const distanceFromCenter = rect.top + rect.height / 2 - window.innerHeight / 2;
    const strength = 0.055;
    const offset = Math.max(-26, Math.min(26, -distanceFromCenter * strength));
    artwork.style.setProperty('--parallax-shift', `${offset.toFixed(1)}px`);
  }
}
function requestParallaxUpdate() {
  if (!parallaxFrame) parallaxFrame = requestAnimationFrame(updateParallax);
}
window.addEventListener('scroll', requestParallaxUpdate, { passive: true });
window.addEventListener('resize', requestParallaxUpdate);
reduceMotion.addEventListener?.('change', requestParallaxUpdate);
requestParallaxUpdate();

const copyButton = document.querySelector('#copy-ip');
const feedback = document.querySelector('.copy-feedback');
copyButton.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText('fismp.run.place');
    feedback.classList.add('show');
    copyButton.querySelector('.button-label').textContent = 'Copied!';
    window.setTimeout(() => {
      feedback.classList.remove('show');
      copyButton.querySelector('.button-label').textContent = 'Copy server address';
    }, 2400);
  } catch {
    feedback.textContent = 'Copy fismp.run.place to join';
    feedback.classList.add('show');
  }
});
