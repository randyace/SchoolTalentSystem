// ─────────────────────────────────────────────────────────────────────────────
// DevRouteLabel — Developer Handoff URL Routing Badge
// Mimics a miniature browser address bar for screen-level route documentation.
// Place above the top-left of any screen frame on the canvas.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from "react";
import { Copy, Check, Globe, Lock } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

export type EnvTag = "prod" | "staging" | "dev" | "local";

export interface RouteSegment {
  value: string;
  type: "static" | "dynamic" | "wildcard";
}

export interface DevRouteLabelProps {
  /** e.g. "sts.figma.site" */
  domain?: string;
  /** e.g. ["admin", "api-webhooks"] or ["portfolio", "[student-id]"] */
  segments: (string | RouteSegment)[];
  env?: EnvTag;
  /** HTTP method hint (GET, POST …) */
  method?: string;
  /** Short human label shown in a secondary pill */
  screenLabel?: string;
  /** Dark bg override */
  bg?: string;
  size?: "sm" | "md";
}

// ── Sub-tokens ────────────────────────────────────────────────────────────────

const MONO = "'JetBrains Mono', 'Fira Code', 'SF Mono', 'Roboto Mono', monospace";

const ENV_CONFIG: Record<EnvTag, { dot: string; label: string; labelColor: string; bgTint: string }> = {
  prod:    { dot: "#22C55E", label: "PROD",    labelColor: "#4ADE80", bgTint: "rgba(34,197,94,0.10)"  },
  staging: { dot: "#F59E0B", label: "STAGING", labelColor: "#FCD34D", bgTint: "rgba(245,158,11,0.10)" },
  dev:     { dot: "#818CF8", label: "DEV",     labelColor: "#A5B4FC", bgTint: "rgba(129,140,248,0.10)"},
  local:   { dot: "#94A3B8", label: "LOCAL",   labelColor: "#CBD5E1", bgTint: "rgba(148,163,184,0.10)"},
};

const METHOD_COLORS: Record<string, { text: string; bg: string }> = {
  GET:    { text: "#4ADE80", bg: "rgba(74,222,128,0.12)"  },
  POST:   { text: "#60A5FA", bg: "rgba(96,165,250,0.12)"  },
  PUT:    { text: "#FBBF24", bg: "rgba(251,191,36,0.12)"  },
  PATCH:  { text: "#F472B6", bg: "rgba(244,114,182,0.12)" },
  DELETE: { text: "#F87171", bg: "rgba(248,113,113,0.12)" },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalizeSegment(s: string | RouteSegment): RouteSegment {
  if (typeof s === "object") return s;
  if (s.startsWith("[") && s.endsWith("]")) return { value: s, type: "dynamic" };
  if (s === "*" || s === "**")              return { value: s, type: "wildcard" };
  return { value: s, type: "static" };
}

// ── Main Component ────────────────────────────────────────────────────────────

export const DevRouteLabel: React.FC<DevRouteLabelProps> = ({
  domain    = "sts.figma.site",
  segments  = [],
  env       = "prod",
  method,
  screenLabel,
  bg        = "#0D1117",
  size      = "md",
}) => {
  const [copied, setCopied] = useState(false);

  const envCfg = ENV_CONFIG[env];
  const methodCfg = method ? METHOD_COLORS[method.toUpperCase()] : null;
  const path = "/" + segments.map(s => (typeof s === "string" ? s : s.value)).join("/");
  const fullUrl = `https://${domain}${path}`;

  const pad   = size === "sm" ? "4px 10px" : "5px 13px";
  const fsize = size === "sm" ? 10.5 : 11.5;
  const gap   = size === "sm" ? 4 : 6;

  const handleCopy = () => {
    navigator.clipboard?.writeText(fullUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const normalizedSegs = segments.map(normalizeSegment);

  return (
    <div
      title={fullUrl}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: gap,
        padding: pad,
        background: bg,
        borderRadius: 8,
        fontFamily: MONO,
        fontSize: fsize,
        lineHeight: 1,
        userSelect: "none",
        boxShadow: "0 2px 12px rgba(0,0,0,0.35), 0 1px 3px rgba(0,0,0,0.20), inset 0 1px 0 rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.08)",
        position: "relative",
        whiteSpace: "nowrap",
      }}
    >
      {/* ── Env dot + label ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 4,
        padding: "2px 6px",
        background: envCfg.bgTint,
        borderRadius: 4,
        border: `1px solid ${envCfg.dot}28`,
      }}>
        <div style={{
          width: fsize === 10.5 ? 5 : 6,
          height: fsize === 10.5 ? 5 : 6,
          borderRadius: "50%",
          background: envCfg.dot,
          boxShadow: `0 0 5px ${envCfg.dot}`,
          flexShrink: 0,
        }} />
        <span style={{ color: envCfg.labelColor, fontWeight: 700, fontSize: fsize - 0.5, letterSpacing: "0.05em" }}>
          {envCfg.label}
        </span>
      </div>

      {/* ── Separator ── */}
      <span style={{ color: "#334155", fontWeight: 300 }}>│</span>

      {/* ── Lock icon ── */}
      <Lock size={fsize - 1} color="#475569" strokeWidth={2} />

      {/* ── Domain ── */}
      <span style={{ color: "#64748B" }}>{domain}</span>

      {/* ── Path segments ── */}
      {normalizedSegs.map((seg, i) => (
        <React.Fragment key={i}>
          {/* slash */}
          <span style={{ color: "#475569", fontWeight: 300 }}>/</span>
          {/* segment */}
          {seg.type === "dynamic" ? (
            <span style={{
              color: "#FB923C",
              background: "rgba(251,146,60,0.10)",
              borderRadius: 3,
              padding: "1px 4px",
              border: "1px solid rgba(251,146,60,0.22)",
            }}>
              {seg.value}
            </span>
          ) : seg.type === "wildcard" ? (
            <span style={{ color: "#A78BFA" }}>{seg.value}</span>
          ) : i === normalizedSegs.length - 1 ? (
            // last static segment = primary accent
            <span style={{ color: "#38BDF8", fontWeight: 600 }}>{seg.value}</span>
          ) : (
            // intermediate static segment = muted white
            <span style={{ color: "#CBD5E1" }}>{seg.value}</span>
          )}
        </React.Fragment>
      ))}

      {/* ── HTTP Method badge ── */}
      {methodCfg && method && (
        <>
          <span style={{ color: "#334155", fontWeight: 300 }}>│</span>
          <span style={{
            padding: "1px 5px", borderRadius: 3,
            background: methodCfg.bg,
            color: methodCfg.text,
            fontWeight: 700, fontSize: fsize - 1,
            letterSpacing: "0.04em",
          }}>
            {method.toUpperCase()}
          </span>
        </>
      )}

      {/* ── Screen label ── */}
      {screenLabel && (
        <>
          <span style={{ color: "#1E293B", fontWeight: 300 }}>│</span>
          <span style={{
            fontFamily: "-apple-system, 'PingFang TC', sans-serif",
            fontSize: fsize - 1,
            color: "#64748B",
            fontWeight: 500,
            letterSpacing: 0,
          }}>
            {screenLabel}
          </span>
        </>
      )}

      {/* ── Copy button ── */}
      <button
        onClick={handleCopy}
        title="Copy URL"
        style={{
          marginLeft: 2,
          display: "flex", alignItems: "center", justifyContent: "center",
          width: fsize + 10, height: fsize + 10,
          background: copied ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.06)",
          border: `1px solid ${copied ? "rgba(74,222,128,0.3)" : "rgba(255,255,255,0.08)"}`,
          borderRadius: 4,
          cursor: "pointer",
          transition: "all 0.18s",
          padding: 0, flexShrink: 0,
        }}
        onMouseEnter={e => {
          if (!copied) (e.currentTarget.style.background = "rgba(255,255,255,0.12)");
        }}
        onMouseLeave={e => {
          if (!copied) (e.currentTarget.style.background = "rgba(255,255,255,0.06)");
        }}
      >
        {copied
          ? <Check size={fsize - 1} color="#4ADE80" strokeWidth={2.5} />
          : <Copy  size={fsize - 1} color="#64748B" strokeWidth={2} />
        }
      </button>
    </div>
  );
};

// ── Pre-built route variants for LALP ERP ────────────────────────────────────

export const LALP_ROUTES = {
  dashboard:      { segments: ["dashboard"],                          screenLabel: "今日概覽"    },
  roster:         { segments: ["roster", "f1a"],                      screenLabel: "班別列表"    },
  apiWebhooks:    { segments: ["admin", "api-webhooks"],              screenLabel: "API 串接"   },
  portfolio:      { segments: ["portfolio", "[student-id]"],          screenLabel: "學習歷程"   },
  studentProfile: { segments: ["students", "[year]", "[student-id]"], screenLabel: "學生檔案"   },
  groupBuilder:   { segments: ["groups", "new"],                      screenLabel: "建立群組"   },
  bulkAwards:     { segments: ["awards", "bulk-import"],              screenLabel: "批量建立"   },
  qrSignin:       { segments: ["events", "[event-id]", "qr-signin"], screenLabel: "QR 簽到"   },
  aiWorkspace:    { segments: ["ai", "workspace"],                    screenLabel: "AI 工作站"  },
  auditLog:       { segments: ["admin", "audit-log"],                 screenLabel: "審計日誌"   },
} as const;
