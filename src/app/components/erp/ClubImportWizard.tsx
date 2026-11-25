// 4-Step eClass Club Membership Import Wizard
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  UploadCloud, CheckCircle2, AlertTriangle,
  RefreshCw, History, Shield, Users, Award, Layers,
} from "lucide-react";
import { ERP } from "./erpTokens";
import { useIsMobile } from "./erpResponsive";
import { FileDropZone } from "./FileDropZone";
import { WizardActionBar, WizardStepper, wizardPrimaryBtn } from "./ImportWizardChrome";
import {
  ContinueImportButton,
  ImportBatchQueuePanel,
  SessionImportLedger,
  WrongModuleBanner,
} from "./ImportBatchExtras";
import {
  MODULE_LABELS,
  parseFetchJson,
  type ImportModuleId,
  type SessionImportEntry,
} from "./importUxShared";
import { useImportBatchQueue } from "./useImportBatchQueue";

const F = ERP.font.family;
const C = ERP.colors;
const MODULE: ImportModuleId = "clubs";
const MODULE_LABEL = MODULE_LABELS.clubs;

type RolePreview = { role_raw: string; tier_code: string; count: number };
type Stats = {
  total_rows: number; unique_students: number; existing_students: number; missing_students: number;
  blank_club_rows: number; multi_row_students: number;
  merit_rows: number; minor_merit_rows: number; major_merit_rows: number;
};
type ClubOpt = { id: number; label: string };
type Mapping = Record<string, number>;

const TIER_STYLE: Record<string, { bg: string; color: string }> = {
  T4: { bg: "#FEF3C7", color: "#B45309" },
  T3: { bg: "#EDE9FE", color: "#6D28D9" },
  T2: { bg: "#DBEAFE", color: "#1D4ED8" },
  T1: { bg: "#F1F5F9", color: "#475569" },
};

export type ClubImportWizardProps = {
  analyzeUrl?: string;
  executeUrl?: string;
  batchesUrl?: string;
  academicYear?: string;
  onAcademicYearChange?: (y: string) => void;
  seedFiles?: File[];
  seedNonce?: number;
  onSeedConsumed?: () => void;
  onRequestTransfer?: (target: ImportModuleId, files: File[]) => void;
  onImportLogged?: (entry: Omit<SessionImportEntry, "id" | "at">) => void;
  ledger?: SessionImportEntry[];
};

export const ClubImportWizard: React.FC<ClubImportWizardProps> = ({
  analyzeUrl = "/api/data-import/clubs/analyze",
  executeUrl = "/api/data-import/clubs/execute",
  batchesUrl = "/api/data-import/clubs/batches",
  academicYear,
  onAcademicYearChange,
  seedFiles,
  seedNonce,
  onSeedConsumed,
  onRequestTransfer,
  onImportLogged,
  ledger = [],
}) => {
  const isMobile = useIsMobile();
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [year, setYear] = useState(academicYear || "2024/25");
  const [strategy, setStrategy] = useState<"stage_unassigned" | "assign_single_club" | "skip_blank">("stage_unassigned");
  const [targetClubId, setTargetClubId] = useState<number | "">("");
  const [newClubName, setNewClubName] = useState("");
  const [autoCreate, setAutoCreate] = useState(true);
  const [syncMerits, setSyncMerits] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [roles, setRoles] = useState<RolePreview[]>([]);
  const [mapping, setMapping] = useState<Mapping>({});
  const [headers, setHeaders] = useState<string[]>([]);
  const [clubs, setClubs] = useState<ClubOpt[]>([]);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [batches, setBatches] = useState<Array<Record<string, unknown>>>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [assignClubId, setAssignClubId] = useState<number | "">("");
  const [assignBatchId, setAssignBatchId] = useState<number | null>(null);

  useEffect(() => {
    if (academicYear && academicYear !== year) setYear(academicYear);
  }, [academicYear]); // eslint-disable-line react-hooks/exhaustive-deps

  const setYearBoth = (y: string) => {
    setYear(y);
    onAcademicYearChange?.(y);
  };

  const applyPreview = useCallback((json: Record<string, unknown>) => {
    setStats((json.stats_preview as Stats) || null);
    setRoles((json.role_preview as RolePreview[]) || []);
    setMapping((json.mapping as Mapping) || {});
    setHeaders((json.headers as string[]) || []);
    setClubs((json.clubs as ClubOpt[]) || []);
    if (json.suggest_stage_unassigned) setStrategy("stage_unassigned");
  }, []);

  const analyzeFile = useCallback(async (f: File) => {
    const fd = new FormData();
    fd.append("file", f);
    const res = await fetch(analyzeUrl, { method: "POST", credentials: "include", body: fd });
    return parseFetchJson(res);
  }, [analyzeUrl]);

  const executeImport = useCallback(async () => {
    const body: Record<string, unknown> = {
      academic_year: year,
      club_strategy: strategy,
      auto_create_students: autoCreate,
      sync_merits: syncMerits,
    };
    if (strategy === "assign_single_club") {
      if (targetClubId !== "") body.target_club_id = targetClubId;
      if (newClubName.trim()) body.new_club_name = newClubName.trim();
    }
    const res = await fetch(executeUrl, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });
    return parseFetchJson(res);
  }, [executeUrl, year, strategy, autoCreate, syncMerits, targetClubId, newClubName]);

  const batch = useImportBatchQueue({
    module: MODULE,
    moduleLabel: MODULE_LABEL,
    academicYear: year,
    analyze: analyzeFile,
    execute: executeImport,
    summarize: (json) => {
      const sp = (json.stats_preview || json.summary || {}) as Record<string, unknown>;
      const rows = sp.total_rows ?? sp.staged_rows_written ?? "";
      return rows !== "" ? `${Number(rows).toLocaleString()} 筆` : "就緒";
    },
    applyPreview,
    onImportLogged,
    seedFiles,
    seedNonce,
    onSeedConsumed,
  });

  const busy = batch.busy;

  const loadBatches = useCallback(async () => {
    try {
      const res = await fetch(batchesUrl, { credentials: "include", headers: { Accept: "application/json" } });
      const json = await parseFetchJson(res);
      if (json?.ok) setBatches((json.batches as Array<Record<string, unknown>>) || []);
    } catch { /* ignore */ }
  }, [batchesUrl]);

  useEffect(() => { void loadBatches(); }, [loadBatches]);

  useEffect(() => {
    if (batch.queue.length === 1) setFile(batch.queue[0].file);
  }, [batch.queue]);

  const onExecute = async () => {
    setError(null);
    if (batch.queue.length > 1) {
      const last = await batch.importSequential();
      if (last) {
        setResult(last);
        setStep(4);
        void loadBatches();
      }
      return;
    }
    batch.setBusy(true);
    try {
      if (batch.queue[0]) {
        const analyzed = await analyzeFile(batch.queue[0].file);
        if (!analyzed?.ok) {
          setError(String(analyzed?.message || "分析失敗"));
          return;
        }
        applyPreview(analyzed);
      }
      const json = await executeImport();
      if (!json?.ok) {
        setError(String(json?.message || "匯入失敗"));
        return;
      }
      setResult(json);
      setStep(4);
      void loadBatches();
      if (batch.queue[0]) {
        onImportLogged?.({
          filename: batch.queue[0].file.name,
          module: MODULE,
          moduleLabel: MODULE_LABEL,
          academicYear: year,
          batchId: json.batch_id as string | number | undefined,
          summary: `${(json.summary as any)?.staged_rows_written ?? stats?.total_rows ?? "?"} 筆`,
        });
      }
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      batch.setBusy(false);
    }
  };

  const continueImporting = () => {
    batch.clearQueue();
    setFile(null);
    setStats(null);
    setResult(null);
    setError(null);
    setStep(1);
  };

  const onAssignClub = async () => {
    if (!assignBatchId || assignClubId === "") return;
    batch.setBusy(true);
    try {
      const res = await fetch(`${batchesUrl}/${assignBatchId}/assign-club`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ club_id: assignClubId }),
      });
      const json = await parseFetchJson(res);
      if (!json?.ok) {
        setError(String(json?.message || "指派失敗"));
        return;
      }
      void loadBatches();
      setAssignBatchId(null);
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      batch.setBusy(false);
    }
  };

  const mapLabels = useMemo(() => {
    const inv: Record<number, string> = {};
    Object.entries(mapping).forEach(([k, v]) => { inv[v as number] = k; });
    return headers.map((h, i) => ({ header: h, target: inv[i] || "—" }));
  }, [headers, mapping]);

  const card: React.CSSProperties = {
    background: "#fff", border: `1px solid ${C.border}`, borderRadius: ERP.radius.lg,
    padding: isMobile ? 14 : 18, fontFamily: F,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, fontFamily: F }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <WizardStepper
          step={step}
          maxReachable={Math.max(step, 1)}
          onJump={(n) => setStep(n)}
          steps={[
            { n: 1, label: "1 上傳與上下文" },
            { n: 2, label: "2 欄位與層級" },
            { n: 3, label: "3 預覽確認" },
            { n: 4, label: "4 完成報告" },
          ]}
        />
        <button type="button" onClick={() => setShowHistory((v) => !v)} style={{
          marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 6,
          border: `1px solid ${C.border}`, background: "#fff", borderRadius: 8, padding: "6px 10px",
          fontSize: 12, fontWeight: 600, cursor: "pointer", color: C.textSecondary,
        }}>
          <History size={14} /> 歷史批次
        </button>
      </div>

      {error && (
        <div style={{ ...card, background: "#FEF2F2", borderColor: "#FECACA", color: "#B91C1C", fontSize: 13, display: "flex", gap: 8, alignItems: "flex-start" }}>
          <AlertTriangle size={16} /> <span>{error}</span>
        </div>
      )}

      {batch.wrongHint && (
        <WrongModuleBanner
          hint={batch.wrongHint}
          onTransfer={() => {
            onRequestTransfer?.(batch.wrongHint!.target, batch.pendingWrongFiles);
            batch.clearQueue();
          }}
          onDismiss={batch.dismissWrong}
        />
      )}

      {showHistory && (
        <div style={card}>
          <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 10 }}>歷史匯入批次</div>
          {batches.length === 0 ? (
            <div style={{ fontSize: 12, color: C.textMuted }}>尚無批次</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {batches.slice(0, 12).map((b) => (
                <div key={String(b.id)} style={{
                  display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center",
                  padding: "8px 10px", borderRadius: 8, background: "#F8FAFC", border: `1px solid ${C.border}`,
                }}>
                  <span style={{ fontFamily: ERP.font.mono, fontSize: 11 }}>#{String(b.id)}</span>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>{String(b.academic_year)}</span>
                  <span style={{ fontSize: 11, color: C.textMuted }}>{String(b.club_strategy)}</span>
                  <span style={{ fontSize: 11 }}>{String(b.staged_rows_written || 0)} 列 · stub {String(b.stubs_created || 0)}</span>
                  {String(b.club_strategy) === "stage_unassigned" && (
                    <button type="button" onClick={() => { setAssignBatchId(Number(b.id)); setAssignClubId(""); }}
                      style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, border: `1px solid ${C.border}`, background: "#fff", borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}>
                      指派學會
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          {assignBatchId != null && (
            <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 12 }}>批次 #{assignBatchId} →</span>
              <select value={assignClubId === "" ? "" : String(assignClubId)} onChange={(e) => setAssignClubId(e.target.value ? Number(e.target.value) : "")}
                style={{ padding: "6px 8px", borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 12 }}>
                <option value="">選擇學會…</option>
                {clubs.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
              <button type="button" disabled={busy || assignClubId === ""} onClick={() => void onAssignClub()}
                style={{ padding: "6px 12px", borderRadius: 6, border: "none", background: C.primary, color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                確認指派
              </button>
            </div>
          )}
        </div>
      )}

      {step === 1 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={card}>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>Step 1 · 上傳檔案與匯入上下文</div>
            <FileDropZone
              accept=".csv,.xlsx,.xls"
              multiple
              busy={busy}
              label={batch.queue.length ? `已選 ${batch.queue.length} 個檔案（可繼續追加）` : "拖放或點擊上傳 club_member_list"}
              hint="支援多檔 · .csv · .xls · .xlsx · 每檔獨立 Batch ID"
              icon={<UploadCloud size={28} color={C.accent} />}
              onFiles={(picked) => {
                setResult(null);
                setError(null);
                setStep(1);
                batch.enqueueFiles(picked);
              }}
            />
            <ImportBatchQueuePanel
              items={batch.queue}
              busy={busy}
              progressLabel={batch.progressLabel}
              progressPct={batch.progressPct}
              onRemove={(id) => batch.setQueue((prev) => prev.filter((q) => q.id !== id))}
              onPreviewAll={batch.queue.length > 0 ? () => void batch.previewAll() : undefined}
              onImportAll={batch.queue.length > 0 ? () => void onExecute() : undefined}
              onRetry={(id) => void batch.importSequential([id]).then((last) => {
                if (last) { setResult(last); setStep(4); void loadBatches(); }
              })}
            />
            {busy && !batch.progressLabel && <div style={{ marginTop: 8, fontSize: 12, color: C.textMuted }}><RefreshCw size={12} style={{ display: "inline" }} /> 分析中…</div>}
          </div>

          <SessionImportLedger entries={ledger} moduleFilter={MODULE} />

          <div style={{ ...card, background: "#EFF6FF", borderColor: "#BFDBFE" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 800, fontSize: 13, color: "#1D4ED8" }}>
              <Shield size={16} /> 🔒 歷史學會紀錄將與 2025/26 現行 Demo 資料完全隔離
            </div>
            <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
              <label style={{ fontSize: 12, fontWeight: 700 }}>目標學年</label>
              <select value={year} onChange={(e) => setYearBoth(e.target.value)} style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13 }}>
                <option value="2023/24">2023/24</option>
                <option value="2024/25">2024/25</option>
                <option value="2025/26">2025/26（慎用 · Demo）</option>
                <option value="2026/27">2026/27</option>
              </select>
            </div>
          </div>

          {stats && (
            <>
              <div style={card}>
                <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 8 }}>學會名稱缺失處理策略</div>
                {(
                  [
                    ["stage_unassigned", `匯入至暫存／待歸類明細批次（完整保留全部 ${stats.total_rows} 筆多列職位、成就與優點，待日後補回學會名再歸戶）`],
                    ["assign_single_club", "全部指派給指定學會"],
                    ["skip_blank", "略過沒有學會名稱的列"],
                  ] as const
                ).map(([val, label]) => (
                  <label key={val} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12, marginBottom: 8, cursor: "pointer" }}>
                    <input type="radio" name="club_strategy" checked={strategy === val} onChange={() => setStrategy(val)} />
                    <span>{label}</span>
                  </label>
                ))}
                {strategy === "assign_single_club" && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
                    <select value={targetClubId === "" ? "" : String(targetClubId)} onChange={(e) => setTargetClubId(e.target.value ? Number(e.target.value) : "")}
                      style={{ padding: "6px 8px", borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 12, minWidth: 180 }}>
                      <option value="">選擇既有學會…</option>
                      {clubs.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                    <input value={newClubName} onChange={(e) => setNewClubName(e.target.value)} placeholder="或新建學會名稱"
                      style={{ padding: "6px 8px", borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 12, minWidth: 160 }} />
                  </div>
                )}
              </div>

              <div style={card}>
                <label style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12, cursor: "pointer" }}>
                  <input type="checkbox" checked={autoCreate} onChange={(e) => setAutoCreate(e.target.checked)} />
                  <span>
                    <strong>自動以學生編號建立留空占位學生</strong>（姓名與班別留空，日後由名冊後補）
                    <div style={{ marginTop: 4, color: C.textSecondary }}>
                      偵測到 {stats.unique_students} 位學生：{stats.existing_students} 位已存在，{stats.missing_students} 位將建立留空占位檔案
                    </div>
                  </span>
                </label>
                <label style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12, cursor: "pointer", marginTop: 12 }}>
                  <input type="checkbox" checked={syncMerits} onChange={(e) => setSyncMerits(e.target.checked)} />
                  <span>
                    將 Merit (優點) / Minor Merit (小功) / Major Merit (大功) 同步寫入學生品行紀錄
                    <div style={{ marginTop: 4, color: C.textSecondary }}>
                      偵測到 {stats.merit_rows} / {stats.minor_merit_rows} / {stats.major_merit_rows} 筆有值列
                    </div>
                  </span>
                </label>
              </div>
            </>
          )}

          {stats && (
            <WizardActionBar
              onNext={() => setStep(2)}
              nextLabel="下一步：檢視預覽"
              nextDisabled={!stats}
              onConfirm={() => void onExecute()}
              confirmLabel="🚀 立即確認匯入"
              confirmBusy={busy}
              confirmDisabled={!stats || busy}
            />
          )}
        </div>
      )}

      {step === 2 && stats && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={card}>
            <div style={{ fontWeight: 800, marginBottom: 10 }}>Step 2 · 欄位映射</div>
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
            <div style={{ fontWeight: 800, marginBottom: 10 }}>職位層級預覽（T1–T4）</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 280, overflow: "auto" }}>
              {roles.slice(0, 40).map((r) => {
                const st = TIER_STYLE[r.tier_code] || TIER_STYLE.T1;
                return (
                  <div key={r.role_raw + r.tier_code} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12 }}>
                    <span style={{ padding: "2px 8px", borderRadius: 999, background: st.bg, color: st.color, fontWeight: 800 }}>{r.tier_code}</span>
                    <span style={{ fontWeight: 600 }}>{r.role_raw || "（空白）"}</span>
                    <span style={{ marginLeft: "auto", color: C.textMuted }}>×{r.count}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <WizardActionBar
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
            nextLabel="下一步：預覽確認"
            onConfirm={() => void onExecute()}
            confirmLabel="🚀 立即確認匯入"
            confirmBusy={busy}
            confirmDisabled={busy}
          />
        </div>
      )}

      {step === 3 && stats && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 10 }}>
            {[
              { icon: <Layers size={16} />, label: "總紀錄列數", value: String(stats.total_rows) },
              { icon: <Users size={16} />, label: "涉及學生", value: `${stats.unique_students}（既有 ${stats.existing_students} + 新建 ${stats.missing_students}）` },
              { icon: <Award size={16} />, label: "優點/小功/大功列", value: `${stats.merit_rows} / ${stats.minor_merit_rows} / ${stats.major_merit_rows}` },
              { icon: <Shield size={16} />, label: "目標學年與模式", value: `${year} · ${strategy}` },
            ].map((k) => (
              <div key={k.label} style={{ ...card, padding: 12 }}>
                <div style={{ display: "flex", gap: 6, alignItems: "center", color: C.textMuted, fontSize: 11, fontWeight: 700 }}>{k.icon}{k.label}</div>
                <div style={{ marginTop: 6, fontSize: 14, fontWeight: 800 }}>{k.value}</div>
              </div>
            ))}
          </div>
          {stats.multi_row_students > 0 && (
            <div style={{ ...card, background: "#F0FDF4", borderColor: "#BBF7D0", fontSize: 12, color: "#166534" }}>
              偵測到 {stats.multi_row_students} 位學生擁有多筆紀錄 — 全部明細列將完整保留於 <code>club_import_rows</code>，不會因唯一鍵衝突遺失。
            </div>
          )}
          <WizardActionBar
            onBack={() => setStep(2)}
            onConfirm={() => void onExecute()}
            confirmLabel="🚀 確認寫入資料庫"
            confirmBusy={busy}
            confirmDisabled={busy}
          />
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
            <ContinueImportButton moduleLabel={MODULE_LABEL} onClick={continueImporting} />
            <a href="/clubs" style={linkBtn}>前往學會管理</a>
            <a href="/students" style={linkBtn}>前往學生名冊後補資料</a>
          </div>
          <SessionImportLedger entries={ledger} moduleFilter={MODULE} />
        </div>
      )}
    </div>
  );
};

function navBtn(primary: boolean): React.CSSProperties {
  return primary
    ? wizardPrimaryBtn(false)
    : {
        display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 14px",
        borderRadius: 8, border: `1px solid ${C.border}`,
        background: "#fff", color: C.textSecondary,
        fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: F,
      };
}

const linkBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", padding: "10px 14px", borderRadius: 8,
  border: `1px solid ${C.border}`, background: "#fff", color: C.textSecondary,
  fontWeight: 700, fontSize: 12, textDecoration: "none", fontFamily: F,
};

export default ClubImportWizard;
