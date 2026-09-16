/**
 * YamiHub OAuth Worker — Cloudflare Pages Advanced Mode（_worker.js）
 *
 * 部署者自己的密钥、自己的 KV、自己的数据：
 * - 所有 client_id / client_secret 来自 Pages 环境变量（Settings → 环境变量）
 * - 状态与令牌只存在部署者自己的 KV（绑定变量名必须是 KV）
 * - 令牌永不下发到浏览器，前端只拿得到账号显示名
 *
 * 路由：
 *   GET  /api/config                  → 各平台是否已配置（供面板渲染）
 *   GET  /api/oauth/:provider/start    → 发起 OAuth 跳转
 *   GET  /api/oauth/:provider/callback → 回调换令牌，写会话
 *   GET  /api/connections              → 连接状态列表
 *   POST /api/disconnect/:provider    → 断开并清除令牌
 *   其余请求 → 静态资源（env.ASSETS）
 */

const JSON_HEADERS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };
const SESSION_TTL = 604800; // 7 天
const STATE_TTL = 600;      // state 10 分钟一次性

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { ...JSON_HEADERS, ...headers },
  });
}

function randHex(n = 32) {
  const b = new Uint8Array(n);
  crypto.getRandomValues(b);
  return [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

function b64url(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function cookieGet(request, name) {
  const h = request.headers.get("cookie") || "";
  for (const part of h.split(/;\s*/)) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i) === name) return part.slice(i + 1);
  }
  return null;
}

function sanitizeLabel(s) {
  // 防 stored XSS：label 会经 /api/connections 返回给浏览器渲染
  return String(s == null ? "" : s).replace(/[<>&"'\`]/g, "").slice(0, 80);
}

function cookieSet(name, value, maxAge) {
  return `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

/* ---------------- 平台定义 ---------------- */

const PROVIDERS = {
  github: {
    configured: (e) => !!(e.GITHUB_CLIENT_ID && e.GITHUB_CLIENT_SECRET),
    missing: (e) => [
      ...(e.GITHUB_CLIENT_ID ? [] : ["GITHUB_CLIENT_ID"]),
      ...(e.GITHUB_CLIENT_SECRET ? [] : ["GITHUB_CLIENT_SECRET"]),
    ],
    authorize: (e, ru, st) =>
      `https://github.com/login/oauth/authorize?response_type=code` +
      `&client_id=${e.GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(ru)}` +
      `&scope=${encodeURIComponent(e.GITHUB_SCOPE || "read:user repo")}` +
      `&state=${st}`,
    token: async (e, code, ru) => {
      const r = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({
          client_id: e.GITHUB_CLIENT_ID,
          client_secret: e.GITHUB_CLIENT_SECRET,
          code,
          redirect_uri: ru,
        }),
      });
      const j = await r.json();
      if (!j.access_token) throw new Error(j.error_description || "github token exchange failed");
      return { access_token: j.access_token, label: null };
    },
    label: async (e, t) => {
      const r = await fetch("https://api.github.com/user", {
        headers: { authorization: `Bearer ${t}`, "user-agent": "yami-hub" },
      });
      if (!r.ok) return null;
      return (await r.json()).login;
    },
  },

  notion: {
    configured: (e) => !!(e.NOTION_CLIENT_ID && e.NOTION_CLIENT_SECRET),
    missing: (e) => [
      ...(e.NOTION_CLIENT_ID ? [] : ["NOTION_CLIENT_ID"]),
      ...(e.NOTION_CLIENT_SECRET ? [] : ["NOTION_CLIENT_SECRET"]),
    ],
    authorize: (e, ru, st) =>
      `https://api.notion.com/v1/oauth/authorize?response_type=code` +
      `&owner=user&client_id=${e.NOTION_CLIENT_ID}&redirect_uri=${encodeURIComponent(ru)}` +
      `&state=${st}`,
    token: async (e, code, ru) => {
      const basic = btoa(`${e.NOTION_CLIENT_ID}:${e.NOTION_CLIENT_SECRET}`);
      const r = await fetch("https://api.notion.com/v1/oauth/token", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Basic ${basic}` },
        body: JSON.stringify({ grant_type: "authorization_code", code, redirect_uri: ru }),
      });
      const j = await r.json();
      if (!j.access_token) throw new Error(j.error_description || "notion token exchange failed");
      const ownerName =
        j.owner && j.owner.type === "user" && j.owner.user
          ? j.owner.user.name || (j.owner.user.person && j.owner.user.person.email)
          : null;
      return { access_token: j.access_token, label: j.workspace_name || ownerName || "Notion 工作区" };
    },
    label: async () => null, // label 已在 token 响应里
  },

  google: {
    configured: (e) => !!(e.GOOGLE_CLIENT_ID && e.GOOGLE_CLIENT_SECRET),
    missing: (e) => [
      ...(e.GOOGLE_CLIENT_ID ? [] : ["GOOGLE_CLIENT_ID"]),
      ...(e.GOOGLE_CLIENT_SECRET ? [] : ["GOOGLE_CLIENT_SECRET"]),
    ],
    authorizeUrl:
      "https://accounts.google.com/o/oauth2/v2/auth",
    authorizeQuery: (e, ru, st, challenge) =>
      `response_type=code` +
      `&client_id=${e.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(ru)}` +
      `&scope=${encodeURIComponent(e.GOOGLE_SCOPE || "openid email")}` +
      `&state=${st}&code_challenge=${challenge}&code_challenge_method=S256`,
    token: async (e, code, ru, verifier) => {
      const body = {
        client_id: e.GOOGLE_CLIENT_ID,
        client_secret: e.GOOGLE_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: ru,
      };
      if (verifier) body.code_verifier = verifier;
      const r = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(body),
      });
      const j = await r.json();
      if (!j.access_token) throw new Error(j.error_description || "google token exchange failed");
      return { access_token: j.access_token, label: null };
    },
    label: async (e, t) => {
      const r = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { authorization: `Bearer ${t}` },
      });
      if (!r.ok) return null;
      const u = await r.json();
      return u.email || u.sub;
    },
  },
};

/* ---------------- 工具 ---------------- */

async function getSession(env, request, create = false) {
  if (!env.KV) return null;
  let sid = cookieGet(request, "sid");
  let sess = null;
  if (sid) sess = await env.KV.get(`sess:${sid}`, "json");
  if (!sess && create) {
    sid = randHex(16);
    sess = { connections: {} };
  }
  return sess ? { sid, sess } : null;
}

async function saveSession(env, sid, sess) {
  await env.KV.put(`sess:${sid}`, JSON.stringify(sess), { expirationTtl: SESSION_TTL });
}

function providerStatus(env, sess) {
  const out = {};
  for (const [name, p] of Object.entries(PROVIDERS)) {
    const conn = sess && sess.connections && sess.connections[name];
    out[name] = {
      configured: p.configured(env),
      missing: p.missing(env),
      connected: !!conn,
      label: conn ? conn.label : null,
      connectedAt: conn ? conn.connected_at : null,
    };
  }
  return out;
}

/* ---------------- 路由处理 ---------------- */

async function handleStart(request, env, provider, origin) {
  const p = PROVIDERS[provider];
  if (!p) return json({ error: "unknown provider" }, 404);
  if (!p.configured(env)) {
    return Response.redirect(`${origin}/?error=not_configured&provider=${provider}`, 302);
  }
  if (!env.KV) return Response.redirect(`${origin}/?error=no_kv`, 302);

  const state = randHex(16);
  const rec = { provider, created: Date.now(), bind: cookieGet(request, "sid") || "" };

  let url;
  const ru = `${origin}/api/oauth/${provider}/callback`;
  if (provider === "google") {
    const verifier = randHex(40);
    rec.verifier = verifier;
    const challenge = b64url(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)));
    url = `${p.authorizeUrl}?${p.authorizeQuery(env, ru, state, challenge)}`;
  } else {
    url = p.authorize(env, ru, state);
  }
  await env.KV.put(`state:${state}`, JSON.stringify(rec), { expirationTtl: STATE_TTL });
  return Response.redirect(url, 302);
}

async function handleCallback(request, env, provider, origin, url) {
  const p = PROVIDERS[provider];
  if (!p) return json({ error: "unknown provider" }, 404);
  if (!p.configured(env)) return Response.redirect(`${origin}/?error=not_configured&provider=${provider}`, 302);
  if (!env.KV) return Response.redirect(`${origin}/?error=no_kv`, 302);

  const errParam = url.searchParams.get("error");
  if (errParam) return Response.redirect(`${origin}/?error=${encodeURIComponent(errParam)}`, 302);

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) return Response.redirect(`${origin}/?error=missing_code_or_state`, 302);

  const raw = await env.KV.get(`state:${state}`);
  if (!raw) return Response.redirect(`${origin}/?error=state_expired`, 302);
  await env.KV.delete(`state:${state}`); // 一次性
  const rec = JSON.parse(raw);
  if (rec.provider !== provider) return Response.redirect(`${origin}/?error=state_mismatch`, 302);
  const curSid = cookieGet(request, "sid");
  if (rec.bind && curSid && rec.bind !== curSid) return Response.redirect(`${origin}/?error=state_mismatch`, 302);

  const ru = `${origin}/api/oauth/${provider}/callback`;
  const tok = await p.token(env, code, ru, rec.verifier);

  let label = tok.label;
  if (!label && p.label) {
    try { label = await p.label(env, tok.access_token); } catch (e) { label = null; }
  }
  label = sanitizeLabel(label) || provider;

  const { sid, sess } = (await getSession(env, request, true));
  sess.connections[provider] = {
    label: sanitizeLabel(label),
    token: tok.access_token,
    connected_at: new Date().toISOString(),
  };
  await saveSession(env, sid, sess);

  return new Response(null, {
    status: 302,
    headers: {
      location: `${origin}/?connected=${provider}`,
      "set-cookie": cookieSet("sid", sid, SESSION_TTL),
    },
  });
}

async function handleDisconnect(request, env, provider) {
  const found = await getSession(env, request, false);
  if (found && found.sess.connections[provider]) {
    delete found.sess.connections[provider];
    await saveSession(env, found.sid, found.sess);
  }
  return json({ ok: true, provider });
}

/* ---------------- GitHub 即时同步（供面板“平台连接”页调用） ---------------- */

const AVS_W = { C: .14, P: .14, L: .14, S: .12, R: .10, M: .10, D: .10, Q: .08, E: .08 };
const r2 = (v) => Math.round(v * 100) / 100;

function quickScores(repo) {
  const days = repo.pushed_at ? Math.floor((Date.now() - new Date(repo.pushed_at).getTime()) / 86400000) : 999;
  const dims = {
    C: 6, P: 6, L: 6, S: 6, R: 5, M: 5, D: 6, Q: 6,
    E: repo.fork ? 6 : 3, // demo 预置维度：fork 风险高些
  };
  const T = days > 365 ? 8 : days > 180 ? 7 : days > 90 ? 6 : days > 14 ? 5 : 4;
  const U = repo.fork ? 6 : 5;
  const AVS = Object.entries(AVS_W).reduce((a, [k, w]) => a + w * dims[k], 0);
  const GRS = .40 * T + .35 * U + .25 * (10 - dims.E);
  const SPI = 10 * AVS - 5 * GRS;
  const F = repo.fork ? 5 : 0;
  const FinalSPI = Math.max(0, SPI - F);
  return { ...dims, T, U, AVS: r2(AVS), GRS: r2(GRS), SPI: r2(SPI), ForkPenalty: F, FinalSPI: r2(FinalSPI), baseline: r2(FinalSPI), scored_at: new Date().toISOString().slice(0, 10) };
}

async function handleGithubSync(request, env) {
  const found = await getSession(env, request, false);
  const conn = found && found.sess.connections.github;
  if (!conn) return json({ error: "请先在平台连接页连接 GitHub" }, 401);

  const repos = [];
  for (let page = 1; page <= 5; page++) {
    const r = await fetch(`https://api.github.com/user/repos?per_page=100&sort=pushed&page=${page}&affiliation=owner,collaborator`, {
      headers: { authorization: `Bearer ${conn.token}`, accept: "application/vnd.github+json", "user-agent": "yami-hub" },
    });
    if (!r.ok) return json({ error: `GitHub API ${r.status}` }, 502);
    const batch = await r.json();
    repos.push(...batch);
    if (batch.length < 100) break;
  }

  const mapped = repos.map((x) => ({
    name: x.name,
    full_name: x.full_name,
    visibility: x.private ? "private" : "public",
    fork: !!x.fork,
    private: !!x.private,
    language: x.language || "-",
    html_url: x.html_url,
    stargazers_count: x.stargazers_count || 0,
    forks_count: x.forks_count || 0,
    open_issues_count: x.open_issues_count || 0,
    size: x.size || 0,
    created_at: x.created_at,
    updated_at: x.updated_at,
    pushed_at: x.pushed_at,
    primary_domain: x.fork ? "槓桿" : "產品",
    business_role: x.fork ? "leverage" : "product",
    lifecycle: x.pushed_at && (Date.now() - new Date(x.pushed_at).getTime() > 180 * 86400000) ? "維護" : "活躍",
    environment_tags: [],
    risk_tags: x.fork ? ["fork"] : [],
    one_liner: x.description || "",
    confidence: "low",
    needs_human: false,
    scores: quickScores(x),
    decision: "KEEP",
    description: x.description || "",
    license: x.license && x.license.spdx_id !== "NONE" ? x.license.spdx_id : null,
    topics: x.topics || [],
  }));

  return json({
    synced_at: new Date().toISOString(),
    count: mapped.length,
    repositories: mapped,
  });
}

/* ---------------- 简易限速（防爬虫/爆破） ---------------- */
const RL = { win: 60000, max: 60, hits: new Map() };
function rateLimited(ip) {
  const now = Date.now();
  const rec = RL.hits.get(ip) || { n: 0, t0: now };
  if (now - rec.t0 > RL.win) { rec.n = 0; rec.t0 = now; }
  rec.n++; RL.hits.set(ip, rec);
  if (RL.hits.size > 5000) RL.hits.clear(); // 防 Map 无限膨胀
  return rec.n > RL.max;
}

/* ---------------- YamiFeed 熱榜聚合（v0.2-1） ----------------
 * 數據源全部走公開接口：GitHub Trending 用官方搜尋 API，其餘走 RSSHub 公共實例或公開 JSON。
 * 只在 KV 緩存「標題/鏈接/熱度」等元數據 30 分鐘，不存全文（版權合規）。 */

const FEED_SOURCES = {
  gh: {
    name: "GitHub Trending",
    emoji: "🐙",
    async fetch(env) {
      // 官方 API：最近 7 天創建、按星數排序（近似 trending）
      const since = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
      const r = await fetch(`https://api.github.com/search/repositories?q=created:>${since}&sort=stars&order=desc&per_page=30`, {
        headers: { accept: "application/vnd.github+json", "user-agent": "yamifeed", ...(env.GITHUB_TOKEN ? { authorization: `Bearer ${env.GITHUB_TOKEN}` } : {}) },
      });
      if (!r.ok) throw new Error("github " + r.status);
      const j = await r.json();
      return (j.items || []).map((x) => ({
        title: x.full_name, desc: (x.description || "").slice(0, 120),
        url: x.html_url, hot: x.stargazers_count || 0, tag: x.language || "—",
      }));
    },
  },
  weibo: {
    name: "微博熱搜",
    emoji: "🔥",
    async fetch(env) {
      const base = env.RSSHUB_BASE || "https://rsshub.app";
      const r = await fetch(`${base}/weibo/search/hot`, { headers: { "user-agent": "yamifeed" } });
      if (!r.ok) throw new Error("rsshub " + r.status);
      const xml = await r.text();
      return parseRssTitles(xml, "微博").slice(0, 20);
    },
  },
  zhihu: {
    name: "知乎熱榜",
    emoji: "💡",
    async fetch(env) {
      const base = env.RSSHUB_BASE || "https://rsshub.app";
      const r = await fetch(`${base}/zhihu/hotlist`, { headers: { "user-agent": "yamifeed" } });
      if (!r.ok) throw new Error("rsshub " + r.status);
      const xml = await r.text();
      return parseRssTitles(xml, "知乎").slice(0, 20);
    },
  },
  hacker: {
    name: "Hacker News",
    emoji: "🧑‍💻",
    async fetch(env) {
      const r = await fetch("https://hacker-news.firebaseio.com/v0/topstories.json");
      if (!r.ok) throw new Error("hn " + r.status);
      const ids = (await r.json()).slice(0, 20);
      const items = await Promise.all(ids.map((id) =>
        fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then((x) => x.json()).catch(() => null)));
      return items.filter(Boolean).map((x) => ({
        title: x.title, desc: "", url: x.url || `https://news.ycombinator.com/item?id=${x.id}`,
        hot: x.score || 0, tag: "HN",
      }));
    },
  },
};

/* 極簡 RSS 標題解析（免依賴，只取 <title> 與 <link>） */
function parseRssTitles(xml, tag) {
  const items = xml.split("<item").slice(1);
  return items.map((it) => {
    const t = (it.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/) || [])[1] || "";
    const l = (it.match(/<link>([\s\S]*?)<\/link>/) || [])[1] || "";
    return { title: decodeEntities(t).trim(), desc: "", url: l.trim(), hot: 0, tag };
  }).filter((x) => x.title);
}
function decodeEntities(s) {
  return s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

async function handleFeed(env, url) {
  const wanted = (url.searchParams.get("sources") || "gh,hacker").split(",").filter((x) => FEED_SOURCES[x]);
  if (!wanted.length) return json({ error: "unknown sources" }, 400);
  const results = {};
  for (const key of wanted) {
    const cacheKey = "feed:" + key;
    let cached = null;
    if (env.KV) { try { cached = await env.KV.get(cacheKey, "json"); } catch (e) {} }
    if (cached && cached.at && Date.now() - new Date(cached.at).getTime() < 1800000) {
      results[key] = cached;
      continue;
    }
    try {
      const items = await FEED_SOURCES[key].fetch(env);
      const rec = { name: FEED_SOURCES[key].name, emoji: FEED_SOURCES[key].emoji, at: new Date().toISOString(), items };
      results[key] = rec;
      if (env.KV) { try { await env.KV.put(cacheKey, JSON.stringify(rec), { expirationTtl: 1800 }); } catch (e) {} }
    } catch (e) {
      results[key] = { name: FEED_SOURCES[key].name, emoji: FEED_SOURCES[key].emoji, error: String(e.message || e), items: cached ? cached.items : [] };
    }
  }
  return json({ ok: true, sources: results, available: Object.keys(FEED_SOURCES).map((k) => ({ id: k, name: FEED_SOURCES[k].name, emoji: FEED_SOURCES[k].emoji })) });
}

/* ---------------- YamiFeed 每日精選推送（v0.2-2，WxPusher） ----------------
 * 環境變量（可選）：
 *   WXPUSHER_TOKEN  — WxPusher 應用 appToken（spt.xxxx 或 uid 推送二選一）
 *   WXPUSHER_UID    — 用戶 UID（在 wxpusher.zjiecode.com 掃碼獲取）
 *   GITHUB_TOKEN    — 可選，提高 GitHub API 限額
 *   RSSHUB_BASE     — 可選，自建 RSSHub 實例地址
 * 無這些變量時推送功能靜默關閉，面板其他功能不受影響。 */

async function buildDailyDigest(env) {
  // 從 KV 緩存取各源（feed 接口 30 分鐘前已聚合過）；沒有就現場拉
  const digest = { title: "YamiHub 每日精選 · " + new Date().toISOString().slice(0, 10), sections: [] };
  for (const key of ["gh", "hacker", "weibo", "zhihu"]) {
    let rec = null;
    if (env.KV) { try { rec = await env.KV.get("feed:" + key, "json"); } catch (e) {} }
    if (!rec || !rec.items || !rec.items.length) {
      try { await handleFeed(env, new URL("https://x/api/feed?sources=" + key)); rec = await env.KV.get("feed:" + key, "json"); } catch (e) {}
    }
    if (rec && rec.items && rec.items.length) {
      digest.sections.push({
        key, name: rec.name || key,
        top: rec.items.slice(0, 5).map((x) => ({ title: x.title, url: x.url })),
      });
    }
  }
  return digest;
}

function digestToText(digest) {
  let t = "📌 " + digest.title + "\n\n";
  for (const s of digest.sections) {
    t += "—— " + s.name + " ——\n";
    s.top.forEach((x, i) => { t += (i + 1) + ". " + x.title.slice(0, 40) + "\n"; });
    t += "\n";
  }
  t += "全文請到你的 YamiHub 面板查看 ↗";
  return t.slice(0, 3800); // WxPusher 內容上限
}

async function pushWxPusher(env, content) {
  const token = env.WXPUSHER_TOKEN;
  const uid = env.WXPUSHER_UID;
  if (!token || !uid) return { skipped: true, reason: "未配置 WXPUSHER_TOKEN / WXPUSHER_UID" };
  const r = await fetch("https://wxpusher.zjiecode.com/api/send/message", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      appToken: token,
      content,
      summary: content.split("\n")[0].slice(0, 99),
      contentType: 1, // 文本
      uids: [uid],
    }),
  });
  const j = await r.json();
  if (!j.success) throw new Error("WxPusher: " + (j.msg || JSON.stringify(j)).slice(0, 120));
  return { ok: true, msgId: j.data };
}

/* 手動觸發推送（帶 session 驗證，防濫用） */
async function handlePush(request, env) {
  const found = await getSession(env, request, false);
  if (!found) return json({ error: "请先登录面板" }, 401);
  const digest = await buildDailyDigest(env);
  const text = digestToText(digest);
  try {
    const r = await pushWxPusher(env, text);
    if (r.skipped) return json({ ok: false, skipped: true, reason: r.reason, digestPreview: text.slice(0, 400) });
    return json({ ok: true, digestPreview: text.slice(0, 400) });
  } catch (e) {
    return json({ ok: false, error: String(e.message || e), digestPreview: text.slice(0, 400) }, 502);
  }
}

/* Cron Trigger 入口（CF Pages 的 scheduled handler） */
async function scheduled(event, env, ctx) {
  env = cleanEnv(env);
  if (!env.WXPUSHER_TOKEN || !env.WXPUSHER_UID) return; // 未配置靜默退出
  const digest = await buildDailyDigest(env);
  const text = digestToText(digest);
  try { await pushWxPusher(env, text); } catch (e) { console.error("cron push failed:", e.message); }
}

/* ---------------- 入口 ---------------- */

function cleanEnv(e) {
  // 用户在 CF 面板手滑贴进空格/引号/BOM 是常见事故：统一净化一次
  const out = {};
  for (const [k, v] of Object.entries(e || {})) {
    if (typeof v !== "string") { out[k] = v; continue; }
    let s = v.replace(/^\uFEFF/, "").trim();
    if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) s = s.slice(1, -1).trim();
    out[k] = s;
  }
  return out;
}

export default {
  async scheduled(event, env, ctx) { await scheduled(event, env, ctx); },
  async fetch(request, env) {
    env = cleanEnv(env);
    const url = new URL(request.url);
    const { pathname, origin } = url;

    if (!pathname.startsWith("/api/")) {
      if (env.ASSETS) return env.ASSETS.fetch(request);
      return new Response("ASSETS binding missing — 请确认通过 Pages 部署（而非普通 Worker）", { status: 500 });
    }

    if (pathname.startsWith("/api/")) {
      const ip = request.headers.get("cf-connecting-ip") || "unknown";
      if (rateLimited(ip)) return json({ error: "too many requests" }, 429);
    }

    try {
      if (pathname === "/api/config" || pathname === "/api/connections") {
        const found = await getSession(env, request, false);
        return json({
          providers: providerStatus(env, found ? found.sess : null),
          kv: !!env.KV,
          demoMode: String(env.DEMO_MODE || "") === "1",
        });
      }

      const m = pathname.match(/^\/api\/oauth\/(github|notion|google)\/(start|callback)$/);
      if (m) {
        const [, provider, action] = m;
        if (action === "start") return handleStart(request, env, provider, origin);
        return handleCallback(request, env, provider, origin, url);
      }

      const d = pathname.match(/^\/api\/disconnect\/(github|notion|google)$/);
      if (d && request.method === "POST") return handleDisconnect(request, env, d[1]);

      if (pathname === "/api/github/sync") return handleGithubSync(request, env);
      if (pathname === "/api/feed") return handleFeed(env, url);
      if (pathname === "/api/feed/push" && request.method === "POST") return handlePush(request, env);

      return json({ error: "not found" }, 404);
    } catch (e) {
      return json({ error: String((e && e.message) || e) }, 500);
    }
  },
};
