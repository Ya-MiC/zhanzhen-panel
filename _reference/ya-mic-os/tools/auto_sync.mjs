// auto_sync.mjs v2 — the full autonomous pipeline (runs on GitHub Actions, free).
// 1. Discover NEW repos and NEW stars (auto-ingest, mark is_new, auto-open review issue)
// 2. Refresh live metadata for everything (stars/forks/pushed/issues)
// 3. Dynamically rescore (Skill 3.0 formula, T drifts with staleness)
// Never deletes; never touches classifications authored by humans.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { computeScores, rescorePortfolio } from "./scoring.mjs";

const TOK = process.env.GH_TOKEN;
const OWNER = "Ya-MiC";
const H = { Authorization: "Bearer " + TOK, "User-Agent": "portfolio-autopilot", Accept: "application/vnd.github+json" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function gh(path, method = "GET", body) {
  for (let t = 0; t < 3; t++) {
    try {
      const r = await fetch("https://api.github.com" + path, {
        method, headers: H, body: body ? JSON.stringify(body) : undefined,
      });
      if (r.status === 404) return null;
      if (!r.ok) throw new Error("HTTP " + r.status);
      return await r.json();
    } catch (e) {
      if (t === 2) return null;
      await sleep(1500 * (t + 1));
    }
  }
  return null;
}
async function ghAll(path) {
  const out = [];
  for (let page = 1; page <= 10; page++) {
    const sep = path.includes("?") ? "&" : "?";
    const batch = await gh(path + sep + "per_page=100&page=" + page);
    if (!Array.isArray(batch) || batch.length === 0) break;
    out.push(...batch);
    if (batch.length < 100) break;
    await sleep(150);
  }
  return out;
}

const pfPath = "public/data/portfolio.json";
const stPath = "public/data/starred.json";
const pf = JSON.parse(readFileSync(pfPath, "utf8"));
let stars = [];
if (existsSync(stPath)) {
  const sd = JSON.parse(readFileSync(stPath, "utf8"));
  stars = sd.starred || sd;
}

let report = { newRepos: [], newStars: [], rescored: 0, metaChanged: 0 };

/* ---------- 1. discover new repos ---------- */
const mine = await ghAll(`/users/${OWNER}/repos?type=owner&sort=pushed`);
const known = new Set(pf.repositories.map((r) => r.name));
for (const m of mine) {
  if (known.has(m.name)) continue;
  if (m.owner.login !== OWNER) continue;
  const today = new Date().toISOString().slice(0, 10);
  pf.repositories.push({
    name: m.name, full_name: m.full_name, visibility: m.private ? "private" : "public",
    fork: m.fork, private: m.private, language: m.language,
    license: m.license ? m.license.spdx_id : null,
    html_url: m.html_url, stargazers_count: m.stargazers_count, forks_count: m.forks_count,
    open_issues_count: m.open_issues_count, size: m.size,
    created_at: m.created_at, updated_at: m.updated_at, pushed_at: m.pushed_at,
    primary_domain: "HUMAN-REVIEW", business_role: "UNCLEAR-ASSET",
    lifecycle: "human-review", environment_tags: [], risk_tags: ["human-review-required"],
    one_liner: m.description || "（無描述）", confidence: "low",
    needs_human: true, is_new: true, discovered: today,
    scores: { C: 1, P: 1, L: 1, S: 1, R: 2, M: 1, D: 1, Q: 1, E: 6, T: 3, U: 9, AVS: 1.7, GRS: 6.15, SPI: -13.9, ForkPenalty: m.fork ? 20 : 0, FinalSPI: 0 },
    decision: "human-review",
  });
  report.newRepos.push(m.name);
  await sleep(150);
  // auto-open a review issue so the human can answer on the go
  const iss = await gh(`/repos/${OWNER}/ya-mic-os/issues`, "POST", {
    title: `[Human Review·自動] ${m.name} — 新倉庫自動入板，請 30 秒裁決`,
    body: `> 🤖 auto-sync 自動發現新倉庫（${today}），已按安全預設入板：**保留、不改名、不公開、不刪除**。\n\n**描述**：${m.description || "（無）"}\n**可見性**：${m.private ? "🔒 私有" : "公開"} · **Fork**：${m.fork ? "是" : "否"}\n\n**請回覆字母**：A 繼續投資 · B 可重用工具 · C 產品/作品 · D 學習/歷史 · E 不確定（默認）`,
    labels: ["human-review", "governance"],
  });
  if (iss && iss.number) console.log("issue opened for new repo:", m.name, "#" + iss.number);
  await sleep(300);
}

/* ---------- 2. discover new stars ---------- */
const starredRaw = await ghAll(`/users/${OWNER}/starred`);
const knownStars = new Set(stars.map((s) => s.name));
for (const s of starredRaw) {
  if (knownStars.has(s.full_name)) continue;
  stars.push({ name: s.full_name, desc: (s.description || "").slice(0, 110), lang: s.language, stars: s.stargazers_count });
  report.newStars.push(s.full_name);
  await sleep(120);
}

/* ---------- 3. refresh metadata ---------- */
for (const r of pf.repositories) {
  const m = await gh("/repos/" + (r.full_name || OWNER + "/" + r.name));
  if (!m) continue;
  for (const [k, v] of [["stargazers_count", m.stargazers_count], ["forks_count", m.forks_count],
    ["open_issues_count", m.open_issues_count], ["pushed_at", m.pushed_at], ["updated_at", m.updated_at]]) {
    if (r[k] !== v) { r[k] = v; report.metaChanged++; }
  }
  if (!r.description && m.description) { r.description = m.description; } // 描述補齊 → 前端 Q 信任度自然反映
  await sleep(120);
}
for (const s of stars) {
  const m = await gh("/repos/" + s.name);
  if (m && s.stars !== m.stargazers_count) s.stars = m.stargazers_count;
  await sleep(120);
}

/* ---------- 4. dynamic rescore ---------- */
report.rescored = rescorePortfolio(pf);

/* ---------- write ---------- */
pf.auto_synced_at = new Date().toISOString().slice(0, 16) + "Z";
pf.stats = {
  ...pf.stats,
  total: pf.repositories.length,
  public: pf.repositories.filter((r) => !r.private).length,
  private: pf.repositories.filter((r) => r.private).length,
  fork: pf.repositories.filter((r) => r.fork).length,
  human_review: pf.repositories.filter((r) => r.needs_human).length,
};
writeFileSync(pfPath, JSON.stringify(pf, null, 1) + "\n");
writeFileSync(stPath, JSON.stringify({ updated: new Date().toISOString().slice(0, 10), count: stars.length, starred: stars }, null, 1) + "\n");

console.log("NEW repos:", report.newRepos.join(", ") || "none");
console.log("NEW stars:", report.newStars.join(", ") || "none");
console.log("metadata fields changed:", report.metaChanged, "| repos rescored:", report.rescored);
