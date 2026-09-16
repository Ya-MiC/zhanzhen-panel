// gen-live-data.mjs — 生成“谁登录就长成谁的样子”的动态数据契约层
// 嵌入 index.html：<script> 前注入 window.YamiLive 数据契约 + 欢迎态渲染钩子
import { readFileSync, writeFileSync } from "node:fs";

const DEP = "C:/Users/cao41/.openclaw-autoclaw/workspace/projects/yami-hub/deploy";
let html = readFileSync(`${DEP}/index.html`, "utf8");

const live = `
/* ---------- YamiLive 动态数据契约（产品层） ----------
 * 静态 demo 数据(PF)只做未登录时的预览。登录后 /api/github/sync 返回真实仓库，
 * 本层负责：欢迎态(0仓库) / 动态统计 / 增量同步 / 状态标签全部实时计算。 */
const YamiLive = {
  syncing: false,
  lastSync: null,
  emptyStats() { return { total: 0, public: 0, private: 0, forks: 0 }; },
  apply(repos) {
    PF.repositories = repos;
    PF.stats = { total: repos.length, public: repos.filter(r=>!r.private).length,
      private: repos.filter(r=>r.private).length, forks: repos.filter(r=>r.fork).length };
    PF.auto_synced_at = new Date().toISOString();
    PF.top5_final_spi = [...repos].sort((a,b)=>(b.scores?.FinalSPI||0)-(a.scores?.FinalSPI||0)).slice(0,5)
      .map(r=>({ name:r.name, FinalSPI:r.scores?.FinalSPI||0 }));
    return fmtRepos();
  },
  async sync() {
    const r = await fetch('/api/github/sync');
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || ('HTTP '+r.status));
    this.lastSync = j.synced_at;
    return this.apply(j.repositories || []);
  },
};

function yamiWelcomeHTML() {
  return '<div style="max-width:680px;margin:8vh auto 0;text-align:center;padding:0 20px">'
    + '<div style="font-size:56px;line-height:1">🐙</div>'
    + '<h1 style="margin:22px 0 10px;font-size:30px;letter-spacing:-.01em">歡迎來到 YamiHub 面板</h1>'
    + '<p style="color:var(--ink-2);font-size:16px;line-height:1.8;max-width:480px;margin:0 auto 26px">'
    + '請登陸帳號，開始豐富自己的生活——<br>有系統地認識這一切，熱愛生活吧。</p>'
    + '<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">'
    + '<a class="btn-duo" href="#" onclick="go(\\'connections\\');return false" style="text-decoration:none">🔗 連接 GitHub</a>'
    + '<a class="btn-duo ghost" href="#" onclick="go(\\'guide\\');return false" style="text-decoration:none">先看看 demo →</a>'
    + '</div></div>';
}

function yamiPatchOverview() {
  // 登录后同步完成且仓库为 0 → 欢迎态
  const host = document.querySelector('#page-overview');
  if (!host) return;
  const zero = PF.stats && PF.stats.total === 0;
  if (zero && !host.dataset.welcomed) {
    host.dataset.welcomed = '1';
    host.innerHTML = yamiWelcomeHTML();
  }
}

// 挂在 go() 上：每次切页检查欢迎态
const _go = go;
go = function(page) { _go(page); if (page === 'overview') yamiPatchOverview(); };
`;

// 注入到平台连接 JS 之前（boot 之前都行）
const anchor = "/* ---------- 平台連接（YamiHub） ---------- */";
if (!html.includes(anchor)) { console.error("anchor missing"); process.exit(1); }
html = html.replace(anchor, live + "\n" + anchor);

// 同步按钮改走 YamiLive（覆盖旧 handler：直接替换调用点）
html = html.replace(
  `const r = await fetch('/api/github/sync');
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || '同步失败');
    PF.repositories = j.repositories;
    if (PF.stats) PF.stats.total = j.repositories.length;
    const repos2 = fmtRepos();`,
  `const repos2 = await YamiLive.sync();`
);

writeFileSync(`${DEP}/index.html`, html);
console.log("YamiLive injected. index.html:", html.length, "bytes");
