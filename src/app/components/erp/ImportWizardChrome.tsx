// Shared stepper + action-bar chrome for Data Import wizards (1.F.1).
// Active pills ALWAYS use solid blue + white text (never white-on-white).
import React from "react";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { ERP } from "./erpTokens";

const F = ERP.font.family;
const C = ERP.colors;
const BLUE = C.accent; // #2563EB — high-contrast primary

export type WizardStepDef = { n: number; label: string };

export function wizardPrimaryBtn(disabled = false): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "10px 16px",
    borderRadius: 8,
    border: "none",
    background: disabled ? "#94A3B8" : BLUE,
    color: "#FFFFFF",
    fontWeight: 800,
    fontSize: 13,
    fontFamily: F,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.85 : 1,
    boxShadow: disabled ? "none" : "0 1px 2px rgba(37,99,235,0.35)",
  };
}

export function wizardSecondaryBtn(): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "10px 14px",
    borderRadius: 8,
    border: `1px solid ${C.border}`,
    background: "#FFFFFF",
    color: C.textSecondary,
    fontWeight: 700,
    fontSize: 13,
    fontFamily: F,
    cursor: "pointer",
  };
}

export function wizardConfirmBtn(disabled = false): React.CSSProperties {
  return {
    ...wizardPrimaryBtn(disabled),
    background: disabled ? "#94A3B8" : "#1D4ED8",
    padding: "12px 18px",
    fontSize: 14,
  };
}

/** Clickable sub-step pills — active = solid blue + white. */
export const WizardStepper: React.FC<{
  steps: WizardStepDef[];
  step: number;
  onJump?: (n: number) => void;
  /** Max step the user may jump to (defaults to current step). */
  maxReachable?: number;
}> = ({ steps, step, onJump, maxReachable }) => {
  const reach = maxReachable ?? step;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      {steps.map(({ n, label }) => {
        const active = step === n;
        const done = step > n;
        const clickable = !!onJump && n <= reach && n !== step;
        return (
          <button
            key={n}
            type="button"
            disabled={!clickable}
            onClick={() => { if (clickable) onJump?.(n); }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 700,
              fontFamily: F,
              border: active
                ? `1.5px solid ${BLUE}`
                : done
                  ? "1.5px solid #86EFAC"
                  : `1.5px solid ${C.border}`,
              background: active ? BLUE : done ? "#DCFCE7" : "#F1F5F9",
              color: active ? "#FFFFFF" : done ? "#15803D" : C.textMuted,
              cursor: clickable ? "pointer" : "default",
              boxShadow: active ? "0 1px 3px rgba(37,99,235,0.35)" : "none",
            }}
          >
            {done ? <CheckCircle2 size={12} color="#15803D" /> : (
              <span style={{
                width: 16, height: 16, borderRadius: "50%",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                background: active ? "rgba(255,255,255,0.25)" : "#E2E8F0",
                color: active ? "#fff" : C.textMuted,
                fontSize: 10, fontWeight: 800,
              }}>{n}</span>
            )}
            {label}
          </button>
        );
      })}
    </div>
  );
};

/** Sticky-feeling bottom action row for every sub-step. */
export const WizardActionBar: React.FC<{
  onBack?: () => void;
  backLabel?: string;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  onConfirm?: () => void;
  confirmLabel?: string;
  confirmDisabled?: boolean;
  confirmBusy?: boolean;
}> = ({
  onBack,
  backLabel = "← 上一步",
  onNext,
  nextLabel = "下一步 →",
  nextDisabled = false,
  onConfirm,
  confirmLabel = "🚀 確認寫入資料庫",
  confirmDisabled = false,
  confirmBusy = false,
}) => (
  <div style={{
    marginTop: 14,
    padding: "12px 14px",
    borderRadius: 10,
    background: "#EFF6FF",
    border: `1px solid ${C.accentLight}`,
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: onBack ? "space-between" : "flex-end",
    alignItems: "center",
  }}>
    {onBack ? (
      <button type="button" onClick={onBack} style={wizardSecondaryBtn()}>
        <ArrowLeft size={14} /> {backLabel.replace(/^←\s*/, "")}
      </button>
    ) : <span />}
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "flex-end" }}>
      {onNext && (
        <button
          type="button"
          disabled={nextDisabled}
          onClick={onNext}
          style={wizardPrimaryBtn(nextDisabled)}
        >
          {nextLabel} <ArrowRight size={14} />
        </button>
      )}
      {onConfirm && (
        <button
          type="button"
          disabled={confirmDisabled || confirmBusy}
          onClick={onConfirm}
          style={wizardConfirmBtn(confirmDisabled || confirmBusy)}
        >
          {confirmBusy ? "寫入中…" : confirmLabel}
        </button>
      )}
    </div>
  </div>
);

export default WizardStepper;
