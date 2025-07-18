/* snake_cross_scene.js (REV‑F) — single‑file, rattlesnake palette
   Adds a "quantum‑team" of miniature humans orbiting the snake’s head. */

import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

/* ─── config ─── */
const cfg = {
  grid: 3,
  steps: 9,
  sceneColor: 0xbb2200,
  accentBlue: 0x220099,
  snakeTurns: 78.9,
  snakeRadius: 4.3,
  crossHalf: 1.3,
  teamSize: 4.3            // ← quantum‑like team members
};

const PAL = [0xff375f, 0x34c759, 0x0a84ff, 0xffd60a]; // red / green / blue / yellow

/* ─── Ising noise (unchanged) ─── */
const ising = [...Array(cfg.grid)].map(() =>
  [...Array(cfg.grid)].map(() =>
    [...Array(cfg.steps)].map(() => ([
      Math.random() < .5 ? -1 : 1,
      Math.random() < .5 ? -1 : 1,
      Math.random() < .5 ? -1 : 1
    ]))
  )
);
const magnetization = t => {
  let s = 0, N = cfg.grid * cfg.grid * 3;
  for (let i = 0; i < cfg.grid; i++)
    for (let j = 0; j < cfg.grid; j++)
      s += ising[i][j][t][0] + ising[i][j][t][1] + ising[i][j][t][2];
  return s / N;
};

/* ─── three.js boilerplate ─── */
const scene = new THREE.Scene();
scene.background = new THREE.Color(cfg.accentBlue).convertSRGBToLinear();

const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 100);
camera.position.set(5, 3, 8);
camera.lookAt(0, 1, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.physicallyCorrectLights = true;
document.body.style.margin = '0';
document.body.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 0.5));
const dir = new THREE.DirectionalLight(0xffffff, 1.2);
dir.position.set(5, 10, 7);
scene.add(dir);

/* ─── helpers ─── */
const metal = (c, m = 0.9, r = 0.25) =>
  new THREE.MeshStandardMaterial({ color: c, metalness: m, roughness: r });

/* cross */
const createCross = () => {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.BoxGeometry(0.3, cfg.crossHalf * 2, 0.3), metal(cfg.sceneColor)));
  const h = new THREE.Mesh(new THREE.BoxGeometry(cfg.crossHalf, 0.3, 0.3), metal(cfg.sceneColor));
  h.position.y = 0.4 * cfg.crossHalf;
  g.add(h);
  return g;
};

/* snake: single‑tone green */
const createSnake = () => {
  const pts = [], L = cfg.crossHalf * 2;
  for (let i = 0; i <= 200; i++) {
    const t = i / 200,
          y = t * L - L / 2,
          a = t * cfg.snakeTurns * 2 * Math.PI;
    pts.push(new THREE.Vector3(
      Math.cos(a) * cfg.snakeRadius,
      y,
      Math.sin(a) * cfg.snakeRadius
    ));
  }

  const curve = new THREE.CatmullRomCurve3(pts);
  const body = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 400, 0.12, 8, false),
    new THREE.MeshStandardMaterial({ color: 0x15992a, metalness: 0.2, roughness: 0.9 })
  );

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 12, 12),
    new THREE.MeshStandardMaterial({ color: 0x15992a, metalness: 0.3, roughness: 0.4 })
  );
  head.position.copy(pts[0]).add(new THREE.Vector3(0, 0, 0.12));

  const g = new THREE.Group();
  g.add(body, head);
  g.userData.head = head; // expose head
  return g;
};

/* human (Opt‑1, head tinted red) */
const createHuman = () => {
  const g = new THREE.Group();
  const skin = metal(0xbfa27c, 0.1, 0.5);
  const cloth = metal(0xbbbbbb, 0.1, 0.4);
  const black = metal(0x000000, 0.9, 0.15);

  g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 1.4, 14), cloth).position.set(0, 0.7, 0));

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 20, 20), metal(PAL[0], 0.1, 0.5));
  head.position.y = 1.6; g.add(head);

  const beard = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.6, 16, 4, true), black);
  beard.rotation.x = Math.PI; beard.position.y = 1.1; g.add(beard);

  g.add(new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.18, 0.05), black).position.set(0, 1.55, 0.34));
  const frame = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.02, 8, 20), black);
  frame.rotation.x = Math.PI / 2; frame.position.set(0, 1.55, 0.31); g.add(frame);

  g.add(new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 12, 0, Math.PI), black).position.set(0, 1.8, 0));
  const brim = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.04, 8, 20, Math.PI), black);
  brim.rotation.x = Math.PI / 2; brim.position.set(0, 1.72, 0.1); g.add(brim);

  return g;
};

/* quantum‑team: miniature humans orbiting a point */
const createTechTeam = (n = cfg.teamSize) => {
  const group = new THREE.Group();
  for (let i = 0; i < n; i++) {
    const member = createHuman();
    const angle = (i / n) * 2 * Math.PI;
    const radius = 0.6; // orbit radius around head
    member.scale.set(0.25, 0.25, 0.25); // shrink
    member.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
    group.add(member);
  }
  return group;
};

/* assemble */
const human = createHuman();
scene.add(human);

const cross = createCross();
cross.position.set(0, 1.6, 0.4);
cross.rotation.z = Math.PI / 6;
human.add(cross);

const snake = createSnake();
cross.add(snake);

// attach quantum team to the snake’s head
afterSnakeSetup();
function afterSnakeSetup () {
  const head = snake.userData.head;
  const techTeam = createTechTeam();
  techTeam.position.y = 0.3; // hover just above head surface
  head.add(techTeam);
  head.userData.techTeam = techTeam;
}

/* resize + animate */
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

let frame = 0;
(function animate () {
  requestAnimationFrame(animate);
  const m = magnetization(frame % cfg.steps);
  snake.rotation.y += 0.03 + m * 0.05;
  cross.rotation.y += 0.005;
  human.rotation.y += 0.003;

  const head = snake.userData.head;
  if (head) {
    head.position.y += Math.sin(frame * 0.12) * 0.005;
    // slow orbital spin for the tech team
    const team = head.userData.techTeam;
    if (team) team.rotation.y -= 0.02;
  }

  renderer.render(scene, camera);
  frame++;
})();
