# YamiHub — 保姆级部署手册（拖上传，5 分钟）

> **你要拖的东西**：整个 `deploy` 文件夹（11 个文件，含子文件夹 `assets/` 和 `public/`）。
> **你将得到**：`https://你起的名字.pages.dev` —— 一个「谁登录谁的账号，就长成谁的样子」的动态资产面板。
> **原则**：你自己的 Cloudflare 账号、你自己的 KV、你自己的 OAuth 密钥，令牌只存你自己的 KV。

---

## 这个包里是什么（动态数据 · 不是写死的）

| 文件 | 作用 |
| --- | --- |
| `index.html` | **完整面板**（移植自 前置版本 并产品化）：总览 / 资产画廊 / 资产地图 / 任务 / 平台连接 / 评分算法 / 治理页 |
| `_worker.js` | 唯一服务端：三家 OAuth（state 一次性 + PKCE）+ `/api/github/sync` 实时同步 |
| `assets/os2.css` · `assets/scoring.js` | 面板样式系统与评分引擎（权重实验室可实时改权重重算） |
| `public/data/*` | **未登录时的 demo 预览数据**（10 个虚构 `demo-*` 仓库，属于虚构账号 demo-user，不属于任何真人） |
| `README.md` / `THIRD-PARTY-NOTICES.md` / `LICENSE` | 手册 / 开源致谢 / MIT |

### 数据怎么「活」起来（登录即身份，无口令）

1. **未登录** → 面板用 demo 数据展示形态（虚构的 10 个仓库）；所有统计数字（侧栏计数、Hero 标题、分区 chips）都是从数据动态渲染的，代码里没有写死的「59」「107」。
2. **登录后仓库数为 0 的新用户** → 总览页自动变成欢迎页：「歡迎來到 YamiHub 面板，請登陸帳號，開始豐富自己的生活，有系統的認識這一切，熱愛生活吧」+ 一键连接引导。
3. **连接 GitHub 后点「同步我的 GitHub 仓库」** → 拉取你真实的仓库（自动翻页最多 300 个，**包括你有权限的私有仓库**——登录即身份，不再需要任何「私有口令」），服务端按 SPI 公式快速评分，总览/画廊/地图/算法页全部随之变化。
4. 刷新页面回到 demo → 同步结果持久化在 v0.2（浏览器本地 AES-GCM 加密存储）。

---

## 第 1 步 · 上传（注意：入口别点错！）

1. 登录 [dash.cloudflare.com](https://dash.cloudflare.com)
2. 左侧 **Workers 和 Pages**（Workers & Pages）
3. 点 **创建**（Create）→ 标签页里选 **Pages** → **上传资产**（Upload assets / 拖放你的文件）
   ⚠ **这里有两个入口长得像：`Workers` 和 `Pages`。必须选 Pages！选成 Workers 拖放会上传失败或没有 _worker.js 效果。**
4. 项目名填 `yami-hub`（这就是你域名的一部分）→ **创建项目**
5. 把 `deploy` 文件夹**直接拖进上传框**（Windows 直接拖文件夹即可，不用压缩 zip）
6. 等待上传完成 → 点 **部署站点**（Deploy site）
   - 通过「上传资产」点「部署站点」部署的**就是生产环境（Production）**，放心。
7. 完成后你会看到 `✔ 部署成功`，域名是 `https://yami-hub.pages.dev`

> 上传成功的标志：项目文件列表里有 `index.html`、`_worker.js`、`assets/`、`public/`。
> 如果只有 index.html，说明拖错文件夹，删掉项目重来。

## 第 2 步 · 建 KV 并绑定（30 秒）

1. 左侧 **存储和数据库**（Storage & Database）→ **KV** → **创建命名空间**，名称 `yami-hub-kv`（随意）
2. 回到 **Workers 和 Pages → yami-hub → 设置（Settings）**
3. **绑定（Bindings）** → 添加 → **KV 命名空间**
   - **变量名称填：`KV`**（必须这三个字母，大写）
   - 命名空间选刚建的 `yami-hub-kv`
4. 保存。

## 第 3 步 · 三家 OAuth 后台申请（字段级教学）

> 回调地址规律统一：`https://你的域名/api/oauth/平台名/callback`
> 本节以 `https://kv-9di.pages.dev` 这种真实域名为例，你替换成自己的。

### 3A · GitHub（2 分钟）

1. 打开 <https://github.com/settings/developers> → **OAuth Apps** → **New OAuth App**
2. 填表：

| 字段 | 填什么 |
| --- | --- |
| Application name | `YamiHub` |
| Homepage URL | `https://你的域名` |
| Authorization callback URL | `https://你的域名/api/oauth/github/callback` |

3. 注册后 → **Generate a new client secret**
4. 复制 **Client ID** 和 **Client secret**（secret 只显示一次）

### 3B · Notion（3 分钟，注意类型选择）

1. 打开 <https://www.notion.so/profile/integrations> → **新建集成**（New integration）
2. 表单里 **类型**会问你要哪种凭据/集成方式——**选 OAuth**（公共集成），**不要选 Internal token / access token 那条路**：
   - **Access token（内部集成密钥）**：只能操作你自己的工作区，是给个人自动化用的；面板需要「每个用户授权自己的工作区」，必须走 **OAuth**。
3. 创建后进入集成的 **机密（Secrets）** 标签页：
   - 找到 **Client ID** 和 **Client secret**（`secret_` 开头）→ 两个都复制保存
4. 同一集成页里找 **分发（Distribution）/ 重定向 URI（Redirect URIs）** 设置：
   - 添加 `https://你的域名/api/oauth/notion/callback`（不做这步授权时必报 unsupported_redirect_uri）
5. ⚠ **授权时会发生什么（重要，关系到数据可见性）**：
   - 用户点「连接 Notion」后会跳到 Notion 授权页，**页面里可以勾选「允许访问哪些页面」**——用户需要选择要共享给面板的页面/数据库（或全选）。
   - 没勾选的页面面板**永远看不到**；如果登录后 Notion 数据是空的，回到 Notion → 设置 → 我的连接 → 找到 YamiHub → 把需要的页面加进可访问列表。
6. 记下 **Client ID** + **Client secret**（`secret_` 开头）填到 Cloudflare。

### 3C · Google（4 分钟，按钮名称逐个对）

1. 打开 <https://console.cloud.google.com/apis/credentials>（Gmail 登录）
2. 顶部新建项目 `yamihub` → 选中
3. 左侧 **OAuth 同意屏幕**：User Type 选 **外部** → App name `YamiHub` → 联系邮箱填自己 → Scopes 跳过 → **Test users 把你自己的 Gmail 加进去** → 保存（Testing 模式免审核）
4. 左侧 **凭据（Credentials）** → 点 **「+ 创建凭据」（Create credentials）** → 菜单里选 **「OAuth 客户端 ID」（OAuth client ID）**
   ⚠ 不是「API 密钥」，也不是「服务账号」——必须选 **OAuth 客户端 ID**。
5. 应用类型选 **「Web 应用」（Web application）**
   ⚠ 不是桌面（Desktop）、不是 Android、不是 iOS！选错类型回调会一直被拒。
6. 找到 **「已获授权的重定向 URI」（Authorized redirect URIs）** 字段 → 点 **「添加 URI」** → 填：
   `https://你的域名/api/oauth/google/callback`
7. 点创建后弹窗显示 **客户端 ID** 和 **客户端密钥**：
   ⚠ **复制铁律：点弹窗上的复制按钮，直接粘贴到 Cloudflare 的变量值框里，中间不要经过记事本、不要手动选中拖拽、不要在结尾加空格或换行。** Google 的密钥对换行/空格零容忍，多一个字符就是 400 错误。
8. 客户端 ID 长这样：`xxxx.apps.googleusercontent.com`；密钥长这样：`GOCSPX-xxxxxxxx`

## 第 4 步 · 把 6 个密钥填进 Cloudflare

**Workers 和 Pages → yami-hub → 设置 → 变量和机密**，逐条添加（类型选**密钥/Secret**——值会被隐藏，更安全）：

| 变量名 | 值 | 长相自查 |
| --- | --- | --- |
| `GITHUB_CLIENT_ID` | GitHub Client ID | 40 位十六进制（Iv1. 或纯串） |
| `GITHUB_CLIENT_SECRET` | GitHub Client secret | 40 位十六进制 |
| `NOTION_CLIENT_ID` | Notion Client ID | 短十六进制串 |
| `NOTION_CLIENT_SECRET` | Notion Client secret | `secret_` 开头 |
| `GOOGLE_CLIENT_ID` | Google 客户端 ID | `.apps.googleusercontent.com` 结尾 |
| `GOOGLE_CLIENT_SECRET` | Google 客户端密钥 | `GOCSPX-` 开头 |

可选：`GITHUB_SCOPE`（默认 `read:user repo`，含私有仓库读取）、`GOOGLE_SCOPE`（默认 `openid email`）、**`DEMO_MODE`（设为 `1` 开启 demo 演示数据；默认关闭 = 空白画布，连接自己的账号才有数据）**。

## 第 5 步 · 重新拖一次部署包（重要！）

> 环境变量/绑定只对**之后**的部署生效。必须重传一次。

1. Workers 和 Pages → yami-hub → **创建新部署** → 再拖一次 `deploy` 文件夹（部署的就是生产环境）
2. 打开 `https://你的域名`：
   - 未登录 → demo 预览面板（10 个虚构仓库）
   - 侧栏 **🔗 平台连接** → 点 GitHub **连接** → 授权 → 回来后点 **同步我的 GitHub 仓库**
   - 总览/画廊/地图全部换成你的真实数据 ✅

## 出错速查

| 现象 | 原因 | 解法 |
| --- | --- | --- |
| 卡片黄点：未配置环境变量 XXX | 变量没配 / 没重新部署 | 配好后**重拖一次** |
| 顶部提示没绑 KV | 没绑 / 绑了没重拖 | 绑 KV（变量名 `KV`）后**重拖一次** |
| 后端未生效 | 只传了 index.html / 入口选成 Workers | 重走第 1 步，选 **Pages → 上传资产** |
| redirect_uri_mismatch | 回调地址与域名不一致 | 一字不差照抄 `https://域名/api/oauth/平台/callback` |
| Google 报 400 / invalid_client | 密钥复制带了空格/换行 | 回 Cloudflare 变量里重新粘贴（见 3C 第 7 步铁律） |
| state_expired | 授权页开超过 10 分钟 | 回面板重新点连接 |
| Notion unsupported_redirect_uri | 没做 3B 第 4 步 | 补 Redirect URI |
| Notion 连上了但数据空 | 授权时没勾选页面 | 3B 第 5 步：去 Notion 连接管理里把页面共享给 YamiHub |
| Google access_blocked | Gmail 不在测试名单 | 3C 第 3 步加进 Test users |
| Google「未验证应用」警告 | 正常（Testing 模式） | 点「显示详细信息」→「前往」继续 |

## 数据与安全边界

- OAuth `state` 一次性 + 10 分钟过期；Google 走 PKCE（S256）。
- 令牌只写进你绑定的 KV（`sess:*`，7 天滑动过期），**绝不返回浏览器**。
- `/api/github/sync` 只读仓库元数据并做 SPI 快速评分，不写任何 GitHub 数据。
- 断开连接 = 从 KV 删除该平台令牌。
- 无硬编码密钥；泄露应对：在 Cloudflare 控制台轮换 secret。

## 关于加密（「OpenAI 那种 v1 加密我们能不能用」）

已经在用同级别：**AES-256-GCM + PBKDF2-SHA256（25 万次迭代）**——Web 标准 `crypto.subtle` 原生实现，TLS 1.3 / 1Password 同级原语，浏览器原生支持零依赖。v0.2 会把同步下来的真实数据用它锁进浏览器本地（口令在你手里，服务端零知识）。

## 资产地图：活体引擎（谁登录长谁的图）

地图不再是写死的 8 张图。`assets/archify-live.js` 引擎从**当前登录用户的数据**实时生成地图：

1. **规则引擎兜底**（零 AI）：按仓库的语言/描述/topics 确定性聚类到 6 个语义分区（前端/业务/数据/基建/AI 流/外围），coreScore 决定谁上主路径（archify 不变量：主路径 ≤12 节点）
2. **可选本地 AI 判读**（Ollama）：地图页右上「🦙 本地 AI 判读」→ 探测 `http://127.0.0.1:11434` 的本地模型 → 仓库摘要喂给你的本地模型 → 它判读分区叙事和主路径，引擎按判读重排地图。**数据全程不离开用户自己的机器**
   - https 部署的面板连本地 Ollama 需要：设置 `OLLAMA_ORIGINS` 包含面板地址并重启 Ollama，且浏览器允许「不安全内容」（混合内容限制）；localhost 域名部署则开箱即用
3. 空数据用户看到引导卡「连接 GitHub 并同步后，这里会长出你的资产地图」

美学遵循 archify（tt-a1i，MIT）设计系统：midnight 暗色画布、语义色永不装饰、mono 字体、SRC 证据信标、单主路径短侧枝自动路由。

## 已知待打磨（v0.3 排期）

- ~~侧栏分组按产品逻辑重构~~ ✅ 已完成：資產宇宙 / 外部平台 / 智能·治理，分區規則通用化（P產品線/T工具/R研究/I基建/Fork）
- ~~同步结果本地加密持久化~~ ✅ 已完成：本地保險箱（AES-256-GCM，口令自動生成）+ 自動同步
- ~~地图节点标签重叠~~ ✅ 已完成：archify v2 泳道佈局（統一網格 118/224×64/24），長名截斷策略內建；超大倉庫數（>60）的分頁渲染仍在排期
- 任務頁看板化（参考 dashi-taskboard 狀態流）+ Notion/Google 數據視圖 + YamiFeed 熱榜模塊（見 YAMIFEED-DESIGN.md）

## 致谢

运行时零第三方依赖；设计血统与思想致谢（前置版本 / dashi-taskboard / archify / OAuth 标准族 / 各平台官方文档）见 [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md)。

## 📡 資訊 · 熱榜（YamiFeed）

側欄「資訊 · 熱榜」聚合多源熱點：GitHub Trending（官方 API）/ 微博熱搜 / 知乎熱榜（走 RSSHub）/ Hacker News。KV 緩存 30 分鐘。

**可選環境變量（資訊整合用）**：

| 變量 | 說明 |
| --- | --- |
| `GITHUB_TOKEN` | 可選，提高 GitHub API 限額（5000/h） |
| `RSSHUB_BASE` | 可選，自建 RSSHub 實例（默認公共 rsshub.app，偶爾限流） |
| `WXPUSHER_TOKEN` | WxPusher 應用 appToken（wxpusher.zjiecode.com 創建） |
| `WXPUSHER_UID` | 掃碼關注後獲得的用戶 UID |

配置 WxPusher 後：連接頁「📨 試發每日精選」一鍵測試；配好 CF Pages Cron Trigger（`0 8 * * *`）每天早 8 點自動把熱榜精選推到微信。推送只含「標題+鏈接」，版權合規。
