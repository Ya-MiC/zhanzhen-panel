# AGENTS.md — AI 助手行動規範（接手本倉庫的 AI 必讀必守）

> **本文件效力**：任何 AI（Claude/DeepSeek/GLM/未來的我）接到本倉庫相關任務時，**第一步先讀完本文件再動手**。
> 作者：湛箴（Ya-MiC）· 2026-09-16 訂立 · 違反任何一條 = 交付無效，必須返工。

---

## 鐵律一：先檢索，後動手

接到任務後，按順序檢索這些文件（都在倉庫內）：

| 順序 | 文件 | 何時必讀 |
| --- | --- | --- |
| 1 | `AGENTS.md`（本文件） | **每次** |
| 2 | `deploy/DESIGN-LANGUAGE.md` | 任務涉及任何 UI（按鈕/顏色/圓角/字號/動效） |
| 3 | `deploy/DEVELOPER.md` | 任務涉及架構/數據契約/評分公式/新增頁面 |
| 4 | `deploy/UPLOAD-MAP.md` | 交付時（路徑映射格式固定） |
| 5 | `deploy/YAMIFEED-DESIGN.md` | 任務涉及資訊整合/熱榜/微信推送 |
| 6 | `deploy/TAURI-GUIDE.md` | 任務涉及桌面封裝/Releases |

**禁止**：沒讀完就開工；憑記憶做事不核對最新文件。

## 鐵律二：一次一個交付，不發散

- 用戶說什麼就做什麼，**做完即交付**。發現相鄰問題：寫進交付回覆的「下一步」清單，**不擅自擴大範圍**。
- 一次改動 ≤ 一個主題（一個頁面/一個模塊/一類修復）。想「順手把 XX 也改了」= 違規。
- 用戶說「繼續優化」時：按本倉庫現有排期（YAMIFEED-DESIGN §6 / README 已知待打磨）**順序執行下一項**，不自由發揮。

## 鐵律三：改動三步走（缺一步 = 返工）

1. **改前**：確認要動的文件在本地 workspace 有一份（`projects/yami-hub/deploy/` 是唯一真相源）
2. **改後**：跑 `_tools/final-check.mjs` 必須全綠（語法 + 13 路由 + 功能旗標 + 文件數）；CSS 改動另查括號平衡
3. **交付**：用 GitHub API 直接推 commit（零 clone），附**路徑映射表**（哪個文件 → GitHub/CF 哪裡）

## 鐵律四：紅線（碰了就是事故）

| 紅線 | 具體禁令 |
| --- | --- |
| 隱私 | 倉庫和 deploy/ **零真實數據**：真實倉庫名（zhanzhen 系/action-tree 等）、真實 Sheets ID、郵箱、token 一律不得出現；`_private/` 永不上傳 |
| 協議 | newsnow=MIT 可入庫；RSSHub=AGPL **只許 HTTP 調用不許複製代碼**；tophub/SoPilot 閉源只許借鑒思路 |
| 毀滅性變更 | 環境變量名（KV/GITHUB_CLIENT_ID 等 6+1 個）、API 路由、KV 鍵結構——**改前必須警告用戶**並給遷移步驟 |
| 美學 | 不新增第 5 種按鈕樣式、不新增檔位外的圓角/字號、不引入 3D 炫技動效（詳見 DESIGN-LANGUAGE） |
| 誠實 | 沒跑的驗證不許說「已驗證」；沒完成的排期不許說「已完成」 |

## 鐵律五：交付格式（每次結束必附）

1. 完成了什麼（一句話/表格）
2. 驗證證據（final-check 輸出、harness 路由數、語法檢查）
3. **路徑映射表**：本地路徑 → GitHub 倉庫哪裡 → CF Pages 怎麼更新
4. 下一步清單（從排期來，不新造）

## 排期真相源（「繼續」= 按這個順序做）

1. **YamiFeed v0.2-1**：熱榜頁面（GitHub Trending + RSSHub 公共實例）+ KV 緩存 + `/api/feed/:source`
2. **YamiFeed v0.2-2**：WxPusher 每日精選推送 + Cron Trigger
3. **v0.2-3**：LICENSE 切 GPL-3.0 + LICENSE-NOTES.md + newsnow 適配器入庫
4. **桌面版**：Tauri 壳（TAURI-GUIDE §4，A 路線）
5. **YamiFeed v0.3**：訂閱號認證後切官方模板消息 + RSS 輸出

## 倉庫事實速查

- 主倉庫：`Ya-MiC/zhanzhen-panel`（公開）· 線上演示：`https://kv-9di.pages.dev`
- 本地真相源：`C:\Users\cao41\.openclaw-autoclaw\workspace\projects\yami-hub\deploy\`
- 推送方式：GitHub Git Database API（blob→tree→commit→ref），機器上 `gh` 已登入
- 部署方式：用戶拖 `deploy/` 到 CF Pages（上傳資產）；AI 不碰用戶的 CF 賬號
