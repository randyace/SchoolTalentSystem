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
import { Screen_CertificateTemplates } from "./components/erp/Screen_CertificateTemplates";
import { Screen_Achievements } from "./components/erp/Screen_Achievements";
import { Screen_SystemSettings } from "./components/erp/Screen_SystemSettings";
import { Screen_TierMapping } from "./components/erp/Screen_TierMapping";
import { Screen_AcornEngine } from "./components/erp/Screen_AcornEngine";
import { Screen_ConductTypes } from "./components/erp/Screen_ConductTypes";
import { Screen_RolesPositions } from "./components/erp/Screen_RolesPositions";
import { Screen_AIDataAssistant } from "./components/erp/Screen_AIDataAssistant";
import { Screen_AIWritingWorkspace } from "./components/erp/Screen_AIWritingWorkspace";
import { Screen_SystemAdminHome } from "./components/erp/Screen_SystemAdminHome";
import { Screen_APIDocs } from "./components/erp/Screen_APIDocs";
import { Frame03_ActivityTable } from "./components/erp/Frame03_ActivityTable";
import { Screen_ActivityForm } from "./components/erp/Screen_ActivityForm";
import { Screen_ActivityRoster } from "./components/erp/Screen_ActivityRoster";
import { Screen_ActivityWalkIns } from "./components/erp/Screen_ActivityWalkIns";
import { Screen_ActivityAttendance } from "./components/erp/Screen_ActivityAttendance";
import { Screen_ScoreEntry } from "./components/erp/Screen_ScoreEntry";
import { Screen_Assessments } from "./components/erp/Screen_Assessments";
import { Screen01_Dashboard } from "./components/lalp/Screen01_Dashboard";
import { Screen_StudentBatchCreate } from "./components/erp/Screen_StudentBatchCreate";
import { Screen_ClassDetails } from "./components/erp/Screen_ClassDetails";
import { Screen_Staff } from "./components/erp/Screen_Staff";
import { Screen_ClubManagement, ClubRosterView } from "./components/erp/Screen_ClubManagement";
import { Screen_GroupProjects } from "./components/erp/Screen_GroupProjects";
import { Screen_ProjectGroups } from "./components/erp/Screen_ProjectGroups";
import { Screen_PhpContent, type PhpContentAssets } from "./components/erp/Screen_PhpContent";

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
  | "activity-walkins"
  | "activity-attendance"
  | "approvals"
  | "achievements"
  | "achievement-review"
  | "certificates"
  | "certificate-bulk"
  | "certificate-templates"
  | "talent"
  | "ai-assistant"
  | "ai-workspace"
  | "settings"
  | "system-settings"
  | "tier-mapping"
  | "acorn-engine"
  | "conduct-types"
  | "roles-positions"
  | "api-docs"
  | "scores"
  | "assessments"
  | "staff"
  | "clubs"
  | "club-roster"
  | "projects"
  | "project-groups";

export interface StsBridgeConfig {
  page: StsBridgePage;
  activeNavId?: string;
  title?: string;
  /** Legacy CI4 HTML fragment rendered inside AppShell (no second layout). */
  htmlContent?: string;
  phpAssets?: PhpContentAssets;
  currentUser?: {
    id?: number;
    name?: string;
    email?: string;
    role?: string;
    googleId?: string | null;
    avatarUrl?: string | null;
  } | null;
  logoutUrl?: string;
  profileUrl?: string;
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
    internal_id?: number;
    name_zh_hk?: string;
    name_en?: string;
    class_name?: string;
    class_code?: string;
    class_number?: number | null;
    system_tier?: string;
    custom_title?: string;
    status?: string;
    status_raw?: string;
    academic_year?: string;
    pdpo_token?: string;
  };
  holistic?: import("./components/erp/Screen_StudentProfile").HolisticBridgePayload;
  acornDims?: Array<Record<string, unknown>>;
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
  scanUrl?: string;
  schedulesUrlBase?: string;
  activities?: any[];
  activityId?: number | null;
  initialActivity?: any;
  targetForms?: string[];
  achievementLevels?: any[];
  enrollmentCount?: number;
  walkInCount?: number;
  walkInsUrl?: string;
  walkIns?: any[];
  attendanceUrl?: string;
  groupedRecords?: Record<string, any[]>;
  totalCount?: number;
  enrollUrl?: string;
  rosterUrl?: string;
  activityName?: string;
  students?: any[];
  candidates?: any[];
  addUrl?: string;
  bulkAddUrl?: string;
  updateEnrollmentUrl?: string;
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
  projects?: any[];
  kanban?: { draft?: any[]; active?: any[]; completed?: any[] };
  projectId?: number | null;
  initialProject?: any;
  groupsUrlBase?: string;
  projectTitle?: string;
  form?: string;
  groups?: any[];
  assignedIds?: number[];
  createGroupUrl?: string;
  assignUrl?: string;
  removeUrl?: string;
  /** Bulk certificate generator */
  studentsUrlBase?: string;
  /** Talent pool students API */
  studentsUrl?: string;
  generatePdfUrl?: string;
  /** Achievement review workstation (Screen_BatchOCR) */
  batchTitle?: string;
  activityLabel?: string;
  certs?: any[];
  initialCertIndex?: number;
  uploadUrl?: string;
  extractUrl?: string;
  saveUrlBase?: string;
  searchStudentsUrl?: string;
  environmentLevelsUrl?: string;
  tierRolesUrl?: string;
  /** ACORN system config admin pages */
  tiersUrl?: string;
  manifestUrl?: string;
  diagnoseUrl?: string;
  recalcUrl?: string;
  autoBindUrl?: string;
  initialDiagnosis?: unknown;
  manifest?: import("./components/erp/Screen_AcornEngine").AcornEngineManifest;
  conductTypesUrl?: string;
  rolesUrl?: string;
  /** AI Data Assistant */
  sessionsUrl?: string;
  sendUrl?: string;
  exportDataUrl?: string;
  exportSessionUrl?: string;
  importSessionUrl?: string;
  modelName?: string;
  initialSessionId?: number | null;
  /** AI Copywriting Workspace */
  documentsUrl?: string;
  generateUrl?: string;
  rewritePartialUrl?: string;
  saveVersionUrl?: string;
  uploadContextUrl?: string;
  studentContextUrl?: string;
  metadataUrl?: string;
  /** From system_settings (Settings UI) */
  schoolLogoUrl?: string;
  schoolLogoPath?: string;
  principalName?: string;
  principalTitle?: string;
  schoolName?: string;
  schoolNameEn?: string;
  schoolDisplayName?: string;
  signatureLine?: string;
  customFields?: Array<{ id: number; field_name: string; display_label: string }>;
  customFieldsUrl?: string;
  previewUrlBase?: string;
  templateId?: number | null;
  templateTitle?: string;
  saveTemplateUrl?: string;
  bgImageUrl?: string;
  initialConfig?: Record<string, unknown> | null;
  /** Certificate template library */
  templates?: Array<{ id: number; title: string; activity_label?: string; updated_at?: string }>;
  cloneUrlBase?: string;
  deleteUrlBase?: string;
  editUrlBase?: string;
  csrfName?: string;
  csrfHash?: string;
  /** Achievement batch listing */
  batches?: Array<{
    id: number;
    title: string;
    activity_label?: string;
    total_files?: number;
    reviewed_count?: number;
    status?: string;
  }>;
}

declare global {
  interface Window {
    __STS_BRIDGE__?: StsBridgeConfig;
  }
}

function go(path: string) {
  window.location.href = path;
}

function shell(navId: string, children: React.ReactNode, config?: StsBridgeConfig) {
  const user = config?.currentUser || (window.__STS_BRIDGE__ as StsBridgeConfig | undefined)?.currentUser || null;
  const logoutUrl = config?.logoutUrl || (window.__STS_BRIDGE__ as StsBridgeConfig | undefined)?.logoutUrl || "/logout";
  const profileUrl = config?.profileUrl || (window.__STS_BRIDGE__ as StsBridgeConfig | undefined)?.profileUrl || "/profile";
  const role = (user?.role || "").toLowerCase();
  return (
    <Frame02_AppShell
      activeNavId={navId}
      currentUser={user}
      logoutUrl={logoutUrl}
      profileUrl={profileUrl}
      isAdmin={role === "admin"}
    >
      {children}
    </Frame02_AppShell>
  );
}

export const BridgeApp: React.FC<{ config: StsBridgeConfig }> = ({ config }) => {
  const nav = config.activeNavId;
  const wrap = (navId: string, children: React.ReactNode) => shell(navId, children, config);

  switch (config.page) {
    case "student-profile":
      return wrap(nav || "students-by-year", (
        <Screen_StudentProfile
          studentId={config.profile?.student_id || "unknown"}
          onBack={() => go("/students")}
          routeSource="roster"
          schoolName={config.schoolDisplayName || config.schoolName || "香港神託會培敦中學"}
          schoolNameEn={config.schoolNameEn || "Stewards Pooi Tun Secondary School"}
          holistic={config.holistic ?? null}
          profileMeta={config.profile ? {
            student_id: config.profile.student_id,
            name_zh_hk: config.profile.name_zh_hk,
            name_en: config.profile.name_en,
            class_name: config.profile.class_name,
            class_number: config.profile.class_number ?? null,
            system_tier: config.profile.system_tier,
            status: config.profile.status,
            status_raw: config.profile.status_raw,
            academic_year: config.profile.academic_year,
            pdpo_token: config.profile.pdpo_token,
          } : null}
        />
      ));

    case "students":
      return wrap(nav || "students-by-year", (
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
      return wrap(nav || "students-by-year", (
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
      return wrap(nav || "class-list", (
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
      return wrap(nav || "class-list", (
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
      return wrap(nav || "data-import", <Screen_DataImport />);

    case "dynamic-group":
      return wrap(nav || "dynamic-groups", (
        <Screen_DynamicGroupList
          groups={config.groups}
          academicYears={config.academicYears}
          academicYear={config.academicYear || "2025/26"}
          forms={config.forms}
          subjectAreas={config.subjectAreas}
          filterForm={config.filterForm || "全部"}
          filterSubject={config.filterSubject || "全部"}
          createUrl={config.createUrl || "/dynamic-group/create"}
          smartImportUrl={config.smartImportUrl || "/dynamic-group/smart-import"}
          flashSuccess={config.flashSuccess}
          flashError={config.flashError}
        />
      ));

    case "dynamic-group-create":
      return wrap(nav || "dynamic-groups", (
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
      return wrap(nav || "subjects", (
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
      return wrap(nav || "score-entry", (
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
      return wrap(nav || "assessments", (
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
          smartImportUrl={config.smartImportUrl || "/assessments/smart-import"}
          flashSuccess={config.flashSuccess}
          flashError={config.flashError}
        />
      ));

    case "staff":
      return wrap(nav || "staff", (
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
      return wrap(nav || "club-management", (
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
      return wrap(nav || "club-management", (
        <ClubRosterView
          club={config.club || { id: 0, zhName: "", enName: "", category: "arts", teacher: "—", memberCount: 0, ongoingEvents: 0, founded: "" }}
          onBack={() => go(config.listUrl || "/clubs")}
          members={config.members || []}
          teachers={(config.teachers as any) || []}
          acorns={config.acorns || []}
          acornWeights={(config.acornWeights as any) || (config.club as any)?.acornWeights || {}}
          achievementLevels={(config.achievementLevels as any) || []}
          achievementLevelId={config.achievementLevelId ?? (config.club as any)?.achievementLevelId ?? null}
          roleTitles={(config.roleTitles as any) || undefined}
          academicYear={config.academicYear || "2025/26"}
          eligibleTabs={config.eligibleTabs || []}
          updateUrl={config.updateUrl || ""}
          addUrl={config.addUrl || ""}
          bulkAddUrl={config.bulkAddUrl || ""}
          smartImportUrl={config.smartImportUrl || ""}
          updateRoleUrl={config.updateRoleUrl || ""}
          removeUrl={config.removeUrl || ""}
          scanUrl={config.scanUrl || "/api/attendance/scan"}
          walkInCount={config.walkInCount ?? 0}
          walkInsUrl={config.walkInsUrl || ""}
          flashSuccess={config.flashSuccess}
          flashError={config.flashError}
        />
      ));

    case "projects":
      return wrap(nav || "group-projects", (
        <Screen_GroupProjects
          projects={config.projects || []}
          subjects={(config.subjects as any) || []}
          acorns={config.acorns || []}
          academicYear={config.academicYear || "2025/26"}
          openForm={!!config.openForm}
          projectId={config.projectId ?? null}
          initialProject={config.initialProject}
          storeUrl={config.storeUrl || "/projects"}
          updateUrl={config.updateUrl || "/projects/update"}
          listUrl={config.listUrl || "/projects"}
          groupsUrlBase={config.groupsUrlBase || "/projects/groups"}
          flashSuccess={config.flashSuccess}
          flashError={config.flashError}
        />
      ));

    case "project-groups":
      return wrap(nav || "group-projects", (
        <Screen_ProjectGroups
          projectId={config.projectId ?? null}
          projectTitle={config.projectTitle || ""}
          form={config.form || ""}
          academicYear={config.academicYear || "2025/26"}
          groups={config.groups || []}
          eligibleTabs={config.eligibleTabs || []}
          assignedIds={config.assignedIds || []}
          listUrl={config.listUrl || "/projects"}
          createGroupUrl={config.createGroupUrl || ""}
          assignUrl={config.assignUrl || ""}
          removeUrl={config.removeUrl || ""}
          flashSuccess={config.flashSuccess}
          flashError={config.flashError}
        />
      ));

    case "activities":
      return wrap(nav || "activities", (
        <Frame03_ActivityTable
          activities={config.activities as any}
          createUrl={config.createUrl || "/activities/create"}
          editUrlBase={config.editUrlBase || "/activities/edit"}
          scanUrl={config.scanUrl || "/api/attendance/scan"}
          schedulesUrlBase={config.schedulesUrlBase || "/api/attendance/schedules"}
        />
      ));

    case "activity-form":
      return wrap(nav || "activities", (
        <Screen_ActivityForm
          teachers={(config.teachers as any) || []}
          clubs={(config.clubs as any) || []}
          academicYears={config.academicYears}
          targetForms={config.targetForms}
          achievementLevels={config.achievementLevels || []}
          enrollmentCount={config.enrollmentCount ?? 0}
          walkInCount={config.walkInCount ?? 0}
          walkInsUrl={config.walkInsUrl || ""}
          attendanceUrl={config.attendanceUrl || ""}
          rosterUrl={config.rosterUrl || ""}
          storeUrl={config.storeUrl || "/activities/store"}
          listUrl={config.listUrl || "/activities"}
          ocrUrl={config.ocrUrl || "/activity/ocr"}
          parseScheduleUrl={config.parseScheduleUrl || "/activities/parse-schedule"}
          parseDocumentUrl={config.parseDocumentUrl || "/activities/parse-document"}
          activityId={config.activityId ?? null}
          initialActivity={config.initialActivity}
          scanUrl={config.scanUrl || "/api/attendance/scan"}
          flashSuccess={config.flashSuccess}
          flashError={config.flashError}
        />
      ));

    case "activity-roster":
      return wrap(nav || "activities", (
        <Screen_ActivityRoster
          activityId={config.activityId ?? null}
          activityName={config.activityName || ""}
          academicYear={config.academicYear}
          targetForms={config.targetForms || []}
          students={config.students || []}
          eligibleTabs={config.eligibleTabs || []}
          bulkAddUrl={config.bulkAddUrl || ""}
          updateEnrollmentUrl={config.updateEnrollmentUrl || ""}
          listUrl={config.listUrl || "/activities"}
          editUrl={config.editUrl || "/activities"}
          flashSuccess={config.flashSuccess}
          flashError={config.flashError}
        />
      ));

    case "activity-walkins":
      return wrap(nav || "activities", (
        <Screen_ActivityWalkIns
          activityId={config.activityId ?? null}
          activityName={config.activityName || ""}
          walkIns={config.walkIns || []}
          enrollUrl={config.enrollUrl || ""}
          rosterUrl={config.rosterUrl || "/activities"}
          editUrl={config.editUrl || "/activities"}
          listUrl={config.listUrl || "/activities"}
          flashSuccess={config.flashSuccess}
          flashError={config.flashError}
        />
      ));

    case "activity-attendance":
      return wrap(nav || "activities", (
        <Screen_ActivityAttendance
          activityId={config.activityId ?? null}
          activityName={config.activityName || ""}
          academicYear={config.academicYear}
          groupedRecords={config.groupedRecords || {}}
          totalCount={config.totalCount ?? 0}
          editUrl={config.editUrl || "/activities"}
          rosterUrl={config.rosterUrl || ""}
          listUrl={config.listUrl || "/activities"}
          flashSuccess={config.flashSuccess}
          flashError={config.flashError}
        />
      ));

    case "approvals":
      return wrap(nav || "approval-inbox", <Screen_ApprovalInbox />);

    case "achievements":
      return wrap(
        nav || "achievements",
        <Screen_Achievements
          batches={config.batches || []}
          activities={(config.activities || []).map((a: any) => ({
            id: Number(a.id),
            label: String(a.label || a.name_zh_hk || a.name_en || `Activity #${a.id}`),
          }))}
          createUrl={config.storeUrl || "/achievements/batch/create"}
          reviewUrlBase={config.editUrlBase || "/achievements/review"}
          deleteUrl={config.deleteUrl || "/achievements/batch/delete"}
          csrfName={config.csrfName}
          csrfHash={config.csrfHash}
          flashSuccess={config.flashSuccess}
          flashError={config.flashError}
        />,
      );

    case "achievement-review":
      return wrap(
        nav || "achievements",
        <Screen_BatchOCR
          live
          batchId={config.batchId ?? null}
          batchTitle={config.batchTitle || ""}
          activityLabel={config.activityLabel || ""}
          activities={(config.activities || []).map((a: any) => ({
            id: Number(a.id),
            label: String(a.label || a.name_zh_hk || a.name_en || `Activity #${a.id}`),
          }))}
          initialCerts={(config.certs as any) || []}
          initialCertIndex={config.initialCertIndex ?? 0}
          uploadUrl={config.uploadUrl || ""}
          extractUrl={config.extractUrl || "/achievements/api/extract"}
          saveUrlBase={config.saveUrlBase || "/achievements/review/save"}
          searchStudentsUrl={config.searchStudentsUrl || "/api/students/search"}
          environmentLevelsUrl={config.environmentLevelsUrl || "/api/settings/environment-levels"}
          tierRolesUrl={config.tierRolesUrl || "/api/settings/tier-roles"}
          listUrl={config.listUrl || "/achievements"}
          csrfName={config.csrfName}
          csrfHash={config.csrfHash}
          flashSuccess={config.flashSuccess}
          flashError={config.flashError}
        />,
      );

    case "certificates":
      return wrap(nav || "achievements", <Screen_BatchOCR />);

    case "certificate-templates":
      return wrap(nav || "group-awards", (
        <Screen_CertificateTemplates
          templates={(config.templates as any) || []}
          storeUrl={config.storeUrl || "/certificates/store"}
          editUrlBase={config.editUrlBase || "/certificates/edit"}
          cloneUrlBase={config.cloneUrlBase || "/certificates/clone"}
          deleteUrlBase={config.deleteUrlBase || "/certificates/delete"}
          csrfName={config.csrfName}
          csrfHash={config.csrfHash}
          flashSuccess={config.flashSuccess}
          flashError={config.flashError}
        />
      ));

    case "certificate-bulk":
      return wrap(nav || "group-awards", (
        <Screen_BulkGroupAward
          onBack={() => go(config.listUrl || "/certificates")}
          activities={(config.activities || []).map((a: any) => ({
            id: Number(a.id),
            label: String(a.label || a.name_zh_hk || a.name_en || `Activity #${a.id}`),
            name_zh_hk: a.name_zh_hk,
            name_en: a.name_en,
            academic_year: String(a.academic_year || ""),
            start_date: String(a.start_date || ""),
          }))}
          studentsUrlBase={config.studentsUrlBase || "/certificates/activity-students"}
          generatePdfUrl={config.generatePdfUrl || "/certificates/generate-pdf"}
          customFieldsUrl={config.customFieldsUrl || "/certificates/custom-fields"}
          previewUrlBase={config.previewUrlBase || "/certificates/preview"}
          schoolLogoUrl={config.schoolLogoUrl || ""}
          schoolLogoPath={config.schoolLogoPath || ""}
          principalName={config.principalName || ""}
          principalTitle={config.principalTitle || "校長 Principal"}
          schoolName={config.schoolName || "香港神託會培敦中學"}
          signatureLine={config.signatureLine || "_______________________"}
          customFields={config.customFields || []}
          templateId={config.templateId ?? null}
          templateTitle={config.templateTitle || ""}
          saveTemplateUrl={config.saveTemplateUrl || ""}
          bgImageUrl={config.bgImageUrl || ""}
          initialConfig={(config.initialConfig as any) || null}
          flashSuccess={config.flashSuccess}
          flashError={config.flashError}
        />
      ));

    case "talent":
      return wrap(nav || "talent-filter", (
        <Screen_TalentFilter
          studentsUrl={config.studentsUrl || "/api/talent-pool/students"}
        />
      ));

    case "ai-assistant":
      return wrap(nav || "ai-data-assistant", (
        <Screen_AIDataAssistant
          sessionsUrl={config.sessionsUrl || "/ai-assistant/sessions"}
          sendUrl={config.sendUrl || "/ai-assistant/send"}
          uploadContextUrl={config.uploadContextUrl || "/ai-assistant/api/upload-context"}
          exportDataUrl={config.exportDataUrl || "/ai-assistant/export-data"}
          exportSessionUrl={config.exportSessionUrl || "/ai-assistant/export-session"}
          importSessionUrl={config.importSessionUrl || "/ai-assistant/import-session"}
          modelName={config.modelName}
          initialSessionId={config.initialSessionId ?? null}
          csrfName={config.csrfName}
          csrfHash={config.csrfHash}
        />
      ));

    case "ai-workspace":
      return wrap(
        nav || "ai-workspace",
        <Screen_AIWritingWorkspace
          onBack={() => go("/dashboard")}
          documentsUrl={config.documentsUrl || "/api/ai-workspace/documents"}
          generateUrl={config.generateUrl || "/api/ai-workspace/generate"}
          rewritePartialUrl={config.rewritePartialUrl || "/api/ai-workspace/rewrite-partial"}
          saveVersionUrl={config.saveVersionUrl || "/api/ai-workspace/save-version"}
          uploadContextUrl={config.uploadContextUrl || "/api/ai-workspace/upload-context"}
          studentContextUrl={config.studentContextUrl || "/api/ai-workspace/student-context"}
          searchStudentsUrl={config.searchStudentsUrl || "/api/students/search"}
          metadataUrl={config.metadataUrl || "/api/ai-metadata"}
          csrfName={config.csrfName}
          csrfHash={config.csrfHash}
        />,
      );

    case "system-settings":
      return wrap(
        nav || "system-settings",
        <Screen_SystemSettings
          schoolName={config.schoolName || ""}
          principalName={config.principalName || ""}
          principalTitle={config.principalTitle || ""}
          logoUrl={config.schoolLogoUrl || ""}
          logoPath={config.schoolLogoPath || ""}
          updateUrl={config.storeUrl || "/settings/update"}
          overviewUrl={config.listUrl || "/admin/settings"}
          csrfName={config.csrfName}
          csrfHash={config.csrfHash}
          flashSuccess={config.flashSuccess}
          flashError={config.flashError}
        />,
      );

    case "acorn-engine":
      return wrap(nav || "acorn-engine", (
        <Screen_AcornEngine
          manifest={config.manifest ?? null}
          academicYear={config.academicYear}
          manifestUrl={config.manifestUrl || "/admin/acorn-engine/manifest"}
          updateUrl={config.updateUrl || "/admin/acorn-engine/update-params"}
          recalcUrl={config.recalcUrl || "/admin/acorn-engine/recalculate-all"}
          autoBindUrl={config.autoBindUrl || "/admin/acorn-engine/auto-bind-weights"}
          diagnoseUrl={config.diagnoseUrl || "/admin/acorn-engine/diagnose-student"}
          initialDiagnosis={config.initialDiagnosis ?? null}
          csrfName={config.csrfName}
          csrfHash={config.csrfHash}
        />
      ));

    case "tier-mapping":
      return wrap(nav || "tier-mapping", (
        <Screen_TierMapping
          tiersUrl={config.tiersUrl || "/api/system-config/tiers"}
          csrfName={config.csrfName}
          csrfHash={config.csrfHash}
        />
      ));

    case "conduct-types":
      return wrap(nav || "conduct-types", (
        <Screen_ConductTypes
          conductTypesUrl={config.conductTypesUrl || "/api/system-config/conduct-types"}
          csrfName={config.csrfName}
          csrfHash={config.csrfHash}
        />
      ));

    case "roles-positions":
      return wrap(nav || "roles-positions", (
        <Screen_RolesPositions
          rolesUrl={config.rolesUrl || "/api/system-config/roles"}
          csrfName={config.csrfName}
          csrfHash={config.csrfHash}
        />
      ));

    case "settings":
      return wrap(nav || "system-admin-home", (
        <Screen_SystemAdminHome onNavigate={(id) => {
          const map: Record<string, string> = {
            "system-settings": "/settings",
            "acorn-engine": "/admin/acorn-engine",
            "tier-mapping": "/teacher/tiers",
            "conduct-types": "/teacher/conduct-types",
            "roles-positions": "/teacher/roles",
            "data-import": "/roster",
            "api-docs": "/api/docs",
            "prompt-portal": "/ai-workspace",
            "ai-workspace": "/ai-workspace",
          };
          go(map[id] || "/settings");
        }} />
      ));

    case "api-docs":
      return wrap(nav || "api-docs", <Screen_APIDocs />);

    case "dashboard":
    default:
      return wrap(nav || "today-overview", <Screen01_Dashboard />);
  }
};

export default BridgeApp;
