// fix-login-final.mjs — 收尾：step3 HTML + gotoUnlock 监听器清理
import { readFileSync, writeFileSync } from "node:fs";
const p = "C:/Users/cao41/.openclaw-autoclaw/workspace/projects/yami-hub/deploy/index.html";
let h = readFileSync(p, "utf8");
let n = 0;
const rep = (from, to, label) => {
  if (!h.includes(from)) { console.error("MISS: " + label); process.exit(1); }
  h = h.split(from).join(to); n++;
};

rep('<li class="clickable" id="gotoUnlock"><span class="n">3</span><div><b>🔒 私有視圖</b><br><span>口令本地解密 14 個私有倉（點這裡直接跳到解鎖框）。</span></div></li>',
    '<li class="clickable" data-goto="connections"><span class="n">3</span><div><b>🔗 登錄你的帳號</b><br><span>連接 GitHub 後一鍵同步，私有倉自動可見（點這裡跳到平台連接）。</span></div></li>',
    "step3 html");

rep(`document.getElementById('gotoUnlock').addEventListener('click', () => {
  go('learn');
  setTimeout(() => { document.getElementById('passInput').focus(); document.getElementById('learnLock').scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 80);
});`,
    "",
    "gotoUnlock listener");

writeFileSync(p, h);
console.log("replacements:", n, "| size:", h.length);
const bad = ["Ya-MiC OS", "解鎖私有視圖", "私有口令", "14 個私有", "42 個已入畫廊", "gotoUnlock", "passInput", "unlockBtn"];
console.log("leftover:", bad.filter(b => h.includes(b)).join(" | ") || "(none)");
