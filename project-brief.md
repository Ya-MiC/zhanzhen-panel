# PROJECT-BRIEF — ya-mic-os 產品化迭代（交接簡報）

> **這份文件是給誰看的**：湛箴對話框裡的 AI（或任何接手的助手）。
> 主對話框已與用戶（湛箴 / Yamic / GitHub: **Ya-MiC**）完成項目決策，本文件是唯一交接真相源。
> 讀完這份文件 = 具備接手工作的全部上下文。請勿向用戶重複詢問文件裡已寫明的內容。

---

## 0. 工作守則（先讀這個再動手）

1. **磁盤紅線**：用戶本地磁盤緊張。**禁止 git clone 到本地**，一切 GitHub 讀寫走 API 遠程完成（本機 gh CLI 已登入 Ya-MiC，scopes 含 repo + workflow，讀私有倉庫和推 commit 都可以）。
2. **寫入須確認**：任何對用戶 GitHub 倉庫的寫入（commit / 建 repo / 改 Actions），先把改動內容貼給用戶看，點頭再動。
3. **用戶將新註冊一個 Cloudflare 帳號**，安全配置由助手手把手教學（見 §5 清單）。
4. 回覆語言跟隨用戶（繁體中文為主，摻簡體口語）。

---

## 1. 用戶已拍板的 6 條決策（2026-09-14）

| # | 議題 | 定案 |
| --- | --- | --- |
| 1 | 面板歸屬 | **沒有另起的新面板**。產品 = ya-mic-os 的迭代。但作為對外產品需要品牌名，候選見 §4 |
| 2 | MVP 接入平台 | **GitHub + Notion + Google 三家全做**，都是 OAuth 鑒權。自部署模式下每個用戶創建自己的 OAuth App（Google 用 Testing 模式 100 測試用戶額度即可，免驗證） |
| 3 | 門禁/安全 | **必須有門禁**（防爬蟲）。用戶將註冊新 Cloudflare 帳號，助手負責教安全配置 |
| 4 | MVP 部署形態 | 用戶 **fork 倉庫到自己帳號 → 部署到自己的 Cloudflare Pages**，用**自己的 KV、自己的域名**（自帶 TLS）。會用 npx 的用戶走 wrangler CLI 路徑 |
| 5 | 評分算法 | **要做，而且要做得比現在更好**（AVS/GRS/SPI 模型升級） |
| 6 | 版本路線 | v1 = 純 CF Pages 自部署（fork 即用）；**v2 = 用戶買服務器的自托管版** |

---

## 2. GitHub 家底情報（已用 API 隔空盤點，零 clone）

- 帳號：**Ya-MiC**（Yamic / cao417090217@gmail.com），73 個倉庫（公開 56 級別 + 私有若干）。
- 注意：GitHub 公開搜尋搜 "yamicos" 是搜不到人的，帳號名帶連字符。

### 核心倉庫 `ya-mic-os`（私有，248 文件）
「Ya-MiC 總控作業系統：59+ 倉庫資產治理面板」
- 入口：根目錄 `index.html`（111KB 單頁應用）+ gallery/guide/start/tutorial.html
- 數據層 `public/data/`：portfolio.json（100KB）、repositories.yaml、scores.yaml、risks.yaml、tasks.json、starred.json、**private.enc**（AES-256-GCM + PBKDF2-SHA256 25萬次迭代，瀏覽器本地解密，口令不上傳）
- 自動化 `.github/workflows/`：auto-sync、detect-new-repos、gov-sync、deploy-pages、deploy-netlify
- 評分引擎：`tools/scoring.mjs` + `assets/scoring.js`（AVS = 0.14C+0.14P+0.14L+0.12S+0.10R+0.10M+0.10D+0.08Q+0.08E；GRS = 0.40T+0.35U+0.25(10−E)；SPI = 10·AVS − 5·GRS；FinalSPI = max(0, SPI − ForkPenalty)）
- 治理體系：G1–G5 閘門、human-review 隊列、docs/repository-catalog.md（59 張資產卡）

### 相關倉庫
- `zhanzhen-panel`（公開，Vue3+Vite）：跨端智能文件工作台，**OAuth 只有描述沒有實現**，大部分 docs 是空文件。⚠ 名字已被佔用，給新產品起名要避開
- `zhanzhen-web`（公開）：CF Pages 靜態前端，說明用戶已有 Cloudflare 使用基礎
- `zhanzhen` / `audit-os` / `zhanzhen-server`：審計風險平台家族，與本項目無直接耦合

---

## 3. ⚠ 產品化的一個關鍵糾偏（必讀）

`ya-mic-os` 是**私有倉庫且含有用戶的真實治理數據**（portfolio.json、private.enc、決策日誌）。

**不能直接把這個倉庫轉公開當產品**。正確路徑：

1. 從 ya-mic-os **抽出代碼骨架**（面板 UI、評分引擎、部署腳本、workflow 模板）→ 洗掉全部個人數據
2. 建立獨立的**開源產品倉庫**（新名字，demo 數據用脫敏樣本）
3. `ya-mic-os` 原倉庫凍結為用戶的**私有實例**，未來升級為產品模板的一個部署實例

代碼血統是 ya-mic-os 的迭代（符合用戶「沒有新面板」的定義），數據邊界乾淨。

---

## 4. 品牌命名（待用戶最終確認）

| 候選 | 理由 |
| --- | --- |
| **YamiHub（主推）** | 延續 Ya-MiC 血統 + Hub = 集群樞紐，貼合「集群服務面板」定位；repo 名 `yami-hub` |
| ZhenDeck | 湛箴品牌 + Deck，但與 zhanzhen-panel 品牌易混 |
| OwnDeck | 突出「自己的數據自己部署」，但丟了個人品牌 |

---

## 5. 安全/門禁教學清單（等用戶註冊新 CF 帳號後逐條手把手）

1. Cloudflare 帳號開 2FA
2. Pages 項目 + 自定義域名（TLS 自動簽發）
3. **Cloudflare Access（Zero Trust 免費版 50 席）**套在面板域名：Email OTP 或 GitHub 登錄做門禁
4. Bot Fight Mode + WAF 託管規則開啟
5. /api/* 路徑加 Rate Limiting
6. 所有 client_secret 走 Pages **加密環境變量**，不進代碼不進 git
7. OAuth 全程 state + PKCE，redirect URI 嚴格白名單
8. KV 最小權限 binding
9. 定期輪換 secrets

---

## 6. MVP 架構定案

```
用戶 fork 產品倉庫（如 yami-hub）
        │
        ├─ A 路徑：CF Pages 控制台連 Git → 配環境變量 → 綁 KV → 部署
        └─ B 路徑：npx wrangler（CLI 一鍵建 KV + 部署 + 綁域名）
                │
   ┌────────────┴────────────┐
   │  靜態面板（ya-mic-os UI 迭代）      │
   │  + CF Pages Functions（唯一服務端） │
   │    /api/oauth/:provider/start      │
   │    /api/oauth/:provider/callback   │
   └───────────────────────────┘
        │ OAuth (state+PKCE, 用戶自己的 client id/secret)
        ▼
  GitHub API · Notion API · Google API → 用戶自己的數據
        │
        ▼
  瀏覽器本地加密緩存（WebCrypto AES-GCM + PBKDF2，沿用 private.enc 思路）
  服務端零知識：token/數據不落明文
```

### 分期路線
- **Phase 0**：從 ya-mic-os 抽代碼、洗數據、建產品倉庫、README + demo 數據
- **Phase 1（MVP）**：GitHub + Notion + Google OAuth（用戶自建 App）、門禁、本地加密緩存、雙部署路徑、自部署文檔
- **Phase 2**：KV 零知識同步（客戶端加密後才上雲）、評分引擎 v2（多平台信號、權重可配、公式版本化）、Deploy to CF 一鍵按鈕、i18n
- **Phase 3**：VPS/Docker 自托管版（用戶買服務器那個版本）

---

## 7. 環境事實速查

- 本機 gh CLI 已登入 Ya-MiC（keyring），scopes: gist / read:org / repo / workflow
- git 全局：user.name=Yamic, user.email=cao417090217@gmail.com
- 主對話框 workspace：`C:\Users\cao41\.openclaw-autoclaw\workspace`（本文件所在處，兩側 AI 共享可讀寫）
- 兩個對話框之間**不能直接互發消息**（會話可見性受限），溝通全靠這個共享磁盤
