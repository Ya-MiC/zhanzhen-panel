# Ya-MiC 總控作業系統 — 數據模型 (Data Model)

## 核心實體關係圖（ERD）

```
┌─────────────────────────────────────────────────────────────────┐
│                         Repository（倉庫）                       │
├─────────────────────────────────────────────────────────────────┤
│  id: string (GitHub repo_id)                                    │
│  name: string                                                   │
│  full_name: string (owner/repo)                                 │
│  description: string (GitHub About 欄位)                         │
│  language: string (主要編程語言)                                 │
│  stargazers_count: number                                       │
│  forks_count: number                                            │
│  topics: string[] (GitHub Topics 標籤)                           │
│  updated_at: datetime (最後更新時間)                             │
│  html_url: string (GitHub 連結)                                  │
│                                                                 │
│  ← 關聯字段（衍生計算）                                          │
│  primary_position: enum (十大主定位之一)                         │
│  avs_score: number (資產質量分 0-100)                            │
│  grs_score: number (治理風險分 0-100)                            │
│  final_spi: number (AVS - GRS)                                  │
│  decision: enum (G1-G5 決策閘門結果)                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 1:N
                              │
┌─────────────────────────────────────────────────────────────────┐
│                         Star（星標項目）                         │
├─────────────────────────────────────────────────────────────────┤
│  id: string (GitHub repo_id)                                    │
│  name: string                                                   │
│  full_name: string (owner/repo)                                 │
│  description: string                                            │
│  language: string                                               │
│  stargazers_count: number                                       │
│  starred_at: datetime (用戶 star 的時間)                         │
│  html_url: string                                               │
│                                                                 │
│  ← 關聯字段（衍生計算）                                          │
│  study_flag: boolean (STUDY 標記)                                │
│  adopt_candidate_flag: boolean (ADOPT 候選標記)                  │
└─────────────────────────────────────────────────────────────────┘
```

## 十大主定位分類（Primary Position）

來自 `docs/repository-catalog.md` 的官方分類：

| 枚舉值 | 中文名稱 | 代表倉庫舉例 | 判定標準 |
|---|---|---|---|
| `AI-AGENT` | AI 智能體 | action-tree, hermes, ya-mic-os, dsh | 核心邏輯是 AI Agent / 提示詞工程 / 技能插件 |
| `PLUGIN-SDK-TEMPLATE` | 插件/SDK/模板 | argo, dsh-stock-watch, archify, open-design | 可複用的框架、模板、SDK |
| `DEVICE-SYSTEM-SETUP` | 設備/系統設置 | GL.iNet-OpenWrt-DNS, CF-Workers-SUB, winutil | 硬體配置、系統優化、網路設置 |
| `QUANT-FINANCE` | 量化金融 | awesome-systematic-trading, nautilus_trader | 交易策略、回測框架、量化研究 |
| `AUTOMATION` | 自動化 | basedblocks-keepalive, invoice-ocr-system, docformat-gui | 自動化腳本、OCR、文檔處理 |
| `DATA-RESEARCH` | 數據研究 | yanming-global-intelligence-system, nie-grassroots-logic | 數據收集、分析、研究筆記 |
| `WEBSITE-CONTENT` | 網站內容 | Ya-MiC 主頁，tv, awesome-dsh-plugin | 個人網站、內容策展 |
| `RECORD-HANDOVER` | 記錄/移交 | zhanzhen-handover, hermes-private, yanming | 交接文檔、私人記錄 |
| `PRODUCT-SAAS` | 產品/SaaS | zhanzhen 系列，audit-os 系列 | 面向用戶的產品、SaaS 服務 |
| `HUMAN-REVIEW` | 待人工審核 | 無簡介/無 Topics/ fork 但用途不明的倉庫 | 需要人工裁決的分類 |

## 評分公式（來自 fork-and-starred-watchlist.md）

### AVS（Asset Value Score）資產質量分

```
AVS = (stargazers_count / 100) * 20  +  
      (forks_count / 50) * 20  +  
      (days_since_last_commit < 90 ? 30 : 10)  +  
      (has_description ? 15 : 0)  +  
      (topics.length > 3 ? 15 : 0)

最大值 = 100
```

### GRS（Governance Risk Score）治理風險分

```
GRS = (is_fork ? 10 : 0)  +  
      (has_no_license ? 20 : 0)  +  
      (has_no_readme ? 20 : 0)  +  
      (days_since_last_commit > 365 ? 30 : 0)  +  
      (open_issues_count > 10 ? 20 : 0)

最大值 = 100
```

### FinalSPI（最終評分）

```
FinalSPI = AVS - GRS

評級：
- A 級 (FinalSPI >= 60): 綠色卡片
- B 級 (40 <= FinalSPI < 60): 藍色卡片
- C 級 (20 <= FinalSPI < 40): 黃色卡片
- D 級 (0 <= FinalSPI < 20): 橙色卡片
- E 級 (FinalSPI < 0): 紅色卡片（建議封存/刪除）
```

## 決策閘門（G1-G5）

| 閘門 | 條件 | 決策 |
|---|---|---|
| G1 | FinalSPI >= 60 AND is_core_asset | 保留 + 優先展示 |
| G2 | FinalSPI >= 40 AND FinalSPI < 60 | 保留 + 正常展示 |
| G3 | FinalSPI >= 20 AND FinalSPI < 40 | 保留 + 低優先展示 |
| G4 | FinalSPI >= 0 AND FinalSPI < 20 | 觀察 + 待改進 |
| G5 | FinalSPI < 0 OR is_fork_with_no_upstream | 封存/刪除 |

## JSON Schema 範例（portfolio.json）

```json
{
  "updated": "2026-09-05",
  "count": 59,
  "repositories": [
    {
      "id": 1347557663,
      "name": "ya-mic-os",
      "full_name": "Ya-MiC/ya-mic-os",
      "description": "Ya-MiC 總控作業系統：59+ 倉庫資產治理面板 · 動態評分 · 裁決自動化 · 可視化地圖（Skill 3.0）",
      "language": "HTML",
      "stargazers_count": 0,
      "forks_count": 0,
      "topics": ["domain-ai-agent", "env-cloudflare", "role-core-asset", "stage-active"],
      "updated_at": "2026-09-05T03:48:01Z",
      "html_url": "https://github.com/Ya-MiC/ya-mic-os",
      "primary_position": "AI-AGENT",
      "avs_score": 45,
      "grs_score": 20,
      "final_spi": 25,
      "decision": "G3"
    }
  ]
}
```

## 文件映射關係

| 物理文件 | 邏輯實體 | 更新頻率 | 維護方式 |
|---|---|---|---|
| `public/data/portfolio.json` | 59 倉庫元數據 + 評分 | 每 5-7 小時 | autopilot 自動 |
| `public/data/starred.json` | 42 Star 元數據 | 每 5-7 小時 | autopilot 自動 |
| `docs/repository-catalog.md` | 十大主定位分類（人工審閱版） | 不定期 | 手動維護 |
| `docs/fork-and-starred-watchlist.md` | STUDY/ADOPT 標記 + FinalSPI | 不定期 | 手動維護 |
| `workflow/03-data-model.md` | 本文件（數據模型規格書） | 本文件 | 本文件 |
