// gov_sync.mjs — auto-collect human decisions from human-review issues.
// For each issue labeled human-review: find the latest standalone letter answer
// (A/B/C/D/E, combos like "A+B" allowed) in Ya-MiC's comments, and keep
// data/portfolio.json decision fields in sync. Never touches anything else.
import { readFileSync, writeFileSync } from "node:fs";

const TOK = process.env.GH_TOKEN;
const OWNER = "Ya-MiC", REPO = "ya-mic-os";
const H = { Authorization: "Bearer " + TOK, "User-Agent": "gov-sync", Accept: "application/vnd.github+json" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function gh(path) {
  for (let t = 0; t < 3; t++) {
    try {
      const r = await fetch("https://api.github.com" + path, { headers: H });
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

const issues = await gh(`/repos/${OWNER}/${REPO}/issues?labels=human-review&state=all&per_page=100`);
if (!Array.isArray(issues)) { console.log("no issues fetched"); process.exit(0); }

const path = "public/data/portfolio.json";
const pf = JSON.parse(readFileSync(path, "utf8"));
const LETTER = /(?:^|\n)\s*([A-E](?:\s*\+\s*[A-E])*)\s*(?:$|\n|[，,。！!？?（(])/;
let changed = 0;

for (const iss of issues) {
  const m = iss.title.match(/\[\s*Human Review[^\]]*\]\s*(.+?)\s*[—–-]/);
  if (!m) continue;
  const repo = m[1].trim();
  const target = pf.repositories.find((r) => r.name === repo);
  if (!target) continue;
  const cs = await gh(`/repos/${OWNER}/${REPO}/issues/${iss.number}/comments?per_page=100`);
  if (!Array.isArray(cs)) continue;
  // last letter answer by the human (comments authored by Ya-MiC that are not bot confirmations)
  let letter = null;
  for (const c of cs) {
    if (c.user.login !== "Ya-MiC") continue;
    if (c.body.includes("Agent 已記錄")) continue; // bot confirmation posted under his account
    const mm = c.body.match(LETTER);
    if (mm) letter = mm[1].replace(/\s+/g, "");
  }
  if (!letter) continue;
  const want = `${letter} · ${target.decision ? target.decision.split("·").slice(1).join("·").trim() : "人類裁決"}（同步 ${new Date().toISOString().slice(0, 10)}）`;
  const curLetter = target.decision ? target.decision.split("·")[0].trim() : "";
  if (curLetter !== letter) {
    target.decision = want;
    target.needs_human = false;
    target.is_new = false;
    changed++;
    console.log(`${repo}: ${curLetter || "none"} -> ${letter}`);
  }
  await sleep(150);
}

if (changed > 0) {
  pf.human_review_resolved = { date: new Date().toISOString().slice(0, 10), note: "auto-synced from issues" };
  writeFileSync(path, JSON.stringify(pf, null, 1) + "\n");
}
console.log("decisions updated:", changed);
if (changed === 0) console.log("no changes");
