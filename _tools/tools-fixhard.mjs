// fix-hardcoded.mjs — 杀掉面板里所有写死的统计数字，改为动态渲染
import { readFileSync, writeFileSync } from "node:fs";
const DEP = "C:/Users/cao41/.openclaw-autoclaw/workspace/projects/yami-hub/deploy";
let h = readFileSync(`${DEP}/index.html`, "utf8");
let n = 0;
const rep = (from, to, label) => {
  if (!h.includes(from)) { console.error("MISS: " + label); process.exit(1); }
  h = h.split(from).join(to); n++;
};

// 1) Hero 主标题
rep(
  `<h1>59 Repositories + 42 Starred + Notion，<br>一個網站看全部。</h1>`,
  `<h1><span id="heroRepos">…</span> Repositories + <span id="heroStars">…</span> Starred，<br>一個網站看全部。</h1>`,
  "hero"
);
// 2) GitHub 工作区卡片
rep(
  `<p>59 個倉庫 + 42 個 Starred：資產卡、評分、裁決、地圖、自動化流水線。</p>`,
  `<p><span class="dyn-repo-count">…</span> 個倉庫 + <span class="dyn-star-count">…</span> 個 Starred：資產卡、評分、裁決、地圖、自動化流水線。</p>`,
  "workspace card"
);
// 3) Sheets 卡片（原作者文案中性化）
rep(
  `<h4>📈 Ya-MiC 多平台資產總覽</h4><p>Assets 59 倉 · Tasks DDL · Skills 9 項 · Sync_Log —— 任務面板的數據源。</p>`,
  `<h4>📈 多平台資產總覽（可選）</h4><p>Assets · Tasks DDL · Skills · Sync_Log —— 對接你自己的 Google Sheets（v0.3）。</p>`,
  "sheets card"
);
// 4) 新人教学页
rep(
  `<p>一個專案的檔案+歷史，你有 59 個。</p>`,
  `<p>一個專案的檔案+歷史，你有 <span class="dyn-repo-count">…</span> 個。</p>`,
  "edu card"
);
// 5) chipsRender 动态计数
rep(
  `chipRow('srcChips', [['ALL', '全部 107'], ['repo', '📦 Repositories 59'], ['star', '⭐ Starred 42'], ['notion', '🪷 Notion 6']], 'src');`,
  `chipRow('srcChips', [['ALL', '全部 ' + ((PF.repositories||[]).length + (STARS||[]).length + (NOTION_PAGES||[]).length)], ['repo', '📦 Repositories ' + (PF.repositories||[]).length], ['star', '⭐ Starred ' + (STARS||[]).length], ['notion', '🪷 Notion ' + (NOTION_PAGES||[]).length]], 'src');`,
  "chips"
);

// 6) 动态填充钩子：包一层 renderOverview（原函数保持不动，渲染后回填所有 dyn span）
const anchor = "function renderOverview(repos) {";
rep(
  anchor,
  `function __fillDyn(repos) {
  try {
    const nR = (repos || []).length, nS = (STARS || []).length;
    const hr = document.getElementById('heroRepos'); if (hr) hr.textContent = nR;
    const hs = document.getElementById('heroStars'); if (hs) hs.textContent = nS;
    document.querySelectorAll('.dyn-repo-count').forEach(el => el.textContent = nR);
    document.querySelectorAll('.dyn-star-count').forEach(el => el.textContent = nS);
  } catch (e) {}
}
const __renderOverview = renderOverview;
renderOverview = function(repos) { __renderOverview(repos); __fillDyn(repos); };
` + anchor,
  "renderOverview wrap"
);

writeFileSync(`${DEP}/index.html`, h);
console.log("replacements:", n, "| size:", h.length);

// 7) 校验：不允许再出现死数字
const bad = ["59 Repositories", "59 個倉庫", "59 倉", "全部 107", "Repositories 59", "Starred 42"];
const left = bad.filter(b => h.includes(b));
console.log("leftover hardcoded:", left.length ? left.join(" | ") : "(none)");
