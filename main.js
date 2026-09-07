const { app, BrowserWindow, Tray, Menu, ipcMain, screen, nativeImage, protocol, net } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

const DEBUG_CAPTURE = process.env.DEBUG_CAPTURE === '1';

/* 自定义 pet:// 协议：file:// 下 ES 模块脚本不会被加载，必须用带 origin 的协议 */
protocol.registerSchemesAsPrivileged([
  { scheme: 'pet', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } }
]);

/* 单实例：无论从快捷方式还是终端启动，都只保留一个桌宠 */
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (win && !win.isDestroyed()) {
      win.show();
      win.moveTop();
    }
  });
}

let win = null;
let tray = null;
let walking = false;
let walkTimer = null;
let spinning = false;
let alwaysTop = true;
let dragState = null;

/* 主进程异常只记录日志，不再弹出系统错误对话框 */
process.on('uncaughtException', (err) => {
  console.error('[main] uncaughtException', err && err.message, err && err.stack);
});
process.on('unhandledRejection', (reason) => {
  console.error('[main] unhandledRejection', reason && reason.message || reason);
});

function sendCmd(payload) {
  if (win && !win.isDestroyed()) win.webContents.send('pet-command', payload);
}

function createWindow() {
  const wa = screen.getPrimaryDisplay().workArea;
  const w = 420, h = 560;
  win = new BrowserWindow({
    width: w,
    height: h,
    x: Math.round(wa.x + wa.width - w - 32),
    y: Math.round(wa.y + wa.height - h - 12),
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    movable: true,
    hasShadow: false,
    fullscreenable: false,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false
    }
  });
  win.setAlwaysOnTop(true, 'floating');
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  win.once('ready-to-show', () => {
    win.show();
    win.moveTop();
    const b = win.getBounds();
    const wa = screen.getPrimaryDisplay().workArea;
    console.log('[main] window shown at', b.x, b.y, 'workArea', wa.x, wa.y, wa.width, wa.height);
  });
  win.loadURL('pet://pet/index.html');
  win.webContents.on('console-message', (event) => console.log('[renderer]', event.message));
  win.on('closed', () => { win = null; });
  if (DEBUG_CAPTURE) setTimeout(runCapture, 2200);
}

/* ---------------- tray ---------------- */

function fallbackIcon() {
  const size = 32;
  const buf = Buffer.alloc(size * size * 4);
  const cx = 15.5, cy = 15.5, r = 14;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x - cx, y - cy);
      const i = (y * size + x) * 4;
      if (d <= r) {
        buf[i] = 243; buf[i + 1] = 182; buf[i + 2] = 210; buf[i + 3] = 255;
      } else if (d <= r + 2) {
        buf[i] = 255; buf[i + 1] = 255; buf[i + 2] = 255; buf[i + 3] = 255;
      } else {
        buf[i] = 0; buf[i + 1] = 0; buf[i + 2] = 0; buf[i + 3] = 0;
      }
    }
  }
  return nativeImage.createFromBuffer(buf, { width: size, height: size });
}

function buildMenu() {
  return Menu.buildFromTemplate([
    { label: '古明地恋桌宠', enabled: false },
    { type: 'separator' },
    {
      label: '闲置动作',
      submenu: [
        { label: '轻轻摇晃', type: 'radio', checked: true, click: () => sendCmd({ cmd: 'set-idle', index: 0 }) },
        { label: '缓缓呼吸', type: 'radio', click: () => sendCmd({ cmd: 'set-idle', index: 1 }) },
        { label: '安静站立', type: 'radio', click: () => sendCmd({ cmd: 'set-idle', index: 2 }) }
      ]
    },
    {
      label: '大小',
      submenu: [
        { label: '放大', click: () => sendCmd({ cmd: 'scale', dir: 1 }) },
        { label: '缩小', click: () => sendCmd({ cmd: 'scale', dir: -1 }) },
        { label: '还原', click: () => sendCmd({ cmd: 'scale', dir: 0 }) }
      ]
    },
    { label: '恢复朝向', click: () => sendCmd({ cmd: 'reset-rot' }) },
    {
      label: '散步模式',
      type: 'checkbox',
      checked: walking,
      click: (item) => toggleWalk(item.checked)
    },
    {
      label: '原地转圈',
      type: 'checkbox',
      checked: spinning,
      click: (item) => toggleSpin(item.checked)
    },
    {
      label: '始终置顶',
      type: 'checkbox',
      checked: alwaysTop,
      click: (item) => {
        alwaysTop = item.checked;
        if (win) win.setAlwaysOnTop(alwaysTop, 'floating');
        refreshTrayMenu();
      }
    },
    { type: 'separator' },
    { label: '退出桌宠', click: () => app.quit() }
  ]);
}

function createTray() {
  tray = new Tray(fallbackIcon());
  tray.setToolTip('古明地恋桌宠');
  refreshTrayMenu();
  tray.on('click', refreshTrayMenu);
}

function refreshTrayMenu() {
  tray.setContextMenu(buildMenu());
}

/* ---------------- walk mode ---------------- */

function toggleWalk(on) {
  if (on && spinning) toggleSpin(false);   /* 散步与转圈互斥 */
  walking = on;
  if (walking) startWalk();
  else stopWalk();
  refreshTrayMenu();
}

function startWalk() {
  stopWalk();
  if (!win || win.isDestroyed()) return;
  const wa = screen.getPrimaryDisplay().workArea;
  const b = win.getBounds();
  /* 散步从当前位置开始：保持当前高度，只在屏幕左右往返 */
  const baseY = b.y;
  let x = Math.min(Math.max(b.x, wa.x), wa.x + wa.width - b.width);
  let dir = 1;
  sendCmd({ cmd: 'walk-start' });
  walkTimer = setInterval(() => {
    if (!win || win.isDestroyed()) { stopWalk(); return; }
    const bb = win.getBounds();
    const maxX = wa.x + wa.width - bb.width;
    x += dir * 2.6;
    if (x <= wa.x) { x = wa.x; dir = 1; }
    if (x >= maxX) { x = maxX; dir = -1; }
    const hop = Math.abs(Math.sin(x * 0.045)) * 9;
    win.setPosition(Math.round(x), Math.round(baseY - hop));
  }, 30);
}

function stopWalk() {
  if (walkTimer) { clearInterval(walkTimer); walkTimer = null; }
  sendCmd({ cmd: 'walk-stop' });
}

function toggleSpin(on) {
  if (on && walking) toggleWalk(false);    /* 转圈与散步互斥 */
  spinning = on;
  sendCmd({ cmd: 'spin', on });
  refreshTrayMenu();
}

/* ---------------- IPC ---------------- */

/* 绝对坐标拖动：窗口位置 = 按下时窗口位置 + (光标当前位置 - 按下时光标位置) */
ipcMain.on('pet-drag-start', (_e, sx, sy) => {
  if (!win || win.isDestroyed()) return;
  if (walking) toggleWalk(false);
  if (!Number.isFinite(sx) || !Number.isFinite(sy)) return;
  const [wx, wy] = win.getPosition();
  dragState = { wx, wy, sx, sy };
});

ipcMain.on('pet-drag-move', (_e, sx, sy) => {
  if (!win || win.isDestroyed() || !dragState) return;
  if (!Number.isFinite(sx) || !Number.isFinite(sy)) return;
  const nx = dragState.wx + (sx - dragState.sx);
  const ny = dragState.wy + (sy - dragState.sy);
  if (!Number.isFinite(nx) || !Number.isFinite(ny)) return;
  win.setPosition(Math.round(nx), Math.round(ny));
  if (!dragState.logged) {
    dragState.logged = true;
    console.log('[main] drag moved window to', Math.round(nx), Math.round(ny));
  }
});

ipcMain.on('pet-drag-end', () => {
  dragState = null;
});

ipcMain.on('pet-bounce', () => {
  if (!win || win.isDestroyed()) return;
  const [x, y] = win.getPosition();
  const up = 14;
  let t = 0;
  const step = () => {
    if (!win || win.isDestroyed()) return;
    t += 40;
    const k = Math.min(t / 260, 1);
    const off = up * Math.sin(Math.PI * k);
    win.setPosition(x, Math.round(y - off));
    if (k < 1) setTimeout(step, 30);
  };
  step();
});

ipcMain.on('pet-spec', () => {
  /* 预留：模型动画列表 */
});

ipcMain.on('pet-icon', (_e, dataUrl) => {
  try {
    const img = nativeImage.createFromDataURL(dataUrl);
    if (!img.isEmpty()) {
      tray.setImage(img.resize({ width: 20, height: 20, quality: 'best' }));
    }
  } catch (err) {
    console.error('[tray icon]', err);
  }
});

ipcMain.on('pet-snapshot', (_e, dataUrl) => {
  try {
    const img = nativeImage.createFromDataURL(dataUrl);
    const f = path.join(app.getPath('temp'), 'koishi_pet_snapshot.png');
    fs.writeFileSync(f, img.toPNG());
    console.log('[snapshot] saved', f, img.getSize());
  } catch (err) {
    console.error('[snapshot] main err', err.message);
  }
});

/* ---------------- debug capture ---------------- */

async function runCapture() {
  const outDir = path.join(app.getPath('temp'), 'koishi_pet_capture');
  fs.mkdirSync(outDir, { recursive: true });
  for (let i = 0; i < 5; i++) {
    try {
      const img = await win.webContents.capturePage();
      const f = path.join(outDir, `frame_${i}.png`);
      fs.writeFileSync(f, img.toPNG());
      console.log('[capture]', f);
    } catch (e) {
      console.log('[capture] err', e.message);
    }
    await new Promise((r) => setTimeout(r, 1100));
  }
  console.log('[capture] done');
}

/* ---------------- app ---------------- */

app.whenReady().then(() => {
  protocol.handle('pet', (request) => {
    const url = new URL(request.url);
    const rel = decodeURIComponent(url.pathname.replace(/^\/+/, ''));
    const filePath = path.normalize(path.join(__dirname, rel));
    if (!filePath.startsWith(__dirname)) {
      return new Response('forbidden', { status: 403 });
    }
    return net.fetch(pathToFileURL(filePath).toString()).catch(() => new Response('not found', { status: 404 }));
  });
  app.setActivationPolicy('accessory');
  createWindow();
  createTray();
});
