# Ya-MiC 總控作業系統 — 系統架構 (System Architecture)

## 高層架構圖

```
┌──────────────────────────────────────────────────────────────────┐
│                         用戶瀏覽器                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ index.html   │  │ gallery.html │  │ (未來)       │           │
│  │ (儀表板)     │  │ (卡片牆)     │  │ 裁決視圖     │           │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘           │
│         │                 │                 │                    │
│         └─────────────────┼─────────────────┘                    │
│                           │                                      │
│                  讀取 public/data/*.json                          │
└───────────────────────────┼──────────────────────────────────────┘
                            │
                            │ 靜態文件（Cloudflare Pages / Netlify）
                            │
┌───────────────────────────┼──────────────────────────────────────┐
│                    GitHub 倉庫 (ya-mic-os)                       │
│  ┌────────────────────────┴────────────────────────────────┐    │
│  │  public/data/                                            │    │
│  │  ├── portfolio.json    ← 59 倉庫元數據 + 評分              │    │
│  │  ├── starred.json      ← 42 Star 元數據                   │    │
│  │  ├── repositories.yaml ← 十大主定位分類（手動維護）        │    │
│  │  ├── scores.yaml       ← AVS/GRS/FinalSPI 評分結果        │    │
│  │  └── tasks.yaml        ← 待辦事項（Human Review 等）      │    │
│  └───────────────────────────────────────────────────────────┘    │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  .github/workflows/autopilot.yml                           │  │
│  │  └─> 定時任務（每 5-7 小時）                                  │  │
│  │      1. 呼叫 GitHub API 抓取最新倉庫/Star 元數據               │  │
│  │      2. 重新計算評分（AVS/GRS/FinalSPI）                     │  │
│  │      3. 寫回 public/data/*.json                             │  │
│  │      4. git commit + push → 觸發 Pages 重新部署              │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
                            │
                            │ GitHub REST API
                            │
┌───────────────────────────┼──────────────────────────────────────┐
│                    GitHub 平台（外部系統）                        │
│  - GET /users/Ya-MiC/repos          ← 59 倉庫清單                 │
│  - GET /users/Ya-MiC/starred        ← 42 Star 清單               │
│  - GET /repos/{owner}/{repo}        ← 單倉庫詳情（含 Topics）     │
└──────────────────────────────────────────────────────────────────┘
```

## 組件說明

| 組件 | 技術棧 | 職責 | 當前狀態 |
|---|---|---|---|
| `index.html` | 純 HTML + Tailwind CSS | 儀表板總覽（統計卡片、快速連結） | ✅ 已部署 |
| `gallery.html` | 純 HTML + Vanilla JS | 卡片牆（59 倉庫 + 42 Star 分頁顯示） | ✅ 已部署（但無分頁） |
| `public/data/*.json` | JSON / YAML | 靜態數據層（autopilot 寫入，前端讀取） | ✅ 已運行 |
| `autopilot.yml` | GitHub Actions + Python | 定時同步腳本（抓取→評分→寫回→部署） | ✅ 已運行（5-7 小時/次） |
| GitHub REST API | HTTPS + PAT 認證 | 數據源（倉庫元數據、Star 清單） | ✅ 已接通 |

## 數據流向（Data Flow）

```
1. GitHub Actions 定時觸發（cron: 每 5-7 小時）
         ↓
2. Python 腳本呼叫 GitHub API（使用 PAT 認證）
         ↓
3. 抓取 59 倉庫 + 42 Star 的元數據（名稱、簡介、語言、star 數、fork 數、Topics、last commit）
         ↓
4. 計算評分（AVS = 質量分, GRS = 風險分, FinalSPI = AVS - GRS）
         ↓
5. 寫入 public/data/portfolio.json / starred.json / scores.yaml
         ↓
6. git add + commit + push → 觸發 Cloudflare Pages / Netlify 重新部署
         ↓
7. 用戶瀏覽器加載 gallery.html → 讀取最新 JSON → 渲染卡片牆
```

## 未來擴展（Notion + Sheets 集成）

```
┌─────────────────────────────────────────────────────────────────┐
│                    Notion API（未來）                            │
│  - 同步 19 項待分類知識庫項目                                     │
│  - 寫入 public/data/notion.json                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    Google Sheets API（未來）                     │
│  - 同步月報彙總數據                                               │
│  - 寫入 public/data/sheets.json                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 安全模型

- **PAT（Personal Access Token）**：存於 GitHub Actions Secrets（`GITHUB_TOKEN`），前端不可見
- **前端只讀**：`gallery.html` 只讀取 `public/data/*.json`，不直接呼叫 GitHub API
- **最小權限原則**：PAT 僅授予 `public_repo` + `read:user` 權限，無寫入權限
