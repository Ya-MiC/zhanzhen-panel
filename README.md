# 湛箴面板 · ZhanZhen Panel

> **跨端智能文件工作台 + YamiHub 自部署資產面板** — 一個倉庫，兩個層：
> 1. `apps/` — Vue 3 + Tauri 的跨端文件工作台（開發中骨架）
> 2. `deploy/` — **可直接部署的 YamiHub 面板發行版**（已完成，18 文件）

**▶ 線上演示**：[https://kv-9di.pages.dev](https://kv-9di.pages.dev)

---

## 🚀 部署你自己的實例（5 分鐘）

> 面板的核心哲學：**誰連接誰的帳號，面板就長成誰的樣子。**
> 你部署的是代碼，數據永遠是你自己的——令牌只存你自己的 KV，不經過任何第三方。

1. 把 `deploy/` 文件夾拖進 Cloudflare Pages（上傳資產）
2. 綁定一個 KV 命名空間（變量名 `KV`）
3. 申請 GitHub / Notion / Google 三家 OAuth 密鑰（逐字段教學見 [`deploy/README.md`](deploy/README.md)）
4. 填 6 個環境變量 → 重新部署一次
5. 打開面板 → 登錄 → 總覽/畫廊/資產地圖/評分全部換成你的真實數據

完整手冊：**[`deploy/README.md`](deploy/README.md)**（含出錯速查表）

## 📁 倉庫結構

| 目錄 | 內容 |
| --- | --- |
| `deploy/` | **YamiHub 面板發行版**：單頁面板 + OAuth Worker + 資產地圖引擎，拖放即部署 |
| `apps/web` | 湛箴文件工作台 Web 端骨架（Vue 3 + Vite + TipTap 方向） |
| `packages/` | AI 分析與文檔引擎的類型定義 |
| `docs/` | 產品文檔（PRD / 閱讀智能規格） |

## 🧭 面板能力（deploy/ 發行版）

- **資產整合**：GitHub / Notion / Google OAuth 登錄，倉庫自動評分（SPI 引擎 + 權重實驗室）
- **資產地圖**：archify 方法論活體泳道圖，規則引擎聚類 + Ollama 本地 AI 判讀，PNG/SVG/JSON 導出導入
- **資訊整合**（v0.2 規劃中，見 `deploy/YAMIFEED-DESIGN.md`）：熱榜聚合 + 微信公眾號每日推送
- **安全**：state 一次性 + PKCE + CSP + 限速 + sanitizeLabel，紅藍對抗三輪驗證

## 📄 協議

- `deploy/` 發行版：MIT
- 其餘目錄（工作台骨架）：暫定 MIT，正式發布前復核
- 致謝：ya-mic-os / archify / dashi-taskboard / OAuth 標準族，詳見 `deploy/THIRD-PARTY-NOTICES.md`
