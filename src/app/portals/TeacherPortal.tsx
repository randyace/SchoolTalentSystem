// ─────────────────────────────────────────────────────────────────────────────
// TeacherPortal — 教師 / 管理員入口
//
// Bidirectional sync: navId ↔ URL
//   • Clicking a sidebar item → useNavigate(NAV_TO_PATH[id])
//   • URL change (back/forward/direct) → PATH_TO_NAV[pathname] → navId
//
// Frame02_AppShell and all screen components are left completely unchanged.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router";

import { Frame02_AppShell }       from "../components/erp/Frame02_AppShell";
import { Frame03_ActivityTable }  from "../components/erp/Frame03_ActivityTable";
import { Screen_StudentsbyYear }  from "../components/erp/Screen_StudentsbyYear";
import { Screen_ClassList }       from "../components/erp/Screen_ClassList";
import { Screen_Subjects }        from "../components/erp/Screen_Subjects";
import { Screen_ScoreEntry }      from "../components/erp/Screen_ScoreEntry";
import { Screen_DiagnosticDashboard } from "../components/erp/Screen_DiagnosticDashboard";
import { Screen_RolesPositions }  from "../components/erp/Screen_RolesPositions";
import { Screen_GroupProjects }   from "../components/erp/Screen_GroupProjects";
import { Screen_StudentProfile }  from "../components/erp/Screen_StudentProfile";
import { Screen_QRSignIn }        from "../components/erp/Screen_QRSignIn";
import { Screen_BulkGroupAward }  from "../components/erp/Screen_BulkGroupAward";
import { Screen_AIWritingWorkspace } from "../components/erp/Screen_AIWritingWorkspace";
import { Screen_APIAutomation }   from "../components/erp/Screen_APIAutomation";
import { Screen_DynamicGroupBuilder } from "../components/erp/Screen_DynamicGroupBuilder";
import { Screen_ApprovalInbox }   from "../components/erp/Screen_ApprovalInbox";
import { Screen_DevRouteLabelShowcase } from "../components/erp/Screen_DevRouteLabelShowcase";
import { Screen_TierMapping }     from "../components/erp/Screen_TierMapping";
import { Screen_ConductTypes }   from "../components/erp/Screen_ConductTypes";
import { Screen_DataImport }      from "../components/erp/Screen_DataImport";
import { Screen_APIDocs }         from "../components/erp/Screen_APIDocs";
import { Screen_BatchOCR }        from "../components/erp/Screen_BatchOCR";
import { Screen_TalentFilter }    from "../components/erp/Screen_TalentFilter";
import { Screen_SystemAdminHome }   from "../components/erp/Screen_SystemAdminHome";
import { Screen_AIDataAssistant }  from "../components/erp/Screen_AIDataAssistant";
import { Screen_ClubManagement }   from "../components/erp/Screen_ClubManagement";
import { Screen01_Dashboard }     from "../components/lalp/Screen01_Dashboard";
import { Screen06_PromptTuning }  from "../components/lalp/Screen06_PromptTuning";
import { Screen07_PortfolioLibrary } from "../components/lalp/Screen07_PortfolioLibrary";
import { Screen09_RoleAnchoring } from "../components/lalp/Screen09_RoleAnchoring";
import { Screen10_AuditLog }      from "../components/lalp/Screen10_AuditLog";
import { ERP }                    from "../components/erp/erpTokens";

// ── navId ↔ URL path map ──────────────────────────────────────────────────────
// Every sidebar menu item maps to a unique URL under /teacher/
const NAV_TO_PATH: Record<string, string> = {
  "today-overview":     "/teacher",
  "approval-inbox":     "/teacher/approval",
  "students-by-year":   "/teacher/students",
  "class-list":         "/teacher/class",
  "subjects":           "/teacher/subjects",
  "assessment-weights": "/teacher/assessment",
  "score-entry":        "/teacher/scores",
  "diagnostic":         "/teacher/diagnostic",
  "qr-signin":          "/teacher/qr",
  "activities":         "/teacher/activities",
  "achievements":       "/teacher/achievements",
  "group-awards":       "/teacher/group-awards",
  "talent-filter":      "/teacher/talent",
  "roles-positions":    "/teacher/roles",
  "exemplar-library":   "/teacher/library",
  "club-management":    "/teacher/clubs",
  "dynamic-groups":     "/teacher/groups",
  "group-projects":     "/teacher/projects",
  "role-anchoring":     "/teacher/anchoring",
  "system-admin-home":  "/teacher/admin",
  "data-import":        "/teacher/import",
  "ai-workspace":         "/teacher/ai",
  "ai-data-assistant":    "/teacher/ai-data",
  "prompt-portal":      "/teacher/prompts",
  "desensitize-audit":  "/teacher/audit",
  "sync-permissions":   "/teacher/sync",
  "api-automation":     "/teacher/api-automation",
  "api-docs":           "/teacher/api-docs",
  "tier-mapping":       "/teacher/tiers",
  "conduct-types":      "/teacher/conduct-types",
  "dev-routes":         "/teacher/dev",
};

// Reverse the map for URL → navId lookup
const PATH_TO_NAV: Record<string, string> = Object.fromEntries(
  Object.entries(NAV_TO_PATH).map(([navId, path]) => [path, navId])
);

function pathToNavId(pathname: string): string {
  // Exact match first, then fall back to "today-overview"
  return PATH_TO_NAV[pathname] ?? PATH_TO_NAV["/teacher"] ?? "today-overview";
}

// ── Placeholder (screens not yet built) ──────────────────────────────────────
const Placeholder: React.FC<{ screenId: string; zhTitle: string; enTitle: string }> = ({
  screenId, zhTitle, enTitle,
}) => (
  <div style={{
    display: "flex", alignItems: "center", justifyContent: "center",
    height: "100%", padding: 40, fontFamily: ERP.font.family,
  }}>
    <div style={{
      maxWidth: 420, width: "100%",
      background: ERP.colors.surface,
      border: `2px dashed ${ERP.colors.border}`,
      borderRadius: ERP.radius.xl,
      padding: "32px 36px", textAlign: "center",
      boxShadow: ERP.shadow.sm,
    }}>
      <div style={{
        display: "inline-block", padding: "3px 10px", borderRadius: ERP.radius.full,
        background: ERP.colors.accentPale, border: `1px solid ${ERP.colors.accentLight}`,
        fontSize: 11, fontWeight: 700, color: ERP.colors.accent,
        letterSpacing: "0.06em", marginBottom: 14,
      }}>
        {screenId}
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: ERP.colors.textPrimary, marginBottom: 6 }}>
        {zhTitle}
      </div>
      <div style={{ fontSize: 13, color: ERP.colors.textMuted, marginBottom: 20 }}>{enTitle}</div>
      <div style={{
        padding: "10px 16px", borderRadius: ERP.radius.md,
        background: ERP.colors.pageBg, border: `1px solid ${ERP.colors.border}`,
        fontSize: 12, color: ERP.colors.textSecondary, lineHeight: 1.6,
      }}>
        此畫面正在開發中。<br />This screen is under development.
      </div>
    </div>
  </div>
);

// ── Screen switch — identical logic to the old TeacherContent in App.tsx ──────
const TeacherContent: React.FC<{
  navId: string;
  lang: "en" | "zh-HK";
  onViewStudent: (id: string, ctx?: { classCode?: string }) => void;
  onNav: (id: string) => void;
}> = ({ navId, lang, onViewStudent, onNav }) => {
  switch (navId) {
    case "system-admin-home":  return <Screen_SystemAdminHome onNavigate={onNav} />;
    case "today-overview":     return <Screen01_Dashboard />;
    case "approval-inbox":     return <Screen_ApprovalInbox />;
    case "students-by-year":   return <Screen_StudentsbyYear lang={lang} onViewStudent={onViewStudent} />;
    case "class-list":         return (
      <Screen_ClassList
        lang={lang}
        onViewStudent={(id, classCode) => onViewStudent(id, { classCode })}
      />
    );
    case "subjects":           return <Screen_Subjects lang={lang} />;
    case "assessment-weights":
    case "diagnostic":         return <Screen_DiagnosticDashboard lang={lang} />;
    case "score-entry":        return <Screen_ScoreEntry lang={lang} />;
    case "qr-signin":          return null; // handled as full-screen bypass below
    case "activities":         return <Frame03_ActivityTable />;
    case "achievements":       return <Screen_BatchOCR />;
    case "group-awards":       return <Screen_BulkGroupAward onBack={() => {}} />;
    case "talent-filter":      return <Screen_TalentFilter />;
    case "roles-positions":    return <Screen_RolesPositions lang={lang} />;
    case "exemplar-library":   return <Screen07_PortfolioLibrary />;
    case "club-management":    return <Screen_ClubManagement />;
    case "dynamic-groups":     return <Screen_DynamicGroupBuilder />;
    case "group-projects":     return <Screen_GroupProjects lang={lang} />;
    case "role-anchoring":     return <Screen09_RoleAnchoring lang={lang} />;
    case "data-import":        return <Screen_DataImport />;
    case "ai-workspace":       return <Screen_AIWritingWorkspace />;
    case "ai-data-assistant":  return <Screen_AIDataAssistant />;
    case "prompt-portal":      return <Screen06_PromptTuning />;
    case "desensitize-audit":  return <Placeholder screenId="1.F.4,6" zhTitle="脫敏與審計" enTitle="De-sensitize & Audit" />;
    case "sync-permissions":   return <Screen10_AuditLog />;
    case "api-automation":     return <Screen_APIAutomation />;
    case "api-docs":           return <Screen_APIDocs />;
    case "tier-mapping":       return <Screen_TierMapping />;
    case "conduct-types":      return <Screen_ConductTypes />;
    case "dev-routes":         return <Screen_DevRouteLabelShowcase />;
    default:                   return <Placeholder screenId="—" zhTitle={navId} enTitle={navId} />;
  }
};

// ── TeacherPortal — top-level component mounted at /teacher/* ─────────────────
export const TeacherPortal: React.FC = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [lang]    = useState<"en" | "zh-HK">("zh-HK");
  const [isAdmin] = useState(false);

  // Student profile is still a full-screen overlay (not a URL, intentionally)
  const [studentDetail, setStudentDetail] = useState<{
    studentId:  string;
    source:     "roster" | "class-list";
    classCode?: string;
  } | null>(null);

  // Derive navId from current URL — this is the single source of truth
  const navId = pathToNavId(location.pathname);

  // QR sign-in: full-screen immersive bypass
  if (navId === "qr-signin") {
    return (
      <Screen_QRSignIn
        onBack={() => navigate(NAV_TO_PATH["activities"])}
      />
    );
  }

  // Student profile: full-screen bypass (triggered by clicking a student row)
  if (studentDetail !== null) {
    return (
      <Screen_StudentProfile
        studentId={studentDetail.studentId}
        routeSource={studentDetail.source}
        routeClassCode={studentDetail.classCode}
        onBack={() => setStudentDetail(null)}
      />
    );
  }

  return (
    <Frame02_AppShell
      activeNavId={navId}
      // Sidebar click → navigate to the corresponding URL
      onNavChange={(id: string) => navigate(NAV_TO_PATH[id] ?? "/teacher")}
      isAdmin={isAdmin}
      onBack={() => navigate("/")}
    >
      <TeacherContent
        navId={navId}
        lang={lang}
        onNav={(id: string) => navigate(NAV_TO_PATH[id] ?? "/teacher")}
        onViewStudent={(id, ctx) =>
          setStudentDetail({
            studentId: id,
            source:    ctx?.classCode ? "class-list" : "roster",
            classCode: ctx?.classCode,
          })
        }
      />
    </Frame02_AppShell>
  );
};
