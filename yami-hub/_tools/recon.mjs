// recon.mjs — 红军侦察：列出所有注入点
import { readFileSync } from "node:fs";
const DEP = "C:/Users/cao41/.openclaw-autoclaw/workspace/projects/yami-hub/deploy";
const h = readFileSync(`${DEP}/index.html`, "utf8");
const w = readFileSync(`${DEP}/_worker.js`, "utf8");

console.log("== [P1] 模板字面量直插仓库字段的注入点 ==");
const m = h.match(/\$\{r\.(name|description|one_liner|full_name)\}|\$\{s\.(name|desc)\}|\$\{(?:x|it|pub|repo)\.(name|description|one_liner|full_name)\}/g) || [];
const byMatch = {};
m.forEach(x => byMatch[x] = (byMatch[x] || 0) + 1);
Object.entries(byMatch).forEach(([k, v]) => console.log(`  ${k} x${v}`));
console.log("  TOTAL:", m.length);

console.log("== [P2] esc() 定义与使用 ==");
console.log("  esc defined:", h.includes("function esc("));
console.log("  ${esc( usages:", (h.match(/\$\{esc\(/g) || []).length);

console.log("== [P3] 其他直插字段（label/str 通用变量难静态判定，抽查高风险区） ==");
for (const key of ["innerHTML = CONN_META", "mDesc", "p-line", "renderOverview", "s.name", "x.name"]) {
  const c = (h.match(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length;
  console.log(`  [${key}] x${c}`);
}

console.log("== [P4] worker: label 来源与净化 ==");
console.log("  sanitize present:", /sanitize|escapeHtml|stripTags/i.test(w));
console.log("  label 直接存 KV:", w.includes("label,") && w.includes("token: tok.access_token"));

console.log("== [P5] worker: origin 反射 ==");
const om = w.match(/origin/g) || [];
console.log("  origin usages:", om.length, "（Response.redirect 用它构建回调/回跳）");
console.log("  has url.origin:", w.includes("url.origin") || w.includes("{ pathname, origin }"));

console.log("== [P6] worker: cookie/session 安全属性 ==");
console.log("  HttpOnly+Secure+SameSite:", w.includes("HttpOnly; Secure; SameSite=Lax"));
console.log("  state 一次性 delete:", w.includes("delete(`state:${state}`)") || w.includes('env.KV.delete(`state:${state}`)'));

console.log("== [P7] sync 端点鉴权 ==");
console.log("  /api/github/sync 校验 session:", w.includes("请先在平台连接页连接 GitHub"));
console.log("  rate limit present:", /rate|limit/i.test(w));
