// fix-motion.mjs — MotionSites 學習落地：Toast 通知系統 + 交錯入場動效 + 側欄活動指示
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

/* ===== 1. Toast 通知系統（替換 alert；右上滑入、3.6s 自愈、可堆疊） ===== */
repH(
  "/* ---------- 全局 XSS 防护 ---------- */",
  `/* ---------- Toast 通知（MotionSites 式微交互：輕、快、不打斷） ---------- */
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
  "toast system"
);
// alert → toast（導入失敗那處）
repH("    } catch (e) { alert('導入失敗：' + e.message); }",
     "    } catch (e) { toast('導入失敗：' + e.message, 'err'); }", "alert→toast");

/* ===== 2. 交錯入場動效（stagger reveal：切頁時卡片依次浮現，40ms 階梯） ===== */
repC(
  ".page.show { display:block; animation:pop .25s ease; }",
  `.page.show { display:block; animation:pop .25s ease; }
.page.show .spec-grid > *, .page.show .tile, .page.show .bcard, .page.show .task {
  animation:rise .34s ease backwards;
}
.page.show .spec-grid > *:nth-child(1) { animation-delay:.02s; }
.page.show .spec-grid > *:nth-child(2) { animation-delay:.06s; }
.page.show .spec-grid > *:nth-child(3) { animation-delay:.10s; }
.page.show .spec-grid > *:nth-child(4) { animation-delay:.14s; }
.page.show .spec-grid > *:nth-child(5) { animation-delay:.18s; }
.page.show .spec-grid > *:nth-child(6) { animation-delay:.22s; }
.page.show .spec-grid > *:nth-child(n+7) { animation-delay:.26s; }
@keyframes rise { from{opacity:0;transform:translateY(10px) scale(.985)} to{opacity:1;transform:none} }
@media (prefers-reduced-motion: reduce) {
  .page.show *, .page.show { animation:none !important; transition:none !important; }
}`,
  "stagger reveal"
);

/* ===== 3. 側欄活動指示條（當前頁左側 3px 萊姆條 + 微光） ===== */
repC(
  ".side-item {",
  `.side-item { position:relative;`,
  "side-item relative"
);
repC(
  ".side-item.active {",
  `.side-item.active::before { content:'';position:absolute;left:-14px;top:22%;height:56%;width:3px;border-radius:2px;
  background:var(--lime-deep);box-shadow:0 0 8px rgba(88,204,2,.55); }
.side-item.active {`,
  "active indicator"
);

/* ===== 4. KV 綁定狀態徽章（頂欄常駐小點：綠=就緒 灰=未綁，hover 說明）——學 MotionSites 的「狀態常駐可見」 ===== */
repH(
  '<button class="btn-duo ghost" id="themeToggle"',
  `<span id="kvDot" title="KV 狀態" style="display:inline-flex;align-items:center;gap:5px;margin-right:8px;font-size:11px;color:var(--ink-3)">
     <span id="kvDotInner" style="width:7px;height:7px;border-radius:50%;background:#d1d5db;display:inline-block"></span><span id="kvDotText"></span>
   </span>
   <button class="btn-duo ghost" id="themeToggle"`,
  "kv dot slot"
);
repH(
  "async function load() {\n  try {\n    const r = await fetch(\"/api/connections\");",
  "function paintKvDot(kv) {\n  const d = document.getElementById('kvDotInner'), t = document.getElementById('kvDotText');\n  if (!d) return;\n  d.style.background = kv ? 'var(--lime-deep,#58cc02)' : '#d1d5db';\n  if (t) t.textContent = kv ? 'KV' : '';\n  const s = document.getElementById('kvDot');\n  if (s) s.title = kv ? 'KV 已綁定 — 會話與令牌存儲就緒' : '未綁定 KV — 到 Pages 設置 → 綁定添加（變量名 KV）';\n}\nasync function load() {\n  try {\n    const r = await fetch(\"/api/connections\");",
  "kv dot paint (old index)"
);

repH(
  "async function renderConnections() {",
  "function paintKvDot(kv) {\n  const d = document.getElementById('kvDotInner'), t = document.getElementById('kvDotText');\n  if (!d) return;\n  d.style.background = kv ? 'var(--lime-deep,#58cc02)' : '#d1d5db';\n  if (t) t.textContent = kv ? 'KV' : '';\n  const s = document.getElementById('kvDot');\n  if (s) s.title = kv ? 'KV 已綁定 — 會話與令牌存儲就緒' : '未綁定 KV — 到 Pages 設置 → 綁定添加（變量名 KV）';\n}\nasync function renderConnections() {",
  "kv dot fn"
);
repH(
  "    } catch (e) { CONN_STATE = { providers: {}, kv: false }; }",
  "    } catch (e) { CONN_STATE = { providers: {}, kv: false }; }\n    paintKvDot(CONN_STATE.kv);",
  "kv dot call"
);
writeFileSync(${DEP}/index.html, h);
writeFileSync(`${DEP}/assets/os2.css`, css);
console.log("replacements:", n);
const needH = ["toastWrap", "kvDot"];
const needC = ["stagger", "side-item.active::before", "prefers-reduced-motion"];
console.log("html:", needH.filter(k => !h.includes(k)).length ? "MISS" : "OK");
console.log("css:", needC.filter(k => !css.includes(k)).length ? "MISS" : "OK");
