// Reusable multi-file queue + sequential analyze→execute for Data Import wizards.
import { useCallback, useEffect, useRef, useState } from "react";
import {
  makeQueuedFiles,
  parseFetchJson,
  wrongModuleHint,
  type ImportModuleId,
  type QueuedImportFile,
  type SessionImportEntry,
  type WrongModuleHint,
} from "./importUxShared";

export type AnalyzeFn = (file: File) => Promise<Record<string, unknown>>;
export type ExecuteFn = () => Promise<Record<string, unknown>>;
export type SummarizeFn = (json: Record<string, unknown>) => string;
export type ApplyPreviewFn = (json: Record<string, unknown>) => void;

export type UseImportBatchQueueOpts = {
  module: ImportModuleId;
  academicYear: string;
  analyze: AnalyzeFn;
  execute: ExecuteFn;
  summarize: SummarizeFn;
  applyPreview?: ApplyPreviewFn;
  onImportLogged?: (entry: Omit<SessionImportEntry, "id" | "at">) => void;
  moduleLabel: string;
  seedFiles?: File[];
  seedNonce?: number;
  onSeedConsumed?: () => void;
  /** When true, auto-preview the sole pending file. */
  autoPreviewSingle?: boolean;
};

export function useImportBatchQueue(opts: UseImportBatchQueueOpts) {
  const {
    module,
    academicYear,
    analyze,
    execute,
    summarize,
    applyPreview,
    onImportLogged,
    moduleLabel,
    seedFiles,
    seedNonce = 0,
    onSeedConsumed,
    autoPreviewSingle = true,
  } = opts;

  const [queue, setQueue] = useState<QueuedImportFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [progressLabel, setProgressLabel] = useState<string | null>(null);
  const [progressPct, setProgressPct] = useState(0);
  const [wrongHint, setWrongHint] = useState<WrongModuleHint | null>(null);
  const [pendingWrongFiles, setPendingWrongFiles] = useState<File[]>([]);
  const seedSeen = useRef(-1);
  const autoPreviewId = useRef<string | null>(null);

  const patchQueue = useCallback((id: string, patch: Partial<QueuedImportFile>) => {
    setQueue((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  }, []);

  const enqueueFiles = useCallback(
    (picked: File[]) => {
      if (!picked.length) return;
      const hint = wrongModuleHint(module, picked[0].name);
      if (hint) {
        setWrongHint(hint);
        setPendingWrongFiles(picked);
      } else {
        setWrongHint(null);
        setPendingWrongFiles([]);
      }
      setQueue((prev) => {
        const next = makeQueuedFiles(picked, module, academicYear);
        const names = new Set(prev.map((p) => p.file.name));
        return [...prev, ...next.filter((n) => !names.has(n.file.name))];
      });
    },
    [module, academicYear],
  );

  useEffect(() => {
    if (!seedFiles?.length || seedNonce === seedSeen.current) return;
    seedSeen.current = seedNonce;
    enqueueFiles(seedFiles);
    onSeedConsumed?.();
  }, [seedFiles, seedNonce, enqueueFiles, onSeedConsumed]);

  const previewOne = useCallback(
    async (item: QueuedImportFile) => {
      patchQueue(item.id, { status: "previewing", error: undefined });
      try {
        const json = await analyze(item.file);
        if (!json?.ok) {
          patchQueue(item.id, { status: "error", error: String(json?.message || "分析失敗") });
          return null;
        }
        const summary = summarize(json);
        patchQueue(item.id, { status: "ready", summary, previewData: json });
        applyPreview?.(json);
        return json;
      } catch (e: any) {
        patchQueue(item.id, { status: "error", error: String(e?.message || e) });
        return null;
      }
    },
    [analyze, applyPreview, patchQueue, summarize],
  );

  const previewAll = useCallback(async () => {
    setBusy(true);
    try {
      let last: Record<string, unknown> | null = null;
      for (let i = 0; i < queue.length; i++) {
        const item = queue[i];
        if (item.status === "done") continue;
        setProgressLabel(`正在預覽第 ${i + 1} / ${queue.length} 個檔案：${item.file.name}…`);
        setProgressPct(Math.round((i / Math.max(1, queue.length)) * 100));
        const json = await previewOne(item);
        if (json) last = json;
      }
      setProgressPct(100);
      setProgressLabel(null);
      return last;
    } finally {
      setBusy(false);
    }
  }, [queue, previewOne]);

  const importSequential = useCallback(
    async (ids?: string[]) => {
      const targets = queue.filter((q) => {
        if (ids && !ids.includes(q.id)) return false;
        return q.status === "pending" || q.status === "ready" || q.status === "error";
      });
      if (!targets.length) return null;
      setBusy(true);
      let lastResult: Record<string, unknown> | null = null;
      try {
        for (let i = 0; i < targets.length; i++) {
          const item = targets[i];
          setProgressLabel(`正在匯入第 ${i + 1} / ${targets.length} 個檔案：${item.file.name}…`);
          setProgressPct(Math.round((i / Math.max(1, targets.length)) * 100));
          patchQueue(item.id, { status: "importing", error: undefined });
          try {
            const analyzed = await analyze(item.file);
            if (!analyzed?.ok) {
              patchQueue(item.id, { status: "error", error: String(analyzed?.message || "分析失敗") });
              continue;
            }
            const summary = summarize(analyzed);
            patchQueue(item.id, { summary, previewData: analyzed });
            applyPreview?.(analyzed);
            const json = await execute();
            if (!json?.ok) {
              patchQueue(item.id, { status: "error", error: String(json?.message || "匯入失敗") });
              continue;
            }
            const doneSummary = summarize(json) || summary;
            patchQueue(item.id, { status: "done", result: json, summary: doneSummary });
            lastResult = json;
            onImportLogged?.({
              filename: item.file.name,
              module,
              moduleLabel,
              academicYear,
              batchId: (json.batch_id ?? (json.batch as any)?.id) as string | number | undefined,
              summary: doneSummary,
            });
          } catch (e: any) {
            patchQueue(item.id, { status: "error", error: String(e?.message || e) });
          }
        }
        setProgressPct(100);
        setProgressLabel(null);
        return lastResult;
      } finally {
        setBusy(false);
      }
    },
    [queue, analyze, execute, summarize, applyPreview, patchQueue, onImportLogged, module, moduleLabel, academicYear],
  );

  // Auto-preview single file
  useEffect(() => {
    if (!autoPreviewSingle || busy || wrongHint) return;
    if (queue.length !== 1) return;
    const item = queue[0];
    if (item.status !== "pending") return;
    if (autoPreviewId.current === item.id) return;
    autoPreviewId.current = item.id;
    setBusy(true);
    void previewOne(item).finally(() => setBusy(false));
  }, [queue, busy, wrongHint, autoPreviewSingle, previewOne]);

  const clearQueue = useCallback(() => {
    setQueue([]);
    setProgressLabel(null);
    setProgressPct(0);
    setWrongHint(null);
    setPendingWrongFiles([]);
    autoPreviewId.current = null;
  }, []);

  const dismissWrong = () => setWrongHint(null);

  return {
    queue,
    setQueue,
    busy,
    setBusy,
    progressLabel,
    progressPct,
    wrongHint,
    pendingWrongFiles,
    enqueueFiles,
    previewAll,
    importSequential,
    previewOne,
    clearQueue,
    dismissWrong,
    patchQueue,
    parseFetchJson,
  };
}
