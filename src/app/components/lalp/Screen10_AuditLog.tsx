import React, { useState } from "react";
import {
  RefreshCw, Download, Filter, ChevronLeft, ChevronRight,
  ShieldCheck, LogIn, FileOutput, Key, AlertOctagon, ArrowLeftRight,
  Database, Cpu, ChevronRight as ExpandIcon,
} from "lucide-react";
import {
  DS, Card, Btn, SectionHeader, StatCard, StatusBadge, DateRangePicker, DataPrivacyShield,
} from "./DesignSystem";

/* ─── Types ──────────────────────────────────────────────────────────────── */
type LogAction = "GSheet Sync" | "API Request" | "Login" | "Data Export" | "Permission Change" | "Security Alert" | "Error";
type LogStatus = "synced" | "error" | "pending";

interface LogEntry {
  id: number;
  timestamp: string;
  action: LogAction;
  module: string;
  triggeredBy: string;
  ip: string;
  details: string;
  status: LogStatus;
  sensitive?: boolean;
  highlight?: "amber" | "red";
  direction?: "→" | "↔";
}

/* ─── Mock Log Data ──────────────────────────────────────────────────────── */
const LOG_DATA: LogEntry[] = [
  { id: 1, timestamp: "2026-07-31 09:47:23", action: "GSheet Sync", module: "Portfolio", triggeredBy: "scheduler", ip: "10.0.1.5", details: "Sync 47 rows ↔ Google Sheets", status: "synced", direction: "↔" },
  { id: 2, timestamp: "2026-07-31 09:45:11", action: "API Request", module: "Prompt Tuning", triggeredBy: "system", ip: "10.0.1.5", details: "POST /api/ollama · Qwen2.5:72b · 1,024 tokens", status: "synced" },
  { id: 3, timestamp: "2026-07-31 09:43:58", action: "Login", module: "Auth", triggeredBy: "admin@school.edu.hk", ip: "203.96.1.22", details: "Admin login · 2FA verified", status: "synced" },
  { id: 4, timestamp: "2026-07-31 09:40:02", action: "Data Export", module: "Student Data", triggeredBy: "teacher_chan", ip: "192.168.1.14", details: "Exported 82 student records (masked)", status: "synced", sensitive: true },
  { id: 5, timestamp: "2026-07-31 09:38:47", action: "Permission Change", module: "RBAC", triggeredBy: "admin@school.edu.hk", ip: "203.96.1.22", details: "Role elevated: teacher_lam → Department Head", status: "synced", highlight: "amber" },
  { id: 6, timestamp: "2026-07-31 09:36:21", action: "API Request", module: "Hint Gen", triggeredBy: "n8n-node-001", ip: "10.0.1.5", details: "Webhook triggered → Qwen2.5:72b · 856 tokens", status: "synced" },
  { id: 7, timestamp: "2026-07-31 09:34:09", action: "GSheet Sync", module: "Attendance", triggeredBy: "scheduler", ip: "10.0.1.5", details: "Push 120 attendance records → GSheet", status: "synced", direction: "→" },
  { id: 8, timestamp: "2026-07-31 09:31:55", action: "Security Alert", module: "Auth", triggeredBy: "system", ip: "58.177.2.9", details: "⚠️ 5 failed login attempts from unknown IP", status: "error", highlight: "red" },
  { id: 9, timestamp: "2026-07-31 09:30:33", action: "Login", module: "Auth", triggeredBy: "teacher_lam", ip: "192.168.1.31", details: "Teacher login · Session started", status: "synced" },
  { id: 10, timestamp: "2026-07-31 09:28:14", action: "API Request", module: "Portfolio", triggeredBy: "n8n-node-002", ip: "10.0.1.5", details: "Portfolio generation request · Llama3.1-8B", status: "synced" },
  { id: 11, timestamp: "2026-07-31 09:25:47", action: "GSheet Sync", module: "Event Config", triggeredBy: "scheduler", ip: "10.0.1.5", details: "Sync event registrations ↔ Google Sheets", status: "pending", direction: "↔" },
  { id: 12, timestamp: "2026-07-31 09:23:02", action: "Data Export", module: "Reports", triggeredBy: "admin@school.edu.hk", ip: "203.96.1.22", details: "PDF batch export · 23 portfolios", status: "synced", sensitive: true },
  { id: 13, timestamp: "2026-07-31 09:20:44", action: "Error", module: "Ollama", triggeredBy: "system", ip: "10.0.1.5", details: "Ollama timeout · Fallback to Llama3.1-8B", status: "error" },
  { id: 14, timestamp: "2026-07-31 09:18:31", action: "API Request", module: "RAG", triggeredBy: "n8n-node-001", ip: "10.0.1.5", details: "Vector search · 12 chunks retrieved", status: "synced" },
  { id: 15, timestamp: "2026-07-31 09:15:09", action: "Login", module: "Auth", triggeredBy: "student_1a_chan", ip: "192.168.1.88", details: "Student login · Portal access", status: "synced" },
  { id: 16, timestamp: "2026-07-31 09:12:58", action: "GSheet Sync", module: "Role Anchoring", triggeredBy: "scheduler", ip: "10.0.1.5", details: "Pull role assignments ↔ Google Sheets", status: "synced", direction: "↔" },
  { id: 17, timestamp: "2026-07-31 09:10:33", action: "Permission Change", module: "RBAC", triggeredBy: "admin@school.edu.hk", ip: "203.96.1.22", details: "New permission granted: teacher_ng → Event Manager", status: "synced", highlight: "amber" },
  { id: 18, timestamp: "2026-07-31 09:07:21", action: "API Request", module: "Prompt Tuning", triggeredBy: "system", ip: "10.0.1.5", details: "Webhook deploy · n8n-node-003 updated", status: "synced" },
  { id: 19, timestamp: "2026-07-31 09:04:47", action: "Data Export", module: "Audit", triggeredBy: "admin@school.edu.hk", ip: "203.96.1.22", details: "Compliance log export (PDPO-compliant, masked)", status: "synced", sensitive: true },
  { id: 20, timestamp: "2026-07-31 09:01:12", action: "Login", module: "Auth", triggeredBy: "admin@school.edu.hk", ip: "203.96.1.22", details: "System boot · Admin session initialized", status: "synced" },
];

/* ─── Action Icon ─────────────────────────────────────────────────────────── */
const ActionIcon: React.FC<{ action: LogAction }> = ({ action }) => {
  const iconProps = { size: 14 };
  switch (action) {
    case "GSheet Sync":      return <ArrowLeftRight {...iconProps} color="#0891B2" />;
    case "API Request":      return <Cpu {...iconProps} color={DS.colors.primary} />;
    case "Login":            return <LogIn {...iconProps} color={DS.colors.secondary} />;
    case "Data Export":      return <FileOutput {...iconProps} color={DS.colors.warning} />;
    case "Permission Change": return <Key {...iconProps} color="#F59E0B" />;
    case "Security Alert":   return <AlertOctagon {...iconProps} color={DS.colors.error} />;
    case "Error":            return <AlertOctagon {...iconProps} color={DS.colors.error} />;
    default:                 return <Database {...iconProps} color={DS.colors.textMuted} />;
  }
};

const ACTION_COLORS: Record<LogAction, string> = {
  "GSheet Sync":      "#E0F2FE",
  "API Request":      DS.colors.primaryLight,
  "Login":            DS.colors.secondaryLight,
  "Data Export":      DS.colors.warningLight,
  "Permission Change": "#FEF3C7",
  "Security Alert":   DS.colors.errorLight,
  "Error":            DS.colors.errorLight,
};

const ACTION_TEXT_COLORS: Record<LogAction, string> = {
  "GSheet Sync":      "#0C4A6E",
  "API Request":      "#1E3A8A",
  "Login":            "#064E3B",
  "Data Export":      "#78350F",
  "Permission Change": "#78350F",
  "Security Alert":   "#7F1D1D",
  "Error":            "#7F1D1D",
};

/* ─── Screen10_AuditLog ──────────────────────────────────────────────────── */
export const Screen10_AuditLog: React.FC = () => {
  const [dateStart, setDateStart] = useState("2026-07-31");
  const [dateEnd, setDateEnd] = useState("2026-07-31");
  const [actionFilter, setActionFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [userFilter, setUserFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const totalLogs = 2847;
  const totalPages = Math.ceil(totalLogs / pageSize);

  return (
    <div style={{ background: DS.colors.background, minHeight: "100vh", fontFamily: DS.font.family, padding: "24px" }}>
      {/* Top Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                background: DS.colors.primaryLight,
                borderRadius: DS.radius.md,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ShieldCheck size={20} color={DS.colors.primary} />
            </div>
            <h1 style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: DS.colors.textPrimary }}>
              System Audit Log &amp; Compliance
            </h1>
          </div>
          <p style={{ margin: 0, fontSize: "13px", color: DS.colors.textSecondary }}>
            增值模組 A &amp; 安全條款 · PDPO Compliance · 2-Way Google Sheets Sync
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <Btn variant="ghost" size="sm" icon={<Filter size={14} />} style={{ border: `1px solid ${DS.colors.border}` }}>
            Filters
          </Btn>
          <Btn variant="secondary" size="sm" icon={<Download size={14} />}>
            Export Logs
          </Btn>
          <Btn variant="primary" size="sm" icon={<RefreshCw size={14} />}>
            Force 2-Way Sync
          </Btn>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "20px" }}>
        <StatCard
          label="Total Logs Today"
          value="2,847"
          delta="+324 vs yesterday"
          positive
          icon={<Database size={18} color={DS.colors.primary} />}
          color={DS.colors.primary}
        />
        <StatCard
          label="API Requests"
          value="1,203"
          icon={<Cpu size={18} color="#0891B2" />}
          color="#0891B2"
        />
        <StatCard
          label="GSheet Syncs"
          value="47"
          delta="+3 this hour"
          positive
          icon={<ArrowLeftRight size={18} color={DS.colors.secondary} />}
          color={DS.colors.secondary}
        />
        <StatCard
          label="Security Alerts"
          value="2"
          icon={<AlertOctagon size={18} color={DS.colors.error} />}
          color={DS.colors.error}
        />
      </div>

      {/* Filter Bar */}
      <Card style={{ padding: "14px 20px", marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "flex-end", flexWrap: "wrap" }}>
          <div>
            <DateRangePicker
              label="Date Range"
              startDate={dateStart}
              endDate={dateEnd}
              onChange={(s, e) => { setDateStart(s); setDateEnd(e); }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "12px", fontWeight: 600, color: DS.colors.textSecondary }}>Action Type</label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              style={{
                padding: "8px 12px",
                border: `1px solid ${DS.colors.border}`,
                borderRadius: DS.radius.md,
                fontSize: "13px",
                fontFamily: DS.font.family,
                color: DS.colors.textPrimary,
                background: DS.colors.surface,
                outline: "none",
                cursor: "pointer",
              }}
            >
              {["All", "GSheet Sync", "API Request", "Login", "Data Export", "Permission Change", "Error"].map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "12px", fontWeight: 600, color: DS.colors.textSecondary }}>User</label>
            <input
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              placeholder="Filter by user..."
              style={{
                padding: "8px 12px",
                border: `1px solid ${DS.colors.border}`,
                borderRadius: DS.radius.md,
                fontSize: "13px",
                fontFamily: DS.font.family,
                color: DS.colors.textPrimary,
                outline: "none",
                width: "160px",
              }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "12px", fontWeight: 600, color: DS.colors.textSecondary }}>Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: "8px 12px",
                border: `1px solid ${DS.colors.border}`,
                borderRadius: DS.radius.md,
                fontSize: "13px",
                fontFamily: DS.font.family,
                color: DS.colors.textPrimary,
                background: DS.colors.surface,
                outline: "none",
                cursor: "pointer",
              }}
            >
              {["All", "Success", "Failed", "Pending"].map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <Btn variant="primary" size="sm" style={{ alignSelf: "flex-end" }}>
            Apply Filters
          </Btn>
        </div>
      </Card>

      {/* Main Log Table */}
      <Card style={{ overflow: "hidden", marginBottom: "20px" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: DS.font.family, fontSize: "13px" }}>
            <thead>
              <tr style={{ background: DS.colors.background, borderBottom: `2px solid ${DS.colors.border}` }}>
                {["#", "Timestamp", "Action", "Module", "Triggered By", "IP Address", "Details", "Status"].map((col) => (
                  <th
                    key={col}
                    style={{
                      padding: "10px 12px",
                      textAlign: "left",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: DS.colors.textSecondary,
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {LOG_DATA.map((entry, idx) => {
                const isEven = idx % 2 === 0;
                const isExpanded = expandedRow === entry.id;
                let rowBg = isEven ? DS.colors.surface : DS.colors.background;
                if (entry.highlight === "red") rowBg = "#FEF2F2";
                else if (entry.highlight === "amber") rowBg = "#FFFBEB";

                return (
                  <React.Fragment key={entry.id}>
                    <tr
                      onClick={() => setExpandedRow(isExpanded ? null : entry.id)}
                      style={{
                        background: rowBg,
                        borderBottom: `1px solid ${DS.colors.border}`,
                        cursor: "pointer",
                        transition: "background 0.1s",
                      }}
                    >
                      {/* # */}
                      <td style={{ padding: "8px 12px", color: DS.colors.textMuted, fontSize: "12px", fontWeight: 500 }}>
                        {entry.id}
                      </td>

                      {/* Timestamp */}
                      <td style={{ padding: "8px 12px", whiteSpace: "nowrap" }}>
                        <span
                          style={{
                            fontFamily: "'Courier New', monospace",
                            fontSize: "12px",
                            color: DS.colors.textSecondary,
                          }}
                        >
                          {entry.timestamp}
                        </span>
                      </td>

                      {/* Action */}
                      <td style={{ padding: "8px 12px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "3px 10px",
                            background: ACTION_COLORS[entry.action],
                            color: ACTION_TEXT_COLORS[entry.action],
                            borderRadius: DS.radius.full,
                            fontSize: "12px",
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                          }}
                        >
                          <ActionIcon action={entry.action} />
                          {entry.direction && <span style={{ fontWeight: 800 }}>{entry.direction}</span>}
                          {entry.action}
                        </span>
                      </td>

                      {/* Module */}
                      <td style={{ padding: "8px 12px" }}>
                        <span style={{ fontSize: "13px", color: DS.colors.textPrimary, fontWeight: 500 }}>
                          {entry.module}
                        </span>
                      </td>

                      {/* Triggered By */}
                      <td style={{ padding: "8px 12px" }}>
                        <span
                          style={{
                            fontFamily: "'Courier New', monospace",
                            fontSize: "12px",
                            color: DS.colors.primary,
                          }}
                        >
                          {entry.triggeredBy}
                        </span>
                      </td>

                      {/* IP Address */}
                      <td style={{ padding: "8px 12px" }}>
                        <span
                          style={{
                            fontFamily: "'Courier New', monospace",
                            fontSize: "12px",
                            color: entry.highlight === "red" ? DS.colors.error : DS.colors.textSecondary,
                            fontWeight: entry.highlight === "red" ? 700 : 400,
                          }}
                        >
                          {entry.ip}
                        </span>
                      </td>

                      {/* Details */}
                      <td style={{ padding: "8px 12px", maxWidth: "280px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                          <span
                            style={{
                              fontSize: "13px",
                              color: DS.colors.textPrimary,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: "220px",
                            }}
                            title={entry.details}
                          >
                            {entry.details}
                          </span>
                          {entry.sensitive && <DataPrivacyShield />}
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: "8px 12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <StatusBadge
                            variant={entry.status}
                            label={entry.status === "synced" ? "Success" : entry.status === "error" ? "Failed" : "Pending"}
                            size="sm"
                          />
                          <ExpandIcon
                            size={13}
                            color={DS.colors.textMuted}
                            style={{
                              transform: isExpanded ? "rotate(90deg)" : "none",
                              transition: "transform 0.15s",
                            }}
                          />
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Row Detail */}
                    {isExpanded && (
                      <tr style={{ background: "#F8FAFF" }}>
                        <td colSpan={8} style={{ padding: "12px 24px", borderBottom: `1px solid ${DS.colors.border}` }}>
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "repeat(3, 1fr)",
                              gap: "16px",
                              fontSize: "12px",
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 700, color: DS.colors.textSecondary, marginBottom: "4px" }}>Full Details</div>
                              <div style={{ color: DS.colors.textPrimary }}>{entry.details}</div>
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: DS.colors.textSecondary, marginBottom: "4px" }}>Request ID</div>
                              <div style={{ fontFamily: "'Courier New', monospace", color: DS.colors.primary }}>
                                req_{entry.id.toString().padStart(8, "0")}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: DS.colors.textSecondary, marginBottom: "4px" }}>Compliance Status</div>
                              <div style={{ color: DS.colors.secondary, fontWeight: 600 }}>
                                ✓ PDPO compliant · Logged for audit trail
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Bottom Section: Pagination + GSheet Status */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "20px", flexWrap: "wrap" }}>
        {/* Pagination */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            background: DS.colors.surface,
            padding: "10px 16px",
            borderRadius: DS.radius.md,
            border: `1px solid ${DS.colors.border}`,
            boxShadow: DS.shadow.sm,
          }}
        >
          <span style={{ fontSize: "13px", color: DS.colors.textSecondary }}>
            Showing{" "}
            <strong style={{ color: DS.colors.textPrimary }}>
              {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalLogs)}
            </strong>{" "}
            of <strong style={{ color: DS.colors.textPrimary }}>{totalLogs.toLocaleString()}</strong> logs
          </span>
          <div style={{ width: "1px", height: "16px", background: DS.colors.border }} />
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            style={{
              width: "30px",
              height: "30px",
              background: currentPage === 1 ? DS.colors.background : DS.colors.surface,
              border: `1px solid ${DS.colors.border}`,
              borderRadius: DS.radius.sm,
              cursor: currentPage === 1 ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: currentPage === 1 ? 0.4 : 1,
            }}
          >
            <ChevronLeft size={14} color={DS.colors.textSecondary} />
          </button>

          {/* Page Numbers */}
          {[1, 2, 3].map((p) => (
            <button
              key={p}
              onClick={() => setCurrentPage(p)}
              style={{
                width: "30px",
                height: "30px",
                background: currentPage === p ? DS.colors.primary : DS.colors.surface,
                border: `1px solid ${currentPage === p ? DS.colors.primary : DS.colors.border}`,
                borderRadius: DS.radius.sm,
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: currentPage === p ? 700 : 400,
                color: currentPage === p ? "#fff" : DS.colors.textSecondary,
                fontFamily: DS.font.family,
              }}
            >
              {p}
            </button>
          ))}
          <span style={{ fontSize: "13px", color: DS.colors.textMuted }}>...</span>
          <button
            onClick={() => setCurrentPage(totalPages)}
            style={{
              width: "30px",
              height: "30px",
              background: currentPage === totalPages ? DS.colors.primary : DS.colors.surface,
              border: `1px solid ${DS.colors.border}`,
              borderRadius: DS.radius.sm,
              cursor: "pointer",
              fontSize: "13px",
              color: DS.colors.textSecondary,
              fontFamily: DS.font.family,
            }}
          >
            {totalPages}
          </button>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            style={{
              width: "30px",
              height: "30px",
              background: DS.colors.surface,
              border: `1px solid ${DS.colors.border}`,
              borderRadius: DS.radius.sm,
              cursor: currentPage === totalPages ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: currentPage === totalPages ? 0.4 : 1,
            }}
          >
            <ChevronRight size={14} color={DS.colors.textSecondary} />
          </button>

          <div style={{ width: "1px", height: "16px", background: DS.colors.border }} />
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "12px", color: DS.colors.textMuted }}>Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              style={{
                padding: "4px 8px",
                border: `1px solid ${DS.colors.border}`,
                borderRadius: DS.radius.sm,
                fontSize: "13px",
                fontFamily: DS.font.family,
                color: DS.colors.textPrimary,
                outline: "none",
                cursor: "pointer",
              }}
            >
              {[20, 50, 100].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Google Sheets Connection Status Card */}
        <Card
          style={{
            padding: "16px 20px",
            minWidth: "300px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
            <ArrowLeftRight size={16} color={DS.colors.secondary} />
            <span style={{ fontSize: "14px", fontWeight: 700, color: DS.colors.textPrimary }}>
              Google Sheets Connection
            </span>
            <span
              style={{
                marginLeft: "auto",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "12px",
                fontWeight: 700,
                color: DS.colors.secondary,
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: DS.colors.secondary,
                  boxShadow: `0 0 6px ${DS.colors.secondary}`,
                  display: "inline-block",
                }}
              />
              Connected
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
              <span style={{ color: DS.colors.textSecondary }}>Last sync:</span>
              <span style={{ color: DS.colors.textPrimary, fontWeight: 600 }}>3 minutes ago</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
              <span style={{ color: DS.colors.textSecondary }}>Next scheduled:</span>
              <span style={{ color: DS.colors.textPrimary, fontWeight: 600 }}>in 27 minutes</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
              <span style={{ color: DS.colors.textSecondary }}>Sheets connected:</span>
              <span style={{ color: DS.colors.textPrimary, fontWeight: 600 }}>5 workbooks</span>
            </div>
          </div>

          {/* Progress bar for next sync */}
          <div style={{ marginTop: "10px" }}>
            <div
              style={{
                height: "4px",
                background: DS.colors.border,
                borderRadius: "2px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: "10%",
                  background: `linear-gradient(90deg, ${DS.colors.secondary}, #34D399)`,
                  borderRadius: "2px",
                }}
              />
            </div>
          </div>

          <button
            style={{
              marginTop: "10px",
              background: "none",
              border: "none",
              color: DS.colors.primary,
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              padding: "0",
              fontFamily: DS.font.family,
              textDecoration: "underline",
            }}
          >
            View Sync History →
          </button>
        </Card>
      </div>
    </div>
  );
};
