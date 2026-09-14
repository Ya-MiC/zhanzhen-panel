// port-panel.mjs — 把 ya-mic-os 面板移植进 YamiHub deploy 包（demo 数据 + 连接页注入）
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";
import { webcrypto as crypto } from "node:crypto";

const REF = "C:/Users/cao41/.openclaw-autoclaw/workspace/projects/yami-hub/_reference/ya-mic-os";
const DEP = "C:/Users/cao41/.openclaw-autoclaw/workspace/projects/yami-hub/deploy";

for (const d of [`${DEP}/assets`, `${DEP}/public/data`]) mkdirSync(d, { recursive: true });

/* ---------- 1. 静态资产 ---------- */
copyFileSync(`${REF}/assets/os2.css`, `${DEP}/assets/os2.css`);
copyFileSync(`${REF}/assets/scoring.js`, `${DEP}/assets/scoring.js`);

let html = readFileSync(`${REF}/index.html`, "utf8");
const must = (cond, msg) => { if (!cond) { console.error("ANCHOR FAIL: " + msg); process.exit(1); } };

/* ---------- 2. demo portfolio.json（形状与真实数据完全一致，评分用同一公式） ---------- */
const W = { C: .14, P: .14, L: .14, S: .12, R: .10, M: .10, D: .10, Q: .08, E: .08 };
function scores(dims, { fork = false, pushedDays = 10 } = {}) {
  const T = pushedDays > 365 ? 8 : pushedDays > 180 ? 7 : pushedDays > 90 ? 6 : pushedDays > 14 ? 5 : 4;
  const U = fork ? 6 : dims.U ?? 5;
  const AVS = Object.entries(W).reduce((a, [k, w]) => a + w * dims[k], 0);
  const GRS = .40 * T + .35 * U + .25 * (10 - dims.E);
  const SPI = 10 * AVS - 5 * GRS;
  const F = fork ? 5 : 0;
  const FinalSPI = Math.max(0, SPI - F);
  const r2 = v => Math.round(v * 100) / 100;
  return { ...dims, T, U, AVS: r2(AVS), GRS: r2(GRS), SPI: r2(SPI), ForkPenalty: F, FinalSPI: r2(FinalSPI), baseline: r2(FinalSPI), scored_at: "2026-09-14" };
}
const day = (n) => new Date(Date.now() - n * 86400000).toISOString();
const demo = [
  ["demo-audit-os", "審計規則引擎 demo", "TypeScript", "product", "A", false, 3, { C: 7, P: 8, L: 6, S: 7, R: 5, M: 7, D: 8, Q: 7, E: 3 }],
  ["demo-quant-lab", "量化策略研究 demo", "Python", "study", "C", false, 30, { C: 8, P: 5, L: 4, S: 6, R: 4, M: 5, D: 7, Q: 8, E: 4 }],
  ["demo-agent-kit", "Agent 行為樹工具箱", "JavaScript", "leverage", "B", false, 8, { C: 6, P: 6, L: 8, S: 6, R: 5, M: 6, D: 7, Q: 6, E: 4 }],
  ["demo-infra-runner", "CI/CD 治理流水線", "Shell", "infra", "D", false, 120, { C: 5, P: 4, L: 6, S: 8, R: 7, M: 4, D: 6, Q: 6, E: 5 }],
  ["demo-panel-fork", "上游面板（fork 示例）", "HTML", "leverage", "B", true, 200, { C: 4, P: 4, L: 5, S: 5, R: 6, M: 3, D: 4, Q: 4, E: 6 }],
  ["demo-docs-site", "文檔站（Cloudflare Pages）", "HTML", "product", "A", false, 5, { C: 6, P: 7, L: 5, S: 6, R: 4, M: 6, D: 6, Q: 6, E: 3 }],
  ["demo-ocr-pipeline", "發票 OCR 流水線 demo", "Python", "product", "A", false, 60, { C: 7, P: 6, L: 6, S: 5, R: 5, M: 6, D: 7, Q: 7, E: 4 }],
  ["demo-sheets-sync", "Sheets 自動同步示例", "Python", "infra", "D", false, 400, { C: 4, P: 3, L: 5, S: 6, R: 7, M: 3, D: 4, Q: 4, E: 7 }],
  ["demo-trading-notes", "交易系統學習筆記", "Markdown", "study", "C", false, 15, { C: 6, P: 3, L: 3, S: 4, R: 3, M: 4, D: 5, Q: 6, E: 4 }],
  ["demo-rag-graph", "GraphRAG 企業知識 demo", "TypeScript", "leverage", "B", false, 45, { C: 7, P: 5, L: 7, S: 6, R: 5, M: 6, D: 7, Q: 7, E: 4 }],
];
const repos = demo.map(([name, desc, lang, role, board, fork, pd, dims], i) => ({
  name, full_name: `demo-user/${name}`, visibility: "public", fork, private: false,
  language: lang, html_url: `https://github.com/demo-user/${name}`,
  stargazers_count: [12, 3, 8, 1, 0, 6, 21, 0, 2, 9][i], forks_count: [2, 0, 3, 1, 0, 1, 4, 0, 0, 2][i],
  open_issues_count: [1, 0, 2, 0, 0, 0, 3, 1, 0, 1][i], size: 1000 + i * 317,
  created_at: day(400 - i * 20), updated_at: day(pd), pushed_at: day(pd),
  primary_domain: board === "A" ? "產品" : board === "B" ? "Agent / 槓桿" : board === "C" ? "量化金融" : "基建",
  business_role: role, lifecycle: pd > 180 ? "維護" : "活躍",
  environment_tags: ["demo"], risk_tags: fork ? ["fork"] : [],
  one_liner: desc, confidence: "medium", needs_human: false,
  scores: scores(dims, { fork, pushedDays: pd }), decision: "KEEP",
  description: desc, license: "MIT", topics: ["demo", lang.toLowerCase()],
}));
const by = (key) => repos.reduce((m, r) => { const k = r[key] || "未分類"; (m[k] ||= []).push(r.name); return m; }, {});
const top5 = [...repos].sort((a, b) => b.scores.FinalSPI - a.scores.FinalSPI).slice(0, 5)
  .map(r => ({ name: r.name, FinalSPI: r.scores.FinalSPI }));
const portfolio = {
  taxonomy_version: "TAXONOMY-V2-demo",
  taxonomy_note: "YamiHub demo 数据 — 非真实资产；字段结构与 ya-mic-os portfolio.json 完全一致",
  generated_at: new Date().toISOString(), source_run: "DEMO-2026-09-14-001",
  stats: { total: repos.length, public: repos.length, private: 0, forks: repos.filter(r => r.fork).length },
  top5_final_spi: top5,
  repositories: repos,
  by_board: by("business_role"), by_lifecycle: by("lifecycle"), by_role: by("business_role"), by_domain: by("primary_domain"),
  top5_risks: [], human_review_resolved: 0, scored_at: "2026-09-14", auto_synced_at: new Date().toISOString(),
};
writeFileSync(`${DEP}/public/data/portfolio.json`, JSON.stringify(portfolio, null, 2));

/* ---------- 3. demo tasks / starred ---------- */
writeFileSync(`${DEP}/public/data/tasks.json`, JSON.stringify({
  updated: "2026-09-14", source: "YamiHub demo 数据",
  tasks: [
    { id: "DEMO-001", task: "把 demo 數據換成你自己的（連接 GitHub 後同步）", priority: "P0", status: "open", ddl: "—", owner: "你" },
    { id: "DEMO-002", task: "在 Pages 設置裡配置三家 OAuth 環境變量", priority: "P0", status: "open", ddl: "—", owner: "你" },
    { id: "DEMO-003", task: "試試評分算法頁的權重實驗室", priority: "P1", status: "open", ddl: "—", owner: "你" },
  ],
}, null, 2));
writeFileSync(`${DEP}/public/data/starred.json`, JSON.stringify({
  updated: "2026-09-14", count: 3,
  starred: [
    { name: "demo-user/demo-agent-kit", desc: "Agent 行為樹工具箱（demo）", lang: "JavaScript", stars: 8 },
    { name: "demo-user/demo-rag-graph", desc: "GraphRAG 企業知識 demo", lang: "TypeScript", stars: 9 },
    { name: "demo-user/demo-ocr-pipeline", desc: "發票 OCR 流水線 demo", lang: "Python", stars: 21 },
  ],
}, null, 2));

/* ---------- 4. demo private.enc（口令：demo，与真实方案同构） ---------- */
const te = new TextEncoder();
const salt = crypto.getRandomValues(new Uint8Array(16));
const iv = crypto.getRandomValues(new Uint8Array(12));
const km = await crypto.subtle.importKey("raw", te.encode("demo"), "PBKDF2", false, ["deriveKey"]);
const key = await crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: 250000, hash: "SHA-256" }, km, { name: "AES-GCM", length: 256 }, false, ["encrypt"]);
const plain = te.encode(JSON.stringify({
  private_repos: [{
    name: "demo-private-core", description: "Demo 私有倉庫 — 輸入口令 demo 解鎖此示例",
    license: "MIT", topics: ["demo", "private"], one_liner: "私有視圖演示：真實部署時用你自己的口令重新生成此文件",
  }],
}));
const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plain));
const packed = new Uint8Array(16 + 12 + ct.length);
packed.set(salt, 0); packed.set(iv, 16); packed.set(ct, 28);
writeFileSync(`${DEP}/public/data/private.enc`, Buffer.from(packed).toString("base64"));

/* ---------- 5. index.html 移植改造 ---------- */
html = html.replace("<title>Ya-MiC Portfolio OS</title>", "<title>YamiHub · Portfolio OS（ya-mic-os 迭代）</title>");
must(html.includes("YamiHub"), "title");

// 侧栏加"平台连接"
const sideAnchor = `<div class="side-item" data-page="notion"><span class="ic">🧩</span>多平台入口</div>`;
must(html.includes(sideAnchor), "sidebar anchor");
html = html.replace(sideAnchor, sideAnchor + `\n  <div class="side-item" data-page="connections"><span class="ic">🔗</span>平台連接</div>`);
html = html.replace(`資產畫廊<span class="cnt">107</span>`, `資產畫廊<span class="cnt">${repos.length}</span>`);

// 注入连接页 section（紧跟 main 开头，页面切换互不影响）
const mainAnchor = `<main class="main">`;
must(html.includes(mainAnchor), "main anchor");
const connSection = `
  <!-- ================= 平台連接（YamiHub 注入） ================= -->
  <section class="page" id="page-connections">
    <div class="page-head">
      <h1>🔗 平台連接</h1>
      <div class="sub">GitHub · Notion · Google —— OAuth 連接你自己的帳號；令牌只存你部署的 KV，不返回浏览器</div>
    </div>
    <div class="unlock-banner" id="connBanner"></div>
    <div class="spec-grid" id="connCards">載入中…</div>
    <h2 class="section-title">🐙 GitHub 即時同步（預覽）</h2>
    <div class="section-sub">連接 GitHub 後，把你帳號的倉庫即時拉進面板（覆蓋 demo 數據，刷新即還原）</div>
    <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-top:12px">
      <button id="syncBtn" style="padding:10px 18px;border-radius:10px;border:1px solid currentColor;background:transparent;cursor:pointer" disabled>同步我的 GitHub 倉庫</button>
      <span class="section-sub" id="syncOut"></span>
    </div>
  </section>
`;
html = html.replace(mainAnchor, mainAnchor + connSection);

// go() 里挂渲染钩子
const goAnchor = `if (page === 'maps') renderMaps();`;
must(html.includes(goAnchor), "go anchor");
html = html.replace(goAnchor, goAnchor + `\n  if (page === 'connections') renderConnections();`);

// 注入 JS（挂在 boot IIFE 之前）
const bootAnchor = `(async function boot() {`;
must(html.includes(bootAnchor), "boot anchor");
const connJs = `
/* ---------- 平台連接（YamiHub） ---------- */
const CONN_META = [
  { id: 'github', name: 'GitHub', desc: '倉庫資產 / OAuth 身份' },
  { id: 'notion', name: 'Notion', desc: '工作區頁面 / 數據庫' },
  { id: 'google', name: 'Google', desc: '帳號身份 / Drive（二期）' },
];
let CONN_STATE = null;
function connBanner(msg, isErr) {
  const b = document.getElementById('connBanner');
  b.textContent = msg; b.style.display = 'block';
  b.classList.toggle('show', true); if (!isErr) b.classList.add('show');
}
async function renderConnections() {
  const host = document.getElementById('connCards');
  if (host.dataset.done !== '1') {
    try { CONN_STATE = await (await fetch('/api/connections')).json(); }
    catch (e) { CONN_STATE = { providers: {}, kv: false }; }
    host.dataset.done = '1';
  }
  const st = CONN_STATE || { providers: {} };
  host.innerHTML = CONN_META.map(p => {
    const s = st.providers[p.id] || {};
    let sub, btn;
    if (!st.kv) { sub = '未绑定 KV（变量名必须是 KV）'; btn = '<button disabled>连接</button>'; }
    else if (!s.configured) { sub = '未配置环境变量：' + (s.missing || []).join('、'); btn = '<button disabled>连接</button>'; }
    else if (s.connected) { sub = '已连接 ' + (s.label || p.id); btn = '<button data-disc="' + p.id + '">断开</button>'; }
    else { sub = '未连接'; btn = '<button data-conn="' + p.id + '">连接</button>'; }
    return '<div class="spec"><h4>' + p.name + '</h4><p>' + p.desc + ' · ' + sub + '</p>' + btn + '</div>';
  }).join('');
  host.querySelectorAll('[data-conn]').forEach(b => b.addEventListener('click', () => { location.href = '/api/oauth/' + b.dataset.conn + '/start'; }));
  host.querySelectorAll('[data-disc]').forEach(b => b.addEventListener('click', async () => {
    await fetch('/api/disconnect/' + b.dataset.disc, { method: 'POST' });
    host.dataset.done = '0'; renderConnections();
  }));
  const gh = (st.providers || {}).github || {};
  document.getElementById('syncBtn').disabled = !(gh.connected);
}
document.getElementById('syncBtn').addEventListener('click', async () => {
  const out = document.getElementById('syncOut');
  out.textContent = '同步中…';
  try {
    const r = await fetch('/api/github/sync');
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || '同步失败');
    PF.repositories = j.repositories;
    if (PF.stats) PF.stats.total = j.repositories.length;
    const repos2 = fmtRepos();
    renderOverview(repos2); chipsRender(); paintAssets(); initAlgo(repos2);
    out.textContent = '已拉取 ' + j.repositories.length + ' 个仓库（刷新页面恢复 demo 数据）';
    go('assets');
  } catch (e) { out.textContent = '同步失败：' + e.message; }
});

` + bootAnchor;
html = html.replace(bootAnchor, connJs);

writeFileSync(`${DEP}/index.html`, html);
console.log("index.html written:", html.length, "bytes");

/* ---------- 6. 检查外部依赖（mermaid CDN 等） ---------- */
const ext = [...html.matchAll(/(?:src|href)=["'](https?:\/\/[^"']+)["']/g)].map(m => m[1]);
console.log("EXTERNAL REFS:", ext.length ? ext.join("\n") : "(none)");
