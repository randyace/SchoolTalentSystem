// ─────────────────────────────────────────────────────────────────────────────
// Handsontable CE score grid — Excel / Google Sheets / WebSAMS paste
// Layout: nestedHeaders for 分卷, fixedColumnsLeft identity, stretchH fill
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect, useMemo, useRef } from "react";
import { ERP } from "./erpTokens";

export type ScoreGridStatus = "normal" | "abs" | "exm" | "late";

export type ScoreGridStudent = {
  id: number;
  studentCode: string;
  classNum: number;
  chName: string;
  enName: string;
  score: number | null;
  status: ScoreGridStatus;
  note: string;
  paperScores?: Record<string, { score: number | null; status: string; note: string }>;
};

export type ScoreGridPaper = {
  assessment_id: number;
  name: string;
  max_score: number;
  weighting?: number;
  is_locked?: boolean;
  writable?: boolean;
};

type Props = {
  students: ScoreGridStudent[];
  papers: ScoreGridPaper[];
  maxScore: number;
  assessmentName?: string;
  readOnly?: boolean;
  height?: number | string;
  onChange: (next: ScoreGridStudent[]) => void;
};

type HotInstance = {
  destroy: () => void;
  loadData: (data: unknown[][]) => void;
  getData: () => unknown[][];
  getSourceData: () => unknown[][];
  render: () => void;
  updateSettings: (s: Record<string, unknown>) => void;
  refreshDimensions?: () => void;
  selectCell?: (row: number, col: number, endRow?: number, endCol?: number, scrollToCell?: boolean, changeListener?: boolean) => boolean | void;
  getCellMeta?: (row: number, col: number) => { readOnly?: boolean; editor?: unknown };
  getActiveEditor?: () => { beginEditing?: (initialValue?: string | false) => void; isOpened?: () => boolean } | undefined;
  listen?: () => void;
  unlisten?: () => void;
  rootElement?: HTMLElement;
  isListening?: () => boolean;
  getSelectedLast?: () => number[] | undefined;
  getPlugin?: (name: string) => { paste?: (text: string) => void; isEnabled?: () => boolean } | undefined;
  populateFromArray?: (row: number, col: number, input: unknown[][], endRow?: number | null, endCol?: number | null, source?: string) => void;
};

declare global {
  interface Window {
    Handsontable?: new (el: HTMLElement, settings: Record<string, unknown>) => HotInstance;
  }
}

const STATUS_LABELS = ["正常", "ABS 缺席", "EXM 免修", "LATE 遲到"] as const;

const STATUS_TO_LABEL: Record<ScoreGridStatus, string> = {
  normal: "正常",
  abs: "ABS 缺席",
  exm: "EXM 免修",
  late: "LATE 遲到",
};

function parseStatusLabel(raw: unknown): ScoreGridStatus {
  const s = String(raw ?? "").trim().toUpperCase();
  if (!s || s === "正常" || s === "NORMAL") return "normal";
  if (s.startsWith("ABS") || s === "缺席" || s === "A") return "abs";
  if (s.startsWith("EX") || s === "免修" || s === "N/A" || s === "NA") return "exm";
  if (s.startsWith("LATE") || s === "遲到" || s === "L") return "late";
  return "normal";
}

let loadPromise: Promise<void> | null = null;

function loadHandsontable(): Promise<void> {
  if (typeof window !== "undefined" && window.Handsontable) {
    return Promise.resolve();
  }
  if (loadPromise) return loadPromise;
  loadPromise = new Promise((resolve, reject) => {
    const cssHref = "/assets/vendor/handsontable/handsontable.full.min.css";
    if (!document.querySelector(`link[href="${cssHref}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = cssHref;
      document.head.appendChild(link);
    }
    const src = "/assets/vendor/handsontable/handsontable.full.min.js";
    const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve());
      if (window.Handsontable) resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Handsontable"));
    document.body.appendChild(script);
  });
  return loadPromise;
}

function parseCell(raw: unknown, max: number): { score: number | null; status: ScoreGridStatus } {
  if (raw === null || raw === undefined || raw === "") {
    return { score: null, status: "normal" };
  }
  const s = String(raw).trim().toUpperCase();
  if (s === "ABS" || s === "缺席" || s === "A" || s.startsWith("ABS ")) return { score: null, status: "abs" };
  if (s === "EXM" || s === "EX" || s === "EXEMPT" || s === "免修" || s === "N/A" || s === "NA" || s.startsWith("EXM ")) {
    return { score: null, status: "exm" };
  }
  if (s === "LATE" || s === "遲到" || s.startsWith("LATE ")) return { score: null, status: "late" };
  const n = Number(String(raw).replace(/,/g, ""));
  if (Number.isNaN(n)) return { score: null, status: "normal" };
  if (n < 0) return { score: 0, status: "normal" };
  if (n > max) return { score: max, status: "normal" };
  return { score: Math.round(n * 100) / 100, status: "normal" };
}

function normalizeStudentKey(raw: string): string {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/^#/, "")
    .replace(/^s0*/, "s");
}

/** Detect WebSAMS-style paste: first cols include student id / class / names. */
function extractScoreMatrix(
  pasted: string[][],
  scoreColCount: number,
): { mode: "scores-only" | "websams"; matrix: string[][]; keys?: string[] } {
  if (!pasted.length) return { mode: "scores-only", matrix: [] };

  const first = pasted[0] || [];
  const looksHeader = first.some(c =>
    /websams|班別|班號|姓名|reading|寫作|總分|english|regnumber/i.test(String(c))
  );
  const body = looksHeader ? pasted.slice(1) : pasted;

  const sample = body[0] || [];
  const cell0 = String(sample[0] || "");
  const cell1 = String(sample[1] || "");
  const hasId = /^#?\d{5,}|^s\d+/i.test(cell0) || /^s\d+/i.test(cell1);
  const hasWideRow = sample.length > scoreColCount + 2;

  if (hasId || hasWideRow) {
    const keys: string[] = [];
    const matrix: string[][] = [];
    for (const row of body) {
      if (!row || row.every(c => String(c).trim() === "")) continue;
      let key = "";
      for (let i = 0; i < Math.min(7, row.length); i++) {
        const v = String(row[i] || "").trim();
        if (/^s\d+/i.test(v) || /^#?\d{5,}$/.test(v)) {
          key = normalizeStudentKey(v);
          break;
        }
      }
      keys.push(key);
      let scores: string[] = [];
      if (row.length >= 7 + scoreColCount) {
        scores = row.slice(7, 7 + scoreColCount).map(String);
      } else {
        const nums = row
          .map(c => String(c).trim())
          .filter(c => c !== "" && c !== "-" && (/^-?\d+(\.\d+)?$/.test(c) || /^(ABS|EXM|EX|LATE|N\/A)/i.test(c)));
        scores = nums.slice(0, scoreColCount);
        while (scores.length < scoreColCount) scores.push("");
      }
      matrix.push(scores);
    }
    return { mode: "websams", matrix, keys };
  }

  return {
    mode: "scores-only",
    matrix: body.map(r => r.slice(0, scoreColCount).map(c => String(c ?? ""))),
  };
}

export const ScoreSpreadsheetGrid: React.FC<Props> = ({
  students,
  papers,
  maxScore,
  assessmentName = "Score",
  readOnly = false,
  height = "100%",
  onChange,
}) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const hotRef = useRef<HotInstance | null>(null);
  const studentsRef = useRef(students);
  const papersRef = useRef(papers);
  const onChangeRef = useRef(onChange);
  const skipReloadRef = useRef(false);
  studentsRef.current = students;
  papersRef.current = papers;
  onChangeRef.current = onChange;

  const emitChange = (next: ScoreGridStudent[]) => {
    skipReloadRef.current = true;
    onChangeRef.current(next);
  };

  const scoreCols = useMemo(() => {
    if (papers.length > 0) {
      return papers.map(p => ({
        key: `p:${p.assessment_id}`,
        title: `${p.name} /${p.max_score}`,
        max: p.max_score || maxScore,
        assessmentId: p.assessment_id,
      }));
    }
    return [{
      key: "score",
      title: `${assessmentName} /${maxScore}`,
      max: maxScore,
      assessmentId: 0,
    }];
  }, [papers, maxScore, assessmentName]);

  const groupTotal = useMemo(() => {
    if (papers.length > 0) {
      return papers.reduce((s, p) => s + (Number(p.max_score) || 0), 0) || maxScore;
    }
    return maxScore;
  }, [papers, maxScore]);

  const buildData = (rows: ScoreGridStudent[]): unknown[][] => {
    return rows.map(r => {
      const base: unknown[] = [
        r.classNum || "",
        r.chName || r.enName || "",
        r.enName || r.studentCode || "",
        r.studentCode || "",
      ];
      if (papersRef.current.length > 0) {
        papersRef.current.forEach(p => {
          const cell = r.paperScores?.[String(p.assessment_id)];
          const st = (cell?.status || r.status) as ScoreGridStatus;
          if (st === "abs") base.push("ABS");
          else if (st === "exm") base.push("EXM");
          else if (st === "late") base.push(cell?.score ?? "LATE");
          else base.push(cell?.score ?? "");
        });
      } else if (r.status === "abs") {
        base.push("ABS");
      } else if (r.status === "exm") {
        base.push("EXM");
      } else if (r.status === "late") {
        base.push(r.score ?? "LATE");
      } else {
        base.push(r.score ?? "");
      }
      base.push(STATUS_TO_LABEL[r.status] || "正常", r.note || "");
      return base;
    });
  };

  const applyGridToStudents = (data: unknown[][]): ScoreGridStudent[] => {
    const cols = scoreCols;
    return studentsRef.current.map((row, ri) => {
      const line = data[ri] || [];
      const status = parseStatusLabel(line[4 + cols.length]);
      const note = String(line[5 + cols.length] ?? row.note ?? "");
      if (papersRef.current.length > 0) {
        const paperScores = { ...(row.paperScores || {}) };
        papersRef.current.forEach((p, pi) => {
          const parsed = parseCell(line[4 + pi], p.max_score || maxScore);
          // Row-level ABS/EXM clears scores; LATE keeps numeric if present
          let st: ScoreGridStatus = status;
          let score = parsed.score;
          if (status === "abs" || status === "exm") {
            score = null;
            st = status;
          } else if (parsed.status === "abs" || parsed.status === "exm") {
            score = null;
            st = parsed.status;
          } else if (status === "late") {
            st = "late";
            if (parsed.status === "late" && score === null) score = null;
          } else {
            st = parsed.status === "late" ? "late" : "normal";
          }
          paperScores[String(p.assessment_id)] = { score, status: st, note };
        });
        const first = paperScores[String(papersRef.current[0].assessment_id)];
        return {
          ...row,
          status,
          note,
          paperScores,
          score: first?.score ?? null,
        };
      }
      const parsed = parseCell(line[4], maxScore);
      let st = status;
      let score = parsed.score;
      if (status === "abs" || status === "exm") {
        score = null;
      } else if (parsed.status === "abs" || parsed.status === "exm") {
        st = parsed.status;
        score = null;
      } else if (status === "late") {
        st = "late";
      }
      return { ...row, status: st, score, note };
    });
  };

  useEffect(() => {
    let cancelled = false;
    let hot: HotInstance | null = null;
    let ro: ResizeObserver | null = null;

    loadHandsontable().then(() => {
      if (cancelled || !hostRef.current || !window.Handsontable) return;

      const nScore = scoreCols.length;
      const groupLabel = `${assessmentName} (總分 ${groupTotal})`;

      // Nested header: identity | assessment group spanning papers | status/note
      const nestedHeaders: unknown[] = [
        [
          { label: "", colspan: 4 },
          { label: groupLabel, colspan: nScore },
          { label: "", colspan: 2 },
        ],
        [
          "班號",
          "姓名",
          "English",
          "學號",
          ...scoreCols.map(c => c.title),
          "狀態",
          "備註",
        ],
      ];

      // Identity locked; score / status / remarks editable (unless assessment locked)
      const scoreEditable = !readOnly;
      const columns: Record<string, unknown>[] = [
        { readOnly: true, editor: false, width: 56, className: "htCenter htDimmed" },
        { readOnly: true, editor: false, width: 110, className: "htDimmed" },
        { readOnly: true, editor: false, width: 120, className: "htDimmed" },
        { readOnly: true, editor: false, width: 100, className: "htDimmed" },
        ...scoreCols.map(c => ({
          type: "text",
          width: Math.max(88, Math.min(120, Math.floor(520 / Math.max(nScore, 1)))),
          readOnly: !scoreEditable,
          editor: scoreEditable ? "text" : false,
          className: "htRight score-cell",
          validator(value: unknown, callback: (valid: boolean) => void) {
            if (value === null || value === "" || value === undefined) {
              callback(true);
              return;
            }
            const s = String(value).trim().toUpperCase();
            if (
              ["ABS", "EXM", "EX", "LATE", "N/A", "NA", "缺席", "免修", "遲到"].includes(s)
              || s.startsWith("ABS ")
              || s.startsWith("EXM ")
              || s.startsWith("LATE ")
            ) {
              callback(true);
              return;
            }
            const n = Number(String(value).replace(/,/g, ""));
            callback(!Number.isNaN(n) && n >= 0 && n <= c.max);
          },
          allowInvalid: true,
        })),
        {
          type: "dropdown",
          source: [...STATUS_LABELS],
          width: 110,
          readOnly: !scoreEditable,
          editor: scoreEditable ? "dropdown" : false,
          className: "htCenter",
        },
        {
          type: "text",
          width: 160,
          readOnly: !scoreEditable,
          editor: scoreEditable ? "text" : false,
        },
      ];

      const hostW = Math.max(hostRef.current.clientWidth || 0, 320);
      const hostH = typeof height === "number"
        ? height
        : Math.max(hostRef.current.clientHeight || 0, 320);

      hot = new window.Handsontable(hostRef.current, {
        data: buildData(studentsRef.current),
        nestedHeaders,
        rowHeaders: true,
        columns,
        // NEVER set global readOnly — column defs control editability
        readOnly: false,
        disableVisualSelection: false,
        // Keep clipboard focus on the selected cell (Excel-like Ctrl+V)
        fragmentSelection: "cell",
        copyPaste: true,
        fillHandle: scoreEditable,
        enterBeginsEditing: true,
        enterMoves: { row: 1, col: 0 },
        tabMoves: { row: 0, col: 1 },
        // Start editing as soon as the user types (after single-click select)
        imeFastEdit: true,
        fixedColumnsLeft: 4,
        stretchH: "all",
        width: hostW,
        height: hostH,
        licenseKey: "non-commercial-and-evaluation",
        contextMenu: scoreEditable,
        manualColumnResize: true,
        autoWrapRow: true,
        autoWrapCol: true,
        outsideClickDeselects: false,
        viewportColumnRenderingOffset: 12,
        /**
         * Excel-like single-click:
         * 1) Select cell + listen() so Ctrl+V matrix-pastes without edit mode
         * 2) Open editor so typing works immediately after one click
         * Multi-line / tab clipboard is handled in capture paste below (editor would
         * otherwise swallow column paste as plain text into one cell).
         */
        afterOnCellMouseDown(event: MouseEvent, coords: { row: number; col: number }) {
          if (coords.row < 0 || coords.col < 0) return;
          if (event.button !== 0) return;
          const self = hotRef.current || hot;
          if (!self?.getCellMeta) return;
          const meta = self.getCellMeta(coords.row, coords.col);
          window.setTimeout(() => {
            const inst = hotRef.current || hot;
            if (!inst) return;
            try {
              inst.selectCell?.(coords.row, coords.col, coords.row, coords.col, true, false);
              inst.listen?.();
              const root = inst.rootElement || hostRef.current;
              const holder = root?.querySelector?.(".ht_master .wtHolder") as HTMLElement | null;
              if (holder) {
                if (!holder.getAttribute("tabindex")) holder.setAttribute("tabindex", "-1");
                holder.focus({ preventScroll: true });
              }
              if (!meta.readOnly && meta.editor !== false && scoreEditable) {
                const ed = inst.getActiveEditor?.();
                ed?.beginEditing?.(false);
              }
            } catch { /* */ }
          }, 50);
        },
        afterSelection() {
          (hotRef.current || hot)?.listen?.();
        },
        beforePaste(data: string[][], coords: Array<{ startRow: number; startCol: number }>) {
          const start = coords?.[0];
          if (!start) return;
          const scoreCount = scoreCols.length;
          const extracted = extractScoreMatrix(data, scoreCount);
          if (extracted.mode === "websams" && extracted.keys) {
            const next = studentsRef.current.map(s => ({ ...s, paperScores: { ...(s.paperScores || {}) } }));
            const byCode = new Map(next.map((s, idx) => [normalizeStudentKey(s.studentCode), idx]));
            extracted.matrix.forEach((vals, i) => {
              const key = extracted.keys![i];
              let idx = key ? byCode.get(key) : undefined;
              if (idx === undefined) idx = start.startRow + i;
              if (idx === undefined || idx < 0 || idx >= next.length) return;
              const row = next[idx];
              if (papersRef.current.length > 0) {
                const paperScores = { ...(row.paperScores || {}) };
                papersRef.current.forEach((p, pi) => {
                  const parsed = parseCell(vals[pi], p.max_score || maxScore);
                  paperScores[String(p.assessment_id)] = {
                    score: parsed.score,
                    status: parsed.status,
                    note: row.note,
                  };
                  if (parsed.status !== "normal") {
                    next[idx!] = { ...next[idx!], status: parsed.status };
                  }
                });
                next[idx] = {
                  ...next[idx],
                  paperScores,
                  score: paperScores[String(papersRef.current[0].assessment_id)]?.score ?? null,
                };
              } else {
                const parsed = parseCell(vals[0], maxScore);
                next[idx] = {
                  ...row,
                  score: parsed.status === "normal" || parsed.status === "late" ? parsed.score : null,
                  status: parsed.status !== "normal" ? parsed.status : row.status,
                };
              }
            });
            emitChange(next);
            data.splice(0, data.length);
            return false;
          }

          if (start.startCol >= 4 && start.startCol < 4 + scoreCount) {
            const cleaned = extracted.matrix.map(r => r.slice(0, scoreCount));
            data.splice(0, data.length, ...cleaned);
          }
        },
        afterChange(changes: Array<[number, number | string, unknown, unknown]> | null, source: string) {
          if (!changes || source === "loadData" || source === "external") return;
          const data = hotRef.current?.getData?.() || hot?.getData?.();
          if (!data) return;
          emitChange(applyGridToStudents(data as unknown[][]));
        },
      });
      hotRef.current = hot;

      // When editor is open (single-click edit), matrix Ctrl+V would otherwise land in the
      // TEXTAREA as one blob. Capture paste and route multi-cell clips through CopyPaste.
      const onMatrixPasteCapture = (e: ClipboardEvent) => {
        const text = e.clipboardData?.getData("text/plain") ?? "";
        if (!text || (!text.includes("\t") && !/\r?\n/.test(text))) return;
        const inst = hotRef.current;
        if (!inst) return;
        e.preventDefault();
        e.stopPropagation();
        try {
          const ed = inst.getActiveEditor?.() as
            | { isOpened?: () => boolean; cancelChanges?: () => void; finishEditing?: (restore?: boolean) => void }
            | undefined;
          if (ed?.isOpened?.()) {
            ed.cancelChanges?.();
            ed.finishEditing?.(true);
          }
          inst.listen?.();
          const plugin = inst.getPlugin?.("copyPaste") || inst.getPlugin?.("CopyPaste");
          if (plugin?.paste) {
            plugin.paste(text);
            return;
          }
          const sel = inst.getSelectedLast?.();
          if (!sel || sel.length < 2) return;
          const rows = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n")
            .filter((line, i, arr) => !(i === arr.length - 1 && line === ""))
            .map(line => line.split("\t"));
          inst.populateFromArray?.(sel[0], sel[1], rows, null, null, "CopyPaste.paste");
        } catch { /* */ }
      };
      hostRef.current.addEventListener("paste", onMatrixPasteCapture, true);

      // After flex layout settles, sync pixel size once (avoids 0-height / mis-sized clones)
      requestAnimationFrame(() => {
        const el = hostRef.current;
        const inst = hotRef.current;
        if (!el || !inst || cancelled) return;
        const w = Math.max(el.clientWidth || 0, 320);
        const h = Math.max(el.clientHeight || 0, 320);
        try {
          inst.updateSettings({ width: w, height: h });
          inst.refreshDimensions?.();
          inst.listen?.();
        } catch { /* */ }
      });

      // Debounced resize — avoid thrashing updateSettings (destroys selection / clone hit-targets)
      let resizeTimer: ReturnType<typeof setTimeout> | null = null;
      if (typeof ResizeObserver !== "undefined" && wrapRef.current) {
        ro = new ResizeObserver(() => {
          if (resizeTimer) clearTimeout(resizeTimer);
          resizeTimer = setTimeout(() => {
            const el = hostRef.current;
            const inst = hotRef.current;
            if (!el || !inst) return;
            const w = Math.max(el.clientWidth || 0, 320);
            const h = Math.max(el.clientHeight || 0, 320);
            try {
              inst.updateSettings({ height: h, width: w });
              inst.refreshDimensions?.();
            } catch { /* */ }
          }, 80);
        });
        ro.observe(wrapRef.current);
      }

      // stash remover on host for cleanup
      (hostRef.current as HTMLElement & { __stsPaste?: (e: ClipboardEvent) => void }).__stsPaste = onMatrixPasteCapture;
    }).catch(() => { /* vendor missing */ });

    return () => {
      cancelled = true;
      try { ro?.disconnect(); } catch { /* */ }
      try {
        const el = hostRef.current as (HTMLElement & { __stsPaste?: (e: ClipboardEvent) => void }) | null;
        if (el?.__stsPaste) el.removeEventListener("paste", el.__stsPaste, true);
      } catch { /* */ }
      try { hotRef.current?.destroy(); } catch { /* */ }
      hotRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scoreCols.map(c => c.key).join("|"), readOnly, maxScore, assessmentName, groupTotal]);

  useEffect(() => {
    if (!hotRef.current) return;
    if (skipReloadRef.current) {
      skipReloadRef.current = false;
      return;
    }
    hotRef.current.loadData(buildData(students));
  }, [students, scoreCols]);

  return (
    <div
      ref={wrapRef}
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        minHeight: 280,
        minWidth: 0,
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      <div style={{
        flexShrink: 0, padding: "8px 12px",
        background: "#EFF6FF", borderBottom: `1px solid ${ERP.colors.accentLight}`,
        fontSize: 12, color: "#1E40AF", fontWeight: 600, fontFamily: ERP.font.family,
      }}>
        請直接從 Excel / Google Sheets / WebSAMS 複製分數欄位，於下方對應儲存格貼上 (Ctrl+V / ⌘V)。
        支援整欄、矩陣貼上；分卷欄位依序對應。可輸入數字、ABS、EXM、LATE。
      </div>
      <div
        id="scoreGrid"
        ref={hostRef}
        tabIndex={-1}
        style={{
          flex: 1,
          width: "100%",
          minWidth: 0,
          minHeight: 240,
          overflow: "hidden",
          background: ERP.colors.surface,
          borderTop: `1px solid ${ERP.colors.border}`,
          boxSizing: "border-box",
          outline: "none",
        }}
      />
      <style>{`
        /* Do NOT force width:100% on .handsontable — it breaks clone overlays
           so left/fixed layers intercept clicks on editable score cells. */
        #scoreGrid {
          position: relative;
          z-index: 0;
        }
        #scoreGrid .handsontable {
          font-family: ${ERP.font.family};
          font-size: 13px;
          position: relative;
          z-index: 1;
        }
        /* Clones must not paint an invisible full-width hit layer over the master */
        #scoreGrid .ht_clone_left,
        #scoreGrid .ht_clone_top_left_corner {
          z-index: 102 !important;
        }
        #scoreGrid .ht_clone_top {
          z-index: 101 !important;
        }
        #scoreGrid .ht_master {
          z-index: 100 !important;
        }
        #scoreGrid .ht_master .wtHolder {
          z-index: auto;
        }
        #scoreGrid .htDimmed {
          background: #F8FAFC !important;
          color: #64748B;
        }
        #scoreGrid .score-cell {
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-weight: 700;
          cursor: cell;
        }
        #scoreGrid .handsontable th {
          background: #F8FAFC !important;
          color: #64748B;
          font-size: 11px;
          font-weight: 700;
          vertical-align: middle !important;
          white-space: nowrap;
        }
        #scoreGrid .handsontable thead tr:first-child th {
          background: ${ERP.colors.accentPale} !important;
          color: ${ERP.colors.accent};
          font-size: 12px;
          font-weight: 800;
          text-align: center !important;
        }
        #scoreGrid .ht_clone_left td,
        #scoreGrid .ht_clone_left th {
          background: #F8FAFC !important;
        }
        /* Ensure editors / dropdowns appear above sticky chrome */
        #scoreGrid .handsontableInputHolder,
        #scoreGrid .htDropdownMenu,
        .htDropdownMenu {
          z-index: 1000 !important;
        }
      `}</style>
    </div>
  );
};
