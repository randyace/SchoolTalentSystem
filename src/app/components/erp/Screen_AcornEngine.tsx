// Screen_AcornEngine.tsx — 1.G.0 ACORN Algorithm & Parameters Engine (unified single page)
// ALL numbers from AcornEngineService::getEngineManifest() — never hardcoded demo values.
import React, { useEffect, useMemo, useState } from "react";
import {
  Activity, AlertTriangle, BookOpen, CheckCircle2, ChevronRight, Cpu, FileText,
  Filter, RefreshCw, Save, Search, Settings2, Sparkles, Terminal, X, Zap,
} from "lucide-react";
import { ERP } from "./erpTokens";

type ManifestModule = {
  id: string;
  title_zh: string;
  title_en: string;
  category_badge: string;
  formula_tag: string;
  bucket: string;
  stats: Array<{ label: string; value: string | number; warn?: boolean }>;
  warning?: string | null;
  href?: string;
};

type ManifestAnomaly = {
  severity: string;
  module: string;
  code: string;
  message: string;
  href?: string;
  count?: number;
};

type ManifestParams = {
  weight_academic: number;
  weight_engagement: number;
  saturation_k: number;
  bonus_t3_multiplier: number;
  bonus_points_divisor: number;
  bonus_max_cap: number;
  conduct_offset_min: number;
  conduct_offset_max: number;
  engine_version: string;
};

export type AcornEngineManifest = {
  academic_year: string;
  engine_version: string;
  status: string;
  params: ManifestParams;
  formulas: Record<string, string>;
  dimensions: Array<{
    key: string; virtue_zh: string; legacy_zh: string; badge: string; pill?: string;
    en: string; color: string; bg: string; border: string;
  }>;
  modules: ManifestModule[];
  anomalies: ManifestAnomaly[];
  kpis: {
    engine_label: string;
    engine_sub: string;
    total_inputs: number;
    total_inputs_break: Record<string, number>;
    total_inputs_break_zh?: Array<{ key: string; label: string; value: number }>;
    anomaly_count: number;
    students: number;
    snapshots: number;
    missing_snapshots: number;
    coverage_pct?: number;
    last_recalc_at?: string | null;
  };
  students: Array<{ id: number; student_id: string; name_zh: string; name_en: string; label: string }>;
  default_student_id?: number | null;
  troubleshooting: string[];
  contract_sla?: { title: string; summary: string; clauses: string[] };
};

type DiagnosePayload = {
  ok?: boolean;
  student?: { name_zh: string; student_id: string; id?: number };
  dimensions: Array<{
    key: string; virtue_zh: string; legacy_zh: string; badge: string; color: string;
    A_d: number; X_d: number; E_d: number; delta_C: number; final: number;
    status: string; diagnosis: string;
  }>;
};

type Props = {
  manifest?: AcornEngineManifest | null;
  initialDiagnosis?: DiagnosePayload | null;
  academicYear?: string;
  manifestUrl?: string;
  updateUrl?: string;
  recalcUrl?: string;
  autoBindUrl?: string;
  diagnoseUrl?: string;
  csrfName?: string;
  csrfHash?: string;
};

const D = {
  pageBg: ERP.colors.pageBg,
  surface: ERP.colors.surface,
  surfaceAlt: "#F8FAFC",
  border: ERP.colors.border,
  text1: ERP.colors.textPrimary,
  text2: ERP.colors.textSecondary,
  text3: ERP.colors.textMuted,
  text4: "#94A3B8",
  accent: ERP.colors.accent,
  accentLight: ERP.colors.accentPale,
  accentBd: ERP.colors.accentLight,
  green: ERP.colors.green,
  greenBg: ERP.colors.greenLight,
  greenBd: "#86EFAC",
  amber: ERP.colors.amber,
  amberBg: ERP.colors.amberLight,
  amberBd: "#FDE68A",
  red: ERP.colors.red,
  redBg: ERP.colors.redLight,
  radius: ERP.radius.lg,
  shadow: ERP.shadow.sm,
  font: ERP.font.family,
  mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
};

const MODULE_FORMULA_KEY: Record<string, string> = {
  subjects: "academic",
  assessments: "academic",
  scores: "academic",
  activities: "raw_x",
  achievements: "raw_x",
  clubs: "raw_x",
  pbl: "raw_x",
  tiers: "bonus",
  roles: "raw_x",
  conduct: "conduct",
};

const FORMULA_BLOCKS: Array<{ key: string; title: string }> = [
  { key: "final", title: "FinalScore_d" },
  { key: "academic", title: "A_d (Academic)" },
  { key: "raw_x", title: "X_d (Raw Activity)" },
  { key: "saturated", title: "SaturatedActivity" },
  { key: "bonus", title: "PointBonusFactor" },
  { key: "engagement", title: "E_d (Engagement)" },
  { key: "conduct", title: "ΔC_d (Conduct)" },
];

const bucketColor = (bucket: string) => {
  if (bucket === "academic") return { bg: "#DBEAFE", color: "#1D4ED8", bd: "#BFDBFE" };
  if (bucket === "engagement") return { bg: "#DCFCE7", color: "#15803D", bd: "#BBF7D0" };
  if (bucket === "conduct") return { bg: "#FFEDD5", color: "#C2410C", bd: "#FED7AA" };
  return { bg: "#EDE9FE", color: "#6D28D9", bd: "#DDD6FE" };
};

async function postJson(url: string, body: Record<string, unknown>, csrfName?: string, csrfHash?: string) {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  };
  if (csrfName && csrfHash) headers[csrfName] = csrfHash;
  if (csrfHash) headers["X-CSRF-TOKEN"] = csrfHash;
  const res = await fetch(url, {
    method: "POST",
    credentials: "same-origin",
    headers,
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.ok === false) throw new Error(json?.message || `HTTP ${res.status}`);
  return json;
}

export const Screen_AcornEngine: React.FC<Props> = ({
  manifest: initialManifest = null,
  initialDiagnosis = null,
  academicYear,
  manifestUrl = "/admin/acorn-engine/manifest",
  updateUrl = "/admin/acorn-engine/update-params",
  recalcUrl = "/admin/acorn-engine/recalculate-all",
  autoBindUrl = "/admin/acorn-engine/auto-bind-weights",
  diagnoseUrl = "/admin/acorn-engine/diagnose-student",
  csrfName,
  csrfHash,
}) => {
  const [manifest, setManifest] = useState<AcornEngineManifest | null>(initialManifest);
  const [year, setYear] = useState(academicYear || initialManifest?.academic_year || "2025/26");
  const [filter, setFilter] = useState("");
  const [selectedMod, setSelectedMod] = useState<string | null>(initialManifest?.modules?.[0]?.id ?? null);
  const [paramsDraft, setParamsDraft] = useState<ManifestParams | null>(initialManifest?.params ?? null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showContract, setShowContract] = useState(false);
  const [studentId, setStudentId] = useState<number | "">(
    initialManifest?.default_student_id
    || initialDiagnosis?.student?.id
    || initialManifest?.students?.[0]?.id
    || ""
  );
  const [diag, setDiag] = useState<DiagnosePayload | null>(
    initialDiagnosis && Array.isArray(initialDiagnosis.dimensions) ? initialDiagnosis : null
  );
  const [diagBusy, setDiagBusy] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 900);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (!initialManifest) return;
    setManifest(initialManifest);
    setParamsDraft(initialManifest.params);
    setSelectedMod(initialManifest.modules?.[0]?.id ?? null);
    const def = initialManifest.default_student_id || initialManifest.students?.[0]?.id;
    if (def) setStudentId(def);
  }, [initialManifest]);

  // Auto-run diagnosis on load if bridge did not preload one
  useEffect(() => {
    if (diag) return;
    const id = typeof studentId === "number" ? studentId : 0;
    if (!id) return;
    void runDiagnose(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  const reloadManifest = async (y = year) => {
    const res = await fetch(`${manifestUrl}?year=${encodeURIComponent(y)}`, {
      credentials: "same-origin",
      headers: { Accept: "application/json" },
    });
    const json = await res.json();
    if (json?.params) {
      setManifest(json as AcornEngineManifest);
      setParamsDraft(json.params);
      if (!selectedMod && json.modules?.[0]) setSelectedMod(json.modules[0].id);
    }
    return json as AcornEngineManifest;
  };

  const modules = useMemo(() => {
    const list = manifest?.modules ?? [];
    const q = filter.trim().toLowerCase();
    if (!q) return list;
    return list.filter(m =>
      m.title_zh.toLowerCase().includes(q)
      || m.title_en.toLowerCase().includes(q)
      || m.formula_tag.toLowerCase().includes(q)
    );
  }, [manifest, filter]);

  const selected = modules.find(m => m.id === selectedMod) || modules[0] || null;
  const highlightKey = selected ? (MODULE_FORMULA_KEY[selected.id] || "final") : "final";
  const anomalyCount = manifest?.anomalies?.length ?? 0;
  const p = paramsDraft || manifest?.params;
  const coveragePct = manifest?.kpis?.coverage_pct
    ?? (manifest?.kpis?.students
      ? Math.round(((manifest.kpis.snapshots || 0) / Math.max(1, manifest.kpis.students)) * 1000) / 10
      : 0);
  const breakZh = manifest?.kpis?.total_inputs_break_zh
    ?? Object.entries(manifest?.kpis?.total_inputs_break || {}).map(([key, value]) => ({
      key,
      label: key,
      value: Number(value || 0),
    }));
  const brTotal = breakZh.reduce((a, b) => a + Number(b.value || 0), 0) || 1;
  const barColor: Record<string, string> = {
    scores: "#2563EB", activities: "#16A34A", achievements: "#D97706",
    clubs: "#7C3AED", pbl: "#EA580C", conduct: "#0D9488",
  };

  const saveParams = async (alsoRecalc: boolean) => {
    if (!paramsDraft) return;
    setBusy(true);
    try {
      const json = await postJson(updateUrl, { ...paramsDraft, academic_year: year, recalculate: alsoRecalc }, csrfName, csrfHash);
      showToast(json.message || "參數已儲存");
      await reloadManifest(year);
    } catch (e) {
      showToast((e as Error).message || "儲存失敗");
    } finally {
      setBusy(false);
    }
  };

  const recalcAll = async () => {
    if (!window.confirm(`確定對全校學生重算 ${year} ACORN 快照？此操作可能需時數分鐘。`)) return;
    setBusy(true);
    try {
      const json = await postJson(recalcUrl, { academic_year: year }, csrfName, csrfHash);
      showToast(json.message || "重算完成");
      await reloadManifest(year);
      if (typeof studentId === "number") await runDiagnose(studentId);
    } catch (e) {
      showToast((e as Error).message || "重算失敗");
    } finally {
      setBusy(false);
    }
  };

  const autoBind = async () => {
    if (!window.confirm("將為未設定權重的科目／評估／活動補齊預設 ACORN 權重，並觸發全校快照重算。繼續？")) return;
    setBusy(true);
    try {
      const json = await postJson(autoBindUrl, { academic_year: year, recalculate: true }, csrfName, csrfHash);
      showToast(json.message || "權重已補齊");
      if (json.manifest) {
        setManifest(json.manifest);
        setParamsDraft(json.manifest.params);
      } else {
        await reloadManifest(year);
      }
      if (typeof studentId === "number") await runDiagnose(studentId);
    } catch (e) {
      showToast((e as Error).message || "自動補齊失敗");
    } finally {
      setBusy(false);
    }
  };

  const runDiagnose = async (sid?: number) => {
    const id = sid ?? (typeof studentId === "number" ? studentId : 0);
    if (!id) return;
    setDiagBusy(true);
    try {
      const res = await fetch(`${diagnoseUrl}/${id}?year=${encodeURIComponent(year)}`, {
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      });
      const json = await res.json();
      if (!res.ok || json?.ok === false) throw new Error(json?.message || "診斷失敗");
      setDiag(json);
      setStudentId(id);
    } catch (e) {
      showToast((e as Error).message || "診斷失敗");
    } finally {
      setDiagBusy(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%", background: D.pageBg, fontFamily: D.font }}>
      <style>{`
        @keyframes toastUp { from { transform: translateX(-50%) translateY(10px); opacity: 0; } to { transform: translateX(-50%) translateY(0); opacity: 1; } }
        @keyframes statusPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.55; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes formulaGlow { from { box-shadow: 0 0 0 0 rgba(88,166,255,0.0); } to { box-shadow: 0 0 0 1px rgba(88,166,255,0.35); } }
      `}</style>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div style={{ background: D.surface, borderBottom: `1px solid ${D.border}`, flexShrink: 0 }}>
        {!isMobile && (
          <div style={{ height: 40, display: "flex", alignItems: "center", padding: "0 24px", gap: 5, fontSize: 11, borderBottom: `1px solid ${D.border}`, background: D.surfaceAlt }}>
            {["首頁", "系統管理", "系統參數設定", "ACORN 演算法與係數引擎"].map((c, i, arr) => (
              <React.Fragment key={c}>
                {i > 0 && <ChevronRight size={12} color={D.text4} />}
                <span style={{ color: i === arr.length - 1 ? D.text2 : D.text4, fontWeight: i === arr.length - 1 ? 700 : 400 }}>{c}</span>
              </React.Fragment>
            ))}
            <div style={{ marginLeft: "auto", display: "flex", gap: 7 }}>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", background: D.accentLight, color: D.accent, border: `1px solid ${D.accentBd}`, borderRadius: 5, fontFamily: D.mono }}>1.G.0</span>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", background: "#0D1117", color: "#7EE787", border: "1px solid #30363D", borderRadius: 5, fontFamily: D.mono }}>Mod D · SSOT</span>
            </div>
          </div>
        )}

        <div style={{ minHeight: 64, display: "flex", alignItems: "center", padding: isMobile ? "12px 16px" : "10px 24px", gap: 14, flexWrap: "wrap" }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10, flexShrink: 0,
            background: "linear-gradient(135deg, #0F172A, #1E3A8A)",
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "1px solid #334155",
          }}>
            <Cpu size={18} color="#93C5FD" />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: isMobile ? 15 : 17, fontWeight: 800, color: D.text1 }}>
              ACORN 演算法與係數引擎
              <span style={{ fontSize: 12, fontWeight: 600, color: D.text3, marginLeft: 8 }}>System Parameters & Formula Engine</span>
            </div>
            {!isMobile && (
              <div style={{ fontSize: 11, color: D.text4, marginTop: 2, maxWidth: 760 }}>
                定義全人六育（德、智、體、群、美、靈）複合非線性演算法、模組權重分配與數據異常診斷 · 合約條款 5.3.5 (Mod D) 剛性規格
              </div>
            )}
          </div>
          <select
            value={year}
            onChange={async (e) => {
              const y = e.target.value;
              setYear(y);
              setBusy(true);
              try {
                const m = await reloadManifest(y);
                const def = m?.default_student_id || m?.students?.[0]?.id;
                if (def) await runDiagnose(Number(def));
              } finally { setBusy(false); }
            }}
            style={{ padding: "7px 10px", borderRadius: 8, border: `1px solid ${D.border}`, fontSize: 12, fontFamily: D.font, background: "#fff" }}
          >
            {[year, "2025/26", "2024/25", "2023/24"].filter((v, i, a) => a.indexOf(v) === i).map(y => (
              <option key={y} value={y}>AY {y}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setShowContract(true)}
            style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: D.text3, padding: "7px 12px", borderRadius: 8, border: `1px solid ${D.border}`, background: D.surface, cursor: "pointer", fontFamily: D.font }}
          >
            <FileText size={13} /> 契約演算法規格說明
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={recalcAll}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 9, border: "none",
              background: "linear-gradient(135deg, #0F172A, #1E293B)", color: "#E2E8F0", fontSize: 12, fontWeight: 700,
              cursor: busy ? "wait" : "pointer", fontFamily: D.font,
            }}
          >
            <RefreshCw size={13} color="#7DD3FA" style={busy ? { animation: "spin 0.8s linear infinite" } : undefined} />
            全校快照強制重算
          </button>
        </div>
      </div>

      {/* ── KPI row ───────────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 14, padding: isMobile ? "12px 16px 0" : "16px 24px 0" }}>
        {/* Card 1 */}
        <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: D.radius, padding: "14px 18px", boxShadow: D.shadow }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: D.greenBg, border: `1px solid ${D.greenBd}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CheckCircle2 size={18} color={D.green} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: D.green, boxShadow: `0 0 0 3px ${D.greenBd}`, animation: "statusPulse 2s ease-in-out infinite" }} />
                <span style={{ fontSize: 13, fontWeight: 800, color: D.text1 }}>{manifest?.kpis?.engine_label || "Engine v2.4 Operational"}</span>
              </div>
              <div style={{ fontSize: 11, color: D.green, fontWeight: 700, marginTop: 2 }}>{manifest?.kpis?.engine_sub || "100% 同步運作中 · 單一真理來源"}</div>
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", background: D.greenBg, color: D.green, border: `1px solid ${D.greenBd}`, borderRadius: 5 }}>Mod D 合規</span>
          </div>
          <div style={{ fontSize: 11, color: D.text3, lineHeight: 1.5, paddingTop: 8, borderTop: `1px solid ${ERP.colors.divider}` }}>
            <div>本學年快照覆蓋率: <b style={{ color: D.text1 }}>{manifest?.kpis?.snapshots ?? 0} / {manifest?.kpis?.students ?? 0}</b> 名學生 ({coveragePct}%)</div>
            <div style={{ marginTop: 2 }}>最後全校結算: <b style={{ color: D.text1, fontFamily: D.mono }}>{manifest?.kpis?.last_recalc_at || "尚未執行"}</b></div>
          </div>
        </div>

        {/* Card 2 */}
        <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: D.radius, padding: "14px 18px", boxShadow: D.shadow }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <Activity size={14} color={D.accent} />
            <span style={{ fontSize: 11.5, fontWeight: 700, color: D.text2 }}>全校有效計分數據總量</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: D.text1, fontFamily: D.mono, marginBottom: 8 }}>
            {(manifest?.kpis?.total_inputs ?? 0).toLocaleString()}
          </div>
          <div style={{ display: "flex", height: 6, borderRadius: 999, overflow: "hidden", background: "#E2E8F0" }}>
            {breakZh.map(b => (
              <div key={b.key} title={`${b.label}: ${b.value}`} style={{ width: `${(Number(b.value) / brTotal) * 100}%`, background: barColor[b.key] || "#94A3B8" }} />
            ))}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
            {breakZh.map(b => (
              <span key={b.key} style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: D.surfaceAlt, border: `1px solid ${D.border}`, color: D.text2 }}>
                {b.label}: <b style={{ color: D.text1 }}>{b.value}</b>
              </span>
            ))}
          </div>
        </div>

        {/* Card 3 — anomalies + auto-fix */}
        <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: D.radius, padding: "14px 18px", boxShadow: D.shadow, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <AlertTriangle size={14} color={anomalyCount > 0 ? D.amber : D.green} />
              <span style={{ fontSize: 11.5, fontWeight: 700, color: D.text2 }}>配置健康與異常</span>
            </div>
            <span style={{ fontSize: 20, fontWeight: 900, color: anomalyCount > 0 ? D.amber : D.green, fontFamily: D.mono }}>{anomalyCount}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1 }}>
            {(manifest?.anomalies ?? []).length === 0 && (
              <div style={{ fontSize: 11, color: D.green, fontWeight: 600 }}>• 未偵測到配置異常</div>
            )}
            {(manifest?.anomalies ?? []).slice(0, 4).map((a, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 11, color: D.text3 }}>
                <span style={{ flex: 1 }}>• {a.message}</span>
                {a.href && (
                  <a href={a.href} style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, color: D.accent, textDecoration: "none", whiteSpace: "nowrap" }}>
                    前往修正 →
                  </a>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={autoBind}
            style={{
              marginTop: 4, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "8px 12px", borderRadius: 8, border: `1px solid ${D.amberBd}`,
              background: D.amberBg, color: "#92400E", fontSize: 12, fontWeight: 800,
              cursor: busy ? "wait" : "pointer", fontFamily: D.font,
            }}
          >
            <Zap size={13} /> 一鍵自動補齊預設權重
          </button>
        </div>
      </div>

      {/* ── Main workspace ────────────────────────────────────────────────── */}
      <div style={{
        flex: 1, display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "340px 1fr",
        gap: 16, padding: isMobile ? "12px 16px 28px" : "16px 24px 32px",
        alignItems: "start",
      }}>
        {/* LEFT modules */}
        <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: D.radius, overflow: "hidden", boxShadow: D.shadow }}>
          <div style={{ padding: "12px 14px", borderBottom: `1px solid ${D.border}`, display: "flex", alignItems: "center", gap: 8 }}>
            <Sparkles size={14} color={D.accent} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: D.text1 }}>十大影響因素與數據源</div>
              <div style={{ fontSize: 10, color: D.text4 }}>10 Impact Modules</div>
            </div>
          </div>
          <div style={{ padding: "10px 12px", borderBottom: `1px solid ${D.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 10px", borderRadius: 8, border: `1px solid ${D.border}`, background: "#FAFBFC" }}>
              <Filter size={13} color={D.text4} />
              <input
                value={filter}
                onChange={e => setFilter(e.target.value)}
                placeholder="篩選模組..."
                style={{ border: "none", outline: "none", flex: 1, fontSize: 12, background: "transparent", fontFamily: D.font }}
              />
            </div>
          </div>
          <div style={{ maxHeight: isMobile ? "none" : "calc(100vh - 320px)", overflowY: "auto" }}>
            {modules.map(m => {
              const active = selected?.id === m.id;
              const bc = bucketColor(m.bucket);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMod(m.id)}
                  style={{
                    width: "100%", textAlign: "left", border: "none", cursor: "pointer", fontFamily: D.font,
                    padding: "12px 14px", borderBottom: `1px solid ${ERP.colors.divider}`,
                    background: active ? "#EFF6FF" : D.surface,
                    borderLeft: `3px solid ${active ? D.accent : "transparent"}`,
                  }}
                >
                  <div style={{ display: "flex", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 999, background: bc.bg, color: bc.color, border: `1px solid ${bc.bd}` }}>
                      {m.category_badge}
                    </span>
                    {m.warning && (
                      <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 999, background: D.amberBg, color: D.amber, border: `1px solid ${D.amberBd}` }}>
                        ⚠️ {m.warning}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: D.text1 }}>{m.title_zh}</div>
                  <div style={{ fontSize: 10, color: D.text4, marginTop: 1 }}>{m.title_en}</div>
                  <div style={{ marginTop: 6, fontSize: 10, fontFamily: D.mono, color: D.accent, background: D.accentLight, display: "inline-block", padding: "2px 7px", borderRadius: 5 }}>
                    {m.formula_tag}
                  </div>
                  <div style={{ marginTop: 8, fontSize: 11, color: D.text3 }}>
                    {m.stats.slice(0, 3).map(s => (
                      <span key={s.label} style={{ marginRight: 10 }}>
                        📊 {s.label}: <b style={{ color: s.warn ? D.amber : D.text1 }}>{String(s.value)}</b>
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
          {/* Core params */}
          <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: D.radius, padding: "16px 18px", boxShadow: D.shadow }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
              <Settings2 size={15} color={D.accent} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 800 }}>核心比重與飽和常數設定</div>
                <div style={{ fontSize: 10, color: D.text4 }}>Core Weights & Constants · live SSOT</div>
              </div>
              <button type="button" disabled={busy || !paramsDraft} onClick={() => saveParams(false)}
                style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, border: `1px solid ${D.border}`, background: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: D.font }}>
                <Save size={12} /> 儲存參數
              </button>
              <button type="button" disabled={busy || !paramsDraft} onClick={() => saveParams(true)}
                style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, border: "none", background: D.accent, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: D.font }}>
                <RefreshCw size={12} /> 儲存並全校重算
              </button>
            </div>

            {paramsDraft && (
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 12 }}>
                {([
                  ["weight_academic", "學業基數比重 A_d", 0, 1, 0.01, `${(paramsDraft.weight_academic * 100).toFixed(0)}%`],
                  ["weight_engagement", "多元活動比重 E_d", 0, 1, 0.01, `${(paramsDraft.weight_engagement * 100).toFixed(0)}%`],
                  ["saturation_k", "飽和常數 K", 50, 2000, 10, String(paramsDraft.saturation_k)],
                  ["bonus_t3_multiplier", "T3 領導加成", 0, 0.2, 0.01, `+${(paramsDraft.bonus_t3_multiplier * 100).toFixed(1)}%`],
                  ["bonus_max_cap", "最高加成上限", 0, 0.5, 0.01, `+${(paramsDraft.bonus_max_cap * 100).toFixed(0)}%`],
                  ["bonus_points_divisor", "積點加成除數", 1000, 100000, 100, String(paramsDraft.bonus_points_divisor)],
                ] as const).map(([key, label, min, max, step, display]) => (
                  <label key={key} style={{ display: "flex", flexDirection: "column", gap: 6, padding: "10px 12px", borderRadius: 10, border: `1px solid ${D.border}`, background: "#FAFBFC" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, color: D.text2 }}>
                      <span>{label}</span>
                      <span style={{ fontFamily: D.mono, color: D.accent }}>{display}</span>
                    </div>
                    <input
                      type="range" min={min} max={max} step={step} value={paramsDraft[key]}
                      onChange={e => setParamsDraft({ ...paramsDraft, [key]: Number(e.target.value) })}
                    />
                  </label>
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 14 }}>
              {(manifest?.dimensions ?? []).map(d => (
                <span key={d.key} style={{ fontSize: 11, fontWeight: 800, padding: "4px 10px", borderRadius: 999, background: d.bg, color: d.color, border: `1px solid ${d.border}` }}>
                  {d.badge || d.pill || `${d.virtue_zh} · ${d.en}`}
                </span>
              ))}
            </div>
          </div>

          {/* Dark formula inspector */}
          <div style={{
            background: "#0D1117", borderRadius: D.radius, padding: "16px 18px",
            border: "1px solid #30363D", boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
            fontFamily: D.mono, color: "#E6EDF3",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <Terminal size={14} color="#7EE787" />
              <span style={{ fontSize: 12, fontWeight: 800, color: "#7EE787" }}>{`< >`} 契約演算法與實時公式透視</span>
              <span style={{ marginLeft: "auto", fontSize: 10, color: "#8B949E" }}>Live Formula · v{p?.engine_version}</span>
            </div>
            {FORMULA_BLOCKS.map(block => {
              const active = block.key === highlightKey;
              return (
                <div
                  key={block.key}
                  style={{
                    marginBottom: 10,
                    padding: "8px 10px",
                    borderRadius: 8,
                    borderLeft: `3px solid ${active ? "#58A6FF" : "transparent"}`,
                    background: active ? "rgba(56,139,253,0.12)" : "transparent",
                    animation: active ? "formulaGlow 0.35s ease-out" : undefined,
                  }}
                >
                  <div style={{ fontSize: 10, color: active ? "#79C0FF" : "#58A6FF", fontWeight: 700, marginBottom: 2 }}>{block.title}</div>
                  <div style={{ fontSize: 11.5, color: "#E6EDF3", lineHeight: 1.45, whiteSpace: "pre-wrap" }}>
                    {manifest?.formulas?.[block.key] || "—"}
                  </div>
                </div>
              );
            })}
            {selected && (
              <div style={{ marginTop: 4, paddingTop: 10, borderTop: "1px solid #30363D", fontSize: 11, color: "#8B949E" }}>
                選中模組 · <span style={{ color: "#FFA657" }}>{selected.title_zh}</span> · {selected.formula_tag}
                {" · "}
                {selected.stats.map(s => `${s.label} ${s.value}`).join(" · ")}
                {selected.href && <a href={selected.href} style={{ marginLeft: 10, color: "#58A6FF" }}>開啟模組 →</a>}
              </div>
            )}
            {/* SLA footer */}
            <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 8, background: "rgba(126,231,135,0.08)", border: "1px solid rgba(126,231,135,0.25)", fontSize: 11, color: "#7EE787", lineHeight: 1.5, fontFamily: D.font }}>
              <b>{manifest?.contract_sla?.title || "契約 SLA 鎖定參數 · 條款 5.3.5 (Mod D)"}</b>
              <div style={{ color: "#A7F3D0", marginTop: 4, fontWeight: 400 }}>
                {manifest?.contract_sla?.summary || "Single Source of Truth — AcornEngineService ↔ 本頁 100% 同步。"}
              </div>
            </div>
          </div>

          {/* Troubleshooting */}
          <div style={{ background: "#FFF7ED", border: "1px solid #FDBA74", borderRadius: D.radius, padding: "14px 16px", boxShadow: D.shadow }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8, fontSize: 13, fontWeight: 800, color: "#9A3412" }}>
              <BookOpen size={14} /> 教師除錯指南 Troubleshooting Guide
            </div>
            <ol style={{ margin: 0, paddingLeft: 18, color: "#9A3412", fontSize: 12, lineHeight: 1.55 }}>
              {(manifest?.troubleshooting ?? []).map((t, i) => <li key={i} style={{ marginBottom: 4 }}>{t}</li>)}
            </ol>
          </div>

          {/* Student debugger — always visible, preloaded */}
          <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: D.radius, overflow: "hidden", boxShadow: D.shadow }}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${D.border}`, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", background: "#FAFCFF" }}>
              <Search size={14} color={D.accent} />
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ fontSize: 13, fontWeight: 800 }}>個別學生計分拆解與問題診斷器</div>
                <div style={{ fontSize: 10, color: D.text4 }}>Interactive Student Score Debugger & Anomaly Log</div>
              </div>
              <select
                value={studentId}
                onChange={e => {
                  const id = e.target.value ? Number(e.target.value) : "";
                  setStudentId(id);
                  if (id) void runDiagnose(id);
                }}
                style={{ minWidth: 220, padding: "7px 10px", borderRadius: 8, border: `1px solid ${D.border}`, fontSize: 12, fontFamily: D.font }}
              >
                <option value="">選擇學生…</option>
                {(manifest?.students ?? []).map(s => (
                  <option key={s.id} value={s.id}>{s.label || `${s.name_zh} ${s.student_id}`}</option>
                ))}
              </select>
              <button
                type="button"
                disabled={!studentId || diagBusy}
                onClick={() => runDiagnose()}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 8,
                  border: "none", background: D.accent, color: "#fff", fontSize: 12, fontWeight: 700,
                  cursor: !studentId || diagBusy ? "not-allowed" : "pointer", fontFamily: D.font, opacity: !studentId ? 0.6 : 1,
                }}
              >
                <Cpu size={13} style={diagBusy ? { animation: "spin 0.8s linear infinite" } : undefined} />
                重新診斷
              </button>
            </div>

            {diagBusy && !diag ? (
              <div style={{ padding: "28px 20px", textAlign: "center", color: D.text4, fontSize: 12 }}>載入診斷中…</div>
            ) : !diag ? (
              <div style={{ padding: "28px 20px", textAlign: "center", color: D.text4, fontSize: 12 }}>尚未載入學生診斷。</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <div style={{ padding: "10px 16px", fontSize: 12, color: D.text3, borderBottom: `1px solid ${ERP.colors.divider}` }}>
                  診斷對象：<b style={{ color: D.text1 }}>{diag.student?.name_zh}</b> · {diag.student?.student_id} · AY {year}
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: "#F8FAFC", textAlign: "left" }}>
                      {["維度", "學業基數 A_d (50%)", "原始 X_d → 飽和 E_d (50%)", "行為修正 ΔC_d", "最終得分", "診斷狀態與問題提示"].map(h => (
                        <th key={h} style={{ padding: "10px 12px", borderBottom: `1px solid ${D.border}`, color: D.text3, fontWeight: 700, whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {diag.dimensions.map(r => (
                      <tr key={r.key}>
                        <td style={{ padding: "12px", borderBottom: `1px solid ${ERP.colors.divider}`, fontWeight: 800, color: r.color }}>
                          {r.badge || `${r.virtue_zh} · ${r.legacy_zh}`}
                        </td>
                        <td style={{ padding: "12px", borderBottom: `1px solid ${ERP.colors.divider}`, fontFamily: D.mono }}>{r.A_d.toFixed(1)}</td>
                        <td style={{ padding: "12px", borderBottom: `1px solid ${ERP.colors.divider}`, fontFamily: D.mono }}>
                          {r.X_d.toFixed(1)} → <b>{r.E_d.toFixed(1)}</b>
                        </td>
                        <td style={{ padding: "12px", borderBottom: `1px solid ${ERP.colors.divider}`, fontFamily: D.mono, color: r.delta_C < 0 ? D.red : r.delta_C > 0 ? D.green : D.text3 }}>
                          {r.delta_C > 0 ? `+${r.delta_C.toFixed(1)}` : r.delta_C.toFixed(1)}
                        </td>
                        <td style={{ padding: "12px", borderBottom: `1px solid ${ERP.colors.divider}`, fontFamily: D.mono, fontWeight: 900, fontSize: 14 }}>
                          {r.final.toFixed(1)}
                        </td>
                        <td style={{ padding: "12px", borderBottom: `1px solid ${ERP.colors.divider}`, color: D.text2, maxWidth: 360 }}>
                          <span style={{
                            display: "inline-block", fontSize: 10, fontWeight: 800, padding: "2px 7px", borderRadius: 999, marginRight: 6,
                            background: r.status === "healthy" ? D.greenBg : r.status === "zero" ? D.redBg : D.amberBg,
                            color: r.status === "healthy" ? D.green : r.status === "zero" ? D.red : D.amber,
                          }}>
                            {r.status === "healthy" ? "正常" : r.status === "zero" ? "零分" : r.status === "watch" ? "觀察" : "偏低"}
                          </span>
                          {r.diagnosis}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contract modal */}
      {showContract && (
        <div
          role="dialog"
          style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", zIndex: 80, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={() => setShowContract(false)}
        >
          <div
            style={{ width: "min(640px, 100%)", maxHeight: "85vh", overflow: "auto", background: D.surface, borderRadius: 14, boxShadow: "0 24px 64px rgba(0,0,0,0.35)", border: `1px solid ${D.border}` }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: "14px 18px", borderBottom: `1px solid ${D.border}`, display: "flex", alignItems: "center", gap: 10 }}>
              <FileText size={16} color={D.accent} />
              <div style={{ flex: 1, fontSize: 14, fontWeight: 800 }}>{manifest?.contract_sla?.title || "契約條款 5.3.5 (Mod D)"}</div>
              <button type="button" onClick={() => setShowContract(false)} style={{ border: "none", background: "none", cursor: "pointer", color: D.text3 }}><X size={16} /></button>
            </div>
            <div style={{ padding: "16px 18px", fontSize: 13, color: D.text2, lineHeight: 1.65 }}>
              <p>{manifest?.contract_sla?.summary}</p>
              <ul style={{ paddingLeft: 18 }}>
                {(manifest?.contract_sla?.clauses ?? []).map((c, i) => <li key={i} style={{ marginBottom: 6 }}>{c}</li>)}
              </ul>
              <div style={{ marginTop: 12, padding: 12, borderRadius: 10, background: "#0D1117", color: "#7EE787", fontFamily: D.mono, fontSize: 11 }}>
                Engine v{p?.engine_version} · A_d={((p?.weight_academic ?? 0.5) * 100).toFixed(0)}% · E_d={((p?.weight_engagement ?? 0.5) * 100).toFixed(0)}% · K={p?.saturation_k} · T3+{((p?.bonus_t3_multiplier ?? 0) * 100).toFixed(1)}% · Cap+{((p?.bonus_max_cap ?? 0) * 100).toFixed(0)}%
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{
          position: "fixed", left: "50%", bottom: 28, transform: "translateX(-50%)",
          background: "#0F172A", color: "#F8FAFC", padding: "10px 16px", borderRadius: 10,
          fontSize: 12, fontWeight: 700, boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
          animation: "toastUp 0.2s ease-out", zIndex: 90,
        }}>
          {toast}
        </div>
      )}
    </div>
  );
};

export default Screen_AcornEngine;
