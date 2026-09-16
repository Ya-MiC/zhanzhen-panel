# 红蓝对抗测试任务书 — YamiHub deploy 包

> **给谁**：负责本地测试的 AI（ZCode 或其他 Claude/Agent 实例）
> **项目位置**：`C:\Users\cao41\.openclaw-autoclaw\workspace\projects\yami-hub\deploy\`
> **你的任务**：在本地把这个包跑起来，从攻击者视角打它，从用户视角验它，输出结构化测试报告。
> **你的权限**：只读代码 + 本地运行测试；**不要**把代码或数据上传到任何远端，**不要**改动 `_reference/` 目录。

---

## 一、把项目跑起来（两条路都试）

### 路线 A：Wrangler 本地完整模拟（后端 + 静态一起）

```powershell
cd C:\Users\cao41\.openclaw-autoclaw\workspace\projects\yami-hub\deploy
npx wrangler pages dev . --port 8788 --binding KV=kvtest
```

- `--binding KV=kvtest` 会用本地模拟 KV（自动建 `.wrangler/state`），不需要真实 Cloudflare 账号
- 打开 `http://127.0.0.1:8788` 应看到完整面板（demo 数据、侧栏、平台连接页）

### 路线 B：纯静态检查（后端不可用时降级验证）

直接双击 `index.html` 或：

```powershell
npx serve .
```

- 预期：面板 UI 正常渲染 demo 数据；顶部出现"后端未生效"红条（这是**正确行为**——没有 `_worker.js` 时前端必须显式报错而不是白屏）

## 二、模拟 OAuth（不用真实密钥）

在 `_worker.js` 顶部临时加一行可快速验证流程（测完删掉）：

```js
// 临时测试钩子：跳过真实 token 交换
if (url.query?.mock) { /* 直接种一个假 session */ }
```

更推荐的方式：**直接调用内部函数单测**——用 Node 把 `_worker.js` 当 ESM import，mock `env.KV`（内存 Map 实现 get/put/delete 接口）和 `env.ASSETS`，对 `fetch(request, env)` 喂构造好的 Request：

```js
import worker from './_worker.js';
const KV = new Map();
const env = { KV: { get: async (k,t)=>KV.get(k), put: async (k,v,o)=>KV.set(k,v), delete: async k=>KV.delete(k) }, ASSETS: { fetch: async r => new Response('asset') } };
const res = await worker.fetch(new Request('http://x/api/config'), env);
console.log(res.status, await res.json()); // 期望 providers 三家 configured:false
```

## 三、红队清单（每条给 PASS/FAIL + 证据）

### 注入类
1. **仓库描述 XSS**：mock `/api/github/sync` 返回一个 `description: '<img src=x onerror=alert(1)>'` 的仓库 → 打开画廊页 → 是否弹窗？**必须不弹**（esc() 转义 + sanitizeLabel 双层）
2. **仓库名 XSS**：sync 返回 `name: '<script>alert(2)</script>'` → 全页面扫一遍（总览/画廊/地图/算法页）→ 任何 innerHTML 弹窗都算 FAIL
3. **连接标签注入**：mock GitHub label 返回 `<svg onload=alert(3)>` → `/api/connections` 渲染 → 必须被 sanitizeLabel 截断/剥除
4. **地图页节点名超长**：200 字符仓库名 → SVG 渲染不破版（有截断逻辑）

### 越权/会话类
5. **无 session 调 sync**：`fetch('/api/github/sync')` 不带 cookie → 必须 401
6. **state 重放**：同一个 state 参数回调两次 → 第二次必须 `state_expired` 重定向
7. **state 跨 provider**：拿 github 的 state 走 notion 回调 → 必须 `state_mismatch`
8. **session 固定**：检查 `set-cookie` 的 sid 是 HttpOnly+Secure+SameSite=Lax、每次连接后轮换

### 后端健壮类
9. **限速**：60 秒内打 61+ 次 `/api/config` → 第 61 次起必须 429
10. **KV 未绑定**：去掉 `--binding KV=kvtest` 重启 → `/api/config` 返回 `kv:false`，页面顶部出现黄色提示条（不是白屏）
11. **GitHub API 503**：mock fetch 对 api.github.com 抛错 → `/api/github/sync` 返回 502 JSON（不是崩）
12. **畸形 JSON**：向 callback 塞 `?code=<2000字符>&state=<非法hex>` → 不抛未捕获异常

### 静态资源类
13. **安全响应头**：`curl -I http://127.0.0.1:8788/` → 必须含 `X-Frame-Options: DENY`、`Content-Security-Policy`（`_headers` 文件生效；wrangler pages dev 会模拟）
14. **CSP 连接白名单**：页面里 `fetch('http://evil.com')` 在控制台执行 → 必须 CSP 拦截
15. **CSP 允许本地 AI**：`fetch('http://127.0.0.1:11434/api/tags')` → **必须不被拦**（这是 Ollama 功能的白名单）

### UI/数据类
16. **demo 数据完整性**：未登录状态 → 总览 8 宫格、画廊 10 张 demo 卡、地图页 ArchLive 渲染出 SVG（引擎 console 无报错）
17. **欢迎态**：mock sync 返回空数组 → 总览页变成欢迎语（含「歡迎來到 YamiHub 面板」）+ 两个按钮
18. **同步换血**：mock sync 返回 73 个真实形状仓库 → 侧栏计数/Hero 数字/画廊卡片全部跟着变
19. **Ollama 面板**：地图页点「🦙 本地 AI 判读」→ 面板展开；本机有 Ollama 时「探测本地模型」应列出模型列表（本机 0.34.0 在跑但 0 模型，预期显示"没有模型"提示）

## 四、蓝队清单（用户视角，全部要过）

20. 移动端宽度 375px：侧栏汉堡可开合、卡片不溢出、按钮可点
21. 桌面 1920px / 1440px：地图 SVG 自适应宽度、不横向滚动
22. 键盘可达性：Tab 顺序合理、连接按钮 focus 可见
23. 暗色模式：系统切深色 → 面板整体变深色（CSS 变量生效）、地图页本来就是深色画布
24. 断网/后端 500：所有 fetch 失败路径都有人话提示，无裸 JSON

## 五、产出物

把结果写成 `TEST-REPORT.md` 放在 `projects/yami-hub/` 目录（**不要**放进 deploy/，那个文件夹是要上传的），格式：

```md
# 测试报告 YYYY-MM-DD
## 环境（wrangler 版本 / node 版本）
## 红队结果表（编号 | 用例 | 结果 | 证据）
## 蓝队结果表
## 新发现问题（编号 | 严重度 | 复现步骤 | 建议修复）
## 结论（可部署 / 需修复后部署）
```

## 六、边界与红线

- **不要**真实调用 GitHub/Notion/Google OAuth（没有密钥，全部 mock）
- **不要**在 deploy/ 里留下测试文件或临时钩子；测完 deploy/ 必须和拿来时一致（可用 git 或复制对比）
- 报告里写清每条 FAIL 的最小复现，不要只说"有问题"
- 发现新漏洞不要自己修——写进报告，修复由主 agent（我）统一决策
