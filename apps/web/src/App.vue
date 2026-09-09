<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

type PageKey =
  | "home"
  | "files"
  | "reading"
  | "graphs"
  | "profile"
  | "writing";

type LocalFile = {
  id: string;
  name: string;
  extension: string;
  content: string;
  importedAt: string;
  wordCount: number;
};

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
};

const STORAGE_FILES = "zhanzhen-panel-files-v1";
const STORAGE_TASKS = "zhanzhen-panel-tasks-v1";
const STORAGE_THEME = "zhanzhen-panel-theme-v1";
const STORAGE_CHAT = "zhanzhen-panel-chat-v1";

const pages: Array<{ id: PageKey; icon: string; label: string }> = [
  { id: "home", icon: "⌂", label: "首頁" },
  { id: "files", icon: "▤", label: "我的文件" },
  { id: "reading", icon: "⌕", label: "讀書分析" },
  { id: "graphs", icon: "⌘", label: "流程圖" },
  { id: "profile", icon: "◈", label: "思路画像" },
  { id: "writing", icon: "✎", label: "寫作工坊" },
];

const currentPage = ref<PageKey>("home");
const isDark = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
const files = ref<LocalFile[]>([]);
const selectedFileId = ref<string | null>(null);
const draftContent = ref("");
const toast = ref("");
const chatInput = ref("");
const taskInput = ref("");
const savedTasks = ref<string[]>([]);
const chatMessages = ref<ChatMessage[]>([
  {
    id: "welcome",
    role: "assistant",
    content:
      "你好，我是湛箴 AI 助手。先匯入一篇 .md 或 .txt 文章；我會協助你建立文章結構、論證流程與作者思路的初步分析。",
  },
]);

const selectedFile = computed(() => {
  return files.value.find((file) => file.id === selectedFileId.value) ?? null;
});

const wordCount = computed(() => {
  const text = draftContent.value.trim();
  if (!text) return 0;
  return text.replace(/\s/g, "").length;
});

const pageTitle = computed(() => {
  const map: Record<PageKey, string> = {
    home: "智能文件工作台",
    files: "我的文件",
    reading: "讀書分析",
    graphs: "流程圖",
    profile: "思路画像",
    writing: "寫作工坊",
  };

  return map[currentPage.value];
});

const pageSubtitle = computed(() => {
  const map: Record<PageKey, string> = {
    home: "先理解文章的思路，再開始協作寫作。",
    files: "本地優先保存。真實客戶資料不提交至 GitHub。",
    reading: "將內容、結構、論證與語言表達分開理解。",
    graphs: "先看清楚文章如何被搭建，再開始生成。",
    profile: "只使用你確認過的寫作規律。",
    writing: "先產生大綱，確認後再分段協作。",
  };

  return map[currentPage.value];
});

function id(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function showToast(message: string) {
  toast.value = message;
  window.setTimeout(() => {
    toast.value = "";
  }, 3200);
}

function persistFiles() {
  localStorage.setItem(STORAGE_FILES, JSON.stringify(files.value));
}

function persistTasks() {
  localStorage.setItem(STORAGE_TASKS, JSON.stringify(savedTasks.value));
}

function persistChat() {
  localStorage.setItem(STORAGE_CHAT, JSON.stringify(chatMessages.value));
}

function saveCurrentFile() {
  if (!selectedFile.value) {
    showToast("請先建立或匯入一份文字文件。");
    return;
  }

  const file = selectedFile.value;
  file.content = draftContent.value;
  file.wordCount = wordCount.value;
  persistFiles();
  showToast(`已本地保存「${file.name}」。`);
}

function createNewDocument() {
  const newFile: LocalFile = {
    id: id("document"),
    name: `未命名文檔-${new Date().toLocaleDateString("zh-TW")}.md`,
    extension: "md",
    content: "# 新文檔\n\n在這裡寫下你的想法，或匯入既有文章後建立思路画像。",
    importedAt: new Date().toLocaleString("zh-TW"),
    wordCount: 0,
  };

  newFile.wordCount = newFile.content.replace(/\s/g, "").length;
  files.value.unshift(newFile);
  selectedFileId.value = newFile.id;
  draftContent.value = newFile.content;
  currentPage.value = "files";
  persistFiles();
  showToast("已建立新的本地 Markdown 文檔。");
}

function openFilePicker() {
  fileInput.value?.click();
}

function importTextFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) return;

  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  if (!["md", "txt"].includes(extension)) {
    showToast("第一版目前可實際讀取 .md 與 .txt；DOCX、XLSX、PDF 已在工作台規劃中。");
    input.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const content = String(reader.result ?? "");
    const imported: LocalFile = {
      id: id("import"),
      name: file.name,
      extension,
      content,
      importedAt: new Date().toLocaleString("zh-TW"),
      wordCount: content.replace(/\s/g, "").length,
    };

    files.value.unshift(imported);
    selectedFileId.value = imported.id;
    draftContent.value = imported.content;
    currentPage.value = "files";
    persistFiles();

    showToast(`已匯入「${file.name}」，內容只保留在這個瀏覽器的本地儲存中。`);
  };

  reader.onerror = () => {
    showToast("文件讀取失敗，請確認它是 UTF-8 編碼的 .md 或 .txt 文件。");
  };

  reader.readAsText(file, "utf-8");
  input.value = "";
}

function selectFile(file: LocalFile) {
  selectedFileId.value = file.id;
  draftContent.value = file.content;
  currentPage.value = "files";
}

function deleteFile(fileId: string) {
  const file = files.value.find((item) => item.id === fileId);
  if (!file) return;

  const accepted = window.confirm(`確定刪除本地文件「${file.name}」？此操作無法復原。`);
  if (!accepted) return;

  files.value = files.value.filter((item) => item.id !== fileId);
  if (selectedFileId.value === fileId) {
    selectedFileId.value = files.value[0]?.id ?? null;
    draftContent.value = files.value[0]?.content ?? "";
  }

  persistFiles();
  showToast("本地文件已刪除。");
}

function runReadingAnalysis() {
  if (!selectedFile.value || !draftContent.value.trim()) {
    showToast("請先匯入或建立一篇有內容的 .md / .txt 文件。");
    currentPage.value = "files";
    return;
  }

  saveCurrentFile();
  currentPage.value = "reading";
  showToast("已建立初步讀書分析。下一版會接入真實 AI 與可追溯來源定位。");
}

function addTask() {
  const task = taskInput.value.trim();
  if (!task) {
    showToast("請先描述任務，例如「分析這篇文章的論證結構」。");
    return;
  }

  savedTasks.value.unshift(task);
  taskInput.value = "";
  persistTasks();
  showToast("任務已保存到本機。你可以在讀書分析或寫作工坊繼續處理。");
}

function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;

  chatMessages.value.push({
    id: id("user"),
    role: "user",
    content: text,
  });

  chatInput.value = "";
  window.setTimeout(() => {
    chatMessages.value.push({
      id: id("assistant"),
      role: "assistant",
      content:
        "已收到。第一版目前會先把任務保留在本機；接下來我們將接入「讀書 Skill」：結構圖、論證圖、作者思路圖與可確認的思路画像。",
    });
    persistChat();
  }, 350);

  persistChat();
}

function useTaskForWriting() {
  if (!selectedFile.value) {
    createNewDocument();
  }

  currentPage.value = "writing";
  showToast("已進入寫作工坊。下一個功能將先實作「大綱先行」。");
}

function toggleTheme() {
  isDark.value = !isDark.value;
  localStorage.setItem(STORAGE_THEME, isDark.value ? "dark" : "light");
}

function restoreLocalData() {
  try {
    const storedFiles = localStorage.getItem(STORAGE_FILES);
    const storedTasks = localStorage.getItem(STORAGE_TASKS);
    const storedTheme = localStorage.getItem(STORAGE_THEME);
    const storedChat = localStorage.getItem(STORAGE_CHAT);

    if (storedFiles) {
      files.value = JSON.parse(storedFiles);
      const firstFile = files.value[0];
      if (firstFile) {
        selectedFileId.value = firstFile.id;
        draftContent.value = firstFile.content;
      }
    }

    if (storedTasks) savedTasks.value = JSON.parse(storedTasks);
    if (storedTheme) isDark.value = storedTheme === "dark";
    if (storedChat) chatMessages.value = JSON.parse(storedChat);
  } catch {
    showToast("本地資料讀取失敗；你仍可正常建立新的文件與任務。");
  }
}

onMounted(restoreLocalData);
</script>

<template>
  <div class="app" :class="{ dark: isDark }">
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-mark">湛</div>
        <div>
          <strong>湛箴</strong>
          <span>ZHANZHEN PANEL</span>
        </div>
      </div>

      <p class="nav-label">工作台</p>
      <nav class="nav-list">
        <button
          v-for="page in pages"
          :key="page.id"
          class="nav-item"
          :class="{ active: currentPage === page.id }"
          @click="currentPage = page.id"
        >
          <span>{{ page.icon }}</span>
          {{ page.label }}
        </button>
      </nav>

      <p class="nav-label bottom-label">系統</p>
      <button class="nav-item">
        <span>⚙</span>
        設定
      </button>

      <div class="sidebar-footer">
        <strong>本地優先</strong>
        <span>文件與任務保留在本機瀏覽器。</span>
      </div>
    </aside>

    <main class="main">
      <header class="topbar">
        <div>
          <h1>{{ pageTitle }}</h1>
          <p>{{ pageSubtitle }}</p>
        </div>

        <div class="topbar-actions">
          <button class="theme-button" @click="toggleTheme">
            {{ isDark ? "☀ 亮色淡粉" : "◐ 深色莊重" }}
          </button>
          <span class="local-badge">● 本地工作區</span>
        </div>
      </header>

      <section v-if="currentPage === 'home'" class="home-page">
        <section class="hero-card">
          <div>
            <p class="eyebrow">READ · REASON · CREATE</p>
            <h2>輸入你的想法，讓 AI 為你工作</h2>
            <p>
              讀書 Skill 分析文章的結構、論證、證據與語言；
              女媧 Skill 使用你確認的思路，先產生大綱，再逐段協作創作。
            </p>
          </div>

          <div class="hero-mark">
            <span>人</span>
            <i>+</i>
            <span>AI</span>
          </div>
        </section>

        <section class="task-box">
          <input
            v-model="taskInput"
            placeholder="例如：分析這份文章的思路、論證鏈與寫作結構…"
            @keydown.enter="addTask"
          />
          <button @click="addTask">開始協作 →</button>
        </section>

        <section class="action-grid">
          <button class="action-card" @click="createNewDocument">
            <span class="action-icon pink">▤</span>
            <strong>新建文檔</strong>
            <small>建立本地 Markdown 文檔</small>
          </button>

          <button class="action-card" @click="openFilePicker">
            <span class="action-icon mint">⇧</span>
            <strong>匯入文章</strong>
            <small>目前支援 MD / TXT</small>
          </button>

          <button class="action-card" @click="runReadingAnalysis">
            <span class="action-icon violet">⌕</span>
            <strong>讀書分析</strong>
            <small>結構、論證與思路</small>
          </button>

          <button class="action-card" @click="useTaskForWriting">
            <span class="action-icon red">✦</span>
            <strong>女媧寫作</strong>
            <small>先大綱、後逐段協作</small>
          </button>
        </section>

        <section class="content-grid">
          <article class="panel-card">
            <div class="panel-head">
              <h3>最近文件</h3>
              <button @click="currentPage = 'files'">查看全部 →</button>
            </div>

            <div v-if="files.length" class="file-list">
              <button
                v-for="file in files.slice(0, 4)"
                :key="file.id"
                class="file-row"
                @click="selectFile(file)"
              >
                <span class="file-type">{{ file.extension.toUpperCase() }}</span>
                <span class="file-info">
                  <b>{{ file.name }}</b>
                  <small>{{ file.wordCount }} 字 · {{ file.importedAt }}</small>
                </span>
                <span>›</span>
              </button>
            </div>

            <div v-else class="empty-state">
              尚未匯入文件。先匯入一篇脫敏的 `.md` 或 `.txt` 文章。
            </div>
          </article>

          <article class="panel-card">
            <div class="panel-head">
              <h3>完整智能體流程</h3>
              <span class="muted">v0.1</span>
            </div>

            <ol class="workflow">
              <li>
                <span>1</span>
                <div><b>人 + AI 共創</b><small>匯入文件，界定任務。</small></div>
              </li>
              <li>
                <span>2</span>
                <div><b>讀書與分析</b><small>拆解結構、論證、證據與語言。</small></div>
              </li>
              <li>
                <span>3</span>
                <div><b>人工確認</b><small>確認或否決思路画像。</small></div>
              </li>
              <li>
                <span>4</span>
                <div><b>女媧 Skill 寫作</b><small>先大綱，再逐段生成與修訂。</small></div>
              </li>
            </ol>
          </article>
        </section>
      </section>

      <section v-else-if="currentPage === 'files'" class="files-page">
        <div class="section-toolbar">
          <div>
            <h2>本地文件</h2>
            <p>第一版實際可讀取 Markdown 與純文字；DOCX、XLSX、PDF 的入口已規劃。</p>
          </div>
          <div class="toolbar-buttons">
            <button class="ghost-button" @click="createNewDocument">＋ 新建文檔</button>
            <button class="primary-button" @click="openFilePicker">⇧ 匯入 MD / TXT</button>
          </div>
        </div>

        <div class="editor-layout">
          <aside class="file-sidebar">
            <button
              v-for="file in files"
              :key="file.id"
              class="file-card"
              :class="{ selected: selectedFileId === file.id }"
              @click="selectFile(file)"
            >
              <span class="file-type">{{ file.extension.toUpperCase() }}</span>
              <span>
                <b>{{ file.name }}</b>
                <small>{{ file.wordCount }} 字</small>
              </span>
            </button>

            <div v-if="!files.length" class="empty-state compact">
              尚無文件
            </div>
          </aside>

          <article class="editor-card">
            <template v-if="selectedFile">
              <div class="editor-head">
                <div>
                  <b>{{ selectedFile.name }}</b>
                  <small>本地保存 · {{ wordCount }} 字</small>
                </div>
                <div>
                  <button class="ghost-button small" @click="runReadingAnalysis">讀書分析</button>
                  <button class="primary-button small" @click="saveCurrentFile">保存</button>
                </div>
              </div>

              <textarea
                v-model="draftContent"
                class="document-editor"
                spellcheck="false"
                placeholder="在這裡撰寫或修改內容…"
              />
            </template>

            <div v-else class="empty-state editor-empty">
              <b>還沒有可編輯文件</b>
              <span>建立文檔，或匯入 `.md` / `.txt` 文件後開始。</span>
              <button class="primary-button" @click="createNewDocument">新建文檔</button>
            </div>
          </article>
        </div>
      </section>

      <section v-else-if="currentPage === 'reading'" class="analysis-page">
        <div class="section-toolbar">
          <div>
            <h2>讀書分析</h2>
            <p>先把文章看懂：核心問題、篇章結構、論證鏈與可用的思路規律。</p>
          </div>
          <button class="primary-button" @click="runReadingAnalysis">↻ 重新分析</button>
        </div>

        <div v-if="selectedFile && draftContent.trim()" class="analysis-content">
          <article class="analysis-intro">
            <span class="analysis-tag">目前分析文件</span>
            <h3>{{ selectedFile.name }}</h3>
            <p>
              這是本地 MVP 的分析預覽。後續將接入真實 AI、來源段落定位、
              多文件交叉驗證與可編輯的思路画像。
            </p>
          </article>

          <div class="insight-grid">
            <article class="insight-card">
              <span>01</span>
              <h4>閱讀問題</h4>
              <p>文章主要想解決什麼問題？讀者讀完應做出什麼判斷？</p>
            </article>
            <article class="insight-card">
              <span>02</span>
              <h4>文章結構</h4>
              <p>背景 → 問題 → 主張 → 證據 → 結論 → 建議。</p>
            </article>
            <article class="insight-card">
              <span>03</span>
              <h4>論證流程</h4>
              <p>觀察事實、選擇標準、使用證據、形成推理、輸出結論。</p>
            </article>
            <article class="insight-card">
              <span>04</span>
              <h4>作者思路</h4>
              <p>辨識作者如何界定問題、處理不確定性和安排表達。</p>
            </article>
          </div>

          <article class="source-preview">
            <div class="panel-head">
              <h3>原文預覽</h3>
              <span class="muted">之後每個結論將可回到原始段落</span>
            </div>
            <pre>{{ draftContent.slice(0, 1800) }}{{ draftContent.length > 1800 ? "\n…" : "" }}</pre>
          </article>
        </div>

        <div v-else class="empty-state large">
          <b>請先選擇一份有內容的文件</b>
          <span>先到「我的文件」匯入 `.md` 或 `.txt`，再回來進行讀書分析。</span>
          <button class="primary-button" @click="currentPage = 'files'">前往我的文件</button>
        </div>
      </section>

      <section v-else-if="currentPage === 'graphs'" class="graphs-page">
        <div class="section-toolbar">
          <div>
            <h2>流程圖</h2>
            <p>圖不是裝飾：它讓你看見一篇文章如何搭建、如何推理、如何得出結論。</p>
          </div>
          <button class="primary-button" @click="runReadingAnalysis">用目前文件建圖</button>
        </div>

        <div class="graph-grid">
          <article class="graph-card">
            <h3>文章結構圖</h3>
            <div class="node-flow">
              <span>背景</span><i>→</i><span>問題</span><i>→</i><span>主張</span><i>→</i><span>結論</span>
            </div>
            <p>回答：文章是如何被搭建起來的？</p>
          </article>

          <article class="graph-card">
            <h3>論證與證據圖</h3>
            <div class="node-flow evidence">
              <span>事實</span><i>→</i><span>證據</span><i>→</i><span>推理</span><i>→</i><span>建議</span>
            </div>
            <p>回答：作者如何從資料走到判斷？</p>
          </article>

          <article class="graph-card">
            <h3>作者思路圖</h3>
            <div class="node-flow thinking">
              <span>界定</span><i>→</i><span>標準</span><i>→</i><span>驗證</span><i>→</i><span>表達</span>
            </div>
            <p>回答：作者通常如何思考與寫作？</p>
          </article>
        </div>

        <article class="notice-card">
          <b>下一版目標</b>
          <span>把這三張圖改為可點擊節點、可追溯來源、可修改連線、可匯出 Mermaid / SVG / JSON 的真實圖譜。</span>
        </article>
      </section>

      <section v-else-if="currentPage === 'profile'" class="profile-page">
        <div class="section-toolbar">
          <div>
            <h2>思路画像</h2>
            <p>不是只模仿句子，而是建立你或你的團隊「如何思考與寫作」的可確認規則。</p>
          </div>
          <button class="primary-button" @click="runReadingAnalysis">從目前文件建立</button>
        </div>

        <div class="profile-grid">
          <article class="profile-card">
            <span>認知框架</span>
            <h3>先界定問題，再安排答案</h3>
            <p>未來將由多篇文章交叉驗證，而非從一小段文字下結論。</p>
          </article>
          <article class="profile-card">
            <span>論證方式</span>
            <h3>證據 → 推理 → 結論</h3>
            <p>每個規律都要回連原文，並顯示高、中、低可信度。</p>
          </article>
          <article class="profile-card">
            <span>表達 DNA</span>
            <h3>語氣、術語與格式</h3>
            <p>術語偏好、句式、數字格式與不採用的表達都可由用戶修改。</p>
          </article>
          <article class="profile-card">
            <span>誠實邊界</span>
            <h3>不替作者讀心</h3>
            <p>AI 只能說「文本呈現的溝通功能」，不能斷言作者的真實意圖。</p>
          </article>
        </div>
      </section>

      <section v-else-if="currentPage === 'writing'" class="writing-page">
        <div class="section-toolbar">
          <div>
            <h2>女媧 Skill 寫作工坊</h2>
            <p>正確流程：先建立大綱，人工確認後，再逐段協作生成。</p>
          </div>
          <button class="primary-button" @click="createNewDocument">＋ 新建寫作文件</button>
        </div>

        <article class="writing-card">
          <p class="analysis-tag">第一階段：思路大綱</p>
          <h3>你要寫什麼？</h3>
          <textarea
            v-model="taskInput"
            class="task-textarea"
            placeholder="例如：根據既有審計報告的思路，為 XX 公司撰寫年度風險分析報告大綱。說明受眾、目的、已有材料與限制。"
          />
          <button class="primary-button" @click="addTask">保存寫作任務</button>

          <div v-if="savedTasks.length" class="task-history">
            <h4>本地保存的任務</h4>
            <button v-for="task in savedTasks.slice(0, 5)" :key="task" @click="taskInput = task">
              {{ task }}
            </button>
          </div>
        </article>

        <article class="notice-card">
          <b>寫作安全規則</b>
          <span>未確認思路画像前，不生成正式全文；未確認大綱前，不進入逐段生成。專業結論仍需由持證專業人士複核。</span>
        </article>
      </section>
    </main>

    <aside class="assistant-panel">
      <header class="assistant-head">
        <div>
          <strong>✦ 湛箴 AI 助手</strong>
          <span>● 在線</span>
        </div>
        <button @click="toggleTheme" title="切換主題">◐</button>
      </header>

      <div class="assistant-body">
        <div
          v-for="message in chatMessages"
          :key="message.id"
          class="message"
          :class="message.role"
        >
          {{ message.content }}
        </div>

        <section class="assistant-tool">
          <b>OCR：敬請期待</b>
          <span>目前可分析文字型 PDF 的設計已規劃；掃描件、拍照件、印章覆蓋件與手寫件的 OCR 將優先考慮本地處理。</span>
        </section>

        <section class="assistant-tool">
          <b>PDF 整理工具（第三方）</b>
          <span>
            需要合併、拆分、壓縮或轉換 PDF？
            <a href="https://tools.pdf24.org/zh/" target="_blank" rel="noreferrer">開啟 PDF24 Tools ↗</a>
          </span>
          <small>敏感客戶資料請先脫敏；湛箴不會自動把文件傳送至該網站。</small>
        </section>

        <section class="assistant-status">
          <p>目前狀態</p>
          <span>✓ 本地任務保存</span>
          <span>✓ MD / TXT 文字匯入</span>
          <span>◌ DOCX / XLSX / PDF 接入中</span>
          <span>◌ OCR 敬請期待</span>
        </section>
      </div>

      <div class="assistant-input">
        <input
          v-model="chatInput"
          placeholder="輸入問題或下一步任務…"
          @keydown.enter="sendMessage"
        />
        <button @click="sendMessage">➤</button>
      </div>
    </aside>

    <input
      ref="fileInput"
      type="file"
      accept=".md,.txt,text/plain,text/markdown"
      hidden
      @change="importTextFile"
    />

    <transition name="toast">
      <div v-if="toast" class="toast">{{ toast }}</div>
    </transition>
  </div>
</template>