import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import BridgeApp from "./app/BridgeApp.tsx";
import "./styles/index.css";

const root = document.getElementById("root")!;
const bridge = window.__STS_BRIDGE__;

if (bridge && bridge.page) {
  createRoot(root).render(<BridgeApp config={bridge} />);
} else {
  createRoot(root).render(<App />);
}
