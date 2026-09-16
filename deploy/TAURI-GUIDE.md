# TAURI-GUIDE.md — 把 YamiHub 面板封裝成桌面 EXE + GitHub Releases 分發

> 給你（項目作者）的封裝路線圖。面板本身是純靜態 + 一個 Worker，Tauri 封裝後變成**雙擊即用的桌面 App**（像 v2rayN 那樣從 Releases 下載）。
> 本指南按「你什麼都不用懂，跟著做」的標準寫。

---

## 1. 為什麼 Tauri？（而不是 Electron）

| 維度 | Tauri | Electron |
| --- | --- | --- |
| 安裝包體積 | **~5-10 MB** | ~80-150 MB |
| 內存佔用 | WebView2（系統自帶） | 捆綁整個 Chromium |
| 你的棧 | Rust 後端 + 任意前端 | Node 前後端 |
| 對面板的意義 | 完美——面板已是靜態 HTML，Tauri 直接加載 | 殺雞用牛刀 |

面板零依賴（無 npm build），Tauri 封裝是「把 HTML 塞進原生窗口 + 給它一個本地 sidecar 服務」。

## 2. 你的面板在 Tauri 裡的架構變化（重要概念）

瀏覽器版：`index.html + _worker.js`（OAuth 由 CF Pages Functions 處理）

桌面版：Tauri 內嵌 WebView 加載 `index.html`，**_worker.js 不能用了**（沒有 CF 環境）。兩條路：

| 路線 | 做法 | OAuth 處理 | 適合 |
| --- | --- | --- | --- |
| **A. 混合模式（推薦首版）** | Tauri WebView 直接加載**你的線上面板**（kv-9di.pages.dev） | 雲端不變（Worker 照跑） | 快，一天內出 EXE；體驗 = 桌面壳 + 雲數據 |
| **B. 純本地模式（v2）** | Rust sidecar 起本地 HTTP 服務替代 Worker，KV 換 SQLite | 本地完成 OAuth 回環（127.0.0.1 回調） | 離線可用，工作量大 |

**決策：先走 A**——Tauri 壳 + 線上面板 + 深度系統集成（開機自啟/系統托盤/原生通知）。v2 再做 B。

## 3. 你要做的準備（一次性，10 分鐘）

1. **裝 Rust**：https://rustup.rs 下載 rustup-init.exe 一路下一步
2. **裝 VS Build Tools**：https://visualstudio.microsoft.com/visual-cpp-build-tools/ 勾「使用 C++ 的桌面開發」（Rust 在 Windows 編譯必需）
3. **裝 Node 18+**（你已有）
4. 驗證：PowerShell 跑 `cargo --version` 和 `node --version` 都出版本號即 OK

## 4. 封裝步驟（A 路線，30 分鐘）

```powershell
# 1. 建項目（在你喜歡的工作目錄，不放進 deploy/）
cd C:\Users\cao41\projects
npm create tauri-app@latest
#   項目名：zhanzhen-panel
#   包名：zhanzhen-panel
#   前端方言：Vanilla（不用框架——我們的殼不加東西）
#   TypeScript：No

# 2. 進項目改兩個文件（見下方 §5）

# 3. 開發預覽
cd zhanzhen-panel
npm install
npm run tauri dev     # 會打開一個桌面窗口，加載的就是線上面板

# 4. 打包
npm run tauri build   # 產出：
#   src-tauri/target/release/bundle/msi/ZHANZHEN_PANEL_0.1.0_x64_zh-CN.msi
#   src-tauri/target/release/bundle/nsis/ZhanZhen Panel_0.1.0_x64-setup.exe
```

## 5. 兩個關鍵文件（模板直接抄）

### `src-tauri/tauri.conf.json`（核心配置）

```json
{
  "productName": "ZhanZhen Panel",
  "version": "0.1.0",
  "identifier": "com.yamic.zhanzhen-panel",
  "build": {
    "frontendDist": "https://kv-9di.pages.dev"
  },
  "app": {
    "windows": [
      {
        "title": "湛箴面板",
        "width": 1280,
        "height": 832,
        "minWidth": 900,
        "minHeight": 640,
        "center": true
      }
    ],
    "security": {
      "csp": null
    }
  },
  "bundle": {
    "active": true,
    "targets": ["nsis", "msi"],
    "icon": ["icons/icon.ico"]
  }
}
```

### `src-tauri/icons/`（圖標）

把你面板的章魚 logo 轉成 ICO：
- 用 https://icoconvert.com 上傳 logo.jpg → 導出 256px .ico
- 命名 `icon.ico` 放進 `src-tauri/icons/`（替換默認）

## 6. GitHub Releases 分發（v2rayN 模式）

打包完成後，把安裝包發佈到倉庫的 Releases 頁——**用戶直接下載雙擊安裝**：

```powershell
# 用 gh CLI 一條命令（gh 已登入你的賬號）
gh release create v0.1.0 ^
  "src-tauri/target/release/bundle/nsis/*-setup.exe" ^
  "src-tauri/target/release/bundle/msi/*.msi" ^
  --repo Ya-MiC/zhanzhen-panel ^
  --title "湛箴面板 v0.1.0" ^
  --notes "首個桌面版：雙擊安裝，加載 YamiHub 雲面板。
- Windows 10/11 x64
- 安裝包 ~8MB
- 數據與雲端實例同步"
```

發佈後倉庫右側出現 **Releases** 區塊，用戶看到和 v2rayN 一樣的下載頁。

## 7. 多平台分發（後續）

| 平台 | 產物 | 怎麼出 |
| --- | --- | --- |
| Windows | .exe (NSIS) / .msi | 你本機 `tauri build` |
| macOS | .dmg | 需要 Mac（或 GitHub Actions 的 macos runner） |
| Linux | .AppImage / .deb | GitHub Actions ubuntu runner |

**進階（v2）**：GitHub Actions 自動構建三平台（用戶 push tag → 自動出全套安裝包）——到時候我再幫你配 workflow。

## 8. 常見坑

- Rust 首次編譯要 10-20 分鐘（下載+編譯依賴），正常，別慌
- `frontendDist` 填 URL 時 Tauri 要求 https 且證書有效——pages.dev 天然滿足
- Windows 智能.Screen 可能攔截未簽名 EXE：用戶點「仍要運行」即可（正式分發可買代碼簽名證書，$200/年，v2 再說）
- 改了 `tauri.conf.json` 記得重新 `tauri build`

## 9. 一句話總結

**本週可完成**：裝 Rust → `npm create tauri-app` → 抄 §5 配置 → `tauri build` → `gh release create`。用戶從你倉庫 Releases 下載 EXE，雙擊，看到的就是你的面板。
