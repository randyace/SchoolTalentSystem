// ─────────────────────────────────────────────────────────────────────────────
// Screen_AIWritingWorkspace.tsx
// AI 智能文案工作站 — AI Copywriting Workspace + AI Data Assistant
// ERP Module 1.F.3 / 6
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useRef, useEffect, useCallback } from "react";
import { ERP } from "./erpTokens";
import {
  Save, Sparkles, ChevronDown, X, FileText, Copy,
  Bold, Italic, AlignLeft, Download, Zap, Users,
  RefreshCw, Check, ChevronRight, Info, Wand2, PenLine,
  GripVertical, History, Brain, Upload, Feather, RotateCcw,
  MessageSquare, Send, Table2, FileJson, FileSpreadsheet,
  Bot, User, Archive, Calendar, Hash, ChevronUp, Loader2, Search, Trash2, PlusCircle,
  Lightbulb,
} from "lucide-react";
import {
  type OutputType,
  type GenRecord,
  type DocVersion,
  type StudentHit,
  type StudentContext,
  type UploadedContext,
  type WorkspaceStats,
  OUTPUT_TO_API,
  API_TO_OUTPUT,
  DOC_TYPE_LABEL,
  type AiMetadataOption,
  type AiMetadataCategory,
  type TargetGroupCode,
  GROUP_TARGET_LABELS,
  jsonHeaders,
  fetchDocuments,
  fetchDocumentDetail,
  deleteDocument,
  fetchStudentContext,
  searchStudents,
  fetchAiMetadata,
  createAiMetadata,
  deleteAiMetadata,
  codeToOutputType,
  readWorkspaceRoute,
  pushWorkspaceRoute,
  badgeStyle,
  formatBytes,
  isAllowedContextFile,
  isContextImageFile,
} from "./aiWorkspaceApi";
import {
  EditableDocumentPaper,
  countDocChars,
  buildExportHtml,
} from "./EditableDocumentPaper";

// ── Design tokens ─────────────────────────────────────────────────────────────
const D = {
  bg:         "#F8FAFC",
  surface:    "#FFFFFF",
  surfaceAlt: "#FAFAFA",
  border:     "#E2E8F0",
  borderFocus:"#A5B4FC",
  text1:      "#0F172A",
  text2:      "#1E293B",
  text3:      "#475569",
  text4:      "#94A3B8",
  ai:         "#6366F1",
  aiDark:     "#4F46E5",
  aiLight:    "#EEF2FF",
  aiBorder:   "#C7D2FE",
  aiMid:      "#E0E7FF",
  emerald:    "#059669",
  emeraldPale:"#ECFDF5",
  emeraldBd:  "#6EE7B7",
  amber:      "#D97706",
  amberPale:  "#FFFBEB",
  amberBd:    "#FDE68A",
  blue:       "#2563EB",
  bluePale:   "#EFF6FF",
  shadow:     "0 1px 3px rgba(15,23,42,0.07), 0 1px 2px rgba(15,23,42,0.05)",
  shadowMd:   "0 4px 14px rgba(15,23,42,0.09)",
  shadowLg:   "0 8px 30px rgba(15,23,42,0.12)",
  radius:     "10px",
  radiusLg:   "14px",
  font:       ERP.font.family,
};

// ── Interfaces ─────────────────────────────────────────────────────────────────
type ParaType = "header-section" | "salutation" | "body" | "closing" | "signature";
interface LetterParagraph {
  id: string; type: ParaType; content?: string;
  aiTag?: string | null; highlight?: boolean;
  highlightStart?: number; highlightEnd?: number;
}

interface ChatMessage {
  id: string;
  role: "user" | "ai";
  content: string;
  tableData?: TableRow[];
  timestamp: string;
}

interface TableRow { [key: string]: string | number }

export type ScreenAIWritingWorkspaceProps = {
  onBack?: () => void;
  documentsUrl?: string;
  generateUrl?: string;
  rewritePartialUrl?: string;
  saveVersionUrl?: string;
  uploadContextUrl?: string;
  studentContextUrl?: string;
  searchStudentsUrl?: string;
  metadataUrl?: string;
  csrfName?: string;
  csrfHash?: string;
};

const FALLBACK_TONES: AiMetadataOption[] = [
  { id: -1, category: "tone", label_zh: "專業嚴謹 (Formal)", is_default: true },
  { id: -2, category: "tone", label_zh: "溫暖鼓勵 (Encouraging)", is_default: true },
  { id: -3, category: "tone", label_zh: "簡潔精煉 (Concise)", is_default: true },
  { id: -4, category: "tone", label_zh: "公開表揚 (Public Praise)", is_default: true },
];

const FALLBACK_SCENARIOS: AiMetadataOption[] = [
  "校長頒獎禮", "科學夏令營", "姊妹學校交流", "大學入學申請", "來賓訪問",
  "全港性比賽", "音樂／演藝表演", "學術比賽", "校外考察",
].map((label_zh, i) => ({ id: -(i + 1), category: "scenario", label_zh, is_default: true }));

const FALLBACK_OUTPUT_TYPES: AiMetadataOption[] = [
  { id: -1, category: "output_type", label_zh: "推薦信", icon: "✉️", code: "recommendation", is_default: true },
  { id: -2, category: "output_type", label_zh: "成績表評語", icon: "📝", code: "report_comment", is_default: true },
  { id: -3, category: "output_type", label_zh: "校園宣傳稿", icon: "📣", code: "campus_pr", is_default: true },
];

/** Hybrid target: individual student OR preset audience group (no ACORN). */
type TargetAudience =
  | { type: "group"; id: string; label: string }
  | { type: "student"; id: number; label: string; data: StudentHit };

const QUICK_TARGET_GROUPS: Array<{ id: string; label: string; emoji: string; accent: "primary" | "secondary" }> = [
  { id: "ALL_STUDENTS", label: "全校學生", emoji: "👥", accent: "primary" },
  { id: "ALL_PARENTS", label: "全體家長", emoji: "👨‍👩‍👧", accent: "primary" },
  { id: "ALL_STAFF", label: "全體教職員", emoji: "🏫", accent: "secondary" },
];

// ── Static data ───────────────────────────────────────────────────────────────
const LETTER: LetterParagraph[] = [
  { id: "p_salutation", type: "salutation", content: "致 敬啟者：" },
  { id: "p_intro",   type: "body", aiTag: "引言",    content: "　　本人謹代表香港神託會培敦中學（Stewards Pooi Tun Secondary School），極力推薦陳大文同學（學號：2025-F1A-001）報名參加貴機構舉辦之「2026 全港中學生科學夏令營」。陳同學現就讀中一甲班，品學兼優，自入讀本校以來於各方面均有顯著成長。" },
  { id: "p_acorn",  type: "body", aiTag: "ACORN 數據", content: "　　根據本校 ACORN 全人學習特徵評估系統，陳同學在「協作」維度取得 91 分，位列全年級前 5%，充分展現其卓越才能。在「學術」維度錄得 82 分，反映扎實的知識根基與自主學習態度。" },
  { id: "p_achv",   type: "body", aiTag: "成就記錄", highlight: true, highlightStart: 5, highlightEnd: 37, content: "　　本學期，陳同學出任中一級科學環保專題的組長（角色級別 T3），帶領六名同學完成為期八週的項目研究，並代表本校參加「2026 全港中學生科學實驗大賽」，榮獲金獎（L4 國際／全港級）。" },
  { id: "p_char",   type: "body", aiTag: "品格評估", content: "　　陳同學不僅學術優異，更在個人品格方面樹立良好榜樣。其思維縝密，溝通能力強，能於壓力下保持冷靜。本人誠摯推薦陳大文同學參加貴機構之夏令營。" },
  { id: "p_close",  type: "closing", content: "謹此" },
];

function contentToParagraphs(text: string): LetterParagraph[] {
  const trimmed = text.replace(/\r\n/g, "\n").trim();
  if (!trimmed) return [];
  const parts = trimmed.split(/\n+/).map((p) => p.trim()).filter(Boolean);
  return parts.map((content, i) => {
    let type: ParaType = "body";
    if (i === 0 && /敬啟|致\s/.test(content)) type = "salutation";
    else if (/^謹此|^此致/.test(content)) type = "closing";
    return { id: `p_${i}`, type, content };
  });
}

const OUTPUT_TYPE_EN: Record<string, string> = {
  recommendation: "Recommendation Letter",
  report_comment: "Report Comment",
  campus_pr: "Promo Post",
};

const GEN_HISTORY: GenRecord[] = [
  { id: "h1", documentId: 1, type: "推薦信",     student: "陳大文", studentId: 1, targetGroup: null, scenario: "科學夏令營",  words: 342, ts: "08-18 09:15", version: "V3", status: "draft", docType: "recommendation" },
  { id: "h2", documentId: 2, type: "校園宣傳稿", student: "全校學生", studentId: null, targetGroup: "ALL_STUDENTS", scenario: "校長頒獎禮",  words: 218, ts: "08-17 14:30", version: "V1", status: "draft", docType: "campus_pr" },
  { id: "h3", documentId: 3, type: "成績表評語", student: "李美玲", studentId: 2, targetGroup: null, scenario: "—",           words:  98, ts: "08-16 11:45", version: "V2", status: "draft", docType: "report_comment" },
  { id: "h4", documentId: 4, type: "推薦信",     student: "張偉明", studentId: 3, targetGroup: null, scenario: "姊妹學校交流",words: 295, ts: "08-15 16:20", version: "V1", status: "draft", docType: "recommendation" },
  { id: "h5", documentId: 5, type: "校園宣傳稿", student: "全體家長", studentId: null, targetGroup: "ALL_PARENTS", scenario: "來賓訪問",    words: 156, ts: "08-14 10:00", version: "V2", status: "draft", docType: "campus_pr" },
];

const CHAT_INITIAL: ChatMessage[] = [
  {
    id: "sys1", role: "ai", timestamp: "",
    content: "你好！我是 AI 數據助手。你可以用自然語言查詢學生數據，例如：\n\n• 列出所有數學成績 > 75 且有進步的學生\n• 顯示今學期 T3 以上角色的學生名單\n• 統計各班參與活動次數並排序",
  },
];

const MOCK_TABLE: TableRow[] = [
  { "#": 1, 姓名: "陳大文", 班別: "3A", 數學: 88, 進步幅度: "+12", 活動次數: 5, 角色: "T3" },
  { "#": 2, 姓名: "李美玲", 班別: "3B", 數學: 82, 進步幅度: "+8",  活動次數: 3, 角色: "T2" },
  { "#": 3, 姓名: "張偉明", 班別: "3A", 數學: 79, 進步幅度: "+5",  活動次數: 4, 角色: "T3" },
  { "#": 4, 姓名: "黃志強", 班別: "3C", 數學: 77, 進步幅度: "+9",  活動次數: 2, 角色: "T1" },
  { "#": 5, 姓名: "吳嘉欣", 班別: "3B", 數學: 76, 進步幅度: "+3",  活動次數: 6, 角色: "T2" },
];

// ── Sub-components ─────────────────────────────────────────────────────────────
const SectionLabel: React.FC<{ icon: React.ReactNode; zh: string; en: string }> = ({ icon, zh, en }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
    {icon}
    <span style={{ fontSize: 11.5, fontWeight: 700, color: "#334155" }}>{zh}</span>
    <span style={{ fontSize: 10, color: "#94A3B8", marginLeft: 2 }}>{en}</span>
  </div>
);

const AITagPill: React.FC<{ label: string }> = ({ label }) => (
  <div style={{
    display: "inline-flex", alignItems: "center", gap: 3,
    padding: "1px 7px", marginRight: 6,
    background: D.aiLight, border: `1px solid ${D.aiBorder}`,
    borderRadius: 999, verticalAlign: "middle",
  }}>
    <Sparkles size={8} color={D.ai} />
    <span style={{ fontSize: 9, fontWeight: 700, color: D.ai }}>{label}</span>
  </div>
);

const ConfBar: React.FC<{ pct: number; color: string }> = ({ pct, color }) => (
  <div style={{ flex: 1, height: 4, background: "#E2E8F0", borderRadius: 2, overflow: "hidden" }}>
    <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 2, transition: "width 0.6s ease" }} />
  </div>
);

const HighlightedParagraph: React.FC<{
  para: LetterParagraph; showToolbar: boolean;
  onToolbarAction: (a: string) => void;
}> = ({ para, showToolbar, onToolbarAction }) => {
  if (!para.highlight || !para.content) {
    return <p style={{ margin: "0 0 16px", lineHeight: 2.05, color: D.text1, fontSize: 14 }}>{para.content}</p>;
  }
  const pre  = para.content.slice(0, para.highlightStart ?? 0);
  const mid  = para.content.slice(para.highlightStart ?? 0, para.highlightEnd ?? 0);
  const post = para.content.slice(para.highlightEnd ?? 0);
  return (
    <div style={{ position: "relative", marginBottom: 16 }}>
      {showToolbar && (
        <div style={{
          position: "absolute", top: -52, left: "50%", transform: "translateX(-50%)",
          zIndex: 30, background: "#1E293B", borderRadius: 10, padding: "6px 8px",
          display: "flex", alignItems: "center", gap: 2,
          boxShadow: "0 8px 28px rgba(15,23,42,0.28), 0 2px 8px rgba(15,23,42,0.18)",
          border: "1px solid rgba(255,255,255,0.08)", whiteSpace: "nowrap",
        }}>
          <div style={{ position: "absolute", bottom: -6, left: "50%", transform: "translateX(-50%)", width: 12, height: 6, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: "6px solid #1E293B" }} />
          {[
            { label: "✨ 潤飾語氣", action: "polish",     color: "#C4B5FD" },
            { label: "➕ 加入細節", action: "elaborate",  color: "#6EE7B7" },
            { label: "➖ 縮短",     action: "shorten",    color: "#FCA5A5" },
          ].map((btn, i) => (
            <React.Fragment key={btn.action}>
              {i > 0 && <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.12)", margin: "0 2px" }} />}
              <button onClick={() => onToolbarAction(btn.action)} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 10px", borderRadius: 7, color: btn.color, fontSize: 11.5, fontWeight: 600, fontFamily: D.font, transition: "background 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.09)")}
                onMouseLeave={e => (e.currentTarget.style.background = "none")}
              >{btn.label}</button>
            </React.Fragment>
          ))}
          <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.12)", margin: "0 4px" }} />
          <button onClick={() => onToolbarAction("regenerate")} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: "4px 8px", borderRadius: 7, color: "#94A3B8", fontSize: 11, fontFamily: D.font, transition: "background 0.15s" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.09)")}
            onMouseLeave={e => (e.currentTarget.style.background = "none")}
          >
            <RefreshCw size={11} color="#94A3B8" /> 重新生成
          </button>
        </div>
      )}
      <p style={{ margin: 0, lineHeight: 2.05, color: D.text1, fontSize: 14 }}>
        {pre}
        <span style={{ background: "rgba(99,102,241,0.13)", borderBottom: "2px solid rgba(99,102,241,0.55)", borderRadius: "2px", padding: "1px 0", color: D.text1 }}>{mid}</span>
        {post}
      </p>
    </div>
  );
};

// ── AI Data Table (inside chat) ───────────────────────────────────────────────
const AiDataTable: React.FC<{ rows: TableRow[]; onExportExcel: () => void; onExportJson: () => void }> = ({ rows, onExportExcel, onExportJson }) => {
  if (!rows.length) return null;
  const cols = Object.keys(rows[0]);
  return (
    <div style={{ marginTop: 10, border: `1px solid rgba(99,102,241,0.25)`, borderRadius: 10, overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: D.font, fontSize: 12 }}>
          <thead>
            <tr style={{ background: "rgba(99,102,241,0.10)" }}>
              {cols.map(col => (
                <th key={col} style={{ padding: "7px 12px", textAlign: "left", fontSize: 10.5, fontWeight: 700, color: D.ai, borderBottom: `1px solid rgba(99,102,241,0.18)`, whiteSpace: "nowrap" }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} style={{ background: ri % 2 === 0 ? "transparent" : "rgba(99,102,241,0.03)", transition: "background 0.1s" }}>
                {cols.map(col => (
                  <td key={col} style={{ padding: "6px 12px", color: D.text2, borderBottom: ri < rows.length - 1 ? `1px solid rgba(99,102,241,0.08)` : "none", whiteSpace: "nowrap" }}>{String(row[col])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: "flex", gap: 8, padding: "10px 12px", background: "rgba(99,102,241,0.04)", borderTop: `1px solid rgba(99,102,241,0.12)` }}>
        <span style={{ fontSize: 10.5, color: D.text4, flex: 1, display: "flex", alignItems: "center", gap: 4 }}>
          <Table2 size={11} color={D.text4} /> {rows.length} 筆記錄
        </span>
        <button onClick={onExportExcel} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", background: "#DCFCE7", border: "1px solid #86EFAC", borderRadius: 7, cursor: "pointer", fontSize: 11, fontWeight: 700, color: "#15803D", fontFamily: D.font }}>
          <FileSpreadsheet size={12} /> 匯出 Excel
        </button>
        <button onClick={onExportJson} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", background: "#EFF6FF", border: "1px solid #93C5FD", borderRadius: 7, cursor: "pointer", fontSize: 11, fontWeight: 700, color: "#1D4ED8", fontFamily: D.font }}>
          <FileJson size={12} /> Export JSON
        </button>
      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
export const Screen_AIWritingWorkspace: React.FC<ScreenAIWritingWorkspaceProps> = ({
  onBack: _onBack,
  documentsUrl = "/api/ai-workspace/documents",
  generateUrl = "/api/ai-workspace/generate",
  rewritePartialUrl = "/api/ai-workspace/rewrite-partial",
  saveVersionUrl = "/api/ai-workspace/save-version",
  uploadContextUrl = "/api/ai-workspace/upload-context",
  studentContextUrl = "/api/ai-workspace/student-context",
  searchStudentsUrl = "/api/students/search",
  metadataUrl = "/api/ai-metadata",
  csrfName,
  csrfHash,
}) => {
  const F = D.font;
  const initialRoute = typeof window !== "undefined" ? readWorkspaceRoute() : { view: "list" as const, docId: null, isNew: false };

  // Workspace state
  const [mainTab,         setMainTab]         = useState<"workspace" | "databot">("workspace");
  const [outputType,      setOutputType]      = useState<OutputType>("letter");
  const [selectedOutputId, setSelectedOutputId] = useState<number | null>(null);
  const [isGenerating,    setIsGenerating]    = useState(false);
  const [generationDone,  setGenerationDone]  = useState(false);
  const [showToolbar,     setShowToolbar]     = useState(true);
  const [activeVersion,   setActiveVersion]   = useState(0);
  const [versions,        setVersions]        = useState<DocVersion[]>([]);
  const [editorContent,   setEditorContent]   = useState("");
  const [documentId,      setDocumentId]      = useState<number | null>(initialRoute.docId);
  const [tones,           setTones]           = useState<AiMetadataOption[]>(FALLBACK_TONES);
  const [scenarios,       setScenarios]       = useState<AiMetadataOption[]>(FALLBACK_SCENARIOS);
  const [outputTypes,     setOutputTypes]     = useState<AiMetadataOption[]>(FALLBACK_OUTPUT_TYPES);
  const [, setAudiences] = useState<AiMetadataOption[]>([]);
  const [tone,            setTone]            = useState(FALLBACK_TONES[0].label_zh);
  const [toneOpen,        setToneOpen]        = useState(false);
  const [scenario,        setScenario]        = useState(FALLBACK_SCENARIOS[0].label_zh);
  const [scenarioOpen,    setScenarioOpen]    = useState(false);
  const [additionalPrompt, setAdditionalPrompt] = useState("");
  const [isAddingTone,    setIsAddingTone]    = useState(false);
  const [isAddingScenario, setIsAddingScenario] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [newToneInput,    setNewToneInput]    = useState("");
  const [newScenarioInput, setNewScenarioInput] = useState("");
  const [newOutputTypeInput, setNewOutputTypeInput] = useState("");
  const [savingMeta,      setSavingMeta]      = useState(false);
  const outputModalListRef = useRef<HTMLUListElement>(null);
  const [wordTarget,      setWordTarget]      = useState(350);
  const [isSaved,         setIsSaved]         = useState(false);
  const [isSaving,        setIsSaving]        = useState(false);
  const [saveMenuOpen,    setSaveMenuOpen]    = useState(false);
  const [savedSnapshot,   setSavedSnapshot]   = useState("");
  const [contentEpoch,    setContentEpoch]    = useState(0);
  const [toastMsg,        setToastMsg]        = useState<string | null>(null);
  const [isMobile,        setIsMobile]        = useState(false);
  const [mobileTab,       setMobileTab]       = useState<"setup" | "output">("output");
  const [showHistory,     setShowHistory]     = useState(false);
  const [genHistory,      setGenHistory]      = useState<GenRecord[]>(GEN_HISTORY);
  const [stats,           setStats]           = useState<WorkspaceStats>({
    total_docs: GEN_HISTORY.length,
    generated_this_week: 3,
    pending_review: 1,
  });
  const [listLoading,     setListLoading]     = useState(true);
  const [docLoading,      setDocLoading]      = useState(false);
  const [deletingId,      setDeletingId]      = useState<number | null>(null);
  const [view,            setView]            = useState<"list" | "editor">(initialRoute.view);
  const [editingRecord,   setEditingRecord]   = useState<GenRecord | null>(null);

  // Target Audience (student | group) + ERP context
  const [selectedTarget, setSelectedTarget] = useState<TargetAudience | null>(null);
  const [targetSearchQuery, setTargetSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<StudentHit[]>([]);
  const [studentSearching, setStudentSearching] = useState(false);
  const [showTargetResults, setShowTargetResults] = useState(false);
  const [studentContext,  setStudentContext]  = useState<StudentContext | null>(null);
  const selectedStudent = selectedTarget?.type === "student" ? selectedTarget.data : null;
  const [contextLoading,  setContextLoading]  = useState(false);
  const [uploadedCtx,     setUploadedCtx]     = useState<UploadedContext | null>(null);
  const [uploading,       setUploading]       = useState(false);
  const [uploadingOcr,    setUploadingOcr]    = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const studentSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const targetSearchRef = useRef<HTMLDivElement>(null);
  const toneDropdownRef = useRef<HTMLDivElement>(null);
  const scenarioDropdownRef = useRef<HTMLDivElement>(null);
  const splitPaneRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const [sidebarWidth, setSidebarWidth] = useState(320);

  // Chatbot state
  const [messages,        setMessages]        = useState<ChatMessage[]>(CHAT_INITIAL);
  const [chatInput,       setChatInput]       = useState("");
  const [isThinking,      setIsThinking]      = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef   = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  // Close custom dropdowns / typeahead when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (targetSearchRef.current && !targetSearchRef.current.contains(target)) {
        setShowTargetResults(false);
      }
      if (toneDropdownRef.current && !toneDropdownRef.current.contains(target)) {
        setToneOpen(false);
        setIsAddingTone(false);
      }
      if (scenarioDropdownRef.current && !scenarioDropdownRef.current.contains(target)) {
        setScenarioOpen(false);
        setIsAddingScenario(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Draggable sidebar resizer
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const paneLeft = splitPaneRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = Math.max(250, Math.min(e.clientX - paneLeft, 600));
      setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // Lock page scroll while manage-output modal is open
  useEffect(() => {
    if (!showManageModal) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [showManageModal]);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2200);
  }, []);

  const goList = useCallback(() => {
    setView("list");
    setEditingRecord(null);
    pushWorkspaceRoute({ view: "list" });
  }, []);

  const goNewEditor = useCallback(() => {
    setEditingRecord(null);
    setDocumentId(null);
    setVersions([]);
    setActiveVersion(0);
    setEditorContent("");
    setSavedSnapshot("");
    setContentEpoch((n) => n + 1);
    setGenerationDone(false);
    setSelectedTarget(null);
    setStudentContext(null);
    setTargetSearchQuery("");
    setSearchResults([]);
    setShowTargetResults(false);
    setUploadedCtx(null);
    setOutputType("letter");
    setSelectedOutputId(outputTypes.find((o) => o.code === "recommendation")?.id ?? null);
    setTone(tones[0]?.label_zh || FALLBACK_TONES[0].label_zh);
    setScenario(scenarios[0]?.label_zh || FALLBACK_SCENARIOS[0].label_zh);
    setAdditionalPrompt("");
    setIsAddingTone(false);
    setIsAddingScenario(false);
    setShowManageModal(false);
    setWordTarget(350);
    setView("editor");
    pushWorkspaceRoute({ view: "editor", isNew: true });
  }, [tones, scenarios, outputTypes]);

  const applyStudentContext = useCallback((ctx: StudentContext | null) => {
    setStudentContext(ctx);
    if (ctx?.student) {
      const s = ctx.student;
      const hit: StudentHit = {
        id: s.id,
        text: s.display_name || s.name_zh || s.name_en,
        name_zh: s.name_zh,
        name_en: s.name_en,
        class_name: s.class_name,
        student_code: s.student_no,
      };
      setSelectedTarget({
        type: "student",
        id: hit.id,
        label: `${hit.name_zh || hit.name_en || hit.text}${hit.class_name ? ` (${hit.class_name})` : ""}`,
        data: hit,
      });
    }
  }, []);

  const fetchStudentAcornData = useCallback(async (studentId: number) => {
    setContextLoading(true);
    try {
      const ctx = await fetchStudentContext(studentContextUrl, studentId);
      applyStudentContext(ctx);
      showToast("✅ 已自動載入 ACORN 數據與歷史成就");
    } catch {
      showToast("無法載入學生 ERP 數據");
    } finally {
      setContextLoading(false);
    }
  }, [studentContextUrl, applyStudentContext, showToast]);

  const hydrateOutputType = useCallback((docTypeCode: string, types?: AiMetadataOption[]) => {
    const list = types && types.length ? types : outputTypes;
    const code = String(docTypeCode || "").trim();
    if (!code) return;
    const uiType = API_TO_OUTPUT[code] || codeToOutputType(code);
    setOutputType(uiType);
    const match = list.find((o) => o.code === code)
      || list.find((o) => codeToOutputType(o.code) === uiType)
      || list.find((o) => o.label_zh === code);
    if (match) setSelectedOutputId(match.id);
  }, [outputTypes]);

  const applyVersionParams = useCallback((ver: DocVersion) => {
    const params = ver.parameters_json;
    if (!params || typeof params !== "object") return;
    if (typeof params.tone === "string" && params.tone) setTone(params.tone);
    if (typeof params.target_word_count === "number" && params.target_word_count > 0) {
      setWordTarget(params.target_word_count);
    }
    if (typeof params.scenario === "string" && params.scenario) {
      const scen = params.scenario;
      const match = scenarios.find((s) => s.label_zh === scen || s.label_zh.includes(scen) || scen.includes(s.label_zh));
      setScenario(match?.label_zh || scen);
    }
    const extra = params.additional_prompt ?? params.additionalPrompt;
    setAdditionalPrompt(typeof extra === "string" ? extra : "");
    if (typeof params.doc_type === "string" && params.doc_type) {
      hydrateOutputType(params.doc_type);
    }
  }, [scenarios, hydrateOutputType]);

  const loadDocument = useCallback(async (id: number, rec?: GenRecord | null) => {
    setDocLoading(true);
    setView("editor");
    setDocumentId(id);
    pushWorkspaceRoute({ view: "editor", docId: id });
    try {
      const detail = await fetchDocumentDetail(documentsUrl, id);
      const doc = detail.document;
      const docType = String(doc.doc_type || "recommendation");

      // 1. Hydrate Output Type (code + selected card id)
      hydrateOutputType(docType);

      const scen = String(doc.scenario || "");
      if (scen) {
        const match = scenarios.find((s) => s.label_zh === scen || s.label_zh.includes(scen) || scen.includes(s.label_zh.split(" ")[0]));
        setScenario(match?.label_zh || scen);
      }
      // Prefer document-level additional_prompt; version params may override in applyVersionParams
      setAdditionalPrompt(String((doc as { additional_prompt?: string }).additional_prompt || ""));
      const vers = [...detail.versions].sort((a, b) => a.version_num - b.version_num);
      setVersions(vers);
      const cur = detail.current_version
        || vers.find((v) => v.version_num === Number(doc.current_version_num))
        || vers[vers.length - 1]
        || null;
      if (cur) {
        setActiveVersion(cur.version_num);
        const body = cur.content || "";
        setEditorContent(body);
        setSavedSnapshot(body);
        setContentEpoch((n) => n + 1);
        setGenerationDone(!!body.trim());
        applyVersionParams(cur);
        // Re-assert document-level doc_type after version params (version may be stale)
        hydrateOutputType(docType);
      } else {
        setActiveVersion(0);
        setEditorContent("");
        setSavedSnapshot("");
        setContentEpoch((n) => n + 1);
        setGenerationDone(false);
      }

      // 2. Hydrate Target Audience (group vs individual student)
      const groupRaw = String(doc.target_group || "").toUpperCase();
      const targetGroup = (groupRaw in GROUP_TARGET_LABELS
        ? (groupRaw as TargetGroupCode)
        : null);
      const studentIdNum = doc.student_id != null ? Number(doc.student_id) : 0;

      if (targetGroup && GROUP_TARGET_LABELS[targetGroup]) {
        setSelectedTarget({
          type: "group",
          id: targetGroup,
          label: GROUP_TARGET_LABELS[targetGroup].label,
        });
        setStudentContext(null);
      } else if (studentIdNum > 0) {
        const ctxStudent = detail.student_context?.student;
        const nameZh = String(doc.student_name_zh || ctxStudent?.name_zh || "").trim();
        const nameEn = String(doc.student_name_en || ctxStudent?.name_en || "").trim();
        const label = nameZh || nameEn || ctxStudent?.display_name || `Student #${studentIdNum}`;
        const hit: StudentHit = {
          id: studentIdNum,
          text: label,
          name_zh: nameZh || label,
          name_en: nameEn,
          class_name: ctxStudent?.class_name || "",
          student_code: ctxStudent?.student_no || "",
        };
        setSelectedTarget({
          type: "student",
          id: studentIdNum,
          label: hit.class_name ? `${hit.name_zh} (${hit.class_name})` : hit.name_zh,
          data: hit,
        });
        // Trigger ACORN data fetch for individual student
        if (detail.student_context?.student) {
          applyStudentContext(detail.student_context);
        } else {
          void fetchStudentAcornData(studentIdNum);
        }
      } else {
        setSelectedTarget(null);
        setStudentContext(null);
      }

      if (rec) setEditingRecord({ ...rec, targetGroup: rec.targetGroup ?? targetGroup });
      else {
        const studentDisplay = targetGroup
          ? GROUP_TARGET_LABELS[targetGroup].label
          : (String(doc.student_name_zh || "").trim()
            || detail.student_context?.student?.display_name
            || detail.student_context?.student?.name_zh
            || "—");
        setEditingRecord({
          id: String(id),
          documentId: id,
          type: String(doc.doc_type_label || DOC_TYPE_LABEL[docType as keyof typeof DOC_TYPE_LABEL] || docType),
          student: studentDisplay,
          studentId: studentIdNum > 0 ? studentIdNum : null,
          targetGroup,
          studentNameZh: String(doc.student_name_zh || detail.student_context?.student?.name_zh || "").trim() || undefined,
          scenario: String(doc.scenario || "—"),
          words: cur?.word_count || 0,
          ts: "",
          version: cur?.version_label || `V${doc.current_version_num || 1}`,
          status: String(doc.status || "draft"),
          docType: (docType as GenRecord["docType"]) || "recommendation",
        });
      }
    } catch (e) {
      showToast("無法載入文件：" + (e instanceof Error ? e.message : "錯誤"));
      goList();
    } finally {
      setDocLoading(false);
    }
  }, [documentsUrl, applyStudentContext, applyVersionParams, hydrateOutputType, fetchStudentAcornData, showToast, goList, scenarios]);

  const openRecord = useCallback((rec: GenRecord) => {
    setEditingRecord(rec);
    void loadDocument(rec.documentId, rec);
  }, [loadDocument]);

  // Dynamic Scenario / Tone / Output Type / Audience from DB
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const grouped = await fetchAiMetadata(metadataUrl);
        if (cancelled) return;
        if (grouped.tone.length) {
          setTones(grouped.tone);
          setTone((cur) => (grouped.tone.some((t) => t.label_zh === cur) ? cur : grouped.tone[0].label_zh));
        }
        if (grouped.scenario.length) {
          setScenarios(grouped.scenario);
          setScenario((cur) => (grouped.scenario.some((s) => s.label_zh === cur) ? cur : grouped.scenario[0].label_zh));
        }
        if (grouped.audience.length) setAudiences(grouped.audience);
        if (grouped.output_type.length) {
          // Load catalog only — do NOT overwrite a hydrated document's outputType
          setOutputTypes(grouped.output_type);
          setSelectedOutputId((cur) => {
            if (cur && grouped.output_type.some((o) => o.id === cur)) return cur;
            return cur; // leave null; sync effect below matches by outputType
          });
        }
      } catch {
        /* keep fallbacks */
      }
    })();
    return () => { cancelled = true; };
  }, [metadataUrl]);

  // Keep selectedOutputId in sync with outputType once catalog is available (hydration-safe)
  useEffect(() => {
    if (!outputTypes.length) return;
    setSelectedOutputId((cur) => {
      if (cur != null && outputTypes.some((o) => o.id === cur)) return cur;
      const match = outputTypes.find((o) => o.code === OUTPUT_TO_API[outputType])
        || outputTypes.find((o) => codeToOutputType(o.code) === outputType);
      return match ? match.id : cur;
    });
  }, [outputType, outputTypes]);

  const handleAddNewMetadata = useCallback(async (
    category: AiMetadataCategory,
    label: string,
    icon?: string,
  ) => {
    const trimmed = label.trim();
    if (!trimmed) {
      showToast("請輸入名稱");
      return;
    }
    if (savingMeta) return;
    setSavingMeta(true);
    try {
      const option = await createAiMetadata(metadataUrl, category, trimmed, csrfName, csrfHash, icon);
      if (category === "tone") {
        setTones((prev) => (prev.some((t) => t.id === option.id || t.label_zh === option.label_zh) ? prev : [...prev, option]));
        setTone(option.label_zh);
        setIsAddingTone(false);
        setNewToneInput("");
        setToneOpen(false);
      } else if (category === "scenario") {
        setScenarios((prev) => (prev.some((s) => s.id === option.id || s.label_zh === option.label_zh) ? prev : [...prev, option]));
        setScenario(option.label_zh);
        setIsAddingScenario(false);
        setNewScenarioInput("");
        setScenarioOpen(false);
      } else if (category === "output_type") {
        setOutputTypes((prev) => (prev.some((o) => o.id === option.id || o.label_zh === option.label_zh) ? prev : [...prev, option]));
        setSelectedOutputId(option.id);
        setOutputType(codeToOutputType(option.code));
        setNewOutputTypeInput("");
        // Keep manage modal open; scroll list to newly added item
        requestAnimationFrame(() => {
          const el = outputModalListRef.current;
          if (el) el.scrollTop = el.scrollHeight;
        });
      } else if (category === "audience") {
        setAudiences((prev) => (prev.some((a) => a.id === option.id || a.label_zh === option.label_zh) ? prev : [...prev, option]));
      }
      showToast(`✅ 已成功新增並套用 ${option.label_zh}`);
    } catch (e) {
      showToast("新增失敗：" + (e instanceof Error ? e.message : "錯誤"));
    } finally {
      setSavingMeta(false);
    }
  }, [savingMeta, metadataUrl, csrfName, csrfHash, showToast]);

  const handleDeleteMetadata = useCallback(async (id: number, category: string) => {
    if (!id || id < 1 || savingMeta) return;
    if (!window.confirm("確定要刪除此選項嗎？")) return;
    setSavingMeta(true);
    try {
      await deleteAiMetadata(metadataUrl, id, csrfName, csrfHash);
      if (category === "tone") {
        setTones((prev) => {
          const next = prev.filter((o) => o.id !== id);
          setTone((cur) => {
            if (prev.find((o) => o.id === id)?.label_zh !== cur) return cur;
            return next[0]?.label_zh || FALLBACK_TONES[0].label_zh;
          });
          return next;
        });
      } else if (category === "scenario") {
        setScenarios((prev) => {
          const next = prev.filter((o) => o.id !== id);
          setScenario((cur) => {
            if (prev.find((o) => o.id === id)?.label_zh !== cur) return cur;
            return next[0]?.label_zh || FALLBACK_SCENARIOS[0].label_zh;
          });
          return next;
        });
      } else if (category === "output_type") {
        setOutputTypes((prev) => {
          const next = prev.filter((o) => o.id !== id);
          if (selectedOutputId === id) {
            const fallback = next[0] || FALLBACK_OUTPUT_TYPES[0];
            setSelectedOutputId(fallback.id > 0 ? fallback.id : null);
            setOutputType(codeToOutputType(fallback.code));
          }
          return next;
        });
      } else if (category === "audience") {
        setAudiences((prev) => prev.filter((o) => o.id !== id));
      }
      showToast("🗑️ 選項已刪除");
    } catch (e) {
      showToast("刪除失敗：" + (e instanceof Error ? e.message : "錯誤"));
    } finally {
      setSavingMeta(false);
    }
  }, [savingMeta, metadataUrl, csrfName, csrfHash, showToast, selectedOutputId]);

  /** Foolproof delete — confirm, then DELETE + sync list + KPI stats. */
  const confirmDelete = useCallback(async (documentIdToDelete: number) => {
    if (!documentIdToDelete || deletingId) return;
    const ok = window.confirm(
      "確定要刪除此份文案紀錄嗎？此動作將連同所有歷史版本一併刪除，且無法復原。",
    );
    if (!ok) return;

    setDeletingId(documentIdToDelete);
    try {
      const result = await deleteDocument(documentsUrl, documentIdToDelete, csrfName, csrfHash);
      setGenHistory((docs) => docs.filter((d) => d.documentId !== documentIdToDelete));
      setStats(result.stats);
      showToast("🗑️ 文案紀錄已刪除");
    } catch (e) {
      showToast("刪除失敗：" + (e instanceof Error ? e.message : "錯誤"));
    } finally {
      setDeletingId(null);
    }
  }, [deletingId, documentsUrl, csrfName, csrfHash, showToast]);

  // Load history list
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setListLoading(true);
      try {
        const payload = await fetchDocuments(documentsUrl);
        if (cancelled) return;
        setGenHistory(payload.documents);
        setStats(payload.stats);
      } catch {
        if (!cancelled) showToast("無法載入生成記錄（顯示示範資料）");
      } finally {
        if (!cancelled) setListLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [documentsUrl, showToast]);

  // Deep-link / refresh restore
  useEffect(() => {
    const route = readWorkspaceRoute();
    if (route.view === "editor" && route.docId && route.docId > 0) {
      void loadDocument(route.docId);
    } else if (route.view === "editor" && route.isNew) {
      setView("editor");
    }
    const onPop = () => {
      const r = readWorkspaceRoute();
      if (r.view === "list") {
        setView("list");
        setEditingRecord(null);
      } else if (r.docId) {
        void loadDocument(r.docId);
      } else {
        setView("editor");
        setDocumentId(null);
        setEditorContent("");
        setVersions([]);
        setGenerationDone(false);
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Student typeahead (Target Audience search)
  useEffect(() => {
    if (!showTargetResults) return;
    if (studentSearchTimer.current) clearTimeout(studentSearchTimer.current);
    const q = targetSearchQuery.trim();
    if (q.length < 1) {
      setSearchResults([]);
      return;
    }
    studentSearchTimer.current = setTimeout(async () => {
      setStudentSearching(true);
      try {
        const hits = await searchStudents(searchStudentsUrl, q);
        setSearchResults(hits);
      } catch {
        setSearchResults([]);
      } finally {
        setStudentSearching(false);
      }
    }, 280);
    return () => {
      if (studentSearchTimer.current) clearTimeout(studentSearchTimer.current);
    };
  }, [targetSearchQuery, showTargetResults, searchStudentsUrl]);

  const handleSelectTarget = useCallback((target: TargetAudience) => {
    setSelectedTarget(target);
    setShowTargetResults(false);
    setTargetSearchQuery("");
    setSearchResults([]);
    setToneOpen(false);
    setScenarioOpen(false);
    setIsAddingTone(false);
    setIsAddingScenario(false);

    if (target.type === "student") {
      void fetchStudentAcornData(target.id);
    } else {
      // Groups have no individual ACORN — clear ERP context
      setStudentContext(null);
    }
  }, [fetchStudentAcornData]);

  const handleTargetSearch = useCallback((value: string) => {
    setTargetSearchQuery(value);
    setShowTargetResults(true);
    setToneOpen(false);
    setScenarioOpen(false);
    setIsAddingTone(false);
    setIsAddingScenario(false);
  }, []);

  const clearTarget = useCallback(() => {
    setSelectedTarget(null);
    setStudentContext(null);
    setTargetSearchQuery("");
    setSearchResults([]);
    setShowTargetResults(false);
  }, []);

  const handleUploadContext = useCallback(async (file: File) => {
    if (!isAllowedContextFile(file)) {
      showToast("僅支援 PDF, DOCX, XLSX, CSV, MD, TXT, JPG, PNG（不含巨集格式）");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast("單一檔案上限 10MB");
      return;
    }
    const asImage = isContextImageFile(file);
    setUploading(true);
    setUploadingOcr(asImage);
    try {
      const fd = new FormData();
      fd.append("external_context_file", file);
      fd.append("file", file);
      fd.append("context_file", file);
      if (csrfName && csrfHash) fd.append(csrfName, csrfHash);
      const res = await fetch(uploadContextUrl, {
        method: "POST",
        body: fd,
        credentials: "same-origin",
        headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest", ...(csrfHash ? { "X-CSRF-TOKEN": csrfHash } : {}) },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        if (res.status === 413) {
          throw new Error(
            String(data.message || "檔案過大 (超過 4MB) 且自動壓縮失敗，請手動壓縮後再上載。")
          );
        }
        throw new Error(data.message || `upload HTTP ${res.status}`);
      }
      const source = (data.source === "ocr" || asImage) ? "ocr" as const : "document" as const;
      setUploadedCtx({
        filename: String(data.filename || file.name),
        bytes: Number(data.bytes || file.size),
        confidence: Number(data.confidence || 80),
        summary: String(data.summary || ""),
        text: String(data.text || ""),
        label: String(data.label || data.filename || file.name),
        source,
      });
      showToast(source === "ocr" ? "🖼️ 海報文字已萃取完成" : "📄 背景資料已上傳並解析");
    } catch (e) {
      showToast("上傳失敗：" + (e instanceof Error ? e.message : "錯誤"));
    } finally {
      setUploading(false);
      setUploadingOcr(false);
    }
  }, [uploadContextUrl, csrfName, csrfHash, showToast]);

  const selectedOutputOpt = (selectedOutputId != null
    ? outputTypes.find((o) => o.id === selectedOutputId)
    : null)
    || outputTypes.find((o) => o.code === OUTPUT_TO_API[outputType])
    || outputTypes.find((o) => codeToOutputType(o.code) === outputType)
    || outputTypes[0]
    || FALLBACK_OUTPUT_TYPES[0];
  const outputMeta = {
    id: outputType,
    zh: selectedOutputOpt.label_zh,
    en: OUTPUT_TYPE_EN[selectedOutputOpt.code || OUTPUT_TO_API[outputType]] || selectedOutputOpt.label_zh,
    icon: selectedOutputOpt.icon || "📄",
    code: selectedOutputOpt.code || OUTPUT_TO_API[outputType],
  };

  /** Sidebar shows at most 3 cards; always keep the currently selected type visible. */
  const visibleOutputTypes = (() => {
    if (outputTypes.length <= 3) return outputTypes;
    const selected = selectedOutputOpt;
    const top = outputTypes.slice(0, 3);
    if (top.some((t) => t.id === selected.id)) return top;
    return [top[0], top[1], selected].filter(Boolean) as AiMetadataOption[];
  })();

  const selectOutputOption = (type: AiMetadataOption) => {
    setSelectedOutputId(type.id);
    setOutputType(codeToOutputType(type.code));
  };

  const isOutputSelected = (type: AiMetadataOption) =>
    selectedOutputId === type.id
    || (selectedOutputId == null && (
      type.code === OUTPUT_TO_API[outputType]
      || codeToOutputType(type.code) === outputType
    ));

  const handleGenerate = useCallback(async () => {
    if (isGenerating) return;
    if (uploading) {
      showToast(uploadingOcr ? "請等待海報文字萃取完成后再生成" : "請等待背景資料上傳完成后再生成");
      return;
    }
    if (outputType !== "promo" && !selectedTarget) {
      showToast("請先選擇生成對象（學生或群體）");
      setShowTargetResults(true);
      return;
    }
    setIsGenerating(true);
    setGenerationDone(false);
    try {
      const groupAudienceLine = selectedTarget?.type === "group"
        ? `目標受眾群體：${selectedTarget.label}`
        : "";
      const uploadedText = uploadedCtx?.text || uploadedCtx?.summary || "";
      const externalParts = [groupAudienceLine, uploadedText].filter(Boolean);
      const body = {
        document_id: documentId || undefined,
        student_id: selectedTarget?.type === "student" ? selectedTarget.id : undefined,
        target_type: selectedTarget?.type || undefined,
        target_group_id: selectedTarget?.type === "group" ? selectedTarget.id : undefined,
        target_label: selectedTarget?.label || undefined,
        doc_type: outputMeta.code || OUTPUT_TO_API[outputType],
        doc_type_label: outputMeta.zh,
        tone,
        target_word_count: wordTarget,
        scenario,
        additionalPrompt: additionalPrompt.trim(),
        additional_prompt: additionalPrompt.trim(),
        external_context_text: externalParts.join("\n\n"),
      };
      const res = await fetch(generateUrl, {
        method: "POST",
        credentials: "same-origin",
        headers: jsonHeaders(csrfName, csrfHash),
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        throw new Error(data.message || `generate HTTP ${res.status}`);
      }
      const ver = data.version as DocVersion;
      const newDocId = Number(data.document_id || documentId || 0);
      if (newDocId > 0) {
        setDocumentId(newDocId);
        pushWorkspaceRoute({ view: "editor", docId: newDocId });
      }
      if (ver) {
        setVersions((prev) => {
          const without = prev.filter((v) => v.version_num !== ver.version_num);
          return [...without, ver].sort((a, b) => a.version_num - b.version_num);
        });
        setActiveVersion(ver.version_num);
        const body = ver.content || "";
        setEditorContent(body);
        setSavedSnapshot(body);
        setContentEpoch((n) => n + 1);
        setGenerationDone(true);
      }
      if (data.student_context) applyStudentContext(data.student_context);
      // Refresh list quietly
      fetchDocuments(documentsUrl).then((p) => {
        setGenHistory(p.documents);
        setStats(p.stats);
      }).catch(() => {});
      showToast(`✨ 新版草稿已生成（V${ver?.version_num ?? ""}）`);
    } catch (e) {
      showToast("生成失敗：" + (e instanceof Error ? e.message : "錯誤"));
    } finally {
      setIsGenerating(false);
    }
  }, [
    isGenerating, uploading, uploadingOcr, outputType, outputMeta.code, outputMeta.zh,
    selectedTarget, documentId, tone, wordTarget, scenario, additionalPrompt,
    uploadedCtx, generateUrl, csrfName, csrfHash, documentsUrl, applyStudentContext, showToast,
  ]);

  const isDirty = editorContent !== savedSnapshot;

  const handleSaveDraft = useCallback(async (asNew = false): Promise<boolean> => {
    if (!editorContent.trim()) {
      showToast("尚無可儲存內容");
      return false;
    }
    if (!documentId) {
      showToast("請先生成草稿以建立文件");
      return false;
    }
    setIsSaving(true);
    setSaveMenuOpen(false);
    try {
      const docTypeCode = outputMeta.code || OUTPUT_TO_API[outputType];
      const res = await fetch(saveVersionUrl, {
        method: "POST",
        credentials: "same-origin",
        headers: jsonHeaders(csrfName, csrfHash),
        body: JSON.stringify({
          document_id: documentId,
          content: editorContent,
          save_as_new_version: asNew,
          doc_type: docTypeCode,
          student_id: selectedTarget?.type === "student" ? selectedTarget.id : null,
          target_type: selectedTarget?.type || null,
          target_group: selectedTarget?.type === "group" ? selectedTarget.id : null,
          target_group_id: selectedTarget?.type === "group" ? selectedTarget.id : null,
          target_label: selectedTarget?.label || null,
          parameters_json: {
            tone,
            scenario,
            target_word_count: wordTarget,
            doc_type: docTypeCode,
            doc_type_label: outputMeta.zh,
            student_id: selectedTarget?.type === "student" ? selectedTarget.id : null,
            target_type: selectedTarget?.type || null,
            target_group: selectedTarget?.type === "group" ? selectedTarget.id : null,
            target_group_id: selectedTarget?.type === "group" ? selectedTarget.id : null,
            target_label: selectedTarget?.label || null,
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.message || "save failed");
      if (data.version) {
        const ver = data.version as DocVersion;
        if (asNew) {
          setVersions((prev) => [...prev.filter((v) => v.version_num !== ver.version_num), ver]
            .sort((a, b) => a.version_num - b.version_num));
          setActiveVersion(ver.version_num);
        } else {
          setVersions((prev) => prev.map((v) => (v.version_num === ver.version_num ? { ...v, ...ver } : v)));
        }
      }
      setSavedSnapshot(editorContent);
      setIsSaved(true);
      showToast(asNew ? `💾 已另存為新版本 V${data.version?.version_num ?? ""}` : "💾 草稿已儲存");
      setTimeout(() => setIsSaved(false), 1400);
      fetchDocuments(documentsUrl).then((p) => {
        setGenHistory(p.documents);
        setStats(p.stats);
      }).catch(() => {});
      return true;
    } catch (e) {
      showToast("儲存失敗：" + (e instanceof Error ? e.message : "錯誤"));
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [documentId, editorContent, saveVersionUrl, csrfName, csrfHash, tone, scenario, wordTarget, outputType, outputMeta.code, outputMeta.zh, selectedTarget, documentsUrl, showToast]);

  const selectVersion = useCallback(async (ver: DocVersion) => {
    if (ver.version_num === activeVersion && !isDirty) {
      applyVersionParams(ver);
      return;
    }
    if (isDirty) {
      const choice = window.confirm(
        "目前版本有未儲存的修改。\n\n確定 = 先儲存再切換\n取消 = 捨棄修改並切換",
      );
      if (choice) {
        const ok = await handleSaveDraft(false);
        if (!ok) return;
      }
    }
    setActiveVersion(ver.version_num);
    const body = ver.content || "";
    setEditorContent(body);
    setSavedSnapshot(body);
    setContentEpoch((n) => n + 1);
    setGenerationDone(!!body.trim());
    applyVersionParams(ver);
  }, [activeVersion, isDirty, applyVersionParams, handleSaveDraft]);

  const GEN_TYPE_LABEL: Record<string, string> = {
    initial_gen: "初次生成",
    full_regen: "全文重產",
    manual_edit: "手動編輯",
    partial_polish: "局部潤飾",
  };

  const handleSendChat = useCallback(() => {
    const q = chatInput.trim();
    if (!q || isThinking) return;
    const userMsg: ChatMessage = { id: `u${Date.now()}`, role: "user", content: q, timestamp: new Date().toLocaleTimeString("zh-HK", { hour: "2-digit", minute: "2-digit" }) };
    setMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setIsThinking(true);
    setTimeout(() => {
      const aiReply: ChatMessage = {
        id: `a${Date.now()}`, role: "ai", timestamp: new Date().toLocaleTimeString("zh-HK", { hour: "2-digit", minute: "2-digit" }),
        content: `根據你的查詢「${q}」，以下是系統檢索結果。共找到 ${MOCK_TABLE.length} 名符合條件的學生：`,
        tableData: MOCK_TABLE,
      };
      setMessages(prev => [...prev, aiReply]);
      setIsThinking(false);
    }, 1400);
  }, [chatInput, isThinking]);

  const wordCountLabel =
    wordTarget < 150 ? `精簡 (~${wordTarget} 字)` :
    wordTarget < 300 ? `適中 (~${wordTarget} 字)` :
    wordTarget < 500 ? `中等 (~${wordTarget} 字)` :
    `詳盡 (~${wordTarget} 字)`;

  const docWordCount = countDocChars(editorContent);

  const contextBadges = studentContext?.badges?.length
    ? studentContext.badges.slice(0, 6)
    : [];
  const dataSources = [
    {
      id: "m3",
      label: "M3 · ACORN 六維數據",
      confidence: studentContext?.acorn?.length ? 98 : (selectedStudent ? 40 : 0),
      color: D.emerald, bg: D.emeraldPale, bd: D.emeraldBd,
    },
    {
      id: "m4",
      label: "M4 · 成就與獎項紀錄",
      confidence: studentContext?.achievements?.length
        ? Math.min(99, 80 + studentContext.achievements.length * 2)
        : (selectedStudent ? 35 : 0),
      color: "#7C3AED", bg: "#EDE9FE", bd: "#DDD6FE",
    },
    {
      id: "m6",
      label: "M6 · AI 歷史評語",
      confidence: versions.length > 0 ? 88 : 20,
      color: D.ai, bg: D.aiLight, bd: D.aiBorder,
    },
    {
      id: "ext",
      label: uploadedCtx
        ? `${uploadedCtx.source === "ocr" ? "🖼️" : "📄"} ${uploadedCtx.filename.slice(0, 18)}`
        : "📄 外部背景資料",
      confidence: uploadedCtx?.confidence ?? 0,
      color: D.amber, bg: D.amberPale, bd: D.amberBd,
    },
  ];
  const handleExport = useCallback(() => {
    const html = buildExportHtml({
      titleZh: "香港神託會培敦中學",
      titleEn: "Stewards Pooi Tun Secondary School",
      docLabel: `${outputMeta.icon} ${outputMeta.zh} / ${outputMeta.en}`,
      body: editorContent,
      includeSignatory: outputType === "letter",
    });
    const w = window.open("", "_blank", "noopener,noreferrer,width=900,height=1000");
    if (!w) {
      const blob = new Blob(["\ufeff", html], { type: "application/msword;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `STS_${outputMeta.zh}_V${activeVersion || 1}.doc`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("📥 已下載 Word 檔");
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
    setTimeout(() => {
      try { w.focus(); w.print(); } catch { /* ignore */ }
    }, 250);
    showToast("📥 已開啟列印 / PDF 預覽");
  }, [editorContent, outputType, activeVersion, outputMeta.icon, outputMeta.zh, outputMeta.en, showToast]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: isMobile ? "auto" : "100%", minHeight: isMobile ? "100%" : undefined, background: D.bg, fontFamily: F, overflow: isMobile ? "visible" : "hidden" }}>

      {/* ── Keyframe styles ────────────────────────────────────────────── */}
      <style>{`
        @keyframes aiGlow { 0%,100% { box-shadow: 0 0 0 0 rgba(99,102,241,0); } 50% { box-shadow: 0 0 0 5px rgba(99,102,241,0.20); } }
        @keyframes sparkleFloat { 0%,100% { transform: translateY(0px) rotate(0deg); opacity: 0.8; } 33% { transform: translateY(-3px) rotate(12deg); opacity: 1; } 66% { transform: translateY(-1px) rotate(-8deg); opacity: 0.9; } }
        @keyframes toastSlide { from { transform: translateX(-50%) translateY(12px); opacity: 0; } to { transform: translateX(-50%) translateY(0); opacity: 1; } }
        @keyframes generatePulse { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes dataIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes thinkingDot { 0%,80%,100% { transform: scale(0.5); opacity: 0.3; } 40% { transform: scale(1); opacity: 1; } }
        @keyframes chatBubbleIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .chat-bubble-enter { animation: chatBubbleIn 0.22s ease-out; }
        .thinking-dot-1 { animation: thinkingDot 1.2s ease-in-out 0s infinite; }
        .thinking-dot-2 { animation: thinkingDot 1.2s ease-in-out 0.2s infinite; }
        .thinking-dot-3 { animation: thinkingDot 1.2s ease-in-out 0.4s infinite; }
        input[type=range].ai-slider { -webkit-appearance: none; appearance: none; width: 100%; height: 4px; background: linear-gradient(90deg, #6366F1, #8B5CF6); border-radius: 2px; outline: none; cursor: pointer; }
        input[type=range].ai-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: #6366F1; border: 2px solid #fff; box-shadow: 0 1px 4px rgba(99,102,241,0.40); cursor: pointer; }
        input[type=range].ai-slider::-moz-range-thumb { width: 16px; height: 16px; border-radius: 50%; background: #6366F1; border: 2px solid #fff; cursor: pointer; }
      `}</style>

      {/* ════════════════════ LIST VIEW ════════════════════ */}
      {view === "list" && (
        <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? 16 : 28, display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Page header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #4F46E5, #7C3AED)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 10px rgba(99,102,241,0.40)", animation: "aiGlow 3s ease-in-out infinite", flexShrink: 0 }}>
                <Sparkles size={18} color="#fff" style={{ animation: "sparkleFloat 3s ease-in-out infinite" }} />
              </div>
              <div>
                <div style={{ fontSize: isMobile ? 15 : 18, fontWeight: 800, color: D.text1, letterSpacing: "-0.4px" }}>AI 文案工作站</div>
                <div style={{ fontSize: 11, color: D.text4 }}>AI Copywriting Workspace · M1.F.3/6</div>
              </div>
            </div>
            <button
              onClick={goNewEditor}
              style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "linear-gradient(135deg, #4F46E5, #6366F1)", border: "none", borderRadius: 10, padding: isMobile ? "9px 14px" : "10px 20px", cursor: "pointer", fontSize: isMobile ? 12 : 13, fontWeight: 700, color: "#fff", fontFamily: F, boxShadow: "0 2px 12px rgba(99,102,241,0.45)", flexShrink: 0 }}>
              <Wand2 size={14} color="#fff" />
              ✨ 新建文案 Create New
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(3, 1fr)", gap: 12 }}>
            {[
              { label: "總文件數", value: stats.total_docs, sub: "Total Documents", color: D.ai, bg: D.aiLight, bd: D.aiBorder, icon: <Archive size={14} color={D.ai} /> },
              { label: "本週生成", value: stats.generated_this_week, sub: "Generated This Week", color: D.emerald, bg: D.emeraldPale, bd: D.emeraldBd, icon: <Zap size={14} color={D.emerald} /> },
              { label: "待審閱", value: stats.pending_review, sub: "Pending Review", color: D.amber, bg: D.amberPale, bd: D.amberBd, icon: <Info size={14} color={D.amber} /> },
            ].map((stat) => (
              <div key={stat.label} style={{ background: stat.bg, border: `1px solid ${stat.bd}`, borderRadius: 12, padding: "14px 16px", display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ flexShrink: 0 }}>{stat.icon}</div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: D.text2, marginTop: 2 }}>{stat.label}</div>
                  <div style={{ fontSize: 10, color: D.text4 }}>{stat.sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Record table */}
          <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 14, overflow: "hidden", boxShadow: D.shadow }}>
            <div style={{ padding: "14px 20px", borderBottom: `1px solid ${D.border}`, display: "flex", alignItems: "center", gap: 8, background: "#FAFAFA" }}>
              <History size={14} color={D.ai} />
              <span style={{ fontSize: 13, fontWeight: 700, color: D.text1 }}>生成記錄</span>
              <span style={{ fontSize: 11, color: D.text4 }}>Generation History</span>
              <span style={{ padding: "1px 8px", background: D.aiLight, color: D.ai, border: `1px solid ${D.aiBorder}`, borderRadius: 999, fontSize: 10.5, fontWeight: 700, marginLeft: 2 }}>{genHistory.length}</span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: F }}>
                <thead>
                  <tr style={{ background: "#F8FAFC" }}>
                    {["編號 (ID)", "類型 Type", "生成對象", "情境/場合", "字數", "版本", "生成時間", "操作 (Actions)"].map((col, ci) => (
                      <th key={ci} style={{ padding: "9px 16px", textAlign: "left", fontSize: 10.5, fontWeight: 700, color: D.text4, borderBottom: `1px solid ${D.border}`, whiteSpace: "nowrap", letterSpacing: "0.04em" }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {listLoading && (
                    <tr>
                      <td colSpan={8} style={{ padding: "28px 16px", textAlign: "center", color: D.text4, fontSize: 13 }}>
                        <Loader2 size={16} color={D.ai} style={{ display: "inline", marginRight: 8, verticalAlign: "middle", animation: "spin 0.8s linear infinite" }} />
                        載入生成記錄…
                      </td>
                    </tr>
                  )}
                  {!listLoading && genHistory.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ padding: "28px 16px", textAlign: "center", color: D.text4, fontSize: 13 }}>尚無生成記錄，點擊上方建立新文案。</td>
                    </tr>
                  )}
                  {!listLoading && genHistory.map((rec, ri) => {
                    const tc = rec.type === "推薦信"
                      ? { color: D.blue, bg: D.bluePale, bd: "#BFDBFE" }
                      : rec.type === "成績表評語"
                      ? { color: D.emerald, bg: D.emeraldPale, bd: D.emeraldBd }
                      : { color: "#7C3AED", bg: "#EDE9FE", bd: "#DDD6FE" };
                    const isRowDeleting = deletingId === rec.documentId;
                    return (
                      <tr key={rec.id}
                        style={{ borderBottom: ri < genHistory.length - 1 ? `1px solid ${D.border}` : "none", cursor: "pointer", transition: "background 0.1s", opacity: isRowDeleting ? 0.55 : 1 }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#F8F7FF")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                        onClick={() => openRecord(rec)}>
                        <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                          <span className="text-muted font-monospace small" style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: 11, color: D.text4, letterSpacing: "0.02em" }}>
                            #DOC-{rec.documentId}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", background: tc.bg, border: `1px solid ${tc.bd}`, borderRadius: 999, fontSize: 11, fontWeight: 700, color: tc.color }}>{rec.type}</span>
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: D.text1 }}>
                          {rec.studentNameZh ? (
                            <span className="fw-medium" style={{ fontWeight: 600 }}>{rec.studentNameZh}</span>
                          ) : rec.targetGroup && GROUP_TARGET_LABELS[rec.targetGroup] ? (
                            <span
                              className={`badge rounded-pill border ${
                                rec.targetGroup === "ALL_STUDENTS"
                                  ? "bg-primary-subtle text-primary"
                                  : rec.targetGroup === "ALL_PARENTS"
                                  ? "bg-info-subtle text-info"
                                  : "bg-secondary-subtle text-secondary"
                              }`}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                padding: "3px 10px",
                                borderRadius: 999,
                                border: `1px solid ${GROUP_TARGET_LABELS[rec.targetGroup].border}`,
                                background: GROUP_TARGET_LABELS[rec.targetGroup].bg,
                                color: GROUP_TARGET_LABELS[rec.targetGroup].color,
                                fontSize: 11,
                                fontWeight: 700,
                                fontFamily: F,
                              }}
                            >
                              {GROUP_TARGET_LABELS[rec.targetGroup].icon}{" "}
                              {GROUP_TARGET_LABELS[rec.targetGroup].label}
                            </span>
                          ) : rec.student && rec.student !== "—" ? (
                            <span className="fw-medium" style={{ fontWeight: 600 }}>{rec.student}</span>
                          ) : (
                            <span className="text-muted" style={{ color: D.text4, fontWeight: 500 }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 12, color: D.text3 }}>{rec.scenario}</td>
                        <td style={{ padding: "12px 16px", fontSize: 12, color: D.text3, fontFamily: "'JetBrains Mono', monospace" }}>{rec.words} 字</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ display: "inline-block", padding: "2px 8px", background: "#F1F5F9", border: `1px solid ${D.border}`, borderRadius: 6, fontSize: 11, fontWeight: 700, color: D.text3 }}>{rec.version}</span>
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 11, color: D.text4, whiteSpace: "nowrap" }}>
                          <Calendar size={11} color={D.text4} style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }} />{rec.ts}
                        </td>
                        <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }} onClick={e => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => openRecord(rec)}
                            style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", background: D.aiLight, border: `1px solid ${D.aiBorder}`, borderRadius: 7, cursor: "pointer", fontSize: 11, fontWeight: 700, color: D.ai, fontFamily: F }}>
                            開啟 <ChevronRight size={11} color={D.ai} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger border-0 ms-2"
                            disabled={!!deletingId}
                            onClick={() => void confirmDelete(rec.documentId)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              marginLeft: 8,
                              padding: "5px 10px",
                              background: isRowDeleting ? "#FEE2E2" : "transparent",
                              border: "1px solid transparent",
                              borderRadius: 7,
                              cursor: deletingId ? "wait" : "pointer",
                              fontSize: 11,
                              fontWeight: 700,
                              color: "#DC2626",
                              fontFamily: F,
                              opacity: deletingId && !isRowDeleting ? 0.45 : 1,
                            }}
                            title="刪除此文案紀錄"
                          >
                            {isRowDeleting
                              ? <Loader2 size={12} color="#DC2626" style={{ animation: "spin 0.8s linear infinite" }} />
                              : <Trash2 size={12} color="#DC2626" />}
                            刪除
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ padding: "14px 20px", borderTop: `1px solid ${D.border}`, display: "flex", justifyContent: "center" }}>
              <button
                onClick={goNewEditor}
                style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 20px", background: "linear-gradient(135deg, #4F46E5, #6366F1)", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 12.5, fontWeight: 700, color: "#fff", fontFamily: F, boxShadow: "0 2px 10px rgba(99,102,241,0.40)" }}>
                <Wand2 size={13} color="#fff" /> ✨ 建立新文案
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ════════════════════ EDITOR VIEW ════════════════════ */}
      {view === "editor" && (<>

      {/* ══════════════════════════════════════════════════════════════════════
          TOP HEADER
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ minHeight: 56, background: D.surface, borderBottom: `1px solid ${D.border}`, display: "flex", alignItems: "center", flexWrap: "nowrap", padding: isMobile ? "0 12px" : "0 20px", gap: isMobile ? 6 : 12, flexShrink: 0, boxShadow: "0 1px 3px rgba(15,23,42,0.05)" }}>
        <button onClick={goList} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "none", border: `1px solid ${D.border}`, borderRadius: 8, padding: "5px 10px", fontSize: 12, fontWeight: 600, color: D.text3, cursor: "pointer", fontFamily: F, flexShrink: 0 }}>
          <ChevronRight size={13} color={D.text4} style={{ transform: "rotate(180deg)" }} /> 返回記錄
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: 1 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg, #4F46E5, #7C3AED)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(99,102,241,0.40)", animation: "aiGlow 3s ease-in-out infinite", flexShrink: 0 }}>
            <Sparkles size={15} color="#fff" style={{ animation: "sparkleFloat 3s ease-in-out infinite" }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <span style={{ fontSize: isMobile ? 13 : 15, fontWeight: 800, color: D.text1, letterSpacing: "-0.3px" }}>
              {mainTab === "workspace" ? "✍️ AI 文案工作站" : "🤖 AI 數據助手"}
            </span>
            {!isMobile && <span style={{ fontSize: 11, color: D.text4, marginLeft: 10 }}>{mainTab === "workspace" ? "AI Copywriting Workspace · M1.F.3/6" : "AI Data Assistant · Natural Language Queries"}</span>}
          </div>
        </div>
        {!isMobile && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 9px", background: D.aiLight, color: D.ai, border: `1px solid ${D.aiBorder}`, borderRadius: 5, flexShrink: 0 }}>GPT-4o · 繁中 ZH-HK</span>}
        {mainTab === "workspace" && (
          <>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div style={{ display: "inline-flex", borderRadius: 9, overflow: "hidden", border: `1px solid ${isDirty ? D.aiBorder : D.border}`, background: D.surface }}>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => { void handleSaveDraft(false); }}
                  style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, background: "none", border: "none", padding: "7px 12px", cursor: isSaving ? "wait" : "pointer", fontSize: 12, fontWeight: 600, color: isSaved ? D.emerald : (isDirty ? D.ai : D.text2), fontFamily: F }}
                >
                  {isSaving ? <Loader2 size={13} color={D.ai} style={{ animation: "spin 0.8s linear infinite" }} /> : isSaved ? <Check size={13} color={D.emerald} /> : <Save size={13} color={isDirty ? D.ai : D.text3} />}
                  {!isMobile && <span>{isSaved ? "已儲存" : isDirty ? "💾 儲存草稿" : "儲存草稿"}</span>}
                </button>
                <button
                  type="button"
                  onClick={() => setSaveMenuOpen((v) => !v)}
                  style={{ display: "inline-flex", alignItems: "center", padding: "0 8px", background: "#F8FAFC", border: "none", borderLeft: `1px solid ${D.border}`, cursor: "pointer" }}
                  title="更多儲存選項"
                >
                  <ChevronDown size={13} color={D.text3} />
                </button>
              </div>
              {saveMenuOpen && (
                <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 40, minWidth: 200, background: D.surface, border: `1px solid ${D.border}`, borderRadius: 10, boxShadow: D.shadowLg, overflow: "hidden" }}>
                  <button type="button" onClick={() => { void handleSaveDraft(false); }} style={{ width: "100%", textAlign: "left", padding: "10px 14px", background: "none", border: "none", cursor: "pointer", fontSize: 12, fontFamily: F, color: D.text2 }}>
                    💾 儲存至目前版本 V{activeVersion || 1}
                  </button>
                  <button type="button" onClick={() => { void handleSaveDraft(true); }} style={{ width: "100%", textAlign: "left", padding: "10px 14px", background: "none", border: "none", borderTop: `1px solid ${D.border}`, cursor: "pointer", fontSize: 12, fontFamily: F, color: D.ai, fontWeight: 700 }}>
                    另存為新版本 V{(versions.reduce((m, v) => Math.max(m, v.version_num), 0) || 0) + 1}
                  </button>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handleExport}
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, background: "linear-gradient(135deg, #4F46E5, #6366F1)", border: "none", borderRadius: 9, padding: "7px 14px", cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#fff", fontFamily: F, boxShadow: "0 2px 10px rgba(99,102,241,0.40)", flexShrink: 0 }}
            >
              <Download size={13} color="#fff" />
              {!isMobile && <span>匯出 Word / PDF</span>}
            </button>
          </>
        )}
      </div>

      {/* ── Main module tab bar ───────────────────────────────────────────── */}
      <div style={{ background: D.surface, borderBottom: `1px solid ${D.border}`, display: "flex", gap: 0, flexShrink: 0, paddingLeft: isMobile ? 12 : 20 }}>
        {[
          { id: "workspace" as const, label: "✍️ 文案工作站", sub: "Copywriting" },
          { id: "databot"  as const, label: "🤖 AI 數據助手", sub: "Data Assistant" },
        ].map(tab => (
          <button key={tab.id} onClick={() => setMainTab(tab.id)} style={{
            display: "flex", flexDirection: "column", alignItems: "flex-start",
            padding: isMobile ? "8px 14px" : "8px 18px",
            background: "transparent", border: "none",
            borderBottom: mainTab === tab.id ? `2px solid ${D.ai}` : "2px solid transparent",
            cursor: "pointer", fontFamily: F, marginBottom: -1,
            transition: "all 0.12s",
          }}>
            <span style={{ fontSize: isMobile ? 12 : 13, fontWeight: mainTab === tab.id ? 700 : 500, color: mainTab === tab.id ? D.ai : D.text3 }}>{tab.label}</span>
            {!isMobile && <span style={{ fontSize: 9.5, color: mainTab === tab.id ? D.aiBorder : D.text4, marginTop: 1 }}>{tab.sub}</span>}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: COPYWRITING WORKSPACE
      ══════════════════════════════════════════════════════════════════════ */}
      {mainTab === "workspace" && (
        <>
          {/* Mobile tab bar */}
          {isMobile && (
            <div style={{ display: "flex", background: D.surface, borderBottom: `1px solid ${D.border}`, flexShrink: 0 }}>
              {(["setup", "output"] as const).map(tab => (
                <button key={tab} onClick={() => setMobileTab(tab)} style={{ flex: 1, padding: "10px 0", background: mobileTab === tab ? D.aiLight : "none", border: "none", borderBottom: `2px solid ${mobileTab === tab ? D.ai : "transparent"}`, cursor: "pointer", fontSize: 12, fontWeight: 700, color: mobileTab === tab ? D.ai : D.text4, fontFamily: F, transition: "all 0.15s" }}>
                  {tab === "setup" ? "⚙️ 設定區" : "✍️ 輸出區"}
                </button>
              ))}
            </div>
          )}

          {/* Split pane */}
          <div
            ref={splitPaneRef}
            style={{
              flex: isMobile ? "none" : 1,
              display: isMobile ? "block" : "flex",
              flexDirection: isMobile ? undefined : "row",
              overflow: isMobile ? "visible" : "hidden",
              minHeight: 0,
            }}
          >

            {/* ── LEFT PANEL ────────────────────────────────────────────── */}
            <div
              className="sidebar-container"
              style={{
                width: isMobile ? "100%" : sidebarWidth,
                flexShrink: 0,
                overflowX: "hidden",
                overflowY: isMobile ? "visible" : "auto",
                background: D.surface,
                display: isMobile && mobileTab !== "setup" ? "none" : "flex",
                flexDirection: "column",
                gap: 0,
                boxSizing: "border-box",
              }}
            >
              <div style={{ padding: "14px 18px 12px", borderBottom: `1px solid ${D.border}`, background: "#FAFAFA", position: "sticky", top: 0, zIndex: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <Brain size={14} color={D.ai} />
                  <span style={{ fontSize: 12.5, fontWeight: 800, color: D.text1 }}>參數設定</span>
                </div>
                <div style={{ fontSize: 10, color: D.text4, marginTop: 2 }}>Parameter Controls & Context Injection</div>
              </div>

              <div style={{ padding: "18px 18px 24px", display: "flex", flexDirection: "column", gap: 20, minWidth: 0, overflowX: "hidden" }}>

                {/* Target Audience — student search + quick group chips */}
                <div className="mb-4" style={{ marginBottom: 4 }}>
                  <label
                    className="form-label fw-bold text-dark d-flex align-items-center mb-2"
                    style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, fontSize: 12, fontWeight: 800, color: D.text1, fontFamily: F }}
                  >
                    <Users size={12} color={D.text3} />
                    生成對象 Target Audience
                    {outputType === "promo" && (
                      <span style={{ fontSize: 10, fontWeight: 600, color: D.text4 }}>（可選）</span>
                    )}
                  </label>

                  <div className="position-relative" ref={targetSearchRef} style={{ position: "relative" }}>
                    {!selectedTarget ? (
                      <>
                        {/* Search Input */}
                        <div
                          className="input-group shadow-sm"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "8px 12px",
                            background: D.surface,
                            border: `1.5px solid ${showTargetResults ? D.aiBorder : D.border}`,
                            borderRadius: 10,
                            boxShadow: showTargetResults ? `0 0 0 3px ${D.aiLight}` : "none",
                          }}
                        >
                          <span className="input-group-text bg-white border-end-0" style={{ display: "inline-flex", background: "transparent", border: "none", padding: 0 }}>
                            <Search size={14} color={D.text4} />
                          </span>
                          <input
                            type="text"
                            className="form-control border-start-0 ps-0"
                            placeholder="搜尋特定學生，或直接點選下方群體..."
                            value={targetSearchQuery}
                            onChange={(e) => handleTargetSearch(e.target.value)}
                            onClick={() => {
                              setShowTargetResults(true);
                              setToneOpen(false);
                              setScenarioOpen(false);
                            }}
                            onFocus={() => {
                              setShowTargetResults(true);
                              setToneOpen(false);
                              setScenarioOpen(false);
                            }}
                            style={{ flex: 1, border: "none", outline: "none", fontSize: 13, fontFamily: F, color: D.text1, background: "transparent", padding: 0 }}
                          />
                          {studentSearching && <Loader2 size={13} color={D.ai} style={{ animation: "spin 0.8s linear infinite" }} />}
                        </div>

                        {/* Quick Select Group Chips */}
                        <div
                          className="d-flex flex-wrap gap-2 mt-2 pt-1"
                          style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10, paddingTop: 2 }}
                        >
                          {QUICK_TARGET_GROUPS.map((g) => (
                            <button
                              key={g.id}
                              type="button"
                              className={`btn btn-sm rounded-pill px-3 fw-medium ${g.accent === "primary" ? "btn-outline-primary" : "btn-outline-secondary"}`}
                              onClick={() => handleSelectTarget({ type: "group", label: g.label, id: g.id })}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                padding: "5px 12px",
                                borderRadius: 999,
                                border: `1px solid ${g.accent === "primary" ? D.aiBorder : D.border}`,
                                background: g.accent === "primary" ? D.aiLight : D.surface,
                                color: g.accent === "primary" ? D.ai : D.text2,
                                fontSize: 11.5,
                                fontWeight: 600,
                                fontFamily: F,
                                cursor: "pointer",
                              }}
                            >
                              {g.emoji} {g.label}
                            </button>
                          ))}
                        </div>

                        {/* Student Search Dropdown */}
                        {showTargetResults && targetSearchQuery.trim() && (
                          <ul
                            className="dropdown-menu w-100 shadow-sm show position-absolute mt-1"
                            style={{
                              position: "absolute",
                              top: "calc(100% + 4px)",
                              left: 0,
                              right: 0,
                              width: "100%",
                              maxWidth: "100%",
                              boxSizing: "border-box",
                              maxHeight: 250,
                              overflowY: "auto",
                              overflowX: "hidden",
                              zIndex: 1050,
                              background: D.surface,
                              border: `1px solid ${D.border}`,
                              borderRadius: 10,
                              boxShadow: D.shadowLg,
                              listStyle: "none",
                              margin: "4px 0 0",
                              padding: 0,
                            }}
                          >
                            {searchResults.length > 0 ? (
                              searchResults.map((student) => (
                                <li key={student.id}>
                                  <button
                                    className="dropdown-item py-2"
                                    type="button"
                                    onClick={() => handleSelectTarget({
                                      type: "student",
                                      id: student.id,
                                      label: `${student.name_zh || student.name_en || student.text}${student.class_name ? ` (${student.class_name})` : ""}`,
                                      data: student,
                                    })}
                                    style={{
                                      width: "100%",
                                      textAlign: "left",
                                      padding: "9px 12px",
                                      background: "none",
                                      border: "none",
                                      borderBottom: `1px solid ${D.border}`,
                                      cursor: "pointer",
                                      fontFamily: F,
                                    }}
                                  >
                                    <div className="fw-bold" style={{ fontSize: 12.5, fontWeight: 700, color: D.text1 }}>
                                      {student.name_zh || student.text}{student.name_en ? ` ${student.name_en}` : ""}
                                    </div>
                                    <div className="small text-muted" style={{ fontSize: 10.5, color: D.text4, fontFamily: "'JetBrains Mono', monospace" }}>
                                      {[student.student_code, student.class_name].filter(Boolean).join(" · ") || "—"}
                                    </div>
                                  </button>
                                </li>
                              ))
                            ) : (
                              <li className="dropdown-item text-muted text-center py-3" style={{ padding: "12px", fontSize: 12, color: D.text4, textAlign: "center" }}>
                                {studentSearching ? "搜尋中…" : "找不到符合的學生"}
                              </li>
                            )}
                          </ul>
                        )}
                      </>
                    ) : (
                      /* Selected Target State (Pill) */
                      <div
                        className="p-2 border border-primary bg-primary-subtle rounded d-flex justify-content-between align-items-center shadow-sm"
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 8,
                          padding: "10px 12px",
                          background: D.aiLight,
                          border: `1.5px solid ${D.aiBorder}`,
                          borderRadius: 10,
                          boxShadow: `0 0 0 3px ${D.aiLight}`,
                        }}
                      >
                        <div className="fw-bold text-primary fs-6" style={{ fontSize: 13, fontWeight: 700, color: D.ai, fontFamily: F, minWidth: 0 }}>
                          {selectedTarget.type === "group" ? "👥 " : "👤 "}
                          {selectedTarget.label}
                          {contextLoading && selectedTarget.type === "student" && (
                            <Loader2 size={13} color={D.ai} style={{ marginLeft: 8, verticalAlign: "middle", animation: "spin 0.8s linear infinite" }} />
                          )}
                        </div>
                        <button
                          type="button"
                          className="btn btn-sm btn-link text-danger p-0 m-0"
                          onClick={clearTarget}
                          style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "inline-flex", color: "#DC2626" }}
                          aria-label="清除生成對象"
                        >
                          <X size={16} color="#DC2626" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Output Type — Top 3 cards + Manage modal trigger */}
                <div>
                  <SectionLabel icon={<PenLine size={12} color={D.text3} />} zh="輸出類型" en="Output Type" />
                  <div className="d-flex flex-wrap gap-2 mb-3" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {visibleOutputTypes.map((type) => {
                      const selected = isOutputSelected(type);
                      return (
                        <div
                          key={type.id}
                          role="button"
                          tabIndex={0}
                          className={`card cursor-pointer text-center p-2 ${selected ? "border-primary shadow-sm bg-primary-subtle" : "border-light bg-light"}`}
                          style={{
                            width: "30%",
                            minWidth: 90,
                            flex: "1 1 90px",
                            maxWidth: 120,
                            padding: "10px 8px",
                            borderRadius: 10,
                            cursor: "pointer",
                            textAlign: "center",
                            fontFamily: F,
                            transition: "all 0.2s",
                            background: selected ? D.surface : "#F8FAFC",
                            border: selected ? `1.5px solid ${D.aiBorder}` : `1px solid ${D.border}`,
                            boxShadow: selected ? `0 0 0 3px ${D.aiLight}` : "none",
                          }}
                          onClick={() => selectOutputOption(type)}
                          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") selectOutputOption(type); }}
                        >
                          <div className="fs-5 mb-1" style={{ fontSize: 18, marginBottom: 4 }}>{type.icon || "📄"}</div>
                          <div className="small fw-bold" style={{ fontSize: 10.5, fontWeight: 700, color: selected ? D.ai : D.text2, lineHeight: 1.25 }}>{type.label_zh}</div>
                        </div>
                      );
                    })}
                    <div
                      role="button"
                      tabIndex={0}
                      className="card cursor-pointer text-center p-2 border-dashed bg-transparent"
                      style={{
                        width: "30%",
                        minWidth: 90,
                        flex: "1 1 90px",
                        maxWidth: 120,
                        padding: "10px 8px",
                        borderRadius: 10,
                        cursor: "pointer",
                        textAlign: "center",
                        fontFamily: F,
                        background: "transparent",
                        borderStyle: "dashed",
                        borderWidth: 1.5,
                        borderColor: "#CBD5E1",
                        color: D.text4,
                      }}
                      onClick={() => setShowManageModal(true)}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setShowManageModal(true); }}
                    >
                      <div className="fs-5 mb-1 text-muted" style={{ fontSize: 18, marginBottom: 4 }}>⚙️</div>
                      <div className="small text-muted" style={{ fontSize: 10.5, fontWeight: 600 }}>更多 / 管理</div>
                    </div>
                  </div>
                </div>

                {/* ── PARAMETER CONTROLS (new) ────────────────────── */}
                <div style={{ background: "linear-gradient(135deg, #F8F7FF, #EEF2FF)", border: `1px solid ${D.aiBorder}`, borderRadius: 12, padding: "14px 14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 14 }}>
                    <Zap size={12} color={D.ai} />
                    <span style={{ fontSize: 11.5, fontWeight: 800, color: D.ai }}>輸出參數 Output Parameters</span>
                  </div>

                  {/* Tone — dynamic + inline Add New */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: D.text3, marginBottom: 5 }}>語氣 / Tone &amp; Style</div>
                    <div ref={toneDropdownRef} className="dropdown" style={{ position: "relative" }}>
                      <button
                        type="button"
                        className="btn btn-outline-secondary w-100 d-flex justify-content-between align-items-center"
                        aria-expanded={toneOpen}
                        onClick={() => {
                          setToneOpen((v) => !v);
                          setScenarioOpen(false);
                          setIsAddingScenario(false);
                          setShowTargetResults(false);
                        }}
                        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 11px", background: D.surface, border: `1.5px solid ${toneOpen ? D.aiBorder : D.border}`, borderRadius: 8, cursor: "pointer", fontFamily: F, fontSize: 12, color: D.text1, fontWeight: 600, transition: "border-color 0.15s" }}
                      >
                        <span><Feather size={11} color={D.text4} style={{ marginRight: 5 }} />🎯 {tone || "選擇語氣"}</span>
                        <ChevronDown size={13} color={D.text3} style={{ transform: toneOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
                      </button>
                      {toneOpen && (
                        <ul
                          className="dropdown-menu w-100 shadow-sm p-0 show"
                          style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, width: "100%", maxWidth: "100%", minWidth: 0, boxSizing: "border-box", zIndex: 50, background: D.surface, border: `1px solid ${D.border}`, borderRadius: 10, boxShadow: D.shadowLg, maxHeight: 300, overflowY: "auto", overflowX: "hidden", listStyle: "none", margin: 0, padding: 0 }}
                        >
                          <div className="py-1" style={{ padding: "4px 0" }}>
                            {tones.map((t) => (
                              <li
                                key={t.id}
                                className="dropdown-item d-flex justify-content-between align-items-center"
                                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", background: tone === t.label_zh ? D.aiLight : "transparent", gap: 6 }}
                              >
                                <div
                                  className="flex-grow-1"
                                  style={{ flex: 1, cursor: "pointer", fontSize: 12, color: tone === t.label_zh ? D.ai : D.text2, fontWeight: tone === t.label_zh ? 700 : 400, fontFamily: F }}
                                  onClick={() => { setTone(t.label_zh); setToneOpen(false); setIsAddingTone(false); }}
                                >
                                  {tone === t.label_zh && <span className="bi bi-check text-primary me-2">✓ </span>}
                                  {t.label_zh}
                                </div>
                                {!t.is_default && t.id > 0 && (
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-link text-danger p-0 ms-2"
                                    title="刪除此語氣"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      void handleDeleteMetadata(t.id, "tone");
                                    }}
                                    style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "inline-flex", color: "#DC2626" }}
                                  >
                                    <Trash2 size={13} color="#DC2626" />
                                  </button>
                                )}
                              </li>
                            ))}
                          </div>
                          <li
                            className="border-top bg-white px-2 py-2"
                            style={{ position: "sticky", bottom: 0, zIndex: 10, borderTop: `1px solid ${D.border}`, background: "#fff", padding: "8px 10px" }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {!isAddingTone ? (
                              <button
                                type="button"
                                className="btn btn-sm btn-light text-primary fw-bold w-100 d-flex align-items-center justify-content-center"
                                onClick={(e) => { e.stopPropagation(); setIsAddingTone(true); }}
                                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "7px 10px", borderRadius: 7, border: `1px solid ${D.aiBorder}`, background: D.aiLight, color: D.ai, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: F }}
                              >
                                <PlusCircle size={13} color={D.ai} /> 新增自訂語氣
                              </button>
                            ) : (
                              <div className="input-group input-group-sm" style={{ display: "flex", gap: 6 }}>
                                <input
                                  type="text"
                                  className="form-control"
                                  placeholder="輸入新語氣…"
                                  value={newToneInput}
                                  autoFocus
                                  onChange={(e) => setNewToneInput(e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") void handleAddNewMetadata("tone", newToneInput);
                                    if (e.key === "Escape") setIsAddingTone(false);
                                  }}
                                  style={{ flex: 1, padding: "6px 8px", borderRadius: 6, border: `1px solid ${D.border}`, fontSize: 12, fontFamily: F }}
                                />
                                <button
                                  type="button"
                                  className="btn btn-primary"
                                  disabled={savingMeta}
                                  onClick={(e) => { e.stopPropagation(); void handleAddNewMetadata("tone", newToneInput); }}
                                  style={{ padding: "6px 10px", borderRadius: 6, border: "none", background: D.ai, color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
                                >
                                  儲存
                                </button>
                              </div>
                            )}
                          </li>
                        </ul>
                      )}
                    </div>
                  </div>

                  {/* Word count slider */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 10.5, fontWeight: 700, color: D.text3 }}>字數限制 / Word Count</span>
                      <span style={{ fontSize: 10.5, fontWeight: 700, color: D.ai }}>{wordCountLabel}</span>
                    </div>
                    <input type="range" className="ai-slider" min={80} max={800} step={10} value={wordTarget} onChange={e => setWordTarget(Number(e.target.value))} />
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
                      <span style={{ fontSize: 9, color: D.text4 }}>精簡 80字</span>
                      <span style={{ fontSize: 9, color: D.text4 }}>詳盡 800字</span>
                    </div>
                  </div>

                  {/* Scenario — sticky Add footer + delete for custom items */}
                  <div>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: D.text3, marginBottom: 5 }}>場景 / Scenario</div>
                    <div ref={scenarioDropdownRef} className="dropdown" style={{ position: "relative" }}>
                      <button
                        type="button"
                        className="btn btn-outline-secondary w-100 d-flex justify-content-between align-items-center"
                        aria-expanded={scenarioOpen}
                        onClick={() => {
                          setScenarioOpen((v) => !v);
                          setToneOpen(false);
                          setIsAddingTone(false);
                          setShowTargetResults(false);
                        }}
                        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 11px", background: D.surface, border: `1.5px solid ${scenarioOpen ? D.aiBorder : D.border}`, borderRadius: 8, cursor: "pointer", fontFamily: F, fontSize: 11.5, color: D.text1, fontWeight: 600, transition: "border-color 0.15s" }}
                      >
                        <span>📌 {scenario || "選擇場景"}</span>
                        <ChevronDown size={13} color={D.text3} style={{ transform: scenarioOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
                      </button>
                      {scenarioOpen && (
                        <ul
                          className="dropdown-menu w-100 shadow-sm p-0 show"
                          style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, width: "100%", maxWidth: "100%", minWidth: 0, boxSizing: "border-box", zIndex: 50, background: D.surface, border: `1px solid ${D.border}`, borderRadius: 10, boxShadow: D.shadowLg, maxHeight: 300, overflowY: "auto", overflowX: "hidden", listStyle: "none", margin: 0, padding: 0 }}
                        >
                          <div className="py-1" style={{ padding: "4px 0" }}>
                            {scenarios.map((s) => (
                              <li
                                key={s.id}
                                className="dropdown-item d-flex justify-content-between align-items-center"
                                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px 6px 12px", background: scenario === s.label_zh ? D.aiLight : "transparent", gap: 6 }}
                              >
                                <div
                                  className="flex-grow-1"
                                  style={{ flex: 1, cursor: "pointer", fontSize: 11.5, fontFamily: F, fontWeight: scenario === s.label_zh ? 700 : 400, color: scenario === s.label_zh ? D.ai : D.text2 }}
                                  onClick={() => { setScenario(s.label_zh); setScenarioOpen(false); setIsAddingScenario(false); }}
                                >
                                  {scenario === s.label_zh && <span className="bi bi-check text-primary me-2">✓ </span>}
                                  {s.label_zh}
                                </div>
                                {!s.is_default && s.id > 0 && (
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-link text-danger p-0 ms-2"
                                    title="刪除此場景"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      void handleDeleteMetadata(s.id, "scenario");
                                    }}
                                    style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "inline-flex", color: "#DC2626" }}
                                  >
                                    <Trash2 size={13} color="#DC2626" />
                                  </button>
                                )}
                              </li>
                            ))}
                          </div>
                          <li
                            className="border-top bg-white px-2 py-2"
                            style={{ position: "sticky", bottom: 0, zIndex: 10, borderTop: `1px solid ${D.border}`, background: "#fff", padding: "8px 10px" }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {!isAddingScenario ? (
                              <button
                                type="button"
                                className="btn btn-sm btn-light text-primary fw-bold w-100 d-flex align-items-center justify-content-center"
                                onClick={(e) => { e.stopPropagation(); setIsAddingScenario(true); }}
                                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "7px 10px", borderRadius: 8, border: `1px solid ${D.aiBorder}`, background: D.aiLight, color: D.ai, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: F }}
                              >
                                <PlusCircle size={13} color={D.ai} /> 新增自訂場景
                              </button>
                            ) : (
                              <div className="input-group input-group-sm" style={{ display: "flex", gap: 6 }}>
                                <input
                                  type="text"
                                  className="form-control"
                                  placeholder="輸入新場景…"
                                  value={newScenarioInput}
                                  autoFocus
                                  onChange={(e) => setNewScenarioInput(e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") void handleAddNewMetadata("scenario", newScenarioInput);
                                    if (e.key === "Escape") setIsAddingScenario(false);
                                  }}
                                  style={{ flex: 1, padding: "6px 8px", borderRadius: 6, border: `1px solid ${D.border}`, fontSize: 12, fontFamily: F }}
                                />
                                <button
                                  type="button"
                                  className="btn btn-primary"
                                  disabled={savingMeta}
                                  onClick={(e) => { e.stopPropagation(); void handleAddNewMetadata("scenario", newScenarioInput); }}
                                  style={{ padding: "6px 10px", borderRadius: 6, border: "none", background: D.ai, color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
                                >
                                  儲存
                                </button>
                              </div>
                            )}
                          </li>
                        </ul>
                      )}
                    </div>
                  </div>

                  {/* Additional Instructions — free-text nuances for GB10 */}
                  <div className="mt-3 pt-3 border-top border-light" style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${D.border}` }}>
                    <label className="form-label text-muted small fw-bold mb-2" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10.5, fontWeight: 700, color: D.text3, marginBottom: 6 }}>
                      <Lightbulb size={12} className="bi bi-lightbulb-fill text-warning me-1" style={{ color: "#F59E0B", flexShrink: 0 }} />
                      附加提示詞 / Additional Instructions (可選)
                    </label>
                    <textarea
                      className="form-control form-control-sm bg-white"
                      rows={3}
                      placeholder="例如：請特別強調該學生在數學比賽中展現的逆境抗壓能力..."
                      value={additionalPrompt}
                      onChange={(e) => setAdditionalPrompt(e.target.value)}
                      style={{
                        resize: "none",
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "8px 10px",
                        borderRadius: 8,
                        border: `1.5px solid ${D.border}`,
                        background: "#fff",
                        fontSize: 11.5,
                        fontFamily: F,
                        color: D.text1,
                        lineHeight: 1.5,
                        outline: "none",
                      }}
                    />
                  </div>
                </div>

                {/* System Data */}
                <div>
                  <SectionLabel icon={<Zap size={12} color={D.ai} />} zh="系統數據注入" en="Auto-loaded from ERP" />
                  {selectedTarget?.type === "student" && studentContext ? (
                    <>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 12px", marginBottom: 10, background: D.emeraldPale, border: `1px solid ${D.emeraldBd}`, borderRadius: 9 }}>
                        <Sparkles size={13} color={D.emerald} style={{ flexShrink: 0, marginTop: 1 }} />
                        <div>
                          <div style={{ fontSize: 11.5, fontWeight: 700, color: D.emerald }}>✅ 已自動載入 ACORN 數據與歷史成就</div>
                          <div style={{ fontSize: 10, color: "#047857", marginTop: 1.5, lineHeight: 1.5 }}>
                            Auto-loaded ACORN & Achievement records · {dataSources.filter((s) => s.confidence > 0).length} sources
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                        {contextBadges.length === 0 && (
                          <span style={{ fontSize: 11, color: D.text4 }}>暫無可用徽章（仍可生成草稿）</span>
                        )}
                        {contextBadges.map((tag, i) => {
                          const st = badgeStyle(tag.tone, i);
                          return (
                            <div key={`${tag.label}-${i}`} style={{ padding: "4px 10px", borderRadius: 999, background: st.bg, border: `1px solid ${st.bd}`, display: "flex", flexDirection: "column", animation: "dataIn 0.25s ease-out" }}>
                              <span style={{ fontSize: 11, fontWeight: 700, color: st.color, lineHeight: 1.2 }}>{tag.label}</span>
                              <span style={{ fontSize: 9, color: st.color, opacity: 0.70 }}>{st.sub}</span>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  ) : selectedTarget?.type === "group" ? (
                    <div style={{ padding: "10px 12px", marginBottom: 10, background: "#EEF2FF", border: `1px solid ${D.aiBorder}`, borderRadius: 9, fontSize: 11.5, color: D.ai }}>
                      👥 已選群體「{selectedTarget.label}」— 不會載入個人 ACORN／成就數據。
                    </div>
                  ) : (
                    <div style={{ padding: "10px 12px", marginBottom: 10, background: "#F8FAFC", border: `1px dashed ${D.border}`, borderRadius: 9, fontSize: 11.5, color: D.text4 }}>
                      {outputType === "promo"
                        ? "宣傳稿可不選對象；選學生後注入 ERP，選群體則以受眾導向撰寫。"
                        : "請選擇學生（自動載入 ACORN）或下方群體快捷選項。"}
                    </div>
                  )}
                  <div style={{ background: "#FAFAFA", border: `1px solid ${D.border}`, borderRadius: 9, padding: "11px 13px", display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: D.text3, marginBottom: 2 }}>數據來源可信度</div>
                    {dataSources.map(src => (
                      <div key={src.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 9.5, fontWeight: 700, color: src.color, minWidth: 120, flexShrink: 0 }}>{src.label}</span>
                        <ConfBar pct={src.confidence} color={src.color} />
                        <span style={{ fontSize: 9.5, fontWeight: 700, color: src.color, minWidth: 28 }}>{src.confidence}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* External context — PDF/DOCX/TXT or poster images via GB10 OCR */}
                <div>
                  <SectionLabel icon={<Upload size={12} color={D.text3} />} zh="外部背景資料" en="External Context (PDF/DOCX/IMG)" />
                  {uploadedCtx && (
                    <div style={{ marginBottom: 8, background: uploadedCtx.source === "ocr" ? "#F5F3FF" : D.bluePale, border: `1px solid ${uploadedCtx.source === "ocr" ? "#DDD6FE" : "#BFDBFE"}`, borderRadius: 9, overflow: "hidden" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px" }}>
                        <div style={{ width: 28, height: 28, flexShrink: 0, background: uploadedCtx.source === "ocr" ? "#EDE9FE" : "#DBEAFE", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {uploadedCtx.source === "ocr" ? <Sparkles size={14} color="#7C3AED" /> : <FileText size={14} color={D.blue} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: uploadedCtx.source === "ocr" ? "#6D28D9" : D.blue, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{uploadedCtx.filename}</div>
                          <div style={{ fontSize: 9.5, color: uploadedCtx.source === "ocr" ? "#7C3AED" : "#3B82F6" }}>
                            {formatBytes(uploadedCtx.bytes)} · {uploadedCtx.source === "ocr" ? "AI OCR 已讀取" : "已分析"} · {uploadedCtx.confidence}% 置信度
                          </div>
                        </div>
                        <button type="button" onClick={() => setUploadedCtx(null)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={12} color="#94A3B8" /></button>
                      </div>
                      {(uploadedCtx.summary || uploadedCtx.text) && (
                        <div style={{ padding: "0 12px 10px" }}>
                          <div style={{ fontSize: 9.5, fontWeight: 700, color: D.text4, marginBottom: 4 }}>
                            {uploadedCtx.source === "ocr" ? "萃取文字預覽 Extracted Text" : "內容預覽 Preview"}
                          </div>
                          <div style={{ fontSize: 11, lineHeight: 1.55, color: D.text2, background: "#fff", border: `1px solid ${D.border}`, borderRadius: 7, padding: "8px 10px", maxHeight: 96, overflowY: "auto", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                            {uploadedCtx.summary || uploadedCtx.text.slice(0, 280)}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="d-none"
                    accept=".pdf,.docx,.xlsx,.csv,.md,.txt,.jpg,.jpeg,.png"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void handleUploadContext(f);
                      e.target.value = "";
                    }}
                  />
                  <div
                    role="button"
                    tabIndex={0}
                    aria-busy={uploading}
                    onClick={() => { if (!uploading) fileInputRef.current?.click(); }}
                    onKeyDown={(e) => { if (!uploading && (e.key === "Enter" || e.key === " ")) fileInputRef.current?.click(); }}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (uploading) return;
                      const f = e.dataTransfer.files?.[0];
                      if (f) void handleUploadContext(f);
                    }}
                    style={{
                      border: `1.5px dashed ${uploadingOcr ? D.aiBorder : D.border}`,
                      borderRadius: 10,
                      padding: "14px 12px",
                      textAlign: "center",
                      background: uploadingOcr ? D.aiLight : "#FAFAFA",
                      cursor: uploading ? "wait" : "pointer",
                      opacity: uploading && !uploadingOcr ? 0.7 : 1,
                    }}
                  >
                    {uploading ? (
                      <Loader2 size={16} color={D.ai} style={{ margin: "0 auto 5px", animation: "spin 0.8s linear infinite" }} />
                    ) : (
                      <Upload size={16} color={D.text4} style={{ margin: "0 auto 5px" }} />
                    )}
                    <div style={{ fontSize: 11, fontWeight: 600, color: uploading ? D.ai : D.text3 }}>
                      {uploadingOcr
                        ? "AI 正在萃取海報文字… (Extracting text…)"
                        : uploading
                        ? "正在解析…"
                        : "上傳比賽章程、背景資料或活動海報"}
                    </div>
                    <p className="small text-muted mb-0" style={{ fontSize: 10, color: D.text4, margin: "2px 0 0" }}>
                      支援 PDF, DOCX, XLSX, CSV, MD, TXT, JPG, PNG
                    </p>
                    <p className="small text-muted" style={{ fontSize: "0.7rem", color: D.text4, margin: "2px 0 0" }}>
                      單一檔案上限 10MB，試算表將自動轉換為文本解析
                    </p>
                  </div>
                </div>

              </div>

              {/* Sticky generate button */}
              <div style={{ position: "sticky", bottom: 0, zIndex: 10, padding: "14px 18px", background: D.surface, borderTop: `1px solid ${D.border}`, boxShadow: "0 -4px 16px rgba(15,23,42,0.06)" }}>
                <button onClick={handleGenerate} disabled={isGenerating || uploading} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 9, padding: "13px 20px", borderRadius: 12, border: "none", cursor: (isGenerating || uploading) ? "wait" : "pointer", fontSize: 14, fontWeight: 800, color: "#fff", fontFamily: F, background: isGenerating ? "linear-gradient(270deg, #4F46E5, #7C3AED, #6366F1, #4F46E5)" : "linear-gradient(135deg, #4F46E5 0%, #6366F1 50%, #7C3AED 100%)", backgroundSize: "400% 400%", animation: isGenerating ? "generatePulse 1.8s ease infinite" : "none", boxShadow: "0 4px 18px rgba(99,102,241,0.45)", transition: "opacity 0.15s", opacity: uploading ? 0.65 : 1 }}>
                  {isGenerating ? <><RefreshCw size={16} color="#fff" style={{ animation: "spin 0.8s linear infinite" }} /> AI 正在生成草稿…</> : uploadingOcr ? <><Loader2 size={16} color="#fff" style={{ animation: "spin 0.8s linear infinite" }} /> 等待 OCR…</> : <><Sparkles size={16} color="#fff" /> ✨ 生成草稿</>}
                </button>
              </div>
            </div>

            {/* Divider / sidebar resizer */}
            {!isMobile && (
              <div
                className="sidebar-resizer d-flex align-items-center justify-content-center bg-light border-end border-start"
                style={{
                  width: 12,
                  flexShrink: 0,
                  background: D.border,
                  cursor: "col-resize",
                  userSelect: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  isDragging.current = true;
                  document.body.style.cursor = "col-resize";
                  document.body.style.userSelect = "none";
                }}
              >
                <div style={{ width: 20, height: 36, display: "flex", alignItems: "center", justifyContent: "center", background: D.surface, borderRadius: 4, border: `1px solid ${D.border}`, pointerEvents: "none" }}>
                  <GripVertical size={12} color={D.text4} />
                </div>
              </div>
            )}

            {/* ── RIGHT PANEL ───────────────────────────────────────────── */}
            <div
              className="flex-grow-1"
              style={{
                flex: 1,
                minWidth: 0,
                display: isMobile && mobileTab !== "output" ? "none" : "flex",
                flexDirection: "column",
                background: D.bg,
                overflow: isMobile ? "visible" : "hidden",
              }}
            >

              {/* Editor top bar */}
              <div style={{ minHeight: 46, background: D.surface, borderBottom: `1px solid ${D.border}`, display: "flex", alignItems: "center", padding: isMobile ? "0 12px" : "0 16px", gap: 8, flexShrink: 0, flexWrap: "nowrap" }}>
                <div style={{ display: "flex", gap: 2, overflowX: "auto", maxWidth: isMobile ? 160 : 320 }}>
                  {versions.length === 0 && (
                    <span style={{ fontSize: 11, color: D.text4, padding: "5px 8px" }}>尚無版本</span>
                  )}
                  {versions.map((ver) => (
                    <button
                      key={ver.id || ver.version_num}
                      type="button"
                      onClick={() => { void selectVersion(ver); }}
                      style={{ display: "flex", alignItems: "center", gap: 5, padding: isMobile ? "5px 10px" : "5px 12px", borderRadius: 7, background: activeVersion === ver.version_num ? D.aiLight : "none", border: activeVersion === ver.version_num ? `1px solid ${D.aiBorder}` : "1px solid transparent", cursor: "pointer", fontSize: 11.5, fontWeight: 700, color: activeVersion === ver.version_num ? D.ai : D.text4, fontFamily: F, whiteSpace: "nowrap" as const }}
                    >
                      <History size={11} color={activeVersion === ver.version_num ? D.ai : D.text4} />
                      V{ver.version_num}{activeVersion === ver.version_num && " · 當前"}{activeVersion === ver.version_num && isDirty ? " *" : ""}
                    </button>
                  ))}
                </div>
                {!isMobile && <div style={{ width: 1, height: 20, background: D.border, margin: "0 4px" }} />}
                {!isMobile && [
                  { icon: <Bold size={13} />, cmd: "bold" },
                  { icon: <Italic size={13} />, cmd: "italic" },
                  { icon: <AlignLeft size={13} />, cmd: "justifyLeft" },
                ].map((btn) => (
                  <button
                    key={btn.cmd}
                    type="button"
                    onClick={() => { try { document.execCommand(btn.cmd); } catch { /* ignore */ } }}
                    style={{ width: 28, height: 28, borderRadius: 6, background: "none", border: "1px solid transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: D.text3, transition: "all 0.12s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = D.aiLight; e.currentTarget.style.borderColor = D.aiBorder; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.borderColor = "transparent"; }}
                  >{btn.icon}</button>
                ))}
                <div style={{ flex: 1 }} />
                {!isMobile && (
                  <button onClick={() => setShowToolbar(v => !v)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 7, background: showToolbar ? D.aiLight : "none", border: showToolbar ? `1px solid ${D.aiBorder}` : `1px solid ${D.border}`, cursor: "pointer", fontSize: 11, fontWeight: 600, color: showToolbar ? D.ai : D.text3, fontFamily: F, whiteSpace: "nowrap" as const }} title="選取 ≥4 字時顯示浮動工具列">
                    <Wand2 size={11} /> AI 浮動工具列{showToolbar ? " · 開" : " · 關"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard.writeText(editorContent || "")
                      .then(() => showToast("📋 已複製全文至剪貼板"))
                      .catch(() => showToast("無法複製"));
                  }}
                  style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 7, background: "none", border: `1px solid ${D.border}`, cursor: "pointer", fontSize: 11, fontWeight: 600, color: D.text3, fontFamily: F, whiteSpace: "nowrap" as const, flexShrink: 0 }}
                >
                  <Copy size={11} /> {isMobile ? "複製" : "複製全文"}
                </button>
              </div>

              {/* Document canvas */}
              <div style={{ flex: isMobile ? "none" : 1, overflowY: isMobile ? "visible" : "auto", padding: isMobile ? "16px 12px" : "36px 40px", display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
                {(isGenerating || docLoading) && (
                  <div style={{ position: "absolute", inset: 0, zIndex: 20, background: "rgba(248,250,252,0.90)", backdropFilter: "blur(4px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18 }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      {[0,1,2,3,4].map(i => (
                        <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: D.ai, opacity: 0.7 }} />
                      ))}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: D.text2 }}>
                      {docLoading ? "載入文件中…" : "AI 正在根據參數生成草稿…"}
                    </div>
                    {!docLoading && (
                      <div style={{ fontSize: 12, color: D.text4 }}>語氣: {tone} · 字數: ~{wordTarget} · 場景: {scenario.split(" ")[0]}</div>
                    )}
                  </div>
                )}

                <EditableDocumentPaper
                  content={editorContent}
                  contentKey={`${documentId || "new"}-${activeVersion}-${contentEpoch}`}
                  outputType={outputType}
                  outputIcon={outputMeta.icon}
                  outputZh={outputMeta.zh}
                  outputEn={outputMeta.en}
                  bannerMeta={`· 場景: ${scenario.split(" ")[0]} · 語氣: ${tone.split(" ")[0]} · V${activeVersion || "—"}`}
                  showBanner={generationDone || !!editorContent.trim()}
                  floatingEnabled={showToolbar}
                  rewritePartialUrl={rewritePartialUrl}
                  tone={tone}
                  documentId={documentId}
                  csrfName={csrfName}
                  csrfHash={csrfHash}
                  isMobile={isMobile}
                  onContentChange={(plain) => {
                    setEditorContent(plain);
                    if (!generationDone && plain.trim()) setGenerationDone(true);
                  }}
                  onToast={showToast}
                />

                {/* ── Generation History (this document versions) ───────── */}
                <div style={{ width: "100%", maxWidth: 720, marginTop: 24 }}>
                  <button
                    type="button"
                    onClick={() => setShowHistory(v => !v)}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", background: D.surface, border: `1px solid ${D.border}`, borderRadius: showHistory ? "12px 12px 0 0" : 12, cursor: "pointer", fontFamily: F, transition: "all 0.15s" }}
                  >
                    <History size={14} color={D.text3} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: D.text2, flex: 1, textAlign: "left" }}>🕘 生成紀錄</span>
                    <span style={{ fontSize: 10, color: D.text4, marginRight: 4 }}>Generation Record · {versions.length} 筆</span>
                    {showHistory ? <ChevronUp size={14} color={D.text4} /> : <ChevronDown size={14} color={D.text4} />}
                  </button>

                  {showHistory && (
                    <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderTop: "none", borderRadius: "0 0 12px 12px", overflow: "hidden" }}>
                      <div style={{ padding: "10px 16px", borderBottom: `1px solid ${D.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: "#FAFAFA" }}>
                        <span style={{ fontSize: 11, color: D.text4 }}>本文件版本時間軸 · 點擊切換</span>
                        <button type="button" onClick={handleExport} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: "linear-gradient(135deg, #4F46E5, #6366F1)", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#fff", fontFamily: F, boxShadow: "0 2px 8px rgba(99,102,241,0.35)" }}>
                          <Archive size={12} /> 匯出 Word / PDF
                        </button>
                      </div>
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: F, fontSize: 12 }}>
                          <thead>
                            <tr style={{ background: "#F8FAFC" }}>
                              {["版本", "類型", "字數", "時間", "操作"].map(h => (
                                <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 10.5, fontWeight: 700, color: D.text3, borderBottom: `1px solid ${D.border}`, whiteSpace: "nowrap" }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {versions.length === 0 && (
                              <tr>
                                <td colSpan={5} style={{ padding: "16px 12px", color: D.text4, textAlign: "center" }}>尚無版本紀錄</td>
                              </tr>
                            )}
                            {[...versions].slice().reverse().map((ver, ri, arr) => (
                              <tr
                                key={ver.id || ver.version_num}
                                style={{ borderBottom: ri < arr.length - 1 ? `1px solid ${D.border}` : "none", background: activeVersion === ver.version_num ? D.aiLight : "transparent", cursor: "pointer" }}
                                onClick={() => { void selectVersion(ver); }}
                              >
                                <td style={{ padding: "10px 12px" }}>
                                  <span style={{ fontSize: 10.5, fontWeight: 700, color: "#7C3AED", background: "#EDE9FE", padding: "2px 8px", borderRadius: 4 }}>
                                    V{ver.version_num}{activeVersion === ver.version_num ? " · 當前" : ""}
                                  </span>
                                </td>
                                <td style={{ padding: "10px 12px", color: D.text3, fontSize: 11.5 }}>
                                  {GEN_TYPE_LABEL[ver.generation_type] || ver.generation_type || "—"}
                                </td>
                                <td style={{ padding: "10px 12px", color: D.text3, fontSize: 11.5 }}>
                                  <Hash size={10} color={D.text4} style={{ display: "inline", marginRight: 3, verticalAlign: "middle" }} />
                                  {ver.word_count || countDocChars(ver.content || "")}
                                </td>
                                <td style={{ padding: "10px 12px", color: D.text4, fontSize: 11, whiteSpace: "nowrap" }}>
                                  <Calendar size={10} color={D.text4} style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }} />
                                  {ver.created_at ? ver.created_at.slice(5, 16).replace("T", " ") : "—"}
                                </td>
                                <td style={{ padding: "10px 12px" }}>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); void selectVersion(ver); }}
                                    style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", background: "#F1F5F9", border: `1px solid ${D.border}`, borderRadius: 6, cursor: "pointer", fontSize: 11, color: D.text2, fontFamily: F }}
                                  >
                                    開啟
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ height: 40 }} />
              </div>

              {/* Status footer */}
              {!isMobile && (
                <div style={{ height: 36, background: D.surface, borderTop: `1px solid ${D.border}`, display: "flex", alignItems: "center", padding: "0 18px", gap: 16, flexShrink: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: isDirty ? D.amber : D.emerald }} />
                    <span style={{ fontSize: 10.5, color: D.text4 }}>{isDirty ? "未儲存" : "已儲存"}</span>
                  </div>
                  <div style={{ width: 1, height: 14, background: D.border }} />
                  <span style={{ fontSize: 10.5, color: D.text3 }}>字數：<strong style={{ color: D.text2 }}>{docWordCount}</strong> 字</span>
                  <span style={{ fontSize: 10.5, color: D.text3 }}>版本：<strong style={{ color: D.ai }}>V{activeVersion || "—"}</strong></span>
                  <span style={{ fontSize: 10.5, color: D.text3 }}>語氣：<strong style={{ color: D.text2 }}>{tone.split(" ")[0]}</strong></span>
                  <span style={{ fontSize: 10.5, color: D.text3 }}>場景：<strong style={{ color: D.text2 }}>{scenario.split(" ")[0]}</strong></span>
                  <div style={{ flex: 1 }} />
                  <button type="button" onClick={() => { void handleGenerate(); }} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: `1px solid ${D.aiBorder}`, borderRadius: 6, padding: "3px 10px", fontSize: 10, fontWeight: 600, color: D.ai, cursor: "pointer", fontFamily: F }}>
                    <RotateCcw size={10} color={D.ai} /> 重新生成
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: AI DATA ASSISTANT
      ══════════════════════════════════════════════════════════════════════ */}
      {mainTab === "databot" && (
        <div style={{ flex: 1, display: "flex", overflow: "hidden", background: D.bg }}>

          {/* Left info panel */}
          {!isMobile && (
            <div style={{ width: 268, flexShrink: 0, background: D.surface, borderRight: `1px solid ${D.border}`, display: "flex", flexDirection: "column", overflowY: "auto" }}>
              <div style={{ padding: "16px 16px 12px", borderBottom: `1px solid ${D.border}`, background: "#FAFAFA" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
                  <Bot size={14} color={D.ai} />
                  <span style={{ fontSize: 12.5, fontWeight: 800, color: D.text1 }}>AI 數據助手</span>
                </div>
                <div style={{ fontSize: 10, color: D.text4 }}>Natural Language Data Query</div>
              </div>
              <div style={{ padding: "16px" }}>
                {/* Query examples */}
                <div style={{ fontSize: 10.5, fontWeight: 700, color: D.text3, marginBottom: 10 }}>💡 查詢範例 Example Queries</div>
                {[
                  { q: "列出數學成績 > 75 且有進步的學生", en: "Math score > 75 and improved" },
                  { q: "顯示今學期 T3 以上角色的學生", en: "T3+ roles this semester" },
                  { q: "統計各班參與活動次數並排序", en: "Activity count by class" },
                  { q: "找出出席率低於 85% 的學生", en: "Attendance < 85%" },
                ].map((ex, i) => (
                  <button key={i} onClick={() => setChatInput(ex.q)} style={{ width: "100%", textAlign: "left", padding: "9px 11px", marginBottom: 6, background: "#F8FAFC", border: `1px solid ${D.border}`, borderRadius: 8, cursor: "pointer", fontFamily: F, transition: "all 0.12s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = D.aiLight; e.currentTarget.style.borderColor = D.aiBorder; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "#F8FAFC"; e.currentTarget.style.borderColor = D.border; }}
                  >
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: D.text2, lineHeight: 1.4 }}>{ex.q}</div>
                    <div style={{ fontSize: 10, color: D.text4, marginTop: 2 }}>{ex.en}</div>
                  </button>
                ))}
                {/* Data sources */}
                <div style={{ marginTop: 16, padding: "12px", background: D.aiLight, border: `1px solid ${D.aiBorder}`, borderRadius: 9 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: D.ai, marginBottom: 8 }}>🔗 已連結數據源</div>
                  {["學生名冊 (M1)", "成績記錄 (M3)", "活動出席 (M4)", "ACORN 數據 (M3)", "考勤記錄"].map(src => (
                    <div key={src} style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: D.emerald, flexShrink: 0 }} />
                      <span style={{ fontSize: 10.5, color: D.text2 }}>{src}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Chat area */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

            {/* Chat disclaimer */}
            <div style={{ padding: "8px 16px", background: D.amberPale, borderBottom: `1px solid ${D.amberBd}`, display: "flex", alignItems: "center", gap: 7, flexShrink: 0 }}>
              <Info size={12} color={D.amber} />
              <span style={{ fontSize: 11, color: "#92400E" }}>AI 回應僅供參考，請在採取行動前覆核數據。不包含實時數據。</span>
            </div>

            {/* Messages list */}
            <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "16px 14px" : "24px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
              {messages.map(msg => (
                <div key={msg.id} className="chat-bubble-enter" style={{ display: "flex", gap: 10, flexDirection: msg.role === "user" ? "row-reverse" : "row", alignItems: "flex-start" }}>
                  {/* Avatar */}
                  <div style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: msg.role === "ai" ? "linear-gradient(135deg, #4F46E5, #7C3AED)" : "#1E293B", boxShadow: msg.role === "ai" ? "0 2px 8px rgba(99,102,241,0.35)" : "none" }}>
                    {msg.role === "ai" ? <Bot size={16} color="#fff" /> : <User size={16} color="#fff" />}
                  </div>
                  {/* Bubble */}
                  <div style={{ maxWidth: "78%", minWidth: 0 }}>
                    <div style={{ fontSize: 10, color: D.text4, marginBottom: 4, display: "flex", gap: 6, flexDirection: msg.role === "user" ? "row-reverse" : "row" }}>
                      <span style={{ fontWeight: 600 }}>{msg.role === "ai" ? "AI 數據助手" : "你"}</span>
                      {msg.timestamp && <span>{msg.timestamp}</span>}
                    </div>
                    <div style={{
                      padding: "12px 14px", borderRadius: msg.role === "user" ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
                      background: msg.role === "user" ? "#1E293B" : D.surface,
                      border: msg.role === "ai" ? `1px solid ${D.border}` : "none",
                      boxShadow: msg.role === "ai" ? D.shadow : "0 2px 8px rgba(15,23,42,0.15)",
                      fontSize: 13, lineHeight: 1.65, color: msg.role === "user" ? "#F8FAFC" : D.text1,
                      whiteSpace: "pre-wrap",
                    }}>
                      {msg.role === "ai" && (
                        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
                          <Sparkles size={11} color={D.ai} />
                          <span style={{ fontSize: 10, fontWeight: 700, color: D.ai }}>AI 回應</span>
                        </div>
                      )}
                      {msg.content}
                      {msg.tableData && (
                        <AiDataTable
                          rows={msg.tableData}
                          onExportExcel={() => showToast("📊 Excel 已匯出")}
                          onExportJson={() => showToast("📄 JSON 已下載")}
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Thinking indicator */}
              {isThinking && (
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #4F46E5, #7C3AED)", boxShadow: "0 2px 8px rgba(99,102,241,0.35)" }}>
                    <Bot size={16} color="#fff" />
                  </div>
                  <div style={{ padding: "12px 16px", background: D.surface, border: `1px solid ${D.border}`, borderRadius: "4px 16px 16px 16px", boxShadow: D.shadow, display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ fontSize: 11, color: D.text4, marginRight: 4 }}>AI 正在查詢數據</span>
                    {[1,2,3].map(i => (
                      <div key={i} className={`thinking-dot-${i}`} style={{ width: 7, height: 7, borderRadius: "50%", background: D.ai }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div style={{ padding: isMobile ? "12px" : "16px 24px", background: D.surface, borderTop: `1px solid ${D.border}`, flexShrink: 0 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-end", background: D.bg, border: `1.5px solid ${D.aiBorder}`, borderRadius: 14, padding: "10px 14px", boxShadow: `0 0 0 3px ${D.aiLight}`, transition: "box-shadow 0.15s" }}>
                <MessageSquare size={15} color={D.ai} style={{ flexShrink: 0, marginBottom: 2 }} />
                <textarea
                  ref={chatInputRef}
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendChat(); } }}
                  placeholder="用自然語言查詢學生數據，例如：列出所有數學成績 > 75 且有進步的學生…&#10;(Enter 發送，Shift+Enter 換行)"
                  rows={2}
                  style={{ flex: 1, resize: "none", border: "none", background: "transparent", outline: "none", fontFamily: F, fontSize: 13, color: D.text1, lineHeight: 1.6, minHeight: 42 }}
                />
                <button
                  onClick={handleSendChat}
                  disabled={!chatInput.trim() || isThinking}
                  style={{ width: 38, height: 38, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: chatInput.trim() && !isThinking ? "linear-gradient(135deg, #4F46E5, #6366F1)" : D.border, border: "none", cursor: chatInput.trim() && !isThinking ? "pointer" : "default", boxShadow: chatInput.trim() && !isThinking ? "0 2px 8px rgba(99,102,241,0.40)" : "none", transition: "all 0.15s" }}>
                  <Send size={16} color={chatInput.trim() && !isThinking ? "#fff" : D.text4} />
                </button>
              </div>
              <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
                <span style={{ fontSize: 10, color: D.text4 }}>AI 數據助手查詢範圍：學生名冊、成績、活動出席、ACORN 數據、考勤 · 不包含實時數據</span>
              </div>
            </div>
          </div>
        </div>
      )}
      </>)}

      {/* Standard Centered Bootstrap Dialog */}
      {showManageModal && (
        <>
          {/* Dark Backdrop */}
          <div
            className="modal-backdrop fade show"
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 1050,
              backgroundColor: "rgba(0, 0, 0, 0.55)",
            }}
          />

          {/* Modal Container */}
          <div
            className="modal fade show d-block"
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 1055,
              display: "block",
              overflowX: "hidden",
              overflowY: "auto",
              outline: 0,
            }}
            onClick={() => setShowManageModal(false)}
          >
            <div
              className="modal-dialog modal-dialog-centered modal-dialog-scrollable"
              role="document"
              style={{
                position: "relative",
                width: "100%",
                maxWidth: 480,
                margin: "1.75rem auto",
                pointerEvents: "none",
                display: "flex",
                alignItems: "center",
                minHeight: "calc(100% - 3.5rem)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="modal-content shadow-lg border-0"
                style={{
                  pointerEvents: "auto",
                  width: "100%",
                  background: D.surface,
                  borderRadius: 12,
                  border: "none",
                  boxShadow: "0 20px 50px rgba(15,23,42,0.28)",
                  overflow: "hidden",
                  fontFamily: F,
                  maxHeight: "min(80vh, 640px)",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  className="modal-header bg-light"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: "14px 18px",
                    background: "#F8FAFC",
                    borderBottom: `1px solid ${D.border}`,
                    flexShrink: 0,
                  }}
                >
                  <h6 className="modal-title fw-bold" style={{ margin: 0, fontSize: 14, fontWeight: 800, color: D.text1 }}>
                    管理輸出類型 (Manage Output Types)
                  </h6>
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Close"
                    onClick={() => setShowManageModal(false)}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "inline-flex", lineHeight: 1 }}
                  >
                    <X size={16} color={D.text4} />
                  </button>
                </div>

                <div
                  className="modal-body p-0"
                  style={{ padding: 0, overflowY: "auto", flex: 1, minHeight: 0 }}
                >
                  <ul
                    ref={outputModalListRef}
                    className="list-group list-group-flush"
                    style={{ listStyle: "none", margin: 0, padding: 0 }}
                  >
                    {outputTypes.map((type) => {
                      const selected = isOutputSelected(type);
                      return (
                        <li
                          key={type.id}
                          className="list-group-item d-flex justify-content-between align-items-center list-group-item-action cursor-pointer py-3"
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 10,
                            padding: "14px 18px",
                            borderBottom: `1px solid ${D.border}`,
                            background: selected ? D.aiLight : "transparent",
                            cursor: "pointer",
                          }}
                        >
                          <div
                            className="flex-grow-1"
                            style={{ flex: 1, minWidth: 0 }}
                            onClick={() => {
                              selectOutputOption(type);
                              setShowManageModal(false);
                            }}
                          >
                            <span className="me-3 fs-5" style={{ marginRight: 12, fontSize: 18 }}>{type.icon || "📄"}</span>
                            <span className="fw-medium" style={{ fontSize: 13.5, fontWeight: selected ? 700 : 500, color: selected ? D.ai : D.text1 }}>
                              {type.label_zh}
                            </span>
                            {selected && (
                              <span
                                className="badge bg-primary ms-2"
                                style={{
                                  marginLeft: 8,
                                  padding: "2px 8px",
                                  borderRadius: 999,
                                  background: D.ai,
                                  color: "#fff",
                                  fontSize: 10,
                                  fontWeight: 700,
                                  verticalAlign: "middle",
                                }}
                              >
                                目前選取
                              </span>
                            )}
                          </div>
                          {!type.is_default && type.id > 0 && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger border-0"
                              title="刪除此類型"
                              onClick={(e) => {
                                e.stopPropagation();
                                void handleDeleteMetadata(type.id, "output_type");
                              }}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                padding: 6,
                                display: "inline-flex",
                                color: "#DC2626",
                                flexShrink: 0,
                              }}
                            >
                              <Trash2 size={15} color="#DC2626" />
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div
                  className="modal-footer bg-light"
                  style={{
                    padding: "14px 16px",
                    background: "#F8FAFC",
                    borderTop: `1px solid ${D.border}`,
                    flexShrink: 0,
                  }}
                >
                  <div className="input-group" style={{ display: "flex", width: "100%", alignItems: "stretch" }}>
                    <span
                      className="input-group-text bg-white border-end-0"
                      style={{
                        padding: "8px 12px",
                        border: `1px solid ${D.border}`,
                        borderRight: "none",
                        borderRadius: "8px 0 0 8px",
                        background: "#fff",
                        fontSize: 14,
                        display: "inline-flex",
                        alignItems: "center",
                      }}
                    >
                      ➕
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0"
                      placeholder="新增自訂類型名稱..."
                      value={newOutputTypeInput}
                      onChange={(e) => setNewOutputTypeInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void handleAddNewMetadata("output_type", newOutputTypeInput, "📄");
                      }}
                      style={{
                        flex: 1,
                        minWidth: 0,
                        padding: "8px 12px",
                        border: `1px solid ${D.border}`,
                        borderLeft: "none",
                        borderRight: "none",
                        fontSize: 13,
                        fontFamily: F,
                        outline: "none",
                        background: "#fff",
                      }}
                    />
                    <button
                      type="button"
                      className="btn btn-primary px-4"
                      disabled={savingMeta || !newOutputTypeInput.trim()}
                      onClick={() => void handleAddNewMetadata("output_type", newOutputTypeInput, "📄")}
                      style={{
                        padding: "8px 18px",
                        border: "none",
                        borderRadius: "0 8px 8px 0",
                        background: D.ai,
                        color: "#fff",
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: savingMeta || !newOutputTypeInput.trim() ? "not-allowed" : "pointer",
                        fontFamily: F,
                        opacity: savingMeta || !newOutputTypeInput.trim() ? 0.55 : 1,
                        flexShrink: 0,
                      }}
                    >
                      新增
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Toast ──────────────────────────────────────────────────────────── */}
      {toastMsg && (
        <div style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", zIndex: 9999, animation: "toastSlide 0.28s cubic-bezier(0.34,1.56,0.64,1) forwards", pointerEvents: "none" }}>
          <div style={{ padding: "9px 20px", background: "#1E293B", borderRadius: 999, color: "#F8FAFC", fontSize: 12.5, fontWeight: 600, boxShadow: "0 8px 28px rgba(15,23,42,0.28)", border: "1px solid rgba(255,255,255,0.08)", whiteSpace: "nowrap" }}>{toastMsg}</div>
        </div>
      )}
    </div>
  );
};
