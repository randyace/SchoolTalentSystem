// ─────────────────────────────────────────────────────────────────────────────
// Screen 1.C.1  科目管理 / Subjects Management
// Layout: Left Table + Right Slide-out Drawer (active edit state)
// ACORN dimension binding per Tender Mod 3
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect } from "react";
import { ERP } from "./erpTokens";
import { AcornBinding } from "./AcornBinding";
import {
  Plus, Search, X, ChevronDown, Check, Edit2, Trash2,
  BookOpen, Tag, ArrowLeft,
  Sliders, AlertCircle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface KlaRef {
  id: number;
  code?: string;
  name_en: string;
  name_zh_hk: string;
  theme_color?: string | null;
  label?: string;
}

interface AcornRef {
  id: number;
  code: string;
  key?: string;
  name_en: string;
  name_zh_hk: string;
  description?: string | null;
  color?: string | null;
}

interface SubjectPaper {
  id?: number;
  name_en: string;
  name_zh_hk: string;
  weighting: number;
  form?: string; // F1–F6 when per-level mode
}

interface Subject {
  id: string;
  code: string;
  zhName: string;
  enName: string;
  kla: string;
  kla_id?: number | null;
  kla_color?: string | null;
  levels: string[];
  status: "active" | "paused";
  allow_dynamic_grouping?: boolean;
  dbId?: number;
  acorn_ids?: number[];
  t1_weighting?: number;
  t2_weighting?: number;
  has_sub_papers?: boolean;
  papers?: SubjectPaper[];
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
/** EDB 八大學習領域 — fallback only; live list from bridge/klas */
const FALLBACK_KLAS: KlaRef[] = [
  { id: 1, code: "CLE",  name_en: "Chinese Language Education",  name_zh_hk: "中國語文教育", theme_color: "#1D4ED8", label: "中國語文教育 Chinese Language Education" },
  { id: 2, code: "ELE",  name_en: "English Language Education",  name_zh_hk: "英國語文教育", theme_color: "#2563EB", label: "英國語文教育 English Language Education" },
  { id: 3, code: "ME",   name_en: "Mathematics Education",       name_zh_hk: "數學教育",     theme_color: "#6D28D9", label: "數學教育 Mathematics Education" },
  { id: 4, code: "SE",   name_en: "Science Education",           name_zh_hk: "科學教育",     theme_color: "#15803D", label: "科學教育 Science Education" },
  { id: 5, code: "TE",   name_en: "Technology Education",        name_zh_hk: "科技教育",     theme_color: "#0F766E", label: "科技教育 Technology Education" },
  { id: 6, code: "PSHE", name_en: "Personal, Social and Humanities Education (PSHE)", name_zh_hk: "個人、社會及人文教育", theme_color: "#92400E", label: "個人、社會及人文教育 Personal, Social and Humanities Education (PSHE)" },
  { id: 7, code: "AE",   name_en: "Arts Education",              name_zh_hk: "藝術教育",     theme_color: "#BE185D", label: "藝術教育 Arts Education" },
  { id: 8, code: "PE",   name_en: "Physical Education",          name_zh_hk: "體育",         theme_color: "#C2410C", label: "體育 Physical Education" },
];

/** 德智體群美靈 — tags_only organisational pills */
const FALLBACK_ACORNS: AcornRef[] = [
  { id: 1, code: "M",  key: "moral",        name_en: "Moral Education",        name_zh_hk: "德育", color: "#0d9488" },
  { id: 2, code: "I",  key: "intellectual", name_en: "Intellectual Education", name_zh_hk: "智育", color: "#2563eb" },
  { id: 3, code: "P",  key: "physical",     name_en: "Physical Education",     name_zh_hk: "體育", color: "#e11d48" },
  { id: 4, code: "S",  key: "social",       name_en: "Social Education",       name_zh_hk: "群育", color: "#16a34a" },
  { id: 5, code: "Ae", key: "aesthetic",    name_en: "Aesthetic Education",    name_zh_hk: "美育", color: "#ea580c" },
  { id: 6, code: "Sp", key: "spiritual",    name_en: "Spiritual Education",    name_zh_hk: "靈育", color: "#7c3aed" },
];
const ALL_LEVELS  = ["S1", "S2", "S3", "S4", "S5", "S6"];

const SUBJECTS_DATA: Subject[] = [
  { id:"MATH", code:"MATH", zhName:"數學", enName:"Mathematics",   kla:"科學", levels:["S1","S2","S3"],           status:"active" },
  { id:"ENG",  code:"ENG",  zhName:"英文", enName:"English",       kla:"語文", levels:["S1","S2","S3","S4","S5"], status:"active" },
  { id:"CHI",  code:"CHI",  zhName:"中文", enName:"Chinese",       kla:"語文", levels:["S1","S2","S3","S4","S5"], status:"active" },
  { id:"PHY",  code:"PHY",  zhName:"物理", enName:"Physics",       kla:"科學", levels:["S4","S5"],               status:"active" },
  { id:"CHEM", code:"CHEM", zhName:"化學", enName:"Chemistry",     kla:"科學", levels:["S4","S5"],               status:"active" },
  { id:"HIST", code:"HIST", zhName:"歷史", enName:"History",       kla:"人文", levels:["S1","S2","S3"],           status:"active" },
  { id:"MUS",  code:"MUS",  zhName:"音樂", enName:"Music",         kla:"藝術", levels:["S1","S2","S3"],           status:"active" },
  { id:"PE",   code:"PE",   zhName:"體育", enName:"Physical Ed.",  kla:"體育", levels:["S1","S2","S3","S4","S5"], status:"active" },
  { id:"GEO",  code:"GEO",  zhName:"地理", enName:"Geography",     kla:"人文", levels:["S1","S2","S3"],           status:"paused" },
  { id:"VA",   code:"VA",   zhName:"視覺藝術", enName:"Visual Arts", kla:"藝術", levels:["S3","S4","S5","S6"],     status:"active" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const KLA_COLOR: Record<string, { bg: string; color: string }> = {
  中國語文教育: { bg: "#DBEAFE", color: "#1D4ED8" },
  英國語文教育: { bg: "#DBEAFE", color: "#2563EB" },
  數學教育: { bg: "#EDE9FE", color: "#6D28D9" },
  科學教育: { bg: "#DCFCE7", color: "#15803D" },
  科技教育: { bg: "#CCFBF1", color: "#0F766E" },
  "個人、社會及人文教育": { bg: "#FEF3C7", color: "#92400E" },
  藝術教育: { bg: "#FCE7F3", color: "#BE185D" },
  體育: { bg: "#FFEDD5", color: "#C2410C" },
  // legacy short labels
  語文: { bg: "#DBEAFE", color: "#1D4ED8" },
  數學: { bg: "#EDE9FE", color: "#6D28D9" },
  科學: { bg: "#DCFCE7", color: "#15803D" },
  人文: { bg: "#FEF3C7", color: "#92400E" },
  科技: { bg: "#CCFBF1", color: "#0F766E" },
  藝術: { bg: "#FCE7F3", color: "#BE185D" },
};

function klaStyleFor(s: { kla?: string; kla_color?: string | null }, klas: KlaRef[]) {
  const named = KLA_COLOR[s.kla || ""];
  if (named) return named;
  const hex = s.kla_color || klas.find(k => k.name_zh_hk === s.kla)?.theme_color;
  if (hex) return { bg: `${hex}22`, color: hex };
  return { bg: ERP.colors.accentPale, color: ERP.colors.accent };
}

interface SubjectForm {
  code: string; zhName: string; enName: string;
  klaId: number | ""; levels: string[]; acornIds: number[];
}

const defaultForm = (s: Subject): SubjectForm => ({
  code: s.code, zhName: s.zhName, enName: s.enName,
  klaId: s.kla_id ?? "",
  levels: [...s.levels],
  acornIds: [...(s.acorn_ids || [])],
});

const emptyForm = (): SubjectForm => ({
  code: "", zhName: "", enName: "",
  klaId: "", levels: [], acornIds: [],
});

// ─── WeightsPanel — Term weightings + Sub-papers (分卷, per-level capable) ───
const WeightsPanel: React.FC<{
  subject: Subject;
  onBack: () => void;
  updateUrl: string;
  onSaved: (subject: Subject) => void;
}> = ({ subject, onBack, updateUrl, onSaved }) => {
  const F = ERP.font.family;
  const offered = (subject.levels || []).map(l => {
    const m = String(l).match(/[1-6]/);
    return m ? `F${m[0]}` : String(l).toUpperCase();
  }).filter((v, i, a) => a.indexOf(v) === i);

  const [t1, setT1] = useState(subject.t1_weighting ?? 40);
  const [t2, setT2] = useState(subject.t2_weighting ?? 60);
  const [papers, setPapers] = useState<SubjectPaper[]>(() =>
    (subject.papers && subject.papers.length > 0)
      ? subject.papers.map(p => ({ ...p }))
      : []
  );
  const [uniform, setUniform] = useState(true);
  const [selectedForms, setSelectedForms] = useState<string[]>(() => [...offered]);
  const [activeForm, setActiveForm] = useState<string>(offered[0] || "F1");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");

  const termTotal = t1 + t2;
  const visiblePapers = uniform
    ? papers
    : papers.filter(p => !p.form || p.form === activeForm);
  const paperTotal = visiblePapers.reduce((s, p) => s + (Number(p.weighting) || 0), 0);
  const termOk = termTotal === 100;
  const papersOk = visiblePapers.length === 0 || paperTotal === 100;

  const addPaper = () => setPapers(p => [...p, {
    name_en: "", name_zh_hk: "", weighting: 0,
    form: uniform ? undefined : activeForm,
  }]);
  const removePaper = (idxInVisible: number) => {
    const target = visiblePapers[idxInVisible];
    setPapers(p => p.filter(row => row !== target));
  };
  const patchPaper = (idxInVisible: number, field: keyof SubjectPaper, value: string | number) => {
    const target = visiblePapers[idxInVisible];
    setPapers(p => p.map(row => (row === target ? { ...row, [field]: value } : row)));
  };

  const toggleForm = (f: string) =>
    setSelectedForms(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);

  /** Copy current form's paper weights to all checked levels */
  const copyToSelectedLevels = () => {
    const source = papers.filter(p => !p.form || p.form === activeForm);
    if (source.length === 0) {
      setErr("目前級別沒有分卷可複製。");
      return;
    }
    const targets = selectedForms.filter(f => f !== activeForm);
    if (targets.length === 0) {
      setErr("請勾選其他級別以複製。");
      return;
    }
    setPapers(prev => {
      const kept = prev.filter(p => p.form && !targets.includes(p.form) && p.form !== activeForm);
      const currentLevel = prev.filter(p => !p.form || p.form === activeForm).map(p => ({ ...p, form: activeForm }));
      const clones = targets.flatMap(f => source.map(p => ({
        name_en: p.name_en, name_zh_hk: p.name_zh_hk, weighting: p.weighting, form: f,
      })));
      return [...kept, ...currentLevel, ...clones];
    });
    setErr("");
  };

  const handleSave = async () => {
    if (!subject.dbId) {
      setErr("請先儲存科目基本資料，再設定權重。");
      return;
    }
    if (!termOk) {
      setErr("上／下學期比重必須合計 100%。");
      return;
    }
    if (!papersOk) {
      setErr("分卷比重必須合計 100%（或清空分卷）。");
      return;
    }
    setSaving(true);
    setErr("");
    try {
      const payloadPapers = uniform
        ? papers.map(({ name_en, name_zh_hk, weighting }) => ({ name_en, name_zh_hk, weighting }))
        : papers.map(p => ({
            name_en: p.name_en,
            name_zh_hk: p.name_zh_hk,
            weighting: p.weighting,
            form: p.form || activeForm,
          }));
      const res = await fetch(`${updateUrl.replace(/\/$/, "")}/${subject.dbId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          dbId: subject.dbId,
          code: subject.code,
          zhName: subject.zhName,
          enName: subject.enName,
          name_zh_hk: subject.zhName,
          name_en: subject.enName,
          kla_id: subject.kla_id ?? null,
          offered_forms: subject.levels,
          acorn_ids: subject.acorn_ids ?? [],
          status: subject.status,
          t1_weighting: t1,
          t2_weighting: t2,
          has_sub_papers: papers.length > 0,
          papers: payloadPapers,
          papers_uniform: uniform,
          paper_forms: selectedForms,
          academic_year: "2025/26",
        }),
      });
      const json = await res.json();
      if (!json?.ok) {
        setErr(json?.message || "儲存失敗");
        return;
      }
      if (json.subject) onSaved(json.subject);
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    } catch {
      setErr("儲存失敗，請重試");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <style>{`@keyframes wSave { 0% { transform: scale(0.95); } 50% { transform: scale(1.03); } 100% { transform: scale(1); } }`}</style>

      <div style={{ padding: "13px 18px", borderBottom: `1px solid ${ERP.colors.border}`, background: ERP.colors.surface, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <button type="button" onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 9px", border: `1px solid ${ERP.colors.border}`, borderRadius: ERP.radius.md, background: "transparent", fontSize: 11, fontWeight: 600, color: ERP.colors.textSecondary, cursor: "pointer", fontFamily: F }}>
            <ArrowLeft size={12} /> 返回科目設定
          </button>
          <div style={{ flex: 1 }} />
          <div style={{ padding: "2px 9px", borderRadius: ERP.radius.full, background: "#FFF7ED", border: "1px solid #FED7AA", fontSize: 10, fontWeight: 700, color: "#C2410C", fontFamily: ERP.font.mono }}>
            {subject.code}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: ERP.radius.sm, background: "#FFF7ED", border: "1px solid #FED7AA", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Sliders size={14} color="#C2410C" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: ERP.colors.textPrimary, fontFamily: F }}>學期比重與分卷</div>
            <div style={{ fontSize: 11, color: ERP.colors.textMuted, fontFamily: F, marginTop: 1 }}>
              Term Weights · Sub-papers · <span style={{ fontStyle: "italic" }}>{subject.zhName}</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px" }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: ERP.colors.textMuted, letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: 10, fontFamily: F }}>
          學期比重 Term Weightings
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div style={{ background: "#EEF2FF", border: "1px solid #C7D2FE", borderRadius: ERP.radius.lg, padding: "12px 14px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#4338CA", marginBottom: 8, fontFamily: F }}>上學期比重 (Term 1)</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input type="number" min={0} max={100} value={t1}
                onChange={e => {
                  const v = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                  setT1(v);
                  setT2(100 - v);
                }}
                style={{ width: 72, textAlign: "center", padding: "6px 8px", border: "1.5px solid #C7D2FE", borderRadius: ERP.radius.sm, fontSize: 16, fontWeight: 800, color: "#4338CA", fontFamily: F, outline: "none" }}
              />
              <span style={{ fontSize: 14, fontWeight: 700, color: "#4338CA" }}>%</span>
            </div>
          </div>
          <div style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: ERP.radius.lg, padding: "12px 14px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#047857", marginBottom: 8, fontFamily: F }}>下學期比重 (Term 2)</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input type="number" min={0} max={100} value={t2}
                onChange={e => {
                  const v = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                  setT2(v);
                  setT1(100 - v);
                }}
                style={{ width: 72, textAlign: "center", padding: "6px 8px", border: "1.5px solid #A7F3D0", borderRadius: ERP.radius.sm, fontSize: 16, fontWeight: 800, color: "#047857", fontFamily: F, outline: "none" }}
              />
              <span style={{ fontSize: 14, fontWeight: 700, color: "#047857" }}>%</span>
            </div>
          </div>
        </div>
        <div style={{ padding: "10px 12px", borderRadius: ERP.radius.md, background: termOk ? "#F0FDF4" : "#FFF7ED", border: `1px solid ${termOk ? "#BBF7D0" : "#FED7AA"}`, display: "flex", alignItems: "center", gap: 8, marginBottom: 22 }}>
          {termOk ? <Check size={14} color="#15803D" /> : <AlertCircle size={14} color="#C2410C" />}
          <span style={{ fontSize: 12, fontWeight: 700, color: termOk ? "#15803D" : "#C2410C", fontFamily: F }}>
            {termOk ? "學期比重合計 100%" : `合計 ${termTotal}% · 必須為 100%`}
          </span>
        </div>

        <div style={{ marginBottom: 12 }}>
          <a
            href={`/term-weightings?subject_id=${subject.dbId || ""}`}
            style={{ fontSize: 12, fontWeight: 700, color: ERP.colors.accent, textDecoration: "none" }}
          >
            開啟完整測考評分比重矩陣 →
          </a>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: ERP.colors.textMuted, letterSpacing: "0.06em", textTransform: "uppercase" as const, fontFamily: F }}>
            分卷 Sub-papers
          </div>
          <button type="button" onClick={addPaper} style={{
            display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 10px",
            borderRadius: ERP.radius.md, border: `1px solid ${ERP.colors.border}`, background: "#fff",
            fontSize: 11, fontWeight: 700, fontFamily: F, cursor: "pointer", color: ERP.colors.accent,
          }}>
            <Plus size={12} /> 新增分卷
          </button>
        </div>
        <p style={{ margin: "0 0 10px", fontSize: 11, color: ERP.colors.textMuted, fontFamily: F }}>
          語文科等可設定閱讀／寫作等分卷。儲存後會同步至評估項目（成績輸入可見）。
        </p>

        {/* Uniform vs per-level */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12, padding: 10, background: ERP.colors.pageBg, borderRadius: ERP.radius.md, border: `1px solid ${ERP.colors.border}` }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: F }}>
            <input type="radio" checked={uniform} onChange={() => setUniform(true)} />
            統一套用至所有級別 (Apply uniformly to all levels)
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: F }}>
            <input type="radio" checked={!uniform} onChange={() => setUniform(false)} />
            按級別個別設定 (Set per level)
          </label>
          {!uniform && (
            <>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
                {(offered.length ? offered : ["F1", "F2", "F3", "F4", "F5", "F6"]).map(f => (
                  <label key={f} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={selectedForms.includes(f)}
                      onChange={() => toggleForm(f)}
                    />
                    <span
                      onClick={() => setActiveForm(f)}
                      style={{
                        padding: "2px 8px", borderRadius: 6,
                        background: activeForm === f ? ERP.colors.accentPale : "transparent",
                        color: activeForm === f ? ERP.colors.accent : ERP.colors.textSecondary,
                        border: activeForm === f ? `1px solid ${ERP.colors.accentLight}` : "1px solid transparent",
                      }}
                    >{f}</span>
                  </label>
                ))}
              </div>
              <button type="button" onClick={copyToSelectedLevels} style={{
                alignSelf: "flex-start", marginTop: 4, padding: "6px 10px", borderRadius: ERP.radius.md,
                border: `1px solid ${ERP.colors.accentLight}`, background: ERP.colors.accentPale,
                color: ERP.colors.accent, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: F,
              }}>
                一鍵複製至勾選級別 (Copy to Selected Levels) · 來源 {activeForm}
              </button>
            </>
          )}
        </div>

        {visiblePapers.length === 0 ? (
          <div style={{ padding: "20px 14px", textAlign: "center", border: `1px dashed ${ERP.colors.border}`, borderRadius: ERP.radius.lg, color: ERP.colors.textMuted, fontSize: 12, marginBottom: 12 }}>
            尚未設定分卷（選修）。按「新增分卷」加入 Reading / Writing 等。
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 12 }}>
            {visiblePapers.map((p, idx) => (
              <div key={idx} style={{ border: `1px solid ${ERP.colors.border}`, borderRadius: ERP.radius.lg, padding: "12px 12px", background: "#FAFBFC" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 72px 32px", gap: 8, alignItems: "end" }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: ERP.colors.textMuted, marginBottom: 4 }}>中文名稱</div>
                    <input value={p.name_zh_hk} placeholder="閱讀"
                      onChange={e => patchPaper(idx, "name_zh_hk", e.target.value)}
                      style={{ ...inputStyle, padding: "7px 10px", fontSize: 12 }}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: ERP.colors.textMuted, marginBottom: 4 }}>English</div>
                    <input value={p.name_en} placeholder="Reading"
                      onChange={e => patchPaper(idx, "name_en", e.target.value)}
                      style={{ ...inputStyle, padding: "7px 10px", fontSize: 12 }}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: ERP.colors.textMuted, marginBottom: 4 }}>比重 %</div>
                    <input type="number" min={0} max={100} value={p.weighting}
                      onChange={e => patchPaper(idx, "weighting", Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                      style={{ ...inputStyle, padding: "7px 8px", fontSize: 13, fontWeight: 800, textAlign: "center" }}
                    />
                  </div>
                  <button type="button" onClick={() => removePaper(idx)} title="移除" style={{
                    height: 34, border: "none", background: "transparent", color: ERP.colors.red, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {visiblePapers.length > 0 && (
          <div style={{ padding: "10px 12px", borderRadius: ERP.radius.md, background: papersOk ? "#F0FDF4" : "#FFF7ED", border: `1px solid ${papersOk ? "#BBF7D0" : "#FED7AA"}`, display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            {papersOk ? <Check size={14} color="#15803D" /> : <AlertCircle size={14} color="#C2410C" />}
            <span style={{ fontSize: 12, fontWeight: 700, color: papersOk ? "#15803D" : "#C2410C", fontFamily: F }}>
              {papersOk ? "分卷比重合計 100%" : `分卷合計 ${paperTotal}% · 必須為 100%`}
            </span>
          </div>
        )}

        {visiblePapers.length > 0 && (
          <div style={{ height: 10, borderRadius: 5, overflow: "hidden", display: "flex", background: ERP.colors.border, marginTop: 8 }}>
            {visiblePapers.map((p, i) => {
              const pct = Number(p.weighting) || 0;
              const colors = ["#6366F1", "#0891B2", "#D97706", "#059669", "#BE185D"];
              return pct > 0 ? <div key={i} title={`${p.name_zh_hk || p.name_en} ${pct}%`} style={{ width: `${pct}%`, background: colors[i % colors.length], height: "100%" }} /> : null;
            })}
          </div>
        )}

        {err && <p style={{ margin: "14px 0 0", fontSize: 12, color: ERP.colors.red, fontWeight: 600 }}>{err}</p>}
      </div>

      <div style={{ padding: "12px 18px", borderTop: `1px solid ${ERP.colors.border}`, display: "flex", gap: 10, justifyContent: "flex-end", background: ERP.colors.surface, flexShrink: 0 }}>
        <button type="button" onClick={onBack} style={{ padding: "8px 18px", borderRadius: ERP.radius.md, border: `1px solid ${ERP.colors.border}`, background: "transparent", color: ERP.colors.textSecondary, fontSize: 13, fontFamily: F, cursor: "pointer" }}>
          取消 Cancel
        </button>
        <button type="button" onClick={handleSave} disabled={saving || !termOk || !papersOk} style={{
          padding: "8px 20px", borderRadius: ERP.radius.md, border: "none",
          background: termOk && papersOk ? ERP.colors.accent : ERP.colors.border,
          color: termOk && papersOk ? "#fff" : ERP.colors.textMuted,
          fontSize: 13, fontWeight: 700, fontFamily: F,
          cursor: termOk && papersOk && !saving ? "pointer" : "default",
          boxShadow: termOk && papersOk ? `0 2px 8px ${ERP.colors.accent}40` : "none",
          animation: saved ? "wSave 0.3s ease" : "none",
        }}>
          {saving ? "儲存中…" : saved ? "✓ 已儲存" : "儲存 Save"}
        </button>
      </div>
    </>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatusChip: React.FC<{ status: "active" | "paused" }> = ({ status }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: 4,
    padding: "2px 8px", borderRadius: 9999, fontSize: 11, fontWeight: 600,
    background: status === "active" ? "#D1FAE5" : "#FEE2E2",
    color:      status === "active" ? "#065F46" : "#991B1B",
    border:     `1px solid ${status === "active" ? "#6EE7B7" : "#FECACA"}`,
  }}>
    <span style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor", display: "inline-block" }} />
    {status === "active" ? "啟用" : "停用"}
  </span>
);

const FormField: React.FC<{
  label: string; sub?: string; required?: boolean; children: React.ReactNode;
}> = ({ label, sub, required, children }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{
      display: "block", fontSize: 12, fontWeight: 600,
      color: ERP.colors.textSecondary, marginBottom: 6,
      fontFamily: ERP.font.family,
    }}>
      {label}
      {required && <span style={{ color: ERP.colors.red, marginLeft: 3 }}>*</span>}
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

// ─── Main Component ───────────────────────────────────────────────────────────
interface Props {
  lang?: "en" | "zh-HK";
  /** Bridge-injected subjects from CI4 (offered_forms → levels) */
  subjects?: Subject[];
  klas?: KlaRef[];
  acorns?: AcornRef[];
  /** Open create inspector on mount (e.g. /subjects/create). */
  startCreating?: boolean;
  toggleUrl?: string;
  storeUrl?: string;
  updateUrl?: string;
}

export const Screen_Subjects: React.FC<Props> = ({
  lang = "zh-HK",
  subjects,
  klas: klasProp,
  acorns: acornsProp,
  startCreating = false,
  toggleUrl = "/subjects/toggle-dynamic-grouping",
  storeUrl = "/subjects/store",
  updateUrl = "/subjects/update",
}) => {
  const klas = (klasProp && klasProp.length > 0) ? klasProp : FALLBACK_KLAS;
  const acorns = (acornsProp && acornsProp.length > 0) ? acornsProp : FALLBACK_ACORNS;
  const [catalog, setCatalog] = useState<Subject[]>(
    () => (subjects && subjects.length > 0) ? subjects : SUBJECTS_DATA
  );

  // No Figma-mock preselection — table loads with inspector closed (full width).
  const [selectedId,  setSelectedId]  = useState<string | null>(null);
  const [isCreating,  setIsCreating]  = useState(!!startCreating);
  const [search,      setSearch]      = useState("");
  const [klaFilter,   setKlaFilter]   = useState("全部");
  const [form,        setForm]        = useState<SubjectForm>(() => emptyForm());
  const [isMobile,    setIsMobile]    = useState(false);
  const [drawerView,  setDrawerView]  = useState<"edit" | "weights">("edit");
  const [toggling, setToggling] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  useEffect(() => {
    if (subjects && subjects.length > 0) setCatalog(subjects);
  }, [subjects]);

  useEffect(() => {
    if (startCreating) {
      setSelectedId(null);
      setIsCreating(true);
      setDrawerView("edit");
      setForm(emptyForm());
      setSaveMsg(null);
    }
  }, [startCreating]);

  const toggleDynamicGrouping = async (s: Subject, e: React.MouseEvent) => {
    e.stopPropagation();
    setToggling(s.code);
    const next = !s.allow_dynamic_grouping;
    // Optimistic
    setCatalog(prev => prev.map(x =>
      x.code === s.code ? { ...x, allow_dynamic_grouping: next } : x
    ));
    try {
      await fetch(toggleUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ code: s.code, allow_dynamic_grouping: next }),
      });
    } catch {
      setCatalog(prev => prev.map(x =>
        x.code === s.code ? { ...x, allow_dynamic_grouping: !next } : x
      ));
    } finally {
      setToggling(null);
    }
  };

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 900);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const isInspectorOpen = selectedId !== null || isCreating;
  const F = ERP.font.family;

  const filtered = catalog.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !q || s.code.toLowerCase().includes(q) || s.zhName.includes(search) || s.enName.toLowerCase().includes(q);
    const matchKla = klaFilter === "全部"
      || String(s.kla_id ?? "") === klaFilter
      || s.kla === klaFilter;
    return matchSearch && matchKla;
  });

  const closeInspector = () => {
    setSelectedId(null);
    setIsCreating(false);
    setDrawerView("edit");
    setForm(emptyForm());
    setSaveMsg(null);
  };

  const openCreate = () => {
    setSelectedId(null);
    setIsCreating(true);
    setDrawerView("edit");
    setForm(emptyForm());
    setSaveMsg(null);
  };

  const backToEdit = () => {
    setDrawerView("edit");
  };

  const handleSelectRow = (s: Subject) => {
    if (s.id === selectedId && !isCreating) {
      closeInspector();
      return;
    }
    setIsCreating(false);
    setSelectedId(s.id);
    setDrawerView("edit");
    setForm(defaultForm(s));
    setSaveMsg(null);
  };

  const toggleLevel = (l: string) =>
    setForm(f => ({ ...f, levels: f.levels.includes(l) ? f.levels.filter(x => x !== l) : [...f.levels, l] }));

  const toggleAcorn = (id: number) =>
    setForm(f => ({
      ...f,
      acornIds: f.acornIds.includes(id) ? f.acornIds.filter(x => x !== id) : [...f.acornIds, id],
    }));

  const handleSaveSubject = async () => {
    const selected = catalog.find(s => s.id === selectedId);
    setSaving(true);
    setSaveMsg(null);
    try {
      const url = selected?.dbId
        ? `${updateUrl}/${selected.dbId}`
        : storeUrl;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          dbId: selected?.dbId,
          code: form.code,
          zhName: form.zhName,
          enName: form.enName,
          name_zh_hk: form.zhName,
          name_en: form.enName,
          kla_id: form.klaId === "" ? null : form.klaId,
          offered_forms: form.levels,
          acorn_ids: form.acornIds,
          status: selected?.status ?? "active",
        }),
      });
      const json = await res.json();
      if (!json.ok) {
        setSaveMsg(json.message || "儲存失敗");
        return;
      }
      if (json.subject) {
        setCatalog(prev => {
          const next = prev.map(x =>
            (x.dbId && x.dbId === json.subject.dbId) || x.code === json.subject.code
              ? { ...x, ...json.subject }
              : x
          );
          if (!next.some(x => x.dbId === json.subject.dbId || x.code === json.subject.code)) {
            return [...next, json.subject];
          }
          return next;
        });
      }
      // Close inspector after successful save so the table returns to full width.
      closeInspector();
    } catch {
      setSaveMsg("儲存失敗，請重試");
    } finally {
      setSaving(false);
    }
  };

  const DRAWER_W = isMobile ? window.innerWidth : 440;

  // Explicit viewport height so the create/edit drawer is never clipped by
  // AppShell <main overflowY:auto> percentage-height quirks.
  const shellH = `calc(100vh - ${ERP.layout.topHeaderH}px)`;

  return (
    <div style={{
      display: "flex",
      height: isMobile ? "auto" : shellH,
      minHeight: isMobile ? "100%" : shellH,
      alignItems: "stretch",
      overflow: isMobile ? "visible" : "hidden",
      background: ERP.colors.pageBg, fontFamily: F,
      flexDirection: isMobile ? "column" : "row",
      position: "relative",
    }}>

      {/* ── LEFT PANEL ──────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: isMobile ? "visible" : "hidden", minWidth: 0 }}>

        {/* Page header */}
        <div style={{ padding: isMobile ? "16px 16px 12px" : "20px 24px 14px", flexShrink: 0, borderBottom: `1px solid ${ERP.colors.border}`, background: ERP.colors.surface }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: ERP.colors.textPrimary, letterSpacing: "-0.3px" }}>
                科目管理
              </h1>
              <p style={{ margin: "3px 0 0", fontSize: 12, color: ERP.colors.textMuted }}>
                Subject Management · AY 2025/26 · {catalog.length} 個科目
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                openCreate();
              }}
              aria-label="新增科目 Add Subject"
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "8px 14px", borderRadius: ERP.radius.md,
                border: "none", background: ERP.colors.accent,
                color: "#fff", fontSize: 13, fontWeight: 600, fontFamily: F, cursor: "pointer",
                position: "relative", zIndex: 2, flexShrink: 0,
              }}
            >
              <Plus size={14} /> 新增科目
            </button>
          </div>

          {/* Filters row */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" as const }}>
            <div style={{ position: "relative", flex: 1, minWidth: 160 }}>
              <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: ERP.colors.textMuted, pointerEvents: "none" }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="搜尋科目代碼或名稱…"
                style={{ ...inputStyle, paddingLeft: 32, fontSize: 12 }}
              />
            </div>
            <div style={{ position: "relative" }}>
              <select
                value={klaFilter}
                onChange={e => setKlaFilter(e.target.value)}
                style={{ ...inputStyle, width: 130, paddingRight: 28, appearance: "none" as const, cursor: "pointer", fontSize: 12 }}
              >
                <option value="全部">全部學習領域</option>
                {klas.map(k => <option key={k.id} value={String(k.id)}>{k.name_zh_hk || k.label}</option>)}
              </select>
              <ChevronDown size={13} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: ERP.colors.textMuted }} />
            </div>
          </div>
        </div>

        {/* Table */}
        <div style={{ flex: isMobile ? "none" : 1, overflow: isMobile ? "visible" : "auto", padding: isMobile ? "16px 16px 24px" : "16px 24px 24px" }}>
          <div style={{ background: ERP.colors.surface, borderRadius: ERP.radius.lg, border: `1px solid ${ERP.colors.border}`, overflow: "hidden", boxShadow: ERP.shadow.xs }}>

            {isMobile ? (
              /* ── Mobile card list ── */
              <div>
                {filtered.length === 0 ? (
                  <div style={{ padding: "40px 16px", textAlign: "center" as const, color: ERP.colors.textMuted, fontSize: 13 }}>
                    沒有符合條件的科目
                  </div>
                ) : filtered.map((s, idx) => {
                  const isSelected = selectedId === s.id;
                  const klaStyle = klaStyleFor(s, klas);
                  return (
                    <div
                      key={s.id}
                      onClick={() => handleSelectRow(s)}
                      style={{
                        padding: "12px 16px",
                        borderBottom: idx < filtered.length - 1 ? `1px solid ${ERP.colors.divider}` : "none",
                        background: isSelected ? "#EFF6FF" : ERP.colors.surface,
                        borderLeft: isSelected ? `3px solid ${ERP.colors.accent}` : "3px solid transparent",
                        cursor: "pointer", transition: "background 0.1s",
                      }}
                    >
                      {/* Row 1: code + name + actions */}
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                        <span style={{
                          fontFamily: ERP.font.mono, fontSize: 11, fontWeight: 700, flexShrink: 0,
                          color: isSelected ? ERP.colors.accent : ERP.colors.textPrimary,
                          background: isSelected ? ERP.colors.accentLight : ERP.colors.pageBg,
                          padding: "2px 6px", borderRadius: ERP.radius.xs,
                          marginTop: 2,
                        }}>
                          {s.code}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: isSelected ? 700 : 500, color: isSelected ? ERP.colors.accent : ERP.colors.textPrimary }}>
                            {s.zhName}
                          </div>
                          <div style={{ fontSize: 11, color: ERP.colors.textMuted, marginTop: 1 }}>{s.enName}</div>
                        </div>
                        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                          <button
                            onClick={e => { e.stopPropagation(); handleSelectRow(s); }}
                            style={{ background: "none", border: "none", cursor: "pointer", padding: 5, color: ERP.colors.accent, display: "flex", borderRadius: ERP.radius.sm }}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={e => e.stopPropagation()}
                            style={{ background: "none", border: "none", cursor: "pointer", padding: 5, color: ERP.colors.textMuted, display: "flex", borderRadius: ERP.radius.sm }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      {/* Row 2: KLA + status + levels */}
                      <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 5, marginTop: 8, paddingLeft: 2 }}>
                        <span style={{ padding: "2px 8px", borderRadius: ERP.radius.xs, fontSize: 11, fontWeight: 600, background: klaStyle.bg, color: klaStyle.color }}>
                          {s.kla}
                        </span>
                        <StatusChip status={s.status} />
                        {s.levels.map(l => (
                          <span key={l} style={{ padding: "1px 6px", borderRadius: ERP.radius.xs, fontSize: 10, fontWeight: 600, background: ERP.colors.accentPale, color: ERP.colors.accent, border: `1px solid ${ERP.colors.accentLight}` }}>
                            {l}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* ── Desktop grid table ── */
              <div style={{ overflowX: "auto" }}>
                <div style={{
                  minWidth: 720, display: "grid",
                  gridTemplateColumns: "80px 1fr 80px 140px 70px 110px 70px",
                  background: ERP.colors.pageBg, borderBottom: `1px solid ${ERP.colors.border}`,
                  padding: "0 16px",
                }}>
                  {["科目代碼", "科目名稱", "學習領域", "開設級別", "狀態", "動態分組", "操作"].map((h, i) => (
                    <div key={i} style={{ padding: "11px 8px 11px 0", fontSize: 11, fontWeight: 700, color: ERP.colors.textMuted, letterSpacing: "0.5px", textTransform: "uppercase" as const }}>{h}</div>
                  ))}
                </div>
                {filtered.map((s, idx) => {
                  const isSelected = selectedId === s.id;
                  const klaStyle = klaStyleFor(s, klas);
                  const dynOn = !!s.allow_dynamic_grouping;
                  return (
                    <div
                      key={s.id}
                      onClick={() => handleSelectRow(s)}
                      style={{
                        minWidth: 720, display: "grid",
                        gridTemplateColumns: "80px 1fr 80px 140px 70px 110px 70px",
                        padding: "0 16px",
                        borderBottom: idx < filtered.length - 1 ? `1px solid ${ERP.colors.divider}` : "none",
                        background: isSelected ? "#EFF6FF" : ERP.colors.surface,
                        borderLeft: isSelected ? `3px solid ${ERP.colors.accent}` : "3px solid transparent",
                        cursor: "pointer", transition: "all 0.1s",
                      }}
                      onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = ERP.colors.surfaceHover; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = isSelected ? "#EFF6FF" : ERP.colors.surface; }}
                    >
                      <div style={{ padding: "13px 8px 13px 0", alignSelf: "center" }}>
                        <span style={{ fontFamily: ERP.font.mono, fontSize: 12, fontWeight: 700, color: isSelected ? ERP.colors.accent : ERP.colors.textPrimary, background: isSelected ? ERP.colors.accentLight : ERP.colors.pageBg, padding: "2px 6px", borderRadius: ERP.radius.xs }}>
                          {s.code}
                        </span>
                      </div>
                      <div style={{ padding: "13px 8px 13px 0", alignSelf: "center" }}>
                        <div style={{ fontSize: 14, fontWeight: isSelected ? 700 : 500, color: isSelected ? ERP.colors.accent : ERP.colors.textPrimary }}>{s.zhName}</div>
                        <div style={{ fontSize: 11, color: ERP.colors.textMuted, marginTop: 1 }}>{s.enName}</div>
                      </div>
                      <div style={{ padding: "13px 8px 13px 0", alignSelf: "center" }}>
                        <span style={{ padding: "2px 8px", borderRadius: ERP.radius.xs, fontSize: 11, fontWeight: 600, background: klaStyle.bg, color: klaStyle.color }}>{s.kla}</span>
                      </div>
                      <div style={{ padding: "13px 8px 13px 0", alignSelf: "center", display: "flex", gap: 3, flexWrap: "wrap" as const }}>
                        {s.levels.map(l => (
                          <span key={l} style={{ padding: "1px 6px", borderRadius: ERP.radius.xs, fontSize: 10, fontWeight: 600, background: ERP.colors.accentPale, color: ERP.colors.accent, border: `1px solid ${ERP.colors.accentLight}` }}>{l}</span>
                        ))}
                      </div>
                      <div style={{ padding: "13px 8px 13px 0", alignSelf: "center" }}>
                        <StatusChip status={s.status} />
                      </div>
                      <div style={{ padding: "13px 8px 13px 0", alignSelf: "center" }} onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          disabled={toggling === s.code}
                          onClick={e => toggleDynamicGrouping(s, e)}
                          title="允許動態分組 Allow Dynamic Grouping"
                          style={{
                            width: 44, height: 24, borderRadius: 999, border: "none",
                            background: dynOn ? ERP.colors.accent : "#CBD5E1",
                            position: "relative", cursor: "pointer", padding: 0,
                            opacity: toggling === s.code ? 0.6 : 1,
                            transition: "background 0.15s",
                          }}
                        >
                          <span style={{
                            position: "absolute", top: 3, left: dynOn ? 22 : 3,
                            width: 18, height: 18, borderRadius: "50%", background: "#fff",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "left 0.15s",
                          }} />
                        </button>
                        <div style={{ fontSize: 9, fontWeight: 700, color: dynOn ? ERP.colors.accent : ERP.colors.textMuted, marginTop: 3 }}>
                          {dynOn ? "ON" : "OFF"}
                        </div>
                      </div>
                      <div style={{ padding: "13px 0 13px 0", alignSelf: "center", display: "flex", gap: 6 }}>
                        <button
                          onClick={e => { e.stopPropagation(); handleSelectRow(s); }}
                          style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: ERP.colors.accent, display: "flex", borderRadius: ERP.radius.sm }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={e => e.stopPropagation()}
                          style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: ERP.colors.textMuted, display: "flex", borderRadius: ERP.radius.sm }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Footer count */}
            <div style={{ padding: "9px 16px", borderTop: `1px solid ${ERP.colors.border}`, background: ERP.colors.pageBg, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 12, color: ERP.colors.textMuted }}>顯示 {filtered.length} / {catalog.length} 個科目</span>
              {selectedId && (
                <span style={{ fontSize: 11, color: ERP.colors.accent, background: ERP.colors.accentPale, padding: "1px 8px", borderRadius: ERP.radius.full, fontWeight: 600 }}>
                  已選取：{catalog.find(s => s.id === selectedId)?.zhName}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile backdrop when inspector open */}
      {isInspectorOpen && isMobile && (
        <div
          role="presentation"
          onClick={closeInspector}
          style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", zIndex: 45 }}
        />
      )}

      {/* ── RIGHT DRAWER (flex sibling on desktop; fixed overlay on mobile) ── */}
      {isInspectorOpen && (
      <div style={{
        width: DRAWER_W,
        maxWidth: "100vw",
        transition: "width 0.22s cubic-bezier(0.4,0,0.2,1)",
        overflow: "hidden",
        flexShrink: 0,
        alignSelf: "stretch",
        borderLeft: `1px solid ${ERP.colors.border}`,
        boxShadow: "-4px 0 16px rgba(0,0,0,0.06)",
        background: ERP.colors.surface,
        ...(isMobile ? {
          position: "fixed" as const,
          top: 0, right: 0, bottom: 0,
          zIndex: 50,
          height: "100%",
        } : {
          height: "100%",
          minHeight: 0,
        }),
      }}>
        {/* Slide-track: edit + weights panels */}
        <div style={{ width: DRAWER_W, height: "100%", overflow: "hidden", position: "relative" }}>
        <div style={{
          display: "flex", height: "100%",
          transform: drawerView === "edit"
            ? "translateX(0)"
            : `translateX(-${DRAWER_W}px)`,
          transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
        }}>

        {/* ── Panel 1: Edit / Create form ── */}
        <div style={{ width: DRAWER_W, flexShrink: 0, height: "100%", display: "flex", flexDirection: "column", background: ERP.colors.surface, minHeight: 0 }}>

          {/* Drawer header */}
          <div style={{
            padding: "16px 20px", borderBottom: `1px solid ${ERP.colors.border}`,
            display: "flex", alignItems: "flex-start", justifyContent: "space-between",
            flexShrink: 0, background: ERP.colors.surface,
          }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: ERP.radius.sm, background: ERP.colors.accentPale, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <BookOpen size={14} color={ERP.colors.accent} />
                </div>
                <span style={{ fontSize: 15, fontWeight: 700, color: ERP.colors.textPrimary }}>
                  {isCreating ? "新增科目" : "編輯科目"}
                </span>
                {form.code && (
                  <span style={{ fontFamily: ERP.font.mono, fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: ERP.radius.xs, background: ERP.colors.accentLight, color: ERP.colors.accent }}>{form.code}</span>
                )}
              </div>
              <div style={{ fontSize: 11, color: ERP.colors.textMuted, marginTop: 3, marginLeft: 36 }}>
                {isCreating ? "Create Subject · 新增科目資料" : "Edit Subject · 修改科目資料"}
              </div>
            </div>
            <button
              type="button"
              onClick={closeInspector}
              style={{ background: "none", border: `1px solid ${ERP.colors.border}`, cursor: "pointer", padding: 5, borderRadius: ERP.radius.sm, color: ERP.colors.textMuted, display: "flex", flexShrink: 0 }}
            >
              <X size={15} />
            </button>
          </div>

          {/* Form body */}
          <div style={{ flex: 1, overflow: "auto", padding: "20px 20px 0" }}>

            {/* Section: Basic Info */}
            <div style={{ fontSize: 11, fontWeight: 700, color: ERP.colors.textMuted, letterSpacing: "0.07em", textTransform: "uppercase" as const, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
              <Tag size={11} />基本資料 · Basic Info
            </div>

            <FormField label="科目代碼" sub="Subject Code" required>
              <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} style={inputStyle} />
            </FormField>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FormField label="科目名稱（中）" sub="Chinese Name" required>
                <input value={form.zhName} onChange={e => setForm(f => ({ ...f, zhName: e.target.value }))} style={inputStyle} />
              </FormField>
              <FormField label="科目名稱（英）" sub="English Name">
                <input value={form.enName} onChange={e => setForm(f => ({ ...f, enName: e.target.value }))} style={inputStyle} />
              </FormField>
            </div>

            <FormField label="學習領域" sub="Key Learning Area" required>
              <div style={{ position: "relative" }}>
                <select
                  name="learning_area"
                  value={form.klaId === "" ? "" : String(form.klaId)}
                  onChange={e => setForm(f => ({ ...f, klaId: e.target.value === "" ? "" : Number(e.target.value) }))}
                  style={{ ...inputStyle, paddingRight: 32, appearance: "none" as const, cursor: "pointer" }}
                >
                  <option value="">— 選擇學習領域 Key Learning Area —</option>
                  {klas.map(k => (
                    <option key={k.id} value={k.id}>
                      {k.label || `${k.name_zh_hk} ${k.name_en}`}
                    </option>
                  ))}
                </select>
                <ChevronDown size={13} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: ERP.colors.textMuted }} />
              </div>
            </FormField>

            <FormField label="開設級別" sub="Levels Offered — 點擊切換">
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
                {ALL_LEVELS.map(l => {
                  const active = form.levels.includes(l);
                  return (
                    <button
                      key={l}
                      onClick={() => toggleLevel(l)}
                      style={{
                        padding: "5px 12px", borderRadius: ERP.radius.sm, fontSize: 12, fontWeight: 600,
                        border: `1.5px solid ${active ? ERP.colors.accent : ERP.colors.border}`,
                        background: active ? ERP.colors.accentPale : ERP.colors.pageBg,
                        color: active ? ERP.colors.accent : ERP.colors.textMuted,
                        cursor: "pointer", transition: "all 0.12s", fontFamily: F,
                      }}
                    >
                      {active && <Check size={10} style={{ marginRight: 4, verticalAlign: "middle" }} />}
                      {l}
                    </button>
                  );
                })}
              </div>
              {form.levels.length === 0 && (
                <p style={{ margin: "6px 0 0", fontSize: 11, color: ERP.colors.red }}>請選擇至少一個級別</p>
              )}
            </FormField>

            {/* ACORN tags_only — organisational 德智體群美靈 pills (no weight sliders) */}
            <div style={{ marginBottom: 24 }}>
              <AcornBinding
                showDividerTitle
                summaryMode="when-selected"
                inputName="acorn_ids[]"
                selectedValues={form.acornIds}
                hintText="選擇此科目自動關聯的 ACORN 評估維度（標籤用途）。修讀科目本身不計分，需透過評估表現才納入分數。"
                items={acorns.map(a => ({
                  value: String(a.id),
                  nameZh: a.name_zh_hk,
                  nameEn: a.name_en,
                }))}
                onToggle={(value) => toggleAcorn(Number(value))}
              />
            </div>

            {/* ── Section 3: Assessment Weights ─────────────────────────── */}
            <div style={{ borderTop: `1px solid ${ERP.colors.border}`, margin: "4px 0 18px", position: "relative" }}>
              <span style={{ position: "absolute", top: -9, left: 0, background: ERP.colors.surface, paddingRight: 10, fontSize: 11, fontWeight: 700, color: ERP.colors.textMuted, letterSpacing: "0.07em", textTransform: "uppercase" as const, display: "flex", alignItems: "center", gap: 5 }}>
                <Sliders size={11} />測考與權重 · Assessment Weights
              </span>
            </div>

            <button
              onClick={() => setDrawerView("weights")}
              style={{ width: "100%", boxSizing: "border-box" as const, marginBottom: 24, padding: "12px 16px", borderRadius: ERP.radius.lg, border: `1px solid #FED7AA`, background: "#FFF7ED", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontFamily: F, transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#FFEDD5"; e.currentTarget.style.borderColor = "#FB923C"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#FFF7ED"; e.currentTarget.style.borderColor = "#FED7AA"; }}
            >
              <div style={{ width: 34, height: 34, borderRadius: ERP.radius.md, background: "#FFEDD5", border: "1px solid #FED7AA", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Sliders size={16} color="#C2410C" />
              </div>
              <div style={{ flex: 1, textAlign: "left" as const }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#92400E", fontFamily: F }}>設定測考評分比重</div>
                <div style={{ fontSize: 11, color: "#B45309", marginTop: 2, fontFamily: F }}>設定上／下學期比重與分卷（閱讀、寫作等）</div>
              </div>
              <div style={{ display: "flex", gap: 4 }} aria-hidden>
                <div title="上學期 Term 1" style={{ width: 8, height: 28, borderRadius: 3, background: "#6366F1", opacity: 0.85 }} />
                <div title="下學期 Term 2" style={{ width: 8, height: 28, borderRadius: 3, background: "#059669", opacity: 0.85 }} />
                <div title="分卷 Sub-papers" style={{ width: 8, height: 28, borderRadius: 3, background: "#D97706", opacity: 0.75 }} />
              </div>
            </button>

          </div>

          {/* Drawer footer */}
          <div style={{
            padding: "14px 20px", borderTop: `1px solid ${ERP.colors.border}`,
            display: "flex", gap: 10, justifyContent: "flex-end",
            background: ERP.colors.surface, flexShrink: 0,
          }}>
            <button
              type="button"
              onClick={closeInspector}
              style={{
                padding: "8px 18px", borderRadius: ERP.radius.md,
                border: `1px solid ${ERP.colors.border}`, background: "transparent",
                color: ERP.colors.textSecondary, fontSize: 13, fontFamily: F, cursor: "pointer",
              }}
            >
              取消 Cancel
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleSaveSubject}
              style={{
                padding: "8px 20px", borderRadius: ERP.radius.md, border: "none",
                background: ERP.colors.accent, color: "#fff",
                fontSize: 13, fontWeight: 700, fontFamily: F, cursor: saving ? "default" : "pointer",
                boxShadow: `0 2px 8px ${ERP.colors.accent}40`,
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? "儲存中…" : isCreating ? "建立科目 Create" : "儲存變更 Save Changes"}
            </button>
          </div>

        </div>{/* end Panel 1 */}

        {/* ── Panel 2: Assessment Weights pane ── */}
        <div style={{ width: DRAWER_W, flexShrink: 0, height: "100%", display: "flex", flexDirection: "column", background: ERP.colors.surface }}>
          {selectedId && catalog.find(s => s.id === selectedId) && (
            <WeightsPanel
              subject={catalog.find(s => s.id === selectedId)!}
              onBack={backToEdit}
              updateUrl={updateUrl}
              onSaved={(subj) => {
                setCatalog(prev => prev.map(x =>
                  (x.dbId && x.dbId === subj.dbId) || x.code === subj.code ? { ...x, ...subj } : x
                ));
              }}
            />
          )}
        </div>

        </div>{/* end slide-track */}
        </div>{/* end overflow wrapper */}
      </div>
      )}
    </div>
  );
};
