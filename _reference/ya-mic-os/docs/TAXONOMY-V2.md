# 統一分類 v2 — TAXONOMY-V2

> **狀態**：v2.1 · 2026-09-05（補「十二、身份與訪問分層」+「十三、OAuth 預留規範」）
> **權威文件**：`public/data/boards.json`
> **取代**：v1 的「十大主定位」（portfolio.json）+ `primary_domain`（repositories.yaml）+ 9 個舊 board（boards.json v1）
> **適用版本**：當前部署於 GitHub Pages（`Ya-MiC.github.io/ya-mic-os/`），口令解鎖機制；未來服務化時按第十三節升級到 OAuth

---

## 一、為什麼要統一

ya-mic-os 在 v1 階段同時存在 **三套互相獨立的分類軸**：

| 軸 | 文件 | 用途 | 顆粒度 |
|---|---|---|---|
| 十大主定位 | `portfolio.json.by_domain` | 倉庫的「本質歸類」 | 業務主題（10 類） |
| `primary_domain` | `repositories.yaml` | 倉庫的「業務角色」 | 業務細分（13 類） |
| 9 個 Star 字母 | `boards.json` v1 | Star 的「行為意圖」 | 個人用法（9 類） |

**問題**：

1. 同一個倉庫在三套軸裡可能被標成 3 個不同分類（例如 `dsh` 在 portfolio 是 `AI-AGENT`，在 repositories.yaml 是 `ai-agents`，在 boards.json 是 `G` Agent與Skill參考）
2. 維護成本 ×3：任何分類變動要改 3 個文件
3. 跨軸查詢（"這個分類下我的所有東西"）沒法做

**v2 解法**：以 **boards.json 的 9 個字母分類為權威**，其他兩套映射過來。

---

## 二、v2 權威分類（9 個 board）

每個 board 用「**字母 · 全稱 · 名字 · 簡介**」四段式命名。

| 字母 | 全稱 | 名字 | 簡介 | 決策狀態 |
|---|---|---|---|---|
| **I** | Infrastructure | 基礎設施 | 部署/網路/DNS/容器/憑證——支撐其他東西跑起來的地基 | `stable` |
| **M** | Mainline-watch | 持續觀察 | 不急著用，但要追 release / 防 break 的主力追蹤對象 | `monitoring` |
| **S** | Study | 研究學習 | 為了搞懂某個領域/技術才 star 的——讀完即可卸載 | `study-temp` |
| **G** | Genesis-template | Agent與Skill參考 | Agent 框架、Skill 包裝格式、提示詞工程——別人怎麼寫 skill 我要參考的 | `reference` |
| **W** | Workflow-utility | 溝通與生活工具 | 通訊/排程/文件/翻譯/票據——直接插進我日常生活的工具 | `in-use` |
| **D** | Design-reference | 美學前端參考 | 視覺/UI/Dashboard/排版——值得借鑑的「長得好看的東西」 | `reference` |
| **R** | Risk-watch | 風險留意 | 授權/安全/維護有疑慮，記著別亂用 | `contained` |
| **A** | Adopt-candidate | 候選採用 | 候選採用的專案/工具——決定了就退出 Star 區 | `decision-pending` |
| **X** | Triage | 待分類 | 新 Star 的預設落點——30 秒人工裁決後遷到 I/M/S/G/W/A/D/R 之一 | `triage` |

每個 board 在 `boards.json` 還有：

- `decision_state`：當前決策狀態（用於面板 UI 高亮）
- `exit_when`：什麼時候該移走
- `exit_to`：移走去哪（避免「垃圾桶」永久堆積）

---

## 三、舊分類 → v2 映射表

### 3a. v1 十大主定位（portfolio.json） → v2

| v1 primary_domain | v2 board | 理由 |
|---|---|---|
| AI-AGENT | G | 都是 Agent/Skill 框架 |
| PLUGIN-SDK-TEMPLATE | G | 都是 Agent/Skill 框架 |
| DEVICE-SYSTEM-SETUP | I | 設備/網路/DNS 歸基礎設施 |
| QUANT-FINANCE | A 或 S | 採用候選或研究學習，看具體情況 |
| AUTOMATION | W | 自動化腳本歸工作流工具 |
| DATA-RESEARCH | S | 數據研究歸學習 |
| WEBSITE-CONTENT | D | 網站歸設計/內容（特例） |
| RECORD-HANDOVER | I | 記錄/移交歸基礎設施（特例） |
| PRODUCT-SAAS | A | 產品/服務歸候選採用 |
| HUMAN-REVIEW | X | 待人工審核歸待分類（保留為狀態，不是分類） |

### 3b. v1 primary_domain（repositories.yaml） → v2

| v1 primary_domain | v2 board |
|---|---|
| audit-compliance | A · 候選採用（核心產品線） |
| proxy-network | I · 基礎設施 |
| ai-agents | G · Agent與Skill參考 |
| quant-trading | A 或 S |
| utilities | W · 工作流工具 |
| dsh-plugins | G · Agent與Skill參考 |
| identity-migration | R · 風險留意（隱私隔離） |
| portfolio | D · 設計參考（作品集） |

### 3c. v1 9 個字母 board → v2

完全保留，**只升級文案 + 加決策狀態字段**。39 個已分配的 Star 不動。

---

## 四、倉庫特有狀態（非分類）

以下**不是分類**，是**狀態標籤**，跟 9 個 board 正交：

| 狀態 | 字段位置 | 用途 |
|---|---|---|
| `HUMAN-REVIEW` | `portfolio.json.repositories[].needs_human` | 倉庫未被人類裁決過 |
| `PRIVACY-ISOLATED` | `risks.yaml` | 4 個 yanming 私庫（critical） |
| `FORK` | `portfolio.json.repositories[].fork` | 上游依賴倉庫 |
| `UNSTAR-PENDING` | `boards.json.starredX` | 11 個待裁決的 Star |

**狀態 vs 分類的區別**：
- 分類（board）回答「這是什麼性質」
- 狀態（status）回答「現在處理到哪一步」

例如：`zhanzhen-server` 同時是 `A · 候選採用`（分類）+ `PRIVACY-ISOLATED`（狀態）+ `FORK`（狀態）。

---

## 五、可擴展性設計

### 5a. 新分類怎麼加

未來想加新分類（例如 `O · Open-source-contribution` 開源貢獻）：

1. 在 `boards.json.boards` 數組追加一個對象：
   ```json
   {
     "code": "O",
     "full_name": "Open-source-contribution",
     "name": "開源貢獻",
     "color": "#xxxxxx",
     "description": "我參與貢獻的開源專案",
     "decision_state": "stable",
     "exit_when": "停止貢獻",
     "exit_to": "unstar"
   }
   ```
2. 在 `boards.json.rules` 加自動匹配關鍵詞（可選）
3. **不需要改任何代碼** —— index.html 自動讀 `boards.json.boards` 渲染

### 5b. 字母表富餘

26 個英文字母裡 v2 用掉 9 個（I/M/S/G/W/D/R/A/X），剩 17 個（B/C/E/F/H/J/K/L/N/O/P/Q/T/U/V/Y/Z）足夠未來擴展。

### 5c. 不會破壞現有

- 39 個已分配的 Star 在 `boards.json.starred` 數組裡的 `board` 字段保持不變
- autopilot 同步腳本讀 `boards.json.boards` 動態渲染，不需要硬編碼 9 個分類
- 新 Star 默認進 `X`（`boards.json.starredX`），人工裁決後移到對應 board

---

## 六、Star 生命週期（新 Star 流程）

```
[GitHub 點 Star]
    ↓
[autopilot 寫入 starred.json + boards.json.starredX]
    ↓ (預設落點 X)
[30 秒人工裁決]
    ↓ 選 I/M/S/G/W/D/R/A
[移到 boards.json.starred 對應 board]
    ↓
[繼續觀察 / 採用 / 卸載]
    ↓
[exit_when 觸發 → exit_to / unstar]
```

**X 不再是「垃圾桶」**，而是「**人工裁決佇列**」。每週清空一次 X 即可保證不堆積。

---

## 七、倉庫生命週期（新倉庫流程）

```
[GitHub 創建倉庫]
    ↓
[autopilot 發現 → portfolio.json.repositories[] needs_human=true]
    ↓ (預設 HUMAN-REVIEW 狀態)
[auto_sync.mjs 自動開 human-review issue]
    ↓
[Ya-MiC 在 issue 裡回覆字母 A/B/C/D/E]
    ↓
[gov_sync.mjs 讀回覆 → portfolio.json decision]
    ↓
[同時映射到 v2 board：A 候選採用 / S 研究學習 / I 基礎設施 / W 工作流 / R 風險留意]
```

**注意**：v2 沒有「B / C / E」三個分類字母（issue 字母是 v1 舊版的人類裁決字母）。人類裁決字母 A-E 是歷史協議，未來可統一改為 v2 的 I/M/S/G/W/A/D/R。

---

## 八、UI 渲染約定

### 8a. 9 個 board 在面板上的呈現順序

```
I (基) → M (主) → S (學) → G (範) → W (工) → D (美) → R (險) → A (候) → X (裁)
```

按「穩定 → 活躍 → 待裁決」順序，最右邊的 X 是「需要立刻處理」。

### 8b. 顏色映射

每個 board 自帶 `color` 字段（hex code），面板用此顏色渲染卡片邊框。X 用灰色（neutral），強調它的「等待處理」中性狀態。

### 8c. 雷達圖維度

每個 board 在雷達圖上是一個六邊形頂點（9 個 board = 9 維雷達），每個維度是「該 board 下資產的綜合健康度」。維度公式沿用 v1 的 C/P/L/S/R/M/D/Q/E 9 因子評分（見 `tools/scoring.mjs`）。

---

## 九、向後兼容

### 9a. v1 字段保留

- `portfolio.json.repositories[].primary_domain`：保留，作為「歷史記錄」，UI 不再渲染
- `repositories.yaml[].primary_domain`：保留，作為「人類原始裁決記錄」
- `boards.json` 9 個 board 的 `code` 字母保持不變

### 9b. 升級路徑

未來若要從 v2 升到 v3，只需要：

1. 在 `boards.json` 加 `schema_version: 3`
2. 在本文件寫 v3 變更說明
3. 不需要動 index.html / tools/*.mjs / GitHub Actions

---

## 十、相關文件

| 文件 | 角色 |
|---|---|
| `public/data/boards.json` | 9 個 board 權威定義 |
| `public/data/portfolio.json` | 69 個倉庫的元數據 + 評分 |
| `public/data/starred.json` | 52 個 Star 的元數據 |
| `public/data/watchlist.yaml` | Fork 倉庫的 ADOPT/STUDY/MONITOR/AVOID 標記 |
| `public/data/risks.yaml` | 4 級風險體系（critical/high/medium/low） |
| `public/data/relationships.yaml` | 倉庫之間的關係圖（forked-from / depends-on / integrates-with） |
| `public/data/scores.yaml` | 評分公式 + 投資優先級 |
| `tools/auto_sync.mjs` | 自動同步 + 自動評分 + 自動開 human-review issue |
| `tools/gov_sync.mjs` | 從 human-review issue 拉人類裁決 |
| `tools/scoring.mjs` | Skill 3.0 評分公式（5 套權重 profile） |
| `assets/scoring.js` | 瀏覽器端動態評分 |
| `index.html` | SPA 主面板（12 個 page-xxx 區塊） |

---

## 十一、版本歷史

| 版本 | 日期 | 變更 |
|---|---|---|
| v1 | 2026-08-27 | 初始：3 套分類共存（portfolio / repositories.yaml / boards.json） |
| v2 | 2026-09-05 | 統一以 boards.json 9 字母分類為權威；加四段式命名 + 決策狀態 + 退出條件；保留所有舊字段作為歷史記錄 |
| **v2.1** | **2026-09-05** | **補「十二、身份與訪問分層」明確 Ya-MiC/Yanming 雙層身份 + 口令解鎖契約；補「十三、OAuth 預留規範」定義未來服務化升級介面** |

---

## 十二、身份與訪問分層（v2 新增）

ya-mic-os 採用**兩層身份模型**，對應兩種訪問路徑：

### 12a. 兩種身份

| 身份 | 性質 | 公開內容 |
|---|---|---|
| **Ya-MiC** | 對外人格 | 湛箴產品線、Agent 工具鏈、公開倉庫、公開 Star |
| **Yanming** | 真實身份 | 4 個 `yanming*` / `Global-Identity-Planning` 私庫——個人身份/移民/財務/AI 撰寫草稿 |

**Yanming 系列倉庫完全與 Ya-MiC 公開人格隔離**，由 `public/data/risks.yaml` 的 `critical` 級別標記，**任何公開訪問者都不應看到 Yanming 倉庫的任何字段**（連名字都隱藏）。

### 12b. 兩種訪問路徑（v1 已實現，v2 保留）

```
┌─────────────────────────────────────────────────────────┐
│ 訪問者路徑 A：公開訪客（GitHub Pages 默認訪問）          │
├─────────────────────────────────────────────────────────┤
│ URL：https://Ya-MiC.github.io/ya-mic-os/                │
│                                                         │
│ 1. fetch public/data/portfolio.json（已脫敏）          │
│    → 14 個私有倉庫的 description / license / topics     │
│      全部遮罩為 null 或空字串                           │
│    → 4 個 Yanming 倉庫：name 替換為 "REDACTED-001" 等   │
│                                                         │
│ 2. 渲染 9 個 board + 69 個卡片（已遮罩的）               │
│                                                         │
│ 3. 右上角「🔒 私有」按鈕 → 點擊輸入口令                 │
│    → 進入路徑 B                                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 訪問者路徑 B：本人解鎖（口令本地解密）                   │
├─────────────────────────────────────────────────────────┤
│ 1. 輸入私有口令（口令不上伺服器）                        │
│                                                         │
│ 2. fetch public/data/private.enc（18KB 二進位）         │
│                                                         │
│ 3. Web Crypto API 瀏覽器本地解密：                       │
│    salt (16 bytes) → PBKDF2-SHA256 250,000 次 → AES-256 │
│    iv (12 bytes) + ciphertext → AES-GCM 解密            │
│                                                         │
│ 4. 解密後的 JSON 合併到 portfolio.json                  │
│    → 14 個私有倉庫完整資料覆蓋遮罩                       │
│    → 4 個 Yanming 倉庫完整資料載入                       │
│                                                         │
│ 5. 渲染完整控制台（含 Yanming 隔離區）                  │
│                                                         │
│ 6. 口令只存在瀏覽器 sessionStorage                      │
│    → 關閉分頁即清除                                      │
│    → 不寫入 localStorage（避免持久化洩漏）               │
└─────────────────────────────────────────────────────────┘
```

### 12c. v2 對雙層訪問的承諾

| 承諾 | 機制 |
|---|---|
| Yanming 倉庫對公開訪問者**完全隱形** | `portfolio.json` 同步腳本生成時自動遮罩 `name` / `description` / `license` / `topics` 為 null |
| 口令**永遠不上伺服器** | PBKDF2 派生在瀏覽器 Web Crypto API 內完成；GitHub Actions / Netlify Functions 都接觸不到口令 |
| 口令**不持久化** | 只放 sessionStorage；刷新或關閉分頁即清除 |
| 14 私有倉庫對公開訪問者**部分可見** | 名稱/語言/star/時間可見；敏感字段遮罩 |
| Yanming 4 個倉庫對公開訪問者**連名字都不可見** | `name` 替換為 `REDACTED-001` 等編號 |

---

## 十三、OAuth 預留規範（未來服務化介面）

當 ya-mic-os 從「self-hosted 只本人用」演進到「公開 SaaS 服務化」時，需要從**口令解鎖**升級到 **GitHub OAuth 登入**。本節定義**介面契約**，確保未來升級時不破壞現有雙層訪問。

### 13a. 為什麼需要 OAuth

| 當前（口令解鎖） | 未來（OAuth） |
|---|---|
| 只支援單用戶（Ya-MiC 本人） | 支援任意 GitHub 用戶 |
| 口令固定寫在 Ya-MiC 腦中 | 用戶用 GitHub 帳號登入 |
| 解鎖的是 Ya-MiC 自己的 14 私有倉庫 | 解鎖的是用戶**自己的**私有倉庫 |
| Yanming 完全隔離 | 同樣完全隔離（脫敏層對所有用戶一致） |

### 13b. OAuth 升級觸發條件

**同時滿足以下三條**才升級到 OAuth：

1. ✅ ya-mic-os 公開訪問量 > 10 個獨立用戶/週（證明有真實需求）
2. ✅ 用戶反饋「輸入口令太麻煩」（不是 Ya-MiC 自己覺得麻煩）
3. ✅ Netlify Functions 或 Cloudflare Workers 已部署（提供 token 中轉層）

**未達條件時保持口令解鎖**，不為假想需求提前實現。

### 13c. OAuth 升級時要改的 5 個檔案

| 檔案 | 改動 |
|---|---|
| `netlify.toml` | 加 `[functions]` 段（若用 Netlify Functions）或保留 GitHub Pages + Cloudflare Workers |
| `assets/oauth.js`（新增） | GitHub OAuth 登入按鈕 + 回調處理 |
| `tools/oauth_callback.mjs`（新增） | GitHub Actions / Worker 端用 OAuth code 換 access_token |
| `tools/auto_sync.mjs` | 改為「拉指定用戶的數據」（不再硬編碼 `OWNER = "Ya-MiC"`） |
| `index.html` | 「🔒 私有」按鈕改為「Sign in with GitHub」+ 保留口令解鎖作為 fallback |

### 13d. 不需要改的（v2 已經預留）

- ✅ `public/data/boards.json` schema：通用，不綁定用戶
- ✅ `public/data/portfolio.json` schema：每個用戶一份，互不干擾
- ✅ `assets/scoring.js`：評分公式通用
- ✅ `docs/TAXONOMY-V2.md`：分類體系通用
- ✅ 9 個 board 字母表：通用分類軸

### 13e. OAuth scope 要求

最小權限原則（`principle of least privilege`）：

| Scope | 用途 | 是否必需 |
|---|---|---|
| `read:user` | 讀用戶 profile（顯示頭像/名字） | ✅ 必需 |
| `public_repo` | 讀用戶所有公開倉庫元數據 | ✅ 必需 |
| `repo` | 讀用戶私有倉庫元數據 | ✅ 必需（用戶私有倉庫也要顯示） |
| `read:org` | 讀用戶組織（如適用） | ❌ 不需要 |
| `write:repo` / `admin:org` / etc. | 寫權限 | ❌ **絕不請求**（最小權限） |

### 13f. 數據隔離保證

- 每個用戶的 `portfolio.json` / `starred.json` / `private.enc` 存於**用戶命名空間**（如 `/users/{login}/portfolio.json`）
- 用戶之間**完全隔離**，後端永遠不跨用戶查詢
- Yanming 隔離邏輯對**所有用戶**生效：任何用戶自己命名的 `yanming*` 倉庫都視為隔離區

### 13g. 何時寫程式碼

**OAuth 程式碼只有滿足 13b 三條條件後才開始寫**。在此之前：

- ✅ 維護現狀（口令解鎖）
- ✅ 收集用戶反饋
- ❌ **不為假想需求寫程式碼**（避免過度工程化）

---

## 十四、相關文件（v2 補充）

| 文件 | 角色 | v2 變更 |
|---|---|---|
| `public/data/boards.json` | 9 個 board 權威定義 | ✅ 已升級為四段式 + decision_state |
| `public/data/portfolio.json` | 69 個倉庫元數據 + 評分 | ✅ 已加 taxonomy_version 標記 |
| `public/data/private.enc` | 14 私有 + 4 Yanming 完整資料（AES-256-GCM） | ⚠️ 不變（口令解鎖機制保留） |
| `public/data/starred.json` | 52 個 Star 元數據 | ⚠️ 不變 |
| `index.html` | SPA 主面板 | ⚠️ 不變（雙層訪問 UI 已實現） |
| `.github/workflows/deploy-pages.yml` | GitHub Pages 自動部署 | ⚠️ 不變（脫敏檢查已內建） |
| `.github/workflows/auto-sync.yml` | 每 6 小時自動同步 | ⚠️ 不變（脫敏邏輯在 tools/auto_sync.mjs） |
| `tools/auto_sync.mjs` | 自動同步 + 脫敏 + 自動評分 | ⚠️ 不變 |
| `assets/scoring.js` | 瀏覽器端動態評分 | ⚠️ 不變 |
| **新增：`docs/TAXONOMY-V2.md`** | **統一分類 v2 規範** | **✅ 本文件** |

