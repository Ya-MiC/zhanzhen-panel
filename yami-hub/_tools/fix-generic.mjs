// fix-generic.mjs — 去個人化：分區規則通用化 + 側欄中性化 + Starred 動態分類
import { readFileSync, writeFileSync } from "node:fs";
const DEP = "C:/Users/cao41/.openclaw-autoclaw/workspace/projects/yami-hub/deploy";
let h = readFileSync(`${DEP}/index.html`, "utf8");
let n = 0;
const rep = (from, to, label) => {
  if (!h.includes(from)) { console.error("MISS: " + label); process.exit(1); }
  h = h.split(from).join(to); n++;
};
const repRex = (pattern, to, label) => {
  const re = new RegExp(pattern);
  if (!re.test(h)) { console.error("REX MISS: " + label); process.exit(1); }
  h = h.replace(re, to); n++;
};

/* ===== 1. BOARD_META 通用化：A-E 是「資產角色分區」，任何人 fork 都適用 ===== */
repRex(
  "const BOARD_META = \\{[\\s\\S]*?\\n\\};",
  `const BOARD_META = {
  P: { emoji: '🟣', color: 'var(--a)', hex: '#ce82ff', name: '產品線', mean: '面向真实用户的完整产品——面板、SaaS、App、站点' },
  T: { emoji: '🟢', color: 'var(--b)', hex: '#58cc02', name: '工具 / Agent', mean: '放大生产力的杠杆——Agent、Skill、自动化、插件' },
  R: { emoji: '🔵', color: 'var(--c)', hex: '#1cb0f6', name: '研究 / 学习', mean: '投入未来能力的研究仓——量化、论文、实验、笔记' },
  I: { emoji: '🟠', color: 'var(--d)', hex: '#ff9600', name: '基础设施', mean: '支撑一切的底座——CI/CD、部署脚本、网络、监控' },
  F: { emoji: '🍴', color: 'var(--e)', hex: '#a0a4a2', name: 'Fork / 外部', mean: '来自别人的代码——观察、吸收、待裁决' },
};`,
  "BOARD_META generic"
);

/* ===== 2. DOM2BOARD + A_TEAM 通用化 ===== */
repRex(
  "const DOM2BOARD = \\{[\\s\\S]*?\\};",
  `const DOM2BOARD = { 'PRODUCT-SAAS': 'P', 'RECORD-HANDOVER': 'P', 'PLUGIN-SDK-TEMPLATE': 'T', 'WEBSITE-CONTENT': 'T', 'QUANT-FINANCE': 'R', 'DATA-RESEARCH': 'R', 'DEVICE-SYSTEM-SETUP': 'I', 'AUTOMATION': 'I', 'HUMAN-REVIEW': 'F', 'STUDY-PORTFOLIO': 'R' };
const A_TEAM = [];`,
  "DOM2BOARD generic"
);

/* ===== 3. boardOf 通用规则：产品线判断改为关键词驱动（不再依赖 A_TEAM 名单） ===== */
repRex(
  "function boardOf\\(r\\) \\{[\\s\\S]*?\\n\\}",
  `function boardOf(r) {
  if (r.board) return r.board;
  const h2 = DOM2BOARD[r.primary_domain];
  if (h2) return h2;
  const hay = ((r.name || '') + ' ' + (r.one_liner || '') + ' ' + (r.description || '')).toLowerCase();
  if (r.fork) return 'F';
  if (/agent|skill|prompt|ocr|llm|rag|automat|tool|cli|plugin/.test(hay)) return 'T';
  if (/study|learn|note|quant|trading|research|economics|tutorial/.test(hay)) return 'R';
  if (/infra|deploy|docker|runner|ci|cd|dns|proxy|monitor|worker/.test(hay)) return 'I';
  if (/panel|site|web|app|saas|platform|dashboard|blog|portfolio|system/.test(hay)) return 'P';
  return 'T';
}`,
  "boardOf generic"
);

/* ===== 4. 分區文案裡的殘留（總覽分區卡 clickable 文案） ===== */
rep(
  '<b>🟣 湛箴・審計智能體（17 個）</b><br><span>核心產品線：中小企業審計 SaaS。action-tree 戰略根 → zhanzhen 7 件套實作。</span>',
  '<b>🟣 產品線</b><br><span>面向真实用户的完整产品——面板、SaaS、App、站点。</span>',
  "board A text"
);

/* ===== 5. 側欄中性化：GitHub 工作區 → 資產 · GitHub，Notion 工作區 → 連接 · Notion ===== */
rep('<div class="side-group">🐙 GitHub 工作區</div>', '<div class="side-group">🧭 資產宇宙</div>', "sidebar group1");
rep('<div class="side-group">🪷 Notion 工作區</div>', '<div class="side-group">🔗 外部平台</div>', "sidebar group2");
rep('<div class="side-group">治理 · 跨平台</div>', '<div class="side-group">🧠 智能 · 治理</div>', "sidebar group3");

/* ===== 6. Starred 動態分類：刪掉寫死個人的 STAR_CAT 大表，改為按描述關鍵詞自動分類 ===== */
repRex(
  "/\\* Starred 七大領域 \\*/\\nconst STAR_CAT = \\{[\\s\\S]*?\\n\\};",
  `/* Starred 自動分類（通用規則，按描述/名字關鍵詞；用戶可在權重實驗室覆蓋的哲學一致） */
const STAR_CAT_RULES = [
  [/agent|skill|prompt|llm|mcp|claude|gpt|ai-/, 'AI · Agent 技能'],
  [/trading|quant|stock|finance|market|invest/, '量化 · 金融'],
  [/security|proxy|vpn|tunnel|network|dns/, '網絡 · 安全'],
  [/design|ui|icon|font|color|css/, '設計 · 視覺'],
  [/book|course|tutorial|learn|education/, '學習 · 教育'],
  [/devops|docker|k8s|deploy|cloud|server/, '基建 · 部署'],
];
const STAR_CAT = {}; // 動態填充：每次載入 starred 時按規則分類
function starCatOf(s) {
  const hay = ((s.name || '') + ' ' + (s.desc || '')).toLowerCase();
  for (const [re, cat] of STAR_CAT_RULES) { if (re.test(hay)) return cat; }
  return '其他';
}`,
  "STAR_CAT dynamic"
);

/* starred 載入處接入 starCatOf */
rep(
  "STARS.forEach(s => { s.obs = /skill|agent|prompt/.test(s.name.toLowerCase()) ? 'ADOPT 候選' : 'STUDY'; s.cat = STAR_CAT[s.name] || '其他'; });",
  "STARS.forEach(s => { s.obs = /skill|agent|prompt/.test(s.name.toLowerCase()) ? 'ADOPT 候選' : 'STUDY'; s.cat = starCatOf(s); });",
  "star cat wiring"
);

/* ===== 8. 生命週期文案中性化（LC_CN 保留但確認無個人敘事）— 不動 ===== */

/* ===== 9. 教學頁/頁腳的 Skill 3.0 個人治理敘事 → 通用 ===== */
rep(
  "Skill 3.0 評分 × 15 項裁決 × G1–G5 閘門 × 6 張可縮放/全屏地圖",
  "SPI 評分 × 權重實驗室 × 資產地圖 × 本地加密保險箱",
  "hero chips"
);

/* ===== 10. demo 數據同步新分區 ===== */
repRex(
  "board: \"A\"|board: \"B\"|board: \"C\"|board: \"D\"",
  (m) => m,
  "noop-guard"
);

writeFileSync(`${DEP}/index.html`, h);
console.log("replacements:", n, "| size:", h.length);
const bad = ["湛箴・審計智能體", "action-tree 戰略根", "GitHub 工作區", "Notion 工作區", "A_TEAM = ['"];
const left = bad.filter(b => h.includes(b));
console.log("leftover personal refs:", left.length ? left.join(" | ") : "(none)");
const need = ["產品線", "工具 / Agent", "starCatOf", "資產宇宙"];
console.log("verify:", need.filter(k => !h.includes(k)).length ? "MISS" : "ALL OK");
