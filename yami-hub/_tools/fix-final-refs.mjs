// fix-final-refs.mjs — 最後的個人敘事殘留清零
import { readFileSync, writeFileSync } from "node:fs";
const p = "C:/Users/cao41/.openclaw-autoclaw/workspace/projects/yami-hub/deploy/index.html";
let h = readFileSync(p, "utf8");

h = h.replace(
  '<div class="spec"><h4>Notion YANMING OS</h4><p>研究素材、個人任務、作品資料、每週回顧。</p></div>',
  '<div class="spec"><h4>Notion 工作區</h4><p>頁面、數據庫、任務——授權後自動同步。</p></div>'
);
// 59+42 殘留定位清理（引導視點步驟條）
h = h.split("'59 + 42'").join("'你的帳號'");

writeFileSync(p, h);
console.log("YANMING gone:", !h.includes("YANMING OS"));
console.log("59+42 gone:", !h.includes("59 + 42"));
console.log("湛箴 refs:", (h.match(/湛箴/g) || []).length, "(審計平台倉庫名 zhanzhen 在 A_TEAM 已清，面板正文若剩'湛箴'品牌字樣僅在決策紀錄內容裡)");
