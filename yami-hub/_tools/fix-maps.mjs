// fix-maps.mjs — 资产地图页：死图 → ArchLive 活体引擎（含 Ollama 本地 AI 判读）
import { readFileSync, writeFileSync } from "node:fs";
const DEP = "C:/Users/cao41/.openclaw-autoclaw/workspace/projects/yami-hub/deploy";
let h = readFileSync(`${DEP}/index.html`, "utf8");
let n = 0;
const rep = (from, to, label) => {
  if (!h.includes(from)) { console.error("MISS: " + label); process.exit(1); }
  h = h.split(from).join(to); n++;
};

/* 1) 引入引擎脚本 */
rep('<script src="assets/scoring.js?v=43">', '<script src="assets/scoring.js?v=43">\n<script src="assets/archify-live.js?v=1">', "script tag");

/* 2) 地图页头部文案 + 活体控制台（替换 ed-head 之后的 legend+mapsHost 容器结构） */
rep(
  `<div class="legend" id="legendMaps"></div>
    <div id="mapsHost"></div>`,
  `<div class="legend" id="legendMaps"></div>

    <!-- ===== 活体地图控制台（ArchLive） ===== -->
    <div id="liveMapPanel" style="background:#0F172A;border:1px solid #1E293B;border-radius:20px;padding:22px 24px;margin:18px 0 28px;color:#F8FAFC">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
        <div>
          <div id="alTitle" style="font-family:'JetBrains Mono',monospace;font-size:18px;font-weight:700;letter-spacing:-.02em">正在从你的数据生成…</div>
          <div id="alSub" style="font-family:'JetBrains Mono',monospace;font-size:11.5px;color:#94A3B8;margin-top:4px">—</div>
        </div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <span id="alAiBadge" style="font-family:monospace;font-size:10px;letter-spacing:.12em;padding:5px 12px;border-radius:999px;background:#1E293B;color:#34D399">RULE-ENGINE</span>
          <button id="alRegen" style="font-family:monospace;font-size:12px;padding:8px 14px;border-radius:10px;border:1px solid #334155;background:transparent;color:#F8FAFC;cursor:pointer">↻ 重新生成</button>
          <button id="alAiToggle" style="font-family:monospace;font-size:12px;padding:8px 14px;border-radius:10px;border:1px solid #334155;background:transparent;color:#F8FAFC;cursor:pointer">🦙 本地 AI 判读</button>
        </div>
      </div>
      <div id="alAiPanel" style="display:none;margin-top:14px;padding:14px;border:1px solid #1E293B;border-radius:12px;background:#020617">
        <div style="font-family:monospace;font-size:11px;color:#94A3B8;letter-spacing:.1em;margin-bottom:8px">OLLAMA 本地判读 — 数据不出你的机器</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
          <input id="alOllamaBase" value="http://127.0.0.1:11434" placeholder="Ollama 地址"
            style="font-family:monospace;font-size:12px;padding:8px 12px;border-radius:8px;border:1px solid #334155;background:#0F172A;color:#F8FAFC;width:230px">
          <select id="alModelSel" style="font-family:monospace;font-size:12px;padding:8px 12px;border-radius:8px;border:1px solid #334155;background:#0F172A;color:#F8FAFC;max-width:220px">
            <option value="">— 先探测模型 —</option>
          </select>
          <button id="alProbe" style="font-family:monospace;font-size:12px;padding:8px 12px;border-radius:8px;border:1px solid #334155;background:transparent;color:#22D3EE;cursor:pointer">探测本地模型</button>
          <button id="alRun" style="font-family:monospace;font-size:12px;padding:8px 12px;border-radius:8px;border:1px solid #34D399;background:transparent;color:#34D399;cursor:pointer">生成判读地图</button>
        </div>
        <div id="alAiMsg" style="font-family:monospace;font-size:11px;color:#94A3B8;margin-top:8px;line-height:1.7"></div>
      </div>
      <div id="alStage" style="margin-top:16px"></div>
      <div id="alLegend" style="display:flex;gap:14px;flex-wrap:wrap;margin-top:14px;font-family:monospace;font-size:10px;letter-spacing:.08em;color:#94A3B8"></div>
    </div>

    <div id="mapsHost" style="display:none"></div>`,
  "live map panel"
);

/* 3) go() 挂活体渲染（替换原 maps 钩子） */
rep("if (page === 'maps') renderMaps();",
    `if (page === 'maps') { renderMaps(); ArchLiveBoot(); }`, "go hook");

/* 4) 注入 ArchLive 引导逻辑（在平台连接注释前） */
const anchor = "/* ---------- 平台連接（YamiHub） ---------- */";
if (!h.includes(anchor)) { console.error("anchor2 missing"); process.exit(1); }
h = h.replace(anchor, `
/* ---------- ArchLive 活体地图 ---------- */
let __alMap = null, __alBooted = false;
function ArchLiveBoot() {
  if (__alBooted) { ArchLivePaint(); return; }
  __alBooted = true;
  const repos = (PF.repositories || []);
  document.getElementById('alRegen').addEventListener('click', () => { __alMap = ArchLive.buildMap(repos); ArchLivePaint(); });
  document.getElementById('alAiToggle').addEventListener('click', () => {
    const p = document.getElementById('alAiPanel');
    p.style.display = p.style.display === 'none' ? 'block' : 'none';
  });
  document.getElementById('alProbe').addEventListener('click', async () => {
    const msg = document.getElementById('alAiMsg');
    msg.textContent = '探测中…';
    try {
      const models = await ArchLive.Ollama.probe(document.getElementById('alOllamaBase').value.trim());
      const sel = document.getElementById('alModelSel');
      sel.innerHTML = models.length
        ? models.map(m => '<option value="' + m + '">' + m + '</option>').join('')
        : '<option value="">（本地没有任何模型 — 先 ollama pull 一个）</option>';
      msg.textContent = models.length ? '找到 ' + models.length + ' 个本地模型 ✓' : 'Ollama 在线但没有模型：先运行 ollama pull qwen2.5:7b';
    } catch (e) {
      msg.innerHTML = '❌ ' + e.message + '<br>提示：https 面板连本地 Ollama 需要 ① 设置 OLLAMA_ORIGINS 环境变量包含本面板地址并重启 Ollama；② 浏览器地址栏允许"不安全内容"（Chrome: 地址栏右侧设置→不安全内容→允许）。用 localhost 域名部署的面板则开箱即用。';
    }
  });
  document.getElementById('alRun').addEventListener('click', async () => {
    const msg = document.getElementById('alAiMsg');
    const model = document.getElementById('alModelSel').value;
    if (!model) { msg.textContent = '先探测并选择一个模型'; return; }
    msg.textContent = '本地 AI 判读中…（' + model + '，数据不离开你的机器）';
    try {
      const ai = await ArchLive.Ollama.interpret(model, repos, document.getElementById('alOllamaBase').value.trim());
      __alMap = ArchLive.applyAI(ArchLive.buildMap(repos), ai);
      document.getElementById('alAiBadge').textContent = 'LOCAL-AI · ' + model;
      ArchLivePaint();
      msg.textContent = '✓ 本地判读完成：' + (ai.title || '') + ' — ' + (ai.subtitle || '');
    } catch (e) { msg.textContent = '❌ ' + e.message; }
  });
  __alMap = ArchLive.buildMap(repos);
  ArchLivePaint();
}
function ArchLivePaint() {
  const stage = document.getElementById('alStage');
  if (!__alMap) {
    stage.innerHTML = '<div style="text-align:center;padding:50px 20px;color:#94A3B8;font-family:monospace">'
      + '<div style="font-size:40px">🗺️</div>'
      + '<div style="margin-top:12px;font-size:13px">还没有数据 — 连接 GitHub 并同步后，这里会长出你的资产地图</div>'
      + '<button onclick="go(\\'connections\\')" style="margin-top:16px;font-family:monospace;font-size:12px;padding:9px 18px;border-radius:10px;border:1px solid #22D3EE;background:transparent;color:#22D3EE;cursor:pointer">去连接 →</button></div>';
    document.getElementById('alTitle').textContent = '空地图';
    document.getElementById('alSub').textContent = '等待你的数据';
    return;
  }
  stage.innerHTML = ArchLive.renderSVG(__alMap);
  document.getElementById('alTitle').textContent = __alMap.title;
  document.getElementById('alSub').textContent = __alMap.subtitle + ' · 主路径 ' + __alMap.stats.mainNodes + ' 节点 · 外围 ' + __alMap.stats.externals;
  document.getElementById('alAiBadge').textContent = __alMap.source.startsWith('local-ai') ? 'LOCAL-AI' : 'RULE-ENGINE';
  const L = { frontend: '前端', backend: '业务', database: '数据', cloud: '基建', messagebus: 'AI 流', external: '外围' };
  document.getElementById('alLegend').innerHTML = Object.entries(__alMap.stats.types || {})
    .map(([t, c]) => '<span style="display:inline-flex;align-items:center;gap:6px"><span style="width:9px;height:9px;border-radius:3px;background:' + ArchLive.PALETTE[t] + '"></span>' + (L[t] || t) + ' · ' + c + '</span>').join('');
  stage.querySelectorAll('.al-node[data-href]').forEach(el => {
    if (el.dataset.href) el.addEventListener('click', () => window.open(el.dataset.href, '_blank', 'noopener'));
  });
}

` + anchor);

writeFileSync(`${DEP}/index.html`, h);
console.log("replacements:", n, "| size:", h.length);
const need = ["ArchLiveBoot", "archify-live.js", "alAiPanel", "LOCAL-AI", "正在从你的数据生成"];
console.log("verify:", need.filter(k => !h.includes(k)).length === 0 ? "ALL OK" : need.filter(k => !h.includes(k)));
