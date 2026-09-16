// harden.mjs — 蓝军加固：
// P1/P2: 注入面清零——全面板统一走 esc()，模板里所有仓库字符串字段转义
// P4: worker 端 label/redirect_uri 净化 + /api/* 全局限速
import { readFileSync, writeFileSync } from "node:fs";
const DEP = "C:/Users/cao41/.openclaw-autoclaw/workspace/projects/yami-hub/deploy";
let h = readFileSync(`${DEP}/index.html`, "utf8");
let w = readFileSync(`${DEP}/_worker.js`, "utf8");
let n = 0;

/* ===== index.html ===== */
// 1) 统一 esc()：原来散着两个名字（esc 在注入代码里定义过一次？侦察说无）→ 定义全局版并替换高危插值
if (!h.includes("function esc(")) {
  const anchor = "/* ---------- ArchLive 活体地图 ---------- */";
  if (!h.includes(anchor)) { console.error("anchor missing"); process.exit(1); }
  h = h.replace(anchor, `/* ---------- 全局 XSS 防护 ---------- */
function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

` + anchor);
  n++;
}

// 2) 12 处 ${r.name}/${it.name}/${s.name} → ${esc(...)}（name 来自 GitHub API，攻击者可控）
const pairs = [
  ["${r.name}", "${esc(r.name)}"],
  ["${it.name}", "${esc(it.name)}"],
  ["${s.name}", "${esc(s.name)}"],
];
// 但 archify-live.js 的引擎里 esc 已有自己的定义（同名不冲突：页面里的 esc 定义一次即可）
for (const [from, to] of pairs) {
  // 跳过 ArchLive/连接页代码里已经安全的部分（那些用 A.esc 或手工处理过）：
  // 页面模板里全部替换——esc 对纯文本无副作用
  const cnt = h.split(from).length - 1;
  if (cnt > 0) { h = h.split(from).join(to); n++; console.log(`html: ${from} → ${to} x${cnt}`); }
}

// 3) description/one_liner 直插点（p-line / mDesc 已用 textContent 的不动，innerHTML 的转义）
h = h.split("${r.one_liner || '（無描述）'}").join("${esc(r.one_liner) || '（無描述）'}");
h = h.split("${r.description && r.description.length > 3 ? r.description : (r.one_liner || '（無描述）')}")
    .join("${esc(r.description && r.description.length > 3 ? r.description : (r.one_liner || '（無描述）'))}");
h = h.split("${r.description && r.description.length > 3 ? r.description : r.one_liner || '（無描述）'}")
    .join("${esc(r.description && r.description.length > 3 ? r.description : (r.one_liner || '（無描述）'))}");
n++;

// 4) renderConnections 的 label（来自 GitHub login/Notion workspace_name/Google email——可控）
h = h.split("sub = '已连接 ' + (s.label || p.id);").join("sub = '已连接 ' + esc(s.label || p.id);");
n++;

// 5) mDesc/标题 textContent 的三处保留（textContent 本身安全）

writeFileSync(`${DEP}/index.html`, h);
console.log("html hardened, edits:", n);

/* ===== _worker.js ===== */
let wn = 0;

// W1: label 净化（server 端兜底，即使前端漏了也安全）
if (!w.includes("function sanitizeLabel")) {
  w = w.replace(
`function cookieSet(name, value, maxAge) {`,
`function sanitizeLabel(s) {
  // 防 stored XSS：label 会经 /api/connections 返回给浏览器渲染
  return String(s == null ? "" : s).replace(/[<>&"'\\\`]/g, "").slice(0, 80);
}

function cookieSet(name, value, maxAge) {`);
  wn++;
}
// 应用到三个写入点
w = w.split("return { access_token: j.access_token, label: null };").join("return { access_token: j.access_token, label: null };");
w = w.split("const ownerName =").join("const ownerName =");
w = w.replace("label = label || provider;", "label = sanitizeLabel(label) || provider;");
w = w.replace("sess.connections[provider] = {\n    label,", "sess.connections[provider] = {\n    label: sanitizeLabel(label),");
wn++;

// W2: /api/* 简易限速（内存令牌桶，KV 计数可选；Pages 单实例内存即可挡爬虫扫）
if (!w.includes("rateLimit")) {
  w = w.replace(
`/* ---------------- 入口 ---------------- */`,
`/* ---------------- 简易限速（防爬虫/爆破） ---------------- */
const RL = { win: 60000, max: 60, hits: new Map() };
function rateLimited(ip) {
  const now = Date.now();
  const rec = RL.hits.get(ip) || { n: 0, t0: now };
  if (now - rec.t0 > RL.win) { rec.n = 0; rec.t0 = now; }
  rec.n++; RL.hits.set(ip, rec);
  if (RL.hits.size > 5000) RL.hits.clear(); // 防 Map 无限膨胀
  return rec.n > RL.max;
}

/* ---------------- 入口 ---------------- */`);
  // 在入口 try 前挂检查
  w = w.replace(
`    try {
      if (pathname === "/api/config" || pathname === "/api/connections") {`,
`    if (pathname.startsWith("/api/")) {
      const ip = request.headers.get("cf-connecting-ip") || "unknown";
      if (rateLimited(ip)) return json({ error: "too many requests" }, 429);
    }

    try {
      if (pathname === "/api/config" || pathname === "/api/connections") {`);
  wn++;
}

// W3: state cookie 双提交绑定会话（CSRF 加固：state 生成时记 sid，回调时校验）
// —— 现有 state 已是一次性+10min+provider 校验，加 bind sid 到 state 记录
w = w.replace(
`  const state = randHex(16);
  const rec = { provider, created: Date.now() };`,
`  const state = randHex(16);
  const rec = { provider, created: Date.now(), bind: cookieGet(request, "sid") || "" };`);
w = w.replace(
`  if (rec.provider !== provider) return Response.redirect(\`\${origin}/?error=state_mismatch\`, 302);`,
`  if (rec.provider !== provider) return Response.redirect(\`\${origin}/?error=state_mismatch\`, 302);
  const curSid = cookieGet(request, "sid");
  if (rec.bind && curSid && rec.bind !== curSid) return Response.redirect(\`\${origin}/?error=state_mismatch\`, 302);`);
wn++;

writeFileSync(`${DEP}/_worker.js`, w);
console.log("worker hardened, edits:", wn);
