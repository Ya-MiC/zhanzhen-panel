# 🐙 Ya-MiC Portfolio OS

> **GitHub 資產治理作業系統 · 59 個倉庫的單一真相源**
> Skill 3.0 · RUN-2026-08-28-001 · 部署於 GitHub Pages

把 59 個 GitHub 倉庫、forks 變成「可理解、可評估、可決策、可治理、可複利」的資產組合。
不是 repository 列表，是一套有評分、有閘門、有 DDL 的治理系統。

## 🚀 入口

| 頁面 | 用途 |
|---|---|
| [index.html](index.html) | 總覽：KPI、五大分區、Top 5 FinalSPI、生命週期、任務 DDL |
| [gallery.html](gallery.html) | 資產畫廊：59 張資產卡，可搜尋、可篩選 |
| [guide.html](guide.html) | 明確的規則：評分公式、決策區間、G1–G5 閘門 |
| [start.html](start.html) | 5 分鐘快速開始 |
| [Issues · human-review](https://github.com/Ya-MiC/ya-mic-os/issues?q=label%3Ahuman-review) | 15 個待裁決倉庫（30 秒一題） |
| 🔒 私有視圖 | 同一頁面，輸入口令解鎖 14 個私有倉庫完整資料 |

## 📊 當前狀態（RUN-2026-08-28-001）

| 指標 | 數值 |
|---|---:|
| 總倉庫 | **59**（公開 45 · 私有 14） |
| Fork | **24** |
| Human Review | **15**（安全預設 = E） |

**Top 5 FinalSPI**：action-tree（私有）55.95 · hermes 55.95 · ya-mic-os 55.95 · dsh 55.15 · ya-mic-agent-skills 55.15

## 🗂 面板文檔（docs/）

1. [portfolio-overview.md](docs/portfolio-overview.md) — 總覽 + 帳號能力矩陣 + 商業資產板
2. [environment-matrix.md](docs/environment-matrix.md) — 跨平台環境矩陣
3. [repository-catalog.md](docs/repository-catalog.md) — 59 張標準資產卡
4. [fork-and-starred-watchlist.md](docs/fork-and-starred-watchlist.md) — Fork 與 Starred 治理
5. [human-review-queue.md](docs/human-review-queue.md) — 待人類回答的最少問題集
6. [governance-decision-charter.md](docs/governance-decision-charter.md) — 治理決策章程
7. [decision-log.md](docs/decision-log.md) — 決策紀錄
8. [skill-snapshot.md](docs/skill-snapshot.md) — 評分公式速查

## 🔒 公開 / 私有雙門

- **公開版**：`data/portfolio.json`（14 個私有倉庫的 description / license / topics 已遮罩）
- **私有版**：`data/private.enc`（AES-256-GCM 加密，PBKDF2-SHA256 250k）
  同一張頁面：不輸入密碼 = 公開遮罩版；輸入口令 = 瀏覽器本地解密載入私有資料。
  口令不存儲在任何伺服器；輪換方式見 `tools/`。

## 📐 評分模型（速查）

```
AVS = 0.14C + 0.14P + 0.14L + 0.12S + 0.10R + 0.10M + 0.10D + 0.08Q + 0.08E
GRS = 0.40T + 0.35U + 0.25(10 − E)
SPI = 10·AVS − 5·GRS      FinalSPI = max(0, SPI − ForkPenalty)
```

≥60 核心投資 · 40–59 選擇性投資 · 20–39 保留型 · <20 封存候選 · **U≥6 強制 HUMAN-REVIEW**

## 🧭 治理原則（不可違反）

Understand before organize · Evidence before conclusion · **Preserve before deleting** ·
Human approval before consequential action · One responsibility, one canonical home

## 🚧 待辦

- [ ] 15 個 Human Review 裁決（DDL 2026-09-05，逾期安全預設 E）
- [ ] 建立每週自動同步（GitHub + Notion + Sheets，DDL 2026-09-01）
- [ ] RUN-2026-09-01-001：首次月報 + Notion 待分類 19 項確認
- [ ] 私有口令輪換工具腳本

---
*資料來源僅 GitHub API / oomol open-connector MCP 只讀盤點；本倉庫不存儲任何 token / credential。*
