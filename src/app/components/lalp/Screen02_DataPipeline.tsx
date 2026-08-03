import React, { useState } from "react";
import { AlertTriangle, CheckCircle2, Play, Database, ShieldCheck, GitBranch } from "lucide-react";
import {
  DS, StatusBadge, DataPrivacyShield, Card, Btn, SectionHeader,
} from "./DesignSystem";

// ─── Types ────────────────────────────────────────────────────────────────────
interface StudentRow {
  studentId: string;
  name: string;
  class: string;
  senStatus: string;
  medicalRecord: string;
  scoreMath: string;
  scoreEng: string;
}

// ─── Mock data ─────────────────────────────────────────────────────────────────
const rawRows: StudentRow[] = [
  { studentId: "2024001", name: "Chan Tai Man", class: "1A", senStatus: "ADHD",     medicalRecord: "Asthma",      scoreMath: "72", scoreEng: "68" },
  { studentId: "2024002", name: "Lee Siu Ying", class: "1A", senStatus: "—",         medicalRecord: "—",           scoreMath: "88", scoreEng: "91" },
  { studentId: "2024003", name: "Wong Wai Kit", class: "1B", senStatus: "Dyslexia",  medicalRecord: "Eczema",      scoreMath: "55", scoreEng: "49" },
  { studentId: "2024004", name: "Lam Ho Yin",   class: "1B", senStatus: "ASD",       medicalRecord: "—",           scoreMath: "63", scoreEng: "70" },
  { studentId: "2024005", name: "Ng Hiu Tung",  class: "1A", senStatus: "—",         medicalRecord: "Epilepsy",    scoreMath: "79", scoreEng: "83" },
  { studentId: "2024006", name: "Yip Ka Wai",   class: "1C", senStatus: "ADHD",      medicalRecord: "Asthma",      scoreMath: "61", scoreEng: "57" },
];

const sensitiveSENValues   = new Set(["ADHD", "ASD", "Dyslexia", "ADD", "DCD"]);
const sensitiveMedValues   = new Set(["Asthma", "Eczema", "Epilepsy", "Diabetes"]);

// ─── Stepper ──────────────────────────────────────────────────────────────────
const Stepper: React.FC<{ currentStep: number }> = ({ currentStep }) => {
  const steps = [
    { n: 1, label: "Upload CSV/TSV",          icon: <Database size={16} /> },
    { n: 2, label: "De-sensitization",         icon: <ShieldCheck size={16} /> },
    { n: 3, label: "Unpivot Vectorization",    icon: <GitBranch size={16} /> },
  ];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, fontFamily: DS.font.family }}>
      {steps.map((step, i) => {
        const isActive   = step.n === currentStep;
        const isComplete = step.n < currentStep;
        return (
          <React.Fragment key={step.n}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 18px",
                borderRadius: DS.radius.lg,
                background: isActive ? DS.colors.primary : isComplete ? DS.colors.secondaryLight : DS.colors.background,
                border: `2px solid ${isActive ? DS.colors.primary : isComplete ? DS.colors.secondary : DS.colors.border}`,
                transition: "all 0.2s",
              }}
            >
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: DS.radius.full,
                  background: isActive ? "rgba(255,255,255,0.25)" : isComplete ? DS.colors.secondary : DS.colors.border,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: isActive ? "#fff" : isComplete ? "#fff" : DS.colors.textMuted,
                  flexShrink: 0,
                }}
              >
                {isComplete ? <CheckCircle2 size={16} /> : step.icon}
              </div>
              <div>
                <div style={{ fontSize: "11px", color: isActive ? "rgba(255,255,255,0.75)" : DS.colors.textMuted, fontWeight: 500 }}>
                  Step {step.n}
                </div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: isActive ? "#fff" : isComplete ? "#065F46" : DS.colors.textPrimary }}>
                  {step.label}
                </div>
              </div>
            </div>
            {i < steps.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: "2px",
                  background: step.n < currentStep ? DS.colors.secondary : DS.colors.border,
                  minWidth: "24px",
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ─── Data Table ───────────────────────────────────────────────────────────────
interface DataTableProps { rows: StudentRow[]; masked: boolean }

const DataTable: React.FC<DataTableProps> = ({ rows, masked }) => {
  const isSenSensitive  = (v: string) => sensitiveSENValues.has(v);
  const isMedSensitive  = (v: string) => sensitiveMedValues.has(v);

  const sensitiveStyle: React.CSSProperties = {
    background: "#FEE2E2",
    color: "#991B1B",
    fontWeight: 600,
    padding: "3px 6px",
    borderRadius: DS.radius.sm,
    fontSize: "12px",
  };

  const colStyle: React.CSSProperties = {
    padding: "10px 12px",
    fontSize: "13px",
    color: DS.colors.textPrimary,
    fontFamily: DS.font.family,
    borderRight: `1px solid ${DS.colors.border}`,
    whiteSpace: "nowrap",
  };

  const headStyle: React.CSSProperties = {
    ...colStyle,
    background: "#F3F4F6",
    fontWeight: 700,
    fontSize: "12px",
    color: DS.colors.textSecondary,
  };

  const cols: { key: keyof StudentRow; label: string; sensitive?: boolean }[] = [
    { key: "studentId",    label: "StudentID" },
    { key: "name",         label: "Name" },
    { key: "class",        label: "Class" },
    { key: "senStatus",    label: "SEN_Status",     sensitive: true },
    { key: "medicalRecord",label: "MedicalRecord",  sensitive: true },
    { key: "scoreMath",    label: "Score_Math" },
    { key: "scoreEng",     label: "Score_Eng" },
  ];

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
        <thead>
          <tr>
            {cols.map((c) => (
              <th key={c.key} style={{ ...headStyle, borderBottom: `2px solid ${DS.colors.border}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  {c.sensitive && !masked && (
                    <AlertTriangle size={12} color={DS.colors.error} />
                  )}
                  {c.sensitive && masked && (
                    <ShieldCheck size={12} color={DS.colors.secondary} />
                  )}
                  {c.label}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{ borderBottom: `1px solid ${DS.colors.border}` }}>
              {cols.map((c) => {
                const val = row[c.key];
                const isSen = c.key === "senStatus"    && isSenSensitive(val);
                const isMed = c.key === "medicalRecord" && isMedSensitive(val);
                const isSensitive = isSen || isMed;

                return (
                  <td
                    key={c.key}
                    style={{
                      ...colStyle,
                      background: isSensitive && !masked ? "#FFF5F5" : ri % 2 === 0 ? DS.colors.surface : "#FAFAFA",
                    }}
                  >
                    {isSensitive && masked ? (
                      <DataPrivacyShield />
                    ) : isSensitive && !masked ? (
                      <span style={sensitiveStyle}>{val}</span>
                    ) : (
                      val
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const Screen02_DataPipeline: React.FC = () => {
  const [running, setRunning] = useState(false);
  const [ran, setRan] = useState(false);

  const handleRun = () => {
    setRunning(true);
    setTimeout(() => { setRunning(false); setRan(true); }, 1400);
  };

  const patterns = [
    { pattern: String.raw`\b(ADHD|ASD|Dyslexia)\b`,   desc: "SEN Diagnostic Labels" },
    { pattern: String.raw`Medical[A-Z][a-z]+`,          desc: "Medical Record Fields" },
  ];

  return (
    <div
      style={{
        fontFamily: DS.font.family,
        background: DS.colors.background,
        minHeight: "100vh",
        padding: "24px",
      }}
    >
      {/* Page header */}
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 800, color: DS.colors.textPrimary, margin: 0 }}>
          Data Tokenization &amp; Unpivot Pipeline
        </h1>
        <p style={{ fontSize: "13px", color: DS.colors.textSecondary, margin: "4px 0 0" }}>
          模組一：數據對齊 · Automated de-sensitization pipeline for student data
        </p>
      </div>

      {/* Stepper */}
      <Card style={{ padding: "20px", marginBottom: "20px" }}>
        <Stepper currentStep={2} />
      </Card>

      {/* Split Panel */}
      <Card style={{ marginBottom: "20px", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
          {/* LEFT */}
          <div style={{ borderRight: `1px solid ${DS.colors.border}` }}>
            <div
              style={{
                padding: "12px 16px",
                background: "#FEF2F2",
                borderBottom: `1px solid #FECACA`,
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <AlertTriangle size={15} color={DS.colors.error} />
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#991B1B", fontFamily: DS.font.family }}>
                Raw Input (eClass Export)
              </span>
              <span style={{ marginLeft: "auto", fontSize: "11px", color: "#B91C1C", fontFamily: DS.font.family }}>
                Contains PII / Sensitive Data
              </span>
            </div>
            <DataTable rows={rawRows} masked={false} />
          </div>

          {/* RIGHT */}
          <div>
            <div
              style={{
                padding: "12px 16px",
                background: DS.colors.secondaryLight,
                borderBottom: `1px solid #A7F3D0`,
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <CheckCircle2 size={15} color={DS.colors.secondary} />
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#065F46", fontFamily: DS.font.family }}>
                After De-sensitization ✅
              </span>
              <span style={{ marginLeft: "auto", fontSize: "11px", color: "#047857", fontFamily: DS.font.family }}>
                Privacy-safe output
              </span>
            </div>
            <DataTable rows={rawRows} masked={true} />
          </div>
        </div>
      </Card>

      {/* Regex/NER Engine Config */}
      <Card style={{ padding: "20px", marginBottom: "20px" }}>
        <SectionHeader
          title="Regex / NER Engine Config"
          subtitle="Active pattern matchers for PII detection"
          actions={
            <Btn
              variant="primary"
              icon={<Play size={14} />}
              onClick={handleRun}
              style={{ opacity: running ? 0.7 : 1 }}
            >
              {running ? "Running..." : "Run Pipeline"}
            </Btn>
          }
        />

        {ran && (
          <div
            style={{
              marginBottom: "16px",
              padding: "10px 14px",
              background: DS.colors.secondaryLight,
              border: `1px solid #A7F3D0`,
              borderRadius: DS.radius.md,
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <CheckCircle2 size={16} color={DS.colors.secondary} />
            <span style={{ fontSize: "13px", color: "#065F46", fontWeight: 600, fontFamily: DS.font.family }}>
              Pipeline completed successfully — 12 values masked across 6 records
            </span>
          </div>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "16px" }}>
          {patterns.map((p, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 14px",
                background: "#F0FDF4",
                border: `1px solid #BBF7D0`,
                borderRadius: DS.radius.md,
              }}
            >
              <code style={{ fontSize: "12px", color: "#065F46", fontFamily: "monospace", fontWeight: 700 }}>
                {p.pattern}
              </code>
              <span style={{ fontSize: "11px", color: DS.colors.textSecondary, fontFamily: DS.font.family }}>
                · {p.desc}
              </span>
              <StatusBadge variant="active" label="active" size="sm" />
            </div>
          ))}
          <button
            style={{
              padding: "8px 14px",
              background: "transparent",
              border: `1px dashed ${DS.colors.border}`,
              borderRadius: DS.radius.md,
              fontSize: "12px",
              color: DS.colors.textMuted,
              cursor: "pointer",
              fontFamily: DS.font.family,
            }}
          >
            + Add Pattern
          </button>
        </div>
      </Card>

      {/* Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
        <Card style={{ padding: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: DS.radius.md,
                background: DS.colors.primaryLight,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Database size={18} color={DS.colors.primary} />
            </div>
            <div>
              <div style={{ fontSize: "22px", fontWeight: 800, color: DS.colors.textPrimary, fontFamily: DS.font.family }}>247</div>
              <div style={{ fontSize: "12px", color: DS.colors.textSecondary, fontFamily: DS.font.family }}>Files Processed</div>
            </div>
          </div>
        </Card>
        <Card style={{ padding: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: DS.radius.md,
                background: "#FEE2E2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ShieldCheck size={18} color={DS.colors.error} />
            </div>
            <div>
              <div style={{ fontSize: "22px", fontWeight: 800, color: DS.colors.textPrimary, fontFamily: DS.font.family }}>1,834</div>
              <div style={{ fontSize: "12px", color: DS.colors.textSecondary, fontFamily: DS.font.family }}>Records Masked</div>
            </div>
          </div>
        </Card>
        <Card style={{ padding: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: DS.radius.md,
                background: DS.colors.secondaryLight,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CheckCircle2 size={18} color={DS.colors.secondary} />
            </div>
            <div>
              <div style={{ fontSize: "16px", fontWeight: 700, color: DS.colors.textPrimary, fontFamily: DS.font.family, marginTop: "4px" }}>
                <StatusBadge variant="synced" />
              </div>
              <div style={{ fontSize: "12px", color: DS.colors.textSecondary, fontFamily: DS.font.family, marginTop: "4px" }}>Pipeline Status</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
