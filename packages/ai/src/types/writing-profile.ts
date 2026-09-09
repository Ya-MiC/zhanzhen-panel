/**
 * 文脈 / 湛箴面板
 * 作者思路画像（Writing DNA）
 *
 * 這不是單純的「文風」。
 * 它描述作者如何搭結構、如何推理、如何使用證據、
 * 如何披露風險，以及如何用語言輸出結論。
 */

export type SupportedLanguage =
  | "zh-CN"
  | "zh-TW"
  | "en"
  | "ja"
  | "ko"
  | "es"
  | "fr"
  | "de"
  | "pt"
  | "ar";

export type EvidenceType =
  | "法律法規"
  | "會計準則"
  | "審計準則"
  | "原始憑證"
  | "財務數據"
  | "訪談記錄"
  | "第三方資料"
  | "管理層聲明"
  | "其他";

export type ConfidenceLevel = "高" | "中" | "低";

export interface SourceDocument {
  id: string;
  title: string;
  fileName: string;
  language: SupportedLanguage;
  importedAt: string;
  wordCount: number;
  contentHash?: string;
  isDesensitized: boolean;
}

export interface DocumentStructure {
  openingPattern: string;
  conclusionPlacement: string;
  commonChapterOrder: string[];
  paragraphPattern: string;
  transitionHabits: string[];
  endingPattern: string;
}

export interface ReasoningPattern {
  typicalReasoningChain: string[];
  evidencePreference: EvidenceType[];
  evidenceUsageMethod: string;
  riskDisclosurePattern: string;
  uncertaintyHandling: string;
  recommendationStyle: string;
}

export interface LanguageFingerprint {
  tone: string[];
  sentenceStyle: string;
  averageSentenceLength?: number;
  commonConnectors: string[];
  preferredTerms: string[];
  avoidedTerms: string[];
  numberFormat: string;
  dateFormat: string;
  formattingHabits: string[];
}

export interface ExtractedInsight {
  category: "結構" | "推理" | "語言" | "術語" | "格式";
  finding: string;
  evidence: string;
  sourceDocumentId: string;
  confidence: ConfidenceLevel;
}

export interface WritingProfile {
  id: string;
  name: string;
  description: string;
  ownerType: "個人" | "團隊" | "事務所" | "企業";
  languages: SupportedLanguage[];
  createdAt: string;
  updatedAt: string;

  sourceDocuments: SourceDocument[];
  structure: DocumentStructure;
  reasoning: ReasoningPattern;
  language: LanguageFingerprint;

  terminology: Record<string, string>;
  extractedInsights: ExtractedInsight[];

  profileCompleteness: number;
  userConfirmed: boolean;
  userNotes: string[];
}

export interface WritingTask {
  id: string;
  profileId: string;
  title: string;
  targetLanguage: SupportedLanguage;
  documentType: string;
  audience: string;
  objective: string;
  sourceMaterials: string[];
  constraints: string[];
  createdAt: string;
}

export interface OutlineSection {
  id: string;
  title: string;
  purpose: string;
  keyArguments: string[];
  requiredEvidence: string[];
  writingNotes: string[];
  approved: boolean;
}

export interface GeneratedOutline {
  taskId: string;
  profileId: string;
  title: string;
  reasoningSummary: string;
  sections: OutlineSection[];
  generatedAt: string;
  userApprovedAt?: string;
}