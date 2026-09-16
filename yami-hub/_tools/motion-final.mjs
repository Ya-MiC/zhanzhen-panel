// motion-final.mjs — 一次成型：全部用 node 原生處理，做完即驗，錯了立即報哪一步
import { readFileSync, writeFileSync } from "node:fs";
const DEP = "C:/Users/cao41/.openclaw-autoclaw/workspace/projects/yami-hub/deploy";
let h = readFileSync(`${DEP}/index.html`, "utf8");
let css = readFileSync(`${DEP}/assets/os2.css`, "utf8");
const steps = [];
function step(name, fn) {
  try { fn(); steps.push("OK   " + name); }
  catch (e) { steps.push("FAIL " + name + " → " + e.message); }
}

/* 1. Toast */
step("toast system", () => {
  if (h.includes("function toast(")) throw new Error("already");
  const anchor = "/* ---------- 全局 XSS 防护 ---------- */";
  if (!h.includes(anchor)) throw new Error("anchor missing");
  const block = `/* ---------- Toast 通知 ---------- */
function toast(msg, kind) {
  let wrap = document.getElementById('toastWrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = 'toastWrap';
    wrap.style.cssText = 'position:fixed;top:18px;right:18px;z-index:9999;display:flex;flex-direction:column;gap:8px;pointer-events:none';
    document.body.appendChild(wrap);
  }
  const t = document.createElement('div');
  t.style.cssText = 'pointer-events:auto;min-width:200px;max-width:340px;padding:12px 16px;border-radius:12px;background:var(--card);border:1px solid ' + (kind === 'err' ? 'var(--red,#ff4b4b)' : 'var(--lime-deep,#58cc02)') + ';box-shadow:var(--shadow-lg,0 10px 30px rgba(0,0,0,.12));font-size:13px;color:var(--ink);transform:translateX(24px);opacity:0;transition:transform .18s ease,opacity .18s ease';
  t.textContent = msg;
  wrap.appendChild(t);
  requestAnimationFrame(function () { t.style.transform = 'none'; t.style.opacity = '1'; });
  setTimeout(function () { t.style.opacity = '0'; t.style.transform = 'translateX(24px)'; setTimeout(function () { t.remove(); }, 200); }, 3600);
}

`;
  h = h.replace(anchor, block + anchor);
});

/* 2. alert → toast */
step("alert→toast", () => {
  if (!h.includes("alert('導入失敗：'")) throw new Error("alert not found (maybe already swapped)");
  h = h.replace("alert('導入失敗：'", "toast('導入失敗：'");
});

/* 3. CSS 交錯入場 + 側欄指示條 + reduced-motion */
step("css stagger+active bar", () => {
  if (css.includes("animation:rise")) throw new Error("already");
  const anchor = ".page.show { display:block; animation:pop .25s ease; }";
  if (!css.includes(anchor)) throw new Error("page.show anchor missing");
  const block = `.page.show { display:block; animation:pop .25s ease; }
.page.show .spec-grid > *, .page.show .tile, .page.show .bcard, .page.show .task { animation:rise .34s ease backwards; }
.page.show .spec-grid > *:nth-child(1) { animation-delay:.02s; }
.page.show .spec-grid > *:nth-child(2) { animation-delay:.06s; }
.page.show .spec-grid > *:nth-child(3) { animation-delay:.10s; }
.page.show .spec-grid > *:nth-child(4) { animation-delay:.14s; }
.page.show .spec-grid > *:nth-child(5) { animation-delay:.18s; }
.page.show .spec-grid > *:nth-child(6) { animation-delay:.22s; }
.page.show .spec-grid > *:nth-child(n+7) { animation-delay:.26s; }
@keyframes rise { from{opacity:0;transform:translateY(10px) scale(.985)} to{opacity:1;transform:none} }
@media (prefers-reduced-motion: reduce) { .page.show *, .page.show { animation:none !important; transition:none !important; } }`;
  css = css.replace(anchor, block);
  css = css.replace(".side-item {", ".side-item { position:relative;");
  const activeAnchor = ".side-item.active {";
  if (!css.includes(activeAnchor)) throw new Error("side-item.active missing");
  css = css.replace(activeAnchor, `.side-item.active::before { content:'';position:absolute;left:-14px;top:22%;height:56%;width:3px;border-radius:2px;background:var(--lime-deep);box-shadow:0 0 8px rgba(88,204,2,.55); }
.side-item.active {`);
});

/* 4. KV 常駐狀態點 */
step("kv dot", () => {
  if (h.includes("kvDot")) throw new Error("already");
  const slot = '<button class="btn-duo ghost" id="themeToggle"';
  if (!h.includes(slot)) throw new Error("themeToggle slot missing");
  h = h.replace(slot, `<span id="kvDot" title="KV 狀態" style="display:inline-flex;align-items:center;gap:5px;margin-right:8px;font-size:11px;color:var(--ink-3)"><span id="kvDotInner" style="width:7px;height:7px;border-radius:50%;background:#d1d5db;display:inline-block"></span><span id="kvDotText"></span></span>` + slot);
  const rcAnchor = "async function renderConnections() {";
  if (!h.includes(rcAnchor)) throw new Error("renderConnections missing");
  h = h.replace(rcAnchor, `function paintKvDot(kv) {
  const d = document.getElementById('kvDotInner'), t = document.getElementById('kvDotText');
  if (!d) return;
  d.style.background = kv ? 'var(--lime-deep,#58cc02)' : '#d1d5db';
  if (t) t.textContent = kv ? 'KV' : '';
  const s = document.getElementById('kvDot');
  if (s) s.title = kv ? 'KV 已綁定 — 會話與令牌存儲就緒' : '未綁定 KV — Pages 設置 → 綁定添加（變量名 KV）';
}
` + rcAnchor);
  // 調用點：renderConnections 內 state 拉取後
  const callAnchor = "    } catch (e) { CONN_STATE = { providers: {}, kv: false }; } host.dataset.done = '1'; }";
  if (!h.includes(callAnchor)) throw new Error("state fetch call missing");
  h = h.replace(callAnchor, callAnchor + " paintKvDot(CONN_STATE.kv);");
});

/* 5. ★ 地圖重建修復：失效緩存 + 三處掛鉤 */
step("map invalidation", () => {
  if (h.includes("__invalidateMap")) throw new Error("already");
  const defAnchor = "let __alMap = null, __alBooted = false;";
  if (!h.includes(defAnchor)) throw new Error("alBooted missing");
  h = h.replace(defAnchor, defAnchor + "\nwindow.__invalidateMap = function () { __alBooted = false; __alMap = null; const host = document.getElementById('alStage'); if (host) host.innerHTML = ''; };");
  const hooks = [
    ["      openBoardSuggestions(r2);", "      openBoardSuggestions(r2);\n      window.__invalidateMap();"],
    ["    try { openBoardSuggestions(repos2); } catch (e) {}", "    try { openBoardSuggestions(repos2); } catch (e) {}\n    window.__invalidateMap();"],
    ["      const r2 = YamiLive.apply(restored.repositories);\n      renderOverview(r2); chipsRender(); paintAssets(); initAlgo(r2);\n      go('overview');", "      const r2 = YamiLive.apply(restored.repositories);\n      renderOverview(r2); chipsRender(); paintAssets(); initAlgo(r2);\n      window.__invalidateMap();\n      go('overview');"],
  ];
  let hooked = 0;
  for (const [from, to] of hooks) { if (h.includes(from)) { h = h.replace(from, to); hooked++; } }
  if (hooked === 0) throw new Error("no sync hook found");
});

writeFileSync(`${DEP}/index.html`, h);
writeFileSync(`${DEP}/assets/os2.css`, css);
console.log(steps.join("\n"));
console.log("TOTAL:", steps.filter(s => s.startsWith("OK")).length + "/" + steps.length);
