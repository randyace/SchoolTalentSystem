// ─────────────────────────────────────────────────────────────────────────────
// CI4 ↔ Figma Bridge — mounts authentic submodule screens only.
// No invented CSS. window.__STS_BRIDGE__ injected by layouts/figma.php
// ─────────────────────────────────────────────────────────────────────────────
import React from "react";
import { Frame02_AppShell } from "./components/erp/Frame02_AppShell";
import { Screen_StudentProfile } from "./components/erp/Screen_StudentProfile";
import { Screen_StudentsbyYear } from "./components/erp/Screen_StudentsbyYear";
import { Screen_ClassList } from "./components/erp/Screen_ClassList";
import { Screen_DynamicGroupForm } from "./components/erp/Screen_DynamicGroupForm";
import { Screen_DynamicGroupList } from "./components/erp/Screen_DynamicGroupList";
import { Screen_Subjects } from "./components/erp/Screen_Subjects";
import { Screen_DataImport } from "./components/erp/Screen_DataImport";
import { Screen_ApprovalInbox } from "./components/erp/Screen_ApprovalInbox";
import { Screen_TalentFilter } from "./components/erp/Screen_TalentFilter";
import { Screen_BatchOCR } from "./components/erp/Screen_BatchOCR";
import { Screen_BulkGroupAward } from "./components/erp/Screen_BulkGroupAward";
import { Screen_AIDataAssistant } from "./components/erp/Screen_AIDataAssistant";
import { Screen_AIWritingWorkspace } from "./components/erp/Screen_AIWritingWorkspace";
import { Screen_SystemAdminHome } from "./components/erp/Screen_SystemAdminHome";
import { Screen_APIDocs } from "./components/erp/Screen_APIDocs";
import { Frame03_ActivityTable } from "./components/erp/Frame03_ActivityTable";
import { Screen_ActivityForm } from "./components/erp/Screen_ActivityForm";
import { Screen_ActivityRoster } from "./components/erp/Screen_ActivityRoster";
import { Screen_ScoreEntry } from "./components/erp/Screen_ScoreEntry";
import { Screen_Assessments } from "./components/erp/Screen_Assessments";
import { Screen01_Dashboard } from "./components/lalp/Screen01_Dashboard";
import { Screen_StudentBatchCreate } from "./components/erp/Screen_StudentBatchCreate";
import { Screen_ClassDetails } from "./components/erp/Screen_ClassDetails";
import { Screen_Staff } from "./components/erp/Screen_Staff";
import { Screen_ClubManagement, ClubRosterView } from "./components/erp/Screen_ClubManagement";

export type StsBridgePage =
  | "dashboard"
  | "students"
  | "student-create"
  | "student-profile"
  | "class"
  | "class-details"
  | "roster-import"
  | "dynamic-group"
  | "dynamic-group-create"
  | "subjects"
  | "activities"
  | "activity-form"
  | "activity-roster"
  | "approvals"
  | "certificates"
  | "certificate-bulk"
  | "talent"
  | "ai-assistant"
  | "ai-workspace"
  | "settings"
  | "api-docs"
  | "scores"
  | "assessments"
  | "staff"
  | "clubs"
  | "club-roster";

export interface StsBridgeConfig {
  page: StsBridgePage;
  activeNavId?: string;
  title?: string;
  flashSuccess?: string;
  flashError?: string;
  storeUrl?: string;
  academicYear?: string;
  academicYears?: string[];
  filterForm?: string;
  nextIdStart?: number;
  classProfile?: {
    id: string;
    name: string;
    classCode: string;
    form: string;
    form_teacher_id?: number | null;
    form_teacher_en: string;
    form_teacher_zh_hk: string;
    formTeacher: string;
    headcount: number;
    academic_year: string;
    updateUrl: string;
    room?: string;
  };
  profile?: {
    student_id: string;
    name_zh_hk?: string;
    name_en?: string;
    class_name?: string;
    class_code?: string;
    system_tier?: string;
    custom_title?: string;
    status?: string;
    academic_year?: string;
  };
  students?: Array<{
    id: string;
    chName: string;
    enName: string;
    form: string;
    classCode: string;
    classNum: number;
    status: "active" | "repeat" | "left" | "suspended";
    isRepeat: boolean;
    pendingAwards: number;
    aiAlert: "none" | "attendance" | "academic" | "both";
  }>;
  /** Distinct form codes from DB for cascading filters */
  forms?: string[];
  /** Initial Class filter (e.g. from Open Roster deep-link) */
  filterClass?: string;
  /** Full class catalog for cascading Form → Class dropdowns */
  classCatalog?: Array<{
    id: number;
    name: string;
    form: string;
    classCode: string;
  }>;
  classes?: Array<{
    id: string;
    classCode: string;
    form: string;
    formTeacher: string;
    headcount: number;
    activeActivities: number;
    room: string;
    name?: string;
    academic_year?: string;
    student_count?: number;
  }>;
  /** Dynamic Group listing */
  groups?: Array<{
    id: number;
    academic_year: string;
    form: string;
    name: string;
    subject_area: string;
    teacher_en?: string;
    teacher_zh_hk?: string;
    teacher: string;
    student_count: number;
    origin_classes: string[];
  }>;
  subjectAreas?: string[];
  filterSubject?: string;
  createUrl?: string;
  datatableUrl?: string;
  listUrl?: string;
  lockedForm?: string;
  formLocked?: boolean;
  validateMembersUrl?: string;
  studentsByFormUrl?: string;
  subjectFormsUrl?: string;
  toggleUrl?: string;
  storeUrl?: string;
  groupId?: number | null;
  initialGroup?: {
    id: number;
    name: string;
    form: string;
    academic_year: string;
    subject_area: string;
    teacher_id?: number | null;
    teacher_en: string;
    teacher_zh_hk: string;
  } | null;
  initialMembers?: Array<{
    pk: number;
    student_id: string;
    name: string;
    name_zh_hk?: string;
    name_en?: string;
    class_name: string;
    form?: string;
  }>;
  teachers?: Array<{
    id: string | number;
    name?: string;
    name_en?: string;
    name_zh_hk?: string;
    label: string;
    role?: string;
  }>;
  subjects?: Array<{
    id: string | number;
    dbId?: number;
    code: string;
    zhName?: string;
    enName?: string;
    name_zh_hk?: string;
    name_en?: string;
    kla: string;
    label?: string;
    levels?: string[];
    offered_forms?: string[];
    status?: "active" | "paused" | string;
    allow_dynamic_grouping?: boolean;
    acorn_ids?: number[];
    kla_id?: number | null;
    kla_color?: string | null;
  }>;
  klas?: Array<{
    id: number;
    name_en: string;
    name_zh_hk: string;
    theme_color?: string | null;
    label?: string;
  }>;
  acorns?: Array<{
    id: number;
    code: string;
    name_en: string;
    name_zh_hk: string;
    description?: string | null;
  }>;
  storeUrl?: string;
  updateUrl?: string;
  editUrlBase?: string;
  activities?: any[];
  activityId?: number | null;
  initialActivity?: any;
  targetForms?: string[];
  achievementLevels?: any[];
  enrollmentCount?: number;
  rosterUrl?: string;
  activityName?: string;
  students?: any[];
  candidates?: any[];
  addUrl?: string;
  bulkAddUrl?: string;
  eligibleTabs?: any[];
  editUrl?: string;
  saveUrl?: string;
  terms?: Array<{ value: string; label: string }>;
  assessmentItems?: Array<{ value: string; label: string; name_en?: string }>;
  assessmentsUrl?: string;
  assessments?: any[];
  assessmentId?: number | null;
  initialAssessment?: any;
  openForm?: boolean;
  deleteUrl?: string;
  listUrl?: string;
  createUrl?: string;
  staff?: any[];
  staffId?: number | null;
  initialStaff?: any;
  clubs?: any[];
  summary?: { clubCount?: number; memberCount?: number; eventCount?: number; categoryCount?: number };
  rosterUrlBase?: string;
  club?: any;
  members?: any[];
  acornIds?: number[];
  updateRoleUrl?: string;
  removeUrl?: string;
}

declare global {
  interface Window {
    __STS_BRIDGE__?: StsBridgeConfig;
  }
}

function go(path: string) {
  window.location.href = path;
}

function shell(navId: string, children: React.ReactNode) {
  return <Frame02_AppShell activeNavId={navId}>{children}</Frame02_AppShell>;
}

export const BridgeApp: React.FC<{ config: StsBridgeConfig }> = ({ config }) => {
  const nav = config.activeNavId;

  switch (config.page) {
    case "student-profile":
      return (
        <Screen_StudentProfile
          studentId={config.profile?.student_id || "unknown"}
          onBack={() => go("/students")}
          routeSource="roster"
        />
      );

    case "students":
      return shell(nav || "students-by-year", (
        <Screen_StudentsbyYear
          lang="zh-HK"
          students={config.students}
          forms={config.forms}
          classCatalog={config.classCatalog}
          flashSuccess={config.flashSuccess}
          academicYear={config.academicYear}
          initialClassFilter={config.filterClass}
          onViewStudent={(id) => go(`/students/details/${encodeURIComponent(id)}`)}
        />
      ));

    case "student-create":
      return shell(nav || "students-by-year", (
        <Screen_StudentBatchCreate
          classCatalog={config.classCatalog}
          academicYear={config.academicYear || "2025/26"}
          storeUrl={config.storeUrl || "/students/store"}
          cancelUrl="/students"
          flashError={config.flashError}
          nextIdStart={config.nextIdStart ?? 100000}
        />
      ));

    case "class":
      return shell(nav || "class-list", (
        <Screen_ClassList
          lang="zh-HK"
          classes={config.classes}
          forms={config.forms}
          academicYears={config.academicYears}
          academicYear={config.academicYear || "2025/26"}
          filterForm={config.filterForm || "全部"}
          onViewStudent={(id) => go(`/students/details/${encodeURIComponent(id)}`)}
        />
      ));

    case "class-details":
      return shell(nav || "class-list", (
        <Screen_ClassDetails
          profile={config.classProfile || {
            id: "0",
            name: "",
            classCode: "",
            form: "",
            form_teacher_id: null,
            form_teacher_en: "",
            form_teacher_zh_hk: "",
            formTeacher: "",
            headcount: 0,
            academic_year: config.academicYear || "2025/26",
            updateUrl: "/classes",
          }}
          students={config.students}
          teachers={(config.teachers as any) || []}
          academicYears={config.academicYears}
          academicYear={config.academicYear}
          flashSuccess={config.flashSuccess}
          flashError={config.flashError}
        />
      ));

    case "roster-import":
      return shell(nav || "data-import", <Screen_DataImport />);

    case "dynamic-group":
      return shell(nav || "dynamic-groups", (
        <Screen_DynamicGroupList
          groups={config.groups}
          academicYears={config.academicYears}
          academicYear={config.academicYear || "2025/26"}
          forms={config.forms}
          subjectAreas={config.subjectAreas}
          filterForm={config.filterForm || "全部"}
          filterSubject={config.filterSubject || "全部"}
          createUrl={config.createUrl || "/dynamic-group/create"}
          flashSuccess={config.flashSuccess}
          flashError={config.flashError}
        />
      ));

    case "dynamic-group-create":
      return shell(nav || "dynamic-groups", (
        <Screen_DynamicGroupForm
          lockedForm={config.lockedForm || "F3"}
          forms={config.forms}
          academicYear={config.academicYear || "2025/26"}
          subjects={(config.subjects || []).map((s: any) => ({
            id: Number(s.id || s.dbId || 0),
            code: s.code,
            name_en: s.name_en || s.enName || "",
            name_zh_hk: s.name_zh_hk || s.zhName || "",
            kla: s.kla || "",
            allow_dynamic_grouping: !!s.allow_dynamic_grouping,
            offered_forms: s.offered_forms || s.levels || [],
            label: s.label || `${s.code} — ${s.name_zh_hk || s.zhName || ""} / ${s.name_en || s.enName || ""}`,
          }))}
          teachers={config.teachers || []}
          studentsByFormUrl={config.studentsByFormUrl || "/students/by-form"}
          subjectFormsUrl={config.subjectFormsUrl || "/dynamic-group/subject-forms"}
          validateMembersUrl={config.validateMembersUrl || "/dynamic-group/validate-members"}
          storeUrl={config.storeUrl || "/dynamic-group/store"}
          listUrl={config.listUrl || "/dynamic-group"}
          groupId={config.groupId ?? null}
          initialGroup={config.initialGroup ?? null}
          initialMembers={config.initialMembers || []}
          flashSuccess={config.flashSuccess}
          flashError={config.flashError}
        />
      ));

    case "subjects":
      return shell(nav || "subjects", (
        <Screen_Subjects
          lang="zh-HK"
          subjects={config.subjects as any}
          klas={config.klas as any}
          acorns={config.acorns as any}
          toggleUrl={config.toggleUrl || "/subjects/toggle-dynamic-grouping"}
          storeUrl={config.storeUrl || "/subjects/store"}
          updateUrl={config.updateUrl || "/subjects/update"}
        />
      ));

    case "scores":
      return shell(nav || "score-entry", (
        <Screen_ScoreEntry
          lang="zh-HK"
          academicYear={config.academicYear}
          classes={(config.classes as any) || []}
          subjects={(config.subjects as any) || []}
          terms={config.terms}
          rosterUrl={config.rosterUrl || "/scores/roster"}
          saveUrl={config.saveUrl || "/scores/save"}
          assessmentsUrl={config.assessmentsUrl || "/scores/assessments"}
        />
      ));

    case "assessments":
      return shell(nav || "assessments", (
        <Screen_Assessments
          assessments={(config.assessments as any) || []}
          subjects={(config.subjects as any) || []}
          terms={config.terms}
          forms={config.forms}
          academicYear={config.academicYear}
          academicYears={config.academicYears}
          openForm={!!config.openForm}
          assessmentId={config.assessmentId ?? null}
          initialAssessment={config.initialAssessment}
          storeUrl={config.storeUrl || "/assessments/store"}
          updateUrl={config.updateUrl || "/assessments/update"}
          deleteUrl={config.deleteUrl || "/assessments/delete"}
          listUrl={config.listUrl || "/assessments"}
          createUrl={config.createUrl || "/assessments/create"}
          editUrlBase={config.editUrlBase || "/assessments/edit"}
          flashSuccess={config.flashSuccess}
          flashError={config.flashError}
        />
      ));

    case "staff":
      return shell(nav || "roles-positions", (
        <Screen_Staff
          staff={config.staff || []}
          openForm={!!config.openForm}
          staffId={config.staffId ?? null}
          initialStaff={config.initialStaff}
          storeUrl={config.storeUrl || "/staff/store"}
          updateUrl={config.updateUrl || "/staff/update"}
          deleteUrl={config.deleteUrl || "/staff/delete"}
          listUrl={config.listUrl || "/staff"}
          createUrl={config.createUrl || "/staff/create"}
          editUrlBase={config.editUrlBase || "/staff/edit"}
          flashSuccess={config.flashSuccess}
          flashError={config.flashError}
        />
      ));

    case "clubs":
      return shell(nav || "club-management", (
        <Screen_ClubManagement
          clubs={config.clubs || []}
          summary={config.summary}
          academicYear={config.academicYear || "2025/26"}
          rosterUrlBase={config.rosterUrlBase || "/clubs/roster"}
          storeUrl={config.storeUrl || "/clubs"}
          flashSuccess={config.flashSuccess}
          flashError={config.flashError}
        />
      ));

    case "club-roster":
      return shell(nav || "club-management", (
        <ClubRosterView
          club={config.club || { id: 0, zhName: "", enName: "", category: "arts", teacher: "—", memberCount: 0, ongoingEvents: 0, founded: "" }}
          onBack={() => go(config.listUrl || "/clubs")}
          members={config.members || []}
          teachers={(config.teachers as any) || []}
          acorns={config.acorns || []}
          acornIds={config.acornIds || []}
          academicYear={config.academicYear || "2025/26"}
          eligibleTabs={config.eligibleTabs || []}
          updateUrl={config.updateUrl || ""}
          addUrl={config.addUrl || ""}
          bulkAddUrl={config.bulkAddUrl || ""}
          updateRoleUrl={config.updateRoleUrl || ""}
          removeUrl={config.removeUrl || ""}
          flashSuccess={config.flashSuccess}
          flashError={config.flashError}
        />
      ));

    case "activities":
      return shell(nav || "activities", (
        <Frame03_ActivityTable
          activities={config.activities as any}
          createUrl={config.createUrl || "/activities/create"}
          editUrlBase={config.editUrlBase || "/activities/edit"}
        />
      ));

    case "activity-form":
      return shell(nav || "activities", (
        <Screen_ActivityForm
          teachers={(config.teachers as any) || []}
          academicYears={config.academicYears}
          targetForms={config.targetForms}
          achievementLevels={config.achievementLevels || []}
          enrollmentCount={config.enrollmentCount ?? 0}
          rosterUrl={config.rosterUrl || ""}
          storeUrl={config.storeUrl || "/activities/store"}
          listUrl={config.listUrl || "/activities"}
          activityId={config.activityId ?? null}
          initialActivity={config.initialActivity}
          flashSuccess={config.flashSuccess}
          flashError={config.flashError}
        />
      ));

    case "activity-roster":
      return shell(nav || "activities", (
        <Screen_ActivityRoster
          activityId={config.activityId ?? null}
          activityName={config.activityName || ""}
          academicYear={config.academicYear}
          targetForms={config.targetForms || []}
          students={config.students || []}
          eligibleTabs={config.eligibleTabs || []}
          bulkAddUrl={config.bulkAddUrl || ""}
          listUrl={config.listUrl || "/activities"}
          editUrl={config.editUrl || "/activities"}
          flashSuccess={config.flashSuccess}
          flashError={config.flashError}
        />
      ));

    case "approvals":
      return shell(nav || "approval-inbox", <Screen_ApprovalInbox />);

    case "certificates":
      return shell(nav || "achievements", <Screen_BatchOCR />);

    case "certificate-bulk":
      return shell(nav || "group-awards", <Screen_BulkGroupAward onBack={() => go("/certificates")} />);

    case "talent":
      return shell(nav || "talent-filter", <Screen_TalentFilter />);

    case "ai-assistant":
      return shell(nav || "ai-data-assistant", <Screen_AIDataAssistant />);

    case "ai-workspace":
      return shell(nav || "ai-workspace", <Screen_AIWritingWorkspace onBack={() => go("/dashboard")} />);

    case "settings":
      return shell(nav || "system-admin-home", (
        <Screen_SystemAdminHome onNavigate={(id) => {
          const map: Record<string, string> = {
            "data-import": "/roster",
            "api-docs": "/api/docs",
            "prompt-portal": "/ai-workspace",
          };
          go(map[id] || "/settings");
        }} />
      ));

    case "api-docs":
      return shell(nav || "api-docs", <Screen_APIDocs />);

    case "dashboard":
    default:
      return shell(nav || "today-overview", <Screen01_Dashboard />);
  }
};

export default BridgeApp;
