// ─────────────────────────────────────────────────────────────────────────────
// Screen_APIAutomation.tsx
// API 與自動化串接 — API & Automation Developer Portal
// ERP Tender Module 1.F.6/8  —  Sync & Permissions / API Dashboard
//
// Design: Developer console aesthetic (Stripe/Vercel style)
//   Dark code blocks · Monospace tokens · Technical information density
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect } from "react";
import {
  Globe, Code, Terminal, Eye, EyeOff, Copy, Check, Send,
  Zap, Activity, Key, Shield, Clock, Webhook, AlertCircle,
  Server, ChevronRight, ChevronDown, ExternalLink,
  CheckCircle2, XCircle, ArrowUpRight, Database, RefreshCw,
  Lock, Fingerprint, FlaskConical, ListFilter, Network, Plug,
} from "lucide-react";
import { ERP } from "./erpTokens";

// ── Design tokens — Developer Console ─────────────────────────────────────────
const D = {
  // Page
  pageBg:     "#F1F5F9",
  surface:    "#FFFFFF",
  surfaceAlt: "#F8FAFC",
  surfaceDark:"#0D1117",   // GitHub dark
  surfaceDark2:"#161B22",  // GitHub dark secondary
  surfaceDark3:"#21262D",  // GitHub dark border/separator

  // Borders
  border:     "#E2E8F0",
  borderDark: "#30363D",   // GitHub dark border

  // Text
  text1:  "#0F172A",
  text2:  "#1E293B",
  text3:  "#475569",
  text4:  "#94A3B8",
  textCode:"#E6EDF3",     // GitHub dark text

  // Accent (developer portal = indigo, distinct from teacher blue)
  accent:      "#6366F1",
  accentDark:  "#4F46E5",
  accentLight: "#EEF2FF",
  accentBd:    "#C7D2FE",

  // Status
  green:  "#10B981",
  greenBg:"#ECFDF5",
  greenBd:"#6EE7B7",
  amber:  "#F59E0B",
  amberBg:"#FFFBEB",
  amberBd:"#FDE68A",
  red:    "#EF4444",
  redBg:  "#FEF2F2",
  redBd:  "#FECACA",

  // N8N brand
  n8n:    "#FF6D5A",
  n8nBg:  "#FFF5F3",
  n8nBd:  "#FFC9C2",

  // Code syntax (GitHub dark)
  codeKey:     "#7DD3FA",   // light blue
  codeStr:     "#A5D6FF",   // pale sky
  codeNum:     "#FFA657",   // orange
  codePunct:   "#79C0FF",   // cyan
  codeComment: "#8B949E",   // gray
  codeProp:    "#D2A8FF",   // purple
  codeTag:     "#7EE787",   // green

  shadow:   "0 1px 3px rgba(15,23,42,0.07), 0 1px 2px rgba(15,23,42,0.05)",
  shadowMd: "0 4px 12px rgba(15,23,42,0.09)",
  radius:   "10px",
  font:     ERP.font.family,
  mono:     "'JetBrains Mono','Fira Code','SF Mono','Cascadia Code',monospace",
};

// ── JSON payload data ─────────────────────────────────────────────────────────
const PAYLOAD_LINES = [
  { type: "punct", val: "{" },
  { type: "pair",  key: '"event"',     val: '"event.created"',       comma: true },
  { type: "pair",  key: '"timestamp"', val: '"2026-08-10T14:30:00Z"', comma: true },
  { type: "pair",  key: '"source"',    val: '"lalp-erp-v3.2"',        comma: true },
  { type: "obj_open", key: '"data"', comma: false },
  { type: "pair2", key: '"eventId"',   val: '"ACT-009"',              comma: true },
  { type: "pair2", key: '"eventName"', val: '"全方位學習日"',           comma: true },
  { type: "pair2", key: '"level"',     val: '"L2"',                   comma: true },
  { type: "pair2", key: '"organiser"', val: '"F1A · 陳志明老師"',      comma: true },
  { type: "pair2", key: '"pts"',       val: '15',                     comma: false, num: true },
  { type: "obj_close" },
  { type: "punct", val: "}" },
];

// ── Event triggers ────────────────────────────────────────────────────────────
interface EventTrigger {
  id: string;
  module: string;
  moduleColor: string;
  moduleBg: string;
  zhName: string;
  eventCode: string;
  description: string;
  active: boolean;
}

const EVENTS: EventTrigger[] = [
  {
    id: "e1",
    module: "成就系統",
    moduleColor: "#7C3AED",
    moduleBg:    "#EDE9FE",
    zhName:    "成就紀錄已核准",
    eventCode: "achievement.approved",
    description: "當教師批准學生的成就申請時觸發",
    active: false,
  },
  {
    id: "e2",
    module: "分組專題",
    moduleColor: "#0891B2",
    moduleBg:    "#CFFAFE",
    zhName:    "PBL 階段完成",
    eventCode: "pbl.stage_completed",
    description: "當 PBL 小組完成當前階段並提交時觸發",
    active: false,
  },
  {
    id: "e3",
    module: "活動引擎",
    moduleColor: "#059669",
    moduleBg:    "#D1FAE5",
    zhName:    "新活動建立",
    eventCode: "event.created",
    description: "當系統建立新的課外活動或事件記錄時觸發",
    active: true,
  },
  {
    id: "e4",
    module: "學生檔案",
    moduleColor: "#D97706",
    moduleBg:    "#FEF3C7",
    zhName:    "ACORN 數據更新",
    eventCode: "acorn.updated",
    description: "當學生的 ACORN 六維評估分數更新時觸發",
    active: false,
  },
  {
    id: "e5",
    module: "積點系統",
    moduleColor: "#DB2777",
    moduleBg:    "#FCE7F3",
    zhName:    "積點派發完成",
    eventCode: "points.distributed",
    description: "當校園自主積點批量派發完成時觸發",
    active: false,
  },
];

// ── Delivery log ──────────────────────────────────────────────────────────────
const DELIVERY_LOG = [
  { id: "d1", status: 200, ts: "2026-08-09 16:22:31", ms: 123, payload: "ACT-008", ok: true },
  { id: "d2", status: 200, ts: "2026-08-09 14:55:12", ms: 89,  payload: "ACT-007", ok: true },
  { id: "d3", status: 200, ts: "2026-08-09 12:03:47", ms: 211, payload: "ACT-006", ok: true },
  { id: "d4", status: 500, ts: "2026-08-08 23:31:09", ms: 0,   payload: "ACT-005", ok: false, retry: "3/3" },
  { id: "d5", status: 200, ts: "2026-08-08 18:14:55", ms: 97,  payload: "ACT-004", ok: true },
];

type TabId = "overview" | "webhooks" | "n8n" | "tokens";

const TABS: { id: TabId; zh: string; en: string }[] = [
  { id: "overview",  zh: "API 總覽",    en: "API Overview" },
  { id: "webhooks",  zh: "Webhook 管理", en: "Webhooks" },
  { id: "n8n",       zh: "N8N 整合",    en: "N8N Integrations" },
  { id: "tokens",    zh: "存取權杖",    en: "Access Tokens" },
];

// ── JSON Syntax Highlight ─────────────────────────────────────────────────────
const JsonLine: React.FC<{ line: typeof PAYLOAD_LINES[0]; indent?: number }> = ({ line, indent = 0 }) => {
  const pad = "  ".repeat(indent);
  const F = D.mono;
  const fontSize = 12.5;

  if (line.type === "punct") return (
    <div style={{ fontFamily: F, fontSize, color: D.codePunct }}>{line.val}</div>
  );
  if (line.type === "obj_open") return (
    <div style={{ fontFamily: F, fontSize }}>
      {pad}<span style={{ color: D.codeKey }}>{line.key}</span>
      <span style={{ color: D.codePunct }}>: {"{"}</span>
    </div>
  );
  if (line.type === "obj_close") return (
    <div style={{ fontFamily: F, fontSize, color: D.codePunct }}>{"  }"}</div>
  );
  if (line.type === "pair") return (
    <div style={{ fontFamily: F, fontSize }}>
      {"  "}<span style={{ color: D.codeKey }}>{line.key}</span>
      <span style={{ color: D.codePunct }}>: </span>
      <span style={{ color: D.codeStr }}>{line.val}</span>
      {line.comma && <span style={{ color: D.codePunct }}>,</span>}
    </div>
  );
  if (line.type === "pair2") return (
    <div style={{ fontFamily: F, fontSize }}>
      {"    "}<span style={{ color: D.codeKey }}>{line.key}</span>
      <span style={{ color: D.codePunct }}>: </span>
      <span style={{ color: line.num ? D.codeNum : D.codeStr }}>{line.val}</span>
      {line.comma && <span style={{ color: D.codePunct }}>,</span>}
    </div>
  );
  return null;
};

// ── HTTP Method Badge ─────────────────────────────────────────────────────────
const MethodBadge: React.FC<{ method: "POST" | "GET" | "PUT" | "DELETE" }> = ({ method }) => {
  const cfg = {
    POST:   { bg: "#D1FAE5", color: "#065F46", bd: "#6EE7B7" },
    GET:    { bg: "#DBEAFE", color: "#1E3A8A", bd: "#93C5FD" },
    PUT:    { bg: "#FEF3C7", color: "#92400E", bd: "#FDE68A" },
    DELETE: { bg: "#FEE2E2", color: "#991B1B", bd: "#FECACA" },
  }[method];
  return (
    <div style={{
      padding: "4px 10px", borderRadius: 6,
      background: cfg.bg, border: `1px solid ${cfg.bd}`,
      fontSize: 11, fontWeight: 800, color: cfg.color,
      fontFamily: D.mono, letterSpacing: "0.04em",
    }}>{method}</div>
  );
};

// ── Config input field ────────────────────────────────────────────────────────
const ConfigField: React.FC<{
  label: string; sublabel?: string;
  value: string; mono?: boolean;
  suffix?: React.ReactNode;
  badge?: React.ReactNode;
  dimmed?: boolean;
}> = ({ label, sublabel, value, mono, suffix, badge, dimmed }) => (
  <div>
    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
      <span style={{ fontSize: 11.5, fontWeight: 700, color: D.text2 }}>{label}</span>
      {sublabel && <span style={{ fontSize: 10, color: D.text4 }}>{sublabel}</span>}
    </div>
    <div style={{
      display: "flex", alignItems: "center", gap: 0,
      background: D.surface, border: `1.5px solid ${D.border}`,
      borderRadius: 9, overflow: "hidden",
    }}>
      {badge && (
        <div style={{ padding: "0 10px", borderRight: `1px solid ${D.border}`, height: "100%", display: "flex", alignItems: "center" }}>
          {badge}
        </div>
      )}
      <div style={{
        flex: 1, padding: "10px 14px",
        fontSize: 13, fontFamily: mono ? D.mono : D.font,
        color: dimmed ? D.text4 : D.text1,
        letterSpacing: mono ? "0.02em" : "normal",
        filter: dimmed ? "blur(3.5px)" : "none",
        userSelect: dimmed ? "none" : "auto",
        background: "#FAFAFA",
      }}>
        {value}
      </div>
      {suffix && (
        <div style={{ padding: "0 10px", borderLeft: `1px solid ${D.border}`, height: "100%", display: "flex", alignItems: "center", background: D.surface }}>
          {suffix}
        </div>
      )}
    </div>
  </div>
);

// ── Main Component ─────────────────────────────────────────────────────────────
export const Screen_APIAutomation: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [activeTab,    setActiveTab]    = useState<TabId>("webhooks");
  const [selectedEvt,  setSelectedEvt]  = useState("e3");
  const [showSecret,   setShowSecret]   = useState(false);
  const [copiedJson,   setCopiedJson]   = useState(false);
  const [copiedUrl,    setCopiedUrl]    = useState(false);
  const [testSent,     setTestSent]     = useState(false);
  const [savedConfig,  setSavedConfig]  = useState(false);
  const [toastMsg,     setToastMsg]     = useState<string | null>(null);
  const [expandedEvt,  setExpandedEvt]  = useState<string | null>("e3");
  const [isMobile,     setIsMobile]     = useState(false);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const F = D.font;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2400);
  };

  const handleCopyJson = () => {
    setCopiedJson(true);
    showToast("✓ JSON payload 已複製至剪貼板");
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleCopyUrl = () => {
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleTestSend = () => {
    setTestSent(true);
    showToast("📡 測試 Payload 已送出 → HTTP 200 OK · 97ms");
    setTimeout(() => setTestSent(false), 3000);
  };

  const handleSave = () => {
    setSavedConfig(true);
    showToast("💾 Webhook 設定已儲存");
    setTimeout(() => setSavedConfig(false), 2500);
  };

  const selectedEvent = EVENTS.find(e => e.id === selectedEvt);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: isMobile ? "auto" : "100%", minHeight: isMobile ? "100%" : undefined, background: D.pageBg, fontFamily: F, overflow: isMobile ? "visible" : "hidden" }}>

      <style>{`
        @keyframes toastUp {
          from { transform: translateX(-50%) translateY(10px); opacity: 0; }
          to   { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
        @keyframes statusPulse {
          0%,100% { opacity: 1; }
          50%      { opacity: 0.5; }
        }
        @keyframes codeIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      {/* ══════════════════════════════════════════════════════════════════════
          TOP HEADER
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{
        background: D.surface, borderBottom: `1px solid ${D.border}`,
        flexShrink: 0,
      }}>
        {/* Breadcrumb row — desktop only */}
        {!isMobile && <div style={{ height: 40, display: "flex", alignItems: "center", padding: "0 24px", gap: 5, fontSize: 11, borderBottom: `1px solid ${D.border}`, background: D.surfaceAlt }}>
          {["首頁", "系統管理", "同步與權限", "API 與自動化串接"].map((crumb, i, arr) => (
            <React.Fragment key={crumb}>
              {i > 0 && <ChevronRight size={12} color={D.text4} />}
              <span style={{
                color: i === arr.length - 1 ? D.text2 : D.text4,
                fontWeight: i === arr.length - 1 ? 700 : 400,
                cursor: i < arr.length - 1 ? "pointer" : "default",
              }}>{crumb}</span>
            </React.Fragment>
          ))}
          {/* Module badge */}
          <div style={{ marginLeft: "auto", display: "flex", gap: 7, alignItems: "center" }}>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: "2px 8px",
              background: D.accentLight, color: D.accent, border: `1px solid ${D.accentBd}`,
              borderRadius: 5, fontFamily: D.mono,
            }}>M1.F.6/8</span>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: "2px 8px",
              background: "#0D1117", color: "#7EE787", border: "1px solid #30363D",
              borderRadius: 5, fontFamily: D.mono,
            }}>REST · WebSocket · N8N</span>
          </div>
        </div>}

        {/* Title row */}
        <div style={{ minHeight: 58, display: "flex", alignItems: "center", padding: isMobile ? "10px 16px" : "0 24px", gap: isMobile ? 10 : 14, flexWrap: isMobile ? "wrap" : undefined }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: "linear-gradient(135deg, #0F172A, #1E293B)",
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "1px solid #334155",
            boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
          }}>
            <Terminal size={18} color="#7DD3FA" />
          </div>
          <div style={{ flex: isMobile ? "1 1 auto" : undefined, minWidth: 0 }}>
            <div style={{ fontSize: isMobile ? 14 : 17, fontWeight: 800, color: D.text1, letterSpacing: "-0.3px" }}>🔌 API & Webhooks</div>
            {!isMobile && <div style={{ fontSize: 11, color: D.text4, marginTop: 1 }}>API 與自動化串接 · Module 1.F.6/8 · Base URL: <span style={{ fontFamily: D.mono, color: D.accent }}>https://api.lalp.edu.hk/v3</span></div>}
          </div>

          <div style={{ flex: 1 }} />

          {/* Header actions */}
          {!isMobile && <a href="#" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: D.text3, textDecoration: "none", padding: "6px 12px", borderRadius: 8, border: `1px solid ${D.border}`, background: D.surface }}><ExternalLink size={12} color={D.text3} /> API 文件</a>}
          <button style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: isMobile ? "6px 12px" : "7px 16px", borderRadius: 9, border: "none", background: "linear-gradient(135deg, #0F172A, #1E293B)", color: "#E2E8F0", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: F, boxShadow: "0 2px 6px rgba(15,23,42,0.25)" }}>
            <Key size={13} color="#7DD3FA" /> {isMobile ? "API Key" : "管理 API 金鑰"}
          </button>
        </div>

        {/* Sub-navigation tabs */}
        <div style={{
          display: "flex",
          alignItems: "center",
          padding: isMobile ? "0 4px" : "0 24px",
          gap: 0,
          borderTop: `1px solid ${D.border}`,
          overflowX: "auto",
          WebkitOverflowScrolling: "touch" as any,
          scrollbarWidth: "none" as any,
          msOverflowStyle: "none" as any,
          flexShrink: 0,
        }}>
          {TABS.map(tab => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flexShrink: 0,
                  padding: isMobile ? "10px 14px" : "10px 20px",
                  border: "none", cursor: "pointer",
                  background: "none", fontFamily: F,
                  fontSize: isMobile ? 12 : 12.5, fontWeight: 600,
                  color: active ? D.accent : D.text3,
                  borderBottom: `2.5px solid ${active ? D.accent : "transparent"}`,
                  transition: "all 0.15s",
                  display: "flex", alignItems: "center", gap: 5,
                  whiteSpace: "nowrap" as const,
                }}
              >
                {tab.id === "webhooks" && <Webhook size={13} />}
                {tab.id === "overview" && <Globe size={13} />}
                {tab.id === "n8n" && <Network size={13} />}
                {tab.id === "tokens" && <Key size={13} />}
                {tab.zh}
                {!isMobile && <span style={{ fontSize: 10, color: D.text4 }}>{tab.en}</span>}
                {tab.id === "webhooks" && (
                  <span style={{
                    fontSize: 9.5, padding: "1px 6px", borderRadius: 999,
                    background: D.accentLight, color: D.accent, border: `1px solid ${D.accentBd}`,
                    fontWeight: 700,
                  }}>3</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          KPI STATUS ROW
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 14, padding: isMobile ? "12px 16px 0" : "16px 24px 0", flexShrink: 0 }}>

        {/* Card 1: API Status */}
        <div style={{
          background: D.surface, border: `1px solid ${D.border}`,
          borderRadius: D.radius, padding: "14px 18px",
          display: "flex", alignItems: "center", gap: 14,
          boxShadow: D.shadow,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
            background: D.greenBg, border: `1px solid ${D.greenBd}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Server size={18} color={D.green} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
              <div style={{
                width: 8, height: 8, borderRadius: "50%", background: D.green, flexShrink: 0,
                animation: "statusPulse 2s ease-in-out infinite",
                boxShadow: `0 0 0 3px ${D.greenBd}`,
              }} />
              <span style={{ fontSize: 13, fontWeight: 800, color: D.text1 }}>All Systems Operational</span>
            </div>
            <div style={{ display: "flex", gap: 10, fontSize: 11 }}>
              <span style={{ color: D.green, fontWeight: 700 }}>99.9% Uptime</span>
              <span style={{ color: D.text4 }}>過去 30 天</span>
            </div>
          </div>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: "2px 8px",
            background: D.greenBg, color: D.green, border: `1px solid ${D.greenBd}`,
            borderRadius: 5,
          }}>API 狀態</span>
        </div>

        {/* Card 2: Monthly Calls */}
        <div style={{
          background: D.surface, border: `1px solid ${D.border}`,
          borderRadius: D.radius, padding: "14px 18px",
          boxShadow: D.shadow,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Activity size={14} color={D.accent} />
              <span style={{ fontSize: 11.5, fontWeight: 700, color: D.text2 }}>本月調用次數</span>
            </div>
            <span style={{
              fontSize: 10, fontFamily: D.mono,
              color: D.text4, background: D.surfaceAlt,
              border: `1px solid ${D.border}`,
              padding: "1px 7px", borderRadius: 4,
            }}>Monthly Calls</span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginBottom: 8 }}>
            <span style={{ fontSize: 22, fontWeight: 900, color: D.text1, fontFamily: D.mono }}>14,205</span>
            <span style={{ fontSize: 11, color: D.text4 }}>/ 50,000</span>
            <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: D.accent }}>28%</span>
          </div>
          <div style={{ height: 6, background: "#E2E8F0", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ width: "28%", height: "100%", background: `linear-gradient(90deg, ${D.accent}, #8B5CF6)`, borderRadius: 3, transition: "width 0.6s ease" }} />
          </div>
          <div style={{ fontSize: 10, color: D.text4, marginTop: 5 }}>
            剩餘 35,795 次 · 重置於 2026-09-01
          </div>
        </div>

        {/* Card 3: Active Webhooks */}
        <div style={{
          background: D.surface, border: `1px solid ${D.border}`,
          borderRadius: D.radius, padding: "14px 18px",
          boxShadow: D.shadow,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Webhook size={14} color={D.accent} />
              <span style={{ fontSize: 11.5, fontWeight: 700, color: D.text2 }}>活躍 Webhooks</span>
            </div>
            <span style={{ fontSize: 22, fontWeight: 900, color: D.text1, fontFamily: D.mono }}>3</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {[
              { event: "event.created",       endpoint: "n8n.stewards…/event-trigger", ok: true },
              { event: "achievement.approved", endpoint: "n8n.stewards…/achievement",  ok: true },
              { event: "acorn.updated",        endpoint: "webhook.site/…abc123",       ok: false, warn: true },
            ].map(ep => (
              <div key={ep.event} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{
                  width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                  background: ep.ok ? D.green : D.amber,
                }} />
                <span style={{ fontSize: 10, fontFamily: D.mono, color: D.text3, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ep.event}</span>
                {ep.warn && <span style={{ fontSize: 9, color: D.amber, fontWeight: 600 }}>⚠ 延遲</span>}
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          MAIN CONTENT — split pane
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ flex: isMobile ? "none" : 1, display: isMobile ? "flex" : "grid", flexDirection: isMobile ? "column" : undefined, gridTemplateColumns: isMobile ? undefined : "340px 1fr", gap: 14, padding: isMobile ? "12px 16px 20px" : "14px 24px 20px", overflow: isMobile ? "visible" : "hidden", minHeight: isMobile ? undefined : 0 }}>

        {/* ──────────────────────────────────────────────────────────────────
            LEFT PANEL — Event Triggers
        ────────────────────────────────────────────────────────────────── */}
        <div style={{ background: D.surface, borderRadius: D.radius, border: `1px solid ${D.border}`, boxShadow: D.shadow, display: "flex", flexDirection: "column", overflow: isMobile ? "visible" : "hidden", maxHeight: isMobile ? 320 : undefined, overflowY: isMobile ? "auto" : undefined }}>
          {/* Panel header */}
          <div style={{
            padding: "13px 16px",
            background: D.surfaceAlt,
            borderBottom: `1px solid ${D.border}`,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <Zap size={14} color={D.accent} />
                <span style={{ fontSize: 13, fontWeight: 800, color: D.text1 }}>事件觸發器</span>
              </div>
              <div style={{ fontSize: 10, color: D.text4, marginTop: 1 }}>Event Triggers · {EVENTS.length} available</div>
            </div>
            <div style={{
              fontSize: 10, padding: "2px 8px", borderRadius: 5, fontWeight: 700,
              background: D.accentLight, color: D.accent, border: `1px solid ${D.accentBd}`,
            }}>3 Subscribed</div>
          </div>

          {/* Search */}
          <div style={{ padding: "10px 12px", borderBottom: `1px solid ${D.border}` }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 7,
              background: D.surfaceAlt, border: `1px solid ${D.border}`,
              borderRadius: 8, padding: "7px 11px",
            }}>
              <ListFilter size={13} color={D.text4} />
              <input
                placeholder="篩選事件… Filter events"
                style={{
                  flex: 1, border: "none", outline: "none", background: "none",
                  fontSize: 12, color: D.text2, fontFamily: F,
                }}
              />
            </div>
          </div>

          {/* Event list */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {EVENTS.map(ev => {
              const isSelected = selectedEvt === ev.id;
              const isExpanded = expandedEvt === ev.id;
              return (
                <div
                  key={ev.id}
                  style={{
                    borderBottom: `1px solid ${D.border}`,
                    background: isSelected ? `${D.accentLight}` : "none",
                    borderLeft: `3px solid ${isSelected ? D.accent : "transparent"}`,
                    transition: "all 0.15s",
                  }}
                >
                  <div
                    onClick={() => { setSelectedEvt(ev.id); setExpandedEvt(isExpanded ? null : ev.id); }}
                    style={{ padding: "12px 14px", cursor: "pointer" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                      {/* Module badge */}
                      <span style={{
                        fontSize: 9.5, fontWeight: 700, padding: "2px 7px",
                        background: ev.moduleBg, color: ev.moduleColor,
                        border: `1px solid ${ev.moduleColor}30`, borderRadius: 5,
                        flexShrink: 0,
                      }}>{ev.module}</span>

                      {/* Status dot */}
                      <div style={{
                        width: 6, height: 6, borderRadius: "50%", flexShrink: 0, marginLeft: "auto",
                        background: isSelected ? D.accent : D.border,
                        boxShadow: isSelected ? `0 0 0 3px ${D.accentBd}` : "none",
                      }} />
                      <ChevronDown size={13} color={D.text4} style={{ transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
                    </div>

                    <div style={{ fontSize: 12.5, fontWeight: 700, color: isSelected ? D.text1 : D.text2, marginBottom: 3 }}>
                      {ev.zhName}
                    </div>
                    <div style={{
                      fontSize: 11, fontFamily: D.mono, color: isSelected ? D.accent : D.text4,
                      background: isSelected ? `${D.accent}12` : D.surfaceAlt,
                      border: `1px solid ${isSelected ? D.accentBd : D.border}`,
                      borderRadius: 5, padding: "2px 7px", display: "inline-block",
                    }}>
                      {ev.eventCode}
                    </div>
                  </div>

                  {/* Expanded description */}
                  {isExpanded && (
                    <div style={{
                      padding: "0 14px 12px",
                      fontSize: 11.5, color: D.text3, lineHeight: 1.6,
                      animation: "codeIn 0.2s ease-out",
                    }}>
                      {ev.description}
                      {isSelected && (
                        <div style={{
                          display: "flex", alignItems: "center", gap: 5, marginTop: 8,
                          padding: "6px 10px",
                          background: D.greenBg, border: `1px solid ${D.greenBd}`,
                          borderRadius: 7,
                        }}>
                          <CheckCircle2 size={12} color={D.green} />
                          <span style={{ fontSize: 11, fontWeight: 700, color: D.green }}>
                            Webhook 已配置 · Active
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div style={{
            padding: "10px 14px", borderTop: `1px solid ${D.border}`,
            background: D.surfaceAlt, display: "flex", alignItems: "center", gap: 6,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: D.green, animation: "statusPulse 2s ease-in-out infinite" }} />
            <span style={{ fontSize: 10.5, color: D.text4 }}>REST + WebSocket 雙模式支援</span>
          </div>
        </div>

        {/* ──────────────────────────────────────────────────────────────────
            RIGHT PANEL — Webhook Config & N8N
        ────────────────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, overflowY: "auto", minHeight: 0 }}>

          {/* Panel header */}
          <div style={{
            background: D.surface, border: `1px solid ${D.border}`,
            borderRadius: D.radius, padding: "14px 20px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            boxShadow: D.shadow,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: D.accentLight, border: `1px solid ${D.accentBd}`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Webhook size={16} color={D.accent} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: D.text1 }}>設定 Webhook</span>
                  <span style={{
                    fontSize: 12, fontFamily: D.mono, fontWeight: 700,
                    padding: "2px 10px", borderRadius: 6,
                    background: "#0D1117", color: "#7EE787",
                    border: "1px solid #30363D",
                  }}>{selectedEvent?.eventCode ?? "—"}</span>
                  <MethodBadge method="POST" />
                </div>
                <div style={{ fontSize: 10.5, color: D.text4, marginTop: 2 }}>
                  Configure Webhook · {selectedEvent?.zhName}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "6px 12px", borderRadius: 8,
                border: `1px solid ${D.border}`, background: "none",
                fontSize: 11.5, fontWeight: 600, color: D.text3, cursor: "pointer", fontFamily: F,
              }}>
                <RefreshCw size={12} color={D.text3} /> 重置
              </button>
              <div style={{
                padding: "4px 10px", borderRadius: 7,
                background: D.greenBg, border: `1px solid ${D.greenBd}`,
                fontSize: 10.5, fontWeight: 700, color: D.green,
                display: "flex", alignItems: "center", gap: 5,
              }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: D.green, animation: "statusPulse 2s ease-in-out infinite" }} />
                Active · Last fired 2h ago
              </div>
            </div>
          </div>

          {/* ── Section 1: Endpoint Configuration ── */}
          <div style={{
            background: D.surface, border: `1px solid ${D.border}`,
            borderRadius: D.radius, overflow: "hidden",
            boxShadow: D.shadow,
          }}>
            <SectionHeader
              icon={<Globe size={14} color={D.accent} />}
              title="Endpoint 配置"
              subtitle="Endpoint Configuration"
              badge="Section 1"
            />
            <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
              {/* URL field */}
              <ConfigField
                label="目標 URL"
                sublabel="Target URL — N8N Webhook Endpoint"
                mono
                value="https://n8n.stewards.edu.hk/webhook/event-trigger"
                suffix={
                  <button onClick={handleCopyUrl} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center", gap: 4, color: D.text3, fontFamily: F, fontSize: 11 }}>
                    {copiedUrl ? <Check size={13} color={D.green} /> : <><Copy size={13} color={D.text3} /> 複製</>}
                  </button>
                }
              />

              {/* Method + Retry row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <ConfigField
                  label="HTTP Method"
                  sublabel="Method"
                  value="POST"
                  mono
                />
                <ConfigField
                  label="Timeout (ms)"
                  sublabel="Request timeout"
                  value="5000"
                  mono
                />
                <ConfigField
                  label="Retry 次數"
                  sublabel="On failure"
                  value="3"
                  mono
                />
              </div>

              {/* Secret key */}
              <ConfigField
                label="Secret Key (HMAC-SHA256)"
                sublabel="Used to verify webhook signature"
                mono
                dimmed={!showSecret}
                value={showSecret ? "sk_lalp_9f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c" : "●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●"}
                badge={<Lock size={13} color={D.text4} />}
                suffix={
                  <button onClick={() => setShowSecret(v => !v)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center", gap: 4, color: D.text3, fontFamily: F, fontSize: 11 }}>
                    {showSecret ? <><EyeOff size={13} color={D.text3} /> 隱藏</> : <><Eye size={13} color={D.text3} /> 顯示</>}
                  </button>
                }
              />
            </div>
          </div>

          {/* ── Section 2: JSON Payload Preview ── */}
          <div style={{
            background: D.surface, border: `1px solid ${D.border}`,
            borderRadius: D.radius, overflow: "hidden",
            boxShadow: D.shadow,
          }}>
            <SectionHeader
              icon={<Code size={14} color="#7DD3FA" />}
              title="Payload 預覽"
              subtitle="JSON Payload Preview"
              badge="Section 2"
              dark
              action={
                <button
                  onClick={handleCopyJson}
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "5px 11px", borderRadius: 7,
                    background: copiedJson ? "#1A2F1E" : "#21262D",
                    border: `1px solid ${copiedJson ? "#3D6B44" : "#30363D"}`,
                    cursor: "pointer", fontSize: 11, fontWeight: 600,
                    color: copiedJson ? "#7EE787" : "#8B949E", fontFamily: F,
                  }}
                >
                  {copiedJson ? <Check size={12} color="#7EE787" /> : <Copy size={12} color="#8B949E" />}
                  {copiedJson ? "Copied!" : "Copy JSON"}
                </button>
              }
            />

            {/* Dark code block */}
            <div style={{
              background: D.surfaceDark,
              padding: "20px 24px",
              lineHeight: 1.85,
              animation: "codeIn 0.3s ease-out",
            }}>
              {/* Line numbers + code */}
              <div style={{ display: "flex", gap: 20 }}>
                {/* Line numbers */}
                <div style={{
                  fontFamily: D.mono, fontSize: 11.5, color: "#484F58",
                  userSelect: "none", textAlign: "right", lineHeight: 1.85,
                  flexShrink: 0, minWidth: 20,
                }}>
                  {Array.from({ length: PAYLOAD_LINES.length }).map((_, i) => (
                    <div key={i}>{i + 1}</div>
                  ))}
                </div>

                {/* Code */}
                <div style={{ flex: 1 }}>
                  {PAYLOAD_LINES.map((line, i) => (
                    <JsonLine key={i} line={line} />
                  ))}
                </div>
              </div>
            </div>

            {/* Code block footer */}
            <div style={{
              padding: "8px 20px",
              background: D.surfaceDark2,
              borderTop: `1px solid ${D.surfaceDark3}`,
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <span style={{ fontFamily: D.mono, fontSize: 10, color: "#484F58" }}>JSON · UTF-8</span>
              <span style={{ fontFamily: D.mono, fontSize: 10, color: "#484F58" }}>Content-Type: application/json</span>
              <span style={{ marginLeft: "auto", fontFamily: D.mono, fontSize: 10, color: "#484F58" }}>
                X-LALP-Signature: sha256=&lt;hmac&gt;
              </span>
            </div>
          </div>

          {/* ── Section 3: N8N Integration ── */}
          <div style={{
            background: D.n8nBg, border: `1.5px solid ${D.n8nBd}`,
            borderRadius: D.radius, overflow: "hidden",
            boxShadow: D.shadow,
          }}>
            {/* N8N header */}
            <div style={{
              padding: "13px 18px",
              background: `linear-gradient(90deg, ${D.n8nBg}, #FFF8F5)`,
              borderBottom: `1px solid ${D.n8nBd}`,
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {/* N8N brand block */}
                <div style={{
                  padding: "4px 10px", borderRadius: 7,
                  background: D.n8n, boxShadow: `0 2px 8px ${D.n8n}60`,
                }}>
                  <span style={{ fontFamily: D.mono, fontSize: 13, fontWeight: 900, color: "#fff", letterSpacing: "0.05em" }}>n8n</span>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#7C2D12" }}>N8N 串接提示</div>
                  <div style={{ fontSize: 10, color: "#9A3412" }}>N8N Integration Hint · Section 3</div>
                </div>
              </div>
              <a href="#" style={{
                display: "flex", alignItems: "center", gap: 4,
                fontSize: 11, color: D.n8n, fontWeight: 600, textDecoration: "none",
              }}>
                N8N 文件 <ArrowUpRight size={11} color={D.n8n} />
              </a>
            </div>

            {/* N8N hint body */}
            <div style={{ padding: "16px 18px" }}>
              <div style={{ fontSize: 13, color: "#7C2D12", lineHeight: 1.75, marginBottom: 14 }}>
                💡 <strong>提示：</strong>您可將上方 Payload 結構直接匯入 n8n 的{" "}
                <span style={{ fontFamily: D.mono, fontSize: 12, background: D.n8nBd, padding: "1px 6px", borderRadius: 4 }}>Webhook Node</span>，
                並串接後續的{" "}
                <span style={{ fontFamily: D.mono, fontSize: 12, background: D.n8nBd, padding: "1px 6px", borderRadius: 4 }}>Google Sheets</span>{" "}
                寫入或{" "}
                <span style={{ fontFamily: D.mono, fontSize: 12, background: D.n8nBd, padding: "1px 6px", borderRadius: 4 }}>Slack</span>{" "}
                通知流程。
              </div>

              {/* N8N flow visualization */}
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "12px 14px",
                background: "#FFF",
                border: `1px solid ${D.n8nBd}`,
                borderRadius: 10, marginBottom: 14,
                overflowX: "auto",
              }}>
                {[
                  { label: "LALP ERP", sub: "event.created", icon: "🔌", color: D.accent },
                  null,
                  { label: "Webhook Node", sub: "n8n trigger",   icon: "⚡", color: D.n8n },
                  null,
                  { label: "IF Node",       sub: "level >= L2",  icon: "🔀", color: "#8B5CF6" },
                  null,
                  { label: "Google Sheets", sub: "寫入活動記錄", icon: "📊", color: "#16A34A" },
                  null,
                  { label: "Slack Notify",  sub: "推送通知",     icon: "💬", color: "#4A154B" },
                ].map((node, i) =>
                  node === null ? (
                    <div key={i} style={{ flex: 1, height: 2, background: `linear-gradient(90deg, ${D.n8n}40, ${D.n8n}80)`, position: "relative", flexShrink: 0, minWidth: 16, maxWidth: 28 }}>
                      <div style={{ position: "absolute", right: -4, top: "50%", transform: "translateY(-50%)", width: 0, height: 0, borderLeft: `6px solid ${D.n8n}80`, borderTop: "4px solid transparent", borderBottom: "4px solid transparent" }} />
                    </div>
                  ) : (
                    <div key={i} style={{ textAlign: "center", flexShrink: 0 }}>
                      <div style={{ fontSize: 18, marginBottom: 2 }}>{node.icon}</div>
                      <div style={{ fontSize: 9.5, fontWeight: 700, color: D.text2, whiteSpace: "nowrap" }}>{node.label}</div>
                      <div style={{ fontSize: 8.5, color: D.text4, whiteSpace: "nowrap" }}>{node.sub}</div>
                    </div>
                  )
                )}
              </div>

              {/* Action: Test Trigger */}
              <button
                onClick={handleTestSend}
                disabled={testSent}
                style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  padding: "11px 16px", borderRadius: 10,
                  background: testSent ? "#1A2F1E" : D.surfaceDark,
                  border: `1px solid ${testSent ? "#3D6B44" : D.surfaceDark3}`,
                  cursor: testSent ? "default" : "pointer",
                  fontSize: 13, fontWeight: 700,
                  color: testSent ? "#7EE787" : D.textCode,
                  fontFamily: F, transition: "all 0.2s",
                }}
              >
                {testSent
                  ? <><Check size={14} color="#7EE787" /> HTTP 200 OK · 97ms · 測試成功</>
                  : <><FlaskConical size={14} color="#7DD3FA" /> 測試觸發 Send Test Payload</>
                }
              </button>
            </div>
          </div>

          {/* ── Delivery History ── */}
          <div style={{
            background: D.surface, border: `1px solid ${D.border}`,
            borderRadius: D.radius, overflow: "hidden",
            boxShadow: D.shadow,
          }}>
            <SectionHeader
              icon={<Clock size={14} color={D.accent} />}
              title="最近投遞記錄"
              subtitle="Recent Delivery Log"
              badge="History"
            />
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: D.surfaceAlt, borderBottom: `1px solid ${D.border}` }}>
                    {["狀態", "Payload ID", "時間戳", "延遲", "操作"].map(h => (
                      <th key={h} style={{
                        padding: "8px 16px", fontSize: 10.5, fontWeight: 700,
                        color: D.text3, textAlign: "left" as const,
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DELIVERY_LOG.map((log, i) => (
                    <tr key={log.id} style={{ borderBottom: `1px solid ${D.border}`, background: i % 2 === 0 ? D.surface : D.surfaceAlt }}>
                      <td style={{ padding: "10px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {log.ok
                            ? <><CheckCircle2 size={13} color={D.green} /> <span style={{ fontSize: 11, fontWeight: 700, color: D.green, fontFamily: D.mono }}>{log.status} OK</span></>
                            : <><XCircle size={13} color={D.red} /> <span style={{ fontSize: 11, fontWeight: 700, color: D.red, fontFamily: D.mono }}>{log.status} ERR</span>{log.retry && <span style={{ fontSize: 9.5, color: D.red, background: D.redBg, border: `1px solid ${D.redBd}`, borderRadius: 4, padding: "1px 5px" }}>retry {log.retry}</span>}</>
                          }
                        </div>
                      </td>
                      <td style={{ padding: "10px 16px" }}>
                        <span style={{ fontSize: 11.5, fontFamily: D.mono, color: D.text2 }}>{log.payload}</span>
                      </td>
                      <td style={{ padding: "10px 16px" }}>
                        <span style={{ fontSize: 11, fontFamily: D.mono, color: D.text3 }}>{log.ts}</span>
                      </td>
                      <td style={{ padding: "10px 16px" }}>
                        <span style={{ fontSize: 11, fontFamily: D.mono, color: log.ok ? D.green : D.text4 }}>
                          {log.ok ? `${log.ms}ms` : "—"}
                        </span>
                      </td>
                      <td style={{ padding: "10px 16px" }}>
                        <button style={{
                          fontSize: 10.5, color: D.accent, background: "none", border: "none",
                          cursor: "pointer", fontFamily: F, fontWeight: 600,
                          padding: "3px 8px", borderRadius: 5,
                        }}>
                          詳情
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Save Configuration CTA ── */}
          <div style={{
            background: D.surface, border: `1px solid ${D.border}`,
            borderRadius: D.radius, padding: "16px 20px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            boxShadow: D.shadow,
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: D.text1, marginBottom: 2 }}>
                儲存 Webhook 設定
              </div>
              <div style={{ fontSize: 11, color: D.text3 }}>
                更改將即時生效 · Changes apply immediately · Signed with HMAC-SHA256
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button style={{
                padding: "10px 18px", borderRadius: 9,
                border: `1px solid ${D.border}`, background: "none",
                fontSize: 12.5, fontWeight: 600, color: D.text3, cursor: "pointer", fontFamily: F,
              }}>
                取消
              </button>
              <button
                onClick={handleSave}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "10px 22px", borderRadius: 9, border: "none",
                  background: savedConfig
                    ? `linear-gradient(135deg, ${D.green}, #16A34A)`
                    : `linear-gradient(135deg, #0F172A, #1E293B)`,
                  color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: F,
                  boxShadow: savedConfig ? `0 4px 14px ${D.green}55` : "0 4px 14px rgba(15,23,42,0.25)",
                  transition: "all 0.2s",
                }}
              >
                {savedConfig
                  ? <><Check size={14} color="#fff" /> 已儲存</>
                  : <><Webhook size={14} color="#7DD3FA" /> 💾 儲存 Webhook 設定</>
                }
              </button>
            </div>
          </div>

          <div style={{ height: 8 }} />
        </div>{/* /right panel */}
      </div>

      {/* ── Global Toast ────────────────────────────────────────────────── */}
      {toastMsg && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%",
          zIndex: 9999, animation: "toastUp 0.28s ease-out forwards",
          pointerEvents: "none",
        }}>
          <div style={{
            padding: "9px 20px", background: "#0D1117",
            borderRadius: 999, color: "#E6EDF3",
            fontSize: 12.5, fontWeight: 600, fontFamily: D.font,
            boxShadow: "0 8px 24px rgba(0,0,0,0.40)",
            border: "1px solid #30363D", whiteSpace: "nowrap",
          }}>
            {toastMsg}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Section header helper ──────────────────────────────────────────────────────
const SectionHeader: React.FC<{
  icon: React.ReactNode; title: string; subtitle: string;
  badge?: string; dark?: boolean; action?: React.ReactNode;
}> = ({ icon, title, subtitle, badge, dark, action }) => (
  <div style={{
    padding: "11px 18px",
    background: dark ? "#161B22" : "#FAFAFA",
    borderBottom: `1px solid ${dark ? "#30363D" : "#E2E8F0"}`,
    display: "flex", alignItems: "center", justifyContent: "space-between",
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{
        width: 26, height: 26, borderRadius: 6,
        background: dark ? "#21262D" : "#EEF2FF",
        border: `1px solid ${dark ? "#30363D" : "#C7D2FE"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {icon}
      </div>
      <span style={{ fontSize: 12.5, fontWeight: 700, color: dark ? "#E6EDF3" : "#1E293B" }}>{title}</span>
      <span style={{ fontSize: 10.5, color: dark ? "#8B949E" : "#94A3B8" }}>{subtitle}</span>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {badge && (
        <span style={{
          fontSize: 9.5, fontWeight: 700, padding: "2px 7px",
          background: dark ? "#21262D" : "#EEF2FF",
          color: dark ? "#7DD3FA" : "#6366F1",
          border: `1px solid ${dark ? "#30363D" : "#C7D2FE"}`,
          borderRadius: 5, fontFamily: "'JetBrains Mono',monospace",
        }}>{badge}</span>
      )}
      {action}
    </div>
  </div>
);
