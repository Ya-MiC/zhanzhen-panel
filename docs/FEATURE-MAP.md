# FEATURE-MAP

## apps/web（湛箴工作台 v0.1）

| 功能 | 狀態 | 實現位置 | 數據 |
| --- | --- | --- | --- |
| 左側導航（6頁） | ✅ 真實 | App.vue pages[] | currentPage ref |
| 首頁儀表板 | ✅ 真實 | home section | files/tasks |
| 文件本地保存（MD/TXT） | ✅ 真實 | files section | localStorage files-v1 |
| 匯入 MD/TXT | ✅ 真實 | importTextFile() | FileReader |
| 讀書分析 | ⚠ 靜態原型 | reading section | 無 AI 接入（已標示） |
| 流程圖 | ⚠ 靜態原型 | graphs section | 無 |
| 思路画像 | ⚠ 靜態原型 | profile section | 無 |
| 寫作工坊 | ⚠ 大綱保存真實、生成 mock | writing section | tasks-v1 |
| 右側 AI 助手 | ⚠ 回聲 mock（已標示） | assistant panel | chat-v1 |
| 主題切換 | ✅ 真實（淡粉/深色） | toggleTheme() | theme-v1 |

## deploy/（YamiHub 發行版）

見 deploy/DEVELOPER.md 功能表（登錄首屏/資產整合/地圖/YamiFeed 熱榜/推送）。
