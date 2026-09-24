// ─────────────────────────────────────────────────────────────────────────────
// Screen_AIWritingWorkspace.tsx
// AI 智能文案工作站 — AI Copywriting Workspace + AI Data Assistant
// ERP Module 1.F.3 / 6
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useRef, useEffect, useCallback } from "react";
import { ERP } from "./erpTokens";
import {
  Save, Sparkles, ChevronDown, X, FileText, Copy,
  Bold, Italic, AlignLeft, Download, Zap, Trophy, Users,
  RefreshCw, Check, ChevronRight, Info, Wand2, PenLine,
  GripVertical, History, Brain, Upload, Feather, RotateCcw,
  MessageSquare, Send, Table2, FileJson, FileSpreadsheet,
  Bot, User, Archive, Calendar, Hash, ChevronUp,
} from "lucide-react";

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
type OutputType = "letter" | "comment" | "promo";

interface ChatMessage {
  id: string;
  role: "user" | "ai";
  content: string;
  tableData?: TableRow[];
  timestamp: string;
}

interface TableRow { [key: string]: string | number }

interface GenRecord {
  id: string; type: string; student: string;
  scenario: string; words: number; ts: string; version: string;
}

// ── Static data ───────────────────────────────────────────────────────────────
const LETTER: LetterParagraph[] = [
  { id: "p_salutation", type: "salutation", content: "致 敬啟者：" },
  { id: "p_intro",   type: "body", aiTag: "引言",    content: "　　本人謹代表香港神託會培敦中學（Stewards Pooi Tun Secondary School），極力推薦陳大文同學（學號：2025-F1A-001）報名參加貴機構舉辦之「2026 全港中學生科學夏令營」。陳同學現就讀中一甲班，品學兼優，自入讀本校以來於各方面均有顯著成長。" },
  { id: "p_acorn",  type: "body", aiTag: "ACORN 數據", content: "　　根據本校 ACORN 全人學習特徵評估系統，陳同學在「協作」維度取得 91 分，位列全年級前 5%，充分展現其卓越才能。在「學術」維度錄得 82 分，反映扎實的知識根基與自主學習態度。" },
  { id: "p_achv",   type: "body", aiTag: "成就記錄", highlight: true, highlightStart: 5, highlightEnd: 37, content: "　　本學期，陳同學出任中一級科學環保專題的組長（角色級別 T3），帶領六名同學完成為期八週的項目研究，並代表本校參加「2026 全港中學生科學實驗大賽」，榮獲金獎（L4 國際／全港級）。" },
  { id: "p_char",   type: "body", aiTag: "品格評估", content: "　　陳同學不僅學術優異，更在個人品格方面樹立良好榜樣。其思維縝密，溝通能力強，能於壓力下保持冷靜。本人誠摯推薦陳大文同學參加貴機構之夏令營。" },
  { id: "p_close",  type: "closing", content: "謹此" },
];

const DATA_SOURCES = [
  { id: "m3",  label: "M3 · ACORN 六維數據",  confidence: 98, color: D.emerald, bg: D.emeraldPale, bd: D.emeraldBd },
  { id: "m4",  label: "M4 · 成就與獎項記錄",  confidence: 96, color: "#7C3AED", bg: "#EDE9FE",     bd: "#DDD6FE" },
  { id: "m6",  label: "M6 · AI 歷史評語",      confidence: 88, color: D.ai,     bg: D.aiLight,     bd: D.aiBorder },
  { id: "ext", label: "📄 夏令營章程 PDF",      confidence: 84, color: D.amber,  bg: D.amberPale,   bd: D.amberBd },
];

const TONES = ["專業嚴謹 (Formal)", "親切溫馨 (Warm)", "學術嚴肅 (Academic)", "輕鬆活潑 (Casual)"];

const SCENARIOS = [
  "校長頒獎禮 / Award Ceremony",
  "來賓訪問 / Guest Visit",
  "全港性比賽 / Championship",
  "姊妹學校交流 / Exchange",
  "音樂／演藝表演 / Performing Arts",
  "學術比賽 / Academic Contest",
  "升學推薦 / University Admission",
  "校外考察 / Study Tour",
];

const OUTPUT_TYPES: { id: OutputType; zh: string; en: string; icon: string }[] = [
  { id: "letter",  zh: "推薦信",     en: "Recommendation Letter", icon: "✉️" },
  { id: "comment", zh: "成績表評語", en: "Report Comment",         icon: "📝" },
  { id: "promo",   zh: "校園宣傳稿", en: "Promo Post",             icon: "📣" },
];

const GEN_HISTORY: GenRecord[] = [
  { id: "h1", type: "推薦信",     student: "陳大文",  scenario: "科學夏令營",  words: 342, ts: "08-18 09:15", version: "V3" },
  { id: "h2", type: "校園宣傳稿", student: "—",       scenario: "校長頒獎禮",  words: 218, ts: "08-17 14:30", version: "V1" },
  { id: "h3", type: "成績表評語", student: "李美玲",  scenario: "—",           words:  98, ts: "08-16 11:45", version: "V2" },
  { id: "h4", type: "推薦信",     student: "張偉明",  scenario: "姊妹學校交流",words: 295, ts: "08-15 16:20", version: "V1" },
  { id: "h5", type: "校園宣傳稿", student: "—",       scenario: "來賓訪問",    words: 156, ts: "08-14 10:00", version: "V2" },
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
export const Screen_AIWritingWorkspace: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const F = D.font;

  // Workspace state
  const [mainTab,         setMainTab]         = useState<"workspace" | "databot">("workspace");
  const [outputType,      setOutputType]      = useState<OutputType>("letter");
  const [isGenerating,    setIsGenerating]    = useState(false);
  const [generationDone,  setGenerationDone]  = useState(true);
  const [showToolbar,     setShowToolbar]     = useState(true);
  const [activeVersion,   setActiveVersion]   = useState(1);
  const [tone,            setTone]            = useState(TONES[0]);
  const [toneOpen,        setToneOpen]        = useState(false);
  const [scenario,        setScenario]        = useState(SCENARIOS[0]);
  const [scenarioOpen,    setScenarioOpen]    = useState(false);
  const [wordTarget,      setWordTarget]      = useState(350);
  const [isSaved,         setIsSaved]         = useState(false);
  const [toastMsg,        setToastMsg]        = useState<string | null>(null);
  const [isMobile,        setIsMobile]        = useState(false);
  const [mobileTab,       setMobileTab]       = useState<"setup" | "output">("output");
  const [showHistory,     setShowHistory]     = useState(false);
  const [genHistory]                          = useState<GenRecord[]>(GEN_HISTORY);
  const [view,          setView]          = useState<"list" | "editor">("list");
  const [editingRecord, setEditingRecord] = useState<GenRecord | null>(null);

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

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2200);
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setGenerationDone(false);
    setTimeout(() => {
      setIsGenerating(false);
      setGenerationDone(true);
      setActiveVersion(v => v + 1);
      showToast("✨ 新版草稿已生成");
    }, 2200);
  };

  const handleToolbarAction = (action: string) => {
    const labels: Record<string, string> = {
      polish: "✨ 語氣潤飾完成", elaborate: "➕ 已擴展段落細節",
      shorten: "➖ 段落已精簡",  regenerate: "🔄 段落已重新生成",
    };
    showToast(labels[action] ?? "已執行");
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

  const docWordCount = LETTER.filter(p => p.content).reduce((a, p) => a + (p.content?.replace(/\s/g, "").length ?? 0), 0);

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
              onClick={() => { setEditingRecord(null); setView("editor"); }}
              style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "linear-gradient(135deg, #4F46E5, #6366F1)", border: "none", borderRadius: 10, padding: isMobile ? "9px 14px" : "10px 20px", cursor: "pointer", fontSize: isMobile ? 12 : 13, fontWeight: 700, color: "#fff", fontFamily: F, boxShadow: "0 2px 12px rgba(99,102,241,0.45)", flexShrink: 0 }}>
              <Wand2 size={14} color="#fff" />
              新建文案 Create New
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(3, 1fr)", gap: 12 }}>
            {[
              { label: "總文件數", value: genHistory.length, sub: "Total Documents", color: D.ai, bg: D.aiLight, bd: D.aiBorder, icon: <Archive size={14} color={D.ai} /> },
              { label: "本週生成", value: 3, sub: "Generated This Week", color: D.emerald, bg: D.emeraldPale, bd: D.emeraldBd, icon: <Zap size={14} color={D.emerald} /> },
              { label: "待審閱", value: 1, sub: "Pending Review", color: D.amber, bg: D.amberPale, bd: D.amberBd, icon: <Info size={14} color={D.amber} /> },
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
                    {["類型", "生成對象", "情境/場合", "字數", "版本", "生成時間", ""].map((col, ci) => (
                      <th key={ci} style={{ padding: "9px 16px", textAlign: "left", fontSize: 10.5, fontWeight: 700, color: D.text4, borderBottom: `1px solid ${D.border}`, whiteSpace: "nowrap", letterSpacing: "0.04em" }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {genHistory.map((rec, ri) => {
                    const tc = rec.type === "推薦信"
                      ? { color: D.blue, bg: D.bluePale, bd: "#BFDBFE" }
                      : rec.type === "成績表評語"
                      ? { color: D.emerald, bg: D.emeraldPale, bd: D.emeraldBd }
                      : { color: "#7C3AED", bg: "#EDE9FE", bd: "#DDD6FE" };
                    return (
                      <tr key={rec.id}
                        style={{ borderBottom: ri < genHistory.length - 1 ? `1px solid ${D.border}` : "none", cursor: "pointer", transition: "background 0.1s" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#F8F7FF")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                        onClick={() => { setEditingRecord(rec); setView("editor"); }}>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", background: tc.bg, border: `1px solid ${tc.bd}`, borderRadius: 999, fontSize: 11, fontWeight: 700, color: tc.color }}>{rec.type}</span>
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: D.text1 }}>{rec.student}</td>
                        <td style={{ padding: "12px 16px", fontSize: 12, color: D.text3 }}>{rec.scenario}</td>
                        <td style={{ padding: "12px 16px", fontSize: 12, color: D.text3, fontFamily: "'JetBrains Mono', monospace" }}>{rec.words} 字</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ display: "inline-block", padding: "2px 8px", background: "#F1F5F9", border: `1px solid ${D.border}`, borderRadius: 6, fontSize: 11, fontWeight: 700, color: D.text3 }}>{rec.version}</span>
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 11, color: D.text4, whiteSpace: "nowrap" }}>
                          <Calendar size={11} color={D.text4} style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }} />{rec.ts}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <button
                            onClick={e => { e.stopPropagation(); setEditingRecord(rec); setView("editor"); }}
                            style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", background: D.aiLight, border: `1px solid ${D.aiBorder}`, borderRadius: 7, cursor: "pointer", fontSize: 11, fontWeight: 700, color: D.ai, fontFamily: F }}>
                            開啟 <ChevronRight size={11} color={D.ai} />
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
                onClick={() => { setEditingRecord(null); setView("editor"); }}
                style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 20px", background: "linear-gradient(135deg, #4F46E5, #6366F1)", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 12.5, fontWeight: 700, color: "#fff", fontFamily: F, boxShadow: "0 2px 10px rgba(99,102,241,0.40)" }}>
                <Wand2 size={13} color="#fff" /> 建立新文案
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
        <button onClick={onBack ?? (() => setView("list"))} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "none", border: `1px solid ${D.border}`, borderRadius: 8, padding: "5px 10px", fontSize: 12, fontWeight: 600, color: D.text3, cursor: "pointer", fontFamily: F, flexShrink: 0 }}>
          <ChevronRight size={13} color={D.text4} style={{ transform: "rotate(180deg)" }} /> {onBack ? "返回" : "返回記錄"}
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
            <button onClick={() => { setIsSaved(true); showToast("💾 草稿已儲存"); setTimeout(() => { setIsSaved(false); setView("list"); }, 1400); }}
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, background: D.surface, border: `1px solid ${D.border}`, borderRadius: 9, padding: "7px 12px", cursor: "pointer", fontSize: 12, fontWeight: 600, color: isSaved ? D.emerald : D.text2, fontFamily: F, transition: "all 0.15s", flexShrink: 0 }}>
              {isSaved ? <Check size={13} color={D.emerald} /> : <Save size={13} color={D.text3} />}
              {!isMobile && <span>{isSaved ? "已儲存" : "儲存草稿"}</span>}
            </button>
            <button style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, background: "linear-gradient(135deg, #4F46E5, #6366F1)", border: "none", borderRadius: 9, padding: "7px 14px", cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#fff", fontFamily: F, boxShadow: "0 2px 10px rgba(99,102,241,0.40)", flexShrink: 0 }}>
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
          <div style={{ flex: isMobile ? "none" : 1, display: isMobile ? "block" : "grid", gridTemplateColumns: isMobile ? undefined : "360px 1px 1fr", overflow: isMobile ? "visible" : "hidden" }}>

            {/* ── LEFT PANEL ────────────────────────────────────────────── */}
            <div style={{ overflowY: isMobile ? "visible" : "auto", background: D.surface, display: isMobile && mobileTab !== "setup" ? "none" : "flex", flexDirection: "column", gap: 0 }}>
              <div style={{ padding: "14px 18px 12px", borderBottom: `1px solid ${D.border}`, background: "#FAFAFA", position: "sticky", top: 0, zIndex: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <Brain size={14} color={D.ai} />
                  <span style={{ fontSize: 12.5, fontWeight: 800, color: D.text1 }}>參數設定</span>
                </div>
                <div style={{ fontSize: 10, color: D.text4, marginTop: 2 }}>Parameter Controls & Context Injection</div>
              </div>

              <div style={{ padding: "18px 18px 24px", display: "flex", flexDirection: "column", gap: 20 }}>

                {/* Target Student */}
                <div>
                  <SectionLabel icon={<Users size={12} color={D.text3} />} zh="生成對象" en="Target Student" />
                  <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 12px", background: D.surface, border: `1.5px solid ${D.aiBorder}`, borderRadius: 10, boxShadow: `0 0 0 3px ${D.aiLight}` }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, background: "linear-gradient(135deg, #2563EB, #6366F1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, color: "#fff" }}>陳</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: D.text1 }}>陳大文</div>
                      <div style={{ fontSize: 10, color: D.text4, fontFamily: "'JetBrains Mono', monospace" }}>2025-F1A-001</div>
                    </div>
                    <button style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}><X size={13} color={D.text4} /></button>
                  </div>
                </div>

                {/* Output Type */}
                <div>
                  <SectionLabel icon={<PenLine size={12} color={D.text3} />} zh="輸出類型" en="Output Type" />
                  <div style={{ display: "flex", gap: 6, background: "#F1F5F9", borderRadius: 10, padding: 4 }}>
                    {OUTPUT_TYPES.map(t => (
                      <button key={t.id} onClick={() => setOutputType(t.id)} style={{ flex: 1, padding: "7px 4px", borderRadius: 8, background: outputType === t.id ? D.surface : "none", border: outputType === t.id ? `1px solid ${D.border}` : "1px solid transparent", cursor: "pointer", transition: "all 0.15s", boxShadow: outputType === t.id ? D.shadow : "none" }}>
                        <div style={{ fontSize: 14 }}>{t.icon}</div>
                        <div style={{ fontSize: 9.5, fontWeight: 700, color: outputType === t.id ? D.text1 : D.text4, marginTop: 2, fontFamily: F }}>{t.zh}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── PARAMETER CONTROLS (new) ────────────────────── */}
                <div style={{ background: "linear-gradient(135deg, #F8F7FF, #EEF2FF)", border: `1px solid ${D.aiBorder}`, borderRadius: 12, padding: "14px 14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 14 }}>
                    <Zap size={12} color={D.ai} />
                    <span style={{ fontSize: 11.5, fontWeight: 800, color: D.ai }}>輸出參數 Output Parameters</span>
                  </div>

                  {/* Tone */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: D.text3, marginBottom: 5 }}>語氣 / Tone &amp; Style</div>
                    <div style={{ position: "relative" }}>
                      <button onClick={() => { setToneOpen(v => !v); setScenarioOpen(false); }}
                        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 11px", background: D.surface, border: `1.5px solid ${toneOpen ? D.aiBorder : D.border}`, borderRadius: 8, cursor: "pointer", fontFamily: F, fontSize: 12, color: D.text1, fontWeight: 600, transition: "border-color 0.15s" }}>
                        <span><Feather size={11} color={D.text4} style={{ marginRight: 5 }} />🎯 {tone}</span>
                        <ChevronDown size={13} color={D.text3} style={{ transform: toneOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
                      </button>
                      {toneOpen && (
                        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 50, background: D.surface, border: `1px solid ${D.border}`, borderRadius: 10, boxShadow: D.shadowLg, overflow: "hidden" }}>
                          {TONES.map(t => (
                            <button key={t} onClick={() => { setTone(t); setToneOpen(false); }} style={{ width: "100%", textAlign: "left", padding: "8px 12px", background: tone === t ? D.aiLight : "none", border: "none", cursor: "pointer", fontSize: 12, color: tone === t ? D.ai : D.text2, fontWeight: tone === t ? 700 : 400, fontFamily: F }}>
                              {tone === t && "✓ "}{t}
                            </button>
                          ))}
                        </div>
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

                  {/* Scenario */}
                  <div>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: D.text3, marginBottom: 5 }}>場景 / Scenario</div>
                    <div style={{ position: "relative" }}>
                      <button onClick={() => { setScenarioOpen(v => !v); setToneOpen(false); }}
                        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 11px", background: D.surface, border: `1.5px solid ${scenarioOpen ? D.aiBorder : D.border}`, borderRadius: 8, cursor: "pointer", fontFamily: F, fontSize: 11.5, color: D.text1, fontWeight: 600, transition: "border-color 0.15s" }}>
                        <span>📌 {scenario}</span>
                        <ChevronDown size={13} color={D.text3} style={{ transform: scenarioOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
                      </button>
                      {scenarioOpen && (
                        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 50, background: D.surface, border: `1px solid ${D.border}`, borderRadius: 10, boxShadow: D.shadowLg, overflow: "hidden" }}>
                          {SCENARIOS.map(s => (
                            <button key={s} onClick={() => { setScenario(s); setScenarioOpen(false); }} style={{ width: "100%", textAlign: "left", padding: "8px 12px", background: scenario === s ? D.aiLight : "none", border: "none", cursor: "pointer", fontSize: 11.5, color: scenario === s ? D.ai : D.text2, fontWeight: scenario === s ? 700 : 400, fontFamily: F }}>
                              {scenario === s && "✓ "}{s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* System Data */}
                <div>
                  <SectionLabel icon={<Zap size={12} color={D.ai} />} zh="系統數據注入" en="Auto-loaded from ERP" />
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 12px", marginBottom: 10, background: D.emeraldPale, border: `1px solid ${D.emeraldBd}`, borderRadius: 9 }}>
                    <Sparkles size={13} color={D.emerald} style={{ flexShrink: 0, marginTop: 1 }} />
                    <div>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: D.emerald }}>✨ 已自動載入 ACORN 數據與歷史成就</div>
                      <div style={{ fontSize: 10, color: "#047857", marginTop: 1.5, lineHeight: 1.5 }}>Auto-loaded ACORN & Achievement records · 4 sources</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                    {[
                      { label: "協作 91", sub: "Top 5%", bg: "#D1FAE5", color: "#065F46", bd: "#6EE7B7" },
                      { label: "學術 82", sub: "Top 18%", bg: "#DBEAFE", color: "#1E3A8A", bd: "#93C5FD" },
                      { label: "2次 PBL 組長", sub: "T3 Role", bg: "#EDE9FE", color: "#4C1D95", bd: "#C4B5FD" },
                      { label: "全港科學金獎", sub: "L4 Award", bg: "#FEF3C7", color: "#92400E", bd: "#FDE68A" },
                    ].map(tag => (
                      <div key={tag.label} style={{ padding: "4px 10px", borderRadius: 999, background: tag.bg, border: `1px solid ${tag.bd}`, display: "flex", flexDirection: "column", animation: "dataIn 0.25s ease-out" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: tag.color, lineHeight: 1.2 }}>{tag.label}</span>
                        <span style={{ fontSize: 9, color: tag.color, opacity: 0.70 }}>{tag.sub}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: "#FAFAFA", border: `1px solid ${D.border}`, borderRadius: 9, padding: "11px 13px", display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: D.text3, marginBottom: 2 }}>數據來源可信度</div>
                    {DATA_SOURCES.map(src => (
                      <div key={src.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 9.5, fontWeight: 700, color: src.color, minWidth: 120, flexShrink: 0 }}>{src.label}</span>
                        <ConfBar pct={src.confidence} color={src.color} />
                        <span style={{ fontSize: 9.5, fontWeight: 700, color: src.color, minWidth: 28 }}>{src.confidence}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* External context */}
                <div>
                  <SectionLabel icon={<Upload size={12} color={D.text3} />} zh="外部背景資料" en="External Context (PDF/DOCX)" />
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", marginBottom: 8, background: D.bluePale, border: `1px solid #BFDBFE`, borderRadius: 9 }}>
                    <div style={{ width: 28, height: 28, flexShrink: 0, background: "#DBEAFE", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}><FileText size={14} color={D.blue} /></div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: D.blue, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>2026_Science_Camp_Details.pdf</div>
                      <div style={{ fontSize: 9.5, color: "#3B82F6" }}>2.4 MB · 已分析 · 84% 置信度</div>
                    </div>
                    <button style={{ background: "none", border: "none", cursor: "pointer" }}><X size={12} color="#94A3B8" /></button>
                  </div>
                  <div style={{ border: `1.5px dashed ${D.border}`, borderRadius: 10, padding: "14px 12px", textAlign: "center", background: "#FAFAFA", cursor: "pointer" }}>
                    <Upload size={16} color={D.text4} style={{ margin: "0 auto 5px" }} />
                    <div style={{ fontSize: 11, fontWeight: 600, color: D.text3 }}>上傳比賽章程或背景資料</div>
                    <div style={{ fontSize: 10, color: D.text4, marginTop: 2 }}>Upload Circular / Context PDF</div>
                  </div>
                </div>

              </div>

              {/* Sticky generate button */}
              <div style={{ position: "sticky", bottom: 0, zIndex: 10, padding: "14px 18px", background: D.surface, borderTop: `1px solid ${D.border}`, boxShadow: "0 -4px 16px rgba(15,23,42,0.06)" }}>
                <button onClick={handleGenerate} disabled={isGenerating} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 9, padding: "13px 20px", borderRadius: 12, border: "none", cursor: isGenerating ? "wait" : "pointer", fontSize: 14, fontWeight: 800, color: "#fff", fontFamily: F, background: isGenerating ? "linear-gradient(270deg, #4F46E5, #7C3AED, #6366F1, #4F46E5)" : "linear-gradient(135deg, #4F46E5 0%, #6366F1 50%, #7C3AED 100%)", backgroundSize: "400% 400%", animation: isGenerating ? "generatePulse 1.8s ease infinite" : "none", boxShadow: "0 4px 18px rgba(99,102,241,0.45)", transition: "opacity 0.15s" }}>
                  {isGenerating ? <><RefreshCw size={16} color="#fff" style={{ animation: "spin 0.8s linear infinite" }} /> AI 正在生成草稿…</> : <><Sparkles size={16} color="#fff" /> ✨ 生成草稿</>}
                </button>
              </div>
            </div>

            {/* Divider */}
            {!isMobile && (
              <div style={{ background: D.border, cursor: "col-resize", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                <div style={{ width: 20, height: 36, display: "flex", alignItems: "center", justifyContent: "center", background: D.surface, borderRadius: 4, border: `1px solid ${D.border}` }}>
                  <GripVertical size={12} color={D.text4} />
                </div>
              </div>
            )}

            {/* ── RIGHT PANEL ───────────────────────────────────────────── */}
            <div style={{ display: isMobile && mobileTab !== "output" ? "none" : "flex", flexDirection: "column", background: D.bg, overflow: isMobile ? "visible" : "hidden" }}>

              {/* Editor top bar */}
              <div style={{ minHeight: 46, background: D.surface, borderBottom: `1px solid ${D.border}`, display: "flex", alignItems: "center", padding: isMobile ? "0 12px" : "0 16px", gap: 8, flexShrink: 0, flexWrap: "nowrap" }}>
                <div style={{ display: "flex", gap: 2 }}>
                  {[1, 2].map(v => (
                    <button key={v} onClick={() => setActiveVersion(v)} style={{ display: "flex", alignItems: "center", gap: 5, padding: isMobile ? "5px 10px" : "5px 12px", borderRadius: 7, background: activeVersion === v ? D.aiLight : "none", border: activeVersion === v ? `1px solid ${D.aiBorder}` : "1px solid transparent", cursor: "pointer", fontSize: 11.5, fontWeight: 700, color: activeVersion === v ? D.ai : D.text4, fontFamily: F, whiteSpace: "nowrap" as const }}>
                      <History size={11} color={activeVersion === v ? D.ai : D.text4} />
                      V{v}{activeVersion === v && " · 當前"}
                    </button>
                  ))}
                </div>
                {!isMobile && <div style={{ width: 1, height: 20, background: D.border, margin: "0 4px" }} />}
                {!isMobile && [
                  { icon: <Bold size={13} /> }, { icon: <Italic size={13} /> }, { icon: <AlignLeft size={13} /> },
                ].map((btn, i) => (
                  <button key={i} style={{ width: 28, height: 28, borderRadius: 6, background: "none", border: "1px solid transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: D.text3, transition: "all 0.12s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = D.aiLight; e.currentTarget.style.borderColor = D.aiBorder; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.borderColor = "transparent"; }}
                  >{btn.icon}</button>
                ))}
                <div style={{ flex: 1 }} />
                {!isMobile && (
                  <button onClick={() => setShowToolbar(v => !v)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 7, background: showToolbar ? D.aiLight : "none", border: showToolbar ? `1px solid ${D.aiBorder}` : `1px solid ${D.border}`, cursor: "pointer", fontSize: 11, fontWeight: 600, color: showToolbar ? D.ai : D.text3, fontFamily: F, whiteSpace: "nowrap" as const }}>
                    <Wand2 size={11} /> AI 浮動工具列
                  </button>
                )}
                <button onClick={() => showToast("📋 已複製至剪貼板")} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 7, background: "none", border: `1px solid ${D.border}`, cursor: "pointer", fontSize: 11, fontWeight: 600, color: D.text3, fontFamily: F, whiteSpace: "nowrap" as const, flexShrink: 0 }}>
                  <Copy size={11} /> {isMobile ? "複製" : "複製全文"}
                </button>
              </div>

              {/* Document canvas */}
              <div style={{ flex: isMobile ? "none" : 1, overflowY: isMobile ? "visible" : "auto", padding: isMobile ? "16px 12px" : "36px 40px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                {isGenerating && (
                  <div style={{ position: "absolute", inset: 0, zIndex: 20, background: "rgba(248,250,252,0.90)", backdropFilter: "blur(4px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18 }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      {[0,1,2,3,4].map(i => (
                        <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: D.ai, opacity: 0.7 }} />
                      ))}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: D.text2 }}>AI 正在根據參數生成草稿…</div>
                    <div style={{ fontSize: 12, color: D.text4 }}>語氣: {tone} · 字數: ~{wordTarget} · 場景: {scenario.split(" ")[0]}</div>
                  </div>
                )}

                {/* Paper */}
                <div style={{ width: "100%", maxWidth: 720, background: D.surface, borderRadius: 12, boxShadow: "0 2px 8px rgba(15,23,42,0.07), 0 6px 24px rgba(15,23,42,0.05)", border: `1px solid ${D.border}`, overflow: "hidden" }}>
                  {generationDone && (
                    <div style={{ padding: "8px 24px", background: "linear-gradient(90deg, #EEF2FF, #F5F3FF, #ECFDF5)", borderBottom: `1px solid ${D.aiBorder}`, display: "flex", alignItems: "center", gap: 8 }}>
                      <Sparkles size={12} color={D.ai} style={{ animation: "sparkleFloat 3s ease-in-out infinite" }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: D.ai }}>AI 生成內容</span>
                      <span style={{ fontSize: 10, color: "#7C3AED" }}>· 場景: {scenario.split(" ")[0]} · 語氣: {tone.split(" ")[0]} · ~{wordTarget}字</span>
                      <span style={{ marginLeft: "auto", fontSize: 10, color: D.text4, display: "flex", alignItems: "center", gap: 4 }}>
                        <Info size={10} color={D.text4} /> 請覆核後使用
                      </span>
                    </div>
                  )}
                  <div style={{ padding: isMobile ? "20px 18px 28px" : "40px 52px 48px", position: "relative" }}>
                    <div style={{ textAlign: "center", marginBottom: 32, paddingBottom: 20, borderBottom: `2px solid #F1F5F9` }}>
                      <div style={{ fontSize: 16, fontWeight: 900, color: D.text1, letterSpacing: "0.04em", marginBottom: 4 }}>香港神託會培敦中學</div>
                      <div style={{ fontSize: 11.5, color: D.text3, marginBottom: 8 }}>Stewards Pooi Tun Secondary School</div>
                      <div style={{ display: "inline-block", padding: "3px 16px", background: D.aiLight, border: `1px solid ${D.aiBorder}`, borderRadius: 999, fontSize: 11, fontWeight: 700, color: D.ai }}>✉️ 推薦信 / Recommendation Letter</div>
                    </div>
                    <div style={{ marginBottom: 22 }}>
                      <div style={{ textAlign: "right", fontSize: 13, color: D.text3, marginBottom: 12 }}>二○二六年八月十八日</div>
                      <div style={{ fontSize: 13, color: D.text2, lineHeight: 1.8 }}>香港中學生科學夏令營<br />主辦機構 負責人 敬啟</div>
                      <div style={{ marginTop: 10, padding: "8px 14px", background: "#FAFAFA", border: `1px solid ${D.border}`, borderRadius: 7, fontSize: 12, color: D.text3 }}>
                        <span style={{ fontWeight: 600, color: D.text2 }}>事由：</span>推薦 陳大文 同學 — 2026 全港中學生科學夏令營
                      </div>
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: D.text1, marginBottom: 18 }}>致 敬啟者：</p>
                    {LETTER.filter(p => p.type === "body").map((para) => (
                      <div key={para.id} style={{ position: "relative", marginBottom: 4 }}>
                        {para.aiTag && !isMobile && (
                          <div style={{ position: "absolute", right: -140, top: 4 }}>
                            <AITagPill label={para.aiTag} />
                          </div>
                        )}
                        {para.highlight ? (
                          <HighlightedParagraph para={para} showToolbar={showToolbar} onToolbarAction={handleToolbarAction} />
                        ) : (
                          <p style={{ margin: "0 0 16px", fontSize: 14, lineHeight: 2.05, color: D.text1, fontFamily: F }}>{para.content}</p>
                        )}
                      </div>
                    ))}
                    <p style={{ fontSize: 14, color: D.text2, marginTop: 24, marginBottom: 28 }}>謹此</p>
                    <div style={{ padding: "18px 20px", background: "#FAFAFA", border: `1px solid ${D.border}`, borderRadius: 10, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
                      <div>
                        <div style={{ fontSize: 11, color: D.text4, marginBottom: 6 }}>簽署人 / Signatory</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: D.text1 }}>陳 志 明 老師</div>
                        <div style={{ fontSize: 11.5, color: D.text3 }}>副校長（學術）· Vice Principal (Academic)</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: D.text4, marginBottom: 6 }}>聯絡方式 / Contact</div>
                        <div style={{ fontSize: 11.5, color: D.text2, lineHeight: 1.8 }}>📞 (852) 2345-6789<br />✉️ cmchan@spoitun.edu.hk</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Generation History ────────────────────────────────── */}
                <div style={{ width: "100%", maxWidth: 720, marginTop: 24 }}>
                  <button
                    onClick={() => setShowHistory(v => !v)}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", background: D.surface, border: `1px solid ${D.border}`, borderRadius: showHistory ? "12px 12px 0 0" : 12, cursor: "pointer", fontFamily: F, transition: "all 0.15s" }}
                  >
                    <History size={14} color={D.text3} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: D.text2, flex: 1, textAlign: "left" }}>生成紀錄</span>
                    <span style={{ fontSize: 10, color: D.text4, marginRight: 4 }}>Generation Record · {genHistory.length} 筆</span>
                    {showHistory ? <ChevronUp size={14} color={D.text4} /> : <ChevronDown size={14} color={D.text4} />}
                  </button>

                  {showHistory && (
                    <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderTop: "none", borderRadius: "0 0 12px 12px", overflow: "hidden" }}>
                      {/* Export ZIP button */}
                      <div style={{ padding: "10px 16px", borderBottom: `1px solid ${D.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: "#FAFAFA" }}>
                        <span style={{ fontSize: 11, color: D.text4 }}>選擇多筆記錄後可批量匯出</span>
                        <button onClick={() => showToast("📦 正在打包 ZIP，請稍候…")} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: "linear-gradient(135deg, #4F46E5, #6366F1)", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#fff", fontFamily: F, boxShadow: "0 2px 8px rgba(99,102,241,0.35)" }}>
                          <Archive size={12} /> 匯出 ZIP / Download All
                        </button>
                      </div>
                      {/* Table */}
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: F, fontSize: 12 }}>
                          <thead>
                            <tr style={{ background: "#F8FAFC" }}>
                              {["", "類型", "對象", "場景", "字數", "版本", "時間", "操作"].map(h => (
                                <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 10.5, fontWeight: 700, color: D.text3, borderBottom: `1px solid ${D.border}`, whiteSpace: "nowrap" }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {genHistory.map((rec, ri) => (
                              <tr key={rec.id} style={{ borderBottom: ri < genHistory.length - 1 ? `1px solid ${D.border}` : "none" }}
                                onMouseEnter={e => (e.currentTarget.style.background = "#F8FAFC")}
                                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                              >
                                <td style={{ padding: "8px 12px" }}><input type="checkbox" style={{ cursor: "pointer" }} /></td>
                                <td style={{ padding: "8px 12px" }}>
                                  <span style={{ padding: "2px 8px", borderRadius: 5, background: D.aiLight, border: `1px solid ${D.aiBorder}`, fontSize: 10.5, fontWeight: 700, color: D.ai }}>{rec.type}</span>
                                </td>
                                <td style={{ padding: "8px 12px", color: D.text2, fontWeight: 600 }}>{rec.student}</td>
                                <td style={{ padding: "8px 12px", color: D.text3, fontSize: 11.5 }}>{rec.scenario}</td>
                                <td style={{ padding: "8px 12px", color: D.text3, fontSize: 11.5, display: "flex", alignItems: "center", gap: 3 }}>
                                  <Hash size={10} color={D.text4} />{rec.words}
                                </td>
                                <td style={{ padding: "8px 12px" }}>
                                  <span style={{ fontSize: 10.5, fontWeight: 700, color: "#7C3AED", background: "#EDE9FE", padding: "1px 6px", borderRadius: 4 }}>{rec.version}</span>
                                </td>
                                <td style={{ padding: "8px 12px", color: D.text4, fontSize: 11, display: "flex", alignItems: "center", gap: 3, whiteSpace: "nowrap" }}>
                                  <Calendar size={10} color={D.text4} />{rec.ts}
                                </td>
                                <td style={{ padding: "8px 12px" }}>
                                  <button onClick={() => showToast(`📥 ${rec.type} 已下載`)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", background: "#F1F5F9", border: `1px solid ${D.border}`, borderRadius: 6, cursor: "pointer", fontSize: 11, color: D.text2, fontFamily: F }}>
                                    <Download size={11} /> 下載
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
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}><div style={{ width: 7, height: 7, borderRadius: "50%", background: D.emerald }} /><span style={{ fontSize: 10.5, color: D.text4 }}>已儲存</span></div>
                  <div style={{ width: 1, height: 14, background: D.border }} />
                  <span style={{ fontSize: 10.5, color: D.text3 }}>字數：<strong style={{ color: D.text2 }}>{docWordCount}</strong> 字</span>
                  <span style={{ fontSize: 10.5, color: D.text3 }}>版本：<strong style={{ color: D.ai }}>V{activeVersion}</strong></span>
                  <span style={{ fontSize: 10.5, color: D.text3 }}>語氣：<strong style={{ color: D.text2 }}>{tone.split(" ")[0]}</strong></span>
                  <span style={{ fontSize: 10.5, color: D.text3 }}>場景：<strong style={{ color: D.text2 }}>{scenario.split(" ")[0]}</strong></span>
                  <div style={{ flex: 1 }} />
                  <button onClick={handleGenerate} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: `1px solid ${D.aiBorder}`, borderRadius: 6, padding: "3px 10px", fontSize: 10, fontWeight: 600, color: D.ai, cursor: "pointer", fontFamily: F }}>
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

      {/* ── Toast ──────────────────────────────────────────────────────────── */}
      {toastMsg && (
        <div style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", zIndex: 9999, animation: "toastSlide 0.28s cubic-bezier(0.34,1.56,0.64,1) forwards", pointerEvents: "none" }}>
          <div style={{ padding: "9px 20px", background: "#1E293B", borderRadius: 999, color: "#F8FAFC", fontSize: 12.5, fontWeight: 600, boxShadow: "0 8px 28px rgba(15,23,42,0.28)", border: "1px solid rgba(255,255,255,0.08)", whiteSpace: "nowrap" }}>{toastMsg}</div>
        </div>
      )}
    </div>
  );
};
