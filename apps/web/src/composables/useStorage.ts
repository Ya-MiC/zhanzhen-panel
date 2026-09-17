// composables/useStorage.ts — 統一存儲適配器（Phase 2 第二刀）
// 任務書 Phase 3 核心落地：UI 與 localStorage 解耦，為 IndexedDB/Tauri fs/雲同步預留接口
// 契約：全部讀寫帶 schema version + updatedAt；解析失敗不覆蓋、返回 null 讓調用方提示

export type StorageEnvelope<T> = {
  version: 1;
  updatedAt: string;
  data: T;
};

export interface StorageAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, data: T): Promise<void>;
  remove(key: string): Promise<void>;
  list(): Promise<string[]>;
  export(): Promise<string>;                       // 全量 JSON 導出（用戶備份用）
  import(json: string, mode: "merge" | "replace"): Promise<{ ok: boolean; imported: number; skipped: number }>;
}

/** localStorage 適配器（當前默認實現；未來 IndexedDB/Tauri fs 實現同接口） */
export class LocalStorageAdapter implements StorageAdapter {
  private prefix: string;

  constructor(prefix = "zhanzhen-panel") {
    // 向後兼容：v0.1 的四鍵無前綴（zhanzhen-panel-files-v1 本身就是全名）
    this.prefix = prefix;
  }

  private full(key: string): string {
    // key 傳入完整存儲鍵（如 "zhanzhen-panel-files-v1"），適配器只加封裝
    return key;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = localStorage.getItem(this.full(key));
      if (!raw) return null;
      // 兼容 v0.1 裸數組/裸值：無 envelope 時自動升級包裝
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && "version" in parsed && "data" in parsed) {
        return (parsed as StorageEnvelope<T>).data;
      }
      return parsed as T; // v0.1 舊格式直通
    } catch {
      // 解析失敗：不覆蓋、不刪除，返回 null 由調用方提示（任務書紅線）
      return null;
    }
  }

  async set<T>(key: string, data: T): Promise<void> {
    const envelope: StorageEnvelope<T> = {
      version: 1,
      updatedAt: new Date().toISOString(),
      data,
    };
    try {
      localStorage.setItem(this.full(key), JSON.stringify(envelope));
    } catch (e) {
      // 配額滿等寫入失敗：向上拋讓 UI toast，絕不靜默丟數據
      throw new Error(`本地存儲寫入失敗（可能配額已滿）：${String(e)}`);
    }
  }

  async remove(key: string): Promise<void> {
    localStorage.removeItem(this.full(key));
  }

  async list(): Promise<string[]> {
    const out: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(this.prefix)) out.push(k);
    }
    return out;
  }

  async export(): Promise<string> {
    const dump: Record<string, unknown> = {};
    for (const k of await this.list()) {
      try {
        dump[k] = JSON.parse(localStorage.getItem(k) || "");
      } catch {
        dump[k] = { _corrupted: true, raw: localStorage.getItem(k) };
      }
    }
    return JSON.stringify(
      { app: "zhanzhen-panel", exportedAt: new Date().toISOString(), data: dump },
      null,
      2,
    );
  }

  async import(json: string, mode: "merge" | "replace"): Promise<{ ok: boolean; imported: number; skipped: number }> {
    // 導入前校驗：必須能解析、必須有 data 字段；mode=replace 前調用方必須已讓用戶確認
    let parsed: { data?: Record<string, unknown>; app?: string };
    try {
      parsed = JSON.parse(json);
    } catch {
      throw new Error("JSON 解析失敗，導入已取消（現有數據未動）");
    }
    if (!parsed || typeof parsed !== "object" || !parsed.data) {
      throw new Error("文件缺少 data 字段，不是有效的 YamiHub/湛箴面板導出文件");
    }
    if (mode === "replace") {
      for (const k of await this.list()) localStorage.removeItem(k);
    }
    let imported = 0, skipped = 0;
    for (const [k, v] of Object.entries(parsed.data)) {
      if (typeof v !== "object" || v === null || (v as { _corrupted?: boolean })._corrupted) { skipped++; continue; }
      try {
        localStorage.setItem(k, JSON.stringify(v));
        imported++;
      } catch { skipped++; }
    }
    return { ok: true, imported, skipped };
  }
}
