# DEVELOPER.md — YamiHub 開發者文檔

> 給想讀懂、修改、二次開發這個面板的人（包括未來的 AI 助手）。
> 用戶安裝嚮導在 [README.md](README.md)，這裡不重複安裝步驟，只講**這個東西是怎麼構成的、為什麼這樣設計、改哪裡會發生什麼**。

---

## 0. 設計語言（動 UI 前必讀）

**任何按鈕/顏色/圓角/字號的改動，先讀 [DESIGN-LANGUAGE.md](DESIGN-LANGUAGE.md)**——檔位已釘死，只有「照辦」沒有「重新發明」。UI 整改依據見 _tools/UI-AUDIT.md（2026-09-16 全量審計）。

## 1. 項目血統與定位

| 層 | 來源 | 狀態 |
| --- | --- | --- |
| UI 設計系統 / 面板骨架 | 前置版本（Ya-MiC 私有倉庫，MIT）的產品化迭代 | 移植 + 產品化改造 |
| 資產地圖引擎 | `assets/archify-live.js` 為原創實現，視覺方法論遵循 archify（tt-a1i，MIT） | 本項目自有 |
| OAuth 後端 | `deploy/_worker.js` 原創，按 OAuth 2.0 標準族（RFC 6749/7636/6750）實現 | 本項目自有 |
| 看板形態參考 | dashi-taskboard（chuspeeism，Apache-2.0）的狀態流思想 | 思想參考，零代碼 |
| 面板邏輯參考 | edgetunnel（cmliu）的「獨立登錄頁 → 門禁 → 管理台」路由設計與提示文案完善度 | 思想參考，零代碼 |

完整致謝見 [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md)。

## 2. 架構總覽

```
瀏覽器
  │
  ├─ index.html（單頁面板，9 個 page section + 登錄首屏）
  │    ├─ assets/os2.css        — 全部樣式（亮/暗雙主題，CSS 變量驅動）
  │    ├─ assets/scoring.js     — SPI 評分引擎（瀏覽器端，權重實驗室）
  │    └─ assets/archify-live.js— 活體地圖引擎（規則聚類 + Ollama 可選判讀）
  │
  ▼ fetch /api/*
_worker.js（Pages Advanced Mode，唯一服務端）
  ├─ /api/config | /api/connections   — 連接狀態查詢
  ├─ /api/oauth/:p/start|callback     — GitHub / Notion / Google OAuth（state 一次性 + sid 綁定 + Google PKCE）
  ├─ /api/disconnect/:p               — 斷開（刪 KV 裡的令牌）
  ├─ /api/github/sync                 — 拉取倉庫（≤300，含私有）+ 服務端 SPI 快評
  └─ 全局：cleanEnv（變量淨化）+ 60/min 限速 + sanitizeLabel（防 stored XSS）
  │
  ▼
KV（部署者自己的命名空間）
  ├─ sess:<sid>  — 會話 + 各平台令牌（7 天滑動過期）
  └─ state:<hex> — OAuth state（一次性，10 分鐘）
```

**設計鐵律**：令牌只進部署者的 KV，永不返回瀏覽器；前端拿到的只有「已連接 + 顯示名」。

## 3. 關鍵數據契約

### 3.1 portfolio.json（面板的血液）

```jsonc
{
  "repositories": [{
    "name": "...", "full_name": "...", "visibility": "public|private",
    "fork": false, "private": false, "language": "...",
    "stargazers_count": 0, "pushed_at": "ISO-8601",
    "primary_domain": "...", "business_role": "product|leverage|study|infra",
    "lifecycle": "活躍|維護", "one_liner": "...",
    "scores": { "C":7,"P":8,/*...9 維*/ "T":5,"U":6,
                "AVS":6.9,"GRS":3.1,"SPI":5.35,"ForkPenalty":0,"FinalSPI":5.35 },
    "decision": "KEEP", "board": "A"   // board 由前端 boardOf() 推導
  }],
  "stats": { "total":0, "public":0, "private":0, "forks":0 },
  "top5_final_spi": [], "auto_synced_at": "ISO-8601"
}
```

- **未連接時這個文件不會自動載入**：boot 先問 `/api/connections`，未連接 → 空 PF + 進登錄首屏；點「先看 demo」才 `fetch('public/data/portfolio.json')`。
- `public/data/private.enc` = demo 加密包（口令 `demo`），AES-256-GCM + PBKDF2-SHA256(250k)，格式：`salt[16] + iv[12] + ciphertext`，Base64 外殼。真實場景已由 OAuth 登錄取代口令體系，此文件僅為 demo 演示保留。

### 3.2 評分公式（scoring.js v4.0，前後端同構）

```
AVS = Σ(9 維加權)          權重 Profile 按分區自動選，權重實驗室可覆蓋（localStorage 持久化）
GRS = 0.40·T + 0.35·U + 0.25·(10−E)     T 隨 push 新鮮度動態漂移（dynT）
SPI = 10·AVS − 5·GRS
FinalSPI = max(0, SPI − ForkPenalty)    fork 罰 5
```

服務端快評（_worker.js 的 `quickScores`）用同一公式但固定預置維度——**正式評分以前端 scoring.js 為準**。

## 4. 目錄逐文件說明（deploy/ = 可拖放部署的全部）

| 文件 | 職責 | 改它會怎樣 |
| --- | --- | --- |
| `index.html` | 面板本體（約 2600 行）。頁面切換用 `go(page)`，各 `renderXxx()` 負責渲染 | 加新頁：複製一個 `<section class="page" id="page-X">` + 側欄 `data-page="X"` + go 鉤子 |
| `_worker.js` | 唯一後端。加新 API：在 fetch 入口的路由鏈加一個 `pathname === "/api/xxx"` 分支 | 改壞 = 全站 1101，務必 node --check + harness 實測 |
| `_headers` | Pages 響應頭。CSP 的 connect-src 白名單含 `127.0.0.1:11434`（Ollama） | 格式：路徑行 + 縮進頭部行，註釋只能單獨成行 |
| `assets/os2.css` | 全部樣式。`:root` 亮色變量、`html[data-theme="dark"]` / dark 媒體查詢暗色 | 換品牌色只動 `:root` 前十行 |
| `assets/scoring.js` | 評分引擎（含權重實驗室 API：`Scoring.setCustom/setProfile/reset`） | 公式升級同時改 `_worker.js` 的 quickScores 保持同構 |
| `assets/archify-live.js` | 活體地圖：`classifyRepo`（聚類）、`buildMap`（造圖 JSON）、`renderSVG`（渲染）、`Ollama`（本地 AI） | 主路徑節點上限 12（archify 不變量），別放開 |
| `public/data/*.json` | demo 數據（虛構 demo-user 的 10 個倉庫） | 形狀必須與 3.1 契約一致，否則面板渲染空白 |

## 5. 登錄首屏的設計（為什麼這樣）

參考 edgetunnel 的「先門禁後面板」但換了交互哲學：它用獨立 `/login` 路由 + 密碼 cookie；我們用**單頁內的 `#page-login` 首屏**（因為門禁是 OAuth 而非密碼，沒必要拆路由）。每個平台一個標籤頁，標籤裡講三件事：**連接後你能得到什麼（perks）→ 授權範圍（scopes）→ 當前狀態（未配置給自查三步提示）**——前言後語齊全，用戶在點「連接」之前就知道會發生什麼。

## 6. 本地開發循環

```powershell
# 完整模擬（含 KV + OAuth 路由）
cd deploy
npx wrangler pages dev . --port 8788 --binding KV=kvtest

# Worker 單元冒煙（不開瀏覽器，直接打 13 條路由）
node ..\_tools\worker-harness.mjs
```

harness 會實測：靜態 200 / 三平台 start 302 / 無登錄 sync 401 / 假 state 重定向 / 限速 429。**任何對 _worker.js 的改動都必須過 harness**（這是 1101 事故後立的規矩：v0.1 的 handleStart 漏傳 request 參數導致生產 1101，harness 就是為了不再犯）。

## 7. 安全模型（紅藍對抗結論）

| 防線 | 實現 | 位置 |
| --- | --- | --- |
| XSS 注入 | 全局 `esc()` 轉義 13 個插值點；服務端 `sanitizeLabel` 雙保險 | index.html 頂部 + worker |
| CSRF / state 重放 | state 一次性 + 10min TTL + provider 校驗 + sid 綁定 | worker handleCallback |
| 混合內容 | CSP connect-src 白名單（僅自家 + Ollama 本地） | _headers |
| 點擊劫持 | X-Frame-Options: DENY + frame-ancestors 'none' | _headers |
| 爬蟲/爆破 | 60/min IP 限速（429） | worker |
| 密鑰事故 | cleanEnv 自動剝空格/引號/BOM；secret 走 CF 加密變量 | worker |

已知取捨：CSP 允許 `'unsafe-inline'`（單文件面板的內聯腳本必需）；限速是單實例內存的（Pages 多實例下各自獨立計數，擋爬蟲夠用，擋 DDoS 請用 CF WAF）。

## 8. 修改指南（改哪裡 → 什麼效果）

| 想改什麼 | 動哪個文件 | 注意 |
| --- | --- | --- |
| 品牌/標題/歡迎語 | index.html 搜 `YamiHub` / `歡迎來到` | 有多處（title/側欄/登錄首屏/頁腳） |
| 主題色 | os2.css `:root` 變量 | 暗色塊同步改 `html[data-theme="dark"]` |
| 新增面板頁 | index.html：section + 側欄 + go() | 記得掛 `renderXxx()` |
| 加 OAuth 平台 | worker `PROVIDERS` 對象 + 前端 `LOGIN_META`/`CONN_META` | 標準授權碼流，抄 github 的形狀 |
| 評分權重 | scoring.js `PROFILES`（前端會覆蓋服務端） | 權重實驗室用戶可自行覆蓋 |
| 同步上限 | worker `for (let page = 1; page <= 3; ...)` | 3 頁 ×100 = 300 倉庫 |
| demo 數據 | tools-port.mjs 重新生成，或手改 public/data/*.json | 保持 3.1 契約形狀 |

## 9. 路線圖（v0.2 → v0.4）

- **v0.2**：同步結果本地加密持久化（WebCrypto，口令用戶自持）+ 任務頁看板化（dashi 狀態流）+ 地圖主路徑逐步播放
- **v0.3**：Notion 數據庫/頁面拉取視圖 + Google Drive 接入 + 多語言
- **v0.4**：KV 零知識同步（客戶端加密後才上雲）+ 對比視圖（本週 vs 上週資產變化）

## 10. 測試

- 紅藍對抗任務書：`../TEST-BRIEF.md`（紅隊 19 條 + 藍隊 5 條，可直接扔給另一個 AI 執行）
- Worker 冒煙：`../_tools/worker-harness.mjs`
- 引擎冒煙：`../_tools/smoke-archlive.mjs`
