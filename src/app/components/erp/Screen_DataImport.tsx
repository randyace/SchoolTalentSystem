// ─────────────────────────────────────────────────────────────────────────────
// Screen: 數據遷移與匯入引擎 — Data Migration & Import Engine
// Frame: 系統管理 > 數據匯入 (1.F.1)
// State: Step 1 — Upload & Field Mapping
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useRef, useEffect } from "react";
import { ERP } from "./erpTokens";
import {
  Upload, FileText, CheckCircle2, AlertTriangle,
  XCircle, ChevronDown, RefreshCw, ArrowRight,
  User, BarChart2, Users, Award, Database,
  Cpu, Shield, CircleDot, Check,
  UploadCloud, Trash2, Zap,
} from "lucide-react";

// ── Tokens ────────────────────────────────────────────────────────────────────
const F    = ERP.font.family;
const MONO = ERP.font.mono;
const C    = ERP.colors;
const R    = ERP.radius;

// ── Types ─────────────────────────────────────────────────────────────────────
type MappingStatus = "auto" | "sensitive" | "unmapped";
type Module = "students" | "scores" | "classes" | "activities";

interface MappingRow {
  id:          string;
  csvHeader:   string;
  sampleData:  string;
  targetField: string;
  targetLabel: string;
  status:      MappingStatus;
  sensitive?:  boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const STEP_LABELS = [
  { num: 1, zh: "上傳與欄位映射",   en: "Upload & Map"        },
  { num: 2, zh: "數據校驗與脫敏",   en: "Validate & Tokenize" },
  { num: 3, zh: "寫入資料庫",       en: "Execute Import"      },
];

const MODULES: { id: Module; icon: React.ReactNode; zh: string; en: string; count: number }[] = [
  { id: "students",   icon: <User size={16} />,      zh: "學生檔案",   en: "Student Profiles",  count: 850 },
  { id: "scores",     icon: <BarChart2 size={16} />, zh: "測考成績",   en: "Assessment Scores", count: 0   },
  { id: "classes",    icon: <Users size={16} />,     zh: "班級與分組", en: "Classes & Groups",  count: 0   },
  { id: "activities", icon: <Award size={16} />,     zh: "活動與成就", en: "Activities & Awards", count: 0 },
];

const TARGET_FIELD_OPTIONS = [
  { value: "student_id",      label: "學號 (student_id)"              },
  { value: "name_zh",         label: "中文姓名 (name_zh)"              },
  { value: "name_en",         label: "英文姓名 (name_en)"              },
  { value: "admin_class",     label: "原行政班 (admin_class)"          },
  { value: "gender",          label: "性別 (gender)"                   },
  { value: "dob",             label: "出生日期 (date_of_birth)"        },
  { value: "sen_status",      label: "特殊教育需要 (sen_status)"        },
  { value: "emergency_phone", label: "緊急聯絡電話 (emergency_phone)"  },
  { value: "address",         label: "地址 (address)"                  },
  { value: "email",           label: "電郵 (email)"                    },
  { value: "year_enrolled",   label: "入學年份 (year_enrolled)"        },
];

const INITIAL_ROWS: MappingRow[] = [
  { id: "r1", csvHeader: "StudentID",     sampleData: "2024001",  targetField: "student_id",  targetLabel: "學號 (student_id)",             status: "auto"                  },
  { id: "r2", csvHeader: "ChineseName",   sampleData: "陳大文",    targetField: "name_zh",     targetLabel: "中文姓名 (name_zh)",             status: "auto"                  },
  { id: "r3", csvHeader: "CurrentClass",  sampleData: "1A",       targetField: "admin_class", targetLabel: "原行政班 (admin_class)",          status: "auto"                  },
  { id: "r4", csvHeader: "SEN_Record",    sampleData: "ADHD",     targetField: "sen_status",  targetLabel: "特殊教育需要 (sen_status)",       status: "sensitive", sensitive: true },
  { id: "r5", csvHeader: "EmergencyCont", sampleData: "98765432", targetField: "",            targetLabel: "選擇目標欄位... Select Field",    status: "unmapped"              },
];

// ── Status configs ─────────────────────────────────────────────────────────────
const STATUS_CFG: Record<MappingStatus, {
  bg: string; border: string; color: string;
  label: string; enLabel: string;
  icon: React.ReactNode;
}> = {
  auto: {
    bg: "#F0FDF4", border: "#BBF7D0", color: "#15803D",
    label: "自動對應",   enLabel: "Auto-mapped",
    icon: <CheckCircle2 size={12} />,
  },
  sensitive: {
    bg: "#FFFBEB", border: "#FDE68A", color: "#92400E",
    label: "需脫敏處理", enLabel: "Requires Tokenization",
    icon: <AlertTriangle size={12} />,
  },
  unmapped: {
    bg: "#FFF5F5", border: "#FECACA", color: "#991B1B",
    label: "待處理",     enLabel: "Unmapped",
    icon: <XCircle size={12} />,
  },
};

// ── SectionCard ───────────────────────────────────────────────────────────────
const SectionCard: React.FC<{
  icon:      React.ReactNode;
  zh:        string;
  en:        string;
  step:      string;
  mb:        number;
  children:  React.ReactNode;
  badge?:    React.ReactNode;
}> = ({ icon, zh, en, step, mb, children, badge }) => (
  <div style={{
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: R.xl,
    overflow: "visible",
    boxShadow: ERP.shadow.xs,
    marginBottom: mb,
  }}>
    <div style={{
      padding: "11px 16px",
      borderBottom: `1px solid ${C.border}`,
      display: "flex", alignItems: "center", gap: 8,
      flexWrap: "wrap" as const,
      background: C.pageBg,
      borderRadius: `${R.xl} ${R.xl} 0 0`,
    }}>
      <span style={{
        fontFamily: MONO, fontSize: 10, fontWeight: 800,
        color: C.accent, padding: "2px 6px",
        background: C.accentPale, border: `1px solid ${C.accentLight}`,
        borderRadius: R.xs,
      }}>
        {step}
      </span>
      {icon}
      <span style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary, fontFamily: F }}>{zh}</span>
      <span style={{ fontSize: 11, color: C.textMuted, fontFamily: F }}>· {en}</span>
      {badge && <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" as const }}>{badge}</div>}
    </div>
    <div style={{ padding: "16px 20px" }}>{children}</div>
  </div>
);

// ── Stepper ───────────────────────────────────────────────────────────────────
const Stepper: React.FC<{ currentStep: number; isMobile?: boolean }> = ({ currentStep, isMobile }) => {
  if (isMobile) {
    const activeStep = STEP_LABELS.find(s => s.num === currentStep)!;
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ display: "flex", gap: 4 }}>
          {STEP_LABELS.map(s => (
            <div key={s.num} style={{ width: s.num === currentStep ? 20 : 8, height: 4, borderRadius: 2, background: s.num < currentStep ? "#22C55E" : s.num === currentStep ? C.accent : C.border, transition: "all 0.2s" }} />
          ))}
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.accent, fontFamily: F }}>Step {activeStep.num}: {activeStep.en}</span>
        <span style={{ fontSize: 11, color: C.textMuted, fontFamily: F, marginLeft: "auto" }}>{currentStep}/{STEP_LABELS.length}</span>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {STEP_LABELS.map((step, i) => {
        const active  = step.num === currentStep;
        const done    = step.num < currentStep;
        return (
          <React.Fragment key={step.num}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 16px", background: active ? C.accent : done ? "#F0FDF4" : C.pageBg, borderRadius: R.lg, border: `1px solid ${active ? C.accentDark : done ? "#BBF7D0" : C.border}`, transition: "all 0.2s" }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, background: active ? "rgba(255,255,255,0.25)" : done ? "#22C55E" : C.border, border: `2px solid ${active ? "rgba(255,255,255,0.5)" : done ? "#16A34A" : C.borderStrong}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {done ? <CheckCircle2 size={12} color="#fff" /> : <span style={{ fontSize: 10, fontWeight: 800, fontFamily: MONO, color: active ? "#fff" : C.textMuted, lineHeight: 1 }}>{step.num}</span>}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, fontFamily: F, color: active ? "#fff" : done ? "#15803D" : C.textMuted, lineHeight: 1 }}>Step {step.num}：{step.zh}</div>
                <div style={{ fontSize: 9.5, fontFamily: F, marginTop: 2, color: active ? "rgba(255,255,255,0.75)" : done ? "#4ADE80" : C.textDisabled, lineHeight: 1 }}>{step.en}</div>
              </div>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div style={{ flex: "0 0 28px", height: 1, background: done ? "#BBF7D0" : C.border, margin: "0 2px" }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ── ModuleCard ─────────────────────────────────────────────────────────────────
const ModuleCard: React.FC<{
  mod:     typeof MODULES[0];
  active:  boolean;
  onClick: () => void;
}> = ({ mod, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      flex: 1, minWidth: 140,
      padding: "12px 14px",
      border: `1.5px solid ${active ? C.accent : C.border}`,
      borderRadius: R.lg,
      background: active ? C.accentPale : C.surface,
      cursor: "pointer",
      display: "flex", alignItems: "center", gap: 9,
      textAlign: "left" as const,
      transition: "all 0.15s",
      boxShadow: active ? `0 0 0 3px ${C.accentLight}` : "none",
    }}
    onMouseEnter={e => { if (!active) e.currentTarget.style.background = C.surfaceHover; }}
    onMouseLeave={e => { if (!active) e.currentTarget.style.background = active ? C.accentPale : C.surface; }}
  >
    <div style={{
      width: 32, height: 32, borderRadius: R.md, flexShrink: 0,
      background: active ? C.accent : C.pageBg,
      border: `1px solid ${active ? C.accentDark : C.border}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      color: active ? "#fff" : C.textMuted,
      transition: "all 0.15s",
    }}>
      {mod.icon}
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, fontFamily: F, color: active ? C.accent : C.textPrimary, lineHeight: 1 }}>
        {mod.zh}
      </div>
      <div style={{ fontSize: 10, color: active ? C.accentMid : C.textMuted, fontFamily: F, marginTop: 3, display: "flex", alignItems: "center", gap: 5 }}>
        {mod.en}
        {mod.count > 0 && (
          <span style={{
            padding: "1px 6px", borderRadius: R.full,
            background: active ? C.accentLight : C.pageBg,
            border: `1px solid ${active ? C.accent : C.border}`,
            fontSize: 9.5, fontWeight: 700,
            color: active ? C.accent : C.textMuted,
          }}>
            {mod.count.toLocaleString()} 筆
          </span>
        )}
      </div>
    </div>
    {active && <CheckCircle2 size={14} color={C.accent} style={{ flexShrink: 0 }} />}
  </button>
);

// ── MappingTableRow ────────────────────────────────────────────────────────────
const MappingTableRow: React.FC<{
  row:      MappingRow;
  index:    number;
  onChange: (id: string, field: string, label: string) => void;
  isLast:   boolean;
  isMobile?: boolean;
}> = ({ row, index, onChange, isLast, isMobile }) => {
  const [open, setOpen] = useState(false);
  const cfg = STATUS_CFG[row.status];

  if (isMobile) {
    return (
      <div style={{ padding: "12px 14px", borderBottom: isLast ? "none" : `1px solid ${C.divider}`, background: row.status === "sensitive" ? "#FFFBEB" : row.status === "unmapped" ? "#FFF5F5" : C.surface }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: C.textPrimary, background: "#F8FAFC", border: `1px solid ${C.border}`, borderRadius: R.sm, padding: "3px 8px" }}>{row.csvHeader}</span>
            {row.sensitive && <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 6px", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: R.xs, fontSize: 9, fontWeight: 700, color: "#92400E" }}><Shield size={8} />敏感</span>}
          </div>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: R.full, fontSize: 10, fontWeight: 700, color: cfg.color, fontFamily: F, whiteSpace: "nowrap" as const }}>
            {cfg.icon}<span>{cfg.label}</span>
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
          <span style={{ fontSize: 10, color: C.textMuted, fontFamily: F }}>Sample:</span>
          <span style={{ fontFamily: MONO, fontSize: 11, color: C.textSecondary, background: C.pageBg, borderRadius: R.xs, padding: "2px 7px", border: `1px solid ${C.border}` }}>{row.sampleData}</span>
        </div>
        <div style={{ position: "relative" }}>
          <button onClick={() => setOpen(o => !o)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", border: `1px solid ${row.status === "unmapped" ? "#FECACA" : open ? C.accent : C.border}`, borderRadius: R.md, background: row.status === "unmapped" ? "#FFF5F5" : C.surface, cursor: "pointer", fontSize: 12, fontFamily: F, color: row.status === "unmapped" ? "#9CA3AF" : C.textPrimary, fontWeight: row.status === "unmapped" ? 400 : 600, gap: 6 }}>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, flex: 1, textAlign: "left" as const }}>{row.targetLabel}</span>
            <ChevronDown size={13} color={C.textMuted} style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
          </button>
          {open && (
            <div style={{ position: "absolute", top: "calc(100% + 2px)", left: 0, right: 0, zIndex: 200, background: C.surface, border: `1px solid ${C.border}`, borderRadius: R.md, boxShadow: ERP.shadow.lg, overflow: "hidden", maxHeight: 200, overflowY: "auto" }}>
              {TARGET_FIELD_OPTIONS.map((opt, oi) => (
                <div key={opt.value} onClick={() => { onChange(row.id, opt.value, opt.label); setOpen(false); }} style={{ padding: "8px 12px", fontSize: 12, fontFamily: F, color: row.targetField === opt.value ? C.accent : C.textPrimary, background: row.targetField === opt.value ? C.accentPale : "transparent", fontWeight: row.targetField === opt.value ? 700 : 400, cursor: "pointer", borderBottom: oi < TARGET_FIELD_OPTIONS.length - 1 ? `1px solid ${C.divider}` : "none", display: "flex", alignItems: "center", gap: 8 }}>
                  {row.targetField === opt.value ? <Check size={11} color={C.accent} style={{ flexShrink: 0 }} /> : <div style={{ width: 11, flexShrink: 0 }} />}
                  {opt.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "190px 150px 1fr 224px",
        alignItems: "center",
        padding: "0 20px",
        borderBottom: isLast ? "none" : `1px solid ${C.divider}`,
        background: index % 2 === 0 ? C.surface : "#FAFBFC",
        transition: "background 0.1s",
        minHeight: 56,
        position: "relative",
      }}
      onMouseEnter={e => (e.currentTarget.style.background = C.accentPale)}
      onMouseLeave={e => (e.currentTarget.style.background = index % 2 === 0 ? C.surface : "#FAFBFC")}
    >
      {/* CSV Header */}
      <div style={{ padding: "14px 16px 14px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" as const }}>
          <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: C.textPrimary, background: "#F8FAFC", border: `1px solid ${C.border}`, borderRadius: R.sm, padding: "3px 8px" }}>{row.csvHeader}</span>
          {row.sensitive && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 6px", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: R.xs, fontSize: 9, fontWeight: 700, color: "#92400E" }}><Shield size={8} />敏感</span>
          )}
        </div>
      </div>

      {/* Sample Data */}
      <div style={{ padding: "14px 16px 14px 0" }}>
        <span style={{ fontFamily: MONO, fontSize: 11.5, color: C.textSecondary, background: C.pageBg, borderRadius: R.xs, padding: "3px 8px", border: `1px solid ${C.border}` }}>{row.sampleData}</span>
      </div>

      {/* Target Field Dropdown */}
      <div style={{ padding: "10px 16px 10px 0", position: "relative" }}>
        <button onClick={() => setOpen(o => !o)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 10px", border: `1px solid ${row.status === "unmapped" ? "#FECACA" : open ? C.accent : C.border}`, borderRadius: R.md, background: row.status === "unmapped" ? "#FFF5F5" : C.surface, cursor: "pointer", fontSize: 12, fontFamily: F, color: row.status === "unmapped" ? "#9CA3AF" : C.textPrimary, fontWeight: row.status === "unmapped" ? 400 : 600, transition: "all 0.12s", gap: 6 }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; }}
          onMouseLeave={e => { if (!open) e.currentTarget.style.borderColor = row.status === "unmapped" ? "#FECACA" : C.border; }}
        >
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, flex: 1, textAlign: "left" as const }}>{row.targetLabel}</span>
          <ChevronDown size={13} color={C.textMuted} style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
        </button>
        {open && (
          <div style={{ position: "absolute", top: "calc(100% - 2px)", left: 0, right: 16, zIndex: 100, background: C.surface, border: `1px solid ${C.border}`, borderRadius: R.md, boxShadow: ERP.shadow.lg, overflow: "hidden", maxHeight: 220, overflowY: "auto" }}>
            {TARGET_FIELD_OPTIONS.map((opt, oi) => (
              <div key={opt.value} onClick={() => { onChange(row.id, opt.value, opt.label); setOpen(false); }} style={{ padding: "8px 12px", fontSize: 12, fontFamily: F, color: row.targetField === opt.value ? C.accent : C.textPrimary, background: row.targetField === opt.value ? C.accentPale : "transparent", fontWeight: row.targetField === opt.value ? 700 : 400, cursor: "pointer", borderBottom: oi < TARGET_FIELD_OPTIONS.length - 1 ? `1px solid ${C.divider}` : "none", display: "flex", alignItems: "center", gap: 8, transition: "background 0.08s" }}
                onMouseEnter={e => { if (row.targetField !== opt.value) e.currentTarget.style.background = C.surfaceHover; }}
                onMouseLeave={e => { e.currentTarget.style.background = row.targetField === opt.value ? C.accentPale : "transparent"; }}
              >
                {row.targetField === opt.value ? <Check size={11} color={C.accent} style={{ flexShrink: 0 }} /> : <div style={{ width: 11, flexShrink: 0 }} />}
                {opt.label}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status Badge */}
      <div style={{ padding: "14px 0" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: R.full, fontSize: 11, fontWeight: 700, color: cfg.color, fontFamily: F, whiteSpace: "nowrap" as const }}>
          {cfg.icon}
          <span>{cfg.label}</span>
          <span style={{ fontSize: 9.5, fontWeight: 400, opacity: 0.7 }}>· {cfg.enLabel}</span>
        </span>
      </div>
    </div>
  );
};

// ── Main Screen ────────────────────────────────────────────────────────────────
export const Screen_DataImport: React.FC = () => {
  const [activeModule,  setActiveModule]  = useState<Module>("students");
  const [rows,          setRows]          = useState<MappingRow[]>(INITIAL_ROWS);
  const [fileUploaded,  setFileUploaded]  = useState(true);   // pre-loaded for demo
  const [isDragOver,    setIsDragOver]    = useState(false);
  const [isParsing,     setIsParsing]     = useState(false);
  const [isParsed,      setIsParsed]      = useState(true);   // mapping table visible
  const [isMobile,      setIsMobile]      = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const handleParse = () => {
    setIsParsing(true);
    setTimeout(() => { setIsParsing(false); setIsParsed(true); }, 1400);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    setFileUploaded(true);
  };

  const mappedFull   = 14;
  const totalFull    = 15;
  const autoCount    = rows.filter(r => r.status === "auto").length;
  const sensitiveCount = rows.filter(r => r.status === "sensitive").length;
  const unmappedCount  = rows.filter(r => r.status === "unmapped").length;

  const handleFieldChange = (rowId: string, value: string, label: string) => {
    setRows(prev => prev.map(r => {
      if (r.id !== rowId) return r;
      const isSensitive = ["sen_status", "emergency_phone", "address"].includes(value);
      return { ...r, targetField: value, targetLabel: label, status: isSensitive ? "sensitive" : "auto", sensitive: isSensitive };
    }));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: isMobile ? "auto" : "100%", minHeight: isMobile ? "100%" : undefined, overflow: isMobile ? "visible" : "hidden", background: C.pageBg, fontFamily: F }}>

      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div style={{ padding: isMobile ? "14px 16px 12px" : "18px 28px 16px", background: C.surface, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        {/* Title + session tag */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: isMobile ? 12 : 16, gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: R.md, flexShrink: 0, background: C.accentPale, border: `1px solid ${C.accentLight}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Database size={17} color={C.accent} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: isMobile ? 15 : 19, fontWeight: 800, color: C.textPrimary, letterSpacing: "-0.3px", fontFamily: F }}>
                💾 {isMobile ? "數據匯入" : "數據遷移與匯入引擎"}
              </h1>
              {!isMobile && <p style={{ margin: "3px 0 0", fontSize: 12, color: C.textMuted, fontFamily: F }}>Data Migration &amp; Import Engine · 支援從 eClass, WebSAMS 或標準 CSV/Excel 匯入核心數據。</p>}
            </div>
          </div>
          {!isMobile && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: C.pageBg, border: `1px solid ${C.border}`, borderRadius: R.md, flexShrink: 0 }}>
              <Cpu size={11} color={C.textMuted} />
              <span style={{ fontSize: 11, color: C.textMuted, fontFamily: MONO }}>Session #IMP-2025-0811</span>
            </div>
          )}
        </div>

        {/* Stepper */}
        <Stepper currentStep={1} isMobile={isMobile} />
      </div>

      {/* ── Scrollable body ───────────────────────────────────────────────── */}
      <div style={{ flex: isMobile ? "none" : 1, overflowY: isMobile ? "visible" : "auto", padding: isMobile ? "16px 16px 120px" : "22px 28px 100px", display: "flex", flexDirection: "column", gap: 18 }}>

        {/* Section 1 — Module */}
        <SectionCard icon={<CircleDot size={13} color={C.accent} />} zh="選擇匯入模組" en="Select Data Module" step="01" mb={0}>
          <div style={{ display: isMobile ? "grid" : "flex", gridTemplateColumns: isMobile ? "1fr 1fr" : undefined, gap: 10, flexWrap: "wrap" as const }}>
            {MODULES.map(m => (
              <ModuleCard key={m.id} mod={m} active={activeModule === m.id} onClick={() => setActiveModule(m.id)} />
            ))}
          </div>
        </SectionCard>

        {/* ── Section 2: Drag & Drop Dropzone ─────────────────────────── */}
        <div style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: R.xl,
          overflow: "hidden",
          boxShadow: ERP.shadow.xs,
        }}>
          {/* Section header */}
          <div style={{
            padding: "13px 20px",
            borderBottom: `1px solid ${C.border}`,
            display: "flex", alignItems: "center", gap: 10,
            background: C.pageBg,
          }}>
            <span style={{
              fontFamily: MONO, fontSize: 10, fontWeight: 800,
              color: C.accent, padding: "2px 6px",
              background: C.accentPale, border: `1px solid ${C.accentLight}`,
              borderRadius: R.xs,
            }}>02</span>
            <Upload size={13} color={C.accent} />
            <span style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary, fontFamily: F }}>
              檔案上傳區
            </span>
            <span style={{ fontSize: 11, color: C.textMuted, fontFamily: F }}>· Upload Zone</span>
            {fileUploaded && (
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{
                  padding: "2px 9px", borderRadius: R.full,
                  background: "#F0FDF4", border: "1px solid #BBF7D0",
                  fontSize: 10.5, fontWeight: 700, color: "#15803D", fontFamily: F,
                  display: "flex", alignItems: "center", gap: 4,
                }}>
                  <CheckCircle2 size={10} color="#22C55E" />
                  檔案就緒
                </span>
              </div>
            )}
          </div>

          <div style={{ padding: "20px" }}>

            {/* ── EMPTY STATE: full drag zone ── */}
            {!fileUploaded && (
              <div
                onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${isDragOver ? C.accent : "#CBD5E1"}`,
                  borderRadius: R.lg,
                  background: isDragOver ? C.accentPale : "#F8FAFC",
                  padding: isMobile ? "28px 20px" : "48px 32px",
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  gap: 12, cursor: "pointer",
                  transition: "all 0.18s",
                  textAlign: "center" as const,
                }}
                onMouseEnter={e => {
                  if (!isDragOver) {
                    e.currentTarget.style.borderColor = C.accentLight;
                    e.currentTarget.style.background = C.accentPale;
                  }
                }}
                onMouseLeave={e => {
                  if (!isDragOver) {
                    e.currentTarget.style.borderColor = "#CBD5E1";
                    e.currentTarget.style.background = "#F8FAFC";
                  }
                }}
              >
                {/* Cloud icon */}
                <div style={{
                  width: 64, height: 64, borderRadius: "50%",
                  background: isDragOver ? C.accentLight : "#E2E8F0",
                  border: `1.5px solid ${isDragOver ? C.accent : "#CBD5E1"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.18s",
                }}>
                  <UploadCloud size={28} color={isDragOver ? C.accent : "#94A3B8"} strokeWidth={1.5} />
                </div>

                {/* Primary text */}
                <div>
                  <p style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700, color: C.textPrimary, fontFamily: F }}>
                    拖曳 eClass 或 WebSAMS 輸出的 CSV/Excel 檔案至此
                  </p>
                  <p style={{ margin: 0, fontSize: 12.5, color: C.textMuted, fontFamily: F }}>
                    Drag and drop your export file here, or click to browse
                  </p>
                </div>

                {/* Browse button */}
                <button
                  onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "8px 18px",
                    border: `1.5px solid ${C.border}`,
                    borderRadius: R.md,
                    background: C.surface,
                    fontSize: 12.5, fontWeight: 600, fontFamily: F,
                    color: C.textSecondary, cursor: "pointer",
                    transition: "all 0.12s",
                    boxShadow: ERP.shadow.xs,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = C.accentPale;
                    e.currentTarget.style.borderColor = C.accent;
                    e.currentTarget.style.color = C.accent;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = C.surface;
                    e.currentTarget.style.borderColor = C.border;
                    e.currentTarget.style.color = C.textSecondary;
                  }}
                >
                  <Upload size={13} />
                  點擊選擇檔案 Browse Files
                </button>

                {/* Format hints */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" as const, justifyContent: "center" }}>
                  <span style={{ fontSize: 11, color: C.textMuted, fontFamily: F }}>支援格式：</span>
                  {[".csv", ".xls", ".xlsx"].map(fmt => (
                    <span key={fmt} style={{
                      padding: "2px 7px", borderRadius: R.xs,
                      background: C.surface, border: `1px solid ${C.border}`,
                      fontSize: 10.5, fontWeight: 700, color: C.textSecondary, fontFamily: MONO,
                    }}>{fmt}</span>
                  ))}
                  <span style={{ fontSize: 11, color: C.textDisabled, fontFamily: F }}>· 最大 50 MB</span>
                </div>
              </div>
            )}

            {/* ── UPLOADED STATE ── */}
            {fileUploaded && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

                {/* Compact re-upload strip */}
                <div
                  onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={e => { e.preventDefault(); setIsDragOver(false); }}
                  style={{
                    border: `1.5px dashed ${isDragOver ? C.accent : "#CBD5E1"}`,
                    borderRadius: R.md,
                    background: isDragOver ? C.accentPale : "#F8FAFC",
                    padding: "10px 16px",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    gap: 8,
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" as const, flex: 1, minWidth: 0 }}>
                    <UploadCloud size={14} color={C.textMuted} />
                    <span style={{ fontSize: 11.5, color: C.textMuted, fontFamily: F, whiteSpace: "nowrap" as const }}>
                      {isMobile ? "替換檔案，或" : "拖曳新檔案至此以替換，或"}
                    </span>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        fontSize: 11.5, fontWeight: 700, color: C.accent, fontFamily: F,
                        padding: 0, textDecoration: "underline",
                        textUnderlineOffset: "2px", whiteSpace: "nowrap" as const,
                      }}
                    >
                      {isMobile ? "點擊選擇" : "點擊選擇新檔案"}
                    </button>
                  </div>
                  {!isMobile && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {["eClass CSV", "WebSAMS Excel", "標準 CSV/XLSX"].map(fmt => (
                        <span key={fmt} style={{
                          padding: "2px 7px", borderRadius: R.xs,
                          background: C.surface, border: `1px solid ${C.border}`,
                          fontSize: 9.5, fontWeight: 600, color: C.textMuted, fontFamily: MONO,
                        }}>{fmt}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* File pill + Parse button row */}
                <div style={{
                  display: "flex", flexDirection: isMobile ? "column" : "row",
                  alignItems: isMobile ? "stretch" : "center", gap: isMobile ? 10 : 12,
                  padding: "14px 16px",
                  background: "#F0FDF4",
                  border: "1.5px solid #BBF7D0",
                  borderRadius: R.lg,
                }}>
                  {/* Top row: icon + file info + delete */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                    <div style={{ width: 38, height: 38, borderRadius: R.md, flexShrink: 0, background: "#DCFCE7", border: "1px solid #86EFAC", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <FileText size={18} color="#16A34A" />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3, flexWrap: "wrap" as const }}>
                        <span style={{ fontSize: isMobile ? 12 : 13.5, fontWeight: 700, color: "#15803D", fontFamily: F, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, maxWidth: isMobile ? 160 : undefined }}>
                          eClass_Student_Export_2025.csv
                        </span>
                        <span style={{ padding: "1px 7px", borderRadius: R.full, background: "#DCFCE7", border: "1px solid #86EFAC", fontSize: 9.5, fontWeight: 800, color: "#16A34A", fontFamily: MONO, letterSpacing: "0.05em", flexShrink: 0 }}>CSV</span>
                        <CheckCircle2 size={13} color="#22C55E" style={{ flexShrink: 0 }} />
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11.5, color: "#4B7C5A", fontFamily: F, flexWrap: "wrap" as const }}>
                        <span>2.4 MB</span>
                        <span style={{ color: "#86EFAC" }}>·</span>
                        <span>850 筆紀錄</span>
                        {!isMobile && <><span style={{ color: "#86EFAC" }}>·</span><span style={{ color: "#86EFAC", fontSize: 11 }}>eClass export v3</span></>}
                      </div>
                    </div>

                    <button onClick={() => { setFileUploaded(false); setIsParsed(false); }} title="移除檔案" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, border: "1px solid #BBF7D0", borderRadius: R.md, background: "#fff", cursor: "pointer", transition: "all 0.12s", flexShrink: 0, color: "#86EFAC" }}
                      onMouseEnter={e => { e.currentTarget.style.background = "#FEE2E2"; e.currentTarget.style.borderColor = "#FECACA"; e.currentTarget.style.color = "#DC2626"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#BBF7D0"; e.currentTarget.style.color = "#86EFAC"; }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {/* Divider — desktop only */}
                  {!isMobile && <div style={{ width: 1, height: 32, background: "#BBF7D0", flexShrink: 0 }} />}

                  {/* Parse button */}
                  <button
                    onClick={handleParse}
                    disabled={isParsing}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                      padding: "10px 20px",
                      border: "none", borderRadius: R.md,
                      background: isParsed ? C.borderStrong : C.accent,
                      color: "#fff",
                      fontSize: 13, fontWeight: 700, fontFamily: F,
                      cursor: isParsing ? "wait" : "pointer",
                      boxShadow: isParsed ? "none" : `0 2px 10px ${C.accent}40`,
                      transition: "all 0.15s",
                      flexShrink: 0,
                      width: isMobile ? "100%" : undefined,
                      minWidth: isMobile ? undefined : 168,
                    }}
                    onMouseEnter={e => { if (!isParsed && !isParsing) e.currentTarget.style.background = C.accentDark; }}
                    onMouseLeave={e => { if (!isParsed && !isParsing) e.currentTarget.style.background = C.accent; }}
                  >
                    {isParsing ? (<><RefreshCw size={14} style={{ animation: "spin 0.8s linear infinite" }} />解析中…</>)
                      : isParsed ? (<><CheckCircle2 size={14} />已完成解析</>)
                      : (<><Zap size={14} />🚀 執行欄位解析</>)}
                  </button>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xls,.xlsx"
              style={{ display: "none" }}
              onChange={() => setFileUploaded(true)}
            />
          </div>
        </div>

        {/* Parsing animation style */}
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

        {/* Section 3 — Field Mapping */}
        <SectionCard
          icon={<Cpu size={13} color={C.accent} />}
          zh="智能欄位映射"
          en="Smart Field Mapping"
          step="03"
          mb={0}
          badge={
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ padding: "2px 9px", borderRadius: R.full, background: "#F0FDF4", border: "1px solid #BBF7D0", fontSize: 10.5, fontWeight: 700, color: "#15803D", fontFamily: F }}>
                {autoCount} 自動對應
              </span>
              {sensitiveCount > 0 && (
                <span style={{ padding: "2px 9px", borderRadius: R.full, background: "#FFFBEB", border: "1px solid #FDE68A", fontSize: 10.5, fontWeight: 700, color: "#92400E", fontFamily: F }}>
                  {sensitiveCount} 需脫敏
                </span>
              )}
              {unmappedCount > 0 && (
                <span style={{ padding: "2px 9px", borderRadius: R.full, background: "#FFF5F5", border: "1px solid #FECACA", fontSize: 10.5, fontWeight: 700, color: "#991B1B", fontFamily: F }}>
                  {unmappedCount} 待處理
                </span>
              )}
            </div>
          }
        >
          {/* AI context note */}
          <div style={{
            padding: "9px 14px", marginBottom: 14,
            background: C.accentPale, border: `1px solid ${C.accentLight}`,
            borderRadius: R.md, display: "flex", alignItems: "flex-start", gap: 8,
          }}>
            <Cpu size={12} color={C.accent} style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ margin: 0, fontSize: 11.5, color: C.accentDeep, fontFamily: F, lineHeight: 1.6 }}>
              系統已自動掃描 CSV 標頭並嘗試匹配 LALP 數據庫欄位。<strong>黃色行</strong>代表偵測到敏感個人資料，將在第二步進行脫敏處理。
              <span style={{ color: C.accentMid }}> · AI auto-scan matched {mappedFull - 1}/{totalFull} fields. 1 field requires manual mapping.</span>
            </p>
          </div>

          {/* Table */}
          <div style={{ border: `1px solid ${C.border}`, borderRadius: R.lg, overflow: "hidden", boxShadow: ERP.shadow.xs }}>
            {/* Header — desktop only */}
            {!isMobile && (
              <div style={{ display: "grid", gridTemplateColumns: "190px 150px 1fr 224px", padding: "0 20px", background: C.pageBg, borderBottom: `1px solid ${C.border}` }}>
                {[
                  { zh: "CSV 來源欄位", en: "Source Header" },
                  { zh: "範例資料", en: "Sample Data" },
                  { zh: "LALP 系統對應欄位", en: "Target ERP Field" },
                  { zh: "狀態", en: "Status" },
                ].map(col => (
                  <div key={col.zh} style={{ padding: "10px 0", fontSize: 10.5, fontWeight: 700, color: C.textMuted, fontFamily: F, letterSpacing: "0.04em", textTransform: "uppercase" as const }}>
                    {col.zh}
                    <span style={{ fontSize: 9, fontWeight: 400, marginLeft: 4, color: C.textDisabled }}>{col.en}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Rows */}
            {rows.map((row, i) => (
              <MappingTableRow
                key={row.id}
                row={row}
                index={i}
                onChange={handleFieldChange}
                isLast={i === rows.length - 1}
                isMobile={isMobile}
              />
            ))}

            {/* Footer */}
            <div style={{
              padding: "9px 20px",
              borderTop: `1px solid ${C.border}`,
              background: C.pageBg,
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <span style={{ fontSize: 11, color: C.textMuted, fontFamily: F }}>
                顯示 {rows.length} 筆（共 {totalFull} 個 CSV 欄位）
              </span>
              <button style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 11, color: C.accent, fontWeight: 600, fontFamily: F,
                display: "flex", alignItems: "center", gap: 4,
              }}>
                查看全部 {totalFull} 個欄位 <ChevronDown size={12} />
              </button>
            </div>
          </div>

          {/* Sensitive notice */}
          {sensitiveCount > 0 && (
            <div style={{
              marginTop: 12, padding: "10px 14px",
              background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: R.md,
              display: "flex", alignItems: "flex-start", gap: 8,
            }}>
              <AlertTriangle size={13} color="#D97706" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ margin: 0, fontSize: 11.5, color: "#78350F", fontFamily: F, lineHeight: 1.6 }}>
                <strong>脫敏提示：</strong>偵測到 {sensitiveCount} 個含敏感個人資料的欄位（標記 ⚠️）。將在第二步驟以 SHA-256 Tokenization 處理，符合《個人資料（私隱）條例》。
                <span style={{ color: "#A16207" }}> · Sensitive fields will be hashed in Step 2.</span>
              </p>
            </div>
          )}
        </SectionCard>

      </div>

      {/* ── Sticky Footer ─────────────────────────────────────────────────── */}
      <div style={{
        padding: isMobile ? "12px 16px 20px" : "14px 28px",
        background: C.surface,
        borderTop: `1px solid ${C.border}`,
        boxShadow: "0 -4px 20px rgba(0,0,0,0.06)",
        display: "flex", flexDirection: isMobile ? "column" : "row",
        alignItems: isMobile ? "stretch" : "center",
        justifyContent: "space-between",
        gap: isMobile ? 12 : 0,
        flexShrink: 0, zIndex: 10,
        position: isMobile ? "fixed" : "relative",
        bottom: isMobile ? 0 : undefined,
        left: isMobile ? 0 : undefined,
        right: isMobile ? 0 : undefined,
      }}>
        {/* Progress */}
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center", gap: isMobile ? 8 : 20 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.textPrimary, fontFamily: F, display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
              <span style={{ color: C.accent, fontFamily: MONO, fontWeight: 800, fontSize: 15 }}>{mappedFull}</span>
              <span style={{ color: C.textMuted }}>/</span>
              <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: 13 }}>{totalFull}</span>
              <span>個欄位已對應</span>
              {!isMobile && <span style={{ color: C.textMuted, fontSize: 11 }}>· {totalFull - mappedFull} field remaining</span>}
            </div>
            <div style={{ width: isMobile ? "100%" : 240, height: 5, borderRadius: R.full, background: C.border, overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: R.full, width: `${(mappedFull / totalFull) * 100}%`, background: unmappedCount === 0 ? "#22C55E" : `linear-gradient(90deg, ${C.accent} 80%, #F59E0B 100%)`, transition: "width 0.3s ease" }} />
            </div>
          </div>
          {/* Legend dots */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {[
              { dot: "#22C55E", label: `${autoCount} 自動對應` },
              { dot: "#F59E0B", label: `${sensitiveCount} 需脫敏` },
              { dot: "#EF4444", label: `${unmappedCount} 待處理` },
            ].map(item => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: item.dot }} />
                <span style={{ fontSize: 11, color: C.textMuted, fontFamily: F }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button style={{ flex: isMobile ? 1 : undefined, padding: "9px 18px", borderRadius: R.md, border: `1px solid ${C.border}`, background: "transparent", color: C.textSecondary, fontSize: 13, fontFamily: F, cursor: "pointer" }}
            onMouseEnter={e => (e.currentTarget.style.background = C.surfaceHover)}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            取消
          </button>
          <button
            style={{ flex: isMobile ? 2 : undefined, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "9px 20px", borderRadius: R.md, border: "none", background: unmappedCount === 0 ? C.accent : C.borderStrong, color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: F, cursor: unmappedCount === 0 ? "pointer" : "not-allowed", boxShadow: unmappedCount === 0 ? `0 2px 10px ${C.accent}40` : "none", transition: "background 0.15s" }}
            onMouseEnter={e => { if (unmappedCount === 0) e.currentTarget.style.background = C.accentDark; }}
            onMouseLeave={e => { e.currentTarget.style.background = unmappedCount === 0 ? C.accent : C.borderStrong; }}
          >
            {isMobile ? "下一步" : "下一步：執行數據校驗"}
            <ArrowRight size={15} />
          </button>
        </div>
      </div>

    </div>
  );
};
