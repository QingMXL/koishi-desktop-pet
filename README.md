# koishi-desktop-pet

A tiny macOS desktop pet featuring **Koishi Komeiji** (古明地恋) from *Touhou Project*, rendered as a transparent, always-on-top 3D character living on your desktop.

Built with Electron + Three.js. The 3D model is the original Q-version Koishi GLB (green hair, black hat with yellow ribbon, yellow-green outfit, purple heart-shaped cords, closed third eye).

![preview](预览.png)

## Features

- **Desktop presence** — transparent, frameless, always-on-top window; no taskbar entry; appears at the bottom-right of your screen.
- **Mouse control (all by mouse)**
  - **Left-drag** — move the character around the desktop (raycast on the model, so clicking the transparent area passes through).
  - **Left-click** — squash-and-bounce reaction + fires a ring of danmaku.
  - **Left-double-click** — two bursts of danmaku (four rings total).
  - **Right-drag horizontal** — rotate the character's facing.
  - **Right-drag vertical** — tilt pitch, clamped to ±1.2 rad. (Right-click alone does nothing.)
  - **Scroll wheel** — zoom in/out, range 0.35× – 1.4×, default 0.5×.
- **Danmaku (Touhou-style bullet ring)** — fired from the character's center outward, in two clean concentric rings (20 small + 16 large per burst). Each ring shares one symbol and one color: ♥ four-point star, rice-grain, circle, Ω — with white outlines. Bullets spin, fade out over 1.8 s (up to 640 live), and **follow the character's position and live zoom in real time**.
- **Autonomous behavior**
  - **Blink** — both blue-green eyes squeeze shut into a thin centered line very fast, irregular intervals (1.5–6 s), occasional double-blink.
  - **Idle animations** — sway (default), breathe, or stand still (switch from the menu bar icon).
  - **Walk mode** — strolls along the bottom of the screen with little hops; stops when you drag or rotate it.
- **Menu bar icon** — idle mode, size reset, face reset, walk mode, always-on-top toggle, quit.
- **Single instance** — launching again just brings the existing pet to front; no second character.
- No notifications, dialogs, right-click menus, sounds, or keyboard requirements.

## Requirements

- macOS 12+, Apple Silicon (arm64)
- Node.js 22+ (only needed to build / develop)

## Run

### Quick start (built app)

Run the packaged app inside `dist/古明地恋桌宠-darwin-arm64/`, or double-click the **古明地恋桌宠** shortcut on the Desktop.

### From source

```bash
npm install
npm start
```

## Build

```bash
npm run build          # bundle renderer.js → renderer.bundle.js
npx electron-packager . "古明地恋桌宠" \
  --platform=darwin --arch=arm64 \
  --icon=icon.icns --out=dist --overwrite \
  --prune=true --ignore="^/(dist|node_modules/(electron|electron-packager|esbuild))"
```

Output: `dist/古明地恋桌宠-darwin-arm64/古明地恋桌宠.app`

## Project layout

```
koishi-desktop-pet/
├── main.js               # Electron main process (window, tray, IPC, single-instance)
├── preload.js            # contextBridge API (drag, bounce, tray, snapshot)
├── renderer.js           # Three.js scene, interactions, danmaku, blink, idle/walk
├── index.html            # page shell + fx layer styles
├── vendor/               # localised three.module.js + GLTFLoader (pet:// protocol)
├── model/koishi.glb      # the Koishi 3D model
├── icon.icns             # app + tray icon (character avatar)
└── 预览.png              # render preview
```

## Credits

- Model: user-provided `古明地恋_100mm.glb` (Blender export, untouched)
- Danmaku design inspired by *Touhou Project* bullet patterns
