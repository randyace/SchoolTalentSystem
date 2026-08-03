import React, { useState } from "react";
import { Zap, RefreshCw, ChevronDown, RotateCcw, Download, AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  DS, StatusBadge, ToggleSwitch, Card, Btn, SectionHeader,
} from "./DesignSystem";

// ─── Types ────────────────────────────────────────────────────────────────────
interface SubjectRow {
  subject:      string;
  rawMean:      number;
  weight:       number;
  adjustedScore:number;
  stdDev:       number;
  status:       "active" | "warning" | "pending" | "synced";
  highlighted?: boolean;
}

// ─── Initial data ─────────────────────────────────────────────────────────────
const initialRows: SubjectRow[] = [
  { subject: "Mathematics", rawMean: 72.4, weight: 20, adjustedScore: 74.8, stdDev: 8.2,  status: "active" },
  { subject: "English",     rawMean: 68.9, weight: 18, adjustedScore: 70.2, stdDev: 9.7,  status: "active" },
  { subject: "Chinese",     rawMean: 75.1, weight: 18, adjustedScore: 76.4, stdDev: 7.5,  status: "synced" },
  { subject: "Sciences",    rawMean: 61.3, weight: 17, adjustedScore: 63.8, stdDev: 11.4, status: "warning", highlighted: true },
  { subject: "History",     rawMean: 66.7, weight: 12, adjustedScore: 67.9, stdDev: 10.1, status: "active" },
  { subject: "PE",          rawMean: 83.2, weight:  8, adjustedScore: 84.0, stdDev: 6.3,  status: "synced" },
  { subject: "Arts",        rawMean: 78.5, weight: 10, adjustedScore: 79.1, stdDev: 7.9,  status: "active" },
];

// ─── Main Component ───────────────────────────────────────────────────────────
export const Screen03_DiagnosticEngine: React.FC = () => {
  const [rows, setRows]             = useState<SubjectRow[]>(initialRows);
  const [classFilter, setClassFilter] = useState("F1A");
  const [subjectFilter, setSubjectFilter] = useState("All");
  const [excludeAbs, setExcludeAbs] = useState(true);
  const [excludeExempt, setExcludeExempt] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [recalcDone, setRecalcDone] = useState(false);

  const totalWeight = rows.reduce((s, r) => s + r.weight, 0);

  const handleWeightChange = (idx: number, val: number) => {
    setRows((prev) =>
      prev.map((r, i) =>
        i === idx
          ? { ...r, weight: val, adjustedScore: parseFloat((r.rawMean * (val / 100) * 1.04).toFixed(1)) }
          : r
      )
    );
    setRecalcDone(false);
  };

  const handleRecalculate = () => {
    setRecalculating(true);
    setTimeout(() => { setRecalculating(false); setRecalcDone(true); }, 1200);
  };

  const handleResetWeights = () => {
    setRows(initialRows);
    setRecalcDone(false);
  };

  return (
    <div
      style={{
        fontFamily: DS.font.family,
        background: DS.colors.background,
        minHeight: "100vh",
      }}
    >
      {/* ── Persistent Top Banner ── */}
      <div
        style={{
          background: DS.colors.primaryLight,
          borderBottom: `2px solid #BFDBFE`,
          padding: "14px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: DS.radius.md,
              background: DS.colors.primary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Zap size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: "15px", fontWeight: 700, color: DS.colors.primary, fontFamily: DS.font.family }}>
              ⚡ Adaptive Bias Correction Engine
            </div>
            <div style={{ fontSize: "12px", color: "#3B82F6", fontFamily: DS.font.family }}>
              Last sync: 2 mins ago · Auto-recalibration enabled
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Accuracy indicator */}
          <div
            style={{
              padding: "6px 12px",
              background: DS.colors.secondaryLight,
              border: `1px solid #A7F3D0`,
              borderRadius: DS.radius.full,
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: DS.colors.secondary }} />
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#065F46", fontFamily: DS.font.family }}>
              98.2% accuracy
            </span>
          </div>

          {/* 60s SLA badge */}
          <span
            style={{
              padding: "4px 8px",
              background: "#FEF3C7",
              border: `1px solid #FDE68A`,
              borderRadius: DS.radius.full,
              fontSize: "11px",
              fontWeight: 700,
              color: "#92400E",
              fontFamily: DS.font.family,
            }}
          >
            60s SLA
          </span>

          <Btn
            variant="primary"
            icon={<RefreshCw size={14} style={{ animation: recalculating ? "spin 1s linear infinite" : "none" }} />}
            onClick={handleRecalculate}
            style={{ opacity: recalculating ? 0.8 : 1 }}
          >
            {recalculating ? "Recalculating..." : "Recalculate School Data"}
          </Btn>
        </div>
      </div>

      <div style={{ padding: "24px" }}>
        {/* Page title */}
        <div style={{ marginBottom: "20px" }}>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: DS.colors.textPrimary, margin: 0 }}>
            Diagnostic Scale Engine
          </h1>
          <p style={{ fontSize: "13px", color: DS.colors.textSecondary, margin: "4px 0 0" }}>
            模組二：自適應偏誤校正 · Adjust subject weightings and recalibrate scores
          </p>
        </div>

        {/* Filter bar */}
        <Card style={{ padding: "14px 20px", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
            {/* Class selector */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "13px", color: DS.colors.textSecondary, fontWeight: 500 }}>Class:</span>
              <div style={{ position: "relative" }}>
                <select
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  style={{
                    padding: "7px 28px 7px 10px",
                    border: `1px solid ${DS.colors.border}`,
                    borderRadius: DS.radius.md,
                    fontSize: "13px",
                    fontWeight: 600,
                    color: DS.colors.textPrimary,
                    background: DS.colors.surface,
                    cursor: "pointer",
                    appearance: "none",
                    fontFamily: DS.font.family,
                  }}
                >
                  {["F1A","F1B","F2A","F2B","F3A","F3B"].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <ChevronDown size={13} color={DS.colors.textMuted} style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              </div>
            </div>

            {/* Subject filter */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "13px", color: DS.colors.textSecondary, fontWeight: 500 }}>Subject:</span>
              <div style={{ position: "relative" }}>
                <select
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value)}
                  style={{
                    padding: "7px 28px 7px 10px",
                    border: `1px solid ${DS.colors.border}`,
                    borderRadius: DS.radius.md,
                    fontSize: "13px",
                    fontWeight: 600,
                    color: DS.colors.textPrimary,
                    background: DS.colors.surface,
                    cursor: "pointer",
                    appearance: "none",
                    fontFamily: DS.font.family,
                  }}
                >
                  {["All","Mathematics","English","Chinese","Sciences","History","PE","Arts"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <ChevronDown size={13} color={DS.colors.textMuted} style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              </div>
            </div>

            <div style={{ width: "1px", height: "28px", background: DS.colors.border }} />

            <ToggleSwitch checked={excludeAbs} onChange={setExcludeAbs} label="Exclude ABS" />
            <ToggleSwitch checked={excludeExempt} onChange={setExcludeExempt} label="Exclude EXEMPT" />

            <div style={{ marginLeft: "auto" }}>
              <Btn variant="ghost" size="sm" icon={<RotateCcw size={13} />} onClick={handleResetWeights}>
                Reset Weights
              </Btn>
            </div>
          </div>
        </Card>

        {/* Main Data Table */}
        <Card style={{ marginBottom: "20px", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: DS.font.family }}>
              <thead>
                <tr style={{ background: "#F9FAFB", borderBottom: `2px solid ${DS.colors.border}` }}>
                  {["Subject", "Raw Score (Mean)", "Weight Allocation (%)", "Adjusted Score", "Std Dev", "Status"].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "12px 16px",
                        textAlign: "left",
                        fontSize: "12px",
                        fontWeight: 700,
                        color: DS.colors.textSecondary,
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows
                  .filter((r) => subjectFilter === "All" || r.subject === subjectFilter)
                  .map((row, idx) => (
                    <tr
                      key={row.subject}
                      style={{
                        borderBottom: `1px solid ${DS.colors.border}`,
                        background: row.highlighted ? "#FFFBEB" : idx % 2 === 0 ? DS.colors.surface : "#FAFAFA",
                        transition: "background 0.15s",
                      }}
                    >
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          {row.highlighted && <AlertTriangle size={14} color={DS.colors.warning} />}
                          <span style={{ fontSize: "14px", fontWeight: 600, color: DS.colors.textPrimary }}>
                            {row.subject}
                          </span>
                          {row.highlighted && (
                            <span style={{ fontSize: "10px", color: DS.colors.warning, fontWeight: 600, background: "#FEF3C7", padding: "1px 6px", borderRadius: DS.radius.full }}>
                              Modified
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "14px", fontWeight: 700, color: DS.colors.textPrimary }}>
                            {row.rawMean.toFixed(1)}
                          </span>
                          <div style={{ height: "6px", width: "60px", background: DS.colors.background, borderRadius: DS.radius.full }}>
                            <div style={{ height: "100%", width: `${row.rawMean}%`, background: DS.colors.primary, borderRadius: DS.radius.full }} />
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <input
                            type="range"
                            min={0}
                            max={30}
                            value={row.weight}
                            onChange={(e) => handleWeightChange(
                              rows.findIndex((r) => r.subject === row.subject),
                              Number(e.target.value)
                            )}
                            style={{
                              width: "120px",
                              accentColor: DS.colors.primary,
                              cursor: "pointer",
                            }}
                          />
                          <span
                            style={{
                              fontSize: "13px",
                              fontWeight: 700,
                              color: DS.colors.primary,
                              minWidth: "36px",
                            }}
                          >
                            {row.weight}%
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            fontSize: "14px",
                            fontWeight: 700,
                            color: recalcDone ? DS.colors.secondary : DS.colors.textPrimary,
                          }}
                        >
                          {row.adjustedScore.toFixed(1)}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ fontSize: "13px", color: DS.colors.textSecondary }}>
                          ± {row.stdDev.toFixed(1)}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <StatusBadge variant={row.status} size="sm" />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Summary Card */}
        <Card style={{ padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
              <div>
                <div style={{ fontSize: "12px", color: DS.colors.textSecondary, fontWeight: 500, marginBottom: "4px" }}>
                  Total Weight Allocated
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span
                    style={{
                      fontSize: "24px",
                      fontWeight: 800,
                      color: totalWeight > 100 ? DS.colors.warning : DS.colors.secondary,
                    }}
                  >
                    {totalWeight}%
                  </span>
                  {totalWeight > 100 && (
                    <span style={{ fontSize: "20px" }}>⚠️</span>
                  )}
                </div>
                {totalWeight > 100 && (
                  <div style={{ fontSize: "12px", color: DS.colors.warning, marginTop: "2px" }}>
                    Exceeds 100% — normalization required
                  </div>
                )}
              </div>

              <div style={{ width: "1px", height: "48px", background: DS.colors.border }} />

              <div>
                <div style={{ fontSize: "12px", color: DS.colors.textSecondary, fontWeight: 500, marginBottom: "4px" }}>
                  Normalized Total
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "24px", fontWeight: 800, color: DS.colors.secondary }}>
                    100%
                  </span>
                  {recalcDone && <CheckCircle2 size={18} color={DS.colors.secondary} />}
                </div>
                <div style={{ fontSize: "12px", color: DS.colors.textMuted }}>
                  {recalcDone ? "Recalculation complete" : "After recalculation"}
                </div>
              </div>

              <div style={{ width: "1px", height: "48px", background: DS.colors.border }} />

              <div>
                <div style={{ fontSize: "12px", color: DS.colors.textSecondary, fontWeight: 500, marginBottom: "4px" }}>
                  Subjects with Weight &gt; 15%
                </div>
                <div style={{ fontSize: "24px", fontWeight: 800, color: DS.colors.textPrimary }}>
                  {rows.filter((r) => r.weight > 15).length}
                </div>
              </div>
            </div>

            <Btn variant="secondary" icon={<Download size={14} />}>
              Export Adjusted Grades
            </Btn>
          </div>
        </Card>
      </div>
    </div>
  );
};
