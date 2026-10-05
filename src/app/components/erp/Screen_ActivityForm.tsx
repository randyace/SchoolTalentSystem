// ─────────────────────────────────────────────────────────────────────────────
// Activity Create / Edit — full-page form (replaces cramped offcanvas drawer)
// ─────────────────────────────────────────────────────────────────────────────
import React, { useMemo, useState } from "react";
import {
  ArrowLeft, Calendar, Check, ChevronDown, Layers, Plus,
  Save, UserCog, X, Trophy, Sliders, Users,
} from "lucide-react";
import { ERP, type AcornTagKey } from "./erpTokens";

const F = ERP.font.family;

type TeacherOpt = {
  id: number | string;
  name?: string;
  name_en?: string;
  name_zh_hk?: string;
  role?: string;
  label?: string;
};
type Stage = { id: string; label: string; labelEn: string; date: string };

type AchievementLevel = {
  id: number;
  code: string;
  name_en: string;
  name_zh_hk: string;
  base_points?: number;
  label?: string;
  sub?: string;
};

type InitialActivity = {
  id?: number;
  name_en?: string;
  name_zh_hk?: string;
  category?: string;
  academic_year?: string;
  teacher_in_charge_id?: number | null;
  achievement_level_id?: number | null;
  status?: string;
  acorn_weights?: Record<string, number>;
  acorn_tags?: string[];
  forms?: string[];
  stages?: Array<{
    id?: number;
    stage_name_zh_hk?: string;
    stage_name_en?: string;
    date?: string;
  }>;
};

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "active", label: "進行中 Active" },
  { value: "paused", label: "暫停 Paused" },
  { value: "completed", label: "已完結 Completed" },
  { value: "draft", label: "籌備中 Draft" },
];

const EDIT_CATEGORIES = ["比賽", "體育", "文藝", "學術", "服務"];
const ALL_ACORN_TAGS: AcornTagKey[] = ["認知", "社群", "創意", "協作", "領導", "體適能"];
const DEFAULT_FORMS = ["F1", "F2", "F3", "F4", "F5", "F6", "All"];
const DEFAULT_YEARS = ["2025/26", "2024/25", "2023/24"];

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "9px 12px",
  border: `1px solid ${ERP.colors.border}`,
  borderRadius: ERP.radius.md, fontSize: 13,
  fontFamily: F, color: ERP.colors.textPrimary,
  background: ERP.colors.surface, outline: "none",
  boxSizing: "border-box",
};

function Section({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: ERP.colors.surface, border: `1px solid ${ERP.colors.border}`,
      borderRadius: ERP.radius.lg, padding: "20px 22px", marginBottom: 16,
      boxShadow: ERP.shadow.xs,
    }}>
      <div style={{
        display: "flex", alignItems: "baseline", gap: 8,
        paddingBottom: 10, marginBottom: 16,
        borderBottom: `1px solid ${ERP.colors.border}`,
      }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: ERP.colors.textPrimary, letterSpacing: "0.03em" }}>{label}</span>
        {sub && <span style={{ fontSize: 11, color: ERP.colors.textMuted }}>{sub}</span>}
      </div>
      {children}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: ERP.colors.textSecondary }}>{label}</label>
        {hint && (
          <span style={{
            fontSize: 10, color: ERP.colors.textMuted, background: ERP.colors.pageBg,
            border: `1px solid ${ERP.colors.border}`, borderRadius: ERP.radius.xs, padding: "1px 5px",
          }}>{hint}</span>
        )}
      </div>
      {children}
    </div>
  );
}

export const Screen_ActivityForm: React.FC<{
  teachers?: TeacherOpt[];
  academicYears?: string[];
  targetForms?: string[];
  achievementLevels?: AchievementLevel[];
  enrollmentCount?: number;
  rosterUrl?: string;
  storeUrl?: string;
  listUrl?: string;
  activityId?: number | null;
  initialActivity?: InitialActivity | null;
  flashSuccess?: string;
  flashError?: string;
}> = ({
  teachers = [],
  academicYears = DEFAULT_YEARS,
  targetForms = DEFAULT_FORMS,
  achievementLevels = [],
  enrollmentCount = 0,
  rosterUrl = "",
  storeUrl = "/activities/store",
  listUrl = "/activities",
  activityId = null,
  initialActivity = null,
  flashSuccess,
  flashError,
}) => {
  const isEdit = !!activityId && activityId > 0;

  const [nameZh, setNameZh] = useState(initialActivity?.name_zh_hk || "");
  const [nameEn, setNameEn] = useState(initialActivity?.name_en || "");
  const [category, setCategory] = useState(initialActivity?.category || "比賽");
  const [year, setYear] = useState(initialActivity?.academic_year || academicYears[0] || "2025/26");
  const [teacherId, setTeacherId] = useState<string>(
    initialActivity?.teacher_in_charge_id ? String(initialActivity.teacher_in_charge_id) : ""
  );
  const [forms, setForms] = useState<string[]>(initialActivity?.forms || []);
  const [acornTags, setAcornTags] = useState<AcornTagKey[]>(() => {
    const tags = (initialActivity?.acorn_tags || []) as AcornTagKey[];
    return tags.filter(t => ALL_ACORN_TAGS.includes(t));
  });
  const [acornWeights, setAcornWeights] = useState<Record<string, number>>(
    () => initialActivity?.acorn_weights || {}
  );
  const [levelId, setLevelId] = useState<string>(
    initialActivity?.achievement_level_id ? String(initialActivity.achievement_level_id) : ""
  );
  const [status, setStatus] = useState(() => {
    const s = (initialActivity?.status || "draft").toLowerCase();
    if (s === "planning") return "draft";
    if (["active", "paused", "completed", "draft"].includes(s)) return s;
    return "draft";
  });
  const [stages, setStages] = useState<Stage[]>(() => {
    const src = initialActivity?.stages || [];
    if (src.length === 0) {
      return [
        { id: "s1", label: "初賽", labelEn: "Preliminary", date: "" },
        { id: "s2", label: "決賽", labelEn: "Final", date: "" },
      ];
    }
    return src.map((s, i) => ({
      id: String(s.id || `s${i}`),
      label: s.stage_name_zh_hk || "",
      labelEn: s.stage_name_en || "",
      date: s.date || "",
    }));
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(flashError || null);
  const [okMsg, setOkMsg] = useState<string | null>(flashSuccess || null);

  const teacherOpts = useMemo(() => {
    return (teachers || []).map(t => {
      const id = Number(t.id);
      const label = t.label
        || t.name
        || [t.name_zh_hk, t.name_en].filter(Boolean).join(" / ")
        || (id ? `Staff #${id}` : "");
      return { id, label };
    }).filter(t => t.id > 0 && t.label);
  }, [teachers]);

  const formOptions = DEFAULT_FORMS;

  const toggleForm = (code: string) => {
    setForms(prev => {
      if (code === "All") {
        return prev.includes("All") ? [] : ["All"];
      }
      const next = prev.filter(f => f !== "All");
      return next.includes(code) ? next.filter(f => f !== code) : [...next, code];
    });
  };

  const rebalanceEvenly = (tags: AcornTagKey[]) => {
    if (tags.length === 0) { setAcornWeights({}); return; }
    const base = Math.floor(100 / tags.length);
    const rem  = 100 - base * tags.length;
    const w: Record<string, number> = {};
    tags.forEach((t, i) => { w[t] = base + (i === 0 ? rem : 0); });
    setAcornWeights(w);
  };

  const toggleAcorn = (tag: AcornTagKey) => {
    setAcornTags(prev => {
      const next = prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag];
      rebalanceEvenly(next);
      return next;
    });
  };

  const handleWeightChange = (changedTag: AcornTagKey, newVal: number) => {
    const clamped = Math.max(0, Math.min(100, newVal));
    const others = acornTags.filter(t => t !== changedTag);
    if (others.length === 0) { setAcornWeights({ [changedTag]: 100 }); return; }
    const remaining = 100 - clamped;
    const othersOldSum = others.reduce((s, t) => s + (acornWeights[t] ?? 0), 0);
    const newW: Record<string, number> = { [changedTag]: clamped };
    let distributed = 0;
    others.forEach((t, i) => {
      if (i < others.length - 1) {
        const share = othersOldSum > 0
          ? Math.round((acornWeights[t] ?? 0) / othersOldSum * remaining)
          : Math.round(remaining / others.length);
        newW[t] = share;
        distributed += share;
      } else {
        newW[t] = Math.max(0, remaining - distributed);
      }
    });
    setAcornWeights(newW);
  };

  const goList = () => { window.location.href = listUrl; };

  const handleSave = async () => {
    if (!nameZh.trim() && !nameEn.trim()) {
      setMsg("請填寫活動名稱。");
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(storeUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          name_zh_hk: nameZh.trim(),
          name_en: nameEn.trim() || nameZh.trim(),
          category,
          academic_year: year,
          teacher_in_charge_id: teacherId === "" ? null : Number(teacherId),
          forms,
          stages: stages.map(s => ({
            stage_name_zh_hk: s.label,
            stage_name_en: s.labelEn,
            date: s.date,
          })),
          acorn_tags: acornTags,
          acorn_weights: acornWeights,
          achievement_level_id: levelId === "" ? null : Number(levelId),
          status,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.ok === false) {
        setMsg(json.message || "儲存失敗");
        return;
      }
      setOkMsg(json.message || "已儲存");
      window.location.href = json.redirect || listUrl;
    } catch {
      setMsg("儲存失敗，請重試。");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      fontFamily: F, background: ERP.colors.pageBg, minHeight: "100%",
      padding: "20px 24px 40px",
    }}>
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <button
          type="button"
          onClick={goList}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 14,
            padding: "6px 10px", border: `1px solid ${ERP.colors.border}`,
            borderRadius: ERP.radius.md, background: ERP.colors.surface,
            color: ERP.colors.textSecondary, cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: F,
          }}
        >
          <ArrowLeft size={13} /> 返回活動總表
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
          <div style={{
            width: 40, height: 40, borderRadius: ERP.radius.md,
            background: isEdit ? ERP.colors.accentPale : ERP.colors.successLight,
            border: `1px solid ${isEdit ? ERP.colors.accentLight : "#6EE7B7"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {isEdit ? <Layers size={18} color={ERP.colors.accent} /> : <Plus size={18} color={ERP.colors.success} />}
          </div>
          <div>
            <div style={{ fontSize: 11, color: ERP.colors.textMuted, letterSpacing: "0.06em", textTransform: "uppercase" as const }}>
              {isEdit ? "編輯活動 Edit Activity" : "新增活動 Create Activity"}
            </div>
            <h1 style={{ margin: "2px 0 0", fontSize: 22, fontWeight: 800, color: ERP.colors.textPrimary }}>
              {nameZh || nameEn || (isEdit ? `活動 #${activityId}` : "填寫活動資料")}
            </h1>
          </div>
        </div>

        {(okMsg || msg) && (
          <div style={{
            marginBottom: 14, padding: "10px 14px", borderRadius: ERP.radius.md,
            background: msg ? "#FEF2F2" : "#F0FDF4",
            border: `1px solid ${msg ? "#FECACA" : "#BBF7D0"}`,
            color: msg ? "#991B1B" : "#166534", fontSize: 13, fontWeight: 600,
          }}>
            {msg || okMsg}
          </div>
        )}

        <Section label="基本資訊" sub="Basic Info">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="活動名稱（中）" hint="必填">
              <input value={nameZh} onChange={e => setNameZh(e.target.value)} placeholder="例：全港科學創意大賽" style={inputStyle} />
            </Field>
            <Field label="活動名稱（英）">
              <input value={nameEn} onChange={e => setNameEn(e.target.value)} placeholder="e.g. HKACE Science Competition" style={inputStyle} />
            </Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            <Field label="活動類別" hint="Type / Category">
              <div style={{ position: "relative" }}>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  style={{ ...inputStyle, paddingRight: 28, appearance: "none" as const, cursor: "pointer" }}
                >
                  {EDIT_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
                <ChevronDown size={13} color={ERP.colors.textMuted} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              </div>
            </Field>
            <Field label="學年" hint="Academic Year">
              <div style={{ position: "relative" }}>
                <select
                  name="academic_year"
                  value={year}
                  onChange={e => setYear(e.target.value)}
                  style={{ ...inputStyle, paddingRight: 28, appearance: "none" as const, cursor: "pointer" }}
                >
                  {academicYears.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <ChevronDown size={13} color={ERP.colors.textMuted} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              </div>
            </Field>
            <Field label="負責教師" hint="Teacher in Charge">
              <div style={{ position: "relative" }}>
                <UserCog size={13} color={ERP.colors.textMuted} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
                <select
                  name="teacher_in_charge_id"
                  value={teacherId}
                  onChange={e => setTeacherId(e.target.value)}
                  style={{ ...inputStyle, paddingLeft: 30, paddingRight: 28, appearance: "none" as const, cursor: "pointer" }}
                >
                  <option value="">— 選擇負責教師 —</option>
                  {teacherOpts.map(t => (
                    <option key={t.id} value={String(t.id)}>{t.label}</option>
                  ))}
                </select>
                <ChevronDown size={13} color={ERP.colors.textMuted} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              </div>
            </Field>
          </div>

          <Field label="連結級別 Target Forms" hint="F1–F6 / All · 不是班別">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {formOptions.map(code => {
                const active = forms.includes(code);
                return (
                  <label
                    key={code}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      padding: "7px 12px", borderRadius: ERP.radius.md, cursor: "pointer",
                      border: `1.5px solid ${active ? ERP.colors.accent : ERP.colors.border}`,
                      background: active ? ERP.colors.accentPale : ERP.colors.pageBg,
                      color: active ? ERP.colors.accent : ERP.colors.textSecondary,
                      fontSize: 12, fontWeight: 700, fontFamily: F,
                    }}
                  >
                    <input
                      type="checkbox"
                      name="forms[]"
                      value={code}
                      checked={active}
                      onChange={() => toggleForm(code)}
                      style={{ accentColor: ERP.colors.accent }}
                    />
                    {code === "All" ? "全校 All" : code}
                  </label>
                );
              })}
            </div>
            <div style={{ fontSize: 11, color: ERP.colors.textMuted, marginTop: 8 }}>
              活動以年級（Form）為對象，例如 F3 涵蓋 3A / 3B / 3C。已選：{forms.join("、") || "（無）"}
            </div>
          </Field>
        </Section>

        <Section label="賽程 / 日程" sub="Sub-events & Schedule">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {stages.map((ev, idx) => (
              <div key={ev.id} style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 12px", background: ERP.colors.pageBg,
                border: `1px solid ${ERP.colors.border}`, borderRadius: ERP.radius.md,
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: ERP.radius.sm, flexShrink: 0,
                  background: ERP.colors.accentPale, border: `1px solid ${ERP.colors.accentLight}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 800, color: ERP.colors.accent,
                }}>{idx + 1}</div>
                <input value={ev.label} placeholder="階段名" onChange={e => setStages(p => p.map(s => s.id === ev.id ? { ...s, label: e.target.value } : s))} style={{ ...inputStyle, flex: "0 0 88px", padding: "6px 8px" }} />
                <input value={ev.labelEn} placeholder="English name" onChange={e => setStages(p => p.map(s => s.id === ev.id ? { ...s, labelEn: e.target.value } : s))} style={{ ...inputStyle, flex: 1, padding: "6px 8px" }} />
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <Calendar size={12} color={ERP.colors.textMuted} />
                  <input type="date" value={ev.date} onChange={e => setStages(p => p.map(s => s.id === ev.id ? { ...s, date: e.target.value } : s))} style={{ ...inputStyle, width: 150, padding: "6px 8px" }} />
                </div>
                <button type="button" onClick={() => setStages(p => p.filter(s => s.id !== ev.id))} style={{
                  width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
                  border: `1px solid ${ERP.colors.border}`, borderRadius: ERP.radius.sm,
                  background: "transparent", color: ERP.colors.textMuted, cursor: "pointer",
                }}><X size={12} /></button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setStages(p => [...p, { id: `s${Date.now()}`, label: "", labelEn: "", date: "" }])}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                padding: "9px 12px", border: `1.5px dashed ${ERP.colors.border}`,
                borderRadius: ERP.radius.md, background: "transparent",
                color: ERP.colors.textSecondary, cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: F,
              }}
            >
              <Plus size={13} color={ERP.colors.accent} /> 新增階段 Add Stage
            </button>
          </div>
        </Section>

        <Section label="ACORN 預設維度" sub="Bindings · UI foundation">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {ALL_ACORN_TAGS.map(tag => {
              const s = ERP.acornTags[tag];
              const selected = acornTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleAcorn(tag)}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    padding: "6px 12px",
                    background: selected ? s.bg : ERP.colors.pageBg,
                    color: selected ? s.color : ERP.colors.textMuted,
                    border: `1.5px solid ${selected ? s.border : ERP.colors.border}`,
                    borderRadius: ERP.radius.full, fontSize: 12, fontWeight: 700,
                    cursor: "pointer", fontFamily: F,
                  }}
                >
                  {selected && <Check size={11} />}
                  {tag}
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: 11, color: ERP.colors.textMuted, marginTop: 10 }}>
            點擊標籤以選取。目前已選：{acornTags.join("、") || "（無）"}
          </div>

          {acornTags.length > 0 && (
            <div style={{ marginTop: 18, paddingTop: 16, borderTop: `1px solid ${ERP.colors.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                <Sliders size={13} color={ERP.colors.accent} />
                <span style={{ fontSize: 12, fontWeight: 800, color: ERP.colors.textPrimary }}>ACORN 權重分配</span>
                <span style={{ fontSize: 11, color: ERP.colors.textMuted }}>Weight Distribution · 合計須為 100%</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {acornTags.map(tag => {
                  const s = ERP.acornTags[tag];
                  const val = acornWeights[tag] ?? 0;
                  return (
                    <div key={tag}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{tag}</span>
                        <span style={{ fontSize: 12, fontWeight: 800, fontFamily: ERP.font.mono }}>{val}%</span>
                      </div>
                      <input
                        type="range" min={0} max={100} value={val}
                        onChange={e => handleWeightChange(tag, Number(e.target.value))}
                        style={{ width: "100%", accentColor: s.color }}
                      />
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: 8, fontSize: 11, fontWeight: 700, color: Object.values(acornWeights).reduce((a, b) => a + b, 0) === 100 ? ERP.colors.success : ERP.colors.red }}>
                合計 {Object.values(acornWeights).reduce((a, b) => a + b, 0)}%
              </div>
            </div>
          )}
        </Section>

        <Section label="成就環境級別" sub="Achievement Level · 決定積點倍率">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            {achievementLevels.map(lv => {
              const selected = String(lv.id) === levelId;
              return (
                <label key={lv.id} style={{
                  display: "flex", flexDirection: "column", gap: 4, cursor: "pointer",
                  padding: "12px 10px", borderRadius: ERP.radius.md, textAlign: "center" as const,
                  border: `1.5px solid ${selected ? ERP.colors.accent : ERP.colors.border}`,
                  background: selected ? ERP.colors.accentPale : ERP.colors.pageBg,
                }}>
                  <input type="radio" name="achievement_level_id" value={String(lv.id)} checked={selected} onChange={() => setLevelId(String(lv.id))} style={{ accentColor: ERP.colors.accent, alignSelf: "center" }} />
                  <span style={{ fontSize: 13, fontWeight: 800, color: selected ? ERP.colors.accent : ERP.colors.textPrimary, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                    <Trophy size={12} /> {lv.code}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: ERP.colors.textSecondary }}>{lv.name_zh_hk}</span>
                  <span style={{ fontSize: 10, color: ERP.colors.textMuted }}>{lv.name_en} · {lv.base_points ?? 0} pts</span>
                </label>
              );
            })}
            {achievementLevels.length === 0 && (
              <div style={{ gridColumn: "1 / -1", fontSize: 12, color: ERP.colors.textMuted }}>尚未設定成就級別。請先執行 AchievementLevelSeeder。</div>
            )}
          </div>
        </Section>

        <Section label="狀態與名單" sub="Status & Roster">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>
            <Field label="活動狀態 Status">
              <div style={{ position: "relative" }}>
                <select value={status} onChange={e => setStatus(e.target.value)} style={{ ...inputStyle, paddingRight: 28, appearance: "none" as const, cursor: "pointer" }}>
                  {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <ChevronDown size={13} color={ERP.colors.textMuted} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              </div>
            </Field>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: ERP.colors.textSecondary, marginBottom: 6 }}>參與名單 Manage Roster</div>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                padding: "12px 14px", borderRadius: ERP.radius.md,
                border: `1px solid ${ERP.colors.border}`, background: ERP.colors.pageBg,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: ERP.radius.md,
                    background: ERP.colors.accentPale, border: `1px solid ${ERP.colors.accentLight}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Users size={16} color={ERP.colors.accent} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: ERP.colors.textPrimary }}>已報名學生</div>
                    <div style={{ fontSize: 11, color: ERP.colors.textMuted }}>Enrolled participants</div>
                  </div>
                </div>
                <span style={{
                  fontSize: 14, fontWeight: 800, color: ERP.colors.accent,
                  background: ERP.colors.accentLight, borderRadius: ERP.radius.full, padding: "2px 10px",
                }}>{enrollmentCount}</span>
              </div>
              {isEdit && rosterUrl ? (
                <a href={rosterUrl} style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 10,
                  width: "100%", boxSizing: "border-box", padding: "9px 14px",
                  borderRadius: ERP.radius.md, border: `1px solid ${ERP.colors.accentLight}`,
                  background: ERP.colors.accentPale, color: ERP.colors.accent,
                  fontSize: 13, fontWeight: 700, fontFamily: F, textDecoration: "none",
                }}>
                  <Users size={14} /> 管理名單
                </a>
              ) : (
                <div style={{ marginTop: 8, fontSize: 11, color: ERP.colors.textMuted }}>儲存活動後即可管理參與名單。</div>
              )}
            </div>
          </div>
        </Section>

        <div style={{
          display: "flex", justifyContent: "flex-end", gap: 10,
          padding: "16px 0 8px",
        }}>
          <button type="button" onClick={goList} style={{
            padding: "10px 18px", border: `1px solid ${ERP.colors.border}`,
            borderRadius: ERP.radius.md, background: ERP.colors.surface,
            color: ERP.colors.textSecondary, cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: F,
          }}>
            取消 Cancel
          </button>
          <button type="button" disabled={saving} onClick={handleSave} style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            padding: "10px 22px", border: "none", borderRadius: ERP.radius.md,
            background: ERP.colors.accent, color: "#fff",
            cursor: saving ? "default" : "pointer", fontSize: 13, fontWeight: 700, fontFamily: F,
            boxShadow: `0 2px 8px ${ERP.colors.accent}40`, opacity: saving ? 0.7 : 1,
          }}>
            <Save size={14} /> {saving ? "儲存中…" : "儲存變更 Save"}
          </button>
        </div>
      </div>
    </div>
  );
};
