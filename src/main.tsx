import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import BridgeApp from "./app/BridgeApp.tsx";
import { ErrorBoundary } from "./app/components/ErrorBoundary.tsx";
import "./styles/index.css";

const root = document.getElementById("root")!;
const bridge = window.__STS_BRIDGE__;

createRoot(root).render(
  <ErrorBoundary title="School Talent System · 頁面錯誤">
    {bridge && bridge.page ? <BridgeApp config={bridge} /> : <App />}
  </ErrorBoundary>
);
