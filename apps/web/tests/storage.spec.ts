// storage.spec.ts — useStorage 單元測試（vitest，零外部依賴、零真實 AI）
import { describe, it, expect, beforeEach } from "vitest";
import { LocalStorageAdapter } from "../src/composables/useStorage";

// jsdom-free：手寫 localStorage mock（Node 環境無 window）
class MockLS {
  private m = new Map<string, string>();
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null; }
  setItem(k: string, v: string) { this.m.set(k, String(v)); }
  removeItem(k: string) { this.m.delete(k); }
  key(i: number) { return [...this.m.keys()][i] ?? null; }
  get length() { return this.m.size; }
}
// @ts-expect-error 測試環境注入
globalThis.localStorage = new MockLS();

describe("LocalStorageAdapter", () => {
  let ad: LocalStorageAdapter;
  beforeEach(() => { ad = new LocalStorageAdapter(); localStorage.clear(); });

  it("set 寫入帶 envelope（version+updatedAt+data）", async () => {
    await ad.set("zhanzhen-panel-files-v1", [{ id: "d1" }]);
    const raw = JSON.parse(localStorage.getItem("zhanzhen-panel-files-v1")!);
    expect(raw.version).toBe(1);
    expect(raw.updatedAt).toBeTruthy();
    expect(raw.data).toEqual([{ id: "d1" }]);
  });

  it("get 讀 envelope 拆包返回 data", async () => {
    await ad.set("k1", { hello: "world" });
    expect(await ad.get("k1")).toEqual({ hello: "world" });
  });

  it("v0.1 裸格式向後兼容直通", async () => {
    localStorage.setItem("zhanzhen-panel-files-v1", JSON.stringify([{ id: "legacy" }]));
    const v = await ad.get<{ id: string }[]>("zhanzhen-panel-files-v1");
    expect(v![0].id).toBe("legacy");
  });

  it("壞 JSON 返回 null 不拋不覆蓋", async () => {
    localStorage.setItem("bad", "{broken");
    expect(await ad.get("bad")).toBeNull();
    expect(localStorage.getItem("bad")).toBe("{broken"); // 原文保留
  });

  it("remove 清除鍵", async () => {
    await ad.set("k2", 1);
    await ad.remove("k2");
    expect(await ad.get("k2")).toBeNull();
  });

  it("export 全量含 app 標識與時間戳", async () => {
    await ad.set("a", 1);
    const dump = JSON.parse(await ad.export());
    expect(dump.app).toBe("zhanzhen-panel");
    expect(dump.exportedAt).toBeTruthy();
    expect(dump.data.a.data).toBe(1);
  });

  it("import merge 寫入有效鍵、跳過損壞項", async () => {
    const json = JSON.stringify({ app: "zhanzhen-panel", data: { x: { version: 1, data: [1, 2] }, bad: { _corrupted: true } } });
    const r = await ad.import(json, "merge");
    expect(r.imported).toBe(1);
    expect(r.skipped).toBe(1);
    expect(await ad.get("x")).toEqual([1, 2]);
  });

  it("import 無 data 字段拋錯且不動現有數據", async () => {
    await ad.set("keep", "原值");
    await expect(ad.import(JSON.stringify({ foo: 1 }), "merge")).rejects.toThrow("data 字段");
    expect(await ad.get("keep")).toBe("原值");
  });
});
