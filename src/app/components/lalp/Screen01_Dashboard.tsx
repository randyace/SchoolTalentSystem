import React, { useState, useEffect } from "react";
import { Users, CheckCircle2, Clock, AlertCircle, ChevronRight, Zap, TrendingUp, UserCheck, ShieldAlert } from "lucide-react";
import {
  DS, StatusBadge, DataPrivacyShield, Card, Btn, SectionHeader, StatCard,
} from "./DesignSystem";

// ─── Responsive hook ──────────────────────────────────────────────────────────
function useIsMobile(bp = 768) {
  const [mobile, setMobile] = useState(
    typeof window !== "undefined" && window.innerWidth < bp
  );
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < bp);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, [bp]);
  return mobile;
}

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

// ─── Module-Scope Mock Data ───────────────────────────────────────────────────

/** @deprecated Kept for interface compatibility; no longer rendered on school-wide dashboard */
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
  subtitle: "School-wide · This Week",
  breakdown: [
    { label: "Participation", pts: 340, color: DS.colors.primary,   pct: 0.40 },
    { label: "Assessments",   pts: 280, color: DS.colors.secondary, pct: 0.33 },
    { label: "Collaboration", pts: 227, color: DS.colors.warning,   pct: 0.27 },
  ],
};

export const MOCK_CLASS_OVERVIEW: ClassOverviewItem[] = [
  { label: "出席率 Present",      value: "94.2%", badgeVariant: "present" },
  { label: "平均分 Avg Score",    value: "78.4%", badgeVariant: "active",  badgeLabel: "Good" },
  { label: "待批任務 Open Tasks", value: "67",    badgeVariant: "info",    badgeLabel: "Open" },
];

export const MOCK_DASHBOARD_STATS: DashboardStatItem[] = [
  { label: "全校出席率 Attendance",  value: "94.2%", delta: "+1.3% vs yesterday", positive: true,  color: DS.colors.primary   },
  { label: "平均參與度 Engagement",  value: "81.7%", delta: "2.8% this week",     positive: true,  color: DS.colors.secondary },
  { label: "待批任務 Pending Tasks", value: "67",    delta: "12 overdue",                           color: DS.colors.warning   },
  { label: "風險預警 Risk Alerts",   value: "8",                                                     color: DS.colors.error     },
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
  { initials: "LKM", name: "Lee Ka Ming",  action: "Submitted Assignment 3B",     time: "2m ago",  color: "#1A56DB" },
  { initials: "CWL", name: "Chan Wai Lam", action: "Completed quiz — scored 91%", time: "8m ago",  color: "#10B981" },
  { initials: "WXY", name: "Wong Xiu Ying",action: "Joined breakout room #2",     time: "14m ago", color: "#F59E0B" },
  {
    initials: "***",
    name: "Student #TSM-4471",
    action: "Attendance recorded",
    time: "22m ago",
    color: "#6B7280",
    masked: true,
  },
];

/** @deprecated Kept for interface compatibility; no longer rendered on school-wide dashboard */
export const MOCK_AI_HINT: AiHint = {
  text: "Collaborative dimension is trending 8% below Academic scores. Consider introducing more peer-to-peer learning activities in upcoming sessions to strengthen group cohesion.",
};

// ─── Props Interface ──────────────────────────────────────────────────────────

export interface Screen01DashboardProps {
  engagementData?: EngagementData;
  classOverview?: ClassOverviewItem[];
  stats?: DashboardStatItem[];
  activities?: ActivityItem[];
  /** @deprecated School-wide dashboard; ACORN data is no longer rendered */
  acornData?: AcornDimension[];
  /** @deprecated School-wide dashboard; per-class AI hints are no longer rendered */
  aiHint?: AiHint;
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

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

// ─── ActivityInsightsWidget ───────────────────────────────────────────────────

const ACTIVITY_INSIGHT_DATA = {
  week:  { participations: 1247, unique: 312, participDelta: "+18% vs last week",  uniqueDelta: "+23 new students" },
  month: { participations: 4830, unique: 389, participDelta: "+11% vs last month", uniqueDelta: "+41 new students" },
};

function readStsDashboardBootstrap() {
  if (typeof window === "undefined") return null;
  return (window as unknown as { __STS_DASHBOARD__?: StsDashboardBootstrap }).__STS_DASHBOARD__ ?? null;
}

export interface StsDashboardBootstrap {
  total_participations?: number;
  unique_students?: number;
  active_alerts?: number;
  insights?: {
    week?: { participations: number; unique: number; participDelta: string; uniqueDelta: string };
    month?: { participations: number; unique: number; participDelta: string; uniqueDelta: string };
  };
  risk_alerts?: Array<{
    emoji: string;
    level: "error" | "warning";
    title: string;
    titleEn: string;
    desc: string;
    time: string;
    count?: number;
  }>;
  stats?: DashboardStatItem[];
  activities?: ActivityItem[];
}

const ActivityInsightsWidget: React.FC<{
  isMobile?: boolean;
  insights?: StsDashboardBootstrap["insights"];
}> = ({ isMobile = false, insights }) => {
  const [period, setPeriod] = useState<"week" | "month">("week");
  const source = {
    week: insights?.week ?? ACTIVITY_INSIGHT_DATA.week,
    month: insights?.month ?? ACTIVITY_INSIGHT_DATA.month,
  };
  const d = source[period];

  return (
    <Card style={{ padding: isMobile ? "16px" : "20px" }}>
      {/* Header row with period toggle */}
      <div style={{
        display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        marginBottom: isMobile ? "16px" : "20px", flexWrap: "wrap", gap: "10px",
      }}>
        <SectionHeader
          title="全校活動參與統計"
          subtitle="School-wide Activity Insights"
          badge={<StatusBadge variant="active" label="Live" size="sm" />}
        />
        <div style={{
          display: "flex", borderRadius: DS.radius.md, overflow: "hidden",
          border: `1px solid ${DS.colors.border}`, flexShrink: 0,
        }}>
          {(["week", "month"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: "5px 13px", fontSize: "12px",
                fontFamily: DS.font.family, fontWeight: 600,
                border: "none", cursor: "pointer",
                background: period === p ? DS.colors.primary : DS.colors.surface,
                color: period === p ? "#fff" : DS.colors.textSecondary,
                transition: "background 0.15s, color 0.15s",
              }}
            >
              {p === "week" ? "本週 This Week" : "上月 Last Month"}
            </button>
          ))}
        </div>
      </div>

      {/* Two metric tiles */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "12px" }}>
        {/* Total Participations */}
        <div style={{
          background: "#EFF6FF", borderRadius: DS.radius.lg,
          padding: isMobile ? "16px" : "20px", border: "1px solid #BFDBFE",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "9px", marginBottom: "14px" }}>
            <div style={{
              width: "34px", height: "34px", borderRadius: DS.radius.md,
              background: "#DBEAFE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <TrendingUp size={17} color={DS.colors.primary} />
            </div>
            <div>
              <div style={{ fontSize: "12px", fontWeight: 700, color: DS.colors.textPrimary, fontFamily: DS.font.family, lineHeight: 1.3 }}>
                總參與人次
              </div>
              <div style={{ fontSize: "10px", color: DS.colors.textMuted, fontFamily: DS.font.family }}>
                Total Participations
              </div>
            </div>
          </div>
          <div style={{
            fontSize: isMobile ? "30px" : "38px", fontWeight: 800,
            color: DS.colors.textPrimary, fontFamily: DS.font.family,
            lineHeight: 1, marginBottom: "8px",
          }}>
            {d.participations.toLocaleString()}
          </div>
          <div style={{ fontSize: "12px", fontWeight: 600, color: DS.colors.primary, fontFamily: DS.font.family }}>
            ↑ {d.participDelta}
          </div>
        </div>

        {/* Unique Students */}
        <div style={{
          background: "#ECFDF5", borderRadius: DS.radius.lg,
          padding: isMobile ? "16px" : "20px", border: "1px solid #A7F3D0",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "9px", marginBottom: "14px" }}>
            <div style={{
              width: "34px", height: "34px", borderRadius: DS.radius.md,
              background: "#D1FAE5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <UserCheck size={17} color={DS.colors.secondary} />
            </div>
            <div>
              <div style={{ fontSize: "12px", fontWeight: 700, color: DS.colors.textPrimary, fontFamily: DS.font.family, lineHeight: 1.3 }}>
                獨立參與學生數
              </div>
              <div style={{ fontSize: "10px", color: DS.colors.textMuted, fontFamily: DS.font.family }}>
                Unique Students
              </div>
            </div>
          </div>
          <div style={{
            fontSize: isMobile ? "30px" : "38px", fontWeight: 800,
            color: DS.colors.textPrimary, fontFamily: DS.font.family,
            lineHeight: 1, marginBottom: "8px",
          }}>
            {d.unique.toLocaleString()}
          </div>
          <div style={{ fontSize: "12px", fontWeight: 600, color: DS.colors.secondary, fontFamily: DS.font.family }}>
            ↑ {d.uniqueDelta}
          </div>
        </div>
      </div>
    </Card>
  );
};

// ─── RiskAlertsWidget ─────────────────────────────────────────────────────────

const RISK_ALERTS = [
  {
    emoji: "🚨",
    level: "error" as const,
    title: "成績預警",
    titleEn: "Academic Alert",
    desc: "3 名學生期中考成績顯著下降 (> 15%)",
    time: "今日 08:32",
  },
  {
    emoji: "⚠️",
    level: "warning" as const,
    title: "考勤異常",
    titleEn: "Consecutive Absence",
    desc: "5 名學生本週連續缺席",
    time: "今日 07:15",
  },
  {
    emoji: "🔔",
    level: "warning" as const,
    title: "行為記錄",
    titleEn: "Conduct Threshold",
    desc: "2 名學生本月扣分累積超過閾值",
    time: "昨日 16:40",
  },
];

const ALERT_STYLES = {
  error:   { bg: "#FEF2F2", border: "#FECACA", titleColor: "#B91C1C", subColor: "#DC2626" },
  warning: { bg: "#FFFBEB", border: "#FDE68A", titleColor: "#92400E", subColor: "#D97706" },
};

const RiskAlertsWidget: React.FC<{
  isMobile?: boolean;
  alerts?: StsDashboardBootstrap["risk_alerts"];
}> = ({ isMobile = false, alerts }) => {
  const items = alerts && alerts.length > 0 ? alerts : RISK_ALERTS;
  return (
  <Card style={{ padding: isMobile ? "16px" : "20px" }}>
    <SectionHeader
      title="學生風險預警"
      subtitle="Student Risk Alerts"
      badge={<StatusBadge variant="error" label={`${items.length} Active`} size="sm" />}
    />
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {items.map((alert, i) => {
        const s = ALERT_STYLES[alert.level];
        return (
          <div
            key={i}
            style={{
              display: "flex", alignItems: "flex-start", gap: "10px",
              background: s.bg, border: `1px solid ${s.border}`,
              borderRadius: DS.radius.md, padding: "12px 14px",
            }}
          >
            <span style={{ fontSize: "16px", flexShrink: 0, lineHeight: 1, marginTop: "2px" }}>
              {alert.emoji}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "6px", flexWrap: "wrap", marginBottom: "3px" }}>
                <span style={{ fontSize: "13px", fontWeight: 700, color: s.titleColor, fontFamily: DS.font.family }}>
                  {alert.title}
                </span>
                <span style={{ fontSize: "11px", color: s.subColor, fontFamily: DS.font.family, opacity: 0.85 }}>
                  {alert.titleEn}
                </span>
              </div>
              <div style={{ fontSize: "12px", color: DS.colors.textSecondary, fontFamily: DS.font.family }}>
                {alert.desc}
              </div>
            </div>
            <span style={{
              fontSize: "11px", color: DS.colors.textMuted, fontFamily: DS.font.family,
              flexShrink: 0, whiteSpace: "nowrap", marginTop: "2px",
            }}>
              {alert.time}
            </span>
          </div>
        );
      })}
    </div>
    <button style={{
      marginTop: "10px", width: "100%", padding: "8px 0",
      fontSize: "12px", fontFamily: DS.font.family, fontWeight: 600,
      color: DS.colors.primary, background: "transparent",
      border: `1px solid ${DS.colors.border}`, borderRadius: DS.radius.md,
      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
    }}>
      <ShieldAlert size={13} />
      查看所有預警 View All Alerts
      <ChevronRight size={13} />
    </button>
  </Card>
  );
};

// ─── EngagementIndexWidget ────────────────────────────────────────────────────
const EngagementIndexWidget: React.FC<{ data: EngagementData; isMobile?: boolean }> = ({
  data, isMobile = false,
}) => {
  const ringSize = isMobile ? 90 : 110;
  return (
    <Card style={{ padding: isMobile ? "16px" : "20px" }}>
      <SectionHeader title="Engagement Index" subtitle={data.subtitle} />
      <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "14px" : "20px", marginBottom: "16px" }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <CircularRing value={data.totalPts} max={data.maxPts} size={ringSize} color={DS.colors.primary} />
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: isMobile ? "16px" : "20px", fontWeight: 800, color: DS.colors.textPrimary, fontFamily: DS.font.family }}>
              {data.totalPts}
            </span>
            <span style={{ fontSize: "11px", color: DS.colors.textMuted, fontFamily: DS.font.family }}>pts</span>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {data.breakdown.map((item) => (
            <div key={item.label} style={{ marginBottom: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ fontSize: "12px", color: DS.colors.textSecondary, fontFamily: DS.font.family }}>{item.label}</span>
                <span style={{ fontSize: "12px", fontWeight: 700, color: DS.colors.textPrimary, fontFamily: DS.font.family }}>{item.pts} pts</span>
              </div>
              <div style={{ height: "6px", background: DS.colors.background, borderRadius: DS.radius.full }}>
                <div style={{ height: "100%", width: `${item.pct * 100}%`, background: item.color, borderRadius: DS.radius.full }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

// ─── SchoolSnapshotWidget ────────────────────────────────────────────────────
const SchoolSnapshotWidget: React.FC<{ items: ClassOverviewItem[]; isMobile?: boolean }> = ({
  items, isMobile = false,
}) => (
  <Card style={{ padding: isMobile ? "16px" : "20px" }}>
    <SectionHeader title="全校概況 School Snapshot" subtitle="Real-time" />
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: isMobile ? "8px" : "10px" }}>
      {items.map((item) => (
        <div
          key={item.label}
          style={{
            background: DS.colors.background, borderRadius: DS.radius.md,
            padding: isMobile ? "10px 8px" : "12px", textAlign: "center",
          }}
        >
          <div style={{ fontSize: isMobile ? "16px" : "18px", fontWeight: 800, color: DS.colors.textPrimary, fontFamily: DS.font.family }}>
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

// ─── RecentActivityWidget ─────────────────────────────────────────────────────
const RecentActivityWidget: React.FC<{ items: ActivityItem[]; isMobile?: boolean }> = ({
  items, isMobile = false,
}) => (
  <Card style={{ padding: isMobile ? "16px" : "20px" }}>
    <SectionHeader title="Recent Activity" subtitle="Last 30 minutes" />
    <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? "10px" : "12px" }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "34px", height: "34px", borderRadius: DS.radius.full,
            background: item.color, display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: "11px", fontWeight: 700, fontFamily: DS.font.family, flexShrink: 0,
          }}>
            {item.initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: "13px", fontWeight: 600, color: DS.colors.textPrimary,
              fontFamily: DS.font.family, display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap",
            }}>
              {item.name}
              {item.masked && <DataPrivacyShield label="🛡️ Masked" />}
            </div>
            <div style={{ fontSize: "12px", color: DS.colors.textSecondary, fontFamily: DS.font.family, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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

// ─── Screen01_Dashboard ───────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { icon: "📝", label: "New Assessment",   sub: "Quick quiz builder",  color: "#1A56DB" },
  { icon: "💬", label: "Send AI Hint",      sub: "Scaffolded prompt",   color: "#10B981" },
  { icon: "📊", label: "Export Report",     sub: "PDF / CSV",           color: "#F59E0B" },
  { icon: "👥", label: "Manage Classes",    sub: "Enrolment & groups",  color: "#8B5CF6" },
  { icon: "📅", label: "Schedule Event",    sub: "Calendar & booking",  color: "#0EA5E9" },
  { icon: "🔔", label: "Send Announcement", sub: "School broadcast",    color: "#EC4899" },
];

export const Screen01_Dashboard: React.FC<Screen01DashboardProps> = (props) => {
  const bootstrap = readStsDashboardBootstrap();
  const engagementData = props.engagementData ?? MOCK_ENGAGEMENT_DATA;
  const classOverview  = props.classOverview ?? MOCK_CLASS_OVERVIEW;
  const stats          = props.stats ?? bootstrap?.stats ?? MOCK_DASHBOARD_STATS;
  const activities     = props.activities ?? bootstrap?.activities ?? MOCK_ACTIVITIES;
  const isMobile = useIsMobile(768);

  return (
    <div style={{
      fontFamily: DS.font.family,
      background: DS.colors.background,
      minHeight: "100%",
      padding: isMobile ? "16px" : "24px",
      boxSizing: "border-box",
    }}>
      {/* ── Page Header ── */}
      <div style={{ marginBottom: isMobile ? "16px" : "24px" }}>
        <div style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "flex-start" : "center",
          justifyContent: "space-between",
          gap: isMobile ? "10px" : "0",
          marginBottom: isMobile ? "14px" : "16px",
        }}>
          <div>
            <h1 style={{ fontSize: isMobile ? "18px" : "22px", fontWeight: 800, color: DS.colors.textPrimary, margin: 0 }}>
              今日概覽 Today Overview
            </h1>
            <p style={{ fontSize: "13px", color: DS.colors.textSecondary, margin: "2px 0 0" }}>
              學校行政儀表板 · School-wide Overview · 全校總覽
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexShrink: 0 }}>
            <StatusBadge variant="synced" label="Live" />
            {!isMobile && (
              <Btn variant="ghost" size="sm" icon={<Clock size={14} />}>Last updated: just now</Btn>
            )}
          </div>
        </div>

        {/* ── StatCards Row ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
          gap: isMobile ? "10px" : "16px",
        }}>
          {stats.map((s, i) => (
            <StatCard
              key={i}
              label={s.label}
              value={s.value}
              delta={isMobile ? undefined : s.delta}
              positive={s.positive}
              color={s.color}
              icon={
                i === 0 ? <Users size={isMobile ? 15 : 18} color={s.color} /> :
                i === 1 ? <Zap size={isMobile ? 15 : 18} color={s.color} /> :
                i === 2 ? <CheckCircle2 size={isMobile ? 15 : 18} color={s.color} /> :
                          <AlertCircle size={isMobile ? 15 : 18} color={s.color} />
              }
            />
          ))}
        </div>
      </div>

      {/* ── Main Layout ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "60% 40%",
        gap: isMobile ? "14px" : "20px",
      }}>

        {/* LEFT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? "14px" : "20px" }}>

          {/* Replaces removed ACORN Holistic Index */}
          <ActivityInsightsWidget isMobile={isMobile} insights={bootstrap?.insights} />

          {/* Quick Actions — QR Scan removed; 6 school-management shortcuts */}
          <Card style={{ padding: isMobile ? "16px" : "20px" }}>
            <SectionHeader title="Quick Actions" subtitle="School management tools" />
            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
              gap: "10px",
            }}>
              {QUICK_ACTIONS.map((a) => (
                <button
                  key={a.label}
                  style={{
                    display: "flex", alignItems: "center", gap: "10px",
                    padding: "11px 13px",
                    background: DS.colors.surface,
                    border: `1px solid ${DS.colors.border}`,
                    borderRadius: DS.radius.md,
                    cursor: "pointer", textAlign: "left",
                    boxShadow: DS.shadow.sm, width: "100%",
                  }}
                >
                  <span style={{
                    width: "32px", height: "32px", borderRadius: DS.radius.md,
                    background: a.color + "18",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "16px", flexShrink: 0,
                  }}>
                    {a.icon}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: DS.colors.textPrimary, fontFamily: DS.font.family }}>
                      {a.label}
                    </div>
                    <div style={{ fontSize: "11px", color: DS.colors.textMuted, fontFamily: DS.font.family }}>
                      {a.sub}
                    </div>
                  </div>
                  <ChevronRight size={13} color={DS.colors.textMuted} style={{ flexShrink: 0 }} />
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? "14px" : "20px" }}>
          <EngagementIndexWidget data={engagementData} isMobile={isMobile} />
          <SchoolSnapshotWidget items={classOverview} isMobile={isMobile} />
          <RiskAlertsWidget isMobile={isMobile} alerts={bootstrap?.risk_alerts} />
          <RecentActivityWidget items={activities} isMobile={isMobile} />
          <Card style={{ padding: isMobile ? "14px 16px" : "16px 20px" }}>
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
