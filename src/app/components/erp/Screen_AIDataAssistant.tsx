// ─────────────────────────────────────────────────────────────────────────────
// Screen_AIDataAssistant.tsx
// AI 數據助手 — AI Data Assistant
// ERP Module 1.F.AI  ·  System Admin > AI Tools
// Chat-room style interface for database queries, file uploads, and report gen.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useRef, useEffect } from "react";
import { ERP } from "./erpTokens";
import {
  MessageSquare, Plus, Search, Send, Paperclip,
  Download, Database, BarChart2, FileSpreadsheet, Sparkles,
  ChevronRight, MoreHorizontal, Pin, Archive,
  CheckCircle2, AlertCircle, Info, Clock,
  Table2, Bot, User as UserIcon, X, ChevronDown,
  Filter, RefreshCw, Cpu,
} from "lucide-react";

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
  id: string;
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
  tableData?: TableData;
  exportLabel?: string;
  suggestions?: string[];
  sourceInfo?: string;
  isThinking?: boolean;
}

// ── Mock Sessions ─────────────────────────────────────────────────────────────
const SESSIONS: ChatSession[] = [
  {
    id: "s1", title: "F3 數學科成績分析", type: "data",
    preview: "已提取 87 名學生成績，低分 14 人已標記",
    date: "今日 14:32", msgCount: 6, pinned: true,
  },
  {
    id: "s2", title: "籃球隊選拔名單", type: "filter",
    preview: "按體能評分篩選 F4–F5 學生，共 23 候選人",
    date: "昨日 09:15", msgCount: 4,
  },
  {
    id: "s3", title: "24/25 服務活動時數匯出", type: "export",
    preview: "全年級義工時數已整理，Excel 報告已生成",
    date: "週一 11:40", msgCount: 3,
  },
  {
    id: "s4", title: "年度優秀學生篩選", type: "report",
    preview: "符合條件 32 人，成就積點 ≥ 200 且全勤",
    date: "08/12", msgCount: 8,
  },
  {
    id: "s5", title: "F5 英文科成績對比分析", type: "data",
    preview: "3 年縱向成績趨勢圖及班際對比",
    date: "08/10", msgCount: 5,
  },
  {
    id: "s6", title: "學生出勤率統計報告", type: "export",
    preview: "出勤率低於 80% 學生名單及家長聯絡",
    date: "08/05", msgCount: 4,
  },
];

// ── Pre-populated demo conversation ──────────────────────────────────────────
const FULL_SCORE_TABLE: TableData = {
  totalCount: 87,
  cols: [
    { key: "no",    label: "#",    align: "center", mono: true },
    { key: "id",    label: "學號",  align: "center", mono: true },
    { key: "name",  label: "姓名",  align: "left" },
    { key: "class", label: "班別",  align: "center" },
    { key: "p1",    label: "卷一",  align: "center", mono: true },
    { key: "p2",    label: "卷二",  align: "center", mono: true },
    { key: "total", label: "總分",  align: "center", mono: true },
    { key: "grade", label: "等級",  align: "center" },
  ],
  rows: [
    { no: 1,  id: "3A01", name: "陳大文", class: "F3A", p1: 76, p2: 81, total: "157/200", grade: "B" },
    { no: 2,  id: "3A02", name: "李美玲", class: "F3A", p1: 91, p2: 88, total: "179/200", grade: "A" },
    { no: 3,  id: "3A03", name: "黃志豪", class: "F3A", p1: 55, p2: 49, total: "104/200", grade: "D" },
    { no: 4,  id: "3A04", name: "張詩敏", class: "F3A", p1: 94, p2: 96, total: "190/200", grade: "A*" },
    { no: 5,  id: "3A05", name: "林俊傑", class: "F3A", p1: 62, p2: 58, total: "120/200", grade: "C" },
    { no: 6,  id: "3B01", name: "吳嘉欣", class: "F3B", p1: 83, p2: 79, total: "162/200", grade: "B+" },
    { no: 7,  id: "3B02", name: "鄭宇翔", class: "F3B", p1: 88, p2: 91, total: "179/200", grade: "A" },
    { no: 8,  id: "3B03", name: "梁慧雯", class: "F3B", p1: 47, p2: 52, total:  "99/200", grade: "F" },
  ],
};

const FILTERED_TABLE: TableData = {
  totalCount: 14,
  cols: [
    { key: "no",      label: "#",    align: "center", mono: true },
    { key: "id",      label: "學號",  align: "center", mono: true },
    { key: "name",    label: "姓名",  align: "left" },
    { key: "class",   label: "班別",  align: "center" },
    { key: "total",   label: "總分",  align: "center", mono: true },
    { key: "contact", label: "家長聯絡", align: "left", mono: true },
  ],
  rows: [
    { no: 1, id: "3A03", name: "黃志豪", class: "F3A", total: "104/200", contact: "9XXX-XXXX" },
    { no: 2, id: "3A05", name: "林俊傑", class: "F3A", total: "120/200", contact: "6XXX-XXXX" },
    { no: 3, id: "3B03", name: "梁慧雯", class: "F3B", total:  "99/200", contact: "5XXX-XXXX" },
    { no: 4, id: "3C07", name: "何建明", class: "F3C", total: "112/200", contact: "9XXX-XXXX" },
    { no: 5, id: "3C11", name: "劉佩珊", class: "F3C", total: "107/200", contact: "6XXX-XXXX" },
  ],
};

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "m1", role: "user", timestamp: "14:28",
    content: "請列出 F3 全級數學科 2024/25 上學期考試成績，按班別排序，並顯示每科卷別分數。",
  },
  {
    id: "m2", role: "ai", timestamp: "14:28",
    content: "已從資料庫提取 F3 數學科成績記錄，共 **87 名學生**（F3A · F3B · F3C 各班）。以下為按班別排序的成績一覽表——表格預覽顯示前 8 行，完整記錄可匯出為 Excel：",
    tableData: FULL_SCORE_TABLE,
    exportLabel: "匯出完整成績表 (87 人) 為 Excel",
    sourceInfo: "資料來源：LALP 成績資料庫 · 上學期期末試 · 更新於 2025-01-15",
  },
  {
    id: "m3", role: "user", timestamp: "14:30",
    content: "好，請篩選出總分低於 60% (即 120 分以下) 的學生，顯示其姓名、班別、總分及家長聯絡電話。",
  },
  {
    id: "m4", role: "ai", timestamp: "14:31",
    content: "已篩選出 **14 名**成績低於 60%（120 分以下）的學生。以下為名單預覽（顯示前 5 行，家長聯絡資料已部分脫敏）：",
    tableData: FILTERED_TABLE,
    exportLabel: "匯出跟進名單為 Excel (14 人)",
    suggestions: [
      "一鍵生成家長通知信件草稿",
      "為這 14 名學生建立支援計劃",
      "對比上學年同期成績趨勢",
    ],
  },
];

const SUGGESTED_QUERIES = [
  "各班平均分對比",
  "A* 學生名單",
  "與上學年同期對比",
  "生成班主任報告",
];

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
          {data.totalCount && (
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
      {data.totalCount && data.rows.length < data.totalCount && (
        <div style={{ padding: "6px 14px", background: "#F8FAFC", borderTop: `1px solid ${T.border}`, fontSize: 10, color: T.text4, fontFamily: T.font }}>
          另有 {data.totalCount - data.rows.length} 行未顯示 · 請匯出完整資料
        </div>
      )}
    </div>
  );
};

// ── Sub-component: Export Button ──────────────────────────────────────────────
const ExportButton: React.FC<{ label: string }> = ({ label }) => {
  const [clicked, setClicked] = useState(false);
  return (
    <button
      onClick={() => { setClicked(true); setTimeout(() => setClicked(false), 2200); }}
      style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        padding: "9px 18px", marginTop: 12,
        background: clicked
          ? "linear-gradient(135deg, #047857, #059669)"
          : "linear-gradient(135deg, #059669, #10B981)",
        border: "none", borderRadius: T.radiusLg,
        color: "#fff", fontFamily: T.font, fontSize: 13, fontWeight: 700,
        cursor: "pointer", boxShadow: "0 2px 8px rgba(5,150,105,0.3)",
        transition: "all 0.2s",
      }}
    >
      {clicked
        ? <><CheckCircle2 size={15} /> 正在生成… Generating</>
        : <><FileSpreadsheet size={15} /> {label}</>
      }
    </button>
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

// ── Sub-component: Thinking Indicator ────────────────────────────────────────
const ThinkingDots: React.FC = () => {
  const dotStyle = (delay: string): React.CSSProperties => ({
    width: 7, height: 7, borderRadius: "50%",
    background: T.text4,
    animation: "aidot 1.1s ease-in-out infinite",
    animationDelay: delay,
  });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 0" }}>
      <style>{`@keyframes aidot{0%,80%,100%{transform:scale(0.6);opacity:0.4}40%{transform:scale(1);opacity:1}}`}</style>
      <div style={dotStyle("0s")} />
      <div style={dotStyle("0.18s")} />
      <div style={dotStyle("0.36s")} />
    </div>
  );
};

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
export const Screen_AIDataAssistant: React.FC = () => {
  const F = T.font;

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 820);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const [activeSession, setActiveSession]   = useState("s1");
  const [sessions, setSessions]             = useState(SESSIONS);
  const [messages, setMessages]             = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput]                   = useState("");
  const [isThinking, setIsThinking]         = useState(false);
  const [showSidebar, setShowSidebar]       = useState(true);
  const [sidebarSearch, setSidebarSearch]   = useState("");
  const [hovSession, setHovSession]         = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef    = useRef<HTMLTextAreaElement>(null);
  const fileInputRef   = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  const handleSend = (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg) return;
    setInput("");
    setAttachmentName(null);

    const userMsg: ChatMessage = {
      id: `m${Date.now()}`, role: "user",
      content: msg,
      timestamp: new Date().toLocaleTimeString("zh-HK", { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsThinking(true);

    setTimeout(() => {
      const aiMsg: ChatMessage = {
        id: `m${Date.now() + 1}`, role: "ai",
        content: `已收到您的查詢：「${msg}」\n\n正在存取資料庫並進行分析… 結果將於片刻後顯示。如需進一步篩選或匯出，請直接告知。`,
        timestamp: new Date().toLocaleTimeString("zh-HK", { hour: "2-digit", minute: "2-digit" }),
        suggestions: ["匯出為 Excel", "生成摘要報告", "新增篩選條件"],
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsThinking(false);
    }, 1600);
  };

  const handleNewSession = () => {
    const newId = `s${Date.now()}`;
    const newSess: ChatSession = {
      id: newId, title: "新對話", type: "data",
      preview: "開始新的數據查詢…",
      date: "剛剛", msgCount: 0,
    };
    setSessions(prev => [newSess, ...prev]);
    setActiveSession(newId);
    setMessages([]);
  };

  const filteredSessions = sessions.filter(s =>
    s.title.includes(sidebarSearch) || s.preview.includes(sidebarSearch)
  );

  const pinnedSessions   = filteredSessions.filter(s => s.pinned);
  const recentSessions   = filteredSessions.filter(s => !s.pinned);
  const activeSessionObj = sessions.find(s => s.id === activeSession);

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

            {/* New chat button */}
            <button
              onClick={handleNewSession}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 8,
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
                    active={activeSession === s.id}
                    hovered={hovSession === s.id}
                    onHover={setHovSession}
                    onClick={() => { setActiveSession(s.id); if (isMobile) setShowSidebar(false); }}
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
                  active={activeSession === s.id}
                  hovered={hovSession === s.id}
                  onHover={setHovSession}
                  onClick={() => { setActiveSession(s.id); if (isMobile) setShowSidebar(false); }}
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
          <div style={{ display: "flex", gap: 6 }}>
            {[
              { icon: <Download size={13} />, label: "匯出對話" },
              { icon: <Archive size={13} />,  label: "封存" },
            ].map(btn => (
              <button key={btn.label} title={btn.label} style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", border: `1px solid ${T.border}`, borderRadius: 7, background: "transparent", color: T.text3, fontSize: 11, cursor: "pointer", fontFamily: F }}>
                {btn.icon}
                {!isMobile && <span>{btn.label}</span>}
              </button>
            ))}

            <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 7, background: T.emeraldPale, border: `1px solid ${T.emeraldBd}` }}>
              <Cpu size={11} color={T.emerald} />
              <span style={{ fontSize: 10, fontWeight: 700, color: T.emerald }}>claude-sonnet-5</span>
            </div>
          </div>
        </div>

        {/* Messages area */}
        <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "16px 12px" : "24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>

          {messages.length === 0 && (
            <EmptyState onSuggest={q => setInput(q)} />
          )}

          {messages.map(msg => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              onSuggest={q => { setInput(q); textareaRef.current?.focus(); }}
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
                  onClick={() => { setInput(q); textareaRef.current?.focus(); }}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    padding: "5px 11px",
                    border: `1px solid ${T.border}`,
                    borderRadius: 999, background: T.bg,
                    color: T.text3, fontSize: 11, cursor: "pointer", fontFamily: F,
                  }}
                >
                  <Sparkles size={9} color={T.accent} />
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Attachment preview */}
          {attachmentName && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", marginBottom: 8, background: T.accentPale, border: `1px solid ${T.accentBd}`, borderRadius: 8 }}>
              <FileSpreadsheet size={13} color={T.accent} />
              <span style={{ fontSize: 11.5, fontWeight: 600, color: T.accent, flex: 1 }}>{attachmentName}</span>
              <button onClick={() => setAttachmentName(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
                <X size={12} color={T.accent} />
              </button>
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
            onFocus={() => {}}
          >
            {/* Paperclip */}
            <button
              onClick={() => fileInputRef.current?.click()}
              title="上傳附件"
              style={{
                flexShrink: 0, width: 34, height: 34,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "transparent", border: `1px solid ${T.border}`,
                borderRadius: 8, cursor: "pointer", color: T.text3,
                transition: "all 0.12s",
              }}
            >
              <Paperclip size={15} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv,.pdf"
              style={{ display: "none" }}
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) setAttachmentName(f.name);
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
                  handleSend();
                }
              }}
              placeholder="向 AI 數據助手發送指令，例如：「列出 F3A 最近一次測驗低於 50 分的學生」…"
              rows={2}
              style={{
                flex: 1, resize: "none", border: "none", outline: "none",
                background: "transparent", fontSize: 13, fontFamily: F,
                color: T.text1, lineHeight: 1.6,
                padding: "2px 0",
              }}
            />

            {/* Send button */}
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() && !attachmentName}
              style={{
                flexShrink: 0, width: 36, height: 36,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: input.trim() || attachmentName
                  ? "linear-gradient(135deg, #2563EB, #7C3AED)"
                  : "#E2E8F0",
                border: "none", borderRadius: 10,
                cursor: input.trim() || attachmentName ? "pointer" : "default",
                color: "#fff", transition: "all 0.15s",
                boxShadow: input.trim() ? "0 2px 8px rgba(37,99,235,0.28)" : "none",
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
  onHover: (id: string | null) => void;
  onClick: () => void;
}> = ({ session, active, hovered, onHover, onClick }) => (
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
        <span style={{ fontSize: 9, color: T.text4, flexShrink: 0 }}>{session.date}</span>
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
  onSuggest: (q: string) => void;
}> = ({ msg, onSuggest }) => {
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
          {msg.exportLabel && <ExportButton label={msg.exportLabel} />}

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
const ThinkingBubble: React.FC = () => (
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
    }}>
      <div style={{ fontSize: 10, color: T.text4, marginBottom: 6, fontFamily: T.font }}>
        正在查詢資料庫…
      </div>
      <ThinkingDots />
    </div>
  </div>
);

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
