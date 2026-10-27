// ─────────────────────────────────────────────────────────────────────────────
// Golden listing skeleton cloned from Frame03_ActivityTable (activity index).
// Do not invent new header / filter / table anatomy — reuse these primitives.
// ─────────────────────────────────────────────────────────────────────────────
import React from "react";
import { Plus, Search } from "lucide-react";
import { ERP } from "./erpTokens";

export const listingTH: React.CSSProperties = {
  padding: "10px 14px",
  textAlign: "left",
  fontSize: "11px",
  fontWeight: 700,
  color: ERP.colors.textSecondary,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
  background: "#F8FAFC",
  borderBottom: `2px solid ${ERP.colors.border}`,
};

export const listingTD: React.CSSProperties = {
  padding: "12px 14px",
  fontSize: 13,
  color: ERP.colors.textPrimary,
  borderBottom: `1px solid ${ERP.colors.border}`,
  verticalAlign: "middle",
};

export const ListingTH: React.FC<{
  children: React.ReactNode;
  width?: string;
  align?: "left" | "center" | "right";
}> = ({ children, width, align = "left" }) => (
  <th style={{ ...listingTH, width, textAlign: align }}>{children}</th>
);

export const GhostAction: React.FC<{
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
}> = ({ href, onClick, children }) => {
  const [hover, setHover] = React.useState(false);
  const style: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: "4px 9px",
    border: `1px solid ${hover ? ERP.colors.accent : ERP.colors.border}`,
    borderRadius: ERP.radius.sm,
    background: hover ? ERP.colors.accentPale : "transparent",
    color: hover ? ERP.colors.accent : ERP.colors.textSecondary,
    cursor: "pointer",
    fontSize: "11px",
    fontWeight: 600,
    fontFamily: ERP.font.family,
    transition: "all 0.13s",
    whiteSpace: "nowrap",
    textDecoration: "none",
  };
  const events = {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
  };
  if (href) {
    return (
      <a href={href} style={style} {...events}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} style={style} {...events}>
      {children}
    </button>
  );
};

export const StatusPill: React.FC<{ label: string; tone: "success" | "warning" | "muted" | "danger" }> = ({
  label,
  tone,
}) => {
  const map = {
    success: { bg: "#D1FAE5", color: "#065F46", border: "#6EE7B7" },
    warning: { bg: "#FEF3C7", color: "#92400E", border: "#FCD34D" },
    muted:   { bg: "#E2E8F0", color: "#475569", border: "#CBD5E1" },
    danger:  { bg: "#FEE2E2", color: "#991B1B", border: "#FECACA" },
  }[tone];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      padding: "3px 10px", background: map.bg, color: map.color,
      border: `1px solid ${map.border}`, borderRadius: ERP.radius.full,
      fontSize: "11px", fontWeight: 700, whiteSpace: "nowrap",
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: map.color, display: "inline-block", flexShrink: 0 }} />
      {label}
    </span>
  );
};

type Props = {
  title: string;
  subtitle: string;
  count: number;
  countUnit: string;
  primaryLabel: string;
  onPrimary: () => void;
  search: string;
  onSearch: (v: string) => void;
  searchPlaceholder: string;
  resultCount: number;
  flashSuccess?: string;
  flashError?: string;
  children: React.ReactNode;
};

export const ListingPageShell: React.FC<Props> = ({
  title, subtitle, count, countUnit, primaryLabel, onPrimary,
  search, onSearch, searchPlaceholder, resultCount,
  flashSuccess, flashError, children,
}) => {
  const F = ERP.font.family;
  return (
    <div style={{ position: "relative", fontFamily: F, height: "100%", overflow: "hidden" }}>
      <div style={{ padding: ERP.layout.contentPad, minHeight: "100%", overflow: "auto" }}>
        <div style={{
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          marginBottom: 16, gap: 12, flexWrap: "wrap",
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: ERP.colors.textPrimary, lineHeight: 1 }}>
                {title}
              </h1>
              <span style={{
                fontSize: 11, fontWeight: 700,
                background: ERP.colors.accentLight, color: ERP.colors.accentDark,
                border: `1px solid ${ERP.colors.accent}40`,
                borderRadius: ERP.radius.full, padding: "2px 10px",
              }}>
                {count} {countUnit}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: ERP.colors.textSecondary, lineHeight: 1.4 }}>
              {subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onPrimary}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 16px", flexShrink: 0,
              border: "none", borderRadius: ERP.radius.md,
              background: ERP.colors.accent, color: "#fff",
              cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: F,
              boxShadow: `0 2px 8px ${ERP.colors.accent}40`,
            }}
          >
            <Plus size={15} /> {primaryLabel}
          </button>
        </div>

        {(flashSuccess || flashError) && (
          <div style={{
            marginBottom: 12, padding: "10px 14px", borderRadius: ERP.radius.md,
            fontSize: 13, fontWeight: 600,
            background: flashError ? ERP.colors.redLight : ERP.colors.successLight,
            color: flashError ? ERP.colors.red : ERP.colors.success,
          }}>
            {flashError || flashSuccess}
          </div>
        )}

        <div style={{
          display: "flex", flexDirection: "column", gap: 8,
          padding: "12px 16px", background: ERP.colors.surface,
          border: `1px solid ${ERP.colors.border}`,
          borderRadius: `${ERP.radius.md} ${ERP.radius.md} 0 0`, borderBottom: "none",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Search size={14} color={ERP.colors.textMuted} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
              <input
                value={search}
                onChange={(e) => onSearch(e.target.value)}
                placeholder={searchPlaceholder}
                style={{
                  width: "100%", paddingLeft: 32, paddingRight: 12,
                  paddingTop: 7, paddingBottom: 7,
                  border: `1px solid ${ERP.colors.border}`, borderRadius: ERP.radius.md,
                  fontSize: 13, fontFamily: F, outline: "none",
                  color: ERP.colors.textPrimary, background: ERP.colors.pageBg, boxSizing: "border-box",
                }}
              />
            </div>
            <span style={{ fontSize: 12, color: ERP.colors.textMuted, whiteSpace: "nowrap", marginLeft: "auto" }}>
              {resultCount} 條
            </span>
          </div>
        </div>

        <div style={{
          background: ERP.colors.surface,
          border: `1px solid ${ERP.colors.border}`,
          borderRadius: `0 0 ${ERP.radius.md} ${ERP.radius.md}`,
          overflow: "hidden", boxShadow: ERP.shadow.card,
        }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export const EmptyRow: React.FC<{ colSpan: number; text: string }> = ({ colSpan, text }) => (
  <tr>
    <td colSpan={colSpan} style={{ padding: 40, textAlign: "center", color: ERP.colors.textMuted, fontSize: 14 }}>
      {text}
    </td>
  </tr>
);
