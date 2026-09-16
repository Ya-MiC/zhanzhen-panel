# PHASE-0-AUDIT.md — zhanzhen-panel 基線審計報告（Phase 0，零修改）

> 審計時間：2026-09-16 · 審計方式：GitHub API 遠程讀取（零 clone）· 審計人：AI 助手（按 AGENTS.md 鐵律）
> 上游指令：用戶提供的 312 行漸進式產品化重構任務書

---

## 1. 倉庫目錄樹現狀（77 文件）

```
zhanzhen-panel/
├── AGENTS.md                ✅ AI 行動規範（已存在）
├── LICENSE                  ✅ GPL-3.0（已切換）
├── LICENSE-NOTES.md         ✅ 目錄級協議映射（已存在）
├── README.md                ✅ 已重寫（演示鏈接+部署教學）
├── package.json             ✅ pnpm workspace 根（pnpm@9.15.4, node≥20.18）
├── pnpm-workspace.yaml      ✅ apps/* + packages/*
├── .github/workflows/ci.yml ⚠ 0 字節空文件
├── apps/
│   ├── web/                 ✅ Vue 3.5 + Vite 6 + TS 5.7（有真實代碼）
│   │   └── src/App.vue      ⚠ 25.6KB 單文件應用（見 §3）
│   ├── desktop/README.md    ⚠ 0 字節（僅目錄佔位）
│   └── mobile/README.md     ⚠ 0 字節
├── packages/ai/src/types/   ✅ 2 個 TS 類型文件（analysis-task / writing-profile）
├── deploy/                  ✅ YamiHub 發行版 22 文件（獨立體系，見 §5 邊界）
├── docs/                    ⚠ 多數 0 字節（僅 READING_INTELLIGENCE_SPEC.md 21KB 有內容）
├── public/ scripts/         ⚠ 全是 0 字節佔位
└── pnpm-lock.yaml           ✅ 31KB（真實鎖定）
```

## 2. 技術棧盤點（apps/web 實測）

| 項 | 值 |
| --- | --- |
| 框架 | Vue 3.5.13（Composition API, `<script setup lang="ts">`） |
| 構建 | Vite 6.1.0 + vue-tsc 2.2.0（build 含 typecheck） |
| 狀態 | 純 ref/computed，無 Pinia |
| 持久化 | localStorage 四鍵（files/tasks/theme/chat，各帶 `-v1` 版本後綴 ✅） |
| 依賴 | 極簡：僅 vue+vite+ts，無 UI 庫無重型依賴 ✅ |
| scripts | dev/build/preview/lint(無 lint script 定義)/typecheck |

## 3. App.vue 功能真實性盤點（回應任務書「三欄面板」清單）

任務書說「絕對不可刪除既有 v0.1 三欄面板能力」，實際核查：

| 任務書列的功能 | App.vue 實際狀態 |
| --- | --- |
| 左側導航 | ✅ 有（6 頁：首頁/我的文件/讀書分析/流程圖/思路画像/寫作工坊） |
| 首頁/儀表板 | ✅ 有（hero + 任務框 + 四個 action 卡 + 最近文件 + 工作流圖） |
| 文件與本地保存 | ✅ 真實可用（新建/匯入 .md/.txt/編輯/保存/刪除，localStorage 持久化） |
| 閱讀分析 | ⚠ 有頁面但為**靜態預覽**（四張 insight 卡是寫死的說明文案 + 原文截圖 1800 字），無真實 AI 分析 |
| 流程圖 | ⚠ 有頁面但為**靜態示意**（三張 node-flow 卡），任務書描述的「可點擊節點/匯出」不存在 |
| 思想/思維檔案 | ⚠ 有頁面但為**四張靜態卡片**（設計說明性質） |
| 寫作工作坊 | ⚠ 有頁面（大綱輸入+任務保存），無生成能力 |
| 右側 AI 助手 | ⚠ 有聊天 UI 但回覆是**寫死的延遲回聲**（setTimeout 假回覆） |
| 主題切換 | ✅ 真實可用（淡粉亮色 ↔ 深色，localStorage 記憶） |
| Toast | ✅ 有 |

**結論（誠實）**：任務書把「靜態原型頁」當作「既有功能」保護。這些頁面是真實的 UI + 假的數據/智能。整改時按任務書約束**保留全部頁面與交互**，AI 能力部分按任務書 §3「明確標示為 mock/placeholder」——App.vue 目前已經這樣做了（「目前分析文件」「第一版」「敬請期待」字樣），繼續保持。

## 4. 主題現狀 vs 任務書要求

| 要求 | 現狀 | 差距 |
| --- | --- | --- |
| 兩套淺色主題（淡粉核心） | 1 套淡粉（--bg:#fcf8f9 / --primary:#c36f89，25 處粉色 token） | 需要加第二套淺色 |
| 一套深色（Binance 式秩序感+克制紅點綴） | 已有深色（#111723 底 + #ed6670 紅 primary + 徑向漸層點綴）——**方向已對** | 微調：漸層克制度、加 CSS 變量化程度 |
| 主題切換 | toggle 雙態（light/dark） | 需改三態（light-pink / light-plain / dark） |
| 禁髒銅/過度金色 | 未發現 | ✅ |

## 5. deploy/ 與 apps/ 的邊界（重要澄清）

任務書覆蓋整個倉庫，但兩個子產品技術棧完全獨立：
- `deploy/`（YamiHub 發行版）：原生 HTML+CSS+JS，22 文件，已 GPL + 全綠終檢體系（_tools/final-check.mjs），**有自己的 AGENTS.md 副本**
- `apps/web`（工作台）：Vue/pnpm workspace

**執行策略**：Phase 1-3 全部針對 `apps/web` + 根級工程化；`deploy/` 不混入本次整改（避免跨棧污染），僅在 CHANGELOG/文檔中說明兩者關係。

## 6. 風險清單（P0/P1/P2）

| # | 風險 | 級別 | 處置 |
| --- | --- | --- | --- |
| 1 | `.github/workflows/ci.yml` 是 0 字節——CI 名存實亡 | **P0** | Phase 1 填入真實 workflow（install+build+typecheck，無部署無 token） |
| 2 | 根 package.json 有 `lint` script 但 apps/web 無 lint 工具與配置 | **P0** | Phase 1 加 ESLint flat config + prettier（輕量） |
| 3 | App.vue 25.6KB 單文件（script 500+ 行 / template 巨塊）| P1 | Phase 2 按任務書目錄結構漸進拆分（一次一邊界） |
| 4 | 無測試、無 .editorconfig、無 CHANGELOG | P1 | Phase 1 補齊（vitest smoke：storage adapter + 主題切換） |
| 5 | 文檔空殼（ARCHITECTURE/DATA-MODEL 等 0 字節） | P1 | Phase 1 按任務書清單填充 |
| 6 | 主題僅雙態、變量分散在 .app/.dark 兩塊 | P2 | Phase 2 抽 styles/themes.css + 第三主題 |
| 7 | `docs/READING_INTELLIGENCE_SPEC.md` 21KB 有價值但無索引 | P2 | Phase 1 文檔索引化 |
| 8 | **隱私檢查**：全倉庫掃描無真實 token/郵箱/私有倉名 ✅；`_reference/_private` 已在前輪清除 ✅ | P0 已過 | 持續守衛 |

## 7. 工作計畫（按任務書 Phase 順序）

- **Phase 1（本輪執行）**：docs 填充 + CHANGELOG + .editorconfig + CI workflow + ESLint/Prettier 最小配置 + vitest smoke（storage/theme）——全部低風險增量，不改 App.vue 一行
- **Phase 2（下輪起）**：App.vue 漸進拆分（第一刀：theme → composables/useTheme.ts；第二刀：localStorage → services/storage/；之後按頁面拆 features/）
- **Phase 3**：storage adapter + schema versioning + 匯出匯入
- **Phase 4**：desktop/mobile 骨架文檔化（不假裝完成）

**提交策略**：按任務書「不要直接推送遠端除非明確要求」——但本倉庫的既有工作模式是用戶明確要求的「直接體現在 GitHub」（AGENTS.md 鐵律三），故 Phase 1 完成後推送 main，commit message 註明 Phase 1。**推送前先跑 pnpm build 驗證**。

## 8. 需要人工決策的事項（Phase 1 不擅動）

1. 第二套淺色主題的具體色向（米白/淺灰/其他）——Phase 2 時給選項
2. ESLint 規則嚴格度（建議：minimal + vue3-recommended 起步）
3. 是否引入 Pinia（建議：Phase 2 拆分到「狀態跨頁共享」時再引）
