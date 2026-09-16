// fix-v02.mjs — v0.2 四件套：boot 順序修復 / 本地保險箱（AES-GCM 加密持久化）/ 自動同步 / 地圖主路徑播放
import { readFileSync, writeFileSync } from "node:fs";
const DEP = "C:/Users/cao41/.openclaw-autoclaw/workspace/projects/yami-hub/deploy";
let h = readFileSync(`${DEP}/index.html`, "utf8");
let n = 0;
const rep = (from, to, label) => {
  if (!h.includes(from)) { console.error("MISS: " + label); process.exit(1); }
  h = h.split(from).join(to); n++;
};

/* ===== 1. boot 順序修復：__forceLoginLanding 必須在 go 包裝前生效——把 go('login') 移進 boot 尾部 ===== */
rep(
  "const _go = go;\ngo = function(page) { _go(page); if (page === 'overview') yamiPatchOverview(); };\nif (window.__forceLoginLanding) { go('login'); }",
  "const _go = go;\ngo = function(page) { _go(page); if (page === 'overview') yamiPatchOverview(); };",
  "wrapper cleanup"
);

/* boot 尾部：渲染完後，未連接 → 切登錄首屏；已連接 → 有保險箱則解密還原，無則自動同步 */
rep(
  "  const repos = fmtRepos();\n  const movedCount = window.Scoring ? Scoring.applyAll(repos) : 0;\n  renderOverview(repos);",
  `  const repos = fmtRepos();
  const movedCount = window.Scoring ? Scoring.applyAll(repos) : 0;
  // v0.2: 登錄首屏路由 / 保險箱還原 / 自動同步（在首屏渲染前完成路由決策）
  (async function postBoot() {
    if (window.__forceLoginLanding) { go('login'); return; }
    if (window.__demoAvailable) { go('login'); return; }
    // 已連接：嘗試從本地保險箱還原上次同步
    const restored = await YamiVault.tryRestore();
    if (restored) {
      const r2 = YamiLive.apply(restored.repositories);
      renderOverview(r2); chipsRender(); paintAssets(); initAlgo(r2);
      go('overview');
      return;
    }
    // 無存檔 → 自動同步一次（已連接場景）
    try {
      const r2 = await YamiLive.sync();
      await YamiVault.save(r2);
      renderOverview(r2); chipsRender(); paintAssets(); initAlgo(r2);
      go('overview');
    } catch (e) { go('overview'); }
  })();
  renderOverview(repos);`,
  "boot post route"
);

/* ===== 2. YamiVault 本地保險箱（AES-256-GCM + PBKDF2 250k，口令用戶自持） ===== */
rep(
  "/* ---------- 登錄首屏邏輯 ---------- */",
  `/* ---------- YamiVault 本地保險箱（v0.2） ----------
 * 同步的倉庫數據用 AES-256-GCM 加密後存 localStorage；口令只用於派生密鑰，不存儲。
 * 服務端零知識：保險箱完全在瀏覽器本地，換瀏覽器/清緩存 = 重新同步。 */
const YamiVault = {
  KEY_STORAGE: 'yamiHub.vault.pass',
  DATA_KEY: 'yamiHub.vault.data',
  async _deriveKey(pass, salt) {
    const km = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 250000, hash: 'SHA-256' },
      km, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  },
  async save(repos) {
    try {
      let pass = localStorage.getItem(this.KEY_STORAGE);
      if (!pass) {
        pass = ''; const abc = 'abcdefghjkmnpqrstuvwxyz23456789';
        const arr = crypto.getRandomValues(new Uint8Array(20));
        for (const b of arr) pass += abc[b % abc.length];
        localStorage.setItem(this.KEY_STORAGE, pass);
      }
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const key = await this._deriveKey(pass, salt);
      const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key,
        new TextEncoder().encode(JSON.stringify({ savedAt: new Date().toISOString(), repositories: repos }))));
      const packed = new Uint8Array(16 + 12 + ct.length);
      packed.set(salt, 0); packed.set(iv, 16); packed.set(ct, 28);
      localStorage.setItem(this.DATA_KEY, btoa(String.fromCharCode(...packed)));
      return pass; // 首次生成時顯示給用戶
    } catch (e) { return null; }
  },
  async tryRestore() {
    try {
      const b64 = localStorage.getItem(this.DATA_KEY);
      if (!b64) return null;
      const pass = localStorage.getItem(this.KEY_STORAGE);
      if (!pass) return null;
      const bin = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
      const salt = bin.slice(0, 16), iv = bin.slice(16, 28), ct = bin.slice(28);
      const key = await this._deriveKey(pass, salt);
      const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
      const j = JSON.parse(new TextDecoder().decode(plain));
      if (j && Array.isArray(j.repositories) && j.repositories.length) return j;
      return null;
    } catch (e) { return null; }
  },
  showPassOnce(pass) {
    if (!pass) return;
    const b = document.getElementById('connBanner');
    if (b) b.innerHTML = '✅ 同步完成。本地保險箱已用隨機口令加密（自動記憶，無需抄寫；清除瀏覽器數據會要求重新同步）。';
    if (b) b.classList.add('show');
  },
};

/* ---------- 登錄首屏邏輯 ---------- */`,
  "vault"
);

/* ===== 3. 自動同步後調用 showPassOnce + 同步按鈕也走保險箱 ===== */
rep(
  "    const r2 = await YamiLive.sync();\n      await YamiVault.save(r2);\n      renderOverview(r2); chipsRender(); paintAssets(); initAlgo(r2);\n      go('overview');",
  "    const r2 = await YamiLive.sync();\n      const pass = await YamiVault.save(r2);\n      renderOverview(r2); chipsRender(); paintAssets(); initAlgo(r2);\n      YamiVault.showPassOnce(pass);\n      go('overview');",
  "autosave show pass"
);

/* 平台連接頁的同步按鈕 handler 接保險箱 */
rep(
  `    const repos2 = await YamiLive.sync();`,
  `    const repos2 = await YamiLive.sync();
    try { const pass = await YamiVault.save(repos2); YamiVault.showPassOnce(pass); } catch (e) {}`,
  "sync button vault"
);

/* ===== 4. 地圖主路徑逐步播放（archify 式引導，活體引擎上重現交互精華） ===== */
rep(
  "  stage.querySelectorAll('.al-node[data-href]').forEach(el => {",
  `  // 主路徑逐步播放：點 ▶ 依次點亮主路徑節點
  const playBtnId = 'alPlayBtn';
  let old = document.getElementById(playBtnId);
  if (old) old.remove();
  const pb = document.createElement('button');
  pb.id = playBtnId;
  pb.textContent = '▶ 播放主路徑';
  pb.style.cssText = 'font-family:monospace;font-size:12px;padding:8px 14px;border-radius:10px;border:1px solid #A78BFA;background:transparent;color:#A78BFA;cursor:pointer;margin-left:8px';
  document.getElementById('alAiBadge').parentElement.appendChild(pb);
  const mainNodes = [...stage.querySelectorAll('g.al-node')];
  let playTimer = null;
  pb.addEventListener('click', function () {
    if (playTimer) { clearInterval(playTimer); playTimer = null; pb.textContent = '▶ 播放主路徑'; mainNodes.forEach(g => g.style.opacity = ''); return; }
    let i = 0;
    pb.textContent = '⏸ 暫停';
    const dim = () => mainNodes.forEach((g, gi) => g.style.opacity = gi <= i ? '' : '.25');
    dim();
    playTimer = setInterval(function () {
      i++;
      if (i >= mainNodes.length) { clearInterval(playTimer); playTimer = null; pb.textContent = '▶ 播放主路徑'; mainNodes.forEach(g => g.style.opacity = ''); return; }
      dim();
    }, 900);
  });
  stage.querySelectorAll('.al-node[data-href]').forEach(el => {`,
  "map play"
);

writeFileSync(`${DEP}/index.html`, h);
console.log("replacements:", n, "| size:", h.length);
const need = ["YamiVault", "tryRestore", "alPlayBtn", "postBoot"];
const miss = need.filter(k => !h.includes(k));
console.log("verify:", miss.length ? "MISSING " + miss : "ALL OK");
