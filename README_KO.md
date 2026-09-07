<div align="center">

# 🖥️ koishi-desktop-pet

### 코이시 코메이지 · macOS 데스크톱 펫

바탕화면에 사는 동방 캐릭터 — 투명하고 항상 맨 앞에 있는 3D 인형. 마우스로 함께 놀고, 눈을 깜빡이고, 산책하고, 탄막을 쏩니다.

<p align="center">
  <a href="README.md"><span style="background-color:#57606a;color:#ffffff;padding:6px 16px;border-radius:20px;font-weight:600;">🇨🇳 中文</span></a>
  <a href="README_EN.md"><span style="background-color:#57606a;color:#ffffff;padding:6px 16px;border-radius:20px;font-weight:600;">🇬🇧 English</span></a>
  <span style="background-color:#2da44e;color:#ffffff;padding:6px 16px;border-radius:20px;font-weight:600;">🇰🇷 한국어</span>
  <a href="README_JA.md"><span style="background-color:#57606a;color:#ffffff;padding:6px 16px;border-radius:20px;font-weight:600;">🇯🇵 日本語</span></a>
</p>

<p align="center"><img src="预览.png" width="55%" alt="preview"></p>

</div>

---

## ✨ 주요 기능

### 데스크톱 표시
- 투명·테두리 없음·항상 맨 앞에 있는 작은 창. Dock/작업 표시줄을 차지하지 않고 기본적으로 화면 오른쪽 아래에 표시
- 메뉴 바에 캐릭터 아바타 상주, 원클릭으로 동작 전환·종료

### 마우스 조작 (전부 마우스로)
| 조작 | 효과 |
|---|---|
| 왼쪽 드래그 | 캐릭터 이동 (캐릭터를 정확히 클릭해야 작동, 투명 영역은 클릭 통과) |
| 왼쪽 클릭 | 스쿼시 반동 + 탄막 1링 발사 |
| 왼쪽 더블클릭 | 반동 2회 + 탄막 2세트 (총 4링) |
| 오른쪽 좌우 드래그 | 방향 회전 |
| 오른쪽 상하 드래그 | 상하 각도 (±1.2 rad 제한), 오른쪽 클릭 단독은 무반응 |
| 휠 | 확대·축소, 범위 0.35× – 1.4×, 기본 0.5× |

### 동방 탄막
- 클릭하면 **캐릭터 몸의 중심**에서 두 개의 동심원 탄막이 발사됩니다: 안쪽 20개의 소탄 + 바깥 16개의 대탄
- 각 링은 심볼과 색상을 통일: ♥, 네모별, 쌀알, 원탄, Ω — 흰색 외곽선
- 탄막은 자전하며 날아가고 1.8초 후 페이드아웃, 최대 640개 자동 회수
- **비행 중인 탄막이 캐릭터 위치와 줌을 실시간으로 따라갑니다** — 인형을 드래그하거나 휠을 굴리면 탄막도 함께 움직입니다

### 자율 행동
- **눈 깜빡임**: 청록색 눈이 불규칙하게 깜빡이며 빠르게 가느다란 선으로 합쳐졌다가 펼쳐짐, 가끔 연속 깜빡임
- **대기 동작**: 가벼운 흔들림(기본) / 호흡 / 서 있기 — 메뉴 바에서 전환
- **산책 모드**: 화면 하단을 따라 왕복하며 가벼운 점프; 드래그하거나 회전하면 정지

### 기타
- 단일 인스턴스: 다시 실행해도 기존 캐릭터만 앞으로 가져옴 — 두 번째가 생기지 않음
- 알림·팝업·우클릭 메뉴·소리·키보드 조작 없음

---

## 🚀 빠른 시작

### 빌드 버전 직접 실행
`dist/古明地恋桌宠-darwin-arm64/` 안의 App을 실행하거나, 바탕화면의 **古明地恋桌宠** 바로가기를 더블클릭하세요.

### 소스에서 실행
```bash
npm install
npm start
```

### 다시 빌드
```bash
npm run build   # renderer.js → renderer.bundle.js
npx electron-packager . "古明地恋桌宠" \
  --platform=darwin --arch=arm64 \
  --icon=icon.icns --out=dist --overwrite \
  --prune=true --ignore="^/(dist|node_modules/(electron|electron-packager|esbuild))"
```

**요구 사항**: macOS 12+, Apple Silicon; 개발에는 Node.js 22+

---

## 📁 프로젝트 구조

```
koishi-desktop-pet/
├── main.js        # Electron 메인 프로세스: 창 / 트레이 / IPC / 단일 인스턴스
├── preload.js     # 렌더러 브리지 (드래그, 반동, 트레이, 스크린샷)
├── renderer.js    # Three.js 씬, 인터랙션, 탄막, 눈 깜빡임, 대기/산책
├── index.html     # 페이지 셸 + 탄막 이펙트 레이어
├── vendor/        # 로컬화된 three.module.js + GLTFLoader
├── model/koishi.glb   # 코이시 3D 모델
├── icon.icns      # App / 트레이 아이콘 (캐릭터 아바타)
└── 预览.png       # 렌더 프리뷰
```

---

## 💗 크레딧

**ZUN (오타 준야)** 님께 감사드립니다 — 동방 프로젝트와, 제3의 눈을 감고 있지만 사람 마음을 가장 잘 이해하는 코이시를 만들어 주셔서.

탄막 미학은 동방 프로젝트에서 영감을 받았습니다 — 이 프로젝트의 코이시는 그녀의 고향 무대인 《동방지령전》에서 왔습니다.

**《동방홍마향: 뉴 클래식 ~ the Embodiment of Scarlet Devil.》을 기대합니다!** 24년 만에 ZUN이 직접 리마스터한 홍마향, 2026년 9월 10일 발매. 탄막이 돌아옵니다.

> 팬 메이드·비공식 프로젝트입니다. 3D 모델은 사용자 제공(Blender 내보내기). 동방 프로젝트 및 캐릭터 저작권은 ZUN / 상하이 앨리스 환악단에 있습니다.
