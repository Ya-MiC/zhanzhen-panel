# Changelog

All notable changes. Format: Keep a Changelog.

## [0.2.0] - 2026-09-16
### Added
- YamiHub 發行版 v0.3：登錄首屏（三標籤）/ YamiLive 動態數據 / 本地保險箱（AES-GCM）/ 活體地圖 v2（archify 泳道+導出導入）/ YamiFeed 熱榜（四源+KV緩存）/ WxPusher 每日精選推送
- UI 統一整改 13 項（按 UI-AUDIT.md）：按鈕 4+1 體系、圓角五檔變量、logo 規範、CSS 括號炸彈排除
- 工程化：AGENTS.md 行動規範、DESIGN-LANGUAGE.md 設計憲法、final-check.mjs 終檢體系
### Changed
- 框架主協議 MIT → **GPL-3.0**（LICENSE-NOTES.md 記錄目錄級映射）
- 隱私清剿：倉庫零真實數據（_reference/_private 移出）
### Security
- XSS 注入點清零（esc 13 處 + sanitizeLabel）、限速、CSP、state 綁 sid

## [0.1.0] - 2026-09-13
### Added
- apps/web 湛箴工作台 v0.1 原型（六頁 + 本地保存 + 主題）
- deploy/ YamiHub v0.1（OAuth 三平台 + SPI 評分）
