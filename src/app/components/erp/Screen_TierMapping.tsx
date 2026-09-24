// ─────────────────────────────────────────────────────────────────────────────
// Screen: 成就級別管理 — Tier Mapping Configuration
// Frame: 系統設定 > 成就級別管理 (1.G.1)
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect } from "react";
import { ERP } from "./erpTokens";
import {
  Plus, X, ChevronRight, Settings, Edit2, EyeOff,
  CheckCircle2, Sliders, Info, Check, ChevronDown,
  Award, Hash,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type TierStatus = "active" | "disabled";

interface Tier {
  id:           string;
  code:         string;
  enName:       string;
  zhDesc:       string;
  acornDims:    string[];
  multiplier:   number;
  status:       TierStatus;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const F    = ERP.font.family;
const MONO = ERP.font.mono;
const C    = ERP.colors;
const R    = ERP.radius;

const ACORN_OPTIONS = [
  { key: "認知",   ...ERP.acornTags["認知"]   },
  { key: "社群",   ...ERP.acornTags["社群"]   },
  { key: "創意",   ...ERP.acornTags["創意"]   },
  { key: "協作",   ...ERP.acornTags["協作"]   },
  { key: "領導",   ...ERP.acornTags["領導"]   },
  { key: "體適能", ...ERP.acornTags["體適能"] },
];

const TIER_CODE_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  T3: { bg: "#EDE9FE", color: "#5B21B6", border: "#DDD6FE" },
  T2: { bg: "#F1F5F9", color: "#334155", border: "#CBD5E1" },
  T1: { bg: "#F1F5F9", color: "#334155", border: "#CBD5E1" },
};

const INITIAL_TIERS: Tier[] = [
  {
    id: "t3", code: "T3",
    enName: "Leadership / Planning",
    zhDesc: "擔任決策性領導角色，負責策劃及統籌。",
    acornDims: ["領導"],
    multiplier: 3.0,
    status: "active",
  },
  {
    id: "t2", code: "T2",
    enName: "Support / Execution",
    zhDesc: "擔任支援性崗位，協助執行計劃及活動。",
    acornDims: ["協作"],
    multiplier: 2.0,
    status: "active",
  },
  {
    id: "t1", code: "T1",
    enName: "General Participation",
    zhDesc: "一般參與成員，完成指定任務及出席活動。",
    acornDims: ["社群"],
    multiplier: 1.0,
    status: "active",
  },
];

// ── Sub-components ────────────────────────────────────────────────────────────

const AcornPill: React.FC<{ tagKey: string }> = ({ tagKey }) => {
  const tag = ERP.acornTags[tagKey];
  if (!tag) return null;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 8px", borderRadius: R.full,
      background: tag.bg, border: `1px solid ${tag.border}`,
      fontSize: 11, fontWeight: 700, color: tag.color, fontFamily: F,
      whiteSpace: "nowrap" as const,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: "50%",
        background: tag.color, flexShrink: 0,
      }} />
      {tagKey}
    </span>
  );
};

const StatusBadge: React.FC<{ status: TierStatus }> = ({ status }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: 5,
    padding: "3px 10px", borderRadius: R.full,
    background: status === "active" ? "#D1FAE5" : "#FEE2E2",
    border:     `1px solid ${status === "active" ? "#6EE7B7" : "#FECACA"}`,
    color:      status === "active" ? "#065F46" : "#991B1B",
    fontSize: 11, fontWeight: 700, fontFamily: F,
  }}>
    <span style={{
      width: 5, height: 5, borderRadius: "50%",
      background: status === "active" ? "#059669" : "#DC2626",
      flexShrink: 0,
    }} />
    {status === "active" ? "啟用 Active" : "停用 Disabled"}
  </span>
);

const TierCodeBadge: React.FC<{ code: string }> = ({ code }) => {
  const style = TIER_CODE_COLORS[code] ?? { bg: "#F1F5F9", color: "#334155", border: "#CBD5E1" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      minWidth: 36, padding: "3px 9px",
      borderRadius: R.sm,
      background: style.bg, border: `1px solid ${style.border}`,
      fontSize: 12, fontWeight: 800, color: style.color,
      fontFamily: MONO, letterSpacing: "0.04em",
    }}>
      {code}
    </span>
  );
};

// ── Toggle Component ──────────────────────────────────────────────────────────

const Toggle: React.FC<{
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}> = ({ checked, onChange, label }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width: 40, height: 22, borderRadius: R.full,
        background: checked ? C.accent : C.border,
        border: "none", cursor: "pointer", padding: 2,
        position: "relative", flexShrink: 0,
        transition: "background 0.2s",
      }}
    >
      <div style={{
        width: 18, height: 18, borderRadius: "50%",
        background: "#fff",
        transform: checked ? "translateX(18px)" : "translateX(0)",
        transition: "transform 0.2s",
        boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
      }} />
    </button>
    {label && (
      <span style={{ fontSize: 13, fontFamily: F, color: checked ? C.accent : C.textSecondary, fontWeight: 600 }}>
        {label}
      </span>
    )}
  </div>
);

// ── Drawer Form ───────────────────────────────────────────────────────────────

interface DrawerForm {
  enName:     string;
  zhDesc:     string;
  acornDims:  string[];
  multiplier: number;
  status:     TierStatus;
}

const EditDrawer: React.FC<{
  tier:    Tier;
  onClose: () => void;
  onSave:  (updated: Tier) => void;
}> = ({ tier, onClose, onSave }) => {
  const [form, setForm] = useState<DrawerForm>({
    enName:     tier.enName,
    zhDesc:     tier.zhDesc,
    acornDims:  [...tier.acornDims],
    multiplier: tier.multiplier,
    status:     tier.status,
  });

  const codeStyle = TIER_CODE_COLORS[tier.code] ?? { bg: "#F1F5F9", color: "#334155", border: "#CBD5E1" };

  const toggleAcorn = (key: string) =>
    setForm(f => ({
      ...f,
      acornDims: f.acornDims.includes(key)
        ? f.acornDims.filter(d => d !== key)
        : [...f.acornDims, key],
    }));

  const handleSave = () => onSave({ ...tier, ...form });

  const sliderVal = form.multiplier;
  const sliderPct = ((sliderVal - 1) / 4) * 100;

  return (
    <>
      <style>{`
        .tier-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px; height: 18px; border-radius: 50%;
          background: ${C.accent}; cursor: pointer;
          border: 2px solid #fff;
          box-shadow: 0 0 0 1px ${C.accent}, 0 2px 6px ${C.accent}55;
          transition: box-shadow 0.15s;
        }
        .tier-slider::-webkit-slider-thumb:hover {
          box-shadow: 0 0 0 3px ${C.accentLight}, 0 2px 6px ${C.accent}55;
        }
        .tier-slider::-webkit-slider-runnable-track {
          height: 4px; border-radius: 99px;
          background: linear-gradient(to right, ${C.accent} ${sliderPct}%, ${C.border} ${sliderPct}%);
        }
        .tier-slider { -webkit-appearance: none; appearance: none; outline: none; background: transparent; width: 100%; cursor: pointer; }
      `}</style>

      {/* ── Drawer Header ── */}
      <div style={{
        padding: "16px 20px",
        borderBottom: `1px solid ${C.border}`,
        background: C.surface,
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: R.sm,
              background: codeStyle.bg, border: `1px solid ${codeStyle.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <Award size={16} color={codeStyle.color} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: C.textPrimary, fontFamily: F }}>
                  編輯成就級別
                </span>
                <span style={{
                  fontFamily: MONO, fontSize: 12, fontWeight: 800,
                  padding: "2px 8px", borderRadius: R.xs,
                  background: codeStyle.bg, color: codeStyle.color,
                  border: `1px solid ${codeStyle.border}`,
                }}>
                  {tier.code}
                </span>
              </div>
              <div style={{ fontSize: 11, color: C.textMuted, fontFamily: F, marginTop: 2 }}>
                Edit Achievement Tier · 修改級別參數
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: `1px solid ${C.border}`,
              cursor: "pointer", padding: 5,
              borderRadius: R.sm, color: C.textMuted,
              display: "flex", flexShrink: 0,
            }}
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* ── Form body ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 0" }}>

        {/* Section label */}
        <div style={{
          fontSize: 10, fontWeight: 700, color: C.textMuted,
          letterSpacing: "0.08em", textTransform: "uppercase" as const,
          marginBottom: 16, display: "flex", alignItems: "center", gap: 5,
        }}>
          <Settings size={10} />基本參數 · Core Parameters
        </div>

        {/* Tier Code (read-only) */}
        <div style={{ marginBottom: 15 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.textSecondary, marginBottom: 5, fontFamily: F }}>
            級別代碼
            <span style={{ fontSize: 10, fontWeight: 400, color: C.textMuted, marginLeft: 6 }}>Tier Code</span>
            <span style={{
              marginLeft: 6, fontSize: 10, fontWeight: 600,
              padding: "1px 6px", borderRadius: R.sm,
              background: C.pageBg, border: `1px solid ${C.border}`,
              color: C.textMuted,
            }}>唯讀</span>
          </label>
          <div style={{
            padding: "8px 12px",
            borderRadius: R.md, border: `1px solid ${C.border}`,
            background: C.pageBg,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <TierCodeBadge code={tier.code} />
            <span style={{ fontSize: 11, color: C.textMuted, fontFamily: F }}>
              系統識別碼，建立後不可修改。
            </span>
          </div>
        </div>

        {/* English Name */}
        <div style={{ marginBottom: 15 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.textSecondary, marginBottom: 5, fontFamily: F }}>
            英文名稱
            <span style={{ fontSize: 10, fontWeight: 400, color: C.textMuted, marginLeft: 6 }}>English Name</span>
          </label>
          <input
            value={form.enName}
            onChange={e => setForm(f => ({ ...f, enName: e.target.value }))}
            style={{
              width: "100%", boxSizing: "border-box" as const,
              padding: "8px 12px", borderRadius: R.md,
              border: `1px solid ${C.border}`,
              background: C.surface, color: C.textPrimary,
              fontSize: 13, fontFamily: F, outline: "none",
            }}
            onFocus={e => (e.currentTarget.style.borderColor = C.accent)}
            onBlur={e => (e.currentTarget.style.borderColor = C.border)}
          />
        </div>

        {/* Chinese Description */}
        <div style={{ marginBottom: 15 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.textSecondary, marginBottom: 5, fontFamily: F }}>
            中文定義
            <span style={{ fontSize: 10, fontWeight: 400, color: C.textMuted, marginLeft: 6 }}>Chinese Description</span>
          </label>
          <textarea
            value={form.zhDesc}
            onChange={e => setForm(f => ({ ...f, zhDesc: e.target.value }))}
            rows={3}
            style={{
              width: "100%", boxSizing: "border-box" as const,
              padding: "8px 12px", borderRadius: R.md,
              border: `1px solid ${C.border}`,
              background: C.surface, color: C.textPrimary,
              fontSize: 13, fontFamily: F, outline: "none",
              resize: "vertical" as const, lineHeight: 1.6,
            }}
            onFocus={e => (e.currentTarget.style.borderColor = C.accent)}
            onBlur={e => (e.currentTarget.style.borderColor = C.border)}
          />
        </div>

        {/* ACORN multi-select */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.textSecondary, marginBottom: 8, fontFamily: F }}>
            預設 ACORN 維度
            <span style={{ fontSize: 10, fontWeight: 400, color: C.textMuted, marginLeft: 6 }}>Default ACORN Dimensions</span>
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 7 }}>
            {ACORN_OPTIONS.map(dim => {
              const active = form.acornDims.includes(dim.key);
              return (
                <button
                  key={dim.key}
                  onClick={() => toggleAcorn(dim.key)}
                  style={{
                    display: "flex", alignItems: "center", gap: 7,
                    padding: "8px 9px", borderRadius: R.md, textAlign: "left" as const,
                    background: active ? dim.bg : C.pageBg,
                    border: `1.5px solid ${active ? dim.border : C.border}`,
                    cursor: "pointer", transition: "all 0.12s", fontFamily: F,
                    boxShadow: active ? `0 0 0 3px ${dim.bg}` : "none",
                  }}
                >
                  <div style={{
                    width: 16, height: 16, borderRadius: 3, flexShrink: 0,
                    background: active ? dim.color : "transparent",
                    border: `2px solid ${active ? dim.color : C.borderStrong}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.12s",
                  }}>
                    {active && <Check size={9} color="#fff" strokeWidth={3} />}
                  </div>
                  <div>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: active ? dim.color : C.textPrimary, lineHeight: 1 }}>{dim.key}</div>
                    <div style={{ fontSize: 9, color: C.textMuted, marginTop: 1.5, lineHeight: 1 }}>{dim.label}</div>
                  </div>
                </button>
              );
            })}
          </div>
          {form.acornDims.length === 0 && (
            <p style={{ margin: "6px 0 0", fontSize: 11, color: C.red, fontFamily: F }}>請選擇至少一個 ACORN 維度</p>
          )}
        </div>

        {/* Multiplier slider */}
        <div style={{ marginBottom: 20 }}>
          <div style={{
            borderTop: `1px solid ${C.border}`,
            paddingTop: 16, marginBottom: 14,
            fontSize: 10, fontWeight: 700, color: C.textMuted,
            letterSpacing: "0.08em", textTransform: "uppercase" as const,
            display: "flex", alignItems: "center", gap: 5,
          }}>
            <Sliders size={10} />積點倍數 · Reward Multiplier
          </div>

          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.textSecondary, marginBottom: 6, fontFamily: F }}>
            基礎自主積點倍數
            <span style={{ fontSize: 10, fontWeight: 400, color: C.textMuted, marginLeft: 6 }}>Base Reward Multiplier</span>
          </label>

          {/* Multiplier display */}
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            marginBottom: 10,
          }}>
            <div style={{
              display: "flex", alignItems: "baseline", gap: 3,
              padding: "6px 14px",
              background: C.accentPale, border: `1px solid ${C.accentLight}`,
              borderRadius: R.lg,
            }}>
              <span style={{ fontFamily: MONO, fontSize: 24, fontWeight: 800, color: C.accent, lineHeight: 1 }}>
                {form.multiplier.toFixed(1)}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.accentMid, fontFamily: F }}>x</span>
            </div>
            <div style={{ flex: 1 }}>
              <input
                type="range"
                min={1} max={5} step={0.5}
                value={form.multiplier}
                onChange={e => setForm(f => ({ ...f, multiplier: parseFloat(e.target.value) }))}
                className="tier-slider"
                style={{ width: "100%" }}
              />
              <div style={{
                display: "flex", justifyContent: "space-between",
                marginTop: 4, fontSize: 9, color: C.textMuted, fontFamily: MONO,
              }}>
                {[1.0, 2.0, 3.0, 4.0, 5.0].map(v => (
                  <span key={v}>{v.toFixed(1)}x</span>
                ))}
              </div>
            </div>
          </div>

          {/* Helper text */}
          <div style={{
            display: "flex", alignItems: "flex-start", gap: 6,
            padding: "8px 11px",
            background: C.pageBg, border: `1px solid ${C.border}`,
            borderRadius: R.md,
          }}>
            <Info size={11} color={C.textMuted} style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ margin: 0, fontSize: 11, color: C.textMuted, fontFamily: F, lineHeight: 1.6 }}>
              此倍數將用於計算最終派發的自主積點。例如基礎積點 10 分 × <strong style={{ color: C.textSecondary }}>{form.multiplier.toFixed(1)}x</strong> = <strong style={{ color: C.accent }}>{(10 * form.multiplier).toFixed(0)} 積點</strong>。
            </p>
          </div>
        </div>

        {/* Status toggle */}
        <div style={{ marginBottom: 24 }}>
          <div style={{
            borderTop: `1px solid ${C.border}`,
            paddingTop: 16, marginBottom: 12,
            fontSize: 10, fontWeight: 700, color: C.textMuted,
            letterSpacing: "0.08em", textTransform: "uppercase" as const,
            display: "flex", alignItems: "center", gap: 5,
          }}>
            <CheckCircle2 size={10} />啟用狀態 · Status
          </div>

          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 14px",
            background: form.status === "active" ? "#F0FDF4" : C.pageBg,
            border: `1px solid ${form.status === "active" ? "#BBF7D0" : C.border}`,
            borderRadius: R.md,
            transition: "all 0.2s",
          }}>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: C.textPrimary, fontFamily: F }}>
                {form.status === "active" ? "啟用中" : "已停用"}
              </div>
              <div style={{ fontSize: 11, color: C.textMuted, fontFamily: F, marginTop: 2 }}>
                {form.status === "active"
                  ? "此級別目前可在活動及崗位中被使用。"
                  : "此級別已停用，不會出現於新建活動的選項中。"}
              </div>
            </div>
            <Toggle
              checked={form.status === "active"}
              onChange={v => setForm(f => ({ ...f, status: v ? "active" : "disabled" }))}
            />
          </div>
        </div>

      </div>

      {/* ── Footer ── */}
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
            transition: "all 0.12s",
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
            transition: "background 0.15s",
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

// ── Main Screen ────────────────────────────────────────────────────────────────

const DRAWER_W = 440;

export const Screen_TierMapping: React.FC = () => {
  const [tiers,      setTiers]      = useState<Tier[]>(INITIAL_TIERS);
  const [editingId,  setEditingId]  = useState<string | null>("t3");
  const [savedFlash, setSavedFlash] = useState<string | null>(null);
  const [isMobile,   setIsMobile]   = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    if (window.innerWidth < 768) setEditingId(null);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const drawerOpen = editingId !== null;
  const editingTier = tiers.find(t => t.id === editingId) ?? null;

  const openEdit = (id: string) => setEditingId(id);
  const closeDrawer = () => setEditingId(null);

  const handleSave = (updated: Tier) => {
    setTiers(prev => prev.map(t => t.id === updated.id ? updated : t));
    setSavedFlash(updated.id);
    setTimeout(() => setSavedFlash(null), 2200);
    closeDrawer();
  };

  const handleDisable = (id: string) => {
    setTiers(prev => prev.map(t => t.id === id
      ? { ...t, status: t.status === "active" ? "disabled" : "active" }
      : t
    ));
  };

  return (
    <div style={{
      display: "flex",
      height: isMobile ? "auto" : "100%",
      overflow: isMobile ? "visible" : "hidden",
      background: C.pageBg,
      fontFamily: F,
    }}>

      {/* ── LEFT: Main content ────────────────────────────────────────────── */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        overflow: isMobile ? "visible" : "hidden", minWidth: 0,
      }}>

        {/* Page header */}
        <div style={{
          padding: isMobile ? "14px 16px 12px" : "18px 28px 16px",
          background: C.surface,
          borderBottom: `1px solid ${C.border}`,
          flexShrink: 0,
        }}>
          {/* Breadcrumbs */}
          <div style={{
            display: "flex", alignItems: "center", gap: 4,
            marginBottom: 12, flexWrap: "wrap" as const,
          }}>
            {["首頁", "系統管理", "系統參數設定", "成就級別管理"].map((crumb, i, arr) => (
              <React.Fragment key={crumb}>
                <span style={{
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
                {i < arr.length - 1 && (
                  <ChevronRight size={11} color={C.textDisabled} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Title row */}
          <div style={{
            display: "flex", alignItems: "flex-start",
            justifyContent: "space-between", gap: 16,
            flexWrap: "wrap" as const,
          }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: R.md,
                  background: C.accentPale,
                  border: `1px solid ${C.accentLight}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <Settings size={17} color={C.accent} />
                </div>
                <h1 style={{
                  margin: 0, fontSize: isMobile ? 16 : 20, fontWeight: 800,
                  color: C.textPrimary, letterSpacing: "-0.3px", fontFamily: F,
                }}>
                  ⚙️ 成就級別與權重設定
                </h1>
              </div>
              <p style={{
                margin: 0, fontSize: 12.5, color: C.textMuted, fontFamily: F,
                lineHeight: 1.5, paddingLeft: isMobile ? 0 : 44,
              }}>
                Tier Mapping Configuration · 定義系統內所有崗位與活動的基礎成就層級，及其預設綁定的 ACORN 維度。
              </p>
            </div>

            <button
              onClick={() => {}}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "9px 16px", borderRadius: R.md,
                border: "none", background: C.accent,
                color: "#fff", fontSize: 13, fontWeight: 700,
                fontFamily: F, cursor: "pointer",
                boxShadow: `0 2px 8px ${C.accent}40`,
                transition: "background 0.15s", flexShrink: 0,
              }}
              onMouseEnter={e => (e.currentTarget.style.background = C.accentDark)}
              onMouseLeave={e => (e.currentTarget.style.background = C.accent)}
            >
              <Plus size={15} />
              {isMobile ? "新增" : "新增級別 Add New Tier"}
            </button>
          </div>
        </div>

        {/* ── Save flash banner ── */}
        {savedFlash && (
          <div style={{
            padding: "10px 28px",
            background: "#F0FDF4",
            borderBottom: "1px solid #BBF7D0",
            display: "flex", alignItems: "center", gap: 8,
            fontSize: 12.5, fontFamily: F, color: "#15803D", fontWeight: 600,
            flexShrink: 0,
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
            minWidth: isMobile ? 700 : undefined,
          }}>
            {/* Table header */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "80px 180px 1fr 180px 110px 130px",
              padding: "0 20px",
              background: C.pageBg,
              borderBottom: `1px solid ${C.border}`,
            }}>
              {[
                { zh: "級別代碼",     en: "Code"         },
                { zh: "英文名稱",     en: "EN Name"      },
                { zh: "中文定義",     en: "ZH Desc"      },
                { zh: "預設 ACORN 綁定", en: "Default ACORN" },
                { zh: "狀態",         en: "Status"       },
                { zh: "操作",         en: "Actions"      },
              ].map(col => (
                <div key={col.zh} style={{
                  padding: "11px 0",
                  fontSize: 10.5, fontWeight: 700,
                  color: C.textMuted, fontFamily: F,
                  letterSpacing: "0.05em", textTransform: "uppercase" as const,
                }}>
                  {col.zh}
                  <span style={{ fontSize: 9.5, fontWeight: 400, marginLeft: 4, color: C.textDisabled }}>
                    {col.en}
                  </span>
                </div>
              ))}
            </div>

            {/* Rows */}
            {tiers.map((tier, idx) => {
              const isEditing = editingId === tier.id;
              const isFlash   = savedFlash === tier.id;
              return (
                <div
                  key={tier.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "80px 180px 1fr 180px 110px 130px",
                    padding: "0 20px",
                    borderBottom: idx < tiers.length - 1 ? `1px solid ${C.divider}` : "none",
                    background: isFlash
                      ? "#F0FDF4"
                      : isEditing
                        ? "#EFF6FF"
                        : C.surface,
                    borderLeft: isEditing
                      ? `3px solid ${C.accent}`
                      : isFlash
                        ? "3px solid #16A34A"
                        : "3px solid transparent",
                    transition: "all 0.15s",
                    alignItems: "center",
                    cursor: "pointer",
                  }}
                  onClick={() => openEdit(tier.id)}
                  onMouseEnter={e => {
                    if (!isEditing && !isFlash)
                      (e.currentTarget as HTMLDivElement).style.background = C.surfaceHover;
                  }}
                  onMouseLeave={e => {
                    if (!isEditing && !isFlash)
                      (e.currentTarget as HTMLDivElement).style.background = C.surface;
                  }}
                >
                  {/* Code */}
                  <div style={{ padding: "15px 0" }}>
                    <TierCodeBadge code={tier.code} />
                  </div>

                  {/* EN Name */}
                  <div style={{ padding: "15px 0", paddingRight: 12 }}>
                    <span style={{
                      fontSize: 13, fontWeight: 600,
                      color: isEditing ? C.accent : C.textPrimary,
                      fontFamily: F,
                    }}>
                      {tier.enName}
                    </span>
                  </div>

                  {/* ZH Desc */}
                  <div style={{ padding: "15px 0", paddingRight: 16 }}>
                    <span style={{
                      fontSize: 12, color: C.textSecondary, fontFamily: F,
                      lineHeight: 1.5,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical" as const,
                      overflow: "hidden",
                    }}>
                      {tier.zhDesc}
                    </span>
                  </div>

                  {/* ACORN pills */}
                  <div style={{ padding: "15px 0", paddingRight: 12, display: "flex", gap: 5, flexWrap: "wrap" as const }}>
                    {tier.acornDims.map(d => <AcornPill key={d} tagKey={d} />)}
                  </div>

                  {/* Status */}
                  <div style={{ padding: "15px 0" }}>
                    <StatusBadge status={tier.status} />
                  </div>

                  {/* Actions */}
                  <div
                    style={{ padding: "15px 0", display: "flex", gap: 6, alignItems: "center" }}
                    onClick={e => e.stopPropagation()}
                  >
                    <button
                      onClick={() => openEdit(tier.id)}
                      title="編輯"
                      style={{
                        display: "flex", alignItems: "center", gap: 4,
                        padding: "5px 10px",
                        border: `1px solid ${C.border}`,
                        borderRadius: R.md,
                        background: isEditing ? C.accentPale : "#fff",
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
                          e.currentTarget.style.background = "#fff";
                          e.currentTarget.style.color = C.textSecondary;
                          e.currentTarget.style.borderColor = C.border;
                        }
                      }}
                    >
                      <Edit2 size={11} />
                      編輯
                    </button>
                    <button
                      onClick={() => handleDisable(tier.id)}
                      title={tier.status === "active" ? "停用" : "啟用"}
                      style={{
                        display: "flex", alignItems: "center", gap: 4,
                        padding: "5px 10px",
                        border: `1px solid ${C.border}`,
                        borderRadius: R.md,
                        background: "#fff",
                        color: C.textMuted,
                        fontSize: 11, fontWeight: 600, fontFamily: F,
                        cursor: "pointer", transition: "all 0.12s",
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = tier.status === "active" ? C.errorLight : "#F0FDF4";
                        e.currentTarget.style.color = tier.status === "active" ? C.error : "#15803D";
                        e.currentTarget.style.borderColor = tier.status === "active" ? "#FECACA" : "#BBF7D0";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = "#fff";
                        e.currentTarget.style.color = C.textMuted;
                        e.currentTarget.style.borderColor = C.border;
                      }}
                    >
                      {tier.status === "active"
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
              padding: "9px 20px",
              borderTop: `1px solid ${C.border}`,
              background: C.pageBg,
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <span style={{ fontSize: 11.5, color: C.textMuted, fontFamily: F }}>
                顯示 {tiers.length} 個級別 · {tiers.filter(t => t.status === "active").length} 個啟用中
              </span>
              {!isMobile && (
                <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: C.textMuted, fontFamily: F }}>
                  <Hash size={11} />
                  Tender SLA Tier Map v1.0
                </div>
              )}
            </div>
          </div>

          </div>{/* end horizontal scroll wrapper */}

          {/* Info callout */}
          <div style={{
            marginTop: 16, padding: "12px 16px",
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: R.md,
            display: "flex", alignItems: "flex-start", gap: 10,
            boxShadow: ERP.shadow.xs,
          }}>
            <Info size={14} color={C.accent} style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 12, color: C.textSecondary, fontFamily: F, lineHeight: 1.65 }}>
              <strong style={{ color: C.textPrimary }}>成就級別說明：</strong>
              每個崗位 (Role/Position) 及活動 (Activity) 均需設定一個預設成就級別（T1–T3）。該級別決定成員的基礎自主積點倍數，並自動綁定相應 ACORN 維度，用於學習成就的歸類與統計分析。
              <span style={{ color: C.textMuted, marginLeft: 6 }}>
                Each role and activity requires a default tier (T1–T3) that drives point multipliers and ACORN dimension bindings.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT: Edit Drawer ─────────────────────────────────────────────── */}
      {isMobile && drawerOpen && (
        <div onClick={closeDrawer} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 199 }} />
      )}
      {isMobile ? (
        drawerOpen && (
          <div style={{
            position: "fixed", top: 0, right: 0, bottom: 0, left: 0,
            zIndex: 200, display: "flex", flexDirection: "column",
            background: C.surface, overflow: "hidden",
          }}>
            {editingTier && (
              <EditDrawer key={editingTier.id} tier={editingTier} onClose={closeDrawer} onSave={handleSave} />
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
            {editingTier && (
              <EditDrawer key={editingTier.id} tier={editingTier} onClose={closeDrawer} onSave={handleSave} />
            )}
          </div>
        </div>
      )}

    </div>
  );
};
