// ─────────────────────────────────────────────────────────────────────────────
// Screen 1.D.6  角色與崗位 / Roles & Positions
// UI Pattern: Left Table + Right Slide-out Drawer — hydrated via /api/system-config/roles
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { ERP } from "./erpTokens";
import {
  Plus, Edit2, Trash2, Search, X, ChevronDown, Check,
  Star, Crown, Users, Shield, Zap, Sparkles, Loader2,
} from "lucide-react";

const NEW_ID = "__new__";

type ScopeCode = "學會限定" | "全校通用" | "學術比賽" | "體驗活動" | "體藝活動" | string;

interface RoleRow {
  id: string;
  name: string;
  enName: string;
  iconType: string;
  scope: ScopeCode;
  tier: string;
  acornDim: string;
  points: number;
  annualCap: number;
  isActive: boolean;
}

interface TierCard {
  tier_code: string;
  name_en: string;
  description_zh: string;
  acorn_dimensions: string[];
  base_multiplier: number;
}

interface RoleForm {
  name: string;
  enName: string;
  scope: ScopeCode;
  tier: string;
  acornDim: string;
  points: number;
  annualCap: number;
  iconType: string;
}

const SCOPE_OPTIONS: ScopeCode[] = ["學會限定", "全校通用", "學術比賽", "體驗活動"];

const SCOPE_COLOR: Record<string, { bg: string; color: string }> = {
  "學會限定": { bg: "#EDE9FE", color: "#6D28D9" },
  "全校通用": { bg: "#DBEAFE", color: "#1D4ED8" },
  "學術比賽": { bg: "#FEF3C7", color: "#92400E" },
  "體驗活動": { bg: "#FCE7F3", color: "#BE185D" },
  "體藝活動": { bg: "#FCE7F3", color: "#BE185D" },
};

const ACORN_EN: Record<string, string> = {
  領導: "Nurturing", 協作: "Realm", 社群: "Collaborative",
  創意: "Opportunity", 認知: "Academic", 體適能: "Faith",
};
const acornBadge = (dim: string) =>
  (ERP.acornTags as Record<string, { label?: string }>)[dim]?.label ?? dim;

function apiHeaders(csrfHash?: string): HeadersInit {
  const h: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  };
  if (csrfHash) h["X-CSRF-TOKEN"] = csrfHash;
  return h;
}

function roleIcon(type: string, color: string) {
  const props = { size: 16 as const, color };
  switch (type) {
    case "crown": return <Crown {...props} />;
    case "users": return <Users {...props} />;
    case "sparkles": return <Sparkles {...props} />;
    default: return <Star {...props} />;
  }
}

function mapApiRole(row: any): RoleRow {
  return {
    id: String(row?.id ?? ""),
    name: String(row?.name_zh ?? ""),
    enName: String(row?.name_en ?? ""),
    iconType: String(row?.icon_type ?? "star"),
    scope: String(row?.scope ?? "全校通用"),
    tier: String(row?.tier_code ?? "T1"),
    acornDim: String(row?.acorn_dimension ?? "社群"),
    points: Number(row?.base_points ?? 10),
    annualCap: Number(row?.annual_cap ?? 120),
    isActive: row?.is_active !== false && row?.is_active !== 0,
  };
}

function mapApiTier(row: any): TierCard {
  const dims = Array.isArray(row?.acorn_dimensions) ? row.acorn_dimensions.map(String) : [];
  return {
    tier_code: String(row?.tier_code ?? ""),
    name_en: String(row?.name_en ?? ""),
    description_zh: String(row?.description_zh ?? ""),
    acorn_dimensions: dims,
    base_multiplier: Number(row?.base_multiplier ?? 1),
  };
}

function tierVisual(code: string, dim: string) {
  const tag = ERP.acornTags[dim] ?? ERP.acornTags["社群"];
  return {
    bg: tag.bg, color: tag.color, border: tag.border,
    label: code, enLabel: "", desc: "", acornDim: dim,
  };
}

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

export interface ScreenRolesPositionsProps {
  lang?: "en" | "zh-HK";
  rolesUrl?: string;
  csrfName?: string;
  csrfHash?: string;
}

export const Screen_RolesPositions: React.FC<ScreenRolesPositionsProps> = ({
  rolesUrl = "/api/system-config/roles",
  csrfHash,
}) => {
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [tiers, setTiers] = useState<TierCard[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<RoleForm>({
    name: "", enName: "", scope: "學會限定", tier: "T3", acornDim: "領導",
    points: 50, annualCap: 600, iconType: "crown",
  });
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState<string | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 900);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const reload = useCallback(async (selectId?: string | null) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(rolesUrl, {
        headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
        credentials: "same-origin",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const rows = Array.isArray(json?.data) ? json.data.map(mapApiRole) : [];
      const tierCards = Array.isArray(json?.achievement_tiers)
        ? json.achievement_tiers.map(mapApiTier)
        : [];
      setRoles(rows);
      setTiers(tierCards);
      // Do not auto-select on initial load — drawer opens only via Edit / Add
      if (selectId !== undefined) {
        setSelectedId(selectId);
        if (selectId) {
          const r = rows.find((x: RoleRow) => x.id === selectId);
          if (r) {
            setForm({
              name: r.name, enName: r.enName, scope: r.scope, tier: r.tier,
              acornDim: r.acornDim, points: r.points, annualCap: r.annualCap, iconType: r.iconType,
            });
          }
        }
      }
    } catch (e) {
      setRoles([]);
      setError(e instanceof Error ? e.message : "載入失敗");
    } finally {
      setLoading(false);
    }
  }, [rolesUrl]);

  useEffect(() => { void reload(); }, [reload]);

  const isInspectorOpen = selectedId !== null;
  const isNew = selectedId === NEW_ID;
  const DRAWER_W = isMobile ? (typeof window !== "undefined" ? window.innerWidth : 440) : 440;
  const F = ERP.font.family;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return roles;
    return roles.filter(r =>
      r.name.includes(search.trim()) || r.enName.toLowerCase().includes(q) || r.scope.includes(search.trim())
    );
  }, [roles, search]);

  const tierCardsSorted = useMemo(() => {
    if (tiers.length > 0) {
      return [...tiers].sort((a, b) => b.base_multiplier - a.base_multiplier);
    }
    // Fallback cards if API returns none
    return [
      { tier_code: "T3", name_en: "Leadership / Planning", description_zh: "擔任決策性領導角色，負責策劃及統籌。", acorn_dimensions: ["領導"], base_multiplier: 3 },
      { tier_code: "T2", name_en: "Support / Execution", description_zh: "擔任支援性崗位，協助執行計劃及活動。", acorn_dimensions: ["協作"], base_multiplier: 2 },
      { tier_code: "T1", name_en: "General Participation", description_zh: "一般參與成員，完成指定任務及出席活動。", acorn_dimensions: ["社群"], base_multiplier: 1 },
    ];
  }, [tiers]);

  const activeTier = form.tier;
  const activeDim = form.acornDim || (tierCardsSorted.find(t => t.tier_code === activeTier)?.acorn_dimensions[0] ?? "社群");
  const previewStyle = tierVisual(activeTier, activeDim);
  const previewCap = form.annualCap > 0 ? form.annualCap : form.points * 12;

  const handleSelect = (r: RoleRow) => {
    if (r.id === selectedId) {
      setSelectedId(null);
      return;
    }
    setSelectedId(r.id);
    setForm({
      name: r.name, enName: r.enName, scope: r.scope, tier: r.tier,
      acornDim: r.acornDim, points: r.points, annualCap: r.annualCap, iconType: r.iconType,
    });
  };

  const openCreate = () => {
    const defaultTier = tierCardsSorted[0];
    const dim = defaultTier?.acorn_dimensions[0] ?? "領導";
    setSelectedId(NEW_ID);
    setForm({
      name: "", enName: "", scope: "學會限定",
      tier: defaultTier?.tier_code ?? "T3",
      acornDim: dim,
      points: 50, annualCap: 600,
      iconType: "crown",
    });
  };

  const selectTier = (t: TierCard) => {
    const dim = t.acorn_dimensions[0] ?? form.acornDim;
    setForm(f => ({
      ...f,
      tier: t.tier_code,
      acornDim: dim,
      iconType: t.tier_code === "T3" ? "crown" : t.tier_code === "T1" ? "star" : "users",
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.enName.trim()) {
      setError("請填寫中文與英文角色名稱。");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const body = {
        name_zh: form.name.trim(),
        name_en: form.enName.trim(),
        icon_type: form.iconType,
        scope: form.scope,
        tier_code: form.tier,
        acorn_dimension: form.acornDim,
        base_points: form.points,
        annual_cap: previewCap,
        is_active: true,
      };
      const isCreate = selectedId === NEW_ID;
      const res = await fetch(
        isCreate ? rolesUrl : `${rolesUrl.replace(/\/$/, "")}/${selectedId}`,
        {
          method: isCreate ? "POST" : "PUT",
          headers: apiHeaders(csrfHash),
          credentials: "same-origin",
          body: JSON.stringify(body),
        },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.ok === false) {
        throw new Error(String(json?.message || `儲存失敗 (HTTP ${res.status})`));
      }
      const saved = mapApiRole(json.data);
      await reload(saved.id);
      setSavedFlash(saved.id);
      setTimeout(() => setSavedFlash(null), 2200);
    } catch (e) {
      setError(e instanceof Error ? e.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`確定刪除角色「${name}」？此操作無法復原。`)) return;
    try {
      const res = await fetch(`${rolesUrl.replace(/\/$/, "")}/${id}`, {
        method: "DELETE",
        headers: apiHeaders(csrfHash),
        credentials: "same-origin",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.ok === false) {
        throw new Error(String(json?.message || "刪除失敗"));
      }
      if (selectedId === id) setSelectedId(null);
      await reload(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "刪除失敗");
    }
  };

  const tierCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of roles) map[r.tier] = (map[r.tier] ?? 0) + 1;
    return map;
  }, [roles]);

  return (
    <div style={{ display: "flex", height: isMobile ? "auto" : "100%", overflow: isMobile ? "visible" : "hidden", background: ERP.colors.pageBg, fontFamily: F }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* ── LEFT PANEL ──────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: isMobile ? "visible" : "hidden", minWidth: 0 }}>

        <div style={{ padding: "20px 24px 14px", flexShrink: 0, borderBottom: `1px solid ${ERP.colors.border}`, background: ERP.colors.surface }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: ERP.colors.textPrimary, letterSpacing: "-0.3px" }}>角色與崗位</h1>
              <p style={{ margin: "3px 0 0", fontSize: 12, color: ERP.colors.textMuted }}>
                Roles & Positions · {roles.length} 個角色定義
              </p>
            </div>
            <button
              type="button"
              onClick={openCreate}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 14px", borderRadius: ERP.radius.md,
                border: "none", background: ERP.colors.accent,
                color: "#fff", fontSize: 13, fontWeight: 600, fontFamily: F, cursor: "pointer",
              }}
            >
              <Plus size={14} /> 新增角色
            </button>
          </div>

          <div style={{ position: "relative", maxWidth: 280 }}>
            <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: ERP.colors.textMuted, pointerEvents: "none" }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="🔍 搜尋角色名稱…"
              style={{ ...inputStyle, paddingLeft: 32, fontSize: 12 }}
            />
          </div>
        </div>

        {error && (
          <div style={{ padding: "10px 24px", background: "#FEF2F2", borderBottom: "1px solid #FECACA", fontSize: 12.5, color: "#B91C1C", fontWeight: 600 }}>
            {error}
          </div>
        )}
        {savedFlash && (
          <div style={{ padding: "10px 24px", background: "#F0FDF4", borderBottom: "1px solid #BBF7D0", fontSize: 12.5, color: "#15803D", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
            <Check size={14} color="#16A34A" /> 已儲存成功
          </div>
        )}

        <div style={{ flex: isMobile ? "none" : 1, overflow: "auto", padding: "16px 24px 24px" }}>
          <div style={{ background: ERP.colors.surface, borderRadius: ERP.radius.lg, border: `1px solid ${ERP.colors.border}`, overflow: "hidden", boxShadow: ERP.shadow.xs }}>
            <div style={{ overflowX: "auto" }}>
              <div style={{ minWidth: 480, display: "grid", gridTemplateColumns: "1fr 110px 140px 90px 80px", background: ERP.colors.pageBg, borderBottom: `1px solid ${ERP.colors.border}`, padding: "0 16px" }}>
                {[
                  { label: "角色名稱", sub: "Role Name" },
                  { label: "適用範疇", sub: "Scope" },
                  { label: "成就級別", sub: "Tier" },
                  { label: "基礎積點", sub: "Base Pts" },
                  { label: "操作", sub: "Action" },
                ].map((h, i) => (
                  <div key={i} style={{ padding: "11px 8px 11px 0" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: ERP.colors.textMuted, letterSpacing: "0.05em", textTransform: "uppercase" as const }}>{h.label}</div>
                    <div style={{ fontSize: 9, color: ERP.colors.textMuted, marginTop: 1 }}>{h.sub}</div>
                  </div>
                ))}
              </div>

              {loading && (
                <div style={{ padding: "48px 16px", textAlign: "center", color: ERP.colors.textMuted, fontSize: 13 }}>
                  <Loader2 size={22} color={ERP.colors.accent} style={{ animation: "spin 0.8s linear infinite", marginBottom: 8 }} />
                  <div>載入角色中…</div>
                </div>
              )}
              {!loading && filtered.length === 0 && (
                <div style={{ padding: "48px 16px", textAlign: "center", color: ERP.colors.textMuted, fontSize: 13 }}>
                  找不到角色。請新增或調整搜尋條件。
                </div>
              )}

              {!loading && filtered.map((r, idx) => {
                const isSelected = selectedId === r.id;
                const dimStyle = tierVisual(r.tier, r.acornDim);
                const sc = SCOPE_COLOR[r.scope] ?? { bg: "#F1F5F9", color: "#475569" };
                const isFlash = savedFlash === r.id;
                return (
                  <div
                    key={r.id}
                    onClick={() => handleSelect(r)}
                    style={{
                      minWidth: 480, display: "grid", gridTemplateColumns: "1fr 110px 140px 90px 80px",
                      padding: "0 16px",
                      borderBottom: idx < filtered.length - 1 ? `1px solid ${ERP.colors.divider}` : "none",
                      background: isFlash ? "#F0FDF4" : isSelected ? "#EFF6FF" : ERP.colors.surface,
                      borderLeft: isSelected ? `3px solid ${ERP.colors.accent}` : isFlash ? "3px solid #16A34A" : "3px solid transparent",
                      cursor: "pointer", transition: "all 0.1s",
                    }}
                    onMouseEnter={e => { if (!isSelected && !isFlash) (e.currentTarget as HTMLDivElement).style.background = ERP.colors.surfaceHover; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = isFlash ? "#F0FDF4" : isSelected ? "#EFF6FF" : ERP.colors.surface; }}
                  >
                    <div style={{ padding: "13px 8px 13px 0", alignSelf: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <span>{roleIcon(r.iconType, dimStyle.color)}</span>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: isSelected ? 700 : 500, color: isSelected ? ERP.colors.accent : ERP.colors.textPrimary }}>{r.name}</div>
                          <div style={{ fontSize: 10, color: ERP.colors.textMuted, marginTop: 1 }}>{r.enName}</div>
                        </div>
                      </div>
                    </div>
                    <div style={{ padding: "13px 8px 13px 0", alignSelf: "center" }}>
                      <span style={{ padding: "2px 8px", borderRadius: ERP.radius.xs, fontSize: 11, fontWeight: 600, background: sc.bg, color: sc.color }}>{r.scope}</span>
                    </div>
                    <div style={{ padding: "13px 8px 13px 0", alignSelf: "center", display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ padding: "2px 7px", borderRadius: ERP.radius.xs, fontSize: 11, fontWeight: 800, background: dimStyle.bg, color: dimStyle.color, border: `1px solid ${dimStyle.border}` }}>{r.tier}</span>
                      <span style={{ fontSize: 10, color: ERP.colors.textMuted }}>{r.acornDim}</span>
                    </div>
                    <div style={{ padding: "13px 8px 13px 0", alignSelf: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Zap size={12} color={ERP.colors.amber} />
                        <span style={{ fontSize: 14, fontWeight: 700, color: ERP.colors.amber }}>{r.points}</span>
                        <span style={{ fontSize: 10, color: ERP.colors.textMuted }}>pts</span>
                      </div>
                    </div>
                    <div style={{ padding: "13px 0", alignSelf: "center", display: "flex", gap: 4 }} onClick={e => e.stopPropagation()}>
                      <button
                        type="button"
                        title="✏️ 編輯"
                        onClick={() => handleSelect(r)}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: ERP.colors.accent, display: "flex", borderRadius: ERP.radius.sm }}
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        type="button"
                        title="🗑️ 刪除"
                        onClick={() => handleDelete(r.id, r.name)}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: ERP.colors.textMuted, display: "flex", borderRadius: ERP.radius.sm }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ padding: "9px 16px", borderTop: `1px solid ${ERP.colors.border}`, background: ERP.colors.pageBg, display: "flex", gap: 12, flexWrap: "wrap" as const }}>
              {["T3", "T2", "T1"].map(tier => {
                const dim = tierCardsSorted.find(t => t.tier_code === tier)?.acorn_dimensions[0] ?? (tier === "T3" ? "領導" : tier === "T2" ? "協作" : "社群");
                const cfg = tierVisual(tier, dim);
                return (
                  <span key={tier} style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ padding: "1px 6px", borderRadius: ERP.radius.xs, fontWeight: 700, background: cfg.bg, color: cfg.color, fontSize: 10 }}>{tier}</span>
                    <span style={{ color: ERP.colors.textMuted }}>{tierCounts[tier] ?? 0} 個角色</span>
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT: Inspector — only mounts when open ─────────────────────── */}
      {isInspectorOpen && (
        <>
          {isMobile && (
            <div onClick={() => setSelectedId(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 199 }} />
          )}
          <div style={isMobile ? {
            position: "fixed" as const, inset: 0, zIndex: 200, width: "100%",
            display: "flex", flexDirection: "column", background: ERP.colors.surface,
          } : {
            width: DRAWER_W, maxWidth: "40%", flexShrink: 0,
            borderLeft: `1px solid ${ERP.colors.border}`,
            background: ERP.colors.surface,
            display: "flex", flexDirection: "column",
            boxShadow: "-4px 0 16px rgba(0,0,0,0.06)",
            animation: "inspectorSlideIn 0.22s cubic-bezier(0.4,0,0.2,1)",
          }}>
            <style>{`
              @keyframes inspectorSlideIn {
                from { transform: translateX(24px); opacity: 0.6; }
                to { transform: translateX(0); opacity: 1; }
              }
            `}</style>
            <div style={{ width: isMobile ? "100%" : DRAWER_W, height: "100%", display: "flex", flexDirection: "column", background: ERP.colors.surface }}>
              <div style={{ padding: "16px 20px", borderBottom: `1px solid ${ERP.colors.border}`, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexShrink: 0 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: ERP.radius.sm, background: ERP.colors.accentPale, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Shield size={14} color={ERP.colors.accent} />
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 700, color: ERP.colors.textPrimary }}>
                      {isNew ? "新增角色" : "編輯角色"}
                    </span>
                    {!isNew && form.name && (
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: ERP.radius.xs, background: previewStyle.bg, color: previewStyle.color }}>
                        {form.name}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: ERP.colors.textMuted, marginTop: 3, marginLeft: 36 }}>
                    {isNew ? "Add Role · 建立新角色設定" : "Edit Role · 修改角色設定"}
                  </div>
                </div>
                <button type="button" onClick={() => setSelectedId(null)} style={{ background: "none", border: `1px solid ${ERP.colors.border}`, cursor: "pointer", padding: 5, borderRadius: ERP.radius.sm, color: ERP.colors.textMuted, display: "flex", flexShrink: 0 }}>
                  <X size={15} />
                </button>
              </div>

              <div style={{ flex: 1, overflow: "auto", padding: "20px 20px 0" }}>
                <FormField label="角色名稱" sub="Role Name (ZH)">
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} placeholder="例如 主席" />
                </FormField>
                <FormField label="英文名稱" sub="English Name">
                  <input value={form.enName} onChange={e => setForm(f => ({ ...f, enName: e.target.value }))} style={inputStyle} placeholder="e.g. Chairperson" />
                </FormField>

                <FormField label="適用範疇" sub="Applicable Scope">
                  <div style={{ position: "relative" }}>
                    <select
                      value={form.scope}
                      onChange={e => setForm(f => ({ ...f, scope: e.target.value }))}
                      style={{ ...inputStyle, paddingRight: 32, appearance: "none" as const, cursor: "pointer" }}
                    >
                      {SCOPE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                      {!SCOPE_OPTIONS.includes(form.scope) && form.scope && (
                        <option value={form.scope}>{form.scope}</option>
                      )}
                    </select>
                    <ChevronDown size={13} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: ERP.colors.textMuted }} />
                  </div>
                </FormField>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: ERP.colors.textSecondary, marginBottom: 4, fontFamily: F }}>
                    成就級別 <span style={{ fontSize: 10, fontWeight: 400, color: ERP.colors.textMuted, marginLeft: 6 }}>Tier Mapping · Tender SLA</span>
                  </label>
                  <p style={{ margin: "0 0 10px", fontSize: 11, color: ERP.colors.textMuted, lineHeight: 1.5 }}>
                    級別決定此崗位的 ACORN 維度歸屬及自主積點倍數。
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {tierCardsSorted.map(t => {
                      const dim = t.acorn_dimensions[0] ?? "社群";
                      const cfg = tierVisual(t.tier_code, dim);
                      const isSelected = form.tier === t.tier_code;
                      return (
                        <button
                          key={t.tier_code}
                          type="button"
                          onClick={() => selectTier(t)}
                          style={{
                            display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 14px",
                            borderRadius: ERP.radius.md, textAlign: "left" as const, fontFamily: F,
                            background: isSelected ? cfg.bg : ERP.colors.pageBg,
                            border: `2px solid ${isSelected ? cfg.color : ERP.colors.border}`,
                            cursor: "pointer", transition: "all 0.12s",
                            boxShadow: isSelected ? `0 0 0 3px ${cfg.bg}` : "none",
                          }}
                        >
                          <div style={{
                            width: 18, height: 18, borderRadius: "50%", flexShrink: 0, marginTop: 1,
                            border: `2px solid ${isSelected ? cfg.color : ERP.colors.borderStrong}`,
                            background: isSelected ? cfg.color : "transparent",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            {isSelected && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                              <span style={{
                                padding: "2px 8px", borderRadius: ERP.radius.xs, fontSize: 12, fontWeight: 800,
                                background: isSelected ? cfg.color : ERP.colors.border,
                                color: isSelected ? "#fff" : ERP.colors.textMuted,
                              }}>
                                {t.tier_code}
                              </span>
                              <span style={{ fontSize: 13, fontWeight: 700, color: isSelected ? cfg.color : ERP.colors.textPrimary }}>
                                {t.name_en}
                              </span>
                            </div>
                            <div style={{ fontSize: 11, color: ERP.colors.textSecondary, lineHeight: 1.4, marginBottom: 5 }}>
                              {t.description_zh}
                            </div>
                            <span style={{
                              display: "inline-flex", alignItems: "center", gap: 4,
                              padding: "2px 8px", borderRadius: 9999, fontSize: 10, fontWeight: 700,
                              background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
                            }}>
                              ACORN → {acornBadge(dim)} ({ACORN_EN[dim] ?? dim})
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <FormField label="自主積點獎勵" sub="Base Points per Achievement">
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ position: "relative", flex: 1 }}>
                      <Zap size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: ERP.colors.amber, pointerEvents: "none" }} />
                      <input
                        type="number" min={0} max={200} value={form.points}
                        onChange={e => {
                          const pts = Math.max(0, Number(e.target.value) || 0);
                          setForm(f => ({ ...f, points: pts, annualCap: pts * 12 }));
                        }}
                        style={{ ...inputStyle, paddingLeft: 30, fontWeight: 700, fontSize: 15, color: ERP.colors.amber }}
                      />
                    </div>
                    <span style={{ fontSize: 13, color: ERP.colors.textMuted, fontWeight: 600 }}>分 pts</span>
                  </div>
                </FormField>

                <div style={{
                  margin: "4px 0 20px", padding: "12px 14px",
                  background: previewStyle.bg, borderRadius: ERP.radius.md,
                  border: `1px solid ${previewStyle.border}`,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: previewStyle.color, marginBottom: 6 }}>積點預覽 Point Preview</div>
                  <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                    {[
                      { label: "單次獎勵", value: `${form.points} pts` },
                      { label: "學年上限", value: `${previewCap} pts` },
                      { label: "ACORN", value: activeDim },
                    ].map(item => (
                      <div key={item.label}>
                        <div style={{ fontSize: 10, color: previewStyle.color, fontWeight: 500, opacity: 0.7 }}>{item.label}</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: previewStyle.color }}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ padding: "14px 20px", borderTop: `1px solid ${ERP.colors.border}`, display: "flex", gap: 10, justifyContent: "flex-end", background: ERP.colors.surface, flexShrink: 0 }}>
                <button type="button" onClick={() => setSelectedId(null)} style={{ padding: "8px 18px", borderRadius: ERP.radius.md, border: `1px solid ${ERP.colors.border}`, background: "transparent", color: ERP.colors.textSecondary, fontSize: 13, fontFamily: F, cursor: "pointer" }}>
                  取消 Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    padding: "8px 20px", borderRadius: ERP.radius.md, border: "none",
                    background: ERP.colors.accent, color: "#fff", fontSize: 13, fontWeight: 700,
                    fontFamily: F, cursor: saving ? "wait" : "pointer",
                    boxShadow: `0 2px 8px ${ERP.colors.accent}40`,
                    display: "flex", alignItems: "center", gap: 6, opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? <Loader2 size={14} style={{ animation: "spin 0.8s linear infinite" }} /> : <Check size={14} />}
                  儲存 Save
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
