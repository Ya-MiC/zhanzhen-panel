# DEPLOYMENT

## YamiHub 面板（deploy/）
1. CF Pages → 上傳資產 → 拖 deploy/ 文件夾
2. KV 綁定（變量名 KV）+ OAuth 環境變量（README 五步教學）
3. 環境變量示例見 deploy/README.md 表格；**.env / 真實密鑰永不入 Git**

## 工作台（apps/web）
靜態站，`pnpm build` 產物可部署任意靜態托管（未定案——Phase 4 決策項）。

## Cron（YamiFeed 推送）
CF Pages 設置 → 函數 → Cron 觸發器 → `0 8 * * *`（需先配 WXPUSHER_TOKEN/UID）。
