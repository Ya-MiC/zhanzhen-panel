# 湛箴面板 · ZhanZhen Panel

> **誰連接誰的帳號，面板就長成誰的樣子。**
> 一個倉庫，兩個產品：**YamiHub 自部署資產面板**（`deploy/`，可直接部署）+ **湛箴跨端文件工作台**（`apps/`，Vue 3 + Tauri，開發中）。

[![License: GPL-3.0](https://img.shields.io/badge/License-GPL--3.0-blue.svg)](LICENSE)
[![CI](https://github.com/Ya-MiC/zhanzhen-panel/actions/workflows/ci.yml/badge.svg)](https://github.com/Ya-MiC/zhanzhen-panel/actions/workflows/ci.yml)
[![線上演示](https://img.shields.io/badge/演示-kv--9di.pages.dev-58cc02)](https://kv-9di.pages.dev)

**▶ [線上演示](https://kv-9di.pages.dev)** · 📖 [用戶部署手冊](deploy/README.md) · 🛠 [開發者文檔](deploy/DEVELOPER.md) · 🎨 [設計語言](deploy/DESIGN-LANGUAGE.md)

---

## 功能特性

**YamiHub 面板（deploy/ 發行版，v0.3）**

- 🔐 **三平台 OAuth 登錄** — GitHub / Notion / Google，state 一次性 + PKCE，令牌只存部署者自己的 KV
- 📊 **資產整合** — 倉庫自動評分（SPI 引擎 + 權重實驗室實時重算）、資產畫廊、生命週期分區
- 🗺 **資產地圖** — archify 方法論活體泳道圖：規則引擎聚類 + Ollama 本地 AI 判讀，PNG/SVG/JSON 導出導入
- 📡 **資訊 · 熱榜**（YamiFeed）— GitHub Trending / 微博 / 知乎 / Hacker News 四源聚合，KV 30 分鐘緩存
- 📨 **微信每日精選** — WxPusher 推送（手動試發 + Cron 每日自動），只發標題鏈接，版權合規
- 🔒 **安全** — XSS 注入面清零、CSP、限速、sanitizeLabel、本地 AES-GCM 保險箱；紅藍對抗三輪驗證

**湛箴工作台（apps/web，v0.1）**

- 📂 本地優先文件工作台（MD/TXT 匯入、編輯、保存）· 讀書分析 / 流程圖 / 思路画像 / 寫作工坊（原型）· AI 助手面板

## 部署指南

### 基礎部署（拖放，5 分鐘）

1. `git clone https://github.com/Ya-MiC/zhanzhen-panel.git`（或直接下載 ZIP）
2. 打開 [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers 和 Pages** → **創建** → 選 **Pages** → **上傳資產**
   ⚠ 必須選 Pages（不是 Workers）！
3. 把 `deploy/` 文件夾整個拖進上傳框 → 部署站點
4. 綁定 KV：存儲和數據庫 → KV → 創建命名空間 → 項目設置 → 綁定 → **變量名必須填 `KV`**
5. 按 [deploy/README.md](deploy/README.md) 第 3 步申請三家 OAuth 密鑰，填 6 個環境變量
6. **重新部署一次**（環境變量只對之後的部署生效）→ 打開面板登錄 ✅

### GitHub OAuth 配置

1. [創建 OAuth App](https://github.com/settings/applications/new)
2. 回調 URL：`https://你的域名/api/oauth/github/callback`
3. 獲取 Client ID 和 Client Secret

Notion / Google 的逐字段教學（含 Google Testing 模式、Notion 公開分發等坑）見 [deploy/README.md 第 3 步](deploy/README.md)。

### 環境變量配置

在 Pages 專案 → 設置 → 變量和機密（類型選**秘密**）：

```env
# GitHub OAuth
GITHUB_CLIENT_ID=你的ClientID
GITHUB_CLIENT_SECRET=你的ClientSecret
# Notion OAuth（公共集成才有 Client Secret）
NOTION_CLIENT_ID=
NOTION_CLIENT_SECRET=
# Google OAuth（Web 應用類型，Testing 模式免審核）
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
# ── 以下可選 ──
# KV 綁定名（綁定頁填，不是環境變量）
# 微信每日精選推送（wxpusher.zjiecode.com 創建應用+掃碼拿 UID）
WXPUSHER_TOKEN=
WXPUSHER_UID=
# 自建 RSSHub 實例（默認公共 rsshub.app，偶爾限流）
RSSHUB_BASE=
# 提高 GitHub API 限額到 5000/h
GITHUB_TOKEN=
```

### 定時微信推送

配置 WxPusher 兩個變量後，在 Pages 專案 → 設置 → 函數 → **Cron 觸發器**添加 `0 8 * * *`，每天早 8 點自動把熱榜精選推到你微信。也可在面板「平台連接」頁點 **📨 試發每日精選** 手動測試。

### 本地開發

> [!Note]
> 面板本體（deploy/）零構建零依賴；工作台（apps/）需要 Node ≥ 20.18 + pnpm ≥ 9

```bash
# 面板本地模擬（含 KV + OAuth 路由）
npx wrangler pages dev deploy --port 8788 --binding KV=kvtest

# 工作台開發
pnpm install
pnpm dev
```

## 倉庫結構

```
zhanzhen-panel/
├── deploy/          # ★ YamiHub 發行版：面板 + OAuth Worker + 地圖引擎 + YamiFeed（拖放即部署）
├── apps/web/        # 湛箴工作台（Vue 3 + Vite + TS；Phase 2 拆分中）
├── packages/        # 共享類型定義
├── docs/            # 架構/功能映射/數據模型/決策記錄
└── AGENTS.md        # AI 助手行動規範（接手的 AI 必讀）
```

## 路線圖

- **v0.3**：工作台 App.vue 漸進拆分（Phase 2 進行中）+ 第二淺色主題 + Notion/Google 數據視圖
- **v0.4**：KV 零知識同步（客戶端加密後上雲）+ Tauri 桌面 EXE（[指南](deploy/TAURI-GUIDE.md)）+ GitHub Releases 多平台分發
- **v1.0**：公眾號認證後切官方模板消息 + RSS 輸出 + 熱榜自定義源

## 貢獻指南

歡迎提交 issue 報告 bug 或提議功能。PR 前：讀 [AGENTS.md](AGENTS.md)（AI）與 [DESIGN-LANGUAGE.md](deploy/DESIGN-LANGUAGE.md)（UI），跑通 `pnpm typecheck && pnpm lint && pnpm test && pnpm build`。

## License

[GPL-3.0](./LICENSE) © Ya-MiC · 目錄級協議映射與數據源合規邊界見 [LICENSE-NOTES.md](LICENSE-NOTES.md)

**致謝**：[newsnow](https://github.com/ourongxing/newsnow)（MIT，熱榜聚合架構）· [RSSHub](https://github.com/DIYgod/RSSHub)（AGPL，僅網絡調用）· [archify](https://github.com/tt-a1i/archify)（MIT，地圖設計系統）· [dashi-taskboard](https://github.com/chuspeeism/dashi-taskboard)（Apache-2.0）· ya-mic-os · 完整名單見 [THIRD-PARTY-NOTICES.md](deploy/third-party-notices.md)
