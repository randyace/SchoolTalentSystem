import React, { useState } from "react";
import { QrCode, CheckCircle2, Users, Zap, ChevronDown, Clock, Activity } from "lucide-react";
import {
  DS, StatusBadge, Card, Btn, SectionHeader,
} from "./DesignSystem";

// ─── Types ────────────────────────────────────────────────────────────────────
interface StudentCard {
  initials: string;
  name: string;
  score: number;
  group: "A" | "B" | "C" | "D";
  status: "good" | "attention" | "absent";
  spark: number[];
}

// ─── Mock student data ────────────────────────────────────────────────────────
const studentGrid: StudentCard[] = [
  { initials: "CM", name: "Chan M.", score: 88, group: "A", status: "good",      spark: [70,75,80,85,88] },
  { initials: "LY", name: "Lee Y.",  score: 74, group: "A", status: "attention", spark: [80,76,74,72,74] },
  { initials: "WK", name: "Wong K.", score: 91, group: "B", status: "good",      spark: [82,85,88,90,91] },
  { initials: "NG", name: "Ng G.",   score: 0,  group: "B", status: "absent",    spark: [65,70,0,0,0] },
  { initials: "YT", name: "Yip T.",  score: 82, group: "C", status: "good",      spark: [75,78,80,81,82] },
  { initials: "LH", name: "Lam H.", score: 68, group: "C", status: "attention", spark: [72,70,69,68,68] },
  { initials: "TW", name: "Tam W.", score: 95, group: "D", status: "good",      spark: [88,90,92,94,95] },
  { initials: "HF", name: "Ho F.",  score: 77, group: "D", status: "attention", spark: [80,79,77,76,77] },
  { initials: "KM", name: "Kwok M.", score: 84, group: "A", status: "good",     spark: [76,79,81,83,84] },
  { initials: "CW", name: "Chu W.", score: 71, group: "B", status: "attention", spark: [75,73,72,71,71] },
  { initials: "PL", name: "Poon L.", score: 89, group: "C", status: "good",     spark: [83,85,87,88,89] },
  { initials: "MK", name: "Mok K.", score: 76, group: "D", status: "good",      spark: [70,72,74,75,76] },
  { initials: "FL", name: "Fung L.", score: 93, group: "A", status: "good",     spark: [87,89,91,92,93] },
  { initials: "SC", name: "Siu C.", score: 66, group: "B", status: "attention", spark: [70,69,68,67,66] },
  { initials: "RY", name: "Rui Y.", score: 85, group: "C", status: "good",     spark: [78,80,82,84,85] },
  { initials: "DT", name: "Din T.", score: 79, group: "D", status: "good",      spark: [73,75,77,78,79] },
];

// ─── Miniature Sparkline SVG ──────────────────────────────────────────────────
const Sparkline: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
  const w = 40; const h = 18;
  const nonZero = data.filter(Boolean);
  if (nonZero.length < 2) return <svg width={w} height={h} />;
  const min = Math.min(...nonZero) - 2;
  const max = Math.max(...nonZero) + 2;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = v === 0 ? h : h - ((v - min) / (max - min)) * h;
    return `${x},${y}`;
  });
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

// ─── Student Card Component ───────────────────────────────────────────────────
const StudentCardItem: React.FC<{ card: StudentCard; selected: boolean; onClick: () => void }> = ({
  card, selected, onClick,
}) => {
  const statusColor =
    card.status === "good"      ? DS.colors.secondary :
    card.status === "absent"    ? DS.colors.error :
    DS.colors.warning;

  const bg =
    card.status === "good"      ? "#F0FDF4" :
    card.status === "absent"    ? "#FEF2F2" :
    "#FFFBEB";

  const avatarBg =
    card.status === "good"      ? DS.colors.secondary :
    card.status === "absent"    ? DS.colors.error :
    DS.colors.warning;

  return (
    <div
      onClick={onClick}
      style={{
        padding: "10px",
        borderRadius: DS.radius.md,
        border: `2px solid ${selected ? DS.colors.primary : statusColor}`,
        background: selected ? DS.colors.primaryLight : bg,
        cursor: "pointer",
        transition: "all 0.15s",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        boxShadow: selected ? `0 0 0 2px ${DS.colors.primaryLight}` : DS.shadow.sm,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <div
          style={{
            width: "28px",
            height: "28px",
            borderRadius: DS.radius.full,
            background: avatarBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: "10px",
            fontWeight: 700,
            fontFamily: DS.font.family,
            flexShrink: 0,
          }}
        >
          {card.initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "11px", fontWeight: 600, color: DS.colors.textPrimary, fontFamily: DS.font.family, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {card.name}
          </div>
          <div style={{ fontSize: "10px", color: DS.colors.textMuted, fontFamily: DS.font.family }}>
            Grp {card.group}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span
          style={{
            fontSize: "13px",
            fontWeight: 800,
            color: statusColor,
            fontFamily: DS.font.family,
          }}
        >
          {card.status === "absent" ? "ABS" : `${card.score}`}
        </span>
        <Sparkline data={card.spark} color={statusColor} />
      </div>
    </div>
  );
};

// ─── Audit Row ────────────────────────────────────────────────────────────────
const AuditRow: React.FC<{ time: string; event: string; user: string; status: "synced" | "active" | "pending" }> = ({
  time, event, user, status,
}) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "7px 0",
      borderBottom: `1px solid ${DS.colors.border}`,
      fontFamily: DS.font.family,
    }}
  >
    <span style={{ fontSize: "11px", fontWeight: 700, color: DS.colors.textMuted, minWidth: "60px", fontVariantNumeric: "tabular-nums" }}>
      {time}
    </span>
    <span style={{ fontSize: "12px", color: DS.colors.textPrimary, flex: 1 }}>{event}</span>
    <span style={{ fontSize: "11px", color: DS.colors.textSecondary }}>{user}</span>
    <StatusBadge variant={status} size="sm" />
  </div>
);

// ─── Group Aggregation Bar ────────────────────────────────────────────────────
const GroupBar: React.FC<{ groups: { label: string; score: number }[] }> = ({ groups }) => {
  const maxScore = Math.max(...groups.map((g) => g.score));
  const colors = [DS.colors.primary, DS.colors.secondary, DS.colors.warning, "#8B5CF6"];
  return (
    <div style={{ display: "flex", gap: "8px", fontFamily: DS.font.family }}>
      {groups.map((g, i) => (
        <div key={g.label} style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
          <div
            style={{
              height: "6px",
              background: DS.colors.background,
              borderRadius: DS.radius.full,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${(g.score / maxScore) * 100}%`,
                background: colors[i],
                borderRadius: DS.radius.full,
              }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px", color: DS.colors.textSecondary, fontWeight: 600 }}>
              Grp {g.label}
            </span>
            <span style={{ fontSize: "11px", fontWeight: 700, color: colors[i] }}>{g.score}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Bloom's Level Selector ───────────────────────────────────────────────────
const bloomLevels = [
  { level: 1, name: "Remember",    color: "#6B7280" },
  { level: 2, name: "Understand",  color: DS.colors.primary },
  { level: 3, name: "Apply",       color: DS.colors.secondary },
  { level: 4, name: "Analyse",     color: DS.colors.warning },
  { level: 5, name: "Evaluate",    color: "#EF4444" },
  { level: 6, name: "Create",      color: "#8B5CF6" },
];

// ─── Main Component ───────────────────────────────────────────────────────────
export const Screen05_ClassRecorder: React.FC = () => {
  const [selectedCard, setSelectedCard]     = useState<number | null>(null);
  const [manualId, setManualId]             = useState("");
  const [classFilter, setClassFilter]       = useState("1A");
  const [bloomLevel, setBloomLevel]         = useState(3);
  const [hintVisible, setHintVisible]       = useState(true);
  const [generating, setGenerating]         = useState(false);

  const handleGenerate = () => {
    setGenerating(true);
    setHintVisible(false);
    setTimeout(() => { setGenerating(false); setHintVisible(true); }, 900);
  };

  const groupScores = [
    { label: "A", score: 82 },
    { label: "B", score: 74 },
    { label: "C", score: 88 },
    { label: "D", score: 71 },
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
          Live Class Fast Recorder
        </h1>
        <p style={{ fontSize: "13px", color: DS.colors.textSecondary, margin: "4px 0 0" }}>
          模組五：實時表現記錄器 · Real-time performance recording and scaffolding
        </p>
      </div>

      {/* 3-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "25% 50% 25%", gap: "16px" }}>

        {/* ── LEFT: QR Scanner ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <Card style={{ padding: "16px" }}>
            <SectionHeader title="QR Scanner" subtitle="0.5s instant scan" />

            {/* Mock camera feed */}
            <div
              style={{
                background: "#1F2937",
                borderRadius: DS.radius.lg,
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                minHeight: "160px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Scan frame */}
              <div
                style={{
                  width: "90px",
                  height: "90px",
                  border: "3px dashed #10B981",
                  borderRadius: DS.radius.md,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  animation: "pulse 2s ease-in-out infinite",
                }}
              >
                <QrCode size={36} color="#10B981" strokeWidth={1.5} />
              </div>
              <div style={{ color: "#10B981", fontSize: "13px", fontWeight: 700, fontFamily: DS.font.family }}>
                Scanning...
              </div>
              {/* Scan line animation */}
              <div
                style={{
                  position: "absolute",
                  left: "20px",
                  right: "20px",
                  height: "2px",
                  background: "linear-gradient(90deg, transparent, #10B981, transparent)",
                  animation: "scanline 2s ease-in-out infinite",
                  top: "50%",
                }}
              />
            </div>

            {/* Last scanned */}
            <div
              style={{
                marginTop: "10px",
                padding: "10px 12px",
                background: DS.colors.secondaryLight,
                borderRadius: DS.radius.md,
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <CheckCircle2 size={15} color={DS.colors.secondary} />
              <div>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#065F46" }}>
                  Last Scanned:
                </div>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#047857" }}>
                  Chan Siu Ming
                </div>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "10px" }}>
              {[
                { label: "Today's Scans", value: "12" },
                { label: "Avg Response", value: "0.4s" },
              ].map((s) => (
                <div
                  key={s.label}
                  style={{
                    background: DS.colors.background,
                    borderRadius: DS.radius.md,
                    padding: "8px 10px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "16px", fontWeight: 800, color: DS.colors.textPrimary }}>
                    {s.value}
                  </div>
                  <div style={{ fontSize: "10px", color: DS.colors.textMuted, marginTop: "1px" }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Manual Input fallback */}
          <Card style={{ padding: "16px" }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: DS.colors.textSecondary, marginBottom: "8px" }}>
              Manual Input Fallback
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              <input
                type="text"
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                placeholder="Student ID..."
                style={{
                  flex: 1,
                  padding: "7px 10px",
                  border: `1px solid ${DS.colors.border}`,
                  borderRadius: DS.radius.md,
                  fontSize: "13px",
                  color: DS.colors.textPrimary,
                  fontFamily: DS.font.family,
                  outline: "none",
                }}
              />
              <Btn variant="primary" size="sm">
                Log
              </Btn>
            </div>
          </Card>
        </div>

        {/* ── CENTER: Group Matrix ── */}
        <Card style={{ padding: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <div>
              <div style={{ fontSize: "15px", fontWeight: 700, color: DS.colors.textPrimary }}>
                Group Performance Matrix
              </div>
              <div style={{ fontSize: "12px", color: DS.colors.textSecondary, marginTop: "1px" }}>
                Class {classFilter} · Live scores
              </div>
            </div>
            <div style={{ position: "relative" }}>
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                style={{
                  padding: "6px 24px 6px 10px",
                  border: `1px solid ${DS.colors.border}`,
                  borderRadius: DS.radius.md,
                  fontSize: "13px",
                  fontWeight: 600,
                  color: DS.colors.textPrimary,
                  background: DS.colors.surface,
                  appearance: "none",
                  cursor: "pointer",
                  fontFamily: DS.font.family,
                }}
              >
                {["1A","1B","1C","2A","2B"].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <ChevronDown size={13} color={DS.colors.textMuted} style={{ position: "absolute", right: "7px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            </div>
          </div>

          {/* Legend */}
          <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
            {[
              { color: DS.colors.secondary, label: "Good" },
              { color: DS.colors.warning,   label: "Needs Attention" },
              { color: DS.colors.error,     label: "Absent" },
            ].map((l) => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: l.color }} />
                <span style={{ fontSize: "11px", color: DS.colors.textSecondary, fontFamily: DS.font.family }}>{l.label}</span>
              </div>
            ))}
          </div>

          {/* 4×4 grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "8px",
              marginBottom: "16px",
            }}
          >
            {studentGrid.map((card, i) => (
              <StudentCardItem
                key={i}
                card={card}
                selected={selectedCard === i}
                onClick={() => setSelectedCard(selectedCard === i ? null : i)}
              />
            ))}
          </div>

          {/* Group aggregation */}
          <div
            style={{
              padding: "12px 14px",
              background: DS.colors.background,
              borderRadius: DS.radius.md,
              border: `1px solid ${DS.colors.border}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
              <Users size={13} color={DS.colors.textSecondary} />
              <span style={{ fontSize: "12px", fontWeight: 700, color: DS.colors.textSecondary }}>
                Group Aggregation
              </span>
            </div>
            <GroupBar groups={groupScores} />
          </div>
        </Card>

        {/* ── RIGHT: AI Scaffolding ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <Card style={{ padding: "16px", flex: 1 }}>
            <SectionHeader title="AI Scaffolding" subtitle="Socratic hint generator" />

            <Btn
              variant="primary"
              fullWidth
              size="lg"
              icon={<Zap size={16} />}
              onClick={handleGenerate}
              style={{ marginBottom: "14px", opacity: generating ? 0.8 : 1 }}
            >
              {generating ? "Generating..." : "Generate Scaffolded Hint ✨"}
            </Btn>

            {/* Generated hint box */}
            {hintVisible && (
              <div
                style={{
                  padding: "14px",
                  background: DS.colors.secondaryLight,
                  border: `1px solid #A7F3D0`,
                  borderRadius: DS.radius.md,
                  marginBottom: "14px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                  <Activity size={13} color={DS.colors.secondary} />
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#065F46" }}>
                    AI-Generated Socratic Hint
                  </span>
                </div>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#047857",
                    lineHeight: "1.6",
                    margin: 0,
                    fontFamily: DS.font.family,
                  }}
                >
                  Consider how the variable <em>X</em> relates to the outcome. What would happen if we changed only one condition? Think about which groups showed different results and why — what single factor could explain the variance?
                </p>
              </div>
            )}

            {/* Bloom's Level Selector */}
            <div
              style={{
                padding: "12px",
                background: DS.colors.background,
                borderRadius: DS.radius.md,
                border: `1px solid ${DS.colors.border}`,
                marginBottom: "14px",
              }}
            >
              <div style={{ fontSize: "12px", fontWeight: 700, color: DS.colors.textSecondary, marginBottom: "8px" }}>
                Hint Level — Bloom's Taxonomy
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {bloomLevels.map((b) => (
                  <button
                    key={b.level}
                    onClick={() => setBloomLevel(b.level)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "6px 10px",
                      borderRadius: DS.radius.md,
                      border: "none",
                      background: bloomLevel === b.level ? `${b.color}18` : "transparent",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background 0.15s",
                    }}
                  >
                    <div
                      style={{
                        width: "20px",
                        height: "20px",
                        borderRadius: DS.radius.sm,
                        background: bloomLevel === b.level ? b.color : DS.colors.border,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "10px",
                        fontWeight: 700,
                        color: bloomLevel === b.level ? "#fff" : DS.colors.textMuted,
                        flexShrink: 0,
                        transition: "background 0.15s",
                      }}
                    >
                      L{b.level}
                    </div>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: bloomLevel === b.level ? 700 : 400,
                        color: bloomLevel === b.level ? b.color : DS.colors.textSecondary,
                        fontFamily: DS.font.family,
                      }}
                    >
                      {b.name}
                    </span>
                    {bloomLevel === b.level && (
                      <CheckCircle2 size={12} color={b.color} style={{ marginLeft: "auto" }} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Audit Timestamps */}
            <div
              style={{
                padding: "12px",
                background: DS.colors.background,
                borderRadius: DS.radius.md,
                border: `1px solid ${DS.colors.border}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                <Clock size={13} color={DS.colors.textSecondary} />
                <span style={{ fontSize: "12px", fontWeight: 700, color: DS.colors.textSecondary }}>
                  Audit Log
                </span>
              </div>
              <AuditRow time="14:32:01" event="Session Started"    user="T. Chan"  status="synced"  />
              <AuditRow time="14:35:44" event="QR Scan Batch (×8)" user="System"   status="synced"  />
              <AuditRow time="14:41:12" event="Hint Generated L3"  user="T. Chan"  status="active"  />
              <div style={{ paddingTop: "7px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontFamily: DS.font.family,
                  }}
                >
                  <span style={{ fontSize: "11px", fontWeight: 700, color: DS.colors.textMuted, minWidth: "60px" }}>
                    14:47:03
                  </span>
                  <span style={{ fontSize: "12px", color: DS.colors.textPrimary, flex: 1 }}>
                    Score Updated — Ng G.
                  </span>
                  <span style={{ fontSize: "11px", color: DS.colors.textSecondary }}>T. Chan</span>
                  <StatusBadge variant="pending" size="sm" />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Inline keyframes for scan animation */}
      <style>{`
        @keyframes scanline {
          0%   { top: 30%; opacity: 0.8; }
          50%  { top: 70%; opacity: 1; }
          100% { top: 30%; opacity: 0.8; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
};
