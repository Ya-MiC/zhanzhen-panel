# LICENSE-NOTES.md — 目錄級許可證映射與第三方合規聲明

> **效力**：本倉庫採用**多協議分區**管理。任何貢獻者/fork 者改動前必讀。
> 原則：尊重所有上游開源協議；AGPL 代碼零入庫；閉源產品零代碼零逆向。

---

## 1. 許可證映射

| 目錄 / 範圍 | 許可證 | 說明 |
| --- | --- | --- |
| 倉庫根（默認） | **GPL-3.0** | 框架主協議：YamiHub 面板、_worker.js、YamiFeed 聚合器、資產地圖引擎 |
| `deploy/vendor/newsnow/`（若未來引入） | **MIT**（上游 ourongxing/newsnow） | 復用其源適配器時，每個文件頭保留原版權聲明；此目錄內代碼保持 MIT，**不被 GPL 同化**（MIT 兼容可再授權） |
| `apps/`、`packages/`、`docs/` | MIT（隨根 LICENSE-NOTES 聲明） | 湛箴工作台骨架，正式發布前復核 |

**GPL-3.0 對你的實際含義**（人話版）：
- fork/修改/分發 → 衍生作品必須同樣 GPL-3.0 開源
- 可以商用、可以賣錢，但源碼必須隨附
- 必須保留原始版權與許可聲明
- 不提供任何擔保（Warranty disclaimer）

## 2. 第三方數據源合規邊界

| 上游 | 協議（已核實） | 本倉庫的使用方式 | 合規狀態 |
| --- | --- | --- | --- |
| [ourongxing/newsnow](https://github.com/ourongxing/newsnow)（21.7k★） | MIT | 架構參考；適配器代碼可入 `vendor/newsnow/`（保留 MIT 頭） | ✅ |
| [DIYgod/RSSHub](https://github.com/DIYgod/RSSHub)（46.2k★） | **AGPL-3.0** | **僅 HTTP 網絡調用**公共/自建實例（`/weibo/search/hot` 等路由）；**零代碼複製**——AGPL 傳染性因此被網絡邊界隔離 | ✅（網絡隔離模式） |
| tophub.today | 閉源 + 付費 API | 只借鑒信息架構；不調用其 API、不逆向 | ✅ |
| SoPilot (sopilot.net) | 閉源 SaaS | 只借鑒「KOL 熱推」場景概念 | ✅ |
| Hacker News 官方 Firebase API | 公開接口 | 直接調用 | ✅ |
| GitHub Search API | 官方 API（ToS 允許） | Trending 近似（近 7 天星數排序） | ✅ |

**AGPL 邊界紅線**：任何時候不得把 RSSHub 的路由代碼/源碼片段複製進本倉庫。需要新源 → 優先：① RSSHub 已有路由 → 調 HTTP；② 沒有 → 自己寫適配器（原創代碼歸 GPL）。

## 3. 內容版權紅線（推送/展示合規）

- 熱榜只緩存**元數據**：標題、鏈接、熱度數值、一句話描述（≤120 字符）——不存正文全文
- 微信推送只發「標題 + 原文鏈接」，不轉載全文
- 所有條目標訊來源（微博/知乎/HN/GitHub）
- 不對標題做歪曲性改寫（可截斷不可改義）

## 4. 致謝名單（思想與基礎設施）

- **前置版本**（Ya-MiC 自有，MIT）— 面板設計血統與 SPI 評分體系
- **archify**（tt-a1i，MIT）— 資產地圖設計系統（暗色語色板/泳道佈局/導出契約）
- **dashi-taskboard**（chuspeeism，Apache-2.0）— 看板狀態流思想
- **ourongxing/newsnow**（MIT）— 熱榜聚合架構與多源適配器模式
- **DIYgod/RSSHub**（AGPL-3.0，網絡調用）— 萬物皆 RSS 的數據源基礎設施
- **WxPusher** — 微信推送通道（免費公共服務）
- **OAuth 2.0 標準族**（IETF RFC 6749/7636/6750）+ **GitHub/Notion/Google/Cloudflare 官方文檔**

## 5. 協議變更記錄

| 日期 | 變更 |
| --- | --- |
| 2026-09-15 | deploy/ 發行版以 MIT 發布 |
| 2026-09-16 | 框架主協議切換 **GPL-3.0**（用戶決策：熱榜/聚合框架強 Copyleft）；deploy/ 資產面板部分隨倉庫根切換；MIT 歷史版本見 git（commit ≤ 7badbb54） |
