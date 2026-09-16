// fix-ux2.mjs v3 — 锚点用文件里的真实转义形态（\' 而非 \\'）
import { readFileSync, writeFileSync } from "node:fs";
const DEP = "C:/Users/cao41/.openclaw-autoclaw/workspace/projects/yami-hub/deploy";
let h = readFileSync(`${DEP}/index.html`, "utf8");
let n = 0;
const rep = (from, to, label) => {
  if (!h.includes(from)) { console.error("MISS: " + label); process.exit(1); }
  h = h.split(from).join(to); n++;
};

/* 1) boot gating */
rep(
  "(async function boot() {\n  PF = await (await fetch('public/data/portfolio.json')).json();",
  [
    "(async function boot() {",
    "  // 未连接 → 空面板（欢迎态 0）；demo 数据按需加载",
    "  let connected = false;",
    "  try {",
    "    const st = await (await fetch('/api/connections')).json();",
    "    connected = st.kv && Object.values(st.providers || {}).some(p => p && p.connected);",
    "  } catch (e) { connected = false; }",
    "  if (connected) {",
    "    PF = await (await fetch('public/data/portfolio.json')).json();",
    "  } else {",
    "    PF = { repositories: [], stats: { total: 0, public: 0, private: 0, forks: 0 }, top5_final_spi: [], auto_synced_at: null, by_board: {}, by_lifecycle: {}, by_role: {}, by_domain: {}, top5_risks: [] };",
    "    window.__demoAvailable = true;",
    "  }",
  ].join("\n"),
  "boot gating"
);

/* 2) demo 加载器 */
rep(
  "function yamiPatchOverview() {",
  [
    "async function yamiLoadDemo() {",
    "  PF = await (await fetch('public/data/portfolio.json')).json();",
    "  window.__demoAvailable = false;",
    "  const host = document.querySelector('#page-overview');",
    "  if (host) { delete host.dataset.welcomed; }",
    "  const repos2 = fmtRepos();",
    "  renderOverview(repos2); chipsRender(); paintAssets(); initAlgo(repos2);",
    "  go('overview');",
    "}",
    "",
    "function yamiPatchOverview() {",
  ].join("\n"),
  "demo loader"
);

/* 3) 欢迎按钮组（真实转义形态：\' ） */
rep(
  "    + '<a class=\"btn-duo\" href=\"#\" onclick=\"go(\\'connections\\');return false\" style=\"text-decoration:none\">🔗 連接 GitHub</a>'\n    + '<a class=\"btn-duo ghost\" href=\"#\" onclick=\"go(\\'guide\\');return false\" style=\"text-decoration:none\">先看看 demo →</a>'",
  [
    "    + '<a class=\"btn-duo\" href=\"/api/oauth/github/start\" style=\"text-decoration:none\">🐙 連接 GitHub</a>'",
    "    + '<a class=\"btn-duo ghost\" href=\"/api/oauth/notion/start\" style=\"text-decoration:none\">🪷 連接 Notion</a>'",
    "    + '<a class=\"btn-duo ghost\" href=\"/api/oauth/google/start\" style=\"text-decoration:none\">🌐 連接 Google</a>'",
    "    + '<a class=\"btn-duo ghost\" href=\"#\" onclick=\"yamiLoadDemo();return false\" style=\"text-decoration:none\">先看 demo 效果 →</a>'",
  ].join("\n"),
  "welcome buttons"
);

/* 4) 欢迎尾注入三平台卡 */
rep(
  "    + '</div></div>';\n}",
  [
    "    + '</div>';",
    "  // 三平台状态卡（欢迎态首屏即登录界面）",
    "  fetch('/api/connections').then(function (r) { return r.json(); }).then(function (st) {",
    "    const META = [['github','🐙 GitHub','倉庫資產 / 身份'],['notion','🪷 Notion','工作區頁面'],['google','🌐 Google','帳號 / Drive']];",
    "    const wrap = document.createElement('div');",
    "    wrap.style.cssText = 'max-width:640px;margin:26px auto 0;display:grid;gap:10px';",
    "    wrap.innerHTML = META.map(function (m) {",
    "      const id = m[0], name = m[1], desc = m[2];",
    "      const s = (st.providers || {})[id] || {};",
    "      let state, btn;",
    "      if (!st.kv) { state = '未綁定 KV'; btn = '<button disabled style=\"opacity:.4\">連接</button>'; }",
    "      else if (!s.configured) { state = '未配置 ' + (s.missing || []).join(','); btn = '<button disabled style=\"opacity:.4\">連接</button>'; }",
    "      else if (s.connected) { state = '已連接 ' + (s.label || id); btn = '<a class=\"btn-duo ghost\" href=\"#\" onclick=\"go(\\'connections\\');return false\" style=\"text-decoration:none;font-size:12px;padding:6px 12px\">管理</a>'; }",
    "      else { state = '準備就緒'; btn = '<a class=\"btn-duo\" href=\"/api/oauth/' + id + '/start\" style=\"text-decoration:none;font-size:12px;padding:6px 14px\">連接</a>'; }",
    "      return '<div style=\"display:flex;align-items:center;justify-content:space-between;gap:12px;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px 18px\">'",
    "        + '<div style=\"text-align:left\"><div style=\"font-weight:600;font-size:14px\">' + name + '</div>'",
    "        + '<div style=\"font-size:12px;color:var(--ink-3);margin-top:2px\">' + desc + ' · ' + state + '</div></div>' + btn + '</div>';",
    "    }).join('');",
    "    const host2 = document.querySelector('#page-overview');",
    "    if (host2) host2.appendChild(wrap);",
    "  }).catch(function () {});",
    "}",
  ].join("\n"),
  "welcome tail cards"
);

/* 5) 侧栏次序 */
rep(
  '<div class="side-item active" data-page="overview"><span class="ic">🏠</span>總覽</div>',
  '<div class="side-item active" data-page="overview"><span class="ic">🏠</span>總覽</div>\n  <div class="side-item" data-page="connections"><span class="ic">🔗</span>平台連接</div>',
  "sidebar add"
);
rep('\n  <div class="side-item" data-page="connections"><span class="ic">🔗</span>平台連接</div>', "", "sidebar dup remove");

writeFileSync(`${DEP}/index.html`, h);
console.log("replacements:", n, "| size:", h.length);
const need = ["yamiLoadDemo", "__demoAvailable", "connected = st.kv", "api/oauth/notion/start"];
const miss = need.filter(k => !h.includes(k));
console.log("verify:", miss.length ? "MISSING " + miss : "ALL OK");
