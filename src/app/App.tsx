// ─────────────────────────────────────────────────────────────────────────────
// LALP ERP — App Entry Point v5.0
// React Router v7 · RouterProvider
// All routing logic lives in ./routes.tsx
// ─────────────────────────────────────────────────────────────────────────────
import React from "react";
import { RouterProvider } from "react-router";
import { router } from "./routes";

export default function App() {
  return <RouterProvider router={router} />;
}
