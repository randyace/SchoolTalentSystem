// ─────────────────────────────────────────────────────────────────────────────
// Screen_StudentProfile.tsx
// 學生個人全人檔案 — Student Holistic Portfolio  (Showcase Screen)
//
// Synthesises:
//   Tender Module 3  — ACORN 六維學習特徵圖譜 (Hexagon Radar + YoY Overlay)
//   Tender Module 6  — AI 成果智能評語 (AI Narrative + PDPO Mask Toggle)
//   Mod C            — 校園自主積點 (Reward Points)
//
// Layout: Full-page, no sidebar, sticky top bar.
// Default subject: 陳大文 Chan Tai Man (2025-F1A-001)
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect } from "react";
import { ERP } from "./erpTokens";
import {
  ArrowLeft, Download, Sparkles, Zap, TrendingUp, TrendingDown, Plus, X, Check,
  CheckCircle2, Clock, ChevronRight, BarChart2,
  ToggleLeft, ToggleRight, Award, Shield, Layers, Calendar,
  FileBadge, BookOpen, UserCheck, XCircle, Lock,
  FileText, Trophy, AlertCircle, Star, ChevronDown,
  Stamp, RotateCcw, ScanLine, BadgeCheck,
  Activity, Gauge, ClipboardList, AlertTriangle, CalendarCheck, CalendarX,
  ThumbsUp, Brain, Flame, Frown, Meh, EyeOff,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════════
// §1  ACORN CONFIGURATION
// Maps to the 6 ACORN framework dimensions rendered as Hexagon Radar axes.
// Colors mirror ERP.acornTags ordering: 認知→學術, 協作→協作, 創意→機遇,
//   社群→領域, 領導→培育, 體適能→信念
// ═══════════════════════════════════════════════════════════════════════════════
const ACORN_AXES = [
  { zh: "學術", en: "Academic",      color: "#1D4ED8", bg: "#DBEAFE", border: "#BFDBFE" },
  { zh: "協作", en: "Collaborative", color: "#15803D", bg: "#DCFCE7", border: "#BBF7D0" },
  { zh: "機遇", en: "Opportunity",   color: "#C2410C", bg: "#FFEDD5", border: "#FED7AA" },
  { zh: "領域", en: "Realm",         color: "#BE185D", bg: "#FCE7F3", border: "#FBCFE8" },
  { zh: "培育", en: "Nurturing",     color: "#6D28D9", bg: "#EDE9FE", border: "#DDD6FE" },
  { zh: "信念", en: "Faith",         color: "#0F766E", bg: "#CCFBF1", border: "#99F6E4" },
] as const;

interface AcornRecord { label: string; labelEn: string; scores: number[] }
const ACORN_DATA: Record<string, AcornRecord> = {
  "2025/26": {
    label:   "2025/26 (中一/F1)",
    labelEn: "AY 2025/26 · Form 1",
    scores:  [82, 91, 74, 68, 78, 85],   // 學術 +7 · 協作 +11 · 機遇 +9 · 領域 +8 · 培育 +8 · 信念 +5
  },
  "2024/25": {
    label:   "2024/25 (入學基準)",
    labelEn: "AY 2024/25 · Admission Benchmark",
    scores:  [75, 80, 65, 60, 70, 80],
  },
};
// Valid earlier years to compare against for each primary view year
const COMPARE_OPTIONS: Record<string, string[]> = {
  "2025/26": ["2024/25"],
  "2024/25": [],
};

// ═══════════════════════════════════════════════════════════════════════════════
// §2  ACTIVITY DATA
// ═══════════════════════════════════════════════════════════════════════════════
const ACTIVITIES = [
  {
    id: "a1",
    name: "中一級科學環保專題",
    enName: "F1 Environmental Science PBL",
    subject: "科學",
    role: "組長", roleTier: "T3" as const,
    status: "completed" as const,
    acornIdx: 1, acornPts: 5,
    date: "2026-05-15",
  },
  {
    id: "a2",
    name: "中文學會 — 徵文比賽",
    enName: "Chinese Society Writing Competition",
    subject: "中國語文",
    role: "參賽者", roleTier: "T1" as const,
    status: "reviewing" as const,
    acornIdx: 0, acornPts: 2,
    date: "2026-07-01",
  },
] as const;

// ═══════════════════════════════════════════════════════════════════════════════
// §3  HEX RADAR SVG  (custom, no recharts)
//     6 axes, clockwise from top.  overflow:visible for edge labels.
// ═══════════════════════════════════════════════════════════════════════════════
const SZ = 300;          // SVG viewBox size
const CX = SZ / 2;       // centre-x
const CY = SZ / 2;       // centre-y
const RD = 100;          // outer data-ring radius
const LR = 136;          // label ring radius (outside RD)

// Text anchors per axis (top → top-right → bottom-right → bottom → bottom-left → top-left)
const ANCHORS  = ["middle","start","start","middle","end","end"] as const;
// Nudge offsets for axis name labels
const L_DX = [0, 6, 6, 0, -6, -6];
const L_DY = [0, 0, 0, 8, 0, 0];
// Nudge offsets for value (score) labels near the data dot
const V_DX = [0, 10, 10, 0, -10, -10];
const V_DY = [-15, 4, 4, 16, 4, 4];

function rPt(dimIdx: number, value: number, radius = RD): [number, number] {
  const a = -Math.PI / 2 + (dimIdx * 2 * Math.PI) / 6;
  const r = (value / 100) * radius;
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
}

function rPath(vals: readonly number[]): string {
  return vals.map((v, i) => { const [x, y] = rPt(i, v); return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`; }).join(" ") + " Z";
}

function gridHex(scale: number): string {
  return Array.from({ length: 6 }, (_, i) => { const [x, y] = rPt(i, scale * 100); return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`; }).join(" ") + " Z";
}

// ── Palette constants for the two radar layers ──────────────────────────────
const CLR_NOW  = { stroke: "#6EE7B7", fill: "rgba(110,231,183,0.22)", dot: "#6EE7B7", label: "#059669" };
const CLR_PREV = { stroke: "#DC2626", fill: "rgba(220,38,38,0.08)",  dot: "#EF4444", label: "#DC2626" };

const HexRadar: React.FC<{ showPrevious: boolean; scoresNow: number[]; scoresPrev: number[] }> = ({
  showPrevious, scoresNow, scoresPrev,
}) => (
  <svg
    viewBox={`0 0 ${SZ} ${SZ}`}
    width="100%" height="auto"
    style={{ overflow: "visible", display: "block" }}
    aria-label="ACORN 六維學習特徵圖譜雷達圖"
  >
    <defs>
      {/* Emerald gradient fill — current year */}
      <linearGradient id="hrGradGreen" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%"   stopColor="#A7F3D0" stopOpacity="0.40" />
        <stop offset="100%" stopColor="#6EE7B7" stopOpacity="0.10" />
      </linearGradient>
      {/* Emerald radial glow */}
      <radialGradient id="hrGlowGreen" cx="50%" cy="38%" r="68%">
        <stop offset="0%"   stopColor="#6EE7B7" stopOpacity="0.22" />
        <stop offset="100%" stopColor="#34D399"  stopOpacity="0"    />
      </radialGradient>
      {/* Drop-shadow for current-year dots */}
      <filter id="hrDotGreen" x="-60%" y="-60%" width="220%" height="220%">
        <feDropShadow dx="0" dy="1" stdDeviation="2.5" floodColor="#059669" floodOpacity="0.40" />
      </filter>
      {/* Drop-shadow for historical dots */}
      <filter id="hrDotRed" x="-60%" y="-60%" width="220%" height="220%">
        <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#DC2626" floodOpacity="0.30" />
      </filter>
    </defs>

    {/* Soft green background glow */}
    <ellipse cx={CX} cy={CY} rx={RD * 0.78} ry={RD * 0.62} fill="url(#hrGlowGreen)" />

    {/* Grid rings */}
    {[0.2, 0.4, 0.6, 0.8, 1.0].map(s => (
      <path key={s} d={gridHex(s)}
        fill="none"
        stroke={s === 1.0 ? "#CBD5E1" : "#E2E8F0"}
        strokeWidth={s === 1.0 ? 1.5 : 0.8}
        strokeDasharray={s < 1.0 ? "3,3" : undefined}
      />
    ))}

    {/* Grid scale ticks */}
    {[20, 40, 60, 80].map(pct => (
      <text key={pct}
        x={CX + 3} y={CY - (pct / 100) * RD - 3}
        fontSize="7" fill="#94A3B8" textAnchor="start"
        fontFamily={ERP.font.family}
      >{pct}</text>
    ))}

    {/* Axis lines */}
    {ACORN_AXES.map((ax, i) => {
      const [ox, oy] = rPt(i, 100);
      return <line key={i} x1={CX} y1={CY} x2={ox} y2={oy} stroke={ax.color} strokeWidth="1.5" strokeOpacity="0.20" />;
    })}

    {/* ── Historical year polygon — RED dashed, drawn first (background layer) ── */}
    {showPrevious && (
      <g>
        {/* Red semi-transparent fill */}
        <path d={rPath(scoresPrev)} fill={CLR_PREV.fill} />
        {/* Red dashed stroke */}
        <path d={rPath(scoresPrev)}
          fill="none"
          stroke={CLR_PREV.stroke}
          strokeWidth="2"
          strokeDasharray="5,4"
          strokeOpacity="0.80"
        />
        {/* Red dots at historical vertices */}
        {scoresPrev.map((v, i) => {
          const [px, py] = rPt(i, v);
          return (
            <circle key={i}
              cx={px} cy={py} r="4"
              fill={CLR_PREV.dot} stroke="#fff" strokeWidth="2"
              filter="url(#hrDotRed)"
              opacity="0.90"
            />
          );
        })}
      </g>
    )}

    {/* ── Current year polygon — BRIGHT GREEN solid, drawn on top ── */}
    <path d={rPath(scoresNow)} fill="url(#hrGradGreen)" />
    <path d={rPath(scoresNow)}
      fill="none"
      stroke={CLR_NOW.stroke}
      strokeWidth="2.8"
      strokeLinejoin="round"
    />

    {/* Current year dots + value labels */}
    {scoresNow.map((v, i) => {
      const [dpx, dpy] = rPt(i, v);
      const anchor = V_DX[i] > 0 ? "start" : V_DX[i] < 0 ? "end" : "middle";
      return (
        <g key={i}>
          <circle cx={dpx} cy={dpy} r="5.5"
            fill={CLR_NOW.dot} stroke="#fff" strokeWidth="2.5"
            filter="url(#hrDotGreen)"
          />
          <text x={dpx + V_DX[i]} y={dpy + V_DY[i]}
            fontSize="10.5" fontWeight="800"
            fill={CLR_NOW.label} textAnchor={anchor}
            fontFamily={ERP.font.family}
          >{v}</text>
        </g>
      );
    })}

    {/* Axis labels — keep per-axis brand colors for dimension identity */}
    {ACORN_AXES.map((ax, i) => {
      const a  = -Math.PI / 2 + (i * 2 * Math.PI) / 6;
      const lx = CX + LR * Math.cos(a);
      const ly = CY + LR * Math.sin(a);
      return (
        <g key={i}>
          <text x={lx + L_DX[i]} y={ly + L_DY[i]}
            fontSize="13.5" fontWeight="800"
            fill={ax.color} textAnchor={ANCHORS[i]}
            fontFamily={ERP.font.family}
          >{ax.zh}</text>
          <text x={lx + L_DX[i]} y={ly + L_DY[i] + 15}
            fontSize="9" fontWeight="400"
            fill={ax.color} textAnchor={ANCHORS[i]}
            opacity="0.62" fontFamily={ERP.font.family}
          >{ax.en}</text>
        </g>
      );
    })}
  </svg>
);

// ═══════════════════════════════════════════════════════════════════════════════
// §3b  BLUR WRAP — PDPO privacy blur with hover-to-reveal
// ═══════════════════════════════════════════════════════════════════════════════
const BlurWrap: React.FC<{
  on: boolean;
  hint?: boolean;
  inline?: boolean;
  children: React.ReactNode;
}> = ({ on, hint = true, inline = false, children }) => {
  const [hover, setHover] = useState(false);
  if (!on) return <>{children}</>;
  return (
    <div
      style={{ position: "relative", display: inline ? "inline-block" : "block", cursor: "pointer" }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div style={{ filter: hover ? "none" : "blur(6px)", userSelect: hover ? "auto" : "none", transition: "filter 0.18s ease", pointerEvents: hover ? "auto" : "none" }}>
        {children}
      </div>
      {!hover && hint && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <EyeOff size={11} color="rgba(255,255,255,0.55)" />
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// §4  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export interface StudentProfileProps {
  studentId: string;
  onBack: () => void;
  /** Where the user navigated from — drives breadcrumbs and back-button label */
  routeSource?: "roster" | "class-list";
  /** The class code (e.g. "F1A") when arriving from the class list */
  routeClassCode?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// AddRecordModal — 新增出缺席 / 課堂行為紀錄 input panel
// ─────────────────────────────────────────────────────────────────────────────
const TODAY = new Date().toISOString().slice(0, 10);

const ATT_TYPE_META = {
  late:     { zh: "遲到",   en: "Late Arrival",      icon: "🕐", bg: "#FEF3C7", color: "#92400E", border: "#FDE68A" },
  sick:     { zh: "病假",   en: "Sick Leave",         icon: "🤒", bg: "#EFF6FF", color: "#1D4ED8", border: "#BFDBFE" },
  personal: { zh: "事假",   en: "Personal Leave",     icon: "📋", bg: "#F5F3FF", color: "#6D28D9", border: "#DDD6FE" },
  absent:   { zh: "曠課",   en: "Absent w/o Leave",   icon: "⛔", bg: "#FEF2F2", color: "#991B1B", border: "#FECACA" },
  early:    { zh: "早退",   en: "Early Departure",    icon: "🏃", bg: "#FFF7ED", color: "#C2410C", border: "#FED7AA" },
};

const ENG_LEVEL_META = {
  "high-active": { zh: "高參與度",  en: "Highly Engaged",    bg: "#DCFCE7", color: "#15803D", border: "#86EFAC", icon: "🌟" },
  "active":      { zh: "積極參與",  en: "Active Participant", bg: "#DBEAFE", color: "#1D4ED8", border: "#93C5FD", icon: "👍" },
  "neutral":     { zh: "一般",      en: "Neutral",            bg: "#F1F5F9", color: "#475569", border: "#CBD5E1", icon: "😐" },
  "low":         { zh: "游離",      en: "Disengaged",         bg: "#FEF9C3", color: "#92400E", border: "#FDE68A", icon: "😔" },
};
const MERIT_TYPE_META = {
  "major-merit":   { zh: "大功",  en: "Major Merit",   bg: "#F0FDF4", color: "#15803D", border: "#BBF7D0", icon: "🏅" },
  "minor-merit":   { zh: "小功",  en: "Minor Merit",   bg: "#DCFCE7", color: "#166534", border: "#6EE7B7", icon: "⭐" },
  "minor-demerit": { zh: "小過",  en: "Minor Demerit", bg: "#FEF3C7", color: "#92400E", border: "#FDE68A", icon: "⚠️" },
  "major-demerit": { zh: "大過",  en: "Major Demerit", bg: "#FEF2F2", color: "#991B1B", border: "#FECACA", icon: "❌" },
};
const SUBJECT_QUICK = ["數學科", "中文科", "英文科", "物理科", "化學科", "歷史科", "地理科", "全校"];

interface AddRecordModalProps {
  defaultTab: "attendance" | "conduct";
  onSubmitAttendance: (r: { type: keyof typeof ATT_TYPE_META; remark: string; date: string }) => void;
  onSubmitConduct:    (r: { kind: "mod-d" | "merit"; date: string; subject: string; teacher: string; levelKey: string; detail: string }) => void;
  onClose: () => void;
}

const AddRecordModal: React.FC<AddRecordModalProps> = ({
  defaultTab, onSubmitAttendance, onSubmitConduct, onClose,
}) => {
  const F  = ERP.font.family;
  const C  = ERP.colors;
  const R  = ERP.radius;

  const [tab,      setTab]      = useState<"attendance" | "conduct">(defaultTab);
  const [attDate,  setAttDate]  = useState(TODAY);
  const [attType,  setAttType]  = useState<keyof typeof ATT_TYPE_META>("late");
  const [attRmk,   setAttRmk]   = useState("");
  const [engDate,  setEngDate]  = useState(TODAY);
  const [engKind,  setEngKind]  = useState<"mod-d" | "merit">("mod-d");
  const [engSubj,  setEngSubj]  = useState("");
  const [engTeach, setEngTeach] = useState("");
  const [engLvl,   setEngLvl]   = useState<keyof typeof ENG_LEVEL_META>("high-active");
  const [merType,  setMerType]  = useState<keyof typeof MERIT_TYPE_META>("minor-merit");
  const [engDtl,   setEngDtl]   = useState("");
  const [saved,    setSaved]    = useState(false);

  const inputStyle: React.CSSProperties = {
    width: "100%", boxSizing: "border-box",
    padding: "8px 12px", borderRadius: R.md,
    border: `1px solid ${C.border}`, background: C.surface,
    color: C.textPrimary, fontSize: 13, fontFamily: F, outline: "none",
  };

  const handleSubmit = () => {
    if (tab === "attendance") {
      onSubmitAttendance({ type: attType, remark: attRmk, date: attDate });
    } else {
      onSubmitConduct({
        kind:     engKind,
        date:     engDate,
        subject:  engSubj || "全校",
        teacher:  engTeach || "—",
        levelKey: engKind === "mod-d" ? engLvl : merType,
        detail:   engDtl,
      });
    }
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 900);
  };

  return (
    <>
    <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }`}</style>
    <div style={{
      position: "fixed", inset: 0, zIndex: 1200,
      background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px 16px",
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: "100%", maxWidth: 520,
        background: C.surface, borderRadius: R.xl,
        boxShadow: ERP.shadow.xl,
        display: "flex", flexDirection: "column",
        overflow: "hidden", maxHeight: "90vh",
        animation: "slideUp 0.18s ease",
      }}>

        {/* ── Modal Header ── */}
        <div style={{
          padding: "16px 20px", borderBottom: `1px solid ${C.border}`,
          display: "flex", alignItems: "center", gap: 12, flexShrink: 0,
          background: C.surface,
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: R.md, flexShrink: 0,
            background: "linear-gradient(135deg, #EFF6FF, #DCFCE7)",
            border: `1px solid ${C.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <ClipboardList size={16} color={C.accent} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.textPrimary, fontFamily: F }}>
              新增紀錄
            </div>
            <div style={{ fontSize: 10.5, color: C.textMuted, fontFamily: F }}>
              Add New Record · 陳大文 Chan Tai Man
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none", border: `1px solid ${C.border}`, borderRadius: R.sm,
              padding: 5, cursor: "pointer", color: C.textMuted,
              display: "flex", alignItems: "center", flexShrink: 0,
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* ── Tab selector ── */}
        <div style={{
          padding: "12px 20px 0", flexShrink: 0,
          borderBottom: `1px solid ${C.border}`,
          display: "flex", gap: 4,
        }}>
          {(["attendance", "conduct"] as const).map(t => {
            const meta = t === "attendance"
              ? { zh: "📅 出缺席紀錄", en: "Attendance" }
              : { zh: "🧑‍🏫 課堂表現與行為", en: "Conduct" };
            const active = tab === t;
            return (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: "8px 18px", borderRadius: `${R.md} ${R.md} 0 0`,
                border: "none", cursor: "pointer", fontFamily: F,
                fontSize: 12.5, fontWeight: active ? 800 : 600,
                background: active ? C.surface : "transparent",
                color: active ? C.accent : C.textMuted,
                borderBottom: active ? `2px solid ${C.accent}` : "2px solid transparent",
                marginBottom: -1,
                transition: "all 0.15s",
              }}>
                {meta.zh}
                <span style={{ fontSize: 10, marginLeft: 6, color: active ? C.accent : C.textDisabled }}>
                  {meta.en}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Form body ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 0" }}>
          {tab === "attendance" ? (
            /* ───── ATTENDANCE FORM ───── */
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Date */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.textSecondary, marginBottom: 5, fontFamily: F }}>
                  日期 Date
                </label>
                <input type="date" value={attDate} onChange={e => setAttDate(e.target.value)}
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = C.accent)}
                  onBlur={e  => (e.currentTarget.style.borderColor = C.border)}
                />
              </div>

              {/* Type pills */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.textSecondary, marginBottom: 8, fontFamily: F }}>
                  缺席類別 Absence Type
                </label>
                <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8 }}>
                  {(Object.entries(ATT_TYPE_META) as [keyof typeof ATT_TYPE_META, typeof ATT_TYPE_META[keyof typeof ATT_TYPE_META]][]).map(([key, m]) => {
                    const active = attType === key;
                    return (
                      <button key={key} onClick={() => setAttType(key)} style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        padding: "7px 14px", borderRadius: R.full,
                        border: `1.5px solid ${active ? m.border : C.border}`,
                        background: active ? m.bg : C.surface,
                        color: active ? m.color : C.textMuted,
                        fontSize: 12, fontWeight: active ? 800 : 500, fontFamily: F,
                        cursor: "pointer", transition: "all 0.12s",
                        boxShadow: active ? `0 1px 6px ${m.border}` : "none",
                      }}>
                        <span>{m.icon}</span>
                        {m.zh}
                        <span style={{ fontSize: 10, opacity: 0.75 }}>{m.en}</span>
                        {active && <Check size={11} style={{ marginLeft: 2 }} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Remark */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.textSecondary, marginBottom: 5, fontFamily: F }}>
                  備註 Remark
                  <span style={{ fontSize: 10, fontWeight: 400, color: C.textMuted, marginLeft: 6 }}>選填 Optional</span>
                </label>
                <input value={attRmk} onChange={e => setAttRmk(e.target.value)}
                  placeholder="e.g. 交通擠塞、附醫生證明…"
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = C.accent)}
                  onBlur={e  => (e.currentTarget.style.borderColor = C.border)}
                />
              </div>

              {/* Preview */}
              {(() => {
                const m = ATT_TYPE_META[attType];
                return (
                  <div style={{
                    padding: "10px 14px", borderRadius: R.md,
                    background: m.bg, border: `1px solid ${m.border}`,
                    display: "flex", alignItems: "center", gap: 8,
                    fontSize: 12, color: m.color, fontFamily: F, marginBottom: 4,
                  }}>
                    <span style={{ fontSize: 14 }}>{m.icon}</span>
                    <div style={{ flex: 1 }}>
                      <strong>{attDate}</strong>
                      {" · "}
                      <strong>{m.zh}</strong> ({m.en})
                      {attRmk && <div style={{ fontSize: 11, marginTop: 2, opacity: 0.85 }}>備註：{attRmk}</div>}
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            /* ───── CONDUCT / BEHAVIOR FORM ───── */
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Kind toggle */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.textSecondary, marginBottom: 8, fontFamily: F }}>
                  記錄種類 Record Kind
                </label>
                <div style={{
                  display: "grid", gridTemplateColumns: "1fr 1fr",
                  background: C.pageBg, borderRadius: R.md,
                  border: `1px solid ${C.border}`, padding: 3, gap: 3,
                }}>
                  {([
                    { k: "mod-d" as const, zh: "✨ 課堂表現",   en: "Engagement"   },
                    { k: "merit" as const, zh: "🏅 功過記錄",   en: "Merit/Demerit"},
                  ]).map(opt => {
                    const act = engKind === opt.k;
                    return (
                      <button key={opt.k} onClick={() => setEngKind(opt.k)} style={{
                        padding: "8px 12px", borderRadius: R.sm, border: "none",
                        cursor: "pointer", fontFamily: F, fontWeight: act ? 800 : 500,
                        fontSize: 12.5, background: act ? C.surface : "transparent",
                        color: act ? C.accent : C.textMuted,
                        boxShadow: act ? ERP.shadow.xs : "none",
                        transition: "all 0.15s",
                      }}>
                        {opt.zh}
                        <span style={{ fontSize: 10, marginLeft: 6, display: "block", color: act ? C.accent : C.textDisabled }}>{opt.en}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Date + Subject */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.textSecondary, marginBottom: 5, fontFamily: F }}>日期 Date</label>
                  <input type="date" value={engDate} onChange={e => setEngDate(e.target.value)}
                    style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = C.accent)}
                    onBlur={e  => (e.currentTarget.style.borderColor = C.border)}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.textSecondary, marginBottom: 5, fontFamily: F }}>科目 Subject</label>
                  <input value={engSubj} onChange={e => setEngSubj(e.target.value)}
                    placeholder="如：數學科…"
                    style={inputStyle}
                    list="subject-options"
                    onFocus={e => (e.currentTarget.style.borderColor = C.accent)}
                    onBlur={e  => (e.currentTarget.style.borderColor = C.border)}
                  />
                  <datalist id="subject-options">
                    {SUBJECT_QUICK.map(s => <option key={s} value={s} />)}
                  </datalist>
                </div>
              </div>

              {/* Quick subject chips */}
              <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 5, marginTop: -8 }}>
                {SUBJECT_QUICK.slice(0, 5).map(s => (
                  <button key={s} onClick={() => setEngSubj(s)} style={{
                    fontSize: 10.5, padding: "3px 10px", borderRadius: R.full,
                    border: `1px solid ${engSubj === s ? C.accentLight : C.border}`,
                    background: engSubj === s ? C.accentPale : C.pageBg,
                    color: engSubj === s ? C.accent : C.textMuted,
                    cursor: "pointer", fontFamily: F,
                  }}>{s}</button>
                ))}
              </div>

              {/* Teacher */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.textSecondary, marginBottom: 5, fontFamily: F }}>
                  負責教師 Teacher
                </label>
                <input value={engTeach} onChange={e => setEngTeach(e.target.value)}
                  placeholder="e.g. 陳Sir、王老師…"
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = C.accent)}
                  onBlur={e  => (e.currentTarget.style.borderColor = C.border)}
                />
              </div>

              {/* Level pills — mod-d */}
              {engKind === "mod-d" && (
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.textSecondary, marginBottom: 8, fontFamily: F }}>
                    課堂參與度 Engagement Level
                  </label>
                  <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 7 }}>
                    {(Object.entries(ENG_LEVEL_META) as [keyof typeof ENG_LEVEL_META, typeof ENG_LEVEL_META[keyof typeof ENG_LEVEL_META]][]).map(([key, m]) => {
                      const act = engLvl === key;
                      return (
                        <button key={key} onClick={() => setEngLvl(key)} style={{
                          display: "inline-flex", alignItems: "center", gap: 5,
                          padding: "7px 14px", borderRadius: R.full,
                          border: `1.5px solid ${act ? m.border : C.border}`,
                          background: act ? m.bg : C.surface,
                          color: act ? m.color : C.textMuted,
                          fontSize: 12, fontWeight: act ? 800 : 500, fontFamily: F,
                          cursor: "pointer", boxShadow: act ? `0 1px 6px ${m.border}` : "none",
                          transition: "all 0.12s",
                        }}>
                          <span>{m.icon}</span>{m.zh}
                          {act && <Check size={11} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Merit/demerit pills */}
              {engKind === "merit" && (
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.textSecondary, marginBottom: 8, fontFamily: F }}>
                    功過類別 Merit / Demerit Type
                  </label>
                  <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 7 }}>
                    {(Object.entries(MERIT_TYPE_META) as [keyof typeof MERIT_TYPE_META, typeof MERIT_TYPE_META[keyof typeof MERIT_TYPE_META]][]).map(([key, m]) => {
                      const act = merType === key;
                      return (
                        <button key={key} onClick={() => setMerType(key)} style={{
                          display: "inline-flex", alignItems: "center", gap: 5,
                          padding: "7px 14px", borderRadius: R.full,
                          border: `1.5px solid ${act ? m.border : C.border}`,
                          background: act ? m.bg : C.surface,
                          color: act ? m.color : C.textMuted,
                          fontSize: 12, fontWeight: act ? 800 : 500, fontFamily: F,
                          cursor: "pointer", boxShadow: act ? `0 1px 6px ${m.border}` : "none",
                          transition: "all 0.12s",
                        }}>
                          <span>{m.icon}</span>{m.zh}
                          {act && <Check size={11} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Detail */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.textSecondary, marginBottom: 5, fontFamily: F }}>
                  詳情備注 Detail
                  <span style={{ fontSize: 10, fontWeight: 400, color: C.textMuted, marginLeft: 6 }}>選填 Optional</span>
                </label>
                <textarea value={engDtl} onChange={e => setEngDtl(e.target.value)}
                  placeholder="e.g. 主動發問 3 次，全程專注…"
                  rows={2}
                  style={{
                    ...inputStyle, resize: "vertical" as const,
                    lineHeight: 1.5, padding: "8px 12px",
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = C.accent)}
                  onBlur={e  => (e.currentTarget.style.borderColor = C.border)}
                />
              </div>
            </div>
          )}

          {/* bottom padding */}
          <div style={{ height: 20 }} />
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: "14px 20px", borderTop: `1px solid ${C.border}`,
          display: "flex", gap: 10, justifyContent: "flex-end",
          background: C.surface, flexShrink: 0,
        }}>
          <button onClick={onClose} style={{
            padding: "9px 18px", borderRadius: R.md,
            border: `1px solid ${C.border}`, background: "transparent",
            color: C.textSecondary, fontSize: 13, fontFamily: F, cursor: "pointer",
          }}>
            取消 Cancel
          </button>
          <button
            onClick={handleSubmit}
            style={{
              padding: "9px 22px", borderRadius: R.md, border: "none",
              background: saved ? "#16A34A" : C.accent,
              color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: F,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 7,
              boxShadow: `0 2px 8px ${saved ? "#16A34A" : C.accent}40`,
              transition: "background 0.2s",
            }}
          >
            {saved
              ? <><Check size={14} /> 已儲存 Saved!</>
              : <><Check size={14} /> 儲存紀錄 Save Record</>
            }
          </button>
        </div>
      </div>
    </div>
    </>
  );
};

export const Screen_StudentProfile: React.FC<StudentProfileProps> = ({
  studentId, onBack,
  routeSource = "roster",
  routeClassCode,
}) => {
  const [activeTab, setActiveTab] = useState<"overview" | "certs" | "academic" | "conduct">("overview");
  const [showYoY,  setShowYoY]  = useState(true);   // pre-activated: YoY overlay ON
  const [viewYear, setViewYear] = useState("2025/26");
  const [cmpYear,  setCmpYear]  = useState("2024/25");
  const [pdpo,     setPdpo]     = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // ── ACORN year derivations ─────────────────────────────────────────────────
  const cmpOptions   = COMPARE_OPTIONS[viewYear] ?? [];
  const effectiveCmp = cmpOptions.includes(cmpYear) ? cmpYear : (cmpOptions[0] ?? "");
  const showCmp      = showYoY && effectiveCmp !== "";
  const viewData     = ACORN_DATA[viewYear]!;
  const cmpData      = ACORN_DATA[effectiveCmp];

  // Reset comparison when primary view year changes
  useEffect(() => {
    const opts = COMPARE_OPTIONS[viewYear] ?? [];
    setCmpYear(opts[0] ?? "");
  }, [viewYear]);

  // ── Cert Approval tab state ───────────────────────────────────────────────
  const [approvalStatus, setApprovalStatus] = useState<"pending" | "approved" | "rejected">("pending");
  const [certTitle, setCertTitle] = useState("Regional Science Competition");
  const [certAward, setCertAward] = useState("Gold Award");
  const [certLevel, setCertLevel] = useState("L4");
  const [certTier,  setCertTier]  = useState("T4");
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  // ── Conduct tab — mutable logs + add-record modal ──────────────────────────
  const [attendanceLogs, setAttendanceLogs] = useState([
    { id: "a1", date: "2026-03-15", type: "late"  as keyof typeof ATT_TYPE_META, typeZh: "遲到", typeEn: "Late Arrival",  remark: "交通擠塞",     remarkEn: "Traffic congestion"       },
    { id: "a2", date: "2026-01-10", type: "sick"  as keyof typeof ATT_TYPE_META, typeZh: "病假", typeEn: "Sick Leave",    remark: "附醫生證明",   remarkEn: "Medical cert. attached"   },
  ]);
  const [engagementLogs, setEngagementLogs] = useState([
    { id: "e1", date: "2026-04-02", subject: "數學科",  subjectEn: "Mathematics", teacher: "陳Sir",   teacherEn: "Mr. Chan",  kind: "mod-d"  as const, tagZh: "高參與度", tagEn: "Highly Engaged",    level: "high"  as const, detail: "主動發問 3 次，全程專注" },
    { id: "e2", date: "2026-03-20", subject: "全校",    subjectEn: "Whole School",teacher: "訓導處",  teacherEn: "Discipline",kind: "merit"  as const, tagZh: "小功",     tagEn: "Minor Merit",       level: "merit" as const, detail: "協助校運會籌備" },
    { id: "e3", date: "2026-02-15", subject: "歷史科",  subjectEn: "History",     teacher: "王老師",  teacherEn: "Ms. Wong",  kind: "mod-d"  as const, tagZh: "游離",     tagEn: "Disengaged",        level: "low"   as const, detail: "注意力分散，需跟進" },
    { id: "e4", date: "2026-01-28", subject: "英文科",  subjectEn: "English",     teacher: "李老師",  teacherEn: "Ms. Lee",   kind: "mod-d"  as const, tagZh: "積極參與", tagEn: "Active Participant", level: "high"  as const, detail: "口頭發表表現突出" },
  ]);
  const [addingRecord, setAddingRecord] = useState<"attendance" | "conduct" | null>(null);

  const F = ERP.font.family;

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 900);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const displayName = pdpo ? "Student #CTM-001 🛡️" : "陳大文";

  // ── Routing context: breadcrumbs + back-button label ─────────────────────
  const isFromClassList = routeSource === "class-list" && !!routeClassCode;
  const backLabel = isFromClassList ? `返回 ${routeClassCode} 班名冊` : "返回名冊";
  const crumbs = isFromClassList
    ? [
        { label: "首頁" },
        { label: "學生與班級" },
        { label: "班別列表", clickable: true },
        { label: routeClassCode!, clickable: true },
        { label: displayName, last: true },
      ]
    : [
        { label: "首頁" },
        { label: "年度學生名冊", clickable: true },
        { label: `${displayName} (${studentId})`, last: true },
      ];

  const aiText = pdpo
    ? `根據 Student #CTM-001 本學期的 ACORN 數據 🛡️，其在「協作」維度表現突出（曾擔任 2 次 PBL 組長）。建議下一步可挑戰「領域」維度的進階科學探究專題。`
    : `根據陳同學本學期的 ACORN 數據，其在「協作」維度表現突出（曾擔任 2 次 PBL 組長）。建議下一步可挑戰「領域」維度的進階科學探究專題。`;

  // ── tier badge colours ──────────────────────────────────────────────────────
  const TIER_CFG = {
    T3: { bg: ERP.acornTags["領導"].bg, color: ERP.acornTags["領導"].color, border: ERP.acornTags["領導"].border },
    T2: { bg: ERP.acornTags["協作"].bg, color: ERP.acornTags["協作"].color, border: ERP.acornTags["協作"].border },
    T1: { bg: ERP.acornTags["社群"].bg, color: ERP.acornTags["社群"].color, border: ERP.acornTags["社群"].border },
  };

  const STATUS_CFG = {
    completed: { label: "已完成", color: ERP.colors.green, bg: ERP.colors.greenLight, border: "#86EFAC", icon: <CheckCircle2 size={11} /> },
    reviewing: { label: "審核中", color: ERP.colors.amber, bg: ERP.colors.amberLight, border: "#FDE68A", icon: <Clock size={11} /> },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: ERP.colors.pageBg, fontFamily: F, overflow: "hidden" }}>

      {/* ══════════════════════════════════════════════════════════════════════
          TOP NAV BAR — sticky, replaces sidebar context
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{
        height: 56, background: ERP.colors.surface,
        borderBottom: `1px solid ${ERP.colors.border}`,
        display: "flex", alignItems: "center", padding: "0 20px", gap: 10,
        flexShrink: 0, boxShadow: ERP.shadow.xs,
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <button onClick={onBack} style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "6px 12px", borderRadius: ERP.radius.md,
          border: `1px solid ${ERP.colors.border}`,
          background: ERP.colors.surface, color: ERP.colors.textSecondary,
          fontSize: 12, fontWeight: 500, fontFamily: F, cursor: "pointer", flexShrink: 0,
        }}>
          <ArrowLeft size={13} /> {backLabel}
        </button>

        {/* Dynamic breadcrumb — path changes based on routeSource */}
        <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 12, overflow: "hidden", flex: 1, flexWrap: "nowrap" }}>
          {crumbs.map((c, i) => (
            <React.Fragment key={i}>
              {i > 0 && <ChevronRight size={11} color={ERP.colors.textMuted} style={{ flexShrink: 0 }} />}
              {c.last ? (
                <BlurWrap on={pdpo} hint={false} inline>
                  <span style={{ fontWeight: 700, color: ERP.colors.textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {c.label}
                  </span>
                </BlurWrap>
              ) : c.clickable ? (
                <button onClick={onBack} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: 12, color: ERP.colors.accent, fontFamily: F, whiteSpace: "nowrap", textDecoration: "underline", textDecorationColor: ERP.colors.accentLight }}>
                  {c.label}
                </button>
              ) : (
                <span style={{ color: ERP.colors.textMuted, whiteSpace: "nowrap" }}>{c.label}</span>
              )}
            </React.Fragment>
          ))}
        </div>

        {!isMobile && (
          <BlurWrap on={pdpo} hint={false} inline>
            <span style={{ fontSize: 11, color: ERP.colors.textMuted, flexShrink: 0 }}>
              培道書院 Stewards Pooi Tun Secondary School
            </span>
          </BlurWrap>
        )}

        <button style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "7px 14px", borderRadius: ERP.radius.md,
          border: "none", background: ERP.colors.accent, color: "#fff",
          fontSize: 12, fontWeight: 700, fontFamily: F, cursor: "pointer",
          flexShrink: 0, boxShadow: `0 2px 8px ${ERP.colors.accent}40`,
        }}>
          <Download size={13} />
          {isMobile ? "匯出" : "組裝並匯出成果檔案"}
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SCROLLABLE CANVAS
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "16px" : "24px 28px 48px" }}>

        {/* ──────────────────────────────────────────────────────────────────
            PROFILE HERO CARD — dark gradient header + white footer
        ────────────────────────────────────────────────────────────────── */}
        <div style={{
          background: ERP.colors.surface,
          borderRadius: ERP.radius.xxl,
          overflow: "hidden",
          boxShadow: pdpo
            ? `0 0 0 2.5px #F59E0B, 0 0 0 7px rgba(245,158,11,0.14), ${ERP.shadow.lg}`
            : ERP.shadow.lg,
          marginBottom: 24,
          transition: "box-shadow 0.2s",
        }}>
          {/* PDPO amber status strip */}
          {pdpo && (
            <div style={{
              background: "rgba(245,158,11,0.13)",
              borderBottom: "1px solid rgba(245,158,11,0.28)",
              padding: "6px 26px",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <Shield size={11} color="#F59E0B" />
              <span style={{ fontSize: 10, fontWeight: 700, color: "#FBBF24", letterSpacing: "0.06em" }}>
                隱私保護模式啟動 · PDPO Privacy Mask Active · PII Obscured
              </span>
            </div>
          )}

          {/* Dark gradient section */}
          <div style={{
            background: "linear-gradient(135deg, #0F172A 0%, #1E1B4B 52%, #0C4A6E 100%)",
            padding: isMobile ? "20px" : "26px 30px",
            display: "flex", alignItems: "flex-start", justifyContent: "space-between",
            flexWrap: "wrap", gap: 18,
          }}>
            {/* Avatar + Name block */}
            <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 14 : 20 }}>
              <div style={{
                width: isMobile ? 62 : 78, height: isMobile ? 62 : 78,
                borderRadius: ERP.radius.xl, flexShrink: 0,
                background: pdpo
                  ? "linear-gradient(135deg, #78350F 0%, #92400E 100%)"
                  : "linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                border: pdpo ? "3px solid rgba(245,158,11,0.6)" : "3px solid rgba(255,255,255,0.18)",
                boxShadow: pdpo ? "0 6px 24px rgba(245,158,11,0.35)" : "0 6px 24px rgba(0,0,0,0.35)",
                transition: "all 0.2s",
              }}>
                {pdpo
                  ? <Shield size={isMobile ? 28 : 34} color="#F59E0B" />
                  : <span style={{ fontSize: isMobile ? 26 : 32, fontWeight: 900, color: "#fff", fontFamily: F }}>陳</span>
                }
              </div>
              <div>
                <div style={{ fontSize: isMobile ? 20 : 26, fontWeight: 900, color: "#F8FAFC", lineHeight: 1.15, letterSpacing: "-0.3px" }}>
                  {displayName}
                </div>
                <BlurWrap on={pdpo} hint>
                  <div style={{ fontSize: 13, color: "#94A3B8", marginTop: 3 }}>Chan Tai Man · {studentId}</div>
                </BlurWrap>
                <BlurWrap on={pdpo} hint={false}>
                  <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>培道書院 Stewards Pooi Tun Secondary School</div>
                </BlurWrap>
                {/* Tags */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                  {([
                    { label: "F1A",        bg: "#DBEAFE22", color: "#93C5FD", bd: "#3B82F640", pii: true  },
                    { label: "學號：1",    bg: "#FFFFFF10", color: "#CBD5E1", bd: "#FFFFFF1A", pii: true  },
                    { label: "在學",       bg: "#DCFCE720", color: "#86EFAC", bd: "#16A34A35", pii: false },
                    { label: "AY 2025/26", bg: "#FEF3C720", color: "#FCD34D", bd: "#D9770640", pii: false },
                  ] as { label: string; bg: string; color: string; bd: string; pii: boolean }[]).map(t => (
                    <BlurWrap key={t.label} on={pdpo && t.pii} hint inline>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: "3px 9px",
                        borderRadius: ERP.radius.full,
                        background: t.bg, color: t.color, border: `1px solid ${t.bd}`,
                      }}>{t.label}</span>
                    </BlurWrap>
                  ))}
                </div>
              </div>
            </div>

            {/* KPI Metric Cards */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {[
                {
                  mod: "Mod C · 積點", icon: <Zap size={14} color="#FCD34D" />, iconColor: "#FCD34D",
                  value: "1,250", unit: "校園自主積點 pts",
                },
                {
                  mod: "Mod D · 參與", icon: <TrendingUp size={14} color="#34D399" />, iconColor: "#34D399",
                  value: "88%", unit: "課堂參與度 · High",
                },
              ].map(kpi => (
                <div key={kpi.mod} style={{
                  padding: isMobile ? "10px 14px" : "13px 20px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.09)",
                  borderRadius: ERP.radius.lg, textAlign: "center" as const, minWidth: 116,
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, marginBottom: 5 }}>
                    {kpi.icon}
                    <span style={{ fontSize: 9, fontWeight: 700, color: kpi.iconColor, textTransform: "uppercase" as const, letterSpacing: "0.07em" }}>{kpi.mod}</span>
                  </div>
                  <div style={{ fontSize: isMobile ? 26 : 30, fontWeight: 900, color: kpi.iconColor, lineHeight: 1 }}>{kpi.value}</div>
                  <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 4 }}>{kpi.unit}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Light footer — module badges */}
          <div style={{
            padding: "11px 30px",
            background: "#FAFCFF",
            borderTop: "1px solid rgba(15,23,42,0.07)",
            display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const,
          }}>
            <span style={{ fontSize: 11, color: ERP.colors.textMuted, marginRight: 2 }}>關聯模組：</span>
            {[
              { label: "M3 · ACORN 成長特徵",  color: "#1D4ED8",         bg: "#DBEAFE"                },
              { label: "M4 · 成就證書審批",   color: "#16A34A",         bg: "#DCFCE7"                },
              { label: "M6 · AI 成果分析",    color: "#6D28D9",         bg: "#EDE9FE"                },
              { label: "Mod C · 積點制度",    color: ERP.colors.amber,  bg: ERP.colors.amberLight    },
              { label: "Mod D · 參與追蹤",    color: ERP.colors.teal,   bg: ERP.colors.tealLight     },
            ].map(m => (
              <span key={m.label} style={{
                fontSize: 10, fontWeight: 700, padding: "3px 9px",
                borderRadius: ERP.radius.full, background: m.bg, color: m.color,
              }}>{m.label}</span>
            ))}
          </div>
        </div>

        {/* ──────────────────────────────────────────────────────────────────
            HORIZONTAL TAB BAR
        ────────────────────────────────────────────────────────────────── */}
        {(() => {
          const TABS: { id: "overview" | "certs" | "academic" | "conduct"; icon: React.ReactNode; zh: string; short: string; en: string; badge?: number }[] = [
            { id: "overview",  icon: <BarChart2 size={14} />,  zh: "全人特徵圖譜",     short: "特徵圖譜", en: "Holistic Overview"      },
            { id: "certs",     icon: <FileBadge size={14} />,  zh: "🎖️ 成就與證書審批", short: "成就審批", en: "Cert Approvals", badge: 1 },
            { id: "academic",  icon: <BookOpen size={14} />,   zh: "學業成績明細",     short: "學業成績", en: "Academic Records"       },
            { id: "conduct",   icon: <UserCheck size={14} />,  zh: "行為與出缺席",     short: "行為出缺", en: "Conduct & Attendance"   },
          ];
          return (
            <div style={{
              display: "flex", alignItems: "stretch", gap: 0,
              background: ERP.colors.surface,
              border: `1px solid ${ERP.colors.border}`,
              borderRadius: ERP.radius.xl,
              overflow: "hidden",
              marginBottom: 20,
              boxShadow: ERP.shadow.sm,
            }}>
              {TABS.map((tab, idx) => {
                const isActive = activeTab === tab.id;
                const isLast   = idx === TABS.length - 1;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      flex: 1,
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      gap: 3,
                      padding: isMobile ? "10px 8px" : "13px 16px",
                      border: "none",
                      borderRight: !isLast ? `1px solid ${ERP.colors.border}` : "none",
                      borderBottom: isActive ? `3px solid ${ERP.colors.accent}` : "3px solid transparent",
                      background: isActive ? ERP.colors.accentPale : "transparent",
                      cursor: "pointer",
                      fontFamily: F,
                      transition: "background 0.12s, border-color 0.12s",
                    }}
                  >
                    <div style={{
                      display: "flex", alignItems: "center", gap: isMobile ? 3 : 5,
                      color: isActive ? ERP.colors.accent : ERP.colors.textSecondary,
                    }}>
                      {!isMobile && tab.icon}
                      <span style={{
                        fontSize: isMobile ? 10.5 : 13,
                        fontWeight: isActive ? 800 : 500,
                        whiteSpace: "nowrap" as const,
                      }}>
                        {isMobile ? tab.short : tab.zh}
                      </span>
                      {tab.badge && (
                        <span style={{
                          fontSize: 9, fontWeight: 800,
                          background: ERP.colors.red, color: "#fff",
                          borderRadius: ERP.radius.full, padding: "1px 5px",
                          lineHeight: 1.4,
                        }}>{tab.badge}</span>
                      )}
                    </div>
                    {!isMobile && (
                      <span style={{ fontSize: 9, color: isActive ? ERP.colors.accent : ERP.colors.textMuted, opacity: 0.72 }}>
                        {tab.en}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })()}

        {/* ──────────────────────────────────────────────────────────────────
            TAB CONTENT: OVERVIEW (existing ACORN + AI narrative content)
        ────────────────────────────────────────────────────────────────── */}
        {activeTab === "overview" && (<>

        {/* ──────────────────────────────────────────────────────────────────
            2-COLUMN MAIN  (Left: ACORN radar · Right: AI narrative)
        ────────────────────────────────────────────────────────────────── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 420px",
          gap: 20, marginBottom: 24, alignItems: "start",
        }}>

          {/* ═══ LEFT — ACORN RADAR CARD ═══════════════════════════════════ */}
          <div style={{
            background: ERP.colors.surface, borderRadius: ERP.radius.xl,
            border: `1px solid ${ERP.colors.border}`, overflow: "hidden", boxShadow: ERP.shadow.md,
          }}>
            {/* Card header + YoY toggle */}
            <div style={{
              padding: "16px 20px 14px",
              borderBottom: `1px solid ${ERP.colors.divider}`,
              display: "flex", alignItems: "center", justifyContent: "space-between",
              flexWrap: "wrap", gap: 10,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: ERP.radius.md, flexShrink: 0,
                  background: `linear-gradient(135deg, ${ERP.colors.accent}, #6366F1)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <BarChart2 size={17} color="#fff" />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: ERP.colors.textPrimary }}>ACORN 六維學習特徵圖譜</span>
                    <span style={{
                      fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 3,
                      background: ERP.colors.accentPale, color: ERP.colors.accent, border: `1px solid ${ERP.colors.accentLight}`,
                    }}>M3</span>
                  </div>
                  {/* View Year dropdown — primary selector */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: ERP.colors.textMuted, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>查看學年</span>
                    <div style={{ position: "relative" }}>
                      <select
                        value={viewYear}
                        onChange={e => setViewYear(e.target.value)}
                        style={{
                          padding: "3px 22px 3px 8px", fontSize: 11, fontWeight: 700,
                          border: `1px solid ${ERP.colors.border}`, borderRadius: ERP.radius.md,
                          background: ERP.colors.surfaceHover, color: ERP.colors.accent,
                          fontFamily: ERP.font.family, appearance: "none", cursor: "pointer", outline: "none",
                        }}
                      >
                        {Object.keys(ACORN_DATA).map(yr => (
                          <option key={yr} value={yr}>{ACORN_DATA[yr].label}</option>
                        ))}
                      </select>
                      <ChevronDown size={10} color={ERP.colors.accent} style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* YoY Toggle + Year Selector */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {/* Toggle pill */}
                <div
                  onClick={() => setShowYoY(v => !v)}
                  style={{
                    display: "flex", alignItems: "center", gap: 7, cursor: "pointer",
                    padding: "7px 12px", borderRadius: ERP.radius.md,
                    border: `1px solid ${showYoY ? "#6EE7B7" : ERP.colors.border}`,
                    background: showYoY ? "#ECFDF5" : ERP.colors.surfaceHover,
                    transition: "all 0.15s",
                  }}
                >
                  {showYoY
                    ? <ToggleRight size={22} color="#6EE7B7" />
                    : <ToggleLeft  size={22} color={ERP.colors.textMuted} />
                  }
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: showYoY ? "#059669" : ERP.colors.textSecondary }}>
                      跨年級歷史軌跡比對
                    </div>
                    <div style={{ fontSize: 9, color: showYoY ? "#6EE7B7" : ERP.colors.textMuted }}>
                      YoY Trajectory Overlay
                    </div>
                  </div>
                </div>

                {/* Compare-year dropdown — only visible when toggle is ON and options exist */}
                {showYoY && cmpOptions.length > 0 && (
                  <div style={{ position: "relative" }}>
                    <select
                      value={effectiveCmp}
                      onChange={e => setCmpYear(e.target.value)}
                      style={{
                        padding: "6px 26px 6px 9px", fontSize: 11, fontWeight: 700,
                        border: "1px solid #6EE7B7", borderRadius: ERP.radius.md,
                        background: "#ECFDF5", color: "#059669",
                        fontFamily: ERP.font.family, appearance: "none", cursor: "pointer", outline: "none",
                      }}
                    >
                      {cmpOptions.map(yr => (
                        <option key={yr} value={yr}>對比學年：{ACORN_DATA[yr]?.label ?? yr}</option>
                      ))}
                    </select>
                    <ChevronDown size={11} color="#059669" style={{ position: "absolute", right: 7, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                  </div>
                )}
                {showYoY && cmpOptions.length === 0 && (
                  <div style={{
                    padding: "6px 12px", fontSize: 11, fontWeight: 700,
                    border: "1px solid #FED7AA", borderRadius: ERP.radius.md,
                    background: "#FFF7ED", color: "#92400E",
                  }}>
                    入學基準年 — 無可對比資料
                  </div>
                )}
              </div>
            </div>

            {/* ── Legend strip (visible when YoY ON and compare data exists) ── */}
            {showCmp && (
              <div style={{
                margin: "12px 20px 0",
                padding: "9px 14px",
                background: "linear-gradient(90deg, #ECFDF5, #FFF5F5)",
                border: "1px solid #A7F3D0",
                borderRadius: ERP.radius.md,
                display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" as const,
              }}>
                {/* Primary (view) year */}
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#6EE7B7", display: "inline-block", boxShadow: "0 0 0 3px rgba(110,231,183,0.30)" }} />
                  <svg width="24" height="4" style={{ flexShrink: 0 }}><line x1="0" y1="2" x2="24" y2="2" stroke="#6EE7B7" strokeWidth="2.8" /></svg>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#059669" }}>🟢 {viewData.label}</span>
                </div>
                {/* Comparison year */}
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#EF4444", display: "inline-block", boxShadow: "0 0 0 3px rgba(239,68,68,0.18)" }} />
                  <svg width="24" height="4" style={{ flexShrink: 0 }}><line x1="0" y1="2" x2="24" y2="2" stroke="#DC2626" strokeWidth="2" strokeDasharray="5,3" /></svg>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#DC2626" }}>🔴 歷史軌跡 · {cmpData?.label ?? ""}</span>
                </div>
                {/* Best growth callout */}
                <span style={{
                  marginLeft: "auto", display: "flex", alignItems: "center", gap: 5,
                  padding: "3px 10px", borderRadius: ERP.radius.full,
                  background: "#D1FAE5", border: "1px solid #6EE7B7",
                }}>
                  <TrendingUp size={11} color="#059669" />
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#059669" }}>最大進步：協作 +11pts</span>
                </span>
              </div>
            )}

            {/* ── Hex Radar ── */}
            <div style={{ padding: showYoY ? "16px 36px 16px" : "28px 36px 16px", display: "flex", justifyContent: "center" }}>
              <div style={{ width: "100%", maxWidth: 360 }}>
                <HexRadar
                showPrevious={showCmp}
                scoresNow={viewData.scores}
                scoresPrev={cmpData?.scores ?? []}
              />
              </div>
            </div>

            {/* Dimension breakdown — dual-track bullet chart */}
            <div style={{ padding: "8px 20px 22px" }}>
              {/* Section label */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: ERP.colors.textMuted, textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>
                  維度細分 Dimension Breakdown
                </span>
                {showCmp && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9, fontWeight: 700, color: "#059669" }}>
                      <span style={{ width: 8, height: 4, borderRadius: 2, background: "#6EE7B7", display: "inline-block" }} />{viewYear}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9, fontWeight: 700, color: "#DC2626" }}>
                      <span style={{ width: 8, height: 3, borderRadius: 2, background: "#EF4444", display: "inline-block" }} />{effectiveCmp}
                    </span>
                  </div>
                )}
              </div>

              {ACORN_AXES.map((ax, i) => {
                const now   = viewData.scores[i];
                const prev  = cmpData?.scores[i] ?? 0;
                const delta = now - prev;
                return (
                  <div key={i} style={{ marginBottom: 13 }}>
                    {/* Row header */}
                    <div style={{ display: "flex", alignItems: "center", marginBottom: 5 }}>
                      {/* Dimension label */}
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
                        <span style={{ width: 9, height: 9, borderRadius: "50%", background: ax.color, display: "inline-block", flexShrink: 0, boxShadow: `0 0 0 2px ${ax.color}25` }} />
                        <span style={{ fontSize: 12, fontWeight: 700, color: ERP.colors.textPrimary }}>{ax.zh}</span>
                        <span style={{ fontSize: 9, color: ERP.colors.textMuted }}>{ax.en}</span>
                      </div>
                      {/* Score numbers + delta */}
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                        <span style={{ fontSize: 13, fontWeight: 900, color: "#059669" }}>🟢 {now}</span>
                        {showCmp && (
                          <>
                            <span style={{ fontSize: 10, color: ERP.colors.textMuted }}>vs</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: "#DC2626" }}>🔴 {prev}</span>
                            <span style={{
                              fontSize: 9, fontWeight: 800, padding: "2px 6px",
                              borderRadius: ERP.radius.full,
                              background: "#D1FAE5", color: "#059669",
                              border: "1px solid #6EE7B7",
                              whiteSpace: "nowrap" as const,
                            }}>
                              📈 +{delta}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Dual-track bars */}
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      {/* Year label column */}
                      {showCmp && (
                        <div style={{ display: "flex", flexDirection: "column" as const, gap: 3, flexShrink: 0 }}>
                          <span style={{ fontSize: 8, fontWeight: 700, color: "#059669", lineHeight: 1.6 }}>NOW</span>
                          <span style={{ fontSize: 8, fontWeight: 700, color: "#EF4444", lineHeight: 1.6 }}>YoY</span>
                        </div>
                      )}
                      {/* Bar tracks */}
                      <div style={{ flex: 1, display: "flex", flexDirection: "column" as const, gap: 3 }}>
                        {/* Emerald track — current year (taller) */}
                        <div style={{ position: "relative" as const, height: 8, borderRadius: 4, background: "#ECFDF5", overflow: "hidden" }}>
                          <div style={{
                            position: "absolute" as const, left: 0, top: 0, bottom: 0,
                            width: `${now}%`, borderRadius: 4,
                            background: "linear-gradient(90deg, #A7F3D0, #6EE7B7)",
                          }} />
                          {/* Subtle score marker */}
                          <div style={{ position: "absolute" as const, left: `${now}%`, top: 0, bottom: 0, width: 2, background: "#059669", borderRadius: 1, transform: "translateX(-50%)" }} />
                        </div>
                        {/* Red track — historical year (slightly thinner) */}
                        {showCmp && (
                          <div style={{ position: "relative" as const, height: 6, borderRadius: 4, background: "#FFF5F5", overflow: "hidden" }}>
                            <div style={{
                              position: "absolute" as const, left: 0, top: 0, bottom: 0,
                              width: `${prev}%`, borderRadius: 4,
                              background: "linear-gradient(90deg, #FCA5A5, #EF4444)",
                              opacity: 0.82,
                            }} />
                            <div style={{ position: "absolute" as const, left: `${prev}%`, top: 0, bottom: 0, width: 2, background: "#DC2626", borderRadius: 1, transform: "translateX(-50%)", opacity: 0.7 }} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ═══ RIGHT — AI NARRATIVE + SUMMARY ════════════════════════════ */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

            {/* AI Narrative Card */}
            <div style={{
              background: pdpo
                ? "linear-gradient(145deg, #FFFBEB 0%, #FEF3C7 48%, #ECFDF5 100%)"
                : "linear-gradient(145deg, #EEF2FF 0%, #FAF5FF 48%, #ECFDF5 100%)",
              borderRadius: ERP.radius.xl,
              border: pdpo ? "1.5px solid #F59E0B" : "1px solid #C4B5FD",
              padding: "22px",
              position: "relative" as const,
              overflow: "hidden",
              boxShadow: pdpo
                ? `0 0 0 4px rgba(245,158,11,0.10), ${ERP.shadow.md}`
                : ERP.shadow.md,
              transition: "border-color 0.2s, box-shadow 0.2s",
            }}>
              {/* Decorative blur orb */}
              <div style={{ position: "absolute" as const, top: -28, right: -28, width: 130, height: 130, borderRadius: "50%", background: "radial-gradient(circle, #818CF822 0%, transparent 70%)", pointerEvents: "none" }} />
              <div style={{ position: "absolute" as const, bottom: -20, left: -20, width: 90, height: 90, borderRadius: "50%", background: "radial-gradient(circle, #A7F3D020 0%, transparent 70%)", pointerEvents: "none" }} />

              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 16, position: "relative" as const }}>
                <div style={{
                  width: 32, height: 32, borderRadius: ERP.radius.md, flexShrink: 0,
                  background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Sparkles size={16} color="#fff" />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#3730A3" }}>AI 成果智能評語</div>
                  <div style={{ fontSize: 9, color: "#7C3AED" }}>AI Generated Narrative · Mod 6</div>
                </div>
                <span style={{ marginLeft: "auto", fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 3, background: "#EDE9FE", color: "#6D28D9", border: "1px solid #C4B5FD" }}>M6</span>
              </div>

              {/* AI text body */}
              <p style={{ fontSize: 14, lineHeight: 1.78, color: "#1E1B4B", margin: "0 0 6px", fontFamily: F, position: "relative" as const }}>
                {aiText}
              </p>
              <p style={{ fontSize: 10, color: "#7C3AED", margin: "0 0 18px", opacity: 0.68, fontStyle: "italic" as const, lineHeight: 1.5 }}>
                Generated based on ACORN dataset and Mod B footprints · 2026-08-07 14:35 HKT
              </p>

              {/* PDPO Mask Toggle */}
              <div style={{
                padding: "11px 14px",
                background: pdpo ? "rgba(255,251,235,0.90)" : "rgba(255,255,255,0.75)",
                borderRadius: ERP.radius.lg,
                border: `1.5px solid ${pdpo ? "#F59E0B" : "#DDE1E7"}`,
                display: "flex", alignItems: "center", justifyContent: "space-between",
                backdropFilter: "blur(8px)",
                transition: "all 0.18s",
              }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <Shield size={12} color={pdpo ? "#F59E0B" : ERP.colors.textMuted} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: pdpo ? "#92400E" : ERP.colors.textSecondary }}>
                      套用脫敏遮罩
                    </span>
                  </div>
                  <div style={{ fontSize: 10, color: pdpo ? "#B45309" : ERP.colors.textMuted, marginTop: 2 }}>
                    Apply PDPO Mask · Cl.6.1 · {pdpo ? "Student #CTM-001 🛡️" : "陳大文"}
                  </div>
                </div>
                <button onClick={() => setPdpo(v => !v)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
                  {pdpo
                    ? <ToggleRight size={30} color="#F59E0B" />
                    : <ToggleLeft  size={30} color="#94A3B8" />
                  }
                </button>
              </div>
            </div>

            {/* Achievement Summary Card */}
            <div style={{ background: ERP.colors.surface, borderRadius: ERP.radius.xl, border: `1px solid ${ERP.colors.border}`, padding: "18px 20px", boxShadow: ERP.shadow.sm }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: ERP.colors.textSecondary, marginBottom: 14, display: "flex", alignItems: "center", gap: 7 }}>
                <Award size={15} color={ERP.colors.amber} />
                成就概覽 Achievement Summary
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { label: "完成 PBL",    value: "3",     unit: "個專題", color: ERP.colors.accent  },
                  { label: "參與活動",    value: "7",     unit: "次",     color: ERP.colors.teal    },
                  { label: "擔任領導角色",value: "2",     unit: "次 T3",  color: ERP.colors.purple  },
                  { label: "累計積點",    value: "1,250", unit: "pts",    color: ERP.colors.amber   },
                ].map(s => (
                  <div key={s.label} style={{ padding: "11px 13px", borderRadius: ERP.radius.md, background: s.color + "0D", border: `1px solid ${s.color}20` }}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
                    <div style={{ fontSize: 10, color: ERP.colors.textMuted, marginTop: 1 }}>{s.unit}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: ERP.colors.textSecondary, marginTop: 3 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>{/* /right col */}
        </div>{/* /2-col */}

        {/* ──────────────────────────────────────────────────────────────────
            ACTIVITY MATRIX  —  PBL & ECA Footprints
        ────────────────────────────────────────────────────────────────── */}
        <div style={{ background: ERP.colors.surface, borderRadius: ERP.radius.xl, border: `1px solid ${ERP.colors.border}`, overflow: "hidden", boxShadow: ERP.shadow.sm }}>
          {/* Section header */}
          <div style={{ padding: "14px 22px", borderBottom: `1px solid ${ERP.colors.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: ERP.radius.md, background: ERP.colors.accentPale, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Layers size={15} color={ERP.colors.accent} />
              </div>
              <div>
                <span style={{ fontSize: 14, fontWeight: 700, color: ERP.colors.textPrimary }}>近期跨學科實作與活動軌跡</span>
                <div style={{ fontSize: 10, color: ERP.colors.textMuted }}>Recent PBL &amp; Activity Footprints</div>
              </div>
            </div>
            <span style={{ fontSize: 11, color: ERP.colors.textMuted }}>{ACTIVITIES.length} 項記錄</span>
          </div>

          {/* Activity rows */}
          {ACTIVITIES.map((act, idx) => {
            const dim   = ACORN_AXES[act.acornIdx];
            const tier  = TIER_CFG[act.roleTier];
            const stat  = STATUS_CFG[act.status];
            const isLast = idx === ACTIVITIES.length - 1;

            return (
              <div
                key={act.id}
                style={{
                  display: "flex", alignItems: "center", gap: 16,
                  padding: "16px 22px",
                  borderBottom: !isLast ? `1px solid ${ERP.colors.divider}` : "none",
                  flexWrap: "wrap" as const,
                  transition: "background 0.1s",
                }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = ERP.colors.surfaceHover}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = "transparent"}
              >
                {/* Timeline dot */}
                <div style={{
                  width: 12, height: 12, borderRadius: "50%", flexShrink: 0,
                  background: dim.color, border: "2.5px solid #fff",
                  boxShadow: `0 0 0 2.5px ${dim.color}40`,
                }} />

                {/* Name + date */}
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: ERP.colors.textPrimary, marginBottom: 2 }}>{act.name}</div>
                  <div style={{ fontSize: 11, color: ERP.colors.textMuted, display: "flex", alignItems: "center", gap: 5 }}>
                    <Calendar size={10} /> {act.date} · {act.enName}
                  </div>
                </div>

                {/* Subject */}
                <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: ERP.radius.xs, background: ERP.colors.accentPale, color: ERP.colors.accent, flexShrink: 0 }}>
                  {act.subject}
                </span>

                {/* Tier + role */}
                <div style={{ display: "flex", gap: 5, alignItems: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 7px", borderRadius: ERP.radius.xs, background: tier.bg, color: tier.color, border: `1px solid ${tier.border}` }}>
                    {act.roleTier}
                  </span>
                  <span style={{ fontSize: 12, color: ERP.colors.textSecondary }}>角色：{act.role}</span>
                </div>

                {/* Status */}
                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: ERP.radius.full, background: stat.bg, color: stat.color, border: `1px solid ${stat.border}`, flexShrink: 0 }}>
                  {stat.icon} 狀態：{stat.label}
                </span>

                {/* ACORN tag + pts */}
                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: ERP.radius.full, background: dim.bg, color: dim.color, border: `1px solid ${dim.border}`, flexShrink: 0 }}>
                  獲得標籤：{dim.zh} +{act.acornPts}
                </span>
              </div>
            );
          })}
        </div>

        </>)} {/* /activeTab === "overview" */}

        {/* ──────────────────────────────────────────────────────────────────
            TAB CONTENT: CERT APPROVALS  —  Teacher Approval Dashboard
        ────────────────────────────────────────────────────────────────── */}
        {activeTab === "certs" && (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20, alignItems: "start" }}>

            {/* ═══ LEFT: Document Viewer ═══════════════════════════════════ */}
            <div style={{ background: ERP.colors.surface, borderRadius: ERP.radius.xl, border: `1px solid ${ERP.colors.border}`, overflow: "hidden", boxShadow: ERP.shadow.md }}>
              {/* Panel header */}
              <div style={{ padding: "13px 18px", borderBottom: `1px solid ${ERP.colors.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: "#FAFCFF" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 30, height: 30, borderRadius: ERP.radius.md, background: ERP.colors.accentPale, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <FileText size={15} color={ERP.colors.accent} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: ERP.colors.textPrimary }}>待處理提報</div>
                    <div style={{ fontSize: 10, color: ERP.colors.textMuted }}>Pending Submissions</div>
                  </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: ERP.radius.full, background: ERP.colors.redLight, color: ERP.colors.red, border: `1px solid ${ERP.colors.red}40` }}>
                  1 份待審
                </span>
              </div>

              {/* Sub-header */}
              <div style={{ padding: "10px 18px 8px", borderBottom: `1px solid ${ERP.colors.divider}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: ERP.colors.textMuted }}>
                  <ScanLine size={11} />
                  學生上傳的原始檔 Original File Uploaded by Student · 2026-08-04 09:17 HKT
                </div>
              </div>

              {/* Certificate visual */}
              <div style={{ padding: "18px 20px" }}>
                <div style={{
                  position: "relative",
                  background: "linear-gradient(160deg, #0C1445 0%, #1a1060 45%, #0D3B5E 100%)",
                  borderRadius: ERP.radius.lg,
                  padding: "28px 24px 24px",
                  border: "3px solid #B45309",
                  overflow: "hidden",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
                }}>
                  {/* Decorative corner ornaments */}
                  {[["0","0"], ["0","auto"], ["auto","0"], ["auto","auto"]].map(([t,b], i) => (
                    <div key={i} style={{ position: "absolute", top: t === "0" ? 8 : "auto", bottom: b === "auto" ? 8 : "auto", left: i < 2 ? 8 : "auto", right: i >= 2 ? 8 : "auto", width: 20, height: 20, borderTop: i < 2 ? "2px solid #D97706" : "none", borderBottom: i >= 2 ? "2px solid #D97706" : "none", borderLeft: i % 2 === 0 ? "2px solid #D97706" : "none", borderRight: i % 2 === 1 ? "2px solid #D97706" : "none" }} />
                  ))}
                  {/* Watermark glow */}
                  <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(212,170,60,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />

                  {/* Crest */}
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
                    <div style={{ width: 54, height: 54, borderRadius: "50%", background: "linear-gradient(135deg, #D97706, #F59E0B)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(217,119,6,0.55)" }}>
                      <Trophy size={26} color="#fff" />
                    </div>
                  </div>

                  {/* Cert org */}
                  <div style={{ textAlign: "center", marginBottom: 6 }}>
                    <div style={{ fontSize: 9, fontWeight: 800, color: "#D97706", letterSpacing: "0.18em", textTransform: "uppercase" as const }}>HONG KONG REGIONAL SCIENCE EDUCATION FEDERATION</div>
                    <div style={{ fontSize: 9, color: "#8BA3C4", marginTop: 1 }}>香港地區科學教育聯合會</div>
                  </div>

                  {/* Divider */}
                  <div style={{ borderTop: "1px solid #D9770640", margin: "10px 0" }} />

                  {/* Title */}
                  <div style={{ textAlign: "center", marginBottom: 10 }}>
                    <div style={{ fontSize: 11, color: "#94A3B8", letterSpacing: "0.05em", marginBottom: 4 }}>Certificate of Excellence</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: "#F8FAFC", letterSpacing: "-0.3px", lineHeight: 1.25 }}>Regional Science</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: "#F8FAFC", letterSpacing: "-0.3px" }}>Competition 2025</div>
                    <div style={{ fontSize: 9, color: "#64748B", marginTop: 2 }}>第二屆地區科學競賽 二〇二五年</div>
                  </div>

                  {/* Awarded to */}
                  <div style={{ textAlign: "center", marginBottom: 12 }}>
                    <div style={{ fontSize: 9, color: "#64748B", letterSpacing: "0.1em", textTransform: "uppercase" as const, marginBottom: 5 }}>This is to certify that</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: "#F1C40F", letterSpacing: "-0.2px" }}>陳大文 Chan Tai Man</div>
                    <div style={{ fontSize: 10, color: "#8BA3C4", marginTop: 2 }}>F1A · 培道書院 Stewards Pooi Tun Secondary School</div>
                  </div>

                  {/* Gold Award badge */}
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 18px", background: "linear-gradient(135deg, #D97706, #F59E0B)", borderRadius: ERP.radius.full, boxShadow: "0 4px 14px rgba(217,119,6,0.55)" }}>
                      <Star size={14} color="#fff" fill="#fff" />
                      <span style={{ fontSize: 14, fontWeight: 900, color: "#fff", letterSpacing: "0.05em" }}>GOLD AWARD · 金獎</span>
                      <Star size={14} color="#fff" fill="#fff" />
                    </div>
                  </div>

                  {/* Footer */}
                  <div style={{ borderTop: "1px solid #D9770640", paddingTop: 10, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <div style={{ fontSize: 8, color: "#64748B" }}>
                      <div>日期 Date</div>
                      <div style={{ color: "#94A3B8", fontWeight: 700 }}>15 / 11 / 2025</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 8, color: "#64748B" }}>Cert No.</div>
                      <div style={{ fontSize: 8, color: "#94A3B8", fontFamily: ERP.font.mono, fontWeight: 700 }}>HK-RSC-2025-G-0042</div>
                    </div>
                    <div style={{ textAlign: "right", fontSize: 8, color: "#64748B" }}>
                      <div>主席簽署 Chairperson</div>
                      <div style={{ color: "#94A3B8", fontStyle: "italic" as const }}>Dr. Wong Siu Ming</div>
                    </div>
                  </div>

                  {/* Approval / rejection stamp overlay */}
                  {approvalStatus === "approved" && (
                    <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%) rotate(-15deg)", pointerEvents: "none" }}>
                      <div style={{ border: "4px solid #16A34A", borderRadius: 8, padding: "6px 14px", opacity: 0.75 }}>
                        <div style={{ fontSize: 28, fontWeight: 900, color: "#16A34A", letterSpacing: "0.12em", whiteSpace: "nowrap" }}>已核准 APPROVED</div>
                      </div>
                    </div>
                  )}
                  {approvalStatus === "rejected" && (
                    <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%) rotate(-15deg)", pointerEvents: "none" }}>
                      <div style={{ border: "4px solid #DC2626", borderRadius: 8, padding: "6px 14px", opacity: 0.75 }}>
                        <div style={{ fontSize: 28, fontWeight: 900, color: "#DC2626", letterSpacing: "0.12em", whiteSpace: "nowrap" }}>已退回 REJECTED</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* AI Confidence bar */}
                <div style={{ marginTop: 12, padding: "10px 14px", background: ERP.colors.greenLight, border: `1px solid ${ERP.colors.green}40`, borderRadius: ERP.radius.md, display: "flex", alignItems: "center", gap: 8 }}>
                  <CheckCircle2 size={14} color={ERP.colors.green} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: ERP.colors.green }}>
                      AI 信心指數 Confidence Score：94.7%
                    </div>
                    <div style={{ fontSize: 9, color: "#166534", marginTop: 1 }}>高置信度 · 建議直接核准 High Confidence — Approve Recommended</div>
                  </div>
                  <div style={{ display: "flex", gap: 2 }}>
                    {[90, 80, 70, 90, 95].map((h, i) => (
                      <div key={i} style={{ width: 4, height: h * 0.28, background: ERP.colors.green, borderRadius: 2, opacity: 0.5 + i * 0.1 }} />
                    ))}
                  </div>
                </div>

                {/* File meta */}
                <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", background: ERP.colors.pageBg, border: `1px solid ${ERP.colors.border}`, borderRadius: ERP.radius.md }}>
                  <FileText size={12} color={ERP.colors.textMuted} />
                  <span style={{ fontSize: 10, color: ERP.colors.textMuted }}>cert_regional_science_2025.pdf · 1.2 MB · 由學生上傳</span>
                  <button style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, color: ERP.colors.accent, background: "none", border: "none", cursor: "pointer", fontFamily: F }}>檢視原檔</button>
                </div>
              </div>
            </div>

            {/* ═══ RIGHT: AI Extraction & Approval Form ════════════════════ */}
            <div style={{ background: ERP.colors.surface, borderRadius: ERP.radius.xl, border: `1px solid ${ERP.colors.border}`, overflow: "hidden", boxShadow: ERP.shadow.md }}>
              {/* Panel header */}
              <div style={{ padding: "13px 18px", borderBottom: `1px solid ${ERP.colors.border}`, background: "linear-gradient(135deg, #ECFDF5, #EFF6FF)", display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 30, height: 30, borderRadius: ERP.radius.md, background: "linear-gradient(135deg, #059669, #2563EB)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <BadgeCheck size={15} color="#fff" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: ERP.colors.textPrimary }}>AI 語義萃取與審批</span>
                    <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 3, background: "#DCFCE7", color: "#15803D", border: "1px solid #86EFAC" }}>M4</span>
                  </div>
                  <div style={{ fontSize: 10, color: ERP.colors.textMuted }}>AI OCR Extraction &amp; Teacher Review</div>
                </div>
              </div>

              {/* Approval status banner */}
              {approvalStatus === "approved" && (
                <div style={{ padding: "10px 18px", background: ERP.colors.greenLight, borderBottom: `1px solid ${ERP.colors.green}40`, display: "flex", alignItems: "center", gap: 8 }}>
                  <CheckCircle2 size={14} color={ERP.colors.green} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: ERP.colors.green }}>已核准並寫入學生檔案 Approved & Locked to Record</div>
                    <div style={{ fontSize: 10, color: "#166534" }}>ACORN 圖譜及自主積點已自動更新 · {new Date().toLocaleDateString("zh-HK")}</div>
                  </div>
                  <button onClick={() => { setApprovalStatus("pending"); setShowRejectInput(false); }} style={{ marginLeft: "auto", fontSize: 10, color: ERP.colors.textMuted, background: "none", border: "none", cursor: "pointer", fontFamily: F, display: "flex", alignItems: "center", gap: 4 }}>
                    <RotateCcw size={11} /> 撤銷
                  </button>
                </div>
              )}
              {approvalStatus === "rejected" && (
                <div style={{ padding: "10px 18px", background: ERP.colors.redLight, borderBottom: `1px solid ${ERP.colors.red}40`, display: "flex", alignItems: "center", gap: 8 }}>
                  <XCircle size={14} color={ERP.colors.red} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: ERP.colors.red }}>已退回重交 Returned for Resubmission</div>
                    {rejectReason && <div style={{ fontSize: 10, color: "#991B1B" }}>原因：{rejectReason}</div>}
                  </div>
                  <button onClick={() => { setApprovalStatus("pending"); setShowRejectInput(false); setRejectReason(""); }} style={{ marginLeft: "auto", fontSize: 10, color: ERP.colors.textMuted, background: "none", border: "none", cursor: "pointer", fontFamily: F, display: "flex", alignItems: "center", gap: 4 }}>
                    <RotateCcw size={11} /> 重置
                  </button>
                </div>
              )}

              {/* Form body */}
              <div style={{ padding: "16px 18px" }}>

                {/* Info alert */}
                <div style={{ padding: "11px 14px", background: "#EFF6FF", border: `1px solid #BFDBFE`, borderRadius: ERP.radius.md, display: "flex", alignItems: "flex-start", gap: 9, marginBottom: 18 }}>
                  <AlertCircle size={14} color="#2563EB" style={{ flexShrink: 0, marginTop: 1 }} />
                  <p style={{ fontSize: 12, lineHeight: 1.7, color: "#1E3A5F", margin: 0, fontFamily: F }}>
                    AI 已自動萃取以下欄位，請教師核對並分配相應的成就級別，核准後將自動更新學生的 <strong>ACORN 圖譜</strong>與<strong>自主積點</strong>。
                  </p>
                </div>

                {/* ── Form Fields ────────────────────────────────────────── */}
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                  {/* Achievement Title */}
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: ERP.colors.textSecondary, marginBottom: 5 }}>
                      成就名稱 Achievement Title
                      <span style={{ marginLeft: 6, fontSize: 9, fontWeight: 800, background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE", borderRadius: 3, padding: "1px 5px" }}>AI 萃取</span>
                    </label>
                    <input
                      type="text"
                      value={certTitle}
                      onChange={e => setCertTitle(e.target.value)}
                      disabled={approvalStatus !== "pending"}
                      style={{ width: "100%", padding: "9px 12px", border: `1.5px solid ${ERP.colors.border}`, borderRadius: ERP.radius.md, fontSize: 13, fontWeight: 600, color: ERP.colors.textPrimary, fontFamily: F, background: approvalStatus !== "pending" ? ERP.colors.pageBg : ERP.colors.surface, outline: "none", boxSizing: "border-box" as const }}
                    />
                  </div>

                  {/* Award Details */}
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: ERP.colors.textSecondary, marginBottom: 5 }}>
                      獲獎詳情 Award Details
                      <span style={{ marginLeft: 6, fontSize: 9, fontWeight: 800, background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE", borderRadius: 3, padding: "1px 5px" }}>AI 萃取</span>
                    </label>
                    <input
                      type="text"
                      value={certAward}
                      onChange={e => setCertAward(e.target.value)}
                      disabled={approvalStatus !== "pending"}
                      style={{ width: "100%", padding: "9px 12px", border: `1.5px solid ${ERP.colors.border}`, borderRadius: ERP.radius.md, fontSize: 13, fontWeight: 600, color: ERP.colors.textPrimary, fontFamily: F, background: approvalStatus !== "pending" ? ERP.colors.pageBg : ERP.colors.surface, outline: "none", boxSizing: "border-box" as const }}
                    />
                  </div>

                  {/* Dropdowns row */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {/* Environment Level */}
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: ERP.colors.textSecondary, marginBottom: 5 }}>
                        成就環境級別 Environment Level
                        <span style={{ marginLeft: 5, fontSize: 9, fontWeight: 800, background: "#FEF3C7", color: "#D97706", border: "1px solid #FDE68A", borderRadius: 3, padding: "1px 5px" }}>必填</span>
                      </label>
                      <div style={{ position: "relative" }}>
                        <select
                          value={certLevel}
                          onChange={e => setCertLevel(e.target.value)}
                          disabled={approvalStatus !== "pending"}
                          style={{ width: "100%", padding: "9px 28px 9px 10px", border: `1.5px solid ${certLevel === "L4" ? ERP.colors.accent : ERP.colors.border}`, borderRadius: ERP.radius.md, fontSize: 12, fontWeight: 700, color: certLevel === "L4" ? ERP.colors.accent : ERP.colors.textPrimary, fontFamily: F, background: certLevel === "L4" ? ERP.colors.accentPale : approvalStatus !== "pending" ? ERP.colors.pageBg : ERP.colors.surface, appearance: "none" as const, cursor: "pointer", outline: "none" }}>
                          <option value="L4">L4 國際／全港 (Regional/Global)</option>
                          <option value="L3">L3 校際 (Inter-School)</option>
                          <option value="L2">L2 全校 (School-wide)</option>
                          <option value="L1">L1 班級／學會 (Class/Society)</option>
                        </select>
                        <ChevronDown size={11} color={ERP.colors.textMuted} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                      </div>
                    </div>

                    {/* Tier Role */}
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: ERP.colors.textSecondary, marginBottom: 5 }}>
                        崗位／獎項級別 Tier Role
                        <span style={{ marginLeft: 5, fontSize: 9, fontWeight: 800, background: "#FEF3C7", color: "#D97706", border: "1px solid #FDE68A", borderRadius: 3, padding: "1px 5px" }}>必填</span>
                      </label>
                      <div style={{ position: "relative" }}>
                        <select
                          value={certTier}
                          onChange={e => setCertTier(e.target.value)}
                          disabled={approvalStatus !== "pending"}
                          style={{ width: "100%", padding: "9px 28px 9px 10px", border: `1.5px solid ${certTier === "T4" ? "#D97706" : ERP.colors.border}`, borderRadius: ERP.radius.md, fontSize: 12, fontWeight: 700, color: certTier === "T4" ? "#D97706" : ERP.colors.textPrimary, fontFamily: F, background: certTier === "T4" ? "#FEF3C7" : approvalStatus !== "pending" ? ERP.colors.pageBg : ERP.colors.surface, appearance: "none" as const, cursor: "pointer", outline: "none" }}>
                          <option value="T4">T4 獲獎 (Award)</option>
                          <option value="T3">T3 領導 (Leadership)</option>
                          <option value="T2">T2 協作 (Collaboration)</option>
                          <option value="T1">T1 參與 (Participation)</option>
                        </select>
                        <ChevronDown size={11} color={ERP.colors.textMuted} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                      </div>
                    </div>
                  </div>

                  {/* Date (read-only) */}
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: ERP.colors.textSecondary, marginBottom: 5 }}>
                      頒獎日期 Award Date
                      <span style={{ marginLeft: 6, fontSize: 9, color: ERP.colors.textMuted, fontWeight: 400 }}>只讀 Read-only</span>
                    </label>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", background: ERP.colors.pageBg, border: `1px solid ${ERP.colors.border}`, borderRadius: ERP.radius.md }}>
                      <Calendar size={13} color={ERP.colors.textMuted} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: ERP.colors.textSecondary, fontFamily: ERP.font.mono }}>15 / 11 / 2025</span>
                    </div>
                  </div>

                  {/* ACORN & Points Preview */}
                  <div style={{ padding: "12px 14px", background: "#F0FDF4", border: `1px solid #BBF7D0`, borderRadius: ERP.radius.md }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#15803D", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                      <Sparkles size={12} />核准後自動寫入 · Auto-update on Approval
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
                      {[
                        { label: "ACORN 標籤", val: "機遇 Opportunity", color: "#C2410C", bg: "#FFEDD5" },
                        { label: "積點獎勵",   val: "+40 pts (L4×T4)", color: "#D97706", bg: "#FEF3C7" },
                        { label: "等級標籤",   val: certLevel + " · " + certTier, color: ERP.colors.accent, bg: ERP.colors.accentPale },
                      ].map(({ label, val, color, bg }) => (
                        <div key={label} style={{ padding: "6px 10px", background: bg, borderRadius: ERP.radius.sm, display: "flex", flexDirection: "column" as const, gap: 1 }}>
                          <span style={{ fontSize: 9, color: ERP.colors.textMuted }}>{label}</span>
                          <span style={{ fontSize: 11, fontWeight: 800, color }}>{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Reject reason input (shown when showRejectInput) */}
                  {showRejectInput && (
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: ERP.colors.red, marginBottom: 5 }}>
                        退回原因 Rejection Reason <span style={{ fontWeight: 400, color: ERP.colors.textMuted }}>(將通知學生)</span>
                      </label>
                      <textarea
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                        placeholder="請填寫退回原因，例如：證書圖像模糊，請重新上傳高清版本。"
                        rows={3}
                        style={{ width: "100%", padding: "9px 12px", border: `1.5px solid ${ERP.colors.red}`, borderRadius: ERP.radius.md, fontSize: 12, fontFamily: F, color: ERP.colors.textPrimary, outline: "none", resize: "vertical" as const, boxSizing: "border-box" as const }}
                      />
                    </div>
                  )}

                </div>{/* /form fields */}

                {/* ── Action Footer ────────────────────────────────────── */}
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${ERP.colors.border}`, display: "flex", gap: 10 }}>
                  {/* Reject button */}
                  {approvalStatus === "pending" && !showRejectInput && (
                    <button
                      onClick={() => setShowRejectInput(true)}
                      style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "11px 0", border: `1.5px solid ${ERP.colors.red}`, borderRadius: ERP.radius.md, background: "transparent", color: ERP.colors.red, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: F, transition: "background 0.1s" }}
                      onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = ERP.colors.redLight}
                      onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "transparent"}
                    >
                      <XCircle size={14} /> ❌ 退回重交 (Reject/Resubmit)
                    </button>
                  )}
                  {showRejectInput && (
                    <>
                      <button onClick={() => { setShowRejectInput(false); setRejectReason(""); }} style={{ padding: "11px 16px", border: `1px solid ${ERP.colors.border}`, borderRadius: ERP.radius.md, background: "transparent", color: ERP.colors.textMuted, fontSize: 12, cursor: "pointer", fontFamily: F }}>取消</button>
                      <button
                        onClick={() => { setApprovalStatus("rejected"); setShowRejectInput(false); }}
                        style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "11px 0", border: "none", borderRadius: ERP.radius.md, background: ERP.colors.red, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: F, boxShadow: `0 3px 10px ${ERP.colors.red}40` }}
                      >
                        <XCircle size={14} /> 確認退回
                      </button>
                    </>
                  )}

                  {/* Approve button */}
                  {!showRejectInput && (
                    <button
                      onClick={() => setApprovalStatus("approved")}
                      disabled={approvalStatus === "approved"}
                      style={{ flex: approvalStatus === "pending" ? 1 : 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "11px 0", border: "none", borderRadius: ERP.radius.md, background: approvalStatus === "approved" ? ERP.colors.green : "linear-gradient(135deg, #059669, #16A34A)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: approvalStatus === "approved" ? "not-allowed" : "pointer", fontFamily: F, boxShadow: approvalStatus === "approved" ? "none" : "0 3px 12px #16A34A50", opacity: approvalStatus === "approved" ? 0.7 : 1, transition: "all 0.15s" }}
                    >
                      {approvalStatus === "approved"
                        ? <><CheckCircle2 size={14} /> ✅ 已核准並寫入</>
                        : <><Lock size={14} /> ✅ 核准並寫入檔案 (Approve &amp; Lock)</>
                      }
                    </button>
                  )}
                </div>

              </div>{/* /form body */}
            </div>

          </div>
        )}{/* /certs tab */}

        {/* ──────────────────────────────────────────────────────────────────
            TAB CONTENT: ACADEMIC RECORDS (placeholder)
        ────────────────────────────────────────────────────────────────── */}
        {activeTab === "academic" && (() => {
          // ── Static data for this term ───────────────────────────────────────
          const GRADE_ROWS = [
            {
              subjectZh: "英國語文", subjectEn: "English Language",
              kla: "語文", klaEn: "Language Arts", klaColor: "#1D4ED8", klaBg: "#DBEAFE",
              raw: 75, adj: null, rank: 45, total: 120, trend: "up" as const,
              grade: "B+",
            },
            {
              subjectZh: "中國語文", subjectEn: "Chinese Language",
              kla: "語文", klaEn: "Language Arts", klaColor: "#1D4ED8", klaBg: "#DBEAFE",
              raw: 82, adj: null, rank: 12, total: 120, trend: "down" as const,
              grade: "A-",
            },
            {
              subjectZh: "數學", subjectEn: "Mathematics",
              kla: "STEM", klaEn: "STEM", klaColor: "#0F766E", klaBg: "#CCFBF1",
              raw: 55, adj: 62.5, rank: 68, total: 120, trend: "up" as const,
              grade: "C+", adjGrade: "C+",
              biasNote: "班均偏差 −2.3σ · AI校正 +7.5pts",
            },
            {
              subjectZh: "科學", subjectEn: "Science",
              kla: "STEM", klaEn: "STEM", klaColor: "#0F766E", klaBg: "#CCFBF1",
              raw: 88, adj: null, rank: 5, total: 120, trend: "up" as const,
              grade: "A",
            },
          ] as const;

          // KLA aggregates (using adj where available)
          const KLA_BARS = [
            { zh: "語文", en: "Language Arts", color: "#1D4ED8", bg: "#DBEAFE", score: 78.5, max: 100, subjects: "英文 · 中文" },
            { zh: "STEM", en: "Science & Math", color: "#0F766E", bg: "#CCFBF1", score: 75.3, max: 100, subjects: "數學(Adj) · 科學" },
            { zh: "人文", en: "Humanities", color: "#7C3AED", bg: "#EDE9FE", score: 71.0, max: 100, subjects: "歷史 · 地理 (預測)" },
          ];

          const selStyle: React.CSSProperties = {
            padding: "6px 26px 6px 10px", fontSize: 12, fontWeight: 700,
            border: `1px solid ${ERP.colors.border}`, borderRadius: ERP.radius.md,
            background: ERP.colors.surface, color: ERP.colors.textPrimary,
            fontFamily: ERP.font.family, appearance: "none", cursor: "pointer", outline: "none",
          };

          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              {/* ── Controls row ──────────────────────────────────────────── */}
              <div style={{
                display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
                padding: "14px 18px",
                background: ERP.colors.surface, borderRadius: ERP.radius.xl,
                border: `1px solid ${ERP.colors.border}`, boxShadow: ERP.shadow.sm,
              }}>
                {/* AY dropdown */}
                <div style={{ position: "relative" }}>
                  <select defaultValue="2025/26" style={selStyle}>
                    <option>2025/26</option>
                    <option>2024/25</option>
                  </select>
                  <span style={{ fontSize: 9, fontWeight: 700, color: ERP.colors.textMuted, position: "absolute", left: 10, top: -8, background: ERP.colors.surface, padding: "0 3px" }}>學年 AY</span>
                  <ChevronDown size={11} color={ERP.colors.textMuted} style={{ position: "absolute", right: 7, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                </div>

                {/* Term dropdown */}
                <div style={{ position: "relative" }}>
                  <select defaultValue="T1" style={selStyle}>
                    <option value="T1">上學期 (Term 1)</option>
                    <option value="T2">下學期 (Term 2)</option>
                    <option value="full">全年 (Full Year)</option>
                  </select>
                  <span style={{ fontSize: 9, fontWeight: 700, color: ERP.colors.textMuted, position: "absolute", left: 10, top: -8, background: ERP.colors.surface, padding: "0 3px" }}>學期 Term</span>
                  <ChevronDown size={11} color={ERP.colors.textMuted} style={{ position: "absolute", right: 7, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                </div>

                <div style={{ width: 1, height: 28, background: ERP.colors.divider }} />

                {/* Overall avg pill */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "7px 14px", borderRadius: ERP.radius.full,
                  background: "linear-gradient(135deg, #DBEAFE, #EDE9FE)",
                  border: "1px solid #C4B5FD",
                }}>
                  <BarChart2 size={13} color="#6366F1" />
                  <span style={{ fontSize: 11, color: ERP.colors.textSecondary }}>全科平均 Overall Avg</span>
                  <span style={{ fontSize: 15, fontWeight: 900, color: "#4F46E5" }}>78.5</span>
                  <span style={{
                    fontSize: 11, fontWeight: 800, padding: "2px 8px",
                    borderRadius: ERP.radius.full, background: "#4F46E5", color: "#fff",
                  }}>B+</span>
                </div>

                {/* Mod 2 badge */}
                <div style={{
                  marginLeft: "auto", display: "flex", alignItems: "center", gap: 6,
                  padding: "5px 11px", borderRadius: ERP.radius.full,
                  background: "#F0FDF4", border: "1px solid #86EFAC",
                }}>
                  <Sparkles size={11} color="#16A34A" />
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#15803D" }}>Mod 2 偏誤校正引擎 啟動</span>
                </div>
              </div>

              {/* ── Main 2-col: data grid + analytics ─────────────────────── */}
              <div style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 300px",
                gap: 16, alignItems: "start",
              }}>

                {/* ═══ LEFT: Data Grid ═══════════════════════════════════════ */}
                <div style={{
                  background: ERP.colors.surface, borderRadius: ERP.radius.xl,
                  border: `1px solid ${ERP.colors.border}`, overflow: "hidden",
                  boxShadow: ERP.shadow.md,
                }}>
                  {/* Grid header */}
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 90px 72px 110px 80px 54px",
                    padding: "10px 16px",
                    background: ERP.colors.surfaceHover,
                    borderBottom: `1px solid ${ERP.colors.border}`,
                  }}>
                    {[
                      { zh: "科目", en: "Subject" },
                      { zh: "學習領域", en: "KLA" },
                      { zh: "原始分", en: "Raw Score" },
                      { zh: "偏誤校正分", en: "Adjusted Score" },
                      { zh: "級別排名", en: "Class Rank" },
                      { zh: "趨勢", en: "Trend" },
                    ].map(col => (
                      <div key={col.zh} style={{ paddingRight: 6 }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: ERP.colors.textSecondary }}>{col.zh}</div>
                        <div style={{ fontSize: 9, color: ERP.colors.textMuted }}>{col.en}</div>
                      </div>
                    ))}
                  </div>

                  {/* Data rows */}
                  {GRADE_ROWS.map((row, idx) => {
                    const isMath = row.adj !== null;
                    const displayScore = row.adj ?? row.raw;
                    return (
                      <div
                        key={row.subjectZh}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 90px 72px 110px 80px 54px",
                          padding: "14px 16px",
                          borderBottom: idx < GRADE_ROWS.length - 1 ? `1px solid ${ERP.colors.divider}` : undefined,
                          background: isMath ? "#FFFBEB" : (idx % 2 === 0 ? ERP.colors.surface : ERP.colors.surfaceHover + "60"),
                          borderLeft: isMath ? "3px solid #F59E0B" : "3px solid transparent",
                          transition: "background 0.1s",
                          alignItems: "center",
                        }}
                      >
                        {/* Subject */}
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: ERP.colors.textPrimary }}>{row.subjectZh}</span>
                            {isMath && (
                              <span style={{
                                fontSize: 8, fontWeight: 800, padding: "1px 5px",
                                borderRadius: 3, background: "#FEF3C7", color: "#92400E",
                                border: "1px solid #FDE68A",
                              }}>MOD 2</span>
                            )}
                          </div>
                          <div style={{ fontSize: 10, color: ERP.colors.textMuted, marginTop: 1 }}>{row.subjectEn}</div>
                        </div>

                        {/* KLA */}
                        <div>
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: "3px 8px",
                            borderRadius: ERP.radius.full,
                            background: row.klaBg, color: row.klaColor,
                            border: `1px solid ${row.klaColor}33`,
                          }}>{row.kla}</span>
                        </div>

                        {/* Raw Score */}
                        <div>
                          <span style={{
                            fontSize: 16, fontWeight: 900,
                            color: isMath ? "#DC2626" : ERP.colors.textPrimary,
                          }}>{row.raw}</span>
                          {isMath && (
                            <div style={{ fontSize: 9, color: "#DC2626", fontWeight: 700, marginTop: 1 }}>
                              ⚠ 低於班均
                            </div>
                          )}
                        </div>

                        {/* Adjusted Score */}
                        <div>
                          {isMath ? (
                            <div>
                              {/* AI-adjusted pill */}
                              <div style={{
                                display: "inline-flex", alignItems: "center", gap: 5,
                                padding: "5px 10px", borderRadius: ERP.radius.md,
                                background: "linear-gradient(135deg, #ECFDF5, #EEF2FF)",
                                border: "1px solid #6EE7B7",
                              }}>
                                <Sparkles size={11} color="#0D9488" />
                                <span style={{ fontSize: 15, fontWeight: 900, color: "#0D9488" }}>{row.adj}</span>
                                <span style={{ fontSize: 9, fontWeight: 700, color: "#6366F1" }}>Adj</span>
                              </div>
                              <div style={{ fontSize: 9, color: "#6B7280", marginTop: 4 }}>
                                +{((row.adj ?? 0) - row.raw).toFixed(1)} pts · AI校正
                              </div>
                            </div>
                          ) : (
                            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                              <span style={{ fontSize: 16, fontWeight: 900, color: ERP.colors.textPrimary }}>{row.raw}</span>
                              <span style={{
                                fontSize: 9, fontWeight: 700, padding: "2px 6px",
                                borderRadius: ERP.radius.full, background: ERP.colors.surfaceHover,
                                color: ERP.colors.textMuted, border: `1px solid ${ERP.colors.border}`,
                              }}>無調整</span>
                            </div>
                          )}
                        </div>

                        {/* Rank */}
                        <div>
                          <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
                            <span style={{ fontSize: 13, fontWeight: 800, color: row.rank <= 15 ? "#15803D" : ERP.colors.textPrimary }}>{row.rank}</span>
                            <span style={{ fontSize: 10, color: ERP.colors.textMuted }}>/{row.total}</span>
                          </div>
                          <div style={{
                            marginTop: 4, height: 4, borderRadius: 2,
                            background: ERP.colors.divider, overflow: "hidden", width: 52,
                          }}>
                            <div style={{
                              height: "100%", borderRadius: 2,
                              width: `${((row.total - row.rank) / row.total) * 100}%`,
                              background: row.rank <= 15
                                ? "linear-gradient(90deg,#4ADE80,#16A34A)"
                                : row.rank <= 60
                                  ? "linear-gradient(90deg,#FCD34D,#F59E0B)"
                                  : "linear-gradient(90deg,#FCA5A5,#EF4444)",
                            }} />
                          </div>
                        </div>

                        {/* Trend */}
                        <div style={{ display: "flex", justifyContent: "center" }}>
                          {row.trend === "up"
                            ? <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: ERP.radius.full, background: "#DCFCE7" }}>
                                <TrendingUp size={14} color="#16A34A" />
                              </div>
                            : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: ERP.radius.full, background: "#FEF2F2" }}>
                                <TrendingDown size={14} color="#DC2626" />
                              </div>
                          }
                        </div>
                      </div>
                    );
                  })}

                  {/* Footer summary row */}
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 90px 72px 110px 80px 54px",
                    padding: "12px 16px",
                    background: "linear-gradient(90deg,#F8FAFC,#F0FDF4)",
                    borderTop: `2px solid ${ERP.colors.border}`,
                    alignItems: "center",
                  }}>
                    <div>
                      <span style={{ fontSize: 10, fontWeight: 800, color: ERP.colors.textSecondary, textTransform: "uppercase" as const, letterSpacing: "0.07em" }}>全科加權平均</span>
                      <div style={{ fontSize: 9, color: ERP.colors.textMuted }}>Weighted Average · Adj scores applied</div>
                    </div>
                    <div />
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 800, color: ERP.colors.textSecondary }}>75.0</span>
                      <div style={{ fontSize: 9, color: ERP.colors.textMuted }}>Raw avg</div>
                    </div>
                    <div>
                      <span style={{ fontSize: 15, fontWeight: 900, color: "#0D9488" }}>78.5</span>
                      <div style={{ fontSize: 9, color: "#0D9488" }}>Adj avg ↑ +3.5</div>
                    </div>
                    <div>
                      <span style={{ fontSize: 12, fontWeight: 800, color: "#15803D" }}>班排 15/30</span>
                      <div style={{ fontSize: 9, color: ERP.colors.textMuted }}>級排 68/120</div>
                    </div>
                    <div />
                  </div>

                  {/* Mod 2 callout strip */}
                  <div style={{
                    margin: "0 16px 16px",
                    marginTop: 12,
                    padding: "11px 14px",
                    background: "linear-gradient(90deg, #FFFBEB, #ECFDF5)",
                    border: "1px solid #FDE68A",
                    borderLeft: "3px solid #F59E0B",
                    borderRadius: ERP.radius.md,
                    display: "flex", alignItems: "flex-start", gap: 10,
                  }}>
                    <Sparkles size={14} color="#D97706" style={{ flexShrink: 0, marginTop: 1 }} />
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: "#92400E", marginBottom: 3 }}>
                        Mod 2 偏誤校正引擎 — 數學科調整摘要
                      </div>
                      <div style={{ fontSize: 10, color: "#78350F", lineHeight: 1.6 }}>
                        數學科原始分 <strong>55</strong> 低於該班平均 −2.3σ，診斷引擎偵測到「期終試」評核環節存在系統性偏差。
                        已按 AI 加權乘數 <strong>×1.13</strong> 進行偏誤校正，調整後分數為 <strong>62.5</strong>（+7.5 pts）。
                        此調整已計入全科加權平均及年級排名計算。
                      </div>
                      <div style={{ fontSize: 9, color: "#D97706", marginTop: 4 }}>
                        Bias detected in Final Exam component (−2.3σ from class mean). AI multiplier ×1.13 applied → Adj 62.5 · Grade rank revised from 82 → 68/120.
                      </div>
                    </div>
                  </div>
                </div>

                {/* ═══ RIGHT: KLA Strength Analysis ═════════════════════════ */}
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                  {/* KLA bar chart card */}
                  <div style={{
                    background: ERP.colors.surface, borderRadius: ERP.radius.xl,
                    border: `1px solid ${ERP.colors.border}`, overflow: "hidden",
                    boxShadow: ERP.shadow.md, padding: "18px 18px 20px",
                  }}>
                    {/* Card header */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: ERP.radius.md,
                        background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>
                        <BarChart2 size={14} color="#fff" />
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 800, color: ERP.colors.textPrimary }}>強項分析</div>
                        <div style={{ fontSize: 9, color: ERP.colors.textMuted }}>KLA Subject Strengths</div>
                      </div>
                    </div>

                    {/* KLA bars */}
                    {KLA_BARS.map(kla => (
                      <div key={kla.zh} style={{ marginBottom: 18 }}>
                        {/* Label row */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ width: 8, height: 8, borderRadius: "50%", background: kla.color, display: "inline-block" }} />
                              <span style={{ fontSize: 12, fontWeight: 800, color: ERP.colors.textPrimary }}>{kla.zh}</span>
                              <span style={{ fontSize: 9, color: ERP.colors.textMuted }}>{kla.en}</span>
                            </div>
                            <div style={{ fontSize: 9, color: ERP.colors.textMuted, paddingLeft: 14, marginTop: 1 }}>{kla.subjects}</div>
                          </div>
                          <div style={{ textAlign: "right" as const }}>
                            <span style={{ fontSize: 16, fontWeight: 900, color: kla.color }}>{kla.score}</span>
                            <span style={{ fontSize: 9, color: ERP.colors.textMuted }}>/100</span>
                          </div>
                        </div>
                        {/* Bar track */}
                        <div style={{ height: 10, borderRadius: 5, background: kla.bg, overflow: "hidden", position: "relative" as const }}>
                          <div style={{
                            position: "absolute" as const, left: 0, top: 0, bottom: 0,
                            width: `${kla.score}%`,
                            background: `linear-gradient(90deg, ${kla.color}99, ${kla.color})`,
                            borderRadius: 5,
                          }} />
                          {/* Class avg reference line at 75% */}
                          <div style={{
                            position: "absolute" as const, left: "75%", top: 0, bottom: 0,
                            width: 1.5, background: "#64748B", opacity: 0.4,
                          }} />
                        </div>
                        {/* Score grade tag */}
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                          <span style={{ fontSize: 8, color: ERP.colors.textMuted }}>班均基準線 75.0</span>
                          <span style={{
                            fontSize: 9, fontWeight: 700, padding: "1px 6px",
                            borderRadius: 3, background: kla.bg, color: kla.color,
                          }}>
                            {kla.score >= 80 ? "强項 ★" : kla.score >= 75 ? "達標 ✓" : "待提升 △"}
                          </span>
                        </div>
                      </div>
                    ))}

                    {/* Insight footer */}
                    <div style={{
                      padding: "10px 12px", marginTop: 2,
                      background: ERP.colors.surfaceHover,
                      borderRadius: ERP.radius.md,
                      border: `1px solid ${ERP.colors.border}`,
                    }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: ERP.colors.textSecondary, marginBottom: 4 }}>
                        AI 強項洞察
                      </div>
                      <div style={{ fontSize: 10, color: ERP.colors.textMuted, lineHeight: 1.6 }}>
                        語文領域表現穩健（78.5），STEM 領域在偏誤校正後升至 75.3。建議優先鞏固人文學科（71.0）。
                      </div>
                    </div>
                  </div>

                  {/* Ranking summary card */}
                  <div style={{
                    background: ERP.colors.surface, borderRadius: ERP.radius.xl,
                    border: `1px solid ${ERP.colors.border}`,
                    boxShadow: ERP.shadow.sm, padding: "16px 18px",
                  }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: ERP.colors.textSecondary, marginBottom: 12, textTransform: "uppercase" as const, letterSpacing: "0.07em" }}>
                      學期排名概覽
                    </div>
                    {[
                      { label: "班級排名", sub: "Class Rank", val: "15", unit: "/30", color: "#15803D", bg: "#DCFCE7" },
                      { label: "年級排名", sub: "Grade Rank", val: "68", unit: "/120", color: "#D97706", bg: "#FEF3C7" },
                      { label: "調整前排名", sub: "Pre-Adj Rank", val: "82", unit: "/120", color: ERP.colors.textMuted, bg: ERP.colors.surfaceHover },
                    ].map(r => (
                      <div key={r.label} style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "8px 10px", borderRadius: ERP.radius.md,
                        background: r.bg, marginBottom: 8,
                      }}>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: r.color }}>{r.label}</div>
                          <div style={{ fontSize: 9, color: ERP.colors.textMuted }}>{r.sub}</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 1 }}>
                          <span style={{ fontSize: 20, fontWeight: 900, color: r.color }}>{r.val}</span>
                          <span style={{ fontSize: 10, color: ERP.colors.textMuted }}>{r.unit}</span>
                        </div>
                      </div>
                    ))}
                    <div style={{ fontSize: 9, color: ERP.colors.textMuted, textAlign: "center" as const, marginTop: 4 }}>
                      Mod 2 校正使年級排名提升 14 位 (82→68)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ──────────────────────────────────────────────────────────────────
            TAB CONTENT: CONDUCT & ATTENDANCE (placeholder)
        ────────────────────────────────────────────────────────────────── */}
        {activeTab === "conduct" && (() => {
          // ── Static data ────────────────────────────────────────────────────
          // Sourced from component-level state (mutable via AddRecordModal)
          const ATTENDANCE_LOG = attendanceLogs;
          const ENGAGEMENT_LOG = engagementLogs;

          // Mini sparkline data for engagement index (8 data points, values 0–100)
          const SPARK = [62, 70, 68, 75, 72, 80, 85, 88];
          const SPARK_W = 64, SPARK_H = 24;
          const sparkPts = SPARK.map((v, i) => {
            const x = (i / (SPARK.length - 1)) * SPARK_W;
            const y = SPARK_H - (v / 100) * SPARK_H;
            return `${x.toFixed(1)},${y.toFixed(1)}`;
          }).join(" ");
          const sparkFill = SPARK.map((v, i) => {
            const x = (i / (SPARK.length - 1)) * SPARK_W;
            const y = SPARK_H - (v / 100) * SPARK_H;
            return `${x.toFixed(1)},${y.toFixed(1)}`;
          });
          const sparkArea = `M0,${SPARK_H} L${sparkFill[0]} ${sparkFill.slice(1).map(p => `L${p}`).join(" ")} L${SPARK_W},${SPARK_H} Z`;

          // Engagement level config
          const ENG_CFG = {
            high:  { bg: "#DCFCE7", color: "#15803D", border: "#86EFAC", icon: <ThumbsUp size={11} />,   dot: "#16A34A" },
            low:   { bg: "#FEF2F2", color: "#DC2626", border: "#FCA5A5", icon: <Frown    size={11} />,   dot: "#EF4444" },
            merit: { bg: "#FFFBEB", color: "#92400E", border: "#FDE68A", icon: <Award    size={11} />,   dot: "#F59E0B" },
          } as const;

          const ATT_CFG: Record<string, { bg: string; color: string; border: string; icon: React.ReactNode }> = {
            late:     { bg: "#FEF3C7", color: "#92400E", border: "#FDE68A", icon: <Clock      size={11} color="#D97706" /> },
            sick:     { bg: "#EFF6FF", color: "#1D4ED8", border: "#BFDBFE", icon: <CalendarX  size={11} color="#2563EB" /> },
            personal: { bg: "#F5F3FF", color: "#6D28D9", border: "#DDD6FE", icon: <ClipboardList size={11} color="#7C3AED" /> },
            absent:   { bg: "#FEF2F2", color: "#991B1B", border: "#FECACA", icon: <AlertTriangle size={11} color="#DC2626" /> },
            early:    { bg: "#FFF7ED", color: "#C2410C", border: "#FED7AA", icon: <Activity   size={11} color="#EA580C" /> },
          };

          // Monthly attendance heatmap (Sep–Apr, present days / total school days)
          const MONTHS = [
            { m: "09", label: "Sep", present: 20, total: 20, late: 0 },
            { m: "10", label: "Oct", present: 22, total: 22, late: 0 },
            { m: "11", label: "Nov", present: 19, total: 20, late: 1 },
            { m: "12", label: "Dec", present: 15, total: 15, late: 0 },
            { m: "01", label: "Jan", present: 17, total: 18, late: 1 },
            { m: "02", label: "Feb", present: 18, total: 18, late: 0 },
            { m: "03", label: "Mar", present: 21, total: 21, late: 1 },
            { m: "04", label: "Apr", present: 10, total: 10, late: 0 },
          ];

          return (
            <>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              {/* ── KPI Summary Cards ────────────────────────────────────── */}
              <div style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
                gap: 14,
              }}>

                {/* Card 1 — Attendance Rate */}
                <div style={{
                  background: "linear-gradient(135deg, #ECFDF5, #D1FAE5)",
                  border: "1px solid #6EE7B7", borderRadius: ERP.radius.xl,
                  padding: "18px 18px 16px", boxShadow: ERP.shadow.sm,
                  position: "relative" as const, overflow: "hidden",
                }}>
                  <div style={{ position: "absolute" as const, top: -18, right: -18, width: 70, height: 70, borderRadius: "50%", background: "radial-gradient(circle, #6EE7B740 0%, transparent 70%)", pointerEvents: "none" }} />
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
                    <div style={{ width: 26, height: 26, borderRadius: ERP.radius.md, background: "#15803D", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <CalendarCheck size={13} color="#fff" />
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#15803D" }}>總出勤率</span>
                  </div>
                  <div style={{ fontSize: 32, fontWeight: 900, color: "#15803D", lineHeight: 1 }}>98%</div>
                  <div style={{ fontSize: 9, color: "#166534", marginTop: 4 }}>Total Attendance · 142/145 days</div>
                  <div style={{ marginTop: 10, height: 4, borderRadius: 2, background: "#BBF7D0", overflow: "hidden" }}>
                    <div style={{ width: "98%", height: "100%", background: "linear-gradient(90deg, #4ADE80, #16A34A)", borderRadius: 2 }} />
                  </div>
                </div>

                {/* Card 2 — Late / Early Leave */}
                <div style={{
                  background: "linear-gradient(135deg, #FFFBEB, #FEF3C7)",
                  border: "1px solid #FDE68A", borderRadius: ERP.radius.xl,
                  padding: "18px 18px 16px", boxShadow: ERP.shadow.sm,
                  position: "relative" as const, overflow: "hidden",
                }}>
                  <div style={{ position: "absolute" as const, top: -18, right: -18, width: 70, height: 70, borderRadius: "50%", background: "radial-gradient(circle, #FDE68A40 0%, transparent 70%)", pointerEvents: "none" }} />
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
                    <div style={{ width: 26, height: 26, borderRadius: ERP.radius.md, background: "#D97706", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Clock size={13} color="#fff" />
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#92400E" }}>遲到 / 早退</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                    <span style={{ fontSize: 32, fontWeight: 900, color: "#D97706", lineHeight: 1 }}>2</span>
                    <span style={{ fontSize: 11, color: "#92400E", fontWeight: 700 }}>次</span>
                  </div>
                  <div style={{ fontSize: 9, color: "#78350F", marginTop: 4 }}>Late / Early Leave · this term</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: ERP.radius.full, background: "#FEF3C7", color: "#92400E", border: "1px solid #FDE68A" }}>遲到 ×2</span>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: ERP.radius.full, background: "#F8FAFC", color: ERP.colors.textMuted, border: `1px solid ${ERP.colors.border}` }}>早退 ×0</span>
                  </div>
                </div>

                {/* Card 3 — Conduct Grade */}
                <div style={{
                  background: `linear-gradient(135deg, ${ERP.colors.accentPale}, #EDE9FE)`,
                  border: `1px solid ${ERP.colors.accentLight}`, borderRadius: ERP.radius.xl,
                  padding: "18px 18px 16px", boxShadow: ERP.shadow.sm,
                  position: "relative" as const, overflow: "hidden",
                }}>
                  <div style={{ position: "absolute" as const, top: -18, right: -18, width: 70, height: 70, borderRadius: "50%", background: `radial-gradient(circle, ${ERP.colors.accent}22 0%, transparent 70%)`, pointerEvents: "none" }} />
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
                    <div style={{ width: 26, height: 26, borderRadius: ERP.radius.md, background: ERP.colors.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Shield size={13} color="#fff" />
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: ERP.colors.accent }}>操行等級</span>
                  </div>
                  <div style={{ fontSize: 32, fontWeight: 900, color: ERP.colors.accent, lineHeight: 1 }}>A-</div>
                  <div style={{ fontSize: 9, color: ERP.colors.textMuted, marginTop: 4 }}>Conduct Grade · Term 1 AY 25/26</div>
                  <div style={{ display: "flex", gap: 5, marginTop: 10 }}>
                    {["A+","A","A-","B+","B"].map((g, i) => (
                      <div key={g} style={{
                        width: 22, height: 22, borderRadius: ERP.radius.sm,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 8, fontWeight: 800,
                        background: g === "A-" ? ERP.colors.accent : ERP.colors.surfaceHover,
                        color: g === "A-" ? "#fff" : ERP.colors.textMuted,
                        border: g === "A-" ? `1px solid ${ERP.colors.accent}` : `1px solid ${ERP.colors.border}`,
                      }}>{g}</div>
                    ))}
                  </div>
                </div>

                {/* Card 4 — MOD D: Engagement Index */}
                <div style={{
                  background: "linear-gradient(135deg, #EFF6FF, #F0FDF4)",
                  border: "1px solid #93C5FD", borderRadius: ERP.radius.xl,
                  padding: "18px 18px 16px", boxShadow: ERP.shadow.sm,
                  position: "relative" as const, overflow: "hidden",
                }}>
                  <div style={{ position: "absolute" as const, top: -18, right: -18, width: 70, height: 70, borderRadius: "50%", background: "radial-gradient(circle, #60A5FA30 0%, transparent 70%)", pointerEvents: "none" }} />
                  {/* MOD D label */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <div style={{ width: 26, height: 26, borderRadius: ERP.radius.md, background: "linear-gradient(135deg,#2563EB,#16A34A)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Activity size={13} color="#fff" />
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#1D4ED8" }}>課堂參與度指標</span>
                    </div>
                    <span style={{ fontSize: 8, fontWeight: 800, padding: "2px 6px", borderRadius: 3, background: "#DBEAFE", color: "#1D4ED8", border: "1px solid #93C5FD" }}>MOD D</span>
                  </div>
                  {/* Value + sparkline */}
                  <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
                        <span style={{ fontSize: 20, fontWeight: 900, color: "#15803D", lineHeight: 1 }}>High</span>
                        <span style={{ fontSize: 14, fontWeight: 800, color: "#16A34A" }}>88%</span>
                      </div>
                      <div style={{ fontSize: 9, color: "#374151", marginTop: 3 }}>Class Engagement Index</div>
                    </div>
                    {/* Mini sparkline SVG */}
                    <svg width={SPARK_W} height={SPARK_H + 4} style={{ overflow: "visible", flexShrink: 0 }}>
                      <defs>
                        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#16A34A" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#16A34A" stopOpacity="0.02" />
                        </linearGradient>
                      </defs>
                      <path d={sparkArea} fill="url(#sparkFill)" />
                      <polyline points={sparkPts} fill="none" stroke="#16A34A" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
                      {/* Latest dot */}
                      <circle cx={SPARK_W} cy={SPARK_H - (SPARK[SPARK.length - 1] / 100) * SPARK_H} r="3" fill="#16A34A" />
                    </svg>
                  </div>
                  <div style={{ marginTop: 8, height: 4, borderRadius: 2, background: "#DBEAFE", overflow: "hidden" }}>
                    <div style={{ width: "88%", height: "100%", background: "linear-gradient(90deg,#60A5FA,#16A34A)", borderRadius: 2 }} />
                  </div>
                </div>
              </div>

              {/* ── Monthly Attendance Heatmap ───────────────────────────── */}
              <div style={{
                background: ERP.colors.surface, borderRadius: ERP.radius.xl,
                border: `1px solid ${ERP.colors.border}`, padding: "16px 20px",
                boxShadow: ERP.shadow.sm,
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Calendar size={14} color={ERP.colors.accent} />
                    <span style={{ fontSize: 12, fontWeight: 800, color: ERP.colors.textPrimary }}>月度出勤概覽</span>
                    <span style={{ fontSize: 9, color: ERP.colors.textMuted }}>Monthly Attendance Overview · AY 2025/26</span>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: ERP.radius.full, background: "#DCFCE7", color: "#15803D", border: "1px solid #86EFAC" }}>
                    出勤率 98% ✓
                  </span>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" as const }}>
                  {MONTHS.map(mo => {
                    const rate = mo.present / mo.total;
                    const barH = Math.round(rate * 52);
                    const barColor = rate === 1 ? "#16A34A" : rate >= 0.95 ? "#F59E0B" : "#EF4444";
                    const bgColor  = rate === 1 ? "#DCFCE7" : rate >= 0.95 ? "#FEF3C7" : "#FEF2F2";
                    return (
                      <div key={mo.m} style={{ display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 4, flex: 1, minWidth: 38 }}>
                        {/* Bar */}
                        <div style={{ position: "relative" as const, width: "100%", height: 52, background: ERP.colors.surfaceHover, borderRadius: ERP.radius.sm, overflow: "hidden", display: "flex", alignItems: "flex-end" }}>
                          <div style={{ width: "100%", height: barH, background: `linear-gradient(180deg, ${barColor}99, ${barColor})`, borderRadius: ERP.radius.sm }} />
                          {mo.late > 0 && (
                            <div style={{ position: "absolute" as const, top: 4, right: 4, width: 6, height: 6, borderRadius: "50%", background: "#F59E0B" }} />
                          )}
                        </div>
                        {/* Label */}
                        <span style={{ fontSize: 9, fontWeight: 700, color: ERP.colors.textSecondary }}>{mo.label}</span>
                        <span style={{ fontSize: 8, color: barColor, fontWeight: 700 }}>{mo.present}/{mo.total}</span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: "flex", gap: 16, marginTop: 10, flexWrap: "wrap" as const }}>
                  {[
                    { dot: "#16A34A", label: "全勤 Perfect" },
                    { dot: "#F59E0B", label: "遲到 Late (●)" },
                    { dot: "#EF4444", label: "缺席 Absent" },
                  ].map(l => (
                    <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: l.dot, display: "inline-block" }} />
                      <span style={{ fontSize: 9, color: ERP.colors.textMuted }}>{l.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Split: Attendance Log (L) + Engagement Log (R) ─────── */}
              <div style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                gap: 16, alignItems: "start",
              }}>

                {/* ═══ LEFT: Attendance Log ══════════════════════════════ */}
                <div style={{
                  background: ERP.colors.surface, borderRadius: ERP.radius.xl,
                  border: `1px solid ${ERP.colors.border}`, overflow: "hidden",
                  boxShadow: ERP.shadow.md,
                }}>
                  {/* Header */}
                  <div style={{
                    padding: "14px 18px",
                    borderBottom: `1px solid ${ERP.colors.divider}`,
                    display: "flex", alignItems: "center", gap: 10,
                    background: ERP.colors.surfaceHover,
                  }}>
                    <div style={{ width: 28, height: 28, borderRadius: ERP.radius.md, background: "#D97706", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <ClipboardList size={14} color="#fff" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: ERP.colors.textPrimary }}>出缺席紀錄</div>
                      <div style={{ fontSize: 9, color: ERP.colors.textMuted }}>Attendance Log · Term 1</div>
                    </div>
                    <span style={{
                      fontSize: 9, fontWeight: 700,
                      padding: "3px 9px", borderRadius: ERP.radius.full,
                      background: "#FEF3C7", color: "#92400E", border: "1px solid #FDE68A",
                    }}>{ATTENDANCE_LOG.length} 件事項</span>
                    <button
                      onClick={() => setAddingRecord("attendance")}
                      style={{
                        display: "flex", alignItems: "center", gap: 4,
                        padding: "5px 11px", borderRadius: ERP.radius.md,
                        border: `1px solid ${ERP.colors.accentLight}`,
                        background: ERP.colors.accentPale, color: ERP.colors.accent,
                        fontSize: 11, fontWeight: 700, fontFamily: ERP.font.family,
                        cursor: "pointer", flexShrink: 0,
                      }}
                    >
                      <Plus size={11} />
                      新增
                    </button>
                  </div>

                  {/* Log entries */}
                  {ATTENDANCE_LOG.map((rec, idx) => {
                    const cfg = ATT_CFG[rec.type];
                    return (
                      <div key={rec.id} style={{
                        padding: "16px 18px",
                        borderBottom: idx < ATTENDANCE_LOG.length - 1 ? `1px solid ${ERP.colors.divider}` : undefined,
                        display: "flex", gap: 14, alignItems: "flex-start",
                      }}>
                        {/* Date column */}
                        <div style={{
                          flexShrink: 0, width: 44, textAlign: "center" as const,
                          padding: "6px 4px", borderRadius: ERP.radius.md,
                          background: cfg.bg, border: `1px solid ${cfg.border}`,
                        }}>
                          <div style={{ fontSize: 15, fontWeight: 900, color: cfg.color, lineHeight: 1 }}>
                            {rec.date.slice(8)}
                          </div>
                          <div style={{ fontSize: 8, fontWeight: 700, color: cfg.color, marginTop: 2 }}>
                            {new Date(rec.date).toLocaleString("en", { month: "short" }).toUpperCase()}
                          </div>
                        </div>
                        {/* Content */}
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                            <span style={{
                              display: "inline-flex", alignItems: "center", gap: 5,
                              padding: "3px 10px", borderRadius: ERP.radius.full, fontSize: 11, fontWeight: 800,
                              background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
                            }}>
                              {cfg.icon}
                              {rec.typeZh}
                            </span>
                            <span style={{ fontSize: 9, color: ERP.colors.textMuted }}>{rec.typeEn}</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 9, fontWeight: 700, color: ERP.colors.textSecondary }}>📝 備註：</span>
                            <span style={{ fontSize: 11, color: ERP.colors.textPrimary }}>{rec.remark}</span>
                          </div>
                          <div style={{ fontSize: 9, color: ERP.colors.textMuted, marginTop: 2 }}>{rec.remarkEn}</div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Footer — clean record notice */}
                  <div style={{
                    padding: "12px 18px",
                    background: "#F0FDF4",
                    borderTop: `1px solid #BBF7D0`,
                    display: "flex", alignItems: "center", gap: 8,
                  }}>
                    <CheckCircle2 size={13} color="#16A34A" />
                    <span style={{ fontSize: 10, color: "#15803D", fontWeight: 700 }}>
                      無無故缺席紀錄 · No unauthorised absences
                    </span>
                  </div>
                </div>

                {/* ═══ RIGHT: Engagement & Conduct Log (Mod D) ══════════ */}
                <div style={{
                  background: ERP.colors.surface, borderRadius: ERP.radius.xl,
                  border: `1px solid ${ERP.colors.border}`, overflow: "hidden",
                  boxShadow: ERP.shadow.md,
                }}>
                  {/* Header */}
                  <div style={{
                    padding: "14px 18px",
                    borderBottom: `1px solid ${ERP.colors.divider}`,
                    display: "flex", alignItems: "center", gap: 10,
                    background: ERP.colors.surfaceHover,
                  }}>
                    <div style={{ width: 28, height: 28, borderRadius: ERP.radius.md, background: "linear-gradient(135deg,#2563EB,#16A34A)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Brain size={14} color="#fff" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: ERP.colors.textPrimary }}>課堂表現與行為</div>
                      <div style={{ fontSize: 9, color: ERP.colors.textMuted }}>Behavior & Engagement · Mod D</div>
                    </div>
                    <span style={{
                      fontSize: 8, fontWeight: 800,
                      padding: "3px 9px", borderRadius: ERP.radius.full,
                      background: "#DBEAFE", color: "#1D4ED8", border: "1px solid #93C5FD",
                    }}>MOD D 啟動</span>
                    <button
                      onClick={() => setAddingRecord("conduct")}
                      style={{
                        display: "flex", alignItems: "center", gap: 4,
                        padding: "5px 11px", borderRadius: ERP.radius.md,
                        border: `1px solid ${ERP.colors.accentLight}`,
                        background: ERP.colors.accentPale, color: ERP.colors.accent,
                        fontSize: 11, fontWeight: 700, fontFamily: ERP.font.family,
                        cursor: "pointer", flexShrink: 0,
                      }}
                    >
                      <Plus size={11} />
                      新增
                    </button>
                  </div>

                  {/* Engagement entries */}
                  {ENGAGEMENT_LOG.map((rec, idx) => {
                    const cfg = ENG_CFG[rec.level];
                    const isModD = rec.kind === "mod-d";
                    return (
                      <div key={rec.id} style={{
                        padding: "14px 18px",
                        borderBottom: idx < ENGAGEMENT_LOG.length - 1 ? `1px solid ${ERP.colors.divider}` : undefined,
                        display: "flex", gap: 12, alignItems: "flex-start",
                        background: rec.level === "low" ? "#FFFBEB" : ERP.colors.surface,
                        borderLeft: rec.level === "low" ? "3px solid #F59E0B" : "3px solid transparent",
                      }}>
                        {/* Date */}
                        <div style={{
                          flexShrink: 0, width: 40, textAlign: "center" as const,
                          padding: "5px 3px", borderRadius: ERP.radius.md,
                          background: cfg.bg, border: `1px solid ${cfg.border}`,
                        }}>
                          <div style={{ fontSize: 14, fontWeight: 900, color: cfg.color, lineHeight: 1 }}>
                            {rec.date.slice(8)}
                          </div>
                          <div style={{ fontSize: 7, fontWeight: 700, color: cfg.color, marginTop: 2 }}>
                            {new Date(rec.date).toLocaleString("en", { month: "short" }).toUpperCase()}
                          </div>
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1 }}>
                          {/* Subject + source row */}
                          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6, flexWrap: "wrap" as const }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: ERP.colors.textPrimary }}>{rec.subject}</span>
                            <span style={{ fontSize: 9, color: ERP.colors.textMuted }}>{rec.subjectEn}</span>
                            {isModD && (
                              <span style={{ fontSize: 8, fontWeight: 800, padding: "1px 5px", borderRadius: 3, background: "#DBEAFE", color: "#1D4ED8", border: "1px solid #93C5FD", marginLeft: "auto" }}>
                                ✨ MOD D
                              </span>
                            )}
                          </div>

                          {/* Tag pill */}
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                            <span style={{
                              display: "inline-flex", alignItems: "center", gap: 5,
                              padding: "4px 11px", borderRadius: ERP.radius.full,
                              fontSize: 11, fontWeight: 800,
                              background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
                            }}>
                              {cfg.icon}
                              {rec.tagZh}
                              <span style={{ fontSize: 9, fontWeight: 600, opacity: 0.75 }}>{rec.tagEn}</span>
                            </span>
                          </div>

                          {/* Detail + teacher */}
                          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" as const }}>
                            <span style={{ fontSize: 10, color: ERP.colors.textSecondary }}>💬 {rec.detail}</span>
                          </div>
                          <div style={{ fontSize: 9, color: ERP.colors.textMuted, marginTop: 3 }}>
                            👤 教師：{rec.teacher} ({rec.teacherEn})
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Mod D summary footer */}
                  <div style={{
                    padding: "12px 18px",
                    background: "linear-gradient(90deg, #EFF6FF, #F0FDF4)",
                    borderTop: `1px solid #BFDBFE`,
                    display: "flex", alignItems: "center", gap: 8,
                  }}>
                    <Activity size={12} color="#2563EB" style={{ flexShrink: 0 }} />
                    <div style={{ fontSize: 10, color: "#1D4ED8", lineHeight: 1.5 }}>
                      <strong>Mod D 分析：</strong>本學期共 4 項參與度紀錄。高度投入 ×2，積極參與 ×1，游離 ×1（已記錄跟進）。整體參與指數 <strong>88%</strong>，持續上升。
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Merit / Demerit summary strip ───────────────────────── */}
              <div style={{
                background: ERP.colors.surface, borderRadius: ERP.radius.xl,
                border: `1px solid ${ERP.colors.border}`, padding: "16px 20px",
                boxShadow: ERP.shadow.sm,
                display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" as const,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Flame size={14} color="#D97706" />
                  <span style={{ fontSize: 12, fontWeight: 800, color: ERP.colors.textPrimary }}>操行積分統計</span>
                  <span style={{ fontSize: 9, color: ERP.colors.textMuted }}>Conduct Point Tally · Term 1</span>
                </div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" as const }}>
                  {[
                    { zh: "大功", en: "Major Merit",   val: engagementLogs.filter(e => e.tagZh === "大功").length,  color: "#15803D", bg: "#DCFCE7", border: "#86EFAC" },
                    { zh: "小功", en: "Minor Merit",   val: engagementLogs.filter(e => e.tagZh === "小功").length,  color: "#2563EB", bg: "#DBEAFE", border: "#93C5FD" },
                    { zh: "大過", en: "Major Demerit", val: engagementLogs.filter(e => e.tagZh === "大過").length,  color: "#DC2626", bg: "#FEF2F2", border: "#FCA5A5" },
                    { zh: "小過", en: "Minor Demerit", val: engagementLogs.filter(e => e.tagZh === "小過").length,  color: "#D97706", bg: "#FEF3C7", border: "#FDE68A" },
                  ].map(p => (
                    <div key={p.zh} style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "7px 14px", borderRadius: ERP.radius.full,
                      background: p.bg, border: `1px solid ${p.border}`,
                    }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: p.color }}>{p.zh}</span>
                      <span style={{ fontSize: 9, color: p.color, opacity: 0.7 }}>{p.en}</span>
                      <span style={{ fontSize: 18, fontWeight: 900, color: p.color, lineHeight: 1 }}>{p.val}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 7, padding: "7px 14px", borderRadius: ERP.radius.full, background: ERP.colors.accentPale, border: `1px solid ${ERP.colors.accentLight}` }}>
                  <Award size={13} color={ERP.colors.accent} />
                  <span style={{ fontSize: 10, fontWeight: 800, color: ERP.colors.accent }}>操行等級 A- · 本學期表現良好</span>
                </div>
              </div>

            </div>

            {/* ── Add Record Modal Overlay ─────────────────────────────── */}
            {addingRecord !== null && (
              <AddRecordModal
                defaultTab={addingRecord}
                onClose={() => setAddingRecord(null)}
                onSubmitAttendance={({ type, remark, date }) => {
                  const m = ATT_TYPE_META[type];
                  setAttendanceLogs(prev => [{
                    id:       `att-${Date.now()}`,
                    date,
                    type,
                    typeZh:   m.zh,
                    typeEn:   m.en,
                    remark:   remark || "—",
                    remarkEn: remark || "—",
                  }, ...prev]);
                  setAddingRecord(null);
                }}
                onSubmitConduct={({ kind, date, subject, teacher, levelKey, detail }) => {
                  const isModD = kind === "mod-d";
                  const levelMeta = isModD
                    ? ENG_LEVEL_META[levelKey as keyof typeof ENG_LEVEL_META]
                    : MERIT_TYPE_META[levelKey as keyof typeof MERIT_TYPE_META];
                  const levelForCfg = isModD
                    ? (levelKey === "high-active" || levelKey === "active" ? "high" : levelKey === "low" ? "low" : "high")
                    : "merit";
                  setEngagementLogs(prev => [{
                    id:         `eng-${Date.now()}`,
                    date,
                    subject,
                    subjectEn:  subject,
                    teacher,
                    teacherEn:  teacher,
                    kind,
                    tagZh:      levelMeta?.zh  ?? levelKey,
                    tagEn:      levelMeta?.en  ?? levelKey,
                    level:      levelForCfg as "high" | "low" | "merit",
                    detail:     detail || "—",
                  }, ...prev]);
                  setAddingRecord(null);
                }}
              />
            )}
            </>
          );
        })()}

      </div>{/* /scrollable */}
    </div>
  );
};
