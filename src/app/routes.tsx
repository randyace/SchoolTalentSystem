// ─────────────────────────────────────────────────────────────────────────────
// LALP ERP — Route Configuration
// React Router v7 · createBrowserRouter
//
// URL structure:
//   /              → SSO Gateway (login / portal selection)
//   /teacher/*     → Teacher/Admin portal  (all sub-pages live here)
//   /student       → Student portal
//   /parent        → Parent portal
//   *              → 404
// ─────────────────────────────────────────────────────────────────────────────
import { createBrowserRouter } from "react-router";
import { SSOPage }            from "./portals/SSOPage";
import { TeacherPortal }      from "./portals/TeacherPortal";
import { StudentPortal }      from "./portals/StudentPortal";
import { ParentPortal }       from "./portals/ParentPortal";
import { NotFoundPage }       from "./components/erp/NotFoundPage";

export const router = createBrowserRouter([
  // SSO / Portal selector
  { path: "/",         Component: SSOPage },

  // Teacher portal — wildcard captures every sub-route (/teacher/students, etc.)
  { path: "/teacher/*", Component: TeacherPortal },

  // Other portals
  { path: "/student",  Component: StudentPortal },
  { path: "/parent",   Component: ParentPortal },

  // 404 catch-all
  { path: "*",         Component: NotFoundPage },
]);
