import React, { useState } from "react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip, Legend,
} from "recharts";
import {
  Shield, TrendingUp, TrendingDown, Award, BookOpen, Calendar,
  ExternalLink, ChevronDown, ChevronUp, CheckCircle2, Clock,
  Sparkles, Brain, Target, BarChart3, Users, Layers,
  GitBranch, FileText, Star, ArrowUpRight,
} from "lucide-react";
import { DS, DataPrivacyShield, StatusBadge, ToggleSwitch, Card, Btn, SectionHeader } from "./DesignSystem";
import { AcornDimension } from "./Screen01_Dashboard";

// ─── Types ────────────────────────────────────────────────────────────────────

type EnvLevel = "L1" | "L2" | "L3" | "L4" | "L5" | "L6" | "L7";
type TierRole = "T1" | "T2" | "T3" | "T4";

interface AcornSnapshot {
  term: string;
  data: AcornDimension[];
}

interface Achievement {
  id: string;
  title: string;
  titleZh: string;
  category: string;
  envLevel: EnvLevel;
  tierRole: TierRole;
  hours: number;
  date: string;
  status: "verified" | "pending" | "locked";
  portfolioUrl: string;
  teacherEndorsed: boolean;
}

interface PblFootprint {
  project: string;
  role: string;
  group: string;
  score: number;
  dimension: string;
  term: string;
}

// ─── Config Maps ──────────────────────────────────────────────────────────────

const ENV_LEVEL_CONFIG: Record<EnvLevel, { label: string; labelZh: string; color: string; bg: string }> = {
  L1: { label: "Personal",     labelZh: "個人",   color: "#6B7280", bg: "#F3F4F6" },
  L2: { label: "School",       labelZh: "全校",   color: "#2563EB", bg: "#EFF6FF" },
  L3: { label: "District",     labelZh: "地區",   color: "#0891B2", bg: "#ECFEFF" },
  L4: { label: "Regional",     labelZh: "地區賽", color: "#059669", bg: "#ECFDF5" },
  L5: { label: "National",     labelZh: "全國",   color: "#7C3AED", bg: "#F5F3FF" },
  L6: { label: "Asia-Pacific", labelZh: "亞太",   color: "#C2410C", bg: "#FFF7ED" },
  L7: { label: "International",labelZh: "國際",   color: "#B45309", bg: "#FFFBEB" },
};

const TIER_CONFIG: Record<TierRole, { label: string; labelZh: string; color: string; bg: string }> = {
  T1: { label: "Member",      labelZh: "成員",   color: "#6B7280", bg: "#F3F4F6" },
  T2: { label: "Participant", labelZh: "參與者", color: "#2563EB", bg: "#EFF6FF" },
  T3: { label: "Finalist",    labelZh: "決賽",   color: "#D97706", bg: "#FFFBEB" },
  T4: { label: "Award",       labelZh: "獲獎",   color: "#B45309", bg: "#FEF3C7" },
};

const ACORN_COLORS: Record<string, string> = {
  Academic:      DS.colors.primary,
  Collaborative: DS.colors.secondary,
  Opportunity:   "#8B5CF6",
  Realm:         "#0891B2",
  Nurturing:     "#F59E0B",
  Faith:         "#EC4899",
};

const ACORN_DESCRIPTIONS: Record<string, string> = {
  Academic:      "Core subject performance & learning rigour",
  Collaborative: "Team contribution & peer learning capacity",
  Opportunity:   "Extra-curricular & competition engagement",
  Realm:         "Civic sense, values & ethical reasoning",
  Nurturing:     "Empathy, mentoring & wellbeing contribution",
  Faith:         "Spiritual development & moral formation",
};

// ─── Mock Data (PDPO compliant — no raw names) ────────────────────────────────

const STUDENT_TOKEN = "Student #TSM-4471";
const STUDENT_CLASS = "2B";
const STUDENT_FORM  = "F2";
const STUDENT_YEAR  = "2025/26";

const CURRENT_SNAPSHOT: AcornSnapshot = {
  term: "2025/26 Semester 2",
  data: [
    { axis: "Academic",      value: 82 },
    { axis: "Collaborative", value: 74 },
    { axis: "Opportunity",   value: 68 },
    { axis: "Realm",         value: 79 },
    { axis: "Nurturing",     value: 85 },
    { axis: "Faith",         value: 71 },
  ],
};

const PREVIOUS_SNAPSHOT: AcornSnapshot = {
  term: "2024/25 Annual",
  data: [
    { axis: "Academic",      value: 71 },
    { axis: "Collaborative", value: 62 },
    { axis: "Opportunity",   value: 55 },
    { axis: "Realm",         value: 70 },
    { axis: "Nurturing",     value: 74 },
    { axis: "Faith",         value: 63 },
  ],
};

// Merged for dual-series radar
const MERGED_RADAR_DATA = CURRENT_SNAPSHOT.data.map((d, i) => ({
  axis:     d.axis,
  current:  d.value,
  previous: PREVIOUS_SNAPSHOT.data[i].value,
}));

const OVERALL_GROWTH = (() => {
  const curr = CURRENT_SNAPSHOT.data.reduce((s, d) => s + d.value, 0) / 6;
  const prev = PREVIOUS_SNAPSHOT.data.reduce((s, d) => s + d.value, 0) / 6;
  return +(((curr - prev) / prev) * 100).toFixed(1);
})();

const ACHIEVEMENTS: Achievement[] = [
  {
    id: "A001",
    title: "Regional Science Competition — Gold Award",
    titleZh: "地區科學比賽 — 金獎",
    category: "STEM",
    envLevel: "L4",
    tierRole: "T4",
    hours: 24,
    date: "2025-11-15",
    status: "verified",
    portfolioUrl: "knowledgegraph://portfolio/TSM-4471-A001",
    teacherEndorsed: true,
  },
  {
    id: "A002",
    title: "Inter-School Debate — Finalist",
    titleZh: "校際辯論賽 — 決賽",
    category: "Language Arts",
    envLevel: "L3",
    tierRole: "T3",
    hours: 18,
    date: "2025-10-03",
    status: "verified",
    portfolioUrl: "knowledgegraph://portfolio/TSM-4471-A002",
    teacherEndorsed: true,
  },
  {
    id: "A003",
    title: "Community Green Ambassador Scheme",
    titleZh: "社區綠色大使計劃",
    category: "Community Service",
    envLevel: "L2",
    tierRole: "T2",
    hours: 12,
    date: "2025-09-20",
    status: "verified",
    portfolioUrl: "knowledgegraph://portfolio/TSM-4471-A003",
    teacherEndorsed: false,
  },
  {
    id: "A004",
    title: "HKMO Heat Event — School Representative",
    titleZh: "香港數學競賽 — 校隊代表",
    category: "Mathematics",
    envLevel: "L3",
    tierRole: "T2",
    hours: 10,
    date: "2025-12-07",
    status: "verified",
    portfolioUrl: "knowledgegraph://portfolio/TSM-4471-A004",
    teacherEndorsed: true,
  },
  {
    id: "A005",
    title: "Peer Mentoring Programme — Senior Mentor",
    titleZh: "朋輩輔導計劃 — 高級輔導員",
    category: "Leadership",
    envLevel: "L2",
    tierRole: "T3",
    hours: 30,
    date: "2026-01-15",
    status: "verified",
    portfolioUrl: "knowledgegraph://portfolio/TSM-4471-A005",
    teacherEndorsed: true,
  },
  {
    id: "A006",
    title: "Asia Youth Science Forum — Delegate",
    titleZh: "亞洲青年科學論壇 — 代表",
    category: "STEM",
    envLevel: "L6",
    tierRole: "T2",
    hours: 40,
    date: "2026-03-01",
    status: "pending",
    portfolioUrl: "knowledgegraph://portfolio/TSM-4471-A006",
    teacherEndorsed: false,
  },
];

const PBL_FOOTPRINTS: PblFootprint[] = [
  { project: "Climate Change Cause & Effect",  role: "Leader",     group: "Group 2", score: 91, dimension: "Collaborative", term: "2025/26 S2" },
  { project: "Plastic Waste Life-cycle Study", role: "Researcher", group: "Group 1", score: 85, dimension: "Opportunity",   term: "2025/26 S1" },
  { project: "Biodiversity Mapping HK",        role: "Presenter",  group: "Group 3", score: 79, dimension: "Realm",         term: "2024/25 S2" },
];

const AI_NARRATIVE = {
  headline: "Strong upward trajectory across all 6 ACORN dimensions (+14.3% YoY)",
  paragraphs: [
    `${STUDENT_TOKEN} demonstrates exceptional strength in the *Nurturing* dimension (85/100 — top 8% of cohort), consistently supporting peers during collaborative tasks and showing measurable impact on group outcomes. This is directly corroborated by 3 confirmed PBL leadership records.`,
    `*Academic* performance grew by +15.5% year-on-year, with particular acceleration in STEM-linked subjects following engagement with the Regional Science Competition (Gold Award, L4-T4). The system has detected a *positive feedback loop*: competition preparation is reinforcing classroom academic scores.`,
    `The *Opportunity* dimension (68/100) remains the primary growth lever. Current engagement sits at 2.3 activities per term — below the cohort median of 3.1. The AI recommends prioritising the Asia Youth Science Forum (pending, L6) as a high-multiplier opportunity that would directly address this gap and trigger an ACORN rebalancing effect.`,
    `*Faith* dimension (71/100) shows steady +12.7% growth. Recommended next action: structured reflection journaling tied to the community service portfolio, which the system estimates could yield a further +6–9 points over Semester 1 of 2026/27.`,
  ],
  bloomsTarget: "L5 — Evaluate",
  confidenceScore: 94.2,
  generatedAt: "2026-08-01 09:12:34 HKT",
  modelUsed: "Qwen2.5-72B (Local Ollama)",
};

// ─── Sub-Components ───────────────────────────────────────────────────────────

const EnvLevelBadge: React.FC<{ level: EnvLevel }> = ({ level }) => {
  const cfg = ENV_LEVEL_CONFIG[level];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "3px 8px",
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.color}40`,
        borderRadius: DS.radius.full,
        fontSize: "11px",
        fontWeight: 700,
        fontFamily: DS.font.family,
        whiteSpace: "nowrap",
      }}
    >
      {level} <span style={{ fontWeight: 400 }}>{cfg.labelZh}</span>
    </span>
  );
};

const TierBadge: React.FC<{ tier: TierRole }> = ({ tier }) => {
  const cfg = TIER_CONFIG[tier];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "3px 8px",
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.color}40`,
        borderRadius: DS.radius.full,
        fontSize: "11px",
        fontWeight: 700,
        fontFamily: DS.font.family,
        whiteSpace: "nowrap",
      }}
    >
      {tier === "T4" && <Star size={10} />}
      {tier} <span style={{ fontWeight: 400 }}>{cfg.labelZh}</span>
    </span>
  );
};

const GrowthChip: React.FC<{ value: number; label?: string }> = ({ value, label }) => {
  const positive = value >= 0;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "4px 10px",
        background: positive ? "#D1FAE5" : "#FEE2E2",
        color: positive ? "#065F46" : "#991B1B",
        border: `1px solid ${positive ? "#6EE7B7" : "#FECACA"}`,
        borderRadius: DS.radius.full,
        fontSize: "12px",
        fontWeight: 700,
        fontFamily: DS.font.family,
      }}
    >
      {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {positive ? "+" : ""}{value}% {label ?? "YoY"}
    </span>
  );
};

// Custom tooltip for the radar
const RadarTooltip: React.FC<{ active?: boolean; payload?: { name: string; value: number }[] }> = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: DS.colors.surface,
        border: `1px solid ${DS.colors.border}`,
        borderRadius: DS.radius.md,
        padding: "10px 14px",
        boxShadow: DS.shadow.md,
        fontFamily: DS.font.family,
      }}
    >
      {payload.map((p, i) => (
        <div key={i} style={{ fontSize: "12px", color: i === 0 ? DS.colors.secondary : "#9CA3AF", fontWeight: 600, marginBottom: i === 0 ? "2px" : 0 }}>
          {i === 0 ? "Current" : "Previous"}: {p.value}/100
        </div>
      ))}
    </div>
  );
};

// ACORN dimension breakdown row
const DimensionRow: React.FC<{ dim: string; current: number; previous: number }> = ({ dim, current, previous }) => {
  const delta = current - previous;
  const pct   = Math.round((delta / previous) * 100);
  const color = ACORN_COLORS[dim] ?? DS.colors.primary;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
      <div
        style={{
          width: "8px", height: "8px", borderRadius: "50%",
          background: color, flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3px" }}>
          <span style={{ fontSize: "11px", fontWeight: 600, color: DS.colors.textPrimary, fontFamily: DS.font.family }}>
            {dim}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "11px", color: DS.colors.textMuted, fontFamily: DS.font.family, textDecoration: "line-through" }}>
              {previous}
            </span>
            <span style={{ fontSize: "12px", fontWeight: 800, color, fontFamily: DS.font.family }}>
              {current}
            </span>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: delta >= 0 ? DS.colors.secondary : DS.colors.error,
                fontFamily: DS.font.family,
              }}
            >
              {delta >= 0 ? "▲" : "▼"}{Math.abs(pct)}%
            </span>
          </div>
        </div>
        <div style={{ height: "4px", background: "#F3F4F6", borderRadius: DS.radius.full, position: "relative" }}>
          {/* Previous year ghost bar */}
          <div
            style={{
              position: "absolute",
              top: 0, left: 0,
              height: "100%",
              width: `${previous}%`,
              background: "#D1D5DB",
              borderRadius: DS.radius.full,
            }}
          />
          {/* Current bar */}
          <div
            style={{
              position: "absolute",
              top: 0, left: 0,
              height: "100%",
              width: `${current}%`,
              background: color,
              borderRadius: DS.radius.full,
              transition: "width 0.6s ease-out",
            }}
          />
        </div>
      </div>
    </div>
  );
};

// ─── Injected keyframes ───────────────────────────────────────────────────────
const KEYFRAMES = `
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }
`;

// ─── Main Component ───────────────────────────────────────────────────────────
export const Screen_StudentPortfolio: React.FC = () => {
  const [showComparison, setShowComparison] = useState(true);
  const [expandedAI, setExpandedAI]         = useState(true);
  const [expandedRow, setExpandedRow]       = useState<string | null>(null);
  const [activeTab, setActiveTab]           = useState<"overview" | "pbl" | "timeline">("overview");

  const totalHours      = ACHIEVEMENTS.reduce((s, a) => s + (a.status === "verified" ? a.hours : 0), 0);
  const verifiedCount   = ACHIEVEMENTS.filter((a) => a.status === "verified").length;
  const highestEnv      = ACHIEVEMENTS.reduce((best, a) => {
    const levels: EnvLevel[] = ["L1","L2","L3","L4","L5","L6","L7"];
    return levels.indexOf(a.envLevel) > levels.indexOf(best) ? a.envLevel : best;
  }, "L1" as EnvLevel);
  const awardCount      = ACHIEVEMENTS.filter((a) => a.tierRole === "T4").length;

  return (
    <div style={{ fontFamily: DS.font.family, background: DS.colors.background, minHeight: "100vh" }}>
      <style>{KEYFRAMES}</style>

      {/* ══════════════════════════════════════════════════════════════════════
          HEADER BAND
      ══════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          background: `linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #1A3A6B 100%)`,
          padding: "28px 32px 24px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background geometry */}
        <div
          style={{
            position: "absolute", inset: 0, opacity: 0.04,
            backgroundImage: "radial-gradient(circle at 80% 50%, #7C3AED 0%, transparent 60%), radial-gradient(circle at 20% 80%, #1A56DB 0%, transparent 50%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute", top: "-40px", right: "-40px",
            width: "200px", height: "200px", borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.05)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute", top: "20px", right: "80px",
            width: "100px", height: "100px", borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.04)",
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "24px" }}>

          {/* ── Left: Identity block ── */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: "20px" }}>
            {/* Avatar */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div
                style={{
                  width: "72px", height: "72px", borderRadius: "50%",
                  background: "linear-gradient(135deg, #4338CA, #1A56DB)",
                  border: "3px solid rgba(255,255,255,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "20px", fontWeight: 800, color: "#fff",
                  fontFamily: DS.font.family,
                }}
              >
                ***
              </div>
              {/* PDPO lock icon */}
              <div
                style={{
                  position: "absolute", bottom: "-2px", right: "-2px",
                  width: "22px", height: "22px", borderRadius: "50%",
                  background: "#4338CA", border: "2px solid #1E1B4B",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <Shield size={11} color="#E0E7FF" />
              </div>
            </div>

            {/* Name + shields */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px", flexWrap: "wrap" }}>
                <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#fff", margin: 0, fontFamily: DS.font.family }}>
                  {STUDENT_TOKEN}
                </h1>
                <DataPrivacyShield label="已脫敏 PDPO 🛡️" />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                <span
                  style={{
                    fontSize: "13px", color: "#94A3B8",
                    fontFamily: DS.font.family,
                    display: "flex", alignItems: "center", gap: "5px",
                  }}
                >
                  <Users size={13} /> Class {STUDENT_CLASS} · Form {STUDENT_FORM}
                </span>
                <span style={{ fontSize: "13px", color: "#94A3B8", fontFamily: DS.font.family, display: "flex", alignItems: "center", gap: "5px" }}>
                  <Calendar size={13} /> AY {STUDENT_YEAR}
                </span>
                <span style={{ fontSize: "13px", color: "#94A3B8", fontFamily: DS.font.family, display: "flex", alignItems: "center", gap: "5px" }}>
                  <Target size={13} /> M3 · M6 Portfolio
                </span>
              </div>
              <div style={{ marginTop: "10px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <GrowthChip value={OVERALL_GROWTH} label="Overall ACORN Growth" />
                <span
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "4px",
                    padding: "4px 10px",
                    background: "rgba(245,158,11,0.15)", color: "#FCD34D",
                    border: "1px solid rgba(245,158,11,0.3)",
                    borderRadius: DS.radius.full, fontSize: "12px", fontWeight: 700,
                    fontFamily: DS.font.family,
                  }}
                >
                  <Award size={11} /> {awardCount} Gold Award{awardCount !== 1 ? "s" : ""}
                </span>
                <span
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "4px",
                    padding: "4px 10px",
                    background: "rgba(16,185,129,0.15)", color: "#6EE7B7",
                    border: "1px solid rgba(16,185,129,0.3)",
                    borderRadius: DS.radius.full, fontSize: "12px", fontWeight: 700,
                    fontFamily: DS.font.family,
                  }}
                >
                  <Clock size={11} /> {totalHours}h Logged
                </span>
                <EnvLevelBadge level={highestEnv} />
              </div>
            </div>
          </div>

          {/* ── Right: quick stat pills ── */}
          <div style={{ display: "flex", gap: "12px", flexShrink: 0 }}>
            {[
              { label: "ACORN Score",     value: "76.5",    sub: "/100", color: DS.colors.secondary },
              { label: "Achievements",    value: `${verifiedCount}`,  sub: "verified",  color: "#8B5CF6" },
              { label: "PBL Projects",    value: `${PBL_FOOTPRINTS.length}`,   sub: "records",  color: DS.colors.primary },
              { label: "Hours",           value: `${totalHours}`,      sub: "service", color: "#F59E0B" },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: DS.radius.lg,
                  padding: "12px 16px",
                  textAlign: "center",
                  minWidth: "80px",
                }}
              >
                <div
                  style={{
                    fontSize: "22px", fontWeight: 800,
                    color: s.color, fontFamily: DS.font.family,
                    lineHeight: 1.1,
                  }}
                >
                  {s.value}
                  <span style={{ fontSize: "13px", color: "#94A3B8", fontWeight: 400 }}>{s.sub}</span>
                </div>
                <div style={{ fontSize: "10px", color: "#64748B", marginTop: "3px", fontFamily: DS.font.family, fontWeight: 600 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Module breadcrumb bar */}
        <div
          style={{
            marginTop: "18px",
            paddingTop: "14px",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {[
            { badge: "M3", label: "跨年級歷史增值軌跡比對", color: "#0891B2" },
            { badge: "M6", label: "成果檔案智能組裝",       color: "#8B5CF6" },
            { badge: "M6b", label: "優秀成果課件庫",        color: "#6366F1" },
          ].map((m, i) => (
            <React.Fragment key={m.badge}>
              {i > 0 && <ChevronDown size={12} color="#475569" style={{ transform: "rotate(-90deg)" }} />}
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span
                  style={{
                    fontSize: "10px", fontWeight: 800,
                    padding: "2px 6px",
                    background: m.color,
                    color: "#fff",
                    borderRadius: "3px",
                    fontFamily: DS.font.family,
                  }}
                >
                  {m.badge}
                </span>
                <span style={{ fontSize: "11px", color: "#94A3B8", fontFamily: DS.font.family }}>
                  {m.label}
                </span>
              </div>
            </React.Fragment>
          ))}
          <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
            <Btn variant="secondary" size="sm" icon={<FileText size={13} />}
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "#CBD5E1", fontSize: "12px" }}>
              Export PDF
            </Btn>
            <Btn variant="secondary" size="sm" icon={<ExternalLink size={13} />}
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "#CBD5E1", fontSize: "12px" }}>
              Share Portfolio
            </Btn>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB BAR
      ══════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          background: DS.colors.surface,
          borderBottom: `1px solid ${DS.colors.border}`,
          padding: "0 32px",
          display: "flex",
          gap: "0",
        }}
      >
        {(["overview", "pbl", "timeline"] as const).map((tab) => {
          const labels = { overview: "ACORN Overview", pbl: "PBL Footprints", timeline: "Achievement Timeline" };
          const icons  = {
            overview: <BarChart3 size={14} />,
            pbl:      <Users size={14} />,
            timeline: <GitBranch size={14} />,
          };
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "14px 18px",
                background: "transparent",
                border: "none",
                borderBottom: active ? `2px solid ${DS.colors.primary}` : "2px solid transparent",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: active ? 700 : 500,
                color: active ? DS.colors.primary : DS.colors.textSecondary,
                fontFamily: DS.font.family,
                transition: "all 0.15s",
              }}
            >
              {icons[tab]}
              {labels[tab]}
            </button>
          );
        })}
      </div>

      <div style={{ padding: "28px 32px" }}>

        {/* ══════════════════════════════════════════════════════════════════
            TAB: OVERVIEW — ACORN + AI NARRATIVE
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", animation: "fadeInUp 0.3s ease-out" }}>

            {/* ── LEFT: ACORN Radar Hero ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <Card style={{ padding: "24px", position: "relative", overflow: "visible" }}>

                {/* Temporal comparison toggle */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "20px",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <h2 style={{ fontSize: "16px", fontWeight: 800, color: DS.colors.textPrimary, margin: 0, fontFamily: DS.font.family }}>
                        ACORN Holistic Index
                      </h2>
                      <span
                        style={{
                          fontSize: "10px", fontWeight: 700,
                          padding: "2px 6px",
                          background: "#0891B2", color: "#fff",
                          borderRadius: "3px", fontFamily: DS.font.family,
                        }}
                      >
                        M3
                      </span>
                    </div>
                    <p style={{ fontSize: "12px", color: DS.colors.textSecondary, margin: "2px 0 0", fontFamily: DS.font.family }}>
                      6-dimensional individual student profile
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <GrowthChip value={OVERALL_GROWTH} />
                    <ToggleSwitch
                      checked={showComparison}
                      onChange={setShowComparison}
                      label="Compare YoY"
                    />
                  </div>
                </div>

                {/* Term labels */}
                <div style={{ display: "flex", gap: "16px", marginBottom: "12px", justifyContent: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: "12px", height: "3px", background: DS.colors.secondary, borderRadius: "2px" }} />
                    <span style={{ fontSize: "11px", color: DS.colors.textSecondary, fontFamily: DS.font.family }}>
                      {CURRENT_SNAPSHOT.term}
                    </span>
                  </div>
                  {showComparison && (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <div
                        style={{
                          width: "12px", height: "2px",
                          background: "#9CA3AF",
                          borderRadius: "2px",
                          borderTop: "2px dashed #9CA3AF",
                        }}
                      />
                      <span style={{ fontSize: "11px", color: DS.colors.textMuted, fontFamily: DS.font.family }}>
                        {PREVIOUS_SNAPSHOT.term} (ghost)
                      </span>
                    </div>
                  )}
                </div>

                {/* Radar chart */}
                <div style={{ height: "320px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={MERGED_RADAR_DATA} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                      <PolarGrid stroke={DS.colors.border} />
                      <PolarAngleAxis
                        dataKey="axis"
                        tick={{ fontSize: 12, fontFamily: DS.font.family, fill: DS.colors.textSecondary, fontWeight: 600 }}
                      />
                      <PolarRadiusAxis
                        angle={90}
                        domain={[0, 100]}
                        tick={{ fontSize: 9, fill: DS.colors.textMuted }}
                        tickCount={5}
                      />
                      <Tooltip content={<RadarTooltip />} />

                      {/* Previous year — ghost layer (shown when comparison on) */}
                      {showComparison && (
                        <Radar
                          name={PREVIOUS_SNAPSHOT.term}
                          dataKey="previous"
                          stroke="#9CA3AF"
                          strokeWidth={1.5}
                          strokeDasharray="5 3"
                          fill="#9CA3AF"
                          fillOpacity={0.07}
                          dot={false}
                        />
                      )}

                      {/* Current — solid fill */}
                      <Radar
                        name={CURRENT_SNAPSHOT.term}
                        dataKey="current"
                        stroke={DS.colors.secondary}
                        strokeWidth={2.5}
                        fill={DS.colors.secondary}
                        fillOpacity={0.18}
                        dot={{ fill: DS.colors.secondary, r: 4, strokeWidth: 2, stroke: "#fff" }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* Growth summary strip */}
                {showComparison && (
                  <div
                    style={{
                      marginTop: "16px",
                      background: "#F0FDF4",
                      border: "1px solid #A7F3D0",
                      borderRadius: DS.radius.md,
                      padding: "10px 14px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      animation: "fadeInUp 0.3s ease-out",
                    }}
                  >
                    <TrendingUp size={16} color={DS.colors.secondary} />
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "#065F46", fontFamily: DS.font.family }}>
                        跨年級增值軌跡 (M3) ·&nbsp;
                      </span>
                      <span style={{ fontSize: "12px", color: "#047857", fontFamily: DS.font.family }}>
                        All 6 dimensions show positive growth vs {PREVIOUS_SNAPSHOT.term}.
                        Strongest gain: <strong>Opportunity +23.6%</strong>. Highest absolute: <strong>Nurturing 85</strong>.
                      </span>
                    </div>
                    <GrowthChip value={OVERALL_GROWTH} label="avg" />
                  </div>
                )}
              </Card>

              {/* ── ACORN dimension breakdown card ── */}
              <Card style={{ padding: "20px" }}>
                <SectionHeader
                  title="Dimension Breakdown"
                  subtitle={`${CURRENT_SNAPSHOT.term} vs ${PREVIOUS_SNAPSHOT.term}`}
                  badge={
                    <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 6px", background: "#0891B2", color: "#fff", borderRadius: "3px", fontFamily: DS.font.family }}>
                      M3
                    </span>
                  }
                />
                {MERGED_RADAR_DATA.map((d) => (
                  <DimensionRow
                    key={d.axis}
                    dim={d.axis}
                    current={d.current}
                    previous={d.previous}
                  />
                ))}
                <div
                  style={{
                    marginTop: "12px",
                    padding: "10px",
                    background: DS.colors.background,
                    borderRadius: DS.radius.md,
                    fontSize: "11px",
                    color: DS.colors.textMuted,
                    fontFamily: DS.font.family,
                    display: "flex",
                    gap: "8px",
                    alignItems: "flex-start",
                  }}
                >
                  <span style={{ flexShrink: 0 }}>ℹ️</span>
                  <span>Greyed bars show previous year baseline. Coloured bars show current term. Percentage indicates year-on-year delta per dimension.</span>
                </div>
              </Card>
            </div>

            {/* ── RIGHT: AI Scaffolding Feedback (M6) ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <Card
                style={{
                  border: "2px solid #A5B4FC",
                  overflow: "hidden",
                  boxShadow: "0 4px 20px rgba(99,102,241,0.12)",
                }}
              >
                {/* Card header */}
                <div
                  style={{
                    padding: "16px 20px",
                    background: "linear-gradient(135deg, #4338CA, #6D28D9)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Brain size={18} color="#E0E7FF" />
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: 800, color: "#fff", fontFamily: DS.font.family }}>
                        AI Scaffolding Narrative
                      </div>
                      <div style={{ fontSize: "11px", color: "#C7D2FE", fontFamily: DS.font.family }}>
                        模組六: 成果檔案智能組裝
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        fontSize: "10px", fontWeight: 700,
                        padding: "2px 7px",
                        background: "rgba(255,255,255,0.15)",
                        color: "#E0E7FF",
                        borderRadius: DS.radius.full,
                        fontFamily: DS.font.family,
                      }}
                    >
                      M6
                    </span>
                    <span
                      style={{
                        display: "inline-flex", alignItems: "center", gap: "3px",
                        fontSize: "10px", fontWeight: 700,
                        padding: "2px 7px",
                        background: "rgba(16,185,129,0.25)", color: "#6EE7B7",
                        border: "1px solid rgba(16,185,129,0.3)",
                        borderRadius: DS.radius.full, fontFamily: DS.font.family,
                      }}
                    >
                      <CheckCircle2 size={9} /> {AI_NARRATIVE.confidenceScore}% confidence
                    </span>
                    <button
                      onClick={() => setExpandedAI(!expandedAI)}
                      style={{ background: "transparent", border: "none", cursor: "pointer", color: "#C7D2FE", display: "flex" }}
                    >
                      {expandedAI ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {/* Headline */}
                <div
                  style={{
                    padding: "14px 20px",
                    background: "#EEF2FF",
                    borderBottom: "1px solid #C7D2FE",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <Sparkles size={15} color="#4338CA" />
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#3730A3", fontFamily: DS.font.family }}>
                    {AI_NARRATIVE.headline}
                  </span>
                </div>

                {expandedAI && (
                  <>
                    {/* Narrative paragraphs */}
                    <div style={{ padding: "18px 20px", borderBottom: "1px solid #E0E7FF" }}>
                      {AI_NARRATIVE.paragraphs.map((para, i) => (
                        <p
                          key={i}
                          style={{
                            fontSize: "13px",
                            color: DS.colors.textPrimary,
                            lineHeight: "1.75",
                            margin: i > 0 ? "12px 0 0" : "0",
                            fontFamily: DS.font.family,
                          }}
                          dangerouslySetInnerHTML={{
                            __html: para.replace(
                              /\*(.*?)\*/g,
                              `<span style="color:${DS.colors.primary};font-weight:700">$1</span>`
                            ),
                          }}
                        />
                      ))}
                    </div>

                    {/* Recommended action chips */}
                    <div style={{ padding: "12px 20px", background: "#FAFBFF", borderBottom: "1px solid #E0E7FF" }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "#4338CA", marginBottom: "8px", fontFamily: DS.font.family, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        AI Recommendations
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {[
                          { icon: <Target size={11} />, text: "Pursue L6 Asia Youth Forum",   color: "#7C3AED" },
                          { icon: <BookOpen size={11} />, text: "Start reflection journal",    color: DS.colors.secondary },
                          { icon: <Star size={11} />, text: "Target Opportunity dimension",   color: DS.colors.warning },
                          { icon: <ArrowUpRight size={11} />, text: "3 activities → 3.1 avg", color: DS.colors.primary },
                        ].map((chip, i) => (
                          <span
                            key={i}
                            style={{
                              display: "inline-flex", alignItems: "center", gap: "5px",
                              padding: "5px 10px",
                              background: `${chip.color}10`,
                              border: `1px solid ${chip.color}30`,
                              borderRadius: DS.radius.full,
                              fontSize: "11px", fontWeight: 600,
                              color: chip.color,
                              fontFamily: DS.font.family,
                              cursor: "pointer",
                            }}
                          >
                            {chip.icon}{chip.text}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* AI meta footer */}
                    <div
                      style={{
                        padding: "10px 20px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: "8px",
                      }}
                    >
                      <div style={{ display: "flex", gap: "16px" }}>
                        {[
                          { icon: <Brain size={12} />,    label: "Model",   value: AI_NARRATIVE.modelUsed },
                          { icon: <Layers size={12} />,   label: "Bloom's", value: AI_NARRATIVE.bloomsTarget },
                          { icon: <Clock size={12} />,    label: "Generated", value: AI_NARRATIVE.generatedAt },
                        ].map((m) => (
                          <div key={m.label} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <span style={{ color: "#6366F1" }}>{m.icon}</span>
                            <span style={{ fontSize: "10px", color: DS.colors.textMuted, fontFamily: DS.font.family }}>
                              {m.label}:
                            </span>
                            <span style={{ fontSize: "10px", color: DS.colors.textSecondary, fontWeight: 600, fontFamily: DS.font.family }}>
                              {m.value}
                            </span>
                          </div>
                        ))}
                      </div>
                      <DataPrivacyShield label="Narrative de-identified 🛡️" />
                    </div>
                  </>
                )}
              </Card>

              {/* ── PBL quick summary ── */}
              <Card style={{ padding: "20px" }}>
                <SectionHeader
                  title="PBL Footprints"
                  subtitle="Project-Based Learning records linked to ACORN dimensions"
                  actions={
                    <button
                      onClick={() => setActiveTab("pbl")}
                      style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "12px", color: DS.colors.primary, fontFamily: DS.font.family, fontWeight: 600 }}
                    >
                      View all →
                    </button>
                  }
                />
                {PBL_FOOTPRINTS.map((p, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "10px",
                      background: DS.colors.background,
                      borderRadius: DS.radius.md,
                      marginBottom: "8px",
                      border: `1px solid ${DS.colors.border}`,
                    }}
                  >
                    <div
                      style={{
                        width: "36px", height: "36px", borderRadius: DS.radius.md,
                        background: `${ACORN_COLORS[p.dimension]}18`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Users size={16} color={ACORN_COLORS[p.dimension]} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "12px", fontWeight: 600, color: DS.colors.textPrimary, fontFamily: DS.font.family, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.project}
                      </div>
                      <div style={{ fontSize: "11px", color: DS.colors.textMuted, fontFamily: DS.font.family }}>
                        {p.role} · {p.group} · {p.term}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "3px" }}>
                      <span
                        style={{
                          fontSize: "11px", fontWeight: 700,
                          color: ACORN_COLORS[p.dimension],
                          fontFamily: DS.font.family,
                        }}
                      >
                        ↳ {p.dimension}
                      </span>
                      <span
                        style={{
                          fontSize: "13px", fontWeight: 800,
                          color: p.score >= 80 ? DS.colors.secondary : DS.colors.warning,
                          fontFamily: DS.font.family,
                        }}
                      >
                        {p.score}/100
                      </span>
                    </div>
                  </div>
                ))}
              </Card>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB: PBL FOOTPRINTS
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "pbl" && (
          <div style={{ animation: "fadeInUp 0.3s ease-out" }}>
            <Card style={{ padding: "24px" }}>
              <SectionHeader
                title="Project-Based Learning Footprints"
                subtitle="All recorded PBL participation mapped to ACORN dimensions"
              />
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {PBL_FOOTPRINTS.map((p, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "16px 20px",
                      background: DS.colors.background,
                      borderRadius: DS.radius.lg,
                      border: `1px solid ${DS.colors.border}`,
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                    }}
                  >
                    <div
                      style={{
                        width: "44px", height: "44px", borderRadius: DS.radius.md,
                        background: `${ACORN_COLORS[p.dimension]}15`,
                        border: `1.5px solid ${ACORN_COLORS[p.dimension]}40`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Users size={20} color={ACORN_COLORS[p.dimension]} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "14px", fontWeight: 700, color: DS.colors.textPrimary, fontFamily: DS.font.family, marginBottom: "4px" }}>
                        {p.project}
                      </div>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "12px", color: DS.colors.textSecondary, fontFamily: DS.font.family }}>
                          Role: <strong>{p.role}</strong>
                        </span>
                        <span style={{ fontSize: "12px", color: DS.colors.textSecondary, fontFamily: DS.font.family }}>
                          · {p.group}
                        </span>
                        <span style={{ fontSize: "12px", color: DS.colors.textSecondary, fontFamily: DS.font.family }}>
                          · {p.term}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div
                        style={{
                          padding: "4px 10px",
                          background: `${ACORN_COLORS[p.dimension]}12`,
                          border: `1px solid ${ACORN_COLORS[p.dimension]}30`,
                          borderRadius: DS.radius.full,
                          fontSize: "11px", fontWeight: 700,
                          color: ACORN_COLORS[p.dimension],
                          fontFamily: DS.font.family,
                        }}
                      >
                        ↳ {p.dimension}
                      </div>
                      <div style={{ fontSize: "22px", fontWeight: 800, color: p.score >= 80 ? DS.colors.secondary : DS.colors.warning, fontFamily: DS.font.family }}>
                        {p.score}
                        <span style={{ fontSize: "12px", color: DS.colors.textMuted, fontWeight: 400 }}>/100</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            ACHIEVEMENTS MATRIX (shown on both overview and timeline tabs)
        ══════════════════════════════════════════════════════════════════ */}
        {(activeTab === "overview" || activeTab === "timeline") && (
          <div style={{ marginTop: "24px", animation: "fadeInUp 0.35s ease-out" }}>
            <Card style={{ overflow: "hidden" }}>
              {/* Table header */}
              <div
                style={{
                  padding: "16px 24px",
                  borderBottom: `1px solid ${DS.colors.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <h2 style={{ fontSize: "15px", fontWeight: 800, color: DS.colors.textPrimary, margin: 0, fontFamily: DS.font.family }}>
                      Achievements Matrix
                    </h2>
                    <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 6px", background: "#8B5CF6", color: "#fff", borderRadius: "3px", fontFamily: DS.font.family }}>
                      M6
                    </span>
                  </div>
                  <p style={{ fontSize: "12px", color: DS.colors.textSecondary, margin: "2px 0 0", fontFamily: DS.font.family }}>
                    {verifiedCount} verified · {ACHIEVEMENTS.length - verifiedCount} pending
                  </p>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <StatusBadge variant="active"  label={`${verifiedCount} Verified`}  size="sm" />
                  <StatusBadge variant="pending" label={`${ACHIEVEMENTS.length - verifiedCount} Pending`} size="sm" />
                </div>
              </div>

              {/* Column headers */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "2.5fr 80px 80px 56px 100px 90px 80px",
                  gap: "0",
                  padding: "8px 24px",
                  background: "#F8FAFC",
                  borderBottom: `1px solid ${DS.colors.border}`,
                }}
              >
                {["Activity", "Env Level", "Tier", "Hrs", "Date", "Status", "Actions"].map((h) => (
                  <div
                    key={h}
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: DS.colors.textMuted,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      fontFamily: DS.font.family,
                      padding: "0 4px",
                    }}
                  >
                    {h}
                  </div>
                ))}
              </div>

              {/* Rows */}
              {ACHIEVEMENTS.map((ach) => {
                const isExpanded = expandedRow === ach.id;
                const statusVariant =
                  ach.status === "verified" ? "synced" :
                  ach.status === "pending"  ? "pending" : "info";

                return (
                  <React.Fragment key={ach.id}>
                    <div
                      onClick={() => setExpandedRow(isExpanded ? null : ach.id)}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "2.5fr 80px 80px 56px 100px 90px 80px",
                        gap: "0",
                        padding: "13px 24px",
                        borderBottom: `1px solid ${DS.colors.border}`,
                        cursor: "pointer",
                        background: isExpanded ? DS.colors.primaryLight : "transparent",
                        transition: "background 0.15s",
                        alignItems: "center",
                      }}
                    >
                      {/* Activity */}
                      <div style={{ paddingRight: "12px" }}>
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: 600,
                            color: DS.colors.textPrimary,
                            fontFamily: DS.font.family,
                            marginBottom: "2px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {ach.title}
                        </div>
                        <div
                          style={{
                            fontSize: "11px",
                            color: DS.colors.textMuted,
                            fontFamily: DS.font.family,
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <span
                            style={{
                              padding: "1px 6px",
                              background: "#F3F4F6",
                              borderRadius: "3px",
                              fontSize: "10px",
                              fontWeight: 600,
                              color: DS.colors.textSecondary,
                            }}
                          >
                            {ach.category}
                          </span>
                          {ach.teacherEndorsed && (
                            <span style={{ color: DS.colors.secondary, display: "flex", alignItems: "center", gap: "3px" }}>
                              <CheckCircle2 size={10} /> Endorsed
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Env Level */}
                      <div><EnvLevelBadge level={ach.envLevel} /></div>

                      {/* Tier */}
                      <div><TierBadge tier={ach.tierRole} /></div>

                      {/* Hours */}
                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: 700,
                          color: DS.colors.textPrimary,
                          fontFamily: DS.font.family,
                        }}
                      >
                        {ach.hours}h
                      </div>

                      {/* Date */}
                      <div
                        style={{
                          fontSize: "12px",
                          color: DS.colors.textSecondary,
                          fontFamily: DS.font.family,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {ach.date}
                      </div>

                      {/* Status */}
                      <div>
                        <StatusBadge variant={statusVariant as "synced" | "pending" | "info"} size="sm" />
                      </div>

                      {/* Actions */}
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          style={{
                            background: "transparent",
                            border: `1px solid ${DS.colors.border}`,
                            borderRadius: DS.radius.sm,
                            padding: "4px 6px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                          }}
                          title="View portfolio"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink size={12} color={DS.colors.textMuted} />
                        </button>
                        <button
                          style={{
                            background: "transparent",
                            border: `1px solid ${DS.colors.border}`,
                            borderRadius: DS.radius.sm,
                            padding: "4px 6px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                          }}
                          onClick={(e) => { e.stopPropagation(); setExpandedRow(isExpanded ? null : ach.id); }}
                        >
                          {isExpanded
                            ? <ChevronUp size={12} color={DS.colors.textMuted} />
                            : <ChevronDown size={12} color={DS.colors.textMuted} />
                          }
                        </button>
                      </div>
                    </div>

                    {/* Expanded detail row */}
                    {isExpanded && (
                      <div
                        style={{
                          padding: "16px 24px 16px 40px",
                          background: "#EFF6FF",
                          borderBottom: `1px solid ${DS.colors.border}`,
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "16px",
                          animation: "fadeInUp 0.2s ease-out",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: "11px", fontWeight: 700, color: DS.colors.textMuted, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: DS.font.family }}>
                            Traditional Chinese Title
                          </div>
                          <div style={{ fontSize: "13px", color: DS.colors.textPrimary, fontFamily: DS.font.family }}>
                            {ach.titleZh}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: "11px", fontWeight: 700, color: DS.colors.textMuted, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: DS.font.family }}>
                            Portfolio URL
                          </div>
                          <div
                            style={{
                              fontSize: "11px",
                              color: DS.colors.primary,
                              fontFamily: "'Courier New', monospace",
                              wordBreak: "break-all",
                            }}
                          >
                            {ach.portfolioUrl}
                          </div>
                        </div>
                        <div style={{ gridColumn: "1 / -1", display: "flex", gap: "8px", alignItems: "center" }}>
                          <DataPrivacyShield label="Student ID tokenized 🛡️" />
                          {ach.teacherEndorsed && (
                            <span style={{ fontSize: "11px", color: DS.colors.secondary, display: "flex", alignItems: "center", gap: "4px", fontFamily: DS.font.family }}>
                              <CheckCircle2 size={12} /> Teacher-endorsed record
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}

              {/* Table footer */}
              <div
                style={{
                  padding: "12px 24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "#F8FAFC",
                }}
              >
                <span style={{ fontSize: "12px", color: DS.colors.textMuted, fontFamily: DS.font.family }}>
                  Showing {ACHIEVEMENTS.length} of {ACHIEVEMENTS.length} records · {totalHours} total hours
                </span>
                <div style={{ display: "flex", gap: "8px" }}>
                  <DataPrivacyShield label="All records de-identified" />
                  <Btn variant="secondary" size="sm" icon={<FileText size={13} />}>
                    Export Matrix PDF
                  </Btn>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
