# DEVELOPMENT

## 環境要求
Node ≥ 20.18 · pnpm ≥ 9 · （桌面打包另需 Rust + VS Build Tools，見 deploy/TAURI-GUIDE.md）

## 常用命令
```powershell
pnpm install            # 安裝全部 workspace
pnpm dev                # 工作台開發服務器（apps/web）
pnpm build              # 構建（含 vue-tsc typecheck）
pnpm typecheck          # 僅類型檢查
pnpm lint               # ESLint
pnpm test               # vitest
```

## deploy/（獨立，無構建）
拖 `deploy/` 到 CF Pages 即部署；本地模擬：`npx wrangler pages dev deploy --port 8788 --binding KV=kvtest`

## 開發規範
UI 改動前必讀 deploy/DESIGN-LANGUAGE.md；接手必讀 AGENTS.md。
