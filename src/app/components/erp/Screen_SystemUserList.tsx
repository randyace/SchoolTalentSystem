// ─────────────────────────────────────────────────────────────────────────────
// Screen_SystemUserList.tsx — System User Management list (Chunk 2)
// KPI cards + smart search/filters + data-dense action table
// ─────────────────────────────────────────────────────────────────────────────
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ERP } from "./erpTokens";
import {
  Users, UserCheck, Lock, Search, Shield, ShieldCheck, ShieldOff,
  CheckCircle2, XCircle, Loader2, ChevronLeft, ChevronRight, RefreshCw,
  UserPlus, X, KeyRound, Shuffle,
} from "lucide-react";
import { UserSecurityPanel } from "./UserSecurityPanel";

export type SystemUserRow = {
  id: number;
  username: string;
  email: string;
  name: string;
  role: "staff" | "student" | "parent" | string;
  role_label?: string;
  status: "active" | "inactive" | string;
  is_locked: boolean;
  two_factor_enabled: boolean;
  active_sessions: number;
  last_login_at?: string | null;
  last_login_ip?: string | null;
};

type Stats = {
  total_users: number;
  active_staff: number;
  locked_accounts: number;
};

type Pagination = {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
};

export type ScreenSystemUserListProps = {
  systemUsersUrl?: string;
  storeUrl?: string;
  securityDetailUrl?: string;
  csrfName?: string;
  csrfHash?: string;
};

const ROLE_OPTS = [
  { value: "", label: "全部身份" },
  { value: "super_admin", label: "Super Admin" },
  { value: "admin", label: "System Admin" },
  { value: "staff", label: "Teacher / Panel Head" },
  { value: "student", label: "學生 (Student)" },
  { value: "parent", label: "家長 (Parent)" },
];

const CREATE_ROLE_OPTS = [
  { value: "super_admin", label: "Super Admin" },
  { value: "admin", label: "System Admin" },
  { value: "staff", label: "Teacher / Panel Head" },
  { value: "student", label: "Student" },
  { value: "parent", label: "Parent" },
];

const STATUS_OPTS = [
  { value: "", label: "全部狀態" },
  { value: "active", label: "啟用中 (Active)" },
  { value: "inactive", label: "已停用 (Inactive)" },
  { value: "locked", label: "已鎖定 (Locked)" },
];

const ROLE_BADGE: Record<string, { bg: string; color: string; bd: string; label: string }> = {
  super_admin: { bg: "#FEF2F2", color: "#B91C1C", bd: "#FECACA", label: "Super Admin" },
  admin:       { bg: "#FFF7ED", color: "#C2410C", bd: "#FED7AA", label: "System Admin" },
  staff:       { bg: "#EFF6FF", color: "#1D4ED8", bd: "#BFDBFE", label: "Teacher" },
  student:     { bg: "#ECFDF5", color: "#047857", bd: "#A7F3D0", label: "學生" },
  parent:      { bg: "#F5F3FF", color: "#6D28D9", bd: "#DDD6FE", label: "家長" },
};

function randomPassword(len = 12): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@$%";
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  return Array.from(arr, b => chars[b % chars.length]).join("");
}

function formatLastLogin(iso?: string | null): string {
  if (!iso) return "—";
  const t = Date.parse(iso.replace(" ", "T"));
  if (!Number.isFinite(t)) return iso;
  const d = new Date(t);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const selectStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "8px 12px",
  borderRadius: 8,
  border: `1.5px solid ${ERP.colors.border}`,
  background: ERP.colors.surface,
  color: ERP.colors.textPrimary,
  fontSize: 12.5,
  fontFamily: ERP.font.family,
  outline: "none",
  cursor: "pointer",
};

const FilterSelect: React.FC<{
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  width?: number | string;
}> = ({ label, value, options, onChange, width = 160 }) => (
  <div style={{ width }}>
    <div style={{ fontSize: 10.5, fontWeight: 600, color: ERP.colors.textMuted, marginBottom: 3, letterSpacing: "0.04em" }}>
      {label}
    </div>
    <select value={value} onChange={(e) => onChange(e.target.value)} style={selectStyle}>
      {options.map((o) => (
        <option key={o.value || "__all"} value={o.value}>{o.label}</option>
      ))}
    </select>
  </div>
);

export function Screen_SystemUserList({
  systemUsersUrl = "/api/system-users",
  storeUrl = "/api/system-users/store",
  securityDetailUrl = "/admin/system-users",
}: ScreenSystemUserListProps) {
  const F = ERP.font.family;
  const [isMobile, setIsMobile] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [role, setRole] = useState("staff"); // default 教職員
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [rows, setRows] = useState<SystemUserRow[]>([]);
  const [stats, setStats] = useState<Stats>({ total_users: 0, active_staff: 0, locked_accounts: 0 });
  const [pagination, setPagination] = useState<Pagination>({ page: 1, per_page: 20, total: 0, total_pages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "staff",
    status: "active",
    linked_id: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showPwd, setShowPwd] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(searchQ.trim()), 280);
    return () => clearTimeout(t);
  }, [searchQ]);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("per_page", String(perPage));
      if (role) params.set("role", role);
      if (status) params.set("status", status);
      if (debouncedQ) params.set("search", debouncedQ);

      const res = await fetch(`${systemUsersUrl}?${params.toString()}`, {
        credentials: "same-origin",
        headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.ok && data.status !== "success") {
        throw new Error(data.message || "載入失敗");
      }
      setRows(Array.isArray(data.data) ? data.data : []);
      if (data.stats) {
        setStats({
          total_users: Number(data.stats.total_users || 0),
          active_staff: Number(data.stats.active_staff || 0),
          locked_accounts: Number(data.stats.locked_accounts || 0),
        });
      }
      if (data.pagination) {
        setPagination({
          page: Number(data.pagination.page || page),
          per_page: Number(data.pagination.per_page || perPage),
          total: Number(data.pagination.total || 0),
          total_pages: Number(data.pagination.total_pages || 0),
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "無法載入用戶列表");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [systemUsersUrl, page, perPage, role, status, debouncedQ]);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  const openSecurity = (userId: number) => {
    const base = securityDetailUrl.replace(/\/$/, "");
    window.location.href = `${base}/${userId}/security`;
  };

  const resetCreateForm = () => {
    setForm({ name: "", email: "", password: "", role: "staff", status: "active", linked_id: "" });
    setFormErrors({});
    setShowPwd(false);
  };

  const openCreate = () => {
    resetCreateForm();
    setShowCreate(true);
  };

  const submitCreate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (creating) return;
    setCreating(true);
    setFormErrors({});
    setError("");
    try {
      const res = await fetch(storeUrl, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role,
          status: form.status,
          linked_id: form.linked_id.trim() || null,
          send_invite: true,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || (!json?.ok && !json?.success)) {
        if (json?.errors && typeof json.errors === "object") {
          setFormErrors(json.errors as Record<string, string>);
        }
        setError(json?.message || "建立用戶失敗");
        return;
      }
      setShowCreate(false);
      resetCreateForm();
      setToast(json.message || "用戶已成功創建");
      setTimeout(() => setToast(null), 4000);
      if (json.data) {
        setRows(prev => [json.data as SystemUserRow, ...prev.filter(r => r.id !== json.data.id)]);
        setStats(s => ({ ...s, total_users: s.total_users + 1 }));
      }
      await fetchList();
    } catch {
      setError("建立用戶失敗，請重試。");
    } finally {
      setCreating(false);
    }
  };

  const kpiCards = useMemo(() => [
    {
      label: "總用戶數",
      sub: "Total Users",
      value: stats.total_users,
      icon: Users,
      color: ERP.colors.accent,
      bg: ERP.colors.accentPale,
      border: "#BFDBFE",
    },
    {
      label: "啟用教職員",
      sub: "Active Staff",
      value: stats.active_staff,
      icon: UserCheck,
      color: ERP.colors.success,
      bg: ERP.colors.successLight,
      border: "#A7F3D0",
    },
    {
      label: "已鎖定帳戶",
      sub: "Locked Accounts",
      value: stats.locked_accounts,
      icon: Lock,
      color: ERP.colors.amber,
      bg: ERP.colors.amberLight,
      border: "#FDE68A",
    },
  ], [stats]);

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100%", overflow: "hidden",
      background: ERP.colors.pageBg, fontFamily: F,
    }}>
      {/* Header */}
      <div style={{
        padding: isMobile ? "16px 16px 12px" : "20px 24px 14px",
        flexShrink: 0,
        borderBottom: `1px solid ${ERP.colors.border}`,
        background: ERP.colors.surface,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: isMobile ? 17 : 20, fontWeight: 800, color: ERP.colors.textPrimary, letterSpacing: "-0.3px" }}>
              系統用戶管理
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: ERP.colors.textMuted }}>
              System User Management · 身份帳戶與安全狀態
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
            <button
              type="button"
              onClick={() => void fetchList()}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "8px 12px", borderRadius: 8,
                border: `1px solid ${ERP.colors.border}`, background: ERP.colors.surface,
                color: ERP.colors.textSecondary, fontSize: 12, fontWeight: 600,
                fontFamily: F, cursor: "pointer",
              }}
            >
              <RefreshCw size={13} /> 重新整理
            </button>
            <button
              type="button"
              onClick={openCreate}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "8px 14px", borderRadius: 8, border: "none",
                background: ERP.colors.accent, color: "#fff",
                fontSize: 12, fontWeight: 700, fontFamily: F, cursor: "pointer",
                boxShadow: `0 2px 8px ${ERP.colors.accent}40`,
              }}
            >
              <UserPlus size={14} /> 新增用戶 Create User
            </button>
          </div>
        </div>
      </div>

      {toast && (
        <div style={{
          position: "fixed", top: 18, right: 18, zIndex: 90,
          padding: "12px 16px", borderRadius: 10, background: "#ECFDF5",
          border: "1px solid #A7F3D0", color: "#065F46",
          fontSize: 13, fontWeight: 700, boxShadow: "0 8px 24px rgba(15,23,42,0.12)",
          display: "flex", alignItems: "center", gap: 8, maxWidth: 420,
        }}>
          <CheckCircle2 size={16} /> {toast}
        </div>
      )}

      <div style={{ flex: 1, overflow: "auto", padding: isMobile ? 14 : "18px 24px 28px", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* KPI cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
          gap: 12,
        }}>
          {kpiCards.map((c) => (
            <div
              key={c.label}
              style={{
                background: ERP.colors.surface, borderRadius: 12,
                border: `1px solid ${ERP.colors.border}`, padding: "16px 18px",
                display: "flex", alignItems: "center", gap: 14,
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: c.bg, border: `1px solid ${c.border}`,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <c.icon size={18} color={c.color} />
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: ERP.colors.textPrimary, lineHeight: 1 }}>{c.value}</div>
                <div style={{ fontSize: 11, color: ERP.colors.textMuted, marginTop: 3, fontWeight: 500 }}>
                  {c.label} <span style={{ color: ERP.colors.textDisabled }}>· {c.sub}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filter + search bar */}
        <div style={{
          background: ERP.colors.surface, borderRadius: 12,
          border: `1px solid ${ERP.colors.border}`, padding: "14px 16px",
          display: "flex",
          alignItems: isMobile ? "stretch" : "flex-end",
          flexDirection: isMobile ? "column" : "row",
          gap: isMobile ? 10 : 12,
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr 1fr" : "auto auto",
            gap: isMobile ? 8 : 12,
            alignItems: "end",
          }}>
            <FilterSelect
              label="身份 Role"
              value={role}
              options={ROLE_OPTS}
              onChange={(v) => { setRole(v); setPage(1); }}
              width={isMobile ? "100%" : 168}
            />
            <FilterSelect
              label="狀態 Status"
              value={status}
              options={STATUS_OPTS}
              onChange={(v) => { setStatus(v); setPage(1); }}
              width={isMobile ? "100%" : 180}
            />
          </div>

          {!isMobile && <div style={{ width: 1, height: 36, background: ERP.colors.border, alignSelf: "flex-end" }} />}

          <div style={{ flex: 1, minWidth: isMobile ? 0 : 240 }}>
            <div style={{ fontSize: 10.5, fontWeight: 600, color: ERP.colors.textMuted, marginBottom: 3, letterSpacing: "0.04em" }}>
              智能搜尋 Smart Search
            </div>
            <div style={{ position: "relative" }}>
              <Search size={14} color={ERP.colors.textMuted} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              <input
                value={searchQ}
                onChange={(e) => { setSearchQ(e.target.value); setPage(1); }}
                placeholder="搜尋姓名、Email 或 ID..."
                style={{
                  width: "100%", boxSizing: "border-box",
                  padding: "8px 12px 8px 34px", borderRadius: 8,
                  border: `1.5px solid ${ERP.colors.border}`,
                  background: ERP.colors.surface, color: ERP.colors.textPrimary,
                  fontSize: 12.5, fontFamily: F, outline: "none",
                  boxShadow: "inset 0 1px 2px rgba(0,0,0,0.03)",
                }}
              />
            </div>
          </div>
        </div>

        {error && (
          <div style={{
            padding: "10px 14px", borderRadius: 10, fontSize: 12.5, fontWeight: 600,
            background: ERP.colors.redLight, color: ERP.colors.red, border: `1px solid #FECACA`,
          }}>
            {error}
          </div>
        )}

        {/* Data table */}
        <div style={{
          background: ERP.colors.surface, borderRadius: 14,
          border: `1px solid ${ERP.colors.border}`, overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}>
          <div style={{
            padding: "12px 16px", borderBottom: `1px solid ${ERP.colors.border}`,
            background: "#FAFAFA", display: "flex", alignItems: "center", gap: 8,
          }}>
            <Users size={14} color={ERP.colors.accent} />
            <span style={{ fontSize: 13, fontWeight: 700, color: ERP.colors.textPrimary }}>用戶列表</span>
            <span style={{ fontSize: 11, color: ERP.colors.textMuted }}>User Directory</span>
            <span style={{
              marginLeft: 4, padding: "1px 8px", borderRadius: 999, fontSize: 10.5, fontWeight: 700,
              background: ERP.colors.accentPale, color: ERP.colors.accent, border: `1px solid #BFDBFE`,
            }}>
              {pagination.total}
            </span>
            {loading && <Loader2 size={14} color={ERP.colors.accent} style={{ marginLeft: "auto", animation: "spin 0.8s linear infinite" }} />}
          </div>

          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: F, fontSize: 13 }}>
              <thead>
                <tr style={{ background: ERP.colors.pageBg, textAlign: "left" }}>
                  {["ID", "姓名 / Name", "身份 Role", "狀態 Status", "2FA", "最後登入 Last Login", "操作 Actions"].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "10px 14px", fontSize: 10.5, fontWeight: 700,
                        color: ERP.colors.textMuted, borderBottom: `1px solid ${ERP.colors.border}`,
                        whiteSpace: "nowrap", letterSpacing: "0.03em",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {!loading && rows.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ padding: 32, textAlign: "center", color: ERP.colors.textMuted, fontSize: 13 }}>
                      沒有符合條件的用戶。
                    </td>
                  </tr>
                )}
                {rows.map((r, ri) => {
                  const badge = ROLE_BADGE[r.role] || ROLE_BADGE.staff;
                  const locked = !!r.is_locked;
                  const inactive = r.status === "inactive";
                  return (
                    <tr
                      key={r.id}
                      style={{ borderBottom: ri < rows.length - 1 ? `1px solid ${ERP.colors.border}` : "none" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#F8FAFC"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                    >
                      <td style={{ padding: "12px 14px", fontFamily: ERP.font.mono, fontSize: 12, color: ERP.colors.textSecondary }}>
                        {r.id}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ fontWeight: 700, color: ERP.colors.textPrimary }}>{r.name || r.username}</div>
                        <div style={{ fontSize: 11, color: ERP.colors.textMuted, marginTop: 2 }}>
                          {r.username} · {r.email}
                        </div>
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{
                          display: "inline-flex", alignItems: "center",
                          padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700,
                          background: badge.bg, color: badge.color, border: `1px solid ${badge.bd}`,
                        }}>
                          {r.role_label || badge.label}
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        {locked ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, color: ERP.colors.amber }}>
                            <Lock size={13} color={ERP.colors.amber} /> 已鎖定
                          </span>
                        ) : inactive ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, color: ERP.colors.textMuted }}>
                            <XCircle size={13} color={ERP.colors.textMuted} /> 已停用
                          </span>
                        ) : (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, color: ERP.colors.success }}>
                            <CheckCircle2 size={13} color={ERP.colors.success} /> 啟用中
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        {r.two_factor_enabled ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 700, color: "#047857" }} title="2FA 已啟用">
                            <ShieldCheck size={14} color="#047857" /> 開
                          </span>
                        ) : (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 600, color: ERP.colors.textMuted }} title="2FA 未設定">
                            <ShieldOff size={14} color={ERP.colors.textMuted} /> 關
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                        <div style={{ fontSize: 12, color: ERP.colors.textSecondary, fontFamily: ERP.font.mono }}>
                          {formatLastLogin(r.last_login_at)}
                        </div>
                        {r.last_login_ip && (
                          <div style={{ fontSize: 10.5, color: ERP.colors.textMuted, marginTop: 2 }}>{r.last_login_ip}</div>
                        )}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); openSecurity(r.id); }}
                          style={{
                            display: "inline-flex", alignItems: "center", gap: 6,
                            padding: "6px 12px", borderRadius: 8, cursor: "pointer",
                            background: "#EFF6FF", border: `1px solid #BFDBFE`,
                            color: ERP.colors.accent, fontSize: 11.5, fontWeight: 700, fontFamily: F,
                            whiteSpace: "nowrap",
                          }}
                        >
                          <Shield size={13} color={ERP.colors.accent} />
                          🛡️ 安全管理
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{
            padding: "12px 16px", borderTop: `1px solid ${ERP.colors.border}`,
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap",
            background: "#FAFAFA",
          }}>
            <span style={{ fontSize: 11.5, color: ERP.colors.textMuted }}>
              第 {pagination.page} / {Math.max(1, pagination.total_pages)} 頁 · 共 {pagination.total} 筆
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 4, padding: "6px 10px",
                  borderRadius: 7, border: `1px solid ${ERP.colors.border}`,
                  background: ERP.colors.surface, cursor: page <= 1 ? "default" : "pointer",
                  fontSize: 12, fontFamily: F, color: ERP.colors.textSecondary, opacity: page <= 1 ? 0.5 : 1,
                }}
              >
                <ChevronLeft size={13} /> 上一頁
              </button>
              <button
                type="button"
                disabled={page >= pagination.total_pages || loading || pagination.total_pages < 1}
                onClick={() => setPage((p) => p + 1)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 4, padding: "6px 10px",
                  borderRadius: 7, border: `1px solid ${ERP.colors.border}`,
                  background: ERP.colors.surface,
                  cursor: page >= pagination.total_pages ? "default" : "pointer",
                  fontSize: 12, fontFamily: F, color: ERP.colors.textSecondary,
                  opacity: page >= pagination.total_pages ? 0.5 : 1,
                }}
              >
                下一頁 <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {showCreate && (
        <div
          role="dialog"
          aria-modal="true"
          id="createUserModal"
          onClick={() => !creating && setShowCreate(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 80,
            background: "rgba(15,23,42,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
          }}
        >
          <form
            onSubmit={submitCreate}
            onClick={e => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: 560, background: ERP.colors.surface,
              borderRadius: 14, border: `1px solid ${ERP.colors.border}`,
              boxShadow: "0 20px 50px rgba(15,23,42,0.25)", overflow: "hidden", fontFamily: F,
            }}
          >
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "16px 18px", borderBottom: `1px solid ${ERP.colors.border}`,
              background: "linear-gradient(180deg, #F8FAFC 0%, #fff 100%)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, background: ERP.colors.accentPale,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <UserPlus size={18} color={ERP.colors.accent} />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: ERP.colors.textPrimary }}>新增系統用戶</div>
                  <div style={{ fontSize: 11, color: ERP.colors.textMuted }}>Create System User · RBAC</div>
                </div>
              </div>
              <button type="button" disabled={creating} onClick={() => setShowCreate(false)} style={{
                border: "none", background: "transparent", cursor: "pointer", color: ERP.colors.textMuted,
              }}><X size={18} /></button>
            </div>

            <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
                <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: ERP.colors.textSecondary }}>姓名 Name *</span>
                  <input
                    required
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="中文 / English"
                    style={{
                      padding: "9px 12px", borderRadius: 8,
                      border: `1.5px solid ${formErrors.name ? "#FECACA" : ERP.colors.border}`,
                      fontSize: 13, fontFamily: F, outline: "none",
                    }}
                  />
                  {formErrors.name && <span style={{ fontSize: 11, color: "#B91C1C" }}>{formErrors.name}</span>}
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: ERP.colors.textSecondary }}>電郵地址 Email *</span>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="login@school.edu.hk"
                    style={{
                      padding: "9px 12px", borderRadius: 8,
                      border: `1.5px solid ${formErrors.email ? "#FECACA" : ERP.colors.border}`,
                      fontSize: 13, fontFamily: F, outline: "none",
                    }}
                  />
                  {formErrors.email && <span style={{ fontSize: 11, color: "#B91C1C" }}>{formErrors.email}</span>}
                </label>
              </div>

              <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: ERP.colors.textSecondary }}>臨時密碼 Temporary Password *</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ position: "relative", flex: 1 }}>
                    <KeyRound size={14} color={ERP.colors.textMuted} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
                    <input
                      required
                      type={showPwd ? "text" : "password"}
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      placeholder="最少 8 位"
                      minLength={8}
                      style={{
                        width: "100%", boxSizing: "border-box" as const,
                        padding: "9px 12px 9px 32px", borderRadius: 8,
                        border: `1.5px solid ${formErrors.password ? "#FECACA" : ERP.colors.border}`,
                        fontSize: 13, fontFamily: F, outline: "none",
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => { setForm(f => ({ ...f, password: randomPassword() })); setShowPwd(true); }}
                    title="Generate Random"
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 5, padding: "0 12px",
                      borderRadius: 8, border: `1px solid ${ERP.colors.border}`,
                      background: ERP.colors.pageBg, fontSize: 11, fontWeight: 700,
                      fontFamily: F, cursor: "pointer", whiteSpace: "nowrap" as const,
                    }}
                  >
                    <Shuffle size={13} /> Generate
                  </button>
                </div>
                {formErrors.password && <span style={{ fontSize: 11, color: "#B91C1C" }}>{formErrors.password}</span>}
                <button type="button" onClick={() => setShowPwd(v => !v)} style={{
                  alignSelf: "flex-start", border: "none", background: "transparent",
                  fontSize: 11, color: ERP.colors.accent, fontWeight: 600, cursor: "pointer", padding: 0, fontFamily: F,
                }}>{showPwd ? "隱藏密碼" : "顯示密碼"}</button>
              </label>

              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
                <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: ERP.colors.textSecondary }}>系統身份 System Role *</span>
                  <select
                    value={form.role}
                    onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                    style={{
                      padding: "9px 12px", borderRadius: 8, border: `1.5px solid ${formErrors.role ? "#FECACA" : ERP.colors.border}`,
                      fontSize: 13, fontFamily: F, background: ERP.colors.surface, outline: "none",
                    }}
                  >
                    {CREATE_ROLE_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  {formErrors.role && <span style={{ fontSize: 11, color: "#B91C1C" }}>{formErrors.role}</span>}
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: ERP.colors.textSecondary }}>帳戶狀態 Status</span>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, status: f.status === "active" ? "inactive" : "active" }))}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "9px 12px", borderRadius: 8, border: `1.5px solid ${ERP.colors.border}`,
                      background: form.status === "active" ? "#ECFDF5" : "#F8FAFC",
                      cursor: "pointer", fontFamily: F,
                    }}
                  >
                    <span style={{
                      fontSize: 13, fontWeight: 700,
                      color: form.status === "active" ? "#047857" : ERP.colors.textMuted,
                    }}>
                      {form.status === "active" ? "啟動 Active" : "停用 Disabled"}
                    </span>
                    <span style={{
                      width: 40, height: 22, borderRadius: 999, padding: 2,
                      background: form.status === "active" ? ERP.colors.success : "#CBD5E1",
                      display: "flex", alignItems: "center",
                      justifyContent: form.status === "active" ? "flex-end" : "flex-start",
                      transition: "background 0.15s",
                    }}>
                      <span style={{
                        width: 18, height: 18, borderRadius: "50%", background: "#fff",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                      }} />
                    </span>
                  </button>
                </div>
              </div>

              <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: ERP.colors.textSecondary }}>
                  關聯教職員/學生 ID (Linked ID) · Optional
                </span>
                <input
                  value={form.linked_id}
                  onChange={e => setForm(f => ({ ...f, linked_id: e.target.value }))}
                  placeholder="例：S00001 或 學生主鍵"
                  style={{
                    padding: "9px 12px", borderRadius: 8,
                    border: `1.5px solid ${formErrors.linked_id ? "#FECACA" : ERP.colors.border}`,
                    fontSize: 13, fontFamily: F, outline: "none",
                  }}
                />
                {formErrors.linked_id && <span style={{ fontSize: 11, color: "#B91C1C" }}>{formErrors.linked_id}</span>}
              </label>
            </div>

            <div style={{
              display: "flex", justifyContent: "flex-end", gap: 8, padding: "14px 18px",
              borderTop: `1px solid ${ERP.colors.border}`, background: "#FAFAFA",
            }}>
              <button
                type="button"
                disabled={creating}
                onClick={() => setShowCreate(false)}
                style={{
                  padding: "9px 14px", borderRadius: 8, border: `1px solid ${ERP.colors.border}`,
                  background: "#fff", fontSize: 13, fontWeight: 600, fontFamily: F, cursor: "pointer",
                }}
              >
                取消 Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "9px 16px", borderRadius: 8, border: "none",
                  background: ERP.colors.accent, color: "#fff",
                  fontSize: 13, fontWeight: 700, fontFamily: F,
                  cursor: creating ? "wait" : "pointer", opacity: creating ? 0.7 : 1,
                }}
              >
                {creating ? <Loader2 size={14} style={{ animation: "spin 0.8s linear infinite" }} /> : <UserPlus size={14} />}
                {creating ? "儲存中…" : "儲存並發送邀請通知 Save & Send Invite"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

/** Alias matching task name */
export const SystemUserList = Screen_SystemUserList;

export { UserSecurityPanel } from "./UserSecurityPanel";

/** Security detail page wrapper (Chunk 3) */
export const Screen_SystemUserSecurity: React.FC<{
  userId?: number | null;
  listUrl?: string;
  systemUsersUrl?: string;
  csrfName?: string;
  csrfHash?: string;
}> = ({
  userId,
  listUrl = "/admin/system-users",
  systemUsersUrl = "/api/system-users",
  csrfName,
  csrfHash,
}) => (
  <UserSecurityPanel
    userId={Number(userId) || 0}
    listUrl={listUrl}
    systemUsersUrl={systemUsersUrl}
    csrfName={csrfName}
    csrfHash={csrfHash}
  />
);
