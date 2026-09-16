// final-verify.mjs — 最终验证清单
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
const DEP = "C:/Users/cao41/.openclaw-autoclaw/workspace/projects/yami-hub/deploy";
const h = readFileSync(`${DEP}/index.html`, "utf8");
const css = readFileSync(`${DEP}/assets/os2.css`, "utf8");

console.log("theme key yamiTheme:", h.includes("yamiTheme"));
console.log("theme button:", h.includes("themeToggle"));
console.log("css light guard:", css.includes(":not([data-theme="));
console.log("css dark override:", css.includes("html[data-theme="));
console.log("sidebar connections:", (h.match(/data-page="connections"/g) || []).length);
console.log("cnt dynamic:", h.includes("cntAssets"));
console.log("static cnt 10 gone:", !h.includes('資產畫廊<span class="cnt">10'));
console.log("boot gating:", h.includes("connected = st.kv"));
console.log("welcome 3-oauth:", h.includes("api/oauth/notion/start"));
console.log("config hint:", h.includes("①变量是否在"));
console.log("KEY bug gone:", !h.includes("KEY = '***"));

function walk(dir, base) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, join(base, name));
    else console.log(`  ${join(base, name)}  (${st.size} B)`);
  }
}
console.log("=== deploy tree ===");
walk(DEP, ".");
