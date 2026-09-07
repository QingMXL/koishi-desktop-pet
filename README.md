<div align="center">

# 🖥️ koishi-desktop-pet

### 古明地恋 · macOS 桌面桌宠

一只住在你桌面上的东方角色 —— 透明置顶的 3D 娃娃，会用鼠标陪你玩，会眨眼、会散步、会放弹幕。

<p align="center">
  <span style="background-color:#2da44e;color:#ffffff;padding:6px 16px;border-radius:20px;font-weight:600;">🇨🇳 中文</span>
  <a href="README_EN.md"><span style="background-color:#57606a;color:#ffffff;padding:6px 16px;border-radius:20px;font-weight:600;">🇬🇧 English</span></a>
  <a href="README_KO.md"><span style="background-color:#57606a;color:#ffffff;padding:6px 16px;border-radius:20px;font-weight:600;">🇰🇷 한국어</span></a>
  <a href="README_JA.md"><span style="background-color:#57606a;color:#ffffff;padding:6px 16px;border-radius:20px;font-weight:600;">🇯🇵 日本語</span></a>
</p>

<p align="center"><img src="预览.png" width="50%" alt="preview"></p>

<p align="center"><b>关于她</b></p>

<p align="center" style="max-width:640px;margin:0 auto;">古明地恋是《东方Project》中的觉妖怪，古明地觉的妹妹。她主动闭上了能读取人心的第三只眼，不再受他人想法的束缚，成为「无意识」的、随心所欲的自由存在——表情捉摸不定，行为难以预测。在这个项目里，她住进了你的桌面：会呼吸、会眨眼、会四处散步，点击她时会开心地放出弹幕，还可以旋转朝向、缩放大小，任你摆弄。</p>

</div>

---

## ✨ 功能特性

### 桌面表现
- 透明、无边框、始终置顶的小窗口，不占 Dock / 任务栏，默认出现在屏幕右下角
- 菜单栏常驻角色头像，一键切换动作、退出

### 鼠标交互（全鼠标操作）
| 操作 | 效果 |
|---|---|
| 左键拖拽 | 移动娃娃（点中角色才生效，透明区域鼠标可穿透） |
| 左键单击 | 挤压回弹 + 发射一圈弹幕 |
| 左键双击 | 两次回弹 + 两组弹幕（四圈） |
| 右键左右拖 | 旋转朝向 |
| 右键上下拖 | 俯仰视角（限制 ±1.2 rad），右键单击无反应 |
| 滚轮 | 缩放，范围 0.35× – 1.4×，默认 0.5× |

### 东方弹幕
- 点击后从**娃娃身体中心**向外发射两圈同心弹幕：内圈 20 颗小弹 + 外圈 16 颗大弹
- 每圈统一符号与颜色：♥、四角星、米粒、圆弹、Ω，带白色描边
- 弹幕自旋飞行、渐隐消失，滞空 1.8 秒，上限 640 颗自动回收
- **飞行中的弹幕实时跟随角色位置与缩放**——拖动娃娃、滚动滚轮，弹幕同步跟着走

### 自主行为
- **眨眼**：蓝绿色眼睛不规律眨动，快速合拢成一条细线再睁开，偶发连眨
- **待机动作**：轻微摇晃（默认）/ 呼吸 / 站立，可在菜单栏切换
- **散步模式**：沿屏幕底部来回溜达、带轻跳；拖拽或转向即停止

### 其他
- 单实例：重复启动只把现有娃娃置前，不会出现第二个
- 无通知、无弹窗、无右键菜单、无声音、无需键盘

---

## 🚀 快速开始

### 直接运行（打包版）
运行 `dist/古明地恋桌宠-darwin-arm64/` 内的 App，或双击桌面上的 **古明地恋桌宠** 快捷方式。

### 源码运行
```bash
npm install
npm start
```

### 重新打包
```bash
npm run build   # renderer.js → renderer.bundle.js
npx electron-packager . "古明地恋桌宠" \
  --platform=darwin --arch=arm64 \
  --icon=icon.icns --out=dist --overwrite \
  --prune=true --ignore="^/(dist|node_modules/(electron|electron-packager|esbuild))"
```

**要求**：macOS 12+、Apple Silicon；开发需要 Node.js 22+

---

## 📁 项目结构

```
koishi-desktop-pet/
├── main.js        # Electron 主进程：窗口 / 托盘 / IPC / 单实例
├── preload.js     # 渲染进程桥接（拖拽、弹跳、托盘、截图）
├── renderer.js    # Three.js 场景、交互、弹幕、眨眼、待机/散步
├── index.html     # 页面骨架 + 弹幕样式层
├── vendor/        # 本地化的 three.module.js + GLTFLoader
├── model/koishi.glb   # 古明地恋 3D 模型
├── icon.icns      # App / 托盘图标（角色形象）
└── 预览.png       # 渲染预览图
```

---

## 💗 致谢

感谢 **ZUN（太田顺也）** 创造了东方 Project，以及这个闭着第三眼、读不了心却最懂人心的古明地恋。

也要感谢**东方众**这个群体——一群很伟大也很美好的伙伴。大家细腻、温柔，用同人和爱把幻想乡越织越大。能和你们身处同一个圈子，是这个桌宠诞生的一部分原因。

弹幕灵感来自东方 Project 的弹幕美学——而这个项目里的古明地恋，正来自她的主场《东方地灵殿》。

**期待《东方红魔乡：新典 ～ the Embodiment of Scarlet Devil.》！** 时隔 24 年，ZUN 亲自重制红魔乡，2026 年 9 月 10 日发售，弹幕要回来了。

> 本作品为粉丝自制、非官方项目；3D 模型由用户提供（Blender 导出），东方 Project 及其角色版权归 ZUN / 上海爱丽丝幻乐团所有。
