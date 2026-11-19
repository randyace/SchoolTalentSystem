// 4-Step eClass 大分紙 Import Wizard + Footer Verification
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  UploadCloud, CheckCircle2, AlertTriangle, ArrowRight, ArrowLeft,
  Download, RefreshCw, History, Shield, Zap,
} from "lucide-react";
import { ERP } from "./erpTokens";
import { useIsMobile, ResponsiveTableWrapper, rwdGrid } from "./erpResponsive";

const F = ERP.font.family;
const C = ERP.colors;

type ColRole = "identity" | "subject_total" | "subpaper" | "student_summary" | "ignore";
type Column = {
  header: string; index: number; role: ColRole; subject_code?: string | null;
  max_score: number; csv_mean?: number | null; csv_sd?: number | null; csv_pass_rate?: number | null; ignore?: boolean;
};
type FooterStat = {
  id: number; column_header: string; column_role: string; max_score: number; calc_n: number;
  csv_mean: number | null; calc_mean: number | null; csv_sd: number | null; calc_sd: number | null;
  csv_max: number | null; calc_max: number | null; csv_min: number | null; calc_min: number | null;
  csv_pass_rate: number | null; calc_pass_rate: number | null; is_matched: number; diff_notes: string | null;
};
type BatchDetail = {
  batch: Record<string, unknown>;
  footer_stats: FooterStat[];
  verification: { matched: number; total: number; status: string };
};

const ROLE_STYLE: Record<ColRole, { bg: string; color: string; label: string }> = {
  identity: { bg: "#DBEAFE", color: "#1D4ED8", label: "🔵 學生識別" },
  subject_total: { bg: "#DCFCE7", color: "#15803D", label: "🟢 科目總分" },
  subpaper: { bg: "#EDE9FE", color: "#6D28D9", label: "🟣 科目分卷" },
  student_summary: { bg: "#FEF3C7", color: "#B45309", label: "🟡 學生總結與名次" },
  ignore: { bg: "#F1F5F9", color: "#64748B", label: "⚪ 略過" },
};

export type BroadsheetWizardProps = {
  analyzeUrl?: string;
  executeUrl?: string;
  batchesUrl?: string;
};

export const BroadsheetWizard: React.FC<BroadsheetWizardProps> = ({
  analyzeUrl = "/api/data-import/broadsheet/analyze",
  executeUrl = "/api/data-import/broadsheet/execute",
  batchesUrl = "/api/data-import/broadsheet/batches",
}) => {
  const isMobile = useIsMobile();
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [year, setYear] = useState("2023/24");
  const [form, setForm] = useState("F1");
  const [term, setTerm] = useState("Annual");
  const [batchLabel, setBatchLabel] = useState("");
  const [termNote, setTermNote] = useState<string | null>(null);
  const [autoCreate, setAutoCreate] = useState(true);
  const [overwrite, setOverwrite] = useState(false);
  const [columns, setColumns] = useState<Column[]>([]);
  const [subjects, setSubjects] = useState<Array<{ code: string; name_zh_hk: string }>>([]);
  const [previewStats, setPreviewStats] = useState<Record<string, number> | null>(null);
  const [footerCaptured, setFooterCaptured] = useState(false);
  const [result, setResult] = useState<BatchDetail | null>(null);
  const [batches, setBatches] = useState<Array<Record<string, unknown>>>([]);
  const [showHistory, setShowHistory] = useState(false);

  const loadBatches = useCallback(async () => {
    try {
      const res = await fetch(batchesUrl, { credentials: "include", headers: { Accept: "application/json" } });
      const json = await res.json();
      if (json?.ok) setBatches(json.batches || []);
    } catch { /* ignore */ }
  }, [batchesUrl]);

  useEffect(() => { void loadBatches(); }, [loadBatches]);

  const onFile = async (f: File | null) => {
    if (!f) return;
    setFile(f);
    setError(null);
    setBusy(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", f);
      const res = await fetch(analyzeUrl, { method: "POST", credentials: "include", body: fd });
      const json = await res.json();
      if (!json?.ok) {
        setError(json?.message || "分析失敗");
        return;
      }
      setColumns((json.columns || []).map((c: Column) => ({ ...c, role: (c.role as ColRole) || "subject_total" })));
      setSubjects(json.subjects || []);
      setPreviewStats(json.stats_preview || null);
      setFooterCaptured(!!json.footer_captured);
      if (json.context) {
        setYear(json.context.academic_year || "2023/24");
        setForm(json.context.form || "F1");
        setTerm(json.context.term || "Annual");
        setTermNote(json.context.term_note || null);
      }
      if (json.suggest_auto_create_students) setAutoCreate(true);
      setStep(1);
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  };

  const editableCols = useMemo(
    () => columns.filter((c) => c.role !== "identity"),
    [columns],
  );

  const onExecute = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(executeUrl, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          academic_year: year,
          form,
          term,
          batch_label: batchLabel,
          auto_create_students: autoCreate,
          overwrite,
          columns,
        }),
      });
      const json = await res.json();
      if (json?.duplicate) {
        setError(json.message);
        setOverwrite(true);
        return;
      }
      if (!json?.ok) {
        setError(json?.message || "匯入失敗");
        return;
      }
      setResult({
        batch: json.batch?.batch || json.batch || {},
        footer_stats: json.batch?.footer_stats || [],
        verification: json.verification || json.batch?.verification || { matched: 0, total: 0, status: "pending" },
      });
      setStep(4);
      void loadBatches();
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  };

  const updateMax = async (header: string, max: number) => {
    const batchId = Number((result?.batch as any)?.id || 0);
    if (!batchId) return;
    setBusy(true);
    try {
      const res = await fetch(`${batchesUrl}/${batchId}/update-max-score`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ column_header: header, max_score: max }),
      });
      const json = await res.json();
      if (json?.ok && json.batch) {
        setResult({
          batch: json.batch.batch,
          footer_stats: json.batch.footer_stats,
          verification: json.batch.verification,
        });
      }
    } finally {
      setBusy(false);
    }
  };

  const openBatch = async (id: number) => {
    setBusy(true);
    try {
      const res = await fetch(`${batchesUrl}/${id}`, { credentials: "include" });
      const json = await res.json();
      if (json?.ok) {
        setResult({ batch: json.batch, footer_stats: json.footer_stats, verification: json.verification });
        setStep(4);
        setShowHistory(false);
      }
    } finally {
      setBusy(false);
    }
  };

  const v = result?.verification;
  const btn: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px",
    borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface,
    fontFamily: F, fontSize: 12, fontWeight: 700, cursor: "pointer", color: C.textPrimary,
  };

  return (
    <div style={{ fontFamily: F }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800 }}>📊 eClass 大分紙 4 步匯入精靈</div>
          <div style={{ fontSize: 11, color: C.textMuted }}>自動分類分卷／總分 · STDEV.S 對帳 · 歷史學年隔離</div>
        </div>
        <button type="button" style={btn} onClick={() => { setShowHistory((s) => !s); void loadBatches(); }}>
          <History size={14} /> 歷史批次
        </button>
      </div>

      {showHistory && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, marginBottom: 12 }}>
          {(batches || []).length === 0 && <div style={{ fontSize: 12, color: C.textMuted }}>尚無匯入批次</div>}
          {(batches || []).map((b) => (
            <button key={String(b.id)} type="button" onClick={() => void openBatch(Number(b.id))}
              style={{ ...btn, width: "100%", justifyContent: "space-between", marginBottom: 6 }}>
              <span>#{String(b.id)} · {String(b.academic_year)} {String(b.form)} {String(b.term)} · {String(b.source_filename)}</span>
              <span style={{ color: b.verification_status === "verified" ? "#15803D" : "#B45309" }}>
                {String(b.matched_columns_count)}/{String(b.total_verified_columns)}
              </span>
            </button>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 12 }}>
        {["上傳與上下文", "欄位分類與滿分", "預覽確認", "對帳報告"].map((label, i) => {
          const n = i + 1;
          const active = step === n;
          return (
            <div key={label} style={{
              padding: "8px 12px", borderRadius: 8, whiteSpace: "nowrap", fontSize: 12, fontWeight: 700,
              background: active ? C.accent : C.pageBg, color: active ? "#fff" : C.textSecondary,
              border: `1px solid ${active ? C.accent : C.border}`,
            }}>Step {n} · {label}</div>
          );
        })}
      </div>

      {error && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#991B1B", padding: 10, borderRadius: 8, marginBottom: 10, fontSize: 12 }}>
          {error}
        </div>
      )}

      {step === 1 && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) void onFile(f); }}
            style={{
              border: `2px dashed ${C.borderStrong}`, borderRadius: 12, padding: isMobile ? 20 : 28,
              textAlign: "center", background: C.pageBg, marginBottom: 14,
            }}
          >
            <UploadCloud size={28} color={C.accent} />
            <div style={{ fontSize: 13, fontWeight: 700, marginTop: 8 }}>拖放或選擇 eClass 大分紙 CSV / XLSX</div>
            <input type="file" accept=".csv,.xlsx,.xls" style={{ marginTop: 10 }}
              onChange={(e) => void onFile(e.target.files?.[0] || null)} />
            {file && <div style={{ marginTop: 8, fontSize: 12, color: C.textSecondary }}>已選：{file.name}{busy ? " · 分析中…" : ""}</div>}
          </div>

          <div style={{ ...rwdGrid(isMobile, "1fr 1fr", "1fr", "10px", "10px") }}>
            <label style={{ fontSize: 12 }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>學年 Academic Year</div>
              <select value={year} onChange={(e) => setYear(e.target.value)} style={{ width: "100%", padding: 8, borderRadius: 8, border: `1px solid ${C.border}` }}>
                {["2023/24", "2024/25", "2025/26"].map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
              <div style={{ fontSize: 10, color: "#15803D", marginTop: 4 }}>🔒 歷史學年將與 2025/26 現行資料完全隔離</div>
            </label>
            <label style={{ fontSize: 12 }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>年級 Form</div>
              <select value={form} onChange={(e) => setForm(e.target.value)} style={{ width: "100%", padding: 8, borderRadius: 8, border: `1px solid ${C.border}` }}>
                {["F1", "F2", "F3", "F4", "F5", "F6"].map((f) => <option key={f}>{f}</option>)}
              </select>
            </label>
            <label style={{ fontSize: 12 }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>考期 / 批次</div>
              <select value={term} onChange={(e) => setTerm(e.target.value)} style={{ width: "100%", padding: 8, borderRadius: 8, border: `1px solid ${C.border}` }}>
                <option value="T1">上學期 T1</option>
                <option value="T2">下學期 T2</option>
                <option value="Annual">全學年總結 Annual</option>
              </select>
              {termNote && <div style={{ fontSize: 10, color: "#B45309", marginTop: 4 }}>{termNote}</div>}
            </label>
            <label style={{ fontSize: 12 }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>自訂批次標籤</div>
              <input value={batchLabel} onChange={(e) => setBatchLabel(e.target.value)} placeholder="例如：第一次總結"
                style={{ width: "100%", boxSizing: "border-box", padding: 8, borderRadius: 8, border: `1px solid ${C.border}` }} />
            </label>
          </div>

          <div style={{ marginTop: 12, fontSize: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>缺漏學生處理</div>
            <label style={{ display: "block", marginBottom: 4 }}>
              <input type="radio" checked={!autoCreate} onChange={() => setAutoCreate(false)} /> 僅匹配現有學生（略過未建檔學號）
            </label>
            <label style={{ display: "block" }}>
              <input type="radio" checked={autoCreate} onChange={() => setAutoCreate(true)} /> 自動以 WebSAMS / 內聯網帳號建立匿名占位學生（推薦）
            </label>
          </div>

          <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end" }}>
            <button type="button" disabled={!file || columns.length === 0 || busy} style={{ ...btn, background: C.accent, color: "#fff", border: "none" }}
              onClick={() => setStep(2)}>
              下一步：欄位分類 <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
          {footerCaptured && (
            <div style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", color: "#065F46", padding: 10, borderRadius: 8, marginBottom: 12, fontSize: 12 }}>
              ✅ 已自動偵測並分離底部 5 列官方統計（平均數／標準偏差／最高／最低／及格率）及分班尾列，將作為 Step 4 自動對帳基準。
            </div>
          )}
          <ResponsiveTableWrapper>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 640 }}>
              <thead>
                <tr style={{ background: C.pageBg, textAlign: "left" }}>
                  {["欄位", "角色", "科目", "滿分"].map((h) => <th key={h} style={{ padding: 8 }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {editableCols.map((col) => {
                  const st = ROLE_STYLE[col.role] || ROLE_STYLE.ignore;
                  return (
                    <tr key={col.header} style={{ borderTop: `1px solid ${C.border}` }}>
                      <td style={{ padding: 8, fontFamily: ERP.font.mono, fontSize: 11 }}>{col.header}</td>
                      <td style={{ padding: 8 }}>
                        <select
                          value={col.role}
                          onChange={(e) => setColumns((prev) => prev.map((c) => c.header === col.header ? { ...c, role: e.target.value as ColRole } : c))}
                          style={{ padding: 6, borderRadius: 6, border: `1px solid ${C.border}`, background: st.bg, color: st.color, fontWeight: 700 }}
                        >
                          {(Object.keys(ROLE_STYLE) as ColRole[]).map((r) => <option key={r} value={r}>{ROLE_STYLE[r].label}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: 8 }}>
                        {(col.role === "subject_total" || col.role === "subpaper") ? (
                          <select
                            value={col.subject_code || ""}
                            onChange={(e) => setColumns((prev) => prev.map((c) => c.header === col.header ? { ...c, subject_code: e.target.value } : c))}
                            style={{ padding: 6, borderRadius: 6, border: `1px solid ${C.border}` }}
                          >
                            {subjects.map((s) => <option key={s.code} value={s.code}>{s.code} · {s.name_zh_hk}</option>)}
                          </select>
                        ) : "—"}
                      </td>
                      <td style={{ padding: 8 }}>
                        {(col.role === "subject_total" || col.role === "subpaper") ? (
                          <input type="number" value={col.max_score}
                            onChange={(e) => setColumns((prev) => prev.map((c) => c.header === col.header ? { ...c, max_score: Number(e.target.value) || 100 } : c))}
                            style={{ width: 72, padding: 6, borderRadius: 6, border: `1px solid ${C.border}`, fontWeight: col.role === "subpaper" ? 800 : 400 }} />
                        ) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </ResponsiveTableWrapper>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, gap: 8, flexWrap: "wrap" }}>
            <button type="button" style={btn} onClick={() => setStep(1)}><ArrowLeft size={14} /> 上一步</button>
            <button type="button" style={{ ...btn, background: C.accent, color: "#fff", border: "none" }} onClick={() => setStep(3)}>
              下一步：預覽 <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
          <div style={{ ...rwdGrid(isMobile, "repeat(4,1fr)", "repeat(2,1fr)", "10px", "10px"), marginBottom: 14 }}>
            {[
              { label: "有效學生數", value: previewStats?.valid_students ?? "—" },
              { label: "預計新建占位", value: autoCreate ? "依未建檔學號" : "0" },
              { label: "科目與分卷", value: (previewStats?.subject_total_cols ?? 0) + (previewStats?.subpaper_cols ?? 0) },
              { label: "空帳號略過", value: previewStats?.skipped_empty_students ?? "—" },
            ].map((k) => (
              <div key={k.label} style={{ background: C.pageBg, borderRadius: 10, padding: 12, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 11, color: C.textMuted }}>{k.label}</div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{k.value}</div>
              </div>
            ))}
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, marginBottom: 12 }}>
            <input type="checkbox" checked={overwrite} onChange={(e) => setOverwrite(e.target.checked)} />
            若相同學年/年級/考期已存在，覆寫更新此批次
          </label>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
            <button type="button" style={btn} onClick={() => setStep(2)}><ArrowLeft size={14} /> 上一步</button>
            <button type="button" disabled={busy} style={{ ...btn, background: "#0F172A", color: "#fff", border: "none" }} onClick={() => void onExecute()}>
              <Zap size={14} /> {busy ? "匯入中…" : "確認匯入並執行自動對帳"}
            </button>
          </div>
        </div>
      )}

      {step === 4 && result && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
          <div style={{
            background: v?.status === "verified" ? "linear-gradient(135deg,#ECFDF5,#D1FAE5)" : "linear-gradient(135deg,#FFFBEB,#FEF3C7)",
            border: `1px solid ${v?.status === "verified" ? "#6EE7B7" : "#FDE68A"}`,
            borderRadius: 12, padding: 16, marginBottom: 14,
          }}>
            <div style={{ fontSize: 16, fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }}>
              {v?.status === "verified" ? <CheckCircle2 color="#059669" /> : <AlertTriangle color="#D97706" />}
              對帳完成：{v?.matched ?? 0} / {v?.total ?? 0} 項指標
              {v?.status === "verified" ? " 100% 吻合" : " 部分需檢查"}（STDEV.S 樣本標準差基準）
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
              <a href={`${batchesUrl}/${(result.batch as any).id}/export-verification`} style={{ ...btn, textDecoration: "none" }}>
                <Download size={14} /> 匯出對帳驗證報告 CSV
              </a>
              <button type="button" style={btn} onClick={() => { setStep(1); setFile(null); setColumns([]); setResult(null); }}>
                <RefreshCw size={14} /> 繼續匯入下一份大分紙
              </button>
            </div>
          </div>

          <ResponsiveTableWrapper>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, minWidth: 900 }}>
              <thead>
                <tr style={{ background: C.pageBg, textAlign: "left" }}>
                  {["科目/分卷", "滿分", "N", "平均數 原檔/系統", "SD STDEV.S 原檔/系統", "最高/最低", "及格率 原檔/系統", "狀態"].map((h) => (
                    <th key={h} style={{ padding: 8 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.footer_stats.map((r) => (
                  <tr key={r.id} style={{ borderTop: `1px solid ${C.border}` }}>
                    <td style={{ padding: 8, fontWeight: 700 }}>{r.column_header}<div style={{ color: C.textMuted }}>{r.column_role}</div></td>
                    <td style={{ padding: 8 }}>
                      {(r.column_role === "subject_total" || r.column_role === "subpaper") ? (
                        <input type="number" defaultValue={r.max_score}
                          onBlur={(e) => void updateMax(r.column_header, Number(e.target.value) || r.max_score)}
                          style={{ width: 64, padding: 4, borderRadius: 6, border: `1px solid ${C.border}` }} />
                      ) : r.max_score}
                    </td>
                    <td style={{ padding: 8 }}>{r.calc_n}</td>
                    <td style={{ padding: 8 }}>{r.csv_mean ?? "—"} / {r.calc_mean ?? "—"}</td>
                    <td style={{ padding: 8 }}>{r.csv_sd ?? "—"} / {r.calc_sd ?? "—"}</td>
                    <td style={{ padding: 8 }}>{r.calc_max ?? "—"} / {r.calc_min ?? "—"}</td>
                    <td style={{ padding: 8 }}>{r.csv_pass_rate ?? "—"}% / {r.calc_pass_rate ?? "—"}%</td>
                    <td style={{ padding: 8, fontWeight: 800, color: r.is_matched ? "#059669" : "#D97706" }}>
                      {r.is_matched ? "✅ 100% 吻合" : "⚠️ 需檢查滿分"}
                      {r.diff_notes && <div style={{ fontWeight: 500, fontSize: 10 }}>{r.diff_notes}</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ResponsiveTableWrapper>
          <div style={{ marginTop: 10, fontSize: 11, color: C.textMuted, display: "flex", alignItems: "center", gap: 6 }}>
            <Shield size={12} /> 寫入之 assessments / scores 使用學年 {String((result.batch as any).academic_year)}，不會覆寫 2025/26 demo。
          </div>
        </div>
      )}
    </div>
  );
};

export default BroadsheetWizard;
