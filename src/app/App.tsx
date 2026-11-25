// ─────────────────────────────────────────────────────────────────────────────
// LALP ERP — App Entry Point v5.0
// React Router v7 · RouterProvider
// All routing logic lives in ./routes.tsx
// ─────────────────────────────────────────────────────────────────────────────
import React from "react";
import { RouterProvider } from "react-router";
import { router } from "./routes";
import { ErrorBoundary } from "./components/ErrorBoundary";

export default function App() {
  return (
    <ErrorBoundary title="School Talent System · 路由錯誤">
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
}
