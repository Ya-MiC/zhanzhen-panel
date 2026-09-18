# THIRD-PARTY-NOTICES — 开源使用与致谢

> YamiHub deploy 包的第三方组件声明。结论先说：**运行时零第三方依赖**，无任何复制来的第三方 UI/后端代码，因此本包整体按项目 LICENSE（MIT）分发即可，无强制第三方许可义务。以下按"思路参考 / 运行时平台 / 借鉴来源"如实致谢。

## 1. 运行时与平台（非代码依赖）

| 组件 | 用途 | 说明 |
| --- | --- | --- |
| Cloudflare Pages + Workers 运行时 | 托管静态资源 + 执行 `_worker.js` | 使用其公开标准 API：`fetch`、`crypto.subtle`、`Response.redirect`、`env.ASSETS`、KV 绑定。遵守 Cloudflare 自身服务条款，非代码分发 |
| Cloudflare KV | 会话与 state 存储 | 同上 |

## 2. 直接依赖的开源代码

**运行时零第三方包。** 具体而言：

- **前端**：`index.html` + `assets/os2.css` + `assets/scoring.js` 为原生 HTML / CSS / JavaScript，继承自 前置版本（MIT，同作者），未使用 React / Vue / Tailwind 等框架；资产地图为手绘 SVG 引擎（archify 方法论），无 mermaid 运行时依赖。
- **后端**：`_worker.js` 为原生 ES Module 单文件，零 npm 依赖。
- **加密**：使用 Web 标准内建 `crypto.subtle`（AES-256-GCM + PBKDF2-SHA256），非第三方库。

因此本包**没有**需要随附的第三方 LICENSE 副本；思想层面的参考致谢见上表。若未来引入 Simple Icons（CC0）等资源，会在此文件更新条目。

## 3. 架构与设计思路的参考来源（思想致谢，非代码）

| 来源 | 借鉴了什么 |
| --- | --- |
| **前置私有版本**（Ya-MiC 自有，MIT） | 本面板的直接前身：完整 UI 设计系统（os2.css）、SPI 资产评分引擎（scoring.js）、资产地图 SVG 自绘引擎、「口令仅在浏览器本地解密」的数据边界（private.enc：AES-256-GCM + PBKDF2 250k） |
| **dashi-taskboard / Codex Taskboard**（chuspeeism，Apache-2.0） | 看板形态参考：项目/议题/状态流（todo → in_progress → in_review → done）的任务组织方式，用于 YamiHub 任务页的看板化方向；本项目未复制其代码 |
| **archify**（tt-a1i/archify，MIT；Ya-MiC/archify 为 fork） | 活体资产地图引擎（assets/archify-live.js）直接采用其设计系统：midnight 语义色板、mono 字体层级、SRC 证据信标、主路径 ≤12 节点不变量、自动路由与"语义色永不装饰"规则。引擎为本项目原创实现（零 archify 代码复制），方法论与视觉词汇致谢 archify |
| **OAuth 2.0 标准族**（IETF：RFC 6749 / RFC 7636 PKCE / RFC 6750） | 授权码流程、state 一次性防 CSRF、PKCE（S256）——按标准自行实现 |
| **GitHub / Notion / Google 官方 API 文档** | 各平台 OAuth 端点、令牌交换参数、API 形状 |
| **Cloudflare Pages 文档** | `_worker.js` Advanced Mode 约定、KV 绑定、拖放部署能力边界 |

## 4. 本项目许可证

YamiHub deploy 包以 **MIT License** 发布（随仓库根 LICENSE 分发）。
你 fork 后的部署实例完全归你，无任何回报要求；若愿意保留页脚致谢，我们感激。

## 5. 商标与署名提醒

- GitHub、Notion、Google、Cloudflare 均为各自所有者的商标；本项目与其无 affiliation / endorsement 关系。
- 面板中的 "GH / N / G" 字符方块为自绘占位字形，非各品牌官方 Logo（避免商标使用问题；v0.2 可换成获得授权的 Simple Icons 资源——Simple Icons 为 CC0，届时会在本文件更新条目）。

## 6. YamiFeed 模塊致謝（v0.2 新增）

| 上游 | 協議 | 使用方式 |
| --- | --- | --- |
| ourongxing/newsnow（21.7k★） | MIT | 多源熱榜聚合架構參考；適配器代碼若引入將放 `vendor/newsnow/` 保留 MIT 頭 |
| DIYgod/RSSHub（46.2k★） | AGPL-3.0 | **僅 HTTP 網絡調用**其公共/自建實例（微博/知乎路由），零代碼複製——AGPL 傳染性被網絡邊界隔離，本倉庫 GPL-3.0 不受影響 |
| WxPusher | 免費公共服務 | 微信每日精選推送通道 |
| Hacker News Firebase API / GitHub Search API | 公開接口 | 數據源 |

內容合規：熱榜只緩存標題/鏈接/熱度元數據；微信推送只發「標題+鏈接」不轉載全文。詳細邊界見 LICENSE-NOTES.md。
