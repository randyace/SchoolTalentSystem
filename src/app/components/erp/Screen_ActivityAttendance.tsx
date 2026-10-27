// ─────────────────────────────────────────────────────────────────────────────
// Activity Attendance Records — tabbed by attendance_date (newest first)
// ─────────────────────────────────────────────────────────────────────────────
import React, { useMemo, useState } from "react";
import { ArrowLeft, Calendar, Users, AlertTriangle } from "lucide-react";
import { ERP } from "./erpTokens";

const F = ERP.font.family;

export type AttendanceRow = {
  id: number;
  student_id: string;
  name_zh_hk?: string;
  name_en?: string;
  name?: string;
  class_name?: string;
  class_number?: number;
  created_at?: string;
  is_walk_in?: boolean;
  schedule_id?: number;
  stage_label?: string;
};

type Props = {
  activityId?: number | null;
  activityName?: string;
  academicYear?: string;
  groupedRecords?: Record<string, AttendanceRow[]>;
  totalCount?: number;
  editUrl?: string;
  rosterUrl?: string;
  listUrl?: string;
  flashSuccess?: string;
  flashError?: string;
};

function formatDateLabel(date: string): string {
  if (!date) return "—";
  const d = new Date(date + "T00:00:00");
  if (Number.isNaN(d.getTime())) return date;
  const wd = d.toLocaleDateString("zh-HK", { weekday: "short" });
  return `${date} (${wd})`;
}

function formatTime(raw?: string): string {
  if (!raw) return "—";
  const d = new Date(String(raw).replace(" ", "T"));
  if (Number.isNaN(d.getTime())) {
    const m = String(raw).match(/(\d{2}:\d{2}:\d{2})/);
    return m ? m[1] : raw;
  }
  return d.toLocaleTimeString("zh-HK", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export const Screen_ActivityAttendance: React.FC<Props> = ({
  activityName = "",
  academicYear = "",
  groupedRecords = {},
  totalCount,
  editUrl = "/activities",
  rosterUrl = "",
  listUrl = "/activities",
  flashSuccess,
  flashError,
}) => {
  const dates = useMemo(() => Object.keys(groupedRecords), [groupedRecords]);
  const [activeDate, setActiveDate] = useState<string>(() => dates[0] || "");
  const activeRows = activeDate ? (groupedRecords[activeDate] || []) : [];
  const total = totalCount ?? dates.reduce((n, d) => n + (groupedRecords[d]?.length || 0), 0);

  // Keep active tab valid if data changes
  const safeActive = dates.includes(activeDate) ? activeDate : (dates[0] || "");

  return (
    <div style={{
      fontFamily: F, background: ERP.colors.pageBg, minHeight: "100%",
      padding: "20px 24px 40px",
    }}>
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <div style={{
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          gap: 12, flexWrap: "wrap", marginBottom: 16,
        }}>
          <div>
            <a href={editUrl} style={{
              display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12,
              color: ERP.colors.textSecondary, textDecoration: "none", marginBottom: 8,
            }}>
              <ArrowLeft size={13} /> 返回活動編輯
            </a>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: ERP.colors.textPrimary }}>
              📅 簽到紀錄 Attendance Records
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: ERP.colors.textMuted }}>
              {activityName || "活動"}
              {academicYear ? ` · ${academicYear}` : ""}
              {" · "}
              共 {total} 筆 · {dates.length} 日
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {rosterUrl && (
              <a href={rosterUrl} style={{
                display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px",
                borderRadius: ERP.radius.md, border: `1px solid ${ERP.colors.border}`,
                background: ERP.colors.surface, color: ERP.colors.textSecondary,
                fontSize: 12, fontWeight: 700, textDecoration: "none", fontFamily: F,
              }}>
                <Users size={13} /> 管理名單
              </a>
            )}
            <a href={listUrl} style={{
              display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px",
              borderRadius: ERP.radius.md, border: `1px solid ${ERP.colors.border}`,
              background: ERP.colors.surface, color: ERP.colors.textSecondary,
              fontSize: 12, fontWeight: 700, textDecoration: "none", fontFamily: F,
            }}>
              活動列表
            </a>
          </div>
        </div>

        {(flashSuccess || flashError) && (
          <div style={{
            padding: "10px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, marginBottom: 14,
            background: flashSuccess ? "#ECFDF5" : "#FEF2F2",
            color: flashSuccess ? "#065F46" : "#991B1B",
            border: `1px solid ${flashSuccess ? "#6EE7B7" : "#FECACA"}`,
          }}>
            {flashSuccess || flashError}
          </div>
        )}

        {dates.length === 0 ? (
          <div style={{
            background: ERP.colors.surface, border: `1px solid ${ERP.colors.border}`,
            borderRadius: ERP.radius.lg, padding: "56px 24px", textAlign: "center",
            boxShadow: ERP.shadow.xs,
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16, margin: "0 auto 14px",
              background: "#ECFDF5", border: "1px solid #A7F3D0",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Calendar size={24} color="#059669" />
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: ERP.colors.textPrimary, marginBottom: 6 }}>
              目前尚無簽到紀錄
            </div>
            <div style={{ fontSize: 12, color: ERP.colors.textMuted, marginBottom: 18 }}>
              No attendance records yet — 使用 QR 簽到後紀錄會顯示於此。
            </div>
            <a href={editUrl} style={{
              display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 16px",
              borderRadius: ERP.radius.md, background: ERP.colors.accent, color: "#fff",
              fontSize: 13, fontWeight: 700, textDecoration: "none", fontFamily: F,
            }}>
              返回活動 · 開始簽到
            </a>
          </div>
        ) : (
          <div style={{
            background: ERP.colors.surface, border: `1px solid ${ERP.colors.border}`,
            borderRadius: ERP.radius.lg, overflow: "hidden", boxShadow: ERP.shadow.xs,
          }}>
            {/* Tabs */}
            <ul
              className="nav nav-tabs"
              id="attendanceTabs"
              role="tablist"
              style={{
                display: "flex",
                gap: 0,
                margin: 0,
                padding: "0 8px",
                listStyle: "none",
                borderBottom: `1px solid ${ERP.colors.border}`,
                background: ERP.colors.pageBg,
                overflowX: "auto",
                WebkitOverflowScrolling: "touch",
              }}
            >
              {dates.map((date) => {
                const active = date === safeActive;
                const count = groupedRecords[date]?.length || 0;
                return (
                  <li key={date} className="nav-item" role="presentation" style={{ flexShrink: 0 }}>
                    <button
                      type="button"
                      role="tab"
                      className={`nav-link${active ? " active" : ""}`}
                      aria-selected={active}
                      onClick={() => setActiveDate(date)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "12px 14px",
                        border: "none",
                        borderBottom: active ? `2.5px solid #059669` : "2.5px solid transparent",
                        background: "transparent",
                        color: active ? "#047857" : ERP.colors.textSecondary,
                        fontSize: 13,
                        fontWeight: active ? 800 : 600,
                        fontFamily: F,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatDateLabel(date)}
                      <span style={{
                        fontSize: 11, fontWeight: 800, padding: "1px 7px", borderRadius: 999,
                        background: active ? "#D1FAE5" : ERP.colors.border,
                        color: active ? "#065F46" : ERP.colors.textMuted,
                      }}>
                        {count}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* Pane */}
            <div className="tab-content" style={{ padding: 0 }}>
              <div
                className="tab-pane fade show active"
                role="tabpanel"
                style={{ display: "block" }}
              >
                <div style={{ overflowX: "auto" }}>
                  <table className="table" style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    minWidth: 640,
                  }}>
                    <thead>
                      <tr style={{ background: ERP.colors.pageBg }}>
                        {["學號", "姓名", "班別", "階段", "簽到時間", "備註"].map((h) => (
                          <th key={h} style={{
                            textAlign: "left",
                            padding: "11px 14px",
                            fontSize: 11,
                            fontWeight: 700,
                            color: ERP.colors.textMuted,
                            letterSpacing: "0.04em",
                            textTransform: "uppercase" as const,
                            borderBottom: `1px solid ${ERP.colors.border}`,
                          }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(groupedRecords[safeActive] || activeRows).map((row, idx, arr) => (
                        <tr
                          key={row.id || `${row.student_id}-${idx}`}
                          style={{
                            background: row.is_walk_in ? "#FFFBEB" : ERP.colors.surface,
                            borderBottom: idx < arr.length - 1 ? `1px solid ${ERP.colors.border}` : "none",
                          }}
                        >
                          <td style={{
                            padding: "12px 14px", fontSize: 12, fontFamily: ERP.font.mono,
                            fontWeight: 700, color: ERP.colors.textPrimary,
                          }}>
                            {row.student_id}
                          </td>
                          <td style={{ padding: "12px 14px" }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: ERP.colors.textPrimary }}>
                              {row.name || row.name_zh_hk || row.name_en || "—"}
                            </div>
                            {row.name_en && row.name_zh_hk ? (
                              <div style={{ fontSize: 11, color: ERP.colors.textMuted }}>{row.name_en}</div>
                            ) : null}
                          </td>
                          <td style={{ padding: "12px 14px", fontSize: 12, color: ERP.colors.textSecondary }}>
                            {row.class_name
                              ? `${row.class_name}${row.class_number ? ` #${row.class_number}` : ""}`
                              : "—"}
                          </td>
                          <td style={{ padding: "12px 14px", fontSize: 12, color: ERP.colors.textSecondary }}>
                            {row.stage_label || (row.schedule_id ? `#${row.schedule_id}` : "今日簽到")}
                          </td>
                          <td style={{
                            padding: "12px 14px", fontSize: 13, fontFamily: ERP.font.mono,
                            fontWeight: 700, color: ERP.colors.textPrimary,
                          }}>
                            {formatTime(row.created_at)}
                          </td>
                          <td style={{ padding: "12px 14px" }}>
                            {row.is_walk_in ? (
                              <span style={{
                                display: "inline-flex", alignItems: "center", gap: 4,
                                fontSize: 11, fontWeight: 800, padding: "3px 8px", borderRadius: 999,
                                background: "#FFEDD5", color: "#C2410C", border: "1px solid #FED7AA",
                              }}>
                                <AlertTriangle size={11} /> 未報名 Walk-in
                              </span>
                            ) : (
                              <span style={{ fontSize: 11, color: ERP.colors.textMuted }}>—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
