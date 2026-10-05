// ─────────────────────────────────────────────────────────────────────────────
// Screen 1.C.3  成績輸入 / Score Entry
// UI Pattern: High-Density Spreadsheet Grid (Excel-like)
// Sticky left columns: 班號, 姓名. ABS/EXM rows with disabled cells.
// High-speed keyboard: auto-select, Enter/Arrow vertical nav, status lock.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useCallback, useRef } from "react";
import { ERP } from "./erpTokens";
import {
  Upload, Save, Send, ChevronDown, AlertTriangle,
  Sparkles, CheckCircle2, FileSpreadsheet, RotateCcw,
} from "lucide-react";

type StatusCode = "normal" | "abs" | "exm";

interface ScoreRow {
  classNum: number;
  id: number;
  studentCode: string;
  chName: string;
  enName: string;
  score: number | null;
  status: StatusCode;
  note: string;
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

interface AssessOpt { id: number; name: string; max_score: number }

export interface ScoreEntryProps {
  lang?: "en" | "zh-HK";
  academicYear?: string;
  classes?: ClassOpt[];
  subjects?: SubjectOpt[];
  terms?: LabelOpt[];
  rosterUrl?: string;
  saveUrl?: string;
  assessmentsUrl?: string;
}

export const Screen_ScoreEntry: React.FC<ScoreEntryProps> = ({
  lang = "zh-HK",
  academicYear = "2025/26",
  classes = [],
  subjects = [],
  terms = TERM_FALLBACK,
  rosterUrl = "/scores/roster",
  saveUrl = "/scores/save",
  assessmentsUrl = "/scores/assessments",
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
  const tableRef = useRef<HTMLTableElement>(null);

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
        const rows: ScoreRow[] = (json.students || []).map((s: any) => ({
          id: Number(s.id),
          studentCode: String(s.student_id ?? ""),
          classNum: Number(s.classNum ?? 0),
          chName: String(s.chName ?? ""),
          enName: String(s.enName ?? ""),
          score: s.score === null || s.score === undefined || s.score === "" ? null : Number(s.score),
          status: (s.status === "abs" || s.status === "exm" ? s.status : "normal") as StatusCode,
          note: String(s.note ?? ""),
        }));
        setScores(rows);
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError("無法載入名冊");
          setScores([]);
        }
      });
    return () => { cancelled = true; };
  }, [cls, assessmentId, academicYear, rosterUrl]);

  const exceedsMax = (score: number | null, status: StatusCode) =>
    status === "normal" && score !== null && !Number.isNaN(score) && score > maxScore;

  const overMaxRows = scores.filter(r => exceedsMax(r.score, r.status));

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
    const out: Record<string, { raw_score: number | null; status: string; remarks: string }> = {};
    scores.forEach(r => {
      out[String(r.id)] = {
        raw_score: r.status === "normal" ? r.score : null,
        status: STATUS_CFG[r.status].db,
        remarks: r.note,
      };
    });
    return out;
  }, [scores]);

  const save = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!assessmentId || saving) return;
    if (overMaxRows.length > 0) {
      const r = overMaxRows[0];
      setLoadError(`Student ${r.studentCode} score (${r.score}) exceeds the maximum allowed score of ${maxScore}.`);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(saveUrl, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          assessment_id: Number(assessmentId) || 0,
          class_id: Number(cls) || 0,
          subject_id: Number(subject) || 0,
          term,
          academic_year: academicYear,
          scores: payloadScores(),
        }),
      });
      const json = await res.json();
      if (json?.ok) setIsDraft(true);
      else setLoadError(json?.message || "儲存失敗");
    } catch {
      setLoadError("儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  const enteredRows = scores.filter(r => r.score !== null && r.status === "normal" && !exceedsMax(r.score, r.status));
  const avg = enteredRows.length
    ? Math.round((enteredRows.reduce((s, r) => s + r.score!, 0) / enteredRows.length) * 10) / 10
    : "—";
  const highest  = enteredRows.length ? Math.max(...enteredRows.map(r => r.score!)) : "—";
  const passFail = enteredRows.filter(r => (r.score ?? 0) < 50).length;
  const F = ERP.font.family;
  void lang;
  void isMobile;

  return (
    <form id="scoreForm" onSubmit={save} style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", fontFamily: F, background: ERP.colors.pageBg }}>
      <input type="hidden" name="assessment_id" value={assessmentId} />

      <div style={{ flexShrink: 0, background: ERP.colors.surface, borderBottom: `1px solid ${ERP.colors.border}`, padding: "14px 24px 12px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <FileSpreadsheet size={18} color={ERP.colors.accent} />
              <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: ERP.colors.textPrimary }}>成績輸入</h1>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: ERP.radius.full, background: ERP.colors.accentPale, color: ERP.colors.accent, border: `1px solid ${ERP.colors.accentLight}` }}>Score Entry</span>
            </div>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: ERP.colors.textMuted }}>1.C.3 · AY {academicYear} · 逐格輸入或匯入試算表</p>
          </div>
          <button type="button" style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 16px", borderRadius: ERP.radius.md,
            border: `1.5px solid ${ERP.colors.accentLight}`, background: ERP.colors.accentPale,
            color: ERP.colors.accent, fontSize: 13, fontWeight: 600, fontFamily: F, cursor: "pointer",
          }}>
            <Upload size={14} /> 匯入 Excel
          </button>
        </div>

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

      <div style={{ flex: 1, overflow: "auto" }}>
        <table ref={tableRef} data-max-score={maxScore} style={{ borderCollapse: "separate", borderSpacing: 0, minWidth: 720, tableLayout: "fixed" as const, width: "100%" }}>
          <colgroup>
            <col style={{ width: 50 }} />
            <col style={{ width: 150 }} />
            <col style={{ width: 110 }} />
            <col style={{ width: 120 }} />
            <col style={{ minWidth: 240 }} />
          </colgroup>
          <thead>
            <tr>
              <th style={{ ...headCellStyle(), position: "sticky", left: 0, zIndex: 3, textAlign: "center" as const, borderLeft: `1px solid ${ERP.colors.border}` }}>
                班號
              </th>
              <th style={{ ...headCellStyle(), position: "sticky", left: 50, zIndex: 3 }}>
                姓名 <span style={{ fontSize: 9, fontWeight: 400, color: ERP.colors.textMuted }}>Name</span>
              </th>
              <th style={headCellStyle({ textAlign: "right" as const })}>
                原始分數 <span style={{ fontSize: 9, fontWeight: 400, display: "block", color: ERP.colors.textMuted }}>Raw Score /{maxScore}</span>
              </th>
              <th style={headCellStyle()}>
                特殊狀態 <span style={{ fontSize: 9, fontWeight: 400, display: "block", color: ERP.colors.textMuted }}>Status</span>
              </th>
              <th style={headCellStyle()}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <Sparkles size={11} color={ERP.colors.purple} />
                  表現備註 (AI 輸入)
                  <span style={{ fontSize: 9, fontWeight: 400, color: ERP.colors.textMuted, marginLeft: 2 }}>AI Note Prompt</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {scores.map((row) => {
              const isAbs    = row.status === "abs";
              const isExm    = row.status === "exm";
              const disabled = isAbs || isExm;
              const sCfg     = STATUS_CFG[row.status];
              const rowBg    = isAbs ? "#FFFBEB" : isExm ? "#EFF6FF" : ERP.colors.surface;
              const overCap  = exceedsMax(row.score, row.status);
              const focused  = focusedId === row.id;
              void focused;

              return (
                <tr key={row.id} style={{ background: rowBg }}>
                  <td style={{
                    ...cellBorder, position: "sticky", left: 0, zIndex: 2,
                    background: rowBg, textAlign: "center" as const,
                    borderLeft: `1px solid ${ERP.colors.border}`,
                    padding: "0 6px",
                  }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: ERP.colors.textMuted }}>{row.classNum}</span>
                  </td>
                  <td style={{
                    ...cellBorder, position: "sticky", left: 50, zIndex: 2,
                    background: rowBg, padding: "0 10px",
                    boxShadow: "2px 0 4px rgba(0,0,0,0.04)",
                  }}>
                    <div style={{ padding: "8px 0" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: ERP.colors.textPrimary, lineHeight: 1.2 }}>{row.chName}</div>
                      <div style={{ fontSize: 10, color: ERP.colors.textMuted, marginTop: 1 }}>{row.enName || row.studentCode}</div>
                    </div>
                  </td>
                  <td style={{
                    ...cellBorder,
                    background: disabled ? "#F1F5F9" : overCap ? "#FEF2F2" : scoreColor(row.score, row.status),
                    padding: 0,
                    boxShadow: overCap ? "inset 0 0 0 2px #DC2626" : undefined,
                  }}>
                    <input
                      className="raw-score-input"
                      type="number" min={0} max={maxScore} step="0.01"
                      data-max-score={maxScore}
                      name={`scores[${row.id}][raw_score]`}
                      value={disabled ? "" : row.score ?? ""}
                      disabled={disabled}
                      placeholder={disabled ? (isAbs ? "— ABS" : "— EXM") : `0–${maxScore}`}
                      title={overCap ? `Score exceeds maximum allowed (${maxScore})` : `0–${maxScore}`}
                      onChange={e => onScoreChange(row.id, e.target.value)}
                      onInput={e => onScoreChange(row.id, (e.target as HTMLInputElement).value)}
                      onFocus={e => { setFocusedId(row.id); e.currentTarget.select(); }}
                      onBlur={() => setFocusedId(null)}
                      onKeyDown={onScoreKeyDown}
                      style={{
                        width: "100%", height: "100%", minHeight: 42, boxSizing: "border-box" as const,
                        padding: "0 10px", border: "none", outline: "none",
                        background: "transparent",
                        fontSize: 15, fontWeight: 700, fontFamily: ERP.font.mono,
                        color: disabled ? ERP.colors.textMuted : overCap ? "#DC2626" : scoreTextColor(row.score),
                        textAlign: "right" as const, cursor: disabled ? "not-allowed" : "text",
                      }}
                    />
                  </td>
                  <td style={{ ...cellBorder, padding: 0, background: sCfg.bg }}>
                    <div style={{ position: "relative" }}>
                      <select
                        name={`scores[${row.id}][status]`}
                        value={row.status}
                        onChange={e => onStatusChange(row.id, e.target.value as StatusCode)}
                        style={{
                          width: "100%", height: 42, border: "none", outline: "none",
                          background: "transparent", fontWeight: 700, fontSize: 12,
                          color: sCfg.color, cursor: "pointer",
                          appearance: "none" as const, padding: "0 28px 0 10px",
                          fontFamily: F,
                        }}
                      >
                        {Object.entries(STATUS_CFG).map(([k, v]) => (
                          <option key={k} value={k}>{v.label}</option>
                        ))}
                      </select>
                      <ChevronDown size={11} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: sCfg.color }} />
                    </div>
                  </td>
                  <td style={{ ...cellBorder, padding: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", padding: "0 4px 0 8px", height: 42 }}>
                      <Sparkles size={11} color={row.note ? ERP.colors.purple : ERP.colors.textMuted} style={{ flexShrink: 0, marginRight: 4 }} />
                      <input
                        type="text"
                        name={`scores[${row.id}][remarks]`}
                        value={row.note}
                        onChange={e => update(row.id, "note", e.target.value)}
                        placeholder="輸入觀察或備注…"
                        style={{
                          flex: 1, border: "none", outline: "none", background: "transparent",
                          fontSize: 12, fontFamily: F, color: ERP.colors.textPrimary,
                          padding: "0 4px",
                        }}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

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
          disabled={saving || !assessmentId || overMaxRows.length > 0}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "9px 18px", borderRadius: ERP.radius.md,
            border: `1px solid ${ERP.colors.border}`, background: ERP.colors.surface,
            color: ERP.colors.textSecondary, fontSize: 13, fontWeight: 600, fontFamily: F, cursor: "pointer",
          }}
        >
          <Save size={14} /> {saving ? "儲存中…" : "儲存草稿"}
        </button>

        <button type="submit" disabled={saving || !assessmentId || overMaxRows.length > 0} style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "9px 20px", borderRadius: ERP.radius.md,
          border: "none", background: ERP.colors.accent,
          color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: F, cursor: "pointer",
          boxShadow: `0 2px 10px ${ERP.colors.accent}50`,
        }}>
          <Send size={14} /> 提交成績
        </button>
      </div>
    </form>
  );
};
