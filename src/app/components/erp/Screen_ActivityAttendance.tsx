// ─────────────────────────────────────────────────────────────────────────────
// Activity Attendance — manual status matrix + smart paste + history tabs
// Status → ACORN: Present +1 | ABS 0 (penalizes ratio) | N/A excluded from denom
// ─────────────────────────────────────────────────────────────────────────────
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, Calendar, Users, AlertTriangle, Save, ClipboardPaste, Zap, CheckCircle2,
} from "lucide-react";
import { ERP } from "./erpTokens";

const F = ERP.font.family;

export type AttendanceStatus = "Present" | "ABS" | "N/A";

export type AttendanceRow = {
  id: number;
  student_id: string;
  student_pk?: number;
  name_zh_hk?: string;
  name_en?: string;
  name?: string;
  class_name?: string;
  class_number?: number;
  created_at?: string;
  is_walk_in?: boolean;
  schedule_id?: number;
  stage_label?: string;
  status?: AttendanceStatus | string;
  performance_note?: string;
};

type ScheduleOpt = {
  id: number;
  label: string;
  label_en?: string;
  date?: string;
};

type GridStudent = {
  id: number;
  student_id: string;
  name: string;
  name_zh_hk?: string;
  name_en?: string;
  class_name: string;
  class_number: number;
  status: AttendanceStatus;
  performance_note: string;
  has_record?: boolean;
};

type Props = {
  activityId?: number | null;
  activityName?: string;
  academicYear?: string;
  schedules?: ScheduleOpt[];
  students?: Array<{
    id: number;
    student_id: string;
    name?: string;
    name_zh_hk?: string;
    name_en?: string;
    class_name?: string;
    class_number?: number;
  }>;
  groupedRecords?: Record<string, AttendanceRow[]>;
  totalCount?: number;
  saveUrl?: string;
  rosterLoadUrl?: string;
  editUrl?: string;
  rosterUrl?: string;
  listUrl?: string;
  flashSuccess?: string;
  flashError?: string;
};

const STATUS_OPTS: { value: AttendanceStatus; label: string; bg: string; color: string; border: string }[] = [
  { value: "Present", label: "出席 Present", bg: "#F0FDF4", color: "#15803D", border: "#86EFAC" },
  { value: "ABS", label: "缺席 ABS", bg: "#FEF2F2", color: "#B91C1C", border: "#FECACA" },
  { value: "N/A", label: "豁免 N/A", bg: "#F8FAFC", color: "#64748B", border: "#CBD5E1" },
];

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
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  });
}

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Tokenize paste: "1A01, 1A02", "S00001 S00037", class+number combos */
function tokenizePaste(raw: string): string[] {
  return raw
    .split(/[\s,;|/\n\r\t]+/)
    .map(t => t.trim())
    .filter(Boolean)
    .map(t => t.replace(/^#/, ""));
}

function matchesToken(s: GridStudent, token: string): boolean {
  const t = token.toUpperCase();
  const sid = String(s.student_id || "").toUpperCase();
  if (sid && (sid === t || sid.endsWith(t) || t.endsWith(sid))) return true;

  const cls = String(s.class_name || "").toUpperCase().replace(/\s+/g, "");
  const num = String(s.class_number || "");
  const classNumCombo = cls && num ? `${cls}${num.padStart(2, "0")}` : "";
  const classNumLoose = cls && num ? `${cls}${num}` : "";
  if (classNumCombo && (classNumCombo === t || classNumCombo.replace(/^F/, "S") === t || classNumCombo.replace(/^S/, "") === t.replace(/^S/, ""))) {
    return true;
  }
  if (classNumLoose && classNumLoose === t) return true;

  // e.g. 1A01 → class 1A + number 1
  const m = t.match(/^([A-Z]?\d+[A-Z])0*(\d+)$/i);
  if (m) {
    const c = m[1].toUpperCase();
    const n = String(Number(m[2]));
    if (cls === c || cls.endsWith(c) || c.endsWith(cls.replace(/^F/, ""))) {
      if (num === n || num === m[2]) return true;
    }
  }
  return false;
}

export const Screen_ActivityAttendance: React.FC<Props> = ({
  activityId = null,
  activityName = "",
  academicYear = "",
  schedules = [],
  students: seedStudents = [],
  groupedRecords = {},
  totalCount,
  saveUrl = "",
  rosterLoadUrl = "",
  editUrl = "/activities",
  rosterUrl = "",
  listUrl = "/activities",
  flashSuccess,
  flashError,
}) => {
  const dates = useMemo(() => Object.keys(groupedRecords), [groupedRecords]);
  const [activeDate, setActiveDate] = useState<string>(() => dates[0] || "");
  const [scheduleId, setScheduleId] = useState<string>(() =>
    schedules[0] ? String(schedules[0].id) : "0"
  );
  const [sessionDate, setSessionDate] = useState(() => {
    const sch = schedules[0];
    return (sch?.date && /^\d{4}-\d{2}-\d{2}$/.test(sch.date)) ? sch.date : todayISO();
  });
  const [grid, setGrid] = useState<GridStudent[]>(() =>
    (seedStudents || []).map(s => ({
      id: Number(s.id),
      student_id: String(s.student_id || ""),
      name: String(s.name || s.name_zh_hk || s.name_en || ""),
      name_zh_hk: s.name_zh_hk,
      name_en: s.name_en,
      class_name: String(s.class_name || ""),
      class_number: Number(s.class_number || 0),
      status: "ABS" as AttendanceStatus,
      performance_note: "",
    }))
  );
  const [pasteText, setPasteText] = useState("");
  const [parseMsg, setParseMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(flashSuccess || null);
  const [errMsg, setErrMsg] = useState<string | null>(flashError || null);
  const [loadingGrid, setLoadingGrid] = useState(false);

  const safeActive = dates.includes(activeDate) ? activeDate : (dates[0] || "");
  const total = totalCount ?? dates.reduce((n, d) => n + (groupedRecords[d]?.length || 0), 0);

  const loadRoster = useCallback(async () => {
    if (!rosterLoadUrl || !activityId) return;
    setLoadingGrid(true);
    setLoadErr(null);
    try {
      const q = new URLSearchParams({
        schedule_id: scheduleId || "0",
        date: sessionDate,
      });
      const res = await fetch(`${rosterLoadUrl}?${q}`, { credentials: "same-origin" });
      const json = await res.json();
      if (!json?.ok) {
        setLoadErr(json?.message || "無法載入名冊");
        return;
      }
      setGrid((json.students || []).map((s: any) => ({
        id: Number(s.id),
        student_id: String(s.student_id || ""),
        name: String(s.name || s.name_zh_hk || s.name_en || ""),
        name_zh_hk: s.name_zh_hk,
        name_en: s.name_en,
        class_name: String(s.class_name || ""),
        class_number: Number(s.class_number || 0),
        status: (s.status === "Present" || s.status === "ABS" || s.status === "N/A" ? s.status : "ABS") as AttendanceStatus,
        performance_note: String(s.performance_note || ""),
        has_record: !!s.has_record,
      })));
    } catch {
      setLoadErr("無法載入名冊");
    } finally {
      setLoadingGrid(false);
    }
  }, [rosterLoadUrl, activityId, scheduleId, sessionDate]);

  useEffect(() => {
    loadRoster();
  }, [loadRoster]);

  useEffect(() => {
    const sch = schedules.find(s => String(s.id) === scheduleId);
    if (sch?.date && /^\d{4}-\d{2}-\d{2}$/.test(sch.date)) {
      setSessionDate(sch.date);
    }
  }, [scheduleId]);

  const updateRow = (id: number, patch: Partial<GridStudent>) => {
    setGrid(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
    setOkMsg(null);
  };

  const runSmartParse = () => {
    const tokens = tokenizePaste(pasteText);
    if (!tokens.length) {
      setParseMsg("請貼上學號或班號（例：1A01, 1A02 或 S00001 S00037）");
      return;
    }
    let matched = 0;
    setGrid(prev => prev.map(row => {
      const hit = tokens.some(t => matchesToken(row, t));
      if (!hit) return row;
      matched++;
      return { ...row, status: "Present" as AttendanceStatus };
    }));
    setParseMsg(matched > 0
      ? `已標記 ${matched} 位學生為出席 Present（共 ${tokens.length} 個代碼）`
      : "未能對應任何學生，請檢查學號／班號格式");
  };

  const markAll = (status: AttendanceStatus) => {
    setGrid(prev => prev.map(r => ({ ...r, status })));
    setOkMsg(null);
  };

  const save = async () => {
    if (!saveUrl || saving) return;
    setSaving(true);
    setErrMsg(null);
    setOkMsg(null);
    try {
      const res = await fetch(saveUrl, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          schedule_id: Number(scheduleId) || 0,
          date: sessionDate,
          rows: grid.map(r => ({
            student_id: r.id,
            status: r.status,
            performance_note: r.performance_note,
          })),
        }),
      });
      const json = await res.json();
      if (!json?.ok) {
        setErrMsg(json?.message || "儲存失敗");
        return;
      }
      setOkMsg(json.message || "已儲存出席狀態");
      await loadRoster();
    } catch {
      setErrMsg("儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  const counts = useMemo(() => ({
    present: grid.filter(r => r.status === "Present").length,
    abs: grid.filter(r => r.status === "ABS").length,
    na: grid.filter(r => r.status === "N/A").length,
  }), [grid]);

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "8px 10px", borderRadius: ERP.radius.sm,
    border: `1px solid ${ERP.colors.border}`, background: ERP.colors.surface,
    fontSize: 13, fontFamily: F, outline: "none",
  };

  return (
    <div style={{
      fontFamily: F, background: ERP.colors.pageBg, minHeight: "100%",
      padding: "20px 24px 40px",
    }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
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
              出席管理 Attendance
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: ERP.colors.textMuted }}>
              {activityName || "活動"}
              {academicYear ? ` · ${academicYear}` : ""}
              {" · "}人工狀態矩陣 + 智能解析 · 接入 ACORN
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

        {(okMsg || errMsg) && (
          <div style={{
            padding: "10px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, marginBottom: 14,
            background: okMsg ? "#ECFDF5" : "#FEF2F2",
            color: okMsg ? "#065F46" : "#991B1B",
            border: `1px solid ${okMsg ? "#6EE7B7" : "#FECACA"}`,
          }}>
            {okMsg || errMsg}
          </div>
        )}

        {/* Manual entry panel */}
        <div style={{
          background: ERP.colors.surface, border: `1px solid ${ERP.colors.border}`,
          borderRadius: ERP.radius.lg, padding: 18, marginBottom: 18, boxShadow: ERP.shadow.xs,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Users size={16} color={ERP.colors.accent} />
            <span style={{ fontSize: 14, fontWeight: 800 }}>批量輸入表格 Manual Attendance Grid</span>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 12, marginBottom: 14,
          }}>
            <label style={{ display: "block" }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: ERP.colors.textMuted, letterSpacing: "0.05em" }}>賽程階段</span>
              <select
                value={scheduleId}
                onChange={e => setScheduleId(e.target.value)}
                style={{ ...inputStyle, marginTop: 4, appearance: "none" as const }}
              >
                <option value="0">單次 / 無分階段 (schedule_id=0)</option>
                {schedules.map(s => (
                  <option key={s.id} value={String(s.id)}>
                    {s.label}{s.date ? ` · ${s.date}` : ""}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: "block" }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: ERP.colors.textMuted, letterSpacing: "0.05em" }}>出席日期</span>
              <input
                type="date"
                value={sessionDate}
                onChange={e => setSessionDate(e.target.value)}
                style={{ ...inputStyle, marginTop: 4 }}
              />
            </label>
          </div>

          <div style={{
            marginBottom: 14, padding: 14, borderRadius: ERP.radius.md,
            border: `1px solid ${ERP.colors.border}`, background: ERP.colors.pageBg,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Zap size={14} color="#D97706" />
              <span style={{ fontSize: 12, fontWeight: 800 }}>快速批量標記出席 (Quick Paste Attendance)</span>
            </div>
            <textarea
              value={pasteText}
              onChange={e => setPasteText(e.target.value)}
              rows={3}
              placeholder={"貼上學號或班號，例如：\n1A01, 1A02, 1A05\n或 S00001 S00037"}
              style={{
                ...inputStyle, resize: "vertical", fontFamily: ERP.font.mono, fontSize: 12,
                background: "#FAFBFC", minHeight: 72,
              }}
            />
            <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" as const, alignItems: "center" }}>
              <button type="button" onClick={() => navigator.clipboard.readText().then(t => setPasteText(t)).catch(() => {})} style={{
                display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 12px",
                borderRadius: ERP.radius.md, border: `1px solid ${ERP.colors.border}`,
                background: "#fff", fontSize: 12, fontWeight: 700, fontFamily: F, cursor: "pointer",
              }}>
                <ClipboardPaste size={13} /> 貼上
              </button>
              <button type="button" onClick={runSmartParse} style={{
                display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 12px",
                borderRadius: ERP.radius.md, border: "1px solid #FDE68A",
                background: "#FFFBEB", color: "#92400E", fontSize: 12, fontWeight: 700, fontFamily: F, cursor: "pointer",
              }}>
                <Zap size={13} /> 解析並標記 (Parse & Mark)
              </button>
              <button type="button" onClick={() => markAll("Present")} style={{
                padding: "7px 10px", borderRadius: ERP.radius.md, border: "1px solid #86EFAC",
                background: "#F0FDF4", color: "#15803D", fontSize: 11, fontWeight: 700, fontFamily: F, cursor: "pointer",
              }}>全出席</button>
              <button type="button" onClick={() => markAll("ABS")} style={{
                padding: "7px 10px", borderRadius: ERP.radius.md, border: "1px solid #FECACA",
                background: "#FEF2F2", color: "#B91C1C", fontSize: 11, fontWeight: 700, fontFamily: F, cursor: "pointer",
              }}>全缺席</button>
              <button type="button" onClick={() => markAll("N/A")} style={{
                padding: "7px 10px", borderRadius: ERP.radius.md, border: `1px solid ${ERP.colors.border}`,
                background: "#F8FAFC", color: "#64748B", fontSize: 11, fontWeight: 700, fontFamily: F, cursor: "pointer",
              }}>全 N/A</button>
            </div>
            {parseMsg && (
              <p style={{ margin: "8px 0 0", fontSize: 12, fontWeight: 600, color: ERP.colors.accent }}>{parseMsg}</p>
            )}
          </div>

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" as const, marginBottom: 10, fontSize: 12 }}>
            <span style={{ fontWeight: 700, color: "#15803D" }}>Present {counts.present}</span>
            <span style={{ fontWeight: 700, color: "#B91C1C" }}>ABS {counts.abs}</span>
            <span style={{ fontWeight: 700, color: "#64748B" }}>N/A {counts.na}</span>
            <span style={{ color: ERP.colors.textMuted }}>
              ACORN 比率 ≈ {counts.present + counts.abs > 0
                ? Math.round((counts.present / (counts.present + counts.abs)) * 100)
                : 100}%
              （N/A 不計入分母）
            </span>
            {loadingGrid && <span style={{ color: ERP.colors.textMuted }}>載入中…</span>}
            {loadErr && <span style={{ color: "#B91C1C", fontWeight: 600 }}>{loadErr}</span>}
          </div>

          <div style={{ overflowX: "auto", border: `1px solid ${ERP.colors.border}`, borderRadius: ERP.radius.md }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
              <thead>
                <tr style={{ background: "#F8FAFC" }}>
                  {["姓名", "班別", "學號", "狀態 Status", "表現 / 成就 Performance"].map(h => (
                    <th key={h} style={{
                      textAlign: "left", padding: "10px 12px", fontSize: 11, fontWeight: 700,
                      color: ERP.colors.textMuted, borderBottom: `1px solid ${ERP.colors.border}`,
                      letterSpacing: "0.04em", textTransform: "uppercase" as const,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grid.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 28, textAlign: "center", color: ERP.colors.textMuted, fontSize: 13 }}>
                      尚無報名學生。請先至「管理名單」加入參與者。
                    </td>
                  </tr>
                ) : grid.map(row => {
                  const cfg = STATUS_OPTS.find(s => s.value === row.status) || STATUS_OPTS[1];
                  return (
                    <tr key={row.id} style={{ borderBottom: `1px solid ${ERP.colors.border}`, background: cfg.bg }}>
                      <td style={{ padding: "8px 12px" }}>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{row.name || row.name_zh_hk || "—"}</div>
                        {row.name_en ? <div style={{ fontSize: 10, color: ERP.colors.textMuted }}>{row.name_en}</div> : null}
                      </td>
                      <td style={{ padding: "8px 12px", fontSize: 12 }}>
                        {row.class_name
                          ? `${row.class_name}${row.class_number ? ` #${String(row.class_number).padStart(2, "0")}` : ""}`
                          : "—"}
                      </td>
                      <td style={{ padding: "8px 12px", fontSize: 12, fontFamily: ERP.font.mono, fontWeight: 700 }}>
                        {row.student_id}
                      </td>
                      <td style={{ padding: "6px 10px" }}>
                        <select
                          value={row.status}
                          onChange={e => updateRow(row.id, { status: e.target.value as AttendanceStatus })}
                          style={{
                            width: "100%", padding: "7px 8px", borderRadius: ERP.radius.sm,
                            border: `1px solid ${cfg.border}`, background: "#fff",
                            color: cfg.color, fontWeight: 700, fontSize: 12, fontFamily: F,
                          }}
                        >
                          {STATUS_OPTS.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: "6px 10px" }}>
                        <input
                          type="text"
                          value={row.performance_note}
                          onChange={e => updateRow(row.id, { performance_note: e.target.value })}
                          placeholder="成就／表現備註…"
                          style={inputStyle}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14, gap: 8 }}>
            <button
              type="button"
              onClick={save}
              disabled={saving || !saveUrl || grid.length === 0}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "10px 18px", borderRadius: ERP.radius.md, border: "none",
                background: ERP.colors.accent, color: "#fff",
                fontSize: 13, fontWeight: 700, fontFamily: F,
                cursor: saving || grid.length === 0 ? "not-allowed" : "pointer",
                opacity: saving || grid.length === 0 ? 0.55 : 1,
                boxShadow: `0 2px 10px ${ERP.colors.accent}40`,
              }}
            >
              {saving ? <Save size={14} /> : <CheckCircle2 size={14} />}
              {saving ? "儲存中…" : "儲存出席狀態"}
            </button>
          </div>
        </div>

        {/* History */}
        <div style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
          <Calendar size={15} color={ERP.colors.textMuted} />
          <span style={{ fontSize: 14, fontWeight: 800 }}>歷史簽到紀錄</span>
          <span style={{ fontSize: 12, color: ERP.colors.textMuted }}>共 {total} 筆 · {dates.length} 日</span>
        </div>

        {dates.length === 0 ? (
          <div style={{
            background: ERP.colors.surface, border: `1px solid ${ERP.colors.border}`,
            borderRadius: ERP.radius.lg, padding: "40px 24px", textAlign: "center",
            boxShadow: ERP.shadow.xs,
          }}>
            <div style={{ fontSize: 13, color: ERP.colors.textMuted }}>
              尚無歷史紀錄。可使用上方表格人工輸入，或於活動編輯頁 QR 簽到。
            </div>
          </div>
        ) : (
          <div style={{
            background: ERP.colors.surface, border: `1px solid ${ERP.colors.border}`,
            borderRadius: ERP.radius.lg, overflow: "hidden", boxShadow: ERP.shadow.xs,
          }}>
            <ul style={{
              display: "flex", gap: 0, margin: 0, padding: "0 8px", listStyle: "none",
              borderBottom: `1px solid ${ERP.colors.border}`, background: ERP.colors.pageBg,
              overflowX: "auto",
            }}>
              {dates.map((date) => {
                const active = date === safeActive;
                const count = groupedRecords[date]?.length || 0;
                return (
                  <li key={date} style={{ flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => setActiveDate(date)}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 14px",
                        border: "none",
                        borderBottom: active ? `2.5px solid #059669` : "2.5px solid transparent",
                        background: "transparent",
                        color: active ? "#047857" : ERP.colors.textSecondary,
                        fontSize: 13, fontWeight: active ? 800 : 600, fontFamily: F, cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatDateLabel(date)}
                      <span style={{
                        fontSize: 11, fontWeight: 800, padding: "1px 7px", borderRadius: 999,
                        background: active ? "#D1FAE5" : ERP.colors.border,
                        color: active ? "#065F46" : ERP.colors.textMuted,
                      }}>{count}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
                <thead>
                  <tr style={{ background: ERP.colors.pageBg }}>
                    {["學號", "姓名", "班別", "狀態", "階段", "時間", "表現"].map((h) => (
                      <th key={h} style={{
                        textAlign: "left", padding: "11px 14px", fontSize: 11, fontWeight: 700,
                        color: ERP.colors.textMuted, letterSpacing: "0.04em",
                        textTransform: "uppercase" as const,
                        borderBottom: `1px solid ${ERP.colors.border}`,
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(groupedRecords[safeActive] || []).map((row, idx, arr) => {
                    const st = (row.status === "Present" || row.status === "ABS" || row.status === "N/A")
                      ? row.status : "Present";
                    const cfg = STATUS_OPTS.find(s => s.value === st) || STATUS_OPTS[0];
                    return (
                      <tr
                        key={row.id || `${row.student_id}-${idx}`}
                        style={{
                          background: row.is_walk_in ? "#FFFBEB" : ERP.colors.surface,
                          borderBottom: idx < arr.length - 1 ? `1px solid ${ERP.colors.border}` : "none",
                        }}
                      >
                        <td style={{ padding: "12px 14px", fontSize: 12, fontFamily: ERP.font.mono, fontWeight: 700 }}>
                          {row.student_id}
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <div style={{ fontSize: 13, fontWeight: 700 }}>
                            {row.name || row.name_zh_hk || row.name_en || "—"}
                          </div>
                        </td>
                        <td style={{ padding: "12px 14px", fontSize: 12, color: ERP.colors.textSecondary }}>
                          {row.class_name
                            ? `${row.class_name}${row.class_number ? ` #${row.class_number}` : ""}`
                            : "—"}
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{
                            fontSize: 11, fontWeight: 800, padding: "3px 8px", borderRadius: 999,
                            background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
                          }}>{st}</span>
                        </td>
                        <td style={{ padding: "12px 14px", fontSize: 12, color: ERP.colors.textSecondary }}>
                          {row.stage_label || (row.schedule_id ? `#${row.schedule_id}` : "今日簽到")}
                        </td>
                        <td style={{ padding: "12px 14px", fontSize: 13, fontFamily: ERP.font.mono, fontWeight: 700 }}>
                          {formatTime(row.created_at)}
                        </td>
                        <td style={{ padding: "12px 14px", fontSize: 12, color: ERP.colors.textSecondary }}>
                          {row.is_walk_in ? (
                            <span style={{
                              display: "inline-flex", alignItems: "center", gap: 4,
                              fontSize: 11, fontWeight: 800, padding: "3px 8px", borderRadius: 999,
                              background: "#FFEDD5", color: "#C2410C", border: "1px solid #FED7AA",
                            }}>
                              <AlertTriangle size={11} /> Walk-in
                            </span>
                          ) : (row.performance_note || "—")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
