// fix-mapv2.mjs — 地圖控制台升級 v2：導出導入按鈕 + ArchLivePaint 適配新引擎
import { readFileSync, writeFileSync } from "node:fs";
const DEP = "C:/Users/cao41/.openclaw-autoclaw/workspace/projects/yami-hub/deploy";
let h = readFileSync(`${DEP}/index.html`, "utf8");
let n = 0;
const rep = (from, to, label) => {
  if (!h.includes(from)) { console.error("MISS: " + label); process.exit(1); }
  h = h.split(from).join(to); n++;
};

/* 1) 控制台按鈕組：加導出 PNG/SVG/JSON + 導入 */
rep(
  `<button id="alAiToggle" style="font-family:monospace;font-size:12px;padding:8px 14px;border-radius:10px;border:1px solid #334155;background:transparent;color:#F8FAFC;cursor:pointer">🦙 本地 AI 判读</button>`,
  `<button id="alAiToggle" style="font-family:monospace;font-size:12px;padding:8px 14px;border-radius:10px;border:1px solid #334155;background:transparent;color:#F8FAFC;cursor:pointer">🦙 本地 AI 判读</button>
        <span style="width:1px;height:22px;background:#334155"></span>
        <button id="alExpPng" title="导出 PNG" style="font-family:monospace;font-size:12px;padding:8px 12px;border-radius:10px;border:1px solid #334155;background:transparent;color:#22D3EE;cursor:pointer">PNG</button>
        <button id="alExpSvg" title="导出 SVG" style="font-family:monospace;font-size:12px;padding:8px 12px;border-radius:10px;border:1px solid #334155;background:transparent;color:#22D3EE;cursor:pointer">SVG</button>
        <button id="alExpJson" title="导出 JSON（可再导入回放）" style="font-family:monospace;font-size:12px;padding:8px 12px;border-radius:10px;border:1px solid #334155;background:transparent;color:#22D3EE;cursor:pointer">JSON</button>
        <button id="alImpJson" title="导入地图 JSON" style="font-family:monospace;font-size:12px;padding:8px 12px;border-radius:10px;border:1px solid #334155;background:transparent;color:#A78BFA;cursor:pointer">导入</button>
        <input type="file" id="alImpFile" accept=".json" style="display:none">`,
  "toolbar buttons"
);

/* 2) ArchLivePaint 導出導入接線（插在主路徑播放按鈕前） */
rep(
  "  // 主路徑逐步播放：點 ▶ 依次點亮主路徑節點",
  `  // 導出導入（archify 契約：JSON 是真相源）
  document.getElementById('alExpPng').onclick = function () { if (__alMap) ArchLive.exportPNG(__alMap, 2); };
  document.getElementById('alExpSvg').onclick = function () { if (__alMap) ArchLive.exportSVG(__alMap); };
  document.getElementById('alExpJson').onclick = function () { if (__alMap) ArchLive.exportJSON(__alMap); };
  document.getElementById('alImpJson').onclick = function () { document.getElementById('alImpFile').click(); };
  document.getElementById('alImpFile').onchange = function (ev) {
    const f = ev.target.files[0];
    if (!f) return;
    const rd = new FileReader();
    rd.onload = function () {
      try {
        __alMap = ArchLive.importJSON(String(rd.result));
        document.getElementById('alAiBadge').textContent = 'IMPORTED';
        ArchLivePaint();
      } catch (e) { alert('導入失敗：' + e.message); }
    };
    rd.readAsText(f);
  };

  // 主路徑逐步播放：點 ▶ 依次點亮主路徑節點`,
  "export wiring"
);

/* 3) ArchLivePaint 的 MAIN 徽章兼容：stats 從新引擎讀（rendered/lanes） */
rep(
  "document.getElementById('alSub').textContent = __alMap.subtitle + ' · 主路径 ' + __alMap.stats.mainNodes + ' 节点 · 外围 ' + __alMap.stats.externals;",
  "document.getElementById('alSub').textContent = (__alMap.subtitle || '') + ' · 泳道 ' + (__alMap.stats.lanes || 0) + ' · 渲染 ' + (__alMap.stats.rendered || 0) + '/' + (__alMap.stats.total || 0) + ' 倉庫';",
  "stats line"
);

/* 4) 節點透明度選擇器適配新 SVG（.al-node 不變，OK）；播放按鈕掛載點 parentElement 不變（alAiBadge 父級 = 工具列） */
writeFileSync(`${DEP}/index.html`, h);
console.log("replacements:", n, "| size:", h.length);
const need = ["alExpPng", "alExpSvg", "alExpJson", "alImpFile", "泳道"];
const miss = need.filter(k => !h.includes(k));
console.log("verify:", miss.length ? "MISSING " + miss : "ALL OK");
