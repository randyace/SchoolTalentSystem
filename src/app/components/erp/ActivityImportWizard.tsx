// 4-Step eClass Activity Participant Import Wizard (Step 4)
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  UploadCloud, CheckCircle2, AlertTriangle, ArrowRight, ArrowLeft,
  RefreshCw, History, Shield, Users, Award, Layers, ExternalLink,
} from "lucide-react";
import { ERP } from "./erpTokens";
import { useIsMobile } from "./erpResponsive";

const F = ERP.font.family;
const C = ERP.colors;

type BelongPreview = { tag: string; category: string; acorn_emphasis: string; count: number };
type Stats = {
  total_rows: number; unique_activities: number; unique_students: number;
  existing_students: number; missing_students: number;
  achievement_rows: number; multiline_achievement_rows: number;
  duplicate_pairs: number; duplicate_extra_rows: number;
  merit_rows: number; minor_merit_rows: number; major_merit_rows: number;
  scope_external_hints: number; scope_internal_hints: number;
  demo_activities_same_year: number; demo_enrollments_untagged: number;
};
type Mapping = Record<string, number>;

export type ActivityImportWizardProps = {
  analyzeUrl?: string;
  executeUrl?: string;
  batchesUrl?: string;
  parseUrl?: string;
  validateUrl?: string;
  flatExecuteUrl?: string;
  activitiesUrl?: string;
};

export const ActivityImportWizard: React.FC<ActivityImportWizardProps> = ({
  analyzeUrl = "/api/data-import/activities/analyze",
  executeUrl = "/api/data-import/activities/execute",
  batchesUrl = "/api/data-import/activities/batches",
  parseUrl = "/admin/data-import/parse-preview",
  validateUrl = "/admin/data-import/validate",
  flatExecuteUrl = "/admin/data-import/execute",
  activitiesUrl = "/activities",
}) => {
  const isMobile = useIsMobile();
  const [mode, setMode] = useState<"eclass" | "flat">("eclass");
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [year, setYear] = useState("2025/26");
  const [autoCreate, setAutoCreate] = useState(true);
  const [syncMerits, setSyncMerits] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [belong, setBelong] = useState<BelongPreview[]>([]);
  const [mapping, setMapping] = useState<Mapping>({});
  const [headers, setHeaders] = useState<string[]>([]);
  const [hasDateCol, setHasDateCol] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [batches, setBatches] = useState<Array<Record<string, unknown>>>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [rollingBack, setRollingBack] = useState<number | null>(null);

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
      if (json.is_eclass === false) {
        setMode("flat");
      } else {
        setMode("eclass");
      }
      setStats(json.stats_preview || null);
      setBelong(json.belong_preview || []);
      setMapping(json.mapping || {});
      setHeaders(json.headers || []);
      setHasDateCol(!!json.has_date_column);
      if (json.academic_year_hint) setYear(String(json.academic_year_hint));
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
        body: JSON.stringify({
          academic_year: year,
          auto_create_students: autoCreate,
          sync_merits: syncMerits,
        }),
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

  const onRollback = async (batchId: number) => {
    if (!window.confirm(`確定安全回滾批次 #${batchId}？\n僅刪除此批次標記的活動／報名／品行紀錄，不會影響示範資料。`)) {
      return;
    }
    setRollingBack(batchId);
    setError(null);
    try {
      const res = await fetch(`${batchesUrl}/${batchId}/rollback`, {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      const json = await res.json();
      if (!json?.ok) {
        setError(json?.message || "回滾失敗");
        return;
      }
      void loadBatches();
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setRollingBack(null);
    }
  };

  const onFlatParse = async (f: File | null) => {
    if (!f) return;
    setFile(f);
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("module", "activities");
      fd.append("file", f);
      const res = await fetch(parseUrl, { method: "POST", credentials: "include", body: fd });
      const json = await res.json();
      if (!json?.ok) {
        setError(json?.message || "解析失敗");
        return;
      }
      const maps = (json.mapping || []).map((m: any) => ({
        csvHeader: m.csvHeader || m.header || "",
        targetField: m.targetField || m.target || "",
      }));
      setFlatMappings(maps);
      const vfd = new FormData();
      // validate via JSON
      const vres = await fetch(validateUrl, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ module: "activities", mapping: maps }),
      });
      const vjson = await vres.json();
      setFlatSummary(vjson?.summary || vjson || null);
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
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ module: "activities" }),
      });
      const json = await res.json();
      if (!json?.ok) {
        setError(json?.message || "匯入失敗");
        return;
      }
      setFlatDone(json);
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  };

  const mapLabels = useMemo(() => {
    const inv: Record<number, string> = {};
    Object.entries(mapping).forEach(([k, v]) => { inv[v as number] = k; });
    return headers.map((h, i) => ({ header: h, target: inv[i] || "—" }));
  }, [headers, mapping]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, fontFamily: F }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <button type="button" onClick={() => setMode("eclass")} style={modeBtn(mode === "eclass")}>
          eClass 活動參與匯入
        </button>
        <button type="button" onClick={() => setMode("flat")} style={modeBtn(mode === "flat")}>
          簡易有日期 CSV
        </button>
        {mode === "eclass" && (
          <button type="button" onClick={() => setShowHistory((v) => !v)} style={{
            marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 6,
            border: `1px solid ${C.border}`, background: "#fff", borderRadius: 8, padding: "6px 10px",
            fontSize: 12, fontWeight: 600, cursor: "pointer", color: C.textSecondary,
          }}>
            <History size={14} /> 歷史批次
          </button>
        )}
      </div>

      {error && (
        <div style={{ ...card, background: "#FEF2F2", borderColor: "#FECACA", color: "#B91C1C", fontSize: 13, display: "flex", gap: 8 }}>
          <AlertTriangle size={16} /> <span>{error}</span>
        </div>
      )}

      {mode === "flat" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={card}>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>簡易有日期活動 CSV（舊版 flat 路徑）</div>
            <label style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: 24,
              border: `2px dashed ${C.border}`, borderRadius: ERP.radius.lg, background: "#F8FAFC", cursor: "pointer",
            }}>
              <UploadCloud size={24} color={C.primary} />
              <span style={{ fontSize: 13, fontWeight: 700 }}>{file ? file.name : "上傳含 activity_date 的 CSV"}</span>
              <input type="file" accept=".csv,.xlsx,.xls" hidden onChange={(e) => void onFlatParse(e.target.files?.[0] || null)} />
            </label>
            {flatSummary && (
              <div style={{ marginTop: 12, fontSize: 12 }}>
                <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{JSON.stringify(flatSummary, null, 2)}</pre>
                <button type="button" disabled={busy} onClick={() => void onFlatExecute()} style={{ ...navBtn(true), marginTop: 10 }}>
                  執行舊版匯入
                </button>
              </div>
            )}
            {flatDone && <div style={{ marginTop: 10, color: "#166534", fontWeight: 700 }}>完成 · {JSON.stringify(flatDone)}</div>}
          </div>
        </div>
      )}

      {mode === "eclass" && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {[1, 2, 3, 4].map((n) => (
              <div key={n} style={{
                display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px",
                borderRadius: 999, fontSize: 11, fontWeight: 700,
                background: step === n ? C.primary : step > n ? "#DCFCE7" : "#F1F5F9",
                color: step === n ? "#fff" : step > n ? "#15803D" : C.textMuted,
              }}>
                {step > n ? <CheckCircle2 size={12} /> : n}
                {n === 1 ? "上傳與學年" : n === 2 ? "映射／ACORN" : n === 3 ? "預覽確認" : "完成報告"}
              </div>
            ))}
          </div>

          {showHistory && (
            <div style={card}>
              <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 10 }}>歷史匯入批次</div>
              {batches.length === 0 ? (
                <div style={{ fontSize: 12, color: C.textMuted }}>尚無批次</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {batches.slice(0, 15).map((b) => {
                    const id = Number(b.id);
                    const rolled = String(b.status) === "rolled_back";
                    return (
                      <div key={String(b.id)} style={{
                        display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center",
                        padding: "8px 10px", borderRadius: 8, background: rolled ? "#F8FAFC" : "#FFFBEB",
                        border: `1px solid ${C.border}`, opacity: rolled ? 0.7 : 1,
                      }}>
                        <span style={{ fontFamily: ERP.font.mono, fontSize: 11 }}>#{String(b.id)}</span>
                        <span style={{ fontSize: 12, fontWeight: 700 }}>{String(b.academic_year)}</span>
                        <span style={{ fontSize: 11 }}>{String(b.enrollments_written || 0)} 報名 · {String(b.activities_created || 0)} 活動</span>
                        <span style={{ fontSize: 11, color: C.textMuted }}>{String(b.source_filename || "")}</span>
                        <span style={{ fontSize: 10, fontWeight: 800, color: rolled ? C.textMuted : "#B45309" }}>
                          {rolled ? "已回滾" : "active"}
                        </span>
                        {!rolled && (
                          <button type="button" disabled={rollingBack === id}
                            onClick={() => void onRollback(id)}
                            style={{
                              marginLeft: "auto", fontSize: 11, fontWeight: 700,
                              border: `1px solid #FECACA`, background: "#FEF2F2", color: "#B91C1C",
                              borderRadius: 6, padding: "4px 8px", cursor: "pointer",
                            }}>
                            {rollingBack === id ? "回滾中…" : "↩️ 安全回滾此批次"}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={card}>
                <div style={{ fontWeight: 800, marginBottom: 8 }}>Step 1 · 上傳檔案與學年／同頁共存設定</div>
                <label style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: 28,
                  border: `2px dashed ${C.border}`, borderRadius: ERP.radius.lg, background: "#F8FAFC", cursor: "pointer",
                }}>
                  <UploadCloud size={28} color={C.primary} />
                  <span style={{ fontSize: 13, fontWeight: 700 }}>
                    {file ? file.name : "拖放或點擊上傳 activity_participant_list CSV"}
                  </span>
                  <input type="file" accept=".csv,.xlsx,.xls" hidden onChange={(e) => void onFile(e.target.files?.[0] || null)} />
                </label>
                {busy && <div style={{ marginTop: 8, fontSize: 12, color: C.textMuted }}><RefreshCw size={12} style={{ display: "inline" }} /> 分析中…</div>}
              </div>

              <div style={{ ...card, background: "#FFFBEB", borderColor: "#FDE68A" }}>
                <div style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 13, color: "#92400E", fontWeight: 700 }}>
                  <Shield size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>🛡️ 本批次將以獨立 Batch ID 標記寫入，與現有 2025/26 示範活動完全區隔，隨時支援一鍵安全回滾，不影響既有資料。</span>
                </div>
                <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
                  <label style={{ fontSize: 12, fontWeight: 700 }}>目標學年</label>
                  <select value={year} onChange={(e) => setYear(e.target.value)}
                    style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13 }}>
                    <option value="2024/25">2024/25</option>
                    <option value="2025/26">2025/26（與示範同頁共存）</option>
                    <option value="2026/27">2026/27</option>
                  </select>
                  {stats && (
                    <span style={{ fontSize: 11, color: C.textSecondary }}>
                      現有示範：{stats.demo_activities_same_year} 活動 / {stats.demo_enrollments_untagged} 未標記報名
                    </span>
                  )}
                </div>
              </div>

              {stats && (
                <div style={card}>
                  <label style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12, cursor: "pointer" }}>
                    <input type="checkbox" checked={autoCreate} onChange={(e) => setAutoCreate(e.target.checked)} />
                    <span>
                      <strong>自動以 UserLogin 建立留空占位學生</strong>
                      <div style={{ marginTop: 4, color: C.textSecondary }}>
                        偵測：{stats.existing_students} 位已存在，{stats.missing_students} 位將新建留空檔案
                      </div>
                    </span>
                  </label>
                  <label style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12, cursor: "pointer", marginTop: 12 }}>
                    <input type="checkbox" checked={syncMerits} onChange={(e) => setSyncMerits(e.target.checked)} />
                    <span>
                      將 Merit (優點) / Minor Merit (小功) / Major Merit (大功) 同步寫入學生品行紀錄
                      <div style={{ marginTop: 4, color: C.textSecondary }}>
                        偵測：{stats.merit_rows} / {stats.minor_merit_rows} / {stats.major_merit_rows}
                      </div>
                    </span>
                  </label>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button type="button" disabled={!stats} onClick={() => setStep(2)} style={{
                  ...navBtn(true), background: stats ? C.primary : "#CBD5E1",
                  cursor: stats ? "pointer" : "not-allowed",
                }}>
                  下一步 <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {step === 2 && stats && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={card}>
                <div style={{ fontWeight: 800, marginBottom: 8 }}>Step 2 · 欄位映射</div>
                <div style={{ fontSize: 12, color: "#047857", fontWeight: 700, marginBottom: 8 }}>
                  日期欄選填 — eClass 檔無日期亦可直接匯入{hasDateCol ? "（本檔偵測到日期欄）" : "（本檔無日期欄）"}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 6 }}>
                  {mapLabels.map((m) => (
                    <div key={m.header} style={{ fontSize: 12, padding: "6px 8px", background: "#F8FAFC", borderRadius: 6, border: `1px solid ${C.border}` }}>
                      <span style={{ fontWeight: 700 }}>{m.header}</span>
                      <span style={{ color: C.textMuted }}> → </span>
                      <span style={{ color: m.target === "—" ? C.textMuted : "#15803D", fontWeight: 700 }}>{m.target}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={card}>
                <div style={{ fontWeight: 800, marginBottom: 10 }}>14 類歸屬 → category / ACORN 預設</div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ textAlign: "left", background: "#F8FAFC" }}>
                        {["Belong to Club", "category", "ACORN 重心", "列數"].map((h) => (
                          <th key={h} style={{ padding: "6px 8px", borderBottom: `1px solid ${C.border}` }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {belong.map((b) => (
                        <tr key={b.tag}>
                          <td style={{ padding: "6px 8px", borderBottom: `1px solid ${C.border}` }}>{b.tag}</td>
                          <td style={{ padding: "6px 8px", borderBottom: `1px solid ${C.border}`, fontWeight: 700 }}>{b.category}</td>
                          <td style={{ padding: "6px 8px", borderBottom: `1px solid ${C.border}` }}>{b.acorn_emphasis}</td>
                          <td style={{ padding: "6px 8px", borderBottom: `1px solid ${C.border}` }}>×{b.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ marginTop: 10, fontSize: 12, color: C.textSecondary }}>
                  範圍提示：*校外 {stats.scope_external_hints} · *校內 {stats.scope_internal_hints}
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <button type="button" onClick={() => setStep(1)} style={navBtn(false)}><ArrowLeft size={14} /> 上一步</button>
                <button type="button" onClick={() => setStep(3)} style={navBtn(true)}>下一步 <ArrowRight size={14} /></button>
              </div>
            </div>
          )}

          {step === 3 && stats && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 10 }}>
                {[
                  { icon: <Layers size={16} />, label: "總紀錄列數", value: String(stats.total_rows) },
                  { icon: <Award size={16} />, label: "不重複活動數", value: String(stats.unique_activities) },
                  { icon: <Users size={16} />, label: "涉及學生數", value: `${stats.unique_students}：${stats.existing_students} 既有 + ${stats.missing_students} 新建留空` },
                  { icon: <Shield size={16} />, label: "成就與優點", value: `${stats.achievement_rows} 成就 · ${stats.merit_rows}/${stats.minor_merit_rows}/${stats.major_merit_rows}` },
                ].map((k) => (
                  <div key={k.label} style={{ ...card, padding: 12 }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", color: C.textMuted, fontSize: 11, fontWeight: 700 }}>{k.icon}{k.label}</div>
                    <div style={{ marginTop: 6, fontSize: 13, fontWeight: 800 }}>{k.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ ...card, background: "#F0FDF4", borderColor: "#BBF7D0", fontSize: 12, color: "#166534" }}>
                偵測到 {stats.duplicate_pairs} 組同活動同學生多筆成就（及 {stats.multiline_achievement_rows} 筆多行成就），將 100% 無損保留，不會互相覆蓋。
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                <button type="button" onClick={() => setStep(2)} style={navBtn(false)}><ArrowLeft size={14} /> 上一步</button>
                <button type="button" disabled={busy} onClick={() => void onExecute()} style={{
                  ...navBtn(true), padding: "12px 18px", fontSize: 14, opacity: busy ? 0.7 : 1,
                }}>
                  🚀 確認匯入活動參與紀錄
                </button>
              </div>
            </div>
          )}

          {step === 4 && result && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ ...card, background: "#F0FDF4", borderColor: "#86EFAC" }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 800, color: "#166534" }}>
                  <CheckCircle2 size={18} /> 匯入完成 · Batch #{String((result as any).batch_id)}
                </div>
                <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)", gap: 8, fontSize: 12 }}>
                  {Object.entries(((result as any).summary || {}) as Record<string, unknown>).map(([k, v]) => (
                    <div key={k}><span style={{ color: C.textMuted }}>{k}</span><div style={{ fontWeight: 800 }}>{String(v)}</div></div>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <a href={activitiesUrl} style={linkBtn}><ExternalLink size={12} /> 前往活動名單</a>
                <button type="button" onClick={() => { setStep(1); setFile(null); setStats(null); setResult(null); setBelong([]); }} style={navBtn(false)}>
                  📂 繼續匯入
                </button>
                <button type="button" onClick={() => setShowHistory(true)} style={navBtn(false)}>
                  <History size={14} /> 歷史批次／回滾
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

function modeBtn(on: boolean): React.CSSProperties {
  return {
    display: "inline-flex", alignItems: "center", padding: "6px 12px", borderRadius: 8,
    border: on ? "none" : `1px solid ${C.border}`,
    background: on ? C.primary : "#fff", color: on ? "#fff" : C.textSecondary,
    fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: F,
  };
}

function navBtn(primary: boolean): React.CSSProperties {
  return {
    display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 14px",
    borderRadius: 8, border: primary ? "none" : `1px solid ${C.border}`,
    background: primary ? C.primary : "#fff", color: primary ? "#fff" : C.textSecondary,
    fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: F,
  };
}

const linkBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 14px", borderRadius: 8,
  border: `1px solid ${C.border}`, background: "#fff", color: C.textSecondary,
  fontWeight: 700, fontSize: 12, textDecoration: "none", fontFamily: F,
};

export default ActivityImportWizard;
