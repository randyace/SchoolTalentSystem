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
// Hero identity binds from bridge profileMeta / holistic API — never hardcode demo names.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect } from "react";
import { ERP } from "./erpTokens";
import {
  Download, Sparkles, Zap, TrendingUp, TrendingDown, Plus, X, Check,
  CheckCircle2, Clock, BarChart2, Loader2,
  ToggleLeft, ToggleRight, Award, Shield, Layers, Calendar,
  FileBadge, BookOpen, UserCheck, XCircle, Lock,
  FileText, Trophy, AlertCircle, Star, ChevronDown,
  Stamp, RotateCcw, ScanLine, BadgeCheck,
  Activity, Gauge, ClipboardList, AlertTriangle, CalendarCheck, CalendarX,
  ThumbsUp, Brain, Flame, Frown, Meh, EyeOff,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════════
// §1  ACORN 六育 CONFIGURATION (德智體群美靈) — fallback only; live axes from bridge
// Order: 德 → 智 → 體 → 群 → 美 → 靈  (N-gon when bridge sends fewer/more)
// ═══════════════════════════════════════════════════════════════════════════════
type AcornAxis = { zh: string; en: string; color: string; bg: string; border: string; key?: string; badge?: string; sub?: string };
const DEFAULT_ACORN_AXES: AcornAxis[] = [
  { zh: "德", en: "Moral",        color: "#0d9488", bg: "#CCFBF1", border: "#99F6E4", key: "moral",        badge: "德育", sub: "德育" },
  { zh: "智", en: "Intellectual", color: "#2563eb", bg: "#DBEAFE", border: "#BFDBFE", key: "intellectual", badge: "智育", sub: "智育" },
  { zh: "體", en: "Physical",     color: "#e11d48", bg: "#FFE4E6", border: "#FECDD3", key: "physical",     badge: "體育", sub: "體育" },
  { zh: "群", en: "Social",       color: "#16a34a", bg: "#DCFCE7", border: "#BBF7D0", key: "social",       badge: "群育", sub: "群育" },
  { zh: "美", en: "Aesthetic",    color: "#ea580c", bg: "#FFEDD5", border: "#FED7AA", key: "aesthetic",    badge: "美育", sub: "美育" },
  { zh: "靈", en: "Spiritual",    color: "#7c3aed", bg: "#EDE9FE", border: "#DDD6FE", key: "spiritual",    badge: "靈育", sub: "靈育" },
];

type ActivityFootprint = {
  id: string;
  type?: string;
  title?: string;
  title_en?: string;
  name?: string;
  enName?: string;
  date?: string;
  category?: string;
  subject?: string;
  tier_code?: string;
  roleTier?: string;
  role_name?: string;
  role?: string;
  status?: string;
  acorn_dimension_label?: string;
  acornIdx?: number;
  awarded_points?: number;
  acornPts?: number;
  awarded_points_label?: string;
};

interface AcornRecord {
  label: string;
  labelEn: string;
  scores: number[];
  summary?: {
    pbl_count?: number;
    activity_count?: number;
    t3_leader_count?: number;
    total_autonomous_points?: number;
    overall_engagement_index?: number;
  };
  narrative?: { masked?: string; raw?: string; generated_at?: string };
  footprints?: ActivityFootprint[];
}

type ProfileAchievement = {
  id: number;
  title: string;
  award_details?: string;
  tier_role?: string;
  environment_level?: string;
  event_date?: string;
  review_status?: string;
  hours?: number;
};

type ProfileAcademicRow = {
  subject: string;
  assessment: string;
  raw_score: number | null;
  max_score: number | null;
  percent: number | null;
  term?: string;
  status?: string;
};

type ProfileConductRow = {
  id: number;
  type_name_zh: string;
  record_date: string;
  acorn_dimension?: string;
  points_offset?: number;
  category?: string;
};

type ProfileAttendanceRow = {
  id: number;
  date: string;
  type: string;
};
const FALLBACK_ACORN_DATA: Record<string, AcornRecord> = {
  "2025/26": {
    label:   "2025/26 (中一/F1)",
    labelEn: "AY 2025/26 · Form 1",
    scores:  [85, 82, 68, 91, 74, 78], // 德智體群美靈
    summary: { pbl_count: 2, activity_count: 8, t3_leader_count: 1, total_autonomous_points: 420 },
    narrative: {
      masked: "Student #CTM-001 在「群 · 社群」表現突出（91 分），並累積領導經歷。建議下一步挑戰「體 · 體適能」。",
      raw: "陳大文 在「群 · 社群」表現突出（91 分），並累積領導經歷。建議下一步挑戰「體 · 體適能」。",
      generated_at: "",
    },
  },
  "2024/25": {
    label:   "2024/25 (入學基準)",
    labelEn: "AY 2024/25 · Admission Benchmark",
    scores:  [80, 75, 60, 80, 65, 70], // 德智體群美靈
    summary: { pbl_count: 1, activity_count: 4, t3_leader_count: 0, total_autonomous_points: 180 },
  },
};
const FALLBACK_COMPARE: Record<string, string[]> = {
  "2025/26": ["2024/25"],
  "2024/25": [],
};

export type HolisticBridgePayload = {
  default_year?: string;
  years?: Record<string, AcornRecord>;
  compare_options?: Record<string, string[]>;
  pdpo_token?: string;
  display_name_zh?: string;
  display_name_en?: string;
  pending_cert_count?: number;
  records?: {
    pending_cert_count?: number;
    achievements?: ProfileAchievement[];
    academic?: ProfileAcademicRow[];
    conduct?: ProfileConductRow[];
    attendance?: ProfileAttendanceRow[];
    activities?: Array<{ type?: string; name?: string; role?: string; tier?: string }>;
    footprints?: ActivityFootprint[];
  };
  axes?: Array<{
    key: string; zh: string; sub?: string; badge?: string; en: string;
    color: string; bg: string; border: string;
  }>;
};

// ═══════════════════════════════════════════════════════════════════════════════
// §3  N-GON RADAR SVG  (custom, no recharts)
//     N axes from live config — hexagon at 6, pentagon at 5, etc.
// ═══════════════════════════════════════════════════════════════════════════════
const SZ = 300;          // SVG viewBox size
const CX = SZ / 2;       // centre-x
const CY = SZ / 2;       // centre-y
const RD = 100;          // outer data-ring radius
const LR = 136;          // label ring radius (outside RD)

function axisAnchor(i: number, n: number): "middle" | "start" | "end" {
  const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const cos = Math.cos(a);
  if (Math.abs(cos) < 0.35) return "middle";
  return cos > 0 ? "start" : "end";
}
function labelNudge(i: number, n: number): { dx: number; dy: number; vdx: number; vdy: number } {
  const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  return {
    dx: cos > 0.35 ? 6 : cos < -0.35 ? -6 : 0,
    dy: sin > 0.7 ? 8 : 0,
    vdx: cos > 0.35 ? 10 : cos < -0.35 ? -10 : 0,
    vdy: sin > 0.7 ? 16 : sin < -0.7 ? -15 : 4,
  };
}

function rPt(dimIdx: number, value: number, n: number, radius = RD): [number, number] {
  const sides = Math.max(3, n);
  const a = -Math.PI / 2 + (dimIdx * 2 * Math.PI) / sides;
  const r = (value / 100) * radius;
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
}

function rPath(vals: readonly number[], n: number): string {
  return vals.map((v, i) => { const [x, y] = rPt(i, v, n); return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`; }).join(" ") + " Z";
}

function gridPoly(scale: number, n: number): string {
  const sides = Math.max(3, n);
  return Array.from({ length: sides }, (_, i) => { const [x, y] = rPt(i, scale * 100, sides); return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`; }).join(" ") + " Z";
}

// ── Palette constants for the two radar layers ──────────────────────────────
const CLR_NOW  = { stroke: "#6EE7B7", fill: "rgba(110,231,183,0.22)", dot: "#6EE7B7", label: "#059669" };
const CLR_PREV = { stroke: "#DC2626", fill: "rgba(220,38,38,0.08)",  dot: "#EF4444", label: "#DC2626" };

const HexRadar: React.FC<{
  showPrevious: boolean;
  scoresNow: number[];
  scoresPrev: number[];
  axes?: AcornAxis[];
}> = ({
  showPrevious, scoresNow, scoresPrev, axes = DEFAULT_ACORN_AXES,
}) => {
  const n = Math.max(3, axes.length);
  return (
  <svg
    viewBox={`0 0 ${SZ} ${SZ}`}
    width="100%" height="auto"
    style={{ overflow: "visible", display: "block" }}
    aria-label={`ACORN ${n}育全人特徵圖譜雷達圖`}
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
      <path key={s} d={gridPoly(s, n)}
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
    {axes.map((ax, i) => {
      const [ox, oy] = rPt(i, 100, n);
      return <line key={i} x1={CX} y1={CY} x2={ox} y2={oy} stroke={ax.color} strokeWidth="1.5" strokeOpacity="0.20" />;
    })}

    {/* ── Historical year polygon — RED dashed, drawn first (background layer) ── */}
    {showPrevious && (
      <g>
        {/* Red semi-transparent fill */}
        <path d={rPath(scoresPrev, n)} fill={CLR_PREV.fill} />
        {/* Red dashed stroke */}
        <path d={rPath(scoresPrev, n)}
          fill="none"
          stroke={CLR_PREV.stroke}
          strokeWidth="2"
          strokeDasharray="5,4"
          strokeOpacity="0.80"
        />
        {/* Red dots at historical vertices */}
        {scoresPrev.map((v, i) => {
          const [px, py] = rPt(i, v, n);
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
    <path d={rPath(scoresNow, n)} fill="url(#hrGradGreen)" />
    <path d={rPath(scoresNow, n)}
      fill="none"
      stroke={CLR_NOW.stroke}
      strokeWidth="2.8"
      strokeLinejoin="round"
    />

    {/* Current year dots + value labels */}
    {scoresNow.map((v, i) => {
      const [dpx, dpy] = rPt(i, v, n);
      const nudge = labelNudge(i, n);
      const anchor = nudge.vdx > 0 ? "start" : nudge.vdx < 0 ? "end" : "middle";
      return (
        <g key={i}>
          <circle cx={dpx} cy={dpy} r="5.5"
            fill={CLR_NOW.dot} stroke="#fff" strokeWidth="2.5"
            filter="url(#hrDotGreen)"
          />
          <text x={dpx + nudge.vdx} y={dpy + nudge.vdy}
            fontSize="10.5" fontWeight="800"
            fill={CLR_NOW.label} textAnchor={anchor}
            fontFamily={ERP.font.family}
          >{v}</text>
        </g>
      );
    })}

    {/* Axis labels — keep per-axis brand colors for dimension identity */}
    {axes.map((ax, i) => {
      const a  = -Math.PI / 2 + (i * 2 * Math.PI) / n;
      const lx = CX + LR * Math.cos(a);
      const ly = CY + LR * Math.sin(a);
      const nudge = labelNudge(i, n);
      const anchor = axisAnchor(i, n);
      return (
        <g key={i}>
          <text x={lx + nudge.dx} y={ly + nudge.dy}
            fontSize="13.5" fontWeight="800"
            fill={ax.color} textAnchor={anchor}
            fontFamily={ERP.font.family}
          >{ax.zh}</text>
          <text x={lx + nudge.dx} y={ly + nudge.dy + 15}
            fontSize="9" fontWeight="400"
            fill={ax.color} textAnchor={anchor}
            opacity="0.62" fontFamily={ERP.font.family}
          >{ax.sub ?? ax.en}</text>
        </g>
      );
    })}
  </svg>
  );
};

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
  /** Official school name from system settings / Config\SchoolSettings */
  schoolName?: string;
  schoolNameEn?: string;
  /** Live multi-year ACORN snapshots from bridge / API */
  holistic?: HolisticBridgePayload | null;
  profileMeta?: {
    student_id?: string;
    name_zh_hk?: string;
    name_en?: string;
    class_name?: string;
    class_number?: number | null;
    system_tier?: string;
    status?: string;
    status_raw?: string;
    academic_year?: string;
    pdpo_token?: string;
  } | null;
}

/** First visible character (CJK-safe). */
function firstGlyph(text: string, fallback = "學"): string {
  const t = text.trim();
  if (!t) return fallback;
  const ch = Array.from(t)[0];
  return ch || fallback;
}

function statusDisplay(status?: string | null): { label: string; bg: string; color: string; bd: string } {
  const s = (status || "").toLowerCase().trim();
  if (s === "active" || s === "在學") {
    return { label: "在學", bg: "#DCFCE720", color: "#86EFAC", bd: "#16A34A35" };
  }
  if (s === "repeat" || s === "重讀") {
    return { label: "重讀", bg: "#FEF3C720", color: "#FCD34D", bd: "#D9770640" };
  }
  if (s === "suspended" || s === "停學") {
    return { label: "停學", bg: "#FEE2E220", color: "#FCA5A5", bd: "#DC262640" };
  }
  if (s === "left" || s === "graduated" || s === "離校" || s === "畢業") {
    return { label: s === "graduated" || s === "畢業" ? "畢業" : "離校", bg: "#F1F5F920", color: "#CBD5E1", bd: "#94A3B840" };
  }
  return { label: status?.trim() || "在學", bg: "#DCFCE720", color: "#86EFAC", bd: "#16A34A35" };
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
  studentLabel?: string;
  onSubmitAttendance: (r: { type: keyof typeof ATT_TYPE_META; remark: string; date: string }) => void;
  onSubmitConduct:    (r: { kind: "mod-d" | "merit"; date: string; subject: string; teacher: string; levelKey: string; detail: string }) => void;
  onClose: () => void;
}

const AddRecordModal: React.FC<AddRecordModalProps> = ({
  defaultTab, studentLabel, onSubmitAttendance, onSubmitConduct, onClose,
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
              Add New Record · {studentLabel?.trim() || "—"}
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
  studentId,
  onBack: _onBack,
  routeSource: _routeSource = "roster",
  routeClassCode: _routeClassCode,
  schoolName = "香港神託會培敦中學",
  schoolNameEn = "Stewards Pooi Tun Secondary School",
  holistic = null,
  profileMeta = null,
}) => {
  void _onBack;
  void _routeSource;
  void _routeClassCode;
  const schoolLine = schoolName.includes("Stewards") || schoolName.includes(schoolNameEn)
    ? schoolName
    : `${schoolName} · ${schoolNameEn}`;
  const [activeTab, setActiveTab] = useState<"overview" | "certs" | "academic" | "conduct">("overview");
  const [showYoY,  setShowYoY]  = useState(true);   // pre-activated: YoY overlay ON
  const [liveProfile, setLiveProfile] = useState(profileMeta);
  const [liveHolistic, setLiveHolistic] = useState(holistic);

  // Keep props in sync when bridge re-hydrates
  useEffect(() => { setLiveProfile(profileMeta); }, [profileMeta]);
  useEffect(() => { setLiveHolistic(holistic); }, [holistic]);

  // Fetch live identity when bridge profile is missing/incomplete
  useEffect(() => {
    const incomplete =
      !profileMeta?.student_id
      || (!profileMeta?.name_zh_hk && !profileMeta?.name_en);
    if (!incomplete || !studentId || studentId === "unknown") return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/students/${encodeURIComponent(studentId)}/holistic`, {
          credentials: "same-origin",
          headers: { Accept: "application/json" },
        });
        const json = await res.json().catch(() => ({}));
        if (cancelled || !res.ok || !json?.ok) return;
        if (json.profile) setLiveProfile(json.profile);
        if (json.holistic) setLiveHolistic(json.holistic);
      } catch {
        /* keep whatever props we have */
      }
    })();
    return () => { cancelled = true; };
  }, [studentId, profileMeta?.student_id, profileMeta?.name_zh_hk, profileMeta?.name_en]);

  const effectiveHolistic = liveHolistic ?? holistic;
  const liveYears = effectiveHolistic?.years && Object.keys(effectiveHolistic.years).length > 0 ? effectiveHolistic.years : null;
  const ACORN_DATA: Record<string, AcornRecord> = liveYears ?? FALLBACK_ACORN_DATA;
  const COMPARE_OPTIONS: Record<string, string[]> = effectiveHolistic?.compare_options ?? FALLBACK_COMPARE;
  const ACORN_AXES: AcornAxis[] = (effectiveHolistic?.axes && effectiveHolistic.axes.length >= 3)
    ? effectiveHolistic.axes.map(a => ({
        zh: a.zh, en: a.en, color: a.color, bg: a.bg, border: a.border,
        key: a.key, sub: a.sub, badge: a.badge ?? `${a.zh} · ${a.sub ?? a.en}`,
      }))
    : DEFAULT_ACORN_AXES;

  const yearKeys = Object.keys(ACORN_DATA);
  const initialYear = (effectiveHolistic?.default_year && ACORN_DATA[effectiveHolistic.default_year])
    ? effectiveHolistic.default_year
    : (yearKeys[0] ?? "2025/26");

  const [viewYear, setViewYear] = useState(initialYear);
  const [cmpYear,  setCmpYear]  = useState((COMPARE_OPTIONS[initialYear] ?? [])[0] ?? "");
  const [pdpo,     setPdpo]     = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [narrativeBusy, setNarrativeBusy] = useState(false);
  const [liveNarrative, setLiveNarrative] = useState<{ masked: string; raw: string; generated_at?: string } | null>(null);

  // ── ACORN year derivations ─────────────────────────────────────────────────
  const cmpOptions   = COMPARE_OPTIONS[viewYear] ?? [];
  const effectiveCmp = cmpOptions.includes(cmpYear) ? cmpYear : (cmpOptions[0] ?? "");
  const showCmp      = showYoY && effectiveCmp !== "";
  const viewData     = ACORN_DATA[viewYear] ?? FALLBACK_ACORN_DATA["2025/26"];
  const cmpData      = ACORN_DATA[effectiveCmp];

  // Reset comparison when primary view year changes
  useEffect(() => {
    const opts = COMPARE_OPTIONS[viewYear] ?? [];
    setCmpYear(opts[0] ?? "");
    setLiveNarrative(null);
  }, [viewYear]);

  // ── Cert Approval tab state ───────────────────────────────────────────────
  const [approvalStatus, setApprovalStatus] = useState<"pending" | "approved" | "rejected">("pending");
  const [certTitle, setCertTitle] = useState("Regional Science Competition");
  const [certAward, setCertAward] = useState("Gold Award");
  const [certLevel, setCertLevel] = useState("L4");
  const [certTier,  setCertTier]  = useState("T4");
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  // ── Conduct tab — hydrated from bridge records (no demo rows) ─────────────
  const [attendanceLogs, setAttendanceLogs] = useState<Array<{
    id: string; date: string; type: keyof typeof ATT_TYPE_META; typeZh: string; typeEn: string; remark: string; remarkEn: string;
  }>>([]);
  const [engagementLogs, setEngagementLogs] = useState<Array<{
    id: string; date: string; subject: string; subjectEn: string; teacher: string; teacherEn: string;
    kind: "mod-d" | "merit"; tagZh: string; tagEn: string; level: "high" | "low" | "merit"; detail: string;
  }>>([]);
  const [addingRecord, setAddingRecord] = useState<"attendance" | "conduct" | null>(null);

  // Hydrate attendance / conduct from live bridge once available
  useEffect(() => {
    const att = effectiveHolistic?.records?.attendance ?? [];
    if (att.length) {
      setAttendanceLogs(att.map((a) => {
        const key = (String(a.type || "late").toLowerCase().includes("sick") ? "sick"
          : String(a.type || "").toLowerCase().includes("absent") ? "absent"
          : "late") as keyof typeof ATT_TYPE_META;
        const meta = ATT_TYPE_META[key] || ATT_TYPE_META.late;
        return {
          id: String(a.id),
          date: a.date || "",
          type: key,
          typeZh: meta.zh,
          typeEn: meta.en,
          remark: a.type || "",
          remarkEn: a.type || "",
        };
      }));
    }
    const cond = effectiveHolistic?.records?.conduct ?? [];
    if (cond.length) {
      setEngagementLogs(cond.map((c) => {
        const isMerit = (c.points_offset ?? 0) >= 0 || (c.category || "").includes("conduct");
        return {
          id: String(c.id),
          date: c.record_date || "",
          subject: c.acorn_dimension || "全校",
          subjectEn: c.acorn_dimension || "School",
          teacher: "—",
          teacherEn: "—",
          kind: isMerit ? "merit" as const : "mod-d" as const,
          tagZh: c.type_name_zh || "紀錄",
          tagEn: c.type_name_zh || "Record",
          level: isMerit ? "merit" as const : "high" as const,
          detail: `Δ ${c.points_offset ?? 0} pts`,
        };
      }));
    }
  }, [effectiveHolistic?.records?.attendance, effectiveHolistic?.records?.conduct]);

  const F = ERP.font.family;

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 900);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const profile = liveProfile ?? profileMeta;
  const pdpoToken = effectiveHolistic?.pdpo_token || profile?.pdpo_token || "Student #S00000";
  const nameZh = (profile?.name_zh_hk || effectiveHolistic?.display_name_zh || "").trim();
  const nameEn = (profile?.name_en || effectiveHolistic?.display_name_en || "").trim();
  const realName = nameZh || nameEn || "（未命名學生）";
  const realNameEn = nameEn;
  const displayName = pdpo ? `${pdpoToken} 🛡️` : realName;
  // Avatar: first char of Chinese name, else first letter of English name
  const avatarGlyph = nameZh
    ? firstGlyph(nameZh, "學")
    : firstGlyph(nameEn.toUpperCase(), "S");

  const regId = (profile?.student_id || studentId || "").trim();
  const classLabel = (profile?.class_name || _routeClassCode || "").trim() || "—";
  const classNo = profile?.class_number != null && profile.class_number !== ("" as unknown as number)
    ? String(profile.class_number)
    : "—";
  const statusUi = statusDisplay(profile?.status || profile?.status_raw);
  // Academic year badge tracks the year currently being viewed (radar selector)
  const yearLabel = `AY ${viewYear}`;

  const pendingCertCount = Number(
    effectiveHolistic?.pending_cert_count
    ?? effectiveHolistic?.records?.pending_cert_count
    ?? 0,
  );
  const liveAchievements = effectiveHolistic?.records?.achievements ?? [];
  const liveAcademic = effectiveHolistic?.records?.academic ?? [];
  const liveConduct = effectiveHolistic?.records?.conduct ?? [];
  const liveAttendance = effectiveHolistic?.records?.attendance ?? [];

  const narrativeMasked = liveNarrative?.masked
    || viewData.narrative?.masked
    || `${pdpoToken} 的全人發展評語尚未生成。請按「重新生成 AI 評語」。`;
  const narrativeRaw = liveNarrative?.raw
    || viewData.narrative?.raw
    || narrativeMasked.replace(pdpoToken, realName).replace(" 🛡️", "");
  const narrativeText = pdpo ? narrativeMasked : narrativeRaw;
  const narrativeAt = liveNarrative?.generated_at || viewData.narrative?.generated_at || "";

  const summary = viewData.summary ?? {
    pbl_count: 0, activity_count: 0, t3_leader_count: 0,
    total_autonomous_points: 0, overall_engagement_index: 0,
  };
  const autonomousPts = Number(summary.total_autonomous_points ?? 0);
  const engagementIdx = Number(summary.overall_engagement_index ?? 0);
  const engagementLabel = engagementIdx >= 75
    ? "課堂參與度 · High"
    : engagementIdx >= 40
      ? "課堂參與度 · Moderate"
      : engagementIdx >= 1
        ? "課堂參與度 · Low"
        : "尚無參與數據 · No Data";
  const engagementDisplay = engagementIdx > 0
    ? `${Number(engagementIdx.toFixed(1))}%`
    : "0%";

  const bestGrowth = (() => {
    if (!showCmp || !cmpData) return null;
    let bestIdx = 0;
    let bestDelta = -Infinity;
    ACORN_AXES.forEach((_, i) => {
      const d = (viewData.scores[i] ?? 0) - (cmpData.scores[i] ?? 0);
      if (d > bestDelta) { bestDelta = d; bestIdx = i; }
    });
    return { axis: ACORN_AXES[bestIdx], delta: Math.round(bestDelta * 10) / 10 };
  })();

  const requestNarrative = async () => {
    setNarrativeBusy(true);
    try {
      const res = await fetch(`/api/students/${encodeURIComponent(studentId)}/holistic/narrative`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
        credentials: "same-origin",
        body: JSON.stringify({ year: viewYear, compare_year: effectiveCmp || null }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json?.narrative) {
        setLiveNarrative({
          masked: String(json.narrative.masked || ""),
          raw: String(json.narrative.raw || ""),
          generated_at: String(json.narrative.generated_at || ""),
        });
      } else {
        console.error("narrative failed", json?.message || res.status);
      }
    } catch (err) {
      console.error("narrative request error", err);
    } finally {
      setNarrativeBusy(false);
    }
  };

  // ── tier badge colours ──────────────────────────────────────────────────────
  const TIER_CFG: Record<string, { bg: string; color: string; border: string }> = {
    T4: { bg: ERP.acornTags["領導"].bg, color: ERP.acornTags["領導"].color, border: ERP.acornTags["領導"].border },
    T3: { bg: ERP.acornTags["領導"].bg, color: ERP.acornTags["領導"].color, border: ERP.acornTags["領導"].border },
    T2: { bg: ERP.acornTags["協作"].bg, color: ERP.acornTags["協作"].color, border: ERP.acornTags["協作"].border },
    T1: { bg: ERP.acornTags["社群"].bg, color: ERP.acornTags["社群"].color, border: ERP.acornTags["社群"].border },
    T0: { bg: "#F1F5F9", color: "#64748B", border: "#E2E8F0" },
  };

  const STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
    completed: { label: "已完成", color: ERP.colors.green, bg: ERP.colors.greenLight, border: "#86EFAC", icon: <CheckCircle2 size={11} /> },
    reviewing: { label: "審核中", color: ERP.colors.amber, bg: ERP.colors.amberLight, border: "#FDE68A", icon: <Clock size={11} /> },
    ongoing:   { label: "進行中", color: ERP.colors.accent, bg: ERP.colors.accentPale, border: "#93C5FD", icon: <Clock size={11} /> },
  };

  // Live footprints for the AY currently shown in Achievement Summary (never demo rows)
  const liveFootprints: ActivityFootprint[] = (
    (viewData as AcornRecord)?.footprints
    ?? effectiveHolistic?.records?.footprints
    ?? []
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%", background: ERP.colors.pageBg, fontFamily: F }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* ══════════════════════════════════════════════════════════════════════
          PAGE CONTENT (scrolls inside AppShell <main>)
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="container-fluid" style={{ flex: 1, padding: isMobile ? "16px" : "20px 28px 48px" }}>

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
          marginTop: 4,
          marginBottom: 20,
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
            padding: isMobile ? "18px 20px 20px" : "22px 30px 26px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}>
            {/* Top row: export CTA (high-contrast on dark) */}
            <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
              <button
                type="button"
                className="btn btn-light text-primary fw-bold"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 7,
                  padding: isMobile ? "8px 12px" : "9px 16px",
                  borderRadius: ERP.radius.md,
                  border: "1px solid rgba(255,255,255,0.85)",
                  background: "#FFFFFF",
                  color: ERP.colors.accentDark || "#1D4ED8",
                  fontSize: 12, fontWeight: 800, fontFamily: F, cursor: "pointer",
                  flexShrink: 0,
                  boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
                }}
              >
                <Download size={14} />
                {isMobile ? "匯出成果" : "組裝並匯出成果檔案"}
              </button>
            </div>

            {/* Identity + KPI row */}
            <div style={{
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
                    : <span style={{ fontSize: isMobile ? 26 : 32, fontWeight: 900, color: "#fff", fontFamily: F }}>{avatarGlyph}</span>
                  }
                </div>
                <div>
                  <div style={{ fontSize: isMobile ? 20 : 26, fontWeight: 900, color: "#F8FAFC", lineHeight: 1.15, letterSpacing: "-0.3px" }}>
                    {displayName}
                  </div>
                  <BlurWrap on={pdpo} hint>
                    <div style={{ fontSize: 13, color: "#94A3B8", marginTop: 3 }}>
                      {(realNameEn || "—")} · {regId || "—"}
                    </div>
                  </BlurWrap>
                  <BlurWrap on={pdpo} hint={false}>
                    <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>{schoolLine}</div>
                  </BlurWrap>
                  {/* Tags — live from annual record / profile bridge (never Figma demo) */}
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                    {([
                      { label: classLabel, bg: "#DBEAFE22", color: "#93C5FD", bd: "#3B82F640", pii: true  },
                      { label: `學號：${classNo}`, bg: "#FFFFFF10", color: "#CBD5E1", bd: "#FFFFFF1A", pii: true  },
                      { label: statusUi.label, bg: statusUi.bg, color: statusUi.color, bd: statusUi.bd, pii: false },
                      { label: yearLabel, bg: "#FEF3C720", color: "#FCD34D", bd: "#D9770640", pii: false },
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

              {/* KPI Metric Cards — live Mod C / Mod D from yearly snapshot */}
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {[
                  {
                    mod: "Mod C · 積點", icon: <Zap size={14} color="#FCD34D" />, iconColor: "#FCD34D",
                    value: autonomousPts.toLocaleString(), unit: "校園自主積點 pts",
                  },
                  {
                    mod: "Mod D · 參與", icon: <TrendingUp size={14} color="#34D399" />, iconColor: "#34D399",
                    value: engagementDisplay, unit: engagementLabel,
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
            { id: "certs",     icon: <FileBadge size={14} />,  zh: "🎖️ 成就與證書審批", short: "成就審批", en: "Cert Approvals", badge: pendingCertCount > 0 ? pendingCertCount : undefined },
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
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#059669" }}>
                    最大進步：{bestGrowth ? `${bestGrowth.axis.badge ?? bestGrowth.axis.zh} ${bestGrowth.delta >= 0 ? "+" : ""}${Number(bestGrowth.delta).toFixed(1)}pts` : "—"}
                  </span>
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
                axes={ACORN_AXES}
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
                const now   = Number(viewData.scores[i] ?? 0);
                const prev  = Number(cmpData?.scores[i] ?? 0);
                const delta = Number((now - prev).toFixed(1));
                const deltaLabel = `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}`;
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
                        <span style={{ fontSize: 13, fontWeight: 900, color: "#059669" }}>🟢 {now.toFixed(1)}</span>
                        {showCmp && (
                          <>
                            <span style={{ fontSize: 10, color: ERP.colors.textMuted }}>vs</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: "#DC2626" }}>🔴 {prev.toFixed(1)}</span>
                            <span style={{
                              fontSize: 9, fontWeight: 800, padding: "2px 6px",
                              borderRadius: ERP.radius.full,
                              background: delta >= 0 ? "#D1FAE5" : "#FEE2E2",
                              color: delta >= 0 ? "#059669" : "#DC2626",
                              border: `1px solid ${delta >= 0 ? "#6EE7B7" : "#FECACA"}`,
                              whiteSpace: "nowrap" as const,
                            }}>
                              📈 {deltaLabel}
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
                {narrativeText}
              </p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 18 }}>
                <p style={{ fontSize: 10, color: "#7C3AED", margin: 0, opacity: 0.68, fontStyle: "italic" as const, lineHeight: 1.5 }}>
                  {narrativeAt
                    ? `Generated · ${narrativeAt}`
                    : "Generated based on ACORN yearly snapshot · Cl.6.1"}
                </p>
                <button
                  type="button"
                  onClick={() => { void requestNarrative(); }}
                  disabled={narrativeBusy}
                  style={{
                    fontSize: 10, fontWeight: 700, padding: "4px 8px", borderRadius: 6,
                    border: "1px solid #C4B5FD", background: "#EDE9FE", color: "#6D28D9",
                    cursor: narrativeBusy ? "wait" : "pointer", fontFamily: F,
                    display: "inline-flex", alignItems: "center", gap: 5, opacity: narrativeBusy ? 0.75 : 1,
                  }}
                >
                  {narrativeBusy ? (
                    <>
                      <Loader2 size={11} style={{ animation: "spin 0.7s linear infinite" }} />
                      生成中...
                    </>
                  ) : "重新生成 AI 評語"}
                </button>
              </div>

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
                    Apply PDPO Mask · Cl.6.1 · {pdpo ? `${pdpoToken} 🛡️` : realName}
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
                  { label: "完成 PBL",    value: String(summary.pbl_count ?? 0), unit: "個專題", color: ERP.colors.accent  },
                  { label: "參與活動",    value: String(summary.activity_count ?? 0), unit: "次", color: ERP.colors.teal },
                  { label: "擔任領導角色", value: String(summary.t3_leader_count ?? 0), unit: "次 T3", color: ERP.colors.purple },
                  { label: "累計積點", value: Number(summary.total_autonomous_points ?? 0).toLocaleString(), unit: "pts", color: ERP.colors.amber },
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
            ACTIVITY MATRIX  —  PBL & ECA Footprints (live DB)
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
            <span style={{ fontSize: 11, color: ERP.colors.textMuted }}>{liveFootprints.length} 項紀錄</span>
          </div>

          {liveFootprints.length === 0 ? (
            <div style={{ padding: "28px 22px", textAlign: "center", color: ERP.colors.textMuted, fontSize: 12 }}>
              本學年暫無跨學科實作與活動軌跡。
            </div>
          ) : (
            liveFootprints.map((act, idx) => {
              const title = (act.title || act.name || "（未命名活動）").trim();
              const enName = (act.title_en || act.enName || "").trim();
              const subject = (act.category || act.subject || "活動").trim();
              const role = (act.role_name || act.role || "參加者").trim();
              const tierCode = (act.tier_code || act.roleTier || "T1").toUpperCase();
              const statusKey = (
                act.status === "reviewing" ? "reviewing"
                  : act.status === "ongoing" ? "ongoing"
                  : "completed"
              );
              const acornIdx = Number.isFinite(act.acornIdx) ? Math.max(0, Math.min(ACORN_AXES.length - 1, Number(act.acornIdx))) : 1;
              const dim = ACORN_AXES[acornIdx] ?? ACORN_AXES[1];
              const dimLabel = (act.acorn_dimension_label || dim.zh).trim();
              const pts = Number(act.awarded_points ?? act.acornPts ?? 0);
              const ptsLabel = act.awarded_points_label || `${pts >= 0 ? "+" : ""}${pts}`;
              const tier = TIER_CFG[tierCode] ?? TIER_CFG.T1;
              const stat = STATUS_CFG[statusKey];
              const isLast = idx === liveFootprints.length - 1;

              return (
                <div
                  key={act.id || `${title}-${idx}`}
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
                  <div style={{
                    width: 12, height: 12, borderRadius: "50%", flexShrink: 0,
                    background: dim.color, border: "2.5px solid #fff",
                    boxShadow: `0 0 0 2.5px ${dim.color}40`,
                  }} />

                  <div style={{ flex: 1, minWidth: 180 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: ERP.colors.textPrimary, marginBottom: 2 }}>{title}</div>
                    <div style={{ fontSize: 11, color: ERP.colors.textMuted, display: "flex", alignItems: "center", gap: 5 }}>
                      <Calendar size={10} /> {(act.date || "—")}{enName ? ` · ${enName}` : ""}
                    </div>
                  </div>

                  <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: ERP.radius.xs, background: ERP.colors.accentPale, color: ERP.colors.accent, flexShrink: 0 }}>
                    {subject}
                  </span>

                  <div style={{ display: "flex", gap: 5, alignItems: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 7px", borderRadius: ERP.radius.xs, background: tier.bg, color: tier.color, border: `1px solid ${tier.border}` }}>
                      {tierCode}
                    </span>
                    <span style={{ fontSize: 12, color: ERP.colors.textSecondary }}>角色：{role}</span>
                  </div>

                  <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: ERP.radius.full, background: stat.bg, color: stat.color, border: `1px solid ${stat.border}`, flexShrink: 0 }}>
                    {stat.icon} 狀態：{stat.label}
                  </span>

                  <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: ERP.radius.full, background: dim.bg, color: dim.color, border: `1px solid ${dim.border}`, flexShrink: 0 }}>
                    獲得機遇：{dimLabel} {ptsLabel}
                  </span>
                </div>
              );
            })
          )}
        </div>

        </>)} {/* /activeTab === "overview" */}

        {/* ──────────────────────────────────────────────────────────────────
            TAB CONTENT: CERT APPROVALS  —  Teacher Approval Dashboard
        ────────────────────────────────────────────────────────────────── */}
        {activeTab === "certs" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Live achievement records from DB */}
            <div style={{ background: ERP.colors.surface, borderRadius: ERP.radius.xl, border: `1px solid ${ERP.colors.border}`, overflow: "hidden", boxShadow: ERP.shadow.sm }}>
              <div style={{ padding: "12px 18px", borderBottom: `1px solid ${ERP.colors.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: "#FAFCFF" }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: ERP.colors.textPrimary }}>本生成就／證書紀錄</div>
                {pendingCertCount > 0 ? (
                  <span style={{ fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: ERP.radius.full, background: ERP.colors.redLight, color: ERP.colors.red, border: `1px solid ${ERP.colors.red}40` }}>
                    {pendingCertCount} 份待審
                  </span>
                ) : (
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: ERP.radius.full, background: ERP.colors.greenLight, color: ERP.colors.green }}>
                    0 份待審
                  </span>
                )}
              </div>
              {liveAchievements.length === 0 ? (
                <div style={{ padding: "28px 20px", textAlign: "center", color: ERP.colors.textMuted, fontSize: 12 }}>
                  尚無此學生的成就／證書紀錄。
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {liveAchievements.map((a, idx) => (
                    <div key={a.id || idx} style={{
                      padding: "12px 18px",
                      borderBottom: idx < liveAchievements.length - 1 ? `1px solid ${ERP.colors.divider}` : undefined,
                      display: "flex", alignItems: "center", gap: 12,
                    }}>
                      <Trophy size={14} color={ERP.colors.amber} style={{ flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: ERP.colors.textPrimary }}>{a.title || "（未命名成就）"}</div>
                        <div style={{ fontSize: 10, color: ERP.colors.textMuted, marginTop: 2 }}>
                          {[a.tier_role, a.environment_level, a.event_date].filter(Boolean).join(" · ") || "—"}
                        </div>
                      </div>
                      <span style={{
                        fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 999,
                        background: (a.review_status === "pending" || a.review_status === "reviewing") ? ERP.colors.redLight : ERP.colors.greenLight,
                        color: (a.review_status === "pending" || a.review_status === "reviewing") ? ERP.colors.red : ERP.colors.green,
                      }}>
                        {a.review_status || "—"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

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
                {pendingCertCount > 0 ? (
                  <span style={{ fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: ERP.radius.full, background: ERP.colors.redLight, color: ERP.colors.red, border: `1px solid ${ERP.colors.red}40` }}>
                    {pendingCertCount} 份待審
                  </span>
                ) : (
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: ERP.radius.full, background: "#F1F5F9", color: ERP.colors.textMuted }}>
                    0 份待審
                  </span>
                )}
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
                    <div style={{ fontSize: 20, fontWeight: 900, color: "#F1C40F", letterSpacing: "-0.2px" }}>{displayName}{!pdpo && realNameEn ? ` ${realNameEn}` : ""}</div>
                    <div style={{ fontSize: 10, color: "#8BA3C4", marginTop: 2 }}>{classLabel} · {schoolLine}</div>
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

          </div>{/* /certs grid */}
          </div>
        )}{/* /certs tab */}

        {/* ──────────────────────────────────────────────────────────────────
            TAB CONTENT: ACADEMIC RECORDS — live student_scores
        ────────────────────────────────────────────────────────────────── */}
        {activeTab === "academic" && liveAcademic.length > 0 && (
          <div style={{ background: ERP.colors.surface, borderRadius: ERP.radius.xl, border: `1px solid ${ERP.colors.border}`, overflow: "hidden", boxShadow: ERP.shadow.sm }}>
            <div style={{ padding: "14px 18px", borderBottom: `1px solid ${ERP.colors.border}`, fontSize: 13, fontWeight: 800 }}>
              學業成績明細 · {viewYear}
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "#F8FAFC", textAlign: "left" }}>
                    {["科目", "評核", "分數", "滿分", "百分比", "學期"].map((h) => (
                      <th key={h} style={{ padding: "10px 14px", fontWeight: 700, color: ERP.colors.textMuted, borderBottom: `1px solid ${ERP.colors.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {liveAcademic.map((row, i) => (
                    <tr key={`${row.subject}-${row.assessment}-${i}`}>
                      <td style={{ padding: "10px 14px", fontWeight: 700, borderBottom: `1px solid ${ERP.colors.divider}` }}>{row.subject}</td>
                      <td style={{ padding: "10px 14px", borderBottom: `1px solid ${ERP.colors.divider}` }}>{row.assessment}</td>
                      <td style={{ padding: "10px 14px", borderBottom: `1px solid ${ERP.colors.divider}` }}>{row.raw_score ?? "—"}</td>
                      <td style={{ padding: "10px 14px", borderBottom: `1px solid ${ERP.colors.divider}` }}>{row.max_score ?? "—"}</td>
                      <td style={{ padding: "10px 14px", borderBottom: `1px solid ${ERP.colors.divider}`, fontWeight: 800, color: ERP.colors.accent }}>
                        {row.percent != null ? `${row.percent}%` : "—"}
                      </td>
                      <td style={{ padding: "10px 14px", borderBottom: `1px solid ${ERP.colors.divider}` }}>{row.term || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {activeTab === "academic" && liveAcademic.length === 0 && (
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E2E8F0", padding: "36px 24px", textAlign: "center", color: "#94A3B8", fontSize: 13 }}>
            尚無此學生於 {viewYear} 的學業成績紀錄。
          </div>
        )}

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
                      <strong>Mod D 分析：</strong>本學期共 {engagementLogs.length} 項參與／操行紀錄。整體參與指數 <strong>{engagementDisplay}</strong>（{engagementLabel}）。
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
                studentLabel={[realName, realNameEn].filter(Boolean).join(" ")}
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

      </div>{/* /page content */}
    </div>
  );
};
