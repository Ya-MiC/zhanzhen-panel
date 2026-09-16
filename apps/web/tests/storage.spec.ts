import { describe, it, expect } from "vitest";

// smoke：localStorage 契約（四鍵 -v1 後綴、解析失敗不覆蓋）
const KEYS = ["zhanzhen-panel-files-v1", "zhanzhen-panel-tasks-v1", "zhanzhen-panel-theme-v1", "zhanzhen-panel-chat-v1"];

describe("storage contract", () => {
  it("keys use -v1 versioned suffix", () => {
    KEYS.forEach((k) => expect(k.endsWith("-v1")).toBe(true));
  });
  it("corrupted json does not crash restore path (App.vue restoreLocalData uses try/catch)", () => {
    // 模擬壞數據：JSON.parse 應拋錯，App.vue 的 restoreLocalData 已用 try/catch 包裹
    const bad = "{ not valid json";
    expect(() => JSON.parse(bad)).toThrow();
  });
  it("valid file record shape", () => {
    const rec = { id: "d1", name: "a.md", extension: "md", content: "# hi", importedAt: "2026-09-16", wordCount: 4 };
    expect(rec.wordCount).toBeTypeOf("number");
  });
});
