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
  Database, Sparkles, ShieldCheck, Settings, Network, Code2, Trophy,
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
}

interface NavGroup {
  id: string;
  zhTitle: string;
  enTitle: string;
  adminOnly?: boolean;
  comingSoon?: boolean;
  items: NavItem[];
}

// ─────────────────────────────────────────────────────────────────────────────
// CANONICAL TEACHER NAV — Section 4 of LALP_SITEMAP_AND_FEATURES.md
// ─────────────────────────────────────────────────────────────────────────────
const NAV_GROUPS: NavGroup[] = [
  {
    id: "workspace", zhTitle: "工作台", enTitle: "Workspace",
    items: [
      { id: "today-overview",  zhLabel: "今日概覽", enLabel: "Today Overview", icon: <LayoutDashboard size={15} />, screenId: "1.A.1" },
      { id: "approval-inbox",  zhLabel: "待辦審批", enLabel: "Approval Inbox",  icon: <ClipboardList size={15} />,  screenId: "1.A.3" },
    ],
  },
  {
    id: "students-classes", zhTitle: "學生與班級", enTitle: "Students & Classes",
    items: [
      { id: "students-by-year", zhLabel: "年度學生名冊", enLabel: "Students by Year",    icon: <Users size={15} />,      screenId: "1.B.1"  },
      { id: "class-list",       zhLabel: "班別列表",     enLabel: "Class List",          icon: <ListIcon size={15} />,   screenId: "1.B.3"  },
      { id: "dynamic-groups",   zhLabel: "動態分組管理", enLabel: "Dynamic Group Mgmt",  icon: <PlusCircle size={15} />, screenId: "1.B.5"  },
    ],
  },
  {
    id: "subjects-assessment", zhTitle: "學科與評估", enTitle: "Subjects & Assessment",
    items: [
      { id: "subjects",    zhLabel: "科目管理", enLabel: "Subjects",    icon: <BookOpen size={15} />,   screenId: "1.C.1" },
      { id: "score-entry", zhLabel: "成績輸入", enLabel: "Score Entry", icon: <LayoutGrid size={15} />, screenId: "1.C.3" },
    ],
  },
  {
    id: "ai-operations", zhTitle: "AI 分析與生產", enTitle: "AI Analytics & Production",
    items: [
      { id: "ai-workspace",      zhLabel: "AI 文案工作站", enLabel: "AI Writing Workspace", icon: <Sparkles size={15} />, screenId: "1.F.3/6" },
      { id: "ai-data-assistant", zhLabel: "AI 數據助手",   enLabel: "AI Data Assistant",    icon: <Database size={15} />, screenId: "1.F.AI"  },
    ],
  },
  {
    id: "activities-talent", zhTitle: "活動與人才", enTitle: "Activities & Talent",
    items: [
      { id: "activities",       zhLabel: "活動／比賽／事件", enLabel: "Activities / Events",  icon: <CalendarDays size={15} />, screenId: "1.D.1" },
      { id: "achievements",     zhLabel: "成就與證書",       enLabel: "Achievements & Certs", icon: <Award size={15} />,        screenId: "1.D.4" },
      { id: "group-awards",     zhLabel: "證書批量建立",     enLabel: "Bulk Certificate Gen", icon: <Layers size={15} />,       screenId: "1.D.4B" },
      { id: "talent-filter",    zhLabel: "人才篩選與匯出",   enLabel: "Talent Pool & Filter", icon: <Users size={15} />,        screenId: "1.D.5" },
      { id: "exemplar-library", zhLabel: "成果課件庫",       enLabel: "Exemplar Library",     icon: <FolderOpen size={15} />,   screenId: "1.D.7" },
      { id: "club-management",  zhLabel: "學會管理",         enLabel: "Club & Society Mgmt",  icon: <Users size={15} />,        screenId: "1.D.8" },
    ],
  },
  {
    id: "collaboration", zhTitle: "專題研習", enTitle: "Project Learning",
    comingSoon: true,
    items: [
      { id: "group-projects", zhLabel: "分組專題", enLabel: "Group Projects", icon: <Layers size={15} />,    screenId: "1.E.1" },
      { id: "role-anchoring", zhLabel: "角色定錨", enLabel: "Role Anchoring", icon: <UserCheck size={15} />, screenId: "1.E.3" },
    ],
  },
  {
    id: "system-admin", zhTitle: "系統管理", enTitle: "System Admin",
    items: [
      { id: "system-admin-home", zhLabel: "系統設定總覽",     enLabel: "Admin Overview",       icon: <Settings    size={15} />, screenId: "1.F.0"    },
      { id: "data-import",       zhLabel: "數據匯入",         enLabel: "Data Import",          icon: <Database    size={15} />, screenId: "1.F.1"    },
      { id: "prompt-portal",      zhLabel: "AI 提示詞",        enLabel: "Prompt Portal",        icon: <Sparkles    size={15} />, screenId: "1.F.3"    },
      { id: "sync-permissions",  zhLabel: "同步與權限",       enLabel: "Sync & Permissions",   icon: <Network     size={15} />, screenId: "1.F.6,8"  },
      { id: "api-automation",    zhLabel: "API 自動化串接",   enLabel: "API & Automation",     icon: <Network     size={15} />, screenId: "1.F.6/8"  },
      { id: "api-docs",          zhLabel: "接口文檔",         enLabel: "API Docs",             icon: <BookOpen    size={15} />, screenId: "1.F.7"    },
      { id: "tier-mapping",      zhLabel: "成就級別管理",     enLabel: "Tier Mapping",         icon: <Trophy      size={15} />, screenId: "1.G.1"    },
      { id: "conduct-types",     zhLabel: "行為考勤類別",     enLabel: "Conduct & Att. Types", icon: <Sliders     size={15} />, screenId: "1.G.2"    },
      { id: "dev-routes",        zhLabel: "路由標籤元件",     enLabel: "Dev Route Labels",     icon: <Code2       size={15} />, screenId: "DEV"      },

      { id: "roles-positions",   zhLabel: "角色與崗位",       enLabel: "Roles & Positions",    icon: <Tag         size={15} />, screenId: "1.D.6"    },
      { id: "desensitize-audit", zhLabel: "脫敏與審計",       enLabel: "De-sensitize & Audit", icon: <ShieldCheck size={15} />, screenId: "1.F.4,6"  },
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
  return (
    <button
      onClick={locked ? undefined : onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: 9,
        padding: "7px 14px 7px 11px",
        background: active ? SB.activeBg : hov && !locked ? SB.hover : "transparent",
        border: "none",
        borderLeft: active ? `3px solid ${SB.activeBorder}` : "3px solid transparent",
        cursor: locked ? "default" : "pointer",
        fontFamily: ERP.font.family, transition: "all 0.1s", textAlign: "left",
        opacity: locked ? 0.4 : 1,
      }}
    >
      <span style={{
        color: active ? SB.iconActive : hov ? SB.iconHover : SB.icon,
        display: "flex", flexShrink: 0, transition: "color 0.1s",
      }}>
        {item.icon}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
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
      {active && (
        <div style={{ width: 5, height: 5, borderRadius: "50%", background: SB.activeBorder, flexShrink: 0 }} />
      )}
    </button>
  );
};

/* ── Sidebar Panel (shared between desktop and mobile drawer) ────────────── */
const SidebarPanel: React.FC<{
  effectiveId: string; isAdmin: boolean;
  expandedGroups: Record<string, boolean>;
  onToggleGroup: (id: string) => void;
  onNav: (id: string) => void;
  onBack?: () => void;
  onClose?: () => void;
}> = ({ effectiveId, isAdmin, expandedGroups, onToggleGroup, onNav, onBack, onClose }) => (
  <div style={{
    width: ERP.layout.sidebarWidth, height: "100%",
    background: SB.bg, borderRight: `1px solid ${SB.border}`,
    boxShadow: SB.shadow,
    display: "flex", flexDirection: "column",
    overflowY: "auto",
  }}>
    {/* School identity header */}
    <div style={{
      padding: "14px 14px 10px",
      borderBottom: `1px solid ${SB.border}`,
      background: SB.headerBg,
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <div style={{
          width: 36, height: 36, borderRadius: ERP.radius.sm, flexShrink: 0,
          background: `linear-gradient(135deg, ${ERP.colors.accent}, #1D4ED8)`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <GraduationCap size={18} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: ERP.colors.textPrimary, lineHeight: 1.2 }}>Stewards Pooi Tun</div>
          <div style={{ fontSize: 10, fontWeight: 600, color: ERP.colors.accent, lineHeight: 1.2 }}>Secondary School</div>
          <div style={{ fontSize: 9, color: ERP.colors.textMuted, lineHeight: 1.2, marginTop: 1 }}>香港神託會培敦中學</div>
        </div>
      </div>
      {/* Close button on mobile drawer */}
      {onClose && (
        <button onClick={onClose} style={{
          background: "none", border: "none", cursor: "pointer",
          padding: 4, color: ERP.colors.textMuted, display: "flex",
        }}>
          <X size={18} />
        </button>
      )}
    </div>

    {/* AY chips */}
    <div style={{ display: "flex", gap: 6, padding: "8px 14px 6px", flexWrap: "wrap" as const }}>
      {["AY 25/26", "學期 2"].map(tag => (
        <span key={tag} style={{
          fontSize: 10, color: ERP.colors.accent, fontWeight: 600,
          background: ERP.colors.accentPale,
          border: `1px solid ${ERP.colors.accentLight}`,
          borderRadius: ERP.radius.xs, padding: "1px 7px",
        }}>{tag}</span>
      ))}
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
      {[
        { icon: <HelpCircle size={13} />, label: "說明文件", action: undefined },
        { icon: <LogOut size={13} />,     label: "登出系統", action: onBack },
      ].map((item, i) => (
        <button key={i} onClick={item.action} style={{
          width: "100%", display: "flex", alignItems: "center", gap: 8,
          padding: "8px 14px",
          background: "transparent", border: "none",
          cursor: item.action ? "pointer" : "default",
          fontSize: 12, color: SB.footerText, fontFamily: ERP.font.family,
          transition: "color 0.1s",
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = ERP.colors.textSecondary; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = SB.footerText; }}
        >
          {item.icon} {item.label}
        </button>
      ))}
    </div>
  </div>
);

/* ── App Shell Props ─────────────────────────────────────────────────────── */
export interface AppShellProps {
  children?: React.ReactNode;
  activeNavId?: string;
  onNavChange?: (id: string) => void;
  isAdmin?: boolean;
  onBack?: () => void;
}

/* ── Main Export ─────────────────────────────────────────────────────────── */
export const Frame02_AppShell: React.FC<AppShellProps> = ({
  children,
  activeNavId = "students-by-year",
  onNavChange,
  isAdmin     = true,
  onBack,
}) => {
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

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100vh", width: "100%",
      fontFamily: ERP.font.family, overflow: "hidden", background: ERP.colors.pageBg,
    }}>

      {/* ── TOP HEADER ─────────────────────────────────────────────────── */}
      <header style={{
        height: ERP.layout.topHeaderH,
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

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div style={{
            width: 32, height: 32, borderRadius: ERP.radius.sm,
            background: `linear-gradient(135deg, ${ERP.colors.accent}, ${ERP.colors.purple})`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <GraduationCap size={16} color="#fff" />
          </div>
          {!isMobile && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: ERP.colors.textPrimary, lineHeight: 1.1 }}>LALP</div>
              <div style={{ fontSize: 10, color: ERP.colors.textMuted, whiteSpace: "nowrap" }}>
                香港神託會培敦中學 · AY 2025/26
              </div>
            </div>
          )}
        </div>

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

        {/* User avatar */}
        <div style={{
          display: "flex", alignItems: "center", gap: 7, cursor: "pointer",
          padding: "4px 8px", borderRadius: ERP.radius.md, border: `1px solid ${ERP.colors.border}`,
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            background: `linear-gradient(135deg, ${ERP.colors.accent}, ${ERP.colors.purple})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: 11, fontWeight: 700, flexShrink: 0,
          }}>陳</div>
          {!isMobile && (
            <>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: ERP.colors.textPrimary, lineHeight: 1.1 }}>陳老師</div>
                <div style={{ fontSize: 10, color: ERP.colors.textMuted, lineHeight: 1.1 }}>科學科主任</div>
              </div>
              <ChevronDown size={12} color={ERP.colors.textMuted} />
            </>
          )}
        </div>

        {/* Logout */}
        {onBack && !isMobile && (
          <button onClick={onBack} style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "5px 10px", border: `1px solid ${ERP.colors.border}`,
            borderRadius: ERP.radius.md, background: "transparent",
            color: ERP.colors.textSecondary, cursor: "pointer",
            fontSize: 12, fontFamily: ERP.font.family,
          }}>
            <LogOut size={13} /> 登出
          </button>
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
              onBack={onBack}
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
            onBack={onBack}
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
