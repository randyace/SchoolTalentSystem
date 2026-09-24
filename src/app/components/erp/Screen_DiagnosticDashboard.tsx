// ─────────────────────────────────────────────────────────────────────────────
// Screen: 自適應偏誤校正引擎 — Master Recalibration Dashboard (Tender Module 2)
// Fully data-driven: subject dropdown switch triggers complete UI recalibration.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useMemo, useEffect } from "react";
import {
  RefreshCw, AlertTriangle, ChevronDown, ChevronRight,
  TrendingUp, Sparkles, Edit3, CheckCircle2, Activity,
  Brain, Settings2, Cpu, Wand2, FlaskConical,
} from "lucide-react";
import { ERP } from "./erpTokens";

/* ══════════════════════════════════════════════════════════════════════════════
   BELL CURVE  —  pure maths helpers, no React state
══════════════════════════════════════════════════════════════════════════════ */
function normalPDF(x: number, mu: number, sigma: number): number {
  return Math.exp(-0.5 * ((x - mu) / sigma) ** 2) / (sigma * Math.sqrt(2 * Math.PI));
}

const BELL = { X_MIN: 14, X_MAX: 106, SVG_W: 400, SVG_H: 170, PLOT_L: 32, PLOT_R: 388, PLOT_B: 148, PLOT_T: 12, Y_MAX: 0.048 } as const;
const bX = (x: number) => BELL.PLOT_L + ((x - BELL.X_MIN) / (BELL.X_MAX - BELL.X_MIN)) * (BELL.PLOT_R - BELL.PLOT_L);
const bY = (y: number) => BELL.PLOT_B - (y / BELL.Y_MAX) * (BELL.PLOT_B - BELL.PLOT_T);

function makeBell(mu: number, sigma: number, steps = 140) {
  const pts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const x = BELL.X_MIN + (BELL.X_MAX - BELL.X_MIN) * (i / steps);
    pts.push(`${bX(x).toFixed(1)},${bY(normalPDF(x, mu, sigma)).toFixed(1)}`);
  }
  const line = `M ${pts.join(" L ")}`;
  return {
    line,
    fill: `${line} L ${bX(BELL.X_MAX).toFixed(1)},${BELL.PLOT_B} L ${bX(BELL.X_MIN).toFixed(1)},${BELL.PLOT_B} Z`,
  };
}

const BellCurveChart: React.FC<{ rawMu: number; rawSigma: number; targetMu: number; targetSigma?: number }> = ({
  rawMu, rawSigma, targetMu, targetSigma = 10,
}) => {
  const raw    = useMemo(() => makeBell(rawMu, rawSigma),       [rawMu, rawSigma]);
  const target = useMemo(() => makeBell(targetMu, targetSigma), [targetMu, targetSigma]);
  const rawMuX = bX(rawMu), targetMuX = bX(targetMu);
  const xLabels = [20, 40, rawMu, targetMu, 80, 100]
    .filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b);
  return (
    <svg viewBox={`0 0 ${BELL.SVG_W} ${BELL.SVG_H}`} width="100%" style={{ display: "block", overflow: "visible" }}>
      <rect x={BELL.PLOT_L} y={BELL.PLOT_T} width={BELL.PLOT_R - BELL.PLOT_L} height={BELL.PLOT_B - BELL.PLOT_T} fill="#F8FAFC" rx="4" />
      {[0.25, 0.5, 0.75, 1.0].map((f) => (
        <line key={f} x1={BELL.PLOT_L} y1={bY(BELL.Y_MAX * f)} x2={BELL.PLOT_R} y2={bY(BELL.Y_MAX * f)}
          stroke="#E2E8F0" strokeWidth="0.8" strokeDasharray="3 3" />
      ))}
      {/* fills first so strokes are on top */}
      <path d={raw.fill}    fill="#FEE2E2" opacity="0.55" />
      <path d={target.fill} fill="#DCFCE7" opacity="0.55" />
      {/* mean markers */}
      <line x1={rawMuX}    y1={BELL.PLOT_T} x2={rawMuX}    y2={BELL.PLOT_B} stroke="#DC2626" strokeWidth="1.5" strokeDasharray="5 3" opacity="0.85" />
      <line x1={targetMuX} y1={BELL.PLOT_T} x2={targetMuX} y2={BELL.PLOT_B} stroke="#16A34A" strokeWidth="1.5" opacity="0.85" />
      {/* curves */}
      <path d={raw.line}    fill="none" stroke="#DC2626" strokeWidth="2"   strokeDasharray="6 4" />
      <path d={target.line} fill="none" stroke="#16A34A" strokeWidth="2.5" />
      {/* μ labels */}
      <text x={rawMuX - 4}    y={BELL.PLOT_T - 3} fill="#DC2626" fontSize="9" fontWeight="700" textAnchor="end">μ={rawMu}</text>
      <text x={targetMuX + 4} y={BELL.PLOT_T - 3} fill="#16A34A" fontSize="9" fontWeight="700" textAnchor="start">μ={targetMu}</text>
      {/* baseline */}
      <line x1={BELL.PLOT_L} y1={BELL.PLOT_B} x2={BELL.PLOT_R} y2={BELL.PLOT_B} stroke="#CBD5E1" strokeWidth="1" />
      {/* x-axis */}
      {xLabels.map((v) => (
        <text key={v} x={bX(v)} y={BELL.PLOT_B + 11} textAnchor="middle" fontSize="9"
          fill={v === rawMu ? "#DC2626" : v === targetMu ? "#16A34A" : "#94A3B8"}
          fontWeight={v === rawMu || v === targetMu ? "700" : "400"}>{v}</text>
      ))}
      {/* legend */}
      <g transform={`translate(${BELL.PLOT_L + 8}, ${BELL.PLOT_T + 6})`}>
        <rect width="80" height="32" rx="4" fill="white" opacity="0.9" />
        <line x1="6" y1="10" x2="22" y2="10" stroke="#DC2626" strokeWidth="1.8" strokeDasharray="5 3" />
        <text x="26" y="13" fontSize="8" fill="#DC2626" fontWeight="600">原始 Raw</text>
        <line x1="6" y1="22" x2="22" y2="22" stroke="#16A34A" strokeWidth="2.2" />
        <text x="26" y="25" fontSize="8" fill="#16A34A" fontWeight="600">期望 Target</text>
      </g>
    </svg>
  );
};

/* ══════════════════════════════════════════════════════════════════════════════
   SUBJECT CONFIG  —  all subject-specific data lives here
   Adding a new subject = adding one entry to SUBJECT_CFG
══════════════════════════════════════════════════════════════════════════════ */
type RowStatus = "synced" | "normal" | "bias";

interface CatRow {
  key:      string;
  label:    string;
  labelEn:  string;
  rawMean:  number;
  sd:       number;
  baseWgt:  number;
  status:   RowStatus;
}

interface StatChip { label: string; val: string; color: "red" | "green" | "amber" }

interface SubjectCfg {
  parentLabel:     string;
  parentLabelEn:   string;
  parentRawMean:   number;
  parentSD:        number;
  parentAdjMean:   number;          // system-computed master adj mean
  categories:      CatRow[];
  biasKey:         string;          // which child row has bias
  bellRawSigma:    number;          // rawMu is derived from biasRow.rawMean
  bellTargetMu:    number;
  bellTargetSigma: number;
  defaultMult:     number;          // AI multiplier starting value
  overrideDefault: number;          // manual override input default
  panelSubtitle:   string;
  diagPre:         string;          // narrative text before normType badge
  normType:        string;          // e.g. "常態化微調 (Curve Adjustment)"
  diagPost:        string;          // narrative text after normType badge
  statsChips:      StatChip[];
}

const SUBJECT_CFG: Record<string, SubjectCfg> = {
  "數學": {
    parentLabel: "數學總計", parentLabelEn: "Mathematics Total",
    parentRawMean: 68.5, parentSD: 12.1, parentAdjMean: 72.4,
    categories: [
      { key: "daily",      label: "日常表現", labelEn: "Daily Mark",  rawMean: 75.2, sd: 8.5,  baseWgt: 30, status: "normal" },
      { key: "project",    label: "專題報告", labelEn: "Project",     rawMean: 82.1, sd: 6.2,  baseWgt: 20, status: "normal" },
      { key: "final-exam", label: "期終試",   labelEn: "Final Exam",  rawMean: 55.0, sd: 15.2, baseWgt: 50, status: "bias"   },
    ],
    biasKey: "final-exam",
    bellRawSigma: 15.2, bellTargetMu: 65, bellTargetSigma: 10,
    defaultMult: 1.13, overrideDefault: 62.5,
    panelSubtitle: "F1 數學期終試 · AI Insight — F1 Math Final",
    diagPre:  "中一級 (F1) 數學期終試難度過高。平均分偏低，且標準差過大 (σ=15.2)。相較於中六級 (F6) 需嚴格對齊 DSE 標準，中一級建議啟動",
    normType: "常態化微調 (Curve Adjustment)",
    diagPost: "以維持學習動機。",
    statsChips: [
      { label: "原始平均", val: "55.0",   color: "red"   },
      { label: "歷史基準", val: "65.0",   color: "green" },
      { label: "偏差量",   val: "−10.0",  color: "amber" },
      { label: "標準差",   val: "σ=15.2", color: "red"   },
    ],
  },
  "中國語文": {
    parentLabel: "中文科總計", parentLabelEn: "Chinese Language Total",
    parentRawMean: 74.5, parentSD: 8.2, parentAdjMean: 76.8,
    categories: [
      { key: "reading",   label: "閱讀能力",   labelEn: "Reading",             rawMean: 72.0, sd: 7.1,  baseWgt: 30, status: "normal" },
      { key: "writing",   label: "寫作能力",   labelEn: "Writing",             rawMean: 62.0, sd: 10.5, baseWgt: 30, status: "bias"   },
      { key: "listening", label: "聆聽與綜合", labelEn: "Listening & Synthesis",rawMean: 78.5, sd: 6.4,  baseWgt: 20, status: "normal" },
      { key: "speaking",  label: "說話與日常", labelEn: "Speaking & Daily",     rawMean: 81.0, sd: 5.5,  baseWgt: 20, status: "normal" },
    ],
    biasKey: "writing",
    bellRawSigma: 10.5, bellTargetMu: 68, bellTargetSigma: 9,
    defaultMult: 1.09, overrideDefault: 68.0,
    panelSubtitle: "F1 中文寫作 · AI Insight — F1 Chinese Writing",
    diagPre:  "中一級 (F1) 中文寫作評分存在「嚴格偏誤 (Strict Bias)」。平均分顯著偏低，這可能是由於評卷尺度過緊。建議啟動",
    normType: "向上平準化 (Upward Normalization)",
    diagPost: "調整分數，以反映學生真實寫作能力。",
    statsChips: [
      { label: "原始平均", val: "62.0",   color: "red"   },
      { label: "歷史基準", val: "68.0",   color: "green" },
      { label: "偏差量",   val: "−6.0",   color: "amber" },
      { label: "標準差",   val: "σ=10.5", color: "red"   },
    ],
  },
  "英文": {
    parentLabel: "英文科總計", parentLabelEn: "English Language Total",
    parentRawMean: 71.2, parentSD: 9.8, parentAdjMean: 73.5,
    categories: [
      { key: "reading-en",  label: "閱讀理解", labelEn: "Reading Comprehension", rawMean: 74.0, sd: 8.2, baseWgt: 35, status: "normal" },
      { key: "writing-en",  label: "寫作",     labelEn: "Writing",               rawMean: 60.5, sd: 11.4, baseWgt: 35, status: "bias"   },
      { key: "speaking-en", label: "口語",     labelEn: "Speaking",              rawMean: 79.0, sd: 6.8, baseWgt: 30, status: "normal" },
    ],
    biasKey: "writing-en",
    bellRawSigma: 11.4, bellTargetMu: 67, bellTargetSigma: 9,
    defaultMult: 1.11, overrideDefault: 67.0,
    panelSubtitle: "F1 英文寫作 · AI Insight — F1 English Writing",
    diagPre:  "中一級 (F1) 英文寫作得分偏低，顯示評卷標準過嚴或題目難度過高。平均分未達歷史基準，建議啟動",
    normType: "向上平準化 (Upward Normalization)",
    diagPost: "以反映學生實際英語寫作水平。",
    statsChips: [
      { label: "原始平均", val: "60.5",   color: "red"   },
      { label: "歷史基準", val: "67.0",   color: "green" },
      { label: "偏差量",   val: "−6.5",   color: "amber" },
      { label: "標準差",   val: "σ=11.4", color: "red"   },
    ],
  },
};

const FALLBACK_CFG = SUBJECT_CFG["數學"];

/* ══════════════════════════════════════════════════════════════════════════════
   SHARED UI ATOMS
══════════════════════════════════════════════════════════════════════════════ */
const STATUS_CFG: Record<RowStatus, { label: string; bg: string; color: string; border: string }> = {
  synced: { label: "已同步",  bg: ERP.colors.greenLight,  color: ERP.colors.green,         border: ERP.colors.green  + "40" },
  normal: { label: "正常",    bg: ERP.colors.pageBg,      color: ERP.colors.textSecondary,  border: ERP.colors.border },
  bias:   { label: "偵測偏誤", bg: ERP.colors.amberLight, color: ERP.colors.amber,          border: ERP.colors.amber  + "50" },
};

const CHIP_COLOR: Record<"red" | "green" | "amber", string> = {
  red:   ERP.colors.red,
  green: ERP.colors.green,
  amber: ERP.colors.amber,
};

const selectSt = (w = 130): React.CSSProperties => ({
  padding: "6px 24px 6px 10px", width: w, border: `1px solid ${ERP.colors.border}`,
  borderRadius: ERP.radius.md, fontSize: "12px", fontFamily: ERP.font.family,
  color: ERP.colors.textPrimary, background: ERP.colors.surface, outline: "none",
  appearance: "none", cursor: "pointer",
});

const WeightSlider: React.FC<{ value: number; onChange: (v: number) => void; color?: string }> = ({
  value, onChange, color = ERP.colors.accent,
}) => (
  <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: "108px" }}>
    <input type="range" min={0} max={100} step={5} value={value}
      onChange={(e) => onChange(+e.target.value)}
      style={{ flex: 1, height: "4px", accentColor: color, cursor: "pointer" }} />
    <span style={{ fontSize: "11px", fontWeight: 700, color, background: color + "15",
      border: `1px solid ${color}40`, borderRadius: ERP.radius.full, padding: "1px 6px", whiteSpace: "nowrap" }}>
      {value}%
    </span>
  </div>
);

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════════════ */
export const Screen_DiagnosticDashboard: React.FC<{ lang?: "en" | "zh-HK" }> = () => {
  /* ── global filters ───────────────────────────────────────────────────── */
  const [grade,    setGrade]    = useState("F1");
  const [year,     setYear]     = useState("25/26");
  const [sem,      setSem]      = useState("下學期");
  const [subject,  setSubject]  = useState("數學");
  const [engineOn, setEngineOn] = useState(true);

  /* ── tree state ───────────────────────────────────────────────────────── */
  const [expanded,    setExpanded]    = useState(true);
  const [selectedKey, setSelectedKey] = useState("final-exam");

  /* ── per-row weight sliders (Record<rowKey, wgt%>) ────────────────────── */
  const [weights, setWeights] = useState<Record<string, number>>({ daily: 30, project: 20, "final-exam": 50 });

  /* ── AI panel controls ────────────────────────────────────────────────── */
  const [multiplier,   setMultiplier]   = useState(1.13);
  const [slaMethod,    setSlaMethod]    = useState("scale-up");
  const [aiApplied,    setAiApplied]    = useState(false);
  const [overrideMode, setOverrideMode] = useState(false);

  /* ── hover ────────────────────────────────────────────────────────────── */
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  /* ── subject transition flash ─────────────────────────────────────────── */
  const [flash, setFlash] = useState(false);

  /* ── mobile breakpoint ────────────────────────────────────────────────── */
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  /* ── derive config + reset on subject change ─────────────────────────── */
  const cfg = SUBJECT_CFG[subject] ?? FALLBACK_CFG;

  useEffect(() => {
    // brief opacity flash to signal data swap
    setFlash(true);
    const t = setTimeout(() => setFlash(false), 320);

    // reset all subject-specific state
    const initWeights: Record<string, number> = {};
    cfg.categories.forEach((c) => { initWeights[c.key] = c.baseWgt; });
    setWeights(initWeights);
    setSelectedKey(cfg.biasKey);
    setMultiplier(cfg.defaultMult);
    setAiApplied(false);
    setOverrideMode(false);
    setExpanded(true);

    return () => clearTimeout(t);
  }, [subject]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── derived values ───────────────────────────────────────────────────── */
  const biasRow     = cfg.categories.find((c) => c.key === cfg.biasKey)!;
  const weightTotal = Object.values(weights).reduce((s, v) => s + v, 0);
  const isOverweight = Math.abs(weightTotal - 100) > 1;
  const biasAdjMean = +(biasRow.rawMean * multiplier).toFixed(1);
  const biasRawDelta = +(biasAdjMean - biasRow.rawMean).toFixed(1);

  /* computed parent adj mean = weighted average of all categories */
  const computedParentAdj = +cfg.categories.reduce((sum, c) => {
    const w = (weights[c.key] ?? c.baseWgt) / 100;
    const adj = c.key === cfg.biasKey ? biasAdjMean : c.rawMean;
    return sum + w * adj;
  }, 0).toFixed(1);

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: isMobile ? "auto" : "100%",
      minHeight: isMobile ? "100%" : undefined,
      background: ERP.colors.pageBg, fontFamily: ERP.font.family,
      overflow: isMobile ? "visible" : "hidden",
    }}>

      {/* ══ TOP CONTROL BAR ══════════════════════════════════════════════════ */}
      <div style={{ background: ERP.colors.surface, borderBottom: `1px solid ${ERP.colors.border}`,
        padding: isMobile ? "0 14px" : "0 24px", flexShrink: 0, boxShadow: ERP.shadow.sm }}>

        {/* Title row */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap" as const,
          paddingTop: "12px", paddingBottom: "10px",
          borderBottom: `1px solid ${ERP.colors.divider}`, gap: "10px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: isMobile ? "32px" : "38px", height: isMobile ? "32px" : "38px", borderRadius: ERP.radius.md, flexShrink: 0,
              background: "linear-gradient(135deg, #1D4ED8, #7C3AED)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 8px #2563EB50" }}>
              <Brain size={isMobile ? 15 : 18} color="#fff" />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: isMobile ? "15px" : "18px", fontWeight: 800, color: ERP.colors.textPrimary }}>
                  {isMobile ? "偏誤校正引擎" : "自適應偏誤校正引擎"}
                </span>
                <span style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.08em",
                  background: "linear-gradient(90deg, #1D4ED8, #7C3AED)", color: "#fff",
                  borderRadius: ERP.radius.sm, padding: "2px 8px" }}>M2</span>
              </div>
              {!isMobile && (
                <div style={{ fontSize: "11px", color: ERP.colors.textMuted, marginTop: "1px" }}>
                  Adaptive Bias Correction Engine · 評估權重 × 智能診斷 · 整合平台
                </div>
              )}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" as const }}>
            <button onClick={() => setEngineOn(v => !v)} style={{
              display: "flex", alignItems: "center", gap: "6px", padding: "6px 10px",
              background: engineOn ? ERP.colors.greenLight : ERP.colors.redLight,
              border: `1px solid ${engineOn ? ERP.colors.green + "50" : ERP.colors.red + "50"}`,
              borderRadius: ERP.radius.full, cursor: "pointer", fontFamily: ERP.font.family }}>
              <div style={{ width: "7px", height: "7px", borderRadius: "50%",
                background: engineOn ? ERP.colors.green : ERP.colors.red,
                boxShadow: engineOn ? `0 0 0 3px ${ERP.colors.green}35` : "none" }} />
              <span style={{ fontSize: "11px", fontWeight: 700, color: engineOn ? ERP.colors.green : ERP.colors.red }}>
                {engineOn
                  ? (isMobile ? "引擎運行中" : "Engine Active · Auto-recalibration ON")
                  : "Engine Paused"}
              </span>
            </button>
            <button onClick={() => setAiApplied(false)} style={{
              display: "flex", alignItems: "center", gap: "6px", padding: "8px 12px",
              border: "none", borderRadius: ERP.radius.md,
              background: ERP.colors.accent, color: "#fff",
              cursor: "pointer", fontSize: "12px", fontWeight: 700, fontFamily: ERP.font.family,
              boxShadow: `0 2px 8px ${ERP.colors.accent}45` }}>
              <RefreshCw size={13} />{isMobile ? "重新計算" : "重新計算全校數據"}
            </button>
          </div>
        </div>

        {/* Filter row */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px",
          paddingTop: "10px", paddingBottom: "12px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: ERP.colors.textMuted,
            letterSpacing: "0.06em", marginRight: "4px" }}>全域篩選</span>

          {[
            { label: "學年", value: year,  setter: setYear,  opts: ["25/26","24/25","23/24"], w: 100 },
            { label: "學期", value: sem,   setter: setSem,   opts: ["下學期","上學期"], w: 104 },
          ].map(({ label, value, setter, opts, w }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <span style={{ fontSize: "11px", color: ERP.colors.textMuted, whiteSpace: "nowrap" }}>{label}</span>
              <div style={{ position: "relative" }}>
                <select value={value} onChange={e => setter(e.target.value)} style={selectSt(w)}>
                  {opts.map(o => <option key={o}>{o}</option>)}
                </select>
                <ChevronDown size={11} color={ERP.colors.textMuted} style={{ position: "absolute", right: 7, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              </div>
            </div>
          ))}

          {/* Grade — highlighted */}
          <div style={{ display: "flex", alignItems: "center", gap: "5px",
            padding: "3px 10px 3px 6px",
            background: ERP.colors.accentPale, border: `1.5px solid ${ERP.colors.accent}`,
            borderRadius: ERP.radius.md }}>
            <span style={{ fontSize: "11px", color: ERP.colors.accent, fontWeight: 700 }}>年級</span>
            <div style={{ position: "relative" }}>
              <select value={grade} onChange={e => setGrade(e.target.value)}
                style={{ ...selectSt(118), background: "transparent", border: "none", color: ERP.colors.accent, fontWeight: 700, padding: "4px 22px 4px 4px" }}>
                {[["F1","F1 (中一)"],["F2","F2 (中二)"],["F3","F3 (中三)"],["F4","F4 (中四)"],["F5","F5 (中五)"],["F6","F6 (中六)"]].map(([v,l]) =>
                  <option key={v} value={v}>{l}</option>)}
              </select>
              <ChevronDown size={11} color={ERP.colors.accent} style={{ position: "absolute", right: 3, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            </div>
          </div>

          {/* Subject — the trigger for Frame 2 */}
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <span style={{ fontSize: "11px", color: ERP.colors.textMuted }}>科目</span>
            <div style={{ position: "relative" }}>
              <select value={subject} onChange={e => setSubject(e.target.value)}
                style={{ ...selectSt(116),
                  background: subject !== "數學" ? ERP.colors.purpleLight : ERP.colors.surface,
                  color: subject !== "數學" ? ERP.colors.purple : ERP.colors.textPrimary,
                  fontWeight: subject !== "數學" ? 700 : 400,
                  border: `1px solid ${subject !== "數學" ? ERP.colors.purple + "60" : ERP.colors.border}`,
                }}>
                {["數學","中國語文","英文","科學","歷史"].map(o => <option key={o}>{o}</option>)}
              </select>
              <ChevronDown size={11} color={subject !== "數學" ? ERP.colors.purple : ERP.colors.textMuted}
                style={{ position: "absolute", right: 7, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            </div>
          </div>

          {/* Schema source badge */}
          <div style={{
            display: "flex", alignItems: "center", gap: "5px",
            padding: "3px 9px",
            background: flash ? ERP.colors.purpleLight : ERP.colors.pageBg,
            border: `1px solid ${flash ? ERP.colors.purple + "60" : ERP.colors.border}`,
            borderRadius: ERP.radius.full,
            transition: "all 0.3s",
          }}>
            <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.05em",
              color: flash ? ERP.colors.purple : ERP.colors.textMuted }}>
              {flash ? "⟳ 載入評估架構…" : `Schema: ${cfg.parentLabel}`}
            </span>
          </div>

          {/* Grade mode badge */}
          <div style={{ marginLeft: isMobile ? 0 : "auto", display: "flex", alignItems: "center", gap: "6px",
            padding: "4px 10px",
            background: grade === "F6" ? ERP.colors.amberLight : ERP.colors.purpleLight,
            border: `1px solid ${grade === "F6" ? ERP.colors.amber + "60" : ERP.colors.purple + "40"}`,
            borderRadius: ERP.radius.full }}>
            <FlaskConical size={11} color={grade === "F6" ? ERP.colors.amber : ERP.colors.purple} />
            <span style={{ fontSize: "10px", fontWeight: 700, color: grade === "F6" ? ERP.colors.amber : ERP.colors.purple }}>
              {grade === "F6" ? "F6 DSE嚴格對齊模式" : `${grade} 基礎培育模式 · 常態化微調啟用`}
            </span>
          </div>
        </div>
      </div>

      {/* ══ TWO-COLUMN BODY ══════════════════════════════════════════════════ */}
      <div style={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        gap: "14px",
        flex: isMobile ? "none" : 1,
        minHeight: isMobile ? undefined : 0,
        padding: isMobile ? "12px" : "16px 20px",
        overflow: isMobile ? "visible" : "hidden",
        opacity: flash ? 0.6 : 1, transition: "opacity 0.28s",
      }}>

        {/* ═══ LEFT: Hierarchical Tree-Table ═══════════════════════════════ */}
        <div style={{
          flex: isMobile ? "none" : "0 0 54%",
          display: "flex", flexDirection: "column",
          background: ERP.colors.surface, border: `1px solid ${ERP.colors.border}`,
          borderRadius: ERP.radius.lg,
          overflow: isMobile ? "visible" : "hidden",
          boxShadow: ERP.shadow.card,
        }}>

          {/* Table toolbar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "11px 16px", borderBottom: `2px solid ${ERP.colors.border}`,
            background: "#F8FAFC", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Activity size={14} color={ERP.colors.accent} />
              <span style={{ fontSize: "13px", fontWeight: 800, color: ERP.colors.textPrimary }}>
                階層式權重矩陣
              </span>
              <span style={{ fontSize: "10px", color: ERP.colors.textMuted }}>
                {subject} · {grade} · 學年 {year}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "5px", padding: "3px 10px",
              background: isOverweight ? ERP.colors.redLight : ERP.colors.greenLight,
              border: `1px solid ${isOverweight ? ERP.colors.red + "40" : ERP.colors.green + "40"}`,
              borderRadius: ERP.radius.full }}>
              {isOverweight
                ? <AlertTriangle size={11} color={ERP.colors.red} />
                : <CheckCircle2 size={11} color={ERP.colors.green} />}
              <span style={{ fontSize: "11px", fontWeight: 700, color: isOverweight ? ERP.colors.red : ERP.colors.green }}>
                子項總計: {weightTotal}%
              </span>
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: "auto", overflowY: isMobile ? "visible" : "auto", flex: isMobile ? "none" : 1 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: ERP.font.family, tableLayout: "fixed" }}>
              <colgroup>
                <col style={{ width: "22%" }} /><col style={{ width: "9%" }} />
                <col style={{ width: "8%" }} /><col style={{ width: "8%" }} />
                <col style={{ width: "20%" }} /><col style={{ width: "11%" }} />
                <col style={{ width: "14%" }} />
              </colgroup>
              <thead>
                <tr style={{ background: "#F8FAFC" }}>
                  {["評估類別","原始平均","標準差","基礎權重","自適應權重","校正後平均","狀態"].map((h) => (
                    <th key={h} style={{ padding: "8px 10px",
                      textAlign: h === "狀態" || h === "校正後平均" ? "center" : "left",
                      fontSize: "10px", fontWeight: 800, color: ERP.colors.textSecondary,
                      letterSpacing: "0.05em", textTransform: "uppercase",
                      borderBottom: `2px solid ${ERP.colors.border}`, whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* ── Parent row ─────────────────────────────────────── */}
                {(() => {
                  const sCfg = STATUS_CFG["synced"];
                  return (
                    <tr style={{ background: "#FAFBFC", borderBottom: `1px solid ${ERP.colors.border}` }}>
                      <td style={{ padding: "10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <button onClick={() => setExpanded(v => !v)} style={{
                            width: "18px", height: "18px", flexShrink: 0,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            background: ERP.colors.accentLight, border: `1px solid ${ERP.colors.accentLight}`,
                            borderRadius: ERP.radius.xs, cursor: "pointer" }}>
                            {expanded
                              ? <ChevronDown size={11} color={ERP.colors.accent} />
                              : <ChevronRight size={11} color={ERP.colors.accent} />}
                          </button>
                          <div>
                            <div style={{ fontSize: "13px", fontWeight: 800, color: ERP.colors.textPrimary, whiteSpace: "nowrap" }}>
                              {cfg.parentLabel}
                            </div>
                            <div style={{ fontSize: "10px", color: ERP.colors.textMuted }}>{cfg.parentLabelEn}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "10px", textAlign: "center" }}>
                        <span style={{ fontSize: "13px", fontWeight: 800, color: ERP.colors.textPrimary, fontFamily: ERP.font.mono }}>
                          {cfg.parentRawMean.toFixed(1)}
                        </span>
                      </td>
                      <td style={{ padding: "10px", textAlign: "center" }}>
                        <span style={{ fontSize: "12px", color: ERP.colors.textSecondary, fontFamily: ERP.font.mono }}>
                          {cfg.parentSD.toFixed(1)}
                        </span>
                      </td>
                      <td style={{ padding: "10px", textAlign: "center" }}>
                        <span style={{ fontSize: "11px", fontWeight: 700, background: ERP.colors.pageBg, color: ERP.colors.textSecondary,
                          border: `1px solid ${ERP.colors.border}`, borderRadius: ERP.radius.full, padding: "2px 8px" }}>100%</span>
                      </td>
                      <td style={{ padding: "8px 10px" }}>
                        <span style={{ fontSize: "11px", color: ERP.colors.textMuted }}>—</span>
                      </td>
                      <td style={{ padding: "10px", textAlign: "center" }}>
                        <span style={{ fontSize: "13px", fontWeight: 800, color: ERP.colors.textPrimary, fontFamily: ERP.font.mono }}>
                          {computedParentAdj}
                        </span>
                      </td>
                      <td style={{ padding: "10px", textAlign: "center" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px",
                          padding: "3px 8px", background: sCfg.bg, color: sCfg.color,
                          border: `1px solid ${sCfg.border}`, borderRadius: ERP.radius.full,
                          fontSize: "10px", fontWeight: 700, whiteSpace: "nowrap" }}>
                          <CheckCircle2 size={9} /> {sCfg.label}
                        </span>
                      </td>
                    </tr>
                  );
                })()}

                {/* ── Child rows ─────────────────────────────────────── */}
                {expanded && cfg.categories.map((cat) => {
                  const isBias     = cat.key === cfg.biasKey;
                  const isSelected = selectedKey === cat.key;
                  const isHovered  = hoveredKey  === cat.key;
                  const wgt        = weights[cat.key] ?? cat.baseWgt;
                  const adjVal     = isBias ? biasAdjMean : cat.rawMean;
                  const sCfg       = STATUS_CFG[cat.status];
                  return (
                    <tr key={cat.key}
                      onClick={() => setSelectedKey(cat.key)}
                      onMouseEnter={() => setHoveredKey(cat.key)}
                      onMouseLeave={() => setHoveredKey(null)}
                      style={{
                        background: isSelected ? ERP.colors.accentPale
                          : isHovered ? ERP.colors.surfaceHover : ERP.colors.surface,
                        borderBottom: `1px solid ${ERP.colors.border}`,
                        cursor: "pointer", transition: "background 0.1s",
                        outline: isSelected ? `2px solid ${ERP.colors.accent}` : "none",
                        outlineOffset: "-1px",
                      }}>
                      {/* Category */}
                      <td style={{ padding: "10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", paddingLeft: "14px" }}>
                          <span style={{ color: ERP.colors.textMuted, fontSize: "12px", flexShrink: 0 }}>└</span>
                          <div>
                            <div style={{ fontSize: "12px", fontWeight: 600, color: ERP.colors.textPrimary, whiteSpace: "nowrap" }}>
                              {cat.label}
                            </div>
                            <div style={{ fontSize: "10px", color: ERP.colors.textMuted }}>{cat.labelEn}</div>
                          </div>
                        </div>
                      </td>
                      {/* Raw Mean */}
                      <td style={{ padding: "10px", textAlign: "center" }}>
                        <span style={{ fontSize: "13px", fontWeight: 700, fontFamily: ERP.font.mono,
                          color: isBias ? ERP.colors.red : ERP.colors.textPrimary }}>
                          {cat.rawMean.toFixed(1)}
                        </span>
                      </td>
                      {/* SD */}
                      <td style={{ padding: "10px", textAlign: "center" }}>
                        <span style={{ fontSize: "12px", fontFamily: ERP.font.mono,
                          fontWeight: isBias ? 700 : 400,
                          color: isBias ? ERP.colors.red : ERP.colors.textSecondary }}>
                          {cat.sd.toFixed(1)}
                        </span>
                      </td>
                      {/* Base weight */}
                      <td style={{ padding: "10px", textAlign: "center" }}>
                        <span style={{ fontSize: "11px", fontWeight: 700, background: ERP.colors.pageBg,
                          color: ERP.colors.textSecondary, border: `1px solid ${ERP.colors.border}`,
                          borderRadius: ERP.radius.full, padding: "2px 8px" }}>
                          {cat.baseWgt}%
                        </span>
                      </td>
                      {/* Adaptive slider */}
                      <td style={{ padding: "8px 10px" }}>
                        <WeightSlider
                          value={wgt}
                          onChange={(v) => setWeights(prev => ({ ...prev, [cat.key]: v }))}
                          color={isSelected ? ERP.colors.accent : isBias ? ERP.colors.amber : ERP.colors.teal}
                        />
                      </td>
                      {/* Adj Mean */}
                      <td style={{ padding: "10px", textAlign: "center" }}>
                        {isBias ? (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "3px" }}>
                            <TrendingUp size={12} color={ERP.colors.accent} />
                            <span style={{ fontSize: "13px", fontWeight: 800, color: ERP.colors.accent, fontFamily: ERP.font.mono }}>
                              {adjVal}
                            </span>
                          </div>
                        ) : (
                          <span style={{ fontSize: "13px", fontWeight: 600, color: ERP.colors.textSecondary, fontFamily: ERP.font.mono }}>
                            {adjVal}
                          </span>
                        )}
                      </td>
                      {/* Status */}
                      <td style={{ padding: "10px", textAlign: "center" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px",
                          padding: "3px 8px", background: sCfg.bg, color: sCfg.color,
                          border: `1px solid ${sCfg.border}`, borderRadius: ERP.radius.full,
                          fontSize: "10px", fontWeight: 700, whiteSpace: "nowrap" }}>
                          {cat.status === "bias" && <AlertTriangle size={9} />}
                          {cat.status === "normal" && <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: sCfg.color, display: "inline-block" }} />}
                          {sCfg.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer note */}
          <div style={{ padding: "8px 16px", borderTop: `1px solid ${ERP.colors.border}`,
            background: "#FAFBFC", flexShrink: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            <Cpu size={11} color={ERP.colors.textMuted} />
            <span style={{ fontSize: "10px", color: ERP.colors.textMuted }}>
              拖曳滑桿調整各評估項目加權比例 · 子項權重總計應為 100%
            </span>
            {isOverweight && (
              <span style={{ fontSize: "10px", fontWeight: 700, color: ERP.colors.red, marginLeft: "auto" }}>
                ⚠ 超出 {weightTotal - 100}%
              </span>
            )}
          </div>
        </div>

        {/* ═══ RIGHT: AI Diagnostic Panel ═══════════════════════════════════ */}
        <div style={{
          flex: 1,
          display: "flex", flexDirection: "column",
          background: ERP.colors.surface, border: `1px solid ${ERP.colors.border}`,
          borderRadius: ERP.radius.lg,
          overflow: isMobile ? "visible" : "hidden",
          boxShadow: ERP.shadow.card,
        }}>

          {/* Panel header */}
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${ERP.colors.border}`,
            background: "linear-gradient(135deg, #EFF6FF, #F0FDF4)", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "28px", height: "28px", borderRadius: ERP.radius.sm, flexShrink: 0,
                background: "linear-gradient(135deg, #2563EB, #059669)",
                display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Brain size={14} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 800, color: ERP.colors.textPrimary }}>
                  智能校正洞察
                </div>
                <div style={{ fontSize: "10px", color: ERP.colors.textMuted, transition: "all 0.3s" }}>
                  {cfg.panelSubtitle}
                </div>
              </div>
              <div style={{ marginLeft: "auto" }}>
                <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.08em",
                  background: "#7C3AED15", color: "#7C3AED", border: "1px solid #7C3AED30",
                  borderRadius: ERP.radius.full, padding: "2px 8px" }}>TENDER MOD 2</span>
              </div>
            </div>
          </div>

          {/* Scrollable body */}
          <div style={{ flex: isMobile ? "none" : 1, overflowY: isMobile ? "visible" : "auto", padding: "16px" }}>

            {/* ── Section 1: Bell Curve ──────────────────────────── */}
            <div style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                <Activity size={12} color={ERP.colors.accent} />
                <span style={{ fontSize: "11px", fontWeight: 800, color: ERP.colors.textPrimary,
                  textTransform: "uppercase", letterSpacing: "0.05em" }}>常態分佈圖</span>
                <span style={{ fontSize: "10px", color: ERP.colors.textMuted }}>Bell Curve Analysis</span>
              </div>
              <div style={{ background: ERP.colors.pageBg, border: `1px solid ${ERP.colors.border}`,
                borderRadius: ERP.radius.md, padding: "12px 8px 4px" }}>
                <BellCurveChart
                  rawMu={biasRow.rawMean}
                  rawSigma={cfg.bellRawSigma}
                  targetMu={cfg.bellTargetMu}
                  targetSigma={cfg.bellTargetSigma}
                />
                <div style={{ display: "flex", justifyContent: "center", gap: "16px",
                  padding: "6px 0 4px", borderTop: `1px dashed ${ERP.colors.border}`, marginTop: "4px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <div style={{ width: "18px", height: "2px", borderTop: "2px dashed #DC2626" }} />
                    <span style={{ fontSize: "9px", color: "#DC2626", fontWeight: 600 }}>
                      原始分佈 Raw — μ={biasRow.rawMean}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <div style={{ width: "18px", height: "2.5px", background: "#16A34A", borderRadius: "2px" }} />
                    <span style={{ fontSize: "9px", color: "#16A34A", fontWeight: 600 }}>
                      期望分佈 Target — μ={cfg.bellTargetMu}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Section 2: Diagnostic Narrative ───────────────── */}
            <div style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                <AlertTriangle size={12} color={ERP.colors.amber} />
                <span style={{ fontSize: "11px", fontWeight: 800, color: ERP.colors.textPrimary,
                  textTransform: "uppercase", letterSpacing: "0.05em" }}>診斷摘要</span>
                <span style={{ fontSize: "10px", color: ERP.colors.textMuted }}>AI Diagnostic Narrative</span>
              </div>
              <div style={{ background: ERP.colors.amberLight, borderLeft: `4px solid ${ERP.colors.amber}`,
                border: `1px solid ${ERP.colors.amber}50`, borderRadius: ERP.radius.md, padding: "12px 14px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                  <AlertTriangle size={14} color={ERP.colors.amber} style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div style={{ fontSize: "12px", color: "#78350F", lineHeight: 1.75 }}>
                    <strong>系統偵測：</strong>{cfg.diagPre}
                    <span style={{ display: "inline-block", margin: "0 4px",
                      background: "#7C3AED15", color: "#7C3AED", border: "1px solid #7C3AED40",
                      borderRadius: ERP.radius.sm, padding: "0 5px", fontSize: "11px", fontWeight: 700 }}>
                      【{cfg.normType}】
                    </span>
                    {cfg.diagPost}
                  </div>
                </div>
                {/* Stats chips */}
                <div style={{ display: "flex", gap: "8px", marginTop: "10px", flexWrap: "wrap" }}>
                  {cfg.statsChips.map(({ label, val, color }) => (
                    <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center",
                      padding: "6px 10px", background: "rgba(255,255,255,0.6)",
                      borderRadius: ERP.radius.sm, border: `1px solid ${ERP.colors.amber}30` }}>
                      <span style={{ fontSize: "14px", fontWeight: 800, color: CHIP_COLOR[color], fontFamily: ERP.font.mono }}>
                        {val}
                      </span>
                      <span style={{ fontSize: "9px", color: "#92400E" }}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Section 3: SLA & Override ─────────────────────── */}
            <div style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                <Settings2 size={12} color={ERP.colors.accent} />
                <span style={{ fontSize: "11px", fontWeight: 800, color: ERP.colors.textPrimary,
                  textTransform: "uppercase", letterSpacing: "0.05em" }}>SLA 校正參數</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {/* SLA dropdown */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700,
                    color: ERP.colors.textSecondary, marginBottom: "5px" }}>
                    缺席 / 免修 SLA (Absence Handling)
                  </label>
                  <div style={{ position: "relative" }}>
                    <select value={slaMethod} onChange={e => setSlaMethod(e.target.value)}
                      style={{ ...selectSt(220), padding: "8px 28px 8px 10px",
                        border: `1.5px solid ${ERP.colors.border}`, fontSize: "12px" }}>
                      <option value="scale-up">比例放大 (Scale up to 100%)</option>
                      <option value="zero">以零分計算 (Count as Zero)</option>
                      <option value="exclude">排除計算 (Exclude from Average)</option>
                      <option value="median">以中位數補替 (Use Median)</option>
                    </select>
                    <ChevronDown size={12} color={ERP.colors.textMuted} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                  </div>
                </div>

                {/* AI Multiplier */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700,
                    color: ERP.colors.textSecondary, marginBottom: "5px" }}>
                    系統建議加乘係數
                    <span style={{ marginLeft: "6px", fontSize: "9px", fontWeight: 700,
                      background: ERP.colors.purpleLight, color: ERP.colors.purple,
                      border: `1px solid ${ERP.colors.purple}30`,
                      borderRadius: ERP.radius.full, padding: "1px 6px" }}>AI Multiplier</span>
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <input type="number" min={1.0} max={1.5} step={0.01}
                      value={multiplier}
                      onChange={e => setMultiplier(parseFloat(e.target.value) || 1.0)}
                      style={{ width: "80px", padding: "7px 10px",
                        border: `1.5px solid ${ERP.colors.accent}`, borderRadius: ERP.radius.md,
                        fontSize: "14px", fontWeight: 800, color: ERP.colors.accent,
                        fontFamily: ERP.font.mono, background: ERP.colors.accentPale,
                        outline: "none", textAlign: "center" }} />
                    <div style={{ fontSize: "11px", color: ERP.colors.textSecondary }}>
                      校正後平均：
                      <span style={{ fontSize: "14px", fontWeight: 800, color: ERP.colors.accent,
                        marginLeft: "6px", fontFamily: ERP.font.mono }}>{biasAdjMean}</span>
                      <span style={{ fontSize: "11px", color: ERP.colors.textMuted, marginLeft: "3px" }}>
                        (+{biasRawDelta})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Override panel */}
                {overrideMode && (
                  <div style={{ padding: "10px 12px", background: ERP.colors.redLight,
                    border: `1px solid ${ERP.colors.red}40`, borderRadius: ERP.radius.md }}>
                    <div style={{ fontSize: "11px", color: ERP.colors.red, fontWeight: 700, marginBottom: "6px" }}>
                      ⚠ 手動覆寫模式已啟用 — 請直接輸入目標平均分
                    </div>
                    <input type="number" min={0} max={100} step={0.5}
                      defaultValue={cfg.overrideDefault}
                      style={{ width: "100%", padding: "7px 10px",
                        border: `1.5px solid ${ERP.colors.red}`, borderRadius: ERP.radius.md,
                        fontSize: "14px", fontWeight: 800, fontFamily: ERP.font.mono,
                        color: ERP.colors.red, background: "#FFF5F5", outline: "none",
                        boxSizing: "border-box" }} />
                  </div>
                )}
              </div>
            </div>

            {/* ── Section 4: Action Buttons ──────────────────────── */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <button onClick={() => { setAiApplied(true); setOverrideMode(false); }} style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                padding: "11px 0", width: "100%", border: "none", borderRadius: ERP.radius.md,
                background: aiApplied
                  ? `linear-gradient(135deg, ${ERP.colors.green}, #059669)`
                  : "linear-gradient(135deg, #1D4ED8, #7C3AED)",
                color: "#fff", cursor: "pointer", fontSize: "13px", fontWeight: 800,
                fontFamily: ERP.font.family,
                boxShadow: aiApplied ? `0 3px 12px ${ERP.colors.green}50` : "0 3px 12px #2563EB50",
                transition: "all 0.2s" }}>
                {aiApplied ? <CheckCircle2 size={15} /> : <Sparkles size={15} />}
                {aiApplied ? "✓ AI 校正已套用 — 重新套用" : "套用 AI 校正曲線 (Apply AI Curve)"}
              </button>
              <button onClick={() => setOverrideMode(v => !v)} style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                padding: "9px 0", width: "100%",
                border: `1.5px solid ${overrideMode ? ERP.colors.red : ERP.colors.border}`,
                borderRadius: ERP.radius.md,
                background: overrideMode ? ERP.colors.redLight : "transparent",
                color: overrideMode ? ERP.colors.red : ERP.colors.textSecondary,
                cursor: "pointer", fontSize: "12px", fontWeight: 700, fontFamily: ERP.font.family,
                transition: "all 0.15s" }}>
                <Edit3 size={13} />
                {overrideMode ? "取消手動覆寫" : "手動覆寫 (Manual Override)"}
              </button>
              <button style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                padding: "7px 0", width: "100%", border: `1px solid ${ERP.colors.border}`,
                borderRadius: ERP.radius.md, background: "transparent", color: ERP.colors.textMuted,
                cursor: "pointer", fontSize: "11px", fontFamily: ERP.font.family }}>
                <Wand2 size={12} /> 匯出校正報告 (Export Report)
              </button>
            </div>
            <div style={{ height: "8px" }} />
          </div>

          {/* Panel footer */}
          <div style={{ padding: "8px 16px", borderTop: `1px solid ${ERP.colors.border}`,
            background: "#FAFBFC", flexShrink: 0,
            display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%",
              background: engineOn ? ERP.colors.green : ERP.colors.textMuted,
              boxShadow: engineOn ? `0 0 0 2px ${ERP.colors.green}30` : "none", flexShrink: 0 }} />
            <span style={{ fontSize: "10px", color: ERP.colors.textMuted, fontFamily: ERP.font.mono }}>
              最後同步 Last Synced: 2026-08-07 20:30 HKT · Engine v2.4.1
            </span>
            {aiApplied && (
              <span style={{ marginLeft: "auto", fontSize: "10px", fontWeight: 700,
                color: ERP.colors.green, background: ERP.colors.greenLight,
                border: `1px solid ${ERP.colors.green}40`,
                borderRadius: ERP.radius.full, padding: "1px 8px" }}>✓ AI 校正已套用</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
