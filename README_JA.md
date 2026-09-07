<div align="center">

# 🖥️ koishi-desktop-pet

### 古明地こいし · macOS デスクトップペット

デスクトップに棲む東方キャラクター — 透明で常に最前面の 3D フィギュア。マウスで一緒に遊び、瞬きし、散歩し、弾幕を放ちます。

<p align="center">
  <a href="README.md"><span style="background-color:#57606a;color:#ffffff;padding:6px 16px;border-radius:20px;font-weight:600;">🇨🇳 中文</span></a>
  <a href="README_EN.md"><span style="background-color:#57606a;color:#ffffff;padding:6px 16px;border-radius:20px;font-weight:600;">🇬🇧 English</span></a>
  <a href="README_KO.md"><span style="background-color:#57606a;color:#ffffff;padding:6px 16px;border-radius:20px;font-weight:600;">🇰🇷 한국어</span></a>
  <span style="background-color:#2da44e;color:#ffffff;padding:6px 16px;border-radius:20px;font-weight:600;">🇯🇵 日本語</span>
</p>

<p align="center"><img src="预览.png" width="55%" alt="preview"></p>

</div>

---

## ✨ 機能

### デスクトップ表示
- 透明・枠なし・常に最前面の小さなウィンドウ。Dock／タスクバーを占有せず、デフォルトで画面右下に表示
- メニューバーにキャラのアバターを常駐、ワンクリックで動作切替・終了

### マウス操作（すべてマウスで）
| 操作 | 効果 |
|---|---|
| 左ドラッグ | キャラを移動（キャラを正確に掴んだときだけ作動、透明部分はクリック透過） |
| 左クリック | スカッシュ反動 + 弾幕 1 リング発射 |
| 左ダブルクリック | 反動 2 回 + 弾幕 2 セット（計 4 リング） |
| 右ドラッグ左右 | 向きを回転 |
| 右ドラッグ上下 | 俯仰（±1.2 rad に制限）、右クリック単独は無反応 |
| ホイール | 拡大・縮小、範囲 0.35× – 1.4×、デフォルト 0.5× |

### 東方弾幕
- クリックすると**キャラの体の中心**から二重の同心円状に弾幕が発射されます: 内側 20 個の小弾 + 外側 16 個の大弾
- 各リングはシンボルと色を統一: ♥、四芒星、米粒、円弾、Ω — 白い輪郭付き
- 弾幕は自転しながら飛び、1.8 秒でフェードアウト、最大 640 発で自動回収
- **飛行中の弾幕はキャラの位置・ズームにリアルタイムで追従します** — ドラッグやホイール操作で弾幕も一緒に動きます

### 自律行動
- **瞬き**: 青緑の目が不規則に瞬き、素早く細い線に閉じてから開く、たまに連続瞬き
- **待機モーション**: ゆらゆら（デフォルト）・呼吸・直立 — メニューバーから切替
- **散歩モード**: 画面下を往復してお散歩、軽いジャンプ付き; ドラッグや回転で停止

### その他
- シングルインスタンス: 再起動しても既存キャラを前面に出すだけ — 2 体目は出現しない
- 通知・ダイアログ・右クリックメニュー・サウンド・キーボード操作なし

---

## 🚀 クイックスタート

### ビルド版を実行
`dist/古明地恋桌宠-darwin-arm64/` 内の App を起動するか、デスクトップの **古明地恋桌宠** ショートカットをダブルクリックしてください。

### ソースから実行
```bash
npm install
npm start
```

### 再ビルド
```bash
npm run build   # renderer.js → renderer.bundle.js
npx electron-packager . "古明地恋桌宠" \
  --platform=darwin --arch=arm64 \
  --icon=icon.icns --out=dist --overwrite \
  --prune=true --ignore="^/(dist|node_modules/(electron|electron-packager|esbuild))"
```

**要件**: macOS 12+、Apple Silicon; 開発には Node.js 22+

---

## 📁 プロジェクト構成

```
koishi-desktop-pet/
├── main.js        # Electron メインプロセス: ウィンドウ / トレイ / IPC / シングルインスタンス
├── preload.js     # レンダラー橋渡し (ドラッグ, 反動, トレイ, スクリーンショット)
├── renderer.js    # Three.js シーン、インタラクション、弾幕、瞬き、待機/散歩
├── index.html     # ページシェル + 弾幕エフェクトレイヤー
├── vendor/        # ローカライズ版 three.module.js + GLTFLoader
├── model/koishi.glb   # こいし 3D モデル
├── icon.icns      # App / トレイアイコン（キャラのアバター）
└── 预览.png       # レンダープレビュー
```

---

## 💗 謝辞

**ZUN（太田順也）** に感謝します — 東方プロジェクトと、第三の目を閉じながらも人の心をいちばん理解している古明地こいしを生み出してくれて。

弾幕の美意識は東方プロジェクトに着想を得ています — このこいしは彼女のホームステージ『東方地霊殿』の出身です。

**『東方紅魔郷：New Classic 〜 the Embodiment of Scarlet Devil.』を楽しみにしています！** 24 年ぶりに ZUN 自らがリマスターした紅魔郷、2026 年 9 月 10 日発売。弾幕が帰ってきます。

> ファンメイド・非公式プロジェクトです。3D モデルはユーザー提供（Blender 書き出し）。東方プロジェクトおよびキャラクターの版権は ZUN / 上海アリス幻樂団 に帰属します。
