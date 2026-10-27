// ─────────────────────────────────────────────────────────────────────────────
// AcornBinding — shared ACORN dimension picker (Figma golden reference)
// Source of truth: Screen_Subjects drawer “ACORN 預設維度綁定”
// Soft pastel cards · hidden checkbox · stacked ZH/EN · pill summary
// ─────────────────────────────────────────────────────────────────────────────
import React from "react";
import { Check, ShieldCheck } from "lucide-react";
import { ERP, type AcornTagKey } from "./erpTokens";

export type AcornBindingItem = {
  /** Checkbox / form value (tag key or numeric id as string). */
  value: string;
  nameZh: string;
  nameEn: string;
};

/** Default six dimensions — matches acorn_dimensions seed / Subjects FALLBACK_ACORNS. */
export const DEFAULT_ACORN_ITEMS: AcornBindingItem[] = [
  { value: "認知", nameZh: "認知", nameEn: "Academic" },
  { value: "社群", nameZh: "社群", nameEn: "Collaborative" },
  { value: "創意", nameZh: "創意", nameEn: "Opportunity" },
  { value: "協作", nameZh: "協作", nameEn: "Realm" },
  { value: "領導", nameZh: "領導", nameEn: "Nurturing" },
  { value: "體適能", nameZh: "體適能", nameEn: "Faith" },
];

export function acornPastel(zh: string) {
  return (ERP.acornTags as Record<string, { bg: string; color: string; border: string }>)[zh]
    ?? { bg: ERP.colors.accentPale, color: ERP.colors.accent, border: ERP.colors.accentLight };
}

export function normalizeAcornTagKeys(raw: unknown): AcornTagKey[] {
  if (!Array.isArray(raw)) return [];
  const allowed = new Set(DEFAULT_ACORN_ITEMS.map(d => d.value));
  const out: AcornTagKey[] = [];
  const seen = new Set<string>();
  for (const t of raw) {
    const key = String(t || "").trim();
    if (!allowed.has(key) || seen.has(key)) continue;
    seen.add(key);
    out.push(key as AcornTagKey);
  }
  return out;
}

export interface AcornBindingProps {
  items?: AcornBindingItem[];
  /** Currently selected values (tag keys or id strings). */
  selectedValues: Array<string | number>;
  onToggle: (value: string) => void;
  /** Hidden checkbox `name` attribute. */
  inputName?: string;
  showHint?: boolean;
  hintText?: string;
  /** Subjects: only when selected. Assessments: always (empty state). */
  summaryMode?: "when-selected" | "always";
  /** Optional section divider title (Subjects drawer). */
  showDividerTitle?: boolean;
}

/**
 * Pixel-aligned with Subjects management ACORN binding:
 * inactive = pageBg + gray border; active = pastel bg/border + filled check + themed text.
 */
export const AcornBinding: React.FC<AcornBindingProps> = ({
  items = DEFAULT_ACORN_ITEMS,
  selectedValues,
  onToggle,
  inputName = "acorn_tags[]",
  showHint = true,
  hintText = "選擇此科目自動關聯的 ACORN 評估維度。AI 系統將依據此設定進行成就歸類。",
  summaryMode = "when-selected",
  showDividerTitle = false,
}) => {
  const F = ERP.font.family;
  const selectedSet = new Set(selectedValues.map(v => String(v)));
  const selectedItems = items.filter(i => selectedSet.has(String(i.value)));
  const showSummary = summaryMode === "always" || selectedItems.length > 0;

  return (
    <div className="acorn-binding" style={{ fontFamily: F }}>
      {showDividerTitle && (
        <div style={{ borderTop: `1px solid ${ERP.colors.border}`, margin: "20px 0 18px", position: "relative" }}>
          <span style={{
            position: "absolute", top: -9, left: 0, background: ERP.colors.surface, paddingRight: 10,
            fontSize: 11, fontWeight: 700, color: ERP.colors.textMuted, letterSpacing: "0.07em",
            textTransform: "uppercase", display: "flex", alignItems: "center", gap: 5,
          }}>
            <ShieldCheck size={11} />ACORN 預設維度綁定 · Default ACORN Binding
          </span>
        </div>
      )}

      {showHint && (
        <p style={{ margin: "0 0 12px", fontSize: 11, color: ERP.colors.textMuted, lineHeight: 1.5 }}>
          {hintText}
        </p>
      )}

      {/* ACORN checkboxes — 3×2 grid (Subjects golden reference) */}
      <div
        style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: showSummary ? 0 : 0 }}
        role="group"
        aria-label="ACORN dimensions"
      >
        {items.map(item => {
          const checked = selectedSet.has(String(item.value));
          const st = acornPastel(item.nameZh);
          return (
            <label
              key={String(item.value)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "9px 10px", borderRadius: ERP.radius.md, textAlign: "left",
                background: checked ? st.bg : ERP.colors.pageBg,
                border: `1.5px solid ${checked ? st.border : ERP.colors.border}`,
                cursor: "pointer", transition: "all 0.12s", fontFamily: F,
                boxShadow: checked ? `0 0 0 3px ${st.bg}` : "none",
                userSelect: "none",
              }}
            >
              <input
                type="checkbox"
                name={inputName}
                value={String(item.value)}
                checked={checked}
                onChange={() => onToggle(String(item.value))}
                style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
              />
              <div style={{
                width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                background: checked ? st.color : "transparent",
                border: `2px solid ${checked ? st.color : ERP.colors.borderStrong}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.12s",
              }}>
                {checked && <Check size={10} color="#fff" strokeWidth={3} />}
              </div>
              <div>
                <div style={{
                  fontSize: 12, fontWeight: 700, lineHeight: 1,
                  color: checked ? st.color : ERP.colors.textPrimary,
                }}>
                  {item.nameZh}
                </div>
                <div style={{ fontSize: 9, color: ERP.colors.textMuted, marginTop: 2 }}>
                  {item.nameEn}
                </div>
              </div>
            </label>
          );
        })}
      </div>

      {showSummary && (
        <div style={{
          marginTop: 12, padding: "8px 12px",
          background: ERP.colors.accentPale,
          borderRadius: ERP.radius.md,
          border: `1px solid ${ERP.colors.accentLight}`,
          display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center",
        }}>
          <span style={{ fontSize: 11, color: ERP.colors.accent, fontWeight: 600, whiteSpace: "nowrap" }}>
            已綁定：
          </span>
          {selectedItems.length === 0 ? (
            <span style={{ fontSize: 11, color: ERP.colors.textMuted }}>（尚未選擇）</span>
          ) : (
            selectedItems.map(item => {
              const st = acornPastel(item.nameZh);
              return (
                <span
                  key={String(item.value)}
                  className="rounded-pill"
                  style={{
                    fontSize: 11, padding: "1px 7px", borderRadius: 9999,
                    background: st.bg, color: st.color, border: `1px solid ${st.border}`,
                    fontWeight: 600,
                  }}
                >
                  {item.nameZh}
                </span>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
