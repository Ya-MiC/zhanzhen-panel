import type {
  ConfidenceLevel,
  ExtractedInsight,
  SupportedLanguage,
  WritingProfile,
} from "./writing-profile";

/**
 * 一個來源文件的本地描述。
 *
 * 注意：
 * localPath、內容、向量索引、原始客戶資料均不得提交到 GitHub。
 * 這些資料只存在於使用者本機的工作區或未來的受保護儲存區。
 */
export interface LocalDocument {
  id: string;
  name: string;
  extension: DocumentExtension;
  mimeType: string;
  localPath?: string;
  importedAt: string;
  updatedAt: string;
  sizeBytes: number;
  language?: SupportedLanguage;
  isDesensitized: boolean;
  cloudAiConsent: boolean;
  extractionStatus: ExtractionStatus;
  pageCount?: number;
  sheetCount?: number;
  wordCount?: number;
  textSelectable?: boolean;
  ocrStatus?: OcrStatus;
}

/**
 * 第一版承認的文件入口。
 * DOC、XLS、PPT 等舊格式保留為未來相容目標，
 * MVP 優先處理 DOCX、XLSX、PDF、MD、TXT。
 */
export type DocumentExtension =
  | "md"
  | "txt"
  | "docx"
  | "xlsx"
  | "pdf"
  | "doc"
  | "xls"
  | "csv";

export type ExtractionStatus =
  | "PENDING"
  | "EXTRACTING"
  | "EXTRACTED"
  | "PARTIAL"
  | "FAILED"
  | "OCR_PENDING";

export type OcrStatus =
  | "NOT_REQUIRED"
  | "PENDING"
  | "COMING_SOON"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED";

/**
 * 文件或寫作任務的完整狀態機。
 *
 * 所有介面按鈕、AI 操作、保存記錄和驗收測試，
 * 都應以這個狀態機為基礎。
 */
export type AgentTaskStatus =
  | "DRAFT"
  | "IMPORTED"
  | "PARSING"
  | "PARSED"
  | "ANALYZING"
  | "ANALYZED"
  | "AWAITING_PROFILE_REVIEW"
  | "PROFILE_CONFIRMED"
  | "OUTLINE_GENERATING"
  | "OUTLINE_READY"
  | "OUTLINE_CONFIRMED"
  | "WRITING"
  | "QUALITY_REVIEW"
  | "EXPORTED"
  | "CANCELLED"
  | "FAILED";

/**
 * 來源定位：任何高價值結論、流程圖節點與思路規律，
 * 都要能回到原始文件的位置。
 */
export interface SourceReference {
  documentId: string;
  documentName: string;
  quote: string;
  confidence: ConfidenceLevel;

  headingPath?: string[];
  paragraphIndex?: number;

  page?: number;
  pageEnd?: number;

  sheetName?: string;
  cellRange?: string;

  lineStart?: number;
  lineEnd?: number;
}

/**
 * 流程圖節點。
 *
 * 結構圖、論證圖和作者思路圖都共用此資料結構，
 * 只由 graphType 和 nodeType 區分語義。
 */
export interface AnalysisGraphNode {
  id: string;
  label: string;
  description: string;
  nodeType: GraphNodeType;
  confidence: ConfidenceLevel;
  sourceReferences: SourceReference[];
  userStatus: NodeReviewStatus;
  position?: {
    x: number;
    y: number;
  };
  metadata?: Record<string, string | number | boolean>;
}

export type GraphNodeType =
  | "TITLE"
  | "BACKGROUND"
  | "QUESTION"
  | "DEFINITION"
  | "CLAIM"
  | "SUB_CLAIM"
  | "FACT"
  | "EVIDENCE"
  | "DATA"
  | "STANDARD"
  | "CASE"
  | "ASSUMPTION"
  | "REASONING"
  | "COUNTERARGUMENT"
  | "LIMITATION"
  | "RISK"
  | "CONCLUSION"
  | "RECOMMENDATION"
  | "APPENDIX"
  | "TASK_INPUT"
  | "DECISION_CRITERIA"
  | "WRITING_STRATEGY"
  | "UNCERTAINTY_HANDLING"
  | "LANGUAGE_STYLE";

export interface AnalysisGraphEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  relation: GraphRelationType;
  label?: string;
  confidence: ConfidenceLevel;
  sourceReferences: SourceReference[];
  userStatus: NodeReviewStatus;
}

export type GraphRelationType =
  | "CONTAINS"
  | "INTRODUCES"
  | "SUPPORTS"
  | "REFUTES"
  | "LEADS_TO"
  | "EXPLAINS"
  | "EXEMPLIFIES"
  | "LIMITS"
  | "DERIVES"
  | "COMPARES"
  | "SUPPLEMENTS"
  | "PRECEDES"
  | "USES";

export type NodeReviewStatus =
  | "AI_PROPOSED"
  | "USER_CONFIRMED"
  | "USER_EDITED"
  | "USER_REJECTED"
  | "NEEDS_EVIDENCE";

/**
 * 三類核心圖：
 * STRUCTURE：文章架構圖
 * ARGUMENT：論證與證據流程圖
 * THINKING：作者思路圖
 */
export type AnalysisGraphType = "STRUCTURE" | "ARGUMENT" | "THINKING";

export interface AnalysisGraph {
  id: string;
  taskId: string;
  graphType: AnalysisGraphType;
  title: string;
  description: string;
  nodes: AnalysisGraphNode[];
  edges: AnalysisGraphEdge[];
  mermaidSource?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 讀書 Skill 的閱讀產物。
 */
export interface ReadingAnalysis {
  taskId: string;
  documentId: string;

  overview: {
    title?: string;
    purpose: string;
    targetAudience: string;
    coreQuestions: string[];
    summary: string;
  };

  keyPoints: Array<{
    id: string;
    content: string;
    importance: "高" | "中" | "低";
    sourceReferences: SourceReference[];
    userStatus: NodeReviewStatus;
  }>;

  terminology: Array<{
    term: string;
    definition: string;
    sourceReferences: SourceReference[];
  }>;

  extractedInsights: ExtractedInsight[];
  graphs: AnalysisGraph[];

  plainLanguageExplanation: string;
  limitations: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * 任務事件用於建立可追溯歷史。
 * 未來可顯示在右側 AI 面板的「任務紀錄」中。
 */
export interface TaskEvent {
  id: string;
  taskId: string;
  type: TaskEventType;
  message: string;
  createdAt: string;
  actor: "USER" | "AI" | "SYSTEM";
  metadata?: Record<string, string | number | boolean>;
}

export type TaskEventType =
  | "TASK_CREATED"
  | "DOCUMENT_IMPORTED"
  | "PARSING_STARTED"
  | "PARSING_FINISHED"
  | "OCR_PENDING"
  | "ANALYSIS_STARTED"
  | "ANALYSIS_FINISHED"
  | "GRAPH_CREATED"
  | "PROFILE_CREATED"
  | "PROFILE_UPDATED"
  | "PROFILE_CONFIRMED"
  | "OUTLINE_CREATED"
  | "OUTLINE_CONFIRMED"
  | "SECTION_GENERATED"
  | "QUALITY_CHECK_FINISHED"
  | "DOCUMENT_EXPORTED"
  | "TASK_FAILED"
  | "TASK_CANCELLED";

/**
 * 一個完整的智能體工作任務。
 *
 * 注意：
 * task 只保存本機 ID 與結構化結果；
 * 原始文件內容和敏感素材不能放到 Git。
 */
export interface AnalysisTask {
  id: string;
  projectId?: string;
  name: string;
  status: AgentTaskStatus;
  createdAt: string;
  updatedAt: string;

  documents: LocalDocument[];
  readingAnalyses: ReadingAnalysis[];
  writingProfile?: WritingProfile;

  activeDocumentId?: string;
  profileReviewCompletedAt?: string;
  outlineReviewCompletedAt?: string;
  exportedAt?: string;

  events: TaskEvent[];
  errorMessage?: string;
}