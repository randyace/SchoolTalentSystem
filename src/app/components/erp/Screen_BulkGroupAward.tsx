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
  GripVertical, Eye, Download, Printer, RotateCcw, Trash2,
  CheckCircle2, Move, Stamp, PenLine, CalendarDays, User, BookOpen,
  AlignCenter, Search, Image as ImageIcon, Tag, Minus, Save,
  Undo2, Redo2,
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
  /** Check-in / 報到次數 for the linked activity */
  attendanceCount: number;
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
  /** GET base — append /{templateId} for inline PDF preview */
  previewUrlBase?: string;
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
  awardTitleZh?: string;
  awardTitleEn?: string;
  award_title_zh?: string;
  award_title_en?: string;
  issueDate?: string;
  templateBg?: string;
  orientation?: "landscape" | "portrait";
  fields?: Array<Record<string, unknown>>;
};

/** Fixed A4 stage at ~96 DPI — coordinates stay absolute; zoom is CSS transform only. */
const A4_PX = {
  landscape: { w: 1123, h: 794 },
  portrait:  { w: 794,  h: 1123 },
} as const;
type CanvasOrientation = keyof typeof A4_PX;
const ZOOM_OPTIONS = [50, 75, 100, 125, 150] as const;
const HISTORY_MAX = 50;
const DEFAULT_ZOOM = 75;

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
  { key: "student_name_zh", label: "姓名 (中)",     labelEn: "Student Name (ZH)", icon: <User size={11} />,        color: T.blue,   bg: T.bluePale,   border: T.blueBd,   defaultW: 28, defaultH: 3 },
  { key: "student_name_en", label: "姓名 (英)",     labelEn: "Student Name (EN)", icon: <User size={11} />,        color: "#7C3AED", bg: "#F5F3FF",   border: "#C4B5FD",  defaultW: 30, defaultH: 3 },
  { key: "class",           label: "班別",         labelEn: "Class",              icon: <BookOpen size={11} />,    color: T.emerald, bg: T.emeraldPale, border: T.emeraldBd, defaultW: 12, defaultH: 3 },
  { key: "award_title_zh",  label: "獎項名稱 (中)", labelEn: "Award Title (ZH)",  icon: <Award size={11} />,       color: T.amber,  bg: T.amberPale,  border: T.amberBd,  defaultW: 20, defaultH: 3.2 },
  { key: "award_title_en",  label: "獎項名稱 (英)", labelEn: "Award Title (EN)",  icon: <Award size={11} />,       color: "#B45309", bg: "#FFFBEB",   border: "#FCD34D",  defaultW: 22, defaultH: 3.2 },
  { key: "event_name_zh",   label: "活動名稱 (中)", labelEn: "Event Name (ZH)",   icon: <Layers size={11} />,      color: "#0891B2", bg: "#F0FDFA",   border: "#67E8F9",  defaultW: 34, defaultH: 3 },
  { key: "event_name_en",   label: "活動名稱 (英)", labelEn: "Event Name (EN)",   icon: <Layers size={11} />,      color: "#0E7490", bg: "#ECFEFF",   border: "#A5F3FC",  defaultW: 36, defaultH: 3 },
  { key: "date",            label: "日期",         labelEn: "Date",               icon: <CalendarDays size={11} />, color: "#DC2626", bg: "#FEF2F2",  border: "#FECACA",  defaultW: 18, defaultH: 3 },
  { key: "sealSpace",       label: "校印位置",     labelEn: "Official Seal",      icon: <Stamp size={11} />,       color: T.red,    bg: T.redPale,    border: T.redBd,    defaultW: 14, defaultH: 14 },
  { key: "signSpace",       label: "簽名位置",     labelEn: "Signature",          icon: <PenLine size={11} />,     color: "#92400E", bg: T.amberPale, border: T.amberBd,  defaultW: 22, defaultH: 3 },
  { key: "schoolName",      label: "學校名稱",     labelEn: "School Name",        icon: <AlignCenter size={11} />, color: T.text3,  bg: "#F8FAFC",    border: T.border,   defaultW: 34, defaultH: 3 },
];

/** Signatory variables — bilingual principal name / title (independent drag + style). */
const SIGNATORY_FIELDS: VarField[] = [
  { key: "principal_name_zh",  label: "校長姓名 (中)", labelEn: "Principal Name (ZH)", icon: <User size={11} />, color: "#1D4ED8", bg: T.bluePale,   border: T.blueBd,   defaultW: 22, defaultH: 3 },
  { key: "principal_name_en",  label: "校長姓名 (英)", labelEn: "Principal Name (EN)", icon: <User size={11} />, color: "#1E40AF", bg: "#EFF6FF",   border: "#93C5FD",  defaultW: 28, defaultH: 3 },
  { key: "principal_title_zh", label: "職稱 (中)",     labelEn: "Title (ZH)",          icon: <Tag size={11} />,  color: "#7C3AED", bg: T.purplePale, border: T.purpleBd, defaultW: 14, defaultH: 3 },
  { key: "principal_title_en", label: "職稱 (英)",     labelEn: "Title (EN)",          icon: <Tag size={11} />,  color: "#6D28D9", bg: "#F5F3FF",   border: "#C4B5FD",  defaultW: 16, defaultH: 3 },
];

/** Canvas ghost sample text — language-appropriate placeholders for bilingual keys. */
const FIELD_GHOST_SAMPLES: Record<string, string> = {
  student_name_zh: "陳大文",
  student_name_en: "Chan Tai Man",
  studentName: "陳大文",
  nameEn: "Chan Tai Man",
  class: "1A",
  award_title_zh: "金獎",
  award_title_en: "Gold Award",
  awardTitle: "金獎 Gold Award",
  event_name_zh: "數學奧林匹克",
  event_name_en: "Math Olympiad",
  eventName: "數學奧林匹克 Math Olympiad",
  date: "2026-10-27",
  schoolName: "香港神託會培敦中學",
  principal_name_zh: "林佩儀",
  principal_name_en: "Ms. Lam Pui Yee",
  principal_title_zh: "校長",
  principal_title_en: "Principal",
  principalName: "林佩儀",
  principalTitle: "校長",
  principalNameStatic: "林佩儀",
  principalTitleStatic: "校長",
};

/** Normalize legacy camelCase keys from older config_json → bilingual snake_case. */
function normalizeVarKey(raw: string): string {
  const map: Record<string, string> = {
    studentName: "student_name_zh",
    nameEn: "student_name_en",
    awardTitle: "award_title_zh",
    eventName: "event_name_zh",
    principalName: "principal_name_zh",
    principalTitle: "principal_title_zh",
    principalNameStatic: "principal_name_zh",
    principalTitleStatic: "principal_title_zh",
  };
  return map[raw] || raw;
}

/** Reject document titles accidentally stored as award titles. */
function isDocumentTitleNotAward(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (!t) return false;
  if (
    t === "成就證書"
    || t === "certificate of achievement"
    || t === "成就證書 certificate of achievement"
  ) return true;
  return /成就證書/.test(text) && /certificate\s+of\s+achievement/i.test(text);
}

function splitZhEn(raw: string): [string, string] {
  const s = raw.trim();
  if (!s) return ["", ""];
  const m = s.match(/^(.+?)\s+(\/?\s*)?([A-Za-z].+)$/u);
  if (m) return [m[1].trim(), m[3].trim()];
  // CJK Unified Ideographs (avoid \p{Han} — Rollup/esbuild regex quirk)
  if (/[\u4E00-\u9FFF]/.test(s)) return [s, ""];
  return ["", s];
}

type LineStyle = "none" | "solid" | "dotted";

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
  /** Tracking in CSS px (maps to TCPDF setFontSpacing) */
  letterSpacing: number;
  /** Unitless line-height multiplier (maps to TCPDF setCellHeightRatio) */
  lineHeight: number;
  /** Field underline for fill-in blanks (name / signature) */
  lineStyle: LineStyle;
}

/** Snapshot of undoable canvas state (deep-cloned via JSON). */
type CanvasHistoryState = {
  fields: PlacedField[];
  orientation: CanvasOrientation;
};

/**
 * Undo/Redo stacks for the certificate canvas.
 * saveState() stores a deep copy of the pre-mutation snapshot and clears redo.
 */
class HistoryManager {
  private undoStack: CanvasHistoryState[] = [];
  private redoStack: CanvasHistoryState[] = [];
  private applying = false;

  static clone(state: CanvasHistoryState): CanvasHistoryState {
    return JSON.parse(JSON.stringify(state)) as CanvasHistoryState;
  }

  saveState(state: CanvasHistoryState): void {
    if (this.applying) return;
    this.undoStack.push(HistoryManager.clone(state));
    if (this.undoStack.length > HISTORY_MAX) {
      this.undoStack.shift();
    }
    this.redoStack = [];
  }

  undo(current: CanvasHistoryState): CanvasHistoryState | null {
    if (this.undoStack.length === 0) return null;
    this.redoStack.push(HistoryManager.clone(current));
    return this.undoStack.pop() ?? null;
  }

  redo(current: CanvasHistoryState): CanvasHistoryState | null {
    if (this.redoStack.length === 0) return null;
    this.undoStack.push(HistoryManager.clone(current));
    return this.redoStack.pop() ?? null;
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  beginApply(): void {
    this.applying = true;
  }

  endApply(): void {
    this.applying = false;
  }

  get isApplying(): boolean {
    return this.applying;
  }
}

function clampFieldsToCanvas(fields: PlacedField[]): PlacedField[] {
  return fields.map(f => {
    const w = Math.max(3, Math.min(100, f.w));
    const minH = isTextLikeField(f) ? 1.5 : 3;
    const h = Math.max(minH, Math.min(100, f.h));
    return {
      ...f,
      w,
      h,
      x: Math.max(0, Math.min(100 - w, f.x)),
      y: Math.max(0, Math.min(100 - h, f.y)),
    };
  });
}

type FontOpt = { value: string; label: string; group: string; css: string };

/** Expanded font library — preview via CSS/Google Fonts; PDF via TCPDF mapping (+ optional .ttf). */
const CERT_FONTS: FontOpt[] = [
  // System / PDF core
  { value: "helvetica", label: "Helvetica", group: "系統基礎", css: "Helvetica, Arial, sans-serif" },
  { value: "times", label: "Times", group: "系統基礎", css: "'Times New Roman', Times, serif" },
  { value: "courier", label: "Courier", group: "系統基礎", css: "'Courier New', Courier, monospace" },
  // English sans
  { value: "arial", label: "Arial", group: "英文無襯線", css: "Arial, Helvetica, sans-serif" },
  { value: "roboto", label: "Roboto", group: "英文無襯線", css: "'Roboto', Arial, sans-serif" },
  { value: "open-sans", label: "Open Sans", group: "英文無襯線", css: "'Open Sans', Arial, sans-serif" },
  { value: "montserrat", label: "Montserrat", group: "英文無襯線", css: "'Montserrat', Arial, sans-serif" },
  { value: "lato", label: "Lato", group: "英文無襯線", css: "'Lato', Arial, sans-serif" },
  // English serif
  { value: "georgia", label: "Georgia", group: "英文襯線", css: "Georgia, 'Times New Roman', serif" },
  { value: "merriweather", label: "Merriweather", group: "英文襯線", css: "'Merriweather', Georgia, serif" },
  { value: "playfair-display", label: "Playfair Display", group: "英文襯線", css: "'Playfair Display', Georgia, serif" },
  // Script / signature
  { value: "great-vibes", label: "Great Vibes", group: "英文草書/簽名風", css: "'Great Vibes', cursive" },
  { value: "dancing-script", label: "Dancing Script", group: "英文草書/簽名風", css: "'Dancing Script', cursive" },
  { value: "pacifico", label: "Pacifico", group: "英文草書/簽名風", css: "'Pacifico', cursive" },
  // Chinese
  { value: "noto-sans-tc", label: "思源黑體 (Noto Sans TC)", group: "中文常用", css: "'Noto Sans TC', 'PingFang TC', 'Microsoft JhengHei', sans-serif" },
  { value: "noto-serif-tc", label: "思源宋體 (Noto Serif TC)", group: "中文常用", css: "'Noto Serif TC', 'Songti TC', serif" },
  { value: "kaiti", label: "標楷體 (Kaiti / BiauKai)", group: "中文常用", css: "'DFKai-SB', 'BiauKai', 'KaiTi', serif" },
  { value: "microsoft-jhenghei", label: "微軟正黑體 (Microsoft JhengHei)", group: "中文常用", css: "'Microsoft JhengHei', 'PingFang TC', sans-serif" },
  { value: "microsoft-yahei", label: "微軟雅黑 (Microsoft YaHei)", group: "中文常用", css: "'Microsoft YaHei', 'PingFang SC', sans-serif" },
  { value: "mingliu", label: "細明體/宋體 (MingLiU / SimSun)", group: "中文常用", css: "'MingLiU', 'PMingLiU', SimSun, serif" },
  // Chinese cursive / handwriting (Google Fonts)
  { value: "ma-shan-zheng", label: "馬善政毛筆楷書 (Ma Shan Zheng)", group: "中文草書/手寫風", css: "'Ma Shan Zheng', 'KaiTi', cursive" },
  { value: "zhi-mang-xing", label: "志莽行書 (Zhi Mang Xing)", group: "中文草書/手寫風", css: "'Zhi Mang Xing', 'KaiTi', cursive" },
  { value: "liu-jian-mao-cao", label: "柳建毛草 (Liu Jian Mao Cao)", group: "中文草書/手寫風", css: "'Liu Jian Mao Cao', 'KaiTi', cursive" },
  { value: "long-cang", label: "龍藏體 (Long Cang)", group: "中文草書/手寫風", css: "'Long Cang', 'KaiTi', cursive" },
  { value: "klee-one", label: "克里硬筆體 (Klee One)", group: "中文草書/手寫風", css: "'Klee One', 'PingFang TC', sans-serif" },
  // TCPDF built-in Chinese (accurate PDF without extra TTF)
  // PDF-native keys: preview via similar web fonts; config_json still stores the TCPDF key
  { value: "cid0ct", label: "cid0ct (TCPDF 繁中)", group: "PDF 內建中文", css: "'Noto Sans TC', 'PingFang TC', 'Microsoft JhengHei', sans-serif" },
  { value: "cid0cs", label: "cid0cs (TCPDF 簡中)", group: "PDF 內建中文", css: "'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif" },
  { value: "msungstdlight", label: "MSungStdLight (繁中)", group: "PDF 內建中文", css: "'Noto Serif TC', 'Songti TC', 'MingLiU', serif" },
  { value: "stsongstdlight", label: "STSongStdLight (簡中)", group: "PDF 內建中文", css: "'Noto Serif SC', SimSun, serif" },
];

const LINE_STYLE_OPTIONS: { value: LineStyle; label: string; hint: string }[] = [
  { value: "none", label: "無底線 None", hint: "—" },
  { value: "solid", label: "實線 Solid", hint: "______" },
  { value: "dotted", label: "虛線 Dotted", hint: "······" },
];

const DEFAULT_FONT_FAMILY = "noto-sans-tc";
const DEFAULT_FONT_SIZE = 16;
const DEFAULT_LETTER_SPACING = 0;
const DEFAULT_LINE_HEIGHT = 1.2;
const DEFAULT_LINE_STYLE: LineStyle = "none";
/** Canvas px used when converting font metrics → % height (A4 landscape @96dpi). */
const A4_CANVAS_H_REF = A4_PX.landscape.h;

/** Single-line text box height as % of canvas — tight wrap around fontSize × lineHeight. */
function textFieldHeightPct(fontSize: number, lineHeight: number, canvasH = A4_CANVAS_H_REF): number {
  const fs = Math.max(8, fontSize || DEFAULT_FONT_SIZE);
  const lh = Math.max(0.8, lineHeight || DEFAULT_LINE_HEIGHT);
  const px = fs * lh + 4; // 2px top + 2px bottom padding
  return Math.max(1.5, Math.min(25, (px / Math.max(1, canvasH)) * 100));
}

function isTextLikeField(f: Pick<PlacedField, "type" | "varKey">): boolean {
  if (f.type === "image" || f.varKey === "sealSpace") return false;
  return true;
}

const GOOGLE_FONTS_HREF =
  "https://fonts.googleapis.com/css2?"
  + "family=Roboto:ital,wght@0,400;0,700;1,400"
  + "&family=Open+Sans:ital,wght@0,400;0,700;1,400"
  + "&family=Montserrat:ital,wght@0,400;0,700;1,400"
  + "&family=Lato:ital,wght@0,400;0,700;1,400"
  + "&family=Merriweather:ital,wght@0,400;0,700;1,400"
  + "&family=Playfair+Display:ital,wght@0,400;0,700;1,400"
  + "&family=Great+Vibes"
  + "&family=Dancing+Script:wght@400;700"
  + "&family=Pacifico"
  + "&family=Noto+Sans+TC:wght@400;700"
  + "&family=Noto+Serif+TC:wght@400;700"
  + "&family=Noto+Sans+SC:wght@400;700"
  + "&family=Noto+Serif+SC:wght@400;700"
  + "&family=Ma+Shan+Zheng"
  + "&family=Zhi+Mang+Xing"
  + "&family=Liu+Jian+Mao+Cao"
  + "&family=Long+Cang"
  + "&family=Klee+One"
  + "&display=swap";

function ensureCertGoogleFonts(): void {
  if (typeof document === "undefined") return;
  if (document.getElementById("sts-cert-google-fonts")) return;
  const preconnect1 = document.createElement("link");
  preconnect1.rel = "preconnect";
  preconnect1.href = "https://fonts.googleapis.com";
  document.head.appendChild(preconnect1);
  const preconnect2 = document.createElement("link");
  preconnect2.rel = "preconnect";
  preconnect2.href = "https://fonts.gstatic.com";
  preconnect2.crossOrigin = "anonymous";
  document.head.appendChild(preconnect2);
  const link = document.createElement("link");
  link.id = "sts-cert-google-fonts";
  link.rel = "stylesheet";
  link.href = GOOGLE_FONTS_HREF;
  document.head.appendChild(link);
}

function cssFontFamily(fontKey: string): string {
  const hit = CERT_FONTS.find(f => f.value === fontKey);
  if (hit) return hit.css;
  // Legacy aliases — PDF-native keys map to similar web faces for preview only
  if (fontKey === "cid0ct") {
    return "'Noto Sans TC', 'PingFang TC', 'Microsoft JhengHei', sans-serif";
  }
  if (fontKey === "msungstdlight") {
    return "'Noto Serif TC', 'Songti TC', 'MingLiU', serif";
  }
  if (fontKey === "cid0cs") {
    return "'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif";
  }
  if (fontKey === "stsongstdlight") {
    return "'Noto Serif SC', SimSun, serif";
  }
  return "'Noto Sans TC', Helvetica, Arial, sans-serif";
}

/** Canva-style font catalog: each row renders in its own typeface; value stays PDF key. */
const FontFamilyPicker: React.FC<{
  value: string;
  groups: Array<{ group: string; fonts: FontOpt[] }>;
  onChange: (fontKey: string) => void;
}> = ({ value, groups, onChange }) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = CERT_FONTS.find(f => f.value === value) || CERT_FONTS.find(f => f.value === DEFAULT_FONT_FAMILY)!;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <input type="hidden" name="font_family" value={value} readOnly />
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 8,
          padding: "7px 28px 7px 10px",
          border: `1px solid ${open ? T.purple : T.border}`,
          borderRadius: 7, background: T.surface, cursor: "pointer",
          boxShadow: open ? `0 0 0 3px ${T.purplePale}` : "none",
          textAlign: "left", outline: "none",
        }}
      >
        <span style={{
          flex: 1, minWidth: 0, fontSize: 14, lineHeight: 1.25,
          fontFamily: cssFontFamily(selected.value),
          color: T.text1, fontWeight: 600,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {selected.label}
        </span>
        <ChevronDown size={12} color={T.text4} style={{
          position: "absolute", right: 9, top: "50%",
          transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`,
          transition: "transform 0.15s", pointerEvents: "none",
        }} />
      </button>

      {open && (
        <div
          role="listbox"
          style={{
            position: "absolute", left: 0, right: 0, bottom: "calc(100% + 6px)",
            maxHeight: 320, overflowY: "auto", zIndex: 80,
            background: T.surface, border: `1px solid ${T.border}`,
            borderRadius: 10, boxShadow: T.shadowMd, padding: "6px 0",
          }}
        >
          {groups.map(g => (
            <div key={g.group}>
              <div style={{
                padding: "8px 12px 4px",
                fontSize: 9.5, fontWeight: 800, color: T.text4,
                letterSpacing: "0.06em", textTransform: "uppercase",
                fontFamily: T.font,
              }}>
                {g.group}
              </div>
              {g.fonts.map(opt => {
                const active = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 8,
                      padding: "8px 12px", border: "none", cursor: "pointer",
                      background: active ? T.purplePale : "transparent",
                      textAlign: "left",
                    }}
                    onMouseEnter={e => {
                      if (!active) e.currentTarget.style.background = "#F8FAFC";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = active ? T.purplePale : "transparent";
                    }}
                  >
                    <span style={{
                      flex: 1, fontSize: 15, lineHeight: 1.3,
                      fontFamily: opt.css, color: active ? T.purple : T.text1,
                      fontWeight: active ? 700 : 500,
                    }}>
                      {opt.label}
                    </span>
                    {active && <CheckCircle2 size={13} color={T.purple} />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

function normalizeLineStyle(raw: unknown): LineStyle {
  const v = String(raw ?? "none").toLowerCase();
  if (v === "solid" || v === "line" || v === "underline-solid") return "solid";
  if (v === "dotted" || v === "dash" || v === "dashed" || v === "underline-dotted") return "dotted";
  return "none";
}

function fieldLineCss(style: LineStyle): React.CSSProperties {
  if (style === "solid") {
    return { borderBottom: "1.5px solid #000" };
  }
  if (style === "dotted") {
    return { borderBottom: "2px dotted #000" };
  }
  return {};
}

function placedFromVar(v: VarField, overrides: Partial<PlacedField> & { id: string; x: number; y: number }): PlacedField {
  const type = v.type || "dynamic";
  const fontSize = overrides.fontSize ?? DEFAULT_FONT_SIZE;
  const lineHeight = overrides.lineHeight ?? DEFAULT_LINE_HEIGHT;
  const draft: PlacedField = {
    id: overrides.id,
    varKey: v.key,
    type,
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
    fontSize,
    isBold: overrides.isBold ?? false,
    isItalic: overrides.isItalic ?? false,
    isUnderline: overrides.isUnderline ?? false,
    letterSpacing: overrides.letterSpacing ?? DEFAULT_LETTER_SPACING,
    lineHeight,
    lineStyle: overrides.lineStyle ?? (
      v.key === "signSpace" || v.key === "signatureLine"
        || v.key === "student_name_zh" || v.key === "student_name_en"
        || v.key === "studentName" || v.key === "nameEn"
        ? "solid"
        : DEFAULT_LINE_STYLE
    ),
  };
  if (isTextLikeField(draft) && overrides.h === undefined) {
    draft.h = textFieldHeightPct(fontSize, lineHeight);
  }
  return draft;
}

function placedFromConfig(
  raw: Record<string, unknown>,
  idx: number,
  customList: CertCustomField[],
): PlacedField {
  const varKey = normalizeVarKey(String(raw.name ?? raw.varKey ?? `field_${idx}`));
  const type = (String(raw.type ?? "dynamic") as PlaceType);
  const vd = VAR_FIELDS.find(v => v.key === varKey) || SIGNATORY_FIELDS.find(v => v.key === varKey);
  const cf = customList.find(c => c.field_name === varKey);
  const label = String(raw.label ?? vd?.label ?? cf?.display_label ?? varKey);
  const labelEn = String(raw.labelEn ?? vd?.labelEn ?? cf?.field_name ?? varKey);
  const color = String(raw.color ?? vd?.color ?? (type === "custom" ? "#C026D3" : T.blue));
  const bg = String(raw.bg ?? vd?.bg ?? (type === "custom" ? "#FDF4FF" : T.bluePale));
  const border = String(raw.border ?? vd?.border ?? (type === "custom" ? "#F0ABFC" : T.blueBd));
  const fontSizeRaw = Number(raw.fontSize ?? raw.font_size ?? DEFAULT_FONT_SIZE);
  const fontSize = Number.isFinite(fontSizeRaw) && fontSizeRaw > 0 ? fontSizeRaw : DEFAULT_FONT_SIZE;
  const letterRaw = Number(raw.letterSpacing ?? raw.letter_spacing ?? DEFAULT_LETTER_SPACING);
  const lineHRaw = Number(raw.lineHeight ?? raw.line_height ?? DEFAULT_LINE_HEIGHT);
  const letterSpacing = Number.isFinite(letterRaw) ? letterRaw : DEFAULT_LETTER_SPACING;
  const lineHeight = Number.isFinite(lineHRaw) && lineHRaw > 0 ? lineHRaw : DEFAULT_LINE_HEIGHT;
  let value = raw.value !== undefined ? String(raw.value) : vd?.value;
  // Strip underscore placeholders — lines are drawn via lineStyle, not literal "_" glyphs
  if (typeof value === "string" && /^[\s_＿—–-]+$/u.test(value)) {
    value = "";
  }

  const field: PlacedField = {
    id: `p${idx}-${varKey}`,
    varKey,
    type,
    value,
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
    fontSize,
    isBold: Boolean(raw.isBold ?? raw.bold ?? false),
    isItalic: Boolean(raw.isItalic ?? raw.italic ?? false),
    isUnderline: Boolean(raw.isUnderline ?? raw.underline ?? false),
    letterSpacing,
    lineHeight,
    lineStyle: normalizeLineStyle(raw.lineStyle ?? raw.line_style ?? raw.borderStyle),
  };
  // Snap oversized legacy text boxes to a single-line font metric
  if (isTextLikeField(field)) {
    const tight = textFieldHeightPct(field.fontSize, field.lineHeight);
    if (!Number.isFinite(field.h) || field.h > tight * 1.35) {
      field.h = tight;
    }
  }
  return field;
}

const DEFAULT_PLACED: PlacedField[] = [
  placedFromVar(VAR_FIELDS.find(v => v.key === "student_name_zh")!, { id: "p1", x: 28, y: 46, w: 26 }),
  placedFromVar(VAR_FIELDS.find(v => v.key === "student_name_en")!, { id: "p2", x: 28, y: 52, w: 30 }),
  placedFromVar(VAR_FIELDS.find(v => v.key === "class")!, { id: "p3", x: 60, y: 46, w: 14 }),
  placedFromVar(VAR_FIELDS.find(v => v.key === "award_title_zh")!, { id: "p4", x: 36, y: 62, w: 20 }),
  placedFromVar(VAR_FIELDS.find(v => v.key === "award_title_en")!, { id: "p4b", x: 36, y: 68, w: 24 }),
  placedFromVar(VAR_FIELDS.find(v => v.key === "date")!, { id: "p5", x: 22, y: 78, w: 20 }),
  placedFromVar(VAR_FIELDS.find(v => v.key === "sealSpace")!, { id: "p6", x: 75, y: 74, w: 14, h: 16 }),
  placedFromVar(VAR_FIELDS.find(v => v.key === "signSpace")!, { id: "p7", x: 50, y: 78, w: 22 }),
];

// ── Certificate base template (blank, ornamental only) ─────────────────────────
const CertBaseTemplate: React.FC<{
  schoolLogoUrl?: string;
  schoolName?: string;
  principalName?: string;
  principalTitle?: string;
}> = ({
  schoolLogoUrl = "",
  schoolName = "香港神託會培敦中學",
  principalName = "",
  principalTitle = "校長 Principal",
}) => (
  <svg viewBox="0 0 520 368" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ width: "100%", height: "100%", display: "block" }}>
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
  previewUrlBase = "/certificates/preview",
  schoolLogoUrl = "",
  schoolLogoPath = "",
  principalName = "",
  principalTitle = "校長 Principal",
  schoolName = "香港神託會培敦中學",
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
  const [previewing, setPreviewing] = useState(false);
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

  // Fixed A4 stage controls
  const [orientation, setOrientation] = useState<CanvasOrientation>("landscape");
  const [zoom, setZoom] = useState<number>(DEFAULT_ZOOM);
  const a4 = A4_PX[orientation];
  const zoomScale = zoom / 100;

  // Canvas fields
  const [placedFields, setPlacedFields] = useState<PlacedField[]>(DEFAULT_PLACED);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [customFields, setCustomFields] = useState<CertCustomField[]>(() => [...customFieldsProp]);
  const [addingCustom, setAddingCustom] = useState(false);

  // Undo / Redo
  const historyRef = useRef(new HistoryManager());
  const [historyTick, setHistoryTick] = useState(0);
  const autosaveAfterHistoryRef = useRef(false);
  const dragHistorySnapshotRef = useRef<CanvasHistoryState | null>(null);
  const interactionDirtyRef = useRef(false);
  const canUndo = historyRef.current.canUndo();
  const canRedo = historyRef.current.canRedo();
  void historyTick; // re-render when stacks change

  // Bilingual award titles (explicit ZH / EN for canvas + PDF keys)
  const [awardTitleZh, setAwardTitleZh] = useState("金獎");
  const [awardTitleEn, setAwardTitleEn] = useState("Gold Award");
  const awardTitle = [awardTitleZh, awardTitleEn].map(s => s.trim()).filter(Boolean).join(" ");
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().slice(0, 10));

  // Bilingual signatories — editable defaults; system branding used as seed
  const [principalNameZh, setPrincipalNameZh] = useState(() => {
    const [zh] = splitZhEn(principalName || "");
    return zh || "林佩儀";
  });
  const [principalNameEn, setPrincipalNameEn] = useState(() => {
    const [, en] = splitZhEn(principalName || "");
    return en || "Ms. Lam Pui Yee";
  });
  const [principalTitleZh, setPrincipalTitleZh] = useState(() => {
    const [zh] = splitZhEn(principalTitle || "");
    return zh || "校長";
  });
  const [principalTitleEn, setPrincipalTitleEn] = useState(() => {
    const [, en] = splitZhEn(principalTitle || "");
    return en || "Principal";
  });

  // Drag / resize state
  const canvasRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<{ id: string; startMouseX: number; startMouseY: number; startFieldX: number; startFieldY: number } | null>(null);
  const resizingRef = useRef<{ id: string; startMouseX: number; startMouseY: number; startW: number; startH: number } | null>(null);

  const captureHistoryState = useCallback((): CanvasHistoryState => ({
    fields: placedFields,
    orientation,
  }), [placedFields, orientation]);

  const pushHistory = useCallback((snapshot?: CanvasHistoryState) => {
    if (historyRef.current.isApplying) return;
    historyRef.current.saveState(snapshot ?? captureHistoryState());
    setHistoryTick(t => t + 1);
  }, [captureHistoryState]);

  const renderHistoryState = useCallback((state: CanvasHistoryState) => {
    historyRef.current.beginApply();
    setOrientation(state.orientation);
    setPlacedFields(clampFieldsToCanvas(state.fields.map(f => ({ ...f, selected: false }))));
    setSelectedFieldId(null);
    draggingRef.current = null;
    resizingRef.current = null;
    historyRef.current.endApply();
    setHistoryTick(t => t + 1);
    autosaveAfterHistoryRef.current = true;
  }, []);

  const undo = useCallback(() => {
    const prev = historyRef.current.undo(captureHistoryState());
    if (!prev) return;
    renderHistoryState(prev);
  }, [captureHistoryState, renderHistoryState]);

  const redo = useCallback(() => {
    const next = historyRef.current.redo(captureHistoryState());
    if (!next) return;
    renderHistoryState(next);
  }, [captureHistoryState, renderHistoryState]);

  const switchOrientation = (next: CanvasOrientation) => {
    if (next === orientation) return;
    pushHistory();
    setOrientation(next);
    setPlacedFields(prev => clampFieldsToCanvas(prev));
    draggingRef.current = null;
    resizingRef.current = null;
  };

  const getVarDef = (key: string) =>
    VAR_FIELDS.find(v => v.key === key) || SIGNATORY_FIELDS.find(v => v.key === key);

  const liveGhostSamples = (): Record<string, string> => ({
    ...FIELD_GHOST_SAMPLES,
    award_title_zh: awardTitleZh.trim() || FIELD_GHOST_SAMPLES.award_title_zh,
    award_title_en: awardTitleEn.trim() || FIELD_GHOST_SAMPLES.award_title_en,
    awardTitle: awardTitle || FIELD_GHOST_SAMPLES.awardTitle,
    principal_name_zh: principalNameZh.trim() || FIELD_GHOST_SAMPLES.principal_name_zh,
    principal_name_en: principalNameEn.trim() || FIELD_GHOST_SAMPLES.principal_name_en,
    principal_title_zh: principalTitleZh.trim() || FIELD_GHOST_SAMPLES.principal_title_zh,
    principal_title_en: principalTitleEn.trim() || FIELD_GHOST_SAMPLES.principal_title_en,
    schoolName: schoolName || FIELD_GHOST_SAMPLES.schoolName,
    date: issueDate || FIELD_GHOST_SAMPLES.date,
  });

  useEffect(() => {
    if (configHydrated.current) return;
    configHydrated.current = true;
    if (!initialConfig && !bgImageUrl && !templateId) return;

    if (initialConfig?.activityId) {
      setActivityId(Number(initialConfig.activityId));
    }
    const cfgAny = initialConfig as Record<string, unknown> | null | undefined;
    let aZh = String(cfgAny?.awardTitleZh ?? cfgAny?.award_title_zh ?? "").trim();
    let aEn = String(cfgAny?.awardTitleEn ?? cfgAny?.award_title_en ?? "").trim();
    let aCombined = String(cfgAny?.awardTitle ?? cfgAny?.award_title ?? "").trim();
    if (isDocumentTitleNotAward(aZh)) aZh = "";
    if (isDocumentTitleNotAward(aEn)) aEn = "";
    if (isDocumentTitleNotAward(aCombined)) aCombined = "";
    if (aZh || aEn) {
      if (aZh) setAwardTitleZh(aZh);
      if (aEn) setAwardTitleEn(aEn);
    } else if (aCombined) {
      const [zhPart, enPart] = splitZhEn(aCombined);
      if (zhPart) setAwardTitleZh(zhPart);
      if (enPart) setAwardTitleEn(enPart);
      else if (zhPart === "" && enPart === "" && aCombined) setAwardTitleZh(aCombined);
    }
    const pNameZh = String(cfgAny?.principal_name_zh ?? cfgAny?.principalNameZh ?? "").trim();
    const pNameEn = String(cfgAny?.principal_name_en ?? cfgAny?.principalNameEn ?? "").trim();
    const pTitleZh = String(cfgAny?.principal_title_zh ?? cfgAny?.principalTitleZh ?? "").trim();
    const pTitleEn = String(cfgAny?.principal_title_en ?? cfgAny?.principalTitleEn ?? "").trim();
    if (pNameZh) setPrincipalNameZh(pNameZh);
    if (pNameEn) setPrincipalNameEn(pNameEn);
    if (pTitleZh) setPrincipalTitleZh(pTitleZh);
    if (pTitleEn) setPrincipalTitleEn(pTitleEn);
    if (initialConfig?.issueDate) {
      setIssueDate(String(initialConfig.issueDate));
    }
    const ori = String(initialConfig?.orientation || "").toLowerCase();
    if (ori === "portrait" || ori === "landscape") {
      setOrientation(ori);
    }

    const bg = bgImageUrl || (initialConfig?.templateBg ? String(initialConfig.templateBg) : "");
    if (bg) {
      setTemplateBg(bg);
      setTemplateUploaded(true);
    }

    const saved = initialConfig?.fields;
    if (Array.isArray(saved) && saved.length > 0) {
      setPlacedFields(clampFieldsToCanvas(saved.map((f, i) => placedFromConfig(f, i, customFieldsProp))));
    } else if (templateId) {
      setPlacedFields([]);
    }
  }, [initialConfig, bgImageUrl, templateId, customFieldsProp]);

  // Inject Google Fonts once for canvas preview of web typefaces
  useEffect(() => {
    ensureCertGoogleFonts();
  }, []);

  const buildPdfFields = () => placedFields.map(f => {
    const style = {
      fontFamily: f.fontFamily || DEFAULT_FONT_FAMILY,
      fontSize: f.fontSize || DEFAULT_FONT_SIZE,
      isBold: !!f.isBold,
      isItalic: !!f.isItalic,
      isUnderline: !!f.isUnderline,
      letterSpacing: Number.isFinite(f.letterSpacing) ? f.letterSpacing : DEFAULT_LETTER_SPACING,
      lineHeight: Number.isFinite(f.lineHeight) && f.lineHeight > 0 ? f.lineHeight : DEFAULT_LINE_HEIGHT,
      lineStyle: f.lineStyle || DEFAULT_LINE_STYLE,
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

  const patchSelectedStyle = (
    patch: Partial<Pick<PlacedField, "fontFamily" | "fontSize" | "isBold" | "isItalic" | "isUnderline" | "letterSpacing" | "lineHeight" | "lineStyle">>,
  ) => {
    if (!selectedFieldId) return;
    pushHistory();
    setPlacedFields(prev => prev.map(f => {
      if (f.id !== selectedFieldId) return f;
      const next = { ...f, ...patch };
      // Keep text ghost height in sync with typography (single-line tight wrap)
      if (isTextLikeField(next) && (patch.fontSize !== undefined || patch.lineHeight !== undefined)) {
        next.h = textFieldHeightPct(next.fontSize, next.lineHeight, a4.h);
        next.y = Math.max(0, Math.min(100 - next.h, next.y));
      }
      return next;
    }));
  };

  const fontGroups = React.useMemo(() => {
    const groups: { group: string; fonts: FontOpt[] }[] = [];
    for (const f of CERT_FONTS) {
      const last = groups[groups.length - 1];
      if (last && last.group === f.group) last.fonts.push(f);
      else groups.push({ group: f.group, fonts: [f] });
    }
    return groups;
  }, []);

  const handleSaveTemplate = async (): Promise<boolean> => {
    if (!saveTemplateUrl) {
      setSaveMsg("此範本尚未可儲存");
      return false;
    }
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
          award_title_zh: awardTitleZh.trim(),
          award_title_en: awardTitleEn.trim(),
          principal_name_zh: principalNameZh.trim(),
          principal_name_en: principalNameEn.trim(),
          principal_title_zh: principalTitleZh.trim(),
          principal_title_en: principalTitleEn.trim(),
          issue_date: issueDate,
          template_bg: templateBg || undefined,
          orientation,
          fields: buildPdfFields(),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        throw new Error(json?.message || `儲存失敗 (${res.status})`);
      }
      setSaveMsg(json.message || "範本已儲存");
      return true;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "儲存失敗";
      setSaveMsg(msg);
      return false;
    } finally {
      setSavingTemplate(false);
    }
  };

  const handlePreviewPdf = async () => {
    if (!templateId) {
      window.alert("請先建立並儲存範本後再預覽。");
      return;
    }
    setPreviewing(true);
    setSaveMsg(null);
    try {
      const ok = await handleSaveTemplate();
      if (!ok) return;
      const base = previewUrlBase.replace(/\/$/, "");
      window.open(`${base}/${templateId}`, "_blank", "noopener,noreferrer");
    } finally {
      setPreviewing(false);
    }
  };

  // Debounced CI4 autosave after undo/redo — avoids racing rapid history steps
  useEffect(() => {
    if (!autosaveAfterHistoryRef.current || !saveTemplateUrl) return;
    const timer = window.setTimeout(() => {
      autosaveAfterHistoryRef.current = false;
      void handleSaveTemplate();
    }, 1000);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally keyed to canvas snapshot
  }, [placedFields, orientation, historyTick, saveTemplateUrl]);

  // Global Cmd/Ctrl+Z / Shift+Z / Y — skip when typing in inputs
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase() || "";
      if (tag === "input" || tag === "textarea" || tag === "select" || target?.isContentEditable) {
        return;
      }
      const key = e.key.toLowerCase();
      if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }
      if ((key === "z" && e.shiftKey) || key === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  const handleDeleteCustomField = async (cf: CertCustomField) => {
    if (!window.confirm("確定移除此自訂欄位？")) return;
    try {
      const res = await fetch(`${customFieldsUrl.replace(/\/$/, "")}/${cf.id}/delete`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        window.alert(json?.message || "刪除失敗");
        return;
      }
      setCustomFields(prev => prev.filter(f => f.id !== cf.id));
      pushHistory();
      setPlacedFields(prev => {
        const next = prev.filter(f => f.varKey !== cf.field_name);
        setSelectedFieldId(cur => (cur && next.some(f => f.id === cur) ? cur : null));
        return next;
      });
    } catch {
      window.alert("網絡錯誤，無法刪除欄位");
    }
  };

  const addFieldToCanvas = (varDef: VarField, allowDuplicate = false) => {
    const alreadyPlaced = placedFields.some(f => f.varKey === varDef.key);
    if (alreadyPlaced && !allowDuplicate) return;
    pushHistory();
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
      defaultH: 3,
      type: "static_text",
      // Empty value — the solid lineStyle draws the line (never literal "_" glyphs)
      value: "",
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
    pushHistory();
    setPlacedFields(prev => prev.filter(f => f.id !== id));
    if (selectedFieldId === id) setSelectedFieldId(null);
  };

  const resetCanvas = () => {
    pushHistory();
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
    dragHistorySnapshotRef.current = HistoryManager.clone({ fields: placedFields, orientation });
    interactionDirtyRef.current = false;
    draggingRef.current = {
      id,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startFieldX: field.x,
      startFieldY: field.y,
    };
  }, [placedFields, orientation]);

  const handleResizePointerDown = useCallback((e: React.PointerEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedFieldId(id);
    const field = placedFields.find(f => f.id === id);
    if (!field) return;
    dragHistorySnapshotRef.current = HistoryManager.clone({ fields: placedFields, orientation });
    interactionDirtyRef.current = false;
    resizingRef.current = {
      id,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startW: field.w,
      startH: field.h,
    };
  }, [placedFields, orientation]);

  const handleCanvasPointerMove = useCallback((e: React.PointerEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    if (resizingRef.current) {
      const { id, startMouseX, startMouseY, startW, startH } = resizingRef.current;
      const dw = ((e.clientX - startMouseX) / rect.width) * 100;
      const dh = ((e.clientY - startMouseY) / rect.height) * 100;
      if (Math.abs(dw) > 0.05 || Math.abs(dh) > 0.05) interactionDirtyRef.current = true;
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
    if (Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05) interactionDirtyRef.current = true;
    setPlacedFields(prev => prev.map(f => f.id === id
      ? { ...f, x: Math.max(0, Math.min(100 - f.w, startFieldX + dx)), y: Math.max(0, Math.min(100 - f.h, startFieldY + dy)) }
      : f
    ));
  }, []);

  const handleCanvasPointerUp = useCallback(() => {
    const wasInteracting = !!(draggingRef.current || resizingRef.current);
    const snap = dragHistorySnapshotRef.current;
    const dirty = interactionDirtyRef.current;
    draggingRef.current = null;
    resizingRef.current = null;
    dragHistorySnapshotRef.current = null;
    interactionDirtyRef.current = false;
    // Commit pre-drag snapshot once a real drag/resize finishes (dragend)
    if (wasInteracting && dirty && snap && !historyRef.current.isApplying) {
      historyRef.current.saveState(snap);
      setHistoryTick(t => t + 1);
    }
  }, []);

  // Students (loaded via AJAX when activity changes)
  const [students, setStudents] = useState<CertStudentRow[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
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
              attendanceCount: Math.max(0, Number(s.attendance_count ?? s.attendanceCount ?? 0) || 0),
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
  /** Global Variables accordion — React-driven collapse (no Bootstrap JS) */
  const [isGlobalVarsOpen, setIsGlobalVarsOpen] = useState(false);
  const globalVarsPanelRef = useRef<HTMLDivElement>(null);
  const awardZhInputRef = useRef<HTMLInputElement>(null);
  const awardEnInputRef = useRef<HTMLInputElement>(null);
  const issueDateInputRef = useRef<HTMLInputElement>(null);
  const principalZhInputRef = useRef<HTMLInputElement>(null);

  const openGlobalVarsAndFocus = (focus?: "awardZh" | "awardEn" | "date" | "principal") => {
    setIsGlobalVarsOpen(true);
    window.setTimeout(() => {
      globalVarsPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      const el =
        focus === "awardEn" ? awardEnInputRef.current
        : focus === "date" ? issueDateInputRef.current
        : focus === "principal" ? principalZhInputRef.current
        : awardZhInputRef.current;
      el?.focus();
    }, 80);
  };

  const handleGenerate = async () => {
    if (activityId == null || selectedStudents.size === 0 || placedFields.length === 0) return;

    // Required globals — open accordion if incomplete so user sees the fields
    if (!awardTitleZh.trim()) {
      setGenError("請填寫獎項名稱 (中)。");
      openGlobalVarsAndFocus("awardZh");
      return;
    }
    if (!awardTitleEn.trim()) {
      setGenError("請填寫獎項名稱 (英)。");
      openGlobalVarsAndFocus("awardEn");
      return;
    }
    if (!issueDate.trim()) {
      setGenError("請選擇證書日期。");
      openGlobalVarsAndFocus("date");
      return;
    }
    if (!principalNameZh.trim() && !principalNameEn.trim()) {
      setGenError("請填寫校長姓名。");
      openGlobalVarsAndFocus("principal");
      return;
    }

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
          award_title_zh: awardTitleZh.trim(),
          award_title_en: awardTitleEn.trim(),
          issue_date: issueDate,
          school_name: schoolName || undefined,
          principal_name_zh: principalNameZh.trim(),
          principal_name_en: principalNameEn.trim(),
          principal_title_zh: principalTitleZh.trim(),
          principal_title_en: principalTitleEn.trim(),
          principal_name: principalNameZh.trim() || principalName || undefined,
          principal_title: principalTitleZh.trim() || principalTitle || undefined,
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
          orientation,
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
        {/* Title row */}
        <div style={{ minHeight: 56, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", paddingTop: 8, paddingBottom: 8 }}>
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
          display: "flex", flexDirection: "column", overflow: "hidden", overflowX: "hidden",
          flexShrink: 0, minWidth: 0, maxWidth: "100%",
        }}>
          {/* Palette header */}
          <div style={{ padding: "12px 14px 8px", borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: T.text4, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              動態欄位 · Variables
            </div>
            <div style={{ fontSize: 10.5, color: T.text4, marginTop: 2 }}>點擊 → 放置於底圖</div>
          </div>

          {/* Field chips */}
          <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "10px 10px 14px", minWidth: 0 }}>
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

            {/* Signatories — bilingual principal */}
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: T.text4, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>
                簽署人 · Signatories
              </div>
              <div style={{ fontSize: 10, color: T.text4, marginBottom: 8 }}>校長姓名與職稱（中／英獨立）</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {SIGNATORY_FIELDS.map(v => {
                  const isPlaced = placedFields.some(f => f.varKey === v.key);
                  return (
                    <button
                      key={v.key}
                      type="button"
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
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${T.border}`, minWidth: 0, overflow: "hidden" }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: T.text4, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>
                自訂欄位 · Custom Variables
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
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
                    <div
                      key={cf.id}
                      className="d-flex align-items-center"
                      style={{ display: "flex", alignItems: "stretch", gap: 4, minWidth: 0, maxWidth: "100%", overflow: "hidden" }}
                    >
                      <button
                        type="button"
                        onClick={() => addFieldToCanvas(v)}
                        disabled={isPlaced}
                        title={cf.display_label}
                        style={{
                          flex: "1 1 0%", minWidth: 0, maxWidth: "100%",
                          display: "flex", alignItems: "center", gap: 8,
                          padding: "7px 10px",
                          border: `1.5px ${isPlaced ? "solid" : "dashed"} ${v.border}`,
                          borderRadius: 8,
                          background: isPlaced ? v.bg : "transparent",
                          color: v.color, cursor: isPlaced ? "default" : "pointer",
                          fontFamily: F, fontSize: 11.5, fontWeight: 600,
                          opacity: isPlaced ? 0.6 : 1, textAlign: "left",
                          overflow: "hidden",
                        }}
                      >
                        <span className="flex-shrink-0" style={{ flexShrink: 0 }}>{v.icon}</span>
                        <div className="text-truncate flex-grow-1" style={{ flex: "1 1 0%", minWidth: 0, overflow: "hidden" }}>
                          <div
                            className="text-truncate"
                            title={cf.display_label}
                            style={{
                              fontSize: 11.5, fontWeight: 700,
                              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                            }}
                          >
                            {cf.display_label}
                          </div>
                          <div
                            className="text-truncate"
                            title={cf.field_name}
                            style={{
                              fontSize: 9.5, color: T.text4,
                              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                            }}
                          >
                            {cf.field_name}
                          </div>
                        </div>
                        <span className="flex-shrink-0" style={{ flexShrink: 0 }}>
                          {isPlaced ? <CheckCircle2 size={11} /> : <Plus size={11} style={{ opacity: 0.6 }} />}
                        </span>
                      </button>
                      <button
                        type="button"
                        title="刪除自訂欄位"
                        aria-label={`刪除 ${cf.display_label}`}
                        className="bi bi-trash text-danger flex-shrink-0"
                        onClick={() => { void handleDeleteCustomField(cf); }}
                        style={{
                          flexShrink: 0, flexGrow: 0, width: 32, minWidth: 32,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          border: `1px solid ${T.redBd}`, borderRadius: 8,
                          background: T.redPale, cursor: "pointer", padding: 0,
                        }}
                      >
                        <Trash2 size={13} color={T.red} />
                      </button>
                    </div>
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
                  <FontFamilyPicker
                    value={selectedField.fontFamily || DEFAULT_FONT_FAMILY}
                    groups={fontGroups}
                    onChange={fontKey => patchSelectedStyle({ fontFamily: fontKey })}
                  />
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
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  <div>
                    <div style={{ fontSize: 10, color: T.text4, marginBottom: 3 }}>字距 Letter Spacing (px)</div>
                    <input
                      type="number"
                      min={-5}
                      max={40}
                      step={0.5}
                      value={selectedField.letterSpacing ?? DEFAULT_LETTER_SPACING}
                      onChange={e => {
                        const n = Number(e.target.value);
                        if (!Number.isFinite(n)) return;
                        patchSelectedStyle({ letterSpacing: Math.max(-5, Math.min(40, n)) });
                      }}
                      style={{ width: "100%", padding: "5px 8px", fontSize: 11, border: `1px solid ${T.border}`, borderRadius: 6, fontFamily: F, color: T.text2, background: T.surface, outline: "none", boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: T.text4, marginBottom: 3 }}>行距 Line Spacing</div>
                    <input
                      type="number"
                      min={0.8}
                      max={3}
                      step={0.1}
                      value={selectedField.lineHeight ?? DEFAULT_LINE_HEIGHT}
                      onChange={e => {
                        const n = Number(e.target.value);
                        if (!Number.isFinite(n)) return;
                        patchSelectedStyle({ lineHeight: Math.max(0.8, Math.min(3, Math.round(n * 10) / 10)) });
                      }}
                      style={{ width: "100%", padding: "5px 8px", fontSize: 11, border: `1px solid ${T.border}`, borderRadius: 6, fontFamily: F, color: T.text2, background: T.surface, outline: "none", boxSizing: "border-box" }}
                    />
                  </div>
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
                <div>
                  <div style={{ fontSize: 10, color: T.text4, marginBottom: 3 }}>欄位底線 Border / Line Style</div>
                  <div style={{ display: "flex", gap: 4 }}>
                    {LINE_STYLE_OPTIONS.map(opt => {
                      const active = (selectedField.lineStyle || DEFAULT_LINE_STYLE) === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          title={opt.hint}
                          onClick={() => patchSelectedStyle({ lineStyle: opt.value })}
                          style={{
                            flex: 1, padding: "5px 2px",
                            border: `1px solid ${active ? T.purple : T.border}`,
                            borderRadius: 5,
                            background: active ? T.purplePale : "transparent",
                            fontSize: 10, fontWeight: active ? 700 : 500,
                            color: active ? T.purple : T.text2,
                            cursor: "pointer", fontFamily: F, lineHeight: 1.25,
                          }}
                        >
                          <div>{opt.label.split(" ")[0]}</div>
                          <div style={{
                            margin: "4px 6px 0", height: 0,
                            borderBottom: opt.value === "solid" ? "1.5px solid #000"
                              : opt.value === "dotted" ? "2px dotted #000"
                              : "1px solid transparent",
                          }} />
                        </button>
                      );
                    })}
                  </div>
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

            <button
              id="btn-preview-pdf"
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={() => { void handlePreviewPdf(); }}
              disabled={previewing || savingTemplate || !templateId}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "6px 12px", border: `1px solid ${T.border}`, borderRadius: 7,
                background: previewing ? T.purplePale : "transparent",
                color: previewing ? T.purple : T.text2,
                fontSize: 11.5, fontWeight: 600, fontFamily: F,
                cursor: (previewing || savingTemplate || !templateId) ? "not-allowed" : "pointer",
                opacity: !templateId ? 0.55 : 1,
              }}
            >
              <Eye size={13} />
              {previewing || savingTemplate ? "⏳ 儲存並產生中..." : "預覽 (Preview)"}
            </button>

            {/* Undo / Redo — between Preview and Zoom */}
            <button
              id="btn-undo"
              type="button"
              className="btn btn-outline-secondary btn-sm"
              title="復原 Undo (Ctrl/⌘+Z)"
              onClick={() => undo()}
              disabled={!canUndo}
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "6px 10px", border: `1px solid ${T.border}`, borderRadius: 7,
                background: "transparent", color: canUndo ? T.text2 : T.text4,
                fontSize: 11.5, fontWeight: 600, fontFamily: F,
                cursor: canUndo ? "pointer" : "not-allowed",
                opacity: canUndo ? 1 : 0.45,
              }}
            >
              <Undo2 size={13} /> 復原
            </button>
            <button
              id="btn-redo"
              type="button"
              className="btn btn-outline-secondary btn-sm"
              title="重做 Redo (Ctrl/⌘+Shift+Z)"
              onClick={() => redo()}
              disabled={!canRedo}
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "6px 10px", border: `1px solid ${T.border}`, borderRadius: 7,
                background: "transparent", color: canRedo ? T.text2 : T.text4,
                fontSize: 11.5, fontWeight: 600, fontFamily: F,
                cursor: canRedo ? "pointer" : "not-allowed",
                opacity: canRedo ? 1 : 0.45,
              }}
            >
              <Redo2 size={13} /> 重做
            </button>

            <div style={{ width: 1, height: 20, background: T.border }} />

            {/* Orientation toggle */}
            <div style={{ display: "inline-flex", border: `1px solid ${T.border}`, borderRadius: 7, overflow: "hidden" }} role="group" aria-label="Orientation">
              {([
                { key: "landscape" as const, label: "橫向 Landscape" },
                { key: "portrait" as const, label: "縱向 Portrait" },
              ]).map(o => {
                const active = orientation === o.key;
                return (
                  <button
                    key={o.key}
                    type="button"
                    onClick={() => switchOrientation(o.key)}
                    style={{
                      padding: "5px 11px", border: "none",
                      background: active ? T.purplePale : "transparent",
                      color: active ? T.purple : T.text3,
                      fontSize: 11, fontWeight: active ? 700 : 500,
                      cursor: "pointer", fontFamily: F,
                      borderRight: o.key === "landscape" ? `1px solid ${T.border}` : "none",
                    }}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>

            {/* Zoom selector */}
            <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, color: T.text3, fontFamily: F }}>
              縮放 Zoom
              <select
                value={zoom}
                onChange={e => setZoom(Number(e.target.value))}
                style={{
                  padding: "5px 8px", border: `1px solid ${T.border}`, borderRadius: 6,
                  fontSize: 11, fontFamily: F, color: T.text2, background: T.surface, cursor: "pointer",
                }}
              >
                {ZOOM_OPTIONS.map(z => (
                  <option key={z} value={z}>{z}%</option>
                ))}
              </select>
            </label>

            <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ fontSize: 10, color: T.text4, fontFamily: F }}>
                A4 {orientation === "landscape" ? "297×210mm" : "210×297mm"} · {a4.w}×{a4.h}px
              </span>
              <button onClick={resetCanvas} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", border: `1px solid ${T.border}`, borderRadius: 6, background: "transparent", color: T.text3, fontSize: 11, cursor: "pointer", fontFamily: F }}>
                <RotateCcw size={12} /> 重置
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 6, background: T.emeraldPale, border: `1px solid ${T.emeraldBd}` }}>
                <CheckCircle2 size={11} color={T.emerald} />
                <span style={{ fontSize: 10.5, fontWeight: 700, color: T.emerald }}>{placedFields.length} 欄位已放置</span>
              </div>
            </div>
          </div>

          {/* Canvas area — fixed A4 stage scaled via CSS transform */}
          <div
            className="canvas-wrapper"
            style={{
              flex: 1, overflow: "auto", background: "#F0F2F5",
              textAlign: "center", padding: "12px 16px 24px",
            }}
          >
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
                  width: "100%", maxWidth: 640, minHeight: 360, margin: "20px auto",
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
              /* Fixed A4 stage + scaled scroll spacer */
              <div style={{ width: "100%", userSelect: "none" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 8 }}>
                  <Move size={12} color={T.text4} />
                  <span style={{ fontSize: 10.5, color: T.text4, fontFamily: F }}>
                    拖動虛線框調整位置（座標以 A4 絕對百分比儲存）· Zoom {zoom}%
                  </span>
                </div>

                {/* Spacer preserves scroll area under CSS scale */}
                <div
                  style={{
                    width: a4.w * zoomScale + 40,
                    height: a4.h * zoomScale + 40,
                    margin: "0 auto",
                    position: "relative",
                  }}
                >
                  <div
                    ref={canvasRef}
                    className="a4-canvas"
                    onPointerMove={handleCanvasPointerMove}
                    onPointerUp={handleCanvasPointerUp}
                    onPointerLeave={handleCanvasPointerUp}
                    onClick={() => setSelectedFieldId(null)}
                    style={{
                      position: "absolute",
                      top: 20,
                      left: 20,
                      width: a4.w,
                      height: a4.h,
                      background: "#fff",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      transform: `scale(${zoomScale})`,
                      transformOrigin: "top left",
                      overflow: "hidden",
                      cursor: draggingRef.current ? "grabbing" : "default",
                    }}
                  >
                  {/* Certificate base fills exact A4 stage */}
                  {templateBg ? (
                    <img
                      src={templateBg}
                      alt="Certificate template"
                      draggable={false}
                      style={{
                        position: "absolute", inset: 0,
                        width: "100%", height: "100%",
                        objectFit: "fill", display: "block",
                        pointerEvents: "none",
                      }}
                    />
                  ) : (
                    <div style={{ position: "absolute", inset: 0 }}>
                      <CertBaseTemplate
                        schoolLogoUrl={schoolLogoUrl}
                        schoolName={schoolName}
                        principalName={principalNameZh || principalName}
                        principalTitle={
                          [principalTitleZh, principalTitleEn].map(s => s.trim()).filter(Boolean).join(" / ")
                          || principalTitle
                        }
                      />
                    </div>
                  )}

                  {/* Ghost field overlays — % of fixed A4, containment via clamp */}
                  {placedFields.map(field => {
                    const vd = getVarDef(field.varKey);
                    const color = field.color || vd?.color || T.blue;
                    const bg = field.bg || vd?.bg || T.bluePale;
                    const label = field.label || vd?.label || field.varKey;
                    const labelEn = field.labelEn || vd?.labelEn || "";
                    const isSelected = selectedFieldId === field.id;
                    const isSeal = field.varKey === "sealSpace";
                    const isImage = field.type === "image";
                    const isLineOnly = field.varKey === "signSpace" || field.varKey === "signatureLine";
                    const displayFs = field.fontSize || DEFAULT_FONT_SIZE;
                    const displayLh = field.lineHeight || DEFAULT_LINE_HEIGHT;
                    const displayLs = field.letterSpacing ?? DEFAULT_LETTER_SPACING;
                    const ghosts = liveGhostSamples();
                    const textContent = (() => {
                      if (isLineOnly) return "\u00A0";
                      if (field.type === "static_text" || field.type === "custom") {
                        const v = (field.value || "").trim();
                        if (!v || /^[_＿—–\s-]+$/u.test(v)) return "\u00A0";
                        return field.value || ghosts[field.varKey] || `[${label}]`;
                      }
                      // Dynamic vars: live sidebar values so canvas matches PDF 1:1
                      return ghosts[field.varKey] || FIELD_GHOST_SAMPLES[field.varKey] || `[${label}]`;
                    })();
                    return (
                      <div
                        key={field.id}
                        className="ghost-box canvas-element"
                        onPointerDown={e => handleFieldPointerDown(e, field.id)}
                        onClick={e => { e.stopPropagation(); setSelectedFieldId(field.id); }}
                        style={{
                          position: "absolute",
                          left: `${field.x}%`,
                          top:  `${field.y}%`,
                          width: `${field.w}%`,
                          height: `${field.h}%`,
                          border: `1.5px dashed ${color}`,
                          borderRadius: isSeal ? "50%" : 3,
                          background: isImage ? "rgba(255,255,255,0.85)" : `${bg}99`,
                          cursor: "grab",
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "center",
                          overflow: "visible",
                          boxShadow: isSelected ? `0 0 0 2px ${color}40, 0 2px 8px ${color}30` : "none",
                          transition: "box-shadow 0.12s",
                          zIndex: isSelected ? 20 : 10,
                          padding: isImage || isSeal ? 2 : "2px 4px",
                          boxSizing: "border-box",
                          lineHeight: 1,
                        }}
                      >
                        {isImage && field.src ? (
                          <img
                            src={field.src}
                            alt={label}
                            draggable={false}
                            style={{ width: "100%", height: "100%", objectFit: "contain", pointerEvents: "none", borderRadius: 2 }}
                          />
                        ) : isSeal ? (
                          <div style={{ fontSize: 10, color, opacity: 0.7, fontFamily: F, pointerEvents: "none" }}>{label}</div>
                        ) : (
                          <div style={{
                            fontSize: displayFs,
                            fontWeight: field.isBold ? 800 : 600,
                            fontStyle: field.isItalic ? "italic" : "normal",
                            textDecoration: field.isUnderline ? "underline" : "none",
                            fontFamily: cssFontFamily(field.fontFamily || DEFAULT_FONT_FAMILY),
                            color,
                            lineHeight: displayLh,
                            letterSpacing: `${displayLs}px`,
                            textAlign: "center",
                            padding: 0,
                            margin: 0,
                            width: "100%",
                            boxSizing: "border-box",
                            pointerEvents: "none",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            ...fieldLineCss(field.lineStyle || DEFAULT_LINE_STYLE),
                          }}>
                            {textContent}
                          </div>
                        )}

                        {/* Field label chip — outside the text metrics, only when selected */}
                        {isSelected && !isImage && (
                          <div style={{
                            position: "absolute", left: 0, top: "100%", marginTop: 2,
                            fontSize: 8, color: "#fff", background: color, borderRadius: 3,
                            padding: "1px 5px", fontFamily: F, whiteSpace: "nowrap",
                            pointerEvents: "none", opacity: 0.95,
                          }}>
                            {label}{labelEn ? ` · ${labelEn}` : ""}
                          </div>
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
                  </div>{/* .a4-canvas */}
                </div>{/* scale spacer */}

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

        {/* ── RIGHT: Global vars accordion + roster + sticky CTA ───────────── */}
        <div style={{
          background: T.surface,
          borderLeft: isMobile ? "none" : `1px solid ${T.border}`,
          borderTop: isMobile ? `1px solid ${T.border}` : "none",
          display: "flex", flexDirection: "column",
          overflow: "hidden", flexShrink: 0, minHeight: 0,
          position: "relative",
        }}>
          {/* 1) React-state accordion — NEVER use Tailwind class "collapse" (visibility:collapse hides body) */}
          <style>{`
            .sts-gvars-acc .accordion-button {
              width: 100%; display: flex; align-items: center; gap: 8px;
              font-size: 12px; font-weight: 800; font-family: ${F};
              padding: 11px 14px; box-shadow: none !important;
              background: ${T.surface}; color: ${T.text2};
              border: none; border-bottom: 1px solid ${T.border};
              cursor: pointer; text-align: left;
            }
            .sts-gvars-acc .accordion-button:not(.collapsed) {
              background: ${T.bg}; color: ${T.text2};
            }
            .sts-gvars-acc .accordion-button::after {
              content: ""; flex-shrink: 0; margin-left: auto;
              width: 0.75rem; height: 0.75rem;
              background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%236b7280'%3e%3cpath fill-rule='evenodd' d='M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z'/%3e%3c/svg%3e");
              background-repeat: no-repeat; background-size: 0.75rem;
              transition: transform 0.15s ease;
            }
            .sts-gvars-acc .accordion-button:not(.collapsed)::after {
              transform: rotate(-180deg);
            }
            .sts-gvars-acc .accordion-item { border: none; background: ${T.surface}; }
            .sts-gvars-acc .accordion-header { margin: 0; font-size: 12px; }
            .sts-gvars-acc .accordion-body.bg-light {
              padding: 0.5rem 0.875rem 0.875rem;
              background: ${T.bg} !important;
              border-bottom: 1px solid ${T.border};
            }
            .sts-gvars-acc .form-label {
              display: block; margin-bottom: 0.25rem;
              font-size: 10px; font-weight: 700; color: ${T.text3};
            }
            .sts-gvars-acc .form-control {
              display: block; width: 100%; padding: 0.35rem 0.6rem;
              font-size: 12px; font-family: ${F}; line-height: 1.4;
              color: ${T.text1}; background: ${T.surface};
              border: 1px solid ${T.border}; border-radius: 7px;
              box-sizing: border-box; outline: none;
            }
            .sts-gvars-acc .form-control-sm { font-size: 12px; }
            .sts-gvars-acc .mb-1 { margin-bottom: 0.25rem; }
            .sts-gvars-acc .mb-2 { margin-bottom: 0.5rem; }
            .sts-gvars-acc .mt-3 { margin-top: 0.75rem; }
            .sts-gvars-acc .pt-2 { padding-top: 0.5rem; }
            .sts-gvars-acc .pb-3 { padding-bottom: 0.75rem; }
            .sts-gvars-acc .fw-bold { font-weight: 700; }
            .sts-gvars-acc .text-muted { color: ${T.text3}; }
            .sts-gvars-acc .small { font-size: 10px; }
          `}</style>
          <div
            ref={globalVarsPanelRef}
            className="accordion mb-3 sts-gvars-acc"
            style={{ flexShrink: 0, background: T.surface }}
          >
            <div className="accordion-item">
              <h2 className="accordion-header">
                <button
                  className={`accordion-button ${!isGlobalVarsOpen ? "collapsed" : ""}`}
                  type="button"
                  aria-expanded={isGlobalVarsOpen}
                  onClick={() => setIsGlobalVarsOpen(open => !open)}
                >
                  ⚙️ 全域變數設定 (Global Variables)
                </button>
              </h2>
              {isGlobalVarsOpen && (
                <div className="accordion-body bg-light pt-2 pb-3">
                  <div className="mb-2">
                    <label className="form-label text-muted small fw-bold mb-1">獎項名稱 (中) Award Title (ZH)</label>
                    <input
                      ref={awardZhInputRef}
                      type="text"
                      className="form-control form-control-sm"
                      name="awardTitleZh"
                      value={awardTitleZh || ""}
                      onChange={e => setAwardTitleZh(e.target.value)}
                      placeholder="e.g., 金獎"
                    />
                  </div>
                  <div className="mb-2">
                    <label className="form-label text-muted small fw-bold mb-1">獎項名稱 (英) Award Title (EN)</label>
                    <input
                      ref={awardEnInputRef}
                      type="text"
                      className="form-control form-control-sm"
                      name="awardTitleEn"
                      value={awardTitleEn || ""}
                      onChange={e => setAwardTitleEn(e.target.value)}
                      placeholder="e.g., Gold Award"
                    />
                  </div>

                  <div className="mb-2 mt-3">
                    <label className="form-label text-muted small fw-bold mb-1">日期 Date</label>
                    <input
                      ref={issueDateInputRef}
                      type="date"
                      className="form-control form-control-sm"
                      name="date"
                      value={issueDate || ""}
                      onChange={e => setIssueDate(e.target.value)}
                    />
                  </div>

                  <div className="mb-2 mt-3">
                    <label className="form-label text-muted small fw-bold mb-1">校長姓名 (中) Principal (ZH)</label>
                    <input
                      ref={principalZhInputRef}
                      type="text"
                      className="form-control form-control-sm"
                      name="principalZh"
                      value={principalNameZh || ""}
                      onChange={e => setPrincipalNameZh(e.target.value)}
                      placeholder="林佩儀"
                    />
                  </div>
                  <div className="mb-2">
                    <label className="form-label text-muted small fw-bold mb-1">校長姓名 (英) Principal (EN)</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      name="principalEn"
                      value={principalNameEn || ""}
                      onChange={e => setPrincipalNameEn(e.target.value)}
                      placeholder="Ms. Lam Pui Yee"
                    />
                  </div>

                  <div className="mb-2 mt-3">
                    <label className="form-label text-muted small fw-bold mb-1">職稱 (中) Title (ZH)</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      name="titleZh"
                      value={principalTitleZh || ""}
                      onChange={e => setPrincipalTitleZh(e.target.value)}
                      placeholder="校長"
                    />
                  </div>
                  <div className="mb-2">
                    <label className="form-label text-muted small fw-bold mb-1">職稱 (英) Title (EN)</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      name="titleEn"
                      value={principalTitleEn || ""}
                      onChange={e => setPrincipalTitleEn(e.target.value)}
                      placeholder="Principal"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 2) Student roster header — prominent, directly under accordion */}
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

          {/* 3) Scrollable student list only — sidebar chrome stays fixed */}
          <div style={{
            flexGrow: 1,
            overflowY: "auto",
            minHeight: 0,
            maxHeight: isMobile ? undefined : "calc(100vh - 350px)",
          }}>
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
                  <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                    <span style={{ padding: "1px 6px", borderRadius: 5, background: pal.bg, border: `1px solid ${pal.bd}`, fontSize: 10, fontWeight: 700, color: pal.color }}>{s.cls}</span>
                    <span
                      className="badge bg-secondary-subtle text-secondary rounded-pill"
                      title="報到次數"
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 3,
                        padding: "2px 7px", borderRadius: 999,
                        background: s.attendanceCount > 0 ? T.emeraldPale : "#F1F5F9",
                        border: `1px solid ${s.attendanceCount > 0 ? T.emeraldBd : T.border}`,
                        color: s.attendanceCount > 0 ? T.emerald : T.text4,
                        fontSize: 10, fontWeight: 700, fontFamily: F,
                      }}
                    >
                      <CheckCircle2 size={10} />
                      {s.attendanceCount}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 4) Sticky footer — Save / Generate always visible */}
          <div style={{
            padding: "14px 16px",
            borderTop: `1px solid ${T.border}`,
            flexShrink: 0,
            background: "#fff",
            position: "sticky",
            bottom: 0,
            zIndex: 10,
            boxShadow: "0 -4px 12px rgba(15,23,42,0.06)",
          }}>

            <div style={{ display: "flex", gap: 8, padding: "9px 12px", background: T.bluePale, border: `1px solid ${T.blueBd}`, borderRadius: T.radius, marginBottom: 12 }}>
              <FileText size={13} color={T.blue} style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 10.5, color: "#1D4ED8", lineHeight: 1.6 }}>
                <strong>系統將自動映射姓名</strong>並保留校印 / 簽名位置。<br />
                <span style={{ color: "#3B82F6", opacity: 0.9 }}>System will auto-map names and preserve seal/signature zones for physical stamps.</span>
              </div>
            </div>

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
