/* snake_cross_scene.js (REV-C) — quick camera fix
 * Adds camera.lookAt to aim at the scene; no other logic changed.
 */

import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';


const config = {
  gridSize: 75,          // Ising lattice size (7×7)
  timeSteps: 500,       // Frames in pseudo-Ising tensor
  sceneColor: 0xaaaaaa, // Iron/silver
  accentBlue: 0x2244aa, // Background tint
  snakeColor: 0x227722, // Green snake
  humanColor: 0xbbbbbb, // Silver human
  snakeTurns: 5.2,        // Number of coils
  snakeRadius: 0.6,     // Coil radius
  crossSize: 3.2          // Half-height of vertical beam
};

// -------------------------------------------------- Ising (same as REV-B)
const buildIsing = () => {
  const g = [];
  for (let i = 0; i < config.gridSize; i++) {
    g[i] = [];
    for (let j = 0; j < config.gridSize; j++) {
      g[i][j] = [];
      for (let t = 0; t < config.timeSteps; t++) {
        g[i][j][t] = [Math.random() < 0.5 ? -1 : 1, Math.random() < 0.5 ? -1 : 1, Math.random() < 0.5 ? -1 : 1];
      }
    }
  }
  return g;
};
const ising = buildIsing();
const magnetization = (t) => {
  let sum = 0;
  const n = config.gridSize * config.gridSize * 3;
  for (let i = 0; i < config.gridSize; i++)
    for (let j = 0; j < config.gridSize; j++)
      sum += ising[i][j][t][0] + ising[i][j][t][1] + ising[i][j][t][2];
  return sum / n;
};

// -------------------------------------------------- three.js setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(config.accentBlue).convertSRGBToLinear();

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(5, 3, 8);
camera.lookAt(0, 1, 0); // 👈 NEW: point camera at the model

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.physicallyCorrectLights = true;
document.body.style.margin = '0';
document.body.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 0.5));
const dir = new THREE.DirectionalLight(0xffffff, 1.2);
dir.position.set(5, 10, 7);
scene.add(dir);

// -------------------------------------------------- geometry helpers (unchanged)
const createCross = () => {
  const mat = new THREE.MeshStandardMaterial({ color: config.sceneColor, metalness: 0.9, roughness: 0.25 });
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.BoxGeometry(0.3, config.crossSize * 2, 0.3), mat));
  const h = new THREE.Mesh(new THREE.BoxGeometry(config.crossSize, 0.3, 0.3), mat);
  h.position.y = 0.4 * config.crossSize;
  g.add(h);
  return g;
};

const createSnake = () => {
  const pts = [];
  const len = config.crossSize * 2;
  for (let i = 0; i <= 200; i++) {
    const t = i / 200;
    const y = t * len - len / 2;
    const a = t * config.snakeTurns * 2 * Math.PI;
    pts.push(new THREE.Vector3(Math.cos(a) * config.snakeRadius, y, Math.sin(a) * config.snakeRadius));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  const geom = new THREE.TubeGeometry(curve, 400, 0.12, 8, false);
  return new THREE.Mesh(geom, new THREE.MeshStandardMaterial({ color: config.snakeColor, metalness: 0.2, roughness: 0.9 }));
};

const createHuman = () => {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: config.humanColor, metalness: 0.6, roughness: 0.3 });
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 1.4, 14), mat);
  torso.position.y = 0.7;
  group.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), mat);
  head.position.y = 1.6;
  group.add(head);
  return group;
};

// -------------------------------------------------- assemble
const human = createHuman();
scene.add(human);

const cross = createCross();
cross.position.set(0, 1.6, 0.4);
cross.rotation.z = Math.PI / 6;
human.add(cross);

const snake = createSnake();
cross.add(snake);

// -------------------------------------------------- resize + animate
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

let frame = 0;
const animate = () => {
  requestAnimationFrame(animate);
  const m = magnetization(frame % config.timeSteps);
  snake.rotation.y += 0.03 + m * 0.05;
  cross.rotation.y += 0.005;
  human.rotation.y += 0.003;
  renderer.render(scene, camera);
  frame++;
};
animate();