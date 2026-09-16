# ARCHITECTURE

> 湛箴面板雙產品線架構。更新規則：架構變更必須同步本文件（AGENTS.md 鐵律）。

## 雙產品線

```
zhanzhen-panel/
├── apps/web        【湛箴工作台】Vue 3 + Vite + TS，本地優先文件工作台
│   └── App.vue（25KB，Phase 2 拆分中 → features/ + composables/ + services/）
├── deploy/         【YamiHub 發行版】原生 HTML+JS，CF Pages 自部署資產面板（獨立體系）
└── packages/       共享類型（ai/analysis-task, writing-profile）
```

## apps/web 數據流

```
用戶操作 → ref/computed 狀態 → persistXxx() → localStorage（四鍵，各帶 -v1 版本後綴）
  zhanzhen-panel-files-v1 / tasks-v1 / theme-v1 / chat-v1
啟動 → restoreLocalData() → try/catch 解析（失敗不覆蓋、Toast 提示）
```

## deploy/ 數據流（獨立）

```
瀏覽器 → /api/* → _worker.js（OAuth/同步/熱榜） → 部署者 KV
面板狀態 → YamiVault（AES-GCM 本地加密）
```

詳細契約見 deploy/DEVELOPER.md。
