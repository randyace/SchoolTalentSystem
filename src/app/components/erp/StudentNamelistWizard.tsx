// Dual-mode Step 1 學生檔案: Multi-sheet Mark Sheet wizard + flat roster + ID pairing modal
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  UploadCloud, CheckCircle2, AlertTriangle, ArrowRight, ArrowLeft,
  RefreshCw, History, Shield, Users, Search, ClipboardPaste, X, Save,
  Zap, Dices,
} from "lucide-react";
import { ERP } from "./erpTokens";
import { useIsMobile } from "./erpResponsive";
import { FileDropZone } from "./FileDropZone";
import { WizardActionBar, WizardStepper } from "./ImportWizardChrome";

const F = ERP.font.family;
const C = ERP.colors;

type SheetOverview = {
  sheet_name: string; class_name: string; room: string;
  form_teacher_text: string; seat_count: number;
};
type SeatRow = {
  id: number; class_name: string; class_number: number; gender: string | null;
  room: string | null; form_teacher_text: string | null;
  name_display: string; name_zh_hk: string; name_en: string;
  temp_student_code: string; paired_student_code: string | null;
  live_student_code: string | null; pairing_status: string; student_pk: number | null;
};
type ClassStat = {
  class_name: string; room: string | null; form_teacher_text: string | null;
  total: number; paired: number;
};
type SearchHit = {
  student_pk: number; student_id: string; name_display: string;
  hint: string; is_temp: boolean;
};
type DraftRow = {
  seat_id: number; class_number: number; gender: string | null;
  name_display: string; code: string; status: "unpaired" | "existing" | "new" | "dup" | "paired";
  hint?: string;
};

export type StudentNamelistWizardProps = {
  analyzeUrl?: string;
  executeUrl?: string;
  batchesUrl?: string;
  searchUrl?: string;
  parseUrl?: string;
  validateUrl?: string;
  flatExecuteUrl?: string;
};

function normalizeCode(raw: string): string {
  let s = raw.trim().replace(/^#/, "");
  if (s && !/^s/i.test(s) && /^\d{5,}$/.test(s)) s = "s" + s;
  return s.toLowerCase();
}

function parsePasteBlock(text: string): string[] {
  const lines = text.replace(/\r/g, "").split("\n").map((l) => l.trim()).filter(Boolean);
  const codes: string[] = [];
  for (const line of lines) {
    const parts = line.split(/[\t,;|]+/).map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2 && /^\d{1,2}$/.test(parts[0])) {
      codes.push(parts[1]);
    } else {
      codes.push(parts[parts.length - 1]);
    }
  }
  return codes;
}

export const StudentNamelistWizard: React.FC<StudentNamelistWizardProps> = ({
  analyzeUrl = "/api/data-import/students/analyze-marksheet",
  executeUrl = "/api/data-import/students/execute-marksheet",
  batchesUrl = "/api/data-import/students/batches",
  searchUrl = "/api/data-import/students/search",
  parseUrl = "/admin/data-import/parse-preview",
  validateUrl = "/admin/data-import/validate",
  flatExecuteUrl = "/admin/data-import/execute",
}) => {
  const isMobile = useIsMobile();
  const [mode, setMode] = useState<"idle" | "mark_sheet" | "flat">("idle");
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [year, setYear] = useState("2026/27");
  const [sheets, setSheets] = useState<SheetOverview[]>([]);
  const [stats, setStats] = useState<{
    total_sheets: number; total_seats: number; blank_names: number;
    gender_m: number; gender_f: number;
  } | null>(null);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [batches, setBatches] = useState<Array<Record<string, unknown>>>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Flat roster state
  const [flatMappings, setFlatMappings] = useState<Array<{ csvHeader: string; targetField: string }>>([]);
  const [flatSummary, setFlatSummary] = useState<Record<string, unknown> | null>(null);
  const [flatDone, setFlatDone] = useState<Record<string, unknown> | null>(null);

  // Pairing modal
  const [pairingOpen, setPairingOpen] = useState(false);
  const [batchId, setBatchId] = useState<number | null>(null);
  const [classStats, setClassStats] = useState<ClassStat[]>([]);
  const [activeClass, setActiveClass] = useState<string>("");
  const [batchMeta, setBatchMeta] = useState<{ academic_year: string; total_seats: number; paired_seats: number } | null>(null);
  const [drafts, setDrafts] = useState<DraftRow[]>([]);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [searchHits, setSearchHits] = useState<Record<number, SearchHit[]>>({});
  const [activeSearchSeat, setActiveSearchSeat] = useState<number | null>(null);
  const searchTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const [autoGenBusy, setAutoGenBusy] = useState(false);
  const [autoGenConfirm, setAutoGenConfirm] = useState(false);
  const [autoGenProgress, setAutoGenProgress] = useState<string | null>(null);

  const loadBatches = useCallback(async () => {
    try {
      const res = await fetch(batchesUrl, { credentials: "include", headers: { Accept: "application/json" } });
      const json = await res.json();
      if (json?.ok) setBatches(json.batches || []);
    } catch { /* ignore */ }
  }, [batchesUrl]);

  useEffect(() => { void loadBatches(); }, [loadBatches]);

  const loadSeats = useCallback(async (bid: number, className?: string) => {
    const q = className ? `?class_name=${encodeURIComponent(className)}` : "";
    const res = await fetch(`${batchesUrl}/${bid}/seats${q}`, {
      credentials: "include", headers: { Accept: "application/json" },
    });
    const json = await res.json();
    if (!json?.ok) throw new Error(json?.message || "載入座位失敗");
    setBatchMeta({
      academic_year: json.batch.academic_year,
      total_seats: Number(json.batch.total_seats),
      paired_seats: Number(json.batch.paired_seats),
    });
    setClassStats(json.classes || []);
    const cls = className || (json.classes?.[0]?.class_name as string) || "";
    setActiveClass(cls);
    const seats: SeatRow[] = (json.seats || []).filter((s: SeatRow) => !cls || s.class_name === cls);
    setDrafts(seats.map((s) => {
      const code = s.paired_student_code || "";
      let status: DraftRow["status"] = "unpaired";
      if (s.pairing_status === "paired_existing") status = "paired";
      else if (s.pairing_status === "paired_new") status = "paired";
      return {
        seat_id: s.id,
        class_number: s.class_number,
        gender: s.gender,
        name_display: s.name_display,
        code,
        status: code ? status : "unpaired",
      };
    }));
    return json;
  }, [batchesUrl]);

  const openPairing = async (bid: number) => {
    setBusy(true);
    setError(null);
    try {
      setBatchId(bid);
      const json = await loadSeats(bid);
      const first = json.classes?.[0]?.class_name as string | undefined;
      if (first) await loadSeats(bid, first);
      setPairingOpen(true);
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  };

  const switchClass = async (cn: string) => {
    if (!batchId) return;
    setBusy(true);
    try {
      await loadSeats(batchId, cn);
    } finally {
      setBusy(false);
    }
  };

  const recomputeDupes = (rows: DraftRow[]): DraftRow[] => {
    const counts: Record<string, number> = {};
    rows.forEach((r) => {
      const c = normalizeCode(r.code);
      if (c) counts[c] = (counts[c] || 0) + 1;
    });
    return rows.map((r) => {
      const c = normalizeCode(r.code);
      if (!c) return { ...r, status: r.status === "paired" ? "paired" : "unpaired" };
      if (counts[c] > 1) return { ...r, status: "dup" };
      if (r.status === "paired") return r;
      return r;
    });
  };

  const applyCodesFrom = (startIdx: number, codes: string[]) => {
    setDrafts((prev) => {
      const next = prev.map((r) => ({ ...r }));
      for (let i = 0; i < codes.length; i++) {
        const idx = startIdx + i;
        if (idx >= next.length) break;
        const code = normalizeCode(codes[i]);
        next[idx] = {
          ...next[idx],
          code,
          status: code ? "new" : "unpaired",
        };
      }
      return recomputeDupes(next);
    });
  };

  const lookupCode = async (seatId: number, code: string) => {
    const norm = normalizeCode(code);
    if (!norm || norm.length < 2) {
      setDrafts((prev) => recomputeDupes(prev.map((r) =>
        r.seat_id === seatId ? { ...r, code: norm, status: "unpaired", hint: undefined } : r
      )));
      return;
    }
    try {
      const res = await fetch(
        `${searchUrl}?q=${encodeURIComponent(norm)}&academic_year=${encodeURIComponent(year)}`,
        { credentials: "include", headers: { Accept: "application/json" } },
      );
      const json = await res.json();
      const hits: SearchHit[] = json?.students || [];
      setSearchHits((prev) => ({ ...prev, [seatId]: hits.slice(0, 8) }));
      const exact = hits.find((h) => h.student_id === norm && !h.is_temp);
      setDrafts((prev) => recomputeDupes(prev.map((r) => {
        if (r.seat_id !== seatId) return r;
        if (exact) {
          return { ...r, code: norm, status: "existing", hint: exact.hint || exact.name_display };
        }
        return { ...r, code: norm, status: "new", hint: "查無此號（將新建留空學生）" };
      })));
    } catch { /* ignore */ }
  };

  const onDraftChange = (seatId: number, value: string) => {
    setDrafts((prev) => recomputeDupes(prev.map((r) =>
      r.seat_id === seatId ? { ...r, code: value, status: value.trim() ? "new" : "unpaired" } : r
    )));
    setActiveSearchSeat(seatId);
    if (searchTimers.current[seatId]) clearTimeout(searchTimers.current[seatId]);
    searchTimers.current[seatId] = setTimeout(() => void lookupCode(seatId, value), 280);
  };

  const onPasteSeat = (startIdx: number, e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text");
    if (!text || (!text.includes("\n") && !text.includes("\t"))) return;
    e.preventDefault();
    const codes = parsePasteBlock(text);
    if (codes.length > 1) applyCodesFrom(startIdx, codes);
  };

  const unpairedTotal = useMemo(
    () => classStats.reduce((s, c) => s + Math.max(0, c.total - c.paired), 0),
    [classStats],
  );
  const unpairedActive = useMemo(() => {
    const c = classStats.find((x) => x.class_name === activeClass);
    return c ? Math.max(0, c.total - c.paired) : 0;
  }, [classStats, activeClass]);

  const cohortRuleLine = useMemo(() => {
    const ay = batchMeta?.academic_year || year;
    const m = ay.match(/(\d{4})/);
    const start = m ? Number(m[1]) : 2026;
    const parts = [1, 2, 3, 4, 5, 6].map((f) => {
      const entry = start - (f - 1);
      const pref = `s${String(entry).slice(-2)}`;
      const zh = ["", "中一", "中二", "中三", "中四", "中五", "中六"][f];
      return `${zh} ${pref}1001+`;
    });
    return parts.join(" · ");
  }, [batchMeta?.academic_year, year]);

  const runAutoGenerate = async (scope: "all" | "class") => {
    if (!batchId) return;
    setAutoGenBusy(true);
    setAutoGenConfirm(false);
    setError(null);
    const targetCount = scope === "class" ? unpairedActive : unpairedTotal;
    setAutoGenProgress(`正在為 ${targetCount} 位學生生成永久學號…`);
    try {
      const body: Record<string, unknown> = {
        scope,
        randomize_order: true,
      };
      if (scope === "class") body.class_name = activeClass;
      const res = await fetch(`${batchesUrl}/${batchId}/auto-generate-ids`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json?.ok && !(json.generated_count > 0)) {
        setError(json?.message || "自動生成學號失敗");
        return;
      }
      const n = Number(json.generated_count || 0);
      setToast(json.message || `成功為 ${n} 位學生生成永久學號！`);
      await loadSeats(batchId, activeClass || undefined);
      void loadBatches();
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setAutoGenBusy(false);
      setAutoGenProgress(null);
    }
  };

  const saveClassPairing = async () => {
    if (!batchId) return;
    const dups = drafts.filter((d) => d.status === "dup");
    if (dups.length) {
      setError("本班有重複學號，請先修正再儲存");
      return;
    }
    const pairs = drafts
      .filter((d) => normalizeCode(d.code) !== "")
      .map((d) => ({ seat_id: d.seat_id, student_code: normalizeCode(d.code) }));
    if (!pairs.length) {
      setError("尚未填寫任何學號");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${batchesUrl}/${batchId}/pair-seats`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ pairs }),
      });
      const json = await res.json();
      if (!json?.ok && !(json.paired_existing || json.paired_new)) {
        setError(json?.message || "配對失敗");
        return;
      }
      setToast(json.message || "已儲存配對");
      await loadSeats(batchId, activeClass);
      void loadBatches();
      // Offer next class
      const idx = classStats.findIndex((c) => c.class_name === activeClass);
      if (idx >= 0 && idx < classStats.length - 1) {
        setToast((t) => `${t || ""} · 可前往下一班 ${classStats[idx + 1].class_name}`);
      }
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  };

  const onFile = async (f: File | null) => {
    if (!f) return;
    setFile(f);
    setError(null);
    setBusy(true);
    setResult(null);
    setFlatDone(null);
    setFlatSummary(null);
    try {
      const ext = f.name.split(".").pop()?.toLowerCase() || "";
      if (ext === "xlsx" || ext === "xls") {
        const fd = new FormData();
        fd.append("file", f);
        const res = await fetch(analyzeUrl, { method: "POST", credentials: "include", body: fd });
        const json = await res.json();
        if (!json?.ok) {
          setError(json?.message || "分析失敗");
          return;
        }
        if (json.is_mark_sheet) {
          setMode("mark_sheet");
          setSheets(json.sheets || []);
          setStats({
            total_sheets: json.total_sheets || 0,
            total_seats: json.total_seats || 0,
            blank_names: json.blank_names || 0,
            gender_m: json.gender_m || 0,
            gender_f: json.gender_f || 0,
          });
          if (json.academic_year) setYear(json.academic_year);
          setStep(1);
          return;
        }
      }
      // Flat roster path
      setMode("flat");
      const fd = new FormData();
      fd.append("file", f);
      fd.append("module", "students");
      const res = await fetch(parseUrl, { method: "POST", credentials: "include", body: fd });
      const json = await res.json();
      if (!json?.ok) {
        setError(json?.message || "解析失敗");
        return;
      }
      const maps = (json.mapping || json.mappings || []).map((m: any) => ({
        csvHeader: m.csvHeader || m.header || "",
        targetField: m.targetField || m.target || "ignore",
      }));
      setFlatMappings(maps);
      setStep(1);
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  };

  const onExecuteMarksheet = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(executeUrl, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ academic_year: year }),
      });
      const json = await res.json();
      if (!json?.ok) {
        setError(json?.message || "匯入失敗");
        return;
      }
      setResult(json);
      setStep(4);
      void loadBatches();
      if (json.batch_id) {
        await openPairing(Number(json.batch_id));
      }
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  };

  const onFlatValidate = async () => {
    setBusy(true);
    setError(null);
    try {
      const mapping = flatMappings.map((m) => ({
        csvHeader: m.csvHeader,
        targetField: m.targetField || "ignore",
      }));
      const res = await fetch(validateUrl, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ module: "students", mapping }),
      });
      const json = await res.json();
      if (!json?.ok) {
        setError(json?.message || "校驗失敗");
        return;
      }
      setFlatSummary(json);
      setStep(2);
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  };

  const onFlatExecute = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(flatExecuteUrl, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ module: "students", academic_year: year }),
      });
      const json = await res.json();
      if (!json?.ok) {
        setError(json?.message || "寫入失敗");
        return;
      }
      setFlatDone(json);
      setStep(3);
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  };

  const activeMeta = useMemo(
    () => classStats.find((c) => c.class_name === activeClass),
    [classStats, activeClass],
  );

  const card: React.CSSProperties = {
    background: "#fff", border: `1px solid ${C.border}`, borderRadius: ERP.radius.lg,
    padding: isMobile ? 14 : 18, fontFamily: F,
  };

  const statusBadge = (st: DraftRow["status"]) => {
    const map: Record<string, { bg: string; color: string; label: string }> = {
      paired: { bg: "#DCFCE7", color: "#15803D", label: "已配對" },
      existing: { bg: "#DCFCE7", color: "#15803D", label: "🟢 匹配現有學生" },
      new: { bg: "#DBEAFE", color: "#1D4ED8", label: "🔵 查無此號（將新建）" },
      unpaired: { bg: "#FEF3C7", color: "#B45309", label: "🟡 未配對（暫存 tmp）" },
      dup: { bg: "#FEE2E2", color: "#B91C1C", label: "🔴 學號重複" },
    };
    const m = map[st] || map.unpaired;
    return (
      <span style={{
        fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
        background: m.bg, color: m.color, whiteSpace: "nowrap",
      }}>{m.label}</span>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, fontFamily: F }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        {mode === "mark_sheet" && (
          <WizardStepper
            step={step}
            maxReachable={Math.max(step, stats ? 1 : 0)}
            onJump={(n) => setStep(n)}
            steps={[
              { n: 1, label: "1 上傳與學年" },
              { n: 2, label: "2 班別概覽" },
              { n: 3, label: "3 匯入預覽" },
              { n: 4, label: "4 完成 & 配對" },
            ]}
          />
        )}
        {mode === "flat" && (
          <div style={{ fontSize: 12, fontWeight: 700, color: C.textSecondary }}>標準名冊匯入（Flat Roster）</div>
        )}
        <button type="button" onClick={() => setShowHistory((v) => !v)} style={{
          marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 6,
          border: `1px solid ${C.border}`, background: "#fff", borderRadius: 8, padding: "6px 10px",
          fontSize: 12, fontWeight: 600, cursor: "pointer", color: C.textSecondary,
        }}>
          <History size={14} /> 歷史批次 / 繼續配對學號
        </button>
      </div>

      {error && (
        <div style={{ ...card, background: "#FEF2F2", borderColor: "#FECACA", color: "#B91C1C", fontSize: 13, display: "flex", gap: 8 }}>
          <AlertTriangle size={16} /> <span>{error}</span>
        </div>
      )}
      {toast && (
        <div style={{ ...card, background: "#F0FDF4", borderColor: "#BBF7D0", color: "#15803D", fontSize: 13 }}>
          {toast}
        </div>
      )}

      {showHistory && (
        <div style={card}>
          <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 10 }}>歷史 Mark Sheet 批次</div>
          {batches.length === 0 ? (
            <div style={{ fontSize: 12, color: C.textMuted }}>尚無批次</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {batches.slice(0, 15).map((b) => (
                <div key={String(b.id)} style={{
                  display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center",
                  padding: "8px 10px", borderRadius: 8, background: "#F8FAFC", border: `1px solid ${C.border}`,
                }}>
                  <span style={{ fontFamily: ERP.font.mono, fontSize: 11 }}>#{String(b.id)}</span>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>{String(b.academic_year)}</span>
                  <span style={{ fontSize: 11 }}>
                    已配對 {String(b.paired_seats || 0)} / {String(b.total_seats || 0)}
                  </span>
                  <span style={{ fontSize: 11, color: C.textMuted }}>{String(b.source_filename || "")}</span>
                  <button type="button" onClick={() => void openPairing(Number(b.id))}
                    style={{
                      marginLeft: "auto", fontSize: 11, fontWeight: 700,
                      border: `1px solid ${C.border}`, background: "#fff", borderRadius: 6,
                      padding: "4px 8px", cursor: "pointer",
                    }}>
                    繼續配對學號
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upload (idle / mark sheet step 1 / flat start) */}
      {(mode === "idle" || (mode === "mark_sheet" && step === 1) || (mode === "flat" && step === 1 && !flatMappings.length)) && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={card}>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>Step 1 · 上傳學生檔案</div>
            <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 10 }}>
              支援 24 頁 School Mark Sheet（.xlsx）或標準 WebSAMS / eClass 名冊（CSV / XLSX）
            </div>
            <FileDropZone
              accept=".csv,.xlsx,.xls"
              busy={busy}
              label={file ? file.name : "拖放或點擊上傳學生名冊"}
              hint="支援 .csv · .xls · .xlsx"
              icon={<UploadCloud size={28} color={C.accent} />}
              onFiles={(files) => void onFile(files[0] || null)}
            />
            {busy && (
              <div style={{ marginTop: 8, fontSize: 12, color: C.textMuted }}>
                <RefreshCw size={12} style={{ display: "inline" }} /> 分析中…
              </div>
            )}
          </div>
          <div style={{ ...card, background: "#EFF6FF", borderColor: "#BFDBFE" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 800, fontSize: 13, color: "#1D4ED8" }}>
              <Shield size={16} /> 目標學年（與 2025/26 Demo 隔離）
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
            </div>
          </div>
        </div>
      )}

      {/* Mark sheet steps */}
      {mode === "mark_sheet" && stats && step >= 1 && (
        <>
          {step === 1 && (
            <div style={card}>
              <div style={{ fontWeight: 800, marginBottom: 8 }}>已偵測 School Mark Sheet</div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 10 }}>
                {[
                  ["工作表", String(stats.total_sheets)],
                  ["座位", String(stats.total_seats)],
                  ["空白姓名", String(stats.blank_names)],
                  ["性別 M/F", `${stats.gender_m} / ${stats.gender_f}`],
                ].map(([k, v]) => (
                  <div key={k} style={{ background: "#F8FAFC", borderRadius: 8, padding: 10, border: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: 10, color: C.textMuted }}>{k}</div>
                    <div style={{ fontSize: 18, fontWeight: 800 }}>{v}</div>
                  </div>
                ))}
              </div>
              <WizardActionBar
                onNext={() => setStep(2)}
                nextLabel="下一步：檢視預覽"
                onConfirm={() => void onExecuteMarksheet()}
                confirmLabel="🚀 立即確認匯入"
                confirmBusy={busy}
                confirmDisabled={busy}
              />
            </div>
          )}

          {step === 2 && (
            <div style={card}>
              <div style={{ fontWeight: 800, marginBottom: 10 }}>Step 2 · 24 班概覽（班主任／課室／人數）</div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: "#F8FAFC", textAlign: "left" }}>
                      {["班別", "課室", "班主任", "人數"].map((h) => (
                        <th key={h} style={{ padding: "8px 10px", borderBottom: `1px solid ${C.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sheets.map((s) => (
                      <tr key={s.class_name}>
                        <td style={{ padding: "8px 10px", fontWeight: 700 }}>{s.class_name}</td>
                        <td style={{ padding: "8px 10px" }}>{s.room || "—"}</td>
                        <td style={{ padding: "8px 10px" }}>{s.form_teacher_text || "—"}</td>
                        <td style={{ padding: "8px 10px" }}>{s.seat_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <WizardActionBar
                onBack={() => setStep(1)}
                onNext={() => setStep(3)}
                nextLabel="下一步：匯入預覽"
                onConfirm={() => void onExecuteMarksheet()}
                confirmLabel="🚀 立即確認匯入"
                confirmBusy={busy}
                confirmDisabled={busy}
              />
            </div>
          )}

          {step === 3 && (
            <div style={card}>
              <div style={{ fontWeight: 800, marginBottom: 8 }}>Step 3 · 匯入預覽</div>
              <div style={{ fontSize: 13, marginBottom: 10 }}>
                將建立 <strong>{stats.total_seats}</strong> 個暫存座位（tmp-…），學年{" "}
                <strong>{year}</strong>，並寫入課室／班主任文字。匯入後可立即配對真實學號。
              </div>
              <WizardActionBar
                onBack={() => setStep(2)}
                onConfirm={() => void onExecuteMarksheet()}
                confirmLabel="🚀 確認寫入資料庫"
                confirmBusy={busy}
                confirmDisabled={busy}
              />
            </div>
          )}

          {step === 4 && result && (
            <div style={card}>
              <div style={{ fontWeight: 800, color: "#15803D", display: "flex", gap: 8, alignItems: "center" }}>
                <CheckCircle2 size={18} /> 匯入完成
              </div>
              <div style={{ fontSize: 13, marginTop: 8 }}>
                批次 #{String(result.batch_id)} ·{" "}
                {String((result.summary as any)?.total_seats ?? "")} 座位 ·{" "}
                新建班別 {String((result.summary as any)?.new_classes_created ?? 0)}
              </div>
              <button type="button" onClick={() => result.batch_id && void openPairing(Number(result.batch_id))}
                style={{
                  marginTop: 12, display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "8px 14px", borderRadius: 8, border: "none",
                  background: C.primary, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer",
                }}>
                開啟學號配對工作台
              </button>
            </div>
          )}
        </>
      )}

      {/* Flat roster */}
      {mode === "flat" && flatMappings.length > 0 && step === 1 && (
        <div style={card}>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>標準名冊 · 欄位映射</div>
          <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 8 }}>
            目標學年：<strong>{year}</strong>（寫入時套用至未指定學年的列）
          </div>
          <div style={{ maxHeight: 280, overflow: "auto" }}>
            {flatMappings.map((m, i) => (
              <div key={i} style={{
                display: "flex", gap: 8, alignItems: "center", padding: "6px 0",
                borderBottom: `1px solid ${C.border}`, fontSize: 12,
              }}>
                <span style={{ flex: 1, fontWeight: 600 }}>{m.csvHeader}</span>
                <select
                  value={m.targetField}
                  onChange={(e) => {
                    const v = e.target.value;
                    setFlatMappings((prev) => prev.map((x, j) => j === i ? { ...x, targetField: v } : x));
                  }}
                  style={{ padding: "4px 8px", borderRadius: 6, border: `1px solid ${C.border}` }}
                >
                  {["ignore", "student_code", "name_zh", "name_en", "class_name", "class_no", "gender", "academic_year"].map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <button type="button" disabled={busy} onClick={() => void onFlatValidate()}
            style={{
              marginTop: 12, padding: "8px 14px", borderRadius: 8, border: "none",
              background: C.primary, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer",
            }}>
            校驗並繼續
          </button>
        </div>
      )}

      {mode === "flat" && step === 2 && flatSummary && (
        <div style={card}>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>校驗摘要</div>
          <pre style={{ fontSize: 11, background: "#F8FAFC", padding: 10, borderRadius: 8, overflow: "auto" }}>
            {JSON.stringify({
              valid: flatSummary.valid_rows ?? flatSummary.valid,
              invalid: flatSummary.invalid_rows ?? flatSummary.invalid,
              warnings: flatSummary.warnings,
            }, null, 2)}
          </pre>
          <button type="button" disabled={busy} onClick={() => void onFlatExecute()}
            style={{
              marginTop: 10, padding: "8px 14px", borderRadius: 8, border: "none",
              background: C.primary, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer",
            }}>
            寫入資料庫（學年 {year}）
          </button>
        </div>
      )}

      {mode === "flat" && step === 3 && flatDone && (
        <div style={{ ...card, background: "#F0FDF4", borderColor: "#BBF7D0" }}>
          <div style={{ fontWeight: 800, color: "#15803D" }}>標準名冊匯入完成</div>
          <div style={{ fontSize: 13, marginTop: 6 }}>
            新增 {String(flatDone.inserted ?? 0)} · 更新 {String(flatDone.updated ?? 0)} · 略過 {String(flatDone.skipped ?? 0)}
          </div>
        </div>
      )}

      {/* Pairing Modal */}
      {pairingOpen && batchId && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 80, background: "rgba(15,23,42,0.45)",
          display: "flex", alignItems: isMobile ? "stretch" : "center", justifyContent: "center",
          padding: isMobile ? 0 : 20,
        }}>
          <div style={{
            background: "#fff", borderRadius: isMobile ? 0 : 16, width: "min(1100px, 100%)",
            maxHeight: isMobile ? "100%" : "92vh", display: "flex", flexDirection: "column",
            fontFamily: F, overflow: "hidden",
          }}>
            <div style={{
              padding: "14px 16px", borderBottom: `1px solid ${C.border}`,
              display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
            }}>
              <div style={{ fontWeight: 800, fontSize: 15 }}>班別學號配對工作台</div>
              <div style={{ fontSize: 12, color: C.textMuted }}>
                {batchMeta?.academic_year} · 已配對 {batchMeta?.paired_seats ?? 0} / {batchMeta?.total_seats ?? 0} 人
              </div>
              <div style={{
                flex: 1, minWidth: 120, height: 8, background: "#E2E8F0", borderRadius: 999, overflow: "hidden",
              }}>
                <div style={{
                  width: `${batchMeta && batchMeta.total_seats
                    ? Math.round((batchMeta.paired_seats / batchMeta.total_seats) * 100) : 0}%`,
                  height: "100%", background: C.primary,
                }} />
              </div>
              <button type="button" onClick={() => setPairingOpen(false)}
                style={{ border: "none", background: "transparent", cursor: "pointer", padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            <div style={{
              padding: "10px 12px", borderBottom: `1px solid ${C.border}`,
              display: "flex", gap: 6, flexWrap: "wrap", overflowX: "auto",
            }}>
              {classStats.map((c) => {
                const done = c.paired >= c.total && c.total > 0;
                const on = c.class_name === activeClass;
                return (
                  <button key={c.class_name} type="button" onClick={() => void switchClass(c.class_name)}
                    style={{
                      padding: "5px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, cursor: "pointer",
                      border: `1px solid ${on ? C.primary : C.border}`,
                      background: on ? C.primary : done ? "#DCFCE7" : "#fff",
                      color: on ? "#fff" : done ? "#15803D" : C.textPrimary,
                      whiteSpace: "nowrap",
                    }}>
                    {c.class_name} {c.paired}/{c.total}{done ? " ✅" : ""}
                  </button>
                );
              })}
            </div>

            {activeMeta && (
              <div style={{
                padding: "8px 16px", fontSize: 12, color: C.textSecondary,
                background: "#F8FAFC", borderBottom: `1px solid ${C.border}`,
              }}>
                班別：{activeMeta.class_name} · 課室：{activeMeta.room || "—"} · 班主任：{activeMeta.form_teacher_text || "—"}
              </div>
            )}

            <div style={{ padding: "8px 16px", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <button type="button" onClick={() => setPasteOpen((v) => !v)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 10px",
                  borderRadius: 8, border: `1px solid ${C.border}`, background: "#fff",
                  fontSize: 12, fontWeight: 700, cursor: "pointer",
                }}>
                <ClipboardPaste size={14} /> 批次貼上整班學號 (Excel)
              </button>
              <button
                type="button"
                disabled={autoGenBusy || unpairedActive <= 0 || !activeClass}
                onClick={() => void runAutoGenerate("class")}
                title="僅為本班未配對座位生成學號（不覆蓋已配對）"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px",
                  borderRadius: 8, border: "1px solid #A5B4FC",
                  background: unpairedActive > 0 ? "#EEF2FF" : "#F1F5F9",
                  color: unpairedActive > 0 ? "#3730A3" : C.textMuted,
                  fontSize: 12, fontWeight: 800, cursor: unpairedActive > 0 ? "pointer" : "not-allowed",
                  opacity: autoGenBusy ? 0.7 : 1,
                }}
              >
                <Zap size={14} /> 生成本班學號 ({activeClass || "—"})
                {unpairedActive > 0 ? ` · ${unpairedActive}` : ""}
              </button>
              <button
                type="button"
                disabled={autoGenBusy || unpairedTotal <= 0}
                onClick={() => setAutoGenConfirm(true)}
                title="一鍵為全部未配對座位隨機生成永久學號"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px",
                  borderRadius: 8, border: "none",
                  background: unpairedTotal > 0
                    ? "linear-gradient(135deg, #059669, #2563EB)"
                    : "#94A3B8",
                  color: "#fff",
                  fontSize: 12, fontWeight: 800,
                  cursor: unpairedTotal > 0 ? "pointer" : "not-allowed",
                  boxShadow: unpairedTotal > 0 ? "0 2px 8px rgba(37,99,235,0.28)" : "none",
                  opacity: autoGenBusy ? 0.75 : 1,
                }}
              >
                {autoGenBusy
                  ? <><RefreshCw size={14} /> 生成中…</>
                  : <><Dices size={14} /> 一鍵隨機生成全部學號 · 剩餘 {unpairedTotal} 人</>}
              </button>
            </div>

            {autoGenProgress && (
              <div style={{
                margin: "0 16px 8px", padding: "10px 12px", borderRadius: 8,
                background: "#EFF6FF", border: "1px solid #BFDBFE",
                fontSize: 12, fontWeight: 700, color: "#1D4ED8",
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <RefreshCw size={14} /> {autoGenProgress}
              </div>
            )}

            {autoGenConfirm && (
              <div style={{
                margin: "0 16px 10px", padding: 14, borderRadius: 10,
                background: "#FFFBEB", border: "1px solid #FDE68A",
              }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#92400E", marginBottom: 6 }}>
                  確認一鍵生成全部永久學號？
                </div>
                <div style={{ fontSize: 11.5, color: "#78350F", lineHeight: 1.55, marginBottom: 10 }}>
                  規則：{cohortRuleLine}
                  <br />
                  僅補全未配對座位（剩餘 <strong>{unpairedTotal}</strong> 人），不覆蓋已配對學生；各級內隨機打散至 A/B/C/D。
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button type="button" disabled={autoGenBusy}
                    onClick={() => void runAutoGenerate("all")}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px",
                      borderRadius: 8, border: "none", background: "#059669", color: "#fff",
                      fontWeight: 800, fontSize: 12, cursor: "pointer",
                    }}>
                    <Dices size={14} /> 確認生成 {unpairedTotal} 人
                  </button>
                  <button type="button" disabled={autoGenBusy}
                    onClick={() => setAutoGenConfirm(false)}
                    style={{
                      padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`,
                      background: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer",
                    }}>
                    取消
                  </button>
                </div>
              </div>
            )}

            {pasteOpen && (
              <div style={{ padding: "0 16px 10px" }}>
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder={"從 Excel 貼上一欄學號，或「班號\\t學號」兩欄…"}
                  rows={5}
                  style={{
                    width: "100%", fontFamily: ERP.font.mono, fontSize: 12,
                    border: `1px solid ${C.border}`, borderRadius: 8, padding: 10, resize: "vertical",
                  }}
                />
                <button type="button"
                  onClick={() => {
                    applyCodesFrom(0, parsePasteBlock(pasteText));
                    setPasteOpen(false);
                    setPasteText("");
                  }}
                  style={{
                    marginTop: 6, padding: "6px 12px", borderRadius: 8, border: "none",
                    background: C.primary, color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer",
                  }}>
                  套用至本班名單
                </button>
              </div>
            )}

            <div style={{ flex: 1, overflow: "auto", padding: "0 12px 12px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "#F8FAFC", textAlign: "left", position: "sticky", top: 0 }}>
                    {["班號", "性別", "姓名", "學生編號", "狀態"].map((h) => (
                      <th key={h} style={{ padding: "8px 6px", borderBottom: `1px solid ${C.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {drafts.map((d, idx) => (
                    <tr key={d.seat_id}>
                      <td style={{ padding: "6px", fontWeight: 700, width: 48 }}>#{d.class_number}</td>
                      <td style={{ padding: "6px", width: 40 }}>{d.gender || "—"}</td>
                      <td style={{ padding: "6px", minWidth: 80, color: d.name_display === "待補資料" ? C.textMuted : C.textPrimary }}>
                        {d.name_display}
                      </td>
                      <td style={{ padding: "6px", position: "relative", minWidth: 160 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <Search size={12} color={C.textMuted} />
                          <input
                            value={d.code}
                            onChange={(e) => onDraftChange(d.seat_id, e.target.value)}
                            onPaste={(e) => onPasteSeat(idx, e)}
                            onFocus={() => setActiveSearchSeat(d.seat_id)}
                            placeholder="貼上或搜尋學號…"
                            style={{
                              flex: 1, padding: "6px 8px", borderRadius: 6,
                              border: `1px solid ${d.status === "dup" ? "#FCA5A5" : C.border}`,
                              fontFamily: ERP.font.mono, fontSize: 12,
                            }}
                          />
                        </div>
                        {activeSearchSeat === d.seat_id && (searchHits[d.seat_id] || []).length > 0 && (
                          <div style={{
                            position: "absolute", left: 6, right: 6, top: "100%", zIndex: 5,
                            background: "#fff", border: `1px solid ${C.border}`, borderRadius: 8,
                            boxShadow: "0 8px 24px rgba(0,0,0,0.12)", maxHeight: 180, overflow: "auto",
                          }}>
                            {searchHits[d.seat_id].map((h) => (
                              <button key={h.student_pk} type="button"
                                onClick={() => {
                                  onDraftChange(d.seat_id, h.student_id);
                                  setActiveSearchSeat(null);
                                  void lookupCode(d.seat_id, h.student_id);
                                }}
                                style={{
                                  display: "block", width: "100%", textAlign: "left", padding: "8px 10px",
                                  border: "none", background: "transparent", cursor: "pointer", fontSize: 11,
                                }}>
                                <strong style={{ fontFamily: ERP.font.mono }}>{h.student_id}</strong>
                                {" · "}{h.name_display}
                                {h.hint ? <div style={{ color: C.textMuted }}>{h.hint}</div> : null}
                              </button>
                            ))}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "6px" }}>{statusBadge(d.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{
              padding: "12px 16px", borderTop: `1px solid ${C.border}`,
              display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center",
            }}>
              <button type="button" disabled={busy} onClick={() => void saveClassPairing()}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px",
                  borderRadius: 8, border: "none", background: C.primary, color: "#fff",
                  fontWeight: 700, fontSize: 13, cursor: busy ? "wait" : "pointer",
                }}>
                <Save size={14} /> 儲存本班配對 ({activeClass})
              </button>
              {(() => {
                const idx = classStats.findIndex((c) => c.class_name === activeClass);
                const next = idx >= 0 ? classStats[idx + 1] : null;
                return next ? (
                  <button type="button" onClick={() => void switchClass(next.class_name)}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 12px",
                      borderRadius: 8, border: `1px solid ${C.border}`, background: "#fff",
                      fontWeight: 600, fontSize: 12, cursor: "pointer",
                    }}>
                    下一班 {next.class_name} <ArrowRight size={14} />
                  </button>
                ) : null;
              })()}
              <button type="button" onClick={() => setPairingOpen(false)}
                style={{
                  marginLeft: "auto", padding: "8px 12px", borderRadius: 8,
                  border: `1px solid ${C.border}`, background: "#fff", fontSize: 12, cursor: "pointer",
                }}>
                關閉
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
