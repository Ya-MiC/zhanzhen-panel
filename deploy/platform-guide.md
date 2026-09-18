# PLATFORM-GUIDE.md — 身份服務選型 × 倉庫路徑 × GitHub 展示 × 他人部署

> 回答四個問題：1) Clerk/Auth0/Firebase/Supabase 是什麼、你要不要用；2) 東西分別在什麼路徑；3) GitHub 倉庫傳哪個文件夾、展示頁怎麼寫；4) 別人怎麼把你的程序部署到人家自己的 CF。

---

## 1. Clerk / Auth0 / Firebase / Supabase 是什麼？

它們都是**「登錄即服務」**（Authentication-as-a-Service）——把「註冊/登錄/會話管理」做成現成組件，你接進去就不用自己寫用戶系統。

| 服務 | 是什麼 | 免費額度 | 對你的價值 | 對你的風險/成本 |
| --- | --- | --- | --- | --- |
| **Clerk** | 最漂亮的嵌入式登錄組件（幾行代碼出登錄框） | 10,000 月活用戶 | 郵箱+Google 一鍵登錄，UI 開箱極美 | 數據在它手裡；要綁它的域名組件 |
| **Supabase** | 開源 Firebase 替代：Postgres + 認證 + 存儲 | 50,000 月活用戶 | **可自托管**（符合你的數據主權哲學）+ 郵箱/Google OAuth 現成 | 要學一點 SQL/RLS |
| **Firebase Auth** | 谷歌全家桶的登錄件 | 很大（匿名/郵箱免費） | 和 Google 生態無縫 | 被鎖谷歌生態；中國大陸訪問不穩 |
| **Auth0** | 企業級老牌，功能最全 | 25,000 月活 | 合規/企業場景最強 | 貴；對你過重 |

### 你的情況：**現階段不需要它們**

你的 MVP 登錄已經是「**OAuth 直連平台**」：GitHub / Notion / Google 三家授權後，面板直接拉各平台真實數據。**你沒有「自己的用戶帳號體系」**——每個訪客部署自己的實例、授權自己的帳號，根本不存在「註冊」這個動作。這是自部署架構的最大優雅之處：**零用戶數據庫、零密碼存儲、零合規負擔**。

什麼時候才需要上面那些服務？當你走到 **v2（你自己開服務器、做集中托管版「YamiHub Cloud」）**：那時用戶要註冊一個屬於你平台的帳號（郵箱登錄），才能把多個 OAuth 連接綁在同一個帳號下。屆時對比：

- 要快 + 好看 → **Clerk**（郵箱+Google 一鍵）
- 要數據主權 + 開源 + 將來自托管 → **Supabase**（你的哲學選這個）
- 郵箱登錄 + 谷歌登錄 = 兩家都原生支持，不用自己寫密碼存儲（這是它們最核心的價值：**密碼哈希、忘記密碼、郵箱驗證這些髒活全外包**）

「一鍵登錄授權」的直覺是對的：這些服務本質就是把 OAuth 流程包裝成一鍵組件。你現在的 `_worker.js` 已經自己實現了 OAuth 流程（state+PKCE），等於你已經在做「它們做的事」的輕量版——只是沒有用戶帳號層而已。

**結論**：v1 自部署階段 → 什麼都不加（當前架構即最優）；v2 集中托管階段 → Supabase（主權優先）或 Clerk（體驗優先）二選一，到時候我再幫你接。

---

## 2. 東西分別在什麼路徑（總導航）

```
C:\Users\cao41\.openclaw-autoclaw\workspace\projects\yami-hub\
│
├── deploy\                  ★★★ 核心中的核心 —— 14 個文件，兩個用途都用它：
│   │                            ① 拖進 Cloudflare Pages 部署
│   │                            ② 上傳 GitHub 倉庫的根目錄內容
│   ├── index.html            面板本體（登錄首屏 + 9 個功能頁）
│   ├── _worker.js            唯一後端（OAuth + 同步 + 安全防線）
│   ├── _headers              安全響應頭（CSP 等）
│   ├── assets\
│   │   ├── os2.css           樣式系統（亮/暗主題）
│   │   ├── scoring.js        SPI 評分引擎
│   │   └── archify-live.js   活體資產地圖引擎
│   ├── public\data\          demo 數據（虛構 demo-user）
│   ├── README.md             ★ 用戶手冊（安裝嚮導，你認可的那份）
│   ├── DEVELOPER.md          ★ 開發者文檔（架構/契約/修改指南）
│   ├── THIRD-PARTY-NOTICES.md 開源致謝
│   └── LICENSE               MIT
│
├── .gitignore               上傳 GitHub 時自動排除下面帶下劃線的目錄
├── TEST-BRIEF.md            給測試 AI 的紅藍對抗任務書
├── project-brief.md         項目決策檔案
│
├── _tools\                  施工腳本（不進公開倉庫）
│   ├── worker-harness.mjs   Worker 13 路由冒煙測試
│   ├── smoke-archlive.mjs   地圖引擎冒煙測試
│   └── fix-*.mjs            歷次改造腳本（改造史記錄）
│
└── _private\                你的真實數據（絕不進公開倉庫，.gitignore 已防呆）
    └── _reference\          前置版本 原始參考（73 個真實倉庫數據等）
```

**一句話版**：
- **部署到 CF** → 拖 `deploy` 文件夾
- **上傳 GitHub** → 傳 `deploy` 文件夾的內容作為倉庫根目錄（README/DEVELOPER 都在裡面，展示頁自然成型）
- **想看評分引擎** → `deploy/assets/scoring.js`
- **想改登錄首屏文案** → `deploy/index.html` 搜 `LOGIN_META`
- **你的私有數據** → `_private/`（永不上傳）

---

## 3. GitHub 倉庫展示（README 已是手冊，這裡給「門面三件套」）

### 3.1 倉庫簡介（About 欄，一行）

```
誰連接誰的帳號，面板就長成誰的樣子 — GitHub/Notion/Google OAuth 自部署資產面板 · 零後端依賴 · 拖放部署 Cloudflare Pages · AES-GCM 本地加密
```

### 3.2 Topics 標籤

```
cloudflare-pages  oauth2  dashboard  portfolio  github-api  notion-api
zero-knowledge  self-hosted  vincent-panel  asset-management  worker
```

### 3.3 展示頁頂部建議加的徽章（放 README 最頂部，可選）

```markdown
# 🐙 YamiHub

> **誰連接誰的帳號，面板就長成誰的樣子。**
> 打開 = 登錄 → 授權你自己的 GitHub / Notion / Google → 總覽、畫廊、資產地圖、SPI 評分全部換成你的真實數據。

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Ya-MiC/yami-hub)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![No Backend Deps](https://img.shields.io/badge/runtime-zero%20dependencies-brightgreen)]()

📖 安裝（用戶）看 [README.md](README.md) · 🛠 開發（貢獻/二次開發）看 [DEVELOPER.md](DEVELOPER.md) · 🔐 安全模型見 DEVELOPER.md §7
```

### 3.4 README 補一節「5 分鐘極速開始」（插在現在的 README 最前面，可選）

```markdown
## ⚡ 極速開始（懶人版）

1. Fork 本倉庫 → 點上方 Deploy to Cloudflare 按鈕（或手動：CF Pages → 上傳資產 → 拖 deploy 文件夾）
2. 綁一個 KV（變量名 `KV`）
3. 三家 OAuth 各申請一對密鑰（README 第 3 步有逐字段截圖級教學）
4. 填 6 個環境變量 → 重新部署
5. 打開面板 → 登錄 → 你的資產宇宙出現了
```

---

## 4. 別人怎麼部署到人家自己的 CF（兩條路）

### 路 A：Deploy to Cloudflare 一鍵按鈕（最順滑，推薦）

上面 3.3 的按鈕就是。訪客點擊 → 授權 CF 連接 GitHub → 自動 fork + 創建 Pages 項目 + 進入設置嚮導 → 填 6 個環境變量 + 建一個 KV 綁定 → 部署。**前提**：倉庫根目錄結構乾淨（我們的 deploy 內容就是倉庫根，天然滿足）。

⚠ 按鈕鏈接裡的 `url=` 參數要換成你的真實倉庫地址：`https://deploy.workers.cloudflare.com/?url=https://github.com/Ya-MiC/yami-hub`

### 路 B：手動拖放（README 現有五步教學，兜底）

不用 GitHub、不用 fork：直接下載你的倉庫 zip → 解壓 → 把 `deploy` 文件夾拖進 CF Pages「上傳資產」。README 第 1-5 步 + 三家 OAuth 逐字段教學 + 出錯速查表已完備。

### 保密與密鑰邊界（再強調一次）

- 別人部署的是**代碼**，不是你的數據：你的真實倉庫數據在瀏覽器本地加密存儲 + 你的 KV 裡，跟別人的實例完全隔離。
- 你的 6 個密鑰是**你自己 OAuth App 的**，永遠不進倉庫；別人用人家自己的密鑰。`_worker.js` 裡沒有任何硬編碼密鑰（紅藍對抗已驗證）。
- `.gitignore` 已排除 `_private/`、`_tools/`、`TEST-REPORT.md`——就算你偷懶傳整個 yami-hub 目錄也不會洩。

---

## 5. 你接下來的動作清單

1. **CF 更新**：把 `deploy`（14 文件）再拖一次 → 線上應出現登錄首屏（三標籤頁）+ 🌓 主題切換
2. **GitHub 建倉**：新建公開倉庫（建議名 `yami-hub`）→ 上傳 `deploy` 內容為根目錄（GitHub 網頁端「uploading an existing folder」直接拖也行）→ 按第 3 節寫 About/Topics/徽章
3. **徽章按鈕**：倉庫建好後把 3.3 的 Deploy 按鈕鏈接裡的倉庫地址換成真實的
4. 驗證登錄首屏：打開你的 pages.dev → 應看到🐙歡迎語 + 三標籤 → 點 GitHub 標籤看 perks 列表 → 點連接走授權
