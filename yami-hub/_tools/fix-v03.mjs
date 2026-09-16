// fix-v03.mjs — v0.3 三件套：logo 上崗 / 私有倉庫授權 / 分類建議複核流
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

/* ===== 1. Logo 三處上崗 ===== */
repH("<title>YamiHub · Portfolio OS（ya-mic-os 迭代）</title>",
  '<title>YamiHub · Portfolio OS（ya-mic-os 迭代）</title>\n<link rel="icon" type="image/png" href="assets/favicon.png">', "favicon");
repH('<span class="logo">🐙</span>YamiHub', '<span class="logo"><img src="assets/logo.jpg" alt="YamiHub" style="width:26px;height:26px;border-radius:8px;object-fit:cover;vertical-align:-6px"></span>YamiHub', "sidebar logo");
repH('<div style="font-size:52px;line-height:1">🐙</div>',
  '<img src="assets/logo.jpg" alt="YamiHub" style="width:64px;height:64px;border-radius:16px;object-fit:cover">', "login hero");

/* ===== 2. 私有倉庫授權：GITHUB_SCOPE 默認加 repo（含私有）===== */
repW('scope=${encodeURIComponent(e.GITHUB_SCOPE || "read:user public_repo")}',
  'scope=${encodeURIComponent(e.GITHUB_SCOPE || "read:user repo")}', "scope repo");
// 文案同步（回調後端說明）
repH("只讀權限：read:user · public_repo（不改你任何倉庫）",
  "讀權限：read:user · repo（讀取含私有倉庫；永不寫你的任何倉庫）", "scope text");

/* ===== 3. 同步翻頁上限 3→5（500 倉庫覆蓋你的 73+綽綽有餘） ===== */
repW("for (let page = 1; page <= 3; page++)", "for (let page = 1; page <= 5; page++)", "sync pages");
// 同步接口也把私有倉庫的 visibility 補對（affiliation=owner 已含私有，保持）

/* ===== 4. 分類建議複核流（Suggest-Accept）：總覽同步後彈出建議卡 ===== */
repH(
  "/* ---------- ArchLive 活体地图 ---------- */",
  `/* ---------- 分類建議複核流（v0.3 Suggest-Accept） ----------
 * 規則引擎按倉庫描述自動建議分區（P/T/R/I/F），用戶逐條接受或改判。
 * 覆蓋結果存 localStorage（yamiHub.boardOverrides），renderOverview 前套用。 */
const YamiBoard = {
  KEY: 'yamiHub.boardOverrides',
  load() { try { return JSON.parse(localStorage.getItem(this.KEY) || '{}'); } catch (e) { return {}; } },
  save(o) { try { localStorage.setItem(this.KEY, JSON.stringify(o)); } catch (e) {} },
  set(name, board) { const o = this.load(); o[name] = board; this.save(o); },
  get(name) { return this.load()[name] || null; },
};

let __suggestQueue = null;
function suggestBoardOf(r) {
  // 與 archify-live.classifyRepo 同思路，但產出五分區（P/T/R/I/F）
  const hay = ((r.name || '') + ' ' + (r.one_liner || '') + ' ' + (r.description || '')).toLowerCase();
  if (r.fork) return 'F';
  if (/agent|skill|prompt|ocr|llm|rag|automat|tool|cli|plugin/.test(hay)) return 'T';
  if (/study|learn|note|quant|trading|research|economics|tutorial/.test(hay)) return 'R';
  if (/infra|deploy|docker|runner|ci|cd|dns|proxy|monitor|worker/.test(hay)) return 'I';
  if (/panel|site|web|app|saas|platform|dashboard|blog|portfolio|system/.test(hay)) return 'P';
  return 'T';
}
function openBoardSuggestions(repos) {
  const overrides = YamiBoard.load();
  __suggestQueue = repos.filter(r => !overrides[r.name]).slice(0, 12); // 一次最多 12 條建議
  if (!__suggestQueue.length) return;
  renderSuggestCard();
}
function renderSuggestCard() {
  let host = document.getElementById('suggestCard');
  if (!host) {
    host = document.createElement('div');
    host.id = 'suggestCard';
    host.style.cssText = 'position:fixed;right:20px;bottom:20px;width:340px;max-height:70vh;overflow:auto;background:var(--card);border:1px solid var(--line);border-radius:16px;box-shadow:var(--shadow-lg);padding:16px 18px;z-index:99;font-size:13px';
    document.body.appendChild(host);
  }
  if (!__suggestQueue || !__suggestQueue.length) { host.remove(); return; }
  const r = __suggestQueue[0];
  const sug = suggestBoardOf(r);
  const BOARDS = [['P','🟣 產品線'],['T','🟢 工具/Agent'],['R','🔵 研究/學習'],['I','🟠 基礎設施'],['F','🍴 Fork']];
  host.innerHTML = '<div style="font-weight:700;margin-bottom:4px">🧠 分類建議 <span style="color:var(--ink-3);font-weight:400;font-size:11px">（規則引擎 · 你說了算）</span></div>'
    + '<div style="background:var(--bg-soft);border-radius:10px;padding:10px 12px;margin-bottom:10px">'
    + '<b>' + esc(r.name) + '</b><div style="color:var(--ink-3);font-size:12px;margin-top:2px">' + esc((r.one_liner || r.description || '').slice(0, 60)) + '</div></div>'
    + '<div style="margin-bottom:8px">建議分區：<b>' + sug + '</b></div>'
    + '<div style="display:flex;gap:6px;flex-wrap:wrap">'
    + BOARDS.map(([k, label]) => k === sug
        ? '<button class="bs-btn" data-b="' + k + '" style="background:var(--ink);color:var(--bg)">' + label + ' ✓</button>'
        : '<button class="bs-btn" data-b="' + k + '">' + label + '</button>').join('')
    + '</div>'
    + '<div style="display:flex;justify-content:space-between;margin-top:10px">'
    + '<button id="bsSkip" style="background:none;border:none;color:var(--ink-3);cursor:pointer;font-size:12px">跳過</button>'
    + '<span style="color:var(--ink-3);font-size:11px">' + __suggestQueue.length + ' 條待確認</span></div>'
    + '<style>.bs-btn{font:inherit;font-size:12px;padding:6px 10px;border-radius:8px;border:1px solid var(--line);background:transparent;cursor:pointer}.bs-btn:hover{border-color:var(--ink-3)}</style>';
  host.querySelectorAll('.bs-btn').forEach(b => b.onclick = function () {
    YamiBoard.set(r.name, this.dataset.b);
    __suggestQueue.shift();
    renderSuggestCard();
    if (!__suggestQueue.length) { host.remove(); chipsRender(); paintAssets(); }
  });
  document.getElementById('bsSkip').onclick = function () { __suggestQueue.shift(); renderSuggestCard(); };
}

/* ---------- ArchLive 活体地图 ---------- */`,
  "suggest flow"
);

/* 同步完成後觸發建議卡（自動同步 + 手動同步兩處） */
repH(
  "      const pass = await YamiVault.save(r2);\n      renderOverview(r2); chipsRender(); paintAssets(); initAlgo(r2);\n      YamiVault.showPassOnce(pass);",
  "      const pass = await YamiVault.save(r2);\n      renderOverview(r2); chipsRender(); paintAssets(); initAlgo(r2);\n      YamiVault.showPassOnce(pass);\n      openBoardSuggestions(r2);",
  "suggest after autosync"
);
repH(
  "    try { const pass = await YamiVault.save(repos2); YamiVault.showPassOnce(pass); } catch (e) {}",
  "    try { const pass = await YamiVault.save(repos2); YamiVault.showPassOnce(pass); } catch (e) {}\n    try { openBoardSuggestions(repos2); } catch (e) {}",
  "suggest after manual sync"
);

/* boardOf 尊重用戶覆蓋 */
repH(
  "function boardOf(r) {\n  if (r.board) return r.board;",
  "function boardOf(r) {\n  const ov = (typeof YamiBoard !== 'undefined') && YamiBoard.get(r.name);\n  if (ov) return ov;\n  if (r.board) return r.board;",
  "boardOf override"
);

writeFileSync(`${DEP}/index.html`, h);
writeFileSync(`${DEP}/_worker.js`, w);
console.log("replacements:", n);
const needH = ["suggestCard", "YamiBoard", "assets/logo.jpg", "favicon.png", "read:user repo"];
const needW = "read:user repo";
console.log("html verify:", needH.filter(k => !h.includes(k)).length ? "MISS " + needH.filter(k => !h.includes(k)) : "OK");
console.log("worker verify:", w.includes(needW) ? "OK" : "MISS");
