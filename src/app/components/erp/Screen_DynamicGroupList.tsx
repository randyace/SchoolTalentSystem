// ─────────────────────────────────────────────────────────────────────────────
// Screen 1.B.5 — 動態分組管理 / Dynamic Group Mgmt (Listing)
// Cross-class electives hub — composition badges from origin classes
// ─────────────────────────────────────────────────────────────────────────────
import React, { useMemo, useState } from "react";
import {
  Plus, Search, Users, BookOpen, Layers, ExternalLink, Pencil,
  Filter, School,
} from "lucide-react";
import { ERP } from "./erpTokens";

export type DynamicGroupRow = {
  id: number;
  academic_year: string;
  form: string;
  name: string;
  subject_area: string;
  teacher_en?: string;
  teacher_zh_hk?: string;
  teacher: string;
  student_count: number;
  origin_classes: string[];
};

interface Props {
  groups?: DynamicGroupRow[];
  academicYears?: string[];
  academicYear?: string;
  forms?: string[];
  subjectAreas?: string[];
  filterForm?: string;
  filterSubject?: string;
  createUrl?: string;
  flashSuccess?: string;
  flashError?: string;
}

const F = ERP.font.family;

const CLASS_PALETTE = [
  { bg: "#DBEAFE", color: "#1D4ED8", border: "#93C5FD" },
  { bg: "#EDE9FE", color: "#6D28D9", border: "#C4B5FD" },
  { bg: "#DCFCE7", color: "#15803D", border: "#86EFAC" },
  { bg: "#FEF3C7", color: "#92400E", border: "#FCD34D" },
  { bg: "#FFEDD5", color: "#9A3412", border: "#FDBA74" },
  { bg: "#CFFAFE", color: "#0E7490", border: "#67E8F9" },
  { bg: "#FCE7F3", color: "#9D174D", border: "#F9A8D4" },
  { bg: "#F1F5F9", color: "#334155", border: "#CBD5E1" },
];

function paletteFor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i) * (i + 1)) % CLASS_PALETTE.length;
  return CLASS_PALETTE[h];
}

const OriginBadge: React.FC<{ name: string }> = ({ name }) => {
  const p = paletteFor(name);
  return (
    <span
      className="badge bg-soft-primary"
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 8px",
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 700,
        background: p.bg,
        color: p.color,
        border: `1px solid ${p.border}`,
        fontFamily: F,
        letterSpacing: 0.2,
      }}
    >
      {name}
    </span>
  );
};

const selectStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 8,
  border: `1px solid ${ERP.colors.border}`,
  background: ERP.colors.surface,
  fontSize: 13,
  fontFamily: F,
  color: ERP.colors.textPrimary,
  cursor: "pointer",
  outline: "none",
  minWidth: 120,
};

export const Screen_DynamicGroupList: React.FC<Props> = ({
  groups = [],
  academicYears = ["2025/26", "2024/25", "2023/24"],
  academicYear = "2025/26",
  forms = [],
  subjectAreas = [],
  filterForm = "全部",
  filterSubject = "全部",
  createUrl = "/dynamic-group/create",
  flashSuccess,
  flashError,
}) => {
  const [searchQ, setSearchQ] = useState("");

  const filtered = useMemo(() => {
    const q = searchQ.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter((g) =>
      g.name.toLowerCase().includes(q)
      || g.subject_area.toLowerCase().includes(q)
      || g.teacher.toLowerCase().includes(q)
      || g.origin_classes.some((c) => c.toLowerCase().includes(q))
    );
  }, [groups, searchQ]);

  const navigateFilters = (patch: Record<string, string>) => {
    const params = new URLSearchParams();
    const ay = patch.academic_year ?? academicYear;
    const form = patch.form ?? (filterForm === "全部" ? "" : filterForm);
    const kla = patch.subject_area ?? (filterSubject === "全部" ? "" : filterSubject);
    if (ay) params.set("academic_year", ay);
    if (form && form !== "全部") params.set("form", form);
    if (kla && kla !== "全部") params.set("subject_area", kla);
    const qs = params.toString();
    window.location.href = qs ? `/dynamic-group?${qs}` : "/dynamic-group";
  };

  return (
    <div style={{
      fontFamily: F,
      background: ERP.colors.pageBg,
      minHeight: "100%",
      padding: ERP.layout?.contentPad ?? 24,
      display: "flex",
      flexDirection: "column",
      gap: 18,
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 16,
        flexWrap: "wrap",
      }}>
        <div>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            fontSize: 11, fontWeight: 700, color: ERP.colors.accent,
            letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 6,
          }}>
            <Layers size={13} /> Cross-Class Electives
          </div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: ERP.colors.textPrimary }}>
            動態分組管理 Dynamic Group Mgmt
          </h1>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: ERP.colors.textSecondary, maxWidth: 560 }}>
            跨班選修／活動分組一覽。組成班別徽章顯示學生來源班別（如 3A、3B、3C）。
          </p>
        </div>
        <a
          href={
            filterForm && filterForm !== "全部"
              ? `${createUrl}?form=${encodeURIComponent(filterForm)}&academic_year=${encodeURIComponent(academicYear)}`
              : `${createUrl}?form=F3&academic_year=${encodeURIComponent(academicYear)}`
          }
          className="btn btn-primary"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 18px",
            borderRadius: 10,
            background: ERP.colors.accent,
            color: "#fff",
            fontSize: 13.5,
            fontWeight: 700,
            textDecoration: "none",
            boxShadow: "0 1px 2px rgba(37,99,235,0.25)",
            whiteSpace: "nowrap",
          }}
        >
          <Plus size={16} /> 建立新群組 Create Group
        </a>
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

      {/* Filters */}
      <div style={{
        background: ERP.colors.surface,
        border: `1px solid ${ERP.colors.border}`,
        borderRadius: 12,
        padding: "14px 16px",
        display: "flex",
        flexWrap: "wrap",
        gap: 12,
        alignItems: "flex-end",
        boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: ERP.colors.textMuted, fontSize: 12, fontWeight: 700, marginRight: 4 }}>
          <Filter size={13} /> 篩選
        </div>
        <div>
          <label style={{ display: "block", fontSize: 10.5, fontWeight: 600, color: ERP.colors.textMuted, marginBottom: 4 }}>
            Academic Year 學年
          </label>
          <select
            value={academicYear}
            onChange={(e) => navigateFilters({ academic_year: e.target.value })}
            style={selectStyle}
          >
            {academicYears.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: "block", fontSize: 10.5, fontWeight: 600, color: ERP.colors.textMuted, marginBottom: 4 }}>
            Form 級別
          </label>
          <select
            value={filterForm}
            onChange={(e) => navigateFilters({ form: e.target.value })}
            style={selectStyle}
          >
            <option value="全部">全部</option>
            {forms.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: "block", fontSize: 10.5, fontWeight: 600, color: ERP.colors.textMuted, marginBottom: 4 }}>
            Subject / KLA 科目
          </label>
          <select
            value={filterSubject}
            onChange={(e) => navigateFilters({ subject_area: e.target.value })}
            style={{ ...selectStyle, minWidth: 150 }}
          >
            <option value="全部">全部</option>
            {subjectAreas.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <label style={{ display: "block", fontSize: 10.5, fontWeight: 600, color: ERP.colors.textMuted, marginBottom: 4 }}>
            Search
          </label>
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: ERP.colors.textMuted }} />
            <input
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="群組名稱、科目、教師…"
              style={{
                ...selectStyle,
                width: "100%",
                paddingLeft: 32,
                cursor: "text",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>
        <div style={{
          marginLeft: "auto",
          padding: "8px 12px",
          borderRadius: 8,
          background: ERP.colors.accentPale,
          color: ERP.colors.accent,
          fontSize: 12.5,
          fontWeight: 700,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
        }}>
          <Users size={14} /> {filtered.length} 個群組
        </div>
      </div>

      {/* Data table */}
      <div style={{
        background: ERP.colors.surface,
        border: `1px solid ${ERP.colors.border}`,
        borderRadius: 14,
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
      }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: ERP.colors.pageBg, borderBottom: `1px solid ${ERP.colors.border}` }}>
                {[
                  "群組名稱 Group Name",
                  "科目 Subject",
                  "負責教師 Teacher",
                  "人數",
                  "組成班別 Composition",
                  "操作 Actions",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "12px 16px",
                      fontSize: 11,
                      fontWeight: 700,
                      color: ERP.colors.textMuted,
                      letterSpacing: 0.3,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "48px 24px", textAlign: "center", color: ERP.colors.textMuted }}>
                    <School size={28} style={{ opacity: 0.35, marginBottom: 8 }} />
                    <div style={{ fontWeight: 600 }}>此學年暫無動態分組</div>
                    <div style={{ fontSize: 12.5, marginTop: 4 }}>
                      按右上角「建立新群組」開始建立跨班選修。
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((g) => (
                  <tr
                    key={g.id}
                    style={{ borderBottom: `1px solid ${ERP.colors.divider}` }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = ERP.colors.surfaceHover; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 700, color: ERP.colors.textPrimary }}>{g.name}</div>
                      <div style={{ fontSize: 11.5, color: ERP.colors.textMuted, marginTop: 2 }}>
                        {g.form || "—"} · AY {g.academic_year}
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        padding: "3px 9px", borderRadius: 999,
                        background: ERP.colors.purpleLight, color: ERP.colors.purple,
                        fontSize: 11.5, fontWeight: 700,
                      }}>
                        <BookOpen size={11} /> {g.subject_area || "—"}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", color: ERP.colors.textSecondary, fontWeight: 500 }}>
                      {g.teacher || "—"}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        fontWeight: 700, color: ERP.colors.teal,
                      }}>
                        <Users size={13} /> {g.student_count}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                        {g.origin_classes.length === 0 ? (
                          <span style={{ fontSize: 12, color: ERP.colors.textMuted }}>—</span>
                        ) : (
                          g.origin_classes.map((c) => <OriginBadge key={c} name={c} />)
                        )}
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <a
                          href={`/dynamic-group/edit/${g.id}`}
                          title="View Roster"
                          style={{
                            display: "inline-flex", alignItems: "center", gap: 4,
                            padding: "6px 10px", borderRadius: 8,
                            border: `1px solid ${ERP.colors.border}`,
                            background: ERP.colors.surface,
                            color: ERP.colors.accent,
                            fontSize: 12, fontWeight: 600, textDecoration: "none",
                          }}
                        >
                          <ExternalLink size={12} /> 名冊
                        </a>
                        <a
                          href={`/dynamic-group/edit/${g.id}`}
                          title="Edit"
                          style={{
                            display: "inline-flex", alignItems: "center", gap: 4,
                            padding: "6px 10px", borderRadius: 8,
                            border: `1px solid ${ERP.colors.border}`,
                            background: ERP.colors.surface,
                            color: ERP.colors.textSecondary,
                            fontSize: 12, fontWeight: 600, textDecoration: "none",
                          }}
                        >
                          <Pencil size={12} /> 編輯
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Screen_DynamicGroupList;
