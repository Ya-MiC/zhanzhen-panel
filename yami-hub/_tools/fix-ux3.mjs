// fix-ux3.mjs — 主题切换（浅/深/跟随系统）+ env 淨化 + Google secret 自检提示
import { readFileSync, writeFileSync } from "node:fs";
const DEP = "C:/Users/cao41/.openclaw-autoclaw/workspace/projects/yami-hub/deploy";
let h = readFileSync(`${DEP}/index.html`, "utf8");
let w = readFileSync(`${DEP}/_worker.js`, "utf8");
let n = 0;
const repH = (from, to, label) => {
  if (!h.includes(from)) { console.error("MISS(html): " + label); process.exit(1); }
  h = h.split(from).join(to); n++;
};
const repW = (from, to, label) => {
  if (!w.includes(from)) { console.error("MISS(worker): " + label); process.exit(1); }
  w = w.split(from).join(to); n++;
};

/* ============ 1. 主题切换 ============ */
/* 面板 CSS 已有 prefers-color-scheme dark 变量；加手动切换：
   <html data-theme="light|dark"> + data-theme 覆盖变量 + 顶栏按钮 + localStorage 记忆 */

// 1c. 顶栏切换按钮（插在 登錄 按钮前）
repH(
  '<button class="btn-duo ghost" id="topUnlock">🔗<span class="btxt"> 登錄</span></button>',
  `<button class="btn-duo ghost" id="themeToggle" title="切换主题">🌓<span class="btxt"> 主題</span></button> <button class="btn-duo ghost" id="topUnlock">🔗<span class="btxt"> 登錄</span></button>`,
  "theme button"
);

// 1d. 切换逻辑（挂在 ArchLive 注释锚点前）
repH(
  "/* ---------- ArchLive 活体地图 ---------- */",
  `/* ---------- 主题切换 ---------- */
(function () {
  const KEY = 'yamiTheme';
  function apply(t) {
    if (t === 'auto') { document.documentElement.removeAttribute('data-theme'); }
    else { document.documentElement.setAttribute('data-theme', t); }
    try { localStorage.setItem(KEY, t); } catch (e) {}
    const b = document.getElementById('themeToggle');
    if (b) b.querySelector('.btxt').textContent = t === 'dark' ? '深色' : t === 'light' ? '淺色' : '主題';
  }
  let cur = 'auto';
  try { cur = localStorage.getItem(KEY) || 'auto'; } catch (e) {}
  apply(cur);
  document.addEventListener('DOMContentLoaded', function () {
    const b = document.getElementById('themeToggle');
    if (b) b.addEventListener('click', function () {
      const order = ['auto', 'light', 'dark'];
      const now = document.documentElement.getAttribute('data-theme') || 'auto';
      apply(order[(order.indexOf(now) + 1) % 3]);
    });
  });
})();

/* ---------- ArchLive 活体地图 ---------- */`,
  "theme logic"
);

/* ============ 2. Google secret 自检提示（未配置时给三条自查） ============ */
repH(
  "else if (!s.configured) { sub = '未配置环境变量：' + (s.missing || []).join('、'); btn = '<button disabled>连接</button>'; }",
  "else if (!s.configured) { sub = '未配置环境变量：' + (s.missing || []).join('、') + '（自查：①变量是否在「生产环境」区 ②名字逐字核对 ③配了之后有没有重新拖一次部署包）'; btn = '<button disabled>连接</button>'; }",
  "config hint"
);

/* ============ 3. Worker env 淨化：trim + 去 BOM/引号（抗手滑） ============ */
repW(
  "export default {\n  async fetch(request, env) {",
  `function cleanEnv(e) {
  // 用户在 CF 面板手滑贴进空格/引号/BOM 是常见事故：统一净化一次
  const out = {};
  for (const [k, v] of Object.entries(e || {})) {
    if (typeof v !== "string") { out[k] = v; continue; }
    let s = v.replace(/^\\uFEFF/, "").trim();
    if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) s = s.slice(1, -1).trim();
    out[k] = s;
  }
  return out;
}

export default {
  async fetch(request, env) {
    env = cleanEnv(env);`,
  "worker env clean"
);

writeFileSync(`${DEP}/index.html`, h);
writeFileSync(`${DEP}/_worker.js`, w);
console.log("replacements:", n);
const needH = ['data-theme="dark"', "themeToggle", "yamiTheme"];
const needW = ["cleanEnv"];
console.log("html verify:", needH.filter(k => !h.includes(k)).length ? "MISS " + needH.filter(k => !h.includes(k)) : "OK");
console.log("worker verify:", needW.filter(k => !w.includes(k)).length ? "MISS" : "OK");
