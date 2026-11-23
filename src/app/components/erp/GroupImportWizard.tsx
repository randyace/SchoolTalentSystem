// 4-Step multi-workbook Teaching Group / Elective Import Wizard (Step 2)
import React, { useCallback, useEffect, useState } from "react";
import {
  UploadCloud, CheckCircle2, AlertTriangle, ArrowRight, ArrowLeft,
  RefreshCw, History, Shield, Users, Layers, ExternalLink, Info,
} from "lucide-react";
import { ERP } from "./erpTokens";
import { useIsMobile } from "./erpResponsive";
import { FileDropZone } from "./FileDropZone";
import { WizardActionBar, WizardStepper } from "./ImportWizardChrome";

const F = ERP.font.family;
const C = ERP.colors;

type GroupPreview = {
  name: string; source_filename?: string; group_type?: string;
  subject_area?: string; subject_code?: string; teacher_text?: string | null;
  room?: string | null; moi?: string | null; member_count?: number; layout?: string;
};

export type GroupImportWizardProps = {
  analyzeUrl?: string;
  executeUrl?: string;
  batchesUrl?: string;
  parseUrl?: string;
  validateUrl?: string;
  flatExecuteUrl?: string;
  dynamicGroupsUrl?: string;
};

export const GroupImportWizard: React.FC<GroupImportWizardProps> = ({
  analyzeUrl = "/api/data-import/groups/analyze",
  executeUrl = "/api/data-import/groups/execute",
  batchesUrl = "/api/data-import/groups/batches",
  parseUrl = "/admin/data-import/parse-preview",
  validateUrl = "/admin/data-import/validate",
  flatExecuteUrl = "/admin/data-import/execute",
  dynamicGroupsUrl = "/dynamic-group",
}) => {
  const isMobile = useIsMobile();
  const [mode, setMode] = useState<"teaching" | "flat">("teaching");
  const [step, setStep] = useState(1);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [year, setYear] = useState("2026/27");
  const [form, setForm] = useState("F5");
  const [groups, setGroups] = useState<GroupPreview[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [matrixFiles, setMatrixFiles] = useState<Array<{ filename: string; message?: string }>>([]);
  const [seatPreview, setSeatPreview] = useState<{ matched: number; missing: number; samples?: string[] } | null>(null);
  const [totals, setTotals] = useState({ groups: 0, memberships: 0 });
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [batches, setBatches] = useState<Array<Record<string, unknown>>>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Flat fallback
  const [flatMappings, setFlatMappings] = useState<Array<{ csvHeader: string; targetField: string }>>([]);
  const [flatSummary, setFlatSummary] = useState<Record<string, unknown> | null>(null);
  const [flatDone, setFlatDone] = useState<Record<string, unknown> | null>(null);

  const loadBatches = useCallback(async () => {
    try {
      const res = await fetch(batchesUrl, { credentials: "include", headers: { Accept: "application/json" } });
      const json = await res.json();
      if (json?.ok) setBatches(json.batches || []);
    } catch { /* ignore */ }
  }, [batchesUrl]);

  useEffect(() => { void loadBatches(); }, [loadBatches]);

  const card: React.CSSProperties = {
    background: "#fff", border: `1px solid ${C.border}`, borderRadius: ERP.radius.lg,
    padding: isMobile ? 14 : 18, fontFamily: F,
  };

  const analyzeFiles = async (list: File[]) => {
    if (!list.length) return;
    setFiles(list);
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const fd = new FormData();
      list.forEach((f) => fd.append("files[]", f));
      fd.append("academic_year", year);
      const res = await fetch(analyzeUrl, { method: "POST", credentials: "include", body: fd });
      const json = await res.json();
      if (!json?.ok) {
        setError(json?.message || "分析失敗");
        return;
      }
      setGroups(json.groups || []);
      setWarnings(json.warnings || []);
      setMatrixFiles(json.matrix_files || []);
      setSeatPreview(json.seat_preview || null);
      setTotals({
        groups: Number(json.total_groups || 0),
        memberships: Number(json.total_memberships || 0),
      });
      if (json.academic_year_hint) setYear(json.academic_year_hint);
      setStep(1);
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  };

  const onExecute = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(executeUrl, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ academic_year: year, form }),
      });
      const json = await res.json();
      if (!json?.ok) {
        setError(json?.message || "匯入失敗");
        return;
      }
      setResult(json);
      setStep(4);
      void loadBatches();
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  };

  const onFlatFile = async (f: File | null) => {
    if (!f) return;
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", f);
      fd.append("module", "classes");
      const res = await fetch(parseUrl, { method: "POST", credentials: "include", body: fd });
      const json = await res.json();
      if (!json?.ok) {
        setError(json?.message || "解析失敗");
        return;
      }
      setFlatMappings((json.mapping || []).map((m: any) => ({
        csvHeader: m.csvHeader || "",
        targetField: m.targetField || "ignore",
      })));
      setFlatDone(null);
      setFlatSummary(null);
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  };

  const onFlatValidate = async () => {
    setBusy(true);
    try {
      const mapping = flatMappings.map((m) => ({ csvHeader: m.csvHeader, targetField: m.targetField || "ignore" }));
      const res = await fetch(validateUrl, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ module: "classes", mapping }),
      });
      const json = await res.json();
      if (!json?.ok) { setError(json?.message || "校驗失敗"); return; }
      setFlatSummary(json);
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  };

  const onFlatExecute = async () => {
    setBusy(true);
    try {
      const res = await fetch(flatExecuteUrl, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ module: "classes", academic_year: year }),
      });
      const json = await res.json();
      if (!json?.ok) { setError(json?.message || "寫入失敗"); return; }
      setFlatDone(json);
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  };

  const typeColor = (t?: string) => {
    if (t === "streaming") return { bg: "#DBEAFE", color: "#1D4ED8" };
    if (t === "apl") return { bg: "#FCE7F3", color: "#9D174D" };
    return { bg: "#EDE9FE", color: "#6D28D9" };
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, fontFamily: F }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        {mode === "teaching" && (
          <WizardStepper
            step={step}
            maxReachable={step}
            onJump={(n) => setStep(n)}
            steps={[
              { n: 1, label: "1 上傳與學年" },
              { n: 2, label: "2 分組總覽" },
              { n: 3, label: "3 座位解析" },
              { n: 4, label: "4 完成報告" },
            ]}
          />
        )}
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          <button type="button" onClick={() => setMode("teaching")}
            style={{
              fontSize: 11, fontWeight: 700, padding: "5px 10px", borderRadius: 8, cursor: "pointer",
              border: `1px solid ${mode === "teaching" ? C.accent : C.border}`,
              background: mode === "teaching" ? C.accent : "#fff",
              color: mode === "teaching" ? "#fff" : C.textSecondary,
            }}>教學分組 XLSX</button>
          <button type="button" onClick={() => setMode("flat")}
            style={{
              fontSize: 11, fontWeight: 700, padding: "5px 10px", borderRadius: 8, cursor: "pointer",
              border: `1px solid ${mode === "flat" ? C.accent : C.border}`,
              background: mode === "flat" ? C.accent : "#fff",
              color: mode === "flat" ? "#fff" : C.textSecondary,
            }}>標準平鋪 CSV</button>
          <button type="button" onClick={() => setShowHistory((v) => !v)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              border: `1px solid ${C.border}`, background: "#fff", borderRadius: 8, padding: "5px 10px",
              fontSize: 11, fontWeight: 600, cursor: "pointer", color: C.textSecondary,
            }}>
            <History size={14} /> 歷史批次
          </button>
        </div>
      </div>

      {error && (
        <div style={{ ...card, background: "#FEF2F2", borderColor: "#FECACA", color: "#B91C1C", fontSize: 13, display: "flex", gap: 8 }}>
          <AlertTriangle size={16} /> <span>{error}</span>
        </div>
      )}

      {showHistory && (
        <div style={card}>
          <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 10 }}>歷史教學分組匯入批次</div>
          {batches.length === 0 ? (
            <div style={{ fontSize: 12, color: C.textMuted }}>尚無批次</div>
          ) : batches.slice(0, 12).map((b) => (
            <div key={String(b.id)} style={{
              display: "flex", flexWrap: "wrap", gap: 8, padding: "8px 10px", marginBottom: 6,
              borderRadius: 8, background: "#F8FAFC", border: `1px solid ${C.border}`, fontSize: 12,
            }}>
              <span style={{ fontFamily: ERP.font.mono }}>#{String(b.id)}</span>
              <strong>{String(b.academic_year)}</strong>
              <span>{String(b.form || "")}</span>
              <span>分組 {String(b.groups_upserted)} · 成員 {String(b.memberships_written)}</span>
            </div>
          ))}
        </div>
      )}

      {mode === "teaching" && (
        <>
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={card}>
                <div style={{ fontWeight: 800, marginBottom: 8 }}>Step 1 · 上傳檔案與學年鎖定</div>
                <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 10 }}>
                  可一次拖放多個計分紙（中文 / 數學 / 英文 / 選修科）。系統會自動略過《修讀科目總表》矩陣檔。
                </div>
                <FileDropZone
                  accept=".xlsx,.xls"
                  multiple
                  busy={busy}
                  label={files.length ? `已選 ${files.length} 個檔案` : "拖放或點擊上傳一個或多個 .xlsx"}
                  hint="可一次拖放多個計分紙 · .xlsx / .xls"
                  icon={<UploadCloud size={28} color={C.accent} />}
                  onFiles={(picked) => void analyzeFiles(picked)}
                />
                {files.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                    {files.map((f) => (
                      <span key={f.name} style={{
                        fontSize: 11, padding: "4px 8px", borderRadius: 999,
                        background: "#EFF6FF", border: "1px solid #BFDBFE", color: "#1D4ED8",
                      }}>{f.name}</span>
                    ))}
                  </div>
                )}
                {busy && <div style={{ marginTop: 8, fontSize: 12, color: C.textMuted }}><RefreshCw size={12} style={{ display: "inline" }} /> 分析中…</div>}
              </div>

              <div style={{ ...card, background: "#EFF6FF", borderColor: "#BFDBFE" }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 800, fontSize: 13, color: "#1D4ED8" }}>
                  <Shield size={16} /> 🔒 {year} 教學分組將與 2025/26 現行 Demo 分組完全隔離
                </div>
                <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
                  <label style={{ fontSize: 12, fontWeight: 700 }}>目標學年</label>
                  <select value={year} onChange={(e) => setYear(e.target.value)}
                    style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13 }}>
                    <option value="2023/24">2023/24</option>
                    <option value="2024/25">2024/25</option>
                    <option value="2025/26">2025/26（慎用 · Demo）</option>
                    <option value="2026/27">2026/27</option>
                  </select>
                  <label style={{ fontSize: 12, fontWeight: 700 }}>年級</label>
                  <select value={form} onChange={(e) => setForm(e.target.value)}
                    style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13 }}>
                    {["F1", "F2", "F3", "F4", "F5", "F6"].map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>

              {matrixFiles.length > 0 && (
                <div style={{ ...card, background: "#FFFBEB", borderColor: "#FDE68A", color: "#92400E", fontSize: 12 }}>
                  <div style={{ display: "flex", gap: 8, fontWeight: 800 }}><Info size={16} /> 矩陣檔僅供參考（已排除）</div>
                  {matrixFiles.map((m) => (
                    <div key={m.filename} style={{ marginTop: 6 }}>{m.filename} — {m.message || "修讀科目總表"}</div>
                  ))}
                </div>
              )}

              {groups.length > 0 && (
                <WizardActionBar
                  onNext={() => setStep(2)}
                  nextLabel={`下一步：分組總覽 (${totals.groups})`}
                  onConfirm={() => void onExecute()}
                  confirmLabel="🚀 立即確認匯入"
                  confirmBusy={busy}
                  confirmDisabled={busy || totals.groups === 0}
                />
              )}
            </div>
          )}

          {step === 2 && (
            <div style={card}>
              <div style={{ fontWeight: 800, marginBottom: 10 }}>Step 2 · 偵測分組總覽</div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: "#F8FAFC", textAlign: "left" }}>
                      {["組別名稱", "來源", "類型", "科目", "老師", "課室", "MOI", "人數"].map((h) => (
                        <th key={h} style={{ padding: "8px 6px", borderBottom: `1px solid ${C.border}`, whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {groups.map((g) => {
                      const tc = typeColor(g.group_type);
                      return (
                        <tr key={g.name + (g.source_filename || "")}>
                          <td style={{ padding: "8px 6px", fontWeight: 700 }}>{g.name}</td>
                          <td style={{ padding: "8px 6px", color: C.textMuted, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis" }}>
                            {g.source_filename || "—"}
                          </td>
                          <td style={{ padding: "8px 6px" }}>
                            <span style={{
                              fontSize: 10, fontWeight: 800, padding: "2px 7px", borderRadius: 999,
                              background: tc.bg, color: tc.color,
                            }}>{g.group_type || "—"}</span>
                          </td>
                          <td style={{ padding: "8px 6px" }}>{g.subject_code || g.subject_area || "—"}</td>
                          <td style={{ padding: "8px 6px" }}>{g.teacher_text || "—"}</td>
                          <td style={{ padding: "8px 6px", maxWidth: 160 }}>{g.room || "—"}</td>
                          <td style={{ padding: "8px 6px" }}>{g.moi || "—"}</td>
                          <td style={{ padding: "8px 6px" }}>{g.member_count ?? 0}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <WizardActionBar
                onBack={() => setStep(1)}
                onNext={() => setStep(3)}
                nextLabel="下一步：座位解析"
                onConfirm={() => void onExecute()}
                confirmLabel="🚀 立即確認匯入"
                confirmBusy={busy}
                confirmDisabled={busy || totals.groups === 0}
              />
            </div>
          )}

          {step === 3 && (
            <div style={card}>
              <div style={{ fontWeight: 800, marginBottom: 10 }}>Step 3 · 座位解析預覽</div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 10, marginBottom: 12 }}>
                {[
                  ["偵測分組數", String(totals.groups)],
                  ["總成員人次", String(totals.memberships)],
                  ["座位匹配成功", String(seatPreview?.matched ?? "—")],
                  ["缺漏座位數", String(seatPreview?.missing ?? "—")],
                ].map(([k, v]) => (
                  <div key={k} style={{ background: "#F8FAFC", borderRadius: 8, padding: 12, border: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: 10, color: C.textMuted }}>{k}</div>
                    <div style={{ fontSize: 20, fontWeight: 800 }}>{v}</div>
                  </div>
                ))}
              </div>
              {(seatPreview?.missing ?? 0) > 0 && (
                <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: 10, fontSize: 12, color: "#B91C1C", marginBottom: 10 }}>
                  有座位未能對應至 {year} 學生年籍。請先完成 Step 1 學生名冊匯入。
                  {seatPreview?.samples?.length ? (
                    <div style={{ marginTop: 4, fontFamily: ERP.font.mono }}>例：{seatPreview.samples.join(", ")}</div>
                  ) : null}
                </div>
              )}
              <WizardActionBar
                onBack={() => setStep(2)}
                onConfirm={() => void onExecute()}
                confirmLabel="🚀 確認寫入資料庫"
                confirmBusy={busy}
                confirmDisabled={busy || totals.groups === 0}
              />
            </div>
          )}

          {step === 4 && result && (
            <div style={card}>
              <div style={{ fontWeight: 800, color: "#15803D", display: "flex", gap: 8, alignItems: "center" }}>
                <CheckCircle2 size={18} /> 匯入完成
              </div>
              <div style={{ fontSize: 13, marginTop: 8 }}>
                批次 #{String(result.batch_id)} · 分組 {String((result.summary as any)?.groups_upserted ?? "")} ·
                成員 {String((result.summary as any)?.memberships_written ?? "")} ·
                缺漏 {String((result.summary as any)?.missing_seats ?? 0)}
              </div>
              <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <a href={`${dynamicGroupsUrl}?year=${encodeURIComponent(year)}`}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px",
                    borderRadius: 8, background: C.primary, color: "#fff", fontWeight: 700, fontSize: 13, textDecoration: "none",
                  }}>
                  前往動態分組管理 ({year}) <ExternalLink size={14} />
                </a>
                <button type="button" onClick={() => setShowHistory(true)}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 12px",
                    borderRadius: 8, border: `1px solid ${C.border}`, background: "#fff", fontSize: 12, cursor: "pointer",
                  }}>
                  <History size={14} /> 歷史批次
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {mode === "flat" && (
        <div style={card}>
          <div style={{ fontWeight: 800, marginBottom: 8, display: "flex", gap: 8, alignItems: "center" }}>
            <Layers size={16} /> 標準平鋪 CSV / XLSX（WebSAMS）
          </div>
          <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 10 }}>
            需含學號欄。目標學年：<strong>{year}</strong>
          </div>
          <FileDropZone
            accept=".csv,.xlsx,.xls"
            busy={busy}
            label="上傳平鋪名冊"
            hint="支援 .csv · .xls · .xlsx"
            icon={<UploadCloud size={22} color={C.accent} />}
            style={{ padding: 20 }}
            onFiles={(picked) => void onFlatFile(picked[0] || null)}
          />
          {flatMappings.length > 0 && (
            <>
              <div style={{ maxHeight: 220, overflow: "auto", marginTop: 10 }}>
                {flatMappings.map((m, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, fontSize: 12, padding: "4px 0", borderBottom: `1px solid ${C.border}` }}>
                    <span style={{ flex: 1 }}>{m.csvHeader}</span>
                    <select value={m.targetField} onChange={(e) => {
                      const v = e.target.value;
                      setFlatMappings((prev) => prev.map((x, j) => j === i ? { ...x, targetField: v } : x));
                    }} style={{ padding: "4px 6px", borderRadius: 6, border: `1px solid ${C.border}` }}>
                      {["ignore", "student_code", "academic_year", "group_name", "group_type", "class_no"].map((k) => (
                        <option key={k} value={k}>{k}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button type="button" disabled={busy} onClick={() => void onFlatValidate()}
                  style={{ padding: "8px 12px", borderRadius: 8, border: "none", background: C.primary, color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                  校驗
                </button>
                {flatSummary && (
                  <button type="button" disabled={busy} onClick={() => void onFlatExecute()}
                    style={{ padding: "8px 12px", borderRadius: 8, border: "none", background: "#15803D", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                    寫入資料庫
                  </button>
                )}
              </div>
              {flatDone && (
                <div style={{ marginTop: 10, fontSize: 12, color: "#15803D" }}>
                  完成：新增 {String(flatDone.inserted ?? 0)} · 更新 {String(flatDone.updated ?? 0)} · 略過 {String(flatDone.skipped ?? 0)}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
