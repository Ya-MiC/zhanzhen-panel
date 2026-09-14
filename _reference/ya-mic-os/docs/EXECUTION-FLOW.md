# ⚙️ 執行流程總表（EXECUTION FLOW）

> 誰做什麼、在哪裡發生、你只需要做什麼 —— 一頁說清。
> 版本：v4.0 · DEC-20260830-003/004 延伸

## 四個角色的分工

| 角色 | 在哪裡跑 | 職責 | 觸發 |
|---|---|---|---|
| **auto-sync** | GitHub Actions 伺服器 | 自動發現新倉庫/新星標 → 安全入板（自動開裁決 Issue）→ 刷新元數據 → 動態重算評分 → 自動提交 | 每 6 小時 + 手動 |
| **gov-sync** | GitHub Actions 伺服器 | 讀取你在 Human Review Issue 留的 A–E 字母 → 寫入面板數據 → 清 NEW 標記 | 你評論/關閉 Issue 即時觸發 |
| **deploy-pages** | GitHub Actions 伺服器 | 脫敏檢查 → 把 main 分支發布到 https://ya-mic.github.io/ya-mic-os/ | main 每次更新即時觸發 |
| **儀表盤（本站）** | 你的瀏覽器 | 渲染全部面板；私有資料本地解密；v4.0 權重實驗室本地即時重算 | 你打開網頁 |

## 完整數據流

```text
GitHub 賬號實況（倉庫/星標/推送）
   ↓ 每 6 小時 auto-sync（發現新倉 → 入板 + 開 Issue；重算分數）
data/portfolio.json · data/starred.json  ←—— 唯一數據真相源
   ↓ 你在 Issue 留字母 → gov-sync 即時回收
   ↓ main 更新 → deploy-pages 即時發布
儀表盤渲染（權重實驗室按你的設定本地再計算）
```

## Pages / Issues / Actions 各自回答什麼

- **Pages**（網站）：「現在的資產全貌長什麼樣」——看板、地圖、排序、私有視圖。
- **Issues**（裁決）：「哪些事需要你拍板」——每張裁決單留一個字母即可，機器人自動回收。
- **Actions**（引擎）：「一切自動運轉的車間」——同步、回收、部署三條流水線的運行日誌都在這裡可查。

## 你（人類）只出場的兩種時刻

1. **裁決**：新倉庫/不明資產出現 → 手機打開 Issue → 留一個字母（A/B/C/D/E）。
2. **方向**：想改分類、權重、面板 → 對 ZCode 說，或直接在 GitHub 上提 Issue。

> 其餘一切——發現、入板、評分、部署——全自動。

## 本地開發（可選）

`E:\Oobsidian\ya-mic-os` 是倉庫的本地克隆：改文件 → `git push` → 一分鐘後上線。與遠端一榮俱榮。
