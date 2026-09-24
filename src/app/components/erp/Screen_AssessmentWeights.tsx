// ─────────────────────────────────────────────────────────────────────────────
// Screen 1.C.2  測考與權重 / Assessments & Weights
// Layout: Left Tree Table + Right Slide-out Drawer (active edit state)
// Includes: SLA absence handling rule + weight distribution pie
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect } from "react";
import { ERP } from "./erpTokens";
import {
  ChevronDown, ChevronRight, X, Edit2, Plus, AlertCircle,
  Sliders, Info,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface AssessmentRow {
  id: string;
  name: string;
  enName: string;
  weight: number;           // percentage of total
  color: string;
  children?: AssessmentRow[];
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const TERM_OPTIONS    = ["上學期", "下學期", "全年"];
const SUBJECT_OPTIONS = ["數學", "英文", "中文", "物理", "化學"];

const ASSESSMENTS: AssessmentRow[] = [
  {
    id: "daily", name: "日常表現", enName: "Daily Performance", weight: 30,
    color: ERP.colors.amber,
    children: [
      { id:"daily-class", name:"課堂參與", enName:"Class Participation", weight:15, color: ERP.colors.amber },
      { id:"daily-hw",    name:"家課",     enName:"Homework",             weight:15, color: ERP.colors.amber },
    ],
  },
  { id:"project", name:"專題報告", enName:"Project Report",    weight:20, color: ERP.colors.teal   },
  { id:"exam",    name:"期終試",   enName:"Final Examination", weight:50, color: ERP.colors.accent },
];

const SLA_OPTIONS = [
  { value:"scale-up",  label:"比例放大",  enLabel:"Scale up to 100%",  desc:"將其他已完成項目按比例放大至滿分" },
  { value:"deduct",    label:"扣除基數",  enLabel:"Deduct Base",        desc:"按實際得分率扣除缺考基數" },
  { value:"isolate",   label:"獨立處理",  enLabel:"Isolate Assessment", desc:"單獨計算，不影響其他評估項目" },
];

// ─── Custom SVG Donut ─────────────────────────────────────────────────────────
interface DonutSegment { label: string; value: number; color: string; isActive?: boolean }

const DonutChart: React.FC<{ data: DonutSegment[]; size?: number }> = ({ data, size = 120 }) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  const cx = size / 2, cy = size / 2;
  const R = size * 0.42, r = size * 0.26;
  let cumAngle = -Math.PI / 2;

  const paths = data.map(d => {
    const sweep = (d.value / total) * 2 * Math.PI;
    const startA = cumAngle;
    const endA   = cumAngle + sweep;
    cumAngle     = endA;

    const cos0 = Math.cos(startA), sin0 = Math.sin(startA);
    const cos1 = Math.cos(endA),   sin1 = Math.sin(endA);
    const large = sweep > Math.PI ? 1 : 0;

    const offset = d.isActive ? 5 : 0;
    const midA = startA + sweep / 2;
    const ox = Math.cos(midA) * offset, oy = Math.sin(midA) * offset;

    const path = [
      `M ${cx + ox + R * cos0} ${cy + oy + R * sin0}`,
      `A ${R} ${R} 0 ${large} 1 ${cx + ox + R * cos1} ${cy + oy + R * sin1}`,
      `L ${cx + ox + r * cos1} ${cy + oy + r * sin1}`,
      `A ${r} ${r} 0 ${large} 0 ${cx + ox + r * cos0} ${cy + oy + r * sin0}`,
      "Z",
    ].join(" ");

    return { ...d, path };
  });

  // Find active item for center label
  const active = data.find(d => d.isActive);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: "visible" }}>
      {paths.map((p, i) => (
        <path key={i} d={p.path} fill={p.color} stroke="#fff" strokeWidth={p.isActive ? 2 : 1.5} />
      ))}
      {active && (
        <>
          <text x={cx} y={cy - 4} textAnchor="middle" fontSize={14} fontWeight={700} fill={active.color} fontFamily={ERP.font.family}>
            {active.value}%
          </text>
          <text x={cx} y={cy + 10} textAnchor="middle" fontSize={8} fill={ERP.colors.textMuted} fontFamily={ERP.font.family}>
            {active.label}
          </text>
        </>
      )}
    </svg>
  );
};

// ─── Weight Bar ───────────────────────────────────────────────────────────────
const WeightBar: React.FC<{ label: string; enLabel: string; value: number; color: string; isActive?: boolean }> = ({
  label, enLabel, value, color, isActive,
}) => (
  <div style={{ marginBottom: 10 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, display: "inline-block" }} />
        <span style={{ fontSize: 12, fontWeight: isActive ? 700 : 400, color: isActive ? color : ERP.colors.textPrimary }}>
          {label}
        </span>
        <span style={{ fontSize: 10, color: ERP.colors.textMuted }}>{enLabel}</span>
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color, minWidth: 36, textAlign: "right" as const }}>{value}%</span>
    </div>
    <div style={{ background: ERP.colors.pageBg, borderRadius: 6, height: 8, overflow: "hidden", border: `1px solid ${ERP.colors.border}` }}>
      <div style={{
        width: `${value}%`, height: "100%", background: color, borderRadius: 6,
        boxShadow: isActive ? `0 0 6px ${color}60` : "none",
        transition: "width 0.3s",
      }} />
    </div>
  </div>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const FormField: React.FC<{ label: string; sub?: string; children: React.ReactNode }> = ({ label, sub, children }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: ERP.colors.textSecondary, marginBottom: 6, fontFamily: ERP.font.family }}>
      {label}
      {sub && <span style={{ fontSize: 10, fontWeight: 400, color: ERP.colors.textMuted, marginLeft: 6 }}>{sub}</span>}
    </label>
    {children}
  </div>
);

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  padding: "8px 12px", borderRadius: ERP.radius.md,
  border: `1px solid ${ERP.colors.border}`,
  background: ERP.colors.surface, color: ERP.colors.textPrimary,
  fontSize: 13, fontFamily: ERP.font.family, outline: "none",
};

// ─── Tree Row ─────────────────────────────────────────────────────────────────
const TreeRow: React.FC<{
  row: AssessmentRow; depth: number; isSelected: boolean; isExpanded?: boolean;
  hasChildren?: boolean; onSelect: () => void; onToggle?: () => void;
  isLast?: boolean;
}> = ({ row, depth, isSelected, isExpanded, hasChildren, onSelect, onToggle, isLast }) => {
  const F = ERP.font.family;
  return (
    <div
      onClick={onSelect}
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 100px 70px 80px",
        padding: `0 16px 0 ${16 + depth * 20}px`,
        background: isSelected ? "#EFF6FF" : ERP.colors.surface,
        borderLeft: isSelected ? `3px solid ${ERP.colors.accent}` : "3px solid transparent",
        borderBottom: !isLast ? `1px solid ${ERP.colors.divider}` : "none",
        cursor: "pointer", transition: "all 0.1s", fontFamily: F,
      }}
      onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = ERP.colors.surfaceHover; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = isSelected ? "#EFF6FF" : ERP.colors.surface; }}
    >
      {/* Name */}
      <div style={{ padding: "13px 8px 13px 0", display: "flex", alignItems: "center", gap: 7 }}>
        {hasChildren && (
          <button
            onClick={e => { e.stopPropagation(); onToggle?.(); }}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", color: ERP.colors.textMuted, flexShrink: 0 }}
          >
            {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </button>
        )}
        {!hasChildren && depth > 0 && (
          <span style={{ width: 13, display: "inline-block", flexShrink: 0 }} />
        )}
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: row.color, display: "inline-block", flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: depth > 0 ? 12 : 14, fontWeight: isSelected ? 700 : depth > 0 ? 400 : 500, color: isSelected ? ERP.colors.accent : ERP.colors.textPrimary }}>
            {row.name}
          </div>
          <div style={{ fontSize: 10, color: ERP.colors.textMuted, marginTop: 1 }}>{row.enName}</div>
        </div>
      </div>
      {/* Weight */}
      <div style={{ padding: "13px 8px 13px 0", alignSelf: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ flex: 1, background: ERP.colors.pageBg, borderRadius: 3, height: 5, overflow: "hidden", minWidth: 40 }}>
            <div style={{ width: `${row.weight}%`, height: "100%", background: row.color, borderRadius: 3 }} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: row.color, minWidth: 30 }}>{row.weight}%</span>
        </div>
      </div>
      {/* SLA indicator */}
      <div style={{ padding: "13px 8px 13px 0", alignSelf: "center" }}>
        {row.id === "exam" && (
          <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: ERP.radius.xs, background: ERP.colors.accentPale, color: ERP.colors.accent, border: `1px solid ${ERP.colors.accentLight}`, fontWeight: 600 }}>
            比例放大
          </span>
        )}
      </div>
      {/* Action */}
      <div style={{ padding: "13px 0 13px 0", alignSelf: "center", display: "flex", gap: 4 }}>
        <button
          onClick={e => { e.stopPropagation(); onSelect(); }}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: ERP.colors.accent, display: "flex", borderRadius: ERP.radius.sm }}
        >
          <Edit2 size={13} />
        </button>
        <button
          onClick={e => { e.stopPropagation(); }}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: ERP.colors.textMuted, display: "flex", borderRadius: ERP.radius.sm }}
        >
          <Plus size={13} />
        </button>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
interface Props { lang?: "en" | "zh-HK" }

export const Screen_AssessmentWeights: React.FC<Props> = ({ lang = "zh-HK" }) => {
  const [selectedId,  setSelectedId]  = useState<string | null>("exam");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(["daily"]));
  const [filterTerm,  setFilterTerm]  = useState("上學期");
  const [filterSubj,  setFilterSubj]  = useState("數學");
  const [isMobile,    setIsMobile]    = useState(false);

  // Drawer form state for "exam"
  const [formName,   setFormName]   = useState("期終試");
  const [formWeight, setFormWeight] = useState(50);
  const [formSLA,    setFormSLA]    = useState("scale-up");

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 900);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const drawerOpen = selectedId !== null;
  const DRAWER_W   = isMobile ? window.innerWidth : 440;
  const F = ERP.font.family;

  const toggleExpand = (id: string) =>
    setExpandedIds(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  // Flatten rows for render (respecting expansion)
  const flatRows: { row: AssessmentRow; depth: number; parentId?: string }[] = [];
  ASSESSMENTS.forEach(a => {
    flatRows.push({ row: a, depth: 0 });
    if (a.children && expandedIds.has(a.id)) {
      a.children.forEach(child => flatRows.push({ row: child, depth: 1, parentId: a.id }));
    }
  });

  const totalWeight = ASSESSMENTS.reduce((s, a) => s + a.weight, 0);

  const donutData = ASSESSMENTS.map(a => ({
    label: a.name, value: a.weight, color: a.color, isActive: a.id === selectedId,
  }));

  const selectedSLA = SLA_OPTIONS.find(s => s.value === formSLA)!;

  return (
    <div style={{
      display: "flex", height: "100%", overflow: "hidden",
      background: ERP.colors.pageBg, fontFamily: F,
      flexDirection: isMobile ? "column" : "row",
    }}>

      {/* ── LEFT PANEL ──────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

        {/* Page header */}
        <div style={{ padding: "20px 24px 14px", flexShrink: 0, borderBottom: `1px solid ${ERP.colors.border}`, background: ERP.colors.surface }}>
          <div style={{ marginBottom: 14 }}>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: ERP.colors.textPrimary, letterSpacing: "-0.3px" }}>
              測考與權重
            </h1>
            <p style={{ margin: "3px 0 0", fontSize: 12, color: ERP.colors.textMuted }}>
              Assessments & Weights · 評估分佈設定
            </p>
          </div>

          {/* Filters */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" as const, alignItems: "center" }}>
            <div style={{ position: "relative" }}>
              <select value={filterTerm} onChange={e => setFilterTerm(e.target.value)} style={{
                padding: "7px 30px 7px 11px", borderRadius: ERP.radius.md,
                border: `1px solid ${ERP.colors.border}`, background: ERP.colors.pageBg,
                fontSize: 12, fontFamily: F, color: ERP.colors.textPrimary, outline: "none",
                appearance: "none" as const, cursor: "pointer",
              }}>
                {TERM_OPTIONS.map(t => <option key={t} value={t}>學期：{t}</option>)}
              </select>
              <ChevronDown size={12} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: ERP.colors.textMuted }} />
            </div>
            <div style={{ position: "relative" }}>
              <select value={filterSubj} onChange={e => setFilterSubj(e.target.value)} style={{
                padding: "7px 30px 7px 11px", borderRadius: ERP.radius.md,
                border: `1px solid ${ERP.colors.border}`, background: ERP.colors.pageBg,
                fontSize: 12, fontFamily: F, color: ERP.colors.textPrimary, outline: "none",
                appearance: "none" as const, cursor: "pointer",
              }}>
                {SUBJECT_OPTIONS.map(s => <option key={s} value={s}>科目：{s}</option>)}
              </select>
              <ChevronDown size={12} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: ERP.colors.textMuted }} />
            </div>

            {/* Total weight pill */}
            <div style={{
              display: "flex", alignItems: "center", gap: 5, marginLeft: "auto",
              padding: "5px 12px", borderRadius: ERP.radius.full,
              background: totalWeight === 100 ? "#D1FAE5" : "#FEE2E2",
              border: `1px solid ${totalWeight === 100 ? "#6EE7B7" : "#FECACA"}`,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: totalWeight === 100 ? ERP.colors.success : ERP.colors.red, display: "inline-block" }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: totalWeight === 100 ? "#065F46" : "#991B1B" }}>
                總計 {totalWeight}% {totalWeight === 100 ? "✓ 權重正確" : "⚠ 未達 100%"}
              </span>
            </div>
          </div>
        </div>

        {/* Tree Table */}
        <div style={{ flex: 1, overflow: "auto", padding: "16px 24px 24px" }}>
          <div style={{ background: ERP.colors.surface, borderRadius: ERP.radius.lg, border: `1px solid ${ERP.colors.border}`, overflow: "hidden", boxShadow: ERP.shadow.xs }}>

            {/* Table header */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 100px 70px 80px",
              background: ERP.colors.pageBg, borderBottom: `1px solid ${ERP.colors.border}`,
              padding: "0 16px",
            }}>
              {[
                { label: "評估類別", sub: "Assessment Category" },
                { label: "權重",     sub: "Weight" },
                { label: "SLA 規則", sub: "Rule" },
                { label: "操作",     sub: "Action" },
              ].map((h, i) => (
                <div key={i} style={{ padding: "11px 8px 11px 0" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: ERP.colors.textMuted, letterSpacing: "0.5px", textTransform: "uppercase" as const }}>{h.label}</div>
                  <div style={{ fontSize: 9, color: ERP.colors.textMuted, marginTop: 1 }}>{h.sub}</div>
                </div>
              ))}
            </div>

            {/* Tree rows */}
            {flatRows.map(({ row, depth }, idx) => {
              const hasChildren = !!(row.children && row.children.length > 0);
              const isExpanded  = expandedIds.has(row.id);
              const isLast      = idx === flatRows.length - 1;
              return (
                <TreeRow
                  key={row.id}
                  row={row}
                  depth={depth}
                  isSelected={selectedId === row.id}
                  isExpanded={isExpanded}
                  hasChildren={hasChildren}
                  isLast={isLast}
                  onSelect={() => setSelectedId(row.id === selectedId ? null : row.id)}
                  onToggle={() => toggleExpand(row.id)}
                />
              );
            })}

            {/* Total row */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 100px 70px 80px",
              padding: "0 16px", borderTop: `2px solid ${ERP.colors.border}`,
              background: ERP.colors.pageBg,
            }}>
              <div style={{ padding: "11px 8px 11px 0", fontSize: 13, fontWeight: 700, color: ERP.colors.textPrimary }}>
                總計 Total
              </div>
              <div style={{ padding: "11px 8px 11px 0", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: totalWeight === 100 ? ERP.colors.success : ERP.colors.red }}>
                  {totalWeight}%
                </span>
                {totalWeight === 100 && <span style={{ fontSize: 10, color: ERP.colors.success }}>✓</span>}
              </div>
              <div style={{ padding: "11px 8px 11px 0" }} />
              <div style={{ padding: "11px 8px 11px 0" }} />
            </div>
          </div>

          {/* Info hint */}
          <div style={{ marginTop: 12, display: "flex", alignItems: "flex-start", gap: 7, padding: "10px 14px", background: ERP.colors.accentPale, borderRadius: ERP.radius.md, border: `1px solid ${ERP.colors.accentLight}` }}>
            <Info size={13} color={ERP.colors.accent} style={{ marginTop: 1, flexShrink: 0 }} />
            <p style={{ margin: 0, fontSize: 11, color: ERP.colors.accent, lineHeight: 1.5 }}>
              點擊行列以在右側面板編輯規則。缺席／免修規則 (SLA) 控制學生缺考時的計分處理方式。
            </p>
          </div>
        </div>
      </div>

      {/* ── RIGHT DRAWER ────────────────────────────────────────────────── */}
      <div style={{
        width: drawerOpen ? DRAWER_W : 0,
        transition: "width 0.22s cubic-bezier(0.4,0,0.2,1)",
        overflow: "hidden", flexShrink: 0,
        borderLeft: drawerOpen ? `1px solid ${ERP.colors.border}` : "none",
        boxShadow: drawerOpen ? "-4px 0 16px rgba(0,0,0,0.06)" : "none",
      }}>
        <div style={{ width: DRAWER_W, height: "100%", display: "flex", flexDirection: "column", background: ERP.colors.surface }}>

          {/* Drawer header */}
          <div style={{
            padding: "16px 20px", borderBottom: `1px solid ${ERP.colors.border}`,
            display: "flex", alignItems: "flex-start", justifyContent: "space-between",
            flexShrink: 0,
          }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: ERP.radius.sm, background: ERP.colors.accentPale, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Sliders size={14} color={ERP.colors.accent} />
                </div>
                <span style={{ fontSize: 15, fontWeight: 700, color: ERP.colors.textPrimary }}>編輯權重規則</span>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: ERP.radius.xs,
                  background: ASSESSMENTS.find(a => a.id === selectedId)?.color + "20" || ERP.colors.accentPale,
                  color: ASSESSMENTS.find(a => a.id === selectedId)?.color || ERP.colors.accent,
                }}>
                  {ASSESSMENTS.find(a => a.id === selectedId)?.name ?? selectedId}
                </span>
              </div>
              <div style={{ fontSize: 11, color: ERP.colors.textMuted, marginTop: 3, marginLeft: 36 }}>
                Edit Assessment Rule · {filterSubj} · {filterTerm}
              </div>
            </div>
            <button
              onClick={() => setSelectedId(null)}
              style={{ background: "none", border: `1px solid ${ERP.colors.border}`, cursor: "pointer", padding: 5, borderRadius: ERP.radius.sm, color: ERP.colors.textMuted, display: "flex", flexShrink: 0 }}
            >
              <X size={15} />
            </button>
          </div>

          {/* Form body */}
          <div style={{ flex: 1, overflow: "auto", padding: "20px 20px 0" }}>

            {/* Assessment name */}
            <FormField label="評估項目名稱" sub="Assessment Name">
              <input value={formName} onChange={e => setFormName(e.target.value)} style={inputStyle} />
            </FormField>

            {/* Weight input */}
            <FormField label="學術總分權重 %" sub="Academic Score Weight">
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <input
                  type="number" min={0} max={100} value={formWeight}
                  onChange={e => setFormWeight(Math.min(100, Math.max(0, Number(e.target.value))))}
                  style={{ ...inputStyle, width: 80, textAlign: "center" as const, fontSize: 18, fontWeight: 700, color: ERP.colors.accent }}
                />
                <span style={{ fontSize: 16, fontWeight: 700, color: ERP.colors.textMuted }}>%</span>
              </div>
              {/* Progress bar */}
              <div style={{ background: ERP.colors.pageBg, borderRadius: 8, height: 10, overflow: "hidden", border: `1px solid ${ERP.colors.border}` }}>
                <div style={{
                  width: `${formWeight}%`, height: "100%",
                  background: `linear-gradient(90deg, ${ERP.colors.accent}, ${ERP.colors.accentDark})`,
                  borderRadius: 8, transition: "width 0.3s",
                }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                <span style={{ fontSize: 10, color: ERP.colors.textMuted }}>0%</span>
                <span style={{ fontSize: 10, color: ERP.colors.accent, fontWeight: 600 }}>{formWeight}% 已設定</span>
                <span style={{ fontSize: 10, color: ERP.colors.textMuted }}>100%</span>
              </div>
            </FormField>

            {/* SLA Dropdown */}
            <FormField label="缺席／免修處理規則" sub="Absence/Exempt SLA Handling">
              <div style={{ position: "relative" }}>
                <select
                  value={formSLA}
                  onChange={e => setFormSLA(e.target.value)}
                  style={{ ...inputStyle, paddingRight: 32, appearance: "none" as const, cursor: "pointer" }}
                >
                  {SLA_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label} — {opt.enLabel}</option>
                  ))}
                </select>
                <ChevronDown size={13} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: ERP.colors.textMuted }} />
              </div>
              {/* SLA description */}
              <div style={{ marginTop: 8, padding: "8px 12px", background: ERP.colors.accentPale, borderRadius: ERP.radius.md, border: `1px solid ${ERP.colors.accentLight}`, display: "flex", gap: 7, alignItems: "flex-start" }}>
                <AlertCircle size={12} color={ERP.colors.accent} style={{ marginTop: 1, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: ERP.colors.accent }}>{selectedSLA.label} · {selectedSLA.enLabel}</div>
                  <div style={{ fontSize: 11, color: ERP.colors.textSecondary, marginTop: 2, lineHeight: 1.4 }}>{selectedSLA.desc}</div>
                </div>
              </div>
            </FormField>

            {/* Divider */}
            <div style={{ borderTop: `1px solid ${ERP.colors.border}`, margin: "20px 0 16px", position: "relative" }}>
              <span style={{ position: "absolute", top: -9, left: 0, background: ERP.colors.surface, paddingRight: 10, fontSize: 11, fontWeight: 700, color: ERP.colors.textMuted, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>
                權重分佈 · Weight Distribution
              </span>
            </div>

            {/* Visual weight helper */}
            <div style={{ display: "flex", gap: 20, alignItems: "flex-start", marginBottom: 20 }}>
              {/* Donut chart */}
              <div style={{ flexShrink: 0 }}>
                <DonutChart data={donutData} size={110} />
              </div>
              {/* Bars legend */}
              <div style={{ flex: 1, paddingTop: 6 }}>
                {ASSESSMENTS.map(a => (
                  <WeightBar
                    key={a.id}
                    label={a.name} enLabel={a.enName}
                    value={a.id === "exam" ? formWeight : a.weight}
                    color={a.color}
                    isActive={a.id === selectedId}
                  />
                ))}
                <div style={{
                  marginTop: 8, paddingTop: 8, borderTop: `1px solid ${ERP.colors.border}`,
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: ERP.colors.textSecondary }}>總計 Total</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: totalWeight === 100 ? ERP.colors.success : ERP.colors.red }}>
                    {totalWeight}% {totalWeight === 100 ? "✓" : "≠ 100"}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Drawer footer */}
          <div style={{
            padding: "14px 20px", borderTop: `1px solid ${ERP.colors.border}`,
            display: "flex", gap: 10, justifyContent: "flex-end",
            background: ERP.colors.surface, flexShrink: 0,
          }}>
            <button
              onClick={() => setSelectedId(null)}
              style={{
                padding: "8px 18px", borderRadius: ERP.radius.md,
                border: `1px solid ${ERP.colors.border}`, background: "transparent",
                color: ERP.colors.textSecondary, fontSize: 13, fontFamily: F, cursor: "pointer",
              }}
            >
              取消 Cancel
            </button>
            <button style={{
              padding: "8px 20px", borderRadius: ERP.radius.md, border: "none",
              background: ERP.colors.accent, color: "#fff",
              fontSize: 13, fontWeight: 700, fontFamily: F, cursor: "pointer",
              boxShadow: `0 2px 8px ${ERP.colors.accent}40`,
            }}>
              更新規則 Update Rule
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
