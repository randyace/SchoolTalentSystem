// ─────────────────────────────────────────────────────────────────────────────
// Screen 1.C.2  評估項目管理 / Assessment Management
// List: Subjects-style header + card table. Create/Edit: full-page form.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useMemo, useState } from "react";
import { ERP } from "./erpTokens";
import { Plus, Search, ChevronDown, Edit2, Trash2, ArrowLeft, Save } from "lucide-react";

export interface AssessmentRow {
  id: number;
  academic_year: string;
  term: string;
  form: string;
  subject_id: number;
  subject_code?: string;
  subject_label?: string;
  name: string;
  max_score: number;
}

interface SubjectOpt {
  id: number | string;
  code?: string;
  label?: string;
  status?: string;
  name_zh_hk?: string;
  name_en?: string;
}

interface LabelOpt { value: string; label: string }

const TERM_LABEL: Record<string, string> = {
  T1: "上學期 Term 1",
  T2: "下學期 Term 2",
};

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  padding: "9px 12px", borderRadius: ERP.radius.md,
  border: `1px solid ${ERP.colors.border}`,
  background: ERP.colors.surface, color: ERP.colors.textPrimary,
  fontSize: 13, fontFamily: ERP.font.family, outline: "none",
};

function Section({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: ERP.colors.surface, border: `1px solid ${ERP.colors.border}`,
      borderRadius: ERP.radius.lg, padding: "20px 22px", marginBottom: 16,
      boxShadow: ERP.shadow.xs,
    }}>
      <div style={{
        display: "flex", alignItems: "baseline", gap: 8,
        paddingBottom: 10, marginBottom: 16,
        borderBottom: `1px solid ${ERP.colors.border}`,
      }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: ERP.colors.textPrimary }}>{label}</span>
        {sub && <span style={{ fontSize: 11, color: ERP.colors.textMuted }}>{sub}</span>}
      </div>
      {children}
    </div>
  );
}

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: ERP.colors.textSecondary, marginBottom: 6, fontFamily: ERP.font.family }}>
        {label}
        {required && <span style={{ color: ERP.colors.red, marginLeft: 3 }}>*</span>}
        {hint && <span style={{ fontSize: 10, fontWeight: 400, color: ERP.colors.textMuted, marginLeft: 8 }}>{hint}</span>}
      </label>
      {children}
    </div>
  );
}

export interface AssessmentsScreenProps {
  assessments?: AssessmentRow[];
  subjects?: SubjectOpt[];
  terms?: LabelOpt[];
  forms?: string[];
  academicYear?: string;
  academicYears?: string[];
  openForm?: boolean;
  assessmentId?: number | null;
  initialAssessment?: AssessmentRow | null;
  storeUrl?: string;
  updateUrl?: string;
  deleteUrl?: string;
  listUrl?: string;
  createUrl?: string;
  editUrlBase?: string;
  flashSuccess?: string;
  flashError?: string;
}

const emptyForm = (year: string): AssessmentRow => ({
  id: 0,
  academic_year: year,
  term: "T1",
  form: "F1",
  subject_id: 0,
  name: "",
  max_score: 100,
});

const COLS = "100px 140px 72px 1.2fr 1.4fr 80px 88px";

export const Screen_Assessments: React.FC<AssessmentsScreenProps> = (props) => {
  const formMode = !!(props.openForm || (props.assessmentId != null && props.assessmentId > 0) || props.initialAssessment);
  return formMode ? <AssessmentFormPage {...props} /> : <AssessmentListPage {...props} />;
};

const AssessmentListPage: React.FC<AssessmentsScreenProps> = ({
  assessments = [],
  terms = [
    { value: "T1", label: "上學期 Term 1" },
    { value: "T2", label: "下學期 Term 2" },
  ],
  forms = ["F1", "F2", "F3", "F4", "F5", "F6"],
  academicYear = "2025/26",
  academicYears = ["2025/26"],
  deleteUrl = "/assessments/delete",
  createUrl = "/assessments/create",
  editUrlBase = "/assessments/edit",
  flashSuccess,
  flashError,
}) => {
  const F = ERP.font.family;
  const [rows, setRows] = useState<AssessmentRow[]>(assessments);
  const [q, setQ] = useState("");
  const [filterYear, setFilterYear] = useState(academicYear);
  const [filterTerm, setFilterTerm] = useState("");
  const [filterForm, setFilterForm] = useState("");
  const [msg, setMsg] = useState(flashSuccess || "");
  const [err, setErr] = useState(flashError || "");
  const years = academicYears.length ? academicYears : [academicYear];

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter(r => {
      if (filterYear && r.academic_year !== filterYear) return false;
      if (filterTerm && r.term !== filterTerm) return false;
      if (filterForm && r.form !== filterForm) return false;
      if (!needle) return true;
      return [r.name, r.subject_label, r.subject_code, r.form, r.term].some(
        v => String(v || "").toLowerCase().includes(needle)
      );
    });
  }, [rows, q, filterYear, filterTerm, filterForm]);

  const remove = async (row: AssessmentRow, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`刪除評估項目「${row.name}」？相關成績將一併刪除。`)) return;
    try {
      const res = await fetch(`${deleteUrl.replace(/\/$/, "")}/${row.id}`, {
        method: "POST",
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      });
      const json = await res.json();
      if (json?.ok) {
        setRows(prev => prev.filter(r => r.id !== row.id));
        setMsg(json.message || "已刪除");
        setErr("");
      } else {
        setErr(json?.message || "刪除失敗");
      }
    } catch {
      setErr("刪除失敗");
    }
  };

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden", background: ERP.colors.pageBg, fontFamily: F, flexDirection: "column" }}>
      <div style={{ padding: "20px 24px 14px", flexShrink: 0, borderBottom: `1px solid ${ERP.colors.border}`, background: ERP.colors.surface }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: ERP.colors.textPrimary, letterSpacing: "-0.3px" }}>
              評估項目管理
            </h1>
            <p style={{ margin: "3px 0 0", fontSize: 12, color: ERP.colors.textMuted }}>
              Assessment Management · AY {filterYear || academicYear} · {filtered.length} 個項目
            </p>
          </div>
          <a href={createUrl} className="btn btn-primary" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "8px 14px", borderRadius: ERP.radius.md,
            border: "none", background: ERP.colors.accent, color: "#fff",
            fontSize: 13, fontWeight: 600, fontFamily: F, cursor: "pointer", textDecoration: "none",
          }}>
            <Plus size={14} /> 新增評估項目
          </a>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" as const }}>
          <select value={filterYear} onChange={e => setFilterYear(e.target.value)} style={{ ...inputStyle, width: 120, fontSize: 12 }}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={filterTerm} onChange={e => setFilterTerm(e.target.value)} style={{ ...inputStyle, width: 150, fontSize: 12 }}>
            <option value="">全部學期</option>
            {terms.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <select value={filterForm} onChange={e => setFilterForm(e.target.value)} style={{ ...inputStyle, width: 110, fontSize: 12 }}>
            <option value="">全部年級</option>
            {forms.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          <div style={{ position: "relative", flex: 1, minWidth: 160 }}>
            <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: ERP.colors.textMuted, pointerEvents: "none" }} />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="搜尋評估名稱或科目…" style={{ ...inputStyle, paddingLeft: 32, fontSize: 12 }} />
          </div>
        </div>
        {msg && <p style={{ margin: "10px 0 0", fontSize: 12, color: ERP.colors.success, fontWeight: 600 }}>{msg}</p>}
        {err && <p style={{ margin: "10px 0 0", fontSize: 12, color: ERP.colors.red, fontWeight: 600 }}>{err}</p>}
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "16px 24px 24px" }}>
        <div style={{ background: ERP.colors.surface, borderRadius: ERP.radius.lg, border: `1px solid ${ERP.colors.border}`, overflow: "hidden", boxShadow: ERP.shadow.xs }}>
          <div style={{ overflowX: "auto" }}>
            <div style={{
              minWidth: 860, display: "grid", gridTemplateColumns: COLS,
              background: ERP.colors.pageBg, borderBottom: `1px solid ${ERP.colors.border}`, padding: "0 16px",
            }}>
              {["學年", "學期", "年級", "科目", "評估項目", "滿分", "操作"].map(h => (
                <div key={h} style={{ padding: "11px 8px 11px 0", fontSize: 11, fontWeight: 700, color: ERP.colors.textMuted, letterSpacing: "0.5px", textTransform: "uppercase" as const }}>{h}</div>
              ))}
            </div>
            {filtered.length === 0 ? (
              <div style={{ padding: "40px 16px", textAlign: "center" as const, color: ERP.colors.textMuted, fontSize: 13 }}>
                沒有評估項目。請按右上角「新增評估項目」建立 Mid-Term / Final / Coursework。
              </div>
            ) : filtered.map((row, idx) => (
              <div
                key={row.id}
                style={{
                  minWidth: 860, display: "grid", gridTemplateColumns: COLS, padding: "0 16px",
                  borderBottom: idx < filtered.length - 1 ? `1px solid ${ERP.colors.border}` : "none",
                  background: ERP.colors.surface, alignItems: "center",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = ERP.colors.surfaceHover; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = ERP.colors.surface; }}
              >
                <div style={cell}>{row.academic_year}</div>
                <div style={cell}>{TERM_LABEL[row.term] || row.term}</div>
                <div style={cell}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: ERP.radius.xs, background: ERP.colors.accentPale, color: ERP.colors.accent, border: `1px solid ${ERP.colors.accentLight}` }}>{row.form}</span>
                </div>
                <div style={cell}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{row.subject_label || row.subject_code}</div>
                  {row.subject_code && row.subject_label?.includes(row.subject_code) ? null : (
                    <div style={{ fontSize: 10, color: ERP.colors.textMuted, fontFamily: ERP.font.mono }}>{row.subject_code}</div>
                  )}
                </div>
                <div style={{ ...cell, fontWeight: 700 }}>{row.name}</div>
                <div style={{ ...cell, fontFamily: ERP.font.mono, fontWeight: 700 }}>{row.max_score}</div>
                <div style={{ ...cell, display: "flex", gap: 2 }}>
                  <a href={`${editUrlBase.replace(/\/$/, "")}/${row.id}`} title="編輯" style={{ background: "none", border: "none", cursor: "pointer", padding: 5, color: ERP.colors.accent, display: "flex", borderRadius: ERP.radius.sm }}>
                    <Edit2 size={14} />
                  </a>
                  <button type="button" onClick={e => remove(row, e)} title="刪除" style={{ background: "none", border: "none", cursor: "pointer", padding: 5, color: ERP.colors.red, display: "flex", borderRadius: ERP.radius.sm }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const cell: React.CSSProperties = {
  padding: "13px 8px 13px 0",
  fontSize: 13,
  color: ERP.colors.textPrimary,
  alignSelf: "center",
};

const AssessmentFormPage: React.FC<AssessmentsScreenProps> = ({
  subjects = [],
  terms = [
    { value: "T1", label: "上學期 Term 1 (T1)" },
    { value: "T2", label: "下學期 Term 2 (T2)" },
  ],
  forms = ["F1", "F2", "F3", "F4", "F5", "F6"],
  academicYear = "2025/26",
  academicYears = ["2025/26"],
  assessmentId = null,
  initialAssessment = null,
  storeUrl = "/assessments/store",
  updateUrl = "/assessments/update",
  listUrl = "/assessments",
  flashError,
}) => {
  const F = ERP.font.family;
  const years = academicYears.length ? academicYears : [academicYear];
  const [form, setForm] = useState<AssessmentRow>(initialAssessment ?? emptyForm(academicYear));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(flashError || "");
  const isEdit = (assessmentId != null && assessmentId > 0) || form.id > 0;
  const activeSubjects = subjects.filter(s => !s.status || s.status === "active");

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const max = Number(form.max_score);
    if (!form.name.trim() || !form.subject_id || !form.term || !form.form) {
      setErr("請填寫學期、年級、科目與評估名稱。");
      return;
    }
    if (!Number.isFinite(max) || max <= 0) {
      setErr("滿分必須為大於 0 的數字。");
      return;
    }
    setSaving(true);
    setErr("");
    const id = form.id || assessmentId || 0;
    const url = id > 0 ? `${updateUrl.replace(/\/$/, "")}/${id}` : storeUrl;
    try {
      const res = await fetch(url, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          id,
          academic_year: form.academic_year,
          term: form.term,
          form: form.form,
          subject_id: Number(form.subject_id),
          name: form.name.trim(),
          max_score: max,
        }),
      });
      const json = await res.json();
      if (!json?.ok) {
        setErr(json?.message || "儲存失敗");
        return;
      }
      window.location.href = listUrl;
    } catch {
      setErr("儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ height: "100%", overflow: "auto", background: ERP.colors.pageBg, fontFamily: F }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 24px 40px" }}>
        <a href={listUrl} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: ERP.colors.textSecondary, textDecoration: "none", marginBottom: 16 }}>
          <ArrowLeft size={14} /> 返回評估項目
        </a>
        <h1 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700, color: ERP.colors.textPrimary }}>
          {isEdit ? "編輯評估項目" : "新增評估項目"}
        </h1>
        <p style={{ margin: "0 0 20px", fontSize: 12, color: ERP.colors.textMuted }}>
          Assessment Management · 設定學年、學期、年級、科目、名稱與滿分
        </p>
        {err && <p style={{ margin: "0 0 14px", fontSize: 13, color: ERP.colors.red, fontWeight: 600 }}>{err}</p>}

        <form onSubmit={save}>
          <Section label="測考範圍" sub="Academic Scope">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="學年 Academic Year" required>
                <select value={form.academic_year} onChange={e => setForm({ ...form, academic_year: e.target.value })} style={inputStyle}>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </Field>
              <Field label="學期 Term" required>
                <div style={{ position: "relative" }}>
                  <select value={form.term} onChange={e => setForm({ ...form, term: e.target.value })} style={{ ...inputStyle, appearance: "none" as const, paddingRight: 28 }}>
                    {terms.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <ChevronDown size={13} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: ERP.colors.textMuted }} />
                </div>
              </Field>
              <Field label="年級 Form" required>
                <select value={form.form} onChange={e => setForm({ ...form, form: e.target.value })} style={inputStyle}>
                  {forms.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </Field>
              <Field label="科目 Subject" required>
                <select value={String(form.subject_id || "")} onChange={e => setForm({ ...form, subject_id: Number(e.target.value) })} style={inputStyle}>
                  <option value="">選擇科目</option>
                  {activeSubjects.map(s => (
                    <option key={String(s.id)} value={String(s.id)}>{s.label || [s.code, s.name_zh_hk || s.name_en].filter(Boolean).join(" ")}</option>
                  ))}
                </select>
              </Field>
            </div>
          </Section>

          <Section label="評估項目" sub="Assessment Item">
            <Field label="評估名稱 Assessment Name" hint="例如：期中考 Mid-Term、專題報告 Project" required>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="期中考 Mid-Term" style={inputStyle} />
            </Field>
            <Field label="滿分 Max Score" required>
              <input type="number" min={0.01} step="0.01" value={form.max_score} onChange={e => setForm({ ...form, max_score: Number(e.target.value) })} style={{ ...inputStyle, maxWidth: 200 }} />
            </Field>
          </Section>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <a href={listUrl} style={{
              padding: "9px 18px", borderRadius: ERP.radius.md, border: `1px solid ${ERP.colors.border}`,
              background: ERP.colors.surface, color: ERP.colors.textSecondary, fontSize: 13, fontFamily: F, textDecoration: "none",
            }}>取消 Cancel</a>
            <button type="submit" disabled={saving} style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "9px 20px", borderRadius: ERP.radius.md, border: "none",
              background: ERP.colors.accent, color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: F, cursor: "pointer",
            }}>
              <Save size={14} /> {saving ? "儲存中…" : "儲存 Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
