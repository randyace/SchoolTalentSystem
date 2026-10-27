// ─────────────────────────────────────────────────────────────────────────────
// Screen_BulkGroupAward.tsx
// 證書批量建立 / 生成 — Canva-style Bulk Certificate Generator
// ERP Module 1.D.4B  ·  Achievements & Certs
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useRef, useEffect, useCallback } from "react";
import { ERP } from "./erpTokens";
import {
  ArrowLeft, ChevronRight, ChevronDown, Upload, Layers,
  X, Plus, Sparkles, FileText, Users, Award,
  GripVertical, Eye, Download, Printer, RotateCcw,
  CheckCircle2, Move, Stamp, PenLine, CalendarDays, User, BookOpen,
  AlignCenter, Search, Image as ImageIcon, Tag, Minus, Save,
} from "lucide-react";

// ── Design tokens ──────────────────────────────────────────────────────────────
const T = {
  bg:          "#F8FAFC",
  surface:     "#FFFFFF",
  border:      "#E2E8F0",
  borderFocus: "#94A3B8",
  text1:  "#0F172A",
  text2:  "#334155",
  text3:  "#64748B",
  text4:  "#94A3B8",
  blue:   "#2563EB",
  bluePale:    "#EFF6FF",
  blueBd:      "#BFDBFE",
  emerald:     "#059669",
  emeraldPale: "#ECFDF5",
  emeraldBd:   "#6EE7B7",
  amber:       "#D97706",
  amberPale:   "#FFFBEB",
  amberBd:     "#FDE68A",
  purple:      "#7C3AED",
  purplePale:  "#F5F3FF",
  purpleBd:    "#C4B5FD",
  red:         "#DC2626",
  redPale:     "#FEF2F2",
  redBd:       "#FECACA",
  shadow:  "0 1px 3px rgba(15,23,42,0.08), 0 1px 2px rgba(15,23,42,0.06)",
  shadowMd:"0 4px 12px rgba(15,23,42,0.10), 0 1px 4px rgba(15,23,42,0.06)",
  radius:  "10px",
  radiusLg: "14px",
  radiusXl: "18px",
  font:    ERP.font.family,
  mono:    "'JetBrains Mono', 'Fira Code', monospace",
};

export interface CertActivityOption {
  id: number;
  label: string;
  name_zh_hk?: string;
  name_en?: string;
  academic_year?: string;
  start_date?: string;
}

export interface CertStudentRow {
  id: string;
  name: string;
  nameEn: string;
  cls: string;
}

export type CertCustomField = {
  id: number;
  field_name: string;
  display_label: string;
};

export interface ScreenBulkGroupAwardProps {
  onBack: () => void;
  activities?: CertActivityOption[];
  studentsUrlBase?: string;
  generatePdfUrl?: string;
  customFieldsUrl?: string;
  /** From system_settings — empty until admin uploads via /settings */
  schoolLogoUrl?: string;
  schoolLogoPath?: string;
  principalName?: string;
  principalTitle?: string;
  schoolName?: string;
  signatureLine?: string;
  customFields?: CertCustomField[];
  templateId?: number | null;
  templateTitle?: string;
  saveTemplateUrl?: string;
  bgImageUrl?: string;
  initialConfig?: CertEditorConfig | null;
  flashSuccess?: string;
  flashError?: string;
}

export type CertEditorConfig = {
  version?: number;
  activityId?: number | null;
  awardTitle?: string;
  issueDate?: string;
  templateBg?: string;
  fields?: Array<Record<string, unknown>>;
};

type PlaceType = "dynamic" | "static_text" | "image" | "custom";

// ── Variable field definitions ─────────────────────────────────────────────────
interface VarField {
  key: string;
  label: string;
  labelEn: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  border: string;
  defaultW: number; // % of canvas width
  defaultH: number; // % of canvas height
  type?: PlaceType;
  value?: string;
  src?: string;
}

const VAR_FIELDS: VarField[] = [
  { key: "studentName", label: "姓名",       labelEn: "Student Name",  icon: <User size={11} />,        color: T.blue,   bg: T.bluePale,   border: T.blueBd,   defaultW: 28, defaultH: 6 },
  { key: "nameEn",      label: "英文姓名",   labelEn: "English Name",  icon: <User size={11} />,        color: "#7C3AED", bg: "#F5F3FF",   border: "#C4B5FD",  defaultW: 30, defaultH: 5 },
  { key: "class",       label: "班別",       labelEn: "Class",         icon: <BookOpen size={11} />,    color: T.emerald, bg: T.emeraldPale, border: T.emeraldBd, defaultW: 12, defaultH: 5 },
  { key: "awardTitle",  label: "獎項名稱",   labelEn: "Award Title",   icon: <Award size={11} />,       color: T.amber,  bg: T.amberPale,  border: T.amberBd,  defaultW: 24, defaultH: 7 },
  { key: "eventName",   label: "活動名稱",   labelEn: "Event Name",    icon: <Layers size={11} />,      color: "#0891B2", bg: "#F0FDFA",   border: "#67E8F9",  defaultW: 38, defaultH: 5 },
  { key: "date",        label: "日期",       labelEn: "Date",          icon: <CalendarDays size={11} />, color: "#DC2626", bg: "#FEF2F2",  border: "#FECACA",  defaultW: 18, defaultH: 5 },
  { key: "sealSpace",   label: "校印位置",   labelEn: "Official Seal", icon: <Stamp size={11} />,       color: T.red,    bg: T.redPale,    border: T.redBd,    defaultW: 14, defaultH: 14 },
  { key: "signSpace",   label: "簽名位置",   labelEn: "Signature",     icon: <PenLine size={11} />,     color: "#92400E", bg: T.amberPale, border: T.amberBd,  defaultW: 20, defaultH: 8 },
  { key: "schoolName",  label: "學校名稱",   labelEn: "School Name",   icon: <AlignCenter size={11} />, color: T.text3,  bg: "#F8FAFC",    border: T.border,   defaultW: 34, defaultH: 5 },
];

// ── Placed canvas field ────────────────────────────────────────────────────────
interface PlacedField {
  id: string;
  varKey: string;
  type: PlaceType;
  value?: string;
  src?: string;
  label: string;
  labelEn: string;
  color: string;
  bg: string;
  border: string;
  x: number; // % of canvas
  y: number; // % of canvas
  w: number; // % width
  h: number; // % height
  selected: boolean;
  fontFamily: string;
  fontSize: number;
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
}

const PDF_SAFE_FONTS = [
  { value: "cid0cs", label: "cid0cs (簡體中文)" },
  { value: "cid0ct", label: "cid0ct (繁體中文)" },
  { value: "msungstdlight", label: "MSungStdLight (繁中)" },
  { value: "stsongstdlight", label: "STSongStdLight (簡中)" },
  { value: "helvetica", label: "Helvetica" },
  { value: "times", label: "Times" },
  { value: "courier", label: "Courier" },
] as const;

const DEFAULT_FONT_FAMILY = "cid0cs";
const DEFAULT_FONT_SIZE = 16;

function cssFontFamily(pdfFont: string): string {
  switch (pdfFont) {
    case "helvetica":
      return "Helvetica, Arial, sans-serif";
    case "times":
      return "'Times New Roman', Times, serif";
    case "courier":
      return "'Courier New', Courier, monospace";
    case "msungstdlight":
    case "cid0ct":
      return "'Noto Sans TC', 'PingFang TC', 'Microsoft JhengHei', sans-serif";
    case "stsongstdlight":
    case "cid0cs":
    default:
      return "'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif";
  }
}

function placedFromVar(v: VarField, overrides: Partial<PlacedField> & { id: string; x: number; y: number }): PlacedField {
  return {
    id: overrides.id,
    varKey: v.key,
    type: v.type || "dynamic",
    value: v.value,
    src: v.src,
    label: v.label,
    labelEn: v.labelEn,
    color: v.color,
    bg: v.bg,
    border: v.border,
    x: overrides.x,
    y: overrides.y,
    w: overrides.w ?? v.defaultW,
    h: overrides.h ?? v.defaultH,
    selected: false,
    fontFamily: overrides.fontFamily ?? DEFAULT_FONT_FAMILY,
    fontSize: overrides.fontSize ?? DEFAULT_FONT_SIZE,
    isBold: overrides.isBold ?? false,
    isItalic: overrides.isItalic ?? false,
    isUnderline: overrides.isUnderline ?? false,
  };
}

function placedFromConfig(
  raw: Record<string, unknown>,
  idx: number,
  customList: CertCustomField[],
): PlacedField {
  const varKey = String(raw.name ?? raw.varKey ?? `field_${idx}`);
  const type = (String(raw.type ?? "dynamic") as PlaceType);
  const vd = VAR_FIELDS.find(v => v.key === varKey);
  const cf = customList.find(c => c.field_name === varKey);
  const label = String(raw.label ?? vd?.label ?? cf?.display_label ?? varKey);
  const labelEn = String(raw.labelEn ?? vd?.labelEn ?? cf?.field_name ?? varKey);
  const color = String(raw.color ?? vd?.color ?? (type === "custom" ? "#C026D3" : T.blue));
  const bg = String(raw.bg ?? vd?.bg ?? (type === "custom" ? "#FDF4FF" : T.bluePale));
  const border = String(raw.border ?? vd?.border ?? (type === "custom" ? "#F0ABFC" : T.blueBd));
  const fontSizeRaw = Number(raw.fontSize ?? raw.font_size ?? DEFAULT_FONT_SIZE);

  return {
    id: `p${idx}-${varKey}`,
    varKey,
    type,
    value: raw.value !== undefined ? String(raw.value) : vd?.value,
    src: raw.src !== undefined ? String(raw.src) : vd?.src,
    label,
    labelEn,
    color,
    bg,
    border,
    x: Number(raw.x ?? 20),
    y: Number(raw.y ?? 30),
    w: Number(raw.w ?? vd?.defaultW ?? 20),
    h: Number(raw.h ?? vd?.defaultH ?? 6),
    selected: false,
    fontFamily: String(raw.fontFamily ?? raw.font_family ?? DEFAULT_FONT_FAMILY),
    fontSize: Number.isFinite(fontSizeRaw) && fontSizeRaw > 0 ? fontSizeRaw : DEFAULT_FONT_SIZE,
    isBold: Boolean(raw.isBold ?? raw.bold ?? false),
    isItalic: Boolean(raw.isItalic ?? raw.italic ?? false),
    isUnderline: Boolean(raw.isUnderline ?? raw.underline ?? false),
  };
}

const DEFAULT_PLACED: PlacedField[] = [
  placedFromVar(VAR_FIELDS.find(v => v.key === "studentName")!, { id: "p1", x: 28, y: 49, w: 26, h: 6.5 }),
  placedFromVar(VAR_FIELDS.find(v => v.key === "nameEn")!, { id: "p2", x: 28, y: 57, w: 30, h: 5.5 }),
  placedFromVar(VAR_FIELDS.find(v => v.key === "class")!, { id: "p3", x: 60, y: 49, w: 14, h: 6.5 }),
  placedFromVar(VAR_FIELDS.find(v => v.key === "awardTitle")!, { id: "p4", x: 36, y: 66, w: 28, h: 7.5 }),
  placedFromVar(VAR_FIELDS.find(v => v.key === "date")!, { id: "p5", x: 22, y: 78, w: 20, h: 5 }),
  placedFromVar(VAR_FIELDS.find(v => v.key === "sealSpace")!, { id: "p6", x: 75, y: 74, w: 14, h: 16 }),
  placedFromVar(VAR_FIELDS.find(v => v.key === "signSpace")!, { id: "p7", x: 50, y: 78, w: 22, h: 8 }),
];

// ── Certificate base template (blank, ornamental only) ─────────────────────────
const CertBaseTemplate: React.FC<{
  schoolLogoUrl?: string;
  schoolName?: string;
  principalName?: string;
  principalTitle?: string;
}> = ({
  schoolLogoUrl = "",
  schoolName = "School Talent System",
  principalName = "",
  principalTitle = "校長 Principal",
}) => (
  <svg viewBox="0 0 520 368" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%", display: "block" }}>
    <defs>
      <pattern id="cbt-dots" patternUnits="userSpaceOnUse" width="24" height="24">
        <circle cx="12" cy="12" r="0.9" fill="#D97706" opacity="0.18" />
      </pattern>
      <linearGradient id="cbt-gold" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%"   stopColor="#92400E" />
        <stop offset="40%"  stopColor="#F59E0B" />
        <stop offset="60%"  stopColor="#FDE68A" />
        <stop offset="100%" stopColor="#92400E" />
      </linearGradient>
      <linearGradient id="cbt-header-grad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%"   stopColor="#FFFBEB" />
        <stop offset="100%" stopColor="#FFFDF5" />
      </linearGradient>
      <clipPath id="cbt-logo-clip">
        <circle cx="76" cy="48" r="18" />
      </clipPath>
    </defs>

    {/* Parchment fill */}
    <rect width="520" height="368" fill="#FFFDF5" />
    <rect width="520" height="368" fill="url(#cbt-dots)" />

    {/* Outer gold frame */}
    <rect x="8"  y="8"  width="504" height="352" fill="none" stroke="url(#cbt-gold)" strokeWidth="3.5" rx="4" />
    <rect x="14" y="14" width="492" height="340" fill="none" stroke="#D97706" strokeWidth="0.9" strokeDasharray="8,4" rx="3" />
    <rect x="19" y="19" width="482" height="330" fill="none" stroke="#FCD34D" strokeWidth="0.6" rx="2" />

    {/* Corner rosettes */}
    {([[26,26],[494,26],[26,342],[494,342]] as [number,number][]).map(([cx,cy],i) => (
      <g key={i}>
        <circle cx={cx} cy={cy} r="9"  fill="#FEF3C7" stroke="#D97706" strokeWidth="1" />
        <circle cx={cx} cy={cy} r="5"  fill="#FCD34D" />
        <circle cx={cx} cy={cy} r="2"  fill="#92400E" />
        <line x1={cx-13} y1={cy} x2={cx+13} y2={cy} stroke="#D97706" strokeWidth="0.6" opacity="0.6" />
        <line x1={cx} y1={cy-13} x2={cx} y2={cy+13} stroke="#D97706" strokeWidth="0.6" opacity="0.6" />
      </g>
    ))}

    {/* Top ornamental band */}
    <rect x="26" y="26" width="468" height="44" rx="2" fill="url(#cbt-header-grad)" opacity="0.7" />
    <line x1="26" y1="70" x2="494" y2="70" stroke="url(#cbt-gold)" strokeWidth="1.5" />

    {/* School logo — live upload or dashed placeholder */}
    <circle cx="76" cy="48" r="18" fill="#FFFBEB" stroke="#FCD34D" strokeWidth="1.5" strokeDasharray={schoolLogoUrl ? undefined : "4,2"} />
    {schoolLogoUrl ? (
      <image href={schoolLogoUrl} x="58" y="30" width="36" height="36" clipPath="url(#cbt-logo-clip)" preserveAspectRatio="xMidYMid meet" />
    ) : (
      <text x="76" y="53" textAnchor="middle" fontSize="9" fill="#D97706" fontFamily="system-ui" fontWeight="700">校徽</text>
    )}

    {/* School name area (top center) — from system_settings */}
    <rect x="110" y="32" width="300" height="14" rx="2" fill="#FEF3C7" stroke="#FCD34D" strokeWidth="0.5" opacity="0.8" />
    <text x="260" y="43" textAnchor="middle" fontSize="8.5" fill="#92400E" fontFamily="'PingFang SC',system-ui" fontWeight="600">{schoolName}</text>

    <rect x="110" y="50" width="300" height="11" rx="2" fill="none" stroke="#FDE68A" strokeWidth="0.4" opacity="0.7" />
    <text x="260" y="59" textAnchor="middle" fontSize="7" fill="#B45309" fontFamily="system-ui">香港學生活動成就證書  Hong Kong Student Achievement Certificate</text>

    {/* Center trophy emblem */}
    <circle cx="260" cy="110" r="32" fill="#FFFBEB" stroke="#FCD34D" strokeWidth="2" />
    <circle cx="260" cy="110" r="28" fill="none" stroke="#FEF3C7" strokeWidth="1" strokeDasharray="3,2" />
    <text x="260" y="120" textAnchor="middle" fontSize="30" fontFamily="system-ui">🏅</text>

    {/* Certificate title line */}
    <text x="260" y="158" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1E293B" fontFamily="'PingFang SC',system-ui" letterSpacing="2">成 就 證 書  Certificate of Achievement</text>

    {/* Decorative horizontal rule */}
    <line x1="80" y1="168" x2="440" y2="168" stroke="url(#cbt-gold)" strokeWidth="1.2" />
    <circle cx="260" cy="168" r="3" fill="#D97706" />
    <circle cx="190" cy="168" r="1.5" fill="#FCD34D" opacity="0.7" />
    <circle cx="330" cy="168" r="1.5" fill="#FCD34D" opacity="0.7" />

    {/* "This is to certify" intro text */}
    <text x="260" y="186" textAnchor="middle" fontSize="9" fill="#64748B" fontFamily="system-ui" fontStyle="italic">茲證明  This is to certify that</text>

    {/* Data region hint lines (very faint, under ghost boxes) */}
    <line x1="140" y1="204" x2="380" y2="204" stroke="#E2E8F0" strokeWidth="0.8" strokeDasharray="3,3" opacity="0.6" />
    <line x1="140" y1="224" x2="380" y2="224" stroke="#E2E8F0" strokeWidth="0.8" strokeDasharray="3,3" opacity="0.6" />
    <line x1="140" y1="244" x2="380" y2="244" stroke="#E2E8F0" strokeWidth="0.8" strokeDasharray="3,3" opacity="0.6" />

    {/* "has achieved" connector */}
    <text x="260" y="270" textAnchor="middle" fontSize="8.5" fill="#64748B" fontFamily="system-ui" fontStyle="italic">在以下比賽 / 活動中取得  in the event / competition:</text>
    <line x1="100" y1="276" x2="420" y2="276" stroke="#E2E8F0" strokeWidth="0.8" strokeDasharray="3,3" opacity="0.6" />

    {/* Bottom rule */}
    <line x1="80" y1="300" x2="440" y2="300" stroke="url(#cbt-gold)" strokeWidth="1" />
    <circle cx="260" cy="300" r="2.5" fill="#FCD34D" />

    {/* Signature / seal area — principal from system_settings */}
    <line x1="110" y1="328" x2="210" y2="328" stroke="#CBD5E1" strokeWidth="0.8" />
    {principalName ? (
      <text x="160" y="322" textAnchor="middle" fontSize="8" fill="#1E293B" fontFamily="'PingFang SC',system-ui" fontWeight="600">{principalName}</text>
    ) : null}
    <text x="160" y="336" textAnchor="middle" fontSize="7" fill="#94A3B8" fontFamily="system-ui">{principalTitle || "Principal / 校長"}</text>

    <line x1="310" y1="328" x2="410" y2="328" stroke="#CBD5E1" strokeWidth="0.8" />
    <text x="360" y="336" textAnchor="middle" fontSize="7" fill="#94A3B8" fontFamily="system-ui">Date / 日期</text>

    {/* Document watermark */}
    <text x="38" y="355" fontSize="7" fill="#94A3B8" fontFamily="monospace" opacity="0.5">TEMPLATE · PREVIEW ONLY</text>
    <text x="482" y="355" textAnchor="end" fontSize="7" fill="#94A3B8" fontFamily="monospace" opacity="0.5">DOC-2026-BULK-XXX</text>
  </svg>
);

// ── Class palette ──────────────────────────────────────────────────────────────
const CLASS_PAL: Record<string, { bg: string; color: string; bd: string }> = {
  F1A: { bg: "#DBEAFE", color: "#1D4ED8", bd: "#BFDBFE" },
  F1B: { bg: "#E0E7FF", color: "#4338CA", bd: "#C7D2FE" },
  F2A: { bg: "#D1FAE5", color: "#065F46", bd: "#6EE7B7" },
  F2B: { bg: "#FCE7F3", color: "#9D174D", bd: "#FBCFE8" },
  F3A: { bg: "#FFEDD5", color: "#9A3412", bd: "#FED7AA" },
  F3B: { bg: "#FEF3C7", color: "#92400E", bd: "#FDE68A" },
};

// ── Main component ─────────────────────────────────────────────────────────────
export const Screen_BulkGroupAward: React.FC<ScreenBulkGroupAwardProps> = ({
  onBack,
  activities = [],
  studentsUrlBase = "/certificates/activity-students",
  generatePdfUrl = "/certificates/generate-pdf",
  customFieldsUrl = "/certificates/custom-fields",
  schoolLogoUrl = "",
  schoolLogoPath = "",
  principalName = "",
  principalTitle = "校長 Principal",
  schoolName = "School Talent System",
  signatureLine = "_______________________",
  customFields: customFieldsProp = [],
  templateId = null,
  templateTitle: templateTitleProp = "",
  saveTemplateUrl = "",
  bgImageUrl = "",
  initialConfig = null,
  flashSuccess,
  flashError,
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [templateTitle, setTemplateTitle] = useState(templateTitleProp || "證書範本");
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(flashSuccess || flashError || null);
  const configHydrated = useRef(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 900);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Event linkage + dropdown filters
  const [activityId, setActivityId] = useState<number | null>(activities[0]?.id ?? null);
  const [eventDropOpen, setEventDropOpen] = useState(false);
  const [activitySearch, setActivitySearch] = useState("");
  const [activityYear, setActivityYear] = useState("");
  const [activityMonth, setActivityMonth] = useState("");
  const linkedEvent = activities.find(a => a.id === activityId)?.label
    ?? (activities.length === 0 ? "尚無活動 — 請先建立活動" : "選擇活動…");

  const academicYears = Array.from(new Set(
    activities.map(a => (a.academic_year || "").trim()).filter(Boolean)
  )).sort((a, b) => b.localeCompare(a));

  const monthOptions = Array.from(new Set(
    activities
      .map(a => (a.start_date || "").slice(0, 7))
      .filter(m => /^\d{4}-\d{2}$/.test(m))
  )).sort((a, b) => b.localeCompare(a));

  const filteredActivities = activities.filter(a => {
    const q = activitySearch.trim().toLowerCase();
    const nameHay = `${a.name_zh_hk || ""} ${a.name_en || ""} ${a.label || ""}`.toLowerCase();
    if (q && !nameHay.includes(q)) return false;
    if (activityYear && (a.academic_year || "") !== activityYear) return false;
    const month = (a.start_date || "").slice(0, 7);
    if (activityMonth && month !== activityMonth) return false;
    return true;
  });

  const formatActivityDate = (startDate?: string, year?: string) => {
    const d = (startDate || "").trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(d)) return d.slice(0, 10);
    if ((year || "").trim()) return year!.trim();
    return "";
  };

  // Template (optional custom background → base64 for PDF)
  const [templateUploaded, setTemplateUploaded] = useState(true); // built-in SVG preview is fine
  const [templateBg, setTemplateBg] = useState<string>("");
  const [tmplDragOver, setTmplDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Canvas fields
  const [placedFields, setPlacedFields] = useState<PlacedField[]>(DEFAULT_PLACED);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [customFields, setCustomFields] = useState<CertCustomField[]>(() => [...customFieldsProp]);
  const [addingCustom, setAddingCustom] = useState(false);

  // Drag / resize state
  const canvasRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<{ id: string; startMouseX: number; startMouseY: number; startFieldX: number; startFieldY: number } | null>(null);
  const resizingRef = useRef<{ id: string; startMouseX: number; startMouseY: number; startW: number; startH: number } | null>(null);

  const getVarDef = (key: string) => VAR_FIELDS.find(v => v.key === key);

  useEffect(() => {
    if (configHydrated.current) return;
    configHydrated.current = true;
    if (!initialConfig && !bgImageUrl && !templateId) return;

    if (initialConfig?.activityId) {
      setActivityId(Number(initialConfig.activityId));
    }
    if (initialConfig?.awardTitle) {
      setAwardTitle(String(initialConfig.awardTitle));
    }
    if (initialConfig?.issueDate) {
      setIssueDate(String(initialConfig.issueDate));
    }

    const bg = bgImageUrl || (initialConfig?.templateBg ? String(initialConfig.templateBg) : "");
    if (bg) {
      setTemplateBg(bg);
      setTemplateUploaded(true);
    }

    const saved = initialConfig?.fields;
    if (Array.isArray(saved) && saved.length > 0) {
      setPlacedFields(saved.map((f, i) => placedFromConfig(f, i, customFieldsProp)));
    } else if (templateId) {
      setPlacedFields([]);
    }
  }, [initialConfig, bgImageUrl, templateId, customFieldsProp]);

  const buildPdfFields = () => placedFields.map(f => {
    const style = {
      fontFamily: f.fontFamily || DEFAULT_FONT_FAMILY,
      fontSize: f.fontSize || DEFAULT_FONT_SIZE,
      isBold: !!f.isBold,
      isItalic: !!f.isItalic,
      isUnderline: !!f.isUnderline,
    };
    if (f.type === "image") {
      return {
        type: "image",
        name: f.varKey,
        src: f.src || f.value || schoolLogoUrl || "",
        x: f.x,
        y: f.y,
        w: f.w,
        h: f.h,
        ...style,
      };
    }
    if (f.type === "static_text" || f.type === "custom") {
      return {
        type: f.type,
        name: f.varKey,
        value: f.value ?? "",
        x: f.x,
        y: f.y,
        w: f.w,
        h: f.h,
        ...style,
      };
    }
    return {
      type: "dynamic",
      name: f.varKey,
      x: f.x,
      y: f.y,
      w: f.w,
      h: f.h,
      ...style,
    };
  });

  const selectedField = placedFields.find(f => f.id === selectedFieldId) ?? null;

  const patchSelectedStyle = (patch: Partial<Pick<PlacedField, "fontFamily" | "fontSize" | "isBold" | "isItalic" | "isUnderline">>) => {
    if (!selectedFieldId) return;
    setPlacedFields(prev => prev.map(f => f.id === selectedFieldId ? { ...f, ...patch } : f));
  };

  const handleSaveTemplate = async () => {
    if (!saveTemplateUrl) return;
    setSavingTemplate(true);
    setSaveMsg(null);
    try {
      const res = await fetch(saveTemplateUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({
          title: templateTitle,
          activity_id: activityId,
          award_title: awardTitle,
          issue_date: issueDate,
          template_bg: templateBg || undefined,
          fields: buildPdfFields(),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        throw new Error(json?.message || `儲存失敗 (${res.status})`);
      }
      setSaveMsg(json.message || "範本已儲存");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "儲存失敗";
      setSaveMsg(msg);
    } finally {
      setSavingTemplate(false);
    }
  };

  const addFieldToCanvas = (varDef: VarField, allowDuplicate = false) => {
    const alreadyPlaced = placedFields.some(f => f.varKey === varDef.key);
    if (alreadyPlaced && !allowDuplicate) return;
    const newField = placedFromVar(varDef, {
      id: `p${Date.now()}`,
      x: 20 + Math.random() * 40,
      y: 30 + Math.random() * 30,
      w: varDef.defaultW,
      h: varDef.defaultH,
    });
    setPlacedFields(prev => [...prev, newField]);
    setSelectedFieldId(newField.id);
  };

  const staticAssets: VarField[] = [
    ...(schoolLogoUrl
      ? [{
          key: "schoolLogo",
          label: "學校 Logo",
          labelEn: "School Logo",
          icon: <ImageIcon size={11} />,
          color: "#0F766E",
          bg: "#F0FDFA",
          border: "#99F6E4",
          defaultW: 12,
          defaultH: 14,
          type: "image" as const,
          src: schoolLogoUrl,
          value: schoolLogoPath || schoolLogoUrl,
        }]
      : []),
    {
      key: "signatureLine",
      label: "簽名橫線",
      labelEn: "Signature Line",
      icon: <Minus size={11} />,
      color: "#92400E",
      bg: T.amberPale,
      border: T.amberBd,
      defaultW: 22,
      defaultH: 5,
      type: "static_text",
      value: signatureLine || "_______________________",
    },
    {
      key: "principalNameStatic",
      label: "校長姓名",
      labelEn: "Principal Name",
      icon: <User size={11} />,
      color: "#1D4ED8",
      bg: T.bluePale,
      border: T.blueBd,
      defaultW: 24,
      defaultH: 5,
      type: "static_text",
      value: principalName || "Principal Name",
    },
    {
      key: "principalTitleStatic",
      label: "校長職銜",
      labelEn: "Principal Title",
      icon: <Tag size={11} />,
      color: "#7C3AED",
      bg: T.purplePale,
      border: T.purpleBd,
      defaultW: 20,
      defaultH: 5,
      type: "static_text",
      value: principalTitle || "Principal Title",
    },
  ];

  const handleAddCustomField = async () => {
    const label = window.prompt("新增自訂欄位標籤 (Display Label)：", "自訂備註");
    if (!label || !label.trim()) return;
    setAddingCustom(true);
    try {
      const res = await fetch(customFieldsUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({ display_label: label.trim() }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok || !json?.field) {
        window.alert(json?.message || "新增欄位失敗");
        return;
      }
      const field: CertCustomField = {
        id: Number(json.field.id),
        field_name: String(json.field.field_name),
        display_label: String(json.field.display_label),
      };
      setCustomFields(prev => [...prev, field]);
      addFieldToCanvas({
        key: field.field_name,
        label: field.display_label,
        labelEn: field.field_name,
        icon: <Sparkles size={11} />,
        color: "#C026D3",
        bg: "#FDF4FF",
        border: "#F0ABFC",
        defaultW: 28,
        defaultH: 6,
        type: "custom",
        value: field.display_label,
      }, true);
    } catch {
      window.alert("網絡錯誤，無法新增欄位");
    } finally {
      setAddingCustom(false);
    }
  };

  const removeField = (id: string) => {
    setPlacedFields(prev => prev.filter(f => f.id !== id));
    if (selectedFieldId === id) setSelectedFieldId(null);
  };

  const resetCanvas = () => {
    setPlacedFields(DEFAULT_PLACED);
    setSelectedFieldId(null);
  };

  const readFileAsDataUrl = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setTemplateBg(result);
      setTemplateUploaded(true);
    };
    reader.readAsDataURL(file);
  };

  // Mouse-based drag / resize on canvas ghost boxes
  const handleFieldPointerDown = useCallback((e: React.PointerEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedFieldId(id);
    const field = placedFields.find(f => f.id === id);
    if (!field || !canvasRef.current) return;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    draggingRef.current = {
      id,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startFieldX: field.x,
      startFieldY: field.y,
    };
  }, [placedFields]);

  const handleResizePointerDown = useCallback((e: React.PointerEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedFieldId(id);
    const field = placedFields.find(f => f.id === id);
    if (!field) return;
    resizingRef.current = {
      id,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startW: field.w,
      startH: field.h,
    };
  }, [placedFields]);

  const handleCanvasPointerMove = useCallback((e: React.PointerEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    if (resizingRef.current) {
      const { id, startMouseX, startMouseY, startW, startH } = resizingRef.current;
      const dw = ((e.clientX - startMouseX) / rect.width) * 100;
      const dh = ((e.clientY - startMouseY) / rect.height) * 100;
      setPlacedFields(prev => prev.map(f => {
        if (f.id !== id) return f;
        const minW = f.type === "image" ? 4 : 8;
        const minH = f.type === "image" ? 4 : 3;
        return {
          ...f,
          w: Math.max(minW, Math.min(100 - f.x, startW + dw)),
          h: Math.max(minH, Math.min(100 - f.y, startH + dh)),
        };
      }));
      return;
    }
    if (!draggingRef.current) return;
    const { id, startMouseX, startMouseY, startFieldX, startFieldY } = draggingRef.current;
    const dx = ((e.clientX - startMouseX) / rect.width) * 100;
    const dy = ((e.clientY - startMouseY) / rect.height) * 100;
    setPlacedFields(prev => prev.map(f => f.id === id
      ? { ...f, x: Math.max(0, Math.min(100 - f.w, startFieldX + dx)), y: Math.max(0, Math.min(100 - f.h, startFieldY + dy)) }
      : f
    ));
  }, []);

  const handleCanvasPointerUp = useCallback(() => {
    draggingRef.current = null;
    resizingRef.current = null;
  }, []);

  // Students (loaded via AJAX when activity changes)
  const [students, setStudents] = useState<CertStudentRow[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [awardTitle, setAwardTitle] = useState("成就證書 Certificate of Achievement");
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [genError, setGenError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  useEffect(() => {
    if (activityId == null) {
      setStudents([]);
      setSelectedStudents(new Set());
      return;
    }
    let cancelled = false;
    setStudentsLoading(true);
    fetch(`${studentsUrlBase.replace(/\/$/, "")}/${activityId}`, {
      headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
    })
      .then(r => r.json())
      .then((data) => {
        if (cancelled) return;
        const rows: CertStudentRow[] = Array.isArray(data?.students)
          ? data.students.map((s: any) => ({
              id: String(s.id),
              name: String(s.name || s.name_zh_hk || s.nameEn || ""),
              nameEn: String(s.nameEn || s.name_en || ""),
              cls: String(s.cls || s.class_name || "—"),
            }))
          : [];
        setStudents(rows);
        setSelectedStudents(new Set(rows.map(s => s.id)));
      })
      .catch(() => {
        if (!cancelled) {
          setStudents([]);
          setSelectedStudents(new Set());
        }
      })
      .finally(() => { if (!cancelled) setStudentsLoading(false); });
    return () => { cancelled = true; };
  }, [activityId, studentsUrlBase]);

  // Generation
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const handleGenerate = async () => {
    if (activityId == null || selectedStudents.size === 0 || placedFields.length === 0) return;
    setGenerating(true);
    setGenError(null);
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    }
    try {
      const res = await fetch(generatePdfUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/pdf, application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({
          activity_id: activityId,
          selected_student_ids: Array.from(selectedStudents).map(id => Number(id)),
          award_title: awardTitle,
          issue_date: issueDate,
          school_name: schoolName || undefined,
          principal_name: principalName || undefined,
          principal_title: principalTitle || undefined,
          // Prefer data:/relative; strip origin from absolute URLs so PHP can map to FCPATH
          template_bg: (() => {
            const bg = (templateBg || "").trim();
            if (!bg) return undefined;
            if (bg.startsWith("data:")) return bg;
            try {
              if (/^https?:\/\//i.test(bg)) {
                const u = new URL(bg);
                return u.pathname.replace(/^\/+/, "");
              }
            } catch { /* ignore */ }
            return bg.replace(/^\/+/, "");
          })(),
          fields: buildPdfFields(),
        }),
      });
      const ctype = res.headers.get("Content-Type") || "";
      if (!res.ok || !ctype.includes("pdf")) {
        let msg = `生成失敗 (${res.status})`;
        try {
          const err = await res.json();
          if (err?.message) msg = String(err.message);
        } catch { /* ignore */ }
        throw new Error(msg);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setGenerated(true);
      // Auto-download
      const a = document.createElement("a");
      a.href = url;
      a.download = "bulk_certificates.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e: any) {
      setGenError(e?.message || "PDF 生成失敗");
    } finally {
      setGenerating(false);
    }
  };

  const F = T.font;
  const selectedCount = selectedStudents.size;

  // ── Success screen ────────────────────────────────────────────────────────────
  if (generated) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100%", background: T.bg, fontFamily: F, padding: 24 }}>
        <div style={{ background: T.surface, borderRadius: T.radiusXl, padding: "40px 48px", boxShadow: T.shadowMd, textAlign: "center", maxWidth: 480, width: "100%", border: `1px solid ${T.emeraldBd}` }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🎓</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: T.text1, marginBottom: 8 }}>批量生成完成！</div>
          <div style={{ fontSize: 13, color: T.text3, lineHeight: 1.8, marginBottom: 24 }}>
            已成功生成 <strong style={{ color: T.emerald }}>{selectedCount} 份個人化證書</strong>，<br />
            系統已自動映射學生姓名並保留校印 / 簽名位置。<br />
            <span style={{ color: T.text4, fontSize: 11 }}>System mapped all names and preserved seal/signature zones.</span>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginBottom: 24 }}>
            <button
              onClick={() => { if (downloadUrl) window.open(downloadUrl, "_blank"); }}
              disabled={!downloadUrl}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", border: `1px solid ${T.border}`, borderRadius: T.radius, background: T.surface, color: T.blue, fontSize: 13, fontWeight: 600, cursor: downloadUrl ? "pointer" : "not-allowed", fontFamily: F, opacity: downloadUrl ? 1 : 0.5 }}
            >
              <Eye size={14} /> 預覽 PDF
            </button>
            <a
              href={downloadUrl || "#"}
              download="bulk_certificates.pdf"
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", border: `1px solid ${T.border}`, borderRadius: T.radius, background: T.surface, color: T.emerald, fontSize: 13, fontWeight: 600, textDecoration: "none", fontFamily: F, pointerEvents: downloadUrl ? "auto" : "none", opacity: downloadUrl ? 1 : 0.5 }}
            >
              <Download size={14} /> 下載 PDF
            </a>
            <button
              onClick={() => { if (downloadUrl) { const w = window.open(downloadUrl); w?.print(); } }}
              disabled={!downloadUrl}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", border: `1px solid ${T.border}`, borderRadius: T.radius, background: T.surface, color: T.text2, fontSize: 13, fontWeight: 600, cursor: downloadUrl ? "pointer" : "not-allowed", fontFamily: F, opacity: downloadUrl ? 1 : 0.5 }}
            >
              <Printer size={14} /> 列印
            </button>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => { setGenerated(false); setGenError(null); }} style={{ background: "none", color: T.text3, border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 13, fontWeight: 600, padding: "11px 20px", cursor: "pointer", fontFamily: F }}>
              繼續編輯
            </button>
            <button onClick={onBack} style={{ background: T.blue, color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, padding: "11px 28px", cursor: "pointer", fontFamily: F }}>
              返回成就管理
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: isMobile ? "auto" : "100%", minHeight: isMobile ? "100%" : undefined, background: T.bg, fontFamily: F, overflow: isMobile ? "visible" : "hidden" }}>

      {/* ════════════════════════════════════════════════════════════════════
          HEADER
      ════════════════════════════════════════════════════════════════════ */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: `0 ${isMobile ? "16px" : "24px"}`, flexShrink: 0 }}>
        {/* Nav row */}
        <div style={{ height: 48, display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${T.border}` }}>
          <button onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "none", border: `1px solid ${T.border}`, borderRadius: 8, padding: "5px 11px", cursor: "pointer", fontSize: 12, fontWeight: 600, color: T.text3, fontFamily: F }}>
            <ArrowLeft size={13} /> 返回
          </button>
          {!isMobile && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
              <span style={{ color: T.text4 }}>成就與證書</span>
              <ChevronRight size={13} color={T.text4} />
              <span style={{ color: T.text4 }}>批量工具</span>
              <ChevronRight size={13} color={T.text4} />
              <span style={{ fontWeight: 700, color: T.text2 }}>證書批量建立 / 生成</span>
            </div>
          )}
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", background: T.amberPale, color: T.amber, border: `1px solid ${T.amberBd}`, borderRadius: 5 }}>1.D.4B · BULK-GEN</span>
          </div>
        </div>

        {/* Title row */}
        <div style={{ minHeight: 56, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", paddingBottom: 8 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg, #7C3AED, #A855F7)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Layers size={17} color="#fff" />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 11, color: T.text3, marginBottom: 4 }}>
              {templateId ? "證書範本編輯 Certificate Template Editor" : "證書批量建立 / 生成"}
            </div>
            {templateId ? (
              <input
                type="text"
                name="title"
                value={templateTitle}
                onChange={e => setTemplateTitle(e.target.value)}
                placeholder="範本名稱 Template Title"
                style={{
                  width: "100%", maxWidth: 480, boxSizing: "border-box",
                  padding: "8px 12px", fontSize: 15, fontWeight: 700,
                  border: `1px solid ${T.border}`, borderRadius: 8,
                  fontFamily: F, color: T.text1,
                }}
              />
            ) : (
              <div style={{ fontSize: 16, fontWeight: 800, color: T.text1, letterSpacing: "-0.3px" }}>
                證書批量建立 / 生成
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          EVENT LINK BANNER — prominent context bar above the editor
      ════════════════════════════════════════════════════════════════════ */}
      <div style={{
        background: "linear-gradient(135deg, #3730A3, #7C3AED)",
        borderBottom: "1px solid #4C1D95",
        padding: isMobile ? "10px 16px" : "12px 24px",
        display: "flex", alignItems: "center", gap: 14, flexShrink: 0,
        flexWrap: "wrap",
      }}>
        {/* Label */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Layers size={14} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.6)", letterSpacing: "0.07em", textTransform: "uppercase", lineHeight: 1 }}>關聯活動 / 比賽</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.45)", lineHeight: 1.2 }}>Link to Event / Competition</div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 32, background: "rgba(255,255,255,0.2)", flexShrink: 0 }} />

        {/* Dropdown trigger — prominent */}
        <div style={{ position: "relative", flex: 1, minWidth: 280, maxWidth: 560 }}>
          <button
            onClick={() => setEventDropOpen(v => !v)}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10,
              padding: "9px 14px",
              background: "rgba(255,255,255,0.12)",
              border: `1.5px solid ${eventDropOpen ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.3)"}`,
              borderRadius: 10, cursor: "pointer", fontFamily: F,
              color: "#fff", fontSize: 13, fontWeight: 700,
              transition: "all 0.15s",
            }}
          >
            <CheckCircle2 size={14} color="#A5F3FC" style={{ flexShrink: 0 }} />
            <span style={{ flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {linkedEvent}
            </span>
            <ChevronDown size={14} color="rgba(255,255,255,0.7)" style={{ flexShrink: 0, transform: eventDropOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
          </button>

          {eventDropOpen && (
            <>
              <div onClick={() => setEventDropOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 199 }} />
              <div style={{
                position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
                background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radiusLg,
                boxShadow: T.shadowMd, zIndex: 200, overflow: "hidden",
                display: "flex", flexDirection: "column", maxHeight: 380,
              }}>
                {/* Sticky filter header */}
                <div
                  className="dropdown-filter-header"
                  style={{
                    position: "sticky", top: 0, zIndex: 2, flexShrink: 0,
                    padding: 12, borderBottom: `1px solid ${T.border}`, background: "#F8FAFC",
                    display: "flex", flexDirection: "column", gap: 8,
                  }}
                  onClick={e => e.stopPropagation()}
                  onPointerDown={e => e.stopPropagation()}
                >
                  <div style={{ position: "relative" }}>
                    <Search size={13} color={T.text4} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                    <input
                      id="certActivitySearch"
                      type="text"
                      value={activitySearch}
                      onChange={e => setActivitySearch(e.target.value)}
                      placeholder="搜尋活動名稱 (Search events…)"
                      style={{
                        width: "100%", boxSizing: "border-box",
                        padding: "8px 10px 8px 30px",
                        border: `1px solid ${T.border}`, borderRadius: 8,
                        fontSize: 12.5, fontFamily: F, color: T.text1, outline: "none",
                        background: "#fff",
                      }}
                    />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <select
                      id="certActivityYear"
                      value={activityYear}
                      onChange={e => setActivityYear(e.target.value)}
                      style={{
                        width: "100%", padding: "7px 8px", border: `1px solid ${T.border}`,
                        borderRadius: 8, fontSize: 12, fontFamily: F, color: T.text2,
                        background: "#fff", outline: "none",
                      }}
                    >
                      <option value="">全部學年 (All years)</option>
                      {academicYears.map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                    <select
                      id="certActivityMonth"
                      value={activityMonth}
                      onChange={e => setActivityMonth(e.target.value)}
                      style={{
                        width: "100%", padding: "7px 8px", border: `1px solid ${T.border}`,
                        borderRadius: 8, fontSize: 12, fontFamily: F, color: T.text2,
                        background: "#fff", outline: "none",
                      }}
                    >
                      <option value="">全部月份 (All)</option>
                      {monthOptions.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Filtered activity list */}
                <div style={{ overflowY: "auto", flex: 1, minHeight: 0 }}>
                  {activities.length === 0 && (
                    <div style={{ padding: "14px 16px", fontSize: 12, color: T.text3 }}>尚無活動資料</div>
                  )}
                  {activities.length > 0 && filteredActivities.length === 0 && (
                    <div style={{ padding: "18px 16px", fontSize: 12, color: T.text4, textAlign: "center" }}>
                      無符合結果 (No results found)
                    </div>
                  )}
                  {filteredActivities.map(ev => {
                    const dateLabel = formatActivityDate(ev.start_date, ev.academic_year);
                    return (
                      <button
                        key={ev.id}
                        type="button"
                        className="activity-option-item"
                        data-name={`${(ev.name_zh_hk || "").toLowerCase()} ${(ev.name_en || "").toLowerCase()}`}
                        data-month={(ev.start_date || "").slice(0, 7)}
                        data-year={ev.academic_year || ""}
                        onClick={() => { setActivityId(ev.id); setEventDropOpen(false); setGenerated(false); }}
                        style={{
                          width: "100%", textAlign: "left", padding: "11px 16px",
                          border: "none", borderBottom: `1px solid ${T.border}`,
                          background: ev.id === activityId ? T.purplePale : "transparent",
                          color: ev.id === activityId ? T.purple : T.text2,
                          fontSize: 13, fontWeight: ev.id === activityId ? 700 : 400,
                          cursor: "pointer", fontFamily: F,
                          display: "flex", alignItems: "center", gap: 10,
                        }}
                      >
                        {ev.id === activityId
                          ? <CheckCircle2 size={13} color={T.purple} style={{ flexShrink: 0 }} />
                          : <div style={{ width: 13, height: 13, borderRadius: "50%", border: `1.5px solid ${T.border}`, flexShrink: 0 }} />
                        }
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.label}</span>
                          {dateLabel !== "" && (
                            <span style={{ display: "block", fontSize: 10.5, fontWeight: 600, color: T.text4, marginTop: 2 }}>
                              {dateLabel}{ev.academic_year && dateLabel !== ev.academic_year ? ` · ${ev.academic_year}` : ""}
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Pill count */}
        <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 999, fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>
          <Users size={11} color="rgba(255,255,255,0.7)" />
          <span>{studentsLoading ? "載入中…" : `${selectedCount} 位學生將生成證書`}</span>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          MAIN BODY — 3-column editor layout
      ════════════════════════════════════════════════════════════════════ */}
      <div style={{
        flex: 1, display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "200px 1fr 268px",
        overflow: isMobile ? "visible" : "hidden",
        minHeight: 0,
      }}>

        {/* ── LEFT: Variable Field Palette ──────────────────────────────────── */}
        <div style={{
          background: T.surface, borderRight: isMobile ? "none" : `1px solid ${T.border}`,
          borderBottom: isMobile ? `1px solid ${T.border}` : "none",
          display: "flex", flexDirection: "column", overflow: "hidden",
          flexShrink: 0,
        }}>
          {/* Palette header */}
          <div style={{ padding: "12px 14px 8px", borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: T.text4, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              動態欄位 · Variables
            </div>
            <div style={{ fontSize: 10.5, color: T.text4, marginTop: 2 }}>點擊 → 放置於底圖</div>
          </div>

          {/* Field chips */}
          <div style={{ flex: 1, overflowY: "auto", padding: "10px 10px 14px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {VAR_FIELDS.map(v => {
                const isPlaced = placedFields.some(f => f.varKey === v.key);
                return (
                  <button
                    key={v.key}
                    onClick={() => addFieldToCanvas(v)}
                    disabled={isPlaced}
                    title={isPlaced ? "已放置於底圖" : `點擊放置 [${v.labelEn}]`}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "7px 10px",
                      border: `1.5px ${isPlaced ? "solid" : "dashed"} ${v.border}`,
                      borderRadius: 8,
                      background: isPlaced ? v.bg : "transparent",
                      color: v.color, cursor: isPlaced ? "default" : "pointer",
                      fontFamily: F, fontSize: 11.5, fontWeight: 600,
                      opacity: isPlaced ? 0.6 : 1,
                      textAlign: "left",
                      transition: "all 0.12s",
                      position: "relative",
                    }}
                  >
                    <span style={{ flexShrink: 0, opacity: 0.8 }}>{v.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: v.color }}>{v.label}</div>
                      <div style={{ fontSize: 9.5, color: T.text4 }}>{v.labelEn}</div>
                    </div>
                    {isPlaced ? <CheckCircle2 size={11} color={v.color} style={{ flexShrink: 0 }} /> : <Plus size={11} color={v.color} style={{ flexShrink: 0, opacity: 0.6 }} />}
                  </button>
                );
              })}
            </div>

            {/* Static assets from system_settings */}
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: T.text4, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>
                靜態資產 · Static Assets
              </div>
              <div style={{ fontSize: 10, color: T.text4, marginBottom: 8 }}>來自系統設定 · System Settings</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {staticAssets.map(v => {
                  const isPlaced = placedFields.some(f => f.varKey === v.key);
                  return (
                    <button
                      key={v.key}
                      type="button"
                      onClick={() => addFieldToCanvas(v)}
                      disabled={isPlaced}
                      title={isPlaced ? "已放置" : `放置 ${v.label}`}
                      style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "7px 10px",
                        border: `1.5px ${isPlaced ? "solid" : "dashed"} ${v.border}`,
                        borderRadius: 8,
                        background: isPlaced ? v.bg : "transparent",
                        color: v.color, cursor: isPlaced ? "default" : "pointer",
                        fontFamily: F, fontSize: 11.5, fontWeight: 600,
                        opacity: isPlaced ? 0.6 : 1, textAlign: "left",
                      }}
                    >
                      <span style={{ flexShrink: 0 }}>{v.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11.5, fontWeight: 700 }}>{v.type === "image" ? "🏫 " : v.key === "signatureLine" ? "✍️ " : v.key.includes("Title") ? "🏷️ " : "👤 "}{v.label}</div>
                        <div style={{ fontSize: 9.5, color: T.text4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {v.type === "image" ? "image" : (v.value || v.labelEn)}
                        </div>
                      </div>
                      {isPlaced ? <CheckCircle2 size={11} /> : <Plus size={11} style={{ opacity: 0.6 }} />}
                    </button>
                  );
                })}
                {!schoolLogoUrl && (
                  <div style={{ fontSize: 10, color: T.text4, padding: "6px 4px", lineHeight: 1.5 }}>
                    尚未上載校徽 — 請至 <a href="/settings" style={{ color: T.blue }}>系統設定</a> 上傳。
                  </div>
                )}
              </div>
            </div>

            {/* Custom variables */}
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: T.text4, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>
                自訂欄位 · Custom Variables
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {customFields.map(cf => {
                  const isPlaced = placedFields.some(f => f.varKey === cf.field_name);
                  const v: VarField = {
                    key: cf.field_name,
                    label: cf.display_label,
                    labelEn: cf.field_name,
                    icon: <Sparkles size={11} />,
                    color: "#C026D3",
                    bg: "#FDF4FF",
                    border: "#F0ABFC",
                    defaultW: 28,
                    defaultH: 6,
                    type: "custom",
                    value: cf.display_label,
                  };
                  return (
                    <button
                      key={cf.id}
                      type="button"
                      onClick={() => addFieldToCanvas(v)}
                      disabled={isPlaced}
                      style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "7px 10px",
                        border: `1.5px ${isPlaced ? "solid" : "dashed"} ${v.border}`,
                        borderRadius: 8,
                        background: isPlaced ? v.bg : "transparent",
                        color: v.color, cursor: isPlaced ? "default" : "pointer",
                        fontFamily: F, fontSize: 11.5, fontWeight: 600,
                        opacity: isPlaced ? 0.6 : 1, textAlign: "left",
                      }}
                    >
                      <span style={{ flexShrink: 0 }}>{v.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11.5, fontWeight: 700 }}>{cf.display_label}</div>
                        <div style={{ fontSize: 9.5, color: T.text4 }}>{cf.field_name}</div>
                      </div>
                      {isPlaced ? <CheckCircle2 size={11} /> : <Plus size={11} style={{ opacity: 0.6 }} />}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => { void handleAddCustomField(); }}
                  disabled={addingCustom}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    marginTop: 4, padding: "8px 10px",
                    border: `1.5px dashed ${T.purpleBd}`, borderRadius: 8,
                    background: T.purplePale, color: T.purple,
                    cursor: addingCustom ? "wait" : "pointer",
                    fontFamily: F, fontSize: 11.5, fontWeight: 700,
                  }}
                >
                  <Plus size={12} /> {addingCustom ? "儲存中…" : "➕ 新增欄位 Add Custom Field"}
                </button>
              </div>
            </div>
          </div>

          {/* Font / style controls */}
          <div style={{ borderTop: `1px solid ${T.border}`, padding: "10px 12px", flexShrink: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.text4, letterSpacing: "0.05em", marginBottom: 8 }}>STYLE</div>
            {!selectedField || selectedField.type === "image" ? (
              <div style={{ fontSize: 11, color: T.text4, lineHeight: 1.5 }}>
                選取畫布上的文字欄位以調整字體樣式
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                <div>
                  <div style={{ fontSize: 10, color: T.text4, marginBottom: 3 }}>字體 Font Family</div>
                  <div style={{ position: "relative" }}>
                    <select
                      value={selectedField.fontFamily || DEFAULT_FONT_FAMILY}
                      onChange={e => patchSelectedStyle({ fontFamily: e.target.value })}
                      style={{ width: "100%", padding: "5px 24px 5px 8px", fontSize: 11, border: `1px solid ${T.border}`, borderRadius: 6, fontFamily: F, color: T.text2, background: T.surface, appearance: "none", cursor: "pointer", outline: "none" }}
                    >
                      {PDF_SAFE_FONTS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <ChevronDown size={11} color={T.text4} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: T.text4, marginBottom: 3 }}>字級 Font Size (pt)</div>
                  <input
                    type="number"
                    min={8}
                    max={72}
                    step={1}
                    value={selectedField.fontSize || DEFAULT_FONT_SIZE}
                    onChange={e => {
                      const n = Number(e.target.value);
                      if (!Number.isFinite(n)) return;
                      patchSelectedStyle({ fontSize: Math.max(8, Math.min(72, n)) });
                    }}
                    style={{ width: "100%", padding: "5px 8px", fontSize: 11, border: `1px solid ${T.border}`, borderRadius: 6, fontFamily: F, color: T.text2, background: T.surface, outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  {([
                    { key: "B", active: !!selectedField.isBold, patch: { isBold: !selectedField.isBold } as const },
                    { key: "I", active: !!selectedField.isItalic, patch: { isItalic: !selectedField.isItalic } as const },
                    { key: "U", active: !!selectedField.isUnderline, patch: { isUnderline: !selectedField.isUnderline } as const },
                  ] as const).map(s => (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => patchSelectedStyle(s.patch)}
                      style={{
                        flex: 1, padding: "4px 0",
                        border: `1px solid ${s.active ? T.purple : T.border}`,
                        borderRadius: 5,
                        background: s.active ? T.purplePale : "transparent",
                        fontSize: 11,
                        fontWeight: s.key === "B" ? 900 : 400,
                        fontStyle: s.key === "I" ? "italic" : "normal",
                        textDecoration: s.key === "U" ? "underline" : "none",
                        color: s.active ? T.purple : T.text2,
                        cursor: "pointer",
                        fontFamily: F,
                      }}
                    >{s.key}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── CENTER: Canvas Editor ──────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", background: "#F1F5F9", overflow: isMobile ? "visible" : "hidden", minHeight: isMobile ? 400 : undefined }}>

          {/* Canvas toolbar */}
          <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: "8px 16px", display: "flex", alignItems: "center", gap: 8, flexShrink: 0, flexWrap: "wrap" }}>
            {/* Upload template */}
            <label style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", border: `1px solid ${T.border}`, borderRadius: 7, background: "transparent", color: T.text2, fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: F }}>
              <Upload size={13} color={T.purple} />
              上傳底圖 Upload Template
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                style={{ display: "none" }}
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) readFileAsDataUrl(f);
                }}
              />
            </label>

            <div style={{ width: 1, height: 20, background: T.border }} />

            {/* View mode chips */}
            {[
              { label: "📐 編輯模式", active: true },
              { label: "👁 預覽", active: false },
            ].map(m => (
              <button key={m.label} style={{ padding: "5px 11px", border: `1px solid ${m.active ? T.purple : T.border}`, borderRadius: 6, background: m.active ? T.purplePale : "transparent", color: m.active ? T.purple : T.text3, fontSize: 11, fontWeight: m.active ? 700 : 400, cursor: "pointer", fontFamily: F }}>
                {m.label}
              </button>
            ))}

            <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
              <button onClick={resetCanvas} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", border: `1px solid ${T.border}`, borderRadius: 6, background: "transparent", color: T.text3, fontSize: 11, cursor: "pointer", fontFamily: F }}>
                <RotateCcw size={12} /> 重置
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 6, background: T.emeraldPale, border: `1px solid ${T.emeraldBd}` }}>
                <CheckCircle2 size={11} color={T.emerald} />
                <span style={{ fontSize: 10.5, fontWeight: 700, color: T.emerald }}>{placedFields.length} 欄位已放置</span>
              </div>
            </div>
          </div>

          {/* Canvas area */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", alignItems: "flex-start", justifyContent: "center" }}>
            {!templateUploaded ? (
              /* Upload drop zone */
              <div
                onDragOver={e => { e.preventDefault(); setTmplDragOver(true); }}
                onDragLeave={() => setTmplDragOver(false)}
                onDrop={e => {
                  e.preventDefault();
                  setTmplDragOver(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f && f.type.startsWith("image/")) readFileAsDataUrl(f);
                }}
                style={{
                  width: "100%", maxWidth: 640, minHeight: 360,
                  border: `2.5px dashed ${tmplDragOver ? T.purple : T.borderFocus}`,
                  borderRadius: T.radiusXl, background: tmplDragOver ? T.purplePale : T.surface,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  gap: 14, cursor: "pointer", transition: "all 0.18s", padding: 40,
                }}
              >
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: T.purplePale, border: `1px solid ${T.purpleBd}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Upload size={24} color={T.purple} />
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: T.text1, marginBottom: 4 }}>上傳證書底圖 Upload Base Template</div>
                  <div style={{ fontSize: 12, color: T.text3, lineHeight: 1.7 }}>
                    拖放 PNG / JPG 到此處，或<br />
                    <label style={{ color: T.purple, fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}>
                      點擊選擇檔案
                      <input type="file" accept="image/png,image/jpeg,image/webp" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) readFileAsDataUrl(f); }} />
                    </label>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 10.5, color: T.text4 }}>支援 PNG · JPG · WebP · 最大 20 MB</div>
                </div>
                <button onClick={() => setTemplateUploaded(true)} style={{ padding: "8px 20px", border: `1px solid ${T.purpleBd}`, borderRadius: 8, background: T.purplePale, color: T.purple, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: F }}>
                  使用示範底圖 Use Demo Template
                </button>
              </div>
            ) : (
              /* Canvas with template + ghost boxes */
              <div style={{ width: "100%", maxWidth: 640, userSelect: "none" }}>
                {/* Canvas hint */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <Move size={12} color={T.text4} />
                  <span style={{ fontSize: 10.5, color: T.text4, fontFamily: F }}>拖動虛線框以調整欄位位置 · Drag ghost boxes to reposition fields</span>
                </div>

                {/* Canvas frame */}
                <div
                  ref={canvasRef}
                  onPointerMove={handleCanvasPointerMove}
                  onPointerUp={handleCanvasPointerUp}
                  onPointerLeave={handleCanvasPointerUp}
                  onClick={() => setSelectedFieldId(null)}
                  style={{ position: "relative", borderRadius: T.radius, boxShadow: "0 8px 32px rgba(15,23,42,0.15)", overflow: "visible", cursor: draggingRef.current ? "grabbing" : "default" }}
                >
                  {/* Certificate base: custom upload or ornamental SVG */}
                  {templateBg ? (
                    <img src={templateBg} alt="Certificate template" style={{ width: "100%", height: "auto", display: "block", aspectRatio: "297 / 210", objectFit: "cover" }} />
                  ) : (
                    <CertBaseTemplate
                      schoolLogoUrl={schoolLogoUrl}
                      schoolName={schoolName}
                      principalName={principalName}
                      principalTitle={principalTitle}
                    />
                  )}

                  {/* Ghost field overlays */}
                  {placedFields.map(field => {
                    const vd = getVarDef(field.varKey);
                    const color = field.color || vd?.color || T.blue;
                    const bg = field.bg || vd?.bg || T.bluePale;
                    const label = field.label || vd?.label || field.varKey;
                    const labelEn = field.labelEn || vd?.labelEn || "";
                    const isSelected = selectedFieldId === field.id;
                    const isSeal = field.varKey === "sealSpace";
                    const isImage = field.type === "image";
                    return (
                      <div
                        key={field.id}
                        onPointerDown={e => handleFieldPointerDown(e, field.id)}
                        onClick={e => { e.stopPropagation(); setSelectedFieldId(field.id); }}
                        style={{
                          position: "absolute",
                          left: `${field.x}%`,
                          top:  `${field.y}%`,
                          width: `${field.w}%`,
                          height: `${field.h}%`,
                          border: `2px dashed ${color}`,
                          borderRadius: isSeal ? "50%" : 4,
                          background: isImage ? "rgba(255,255,255,0.85)" : `${bg}CC`,
                          cursor: "grab",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          overflow: "visible",
                          boxShadow: isSelected ? `0 0 0 2px ${color}40, 0 2px 8px ${color}30` : "none",
                          transition: "box-shadow 0.12s",
                          zIndex: isSelected ? 20 : 10,
                          padding: isImage ? 2 : 0,
                        }}
                      >
                        {isImage && field.src ? (
                          <img
                            src={field.src}
                            alt={label}
                            draggable={false}
                            style={{ width: "100%", height: "100%", objectFit: "contain", pointerEvents: "none", borderRadius: 2 }}
                          />
                        ) : field.type === "static_text" || field.type === "custom" ? (
                          <>
                            <div style={{
                              fontSize: Math.max(8, Math.min(22, (field.fontSize || DEFAULT_FONT_SIZE) * 0.55)),
                              fontWeight: field.isBold ? 800 : 600,
                              fontStyle: field.isItalic ? "italic" : "normal",
                              textDecoration: field.isUnderline ? "underline" : "none",
                              fontFamily: cssFontFamily(field.fontFamily || DEFAULT_FONT_FAMILY),
                              color, lineHeight: 1.2, textAlign: "center", padding: "0 3px", pointerEvents: "none",
                            }}>
                              {field.value || `[${label}]`}
                            </div>
                            <div style={{ fontSize: 7.5, color, opacity: 0.65, fontFamily: F, pointerEvents: "none" }}>{label}</div>
                          </>
                        ) : (
                          <>
                            <div style={{
                              fontSize: Math.max(8, Math.min(22, (field.fontSize || DEFAULT_FONT_SIZE) * 0.55)),
                              fontWeight: field.isBold ? 800 : 600,
                              fontStyle: field.isItalic ? "italic" : "normal",
                              textDecoration: field.isUnderline ? "underline" : "none",
                              fontFamily: cssFontFamily(field.fontFamily || DEFAULT_FONT_FAMILY),
                              color, lineHeight: 1.2, textAlign: "center", padding: "0 3px", pointerEvents: "none",
                            }}>
                              {`[${label}]`}
                            </div>
                            {!isSeal && (
                              <div style={{ fontSize: 8, color, opacity: 0.7, fontFamily: F, pointerEvents: "none" }}>{labelEn}</div>
                            )}
                          </>
                        )}

                        {/* Drag handle */}
                        <div style={{ position: "absolute", top: -8, left: "50%", transform: "translateX(-50%)", background: color, borderRadius: 3, padding: "1px 4px", display: "flex", alignItems: "center", opacity: isSelected ? 1 : 0, transition: "opacity 0.12s", pointerEvents: "none" }}>
                          <GripVertical size={8} color="#fff" />
                        </div>

                        {/* Resize handle (esp. images) */}
                        {isSelected && (
                          <div
                            onPointerDown={e => handleResizePointerDown(e, field.id)}
                            title="拖曳調整大小"
                            style={{
                              position: "absolute", right: -6, bottom: -6,
                              width: 12, height: 12, borderRadius: 2,
                              background: color, border: "1.5px solid #fff",
                              cursor: "nwse-resize", zIndex: 31,
                              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                            }}
                          />
                        )}

                        {/* Remove button */}
                        <button
                          onPointerDown={e => e.stopPropagation()}
                          onClick={e => { e.stopPropagation(); removeField(field.id); }}
                          style={{
                            position: "absolute", top: -8, right: -8,
                            width: 16, height: 16, borderRadius: "50%",
                            background: color, border: "1.5px solid #fff",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            cursor: "pointer", opacity: isSelected ? 1 : 0,
                            transition: "opacity 0.12s",
                            zIndex: 30,
                          }}
                        >
                          <X size={8} color="#fff" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Canvas footer note */}
                <div style={{ marginTop: 10, display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
                  {[
                    { color: T.blue,   text: "姓名欄位" },
                    { color: T.amber,  text: "獎項欄位" },
                    { color: T.red,    text: "校印/簽名" },
                    { color: T.emerald, text: "其他" },
                  ].map(l => (
                    <div key={l.text} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <div style={{ width: 14, height: 8, border: `2px dashed ${l.color}`, borderRadius: 2, background: `${l.color}20` }} />
                      <span style={{ fontSize: 10, color: T.text4, fontFamily: F }}>{l.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Student list + generation ──────────────────────────────── */}
        <div style={{
          background: T.surface,
          borderLeft: isMobile ? "none" : `1px solid ${T.border}`,
          borderTop: isMobile ? `1px solid ${T.border}` : "none",
          display: "flex", flexDirection: "column",
          overflow: "hidden", flexShrink: 0,
        }}>
          {/* Student list header */}
          <div style={{ padding: "12px 16px 8px", borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <Users size={14} color={T.text3} />
                <span style={{ fontSize: 12, fontWeight: 700, color: T.text2 }}>學生名單 Students</span>
              </div>
              <span style={{ padding: "2px 8px", borderRadius: 999, background: T.purplePale, border: `1px solid ${T.purpleBd}`, fontSize: 10, fontWeight: 800, color: T.purple }}>{selectedCount} 人</span>
            </div>
            <div style={{ fontSize: 10.5, color: T.text4 }}>勾選 / 取消要生成證書的學生</div>
          </div>

          {/* Select all / clear */}
          <div style={{ padding: "6px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", gap: 8, flexShrink: 0 }}>
            <button onClick={() => setSelectedStudents(new Set(students.map(s => s.id)))} style={{ fontSize: 11, color: T.blue, background: "none", border: "none", cursor: "pointer", fontFamily: F, fontWeight: 600 }}>全選</button>
            <span style={{ color: T.border }}>|</span>
            <button onClick={() => setSelectedStudents(new Set())} style={{ fontSize: 11, color: T.text4, background: "none", border: "none", cursor: "pointer", fontFamily: F }}>全清</button>
          </div>

          {/* Award title + date */}
          <div style={{ padding: "8px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: T.text3 }}>獎項名稱 Award Title</label>
            <input
              value={awardTitle}
              onChange={e => setAwardTitle(e.target.value)}
              style={{ width: "100%", padding: "7px 10px", border: `1px solid ${T.border}`, borderRadius: 7, fontSize: 12, fontFamily: F, color: T.text1, outline: "none", boxSizing: "border-box" }}
            />
            <label style={{ fontSize: 10, fontWeight: 700, color: T.text3, marginTop: 2 }}>日期 Date</label>
            <input
              type="date"
              value={issueDate}
              onChange={e => setIssueDate(e.target.value)}
              style={{ width: "100%", padding: "7px 10px", border: `1px solid ${T.border}`, borderRadius: 7, fontSize: 12, fontFamily: F, color: T.text1, outline: "none", boxSizing: "border-box" }}
            />
          </div>

          {/* Student rows */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {studentsLoading && (
              <div style={{ padding: 24, textAlign: "center", fontSize: 12, color: T.text4 }}>載入名單中…</div>
            )}
            {!studentsLoading && students.length === 0 && (
              <div style={{ padding: 24, textAlign: "center", fontSize: 12, color: T.text4, lineHeight: 1.6 }}>
                {activityId == null ? "請先選擇活動" : "此活動尚無名單學生"}
              </div>
            )}
            {students.map((s) => {
              const selected = selectedStudents.has(s.id);
              const pal = CLASS_PAL[s.cls] ?? { bg: "#F8FAFC", color: T.text3, bd: T.border };
              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedStudents(prev => { const n = new Set(prev); n.has(s.id) ? n.delete(s.id) : n.add(s.id); return n; })}
                  style={{
                    display: "flex", alignItems: "center", gap: 9,
                    padding: "9px 16px",
                    background: selected ? "#F5F3FF" : "transparent",
                    borderBottom: `1px solid ${T.border}`,
                    cursor: "pointer", transition: "background 0.1s",
                  }}
                >
                  <div style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0, border: `2px solid ${selected ? T.purple : T.borderFocus}`, background: selected ? T.purple : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.12s" }}>
                    {selected && <span style={{ color: "#fff", fontSize: 10, fontWeight: 900, lineHeight: 1 }}>✓</span>}
                  </div>
                  <div style={{ width: 26, height: 26, borderRadius: "50%", flexShrink: 0, background: `linear-gradient(135deg, ${T.purple}, #A855F7)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff" }}>
                    {(s.name || s.nameEn || "?").slice(0, 1)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: selected ? T.purple : T.text1 }}>{s.name || s.nameEn}</div>
                    <div style={{ fontSize: 10, color: T.text4 }}>{s.nameEn}</div>
                  </div>
                  <span style={{ padding: "1px 6px", borderRadius: 5, background: pal.bg, border: `1px solid ${pal.bd}`, fontSize: 10, fontWeight: 700, color: pal.color, flexShrink: 0 }}>{s.cls}</span>
                </div>
              );
            })}
          </div>

          {/* Generation CTA */}
          <div style={{ padding: "14px 16px", borderTop: `1px solid ${T.border}`, flexShrink: 0, background: T.surface }}>

            {/* Helper text */}
            <div style={{ display: "flex", gap: 8, padding: "9px 12px", background: T.bluePale, border: `1px solid ${T.blueBd}`, borderRadius: T.radius, marginBottom: 12 }}>
              <FileText size={13} color={T.blue} style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 10.5, color: "#1D4ED8", lineHeight: 1.6 }}>
                <strong>系統將自動映射姓名</strong>並保留校印 / 簽名位置。<br />
                <span style={{ color: "#3B82F6", opacity: 0.9 }}>System will auto-map names and preserve seal/signature zones for physical stamps.</span>
              </div>
            </div>

            {/* Generation progress */}
            {generating && (
              <div style={{ marginBottom: 10, padding: "8px 12px", background: T.purplePale, border: `1px solid ${T.purpleBd}`, borderRadius: T.radius }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
                  <Sparkles size={12} color={T.purple} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: T.purple }}>正在生成中… Generating…</span>
                </div>
                <div style={{ height: 4, background: "#E9D5FF", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", background: `linear-gradient(90deg, ${T.purple}, #A855F7)`, width: "65%", borderRadius: 2, animation: "shimmerBar 1.2s ease-in-out infinite" }} />
                </div>
                <style>{`@keyframes shimmerBar { 0%{width:15%} 50%{width:85%} 100%{width:15%} }`}</style>
              </div>
            )}

            {genError && (
              <div style={{ marginBottom: 10, padding: "8px 12px", background: T.redPale, border: `1px solid ${T.redBd}`, borderRadius: T.radius, fontSize: 11, color: T.red, lineHeight: 1.5 }}>
                {genError}
              </div>
            )}

            {saveMsg && (
              <div style={{
                marginBottom: 10, padding: "8px 12px", borderRadius: T.radius, fontSize: 11, lineHeight: 1.5,
                background: saveMsg.includes("失敗") || saveMsg.includes("fail") ? T.redPale : T.emeraldPale,
                border: `1px solid ${saveMsg.includes("失敗") ? T.redBd : T.emeraldBd}`,
                color: saveMsg.includes("失敗") ? T.red : T.emerald,
              }}>
                {saveMsg}
              </div>
            )}

            {saveTemplateUrl && (
              <button
                type="button"
                onClick={() => { void handleSaveTemplate(); }}
                disabled={savingTemplate || generating}
                style={{
                  width: "100%",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  padding: "11px 0", marginBottom: 8,
                  border: `1px solid ${T.emeraldBd}`, borderRadius: T.radiusLg,
                  background: T.emeraldPale, color: T.emerald,
                  fontSize: 13, fontWeight: 800, fontFamily: F,
                  cursor: savingTemplate ? "wait" : "pointer",
                }}
              >
                <Save size={15} />
                {savingTemplate ? "儲存中…" : "💾 儲存範本 Save Template"}
              </button>
            )}

            {/* Main generate button */}
            <button
              onClick={() => { void handleGenerate(); }}
              disabled={selectedCount === 0 || generating || !templateUploaded || activityId == null}
              style={{
                width: "100%",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
                padding: "13px 0",
                border: "none", borderRadius: T.radiusLg,
                background: (selectedCount > 0 && !generating && templateUploaded && activityId != null)
                  ? "linear-gradient(135deg, #7C3AED 0%, #9333EA 60%, #A855F7 100%)"
                  : T.border,
                color: (selectedCount > 0 && !generating && templateUploaded && activityId != null) ? "#fff" : T.text4,
                fontSize: 13.5, fontWeight: 800, fontFamily: F,
                cursor: (selectedCount > 0 && !generating && templateUploaded && activityId != null) ? "pointer" : "not-allowed",
                boxShadow: (selectedCount > 0 && !generating && templateUploaded && activityId != null) ? "0 4px 18px rgba(124,58,237,0.40)" : "none",
                transition: "all 0.15s",
                letterSpacing: "-0.2px",
              }}
            >
              {generating ? (
                <>
                  <Sparkles size={16} />
                  生成中…
                </>
              ) : (
                <>
                  <Printer size={16} />
                  🖨️ 批量生成 PDF ({selectedCount})
                </>
              )}
            </button>

            {/* Breakdown */}
            <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
              {[
                { label: "證書份數", value: `${selectedCount}`, color: T.purple },
                { label: "放置欄位", value: `${placedFields.length}`, color: T.blue },
                { label: "關聯活動", value: "已設定", color: T.emerald },
              ].map(s => (
                <div key={s.label} style={{ textAlign: "center", padding: "4px 10px", borderRadius: 7, background: T.bg, border: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 9, color: T.text4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
