// ─────────────────────────────────────────────────────────────────────────────
// Screen 1.C.3  成績輸入 / Score Entry
// UI Pattern: High-Density Spreadsheet Grid (Excel-like)
// Sticky left columns: 班號, 姓名. ABS/EXM rows with disabled cells.
// High-speed keyboard: auto-select, Enter/Arrow vertical nav, status lock.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { ERP } from "./erpTokens";
import {
  Upload, Save, Send, ChevronDown, AlertTriangle,
  Sparkles, CheckCircle2, FileSpreadsheet, RotateCcw, Lock, Unlock, X,
} from "lucide-react";
import { ScoreSpreadsheetGrid } from "./ScoreSpreadsheetGrid";

type StatusCode = "normal" | "abs" | "exm" | "late";

interface PaperCol {
  assessment_id: number;
  paper_id: number;
  name: string;
  name_en?: string;
  weighting?: number;
  max_score: number;
  is_locked?: boolean;
  writable?: boolean;
  gate_reason?: string | null;
}

interface ScoreRow {
  classNum: number;
  id: number;
  studentCode: string;
  chName: string;
  enName: string;
  score: number | null;
  status: StatusCode;
  note: string;
  /** paper assessment_id → score cell */
  paperScores?: Record<string, { score: number | null; status: StatusCode; note: string }>;
}

interface ClassOpt {
  id: number | string;
  name?: string;
  form?: string;
  classCode?: string;
  label?: string;
}

interface SubjectOpt {
  id: number | string;
  code?: string;
  name_zh_hk?: string;
  name_en?: string;
  label?: string;
  offered_forms?: string[];
}

interface LabelOpt { value: string; label: string }

const TERM_FALLBACK: LabelOpt[] = [
  { value: "T1", label: "上學期 Term 1" },
  { value: "T2", label: "下學期 Term 2" },
];

const STATUS_CFG: Record<StatusCode, { bg: string; color: string; border: string; label: string; db: string }> = {
  normal: { bg: "#F0FDF4", color: "#15803D", border: "#86EFAC", label: "正常", db: "Normal" },
  abs:    { bg: "#FFFBEB", color: "#92400E", border: "#FCD34D", label: "ABS 缺席", db: "ABS" },
  exm:    { bg: "#EFF6FF", color: "#1D4ED8", border: "#93C5FD", label: "EXM 免修", db: "EXM" },
  late:   { bg: "#FFF7ED", color: "#C2410C", border: "#FDBA74", label: "LATE 遲到", db: "LATE" },
};

const scoreColor = (score: number | null, status: StatusCode): string => {
  if (score === null || status !== "normal") return ERP.colors.pageBg;
  if (score >= 80) return "#F0FDF4";
  if (score < 50)  return "#FEF2F2";
  return ERP.colors.surface;
};

const scoreTextColor = (score: number | null): string => {
  if (score === null) return ERP.colors.textMuted;
  if (score >= 80) return "#166534";
  if (score < 50)  return "#DC2626";
  return ERP.colors.textPrimary;
};

const FilterSelect: React.FC<{
  label: string; value: string; options: LabelOpt[];
  onChange: (v: string) => void;
  disabled?: boolean;
  placeholder?: string;
}> = ({ label, value, options, onChange, disabled, placeholder }) => (
  <div style={{ position: "relative" }}>
    <label style={{
      display: "block", fontSize: 10, fontWeight: 600,
      color: ERP.colors.textMuted, marginBottom: 3, letterSpacing: "0.05em",
      fontFamily: ERP.font.family,
    }}>{label}</label>
    <div style={{ position: "relative" }}>
      <select value={value} disabled={disabled} onChange={e => onChange(e.target.value)} style={{
        padding: "6px 26px 6px 10px", borderRadius: ERP.radius.sm,
        border: `1px solid ${ERP.colors.border}`, background: ERP.colors.surface,
        fontSize: 13, fontFamily: ERP.font.family, color: ERP.colors.textPrimary,
        outline: "none", cursor: disabled ? "not-allowed" : "pointer", appearance: "none" as const,
        fontWeight: 600, opacity: disabled ? 0.6 : 1,
      }}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={11} style={{ position: "absolute", right: 7, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: ERP.colors.textMuted }} />
    </div>
  </div>
);

const cellBorder: React.CSSProperties = {
  borderRight: `1px solid ${ERP.colors.border}`,
  borderBottom: `1px solid ${ERP.colors.border}`,
};
const headCellStyle = (extra?: React.CSSProperties): React.CSSProperties => ({
  ...cellBorder,
  padding: "9px 10px",
  background: "#F8FAFC",
  borderTop: `1px solid ${ERP.colors.border}`,
  fontSize: 11, fontWeight: 700, color: ERP.colors.textMuted,
  letterSpacing: "0.05em", textTransform: "uppercase" as const,
  whiteSpace: "nowrap" as const, userSelect: "none" as const,
  ...extra,
});

interface AssessOpt {
  id: number; name: string; max_score: number;
  papers?: PaperCol[];
  is_locked?: boolean;
  writable?: boolean;
  gate_reason?: string | null;
}

export interface ScoreEntryProps {
  lang?: "en" | "zh-HK";
  academicYear?: string;
  classes?: ClassOpt[];
  subjects?: SubjectOpt[];
  terms?: LabelOpt[];
  rosterUrl?: string;
  saveUrl?: string;
  assessmentsUrl?: string;
  importUrl?: string;
  lockUrl?: string;
  isAdmin?: boolean;
  canUnlock?: boolean;
}

export const Screen_ScoreEntry: React.FC<ScoreEntryProps> = ({
  lang = "zh-HK",
  academicYear = "2025/26",
  classes = [],
  subjects = [],
  terms = TERM_FALLBACK,
  rosterUrl = "/scores/roster",
  saveUrl = "/scores/batch-update",
  assessmentsUrl = "/scores/assessments",
  importUrl = "/scores/import",
  lockUrl = "/scores/lock",
  isAdmin = false,
  canUnlock = false,
}) => {
  const termOpts = terms.length ? terms : TERM_FALLBACK;

  const classOpts: LabelOpt[] = classes.map(c => ({
    value: String(c.id),
    label: c.label || [c.classCode || (c.name ? `F${c.name}` : ""), c.form].filter(Boolean).join(" · ") || String(c.id),
  }));

  const [scores,     setScores]     = useState<ScoreRow[]>([]);
  const [term,       setTerm]       = useState(termOpts[0]?.value ?? "T1");
  const [cls,        setCls]        = useState(classOpts[0]?.value ?? "");
  const [subject,    setSubject]    = useState(() => String(subjects[0]?.id ?? ""));
  const [assessmentItems, setAssessmentItems] = useState<AssessOpt[]>([]);
  const [assessmentId, setAssessmentId] = useState<string>("");
  const [maxScore,   setMaxScore]   = useState(100);
  const [isMobile,   setIsMobile]   = useState(false);
  const [isDraft,    setIsDraft]    = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [loadError,  setLoadError]  = useState<string | null>(null);
  const [focusedId,  setFocusedId]  = useState<number | null>(null);
  const [papers, setPapers] = useState<PaperCol[]>([]);
  const [colWritable, setColWritable] = useState(true);
  const [colLocked, setColLocked] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [baselineJson, setBaselineJson] = useState("");
  const tableRef = useRef<HTMLTableElement>(null);
  const unlockOk = canUnlock || isAdmin;

  const selectedForm = String(classes.find(c => String(c.id) === cls)?.form || "");
  const subjectOpts: LabelOpt[] = subjects
    .filter(s => {
      const of = Array.isArray(s.offered_forms) ? s.offered_forms : [];
      if (!selectedForm || of.length === 0) return true;
      return of.some(f => {
        const n = String(f).toUpperCase().replace(/^S/, "F");
        return n === selectedForm || String(f) === selectedForm;
      });
    })
    .map(s => ({
      value: String(s.id),
      label: s.label || [s.code, s.name_zh_hk || s.name_en].filter(Boolean).join(" ") || String(s.id),
    }));

  useEffect(() => {
    if (subjectOpts.length && !subjectOpts.some(o => o.value === subject)) {
      setSubject(subjectOpts[0].value);
    }
  }, [cls]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (!cls || !subject || !term) {
      setAssessmentItems([]);
      setAssessmentId("");
      setScores([]);
      return;
    }
    let cancelled = false;
    const q = new URLSearchParams({
      class_id: cls,
      subject_id: subject,
      term,
      academic_year: academicYear,
    });
    fetch(`${assessmentsUrl}?${q.toString()}`, { credentials: "same-origin" })
      .then(r => r.json())
      .then(json => {
        if (cancelled) return;
        const list: AssessOpt[] = Array.isArray(json?.data) ? json.data : [];
        setAssessmentItems(list);
        setAssessmentId(prev => {
          if (prev && list.some(a => String(a.id) === prev)) return prev;
          return list[0] ? String(list[0].id) : "";
        });
        if (!list.length) {
          setScores([]);
          setLoadError("此班級／科目尚無評估項目。請到「評估項目設定」新增。");
        } else {
          setLoadError(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAssessmentItems([]);
          setAssessmentId("");
          setLoadError("無法載入評估項目");
        }
      });
    return () => { cancelled = true; };
  }, [cls, subject, term, academicYear, assessmentsUrl]);

  useEffect(() => {
    const selected = assessmentItems.find(a => String(a.id) === assessmentId);
    if (selected) setMaxScore(Number(selected.max_score) || 100);
    if (!cls || !assessmentId) {
      setScores([]);
      return;
    }
    let cancelled = false;
    const q = new URLSearchParams({
      class_id: cls,
      assessment_id: assessmentId,
      academic_year: academicYear,
    });
    fetch(`${rosterUrl}?${q.toString()}`, { credentials: "same-origin" })
      .then(r => r.json())
      .then(json => {
        if (cancelled) return;
        if (!json?.ok) {
          setLoadError(json?.message || "無法載入名冊");
          setScores([]);
          return;
        }
        setLoadError(null);
        setMaxScore(Number(json.assessment?.max_score) || 100);
        setIsDraft(false);
        const pcols: PaperCol[] = Array.isArray(json.papers) ? json.papers : [];
        setPapers(pcols);
        setColLocked(!!json.assessment?.is_locked);
        setColWritable(json.assessment?.writable !== false);
        const rows: ScoreRow[] = (json.students || []).map((s: any) => {
          const paperScores: ScoreRow["paperScores"] = {};
          if (s.paper_scores && typeof s.paper_scores === "object") {
            Object.entries(s.paper_scores).forEach(([aid, cell]: [string, any]) => {
              paperScores![aid] = {
                score: cell?.score === null || cell?.score === undefined || cell?.score === "" ? null : Number(cell.score),
                status: (cell?.status === "abs" || cell?.status === "exm" || cell?.status === "late" ? cell.status : "normal") as StatusCode,
                note: String(cell?.note ?? ""),
              };
            });
          }
          return {
            id: Number(s.id),
            studentCode: String(s.student_id ?? ""),
            classNum: Number(s.classNum ?? 0),
            chName: String(s.chName ?? ""),
            enName: String(s.enName ?? ""),
            score: s.score === null || s.score === undefined || s.score === "" ? null : Number(s.score),
            status: (s.status === "abs" || s.status === "exm" || s.status === "late" ? s.status : "normal") as StatusCode,
            note: String(s.note ?? ""),
            paperScores,
          };
        });
        setScores(rows);
        setBaselineJson(JSON.stringify(rows.map(r => ({
          id: r.id, score: r.score, status: r.status, note: r.note, paperScores: r.paperScores,
        }))));
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError("無法載入名冊");
          setScores([]);
        }
      });
    return () => { cancelled = true; };
  }, [cls, assessmentId, academicYear, rosterUrl]);

  const exceedsMax = (score: number | null, status: StatusCode, cap = maxScore) =>
    status === "normal" && score !== null && !Number.isNaN(score) && score > cap;

  const overMaxRows = scores.filter(r => {
    if (papers.length > 0) {
      return papers.some(p => {
        const cell = r.paperScores?.[String(p.assessment_id)];
        const st = (cell?.status || r.status) as StatusCode;
        return exceedsMax(cell?.score ?? null, st, p.max_score || maxScore);
      });
    }
    return exceedsMax(r.score, r.status);
  });

  const inputsLocked = !colWritable;

  const onScoreChange = (id: number, raw: string) => {
    setIsDraft(false);
    const next = raw === "" ? null : Number(raw);
    setScores(prev => prev.map(r => r.id === id ? { ...r, score: next } : r));
  };

  const update = (id: number, field: keyof ScoreRow, value: ScoreRow[keyof ScoreRow]) => {
    setIsDraft(false);
    setScores(prev => prev.map(r =>
      r.id === id
        ? { ...r, [field]: value, ...(field === "status" && value !== "normal" ? { score: null } : {}) }
        : r
    ));
  };

  const focusScoreInRow = (current: HTMLInputElement, dir: 1 | -1) => {
    const table = tableRef.current;
    if (!table) return;
    const tr = current.closest("tr");
    if (!tr) return;
    let sibling: HTMLTableRowElement | null = dir === 1
      ? tr.nextElementSibling as HTMLTableRowElement | null
      : tr.previousElementSibling as HTMLTableRowElement | null;
    while (sibling) {
      const nextInput = sibling.querySelector(".raw-score-input") as HTMLInputElement | null;
      if (nextInput && !nextInput.disabled) {
        nextInput.focus();
        nextInput.select();
        return;
      }
      sibling = dir === 1
        ? sibling.nextElementSibling as HTMLTableRowElement | null
        : sibling.previousElementSibling as HTMLTableRowElement | null;
    }
  };

  const onScoreKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "ArrowDown") {
      e.preventDefault();
      focusScoreInRow(e.currentTarget, 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      focusScoreInRow(e.currentTarget, -1);
    }
  };

  /** Excel / Sheets column paste into the score grid (same column, down the rows). */
  const onScorePaste = (e: React.ClipboardEvent<HTMLInputElement>, startId: number) => {
    const text = e.clipboardData.getData("text");
    if (!text || (!text.includes("\n") && !text.includes("\t"))) return;

    e.preventDefault();
    const cells = text
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .split("\n")
      .map(line => {
        const first = line.split("\t")[0] ?? "";
        return first.trim();
      })
      .filter((v, i, arr) => !(v === "" && i === arr.length - 1));

    if (cells.length === 0) return;

    const startIdx = scores.findIndex(r => r.id === startId);
    if (startIdx < 0) return;

    setIsDraft(false);
    setScores(prev => {
      const next = [...prev];
      for (let i = 0; i < cells.length; i++) {
        const row = next[startIdx + i];
        if (!row || row.status !== "normal") continue;
        const raw = cells[i];
        if (raw === "") {
          next[startIdx + i] = { ...row, score: null };
          continue;
        }
        const num = Number(raw.replace(/,/g, ""));
        if (Number.isNaN(num)) continue;
        next[startIdx + i] = { ...row, score: num };
      }
      return next;
    });
  };

  const onStatusChange = (id: number, next: StatusCode) => {
    setIsDraft(false);
    setScores(prev => prev.map(r => {
      if (r.id !== id) return r;
      if (next === "abs" || next === "exm") {
        return { ...r, status: next, score: null };
      }
      return { ...r, status: next };
    }));
  };

  const payloadScores = useCallback(() => {
    if (papers.length > 0) {
      const out: Record<string, Record<string, { raw_score: number | null; status: string; remarks: string }>> = {};
      scores.forEach(r => {
        const nested: Record<string, { raw_score: number | null; status: string; remarks: string }> = {};
        papers.forEach(p => {
          const cell = r.paperScores?.[String(p.assessment_id)];
          const st = (cell?.status || r.status) as StatusCode;
          nested[String(p.assessment_id)] = {
            raw_score: st === "normal" ? (cell?.score ?? null) : null,
            status: STATUS_CFG[st].db,
            remarks: cell?.note || r.note,
          };
        });
        out[String(r.id)] = nested;
      });
      return out;
    }
    const out: Record<string, { raw_score: number | null; status: string; remarks: string }> = {};
    scores.forEach(r => {
      out[String(r.id)] = {
        raw_score: r.status === "normal" ? r.score : null,
        status: STATUS_CFG[r.status].db,
        remarks: r.note,
      };
    });
    return out;
  }, [scores, papers]);

  const onPaperScoreChange = (studentId: number, assessmentIdNum: number, raw: string) => {
    setIsDraft(false);
    const next = raw === "" ? null : Number(raw);
    setScores(prev => prev.map(r => {
      if (r.id !== studentId) return r;
      const paperScores = { ...(r.paperScores || {}) };
      const prevCell = paperScores[String(assessmentIdNum)] || { score: null, status: r.status, note: r.note };
      paperScores[String(assessmentIdNum)] = { ...prevCell, score: next };
      return { ...r, paperScores };
    }));
  };

  const toggleLock = async () => {
    if (!unlockOk || !assessmentId) return;
    const nextLocked = !colLocked;
    const ids = papers.length
      ? Array.from(new Set([Number(assessmentId), ...papers.map(p => p.assessment_id)]))
      : [Number(assessmentId)];
    try {
      let last: { ok?: boolean; is_locked?: boolean; message?: string } | null = null;
      for (const aid of ids) {
        const res = await fetch(lockUrl, {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ assessment_id: aid, is_locked: nextLocked }),
        });
        last = await res.json();
        if (!last?.ok) {
          setLoadError(last?.message || "鎖定操作失敗");
          return;
        }
      }
      setColLocked(!!(last?.is_locked ?? nextLocked));
      setColWritable(!(last?.is_locked ?? nextLocked));
      setPapers(prev => prev.map(p => ({
        ...p,
        is_locked: nextLocked,
        writable: !nextLocked,
      })));
    } catch {
      setLoadError("鎖定操作失敗");
    }
  };

  const runImport = async () => {
    if (!importFile || !assessmentId) return;
    setImporting(true);
    setLoadError(null);
    try {
      const fd = new FormData();
      fd.append("excel_file", importFile);
      fd.append("assessment_id", assessmentId);
      fd.append("class_id", cls);
      fd.append("academic_year", academicYear);
      const res = await fetch(importUrl, { method: "POST", credentials: "same-origin", body: fd });
      const json = await res.json();
      if (!json?.ok) {
        setLoadError(json?.message || "匯入失敗");
        return;
      }
      setShowImport(false);
      setImportFile(null);
      // reload roster
      const q = new URLSearchParams({ class_id: cls, assessment_id: assessmentId, academic_year: academicYear });
      const r2 = await fetch(`${rosterUrl}?${q}`, { credentials: "same-origin" });
      const j2 = await r2.json();
      if (j2?.ok) {
        setScores((j2.students || []).map((s: any) => ({
          id: Number(s.id),
          studentCode: String(s.student_id ?? ""),
          classNum: Number(s.classNum ?? 0),
          chName: String(s.chName ?? ""),
          enName: String(s.enName ?? ""),
          score: s.score == null || s.score === "" ? null : Number(s.score),
            status: (s.status === "abs" || s.status === "exm" || s.status === "late" ? s.status : "normal") as StatusCode,
          note: String(s.note ?? ""),
          paperScores: s.paper_scores || {},
        })));
        setIsDraft(true);
      }
      window.alert(json.message || "匯入完成");
    } catch {
      setLoadError("匯入失敗");
    } finally {
      setImporting(false);
    }
  };

  const save = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!assessmentId || saving) return;
    if (!colWritable) {
      setLoadError("此評估項目已鎖定或非輸入時段，無法儲存。請先解鎖或等待輸入時段。");
      return;
    }
    if (overMaxRows.length > 0) {
      const r = overMaxRows[0];
      setLoadError(`Student ${r.studentCode} score (${r.score}) exceeds the maximum allowed score of ${maxScore}.`);
      return;
    }
    setSaving(true);
    setLoadError(null);
    try {
      // Only send changed rows (optimize paste-heavy sessions)
      let dirtyIds: Set<number> | null = null;
      if (baselineJson) {
        try {
          const base = JSON.parse(baselineJson) as Array<{ id: number }>;
          const baseMap = new Map(base.map(b => [b.id, JSON.stringify(b)]));
          dirtyIds = new Set(
            scores
              .filter(r => {
                const snap = JSON.stringify({
                  id: r.id, score: r.score, status: r.status, note: r.note, paperScores: r.paperScores,
                });
                return baseMap.get(r.id) !== snap;
              })
              .map(r => r.id),
          );
        } catch { /* send all */ }
      }

      const flat: Array<{ student_id: number; assessment_id: number; score: number | null; status: string }> = [];
      const allScores = payloadScores();
      if (papers.length > 0) {
        Object.entries(allScores as Record<string, Record<string, { raw_score: number | null; status: string }>>).forEach(([sid, nested]) => {
          if (dirtyIds && !dirtyIds.has(Number(sid))) return;
          Object.entries(nested).forEach(([aid, cell]) => {
            flat.push({
              student_id: Number(sid),
              assessment_id: Number(aid),
              score: cell.raw_score,
              status: cell.status,
            });
          });
        });
      } else {
        Object.entries(allScores as Record<string, { raw_score: number | null; status: string }>).forEach(([sid, cell]) => {
          if (dirtyIds && !dirtyIds.has(Number(sid))) return;
          flat.push({
            student_id: Number(sid),
            assessment_id: Number(assessmentId),
            score: cell.raw_score,
            status: cell.status,
          });
        });
      }

      // Nested map trimmed to dirty students for saveBatch compatibility
      const nestedPayload: Record<string, unknown> = {};
      if (dirtyIds) {
        dirtyIds.forEach(id => {
          const key = String(id);
          if ((allScores as Record<string, unknown>)[key] !== undefined) {
            nestedPayload[key] = (allScores as Record<string, unknown>)[key];
          }
        });
      }

      const res = await fetch(saveUrl, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          assessment_id: Number(assessmentId) || 0,
          paper_assessment_ids: papers.map(p => p.assessment_id),
          class_id: Number(cls) || 0,
          subject_id: Number(subject) || 0,
          term,
          term_id: term,
          academic_year: academicYear,
          scores: dirtyIds ? nestedPayload : allScores,
          batch: flat,
        }),
      });
      const json = await res.json();
      if (json?.ok) {
        setIsDraft(true);
        setBaselineJson(JSON.stringify(scores.map(r => ({
          id: r.id, score: r.score, status: r.status, note: r.note, paperScores: r.paperScores,
        }))));
        setToast(json.message || "成績已儲存");
        setTimeout(() => setToast(null), 3200);
      } else {
        setLoadError(json?.message || "儲存失敗");
      }
    } catch {
      setLoadError("儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  const dirtyCount = useMemo(() => {
    if (!baselineJson) return scores.length;
    try {
      const base = JSON.parse(baselineJson) as Array<{ id: number }>;
      const baseMap = new Map(base.map(b => [b.id, JSON.stringify(b)]));
      return scores.filter(r => {
        const snap = JSON.stringify({
          id: r.id, score: r.score, status: r.status, note: r.note, paperScores: r.paperScores,
        });
        return baseMap.get(r.id) !== snap;
      }).length;
    } catch {
      return scores.length;
    }
  }, [scores, baselineJson]);

  const primaryScores = scores.map(r => {
    if (papers.length > 0) {
      const vals = papers
        .map(p => r.paperScores?.[String(p.assessment_id)])
        .filter(c => c && (c.status === "normal" || c.status === "late") && c.score !== null)
        .map(c => c!.score as number);
      if (!vals.length) return null;
      return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
    }
    return (r.status === "normal" || r.status === "late") ? r.score : null;
  });
  const enteredRows = primaryScores.filter((s): s is number => s !== null && !Number.isNaN(s));
  const avg = enteredRows.length
    ? Math.round((enteredRows.reduce((s, n) => s + n, 0) / enteredRows.length) * 10) / 10
    : "—";
  const highest  = enteredRows.length ? Math.max(...enteredRows) : "—";
  const passFail = enteredRows.filter(n => n < 50).length;
  const selectedAssessName = assessmentItems.find(a => String(a.id) === assessmentId)?.name || "評估項目";
  const F = ERP.font.family;
  void lang;
  void isMobile;

  return (
    <form id="scoreForm" onSubmit={save} style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%", minWidth: 0, overflow: "hidden", fontFamily: F, background: ERP.colors.pageBg, boxSizing: "border-box" }}>
      <input type="hidden" name="assessment_id" value={assessmentId} />

      <div style={{ flexShrink: 0, background: ERP.colors.surface, borderBottom: `1px solid ${ERP.colors.border}`, padding: "14px 24px 12px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <FileSpreadsheet size={18} color={ERP.colors.accent} />
              <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: ERP.colors.textPrimary }}>成績輸入</h1>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: ERP.radius.full, background: ERP.colors.accentPale, color: ERP.colors.accent, border: `1px solid ${ERP.colors.accentLight}` }}>Score Entry</span>
            </div>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: ERP.colors.textMuted }}>1.C.3 · AY {academicYear} · Excel / WebSAMS 矩陣貼上 · Ctrl+V</p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
            {unlockOk && assessmentId && (
              <button type="button" onClick={toggleLock} style={{
                display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: ERP.radius.md,
                border: `1.5px solid ${colLocked ? "#FECACA" : ERP.colors.border}`,
                background: colLocked ? "#FEF2F2" : ERP.colors.surface,
                color: colLocked ? "#B91C1C" : ERP.colors.textSecondary,
                fontSize: 13, fontWeight: 600, fontFamily: F, cursor: "pointer",
              }}>
                {colLocked ? <Unlock size={14} /> : <Lock size={14} />}
                {colLocked ? "解鎖 Unlock" : "鎖定 Lock"}
              </button>
            )}
            <button type="button" onClick={() => setShowImport(true)} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 16px", borderRadius: ERP.radius.md,
              border: `1.5px solid ${ERP.colors.accentLight}`, background: ERP.colors.accentPale,
              color: ERP.colors.accent, fontSize: 13, fontWeight: 600, fontFamily: F, cursor: "pointer",
            }}>
              <Upload size={14} /> 匯入 Excel
            </button>
          </div>
        </div>

        {colLocked && (
          <p style={{ margin: "8px 0 0", fontSize: 12, color: "#B91C1C", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
            <Lock size={12} /> 此評估項目已鎖定 — 成績欄唯讀{unlockOk ? "（管理員可解鎖）" : ""}
          </p>
        )}

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" as const, alignItems: "flex-end" }}>
          <FilterSelect label="學期" value={term} options={termOpts} onChange={setTerm} />
          <FilterSelect label="班級" value={cls} options={classOpts.length ? classOpts : [{ value: "", label: "—" }]} onChange={setCls} />
          <FilterSelect label="科目" value={subject} options={subjectOpts.length ? subjectOpts : [{ value: "", label: "—" }]} onChange={setSubject} />
          <FilterSelect
            label="評估項目"
            value={assessmentId}
            options={assessmentItems.map(a => ({ value: String(a.id), label: `${a.name} /${a.max_score}` }))}
            onChange={setAssessmentId}
            placeholder={assessmentItems.length ? undefined : "尚無評估項目"}
            disabled={!assessmentItems.length}
          />

          <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" as const }}>
            {Object.entries(STATUS_CFG).map(([k, v]) => (
              <span key={k} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: ERP.radius.full, background: v.bg, color: v.color, border: `1px solid ${v.border}` }}>
                {v.label}
              </span>
            ))}
          </div>
        </div>
        {loadError && (
          <p style={{ margin: "8px 0 0", fontSize: 12, color: ERP.colors.red, fontWeight: 600 }}>
            {loadError}{" "}
            <a href="/assessments" style={{ color: ERP.colors.accent, fontWeight: 700 }}>前往評估項目設定</a>
          </p>
        )}
      </div>

      <div style={{
        flexShrink: 0, background: "#F8FAFC",
        borderBottom: `1px solid ${ERP.colors.border}`,
        padding: "8px 24px", display: "flex", gap: 24, flexWrap: "wrap" as const, alignItems: "center",
      }}>
        {[
          { label: "已輸入",  value: `${enteredRows.length} / ${scores.length}` },
          { label: "班級平均", value: avg, color: ERP.colors.accent },
          { label: "最高分",  value: highest, color: ERP.colors.success },
          { label: "不及格",  value: passFail, color: passFail > 0 ? ERP.colors.red : ERP.colors.textMuted },
          { label: "ABS 缺席", value: scores.filter(r => r.status === "abs").length, color: "#92400E" },
          { label: "EXM 免修", value: scores.filter(r => r.status === "exm").length, color: "#1D4ED8" },
        ].map(stat => (
          <div key={stat.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 11, color: ERP.colors.textMuted, fontWeight: 500 }}>{stat.label}</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: stat.color ?? ERP.colors.textPrimary }}>{String(stat.value)}</span>
          </div>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
          <div style={{ width: 160, background: ERP.colors.border, borderRadius: 4, height: 5, overflow: "hidden" }}>
            <div style={{ width: `${scores.length ? (enteredRows.length / scores.length) * 100 : 0}%`, height: "100%", background: ERP.colors.accent, borderRadius: 4, transition: "width 0.3s" }} />
          </div>
          <span style={{ fontSize: 10, color: ERP.colors.textMuted, fontWeight: 600 }}>
            {scores.length ? Math.round((enteredRows.length / scores.length) * 100) : 0}% 完成
          </span>
        </div>
      </div>

      {/* Sticky save bar above spreadsheet grid */}
      <div style={{
        flexShrink: 0, position: "relative" as const, zIndex: 1,
        background: ERP.colors.surface,
        borderBottom: `1px solid ${ERP.colors.border}`,
        padding: "10px 24px",
        display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" as const,
        boxShadow: "0 2px 8px rgba(15,23,42,0.06)",
      }}>
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving || !assessmentId || overMaxRows.length > 0 || inputsLocked}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 18px", borderRadius: ERP.radius.md, border: "none",
            background: inputsLocked ? "#94A3B8" : ERP.colors.accent,
            color: "#fff", fontSize: 14, fontWeight: 800, fontFamily: F,
            cursor: inputsLocked || saving ? "not-allowed" : "pointer",
            boxShadow: inputsLocked ? "none" : `0 2px 10px ${ERP.colors.accent}50`,
            opacity: saving ? 0.75 : 1,
          }}
        >
          {saving ? (
            <span style={{
              width: 14, height: 14, borderRadius: "50%",
              border: "2px solid rgba(255,255,255,0.35)", borderTopColor: "#fff",
              display: "inline-block", animation: "scoreSpin 0.7s linear infinite",
            }} />
          ) : <Save size={15} />}
          {saving ? "儲存中…" : "💾 儲存成績 Save Scores"}
        </button>
        <span style={{ fontSize: 12, color: ERP.colors.textMuted, fontWeight: 600 }}>
          {dirtyCount > 0 ? `${dirtyCount} 列有變更` : "無未儲存變更"}
          {papers.length > 0 ? ` · ${papers.length} 份 Paper` : ""}
        </span>
        <div style={{ flex: 1 }} />
        {toast && (
          <div role="status" style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "7px 12px", borderRadius: ERP.radius.md,
            background: "#ECFDF5", border: "1px solid #A7F3D0",
            color: "#065F46", fontSize: 12, fontWeight: 700,
          }}>
            <CheckCircle2 size={14} color="#059669" />
            {toast}
          </div>
        )}
      </div>

      <div style={{
        flex: 1, overflow: "hidden", minHeight: 0, minWidth: 0, width: "100%",
        display: "flex", flexDirection: "column" as const, boxSizing: "border-box" as const,
      }}>
        {scores.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center" as const, color: ERP.colors.textMuted, fontSize: 13 }}>
            請先選擇班級與評估項目以載入名冊
          </div>
        ) : (
          <ScoreSpreadsheetGrid
            students={scores}
            papers={papers}
            maxScore={maxScore}
            assessmentName={selectedAssessName}
            readOnly={inputsLocked}
            height="100%"
            onChange={(next) => {
              setScores(next as typeof scores);
              setIsDraft(false);
              setLoadError(null);
            }}
          />
        )}
      </div>
      <style>{`@keyframes scoreSpin { to { transform: rotate(360deg); } }`}</style>

      {showImport && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed", inset: 0, zIndex: 80,
            background: "rgba(15,23,42,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
          }}
          onClick={() => !importing && setShowImport(false)}
        >
          <div
            style={{
              width: "100%", maxWidth: 440, background: ERP.colors.surface,
              borderRadius: ERP.radius.lg, border: `1px solid ${ERP.colors.border}`,
              boxShadow: "0 20px 50px rgba(15,23,42,0.25)", padding: 20, fontFamily: F,
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>匯入 Excel / CSV</h2>
              <button type="button" onClick={() => setShowImport(false)} style={{ border: "none", background: "transparent", cursor: "pointer", color: ERP.colors.textMuted }}>
                <X size={18} />
              </button>
            </div>
            <p style={{ margin: "0 0 12px", fontSize: 12, color: ERP.colors.textMuted, lineHeight: 1.5 }}>
              表頭需包含 <code>student_id</code>（或學號）與 <code>score</code>（或 raw_score）。將覆寫目前評估項目成績。
            </p>
            <input
              type="file"
              name="excel_file"
              accept=".xlsx,.xls,.csv"
              onChange={e => setImportFile(e.target.files?.[0] ?? null)}
              style={{ display: "block", width: "100%", fontSize: 13, marginBottom: 16 }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button type="button" onClick={() => setShowImport(false)} disabled={importing} style={{
                padding: "8px 14px", borderRadius: ERP.radius.md, border: `1px solid ${ERP.colors.border}`,
                background: ERP.colors.surface, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: F,
              }}>取消</button>
              <button type="button" onClick={runImport} disabled={!importFile || importing || !assessmentId} style={{
                padding: "8px 16px", borderRadius: ERP.radius.md, border: "none",
                background: ERP.colors.accent, color: "#fff", fontSize: 13, fontWeight: 700,
                cursor: !importFile || importing ? "not-allowed" : "pointer", fontFamily: F, opacity: !importFile ? 0.5 : 1,
              }}>
                {importing ? "匯入中…" : "開始匯入"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{
        flexShrink: 0, background: ERP.colors.surface,
        borderTop: `1px solid ${ERP.colors.border}`,
        padding: "12px 24px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" as const,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {isDraft
            ? <><CheckCircle2 size={14} color={ERP.colors.success} /><span style={{ fontSize: 12, color: ERP.colors.success, fontWeight: 600 }}>草稿已儲存</span></>
            : <><RotateCcw size={14} color={ERP.colors.textMuted} /><span style={{ fontSize: 12, color: ERP.colors.textMuted }}>尚未儲存</span></>
          }
        </div>

        <div style={{ flex: 1 }} />

        {overMaxRows.length > 0 && (
          <div role="alert" style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", background: "#FEF2F2", borderRadius: ERP.radius.sm, border: "1px solid #FECACA" }}>
            <AlertTriangle size={12} color="#DC2626" />
            <span style={{ fontSize: 11, color: "#DC2626", fontWeight: 600 }}>
              Score exceeds maximum allowed ({maxScore}) · {overMaxRows.length} 格超標
            </span>
          </div>
        )}

        {scores.filter(r => r.status === "abs").length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", background: "#FFFBEB", borderRadius: ERP.radius.sm, border: "1px solid #FCD34D" }}>
            <AlertTriangle size={12} color="#92400E" />
            <span style={{ fontSize: 11, color: "#92400E", fontWeight: 600 }}>
              {scores.filter(r => r.status === "abs").length} 名學生缺席 · 需後補
            </span>
          </div>
        )}

        <button
          type="submit"
          disabled={saving || !assessmentId || overMaxRows.length > 0 || inputsLocked}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "9px 18px", borderRadius: ERP.radius.md,
            border: `1px solid ${ERP.colors.border}`, background: ERP.colors.surface,
            color: ERP.colors.textSecondary, fontSize: 13, fontWeight: 600, fontFamily: F,
            cursor: inputsLocked ? "not-allowed" : "pointer", opacity: inputsLocked ? 0.55 : 1,
          }}
        >
          <Save size={14} /> {saving ? "儲存中…" : "儲存草稿"}
        </button>

        <button type="submit" disabled={saving || !assessmentId || overMaxRows.length > 0 || inputsLocked} style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "9px 20px", borderRadius: ERP.radius.md,
          border: "none", background: ERP.colors.accent,
          color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: F,
          cursor: inputsLocked ? "not-allowed" : "pointer",
          boxShadow: `0 2px 10px ${ERP.colors.accent}50`,
          opacity: inputsLocked ? 0.55 : 1,
        }}>
          <Send size={14} /> 提交成績
        </button>
      </div>
    </form>
  );
};
