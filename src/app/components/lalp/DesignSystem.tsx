import React, { useState } from "react";
import { Shield, Calendar, ChevronDown } from "lucide-react";

// ─── Design Tokens ────────────────────────────────────────────────────────────
export const DS = {
  colors: {
    primary: "#1A56DB",
    primaryLight: "#EBF2FF",
    primaryDark: "#1347BF",
    secondary: "#10B981",
    secondaryLight: "#D1FAE5",
    background: "#F9FAFB",
    surface: "#FFFFFF",
    error: "#EF4444",
    errorLight: "#FEE2E2",
    warning: "#F59E0B",
    warningLight: "#FEF3C7",
    textPrimary: "#111827",
    textSecondary: "#6B7280",
    textMuted: "#9CA3AF",
    border: "#E5E7EB",
    borderFocus: "#1A56DB",
  },
  spacing: { xs: "4px", sm: "8px", md: "16px", lg: "24px", xl: "32px" },
  radius: { sm: "4px", md: "8px", lg: "12px", xl: "16px", full: "9999px" },
  shadow: {
    sm: "0 1px 3px rgba(0,0,0,0.08)",
    md: "0 4px 12px rgba(0,0,0,0.10)",
    lg: "0 8px 24px rgba(0,0,0,0.12)",
  },
  font: { family: "'Inter', sans-serif" },
};

// ─── StatusBadge ─────────────────────────────────────────────────────────────
type StatusVariant =
  | "present" | "absent" | "exempt" | "active" | "synced"
  | "pending" | "error" | "warning" | "info";

const STATUS_MAP: Record<StatusVariant, { bg: string; color: string; label: string }> = {
  present:  { bg: "#D1FAE5", color: "#065F46", label: "PRESENT" },
  absent:   { bg: "#FEE2E2", color: "#991B1B", label: "ABS" },
  exempt:   { bg: "#FEF3C7", color: "#92400E", label: "EXEMPT" },
  active:   { bg: "#EBF2FF", color: "#1E40AF", label: "Active" },
  synced:   { bg: "#D1FAE5", color: "#065F46", label: "Synced" },
  pending:  { bg: "#F3F4F6", color: "#374151", label: "Pending" },
  error:    { bg: "#FEE2E2", color: "#991B1B", label: "Error" },
  warning:  { bg: "#FEF3C7", color: "#92400E", label: "Warning" },
  info:     { bg: "#EBF2FF", color: "#1E40AF", label: "Info" },
};

interface StatusBadgeProps {
  variant: StatusVariant;
  label?: string;
  size?: "sm" | "md";
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ variant, label, size = "md" }) => {
  const cfg = STATUS_MAP[variant];
  const px = size === "sm" ? "6px 10px" : "4px 10px";
  const fs = size === "sm" ? "11px" : "12px";
  return (
    <span
      style={{
        background: cfg.bg,
        color: cfg.color,
        padding: px,
        borderRadius: DS.radius.full,
        fontSize: fs,
        fontWeight: 600,
        letterSpacing: "0.04em",
        whiteSpace: "nowrap",
        fontFamily: DS.font.family,
      }}
    >
      {label ?? cfg.label}
    </span>
  );
};

// ─── DataPrivacyShield ────────────────────────────────────────────────────────
export const DataPrivacyShield: React.FC<{ label?: string }> = ({ label }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
      background: "#EEF2FF",
      color: "#4338CA",
      border: "1px solid #C7D2FE",
      padding: "2px 8px",
      borderRadius: DS.radius.sm,
      fontSize: "11px",
      fontWeight: 600,
      fontFamily: DS.font.family,
      whiteSpace: "nowrap",
    }}
  >
    <Shield size={11} />
    {label ?? "已脫敏 Masked 🛡️"}
  </span>
);

// ─── ToggleSwitch ─────────────────────────────────────────────────────────────
interface ToggleSwitchProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ checked, onChange, label, disabled }) => (
  <label
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1,
    }}
  >
    <span
      onClick={() => !disabled && onChange(!checked)}
      style={{
        position: "relative",
        width: "40px",
        height: "22px",
        background: checked ? DS.colors.primary : "#D1D5DB",
        borderRadius: DS.radius.full,
        transition: "background 0.2s",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: "2px",
          left: checked ? "20px" : "2px",
          width: "18px",
          height: "18px",
          background: "#fff",
          borderRadius: "50%",
          boxShadow: DS.shadow.sm,
          transition: "left 0.2s",
        }}
      />
    </span>
    {label && (
      <span style={{ fontSize: "14px", color: DS.colors.textPrimary, fontFamily: DS.font.family }}>
        {label}
      </span>
    )}
  </label>
);

// ─── DateRangePicker ──────────────────────────────────────────────────────────
interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
  label?: string;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate, endDate, onChange, label,
}) => {
  const [open, setOpen] = useState(false);
  const [localStart, setLocalStart] = useState(startDate);
  const [localEnd, setLocalEnd] = useState(endDate);

  const apply = () => {
    onChange(localStart, localEnd);
    setOpen(false);
  };

  return (
    <div style={{ position: "relative", display: "inline-block", fontFamily: DS.font.family }}>
      {label && (
        <div style={{ fontSize: "12px", color: DS.colors.textSecondary, marginBottom: "4px", fontWeight: 500 }}>
          {label}
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 12px",
          background: DS.colors.surface,
          border: `1px solid ${DS.colors.border}`,
          borderRadius: DS.radius.md,
          fontSize: "14px",
          color: DS.colors.textPrimary,
          cursor: "pointer",
          boxShadow: DS.shadow.sm,
        }}
      >
        <Calendar size={14} color={DS.colors.primary} />
        {startDate || "Start"} → {endDate || "End"}
        <ChevronDown size={14} color={DS.colors.textSecondary} />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            zIndex: 1000,
            background: DS.colors.surface,
            border: `1px solid ${DS.colors.border}`,
            borderRadius: DS.radius.lg,
            padding: "16px",
            boxShadow: DS.shadow.lg,
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            minWidth: "280px",
          }}
        >
          <div>
            <div style={{ fontSize: "12px", fontWeight: 600, color: DS.colors.textSecondary, marginBottom: "4px" }}>
              Start Date
            </div>
            <input
              type="date"
              value={localStart}
              onChange={(e) => setLocalStart(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                border: `1px solid ${DS.colors.border}`,
                borderRadius: DS.radius.md,
                fontSize: "14px",
                color: DS.colors.textPrimary,
              }}
            />
          </div>
          <div>
            <div style={{ fontSize: "12px", fontWeight: 600, color: DS.colors.textSecondary, marginBottom: "4px" }}>
              End Date
            </div>
            <input
              type="date"
              value={localEnd}
              onChange={(e) => setLocalEnd(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                border: `1px solid ${DS.colors.border}`,
                borderRadius: DS.radius.md,
                fontSize: "14px",
                color: DS.colors.textPrimary,
              }}
            />
          </div>
          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
            <button
              onClick={() => setOpen(false)}
              style={{
                padding: "6px 14px",
                background: "transparent",
                border: `1px solid ${DS.colors.border}`,
                borderRadius: DS.radius.md,
                fontSize: "13px",
                cursor: "pointer",
                color: DS.colors.textSecondary,
              }}
            >
              Cancel
            </button>
            <button
              onClick={apply}
              style={{
                padding: "6px 14px",
                background: DS.colors.primary,
                border: "none",
                borderRadius: DS.radius.md,
                fontSize: "13px",
                cursor: "pointer",
                color: "#fff",
                fontWeight: 600,
              }}
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── FloatingBatchActionBar ───────────────────────────────────────────────────
interface BatchAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: "primary" | "danger" | "secondary";
}

interface FloatingBatchActionBarProps {
  selectedCount: number;
  actions: BatchAction[];
  onClear: () => void;
  /** Optional i18n override for the "N items selected" label */
  countLabel?: string;
  /** Optional i18n override for the "Clear" button */
  clearLabel?: string;
}

export const FloatingBatchActionBar: React.FC<FloatingBatchActionBarProps> = ({
  selectedCount, actions, onClear, countLabel, clearLabel,
}) => {
  if (selectedCount === 0) return null;
  const defaultCountLabel = `${selectedCount} item${selectedCount !== 1 ? "s" : ""} selected`;
  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 2000,
        background: "#1F2937",
        borderRadius: DS.radius.xl,
        padding: "12px 20px",
        display: "flex",
        alignItems: "center",
        gap: "16px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.24)",
        fontFamily: DS.font.family,
        color: "#fff",
        minWidth: "420px",
      }}
    >
      <span style={{ fontSize: "14px", fontWeight: 600, whiteSpace: "nowrap" }}>
        {countLabel ?? defaultCountLabel}
      </span>
      <div style={{ width: "1px", height: "20px", background: "#374151" }} />
      <div style={{ display: "flex", gap: "8px", flex: 1 }}>
        {actions.map((action, i) => (
          <button
            key={i}
            onClick={action.onClick}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 14px",
              borderRadius: DS.radius.md,
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              border: "none",
              background:
                action.variant === "danger"
                  ? "#DC2626"
                  : action.variant === "secondary"
                  ? "#374151"
                  : DS.colors.primary,
              color: "#fff",
              transition: "opacity 0.15s",
            }}
          >
            {action.icon}
            {action.label}
          </button>
        ))}
      </div>
      <button
        onClick={onClear}
        style={{
          background: "transparent",
          border: "1px solid #4B5563",
          borderRadius: DS.radius.md,
          color: "#9CA3AF",
          fontSize: "13px",
          padding: "6px 12px",
          cursor: "pointer",
        }}
      >
        {clearLabel ?? "Clear"}
      </button>
    </div>
  );
};

// ─── Card ─────────────────────────────────────────────────────────────────────
export const Card: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  onClick?: () => void;
}> = ({ children, style, onClick }) => (
  <div
    onClick={onClick}
    style={{
      background: DS.colors.surface,
      border: `1px solid ${DS.colors.border}`,
      borderRadius: DS.radius.lg,
      boxShadow: DS.shadow.sm,
      ...style,
    }}
  >
    {children}
  </div>
);

// ─── Btn ──────────────────────────────────────────────────────────────────────
interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Btn: React.FC<BtnProps> = ({
  children, variant = "primary", size = "md", icon, fullWidth, style, ...rest
}) => {
  const bg: Record<string, string> = {
    primary: DS.colors.primary,
    secondary: DS.colors.surface,
    ghost: "transparent",
    danger: DS.colors.error,
  };
  const border: Record<string, string> = {
    primary: "none",
    secondary: `1px solid ${DS.colors.border}`,
    ghost: "none",
    danger: "none",
  };
  const color: Record<string, string> = {
    primary: "#fff",
    secondary: DS.colors.textPrimary,
    ghost: DS.colors.primary,
    danger: "#fff",
  };
  const pad: Record<string, string> = { sm: "6px 12px", md: "8px 16px", lg: "10px 20px" };
  const fs: Record<string, string> = { sm: "12px", md: "14px", lg: "15px" };

  return (
    <button
      {...rest}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        padding: pad[size],
        background: bg[variant],
        border: border[variant],
        borderRadius: DS.radius.md,
        fontSize: fs[size],
        fontWeight: 600,
        color: color[variant],
        cursor: "pointer",
        fontFamily: DS.font.family,
        width: fullWidth ? "100%" : "auto",
        transition: "opacity 0.15s, box-shadow 0.15s",
        boxShadow: variant === "primary" ? "0 1px 4px rgba(26,86,219,0.3)" : undefined,
        ...style,
      }}
    >
      {icon}
      {children}
    </button>
  );
};

// ─── SectionHeader ────────────────────────────────────────────────────────────
export const SectionHeader: React.FC<{
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
}> = ({ title, subtitle, actions, badge }) => (
  <div
    style={{
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      marginBottom: "16px",
      fontFamily: DS.font.family,
    }}
  >
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: 700, color: DS.colors.textPrimary, margin: 0 }}>
          {title}
        </h2>
        {badge}
      </div>
      {subtitle && (
        <p style={{ fontSize: "13px", color: DS.colors.textSecondary, margin: "2px 0 0" }}>
          {subtitle}
        </p>
      )}
    </div>
    {actions && <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>{actions}</div>}
  </div>
);

// ─── InputField ───────────────────────────────────────────────────────────────
export const InputField: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  hint?: string;
}> = ({ label, value, onChange, placeholder, type = "text", hint }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontFamily: DS.font.family }}>
    <label style={{ fontSize: "13px", fontWeight: 600, color: DS.colors.textSecondary }}>
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        padding: "8px 12px",
        border: `1px solid ${DS.colors.border}`,
        borderRadius: DS.radius.md,
        fontSize: "14px",
        color: DS.colors.textPrimary,
        background: DS.colors.surface,
        outline: "none",
        fontFamily: DS.font.family,
      }}
    />
    {hint && (
      <span style={{ fontSize: "11px", color: DS.colors.textMuted }}>{hint}</span>
    )}
  </div>
);

// ─── SelectField ──────────────────────────────────────────────────────────────
export const SelectField: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  hint?: string;
}> = ({ label, value, onChange, options, hint }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontFamily: DS.font.family }}>
    <label style={{ fontSize: "13px", fontWeight: 600, color: DS.colors.textSecondary }}>
      {label}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        padding: "8px 12px",
        border: `1px solid ${DS.colors.border}`,
        borderRadius: DS.radius.md,
        fontSize: "14px",
        color: DS.colors.textPrimary,
        background: DS.colors.surface,
        outline: "none",
        fontFamily: DS.font.family,
        cursor: "pointer",
      }}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
    {hint && (
      <span style={{ fontSize: "11px", color: DS.colors.textMuted }}>{hint}</span>
    )}
  </div>
);

// ─── StatCard ─────────────────────────────────────────────────────────────────
export const StatCard: React.FC<{
  label: string;
  value: string | number;
  delta?: string;
  positive?: boolean;
  icon?: React.ReactNode;
  color?: string;
}> = ({ label, value, delta, positive, icon, color }) => (
  <Card style={{ padding: "16px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div>
        <div style={{ fontSize: "12px", color: DS.colors.textSecondary, fontWeight: 500, fontFamily: DS.font.family }}>
          {label}
        </div>
        <div
          style={{
            fontSize: "24px",
            fontWeight: 700,
            color: color ?? DS.colors.textPrimary,
            marginTop: "4px",
            fontFamily: DS.font.family,
          }}
        >
          {value}
        </div>
        {delta && (
          <div
            style={{
              fontSize: "12px",
              color: positive ? DS.colors.secondary : DS.colors.error,
              marginTop: "2px",
              fontFamily: DS.font.family,
            }}
          >
            {positive ? "▲" : "▼"} {delta}
          </div>
        )}
      </div>
      {icon && (
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: DS.radius.lg,
            background: color ? `${color}18` : DS.colors.primaryLight,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </div>
      )}
    </div>
  </Card>
);
