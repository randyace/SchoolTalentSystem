// ─────────────────────────────────────────────────────────────────────────────
// Frame 2 — Global ERP App Shell (全域導覽外殼)
// IA source: LALP_SITEMAP_AND_FEATURES.md §4 Teacher left-nav
// 6 task-based groups. Light sidebar default. Mobile responsive.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect } from "react";
import {
  GraduationCap, LayoutDashboard, ClipboardList, Users, List as ListIcon, PlusCircle,
  BookOpen, Sliders, LayoutGrid,
  CalendarDays, Award, Tag, FolderOpen, ScanQrCode,
  Layers, UserCheck,
  Database, Sparkles, ShieldCheck, Settings, Network, Code2, Trophy, Cpu,
  ChevronDown, ChevronRight, Bell, Search, Globe, LogOut, HelpCircle, Lock,
  Menu, X,
} from "lucide-react";
import { ERP } from "./erpTokens";

/* ── Nav Data Model ──────────────────────────────────────────────────────── */
interface NavItem {
  id: string;
  zhLabel: string;
  enLabel: string;
  icon: React.ReactNode;
  screenId?: string;
  /** Native CI4 URL — full page navigation */
  href?: string;
  todo?: boolean;
}

interface NavGroup {
  id: string;
  zhTitle: string;
  enTitle: string;
  adminOnly?: boolean;
  comingSoon?: boolean;
  todo?: boolean;
  items: NavItem[];
}

const TodoBadge: React.FC = () => (
  <span style={{
    marginLeft: "auto",
    flexShrink: 0,
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "0.02em",
    lineHeight: 1.2,
    color: "#92400E",
    background: "#FDE68A",
    borderRadius: 4,
    padding: "2px 5px",
    whiteSpace: "nowrap",
  }}>To Do</span>
);

// ─────────────────────────────────────────────────────────────────────────────
// CANONICAL TEACHER NAV — Section 4 of LALP_SITEMAP_AND_FEATURES.md
// ─────────────────────────────────────────────────────────────────────────────
const NAV_GROUPS: NavGroup[] = [
  {
    id: "workspace", zhTitle: "工作台", enTitle: "Workspace",
    items: [
      { id: "today-overview",  zhLabel: "今日概覽", enLabel: "Today Overview", icon: <LayoutDashboard size={15} />, screenId: "1.A.1", href: "/dashboard", todo: true },
      { id: "approval-inbox",  zhLabel: "待辦審批", enLabel: "Approval Inbox",  icon: <ClipboardList size={15} />,  screenId: "1.A.3", href: "/approval", todo: true },
    ],
  },
  {
    id: "students-classes", zhTitle: "學生與班級", enTitle: "Students & Classes",
    items: [
      { id: "students-by-year", zhLabel: "年度學生名冊", enLabel: "Students by Year",    icon: <Users size={15} />,      screenId: "1.B.1", href: "/students" },
      { id: "class-list",       zhLabel: "班別列表",     enLabel: "Class List",          icon: <ListIcon size={15} />,   screenId: "1.B.3", href: "/classes" },
      { id: "dynamic-groups",   zhLabel: "動態分組管理", enLabel: "Dynamic Group Mgmt",  icon: <PlusCircle size={15} />, screenId: "1.B.5", href: "/dynamic-group" },
    ],
  },
  {
    id: "subjects-assessment", zhTitle: "學科與評估", enTitle: "Subjects & Assessment",
    items: [
      { id: "subjects",    zhLabel: "科目管理",     enLabel: "Subjects",    icon: <BookOpen size={15} />,   screenId: "1.C.1", href: "/subjects" },
      { id: "assessments", zhLabel: "評估項目管理", enLabel: "Assessment Mgmt", icon: <Sliders size={15} />,    screenId: "1.C.2", href: "/assessments" },
      { id: "score-entry", zhLabel: "成績輸入",     enLabel: "Score Entry", icon: <LayoutGrid size={15} />, screenId: "1.C.3", href: "/scores" },
    ],
  },
  {
    id: "ai-operations", zhTitle: "AI 分析與生產", enTitle: "AI Analytics & Production",
    items: [
      { id: "ai-workspace",      zhLabel: "AI 文案工作站", enLabel: "AI Writing Workspace", icon: <Sparkles size={15} />, screenId: "1.F.3/6", href: "/ai-workspace" },
      { id: "ai-data-assistant", zhLabel: "AI 數據助手",   enLabel: "AI Data Assistant",    icon: <Database size={15} />, screenId: "1.F.AI",  href: "/ai-assistant" },
    ],
  },
  {
    id: "activities-talent", zhTitle: "活動與人才", enTitle: "Activities & Talent",
    items: [
      { id: "activities",       zhLabel: "活動／比賽／事件", enLabel: "Activities / Events",  icon: <CalendarDays size={15} />, screenId: "1.D.1", href: "/activity" },
      { id: "achievements",     zhLabel: "成就與證書上載",   enLabel: "Achievements & Cert Upload", icon: <Award size={15} />,  screenId: "1.D.4", href: "/achievements", todo: false },
      { id: "group-awards",     zhLabel: "證書範本管理",     enLabel: "Certificate Templates", icon: <Layers size={15} />,       screenId: "1.D.4B", href: "/certificates", todo: false },
      { id: "talent-filter",    zhLabel: "人才篩選與匯出",   enLabel: "Talent Pool & Filter", icon: <Users size={15} />,        screenId: "1.D.5", href: "/talent", todo: true },
      { id: "exemplar-library", zhLabel: "成果課件庫",       enLabel: "Exemplar Library",     icon: <FolderOpen size={15} />,   screenId: "1.D.7", href: "/dashboard", todo: true },
      { id: "club-management",  zhLabel: "學會管理",         enLabel: "Club & Society Mgmt",  icon: <Users size={15} />,        screenId: "1.D.8", href: "/clubs" },
    ],
  },
  {
    id: "collaboration", zhTitle: "專題研習", enTitle: "Project Learning",
    items: [
      { id: "group-projects", zhLabel: "分組專題", enLabel: "Group Projects", icon: <Layers size={15} />,    screenId: "1.E.1", href: "/projects" },
      { id: "role-anchoring", zhLabel: "角色定錨", enLabel: "Role Anchoring", icon: <UserCheck size={15} />, screenId: "1.E.3", href: "/dashboard", todo: true },
    ],
  },
  {
    id: "system-admin", zhTitle: "系統管理", enTitle: "System Admin",
    items: [
      { id: "system-settings",   zhLabel: "系統設定",         enLabel: "System Settings",      icon: <Settings    size={15} />, screenId: "1.F.S",   href: "/settings" },
      { id: "system-users",      zhLabel: "系統用戶管理",     enLabel: "System Users",         icon: <ShieldCheck size={15} />, screenId: "1.F.U",   href: "/admin/system-users" },
      { id: "system-admin-home", zhLabel: "系統設定總覽",     enLabel: "Admin Overview",       icon: <Settings    size={15} />, screenId: "1.F.0",   href: "/admin/settings" },
      { id: "data-import",       zhLabel: "數據匯入",         enLabel: "Data Import",          icon: <Database    size={15} />, screenId: "1.F.1",   href: "/roster" },
      { id: "prompt-portal",      zhLabel: "AI 提示詞",        enLabel: "Prompt Portal",        icon: <Sparkles    size={15} />, screenId: "1.F.3",   href: "/ai-workspace", todo: true },
      { id: "sync-permissions",  zhLabel: "同步與權限",       enLabel: "Sync & Permissions",   icon: <Network     size={15} />, screenId: "1.F.0.8", href: "/admin/audit-logs" },
      { id: "api-automation",    zhLabel: "API 自動化串接",   enLabel: "API & Automation",     icon: <Network     size={15} />, screenId: "1.F.6/8", href: "/api/docs", todo: true },
      { id: "api-docs",          zhLabel: "接口文檔",         enLabel: "API Docs",             icon: <BookOpen    size={15} />, screenId: "1.F.7",   href: "/api/docs", todo: true },
      { id: "acorn-engine",      zhLabel: "ACORN 演算法引擎", enLabel: "Algorithm & Params",   icon: <Cpu         size={15} />, screenId: "1.G.0",   href: "/admin/acorn-engine" },
      { id: "tier-mapping",      zhLabel: "成就級別管理",     enLabel: "Tier Mapping",         icon: <Trophy      size={15} />, screenId: "1.G.1",   href: "/teacher/tiers" },
      { id: "conduct-types",     zhLabel: "行為考勤類別",     enLabel: "Conduct & Att. Types", icon: <Sliders     size={15} />, screenId: "1.G.2",   href: "/teacher/conduct-types" },
      { id: "dev-routes",        zhLabel: "路由標籤元件",     enLabel: "Dev Route Labels",     icon: <Code2       size={15} />, screenId: "DEV",     href: "/dashboard", todo: true },
      { id: "roles-positions",   zhLabel: "角色與崗位",       enLabel: "Roles & Positions",    icon: <Tag         size={15} />, screenId: "1.D.6",   href: "/teacher/roles" },
      { id: "desensitize-audit", zhLabel: "脫敏與審計",       enLabel: "De-sensitize & Audit", icon: <ShieldCheck size={15} />, screenId: "1.F.0.8", href: "/admin/audit-logs" },
    ],
  },
];

// ── Light sidebar design tokens ───────────────────────────────────────────────
const SB = {
  bg:           "#FFFFFF",
  headerBg:     "#F8FAFC",
  hover:        "#F1F5F9",
  activeBg:     "#EFF6FF",
  activeBorder: ERP.colors.accent,
  border:       "#E2E8F0",
  groupLabel:   "#64748B",
  groupSub:     "#94A3B8",
  itemText:     "#374151",
  itemMuted:    "#94A3B8",
  itemActive:   ERP.colors.accent,
  icon:         "#94A3B8",
  iconActive:   ERP.colors.accent,
  iconHover:    "#64748B",
  footerText:   "#94A3B8",
  shadow:       "2px 0 12px rgba(0,0,0,0.06)",
  lockedText:   "#CBD5E1",
};

/* ── Language Switcher ───────────────────────────────────────────────────── */
const LangSwitcher: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<"zh-HK" | "en">("zh-HK");
  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex", alignItems: "center", gap: 5,
          padding: "5px 9px",
          background: open ? ERP.colors.accentPale : "transparent",
          border: `1px solid ${open ? ERP.colors.accent + "60" : ERP.colors.border}`,
          borderRadius: ERP.radius.md, cursor: "pointer",
          fontSize: 12, fontWeight: 600,
          color: open ? ERP.colors.accent : ERP.colors.textSecondary,
          fontFamily: ERP.font.family, transition: "all 0.12s",
        }}
      >
        <Globe size={13} />
        <span>{lang === "zh-HK" ? "繁體中文" : "English"}</span>
        <ChevronDown size={11} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
      </button>
      {open && (
        <div style={{
          position: "absolute", right: 0, top: 36, minWidth: 148,
          background: ERP.colors.surface, border: `1px solid ${ERP.colors.border}`,
          borderRadius: ERP.radius.md, boxShadow: ERP.shadow.lg, zIndex: 600, overflow: "hidden",
        }}>
          {([
            { v: "zh-HK" as const, label: "繁體中文", sub: "Traditional Chinese" },
            { v: "en"    as const, label: "English",  sub: "英文" },
          ]).map(opt => (
            <button key={opt.v} onClick={() => { setLang(opt.v); setOpen(false); }} style={{
              width: "100%", display: "flex", flexDirection: "column", alignItems: "flex-start",
              padding: "8px 12px",
              background: lang === opt.v ? ERP.colors.accentPale : "transparent",
              border: "none", borderBottom: `1px solid ${ERP.colors.border}`,
              cursor: "pointer", fontFamily: ERP.font.family,
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: lang === opt.v ? ERP.colors.accent : ERP.colors.textPrimary }}>{opt.label}</span>
              <span style={{ fontSize: 10, color: ERP.colors.textMuted }}>{opt.sub}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ── Sidebar Group Header ────────────────────────────────────────────────── */
const SidebarGroup: React.FC<{
  group: NavGroup; expanded: boolean; onToggle: () => void; isAdmin: boolean;
}> = ({ group, expanded, onToggle, isAdmin }) => {
  const locked = group.adminOnly && !isAdmin;
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={locked ? undefined : onToggle}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: 8,
        padding: "8px 14px 5px",
        background: hov && !locked ? SB.hover : "transparent",
        border: "none", cursor: locked ? "default" : "pointer",
        fontFamily: ERP.font.family, marginTop: 6, transition: "background 0.12s",
      }}
    >
      <div style={{ flex: 1, textAlign: "left" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" as const }}>
          <span style={{
            fontSize: 10, fontWeight: 700,
            color: locked ? SB.lockedText : SB.groupLabel,
            letterSpacing: "0.06em", textTransform: "uppercase" as const,
          }}>
            {group.zhTitle}
          </span>
          {locked && <Lock size={9} color={SB.lockedText} />}
        </div>
        <div style={{ fontSize: 9, color: SB.groupSub, lineHeight: 1.2, marginTop: 1, letterSpacing: "0.04em" }}>
          {group.enTitle}
        </div>
      </div>
      {group.todo && <TodoBadge />}
      {!locked && (
        <ChevronDown size={11} color={SB.groupLabel}
          style={{ transform: expanded ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.18s", flexShrink: 0 }} />
      )}
    </button>
  );
};

/* ── Sidebar Nav Item ────────────────────────────────────────────────────── */
const SidebarItem: React.FC<{
  item: NavItem; active: boolean; onClick: () => void; locked?: boolean;
}> = ({ item, active, onClick, locked = false }) => {
  const [hov, setHov] = useState(false);
  const style: React.CSSProperties = {
    width: "100%", display: "flex", alignItems: "center", gap: 9,
    padding: "7px 14px 7px 11px",
    background: active ? SB.activeBg : hov && !locked ? SB.hover : "transparent",
    border: "none",
    borderLeft: active ? `3px solid ${SB.activeBorder}` : "3px solid transparent",
    cursor: locked ? "default" : "pointer",
    fontFamily: ERP.font.family, transition: "all 0.1s", textAlign: "left",
    opacity: locked ? 0.4 : 1,
    textDecoration: "none",
    boxSizing: "border-box",
  };
  const inner = (
    <>
      <span style={{
        color: active ? SB.iconActive : hov ? SB.iconHover : SB.icon,
        display: "flex", flexShrink: 0, transition: "color 0.1s",
      }}>
        {item.icon}
      </span>
        <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
        <div style={{
          fontSize: 13, fontWeight: active ? 600 : 400,
          color: active ? SB.itemActive : hov ? "#1E293B" : SB.itemText,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          transition: "color 0.1s",
        }}>
          {item.zhLabel}
        </div>
        <div style={{
          fontSize: 10, color: SB.itemMuted,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 1,
        }}>
          {item.enLabel}
        </div>
      </div>
      {item.todo ? <TodoBadge /> : active ? (
        <div style={{ width: 5, height: 5, borderRadius: "50%", background: SB.activeBorder, flexShrink: 0 }} />
      ) : null}
    </>
  );

  if (item.href && !locked) {
    return (
      <a
        href={item.href}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={style}
      >
        {inner}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={locked ? undefined : onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={style}
    >
      {inner}
    </button>
  );
};

export type AppShellUser = {
  id?: number;
  name?: string;
  email?: string;
  role?: string;
  googleId?: string | null;
  avatarUrl?: string | null;
};

/** Split English school name into two display lines (e.g. Stewards Pooi Tun / Secondary School). */
function splitSchoolEn(en: string): [string, string] {
  const raw = (en || "").trim();
  if (!raw) return ["School", ""];
  const m = raw.match(/^(.*?)\s+(Secondary School|College|School)$/i);
  if (m) return [m[1].trim(), m[2].trim()];
  const parts = raw.split(/\s+/);
  if (parts.length >= 4) {
    return [parts.slice(0, -2).join(" "), parts.slice(-2).join(" ")];
  }
  return [raw, ""];
}

function formatAyLabel(year: string): string {
  const y = (year || "").trim();
  if (!y) return "AY 2025/26"; // FIXME: wire to global school settings when available
  return /^AY\b/i.test(y) ? y : `AY ${y}`;
}

/* ── Sidebar Panel (shared between desktop and mobile drawer) ────────────── */
const SidebarPanel: React.FC<{
  effectiveId: string; isAdmin: boolean;
  expandedGroups: Record<string, boolean>;
  onToggleGroup: (id: string) => void;
  onNav: (id: string) => void;
  logoutUrl?: string;
  profileUrl?: string;
  onClose?: () => void;
  academicYear?: string;
}> = ({ effectiveId, isAdmin, expandedGroups, onToggleGroup, onNav, logoutUrl = "/logout", profileUrl = "/profile", onClose, academicYear = "2025/26" }) => (
  <div style={{
    width: ERP.layout.sidebarWidth, height: "100%",
    background: SB.bg, borderRight: `1px solid ${SB.border}`,
    boxShadow: SB.shadow,
    display: "flex", flexDirection: "column",
    overflowY: "auto",
  }}>
    {/* Mobile drawer only: close control (school brand lives in top header) */}
    {onClose && (
      <div style={{
        padding: "10px 14px",
        borderBottom: `1px solid ${SB.border}`,
        background: SB.headerBg,
        display: "flex", alignItems: "center", justifyContent: "flex-end",
      }}>
        <button type="button" onClick={onClose} aria-label="Close menu" style={{
          background: "none", border: "none", cursor: "pointer",
          padding: 4, color: ERP.colors.textMuted, display: "flex",
        }}>
          <X size={18} />
        </button>
      </div>
    )}

    {/* Compact AY context chips (branding moved to top header) */}
    <div style={{ display: "flex", gap: 6, padding: "8px 14px 6px", flexWrap: "wrap" as const }}>
      <span style={{
        fontSize: 10, color: ERP.colors.accent, fontWeight: 600,
        background: ERP.colors.accentPale,
        border: `1px solid ${ERP.colors.accentLight}`,
        borderRadius: ERP.radius.xs, padding: "1px 7px",
      }}>{formatAyLabel(academicYear)}</span>
    </div>

    {/* Nav groups */}
    <nav style={{ flex: 1, paddingBottom: 8 }}>
      {NAV_GROUPS.map(group => {
        const locked = !!(group.adminOnly && !isAdmin);
        const expanded = expandedGroups[group.id] ?? true;
        return (
          <div key={group.id}>
            <SidebarGroup
              group={group} expanded={expanded} isAdmin={isAdmin}
              onToggle={() => onToggleGroup(group.id)}
            />
            {expanded && group.items.map(item => (
              <SidebarItem
                key={item.id} item={item}
                active={effectiveId === item.id}
                locked={locked}
                onClick={() => { onNav(item.id); onClose?.(); }}
              />
            ))}
          </div>
        );
      })}
    </nav>

    {/* Footer */}
    <div style={{ borderTop: `1px solid ${SB.border}`, padding: "6px 0" }}>
      <a
        href={profileUrl}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 8,
          padding: "8px 14px", textDecoration: "none",
          background: "transparent", border: "none",
          cursor: "pointer", fontSize: 12, color: SB.footerText, fontFamily: ERP.font.family,
        }}
        onMouseEnter={e => { e.currentTarget.style.color = ERP.colors.textSecondary; }}
        onMouseLeave={e => { e.currentTarget.style.color = SB.footerText; }}
      >
        <Settings size={13} /> 帳戶管理
      </a>
      <a
        href={logoutUrl}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 8,
          padding: "8px 14px", textDecoration: "none",
          background: "transparent", border: "none",
          cursor: "pointer", fontSize: 12, color: SB.footerText, fontFamily: ERP.font.family,
        }}
        onMouseEnter={e => { e.currentTarget.style.color = ERP.colors.textSecondary; }}
        onMouseLeave={e => { e.currentTarget.style.color = SB.footerText; }}
      >
        <LogOut size={13} /> 登出系統
      </a>
      <div style={{
        width: "100%", display: "flex", alignItems: "center", gap: 8,
        padding: "8px 14px", fontSize: 12, color: SB.footerText, fontFamily: ERP.font.family,
      }}>
        <HelpCircle size={13} /> 說明文件
      </div>
    </div>
  </div>
);

/* ── App Shell Props ─────────────────────────────────────────────────────── */
export interface AppShellProps {
  children?: React.ReactNode;
  activeNavId?: string;
  onNavChange?: (id: string) => void;
  isAdmin?: boolean;
  /** @deprecated Prefer logoutUrl — kept for demo shells */
  onBack?: () => void;
  currentUser?: AppShellUser | null;
  logoutUrl?: string;
  profileUrl?: string;
  /** Chinese school name (sidebar / chrome) */
  schoolName?: string;
  /** English school name */
  schoolNameEn?: string;
  /** Active academic year, e.g. 2025/26 */
  academicYear?: string;
}

/* ── Main Export ─────────────────────────────────────────────────────────── */
export const Frame02_AppShell: React.FC<AppShellProps> = ({
  children,
  activeNavId = "students-by-year",
  onNavChange,
  isAdmin     = true,
  onBack,
  currentUser = null,
  logoutUrl = "/logout",
  profileUrl = "/profile",
  schoolName = "香港神託會培敦中學",
  schoolNameEn = "Stewards Pooi Tun Secondary School",
  academicYear = "2025/26", // FIXME: prefer bridge / global settings
}) => {
  const displayName = (currentUser?.name || "").trim() || "使用者";
  const displayRole = (currentUser?.role || "").trim() || "staff";
  const initial = displayName.charAt(0) || "?";
  const doLogout = () => {
    if (onBack) { onBack(); return; }
    window.location.href = logoutUrl;
  };
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    Object.fromEntries(NAV_GROUPS.map(g => [g.id, true]))
  );
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [isMobile,    setIsMobile]    = useState(false);
  const [internalActive, setInternalActive] = useState(activeNavId);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Close mobile drawer when screen grows past breakpoint
  useEffect(() => { if (!isMobile) setMobileOpen(false); }, [isMobile]);

  // "diagnostic" was merged into "assessment-weights" — alias for backwards-compat
  const rawId       = onNavChange ? activeNavId : internalActive;
  const effectiveId = rawId === "diagnostic" ? "assessment-weights" : rawId;
  const handleNav   = (id: string) => {
    onNavChange ? onNavChange(id) : setInternalActive(id);
    setMobileOpen(false);
  };
  const toggleGroup = (id: string) => setExpandedGroups(p => ({ ...p, [id]: !p[id] }));

  const activeGroup = NAV_GROUPS.find(g => g.items.some(i => i.id === effectiveId));
  const activeItem  = NAV_GROUPS.flatMap(g => g.items).find(i => i.id === effectiveId);
  const [enLine1, enLine2] = splitSchoolEn(schoolNameEn);
  const ayLabel = formatAyLabel(academicYear);
  const zhLine = (schoolName || "").trim() || "學校";

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100vh", width: "100%",
      fontFamily: ERP.font.family, overflow: "hidden", background: ERP.colors.pageBg,
    }}>

      {/* ── TOP HEADER ─────────────────────────────────────────────────── */}
      <header style={{
        height: Math.max(ERP.layout.topHeaderH, 64),
        background: ERP.colors.surface,
        borderBottom: `1px solid ${ERP.colors.border}`,
        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
        display: "flex", alignItems: "center",
        padding: "0 16px", gap: 10,
        flexShrink: 0, zIndex: 100,
      }}>

        {/* Hamburger on mobile */}
        {isMobile && (
          <button
            onClick={() => setMobileOpen(true)}
            style={{
              background: "none", border: `1px solid ${ERP.colors.border}`,
              borderRadius: ERP.radius.md, padding: 6, cursor: "pointer",
              color: ERP.colors.textSecondary, display: "flex", flexShrink: 0,
            }}
          >
            <Menu size={18} />
          </button>
        )}

        {/* School brand (replaces former LALP wordmark) */}
        <a
          href="/"
          title={`${schoolNameEn} · ${zhLine}`}
          style={{
            display: "flex", alignItems: "center", gap: 10, flexShrink: 1, minWidth: 0,
            textDecoration: "none", maxWidth: isMobile ? 220 : 280,
          }}
        >
          <div style={{
            width: 40, height: 40, borderRadius: ERP.radius.sm, flexShrink: 0,
            background: `linear-gradient(135deg, ${ERP.colors.accent}, #1D4ED8)`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <GraduationCap size={18} color="#fff" />
          </div>
          <div style={{ minWidth: 0, overflow: "hidden", lineHeight: 1.2 }}>
            <div style={{
              fontSize: 13, fontWeight: 700, color: ERP.colors.textPrimary,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>{enLine1}</div>
            {enLine2 ? (
              <div style={{
                fontSize: 12, fontWeight: 700, color: ERP.colors.textPrimary,
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>{enLine2}</div>
            ) : null}
            <div style={{
              fontSize: 11, color: ERP.colors.textMuted, marginTop: 1,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {zhLine}
              <span style={{ marginLeft: 6, fontWeight: 600 }}>· {ayLabel}</span>
            </div>
          </div>
        </a>

        {/* Divider */}
        {!isMobile && (
          <div style={{ width: 1, height: 24, background: ERP.colors.border, flexShrink: 0 }} />
        )}

        {/* Breadcrumb */}
        <div style={{
          display: "flex", alignItems: "center", gap: 4,
          fontSize: 13, color: ERP.colors.textSecondary, minWidth: 0,
          overflow: "hidden",
        }}>
          {!isMobile && <span style={{ whiteSpace: "nowrap" }}>首頁</span>}
          {!isMobile && <ChevronRight size={12} style={{ flexShrink: 0 }} />}
          {!isMobile && <span style={{ whiteSpace: "nowrap" }}>{activeGroup?.zhTitle ?? "—"}</span>}
          {!isMobile && <ChevronRight size={12} style={{ flexShrink: 0 }} />}
          <span style={{
            color: ERP.colors.textPrimary, fontWeight: 600,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {activeItem?.zhLabel ?? "—"}
          </span>
          {activeItem?.screenId && !isMobile && (
            <span style={{
              marginLeft: 5, fontSize: 10, fontWeight: 700,
              color: ERP.colors.textMuted, background: ERP.colors.pageBg,
              border: `1px solid ${ERP.colors.border}`, borderRadius: ERP.radius.xs,
              padding: "1px 5px", flexShrink: 0,
            }}>
              {activeItem.screenId}
            </span>
          )}
        </div>

        <div style={{ flex: 1 }} />

        {/* Search — hidden on small mobile */}
        {!isMobile && (
          <div style={{
            display: "flex", alignItems: "center", gap: 7,
            background: ERP.colors.pageBg, border: `1px solid ${ERP.colors.border}`,
            borderRadius: ERP.radius.md, padding: "5px 11px", width: 180, flexShrink: 0,
          }}>
            <Search size={13} color={ERP.colors.textMuted} />
            <input placeholder="搜尋功能…" style={{
              border: "none", background: "transparent",
              fontSize: 13, color: ERP.colors.textPrimary,
              outline: "none", width: "100%", fontFamily: ERP.font.family,
            }} />
          </div>
        )}

        {/* Lang switcher */}
        {!isMobile && <LangSwitcher />}

        {/* Notifications */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            style={{
              background: "transparent", border: `1px solid ${ERP.colors.border}`,
              cursor: "pointer", padding: 6, borderRadius: ERP.radius.md,
              color: ERP.colors.textSecondary, display: "flex", position: "relative",
            }}
          >
            <Bell size={16} />
            <span style={{
              position: "absolute", top: 4, right: 4,
              width: 7, height: 7,
              background: ERP.colors.red, borderRadius: "50%",
              border: "1.5px solid #fff",
            }} />
          </button>
          {notifOpen && (
            <div style={{
              position: "absolute", right: 0, top: 42, width: 300,
              background: ERP.colors.surface, border: `1px solid ${ERP.colors.border}`,
              borderRadius: ERP.radius.lg, boxShadow: ERP.shadow.xl, zIndex: 500, overflow: "hidden",
            }}>
              <div style={{ padding: "11px 14px", borderBottom: `1px solid ${ERP.colors.border}`, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: ERP.colors.textPrimary }}>系統通知</span>
                <span style={{ fontSize: 11, color: ERP.colors.accent, cursor: "pointer" }}>全部已讀</span>
              </div>
              {[
                { dot: ERP.colors.amber,   text: "1 個角色待認領 — 王嘉欣",  time: "3 分鐘前" },
                { dot: ERP.colors.red,     text: "成就審批：4 項待處理",       time: "10 分鐘前" },
                { dot: ERP.colors.success, text: "eClass CSV 數據匯入成功",    time: "1 小時前" },
                { dot: ERP.colors.accent,  text: "ACORN 重算完成 — F2A",       time: "2 小時前" },
              ].map((n, i) => (
                <div key={i} style={{ padding: "9px 14px", borderBottom: `1px solid ${ERP.colors.border}`, display: "flex", gap: 9, cursor: "pointer" }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: n.dot, marginTop: 5, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13, color: ERP.colors.textPrimary, lineHeight: 1.4 }}>{n.text}</div>
                    <div style={{ fontSize: 11, color: ERP.colors.textMuted, marginTop: 1 }}>{n.time}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User avatar → profile */}
        <a
          href={profileUrl}
          style={{
            display: "flex", alignItems: "center", gap: 7, cursor: "pointer",
            padding: "4px 8px", borderRadius: ERP.radius.md, border: `1px solid ${ERP.colors.border}`,
            textDecoration: "none", color: "inherit",
          }}
          title="帳戶管理"
        >
          {currentUser?.avatarUrl ? (
            <img
              src={currentUser.avatarUrl}
              alt=""
              width={28}
              height={28}
              style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
            />
          ) : (
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: `linear-gradient(135deg, ${ERP.colors.accent}, ${ERP.colors.purple})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontSize: 11, fontWeight: 700, flexShrink: 0,
            }}>{initial}</div>
          )}
          {!isMobile && (
            <>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: ERP.colors.textPrimary, lineHeight: 1.1 }}>{displayName}</div>
                <div style={{ fontSize: 10, color: ERP.colors.textMuted, lineHeight: 1.1 }}>{displayRole}</div>
              </div>
              <ChevronDown size={12} color={ERP.colors.textMuted} />
            </>
          )}
        </a>

        {/* Logout — always wired to /logout */}
        {!isMobile && (
          <a href={logoutUrl} onClick={e => { if (onBack) { e.preventDefault(); doLogout(); } }} style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "5px 10px", border: `1px solid ${ERP.colors.border}`,
            borderRadius: ERP.radius.md, background: "transparent",
            color: ERP.colors.textSecondary, cursor: "pointer",
            fontSize: 12, fontFamily: ERP.font.family, textDecoration: "none",
          }}>
            <LogOut size={13} /> 登出
          </a>
        )}
      </header>

      {/* ── BODY ──────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden", position: "relative" }}>

        {/* ── MOBILE OVERLAY BACKDROP ──────────────────────────────────── */}
        {isMobile && mobileOpen && (
          <div
            onClick={() => setMobileOpen(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 150,
              background: "rgba(15,23,42,0.45)",
            }}
          />
        )}

        {/* ── SIDEBAR: desktop fixed, mobile drawer ────────────────────── */}
        {isMobile ? (
          /* Mobile drawer */
          <div style={{
            position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 200,
            transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
            transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)",
          }}>
            <SidebarPanel
              effectiveId={effectiveId}
              isAdmin={isAdmin}
              expandedGroups={expandedGroups}
              onToggleGroup={toggleGroup}
              onNav={handleNav}
              logoutUrl={logoutUrl}
              profileUrl={profileUrl}
              academicYear={academicYear}
              onClose={() => setMobileOpen(false)}
            />
          </div>
        ) : (
          /* Desktop sidebar */
          <SidebarPanel
            effectiveId={effectiveId}
            isAdmin={isAdmin}
            expandedGroups={expandedGroups}
            onToggleGroup={toggleGroup}
            onNav={handleNav}
            logoutUrl={logoutUrl}
            profileUrl={profileUrl}
            academicYear={academicYear}
          />
        )}

        {/* ── CONTENT ───────────────────────────────────────────────────── */}
        <main style={{ flex: 1, overflowY: "auto", background: ERP.colors.pageBg, minWidth: 0 }}>
          {children}
        </main>
      </div>
    </div>
  );
};
