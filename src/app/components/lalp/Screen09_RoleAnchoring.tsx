import React, { useState } from "react";
import {
  Users, Edit3, MessageSquare, Eye, AlertTriangle, ChevronDown, Search,
} from "lucide-react";
import {
  DS, Card, Btn, SectionHeader, StatusBadge, FloatingBatchActionBar, StatCard,
} from "./DesignSystem";

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

/* ─── i18n Dictionaries ──────────────────────────────────────────────────── */
const EN = {
  title: "PBL Role Anchoring System",
  subtitle: "增值模組 B: 角色定錨 · Assign roles within project-based learning groups to prevent duplicate submissions",
  pendingBanner: "3 students pending role confirmation",
  pendingMsg: "Please ask students to confirm their assigned roles before the submission deadline.",
  headers: ["Student", "Class", "Group", "Assigned Role", "Role Accepted", "Submission Status", "Actions"] as string[],
  roleLabels: {
    Leader: "Leader", Facilitator: "Facilitator", Researcher: "Researcher",
    Presenter: "Presenter", Recorder: "Recorder", Support: "Support",
  } as Record<RoleType, string>,
  accepted: "Accepted", pending: "Pending", declined: "Declined",
  submitted: "Submitted", draft: "Draft", notStarted: "Not Started",
  allClasses: "All Classes", allGroups: "All Groups",
  groupLabel: (g: string) => `Group ${g}`,
  conflictLabel: "Duplicate Role Detection:",
  conflictMsg: (groups: string[]) =>
    `${groups.length} group${groups.length > 1 ? "s" : ""} have duplicate 'Leader' assignments (${groups.map((g) => `Group ${g}`).join(", ")}). Click to resolve.`,
  resolveBtn: "Resolve Conflicts",
  stats: {
    total: "Total Students", assigned: "Roles Assigned",
    conflicts: "Conflicts Detected", complete: "Submissions Complete",
  },
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
  roleLabels: {
    Leader: "組長 (T3)", Facilitator: "支援 (T2)", Researcher: "支援 (T2)",
    Presenter: "成員 (T1)", Recorder: "成員 (T1)", Support: "支援 (T2)",
  } as Record<RoleType, string>,
  accepted: "已確認", pending: "待確認", declined: "已拒絕",
  submitted: "已提報", draft: "草稿", notStarted: "未開始",
  allClasses: "所有班別", allGroups: "所有組別",
  groupLabel: (g: string) => `${g} 組`,
  conflictLabel: "崗位重複偵測：",
  conflictMsg: (groups: string[]) =>
    `${groups.length} 個組別出現重複的「組長」指派，請即時處理。`,
  resolveBtn: "解決衝突",
  stats: {
    total: "學生總數", assigned: "已指派崗位",
    conflicts: "偵測到衝突", complete: "已完成提報",
  },
  batchCount: (n: number) => `已選取 ${n} 項`,
  batchActions: ["批量指派崗位", "發送崗位確認通知", "匯出小組名單"] as string[],
  clearLabel: "清除",
  membersLabel: (n: number) => `${n} 名成員`,
  studentsShown: (n: number) => `顯示 ${n} 名學生`,
  searchPlaceholder: "搜尋學生姓名…",
};

/* ─── Data ───────────────────────────────────────────────────────────────── */
const STUDENTS: Student[] = [
  // Group A
  { id: 1, name: "Chan Siu Ming", nameZh: "陳小明", cls: "1A", group: "A", groupProject: "Climate Change Study", role: "Leader", roleAccepted: "active", submissionStatus: "synced" },
  { id: 2, name: "Lam Wai Kei", nameZh: "林慧琪", cls: "1A", group: "A", groupProject: "Climate Change Study", role: "Researcher", roleAccepted: "active", submissionStatus: "synced" },
  { id: 3, name: "Wong Ka Yan", nameZh: "王嘉欣", cls: "1B", group: "A", groupProject: "Climate Change Study", role: "Presenter", roleAccepted: "pending", submissionStatus: "pending" },
  { id: 4, name: "Ho Tsz Kwan", nameZh: "何芷君", cls: "1B", group: "A", groupProject: "Climate Change Study", role: "Recorder", roleAccepted: "active", submissionStatus: "synced" },
  // Group B
  { id: 5, name: "Ng Hin Yat", nameZh: "吳顯逸", cls: "2A", group: "B", groupProject: "Biodiversity Survey", role: "Leader", roleAccepted: "active", submissionStatus: "synced" },
  { id: 6, name: "Cheung Pui Man", nameZh: "張佩雯", cls: "2A", group: "B", groupProject: "Biodiversity Survey", role: "Facilitator", roleAccepted: "pending", submissionStatus: "pending" },
  { id: 7, name: "Yip Chun Hong", nameZh: "葉俊康", cls: "2B", group: "B", groupProject: "Biodiversity Survey", role: "Leader", roleAccepted: "warning", submissionStatus: "absent" },
  { id: 8, name: "Liu Mei Ling", nameZh: "廖美玲", cls: "2B", group: "B", groupProject: "Biodiversity Survey", role: "Recorder", roleAccepted: "active", submissionStatus: "pending" },
  // Group C
  { id: 9, name: "Fung Chin Ho", nameZh: "馮展豪", cls: "2C", group: "C", groupProject: "Water Quality Analysis", role: "Leader", roleAccepted: "active", submissionStatus: "synced" },
  { id: 10, name: "Tang Sui Ying", nameZh: "鄧穗盈", cls: "2C", group: "C", groupProject: "Water Quality Analysis", role: "Researcher", roleAccepted: "active", submissionStatus: "synced" },
  { id: 11, name: "Kwok Hoi Tung", nameZh: "郭凱童", cls: "2D", group: "C", groupProject: "Water Quality Analysis", role: "Support", roleAccepted: "pending", submissionStatus: "absent" },
  { id: 12, name: "Ma Sze Wai", nameZh: "馬思慧", cls: "2E", group: "C", groupProject: "Water Quality Analysis", role: "Presenter", roleAccepted: "active", submissionStatus: "synced" },
];

const ROLE_OPTIONS: RoleType[] = ["Leader", "Facilitator", "Researcher", "Presenter", "Recorder", "Support"];
const ROLE_COLORS: Record<RoleType, string> = {
  Leader: "#7C3AED",
  Facilitator: DS.colors.primary,
  Researcher: "#0891B2",
  Presenter: DS.colors.secondary,
  Recorder: DS.colors.warning,
  Support: DS.colors.textSecondary,
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
        <span style={{ fontSize: "13px", fontWeight: 700, color: DS.colors.textPrimary }}>
          {groupLabel(group)}
        </span>
        <span style={{ fontSize: "12px", color: DS.colors.textSecondary }}>
          {project}
        </span>
        <span
          style={{
            marginLeft: "auto",
            fontSize: "11px",
            color: DS.colors.textMuted,
            background: DS.colors.surface,
            padding: "2px 8px",
            borderRadius: DS.radius.full,
            border: `1px solid ${DS.colors.border}`,
          }}
        >
          {membersLabel(count)}
        </span>
      </div>
    </td>
  </tr>
);

/* ─── Screen09_RoleAnchoring ─────────────────────────────────────────────── */
export const Screen09_RoleAnchoring: React.FC<Screen09Props> = ({ lang = "en" }) => {
  const t = lang === "zh-HK" ? ZH : EN;
  const [students, setStudents] = useState<Student[]>(STUDENTS);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set([3, 7, 11]));
  const [classFilter, setClassFilter] = useState("all");
  const [groupFilter, setGroupFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  const updateRole = (id: number, role: RoleType) => {
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, role } : s)));
  };

  const toggleRow = (id: number) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedRows.size === students.length) setSelectedRows(new Set());
    else setSelectedRows(new Set(students.map((s) => s.id)));
  };

  const filteredStudents = students.filter((s) => {
    if (classFilter !== "all" && s.cls !== classFilter) return false;
    if (groupFilter !== "all" && s.group !== groupFilter) return false;
    if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !s.nameZh.includes(searchQuery)) return false;
    return true;
  });

  // Detect duplicate leaders
  const groupLeaderCount: Record<string, number> = {};
  students.forEach((s) => {
    if (s.role === "Leader") {
      groupLeaderCount[s.group] = (groupLeaderCount[s.group] || 0) + 1;
    }
  });
  const conflictGroups = Object.entries(groupLeaderCount).filter(([, count]) => count > 1);

  const rolesAssigned = students.filter((s) => s.role !== "Support").length;
  const submissionsComplete = students.filter((s) => s.submissionStatus === "synced").length;

  const groups = ["A", "B", "C"];

  return (
    <div style={{ background: DS.colors.background, minHeight: "100vh", fontFamily: DS.font.family, padding: "24px" }}>
      {/* Header */}
      <div style={{ marginBottom: "16px" }}>
        <SectionHeader title={t.title} subtitle={t.subtitle} />
      </div>

      {/* Info Banner */}
      <div
        style={{
          background: DS.colors.warningLight,
          border: `1px solid #FCD34D`,
          borderRadius: DS.radius.md,
          padding: "10px 16px",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <AlertTriangle size={16} color={DS.colors.warning} />
        <span style={{ fontSize: "14px", color: "#92400E", fontWeight: 600 }}>
          {t.pendingBanner}
        </span>
        <span style={{ fontSize: "13px", color: "#A16207" }}>
          — {t.pendingMsg}
        </span>
      </div>

      {/* Filter Bar */}
      <Card style={{ padding: "14px 20px", marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: "0 0 180px" }}>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 28px 8px 10px",
                border: `1px solid ${DS.colors.border}`,
                borderRadius: DS.radius.md,
                fontSize: "13px",
                fontFamily: DS.font.family,
                color: DS.colors.textPrimary,
                background: DS.colors.surface,
                outline: "none",
                appearance: "none",
                cursor: "pointer",
              }}
            >
              <option value="all">{t.allClasses}</option>
              {["1A", "1B", "2A", "2B", "2C", "2D", "2E"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <ChevronDown size={13} color={DS.colors.textMuted} style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          </div>
          <div style={{ position: "relative", flex: "0 0 160px" }}>
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 28px 8px 10px",
                border: `1px solid ${DS.colors.border}`,
                borderRadius: DS.radius.md,
                fontSize: "13px",
                fontFamily: DS.font.family,
                color: DS.colors.textPrimary,
                background: DS.colors.surface,
                outline: "none",
                appearance: "none",
                cursor: "pointer",
              }}
            >
              <option value="all">{t.allGroups}</option>
              {["A", "B", "C", "D", "E"].map((g) => (
                <option key={g} value={g}>{t.groupLabel(g)}</option>
              ))}
            </select>
            <ChevronDown size={13} color={DS.colors.textMuted} style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          </div>
          <div style={{ position: "relative", flex: "1 1 180px" }}>
            <Search size={14} color={DS.colors.textMuted} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              style={{
                width: "100%",
                paddingLeft: "32px",
                paddingRight: "12px",
                paddingTop: "8px",
                paddingBottom: "8px",
                border: `1px solid ${DS.colors.border}`,
                borderRadius: DS.radius.md,
                fontSize: "13px",
                fontFamily: DS.font.family,
                outline: "none",
                color: DS.colors.textPrimary,
                boxSizing: "border-box",
              }}
            />
          </div>
          <span style={{ fontSize: "13px", color: DS.colors.textMuted, marginLeft: "auto" }}>
            {t.studentsShown(filteredStudents.length)}
          </span>
        </div>
      </Card>

      {/* Main Table */}
      <Card style={{ overflow: "hidden", marginBottom: "20px" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: DS.font.family }}>
            <thead>
              <tr style={{ background: DS.colors.background, borderBottom: `2px solid ${DS.colors.border}` }}>
                <th style={{ padding: "10px 16px", textAlign: "left", width: "40px" }}>
                  <input
                    type="checkbox"
                    checked={selectedRows.size === students.length}
                    onChange={toggleAll}
                    style={{ cursor: "pointer", accentColor: DS.colors.primary }}
                  />
                </th>
                {t.headers.map((col) => (
                  <th
                    key={col}
                    style={{
                      padding: "10px 12px",
                      textAlign: "left",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: DS.colors.textSecondary,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      whiteSpace: "nowrap",
                    }}
                  >
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
                      group={group}
                      project={firstStudent?.groupProject ?? ""}
                      count={STUDENTS.filter((s) => s.group === group).length}
                      membersLabel={t.membersLabel}
                      groupLabel={t.groupLabel}
                    />
                    {groupStudents.map((student) => {
                      const isSelected = selectedRows.has(student.id);
                      const isHovered = hoveredRow === student.id;
                      return (
                        <tr
                          key={student.id}
                          onMouseEnter={() => setHoveredRow(student.id)}
                          onMouseLeave={() => setHoveredRow(null)}
                          style={{
                            background: isSelected
                              ? DS.colors.primaryLight
                              : isHovered
                              ? "#F8FAFF"
                              : DS.colors.surface,
                            borderBottom: `1px solid ${DS.colors.border}`,
                            cursor: "pointer",
                            transition: "background 0.1s",
                          }}
                        >
                          {/* Checkbox */}
                          <td style={{ padding: "10px 16px" }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleRow(student.id)}
                              style={{ cursor: "pointer", accentColor: DS.colors.primary }}
                            />
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
                            <span
                              style={{
                                fontSize: "13px",
                                fontWeight: 600,
                                color: DS.colors.textSecondary,
                                background: DS.colors.background,
                                padding: "3px 8px",
                                borderRadius: DS.radius.sm,
                                border: `1px solid ${DS.colors.border}`,
                              }}
                            >
                              {student.cls}
                            </span>
                          </td>

                          {/* Group */}
                          <td style={{ padding: "10px 12px" }}>
                            <span
                              style={{
                                fontSize: "13px",
                                fontWeight: 700,
                                color: DS.colors.primary,
                                background: DS.colors.primaryLight,
                                padding: "3px 10px",
                                borderRadius: DS.radius.full,
                              }}
                            >
                              {t.groupLabel(student.group)}
                            </span>
                          </td>

                          {/* Assigned Role */}
                          <td style={{ padding: "10px 12px" }}>
                            <div style={{ position: "relative", display: "inline-block" }}>
                              <select
                                value={student.role}
                                onChange={(e) => updateRole(student.id, e.target.value as RoleType)}
                                style={{
                                  padding: "5px 24px 5px 10px",
                                  border: `1.5px solid ${ROLE_COLORS[student.role]}40`,
                                  borderRadius: DS.radius.md,
                                  fontSize: "13px",
                                  fontFamily: DS.font.family,
                                  fontWeight: 600,
                                  color: ROLE_COLORS[student.role],
                                  background: `${ROLE_COLORS[student.role]}12`,
                                  outline: "none",
                                  appearance: "none",
                                  cursor: "pointer",
                                }}
                              >
                                {ROLE_OPTIONS.map((r) => (
                                  <option key={r} value={r}>{t.roleLabels[r]}</option>
                                ))}
                              </select>
                              <ChevronDown size={12} color={ROLE_COLORS[student.role]} style={{ position: "absolute", right: "6px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                            </div>
                          </td>

                          {/* Role Accepted */}
                          <td style={{ padding: "10px 12px" }}>
                            <StatusBadge
                              variant={student.roleAccepted}
                              label={
                                student.roleAccepted === "active" ? t.accepted
                                : student.roleAccepted === "pending" ? t.pending
                                : t.declined
                              }
                              size="sm"
                            />
                          </td>

                          {/* Submission Status */}
                          <td style={{ padding: "10px 12px" }}>
                            <StatusBadge
                              variant={student.submissionStatus}
                              label={
                                student.submissionStatus === "synced" ? t.submitted
                                : student.submissionStatus === "pending" ? t.draft
                                : t.notStarted
                              }
                              size="sm"
                            />
                          </td>

                          {/* Actions */}
                          <td style={{ padding: "10px 12px" }}>
                            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                              {[
                                { icon: <Edit3 size={13} />, title: "Edit" },
                                { icon: <MessageSquare size={13} />, title: "Message" },
                                { icon: <Eye size={13} />, title: "View" },
                              ].map(({ icon, title }) => (
                                <button
                                  key={title}
                                  title={title}
                                  style={{
                                    width: "28px",
                                    height: "28px",
                                    background: isHovered ? DS.colors.surface : "transparent",
                                    border: `1px solid ${isHovered ? DS.colors.border : "transparent"}`,
                                    borderRadius: DS.radius.sm,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: DS.colors.textSecondary,
                                    transition: "all 0.1s",
                                  }}
                                >
                                  {icon}
                                </button>
                              ))}
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

      {/* Duplicate Role Detection Warning */}
      {conflictGroups.length > 0 && (
        <div
          style={{
            background: DS.colors.warningLight,
            border: `1px solid #FCD34D`,
            borderRadius: DS.radius.md,
            padding: "12px 18px",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <AlertTriangle size={18} color={DS.colors.warning} />
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: "14px", fontWeight: 700, color: "#92400E" }}>
              {t.conflictLabel}
            </span>
            <span style={{ fontSize: "14px", color: "#A16207", marginLeft: "8px" }}>
              {t.conflictMsg(conflictGroups.map(([g]) => g))}
            </span>
          </div>
          <Btn variant="ghost" size="sm" style={{ border: `1px solid #FCD34D`, color: "#92400E" }}>
            {t.resolveBtn}
          </Btn>
        </div>
      )}

      {/* Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "80px" }}>
        <StatCard
          label={t.stats.total}
          value={students.length}
          icon={<Users size={18} color={DS.colors.primary} />}
          color={DS.colors.primary}
        />
        <StatCard
          label={t.stats.assigned}
          value={`${rolesAssigned}/${students.length}`}
          icon={<Users size={18} color={DS.colors.secondary} />}
          color={DS.colors.secondary}
        />
        <StatCard
          label={t.stats.conflicts}
          value={conflictGroups.length}
          icon={<AlertTriangle size={18} color={DS.colors.warning} />}
          color={conflictGroups.length > 0 ? DS.colors.warning : DS.colors.secondary}
        />
        <StatCard
          label={t.stats.complete}
          value={`${submissionsComplete}/${students.length}`}
          icon={<Eye size={18} color="#7C3AED" />}
          color="#7C3AED"
        />
      </div>

      {/* Floating Batch Action Bar */}
      <FloatingBatchActionBar
        selectedCount={selectedRows.size}
        onClear={() => setSelectedRows(new Set())}
        countLabel={lang === "zh-HK" ? t.batchCount(selectedRows.size) : undefined}
        clearLabel={lang === "zh-HK" ? t.clearLabel : undefined}
        actions={t.batchActions.map((label, i) => ({
          label,
          icon: [<Users size={14} />, <MessageSquare size={14} />, <Eye size={14} />][i],
          onClick: () => {},
          variant: (i === 0 ? "primary" : "secondary") as "primary" | "secondary",
        }))}
      />
    </div>
  );
};
