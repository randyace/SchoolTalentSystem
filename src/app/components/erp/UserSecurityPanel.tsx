// ─────────────────────────────────────────────────────────────────────────────
// UserSecurityPanel.tsx — System User Security Detail (Chunk 3)
// Alert banner · 5 status cards · 5 action cards with confirm modals
// ─────────────────────────────────────────────────────────────────────────────
import React, { useCallback, useEffect, useState } from "react";
import { ERP } from "./erpTokens";
import {
  Shield, ShieldCheck, ShieldOff, Lock, Unlock, KeyRound, LogOut,
  Power, AlertTriangle, CheckCircle2, Loader2, ArrowLeft, RefreshCw,
  MonitorSmartphone, Clock, X,
} from "lucide-react";

export type SecurityStatus = {
  user_id: number;
  username: string;
  email: string;
  name: string;
  role: string;
  status: "active" | "inactive" | string;
  is_locked: boolean;
  two_factor_enabled: boolean;
  active_sessions: number;
  last_login_at?: string | null;
  last_login_ip?: string | null;
  force_logout_at?: string | null;
  has_pending_reset?: boolean;
};

export type UserSecurityPanelProps = {
  userId: number;
  systemUsersUrl?: string;
  listUrl?: string;
  csrfName?: string;
  csrfHash?: string;
  onBack?: () => void;
};

type ConfirmSpec = {
  title: string;
  body: string;
  confirmLabel: string;
  tone: "danger" | "warning" | "primary" | "success";
  action: () => Promise<void>;
};

function formatLogin(at?: string | null, ip?: string | null): { when: string; where: string } {
  if (!at) return { when: "—", where: ip || "—" };
  const t = Date.parse(String(at).replace(" ", "T"));
  if (!Number.isFinite(t)) return { when: String(at), where: ip || "—" };
  const d = new Date(t);
  const pad = (n: number) => String(n).padStart(2, "0");
  const when = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return { when, where: ip || "—" };
}

function jsonHeaders(csrfName?: string, csrfHash?: string): HeadersInit {
  const h: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  };
  if (csrfName && csrfHash) {
    h["X-CSRF-TOKEN"] = csrfHash;
    h[csrfName] = csrfHash;
  }
  return h;
}

const ROLE_LABEL: Record<string, string> = {
  staff: "教職員",
  student: "學生",
  parent: "家長",
};

const ConfirmModal: React.FC<{
  open: boolean;
  spec: ConfirmSpec | null;
  busy: boolean;
  onCancel: () => void;
}> = ({ open, spec, busy, onCancel }) => {
  if (!open || !spec) return null;
  const F = ERP.font.family;
  const tones: Record<ConfirmSpec["tone"], { bg: string; hover: string }> = {
    danger:  { bg: ERP.colors.red, hover: "#B91C1C" },
    warning: { bg: ERP.colors.orange, hover: "#C2410C" },
    primary: { bg: ERP.colors.accent, hover: ERP.colors.accentDark },
    success: { bg: ERP.colors.success, hover: "#047857" },
  };
  const t = tones[spec.tone];

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(15,23,42,0.55)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
      onClick={() => { if (!busy) onCancel(); }}
    >
      <div
        style={{
          width: "100%", maxWidth: 440, background: ERP.colors.surface,
          borderRadius: 14, border: `1px solid ${ERP.colors.border}`,
          boxShadow: "0 20px 50px rgba(15,23,42,0.25)", overflow: "hidden",
          fontFamily: F,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: "18px 20px 12px", display: "flex", justifyContent: "space-between", gap: 10 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: ERP.colors.textPrimary }}>{spec.title}</div>
            <div style={{ fontSize: 13, color: ERP.colors.textSecondary, marginTop: 8, lineHeight: 1.55 }}>{spec.body}</div>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            style={{ background: "none", border: "none", cursor: "pointer", color: ERP.colors.textMuted, padding: 4, height: 28 }}
          >
            <X size={16} />
          </button>
        </div>
        <div style={{
          padding: "12px 20px 18px", display: "flex", justifyContent: "flex-end", gap: 8,
          borderTop: `1px solid ${ERP.colors.border}`, background: "#FAFAFA",
        }}>
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            style={{
              padding: "8px 14px", borderRadius: 8, border: `1px solid ${ERP.colors.border}`,
              background: ERP.colors.surface, color: ERP.colors.textSecondary,
              fontSize: 13, fontWeight: 600, fontFamily: F, cursor: busy ? "wait" : "pointer",
            }}
          >
            取消
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => { void spec.action(); }}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "8px 16px", borderRadius: 8, border: "none",
              background: t.bg, color: "#fff",
              fontSize: 13, fontWeight: 700, fontFamily: F, cursor: busy ? "wait" : "pointer",
            }}
          >
            {busy ? <Loader2 size={14} style={{ animation: "spin 0.8s linear infinite" }} /> : null}
            {spec.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export const UserSecurityPanel: React.FC<UserSecurityPanelProps> = ({
  userId,
  systemUsersUrl = "/api/system-users",
  listUrl = "/admin/system-users",
  csrfName,
  csrfHash,
  onBack,
}) => {
  const F = ERP.font.family;
  const base = systemUsersUrl.replace(/\/$/, "");
  const [sec, setSec] = useState<SecurityStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmSpec | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  const applyStatus = useCallback((data: unknown) => {
    if (!data || typeof data !== "object") return;
    const d = data as Record<string, unknown>;
    // reset-password nests under data.security
    const payload = (d.security && typeof d.security === "object" ? d.security : d) as SecurityStatus;
    if (payload.user_id || payload.username) {
      setSec({
        user_id: Number(payload.user_id || userId),
        username: String(payload.username || ""),
        email: String(payload.email || ""),
        name: String(payload.name || ""),
        role: String(payload.role || "staff"),
        status: String(payload.status || "active"),
        is_locked: !!payload.is_locked,
        two_factor_enabled: !!payload.two_factor_enabled,
        active_sessions: Number(payload.active_sessions || 0),
        last_login_at: (payload.last_login_at as string) || null,
        last_login_ip: (payload.last_login_ip as string) || null,
        force_logout_at: (payload.force_logout_at as string) || null,
        has_pending_reset: !!payload.has_pending_reset,
      });
    }
  }, [userId]);

  const load = useCallback(async () => {
    if (!userId || userId < 1) {
      setError("缺少用戶 ID");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${base}/${userId}/security-status`, {
        credentials: "same-origin",
        headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) throw new Error(data.message || `HTTP ${res.status}`);
      applyStatus(data.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "無法載入安全狀態");
      setSec(null);
    } finally {
      setLoading(false);
    }
  }, [base, userId, applyStatus]);

  useEffect(() => {
    void load();
  }, [load]);

  const postAction = async (path: string, body?: Record<string, unknown>) => {
    setBusy(true);
    try {
      const res = await fetch(`${base}/${userId}/actions/${path}`, {
        method: "POST",
        credentials: "same-origin",
        headers: jsonHeaders(csrfName, csrfHash),
        body: JSON.stringify(body || {}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) throw new Error(data.message || `HTTP ${res.status}`);
      if (data.data) applyStatus(data.data);
      else await load();
      showToast(String(data.message || "操作成功"));
      setConfirm(null);
    } catch (e) {
      showToast("操作失敗：" + (e instanceof Error ? e.message : "錯誤"));
    } finally {
      setBusy(false);
    }
  };

  const ask = (spec: {
    title: string;
    message: string;
    confirmLabel: string;
    tone: ConfirmSpec["tone"];
    path: string;
    payload?: Record<string, unknown>;
  }) => {
    setConfirm({
      title: spec.title,
      body: spec.message,
      confirmLabel: spec.confirmLabel,
      tone: spec.tone,
      action: async () => { await postAction(spec.path, spec.payload); },
    });
  };

  const goBack = () => {
    if (onBack) onBack();
    else window.location.href = listUrl;
  };

  const inactive = sec?.status === "inactive";
  const locked = !!sec?.is_locked;
  const tfaOn = !!sec?.two_factor_enabled;
  const login = formatLogin(sec?.last_login_at, sec?.last_login_ip);

  const statusCards = sec ? [
    {
      key: "status",
      label: "ACCOUNT STATUS",
      zh: "帳戶狀態",
      icon: Power,
      value: inactive ? "Inactive" : "Active",
      valueZh: inactive ? "已停用" : "啟用中",
      color: inactive ? ERP.colors.textMuted : ERP.colors.success,
      bg: inactive ? "#F8FAFC" : ERP.colors.successLight,
      bd: inactive ? ERP.colors.border : "#A7F3D0",
    },
    {
      key: "lock",
      label: "ACCOUNT LOCK",
      zh: "帳戶鎖定",
      icon: locked ? Lock : Unlock,
      value: locked ? "Locked" : "Unlocked",
      valueZh: locked ? "已鎖定" : "未鎖定",
      color: locked ? ERP.colors.red : ERP.colors.success,
      bg: locked ? ERP.colors.redLight : ERP.colors.successLight,
      bd: locked ? "#FECACA" : "#A7F3D0",
    },
    {
      key: "2fa",
      label: "2FA",
      zh: "雙重驗證",
      icon: tfaOn ? ShieldCheck : ShieldOff,
      value: tfaOn ? "Enabled" : "Not Enabled",
      valueZh: tfaOn ? "已啟用" : "未啟用",
      color: tfaOn ? ERP.colors.success : ERP.colors.amber,
      bg: tfaOn ? ERP.colors.successLight : ERP.colors.amberLight,
      bd: tfaOn ? "#A7F3D0" : "#FDE68A",
    },
    {
      key: "sessions",
      label: "ACTIVE SESSIONS",
      zh: "作用中工作階段",
      icon: MonitorSmartphone,
      value: String(sec.active_sessions ?? 0),
      valueZh: `${sec.active_sessions ?? 0} 個裝置`,
      color: ERP.colors.accent,
      bg: ERP.colors.accentPale,
      bd: "#BFDBFE",
    },
    {
      key: "login",
      label: "LAST LOGIN",
      zh: "最後登入",
      icon: Clock,
      value: login.when,
      valueZh: login.where,
      color: ERP.colors.textPrimary,
      bg: "#F8FAFC",
      bd: ERP.colors.border,
    },
  ] : [];

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100%", overflow: "hidden",
      background: ERP.colors.pageBg, fontFamily: F,
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{
        padding: isMobile ? "14px 16px" : "18px 24px",
        borderBottom: `1px solid ${ERP.colors.border}`,
        background: ERP.colors.surface, flexShrink: 0,
      }}>
        <button
          type="button"
          onClick={goBack}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 10,
            background: "none", border: "none", cursor: "pointer", padding: 0,
            color: ERP.colors.accent, fontSize: 13, fontWeight: 700, fontFamily: F,
          }}
        >
          <ArrowLeft size={14} /> 返回用戶列表
        </button>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12,
              background: "linear-gradient(135deg, #2563EB, #7C3AED)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Shield size={20} color="#fff" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: isMobile ? 16 : 19, fontWeight: 800, color: ERP.colors.textPrimary }}>
                用戶安全管理
              </h1>
              <p style={{ margin: "3px 0 0", fontSize: 12, color: ERP.colors.textMuted }}>
                {sec
                  ? `${sec.name || sec.username} · ${ROLE_LABEL[sec.role] || sec.role} · ${sec.email}`
                  : `User #${userId} · Access & Credential Management`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading || busy}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "8px 12px", borderRadius: 8,
              border: `1px solid ${ERP.colors.border}`, background: ERP.colors.surface,
              color: ERP.colors.textSecondary, fontSize: 12, fontWeight: 600, fontFamily: F,
              cursor: loading ? "wait" : "pointer",
            }}
          >
            <RefreshCw size={13} /> 重新整理
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: isMobile ? 14 : "18px 24px 32px", display: "flex", flexDirection: "column", gap: 14 }}>

        {loading && !sec && (
          <div style={{ padding: 40, textAlign: "center", color: ERP.colors.textMuted }}>
            <Loader2 size={22} color={ERP.colors.accent} style={{ animation: "spin 0.8s linear infinite", margin: "0 auto 10px" }} />
            載入安全狀態…
          </div>
        )}

        {error && (
          <div style={{
            padding: "12px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600,
            background: ERP.colors.redLight, color: ERP.colors.red, border: "1px solid #FECACA",
          }}>
            {error}
          </div>
        )}

        {sec && (
          <>
            {/* 1. Inactive alert banner */}
            {inactive && (
              <div style={{
                display: "flex", alignItems: isMobile ? "flex-start" : "center",
                flexDirection: isMobile ? "column" : "row",
                gap: 12, padding: "14px 16px", borderRadius: 12,
                background: "#FEF2F2", border: "1px solid #FECACA",
              }}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flex: 1 }}>
                  <AlertTriangle size={18} color={ERP.colors.red} style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: "#991B1B" }}>
                      帳戶已停用 · Account Deactivated
                    </div>
                    <div style={{ fontSize: 12, color: "#B91C1C", marginTop: 3, lineHeight: 1.5 }}>
                      此用戶目前無法登入系統。啟用後即可恢復存取權限。
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => ask({
                    title: "啟用帳戶？",
                    message: `確定要啟用「${sec.name || sec.username}」嗎？啟用後用戶將可再次登入。`,
                    confirmLabel: "Activate Now",
                    tone: "success",
                    path: "toggle-status",
                    payload: { status: "active" },
                  })}
                  style={{
                    flexShrink: 0, alignSelf: isMobile ? "stretch" : "center",
                    padding: "9px 16px", borderRadius: 9, border: "none",
                    background: ERP.colors.success, color: "#fff",
                    fontSize: 13, fontWeight: 700, fontFamily: F, cursor: "pointer",
                  }}
                >
                  Activate Now
                </button>
              </div>
            )}

            {/* 2. Security Status grid */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: ERP.colors.textSecondary, marginBottom: 10, letterSpacing: "0.02em" }}>
                安全狀態 Security Status
              </div>
              <div style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(5, minmax(0, 1fr))",
                gap: 10,
              }}>
                {statusCards.map((c) => (
                  <div
                    key={c.key}
                    style={{
                      background: ERP.colors.surface, borderRadius: 12,
                      border: `1px solid ${c.bd}`, padding: "14px 14px 16px",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 8, background: c.bg,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <c.icon size={14} color={c.color} />
                      </div>
                      <div style={{ fontSize: 9.5, fontWeight: 800, color: ERP.colors.textMuted, letterSpacing: "0.06em" }}>
                        {c.label}
                      </div>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: c.color, lineHeight: 1.2 }}>{c.value}</div>
                    <div style={{ fontSize: 11, color: ERP.colors.textMuted, marginTop: 4 }}>{c.valueZh}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Security Actions grid */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: ERP.colors.textSecondary, marginBottom: 10, letterSpacing: "0.02em" }}>
                安全操作 Security Actions
              </div>
              <div style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))",
                gap: 12,
              }}>
                {/* Deactivate / Activate */}
                <ActionCard
                  icon={<Power size={18} color={inactive ? ERP.colors.success : ERP.colors.red} />}
                  iconBg={inactive ? ERP.colors.successLight : ERP.colors.redLight}
                  title={inactive ? "Activate Account" : "Deactivate Account"}
                  titleZh={inactive ? "啟用帳戶" : "停用帳戶"}
                  desc={inactive
                    ? "Restore sign-in access for this user."
                    : "Prevent the user from signing in until re-activated."}
                  buttonLabel={inactive ? "Activate" : "Deactivate"}
                  buttonTone={inactive ? "success" : "danger"}
                  disabled={busy}
                  onClick={() => ask({
                    title: inactive ? "啟用帳戶？" : "停用帳戶？",
                    message: inactive
                      ? `確定啟用「${sec.name || sec.username}」？用戶將可再次登入。`
                      : `確定停用「${sec.name || sec.username}」？停用後用戶將無法登入。`,
                    confirmLabel: inactive ? "Activate" : "Deactivate",
                    tone: inactive ? "success" : "danger",
                    path: "toggle-status",
                    payload: { status: inactive ? "active" : "inactive" },
                  })}
                />

                {/* Reset Password */}
                <ActionCard
                  icon={<KeyRound size={18} color={ERP.colors.accent} />}
                  iconBg={ERP.colors.accentPale}
                  title="Reset Password"
                  titleZh="重設密碼"
                  desc="Send a password reset link to the user's registered email address."
                  buttonLabel="Send Reset Link"
                  buttonTone="primary"
                  disabled={busy}
                  onClick={() => ask({
                    title: "發送密碼重設連結？",
                    message: `將寄送重設連結至 ${sec.email || "用戶電郵"}。連結有效期約 1 小時。`,
                    confirmLabel: "Send Reset Link",
                    tone: "primary",
                    path: "reset-password",
                  })}
                />

                {/* Force Sign Out */}
                <ActionCard
                  icon={<LogOut size={18} color={ERP.colors.orange} />}
                  iconBg={ERP.colors.orangeLight}
                  title="Force Sign Out All Sessions"
                  titleZh="強制登出所有工作階段"
                  desc="Immediately terminate all active login sessions."
                  buttonLabel="Sign Out All Sessions"
                  buttonTone="warning"
                  disabled={busy}
                  onClick={() => ask({
                    title: "強制登出所有工作階段？",
                    message: `將立即終止「${sec.name || sec.username}」的所有作用中登入（目前 ${sec.active_sessions} 個）。`,
                    confirmLabel: "Sign Out All Sessions",
                    tone: "warning",
                    path: "force-signout",
                  })}
                />

                {/* Unlock */}
                <ActionCard
                  icon={<Unlock size={18} color={locked ? ERP.colors.red : ERP.colors.textMuted} />}
                  iconBg={locked ? ERP.colors.redLight : "#F1F5F9"}
                  title="Unlock Account"
                  titleZh="解鎖帳戶"
                  desc={locked
                    ? "Clear the lockout flag so the user can attempt sign-in again."
                    : "Account is already unlocked. No action needed."}
                  buttonLabel="Unlock Account"
                  buttonTone="danger"
                  disabled={busy || !locked}
                  onClick={() => ask({
                    title: "解鎖帳戶？",
                    message: `確定解鎖「${sec.name || sec.username}」？解鎖後用戶可再次嘗試登入。`,
                    confirmLabel: "Unlock Account",
                    tone: "danger",
                    path: "unlock",
                  })}
                />

                {/* Reset 2FA */}
                <ActionCard
                  icon={<ShieldOff size={18} color={tfaOn ? "#7C3AED" : ERP.colors.textMuted} />}
                  iconBg={tfaOn ? "#EDE9FE" : "#F1F5F9"}
                  title="Reset Two-Factor Authentication"
                  titleZh="重設雙重驗證"
                  desc={tfaOn
                    ? "Clear the user's 2FA secret. They must re-enrol on next sign-in."
                    : "2FA is not enabled for this account."}
                  buttonLabel="Reset 2FA"
                  buttonTone="primary"
                  disabled={busy || !tfaOn}
                  wide
                  onClick={() => ask({
                    title: "重設雙重驗證（2FA）？",
                    message: `將清除「${sec.name || sec.username}」的 2FA 密鑰。用戶下次登入需重新設定。`,
                    confirmLabel: "Reset 2FA",
                    tone: "primary",
                    path: "reset-2fa",
                  })}
                />
              </div>
            </div>
          </>
        )}
      </div>

      <ConfirmModal
        open={!!confirm}
        spec={confirm}
        busy={busy}
        onCancel={() => { if (!busy) setConfirm(null); }}
      />

      {toast && (
        <div style={{
          position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", zIndex: 1100,
          padding: "10px 18px", borderRadius: 999, background: "#1E293B", color: "#F8FAFC",
          fontSize: 12.5, fontWeight: 600, boxShadow: "0 8px 28px rgba(15,23,42,0.28)",
          border: "1px solid rgba(255,255,255,0.08)", whiteSpace: "nowrap", pointerEvents: "none",
        }}>
          {toast}
        </div>
      )}
    </div>
  );
};

const ActionCard: React.FC<{
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  titleZh: string;
  desc: string;
  buttonLabel: string;
  buttonTone: "danger" | "warning" | "primary" | "success";
  disabled?: boolean;
  wide?: boolean;
  onClick: () => void;
}> = ({ icon, iconBg, title, titleZh, desc, buttonLabel, buttonTone, disabled, wide, onClick }) => {
  const F = ERP.font.family;
  const tones: Record<typeof buttonTone, { bg: string; disabledBg: string }> = {
    danger:  { bg: ERP.colors.red, disabledBg: "#FCA5A5" },
    warning: { bg: ERP.colors.orange, disabledBg: "#FDBA74" },
    primary: { bg: ERP.colors.accent, disabledBg: "#93C5FD" },
    success: { bg: ERP.colors.success, disabledBg: "#6EE7B7" },
  };
  const t = tones[buttonTone];

  return (
    <div style={{
      background: ERP.colors.surface, borderRadius: 12,
      border: `1px solid ${ERP.colors.border}`, padding: "16px 18px",
      display: "flex", flexDirection: "column", gap: 12,
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      gridColumn: wide ? "1 / -1" : undefined,
    }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, background: iconBg, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {icon}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 13.5, fontWeight: 800, color: ERP.colors.textPrimary }}>{titleZh}</div>
          <div style={{ fontSize: 11, color: ERP.colors.textMuted, marginTop: 1 }}>{title}</div>
          <div style={{ fontSize: 12, color: ERP.colors.textSecondary, marginTop: 8, lineHeight: 1.5 }}>{desc}</div>
        </div>
      </div>
      <div>
        <button
          type="button"
          disabled={disabled}
          onClick={onClick}
          style={{
            padding: "8px 14px", borderRadius: 8, border: "none",
            background: disabled ? t.disabledBg : t.bg, color: "#fff",
            fontSize: 12.5, fontWeight: 700, fontFamily: F,
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.65 : 1,
          }}
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
};

export default UserSecurityPanel;
