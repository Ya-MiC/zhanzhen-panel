# DATA-MODEL

## apps/web localStorage 契約（全部帶版本後綴）

```ts
// files: zhanzhen-panel-files-v1
type LocalFile = { id: string; name: string; extension: "md"|"txt"; content: string; importedAt: string; wordCount: number }[]

// tasks: zhanzhen-panel-tasks-v1  → string[]（寫作任務文本）
// chat:  zhanzhen-panel-chat-v1   → { id; role: "assistant"|"user"; content }[]
// theme: zhanzhen-panel-theme-v1  → "dark" | "light"
```

**規則**（任務書 §2.9）：舊數據解析失敗 → 不靜默覆蓋，Toast 提示 + 保留原文於 console；未來 schema 變更走 `version` 字段 + migration 函式 + 測試。

## deploy/ 數據

portfolio.json 契約見 deploy/DEVELOPER.md §3；KV 鍵見 deploy/README.md 安全節。
