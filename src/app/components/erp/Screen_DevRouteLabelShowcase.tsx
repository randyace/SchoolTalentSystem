// ─────────────────────────────────────────────────────────────────────────────
// Screen: DevRouteLabel Showcase — Developer Handoff Design System Doc
// Shows all routing label variants with live demos and copy-paste code snippets
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect } from "react";
import {
  ChevronRight, Home, Code2, Copy, Check,
  ExternalLink, Layers, Globe, Cpu, Zap,
} from "lucide-react";
import { ERP } from "./erpTokens";
import { DevRouteLabel, LALP_ROUTES } from "./DevRouteLabel";

const F = ERP.font.family;
const MONO = "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace";

// ── A minimal "fake screen frame" to simulate the label sitting above a UI ───
const FakeFrame: React.FC<{
  title: string;
  subtitle?: string;
  color?: string;
  height?: number;
  children?: React.ReactNode;
}> = ({ title, subtitle, color = ERP.colors.accent, height = 90, children }) => (
  <div style={{
    width: "100%",
    background: ERP.colors.surface,
    border: `1px solid ${ERP.colors.border}`,
    borderRadius: ERP.radius.lg,
    overflow: "hidden",
    boxShadow: ERP.shadow.card,
  }}>
    {/* fake top bar */}
    <div style={{
      height: 32, background: ERP.colors.pageBg,
      borderBottom: `1px solid ${ERP.colors.border}`,
      display: "flex", alignItems: "center", padding: "0 12px", gap: 6,
    }}>
      {["#FF5F57","#FEBC2E","#28C840"].map(c => (
        <div key={c} style={{ width: 8, height: 8, borderRadius: "50%", background: c }} />
      ))}
      <div style={{
        flex: 1, height: 16,
        background: ERP.colors.border,
        borderRadius: 3, marginLeft: 8,
      }} />
    </div>
    {/* body */}
    <div style={{ height, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 24, height: 24, borderRadius: 6, background: color + "22", border: `1px solid ${color}44`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: ERP.colors.textPrimary, fontFamily: F }}>{title}</div>
          {subtitle && <div style={{ fontSize: 10, color: ERP.colors.textMuted, fontFamily: F }}>{subtitle}</div>}
        </div>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {[100, 60, 80, 45].map((w, i) => (
          <div key={i} style={{ height: 8, width: w, background: ERP.colors.border, borderRadius: 3 }} />
        ))}
      </div>
      {children}
    </div>
  </div>
);

// ── Code snippet with copy button ─────────────────────────────────────────────
const CodeSnippet: React.FC<{ code: string }> = ({ code }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div style={{
      position: "relative",
      background: "#0D1117",
      borderRadius: ERP.radius.md,
      border: "1px solid #21262D",
      overflow: "hidden",
    }}>
      {/* top bar */}
      <div style={{
        display: "flex", alignItems: "center",
        padding: "6px 12px",
        borderBottom: "1px solid #21262D",
        background: "#161B22",
      }}>
        <span style={{ fontSize: 10, color: "#8B949E", fontFamily: MONO }}>TSX</span>
        <button
          onClick={handleCopy}
          style={{
            marginLeft: "auto", display: "flex", alignItems: "center", gap: 4,
            background: copied ? "rgba(74,222,128,0.12)" : "rgba(255,255,255,0.06)",
            border: `1px solid ${copied ? "rgba(74,222,128,0.25)" : "#30363D"}`,
            borderRadius: 4, padding: "2px 8px",
            cursor: "pointer",
            fontSize: 10, fontFamily: MONO,
            color: copied ? "#4ADE80" : "#8B949E",
            transition: "all 0.15s",
          }}
        >
          {copied ? <Check size={10} /> : <Copy size={10} />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre style={{
        margin: 0, padding: "12px 14px",
        fontSize: 11, fontFamily: MONO,
        color: "#E6EDF3", lineHeight: 1.6,
        overflowX: "auto",
        whiteSpace: "pre",
      }}>
        {code}
      </pre>
    </div>
  );
};

// ── Variant Card ──────────────────────────────────────────────────────────────
const VariantCard: React.FC<{
  num: string;
  title: string;
  description: string;
  url: string;
  note?: string;
  noteColor?: string;
  accent?: string;
  label: React.ReactNode;
  fakeTitle: string;
  fakeSubtitle?: string;
  code: string;
  isMobile?: boolean;
}> = ({ num, title, description, url, note, noteColor = ERP.colors.textMuted, accent, label, fakeTitle, fakeSubtitle, code, isMobile }) => (
  <div style={{
    background: ERP.colors.surface,
    border: `1px solid ${ERP.colors.border}`,
    borderRadius: ERP.radius.xl,
    boxShadow: ERP.shadow.card,
    overflow: "hidden",
  }}>
    {/* Header */}
    <div style={{
      padding: "14px 18px",
      borderBottom: `1px solid ${ERP.colors.border}`,
      background: ERP.colors.pageBg,
      display: "flex", alignItems: "center", gap: 10,
    }}>
      <div style={{
        width: 26, height: 26, borderRadius: ERP.radius.sm,
        background: ERP.colors.accentDeep,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 11, fontWeight: 900, color: "#93C5FD", fontFamily: MONO }}>
          {num}
        </span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: ERP.colors.textPrimary, fontFamily: F }}>
          {title}
        </div>
        <div style={{ fontSize: 11, color: ERP.colors.textMuted, fontFamily: F, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: isMobile ? "nowrap" : undefined }}>
          {description}
        </div>
      </div>
      {/* Full URL pill — hidden on mobile */}
      {!isMobile && (
        <div style={{
          marginLeft: "auto",
          padding: "2px 9px", borderRadius: ERP.radius.full,
          background: "#0D1117",
          border: "1px solid #30363D",
          fontSize: 10, fontFamily: MONO, color: "#94A3B8",
          flexShrink: 0,
        }}>
          {url}
        </div>
      )}
    </div>

    {/* Live preview — label floating above frame */}
    <div style={{ padding: "20px 18px 16px", background: "#F8FAFC" }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: ERP.colors.textMuted, letterSpacing: "0.07em", marginBottom: 10, fontFamily: F, textTransform: "uppercase" }}>
        Live Preview — Canvas Placement
      </div>
      {/* Scrollable wrapper so the label never breaks the card on mobile */}
      <div style={{ overflowX: isMobile ? "auto" : "visible", WebkitOverflowScrolling: "touch" as any }}>
        {/* The "floating above" positioning */}
        <div style={{ position: "relative", paddingTop: 28, minWidth: isMobile ? 320 : undefined }}>
          {/* Label positioned above top-left of frame */}
          <div style={{ position: "absolute", top: 0, left: 0, zIndex: 2 }}>
            {label}
          </div>
          {/* Dashed connector line */}
          <div style={{
            position: "absolute", top: 23, left: 16,
            width: 1, height: 12,
            borderLeft: "1px dashed #CBD5E1",
            zIndex: 1,
          }} />
          {/* Fake screen frame */}
          <FakeFrame title={fakeTitle} subtitle={fakeSubtitle} color={accent} />
        </div>
      </div>

      {/* Note */}
      {note && (
        <div style={{
          marginTop: 10, display: "flex", alignItems: "center", gap: 6,
          fontSize: 11, color: noteColor, fontFamily: F,
        }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: noteColor, flexShrink: 0 }} />
          {note}
        </div>
      )}
    </div>

    {/* Code snippet */}
    <div style={{ padding: "0 18px 16px" }}>
      <CodeSnippet code={code} />
    </div>
  </div>
);

// ── Anatomy breakdown diagram ─────────────────────────────────────────────────
const AnatomyDiagram: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  const parts = [
    { label: "Env Badge",    color: "#4ADE80", note: "PROD / STAGING / DEV / LOCAL" },
    { label: "Domain",       color: "#64748B", note: "Subtle gray — always present"   },
    { label: "Static Path",  color: "#CBD5E1", note: "Intermediate path segments"     },
    { label: "Final Segment",color: "#38BDF8", note: "Primary accent — stands out"   },
    { label: "[Dynamic ID]", color: "#FB923C", note: "React Router param — orange"    },
    { label: "Copy Button",  color: "#A5B4FC", note: "Copies full URL to clipboard"  },
  ];
  return (
    <div style={{
      background: "#0D1117",
      border: "1px solid #21262D",
      borderRadius: ERP.radius.xl,
      padding: "20px 22px",
      fontFamily: MONO,
    }}>
      {/* Big example */}
      <div style={{ marginBottom: 20, overflowX: "auto", WebkitOverflowScrolling: "touch" as any }}>
        <div style={{ display: "flex", justifyContent: "center", minWidth: isMobile ? 320 : undefined }}>
          <DevRouteLabel
            domain="sts.figma.site"
            segments={["portfolio", "[student-id]"]}
            env="prod"
            screenLabel="學習歷程"
          />
        </div>
      </div>
      {/* Annotations */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
        gap: 10,
      }}>
        {parts.map(p => (
          <div key={p.label} style={{
            display: "flex", alignItems: "flex-start", gap: 8,
            padding: "8px 10px",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid #21262D",
            borderRadius: 6,
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: p.color, flexShrink: 0, marginTop: 4,
              boxShadow: `0 0 4px ${p.color}60`,
            }} />
            <div>
              <div style={{ fontSize: 11, color: p.color, fontWeight: 600 }}>{p.label}</div>
              <div style={{ fontSize: 10, color: "#64748B", marginTop: 2, lineHeight: 1.4 }}>{p.note}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── All variants data ─────────────────────────────────────────────────────────

const VARIANTS = [
  {
    num: "V1", title: "Dashboard", description: "Root-level entry point, single path segment",
    url: "/dashboard",
    note: "Last static segment renders in #38BDF8 sky blue — high contrast entry point",
    noteColor: "#38BDF8",
    accent: ERP.colors.accent,
    fakeTitle: "今日概覽 Daily Overview", fakeSubtitle: "Screen 1.A.1 · Dashboard",
    label: <DevRouteLabel domain="sts.figma.site" segments={["dashboard"]} env="prod" screenLabel="今日概覽" />,
    code: `<DevRouteLabel\n  domain="sts.figma.site"\n  segments={["dashboard"]}\n  env="prod"\n  screenLabel="今日概覽"\n/>`,
  },
  {
    num: "V2", title: "Student Roster with Class Filter", description: "Nested static path — class code as second segment",
    url: "/roster/f1a",
    note: "Both static segments visible; final segment (f1a) highlighted in accent blue",
    noteColor: ERP.colors.accent,
    accent: ERP.colors.teal,
    fakeTitle: "班別列表 Class List F1A", fakeSubtitle: "Screen 1.B.3 · Students & Classes",
    label: <DevRouteLabel domain="sts.figma.site" segments={["roster", "f1a"]} env="prod" screenLabel="班別列表" />,
    code: `<DevRouteLabel\n  domain="sts.figma.site"\n  segments={["roster", "f1a"]}\n  env="prod"\n  screenLabel="班別列表"\n/>`,
  },
  {
    num: "V3", title: "API & N8N Automation", description: "Admin-scoped nested route with method badge",
    url: "/admin/api-webhooks",
    note: "STAGING env badge — orange dot signals pre-production context to developers",
    noteColor: "#F59E0B",
    accent: ERP.colors.cyan,
    fakeTitle: "API 串接 Webhook Config", fakeSubtitle: "Screen 1.F.6/8 · System Admin",
    label: <DevRouteLabel domain="sts.figma.site" segments={["admin", "api-webhooks"]} env="staging" method="GET" screenLabel="API 串接" />,
    code: `<DevRouteLabel\n  domain="sts.figma.site"\n  segments={["admin", "api-webhooks"]}\n  env="staging"\n  method="GET"\n  screenLabel="API 串接"\n/>`,
  },
  {
    num: "V4", title: "Dynamic Portfolio — [student-id]", description: "React Router dynamic param in square brackets",
    url: "/portfolio/[student-id]",
    note: "[student-id] renders in #FB923C orange — signals a runtime React Router param to engineers",
    noteColor: "#FB923C",
    accent: ERP.colors.purple,
    fakeTitle: "學習歷程 Student Portfolio", fakeSubtitle: "Screen 1.G.2 · Portfolio · Dynamic Route",
    label: <DevRouteLabel domain="sts.figma.site" segments={["portfolio", "[student-id]"]} env="prod" screenLabel="學習歷程" />,
    code: `<DevRouteLabel\n  domain="sts.figma.site"\n  segments={["portfolio", "[student-id]"]}\n  env="prod"\n  screenLabel="學習歷程"\n/>`,
  },
  {
    num: "V5", title: "Nested Dynamic — Student Profile", description: "Multi-level dynamic params: year + student ID",
    url: "/students/[year]/[student-id]",
    note: "Two dynamic segments — both orange, communicates nested resource ownership to engineers",
    noteColor: "#FB923C",
    accent: ERP.colors.green,
    fakeTitle: "學生檔案 Student Profile", fakeSubtitle: "Screen 1.B.4 · Full Profile with PDPO",
    label: <DevRouteLabel domain="sts.figma.site" segments={["students", "[year]", "[student-id]"]} env="prod" screenLabel="學生檔案" />,
    code: `<DevRouteLabel\n  domain="sts.figma.site"\n  segments={[\n    "students",\n    "[year]",\n    "[student-id]"\n  ]}\n  env="prod"\n  screenLabel="學生檔案"\n/>`,
  },
  {
    num: "V6", title: "QR Sign-In — Event-scoped", description: "Event ID dynamic param + static action sub-route",
    url: "/events/[event-id]/qr-signin",
    note: "Hybrid route: dynamic event scope + static action leaf — engineers immediately see the pattern",
    noteColor: ERP.colors.success,
    accent: ERP.colors.green,
    fakeTitle: "QR 無縫簽到 QR Sign-in", fakeSubtitle: "Screen 1.D.QR · Full-screen Mobile",
    label: <DevRouteLabel domain="sts.figma.site" segments={["events", "[event-id]", "qr-signin"]} env="prod" screenLabel="QR 簽到" />,
    code: `<DevRouteLabel\n  domain="sts.figma.site"\n  segments={[\n    "events",\n    "[event-id]",\n    "qr-signin"\n  ]}\n  env="prod"\n  screenLabel="QR 簽到"\n/>`,
  },
];

// ── Size comparison ───────────────────────────────────────────────────────────
const SizeComparison: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return (
    <div style={{
      background: "#0D1117",
      border: "1px solid #21262D",
      borderRadius: ERP.radius.xl,
      padding: "18px 20px",
    }}>
      <div style={{ fontSize: 11, color: "#64748B", fontFamily: MONO, marginBottom: 14, letterSpacing: "0.05em" }}>
        // SIZE VARIANTS
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ overflowX: isMobile ? "auto" : "visible", WebkitOverflowScrolling: "touch" as any }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: isMobile ? 320 : undefined }}>
            <span style={{ fontSize: 10, color: "#64748B", fontFamily: MONO, width: 50, flexShrink: 0 }}>size="md"</span>
            <DevRouteLabel domain="sts.figma.site" segments={["admin", "api-webhooks"]} env="prod" size="md" screenLabel="API 串接" />
            {!isMobile && <span style={{ fontSize: 10, color: "#475569", fontFamily: MONO }}>// Default — use above desktop screens</span>}
          </div>
        </div>
        <div style={{ overflowX: isMobile ? "auto" : "visible", WebkitOverflowScrolling: "touch" as any }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: isMobile ? 320 : undefined }}>
            <span style={{ fontSize: 10, color: "#64748B", fontFamily: MONO, width: 50, flexShrink: 0 }}>size="sm"</span>
            <DevRouteLabel domain="sts.figma.site" segments={["admin", "api-webhooks"]} env="prod" size="sm" screenLabel="API 串接" />
            {!isMobile && <span style={{ fontSize: 10, color: "#475569", fontFamily: MONO }}>// Compact — use above mobile/narrow frames</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── LALP Route Index ─────────────────────────────────────────────────────────
const LalpRouteIndex: React.FC = () => {
  const routes = [
    { key: "dashboard",      route: "/dashboard",                            desc: "今日概覽"  },
    { key: "roster",         route: "/roster/[class-code]",                  desc: "班別列表"  },
    { key: "apiWebhooks",    route: "/admin/api-webhooks",                   desc: "API 串接"  },
    { key: "portfolio",      route: "/portfolio/[student-id]",               desc: "學習歷程"  },
    { key: "studentProfile", route: "/students/[year]/[student-id]",         desc: "學生檔案"  },
    { key: "groupBuilder",   route: "/groups/new",                           desc: "建立群組"  },
    { key: "bulkAwards",     route: "/awards/bulk-import",                   desc: "批量建立"  },
    { key: "qrSignin",       route: "/events/[event-id]/qr-signin",          desc: "QR 簽到"   },
    { key: "aiWorkspace",    route: "/ai/workspace",                         desc: "AI 工作站" },
    { key: "auditLog",       route: "/admin/audit-log",                      desc: "審計日誌"  },
  ];

  return (
    <div style={{
      background: "#0D1117",
      border: "1px solid #21262D",
      borderRadius: ERP.radius.xl,
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "12px 18px",
        borderBottom: "1px solid #21262D",
        background: "#161B22",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <Globe size={13} color="#38BDF8" />
        <span style={{ fontSize: 11, fontWeight: 700, color: "#38BDF8", fontFamily: MONO }}>
          LALP_ROUTE_INDEX
        </span>
        <span style={{ marginLeft: "auto", fontSize: 10, color: "#64748B", fontFamily: MONO }}>
          {routes.length} routes registered
        </span>
      </div>
      {/* Rows */}
      {routes.map((r, i) => (
        <div key={r.key} style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "9px 18px",
          borderBottom: i < routes.length - 1 ? "1px solid #161B22" : "none",
          background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)",
          overflow: "hidden",
          minWidth: 0,
        }}>
          <span style={{ fontSize: 10, color: "#64748B", fontFamily: MONO, width: 26, flexShrink: 0 }}>
            {String(i + 1).padStart(2, "0")}
          </span>
          <span style={{ fontSize: 11, color: "#4ADE80", fontFamily: MONO, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>
            {r.route.replace("[", "<span>[")}
          </span>
          <span style={{
            fontSize: 10, color: "#8B949E",
            fontFamily: "-apple-system, 'PingFang TC', sans-serif",
            width: 70, textAlign: "right", flexShrink: 0,
          }}>
            {r.desc}
          </span>
        </div>
      ))}
    </div>
  );
};

// ── Main Export ───────────────────────────────────────────────────────────────

export const Screen_DevRouteLabelShowcase: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return (
  <div style={{ minHeight: "100%", background: ERP.colors.pageBg, fontFamily: F }}>

    {/* ── Header ────────────────────────────────────────────────────────── */}
    <div style={{
      background: ERP.colors.surface,
      borderBottom: `1px solid ${ERP.colors.border}`,
      padding: isMobile ? "0 16px" : "0 28px",
      boxShadow: ERP.shadow.xs,
    }}>
      {/* Breadcrumb */}
      <div style={{
        display: "flex", alignItems: "center", gap: 5,
        padding: "10px 0 6px",
        fontSize: 11.5, color: ERP.colors.textMuted,
      }}>
        <Home size={11} />
        <span>首頁</span>
        <ChevronRight size={10} />
        <span>系統管理</span>
        <ChevronRight size={10} />
        <span style={{ color: ERP.colors.textPrimary, fontWeight: 600 }}>開發者路由標籤</span>
      </div>

      {/* Title row */}
      <div style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "8px 0 14px",
        borderTop: `1px solid ${ERP.colors.divider}`,
      }}>
        {/* Gradient icon */}
        <div style={{
          width: 40, height: 40, borderRadius: ERP.radius.lg,
          background: "linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #0891B2 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 2px 8px rgba(8,145,178,0.30)",
          flexShrink: 0,
        }}>
          <Code2 size={20} color="#38BDF8" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: isMobile ? 15 : 18, fontWeight: 800,
            color: ERP.colors.textPrimary,
            display: "flex", alignItems: "center", gap: 8,
            flexWrap: "wrap",
          }}>
            🔗 開發者路由標籤元件
            <span style={{
              fontSize: 11, fontWeight: 600, letterSpacing: "0.04em",
              padding: "2px 8px", borderRadius: ERP.radius.full,
              background: "#0D1117", border: "1px solid #30363D",
              color: "#38BDF8", fontFamily: MONO,
              flexShrink: 0,
            }}>
              DevRouteLabel
            </span>
          </div>
          <div style={{ fontSize: 12, color: ERP.colors.textMuted, marginTop: 2 }}>
            設計系統路由文件化元件 · 供開發者交付使用 · Place above every screen frame on the Figma canvas
          </div>
        </div>

        {/* Meta pills */}
        <div style={{ display: isMobile ? "none" : "flex", gap: 7, flexShrink: 0 }}>
          {[
            { label: "v1.0",         bg: "#0D1117", color: "#38BDF8",  border: "#1E3A8A" },
            { label: "Reusable",     bg: ERP.colors.accentPale, color: ERP.colors.accent, border: ERP.colors.accentLight },
            { label: "Dev Handoff",  bg: ERP.colors.successLight, color: ERP.colors.success, border: "#6EE7B7" },
          ].map(p => (
            <span key={p.label} style={{
              padding: "3px 10px", borderRadius: ERP.radius.full,
              background: p.bg, border: `1px solid ${p.border}`,
              fontSize: 11, fontWeight: 600, color: p.color,
              fontFamily: F,
            }}>
              {p.label}
            </span>
          ))}
        </div>
      </div>
    </div>

    {/* ── Body ──────────────────────────────────────────────────────────── */}
    <div style={{ padding: isMobile ? "16px 16px 48px" : "24px 28px 48px", display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Anatomy */}
      <div>
        <SectionHeader icon={<Cpu size={14} color={ERP.colors.accent} />} title="元件解剖圖" subtitle="Component Anatomy — every token explained" />
        <AnatomyDiagram />
      </div>

      {/* Size variants */}
      <div>
        <SectionHeader icon={<Layers size={14} color={ERP.colors.purple} />} title="尺寸規格" subtitle="Size Variants — md for desktop, sm for mobile/narrow frames" />
        <SizeComparison />
      </div>

      {/* Variants grid */}
      <div>
        <SectionHeader icon={<Globe size={14} color={ERP.colors.teal} />} title="路由標籤變體" subtitle="Route Label Variants — all 6 LALP screen types" />
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 18 }}>
          {VARIANTS.map(v => (
            <VariantCard key={v.num} {...v} isMobile={isMobile} />
          ))}
        </div>
      </div>

      {/* Full route index */}
      <div>
        <SectionHeader icon={<ExternalLink size={14} color={ERP.colors.amber} />} title="LALP 全域路由索引" subtitle="Complete Route Index — all registered screens" />
        <LalpRouteIndex />
      </div>

      {/* Usage guide */}
      <div>
        <SectionHeader icon={<Code2 size={14} color={ERP.colors.cyan} />} title="使用指引" subtitle="Usage Guide — how to place on the canvas" />
        <UsageGuide />
      </div>
    </div>
  </div>
  );
};

// ── Helper sub-components ─────────────────────────────────────────────────────

const SectionHeader: React.FC<{ icon: React.ReactNode; title: string; subtitle: string }> = ({ icon, title, subtitle }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
    <div style={{
      width: 28, height: 28, borderRadius: ERP.radius.md,
      background: ERP.colors.surface,
      border: `1px solid ${ERP.colors.border}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: ERP.shadow.xs, flexShrink: 0,
    }}>
      {icon}
    </div>
    <div>
      <span style={{ fontSize: 13, fontWeight: 700, color: ERP.colors.textPrimary, fontFamily: F }}>
        {title}
      </span>
      <span style={{ fontSize: 11, color: ERP.colors.textMuted, fontFamily: F, marginLeft: 8 }}>
        {subtitle}
      </span>
    </div>
  </div>
);

const UsageGuide: React.FC = () => (
  <div style={{
    background: ERP.colors.surface,
    border: `1px solid ${ERP.colors.border}`,
    borderRadius: ERP.radius.xl,
    boxShadow: ERP.shadow.card,
    overflow: "hidden",
  }}>
    <div style={{
      padding: "14px 18px",
      borderBottom: `1px solid ${ERP.colors.border}`,
      background: ERP.colors.pageBg,
      display: "flex", alignItems: "center", gap: 8,
    }}>
      <Zap size={14} color={ERP.colors.warning} />
      <span style={{ fontSize: 12, fontWeight: 700, color: ERP.colors.textPrimary, fontFamily: F }}>
        Figma Canvas Placement Rules
      </span>
    </div>
    <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
      {[
        { step: "1", text: "Place the DevRouteLabel outside and above the top-left corner of each main Frame on the Figma canvas.", color: ERP.colors.accent },
        { step: "2", text: "Use size=\"md\" for desktop (1440px+) and tablet frames. Use size=\"sm\" for mobile (375px / 390px) frames.", color: ERP.colors.purple },
        { step: "3", text: "Set env=\"staging\" for any screen not yet in production. Set env=\"local\" for in-progress designs.", color: ERP.colors.warning },
        { step: "4", text: "Square brackets [param] in segments signal React Router dynamic params — engineers will wire useParams() accordingly.", color: "#FB923C" },
        { step: "5", text: "The screenLabel prop is optional but recommended — it links the technical URL to the Chinese screen name for non-technical stakeholders.", color: ERP.colors.teal },
      ].map(r => (
        <div key={r.step} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{
            width: 20, height: 20, borderRadius: "50%",
            background: r.color + "18",
            border: `1px solid ${r.color}44`,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, marginTop: 1,
          }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: r.color, fontFamily: MONO }}>{r.step}</span>
          </div>
          <span style={{ fontSize: 12, color: ERP.colors.textSecondary, fontFamily: F, lineHeight: 1.6 }}>
            {r.text}
          </span>
        </div>
      ))}
    </div>
    <div style={{ padding: "0 18px 16px" }}>
      <CodeSnippet code={`// Import the component\nimport { DevRouteLabel } from "@/components/erp/DevRouteLabel";\n\n// Basic usage — place above your screen frame\n<DevRouteLabel\n  domain="sts.figma.site"\n  segments={["roster", "f1a"]}\n  env="prod"\n  screenLabel="班別列表"\n/>\n\n// With dynamic segment + method badge\n<DevRouteLabel\n  domain="sts.figma.site"\n  segments={["students", "[year]", "[student-id]"]}\n  env="staging"\n  method="GET"\n  screenLabel="學生檔案"\n  size="sm"\n/>`} />
    </div>
  </div>
);
