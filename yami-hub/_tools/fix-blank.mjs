// fix-blank.mjs — 空白畫布模式：DEMO_MODE 開關控制 demo 數據是否可載入
import { readFileSync, writeFileSync } from "node:fs";
const DEP = "C:/Users/cao41/.openclaw-autoclaw/workspace/projects/yami-hub/deploy";
let h = readFileSync(`${DEP}/index.html`, "utf8");
let w = readFileSync(`${DEP}/_worker.js`, "utf8");
let n = 0;
const repW = (from, to, label) => {
  if (!w.includes(from)) { console.error("MISS(worker): " + label); process.exit(1); }
  w = w.split(from).join(to); n++;
};
const rep = (from, to, label) => {
  if (!h.includes(from)) { console.error("MISS: " + label); process.exit(1); }
  h = h.split(from).join(to); n++;
};
const repH = rep;

/* 1) boot：把 demo 可用性改為由 /api/config 動態告知（DEMO_MODE 開關在服務端） */
repH(
  "  if (!connected) window.__forceLoginLanding = true;\n  if (connected) {",
  "  if (!connected) window.__forceLoginLanding = true;\n  try { const cfg = await (await fetch('/api/config')).json(); window.__demoAvailable = !!cfg.demoMode; } catch (e) { window.__demoAvailable = false; }\n  if (connected) {",
  "boot demo flag from server"
);
rep(
  "  } else {\n    PF = { repositories: [], stats: { total: 0, public: 0, private: 0, forks: 0 }, top5_final_spi: [], auto_synced_at: null, by_board: {}, by_lifecycle: {}, by_role: {}, by_domain: {}, top5_risks: [] };\n    window.__demoAvailable = true;\n  }",
  "  } else {\n    PF = { repositories: [], stats: { total: 0, public: 0, private: 0, forks: 0 }, top5_final_spi: [], auto_synced_at: null, by_board: {}, by_lifecycle: {}, by_role: {}, by_domain: {}, top5_risks: [] };\n  }",
  "boot remove hardcode demo"
);

/* 2) 登錄首屏：demo 入口按鈕由 __demoAvailable 動態顯示 */
repH(
  `    + '<a class="btn-duo ghost" href="#" onclick="yamiLoadDemo();return false" style="text-decoration:none">先看 demo 效果 →</a>'`,
  `    + (window.__demoAvailable ? '<a class="btn-duo ghost" href="#" onclick="yamiLoadDemo();return false" style="text-decoration:none">先看 demo 效果 →</a>' : '')`,
  "login demo button conditional"
);
repH(
  '<a href="#" onclick="yamiLoadDemo();return false" style="color:var(--ink-3);font-size:13px;text-decoration:none;border-bottom:1px dashed var(--line)">暫不登錄，先看 demo 效果 →</a>',
  '<span id="demoEntry2"></span>',
  "landing demo entry slot"
);
rep(
  "  const active = host.dataset.tab || 'github';",
  "  const de2 = document.getElementById('demoEntry2');\n  if (de2 && window.__demoAvailable !== undefined) {\n    de2.innerHTML = window.__demoAvailable\n      ? '<a href=\"#\" onclick=\"yamiLoadDemo();return false\" style=\"color:var(--ink-3);font-size:13px;text-decoration:none;border-bottom:1px dashed var(--line)\">暫不登錄，先看 demo 效果 →</a>'\n      : '';\n  }\n  const active = host.dataset.tab || 'github';",
  "landing demo entry render"
);

/* 3) yamiLoadDemo 保險：demo 關閉時按鈕根本不渲染；函數再加一層防 */
repH(
  "async function yamiLoadDemo() {\n  PF = await (await fetch('public/data/portfolio.json')).json();",
  "async function yamiLoadDemo() {\n  if (window.__demoAvailable === false) { console.log('demo 已由部署者關閉'); return; }\n  PF = await (await fetch('public/data/portfolio.json')).json();",
  "demo load guard"
);

/* ===== Worker：/api/config 返回 demoMode ===== */
repW(
  'if (pathname === "/api/config" || pathname === "/api/connections") {\n        const found = await getSession(env, request, false);\n        return json({\n          providers: providerStatus(env, found ? found.sess : null),\n          kv: !!env.KV,\n        });\n      }',
  'if (pathname === "/api/config" || pathname === "/api/connections") {\n        const found = await getSession(env, request, false);\n        return json({\n          providers: providerStatus(env, found ? found.sess : null),\n          kv: !!env.KV,\n          demoMode: String(env.DEMO_MODE || "") === "1",\n        });\n      }',
  "worker demoMode flag"
);

/* Worker public/data 代理：demo 關閉時拒絕返回 demo 數據（防繞過）——_worker.js 的 ASSETS 回退在非 /api 路徑，直接靜態也能拿到，故用前端旗標雙保險即可；此處僅記錄 */
writeFileSync(`${DEP}/index.html`, h);
writeFileSync(`${DEP}/_worker.js`, w);
console.log("replacements:", n);
const needH = ["demoMode", "__demoAvailable = !!cfg.demoMode", "demoEntry2"];
const needW = 'demoMode: String(env.DEMO_MODE';
console.log("html verify:", needH.filter(k => !h.includes(k)).length ? "MISS " + needH.filter(k => !h.includes(k)) : "OK");
console.log("worker verify:", w.includes(needW) ? "OK" : "MISS");
