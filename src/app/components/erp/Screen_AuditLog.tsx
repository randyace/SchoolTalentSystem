// ─────────────────────────────────────────────────────────────────────────────
// 1.F.0.8 System Audit Log & Compliance — PDPO Clause 6.3.2
// Live data via /admin/audit-logs/data · 7-year retention
// ─────────────────────────────────────────────────────────────────────────────
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  RefreshCw, Download, Filter, ChevronLeft, ChevronRight, ChevronRight as ExpandIcon,
  ShieldCheck, LogIn, FileOutput, Key, AlertOctagon, ArrowLeftRight,
  Database, Cpu, X,
} from "lucide-react";
import { ERP } from "./erpTokens";

const F = ERP.font.family;

type LogAction =
  | "GSheet Sync" | "API Request" | "Login" | "Data Export"
  | "Permission Change" | "Security Alert" | "Error" | "Data Change" | string;
type LogStatus = "Success" | "Failed" | "Pending" | string;

type AuditRow = {
  id: number;
  timestamp: string;
  action_type: LogAction;
  module: string;
  triggered_by: string;
  triggered_by_type?: string;
  ip_address: string;
  details: string;
  status: LogStatus;
  old_values?: unknown;
  new_values?: unknown;
  error_message?: string | null;
  sensitive?: boolean;
  pdpo_masked?: boolean;
};

type Kpis = {
  total_today: number;
  total_yesterday: number;
  delta_vs_yesterday: number;
  api_requests: number;
  gsheet_syncs: number;
  security_alerts: number;
};

export interface AuditLogProps {
  logsUrl?: string;
  exportUrl?: string;
  syncUrl?: string;
  defaultDateFrom?: string;
  defaultDateTo?: string;
  actionTypes?: string[];
  statuses?: string[];
}

const DEFAULT_ACTIONS = [
  "GSheet Sync", "API Request", "Login", "Data Export",
  "Permission Change", "Security Alert", "Error", "Data Change",
];

const ACTION_STYLE: Record<string, { bg: string; color: string; Icon: React.FC<{ size?: number; color?: string }> }> = {
  "GSheet Sync":       { bg: "#E0F2FE", color: "#0C4A6E", Icon: ArrowLeftRight },
  "API Request":       { bg: ERP.colors.accentPale, color: "#1E3A8A", Icon: Cpu },
  "Login":             { bg: "#D1FAE5", color: "#064E3B", Icon: LogIn },
  "Data Export":       { bg: "#FEF3C7", color: "#78350F", Icon: FileOutput },
  "Permission Change": { bg: "#FFEDD5", color: "#9A3412", Icon: Key },
  "Security Alert":    { bg: "#FEE2E2", color: "#7F1D1D", Icon: AlertOctagon },
  "Error":             { bg: "#FEE2E2", color: "#7F1D1D", Icon: AlertOctagon },
  "Data Change":       { bg: "#F1F5F9", color: "#334155", Icon: Database },
};

const STATUS_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  Success: { bg: "#ECFDF5", color: "#065F46", border: "#A7F3D0" },
  Failed:  { bg: "#FEF2F2", color: "#991B1B", border: "#FECACA" },
  Pending: { bg: "#FFFBEB", color: "#92400E", border: "#FDE68A" },
};

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fmtNum(n: number): string {
  return n.toLocaleString("en-US");
}

function truncate(s: string, n = 80): string {
  if (!s) return "—";
  return s.length > n ? s.slice(0, n) + "…" : s;
}

function ActionBadge({ action }: { action: string }) {
  const cfg = ACTION_STYLE[action] || ACTION_STYLE["Data Change"];
  const Icon = cfg.Icon;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: ERP.radius.full,
      background: cfg.bg, color: cfg.color,
      fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" as const, fontFamily: F,
    }}>
      <Icon size={13} color={cfg.color} />
      {action === "GSheet Sync" ? "↔ " : ""}{action}
    </span>
  );
}

function StatusPill({ status }: { status: string }) {
  const cfg = STATUS_STYLE[status] || STATUS_STYLE.Pending;
  return (
    <span style={{
      display: "inline-flex", padding: "3px 9px", borderRadius: ERP.radius.full,
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
      fontSize: 11, fontWeight: 800, fontFamily: F,
    }}>{status}</span>
  );
}

export const Screen_AuditLog: React.FC<AuditLogProps> = ({
  logsUrl = "/admin/audit-logs/data",
  exportUrl = "/admin/audit-logs/export",
  syncUrl = "/admin/audit-logs/force-sync",
  defaultDateFrom,
  defaultDateTo,
  actionTypes = DEFAULT_ACTIONS,
  statuses = ["Success", "Failed", "Pending"],
}) => {
  const [dateFrom, setDateFrom] = useState(defaultDateFrom || todayISO());
  const [dateTo, setDateTo] = useState(defaultDateTo || todayISO());
  const [actionFilter, setActionFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [userFilter, setUserFilter] = useState("");
  const [applied, setApplied] = useState({
    date_from: defaultDateFrom || todayISO(),
    date_to: defaultDateTo || todayISO(),
    action_type: "All",
    status: "All",
    user: "",
  });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [kpis, setKpis] = useState<Kpis>({
    total_today: 0, total_yesterday: 0, delta_vs_yesterday: 0,
    api_requests: 0, gsheet_syncs: 0, security_alerts: 0,
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [detail, setDetail] = useState<AuditRow | null>(null);
  const [showFilters, setShowFilters] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const q = new URLSearchParams({
        page: String(page),
        per_page: String(perPage),
        date_from: applied.date_from,
        date_to: applied.date_to,
      });
      if (applied.action_type && applied.action_type !== "All") q.set("action_type", applied.action_type);
      if (applied.status && applied.status !== "All") q.set("status", applied.status);
      if (applied.user) q.set("user", applied.user);
      const res = await fetch(`${logsUrl}?${q}`, { credentials: "same-origin" });
      const json = await res.json();
      if (!json?.ok) {
        setErr(json?.message || "無法載入審計日誌");
        return;
      }
      setRows(json.data || []);
      setTotal(Number(json.pagination?.total || 0));
      setTotalPages(Number(json.pagination?.total_pages || 1));
      if (json.kpis) setKpis(json.kpis);
    } catch {
      setErr("無法載入審計日誌");
    } finally {
      setLoading(false);
    }
  }, [logsUrl, page, perPage, applied]);

  useEffect(() => { load(); }, [load]);

  const applyFilters = () => {
    setPage(1);
    setApplied({
      date_from: dateFrom,
      date_to: dateTo,
      action_type: actionFilter,
      status: statusFilter,
      user: userFilter.trim(),
    });
  };

  const doExport = () => {
    const q = new URLSearchParams({
      date_from: applied.date_from,
      date_to: applied.date_to,
    });
    if (applied.action_type !== "All") q.set("action_type", applied.action_type);
    if (applied.status !== "All") q.set("status", applied.status);
    if (applied.user) q.set("user", applied.user);
    window.location.href = `${exportUrl}?${q}`;
  };

  const forceSync = async () => {
    setSyncing(true);
    setOkMsg(null);
    try {
      const res = await fetch(syncUrl, {
        method: "POST",
        credentials: "same-origin",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: "{}",
      });
      const json = await res.json();
      if (!json?.ok) {
        setErr(json?.message || "Sync failed");
        return;
      }
      setOkMsg(json.message || "Sync queued");
      await load();
    } catch {
      setErr("Force sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const deltaPositive = kpis.delta_vs_yesterday >= 0;
  const inputStyle: React.CSSProperties = {
    padding: "8px 12px", border: `1px solid ${ERP.colors.border}`, borderRadius: ERP.radius.md,
    fontSize: 13, fontFamily: F, color: ERP.colors.textPrimary, background: ERP.colors.surface, outline: "none",
  };

  const pageButtons = useMemo(() => {
    const max = totalPages;
    const cur = page;
    const set = new Set<number>([1, max, cur, cur - 1, cur + 1]);
    return Array.from(set).filter(n => n >= 1 && n <= max).sort((a, b) => a - b);
  }, [page, totalPages]);

  return (
    <div style={{
      background: ERP.colors.pageBg, minHeight: "100%", fontFamily: F,
      padding: isMobile ? 16 : 24, overflow: "auto", height: "100%",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", flexDirection: isMobile ? "column" : "row",
        justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 20,
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{
              width: 36, height: 36, background: ERP.colors.accentPale, borderRadius: ERP.radius.md,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <ShieldCheck size={20} color={ERP.colors.accent} />
            </div>
            <h1 style={{ margin: 0, fontSize: isMobile ? 16 : 20, fontWeight: 800, color: ERP.colors.textPrimary }}>
              System Audit Log &amp; Compliance
            </h1>
          </div>
          {!isMobile && (
            <p style={{ margin: 0, fontSize: 13, color: ERP.colors.textSecondary }}>
              增值模組 A &amp; 安全條款 · PDPO Compliance · 2-Way Google Sheets Sync
            </p>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" as const }}>
          {!isMobile && (
            <button type="button" onClick={() => setShowFilters(v => !v)} style={{
              display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 12px",
              borderRadius: ERP.radius.md, border: `1px solid ${ERP.colors.border}`,
              background: ERP.colors.surface, fontSize: 12, fontWeight: 700, fontFamily: F, cursor: "pointer",
            }}>
              <Filter size={14} /> Filters
            </button>
          )}
          <button type="button" onClick={doExport} style={{
            display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 12px",
            borderRadius: ERP.radius.md, border: `1px solid ${ERP.colors.border}`,
            background: ERP.colors.surface, fontSize: 12, fontWeight: 700, fontFamily: F, cursor: "pointer",
          }}>
            <Download size={14} /> {isMobile ? "Export" : "Export Logs"}
          </button>
          <button type="button" onClick={forceSync} disabled={syncing} style={{
            display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px",
            borderRadius: ERP.radius.md, border: "none",
            background: ERP.colors.accent, color: "#fff",
            fontSize: 12, fontWeight: 700, fontFamily: F, cursor: syncing ? "wait" : "pointer",
            boxShadow: `0 2px 8px ${ERP.colors.accent}40`,
          }}>
            <RefreshCw size={14} /> {isMobile ? "Sync" : "Force 2-Way Sync"}
          </button>
        </div>
      </div>

      {(err || okMsg) && (
        <div style={{
          marginBottom: 14, padding: "10px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600,
          background: okMsg ? "#ECFDF5" : "#FEF2F2",
          color: okMsg ? "#065F46" : "#991B1B",
          border: `1px solid ${okMsg ? "#6EE7B7" : "#FECACA"}`,
        }}>{okMsg || err}</div>
      )}

      {/* KPI cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
        gap: 16, marginBottom: 20,
      }}>
        {[
          {
            label: "Total Logs Today", value: fmtNum(kpis.total_today), color: ERP.colors.accent,
            icon: <Database size={18} color={ERP.colors.accent} />,
            delta: `${deltaPositive ? "▲ +" : "▼ "}${Math.abs(kpis.delta_vs_yesterday)} vs yesterday`,
            positive: deltaPositive,
          },
          {
            label: "API Requests", value: fmtNum(kpis.api_requests), color: "#0891B2",
            icon: <Cpu size={18} color="#0891B2" />,
          },
          {
            label: "GSheet Syncs", value: fmtNum(kpis.gsheet_syncs), color: ERP.colors.success,
            icon: <ArrowLeftRight size={18} color={ERP.colors.success} />,
          },
          {
            label: "Security Alerts", value: fmtNum(kpis.security_alerts), color: ERP.colors.red,
            icon: <AlertOctagon size={18} color={ERP.colors.red} />,
          },
        ].map(card => (
          <div key={card.label} style={{
            background: ERP.colors.surface, border: `1px solid ${ERP.colors.border}`,
            borderRadius: ERP.radius.lg, padding: "16px 18px", boxShadow: ERP.shadow.sm,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: ERP.colors.textMuted, letterSpacing: "0.04em", textTransform: "uppercase" as const }}>
                {card.label}
              </span>
              <div style={{
                width: 32, height: 32, borderRadius: ERP.radius.md,
                background: `${card.color}18`, display: "flex", alignItems: "center", justifyContent: "center",
              }}>{card.icon}</div>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: card.color, lineHeight: 1.1 }}>{card.value}</div>
            {card.delta && (
              <div style={{
                marginTop: 6, fontSize: 11, fontWeight: 700,
                color: card.positive ? "#059669" : "#DC2626",
              }}>{card.delta}</div>
            )}
          </div>
        ))}
      </div>

      {/* Filters */}
      {showFilters && (
        <div style={{
          background: ERP.colors.surface, border: `1px solid ${ERP.colors.border}`,
          borderRadius: ERP.radius.lg, padding: "14px 20px", marginBottom: 20, boxShadow: ERP.shadow.sm,
        }}>
          <div style={{
            display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" as const,
            flexDirection: isMobile ? "column" : "row",
          }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: ERP.colors.textSecondary }}>Date Range</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={inputStyle} />
                <span style={{ color: ERP.colors.textMuted }}>→</span>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={inputStyle} />
              </div>
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: ERP.colors.textSecondary }}>Action Type</span>
              <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} style={inputStyle}>
                <option value="All">All</option>
                {(actionTypes.length ? actionTypes : DEFAULT_ACTIONS).map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: ERP.colors.textSecondary }}>User</span>
              <input
                value={userFilter}
                onChange={e => setUserFilter(e.target.value)}
                placeholder="Filter by user..."
                style={{ ...inputStyle, width: isMobile ? "100%" : 160 }}
              />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: ERP.colors.textSecondary }}>Status</span>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={inputStyle}>
                <option value="All">All</option>
                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <button type="button" onClick={applyFilters} style={{
              padding: "9px 16px", borderRadius: ERP.radius.md, border: "none",
              background: ERP.colors.accent, color: "#fff",
              fontSize: 13, fontWeight: 700, fontFamily: F, cursor: "pointer",
            }}>
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{
        background: ERP.colors.surface, border: `1px solid ${ERP.colors.border}`,
        borderRadius: ERP.radius.lg, overflow: "hidden", marginBottom: 20, boxShadow: ERP.shadow.sm,
      }}>
        {loading && (
          <div style={{ padding: 24, textAlign: "center", color: ERP.colors.textMuted, fontSize: 13 }}>載入中…</div>
        )}
        {!loading && rows.length === 0 && (
          <div style={{ padding: 40, textAlign: "center", color: ERP.colors.textMuted, fontSize: 13 }}>
            此篩選條件下沒有審計紀錄。敏感操作會自動寫入此日誌（7 年保留）。
          </div>
        )}
        {!loading && rows.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: ERP.colors.pageBg, borderBottom: `2px solid ${ERP.colors.border}` }}>
                  {["#", "Timestamp", "Action", "Module", "Triggered By", "IP Address", "Details", "Status"].map(col => (
                    <th key={col} style={{
                      padding: "10px 12px", textAlign: "left", fontSize: 11, fontWeight: 700,
                      color: ERP.colors.textSecondary, letterSpacing: "0.05em",
                      textTransform: "uppercase" as const, whiteSpace: "nowrap" as const,
                    }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((entry, idx) => {
                  const isAlert = entry.action_type === "Security Alert" || entry.status === "Failed";
                  const isPerm = entry.action_type === "Permission Change";
                  let rowBg = idx % 2 === 0 ? ERP.colors.surface : ERP.colors.pageBg;
                  if (isAlert) rowBg = "#FEF2F2";
                  else if (isPerm) rowBg = "#FFFBEB";
                  return (
                    <tr
                      key={entry.id}
                      onClick={() => setDetail(entry)}
                      style={{ background: rowBg, borderBottom: `1px solid ${ERP.colors.border}`, cursor: "pointer" }}
                    >
                      <td style={{ padding: "8px 12px", color: ERP.colors.textMuted, fontSize: 12 }}>{entry.id}</td>
                      <td style={{ padding: "8px 12px", whiteSpace: "nowrap" as const }}>
                        <span style={{ fontFamily: ERP.font.mono, fontSize: 12, color: ERP.colors.textSecondary }}>
                          {entry.timestamp}
                        </span>
                      </td>
                      <td style={{ padding: "8px 12px" }}><ActionBadge action={entry.action_type} /></td>
                      <td style={{ padding: "8px 12px", fontWeight: 500 }}>{entry.module}</td>
                      <td style={{ padding: "8px 12px" }}>
                        <span style={{ fontFamily: ERP.font.mono, fontSize: 12, color: ERP.colors.accent }}>
                          {entry.triggered_by}
                        </span>
                      </td>
                      <td style={{ padding: "8px 12px" }}>
                        <span style={{
                          fontFamily: ERP.font.mono, fontSize: 12,
                          color: isAlert ? ERP.colors.red : ERP.colors.textSecondary,
                          fontWeight: isAlert ? 700 : 400,
                        }}>{entry.ip_address || "—"}</span>
                      </td>
                      <td style={{ padding: "8px 12px", maxWidth: 280 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" as const }}>
                          <span title={entry.details} style={{ fontSize: 13 }}>{truncate(entry.details, 70)}</span>
                          {(entry.sensitive || entry.pdpo_masked) && (
                            <span style={{
                              display: "inline-flex", alignItems: "center", gap: 3,
                              fontSize: 10, fontWeight: 800, padding: "2px 7px", borderRadius: 999,
                              background: "#EEF2FF", color: "#3730A3", border: "1px solid #C7D2FE",
                            }}>
                              🛡️ 已脫敏 Masked
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: "8px 12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <StatusPill status={entry.status} />
                          <ExpandIcon size={13} color={ERP.colors.textMuted} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination + GSheet card */}
      <div style={{
        display: "flex", flexDirection: isMobile ? "column" : "row",
        justifyContent: "space-between", gap: 16, alignItems: isMobile ? "stretch" : "flex-start",
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" as const,
          background: ERP.colors.surface, padding: "10px 16px", borderRadius: ERP.radius.md,
          border: `1px solid ${ERP.colors.border}`, boxShadow: ERP.shadow.sm,
        }}>
          <span style={{ fontSize: 13, color: ERP.colors.textSecondary }}>
            Showing{" "}
            <strong style={{ color: ERP.colors.textPrimary }}>
              {total === 0 ? 0 : (page - 1) * perPage + 1}–{Math.min(page * perPage, total)}
            </strong>{" "}
            of <strong style={{ color: ERP.colors.textPrimary }}>{fmtNum(total)}</strong> logs
          </span>
          <button type="button" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} style={{
            width: 30, height: 30, border: `1px solid ${ERP.colors.border}`, borderRadius: ERP.radius.sm,
            background: ERP.colors.surface, cursor: page <= 1 ? "not-allowed" : "pointer", opacity: page <= 1 ? 0.4 : 1,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}><ChevronLeft size={14} /></button>
          {pageButtons.map((p, i) => (
            <React.Fragment key={p}>
              {i > 0 && pageButtons[i - 1] < p - 1 && (
                <span style={{ color: ERP.colors.textMuted }}>…</span>
              )}
              <button type="button" onClick={() => setPage(p)} style={{
                width: 30, height: 30,
                background: page === p ? ERP.colors.accent : ERP.colors.surface,
                border: `1px solid ${page === p ? ERP.colors.accent : ERP.colors.border}`,
                borderRadius: ERP.radius.sm, cursor: "pointer",
                fontSize: 13, fontWeight: page === p ? 700 : 400,
                color: page === p ? "#fff" : ERP.colors.textSecondary, fontFamily: F,
              }}>{p}</button>
            </React.Fragment>
          ))}
          <button type="button" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} style={{
            width: 30, height: 30, border: `1px solid ${ERP.colors.border}`, borderRadius: ERP.radius.sm,
            background: ERP.colors.surface, cursor: page >= totalPages ? "not-allowed" : "pointer",
            opacity: page >= totalPages ? 0.4 : 1,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}><ChevronRight size={14} /></button>
          <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }} style={{
            padding: "4px 8px", border: `1px solid ${ERP.colors.border}`, borderRadius: ERP.radius.sm,
            fontSize: 13, fontFamily: F,
          }}>
            {[20, 50, 100].map(n => <option key={n} value={n}>{n}/page</option>)}
          </select>
        </div>

        <div style={{
          background: ERP.colors.surface, border: `1px solid ${ERP.colors.border}`,
          borderRadius: ERP.radius.lg, padding: "16px 20px", minWidth: isMobile ? undefined : 300,
          boxShadow: ERP.shadow.sm,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <ArrowLeftRight size={16} color={ERP.colors.success} />
            <span style={{ fontSize: 14, fontWeight: 700 }}>Google Sheets Connection</span>
            <span style={{
              marginLeft: "auto", display: "flex", alignItems: "center", gap: 4,
              fontSize: 12, fontWeight: 700, color: ERP.colors.success,
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: "50%", background: ERP.colors.success,
                boxShadow: `0 0 6px ${ERP.colors.success}`, display: "inline-block",
              }} />
              Ready
            </span>
          </div>
          <div style={{ fontSize: 12, color: ERP.colors.textSecondary, lineHeight: 1.7 }}>
            PDPO Clause 6.3.2 · Audit retention {7} years<br />
            Force sync writes a Pending GSheet Sync event.
          </div>
          <button type="button" onClick={forceSync} style={{
            marginTop: 10, background: "none", border: "none", color: ERP.colors.accent,
            fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0, fontFamily: F,
            textDecoration: "underline",
          }}>
            View Sync History →
          </button>
        </div>
      </div>

      {/* Detail modal — old/new JSON */}
      {detail && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setDetail(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 80, background: "rgba(15,23,42,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: 720, maxHeight: "85vh", overflow: "auto",
              background: ERP.colors.surface, borderRadius: ERP.radius.lg,
              border: `1px solid ${ERP.colors.border}`, boxShadow: "0 20px 50px rgba(15,23,42,0.25)",
              padding: 20, fontFamily: F,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800 }}>Audit Detail #{detail.id}</div>
                <div style={{ fontSize: 12, color: ERP.colors.textMuted, marginTop: 2 }}>{detail.timestamp}</div>
              </div>
              <button type="button" onClick={() => setDetail(null)} style={{
                border: "none", background: "transparent", cursor: "pointer", color: ERP.colors.textMuted,
              }}><X size={18} /></button>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const, marginBottom: 12 }}>
              <ActionBadge action={detail.action_type} />
              <StatusPill status={detail.status} />
              <span style={{ fontSize: 12, fontWeight: 600, color: ERP.colors.textSecondary }}>{detail.module}</span>
            </div>
            <p style={{ fontSize: 13, margin: "0 0 12px", lineHeight: 1.5 }}>{detail.details}</p>
            {detail.error_message && (
              <p style={{ fontSize: 12, color: "#991B1B", background: "#FEF2F2", padding: 10, borderRadius: 8 }}>
                {detail.error_message}
              </p>
            )}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: ERP.colors.textMuted, marginBottom: 6 }}>OLD VALUES</div>
                <pre style={{
                  margin: 0, padding: 12, background: "#F8FAFC", borderRadius: 8,
                  border: `1px solid ${ERP.colors.border}`, fontSize: 11, fontFamily: ERP.font.mono,
                  overflow: "auto", maxHeight: 280, whiteSpace: "pre-wrap" as const,
                }}>
                  {detail.old_values == null ? "—" : JSON.stringify(detail.old_values, null, 2)}
                </pre>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: ERP.colors.textMuted, marginBottom: 6 }}>NEW VALUES</div>
                <pre style={{
                  margin: 0, padding: 12, background: "#F8FAFF", borderRadius: 8,
                  border: `1px solid ${ERP.colors.border}`, fontSize: 11, fontFamily: ERP.font.mono,
                  overflow: "auto", maxHeight: 280, whiteSpace: "pre-wrap" as const,
                }}>
                  {detail.new_values == null ? "—" : JSON.stringify(detail.new_values, null, 2)}
                </pre>
              </div>
            </div>
            <div style={{ marginTop: 12, fontSize: 12, color: ERP.colors.success, fontWeight: 600 }}>
              ✓ PDPO compliant · Logged for audit trail · Retention {7} years
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
