# Ya-MiC 總控作業系統 — 產品願景 (Product Vision)

## 一句話定位

**Ya-MiC 總控作業系統是一個「美學風格的 GitHub 控制面板插件」——讓不懂 GitHub 安裝的小白用戶，也能透過視覺化面板管理自己的 59+ 倉庫資產、42 個 Star 項目，並未來擴展到 Notion + Google Sheets 的跨平台治理。**

## 核心原則（來自 README）

1. **先理解再組織** — 不盲目分類，先讀懂每個倉庫的真實用途再歸類
2. **先證據再結論** — 評分（AVS/GRS/FinalSPI）必須基於可驗證的 GitHub 數據（star 數、fork 數、last commit 時間）
3. **先保留再刪除** — 對不確定的資產標記為 `HUMAN-REVIEW`，而非直接刪除
4. **後果性操作前人工核准** — 刪除倉庫、封存項目等不可逆操作必須經過 G1-G5 決策閘門
5. **一個職責只有一個歸屬處** — 每個倉庫只屬於一個「主定位」分類，避免重複歸類

## 終局狀態（End State）

### 現在（2026-09）
- ✅ 59+ 倉庫資產已分類（十大主定位）
- ✅ 42 個 Star 已標記（STUDY / ADOPT 候選）
- ✅ autopilot 自動化管線已運行（每 5-7 小時同步一次 GitHub 真實數據）
- ✅ 視覺化面板已部署（`index.html` / `gallery.html` 讀取 `public/data/*.json`）

### 未來（2026-Q4）
- 🔄 GitHub + Notion + Sheets 每週自動同步（README 待辦，DDL 已逾期）
- 🔄 倉庫工作區 / Star 工作區獨立可摺疊 UI（用戶明確訴求）
- 🔄 15 項 Human Review 待裁決項目處理（DDL 2026-09-05）
- 🔄 私有口令輪換工具腳本（無明確 DDL）

## 不做什么（Non-Goals）

- ❌ 不是 GitHub 替代品 — 只是 GitHub 的「美學外殼」，所有數據仍存於 GitHub
- ❌ 不是自動化分類工具 — 分類邏輯（十大主定位）由用戶手動維護，autopilot 只同步元數據
- ❌ 不是企業級 SaaS — 目前僅服務單用戶（Ya-MiC 本人），無多租戶/權限管理設計

## 成功指標（Success Metrics）

| 指標 | 當前值 | 目標值 |
|---|---|---|
| 倉庫分類覆蓋率 | 59/59 (100%) | 維持 100% |
| Star 分類覆蓋率 | 42/42 (100%) | 維持 100% |
| autopilot 同步延遲 | < 7 小時 | < 1 小時 |
| Human Review 待辦 | 15 項 | 0 項 |
| 面板加載速度 | 未測量 | < 2 秒 |

## 參考設計

- **archify** — 用戶喜歡的「綠色類似多領」風格參考
- **zhanzhen-server** — 產品工作流文件格式參考（`docs/product-workflow/README.md`）
