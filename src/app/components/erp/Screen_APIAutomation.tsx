// Screen_APIAutomation.tsx — 1.F.6/8 API & Webhooks (live DB-backed)
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Globe, Copy, Check, Send, Zap, Activity, Key, Shield, Clock, Webhook,
  Server, CheckCircle2, XCircle, ExternalLink, RefreshCw, Lock, Network,
  Plug, AlertCircle, Eye, Search,
} from "lucide-react";
import { ERP } from "./erpTokens";
import { useIsMobile, ResponsiveTableWrapper, rwdGrid } from "./erpResponsive";

const D = {
  pageBg: "#F1F5F9", surface: "#FFFFFF", surfaceAlt: "#F8FAFC",
  surfaceDark: "#0D1117", surfaceDark2: "#161B22",
  border: "#E2E8F0", borderDark: "#30363D",
  text1: "#0F172A", text2: "#1E293B", text3: "#475569", text4: "#94A3B8",
  accent: "#6366F1", accentDark: "#4F46E5", accentLight: "#EEF2FF", accentBd: "#C7D2FE",
  green: "#10B981", greenBg: "#ECFDF5", amber: "#F59E0B", amberBg: "#FFFBEB",
  red: "#EF4444", redBg: "#FEF2F2", n8n: "#FF6D5A", n8nBg: "#FFF5F3",
  shadow: "0 1px 3px rgba(15,23,42,0.07)", radius: "10px",
  font: ERP.font.family,
  mono: "'JetBrains Mono','Fira Code','SF Mono',monospace",
};

const EVENT_META: Record<string, { zh: string; module: string; color: string; bg: string }> = {
  "achievement.approved": { zh: "成就核准", module: "Approval", color: "#059669", bg: "#ECFDF5" },
  "pbl.stage_completed":  { zh: "PBL 階段完成", module: "PBL", color: "#7C3AED", bg: "#F5F3FF" },
  "event.created":        { zh: "活動建立", module: "Activity", color: "#2563EB", bg: "#EFF6FF" },
  "acorn.updated":        { zh: "ACORN 更新", module: "ACORN", color: "#D97706", bg: "#FFFBEB" },
  "points.distributed":   { zh: "積分派發", module: "Points", color: "#DC2626", bg: "#FEF2F2" },
};

type TabId = "tokens" | "webhooks" | "n8n" | "audit";

interface TokenCard {
  id: number; name: string; email?: string; role: string; active: boolean;
  prefix: string | null; created_at: string | null; last_used_at: string | null;
  use_count: number; scopes?: string[];
}

interface Subscription {
  id: number; event_code: string; target_url: string; http_method: string;
  timeout_sec: number; signing_secret_masked: string | null; is_active: boolean;
  last_fired_at: string | null;
}

interface Delivery {
  id: number; subscription_id?: number; event_code: string; payload_id: string;
  target_url: string; http_status: number; latency_ms: number;
  request_payload?: string; response_snippet?: string; created_at: string;
}

interface AutomationState {
  ok?: boolean;
  kpis?: {
    gateway_status: string; endpoint_count: number; total_api_calls: number;
    active_webhooks: number; active_tokens: number;
  };
  viewer_token?: TokenCard | null;
  token_directory?: TokenCard[];
  subscriptions?: Subscription[];
  deliveries?: Delivery[];
  events?: string[];
  audit_trail?: Array<{
    id: number; timestamp: string; action: string; module: string;
    teacher: string; details: string; ip: string; status: string;
  }>;
  external_base?: string;
}

export interface ScreenAPIAutomationProps {
  initialState?: AutomationState | null;
  stateUrl?: string;
  tokenRegenUrl?: string;
  tokenRevokeUrl?: string;
  webhookSaveUrl?: string;
  webhookTestUrl?: string;
  externalBase?: string;
  docsUrl?: string;
  auditLogsUrl?: string;
  csrfName?: string;
  csrfHash?: string;
}

async function postJson(url: string, body: Record<string, unknown>, csrfName?: string, csrfHash?: string) {
  const payload = { ...body };
  if (csrfName && csrfHash) payload[csrfName] = csrfHash;
  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok && data?.ok !== false, status: res.status, data };
}

const btnBase: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px",
  borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer",
  fontFamily: D.font, border: `1px solid ${D.border}`, background: D.surface, color: D.text2,
};

export const Screen_APIAutomation: React.FC<ScreenAPIAutomationProps> = ({
  initialState = null,
  stateUrl = "/api/admin/automation/state",
  tokenRegenUrl = "/api/admin/automation/token/regenerate",
  tokenRevokeUrl = "/api/admin/automation/token/revoke",
  webhookSaveUrl = "/api/admin/automation/webhook/save",
  webhookTestUrl = "/api/admin/automation/webhook/test",
  externalBase,
  docsUrl = "/api/docs",
  auditLogsUrl = "/admin/audit-logs",
  csrfName,
  csrfHash,
}) => {
  const isMobile = useIsMobile();
  const [tab, setTab] = useState<TabId>("webhooks");
  const [state, setState] = useState<AutomationState | null>(initialState);
  const [loading, setLoading] = useState(!initialState);
  const [busy, setBusy] = useState(false);
  const [rawToken, setRawToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [meTest, setMeTest] = useState<{ status: number; ms: number; body: string } | null>(null);
  const [eventFilter, setEventFilter] = useState("");
  const [selectedEvent, setSelectedEvent] = useState("event.created");
  const [formUrl, setFormUrl] = useState("");
  const [formMethod, setFormMethod] = useState("POST");
  const [formTimeout, setFormTimeout] = useState(10);
  const [formActive, setFormActive] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [detailDelivery, setDetailDelivery] = useState<Delivery | null>(null);

  const base = externalBase || state?.external_base || `${typeof window !== "undefined" ? window.location.origin : ""}/api/v1/external`;

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(stateUrl, { credentials: "include", headers: { Accept: "application/json" } });
      const data = await res.json();
      if (data?.ok !== false) setState(data);
    } catch { /* keep prior */ }
    finally { setLoading(false); }
  }, [stateUrl]);

  useEffect(() => {
    if (!initialState) void refresh();
  }, [initialState, refresh]);

  const subs = state?.subscriptions ?? [];
  const selectedSub = useMemo(
    () => subs.find((s) => s.event_code === selectedEvent) || subs[0] || null,
    [subs, selectedEvent],
  );

  useEffect(() => {
    if (!selectedSub) return;
    setFormUrl(selectedSub.target_url);
    setFormMethod(selectedSub.http_method || "POST");
    setFormTimeout(selectedSub.timeout_sec || 10);
    setFormActive(!!selectedSub.is_active);
  }, [selectedSub?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const events = (state?.events?.length ? state.events : Object.keys(EVENT_META)).filter(
    (e) => !eventFilter || e.includes(eventFilter) || (EVENT_META[e]?.zh || "").includes(eventFilter),
  );

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  const onRegenerate = async () => {
    if (!window.confirm("重新生成會立即作廢舊 Token，確定繼續？")) return;
    setBusy(true);
    const { ok, data } = await postJson(tokenRegenUrl, {}, csrfName, csrfHash);
    setBusy(false);
    if (ok && data?.raw_token) {
      setRawToken(String(data.raw_token));
      showToast("Token 已生成（僅顯示一次）");
      await refresh();
    } else {
      showToast(data?.message || "生成失敗");
    }
  };

  const onRevoke = async (userId?: number) => {
    if (!window.confirm("確定撤銷此 Token？")) return;
    setBusy(true);
    const body: Record<string, unknown> = {};
    if (userId) body.user_id = userId;
    const { ok, data } = await postJson(tokenRevokeUrl, body, csrfName, csrfHash);
    setBusy(false);
    if (ok) {
      setRawToken(null);
      showToast("Token 已撤銷");
      await refresh();
    } else showToast(data?.message || "撤銷失敗");
  };

  const onSaveWebhook = async () => {
    if (!selectedSub && !selectedEvent) return;
    setBusy(true);
    const { ok, data } = await postJson(webhookSaveUrl, {
      id: selectedSub?.id ?? 0,
      event_code: selectedEvent,
      target_url: formUrl,
      http_method: formMethod,
      timeout_sec: formTimeout,
      is_active: formActive,
    }, csrfName, csrfHash);
    setBusy(false);
    showToast(ok ? "Webhook 設定已儲存" : (data?.message || "儲存失敗"));
    if (ok) await refresh();
  };

  const onTestWebhook = async () => {
    if (!selectedSub?.id) {
      showToast("請先儲存 Webhook");
      return;
    }
    setBusy(true);
    const { ok, data } = await postJson(webhookTestUrl, { id: selectedSub.id }, csrfName, csrfHash);
    setBusy(false);
    showToast(ok ? `測試完成 HTTP ${data?.delivery?.http_status ?? "?"}` : (data?.message || "測試失敗"));
    if (ok) await refresh();
  };

  const onTestMe = async () => {
    const token = rawToken;
    if (!token) {
      showToast("請先生成 Token 後再測試");
      return;
    }
    const t0 = performance.now();
    try {
      const res = await fetch(`${base}/me`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      const text = await res.text();
      setMeTest({ status: res.status, ms: Math.round(performance.now() - t0), body: text });
      await refresh();
    } catch (e: any) {
      setMeTest({ status: 0, ms: Math.round(performance.now() - t0), body: String(e?.message || e) });
    }
  };

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  };

  const payloadPreview = useMemo(() => JSON.stringify({
    event: selectedEvent,
    payload_id: selectedEvent.startsWith("ach") ? "ACH-101" : "EVT-101",
    timestamp: new Date().toISOString(),
    source: "sts-lalp-erp-v3.2",
    actor: { user_id: state?.viewer_token?.id ?? 1, name: state?.viewer_token?.name ?? "Teacher" },
    data: { note: "preview" },
  }, null, 2), [selectedEvent, state?.viewer_token]);

  const kpis = state?.kpis;
  const viewer = state?.viewer_token;

  const tabs: { id: TabId; zh: string; en: string; icon: React.ReactNode }[] = [
    { id: "tokens", zh: "存取權杖", en: "Access Tokens", icon: <Key size={13} /> },
    { id: "webhooks", zh: "Webhook 管理", en: "Webhooks", icon: <Webhook size={13} /> },
    { id: "n8n", zh: "N8N 整合", en: "N8N", icon: <Plug size={13} /> },
    { id: "audit", zh: "API 總覽與審計", en: "Overview", icon: <Activity size={13} /> },
  ];

  const n8nWorkflow = useMemo(() => JSON.stringify({
    name: "STS External API + Webhook",
    nodes: [
      { name: "Webhook", type: "n8n-nodes-base.webhook", parameters: { path: "sts-event" } },
      { name: "GET /me", type: "n8n-nodes-base.httpRequest", parameters: { url: `${base}/me`, authentication: "genericCredentialType" } },
      { name: "GET Students", type: "n8n-nodes-base.httpRequest", parameters: { url: `${base}/students?limit=20` } },
      { name: "AI Query", type: "n8n-nodes-base.httpRequest", parameters: { url: `${base}/ai/query`, method: "POST" } },
    ],
  }, null, 2), [base]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: isMobile ? "auto" : "100%", minHeight: isMobile ? "100%" : undefined, background: D.pageBg, fontFamily: D.font, overflow: isMobile ? "visible" : "hidden" }}>
      {toast && (
        <div style={{ position: "fixed", top: 16, right: 16, zIndex: 50, background: "#0F172A", color: "#fff", padding: "10px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, boxShadow: D.shadow }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ background: D.surface, borderBottom: `1px solid ${D.border}`, flexShrink: 0 }}>
        {!isMobile && (
          <div style={{ height: 40, display: "flex", alignItems: "center", padding: "0 24px", gap: 5, fontSize: 11, borderBottom: `1px solid ${D.border}`, background: D.surfaceAlt, color: D.text4 }}>
            系統管理 <span>/</span> <span style={{ color: D.text2, fontWeight: 600 }}>API 自動化串接</span>
          </div>
        )}
        <div style={{ minHeight: 58, display: "flex", alignItems: "center", padding: isMobile ? "10px 16px" : "0 24px", gap: 10, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: isMobile ? 14 : 17, fontWeight: 800, color: D.text1 }}>🔌 API & Webhooks</div>
            {!isMobile && (
              <div style={{ fontSize: 11, color: D.text4, marginTop: 1 }}>
                Module 1.F.6/8 · Base: <span style={{ fontFamily: D.mono, color: D.accent }}>{base}</span>
              </div>
            )}
          </div>
          <a href={docsUrl} style={{ ...btnBase, textDecoration: "none" }}>
            <ExternalLink size={12} /> {!isMobile && "API 文件"}
          </a>
          <button type="button" onClick={() => setTab("tokens")} style={{ ...btnBase, background: "linear-gradient(135deg,#0F172A,#1E293B)", color: "#E2E8F0", border: "none" }}>
            <Key size={13} color="#7DD3FA" /> {isMobile ? "API Key" : "管理 API 金鑰"}
          </button>
        </div>
        <div style={{ display: "flex", gap: 0, padding: isMobile ? "0 4px" : "0 24px", overflowX: "auto", borderTop: `1px solid ${D.border}` }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: isMobile ? "10px 14px" : "10px 20px",
                border: "none", borderBottom: tab === t.id ? `2px solid ${D.accent}` : "2px solid transparent",
                background: "transparent", cursor: "pointer", fontFamily: D.font,
                color: tab === t.id ? D.accentDark : D.text3, fontWeight: tab === t.id ? 700 : 600, fontSize: 12.5, whiteSpace: "nowrap",
              }}
            >
              {t.icon} {t.zh} {!isMobile && <span style={{ fontSize: 10, color: D.text4 }}>{t.en}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div style={{ ...rwdGrid(isMobile, "repeat(3, 1fr)", "1fr", "14px", "10px"), padding: isMobile ? "12px 16px 0" : "16px 24px 0", flexShrink: 0 }}>
        {[
          { icon: <Server size={16} color={D.green} />, label: "Gateway Status", value: kpis?.gateway_status === "operational" ? "All Systems Operational" : "Degraded", sub: `${kpis?.endpoint_count ?? 7} live endpoints` },
          { icon: <Activity size={16} color={D.accent} />, label: "API & Webhook Calls", value: String(kpis?.total_api_calls ?? 0), sub: "token use + audit" },
          { icon: <Webhook size={16} color={D.n8n} />, label: "Active Webhooks", value: `${kpis?.active_webhooks ?? 0} Active`, sub: `${kpis?.active_tokens ?? 0} teacher tokens` },
        ].map((c) => (
          <div key={c.label} style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: D.radius, padding: "14px 16px", boxShadow: D.shadow }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              {c.icon}
              <span style={{ fontSize: 11, color: D.text4, fontWeight: 600 }}>{c.label}</span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: D.text1 }}>{loading ? "…" : c.value}</div>
            <div style={{ fontSize: 11, color: D.text4, marginTop: 2 }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Body */}
      <div style={{ flex: isMobile ? "none" : 1, overflow: isMobile ? "visible" : "auto", padding: isMobile ? "12px 16px 24px" : "14px 24px 24px", minHeight: 0 }}>
        {tab === "tokens" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: D.radius, padding: 18, boxShadow: D.shadow }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800 }}>{viewer?.name || "目前登入教師"}</div>
                  <div style={{ fontSize: 11, color: D.text4 }}>{viewer?.role || "—"} · {viewer?.email || ""}</div>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 999,
                  background: viewer?.active ? D.greenBg : D.surfaceAlt,
                  color: viewer?.active ? D.green : D.text4,
                }}>
                  {viewer?.active ? "🟢 已啟用 Active" : "⚪ 尚未生成"}
                </span>
              </div>
              <div style={{ fontFamily: D.mono, fontSize: 13, background: D.surfaceAlt, padding: "10px 12px", borderRadius: 8, border: `1px solid ${D.border}`, marginBottom: 10 }}>
                {viewer?.prefix || "sts_live_••••••••••••"}
              </div>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 11, color: D.text3, marginBottom: 14 }}>
                <span><Clock size={11} /> 建立：{viewer?.created_at || "—"}</span>
                <span>最後使用：{viewer?.last_used_at || "—"}</span>
                <span>調用：{viewer?.use_count ?? 0}</span>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button type="button" disabled={busy} onClick={onRegenerate} style={{ ...btnBase, background: D.accent, color: "#fff", border: "none" }}>
                  <RefreshCw size={13} /> 生成 / 重新生成 Token
                </button>
                <button type="button" disabled={busy || !viewer?.active} onClick={() => onRevoke()} style={{ ...btnBase, color: D.red, borderColor: "#FECACA", background: D.redBg }}>
                  <Lock size={13} /> 撤銷 Token
                </button>
              </div>
              {rawToken && (
                <div style={{ marginTop: 14, padding: 14, borderRadius: 10, background: "#FEF9C3", border: "1px solid #FDE68A" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#92400E", marginBottom: 6 }}>⚠️ 一次性顯示 — 請立即複製；重新生成會作廢舊 Token</div>
                  <div style={{ fontFamily: D.mono, fontSize: 12, wordBreak: "break-all", marginBottom: 8 }}>{rawToken}</div>
                  <button type="button" onClick={() => copyText(rawToken)} style={btnBase}>
                    {copied ? <Check size={13} color={D.green} /> : <Copy size={13} />} 複製 Token
                  </button>
                </div>
              )}
              <div style={{ marginTop: 16, padding: 12, background: D.surfaceDark, borderRadius: 8, color: "#E6EDF3", fontFamily: D.mono, fontSize: 11, overflowX: "auto" }}>
                <div style={{ color: "#8B949E", marginBottom: 4 }}># cURL / n8n Header</div>
                Authorization: Bearer {rawToken || "&lt;your_token&gt;"}
              </div>
              <button type="button" onClick={onTestMe} style={{ ...btnBase, marginTop: 10, background: D.greenBg, borderColor: "#6EE7B7", color: D.green }}>
                <Zap size={13} /> 用此 Token 立即發送測試請求 (/me)
              </button>
              {meTest && (
                <pre style={{ marginTop: 10, background: D.surfaceDark2, color: "#E6EDF3", padding: 12, borderRadius: 8, fontSize: 11, overflowX: "auto", maxHeight: 220 }}>
                  HTTP {meTest.status} · {meTest.ms}ms{"\n"}{meTest.body}
                </pre>
              )}
            </div>

            <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: D.radius, padding: 16, boxShadow: D.shadow }}>
              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 10 }}>Teacher Token Directory</div>
              <ResponsiveTableWrapper>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 640 }}>
                  <thead>
                    <tr style={{ background: D.surfaceAlt, textAlign: "left" }}>
                      {["教師姓名", "角色", "Token 前綴", "建立日期", "最後使用", "調用次數", "操作"].map((h) => (
                        <th key={h} style={{ padding: "8px 10px", color: D.text4, fontWeight: 700 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(state?.token_directory ?? []).length === 0 && (
                      <tr><td colSpan={7} style={{ padding: 16, color: D.text4 }}>尚無啟用中的 Token</td></tr>
                    )}
                    {(state?.token_directory ?? []).map((u) => (
                      <tr key={u.id} style={{ borderTop: `1px solid ${D.border}` }}>
                        <td style={{ padding: "8px 10px", fontWeight: 600 }}>{u.name}</td>
                        <td style={{ padding: "8px 10px" }}>{u.role}</td>
                        <td style={{ padding: "8px 10px", fontFamily: D.mono }}>{u.prefix}</td>
                        <td style={{ padding: "8px 10px" }}>{u.created_at || "—"}</td>
                        <td style={{ padding: "8px 10px" }}>{u.last_used_at || "—"}</td>
                        <td style={{ padding: "8px 10px" }}>{u.use_count}</td>
                        <td style={{ padding: "8px 10px" }}>
                          <button type="button" onClick={() => onRevoke(u.id)} style={{ ...btnBase, padding: "4px 8px", color: D.red }}>撤銷</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ResponsiveTableWrapper>
            </div>
          </div>
        )}

        {tab === "webhooks" && (
          <div style={{ display: isMobile ? "flex" : "grid", flexDirection: isMobile ? "column" : undefined, gridTemplateColumns: isMobile ? undefined : "320px 1fr", gap: 14 }}>
            <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: D.radius, boxShadow: D.shadow, overflow: "hidden" }}>
              <div style={{ padding: 12, borderBottom: `1px solid ${D.border}` }}>
                <div style={{ position: "relative" }}>
                  <Search size={13} style={{ position: "absolute", left: 10, top: 9, color: D.text4 }} />
                  <input
                    value={eventFilter}
                    onChange={(e) => setEventFilter(e.target.value)}
                    placeholder="搜尋事件…"
                    style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px 8px 30px", borderRadius: 8, border: `1px solid ${D.border}`, fontSize: 12, fontFamily: D.font }}
                  />
                </div>
              </div>
              <div style={{ maxHeight: isMobile ? 280 : 520, overflowY: "auto" }}>
                {events.map((code) => {
                  const meta = EVENT_META[code] || { zh: code, module: "Event", color: D.accent, bg: D.accentLight };
                  const sub = subs.find((s) => s.event_code === code);
                  const active = !!sub?.is_active;
                  const sel = selectedEvent === code;
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => setSelectedEvent(code)}
                      style={{
                        width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: 10,
                        padding: "12px 14px", border: "none", borderBottom: `1px solid ${D.border}`,
                        background: sel ? D.accentLight : D.surface, cursor: "pointer", fontFamily: D.font,
                      }}
                    >
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: active ? D.green : D.text4, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: D.text1 }}>{meta.zh}</div>
                        <div style={{ fontSize: 10, fontFamily: D.mono, color: D.text4 }}>{code}</div>
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: meta.bg, color: meta.color }}>{meta.module}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
              <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: D.radius, padding: 16, boxShadow: D.shadow }}>
                <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12 }}>Endpoint 配置</div>
                <label style={{ fontSize: 11, color: D.text4, display: "block", marginBottom: 4 }}>Target URL</label>
                <input value={formUrl} onChange={(e) => setFormUrl(e.target.value)} style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", borderRadius: 8, border: `1px solid ${D.border}`, fontSize: 12, fontFamily: D.mono, marginBottom: 10 }} />
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, color: D.text4 }}>HTTP Method</label>
                    <select value={formMethod} onChange={(e) => setFormMethod(e.target.value)} style={{ width: "100%", padding: 8, borderRadius: 8, border: `1px solid ${D.border}`, fontSize: 12 }}>
                      {["POST", "PUT", "PATCH"].map((m) => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: D.text4 }}>Timeout (sec)</label>
                    <input type="number" min={1} max={30} value={formTimeout} onChange={(e) => setFormTimeout(Number(e.target.value) || 10)} style={{ width: "100%", boxSizing: "border-box", padding: 8, borderRadius: 8, border: `1px solid ${D.border}`, fontSize: 12 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: D.text4 }}>Active</label>
                    <button type="button" onClick={() => setFormActive((v) => !v)} style={{ ...btnBase, width: "100%", justifyContent: "center", background: formActive ? D.greenBg : D.surfaceAlt, color: formActive ? D.green : D.text4 }}>
                      {formActive ? "啟用中" : "已停用"}
                    </button>
                  </div>
                </div>
                <div style={{ marginTop: 10, fontSize: 11, color: D.text4 }}>
                  Signing Secret (HMAC-SHA256): <span style={{ fontFamily: D.mono, color: D.text2 }}>{selectedSub?.signing_secret_masked || "—"}</span>
                </div>
              </div>

              <div style={{ background: D.surfaceDark, borderRadius: D.radius, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ color: "#E6EDF3", fontSize: 12, fontWeight: 700 }}>Payload 預覽</span>
                  <button type="button" onClick={() => copyText(payloadPreview)} style={{ ...btnBase, padding: "4px 8px" }}>
                    <Copy size={12} /> Copy JSON
                  </button>
                </div>
                <pre style={{ margin: 0, color: "#A5D6FF", fontFamily: D.mono, fontSize: 11, overflowX: "auto" }}>{payloadPreview}</pre>
              </div>

              <div style={{ background: D.n8nBg, border: `1px solid #FFC9C2`, borderRadius: D.radius, padding: 12, fontSize: 12, color: "#9A3412" }}>
                <strong>N8N 串接提示：</strong> 將 Target URL 設為 n8n Webhook node，並以 Header <code>X-STS-Signature</code> 驗證 HMAC。
              </div>

              <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: D.radius, padding: 14, boxShadow: D.shadow }}>
                <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>最近投遞記錄</div>
                <ResponsiveTableWrapper>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, minWidth: 520 }}>
                    <thead>
                      <tr style={{ background: D.surfaceAlt, textAlign: "left" }}>
                        {["時間", "Event", "Status", "Latency", "詳情"].map((h) => (
                          <th key={h} style={{ padding: "6px 8px", color: D.text4 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(state?.deliveries ?? []).slice(0, 12).map((d) => (
                        <tr key={d.id} style={{ borderTop: `1px solid ${D.border}` }}>
                          <td style={{ padding: "6px 8px" }}>{d.created_at}</td>
                          <td style={{ padding: "6px 8px", fontFamily: D.mono }}>{d.event_code}</td>
                          <td style={{ padding: "6px 8px" }}>
                            {d.http_status >= 200 && d.http_status < 400
                              ? <CheckCircle2 size={13} color={D.green} />
                              : <XCircle size={13} color={D.red} />} {d.http_status}
                          </td>
                          <td style={{ padding: "6px 8px" }}>{d.latency_ms}ms</td>
                          <td style={{ padding: "6px 8px" }}>
                            <button type="button" onClick={() => setDetailDelivery(d)} style={{ ...btnBase, padding: "3px 8px" }}>
                              <Eye size={12} /> 詳情
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ResponsiveTableWrapper>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", position: isMobile ? "static" : "sticky", bottom: 0, background: D.pageBg, paddingTop: 4 }}>
                <button type="button" disabled={busy} onClick={onTestWebhook} style={{ ...btnBase, background: D.accent, color: "#fff", border: "none" }}>
                  <Zap size={13} /> 發送測試 Webhook
                </button>
                <button type="button" disabled={busy} onClick={onSaveWebhook} style={{ ...btnBase, background: "#0F172A", color: "#fff", border: "none" }}>
                  💾 儲存 Webhook 設定
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === "n8n" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: D.radius, padding: 16, boxShadow: D.shadow }}>
              <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>n8n Workflow Template</div>
              <p style={{ fontSize: 12, color: D.text3, marginTop: 0 }}>預先接好 External API nodes 與 Webhook Trigger。下載後匯入 n8n，並將 Header 換成你的 Token。</p>
              <pre style={{ background: D.surfaceDark, color: "#E6EDF3", padding: 12, borderRadius: 8, fontSize: 11, overflowX: "auto", maxHeight: 280 }}>{n8nWorkflow}</pre>
              <button type="button" onClick={() => copyText(n8nWorkflow)} style={{ ...btnBase, marginTop: 8 }}>
                <Copy size={13} /> 複製 Workflow JSON
              </button>
            </div>
            <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: D.radius, padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>Quick Endpoint Tester</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  "GET /me", "GET /students", "GET /students/{id}/acorn", "GET /achievements",
                  "POST /achievements/draft", "GET /exemplars", "POST /ai/query",
                ].map((ep) => (
                  <div key={ep} style={{ fontFamily: D.mono, fontSize: 12, padding: "8px 10px", background: D.surfaceAlt, borderRadius: 6, border: `1px solid ${D.border}` }}>
                    {base}{ep.replace(/^GET |^POST /, "").replace("/me", "/me").replace(/^\//, "/").replace(/^/, "")}
                    <span style={{ float: "right", color: D.text4 }}>{ep.split(" ")[0]}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 10, fontSize: 11, color: D.text4 }}>
                完整互動測試請至 <a href={docsUrl} style={{ color: D.accent }}>接口文檔</a>，或於「存取權杖」分頁用 Token 打 /me。
              </div>
            </div>
          </div>
        )}

        {tab === "audit" && (
          <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: D.radius, padding: 16, boxShadow: D.shadow }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 800 }}>External API & Webhook Audit Trail</div>
              <a href={auditLogsUrl} style={{ ...btnBase, textDecoration: "none", fontSize: 11 }}>
                <Shield size={12} /> 脫敏與審計
              </a>
            </div>
            <ResponsiveTableWrapper>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, minWidth: 720 }}>
                <thead>
                  <tr style={{ background: D.surfaceAlt, textAlign: "left" }}>
                    {["Timestamp", "Teacher", "Action", "Details", "IP", "Status"].map((h) => (
                      <th key={h} style={{ padding: "8px 10px", color: D.text4 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(state?.audit_trail ?? []).length === 0 && (
                    <tr><td colSpan={6} style={{ padding: 16, color: D.text4 }}>尚無 External API / Webhook 審計紀錄</td></tr>
                  )}
                  {(state?.audit_trail ?? []).map((row) => (
                    <tr key={row.id} style={{ borderTop: `1px solid ${D.border}` }}>
                      <td style={{ padding: "8px 10px", whiteSpace: "nowrap" }}>{row.timestamp}</td>
                      <td style={{ padding: "8px 10px" }}>{row.teacher}</td>
                      <td style={{ padding: "8px 10px" }}>{row.action}<div style={{ color: D.text4 }}>{row.module}</div></td>
                      <td style={{ padding: "8px 10px", maxWidth: 320 }}>{row.details}</td>
                      <td style={{ padding: "8px 10px", fontFamily: D.mono }}>{row.ip}</td>
                      <td style={{ padding: "8px 10px", color: row.status === "Success" ? D.green : D.red, fontWeight: 700 }}>{row.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ResponsiveTableWrapper>
          </div>
        )}
      </div>

      {detailDelivery && (
        <div
          role="dialog"
          style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={() => setDetailDelivery(null)}
        >
          <div
            style={{ background: D.surface, borderRadius: 12, maxWidth: 640, width: "100%", maxHeight: "80vh", overflow: "auto", padding: 18, boxShadow: D.shadow }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <strong>Delivery #{detailDelivery.id}</strong>
              <button type="button" onClick={() => setDetailDelivery(null)} style={btnBase}>關閉</button>
            </div>
            <div style={{ fontSize: 12, color: D.text3, marginBottom: 8 }}>
              {detailDelivery.event_code} · HTTP {detailDelivery.http_status} · {detailDelivery.latency_ms}ms
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4 }}>Request</div>
            <pre style={{ background: D.surfaceDark, color: "#E6EDF3", padding: 10, borderRadius: 8, fontSize: 11, overflowX: "auto" }}>
              {typeof detailDelivery.request_payload === "string"
                ? detailDelivery.request_payload
                : JSON.stringify(detailDelivery.request_payload, null, 2)}
            </pre>
            <div style={{ fontSize: 11, fontWeight: 700, margin: "10px 0 4px" }}>Response</div>
            <pre style={{ background: D.surfaceAlt, padding: 10, borderRadius: 8, fontSize: 11, overflowX: "auto" }}>
              {detailDelivery.response_snippet || "—"}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default Screen_APIAutomation;
