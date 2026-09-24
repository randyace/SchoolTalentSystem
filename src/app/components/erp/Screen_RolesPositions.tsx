// ─────────────────────────────────────────────────────────────────────────────
// Screen 1.D.6  角色與崗位 / Roles & Positions
// UI Pattern: Left Table + Right Slide-out Drawer (Edit State)
// Tender Binding: Tier T3/T2/T1 radio with ACORN dimension mapping
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect } from "react";
import { ERP } from "./erpTokens";
import {
  Plus, Edit2, Trash2, Search, X, ChevronDown, Check,
  Tag, Star, Crown, Users, Shield, Zap,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type TierCode = "T3" | "T2" | "T1";
type ScopeCode = "學會限定" | "全校通用" | "學術比賽" | "體藝活動";

interface RoleRow {
  id: string;
  name: string;
  enName: string;
  scope: ScopeCode;
  tier: TierCode;
  acornDim: string;
  points: number;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const SCOPE_OPTIONS: ScopeCode[] = ["學會限定", "全校通用", "學術比賽", "體藝活動"];

const ROLES_DATA: RoleRow[] = [
  { id:"chair",     name:"主席",   enName:"Chairperson",   scope:"學會限定", tier:"T3", acornDim:"領導", points:50 },
  { id:"vchair",    name:"副主席", enName:"Vice-Chair",     scope:"學會限定", tier:"T3", acornDim:"領導", points:40 },
  { id:"secretary", name:"秘書",   enName:"Secretary",      scope:"全校通用", tier:"T2", acornDim:"協作", points:30 },
  { id:"treasurer", name:"司庫",   enName:"Treasurer",      scope:"學會限定", tier:"T2", acornDim:"協作", points:30 },
  { id:"member",    name:"幹事",   enName:"Committee Member",scope:"全校通用",tier:"T2", acornDim:"協作", points:20 },
  { id:"captain",   name:"隊長",   enName:"Team Captain",   scope:"學術比賽", tier:"T3", acornDim:"領導", points:45 },
  { id:"vcaptain",  name:"副隊長", enName:"Vice Captain",   scope:"學術比賽", tier:"T2", acornDim:"協作", points:35 },
  { id:"rep",       name:"代表",   enName:"Representative", scope:"學術比賽", tier:"T2", acornDim:"社群", points:25 },
  { id:"general",   name:"普通成員",enName:"General Member", scope:"全校通用", tier:"T1", acornDim:"社群", points:10 },
  { id:"perf",      name:"表演者", enName:"Performer",      scope:"體藝活動", tier:"T2", acornDim:"創意", points:20 },
];

// ─── Tier Configuration ───────────────────────────────────────────────────────
const TIER_CFG: Record<TierCode, {
  label: string; enLabel: string; desc: string;
  acornDim: string; acornEn: string;
  bg: string; color: string; border: string; icon: React.ReactNode;
}> = {
  T3: {
    label: "T3", enLabel: "Leadership / Planning",
    desc: "擔任決策性領導角色，負責策劃及統籌。",
    acornDim: "領導", acornEn: "Leadership",
    bg: ERP.acornTags["領導"].bg, color: ERP.acornTags["領導"].color,
    border: ERP.acornTags["領導"].border,
    icon: <Crown size={16} />,
  },
  T2: {
    label: "T2", enLabel: "Support / Execution",
    desc: "擔任支援性崗位，協助執行計劃及活動。",
    acornDim: "協作", acornEn: "Collaborative",
    bg: ERP.acornTags["協作"].bg, color: ERP.acornTags["協作"].color,
    border: ERP.acornTags["協作"].border,
    icon: <Users size={16} />,
  },
  T1: {
    label: "T1", enLabel: "General Participation",
    desc: "一般參與成員，完成指定任務及出席活動。",
    acornDim: "社群", acornEn: "Community",
    bg: ERP.acornTags["社群"].bg, color: ERP.acornTags["社群"].color,
    border: ERP.acornTags["社群"].border,
    icon: <Star size={16} />,
  },
};

const SCOPE_COLOR: Record<ScopeCode, { bg: string; color: string }> = {
  "學會限定": { bg: "#EDE9FE", color: "#6D28D9" },
  "全校通用": { bg: "#DBEAFE", color: "#1D4ED8" },
  "學術比賽": { bg: "#FEF3C7", color: "#92400E" },
  "體藝活動": { bg: "#FCE7F3", color: "#BE185D" },
};

// ─── Form State ───────────────────────────────────────────────────────────────
interface RoleForm { name: string; scope: ScopeCode; tier: TierCode; points: number }

const defaultForm = (r: RoleRow): RoleForm => ({
  name: r.name, scope: r.scope, tier: r.tier, points: r.points,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
const FormField: React.FC<{ label: string; sub?: string; children: React.ReactNode }> = ({ label, sub, children }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: ERP.colors.textSecondary, marginBottom: 6, fontFamily: ERP.font.family }}>
      {label}
      {sub && <span style={{ fontSize: 10, fontWeight: 400, color: ERP.colors.textMuted, marginLeft: 6 }}>{sub}</span>}
    </label>
    {children}
  </div>
);

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  padding: "8px 12px", borderRadius: ERP.radius.md,
  border: `1px solid ${ERP.colors.border}`, background: ERP.colors.surface,
  color: ERP.colors.textPrimary, fontSize: 13, fontFamily: ERP.font.family, outline: "none",
};

// ─── Main Component ───────────────────────────────────────────────────────────
interface Props { lang?: "en" | "zh-HK" }

export const Screen_RolesPositions: React.FC<Props> = ({ lang = "zh-HK" }) => {
  const [selectedId, setSelectedId] = useState<string | null>("chair");
  const [search,     setSearch]     = useState("");
  const [form,       setForm]       = useState<RoleForm>(defaultForm(ROLES_DATA[0]));
  const [isMobile,   setIsMobile]   = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 900);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const drawerOpen = selectedId !== null;
  const DRAWER_W   = isMobile ? window.innerWidth : 440;
  const F = ERP.font.family;

  const filtered = ROLES_DATA.filter(r => {
    const q = search.toLowerCase();
    return !q || r.name.includes(search) || r.enName.toLowerCase().includes(q);
  });

  const handleSelect = (r: RoleRow) => {
    setSelectedId(r.id === selectedId ? null : r.id);
    if (r.id !== selectedId) setForm(defaultForm(r));
  };

  const selectedRole = ROLES_DATA.find(r => r.id === selectedId);
  const tierCfg = TIER_CFG[form.tier];

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden", background: ERP.colors.pageBg, fontFamily: F }}>

      {/* ── LEFT PANEL ──────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

        {/* Header */}
        <div style={{ padding: "20px 24px 14px", flexShrink: 0, borderBottom: `1px solid ${ERP.colors.border}`, background: ERP.colors.surface }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: ERP.colors.textPrimary, letterSpacing: "-0.3px" }}>角色與崗位</h1>
              <p style={{ margin: "3px 0 0", fontSize: 12, color: ERP.colors.textMuted }}>Roles & Positions · 1.D.6 · {ROLES_DATA.length} 個角色定義</p>
            </div>
            <button style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 14px", borderRadius: ERP.radius.md,
              border: "none", background: ERP.colors.accent,
              color: "#fff", fontSize: 13, fontWeight: 600, fontFamily: F, cursor: "pointer",
            }}>
              <Plus size={14} /> 新增角色
            </button>
          </div>

          {/* Search */}
          <div style={{ position: "relative", maxWidth: 280 }}>
            <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: ERP.colors.textMuted, pointerEvents: "none" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜尋角色名稱…"
              style={{ ...inputStyle, paddingLeft: 32, fontSize: 12 }} />
          </div>
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflow: "auto", padding: "16px 24px 24px" }}>
          <div style={{ background: ERP.colors.surface, borderRadius: ERP.radius.lg, border: `1px solid ${ERP.colors.border}`, overflow: "hidden", boxShadow: ERP.shadow.xs }}>
            <div style={{ overflowX: "auto" }}>
              {/* Header */}
              <div style={{ minWidth: 480, display: "grid", gridTemplateColumns: "1fr 110px 140px 90px 80px", background: ERP.colors.pageBg, borderBottom: `1px solid ${ERP.colors.border}`, padding: "0 16px" }}>
                {[
                  { label:"角色名稱", sub:"Role Name" },
                  { label:"適用範疇", sub:"Scope" },
                  { label:"成就級別", sub:"Tier" },
                  { label:"基礎積點", sub:"Base Pts" },
                  { label:"操作",    sub:"Action" },
                ].map((h, i) => (
                  <div key={i} style={{ padding: "11px 8px 11px 0" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: ERP.colors.textMuted, letterSpacing: "0.05em", textTransform: "uppercase" as const }}>{h.label}</div>
                    <div style={{ fontSize: 9, color: ERP.colors.textMuted, marginTop: 1 }}>{h.sub}</div>
                  </div>
                ))}
              </div>

              {/* Rows */}
              {filtered.map((r, idx) => {
                const isSelected = selectedId === r.id;
                const tc = TIER_CFG[r.tier];
                const sc = SCOPE_COLOR[r.scope];
                return (
                  <div
                    key={r.id}
                    onClick={() => handleSelect(r)}
                    style={{
                      minWidth: 480, display: "grid", gridTemplateColumns: "1fr 110px 140px 90px 80px",
                      padding: "0 16px",
                      borderBottom: idx < filtered.length - 1 ? `1px solid ${ERP.colors.divider}` : "none",
                      background: isSelected ? "#EFF6FF" : ERP.colors.surface,
                      borderLeft: isSelected ? `3px solid ${ERP.colors.accent}` : "3px solid transparent",
                      cursor: "pointer", transition: "all 0.1s",
                    }}
                    onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = ERP.colors.surfaceHover; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = isSelected ? "#EFF6FF" : ERP.colors.surface; }}
                  >
                    {/* Role Name */}
                    <div style={{ padding: "13px 8px 13px 0", alignSelf: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <span style={{ color: tc.color }}>{tc.icon}</span>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: isSelected ? 700 : 500, color: isSelected ? ERP.colors.accent : ERP.colors.textPrimary }}>{r.name}</div>
                          <div style={{ fontSize: 10, color: ERP.colors.textMuted, marginTop: 1 }}>{r.enName}</div>
                        </div>
                      </div>
                    </div>
                    {/* Scope */}
                    <div style={{ padding: "13px 8px 13px 0", alignSelf: "center" }}>
                      <span style={{ padding: "2px 8px", borderRadius: ERP.radius.xs, fontSize: 11, fontWeight: 600, background: sc.bg, color: sc.color }}>{r.scope}</span>
                    </div>
                    {/* Tier */}
                    <div style={{ padding: "13px 8px 13px 0", alignSelf: "center", display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ padding: "2px 7px", borderRadius: ERP.radius.xs, fontSize: 11, fontWeight: 800, background: tc.bg, color: tc.color, border: `1px solid ${tc.border}` }}>{r.tier}</span>
                      <span style={{ fontSize: 10, color: ERP.colors.textMuted }}>{r.acornDim}</span>
                    </div>
                    {/* Points */}
                    <div style={{ padding: "13px 8px 13px 0", alignSelf: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Zap size={12} color={ERP.colors.amber} />
                        <span style={{ fontSize: 14, fontWeight: 700, color: ERP.colors.amber }}>{r.points}</span>
                        <span style={{ fontSize: 10, color: ERP.colors.textMuted }}>pts</span>
                      </div>
                    </div>
                    {/* Actions */}
                    <div style={{ padding: "13px 0 13px 0", alignSelf: "center", display: "flex", gap: 4 }}>
                      <button onClick={e => { e.stopPropagation(); handleSelect(r); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: ERP.colors.accent, display: "flex", borderRadius: ERP.radius.sm }}>
                        <Edit2 size={13} />
                      </button>
                      <button onClick={e => e.stopPropagation()} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: ERP.colors.textMuted, display: "flex", borderRadius: ERP.radius.sm }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div style={{ padding: "9px 16px", borderTop: `1px solid ${ERP.colors.border}`, background: ERP.colors.pageBg, display: "flex", gap: 12, flexWrap: "wrap" as const }}>
              {Object.entries(TIER_CFG).map(([tier, cfg]) => (
                <span key={tier} style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ padding: "1px 6px", borderRadius: ERP.radius.xs, fontWeight: 700, background: cfg.bg, color: cfg.color, fontSize: 10 }}>{tier}</span>
                  <span style={{ color: ERP.colors.textMuted }}>{ROLES_DATA.filter(r => r.tier === tier).length} 個角色</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT DRAWER ────────────────────────────────────────────────── */}
      <div style={{
        width: drawerOpen ? DRAWER_W : 0,
        transition: "width 0.22s cubic-bezier(0.4,0,0.2,1)",
        overflow: "hidden", flexShrink: 0,
        borderLeft: drawerOpen ? `1px solid ${ERP.colors.border}` : "none",
        boxShadow: drawerOpen ? "-4px 0 16px rgba(0,0,0,0.06)" : "none",
      }}>
        <div style={{ width: DRAWER_W, height: "100%", display: "flex", flexDirection: "column", background: ERP.colors.surface }}>

          {/* Drawer header */}
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${ERP.colors.border}`, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexShrink: 0 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: ERP.radius.sm, background: ERP.colors.accentPale, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Shield size={14} color={ERP.colors.accent} />
                </div>
                <span style={{ fontSize: 15, fontWeight: 700, color: ERP.colors.textPrimary }}>編輯角色</span>
                {selectedRole && (
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: ERP.radius.xs, background: TIER_CFG[form.tier].bg, color: TIER_CFG[form.tier].color }}>
                    {selectedRole.name}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, color: ERP.colors.textMuted, marginTop: 3, marginLeft: 36 }}>Edit Role · 修改角色設定</div>
            </div>
            <button onClick={() => setSelectedId(null)} style={{ background: "none", border: `1px solid ${ERP.colors.border}`, cursor: "pointer", padding: 5, borderRadius: ERP.radius.sm, color: ERP.colors.textMuted, display: "flex", flexShrink: 0 }}>
              <X size={15} />
            </button>
          </div>

          {/* Form body */}
          <div style={{ flex: 1, overflow: "auto", padding: "20px 20px 0" }}>

            <FormField label="角色名稱" sub="Role Name">
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} />
            </FormField>

            <FormField label="適用範疇" sub="Applicable Scope">
              <div style={{ position: "relative" }}>
                <select value={form.scope} onChange={e => setForm(f => ({ ...f, scope: e.target.value as ScopeCode }))}
                  style={{ ...inputStyle, paddingRight: 32, appearance: "none" as const, cursor: "pointer" }}>
                  {SCOPE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown size={13} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: ERP.colors.textMuted }} />
              </div>
            </FormField>

            {/* Tier radio — CRITICAL TENDER BINDING */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: ERP.colors.textSecondary, marginBottom: 4, fontFamily: F }}>
                成就級別 <span style={{ fontSize: 10, fontWeight: 400, color: ERP.colors.textMuted, marginLeft: 6 }}>Tier Mapping · Tender SLA</span>
              </label>
              <p style={{ margin: "0 0 10px", fontSize: 11, color: ERP.colors.textMuted, lineHeight: 1.5 }}>
                級別決定此崗位的 ACORN 維度歸屬及自主積點倍數。
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {(["T3", "T2", "T1"] as TierCode[]).map(tier => {
                  const cfg = TIER_CFG[tier];
                  const isSelected = form.tier === tier;
                  return (
                    <button
                      key={tier}
                      onClick={() => setForm(f => ({ ...f, tier }))}
                      style={{
                        display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 14px",
                        borderRadius: ERP.radius.md, textAlign: "left" as const, fontFamily: F,
                        background: isSelected ? cfg.bg : ERP.colors.pageBg,
                        border: `2px solid ${isSelected ? cfg.color : ERP.colors.border}`,
                        cursor: "pointer", transition: "all 0.12s",
                        boxShadow: isSelected ? `0 0 0 3px ${cfg.bg}` : "none",
                      }}
                    >
                      {/* Radio indicator */}
                      <div style={{
                        width: 18, height: 18, borderRadius: "50%", flexShrink: 0, marginTop: 1,
                        border: `2px solid ${isSelected ? cfg.color : ERP.colors.borderStrong}`,
                        background: isSelected ? cfg.color : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.12s",
                      }}>
                        {isSelected && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}
                      </div>

                      {/* Tier info */}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                          <span style={{
                            padding: "2px 8px", borderRadius: ERP.radius.xs, fontSize: 12, fontWeight: 800,
                            background: isSelected ? cfg.color : ERP.colors.border,
                            color: isSelected ? "#fff" : ERP.colors.textMuted,
                          }}>
                            {tier}
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: isSelected ? cfg.color : ERP.colors.textPrimary }}>
                            {cfg.enLabel}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: ERP.colors.textSecondary, lineHeight: 1.4, marginBottom: 5 }}>
                          {cfg.desc}
                        </div>
                        {/* ACORN dim chip */}
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 4,
                          padding: "2px 8px", borderRadius: 9999, fontSize: 10, fontWeight: 700,
                          background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
                        }}>
                          ACORN → {cfg.acornDim} ({cfg.acornEn})
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Points input */}
            <FormField label="自主積點獎勵" sub="Base Points per Achievement">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ position: "relative", flex: 1 }}>
                  <Zap size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: ERP.colors.amber, pointerEvents: "none" }} />
                  <input
                    type="number" min={0} max={200} value={form.points}
                    onChange={e => setForm(f => ({ ...f, points: Math.max(0, Number(e.target.value)) }))}
                    style={{ ...inputStyle, paddingLeft: 30, fontWeight: 700, fontSize: 15, color: ERP.colors.amber }}
                  />
                </div>
                <span style={{ fontSize: 13, color: ERP.colors.textMuted, fontWeight: 600 }}>分 pts</span>
              </div>
              <p style={{ margin: "5px 0 0", fontSize: 11, color: ERP.colors.textMuted }}>
                × 出席次數倍數，由系統自動計算總積點。
              </p>
            </FormField>

            {/* Summary card */}
            <div style={{
              margin: "4px 0 20px", padding: "12px 14px",
              background: tierCfg.bg, borderRadius: ERP.radius.md,
              border: `1px solid ${tierCfg.border}`,
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: tierCfg.color, marginBottom: 6 }}>積點預覽 Point Preview</div>
              <div style={{ display: "flex", gap: 20 }}>
                {[
                  { label: "單次獎勵", value: `${form.points} pts` },
                  { label: "學年上限", value: `${form.points * 12} pts` },
                  { label: "ACORN",   value: tierCfg.acornDim },
                ].map(item => (
                  <div key={item.label}>
                    <div style={{ fontSize: 10, color: tierCfg.color, fontWeight: 500, opacity: 0.7 }}>{item.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: tierCfg.color }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Footer */}
          <div style={{ padding: "14px 20px", borderTop: `1px solid ${ERP.colors.border}`, display: "flex", gap: 10, justifyContent: "flex-end", background: ERP.colors.surface, flexShrink: 0 }}>
            <button onClick={() => setSelectedId(null)} style={{ padding: "8px 18px", borderRadius: ERP.radius.md, border: `1px solid ${ERP.colors.border}`, background: "transparent", color: ERP.colors.textSecondary, fontSize: 13, fontFamily: F, cursor: "pointer" }}>
              取消 Cancel
            </button>
            <button style={{ padding: "8px 20px", borderRadius: ERP.radius.md, border: "none", background: ERP.colors.accent, color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: F, cursor: "pointer", boxShadow: `0 2px 8px ${ERP.colors.accent}40` }}>
              儲存 Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
