/* snake_cross_scene.js (REV-G) — bumpy green anaconda, wooden cross, white bg */

import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

/* ---------- configuration ---------- */
const cfg = {
  grid: 21,        // for magnetization
  steps: 256,
  bg: 0xffffff,    // white background
  crossColor: 0x55331d,      // dark-wood brown
  humanCloth: 0xbbbbbb,
  green: 0x15992a,           // snake + human head
  snakeTurns: 5.2,
  snakeRadius: 0.6,
  crossHalf: 3.2
};

/* ---------- reversible Ising noise ---------- */
const ising = [...Array(cfg.grid)].map(() =>
  [...Array(cfg.grid)].map(() =>
    [...Array(cfg.steps)].map(() => [
      Math.random() < .5 ? -1 : 1,
      Math.random() < .5 ? -1 : 1,
      Math.random() < .5 ? -1 : 1
    ])
  )
);
const magnetization = t => {
  let s = 0, N = cfg.grid * cfg.grid * 3;
  for (let i = 0; i < cfg.grid; i++)
    for (let j = 0; j < cfg.grid; j++)
      s += ising[i][j][t][0] + ising[i][j][t][1] + ising[i][j][t][2];
  return s / N;                       // [-1, 1]
};
const snakeScale = t => 1.075 + 0.275 * magnetization(t);

/* ---------- three.js boilerplate ---------- */
const scene = new THREE.Scene();
scene.background = new THREE.Color(cfg.bg);

const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 100);
camera.position.set(5, 3, 8);
camera.lookAt(0, 1, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.physicallyCorrectLights = true;
document.body.style.margin = '0';
document.body.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const dir = new THREE.DirectionalLight(0xffffff, 1.1);
dir.position.set(5, 10, 7);
scene.add(dir);

/* ---------- helpers ---------- */
const metal = (c, m = .9, r = .25) =>
  new THREE.MeshStandardMaterial({ color: c, metalness: m, roughness: r });

/* cross */
const createCross = () => {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.BoxGeometry(0.3, cfg.crossHalf * 2, 0.3), metal(cfg.crossColor, 0.2, 0.7)));
  const h = new THREE.Mesh(new THREE.BoxGeometry(cfg.crossHalf, 0.3, 0.3), metal(cfg.crossColor, 0.2, 0.7));
  h.position.y = 0.4 * cfg.crossHalf; g.add(h);
  return g;
};

/* bumpy anaconda */
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

  /* main body */
  const body = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 400, 0.12, 10, false),
    metal(cfg.green, 0.2, 0.85)
  );

  /* head */
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 12, 12),
    metal(cfg.green, 0.25, 0.55)
  );
  head.position.copy(pts[0]).add(new THREE.Vector3(0, 0, 0.12));

  /* procedural bumps: small torus rings every N segments */
  const bumps = new THREE.Group();
  const bumpGeo = new THREE.TorusGeometry(0.14, 0.02, 6, 12);
  const bumpMat = metal(cfg.green, 0.25, 0.55);
  for (let i = 15; i < pts.length; i += 15) {
    const b = new THREE.Mesh(bumpGeo, bumpMat);
    b.position.copy(pts[i]);
    b.lookAt(pts[i].clone().add(pts[i].clone().sub(pts[Math.max(i - 1, 0)]))); // orient ring
    bumps.add(b);
  }

  const g = new THREE.Group();
  g.add(body, head, bumps);
  g.userData.head = head;
  return g;
};

/* human (green head) */
const createHuman = () => {
  const g = new THREE.Group();
  const skin  = metal(cfg.green, 0.15, 0.5);        // head same green
  const cloth = metal(cfg.humanCloth, 0.1, 0.4);
  const black = metal(0x000000, 0.9, 0.15);

  g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 1.4, 14), cloth).position.set(0, 0.7, 0));

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 22, 22), skin);
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

/* ---------- assemble ---------- */
const human = createHuman();   scene.add(human);

const cross = createCross();
cross.position.set(0, 1.6, 0.4);
cross.rotation.z = Math.PI / 6;
human.add(cross);

const snake = createSnake();
cross.add(snake);

/* ---------- resize + animate ---------- */
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

  /* bob + breathe */
  const head = snake.userData.head;
  if (head) head.position.y += Math.sin(frame * 0.12) * 0.005;
  const s = snakeScale(frame % cfg.steps);
  snake.scale.set(s, s, s);

  renderer.render(scene, camera);
  frame++;
})();
