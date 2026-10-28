// ─────────────────────────────────────────────────────────────────────────────
// Screen_BatchOCR — 證書批次上傳與審核 (Batch Certificate Upload & Review)
// ERP v3.0 · zh-HK / EN bilingual
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Sparkles, CheckCircle2, Star, User, Search, Trash2,
  ChevronRight, ChevronLeft, Save, ArrowRight,
  AlertCircle, FileCheck, Layers, Upload, Link2,
  ChevronDown, Plus, X, ScanLine, Clock, RefreshCw,
} from "lucide-react";
import { ERP } from "./erpTokens";

const C = ERP.colors;
const R = ERP.radius;
const S = ERP.shadow;
const F = ERP.font.family;

// ── Mock events for the event linkage selectbox ───────────────────────────────
const MOCK_EVENTS = [
  "（未關聯活動）— No linked event",
  "2024-25 南區中學校際足球賽 (South District Football)",
  "2024-25 全港 STEM 創新大賽 (HK STEM Innovation Challenge)",
  "2024-25 全港中學生辯論比賽 (HK Secondary Debate)",
  "2024-25 聯校音樂比賽 (Joint-School Music Festival)",
  "2024-25 視覺藝術創作展 (Visual Arts Exhibition)",
];

// ── OCR mock fill data for simulated new uploads ──────────────────────────────
const OCR_MOCK_FILL: Omit<CertData, "id">[] = [
  { studentZh: "吳嘉欣", studentEn: "Ng Ka Yan",   classCode: "F3A",
    event: "Joint-School Music Festival", award: "Gold Award",
    level: "L3 District", tier: "T4 Award", date: "2025-03-10", hours: "22",
    confidence: 92.3, matchConf: 96 },
  { studentZh: "楊浩然", studentEn: "Yeung Ho Yin", classCode: "F3B",
    event: "HK STEM Innovation Challenge", award: "Merit Prize",
    level: "L4 Regional", tier: "T3 Finalist", date: "2025-02-18", hours: "30",
    confidence: 88.1, matchConf: 91 },
  { studentZh: "馮紫晴", studentEn: "Fung Zi Ching", classCode: "F2A",
    event: "Visual Arts Exhibition", award: "Best in Show",
    level: "L3 District", tier: "T4 Award", date: "2025-04-05", hours: "16",
    confidence: 95.4, matchConf: 98 },
];

type StudentHit = {
  id: number;
  text: string;
  name_zh?: string;
  name_en?: string;
  class_name?: string;
  class_code?: string;
  student_number?: string;
  student_code?: string;
  card_id?: string;
};

// ── Batch cert shape (Figma + optional live bridge fields) ────────────────────
export interface CertData {
  id:              number;
  studentZh:       string;
  studentEn:       string;
  classCode:       string;
  event:           string;
  award:           string;
  level:           string;
  tier:            string;
  date:            string;
  hours:           string;
  confidence:      number;
  matchConf:       number;
  /** Optional per-field confidence from OCR meta */
  fieldConf?:      {
    student_name?: number;
    award_level?: number;
    event_title?: number;
    event_date?: number;
    [key: string]: number | undefined;
  };
  /** Live: public image URL for real certificate preview */
  imageUrl?:       string;
  /** Live: student_achievements.id */
  dbId?:           number;
  studentId?:      number | null;
  studentLabel?:   string;
  reviewStatus?:   string;
  /** OCR name conflict — >1 roster hits for the extracted name */
  conflictCount?:  number;
  extractedNameRaw?: string;
  potentialMatches?: StudentHit[];
}

export type BatchOcrActivity = { id: number; label: string };

export type ScreenBatchOCRProps = {
  /** When true, dropzone chains real upload → OCR → form fill */
  live?: boolean;
  batchId?: number | null;
  batchTitle?: string;
  activityLabel?: string;
  activities?: BatchOcrActivity[];
  initialCerts?: CertData[];
  initialCertIndex?: number;
  uploadUrl?: string;
  extractUrl?: string;
  saveUrlBase?: string;
  searchStudentsUrl?: string;
  environmentLevelsUrl?: string;
  tierRolesUrl?: string;
  listUrl?: string;
  csrfName?: string;
  csrfHash?: string;
  flashSuccess?: string;
  flashError?: string;
};

type TaxonomyOption = {
  id: number;
  code: string;
  label: string;
  value: string;
  name_en?: string;
  name_zh_hk?: string;
};

/** Professional student chip — never "黃海童 黃海童 (一)". */
function formatStudentDisplay(
  nameZh?: string | null,
  nameEn?: string | null,
  className?: string | null,
): string {
  const zh = String(nameZh || "").trim();
  const en = String(nameEn || "").trim();
  const cls = String(className || "").trim();
  let display = zh;
  if (en && en.toLowerCase() !== zh.toLowerCase()) {
    display = [display, en].filter(Boolean).join(" ");
  }
  if (!display) display = en;
  if (cls && cls !== "—") display = display ? `${display} (${cls})` : `(${cls})`;
  return display;
}

type ReviewDraftCert = {
  dbId?: number;
  studentId?: number | null;
  studentZh?: string;
  studentEn?: string;
  classCode?: string;
  studentLabel?: string;
  matchConf?: number;
  level?: string;
  tier?: string;
  title?: string;
  award?: string;
  hours?: string;
  date?: string;
};

type ReviewDraft = {
  batchId: number;
  activeIdx: number;
  certs: ReviewDraftCert[];
  updatedAt: number;
};

const draftStorageKey = (batchId: number | null | undefined) =>
  batchId && batchId > 0 ? `sts:achievement-review:draft:${batchId}` : null;

function readReviewDraft(batchId: number | null | undefined): ReviewDraft | null {
  const key = draftStorageKey(batchId);
  if (!key || typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ReviewDraft;
    if (!parsed || !Array.isArray(parsed.certs)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeReviewDraft(batchId: number | null | undefined, draft: ReviewDraft) {
  const key = draftStorageKey(batchId);
  if (!key || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(draft));
  } catch { /* quota / private mode */ }
}

function clearReviewDraft(batchId: number | null | undefined) {
  const key = draftStorageKey(batchId);
  if (!key || typeof window === "undefined") return;
  try { window.localStorage.removeItem(key); } catch { /* ignore */ }
}

function mapStudentHit(r: any): StudentHit {
  const zh = String(r.name_zh || "").trim();
  const en = String(r.name_en || "").trim();
  const cls = String(r.class_name || r.class_code || "").trim();
  const num = String(r.student_number || r.student_code || r.card_id || "").trim();
  return {
    id: Number(r.id),
    text: String(r.text || formatStudentDisplay(zh, en, cls) || num),
    name_zh: zh,
    name_en: en,
    class_name: cls,
    class_code: cls,
    student_number: num,
    student_code: num,
    card_id: String(r.card_id || num).trim(),
  };
}

function fuzzyPickTaxonomy(options: TaxonomyOption[], raw: string): string {
  const values = options.map(o => o.value || o.label);
  return fuzzyPick(values, raw);
}

function mapIncomingCert(raw: any): CertData {
  const studentIdRaw = raw.studentId ?? raw.student_id ?? null;
  const studentId = studentIdRaw != null && Number(studentIdRaw) > 0 ? Number(studentIdRaw) : null;
  const zh = String(raw.studentZh || raw.student_name_zh || raw.student_name || "").trim();
  const en = String(raw.studentEn || raw.student_name_en || "").trim();
  const cls = String(raw.classCode || raw.student_class || "").trim();
  let label = String(raw.studentLabel || raw.student_label || "").trim();
  // Rebuild a usable chip label when backend only sent id + names
  if (!label && studentId) {
    label = formatStudentDisplay(zh, en, cls) || `Student #${studentId}`;
  }
  const meta = raw.meta || {};
  const fieldConf = raw.fieldConf || meta.fields || undefined;
  const confRaw = raw.confidence ?? meta.confidence;
  const matchRaw = raw.matchConf ?? meta.matchConf ?? meta.match_confidence;
  const hasFields = !!(raw.event || raw.achievement_title || raw.award || raw.award_details
    || raw.level || raw.environment_level || raw.date || raw.event_date);
  const confidence = Number(confRaw > 0 ? confRaw : (studentId ? 94 : (hasFields ? 88 : 0)));
  const matchConf = Number(matchRaw > 0 ? matchRaw : (studentId ? 98 : (hasFields ? 60 : 0)));
  const displayZh = zh || (studentId ? (en || "已配對") : "待配對");

  return {
    id: Number(raw.id || raw.dbId || Date.now()),
    dbId: raw.dbId != null ? Number(raw.dbId) : (raw.id != null ? Number(raw.id) : undefined),
    studentZh: displayZh,
    studentEn: en,
    classCode: cls || "—",
    event: String(raw.event || raw.achievement_title || ""),
    award: String(raw.award || raw.award_details || ""),
    level: String(raw.level || raw.environment_level || ""),
    tier: String(raw.tier || raw.tier_role || ""),
    date: String(raw.date || raw.event_date || ""),
    hours: String(raw.hours ?? ""),
    confidence,
    matchConf,
    fieldConf,
    imageUrl: raw.imageUrl || raw.image_url || "",
    studentId,
    studentLabel: label,
    reviewStatus: raw.reviewStatus || raw.review_status || "pending",
  };
}

/** Bound only when a real DB student entity is linked — OCR name strings alone do not count. */
function hasBoundStudent(cert?: CertData | null): boolean {
  if (!cert) return false;
  return cert.studentId != null && Number(cert.studentId) > 0;
}

function fuzzyPick(options: string[], raw: string): string {
  const v = (raw || "").trim();
  if (!v) return options[0] || "";
  const exact = options.find(o => o === v);
  if (exact) return exact;
  const lower = v.toLowerCase();
  const contains = options.find(o => o.toLowerCase().includes(lower) || lower.includes(o.toLowerCase()));
  if (contains) return contains;
  const code = (v.match(/\b([LT]\d)\b/i) || [])[1];
  if (code) {
    const byCode = options.find(o => o.toUpperCase().startsWith(code.toUpperCase()));
    if (byCode) return byCode;
  }
  return v;
}

const BATCH_CERTS: CertData[] = [
  { id: 1, studentZh: "陳大文", studentEn: "Chan Tai Man",  classCode: "F1A",
    event: "Regional Science Competition", award: "Gold Award",
    level: "L4 Regional", tier: "T4 Award", date: "2025-11-15", hours: "24",
    confidence: 94.7, matchConf: 98 },
  { id: 2, studentZh: "李小明", studentEn: "Li Siu Ming",   classCode: "F2B",
    event: "Robotics Olympiad HK",         award: "Silver Award",
    level: "L4 Regional", tier: "T4 Award", date: "2025-10-22", hours: "36",
    confidence: 87.2, matchConf: 92 },
  { id: 3, studentZh: "黃美玲", studentEn: "Wong Mei Ling", classCode: "F3C",
    event: "Creative Writing Contest",     award: "First Prize",
    level: "L3 District", tier: "T4 Award", date: "2025-09-08", hours: "18",
    confidence: 91.5, matchConf: 95 },
  { id: 4, studentZh: "張志豪", studentEn: "Cheung Chi Ho", classCode: "F1D",
    event: "Mathematics Competition",      award: "Merit Award",
    level: "L2 School", tier: "T3 Finalist", date: "2025-12-01", hours: "12",
    confidence: 78.9, matchConf: 88 },
  { id: 5, studentZh: "劉詩雯", studentEn: "Lau Sze Man",   classCode: "F2A",
    event: "Public Speaking Competition",  award: "Best Speaker",
    level: "L4 Regional", tier: "T4 Award", date: "2025-11-28", hours: "20",
    confidence: 96.1, matchConf: 99 },
];

// ── Thumbnail ─────────────────────────────────────────────────────────────────
const Thumbnail: React.FC<{
  cert:      CertData;
  index:     number;
  active:    boolean;
  saved:     boolean;
  discarded: boolean;
  scanning?: boolean;
  onClick:   () => void;
}> = ({ cert, index, active, saved, discarded, scanning, onClick }) => (
  <button
    onClick={onClick}
    style={{
      flexShrink: 0,
      width: 72, height: 90,
      border: active ? `2px solid ${C.accent}` : `1px solid ${C.border}`,
      borderRadius: R.md,
      background: scanning ? "#F0FDF4" : discarded ? C.errorLight : saved ? C.greenLight : active ? C.accentPale : C.surface,
      cursor: scanning ? "default" : "pointer",
      padding: 0,
      position: "relative",
      opacity: discarded ? 0.55 : active ? 1 : 0.75,
      boxShadow: active ? `0 0 0 3px ${C.accentLight}, ${S.sm}` : S.xs,
      transition: "all 0.18s ease",
      overflow: "hidden",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 3,
    }}
  >
    {scanning ? (
      <>
        {/* Scan line animation */}
        <style>{`
          @keyframes scanMove { 0%{top:10%} 100%{top:85%} }
          @keyframes scanPulse { 0%,100%{opacity:0.5} 50%{opacity:1} }
        `}</style>
        <div style={{ fontSize: 16, opacity: 0.4 }}>📄</div>
        <div style={{
          position: "absolute", left: 0, right: 0, height: 2,
          background: "linear-gradient(90deg, transparent, #38BDF8, #818CF8, transparent)",
          animation: "scanMove 1.1s linear infinite",
          boxShadow: "0 0 6px #38BDF8",
        }} />
        <div style={{
          fontSize: 7.5, fontWeight: 800, letterSpacing: "0.04em",
          color: "#0369A1", fontFamily: F, marginTop: 28,
          animation: "scanPulse 1.1s ease-in-out infinite",
        }}>OCR 掃瞄中…</div>
      </>
    ) : (
      <>
        <div style={{ fontSize: 20 }}>🏆</div>
        <div style={{
          fontSize: 9, color: C.textSecondary, fontFamily: F,
          lineHeight: 1.2, textAlign: "center", padding: "0 4px",
        }}>
          {cert.studentZh}
        </div>
        <div style={{
          fontSize: 8, fontFamily: F, fontWeight: 700,
          color: active ? C.accent : C.textMuted,
          background: active ? C.accentLight : C.divider,
          padding: "1px 5px", borderRadius: R.xs,
        }}>
          {cert.classCode}
        </div>
        <div style={{ fontSize: 9, color: C.textMuted, fontFamily: F }}>
          #{index + 1}
        </div>
      </>
    )}
    {saved && !scanning && (
      <div style={{ position: "absolute", top: 4, right: 4 }}>
        <CheckCircle2 size={12} color={C.success} />
      </div>
    )}
    {discarded && (
      <div style={{ position: "absolute", top: 3, right: 4, fontSize: 11, color: C.error, fontWeight: 700 }}>✕</div>
    )}
    {active && !scanning && (
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: C.accent }} />
    )}
  </button>
);

// ── Certificate Preview (real image when live; decorative mock otherwise) ─────
const CertPreview: React.FC<{ cert: CertData }> = ({ cert }) => {
  const src = (cert.imageUrl || "").trim();
  const isPdf = /\.pdf$/i.test(src);

  if (src) {
    return (
      <div style={{
        background: "#fff",
        border: "3px dashed #93C5FD",
        borderRadius: R.lg,
        padding: 8,
        flex: 1,
        display: "flex", alignItems: "center", justifyContent: "center",
        minHeight: 200, position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", inset: 8,
          border: "2px solid #BFDBFE", borderRadius: R.md, pointerEvents: "none",
        }} />
        {isPdf ? (
          <iframe src={src} title="Certificate PDF" style={{ width: "100%", height: "55vh", border: 0, borderRadius: R.md }} />
        ) : (
          <img src={src} alt="Certificate" style={{ maxWidth: "100%", maxHeight: "55vh", objectFit: "contain", borderRadius: R.sm }} />
        )}
      </div>
    );
  }

  return (
    <div style={{
      background: "linear-gradient(135deg, #EBF2FF 0%, #F0FDF4 100%)",
      border: "3px dashed #93C5FD",
      borderRadius: R.lg,
      padding: "24px 20px",
      textAlign: "center",
      flex: 1,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 9, fontFamily: F, position: "relative",
      minHeight: 200,
    }}>
      <div style={{
        position: "absolute", inset: 8,
        border: "2px solid #BFDBFE", borderRadius: R.md, pointerEvents: "none",
      }} />
      <div style={{ fontSize: 32 }}>🏆</div>
      <div style={{
        fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase",
        color: C.accentMid, fontWeight: 700,
      }}>
        Certificate of Achievement
      </div>
      <div style={{ fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
        This is to certify that
      </div>
      <div style={{
        fontSize: 15, fontWeight: 800, color: C.textPrimary,
        borderBottom: "2px solid #93C5FD", paddingBottom: 4, lineHeight: 1.3,
      }}>
        {formatStudentDisplay(cert.studentZh, cert.studentEn) || "—"}
      </div>
      <div style={{ fontSize: 11, color: C.textSecondary }}>has demonstrated excellence in</div>
      <div style={{
        fontSize: 12, fontWeight: 700, color: C.accent,
        background: C.accentLight, padding: "4px 12px", borderRadius: R.full,
      }}>
        {cert.event || "—"}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <Star size={12} color="#F59E0B" fill="#F59E0B" />
        <span style={{ fontSize: 13, fontWeight: 700, color: "#D97706" }}>{cert.award || "—"}</span>
        <Star size={12} color="#F59E0B" fill="#F59E0B" />
      </div>
      <div style={{ fontSize: 10, color: C.textMuted }}>{cert.date}</div>
    </div>
  );
};

// ── Confidence Bar ────────────────────────────────────────────────────────────
const ConfidenceBar: React.FC<{ label: string; value: number }> = ({ label, value }) => {
  const color = value >= 92 ? C.success : value >= 80 ? C.amber : C.error;
  return (
    <div style={{ fontFamily: F }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span style={{ fontSize: 11, color: C.textSecondary }}>{label}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color }}>{value}%</span>
      </div>
      <div style={{ height: 5, background: C.border, borderRadius: R.full }}>
        <div style={{
          height: "100%", width: `${value}%`,
          background: color, borderRadius: R.full, transition: "width 0.4s ease",
        }} />
      </div>
    </div>
  );
};

// ── Form Helpers ──────────────────────────────────────────────────────────────
const FormLabel: React.FC<{ zh: string; en: string }> = ({ zh, en }) => (
  <div style={{ marginBottom: 5 }}>
    <span style={{ fontSize: 12, fontWeight: 700, color: C.textPrimary, fontFamily: F }}>{zh}</span>
    <span style={{ fontSize: 11, color: C.textMuted, fontFamily: F }}> · {en}</span>
  </div>
);

const inputBase: React.CSSProperties = {
  width: "100%", height: 36, padding: "0 10px",
  border: `1px solid ${C.border}`, borderRadius: R.md,
  fontSize: 13, color: C.textPrimary, fontFamily: F,
  background: C.surface, boxSizing: "border-box", outline: "none",
};

/** Bootstrap 5 form-select chevron (do NOT override with `background` shorthand — kills the arrow). */
const BS_SELECT_CHEVRON =
  "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23343a40' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m2 5 6 6 6-6'/%3e%3c/svg%3e\")";

// ── Main Component ────────────────────────────────────────────────────────────
export const Screen_BatchOCR: React.FC<ScreenBatchOCRProps> = ({
  live = false,
  batchId = null,
  batchTitle = "",
  activityLabel = "",
  activities = [],
  initialCerts,
  initialCertIndex = 0,
  uploadUrl = "",
  extractUrl = "/achievements/api/extract",
  saveUrlBase = "/achievements/review/save",
  searchStudentsUrl = "/api/students/search",
  environmentLevelsUrl = "/api/settings/environment-levels",
  tierRolesUrl = "/api/settings/tier-roles",
  flashSuccess,
  flashError,
}) => {
  const isLive = live && !!uploadUrl;

  const seedCerts = useMemo(
    () => (isLive
      ? (initialCerts || []).map(mapIncomingCert)
      : (initialCerts && initialCerts.length ? initialCerts.map(mapIncomingCert) : BATCH_CERTS)),
    // Re-map whenever bridge props arrive / change (page refresh hydration).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isLive, initialCerts],
  );

  // Merge server payload with localStorage draft so linked student / taxonomy survive refresh.
  const hydratedSeed = useMemo(() => {
    const draft = readReviewDraft(batchId);
    if (!draft || draft.certs.length === 0) return seedCerts;
    return seedCerts.map((c) => {
      const key = Number(c.dbId || c.id);
      const d = draft.certs.find(x => Number(x.dbId || 0) === key);
      if (!d) return c;
      const sid = d.studentId != null && Number(d.studentId) > 0 ? Number(d.studentId) : c.studentId;
      return {
        ...c,
        studentId: sid ?? null,
        studentZh: d.studentZh || c.studentZh,
        studentEn: d.studentEn ?? c.studentEn,
        classCode: d.classCode || c.classCode,
        studentLabel: d.studentLabel || c.studentLabel,
        matchConf: d.matchConf ?? c.matchConf,
        level: d.level || c.level,
        tier: d.tier || c.tier,
        event: d.title || c.event,
        award: d.award || c.award,
        hours: d.hours ?? c.hours,
        date: d.date || c.date,
      };
    });
  }, [seedCerts, batchId]);

  const [activeIdx,    setActiveIdx]    = useState(() => {
    const draft = readReviewDraft(batchId);
    if (draft && Number.isFinite(draft.activeIdx)) {
      return Math.max(0, Math.min(draft.activeIdx, Math.max(0, hydratedSeed.length - 1)));
    }
    return Math.max(0, Math.min(initialCertIndex, Math.max(0, hydratedSeed.length - 1)));
  });
  const [saved,        setSaved]        = useState<Set<number>>(() => {
    const s = new Set<number>();
    hydratedSeed.forEach((c, i) => { if (c.reviewStatus === "reviewed") s.add(i); });
    return s;
  });
  const [discarded,    setDiscarded]    = useState<Set<number>>(new Set());
  const [submitDone,   setSubmitDone]   = useState(false);
  const [isMobile,     setIsMobile]     = useState(false);
  const eventChoices = activities.length
    ? ["（未關聯活動）— No linked event", ...activities.map(a => a.label)]
    : MOCK_EVENTS;
  const [linkedEvent,  setLinkedEvent]  = useState(
    activityLabel && activityLabel !== "—" ? activityLabel : eventChoices[0],
  );
  const [eventOpen,    setEventOpen]    = useState(false);
  const [dragOver,     setDragOver]     = useState(false);
  const [emptyDragOver, setEmptyDragOver] = useState(false);
  const [dynCerts,     setDynCerts]     = useState<CertData[]>(hydratedSeed);
  const [scanningIds,  setScanningIds]  = useState<Set<number>>(new Set());
  const [pipelineMsg,  setPipelineMsg]  = useState<string | null>(null);
  const [aiHighlight,  setAiHighlight]  = useState(false);
  // Never start in "search" mode when the active cert already has a bound student.
  const [editingStudent, setEditingStudent] = useState(false);
  const [studentQuery, setStudentQuery] = useState("");
  const [studentHits, setStudentHits] = useState<StudentHit[]>([]);
  const [studentSearchError, setStudentSearchError] = useState<string | null>(null);
  const [rescanning, setRescanning] = useState(false);
  const [studentSearching, setStudentSearching] = useState(false);
  const [envOptions, setEnvOptions] = useState<TaxonomyOption[]>([]);
  const [tierOptions, setTierOptions] = useState<TaxonomyOption[]>([]);
  const [taxonomyLoading, setTaxonomyLoading] = useState(false);
  const ocrFillIdx = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const studentSearchInputRef = useRef<HTMLInputElement>(null);
  const tempIdSeq = useRef(0);
  const studentSearchTimer = useRef<number | null>(null);
  const draftReadyRef = useRef(false);

  const [forms, setForms] = useState(() =>
    hydratedSeed.map(c => ({
      level: c.level, tier: c.tier, title: c.event,
      award: c.award, hours: c.hours, date: c.date,
    })),
  );

  // Re-sync when bridge certs change (e.g. soft navigation) while preserving draft overlays.
  useEffect(() => {
    setDynCerts(hydratedSeed);
    setForms(hydratedSeed.map(c => ({
      level: c.level, tier: c.tier, title: c.event,
      award: c.award, hours: c.hours, date: c.date,
    })));
    draftReadyRef.current = true;
  }, [hydratedSeed]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (!aiHighlight) return;
    const t = window.setTimeout(() => setAiHighlight(false), 2000);
    return () => window.clearTimeout(t);
  }, [aiHighlight]);

  // Dynamic taxonomy from CI4 — never hardcode <option> lists.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setTaxonomyLoading(true);
      try {
        const [envRes, tierRes] = await Promise.all([
          fetch(environmentLevelsUrl, { headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" } }),
          fetch(tierRolesUrl, { headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" } }),
        ]);
        const envJson = envRes.ok ? await envRes.json() : { results: [] };
        const tierJson = tierRes.ok ? await tierRes.json() : { results: [] };
        if (cancelled) return;
        setEnvOptions((envJson.results || []).map((r: any) => ({
          id: Number(r.id || 0),
          code: String(r.code || ""),
          label: String(r.label || r.value || ""),
          value: String(r.value || r.label || ""),
          name_en: r.name_en,
          name_zh_hk: r.name_zh_hk,
        })));
        setTierOptions((tierJson.results || []).map((r: any) => ({
          id: Number(r.id || 0),
          code: String(r.code || ""),
          label: String(r.label || r.value || ""),
          value: String(r.value || r.label || ""),
          name_en: r.name_en,
          name_zh_hk: r.name_zh_hk,
        })));
      } catch {
        if (!cancelled) {
          setEnvOptions([]);
          setTierOptions([]);
        }
      } finally {
        if (!cancelled) setTaxonomyLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [environmentLevelsUrl, tierRolesUrl]);

  // Persist linked student + form draft so refresh keeps association / level / tier.
  useEffect(() => {
    if (!draftReadyRef.current || !batchId) return;
    const t = window.setTimeout(() => {
      writeReviewDraft(batchId, {
        batchId,
        activeIdx,
        updatedAt: Date.now(),
        certs: dynCerts.map((c, i) => ({
          dbId: Number(c.dbId || c.id) || undefined,
          studentId: c.studentId ?? null,
          studentZh: c.studentZh,
          studentEn: c.studentEn,
          classCode: c.classCode,
          studentLabel: c.studentLabel,
          matchConf: c.matchConf,
          level: forms[i]?.level ?? c.level,
          tier: forms[i]?.tier ?? c.tier,
          title: forms[i]?.title ?? c.event,
          award: forms[i]?.award ?? c.award,
          hours: forms[i]?.hours ?? c.hours,
          date: forms[i]?.date ?? c.date,
        })),
      });
    }, 280);
    return () => window.clearTimeout(t);
  }, [batchId, activeIdx, dynCerts, forms]);

  const applyOcrToForm = useCallback(async (
    idx: number,
    data: any,
    certPatch: Partial<CertData> & { forceRematch?: boolean } = {},
  ) => {
    const level = fuzzyPickTaxonomy(envOptions, String(data.environment_level || data.extracted_level || ""));
    const tier  = fuzzyPickTaxonomy(tierOptions, String(data.tier_role || data.extracted_tier || ""));
    let date = String(data.event_date || "").trim();
    if (/^\d{4}$/.test(date)) date = `${date}-01-01`;

    setForms(prev => {
      const next = [...prev];
      while (next.length <= idx) next.push({ level: "", tier: "", title: "", award: "", hours: "", date: "" });
      next[idx] = {
        level: level || next[idx]?.level || "",
        tier: tier || next[idx]?.tier || "",
        title: String(data.achievement_title || next[idx]?.title || ""),
        award: String(data.award_details || next[idx]?.award || ""),
        hours: data.hours != null && data.hours !== "" ? String(data.hours) : (next[idx]?.hours || ""),
        date: date || next[idx]?.date || "",
      };
      return next;
    });

    let studentZh = certPatch.studentZh || "待配對";
    let studentEn = certPatch.studentEn || "";
    let studentId: number | null =
      certPatch.studentId != null && Number(certPatch.studentId) > 0
        ? Number(certPatch.studentId)
        : null;
    let studentLabel = certPatch.studentLabel || "";
    let matchConf = Number(
      certPatch.matchConf
      || data.matchConf
      || data.meta?.matchConf
      || 0,
    );
    let pendingHits: StudentHit[] = [];
    let openDisambiguation = false;
    let conflictCount = 0;

    const name = String(
      data.extracted_name_raw || data.student_name || "",
    ).trim();
    const extractedClass = String(
      data.extracted_class_code || data.class_code || "",
    ).trim();
    if (extractedClass) {
      certPatch = { ...certPatch, classCode: extractedClass };
    }
    const forceRematch = !!(certPatch as { forceRematch?: boolean }).forceRematch;

    // Prefer CI4 unique bilingual (+ class) match payload
    const matched = data.matched_student && typeof data.matched_student === "object"
      ? data.matched_student
      : null;
    const backendPotential = Array.isArray(data.potential_matches)
      ? (data.potential_matches as any[]).map(mapStudentHit)
      : [];
    const backendConflict = Number(data.conflict_count || 0);

    if (matched && !forceRematch) {
      const zh = String(matched.name_zh || "").trim();
      const en = String(matched.name_en || "").trim();
      const cls = String(matched.class_code || matched.class_name || extractedClass || "").trim();
      studentId = Number(matched.id || data.matched_student_id || 0) || null;
      studentZh = zh || en || name || "已配對";
      studentEn = en && en.toLowerCase() !== String(studentZh).toLowerCase() ? en : "";
      studentLabel = formatStudentDisplay(studentZh, studentEn, cls)
        || String(matched.text || studentZh);
      matchConf = matchConf || 95;
      certPatch = { ...certPatch, classCode: cls || certPatch.classCode || "—" };
      conflictCount = 0;
      openDisambiguation = false;
    } else if (
      !forceRematch
      && data.matched_student_id
      && Number(data.matched_student_id) > 0
      && !studentId
    ) {
      studentId = Number(data.matched_student_id);
      if (name) {
        studentZh = name;
        studentEn = "";
        studentLabel = formatStudentDisplay(name, "", certPatch.classCode) || name;
      }
      matchConf = matchConf || 95;
      conflictCount = 0;
      openDisambiguation = false;
    } else if (!forceRematch && backendConflict > 1 && backendPotential.length > 0) {
      // Backend already found multiple class variants — use them directly
      studentId = null;
      studentZh = "待配對";
      studentEn = "";
      studentLabel = "";
      pendingHits = backendPotential;
      conflictCount = backendConflict;
      matchConf = matchConf || 70;
      openDisambiguation = true;
    }

    // Fallback: search API when backend did not resolve / no potential list
    if (name && searchStudentsUrl && (!studentId || forceRematch) && pendingHits.length === 0) {
      try {
        const q = extractedClass ? `${name} ${extractedClass}` : name;
        const res = await fetch(`${searchStudentsUrl}?q=${encodeURIComponent(q)}`, {
          headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
        });
        const json = await res.json();
        let hits = (json.results || []).map(mapStudentHit) as StudentHit[];
        // If class-qualified search returned nothing, retry with name only
        if (hits.length === 0 && extractedClass) {
          const res2 = await fetch(`${searchStudentsUrl}?q=${encodeURIComponent(name)}`, {
            headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
          });
          const json2 = await res2.json();
          hits = (json2.results || []).map(mapStudentHit);
        }
        pendingHits = hits;
        let classCode = certPatch.classCode || "—";
        if (hits.length === 1) {
          const hit = hits[0];
          const zh = String(hit.name_zh || "").trim();
          const en = String(hit.name_en || "").trim();
          const cls = String(hit.class_name || hit.class_code || "").trim();
          studentId = Number(hit.id);
          studentZh = zh || name;
          studentEn = en && en.toLowerCase() !== studentZh.toLowerCase() ? en : "";
          classCode = cls || classCode;
          studentLabel = formatStudentDisplay(studentZh, studentEn, classCode)
            || String(hit.text || name);
          matchConf = 95;
          conflictCount = 0;
          certPatch = { ...certPatch, classCode };
          openDisambiguation = false;
        } else {
          studentId = null;
          studentZh = "待配對";
          studentEn = "";
          studentLabel = "";
          conflictCount = hits.length;
          matchConf = matchConf || (hits.length > 1 ? 70 : 40);
          openDisambiguation = true;
        }
      } catch {
        studentId = null;
        studentZh = "待配對";
        studentEn = "";
        studentLabel = "";
        conflictCount = 0;
        matchConf = matchConf || 40;
        openDisambiguation = true;
      }
    } else if (name && !studentId && (studentZh === "待配對" || !studentZh)) {
      openDisambiguation = true;
      if (!conflictCount && pendingHits.length > 1) conflictCount = pendingHits.length;
    }

    const confidence = Number(
      certPatch.confidence
      || data.confidence
      || data.meta?.confidence
      || 92,
    );
    const fieldConf = data.field_confidence || data.meta?.fields || certPatch.fieldConf || {
      student_name: matchConf || Math.max(0, confidence - 5),
      award_level: Math.min(99, Math.round(confidence + 3)),
      event_title: Math.max(0, Math.round(confidence - 1)),
      event_date: Math.max(0, Math.round(confidence - 4)),
    };

    setDynCerts(prev => prev.map((c, i) => i === idx ? {
      ...c,
      ...certPatch,
      studentZh,
      studentEn,
      studentId: studentId && studentId > 0 ? studentId : null,
      studentLabel: studentId
        ? (studentLabel
          || formatStudentDisplay(studentZh, studentEn, certPatch.classCode || c.classCode)
          || studentZh)
        : "",
      classCode: certPatch.classCode || c.classCode || "—",
      matchConf,
      confidence,
      fieldConf,
      conflictCount: studentId ? 0 : conflictCount,
      extractedNameRaw: name || undefined,
      potentialMatches: studentId ? [] : pendingHits,
      event: String(data.achievement_title || c.event || ""),
      award: String(data.award_details || c.award || ""),
      level: level || c.level,
      tier: tier || c.tier,
      date: date || c.date,
      hours: data.hours != null ? String(data.hours) : c.hours,
    } : c));

    // OCR name → async disambiguation UI on the active cert
    if (openDisambiguation && idx === activeIdx) {
      setEditingStudent(true);
      setStudentQuery(name);
      setStudentHits(pendingHits);
      setStudentSearchError(
        pendingHits.length === 0 && name
          ? `找不到「${name}」的學生紀錄，請手動搜尋。`
          : null,
      );
      window.setTimeout(() => studentSearchInputRef.current?.focus(), 80);
    } else if (!openDisambiguation && studentId) {
      setEditingStudent(false);
      setStudentHits([]);
      setStudentSearchError(null);
    }

    setAiHighlight(true);
  }, [envOptions, tierOptions, searchStudentsUrl, activeIdx]);

  /** Run GB10 OCR for one persisted achievement card. */
  const runOcrForAchievement = useCallback(async (
    dbId: number,
    imageUrl: string,
    selectWhenDone: boolean,
  ) => {
    const gatewayTimeoutMsg =
      "AI 伺服器運算逾時 (504)。請嘗試上傳較小檔案，或稍後再試。";
    setScanningIds(prev => new Set([...prev, dbId]));
    try {
      const exController = typeof AbortController !== "undefined" ? new AbortController() : null;
      const exTimer = exController
        ? window.setTimeout(() => exController.abort(), 130_000)
        : null;
      let exRes: Response;
      try {
        exRes = await fetch(extractUrl, {
          method: "POST",
          credentials: "same-origin",
          signal: exController?.signal,
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          body: `achievement_id=${encodeURIComponent(String(dbId))}`,
        });
      } catch (netErr: any) {
        if (exTimer) window.clearTimeout(exTimer);
        if (netErr?.name === "AbortError") throw new Error(gatewayTimeoutMsg);
        throw netErr;
      }
      if (exTimer) window.clearTimeout(exTimer);
      if (exRes.status === 504 || exRes.status === 502 || exRes.status === 524) {
        throw new Error(gatewayTimeoutMsg);
      }
      const exJson = await exRes.json().catch(() => ({}));
      if (exRes.status === 413) {
        throw new Error(
          String(exJson.message || "檔案過大 (超過 4MB) 且自動壓縮失敗，請手動壓縮後再上載。")
        );
      }
      if (!exRes.ok || exJson.status !== "success") {
        throw new Error(exJson.message || "AI 萃取失敗");
      }

      const idxFinal = await new Promise<number>((resolve) => {
        setDynCerts(prev => {
          const found = prev.findIndex(c => c.id === dbId || c.dbId === dbId);
          resolve(found >= 0 ? found : 0);
          return prev;
        });
      });

      const ocrData = exJson.data || {};
      await applyOcrToForm(idxFinal, ocrData, {
        id: dbId,
        dbId,
        imageUrl,
        confidence: Number(exJson.confidence || ocrData.confidence || 93),
        matchConf: Number(exJson.matchConf || ocrData.matchConf || 0),
        fieldConf: ocrData.field_confidence || exJson.meta?.fields,
      });
      if (selectWhenDone) setActiveIdx(idxFinal);
    } catch (err: any) {
      const msg = String(err?.message || "OCR 失敗");
      setDynCerts(prev => prev.map(c => (c.id === dbId || c.dbId === dbId)
        ? { ...c, studentZh: "失敗", event: msg }
        : c));
      throw err;
    } finally {
      setScanningIds(prev => {
        const n = new Set(prev);
        n.delete(dbId);
        return n;
      });
    }
  }, [extractUrl, applyOcrToForm]);

  /**
   * Process one live file: upload → expand multi-page PDF pages into cards → OCR each.
   * A 10-page PDF becomes 10 separate actionable queue cards.
   */
  const processLiveFile = useCallback(async (file: File, selectWhenDone: boolean) => {
    tempIdSeq.current += 1;
    const tempId = Date.now() * 100 + tempIdSeq.current;
    const baseLabel = file.name.replace(/\.[^.]+$/, "");
    const placeholder: CertData = {
      id: tempId,
      studentZh: "上傳中…",
      studentEn: baseLabel,
      classCode: "—",
      event: "—",
      award: "—",
      level: "—",
      tier: "—",
      date: "",
      hours: "",
      confidence: 0,
      matchConf: 0,
    };

    const targetIdx = await new Promise<number>((resolve) => {
      setDynCerts(prev => {
        resolve(prev.length);
        return [...prev, placeholder];
      });
    });
    setForms(prev => [...prev, { level: "", tier: "", title: "", award: "", hours: "", date: "" }]);
    setScanningIds(prev => new Set([...prev, tempId]));
    if (selectWhenDone) setActiveIdx(targetIdx);

    try {
      const fd = new FormData();
      fd.append("cert_files", file, file.name);
      fd.append("cert_files[]", file, file.name);
      fd.append("file", file, file.name);
      fd.append("certificate_file", file, file.name);
      const gatewayTimeoutMsg =
        "AI 伺服器運算逾時 (504)。請嘗試上傳較小檔案，或稍後再試。";

      const upRes = await fetch(uploadUrl, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: fd,
      });
      if (upRes.status === 504 || upRes.status === 502 || upRes.status === 524) {
        throw new Error(gatewayTimeoutMsg);
      }
      if (upRes.status === 413) {
        const errJson = await upRes.json().catch(() => ({}));
        throw new Error(String(errJson.message || "檔案過大，請壓縮後再上載。"));
      }
      const upJson = await upRes.json().catch(() => ({}));
      if (!upRes.ok || (upJson.ok === false)) {
        throw new Error(upJson.message || `上傳失敗 (${upRes.status})`);
      }

      // Backend may return 1..N files after multi-page PDF split
      const rawItems: any[] = Array.isArray(upJson.files) && upJson.files.length
        ? upJson.files
        : (Array.isArray(upJson.items) && upJson.items.length
          ? upJson.items
          : (upJson.item ? [upJson.item] : []));
      const items = rawItems.filter((it) => it && (it.id != null || it.file_id != null));
      if (items.length === 0) throw new Error("上傳回應缺少成就 ID");

      const mapped = items.map((it, i) => {
        const dbId = Number(it.id ?? it.file_id);
        const imageUrl = String(it.image_url || it.url || "");
        const pageLabel = String(it.file_name || it.fileName || `${baseLabel}_Page_${i + 1}`);
        const card: CertData = {
          id: dbId,
          dbId,
          imageUrl,
          studentZh: "OCR 掃描中…",
          studentEn: pageLabel.replace(/\.[^.]+$/, ""),
          classCode: "—",
          event: items.length > 1 ? `第 ${i + 1} / ${items.length} 頁` : "—",
          award: "—",
          level: "—",
          tier: "—",
          date: "",
          hours: "",
          confidence: 0,
          matchConf: 0,
        };
        return card;
      });

      // Expand: replace upload placeholder with page #1, append pages #2..N
      await new Promise<void>((resolve) => {
        setDynCerts(prev => {
          const found = prev.findIndex(c => c.id === tempId);
          if (found < 0) {
            resolve();
            return [...prev, ...mapped];
          }
          const next = [...prev];
          next[found] = mapped[0];
          next.splice(found + 1, 0, ...mapped.slice(1));
          resolve();
          return next;
        });
        setForms(prev => {
          const blank = { level: "", tier: "", title: "", award: "", hours: "", date: "" };
          if (mapped.length <= 1) return prev;
          // placeholder already added one blank form — add N-1 more
          return [...prev, ...Array.from({ length: mapped.length - 1 }, () => ({ ...blank }))];
        });
      });

      setScanningIds(prev => {
        const n = new Set(prev);
        n.delete(tempId);
        mapped.forEach(c => n.add(Number(c.dbId ?? c.id)));
        return n;
      });

      if (selectWhenDone) {
        const firstIdx = await new Promise<number>((resolve) => {
          setDynCerts(prev => {
            const found = prev.findIndex(c => c.id === mapped[0].id || c.dbId === mapped[0].dbId);
            resolve(found >= 0 ? found : targetIdx);
            return prev;
          });
        });
        setActiveIdx(firstIdx);
      }

      if (items.length > 1) {
        setPipelineMsg(`已拆分多頁 PDF 為 ${items.length} 份文件，開始 OCR…`);
        setTimeout(() => setPipelineMsg(null), 3500);
      }

      // OCR each page sequentially to avoid saturating GB10
      let firstErr: string | null = null;
      for (let i = 0; i < mapped.length; i++) {
        const card = mapped[i];
        const dbId = Number(card.dbId ?? card.id);
        try {
          await runOcrForAchievement(dbId, String(card.imageUrl || ""), selectWhenDone && i === 0);
        } catch (e: any) {
          if (!firstErr) firstErr = String(e?.message || "OCR 失敗");
        }
      }
      if (firstErr) {
        setPipelineMsg(firstErr);
        setTimeout(() => setPipelineMsg(null), /超過\s*4MB|壓縮失敗|413/i.test(firstErr) ? 8000 : 4000);
      }
    } catch (err: any) {
      const msg = String(err?.message || "處理失敗");
      const isPayload = /超過\s*4MB|壓縮失敗|縮小檔案|413/i.test(msg);
      setDynCerts(prev => prev.map(c => (c.id === tempId || c.dbId === tempId)
        ? { ...c, studentZh: "失敗", event: msg }
        : c));
      setScanningIds(prev => {
        const n = new Set(prev);
        n.delete(tempId);
        return n;
      });
      setPipelineMsg(msg);
      setTimeout(() => setPipelineMsg(null), isPayload ? 8000 : 4000);
    }
  }, [uploadUrl, runOcrForAchievement]);

  // Dropzone: never locked — each file gets its own upload+OCR pipeline in parallel
  const processDroppedFiles = useCallback((files: FileList | File[]) => {
    const fileArr = Array.from(files);
    if (!fileArr.length) return;

    if (!isLive) {
      fileArr.forEach((file, i) => {
        const newId = Date.now() + i;
        const placeholder: CertData = {
          id: newId, studentZh: "掃瞄中…", studentEn: file.name.replace(/\.[^.]+$/, ""),
          classCode: "—", event: "—", award: "—", level: "—", tier: "—",
          date: "", hours: "0", confidence: 0, matchConf: 0,
        };
        setDynCerts(prev => [...prev, placeholder]);
        setScanningIds(prev => new Set([...prev, newId]));
        setTimeout(() => {
          const fill = OCR_MOCK_FILL[ocrFillIdx.current % OCR_MOCK_FILL.length];
          ocrFillIdx.current += 1;
          const filled: CertData = { ...fill, id: newId };
          setDynCerts(prev => prev.map(c => c.id === newId ? filled : c));
          setScanningIds(prev => { const n = new Set(prev); n.delete(newId); return n; });
          setForms(prev => [
            ...prev,
            { level: fill.level, tier: fill.tier, title: fill.event, award: fill.award, hours: fill.hours, date: fill.date },
          ]);
        }, 1800 + i * 600);
      });
      return;
    }

    // Fire all uploads immediately — dropzone stays interactive
    fileArr.forEach((file, i) => {
      void processLiveFile(file, i === 0);
    });
  }, [isLive, processLiveFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    setEmptyDragOver(false);
    if (e.dataTransfer.files.length) processDroppedFiles(e.dataTransfer.files);
  }, [processDroppedFiles]);

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const cert        = dynCerts[activeIdx] ?? dynCerts[0];
  const form        = forms[activeIdx] ?? forms[0] ?? { level: "", tier: "", title: "", award: "", hours: "", date: "" };
  const savedCount  = saved.size + discarded.size;
  const allDone     = savedCount === dynCerts.length && dynCerts.length > 0 && scanningIds.size === 0;
  const isSaved     = saved.has(activeIdx);
  const isDiscarded = discarded.has(activeIdx);
  const isScanning  = !!cert && scanningIds.has(cert.id);

  const updateField = (field: keyof typeof form, val: string) => {
    setForms(prev => {
      const next = [...prev];
      while (next.length <= activeIdx) next.push({ level: "", tier: "", title: "", award: "", hours: "", date: "" });
      next[activeIdx] = { ...next[activeIdx], [field]: val };
      return next;
    });
  };

  const beginChangeStudent = () => {
    setEditingStudent(true);
    setStudentQuery("");
    setStudentHits([]);
    setStudentSearchError(null);
  };

  const clearStudentBinding = () => {
    setDynCerts(prev => prev.map((c, i) => i === activeIdx ? {
      ...c,
      studentId: null,
      studentLabel: "",
      studentZh: "待配對",
      studentEn: "",
      classCode: "—",
      matchConf: 0,
      conflictCount: 0,
      potentialMatches: [],
    } : c));
    setEditingStudent(true);
    setStudentQuery("");
    setStudentHits([]);
    setStudentSearchError(null);
  };

  const runStudentSearch = (q: string) => {
    setStudentQuery(q);
    setStudentSearchError(null);
    if (studentSearchTimer.current) window.clearTimeout(studentSearchTimer.current);
    if (!q.trim() || !searchStudentsUrl) {
      setStudentHits([]);
      return;
    }
    studentSearchTimer.current = window.setTimeout(async () => {
      setStudentSearching(true);
      try {
        const res = await fetch(`${searchStudentsUrl}?q=${encodeURIComponent(q.trim())}`, {
          headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
        });
        if (!res.ok) throw new Error("搜尋失敗");
        const json = await res.json();
        const hits = (json.results || []).map(mapStudentHit);
        setStudentHits(hits);
        if (hits.length === 0) {
          setStudentSearchError(`找不到「${q.trim()}」的學生紀錄`);
        }
      } catch {
        setStudentHits([]);
        setStudentSearchError("學生搜尋暫時無法使用，請稍後再試。");
      } finally {
        setStudentSearching(false);
      }
    }, 220);
  };

  const confirmStudentAssociation = (hit: StudentHit) => {
    const zh = String(hit.name_zh || "").trim();
    const en = String(hit.name_en || "").trim();
    const cls = String(hit.class_name || hit.class_code || "").trim()
      || (hit.text.match(/\(([^)]+)\)\s*$/) || [])[1]
      || "";
    const label = formatStudentDisplay(zh || hit.text.replace(/\s*\(.*\)\s*$/, "").trim(), en, cls)
      || hit.text;
    setDynCerts(prev => prev.map((c, i) => i === activeIdx ? {
      ...c,
      studentId: hit.id,
      studentLabel: label,
      studentZh: zh || label.replace(/\s*\(.*\)\s*$/, "").trim() || hit.text,
      studentEn: en && en.toLowerCase() !== zh.toLowerCase() ? en : "",
      classCode: cls || c.classCode || "—",
      matchConf: Math.max(c.matchConf || 0, 98),
      conflictCount: 0,
      potentialMatches: [],
    } : c));
    setEditingStudent(false);
    setStudentQuery("");
    setStudentHits([]);
    setStudentSearchError(null);
  };

  const bindStudent = confirmStudentAssociation;

  /** Conflict badge → open autocomplete with OCR name + potential class variants */
  const openConflictPicker = () => {
    const c = dynCerts[activeIdx];
    const raw = String(c?.extractedNameRaw || studentQuery || "").trim();
    const hits = (c?.potentialMatches && c.potentialMatches.length > 0)
      ? c.potentialMatches
      : studentHits;
    setEditingStudent(true);
    setStudentSearchError(null);
    if (raw) setStudentQuery(raw);
    if (hits.length > 0) {
      setStudentHits(hits);
    } else if (raw) {
      runStudentSearch(raw);
    }
    window.setTimeout(() => studentSearchInputRef.current?.focus(), 50);
  };

  /** Re-fire /achievements/api/extract for the active certificate. */
  const rescanActiveOcr = useCallback(async () => {
    const cert = dynCerts[activeIdx];
    const achievementId = Number(cert?.dbId || cert?.id || 0);
    if (!achievementId || achievementId < 1 || !extractUrl) {
      setPipelineMsg("請先選取已上傳的證書再重新掃描。");
      setTimeout(() => setPipelineMsg(null), 3000);
      return;
    }
    if (rescanning) return;
    setRescanning(true);
    setScanningIds(prev => new Set([...prev, achievementId]));
    setPipelineMsg("✨ AI 重新掃描中…");
    const gatewayTimeoutMsg =
      "AI 伺服器運算逾時 (504)。請嘗試上傳較小檔案，或稍後再試。";
    try {
      const exController = typeof AbortController !== "undefined" ? new AbortController() : null;
      const exTimer = exController
        ? window.setTimeout(() => exController.abort(), 130_000)
        : null;
      let exRes: Response;
      try {
        exRes = await fetch(extractUrl, {
          method: "POST",
          credentials: "same-origin",
          signal: exController?.signal,
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          body: `achievement_id=${encodeURIComponent(String(achievementId))}`,
        });
      } catch (netErr: any) {
        if (exTimer) window.clearTimeout(exTimer);
        if (netErr?.name === "AbortError") throw new Error(gatewayTimeoutMsg);
        throw netErr;
      }
      if (exTimer) window.clearTimeout(exTimer);
      if (exRes.status === 504 || exRes.status === 502 || exRes.status === 524) {
        throw new Error(gatewayTimeoutMsg);
      }
      const exJson = await exRes.json().catch(() => ({}));
      if (exRes.status === 413) {
        throw new Error(
          String(exJson.message || "檔案過大 (超過 4MB) 且自動壓縮失敗，請手動壓縮後再上載。")
        );
      }
      if (!exRes.ok || exJson.status !== "success") {
        throw new Error(exJson.message || "AI 萃取失敗");
      }
      const ocrData = exJson.data || {};
      await applyOcrToForm(activeIdx, ocrData, {
        id: achievementId,
        dbId: achievementId,
        imageUrl: cert.imageUrl,
        confidence: Number(exJson.confidence || ocrData.confidence || 93),
        matchConf: Number(exJson.matchConf || ocrData.matchConf || 0),
        fieldConf: ocrData.field_confidence || exJson.meta?.fields,
        forceRematch: true,
      } as Partial<CertData> & { forceRematch?: boolean });
      setPipelineMsg("✅ 重新掃描完成");
      setTimeout(() => setPipelineMsg(null), 2500);
    } catch (err: any) {
      const msg = String(err?.message || "重新掃描失敗");
      const isPayload = /超過\s*4MB|壓縮失敗|縮小檔案|413/i.test(msg);
      setPipelineMsg(msg);
      setTimeout(() => setPipelineMsg(null), isPayload ? 8000 : 4000);
    } finally {
      setRescanning(false);
      setScanningIds(prev => {
        const n = new Set(prev);
        n.delete(achievementId);
        return n;
      });
    }
  }, [dynCerts, activeIdx, extractUrl, rescanning, applyOcrToForm]);

  // Reset / rehydrate student-edit UI when switching certificates
  useEffect(() => {
    const c = dynCerts[activeIdx];
    setStudentHits([]);
    setStudentSearchError(null);
    if (hasBoundStudent(c)) {
      setEditingStudent(false);
      setStudentQuery("");
      return;
    }
    setEditingStudent(true);
    const placeholders = new Set(["待配對", "上傳中…", "AI 掃描中…", "OCR 掃描中…", "掃瞄中…", "失敗", "—"]);
    const q = String(c?.studentZh || "").trim();
    const seed = q && !placeholders.has(q) ? q : "";
    setStudentQuery(seed);
    if (seed && searchStudentsUrl) {
      // Fire lookup so OCR-extracted names reopen the disambiguation dropdown
      (async () => {
        setStudentSearching(true);
        try {
          const res = await fetch(`${searchStudentsUrl}?q=${encodeURIComponent(seed)}`, {
            headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
          });
          if (!res.ok) throw new Error("search failed");
          const json = await res.json();
          setStudentHits((json.results || []).map(mapStudentHit));
        } catch {
          setStudentHits([]);
        } finally {
          setStudentSearching(false);
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIdx]);

  // Once taxonomy options arrive, remap any OCR codes (e.g. "L1") onto DB option values.
  useEffect(() => {
    if (envOptions.length === 0 && tierOptions.length === 0) return;
    setForms(prev => prev.map(f => ({
      ...f,
      level: f.level ? (fuzzyPickTaxonomy(envOptions, f.level) || f.level) : f.level,
      tier: f.tier ? (fuzzyPickTaxonomy(tierOptions, f.tier) || f.tier) : f.tier,
    })));
  }, [envOptions, tierOptions]);

  const nextPending = (from: number, newSaved: Set<number>, newDisc: Set<number>) => {
    const after = dynCerts.findIndex((_, i) => i > from && !newSaved.has(i) && !newDisc.has(i));
    if (after !== -1) return after;
    const any   = dynCerts.findIndex((_, i) => i !== from && !newSaved.has(i) && !newDisc.has(i));
    return any !== -1 ? any : from;
  };

  const handleSaveNext = async () => {
    if (isLive && cert?.dbId) {
      try {
        setPipelineMsg("儲存中…");
        const res = await fetch(`${saveUrlBase.replace(/\/$/, "")}/${cert.dbId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          body: JSON.stringify({
            student_id: cert.studentId || null,
            environment_level: form.level,
            tier_role: form.tier,
            achievement_title: form.title,
            award_details: form.award,
            hours: form.hours,
            event_date: form.date,
          }),
        });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.message || "儲存失敗");
        setDynCerts(prev => prev.map((c, i) => i === activeIdx ? {
          ...c,
          reviewStatus: "reviewed",
          studentId: cert.studentId ?? c.studentId,
          studentLabel: cert.studentLabel || c.studentLabel,
          studentZh: cert.studentZh || c.studentZh,
          studentEn: cert.studentEn || c.studentEn,
          classCode: cert.classCode || c.classCode,
        } : c));
        setPipelineMsg(null);
      } catch (err: any) {
        setPipelineMsg(err?.message || "儲存失敗");
        setTimeout(() => setPipelineMsg(null), 3500);
        return;
      }
    }
    const ns = new Set([...saved, activeIdx]);
    setSaved(ns);
    setEditingStudent(false);
    setActiveIdx(nextPending(activeIdx, ns, discarded));
  };

  const handleDiscard = () => {
    const nd = new Set([...discarded, activeIdx]);
    setDiscarded(nd);
    setActiveIdx(nextPending(activeIdx, saved, nd));
  };

  const handleSubmitAll = () => {
    if (allDone && !submitDone) setSubmitDone(true);
  };

  const totalCerts   = dynCerts.length;
  const highlightStyle: React.CSSProperties = aiHighlight
    ? { background: "#D1E7DD", transition: "background-color 0.35s ease" }
    : { transition: "background-color 0.35s ease" };

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: isMobile ? "auto" : "calc(100vh - 56px)",
      minHeight: isMobile ? "100%" : undefined,
      fontFamily: F, background: C.pageBg,
      overflow: isMobile ? "visible" : "hidden",
    }}>

      {/* ── Page Header ── */}
      <div style={{
        flexShrink: 0,
        background: C.surface, borderBottom: `1px solid ${C.border}`,
        display: "flex", alignItems: "center",
        padding: isMobile ? "10px 16px" : "0 24px",
        height: isMobile ? "auto" : 52,
        gap: 12, flexWrap: "wrap",
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: R.md,
          background: C.accentLight, display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <Layers size={15} color={C.accent} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.textPrimary, lineHeight: 1.2 }}>
            {batchTitle ? `REVIEW STATION: ${batchTitle}` : "證書批次上傳與審核"}
          </div>
          {!isMobile && (
            <div style={{ fontSize: 11, color: C.textMuted }}>
              {batchTitle ? "Batch Certificate Upload & Review" : "Batch Certificate Upload & Review"}
            </div>
          )}
        </div>
        {/* Status summary pills */}
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          {[
            { label: isMobile ? `${saved.size} 核准` : `${saved.size} 已核准`, bg: C.greenLight,  color: C.success,  border: `${C.success}30`  },
            { label: isMobile ? `${discarded.size} 捨棄` : `${discarded.size} 已捨棄`, bg: C.errorLight, color: C.error,   border: `${C.error}30`   },
            { label: isMobile ? `${totalCerts - savedCount} 待審` : `${totalCerts - savedCount} 待審核`, bg: C.amberLight, color: C.amber,   border: `${C.amber}30`   },
          ].map(p => (
            <div key={p.label} style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: "3px 8px", background: p.bg,
              border: `1px solid ${p.border}`, borderRadius: R.full,
              fontSize: 11, fontWeight: 700, color: p.color, whiteSpace: "nowrap",
            }}>
              {p.label}
            </div>
          ))}
        </div>
      </div>

      {/* ── Event Linkage Bar ── */}
      <div style={{
        flexShrink: 0,
        background: "linear-gradient(135deg, #1E3A8A, #2563EB)",
        borderBottom: "1px solid #1D4ED8",
        padding: isMobile ? "10px 16px" : "10px 24px",
        display: "flex", alignItems: "center", gap: 14,
        flexWrap: "wrap",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Link2 size={13} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.6)", letterSpacing: "0.07em", textTransform: "uppercase", lineHeight: 1 }}>關聯活動 / 比賽</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)" }}>Link to Event / Competition</div>
          </div>
        </div>

        <div style={{ width: 1, height: 28, background: "rgba(255,255,255,0.2)", flexShrink: 0 }} />

        {/* Event dropdown */}
        <div style={{ position: "relative", flex: 1, minWidth: 220, maxWidth: 480 }}>
          <button
            onClick={() => setEventOpen(v => !v)}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 8,
              padding: "8px 13px",
              background: "rgba(255,255,255,0.12)",
              border: `1.5px solid ${eventOpen ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.28)"}`,
              borderRadius: 9, cursor: "pointer", fontFamily: F,
              color: "#fff", fontSize: 12.5, fontWeight: 600,
              transition: "all 0.14s",
            }}
          >
            <CheckCircle2 size={13} color={linkedEvent === eventChoices[0] ? "rgba(255,255,255,0.4)" : "#6EE7B7"} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", opacity: linkedEvent === eventChoices[0] ? 0.55 : 1 }}>
              {linkedEvent}
            </span>
            <ChevronDown size={13} color="rgba(255,255,255,0.65)" style={{ flexShrink: 0, transform: eventOpen ? "rotate(180deg)" : "none", transition: "transform 0.14s" }} />
          </button>

          {eventOpen && (
            <>
              <div onClick={() => setEventOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 199 }} />
              <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, background: C.surface, border: `1px solid ${C.border}`, borderRadius: R.lg, boxShadow: "0 8px 24px rgba(0,0,0,0.14)", zIndex: 200, overflow: "hidden", maxHeight: 320, overflowY: "auto" }}>
                {eventChoices.map(ev => (
                  <button
                    key={ev}
                    onClick={() => { setLinkedEvent(ev); setEventOpen(false); }}
                    style={{
                      width: "100%", textAlign: "left", padding: "10px 15px",
                      border: "none", borderBottom: `1px solid ${C.border}`,
                      background: ev === linkedEvent ? C.accentPale : "transparent",
                      color: ev === linkedEvent ? C.accent : C.textSecondary,
                      fontSize: 12.5, fontWeight: ev === linkedEvent ? 700 : 400,
                      cursor: "pointer", fontFamily: F,
                      display: "flex", alignItems: "center", gap: 10,
                    }}
                  >
                    {ev === linkedEvent
                      ? <CheckCircle2 size={12} color={C.accent} />
                      : <div style={{ width: 12, height: 12, borderRadius: "50%", border: `1.5px solid ${C.border}` }} />
                    }
                    <span style={{ flex: 1 }}>{ev}</span>
                  </button>
                ))}
                <button
                  onClick={() => setEventOpen(false)}
                  style={{ width: "100%", padding: "8px 15px", border: "none", background: "#F8FAFC", color: C.textMuted, fontSize: 11, cursor: "pointer", fontFamily: F, display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}
                >
                  <Plus size={11} /> 新增活動… Add Event
                </button>
              </div>
            </>
          )}
        </div>

        {/* Cert count pill */}
        {linkedEvent !== eventChoices[0] && (
          <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 5, padding: "4px 11px", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 999, fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.8)" }}>
            <Layers size={10} color="rgba(255,255,255,0.7)" />
            {totalCerts} 份證書將關聯至此活動
          </div>
        )}
      </div>

      {(flashSuccess || flashError || pipelineMsg) && (
        <div style={{
          flexShrink: 0, padding: "8px 24px",
          background: flashError || (pipelineMsg && /失敗|錯誤/.test(pipelineMsg)) ? C.errorLight : C.greenLight,
          borderBottom: `1px solid ${C.border}`,
          fontSize: 12, fontWeight: 600,
          color: flashError || (pipelineMsg && /失敗|錯誤/.test(pipelineMsg)) ? C.error : "#065F46",
        }}>
          {pipelineMsg || flashError || flashSuccess}
        </div>
      )}

      {/* ── Two-panel body ── */}
      <div style={{
        flex: isMobile ? "none" : 1,
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        overflow: isMobile ? "visible" : "hidden",
      }}>

        {/* ════ LEFT PANE (45%) ════ */}
        <div style={{
          flex: isMobile ? "none" : "0 0 42%",
          minWidth: isMobile ? 0 : 360,
          maxWidth: isMobile ? "none" : 520,
          display: "flex", flexDirection: "column",
          borderRight: isMobile ? "none" : `1px solid ${C.border}`,
          borderBottom: isMobile ? `1px solid ${C.border}` : "none",
          background: C.surface,
          overflow: isMobile ? "visible" : "hidden",
        }}>
          {/* Left header */}
          <div style={{
            padding: isMobile ? "10px 16px" : "12px 20px",
            borderBottom: `1px solid ${C.border}`,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexShrink: 0,
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary }}>批量處理</div>
              <div style={{ fontSize: 11, color: C.textMuted }}>Batch Processing</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {scanningIds.size > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: R.full, background: "#F0FDF4", border: "1px solid #A7F3D0", fontSize: 10, fontWeight: 700, color: "#065F46" }}>
                  <Clock size={9} color="#059669" />
                  OCR 處理中 {scanningIds.size} 份
                </div>
              )}
              <div style={{
                padding: "3px 10px", borderRadius: R.full,
                background: C.accentPale, border: `1px solid ${C.accentLight}`,
                fontSize: 11, fontWeight: 700, color: C.accent,
              }}>
                {totalCerts} 份文件
              </div>
            </div>
          </div>

          {/* ── Upload Drop Zone ── */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(false); }}
            onDrop={handleDrop}
            style={{
              margin: "10px 14px 4px",
              padding: dragOver ? "14px 12px" : "12px",
              border: `2px dashed ${dragOver ? C.accent : C.border}`,
              borderRadius: R.lg,
              background: dragOver ? C.accentPale : "#FAFBFC",
              display: "flex", alignItems: "center", gap: 10,
              cursor: "pointer",
              transition: "all 0.18s",
              flexShrink: 0,
            }}
            onClick={openFilePicker}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".png,.jpg,.jpeg,.pdf"
              style={{ display: "none" }}
              onChange={e => { if (e.target.files) processDroppedFiles(e.target.files); e.target.value = ""; }}
            />
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: dragOver ? C.accentLight : C.border,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.18s",
            }}>
              <Upload size={16} color={dragOver ? C.accent : C.textMuted} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: dragOver ? C.accent : C.textPrimary, lineHeight: 1.2 }}>
                {dragOver ? "放開以上傳文件" : "拖放或點擊上傳證書"}
              </div>
              <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>
                支援 PNG · JPG · PDF · 可多選 · OCR 自動識別
              </div>
            </div>
            <div style={{
              flexShrink: 0, padding: "4px 10px", borderRadius: R.full,
              border: `1px solid ${dragOver ? C.accent : C.border}`,
              background: dragOver ? C.accentPale : C.surface,
              fontSize: 10, fontWeight: 700,
              color: dragOver ? C.accent : C.textMuted,
            }}>
              選擇文件
            </div>
          </div>

          {/* Thumbnail Strip */}
          <div style={{
            padding: isMobile ? "8px 16px 8px" : "8px 14px 8px",
            borderBottom: `1px solid ${C.divider}`,
            display: "flex", gap: 8,
            overflowX: "auto",
            flexShrink: 0,
          }}>
            {dynCerts.map((c, i) => (
              <Thumbnail
                key={c.id}
                cert={c} index={i}
                active={i === activeIdx}
                saved={saved.has(i)}
                discarded={discarded.has(i)}
                scanning={scanningIds.has(c.id)}
                onClick={() => setActiveIdx(i)}
              />
            ))}
          </div>

          {/* Certificate Preview + Confidence */}
          <div style={{
            flex: isMobile ? "none" : 1,
            overflowY: isMobile ? "visible" : "auto",
            overflowX: "hidden",
            padding: isMobile ? "12px 16px" : "16px 20px",
            display: "flex", flexDirection: "column", gap: 12,
          }}>
            {cert ? (
              <CertPreview cert={cert} />
            ) : (
              <div
                role="button"
                tabIndex={0}
                onDragOver={e => { e.preventDefault(); e.stopPropagation(); setEmptyDragOver(true); }}
                onDragLeave={e => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) setEmptyDragOver(false);
                }}
                onDrop={handleDrop}
                onClick={openFilePicker}
                onKeyDown={e => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openFilePicker();
                  }
                }}
                style={{
                  flex: 1, minHeight: 200,
                  border: `3px dashed ${emptyDragOver ? C.accent : C.border}`,
                  borderRadius: R.lg,
                  background: emptyDragOver ? C.accentPale : "#FAFBFC",
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", gap: 10,
                  color: emptyDragOver ? C.accent : C.textMuted,
                  fontSize: 13, fontFamily: F, textAlign: "center", padding: 24,
                  cursor: "pointer",
                  transition: "all 0.18s ease",
                  outline: "none",
                }}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: emptyDragOver ? C.accentLight : C.border,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.18s",
                }}>
                  <Upload size={22} color={emptyDragOver ? C.accent : C.textMuted} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: emptyDragOver ? C.accent : C.textPrimary, lineHeight: 1.35 }}>
                  {emptyDragOver ? "放開以上傳文件" : "拖放證書檔案至此處，或點擊選擇檔案"}
                </div>
                <div style={{ fontSize: 11, color: C.textMuted }}>
                  Drop certificates here, or click to select files
                </div>
                <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>
                  支援 PNG · JPG · PDF · 可多選 · OCR 自動識別
                </div>
              </div>
            )}

            {/* AI Confidence Pill */}
            {cert && (
              <div>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "5px 12px",
                  background: cert.confidence >= 90 ? "#D1FAE5" : "#FEF3C7",
                  border: `1px solid ${cert.confidence >= 90 ? "#A7F3D0" : "#FCD34D"}`,
                  borderRadius: R.full,
                  fontSize: 12, fontWeight: 700,
                  color: cert.confidence >= 90 ? "#065F46" : "#92400E",
                }}>
                  <CheckCircle2 size={12} color={cert.confidence >= 90 ? C.success : C.amber} />
                  🟢 AI Confidence Score: {cert.confidence || 0}%
                </span>
              </div>
            )}

            {/* Field-level confidence */}
            {cert && (
              <div style={{
                padding: 14, background: C.pageBg,
                borderRadius: R.md, border: `1px solid ${C.border}`,
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.textSecondary, marginBottom: 10 }}>
                  欄位置信度 · Field Confidence
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <ConfidenceBar
                    label="Student Name 學生姓名"
                    value={Number(cert.fieldConf?.student_name ?? cert.matchConf ?? 0)}
                  />
                  <ConfidenceBar
                    label="Award Level 獎項級別"
                    value={Number(cert.fieldConf?.award_level ?? Math.min(99, Math.round((cert.confidence || 0) + 3)))}
                  />
                  <ConfidenceBar
                    label="Event Title 活動名稱"
                    value={Number(cert.fieldConf?.event_title ?? Math.max(0, Math.round((cert.confidence || 0) - 1)))}
                  />
                  <ConfidenceBar
                    label="Event Date 日期"
                    value={Number(cert.fieldConf?.event_date ?? Math.max(0, Math.round((cert.confidence || 0) - 4)))}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ════ RIGHT PANE (55%) ════ */}
        <div style={{
          flex: isMobile ? "none" : "1 1 0",
          minWidth: isMobile ? 0 : 420,
          display: "flex", flexDirection: "column",
          background: C.pageBg,
          // Allow student autocomplete to float over Extracted Data below
          overflow: (isMobile || studentHits.length > 0) ? "visible" : "hidden",
        }}>
          {/* Right header */}
          <div style={{
            padding: isMobile ? "10px 16px" : "12px 24px",
            borderBottom: `1px solid ${C.border}`,
            background: C.surface,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexShrink: 0,
          }}>
            <style>{`@keyframes ocrSpin{to{transform:rotate(360deg)}}`}</style>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <Sparkles size={14} color={C.accentMid} />
              <span style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary }}>
                ✨ Auto-Extracted Data
              </span>
              <span style={{ fontSize: 11, color: C.textMuted }}>自動萃取數據</span>
              <button
                type="button"
                id="btn-rescan-ocr"
                onClick={() => void rescanActiveOcr()}
                disabled={rescanning || isScanning || !cert}
                title="重新觸發 AI OCR"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  marginLeft: 4, padding: "4px 10px",
                  borderRadius: R.sm, fontSize: 11, fontWeight: 700, fontFamily: F,
                  border: `1px solid ${C.accentLight}`,
                  background: rescanning ? C.accentPale : C.surface,
                  color: C.accent, cursor: rescanning || isScanning ? "wait" : "pointer",
                  opacity: !cert ? 0.45 : 1,
                }}
              >
                <RefreshCw size={12} style={{
                  animation: rescanning ? "ocrSpin 0.9s linear infinite" : undefined,
                }} />
                {rescanning ? "掃描中…" : "重新掃描 (Re-scan)"}
              </button>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button
                onClick={() => setActiveIdx(Math.max(0, activeIdx - 1))}
                disabled={activeIdx === 0}
                style={{
                  width: 26, height: 26, borderRadius: R.sm,
                  border: `1px solid ${C.border}`, background: C.surface,
                  cursor: activeIdx === 0 ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  opacity: activeIdx === 0 ? 0.4 : 1,
                }}
              >
                <ChevronLeft size={13} color={C.textSecondary} />
              </button>
              <div style={{
                padding: "3px 12px", borderRadius: R.full,
                background: C.accentPale, border: `1px solid ${C.accentLight}`,
                fontSize: 11, fontWeight: 700, color: C.accent,
              }}>
                文件 {activeIdx + 1} / {totalCerts}
              </div>
              <button
                onClick={() => setActiveIdx(Math.min(totalCerts - 1, activeIdx + 1))}
                disabled={activeIdx === totalCerts - 1}
                style={{
                  width: 26, height: 26, borderRadius: R.sm,
                  border: `1px solid ${C.border}`, background: C.surface,
                  cursor: activeIdx === totalCerts - 1 ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  opacity: activeIdx === totalCerts - 1 ? 0.4 : 1,
                }}
              >
                <ChevronRight size={13} color={C.textSecondary} />
              </button>
            </div>
          </div>

          {/* Scrollable form area — open student autocomplete must not be clipped */}
          <div style={{
            flex: isMobile ? "none" : 1,
            overflowY: (isMobile || studentHits.length > 0) ? "visible" : "auto",
            overflowX: studentHits.length > 0 ? "visible" : "hidden",
            padding: isMobile ? "12px 16px" : "16px 24px",
            display: "flex", flexDirection: "column", gap: 12,
          }}>
            <style>{`
              .sts-batch-ocr .form-select {
                display: block; width: 100%; height: 36px;
                padding: 0.375rem 2.25rem 0.375rem 0.75rem;
                font-size: 13px; font-family: ${F}; font-weight: 400; line-height: 1.5;
                color: ${C.textPrimary};
                background-color: ${C.surface};
                background-image: ${BS_SELECT_CHEVRON};
                background-repeat: no-repeat;
                background-position: right 0.75rem center;
                background-size: 16px 12px;
                border: 1px solid ${C.border};
                border-radius: ${R.md};
                appearance: none; -webkit-appearance: none;
                box-sizing: border-box; outline: none; cursor: pointer;
              }
              .sts-batch-ocr .form-select:disabled {
                opacity: 0.65; cursor: not-allowed;
              }
              .sts-batch-ocr .form-select.is-ai-highlight {
                background-color: #D1E7DD;
                /* keep chevron — never use background shorthand here */
                background-image: ${BS_SELECT_CHEVRON};
                background-repeat: no-repeat;
                background-position: right 0.75rem center;
                background-size: 16px 12px;
              }
            `}</style>

            {/* AI notice banner */}
            {isScanning ? (
              <div style={{
                padding: "20px 14px", textAlign: "center",
                background: "#F0FDF4", border: "1px solid #A7F3D0",
                borderRadius: R.md,
              }}>
                <style>{`@keyframes ocrSpin{to{transform:rotate(360deg)}}`}</style>
                <div style={{ fontSize: 28, marginBottom: 10 }}>🔍</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#065F46", fontFamily: F }}>OCR 掃瞄中… Scanning</div>
                <div style={{ fontSize: 11, color: "#047857", marginTop: 4, fontFamily: F }}>AI 正在識別證書內容，請稍候…</div>
                <div style={{ display: "flex", justifyContent: "center", gap: 5, marginTop: 12 }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#059669", animation: `ocrSpin 0.9s ease-in-out ${i * 0.18}s infinite alternate`, opacity: 0.7 }} />
                  ))}
                </div>
              </div>
            ) : (
              <div style={{
                padding: "9px 14px",
                background: "#EFF6FF", border: "1px solid #BFDBFE",
                borderRadius: R.md, fontSize: 12, color: "#1E40AF", fontWeight: 500,
              }}>
                ✨ 以下欄位由 OCR 自動填寫，請審核後確認。Fields were auto-populated by AI — please review before saving.
              </div>
            )}

            {/* Form sections — hidden while OCR is in progress */}
            {!isScanning && (<>

            {/* ── SECTION 1: Student Association — overflow visible so autocomplete can float ── */}
            <div
              className="sts-batch-ocr"
              style={{
                background: C.surface, borderRadius: R.lg,
                border: `1px solid ${C.border}`, boxShadow: S.xs,
                overflow: "visible",
                position: "relative",
                zIndex: studentHits.length > 0 ? 20 : 1,
              }}
            >
              <div style={{
                padding: "9px 16px",
                background: "linear-gradient(to right, #EFF6FF, #F0FDF4)",
                borderBottom: `1px solid ${C.border}`,
                borderRadius: `${R.lg} ${R.lg} 0 0`,
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <User size={13} color={C.accent} />
                <span style={{ fontSize: 12, fontWeight: 700, color: C.textPrimary }}>學生綁定</span>
                <span style={{ fontSize: 11, color: C.textMuted }}>· Student Association</span>
                <div style={{ flex: 1 }} />
                <span style={{
                  padding: "2px 8px", borderRadius: R.full, fontSize: 10, fontWeight: 700,
                  background: "#D1FAE5", color: "#065F46", border: "1px solid #A7F3D0",
                }}>
                  ✓ CRITICAL
                </span>
              </div>

              <div style={{ padding: "14px 16px", overflow: "visible", position: "relative" }}>
                <FormLabel zh="關聯學生" en="Linked Student" />

                {/* Conflict: multiple roster hits — actionable warning opens picker */}
                {(cert?.conflictCount || 0) > 1 && !hasBoundStudent(cert) && (
                  <div
                    role="button"
                    tabIndex={0}
                    className="alert alert-warning py-2 mb-2 d-flex align-items-center"
                    onClick={openConflictPicker}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") openConflictPicker(); }}
                    style={{
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 12px",
                      marginBottom: 8,
                      borderRadius: R.md,
                      background: "#FFFBEB",
                      border: "1px solid #FCD34D",
                      color: "#92400E",
                      fontSize: 12,
                      fontFamily: F,
                    }}
                  >
                    <AlertCircle size={14} color="#D97706" style={{ flexShrink: 0 }} />
                    <strong style={{ flex: 1, fontWeight: 700 }}>
                      已配對有 {cert.conflictCount} 個 {cert.extractedNameRaw || "同名學生"}，待使用者選取結果
                    </strong>
                    <span style={{
                      flexShrink: 0, fontSize: 11, fontWeight: 700,
                      textDecoration: "underline", color: "#B45309",
                    }}>
                      點擊選取
                    </span>
                  </div>
                )}

                {/* Bound chip OR search mode — hydrate chip from saved student_id on refresh */}
                {!editingStudent && hasBoundStudent(cert) ? (
                  <div style={{
                    border: `2px solid ${C.accent}`,
                    borderRadius: R.md, background: C.surface,
                    padding: "7px 12px",
                    display: "flex", alignItems: "center", gap: 8,
                  }}>
                    <Search size={13} color={C.textMuted} style={{ flexShrink: 0 }} />
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      padding: "3px 10px",
                      background: "#EFF6FF", border: `1px solid ${C.accentLight}`,
                      borderRadius: R.full,
                      fontSize: 12, fontWeight: 600, color: C.accentDark,
                      ...highlightStyle,
                    }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: "50%",
                        background: C.accentLight,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 11,
                      }}>👤</div>
                      {cert.studentLabel
                        || formatStudentDisplay(cert.studentZh, cert.studentEn, cert.classCode)
                        || "—"}
                      <CheckCircle2 size={11} color={C.success} />
                    </div>
                    <div style={{ flex: 1 }} />
                    <button
                      type="button"
                      onClick={beginChangeStudent}
                      style={{
                        fontSize: 11, color: C.accent, background: "none",
                        border: "none", cursor: "pointer", fontFamily: F, padding: 0,
                        fontWeight: 600,
                      }}
                    >
                      更改
                    </button>
                    <button
                      type="button"
                      onClick={clearStudentBinding}
                      title="解除綁定"
                      style={{
                        fontSize: 11, color: C.error, background: "none",
                        border: "none", cursor: "pointer", fontFamily: F, padding: 0,
                        fontWeight: 600, marginLeft: 8,
                      }}
                    >
                      清除
                    </button>
                  </div>
                ) : (
                  <div className="mb-3 position-relative" style={{ position: "relative", zIndex: 30 }}>
                    <div style={{
                      border: `2px solid ${C.accent}`,
                      borderRadius: R.md, background: C.surface,
                      padding: "7px 12px",
                      display: "flex", alignItems: "center", gap: 8,
                    }}>
                      <Search size={13} color={C.textMuted} style={{ flexShrink: 0 }} />
                      <input
                        ref={studentSearchInputRef}
                        autoFocus
                        value={studentQuery}
                        onChange={e => runStudentSearch(e.target.value)}
                        placeholder="OCR 自動匹配或手動搜尋…"
                        style={{
                          flex: 1, border: "none", outline: "none", background: "transparent",
                          fontSize: 13, fontFamily: F, color: C.textPrimary,
                        }}
                      />
                      {studentSearching && (
                        <span style={{ fontSize: 10, color: C.textMuted }}>搜尋中…</span>
                      )}
                      {(cert?.studentId || studentQuery) && (
                        <button
                          type="button"
                          onClick={() => {
                            if (hasBoundStudent(cert)) {
                              setEditingStudent(false);
                              setStudentQuery("");
                              setStudentHits([]);
                              setStudentSearchError(null);
                            } else {
                              clearStudentBinding();
                            }
                          }}
                          style={{
                            fontSize: 11, color: C.textMuted, background: "none",
                            border: "none", cursor: "pointer", fontFamily: F, padding: 0,
                          }}
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>
                    {studentSearchError && (
                      <div style={{ marginTop: 6, fontSize: 11, color: C.error }}>{studentSearchError}</div>
                    )}
                    {studentHits.length > 0 && (
                      <ul
                        className="list-group position-absolute w-100 shadow dropdown-menu show"
                        style={{
                          position: "absolute", left: 0, right: 0, top: "100%",
                          zIndex: 1050, listStyle: "none", padding: 0, margin: "4px 0 0",
                          background: C.surface, border: `1px solid ${C.border}`, borderRadius: R.md,
                          boxShadow: "0 12px 28px rgba(15, 23, 42, 0.18)",
                          maxHeight: 260, overflowY: "auto",
                          display: "block",
                        }}
                      >
                        {studentHits.map(hit => {
                          const cls = hit.class_code || hit.class_name || "—";
                          const num = hit.student_number || hit.student_code || "—";
                          const card = hit.card_id || num;
                          return (
                            <li
                              key={hit.id}
                              className="list-group-item list-group-item-action"
                              onClick={() => confirmStudentAssociation(hit)}
                              style={{
                                display: "flex", justifyContent: "space-between", alignItems: "center",
                                gap: 10, padding: "9px 12px", cursor: "pointer",
                                borderBottom: `1px solid ${C.divider}`, fontFamily: F, fontSize: 12,
                                color: C.textPrimary, background: "transparent",
                              }}
                              onMouseEnter={e => { e.currentTarget.style.background = C.accentPale; }}
                              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                            >
                              <span>
                                <strong>{hit.name_zh || hit.text}</strong>
                                {hit.name_en ? ` (${hit.name_en})` : ""}
                              </span>
                              <span style={{
                                flexShrink: 0, fontSize: 10, fontWeight: 600,
                                padding: "2px 8px", borderRadius: 999,
                                background: C.pageBg, border: `1px solid ${C.border}`,
                                color: C.textSecondary, whiteSpace: "nowrap",
                              }}>
                                班別: {cls} | 學號: {num} | 證號: {card}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                )}

                {/* AI helper text */}
                {(cert?.matchConf || 0) > 0 && !editingStudent && hasBoundStudent(cert) && (
                  <div style={{
                    marginTop: 6, display: "flex", alignItems: "center", gap: 5,
                    fontSize: 11, color: "#7C3AED",
                  }}>
                    <Sparkles size={10} color="#7C3AED" />
                    <span>
                      ✨ AI 根據證書姓名自動匹配 · Auto-matched by AI ({cert.matchConf}% confidence)
                    </span>
                  </div>
                )}
                {editingStudent && studentHits.length > 1 && (
                  <div style={{
                    marginTop: 6, display: "flex", alignItems: "center", gap: 5,
                    fontSize: 11, color: "#B45309",
                  }}>
                    <AlertCircle size={10} color="#B45309" />
                    <span>
                      找到 {studentHits.length} 位「{studentQuery || cert?.extractedNameRaw || "同名"}」
                      （請按班別選取）· Pick the correct class variant
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* ── SECTION 2: Extracted Data ── */}
            <div
              className="sts-batch-ocr"
              style={{
                background: C.surface, borderRadius: R.lg,
                border: `1px solid ${C.border}`, boxShadow: S.xs,
                overflow: "visible",
                position: "relative",
                zIndex: 0,
              }}
            >
              <div style={{
                padding: "9px 16px",
                background: C.pageBg, borderBottom: `1px solid ${C.border}`,
                borderRadius: `${R.lg} ${R.lg} 0 0`,
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <FileCheck size={13} color={C.textSecondary} />
                <span style={{ fontSize: 12, fontWeight: 700, color: C.textPrimary }}>萃取數據</span>
                <span style={{ fontSize: 11, color: C.textMuted }}>· Extracted Data</span>
              </div>

              <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>

                <div>
                  <FormLabel zh="環境等級" en="Environment Level" />
                  <select
                    className={`form-select${aiHighlight ? " is-ai-highlight" : ""}`}
                    value={form.level}
                    onChange={e => updateField("level", e.target.value)}
                    disabled={taxonomyLoading && envOptions.length === 0}
                  >
                    <option value="">{taxonomyLoading ? "載入中…" : "— 請選擇 —"}</option>
                    {envOptions.map(o => (
                      <option key={o.id || o.value} value={o.value}>{o.label}</option>
                    ))}
                    {form.level && !envOptions.some(o => o.value === form.level) ? (
                      <option value={form.level}>{form.level}</option>
                    ) : null}
                  </select>
                </div>

                <div>
                  <FormLabel zh="參與層次" en="Tier Role" />
                  <select
                    className={`form-select${aiHighlight ? " is-ai-highlight" : ""}`}
                    value={form.tier}
                    onChange={e => updateField("tier", e.target.value)}
                    disabled={taxonomyLoading && tierOptions.length === 0}
                  >
                    <option value="">{taxonomyLoading ? "載入中…" : "— 請選擇 —"}</option>
                    {tierOptions.map(o => (
                      <option key={o.id || o.value} value={o.value}>{o.label}</option>
                    ))}
                    {form.tier && !tierOptions.some(o => o.value === form.tier) ? (
                      <option value={form.tier}>{form.tier}</option>
                    ) : null}
                  </select>
                </div>

                <div>
                  <FormLabel zh="成就名稱" en="Achievement Title" />
                  <input
                    value={form.title}
                    onChange={e => updateField("title", e.target.value)}
                    style={{ ...inputBase, ...highlightStyle }}
                  />
                </div>

                <div>
                  <FormLabel zh="獎項詳情" en="Award Details" />
                  <input
                    value={form.award}
                    onChange={e => updateField("award", e.target.value)}
                    style={{ ...inputBase, ...highlightStyle }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <FormLabel zh="時數" en="Hours Dimension" />
                    <input
                      type="number"
                      value={form.hours}
                      onChange={e => updateField("hours", e.target.value)}
                      style={{ ...inputBase, ...highlightStyle }}
                    />
                  </div>
                  <div>
                    <FormLabel zh="活動日期" en="Event Date" />
                    <input
                      type="date"
                      value={form.date}
                      onChange={e => updateField("date", e.target.value)}
                      style={{ ...inputBase, ...highlightStyle }}
                    />
                  </div>
                </div>

                {/* Saved state feedback */}
                {isSaved && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "10px 14px", background: C.greenLight,
                    border: "1px solid #A7F3D0", borderRadius: R.md,
                  }}>
                    <CheckCircle2 size={14} color={C.success} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#065F46", fontFamily: F }}>
                      ✓ 此記錄已儲存，等候批量寫入 · Queued for batch submission
                    </span>
                  </div>
                )}

                {/* Discarded state feedback */}
                {isDiscarded && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "10px 14px", background: C.errorLight,
                    border: "1px solid #FECACA", borderRadius: R.md,
                  }}>
                    <AlertCircle size={14} color={C.error} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.error, fontFamily: F }}>
                      此份已捨棄，不會寫入系統 · Discarded from batch
                    </span>
                  </div>
                )}
              </div>
            </div>

            </>)} {/* end !isScanning */}

            <div style={{ height: 8 }} />
          </div>

          {/* ════ STICKY BOTTOM ACTION BAR ════ */}
          <div style={{
            flexShrink: 0,
            borderTop: `1px solid ${C.border}`,
            background: C.surface,
            padding: isMobile ? "12px 16px" : "11px 20px 11px 24px",
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "stretch" : "center",
            gap: isMobile ? 10 : 16,
            boxShadow: "0 -2px 10px rgba(0,0,0,0.07)",
          }}>

            {/* ── Progress section ── */}
            <div style={{ flex: isMobile ? "none" : "1 1 180px", minWidth: isMobile ? 0 : 180, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.textPrimary }}>
                  正在審核 {activeIdx + 1} / {totalCerts}
                </span>
                {!isMobile && (
                  <span style={{ fontSize: 11, fontWeight: 400, color: C.textMuted }}>
                    Reviewing {activeIdx + 1} of {totalCerts}
                  </span>
                )}
              </div>
              <div style={{ marginTop: 5, height: 4, background: C.border, borderRadius: R.full }}>
                <div style={{
                  height: "100%",
                  width: `${totalCerts > 0 ? (savedCount / totalCerts) * 100 : 0}%`,
                  background: allDone ? C.success : C.accent,
                  borderRadius: R.full, transition: "width 0.3s ease",
                }} />
              </div>
              <div style={{ marginTop: 3, fontSize: 10, color: C.textMuted }}>
                {saved.size} 已核准 · {discarded.size} 已捨棄 · {totalCerts - savedCount} 待審核
                {scanningIds.size > 0 && ` · ${scanningIds.size} OCR 中`}
              </div>
            </div>

            {/* ── Button group ── */}
            <div style={{
              flex: "0 0 auto",
              display: "flex", alignItems: "center",
              gap: 8,
              flexDirection: isMobile ? "column" : "row",
            }}>
              {/* Discard + Save row on mobile */}
              <div style={{ display: "flex", gap: 8, width: isMobile ? "100%" : "auto" }}>
                {/* Discard */}
                <button
                  onClick={handleDiscard}
                  disabled={isDiscarded || isScanning}
                  style={{
                    flex: isMobile ? 1 : undefined,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                    padding: "8px 14px",
                    border: `1px solid ${C.error}50`,
                    borderRadius: R.md, background: "transparent",
                    cursor: (isDiscarded || isScanning) ? "not-allowed" : "pointer",
                    fontSize: 12, fontWeight: 600, color: C.error,
                    fontFamily: F, opacity: (isDiscarded || isScanning) ? 0.4 : 1,
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={e => !isDiscarded && (e.currentTarget.style.background = C.errorLight)}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <Trash2 size={13} />
                  捨棄此份
                </button>

                {/* Save & Next */}
                <button
                  onClick={handleSaveNext}
                  disabled={isSaved || isDiscarded || isScanning}
                  style={{
                    flex: isMobile ? 1 : undefined,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                    padding: "8px 16px",
                    border: `1.5px solid ${C.accent}`,
                    borderRadius: R.md, background: C.accentPale,
                    cursor: (isSaved || isDiscarded || isScanning) ? "not-allowed" : "pointer",
                    fontSize: 12, fontWeight: 600, color: C.accent,
                    fontFamily: F, opacity: (isSaved || isDiscarded || isScanning) ? 0.45 : 1,
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={e => !(isSaved || isDiscarded) && (e.currentTarget.style.background = C.accentLight)}
                  onMouseLeave={e => (e.currentTarget.style.background = C.accentPale)}
                >
                  <Save size={13} />
                  儲存並下一份
                  <ArrowRight size={12} />
                </button>
              </div>

              {/* Submit All — Bootstrap disabled = opacity, keeps white-on-primary readable */}
              <style>{`
                .sts-batch-submit.btn {
                  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
                  font-size: 12px; font-family: ${F}; font-weight: 700;
                  white-space: nowrap; border-radius: ${R.md};
                  padding: 0.45rem 1.1rem; line-height: 1.4; border: 1px solid transparent;
                  transition: opacity 0.15s ease, box-shadow 0.15s ease;
                }
                .sts-batch-submit.btn-primary {
                  color: #fff !important;
                  background-color: ${C.accent};
                  border-color: ${C.accentDark};
                  box-shadow: 0 2px 10px rgba(37,99,235,0.35);
                }
                .sts-batch-submit.btn-primary:hover:not(:disabled) {
                  background-color: ${C.accentDark};
                  border-color: ${C.accentDeep};
                  color: #fff !important;
                }
                .sts-batch-submit.btn-success {
                  color: #fff !important;
                  background-color: ${C.success};
                  border-color: ${C.success};
                }
                /* Disabled: lower opacity only — never grey-on-grey that kills contrast */
                .sts-batch-submit.btn:disabled,
                .sts-batch-submit.btn.disabled {
                  opacity: 0.65;
                  cursor: not-allowed;
                  pointer-events: none;
                  box-shadow: none;
                  color: #fff !important;
                }
              `}</style>
              <button
                type="button"
                className={`sts-batch-submit btn px-4 fw-bold ${submitDone ? "btn-success" : "btn-primary"}`}
                disabled={!allDone || submitDone}
                onClick={handleSubmitAll}
                title={!allDone ? "請先完成所有文件審核後再批量寫入" : undefined}
                style={{ width: isMobile ? "100%" : undefined }}
              >
                {submitDone
                  ? <><CheckCircle2 size={13} color="#fff" /> 批量寫入成功！</>
                  : <>🚀 批量寫入 {totalCerts} 筆紀錄</>
                }
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Success toast ── */}
      {submitDone && (
        <div style={{
          position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
          padding: "12px 24px", background: C.success, borderRadius: R.lg,
          color: "#fff", fontSize: 13, fontWeight: 700, boxShadow: S.lg,
          display: "flex", alignItems: "center", gap: 8, zIndex: 9999,
        }}>
          <CheckCircle2 size={16} color="#fff" />
          批量寫入成功！{saved.size} 筆紀錄已提交至學生檔案 · {saved.size} records submitted.
        </div>
      )}
    </div>
  );
};
