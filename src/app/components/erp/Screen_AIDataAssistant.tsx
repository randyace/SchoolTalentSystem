// ─────────────────────────────────────────────────────────────────────────────
// Screen_AIDataAssistant.tsx
// AI 數據助手 — AI Data Assistant
// ERP Module 1.F.AI  ·  System Admin > AI Tools
// Chat-room style interface for database queries, file uploads, and report gen.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useRef, useEffect, useCallback } from "react";
import { ERP } from "./erpTokens";
import {
  MessageSquare, Plus, Search, Send, Paperclip,
  Download, Database, BarChart2, FileSpreadsheet, Sparkles,
  Pin, Archive, Upload,
  CheckCircle2, Info,
  Table2, Bot, User as UserIcon, X, ChevronDown,
  Filter, RefreshCw, Cpu,
} from "lucide-react";
import {
  fetchSessions,
  fetchSessionDetail,
  createSession,
  sendPrompt,
  uploadChatContext,
  archiveSession,
  pinSession,
  importSessionPackage,
  exportDataHref,
  exportSessionHref,
  type AssistantSession,
  type AssistantMessage,
  type AssistantStructuredData,
} from "./aiDataAssistantApi";


// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:         "#F1F5F9",
  surface:    "#FFFFFF",
  border:     "#E2E8F0",
  borderMd:   "#CBD5E1",
  text1:      "#0F172A",
  text2:      "#334155",
  text3:      "#64748B",
  text4:      "#94A3B8",
  accent:     "#2563EB",
  accentPale: "#EFF6FF",
  accentBd:   "#BFDBFE",
  purple:     "#7C3AED",
  purplePale: "#F5F3FF",
  purpleBd:   "#C4B5FD",
  emerald:    "#059669",
  emeraldPale:"#ECFDF5",
  emeraldBd:  "#6EE7B7",
  amber:      "#D97706",
  amberPale:  "#FFFBEB",
  amberBd:    "#FDE68A",
  red:        "#DC2626",
  redPale:    "#FEF2F2",
  sidebarBg:  "#FFFFFF",
  sidebarHov: "#F8FAFC",
  shadow:     "0 1px 3px rgba(15,23,42,0.08)",
  shadowMd:   "0 4px 12px rgba(15,23,42,0.10)",
  shadowLg:   "0 8px 24px rgba(15,23,42,0.12)",
  radius:     "8px",
  radiusLg:   "12px",
  radiusXl:   "16px",
  font:       ERP.font.family,
  mono:       ERP.font.mono,
};

// ── Types ────────────────────────────────────────────────────────────────────
type SessionType = "data" | "export" | "filter" | "report";
type MessageRole = "user" | "ai" | "system";

interface ChatSession {
  id: number;
  title: string;
  preview: string;
  date: string;
  type: SessionType;
  msgCount: number;
  pinned?: boolean;
}

interface TableCol { key: string; label: string; align?: "left" | "center" | "right"; mono?: boolean }
interface TableData { cols: TableCol[]; rows: Record<string, string | number>[]; totalCount?: number }

interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  messageId?: number;
  tableData?: TableData;
  exportLabel?: string;
  suggestions?: string[];
  sourceInfo?: string;
  isThinking?: boolean;
}

export type ScreenAIDataAssistantProps = {
  sessionsUrl?: string;
  sendUrl?: string;
  uploadContextUrl?: string;
  exportDataUrl?: string;
  exportSessionUrl?: string;
  importSessionUrl?: string;
  modelName?: string;
  initialSessionId?: number | null;
  csrfName?: string;
  csrfHash?: string;
};

type PendingFile = { id: string; file: File };

const SUGGESTED_QUERIES = [
  "各班平均分對比",
  "A* 學生名單",
  "與上學年同期對比",
  "生成班主任報告",
];

const THINKING_STEPS = [
  "🧠 正在分析您的問題與查詢意圖...",
  "🔍 正在安全檢索 LALP 資料庫...",
  "📊 正在整理數據表格與生成分析建議...",
];

/** Client-side last-mile: never render SQL / think blocks in chat bubbles. */
export function sanitizeAssistantContent(text: string): string {
  let t = text || "";
  t = t.replace(/<think\b[^>]*>[\s\S]*?<\/think>/gi, "");
  t = t.replace(/\[SQL\s*used\][\s\S]*$/i, "");
  t = t.replace(/\[SQL\][\s\S]*$/i, "");
  t = t.replace(/```sql\b[\s\S]*?```/gi, "");
  t = t.replace(/\bWITH\s+\w+\s+AS\s*\([\s\S]*$/i, "");
  t = t.replace(/\bSELECT\s+[\s\S]*?\s+FROM\s+\w+[\s\S]*$/i, "");
  return t.replace(/\n{3,}/g, "\n\n").trim();
}

// ── Helpers ───────────────────────────────────────────────────────────────────
export function mapStructuredToTable(sd?: AssistantStructuredData | null): TableData | undefined {
  if (!sd) return undefined;
  let cols: TableCol[] = (sd.columns || []).map((c) => {
    if (typeof c === "string") return { key: c, label: c };
    return { key: c.key, label: c.label || c.key };
  });
  // Support legacy / alternate shapes: preview[] without columns, or string column keys.
  const sourceRows = (sd.rows && sd.rows.length > 0)
    ? sd.rows
    : (Array.isArray((sd as { preview?: Record<string, unknown>[] }).preview)
      ? (sd as { preview: Record<string, unknown>[] }).preview
      : []);
  if (cols.length === 0 && sourceRows.length > 0) {
    cols = Object.keys(sourceRows[0]).map((k) => ({ key: k, label: k }));
  }
  if (cols.length === 0) return undefined;
  const allRows = sourceRows.map((r) => {
    const out: Record<string, string | number> = {};
    for (const col of cols) {
      const v = r[col.key];
      out[col.key] = v == null ? "" : (v as string | number);
    }
    return out;
  });
  // Show the full returned set in-bubble (backend already caps at LIMIT 100).
  const previewN = Math.max(sd.preview_rows ?? allRows.length, allRows.length);
  const rows = allRows.slice(0, Math.min(previewN, 100));
  const totalCount = sd.total_count ?? allRows.length;
  return { cols, rows, totalCount };
}

function formatMsgTime(iso?: string | null): string {
  if (!iso) return new Date().toLocaleTimeString("zh-HK", { hour: "2-digit", minute: "2-digit" });
  try {
    return new Date(iso).toLocaleTimeString("zh-HK", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return String(iso).slice(0, 5);
  }
}

function formatSessionDate(s: AssistantSession): string {
  if (s.date) return s.date;
  if (s.updated_at) {
    try {
      return new Date(s.updated_at).toLocaleString("zh-HK", {
        month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
      });
    } catch {
      return s.updated_at;
    }
  }
  return "";
}

function mapApiSession(s: AssistantSession): ChatSession {
  return {
    id: Number(s.id),
    title: s.title || "新對話",
    preview: s.preview || s.summary || "",
    date: formatSessionDate(s),
    type: s.type || "data",
    msgCount: s.msgCount ?? s.msg_count ?? 0,
    pinned: !!(s.pinned ?? s.is_pinned),
  };
}

function mapApiMessage(m: AssistantMessage): ChatMessage {
  const roleRaw = (m.role || "").toLowerCase();
  const role: MessageRole =
    roleRaw === "user" ? "user" : roleRaw === "system" ? "system" : "ai";
  const tableData = mapStructuredToTable(m.structured_data);
  const total = tableData?.totalCount ?? m.structured_data?.total_count;
  const numericId = typeof m.id === "number" ? m.id : Number(m.id);
  const rawContent = m.content || "";
  const content = role === "ai" ? sanitizeAssistantContent(rawContent) : rawContent;
  return {
    id: String(m.id),
    messageId: Number.isFinite(numericId) ? numericId : undefined,
    role,
    content,
    timestamp: formatMsgTime(m.created_at),
    tableData,
    suggestions: m.suggested_actions?.length ? m.suggested_actions : undefined,
    exportLabel: tableData && tableData.rows.length > 0
      ? `📗 匯出完整名單為 Excel (${total ?? tableData.rows.length} 人)`
      : undefined,
  };
}

// ── Sub-component: Data Table ─────────────────────────────────────────────────
const AiResultTable: React.FC<{ data: TableData }> = ({ data }) => {
  const GRADE_STYLE: Record<string, { color: string; bg: string }> = {
    "A*": { color: "#7C3AED", bg: "#F5F3FF" },
    "A":  { color: "#059669", bg: "#ECFDF5" },
    "B+": { color: "#2563EB", bg: "#EFF6FF" },
    "B":  { color: "#2563EB", bg: "#EFF6FF" },
    "C":  { color: "#D97706", bg: "#FFFBEB" },
    "D":  { color: "#EA580C", bg: "#FFF7ED" },
    "F":  { color: "#DC2626", bg: "#FEF2F2" },
  };
  const CLASS_COLOR: Record<string, { color: string; bg: string }> = {
    F3A: { color: "#9A3412", bg: "#FFEDD5" },
    F3B: { color: "#92400E", bg: "#FEF3C7" },
    F3C: { color: "#1D4ED8", bg: "#DBEAFE" },
  };

  return (
    <div style={{ marginTop: 12, borderRadius: T.radiusLg, border: `1px solid ${T.border}`, overflow: "hidden" }}>
      {/* Table header bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 14px",
        background: "linear-gradient(135deg, #F8FAFC, #F1F5F9)",
        borderBottom: `1px solid ${T.border}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Table2 size={13} color={T.accent} />
          <span style={{ fontSize: 11, fontWeight: 700, color: T.text2, fontFamily: T.font }}>
            查詢結果預覽
          </span>
          {data.totalCount != null && (
            <span style={{ fontSize: 10, color: T.text4, fontFamily: T.mono }}>
              (顯示 {data.rows.length} / 共 {data.totalCount} 行)
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", border: `1px solid ${T.border}`, borderRadius: 5, background: T.surface, color: T.text3, fontSize: 10, cursor: "pointer", fontFamily: T.font }}>
            <Filter size={9} /> 篩選
          </button>
          <button style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", border: `1px solid ${T.border}`, borderRadius: 5, background: T.surface, color: T.text3, fontSize: 10, cursor: "pointer", fontFamily: T.font }}>
            <RefreshCw size={9} /> 重整
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: T.font }}>
          <thead>
            <tr style={{ background: "#F8FAFC", borderBottom: `1px solid ${T.border}` }}>
              {data.cols.map(col => (
                <th key={col.key} style={{
                  padding: "7px 12px", textAlign: (col.align ?? "left") as React.CSSProperties["textAlign"],
                  fontSize: 10, fontWeight: 700, color: T.text3,
                  letterSpacing: "0.03em", whiteSpace: "nowrap",
                  fontFamily: T.font,
                }}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.surface : "#FAFBFC" }}>
                {data.cols.map(col => {
                  const val = row[col.key];
                  const isGrade = col.key === "grade" && typeof val === "string";
                  const isClass = col.key === "class" && typeof val === "string";
                  const isContact = col.key === "contact";
                  const isTotal = col.key === "total" && typeof val === "string" && (val as string).includes("/");
                  const totalNum = isTotal ? parseInt((val as string).split("/")[0]) : 0;

                  return (
                    <td key={col.key} style={{
                      padding: "8px 12px",
                      textAlign: (col.align ?? "left") as React.CSSProperties["textAlign"],
                      fontFamily: col.mono ? T.mono : T.font,
                      fontSize: 12, color: T.text2,
                      whiteSpace: "nowrap",
                    }}>
                      {isGrade && (
                        <span style={{
                          display: "inline-block", padding: "1px 7px",
                          borderRadius: 4, fontWeight: 800, fontSize: 11,
                          color: (GRADE_STYLE[val as string] ?? { color: T.text3 }).color,
                          background: (GRADE_STYLE[val as string] ?? { bg: T.bg }).bg,
                        }}>
                          {val}
                        </span>
                      )}
                      {isClass && (
                        <span style={{
                          padding: "1px 7px", borderRadius: 4, fontSize: 11, fontWeight: 700,
                          color: (CLASS_COLOR[val as string] ?? { color: T.text3 }).color,
                          background: (CLASS_COLOR[val as string] ?? { bg: T.bg }).bg,
                        }}>
                          {val}
                        </span>
                      )}
                      {isTotal && (
                        <span style={{ fontWeight: 700, color: totalNum < 120 ? T.red : totalNum >= 160 ? T.emerald : T.text2 }}>
                          {val}
                        </span>
                      )}
                      {isContact && (
                        <span style={{ color: T.text3, letterSpacing: "0.04em" }}>{val}</span>
                      )}
                      {!isGrade && !isClass && !isTotal && !isContact && (
                        <span>{val}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer hint */}
      {data.totalCount != null && data.rows.length < data.totalCount && (
        <div style={{ padding: "6px 14px", background: "#F8FAFC", borderTop: `1px solid ${T.border}`, fontSize: 10, color: T.text4, fontFamily: T.font }}>
          另有 {data.totalCount - data.rows.length} 行未顯示 · 請匯出完整資料
        </div>
      )}
    </div>
  );
};

// ── Sub-component: Export Button ──────────────────────────────────────────────
const ExportButton: React.FC<{
  label: string;
  messageId?: number;
  exportDataUrl: string;
}> = ({ label, messageId, exportDataUrl }) => {
  const [clicked, setClicked] = useState(false);
  const canExport = messageId != null;

  const openFormat = (format: string) => {
    if (!canExport) return;
    setClicked(true);
    window.open(exportDataHref(exportDataUrl, messageId!, format), "_blank");
    setTimeout(() => setClicked(false), 2200);
  };

  return (
    <div style={{ marginTop: 12 }}>
      <button
        onClick={() => openFormat("xlsx")}
        disabled={!canExport}
        style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "9px 18px",
          background: clicked
            ? "linear-gradient(135deg, #047857, #059669)"
            : "linear-gradient(135deg, #059669, #10B981)",
          border: "none", borderRadius: T.radiusLg,
          color: "#fff", fontFamily: T.font, fontSize: 13, fontWeight: 700,
          cursor: canExport ? "pointer" : "default",
          opacity: canExport ? 1 : 0.6,
          boxShadow: "0 2px 8px rgba(5,150,105,0.3)",
          transition: "all 0.2s",
        }}
      >
        {clicked
          ? <><CheckCircle2 size={15} /> 正在生成… Generating</>
          : <><FileSpreadsheet size={15} /> {label}</>
        }
      </button>
      {canExport && (
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <a
            href={exportDataHref(exportDataUrl, messageId!, "pdf")}
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: 11, color: T.accent, fontFamily: T.font, textDecoration: "none", fontWeight: 600 }}
          >
            PDF
          </a>
          <a
            href={exportDataHref(exportDataUrl, messageId!, "docx")}
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: 11, color: T.accent, fontFamily: T.font, textDecoration: "none", fontWeight: 600 }}
          >
            Word
          </a>
        </div>
      )}
    </div>
  );
};

// ── Sub-component: Suggestion Chips ──────────────────────────────────────────
const SuggestionChips: React.FC<{ items: string[]; onSelect: (s: string) => void }> = ({ items, onSelect }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
    <span style={{ fontSize: 10, color: T.text4, fontFamily: T.font, alignSelf: "center", marginRight: 2 }}>後續操作：</span>
    {items.map(s => (
      <button
        key={s}
        onClick={() => onSelect(s)}
        style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          padding: "5px 11px",
          border: `1px solid ${T.accentBd}`,
          borderRadius: 999,
          background: T.accentPale,
          color: T.accent,
          fontSize: 11.5, fontWeight: 600, fontFamily: T.font,
          cursor: "pointer", transition: "all 0.1s",
        }}
      >
        <Sparkles size={10} />
        {s}
      </button>
    ))}
  </div>
);

// ── Sub-component: Session type icon ─────────────────────────────────────────
const SessionIcon: React.FC<{ type: SessionType }> = ({ type }) => {
  const map: Record<SessionType, { icon: React.ReactNode; bg: string; color: string }> = {
    data:   { icon: <Database size={11} />,      bg: "#EFF6FF",  color: T.accent },
    export: { icon: <FileSpreadsheet size={11} />, bg: "#ECFDF5", color: T.emerald },
    filter: { icon: <Filter size={11} />,         bg: "#F5F3FF",  color: T.purple },
    report: { icon: <BarChart2 size={11} />,       bg: "#FFFBEB",  color: T.amber },
  };
  const m = map[type];
  return (
    <div style={{ width: 26, height: 26, borderRadius: 7, flexShrink: 0, background: m.bg, display: "flex", alignItems: "center", justifyContent: "center", color: m.color }}>
      {m.icon}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
export const Screen_AIDataAssistant: React.FC<ScreenAIDataAssistantProps> = (props) => {
  const {
    sessionsUrl = "/ai-assistant/sessions",
    sendUrl = "/ai-assistant/send",
    uploadContextUrl = "/ai-assistant/api/upload-context",
    exportDataUrl = "/ai-assistant/export-data",
    exportSessionUrl = "/ai-assistant/export-session",
    importSessionUrl = "/ai-assistant/import-session",
    modelName,
    initialSessionId = null,
    csrfName,
    csrfHash,
  } = props;

  const F = T.font;

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 820);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [sessions, setSessions]             = useState<ChatSession[]>([]);
  const [messages, setMessages]             = useState<ChatMessage[]>([]);
  const [input, setInput]                   = useState("");
  const [isThinking, setIsThinking]         = useState(false);
  const [showSidebar, setShowSidebar]       = useState(true);
  const [sidebarSearch, setSidebarSearch]   = useState("");
  const [hovSession, setHovSession]         = useState<number | null>(null);
  const [pendingFiles, setPendingFiles]     = useState<PendingFile[]>([]);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [loadError, setLoadError]           = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef    = useRef<HTMLTextAreaElement>(null);
  const fileInputRef   = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const mountedRef     = useRef(true);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  const refreshSessions = useCallback(async () => {
    const list = await fetchSessions(sessionsUrl);
    if (!mountedRef.current) return;
    setSessions(list.map(mapApiSession));
  }, [sessionsUrl]);

  const loadSession = useCallback(async (id: number) => {
    const detail = await fetchSessionDetail(sessionsUrl, id);
    if (!mountedRef.current) return;
    setActiveSessionId(Number(detail.session.id));
    setMessages((detail.messages || []).map(mapApiMessage));
    setSessions((prev) => {
      const mapped = mapApiSession(detail.session);
      const exists = prev.some((s) => s.id === mapped.id);
      return exists ? prev.map((s) => (s.id === mapped.id ? { ...s, ...mapped } : s)) : [mapped, ...prev];
    });
  }, [sessionsUrl]);

  useEffect(() => {
    mountedRef.current = true;
    (async () => {
      try {
        await refreshSessions();
        if (initialSessionId) {
          await loadSession(initialSessionId);
        } else {
          setActiveSessionId(null);
          setMessages([]);
        }
      } catch (e: any) {
        if (mountedRef.current) setLoadError(e?.message || "無法載入對話");
      }
    })();
    return () => { mountedRef.current = false; };
  }, [refreshSessions, loadSession, initialSessionId]);

  const removePendingFile = (id: string) => {
    setPendingFiles((prev) => prev.filter((p) => p.id !== id));
  };

  const addPendingFiles = (list: FileList | File[] | null) => {
    if (!list) return;
    const arr = Array.from(list);
    const allowed = /\.(jpe?g|png|pdf|xlsx|csv|txt|md)$/i;
    const next: PendingFile[] = [];
    for (const f of arr) {
      if (!allowed.test(f.name)) {
        setLoadError(`不支援的檔案類型：${f.name}`);
        continue;
      }
      if (f.size > 10 * 1024 * 1024) {
        setLoadError(`檔案過大（上限 10MB）：${f.name}`);
        continue;
      }
      next.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, file: f });
    }
    if (next.length) {
      setPendingFiles((prev) => [...prev, ...next].slice(0, 8));
      setLoadError(null);
    }
  };

  const handleSend = async (text?: string) => {
    const msg = (text ?? input).trim();
    const filesToSend = pendingFiles.map((p) => p.file);
    if ((!msg && filesToSend.length === 0) || isThinking) return;

    const displayMsg = msg || (filesToSend.length
      ? `（已附加 ${filesToSend.length} 個檔案）請分析附件內容`
      : "");
    setInput("");
    const attachedSnapshot = [...pendingFiles];
    setPendingFiles([]);
    setLoadError(null);

    const optimistic: ChatMessage = {
      id: `local-u-${Date.now()}`,
      role: "user",
      content: attachedSnapshot.length
        ? `${displayMsg}\n📎 ${attachedSnapshot.map((p) => p.file.name).join(", ")}`
        : displayMsg,
      timestamp: formatMsgTime(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setIsThinking(true);

    try {
      // 1) Pre-process attachments on CI4 (ViT-safe images / extracted text)
      let attachments: Awaited<ReturnType<typeof uploadChatContext>> | null = null;
      if (filesToSend.length > 0) {
        attachments = await uploadChatContext(uploadContextUrl, filesToSend, csrfName, csrfHash);
      }

      // 2) Send multimodal chat turn
      const res = await sendPrompt(
        sendUrl,
        displayMsg,
        activeSessionId,
        csrfName,
        csrfHash,
        attachments,
      );
      if (!mountedRef.current) return;
      const sid = Number(res.session.id);
      setActiveSessionId(sid);
      setMessages((prev) => {
        const withoutOptimistic = prev.filter((m) => m.id !== optimistic.id);
        return [
          ...withoutOptimistic,
          mapApiMessage(res.user_message),
          mapApiMessage(res.assistant_message),
        ];
      });
      await refreshSessions();
    } catch (e: any) {
      if (!mountedRef.current) return;
      // Restore chips so user can retry
      setPendingFiles(attachedSnapshot);
      setLoadError(e?.message || "發送失敗");
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "ai",
          content: `⚠️ ${e?.message || "發送失敗，請稍後再試。"}`,
          timestamp: formatMsgTime(),
        },
      ]);
    } finally {
      if (mountedRef.current) setIsThinking(false);
    }
  };

  const handleNewSession = async () => {
    try {
      const s = await createSession(sessionsUrl, csrfName, csrfHash);
      if (!mountedRef.current) return;
      const mapped = mapApiSession(s);
      setSessions((prev) => [mapped, ...prev.filter((x) => x.id !== mapped.id)]);
      setActiveSessionId(mapped.id);
      setMessages([]);
      setLoadError(null);
    } catch (e: any) {
      setLoadError(e?.message || "無法建立對話");
    }
  };

  const handleSelectSession = async (id: number) => {
    try {
      await loadSession(id);
      setLoadError(null);
      if (isMobile) setShowSidebar(false);
    } catch (e: any) {
      setLoadError(e?.message || "無法載入對話");
    }
  };

  const handleArchive = async () => {
    if (activeSessionId == null) return;
    try {
      await archiveSession(sessionsUrl, activeSessionId, csrfName, csrfHash);
      if (!mountedRef.current) return;
      setSessions((prev) => prev.filter((s) => s.id !== activeSessionId));
      setActiveSessionId(null);
      setMessages([]);
      setShowExportMenu(false);
    } catch (e: any) {
      setLoadError(e?.message || "封存失敗");
    }
  };

  const handleImportFile = async (file: File) => {
    try {
      const res = await importSessionPackage(importSessionUrl, file, csrfName, csrfHash);
      if (!mountedRef.current) return;
      const mapped = mapApiSession(res.session);
      setSessions((prev) => [mapped, ...prev.filter((s) => s.id !== mapped.id)]);
      setActiveSessionId(mapped.id);
      setMessages((res.messages || []).map(mapApiMessage));
      setLoadError(null);
    } catch (e: any) {
      setLoadError(e?.message || "匯入失敗");
    }
  };

  const handleTogglePin = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const isPinned = await pinSession(sessionsUrl, id, csrfName, csrfHash);
      if (!mountedRef.current) return;
      setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, pinned: isPinned } : s)));
    } catch (err: any) {
      setLoadError(err?.message || "置頂失敗");
    }
  };

  const filteredSessions = sessions.filter(s =>
    s.title.includes(sidebarSearch) || s.preview.includes(sidebarSearch)
  );

  const pinnedSessions   = filteredSessions.filter(s => s.pinned);
  const recentSessions   = filteredSessions.filter(s => !s.pinned);
  const activeSessionObj = sessions.find(s => s.id === activeSessionId);

  return (
    <div style={{
      display: "flex", height: "100%", overflow: "hidden",
      background: T.bg, fontFamily: F,
    }}>

      {/* ═══════════════════════════════════════════════════════════════════════
          LEFT PANEL — Chat Session History
      ═══════════════════════════════════════════════════════════════════════ */}
      {(!isMobile || showSidebar) && (
        <div style={{
          width: isMobile ? "100%" : 260,
          background: T.sidebarBg,
          borderRight: `1px solid ${T.border}`,
          display: "flex", flexDirection: "column",
          flexShrink: 0, overflow: "hidden",
          boxShadow: isMobile ? T.shadowLg : "none",
          position: isMobile ? "absolute" : "relative",
          top: 0, left: 0, bottom: 0, zIndex: isMobile ? 100 : 0,
        }}>

          {/* Sidebar header */}
          <div style={{
            padding: "14px 14px 10px",
            borderBottom: `1px solid ${T.border}`,
            flexShrink: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: "linear-gradient(135deg, #2563EB, #7C3AED)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Cpu size={14} color="#fff" />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: T.text1 }}>AI 數據助手</div>
                  <div style={{ fontSize: 9, color: T.text4 }}>Data Assistant</div>
                </div>
              </div>
              {isMobile && (
                <button onClick={() => setShowSidebar(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                  <X size={16} color={T.text3} />
                </button>
              )}
            </div>

            {/* New chat + Import */}
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={handleNewSession}
                style={{
                  flex: 1, display: "flex", alignItems: "center", gap: 8,
                  padding: "8px 12px",
                  background: "linear-gradient(135deg, #2563EB, #7C3AED)",
                  border: "none", borderRadius: T.radiusLg,
                  color: "#fff", fontSize: 12.5, fontWeight: 700,
                  cursor: "pointer", fontFamily: F,
                  boxShadow: "0 2px 8px rgba(37,99,235,0.25)",
                }}
              >
                <Plus size={14} />
                新建對話 New Chat
              </button>
              <button
                onClick={() => importInputRef.current?.click()}
                title="匯入對話封包"
                style={{
                  flexShrink: 0, width: 36, height: 36,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: T.surface, border: `1px solid ${T.border}`,
                  borderRadius: T.radiusLg, cursor: "pointer", color: T.text3,
                }}
              >
                <Upload size={14} />
              </button>
              <input
                ref={importInputRef}
                type="file"
                accept=".sts-chat,.json,application/json"
                style={{ display: "none" }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (f) void handleImportFile(f);
                }}
              />
            </div>
          </div>

          {/* Search */}
          <div style={{ padding: "8px 12px", flexShrink: 0 }}>
            <div style={{ position: "relative" }}>
              <Search size={12} color={T.text4} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              <input
                value={sidebarSearch}
                onChange={e => setSidebarSearch(e.target.value)}
                placeholder="搜尋對話記錄…"
                style={{
                  width: "100%", boxSizing: "border-box",
                  paddingLeft: 30, paddingRight: 10, paddingTop: 6, paddingBottom: 6,
                  border: `1px solid ${T.border}`, borderRadius: 7,
                  fontSize: 11.5, fontFamily: F, color: T.text2,
                  background: T.bg, outline: "none",
                }}
              />
            </div>
          </div>

          {/* Session list */}
          <div style={{ flex: 1, overflowY: "auto" }}>

            {pinnedSessions.length > 0 && (
              <div>
                <div style={{ padding: "6px 14px 3px", fontSize: 9, fontWeight: 800, color: T.text4, letterSpacing: "0.07em", textTransform: "uppercase" }}>
                  📌 已置頂
                </div>
                {pinnedSessions.map(s => (
                  <SessionRow
                    key={s.id} session={s}
                    active={activeSessionId === s.id}
                    hovered={hovSession === s.id}
                    onHover={setHovSession}
                    onClick={() => { void handleSelectSession(s.id); }}
                    onTogglePin={(ev) => { void handleTogglePin(s.id, ev); }}
                  />
                ))}
              </div>
            )}

            <div>
              <div style={{ padding: "6px 14px 3px", fontSize: 9, fontWeight: 800, color: T.text4, letterSpacing: "0.07em", textTransform: "uppercase" }}>
                🕓 最近對話
              </div>
              {recentSessions.map(s => (
                <SessionRow
                  key={s.id} session={s}
                  active={activeSessionId === s.id}
                  hovered={hovSession === s.id}
                  onHover={setHovSession}
                  onClick={() => { void handleSelectSession(s.id); }}
                  onTogglePin={(ev) => { void handleTogglePin(s.id, ev); }}
                />
              ))}
            </div>
          </div>

          {/* Sidebar footer */}
          <div style={{
            padding: "10px 14px", borderTop: `1px solid ${T.border}`,
            flexShrink: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 8px", borderRadius: 8, background: T.accentPale, border: `1px solid ${T.accentBd}` }}>
              <Database size={11} color={T.accent} />
              <div style={{ fontSize: 10, color: T.accent, fontWeight: 600 }}>
                已連接 LALP 資料庫
              </div>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.emerald, marginLeft: "auto", flexShrink: 0 }} />
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MAIN CHAT AREA
      ═══════════════════════════════════════════════════════════════════════ */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

        {/* Chat header */}
        <div style={{
          background: T.surface,
          borderBottom: `1px solid ${T.border}`,
          padding: "0 20px",
          height: 56, display: "flex", alignItems: "center", gap: 12,
          flexShrink: 0,
        }}>
          {isMobile && (
            <button onClick={() => setShowSidebar(true)} style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 7, padding: "5px 8px", cursor: "pointer" }}>
              <MessageSquare size={14} color={T.text3} />
            </button>
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.text1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {activeSessionObj?.title ?? "新對話"}
            </div>
            <div style={{ fontSize: 10, color: T.text4 }}>
              {activeSessionObj ? `${activeSessionObj.msgCount} 則訊息 · ${activeSessionObj.date}` : "開始新的數據查詢"}
            </div>
          </div>

          {/* Header actions */}
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <div style={{ position: "relative" }}>
              <button
                title="匯出對話"
                onClick={() => setShowExportMenu((v) => !v)}
                disabled={activeSessionId == null}
                style={{
                  display: "flex", alignItems: "center", gap: 4, padding: "5px 10px",
                  border: `1px solid ${T.border}`, borderRadius: 7, background: "transparent",
                  color: T.text3, fontSize: 11, cursor: activeSessionId == null ? "default" : "pointer",
                  fontFamily: F, opacity: activeSessionId == null ? 0.5 : 1,
                }}
              >
                <Download size={13} />
                {!isMobile && <span>匯出對話</span>}
                <ChevronDown size={12} />
              </button>
              {showExportMenu && activeSessionId != null && (
                <div style={{
                  position: "absolute", right: 0, top: "calc(100% + 4px)", zIndex: 50,
                  minWidth: 240, background: T.surface, border: `1px solid ${T.border}`,
                  borderRadius: 8, boxShadow: T.shadowMd, overflow: "hidden",
                }}>
                  <a
                    href={exportSessionHref(exportSessionUrl, activeSessionId, "package")}
                    style={{
                      display: "block", padding: "10px 12px", fontSize: 12, color: T.text2,
                      textDecoration: "none", fontFamily: F, borderBottom: `1px solid ${T.border}`,
                    }}
                    onClick={() => setShowExportMenu(false)}
                  >
                    匯出可繼承對話封包 (.sts-chat)
                  </a>
                  <a
                    href={exportSessionHref(exportSessionUrl, activeSessionId, "report")}
                    style={{
                      display: "block", padding: "10px 12px", fontSize: 12, color: T.text2,
                      textDecoration: "none", fontFamily: F,
                    }}
                    onClick={() => setShowExportMenu(false)}
                  >
                    匯出可讀報告 (.html)
                  </a>
                </div>
              )}
            </div>

            <button
              title="封存"
              onClick={() => { void handleArchive(); }}
              disabled={activeSessionId == null}
              style={{
                display: "flex", alignItems: "center", gap: 4, padding: "5px 10px",
                border: `1px solid ${T.border}`, borderRadius: 7, background: "transparent",
                color: T.text3, fontSize: 11, cursor: activeSessionId == null ? "default" : "pointer",
                fontFamily: F, opacity: activeSessionId == null ? 0.5 : 1,
              }}
            >
              <Archive size={13} />
              {!isMobile && <span>封存</span>}
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 7, background: T.emeraldPale, border: `1px solid ${T.emeraldBd}` }}>
              <Cpu size={11} color={T.emerald} />
              <span style={{ fontSize: 10, fontWeight: 700, color: T.emerald }}>{modelName || "GB10"}</span>
            </div>
          </div>
        </div>

        {/* Messages area */}
        <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "16px 12px" : "24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>

          {loadError && (
            <div style={{
              padding: "8px 12px", borderRadius: 8, background: T.redPale,
              border: `1px solid ${T.red}`, color: T.red, fontSize: 12, fontFamily: F,
            }}>
              {loadError}
            </div>
          )}

          {messages.length === 0 && !isThinking && (
            <EmptyState onSuggest={(q) => { void handleSend(q); }} />
          )}

          {messages.map(msg => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              exportDataUrl={exportDataUrl}
              onSuggest={(q) => { void handleSend(q); }}
            />
          ))}

          {isThinking && <ThinkingBubble />}

          <div ref={messagesEndRef} />
        </div>

        {/* ── Input Zone ──────────────────────────────────────────────────────── */}
        <div style={{
          background: T.surface,
          borderTop: `1px solid ${T.border}`,
          padding: isMobile ? "10px 12px 14px" : "12px 20px 16px",
          flexShrink: 0,
        }}>

          {/* Suggested quick queries */}
          {messages.length === 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
              {SUGGESTED_QUERIES.map(q => (
                <button
                  key={q}
                  onClick={() => { void handleSend(q); }}
                  disabled={isThinking}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    padding: "5px 11px",
                    border: `1px solid ${T.border}`,
                    borderRadius: 999, background: T.bg,
                    color: T.text3, fontSize: 11, cursor: isThinking ? "default" : "pointer", fontFamily: F,
                  }}
                >
                  <Sparkles size={9} color={T.accent} />
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Attachment preview chips */}
          {pendingFiles.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
              {pendingFiles.map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    maxWidth: "100%", padding: "5px 8px 5px 10px",
                    background: T.accentPale, border: `1px solid ${T.accentBd}`, borderRadius: 999,
                  }}
                >
                  <FileSpreadsheet size={12} color={T.accent} style={{ flexShrink: 0 }} />
                  <span style={{
                    fontSize: 11.5, fontWeight: 600, color: T.accent,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180,
                  }}>
                    {p.file.name}
                  </span>
                  <button
                    type="button"
                    title="移除"
                    onClick={() => removePendingFile(p.id)}
                    disabled={isThinking}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: 18, height: 18, borderRadius: 999,
                      background: "rgba(37,99,235,0.12)", border: "none",
                      cursor: isThinking ? "default" : "pointer", padding: 0, flexShrink: 0,
                    }}
                  >
                    <X size={11} color={T.accent} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Input row */}
          <div style={{
            display: "flex", gap: 8, alignItems: "flex-end",
            padding: "10px 12px",
            background: T.bg,
            border: `1.5px solid ${T.border}`,
            borderRadius: T.radiusXl,
            transition: "border-color 0.15s",
          }}
          >
            {/* Paperclip */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="上傳附件（PDF / 圖像 / Excel / CSV / TXT）"
              disabled={isThinking}
              style={{
                flexShrink: 0, width: 34, height: 34,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: pendingFiles.length ? T.accentPale : "transparent",
                border: `1px solid ${pendingFiles.length ? T.accentBd : T.border}`,
                borderRadius: 8, cursor: isThinking ? "default" : "pointer",
                color: pendingFiles.length ? T.accent : T.text3,
                transition: "all 0.12s",
              }}
            >
              <Paperclip size={15} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".xlsx,.csv,.pdf,.jpg,.jpeg,.png,.txt,.md,image/jpeg,image/png,application/pdf"
              style={{ display: "none" }}
              onChange={(e) => {
                addPendingFiles(e.target.files);
                e.target.value = "";
              }}
            />

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void handleSend();
                }
              }}
              placeholder="向 AI 數據助手發送指令，例如：「列出 F3A 最近一次測驗低於 50 分的學生」…"
              rows={2}
              disabled={isThinking}
              style={{
                flex: 1, resize: "none", border: "none", outline: "none",
                background: "transparent", fontSize: 13, fontFamily: F,
                color: T.text1, lineHeight: 1.6,
                padding: "2px 0",
              }}
            />

            {/* Send button */}
            <button
              type="button"
              onClick={() => { void handleSend(); }}
              disabled={isThinking || (!input.trim() && pendingFiles.length === 0)}
              style={{
                flexShrink: 0, width: 36, height: 36,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: !isThinking && (input.trim() || pendingFiles.length > 0)
                  ? "linear-gradient(135deg, #2563EB, #7C3AED)"
                  : "#E2E8F0",
                border: "none", borderRadius: 10,
                cursor: !isThinking && (input.trim() || pendingFiles.length > 0) ? "pointer" : "default",
                color: "#fff", transition: "all 0.15s",
                boxShadow: input.trim() && !isThinking ? "0 2px 8px rgba(37,99,235,0.28)" : "none",
              }}
            >
              <Send size={15} style={{ transform: "translateX(1px)" }} />
            </button>
          </div>

          <div style={{ marginTop: 6, fontSize: 10, color: T.text4, textAlign: "center" }}>
            按 Enter 發送 · Shift+Enter 換行 · 支援上傳 Excel / CSV / PDF 附件
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Session Row ───────────────────────────────────────────────────────────────
const SessionRow: React.FC<{
  session: ChatSession;
  active: boolean;
  hovered: boolean;
  onHover: (id: number | null) => void;
  onClick: () => void;
  onTogglePin?: (e: React.MouseEvent) => void;
}> = ({ session, active, hovered, onHover, onClick, onTogglePin }) => (
  <button
    onClick={onClick}
    onMouseEnter={() => onHover(session.id)}
    onMouseLeave={() => onHover(null)}
    style={{
      width: "100%", display: "flex", alignItems: "flex-start", gap: 9,
      padding: "9px 12px",
      background: active ? "#EFF6FF" : hovered ? T.sidebarHov : "transparent",
      border: "none",
      borderLeft: active ? `3px solid ${T.accent}` : "3px solid transparent",
      cursor: "pointer", fontFamily: T.font, textAlign: "left",
      transition: "all 0.1s",
    }}
  >
    <SessionIcon type={session.type} />
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, justifyContent: "space-between" }}>
        <span style={{
          fontSize: 12, fontWeight: active ? 700 : 600,
          color: active ? T.accent : T.text2,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          flex: 1,
        }}>
          {session.pinned && <span style={{ marginRight: 3 }}>📌</span>}
          {session.title}
        </span>
        <span
          role="button"
          title={session.pinned ? "取消置頂" : "置頂"}
          onClick={onTogglePin}
          style={{
            fontSize: 9, color: session.pinned || hovered ? T.accent : T.text4,
            flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 4,
          }}
        >
          {(session.pinned || hovered) && <Pin size={10} />}
          {session.date}
        </span>
      </div>
      <div style={{ fontSize: 10.5, color: T.text4, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {session.preview}
      </div>
    </div>
  </button>
);

// ── Message Bubble ────────────────────────────────────────────────────────────
const MessageBubble: React.FC<{
  msg: ChatMessage;
  exportDataUrl: string;
  onSuggest: (q: string) => void;
}> = ({ msg, exportDataUrl, onSuggest }) => {
  const isUser = msg.role === "user";

  return (
    <div style={{
      display: "flex",
      flexDirection: isUser ? "row-reverse" : "row",
      alignItems: "flex-start",
      gap: 10,
    }}>
      {/* Avatar */}
      <div style={{
        width: 32, height: 32, borderRadius: 9, flexShrink: 0,
        background: isUser
          ? "linear-gradient(135deg, #1E40AF, #2563EB)"
          : "linear-gradient(135deg, #5B21B6, #7C3AED)",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 2px 6px rgba(0,0,0,0.14)",
      }}>
        {isUser
          ? <UserIcon size={15} color="#fff" />
          : <Bot size={15} color="#fff" />
        }
      </div>

      {/* Bubble */}
      <div style={{ maxWidth: "78%", minWidth: 0 }}>
        {/* Role + timestamp */}
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          marginBottom: 5,
          flexDirection: isUser ? "row-reverse" : "row",
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: isUser ? T.accent : T.purple }}>
            {isUser ? "教師" : "AI 數據助手"}
          </span>
          <span style={{ fontSize: 10, color: T.text4, fontFamily: T.mono }}>{msg.timestamp}</span>
        </div>

        {/* Message content */}
        <div style={{
          padding: isUser ? "10px 14px" : "14px 16px",
          background: isUser
            ? "linear-gradient(135deg, #1E3A8A, #1D4ED8)"
            : T.surface,
          border: isUser ? "none" : `1px solid ${T.border}`,
          borderRadius: isUser
            ? "14px 4px 14px 14px"
            : "4px 14px 14px 14px",
          boxShadow: isUser
            ? "0 3px 10px rgba(29,78,216,0.20)"
            : T.shadowMd,
          color: isUser ? "#fff" : T.text2,
          fontSize: 13, lineHeight: 1.65,
          fontFamily: T.font,
        }}>
          {/* Render content with bold support */}
          {msg.content.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
            part.startsWith("**") && part.endsWith("**")
              ? <strong key={i} style={{ color: isUser ? "#fff" : T.text1 }}>{part.slice(2, -2)}</strong>
              : <span key={i}>{part}</span>
          )}

          {/* Source info */}
          {msg.sourceInfo && (
            <div style={{
              display: "flex", alignItems: "center", gap: 5,
              marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T.border}`,
              fontSize: 10, color: T.text4,
            }}>
              <Info size={10} />
              <span>{msg.sourceInfo}</span>
            </div>
          )}

          {/* Embedded table */}
          {msg.tableData && <AiResultTable data={msg.tableData} />}

          {/* Export button */}
          {msg.exportLabel && (
            <ExportButton
              label={msg.exportLabel}
              messageId={msg.messageId}
              exportDataUrl={exportDataUrl}
            />
          )}

          {/* Suggestion chips */}
          {msg.suggestions && (
            <SuggestionChips items={msg.suggestions} onSelect={onSuggest} />
          )}
        </div>
      </div>
    </div>
  );
};

// ── Thinking Bubble ───────────────────────────────────────────────────────────
const ThinkingBubble: React.FC = () => {
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    const t = window.setInterval(() => {
      setStepIdx((i) => (i + 1) % THINKING_STEPS.length);
    }, 1200);
    return () => window.clearInterval(t);
  }, []);

  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
      <div style={{
        width: 32, height: 32, borderRadius: 9, flexShrink: 0,
        background: "linear-gradient(135deg, #5B21B6, #7C3AED)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Bot size={15} color="#fff" />
      </div>
      <div style={{
        padding: "12px 16px",
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: "4px 14px 14px 14px",
        boxShadow: T.shadowMd,
        minWidth: 260,
      }}>
        <style>{`@keyframes aispin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: T.text2, fontFamily: T.font }}>
          <RefreshCw size={14} color={T.purple} style={{ animation: "aispin 1s linear infinite", flexShrink: 0 }} />
          <span>{THINKING_STEPS[stepIdx]}</span>
        </div>
      </div>
    </div>
  );
};

// ── Empty State ───────────────────────────────────────────────────────────────
const EmptyState: React.FC<{ onSuggest: (q: string) => void }> = ({ onSuggest }) => {
  const EXAMPLES = [
    { icon: <Database size={16} color={T.accent} />,      text: "列出 F3 全級上學期成績，按班別排序",    cat: "成績查詢" },
    { icon: <FileSpreadsheet size={16} color={T.emerald} />, text: "匯出 24/25 全年活動時數為 Excel",     cat: "資料匯出" },
    { icon: <BarChart2 size={16} color={T.amber} />,      text: "對比 F5A 和 F5B 英文科三年趨勢",       cat: "趨勢分析" },
    { icon: <Filter size={16} color={T.purple} />,        text: "篩選成就積點 ≥ 200 且全勤的學生",     cat: "條件篩選" },
  ];

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", gap: 24 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: 64, height: 64, borderRadius: 18, margin: "0 auto 16px",
          background: "linear-gradient(135deg, #EFF6FF, #F5F3FF)",
          border: `1px solid ${T.accentBd}`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Cpu size={28} color={T.accent} />
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: T.text1, fontFamily: T.font }}>AI 數據助手</div>
        <div style={{ fontSize: 12, color: T.text3, fontFamily: T.font, marginTop: 4 }}>
          向我查詢學生成績、活動記錄、出勤數據，或上傳檔案進行分析
        </div>
      </div>

      <div style={{ width: "100%", maxWidth: 520 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: T.text4, letterSpacing: "0.07em", textAlign: "center", marginBottom: 12, fontFamily: T.font }}>
          範例指令 EXAMPLE QUERIES
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {EXAMPLES.map(ex => (
            <button
              key={ex.text}
              onClick={() => onSuggest(ex.text)}
              style={{
                display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8,
                padding: "12px 14px",
                background: T.surface,
                border: `1px solid ${T.border}`,
                borderRadius: T.radiusLg,
                cursor: "pointer", fontFamily: T.font, textAlign: "left",
                boxShadow: T.shadow,
                transition: "all 0.12s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {ex.icon}
                <span style={{ fontSize: 9, fontWeight: 700, color: T.text4, letterSpacing: "0.04em" }}>{ex.cat}</span>
              </div>
              <span style={{ fontSize: 11.5, color: T.text2, lineHeight: 1.45 }}>{ex.text}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
