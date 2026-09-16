# YamiFeed — 熱榜資訊整合模組（架構設計書 v0.1）

> **這份文件是什麼**：YamiHub 新模組「資訊整合」的完整設計：學誰、怎麼自建、開源協議怎麼選、微信公眾號定時推送怎麼做。
> **定位**：與「資產整合」（GitHub/Notion/Google OAuth）並列的第二大能力。資產整合管「你生產的東西」，資訊整合管「你消費的東西」。

---

## 1. 參考項目實地調研（協議已逐一核實，不憑記憶）

| 你給的站點 | 背後的項目 | 協議（已核實） | 能學什麼 | 能不能直接抄代碼 |
| --- | --- | --- | --- | --- |
| newsnow.busiyi.world | [ourongxing/newsnow](https://github.com/ourongxing/newsnow)（21.7k★） | **MIT** | 極簡熱榜聚合 UI、多源數據源適配器模式（40+ 源）、CF Pages 部署形態 | ✅ 可以，MIT 允許，只需保留版權聲明 |
| tophub.today | 今日熱榜（**閉源**，官方付費 API） | 閉源 | 只能學信息架構（分頻道熱榜）；API 需付費授權，不可白嫖 | ❌ 不抄代碼不白嫖 API，學交互形態 |
| top.open2hub.com | 第三方鏡像站，**無公開倉庫** | 無 | 無可學（是 newsnow 類項目的鏡像） | ❌ |
| sopilot.net/zh/hot-tweets | SoPilot（閉源 SaaS） | 閉源 | 學「KOL 熱推」場景：6 小時內 KOL 推文聚合成熱榜 | ❌ 代碼；數據源思路用 RSSHub 合法實現 |

### 額外發現（真正該致謝的基礎設施）

| 項目 | 協議（已核實） | 對 YamiFeed 的價值 |
| --- | --- | --- |
| [DIYgod/RSSHub](https://github.com/DIYgod/RSSHub)（46.2k★） | **AGPL-3.0** | 5000+ 萬能 RSS 路由（微博/知乎/GitHub Trending/推文都可出 RSS）——**YamiFeed 的數據源層首選**。注意：AGPL 有傳染性，見 §3 協議決策 |
| newsnow-mcp-server | 同 newsnow（MIT） | 40+ 源的 MCP 接口，未來 Agent 化可直接接 |

## 2. YamiFeed 架構（v0.1 規劃）

```
數據源層（可插拔適配器）
  ├─ RSSHub 實例（自建或公共）→ 微博/知乎/GitHub Trending/推文榜
  ├─ GitHub Trending（官方 API + trending HTML 解析）
  ├─ newsnow 適配器（MIT，直接復用其 40+ 源適配器代碼，保留版權頭）
  └─ 用戶自定義 RSS/JSON 源
        │
聚合層（CF Pages Functions，Cron Trigger 每 30 分鐘）
  ├─ 拉取 → 去重（URL hash）→ 按源分桶 → 熱度歸一化
  └─ 寫入 KV（yamifeed:*，每源最新 100 條，TTL 24h）
        │
展示層（面板新頁面「資訊 · 熱榜」）
  ├─ 源切換 chips（同資產畫廊交互語言）
  ├─ 卡片流（標題/來源/熱度/時間/外鏈）
  └─ 「人類裁決」按鈕 → 值得留下的打星 → 進「今日精選」
        │
分發層（v0.2）
  ├─ 微信公眾號：每天定時把「今日精選」推送給關注者（見 §4）
  └─ RSS 輸出：YamiFeed 自身也變成一個 RSS 源（萬物皆 RSS）
```

## 3. 開源協議決策：GPL-3.0 的含義與邊界

你要 GPL-3.0 公開框架——**可以，但要清醒知道它意味著什麼**：

| 你用 GPL-3.0 的效果 | 具體含義 |
| --- | --- |
| 誰 fork 誰也必須 GPL-3.0 開源 | 別人拿你的代碼改版分發，衍生作品必須同協議開源（強 Copyleft） |
| 別人可以商用 | GPL 不禁止商業；但改版必須開源 + 保留你的版權 |
| 你的 MIT 部分包不受影響 | deploy 包當前 MIT（資產面板部分），**新加 YamiFeed 模塊聲明 GPL-3.0，同一倉庫多協議分文件標注**（LICENSE-GLP 說明哪些目錄歸哪協議） |
| ⚠ AGPL 邊界（RSSHub） | RSSHub 是 AGPL-3.0：**如果你把 RSSHub 代碼直接複製進你的倉庫**，那部分衍生代碼也必須 AGPL；**如果只是作為獨立服務調用它的 HTTP 接口**（網絡隔離），你的代碼不受傳染。**決策：YamiFeed 只以「調用外部 RSSHub 實例」的方式用，不複製其代碼進倉庫** |
| newsnow（MIT）代碼可入庫 | 復用其源適配器時在文件頭保留 MIT 版權聲明 + 在 THIRD-PARTY-NOTICES 記錄 |

**倉庫協議結構**：
```
LICENSE              → GPL-3.0 全文（框架主協議）
LICENSE-NOTES.md     → 目錄級協議映射：
                       /           GPL-3.0（框架）
                       /vendor/newsnow/  MIT（保留原版權）
                       致謝 RSSHub：AGPL-3.0，僅網絡調用未複製代碼
```

## 4. 微信公眾號每日定時推送（方案對比）

| 方案 | 原理 | 門檻 | 適合度 |
| --- | --- | --- | --- |
| **A. 測試號 → 模板消息**（開發期） | 微信公眾平台測試號 + CF Cron + 模板消息 API | 當天可通，但關注者需主動掃碼關注測試號 | ⭐⭐⭐ 開發驗證期最優 |
| **B. 認證服務號 + 模板消息**（正式） | 註冊認證服務號（企業主體）→ 模板消息每日推送 | 需企業資質認證 | ⭐⭐ 正式商業化用 |
| **C. 訂閱號 + 客服消息48h窗口** | 粉絲 48h 內互動過才可發 | 個人可註冊訂閱號但推送受限 | ⭐ 窗口限制太苛刻 |
| **D. 第三方推送框架**（WxPusher / Server醬 / PushPlus） | 用戶掃碼關注「中轉號」，你調開放 API 推送 | 個人當天可用，免認證，免費額度夠自用 | ⭐⭐⭐⭐ **v0.2 首選**：開源生態裡 WxPusher 免費且支持主動推送 |

**推薦路線**：v0.2 先接 **WxPusher**（開源生態方案，個人免費、HTTP API 一發一收、支持掃碼關注而非加好友）；你自己的公眾號認證下來後切方案 B。定時觸發用 **CF Pages 的 Cron Trigger**（wrangler.toml `[triggers] crons = ["0 8 * * *"]`）每天早 8 點聚合→精選→推送，全程無服務器。

**紅線自查（推送內容合規）**：只推「標題 + 原文鏈接 + 一句摘要」，全文不轉載（版權）；敏感源（微博熱搜等）標註來源；不做標題黨加工。

## 5. 路徑與部署映射（按你的固定格式）

| 本地路徑 | 放到哪裡 | 說明 |
| --- | --- | --- |
| `projects\yami-hub\deploy\`（18 文件） | **GitHub 倉庫根**（GPL-3.0 框架）+ **CF Pages 拖放** | YamiFeed 開發完成後熱榜頁面與 Functions 會加進這個文件夾 |
| `projects\yami-hub\_private\` | ❌ 不上傳 | 你的真實數據 |
| `projects\yami-hub\_tools\` | ❌ 不上傳 | 施工/測試腳本 |

**v0.2 YamiFeed 落地後的文件增量**（預告，到時照此交付）：
- `deploy/assets/yamifeed.js` — 熱榜頁渲染邏輯
- `deploy/public/data/sources.json` — 源配置（用戶可編輯）
- `_worker.js` 增量：`/api/feed/:source` 聚合接口 + Cron Trigger
- `README.md` 增補「資訊整合」章節 + `THIRD-PARTY-NOTICES.md` 增補 newsnow/RSSHub 致謝
- `LICENSE` 換 GPL-3.0 + `LICENSE-NOTES.md` 目錄級映射

## 6. 下一步排期

1. **本輪已完成**：調研 + 協議核實 + 本設計書
2. **v0.2-1**：熱榜頁面（先接 3 個穩定源：GitHub Trending 官方、RSSHub 公共實例的微博/知乎）+ KV 緩存
3. **v0.2-2**：WxPusher 接入（測試號流程打通）+ Cron 每日精選推送
4. **v0.2-3**：LICENSE 切 GPL-3.0 + LICENSE-NOTES + newsnow 適配器代碼入庫（MIT 頭保留）
5. **v0.3**：訂閱號認證後切官方模板消息；RSS 輸出
