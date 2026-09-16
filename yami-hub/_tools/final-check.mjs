// final-check.mjs v2 — 全量終檢（純 ESM，乾淨寫法）
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { execSync } from "node:child_process";
import { join } from "node:path";
const DEP = "C:/Users/cao41/.openclaw-autoclaw/workspace/projects/yami-hub/deploy";

const h = readFileSync(`${DEP}/index.html`, "utf8");
const m = h.match(/<script>([\s\S]*)<\/script>/);
if (!m) { console.error("PAGE: no main script"); process.exit(1); }
const tmp = "C:/Users/cao41/.openclaw-autoclaw/workspace/.openclaw/tmp/final-main.js";
writeFileSync(tmp, m[1]);

function ok(label, cmd) {
  try { execSync(cmd, { stdio: "pipe" }); console.log(`${label}: OK`); return true; }
  catch (e) { console.error(`${label}: FAIL\n${e.stderr}`); return false; }
}

let pass = true;
pass = ok("PAGE SYNTAX", `node --check "${tmp}"`) && pass;
pass = ok("WORKER SYNTAX", `node --check "${DEP}/_worker.js"`) && pass;

try {
  const out = execSync(`node "C:/Users/cao41/.openclaw-autoclaw/workspace/projects/yami-hub/_tools/worker-harness.mjs"`, { encoding: "utf8", stdio: "pipe" });
  const threw = out.split("\n").filter(l => l.includes("THREW"));
  console.log("WORKER HARNESS:", threw.length === 0 ? "ALL 13 ROUTES OK" : "THREW!\n" + threw.join("\n"));
  if (threw.length) pass = false;
} catch (e) { console.error("HARNESS FAIL:", String(e.stderr || e.message).slice(0, 400)); pass = false; }

const checks = {
  "登錄首屏（三標籤）": h.includes("page-login") && h.includes("LOGIN_META"),
  "boot 路由（未連接進登錄頁）": h.includes("__forceLoginLanding") && h.includes("if (!connected) window.__forceLoginLanding"),
  "本地保險箱": h.includes("YamiVault") && h.includes("tryRestore"),
  "自動同步": h.includes("await YamiLive.sync()"),
  "地圖主路徑播放": h.includes("alPlayBtn"),
  "主題切換": h.includes("themeToggle") && h.includes("yamiTheme"),
  "未連接=0（demo 按需）": h.includes("__demoAvailable") && h.includes("yamiLoadDemo"),
  "esc XSS 防護(≥13處)": (h.match(/\$\{esc\(/g) || []).length >= 13,
  "歡迎態文案": h.includes("歡迎來到 YamiHub"),
};
for (const [k, v] of Object.entries(checks)) { console.log(`  ${v ? "✓" : "✗"} ${k}`); if (!v) pass = false; }

let count = 0;
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p); else count++;
  }
})(DEP);
console.log(`FILES: ${count}（應為 19）`);
console.log(pass && count === 19 ? "\n=== 全部綠燈，可覆蓋上傳 ===" : "\n=== 有紅燈，見上 ===");
process.exit(pass && count === 19 ? 0 : 1);
