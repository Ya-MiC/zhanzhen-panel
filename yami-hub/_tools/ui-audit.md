# YamiHub UI 一致性審計報告

> 審計對象：`deploy/index.html`（2276 行）＋ `deploy/assets/os2.css`（452 行）
> 設計系統基準：os2.css `--r-lg:20px` / `--r-md:14px`，`.btn-duo`（lime 3D）/`.btn-duo.ghost` 兩大按鈕體系
> 審計日期：2026-09-16。所有行號可直接 grep 定位。

---

## 1. 按鈕系統

### 1.1 規範基準（os2.css 已有的，應該被復用）
| 類 | 定義位置 | 尺寸 | 用途 |
|---|---|---|---|
| `.btn-duo` | os2.css:47 | fs 14 / padding 11px 20px / r14 / 3D shadow `0 4px 0` | 主操作 |
| `.btn-duo.ghost` | os2.css:52 | 同上，bg-soft 底 | 次操作 |
| `.btn-duo.blue` | os2.css:51 | 同上 | 強調次操作 |
| `.lt-tab` | index.html:62 | fs 13.5 / 8px 18px / r999 | 登錄首屏標籤 |
| `.lt-cta` | index.html:75 | fs 14 / 10px 26px / r12 | 登錄卡片 CTA |
| `.bs-btn` | index.html:2099 `<style>` 注入 | fs 12 / 6px 10px / r8 | 分類建議卡 |
| `.mapctl button` / `.gbtn` / `.zoombar button` | os2.css:274/464/411 | 方形圖標鈕 | 地圖工具（✓ 有 class，好樣板） |

### 1.2 帶 inline style 的按鈕（問題清單）
| 位置 | 現狀 | 問題 | 建議 |
|---|---|---|---|
| `index.html:92` `#syncBtn`「同步我的 GitHub 倉庫」 | `padding:10px 18px;border-radius:10px;border:1px solid currentColor;background:transparent` 無字號無字重 | 亮色頁面自造第 5 種按鈕；`1px` 邊框與全站 `2px` 邊框語言衝突 | 改 `class="btn-duo ghost"`，刪除全部 inline |
| `index.html:1844,1845` welcome 狀態卡 `'<button disabled style="opacity:.4">連接</button>'` | UA 默認裸按鈕 | 同一卡片列表中 1846/1847 是 `.btn-duo`，兩種長相並排出現 | 改 `class="btn-duo ghost"` + `disabled` |
| `index.html:2248-2251` 平台連接卡 `'<button disabled>连接</button>'`/`data-disc 断开`/`data-conn 连接` | UA 默認裸按鈕 | `.spec` 卡片內其他元素精修、唯按鈕裸奔；「连接/断开」是核心 CTA | 改 `class="btn-duo"`（连接）/ `class="btn-duo ghost"`（断开/禁用態） |
| `index.html:195,196` `#alRegen` `#alAiToggle` | mono 12 / **8px 14px** / **r10** / 邊 #334155 | 暗色控制台組合 A | 見 1.3 統一方案 |
| `index.html:198-201` `#alExpPng/Svg/Json` `#alImpJson` | mono 12 / **8px 12px** / **r10** | 暗色控制台組合 B | 同上 |
| `index.html:213,214` `#alProbe` `#alRun` | mono 12 / **8px 12px** / **r8** | 同面板內 radius 掉檔（10→8），同排按鈕圓角不一致 | 統一為 r8（與 input/select 一致）或全部升 r10，二選一 |
| `index.html:2157` 空狀態「去连接 →」 | mono 12 / **9px 18px** / r10 / #22D3EE | 第 3 種 padding（9px 18px 全站唯一） | 併入暗色控制台統一值 |
| `index.html:2195` `alPlayBtn`（JS `cssText` 注入） | mono 12 / 8px 14px / r10 / #A78BFA | 與 195/196 同款但靠 JS 字串維護，易再次漂移 | 移入 os2.css 暗色控制台 class |
| `index.html:2097` `#bsSkip` 跳過 | `background:none;border:none;font-size:12px` | 文字鈕無 hover 態，可接受但建議補 `text-decoration:underline` hover | 低優先 |
| `index.html:2093` `.bs-btn` 選中態 `style="background:var(--ink);color:var(--bg)"` | inline 覆蓋 | 與 `.lt-tab.active`（ink-on-bg）同一視覺慣例卻各寫一份 | 補 class `.bs-btn.on` |

### 1.3 inline 按鈕組合統計（padding / radius / font）
| # | 組合 | 出現處 |
|---|---|---|
| 1 | 8px 14px / r10 / mono 12 | 195, 196, 2195 |
| 2 | 8px 12px / r10 / mono 12 | 198, 199, 200, 201 |
| 3 | 8px 12px / **r8** / mono 12 | 213, 214（含 input/select 209, 210） |
| 4 | **9px 18px** / r10 / mono 12 | 2157 |
| 5 | 10px 18px / r10 / inherit 無字重 | 92 |
| 6 | 裸 UA 按鈕 | 1844×2, 2248, 2249, 2250, 2251 |
| 7 | 6px 12px / r14 / 12（btn-duo 縮小版） | 1846 |
| 8 | 6px 14px / r14 / 12（btn-duo 縮小版，左右不等） | 1847 |

**共 8 種組合**。其中暗色控制台內部就有 3 種 padding、2 種 radius。

### 1.4 `.btn-duo` 體系自身的兩處滲漏
| 位置 | 現狀 | 問題 |
|---|---|---|
| index.html:1830-1833, 1846, 1847 | `<a class="btn-duo" ... style="text-decoration:none">` | os2.css 缺 `a.btn-duo{text-decoration:none}`，導致 6 處重複 inline 修補 |
| index.html:1846 vs 1847 | ghost 管理鈕 `padding:6px 12px`、連接鈕 `padding:6px 14px` | 同卡片同排按鈕左右 padding 不等（12 vs 14） |

---

## 2. 顏色硬編碼

### 2.1 可接受（archify 暗色控制台，深色畫布自成體系，保留）
| 色值 | 出現處 | 角色 |
|---|---|---|
| `#0F172A` / `#020617` | 187, 205, 209, 210 | 控制台畫布/面板底 |
| `#1E293B` / `#334155` | 187, 194-205, 209-214 | 邊框/分隔線 |
| `#F8FAFC` / `#94A3B8` | 187, 195, 196, 206, 209, 210, 2154, 2156, 216… | 主字/次字 |
| `#22D3EE` / `#34D399` / `#A78BFA` | 198-200, 213, 214, 2157, 2195 | 功能色（導出/成功/AI） |

### 2.2 必須處理（淺色區域硬編碼，換主題即壞）
| 位置 | 現狀 | 問題 | 建議 |
|---|---|---|---|
| `index.html:23` + `index.html:2231` | `background:#d1d5db`（kvDot 灰點，HTML 與 JS `paintKvDot` 兩處） | Tailwind gray-300 憑空出現；暗色下太亮 | → `var(--line)`（未綁定）已有 lime 變量做已綁定態 |
| `index.html:482` | `'#7c3aed'`（Notion A 卡紫） | 與 `--purple:#ce82ff` 是**兩種紫**；os2.css:257 `.dec.A` 也用 `#7c3aed`，而 `.pill.notion` 用 `#6d28d9` —— 全站 3 種紫 | 統一到 `var(--purple)`，或新增 `--purple-deep` 一個變量收編 #6d28d9/#7c3aed |
| `index.html:481-486` | `#163300`/`#46a302`/`#1899d6`/`#e08600` | 分別就是 `--forest`/`--lime-dark`/`--blue-dark`/`--orange-dark` 的字面量複製 | JS 側建 `const C = id => getComputedStyle(document.documentElement).getPropertyValue('--'+id)` 或直接引用 BOARD_META 已有的 `color:'var(--x)'` 雙軌合併 |
| `index.html:459-463` BOARD_META | `color:'var(--a)'` 與 `hex:'#ce82ff'` 並存 | 同一語義兩份真相源，已出現漂移風險 | 保留 hex（canvas 需要），CSS 用色統一走 `var(--a..e)` |
| `index.html:532` STAR_CAT_COLOR | `#58cc02`/`#1cb0f6`/`#ce82ff`/`#ff9600`/`#e08600` | 全部有對應變量（`--lime-deep`/`--blue`/`--purple`/`--orange`/`--orange-dark`），僅 canvas 場景需要字面量 | 可保留但加註釋「僅 canvas 用」 |
| `index.html:688, 709, 1672` | `STAR_CAT_COLOR[c] \|\| '#999'`（3 處 fallback） | `#999` 不在調色盤 | → `'#a0a4a2'`（= `--e`，治理灰） |
| `index.html:1628, 1632` 雷達圖網格 | `stroke="#e4e9ec"` | 等於 `--line` 淺色值；**暗色主題下網格線不可見**（CSS 變量進不了靜態 SVG 字串） | 繪製時讀 `getComputedStyle` 取 `--line` 實際值傳入（專案 973-979 已有 `dark ?` 分支先例，沿用即可） |
| `index.html:973-1001` mermaid 主題 | 淺/暗雙套 hex | 可接受（mermaid 需具體色），但 `#15181b`/`#f8faf9` 等即 `--ink`/`--bg-soft` 對應值 | 保留，加註釋與變量對應關係 |
| `os2.css:51` `.btn-duo.blue` | `#d7f0ff`/`#0a5c9e`/`#a5dbf5` 三個字面量 | 唯一沒走變量的 btn-duo 變體；暗色版（os2.css:57）倒是用了 `var(--blue)` | 新增 `--blue-soft`/`--blue-ink` 或至少註釋 |

### 2.3 低優先（有暗色覆蓋、功能正常，屬設計系統債）
- os2.css:199-202, 216-224, 236-242 badges/pills/dec 的 `#dcf7c8`/`#fff3d6`/`#ffe0e0`/`#c93a3a`/`#dbefff`/`#fff3c8`/`#a06a00`/`#f3e8ff` —— 淺色字面量 + 暗色 rgba 覆蓋雙寫，改主色需動 10+ 處；建議未來抽 `--tint-lime/-amber/-red/-blue/-purple` 變量。
- os2.css:114, 343-346 hero/lock-card 內 `#cfe8c0`/`#9fbf8e`/`#ffb3b3` —— forest 深綠畫布自成體系，可接受。

**審計中發現的 CSS 缺陷（額外收穫）**：os2.css:424-425 `.ed-kicker` 規則塊多寫了一個閉合 `}`（`box-shadow:0 2px 0 var(--lime-dark); }` 後又跟一行孤懸的 `text-transform:uppercase; margin-bottom:10px; }`），導致全文件大括號平衡為 **-1**；瀏覽器目前自動容錯、渲染正常，但屬於潛伏炸彈——未來在此塊之後以頂層寫法追加的規則會被靜默吞掉。修法：刪除 424 行行尾的 `}`，把 425 行的兩條聲明併入 `.ed-kicker` 規則塊。

---

## 3. 圓角值盤點

設計系統變量：`--r-lg:20px` / `--r-md:14px`（os2.css:10）。

### 3.1 index.html inline（29 處）
| 值 | 次數 | 位置 |
|---|---|---|
| 10px | ×10 | 92, 195, 196, 198, 199, 200, 201, 2088, 2157, 2195 |
| 8px | ×6 | **16（側欄 logo）**, 209, 210, 213, 214, 2099 |
| 12px | ×3 | 75（lt-cta）, 205, 1894（toast） |
| 16px | ×3 | **45（登錄 logo）**, 66（lt-card）, 2080（suggestCard） |
| 999px | ×2 | 62（lt-tab）, 194（alAiBadge） |
| 14px | ×1 | 1848 |
| 20px | ×1 | 187（liveMapPanel） |
| 3px / 2px / 50% | ×3 | 2168, 73, 23 |

### 3.2 os2.css（直寫值 33 處，變量僅 9 處）
| 值 | 次數 | 典型位置 |
|---|---|---|
| 7px | ×2 | 43（.kbd）, 393/456（type-badge） |
| 8px | ×4 | 243（.mtag）, 400, 423, 449 |
| 9px | ×3 | 153, 411, 470 |
| 10px | ×3 | 328, 464, … |
| 12px | ×9 | 109, 274, 296, 303, 365, 389, 404, 409, 461 |
| 14px | ×6 | 34, 48, 188, 293, 317, 349, 355 |
| **15px** | ×1 | 37（.top-search）← 全站孤值 |
| 16px | ×2 | 210（v3.1 acard 覆蓋）, 448 |
| **17px** | ×1 | 72（.side-item）← 全站孤值 |
| 24px | ×1 | 362（.modal） |
| 26px | ×2 | 114（.hero）, 343（.lock-card） |
| 99px/999px/50% | ×14 | 各 pill/chip/ring |

### 3.3 結論
- 直接寫死的圓角值共 **15 種**（2/3/7/8/9/10/12/14/15/16/17/20/24/26/999）；
- `--r-lg` 只有 9 處使用，24/26px 特大圓角反而繞過變量；
- 15px、17px 是孤值；8/9/10 三檔小圓角混用無規則。

---

## 4. Logo 三處

| 位置 | 引用 | 現狀 | 問題 |
|---|---|---|---|
| favicon（index.html:7） | `assets/favicon.png`（3.8KB PNG） | 瀏覽器標籤圖 | 與 logo.jpg 是兩個文件、兩份真相源，改 Logo 要同步兩處；建議由 logo.jpg 導出並在 readme 註明 |
| 側欄（index.html:16） | `<img src="assets/logo.jpg" style="width:26px;height:26px;border-radius:8px;object-fit:cover;vertical-align:-6px">` | 26px / **r8**（31%） | ① 外層 `.brand .logo` span（os2.css:34）定義 40×40/r14/forest 底，img 內聯把尺寸改掉，兩層半徑語義打架；② `vertical-align:-6px` magic number；③ 31% 圓角比例與登錄頁 25% 不一致 |
| 登錄首屏（index.html:45） | `<img src="assets/logo.jpg" style="width:64px;height:64px;border-radius:16px;object-fit:cover">` | 64px / **r16**（25%） | 比例 25% ≠ 側欄 31% ≠ os2.css 容器 35%（40px→14px） |

**建議**：抽一條規則「logo 圓角 = 尺寸 × 25%」，即 26px→`7px`（或統一用 `border-radius:25%` 百分比寫法一勞永逸），側欄 `vertical-align:-6px` 改用 flex 對齊（`.brand` 已是 flex，img 不需要 vertical-align）。三處均加 `object-fit:cover`（前兩處已有，favicon 由導出流程保證）。

---

## 5. 字號盤點

index.html inline `font-size` 共 **50 處、17 種值**：

| 值 | 次數 | 備註 |
|---|---|---|
| 12px | ×18 | 一家獨大（36%），事實上的 small 標準 |
| 13px | ×8 | |
| 11px | ×6 | |
| 16px | ×4 | |
| 12.5px | ×5 | 與 12/13 並存的碎值 |
| 11.5px | ×3 | 碎值 |
| 13.5px | ×3 | 碎值（lt-tab/lt-card 用） |
| 10px | ×3 | |
| 14px | ×2 | |
| 10.5px / 15px / 18px / 28px / 30px / 40px / 56px | 各 ×1 | 1825-1827（welcome 卡 56/30/16）與 45-47（登錄首屏 28/15/16）是同一「首屏歡迎語」的兩套字號：h1 30 vs 28、正文 16 vs 15 |

os2.css 內另有 10→92px 共 20+ 種（多數合理，但 14/14.5/15/15.5 四檔正文小字並存）。

**要點**：
1. 小字六連 11 / 11.5 / 12 / 12.5 / 13 / 13.5 需收斂（間距僅 0.5px，肉眼無差）。
2. 兩個歡迎首屏（index.html:45-47 靜態 vs 1825-1827 JS 渲染）字號、間距、文案結構幾乎重複但數值各異 —— 兩屏應共用一套 class。

---

## 統一建議

### A. 按鈕收斂為 4 種變體 + 2 種尺寸
1. **`.btn-duo`**（主 CTA，lime 3D）— 現狀保留；os2.css 補 `a.btn-duo{text-decoration:none}`，刪掉 6 處 inline `text-decoration:none`。
2. **`.btn-duo.ghost`**（次操作）— 平台連接頁 `#syncBtn`(92)、welcome 卡裸按鈕(1844/1845)、`#connCards` 的 连接/断开(2248-2251) 全部收編。
3. **`.btn-duo.sm`（新增，`font-size:12px;padding:6px 13px`）** — 收編 1846（6px 12px）與 1847（6px 14px）兩個漂移值，以及狀態卡小按鈕。
4. **`.al-btn`（新增，暗色控制台專用：`font-family:monospace;font-size:12px;padding:8px 12px;border-radius:8px;border:1px solid #334155;background:transparent;cursor:pointer`）** — 收編 195/196/198/199/200/201/213/214/2157/2195 共 10 顆按鈕 + 209/210 兩個控件；色差用 `color` inline 留（#F8FAFC/#22D3EE/#34D399/#A78BFA 是語義色）。統一後 padding 只剩 `8px 12px`、radius 只剩 `8px`，刪掉 9px 18px、8px 14px、r10 三個漂移。
5. 圖標方鈕繼續用 `.mapctl button`/`.gbtn`/`.zoombar button`，不動。

### B. 圓角收斂為 5 檔
| 檔 | 值 | 變量 | 適用 |
|---|---|---|---|
| XS | 7px | `--r-xs`（新增） | kbd、mtag、type-badge、bs-btn、暗色小控件 |
| S | 10px | `--r-sm`（新增） | 大部分 inline 10px、os2.css 9/10px 全部歸併 |
| M | 14px | `--r-md`（已有） | 卡片、按鈕、input、toast、logo 40px 容器 |
| L | 20px | `--r-lg`（已有） | 大容器（liveMapPanel 已對）、hero/lock 的 26px→`--r-xl:26px`（新增） |
| pill | 999px / 50% | 不變 | chip/task-link/badge |

執行要點：os2.css 的 15px(top-search)→14px、17px(side-item)→16px 或 14px（建議 16px 併入 acard 的 16）；modal 24→26 併 `--r-xl`；index.html inline 的 12px 半徑（75/205/1894）→`var(--r-md)` 或 10px 檔；3px/2px 微圓角保留（裝飾件）。

### C. 顏色必換 CSS 變量清單（最小集）
1. `#d1d5db` → `var(--line)`（index.html:23、2231 兩處）。
2. `'#999'` fallback ×3（688/709/1672）→ `'#a0a4a2'`。
3. 紫色統一：`#7c3aed`（482、os2.css:257）與 `#6d28d9`（os2.css:257 pill.notion、992）二選一；建議新增 `--purple-deep:#7c3aed`，`--purple` 保留 `#ce82ff`。
4. 雷達圖網格 `#e4e9ec`（1628/1632）→ 繪製時從 `getComputedStyle` 讀 `--line`（973 行已有 dark 分支先例）。
5. `.btn-duo.blue`（os2.css:51）三色抽成變量或至少與暗色版（os2.css:57）對齊註釋。
6. archify 控制台的 slate/cyan 系（§2.1）**不動**，但建議在 index.html:187 前加一行註釋「archify 暗色控制台自帶調色盤，勿改用 --vars」，防止未來被「好心統一」。

### D. Logo / 首屏
- logo 圓角統一 `border-radius:25%`（或 26px→7px、64px→16px、40px 容器→10px），側欄去掉 `vertical-align:-6px` 改 flex 對齊。
- favicon.png 改由 logo.jpg 導出（同一真相源）。
- 兩個歡迎首屏（index.html:45-47 與 1824-1833）合併為同一組 class（如 `.wl-hero`），字號統一 h1 28px、正文 15px 或 16px 二選一。

### E. 字號階梯（12 種 → 9 種）
`10 / 11 / 12 / 13.5 / 15 / 16 / 19 / 24 / 32`（+hero clamp）
- 11.5→11 或 12；12.5→12（meta 類）或 13（正文類，13→13.5 亦可反向統一）；13.5 保留為 `--fs-body-sm`。
- 40px/56px 只保留 welcome emoji 一處，不進階梯。

---

### 修改索引（按文件，供直接照單執行）
**index.html**：行 16、23、45、92、195-201、209-214、2157、2195（按鈕/控件 → `.al-btn`）；1844-1847、2248-2251（裸按鈕 → `.btn-duo(.ghost/.sm)`）；688/709/1672（#999 fallback）；482（紫統一）；1628/1632（雷達網格讀變量）；1830-1833（刪 text-decoration 修補）；45-47 vs 1825-1827（首屏合併）。
**os2.css**：行 10（+`--r-xs:7px; --r-sm:10px; --r-xl:26px`）、37（15→14）、51（blue 變量化）、72（17→16）、257（紫統一）、新增 `a.btn-duo`、`.btn-duo.sm`、`.al-btn` 三個 class。
