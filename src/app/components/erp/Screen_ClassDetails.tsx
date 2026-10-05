// ─────────────────────────────────────────────────────────────────────────────
// Screen 1.B.4 — 班別詳情 / Class Details Hub
// Profile editor (year-scoped teachers) + dedicated roster table
// ─────────────────────────────────────────────────────────────────────────────
import React, { useMemo, useState } from "react";
import {
  ArrowLeft, Users, BookOpen, Save, Search, ExternalLink,
} from "lucide-react";
import { ERP } from "./erpTokens";

type ClassProfile = {
  id: string;
  name: string;
  classCode: string;
  form: string;
  form_teacher_id?: number | null;
  form_teacher_en: string;
  form_teacher_zh_hk: string;
  formTeacher: string;
  headcount: number;
  academic_year: string;
  updateUrl: string;
  room?: string;
};

type TeacherOpt = {
  id: number | string;
  name?: string;
  name_en?: string;
  name_zh_hk?: string;
  label?: string;
  role?: string;
};

type StudentRow = {
  id: string;
  chName: string;
  enName: string;
  classNum: number;
  status: "active" | "repeat" | "left" | "suspended" | string;
  classCode?: string;
};

interface Props {
  profile: ClassProfile;
  students?: StudentRow[];
  teachers?: TeacherOpt[];
  academicYears?: string[];
  academicYear?: string;
  flashSuccess?: string;
  flashError?: string;
}

const STATUS_LABEL: Record<string, { zh: string; color: string; bg: string; border: string }> = {
  active:    { zh: "在學 Active",    color: "#065F46", bg: "#ECFDF5", border: "#6EE7B7" },
  repeat:    { zh: "重讀 Repeat",    color: "#92400E", bg: "#FFFBEB", border: "#FDE68A" },
  suspended: { zh: "停學 Suspended", color: "#9A3412", bg: "#FFF7ED", border: "#FDBA74" },
  left:      { zh: "離校 Left",      color: "#475569", bg: "#F1F5F9", border: "#CBD5E1" },
};

export const Screen_ClassDetails: React.FC<Props> = ({
  profile,
  students = [],
  teachers = [],
  academicYears = ["2025/26", "2024/25", "2023/24"],
  academicYear,
  flashSuccess,
  flashError,
}) => {
  const year = academicYear || profile.academic_year || "2025/26";
  const [statusFilter, setStatusFilter] = useState("全部");
  const [searchQ, setSearchQ] = useState("");
  const [teacherId, setTeacherId] = useState(
    profile.form_teacher_id ? String(profile.form_teacher_id) : ""
  );
  const F = ERP.font.family;

  const filtered = useMemo(() => {
    const q = searchQ.trim().toLowerCase();
    return students.filter(s => {
      if (statusFilter !== "全部" && s.status !== statusFilter) return false;
      if (!q) return true;
      return (
        s.chName.includes(searchQ)
        || s.enName.toLowerCase().includes(q)
        || s.id.toLowerCase().includes(q)
        || String(s.classNum).includes(q)
      );
    });
  }, [students, statusFilter, searchQ]);

  const onAyChange = (ay: string) => {
    window.location.href = `/classes/details/${profile.id}?academic_year=${encodeURIComponent(ay)}`;
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "9px 12px",
    borderRadius: 8,
    border: `1px solid ${ERP.colors.border}`,
    background: ERP.colors.surface,
    fontSize: 13,
    fontFamily: F,
    color: ERP.colors.textPrimary,
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div style={{
      fontFamily: F,
      background: ERP.colors.pageBg,
      minHeight: "100%",
      padding: ERP.layout.contentPad,
      display: "flex",
      flexDirection: "column",
      gap: 18,
    }}>
      {/* Breadcrumb / back */}
      <a
        href={`/classes?academic_year=${encodeURIComponent(year)}`}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          fontSize: 12.5, color: ERP.colors.textSecondary, textDecoration: "none", fontWeight: 500,
          width: "fit-content",
        }}
      >
        <ArrowLeft size={14} /> 班別列表
      </a>

      {/* Class Profile */}
      <div style={{
        background: ERP.colors.surface,
        border: `1px solid ${ERP.colors.border}`,
        borderRadius: 14,
        padding: "20px 22px",
        boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{
              width: 56, height: 56, borderRadius: 12,
              background: ERP.colors.accentPale, color: ERP.colors.accent,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, fontWeight: 800,
            }}>
              {profile.classCode || profile.name}
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: ERP.colors.textPrimary }}>
                {profile.classCode} · {profile.form}
              </h1>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: ERP.colors.textSecondary }}>
                {profile.room || `${profile.name}室`} · AY {year}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div style={{
              padding: "8px 14px", borderRadius: 999,
              background: ERP.colors.tealLight, color: ERP.colors.teal,
              fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6,
            }}>
              <Users size={14} /> {profile.headcount} 名學生
            </div>
            <div>
              <label style={{ display: "block", fontSize: 10.5, fontWeight: 600, color: ERP.colors.textMuted, marginBottom: 4 }}>
                學年 AY
              </label>
              <select
                value={year}
                onChange={e => onAyChange(e.target.value)}
                style={{ ...inputStyle, width: 120, cursor: "pointer" }}
              >
                {academicYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        </div>

        {(flashSuccess || flashError) && (
          <div style={{
            padding: "10px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600,
            background: flashSuccess ? "#ECFDF5" : ERP.colors.redLight,
            color: flashSuccess ? "#065F46" : ERP.colors.red,
            border: `1px solid ${flashSuccess ? "#6EE7B7" : ERP.colors.red}44`,
          }}>
            {flashSuccess || flashError}
          </div>
        )}

        {/* Teacher editor — POST to /classes/update/{id} */}
        <form
          method="post"
          action={profile.updateUrl}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 12,
            alignItems: "end",
            padding: "14px 16px",
            borderRadius: 12,
            background: ERP.colors.surfaceHover,
            border: `1px solid ${ERP.colors.border}`,
          }}
        >
          <input type="hidden" name="academic_year" value={year} />
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: ERP.colors.textMuted, marginBottom: 5 }}>
              <BookOpen size={12} /> 班主任 Form Teacher
            </label>
            <select
              name="form_teacher_id"
              value={teacherId}
              onChange={e => setTeacherId(e.target.value)}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              <option value="">— 未指定 —</option>
              {teachers.map(t => (
                <option key={String(t.id)} value={String(t.id)}>
                  {t.label || t.name || t.name_zh_hk || t.name_en}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "10px 16px", borderRadius: 9, border: "none",
              background: ERP.colors.accent, color: "#fff",
              fontSize: 13, fontWeight: 700, fontFamily: F, cursor: "pointer",
              height: 40,
            }}
          >
            <Save size={14} /> 儲存班主任
          </button>
        </form>
      </div>

      {/* Roster toolbar */}
      <div style={{
        display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end",
        padding: "12px 14px", borderRadius: 12,
        background: ERP.colors.surface, border: `1px solid ${ERP.colors.border}`,
      }}>
        <div style={{ flex: "1 1 220px", position: "relative" }}>
          <label style={{ display: "block", fontSize: 10.5, fontWeight: 600, color: ERP.colors.textMuted, marginBottom: 4 }}>
            搜尋
          </label>
          <Search size={14} style={{ position: "absolute", left: 11, bottom: 11, color: ERP.colors.textMuted }} />
          <input
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            placeholder="姓名 / 學號 / 班號…"
            style={{ ...inputStyle, paddingLeft: 34 }}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 10.5, fontWeight: 600, color: ERP.colors.textMuted, marginBottom: 4 }}>
            狀態 Status
          </label>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ ...inputStyle, width: 140, cursor: "pointer" }}
          >
            <option value="全部">全部</option>
            <option value="active">在學</option>
            <option value="repeat">重讀</option>
            <option value="suspended">停學</option>
            <option value="left">離校</option>
          </select>
        </div>
        <div style={{ fontSize: 12.5, color: ERP.colors.textSecondary, fontWeight: 600, paddingBottom: 8 }}>
          顯示 {filtered.length} / {students.length}
        </div>
      </div>

      {/* Roster table */}
      <div style={{
        background: ERP.colors.surface,
        border: `1px solid ${ERP.colors.border}`,
        borderRadius: 14,
        overflow: "hidden",
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "64px 1.2fr 1.4fr 1.1fr 1.2fr 90px",
          gap: 8,
          padding: "12px 16px",
          background: ERP.colors.surfaceHover,
          borderBottom: `1px solid ${ERP.colors.border}`,
          fontSize: 10.5, fontWeight: 700, color: ERP.colors.textMuted,
          letterSpacing: "0.05em", textTransform: "uppercase",
        }}>
          <div>班號</div>
          <div>中文姓名</div>
          <div>英文姓名</div>
          <div>學號</div>
          <div>學籍狀態</div>
          <div />
        </div>

        {filtered.map(s => {
          const st = STATUS_LABEL[s.status] || STATUS_LABEL.active;
          return (
            <div
              key={s.id}
              style={{
                display: "grid",
                gridTemplateColumns: "64px 1.2fr 1.4fr 1.1fr 1.2fr 90px",
                gap: 8,
                padding: "12px 16px",
                alignItems: "center",
                borderBottom: `1px solid ${ERP.colors.border}`,
                fontSize: 13,
              }}
            >
              <div style={{ fontWeight: 700, color: ERP.colors.textSecondary }}>#{s.classNum || "—"}</div>
              <div style={{ fontWeight: 600, color: ERP.colors.textPrimary }}>{s.chName || "—"}</div>
              <div style={{ color: ERP.colors.textSecondary }}>{s.enName || "—"}</div>
              <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 12.5 }}>{s.id}</div>
              <div>
                <span style={{
                  display: "inline-flex", padding: "3px 8px", borderRadius: 999,
                  background: st.bg, color: st.color, border: `1px solid ${st.border}`,
                  fontSize: 11, fontWeight: 700,
                }}>
                  {st.zh}
                </span>
              </div>
              <a
                href={`/students/details/${encodeURIComponent(s.id)}`}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  fontSize: 12, fontWeight: 600, color: ERP.colors.accent, textDecoration: "none",
                }}
              >
                查看 <ExternalLink size={12} />
              </a>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div style={{ padding: 40, textAlign: "center", color: ERP.colors.textMuted, fontSize: 13 }}>
            此班在 {year} 沒有符合條件的學生
          </div>
        )}
      </div>
    </div>
  );
};

export default Screen_ClassDetails;
