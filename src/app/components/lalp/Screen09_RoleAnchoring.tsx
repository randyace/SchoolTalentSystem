import React, { useState, useEffect } from "react";
import {
  Users, Edit3, MessageSquare, Eye, AlertTriangle, ChevronDown, Search,
  Bell, Lock, FileText, Clock, CheckCircle2, X, Shield, Zap, Info,
  Timer,
} from "lucide-react";
import {
  DS, Card, Btn, SectionHeader, StatusBadge, FloatingBatchActionBar, StatCard,
} from "./DesignSystem";
import { ERP } from "../erp/erpTokens";

/* ─── Props ──────────────────────────────────────────────────────────────── */
export interface Screen09Props {
  lang?: "en" | "zh-HK";
}

/* ─── Types ──────────────────────────────────────────────────────────────── */
type RoleType = "Leader" | "Facilitator" | "Researcher" | "Presenter" | "Recorder" | "Support";
type AcceptanceStatus = "active" | "pending" | "warning";
type SubmissionStatus = "synced" | "pending" | "absent";

interface Student {
  id: number;
  name: string;
  nameZh: string;
  cls: string;
  group: string;
  groupProject: string;
  role: RoleType;
  roleAccepted: AcceptanceStatus;
  submissionStatus: SubmissionStatus;
}

/* ─── i18n ───────────────────────────────────────────────────────────────── */
const EN = {
  title: "PBL Role Anchoring System",
  subtitle: "增值模組 B: 角色定錨 · Assign roles within project-based learning groups to prevent duplicate submissions",
  pendingBanner: "3 students pending role confirmation",
  pendingMsg: "Please ask students to confirm their assigned roles before the submission deadline.",
  headers: ["Student", "Class", "Group", "Assigned Role", "Role Accepted", "Submission Status", "Actions"] as string[],
  roleLabels: { Leader: "Leader", Facilitator: "Facilitator", Researcher: "Researcher", Presenter: "Presenter", Recorder: "Recorder", Support: "Support" } as Record<RoleType, string>,
  accepted: "Accepted", pending: "Pending", declined: "Declined",
  submitted: "Submitted", draft: "Draft", notStarted: "Not Started",
  allClasses: "All Classes", allGroups: "All Groups",
  groupLabel: (g: string) => `Group ${g}`,
  conflictLabel: "Duplicate Role Detection:",
  conflictMsg: (groups: string[]) => `${groups.length} group${groups.length > 1 ? "s" : ""} have duplicate 'Leader' assignments (${groups.map((g) => `Group ${g}`).join(", ")}). Click to resolve.`,
  resolveBtn: "Resolve Conflicts",
  stats: { total: "Total Students", assigned: "Roles Assigned", conflicts: "Conflicts Detected", complete: "Submissions Complete" },
  batchCount: (n: number) => `${n} selected`,
  batchActions: ["Bulk Assign Role", "Send Role Confirmation", "Export Group List"] as string[],
  clearLabel: "Clear",
  membersLabel: (n: number) => `${n} members`,
  studentsShown: (n: number) => `${n} students shown`,
  searchPlaceholder: "Search student name...",
};

const ZH = {
  title: "PBL 分組協作角色定錨系統",
  subtitle: "增值模組 B: PBL 分組協作角色定錨 · 於跨學科實作 (PBL) 小組內分配協作崗位，避免重複提報",
  pendingBanner: "3 名學生待確認崗位",
  pendingMsg: "請提醒學生於提報死線前確認其協作崗位。",
  headers: ["學生姓名", "班別", "組別", "指派崗位", "崗位確認狀態", "成果提報狀態", "操作"] as string[],
  roleLabels: { Leader: "組長 (T3)", Facilitator: "支援 (T2)", Researcher: "支援 (T2)", Presenter: "成員 (T1)", Recorder: "成員 (T1)", Support: "支援 (T2)" } as Record<RoleType, string>,
  accepted: "已確認", pending: "待確認", declined: "已拒絕",
  submitted: "已提報", draft: "草稿", notStarted: "未開始",
  allClasses: "所有班別", allGroups: "所有組別",
  groupLabel: (g: string) => `${g} 組`,
  conflictLabel: "崗位重複偵測：",
  conflictMsg: (groups: string[]) => `${groups.length} 個組別出現重複的「組長」指派，請即時處理。`,
  resolveBtn: "解決衝突",
  stats: { total: "學生總數", assigned: "已指派崗位", conflicts: "偵測到衝突", complete: "已完成提報" },
  batchCount: (n: number) => `已選取 ${n} 項`,
  batchActions: ["批量指派崗位", "發送崗位確認通知", "匯出小組名單"] as string[],
  clearLabel: "清除",
  membersLabel: (n: number) => `${n} 名成員`,
  studentsShown: (n: number) => `顯示 ${n} 名學生`,
  searchPlaceholder: "搜尋學生姓名…",
};

/* ─── Data ───────────────────────────────────────────────────────────────── */
const STUDENTS: Student[] = [
  { id: 1,  name: "Chan Siu Ming",   nameZh: "陳小明", cls: "1A", group: "A", groupProject: "Climate Change Study",   role: "Leader",      roleAccepted: "active",  submissionStatus: "synced"  },
  { id: 2,  name: "Lam Wai Kei",     nameZh: "林慧琪", cls: "1A", group: "A", groupProject: "Climate Change Study",   role: "Researcher",  roleAccepted: "active",  submissionStatus: "synced"  },
  { id: 3,  name: "Wong Ka Yan",     nameZh: "王嘉欣", cls: "1B", group: "A", groupProject: "Climate Change Study",   role: "Presenter",   roleAccepted: "pending", submissionStatus: "pending" },
  { id: 4,  name: "Ho Tsz Kwan",     nameZh: "何芷君", cls: "1B", group: "A", groupProject: "Climate Change Study",   role: "Recorder",    roleAccepted: "active",  submissionStatus: "synced"  },
  { id: 5,  name: "Ng Hin Yat",      nameZh: "吳顯逸", cls: "2A", group: "B", groupProject: "Biodiversity Survey",    role: "Leader",      roleAccepted: "active",  submissionStatus: "synced"  },
  { id: 6,  name: "Cheung Pui Man",  nameZh: "張佩雯", cls: "2A", group: "B", groupProject: "Biodiversity Survey",    role: "Facilitator", roleAccepted: "pending", submissionStatus: "pending" },
  { id: 7,  name: "Yip Chun Hong",   nameZh: "葉俊康", cls: "2B", group: "B", groupProject: "Biodiversity Survey",    role: "Leader",      roleAccepted: "warning", submissionStatus: "absent"  },
  { id: 8,  name: "Liu Mei Ling",    nameZh: "廖美玲", cls: "2B", group: "B", groupProject: "Biodiversity Survey",    role: "Recorder",    roleAccepted: "active",  submissionStatus: "pending" },
  { id: 9,  name: "Fung Chin Ho",    nameZh: "馮展豪", cls: "2C", group: "C", groupProject: "Water Quality Analysis", role: "Leader",      roleAccepted: "active",  submissionStatus: "synced"  },
  { id: 10, name: "Tang Sui Ying",   nameZh: "鄧穗盈", cls: "2C", group: "C", groupProject: "Water Quality Analysis", role: "Researcher",  roleAccepted: "active",  submissionStatus: "synced"  },
  { id: 11, name: "Kwok Hoi Tung",   nameZh: "郭凱童", cls: "2D", group: "C", groupProject: "Water Quality Analysis", role: "Support",     roleAccepted: "pending", submissionStatus: "absent"  },
  { id: 12, name: "Ma Sze Wai",      nameZh: "馬思慧", cls: "2E", group: "C", groupProject: "Water Quality Analysis", role: "Presenter",   roleAccepted: "active",  submissionStatus: "synced"  },
];

const ROLE_OPTIONS: RoleType[] = ["Leader", "Facilitator", "Researcher", "Presenter", "Recorder", "Support"];
const ROLE_COLORS: Record<RoleType, string> = {
  Leader: "#7C3AED", Facilitator: DS.colors.primary, Researcher: "#0891B2",
  Presenter: DS.colors.secondary, Recorder: DS.colors.warning, Support: DS.colors.textSecondary,
};

/* ─── Group Separator ─────────────────────────────────────────────────────── */
const GroupSeparatorRow: React.FC<{
  group: string; project: string; count: number;
  membersLabel: (n: number) => string;
  groupLabel: (g: string) => string;
}> = ({ group, project, count, membersLabel, groupLabel }) => (
  <tr>
    <td colSpan={8} style={{ padding: "8px 16px", background: "#F3F4F6" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <Users size={14} color={DS.colors.textSecondary} />
        <span style={{ fontSize: "13px", fontWeight: 700, color: DS.colors.textPrimary }}>{groupLabel(group)}</span>
        <span style={{ fontSize: "12px", color: DS.colors.textSecondary }}>{project}</span>
        <span style={{ marginLeft: "auto", fontSize: "11px", color: DS.colors.textMuted, background: DS.colors.surface, padding: "2px 8px", borderRadius: DS.radius.full, border: `1px solid ${DS.colors.border}` }}>
          {membersLabel(count)}
        </span>
      </div>
    </td>
  </tr>
);

/* ─── Drawer: Section divider ────────────────────────────────────────────── */
const DSection: React.FC<{
  icon: React.ReactNode; label: string; sub?: string; children: React.ReactNode;
}> = ({ icon, label, sub, children }) => (
  <div style={{ marginBottom: "22px" }}>
    <div style={{
      display: "flex", alignItems: "center", gap: "8px",
      paddingBottom: "8px", marginBottom: "14px",
      borderBottom: `1px solid ${ERP.colors.border}`,
    }}>
      <div style={{
        width: "22px", height: "22px", borderRadius: ERP.radius.sm,
        background: ERP.colors.accentPale,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>{icon}</div>
      <span style={{ fontSize: "11px", fontWeight: 800, color: ERP.colors.textPrimary, letterSpacing: "0.05em", textTransform: "uppercase" }}>
        {label}
      </span>
      {sub && <span style={{ fontSize: "10px", color: ERP.colors.textMuted }}>{sub}</span>}
    </div>
    {children}
  </div>
);

/* ─── Drawer: Timeline step ──────────────────────────────────────────────── */
type TimelineState = "done" | "pending";
const TimelineStep: React.FC<{
  state: TimelineState;
  label: string;
  sub: string;
  ts?: string;
  last?: boolean;
}> = ({ state, label, sub, ts, last }) => {
  const isDone = state === "done";
  return (
    <div style={{ display: "flex", gap: "12px", position: "relative" }}>
      {/* Connector line */}
      {!last && (
        <div style={{
          position: "absolute", left: "11px", top: "24px",
          width: "2px", height: "calc(100% + 4px)",
          background: isDone ? ERP.colors.green + "50" : ERP.colors.border,
        }} />
      )}
      {/* Icon */}
      <div style={{
        width: "24px", height: "24px", borderRadius: "50%", flexShrink: 0,
        background: isDone ? ERP.colors.greenLight : ERP.colors.amberLight,
        border: `2px solid ${isDone ? ERP.colors.green : ERP.colors.amber}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1,
      }}>
        {isDone
          ? <CheckCircle2 size={12} color={ERP.colors.green} />
          : <Timer size={11} color={ERP.colors.amber} />
        }
      </div>
      {/* Content */}
      <div style={{ paddingBottom: last ? 0 : "16px", minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: "12px", fontWeight: 700, color: isDone ? ERP.colors.textPrimary : ERP.colors.amber }}>
          {label}
        </div>
        <div style={{ fontSize: "11px", color: ERP.colors.textSecondary, marginTop: "2px" }}>{sub}</div>
        {ts && (
          <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
            <Clock size={9} color={ERP.colors.textMuted} />
            <span style={{ fontSize: "10px", color: ERP.colors.textMuted, fontFamily: ERP.font.mono }}>{ts}</span>
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── Main Component ─────────────────────────────────────────────────────── */
export const Screen09_RoleAnchoring: React.FC<Screen09Props> = ({ lang = "en" }) => {
  const t = lang === "zh-HK" ? ZH : EN;
  const [students, setStudents] = useState<Student[]>(STUDENTS);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set([3, 7, 11]));
  const [classFilter, setClassFilter]   = useState("all");
  const [groupFilter, setGroupFilter]   = useState("all");
  const [searchQuery, setSearchQuery]   = useState("");
  const [hoveredRow, setHoveredRow]     = useState<number | null>(null);
  const [hoveredBtn, setHoveredBtn]     = useState<string | null>(null);
  const [isMobile, setIsMobile]         = useState(false);
  // Drawer: default open on student 3 to show the active edit state
  const [drawerStudentId, setDrawerStudentId] = useState<number | null>(3);
  const [pdpoMasked, setPdpoMasked]           = useState(false);
  const [reminderSent, setReminderSent]       = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const updateRole = (id: number, role: RoleType) =>
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, role } : s)));

  const toggleRow = (id: number) =>
    setSelectedRows((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const toggleAll = () => {
    if (selectedRows.size === students.length) setSelectedRows(new Set());
    else setSelectedRows(new Set(students.map((s) => s.id)));
  };

  const filteredStudents = students.filter((s) => {
    if (classFilter !== "all" && s.cls !== classFilter) return false;
    if (groupFilter !== "all" && s.group !== groupFilter) return false;
    if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase()) && !s.nameZh.includes(searchQuery)) return false;
    return true;
  });

  const groupLeaderCount: Record<string, number> = {};
  students.forEach((s) => { if (s.role === "Leader") groupLeaderCount[s.group] = (groupLeaderCount[s.group] || 0) + 1; });
  const conflictGroups = Object.entries(groupLeaderCount).filter(([, c]) => c > 1);

  const rolesAssigned     = students.filter((s) => s.role !== "Support").length;
  const submissionsComplete = students.filter((s) => s.submissionStatus === "synced").length;
  const groups = ["A", "B", "C"];

  const drawerStudent = drawerStudentId !== null ? students.find((s) => s.id === drawerStudentId) ?? null : null;
  const drawerOpen = drawerStudent !== null;
  const displayName = pdpoMasked ? "Student #WKY-1029 🛡️" : "王嘉欣";

  return (
    <div style={{
      position: "relative", fontFamily: DS.font.family,
      height: isMobile ? "auto" : "100%",
      minHeight: isMobile ? "100%" : undefined,
      overflow: isMobile ? "visible" : "hidden",
    }}>

      {/* ── Main content — dims when drawer is open ─────────────────────── */}
      <div style={{
        background: DS.colors.background,
        minHeight: "100%",
        padding: isMobile ? "16px" : "24px",
        paddingBottom: isMobile && selectedRows.size > 0 ? "160px" : undefined,
        transition: "opacity 0.25s, filter 0.25s",
        opacity:   drawerOpen ? 0.4 : 1,
        filter:    drawerOpen ? "blur(1.5px)" : "none",
        pointerEvents: drawerOpen ? "none" : "auto",
      }}>
        {/* Header */}
        <div style={{ marginBottom: "16px" }}>
          <SectionHeader title={t.title} subtitle={t.subtitle} />
        </div>

        {/* Pending banner */}
        <div style={{
          background: DS.colors.warningLight, border: `1px solid #FCD34D`,
          borderRadius: DS.radius.md, padding: "10px 16px", marginBottom: "20px",
          display: "flex", alignItems: "flex-start", gap: "10px", flexWrap: "wrap",
        }}>
          <AlertTriangle size={16} color={DS.colors.warning} style={{ flexShrink: 0, marginTop: "2px" }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: "14px", color: "#92400E", fontWeight: 600 }}>{t.pendingBanner}</span>
            {!isMobile && <span style={{ fontSize: "13px", color: "#A16207" }}>— {t.pendingMsg}</span>}
            {isMobile && <div style={{ fontSize: "12px", color: "#A16207", marginTop: "2px" }}>{t.pendingMsg}</div>}
          </div>
        </div>

        {/* Filter Bar */}
        <Card style={{ padding: "14px 20px", marginBottom: "20px" }}>
          {isMobile ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {/* Search row */}
              <div style={{ position: "relative" }}>
                <Search size={14} color={DS.colors.textMuted} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }} />
                <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t.searchPlaceholder} style={{ width: "100%", paddingLeft: "32px", paddingRight: "12px", paddingTop: "8px", paddingBottom: "8px", border: `1px solid ${DS.colors.border}`, borderRadius: DS.radius.md, fontSize: "13px", fontFamily: DS.font.family, outline: "none", color: DS.colors.textPrimary, boxSizing: "border-box" }} />
              </div>
              {/* Selects row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div style={{ position: "relative" }}>
                  <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} style={{ width: "100%", padding: "8px 28px 8px 10px", border: `1px solid ${DS.colors.border}`, borderRadius: DS.radius.md, fontSize: "13px", fontFamily: DS.font.family, color: DS.colors.textPrimary, background: DS.colors.surface, outline: "none", appearance: "none", cursor: "pointer" }}>
                    <option value="all">{t.allClasses}</option>
                    {["1A","1B","2A","2B","2C","2D","2E"].map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown size={13} color={DS.colors.textMuted} style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                </div>
                <div style={{ position: "relative" }}>
                  <select value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)} style={{ width: "100%", padding: "8px 28px 8px 10px", border: `1px solid ${DS.colors.border}`, borderRadius: DS.radius.md, fontSize: "13px", fontFamily: DS.font.family, color: DS.colors.textPrimary, background: DS.colors.surface, outline: "none", appearance: "none", cursor: "pointer" }}>
                    <option value="all">{t.allGroups}</option>
                    {["A","B","C","D","E"].map((g) => <option key={g} value={g}>{t.groupLabel(g)}</option>)}
                  </select>
                  <ChevronDown size={13} color={DS.colors.textMuted} style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                </div>
              </div>
              <span style={{ fontSize: "12px", color: DS.colors.textMuted }}>{t.studentsShown(filteredStudents.length)}</span>
            </div>
          ) : (
            <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
              {/* Class filter */}
              <div style={{ position: "relative", flex: "0 0 180px" }}>
                <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} style={{ width: "100%", padding: "8px 28px 8px 10px", border: `1px solid ${DS.colors.border}`, borderRadius: DS.radius.md, fontSize: "13px", fontFamily: DS.font.family, color: DS.colors.textPrimary, background: DS.colors.surface, outline: "none", appearance: "none", cursor: "pointer" }}>
                  <option value="all">{t.allClasses}</option>
                  {["1A","1B","2A","2B","2C","2D","2E"].map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown size={13} color={DS.colors.textMuted} style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              </div>
              {/* Group filter */}
              <div style={{ position: "relative", flex: "0 0 160px" }}>
                <select value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)} style={{ width: "100%", padding: "8px 28px 8px 10px", border: `1px solid ${DS.colors.border}`, borderRadius: DS.radius.md, fontSize: "13px", fontFamily: DS.font.family, color: DS.colors.textPrimary, background: DS.colors.surface, outline: "none", appearance: "none", cursor: "pointer" }}>
                  <option value="all">{t.allGroups}</option>
                  {["A","B","C","D","E"].map((g) => <option key={g} value={g}>{t.groupLabel(g)}</option>)}
                </select>
                <ChevronDown size={13} color={DS.colors.textMuted} style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              </div>
              {/* Search */}
              <div style={{ position: "relative", flex: "1 1 180px" }}>
                <Search size={14} color={DS.colors.textMuted} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }} />
                <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t.searchPlaceholder} style={{ width: "100%", paddingLeft: "32px", paddingRight: "12px", paddingTop: "8px", paddingBottom: "8px", border: `1px solid ${DS.colors.border}`, borderRadius: DS.radius.md, fontSize: "13px", fontFamily: DS.font.family, outline: "none", color: DS.colors.textPrimary, boxSizing: "border-box" }} />
              </div>
              <span style={{ fontSize: "13px", color: DS.colors.textMuted, marginLeft: "auto" }}>
                {t.studentsShown(filteredStudents.length)}
              </span>
            </div>
          )}
        </Card>

        {/* Main Table / Card List */}
        {isMobile ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
            {groups.map((group) => {
              const groupStudents = filteredStudents.filter((s) => s.group === group);
              if (groupStudents.length === 0) return null;
              const firstStudent = STUDENTS.find((s) => s.group === group);
              return (
                <div key={group}>
                  {/* Group header */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 4px", marginBottom: "8px" }}>
                    <Users size={13} color={DS.colors.textSecondary} />
                    <span style={{ fontSize: "13px", fontWeight: 700, color: DS.colors.textPrimary }}>{t.groupLabel(group)}</span>
                    <span style={{ fontSize: "12px", color: DS.colors.textSecondary }}>{firstStudent?.groupProject}</span>
                    <span style={{ marginLeft: "auto", fontSize: "11px", color: DS.colors.textMuted, background: DS.colors.surface, padding: "2px 8px", borderRadius: DS.radius.full, border: `1px solid ${DS.colors.border}` }}>
                      {t.membersLabel(STUDENTS.filter((s) => s.group === group).length)}
                    </span>
                  </div>
                  {groupStudents.map((student) => {
                    const isSelected = selectedRows.has(student.id);
                    const isDrawerOpen = drawerStudentId === student.id;
                    return (
                      <Card key={student.id} style={{
                        marginBottom: "8px", padding: "12px 14px",
                        border: isDrawerOpen ? `2px solid ${ERP.colors.accent}` : isSelected ? `1.5px solid ${DS.colors.primary}` : undefined,
                        background: isDrawerOpen ? ERP.colors.accentPale : isSelected ? DS.colors.primaryLight : DS.colors.surface,
                      }}>
                        {/* Row 1: checkbox + name + class + group badges + action */}
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                          <input type="checkbox" checked={isSelected} onChange={() => toggleRow(student.id)} style={{ cursor: "pointer", accentColor: DS.colors.primary, flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ fontSize: "14px", fontWeight: 600, color: DS.colors.textPrimary }}>
                              {lang === "zh-HK" ? student.nameZh : student.name}
                            </span>
                            <span style={{ fontSize: "12px", color: DS.colors.textSecondary, marginLeft: "6px" }}>
                              {lang === "zh-HK" ? student.name : student.nameZh}
                            </span>
                          </div>
                          <span style={{ fontSize: "12px", fontWeight: 600, color: DS.colors.textSecondary, background: DS.colors.background, padding: "2px 7px", borderRadius: DS.radius.sm, border: `1px solid ${DS.colors.border}`, flexShrink: 0 }}>
                            {student.cls}
                          </span>
                          <span style={{ fontSize: "12px", fontWeight: 700, color: DS.colors.primary, background: DS.colors.primaryLight, padding: "2px 8px", borderRadius: DS.radius.full, flexShrink: 0 }}>
                            {t.groupLabel(student.group)}
                          </span>
                        </div>
                        {/* Row 2: role selector */}
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                          <span style={{ fontSize: "12px", color: DS.colors.textSecondary, flexShrink: 0 }}>
                            {lang === "zh-HK" ? "崗位：" : "Role:"}
                          </span>
                          <div style={{ position: "relative", flex: 1 }}>
                            <select value={student.role} onChange={(e) => updateRole(student.id, e.target.value as RoleType)} style={{ width: "100%", padding: "6px 28px 6px 10px", border: `1.5px solid ${ROLE_COLORS[student.role]}40`, borderRadius: DS.radius.md, fontSize: "13px", fontFamily: DS.font.family, fontWeight: 600, color: ROLE_COLORS[student.role], background: `${ROLE_COLORS[student.role]}12`, outline: "none", appearance: "none", cursor: "pointer" }}>
                              {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{t.roleLabels[r]}</option>)}
                            </select>
                            <ChevronDown size={12} color={ROLE_COLORS[student.role]} style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                          </div>
                        </div>
                        {/* Row 3: status badges + actions */}
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          <StatusBadge
                            variant={student.roleAccepted}
                            label={student.roleAccepted === "active" ? t.accepted : student.roleAccepted === "pending" ? t.pending : t.declined}
                            size="sm"
                          />
                          <StatusBadge
                            variant={student.submissionStatus}
                            label={student.submissionStatus === "synced" ? t.submitted : student.submissionStatus === "pending" ? t.draft : t.notStarted}
                            size="sm"
                          />
                          <div style={{ marginLeft: "auto", display: "flex", gap: "6px" }}>
                            {[
                              { key: "edit", icon: <Edit3 size={13} />, title: "Edit", action: () => setDrawerStudentId(student.id) },
                              { key: "msg",  icon: <MessageSquare size={13} />, title: "Message", action: () => {} },
                              { key: "view", icon: <Eye size={13} />, title: "View", action: () => {} },
                            ].map(({ key, icon, title, action }) => (
                              <button
                                key={key}
                                title={title}
                                onClick={action}
                                style={{
                                  width: "32px", height: "32px",
                                  background: key === "edit" && isDrawerOpen ? ERP.colors.accentPale : DS.colors.background,
                                  border: `1px solid ${key === "edit" && isDrawerOpen ? ERP.colors.accent : DS.colors.border}`,
                                  borderRadius: DS.radius.sm, cursor: "pointer",
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  color: key === "edit" && isDrawerOpen ? ERP.colors.accent : DS.colors.textSecondary,
                                }}
                              >
                                {icon}
                              </button>
                            ))}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ) : (
          <Card style={{ overflow: "hidden", marginBottom: "20px" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: DS.font.family }}>
                <thead>
                  <tr style={{ background: DS.colors.background, borderBottom: `2px solid ${DS.colors.border}` }}>
                    <th style={{ padding: "10px 16px", textAlign: "left", width: "40px" }}>
                      <input type="checkbox" checked={selectedRows.size === students.length} onChange={toggleAll} style={{ cursor: "pointer", accentColor: DS.colors.primary }} />
                    </th>
                    {t.headers.map((col) => (
                      <th key={col} style={{ padding: "10px 12px", textAlign: "left", fontSize: "12px", fontWeight: 700, color: DS.colors.textSecondary, letterSpacing: "0.04em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {groups.map((group) => {
                    const groupStudents = filteredStudents.filter((s) => s.group === group);
                    if (groupStudents.length === 0) return null;
                    const firstStudent = STUDENTS.find((s) => s.group === group);
                    return (
                      <React.Fragment key={group}>
                        <GroupSeparatorRow
                          group={group} project={firstStudent?.groupProject ?? ""}
                          count={STUDENTS.filter((s) => s.group === group).length}
                          membersLabel={t.membersLabel} groupLabel={t.groupLabel}
                        />
                        {groupStudents.map((student) => {
                          const isSelected = selectedRows.has(student.id);
                          const isHovered  = hoveredRow === student.id;
                          const isDrawerOpen = drawerStudentId === student.id;
                          return (
                            <tr
                              key={student.id}
                              onMouseEnter={() => setHoveredRow(student.id)}
                              onMouseLeave={() => setHoveredRow(null)}
                              style={{
                                background: isDrawerOpen
                                  ? ERP.colors.accentPale
                                  : isSelected ? DS.colors.primaryLight
                                  : isHovered ? "#F8FAFF" : DS.colors.surface,
                                borderBottom: `1px solid ${DS.colors.border}`,
                                cursor: "pointer",
                                transition: "background 0.1s",
                                outline: isDrawerOpen ? `2px solid ${ERP.colors.accent}` : "none",
                                outlineOffset: "-1px",
                              }}
                            >
                              <td style={{ padding: "10px 16px" }}>
                                <input type="checkbox" checked={isSelected} onChange={() => toggleRow(student.id)} style={{ cursor: "pointer", accentColor: DS.colors.primary }} />
                              </td>
                              {/* Student Name */}
                              <td style={{ padding: "10px 12px" }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                  <span style={{ fontSize: "14px", fontWeight: 600, color: DS.colors.textPrimary }}>
                                    {lang === "zh-HK" ? student.nameZh : student.name}
                                  </span>
                                  <span style={{ fontSize: "12px", color: DS.colors.textSecondary }}>
                                    {lang === "zh-HK" ? student.name : student.nameZh}
                                  </span>
                                </div>
                              </td>
                              {/* Class */}
                              <td style={{ padding: "10px 12px" }}>
                                <span style={{ fontSize: "13px", fontWeight: 600, color: DS.colors.textSecondary, background: DS.colors.background, padding: "3px 8px", borderRadius: DS.radius.sm, border: `1px solid ${DS.colors.border}` }}>
                                  {student.cls}
                                </span>
                              </td>
                              {/* Group */}
                              <td style={{ padding: "10px 12px" }}>
                                <span style={{ fontSize: "13px", fontWeight: 700, color: DS.colors.primary, background: DS.colors.primaryLight, padding: "3px 10px", borderRadius: DS.radius.full }}>
                                  {t.groupLabel(student.group)}
                                </span>
                              </td>
                              {/* Assigned Role */}
                              <td style={{ padding: "10px 12px" }}>
                                <div style={{ position: "relative", display: "inline-block" }}>
                                  <select value={student.role} onChange={(e) => updateRole(student.id, e.target.value as RoleType)} style={{ padding: "5px 24px 5px 10px", border: `1.5px solid ${ROLE_COLORS[student.role]}40`, borderRadius: DS.radius.md, fontSize: "13px", fontFamily: DS.font.family, fontWeight: 600, color: ROLE_COLORS[student.role], background: `${ROLE_COLORS[student.role]}12`, outline: "none", appearance: "none", cursor: "pointer" }}>
                                    {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{t.roleLabels[r]}</option>)}
                                  </select>
                                  <ChevronDown size={12} color={ROLE_COLORS[student.role]} style={{ position: "absolute", right: "6px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                                </div>
                              </td>
                              {/* Role Accepted */}
                              <td style={{ padding: "10px 12px" }}>
                                <StatusBadge
                                  variant={student.roleAccepted}
                                  label={student.roleAccepted === "active" ? t.accepted : student.roleAccepted === "pending" ? t.pending : t.declined}
                                  size="sm"
                                />
                              </td>
                              {/* Submission Status */}
                              <td style={{ padding: "10px 12px" }}>
                                <StatusBadge
                                  variant={student.submissionStatus}
                                  label={student.submissionStatus === "synced" ? t.submitted : student.submissionStatus === "pending" ? t.draft : t.notStarted}
                                  size="sm"
                                />
                              </td>
                              {/* Actions */}
                              <td style={{ padding: "10px 12px" }}>
                                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                  {[
                                    { key: "edit", icon: <Edit3 size={13} />, title: "Edit", action: () => setDrawerStudentId(student.id) },
                                    { key: "msg",  icon: <MessageSquare size={13} />, title: "Message", action: () => {} },
                                    { key: "view", icon: <Eye size={13} />, title: "View", action: () => {} },
                                  ].map(({ key, icon, title, action }) => {
                                    const btnKey = `${key}-${student.id}`;
                                    const hov = hoveredBtn === btnKey;
                                    const isEditActive = key === "edit" && isDrawerOpen;
                                    return (
                                      <button
                                        key={key}
                                        title={title}
                                        onClick={action}
                                        onMouseEnter={() => setHoveredBtn(btnKey)}
                                        onMouseLeave={() => setHoveredBtn(null)}
                                        style={{
                                          width: "28px", height: "28px",
                                          background: isEditActive ? ERP.colors.accentPale : hov ? DS.colors.surface : "transparent",
                                          border: `1px solid ${isEditActive ? ERP.colors.accent : hov ? DS.colors.border : "transparent"}`,
                                          borderRadius: DS.radius.sm,
                                          cursor: "pointer",
                                          display: "flex", alignItems: "center", justifyContent: "center",
                                          color: isEditActive ? ERP.colors.accent : DS.colors.textSecondary,
                                          transition: "all 0.1s",
                                        }}
                                      >
                                        {icon}
                                      </button>
                                    );
                                  })}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Duplicate Role Detection Warning */}
        {conflictGroups.length > 0 && (
          <div style={{ background: DS.colors.warningLight, border: `1px solid #FCD34D`, borderRadius: DS.radius.md, padding: "12px 18px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "12px" }}>
            <AlertTriangle size={18} color={DS.colors.warning} />
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "#92400E" }}>{t.conflictLabel}</span>
              <span style={{ fontSize: "14px", color: "#A16207", marginLeft: "8px" }}>{t.conflictMsg(conflictGroups.map(([g]) => g))}</span>
            </div>
            <Btn variant="ghost" size="sm" style={{ border: `1px solid #FCD34D`, color: "#92400E" }}>{t.resolveBtn}</Btn>
          </div>
        )}

        {/* Stats Row */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: "16px", marginBottom: "80px" }}>
          <StatCard label={t.stats.total}     value={students.length}                          icon={<Users size={18} color={DS.colors.primary} />}           color={DS.colors.primary} />
          <StatCard label={t.stats.assigned}  value={`${rolesAssigned}/${students.length}`}   icon={<Users size={18} color={DS.colors.secondary} />}          color={DS.colors.secondary} />
          <StatCard label={t.stats.conflicts} value={conflictGroups.length}                   icon={<AlertTriangle size={18} color={DS.colors.warning} />}    color={conflictGroups.length > 0 ? DS.colors.warning : DS.colors.secondary} />
          <StatCard label={t.stats.complete}  value={`${submissionsComplete}/${students.length}`} icon={<Eye size={18} color="#7C3AED" />}                    color="#7C3AED" />
        </div>

        {/* Floating Batch Action Bar */}
        <FloatingBatchActionBar
          selectedCount={selectedRows.size}
          onClear={() => setSelectedRows(new Set())}
          countLabel={lang === "zh-HK" ? t.batchCount(selectedRows.size) : undefined}
          clearLabel={lang === "zh-HK" ? t.clearLabel : undefined}
          actions={t.batchActions.map((label, i) => ({
            label, icon: [<Users size={14} />, <MessageSquare size={14} />, <Eye size={14} />][i],
            onClick: () => {}, variant: (i === 0 ? "primary" : "secondary") as "primary" | "secondary",
          }))}
        />
      </div>

      {/* ── Dim overlay (click-to-close) ──────────────────────────────────── */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerStudentId(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.40)", zIndex: 490, cursor: "pointer" }}
        />
      )}

      {/* ── Right Slide-out Drawer ─────────────────────────────────────────── */}
      <div style={{
        position: "fixed", top: 0,
        right: 0,
        left: isMobile ? 0 : "auto",
        width:  isMobile ? (drawerOpen ? "100%" : 0) : (drawerOpen ? "min(540px, 44vw)" : 0),
        height: "100vh",
        background: ERP.colors.surface,
        borderLeft: isMobile ? "none" : `1px solid ${ERP.colors.border}`,
        borderTop: isMobile ? `1px solid ${ERP.colors.border}` : "none",
        boxShadow: drawerOpen ? ERP.shadow.xl : "none",
        overflow: "hidden",
        transition: "width 0.28s cubic-bezier(0.4,0,0.2,1)",
        zIndex: 500,
        display: "flex", flexDirection: "column",
        fontFamily: ERP.font.family,
      }}>
        {drawerOpen && drawerStudent && (
          <>
            {/* ── Drawer Header ─────────────────────────────────────────── */}
            <div style={{
              padding: "0 20px",
              height: "68px", flexShrink: 0,
              borderBottom: `1px solid ${ERP.colors.border}`,
              display: "flex", alignItems: "center", gap: "12px",
              background: ERP.colors.surface,
            }}>
              {/* Module badge */}
              <div style={{
                width: "36px", height: "36px", borderRadius: ERP.radius.md, flexShrink: 0,
                background: "linear-gradient(135deg, #7C3AED, #2563EB)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Users size={16} color="#fff" />
              </div>
              {/* Titles */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "10px", fontWeight: 700, color: ERP.colors.textMuted, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: "2px" }}>
                  增值模組 B · 角色定錨
                </div>
                <div style={{ fontSize: "15px", fontWeight: 800, color: ERP.colors.textPrimary }}>
                  協作崗位詳情
                </div>
              </div>
              {/* PDPO toggle */}
              <button
                onClick={() => setPdpoMasked(m => !m)}
                title={pdpoMasked ? "顯示真實姓名" : "PDPO 脫敏"}
                style={{
                  display: "flex", alignItems: "center", gap: "4px",
                  padding: "4px 8px",
                  border: `1px solid ${pdpoMasked ? ERP.colors.purple : ERP.colors.border}`,
                  borderRadius: ERP.radius.full,
                  background: pdpoMasked ? ERP.colors.purpleLight : "transparent",
                  color: pdpoMasked ? ERP.colors.purple : ERP.colors.textMuted,
                  cursor: "pointer", fontSize: "10px", fontWeight: 700,
                  fontFamily: ERP.font.family, whiteSpace: "nowrap",
                  transition: "all 0.15s",
                }}
              >
                <Shield size={11} />
                PDPO
              </button>
              {/* Close */}
              <button
                onClick={() => setDrawerStudentId(null)}
                style={{
                  width: "28px", height: "28px", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: `1px solid ${ERP.colors.border}`, borderRadius: ERP.radius.md,
                  background: "transparent", color: ERP.colors.textMuted, cursor: "pointer",
                }}
              >
                <X size={14} />
              </button>
            </div>

            {/* ── Student identity card ─────────────────────────────────── */}
            <div style={{
              padding: "14px 20px",
              background: ERP.colors.accentPale,
              borderBottom: `1px solid ${ERP.colors.accentLight}`,
              display: "flex", alignItems: "center", gap: "12px", flexShrink: 0,
            }}>
              {/* Avatar */}
              <div style={{
                width: "40px", height: "40px", borderRadius: "50%", flexShrink: 0,
                background: "linear-gradient(135deg, #7C3AED, #2563EB)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "14px", fontWeight: 800, color: "#fff",
              }}>
                {pdpoMasked ? "🛡️" : "王"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "15px", fontWeight: 700, color: ERP.colors.textPrimary }}>
                    {displayName}
                  </span>
                  {pdpoMasked && (
                    <span style={{
                      fontSize: "10px", fontWeight: 700, color: ERP.colors.purple,
                      background: ERP.colors.purpleLight, border: `1px solid ${ERP.colors.purple}30`,
                      borderRadius: ERP.radius.full, padding: "1px 7px",
                    }}>PDPO 已啟用</span>
                  )}
                </div>
                <div style={{ display: "flex", gap: "8px", marginTop: "3px", flexWrap: "wrap" }}>
                  {[
                    { label: drawerStudent.cls + " 班", bg: ERP.colors.pageBg, color: ERP.colors.textSecondary },
                    { label: `${t.groupLabel(drawerStudent.group)}`, bg: ERP.colors.accentLight, color: ERP.colors.accent },
                    { label: "Climate Change Study", bg: ERP.colors.pageBg, color: ERP.colors.textMuted },
                  ].map(({ label, bg, color }) => (
                    <span key={label} style={{
                      fontSize: "10px", fontWeight: 600, background: bg, color,
                      border: `1px solid ${ERP.colors.border}`, borderRadius: ERP.radius.full,
                      padding: "1px 7px",
                    }}>{label}</span>
                  ))}
                </div>
              </div>
              {/* Current role + status pills */}
              <div style={{ display: "flex", flexDirection: "column", gap: "5px", alignItems: "flex-end", flexShrink: 0 }}>
                <span style={{
                  fontSize: "11px", fontWeight: 700,
                  background: "#7C3AED15", color: "#7C3AED",
                  border: "1px solid #7C3AED40",
                  borderRadius: ERP.radius.full, padding: "3px 9px",
                }}>成員 (T1)</span>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: "4px",
                  fontSize: "11px", fontWeight: 700,
                  background: ERP.colors.amberLight, color: ERP.colors.amber,
                  border: `1px solid ${ERP.colors.amber}40`,
                  borderRadius: ERP.radius.full, padding: "3px 9px",
                }}>
                  <span>⚠️</span> 待確認
                </span>
              </div>
            </div>

            {/* ── Drawer body (scrollable) ──────────────────────────────── */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 0" }}>

              {/* Section 1: 崗位狀態與審計軌跡 */}
              <DSection
                icon={<Clock size={12} color={ERP.colors.accent} />}
                label="崗位狀態與審計軌跡"
                sub="Mod A"
              >
                {/* Current state strip */}
                <div style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  padding: "10px 12px",
                  background: ERP.colors.amberLight,
                  border: `1px solid ${ERP.colors.amber}40`,
                  borderRadius: ERP.radius.md,
                  marginBottom: "16px",
                }}>
                  <AlertTriangle size={14} color={ERP.colors.amber} />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: ERP.colors.amber }}>崗位指派尚未獲確認</span>
                    <span style={{ fontSize: "11px", color: "#A16207", marginLeft: "8px" }}>Role assignment pending student action</span>
                  </div>
                </div>

                {/* Vertical timeline */}
                <div style={{ paddingLeft: "4px" }}>
                  <TimelineStep
                    state="done"
                    label="系統分配 / 教師指派"
                    sub="Assigned by Tr. T. Chan · 成員 (T1) 崗位"
                    ts="2026-08-05  09:00 HKT"
                  />
                  <TimelineStep
                    state="done"
                    label="學生已讀取通知"
                    sub="Notification Read by Student · 系統記錄已讀"
                    ts="2026-08-06  10:15 HKT"
                  />
                  <TimelineStep
                    state="pending"
                    label="等待學生確認 (Pending Student Action)..."
                    sub="學生尚未在學生端確認其崗位角色"
                    last
                  />
                </div>
              </DSection>

              {/* Section 2: 預期能力加乘 */}
              <DSection
                icon={<Zap size={12} color={ERP.colors.accent} />}
                label="預期能力加乘"
                sub="Mod C · ACORN"
              >
                {/* Info box */}
                <div style={{
                  display: "flex", gap: "8px", alignItems: "flex-start",
                  padding: "10px 12px",
                  background: ERP.colors.accentPale,
                  border: `1px solid ${ERP.colors.accentLight}`,
                  borderRadius: ERP.radius.md,
                  marginBottom: "12px",
                }}>
                  <Info size={13} color={ERP.colors.accent} style={{ flexShrink: 0, marginTop: "1px" }} />
                  <span style={{ fontSize: "11px", color: ERP.colors.textSecondary, lineHeight: 1.5 }}>
                    若此崗位獲確認，該學生將獲得以下獎勵：
                  </span>
                </div>

                {/* Rewards row */}
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  {/* Points chip */}
                  <div style={{
                    display: "flex", alignItems: "center", gap: "8px",
                    padding: "10px 14px",
                    background: ERP.colors.greenLight,
                    border: `1px solid ${ERP.colors.green}40`,
                    borderRadius: ERP.radius.md, flex: 1,
                  }}>
                    <div style={{
                      width: "28px", height: "28px", borderRadius: ERP.radius.sm,
                      background: ERP.colors.green + "20",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Zap size={14} color={ERP.colors.green} />
                    </div>
                    <div>
                      <div style={{ fontSize: "18px", fontWeight: 800, color: ERP.colors.green, lineHeight: 1 }}>+10</div>
                      <div style={{ fontSize: "10px", color: ERP.colors.green + "CC", marginTop: "1px" }}>自主積點 (pts)</div>
                    </div>
                  </div>

                  {/* ACORN tag chip */}
                  <div style={{
                    display: "flex", alignItems: "center", gap: "8px",
                    padding: "10px 14px",
                    background: ERP.acornTags["協作"].bg,
                    border: `1px solid ${ERP.acornTags["協作"].border}`,
                    borderRadius: ERP.radius.md, flex: 1,
                  }}>
                    <div style={{
                      width: "28px", height: "28px", borderRadius: ERP.radius.sm,
                      background: ERP.acornTags["協作"].color + "20",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "13px",
                    }}>
                      🤝
                    </div>
                    <div>
                      <div style={{ fontSize: "12px", fontWeight: 800, color: ERP.acornTags["協作"].color }}>
                        協作 <span style={{ fontWeight: 500 }}>Collaborative</span>
                      </div>
                      <div style={{
                        display: "inline-flex", alignItems: "center",
                        fontSize: "11px", fontWeight: 700,
                        color: ERP.acornTags["協作"].color,
                        background: ERP.acornTags["協作"].color + "18",
                        border: `1px solid ${ERP.acornTags["協作"].border}`,
                        borderRadius: ERP.radius.full, padding: "1px 7px",
                        marginTop: "3px",
                      }}>+2 pts</div>
                    </div>
                  </div>
                </div>
              </DSection>

              {/* Section 3: 提報成果預覽 */}
              <DSection
                icon={<FileText size={12} color={ERP.colors.accent} />}
                label="提報成果預覽"
                sub="Artifact Preview"
              >
                <div style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  padding: "12px 14px",
                  background: ERP.colors.surface,
                  border: `1px solid ${ERP.colors.border}`,
                  borderRadius: ERP.radius.md,
                  boxShadow: ERP.shadow.xs,
                }}>
                  {/* PDF icon */}
                  <div style={{
                    width: "40px", height: "48px", borderRadius: ERP.radius.sm, flexShrink: 0,
                    background: "#FEE2E2", border: "1px solid #FECACA",
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    gap: "2px",
                  }}>
                    <FileText size={16} color="#DC2626" />
                    <span style={{ fontSize: "7px", fontWeight: 800, color: "#DC2626", letterSpacing: "0.04em" }}>PDF</span>
                  </div>
                  {/* File info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: "12px", fontWeight: 700, color: ERP.colors.textPrimary,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      Climate_Change_Draft_v1.pdf
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                      <span style={{
                        fontSize: "10px", fontWeight: 700,
                        background: ERP.colors.amberLight, color: ERP.colors.amber,
                        border: `1px solid ${ERP.colors.amber}40`,
                        borderRadius: ERP.radius.full, padding: "1px 7px",
                      }}>草稿 Draft</span>
                      <span style={{ fontSize: "10px", color: ERP.colors.textMuted }}>共享自 A 組</span>
                    </div>
                  </div>
                  {/* View button */}
                  <button style={{
                    padding: "5px 10px", flexShrink: 0,
                    border: `1px solid ${ERP.colors.border}`,
                    borderRadius: ERP.radius.sm,
                    background: "transparent", color: ERP.colors.textSecondary,
                    cursor: "pointer", fontSize: "11px", fontWeight: 600,
                    fontFamily: ERP.font.family,
                  }}>
                    預覽
                  </button>
                </div>
              </DSection>

              <div style={{ height: "12px" }} />
            </div>

            {/* ── Drawer Footer ─────────────────────────────────────────── */}
            <div style={{
              padding: "14px 20px",
              borderTop: `1px solid ${ERP.colors.border}`,
              background: ERP.colors.surface,
              flexShrink: 0,
            }}>
              {/* Action buttons */}
              <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                {/* Send Reminder */}
                <button
                  onClick={() => setReminderSent(true)}
                  style={{
                    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                    padding: "9px 0",
                    border: `1px solid ${reminderSent ? ERP.colors.green : ERP.colors.border}`,
                    borderRadius: ERP.radius.md,
                    background: reminderSent ? ERP.colors.greenLight : ERP.colors.surface,
                    color: reminderSent ? ERP.colors.green : ERP.colors.textSecondary,
                    cursor: "pointer", fontSize: "12px", fontWeight: 600,
                    fontFamily: ERP.font.family,
                    transition: "all 0.2s",
                  }}
                >
                  <Bell size={13} />
                  {reminderSent ? "提醒已發送 ✓" : "發送提醒"}
                </button>

                {/* Force Confirm */}
                <button
                  onClick={() => setDrawerStudentId(null)}
                  style={{
                    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                    padding: "9px 0",
                    border: "none",
                    borderRadius: ERP.radius.md,
                    background: "linear-gradient(135deg, #1E3A8A, #2563EB)",
                    color: "#fff",
                    cursor: "pointer", fontSize: "12px", fontWeight: 700,
                    fontFamily: ERP.font.family,
                    boxShadow: `0 2px 8px ${ERP.colors.accent}50`,
                  }}
                >
                  <Lock size={13} />
                  強制確認崗位
                </button>
              </div>

              {/* Sync timestamp */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "5px",
                padding: "6px 0",
                borderTop: `1px solid ${ERP.colors.divider}`,
              }}>
                <Clock size={10} color={ERP.colors.textMuted} />
                <span style={{ fontSize: "10px", color: ERP.colors.textMuted, fontFamily: ERP.font.mono }}>
                  最後同步時間 (Last Synced): 2026-08-07 19:55 HKT
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
