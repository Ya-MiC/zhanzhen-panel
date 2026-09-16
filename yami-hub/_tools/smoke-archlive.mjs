// smoke-archlive.mjs — 引擎冒烟测试
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
const code = readFileSync("C:/Users/cao41/.openclaw-autoclaw/workspace/projects/yami-hub/deploy/assets/archify-live.js", "utf8");
global.window = {};
new Function(code)();
const A = global.window.ArchLive;
if (!A) { console.error("FAIL: ArchLive not mounted"); process.exit(1); }

const demoRepos = [
  { name: "audit-os", language: "Python", description: "审计规则引擎", topics: ["audit"], fork: false, stargazers_count: 3, pushed_at: "2026-09-01", scores: { FinalSPI: 55 }, html_url: "https://github.com/x/audit-os", private: false },
  { name: "zhanzhen-web", language: "HTML", description: "CF Pages 前端", topics: ["web"], fork: false, stargazers_count: 1, pushed_at: "2026-09-10", scores: { FinalSPI: 48 }, html_url: "https://github.com/x/zhanzhen-web", private: false },
  { name: "some-fork", language: "JavaScript", description: "别人的项目", topics: [], fork: true, stargazers_count: 0, pushed_at: "2026-01-01", scores: { FinalSPI: 12 }, html_url: "https://github.com/x/f", private: false },
  { name: "quant-lab", language: "Python", description: "量化研究", topics: ["study"], fork: false, stargazers_count: 0, pushed_at: "2026-08-01", scores: { FinalSPI: 40 }, html_url: "https://github.com/x/q", private: false },
  { name: "infra-runner", language: "Shell", description: "CI runner", topics: ["deploy"], fork: false, stargazers_count: 0, pushed_at: "2026-05-01", scores: { FinalSPI: 33 }, html_url: "https://github.com/x/i", private: false },
];
const map = A.buildMap(demoRepos);
console.log("map ok:", !!map, "| nodes:", map.nodes.length, "| edges:", map.edges.length, "| stats:", JSON.stringify(map.stats));
const svg = A.renderSVG(map);
console.log("svg ok:", svg.startsWith("<svg"), "| length:", svg.length, "| has marker:", svg.includes('id="arw"'));
const typeHits = ["frontend", "backend", "database", "cloud", "external"].filter(t => svg.includes(A.PALETTE[t]));
console.log("semantic colors present:", typeHits.join(",") || "NONE");
console.log("empty map:", A.buildMap([]) === null ? "null OK" : "FAIL");
// applyAI 冒烟
const ai = { title: "测试地图", subtitle: "AI 判读", zones: [{ type: "cloud", label: "运维阵地", members: ["infra-runner"] }], mainPath: ["zhanzhen-web", "audit-os"] };
const blended = A.applyAI(A.buildMap(demoRepos), ai);
console.log("applyAI:", blended.title === "测试地图" && blended.source === "local-ai-blended" ? "OK" : "FAIL");
