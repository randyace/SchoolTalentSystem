/**
 * TeacherJourneyFlow.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Git Submodule: ui/teacher-journey
 * Tender Coverage: Module 3, Module D, Module 5.2, Module 5.3, Module E,
 *                  Module B, Module 6, Clause 6 Audit, Clause 6.1 Data Masking
 *
 * Architecture: Each screen is a strictly-typed Pure Presentational Component.
 * All state and mock data live in the top-level <TeacherJourneyFlow> orchestrator
 * and are passed down via explicit props. No screen owns its own data.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useRef } from "react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ResponsiveContainer, Tooltip,
} from "recharts";
import {
  LayoutDashboard, ChevronRight, ChevronDown, ChevronLeft, ChevronUp,
  QrCode, Users, Sparkles, Brain, Database, Clock, User, Link,
  CheckCircle2, ArrowRight, CameraOff, Play, Pause,
  TrendingUp, TrendingDown, Award, ExternalLink, Star,
  Zap, Target, BarChart3, BookOpen, Menu, X, FileText,
  AlignLeft, Shield, GraduationCap,
} from "lucide-react";
import {
  DS, StatusBadge, DataPrivacyShield, ToggleSwitch,
  Card, Btn, SectionHeader, StatCard,
} from "./DesignSystem";

// ═══════════════════════════════════════════════════════════════════════════
// §1  SHARED TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type JourneyStep = 1 | 2 | 3 | 4;

export interface AcornDim   { axis: string; current: number; previous: number }
export interface StudentRec {
  id: string; token: string; initials: string; role: string; score: number;
  present: boolean;
}
export interface GroupRec   {
  id: string; label: string; task: string; progress: number;
  alert: "ok" | "warn" | "risk"; members: StudentRec[];
}
export interface AuditRow   {
  index: number; label: string; labelZh: string;
  value: string; verified: boolean;
}
export interface AchievementRec {
  id: string; title: string; envLevel: string; envColor: string;
  tier: string; tierColor: string; hours: number;
  date: string; status: "verified" | "pending";
}
export interface EngBreakdown { label: string; pts: number; color: string; pct: number }

// ═══════════════════════════════════════════════════════════════════════════
// §2  MOCK DATA CONSTANTS  (single source of truth — orchestrator injects these)
// ═══════════════════════════════════════════════════════════════════════════

export const CLASS_ACORN: AcornDim[] = [
  { axis: "Academic",      current: 82, previous: 71 },
  { axis: "Collaborative", current: 74, previous: 62 },
  { axis: "Opportunity",   current: 68, previous: 55 },
  { axis: "Realm",         current: 79, previous: 70 },
  { axis: "Nurturing",     current: 85, previous: 74 },
  { axis: "Faith",         current: 71, previous: 63 },
];

export const STUDENT_ACORN: AcornDim[] = [
  { axis: "Academic",      current: 88, previous: 74 },
  { axis: "Collaborative", current: 79, previous: 65 },
  { axis: "Opportunity",   current: 72, previous: 54 },
  { axis: "Realm",         current: 83, previous: 72 },
  { axis: "Nurturing",     current: 91, previous: 77 },
  { axis: "Faith",         current: 76, previous: 66 },
];

export const GROUPS: GroupRec[] = [
  {
    id: "A", label: "Group A", task: "Climate Change — Cause & Effect",
    progress: 54, alert: "warn",
    members: [
      { id: "S005", token: "Student #HJ-5502", initials: "HJ", role: "Leader",     score: 91, present: true  },
      { id: "S006", token: "Student #LB-3310", initials: "LB", role: "Researcher", score: 85, present: true  },
      { id: "S007", token: "Student #ZX-7741", initials: "ZX", role: "Recorder",   score: 77, present: true  },
      { id: "S008", token: "Student #FL-2209", initials: "FL", role: "Presenter",  score: 83, present: true  },
    ],
  },
  {
    id: "B", label: "Group B", task: "Plastic Waste Life-cycle",
    progress: 72, alert: "ok",
    members: [
      { id: "S001", token: "Student #CW-1102", initials: "CW", role: "Leader",     score: 88, present: true  },
      { id: "S002", token: "Student #LH-4453", initials: "LH", role: "Researcher", score: 74, present: true  },
      { id: "S003", token: "Student #ZM-6671", initials: "ZM", role: "Recorder",   score: 81, present: true  },
      { id: "S004", token: "Student #WT-9988", initials: "WT", role: "Presenter",  score: 79, present: false },
    ],
  },
  {
    id: "C", label: "Group C", task: "Biodiversity Loss Mapping",
    progress: 38, alert: "risk",
    members: [
      { id: "S009", token: "Student #ZH-0014", initials: "ZH", role: "Leader",     score: 72, present: true  },
      { id: "S010", token: "Student #WA-8832", initials: "WA", role: "Researcher", score: 65, present: true  },
      { id: "S011", token: "Student #SL-5521", initials: "SL", role: "Recorder",   score: 58, present: true  },
      { id: "S012", token: "Student #ZF-3340", initials: "ZF", role: "Presenter",  score: 70, present: false },
    ],
  },
  {
    id: "D", label: "Group D", task: "Renewable Energy Transition",
    progress: 81, alert: "ok",
    members: [
      { id: "S013", token: "Student #YS-7723", initials: "YS", role: "Leader",     score: 86, present: true  },
      { id: "S014", token: "Student #XM-1156", initials: "XM", role: "Researcher", score: 80, present: true  },
      { id: "S015", token: "Student #GP-4490", initials: "GP", role: "Recorder",   score: 76, present: true  },
      { id: "S016", token: "Student #HQ-6637", initials: "HQ", role: "Presenter",  score: 82, present: true  },
    ],
  },
];

export const AUDIT_ROWS: AuditRow[] = [
  { index: 1, label: "Assessing Teacher",        labelZh: "評估教師",       value: "Mr. T. Chan · Staff ID: TC-0047",                   verified: true },
  { index: 2, label: "Learning Timestamp",       labelZh: "學習時間戳",     value: "2026-08-01  14:35:44 HKT · Class 1A Science",       verified: true },
  { index: 3, label: "Data Logging Timestamp",   labelZh: "數據記錄時間戳", value: "2026-08-01  14:35:46 HKT · Δ2s latency · Synced",   verified: true },
  { index: 4, label: "Portfolio URL",            labelZh: "作品集連結",     value: "knowledgegraph://portfolio/GA-CLIMATE-2026-0801",    verified: true },
];

export const ACHIEVEMENTS: AchievementRec[] = [
  { id: "A1", title: "Regional Science Competition — Gold",  envLevel: "L4 Regional",      envColor: "#059669", tier: "T4 Award",       tierColor: "#B45309", hours: 24, date: "2025-11-15", status: "verified" },
  { id: "A2", title: "Inter-School Debate — Finalist",       envLevel: "L3 District",      envColor: "#0891B2", tier: "T3 Finalist",    tierColor: "#D97706", hours: 18, date: "2025-10-03", status: "verified" },
  { id: "A3", title: "Community Green Ambassador",           envLevel: "L2 School",        envColor: "#2563EB", tier: "T2 Participant", tierColor: "#2563EB", hours: 12, date: "2025-09-20", status: "verified" },
  { id: "A4", title: "HKMO Heat — School Representative",   envLevel: "L3 District",      envColor: "#0891B2", tier: "T2 Participant", tierColor: "#2563EB", hours: 10, date: "2025-12-07", status: "verified" },
  { id: "A5", title: "Peer Mentoring — Senior Mentor",      envLevel: "L2 School",        envColor: "#2563EB", tier: "T3 Finalist",    tierColor: "#D97706", hours: 30, date: "2026-01-15", status: "verified" },
  { id: "A6", title: "Asia Youth Science Forum — Delegate", envLevel: "L6 Asia-Pacific",  envColor: "#C2410C", tier: "T2 Participant", tierColor: "#2563EB", hours: 40, date: "2026-03-01", status: "pending"  },
];

export const ENGAGEMENT: { totalPts: number; maxPts: number; breakdown: EngBreakdown[] } = {
  totalPts: 847, maxPts: 1000,
  breakdown: [
    { label: "Participation", pts: 340, color: DS.colors.primary,   pct: 0.40 },
    { label: "Assessments",   pts: 280, color: DS.colors.secondary, pct: 0.33 },
    { label: "Collaboration", pts: 227, color: DS.colors.warning,   pct: 0.27 },
  ],
};

const SOCRATIC_HINT =
  `Your group identified 3 primary causes. Now consider: what *second-order effects* emerge from each? If deforestation leads to soil erosion, does soil erosion eventually loop back to accelerate deforestation itself?\n\nTry rebuilding your diagram as a *feedback loop* rather than a linear chain. Which single node, if removed, would break the entire cycle?`;

const ROLE_OPTIONS = ["Leader", "Researcher", "Recorder", "Presenter", "Observer", "Support"];

// ═══════════════════════════════════════════════════════════════════════════
// §3  INJECTED KEYFRAMES
// ═══════════════════════════════════════════════════════════════════════════

const KEYFRAMES = `
  @keyframes tj-scanLine  { 0%,100%{top:15%;opacity:.7} 50%{top:82%;opacity:1} }
  @keyframes tj-fadeUp    { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes tj-slideRight{ from{opacity:0;transform:translateX(28px)} to{opacity:1;transform:translateX(0)} }
  @keyframes tj-pulse     { 0%,100%{opacity:1} 50%{opacity:.25} }
  @keyframes tj-spin      { to{transform:rotate(360deg)} }
`;

// ═══════════════════════════════════════════════════════════════════════════
// §4  JOURNEY PROGRESS BAR  (shared across all 4 screens)
// ═══════════════════════════════════════════════════════════════════════════

interface JourneyProgressBarProps {
  current: JourneyStep;
  onNavigate: (s: JourneyStep) => void;
}

const JourneyProgressBar: React.FC<JourneyProgressBarProps> = ({ current, onNavigate }) => {
  const steps: { step: JourneyStep; code: string; label: string; sub: string }[] = [
    { step: 1, code: "1.0", label: "Morning Brief",      sub: "Mod 3 · Mod D"  },
    { step: 2, code: "2.0", label: "Live PBL Class",     sub: "Mod 5.2 · Mod E" },
    { step: 3, code: "3.0", label: "AI Assist & Audit",  sub: "Mod 5.3 · Cl.6"  },
    { step: 4, code: "4.0", label: "Student Profile",    sub: "Mod 3.1 · Mod 6" },
  ];
  return (
    <div style={{
      background: DS.colors.surface,
      borderBottom: `1px solid ${DS.colors.border}`,
      padding: "0 28px",
      display: "flex",
      alignItems: "stretch",
      height: "56px",
      gap: "0",
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      flexShrink: 0,
    }}>
      {/* Platform logo */}
      <div style={{
        display: "flex", alignItems: "center", gap: "8px",
        paddingRight: "24px", borderRight: `1px solid ${DS.colors.border}`,
        marginRight: "20px", flexShrink: 0,
      }}>
        <div style={{
          width: "30px", height: "30px", borderRadius: "8px",
          background: `linear-gradient(135deg,${DS.colors.primary},#7C3AED)`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <LayoutDashboard size={15} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: "12px", fontWeight: 800, color: DS.colors.textPrimary, fontFamily: DS.font.family, lineHeight: 1.1 }}>LALP</div>
          <div style={{ fontSize: "9px",  color: DS.colors.textMuted, fontFamily: DS.font.family, lineHeight: 1 }}>Stewards Pooi Tun Sec.</div>
        </div>
      </div>

      {/* Steps */}
      {steps.map((s, i) => {
        const done   = s.step < current;
        const active = s.step === current;
        const canNav = s.step <= current;
        return (
          <React.Fragment key={s.step}>
            <button
              onClick={() => canNav && onNavigate(s.step)}
              style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "0 16px",
                background: active ? DS.colors.primaryLight : "transparent",
                border: "none",
                borderBottom: active ? `2px solid ${DS.colors.primary}` : "2px solid transparent",
                cursor: canNav ? "pointer" : "default",
                transition: "all 0.15s",
                flexShrink: 0,
              }}
            >
              <div style={{
                width: "26px", height: "26px", borderRadius: "50%",
                background: active ? DS.colors.primary : done ? DS.colors.secondary : "#E5E7EB",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, transition: "background 0.2s",
              }}>
                {done
                  ? <CheckCircle2 size={13} color="#fff" />
                  : <span style={{ fontSize: "10px", fontWeight: 800, color: active ? "#fff" : "#9CA3AF", fontFamily: DS.font.family }}>{s.code}</span>
                }
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: "12px", fontWeight: active ? 700 : 500, color: active ? DS.colors.primary : done ? DS.colors.secondary : DS.colors.textSecondary, fontFamily: DS.font.family }}>
                  {s.label}
                </div>
                <div style={{ fontSize: "10px", color: DS.colors.textMuted, fontFamily: DS.font.family }}>{s.sub}</div>
              </div>
            </button>
            {i < steps.length - 1 && (
              <div style={{
                width: "32px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <div style={{ height: "1px", width: "100%", background: done ? DS.colors.secondary : DS.colors.border, transition: "background 0.3s" }} />
              </div>
            )}
          </React.Fragment>
        );
      })}

      {/* Spacer + clock */}
      <div style={{ flex: 1 }} />
      <div style={{
        display: "flex", alignItems: "center", gap: "6px",
        paddingLeft: "20px", borderLeft: `1px solid ${DS.colors.border}`,
        flexShrink: 0,
      }}>
        <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: DS.colors.secondary, animation: "tj-pulse 2s infinite" }} />
        <span style={{ fontSize: "12px", fontWeight: 700, color: DS.colors.secondary, fontFamily: DS.font.family }}>● LIVE  14:35</span>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// §5  GLOBAL SIDEBAR  (Screen 1 — full tender-compliant nav tree)
// ═══════════════════════════════════════════════════════════════════════════

interface SidebarNavItem {
  id: string;
  label: string;
  labelZh: string;
  badge?: string;
  badgeColor?: string;
  icon?: React.ReactNode;
}
interface SidebarNavGroup {
  id: string;
  label: string;
  labelZh: string;
  color: string;
  items: SidebarNavItem[];
}

// ── Exact tender-specified global nav tree ────────────────────────────────
const GLOBAL_NAV: SidebarNavGroup[] = [
  {
    id: "core", label: "Core Platform", labelZh: "核心平台",
    color: DS.colors.primary,
    items: [
      { id: "teacher-journey", label: "Teacher Journey Flow",  labelZh: "教師旅程流程",   badge: "Journey", badgeColor: "#7C3AED"          },
      { id: "dashboard",       label: "Super Dashboard",       labelZh: "教師儀表板",     },
      { id: "acorn-index",     label: "ACORN Learner Persona", labelZh: "學習者人格",     badge: "M3",      badgeColor: "#0891B2"          },
    ],
  },
  {
    id: "adaptive", label: "Adaptive Modules", labelZh: "自適應模組",
    color: "#7C3AED",
    items: [
      { id: "diagnostic",        label: "Diagnostic Engine",     labelZh: "自適應偏誤校正", badge: "M2",   badgeColor: "#8B5CF6" },
      { id: "ocr-wizard",        label: "OCR Achievement",       labelZh: "自主成就提報",   badge: "M4",   badgeColor: "#8B5CF6" },
      { id: "class-recorder",    label: "Live Class Recorder",   labelZh: "實時表現記錄器", badge: "M5",   badgeColor: "#8B5CF6" },
      { id: "prompt-tuning",     label: "Prompt Tuning Portal",  labelZh: "提示詞控制門戶", badge: "M6a",  badgeColor: "#6366F1" },
      { id: "portfolio-library", label: "Student Portfolio",     labelZh: "學生成果檔案",   badge: "M6b",  badgeColor: "#6366F1" },
    ],
  },
  {
    id: "valueadd", label: "Value-Add Modules", labelZh: "增值模組",
    color: "#0891B2",
    items: [
      { id: "audit-log",       label: "Audit Log & Sync",       labelZh: "稽核記錄同步",   badge: "Mod A", badgeColor: "#0891B2" },
      { id: "role-anchoring",  label: "Role Anchoring",         labelZh: "角色定錨",       badge: "Mod B", badgeColor: "#0891B2" },
      { id: "campus-rewards",  label: "Campus Reward Points",   labelZh: "校園獎勵積分",   badge: "Mod C", badgeColor: "#EC4899" },
      { id: "engagement",      label: "Engagement Index",       labelZh: "參與指數",       badge: "Mod D", badgeColor: "#F59E0B" },
      { id: "qr-scan",         label: "QR Scan Engine",         labelZh: "QR 掃描引擎",    badge: "Mod E", badgeColor: "#10B981" },
    ],
  },
  {
    id: "itadmin", label: "IT Admin & Security", labelZh: "IT 管理及安全",
    color: "#475569",
    items: [
      { id: "data-pipeline",  label: "Data Tokenization",      labelZh: "數據標記化",     badge: "M1",       badgeColor: "#6366F1" },
      { id: "desensitize",    label: "De-sensitization Rules", labelZh: "去敏感化規則",   badge: "Clause 6", badgeColor: "#EF4444" },
      { id: "scale-engine",   label: "Scale Engine Config",    labelZh: "擴展引擎設定",   badge: "SLA",      badgeColor: "#475569" },
    ],
  },
];

interface GlobalSidebarProps {
  collapsed: boolean;
  activeItem: string;
  onToggle: () => void;
  onSelect: (id: string) => void;
}

const GlobalSidebar: React.FC<GlobalSidebarProps> = ({ collapsed, activeItem, onToggle, onSelect }) => {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    core: true, adaptive: true, valueadd: true, itadmin: false,
  });
  const toggleGroup = (id: string) => setExpandedGroups(p => ({ ...p, [id]: !p[id] }));

  return (
    <aside style={{
      width: collapsed ? "54px" : "252px",
      background: "#0F172A",
      borderRight: `1px solid rgba(255,255,255,0.07)`,
      display: "flex", flexDirection: "column",
      transition: "width 0.25s ease",
      overflow: "hidden",
      flexShrink: 0,
      boxShadow: "2px 0 12px rgba(0,0,0,0.18)",
    }}>

      {/* ── School branding block ── */}
      <div style={{
        padding: collapsed ? "14px 0" : "14px 14px",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        background: "linear-gradient(135deg,#1E3A5F 0%,#1A2744 100%)",
        display: "flex", alignItems: "center",
        justifyContent: collapsed ? "center" : "flex-start",
        gap: "10px", flexShrink: 0,
        minHeight: "72px",
      }}>
        {/* Crest */}
        <div style={{
          width: "36px", height: "36px", borderRadius: "50%",
          background: "linear-gradient(135deg,#1A56DB,#7C3AED)",
          border: "2px solid rgba(255,255,255,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <GraduationCap size={17} color="#fff" />
        </div>
        {!collapsed && (
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontSize: "11px", fontWeight: 800, color: "#E2E8F0", fontFamily: DS.font.family, lineHeight: 1.25, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              Stewards Pooi Tun
            </div>
            <div style={{ fontSize: "10px", fontWeight: 700, color: "#94A3B8", fontFamily: DS.font.family, lineHeight: 1.25, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              Secondary School
            </div>
            <div style={{ fontSize: "9px", color: "#64748B", fontFamily: DS.font.family, lineHeight: 1.3, marginTop: "2px" }}>
              香港神託會培敦中學
            </div>
          </div>
        )}
      </div>

      {/* ── School metadata strip ── */}
      {!collapsed && (
        <div style={{ padding: "6px 14px", background: "rgba(26,86,219,0.12)", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10B981", animation: "tj-pulse 2s infinite", flexShrink: 0 }} />
          <span style={{ fontSize: "10px", color: "#64748B", fontFamily: DS.font.family }}>Class 1A · AY 2025/26 S2 · <span style={{ color: "#10B981", fontWeight: 700 }}>LIVE</span></span>
        </div>
      )}

      {/* ── Collapse toggle ── */}
      <button
        onClick={onToggle}
        title={collapsed ? "Expand menu" : "Collapse menu"}
        style={{
          display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "space-between",
          padding: collapsed ? "8px 0" : "7px 14px",
          background: "transparent", border: "none",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          cursor: "pointer", flexShrink: 0,
        }}
      >
        {!collapsed && <span style={{ fontSize: "10px", color: "#475569", fontFamily: DS.font.family, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>Navigation</span>}
        {collapsed ? <Menu size={15} color="#475569" /> : <X size={13} color="#475569" />}
      </button>

      {/* ── Nav groups ── */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "4px 0 8px" }}>
        {GLOBAL_NAV.map(group => {
          const isGroupExpanded = expandedGroups[group.id] !== false;
          return (
            <div key={group.id} style={{ marginBottom: "2px" }}>
              {/* Group header */}
              <button
                onClick={() => !collapsed && toggleGroup(group.id)}
                style={{
                  width: "100%", display: "flex", alignItems: "center",
                  padding: collapsed ? "7px 0" : "6px 14px",
                  justifyContent: collapsed ? "center" : "space-between",
                  background: "transparent", border: "none",
                  cursor: collapsed ? "default" : "pointer",
                }}
              >
                {collapsed ? (
                  <div style={{ width: "24px", height: "2px", background: `${group.color}60`, borderRadius: "1px" }} />
                ) : (
                  <>
                    <span style={{ fontSize: "9px", fontWeight: 800, color: group.color, fontFamily: DS.font.family, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                      {group.label}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <span style={{ fontSize: "9px", color: "#334155", fontFamily: DS.font.family }}>{group.items.length}</span>
                      {isGroupExpanded ? <ChevronUp size={10} color="#334155" /> : <ChevronDown size={10} color="#334155" />}
                    </div>
                  </>
                )}
              </button>

              {/* Group items */}
              {(isGroupExpanded || collapsed) && group.items.map(item => {
                const isActive = item.id === activeItem;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelect(item.id)}
                    title={collapsed ? `${item.label} ${item.badge ? `[${item.badge}]` : ""}` : undefined}
                    style={{
                      width: "100%", display: "flex",
                      alignItems: "center",
                      gap: collapsed ? "0" : "9px",
                      padding: collapsed ? "8px 0" : "7px 14px",
                      justifyContent: collapsed ? "center" : "flex-start",
                      background: isActive
                        ? `linear-gradient(90deg,${group.color}28,${group.color}10)`
                        : "transparent",
                      border: "none",
                      borderLeft: isActive ? `3px solid ${group.color}` : "3px solid transparent",
                      borderRight: "none",
                      cursor: "pointer",
                      transition: "background 0.12s",
                      position: "relative",
                    }}
                  >
                    {collapsed ? (
                      /* Collapsed: show badge only */
                      item.badge ? (
                        <span style={{
                          fontSize: "8px", fontWeight: 800,
                          padding: "2px 4px",
                          background: isActive ? item.badgeColor : "#1E293B",
                          color: isActive ? "#fff" : "#475569",
                          borderRadius: "3px", fontFamily: DS.font.family,
                          display: "block", textAlign: "center",
                          minWidth: "34px",
                          border: isActive ? "none" : `1px solid ${item.badgeColor}40`,
                          transition: "all 0.15s",
                        }}>
                          {item.badge}
                        </span>
                      ) : (
                        <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: isActive ? group.color : "#334155" }} />
                      )
                    ) : (
                      <>
                        {/* Label */}
                        <div style={{ flex: 1, overflow: "hidden", textAlign: "left" }}>
                          <div style={{
                            fontSize: "12px",
                            fontWeight: isActive ? 700 : 400,
                            color: isActive ? "#F1F5F9" : "#94A3B8",
                            fontFamily: DS.font.family,
                            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                            transition: "color 0.12s",
                          }}>
                            {item.label}
                          </div>
                          {isActive && (
                            <div style={{ fontSize: "9px", color: group.color, fontFamily: DS.font.family, marginTop: "1px" }}>
                              {item.labelZh}
                            </div>
                          )}
                        </div>
                        {/* Badge */}
                        {item.badge && (
                          <span style={{
                            fontSize: "9px", fontWeight: 800,
                            padding: "2px 5px",
                            background: isActive ? item.badgeColor : `${item.badgeColor}22`,
                            color: isActive ? "#fff" : item.badgeColor,
                            borderRadius: "3px", fontFamily: DS.font.family,
                            border: `1px solid ${item.badgeColor}40`,
                            flexShrink: 0,
                            transition: "all 0.12s",
                          }}>
                            {item.badge}
                          </span>
                        )}
                        {/* Active indicator dot */}
                        {isActive && (
                          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: group.color, flexShrink: 0, animation: "tj-pulse 2s infinite" }} />
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* ── Tender coverage footer ── */}
      {!collapsed && (
        <div style={{ padding: "10px 14px", borderTop: "1px solid rgba(255,255,255,0.07)", background: "#0B1120", flexShrink: 0 }}>
          <div style={{ fontSize: "9px", color: "#334155", fontFamily: DS.font.family, marginBottom: "5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Tender Coverage
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "3px" }}>
            {["M1","M2","M3","M4","M5","M6a","M6b","A","B","C","D","E","Cl.6","SLA"].map(m => (
              <span key={m} style={{ fontSize: "8px", fontWeight: 700, padding: "1px 4px", background: "rgba(26,86,219,0.2)", color: "#3B82F6", borderRadius: "2px", fontFamily: DS.font.family }}>
                {m}
              </span>
            ))}
          </div>
          <div style={{ marginTop: "8px", fontSize: "9px", color: "#334155", fontFamily: DS.font.family }}>
            LALP v2.0 · Stewards PT Secondary
          </div>
        </div>
      )}
    </aside>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// §6  SCREEN 1 — 1.0 MORNING BRIEF  (Pure Presentational)
// ═══════════════════════════════════════════════════════════════════════════

interface Screen1Props {
  acornData: AcornDim[];
  engagement: typeof ENGAGEMENT;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onStart: () => void;
}

const RadarTooltip: React.FC<{ active?: boolean; payload?: { name: string; value: number }[] }> = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: DS.colors.surface, border: `1px solid ${DS.colors.border}`, borderRadius: DS.radius.md, padding: "8px 12px", boxShadow: DS.shadow.md, fontFamily: DS.font.family }}>
      {payload.map((p, i) => (
        <div key={i} style={{ fontSize: "12px", fontWeight: 600, color: i === 0 ? DS.colors.secondary : "#9CA3AF" }}>
          {i === 0 ? "Current" : "Previous"}: {p.value}/100
        </div>
      ))}
    </div>
  );
};

const CircularRing: React.FC<{ value: number; max: number; size: number; color: string }> = ({ value, max, size, color }) => {
  const r = (size - 14) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ display: "block" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={DS.colors.border} strokeWidth={10} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={10}
        strokeDasharray={`${(value/max)*c} ${c-(value/max)*c}`}
        strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`} />
    </svg>
  );
};

const Screen1_MorningBrief: React.FC<Screen1Props> = ({ acornData, engagement, sidebarCollapsed, onToggleSidebar, onStart }) => {
  const classAvg = Math.round(acornData.reduce((s, d) => s + d.current, 0) / acornData.length);
  return (
    <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
      {/* §6.1 — Global Sidebar */}
      <GlobalSidebar
        collapsed={sidebarCollapsed}
        activeItem="teacher-journey"
        onToggle={onToggleSidebar}
        onSelect={() => {}}
      />

      {/* §6.2 — Main content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "20px", background: DS.colors.background }}>

        {/* §6.2.1 — Page title + CTA */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "20px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span style={{ fontSize: "10px", fontWeight: 800, padding: "2px 6px", background: "#0891B2", color: "#fff", borderRadius: "3px", fontFamily: DS.font.family }}>
                1.0
              </span>
              <h1 style={{ fontSize: "20px", fontWeight: 800, color: DS.colors.textPrimary, margin: 0, fontFamily: DS.font.family }}>
                Morning Brief
              </h1>
            </div>
            <p style={{ fontSize: "13px", color: DS.colors.textSecondary, margin: 0, fontFamily: DS.font.family }}>
              Pedagogical Dashboard · 教師早間概覽 · Fri 1 Aug 2026
            </p>
          </div>
          {/* §6.2.2 — Primary CTA */}
          <button
            onClick={onStart}
            style={{
              display: "inline-flex", alignItems: "center", gap: "10px",
              padding: "13px 24px",
              background: `linear-gradient(135deg,${DS.colors.primary},#7C3AED)`,
              border: "none", borderRadius: DS.radius.lg,
              color: "#fff", fontSize: "14px", fontWeight: 800,
              cursor: "pointer", fontFamily: DS.font.family,
              boxShadow: "0 4px 18px rgba(26,86,219,0.38)",
              transition: "opacity 0.15s", flexShrink: 0,
            }}
          >
            <Play size={16} />
            Start Live PBL Class
            <span style={{ fontSize: "11px", opacity: 0.85, fontWeight: 500 }}>啟動跨學科實作</span>
            <ArrowRight size={16} />
          </button>
        </div>

        {/* §6.2.3 — Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "14px" }}>
          {[
            { label: "Students Present", value: "28/32", color: DS.colors.secondary, sub: "+2 vs yesterday"    },
            { label: "Class ACORN Avg",  value: `${classAvg}`,       color: DS.colors.primary,   sub: "+14.3% YoY"    },
            { label: "Active Tasks",     value: "6",                  color: DS.colors.warning,   sub: "3 groups on track" },
            { label: "AI Alerts",        value: "2",                  color: DS.colors.error,     sub: "Group C at risk"  },
          ].map(s => (
            <Card key={s.label} style={{ padding: "16px" }}>
              <div style={{ fontSize: "11px", color: DS.colors.textSecondary, fontFamily: DS.font.family, fontWeight: 500, marginBottom: "4px" }}>{s.label}</div>
              <div style={{ fontSize: "24px", fontWeight: 800, color: s.color, fontFamily: DS.font.family }}>{s.value}</div>
              <div style={{ fontSize: "11px", color: DS.colors.textMuted, fontFamily: DS.font.family, marginTop: "2px" }}>{s.sub}</div>
            </Card>
          ))}
        </div>

        {/* §6.2.4 — Two-column: Radar + Engagement */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "20px" }}>

          {/* §6.2.4a — ACORN Radar (Module 3) */}
          <Card style={{ padding: "20px" }}>
            <SectionHeader
              title="3.0 ACORN Holistic Index — Class Average"
              subtitle="6-dimensional class profile · Module 3 · 特徵圖譜"
              badge={<span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 6px", background: "#0891B2", color: "#fff", borderRadius: "3px", fontFamily: DS.font.family }}>M3</span>}
            />
            <div style={{ height: "300px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={acornData} margin={{ top: 10, right: 32, bottom: 10, left: 32 }}>
                  <PolarGrid stroke={DS.colors.border} />
                  <PolarAngleAxis dataKey="axis" tick={{ fontSize: 12, fontFamily: DS.font.family, fill: DS.colors.textSecondary, fontWeight: 600 }} />
                  <PolarRadiusAxis angle={90} domain={[0,100]} tick={{ fontSize: 9, fill: DS.colors.textMuted }} tickCount={4} />
                  <Tooltip content={<RadarTooltip />} />
                  <Radar name="Class Avg" dataKey="current" stroke={DS.colors.secondary} fill={DS.colors.secondary} fillOpacity={0.18} strokeWidth={2.5} dot={{ fill: DS.colors.secondary, r: 4, stroke: "#fff", strokeWidth: 2 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            {/* Dimension quick-bars */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginTop: "8px" }}>
              {acornData.map(d => (
                <div key={d.axis} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "10px", color: DS.colors.textMuted, fontFamily: DS.font.family, marginBottom: "2px" }}>{d.axis}</div>
                    <div style={{ height: "4px", background: "#F3F4F6", borderRadius: DS.radius.full }}>
                      <div style={{ height: "100%", width: `${d.current}%`, background: DS.colors.secondary, borderRadius: DS.radius.full }} />
                    </div>
                  </div>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: DS.colors.textPrimary, fontFamily: DS.font.family, flexShrink: 0 }}>{d.current}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* §6.2.4b — Engagement Index (Module D) */}
          <Card style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                <span style={{ fontSize: "10px", fontWeight: 800, padding: "2px 6px", background: DS.colors.warning, color: "#fff", borderRadius: "3px", fontFamily: DS.font.family }}>D.0</span>
                <span style={{ fontSize: "14px", fontWeight: 700, color: DS.colors.textPrimary, fontFamily: DS.font.family }}>Engagement Index</span>
              </div>
              <div style={{ fontSize: "11px", color: DS.colors.textMuted, fontFamily: DS.font.family }}>Module D · This Week · Saturated Points</div>
            </div>

            {/* Ring */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <CircularRing value={engagement.totalPts} max={engagement.maxPts} size={104} color={DS.colors.primary} />
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: "20px", fontWeight: 800, color: DS.colors.textPrimary, fontFamily: DS.font.family }}>{engagement.totalPts}</span>
                  <span style={{ fontSize: "10px", color: DS.colors.textMuted, fontFamily: DS.font.family }}>pts</span>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                {engagement.breakdown.map(b => (
                  <div key={b.label} style={{ marginBottom: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                      <span style={{ fontSize: "11px", color: DS.colors.textSecondary, fontFamily: DS.font.family }}>{b.label}</span>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: DS.colors.textPrimary, fontFamily: DS.font.family }}>{b.pts}</span>
                    </div>
                    <div style={{ height: "5px", background: DS.colors.background, borderRadius: DS.radius.full }}>
                      <div style={{ height: "100%", width: `${b.pct*100}%`, background: b.color, borderRadius: DS.radius.full }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Saturation indicators */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {[
                { label: "Peak Day", value: "Tuesday",  score: 94, color: DS.colors.secondary },
                { label: "Lowest",   value: "Monday",   score: 67, color: DS.colors.error     },
                { label: "Trend",    value: "+8.2%",    score: 77, color: DS.colors.primary   },
              ].map(r => (
                <div key={r.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", background: DS.colors.background, borderRadius: DS.radius.md }}>
                  <span style={{ fontSize: "11px", color: DS.colors.textSecondary, fontFamily: DS.font.family }}>{r.label}</span>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: r.color, fontFamily: DS.font.family }}>{r.value}</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: "auto", padding: "10px 12px", background: DS.colors.primaryLight, borderRadius: DS.radius.md, border: `1px solid #BFDBFE` }}>
              <div style={{ fontSize: "12px", color: DS.colors.primary, fontFamily: DS.font.family }}>
                🤖 <strong>AI Note:</strong> Collaborative score 8% below Academic. Recommend group-focused activity today.
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// §7  SCREEN 2 — 2.0 LIVE PBL CLASS  (Pure Presentational)
// ═══════════════════════════════════════════════════════════════════════════

interface Screen2Props {
  groups: GroupRec[];
  selectedGroupId: string | null;
  roles: Record<string, string>;
  scanActive: boolean;
  lastToken: string | null;
  onSelectGroup: (id: string) => void;
  onRoleChange: (studentId: string, role: string) => void;
  onToggleScan: () => void;
  onRequestAI: () => void;
}

const alertStyle: Record<string, { border: string; bg: string; label: string; labelColor: string }> = {
  ok:   { border: DS.colors.border, bg: DS.colors.surface,   label: "On track",   labelColor: DS.colors.secondary },
  warn: { border: "#F59E0B",        bg: "#FFFBEB",            label: "Needs focus", labelColor: DS.colors.warning   },
  risk: { border: DS.colors.error,  bg: "#FFF5F5",            label: "At risk",     labelColor: DS.colors.error     },
};

const Screen2_LivePBL: React.FC<Screen2Props> = ({
  groups, selectedGroupId, roles, scanActive, lastToken,
  onSelectGroup, onRoleChange, onToggleScan, onRequestAI,
}) => {
  const selectedGroup = groups.find(g => g.id === selectedGroupId) ?? null;

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "20px", background: DS.colors.background }}>

      {/* §7.1 — Screen header */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ fontSize: "10px", fontWeight: 800, padding: "2px 6px", background: "#7C3AED", color: "#fff", borderRadius: "3px", fontFamily: DS.font.family }}>2.0</span>
        <h1 style={{ fontSize: "20px", fontWeight: 800, color: DS.colors.textPrimary, margin: 0, fontFamily: DS.font.family }}>Live PBL Class</h1>
        <span style={{ fontSize: "12px", color: DS.colors.textMuted, fontFamily: DS.font.family }}>實時跨學科實作 · Class 1A · Mod 5.2 · Mod E · Mod B</span>
        <StatusBadge variant="active" label="● 14:35" size="sm" />
      </div>

      {/* §7.2 — Two columns: Camera + Matrix */}
      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: "20px", alignItems: "start" }}>

        {/* §7.2a — Camera / QR feed (Module E) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <Card style={{ overflow: "hidden", border: scanActive ? `2px solid ${DS.colors.secondary}` : `2px solid ${DS.colors.border}`, transition: "border-color 0.3s" }}>
            {/* Dark camera area */}
            <div style={{ background: "#0F172A", height: "220px", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
              {/* Grid texture */}
              <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(26,86,219,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(26,86,219,0.05) 1px,transparent 1px)", backgroundSize: "32px 32px" }} />
              {/* Scan line */}
              {scanActive && (
                <div style={{ position: "absolute", left: 0, right: 0, height: "2px", background: "linear-gradient(90deg,transparent,#10B981,transparent)", animation: "tj-scanLine 1.8s ease-in-out infinite", zIndex: 3 }} />
              )}
              {/* QR frame */}
              <div style={{ position: "relative", width: "140px", height: "140px", zIndex: 4 }}>
                {([
                  { top: 0,    left: 0,    bottom: undefined, right: undefined },
                  { top: 0,    right: 0,   bottom: undefined, left: undefined  },
                  { bottom: 0, left: 0,    top: undefined,    right: undefined },
                  { bottom: 0, right: 0,   top: undefined,    left: undefined  },
                ] as React.CSSProperties[]).map((pos, i) => {
                  const bColor = scanActive ? "#10B981" : "#4B5563";
                  const borders: React.CSSProperties = i === 0
                    ? { borderTop: `3px solid ${bColor}`, borderLeft: `3px solid ${bColor}` }
                    : i === 1
                    ? { borderTop: `3px solid ${bColor}`, borderRight: `3px solid ${bColor}` }
                    : i === 2
                    ? { borderBottom: `3px solid ${bColor}`, borderLeft: `3px solid ${bColor}` }
                    : { borderBottom: `3px solid ${bColor}`, borderRight: `3px solid ${bColor}` };
                  return <div key={i} style={{ position: "absolute", width: "22px", height: "22px", transition: "border-color 0.3s", ...pos, ...borders }} />;
                })}
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                  <QrCode size={48} color={scanActive ? "#10B981" : "#4B5563"} strokeWidth={1} style={{ transition: "color 0.3s" }} />
                  <span style={{ fontSize: "10px", fontWeight: 700, color: scanActive ? "#10B981" : "#6B7280", fontFamily: DS.font.family, letterSpacing: "0.1em" }}>
                    {scanActive ? "SCANNING..." : "IDLE"}
                  </span>
                </div>
              </div>
              {/* Status chips */}
              <div style={{ position: "absolute", top: "8px", left: "8px", zIndex: 10 }}>
                <div style={{ background: "rgba(15,23,42,0.85)", border: `1px solid ${scanActive?"#10B981":"#374151"}`, borderRadius: DS.radius.md, padding: "3px 8px", display: "flex", alignItems: "center", gap: "5px" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: scanActive ? "#10B981" : "#6B7280", animation: scanActive ? "tj-pulse 1.5s infinite" : "none" }} />
                  <span style={{ fontSize: "10px", fontWeight: 700, color: scanActive ? "#10B981" : "#9CA3AF", fontFamily: DS.font.family }}>
                    {scanActive ? "LIVE" : "IDLE"}
                  </span>
                </div>
              </div>
              <div style={{ position: "absolute", top: "8px", right: "8px", zIndex: 10 }}>
                <div style={{ background: "rgba(15,23,42,0.85)", border: "1px solid #374151", borderRadius: DS.radius.md, padding: "3px 8px" }}>
                  <span style={{ fontSize: "10px", color: "#F59E0B", fontWeight: 700, fontFamily: DS.font.family }}>⚡ 0.5s</span>
                </div>
              </div>
              {/* Last scanned */}
              {lastToken && scanActive && (
                <div style={{ position: "absolute", bottom: "8px", left: "50%", transform: "translateX(-50%)", background: "rgba(16,185,129,0.18)", border: "1px solid #10B981", borderRadius: DS.radius.md, padding: "5px 10px", zIndex: 10, animation: "tj-fadeUp 0.3s ease-out", whiteSpace: "nowrap" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#10B981", fontFamily: DS.font.family }}>✓ {lastToken}</span>
                </div>
              )}
            </div>
            {/* Controls */}
            <div style={{ padding: "10px 14px", background: "#F8FAFC", borderTop: `1px solid ${DS.colors.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <button
                onClick={onToggleScan}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "5px",
                  padding: "6px 14px", background: scanActive ? "#FEF3C7" : DS.colors.secondary,
                  border: "none", borderRadius: DS.radius.md, fontSize: "12px",
                  fontWeight: 700, color: scanActive ? "#92400E" : "#fff",
                  cursor: "pointer", fontFamily: DS.font.family,
                }}
              >
                {scanActive ? <><Pause size={12} /> Pause</> : <><Play size={12} /> Start</>}
              </button>
              <div style={{ fontSize: "11px", color: DS.colors.textMuted, fontFamily: DS.font.family }}>
                <span style={{ fontWeight: 700, color: DS.colors.secondary }}>15</span>/16 scanned
              </div>
            </div>
          </Card>

          {/* Module codes legend */}
          <Card style={{ padding: "12px 14px" }}>
            <div style={{ fontSize: "10px", fontWeight: 700, color: DS.colors.textMuted, marginBottom: "8px", fontFamily: DS.font.family, textTransform: "uppercase", letterSpacing: "0.07em" }}>
              Active Modules
            </div>
            {[
              { code: "E.0",  label: "QR Scan Engine",   color: DS.colors.secondary },
              { code: "5.2",  label: "Matrix Record",    color: "#7C3AED"           },
              { code: "B.0",  label: "Role Anchoring",   color: "#EC4899"           },
              { code: "5.3",  label: "AI Feedback",      color: DS.colors.primary   },
            ].map(m => (
              <div key={m.code} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px" }}>
                <span style={{ fontSize: "10px", fontWeight: 800, padding: "2px 5px", background: m.color, color: "#fff", borderRadius: "3px", fontFamily: DS.font.family }}>{m.code}</span>
                <span style={{ fontSize: "11px", color: DS.colors.textSecondary, fontFamily: DS.font.family }}>{m.label}</span>
              </div>
            ))}
          </Card>
        </div>

        {/* §7.2b — Group Matrix (Module 5.2) */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
            <span style={{ fontSize: "10px", fontWeight: 800, padding: "2px 6px", background: "#7C3AED", color: "#fff", borderRadius: "3px", fontFamily: DS.font.family }}>5.2</span>
            <span style={{ fontSize: "14px", fontWeight: 700, color: DS.colors.textPrimary, fontFamily: DS.font.family }}>Matrix Grid — Collaborative Groups</span>
            <span style={{ fontSize: "11px", color: DS.colors.textMuted, fontFamily: DS.font.family }}>Click a group to select it</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            {groups.map(group => {
              const ast   = alertStyle[group.alert];
              const isSel = group.id === selectedGroupId;
              const presentCount = group.members.filter(m => m.present).length;
              return (
                <div
                  key={group.id}
                  onClick={() => onSelectGroup(group.id)}
                  style={{
                    background: isSel ? DS.colors.primaryLight : ast.bg,
                    border: `2px solid ${isSel ? DS.colors.primary : ast.border}`,
                    borderRadius: DS.radius.xl,
                    padding: "16px",
                    cursor: "pointer",
                    boxShadow: isSel ? `0 0 0 4px rgba(26,86,219,0.12)` : DS.shadow.sm,
                    transition: "all 0.2s",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* Group header */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{
                        width: "30px", height: "30px", borderRadius: DS.radius.md,
                        background: isSel ? DS.colors.primary : "#E5E7EB",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <Users size={14} color={isSel ? "#fff" : DS.colors.textSecondary} />
                      </div>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: 800, color: isSel ? DS.colors.primary : DS.colors.textPrimary, fontFamily: DS.font.family }}>
                          {group.label}
                          {isSel && <span style={{ marginLeft: "6px", fontSize: "9px", fontWeight: 800, padding: "1px 5px", background: DS.colors.primary, color: "#fff", borderRadius: "3px", fontFamily: DS.font.family }}>SELECTED</span>}
                        </div>
                        <div style={{ fontSize: "10px", color: DS.colors.textMuted, fontFamily: DS.font.family, maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {group.task}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "10px", fontWeight: 700, color: ast.labelColor, fontFamily: DS.font.family }}>{ast.label}</div>
                      <div style={{ fontSize: "10px", color: DS.colors.textMuted, fontFamily: DS.font.family }}>{presentCount}/{group.members.length} present</div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div style={{ marginBottom: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                      <span style={{ fontSize: "10px", color: DS.colors.textSecondary, fontFamily: DS.font.family }}>Task Progress</span>
                      <span style={{ fontSize: "10px", fontWeight: 700, color: DS.colors.textPrimary, fontFamily: DS.font.family }}>{group.progress}%</span>
                    </div>
                    <div style={{ height: "4px", background: "#E5E7EB", borderRadius: DS.radius.full }}>
                      <div style={{ height: "100%", width: `${group.progress}%`, background: group.alert === "risk" ? DS.colors.error : group.alert === "warn" ? DS.colors.warning : DS.colors.secondary, borderRadius: DS.radius.full }} />
                    </div>
                  </div>

                  {/* Members — expanded with role dropdowns when selected (Module B) */}
                  {isSel ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                      <div style={{ fontSize: "10px", fontWeight: 700, color: "#EC4899", marginBottom: "2px", fontFamily: DS.font.family, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                        B.0 Role Anchoring — assign roles inline
                      </div>
                      {group.members.map(m => (
                        <div
                          key={m.id}
                          style={{
                            display: "flex", alignItems: "center", gap: "8px",
                            padding: "7px 10px",
                            background: DS.colors.surface,
                            borderRadius: DS.radius.md,
                            border: `1px solid ${DS.colors.border}`,
                          }}
                        >
                          <div style={{
                            width: "26px", height: "26px", borderRadius: "50%",
                            background: m.present ? DS.colors.primary : DS.colors.border,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "9px", fontWeight: 700, color: "#fff",
                            fontFamily: DS.font.family, flexShrink: 0,
                          }}>
                            {m.initials}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: "11px", fontWeight: 600, color: DS.colors.textPrimary, fontFamily: DS.font.family }}>{m.token}</div>
                            <div style={{ fontSize: "9px", color: DS.colors.textMuted, fontFamily: DS.font.family }}>Score: {m.score} · {m.present ? "Present" : "Absent"}</div>
                          </div>
                          {/* Inline role dropdown */}
                          <select
                            value={roles[m.id] ?? m.role}
                            onChange={e => onRoleChange(m.id, e.target.value)}
                            onClick={e => e.stopPropagation()}
                            style={{
                              padding: "4px 6px",
                              border: `1px solid #EC4899`,
                              borderRadius: DS.radius.sm,
                              fontSize: "11px",
                              fontWeight: 600,
                              color: "#9D174D",
                              background: "#FFF0F8",
                              cursor: "pointer",
                              fontFamily: DS.font.family,
                              outline: "none",
                              flexShrink: 0,
                            }}
                          >
                            {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                        </div>
                      ))}

                      {/* AI scaffolding trigger (Module 5.3) */}
                      <button
                        onClick={e => { e.stopPropagation(); onRequestAI(); }}
                        style={{
                          marginTop: "6px",
                          display: "flex", alignItems: "center", justifyContent: "center", gap: "7px",
                          padding: "10px 0", width: "100%",
                          background: `linear-gradient(135deg,${DS.colors.primary},#7C3AED)`,
                          border: "none", borderRadius: DS.radius.md,
                          fontSize: "13px", fontWeight: 700, color: "#fff",
                          cursor: "pointer", fontFamily: DS.font.family,
                          boxShadow: "0 3px 10px rgba(26,86,219,0.32)",
                        }}
                      >
                        <Sparkles size={14} />
                        Request AI Scaffolding ✨
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: "5px" }}>
                      {group.members.map(m => (
                        <div key={m.id} style={{
                          width: "30px", height: "30px", borderRadius: "50%",
                          background: m.present ? (group.alert === "risk" ? DS.colors.error : group.alert === "warn" ? DS.colors.warning : DS.colors.secondary) : DS.colors.border,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "9px", fontWeight: 700, color: "#fff", fontFamily: DS.font.family,
                          opacity: m.present ? 1 : 0.45,
                        }} title={m.token}>
                          {m.initials}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// §8  SCREEN 3 — 3.0 AI ASSIST & AUDIT LOCK  (slide-over panel)
// ═══════════════════════════════════════════════════════════════════════════

interface Screen3Props {
  group: GroupRec;
  auditRows: AuditRow[];
  confirmed: boolean;
  onConfirm: () => void;
  onBack: () => void;
}

const Screen3_AIAudit: React.FC<Screen3Props> = ({ group, auditRows, confirmed, onConfirm, onBack }) => {
  const [generating, setGenerating] = useState(false);
  const [hintVisible, setHintVisible] = useState(false);

  const handleGenerate = () => {
    if (hintVisible) return;
    setGenerating(true);
    setTimeout(() => { setGenerating(false); setHintVisible(true); }, 1800);
  };

  return (
    <div style={{ flex: 1, display: "flex", alignItems: "flex-start", overflow: "hidden" }}>
      {/* Dimmed backdrop (the screen 2 matrix is "behind" this) */}
      <div
        style={{
          flex: 1, background: "rgba(249,250,251,0.6)", backdropFilter: "blur(2px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexDirection: "column", gap: "16px", padding: "32px",
        }}
      >
        {/* Back button */}
        <button
          onClick={onBack}
          style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            padding: "8px 14px", background: DS.colors.surface,
            border: `1px solid ${DS.colors.border}`, borderRadius: DS.radius.md,
            fontSize: "12px", fontWeight: 600, color: DS.colors.textSecondary,
            cursor: "pointer", fontFamily: DS.font.family,
            alignSelf: "flex-start",
          }}
        >
          <ChevronLeft size={14} /> Back to Live Class
        </button>
        <div style={{ textAlign: "center", opacity: 0.6 }}>
          <Users size={48} color={DS.colors.textMuted} />
          <div style={{ fontSize: "14px", color: DS.colors.textMuted, fontFamily: DS.font.family, marginTop: "8px" }}>
            Live PBL Class — Group {group.id} selected
          </div>
        </div>
      </div>

      {/* §8.1 — AI slide-over panel */}
      <div
        style={{
          width: "460px", flexShrink: 0,
          height: "100%", overflowY: "auto",
          background: DS.colors.surface,
          borderLeft: `1px solid ${DS.colors.border}`,
          display: "flex", flexDirection: "column",
          animation: "tj-slideRight 0.32s ease-out",
          boxShadow: "-4px 0 20px rgba(0,0,0,0.08)",
        }}
      >
        {/* §8.1.1 — Panel header */}
        <div style={{
          padding: "16px 20px",
          background: `linear-gradient(135deg,#4338CA,#6D28D9)`,
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <Brain size={17} color="#E0E7FF" />
            <span style={{ fontSize: "14px", fontWeight: 800, color: "#fff", fontFamily: DS.font.family }}>3.0 AI Assist & Audit Lock</span>
            <span style={{ marginLeft: "auto", fontSize: "10px", fontWeight: 700, padding: "2px 6px", background: "rgba(255,255,255,0.15)", color: "#E0E7FF", borderRadius: DS.radius.full, fontFamily: DS.font.family }}>Mod 5.3</span>
          </div>
          {/* Group context */}
          <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: DS.radius.md, padding: "8px 12px" }}>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "#C7D2FE", marginBottom: "4px", fontFamily: DS.font.family }}>
              Group {group.id} · {group.task}
            </div>
            <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
              {group.members.map(m => (
                <div key={m.id} style={{
                  width: "22px", height: "22px", borderRadius: "50%",
                  background: "rgba(255,255,255,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "8px", fontWeight: 700, color: "#fff", fontFamily: DS.font.family,
                }} title={m.token}>
                  {m.initials}
                </div>
              ))}
              <span style={{ fontSize: "10px", color: "#C7D2FE", fontFamily: DS.font.family, alignSelf: "center", marginLeft: "4px" }}>
                {group.members.filter(m => m.present).length}/{group.members.length} present
              </span>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0" }}>

          {/* §8.1.2 — Generate button */}
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${DS.colors.border}` }}>
            <button
              onClick={handleGenerate}
              disabled={generating || hintVisible}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                padding: "12px", background: hintVisible ? DS.colors.secondary : generating ? "#6366F1" : DS.colors.primary,
                border: "none", borderRadius: DS.radius.lg, fontSize: "14px", fontWeight: 700, color: "#fff",
                cursor: generating || hintVisible ? "not-allowed" : "pointer", fontFamily: DS.font.family,
                boxShadow: generating || hintVisible ? "none" : "0 3px 12px rgba(26,86,219,0.3)",
              }}
            >
              {generating
                ? <><span style={{ animation: "tj-spin 1s linear infinite", display: "inline-block" }}>⟳</span> Generating…</>
                : hintVisible
                  ? <><CheckCircle2 size={15} /> Hint Generated ✓</>
                  : <><Sparkles size={15} /> Generate Scaffolded Hint ✨</>
              }
            </button>
          </div>

          {/* §8.1.3 — AIFeedbackCard (appears after generation) */}
          {hintVisible && (
            <div style={{ animation: "tj-fadeUp 0.4s ease-out" }}>
              {/* Card header */}
              <div style={{ padding: "12px 20px", background: "#EEF2FF", borderBottom: "1px solid #C7D2FE", display: "flex", alignItems: "center", gap: "8px" }}>
                <Brain size={14} color="#4338CA" />
                <span style={{ fontSize: "12px", fontWeight: 800, color: "#3730A3", fontFamily: DS.font.family }}>AIFeedbackCard — Socratic Method</span>
                <span style={{ marginLeft: "auto", fontSize: "10px", fontWeight: 700, padding: "2px 7px", background: "#8B5CF6", color: "#fff", borderRadius: DS.radius.full, fontFamily: DS.font.family }}>L4 Analyze</span>
              </div>
              {/* Hint text */}
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #E0E7FF" }}>
                {SOCRATIC_HINT.split("\n\n").map((para, i) => (
                  <p key={i} style={{ fontSize: "13px", color: DS.colors.textPrimary, lineHeight: "1.75", margin: i > 0 ? "10px 0 0" : "0", fontFamily: DS.font.family }}
                    dangerouslySetInnerHTML={{ __html: para.replace(/\*(.*?)\*/g, `<span style="color:${DS.colors.primary};font-weight:700">$1</span>`) }}
                  />
                ))}
              </div>

              {/* §8.1.4 — 4 Mandatory Audit Timestamps (Clause 6) */}
              <div style={{ padding: "14px 20px", background: "#F8FAFC", borderBottom: "1px solid #E5E7EB" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}>
                  <Shield size={13} color="#4338CA" />
                  <span style={{ fontSize: "10px", fontWeight: 800, color: "#4338CA", fontFamily: DS.font.family, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Clause 6 — 4 Mandatory Audit Timestamps
                  </span>
                  <DataPrivacyShield label="PDPO ✓" />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {auditRows.map(row => {
                    const icons: React.ReactNode[] = [<User size={12}/>, <Clock size={12}/>, <Database size={12}/>, <Link size={12}/>];
                    return (
                      <div key={row.index} style={{
                        display: "flex", alignItems: "flex-start", gap: "10px",
                        padding: "9px 12px",
                        background: DS.colors.surface,
                        borderRadius: DS.radius.md,
                        border: `1px solid ${DS.colors.border}`,
                      }}>
                        {/* Index */}
                        <div style={{
                          width: "20px", height: "20px", borderRadius: "50%",
                          background: "#4338CA",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "#fff", fontSize: "10px", fontWeight: 800, fontFamily: DS.font.family, flexShrink: 0,
                        }}>
                          {row.index}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "1px" }}>
                            <span style={{ color: "#6366F1" }}>{icons[row.index-1]}</span>
                            <span style={{ fontSize: "11px", fontWeight: 700, color: "#4338CA", fontFamily: DS.font.family }}>{row.label}</span>
                            <span style={{ fontSize: "10px", color: DS.colors.textMuted, fontFamily: DS.font.family }}>· {row.labelZh}</span>
                          </div>
                          <div style={{ fontSize: "11px", color: DS.colors.textSecondary, fontFamily: "'Courier New',monospace", wordBreak: "break-all" }}>
                            {row.value}
                          </div>
                        </div>
                        {/* StatusBadge for verification */}
                        <StatusBadge variant="synced" label="✓ Verified" size="sm" />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* §8.1.5 — Confirm CTA */}
              <div style={{ padding: "16px 20px" }}>
                <button
                  onClick={onConfirm}
                  disabled={confirmed}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                    padding: "13px", background: confirmed ? DS.colors.secondary : "#312E81",
                    border: "none", borderRadius: DS.radius.lg, fontSize: "13px", fontWeight: 800, color: "#fff",
                    cursor: confirmed ? "not-allowed" : "pointer", fontFamily: DS.font.family,
                    boxShadow: confirmed ? "none" : "0 4px 14px rgba(49,46,129,0.38)",
                  }}
                >
                  {confirmed
                    ? <><CheckCircle2 size={15}/> Written to Knowledge Graph ✓</>
                    : <><Database size={15}/> Confirm & Write to Knowledge Graph</>
                  }
                </button>
                {confirmed && (
                  <div style={{ marginTop: "10px", background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: DS.radius.md, padding: "10px 12px", display: "flex", alignItems: "center", gap: "8px", animation: "tj-fadeUp 0.3s ease-out" }}>
                    <CheckCircle2 size={14} color="#15803D" />
                    <div>
                      <div style={{ fontSize: "12px", fontWeight: 700, color: "#15803D", fontFamily: DS.font.family }}>Record committed</div>
                      <div style={{ fontSize: "11px", color: "#166534", fontFamily: DS.font.family }}>Audit log created · Portfolio updated · GSheet synced</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// §9  SCREEN 4 — 4.0 STUDENT PROFILE  (Pure Presentational)
// ═══════════════════════════════════════════════════════════════════════════

interface Screen4Props {
  studentToken: string;
  acornData: AcornDim[];
  achievements: AchievementRec[];
  showComparison: boolean;
  onToggleComparison: (v: boolean) => void;
}

const Screen4_StudentProfile: React.FC<Screen4Props> = ({
  studentToken, acornData, achievements, showComparison, onToggleComparison,
}) => {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const overallGrowth = (() => {
    const c = acornData.reduce((s,d) => s+d.current, 0) / acornData.length;
    const p = acornData.reduce((s,d) => s+d.previous, 0) / acornData.length;
    return +(((c-p)/p)*100).toFixed(1);
  })();

  const totalHours = achievements.filter(a => a.status==="verified").reduce((s,a) => s+a.hours, 0);

  return (
    <div style={{ flex: 1, overflowY: "auto", background: DS.colors.background }}>

      {/* §9.1 — PDPO-compliant header */}
      <div style={{
        background: `linear-gradient(135deg,#0F172A 0%,#1E1B4B 50%,#1A3A6B 100%)`,
        padding: "24px 32px",
        position: "relative", overflow: "hidden",
      }}>
        {/* Background radials */}
        <div style={{ position: "absolute", inset: 0, opacity: 0.05, backgroundImage: "radial-gradient(circle at 80% 50%,#7C3AED 0%,transparent 55%),radial-gradient(circle at 15% 80%,#1A56DB 0%,transparent 50%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "20px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
            {/* Avatar — no initials, PDPO-masked */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div style={{
                width: "64px", height: "64px", borderRadius: "50%",
                background: "linear-gradient(135deg,#4338CA,#1A56DB)",
                border: "3px solid rgba(255,255,255,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "18px", fontWeight: 800, color: "rgba(255,255,255,0.3)", fontFamily: DS.font.family,
              }}>***</div>
              <div style={{ position: "absolute", bottom: "-2px", right: "-2px", width: "20px", height: "20px", borderRadius: "50%", background: "#4338CA", border: "2px solid #1E1B4B", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Shield size={10} color="#E0E7FF" />
              </div>
            </div>
            <div>
              {/* §9.1.1 — Tokenized name with DataPrivacyShield (Clause 6.1) */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "5px", flexWrap: "wrap" }}>
                <h1 style={{ fontSize: "20px", fontWeight: 800, color: "#fff", margin: 0, fontFamily: DS.font.family }}>{studentToken}</h1>
                <DataPrivacyShield label="已脫敏 Cl.6.1 🛡️" />
              </div>
              <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
                {[
                  { icon: <Users size={12}/>, text: "Class 1A · Form F1" },
                  { icon: <Target size={12}/>, text: "M3.1 · M6 Portfolio" },
                  { icon: <Award size={12}/>, text: `${totalHours}h Logged` },
                ].map((item, i) => (
                  <span key={i} style={{ fontSize: "12px", color: "#94A3B8", fontFamily: DS.font.family, display: "flex", alignItems: "center", gap: "4px" }}>
                    {item.icon}{item.text}
                  </span>
                ))}
              </div>
              <div style={{ marginTop: "8px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {/* Growth chip */}
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: "4px",
                  padding: "4px 10px", background: "#D1FAE5", color: "#065F46",
                  border: "1px solid #6EE7B7", borderRadius: DS.radius.full,
                  fontSize: "12px", fontWeight: 700, fontFamily: DS.font.family,
                }}>
                  <TrendingUp size={12}/> +{overallGrowth}% YoY ACORN
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 10px", background: "rgba(245,158,11,0.18)", color: "#FCD34D", border: "1px solid rgba(245,158,11,0.3)", borderRadius: DS.radius.full, fontSize: "12px", fontWeight: 700, fontFamily: DS.font.family }}>
                  <Award size={11}/> 1 Gold Award
                </span>
              </div>
            </div>
          </div>
          {/* Quick stats */}
          <div style={{ display: "flex", gap: "12px", flexShrink: 0 }}>
            {[
              { label: "ACORN", value: "81.5", sub: "/100", color: DS.colors.secondary },
              { label: "Verified", value: String(achievements.filter(a=>a.status==="verified").length), sub: "records", color: "#8B5CF6" },
            ].map(s => (
              <div key={s.label} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: DS.radius.lg, padding: "12px 16px", textAlign: "center" }}>
                <div style={{ fontSize: "20px", fontWeight: 800, color: s.color, fontFamily: DS.font.family }}>
                  {s.value}<span style={{ fontSize: "11px", color: "#94A3B8", fontWeight: 400 }}>{s.sub}</span>
                </div>
                <div style={{ fontSize: "10px", color: "#64748B", fontFamily: DS.font.family, marginTop: "2px" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: "24px 32px", display: "flex", flexDirection: "column", gap: "20px" }}>

        {/* §9.2 — Two-column: Hero Radar + Dimension breakdown */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "20px" }}>

          {/* §9.2a — ACORN Hero (Module 3.1) */}
          <Card style={{ padding: "22px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "10px", fontWeight: 800, padding: "2px 6px", background: "#0891B2", color: "#fff", borderRadius: "3px", fontFamily: DS.font.family }}>3.1</span>
                  <h2 style={{ fontSize: "15px", fontWeight: 800, color: DS.colors.textPrimary, margin: 0, fontFamily: DS.font.family }}>ACORN Holistic Index — Dynamic Learner Persona</h2>
                </div>
                <p style={{ fontSize: "11px", color: DS.colors.textSecondary, margin: "3px 0 0", fontFamily: DS.font.family }}>Individual 6-dimensional profile · Module 3.1</p>
              </div>
              {/* §9.2b — Temporal comparison toggle */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
                <span style={{ fontSize: "12px", color: DS.colors.textSecondary, fontFamily: DS.font.family, whiteSpace: "nowrap" }}>Compare YoY</span>
                <ToggleSwitch checked={showComparison} onChange={onToggleComparison} />
              </div>
            </div>

            {/* Legend */}
            <div style={{ display: "flex", gap: "16px", marginBottom: "10px", justifyContent: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <div style={{ width: "12px", height: "3px", background: DS.colors.secondary, borderRadius: "2px" }} />
                <span style={{ fontSize: "10px", color: DS.colors.textSecondary, fontFamily: DS.font.family }}>2025/26 S2 (current)</span>
              </div>
              {showComparison && (
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <div style={{ width: "12px", height: "0", borderTop: "2px dashed #9CA3AF" }} />
                  <span style={{ fontSize: "10px", color: DS.colors.textMuted, fontFamily: DS.font.family }}>2024/25 Annual (ghost)</span>
                </div>
              )}
            </div>

            {/* §9.2c — Radar chart */}
            <div style={{ height: "320px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={acornData} margin={{ top: 10, right: 32, bottom: 10, left: 32 }}>
                  <PolarGrid stroke={DS.colors.border} />
                  <PolarAngleAxis dataKey="axis" tick={{ fontSize: 12, fontFamily: DS.font.family, fill: DS.colors.textSecondary, fontWeight: 600 }} />
                  <PolarRadiusAxis angle={90} domain={[0,100]} tick={{ fontSize: 9, fill: DS.colors.textMuted }} tickCount={4} />
                  <Tooltip content={<RadarTooltip />} />
                  {showComparison && (
                    <Radar name="2024/25" dataKey="previous" stroke="#9CA3AF" strokeWidth={1.5} strokeDasharray="5 3" fill="#9CA3AF" fillOpacity={0.07} dot={false} />
                  )}
                  <Radar name="2025/26" dataKey="current" stroke={DS.colors.secondary} strokeWidth={2.5} fill={DS.colors.secondary} fillOpacity={0.18} dot={{ fill: DS.colors.secondary, r: 4, stroke: "#fff", strokeWidth: 2 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {showComparison && (
              <div style={{ marginTop: "12px", background: "#F0FDF4", border: "1px solid #A7F3D0", borderRadius: DS.radius.md, padding: "10px 14px", display: "flex", alignItems: "center", gap: "8px", animation: "tj-fadeUp 0.3s" }}>
                <TrendingUp size={14} color={DS.colors.secondary} />
                <span style={{ fontSize: "12px", color: "#047857", fontFamily: DS.font.family }}>
                  <strong>Temporal Snapshot (M3):</strong> All 6 dimensions up vs prior year. Strongest gain: <strong>Opportunity +33%</strong>.
                </span>
                <span style={{ marginLeft: "auto", fontSize: "12px", fontWeight: 700, color: "#065F46", padding: "2px 8px", background: "#D1FAE5", borderRadius: DS.radius.full, fontFamily: DS.font.family, flexShrink: 0 }}>+{overallGrowth}%</span>
              </div>
            )}
          </Card>

          {/* §9.2d — Dimension bars */}
          <Card style={{ padding: "20px" }}>
            <div style={{ fontSize: "12px", fontWeight: 700, color: DS.colors.textSecondary, marginBottom: "14px", fontFamily: DS.font.family, display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "10px", fontWeight: 800, padding: "2px 5px", background: "#0891B2", color: "#fff", borderRadius: "3px", fontFamily: DS.font.family }}>3.1</span>
              Dimension Breakdown
            </div>
            {acornData.map(d => {
              const delta = d.current - d.previous;
              const pct = Math.round((delta/d.previous)*100);
              return (
                <div key={d.axis} style={{ marginBottom: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: DS.colors.textPrimary, fontFamily: DS.font.family }}>{d.axis}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                      {showComparison && <span style={{ fontSize: "10px", color: DS.colors.textMuted, fontFamily: DS.font.family, textDecoration: "line-through" }}>{d.previous}</span>}
                      <span style={{ fontSize: "12px", fontWeight: 800, color: DS.colors.secondary, fontFamily: DS.font.family }}>{d.current}</span>
                      {showComparison && <span style={{ fontSize: "10px", fontWeight: 700, color: delta>=0 ? DS.colors.secondary : DS.colors.error, fontFamily: DS.font.family }}>{delta>=0?"▲":"▼"}{Math.abs(pct)}%</span>}
                    </div>
                  </div>
                  <div style={{ height: "5px", background: "#F3F4F6", borderRadius: DS.radius.full, position: "relative" }}>
                    {showComparison && <div style={{ position: "absolute", top: 0, left: 0, height: "100%", width: `${d.previous}%`, background: "#D1D5DB", borderRadius: DS.radius.full }} />}
                    <div style={{ position: "absolute", top: 0, left: 0, height: "100%", width: `${d.current}%`, background: DS.colors.secondary, borderRadius: DS.radius.full, transition: "width 0.5s ease-out" }} />
                  </div>
                </div>
              );
            })}
          </Card>
        </div>

        {/* §9.3 — Achievements Data Table (Module 6) */}
        <Card style={{ overflow: "hidden" }}>
          <div style={{ padding: "16px 24px", borderBottom: `1px solid ${DS.colors.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "10px", fontWeight: 800, padding: "2px 6px", background: "#8B5CF6", color: "#fff", borderRadius: "3px", fontFamily: DS.font.family }}>6.0</span>
              <h2 style={{ fontSize: "14px", fontWeight: 800, color: DS.colors.textPrimary, margin: 0, fontFamily: DS.font.family }}>Achievements Matrix</h2>
              <span style={{ fontSize: "11px", color: DS.colors.textMuted, fontFamily: DS.font.family }}>Module 6 · Portfolio</span>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <StatusBadge variant="synced"  label={`${achievements.filter(a=>a.status==="verified").length} Verified`} size="sm" />
              <StatusBadge variant="pending" label={`${achievements.filter(a=>a.status==="pending").length} Pending`}  size="sm" />
              <DataPrivacyShield label="De-identified" />
            </div>
          </div>

          {/* Column headers */}
          <div style={{ display: "grid", gridTemplateColumns: "2.5fr 130px 120px 54px 96px 80px", padding: "7px 24px", background: "#F8FAFC", borderBottom: `1px solid ${DS.colors.border}` }}>
            {["Activity","Env Level","Tier","Hrs","Date","Status"].map(h => (
              <span key={h} style={{ fontSize: "10px", fontWeight: 700, color: DS.colors.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: DS.font.family, padding: "0 4px" }}>{h}</span>
            ))}
          </div>

          {achievements.map((a, idx) => {
            const isExp = expandedRow === a.id;
            return (
              <React.Fragment key={a.id}>
                <div
                  onClick={() => setExpandedRow(isExp ? null : a.id)}
                  style={{
                    display: "grid", gridTemplateColumns: "2.5fr 130px 120px 54px 96px 80px",
                    padding: "12px 24px",
                    borderBottom: `1px solid ${DS.colors.border}`,
                    background: isExp ? DS.colors.primaryLight : idx%2===0 ? DS.colors.surface : "#FAFBFF",
                    cursor: "pointer", transition: "background 0.12s", alignItems: "center",
                  }}
                >
                  {/* Title */}
                  <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: "12px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: DS.colors.textPrimary, fontFamily: DS.font.family }}>{a.title}</span>
                  </div>
                  {/* Env Level badge */}
                  <div>
                    <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 8px", background: `${a.envColor}15`, color: a.envColor, border: `1px solid ${a.envColor}40`, borderRadius: DS.radius.full, fontSize: "11px", fontWeight: 700, fontFamily: DS.font.family, whiteSpace: "nowrap" }}>
                      {a.envLevel}
                    </span>
                  </div>
                  {/* Tier badge */}
                  <div>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", padding: "3px 8px", background: `${a.tierColor}15`, color: a.tierColor, border: `1px solid ${a.tierColor}40`, borderRadius: DS.radius.full, fontSize: "11px", fontWeight: 700, fontFamily: DS.font.family, whiteSpace: "nowrap" }}>
                      {a.tier === "T4 Award" && <Star size={9}/>}{a.tier}
                    </span>
                  </div>
                  {/* Hours */}
                  <span style={{ fontSize: "13px", fontWeight: 700, color: DS.colors.textPrimary, fontFamily: DS.font.family }}>{a.hours}h</span>
                  {/* Date */}
                  <span style={{ fontSize: "11px", color: DS.colors.textSecondary, fontFamily: DS.font.family, fontVariantNumeric: "tabular-nums" }}>{a.date}</span>
                  {/* Status */}
                  <StatusBadge variant={a.status === "verified" ? "synced" : "pending"} label={a.status === "verified" ? "✓ Verified" : "Pending"} size="sm" />
                </div>

                {isExp && (
                  <div style={{ padding: "12px 24px 12px 40px", background: "#EFF6FF", borderBottom: `1px solid ${DS.colors.border}`, display: "flex", gap: "16px", alignItems: "center", animation: "tj-fadeUp 0.2s ease-out", flexWrap: "wrap" }}>
                    <ExternalLink size={13} color={DS.colors.primary} />
                    <span style={{ fontSize: "11px", color: DS.colors.primary, fontFamily: "'Courier New',monospace" }}>knowledgegraph://portfolio/{studentToken.replace("Student #","")}-{a.id}</span>
                    <DataPrivacyShield label="Token linked 🛡️" />
                  </div>
                )}
              </React.Fragment>
            );
          })}

          <div style={{ padding: "10px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#F8FAFC" }}>
            <span style={{ fontSize: "11px", color: DS.colors.textMuted, fontFamily: DS.font.family }}>
              {achievements.length} records · {totalHours}h total service
            </span>
            <Btn variant="secondary" size="sm" icon={<FileText size={13}/>}>Export PDF</Btn>
          </div>
        </Card>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// §10  TOP-LEVEL ORCHESTRATOR  (owns ALL state)
// ═══════════════════════════════════════════════════════════════════════════

export const TeacherJourneyFlow: React.FC = () => {
  // ── Journey state ──────────────────────────────────────────────────────
  const [step, setStep]                     = useState<JourneyStep>(1);
  const [sidebarCollapsed, setSidebar]      = useState(false);
  const [selectedGroup, setSelectedGroup]   = useState<string | null>("A");
  const [roles, setRoles]                   = useState<Record<string, string>>({});
  const [scanActive, setScanActive]         = useState(true);
  const [lastToken, setLastToken]           = useState<string | null>(null);
  const [auditConfirmed, setAuditConfirmed] = useState(false);
  const [showComparison, setShowComparison] = useState(true);

  // Simulate QR token streaming when scan is active on step 2
  const scanRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (step !== 2 || !scanActive) return;
    const tokens = GROUPS.flatMap(g => g.members.filter(m=>m.present).map(m => m.token));
    let i = 0;
    const next = () => {
      if (i < tokens.length) { setLastToken(tokens[i]); i++; scanRef.current = setTimeout(next, 700); }
      else { setLastToken(null); }
    };
    next();
    return () => { if (scanRef.current) clearTimeout(scanRef.current); };
  }, [step, scanActive]);

  const navigate = (target: JourneyStep) => {
    if (target === 3 && !selectedGroup) return;
    setStep(target);
  };

  const currentGroup = GROUPS.find(g => g.id === selectedGroup) ?? GROUPS[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: DS.colors.background, fontFamily: DS.font.family, overflow: "hidden" }}>
      <style>{KEYFRAMES}</style>

      {/* §10.1 — Journey Progress Bar */}
      <JourneyProgressBar current={step} onNavigate={navigate} />

      {/* §10.2 — Active screen */}
      {step === 1 && (
        <Screen1_MorningBrief
          acornData={CLASS_ACORN}
          engagement={ENGAGEMENT}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebar(p => !p)}
          onStart={() => navigate(2)}
        />
      )}

      {step === 2 && (
        <Screen2_LivePBL
          groups={GROUPS}
          selectedGroupId={selectedGroup}
          roles={roles}
          scanActive={scanActive}
          lastToken={lastToken}
          onSelectGroup={id => setSelectedGroup(id)}
          onRoleChange={(id, role) => setRoles(p => ({ ...p, [id]: role }))}
          onToggleScan={() => setScanActive(p => !p)}
          onRequestAI={() => navigate(3)}
        />
      )}

      {step === 3 && (
        <Screen3_AIAudit
          group={currentGroup}
          auditRows={AUDIT_ROWS}
          confirmed={auditConfirmed}
          onConfirm={() => { setAuditConfirmed(true); setTimeout(() => navigate(4), 1200); }}
          onBack={() => navigate(2)}
        />
      )}

      {step === 4 && (
        <Screen4_StudentProfile
          studentToken="Student #TSM-4471"
          acornData={STUDENT_ACORN}
          achievements={ACHIEVEMENTS}
          showComparison={showComparison}
          onToggleComparison={setShowComparison}
        />
      )}
    </div>
  );
};
