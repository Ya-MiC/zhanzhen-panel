// kv-dot-call.mjs — 補最後一針
import { readFileSync, writeFileSync } from "node:fs";
const p = "C:/Users/cao41/.openclaw-autoclaw/workspace/projects/yami-hub/deploy/index.html";
let h = readFileSync(p, "utf8");
const from = "catch (e) { CONN_STATE = { providers: {}, kv: false }; }\n    host.dataset.done = '1';\n  }";
const to = "catch (e) { CONN_STATE = { providers: {}, kv: false }; }\n    host.dataset.done = '1';\n    paintKvDot(CONN_STATE.kv);\n  }";
if (!h.includes(from)) { console.error("anchor missing"); process.exit(1); }
h = h.replace(from, to);
writeFileSync(p, h);
console.log("kv dot call: OK");
