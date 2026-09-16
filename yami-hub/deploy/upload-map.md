# UPLOAD-MAP.md — 每次上傳的固定映射圖（永遠照這個來）

> **這份文件的存在意義**：以後每次我（AI）交付或修改產物，都會在回覆裡附上「哪個路徑 → 放到哪裡」的映射表，格式跟這份一致。你不用再問、我不用再解釋。
> 最後更新：2026-09-15 · 對應 deploy 版本：15 文件全綠（final-check.mjs 通過）

---

## 1. 本地路徑 → 目標位置 總映射

| 本地路徑（絕對） | 放到哪裡 | 怎麼放 |
| --- | --- | --- |
| `projects\yami-hub\deploy\`（整個文件夾，15 文件） | **GitHub 倉庫根目錄**（github.com/Ya-MiC/yami-hub 的根） | 網頁端「uploading an existing folder」拖進去，或 git push |
| `projects\yami-hub\deploy\`（同一個文件夾） | **Cloudflare Pages 生產環境**（yami-hub 項目） | Workers 和 Pages → yami-hub → 創建新部署 → 拖入 → 部署站點 |
| `projects\yami-hub\_private\` | ❌ **哪裡都不放**——你的真實數據，永不上傳 | .gitignore 已防呆 |
| `projects\yami-hub\_tools\` | ❌ 不上傳 GitHub（測試腳本屬於開發過程） | .gitignore 已防呆 |
| `projects\yami-hub\TEST-BRIEF.md` | 可選：想讓別人幫測就上傳；不想就留本地 | — |

**記憶口訣**：`deploy` 是萬能鑰匙——CF 拖它、GitHub 傳它，`_` 開頭的是私貨，永遠不出門。

## 2. fork 之後會發生什麼（保證書）

別人 fork 你的倉庫後，**拿到的是一個能獨立工作的完整項目**，因為：

| fork 者需要 | 在倉庫裡的位置 | 狀態 |
| --- | --- | --- |
| 安裝教學（五步 + 三家 OAuth 逐字段） | `/README.md` | ✅ 已內置 |
| 開發者文檔（架構/數據契約/修改指南） | `/DEVELOPER.md` | ✅ 已內置 |
| 部署平台選擇指南（一鍵按鈕 vs 拖放 + 身份服務選型） | `/PLATFORM-GUIDE.md` | ✅ 已內置 |
| 開源致謝（MIT 合規） | `/THIRD-PARTY-NOTICES.md` + `/LICENSE` | ✅ 已內置 |
| 全部代碼（面板 + 後端 + 引擎 + 安全頭） | `/index.html`、`/_worker.js`、`/_headers`、`/assets/` | ✅ 已內置 |
| demo 數據（未登錄時的面板展示） | `/public/data/` | ✅ 已內置（虛構 demo-user，無真人數據） |

fork 者在你倉庫裡看不到的：你的真實數據（在瀏覽器本地加密 + 你的 KV）、你的 6 個密鑰（在 CF 環境變量裡）、`_private/`（.gitignore 排除）。**代碼給全世界，數據零洩漏。**

## 3. fork 者的部署路徑（他們看到的視角）

1. **路 A（推薦）**：README 頂部的 Deploy to Cloudflare 按鈕 → 授權 CF 連 GitHub → 嚮導裡配 6 個環境變量 + 建 KV 綁定 → 部署
2. **路 B**：下載倉庫 zip → 解壓 → CF Pages「上傳資產」拖 `deploy` 文件夾 → 按 README 第 2-5 步綁 KV / 申請三家 OAuth / 填密鑰 / 重拖一次
3. 任何一步卡住 → README「出錯速查」表有 11 種故障的對症解法

## 4. 你的動作（照抄即可）

```
GitHub（一次性）：
  1. github.com/new → 倉庫名 yami-hub → Public → 建空倉庫
  2. 上傳文件 → 把 C:\Users\cao41\.openclaw-autoclaw\workspace\projects\yami-hub\deploy\ 裡的 15 個文件拖進去
  3. About 簡介粘 PLATFORM-GUIDE.md §3.1 那行字
  4. Topics 粘 §3.2 標籤
  5. （可選）README 頂部加 §3.3 的徽章塊，Deploy 按鈕鏈接裡換成真實倉庫地址

Cloudflare（每次更新都一樣）：
  Workers 和 Pages → yami-hub → 創建新部署 → 拖 deploy 文件夾 → 部署站點
```

## 5. 以後怎麼跟我要更新

直接說需求（如「任務頁做成看板」），我改完會：
1. 跑 `_tools/final-check.mjs` 全綠
2. 回覆裡附當輪的**映射表**（改了哪些文件、各自放到 GitHub/CF 哪裡、是否需要重新部署）
3. 毀滅性變更（改環境變量名/路由/KV 鍵結構）會單獨紅字警告——你的 6 個密鑰不會失效
