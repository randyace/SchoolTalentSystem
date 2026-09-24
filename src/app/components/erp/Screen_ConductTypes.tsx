// ─────────────────────────────────────────────────────────────────────────────
// Screen: 行為與考勤類別管理 — Conduct & Attendance Types Configuration
// Frame: 系統管理 > 系統參數設定 > 行為與考勤類別
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect } from "react";
import { ERP } from "./erpTokens";
import {
  Plus, X, ChevronRight, Edit2, EyeOff, CheckCircle2,
  Check, Info, Scale, Minus, AlertCircle,
} from "lucide-react";

// ── Tokens ────────────────────────────────────────────────────────────────────
const F = ERP.font.family;
const C = ERP.colors;
const R = ERP.radius;
const DRAWER_W = 440;

// ── Types ─────────────────────────────────────────────────────────────────────
type Category = "conduct" | "attendance";
type Status   = "active"  | "disabled";

interface ConductType {
  id:          string;
  zhName:      string;
  enName:      string;
  category:    Category;
  color:       string;
  colorLabel:  string;
  acornDim:    string | null;
  acornPoints: number;
  status:      Status;
}

// ── Static config ─────────────────────────────────────────────────────────────
const CATEGORY_META: Record<Category, { zh: string; en: string; bg: string; color: string; border: string }> = {
  conduct:    { zh: "行為獎懲", en: "Conduct",    bg: "#EFF6FF", color: "#1D4ED8", border: "#BFDBFE" },
  attendance: { zh: "考勤記錄", en: "Attendance", bg: "#CCFBF1", color: "#0F766E", border: "#99F6E4" },
};

const COLOR_SWATCHES = [
  { hex: "#DC2626", zhLabel: "紅色", enLabel: "Red"    },
  { hex: "#EA580C", zhLabel: "橙色", enLabel: "Orange" },
  { hex: "#D97706", zhLabel: "黃色", enLabel: "Amber"  },
  { hex: "#16A34A", zhLabel: "綠色", enLabel: "Green"  },
  { hex: "#2563EB", zhLabel: "藍色", enLabel: "Blue"   },
  { hex: "#7C3AED", zhLabel: "紫色", enLabel: "Purple" },
];

// ACORN impact dimensions — superset including conduct-specific dims
const ACORN_DIMS = [
  { key: "無影響", label: "No Impact",   color: C.textMuted, bg: C.pageBg, border: C.border },
  { key: "社群",   label: "Community",   ...ERP.acornTags["社群"]  },
  { key: "協作",   label: "Teamwork",    ...ERP.acornTags["協作"]  },
  { key: "領導",   label: "Leadership",  ...ERP.acornTags["領導"]  },
  { key: "認知",   label: "Cognition",   ...ERP.acornTags["認知"]  },
  { key: "創意",   label: "Creativity",  ...ERP.acornTags["創意"]  },
  { key: "體適能", label: "Physical",    ...ERP.acornTags["體適能"]},
];

// ── Initial data (5 rows for richness) ───────────────────────────────────────
const INITIAL_TYPES: ConductType[] = [
  { id: "c1", zhName: "小功",  enName: "Minor Merit",            category: "conduct",
    color: "#16A34A", colorLabel: "綠色", acornDim: "社群",   acornPoints: 2,  status: "active"   },
  { id: "c2", zhName: "遲到",  enName: "Late Arrival",           category: "attendance",
    color: "#EA580C", colorLabel: "橙色", acornDim: "協作",   acornPoints: -1, status: "active"   },
  { id: "c3", zhName: "病假",  enName: "Sick Leave",             category: "attendance",
    color: "#2563EB", colorLabel: "藍色", acornDim: null,     acornPoints: 0,  status: "active"   },
  { id: "c4", zhName: "大功",  enName: "Major Merit",            category: "conduct",
    color: "#7C3AED", colorLabel: "紫色", acornDim: "領導",   acornPoints: 5,  status: "active"   },
  { id: "c5", zhName: "曠課",  enName: "Absence without Leave",  category: "attendance",
    color: "#DC2626", colorLabel: "紅色", acornDim: "社群",   acornPoints: -3, status: "disabled" },
];

// ── Sub-components ────────────────────────────────────────────────────────────

const CategoryBadge: React.FC<{ cat: Category }> = ({ cat }) => {
  const m = CATEGORY_META[cat];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 9px", borderRadius: R.full,
      background: m.bg, border: `1px solid ${m.border}`,
      fontSize: 11, fontWeight: 700, color: m.color, fontFamily: F,
      whiteSpace: "nowrap" as const,
    }}>
      {m.zh}
      <span style={{ fontSize: 10, fontWeight: 400, color: m.color + "99" }}>· {m.en}</span>
    </span>
  );
};

const ColorDot: React.FC<{ hex: string; label: string }> = ({ hex, label }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
    <span style={{
      display: "inline-block", width: 10, height: 10, borderRadius: "50%",
      background: hex, border: `1.5px solid ${hex}55`, flexShrink: 0,
      boxShadow: `0 0 0 2px ${hex}22`,
    }} />
    <span style={{ fontSize: 12, color: C.textSecondary, fontFamily: F }}>{label}</span>
  </span>
);

const AcornImpactCell: React.FC<{ dim: string | null; points: number }> = ({ dim, points }) => {
  if (!dim || dim === "無影響" || points === 0) {
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: "3px 9px", borderRadius: R.full,
        background: C.pageBg, border: `1px solid ${C.border}`,
        fontSize: 11, color: C.textMuted, fontFamily: F,
      }}>
        — 無影響
      </span>
    );
  }
  const tag  = ERP.acornTags[dim] ?? { bg: C.pageBg, color: C.textMuted, border: C.border };
  const pos  = points > 0;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        padding: "3px 8px", borderRadius: R.full,
        background: tag.bg, border: `1px solid ${tag.border}`,
        fontSize: 11, fontWeight: 700, color: tag.color, fontFamily: F,
      }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: tag.color, flexShrink: 0 }} />
        {dim}
      </span>
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 2,
        padding: "2px 7px", borderRadius: R.full,
        background: pos ? "#DCFCE7" : "#FEE2E2",
        border: `1px solid ${pos ? "#A7F3D0" : "#FECACA"}`,
        fontSize: 11, fontWeight: 800, fontFamily: F,
        color: pos ? "#15803D" : "#B91C1C",
      }}>
        {pos ? "+" : ""}{points}
      </span>
    </span>
  );
};

const StatusBadge: React.FC<{ status: Status }> = ({ status }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: 5,
    padding: "3px 10px", borderRadius: R.full,
    background: status === "active" ? "#D1FAE5" : "#FEE2E2",
    border:  `1px solid ${status === "active" ? "#6EE7B7" : "#FECACA"}`,
    color:   status === "active" ? "#065F46" : "#991B1B",
    fontSize: 11, fontWeight: 700, fontFamily: F,
  }}>
    <span style={{
      width: 5, height: 5, borderRadius: "50%", flexShrink: 0,
      background: status === "active" ? "#059669" : "#DC2626",
    }} />
    {status === "active" ? "啟用 Active" : "停用 Disabled"}
  </span>
);

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void }> = ({ checked, onChange }) => (
  <button
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    style={{
      width: 40, height: 22, borderRadius: R.full,
      background: checked ? C.accent : C.border,
      border: "none", cursor: "pointer", padding: 2,
      position: "relative", flexShrink: 0, transition: "background 0.2s",
    }}
  >
    <div style={{
      width: 18, height: 18, borderRadius: "50%", background: "#fff",
      transform: checked ? "translateX(18px)" : "translateX(0)",
      transition: "transform 0.2s",
      boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
    }} />
  </button>
);

// ── Section label reused inside drawer ───────────────────────────────────────
const DrawerSection: React.FC<{ icon: React.ReactNode; zh: string; en: string }> = ({ icon, zh, en }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: 5,
    paddingTop: 16, marginBottom: 14,
    borderTop: `1px solid ${C.border}`,
    fontSize: 10, fontWeight: 700, color: C.textMuted,
    letterSpacing: "0.08em", textTransform: "uppercase" as const,
  }}>
    {icon}{zh} · {en}
  </div>
);

// ── Drawer ────────────────────────────────────────────────────────────────────
interface DrawerForm {
  zhName:      string;
  enName:      string;
  category:    Category;
  color:       string;
  colorLabel:  string;
  acornDim:    string;  // "無影響" = none
  acornPoints: number;
  status:      Status;
}

const EditDrawer: React.FC<{
  item:    ConductType;
  onClose: () => void;
  onSave:  (updated: ConductType) => void;
}> = ({ item, onClose, onSave }) => {
  const [form, setForm] = useState<DrawerForm>({
    zhName:      item.zhName,
    enName:      item.enName,
    category:    item.category,
    color:       item.color,
    colorLabel:  item.colorLabel,
    acornDim:    item.acornDim ?? "無影響",
    acornPoints: item.acornPoints,
    status:      item.status,
  });

  const catMeta = CATEGORY_META[form.category];
  const hasImpact = form.acornDim !== "無影響";
  const dimTag = ERP.acornTags[form.acornDim] ?? null;

  const setField = <K extends keyof DrawerForm>(k: K, v: DrawerForm[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const handleSave = () =>
    onSave({
      ...item,
      zhName:      form.zhName,
      enName:      form.enName,
      category:    form.category,
      color:       form.color,
      colorLabel:  form.colorLabel,
      acornDim:    form.acornDim === "無影響" ? null : form.acornDim,
      acornPoints: form.acornDim === "無影響" ? 0 : form.acornPoints,
      status:      form.status,
    });

  const inputStyle: React.CSSProperties = {
    width: "100%", boxSizing: "border-box",
    padding: "8px 12px", borderRadius: R.md,
    border: `1px solid ${C.border}`,
    background: C.surface, color: C.textPrimary,
    fontSize: 13, fontFamily: F, outline: "none",
  };

  return (
    <>
      {/* ── Drawer Header ── */}
      <div style={{
        padding: "16px 20px", borderBottom: `1px solid ${C.border}`,
        background: C.surface, flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: R.md, flexShrink: 0,
              background: form.color + "18",
              border: `1.5px solid ${form.color}50`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Scale size={16} color={form.color} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: C.textPrimary, fontFamily: F }}>
                  編輯類別
                </span>
                <span style={{
                  fontSize: 13, fontWeight: 700, fontFamily: F,
                  padding: "2px 10px", borderRadius: R.full,
                  background: form.color + "18",
                  border: `1px solid ${form.color}40`,
                  color: form.color,
                }}>
                  {form.zhName}
                </span>
              </div>
              <div style={{ fontSize: 11, color: C.textMuted, fontFamily: F, marginTop: 2 }}>
                Edit Type · 修改行為 / 考勤類別參數
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none", border: `1px solid ${C.border}`,
              cursor: "pointer", padding: 5, borderRadius: R.sm,
              color: C.textMuted, display: "flex", flexShrink: 0,
            }}
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* ── Form body ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 0" }}>

        {/* ─ Section 1: Basic Info ─ */}
        <div style={{
          fontSize: 10, fontWeight: 700, color: C.textMuted,
          letterSpacing: "0.08em", textTransform: "uppercase" as const,
          marginBottom: 16, display: "flex", alignItems: "center", gap: 5,
        }}>
          <Scale size={10} />基本資料 · Basic Information
        </div>

        {/* Type Name zh */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.textSecondary, marginBottom: 5, fontFamily: F }}>
            類別名稱
            <span style={{ fontSize: 10, fontWeight: 400, color: C.textMuted, marginLeft: 6 }}>Type Name (ZH)</span>
          </label>
          <input
            value={form.zhName}
            onChange={e => setField("zhName", e.target.value)}
            style={inputStyle}
            onFocus={e => (e.currentTarget.style.borderColor = C.accent)}
            onBlur={e  => (e.currentTarget.style.borderColor = C.border)}
          />
        </div>

        {/* EN Name */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.textSecondary, marginBottom: 5, fontFamily: F }}>
            英文名稱
            <span style={{ fontSize: 10, fontWeight: 400, color: C.textMuted, marginLeft: 6 }}>English Name</span>
          </label>
          <input
            value={form.enName}
            onChange={e => setField("enName", e.target.value)}
            style={inputStyle}
            onFocus={e => (e.currentTarget.style.borderColor = C.accent)}
            onBlur={e  => (e.currentTarget.style.borderColor = C.border)}
          />
        </div>

        {/* Category dropdown */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.textSecondary, marginBottom: 5, fontFamily: F }}>
            所屬分類
            <span style={{ fontSize: 10, fontWeight: 400, color: C.textMuted, marginLeft: 6 }}>Category</span>
          </label>
          <select
            value={form.category}
            onChange={e => setField("category", e.target.value as Category)}
            style={{
              ...inputStyle,
              cursor: "pointer",
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center",
              paddingRight: 28, appearance: "none" as React.CSSProperties["appearance"],
            }}
          >
            <option value="conduct">行為獎懲 · Conduct</option>
            <option value="attendance">考勤記錄 · Attendance</option>
          </select>
          {/* Live preview badge */}
          <div style={{ marginTop: 6 }}>
            <CategoryBadge cat={form.category} />
          </div>
        </div>

        {/* ─ Section 2: Visual Color ─ */}
        <DrawerSection icon={<span style={{ fontSize: 10 }}>🎨</span>} zh="視覺標籤顏色" en="Display Color" />

        <div style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
            {COLOR_SWATCHES.map(sw => {
              const active = form.color === sw.hex;
              return (
                <button
                  key={sw.hex}
                  title={`${sw.zhLabel} ${sw.enLabel}`}
                  onClick={() => setForm(f => ({ ...f, color: sw.hex, colorLabel: sw.zhLabel }))}
                  style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: sw.hex, border: "none",
                    cursor: "pointer", flexShrink: 0,
                    boxShadow: active
                      ? `0 0 0 2px #fff, 0 0 0 4px ${sw.hex}, 0 2px 8px ${sw.hex}66`
                      : `0 1px 3px ${sw.hex}55`,
                    transform: active ? "scale(1.15)" : "scale(1)",
                    transition: "all 0.15s ease",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  {active && <Check size={13} color="#fff" strokeWidth={3} />}
                </button>
              );
            })}
          </div>
          {/* Selected color preview */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "6px 12px",
            background: form.color + "12",
            border: `1px solid ${form.color}35`,
            borderRadius: R.md,
            fontSize: 12, fontFamily: F,
          }}>
            <span style={{
              width: 14, height: 14, borderRadius: "50%",
              background: form.color, flexShrink: 0,
              boxShadow: `0 0 0 2px ${form.color}33`,
            }} />
            <span style={{ fontWeight: 700, color: C.textPrimary }}>{form.colorLabel}</span>
            <span style={{ fontFamily: ERP.font.mono, fontSize: 11, color: C.textMuted }}>{form.color}</span>
          </div>
        </div>

        {/* ─ Section 3: ACORN Impact ─ */}
        <DrawerSection icon={<span style={{ fontSize: 10 }}>⚡</span>} zh="ACORN 影響設定" en="ACORN Score Impact" />

        {/* Dimension dropdown */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.textSecondary, marginBottom: 5, fontFamily: F }}>
            影響維度
            <span style={{ fontSize: 10, fontWeight: 400, color: C.textMuted, marginLeft: 6 }}>Affected Dimension</span>
          </label>
          <select
            value={form.acornDim}
            onChange={e => {
              const val = e.target.value;
              setField("acornDim", val);
              if (val === "無影響") setField("acornPoints", 0);
            }}
            style={{
              ...inputStyle,
              cursor: "pointer",
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center",
              paddingRight: 28, appearance: "none" as React.CSSProperties["appearance"],
            }}
          >
            {ACORN_DIMS.map(d => (
              <option key={d.key} value={d.key}>
                {d.key} · {d.label}
              </option>
            ))}
          </select>
        </div>

        {/* Points offset — only visible when a real dimension is selected */}
        {hasImpact && (
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.textSecondary, marginBottom: 5, fontFamily: F }}>
              分數增減
              <span style={{ fontSize: 10, fontWeight: 400, color: C.textMuted, marginLeft: 6 }}>Points Offset · 可填負數</span>
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* Decrement */}
              <button
                onClick={() => setField("acornPoints", form.acornPoints - 1)}
                style={{
                  width: 34, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
                  border: `1px solid ${C.border}`, borderRadius: R.md,
                  background: C.surface, cursor: "pointer",
                  color: C.textSecondary, flexShrink: 0,
                }}
              >
                <Minus size={13} />
              </button>

              {/* Points display */}
              <div style={{
                flex: 1, height: 36,
                display: "flex", alignItems: "center", justifyContent: "center",
                borderRadius: R.md,
                border: `1.5px solid ${form.acornPoints > 0 ? "#A7F3D0" : form.acornPoints < 0 ? "#FECACA" : C.border}`,
                background: form.acornPoints > 0 ? "#F0FDF4" : form.acornPoints < 0 ? "#FEF2F2" : C.pageBg,
                gap: 4,
              }}>
                <span style={{
                  fontFamily: ERP.font.mono, fontSize: 20, fontWeight: 800,
                  color: form.acornPoints > 0 ? "#15803D" : form.acornPoints < 0 ? "#B91C1C" : C.textMuted,
                  letterSpacing: "-0.5px",
                }}>
                  {form.acornPoints > 0 ? "+" : ""}{form.acornPoints}
                </span>
                <span style={{ fontSize: 11, color: C.textMuted, fontFamily: F }}>分</span>
              </div>

              {/* Increment */}
              <button
                onClick={() => setField("acornPoints", form.acornPoints + 1)}
                style={{
                  width: 34, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
                  border: `1px solid ${C.border}`, borderRadius: R.md,
                  background: C.surface, cursor: "pointer",
                  color: C.textSecondary, flexShrink: 0,
                }}
              >
                <Plus size={13} />
              </button>
            </div>
          </div>
        )}

        {/* Live ACORN impact preview card */}
        <div style={{
          marginBottom: 18,
          padding: "10px 13px",
          background: hasImpact && dimTag
            ? dimTag.bg
            : C.pageBg,
          border: `1px solid ${hasImpact && dimTag ? dimTag.border : C.border}`,
          borderRadius: R.md,
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <Info size={13} color={hasImpact && dimTag ? dimTag.color : C.textMuted} style={{ flexShrink: 0 }} />
          {hasImpact && dimTag ? (
            <div style={{ fontSize: 12, color: dimTag.color, fontFamily: F, lineHeight: 1.5 }}>
              <strong>預覽：</strong>
              觸發此類別時，學生的{" "}
              <strong style={{ background: dimTag.bg, padding: "0 4px", borderRadius: 3 }}>{form.acornDim}</strong>{" "}
              維度分數將{form.acornPoints > 0 ? "增加" : "扣減"}{" "}
              <strong style={{ color: form.acornPoints > 0 ? "#15803D" : "#B91C1C" }}>
                {Math.abs(form.acornPoints)} 分
              </strong>
              。
            </div>
          ) : (
            <div style={{ fontSize: 12, color: C.textMuted, fontFamily: F }}>
              此類別選擇「無影響」，觸發時不會更動任何 ACORN 維度分數。
            </div>
          )}
        </div>

        {/* ─ Section 4: Status ─ */}
        <DrawerSection icon={<CheckCircle2 size={10} />} zh="啟用狀態" en="Status" />

        <div style={{ marginBottom: 24 }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 14px",
            background: form.status === "active" ? "#F0FDF4" : C.pageBg,
            border: `1px solid ${form.status === "active" ? "#BBF7D0" : C.border}`,
            borderRadius: R.md, transition: "all 0.2s",
          }}>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: C.textPrimary, fontFamily: F }}>
                {form.status === "active" ? "啟用中" : "已停用"}
              </div>
              <div style={{ fontSize: 11, color: C.textMuted, fontFamily: F, marginTop: 2 }}>
                {form.status === "active"
                  ? "此類別可在行為 / 考勤記錄中被選用。"
                  : "此類別已停用，不會出現於新增記錄的選項中。"}
              </div>
            </div>
            <Toggle
              checked={form.status === "active"}
              onChange={v => setField("status", v ? "active" : "disabled")}
            />
          </div>
        </div>
      </div>

      {/* ── Drawer Footer ── */}
      <div style={{
        flexShrink: 0,
        padding: "14px 20px",
        borderTop: `1px solid ${C.border}`,
        background: C.surface,
        display: "flex", gap: 10, justifyContent: "flex-end",
      }}>
        <button
          onClick={onClose}
          style={{
            padding: "8px 18px", borderRadius: R.md,
            border: `1px solid ${C.border}`, background: "transparent",
            color: C.textSecondary, fontSize: 13, fontFamily: F, cursor: "pointer",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = C.surfaceHover)}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
        >
          取消 Cancel
        </button>
        <button
          onClick={handleSave}
          style={{
            padding: "8px 22px", borderRadius: R.md, border: "none",
            background: C.accent, color: "#fff",
            fontSize: 13, fontWeight: 700, fontFamily: F, cursor: "pointer",
            boxShadow: `0 2px 8px ${C.accent}40`,
            display: "flex", alignItems: "center", gap: 6,
          }}
          onMouseEnter={e => (e.currentTarget.style.background = C.accentDark)}
          onMouseLeave={e => (e.currentTarget.style.background = C.accent)}
        >
          <Check size={14} />
          儲存變更 Save Changes
        </button>
      </div>
    </>
  );
};

// ── Main Screen ───────────────────────────────────────────────────────────────
export const Screen_ConductTypes: React.FC = () => {
  const [types,      setTypes]      = useState<ConductType[]>(INITIAL_TYPES);
  const [editingId,  setEditingId]  = useState<string | null>("c1");
  const [savedFlash, setSavedFlash] = useState<string | null>(null);
  const [isMobile,   setIsMobile]   = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    if (window.innerWidth < 768) setEditingId(null);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const drawerOpen  = editingId !== null;
  const editingItem = types.find(t => t.id === editingId) ?? null;

  const handleSave = (updated: ConductType) => {
    setTypes(prev => prev.map(t => t.id === updated.id ? updated : t));
    setSavedFlash(updated.id);
    setTimeout(() => setSavedFlash(null), 2200);
    setEditingId(null);
  };

  const handleToggleStatus = (id: string) =>
    setTypes(prev => prev.map(t => t.id === id
      ? { ...t, status: t.status === "active" ? "disabled" : "active" }
      : t
    ));

  // Grid column widths
  const COLS = "2fr 1fr 130px 200px 120px 140px";

  return (
    <div style={{
      display: "flex", height: isMobile ? "auto" : "100%", overflow: isMobile ? "visible" : "hidden",
      background: C.pageBg, fontFamily: F,
    }}>

      {/* ── LEFT: Main content ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: isMobile ? "visible" : "hidden", minWidth: 0 }}>

        {/* ── Page Header ── */}
        <div style={{
          padding: isMobile ? "14px 16px 12px" : "18px 28px 16px",
          background: C.surface, borderBottom: `1px solid ${C.border}`,
          flexShrink: 0,
        }}>
          {/* Breadcrumbs */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 12, flexWrap: "wrap" as const }}>
            {["首頁", "系統管理", "系統參數設定", "行為與考勤類別"].map((crumb, i, arr) => (
              <React.Fragment key={crumb}>
                <span
                  style={{
                    fontSize: 11.5, fontFamily: F,
                    color: i === arr.length - 1 ? C.accent : C.textMuted,
                    fontWeight: i === arr.length - 1 ? 700 : 400,
                    cursor: i < arr.length - 1 ? "pointer" : "default",
                  }}
                  onMouseEnter={e => { if (i < arr.length - 1) e.currentTarget.style.color = C.accent; }}
                  onMouseLeave={e => { if (i < arr.length - 1) e.currentTarget.style.color = C.textMuted; }}
                >
                  {crumb}
                </span>
                {i < arr.length - 1 && <ChevronRight size={11} color={C.textDisabled} />}
              </React.Fragment>
            ))}
          </div>

          {/* Title row */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: R.md,
                  background: "#EFF6FF", border: `1px solid ${C.accentLight}`,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <Scale size={17} color={C.accent} />
                </div>
                <h1 style={{ margin: 0, fontSize: isMobile ? 16 : 20, fontWeight: 800, color: C.textPrimary, letterSpacing: "-0.3px", fontFamily: F }}>
                  ⚖️ 行為與考勤類別管理
                </h1>
              </div>
              <p style={{ margin: 0, fontSize: 12.5, color: C.textMuted, fontFamily: F, lineHeight: 1.5, paddingLeft: isMobile ? 0 : 44 }}>
                Conduct & Attendance Types · 定義系統內所有行為獎懲及考勤類別，包括視覺標籤顏色與 ACORN 維度影響。
              </p>
            </div>
            <button
              onClick={() => {}}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "9px 16px", borderRadius: R.md,
                border: "none", background: C.accent,
                color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: F,
                cursor: "pointer", boxShadow: `0 2px 8px ${C.accent}40`,
                transition: "background 0.15s", flexShrink: 0,
              }}
              onMouseEnter={e => (e.currentTarget.style.background = C.accentDark)}
              onMouseLeave={e => (e.currentTarget.style.background = C.accent)}
            >
              <Plus size={15} />
              {isMobile ? "新增" : "新增類別 Add New Type"}
            </button>
          </div>
        </div>

        {/* ── Success flash banner ── */}
        {savedFlash && (
          <div style={{
            padding: "10px 28px", background: "#F0FDF4",
            borderBottom: "1px solid #BBF7D0",
            display: "flex", alignItems: "center", gap: 8,
            fontSize: 12.5, fontFamily: F, color: "#15803D", fontWeight: 600, flexShrink: 0,
          }}>
            <CheckCircle2 size={14} color="#16A34A" />
            已儲存成功 · Changes saved successfully
          </div>
        )}

        {/* ── Table ── */}
        <div style={{ flex: isMobile ? "none" : 1, overflow: "auto", padding: isMobile ? "12px 16px" : "20px 28px" }}>
          <div style={{ overflowX: isMobile ? "auto" : undefined, WebkitOverflowScrolling: "touch" as any }}>
          <div style={{
            background: C.surface, borderRadius: R.lg,
            border: `1px solid ${C.border}`,
            overflow: "hidden", boxShadow: ERP.shadow.xs,
            minWidth: isMobile ? 740 : undefined,
          }}>
            {/* Table header */}
            <div style={{
              display: "grid", gridTemplateColumns: COLS,
              padding: "0 20px",
              background: C.pageBg, borderBottom: `1px solid ${C.border}`,
            }}>
              {[
                { zh: "類別名稱",     en: "Type Name"     },
                { zh: "分類",         en: "Category"      },
                { zh: "視覺顏色",     en: "Color"         },
                { zh: "ACORN 影響",   en: "ACORN Impact"  },
                { zh: "狀態",         en: "Status"        },
                { zh: "操作",         en: "Actions"       },
              ].map(col => (
                <div key={col.zh} style={{
                  padding: "11px 0",
                  fontSize: 10.5, fontWeight: 700, color: C.textMuted,
                  fontFamily: F, letterSpacing: "0.05em", textTransform: "uppercase" as const,
                }}>
                  {col.zh}
                  <span style={{ fontSize: 9.5, fontWeight: 400, marginLeft: 4, color: C.textDisabled }}>
                    {col.en}
                  </span>
                </div>
              ))}
            </div>

            {/* Data rows */}
            {types.map((item, idx) => {
              const isEditing = editingId === item.id;
              const isFlash   = savedFlash === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setEditingId(item.id)}
                  style={{
                    display: "grid", gridTemplateColumns: COLS,
                    padding: "0 20px",
                    borderBottom: idx < types.length - 1 ? `1px solid ${C.divider}` : "none",
                    background: isFlash ? "#F0FDF4" : isEditing ? "#EFF6FF" : C.surface,
                    borderLeft: isEditing
                      ? `3px solid ${C.accent}`
                      : isFlash
                        ? "3px solid #16A34A"
                        : "3px solid transparent",
                    transition: "all 0.15s", alignItems: "center", cursor: "pointer",
                  }}
                  onMouseEnter={e => {
                    if (!isEditing && !isFlash)
                      (e.currentTarget as HTMLDivElement).style.background = C.surfaceHover;
                  }}
                  onMouseLeave={e => {
                    if (!isEditing && !isFlash)
                      (e.currentTarget as HTMLDivElement).style.background = C.surface;
                  }}
                >
                  {/* Type Name */}
                  <div style={{ padding: "14px 0", paddingRight: 12 }}>
                    <div style={{
                      fontSize: 13.5, fontWeight: 700,
                      color: isEditing ? C.accent : C.textPrimary,
                      fontFamily: F, marginBottom: 1,
                    }}>
                      {item.zhName}
                    </div>
                    <div style={{ fontSize: 11, color: C.textMuted, fontFamily: F }}>{item.enName}</div>
                  </div>

                  {/* Category */}
                  <div style={{ padding: "14px 0" }}>
                    <CategoryBadge cat={item.category} />
                  </div>

                  {/* Color */}
                  <div style={{ padding: "14px 0" }}>
                    <ColorDot hex={item.color} label={item.colorLabel} />
                  </div>

                  {/* ACORN Impact */}
                  <div style={{ padding: "14px 0" }}>
                    <AcornImpactCell dim={item.acornDim} points={item.acornPoints} />
                  </div>

                  {/* Status */}
                  <div style={{ padding: "14px 0" }}>
                    <StatusBadge status={item.status} />
                  </div>

                  {/* Actions */}
                  <div
                    style={{ padding: "14px 0", display: "flex", gap: 6, alignItems: "center" }}
                    onClick={e => e.stopPropagation()}
                  >
                    {/* Edit */}
                    <button
                      onClick={() => setEditingId(item.id)}
                      style={{
                        display: "flex", alignItems: "center", gap: 4,
                        padding: "5px 10px",
                        border: `1px solid ${isEditing ? C.accentLight : C.border}`,
                        borderRadius: R.md,
                        background: isEditing ? C.accentPale : C.surface,
                        color: isEditing ? C.accent : C.textSecondary,
                        fontSize: 11, fontWeight: 600, fontFamily: F,
                        cursor: "pointer", transition: "all 0.12s",
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = C.accentPale;
                        e.currentTarget.style.color = C.accent;
                        e.currentTarget.style.borderColor = C.accentLight;
                      }}
                      onMouseLeave={e => {
                        if (!isEditing) {
                          e.currentTarget.style.background = C.surface;
                          e.currentTarget.style.color = C.textSecondary;
                          e.currentTarget.style.borderColor = C.border;
                        }
                      }}
                    >
                      <Edit2 size={11} />
                      編輯
                    </button>

                    {/* Disable / Enable */}
                    <button
                      onClick={() => handleToggleStatus(item.id)}
                      style={{
                        display: "flex", alignItems: "center", gap: 4,
                        padding: "5px 10px",
                        border: `1px solid ${C.border}`,
                        borderRadius: R.md,
                        background: C.surface, color: C.textMuted,
                        fontSize: 11, fontWeight: 600, fontFamily: F,
                        cursor: "pointer", transition: "all 0.12s",
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = item.status === "active" ? C.errorLight : "#F0FDF4";
                        e.currentTarget.style.color = item.status === "active" ? C.error : "#15803D";
                        e.currentTarget.style.borderColor = item.status === "active" ? "#FECACA" : "#BBF7D0";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = C.surface;
                        e.currentTarget.style.color = C.textMuted;
                        e.currentTarget.style.borderColor = C.border;
                      }}
                    >
                      {item.status === "active"
                        ? <><EyeOff size={11} />停用</>
                        : <><CheckCircle2 size={11} />啟用</>
                      }
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Table footer */}
            <div style={{
              padding: "9px 20px", borderTop: `1px solid ${C.border}`,
              background: C.pageBg,
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <span style={{ fontSize: 11.5, color: C.textMuted, fontFamily: F }}>
                顯示 {types.length} 個類別 · {types.filter(t => t.status === "active").length} 個啟用中
                {!isMobile && <> · {types.filter(t => t.category === "conduct").length} 行為 · {types.filter(t => t.category === "attendance").length} 考勤</>}
              </span>
              {!isMobile && (
                <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: C.textMuted, fontFamily: F }}>
                  <AlertCircle size={11} />
                  修改類別定義後，歷史記錄不受影響
                </div>
              )}
            </div>
          </div>

          </div>{/* end horizontal scroll wrapper */}

          {/* Info callout */}
          <div style={{
            marginTop: 16, padding: "12px 16px",
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: R.md, display: "flex", alignItems: "flex-start", gap: 10,
            boxShadow: ERP.shadow.xs,
          }}>
            <Info size={14} color={C.accent} style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 12, color: C.textSecondary, fontFamily: F, lineHeight: 1.65 }}>
              <strong style={{ color: C.textPrimary }}>類別設定說明：</strong>
              行為類別（如功過記錄）及考勤類別（如病假、曠課）均可設定對應的 ACORN 維度分數影響。正數代表加分，負數代表扣分，設為「無影響」則不更動 ACORN 分數。視覺顏色用於系統介面的快速識別。
              <span style={{ color: C.textMuted, marginLeft: 6 }}>
                Conduct (merits/demerits) and attendance types can each trigger ACORN dimension score adjustments. Positive = bonus; Negative = deduction.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT: Edit Drawer ── */}
      {isMobile && drawerOpen && (
        <div onClick={() => setEditingId(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 199 }} />
      )}
      {isMobile ? (
        drawerOpen && (
          <div style={{
            position: "fixed", top: 0, right: 0, bottom: 0, left: 0,
            zIndex: 200, display: "flex", flexDirection: "column",
            background: C.surface, overflow: "hidden",
          }}>
            {editingItem && (
              <EditDrawer key={editingItem.id} item={editingItem} onClose={() => setEditingId(null)} onSave={handleSave} />
            )}
          </div>
        )
      ) : (
        <div style={{
          width: drawerOpen ? DRAWER_W : 0,
          transition: "width 0.22s cubic-bezier(0.4,0,0.2,1)",
          overflow: "hidden", flexShrink: 0,
          borderLeft: drawerOpen ? `1px solid ${C.border}` : "none",
          boxShadow: drawerOpen ? "-4px 0 20px rgba(0,0,0,0.07)" : "none",
        }}>
          <div style={{ width: DRAWER_W, height: "100%", display: "flex", flexDirection: "column", background: C.surface }}>
            {editingItem && (
              <EditDrawer key={editingItem.id} item={editingItem} onClose={() => setEditingId(null)} onSave={handleSave} />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
