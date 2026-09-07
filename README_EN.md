<div align="center">

# 🖥️ koishi-desktop-pet

### Koishi Komeiji · macOS Desktop Pet

A Touhou character living on your desktop — a transparent, always-on-top 3D doll that plays along with your mouse, blinks, strolls around, and fires danmaku.

<p align="center">
  <a href="README.md"><span style="background-color:#57606a;color:#ffffff;padding:6px 16px;border-radius:20px;font-weight:600;">🇨🇳 中文</span></a>
  <span style="background-color:#2da44e;color:#ffffff;padding:6px 16px;border-radius:20px;font-weight:600;">🇬🇧 English</span>
  <a href="README_KO.md"><span style="background-color:#57606a;color:#ffffff;padding:6px 16px;border-radius:20px;font-weight:600;">🇰🇷 한국어</span></a>
  <a href="README_JA.md"><span style="background-color:#57606a;color:#ffffff;padding:6px 16px;border-radius:20px;font-weight:600;">🇯🇵 日本語</span></a>
</p>

<p align="center"><img src="预览.png" width="50%" alt="preview"></p>

<p align="center"><b>About her</b></p>

<p align="center" style="max-width:640px;margin:0 auto;">Koishi Komeiji is a satori youkai from Touhou Project — the younger sister of Satori Komeiji. She closed her mind-reading third eye on purpose, freeing herself from others' thoughts and becoming an "unconscious" being who follows only her own whims: her expressions are elusive, her behavior unpredictable. In this project she moves into your desktop: she breathes, blinks, strolls around, fires danmaku when you click her, and can be rotated and scaled however you like.</p>

</div>

---

## ✨ Features

### Desktop presence
- Transparent, frameless, always-on-top window — no Dock / taskbar entry, appears at the bottom-right of your screen
- Menu bar icon with the character's avatar; switch actions or quit from there

### Mouse control (all by mouse)
| Action | Effect |
|---|---|
| Left-drag | Move the character (raycast on the model; transparent areas pass through) |
| Left-click | Squash-and-bounce reaction + one danmaku ring |
| Left-double-click | Two bounces + two bursts (four rings) |
| Right-drag horizontal | Rotate facing |
| Right-drag vertical | Tilt pitch (clamped ±1.2 rad); right-click alone does nothing |
| Scroll wheel | Zoom, 0.35× – 1.4×, default 0.5× |

### Touhou-style danmaku
- Fired from the **center of the character's body** as two concentric rings: 20 small inner + 16 large outer bullets
- Each ring shares one symbol & color: ♥ four-point star, rice grain, circle, Ω — with white outlines
- Bullets spin, fade and expire over 1.8 s; up to 640 live bullets, auto-recycled
- **Live bullets follow the character's position and zoom in real time** — drag or scroll and the danmaku moves with her

### Autonomous behavior
- **Blink**: blue-green eyes squeeze shut into a thin line at irregular intervals, occasional double-blinks
- **Idle animations**: sway (default) / breathe / stand — switch from the menu bar icon
- **Walk mode**: strolls along the bottom of the screen with little hops; stops when you drag or rotate her

### Other
- Single instance: launching again only brings the pet to front — never a second one
- No notifications, no dialogs, no right-click menu, no sounds, no keyboard requirements

---

## 🚀 Quick Start

### Run the built app
Launch the app inside `dist/古明地恋桌宠-darwin-arm64/`, or double-click the **古明地恋桌宠** shortcut on your Desktop.

### Run from source
```bash
npm install
npm start
```

### Rebuild
```bash
npm run build   # renderer.js → renderer.bundle.js
npx electron-packager . "古明地恋桌宠" \
  --platform=darwin --arch=arm64 \
  --icon=icon.icns --out=dist --overwrite \
  --prune=true --ignore="^/(dist|node_modules/(electron|electron-packager|esbuild))"
```

**Requirements**: macOS 12+, Apple Silicon; Node.js 22+ for development

---

## 📁 Project layout

```
koishi-desktop-pet/
├── main.js        # Electron main process: window / tray / IPC / single-instance
├── preload.js     # Renderer bridge (drag, bounce, tray, snapshot)
├── renderer.js    # Three.js scene, interactions, danmaku, blink, idle/walk
├── index.html     # Page shell + danmaku fx layer
├── vendor/        # Localised three.module.js + GLTFLoader
├── model/koishi.glb   # The Koishi 3D model
├── icon.icns      # App / tray icon (character avatar)
└── 预览.png       # Render preview
```

---

## 💗 Credits

Thanks to **ZUN (Jun'ya Ota)** for creating Touhou Project — and Koishi, the girl with the closed third eye who can't read minds yet understands people best.

And thanks to the **Touhou fandom** itself — a truly great and wonderful community. Kind, attentive, and deeply caring, you keep weaving Gensokyo bigger with fan works and love. Being part of this circle is part of why this pet exists.

Danmaku aesthetics are inspired by Touhou Project itself — and this Koishi hails from her home stage, *Touhou Chireiden ~ Subterranean Animism*.

**Looking forward to *Touhou Koumakyou: New Classic ~ the Embodiment of Scarlet Devil.*!** 24 years later, ZUN personally remasters Touhou Koumakyou — releasing **September 10, 2026**. The danmaku is coming back.

> Fan-made, unofficial project. The 3D model was provided by the user (Blender export). Touhou Project and its characters are © ZUN / Team Shanghai Alice.
