// fix-login-landing.mjs — 登錄首屏（edgetunnel 邏輯 × YamiHub 美學）：帶標籤頁的登錄頁作為未連接時的第一屏
import { readFileSync, writeFileSync } from "node:fs";
const DEP = "C:/Users/cao41/.openclaw-autoclaw/workspace/projects/yami-hub/deploy";
let h = readFileSync(`${DEP}/index.html`, "utf8");
let n = 0;
const rep = (from, to, label) => {
  if (!h.includes(from)) { console.error("MISS: " + label); process.exit(1); }
  h = h.split(from).join(to); n++;
};

/* 1) 注入登錄首屏 section（放在 main 開頭，page-login） */
rep(
  "<main class=\"main\">",
  `<main class="main">
  <!-- ================= 登錄首屏（未連接時的第一屏） ================= -->
  <section class="page" id="page-login">
    <div style="max-width:720px;margin:6vh auto 0;padding:0 20px;text-align:center">
      <div style="font-size:52px;line-height:1">🐙</div>
      <h1 style="margin:18px 0 8px;font-size:28px;letter-spacing:-.01em">歡迎來到 YamiHub</h1>
      <p style="color:var(--ink-2);font-size:15px;line-height:1.8;max-width:520px;margin:0 auto">
        連接你自己的帳號，面板就會長成你的樣子——<br>倉庫、星標、任務與評分全部實時來自你的數據。令牌只存你部署的 KV，絕不返回瀏覽器。
      </p>
      <!-- 標籤頁 -->
      <div id="loginTabs" style="display:flex;gap:8px;justify-content:center;margin:26px 0 14px;flex-wrap:wrap">
        <button class="lt-tab active" data-tab="github">🐙 GitHub</button>
        <button class="lt-tab" data-tab="notion">🪷 Notion</button>
        <button class="lt-tab" data-tab="google">🌐 Google</button>
      </div>
      <div id="loginCards" style="text-align:left;max-width:560px;margin:0 auto">檢查連接狀態…</div>
      <div style="margin-top:22px">
        <a href="#" onclick="yamiLoadDemo();return false" style="color:var(--ink-3);font-size:13px;text-decoration:none;border-bottom:1px dashed var(--line)">暫不登錄，先看 demo 效果 →</a>
      </div>
    </div>
    <style>
      .lt-tab { font:inherit;font-size:13.5px;padding:8px 18px;border-radius:999px;border:1px solid var(--line);
        background:transparent;color:var(--ink-2);cursor:pointer;transition:all .16s ease; }
      .lt-tab:hover { border-color:var(--ink-3); }
      .lt-tab.active { background:var(--ink);color:var(--bg);border-color:var(--ink);font-weight:600; }
      .lt-card { background:var(--card);border:1px solid var(--line);border-radius:16px;padding:22px 24px;
        animation:ltFade .22s ease; }
      @keyframes ltFade { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }
      .lt-card h3 { font-size:16px;margin:0 0 6px; }
      .lt-card .sub { font-size:12.5px;color:var(--ink-3);margin-bottom:14px; }
      .lt-card ul { list-style:none;padding:0;margin:0 0 16px; }
      .lt-card li { font-size:13.5px;color:var(--ink-2);padding:5px 0 5px 22px;position:relative; }
      .lt-card li::before { content:'';position:absolute;left:4px;top:12px;width:7px;height:7px;border-radius:2px;background:var(--lime-deep,#58cc02); }
      .lt-status { font-size:12.5px;color:var(--ink-3);margin-top:12px;line-height:1.7; }
      .lt-cta { display:inline-block;font-size:14px;padding:10px 26px;border-radius:12px;background:var(--ink);color:var(--bg);
        text-decoration:none;font-weight:600;transition:opacity .15s ease; }
      .lt-cta:hover { opacity:.85; }
      .lt-cta.disabled { opacity:.4;pointer-events:none; }
    </style>
  </section>`,
  "login landing section"
);

/* 2) go() 掛鉤：登錄頁渲染 */
rep(
  "if (page === 'maps') { renderMaps(); ArchLiveBoot(); }",
  "if (page === 'maps') { renderMaps(); ArchLiveBoot(); }\n  if (page === 'login') renderLoginLanding();",
  "go hook login"
);

/* 3) 登錄頁邏輯：標籤切換 + 狀態卡（前言後語：每個標籤講清連接後發生什麼） */
rep(
  "/* ---------- 主题切换 ---------- */",
  `/* ---------- 登錄首屏邏輯 ---------- */
const LOGIN_META = {
  github: {
    name: 'GitHub', glyph: '🐙',
    desc: '倉庫資產 · 身份 · 即時同步',
    perks: ['拉取你的全部倉庫（含你有權限的私有庫）自動入庫評分', '星標清單按領域分區進畫廊', 'SPI 評分 / 資產地圖 / 權重實驗室全部跟著你的數據走'],
    scopes: '只讀權限：read:user · public_repo（不改你任何倉庫）',
  },
  notion: {
    name: 'Notion', glyph: '🪷',
    desc: '工作區頁面 · 數據庫 · 任務流',
    perks: ['讀取你在授權時勾選的頁面與數據庫', '任務 & DDL 頁直接對接你的 Notion 待辦', '沒勾選的頁面面板永遠看不到——邊界由你掌握'],
    scopes: '授權時可隨時勾選/取消共享頁面範圍',
  },
  google: {
    name: 'Google', glyph: '🌐',
    desc: '帳號身份 · Drive（二期接入）',
    perks: ['驗證你的身份用於面板個性化', 'v0.3 起：Drive 文檔接入資產畫廊', 'Testing 模式：僅測試名單內帳號可登錄'],
    scopes: '當前僅 openid + email，不動你的雲盤',
  },
};
let __loginState = null;
async function renderLoginLanding() {
  const host = document.getElementById('loginCards');
  if (!host) return;
  if (!__loginState) {
    try { __loginState = await (await fetch('/api/connections')).json(); }
    catch (e) { __loginState = { providers: {}, kv: false }; }
  }
  const st = __loginState;
  const active = host.dataset.tab || 'github';
  // 標籤 active 態
  document.querySelectorAll('#loginTabs .lt-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === active));
  const m = LOGIN_META[active];
  const s = (st.providers || {})[active] || {};
  let status, cta;
  if (!st.kv) {
    status = '⚠ 部署端還沒綁定 KV——到 Cloudflare「設置 → 綁定」添加 KV 命名空間，變量名必須是 KV，然後重新部署。';
    cta = '<a class="lt-cta disabled">暫不可連接</a>';
  } else if (!s.configured) {
    status = '⚠ 缺環境變量：' + (s.missing || []).join(', ') + '。自查三步：① 變量加在「生產環境」區 ② 名字逐字核對 ③ 配完重新拖一次部署包。';
    cta = '<a class="lt-cta disabled">暫不可連接</a>';
  } else if (s.connected) {
    status = '✅ 已連接 ' + esc(s.label || active) + '——<a href="#" onclick="go(\\'overview\\');return false" style="color:inherit">進入面板 →</a>';
    cta = '<a class="lt-cta" href="/api/oauth/' + active + '/start">重新授權</a>';
  } else {
    status = '準備就緒 · ' + esc(m.scopes);
    cta = '<a class="lt-cta" href="/api/oauth/' + active + '/start">連接 ' + esc(m.name) + ' →</a>';
  }
  host.dataset.tab = active;
  host.innerHTML = '<div class="lt-card">'
    + '<h3>' + m.glyph + ' ' + esc(m.name) + '</h3>'
    + '<div class="sub">' + esc(m.desc) + '</div>'
    + '<ul>' + m.perks.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ul>'
    + cta
    + '<div class="lt-status">' + status + '</div>'
    + '</div>';
  host.querySelectorAll('#loginTabs .lt-tab').forEach(b => b.onclick = function () { host.dataset.tab = b.dataset.tab; renderLoginLanding(); });
}

/* ---------- 主题切换 ---------- */`,
  "login logic"
);

/* 4) boot：未連接 → 直接進登錄首屏（而不是空總覽） */
rep(
  "  } catch (e) { connected = false; }\n  if (connected) {",
  "  } catch (e) { connected = false; }\n  if (!connected) window.__forceLoginLanding = true;\n  if (connected) {",
  "boot flag"
);
rep(
  "const _go = go;\ngo = function(page) { _go(page); if (page === 'overview') yamiPatchOverview(); };",
  "const _go = go;\ngo = function(page) { _go(page); if (page === 'overview') yamiPatchOverview(); };\nif (window.__forceLoginLanding) { go('login'); }",
  "boot route login"
);

writeFileSync(`${DEP}/index.html`, h);
console.log("replacements:", n, "| size:", h.length);
const need = ["page-login", "loginTabs", "renderLoginLanding", "LOGIN_META", "__forceLoginLanding"];
const miss = need.filter(k => !h.includes(k));
console.log("verify:", miss.length ? "MISSING " + miss : "ALL OK");
