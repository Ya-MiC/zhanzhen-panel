/* archify-live.js v2 — YamiHub 活體資產地圖引擎（archify 方法論深化版）
 *
 * v2 重點（2026-09-15）：
 * 1. 嚴格泳道佈局：每個語義分區一條水平泳道，節點等距吸附網格，主路徑縱貫左側
 * 2. 統一節點尺寸/間距/字號（archify 不變量：空隙=淨間距、間距是一致的）
 * 3. 圖例面板 + 統計角標 + 泳道標題（讀者隨時知道自己在看什麼）
 * 4. renderPNG / exportJSON / importJSON — archify 式導出導入
 */
(function (global) {
  "use strict";

  const PALETTE = {
    canvas: "#020617", mask: "#0F172A", ink: "#F8FAFC", muted: "#94A3B8",
    dim: "#475569", border: "#1E293B",
    frontend: "#22D3EE", backend: "#34D399", database: "#A78BFA",
    cloud: "#FBBF24", security: "#FB7185", messagebus: "#FB923C", external: "#64748B",
  };
  const ZONE_CN = {
    frontend: "門面 / 入口", backend: "業務 / 領域", database: "數據 / 持久化",
    cloud: "基建 / 部署", messagebus: "智能 / 自動化", external: "Fork / 外部",
  };
  const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

  /* ---------- 布局常量（統一美學的關鍵：全部吸附到這套網格） ---------- */
  const GRID = {
    laneH: 118,        // 泳道高
    nodeW: 224, nodeH: 64,
    gapX: 24,          // 同泳道節點間距（一致！）
    padX: 150, padY: 96,
    laneLabelW: 118,
  };

  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* ---------- 聚類（同 v1，微調關鍵詞） ---------- */
  function classifyRepo(r) {
    const lang = (r.language || "").toLowerCase();
    const name = (r.name || "").toLowerCase();
    const desc = ((r.description || "") + " " + (r.one_liner || "")).toLowerCase();
    const topics = (r.topics || []).join(" ").toLowerCase();
    const hay = name + " " + desc + " " + topics;
    if (r.fork) return { type: "external" };
    if (/docker|deploy|infra|runner|ci\b|cd\b|workflow|action/.test(hay)) return { type: "cloud" };
    if (/data|db|sqlite|postgres|kv|store|sync|pipeline|etl|sheet|excel/.test(hay)) return { type: "database" };
    if (/agent|skill|prompt|llm|ocr|ai|rag|graph|quant|trading/.test(hay)) return { type: "messagebus" };
    if (/audit|risk|finance|invoice|ledger|tax/.test(hay)) return { type: "backend" };
    if (/web|panel|site|page|ui|front|html|blog|portfolio|doc/.test(hay)) return { type: "frontend" };
    if (/study|learn|note|tutorial|course|economics|book/.test(hay)) return { type: "external" };
    if (["html", "css", "vue", "typescript", "javascript"].includes(lang)) return { type: "frontend" };
    if (["python", "java", "go", "rust", "c"].includes(lang)) return { type: "backend" };
    if (["shell", "powershell", "dockerfile"].includes(lang)) return { type: "cloud" };
    return { type: "backend" };
  }

  function coreScore(r) {
    let s = 0;
    s += Math.min(3, (r.scores && r.scores.FinalSPI || 0) / 20);
    if (!r.fork) s += 1.5;
    if ((r.stargazers_count || 0) > 0) s += 0.5;
    if (r.pushed_at && Date.now() - new Date(r.pushed_at) < 90 * 86400000) s += 1;
    return s;
  }

  /* ---------- buildMap：嚴格泳道布局 ---------- */
  function buildMap(repos, opts) {
    opts = opts || {};
    const list = (repos || []).filter(Boolean);
    if (!list.length) return null;

    const scored = list.map((r) => ({ r, cls: classifyRepo(r), core: coreScore(r) }));
    const lanesOrder = ["frontend", "messagebus", "backend", "database", "cloud", "external"];
    const lanes = {};
    for (const t of lanesOrder) lanes[t] = [];
    for (const s of scored) {
      if (!lanes[s.cls.type]) lanes[s.cls.type] = [];
      lanes[s.cls.type].push(s);
    }
    // 泳道內按 core 排序；每泳道最多 6 個（超出的捨棄，保持畫面乾淨）
    for (const t of lanesOrder) {
      lanes[t].sort((a, b) => b.core - a.core);
      lanes[t] = lanes[t].slice(0, 6);
    }
    // 空泳道剔除
    const activeLanes = lanesOrder.filter((t) => lanes[t].length);

    const perLane = Math.max(...activeLanes.map((t) => lanes[t].length));
    const w = GRID.padX + GRID.laneLabelW + perLane * (GRID.nodeW + GRID.gapX) + 60;
    const h = GRID.padY + activeLanes.length * GRID.laneH + 70;

    const nodes = [], edges = [];
    let laneIdx = 0;
    const firstOfLane = {};
    for (const type of activeLanes) {
      const y = GRID.padY + laneIdx * GRID.laneH + 26;
      // 泳道標題
      nodes.push({
        kind: "laneLabel", id: "lane-" + type, type,
        x: 24, y, w: GRID.laneLabelW, h: 44,
        label: ZONE_CN[type] || type,
        count: lanes[type].length,
      });
      lanes[type].forEach((s, i) => {
        const node = {
          kind: "repo", id: "n-" + s.r.name, type,
          x: GRID.padX + GRID.laneLabelW + i * (GRID.nodeW + GRID.gapX),
          y, w: GRID.nodeW, h: GRID.nodeH,
          label: s.r.name, sub: (s.r.language || "") + (s.r.private ? " · 🔒" : "") + (s.r.fork ? " · fork" : ""),
          href: s.r.html_url, star: s.r.stargazers_count || 0, core: s.core, main: s.cls.type !== "external",
        };
        nodes.push(node);
        if (i === 0) firstOfLane[type] = node;
        if (i > 0) edges.push({ from: "n-" + lanes[type][i - 1].r.name, to: node.id, type: "lane" });
      });
      laneIdx++;
    }

    // 主路徑：frontend → messagebus → backend → database → cloud（各泳道第一名）
    const chainTypes = ["frontend", "messagebus", "backend", "database", "cloud"].filter((t) => firstOfLane[t]);
    for (let i = 0; i < chainTypes.length - 1; i++) {
      edges.push({ from: firstOfLane[chainTypes[i]].id, to: firstOfLane[chainTypes[i + 1]].id, type: "main" });
    }

    return {
      version: 2,
      generatedAt: new Date().toISOString(),
      source: (opts.aiUsed ? "local-ai:" + opts.aiModel : "rule-engine"),
      title: opts.aiTitle || "我的資產地圖",
      subtitle: opts.aiSubtitle || (opts.aiUsed ? "由本地 AI（" + opts.aiModel + "）判讀生成" : "由規則引擎從你的倉庫數據實時生成"),
      stats: {
        total: list.length, rendered: nodes.filter((n) => n.kind === "repo").length,
        lanes: activeLanes.length,
        types: nodes.filter((n) => n.kind === "repo").reduce((m, n) => { m[n.type] = (m[n.type] || 0) + 1; return m; }, {}),
      },
      palette: PALETTE, zoneCN: ZONE_CN,
      lanesOrder: activeLanes,
      nodes, edges, viewBox: { w, h },
    };
  }

  /* ---------- renderSVG：archify 嚴格美學 ---------- */
  function renderSVG(map) {
    const P = map.palette;
    const vb = map.viewBox;
    let g = "";

    // 泳道底帶（交替微色差，讓「行」的概念可讀）
    let laneIdx = 0;
    for (const type of map.lanesOrder) {
      const y = GRID.padY + laneIdx * GRID.laneH;
      if (laneIdx % 2 === 0) {
        g += `<rect x="0" y="${y}" width="${vb.w}" height="${GRID.laneH}" fill="${P.mask}" opacity="0.45"/>`;
      }
      laneIdx++;
    }

    // 邊（先畫，壓在節點下）
    for (const e of map.edges) {
      const a = map.nodes.find((n) => n.id === e.from);
      const b = map.nodes.find((n) => n.id === e.to);
      if (!a || !b || a.kind === "laneLabel" || b.kind === "laneLabel") continue;
      const x1 = a.x + a.w, y1 = a.y + a.h / 2, x2 = b.x, y2 = b.y + b.h / 2;
      const isMain = e.type === "main";
      const col = isMain ? P.frontend : P.border;
      const wd = isMain ? 2 : 1.2;
      // 同泳道直線；跨泳道貝塞爾
      const d = Math.abs(y2 - y1) < 4
        ? `M ${x1} ${y1} L ${x2} ${y2}`
        : `M ${x1} ${y1} C ${x1 + 40} ${y1}, ${x2 - 40} ${y2}, ${x2} ${y2}`;
      g += `<path d="${d}" fill="none" stroke="${col}" stroke-width="${wd}" ${isMain ? 'stroke-dasharray="none" marker-end="url(#alArrow)" opacity="0.9"' : 'marker-end="url(#alArrow)" opacity="0.5"'}/>`;
    }

    // 節點
    for (const n of map.nodes) {
      if (n.kind === "laneLabel") {
        g += `<text x="${n.x}" y="${n.y + 22}" fill="${P.muted}" font-family="${MONO}" font-size="11" letter-spacing="0.12em" font-weight="700">${esc(n.label)}</text>`
          + `<text x="${n.x}" y="${n.y + 38}" fill="${P.dim}" font-family="${MONO}" font-size="9">${n.count} NODES</text>`;
        continue;
      }
      const c = P[n.type] || P.external;
      const isMainPath = map.edges.some((e) => e.type === "main" && (e.from === n.id || e.to === n.id));
      g += `<g class="al-node" data-href="${esc(n.href || "")}" data-id="${esc(n.id)}" style="cursor:${n.href ? "pointer" : "default"}">`
        + `<rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="12" fill="${P.mask}" stroke="${isMainPath ? c : P.border}" stroke-width="${isMainPath ? 1.8 : 1}"/>`
        + `<rect x="${n.x}" y="${n.y}" width="4" height="${n.h}" rx="2" fill="${c}"/>`
        + `<text x="${n.x + 14}" y="${n.y + 25}" fill="${P.ink}" font-family="${MONO}" font-size="12.5" font-weight="600">${esc(n.label.length > 20 ? n.label.slice(0, 19) + "…" : n.label)}</text>`
        + `<text x="${n.x + 14}" y="${n.y + 46}" fill="${P.muted}" font-family="${MONO}" font-size="10">${esc(n.sub || "")}${n.star ? " · ★" + n.star : ""}</text>`
        + (isMainPath ? `<text x="${n.x + n.w - 10}" y="${n.y + 16}" fill="${P.frontend}" font-family="${MONO}" font-size="8" letter-spacing="0.1em" text-anchor="end">MAIN</text>` : "")
        + `</g>`;
    }

    // 標題 + 統計角標
    g += `<text x="24" y="40" fill="${P.ink}" font-family="${MONO}" font-size="17" font-weight="700" letter-spacing="-0.02em">${esc(map.title)}</text>`
      + `<text x="24" y="60" fill="${P.muted}" font-family="${MONO}" font-size="10.5">${esc(map.subtitle)} · ${map.stats.rendered}/${map.stats.total} 倉庫 · ${map.stats.lanes} 條泳道</text>`
      + `<text x="${vb.w - 24}" y="40" fill="${P.dim}" font-family="${MONO}" font-size="9" text-anchor="end" letter-spacing="0.1em">${map.source.toUpperCase()}</text>`;

    return `<svg id="alSvg" viewBox="0 0 ${vb.w} ${vb.h}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block;background:${P.canvas};border-radius:16px">
      <defs><marker id="alArrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M 0 1 L 9 5 L 0 9" fill="none" stroke="${P.dim}" stroke-width="1.4"/></marker></defs>
      ${g}</svg>`;
  }

  /* ---------- 導出導入（archify 契約：JSON 是真相源，PNG/SVG 是可分享外殼） ---------- */
  function exportJSON(map) {
    const blob = new Blob([JSON.stringify(map, null, 2)], { type: "application/json" });
    download(URL.createObjectURL(blob), "yamihub-map-" + map.generatedAt.slice(0, 10) + ".json");
  }
  function exportSVG(map) {
    const svg = renderSVG(map);
    const blob = new Blob([svg], { type: "image/svg+xml" });
    download(URL.createObjectURL(blob), "yamihub-map-" + map.generatedAt.slice(0, 10) + ".svg");
  }
  function exportPNG(map, scale) {
    const svg = renderSVG(map);
    const img = new Image();
    const vb = map.viewBox;
    const canvas = document.createElement("canvas");
    canvas.width = vb.w * (scale || 2); canvas.height = vb.h * (scale || 2);
    img.onload = function () {
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(function (b) { download(URL.createObjectURL(b), "yamihub-map-" + map.generatedAt.slice(0, 10) + ".png"); });
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));
  }
  function importJSON(jsonText) {
    const j = JSON.parse(jsonText);
    if (!j || !Array.isArray(j.nodes) || !j.viewBox) throw new Error("不是有效的 YamiHub 地圖 JSON");
    if (!j.palette) j.palette = PALETTE;
    if (!j.zoneCN) j.zoneCN = ZONE_CN;
    return j;
  }
  function download(url, name) {
    const a = document.createElement("a");
    a.href = url; a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  /* ---------- Ollama 本地 AI（同 v1） ---------- */
  const Ollama = {
    base: "http://127.0.0.1:11434",
    async probe(base) {
      const r = await fetch((base || this.base).replace(/\/$/, "") + "/api/tags").catch((e) => { throw new Error("無法連接：" + e.message); });
      if (!r.ok) throw new Error("HTTP " + r.status + (r.status === 403 ? " — 需設 OLLAMA_ORIGINS 並重啟 Ollama" : ""));
      const j = await r.json();
      return (j.models || []).map((m) => m.name);
    },
    async interpret(model, repos, base) {
      const briefs = repos.slice(0, 40).map((r) => ({
        name: r.name, lang: r.language, desc: (r.description || "").slice(0, 80),
        topics: (r.topics || []).slice(0, 5), fork: !!r.fork, stars: r.stargazers_count || 0,
      }));
      const prompt = `你是資產地圖架構師。以下是我的 GitHub 倉庫清單 JSON：\n${JSON.stringify(briefs)}\n\n`
        + `請只輸出一個 JSON 對象（不要 markdown 代碼塊），形狀：\n`
        + `{"title":"這張地圖的中文標題(≤12字)","subtitle":"一句話判讀(≤24字)","zones":[{"type":"frontend|backend|database|cloud|messagebus|external","label":"這個分區對你意味著什麼(≤10字)","members":["倉庫名"]}],"mainPath":["主路徑倉庫名按順序，3-6個"]}\n`
        + `約束：members 必須使用清單裡的真實倉庫名；不要發明倉庫；單分區成員不超過 12 個。`;
      const r = await fetch((base || this.base).replace(/\/$/, "") + "/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ model, prompt, stream: false, options: { temperature: 0.2 } }),
      });
      if (!r.ok) throw new Error("Ollama 生成失敗 HTTP " + r.status);
      const j = await r.json();
      const txt = (j.response || "").trim().replace(/^```json?/i, "").replace(/^```/, "").replace(/```$/, "").trim();
      const m2 = txt.match(/\{[\s\S]*\}/);
      if (!m2) throw new Error("模型未返回 JSON");
      return JSON.parse(m2[0]);
    },
  };

  function applyAI(map, ai) {
    if (ai.title) map.title = String(ai.title).slice(0, 30);
    if (ai.subtitle) map.subtitle = String(ai.subtitle).slice(0, 60);
    const byName = {};
    map.nodes.forEach((n) => { if (n.kind === "repo") byName[n.label] = n; });
    (ai.zones || []).forEach((z) => {
      (z.members || []).forEach((name) => {
        const n = byName[name];
        if (n) { n.aiZone = z.label; }
      });
    });
    if (Array.isArray(ai.mainPath) && ai.mainPath.length >= 2) {
      const chain = ai.mainPath.map((nm) => byName[nm]).filter(Boolean);
      map.edges = map.edges.filter((e) => e.type !== "main");
      for (let i = 0; i < chain.length - 1; i++) {
        map.edges.push({ from: chain[i].id, to: chain[i + 1].id, type: "main" });
      }
    }
    map.source = "local-ai-blended";
    return map;
  }

  global.ArchLive = { PALETTE, ZONE_CN, GRID, classifyRepo, buildMap, renderSVG, exportJSON, exportSVG, exportPNG, importJSON, applyAI, Ollama, esc };
})(window);
