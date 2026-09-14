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
      `&scope=${encodeURIComponent(e.GITHUB_SCOPE || "read:user public_repo")}` +
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

async function handleStart(env, provider, origin) {
  const p = PROVIDERS[provider];
  if (!p) return json({ error: "unknown provider" }, 404);
  if (!p.configured(env)) {
    return Response.redirect(`${origin}/?error=not_configured&provider=${provider}`, 302);
  }
  if (!env.KV) return Response.redirect(`${origin}/?error=no_kv`, 302);

  const state = randHex(16);
  const rec = { provider, created: Date.now() };

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

  const ru = `${origin}/api/oauth/${provider}/callback`;
  const tok = await p.token(env, code, ru, rec.verifier);

  let label = tok.label;
  if (!label && p.label) {
    try { label = await p.label(env, tok.access_token); } catch (e) { label = null; }
  }
  label = label || provider;

  const { sid, sess } = (await getSession(env, request, true));
  sess.connections[provider] = {
    label,
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
  for (let page = 1; page <= 3; page++) {
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

/* ---------------- 入口 ---------------- */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname, origin } = url;

    if (!pathname.startsWith("/api/")) {
      if (env.ASSETS) return env.ASSETS.fetch(request);
      return new Response("ASSETS binding missing — 请确认通过 Pages 部署（而非普通 Worker）", { status: 500 });
    }

    try {
      if (pathname === "/api/config" || pathname === "/api/connections") {
        const found = await getSession(env, request, false);
        return json({
          providers: providerStatus(env, found ? found.sess : null),
          kv: !!env.KV,
        });
      }

      const m = pathname.match(/^\/api\/oauth\/(github|notion|google)\/(start|callback)$/);
      if (m) {
        const [, provider, action] = m;
        if (action === "start") return handleStart(env, provider, origin);
        return handleCallback(request, env, provider, origin, url);
      }

      const d = pathname.match(/^\/api\/disconnect\/(github|notion|google)$/);
      if (d && request.method === "POST") return handleDisconnect(request, env, d[1]);

      if (pathname === "/api/github/sync") return handleGithubSync(request, env);

      return json({ error: "not found" }, 404);
    } catch (e) {
      return json({ error: String((e && e.message) || e) }, 500);
    }
  },
};
