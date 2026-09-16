// smoke-mapv2.mjs — 引擎 v2 完整冒煙
import { readFileSync } from "node:fs";
const code = readFileSync("C:/Users/cao41/.openclaw-autoclaw/workspace/projects/yami-hub/deploy/assets/archify-live.js", "utf8");
global.window = {};
new Function(code)();
const A = global.window.ArchLive;

const repos = [
  { name: "audit-os", language: "Python", description: "審計規則引擎", topics: ["audit"], fork: false, stargazers_count: 3, pushed_at: "2026-09-01", scores: { FinalSPI: 55 }, html_url: "https://github.com/x/a", private: false },
  { name: "web-panel", language: "HTML", description: "面板", topics: ["web"], fork: false, stargazers_count: 1, pushed_at: "2026-09-10", scores: { FinalSPI: 48 }, html_url: "https://github.com/x/w", private: false },
  { name: "a-fork", language: "JS", description: "別人的項目", topics: [], fork: true, stargazers_count: 0, pushed_at: "2026-01-01", scores: { FinalSPI: 12 }, html_url: "https://github.com/x/f", private: false },
  { name: "quant-notes", language: "Markdown", description: "量化學習", topics: ["study"], fork: false, stargazers_count: 0, pushed_at: "2026-08-01", scores: { FinalSPI: 40 }, html_url: "https://github.com/x/q", private: false },
  { name: "deploy-runner", language: "Shell", description: "CI runner", topics: ["deploy"], fork: false, stargazers_count: 0, pushed_at: "2026-05-01", scores: { FinalSPI: 33 }, html_url: "https://github.com/x/d", private: false },
];
const map = A.buildMap(repos);
const svg = A.renderSVG(map);

console.log("✓ map built:", !!map, "| lanes:", map.stats.lanes, "| rendered:", map.stats.rendered + "/" + map.stats.total);
console.log("✓ arrow marker alArrow:", svg.includes("alArrow"));
console.log("✓ lane labels:", (svg.match(/NODES/g) || []).length);
console.log("✓ swimlane bands:", (svg.match(/0\.45/g) || []).length);
console.log("✓ MAIN badges:", (svg.match(/>MAIN</g) || []).length);
console.log("✓ main edges:", map.edges.filter(e => e.type === "main").length);
console.log("✓ title in svg:", svg.includes(map.title));
console.log("✓ export fns:", ["exportPNG", "exportSVG", "exportJSON", "importJSON"].every(f => typeof A[f] === "function"));
console.log("✓ grid constants:", A.GRID.laneH === 118 && A.GRID.gapX === 24);
// JSON 導出→導入往返
const json = JSON.stringify(map);
const back = A.importJSON(json);
console.log("✓ export/import roundtrip:", back.nodes.length === map.nodes.length);
// 空數據
console.log("✓ empty → null:", A.buildMap([]) === null);
console.log("\n=== 引擎 v2 全綠 ===");
