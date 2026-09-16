// fix-motion2.mjs — MotionSites 落地第二波：修好錨點，全部一次跑完
import { readFileSync, writeFileSync } from "node:fs";
const DEP = "C:/Users/cao41/.openclaw-autoclaw/workspace/projects/yami-hub/deploy";
let h = readFileSync(`${DEP}/index.html`, "utf8");
let css = readFileSync(`${DEP}/assets/os2.css`, "utf8");
let n = 0;
const repH = (from, to, label) => {
  if (!h.includes(from)) { console.error("MISS(html): " + label); process.exit(1); }
  h = h.split(from).join(to); n++;
};
const repC = (from, to, label) => {
  if (!css.includes(from)) { console.error("MISS(css): " + label); process.exit(1); }
  css = css.split(from).join(to); n++;
};

/* 1. Toast（第一波已沒跑成，這裡做） */
repH(
  "/* ---------- 全局 XSS 防护 ---------- */",
  `/* ---------- Toast 通知（輕、快、不打斷） ---------- */
function toast(msg, kind) {
  let wrap = document.getElementById('toastWrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = 'toastWrap';
    wrap.style.cssText = 'position:fixed;top:18px;right:18px;z-index:9999;display:flex;flex-direction:column;gap:8px;pointer-events:none';
    document.body.appendChild(wrap);
  }
  const t = document.createElement('div');
  t.style.cssText = 'pointer-events:auto;min-width:200px;max-width:340px;padding:12px 16px;border-radius:12px;'
    + 'background:var(--card);border:1px solid ' + (kind === 'err' ? 'var(--red,#ff4b4b)' : 'var(--lime-deep,#58cc02)') + ';'
    + 'box-shadow:var(--shadow-lg,0 10px 30px rgba(0,0,0,.12));font-size:13px;color:var(--ink);'
    + 'transform:translateX(24px);opacity:0;transition:transform .18s ease,opacity .18s ease';
  t.textContent = msg;
  wrap.appendChild(t);
  requestAnimationFrame(() => { t.style.transform = 'none'; t.style.opacity = '1'; });
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(24px)'; setTimeout(() => t.remove(), 200); }, 3600);
}

/* ---------- 全局 XSS 防护 ---------- */`,
  "toast"
);
repH("} catch (e) { alert('導入失敗：' + e.message); }", "} catch (e) { toast('導入失敗：' + e.message, 'err'); }", "alert swap");

/* 2. 交錯入場 */
repC(
  ".page.show { display:block; animation:pop .25s ease; }",
  `.page.show { display:block; animation:pop .25s ease; }
.page.show .spec-grid > *, .page.show .tile, .page.show .bcard, .page.show .task { animation:rise .34s ease backwards; }
.page.show .spec-grid > *:nth-child(1) { animation-delay:.02s; }
.page.show .spec-grid > *:nth-child(2) { animation-delay:.06s; }
.page.show .spec-grid > *:nth-child(3) { animation-delay:.10s; }
.page.show .spec-grid > *:nth-child(4) { animation-delay:.14s; }
.page.show .spec-grid > *:nth-child(5) { animation-delay:.18s; }
.page.show .spec-grid > *:nth-child(6) { animation-delay:.22s; }
.page.show .spec-grid > *:nth-child(n+7) { animation-delay:.26s; }
@keyframes rise { from{opacity:0;transform:translateY(10px) scale(.985)} to{opacity:1;transform:none} }
@media (prefers-reduced-motion: reduce) { .page.show *, .page.show { animation:none !important; transition:none !important; } }`,
  "stagger"
);

/* 3. 側欄活動指示條 */
repC(".side-item {", ".side-item { position:relative;", "side relative");
repC(
  ".side-item.active {",
  `.side-item.active::before { content:'';position:absolute;left:-14px;top:22%;height:56%;width:3px;border-radius:2px;
  background:var(--lime-deep);box-shadow:0 0 8px rgba(88,204,2,.55); }
.side-item.active {`,
  "active bar"
);

/* 4. KV 狀態常駐點 */
repH(
  '<button class="btn-duo ghost" id="themeToggle"',
  `<span id="kvDot" title="KV 狀態" style="display:inline-flex;align-items:center;gap:5px;margin-right:8px;font-size:11px;color:var(--ink-3)">
     <span id="kvDotInner" style="width:7px;height:7px;border-radius:50%;background:#d1d5db;display:inline-block"></span><span id="kvDotText"></span>
   </span>
   <button class="btn-duo ghost" id="themeToggle"`,
  "kv dot slot"
);
repH(
  "async function renderConnections() {",
  `function paintKvDot(kv) {
  const d = document.getElementById('kvDotInner'), t = document.getElementById('kvDotText');
  if (!d) return;
  d.style.background = kv ? 'var(--lime-deep,#58cc02)' : '#d1d5db';
  if (t) t.textContent = kv ? 'KV' : '';
  const s = document.getElementById('kvDot');
  if (s) s.title = kv ? 'KV 已綁定 — 會話與令牌存儲就緒' : '未綁定 KV — 到 Pages 設置 → 綁定添加（變量名 KV）';
}
async function renderConnections() {`,
  "kv dot fn"
);
repH(
  "    } catch (e) { CONN_STATE = { providers: {}, kv: false }; }",
  "    } catch (e) { CONN_STATE = { providers: {}, kv: false }; }\n    paintKvDot(CONN_STATE.kv);",
  "kv dot call"
);

/* 5. ★ 地圖同步重建修復：ArchLiveBoot 有 m2Rendered 式單次守衛 → 加 invalidation */
repH(
  "let __alMap = null, __alBooted = false;",
  "let __alMap = null, __alBooted = false;\nwindow.__invalidateMap = function () { __alBooted = false; __alMap = null; const host = document.getElementById('alStage'); if (host) host.innerHTML = ''; };",
  "invalidate fn"
);
// 同步完成/還原後失效地圖緩存（三處）
repH(
  "      openBoardSuggestions(r2);",
  "      openBoardSuggestions(r2);\n      window.__invalidateMap();",
  "invalidate autosync"
);
repH(
  "    try { openBoardSuggestions(repos2); } catch (e) {}",
  "    try { openBoardSuggestions(repos2); } catch (e) {}\n    window.__invalidateMap();",
  "invalidate manual sync"
);
repH(
  "      const r2 = YamiLive.apply(restored.repositories);\n      renderOverview(r2); chipsRender(); paintAssets(); initAlgo(r2);\n      go('overview');",
  "      const r2 = YamiLive.apply(restored.repositories);\n      renderOverview(r2); chipsRender(); paintAssets(); initAlgo(r2);\n      window.__invalidateMap();\n      go('overview');",
  "invalidate restore"
);

writeFileSync(`${DEP}/index.html`, h);
writeFileSync(`${DEP}/assets/os2.css`, css);
console.log("replacements:", n);
const needH = ["toastWrap", "kvDot", "__invalidateMap"];
const needC = ["animation:rise", "side-item.active::before", "prefers-reduced-motion"];
console.log("html:", needH.filter(k => !h.includes(k)).length ? "MISS " + needH.filter(k => !h.includes(k)) : "OK");
console.log("css:", needC.filter(k => !css.includes(k)).length ? "MISS" : "OK");
