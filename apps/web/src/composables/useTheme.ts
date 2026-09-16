// composables/useTheme.ts — 主題狀態（Phase 2 從 App.vue 拆出，行為等價）
// 三主題接口已預留（任務書 §2：兩套淺色 + 一套深色）；當前雙態行為與 v0.1 完全一致。
import { ref } from "vue";

export type ThemeMode = "light" | "dark";
const STORAGE_KEY = "zhanzhen-panel-theme-v1"; // 與 v0.1 同鍵：舊 localStorage 數據向後兼容

const isDark = ref(false);

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, isDark.value ? "dark" : "light");
  } catch {
    /* storage 不可用時靜默（隱私模式） */
  }
}

export function useTheme() {
  function toggleTheme() {
    isDark.value = !isDark.value;
    persist();
  }

  /** 從 localStorage 還原（App.vue restoreLocalData 調用；解析失敗不拋出） */
  function restore() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) isDark.value = stored === "dark";
    } catch {
      /* 同上 */
    }
  }

  /** Phase 2 後續：三主題模式（light-pink / light-plain / dark），接口預留 */
  function setMode(_mode: string) {
    // TODO(v0.3): 第二淺色主題上線時實現；當前保持雙態等價
    toggleTheme();
  }

  return { isDark, toggleTheme, restore, setMode };
}
