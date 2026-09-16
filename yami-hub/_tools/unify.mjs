// unify.mjs v2 — 按 UI-AUDIT.md 統一建議執行整改（全部用正則避開嵌套引號地獄）
import { readFileSync, writeFileSync } from "node:fs";
const DEP = "C:/Users/cao41/.openclaw-autoclaw/workspace/projects/yami-hub/deploy";
let h = readFileSync(`${DEP}/index.html`, "utf8");
let css = readFileSync(`${DEP}/assets/os2.css`, "utf8");
const log = [];
function step(name, fn) {
  try { fn(); log.push("OK   " + name); }
  catch (e) { log.push("FAIL " + name + " → " + e.message); }
}

/* ===== F. CSS 炸彈：.ed-kicker 多餘 } ===== */
step("F: ed-kicker brace", () => {
  const bad = css.match(/\.ed-kicker \{[^}]*\}\s*\n\s*text-transform:uppercase; margin-bottom:10px; \}/);
  if (bad) {
    const fixed = bad[0].replace(/\}\s*\n\s*text-transform:uppercase; margin-bottom:10px; \}/, "text-transform:uppercase; margin-bottom:10px; }");
    css = css.replace(bad[0], fixed);
  } else {
    const bal = (css.match(/\{/g) || []).length - (css.match(/\}/g) || []).length;
    if (bal !== 0) throw new Error("brace balance " + bal);
  }
});

/* ===== A1. os2.css 按鈕體系補全 ===== */
step("A1: css btn classes", () => {
  if (css.includes("a.btn-duo")) throw new Error("already");
  const anchor = ".btn-duo.blue {";
  if (!css.includes(anchor)) throw new Error("btn-duo.blue missing");
  const add = `a.btn-duo, a.btn-duo:visited { text-decoration:none; }
.btn-duo.sm { font-size:12px; padding:6px 13px; border-radius:10px; }
.btn-duo:disabled, .btn-duo.ghost:disabled { opacity:.45; cursor:not-allowed; }
`;
  css = css.replace(anchor, add + anchor);
});

/* ===== A2. .al-btn 暗色控制台 class ===== */
step("A2: al-btn class", () => {
  if (css.includes(".al-btn")) throw new Error("already");
  css += `
/* ===== 暗色控制台按鈕（archify 畫布專用，勿用淺色變量） ===== */
.al-btn { font-family:'JetBrains Mono',ui-monospace,monospace; font-size:12px; padding:8px 12px;
  border-radius:8px; border:1px solid #334155; background:transparent; color:#F8FAFC; cursor:pointer;
  transition:border-color .15s ease, color .15s ease; }
.al-btn:hover { border-color:#64748B; }
.al-btn.primary { color:#22D3EE; }
.al-btn.success { color:#34D399; border-color:#34D399; }
.al-btn.ai { color:#A78BFA; }
`;
});

/* ===== A3. index.html 暗色控制台 10 顆按鈕 → .al-btn ===== */
step("A3: dark console buttons", () => {
  const reps = [
    ['id="alRegen" style="font-family:monospace;font-size:12px;padding:8px 14px;border-radius:10px;border:1px solid #334155;background:transparent;color:#F8FAFC;cursor:pointer"',
     'id="alRegen" class="al-btn"'],
    ['id="alAiToggle" style="font-family:monospace;font-size:12px;padding:8px 14px;border-radius:10px;border:1px solid #334155;background:transparent;color:#F8FAFC;cursor:pointer"',
     'id="alAiToggle" class="al-btn"'],
    ['id="alExpPng" title="导出 PNG" style="font-family:monospace;font-size:12px;padding:8px 12px;border-radius:10px;border:1px solid #334155;background:transparent;color:#22D3EE;cursor:pointer"',
     'id="alExpPng" title="导出 PNG" class="al-btn primary"'],
    ['id="alExpSvg" title="导出 SVG" style="font-family:monospace;font-size:12px;padding:8px 12px;border-radius:10px;border:1px solid #334155;background:transparent;color:#22D3EE;cursor:pointer"',
     'id="alExpSvg" title="导出 SVG" class="al-btn primary"'],
    ['id="alExpJson" title="导出 JSON（可再导入回放）" style="font-family:monospace;font-size:12px;padding:8px 12px;border-radius:10px;border:1px solid #334155;background:transparent;color:#22D3EE;cursor:pointer"',
     'id="alExpJson" title="导出 JSON（可再导入回放）" class="al-btn primary"'],
    ['id="alImpJson" title="导入地图 JSON" style="font-family:monospace;font-size:12px;padding:8px 12px;border-radius:10px;border:1px solid #334155;background:transparent;color:#A78BFA;cursor:pointer"',
     'id="alImpJson" title="导入地图 JSON" class="al-btn ai"'],
    ['id="alProbe" style="font-family:monospace;font-size:12px;padding:8px 12px;border-radius:8px;border:1px solid #334155;background:transparent;color:#22D3EE;cursor:pointer"',
     'id="alProbe" class="al-btn primary"'],
    ['id="alRun" style="font-family:monospace;font-size:12px;padding:8px 12px;border-radius:8px;border:1px solid #34D399;background:transparent;color:#34D399;cursor:pointer"',
     'id="alRun" class="al-btn success"'],
    ['style="font-family:monospace;font-size:12px;padding:9px 18px;border-radius:10px;border:1px solid #22D3EE;background:transparent;color:#22D3EE;cursor:pointer"',
     'class="al-btn primary" style="text-decoration:none"'],
    ["pb.style.cssText = 'font-family:monospace;font-size:12px;padding:8px 14px;border-radius:10px;border:1px solid #A78BFA;background:transparent;color:#A78BFA;cursor:pointer;margin-left:8px'",
     "pb.className = 'al-btn ai'; pb.style.marginLeft = '8px'"],
  ];
  let done = 0;
  for (const [from, to] of reps) {
    if (h.includes(from)) { h = h.replace(from, to); done++; }
  }
  if (done < 8) throw new Error("only " + done + "/10 swapped");
});

/* ===== A4. 裸按鈕收編（正則，嵌套引號免疫） ===== */
step("A4: naked buttons", () => {
  let c = 0;
  // welcome 狀態卡
  if (h.includes('<button disabled style="opacity:.4">連接</button>')) {
    h = h.split('<button disabled style="opacity:.4">連接</button>').join('<button class="btn-duo ghost" disabled style="font-size:12px;padding:6px 13px">連接</button>'); c++;
  }
  // connCards：btn = '<button disabled>连接</button>';
  let m = h.match(/btn = '<button disabled>连接<\/button>';/);
  if (m) { h = h.replace(m[0], "btn = '<button class=\"btn-duo ghost\" disabled>连接</button>';"); c++; }
  m = h.match(/btn = '<button data-disc="(\$\{p\.id\}|' \+ p\.id \+ ')">断开<\/button>';/);
  if (m) { h = h.replace(m[0], m[0].replace("<button data-disc=", "<button class=\"btn-duo ghost\" data-disc=")); c++; }
  m = h.match(/btn = '<button data-conn="(\$\{p\.id\}|' \+ p\.id \+ ')">连接<\/button>';/);
  if (m) { h = h.replace(m[0], m[0].replace("<button data-conn=", "<button class=\"btn-duo\" data-conn=")); c++; }
  if (c === 0) throw new Error("no naked buttons found (may be already unified)");
});

/* ===== A5. text-decoration inline 清除 ===== */
step("A5: text-deco cleanup", () => {
  let c = 0;
  const pats = [
    [' style="text-decoration:none;font-size:12px;padding:6px 12px"', ' style="font-size:12px;padding:6px 13px"'],
    ['class="btn-duo" href="/api/oauth/github/start" style="text-decoration:none"', 'class="btn-duo" href="/api/oauth/github/start"'],
    ['class="btn-duo ghost" href="/api/oauth/notion/start" style="text-decoration:none"', 'class="btn-duo ghost" href="/api/oauth/notion/start"'],
    ['class="btn-duo ghost" href="/api/oauth/google/start" style="text-decoration:none"', 'class="btn-duo ghost" href="/api/oauth/google/start"'],
    ['class="btn-duo ghost" href="#" onclick="yamiLoadDemo();return false" style="text-decoration:none"', 'class="btn-duo ghost" href="#" onclick="yamiLoadDemo();return false"'],
  ];
  for (const [from, to] of pats) { const before = h.length; h = h.split(from).join(to); if (h.length !== before) c++; }
  if (c === 0) throw new Error("nothing to clean");
});

/* ===== A6. #syncBtn 收編 ===== */
step("A6: syncBtn", () => {
  const re = /<button id="syncBtn"[^>]*>/;
  const m = h.match(re);
  if (!m) throw new Error("syncBtn not found");
  if (m[0].includes("btn-duo")) throw new Error("already");
  h = h.replace(m[0], '<button id="syncBtn" class="btn-duo ghost">');
});

/* ===== C1. #d1d5db → var(--line) ===== */
step("C1: kvDot color", () => {
  h = h.split("background:#d1d5db;display:inline-block").join("background:var(--line);display:inline-block");
  h = h.split("'#d1d5db';").join("'var(--line)';");
});

/* ===== C2. #999 fallback → #a0a4a2 ===== */
step("C2: #999 fallback", () => {
  const before = h;
  h = h.split("STAR_CAT_COLOR[c] || '#999'").join("STAR_CAT_COLOR[c] || '#a0a4a2'");
  if (h === before) throw new Error("no #999 fallback (maybe already fixed)");
});

/* ===== C3. 紫色統一 ===== */
step("C3: purple unify", () => {
  if (!css.includes("--purple-deep")) {
    css = css.replace("--purple: #ce82ff;", "--purple: #ce82ff; --purple-deep: #7c3aed;");
  }
  css = css.split("#6d28d9").join("var(--purple-deep)");
});

/* ===== B. 圓角 5 檔變量 + 孤值 ===== */
step("B: radius vars", () => {
  if (!css.includes("--r-xs")) {
    const ranchor = "--r-lg: 20px; --r-md: 14px;";
    if (!css.includes(ranchor)) throw new Error("radius anchor missing");
    css = css.replace(ranchor, ranchor + " --r-sm: 10px; --r-xs: 7px; --r-xl: 26px;");
  }
  css = css.split("border-radius:15px;").join("border-radius:var(--r-md);");
  css = css.split("border-radius:17px;").join("border-radius:16px;");
  css = css.split("border-radius:24px;").join("border-radius:var(--r-xl);");
});

/* ===== D. logo 統一 25% 圓角 ===== */
step("D: logo", () => {
  const a = '<img src="assets/logo.jpg" alt="YamiHub" style="width:26px;height:26px;border-radius:8px;object-fit:cover;vertical-align:-6px">';
  const b = '<img src="assets/logo.jpg" alt="YamiHub" style="width:64px;height:64px;border-radius:16px;object-fit:cover">';
  let c = 0;
  if (h.includes(a)) { h = h.replace(a, '<img src="assets/logo.jpg" alt="YamiHub" style="width:26px;height:26px;border-radius:25%;object-fit:cover">'); c++; }
  if (h.includes(b)) { h = h.replace(b, '<img src="assets/logo.jpg" alt="YamiHub" style="width:64px;height:64px;border-radius:25%;object-fit:cover">'); c++; }
  if (c === 0) throw new Error("no logo inline found");
});

/* ===== E. 歡迎首屏字號統一 ===== */
step("E: welcome unify", () => {
  let c = 0;
  const a1 = 'font-size:30px;letter-spacing:-.01em">歡迎來到 YamiHub 面板</h1>';
  if (h.includes(a1)) { h = h.replace(a1, 'font-size:28px;letter-spacing:-.01em">歡迎來到 YamiHub 面板</h1>'); c++; }
  const a2 = 'font-size:16px;line-height:1.8;max-width:480px;margin:0 auto 26px">';
  if (h.includes(a2)) { h = h.replace(a2, 'font-size:15px;line-height:1.8;max-width:480px;margin:0 auto 26px">'); c++; }
  if (c === 0) throw new Error("already unified");
});

writeFileSync(`${DEP}/index.html`, h);
writeFileSync(`${DEP}/assets/os2.css`, css);
console.log(log.join("\n"));
const okCount = log.filter(l => l.startsWith("OK")).length;
console.log(`\nTOTAL: ${okCount}/${log.length}`);
