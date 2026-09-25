// ─────────────────────────────────────────────────────────────────────────────
// CI4 ↔ Figma Bridge — mounts authentic submodule screens only.
// No invented CSS. window.__STS_BRIDGE__ injected by layouts/figma.php
// ─────────────────────────────────────────────────────────────────────────────
import React from "react";
import { Frame02_AppShell } from "./components/erp/Frame02_AppShell";
import { Screen_StudentProfile } from "./components/erp/Screen_StudentProfile";
import { Screen_StudentsbyYear } from "./components/erp/Screen_StudentsbyYear";
import { Screen_ClassList } from "./components/erp/Screen_ClassList";
import { Screen_DynamicGroupBuilder } from "./components/erp/Screen_DynamicGroupBuilder";
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
import { Screen01_Dashboard } from "./components/lalp/Screen01_Dashboard";

export type StsBridgePage =
  | "dashboard"
  | "students"
  | "student-profile"
  | "class"
  | "roster-import"
  | "dynamic-group"
  | "activities"
  | "approvals"
  | "certificates"
  | "certificate-bulk"
  | "talent"
  | "ai-assistant"
  | "ai-workspace"
  | "settings"
  | "api-docs";

export interface StsBridgeConfig {
  page: StsBridgePage;
  activeNavId?: string;
  title?: string;
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
  classes?: Array<{
    id: string;
    classCode: string;
    form: string;
    formTeacher: string;
    headcount: number;
    activeActivities: number;
    room: string;
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
          onViewStudent={(id) => go(`/students/details/${encodeURIComponent(id)}`)}
        />
      ));

    case "class":
      return shell(nav || "class-list", (
        <Screen_ClassList
          lang="zh-HK"
          onViewStudent={(id) => go(`/students/details/${encodeURIComponent(id)}`)}
        />
      ));

    case "roster-import":
      return shell(nav || "data-import", <Screen_DataImport />);

    case "dynamic-group":
      return shell(nav || "dynamic-groups", <Screen_DynamicGroupBuilder />);

    case "activities":
      return shell(nav || "activities", <Frame03_ActivityTable />);

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
