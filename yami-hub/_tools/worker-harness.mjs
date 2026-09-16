// worker-harness.mjs — 本地复现 1101：把 _worker.js 跑起来逐路由打
import { readFileSync } from "node:fs";

const code = readFileSync("C:/Users/cao41/.openclaw-autoclaw/workspace/projects/yami-hub/deploy/_worker.js", "utf8");
const mod = await import("data:text/javascript;base64," + Buffer.from(code).toString("base64"));
const worker = mod.default;

function makeKV() {
  const m = new Map();
  return {
    get: async (k, t) => (m.has(k) ? (t === "json" ? JSON.parse(m.get(k)) : m.get(k)) : null),
    put: async (k, v) => m.set(k, v),
    delete: async (k) => m.delete(k),
    _m: m,
  };
}
const ASSETS = { fetch: async (r) => new Response("<html>ASSET</html>", { headers: { "content-type": "text/html" } }) };
const ENV_FULL = {
  ASSETS, KV: makeKV(),
  GITHUB_CLIENT_ID: "Iv1test", GITHUB_CLIENT_SECRET: "sectest",
  NOTION_CLIENT_ID: "nid", NOTION_CLIENT_SECRET: "secret_nsecret",
  GOOGLE_CLIENT_ID: "gid.apps.googleusercontent.com", GOOGLE_CLIENT_SECRET: "GOCSPX-x",
};
const ENV_NOKV = { ASSETS, KV: undefined, GITHUB_CLIENT_ID: "Iv1test", GITHUB_CLIENT_SECRET: "s" };

async function hit(env, path, opts = {}) {
  const req = new Request("https://kv-9di.pages.dev" + path, opts);
  try {
    const res = await worker.fetch(req, env);
    const body = (await res.text()).slice(0, 160);
    return { status: res.status, body };
  } catch (e) {
    return { THREW: true, msg: String(e && e.message || e).slice(0, 200) };
  }
}

console.log("== 1. 静态首页（生产环境走 ASSETS） ==");
console.log(JSON.stringify(await hit(ENV_FULL, "/")));
console.log("== 2. 静态 CSS ==");
console.log(JSON.stringify(await hit(ENV_FULL, "/assets/os2.css")));
console.log("== 3. /api/config（全配置+KV） ==");
console.log(JSON.stringify(await hit(ENV_FULL, "/api/config")));
console.log("== 4. /api/config（无KV） ==");
console.log(JSON.stringify(await hit(ENV_NOKV, "/api/config")));
console.log("== 5. github start（配置齐全） ==");
const s5 = await hit(ENV_FULL, "/api/oauth/github/start", { redirect: "manual" });
console.log(JSON.stringify({ ...s5, body: s5.body ? s5.body.slice(0, 80) : "" }));
console.log("== 6. google start ==");
console.log(JSON.stringify(await hit(ENV_FULL, "/api/oauth/google/start", { redirect: "manual" })));
console.log("== 7. 未配置的 start（noKV env 无 secret） ==");
console.log(JSON.stringify(await hit(ENV_NOKV, "/api/oauth/github/start", { redirect: "manual" })));
console.log("== 8. callback 缺参数 ==");
console.log(JSON.stringify(await hit(ENV_FULL, "/api/oauth/github/callback", { redirect: "manual" })));
console.log("== 9. 假 state callback ==");
console.log(JSON.stringify(await hit(ENV_FULL, "/api/oauth/github/callback?code=x&state=deadbeef", { redirect: "manual" })));
console.log("== 10. sync 未登录 ==");
console.log(JSON.stringify(await hit(ENV_FULL, "/api/github/sync")));
console.log("== 11. disconnect ==");
console.log(JSON.stringify(await hit(ENV_FULL, "/api/disconnect/github", { method: "POST" })));
console.log("== 12. 404 API ==");
console.log(JSON.stringify(await hit(ENV_FULL, "/api/nothing")));
console.log("== 13. 限速实测（61 连发） ==");
let last;
for (let i = 0; i < 61; i++) last = await hit(ENV_FULL, "/api/config");
console.log(JSON.stringify({ status: last.status, body: last.body }));
