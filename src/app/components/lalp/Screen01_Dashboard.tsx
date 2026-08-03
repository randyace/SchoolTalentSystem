import React, { useState } from "react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
} from "recharts";
import { QrCode, Users, CheckCircle2, Clock, AlertCircle, ChevronRight, Zap } from "lucide-react";
import {
  DS, StatusBadge, DataPrivacyShield, Card, Btn, SectionHeader, StatCard,
} from "./DesignSystem";

// ─── Public Data Interfaces (exported for Git submodule consumers) ─────────────

export interface AcornDimension {
  axis: string;
  value: number;
}

export interface EngagementBreakdown {
  label: string;
  pts: number;
  color: string;
  pct: number;
}

export interface EngagementData {
  totalPts: number;
  maxPts: number;
  subtitle: string;
  breakdown: EngagementBreakdown[];
}

export interface ClassOverviewItem {
  label: string;
  value: string;
  badgeVariant: "present" | "active" | "info" | "synced" | "warning" | "error" | "pending" | "absent" | "exempt";
  badgeLabel?: string;
}

/**
 * PDPO-compliant activity record.
 * - `name` MUST be pre-tokenized upstream (e.g., "Student #TSM-4471") before
 *   being passed into this interface. Raw legal names MUST NOT appear here for
 *   any record where `masked: true`.
 * - `masked` is a display flag only — it renders the DataPrivacyShield badge
 *   alongside the already-tokenized name. No name selection logic lives in the
 *   component; it blindly renders whatever `name` it receives.
 */
export interface ActivityItem {
  initials: string;
  name: string;
  action: string;
  time: string;
  color: string;
  masked?: boolean;
}

export interface DashboardStatItem {
  label: string;
  value: string;
  delta?: string;
  positive?: boolean;
  color: string;
}

export interface AiHint {
  text: string;
}

// ─── Module-Scope Mock Data (lifted out of component body) ───────────────────
// These constants act as the default prop values and represent the contract
// between this presentational component and a real data pipeline. In production,
// LALPApp or a data-layer container passes live equivalents via props.

export const MOCK_ACORN_DATA: AcornDimension[] = [
  { axis: "Academic",      value: 82 },
  { axis: "Collaborative", value: 74 },
  { axis: "Opportunity",   value: 68 },
  { axis: "Realm",         value: 79 },
  { axis: "Nurturing",     value: 85 },
  { axis: "Faith",         value: 71 },
];

export const MOCK_ENGAGEMENT_DATA: EngagementData = {
  totalPts: 847,
  maxPts: 1000,
  subtitle: "Module D · This Week",
  breakdown: [
    { label: "Participation", pts: 340, color: DS.colors.primary,   pct: 0.40 },
    { label: "Assessments",   pts: 280, color: DS.colors.secondary, pct: 0.33 },
    { label: "Collaboration", pts: 227, color: DS.colors.warning,   pct: 0.27 },
  ],
};

export const MOCK_CLASS_OVERVIEW: ClassOverviewItem[] = [
  { label: "Present",      value: "28/32", badgeVariant: "present" },
  { label: "Avg Score",    value: "78.4%", badgeVariant: "active",  badgeLabel: "Good" },
  { label: "Active Tasks", value: "6",     badgeVariant: "info",    badgeLabel: "Open" },
];

export const MOCK_DASHBOARD_STATS: DashboardStatItem[] = [
  { label: "Students Present", value: "28 / 32", delta: "+2 vs yesterday", positive: true,  color: DS.colors.primary   },
  { label: "Avg Engagement",   value: "84.3%",   delta: "3.1% this week",  positive: true,  color: DS.colors.secondary },
  { label: "Tasks Submitted",  value: "142",      delta: "6 pending",                        color: DS.colors.warning   },
  { label: "AI Alerts",        value: "3",                                                    color: DS.colors.error     },
];

/**
 * PDPO-compliant mock activity feed.
 *
 * Record 4 is a privacy-sensitive record from the Module 1 de-sensitization
 * pipeline. The raw legal name "Tam Siu Ming" has been REMOVED from this data
 * layer and replaced with the tokenized identifier "Student #TSM-4471".
 * The `masked: true` flag instructs the UI to render DataPrivacyShield
 * alongside the token — it does NOT perform any name substitution itself.
 */
export const MOCK_ACTIVITIES: ActivityItem[] = [
  {
    initials: "LKM",
    name: "Lee Ka Ming",
    action: "Submitted Assignment 3B",
    time: "2m ago",
    color: "#1A56DB",
  },
  {
    initials: "CWL",
    name: "Chan Wai Lam",
    action: "Completed quiz — scored 91%",
    time: "8m ago",
    color: "#10B981",
  },
  {
    initials: "WXY",
    name: "Wong Xiu Ying",
    action: "Joined breakout room #2",
    time: "14m ago",
    color: "#F59E0B",
  },
  {
    initials: "***",
    name: "Student #TSM-4471",           // Tokenized by Module 1 pipeline. Raw name permanently removed.
    action: "Attendance recorded",
    time: "22m ago",
    color: "#6B7280",
    masked: true,                         // Display-only flag: append DataPrivacyShield. No branching on name.
  },
];

export const MOCK_AI_HINT: AiHint = {
  text: "Collaborative dimension is trending 8% below Academic scores. Consider introducing more peer-to-peer learning activities in upcoming sessions to strengthen group cohesion.",
};

// ─── Props Interface for Screen01_Dashboard ───────────────────────────────────

export interface Screen01DashboardProps {
  acornData?: AcornDimension[];
  engagementData?: EngagementData;
  classOverview?: ClassOverviewItem[];
  stats?: DashboardStatItem[];
  activities?: ActivityItem[];
  aiHint?: AiHint;
}

// ─── Sub-Components (Presentational, no internal data) ───────────────────────

const CircularRing: React.FC<{ value: number; max: number; size?: number; color?: string }> = ({
  value, max, size = 120, color = DS.colors.primary,
}) => {
  const r = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const filled = (value / max) * circ;
  return (
    <svg width={size} height={size} style={{ display: "block" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={DS.colors.border} strokeWidth={10} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke={color}
        strokeWidth={10}
        strokeDasharray={`${filled} ${circ - filled}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
};

const MiniCalendar: React.FC = () => {
  const today = new Date();
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });
  return (
    <div style={{ fontFamily: DS.font.family }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
        {dayNames.map((d) => (
          <div key={d} style={{ flex: 1, textAlign: "center", fontSize: "11px", color: DS.colors.textMuted, fontWeight: 600 }}>
            {d}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        {days.map((d, i) => {
          const isToday = d.toDateString() === today.toDateString();
          return (
            <div
              key={i}
              style={{
                flex: 1,
                textAlign: "center",
                padding: "6px 2px",
                borderRadius: DS.radius.md,
                fontSize: "13px",
                fontWeight: isToday ? 700 : 400,
                background: isToday ? DS.colors.primary : "transparent",
                color: isToday ? "#fff" : DS.colors.textPrimary,
                cursor: "pointer",
              }}
            >
              {d.getDate()}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── AcornRadarWidget (pure presentational) ───────────────────────────────────
const AcornRadarWidget: React.FC<{ data: AcornDimension[]; hint: AiHint }> = ({ data, hint }) => (
  <Card style={{ padding: "20px" }}>
    <SectionHeader
      title="ACORN Holistic Index"
      subtitle="Aggregated class performance across 6 dimensions"
      badge={<StatusBadge variant="active" label="Live" size="sm" />}
    />
    <div style={{ height: "280px" }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
          <PolarGrid stroke={DS.colors.border} />
          <PolarAngleAxis
            dataKey="axis"
            tick={{ fontSize: 12, fontFamily: DS.font.family, fill: DS.colors.textSecondary, fontWeight: 600 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: DS.colors.textMuted }}
            tickCount={4}
          />
          <Radar
            name="Class Average"
            dataKey="value"
            stroke="#10B981"
            fill="rgba(16,185,129,0.2)"
            strokeWidth={2}
            dot={{ fill: "#10B981", r: 4 }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
    <div
      style={{
        marginTop: "12px",
        background: DS.colors.secondaryLight,
        borderRadius: DS.radius.md,
        padding: "12px 14px",
        border: "1px solid #A7F3D0",
      }}
    >
      <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
        <span style={{ fontSize: "16px" }}>🤖</span>
        <div>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "#065F46", marginBottom: "2px" }}>
            AI Pedagogical Hint
          </div>
          <div style={{ fontSize: "13px", color: "#047857", lineHeight: "1.5" }}>
            {hint.text}
          </div>
        </div>
      </div>
    </div>
  </Card>
);

// ─── EngagementIndexWidget (pure presentational) ──────────────────────────────
const EngagementIndexWidget: React.FC<{ data: EngagementData }> = ({ data }) => (
  <Card style={{ padding: "20px" }}>
    <SectionHeader title="Engagement Index" subtitle={data.subtitle} />
    <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "16px" }}>
      <div style={{ position: "relative", flexShrink: 0 }}>
        <CircularRing value={data.totalPts} max={data.maxPts} size={110} color={DS.colors.primary} />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: "20px", fontWeight: 800, color: DS.colors.textPrimary, fontFamily: DS.font.family }}>
            {data.totalPts}
          </span>
          <span style={{ fontSize: "11px", color: DS.colors.textMuted, fontFamily: DS.font.family }}>pts</span>
        </div>
      </div>
      <div style={{ flex: 1 }}>
        {data.breakdown.map((item) => (
          <div key={item.label} style={{ marginBottom: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <span style={{ fontSize: "12px", color: DS.colors.textSecondary, fontFamily: DS.font.family }}>
                {item.label}
              </span>
              <span style={{ fontSize: "12px", fontWeight: 700, color: DS.colors.textPrimary, fontFamily: DS.font.family }}>
                {item.pts} pts
              </span>
            </div>
            <div style={{ height: "6px", background: DS.colors.background, borderRadius: DS.radius.full }}>
              <div
                style={{
                  height: "100%",
                  width: `${item.pct * 100}%`,
                  background: item.color,
                  borderRadius: DS.radius.full,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  </Card>
);

// ─── ClassOverviewWidget (pure presentational) ────────────────────────────────
const ClassOverviewWidget: React.FC<{ items: ClassOverviewItem[] }> = ({ items }) => (
  <Card style={{ padding: "20px" }}>
    <SectionHeader title="Class Overview" subtitle="1A · Real-time" />
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
      {items.map((item) => (
        <div
          key={item.label}
          style={{
            background: DS.colors.background,
            borderRadius: DS.radius.md,
            padding: "12px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "18px", fontWeight: 800, color: DS.colors.textPrimary, fontFamily: DS.font.family }}>
            {item.value}
          </div>
          <div style={{ fontSize: "11px", color: DS.colors.textSecondary, fontFamily: DS.font.family, marginBottom: "6px" }}>
            {item.label}
          </div>
          <StatusBadge variant={item.badgeVariant} label={item.badgeLabel} size="sm" />
        </div>
      ))}
    </div>
  </Card>
);

// ─── RecentActivityWidget (pure presentational, PDPO-compliant) ───────────────
//
// PDPO Architecture Note:
// This component is intentionally "dumb". It renders `item.name` and
// `item.action` verbatim. When `item.masked === true`, it appends
// DataPrivacyShield next to the name — it does NOT decide what name to show.
// The upstream data contract guarantees `name` is already tokenized before
// reaching this component. There is no conditional selection between a raw
// name and a tokenized name anywhere in this render path.
const RecentActivityWidget: React.FC<{ items: ActivityItem[] }> = ({ items }) => (
  <Card style={{ padding: "20px" }}>
    <SectionHeader title="Recent Activity" subtitle="Last 30 minutes" />
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "34px",
              height: "34px",
              borderRadius: DS.radius.full,
              background: item.color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: "11px",
              fontWeight: 700,
              fontFamily: DS.font.family,
              flexShrink: 0,
            }}
          >
            {item.initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: DS.colors.textPrimary,
                fontFamily: DS.font.family,
                display: "flex",
                alignItems: "center",
                gap: "6px",
                flexWrap: "wrap",
              }}
            >
              {item.name}
              {item.masked && <DataPrivacyShield label="🛡️ Masked" />}
            </div>
            <div style={{ fontSize: "12px", color: DS.colors.textSecondary, fontFamily: DS.font.family }}>
              {item.action}
            </div>
          </div>
          <span style={{ fontSize: "11px", color: DS.colors.textMuted, fontFamily: DS.font.family, flexShrink: 0 }}>
            {item.time}
          </span>
        </div>
      ))}
    </div>
  </Card>
);

// ─── Screen01_Dashboard (state container) ────────────────────────────────────
//
// This component acts as a thin state container. All widget data arrives via
// props, with module-scope MOCK_* constants as defaults. In production, the
// parent (LALPApp or a future data-layer HOC) injects live data here, with
// zero changes required to any child presentational widget.

export const Screen01_Dashboard: React.FC<Screen01DashboardProps> = ({
  acornData      = MOCK_ACORN_DATA,
  engagementData = MOCK_ENGAGEMENT_DATA,
  classOverview  = MOCK_CLASS_OVERVIEW,
  stats          = MOCK_DASHBOARD_STATS,
  activities     = MOCK_ACTIVITIES,
  aiHint         = MOCK_AI_HINT,
}) => {
  const [qrScanning, setQrScanning] = useState(false);

  return (
    <div
      style={{
        fontFamily: DS.font.family,
        background: DS.colors.background,
        minHeight: "100vh",
        padding: "24px",
      }}
    >
      {/* ── Page Header ── */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 800, color: DS.colors.textPrimary, margin: 0 }}>
              Pedagogical Super Dashboard
            </h1>
            <p style={{ fontSize: "13px", color: DS.colors.textSecondary, margin: "2px 0 0" }}>
              教師超級儀表板 · Class 1A · Module D
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <StatusBadge variant="synced" label="Live" />
            <Btn variant="ghost" size="sm" icon={<Clock size={14} />}>Last updated: just now</Btn>
          </div>
        </div>

        {/* ── StatCards Row — driven by `stats` prop ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
          {stats.map((s, i) => (
            <StatCard
              key={i}
              label={s.label}
              value={s.value}
              delta={s.delta}
              positive={s.positive}
              color={s.color}
              icon={
                i === 0 ? <Users size={18} color={s.color} /> :
                i === 1 ? <Zap size={18} color={s.color} /> :
                i === 2 ? <CheckCircle2 size={18} color={s.color} /> :
                          <AlertCircle size={18} color={s.color} />
              }
            />
          ))}
        </div>
      </div>

      {/* ── Two-Column Layout ── */}
      <div style={{ display: "grid", gridTemplateColumns: "60% 40%", gap: "20px" }}>

        {/* LEFT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <AcornRadarWidget data={acornData} hint={aiHint} />

          {/* Quick Actions — QR state is local UI state, not data-layer state */}
          <Card style={{ padding: "20px" }}>
            <SectionHeader title="Quick Actions" subtitle="Classroom tools at your fingertips" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <button
                onClick={() => setQrScanning(!qrScanning)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  padding: "24px 20px",
                  background: qrScanning ? "#1347BF" : DS.colors.primary,
                  border: "none",
                  borderRadius: DS.radius.lg,
                  cursor: "pointer",
                  color: "#fff",
                  boxShadow: "0 4px 14px rgba(26,86,219,0.35)",
                  transition: "background 0.2s",
                }}
              >
                <QrCode size={36} color="#fff" strokeWidth={1.5} />
                <div>
                  <div style={{ fontSize: "15px", fontWeight: 700, fontFamily: DS.font.family }}>
                    {qrScanning ? "Scanning..." : "0.5s QR Scan"}
                  </div>
                  <div style={{ fontSize: "12px", opacity: 0.85, fontFamily: DS.font.family, marginTop: "2px" }}>
                    Instant attendance & feedback
                  </div>
                </div>
              </button>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {[
                  { icon: "📝", label: "New Assessment", sub: "Quick quiz builder" },
                  { icon: "💬", label: "Send AI Hint", sub: "Scaffolded prompt" },
                  { icon: "📊", label: "Export Report", sub: "PDF / CSV" },
                ].map((a) => (
                  <button
                    key={a.label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 14px",
                      background: DS.colors.surface,
                      border: `1px solid ${DS.colors.border}`,
                      borderRadius: DS.radius.md,
                      cursor: "pointer",
                      textAlign: "left",
                      boxShadow: DS.shadow.sm,
                    }}
                  >
                    <span style={{ fontSize: "20px" }}>{a.icon}</span>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: DS.colors.textPrimary, fontFamily: DS.font.family }}>
                        {a.label}
                      </div>
                      <div style={{ fontSize: "11px", color: DS.colors.textMuted, fontFamily: DS.font.family }}>
                        {a.sub}
                      </div>
                    </div>
                    <ChevronRight size={14} color={DS.colors.textMuted} style={{ marginLeft: "auto" }} />
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <EngagementIndexWidget data={engagementData} />
          <ClassOverviewWidget items={classOverview} />
          <RecentActivityWidget items={activities} />
          <Card style={{ padding: "16px 20px" }}>
            <SectionHeader
              title="This Week"
              subtitle={new Date().toLocaleDateString("en-HK", { month: "long", year: "numeric" })}
            />
            <MiniCalendar />
          </Card>
        </div>
      </div>
    </div>
  );
};
