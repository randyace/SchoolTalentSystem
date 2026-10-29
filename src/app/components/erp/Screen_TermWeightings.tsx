// ─────────────────────────────────────────────────────────────────────────────
// Screen_TermWeightings — EDB 測考評分比重 matrix (Panel Head)
// Overall T1/T2 + Daily / Midterm / Exam breakdown; Daily lists assessment items
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect, useState } from "react";
import { ERP } from "./erpTokens";
import { Save, AlertCircle, Check, RefreshCw } from "lucide-react";

type SubjectOpt = {
  dbId?: number; id?: string | number; code: string;
  zhName?: string; enName?: string; name_zh_hk?: string; name_en?: string;
  levels?: string[];
};

type DailyItem = {
  id?: number;
  assessment_id: number;
  assessment_name: string;
  term: string;
  weight_pct: number;
};

type Matrix = {
  id: number;
  subject_id: number;
  form: string | null;
  academic_year: string;
  overall_t1: number;
  overall_t2: number;
  t1_daily: number;
  t1_midterm: number;
  t1_exam: number;
  t2_daily: number;
  t2_midterm: number;
  t2_exam: number;
  daily_items: DailyItem[];
  available?: Array<{ id: number; name: string; term: string; form: string }>;
};

interface Props {
  subjects?: SubjectOpt[];
  subjectId?: number | null;
  academicYear?: string;
  form?: string | null;
  matrix?: Matrix | null;
  saveUrl?: string;
  matrixUrl?: string;
  flashMessage?: string | null;
}

const FORMS = ["F1", "F2", "F3", "F4", "F5", "F6"];

function subjectLabel(s: SubjectOpt) {
  const zh = s.zhName || s.name_zh_hk || "";
  const en = s.enName || s.name_en || "";
  return `${s.code} — ${zh}${en ? " / " + en : ""}`;
}

export const Screen_TermWeightings: React.FC<Props> = ({
  subjects = [],
  subjectId: initialSubjectId = null,
  academicYear: initialYear = "2025/26",
  form: initialForm = null,
  matrix: initialMatrix = null,
  saveUrl = "/term-weightings/save",
  matrixUrl = "/term-weightings/matrix",
  flashMessage = null,
}) => {
  const F = ERP.font.family;
  const [subjectId, setSubjectId] = useState<number | "">(initialSubjectId ?? "");
  const [year, setYear] = useState(initialYear);
  const [form, setForm] = useState<string>(initialForm || "");
  const [matrix, setMatrix] = useState<Matrix | null>(initialMatrix);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(flashMessage);
  const [err, setErr] = useState("");

  const loadMatrix = async (sid: number, yr: string, frm: string) => {
    if (!sid) return;
    try {
      const qs = new URLSearchParams({
        subject_id: String(sid),
        academic_year: yr,
      });
      if (frm) qs.set("form", frm);
      const res = await fetch(`${matrixUrl}?${qs}`, { credentials: "same-origin", headers: { Accept: "application/json" } });
      const json = await res.json();
      if (json?.ok && json.matrix) setMatrix(json.matrix);
    } catch {
      setErr("無法載入比重矩陣");
    }
  };

  useEffect(() => {
    if (typeof subjectId === "number" && subjectId > 0) {
      loadMatrix(subjectId, year, form);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId, year, form]);

  const patch = (key: keyof Matrix, value: number) => {
    if (!matrix) return;
    setMatrix({ ...matrix, [key]: value });
  };

  const patchItem = (assessmentId: number, term: string, pct: number) => {
    if (!matrix) return;
    setMatrix({
      ...matrix,
      daily_items: matrix.daily_items.map(it =>
        it.assessment_id === assessmentId && it.term === term
          ? { ...it, weight_pct: pct }
          : it
      ),
    });
  };

  const addAvailable = (aid: number, term: string, name: string) => {
    if (!matrix) return;
    if (matrix.daily_items.some(i => i.assessment_id === aid && i.term === term)) return;
    setMatrix({
      ...matrix,
      daily_items: [...matrix.daily_items, { assessment_id: aid, assessment_name: name, term, weight_pct: 0 }],
      available: (matrix.available || []).filter(a => a.id !== aid),
    });
  };

  const save = async () => {
    if (!matrix || !subjectId) return;
    setSaving(true);
    setErr("");
    setMsg(null);
    try {
      const res = await fetch(saveUrl, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          subject_id: subjectId,
          academic_year: year,
          form: form || null,
          overall_t1: matrix.overall_t1,
          overall_t2: matrix.overall_t2,
          t1_daily: matrix.t1_daily,
          t1_midterm: matrix.t1_midterm,
          t1_exam: matrix.t1_exam,
          t2_daily: matrix.t2_daily,
          t2_midterm: matrix.t2_midterm,
          t2_exam: matrix.t2_exam,
          daily_items: matrix.daily_items,
        }),
      });
      const json = await res.json();
      if (!json?.ok) {
        setErr(json?.message || "儲存失敗");
        return;
      }
      if (json.matrix) setMatrix(json.matrix);
      setMsg(json.message || "已儲存");
    } catch {
      setErr("儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  const t1Items = (matrix?.daily_items || []).filter(i => i.term === "T1");
  const t2Items = (matrix?.daily_items || []).filter(i => i.term === "T2");
  const t1Sum = matrix ? matrix.t1_daily + matrix.t1_midterm + matrix.t1_exam : 0;
  const t2Sum = matrix ? matrix.t2_daily + matrix.t2_midterm + matrix.t2_exam : 0;
  const overallOk = matrix ? Math.abs(matrix.overall_t1 + matrix.overall_t2 - 100) < 0.01 : false;

  const numInput = (value: number, onChange: (v: number) => void, accent = "#0F172A") => (
    <input
      type="number" min={0} max={100} step={1} value={value}
      onChange={e => onChange(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
      style={{
        width: 64, textAlign: "center", padding: "6px 8px",
        border: `1px solid ${ERP.colors.border}`, borderRadius: ERP.radius.sm,
        fontSize: 14, fontWeight: 800, color: accent, fontFamily: F, outline: "none",
      }}
    />
  );

  return (
    <div style={{ height: "100%", overflow: "auto", background: ERP.colors.pageBg, fontFamily: F, padding: "20px 24px 40px" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: ERP.colors.textPrimary }}>測考評分比重</h1>
        <p style={{ margin: "4px 0 18px", fontSize: 12, color: ERP.colors.textMuted }}>
          Term Weighting Matrix · EDB 結構（總比重 / 上學期 / 下學期 · Daily · Mid-Term · Exam）
        </p>

        {msg && (
          <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: ERP.radius.md, background: "#ECFDF5", border: "1px solid #A7F3D0", color: "#047857", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
            <Check size={14} /> {msg}
          </div>
        )}
        {err && (
          <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: ERP.radius.md, background: "#FEF2F2", border: "1px solid #FECACA", color: "#B91C1C", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
            <AlertCircle size={14} /> {err}
          </div>
        )}

        {/* Filters */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: 10, marginBottom: 18, background: ERP.colors.surface, padding: 14, borderRadius: ERP.radius.lg, border: `1px solid ${ERP.colors.border}` }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: ERP.colors.textMuted, marginBottom: 4 }}>科目 Subject</div>
            <select
              value={subjectId === "" ? "" : String(subjectId)}
              onChange={e => setSubjectId(e.target.value === "" ? "" : Number(e.target.value))}
              style={{ width: "100%", padding: "8px 10px", borderRadius: ERP.radius.md, border: `1px solid ${ERP.colors.border}`, fontFamily: F, fontSize: 13 }}
            >
              <option value="">— 選擇科目 —</option>
              {subjects.map(s => {
                const id = Number(s.dbId || s.id || 0);
                return <option key={id} value={id}>{subjectLabel(s)}</option>;
              })}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: ERP.colors.textMuted, marginBottom: 4 }}>學年</div>
            <input value={year} onChange={e => setYear(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: ERP.radius.md, border: `1px solid ${ERP.colors.border}`, fontFamily: F, fontSize: 13 }} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: ERP.colors.textMuted, marginBottom: 4 }}>級別 Form</div>
            <select value={form} onChange={e => setForm(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: ERP.radius.md, border: `1px solid ${ERP.colors.border}`, fontFamily: F, fontSize: 13 }}>
              <option value="">全部 / 科目預設</option>
              {FORMS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button type="button" onClick={() => typeof subjectId === "number" && loadMatrix(subjectId, year, form)} style={{
              display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: ERP.radius.md,
              border: `1px solid ${ERP.colors.border}`, background: "#fff", cursor: "pointer", fontFamily: F, fontSize: 12, fontWeight: 600,
            }}>
              <RefreshCw size={13} /> 重新載入
            </button>
          </div>
        </div>

        {!matrix ? (
          <div style={{ padding: 40, textAlign: "center", color: ERP.colors.textMuted, background: ERP.colors.surface, borderRadius: ERP.radius.lg, border: `1px dashed ${ERP.colors.border}` }}>
            請選擇科目以載入／建立測考評分比重矩陣
          </div>
        ) : (
          <>
            {/* Overall */}
            <section style={{ background: ERP.colors.surface, border: `1px solid ${ERP.colors.border}`, borderRadius: ERP.radius.lg, padding: 16, marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12, color: ERP.colors.textPrimary }}>總比重 Overall Total</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ background: "#EEF2FF", border: "1px solid #C7D2FE", borderRadius: ERP.radius.md, padding: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#4338CA", marginBottom: 8 }}>上學期 Term 1</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {numInput(matrix.overall_t1, v => { patch("overall_t1", v); patch("overall_t2", 100 - v); }, "#4338CA")}
                    <span style={{ fontWeight: 700, color: "#4338CA" }}>%</span>
                  </div>
                </div>
                <div style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: ERP.radius.md, padding: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#047857", marginBottom: 8 }}>下學期 Term 2</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {numInput(matrix.overall_t2, v => { patch("overall_t2", v); patch("overall_t1", 100 - v); }, "#047857")}
                    <span style={{ fontWeight: 700, color: "#047857" }}>%</span>
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 10, fontSize: 12, fontWeight: 700, color: overallOk ? "#15803D" : "#C2410C" }}>
                {overallOk ? "總比重合計 100%" : `合計 ${(matrix.overall_t1 + matrix.overall_t2).toFixed(0)}% · 必須為 100%`}
              </div>
            </section>

            {/* Term breakdowns */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              {[
                { title: "上學期比重 Term 1", dailyKey: "t1_daily" as const, midKey: "t1_midterm" as const, examKey: "t1_exam" as const, sum: t1Sum, items: t1Items, term: "T1", midLabel: "Mid-Term Test", examLabel: "Exam" },
                { title: "下學期比重 Term 2", dailyKey: "t2_daily" as const, midKey: "t2_midterm" as const, examKey: "t2_exam" as const, sum: t2Sum, items: t2Items, term: "T2", midLabel: "Mid-Term Test", examLabel: "Final Exam" },
              ].map(block => (
                <section key={block.term} style={{ background: ERP.colors.surface, border: `1px solid ${ERP.colors.border}`, borderRadius: ERP.radius.lg, padding: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12 }}>{block.title}</div>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: "8px 0", color: ERP.colors.textSecondary }}>Daily（每科不同）</td>
                        <td style={{ textAlign: "right" }}>{numInput(matrix[block.dailyKey], v => patch(block.dailyKey, v))} %</td>
                      </tr>
                      <tr>
                        <td colSpan={2} style={{ padding: "4px 0 8px" }}>
                          {block.items.length === 0 ? (
                            <div style={{ fontSize: 11, color: ERP.colors.textMuted, padding: "6px 8px", background: ERP.colors.pageBg, borderRadius: 6 }}>
                              尚未連結日常評估項目 — 於「評估項目管理」新增後會自動出現
                            </div>
                          ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingLeft: 8 }}>
                              {block.items.map(it => (
                                <div key={`${it.assessment_id}-${it.term}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                                  <span style={{ color: ERP.colors.textPrimary }}>{it.assessment_name}</span>
                                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                                    {numInput(it.weight_pct, v => patchItem(it.assessment_id, it.term, v))}
                                    <span style={{ color: ERP.colors.textMuted }}>%</span>
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: "8px 0", color: ERP.colors.textSecondary }}>{block.midLabel}</td>
                        <td style={{ textAlign: "right" }}>{numInput(matrix[block.midKey], v => patch(block.midKey, v))} %</td>
                      </tr>
                      <tr>
                        <td style={{ padding: "8px 0", color: ERP.colors.textSecondary }}>{block.examLabel}</td>
                        <td style={{ textAlign: "right" }}>{numInput(matrix[block.examKey], v => patch(block.examKey, v))} %</td>
                      </tr>
                    </tbody>
                  </table>
                  <div style={{ marginTop: 8, fontSize: 11, fontWeight: 700, color: Math.abs(block.sum - 100) < 0.01 ? "#15803D" : "#C2410C" }}>
                    學期內合計 {block.sum.toFixed(0)}% {Math.abs(block.sum - 100) < 0.01 ? "✓" : "· 建議 100%"}
                  </div>
                </section>
              ))}
            </div>

            {/* Pull in unlinked assessments */}
            {(matrix.available || []).length > 0 && (
              <section style={{ background: ERP.colors.surface, border: `1px solid ${ERP.colors.border}`, borderRadius: ERP.radius.lg, padding: 14, marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>可加入 Daily 的評估項目</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {matrix.available!.map(a => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => addAvailable(a.id, a.term, a.name)}
                      style={{
                        padding: "6px 10px", borderRadius: ERP.radius.md, border: `1px solid ${ERP.colors.border}`,
                        background: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: F,
                      }}
                    >
                      + {a.name} ({a.term}/{a.form})
                    </button>
                  ))}
                </div>
              </section>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button type="button" onClick={save} disabled={saving || !overallOk} style={{
                display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px",
                borderRadius: ERP.radius.md, border: "none",
                background: overallOk ? ERP.colors.accent : ERP.colors.border,
                color: overallOk ? "#fff" : ERP.colors.textMuted,
                fontSize: 13, fontWeight: 700, fontFamily: F,
                cursor: overallOk && !saving ? "pointer" : "default",
              }}>
                <Save size={14} /> {saving ? "儲存中…" : "儲存比重 Save"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
