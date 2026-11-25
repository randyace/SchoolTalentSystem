// 4-Step multi-workbook Teaching Group / Elective Import Wizard (Step 2)
// Supports multi-file queue, sequential per-file batch_id, continue-import, wrong-module transfer.
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  UploadCloud, CheckCircle2, AlertTriangle, RefreshCw, History, Shield, Layers, ExternalLink, Info,
} from "lucide-react";
import { ERP } from "./erpTokens";
import { useIsMobile } from "./erpResponsive";
import { FileDropZone } from "./FileDropZone";
import { WizardActionBar, WizardStepper } from "./ImportWizardChrome";
import {
  ContinueImportButton,
  ImportBatchQueuePanel,
  SessionImportLedger,
  WrongModuleBanner,
} from "./ImportBatchExtras";
import {
  makeQueuedFiles,
  MODULE_LABELS,
  parseFetchJson,
  wrongModuleHint,
  type ImportModuleId,
  type QueuedImportFile,
  type SessionImportEntry,
  type WrongModuleHint,
} from "./importUxShared";

const F = ERP.font.family;
const C = ERP.colors;
const MODULE: ImportModuleId = "classes";
const MODULE_LABEL = MODULE_LABELS.classes;

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
  academicYear?: string;
  onAcademicYearChange?: (y: string) => void;
  subMode?: string | null;
  onSubModeChange?: (m: string) => void;
  seedFiles?: File[];
  seedNonce?: number;
  onSeedConsumed?: () => void;
  onRequestTransfer?: (target: ImportModuleId, files: File[]) => void;
  onImportLogged?: (entry: Omit<SessionImportEntry, "id" | "at">) => void;
  ledger?: SessionImportEntry[];
};

export const GroupImportWizard: React.FC<GroupImportWizardProps> = ({
  analyzeUrl = "/api/data-import/groups/analyze",
  executeUrl = "/api/data-import/groups/execute",
  batchesUrl = "/api/data-import/groups/batches",
  parseUrl = "/admin/data-import/parse-preview",
  validateUrl = "/admin/data-import/validate",
  flatExecuteUrl = "/admin/data-import/execute",
  dynamicGroupsUrl = "/dynamic-group",
  academicYear,
  onAcademicYearChange,
  subMode,
  onSubModeChange,
  seedFiles,
  seedNonce = 0,
  onSeedConsumed,
  onRequestTransfer,
  onImportLogged,
  ledger = [],
}) => {
  const isMobile = useIsMobile();
  const [mode, setMode] = useState<"teaching" | "flat">(
    subMode === "csv" || subMode === "flat" ? "flat" : "teaching",
  );
  const [step, setStep] = useState(1);
  const [queue, setQueue] = useState<QueuedImportFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [year, setYear] = useState(academicYear || "2026/27");
  const [form, setForm] = useState("F5");
  const [groups, setGroups] = useState<GroupPreview[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [matrixFiles, setMatrixFiles] = useState<Array<{ filename: string; message?: string }>>([]);
  const [seatPreview, setSeatPreview] = useState<{ matched: number; missing: number; samples?: string[] } | null>(null);
  const [totals, setTotals] = useState({ groups: 0, memberships: 0 });
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [batches, setBatches] = useState<Array<Record<string, unknown>>>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [progressLabel, setProgressLabel] = useState<string | null>(null);
  const [progressPct, setProgressPct] = useState(0);
  const [wrongHint, setWrongHint] = useState<WrongModuleHint | null>(null);
  const [pendingWrongFiles, setPendingWrongFiles] = useState<File[]>([]);
  const seedSeen = useRef<number>(-1);
  const autoPreviewId = useRef<string | null>(null);

  const [flatMappings, setFlatMappings] = useState<Array<{ csvHeader: string; targetField: string }>>([]);
  const [flatSummary, setFlatSummary] = useState<Record<string, unknown> | null>(null);
  const [flatDone, setFlatDone] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (academicYear && academicYear !== year) setYear(academicYear);
  }, [academicYear]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!subMode) return;
    if (subMode === "csv" || subMode === "flat") setMode("flat");
    if (subMode === "xlsx" || subMode === "teaching") setMode("teaching");
  }, [subMode]);

  const setYearBoth = (y: string) => {
    setYear(y);
    onAcademicYearChange?.(y);
  };

  const setModeBoth = (m: "teaching" | "flat") => {
    setMode(m);
    onSubModeChange?.(m === "teaching" ? "xlsx" : "csv");
  };

  const loadBatches = useCallback(async () => {
    try {
      const res = await fetch(batchesUrl, { credentials: "include", headers: { Accept: "application/json" } });
      const json = await parseFetchJson(res);
      if (json?.ok) setBatches((json.batches as Array<Record<string, unknown>>) || []);
    } catch { /* ignore */ }
  }, [batchesUrl]);

  useEffect(() => { void loadBatches(); }, [loadBatches]);

  const patchQueue = (id: string, patch: Partial<QueuedImportFile>) => {
    setQueue((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  };

  const analyzeOne = async (file: File): Promise<Record<string, unknown>> => {
    const fd = new FormData();
    fd.append("files[]", file);
    fd.append("academic_year", year);
    const res = await fetch(analyzeUrl, { method: "POST", credentials: "include", body: fd });
    return parseFetchJson(res);
  };

  const executeCurrentSession = async (): Promise<Record<string, unknown>> => {
    const res = await fetch(executeUrl, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ academic_year: year, form }),
    });
    return parseFetchJson(res);
  };

  const applyPreviewJson = (json: Record<string, unknown>) => {
    setGroups((json.groups as GroupPreview[]) || []);
    setWarnings((json.warnings as string[]) || []);
    setMatrixFiles((json.matrix_files as Array<{ filename: string; message?: string }>) || []);
    setSeatPreview((json.seat_preview as { matched: number; missing: number; samples?: string[] }) || null);
    setTotals({
      groups: Number(json.total_groups || 0),
      memberships: Number(json.total_memberships || 0),
    });
    if (json.academic_year_hint) setYearBoth(String(json.academic_year_hint));
  };

  const summarizePreview = (json: Record<string, unknown>) => {
    const g = Number(json.total_groups || 0);
    const m = Number(json.total_memberships || 0);
    return `${g} 組 · ${m} 人`;
  };

  const enqueueFiles = useCallback((picked: File[]) => {
    if (!picked.length) return;
    // Wrong-module guard (check first file as signal)
    const hint = wrongModuleHint(MODULE, picked[0].name);
    if (hint) {
      setWrongHint(hint);
      setPendingWrongFiles(picked);
    } else {
      setWrongHint(null);
      setPendingWrongFiles([]);
    }
    setQueue((prev) => {
      const next = makeQueuedFiles(picked, MODULE, year);
      // Append; skip exact same File object names already pending
      const names = new Set(prev.map((p) => p.file.name));
      return [...prev, ...next.filter((n) => !names.has(n.file.name))];
    });
    setResult(null);
    setError(null);
    setStep(1);
  }, [year]);

  // Seed files from parent transfer
  useEffect(() => {
    if (!seedFiles?.length || seedNonce === seedSeen.current) return;
    seedSeen.current = seedNonce;
    enqueueFiles(seedFiles);
    onSeedConsumed?.();
  }, [seedFiles, seedNonce, enqueueFiles, onSeedConsumed]);

  const previewAll = async () => {
    if (!queue.length) return;
    setBusy(true);
    setError(null);
    try {
      let lastOk: Record<string, unknown> | null = null;
      for (let i = 0; i < queue.length; i++) {
        const item = queue[i];
        if (item.status === "done") continue;
        setProgressLabel(`正在預覽第 ${i + 1} / ${queue.length} 個檔案：${item.file.name}…`);
        setProgressPct(Math.round((i / queue.length) * 100));
        patchQueue(item.id, { status: "previewing", error: undefined });
        try {
          const json = await analyzeOne(item.file);
          if (!json?.ok) {
            patchQueue(item.id, { status: "error", error: String(json?.message || "分析失敗") });
            continue;
          }
          const summary = summarizePreview(json);
          patchQueue(item.id, { status: "ready", summary, previewData: json });
          lastOk = json;
        } catch (e: any) {
          patchQueue(item.id, { status: "error", error: String(e?.message || e) });
        }
      }
      if (lastOk) applyPreviewJson(lastOk);
      setProgressPct(100);
      setProgressLabel(null);
    } finally {
      setBusy(false);
    }
  };

  const importSequential = async (ids?: string[]) => {
    const targets = queue.filter((q) => {
      if (ids && !ids.includes(q.id)) return false;
      return q.status === "pending" || q.status === "ready" || q.status === "error";
    });
    if (!targets.length) return;
    setBusy(true);
    setError(null);
    let lastResult: Record<string, unknown> | null = null;
    try {
      for (let i = 0; i < targets.length; i++) {
        const item = targets[i];
        setProgressLabel(`正在匯入第 ${i + 1} / ${targets.length} 個檔案：${item.file.name}…`);
        setProgressPct(Math.round((i / targets.length) * 100));
        patchQueue(item.id, { status: "importing", error: undefined });
        try {
          const analyzed = await analyzeOne(item.file);
          if (!analyzed?.ok) {
            patchQueue(item.id, { status: "error", error: String(analyzed?.message || "分析失敗") });
            continue;
          }
          const summary = summarizePreview(analyzed);
          patchQueue(item.id, { summary, previewData: analyzed });
          applyPreviewJson(analyzed);
          const json = await executeCurrentSession();
          if (!json?.ok) {
            patchQueue(item.id, { status: "error", error: String(json?.message || "匯入失敗") });
            continue;
          }
          const sum = (json.summary as Record<string, unknown>) || {};
          const doneSummary = `${sum.groups_upserted ?? "?"} 組 · ${sum.memberships_written ?? "?"} 人`;
          patchQueue(item.id, { status: "done", result: json, summary: doneSummary });
          lastResult = json;
          onImportLogged?.({
            filename: item.file.name,
            module: MODULE,
            moduleLabel: MODULE_LABEL,
            academicYear: year,
            batchId: json.batch_id as string | number | undefined,
            summary: doneSummary,
          });
        } catch (e: any) {
          patchQueue(item.id, { status: "error", error: String(e?.message || e) });
        }
      }
      setProgressPct(100);
      setProgressLabel(null);
      if (lastResult) {
        setResult(lastResult);
        setStep(4);
        void loadBatches();
      }
    } finally {
      setBusy(false);
    }
  };

  /** Single-file classic path: preview then step through. */
  const previewThenStep = async (list: QueuedImportFile[]) => {
    if (list.length !== 1) return;
    setBusy(true);
    setError(null);
    const item = list[0];
    patchQueue(item.id, { status: "previewing" });
    try {
      const json = await analyzeOne(item.file);
      if (!json?.ok) {
        patchQueue(item.id, { status: "error", error: String(json?.message || "分析失敗") });
        setError(String(json?.message || "分析失敗"));
        return;
      }
      applyPreviewJson(json);
      patchQueue(item.id, { status: "ready", summary: summarizePreview(json), previewData: json });
    } catch (e: any) {
      const msg = String(e?.message || e);
      patchQueue(item.id, { status: "error", error: msg });
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  const onFilesPicked = (picked: File[]) => {
    enqueueFiles(picked);
  };

  // Auto-preview single-file drops for classic step-by-step flow
  useEffect(() => {
    if (busy || wrongHint) return;
    if (queue.length !== 1) return;
    const item = queue[0];
    if (item.status !== "pending") return;
    if (autoPreviewId.current === item.id) return;
    autoPreviewId.current = item.id;
    void previewThenStep([item]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue, busy, wrongHint]);

  const onExecuteSingle = async () => {
    const ready = queue.filter((q) => q.status === "ready" || q.status === "pending");
    if (ready.length > 1) {
      await importSequential(ready.map((r) => r.id));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      // Ensure session holds current file
      if (ready[0]) {
        const analyzed = await analyzeOne(ready[0].file);
        if (!analyzed?.ok) {
          setError(String(analyzed?.message || "分析失敗"));
          return;
        }
        applyPreviewJson(analyzed);
      }
      const json = await executeCurrentSession();
      if (!json?.ok) {
        setError(String(json?.message || "匯入失敗"));
        return;
      }
      setResult(json);
      setStep(4);
      void loadBatches();
      const sum = (json.summary as Record<string, unknown>) || {};
      const doneSummary = `${sum.groups_upserted ?? "?"} 組 · ${sum.memberships_written ?? "?"} 人`;
      if (ready[0]) {
        patchQueue(ready[0].id, { status: "done", result: json, summary: doneSummary });
        onImportLogged?.({
          filename: ready[0].file.name,
          module: MODULE,
          moduleLabel: MODULE_LABEL,
          academicYear: year,
          batchId: json.batch_id as string | number | undefined,
          summary: doneSummary,
        });
      }
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  };

  const continueImporting = () => {
    setQueue([]);
    setGroups([]);
    setWarnings([]);
    setMatrixFiles([]);
    setSeatPreview(null);
    setTotals({ groups: 0, memberships: 0 });
    setResult(null);
    setError(null);
    setWrongHint(null);
    setPendingWrongFiles([]);
    setProgressLabel(null);
    setProgressPct(0);
    setStep(1);
  };

  const onFlatFile = async (f: File | null) => {
    if (!f) return;
    const hint = wrongModuleHint(MODULE, f.name);
    if (hint) {
      setWrongHint(hint);
      setPendingWrongFiles([f]);
    }
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", f);
      fd.append("module", "classes");
      const res = await fetch(parseUrl, { method: "POST", credentials: "include", body: fd });
      const json = await parseFetchJson(res);
      if (!json?.ok) {
        setError(String(json?.message || "解析失敗"));
        return;
      }
      setFlatMappings(((json.mapping as any[]) || []).map((m: any) => ({
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
      const json = await parseFetchJson(res);
      if (!json?.ok) { setError(String(json?.message || "校驗失敗")); return; }
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
      const json = await parseFetchJson(res);
      if (!json?.ok) { setError(String(json?.message || "寫入失敗")); return; }
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

  const card: React.CSSProperties = {
    background: "#fff", border: `1px solid ${C.border}`, borderRadius: ERP.radius.lg,
    padding: isMobile ? 14 : 18, fontFamily: F,
  };

  const multiMode = queue.length > 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, fontFamily: F }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        {mode === "teaching" && (
          <WizardStepper
            step={step}
            maxReachable={Math.max(step, 1)}
            onJump={(n) => {
              if (n === 1) {
                // Jumping to upload keeps year/mode; clears only if coming from completion desire
                setStep(1);
                return;
              }
              setStep(n);
            }}
            steps={[
              { n: 1, label: "1 上傳與學年" },
              { n: 2, label: "2 分組總覽" },
              { n: 3, label: "3 座位解析" },
              { n: 4, label: "4 完成報告" },
            ]}
          />
        )}
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          <button type="button" onClick={() => setModeBoth("teaching")}
            style={{
              fontSize: 11, fontWeight: 700, padding: "5px 10px", borderRadius: 8, cursor: "pointer",
              border: `1px solid ${mode === "teaching" ? C.accent : C.border}`,
              background: mode === "teaching" ? C.accent : "#fff",
              color: mode === "teaching" ? "#fff" : C.textSecondary,
            }}>教學分組 XLSX</button>
          <button type="button" onClick={() => setModeBoth("flat")}
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

      {wrongHint && (
        <WrongModuleBanner
          hint={wrongHint}
          onTransfer={() => {
            onRequestTransfer?.(wrongHint.target, pendingWrongFiles);
            setWrongHint(null);
            setPendingWrongFiles([]);
            setQueue([]);
          }}
          onDismiss={() => setWrongHint(null)}
        />
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
                  可一次拖放多個計分紙（中文 / 數學 / 英文 / 選修科）。每個檔案會建立獨立 Batch ID，可分別回滾。
                </div>
                <FileDropZone
                  accept=".xlsx,.xls"
                  multiple
                  busy={busy}
                  label={queue.length ? `已選 ${queue.length} 個檔案（可繼續追加）` : "拖放或點擊上傳一個或多個 .xlsx"}
                  hint="可一次拖放多個計分紙 · .xlsx / .xls"
                  icon={<UploadCloud size={28} color={C.accent} />}
                  onFiles={onFilesPicked}
                />
                <ImportBatchQueuePanel
                  items={queue}
                  busy={busy}
                  progressLabel={progressLabel}
                  progressPct={progressPct}
                  onRemove={(id) => setQueue((prev) => prev.filter((q) => q.id !== id))}
                  onPreviewAll={multiMode || queue.some((q) => q.status === "pending") ? () => void previewAll() : undefined}
                  onImportAll={queue.length >= 1 ? () => void importSequential() : undefined}
                  onRetry={(id) => void importSequential([id])}
                />
                {busy && !progressLabel && (
                  <div style={{ marginTop: 8, fontSize: 12, color: C.textMuted }}>
                    <RefreshCw size={12} style={{ display: "inline" }} /> 處理中…
                  </div>
                )}
              </div>

              <div style={{ ...card, background: "#EFF6FF", borderColor: "#BFDBFE" }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 800, fontSize: 13, color: "#1D4ED8" }}>
                  <Shield size={16} /> 🔒 {year} 教學分組將與 2025/26 現行 Demo 分組完全隔離
                </div>
                <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
                  <label style={{ fontSize: 12, fontWeight: 700 }}>目標學年</label>
                  <select value={year} onChange={(e) => setYearBoth(e.target.value)}
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

              <SessionImportLedger entries={ledger} moduleFilter={MODULE} />

              {matrixFiles.length > 0 && (
                <div style={{ ...card, background: "#FFFBEB", borderColor: "#FDE68A", color: "#92400E", fontSize: 12 }}>
                  <div style={{ display: "flex", gap: 8, fontWeight: 800 }}><Info size={16} /> 矩陣檔僅供參考（已排除）</div>
                  {matrixFiles.map((m) => (
                    <div key={m.filename} style={{ marginTop: 6 }}>{m.filename} — {m.message || "修讀科目總表"}</div>
                  ))}
                </div>
              )}

              {!multiMode && groups.length > 0 && (
                <WizardActionBar
                  onNext={() => setStep(2)}
                  nextLabel={`下一步：分組總覽 (${totals.groups})`}
                  onConfirm={() => void onExecuteSingle()}
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
                onConfirm={() => void onExecuteSingle()}
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
                onConfirm={() => void onExecuteSingle()}
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
              {queue.filter((q) => q.status === "done").length > 1 && (
                <div style={{ marginTop: 10, fontSize: 12, color: C.textSecondary }}>
                  本輪完成 {queue.filter((q) => q.status === "done").length} 檔 ·
                  失敗 {queue.filter((q) => q.status === "error").length} 檔
                </div>
              )}
              <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <ContinueImportButton moduleLabel={MODULE_LABEL} onClick={continueImporting} />
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
              <SessionImportLedger entries={ledger} moduleFilter={MODULE} />
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

export default GroupImportWizard;
