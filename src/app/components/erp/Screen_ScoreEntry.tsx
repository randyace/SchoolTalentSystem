// ─────────────────────────────────────────────────────────────────────────────
// Screen 1.C.3  成績輸入 / Score Entry
// UI Pattern: High-Density Spreadsheet Grid (Excel-like)
// Sticky left columns: 班號, 姓名. ABS/EXM rows with disabled cells.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect } from "react";
import { ERP } from "./erpTokens";
import {
  Upload, Save, Send, ChevronDown, AlertTriangle,
  Sparkles, CheckCircle2, FileSpreadsheet, RotateCcw,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type StatusCode = "normal" | "abs" | "exm";

interface ScoreRow {
  classNum: number;
  id: string;
  chName: string;
  enName: string;
  score: number | null;
  status: StatusCode;
  note: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const TERM_OPTIONS       = ["上學期", "下學期"];
const CLASS_OPTIONS      = ["1A", "1B", "2A", "2B", "3A"];
const SUBJECT_OPTIONS    = ["數學", "英文", "中文", "物理"];
const ASSESSMENT_OPTIONS = ["期中考", "期末考", "平時表現", "專題報告"];

const INITIAL_SCORES: ScoreRow[] = [
  { classNum:1,  id:"2025-F1A-001", chName:"陳大文", enName:"Chan Tai Man",    score:78,   status:"normal", note:"" },
  { classNum:2,  id:"2025-F1A-002", chName:"黃美怡", enName:"Wong Mei Yi",     score:85,   status:"normal", note:"" },
  { classNum:3,  id:"2025-F1A-003", chName:"李家豪", enName:"Lee Ka Ho",       score:null, status:"abs",    note:"缺席，未補考" },
  { classNum:4,  id:"2025-F1A-004", chName:"劉曉峰", enName:"Lau Hiu Fung",   score:92,   status:"normal", note:"" },
  { classNum:5,  id:"2025-F1A-005", chName:"林詩雅", enName:"Lam Sze Nga",    score:67,   status:"normal", note:"" },
  { classNum:6,  id:"2025-F1A-006", chName:"張俊傑", enName:"Cheung Chun Kit",score:88,   status:"normal", note:"" },
  { classNum:7,  id:"2025-F1A-007", chName:"吳敏兒", enName:"Ng Man Yi",      score:71,   status:"normal", note:"重讀學生，需加強" },
  { classNum:8,  id:"2025-F1A-008", chName:"鄭博文", enName:"Cheng Pok Man",  score:null, status:"exm",    note:"醫生證明免試" },
  { classNum:9,  id:"2025-F1A-009", chName:"何紫晴", enName:"Ho Tsz Ching",   score:82,   status:"normal", note:"" },
  { classNum:10, id:"2025-F1A-010", chName:"梁嘉駿", enName:"Leung Ka Chun",  score:76,   status:"normal", note:"" },
  { classNum:11, id:"2025-F1A-011", chName:"李建志", enName:"Li Kin Chi",     score:90,   status:"normal", note:"" },
  { classNum:12, id:"2025-F1A-012", chName:"陳志明", enName:"Chan Chi Ming",  score:55,   status:"normal", note:"需要補底支援" },
];

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CFG: Record<StatusCode, { bg: string; color: string; border: string; label: string }> = {
  normal: { bg: "#F0FDF4", color: "#15803D", border: "#86EFAC", label: "正常" },
  abs:    { bg: "#FFFBEB", color: "#92400E", border: "#FCD34D", label: "ABS 缺席" },
  exm:    { bg: "#EFF6FF", color: "#1D4ED8", border: "#93C5FD", label: "EXM 免修" },
};

// ─── Score color helper ───────────────────────────────────────────────────────
const scoreColor = (score: number | null, status: StatusCode): string => {
  if (score === null || status !== "normal") return ERP.colors.pageBg;
  if (score >= 80) return "#F0FDF4";
  if (score < 50)  return "#FEF2F2";
  return ERP.colors.surface;
};

const scoreTextColor = (score: number | null): string => {
  if (score === null) return ERP.colors.textMuted;
  if (score >= 80) return "#166534";
  if (score < 50)  return "#DC2626";
  return ERP.colors.textPrimary;
};

// ─── Sub-components ───────────────────────────────────────────────────────────
const FilterSelect: React.FC<{
  label: string; value: string; options: string[];
  onChange: (v: string) => void;
}> = ({ label, value, options, onChange }) => (
  <div style={{ position: "relative" }}>
    <label style={{
      display: "block", fontSize: 10, fontWeight: 600,
      color: ERP.colors.textMuted, marginBottom: 3, letterSpacing: "0.05em",
      fontFamily: ERP.font.family,
    }}>{label}</label>
    <div style={{ position: "relative" }}>
      <select value={value} onChange={e => onChange(e.target.value)} style={{
        padding: "6px 26px 6px 10px", borderRadius: ERP.radius.sm,
        border: `1px solid ${ERP.colors.border}`, background: ERP.colors.surface,
        fontSize: 13, fontFamily: ERP.font.family, color: ERP.colors.textPrimary,
        outline: "none", cursor: "pointer", appearance: "none" as const,
        fontWeight: 600,
      }}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown size={11} style={{ position: "absolute", right: 7, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: ERP.colors.textMuted }} />
    </div>
  </div>
);

// ─── Cell shared style ────────────────────────────────────────────────────────
const cellBorder: React.CSSProperties = {
  borderRight: `1px solid ${ERP.colors.border}`,
  borderBottom: `1px solid ${ERP.colors.border}`,
};
const headCellStyle = (extra?: React.CSSProperties): React.CSSProperties => ({
  ...cellBorder,
  padding: "9px 10px",
  background: "#F8FAFC",
  borderTop: `1px solid ${ERP.colors.border}`,
  fontSize: 11, fontWeight: 700, color: ERP.colors.textMuted,
  letterSpacing: "0.05em", textTransform: "uppercase" as const,
  whiteSpace: "nowrap" as const, userSelect: "none" as const,
  ...extra,
});

// ─── Main Component ───────────────────────────────────────────────────────────
interface Props { lang?: "en" | "zh-HK" }

export const Screen_ScoreEntry: React.FC<Props> = ({ lang = "zh-HK" }) => {
  const [scores,     setScores]     = useState<ScoreRow[]>(INITIAL_SCORES);
  const [term,       setTerm]       = useState("上學期");
  const [cls,        setCls]        = useState("1A");
  const [subject,    setSubject]    = useState("數學");
  const [assessment, setAssessment] = useState("期中考");
  const [isMobile,   setIsMobile]   = useState(false);
  const [isDraft,    setIsDraft]    = useState(false);
  const [focusedId,  setFocusedId]  = useState<string | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const update = (id: string, field: keyof ScoreRow, value: ScoreRow[keyof ScoreRow]) => {
    setScores(prev => prev.map(r =>
      r.id === id
        ? { ...r, [field]: value, ...(field === "status" && value !== "normal" ? { score: null } : {}) }
        : r
    ));
  };

  const enteredRows = scores.filter(r => r.score !== null && r.status === "normal");
  const avg = enteredRows.length
    ? Math.round((enteredRows.reduce((s, r) => s + r.score!, 0) / enteredRows.length) * 10) / 10
    : "—";
  const highest  = enteredRows.length ? Math.max(...enteredRows.map(r => r.score!)) : "—";
  const passFail = enteredRows.filter(r => (r.score ?? 0) < 50).length;
  const F = ERP.font.family;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", fontFamily: F, background: ERP.colors.pageBg }}>

      {/* ── TOP BAR ───────────────────────────────────────────────────── */}
      <div style={{ flexShrink: 0, background: ERP.colors.surface, borderBottom: `1px solid ${ERP.colors.border}`, padding: "14px 24px 12px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <FileSpreadsheet size={18} color={ERP.colors.accent} />
              <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: ERP.colors.textPrimary }}>成績輸入</h1>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: ERP.radius.full, background: ERP.colors.accentPale, color: ERP.colors.accent, border: `1px solid ${ERP.colors.accentLight}` }}>Score Entry</span>
            </div>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: ERP.colors.textMuted }}>1.C.3 · AY 2025/26 · 逐格輸入或匯入試算表</p>
          </div>
          <button style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 16px", borderRadius: ERP.radius.md,
            border: `1.5px solid ${ERP.colors.accentLight}`, background: ERP.colors.accentPale,
            color: ERP.colors.accent, fontSize: 13, fontWeight: 600, fontFamily: F, cursor: "pointer",
          }}>
            <Upload size={14} /> 匯入 Excel
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" as const, alignItems: "flex-end" }}>
          <FilterSelect label="學期"   value={term}       options={TERM_OPTIONS}       onChange={setTerm} />
          <FilterSelect label="班級"   value={cls}        options={CLASS_OPTIONS}       onChange={setCls} />
          <FilterSelect label="科目"   value={subject}    options={SUBJECT_OPTIONS}     onChange={setSubject} />
          <FilterSelect label="評估項目" value={assessment} options={ASSESSMENT_OPTIONS} onChange={setAssessment} />

          {/* Legend */}
          <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" as const }}>
            {Object.entries(STATUS_CFG).map(([k, v]) => (
              <span key={k} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: ERP.radius.full, background: v.bg, color: v.color, border: `1px solid ${v.border}` }}>
                {v.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── STATS BAR ─────────────────────────────────────────────────── */}
      <div style={{
        flexShrink: 0, background: "#F8FAFC",
        borderBottom: `1px solid ${ERP.colors.border}`,
        padding: "8px 24px", display: "flex", gap: 24, flexWrap: "wrap" as const, alignItems: "center",
      }}>
        {[
          { label: "已輸入",  value: `${enteredRows.length} / ${scores.length}` },
          { label: "班級平均", value: avg, color: ERP.colors.accent },
          { label: "最高分",  value: highest, color: ERP.colors.success },
          { label: "不及格",  value: passFail, color: passFail > 0 ? ERP.colors.red : ERP.colors.textMuted },
          { label: "ABS 缺席", value: scores.filter(r => r.status === "abs").length, color: "#92400E" },
          { label: "EXM 免修", value: scores.filter(r => r.status === "exm").length, color: "#1D4ED8" },
        ].map(stat => (
          <div key={stat.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 11, color: ERP.colors.textMuted, fontWeight: 500 }}>{stat.label}</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: stat.color ?? ERP.colors.textPrimary }}>{String(stat.value)}</span>
          </div>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
          <div style={{ width: 160, background: ERP.colors.border, borderRadius: 4, height: 5, overflow: "hidden" }}>
            <div style={{ width: `${(enteredRows.length / scores.length) * 100}%`, height: "100%", background: ERP.colors.accent, borderRadius: 4, transition: "width 0.3s" }} />
          </div>
          <span style={{ fontSize: 10, color: ERP.colors.textMuted, fontWeight: 600 }}>
            {Math.round((enteredRows.length / scores.length) * 100)}% 完成
          </span>
        </div>
      </div>

      {/* ── SPREADSHEET TABLE ─────────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: "auto" }}>
        <table style={{ borderCollapse: "separate", borderSpacing: 0, minWidth: 720, tableLayout: "fixed" as const, width: "100%" }}>

          {/* Colgroup */}
          <colgroup>
            <col style={{ width: 50 }} />
            <col style={{ width: 150 }} />
            <col style={{ width: 110 }} />
            <col style={{ width: 120 }} />
            <col style={{ minWidth: 240 }} />
          </colgroup>

          <thead>
            <tr>
              {/* Sticky: 班號 */}
              <th style={{ ...headCellStyle(), position: "sticky", left: 0, zIndex: 3, textAlign: "center" as const, borderLeft: `1px solid ${ERP.colors.border}` }}>
                班號
              </th>
              {/* Sticky: 姓名 */}
              <th style={{ ...headCellStyle(), position: "sticky", left: 50, zIndex: 3 }}>
                姓名 <span style={{ fontSize: 9, fontWeight: 400, color: ERP.colors.textMuted }}>Name</span>
              </th>
              {/* Scrollable columns */}
              <th style={headCellStyle({ textAlign: "right" as const })}>
                原始分數 <span style={{ fontSize: 9, fontWeight: 400, display: "block", color: ERP.colors.textMuted }}>Raw Score /100</span>
              </th>
              <th style={headCellStyle()}>
                特殊狀態 <span style={{ fontSize: 9, fontWeight: 400, display: "block", color: ERP.colors.textMuted }}>Status</span>
              </th>
              <th style={headCellStyle()}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <Sparkles size={11} color={ERP.colors.purple} />
                  表現備註 (AI 輸入)
                  <span style={{ fontSize: 9, fontWeight: 400, color: ERP.colors.textMuted, marginLeft: 2 }}>AI Note Prompt</span>
                </div>
              </th>
            </tr>
          </thead>

          <tbody>
            {scores.map((row) => {
              const isAbs    = row.status === "abs";
              const isExm    = row.status === "exm";
              const disabled = isAbs || isExm;
              const sCfg     = STATUS_CFG[row.status];
              const rowBg    = isAbs ? "#FFFBEB" : isExm ? "#EFF6FF" : ERP.colors.surface;
              const focused  = focusedId === row.id;

              return (
                <tr key={row.id} style={{ background: rowBg }}>
                  {/* Sticky: class num */}
                  <td style={{
                    ...cellBorder, position: "sticky", left: 0, zIndex: 2,
                    background: rowBg, textAlign: "center" as const,
                    borderLeft: `1px solid ${ERP.colors.border}`,
                    padding: "0 6px",
                  }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: ERP.colors.textMuted }}>{row.classNum}</span>
                  </td>

                  {/* Sticky: name */}
                  <td style={{
                    ...cellBorder, position: "sticky", left: 50, zIndex: 2,
                    background: rowBg, padding: "0 10px",
                    boxShadow: "2px 0 4px rgba(0,0,0,0.04)",
                  }}>
                    <div style={{ padding: "8px 0" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: ERP.colors.textPrimary, lineHeight: 1.2 }}>{row.chName}</div>
                      <div style={{ fontSize: 10, color: ERP.colors.textMuted, marginTop: 1 }}>{row.enName}</div>
                    </div>
                  </td>

                  {/* Raw score */}
                  <td style={{
                    ...cellBorder,
                    background: disabled ? "#F1F5F9" : scoreColor(row.score, row.status),
                    padding: 0,
                  }}>
                    <input
                      type="number" min={0} max={100}
                      value={disabled ? "" : row.score ?? ""}
                      disabled={disabled}
                      placeholder={disabled ? (isAbs ? "— ABS" : "— EXM") : "0–100"}
                      onChange={e => update(row.id, "score", e.target.value === "" ? null : Math.min(100, Math.max(0, Number(e.target.value))))}
                      onFocus={() => setFocusedId(row.id)}
                      onBlur={() => setFocusedId(null)}
                      style={{
                        width: "100%", height: "100%", minHeight: 42, boxSizing: "border-box" as const,
                        padding: "0 10px", border: "none", outline: "none",
                        background: "transparent",
                        fontSize: 15, fontWeight: 700, fontFamily: ERP.font.mono,
                        color: disabled ? ERP.colors.textMuted : scoreTextColor(row.score),
                        textAlign: "right" as const, cursor: disabled ? "not-allowed" : "text",
                      }}
                    />
                  </td>

                  {/* Status dropdown */}
                  <td style={{ ...cellBorder, padding: 0, background: sCfg.bg }}>
                    <div style={{ position: "relative" }}>
                      <select
                        value={row.status}
                        onChange={e => update(row.id, "status", e.target.value as StatusCode)}
                        style={{
                          width: "100%", height: 42, border: "none", outline: "none",
                          background: "transparent", fontWeight: 700, fontSize: 12,
                          color: sCfg.color, cursor: "pointer",
                          appearance: "none" as const, padding: "0 28px 0 10px",
                          fontFamily: F,
                        }}
                      >
                        {Object.entries(STATUS_CFG).map(([k, v]) => (
                          <option key={k} value={k}>{v.label}</option>
                        ))}
                      </select>
                      <ChevronDown size={11} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: sCfg.color }} />
                    </div>
                  </td>

                  {/* AI Note */}
                  <td style={{ ...cellBorder, padding: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", padding: "0 4px 0 8px", height: 42 }}>
                      <Sparkles size={11} color={row.note ? ERP.colors.purple : ERP.colors.textMuted} style={{ flexShrink: 0, marginRight: 4 }} />
                      <input
                        type="text"
                        value={row.note}
                        onChange={e => update(row.id, "note", e.target.value)}
                        placeholder="輸入觀察或備注…"
                        style={{
                          flex: 1, border: "none", outline: "none", background: "transparent",
                          fontSize: 12, fontFamily: F, color: ERP.colors.textPrimary,
                          padding: "0 4px",
                        }}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <div style={{
        flexShrink: 0, background: ERP.colors.surface,
        borderTop: `1px solid ${ERP.colors.border}`,
        padding: "12px 24px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" as const,
      }}>
        {/* Status indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {isDraft
            ? <><CheckCircle2 size={14} color={ERP.colors.success} /><span style={{ fontSize: 12, color: ERP.colors.success, fontWeight: 600 }}>草稿已儲存</span></>
            : <><RotateCcw size={14} color={ERP.colors.textMuted} /><span style={{ fontSize: 12, color: ERP.colors.textMuted }}>尚未儲存</span></>
          }
        </div>

        <div style={{ flex: 1 }} />

        {/* ABS warning */}
        {scores.filter(r => r.status === "abs").length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", background: "#FFFBEB", borderRadius: ERP.radius.sm, border: "1px solid #FCD34D" }}>
            <AlertTriangle size={12} color="#92400E" />
            <span style={{ fontSize: 11, color: "#92400E", fontWeight: 600 }}>
              {scores.filter(r => r.status === "abs").length} 名學生缺席 · 需後補
            </span>
          </div>
        )}

        <button
          onClick={() => setIsDraft(true)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "9px 18px", borderRadius: ERP.radius.md,
            border: `1px solid ${ERP.colors.border}`, background: ERP.colors.surface,
            color: ERP.colors.textSecondary, fontSize: 13, fontWeight: 600, fontFamily: F, cursor: "pointer",
          }}
        >
          <Save size={14} /> 儲存草稿
        </button>

        <button style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "9px 20px", borderRadius: ERP.radius.md,
          border: "none", background: ERP.colors.accent,
          color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: F, cursor: "pointer",
          boxShadow: `0 2px 10px ${ERP.colors.accent}50`,
        }}>
          <Send size={14} /> 提交成績
        </button>
      </div>
    </div>
  );
};
