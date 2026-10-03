// ─────────────────────────────────────────────────────────────────────────────
// Screen 1.B.2 — 批量加入學生 / Batch Add Students
// Global Tools: bulk class apply + auto-generate sequential Student IDs
// ─────────────────────────────────────────────────────────────────────────────
import React, { useRef, useState } from "react";
import { ArrowLeft, Plus, Trash2, UserPlus, Save, Zap, Hash } from "lucide-react";
import { ERP } from "./erpTokens";

export type ClassCatalogItem = {
  id: number;
  name: string;
  form: string;
  classCode: string;
};

type Row = {
  key: string;
  student_id: string;
  name_en: string;
  name_zh_hk: string;
  class_id: string;
};

const emptyRow = (): Row => ({
  key: `r-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  student_id: "",
  name_en: "",
  name_zh_hk: "",
  class_id: "",
});

interface Props {
  classCatalog?: ClassCatalogItem[];
  academicYear?: string;
  storeUrl?: string;
  cancelUrl?: string;
  flashError?: string;
  /** Next numeric ID (without S prefix); increments after Auto-generate */
  nextIdStart?: number;
}

export const Screen_StudentBatchCreate: React.FC<Props> = ({
  classCatalog = [],
  academicYear = "2025/26",
  storeUrl = "/students/store",
  cancelUrl = "/students",
  flashError,
  nextIdStart = 100000,
}) => {
  const [rows, setRows] = useState<Row[]>([emptyRow(), emptyRow(), emptyRow()]);
  const [globalClassId, setGlobalClassId] = useState("");
  const [toolHint, setToolHint] = useState<string | null>(null);
  // Mutable counter — survives re-renders; new rows stay blank until next Auto-ID click
  const currentNextId = useRef(nextIdStart);
  const F = ERP.font.family;

  const addRow = () => setRows(prev => [...prev, emptyRow()]);
  const removeRow = (key: string) => {
    setRows(prev => (prev.length <= 1 ? prev : prev.filter(r => r.key !== key)));
  };
  const update = (key: string, field: keyof Row, value: string) => {
    setRows(prev => prev.map(r => (r.key === key ? { ...r, [field]: value } : r)));
  };

  const applyClassToAll = () => {
    if (!globalClassId) {
      setToolHint("請先選擇要套用的班別。");
      return;
    }
    setRows(prev => prev.map(r => ({ ...r, class_id: globalClassId })));
    const label = classCatalog.find(c => String(c.id) === globalClassId);
    setToolHint(`已套用班別 ${(label?.classCode || label?.name || globalClassId)} 至全部 ${rows.length} 列。`);
  };

  const autoGenerateIds = () => {
    let n = currentNextId.current;
    setRows(prev => prev.map(r => {
      const id = "S" + String(n).padStart(6, "0");
      n += 1;
      return { ...r, student_id: id };
    }));
    currentNextId.current = n;
    setToolHint(`已自動生成 ${rows.length} 個學號（下一個可用：S${String(n).padStart(6, "0")}）。`);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "9px 11px",
    borderRadius: 8,
    border: `1px solid ${ERP.colors.border}`,
    background: ERP.colors.surface,
    fontSize: 13,
    fontFamily: F,
    color: ERP.colors.textPrimary,
    outline: "none",
    boxSizing: "border-box",
  };

  const toolBtn: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "8px 14px",
    borderRadius: 8,
    border: "none",
    fontSize: 12.5,
    fontWeight: 700,
    fontFamily: F,
    cursor: "pointer",
    whiteSpace: "nowrap",
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
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <a
            href={cancelUrl}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              fontSize: 12.5, color: ERP.colors.textSecondary, textDecoration: "none",
              marginBottom: 8, fontWeight: 500,
            }}
          >
            <ArrowLeft size={14} /> 返回名冊
          </a>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: ERP.colors.textPrimary, letterSpacing: "-0.3px" }}>
            <UserPlus size={20} style={{ verticalAlign: -3, marginRight: 8 }} />
            批量加入學生
          </h1>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: ERP.colors.textSecondary }}>
            AY {academicYear} · 下一個可用學號起點 S{String(currentNextId.current).padStart(6, "0")}
          </p>
        </div>
      </div>

      {flashError && (
        <div style={{
          padding: "12px 16px", borderRadius: 10,
          background: ERP.colors.redLight, border: `1px solid ${ERP.colors.red}40`,
          color: ERP.colors.red, fontSize: 13, fontWeight: 600,
        }}>
          {flashError}
        </div>
      )}

      <form method="post" action={storeUrl} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <input type="hidden" name="academic_year" value={academicYear} />

        {/* ── Global Tools toolbar ── */}
        <div style={{
          background: "linear-gradient(135deg, #EFF6FF 0%, #F8FAFC 100%)",
          border: `1.5px solid ${ERP.colors.accent}55`,
          borderRadius: 12,
          padding: "14px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          boxShadow: `0 0 0 3px ${ERP.colors.accent}12`,
        }}>
          <div style={{
            fontSize: 11, fontWeight: 800, color: ERP.colors.accent,
            letterSpacing: "0.06em", textTransform: "uppercase",
          }}>
            Global Tools · 全域操作
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
            {/* Tool 1: Bulk Class */}
            <select
              value={globalClassId}
              onChange={e => setGlobalClassId(e.target.value)}
              aria-label="Global class"
              style={{ ...inputStyle, width: 200, cursor: "pointer", background: "#fff" }}
            >
              <option value="">— 選擇班別 —</option>
              {classCatalog.map(c => (
                <option key={c.id} value={c.id}>
                  {c.classCode || c.name} ({c.form})
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={applyClassToAll}
              style={{
                ...toolBtn,
                background: ERP.colors.accent,
                color: "#fff",
                boxShadow: `0 1px 4px ${ERP.colors.accent}40`,
              }}
            >
              <Zap size={14} /> Apply Class to All (一鍵套用班別)
            </button>

            <div style={{ width: 1, height: 28, background: ERP.colors.border, margin: "0 4px" }} />

            {/* Tool 2: Auto-ID */}
            <button
              type="button"
              onClick={autoGenerateIds}
              style={{
                ...toolBtn,
                background: "#0F172A",
                color: "#fff",
              }}
            >
              <Hash size={14} /> Auto-generate IDs (自動生成學號)
            </button>
          </div>

          {toolHint && (
            <div style={{ fontSize: 12, color: ERP.colors.textSecondary, fontWeight: 500 }}>
              {toolHint}
            </div>
          )}
        </div>

        <div style={{
          background: ERP.colors.surface,
          border: `1px solid ${ERP.colors.border}`,
          borderRadius: 14,
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
        }}>
          {/* Column headers */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "40px 1.1fr 1.4fr 1.2fr 1.3fr 48px",
            gap: 10,
            padding: "12px 16px",
            background: ERP.colors.surfaceHover,
            borderBottom: `1px solid ${ERP.colors.border}`,
            fontSize: 11,
            fontWeight: 700,
            color: ERP.colors.textMuted,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}>
            <div>#</div>
            <div>學號 Student ID</div>
            <div>英文姓名 name_en</div>
            <div>中文姓名 name_zh_hk</div>
            <div>班別 Class</div>
            <div />
          </div>

          {rows.map((row, i) => (
            <div
              key={row.key}
              style={{
                display: "grid",
                gridTemplateColumns: "40px 1.1fr 1.4fr 1.2fr 1.3fr 48px",
                gap: 10,
                padding: "10px 16px",
                alignItems: "center",
                borderBottom: i === rows.length - 1 ? "none" : `1px solid ${ERP.colors.border}`,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: ERP.colors.textMuted }}>{i + 1}</div>

              <input
                name={`students[${i}][student_id]`}
                value={row.student_id}
                onChange={e => update(row.key, "student_id", e.target.value)}
                placeholder="S00001"
                required={i === 0}
                style={inputStyle}
                autoComplete="off"
              />
              <input
                name={`students[${i}][name_en]`}
                value={row.name_en}
                onChange={e => update(row.key, "name_en", e.target.value)}
                placeholder="Chan Tai Man"
                required={i === 0}
                style={inputStyle}
                autoComplete="off"
              />
              <input
                name={`students[${i}][name_zh_hk]`}
                value={row.name_zh_hk}
                onChange={e => update(row.key, "name_zh_hk", e.target.value)}
                placeholder="陳大文"
                style={inputStyle}
                autoComplete="off"
              />
              <select
                name={`students[${i}][class_id]`}
                value={row.class_id}
                onChange={e => update(row.key, "class_id", e.target.value)}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                <option value="">— 選擇班別 —</option>
                {classCatalog.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.classCode || c.name} ({c.form})
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => removeRow(row.key)}
                title="移除列"
                disabled={rows.length <= 1}
                style={{
                  width: 36, height: 36, borderRadius: 8,
                  border: `1px solid ${ERP.colors.border}`,
                  background: rows.length <= 1 ? ERP.colors.surfaceHover : ERP.colors.surface,
                  color: rows.length <= 1 ? ERP.colors.textMuted : ERP.colors.red,
                  cursor: rows.length <= 1 ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={addRow}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "10px 16px", borderRadius: 9,
              border: `1.5px dashed ${ERP.colors.accent}`,
              background: ERP.colors.accentPale,
              color: ERP.colors.accent,
              fontSize: 13, fontWeight: 700, fontFamily: F,
              cursor: "pointer",
            }}
          >
            <Plus size={15} /> 新增一列 Add Another Row
          </button>

          <div style={{ display: "flex", gap: 10 }}>
            <a
              href={cancelUrl}
              style={{
                display: "inline-flex", alignItems: "center",
                padding: "10px 18px", borderRadius: 9,
                border: `1px solid ${ERP.colors.border}`,
                background: ERP.colors.surface,
                color: ERP.colors.textSecondary,
                fontSize: 13, fontWeight: 600, textDecoration: "none", fontFamily: F,
              }}
            >
              取消
            </a>
            <button
              type="submit"
              style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                padding: "10px 20px", borderRadius: 9,
                border: "none",
                background: ERP.colors.accent,
                color: "#fff",
                fontSize: 13, fontWeight: 700, fontFamily: F,
                cursor: "pointer",
                boxShadow: `0 2px 8px ${ERP.colors.accent}44`,
              }}
            >
              <Save size={15} /> 儲存全部 ({rows.length})
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Screen_StudentBatchCreate;
