import * as THREE from './vendor/three.module.js';
import { GLTFLoader } from './vendor/jsm/loaders/GLTFLoader.js';

const canvas = document.getElementById('c');
const fx = document.getElementById('fx');
const W = window.innerWidth;
const H = window.innerHeight;

console.log('[renderer] boot', W, H);

const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
console.log('[renderer] webgl context:', !!renderer.getContext());
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(W, H);
renderer.setClearColor(0x000000, 0);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, W / H, 0.01, 100);

/* 灯光：主光 + 冷色补光 + 背面轮廓光，营造哑光手办的质感 */
scene.add(new THREE.HemisphereLight(0xffffff, 0xdcd4c8, 1.05));
const key = new THREE.DirectionalLight(0xffffff, 1.5);
key.position.set(3, 5, 4.5);
scene.add(key);
const fill = new THREE.DirectionalLight(0xc9dbff, 0.55);
fill.position.set(-4.5, 2.5, 3.5);
scene.add(fill);
const rim = new THREE.DirectionalLight(0xffffff, 0.5);
rim.position.set(0, 1.5, -4);
scene.add(rim);

const root = new THREE.Group();
scene.add(root);

let lastT = performance.now() / 1000;
let elapsedT = 0;
let modelSize = new THREE.Vector3(1, 1, 1);
let camDist = 2;
let idleMode = 0;
let prevIdleMode = 0;
let spinAngle = 0;      /* 原地转圈累计角度 */
let nextSpinShot = 0;   /* 转圈时下一次小弹幕时间 */
const DEFAULT_SCALE = 0.5;   /* 正常版 = 原来的最小版，整体缩小 */
const MIN_SCALE = 0.35;
const MAX_SCALE = 1.4;
let scaleFactor = DEFAULT_SCALE;
let modelReady = false;
let squashT = -1;

/* ---------------- 眨眼（随机间隔压扁眼部网格） ---------------- */

const eyeObjs = [];
let blinkState = null;
let blinkTimer = null;

function scheduleBlink(initial) {
  const delay = initial ? 900 : 1500 + Math.random() * 4500; /* 1.5~6 秒，不规律 */
  clearTimeout(blinkTimer);
  blinkTimer = setTimeout(() => {
    doBlink();
    scheduleBlink(false);
  }, delay);
}

function doBlink() {
  blinkState = { t0: performance.now(), dur: 120 + Math.random() * 40 }; /* 非常快速的眨眼 */
  /* 约 12% 概率连眨两下，更生动 */
  if (Math.random() < 0.12) {
    setTimeout(() => {
      blinkState = { t0: performance.now(), dur: 100 + Math.random() * 30 };
    }, 250 + Math.random() * 100);
  }
}

/* ---------------- 加载模型 ---------------- */

const loader = new GLTFLoader();
loader.load('./model/koishi.glb', (gltf) => {
  const m = gltf.scene;
  /* 模型顶点为毫米坐标，glTF 场景根节点自带 0.001 缩放（即实际 0.1 米高），无需再缩放 */
  root.add(m);

  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  root.position.x -= center.x;
  root.position.y -= box.min.y; // 脚底贴地
  root.position.z -= center.z;
  modelSize.copy(size);

  const fov = (camera.fov * Math.PI) / 180;
  const aspect = W / H;
  const margin = 0.15;
  const vh = size.y * (1 + margin * 2);
  const vw = size.x * (1 + margin * 2);
  camDist = Math.max(
    vh / (2 * Math.tan(fov / 2)),
    vw / (2 * Math.tan(fov / 2) * aspect)
  );
  applyCamera();

  modelReady = true;
  console.log('[model] loaded, size=', size.toArray().map((v) => v.toFixed(3)).join(','), 'camDist=', camDist.toFixed(3));
  window.petAPI.sendSpec({ clips: (gltf.animations || []).map((c) => c.name) });

  /* 收集眼部网格（深蓝竖椭圆眼睛 + 浅色细边），眨眼时整体压扁。
     注意：几何原点不在椭圆中心，scale.y 会绕着原点塌陷（眼睛"掉到地上"），
     所以先把几何中心平移到节点原点，缩放即围绕中心对折成一条线。 */
  const recentered = new Set();
  m.traverse((o) => {
    const n = o.name || '';
    if (!(n.includes('简洁深蓝竖椭圆眼睛') || n.includes('眼睛浅色细边'))) return;
    const g = o.geometry;
    if (g && !recentered.has(g)) {
      g.computeBoundingBox();
      const bb = g.boundingBox;
      const cx = (bb.min.x + bb.max.x) / 2;
      const cy = (bb.min.y + bb.max.y) / 2;
      const cz = (bb.min.z + bb.max.z) / 2;
      /* 几何顶点是毫米，节点 scale 0.001 负责毫米→米；
         位移补偿必须乘上节点缩放，否则眼睛会飞到 1000 倍远 */
      const k = o.scale.y || 1;
      g.translate(-cx, -cy, -cz);
      o.position.x += cx * k;
      o.position.y += cy * k;
      o.position.z += cz * k;
      recentered.add(g);
    }
    eyeObjs.push({ obj: o, baseY: o.scale.y });
  });
  scheduleBlink(true);

  setTimeout(makeTrayIcon, 120);
  setTimeout(snapshot, 800);
}, undefined, (err) => console.error('[model] FAIL', err));

function snapshot() {
  snapshotPending = true;
}

/* 验证用：在渲染循环内抓帧（保证绘制缓冲区有效） */
let snapshotPending = false;
function takeSnapshot() {
  try {
    const gl = renderer.getContext();
    const probes = [[0.5, 0.5], [0.5, 0.35], [0.3, 0.5], [0.7, 0.6], [0.5, 0.8]];
    const vals = probes.map(([nx, ny]) => {
      const p = new Uint8Array(4);
      gl.readPixels(Math.floor(canvas.width * nx), Math.floor(canvas.height * ny), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, p);
      return `${nx},${ny}:${Array.from(p).join('/')}`;
    });
    console.log('[snapshot] probes', vals.join(' | '));
    const url = canvas.toDataURL('image/png');
    console.log('[snapshot] dataURL length=', url.length);
    window.petAPI.sendSnapshot(url);
  } catch (e) {
    console.error('[snapshot] FAIL', e.message);
  }
}

function applyCamera() {
  const f = scaleFactor;
  const y = modelSize.y * 0.46;
  camera.position.set(0, y, camDist / f);
  camera.lookAt(0, y, 0);
}

/* ---------------- 菜单栏图标 ---------------- */

function makeTrayIcon() {
  try {
    const r2 = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    r2.setSize(128, 128);
    r2.setClearColor(0x000000, 0);
    r2.toneMapping = renderer.toneMapping;
    r2.toneMappingExposure = renderer.toneMappingExposure;
    const c2 = new THREE.PerspectiveCamera(40, 1, 0.01, 100);
    const yT = modelSize.y * 0.58;
    const d2 = (modelSize.y * 0.8) / (2 * Math.tan((20 * Math.PI) / 180));
    c2.position.set(0, yT, d2);
    c2.lookAt(0, yT, 0);
    r2.render(scene, c2);
    const url = r2.domElement.toDataURL('image/png');
    window.petAPI.sendIcon(url);
    r2.dispose();
  } catch (e) {
    console.error('[trayicon]', e);
  }
}

/* ---------------- 交互：左键拖动 / 右键旋转 / 滚轮缩放 / 点击 ---------------- */

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let dragging = false;
let rotating = false;
let grab = false;
let moved = 0;
let rightMoved = 0;
let last = { x: 0, y: 0 };
let dragStart = null;   /* {sx, sy} 按下时的光标屏幕坐标 */
let userRotY = 0;   /* 用户右键旋转的朝向偏移 */
let userRotX = 0;

canvas.addEventListener('pointerdown', (e) => {
  if (e.button === 2) {
    /* 右键按下：开始旋转（不需要命中模型） */
    rotating = true;
    rightMoved = 0;
    last = { x: e.clientX, y: e.clientY };
    canvas.setPointerCapture(e.pointerId);
    return;
  }
  /* 左键：先判断是否点中桌宠，命中才进入拖动 */
  pointer.set((e.clientX / W) * 2 - 1, -(e.clientY / H) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  if (raycaster.intersectObject(root, true).length === 0) return;
  grab = true;
  dragging = true;
  moved = 0;
  if (Number.isFinite(e.screenX) && Number.isFinite(e.screenY)) {
    dragStart = { sx: e.screenX, sy: e.screenY };
    window.petAPI.dragStart(e.screenX, e.screenY);
  }
  canvas.setPointerCapture(e.pointerId);
});

canvas.addEventListener('pointermove', (e) => {
  if (rotating) {
    const dx = e.clientX - last.x;
    const dy = e.clientY - last.y;
    last = { x: e.clientX, y: e.clientY };
    rightMoved += Math.abs(dx) + Math.abs(dy);
    userRotY -= dx * 0.012;   /* 水平拖动 → 绕 Y 轴旋转 */
    userRotX = Math.max(-1.2, Math.min(1.2, userRotX + dy * 0.008)); /* 垂直拖动 → 轻微俯仰 */
    return;
  }
  if (!dragging || !dragStart) return;
  if (!Number.isFinite(e.screenX) || !Number.isFinite(e.screenY)) return;
  moved += Math.abs(e.screenX - dragStart.sx) + Math.abs(e.screenY - dragStart.sy);
  window.petAPI.dragMove(e.screenX, e.screenY);
});

function endDrag() {
  if (rotating) {
    rotating = false;
    return;
  }
  if (!grab) return;
  grab = false;
  dragging = false;
  dragStart = null;
  window.petAPI.dragEnd();
  if (moved < 6) onTap();
}
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);

/* 右键仅用于旋转，不在顶部弹出任何菜单（菜单从托盘图标进入） */
canvas.addEventListener('contextmenu', (e) => {
  e.preventDefault();
});

/* 滚轮缩放 */
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  scaleFactor = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scaleFactor * (e.deltaY > 0 ? 0.92 : 1.08)));
  applyCamera();
}, { passive: false });

/* ---------------- 点击反应：东方弹幕（JS 逐帧驱动） ---------------- */

/* 5 种弹型：心形 / 四角星 / 米粒（竖椭圆）/ 圆弹 / Ω，字符型或图形型 */
const BULLET_TYPES = [
  { ch: '♥' },
  { ch: '✦' },
  { shape: 'grain' },
  { shape: 'ball' },
  { ch: 'Ω' }
];
const BULLET_COLORS = ['#f25896', '#ad7afc', '#52d1a3', '#ffc240', '#61b8ff', '#fa8559'];
const BULLET_MAX = 640;

let bullets = [];   /* 每颗：el/type/color/born/lifetime/angle/speed/radius/size/spin */

function onTap() {
  squashT = 0;
  window.petAPI.bounce();
  spawnBullets();
}

/* 娃娃中心的世界坐标 → 屏幕像素（跟随旋转 / 摆动 / 缩放） */
function bulletCenter() {
  const box = new THREE.Box3().setFromObject(root);
  const c = box.getCenter(new THREE.Vector3());
  c.project(camera);
  return {
    x: (c.x * 0.5 + 0.5) * W,
    y: (-c.y * 0.5 + 0.5) * H
  };
}

function spawnBullets() {
  const phase = Math.random() * Math.PI * 2;
  const s = W / 480;   /* 窗口基准换算，保证与 480 宽窗口同观感 */
  for (let ring = 0; ring < 2; ring++) {
    const count = ring === 0 ? 20 : 16;
    /* 每圈统一符号与颜色，环形整齐有序 */
    const type = Math.floor(Math.random() * BULLET_TYPES.length);
    const color = BULLET_COLORS[Math.floor(Math.random() * BULLET_COLORS.length)];
    for (let i = 0; i < count; i++) {
      const b = {
        type, color,
        born: performance.now() / 1000,
        lifetime: 1.8,
        angle: phase + (i * Math.PI * 2) / count + ring * (Math.PI / 16),
        speed: (ring === 0 ? 105 : 158) * s,
        radius: (ring === 0 ? 8 : 22) * s,
        size: (ring === 0 ? 10 : 17) * s,
        spin: Math.random() * 6 - 3
      };
      bullets.push(b);
      makeBulletEl(b);
    }
  }
  /* 超出上限时回收最早的弹幕及其 DOM */
  if (bullets.length > BULLET_MAX) {
    const drop = bullets.splice(0, bullets.length - BULLET_MAX);
    for (const b of drop) b.el.remove();
  }
  console.log('[bullets] fired', bullets.length);
}

/* 转圈时散发的一小圈低调弹幕：8 颗小弹、慢速、小半径 */
function spawnMiniRing() {
  const phase = Math.random() * Math.PI * 2;
  const s = W / 480;
  const type = Math.floor(Math.random() * BULLET_TYPES.length);
  const color = BULLET_COLORS[Math.floor(Math.random() * BULLET_COLORS.length)];
  for (let i = 0; i < 8; i++) {
    const b = {
      type, color,
      born: performance.now() / 1000,
      lifetime: 1.4,
      angle: phase + (i * Math.PI * 2) / 8,
      speed: 62 * s,
      radius: 30 * s,
      size: 8 * s,
      spin: Math.random() * 6 - 3
    };
    bullets.push(b);
    makeBulletEl(b);
  }
  console.log('[bullets] mini-ring', bullets.length);
}

function makeBulletEl(b) {
  const t = BULLET_TYPES[b.type];
  const el = document.createElement('div');
  el.className = 'mark bullet ' + (t.shape ? 'b-' + t.shape : '');
  el.style.color = b.color;
  if (t.ch) el.textContent = t.ch;
  fx.appendChild(el);
  b.el = el;
}

function updateBullets() {
  if (bullets.length === 0) return;
  const now = performance.now() / 1000;
  const c = bulletCenter();
  const keep = [];
  for (const b of bullets) {
    const age = now - b.born;
    if (age >= b.lifetime) { b.el.remove(); continue; }
    /* 飞行中随当前缩放实时伸缩，圆心跟随角色 */
    const dist = (b.radius + b.speed * age) * scaleFactor;
    const x = c.x + Math.cos(b.angle) * dist;
    const y = c.y + Math.sin(b.angle) * dist;
    const size = b.size * scaleFactor;
    const alpha = Math.max(0, Math.min(1, (b.lifetime - age) / 0.65));
    b.el.style.transform =
      'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) translate(-50%,-50%) rotate(' + (b.spin * age * 57.3).toFixed(1) + 'deg)';
    b.el.style.opacity = alpha.toFixed(3);
    const t = BULLET_TYPES[b.type];
    if (t.shape === 'grain') {
      b.el.style.width = size.toFixed(1) + 'px';
      b.el.style.height = (size * 2.6).toFixed(1) + 'px';
    } else if (t.shape === 'ball') {
      b.el.style.width = size.toFixed(1) + 'px';
      b.el.style.height = size.toFixed(1) + 'px';
    } else {
      b.el.style.fontSize = size.toFixed(1) + 'px';
    }
    keep.push(b);
  }
  bullets = keep;
}

/* ---------------- 主进程命令 ---------------- */

window.petAPI.onCommand((p) => {
  switch (p.cmd) {
    case 'set-idle':
      idleMode = p.index;
      break;
    case 'walk-start':
      prevIdleMode = idleMode;
      idleMode = 3;
      break;
    case 'walk-stop':
      idleMode = prevIdleMode;
      break;
    case 'spin':
      if (p.on) {
        prevIdleMode = idleMode;
        idleMode = 4;
        nextSpinShot = 0;
      } else {
        idleMode = prevIdleMode;
      }
      break;
    case 'scale':
      if (p.dir === 0) scaleFactor = DEFAULT_SCALE;
      else scaleFactor = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scaleFactor + (p.dir > 0 ? 0.15 : -0.15)));
      applyCamera();
      break;
    case 'reset-rot':
      userRotY = 0;
      userRotX = 0;
      break;
  }
});

/* ---------------- 渲染循环 ---------------- */

function animate() {
  requestAnimationFrame(animate);
  const now = performance.now() / 1000;
  const dt = Math.min(now - lastT, 0.05);
  lastT = now;
  elapsedT += dt;
  const t = elapsedT;
  if (!modelReady) return;

  /* 点击挤压回弹 */
  let sx = 1, sy = 1, sz = 1;
  if (squashT >= 0) {
    squashT += dt;
    if (squashT < 0.13) {
      const k = squashT / 0.13;
      sx = 1 + 0.1 * k; sy = 1 - 0.14 * k; sz = 1 + 0.1 * k;
    } else if (squashT < 0.36) {
      const k = (squashT - 0.13) / 0.23;
      sx = 1.1 - 0.1 * k; sy = 0.86 + 0.14 * k; sz = 1.1 - 0.1 * k;
    } else {
      squashT = -1;
    }
  }

  /* 待机动作 */
  let rotY = 0, rotZ = 0, bobY = 0;
  if (idleMode === 0) {         /* 轻轻摇晃 */
    rotY = Math.sin(t * 0.7) * 0.09;
    rotZ = Math.sin(t * 1.3) * 0.015;
    bobY = Math.sin(t * 1.8) * 0.012;
  } else if (idleMode === 1) {  /* 缓缓呼吸 */
    const s = Math.sin(t * 1.5) * 0.012;
    sx *= 1 + s; sy *= 1 - s; sz *= 1 + s;
    rotY = Math.sin(t * 0.5) * 0.03;
  } else if (idleMode === 2) {  /* 安静站立 */
    rotY = Math.sin(t * 0.3) * 0.012;
  } else if (idleMode === 3) {  /* 散步 */
    rotZ = -0.05 + Math.sin(t * 7) * 0.008;
    bobY = Math.abs(Math.sin(t * 5.5)) * 0.02;
  } else if (idleMode === 4) {  /* 原地转圈：非常缓慢地持续自转 */
    spinAngle += dt * 0.14;
    rotZ = Math.sin(t * 0.6) * 0.01;
    bobY = Math.sin(t * 1.1) * 0.006;
    if (t >= nextSpinShot) {
      spawnMiniRing();
      nextSpinShot = t + 2.2 + Math.random() * 1.8;
    }
  }

  /* 眨眼：眼部网格 Y 轴压扁再弹开（快闭 → 微停顿 → 缓开） */
  let blinkScaleY = 1;
  if (blinkState) {
    const bp = (performance.now() - blinkState.t0) / blinkState.dur;
    if (bp >= 1) {
      blinkState = null;
    } else if (bp < 0.4) {
      const k = bp / 0.4;
      blinkScaleY = 1 - 0.94 * k * k;
    } else if (bp < 0.65) {
      blinkScaleY = 0.06;
    } else {
      const k = (bp - 0.65) / 0.35;
      blinkScaleY = 0.06 + 0.94 * (1 - (1 - k) * (1 - k));
    }
  }
  for (const eo of eyeObjs) eo.obj.scale.y = eo.baseY * blinkScaleY;

  /* 弹幕粒子逐帧更新（随角色中心与缩放实时跟随） */
  updateBullets();

  root.rotation.y = userRotY + rotY + spinAngle;
  root.rotation.z = rotZ;
  root.rotation.x = userRotX;
  root.position.y = bobY;
  root.scale.set(sx, sy, sz);

  renderer.render(scene, camera);

  if (snapshotPending) {
    snapshotPending = false;
    takeSnapshot();
  }
}
animate();
