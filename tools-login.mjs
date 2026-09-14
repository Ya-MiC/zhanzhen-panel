// fix-login.mjs v2 — 用正则做 HTML 块替换（空白不敏感），其余同前
import { readFileSync, writeFileSync } from "node:fs";
const DEP = "C:/Users/cao41/.openclaw-autoclaw/workspace/projects/yami-hub/deploy";
let h = readFileSync(`${DEP}/index.html`, "utf8");
let n = 0;
const rep = (from, to, label) => {
  if (!h.includes(from)) { console.error("MISS: " + label); process.exit(1); }
  h = h.split(from).join(to); n++;
};
const rex = (pattern, to, label) => {
  const re = new RegExp(pattern);
  if (!re.test(h)) { console.error("REX MISS: " + label); process.exit(1); }
  h = h.replace(re, to); n++;
};

/* 1) 品牌 */
rep('<span class="logo">🐙</span>Ya-MiC OS', '<span class="logo">🐙</span>YamiHub', "brand");
rex('<div>🐙 Ya-MiC Portfolio OS · Skill 3\\.0 · <b>v3\\.1</b></div>',
    '<div>🐙 YamiHub · Portfolio OS（ya-mic-os 迭代）· <b>v0.1</b></div>', "footer brand");

/* 2) 顶部按钮 */
rep('<button class="btn-duo ghost" id="topUnlock">🔒<span class="btxt"> 私有</span></button>',
    '<button class="btn-duo ghost" id="topUnlock">🔗<span class="btxt"> 登錄</span></button>', "top button");

/* 3) 口令解锁卡 → 登录卡（正则，空白兼容） */
rex(
  '<div class="lock-card" id="learnLock">\\s*<div class="le">[^<]*</div>\\s*<h3>解鎖私有視圖</h3>\\s*<p>[\\s\\S]*?</p>\\s*<div class="lock-row">\\s*<input[^>]*>\\s*<button[^>]*>解鎖</button>\\s*</div>\\s*<div class="lock-err" id="lockErr"></div>\\s*</div>',
  `<div class="lock-card" id="learnLock">
      <div class="le">🔗</div>
      <h3>連接你的帳號</h3>
      <p>登錄你的 GitHub / Notion / Google，面板即變成你的資產視圖——你有權限的私有倉庫會直接載入，無需任何口令。令牌只存在你部署的 KV 裡，不返回瀏覽器。</p>
      <div class="lock-row">
        <button class="btn-duo" data-conn="github">🐙 連接 GitHub</button>
        <button class="btn-duo ghost" data-conn="notion">🪷 連接 Notion</button>
        <button class="btn-duo ghost" data-conn="google">🌐 連接 Google</button>
      </div>
      <div class="lock-err" id="lockErr"></div>
    </div>`,
  "login card"
);

/* 5) 横幅 */
rep('<div class="unlock-banner" id="unlockBanner">🔓 私有視圖已解鎖 — 14 個私有倉庫完整資料已載入</div>',
    '<div class="unlock-banner" id="unlockBanner">✅ 已連接你的帳號 — 你的倉庫資料已載入（含你有權限的私有倉庫）</div>', "banner");

/* 6) unlock() → legacy guard */
rep(`async function unlock() {
  const pass = document.getElementById('passInput').value;`,
    `async function unlock() {
  go('connections'); return; /* 口令已退役：OAuth 登录替代 */
  const pass = document.getElementById('passInput').value;`,
    "unlock func");

/* 7) Star 卡 */
rep('<h4>Star</h4><p>收藏別人的專案，42 個已入畫廊並按領域分區。</p>',
    '<h4>Star</h4><p>收藏別人的專案，連接後自動入畫廊並按領域分區。</p>', "star card");

/* 8) 地图死数字 */
rep("m6: ['🗂️ Starred 分類圖', '42 個 Starred 按七大領域分區', ['Agent 技能 15', '量化金融 9', '全部節點可點 ↗']]",
    "m6: ['🗂️ Starred 分類圖', 'Starred 按領域分區（連接後按你的資料生成）', ['連接 GitHub', '同步資料', '全部節點可點 ↗']]", "map m6");
rep("['wrap-m6', '05', '🗂️', 'Starred 分類圖', '42 個星標 · 七大領域', false]",
    "['wrap-m6', '05', '🗂️', 'Starred 分類圖', '星標 · 按領域分區', false]", "map nav m6");

/* 9) 登录按钮接线 */
rep(`document.getElementById('unlockBtn').addEventListener('click', unlock);
document.getElementById('passInput').addEventListener('keydown', e => { if (e.key === 'Enter') unlock(); });`,
    `document.querySelectorAll('#learnLock [data-conn]').forEach(b => b.addEventListener('click', () => { location.href = '/api/oauth/' + b.dataset.conn + '/start'; }));`,
    "login buttons wiring");

/* 10) topUnlock 接线 */
rep(`document.getElementById('topUnlock').addEventListener('click', () => { go('learn'); setTimeout(() => document.getElementById('passInput').focus(), 100); });`,
    `document.getElementById('topUnlock').addEventListener('click', () => { go('connections'); });`,
    "top button wiring");

/* 12) 解锁后顶部按钮状态文案 */
rep("document.getElementById('topUnlock').textContent = '🔓 已解鎖';",
    "document.getElementById('topUnlock').textContent = '✅ 已連接';", "top post state");

writeFileSync(`${DEP}/index.html`, h);
console.log("replacements:", n, "| size:", h.length);
const bad = ["Ya-MiC OS", "解鎖私有視圖", "私有口令", "14 個私有", "42 個已入畫廊", "42 個 Starred 按七大"];
const left = bad.filter(b => h.includes(b));
console.log("leftover:", left.length ? left.join(" | ") : "(none)");
