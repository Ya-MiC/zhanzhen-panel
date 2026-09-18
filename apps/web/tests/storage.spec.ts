// apps/web/tests/storage.spec.ts — 存儲契約測試（顯式 import node:test，與 node 類型兼容）
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { LocalStorageAdapter } from "../src/composables/useStorage";

class MockLS {
  m: Map<string, string>;
  constructor() { this.m = new Map(); }
  getItem(k: string): string | null { return this.m.has(k) ? this.m.get(k)! : null; }
  setItem(k: string, v: string) { this.m.set(k, String(v)); }
  removeItem(k: string) { this.m.delete(k); }
  key(i: number): string | null { return [...this.m.keys()][i] ?? null; }
  get length(): number { return this.m.size; }
  clear() { this.m.clear(); }
}
(globalThis as any).localStorage = new MockLS();

describe("LocalStorageAdapter 存儲契約", () => {
  it("set 寫入帶 envelope（version=1 + updatedAt + data）", async () => {
    const ad = new LocalStorageAdapter();
    await ad.set("zhanzhen-panel-files-v1", [{ id: "d1" }]);
    const raw = JSON.parse(localStorage.getItem("zhanzhen-panel-files-v1")!);
    assert.equal(raw.version, 1);
    assert.ok(raw.updatedAt);
    assert.deepEqual(raw.data, [{ id: "d1" }]);
  });

  it("get 讀 envelope 自動拆包返回 data", async () => {
    const ad = new LocalStorageAdapter();
    await ad.set("k1", { hello: "world" });
    assert.deepEqual(await ad.get<{ hello: string }>("k1"), { hello: "world" });
  });

  it("v0.1 裸格式（無 envelope）向後兼容直通", async () => {
    const ad = new LocalStorageAdapter();
    localStorage.setItem("zhanzhen-panel-files-v1", JSON.stringify([{ id: "legacy" }]));
    const v = await ad.get<{ id: string }[]>("zhanzhen-panel-files-v1");
    assert.equal(v![0].id, "legacy");
  });

  it("壞 JSON：get 返回 null 不拋錯、原文保留不覆蓋", async () => {
    const ad = new LocalStorageAdapter();
    localStorage.setItem("bad", "{broken");
    assert.equal(await ad.get("bad"), null);
    assert.equal(localStorage.getItem("bad"), "{broken");
  });

  it("remove 清除鍵", async () => {
    const ad = new LocalStorageAdapter();
    await ad.set("k2", 1);
    await ad.remove("k2");
    assert.equal(await ad.get("k2"), null);
  });

  it("export 全量含 app 標識與時間戳", async () => {
    const ad = new LocalStorageAdapter();
    await ad.set("a", 1);
    const dump = JSON.parse(await ad.export());
    assert.equal(dump.app, "zhanzhen-panel");
    assert.ok(dump.exportedAt);
    assert.equal(dump.data.a.data, 1);
  });

  it("import merge：有效鍵寫入、_corrupted 跳過", async () => {
    const ad = new LocalStorageAdapter();
    const json = JSON.stringify({
      app: "zhanzhen-panel",
      data: {
        x: { version: 1, updatedAt: "t", data: [1, 2] },
        bad: { _corrupted: true },
      },
    });
    const r = await ad.import(json, "merge");
    assert.equal(r.imported, 1);
    assert.equal(r.skipped, 1);
    assert.deepEqual(await ad.get<number[]>("x"), [1, 2]);
  });

  it("import 缺 data 字段：拋錯且現有數據不動", async () => {
    const ad = new LocalStorageAdapter();
    await ad.set("keep", "原值");
    await assert.rejects(ad.import(JSON.stringify({ foo: 1 }), "merge"), /data 字段/);
    assert.equal(await ad.get("keep"), "原值");
  });

  it("import replace：清空後寫入", async () => {
    const ad = new LocalStorageAdapter();
    await ad.set("old", "舊數據");
    const json = JSON.stringify({
      app: "zhanzhen-panel",
      data: { "new-key": { version: 1, updatedAt: "t", data: "新" } },
    });
    await ad.import(json, "replace");
    assert.equal(await ad.get("old"), null);
    assert.equal(await ad.get("new-key"), "新");
  });
});
