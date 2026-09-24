// ─────────────────────────────────────────────────────────────────────────────
// Screen: API 接口文檔與測試台 — Developer Portal · API Docs & Playground
// Frame: 系統管理 > API 文檔 (3-column Stoplight-style)
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect } from "react";
import { ERP } from "./erpTokens";
import {
  Search, Copy, Check, ChevronRight, ChevronDown,
  Send, Code2, BookOpen, Webhook, KeyRound, Layers,
  AlertCircle, CheckCircle2, Lock, Globe,
} from "lucide-react";

// ── Design Tokens ─────────────────────────────────────────────────────────────
const F    = ERP.font.family;
const MONO = ERP.font.mono;
const C    = ERP.colors;
const R    = ERP.radius;

// ── Dark playground theme (Stoplight-inspired) ────────────────────────────────
const DK = {
  page:    "#080F1C",
  surface: "#0F172A",
  card:    "#1A2540",
  panel:   "#111827",
  border:  "#1E293B",
  border2: "#263352",
  text:    "#E2E8F0",
  muted:   "#64748B",
  subtle:  "#94A3B8",
  accent:  "#38BDF8",
  green:   "#4ADE80",
  input:   "#0D1117",
  inputBorder: "#2D3F5E",
};

// ── Method badge colours ──────────────────────────────────────────────────────
type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
const METHOD: Record<HttpMethod, { bg: string; color: string; border: string; darkBg: string; darkColor: string }> = {
  GET:    { bg: "#DCFCE7", color: "#15803D", border: "#86EFAC", darkBg: "rgba(74,222,128,0.14)", darkColor: "#4ADE80" },
  POST:   { bg: "#DBEAFE", color: "#1D4ED8", border: "#93C5FD", darkBg: "rgba(96,165,250,0.14)", darkColor: "#60A5FA" },
  PUT:    { bg: "#FFEDD5", color: "#C2410C", border: "#FDBA74", darkBg: "rgba(251,146,60,0.14)",  darkColor: "#FB923C" },
  DELETE: { bg: "#FEE2E2", color: "#B91C1C", border: "#FCA5A5", darkBg: "rgba(248,113,113,0.14)", darkColor: "#F87171" },
  PATCH:  { bg: "#EDE9FE", color: "#6D28D9", border: "#C4B5FD", darkBg: "rgba(167,139,250,0.14)", darkColor: "#A78BFA" },
};

// ── Endpoint data model ───────────────────────────────────────────────────────
interface Endpoint { id: string; method: HttpMethod; path: string; label: string }
interface EndpointGroup { id: string; zh: string; en: string; endpoints: Endpoint[] }

const GROUPS: EndpointGroup[] = [
  {
    id: "students", zh: "學生數據", en: "Students",
    endpoints: [
      { id: "list-students",  method: "GET",  path: "/api/v1/students",      label: "List Students"    },
      { id: "get-student",    method: "GET",  path: "/api/v1/students/{id}", label: "Get Student"      },
    ],
  },
  {
    id: "achievements", zh: "成就紀錄", en: "Achievements",
    endpoints: [
      { id: "list-achv",   method: "GET",    path: "/api/v1/achievements",       label: "List Achievements" },
      { id: "create-achv", method: "POST",   path: "/api/v1/achievements",       label: "Create Record"     },
      { id: "update-achv", method: "PUT",    path: "/api/v1/achievements/{id}",  label: "Update Record"     },
      { id: "delete-achv", method: "DELETE", path: "/api/v1/achievements/{id}",  label: "Delete Record"     },
    ],
  },
  {
    id: "attendance", zh: "考勤數據", en: "Attendance",
    endpoints: [
      { id: "daily-att", method: "GET", path: "/api/v1/attendance/daily", label: "Daily Attendance" },
    ],
  },
];

// ── Parameter definitions (for list-students endpoint) ────────────────────────
const PARAMS = [
  { name: "class_id",  type: "string",  nullable: true,  maxLen: "5",    desc: "篩選特定班級，例如 \"1A\", \"2B\"。",         example: "3A"  },
  { name: "keyword",   type: "string",  nullable: true,  maxLen: "128",  desc: "搜尋學生姓名或學號（模糊匹配）。",             example: "Chan" },
  { name: "page",      type: "integer", nullable: true,  min: "1",       desc: "分頁頁碼，預設為 1。",                        example: "1"   },
  { name: "per_page",  type: "integer", nullable: true,  min: "1", max: "100", desc: "每頁顯示數量，預設 20，最大 100。",      example: "20"  },
];

// ── JSON Syntax Highlighter (static) ─────────────────────────────────────────
const JsonBlock: React.FC<{ children: string }> = ({ children }) => {
  const lines = children.split("\n");
  return (
    <code style={{ display: "block", fontFamily: MONO, fontSize: 12, lineHeight: 1.75 }}>
      {lines.map((line, i) => {
        const parts: React.ReactNode[] = [];
        let rest = line;
        let key = 0;

        // Colorize indent
        const indent = rest.match(/^(\s+)/)?.[1] ?? "";
        rest = rest.slice(indent.length);
        if (indent) parts.push(<span key={key++}>{indent}</span>);

        // Key: "xxx":
        const keyMatch = rest.match(/^("[\w_]+")(\s*:\s*)/);
        if (keyMatch) {
          parts.push(<span key={key++} style={{ color: "#7DD3FC" }}>{keyMatch[1]}</span>);
          parts.push(<span key={key++} style={{ color: DK.muted }}>{keyMatch[2]}</span>);
          rest = rest.slice(keyMatch[0].length);
        }

        // Value: string / number / null / bool / brace
        if (/^"/.test(rest)) {
          const strMatch = rest.match(/^("[^"]*")(,?)$/);
          if (strMatch) {
            parts.push(<span key={key++} style={{ color: "#86EFAC" }}>{strMatch[1]}</span>);
            if (strMatch[2]) parts.push(<span key={key++} style={{ color: DK.muted }}>{strMatch[2]}</span>);
            rest = "";
          }
        } else if (/^\d/.test(rest)) {
          const numMatch = rest.match(/^(\d+)(,?)$/);
          if (numMatch) {
            parts.push(<span key={key++} style={{ color: "#FCA5A5" }}>{numMatch[1]}</span>);
            if (numMatch[2]) parts.push(<span key={key++} style={{ color: DK.muted }}>{numMatch[2]}</span>);
            rest = "";
          }
        } else if (/^(null|true|false)/.test(rest)) {
          parts.push(<span key={key++} style={{ color: "#C4B5FD" }}>{rest}</span>);
          rest = "";
        }

        if (rest) parts.push(<span key={key++} style={{ color: DK.text }}>{rest}</span>);

        return <div key={i} style={{ minHeight: "1em" }}>{parts}</div>;
      })}
    </code>
  );
};

// ── MethodBadge ───────────────────────────────────────────────────────────────
const MethodBadge: React.FC<{ method: HttpMethod; size?: "sm" | "md"; dark?: boolean }> = ({
  method, size = "md", dark = false,
}) => {
  const m = METHOD[method];
  const isSmall = size === "sm";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      padding: isSmall ? "1px 5px" : "2px 7px",
      borderRadius: R.xs,
      background: dark ? m.darkBg : m.bg,
      border: `1px solid ${dark ? "transparent" : m.border}`,
      fontSize: isSmall ? 9.5 : 11,
      fontWeight: 800, letterSpacing: "0.05em",
      color: dark ? m.darkColor : m.color,
      fontFamily: MONO,
      whiteSpace: "nowrap" as const,
    }}>
      {method}
    </span>
  );
};

// ── CopyButton ────────────────────────────────────────────────────────────────
const CopyButton: React.FC<{ text: string; dark?: boolean }> = ({ text, dark = false }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button
      onClick={copy}
      title="Copy"
      style={{
        display: "flex", alignItems: "center", gap: 4,
        padding: "4px 8px", borderRadius: R.sm, border: "none",
        background: copied
          ? (dark ? "rgba(74,222,128,0.15)" : "#F0FDF4")
          : (dark ? "rgba(255,255,255,0.06)" : C.pageBg),
        color: copied ? (dark ? "#4ADE80" : "#15803D") : (dark ? DK.muted : C.textMuted),
        cursor: "pointer", transition: "all 0.18s", fontSize: 11, fontFamily: F,
      }}
      onMouseEnter={e => { if (!copied) e.currentTarget.style.background = dark ? "rgba(255,255,255,0.1)" : C.border; }}
      onMouseLeave={e => { if (!copied) e.currentTarget.style.background = dark ? "rgba(255,255,255,0.06)" : C.pageBg; }}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
};

// ── Status Badge ──────────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ code: number; label: string }> = ({ code, label }) => {
  const cfg =
    code < 300 ? { bg: "#DCFCE7", color: "#15803D", border: "#86EFAC" } :
    code < 400 ? { bg: "#DBEAFE", color: "#1D4ED8", border: "#93C5FD" } :
    code < 500 ? { bg: "#FFEDD5", color: "#C2410C", border: "#FDBA74" } :
                 { bg: "#FEE2E2", color: "#B91C1C", border: "#FCA5A5" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "4px 12px", borderRadius: R.full,
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      fontSize: 12, fontWeight: 700, color: cfg.color, fontFamily: MONO,
    }}>
      <span style={{ fontWeight: 900 }}>{code}</span>
      <span style={{ fontWeight: 500 }}>{label}</span>
    </span>
  );
};

// ── SectionDivider ────────────────────────────────────────────────────────────
const SectionDivider: React.FC<{ icon: React.ReactNode; zh: string; en: string }> = ({ icon, zh, en }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: 8,
    marginBottom: 14,
    paddingBottom: 10, borderBottom: `1px solid ${C.border}`,
  }}>
    {icon}
    <span style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary, fontFamily: F }}>{zh}</span>
    <span style={{ fontSize: 11, color: C.textMuted, fontFamily: F }}>· {en}</span>
  </div>
);

// ── Main Screen ────────────────────────────────────────────────────────────────
export const Screen_APIDocs: React.FC = () => {
  const [activeId,       setActiveId]       = useState("list-students");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["students"]));
  const [sideSearch,     setSideSearch]     = useState("");
  const [activeTab,      setActiveTab]      = useState("docs");
  const [params,         setParams]         = useState({ class_id: "3A", keyword: "", page: "1" });
  const [responseSent,   setResponseSent]   = useState(false);
  const [sending,        setSending]        = useState(false);
  const [expandedResp,   setExpandedResp]   = useState<Set<number>>(new Set([200]));
  const [isMobile,       setIsMobile]       = useState(false);
  const [sidebarOpen,    setSidebarOpen]    = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const toggleGroup = (id: string) =>
    setExpandedGroups(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });

  const toggleResp = (code: number) =>
    setExpandedResp(prev => {
      const s = new Set(prev);
      s.has(code) ? s.delete(code) : s.add(code);
      return s;
    });

  const handleSend = () => {
    setSending(true);
    setTimeout(() => { setSending(false); setResponseSent(true); }, 1100);
  };

  const CURL_TEXT = `curl --request GET \\
  --url 'https://api.stewards.edu.hk/api/v1/students?class_id=${params.class_id || "3A"}&page=${params.page || "1"}' \\
  --header 'Accept: application/json' \\
  --header 'Authorization: Bearer YOUR_TOKEN_HERE'`;

  const RESPONSE_JSON = `{
  "status": "success",
  "data": [
    {
      "student_id": "2024001",
      "name_zh": "陳大文",
      "name_en": "Chan Tai Man",
      "class": "3A",
      "class_no": 1
    },
    {
      "student_id": "2024002",
      "name_zh": "李美玲",
      "name_en": "Lee Mei Ling",
      "class": "3A",
      "class_no": 2
    }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 20,
    "total": 32
  }
}`;

  const TABS = [
    { id: "overview", zh: "API 總覽",    icon: <Layers size={13} />    },
    { id: "webhooks", zh: "Webhook 管理", icon: <Webhook size={13} />   },
    { id: "docs",     zh: "接口文檔",     icon: <BookOpen size={13} />  },
    { id: "tokens",   zh: "存取權杖",     icon: <KeyRound size={13} />  },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: isMobile ? "auto" : "calc(100vh - 56px)", minHeight: isMobile ? "100%" : undefined, overflow: isMobile ? "visible" : "hidden", background: C.pageBg, fontFamily: F }}>

      {/* ── Sub-header ────────────────────────────────────────────────────── */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        {/* Breadcrumbs — desktop only */}
        {!isMobile && (
          <div style={{ padding: "10px 24px 0", display: "flex", alignItems: "center", gap: 4 }}>
            {["首頁", "系統管理", "同步與權限", "API 與自動化串接", "接口文檔"].map((crumb, i, arr) => (
              <React.Fragment key={crumb}>
                <span style={{ fontSize: 11.5, fontFamily: F, color: i === arr.length - 1 ? C.accent : C.textMuted, fontWeight: i === arr.length - 1 ? 700 : 400, cursor: i < arr.length - 1 ? "pointer" : "default" }}>{crumb}</span>
                {i < arr.length - 1 && <ChevronRight size={11} color={C.textDisabled} />}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Tab nav */}
        <div style={{ padding: isMobile ? "0 12px" : "0 24px", display: "flex", alignItems: "flex-end", gap: 0, marginTop: isMobile ? 0 : 8, overflowX: isMobile ? "auto" : undefined, WebkitOverflowScrolling: "touch" as any }}>
          {TABS.map(tab => {
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ display: "flex", alignItems: "center", gap: 6, padding: isMobile ? "10px 14px" : "9px 16px", border: "none", borderBottom: active ? `2px solid ${C.accent}` : "2px solid transparent", background: "transparent", fontSize: isMobile ? 12 : 13, fontWeight: active ? 700 : 500, color: active ? C.accent : C.textSecondary, cursor: "pointer", fontFamily: F, transition: "all 0.12s", marginBottom: -1, whiteSpace: "nowrap" as const }}>
                {tab.icon}
                {tab.zh}
              </button>
            );
          })}
          {/* Base URL chip — desktop only */}
          {!isMobile && (
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, paddingBottom: 8 }}>
              <Globe size={11} color={C.textMuted} />
              <span style={{ fontFamily: MONO, fontSize: 11, color: C.textMuted }}>https://api.stewards.edu.hk</span>
              <span style={{ padding: "1px 7px", borderRadius: R.full, background: "#DCFCE7", border: "1px solid #86EFAC", fontSize: 9.5, fontWeight: 700, color: "#15803D", fontFamily: MONO }}>v1</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Security Warning Banner ───────────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "flex-start", gap: 12,
        padding: "13px 24px 13px",
        background: "linear-gradient(135deg, #FFF7ED, #FEF3C7)",
        borderBottom: "2px solid #FDE68A",
        flexShrink: 0,
      }}>
        {/* Icon */}
        <div style={{
          width: 36, height: 36, borderRadius: 9, flexShrink: 0,
          background: "#FEF3C7", border: "1.5px solid #FDE68A",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, lineHeight: 1,
        }}>⚠️</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" as const, marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: "#92400E", fontFamily: F }}>
              資安警告 · Security Warning
            </span>
            <span style={{
              fontSize: 9.5, fontWeight: 700, padding: "1px 8px",
              background: "#FDE68A", border: "1px solid #F59E0B",
              borderRadius: 4, color: "#78350F", fontFamily: F, letterSpacing: "0.04em",
            }}>PERSISTENT · 常駐提示</span>
            <AlertCircle size={13} color="#D97706" />
          </div>
          <p style={{ margin: 0, fontSize: 12.5, color: "#78350F", lineHeight: 1.65, fontFamily: F }}>
            <strong>切勿將 API Token 直接交予外部公開 AI 工具</strong>（例如 Gemini / ChatGPT 等公眾平台），以免洩漏學生個人私隱資料（PDPO 法律責任）。
            請改用本系統内置的 <strong>AI 數據助手（AI Data Assistant）</strong>，或由 IT 部門統一管理及輪換 Token。
          </p>
          <p style={{ margin: "4px 0 0", fontSize: 11, color: "#B45309", fontFamily: F }}>
            Do not pass your API Token to external public AI platforms — this risks leaking student personal data (PDPO breach). Use the internal AI Data Assistant or manage tokens securely via IT.
          </p>
        </div>
        {/* Lock icon badge */}
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 3, flexShrink: 0,
        }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: "#FEF3C7", border: "1.5px solid #FDE68A", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Lock size={16} color="#D97706" />
          </div>
          <span style={{ fontSize: 8.5, fontWeight: 700, color: "#B45309", fontFamily: F }}>PDPO</span>
        </div>
      </div>

      {/* ── 3-column body ─────────────────────────────────────────────────── */}
      <div style={{ flex: isMobile ? "none" : 1, display: "flex", flexDirection: isMobile ? "column" : "row", overflow: isMobile ? "visible" : "hidden" }}>

        {/* ══ LEFT: Endpoint Sidebar ══════════════════════════════════════════ */}
        {/* Mobile toggle bar */}
        {isMobile && (
          <button
            onClick={() => setSidebarOpen(v => !v)}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 8,
              padding: "10px 16px",
              background: C.surface,
              border: "none",
              borderBottom: `1px solid ${C.border}`,
              cursor: "pointer", textAlign: "left" as const,
              flexShrink: 0,
            }}
          >
            <Layers size={13} color={C.accent} />
            <span style={{ flex: 1, fontSize: 12.5, fontWeight: 700, color: C.textPrimary, fontFamily: F }}>
              接口列表 Endpoints
            </span>
            <span style={{
              padding: "1px 7px", borderRadius: R.full,
              background: C.accentPale, border: `1px solid ${C.accentLight}`,
              fontSize: 10, fontWeight: 700, color: C.accent, fontFamily: MONO,
            }}>
              {GROUPS.reduce((sum, g) => sum + g.endpoints.length, 0)}
            </span>
            {sidebarOpen
              ? <ChevronDown size={14} color={C.textMuted} />
              : <ChevronRight size={14} color={C.textMuted} />
            }
          </button>
        )}
        <div style={{ width: isMobile ? "100%" : 240, flexShrink: 0, borderRight: isMobile ? "none" : `1px solid ${C.border}`, borderBottom: isMobile && sidebarOpen ? `1px solid ${C.border}` : "none", background: C.surface, display: isMobile && !sidebarOpen ? "none" : "flex", flexDirection: "column", overflow: isMobile ? "visible" : "hidden", maxHeight: isMobile ? 280 : undefined, overflowY: isMobile ? "auto" : undefined }}>
          {/* Section title + search */}
          <div style={{ padding: "14px 14px 10px", flexShrink: 0, borderBottom: `1px solid ${C.border}` }}>
            <div style={{
              fontSize: 9.5, fontWeight: 800, color: C.textMuted,
              letterSpacing: "0.1em", textTransform: "uppercase" as const,
              marginBottom: 8, fontFamily: F,
            }}>
              ENDPOINTS
            </div>
            <div style={{ position: "relative" }}>
              <Search size={12} style={{
                position: "absolute", left: 9, top: "50%",
                transform: "translateY(-50%)",
                color: C.textMuted, pointerEvents: "none",
              }} />
              <input
                value={sideSearch}
                onChange={e => setSideSearch(e.target.value)}
                placeholder="搜尋接口…"
                style={{
                  width: "100%", boxSizing: "border-box" as const,
                  height: 30, paddingLeft: 28, paddingRight: 8,
                  border: `1px solid ${C.border}`, borderRadius: R.md,
                  background: C.pageBg, fontSize: 11.5, fontFamily: F,
                  color: C.textPrimary, outline: "none",
                }}
                onFocus={e => (e.currentTarget.style.borderColor = C.accent)}
                onBlur={e => (e.currentTarget.style.borderColor = C.border)}
              />
            </div>
          </div>

          {/* Endpoint groups */}
          <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
            {GROUPS.map(group => {
              const expanded = expandedGroups.has(group.id);
              const filtered = group.endpoints.filter(ep =>
                !sideSearch ||
                ep.path.toLowerCase().includes(sideSearch.toLowerCase()) ||
                ep.label.toLowerCase().includes(sideSearch.toLowerCase())
              );
              if (filtered.length === 0 && sideSearch) return null;
              return (
                <div key={group.id}>
                  {/* Group header */}
                  <button
                    onClick={() => toggleGroup(group.id)}
                    style={{
                      width: "100%", display: "flex", alignItems: "center",
                      padding: "7px 14px", gap: 6,
                      background: "none", border: "none", cursor: "pointer",
                      textAlign: "left" as const,
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = C.surfaceHover)}
                    onMouseLeave={e => (e.currentTarget.style.background = "none")}
                  >
                    {expanded
                      ? <ChevronDown  size={11} color={C.textMuted} />
                      : <ChevronRight size={11} color={C.textMuted} />
                    }
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: C.textSecondary, fontFamily: F, flex: 1 }}>
                      {group.en}
                    </span>
                    <span style={{ fontSize: 10, color: C.textDisabled, fontFamily: F }}>{group.zh}</span>
                    <span style={{
                      marginLeft: 4,
                      padding: "1px 5px", borderRadius: R.xs,
                      background: C.pageBg, border: `1px solid ${C.border}`,
                      fontSize: 9.5, fontWeight: 700, color: C.textMuted, fontFamily: MONO,
                    }}>
                      {group.endpoints.length}
                    </span>
                  </button>

                  {/* Endpoints */}
                  {expanded && filtered.map(ep => {
                    const isActive = activeId === ep.id;
                    return (
                      <button
                        key={ep.id}
                        onClick={() => setActiveId(ep.id)}
                        style={{
                          width: "100%", display: "flex", alignItems: "center",
                          padding: "7px 14px 7px 28px", gap: 8,
                          background: isActive ? C.accentPale : "none",
                          borderLeft: isActive ? `2.5px solid ${C.accent}` : "2.5px solid transparent",
                          border: "none", cursor: "pointer",
                          textAlign: "left" as const,
                          transition: "all 0.1s",
                        }}
                        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = C.surfaceHover; }}
                        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "none"; }}
                      >
                        <MethodBadge method={ep.method} size="sm" />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontFamily: MONO, fontSize: 11,
                            color: isActive ? C.accent : C.textPrimary,
                            fontWeight: isActive ? 700 : 400,
                            overflow: "hidden", textOverflow: "ellipsis",
                            whiteSpace: "nowrap" as const,
                          }}>
                            {ep.path}
                          </div>
                          <div style={{ fontSize: 10, color: C.textMuted, fontFamily: F, marginTop: 1 }}>
                            {ep.label}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* ══ MIDDLE: Endpoint Documentation ══════════════════════════════════ */}
        <div style={{ flex: isMobile ? "none" : "0 0 45%", minWidth: 0, borderRight: isMobile ? "none" : `1px solid ${C.border}`, borderBottom: isMobile ? `1px solid ${C.border}` : "none", overflowY: isMobile ? "visible" : "auto", background: C.surface }}>
          <div style={{ padding: isMobile ? "16px 16px 28px" : "24px 28px 40px" }}>

            {/* Endpoint title */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                <MethodBadge method="GET" />
                <span style={{ fontFamily: MONO, fontSize: isMobile ? 14 : 17, fontWeight: 700, color: C.textPrimary, wordBreak: "break-all" }}>
                  /api/v1/students
                </span>
              </div>
              <h1 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 800, color: C.textPrimary, fontFamily: F, letterSpacing: "-0.3px" }}>
                List students (paginated)
              </h1>
              <p style={{ margin: 0, fontSize: 13, color: C.textSecondary, fontFamily: F, lineHeight: 1.7 }}>
                獲取全校或指定班級的學生名單，支援分頁與關鍵字搜尋。
                <span style={{ color: C.textMuted, marginLeft: 6 }}>
                  Returns paginated student records with optional class filter and keyword search.
                </span>
              </p>
            </div>

            {/* Endpoint URL box */}
            <div style={{
              padding: "10px 14px",
              background: C.pageBg, border: `1px solid ${C.border}`,
              borderRadius: R.md, marginBottom: 28,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <MethodBadge method="GET" />
                <Lock size={11} color={C.textMuted} style={{ flexShrink: 0 }} />
                <span style={{ fontFamily: MONO, fontSize: 12, color: C.textSecondary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>
                  {isMobile ? "api.stewards.edu.hk" : "https://api.stewards.edu.hk"}
                </span>
                <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: C.textPrimary, whiteSpace: "nowrap" }}>
                  /api/v1/students
                </span>
                <div style={{ marginLeft: "auto" }}>
                  <CopyButton text="https://api.stewards.edu.hk/api/v1/students" />
                </div>
              </div>
            </div>

            {/* ── Request Parameters ── */}
            <SectionDivider icon={<Code2 size={12} />} zh="Request 請求參數" en="Query Parameters" />

            <div style={{
              border: `1px solid ${C.border}`, borderRadius: R.lg,
              overflow: "hidden", marginBottom: 28,
            }}>
              {/* Table header */}
              {!isMobile && <div style={{ display: "grid", gridTemplateColumns: "160px 80px 60px 1fr", padding: "8px 16px", background: C.pageBg, borderBottom: `1px solid ${C.border}` }}>
                {[
                  { zh: "參數名稱", en: "Name"     },
                  { zh: "類型",     en: "Type"     },
                  { zh: "必填",     en: "Required" },
                  { zh: "說明",     en: "Description" },
                ].map(col => (
                  <div key={col.zh} style={{
                    fontSize: 10, fontWeight: 700, color: C.textMuted,
                    fontFamily: F, letterSpacing: "0.05em",
                    textTransform: "uppercase" as const,
                  }}>
                    {col.zh}
                    <span style={{ fontWeight: 400, marginLeft: 3, color: C.textDisabled }}>{col.en}</span>
                  </div>
                ))}
              </div>}

              {PARAMS.map((p, i) => (
                <div
                  key={p.name}
                  style={{
                    display: isMobile ? "flex" : "grid",
                    flexDirection: isMobile ? "column" : undefined,
                    gridTemplateColumns: isMobile ? undefined : "160px 80px 60px 1fr",
                    padding: "13px 16px",
                    borderBottom: i < PARAMS.length - 1 ? `1px solid ${C.divider}` : "none",
                    background: i % 2 === 0 ? C.surface : "#FAFBFC",
                    alignItems: "flex-start",
                    transition: "background 0.08s",
                    gap: isMobile ? 6 : undefined,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = C.accentPale)}
                  onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? C.surface : "#FAFBFC")}
                >
                  {/* Name */}
                  <div>
                    <span style={{
                      fontFamily: MONO, fontSize: 12.5, fontWeight: 700,
                      color: C.textPrimary, background: C.pageBg,
                      padding: "2px 7px", borderRadius: R.sm,
                      border: `1px solid ${C.border}`,
                    }}>
                      {p.name}
                    </span>
                  </div>
                  {/* Type */}
                  <div>
                    <span style={{
                      fontSize: 11, fontFamily: MONO,
                      color: ERP.colors.purple, fontWeight: 600,
                    }}>
                      {p.type}{p.nullable ? " | null" : ""}
                    </span>
                  </div>
                  {/* Required */}
                  <div>
                    <span style={{
                      fontSize: 10, fontWeight: 700, fontFamily: F,
                      color: C.textMuted,
                      padding: "1px 5px", borderRadius: R.xs,
                      background: C.pageBg, border: `1px solid ${C.border}`,
                    }}>
                      選填
                    </span>
                  </div>
                  {/* Description */}
                  <div style={{ fontSize: 12, color: C.textSecondary, fontFamily: F, lineHeight: 1.6 }}>
                    {p.desc}
                    <div style={{ marginTop: 4, display: "flex", gap: 6, flexWrap: "wrap" as const }}>
                      {p.maxLen && (
                        <span style={{ fontSize: 10.5, color: C.textMuted, fontFamily: MONO }}>
                          max: {p.maxLen} chars
                        </span>
                      )}
                      {p.min && (
                        <span style={{ fontSize: 10.5, color: C.textMuted, fontFamily: MONO }}>
                          min: {p.min}
                        </span>
                      )}
                      {p.max && (
                        <span style={{ fontSize: 10.5, color: C.textMuted, fontFamily: MONO }}>
                          max: {p.max}
                        </span>
                      )}
                      <span style={{ fontSize: 10.5, color: C.textDisabled, fontFamily: MONO }}>
                        e.g. "{p.example}"
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Authentication ── */}
            <div style={{
              padding: "10px 14px", marginBottom: 28,
              background: "#FFFBEB", border: "1px solid #FDE68A",
              borderRadius: R.md, display: "flex", alignItems: "flex-start", gap: 8,
            }}>
              <Lock size={13} color="#D97706" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ margin: 0, fontSize: 12, color: "#78350F", fontFamily: F, lineHeight: 1.6 }}>
                <strong>身份驗證要求：</strong>此接口需要在 <code style={{ fontFamily: MONO, background: "#FEF9C3", padding: "1px 4px", borderRadius: 3 }}>Authorization</code> Header 中傳入有效的 Bearer Token。
                <span style={{ color: "#A16207" }}> · Bearer token required in Authorization header.</span>
              </p>
            </div>

            {/* ── Responses ── */}
            <SectionDivider icon={<CheckCircle2 size={12} />} zh="Responses 回應" en="Response Codes" />

            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              <StatusBadge code={200} label="OK" />
              <StatusBadge code={401} label="Unauthorized" />
              <StatusBadge code={422} label="Validation Error" />
            </div>

            {[
              {
                code: 200, label: "OK",
                desc: "請求成功，回傳學生名單及分頁資訊。",
                schema: `{ status: "success", data: Student[], meta: PageMeta }`,
              },
              {
                code: 401, label: "Unauthorized",
                desc: "存取權杖無效或已過期，請重新取得 Token。",
                schema: `{ status: "error", message: "Unauthorized" }`,
              },
              {
                code: 422, label: "Validation Error",
                desc: "請求參數校驗失敗，例如 per_page 超過最大值 100。",
                schema: `{ status: "error", errors: ValidationError[] }`,
              },
            ].map(resp => {
              const open = expandedResp.has(resp.code);
              const cfg =
                resp.code < 300 ? { bg: "#F0FDF4", border: "#BBF7D0", dot: "#22C55E", color: "#15803D" } :
                resp.code < 500 ? { bg: "#FFF7ED", border: "#FED7AA", dot: "#F97316", color: "#C2410C" } :
                                  { bg: "#FFF5F5", border: "#FECACA", dot: "#EF4444", color: "#B91C1C" };
              return (
                <div key={resp.code} style={{
                  border: `1px solid ${open ? cfg.border : C.border}`,
                  borderRadius: R.md, marginBottom: 8, overflow: "hidden",
                  transition: "border-color 0.15s",
                }}>
                  <button
                    onClick={() => toggleResp(resp.code)}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 10,
                      padding: "10px 14px",
                      background: open ? cfg.bg : C.surface,
                      border: "none", cursor: "pointer",
                      textAlign: "left" as const,
                      transition: "background 0.15s",
                    }}
                  >
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
                    <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 800, color: cfg.color, flexShrink: 0 }}>
                      {resp.code}
                    </span>
                    <span style={{ fontSize: 12, color: C.textSecondary, fontFamily: F, flexShrink: 0 }}>{resp.label}</span>
                    {!isMobile && <span style={{ fontSize: 11.5, color: C.textMuted, fontFamily: F, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{resp.desc}</span>}
                    {isMobile && <span style={{ flex: 1 }} />}
                    {open ? <ChevronDown size={13} color={C.textMuted} style={{ flexShrink: 0 }} /> : <ChevronRight size={13} color={C.textMuted} style={{ flexShrink: 0 }} />}
                  </button>
                  {open && (
                    <div style={{
                      padding: "12px 14px",
                      background: "#F8FAFC", borderTop: `1px solid ${cfg.border}`,
                    }}>
                      <code style={{ fontFamily: MONO, fontSize: 11.5, color: C.textSecondary }}>
                        {resp.schema}
                      </code>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ══ RIGHT: Playground (Dark) ══════════════════════════════════════════ */}
        <div style={{ flex: isMobile ? "none" : 1, minWidth: 0, background: DK.page, overflowY: isMobile ? "visible" : "auto", display: "flex", flexDirection: "column" }}>

          {/* ── Panel 1: Parameters Builder ── */}
          <div style={{
            padding: "20px 20px 16px",
            borderBottom: `1px solid ${DK.border}`,
          }}>
            <div style={{
              fontSize: 10, fontWeight: 800, color: DK.muted,
              letterSpacing: "0.1em", textTransform: "uppercase" as const,
              marginBottom: 14, fontFamily: F,
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <Code2 size={11} color={DK.muted} />Parameters
            </div>

            {/* Param inputs */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
              {[
                { key: "class_id", label: "class_id", placeholder: 'e.g., "3A"',  hint: "string | null" },
                { key: "keyword",  label: "keyword",  placeholder: 'e.g., "Chan"', hint: "string | null" },
                { key: "page",     label: "page",     placeholder: "1",             hint: "integer | null" },
              ].map(field => (
                <div key={field.key}>
                  <label style={{
                    display: "flex", alignItems: "baseline", gap: 6,
                    marginBottom: 5, fontSize: 11, fontFamily: MONO,
                  }}>
                    <span style={{ fontWeight: 700, color: "#7DD3FC" }}>{field.label}</span>
                    <span style={{ fontSize: 10, color: DK.muted }}>{field.hint}</span>
                  </label>
                  <input
                    value={(params as any)[field.key]}
                    onChange={e => setParams(p => ({ ...p, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    style={{
                      width: "100%", boxSizing: "border-box" as const,
                      height: 34, padding: "0 10px",
                      background: DK.input,
                      border: `1px solid ${DK.inputBorder}`,
                      borderRadius: R.md,
                      fontFamily: MONO, fontSize: 12,
                      color: DK.text, outline: "none",
                      transition: "border-color 0.12s",
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = DK.accent)}
                    onBlur={e => (e.currentTarget.style.borderColor = DK.inputBorder)}
                  />
                </div>
              ))}
            </div>

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={sending}
              style={{
                width: "100%", padding: "10px 0",
                border: "none", borderRadius: R.md,
                background: sending ? "#1D4ED8" : C.accent,
                color: "#fff", fontSize: 13.5, fontWeight: 700,
                fontFamily: F, cursor: sending ? "wait" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: sending ? "none" : `0 2px 12px ${C.accent}50`,
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { if (!sending) e.currentTarget.style.background = C.accentDark; }}
              onMouseLeave={e => { if (!sending) e.currentTarget.style.background = C.accent; }}
            >
              {sending ? (
                <>
                  <div style={{
                    width: 14, height: 14, borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "#fff",
                    animation: "apiSpin 0.7s linear infinite",
                  }} />
                  Sending…
                </>
              ) : (
                <>
                  <Send size={14} />
                  🚀 Send API Request
                </>
              )}
            </button>
          </div>

          {/* ── Panel 2: cURL Sample ── */}
          <div style={{
            padding: "16px 20px",
            borderBottom: `1px solid ${DK.border}`,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: DK.muted, letterSpacing: "0.08em", textTransform: "uppercase" as const, fontFamily: F }}>
                  Request Sample
                </span>
                <button style={{
                  display: "flex", alignItems: "center", gap: 4,
                  padding: "2px 8px", borderRadius: R.sm,
                  background: DK.card, border: `1px solid ${DK.border2}`,
                  fontSize: 10.5, fontFamily: MONO, color: DK.subtle,
                  cursor: "pointer",
                }}>
                  Shell / cURL
                  <ChevronDown size={10} />
                </button>
              </div>
              <CopyButton text={CURL_TEXT} dark />
            </div>

            <div style={{
              background: DK.input,
              border: `1px solid ${DK.border2}`,
              borderRadius: R.md,
              padding: "14px 16px",
              overflowX: "auto",
            }}>
              <pre style={{ margin: 0, fontFamily: MONO, fontSize: 11.5, lineHeight: 1.7, color: DK.text, whiteSpace: "pre" as const }}>
                {CURL_TEXT.split("\n").map((line, i) => (
                  <div key={i}>
                    {line.startsWith("curl") ? (
                      <span>
                        <span style={{ color: "#86EFAC" }}>curl</span>
                        {line.slice(4)}
                      </span>
                    ) : line.includes("--request") ? (
                      <span>
                        {"  "}<span style={{ color: "#7DD3FC" }}>--request</span>
                        <span style={{ color: "#FB923C" }}> GET</span>
                        {" \\"}
                      </span>
                    ) : line.includes("--url") ? (
                      <span>
                        {"  "}<span style={{ color: "#7DD3FC" }}>--url</span>
                        <span style={{ color: "#86EFAC" }}>{line.slice(line.indexOf("'"))}</span>
                      </span>
                    ) : line.includes("--header") ? (
                      <span>
                        {"  "}<span style={{ color: "#7DD3FC" }}>--header</span>
                        <span style={{ color: "#FCA5A5" }}>{line.slice(line.indexOf("'"))}</span>
                      </span>
                    ) : (
                      <span>{line}</span>
                    )}
                  </div>
                ))}
              </pre>
            </div>
          </div>

          {/* ── Panel 3: Response Example ── */}
          <div style={{ padding: "16px 20px", flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: DK.muted, letterSpacing: "0.08em", textTransform: "uppercase" as const, fontFamily: F }}>
                  Response Example
                </span>
                <span style={{
                  padding: "1px 7px", borderRadius: R.full,
                  background: "rgba(74,222,128,0.14)", border: "1px solid rgba(74,222,128,0.25)",
                  fontSize: 10.5, fontWeight: 800, color: "#4ADE80", fontFamily: MONO,
                }}>200 OK</span>
                {responseSent && (
                  <span style={{
                    display: "flex", alignItems: "center", gap: 4,
                    fontSize: 10.5, color: "#4ADE80", fontFamily: F, fontWeight: 600,
                  }}>
                    <AlertCircle size={10} />
                    Live response
                  </span>
                )}
              </div>
              <CopyButton text={RESPONSE_JSON} dark />
            </div>

            <div style={{
              background: DK.input,
              border: `1px solid ${responseSent ? "rgba(74,222,128,0.3)" : DK.border2}`,
              borderRadius: R.md,
              padding: "16px",
              overflowX: "auto",
              transition: "border-color 0.3s",
            }}>
              <JsonBlock>{RESPONSE_JSON}</JsonBlock>
            </div>

            {/* Response meta */}
            {responseSent && (
              <div style={{
                marginTop: 10, padding: "8px 12px",
                background: "rgba(74,222,128,0.06)",
                border: "1px solid rgba(74,222,128,0.2)",
                borderRadius: R.md,
                display: "flex", alignItems: "center", gap: 12,
              }}>
                {[
                  { label: "Status",   val: "200 OK",  color: "#4ADE80"  },
                  { label: "Time",     val: "142ms",   color: DK.subtle  },
                  { label: "Size",     val: "1.2 kB",  color: DK.subtle  },
                ].map(m => (
                  <div key={m.label} style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
                    <span style={{ fontSize: 10, color: DK.muted, fontFamily: F }}>{m.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: m.color, fontFamily: MONO }}>{m.val}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      <style>{`@keyframes apiSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};
