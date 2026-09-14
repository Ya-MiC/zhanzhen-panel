# Ya-MiC 總控作業系統 — 同步流程 (Sync Workflow)

## autopilot 定時任務流程圖

```
┌─────────────────────────────────────────────────────────────────┐
│  GitHub Actions 定時觸發（cron: 0 */6 * * * → 每 6 小時）           │
│  文件：.github/workflows/autopilot.yml                          │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 1:  Checkout 倉庫代碼                                      │
│  - uses: actions/checkout@v4                                    │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 2:  設置 Python 環境                                        │
│  - uses: actions/setup-python@v5                                 │
│  - 安裝依賴：requests, pyyaml                                   │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 3:  執行同步腳本（scripts/sync.py）                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  3.1 呼叫 GitHub API                                       │  │
│  │      GET /users/Ya-MiC/repos?per_page=100                 │  │
│  │      GET /users/Ya-MiC/starred?per_page=100               │  │
│  │      → 獲取 59 倉庫 + 42 Star 的完整清單                        │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  3.2 逐個抓取詳情                                          │  │
│  │      GET /repos/{owner}/{repo}                            │  │
│  │      → 獲取 description, language, topics, stargazers...  │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  3.3 計算評分                                              │  │
│  │      AVS = f(stars, forks, recency, has_description...)   │  │
│  │      GRS = f(is_fork, has_license, has_readme...)         │  │
│  │      FinalSPI = AVS - GRS                                 │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  3.4 寫入 JSON 文件                                         │  │
│  │      public/data/portfolio.json  ← 59 倉庫                   │  │
│  │      public/data/starred.json    ← 42 Star                │  │
│  │      public/data/scores.yaml     ← 評分明細                 │  │
│  └───────────────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 4:  提交改動                                               │
│  - git config user.name "autopilot[bot]"                        │
│  - git config user.email "autopilot@github.com"                 │
│  - git add public/data/*.json public/data/*.yaml                │
│  - git commit -m "chore(data): autopilot sync — metadata + dynamic rescore [skip ci]" |
│  - git push                                                     │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 5:  觸發重新部署                                           │
│  - Cloudflare Pages / Netlify 偵測到 main 分支 push              │
│  - 自動重新構建靜態網站                                          │
│  - 新版本的 index.html / gallery.html 上線                        │
└─────────────────────────────────────────────────────────────────┘
```

## 同步腳本偽代碼（scripts/sync.py）

```python
import requests
import json
from datetime import datetime

GITHUB_TOKEN = os.environ["GITHUB_TOKEN"]
HEADERS = {"Authorization": f"Bearer {GITHUB_TOKEN}"}

def fetch_repos():
    """抓取所有自有倉庫"""
    repos = []
    page = 1
    while True:
        resp = requests.get(
            "https://api.github.com/users/Ya-MiC/repos",
            headers=HEADERS,
            params={"per_page": 100, "page": page}
        )
        data = resp.json()
        if not data:
            break
        repos.extend(data)
        page += 1
    return repos

def fetch_starred():
    """抓取所有 Star"""
    starred = []
    page = 1
    while True:
        resp = requests.get(
            "https://api.github.com/users/Ya-MiC/starred",
            headers=HEADERS,
            params={"per_page": 100, "page": page}
        )
        data = resp.json()
        if not data:
            break
        starred.extend(data)
        page += 1
    return starred

def calculate_avs(repo):
    """計算 AVS 質量分"""
    stars = repo["stargazers_count"]
    forks = repo["forks_count"]
    has_desc = 1 if repo["description"] else 0
    topics_count = len(repo.get("topics", []))
    # ... 完整公式見 03-data-model.md
    return avs_score

def calculate_grs(repo):
    """計算 GRS 風險分"""
    is_fork = 1 if repo["fork"] else 0
    has_license = 0 if not repo["license"] else 1
    # ... 完整公式見 03-data-model.md
    return grs_score

def main():
    repos = fetch_repos()
    starred = fetch_starred()
    
    portfolio = []
    for repo in repos:
        avs = calculate_avs(repo)
        grs = calculate_grs(repo)
        final_spi = avs - grs
        portfolio.append({
            "id": repo["id"],
            "name": repo["name"],
            "description": repo["description"],
            "language": repo["language"],
            "stargazers_count": repo["stargazers_count"],
            "forks_count": repo["forks_count"],
            "topics": repo.get("topics", []),
            "updated_at": repo["updated_at"],
            "html_url": repo["html_url"],
            "avs_score": avs,
            "grs_score": grs,
            "final_spi": final_spi,
        })
    
    # 寫入 JSON
    with open("public/data/portfolio.json", "w", encoding="utf-8") as f:
        json.dump({
            "updated": datetime.now().strftime("%Y-%m-%d"),
            "count": len(portfolio),
            "repositories": portfolio
        }, f, ensure_ascii=False, indent=2)
    
    # 同樣邏輯處理 starred...

if __name__ == "__main__":
    main()
```

## 同步頻率與延遲

| 階段 | 頻率 | 延遲 |
|---|---|---|
| GitHub Actions 定時觸發 | 每 6 小時（cron: 0 */6 * * *） | 0 |
| API 抓取 + 評分計算 | 每次觸發 | ~2-3 分鐘 |
| git commit + push | 每次觸發 | ~30 秒 |
| Cloudflare Pages 重新部署 | 每次 push | ~1-2 分鐘 |
| **端到端延遲** | — | **~5-7 小時** |

## 錯誤處理

- **API 限流**：GitHub API 每小時 5000 次請求（PAT 認證），同步腳本每次運行約 60-70 次請求（59 倉庫 + 42 Star），遠低於限流
- **網路超時**：requests.get 設置 timeout=30，失敗重試 3 次
- **JSON 寫入失敗**：原子寫入（先寫 .tmp 再 rename），避免半寫狀態

## 監控與告警

- **GitHub Actions 日誌**：每次運行紀錄在 `.github/workflows/` 頁面
- **最後同步時間**：`portfolio.json` 的 `updated` 字段，前端可顯示
- **失敗告警**：未來可集成 GitHub Issues 自動創建 bug report
