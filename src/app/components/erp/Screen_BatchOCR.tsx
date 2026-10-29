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

/** Hard client-side upload cap — must match AchievementController::MAX_CERT_UPLOAD_BYTES. */
const MAX_CERT_UPLOAD_BYTES = 10 * 1024 * 1024;
const MAX_CERT_UPLOAD_MB = 10;
const MAX_CERT_UPLOAD_LABEL = `${MAX_CERT_UPLOAD_MB}MB`;

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

/** Sequential OCR lifecycle for each extracted page / upload. */
export type CertOcrStatus = "pending" | "queued" | "scanning" | "done" | "error";

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
  /** Split-first pipeline: page is waiting / running / finished OCR */
  ocrStatus?:      CertOcrStatus;
  /** Last OCR failure message (504, 0% confidence, etc.) */
  ocrError?:       string | null;
  pageIndex?:      number;
  pageCount?:      number;
  /** Raw GB10 payload — used to re-hydrate the right-hand form on thumbnail switch */
  extractedData?:  Record<string, unknown> | null;
}

/** Coerce OCR scalar → string; treat null/undefined/"null" as empty (never wipe prior form). */
function ocrText(v: unknown): string {
  if (v == null) return "";
  const s = String(v).trim();
  if (!s || s.toLowerCase() === "null" || s.toLowerCase() === "undefined") return "";
  return s;
}

/** Normalize GB10 / CI4 OCR JSON into the form field shape (tolerant of alias keys). */
function normalizeOcrFields(data: any): {
  title: string;
  award: string;
  level: string;
  tier: string;
  hours: string;
  date: string;
  studentName: string;
  classCode: string;
} {
  const d = data && typeof data === "object" ? data : {};
  let date = ocrText(
    d.event_date || d.date || d.award_date || d.certificate_date || d.issued_date,
  );
  if (/^\d{4}$/.test(date)) date = `${date}-01-01`;
  const hoursRaw = d.hours ?? d.service_hours ?? d.duration ?? "";
  return {
    title: ocrText(
      d.achievement_title || d.event_title || d.event || d.title
      || d.award_title || d.competition_name || d.competition || d.activity_name || d.prize,
    ),
    award: ocrText(
      d.award_details || d.award_level || d.award || d.award_name
      || d.prize_details || d.prize || d.result || d.placing,
    ),
    level: ocrText(d.environment_level || d.extracted_level || d.level || d.scope || d.competition_level),
    tier: ocrText(d.tier_role || d.extracted_tier || d.tier || d.role || d.participation_tier),
    hours: hoursRaw != null && hoursRaw !== "" && String(hoursRaw).toLowerCase() !== "null"
      ? String(hoursRaw)
      : "",
    date,
    studentName: ocrText(
      d.extracted_name_raw || d.student_name || d.name || d.recipient || d.awardee,
    ),
    classCode: ocrText(
      d.extracted_class_code || d.class_code || d.class_name || d.student_class || d.class || d.form,
    ),
  };
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
  /** Global GB10 backlog poll — Review Station status badge */
  aiQueueStatusUrl?: string;
  saveUrlBase?: string;
  /** Lightweight field autosave (keeps review_status pending) */
  draftUrl?: string;
  searchStudentsUrl?: string;
  environmentLevelsUrl?: string;
  tierRolesUrl?: string;
  listUrl?: string;
  csrfName?: string;
  csrfHash?: string;
  flashSuccess?: string;
  flashError?: string;
};

type AiQueueStatus = {
  ai_status: "idle" | "busy" | "unknown";
  global_pending_tasks: number;
  /** School-wide GB10 slots currently held (processing). */
  global_processing_tasks?: number;
  active_workers?: number;
  max_workers?: number;
};

/** Upload lifecycle — OCR must never run during UPLOADING / SPLITTING. */
type UploadPhase = "idle" | "uploading" | "splitting" | "ready";

/** Only real DB achievement ids are OCR-safe (never client temp placeholders). */
function committedDbId(c: CertData | undefined | null): number {
  const id = Number(c?.dbId || 0);
  return Number.isFinite(id) && id > 0 ? id : 0;
}

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
  confidence?: number;
  level?: string;
  tier?: string;
  title?: string;
  award?: string;
  hours?: string;
  date?: string;
  ocrStatus?: CertOcrStatus;
  extractedNameRaw?: string;
  /** Full OCR payload — source of truth for form rehydration */
  extractedData?: Record<string, unknown> | null;
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
  const ocrNorm = normalizeOcrFields(raw);
  const hasFields = !!(ocrNorm.title || ocrNorm.award || ocrNorm.level || ocrNorm.date
    || raw.event || raw.achievement_title || raw.event_title
    || raw.award || raw.award_details || raw.award_level);
  const confidence = Number(confRaw > 0 ? confRaw : (studentId ? 94 : (hasFields ? 88 : 0)));
  const matchConf = Number(matchRaw > 0 ? matchRaw : (studentId ? 98 : (hasFields ? 60 : 0)));
  const displayZh = zh || ocrNorm.studentName || (studentId ? (en || "已配對") : "待配對");
  const reviewed = String(raw.reviewStatus || raw.review_status || "pending") === "reviewed";
  const ocrStatusRaw = String(raw.ocrStatus || raw.ocr_status || "").toLowerCase();
  let ocrStatus: CertOcrStatus =
    ocrStatusRaw === "done" || ocrStatusRaw === "error" || ocrStatusRaw === "scanning"
      || ocrStatusRaw === "pending" || ocrStatusRaw === "queued"
      ? (ocrStatusRaw as CertOcrStatus)
      : (reviewed || hasFields || studentId ? "done" : "pending");

  const extractedDataRaw = raw.extractedData || raw.extracted_data || null;
  const extractedData = (extractedDataRaw && typeof extractedDataRaw === "object")
    ? { ...extractedDataRaw }
    : (hasFields ? {
        student_name: ocrNorm.studentName || zh,
        extracted_name_raw: raw.extractedNameRaw || ocrNorm.studentName || "",
        achievement_title: ocrNorm.title || String(raw.event || raw.achievement_title || ""),
        award_details: ocrNorm.award || String(raw.award || raw.award_details || ""),
        environment_level: ocrNorm.level || String(raw.level || raw.environment_level || ""),
        tier_role: ocrNorm.tier || String(raw.tier || raw.tier_role || ""),
        event_date: ocrNorm.date || String(raw.date || raw.event_date || ""),
        hours: ocrNorm.hours || raw.hours || null,
        confidence,
        matchConf,
        field_confidence: fieldConf,
      } : null);

  return {
    id: Number(raw.id || raw.dbId || Date.now()),
    dbId: raw.dbId != null ? Number(raw.dbId) : (raw.id != null ? Number(raw.id) : undefined),
    studentZh: displayZh,
    studentEn: en,
    classCode: cls || ocrNorm.classCode || "—",
    event: ocrNorm.title || String(raw.event || raw.achievement_title || ""),
    award: ocrNorm.award || String(raw.award || raw.award_details || ""),
    level: ocrNorm.level || String(raw.level || raw.environment_level || ""),
    tier: ocrNorm.tier || String(raw.tier || raw.tier_role || ""),
    date: ocrNorm.date || String(raw.date || raw.event_date || ""),
    hours: ocrNorm.hours || String(raw.hours ?? ""),
    confidence,
    matchConf,
    fieldConf,
    imageUrl: raw.imageUrl || raw.image_url || "",
    studentId,
    studentLabel: label,
    reviewStatus: raw.reviewStatus || raw.review_status || "pending",
    ocrStatus,
    ocrError: raw.ocrError || raw.ocr_error || null,
    extractedNameRaw: String(raw.extractedNameRaw || raw.extracted_name_raw || ocrNorm.studentName || "").trim() || undefined,
    extractedData,
    pageIndex: raw.pageIndex != null ? Number(raw.pageIndex) : (raw.page_index != null ? Number(raw.page_index) : undefined),
    pageCount: raw.pageCount != null ? Number(raw.pageCount) : (raw.page_count != null ? Number(raw.page_count) : undefined),
  };
}

/** Placeholder labels written during PDF split — NOT real OCR drafts. */
function isOcrPlaceholderLabel(text: string | undefined | null): boolean {
  const s = String(text || "").trim();
  if (!s || s === "—") return true;
  return /^(第\s*\d+\s*\/\s*\d+\s*頁|待 OCR|排隊中|OCR 掃描中…|掃瞄中…|上傳中…|拆分中…|AI 掃描中…|待配對|失敗)$/i.test(s)
    || /^第\s*\d+\s*\/\s*\d+\s*頁/.test(s)
    || /正在拆分|拆分失敗|AI\s*萃取|GB10|Extraction Failed/i.test(s);
}

/** True when this card already holds real OCR draft fields — do NOT re-hit GB10. */
function certHasExtractedDraft(cert: CertData | undefined | null): boolean {
  if (!cert) return false;
  if (cert.ocrStatus === "done") return true;
  // Explicit lifecycle states that still need (or are mid) OCR — never treat as draft.
  if (
    cert.ocrStatus === "pending"
    || cert.ocrStatus === "queued"
    || cert.ocrStatus === "scanning"
    || cert.ocrStatus === "error"
  ) {
    if (cert.extractedData && typeof cert.extractedData === "object") {
      const n = normalizeOcrFields(cert.extractedData);
      if (n.title || n.award || n.studentName || n.date) return true;
    }
    return Number(cert.confidence) > 0;
  }
  if (cert.extractedData && typeof cert.extractedData === "object") {
    const n = normalizeOcrFields(cert.extractedData);
    if (n.title || n.award || n.studentName || n.date) return true;
  }
  if (Number(cert.confidence) > 0) return true;
  const eventOk = !!(cert.event && !isOcrPlaceholderLabel(cert.event));
  const awardOk = !!(cert.award && !isOcrPlaceholderLabel(cert.award));
  return eventOk || awardOk;
}

const EMPTY_FORM = { level: "", tier: "", title: "", award: "", hours: "", date: "" };

/** Build right-hand form fields from a cert card (extractedData → denormalized fields). */
function formFromCert(cert: CertData | undefined | null): typeof EMPTY_FORM {
  if (!cert) return { ...EMPTY_FORM };
  const fromExtracted = cert.extractedData ? normalizeOcrFields(cert.extractedData) : null;
  return {
    level: fromExtracted?.level || cert.level || "",
    tier: fromExtracted?.tier || cert.tier || "",
    title: fromExtracted?.title || cert.event || "",
    award: fromExtracted?.award || cert.award || "",
    hours: fromExtracted?.hours || cert.hours || "",
    date: fromExtracted?.date || cert.date || "",
  };
}

/** Prefer non-empty form edits; never let "" wipe a known OCR value on the card. */
function mergeFormOntoCert(
  cert: CertData,
  form: Partial<typeof EMPTY_FORM> | undefined,
): CertData {
  const pick = (formVal: string | undefined, cardVal: string | undefined) => {
    const f = (formVal ?? "").trim();
    if (f) return f;
    return (cardVal ?? "").trim();
  };
  const title = pick(form?.title, cert.event);
  const award = pick(form?.award, cert.award);
  const level = pick(form?.level, cert.level);
  const tier = pick(form?.tier, cert.tier);
  const hours = pick(form?.hours, cert.hours);
  const date = pick(form?.date, cert.date);
  const prevExtracted = (cert.extractedData && typeof cert.extractedData === "object")
    ? { ...cert.extractedData }
    : {};
  const hasDraft = !!(title || award || Number(cert.confidence) > 0 || cert.extractedData);
  return {
    ...cert,
    event: title || cert.event,
    award: award || cert.award,
    level: level || cert.level,
    tier: tier || cert.tier,
    hours: hours || cert.hours,
    date: date || cert.date,
    ocrStatus: hasDraft
      && cert.ocrStatus !== "scanning"
      && cert.ocrStatus !== "queued"
      ? "done"
      : cert.ocrStatus,
    extractedData: {
      ...prevExtracted,
      achievement_title: title || (prevExtracted as { achievement_title?: string }).achievement_title || "",
      award_details: award || (prevExtracted as { award_details?: string }).award_details || "",
      environment_level: level || (prevExtracted as { environment_level?: string }).environment_level || "",
      tier_role: tier || (prevExtracted as { tier_role?: string }).tier_role || "",
      hours: hours || (prevExtracted as { hours?: string | null }).hours || null,
      event_date: date || (prevExtracted as { event_date?: string }).event_date || "",
      student_name: cert.extractedNameRaw
        || (prevExtracted as { student_name?: string }).student_name
        || (prevExtracted as { extracted_name_raw?: string }).extracted_name_raw
        || "",
    },
  };
}

/** Bound only when a real DB student entity is linked — OCR name strings alone do not count. */
function hasBoundStudent(cert?: CertData | null): boolean {
  if (!cert) return false;
  return cert.studentId != null && Number(cert.studentId) > 0;
}

type ItemFormState = typeof EMPTY_FORM;
type StudentUiState = {
  query: string;
  hits: StudentHit[];
  editing: boolean;
  searchError: string | null;
  searching: boolean;
};
const EMPTY_STUDENT_UI: StudentUiState = {
  query: "",
  hits: [],
  editing: false,
  searchError: null,
  searching: false,
};

/** Stable dictionary key for per-item form / student UI isolation. */
function certFormKey(c: CertData | undefined | null): number {
  return Number(c?.dbId || c?.id || 0);
}

function seedFormsById(certs: CertData[]): Record<number, ItemFormState> {
  const out: Record<number, ItemFormState> = {};
  for (const c of certs) {
    const k = certFormKey(c);
    if (k > 0) out[k] = formFromCert(c);
  }
  return out;
}

function seedStudentUiById(certs: CertData[]): Record<number, StudentUiState> {
  const out: Record<number, StudentUiState> = {};
  const placeholders = new Set([
    "待配對", "上傳中…", "拆分中…", "AI 掃描中…", "OCR 掃描中…",
    "掃瞄中…", "待 OCR", "排隊中", "失敗", "—",
  ]);
  for (const c of certs) {
    const k = certFormKey(c);
    if (k <= 0) continue;
    if (hasBoundStudent(c)) {
      out[k] = { ...EMPTY_STUDENT_UI, editing: false };
    } else {
      const q = String(c.extractedNameRaw || c.studentZh || "").trim();
      out[k] = {
        ...EMPTY_STUDENT_UI,
        editing: true,
        query: q && !placeholders.has(q) ? q : "",
      };
    }
  }
  return out;
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
}> = ({ cert, index, active, saved, discarded, scanning, onClick }) => {
  const failed = cert.ocrStatus === "error" || cert.studentZh === "失敗";
  const queued = !scanning && !failed && (cert.ocrStatus === "queued" || cert.studentZh === "排隊中");
  const pending = !scanning && !failed && !queued && (cert.ocrStatus === "pending" || cert.studentZh === "待 OCR");
  const done = !scanning && !failed && !queued && !pending && (cert.ocrStatus === "done" || Number(cert.confidence) > 0);
  const thumbSrc = (cert.imageUrl || "").trim();
  const showImg = !!thumbSrc && !/\.pdf$/i.test(thumbSrc);
  const confBadge = done && Number(cert.confidence) > 0
    ? `🟢 ${Math.round(Number(cert.confidence))}%`
    : null;

  return (
  <button
    onClick={onClick}
    title={
      failed ? (cert.ocrError || "OCR 失敗 — 點擊重試")
        : scanning ? "🔄 掃描中 (Scanning)"
          : queued ? "⏳ 排隊中 (Queued)"
            : pending ? "點擊加入 OCR 佇列"
              : undefined
    }
    style={{
      flexShrink: 0,
      width: 72, height: 90,
      border: active
        ? `2px solid ${failed ? C.error : C.accent}`
        : `1px solid ${failed ? "#FECACA" : queued ? "#FDE68A" : C.border}`,
      borderRadius: R.md,
      background: scanning
        ? "#F0FDF4"
        : discarded
          ? C.errorLight
          : failed
            ? "#FEF2F2"
            : saved
              ? C.greenLight
              : queued
                ? "#FFFBEB"
                : pending
                  ? "#FFFBEB"
                  : active
                    ? C.accentPale
                    : C.surface,
      cursor: "pointer",
      padding: 0,
      position: "relative",
      opacity: discarded ? 0.55 : active ? 1 : 0.75,
      boxShadow: active ? `0 0 0 3px ${failed ? C.errorLight : C.accentLight}, ${S.sm}` : S.xs,
      transition: "all 0.18s ease",
      overflow: "hidden",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 3,
    }}
  >
    {scanning ? (
      <>
        <style>{`
          @keyframes scanMove { 0%{top:10%} 100%{top:85%} }
          @keyframes scanPulse { 0%,100%{opacity:0.5} 50%{opacity:1} }
        `}</style>
        {showImg ? (
          <img src={thumbSrc} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.35 }} />
        ) : (
          <div style={{ fontSize: 16, opacity: 0.4 }}>📄</div>
        )}
        <div style={{
          position: "absolute", left: 0, right: 0, height: 2,
          background: "linear-gradient(90deg, transparent, #38BDF8, #818CF8, transparent)",
          animation: "scanMove 1.1s linear infinite",
          boxShadow: "0 0 6px #38BDF8",
        }} />
        <div style={{
          fontSize: 7.5, fontWeight: 800, letterSpacing: "0.04em",
          color: "#0369A1", fontFamily: F, marginTop: 28, zIndex: 1,
          animation: "scanPulse 1.1s ease-in-out infinite",
        }}>🔄 掃描中</div>
      </>
    ) : (
      <>
        {showImg ? (
          <img
            src={thumbSrc}
            alt=""
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div style={{ fontSize: 20 }}>{failed ? "⚠️" : queued || pending ? "📄" : "🏆"}</div>
        )}
        <div style={{
          position: "absolute", left: 0, right: 0, bottom: 0,
          padding: "14px 2px 4px",
          background: showImg
            ? "linear-gradient(transparent, rgba(15,23,42,0.82))"
            : "transparent",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
        }}>
          <div style={{
            fontSize: 9,
            color: showImg ? "#fff" : (failed ? C.error : C.textSecondary),
            fontFamily: F, fontWeight: failed || queued || pending ? 700 : 400,
            lineHeight: 1.2, textAlign: "center", padding: "0 4px",
            maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {failed ? "失敗" : queued ? "⏳ 排隊中" : pending ? "待 OCR" : (confBadge || cert.studentZh)}
          </div>
          <div style={{
            fontSize: 8, fontFamily: F, fontWeight: 700,
            color: showImg ? "#E0E7FF" : (active ? C.accent : C.textMuted),
            background: showImg ? "rgba(255,255,255,0.15)" : (active ? C.accentLight : C.divider),
            padding: "1px 5px", borderRadius: R.xs,
          }}>
            #{index + 1}
          </div>
        </div>
      </>
    )}
    {saved && !scanning && (
      <div style={{
        position: "absolute", top: 3, right: 3, zIndex: 2,
        display: "inline-flex", alignItems: "center", gap: 2,
        background: "rgba(16,185,129,0.95)", color: "#fff",
        fontSize: 7.5, fontWeight: 800, fontFamily: F,
        padding: "1px 4px", borderRadius: 4, lineHeight: 1.2,
      }}>
        <CheckCircle2 size={9} color="#fff" />
        已批核
      </div>
    )}
    {discarded && (
      <div style={{ position: "absolute", top: 3, right: 4, fontSize: 11, color: C.error, fontWeight: 700, zIndex: 2 }}>✕</div>
    )}
    {(queued || pending) && !scanning && (
      <div style={{
        position: "absolute", top: 4, left: 4, zIndex: 2,
        width: 8, height: 8, borderRadius: "50%", background: queued ? "#F59E0B" : C.amber,
        boxShadow: "0 0 0 2px #FEF3C7",
      }} />
    )}
    {confBadge && !scanning && (
      <div style={{
        position: "absolute", top: 3, left: 3, zIndex: 2,
        fontSize: 7.5, fontWeight: 800, fontFamily: F,
        background: "rgba(16,185,129,0.92)", color: "#fff",
        padding: "1px 4px", borderRadius: 4,
      }}>
        {Math.round(Number(cert.confidence))}%
      </div>
    )}
    {active && !scanning && (
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: failed ? C.error : C.accent, zIndex: 2 }} />
    )}
  </button>
  );
};

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
  aiQueueStatusUrl = "/api/system/ai-queue-status",
  saveUrlBase = "/achievements/review/save",
  draftUrl = "/achievements/api/save-draft",
  searchStudentsUrl = "/api/students/search",
  environmentLevelsUrl = "/api/settings/environment-levels",
  tierRolesUrl = "/api/settings/tier-roles",
  flashSuccess,
  flashError,
}) => {
  const isLive = live && !!uploadUrl;

  const [aiQueue, setAiQueue] = useState<AiQueueStatus>({
    ai_status: "unknown",
    global_pending_tasks: 0,
    global_processing_tasks: 0,
  });

  const seedCerts = useMemo(
    () => (isLive
      ? (initialCerts || []).map(mapIncomingCert)
      : (initialCerts && initialCerts.length ? initialCerts.map(mapIncomingCert) : BATCH_CERTS)),
    // Re-map whenever bridge props arrive / change (page refresh hydration).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isLive, initialCerts],
  );

  // Merge server payload with localStorage draft so OCR + linked student survive refresh.
  const hydratedSeed = useMemo(() => {
    const draft = readReviewDraft(batchId);
    if (!draft || draft.certs.length === 0) return seedCerts;
    return seedCerts.map((c) => {
      const key = Number(c.dbId || c.id);
      const d = draft.certs.find(x => Number(x.dbId || 0) === key);
      if (!d) return c;
      const sid = d.studentId != null && Number(d.studentId) > 0 ? Number(d.studentId) : c.studentId;
      const draftExtracted = d.extractedData && typeof d.extractedData === "object" ? d.extractedData : null;
      const mergedEvent = d.title || c.event;
      const mergedAward = d.award || c.award;
      const hasDraftOcr = !!(mergedEvent || mergedAward || draftExtracted || (Number(d.confidence) > 0));
      return {
        ...c,
        studentId: sid ?? null,
        studentZh: d.studentZh || c.studentZh,
        studentEn: d.studentEn ?? c.studentEn,
        classCode: d.classCode || c.classCode,
        studentLabel: d.studentLabel || c.studentLabel,
        matchConf: d.matchConf ?? c.matchConf,
        confidence: d.confidence ?? c.confidence,
        level: d.level || c.level,
        tier: d.tier || c.tier,
        event: mergedEvent,
        award: mergedAward,
        hours: d.hours ?? c.hours,
        date: d.date || c.date,
        extractedNameRaw: d.extractedNameRaw || c.extractedNameRaw,
        extractedData: draftExtracted || c.extractedData || null,
        ocrStatus: (d.ocrStatus as CertOcrStatus) || c.ocrStatus || (hasDraftOcr ? "done" : c.ocrStatus),
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
  /** Multi-page PDF split progress (null = idle). */
  const [splitProgress, setSplitProgress] = useState<{
    fileName: string;
    phase: "uploading" | "splitting" | "ready";
    pages?: number;
  } | null>(null);
  /** Strict linear phases: never OCR until backend commits batch items. */
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>(
    () => (hydratedSeed.some(c => committedDbId(c) > 0) ? "ready" : "idle"),
  );
  const uploadPhaseRef = useRef<UploadPhase>(uploadPhase);
  useEffect(() => { uploadPhaseRef.current = uploadPhase; }, [uploadPhase]);
  const isSplitBusy = uploadPhase === "uploading" || uploadPhase === "splitting";
  /** Sequential GB10 OCR queue progress (Netflix-style). */
  const [ocrQueueProgress, setOcrQueueProgress] = useState<{
    running: boolean;
    current: number;
    total: number;
    activeDbId: number | null;
  }>({ running: false, current: 0, total: 0, activeDbId: null });
  const [aiHighlight,  setAiHighlight]  = useState(false);
  /** Prevent duplicate concurrent OCR for the same achievement id. */
  const ocrInflightRef = useRef<Set<number>>(new Set());
  /** FIFO queue of achievement dbIds awaiting OCR — drained one-at-a-time. */
  const ocrQueueRef = useRef<number[]>([]);
  const ocrQueueRunningRef = useRef(false);
  const ocrQueueTotalRef = useRef(0);
  const ocrQueueDoneRef = useRef(0);
  const dynCertsRef = useRef<CertData[]>(hydratedSeed);
  useEffect(() => { dynCertsRef.current = dynCerts; }, [dynCerts]);
  // Per-item form + student UI maps — never share one global form across certificates.
  const [formsById, setFormsById] = useState<Record<number, ItemFormState>>(() => seedFormsById(hydratedSeed));
  const formsByIdRef = useRef(formsById);
  useEffect(() => { formsByIdRef.current = formsById; }, [formsById]);

  const [studentUiById, setStudentUiById] = useState<Record<number, StudentUiState>>(
    () => seedStudentUiById(hydratedSeed),
  );
  const studentUiByIdRef = useRef(studentUiById);
  useEffect(() => { studentUiByIdRef.current = studentUiById; }, [studentUiById]);

  const patchStudentUi = useCallback((itemId: number, patch: Partial<StudentUiState>) => {
    if (!itemId) return;
    setStudentUiById(prev => {
      const cur = prev[itemId] || { ...EMPTY_STUDENT_UI };
      const next = { ...prev, [itemId]: { ...cur, ...patch } };
      studentUiByIdRef.current = next;
      return next;
    });
  }, []);

  const [envOptions, setEnvOptions] = useState<TaxonomyOption[]>([]);
  const [tierOptions, setTierOptions] = useState<TaxonomyOption[]>([]);
  const [taxonomyLoading, setTaxonomyLoading] = useState(false);
  const ocrFillIdx = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const studentSearchInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const tempIdSeq = useRef(0);
  const studentSearchTimer = useRef<number | null>(null);
  const draftTimersRef = useRef<Record<number, number>>({});
  const draftReadyRef = useRef(false);

  // Re-sync when bridge certs change (e.g. soft navigation) while preserving draft overlays.
  const seedSigRef = useRef("");
  useEffect(() => {
    const sig = hydratedSeed.map(c => `${c.dbId || c.id}:${c.reviewStatus || ""}`).join("|");
    const hasLocalOcr = dynCertsRef.current.some(
      c => c.ocrStatus === "done" || c.ocrStatus === "scanning" || !!c.extractedData,
    );
    if (sig === seedSigRef.current && hasLocalOcr) {
      draftReadyRef.current = true;
      return;
    }
    if (sig !== seedSigRef.current || dynCertsRef.current.length === 0) {
      seedSigRef.current = sig;
      setDynCerts(hydratedSeed);
      if (
        hydratedSeed.some(c => committedDbId(c) > 0)
        && uploadPhaseRef.current !== "uploading"
        && uploadPhaseRef.current !== "splitting"
      ) {
        setUploadPhase("ready");
        uploadPhaseRef.current = "ready";
      }
      setFormsById(prev => {
        const seeded = seedFormsById(hydratedSeed);
        // Keep local edits for ids that still exist
        const next = { ...seeded };
        for (const [k, v] of Object.entries(prev)) {
          const id = Number(k);
          if (next[id] && v) {
            next[id] = {
              level: v.level || next[id].level,
              tier: v.tier || next[id].tier,
              title: v.title || next[id].title,
              award: v.award || next[id].award,
              hours: v.hours || next[id].hours,
              date: v.date || next[id].date,
            };
          }
        }
        formsByIdRef.current = next;
        return next;
      });
      setStudentUiById(prev => {
        const seeded = seedStudentUiById(hydratedSeed);
        const next = { ...seeded };
        for (const [k, v] of Object.entries(prev)) {
          const id = Number(k);
          if (next[id] && v) next[id] = { ...next[id], ...v };
        }
        studentUiByIdRef.current = next;
        return next;
      });
    }
    draftReadyRef.current = true;
  }, [hydratedSeed]);

  const prevActiveIdxRef = useRef<number>(activeIdx);

  /**
   * Thumbnail click ONLY changes activeItemId (show/hide panes).
   * Never destroys or overwrites another item's form DOM / formsById entry.
   */
  const selectCert = useCallback((nextIdx: number) => {
    const clamped = Math.max(0, Math.min(nextIdx, Math.max(0, dynCertsRef.current.length - 1)));
    prevActiveIdxRef.current = clamped;
    setActiveIdx(clamped);
  }, []);

  // When OCR finishes for an item, applyOcrToForm already writes formsById[itemId].
  // Fill empty slots for that id only (never touch other panes).
  useEffect(() => {
    for (const c of dynCerts) {
      const id = certFormKey(c);
      if (!id || c.ocrStatus === "scanning") continue;
      const hydrated = formFromCert(c);
      setFormsById(prev => {
        const cur = prev[id] || { ...EMPTY_FORM };
        const nextForm: ItemFormState = {
          level: cur.level || fuzzyPickTaxonomy(envOptions, hydrated.level) || hydrated.level,
          tier: cur.tier || fuzzyPickTaxonomy(tierOptions, hydrated.tier) || hydrated.tier,
          title: cur.title || hydrated.title,
          award: cur.award || hydrated.award,
          hours: cur.hours || hydrated.hours,
          date: cur.date || hydrated.date,
        };
        if (
          nextForm.level === cur.level && nextForm.tier === cur.tier
          && nextForm.title === cur.title && nextForm.award === cur.award
          && nextForm.hours === cur.hours && nextForm.date === cur.date
        ) {
          return prev;
        }
        const next = { ...prev, [id]: nextForm };
        formsByIdRef.current = next;
        return next;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dynCerts]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Global GB10 queue transparency — poll while Review Station is mounted.
  useEffect(() => {
    if (!aiQueueStatusUrl) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch(aiQueueStatusUrl, {
          credentials: "same-origin",
          headers: {
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
        });
        if (!res.ok) return;
        const json = await res.json().catch(() => null);
        if (cancelled || !json || json.status !== "success") return;
        const pending = Number(json.global_pending_tasks ?? 0);
        const processing = Number(
          json.global_processing_tasks ?? json.active_workers ?? 0,
        );
        const status = json.ai_status === "busy" || pending > 0 || processing > 0
          ? "busy"
          : "idle";
        setAiQueue({
          ai_status: status,
          global_pending_tasks: Number.isFinite(pending) ? pending : 0,
          global_processing_tasks: Number.isFinite(processing) ? processing : 0,
          active_workers: Number(json.active_workers ?? processing ?? 0),
          max_workers: Number(json.max_workers ?? 0),
        });
      } catch {
        // Soft-fail — badge stays on last known state
      }
    };
    void poll();
    const timer = window.setInterval(poll, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [aiQueueStatusUrl]);

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
        certs: dynCerts.map((c) => {
          const f = formsById[certFormKey(c)] || formFromCert(c);
          const title = f.title || c.event;
          const award = f.award || c.award;
          const level = f.level || c.level;
          const tier = f.tier || c.tier;
          const hours = f.hours || c.hours;
          const date = f.date || c.date;
          const baseExtracted = (c.extractedData && typeof c.extractedData === "object")
            ? { ...c.extractedData }
            : {};
          return {
            dbId: Number(c.dbId || c.id) || undefined,
            studentId: c.studentId ?? null,
            studentZh: c.studentZh,
            studentEn: c.studentEn,
            classCode: c.classCode,
            studentLabel: c.studentLabel,
            matchConf: c.matchConf,
            confidence: c.confidence,
            level,
            tier,
            title,
            award,
            hours,
            date,
            ocrStatus: c.ocrStatus,
            extractedNameRaw: c.extractedNameRaw,
            extractedData: {
              ...baseExtracted,
              achievement_title: title || (baseExtracted as any).achievement_title || "",
              award_details: award || (baseExtracted as any).award_details || "",
              environment_level: level || (baseExtracted as any).environment_level || "",
              tier_role: tier || (baseExtracted as any).tier_role || "",
              hours: hours || (baseExtracted as any).hours || null,
              event_date: date || (baseExtracted as any).event_date || "",
              student_name: c.extractedNameRaw
                || (baseExtracted as any).student_name
                || (baseExtracted as any).extracted_name_raw
                || "",
              extracted_name_raw: c.extractedNameRaw
                || (baseExtracted as any).extracted_name_raw
                || "",
              confidence: c.confidence,
              matchConf: c.matchConf,
              field_confidence: c.fieldConf,
            },
          };
        }),
      });
    }, 280);
    return () => window.clearTimeout(t);
  }, [batchId, activeIdx, dynCerts, formsById]);

  const applyOcrToForm = useCallback(async (
    idx: number,
    data: any,
    certPatch: Partial<CertData> & { forceRematch?: boolean } = {},
  ) => {
    // Resolve index by dbId when possible — queue races can make a stale idx miss the form slot.
    const patchId = Number(certPatch.dbId || certPatch.id || 0);
    let targetIdx = idx;
    if (patchId > 0) {
      const byId = dynCertsRef.current.findIndex(
        c => Number(c.dbId || 0) === patchId || Number(c.id) === patchId,
      );
      if (byId >= 0) targetIdx = byId;
    }

    const normalized = normalizeOcrFields(data);
    const level = fuzzyPickTaxonomy(envOptions, normalized.level);
    const tier  = fuzzyPickTaxonomy(tierOptions, normalized.tier);
    const date  = normalized.date;
    const forceRematchFlag = !!(certPatch as { forceRematch?: boolean }).forceRematch;
    const isPoisonTitle = (s: string) => /AI\s*萃取|GB10|返回空資料|OCR\s*失敗|空資料|Extraction Failed/i.test(s || "");

    const targetId = patchId > 0
      ? patchId
      : certFormKey(dynCertsRef.current[targetIdx]);

    // Hydrate ONLY this item's form slot — never touch other panes.
    setFormsById(prev => {
      const cur = prev[targetId] || { ...EMPTY_FORM };
      const keepTitle = !forceRematchFlag && !isPoisonTitle(cur.title || "") ? (cur.title || "") : "";
      const keepAward = !forceRematchFlag && !isPoisonTitle(cur.award || "") ? (cur.award || "") : "";
      const nextForm: ItemFormState = {
        level: level || (!forceRematchFlag ? cur.level : "") || "",
        tier: tier || (!forceRematchFlag ? cur.tier : "") || "",
        title: forceRematchFlag ? (normalized.title || "") : (normalized.title || keepTitle),
        award: forceRematchFlag ? (normalized.award || "") : (normalized.award || keepAward),
        hours: forceRematchFlag ? (normalized.hours || "") : (normalized.hours || cur.hours || ""),
        date: forceRematchFlag ? (date || "") : (date || cur.date || ""),
      };
      const next = { ...prev, [targetId]: nextForm };
      formsByIdRef.current = next;
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

    const name = normalized.studentName;
    const extractedClass = normalized.classCode;
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
      achievement_title: Math.max(0, Math.round(confidence - 1)),
      award_details: Math.min(99, Math.round(confidence + 3)),
      // BC aliases for existing confidence bars
      award_level: Math.min(99, Math.round(confidence + 3)),
      event_title: Math.max(0, Math.round(confidence - 1)),
      event_date: Math.max(0, Math.round(confidence - 4)),
    };

    const nextStudentZh = studentId
      ? studentZh
      : (name
        ? ((studentZh === "OCR 掃描中…" || studentZh === "排隊中" || studentZh === "失敗" || !studentZh)
          ? "待配對"
          : studentZh)
        : studentZh);

    setDynCerts(prev => prev.map((c, i) => i === targetIdx ? {
      ...c,
      ...certPatch,
      studentZh: nextStudentZh,
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
      extractedNameRaw: name || c.extractedNameRaw || undefined,
      potentialMatches: studentId ? [] : pendingHits,
      event: forceRematchFlag ? (normalized.title || "") : (normalized.title || c.event || ""),
      award: forceRematchFlag ? (normalized.award || "") : (normalized.award || c.award || ""),
      level: forceRematchFlag ? (level || "") : (level || c.level),
      tier: forceRematchFlag ? (tier || "") : (tier || c.tier),
      date: forceRematchFlag ? (date || "") : (date || c.date),
      hours: forceRematchFlag ? (normalized.hours || "") : (normalized.hours || c.hours),
      ocrStatus: (certPatch.ocrStatus as CertOcrStatus) || "done",
      ocrError: null,
      // Parent-array source of truth — thumbnail navigation rehydrates from this.
      extractedData: (data && typeof data === "object")
        ? {
            ...data,
            student_name: name || data.student_name || "",
            extracted_name_raw: name || data.extracted_name_raw || "",
            achievement_title: normalized.title || data.achievement_title || "",
            award_details: normalized.award || data.award_details || "",
            environment_level: level || data.environment_level || "",
            tier_role: tier || data.tier_role || "",
            event_date: date || data.event_date || "",
            hours: normalized.hours || data.hours || null,
          }
        : null,
    } : c));

    // OCR name → update ONLY this item's student UI slot (hidden panes still update; no cross-bleed).
    const unmatchedOcr = !!(name && !studentId);
    if (targetId > 0) {
      if (openDisambiguation || unmatchedOcr) {
        setStudentUiById(prev => {
          const next = {
            ...prev,
            [targetId]: {
              ...(prev[targetId] || { ...EMPTY_STUDENT_UI }),
              editing: true,
              query: name || (prev[targetId]?.query || ""),
              hits: pendingHits,
              searchError: unmatchedOcr
                ? `⚠️ OCR 識別姓名：${name}（未找到完全匹配學生，請手動搜尋或選擇）`
                : null,
              searching: false,
            },
          };
          studentUiByIdRef.current = next;
          return next;
        });
        if (targetIdx === prevActiveIdxRef.current) {
          window.setTimeout(() => studentSearchInputRefs.current[targetId]?.focus(), 80);
        }
      } else if (!openDisambiguation && studentId) {
        setStudentUiById(prev => {
          const next = {
            ...prev,
            [targetId]: {
              ...(prev[targetId] || { ...EMPTY_STUDENT_UI }),
              editing: false,
              query: "",
              hits: [],
              searchError: null,
              searching: false,
            },
          };
          studentUiByIdRef.current = next;
          return next;
        });
      }
    }

    setAiHighlight(true);
  }, [envOptions, tierOptions, searchStudentsUrl]);

  /** Run GB10 OCR for one persisted achievement card. Never called in parallel. */
  const runOcrForAchievement = useCallback(async (
    dbId: number,
    imageUrl: string,
    selectWhenDone: boolean,
  ) => {
    if (ocrInflightRef.current.has(dbId)) return;
    ocrInflightRef.current.add(dbId);

    const gatewayTimeoutMsg =
      "AI 伺服器運算逾時 (504)。已略過此頁，佇列繼續下一份。";
    setScanningIds(prev => new Set([...prev, dbId]));
    // Clear ONLY this item's form slot (other panes untouched).
    if (dbId > 0) {
      setFormsById(prev => {
        const next = { ...prev, [dbId]: { ...EMPTY_FORM } };
        formsByIdRef.current = next;
        return next;
      });
    }
    setDynCerts(prev => prev.map(c => (c.id === dbId || c.dbId === dbId)
      ? {
          ...c,
          ocrStatus: "scanning",
          ocrError: null,
          studentZh: (c.studentZh === "失敗" || c.studentZh === "排隊中" || c.studentZh === "待 OCR")
            ? "OCR 掃描中…"
            : c.studentZh,
        }
      : c));
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
          body: `achievement_id=${encodeURIComponent(String(dbId))}&force_rescan=1`,
        });
      } catch (netErr: any) {
        if (exTimer) window.clearTimeout(exTimer);
        if (netErr?.name === "AbortError") throw new Error(gatewayTimeoutMsg);
        throw netErr;
      }
      if (exTimer) window.clearTimeout(exTimer);
      if (exRes.status === 504 || exRes.status === 502 || exRes.status === 524 || exRes.status === 429) {
        const errJson = await exRes.json().catch(() => ({}));
        throw new Error(String(errJson.message || gatewayTimeoutMsg));
      }
      const exJson = await exRes.json().catch(() => ({}));
      if (exRes.status === 413) {
        throw new Error(
          String(exJson.message || "檔案過大 (超過 4MB) 且自動壓縮失敗，請手動壓縮後再上載。")
        );
      }
      if (!exRes.ok || exJson.status !== "success") {
        // Surface backend message in banner only — never as form title.
        throw new Error(String(exJson.message || "AI 萃取失敗"));
      }

      const idxFinal = dynCertsRef.current.findIndex(
        c => Number(c.dbId || 0) === dbId || Number(c.id) === dbId,
      );
      if (idxFinal < 0) {
        throw new Error("找不到對應的證書卡片，無法寫入表單。");
      }

      // Human-in-the-loop: accept partial / blank payloads — never abort the queue for "empty" OCR.
      const ocrData = (exJson.data && typeof exJson.data === "object") ? exJson.data : {};
      const confRaw = exJson.confidence ?? ocrData.confidence;
      const confidence = confRaw != null && confRaw !== "" ? Number(confRaw) : NaN;

      // Hydrate forms[idx] + dynCerts[idx] even when every text field is blank.
      // NEVER write error strings into achievement title / event.
      await applyOcrToForm(idxFinal, ocrData, {
        id: dbId,
        dbId,
        imageUrl,
        confidence: Number.isFinite(confidence) && confidence > 0 ? confidence : 0,
        matchConf: Number(exJson.matchConf || ocrData.matchConf || 0),
        fieldConf: ocrData.field_confidence || exJson.meta?.fields,
        ocrStatus: "done",
        ocrError: null,
        forceRematch: true,
      });
      if (selectWhenDone) setActiveIdx(idxFinal);
    } catch (err: any) {
      const msg = String(err?.message || "OCR 失敗");
      // Keep prior title/award intact — put failure only in ocrError + status badge.
      setDynCerts(prev => prev.map(c => (c.id === dbId || c.dbId === dbId)
        ? {
            ...c,
            studentZh: (c.studentZh && c.studentZh !== "OCR 掃描中…" && c.studentZh !== "排隊中" && c.studentZh !== "待 OCR")
              ? c.studentZh
              : "失敗",
            ocrStatus: "error",
            ocrError: msg,
            confidence: 0,
          }
        : c));
      // Do NOT rethrow — sequential queue must continue to N+1.
    } finally {
      ocrInflightRef.current.delete(dbId);
      setScanningIds(prev => {
        const n = new Set(prev);
        n.delete(dbId);
        return n;
      });
    }
  }, [extractUrl, applyOcrToForm]);

  const drainOcrQueueRef = useRef<() => Promise<void>>(async () => {});

  /** Drain the OCR FIFO one item at a time — never fire concurrent GB10 calls from this tab. */
  const drainOcrQueue = useCallback(async () => {
    if (ocrQueueRunningRef.current) return;
    ocrQueueRunningRef.current = true;
    setOcrQueueProgress(prev => ({
      ...prev,
      running: true,
      total: Math.max(prev.total, ocrQueueTotalRef.current, ocrQueueRef.current.length, 1),
    }));

    try {
      while (ocrQueueRef.current.length > 0) {
        const dbId = ocrQueueRef.current.shift()!;
        ocrQueueDoneRef.current += 1;
        const step = ocrQueueDoneRef.current;
        const total = Math.max(
          ocrQueueTotalRef.current,
          step + ocrQueueRef.current.length,
          1,
        );
        ocrQueueTotalRef.current = total;
        setOcrQueueProgress({
          running: true,
          current: step,
          total,
          activeDbId: dbId,
        });

        const cert = dynCertsRef.current.find(c => Number(c.dbId || c.id) === dbId);
        try {
          await runOcrForAchievement(dbId, String(cert?.imageUrl || ""), false);
        } catch (err) {
          console.error(`OCR queue item ${dbId} failed — continuing to next`, err);
          setDynCerts(prev => {
            const next = prev.map(c => (Number(c.dbId || c.id) === dbId)
              ? {
                  ...c,
                  ocrStatus: "error" as CertOcrStatus,
                  ocrError: String((err as Error)?.message || "OCR 失敗"),
                  studentZh: (c.studentZh === "OCR 掃描中…" || c.studentZh === "排隊中" || c.studentZh === "待 OCR")
                    ? "失敗"
                    : c.studentZh,
                  confidence: 0,
                }
              : c);
            dynCertsRef.current = next;
            return next;
          });
          ocrInflightRef.current.delete(dbId);
          setScanningIds(prev => {
            const n = new Set(prev);
            n.delete(dbId);
            return n;
          });
        }
      }
    } finally {
      ocrQueueRunningRef.current = false;
      setOcrQueueProgress(prev => ({
        running: false,
        current: Math.max(prev.current, prev.total),
        total: Math.max(prev.total, ocrQueueTotalRef.current, 1),
        activeDbId: null,
      }));
      if (ocrQueueRef.current.length > 0) {
        void drainOcrQueueRef.current();
        return;
      }
      window.setTimeout(() => {
        if (!ocrQueueRunningRef.current && ocrQueueRef.current.length === 0) {
          setOcrQueueProgress({ running: false, current: 0, total: 0, activeDbId: null });
          ocrQueueTotalRef.current = 0;
          ocrQueueDoneRef.current = 0;
        }
      }, 2500);
    }
  }, [runOcrForAchievement]);
  useEffect(() => { drainOcrQueueRef.current = drainOcrQueue; }, [drainOcrQueue]);

  /**
   * Enqueue OCR jobs and start the drain loop.
   * @param force  bypass draft skip (manual priority / re-queue)
   * @param prioritize push to front of FIFO
   */
  const enqueueOcrJobs = useCallback((
    dbIds: number[],
    opts?: { prioritize?: boolean; force?: boolean },
  ) => {
    if (!extractUrl || dbIds.length === 0) return 0;
    // Hard gate: never fire extract while upload/split is still in flight.
    if (uploadPhaseRef.current === "uploading" || uploadPhaseRef.current === "splitting") {
      return 0;
    }
    const uniq: number[] = [];
    const seen = new Set<number>(ocrQueueRef.current);
    for (const id of dbIds) {
      const n = Number(id);
      if (!Number.isFinite(n) || n < 1) continue;
      if (ocrInflightRef.current.has(n)) continue;
      if (seen.has(n)) continue;
      // Require a committed server dbId — never OCR client temp placeholders.
      const cert = dynCertsRef.current.find(c => committedDbId(c) === n);
      if (!cert) continue;
      if (!opts?.force) {
        if (certHasExtractedDraft(cert) || cert?.ocrStatus === "done") continue;
      }
      if (cert.ocrStatus === "scanning") continue;
      seen.add(n);
      uniq.push(n);
    }
    if (uniq.length === 0) {
      // If drain is stuck idle with leftover queue, kick it; otherwise nothing to do.
      if (ocrQueueRef.current.length > 0 && !ocrQueueRunningRef.current) {
        void drainOcrQueueRef.current();
      }
      return 0;
    }

    if (opts?.prioritize) {
      ocrQueueRef.current = [...uniq, ...ocrQueueRef.current.filter(id => !uniq.includes(id))];
    } else {
      ocrQueueRef.current = [...ocrQueueRef.current, ...uniq];
    }
    ocrQueueTotalRef.current = Math.max(
      ocrQueueTotalRef.current,
      ocrQueueDoneRef.current + ocrQueueRef.current.length,
    );

    setDynCerts(prev => {
      const next = prev.map(c => {
        const id = Number(c.dbId || c.id);
        if (!uniq.includes(id)) return c;
        if (c.ocrStatus === "scanning" || c.ocrStatus === "done") return c;
        return {
          ...c,
          ocrStatus: "queued" as CertOcrStatus,
          studentZh: (c.studentZh === "待 OCR" || c.studentZh === "失敗" || !c.studentZh
            || isOcrPlaceholderLabel(c.studentZh))
            ? "排隊中"
            : c.studentZh,
          ocrError: null,
        };
      });
      dynCertsRef.current = next;
      return next;
    });

    setOcrQueueProgress(prev => ({
      running: true,
      current: ocrQueueDoneRef.current,
      total: Math.max(ocrQueueTotalRef.current, ocrQueueRef.current.length, 1),
      activeDbId: prev.activeDbId,
    }));

    // Unstick a dead runner flag (e.g. after HMR / aborted navigation).
    if (ocrQueueRunningRef.current && ocrQueueRef.current.length > 0 && ocrInflightRef.current.size === 0) {
      ocrQueueRunningRef.current = false;
    }
    void drainOcrQueueRef.current();
    return uniq.length;
  }, [extractUrl]);

  /**
   * Bulletproof starter: given cert cards (or ids), enqueue all that still need OCR
   * and immediately start the sequential processor. Call directly after upload.
   */
  const startQueueProcessor = useCallback((
    items: Array<CertData | number>,
    opts?: { force?: boolean },
  ) => {
    if (!extractUrl) {
      console.warn("[OCR queue] extractUrl missing — cannot start processor");
      return 0;
    }
    if (uploadPhaseRef.current === "uploading" || uploadPhaseRef.current === "splitting") {
      console.warn("[OCR queue] blocked — still uploading/splitting");
      return 0;
    }
    // Sync CertData[] into ref keyed by committed dbId before enqueue.
    const certItems = items.filter((it): it is CertData => typeof it !== "number");
    if (certItems.length > 0) {
      const byId = new Map<number, CertData>();
      for (const c of dynCertsRef.current) {
        const id = committedDbId(c);
        if (id > 0) byId.set(id, c);
      }
      for (const c of certItems) {
        const id = committedDbId(c) || Number(c.dbId || 0);
        if (id > 0) byId.set(id, { ...c, id, dbId: id });
      }
      // Preserve non-committed cards (shouldn't OCR) then committed ones.
      const others = dynCertsRef.current.filter(c => committedDbId(c) <= 0);
      dynCertsRef.current = [...others, ...Array.from(byId.values())];
    }
    const ids = items
      .map((it) => (typeof it === "number" ? it : committedDbId(it) || Number(it.dbId || 0)))
      .filter((id) => id > 0);
    if (ids.length === 0) return 0;
    return enqueueOcrJobs(ids, { force: opts?.force, prioritize: false });
  }, [extractUrl, enqueueOcrJobs]);

  /** Enqueue / prioritize a single card that still needs extraction. */
  const ensureOcrForCert = useCallback((
    cert: CertData | undefined,
    _selectWhenDone?: boolean,
  ) => {
    if (!cert || !extractUrl) return;
    if (uploadPhaseRef.current === "uploading" || uploadPhaseRef.current === "splitting") return;
    const dbId = committedDbId(cert);
    if (dbId < 1) return;
    if (ocrInflightRef.current.has(dbId) || cert.ocrStatus === "scanning") return;
    enqueueOcrJobs([dbId], {
      prioritize: true,
      force: !certHasExtractedDraft(cert) || cert.ocrStatus === "error",
    });
  }, [extractUrl, enqueueOcrJobs]);

  /**
   * Manual priority scan / Re-scan — bypasses FIFO wait for THIS item only.
   * Does not disable other items; only blocked while THIS id is scanning.
   */
  const handleManualScan = useCallback(async (itemId?: number) => {
    if (uploadPhaseRef.current === "uploading" || uploadPhaseRef.current === "splitting") {
      setPipelineMsg("請等待文件拆分完成後再掃描。");
      setTimeout(() => setPipelineMsg(null), 3000);
      return;
    }
    const active = dynCertsRef.current[activeIdx];
    const achievementId = Number(itemId || committedDbId(active) || 0);
    if (!achievementId || achievementId < 1 || !extractUrl) {
      setPipelineMsg("請先選取已上傳的證書再重新掃描。");
      setTimeout(() => setPipelineMsg(null), 3000);
      return;
    }
    const card = dynCertsRef.current.find(c => certFormKey(c) === achievementId);
    if (ocrInflightRef.current.has(achievementId) || card?.ocrStatus === "scanning") return;

    setPipelineMsg("🔄 重新掃描中…");
    // Pull out of FIFO so drain won't double-fire; run dedicated fetch now.
    ocrQueueRef.current = ocrQueueRef.current.filter(id => id !== achievementId);

    setFormsById(prev => {
      const next = { ...prev, [achievementId]: { ...EMPTY_FORM } };
      formsByIdRef.current = next;
      return next;
    });
    setDynCerts(prev => {
      const next = prev.map(c => (certFormKey(c) === achievementId)
        ? {
            ...c,
            ocrStatus: "scanning" as CertOcrStatus,
            ocrError: null,
            studentZh: "OCR 掃描中…",
            confidence: 0,
            event: isOcrPlaceholderLabel(c.event) ? "—" : c.event,
          }
        : c);
      dynCertsRef.current = next;
      return next;
    });
    patchStudentUi(achievementId, { hits: [], searchError: null });

    try {
      await runOcrForAchievement(achievementId, String(card?.imageUrl || ""), false);
      const fresh = dynCertsRef.current.find(c => certFormKey(c) === achievementId);
      const hydrated = formFromCert(fresh);
      setFormsById(prev => {
        const next = {
          ...prev,
          [achievementId]: {
            level: fuzzyPickTaxonomy(envOptions, hydrated.level) || hydrated.level,
            tier: fuzzyPickTaxonomy(tierOptions, hydrated.tier) || hydrated.tier,
            title: hydrated.title,
            award: hydrated.award,
            hours: hydrated.hours,
            date: hydrated.date,
          },
        };
        formsByIdRef.current = next;
        return next;
      });
      setPipelineMsg("✓ 重新掃描完成");
      window.setTimeout(() => setPipelineMsg(null), 2000);
    } catch (err) {
      console.error(`Manual scan failed for ${achievementId}`, err);
      setPipelineMsg("重新掃描失敗，請稍後再試。");
      window.setTimeout(() => setPipelineMsg(null), 4000);
    } finally {
      // Keep the sequential batch queue alive after a priority jump.
      if (ocrQueueRef.current.length > 0 && !ocrQueueRunningRef.current) {
        void drainOcrQueueRef.current();
      }
    }
  }, [activeIdx, extractUrl, runOcrForAchievement, envOptions, tierOptions, patchStudentUi]);

  const rescanActiveOcr = useCallback(async (itemIdOverride?: number) => {
    await handleManualScan(itemIdOverride);
  }, [handleManualScan]);

  /**
   * Auto-pipeline safety net — ONLY when uploadPhase === ready (DB rows committed).
   * Primary start is the direct call after upload resolves.
   */
  const pendingOcrKickSigRef = useRef("");
  useEffect(() => {
    if (!extractUrl || dynCerts.length === 0) return;
    if (uploadPhase !== "ready") return;
    const pendingIds = dynCerts
      .filter(c => {
        const id = committedDbId(c);
        if (id < 1) return false;
        if (certHasExtractedDraft(c)) return false;
        if (c.ocrStatus === "done" || c.ocrStatus === "scanning" || c.ocrStatus === "error") return false;
        if (c.studentZh === "失敗") return false;
        if (ocrInflightRef.current.has(id)) return false;
        if (ocrQueueRef.current.includes(id)) return false;
        const st = c.ocrStatus;
        return st === "pending" || st === "queued"
          || c.studentZh === "待 OCR" || c.studentZh === "排隊中"
          || (!st && !(Number(c.confidence) > 0));
      })
      .map(c => committedDbId(c))
      .filter(id => id > 0);
    if (pendingIds.length === 0) return;
    const sig = pendingIds.join(",");
    const started = startQueueProcessor(pendingIds);
    if (started > 0) pendingOcrKickSigRef.current = sig;
  }, [extractUrl, dynCerts, startQueueProcessor, uploadPhase]);

  /**
   * Process one live file: upload → split multi-page PDF into page cards →
   * auto-enqueue ALL successful pages into the sequential OCR pipeline.
   */
  const processLiveFile = useCallback(async (file: File, selectWhenDone: boolean) => {
    // Client-side hard block — never start AJAX for oversized files.
    if (file.size > MAX_CERT_UPLOAD_BYTES) {
      const mb = (file.size / (1024 * 1024)).toFixed(1);
      setPipelineMsg(
        `檔案過大 (File too large)。「${file.name}」約 ${mb}MB，請上傳小於 ${MAX_CERT_UPLOAD_LABEL} 的檔案。`,
      );
      setTimeout(() => setPipelineMsg(null), 8000);
      return;
    }

    const baseLabel = file.name.replace(/\.[^.]+$/, "");
    const isPdf = /\.pdf$/i.test(file.name) || file.type === "application/pdf";

    // Phase isolation: do NOT insert fake thumbnails / temp ids into dynCerts.
    // OCR kick must wait until backend returns committed batch items.
    setUploadPhase(isPdf ? "splitting" : "uploading");
    uploadPhaseRef.current = isPdf ? "splitting" : "uploading";
    if (isPdf) {
      setSplitProgress({ fileName: file.name, phase: "splitting" });
      setPipelineMsg(`正在拆分多頁文件 (Splitting multi-page document)… ${file.name}`);
    } else {
      setSplitProgress({ fileName: file.name, phase: "uploading" });
      setPipelineMsg(`正在上傳… ${file.name}`);
    }

    try {
      // Send the file ONCE. Re-posting under multiple keys made PHP treat a
      // single JPEG as 3–4 uploads (different temp paths → failed dedupe).
      const fd = new FormData();
      fd.append("cert_files", file, file.name);
      const gatewayTimeoutMsg =
        "上傳／拆分逾時 (504)。多頁 PDF 請確認伺服器 Ghostscript 可用，或改傳 JPG。";

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
      if (upRes.status === 413 || upRes.status === 400) {
        const errJson = await upRes.json().catch(() => ({}));
        throw new Error(String(
          errJson.message
          || (upRes.status === 413
            ? `檔案過大 (File too large)。請上傳小於 ${MAX_CERT_UPLOAD_LABEL} 的檔案。`
            : "上傳失敗"),
        ));
      }
      const upJson = await upRes.json().catch(() => ({}));
      if (!upRes.ok || upJson.ok === false || upJson.status === "error") {
        throw new Error(upJson.message || `上傳失敗 (${upRes.status})`);
      }

      // Trust ONLY this response — never reuse prior queue cards for this upload.
      const rawItems: any[] = Array.isArray(upJson.files) && upJson.files.length
        ? upJson.files
        : (Array.isArray(upJson.items) && upJson.items.length
          ? upJson.items
          : (upJson.item ? [upJson.item] : []));
      // Deduplicate by achievement id (guards against stale multi-key uploads)
      const seenIds = new Set<number>();
      const items = rawItems.filter((it) => {
        if (!it || (it.id == null && it.file_id == null)) return false;
        const id = Number(it.id ?? it.file_id);
        if (!Number.isFinite(id) || id < 1 || seenIds.has(id)) return false;
        seenIds.add(id);
        return true;
      });
      if (items.length === 0) throw new Error("上傳回應缺少成就 ID");

      // Single image / 1-page PDF → exactly 1 card; multi-page PDF → N cards
      const wasSplit = !!(upJson.split) && items.length > 1;
      const pageCount = wasSplit
        ? Number(upJson.page_count || upJson.pages_detected || items.length)
        : items.length;
      if (isPdf && wasSplit) {
        setSplitProgress({ fileName: file.name, phase: "ready", pages: pageCount });
      } else {
        setSplitProgress(null);
      }

      const mapped = items.map((it, i) => {
        const dbId = Number(it.id ?? it.file_id);
        const imageUrl = String(it.image_url || it.url || "");
        const pageLabel = String(
          it.file_name || it.fileName || (items.length > 1 ? `${baseLabel}_Page_${i + 1}` : baseLabel),
        );
        const statusRaw = String(it.ocr_status || it.ocrStatus || "pending").toLowerCase();
        const splitFailed = statusRaw === "error" || String(it.ocr_error || it.ocrError || "").length > 0;
        const card: CertData = {
          id: dbId,
          dbId,
          imageUrl,
          studentZh: splitFailed ? "失敗" : "待 OCR",
          studentEn: pageLabel.replace(/\.[^.]+$/, ""),
          classCode: "—",
          event: splitFailed
            ? String(it.ocr_error || it.ocrError || it.event || `第 ${Number(it.page_index || i + 1)} 頁拆分失敗，可能因檔案過於複雜。請嘗試手動分拆上傳。`)
            : (items.length > 1 ? `第 ${i + 1} / ${items.length} 頁` : "—"),
          award: "—",
          level: "—",
          tier: "—",
          date: "",
          hours: "",
          confidence: 0,
          matchConf: 0,
          ocrStatus: splitFailed ? "error" : "pending",
          ocrError: splitFailed
            ? String(it.ocr_error || it.ocrError || it.event || `第 ${Number(it.page_index || i + 1)} 頁拆分失敗，可能因檔案過於複雜。請嘗試手動分拆上傳。`)
            : null,
          pageIndex: Number(it.page_index || i + 1),
          pageCount: Number(it.page_count || items.length),
        };
        return card;
      });

      // Phase 3 READY — render thumbnails only after backend returned committed ids.
      setDynCerts(prev => {
        const byId = new Map<number, CertData>();
        for (const c of [...prev, ...mapped]) {
          const id = committedDbId(c);
          if (id > 0) byId.set(id, { ...c, id, dbId: id });
        }
        const merged = Array.from(byId.values());
        dynCertsRef.current = merged;
        return merged;
      });
      setFormsById(prev => {
        const next = { ...prev };
        for (const card of mapped) {
          const id = committedDbId(card);
          if (id > 0) next[id] = next[id] || { ...EMPTY_FORM };
        }
        formsByIdRef.current = next;
        return next;
      });
      setStudentUiById(prev => {
        const next = { ...prev };
        for (const card of mapped) {
          const id = committedDbId(card);
          if (id > 0) next[id] = next[id] || { ...EMPTY_STUDENT_UI, editing: true };
        }
        studentUiByIdRef.current = next;
        return next;
      });

      setUploadPhase("ready");
      uploadPhaseRef.current = "ready";
      setSplitProgress(
        items.length > 1
          ? { fileName: file.name, phase: "ready", pages: pageCount }
          : null,
      );

      if (selectWhenDone && mapped[0]) {
        const firstIdx = dynCertsRef.current.findIndex(c => committedDbId(c) === committedDbId(mapped[0]));
        setActiveIdx(firstIdx >= 0 ? firstIdx : Math.max(0, dynCertsRef.current.length - mapped.length));
      }

      const failedPages = mapped.filter(c => c.ocrStatus === "error").length;
      const readyCards = mapped.filter(c => c.ocrStatus !== "error" && committedDbId(c) > 0);
      const pendingIds = readyCards.map(c => committedDbId(c));

      if (items.length > 1) {
        const okPages = mapped.length - failedPages;
        setPipelineMsg(
          failedPages > 0
            ? `已拆分 ${mapped.length} 頁（成功 ${okPages}，失敗 ${failedPages}）。🚀 開始 OCR…`
            : `已偵測 ${pageCount} 頁並寫入資料庫。🚀 開始依序掃描…`,
        );
        setTimeout(() => setPipelineMsg(null), failedPages > 0 ? 8000 : 4000);
      } else if (pendingIds.length > 0) {
        setPipelineMsg("🚀 已自動開始 OCR 掃描…");
        setTimeout(() => setPipelineMsg(null), 3000);
      } else {
        setPipelineMsg(null);
      }
      window.setTimeout(() => setSplitProgress(null), 1800);

      // Safe to OCR: DB rows exist and uploadPhase is ready.
      if (readyCards.length > 0) {
        const started = startQueueProcessor(readyCards);
        if (started === 0) startQueueProcessor(pendingIds, { force: true });
      }
    } catch (err: any) {
      const msg = String(err?.message || "處理失敗");
      const isPayload = /超過|過大|File too large|壓縮失敗|縮小檔案|413|拆分失敗|10\s*MB/i.test(msg);
      {
        const fallback: UploadPhase = dynCertsRef.current.some(c => committedDbId(c) > 0) ? "ready" : "idle";
        setUploadPhase(fallback);
        uploadPhaseRef.current = fallback;
      }
      setPipelineMsg(msg);
      setTimeout(() => setPipelineMsg(null), isPayload ? 9000 : 4000);
      setSplitProgress(null);
    }
  }, [uploadUrl, startQueueProcessor]);

  // Dropzone: never locked — each file gets its own upload+OCR pipeline in parallel
  const processDroppedFiles = useCallback((files: FileList | File[]) => {
    const fileArr = Array.from(files);
    if (!fileArr.length) return;

    // Pre-filter oversized files so they never hit the network or pollute the queue.
    const oversized = fileArr.filter(f => f.size > MAX_CERT_UPLOAD_BYTES);
    const allowed = fileArr.filter(f => f.size <= MAX_CERT_UPLOAD_BYTES);
    if (oversized.length > 0) {
      const names = oversized.map(f => {
        const mb = (f.size / (1024 * 1024)).toFixed(1);
        return `${f.name} (${mb}MB)`;
      }).join("、");
      setPipelineMsg(
        `檔案過大 (File too large)。請上傳小於 ${MAX_CERT_UPLOAD_LABEL} 的檔案。已阻擋：${names}`,
      );
      setTimeout(() => setPipelineMsg(null), 9000);
    }
    if (!allowed.length) return;

    if (!isLive) {
      allowed.forEach((file, i) => {
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
          setFormsById(prev => {
            const next = {
              ...prev,
              [newId]: {
                level: fill.level, tier: fill.tier, title: fill.event,
                award: fill.award, hours: fill.hours, date: fill.date,
              },
            };
            formsByIdRef.current = next;
            return next;
          });
          setStudentUiById(prev => {
            const next = { ...prev, [newId]: { ...EMPTY_STUDENT_UI, editing: !fill.studentId } };
            studentUiByIdRef.current = next;
            return next;
          });
        }, 1800 + i * 600);
      });
      return;
    }

    // Fire allowed uploads immediately — dropzone stays interactive
    allowed.forEach((file, i) => {
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
  const activeItemId = certFormKey(cert);
  const activeStudentUi = (activeItemId && studentUiById[activeItemId])
    ? studentUiById[activeItemId]
    : EMPTY_STUDENT_UI;
  // Prefer live per-item form state; fall back to cert/extracted OCR.
  const form = (() => {
    const base = (activeItemId && formsById[activeItemId])
      ? formsById[activeItemId]
      : { ...EMPTY_FORM };
    const c = dynCerts[activeIdx];
    if (!c) return base;
    const ex = c.extractedData ? normalizeOcrFields(c.extractedData) : null;
    return {
      level: base.level || ex?.level || c.level || "",
      tier: base.tier || ex?.tier || c.tier || "",
      title: base.title || ex?.title || c.event || "",
      award: base.award || ex?.award || c.award || "",
      hours: base.hours || ex?.hours || c.hours || "",
      date: base.date || ex?.date || c.date || "",
    };
  })();
  const savedCount  = saved.size + discarded.size;
  const allDone     = savedCount === dynCerts.length && dynCerts.length > 0 && scanningIds.size === 0;
  const isSaved     = saved.has(activeIdx);
  const isDiscarded = discarded.has(activeIdx);
  const isScanning  = !!cert && (
    scanningIds.has(cert.id)
    || (cert.dbId != null && scanningIds.has(cert.dbId))
    || cert.ocrStatus === "scanning"
  );
  const isOcrError  = !!cert && (
    cert.ocrStatus === "error"
    || cert.studentZh === "失敗"
    || (!!cert.ocrError && cert.ocrStatus !== "done")
    || (cert.confidence === 0 && cert.ocrStatus === "error")
  );
  const isOcrQueued = !!cert && !isScanning && !isOcrError && (
    cert.ocrStatus === "queued" || cert.studentZh === "排隊中"
  );
  const isOcrPending = !!cert && !isScanning && !isOcrError && !isOcrQueued && (
    cert.ocrStatus === "pending" || cert.studentZh === "待 OCR"
  );

  const persistDraft = (itemId: number, formState: ItemFormState, certRow?: CertData | null) => {
    if (!isLive || !draftUrl || itemId <= 0) return;
    if (draftTimersRef.current[itemId]) {
      window.clearTimeout(draftTimersRef.current[itemId]);
    }
    draftTimersRef.current[itemId] = window.setTimeout(async () => {
      const row = certRow || dynCertsRef.current.find(c => certFormKey(c) === itemId);
      try {
        await fetch(draftUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          body: JSON.stringify({
            achievement_id: itemId,
            student_id: row?.studentId || null,
            environment_level: formState.level,
            tier_role: formState.tier,
            achievement_title: formState.title,
            award_details: formState.award,
            hours: formState.hours,
            event_date: formState.date,
            extracted_name_raw: row?.extractedNameRaw || "",
            extracted_class_code: row?.classCode && row.classCode !== "—" ? row.classCode : "",
          }),
        });
      } catch {
        /* background draft — ignore transient errors */
      }
    }, 400);
  };

  const updateField = (itemId: number, field: keyof ItemFormState, val: string) => {
    if (!itemId) return;
    let nextForm: ItemFormState = { ...EMPTY_FORM, [field]: val };
    setFormsById(prev => {
      const cur = prev[itemId] || { ...EMPTY_FORM };
      nextForm = { ...cur, [field]: val };
      const next = { ...prev, [itemId]: nextForm };
      formsByIdRef.current = next;
      return next;
    });
    setDynCerts(prev => {
      const next = prev.map((c) => {
        if (certFormKey(c) !== itemId) return c;
        const mapped =
          field === "title" ? { event: val }
          : field === "award" ? { award: val }
          : field === "level" ? { level: val }
          : field === "tier" ? { tier: val }
          : field === "hours" ? { hours: val }
          : field === "date" ? { date: val }
          : {};
        const prevExtracted = (c.extractedData && typeof c.extractedData === "object")
          ? { ...c.extractedData }
          : {};
        const extractedKey =
          field === "title" ? "achievement_title"
          : field === "award" ? "award_details"
          : field === "level" ? "environment_level"
          : field === "tier" ? "tier_role"
          : field === "date" ? "event_date"
          : field === "hours" ? "hours"
          : null;
        return {
          ...c,
          ...mapped,
          extractedData: extractedKey
            ? { ...prevExtracted, [extractedKey]: val }
            : c.extractedData,
        };
      });
      dynCertsRef.current = next;
      return next;
    });
    persistDraft(itemId, nextForm);
  };

  const beginChangeStudent = (itemId: number) => {
    patchStudentUi(itemId, { editing: true, query: "", hits: [], searchError: null, searching: false });
  };

  const clearStudentBinding = (itemId: number) => {
    setDynCerts(prev => prev.map((c) => certFormKey(c) === itemId ? {
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
    patchStudentUi(itemId, { editing: true, query: "", hits: [], searchError: null, searching: false });
    const f = formsByIdRef.current[itemId] || { ...EMPTY_FORM };
    persistDraft(itemId, f, { ...(dynCertsRef.current.find(c => certFormKey(c) === itemId) || {} as CertData), studentId: null });
  };

  const runStudentSearch = (itemId: number, q: string) => {
    patchStudentUi(itemId, { query: q, searchError: null });
    if (studentSearchTimer.current) window.clearTimeout(studentSearchTimer.current);
    if (!q.trim() || !searchStudentsUrl) {
      patchStudentUi(itemId, { hits: [] });
      return;
    }
    studentSearchTimer.current = window.setTimeout(async () => {
      patchStudentUi(itemId, { searching: true });
      try {
        const res = await fetch(`${searchStudentsUrl}?q=${encodeURIComponent(q.trim())}`, {
          headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
        });
        if (!res.ok) throw new Error("搜尋失敗");
        const json = await res.json();
        const hits = (json.results || []).map(mapStudentHit);
        patchStudentUi(itemId, {
          hits,
          searching: false,
          searchError: hits.length === 0 ? `找不到「${q.trim()}」的學生紀錄` : null,
        });
      } catch {
        patchStudentUi(itemId, {
          hits: [],
          searching: false,
          searchError: "學生搜尋暫時無法使用，請稍後再試。",
        });
      }
    }, 220);
  };

  const confirmStudentAssociation = (itemId: number, hit: StudentHit) => {
    const zh = String(hit.name_zh || "").trim();
    const en = String(hit.name_en || "").trim();
    const cls = String(hit.class_name || hit.class_code || "").trim()
      || (hit.text.match(/\(([^)]+)\)\s*$/) || [])[1]
      || "";
    const label = formatStudentDisplay(zh || hit.text.replace(/\s*\(.*\)\s*$/, "").trim(), en, cls)
      || hit.text;
    let patched: CertData | null = null;
    setDynCerts(prev => {
      const next = prev.map((c) => {
        if (certFormKey(c) !== itemId) return c;
        patched = {
          ...c,
          studentId: hit.id,
          studentLabel: label,
          studentZh: zh || label.replace(/\s*\(.*\)\s*$/, "").trim() || hit.text,
          studentEn: en && en.toLowerCase() !== zh.toLowerCase() ? en : "",
          classCode: cls || c.classCode || "—",
          matchConf: Math.max(c.matchConf || 0, 98),
          conflictCount: 0,
          potentialMatches: [],
        };
        return patched;
      });
      dynCertsRef.current = next;
      return next;
    });
    patchStudentUi(itemId, { editing: false, query: "", hits: [], searchError: null, searching: false });
    const f = formsByIdRef.current[itemId] || { ...EMPTY_FORM };
    persistDraft(itemId, f, patched);
  };

  const bindStudent = (hit: StudentHit) => confirmStudentAssociation(activeItemId, hit);

  /** Conflict badge → open autocomplete with OCR name + potential class variants */
  const openConflictPicker = (itemId: number) => {
    const c = dynCertsRef.current.find(x => certFormKey(x) === itemId);
    const sui = studentUiByIdRef.current[itemId] || EMPTY_STUDENT_UI;
    const raw = String(c?.extractedNameRaw || sui.query || "").trim();
    const hits = (c?.potentialMatches && c.potentialMatches.length > 0)
      ? c.potentialMatches
      : sui.hits;
    patchStudentUi(itemId, {
      editing: true,
      searchError: null,
      query: raw || sui.query,
      hits: hits.length > 0 ? hits : sui.hits,
    });
    if (hits.length === 0 && raw) {
      runStudentSearch(itemId, raw);
    }
    window.setTimeout(() => studentSearchInputRefs.current[itemId]?.focus(), 50);
  };

  // Once taxonomy options arrive, remap any OCR codes (e.g. "L1") onto DB option values.
  useEffect(() => {
    if (envOptions.length === 0 && tierOptions.length === 0) return;
    setFormsById(prev => {
      let changed = false;
      const next: Record<number, ItemFormState> = {};
      for (const [k, f] of Object.entries(prev)) {
        const id = Number(k);
        const level = f.level ? (fuzzyPickTaxonomy(envOptions, f.level) || f.level) : f.level;
        const tier = f.tier ? (fuzzyPickTaxonomy(tierOptions, f.tier) || f.tier) : f.tier;
        if (level !== f.level || tier !== f.tier) changed = true;
        next[id] = { ...f, level, tier };
      }
      if (!changed) return prev;
      formsByIdRef.current = next;
      return next;
    });
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
        setPipelineMsg("批核中…");
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
          ocrStatus: c.ocrStatus === "error" ? c.ocrStatus : "done",
          studentId: cert.studentId ?? c.studentId,
          studentLabel: cert.studentLabel || c.studentLabel,
          studentZh: cert.studentZh || c.studentZh,
          studentEn: cert.studentEn || c.studentEn,
          classCode: cert.classCode || c.classCode,
        } : c));
        setPipelineMsg(null);
      } catch (err: any) {
        setPipelineMsg(err?.message || "批核失敗");
        setTimeout(() => setPipelineMsg(null), 3500);
        return;
      }
    }
    const ns = new Set([...saved, activeIdx]);
    setSaved(ns);
    if (activeItemId) {
      patchStudentUi(activeItemId, { editing: false, hits: [], searchError: null });
    }
    const nextIdx = nextPending(activeIdx, ns, discarded);
    selectCert(nextIdx);
    // Auto-advance OCR: kick off extraction for the next pending page only.
    const nextCert = dynCertsRef.current[nextIdx];
    if (nextIdx !== activeIdx && nextCert) {
      void ensureOcrForCert(nextCert, true);
    }
  };

  const handleDiscard = () => {
    const nd = new Set([...discarded, activeIdx]);
    setDiscarded(nd);
    selectCert(nextPending(activeIdx, saved, nd));
  };

  const handleSubmitAll = () => {
    if (allDone && !submitDone) setSubmitDone(true);
  };

  const totalCerts   = dynCerts.length;
  /** Local batch OCR progress — never use global pending for the 「本機」 fraction. */
  const localOcrProcessing = dynCerts.filter(c => {
    const id = Number(c.dbId || c.id);
    return c.ocrStatus === "scanning"
      || scanningIds.has(c.id)
      || (id > 0 && scanningIds.has(id));
  }).length;
  const localOcrPending = dynCerts.filter(c => {
    if (certHasExtractedDraft(c) || c.ocrStatus === "done") return false;
    if (c.ocrStatus === "scanning") return false;
    if (c.ocrStatus === "error" || c.studentZh === "失敗") return false;
    return c.ocrStatus === "pending" || c.ocrStatus === "queued"
      || c.studentZh === "待 OCR" || c.studentZh === "排隊中"
      || (!(Number(c.confidence) > 0) && Number(c.dbId || c.id) > 0);
  }).length;
  const localOcrWorkTotal = localOcrProcessing + localOcrPending;
  // Only append 「本機處理中」 when this tab is actively scanning — hide 0 / … noise.
  const showLocalOcrProgress = Number.isFinite(localOcrProcessing)
    && Number.isFinite(localOcrWorkTotal)
    && localOcrProcessing > 0
    && localOcrWorkTotal > 0;
  const localOcrProgressLabel = showLocalOcrProgress
    ? `本機處理中 ${localOcrProcessing} / ${localOcrWorkTotal}`
    : "";
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
        {/* Status summary pills + Global AI queue badge */}
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          <style>{`
            @keyframes aiQueuePulse {
              0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.35); }
              50% { opacity: 0.92; box-shadow: 0 0 0 4px rgba(245, 158, 11, 0); }
            }
          `}</style>
          {aiQueue.ai_status !== "unknown" && (
            <div
              title={
                aiQueue.ai_status === "busy"
                  ? `全校尚未完成 OCR 約 ${aiQueue.global_pending_tasks} 份；正在處理 ${aiQueue.global_processing_tasks ?? aiQueue.active_workers ?? 0}/${aiQueue.max_workers ?? 2} 工作緒`
                  : "GB10 目前無全域排隊"
              }
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 10px",
                borderRadius: R.full,
                fontSize: 11,
                fontWeight: 700,
                whiteSpace: "nowrap",
                border: aiQueue.ai_status === "busy"
                  ? "1px solid #F59E0B55"
                  : `1px solid ${C.success}40`,
                background: aiQueue.ai_status === "busy" ? "#FFFBEB" : C.greenLight,
                color: aiQueue.ai_status === "busy" ? "#B45309" : C.success,
                animation: aiQueue.ai_status === "busy" ? "aiQueuePulse 1.6s ease-in-out infinite" : undefined,
              }}
            >
              {aiQueue.ai_status === "busy"
                ? (
                  <>
                    ⚡ GB10 運算中 (全校排隊中: {aiQueue.global_pending_tasks} 份
                    {(aiQueue.global_processing_tasks ?? 0) > 0
                      ? ` · 處理中 ${aiQueue.global_processing_tasks}`
                      : ""}
                    )
                    {localOcrProgressLabel ? (
                      <span style={{ fontWeight: 600, opacity: 0.9 }}>
                        {" "}— {localOcrProgressLabel}
                      </span>
                    ) : null}
                  </>
                )
                : "🟢 GB10 伺服器空閒 (AI Ready)"}
            </div>
          )}
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

      {(flashSuccess || flashError || pipelineMsg || splitProgress) && (
        <div style={{
          flexShrink: 0, padding: "8px 24px",
          background: flashError || (pipelineMsg && /失敗|錯誤|逾時|504|過大|超過限制|File too large/i.test(pipelineMsg))
            ? C.errorLight
            : splitProgress
              ? "#EFF6FF"
              : C.greenLight,
          borderBottom: `1px solid ${C.border}`,
          fontSize: 12, fontWeight: 600,
          color: flashError || (pipelineMsg && /失敗|錯誤|逾時|504|過大|超過限制|File too large/i.test(pipelineMsg))
            ? C.error
            : splitProgress
              ? "#1E40AF"
              : "#065F46",
        }}>
          {splitProgress ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div>
                {splitProgress.phase === "ready" && splitProgress.pages
                  ? `已拆分多頁文件 · ${splitProgress.pages} pages detected · ${splitProgress.fileName}`
                  : `正在拆分多頁文件 (Splitting multi-page document)… ${splitProgress.fileName}`}
              </div>
              <div style={{ height: 4, background: "#BFDBFE", borderRadius: 999, overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: splitProgress.phase === "ready" ? "100%" : "55%",
                  background: "linear-gradient(90deg, #2563EB, #38BDF8)",
                  borderRadius: 999,
                  animation: splitProgress.phase === "ready" ? undefined : "splitPulse 1.2s ease-in-out infinite",
                  transition: "width 0.35s ease",
                }} />
              </div>
              <style>{`@keyframes splitPulse{0%,100%{opacity:.55}50%{opacity:1}}`}</style>
            </div>
          ) : (pipelineMsg || flashError || flashSuccess)}
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
              {(ocrQueueProgress.running || scanningIds.size > 0) && (
                <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: R.full, background: "#F0FDF4", border: "1px solid #A7F3D0", fontSize: 10, fontWeight: 700, color: "#065F46" }}>
                  <Clock size={9} color="#059669" />
                  依序 OCR {ocrQueueProgress.current}/{ocrQueueProgress.total || "…"}
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

          {/* ── Sequential OCR progress bar (never during split) ── */}
          {!isSplitBusy && (ocrQueueProgress.running || (ocrQueueProgress.total > 0 && ocrQueueProgress.current > 0)) && (
            <div style={{
              margin: "0 14px 6px",
              padding: "10px 12px",
              background: "linear-gradient(135deg, #EFF6FF 0%, #F0FDF4 100%)",
              border: `1px solid ${C.accentLight}`,
              borderRadius: R.md,
              flexShrink: 0,
            }}>
              <div style={{
                fontSize: 11.5, fontWeight: 700, color: "#1E3A8A", fontFamily: F,
                marginBottom: 6, lineHeight: 1.35,
              }}>
                🔄 正在排隊掃描第 {Math.min(ocrQueueProgress.current, ocrQueueProgress.total)} / {ocrQueueProgress.total} 份證書…
                <span style={{ fontWeight: 500, color: "#64748B" }}>
                  {" "}(Scanning certificate {Math.min(ocrQueueProgress.current, ocrQueueProgress.total)} of {ocrQueueProgress.total})
                </span>
              </div>
              <div style={{ height: 8, background: "#DBEAFE", borderRadius: 999, overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: `${ocrQueueProgress.total > 0
                    ? Math.min(100, Math.round((ocrQueueProgress.current / ocrQueueProgress.total) * 100))
                    : 0}%`,
                  background: ocrQueueProgress.running
                    ? "linear-gradient(90deg, #2563EB, #22C55E)"
                    : C.success,
                  borderRadius: 999,
                  transition: "width 0.35s ease",
                }} />
              </div>
              {!ocrQueueProgress.running && ocrQueueProgress.current >= ocrQueueProgress.total && ocrQueueProgress.total > 0 && (
                <div style={{ fontSize: 10, color: "#065F46", fontWeight: 600, marginTop: 5 }}>
                  ✅ 佇列完成 — 可逐份審核並儲存
                </div>
              )}
            </div>
          )}

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
                支援 PNG, JPG, PDF（多頁會先拆分）· 每個檔案最大限制: {MAX_CERT_UPLOAD_LABEL} · 可多選
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

          {/* Thumbnail Strip — hidden while splitting (no premature Failed badges) */}
          <div style={{
            padding: isMobile ? "8px 16px 8px" : "8px 14px 8px",
            borderBottom: `1px solid ${C.divider}`,
            display: "flex", gap: 8,
            overflowX: "auto",
            flexShrink: 0,
            minHeight: 106,
            alignItems: "center",
          }}>
            {isSplitBusy ? (
              <div style={{
                flex: 1, display: "flex", alignItems: "center", gap: 10,
                padding: "12px 14px", borderRadius: R.md,
                background: "#EFF6FF", border: "1px dashed #93C5FD",
                fontSize: 12, fontWeight: 600, color: "#1E40AF", fontFamily: F,
              }}>
                <span style={{ fontSize: 18 }}>✂️</span>
                <div>
                  <div>系統正在安全拆分多頁 PDF，請稍候…</div>
                  <div style={{ fontSize: 10, fontWeight: 500, color: "#64748B", marginTop: 2 }}>
                    Splitting document — OCR will start after pages are saved to the database
                  </div>
                </div>
              </div>
            ) : dynCerts.map((c, i) => (
              <Thumbnail
                key={committedDbId(c) || c.id}
                cert={c} index={i}
                active={i === activeIdx}
                saved={saved.has(i)}
                discarded={discarded.has(i)}
                scanning={scanningIds.has(c.id) || scanningIds.has(Number(c.dbId || 0)) || c.ocrStatus === "scanning"}
                onClick={() => {
                  selectCert(i);
                  ensureOcrForCert(dynCertsRef.current[i] ?? c, true);
                }}
              />
            ))}
          </div>

          {/* Certificate Preview + Confidence — 1 pane per item (show/hide) */}
          <div style={{
            flex: isMobile ? "none" : 1,
            overflowY: isMobile ? "visible" : "auto",
            overflowX: "hidden",
            padding: isMobile ? "12px 16px" : "16px 20px",
            display: "flex", flexDirection: "column", gap: 12,
          }}>
            {isSplitBusy ? (
              <div style={{
                flex: 1, minHeight: 220,
                borderRadius: R.lg, border: `1px dashed ${C.accentLight}`,
                background: "linear-gradient(180deg, #EFF6FF 0%, #F8FAFC 100%)",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 12,
                padding: 28, textAlign: "center",
              }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 16,
                  background: "#DBEAFE", display: "flex",
                  alignItems: "center", justifyContent: "center", fontSize: 24,
                }}>✂️</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1E3A8A", fontFamily: F }}>
                  正在拆分多頁文件…
                </div>
                <div style={{ fontSize: 12, color: "#64748B", fontFamily: F, maxWidth: 320, lineHeight: 1.45 }}>
                  系統會先完成 PDF 拆分並寫入資料庫，然後才開始 OCR。請勿關閉此頁。
                </div>
                <div style={{
                  marginTop: 4, width: "70%", maxWidth: 280, height: 6,
                  background: "#BFDBFE", borderRadius: 999, overflow: "hidden",
                }}>
                  <div style={{
                    height: "100%", width: "58%",
                    background: "linear-gradient(90deg, #2563EB, #38BDF8)",
                    borderRadius: 999,
                    animation: "splitPulse 1.2s ease-in-out infinite",
                  }} />
                </div>
              </div>
            ) : dynCerts.length === 0 ? (
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
                  支援 PNG, JPG, PDF（多頁會先拆分）· 每個檔案最大限制: {MAX_CERT_UPLOAD_LABEL}
                </div>
              </div>
            ) : dynCerts.map((paneCert, paneIdx) => {
              const paneId = certFormKey(paneCert) || paneCert.id;
              return (
                <div
                  key={paneId}
                  data-item-pane={paneId}
                  style={{
                    display: activeIdx === paneIdx ? "flex" : "none",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  <CertPreview cert={paneCert} />
                  <div>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      padding: "5px 12px",
                      background: paneCert.confidence >= 90 ? "#D1FAE5" : "#FEF3C7",
                      border: `1px solid ${paneCert.confidence >= 90 ? "#A7F3D0" : "#FCD34D"}`,
                      borderRadius: R.full,
                      fontSize: 12, fontWeight: 700,
                      color: paneCert.confidence >= 90 ? "#065F46" : "#92400E",
                    }}>
                      <CheckCircle2 size={12} color={paneCert.confidence >= 90 ? C.success : C.amber} />
                      🟢 AI Confidence Score: {paneCert.confidence || 0}%
                    </span>
                  </div>
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
                        value={Number(paneCert.fieldConf?.student_name ?? paneCert.matchConf ?? 0)}
                      />
                      <ConfidenceBar
                        label="Award Level 獎項級別"
                        value={Number(paneCert.fieldConf?.award_level ?? Math.min(99, Math.round((paneCert.confidence || 0) + 3)))}
                      />
                      <ConfidenceBar
                        label="Event Title 活動名稱"
                        value={Number(paneCert.fieldConf?.event_title ?? Math.max(0, Math.round((paneCert.confidence || 0) - 1)))}
                      />
                      <ConfidenceBar
                        label="Event Date 日期"
                        value={Number(paneCert.fieldConf?.event_date ?? Math.max(0, Math.round((paneCert.confidence || 0) - 4)))}
                      />
                    </div>
                  </div>
                </div>
              );
            })}

          </div>
        </div>

        {/* ════ RIGHT PANE (55%) ════ */}
        <div style={{
          flex: isMobile ? "none" : "1 1 0",
          minWidth: isMobile ? 0 : 420,
          display: "flex", flexDirection: "column",
          background: C.pageBg,
          // Allow student autocomplete to float over Extracted Data below
          overflow: (isMobile || activeStudentUi.hits.length > 0) ? "visible" : "hidden",
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
                disabled={!cert || isScanning || isSplitBusy}
                title={isSplitBusy ? "請等待拆分完成" : "重新觸發 AI OCR（僅當本頁掃描中才停用）"}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  marginLeft: 4, padding: "4px 10px",
                  borderRadius: R.sm, fontSize: 11, fontWeight: 700, fontFamily: F,
                  border: `1px solid ${C.accentLight}`,
                  background: isScanning ? C.accentPale : C.surface,
                  color: C.accent, cursor: !cert || isScanning || isSplitBusy ? "wait" : "pointer",
                  opacity: !cert || isSplitBusy ? 0.45 : 1,
                }}
              >
                <RefreshCw size={12} style={{
                  animation: isScanning ? "ocrSpin 0.9s linear infinite" : undefined,
                }} />
                {isScanning ? "掃描中…" : "重新掃描 (Re-scan)"}
              </button>
              {aiQueue.ai_status === "busy" && (
                <span style={{
                  fontSize: 10, fontWeight: 700, color: "#B45309",
                  background: "#FFFBEB", border: "1px solid #F59E0B44",
                  borderRadius: R.full, padding: "3px 8px", whiteSpace: "nowrap",
                }}>
                  全校排隊 {aiQueue.global_pending_tasks}
                  {(aiQueue.global_processing_tasks ?? 0) > 0
                    ? ` · 處理中 ${aiQueue.global_processing_tasks}`
                    : ""}
                  {localOcrProgressLabel ? ` — ${localOcrProgressLabel}` : ""}
                </span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button
                onClick={() => selectCert(Math.max(0, activeIdx - 1))}
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
                onClick={() => selectCert(Math.min(totalCerts - 1, activeIdx + 1))}
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

          {/* Scrollable form area — blocked during split so OCR UI cannot race ahead */}
          <div style={{
            flex: isMobile ? "none" : 1,
            overflowY: (isMobile || activeStudentUi.hits.length > 0) ? "visible" : "auto",
            overflowX: activeStudentUi.hits.length > 0 ? "visible" : "hidden",
            padding: isMobile ? "12px 16px" : "16px 24px",
            display: "flex", flexDirection: "column", gap: 12,
          }}>
            {isSplitBusy ? (
              <div style={{
                flex: 1, minHeight: 200, borderRadius: R.lg,
                border: "1px dashed #93C5FD", background: "#F8FAFC",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 10,
                padding: 24, textAlign: "center", color: "#475569",
                fontFamily: F,
              }}>
                <div style={{ fontSize: 28 }}>⏳</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1E40AF" }}>
                  拆分進行中 — 審核表單暫時停用
                </div>
                <div style={{ fontSize: 11, maxWidth: 320, lineHeight: 1.45 }}>
                  後端完成 PDF 拆分並寫入資料庫後，才會自動開始 OCR 並開放表單。
                </div>
              </div>
            ) : null}
            {!isSplitBusy && (
            <>
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

            {dynCerts.map((paneCert, paneIdx) => {
              const itemId = certFormKey(paneCert);
              const cert = paneCert;
              const activeItemId = itemId;
              const activeStudentUi = studentUiById[itemId] || EMPTY_STUDENT_UI;
              const baseForm = formsById[itemId] || formFromCert(paneCert);
              const ex = paneCert.extractedData ? normalizeOcrFields(paneCert.extractedData) : null;
              const form = {
                level: baseForm.level || ex?.level || paneCert.level || "",
                tier: baseForm.tier || ex?.tier || paneCert.tier || "",
                title: baseForm.title || ex?.title || paneCert.event || "",
                award: baseForm.award || ex?.award || paneCert.award || "",
                hours: baseForm.hours || ex?.hours || paneCert.hours || "",
                date: baseForm.date || ex?.date || paneCert.date || "",
              };
              const isSaved = saved.has(paneIdx);
              const isDiscarded = discarded.has(paneIdx);
              const isScanning = (
                scanningIds.has(paneCert.id)
                || (paneCert.dbId != null && scanningIds.has(paneCert.dbId))
                || paneCert.ocrStatus === "scanning"
              );
              const isOcrError = (
                paneCert.ocrStatus === "error"
                || paneCert.studentZh === "失敗"
                || (!!paneCert.ocrError && paneCert.ocrStatus !== "done")
                || (paneCert.confidence === 0 && paneCert.ocrStatus === "error")
              );
              const isOcrQueued = !isScanning && !isOcrError && (
                paneCert.ocrStatus === "queued" || paneCert.studentZh === "排隊中"
              );
              const isOcrPending = !isScanning && !isOcrError && !isOcrQueued && (
                paneCert.ocrStatus === "pending" || paneCert.studentZh === "待 OCR"
              );
              return (
              <div
                key={itemId || paneCert.id}
                data-item-pane={itemId}
                style={{
                  display: activeIdx === paneIdx ? "flex" : "none",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
            {/* AI notice / error / pending banners */}

            {isScanning ? (
              <div style={{
                padding: "20px 14px", textAlign: "center",
                background: "#F0FDF4", border: "1px solid #A7F3D0",
                borderRadius: R.md,
              }}>
                <style>{`@keyframes ocrSpin{to{transform:rotate(360deg)}}`}</style>
                <div style={{ fontSize: 28, marginBottom: 10 }}>🔍</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#065F46", fontFamily: F }}>OCR 掃瞄中… Scanning</div>
                <div style={{ fontSize: 11, color: "#047857", marginTop: 4, fontFamily: F }}>AI 正在識別此頁證書，請稍候…</div>
                <div style={{ display: "flex", justifyContent: "center", gap: 5, marginTop: 12 }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#059669", animation: `ocrSpin 0.9s ease-in-out ${i * 0.18}s infinite alternate`, opacity: 0.7 }} />
                  ))}
                </div>
              </div>
            ) : isOcrError ? (
              <div style={{
                padding: "14px 16px",
                background: "#FEF2F2", border: "1px solid #FECACA",
                borderRadius: R.md,
                display: "flex", flexDirection: "column", gap: 10,
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <AlertCircle size={18} color={C.error} style={{ flexShrink: 0, marginTop: 1 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#991B1B", fontFamily: F }}>
                      OCR 未能完成 — 可重試或手動填寫
                    </div>
                    <div style={{ fontSize: 11, color: "#B91C1C", marginTop: 4, fontFamily: F, lineHeight: 1.45 }}>
                      {cert?.ocrError || cert?.event || "AI 逾時或置信度不足。您仍可直接編輯下方欄位並儲存。"}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  <button
                    type="button"
                    id="btn-crop-retry-ocr"
                    onClick={() => void rescanActiveOcr()}
                    disabled={!cert || isScanning}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      padding: "8px 14px", borderRadius: R.md,
                      border: "1px solid #FCA5A5", background: "#fff",
                      color: "#B91C1C", fontSize: 12, fontWeight: 700, fontFamily: F,
                      cursor: !cert || isScanning ? "wait" : "pointer",
                    }}
                  >
                    <RefreshCw size={13} style={{
                      animation: isScanning ? "ocrSpin 0.9s linear infinite" : undefined,
                    }} />
                    🔄 重新裁切或重試 (Crop & Retry)
                  </button>
                  <div style={{
                    display: "inline-flex", alignItems: "center",
                    fontSize: 11, color: "#7F1D1D", fontFamily: F, fontWeight: 500,
                  }}>
                    或直接手動輸入學生／獎項資料後按「批核並下一份」
                  </div>
                </div>
              </div>
            ) : isOcrQueued ? (
              <div style={{
                padding: "12px 14px",
                background: "#FFFBEB", border: "1px solid #FDE68A",
                borderRadius: R.md, fontSize: 12, color: "#92400E", fontWeight: 600,
              }}>
                ⏳ 此頁已在 OCR 佇列中，系統會依序掃描（不會同時打爆 GB10）。
              </div>
            ) : isOcrPending ? (
              <div style={{
                padding: "12px 14px",
                background: "#FFFBEB", border: "1px solid #FDE68A",
                borderRadius: R.md, fontSize: 12, color: "#92400E", fontWeight: 600,
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap",
              }}>
                <span>
                  {(ocrQueueProgress.running || scanningIds.size > 0)
                    ? "此頁尚未 OCR — 系統正自動依序掃描批次，稍候會輪到此頁。"
                    : "此頁尚未 OCR。系統會自動加入佇列；亦可手動優先掃描。"}
                </span>
                <button
                  type="button"
                  onClick={() => ensureOcrForCert(cert, true)}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    padding: "6px 12px", borderRadius: R.md,
                    border: "1px solid #F59E0B", background: "#fff",
                    color: "#B45309", fontSize: 11, fontWeight: 700, fontFamily: F, cursor: "pointer",
                  }}
                >
                  <ScanLine size={12} /> 優先掃描
                </button>
              </div>
            ) : (
              <div style={{
                padding: "9px 14px",
                background: "#EFF6FF", border: "1px solid #BFDBFE",
                borderRadius: R.md, fontSize: 12, color: "#1E40AF", fontWeight: 500,
              }}>
                💾 掃描結果已自動儲存至資料庫。請核對以下欄位，確認無誤後點擊右下角「批核並下一份」。
              </div>
            )}

            {/* Form sections — keep editable on OCR error so users can type manually */}
            {!isScanning && (<>

            {/* ── SECTION 1: Student Association — overflow visible so autocomplete can float ── */}
            <div
              className="sts-batch-ocr"
              style={{
                background: C.surface, borderRadius: R.lg,
                border: `1px solid ${C.border}`, boxShadow: S.xs,
                overflow: "visible",
                position: "relative",
                zIndex: activeStudentUi.hits.length > 0 ? 20 : 1,
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
                    onClick={() => openConflictPicker(activeItemId)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") openConflictPicker(activeItemId); }}
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
                {!activeStudentUi.editing && hasBoundStudent(cert) ? (
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
                      onClick={() => beginChangeStudent(activeItemId)}
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
                      onClick={() => clearStudentBinding(activeItemId)}
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
                        ref={(el) => { if (activeItemId) studentSearchInputRefs.current[activeItemId] = el; }}
                        autoFocus
                        value={activeStudentUi.query}
                        onChange={e => runStudentSearch(activeItemId, e.target.value)}
                        placeholder="OCR 自動匹配或手動搜尋…"
                        style={{
                          flex: 1, border: "none", outline: "none", background: "transparent",
                          fontSize: 13, fontFamily: F, color: C.textPrimary,
                        }}
                      />
                      {activeStudentUi.searching && (
                        <span style={{ fontSize: 10, color: C.textMuted }}>搜尋中…</span>
                      )}
                      {(cert?.studentId || activeStudentUi.query) && (
                        <button
                          type="button"
                          onClick={() => {
                            if (hasBoundStudent(cert)) {
                              patchStudentUi(activeItemId, { editing: false, query: "", hits: [], searchError: null });
                            } else {
                              clearStudentBinding(activeItemId);
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
                    {activeStudentUi.searchError && (
                      <div style={{
                        marginTop: 8, fontSize: 11.5, fontWeight: 600, fontFamily: F, lineHeight: 1.45,
                        color: activeStudentUi.searchError.startsWith("⚠️") ? "#92400E" : C.error,
                        background: activeStudentUi.searchError.startsWith("⚠️") ? "#FFFBEB" : "#FEF2F2",
                        border: `1px solid ${activeStudentUi.searchError.startsWith("⚠️") ? "#FDE68A" : "#FECACA"}`,
                        borderRadius: R.md, padding: "8px 10px",
                      }}>
                        {activeStudentUi.searchError}
                      </div>
                    )}
                    {activeStudentUi.hits.length > 0 && (
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
                        {activeStudentUi.hits.map(hit => {
                          const cls = hit.class_code || hit.class_name || "—";
                          const num = hit.student_number || hit.student_code || "—";
                          const card = hit.card_id || num;
                          return (
                            <li
                              key={hit.id}
                              className="list-group-item list-group-item-action"
                              onClick={() => confirmStudentAssociation(activeItemId, hit)}
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
                {(cert?.matchConf || 0) > 0 && !activeStudentUi.editing && hasBoundStudent(cert) && (
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
                {activeStudentUi.editing && activeStudentUi.hits.length > 1 && (
                  <div style={{
                    marginTop: 6, display: "flex", alignItems: "center", gap: 5,
                    fontSize: 11, color: "#B45309",
                  }}>
                    <AlertCircle size={10} color="#B45309" />
                    <span>
                      找到 {activeStudentUi.hits.length} 位「{activeStudentUi.query || cert?.extractedNameRaw || "同名"}」
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
                    value={form.level || ""}
                    onChange={e => updateField(activeItemId, "level", e.target.value)}
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
                    value={form.tier || ""}
                    onChange={e => updateField(activeItemId, "tier", e.target.value)}
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
                    value={form.title || ""}
                    onChange={e => updateField(activeItemId, "title", e.target.value)}
                    style={{ ...inputBase, ...highlightStyle }}
                  />
                </div>

                <div>
                  <FormLabel zh="獎項詳情" en="Award Details" />
                  <input
                    value={form.award || ""}
                    onChange={e => updateField(activeItemId, "award", e.target.value)}
                    style={{ ...inputBase, ...highlightStyle }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <FormLabel zh="時數" en="Hours Dimension" />
                    <input
                      type="number"
                      value={form.hours || ""}
                      onChange={e => updateField(activeItemId, "hours", e.target.value)}
                      style={{ ...inputBase, ...highlightStyle }}
                    />
                  </div>
                  <div>
                    <FormLabel zh="活動日期" en="Event Date" />
                    <input
                      type="date"
                      value={form.date || ""}
                      onChange={e => updateField(activeItemId, "date", e.target.value)}
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
                      ✓ 此記錄已批核 · Approved — advance to next when ready
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
              );
            })}
            </>
            )}
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

                {/* Approve & Next — OCR/draft already autosaved */}
                <button
                  onClick={() => void handleSaveNext()}
                  disabled={isDiscarded || isScanning}
                  style={{
                    flex: isMobile ? 1 : undefined,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                    padding: "8px 16px",
                    border: `1.5px solid ${C.accent}`,
                    borderRadius: R.md, background: isSaved ? C.accentLight : C.accentPale,
                    cursor: (isDiscarded || isScanning) ? "not-allowed" : "pointer",
                    fontSize: 12, fontWeight: 600, color: C.accent,
                    fontFamily: F, opacity: (isDiscarded || isScanning) ? 0.45 : 1,
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={e => !isDiscarded && (e.currentTarget.style.background = C.accentLight)}
                  onMouseLeave={e => (e.currentTarget.style.background = isSaved ? C.accentLight : C.accentPale)}
                >
                  <CheckCircle2 size={13} />
                  {isSaved ? "已批核 · 下一份" : "批核並下一份"}
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
                title={!allDone ? "請先完成所有文件批核" : undefined}
                style={{ width: isMobile ? "100%" : undefined }}
              >
                {submitDone
                  ? <><CheckCircle2 size={13} color="#fff" /> 全部批核完成！</>
                  : <>✅ 全部批核 (Approve All {totalCerts})</>
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
          全部批核完成！{saved.size} 筆紀錄已核准 · {saved.size} records approved.
        </div>
      )}
    </div>
  );
};
