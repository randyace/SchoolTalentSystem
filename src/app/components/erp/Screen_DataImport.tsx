// ─────────────────────────────────────────────────────────────────────────────
// Screen: 數據遷移與匯入引擎 — Data Migration & Import Engine (1.F.1)
// Full 6-module interactive wizard: Upload → Validate → Commit
// ─────────────────────────────────────────────────────────────────────────────
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ERP } from "./erpTokens";
import {
  Upload, FileText, CheckCircle2, AlertTriangle, XCircle, ArrowRight, ArrowLeft,
  User, BarChart2, Users, Award, Database, Shield, UploadCloud, Zap, Download,
  RefreshCw, Layers, FolderKanban, ChevronDown, ChevronUp, Sparkles, ExternalLink,
} from "lucide-react";

const F = ERP.font.family;
const C = ERP.colors;
const R = ERP.radius;

type ModuleId = "students" | "classes" | "scores" | "activities" | "clubs" | "projects";
type MappingStatus = "auto" | "sensitive" | "unmapped" | "ignored";

type ModuleCard = {
  id: ModuleId;
  step: number;
  zh: string;
  en: string;
  badge: string;
  count: number;
  required: Array<{ key: string; label: string }>;
  optional: Array<{ key: string; label: string; sensitive?: boolean }>;
  notes?: string[];
  broadsheet?: boolean;
  view_url?: string;
};

type MappingRow = {
  id: string;
  csvHeader: string;
  sampleData: string;
  targetField: string;
  targetLabel: string;
  status: MappingStatus;
  sensitive?: boolean;
};

type Props = {
  modules?: ModuleCard[];
  parseUrl?: string;
  validateUrl?: string;
  executeUrl?: string;
  templateUrl?: string;
  sampleUrl?: string;
  acornRecalcUrl?: string;
  academicYear?: string;
};

const STEP_LABELS = [
  { num: 1, zh: "上傳與欄位映射", en: "Upload & Map" },
  { num: 2, zh: "數據校驗與脫敏", en: "Validate & Tokenize" },
  { num: 3, zh: "寫入資料庫", en: "Execute Import" },
];

const MODULE_ICONS: Record<ModuleId, React.ReactNode> = {
  students: <User size={16} />,
  classes: <Users size={16} />,
  scores: <BarChart2 size={16} />,
  activities: <Award size={16} />,
  clubs: <Layers size={16} />,
  projects: <FolderKanban size={16} />,
};

const FALLBACK_MODULES: ModuleCard[] = [
  { id: "students", step: 1, zh: "學生檔案", en: "Student Profiles", badge: "主檔 · 優先匯入", count: 0, required: [
    { key: "student_code", label: "學號/內聯網帳號" }, { key: "name_zh", label: "中文姓名" },
    { key: "name_en", label: "英文姓名" }, { key: "class_name", label: "班別" }, { key: "class_no", label: "班號" },
  ], optional: [
    { key: "gender", label: "性別" }, { key: "year_enrolled", label: "入學年份" },
    { key: "sen_status", label: "SEN 狀態 (自動脫敏)", sensitive: true },
    { key: "emergency_phone", label: "緊急聯絡電話", sensitive: true },
  ], view_url: "/students" },
  { id: "classes", step: 2, zh: "班級與動態分組", en: "Classes & Groups", badge: "行政班與教學分組", count: 0, required: [
    { key: "student_code", label: "學號" }, { key: "academic_year", label: "學年" },
    { key: "group_name", label: "班別/分組名稱" }, { key: "group_type", label: "分組類型" },
  ], optional: [{ key: "class_no", label: "班號" }], view_url: "/classes" },
  { id: "scores", step: 3, zh: "測考成績與大分紙", en: "Assessment Scores", badge: "支援 WebSAMS 大分紙矩陣", count: 0, required: [
    { key: "student_code", label: "學號" },
  ], optional: [
    { key: "class_name", label: "班別" }, { key: "name_en", label: "英文姓名" }, { key: "name_zh", label: "中文姓名" },
    { key: "score_matrix", label: "科目/分卷分數欄（大分紙）" },
  ], broadsheet: true, notes: ["支援單科清單與 WebSAMS 大分紙矩陣", "底部統計列自動略過"], view_url: "/scores" },
  { id: "activities", step: 4, zh: "活動、比賽與證書", en: "Activities & Awards", badge: "課外活動與獎項紀錄", count: 0, required: [
    { key: "student_code", label: "學號" }, { key: "activity_name", label: "活動/比賽名稱" },
    { key: "activity_date", label: "日期" }, { key: "role", label: "參與角色" }, { key: "status", label: "出席或獲獎狀態" },
  ], optional: [
    { key: "acorn_moral", label: "德育比重" }, { key: "acorn_intellectual", label: "智育比重" },
  ], view_url: "/activities" },
  { id: "clubs", step: 5, zh: "學會與崗位名冊", en: "Clubs & Roles", badge: "連動 1.D.6 角色與 T1-T3", count: 0, required: [
    { key: "student_code", label: "學號" }, { key: "club_name", label: "學會名稱" },
    { key: "academic_year", label: "學年" }, { key: "role", label: "擔任崗位" },
  ], optional: [{ key: "attendance_count", label: "出席次數" }], view_url: "/clubs" },
  { id: "projects", step: 6, zh: "跨學科分組專題", en: "PBL Projects", badge: "專題組別與組長錨定", count: 0, required: [
    { key: "student_code", label: "學號" }, { key: "project_name", label: "專題名稱" },
    { key: "subject_area", label: "科目/領域" }, { key: "group_name", label: "組別" },
    { key: "role", label: "角色" }, { key: "status", label: "完成狀態" },
  ], optional: [], view_url: "/projects" },
];

const GOLDEN_RULES = [
  "第一列（Row 1）必須為欄位標題列（Header Row），請勿使用合併儲存格（Merged Cells）。",
  "系統以「學號 / 內聯網帳號（如 S00001 或 s231028）」作為唯一識別碼；若學號已存在，系統將自動更新資料而不會重複建立。",
  "如直接上傳 WebSAMS 匯出之「大分紙」，系統會自動過濾底部的「平均數、標準偏差、最高分數、及格率」等統計列，無須人手刪除。",
];

const STATUS_CFG: Record<MappingStatus, { bg: string; border: string; color: string; label: string }> = {
  auto: { bg: "#F0FDF4", border: "#BBF7D0", color: "#15803D", label: "自動對應" },
  sensitive: { bg: "#FFFBEB", border: "#FDE68A", color: "#92400E", label: "需脫敏" },
  unmapped: { bg: "#FFF5F5", border: "#FECACA", color: "#991B1B", label: "待處理" },
  ignored: { bg: "#F8FAFC", border: "#E2E8F0", color: "#64748B", label: "已忽略" },
};

function targetOptions(mod: ModuleCard): Array<{ value: string; label: string }> {
  const opts = [
    { value: "ignore", label: "🚫 忽略此欄位 (Ignore / Do Not Import)" },
    ...mod.required.map(f => ({ value: f.key, label: f.label })),
    ...mod.optional.map(f => ({ value: f.key, label: f.label })),
  ];
  return opts;
}

const SectionCard: React.FC<{
  step: string; zh: string; en: string; icon: React.ReactNode; children: React.ReactNode; badge?: React.ReactNode;
}> = ({ step, zh, en, icon, children, badge }) => (
  <div style={{
    background: C.surface, border: `1px solid ${C.border}`, borderRadius: R.xl,
    marginBottom: 14, boxShadow: ERP.shadow.xs, overflow: "hidden",
  }}>
    <div style={{
      padding: "11px 16px", borderBottom: `1px solid ${C.border}`, background: C.pageBg,
      display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const,
    }}>
      <span style={{
        fontSize: 10, fontWeight: 800, color: C.accent, background: C.accentPale,
        border: `1px solid ${C.accentLight}`, borderRadius: R.full, padding: "2px 8px", fontFamily: F,
      }}>{step}</span>
      <span style={{ color: C.accent, display: "flex" }}>{icon}</span>
      <span style={{ fontSize: 13, fontWeight: 800, color: C.textPrimary, fontFamily: F }}>{zh}</span>
      <span style={{ fontSize: 11, color: C.textMuted, fontFamily: F }}>{en}</span>
      {badge}
    </div>
    <div style={{ padding: 16 }}>{children}</div>
  </div>
);

export const Screen_DataImport: React.FC<Props> = ({
  modules: modulesProp,
  parseUrl = "/admin/data-import/parse-preview",
  validateUrl = "/admin/data-import/validate",
  executeUrl = "/admin/data-import/execute",
  templateUrl = "/admin/data-import/template",
  sampleUrl = "/admin/data-import/sample",
  acornRecalcUrl = "/admin/acorn-engine",
}) => {
  const [modules, setModules] = useState<ModuleCard[]>(modulesProp?.length ? modulesProp : FALLBACK_MODULES);
  const [activeModule, setActiveModule] = useState<ModuleId>("students");
  const [step, setStep] = useState(1);
  const [guideOpen, setGuideOpen] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [mapping, setMapping] = useState<MappingRow[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [skippedSummary, setSkippedSummary] = useState(0);
  const [isBroadsheet, setIsBroadsheet] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [validating, setValidating] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<{ valid: number; upsert: number; skipped_summary: number; masked_fields: number; total: number } | null>(null);
  const [preview, setPreview] = useState<Array<Record<string, unknown>>>([]);
  const [maskedPreview, setMaskedPreview] = useState<Array<Record<string, unknown>>>([]);
  const [showMasked, setShowMasked] = useState(false);
  const [execResult, setExecResult] = useState<{ inserted: number; updated: number; skipped: number; message: string; view_url?: string } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (modulesProp?.length) setModules(modulesProp);
    else {
      fetch("/admin/data-import/modules", { credentials: "same-origin" })
        .then(r => r.json())
        .then(j => { if (j?.ok && Array.isArray(j.modules)) setModules(j.modules); })
        .catch(() => { /* keep fallback */ });
    }
  }, [modulesProp]);

  const mod = useMemo(
    () => modules.find(m => m.id === activeModule) || FALLBACK_MODULES[0],
    [modules, activeModule],
  );

  const fieldOptions = useMemo(() => targetOptions(mod), [mod]);

  const requiredKeys = useMemo(() => mod.required.map(r => r.key).filter(k => k !== "score_matrix"), [mod]);
  const mappedTargets = useMemo(
    () => new Set(mapping.map(m => m.targetField).filter(t => t && t !== "ignore")),
    [mapping],
  );
  const requiredOk = useMemo(() => {
    if (activeModule === "scores") return mappedTargets.has("student_code");
    return requiredKeys.every(k => mappedTargets.has(k));
  }, [requiredKeys, mappedTargets, activeModule]);
  const unmappedLeft = mapping.filter(m => m.status === "unmapped").length;
  const processed = mapping.filter(m => m.status !== "unmapped").length;
  const canNext = mapping.length > 0 && requiredOk && unmappedLeft === 0;

  const resetFlow = () => {
    setStep(1);
    setFile(null);
    setFileName("");
    setMapping([]);
    setRowCount(0);
    setSkippedSummary(0);
    setIsBroadsheet(false);
    setSummary(null);
    setPreview([]);
    setMaskedPreview([]);
    setExecResult(null);
    setError(null);
  };

  const onSelectModule = (id: ModuleId) => {
    setActiveModule(id);
    resetFlow();
  };

  const parseFile = useCallback(async (f: File) => {
    setParsing(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("module", activeModule);
      fd.append("file", f);
      const res = await fetch(parseUrl, { method: "POST", credentials: "same-origin", body: fd });
      const json = await res.json();
      if (!json?.ok) {
        setError(json?.message || "解析失敗");
        return;
      }
      setFile(f);
      setFileName(json.file_name || f.name);
      setMapping((json.mapping || []).map((m: MappingRow) => ({
        ...m,
        status: (m.targetField === "ignore" ? "ignored" : m.status) as MappingStatus,
      })));
      setRowCount(json.row_count || 0);
      setSkippedSummary(json.skipped_summary || 0);
      setIsBroadsheet(!!json.is_broadsheet);
    } catch {
      setError("網路錯誤，無法解析檔案");
    } finally {
      setParsing(false);
    }
  }, [activeModule, parseUrl]);

  const loadSample = async () => {
    setError(null);
    try {
      const res = await fetch(`${sampleUrl}/${activeModule}`, { credentials: "same-origin" });
      if (!res.ok) throw new Error("sample");
      const blob = await res.blob();
      const f = new File([blob], `sample_${activeModule}.csv`, { type: "text/csv" });
      await parseFile(f);
    } catch {
      setError("無法載入測試數據");
    }
  };

  const onFieldChange = (id: string, value: string) => {
    setMapping(prev => prev.map(row => {
      if (row.id !== id) return row;
      if (value === "ignore") {
        return { ...row, targetField: "ignore", targetLabel: "🚫 忽略此欄位", status: "ignored", sensitive: false };
      }
      const opt = fieldOptions.find(o => o.value === value);
      const sensitive = !!mod.optional.find(o => o.key === value && o.sensitive)
        || value === "sen_status" || value === "emergency_phone";
      return {
        ...row,
        targetField: value,
        targetLabel: opt?.label || value,
        status: value ? (sensitive ? "sensitive" : "auto") : "unmapped",
        sensitive,
      };
    }));
  };

  const runValidate = async () => {
    setValidating(true);
    setError(null);
    try {
      const res = await fetch(validateUrl, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          module: activeModule,
          mapping: mapping.map(m => ({ csvHeader: m.csvHeader, targetField: m.targetField })),
        }),
      });
      const json = await res.json();
      if (!json?.ok) {
        setError(json?.message || "校驗失敗");
        return;
      }
      setSummary(json.summary);
      setPreview(json.preview || []);
      setMaskedPreview(json.masked_preview || []);
      setIsBroadsheet(!!json.is_broadsheet);
      setStep(2);
    } catch {
      setError("校驗請求失敗");
    } finally {
      setValidating(false);
    }
  };

  const runExecute = async () => {
    setExecuting(true);
    setError(null);
    try {
      const res = await fetch(executeUrl, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ module: activeModule }),
      });
      const json = await res.json();
      if (!json?.ok) {
        setError(json?.message || "寫入失敗");
        return;
      }
      setExecResult({
        inserted: json.inserted || 0,
        updated: json.updated || 0,
        skipped: json.skipped || 0,
        message: json.message || "完成",
        view_url: json.view_url || mod.view_url,
      });
      setStep(3);
      // refresh counts
      fetch("/admin/data-import/modules", { credentials: "same-origin" })
        .then(r => r.json())
        .then(j => { if (j?.ok && Array.isArray(j.modules)) setModules(j.modules); })
        .catch(() => undefined);
    } catch {
      setError("寫入請求失敗");
    } finally {
      setExecuting(false);
    }
  };

  const previewRows = showMasked ? maskedPreview : preview;

  return (
    <div style={{ height: "100%", overflow: "auto", background: C.pageBg, fontFamily: F }}>
      <div style={{ padding: "18px 22px 28px", maxWidth: 1180, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 16, flexWrap: "wrap" as const }}>
            <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Database size={18} color={C.accent} />
              <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.textPrimary }}>數據遷移與匯入引擎</h1>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: R.full, background: C.accentPale, color: C.accent }}>1.F.1</span>
            </div>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: C.textMuted }}>
              WebSAMS / eClass / Excel → 六大模組三步驟匯入 · 建議依 Step 1→6 順序
            </p>
          </div>
        </div>

        {/* Stepper */}
        <div style={{
          display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" as const,
          background: C.surface, border: `1px solid ${C.border}`, borderRadius: R.lg, padding: "10px 14px",
        }}>
          {STEP_LABELS.map(s => {
            const active = step === s.num;
            const done = step > s.num;
            return (
              <div key={s.num} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "6px 12px",
                borderRadius: R.md,
                background: active ? C.accentPale : done ? "#F0FDF4" : "transparent",
                border: `1px solid ${active ? C.accentLight : done ? "#BBF7D0" : C.border}`,
              }}>
                <span style={{
                  width: 22, height: 22, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 800, color: "#fff",
                  background: active ? C.accent : done ? C.success : "#94A3B8",
                }}>{done ? "✓" : s.num}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.textPrimary }}>{s.zh}</div>
                  <div style={{ fontSize: 10, color: C.textMuted }}>{s.en}</div>
                </div>
              </div>
            );
          })}
        </div>

        {error && (
          <div role="alert" style={{
            marginBottom: 12, padding: "10px 14px", borderRadius: R.md,
            background: "#FEF2F2", border: "1px solid #FECACA", color: "#B91C1C",
            fontSize: 13, fontWeight: 600, display: "flex", gap: 8, alignItems: "center",
          }}>
            <XCircle size={16} /> {error}
              </div>
            )}

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <>
            <SectionCard step="01" zh="選擇匯入模組" en="Select Data Module" icon={<Layers size={14} />}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10 }}>
                {modules.map(m => {
                  const on = m.id === activeModule;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => onSelectModule(m.id as ModuleId)}
                      style={{
                        textAlign: "left", cursor: "pointer", fontFamily: F,
                        padding: 12, borderRadius: R.lg,
                        border: `1.5px solid ${on ? C.accent : C.border}`,
                        background: on ? C.accentPale : C.surface,
                        boxShadow: on ? `0 0 0 1px ${C.accent}33` : "none",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <span style={{
                          fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: R.full,
                          background: on ? C.accent : "#E2E8F0", color: on ? "#fff" : C.textMuted,
                        }}>Step {m.step}</span>
                        <span style={{ color: on ? C.accent : C.textMuted }}>{MODULE_ICONS[m.id as ModuleId]}</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: C.textPrimary }}>{m.zh}</span>
                      </div>
                      <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 6 }}>{m.en}</div>
                      <div style={{
                        fontSize: 10, fontWeight: 700, color: C.accent, display: "inline-block",
                        background: "#fff", border: `1px solid ${C.accentLight}`, borderRadius: R.full, padding: "2px 8px",
                      }}>{m.badge}</div>
                      <div style={{ marginTop: 8, fontSize: 11, color: C.textSecondary, fontWeight: 600 }}>
                        現有紀錄 · <span style={{ fontFamily: ERP.font.mono }}>{m.count.toLocaleString()}</span>
                      </div>
                    </button>
                  );
                })}
                  </div>
            </SectionCard>

            {/* Excel guide */}
            <div style={{
              marginBottom: 14, borderRadius: R.xl, border: `1px solid ${C.accentLight}`,
              background: "#F8FBFF", overflow: "hidden",
            }}>
              <button
                type="button"
                onClick={() => setGuideOpen(o => !o)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "12px 16px", border: "none", background: "transparent", cursor: "pointer", fontFamily: F,
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 800, color: "#1E40AF" }}>
                  <FileText size={15} /> Excel 整理規範與標準範本下載
                  <span style={{ fontSize: 11, fontWeight: 600, color: C.textMuted }}>({mod.zh})</span>
                </span>
                {guideOpen ? <ChevronUp size={16} color="#1E40AF" /> : <ChevronDown size={16} color="#1E40AF" />}
              </button>
              {guideOpen && (
                <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14, padding: "0 16px 16px" }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: C.textPrimary, marginBottom: 8 }}>如何整理您的 Excel / CSV 檔案</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#15803D", marginBottom: 4 }}>必填欄位 Required</div>
                    <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 5, marginBottom: 10 }}>
                      {mod.required.map(f => (
                        <span key={f.key} style={{
                          fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: R.full,
                          background: "#ECFDF5", color: "#065F46", border: "1px solid #A7F3D0",
                        }}>{f.label}</span>
                      ))}
                    </div>
                    {mod.optional.length > 0 && (
                      <>
                        <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, marginBottom: 4 }}>選填欄位 Optional</div>
                        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 5, marginBottom: 10 }}>
                          {mod.optional.map(f => (
                            <span key={f.key} style={{
                              fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: R.full,
                              background: "#F1F5F9", color: "#475569", border: "1px solid #E2E8F0",
                            }}>{f.label}</span>
                          ))}
                        </div>
                      </>
                    )}
                    {(mod.notes || []).map(n => (
                      <div key={n} style={{ fontSize: 11, color: "#1D4ED8", marginBottom: 4, fontWeight: 600 }}>• {n}</div>
                    ))}
                    <div style={{ fontSize: 11, fontWeight: 800, color: C.textPrimary, margin: "10px 0 6px" }}>整理貼士 · Golden Rules</div>
                    {GOLDEN_RULES.map((r, i) => (
                      <div key={i} style={{ fontSize: 11, color: C.textSecondary, marginBottom: 4, lineHeight: 1.45 }}>
                        <strong style={{ color: C.accent }}>{i + 1}.</strong> {r}
                      </div>
                    ))}
                      </div>
                  <div style={{
                    background: C.surface, border: `1px solid ${C.border}`, borderRadius: R.lg, padding: 14,
                    display: "flex", flexDirection: "column", gap: 10,
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: C.textPrimary }}>下載標準範本與範例</div>
                    <a
                      href={`${templateUrl}/${activeModule}`}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        padding: "10px 12px", borderRadius: R.md, textDecoration: "none",
                        background: C.accent, color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: F,
                      }}
                    >
                      <Download size={15} /> 下載此模組標準 Excel 範本 (.csv)
                    </a>
                    <button
                      type="button"
                      onClick={() => void loadSample()}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        padding: "10px 12px", borderRadius: R.md, border: `1px solid ${C.accentLight}`,
                        background: C.accentPale, color: C.accent, fontSize: 13, fontWeight: 700,
                        cursor: "pointer", fontFamily: F,
                      }}
                    >
                      <Zap size={15} /> 載入校方真實測試數據
                    </button>
                    <div style={{ fontSize: 10, color: C.textMuted, lineHeight: 1.4 }}>
                      範本含 UTF-8 BOM 與 3 列真實樣例；測考模組示範 WebSAMS 大分紙欄位結構。
                    </div>
                  </div>
                </div>
              )}
                  </div>

            <SectionCard step="02" zh="檔案上傳區" en="Upload Zone" icon={<UploadCloud size={14} />}>
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => {
                  e.preventDefault();
                  setDragOver(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f) void parseFile(f);
                }}
                onClick={() => inputRef.current?.click()}
                    style={{
                  border: `2px dashed ${dragOver ? C.accent : C.border}`,
                  borderRadius: R.lg, padding: "28px 16px", textAlign: "center" as const,
                  background: dragOver ? C.accentPale : "#FAFBFC", cursor: "pointer",
                }}
              >
                <Upload size={28} color={C.accent} style={{ marginBottom: 8 }} />
                <div style={{ fontSize: 14, fontWeight: 700, color: C.textPrimary }}>
                  {parsing ? "解析中…" : "拖放 CSV / XLSX 至此，或點擊選取檔案"}
                </div>
                <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>支援 .csv · .xls · .xlsx · WebSAMS 大分紙</div>
            <input
                  ref={inputRef}
              type="file"
              accept=".csv,.xls,.xlsx"
              style={{ display: "none" }}
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) void parseFile(f);
                  }}
            />
          </div>
              {fileName && (
                <div style={{
                  marginTop: 10, display: "flex", alignItems: "center", gap: 8,
                  padding: "8px 12px", borderRadius: R.md, background: "#ECFDF5", border: "1px solid #A7F3D0",
                }}>
                  <CheckCircle2 size={14} color="#059669" />
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#065F46" }}>{fileName}</span>
                  <span style={{ fontSize: 11, color: "#047857" }}>· {rowCount} 列</span>
                  {isBroadsheet && <span style={{ fontSize: 10, fontWeight: 700, color: C.accent }}>大分紙模式</span>}
                  {skippedSummary > 0 && <span style={{ fontSize: 10, color: C.textMuted }}>已略過統計列 {skippedSummary}</span>}
        </div>
              )}
            </SectionCard>

        <SectionCard
              step="03"
          zh="智能欄位映射"
          en="Smart Field Mapping"
              icon={<Sparkles size={14} />}
          badge={
                <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, color: canNext ? "#15803D" : C.textMuted }}>
                  {processed} / {mapping.length || 0} 個欄位已處理
                </span>
              }
            >
              {mapping.length === 0 ? (
                <div style={{ fontSize: 13, color: C.textMuted, padding: 12 }}>上傳檔案後將自動產生欄位映射表。</div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: C.pageBg }}>
                        {["來源欄位 (CSV)", "樣本資料", "目標 ERP 欄位", "狀態"].map(h => (
                          <th key={h} style={{
                            textAlign: "left", padding: "8px 10px", borderBottom: `1px solid ${C.border}`,
                            color: C.textMuted, fontWeight: 700, fontSize: 11,
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {mapping.map(row => {
                        const st = STATUS_CFG[row.status];
                        return (
                          <tr key={row.id}>
                            <td style={{ padding: "8px 10px", borderBottom: `1px solid ${C.border}`, fontWeight: 700 }}>{row.csvHeader || "—"}</td>
                            <td style={{ padding: "8px 10px", borderBottom: `1px solid ${C.border}`, color: C.textMuted, fontFamily: ERP.font.mono, fontSize: 11 }}>{row.sampleData || "—"}</td>
                            <td style={{ padding: "8px 10px", borderBottom: `1px solid ${C.border}` }}>
                              <select
                                value={row.targetField || ""}
                                onChange={e => onFieldChange(row.id, e.target.value)}
                                style={{
                                  width: "100%", maxWidth: 320, padding: "6px 8px", borderRadius: R.sm,
                                  border: `1px solid ${C.border}`, fontFamily: F, fontSize: 12,
                                }}
                              >
                                <option value="">選擇目標欄位…</option>
                                {row.targetField.startsWith("score:") && (
                                  <option value={row.targetField}>{row.targetLabel}</option>
                                )}
                                {fieldOptions.map(o => (
                                  <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                              </select>
                            </td>
                            <td style={{ padding: "8px 10px", borderBottom: `1px solid ${C.border}` }}>
                              <span style={{
                                display: "inline-flex", alignItems: "center", gap: 4,
                                padding: "3px 8px", borderRadius: R.full, fontSize: 10, fontWeight: 700,
                                background: st.bg, color: st.color, border: `1px solid ${st.border}`,
                              }}>{st.label}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              {!requiredOk && mapping.length > 0 && (
                <div style={{ marginTop: 10, fontSize: 12, color: "#B45309", fontWeight: 600, display: "flex", gap: 6, alignItems: "center" }}>
                  <AlertTriangle size={14} /> 請完成所有必填欄位映射（或將多餘欄位設為「忽略」）
                </div>
              )}
            </SectionCard>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
              <button
                type="button"
                disabled={!canNext || validating}
                onClick={() => void runValidate()}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "11px 18px", borderRadius: R.md, border: "none",
                  background: canNext ? C.accent : "#94A3B8", color: "#fff",
                  fontSize: 13, fontWeight: 800, cursor: canNext ? "pointer" : "not-allowed", fontFamily: F,
                  opacity: validating ? 0.75 : 1,
                }}
              >
                {validating ? "校驗中…" : "下一步：執行數據校驗"} <ArrowRight size={15} />
              </button>
            </div>
          </>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && summary && (
          <>
            <SectionCard step="02" zh="數據校驗與脫敏預覽" en="Validation Preview" icon={<Shield size={14} />}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10, marginBottom: 14 }}>
                {[
                  { label: "可安全匯入 (新增)", value: summary.valid, color: "#15803D", bg: "#F0FDF4" },
                  { label: "現有紀錄更新 (Upsert)", value: summary.upsert, color: "#1D4ED8", bg: "#EFF6FF" },
                  { label: "自動過濾統計列", value: summary.skipped_summary, color: "#92400E", bg: "#FFFBEB" },
                  { label: "PDPO 敏感欄位", value: summary.masked_fields, color: "#7C3AED", bg: "#F5F3FF" },
                ].map(card => (
                  <div key={card.label} style={{
                    padding: 12, borderRadius: R.lg, background: card.bg, border: `1px solid ${C.border}`,
                  }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: card.color, fontFamily: ERP.font.mono }}>{card.value}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.textSecondary, marginTop: 4 }}>{card.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700 }}>預覽前 {previewRows.length} 列</span>
                <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                  <input type="checkbox" checked={showMasked} onChange={e => setShowMasked(e.target.checked)} />
                  預覽 PDPO 脫敏
                </label>
                {isBroadsheet && <span style={{ fontSize: 11, color: C.accent, fontWeight: 700 }}>大分紙已展開為分數矩陣</span>}
              </div>
              <div style={{ overflowX: "auto", border: `1px solid ${C.border}`, borderRadius: R.md }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: C.pageBg }}>
                      {previewRows[0] && Object.keys(previewRows[0]).filter(k => !k.startsWith("_") && k !== "scores").slice(0, 8).map(k => (
                        <th key={k} style={{ textAlign: "left", padding: "7px 8px", borderBottom: `1px solid ${C.border}`, fontWeight: 700, color: C.textMuted }}>{k}</th>
                      ))}
                      {previewRows[0]?.scores && <th style={{ textAlign: "left", padding: "7px 8px", borderBottom: `1px solid ${C.border}`, fontWeight: 700, color: C.textMuted }}>scores</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, i) => (
                      <tr key={i}>
                        {Object.entries(row).filter(([k]) => !k.startsWith("_") && k !== "scores").slice(0, 8).map(([k, v]) => (
                          <td key={k} style={{ padding: "7px 8px", borderBottom: `1px solid ${C.border}` }}>{String(v ?? "")}</td>
                        ))}
                        {row.scores && (
                          <td style={{ padding: "7px 8px", borderBottom: `1px solid ${C.border}`, fontFamily: ERP.font.mono, fontSize: 10 }}>
                            {JSON.stringify(row.scores)}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" as const }}>
              <button type="button" onClick={() => setStep(1)} style={{
                display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 14px",
                borderRadius: R.md, border: `1px solid ${C.border}`, background: C.surface,
                fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: F,
              }}>
                <ArrowLeft size={14} /> 返回修改映射
              </button>
              <button
                type="button"
                disabled={executing}
                onClick={() => void runExecute()}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 18px",
                  borderRadius: R.md, border: "none", background: C.accent, color: "#fff",
                  fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: F, opacity: executing ? 0.75 : 1,
                }}
              >
                {executing ? "寫入中…" : "確認無誤：寫入資料庫 (Execute Import)"} <ArrowRight size={15} />
              </button>
            </div>
          </>
        )}

        {/* ── STEP 3 ── */}
        {step === 3 && execResult && (
          <SectionCard step="03" zh="寫入資料庫完成報告" en="Import Complete" icon={<CheckCircle2 size={14} />}>
            <div style={{
              padding: 20, borderRadius: R.lg, background: "#ECFDF5", border: "1px solid #A7F3D0", marginBottom: 16,
            }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#065F46", marginBottom: 8 }}>✓ {execResult.message}</div>
              <div style={{ display: "flex", gap: 18, flexWrap: "wrap" as const, fontSize: 13, fontWeight: 700, color: "#047857" }}>
                <span>新增 {execResult.inserted}</span>
                <span>更新 {execResult.updated}</span>
                <span>略過 {execResult.skipped}</span>
              </div>
              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 8 }}>已寫入 audit_logs 審計紀錄（PDPO 6.3.2）</div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" as const }}>
              <a href={acornRecalcUrl} style={{
                display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 14px",
                borderRadius: R.md, background: C.accentPale, color: C.accent, textDecoration: "none",
                fontSize: 13, fontWeight: 700, border: `1px solid ${C.accentLight}`,
              }}>
                <RefreshCw size={14} /> 立即重算全校 ACORN 六維快照
              </a>
              <a href={execResult.view_url || mod.view_url || "/"} style={{
                display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 14px",
                borderRadius: R.md, background: C.accent, color: "#fff", textDecoration: "none",
                fontSize: 13, fontWeight: 700,
              }}>
                前往對應模組查看數據 <ExternalLink size={14} />
              </a>
              <button type="button" onClick={resetFlow} style={{
                display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 14px",
                borderRadius: R.md, border: `1px solid ${C.border}`, background: C.surface,
                fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: F,
              }}>
                繼續匯入其他模組
              </button>
            </div>
          </SectionCard>
        )}
      </div>
      <style>{`
        @media (max-width: 800px) {
          /* stack guide panel */
        }
      `}</style>
    </div>
  );
};
