import React, { useState } from "react";
import {
  LayoutDashboard, Database, Sliders, ScanLine, Video,
  Cpu, BookOpen, CalendarDays, Users, ClipboardList,
  Bell, Search, ChevronDown, Menu, X, GraduationCap,
  Settings, LogOut, HelpCircle, ChevronRight, BarChart2, Award, Globe,
} from "lucide-react";
import { DS } from "./DesignSystem";
import {
  MOCK_ACORN_DATA,
  MOCK_ENGAGEMENT_DATA,
  MOCK_CLASS_OVERVIEW,
  MOCK_DASHBOARD_STATS,
  MOCK_ACTIVITIES,
  MOCK_AI_HINT,
} from "./Screen01_Dashboard";

// Lazy-loaded screen components (placeholders until built)
import { Screen01_Dashboard } from "./Screen01_Dashboard";
import { Screen02_DataPipeline } from "./Screen02_DataPipeline";
import { Screen03_DiagnosticEngine } from "./Screen03_DiagnosticEngine";
import { Screen04_OCRWizard } from "./Screen04_OCRWizard";
import { Screen05_Module5Flow } from "./Screen05_Module5Flow";
import { Screen06_PromptTuning } from "./Screen06_PromptTuning";
import { Screen07_PortfolioLibrary } from "./Screen07_PortfolioLibrary";
import { Screen08_EventConfig } from "./Screen08_EventConfig";
import { Screen09_RoleAnchoring } from "./Screen09_RoleAnchoring";
import { Screen10_AuditLog } from "./Screen10_AuditLog";
import { Screen_StudentPortfolio } from "./Screen_StudentPortfolio";
import { TeacherJourneyFlow } from "./TeacherJourneyFlow";

interface NavItem {
  id: string;
  label: string;
  labelZh: string;
  icon: React.ReactNode;
  component: React.ReactNode;
  group: string;
  badge?: string;
  badgeColor?: string;
}

// Tender-aligned nav groups per final compliance audit.
const NAV_GROUPS = ["Core Platform", "Adaptive Modules", "Value-Add Modules", "IT Admin & Security"];

type Lang = "en" | "zh-HK";

const ZH_GROUPS: Record<string, string> = {
  "Core Platform": "核心平台",
  "Adaptive Modules": "自適應模組",
  "Value-Add Modules": "增值模組",
  "IT Admin & Security": "資訊安全與底層架構",
};

/* ── Language Switcher ──────────────────────────────────────────────────── */
const LanguageSwitcher: React.FC<{ lang: Lang; onChange: (l: Lang) => void }> = ({ lang, onChange }) => {
  const [open, setOpen] = React.useState(false);
  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "6px 10px",
          background: open ? DS.colors.primaryLight : "transparent",
          border: `1px solid ${open ? DS.colors.primary + "50" : DS.colors.border}`,
          borderRadius: DS.radius.md,
          cursor: "pointer",
          fontSize: "12px",
          fontWeight: 600,
          color: open ? DS.colors.primary : DS.colors.textSecondary,
          fontFamily: DS.font.family,
          transition: "all 0.15s",
        }}
      >
        <Globe size={14} />
        <span>{lang === "zh-HK" ? "繁體中文" : "English"}</span>
        <ChevronDown size={12} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "38px",
            minWidth: "140px",
            background: DS.colors.surface,
            border: `1px solid ${DS.colors.border}`,
            borderRadius: DS.radius.md,
            boxShadow: DS.shadow.md,
            zIndex: 300,
            overflow: "hidden",
          }}
        >
          {([
            { value: "zh-HK" as Lang, label: "繁體中文", sub: "Traditional Chinese" },
            { value: "en" as Lang, label: "English", sub: "英文" },
          ] as const).map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                padding: "8px 14px",
                background: lang === opt.value ? DS.colors.primaryLight : "transparent",
                border: "none",
                cursor: "pointer",
                borderBottom: `1px solid ${DS.colors.border}`,
                fontFamily: DS.font.family,
              }}
            >
              <span style={{ fontSize: "13px", fontWeight: 600, color: lang === opt.value ? DS.colors.primary : DS.colors.textPrimary }}>
                {opt.label}
              </span>
              <span style={{ fontSize: "10px", color: DS.colors.textMuted }}>{opt.sub}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// NAV_ITEMS — canonical 16-item tender nav tree. labelZh values are the
// authoritative ZH-HK translations per the client i18n dictionary v2.
// ─────────────────────────────────────────────────────────────────────────────
const NAV_ITEMS: NavItem[] = [

  // ▼ CORE PLATFORM ──────────────────────────────────────────────────────────
  {
    id: "teacher-journey",
    label: "Teacher Journey Flow", labelZh: "教師早間概覽",
    icon: <GraduationCap size={16} />, group: "Core Platform",
    // No badge — this is the entry prototype, not a tender module number.
    component: <TeacherJourneyFlow />,
  },
  {
    id: "dashboard",
    label: "Super Dashboard", labelZh: "教師超級儀表板",   // matches dict
    icon: <LayoutDashboard size={16} />, group: "Core Platform",
    component: (
      <Screen01_Dashboard
        acornData={MOCK_ACORN_DATA}
        engagementData={MOCK_ENGAGEMENT_DATA}
        classOverview={MOCK_CLASS_OVERVIEW}
        stats={MOCK_DASHBOARD_STATS}
        activities={MOCK_ACTIVITIES}
        aiHint={MOCK_AI_HINT}
      />
    ),
  },
  {
    id: "acorn-index",
    label: "ACORN Learner Persona", labelZh: "六維學習特徵圖譜",
    icon: <BarChart2 size={16} />, group: "Core Platform",
    badge: "M3", badgeColor: "#0891B2",
    component: <Screen_StudentPortfolio />,
  },

  // ▼ ADAPTIVE MODULES ───────────────────────────────────────────────────────
  {
    id: "diagnostic",
    label: "Diagnostic Engine", labelZh: "自適應偏誤校正引擎",
    icon: <Sliders size={16} />, group: "Adaptive Modules",
    badge: "M2", badgeColor: "#8B5CF6",
    component: <Screen03_DiagnosticEngine />,
  },
  {
    id: "ocr-wizard",
    label: "OCR Achievement", labelZh: "AI 成就 OCR 語義萃取",
    icon: <ScanLine size={16} />, group: "Adaptive Modules",
    badge: "M4", badgeColor: "#8B5CF6",
    component: <Screen04_OCRWizard />,
  },
  {
    id: "class-recorder",
    label: "Live Class Recorder", labelZh: "實時表現記錄器",
    icon: <Video size={16} />, group: "Adaptive Modules",
    badge: "M5", badgeColor: "#8B5CF6",
    component: <Screen05_Module5Flow />,
  },
  {
    id: "prompt-tuning",
    label: "Prompt Tuning Portal", labelZh: "AI 管治與提示詞門戶",
    icon: <Cpu size={16} />, group: "Adaptive Modules",
    badge: "M6a", badgeColor: "#6366F1",
    component: <Screen06_PromptTuning />,
  },
  {
    // M6b — Portfolio Library (Masonry grid + AI assembly). NOT the same as M3 ACORN.
    id: "portfolio-library",
    label: "Portfolio Library", labelZh: "優秀成果課件庫",
    icon: <BookOpen size={16} />, group: "Adaptive Modules",
    badge: "M6b", badgeColor: "#6366F1",
    component: <Screen07_PortfolioLibrary />,
  },

  // ▼ VALUE-ADD MODULES ──────────────────────────────────────────────────────
  {
    // No badge — Event Configuration is a support utility, not a numbered module.
    id: "events",
    label: "Event Configuration", labelZh: "活動設定",
    icon: <CalendarDays size={16} />, group: "Value-Add Modules",
    component: <Screen08_EventConfig />,
  },
  {
    id: "audit-log",
    label: "Audit Log & Sync", labelZh: "系統安全性審計日誌",
    icon: <ClipboardList size={16} />, group: "Value-Add Modules",
    badge: "Mod A", badgeColor: "#0891B2",
    component: <Screen10_AuditLog />,
  },
  {
    id: "role-anchoring",
    label: "Role Anchoring", labelZh: "PBL 分組協作角色定錨",
    icon: <Users size={16} />, group: "Value-Add Modules",
    badge: "Mod B", badgeColor: "#0891B2",
    component: null, // rendered dynamically in main with lang prop
  },
  {
    id: "campus-rewards",
    label: "Campus Reward Points", labelZh: "校園自主積點數據中樞",
    icon: <Award size={16} />, group: "Value-Add Modules",
    badge: "Mod C", badgeColor: "#EC4899",
    component: (
      <div style={{ padding: "40px", fontFamily: DS.font.family }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "3px 10px", background: "#FDF2F8", border: "1px solid #FBCFE8", borderRadius: "4px", marginBottom: "14px" }}>
          <span style={{ fontSize: "11px", fontWeight: 800, color: "#DB2777" }}>Mod C</span>
        </div>
        <div style={{ fontSize: "22px", fontWeight: 800, color: DS.colors.textPrimary, marginBottom: "6px" }}>Campus Reward Points</div>
        <div style={{ fontSize: "14px", color: DS.colors.textSecondary }}>校園獎勵積分 · Screen in development</div>
      </div>
    ),
  },
  {
    id: "engagement",
    label: "Engagement Index", labelZh: "課堂學習參與度指標",
    icon: <BarChart2 size={16} />, group: "Value-Add Modules",
    badge: "Mod D", badgeColor: "#F59E0B",
    component: (
      <div style={{ padding: "40px", fontFamily: DS.font.family }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "3px 10px", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: "4px", marginBottom: "14px" }}>
          <span style={{ fontSize: "11px", fontWeight: 800, color: "#D97706" }}>Mod D</span>
        </div>
        <div style={{ fontSize: "22px", fontWeight: 800, color: DS.colors.textPrimary, marginBottom: "6px" }}>Engagement Index</div>
        <div style={{ fontSize: "14px", color: DS.colors.textSecondary }}>參與指數 · Screen in development</div>
      </div>
    ),
  },
  {
    id: "qr-scan",
    label: "QR Scan Engine", labelZh: "0.5秒 QR Code 快掃引擎",
    icon: <ScanLine size={16} />, group: "Value-Add Modules",
    badge: "Mod E", badgeColor: "#10B981",
    component: (
      <div style={{ padding: "40px", fontFamily: DS.font.family }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "3px 10px", background: "#F0FDF4", border: "1px solid #A7F3D0", borderRadius: "4px", marginBottom: "14px" }}>
          <span style={{ fontSize: "11px", fontWeight: 800, color: "#059669" }}>Mod E</span>
        </div>
        <div style={{ fontSize: "22px", fontWeight: 800, color: DS.colors.textPrimary, marginBottom: "6px" }}>QR Scan Engine</div>
        <div style={{ fontSize: "14px", color: DS.colors.textSecondary }}>QR 掃描引擎 · Embedded within Live Class Recorder (M5)</div>
      </div>
    ),
  },

  // ▼ IT ADMIN & SECURITY ────────────────────────────────────────────────────
  {
    id: "data-pipeline",
    label: "Data Tokenization", labelZh: "異構數據 Token 化流水線",
    icon: <Database size={16} />, group: "IT Admin & Security",
    badge: "M1", badgeColor: "#6366F1",
    component: <Screen02_DataPipeline />,
  },
  {
    id: "desensitize",
    label: "De-sensitization Rules", labelZh: "三階段不可逆脫敏引擎",
    icon: <Settings size={16} />, group: "IT Admin & Security",
    badge: "Clause 6", badgeColor: "#EF4444",
    component: (
      <div style={{ padding: "40px", fontFamily: DS.font.family }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "3px 10px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "4px", marginBottom: "14px" }}>
          <span style={{ fontSize: "11px", fontWeight: 800, color: "#DC2626" }}>Clause 6</span>
        </div>
        <div style={{ fontSize: "22px", fontWeight: 800, color: DS.colors.textPrimary, marginBottom: "6px" }}>De-sensitization Rules</div>
        <div style={{ fontSize: "14px", color: DS.colors.textSecondary }}>去敏感化規則 · PDPO Clause 6 compliance configuration</div>
      </div>
    ),
  },
  {
    id: "scale-engine",
    label: "Scale Engine Config", labelZh: "評估權重與偏誤縮放配置",
    icon: <Sliders size={16} />, group: "IT Admin & Security",
    badge: "SLA", badgeColor: "#475569",
    component: (
      <div style={{ padding: "40px", fontFamily: DS.font.family }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "3px 10px", background: "#F8FAFC", border: "1px solid #CBD5E1", borderRadius: "4px", marginBottom: "14px" }}>
          <span style={{ fontSize: "11px", fontWeight: 800, color: "#475569" }}>SLA</span>
        </div>
        <div style={{ fontSize: "22px", fontWeight: 800, color: DS.colors.textPrimary, marginBottom: "6px" }}>Scale Engine Config</div>
        <div style={{ fontSize: "14px", color: DS.colors.textSecondary }}>擴展引擎設定 · Infrastructure & SLA configuration</div>
      </div>
    ),
  },
];

export const LALPApp: React.FC = () => {
  const [activeScreen, setActiveScreen] = useState("role-anchoring");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    "Core Platform": true,
    "Adaptive Modules": true,
    "Value-Add Modules": true,
    "IT Admin & Security": true,
  });
  const [notifOpen, setNotifOpen] = useState(false);
  const [lang, setLang] = useState<Lang>("zh-HK");

  const activeItem = NAV_ITEMS.find((n) => n.id === activeScreen)!;

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: DS.colors.background,
        fontFamily: DS.font.family,
        overflow: "hidden",
      }}
    >
      {/* ── TOP NAVIGATION BAR ─────────────────────────────────────────────── */}
      <nav
        style={{
          height: "56px",
          background: DS.colors.surface,
          borderBottom: `1px solid ${DS.colors.border}`,
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          gap: "12px",
          position: "relative",
          zIndex: 100,
          flexShrink: 0,
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}
      >
        {/* Hamburger */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: "4px",
            color: DS.colors.textSecondary,
            display: "flex",
          }}
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: `linear-gradient(135deg, ${DS.colors.primary}, #7C3AED)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <GraduationCap size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: DS.colors.textPrimary, lineHeight: 1.1 }}>
              LALP
            </div>
            <div style={{ fontSize: "10px", color: DS.colors.textMuted, lineHeight: 1 }}>
              Stewards Pooi Tun Sec. 香港神託會培敦
            </div>
          </div>
        </div>

        {/* Breadcrumb */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            marginLeft: "8px",
            color: DS.colors.textSecondary,
            fontSize: "13px",
          }}
        >
          <span>Platform</span>
          <ChevronRight size={14} />
          <span style={{ color: DS.colors.textPrimary, fontWeight: 600 }}>
            {lang === "zh-HK" ? activeItem?.labelZh : activeItem?.label}
          </span>
          <span style={{ color: DS.colors.textMuted, fontSize: "12px" }}>
            · {lang === "zh-HK" ? activeItem?.label : activeItem?.labelZh}
          </span>
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Search */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: DS.colors.background,
            border: `1px solid ${DS.colors.border}`,
            borderRadius: DS.radius.md,
            padding: "6px 12px",
            width: "220px",
          }}
        >
          <Search size={14} color={DS.colors.textMuted} />
          <input
            placeholder="Search modules..."
            style={{
              border: "none",
              background: "transparent",
              fontSize: "13px",
              color: DS.colors.textPrimary,
              outline: "none",
              width: "100%",
            }}
          />
        </div>

        {/* Notifications */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "6px",
              color: DS.colors.textSecondary,
              display: "flex",
              position: "relative",
            }}
          >
            <Bell size={18} />
            <span
              style={{
                position: "absolute",
                top: "2px",
                right: "2px",
                width: "8px",
                height: "8px",
                background: DS.colors.error,
                borderRadius: "50%",
                border: "1.5px solid #fff",
              }}
            />
          </button>
          {notifOpen && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "36px",
                width: "300px",
                background: DS.colors.surface,
                border: `1px solid ${DS.colors.border}`,
                borderRadius: DS.radius.lg,
                boxShadow: DS.shadow.lg,
                zIndex: 200,
                overflow: "hidden",
              }}
            >
              <div style={{ padding: "12px 16px", borderBottom: `1px solid ${DS.colors.border}`, fontWeight: 700, fontSize: "13px" }}>
                Notifications
              </div>
              {[
                { icon: "⚠️", text: "2 duplicate role assignments detected in 1B", time: "5m ago", color: DS.colors.warningLight },
                { icon: "✅", text: "GSheet sync completed successfully", time: "12m ago", color: DS.colors.secondaryLight },
                { icon: "🔴", text: "Security alert: unusual API access pattern", time: "1h ago", color: "#FEE2E2" },
                { icon: "📊", text: "Diagnostic recalculation finished for F2", time: "2h ago", color: DS.colors.primaryLight },
              ].map((n, i) => (
                <div
                  key={i}
                  style={{
                    padding: "10px 16px",
                    borderBottom: `1px solid ${DS.colors.border}`,
                    background: n.color + "40",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ fontSize: "13px", color: DS.colors.textPrimary }}>
                    {n.icon} {n.text}
                  </div>
                  <div style={{ fontSize: "11px", color: DS.colors.textMuted, marginTop: "2px" }}>{n.time}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Language Switcher */}
        <LanguageSwitcher lang={lang} onChange={setLang} />

        {/* User Avatar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
            padding: "4px 8px",
            borderRadius: DS.radius.md,
            border: `1px solid ${DS.colors.border}`,
          }}
        >
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${DS.colors.primary}, #7C3AED)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: "12px",
              fontWeight: 700,
            }}
          >
            TC
          </div>
          <div>
            <div style={{ fontSize: "12px", fontWeight: 600, color: DS.colors.textPrimary }}>
              Mr. T. Chan
            </div>
            <div style={{ fontSize: "10px", color: DS.colors.textMuted }}>Head of Science</div>
          </div>
          <ChevronDown size={14} color={DS.colors.textMuted} />
        </div>
      </nav>

      {/* ── BODY: SIDEBAR + CONTENT ────────────────────────────────────────── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* ── SIDEBAR ──────────────────────────────────────────────────────── */}
        {sidebarOpen && (
          <aside
            style={{
              width: "252px",
              background: DS.colors.surface,
              borderRight: `1px solid ${DS.colors.border}`,
              overflowY: "auto",
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* School Info */}
            <div
              style={{
                padding: "12px 16px",
                borderBottom: `1px solid ${DS.colors.border}`,
                background: DS.colors.primaryLight,
              }}
            >
              <div style={{ fontSize: "12px", fontWeight: 700, color: DS.colors.primary, lineHeight: 1.3 }}>
                Stewards Pooi Tun Secondary School
              </div>
              <div style={{ fontSize: "10px", color: DS.colors.textMuted, marginTop: "1px", lineHeight: 1.3 }}>
                香港神託會培敦中學
              </div>
              <div style={{ fontSize: "11px", color: DS.colors.textSecondary, marginTop: "2px" }}>
                AY 2025/26 · Semester 2
              </div>
              <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
                {["F1", "F2", "F3", "F4", "F5", "F6"].map((f) => (
                  <span
                    key={f}
                    style={{
                      fontSize: "10px",
                      fontWeight: 600,
                      padding: "1px 5px",
                      background: DS.colors.primary,
                      color: "#fff",
                      borderRadius: "3px",
                    }}
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>

            {/* Navigation Groups */}
            <nav style={{ flex: 1, padding: "8px 0" }}>
              {NAV_GROUPS.map((group) => {
                const groupItems = NAV_ITEMS.filter((n) => n.group === group);
                const isExpanded = expandedGroups[group];
                return (
                  <div key={group}>
                    <button
                      onClick={() => toggleGroup(group)}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        padding: "6px 16px",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "10px",
                        fontWeight: 700,
                        color: DS.colors.textMuted,
                        textTransform: lang === "zh-HK" ? "none" : "uppercase",
                        letterSpacing: lang === "zh-HK" ? "0.02em" : "0.08em",
                        justifyContent: "space-between",
                        marginTop: "4px",
                      }}
                    >
                      {lang === "zh-HK" ? ZH_GROUPS[group] : group}
                      <ChevronRight
                        size={12}
                        style={{ transform: isExpanded ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}
                      />
                    </button>

                    {isExpanded &&
                      groupItems.map((item) => {
                        const isActive = activeScreen === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => setActiveScreen(item.id)}
                            style={{
                              width: "100%",
                              display: "flex",
                              alignItems: "center",
                              padding: "7px 16px 7px 13px",
                              background: isActive
                                ? `${item.badgeColor ?? DS.colors.primary}12`
                                : "transparent",
                              border: "none",
                              cursor: "pointer",
                              gap: "8px",
                              borderLeft: isActive
                                ? `3px solid ${item.badgeColor ?? DS.colors.primary}`
                                : "3px solid transparent",
                              transition: "background 0.15s",
                              textAlign: "left",
                            }}
                          >
                            <span
                              style={{
                                color: isActive
                                  ? (item.badgeColor ?? DS.colors.primary)
                                  : DS.colors.textSecondary,
                                display: "flex",
                                flexShrink: 0,
                              }}
                            >
                              {item.icon}
                            </span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  fontSize: "13px",
                                  fontWeight: isActive ? 700 : 400,
                                  color: isActive
                                    ? (item.badgeColor ?? DS.colors.primary)
                                    : DS.colors.textPrimary,
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {lang === "zh-HK" ? item.labelZh : item.label}
                              </div>
                              <div
                                style={{
                                  fontSize: "10px",
                                  color: DS.colors.textMuted,
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {lang === "zh-HK" ? item.label : item.labelZh}
                              </div>
                            </div>
                            {item.badge && (
                              <span
                                style={{
                                  fontSize: "9px",
                                  fontWeight: 800,
                                  padding: "2px 5px",
                                  background: isActive
                                    ? (item.badgeColor ?? DS.colors.primary)
                                    : `${item.badgeColor ?? DS.colors.primary}20`,
                                  color: isActive ? "#fff" : (item.badgeColor ?? DS.colors.primary),
                                  borderRadius: "3px",
                                  flexShrink: 0,
                                  border: `1px solid ${item.badgeColor ?? DS.colors.primary}50`,
                                  transition: "all 0.15s",
                                }}
                              >
                                {item.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                  </div>
                );
              })}
            </nav>

            {/* Bottom links */}
            <div style={{ borderTop: `1px solid ${DS.colors.border}`, padding: "8px 0" }}>
              {[
                { icon: <Settings size={15} />, label: "System Settings" },
                { icon: <HelpCircle size={15} />, label: "Help & Documentation" },
                { icon: <LogOut size={15} />, label: "Sign Out" },
              ].map((item, i) => (
                <button
                  key={i}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 16px",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "13px",
                    color: DS.colors.textSecondary,
                  }}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>
          </aside>
        )}

        {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
        <main
          style={{
            flex: 1,
            overflowY: "auto",
            background: DS.colors.background,
            padding: "24px",
          }}
        >
          {activeScreen === "role-anchoring"
            ? <Screen09_RoleAnchoring lang={lang} />
            : activeItem?.component
          }
        </main>
      </div>
    </div>
  );
};

export default LALPApp;
