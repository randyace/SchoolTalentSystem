// ─────────────────────────────────────────────────────────────────────────────
// Screen 1.C.1  科目管理 / Subjects Management
// Layout: Left Table + Right Slide-out Drawer (active edit state)
// ACORN dimension binding per Tender Mod 3
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect } from "react";
import { ERP } from "./erpTokens";
import {
  Plus, Search, X, ChevronDown, Check, Edit2, Trash2,
  BookOpen, Tag, ShieldCheck, Users, Layers, PlusCircle,
  ArrowLeft, GraduationCap, Clipboard, UserPlus,
  Sliders, BarChart2, AlertCircle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Subject {
  id: string;
  code: string;
  zhName: string;
  enName: string;
  kla: string;
  levels: string[];
  status: "active" | "paused";
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const KLA_OPTIONS = ["語文", "數學", "人文", "科學", "科技", "藝術", "體育"];
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

// ACORN six dimensions — zh labels + English binding names
const ACORN_DIMS = [
  { key:"認知",   enKey:"Academic",      ...ERP.acornTags["認知"]   },
  { key:"社群",   enKey:"Collaborative", ...ERP.acornTags["社群"]   },
  { key:"創意",   enKey:"Opportunity",   ...ERP.acornTags["創意"]   },
  { key:"協作",   enKey:"Realm",         ...ERP.acornTags["協作"]   },
  { key:"領導",   enKey:"Nurturing",     ...ERP.acornTags["領導"]   },
  { key:"體適能", enKey:"Faith",         ...ERP.acornTags["體適能"] },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const KLA_COLOR: Record<string, { bg: string; color: string }> = {
  語文: { bg: "#DBEAFE", color: "#1D4ED8" },
  數學: { bg: "#EDE9FE", color: "#6D28D9" },
  科學: { bg: "#DCFCE7", color: "#15803D" },
  人文: { bg: "#FEF3C7", color: "#92400E" },
  科技: { bg: "#CCFBF1", color: "#0F766E" },
  藝術: { bg: "#FCE7F3", color: "#BE185D" },
  體育: { bg: "#FFEDD5", color: "#C2410C" },
};

// ─── Form State ───────────────────────────────────────────────────────────────
interface SubjectForm {
  code: string; zhName: string; enName: string;
  kla: string; levels: string[]; acorn: string[];
}

const defaultForm = (s: Subject): SubjectForm => ({
  code: s.code, zhName: s.zhName, enName: s.enName,
  kla: s.kla, levels: [...s.levels],
  acorn: s.id === "VA"   ? ["創意", "協作"]
       : s.id === "MATH" ? ["認知", "協作"]
       : ["認知"],
});

// ─── Teaching Groups per Subject ──────────────────────────────────────────────
interface TeachingGroup {
  id: string; zhTitle: string; enTitle: string;
  classes: string; studentCount: number;
}

const TEACHING_GROUPS: Record<string, TeachingGroup[]> = {
  VA: [
    { id: "va-f3", zhTitle: "中三視藝選修組", enTitle: "F3 VA Elective", classes: "3A–3E", studentCount: 42 },
    { id: "va-f4", zhTitle: "中四 DSE 視藝組", enTitle: "F4 VA DSE",     classes: "4A–4D", studentCount: 25 },
  ],
};

// ─── Roster Data ─────────────────────────────────────────────────────────────
interface RosterStudent {
  id: string; name: string; cls: string; studentId: string;
}

const CLASS_BADGE: Record<string, { bg: string; color: string; border: string }> = {
  "3A": { bg: "#DBEAFE", color: "#1D4ED8", border: "#93C5FD" },
  "3B": { bg: "#EDE9FE", color: "#6D28D9", border: "#C4B5FD" },
  "3C": { bg: "#DCFCE7", color: "#15803D", border: "#86EFAC" },
  "3D": { bg: "#FEF3C7", color: "#92400E", border: "#FCD34D" },
  "3E": { bg: "#FCE7F3", color: "#BE185D", border: "#FBCFE8" },
  "4A": { bg: "#DBEAFE", color: "#1D4ED8", border: "#93C5FD" },
  "4B": { bg: "#EDE9FE", color: "#6D28D9", border: "#C4B5FD" },
  "4C": { bg: "#DCFCE7", color: "#15803D", border: "#86EFAC" },
  "4D": { bg: "#FEF3C7", color: "#92400E", border: "#FCD34D" },
};

const ROSTER_DATA: Record<string, RosterStudent[]> = {
  "va-f3": [
    { id: "r1", name: "陳大文", cls: "3A", studentId: "2024-3A-05" },
    { id: "r2", name: "李美玲", cls: "3B", studentId: "2024-3B-12" },
    { id: "r3", name: "張俊傑", cls: "3E", studentId: "2024-3E-01" },
    { id: "r4", name: "王小華", cls: "3C", studentId: "2024-3C-08" },
    { id: "r5", name: "林嘉豪", cls: "3D", studentId: "2024-3D-15" },
    { id: "r6", name: "何雅詩", cls: "3A", studentId: "2024-3A-11" },
    { id: "r7", name: "吳敏兒", cls: "3B", studentId: "2024-3B-07" },
  ],
  "va-f4": [
    { id: "r8",  name: "鄭浩南", cls: "4A", studentId: "2023-4A-03" },
    { id: "r9",  name: "梁凱婷", cls: "4B", studentId: "2023-4B-09" },
    { id: "r10", name: "郭志文", cls: "4C", studentId: "2023-4C-12" },
    { id: "r11", name: "黎子健", cls: "4D", studentId: "2023-4D-06" },
    { id: "r12", name: "陳曉琪", cls: "4A", studentId: "2023-4A-18" },
  ],
};

// ─── Teacher mock data ────────────────────────────────────────────────────────
const TEACHER_OPTIONS = [
  { id: "t1", name: "陳美儀老師",  enName: "Ms. Chan",    dept: "藝術" },
  { id: "t2", name: "黎志明老師",  enName: "Mr. Lai",     dept: "藝術" },
  { id: "t3", name: "張曉琳老師",  enName: "Ms. Cheung",  dept: "語文" },
  { id: "t4", name: "王建國老師",  enName: "Mr. Wong",    dept: "科學" },
  { id: "t5", name: "林偉業老師",  enName: "Mr. Lam",     dept: "體育" },
];

// ─── Assessment Weights Data ──────────────────────────────────────────────────
interface WeightComp { key: string; zhLabel: string; enLabel: string; color: string; bg: string; bd: string }

const WEIGHT_COMPONENTS: WeightComp[] = [
  { key: "participation", zhLabel: "課堂表現",    enLabel: "Participation",    color: "#6366F1", bg: "#EEF2FF", bd: "#C7D2FE" },
  { key: "homework",      zhLabel: "功課 / 習作", enLabel: "Homework",         color: "#0891B2", bg: "#E0F2FE", bd: "#BAE6FD" },
  { key: "tests",         zhLabel: "測驗 / 小考", enLabel: "Tests & Quizzes",  color: "#D97706", bg: "#FFFBEB", bd: "#FDE68A" },
  { key: "exam",          zhLabel: "考試",        enLabel: "Examination",      color: "#059669", bg: "#ECFDF5", bd: "#6EE7B7" },
];

const DEFAULT_SUBJECT_WEIGHTS: Record<string, Record<string, Record<string, number>>> = {
  MATH: { S1: { participation:10, homework:20, tests:30, exam:40 }, S2: { participation:10, homework:15, tests:30, exam:45 }, S3: { participation:5,  homework:15, tests:30, exam:50 } },
  ENG:  { S1: { participation:15, homework:25, tests:25, exam:35 }, S2: { participation:15, homework:20, tests:25, exam:40 }, S3: { participation:10, homework:20, tests:25, exam:45 }, S4: { participation:10, homework:15, tests:25, exam:50 }, S5: { participation:10, homework:10, tests:25, exam:55 } },
  CHI:  { S1: { participation:15, homework:25, tests:25, exam:35 }, S2: { participation:15, homework:20, tests:25, exam:40 }, S3: { participation:10, homework:20, tests:25, exam:45 }, S4: { participation:10, homework:15, tests:25, exam:50 }, S5: { participation:10, homework:10, tests:25, exam:55 } },
  PHY:  { S4: { participation:10, homework:15, tests:25, exam:50 }, S5: { participation:5,  homework:10, tests:20, exam:65 } },
  CHEM: { S4: { participation:10, homework:15, tests:25, exam:50 }, S5: { participation:5,  homework:10, tests:20, exam:65 } },
  HIST: { S1: { participation:20, homework:20, tests:25, exam:35 }, S2: { participation:15, homework:20, tests:25, exam:40 }, S3: { participation:15, homework:15, tests:25, exam:45 } },
  MUS:  { S1: { participation:30, homework:20, tests:20, exam:30 }, S2: { participation:30, homework:20, tests:20, exam:30 }, S3: { participation:25, homework:20, tests:20, exam:35 } },
  PE:   { S1: { participation:40, homework:10, tests:20, exam:30 }, S2: { participation:40, homework:10, tests:20, exam:30 }, S3: { participation:35, homework:10, tests:20, exam:35 }, S4: { participation:30, homework:10, tests:20, exam:40 }, S5: { participation:30, homework:10, tests:20, exam:40 } },
  GEO:  { S1: { participation:15, homework:20, tests:25, exam:40 }, S2: { participation:15, homework:20, tests:25, exam:40 }, S3: { participation:10, homework:15, tests:25, exam:50 } },
  VA:   { S3: { participation:25, homework:25, tests:20, exam:30 }, S4: { participation:20, homework:20, tests:20, exam:40 }, S5: { participation:15, homework:20, tests:20, exam:45 }, S6: { participation:10, homework:15, tests:20, exam:55 } },
};

// ─── WeightsPanel ─────────────────────────────────────────────────────────────
const WeightsPanel: React.FC<{ subject: Subject; onBack: () => void }> = ({ subject, onBack }) => {
  const F = ERP.font.family;
  const [activeLevel, setActiveLevel] = useState(subject.levels[0] ?? "");
  const [weights, setWeights] = useState<Record<string, Record<string, number>>>(() => {
    const base = DEFAULT_SUBJECT_WEIGHTS[subject.id] ?? {};
    return subject.levels.reduce<Record<string, Record<string, number>>>((acc, lvl) => {
      acc[lvl] = base[lvl] ?? { participation: 20, homework: 20, tests: 30, exam: 30 };
      return acc;
    }, {});
  });
  const [saved, setSaved] = useState(false);

  const current = weights[activeLevel] ?? { participation: 20, homework: 20, tests: 30, exam: 30 };
  const total = Object.values(current).reduce((s, v) => s + v, 0);
  const isValid = total === 100;

  const update = (key: string, val: number) =>
    setWeights(w => ({ ...w, [activeLevel]: { ...w[activeLevel], [key]: val } }));

  const handleSave = () => {
    if (!isValid) return;
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <>
      <style>{`
        @keyframes wSave { 0% { transform: scale(0.95); } 50% { transform: scale(1.03); } 100% { transform: scale(1); } }
        input[type=range].wt-slider { -webkit-appearance:none; height:4px; border-radius:2px; outline:none; cursor:pointer; }
        input[type=range].wt-slider::-webkit-slider-thumb { -webkit-appearance:none; width:16px; height:16px; border-radius:50%; border:2px solid #fff; box-shadow:0 1px 4px rgba(0,0,0,0.25); cursor:pointer; }
      `}</style>

      {/* Header */}
      <div style={{ padding: "13px 18px", borderBottom: `1px solid ${ERP.colors.border}`, background: ERP.colors.surface, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 9px", border: `1px solid ${ERP.colors.border}`, borderRadius: ERP.radius.md, background: "transparent", fontSize: 11, fontWeight: 600, color: ERP.colors.textSecondary, cursor: "pointer", fontFamily: F, transition: "all 0.12s" }}
            onMouseEnter={e => { e.currentTarget.style.background = ERP.colors.accentPale; e.currentTarget.style.color = ERP.colors.accent; e.currentTarget.style.borderColor = ERP.colors.accentLight; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = ERP.colors.textSecondary; e.currentTarget.style.borderColor = ERP.colors.border; }}>
            <ArrowLeft size={12} /> 返回科目設定
          </button>
          <div style={{ flex: 1 }} />
          <div style={{ padding: "2px 9px", borderRadius: ERP.radius.full, background: "#FFF7ED", border: "1px solid #FED7AA", fontSize: 10, fontWeight: 700, color: "#C2410C", fontFamily: F }}>
            {ERP.font.mono ? <span style={{ fontFamily: ERP.font.mono }}>{subject.code}</span> : subject.code}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: ERP.radius.sm, background: "#FFF7ED", border: "1px solid #FED7AA", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Sliders size={14} color="#C2410C" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: ERP.colors.textPrimary, fontFamily: F }}>測考與權重</div>
            <div style={{ fontSize: 11, color: ERP.colors.textMuted, fontFamily: F, marginTop: 1 }}>
              Assessment Weights · <span style={{ fontStyle: "italic" }}>{subject.zhName}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px" }}>

        {/* Level tabs */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: ERP.colors.textMuted, letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: 8, fontFamily: F }}>選擇級別 · Select Level</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
            {subject.levels.map(lvl => (
              <button key={lvl} onClick={() => setActiveLevel(lvl)} style={{ padding: "5px 13px", borderRadius: ERP.radius.full, border: `1.5px solid ${activeLevel === lvl ? ERP.colors.accent : ERP.colors.border}`, background: activeLevel === lvl ? ERP.colors.accent : ERP.colors.surface, color: activeLevel === lvl ? "#fff" : ERP.colors.textSecondary, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: F, transition: "all 0.15s" }}>
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Weight components */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
          {WEIGHT_COMPONENTS.map(comp => {
            const val = current[comp.key] ?? 0;
            return (
              <div key={comp.key} style={{ background: comp.bg, border: `1px solid ${comp.bd}`, borderRadius: ERP.radius.lg, padding: "12px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: comp.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: comp.color, fontFamily: F }}>{comp.zhLabel}</span>
                    <span style={{ fontSize: 10, color: ERP.colors.textMuted, fontFamily: F }}>{comp.enLabel}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <input
                      type="number" min={0} max={100} value={val}
                      onChange={e => update(comp.key, Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                      style={{ width: 52, textAlign: "center" as const, padding: "3px 6px", border: `1.5px solid ${comp.bd}`, borderRadius: ERP.radius.sm, fontSize: 14, fontWeight: 800, color: comp.color, background: "#fff", fontFamily: F, outline: "none" }}
                    />
                    <span style={{ fontSize: 13, fontWeight: 700, color: comp.color, fontFamily: F }}>%</span>
                  </div>
                </div>
                <input type="range" min={0} max={100} value={val}
                  onChange={e => update(comp.key, parseInt(e.target.value))}
                  className="wt-slider"
                  style={{ width: "100%", background: `linear-gradient(90deg, ${comp.color} ${val}%, #E2E8F0 ${val}%)` }}
                />
              </div>
            );
          })}
        </div>

        {/* Total indicator */}
        <div style={{ padding: "12px 14px", borderRadius: ERP.radius.lg, background: isValid ? "#F0FDF4" : "#FFF7ED", border: `1px solid ${isValid ? "#BBF7D0" : "#FED7AA"}`, display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          {isValid
            ? <Check size={14} color="#15803D" />
            : <AlertCircle size={14} color="#C2410C" />}
          <span style={{ fontSize: 12, fontWeight: 700, color: isValid ? "#15803D" : "#C2410C", fontFamily: F }}>
            {isValid ? `合計 100% · 權重設定有效` : `合計 ${total}% · 各項權重必須加總至 100%`}
          </span>
        </div>

        {/* Visual bar */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: ERP.colors.textMuted, letterSpacing: "0.05em", textTransform: "uppercase" as const, marginBottom: 6, display: "flex", alignItems: "center", gap: 5, fontFamily: F }}>
            <BarChart2 size={11} color={ERP.colors.textMuted} /> 比例預覽 Visual Breakdown
          </div>
          <div style={{ height: 12, borderRadius: 6, overflow: "hidden", display: "flex", background: ERP.colors.border }}>
            {WEIGHT_COMPONENTS.map(comp => {
              const pct = (current[comp.key] ?? 0);
              return pct > 0 ? <div key={comp.key} title={`${comp.zhLabel} ${pct}%`} style={{ width: `${pct}%`, background: comp.color, transition: "width 0.25s ease", height: "100%" }} /> : null;
            })}
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 7, flexWrap: "wrap" as const }}>
            {WEIGHT_COMPONENTS.map(comp => (
              <div key={comp.key} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: comp.color, flexShrink: 0 }} />
                <span style={{ fontSize: 10, color: ERP.colors.textMuted, fontFamily: F }}>{comp.zhLabel} {current[comp.key] ?? 0}%</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Footer */}
      <div style={{ padding: "12px 18px", borderTop: `1px solid ${ERP.colors.border}`, display: "flex", gap: 10, justifyContent: "flex-end", background: ERP.colors.surface, flexShrink: 0 }}>
        <button onClick={onBack} style={{ padding: "8px 18px", borderRadius: ERP.radius.md, border: `1px solid ${ERP.colors.border}`, background: "transparent", color: ERP.colors.textSecondary, fontSize: 13, fontFamily: F, cursor: "pointer" }}>
          取消 Cancel
        </button>
        <button onClick={handleSave} disabled={!isValid} style={{ padding: "8px 20px", borderRadius: ERP.radius.md, border: "none", background: isValid ? ERP.colors.accent : ERP.colors.border, color: isValid ? "#fff" : ERP.colors.textMuted, fontSize: 13, fontWeight: 700, fontFamily: F, cursor: isValid ? "pointer" : "default", transition: "all 0.15s", boxShadow: isValid ? `0 2px 8px ${ERP.colors.accent}40` : "none", animation: saved ? "wSave 0.3s ease" : "none" }}>
          {saved ? "✓ 已儲存" : "儲存 Save"}
        </button>
      </div>
    </>
  );
};

// ─── CreateGroupPane ──────────────────────────────────────────────────────────
const CreateGroupPane: React.FC<{
  subjectName: string;
  onBack: () => void;
  onCreate: (name: string, teacher: string) => void;
}> = ({ subjectName, onBack, onCreate }) => {
  const F = ERP.font.family;
  const [groupName, setGroupName] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [search,    setSearch]    = useState("");
  const [submitted, setSubmitted] = useState(false);

  const nameErr = submitted && groupName.trim() === "";

  const handleCreate = () => {
    setSubmitted(true);
    if (!groupName.trim()) return;
    onCreate(groupName.trim(), teacherId);
  };

  return (
    <>
      <style>{`
        @keyframes emptyBounce {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-4px); }
        }
      `}</style>

      {/* ── Header ── */}
      <div style={{
        padding: "13px 18px",
        borderBottom: `1px solid ${ERP.colors.border}`,
        background: ERP.colors.surface,
        flexShrink: 0,
      }}>
        {/* Back row */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <button
            onClick={onBack}
            style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: "4px 9px",
              border: `1px solid ${ERP.colors.border}`,
              borderRadius: ERP.radius.md,
              background: "transparent",
              fontSize: 11, fontWeight: 600,
              color: ERP.colors.textSecondary,
              cursor: "pointer", fontFamily: F,
              transition: "all 0.12s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = ERP.colors.accentPale;
              e.currentTarget.style.color = ERP.colors.accent;
              e.currentTarget.style.borderColor = ERP.colors.accentLight;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = ERP.colors.textSecondary;
              e.currentTarget.style.borderColor = ERP.colors.border;
            }}
          >
            <ArrowLeft size={12} />
            返回科目設定
          </button>
          <div style={{ flex: 1 }} />
          {/* Step indicator */}
          <div style={{
            padding: "2px 9px", borderRadius: ERP.radius.full,
            background: "#F0FDF4", border: "1px solid #BBF7D0",
            fontSize: 10, fontWeight: 700, color: "#15803D", fontFamily: F,
          }}>
            新建 New
          </div>
        </div>
        {/* Title */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: ERP.radius.sm,
            background: ERP.colors.accentPale,
            border: `1px solid ${ERP.colors.accentLight}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <PlusCircle size={14} color={ERP.colors.accent} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: ERP.colors.textPrimary, fontFamily: F }}>
              建立新授課分組
            </div>
            <div style={{ fontSize: 11, color: ERP.colors.textMuted, fontFamily: F, marginTop: 1 }}>
              Create New Teaching Group
              <span style={{ color: ERP.colors.textDisabled, margin: "0 4px" }}>·</span>
              科目: {subjectName}
            </div>
          </div>
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "18px 18px 0" }}>

        {/* ── Section 1: Basic Settings ── */}
        <div style={{
          fontSize: 10, fontWeight: 700, color: ERP.colors.textMuted,
          letterSpacing: "0.07em", textTransform: "uppercase" as const,
          marginBottom: 14, display: "flex", alignItems: "center", gap: 5,
        }}>
          <Tag size={10} />基本設定 · Basic Settings
        </div>

        {/* Group Name */}
        <div style={{ marginBottom: 15 }}>
          <label style={{
            display: "block", fontSize: 12, fontWeight: 600,
            color: ERP.colors.textSecondary, marginBottom: 5, fontFamily: F,
          }}>
            分組名稱
            <span style={{ color: ERP.colors.red, marginLeft: 3 }}>*</span>
            <span style={{ fontSize: 10, fontWeight: 400, color: ERP.colors.textMuted, marginLeft: 6 }}>Group Name</span>
          </label>
          <input
            value={groupName}
            onChange={e => { setGroupName(e.target.value); setSubmitted(false); }}
            placeholder="例：中三視藝選修組 A"
            style={{
              width: "100%", boxSizing: "border-box" as const,
              padding: "8px 12px", borderRadius: ERP.radius.md,
              border: `1px solid ${nameErr ? ERP.colors.red : ERP.colors.border}`,
              background: nameErr ? "#FFF5F5" : ERP.colors.surface,
              color: ERP.colors.textPrimary,
              fontSize: 13, fontFamily: F, outline: "none",
              transition: "border-color 0.12s",
            }}
            onFocus={e => { if (!nameErr) e.currentTarget.style.borderColor = ERP.colors.accent; }}
            onBlur={e => { if (!nameErr) e.currentTarget.style.borderColor = ERP.colors.border; }}
          />
          {nameErr && (
            <p style={{ margin: "4px 0 0", fontSize: 11, color: ERP.colors.red, fontFamily: F }}>
              請輸入分組名稱
            </p>
          )}
        </div>

        {/* Teacher Dropdown */}
        <div style={{ marginBottom: 20 }}>
          <label style={{
            display: "block", fontSize: 12, fontWeight: 600,
            color: ERP.colors.textSecondary, marginBottom: 5, fontFamily: F,
          }}>
            負責老師
            <span style={{ fontSize: 10, fontWeight: 400, color: ERP.colors.textMuted, marginLeft: 6 }}>Assigned Teacher</span>
          </label>
          <div style={{ position: "relative" }}>
            <select
              value={teacherId}
              onChange={e => setTeacherId(e.target.value)}
              style={{
                width: "100%", boxSizing: "border-box" as const,
                padding: "8px 32px 8px 12px", borderRadius: ERP.radius.md,
                border: `1px solid ${ERP.colors.border}`,
                background: ERP.colors.surface,
                color: teacherId ? ERP.colors.textPrimary : ERP.colors.textMuted,
                fontSize: 13, fontFamily: F, outline: "none",
                appearance: "none" as const, cursor: "pointer",
              }}
            >
              <option value="">— 選擇老師（可選）—</option>
              {TEACHER_OPTIONS.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.enName}) · {t.dept}
                </option>
              ))}
            </select>
            <ChevronDown size={13} style={{
              position: "absolute", right: 10, top: "50%",
              transform: "translateY(-50%)", pointerEvents: "none",
              color: ERP.colors.textMuted,
            }} />
          </div>
        </div>

        {/* ── Section 2: Student Roster ── */}
        <div style={{
          borderTop: `1px solid ${ERP.colors.border}`,
          paddingTop: 16, marginBottom: 14,
          fontSize: 10, fontWeight: 700, color: ERP.colors.textMuted,
          letterSpacing: "0.07em", textTransform: "uppercase" as const,
          display: "flex", alignItems: "center", gap: 5,
        }}>
          <Users size={10} />學生名單 · Student Roster
        </div>

        {/* Action bar */}
        <div style={{
          display: "flex", gap: 7, alignItems: "center",
          marginBottom: 12,
        }}>
          {/* Search */}
          <div style={{ position: "relative", flex: 1 }}>
            <Search size={12} style={{
              position: "absolute", left: 9, top: "50%",
              transform: "translateY(-50%)",
              color: ERP.colors.textMuted, pointerEvents: "none",
            }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="搜尋學生姓名或學號..."
              style={{
                width: "100%", boxSizing: "border-box" as const,
                height: 32, paddingLeft: 28, paddingRight: 10,
                border: `1px solid ${ERP.colors.border}`,
                borderRadius: ERP.radius.md,
                background: "#fff",
                fontSize: 11, fontFamily: F,
                color: ERP.colors.textPrimary, outline: "none",
              }}
            />
          </div>
          {/* Add button */}
          <button style={{
            height: 32, padding: "0 10px",
            border: "none", borderRadius: ERP.radius.md,
            background: ERP.colors.accent, color: "#fff",
            fontSize: 11, fontWeight: 700, fontFamily: F,
            cursor: "pointer",
            display: "flex", alignItems: "center", gap: 5,
            flexShrink: 0,
            boxShadow: `0 1px 4px ${ERP.colors.accent}40`,
          }}>
            <UserPlus size={12} />
            加入學生
          </button>
          {/* Paste */}
          <button style={{
            height: 32, padding: "0 9px",
            border: `1px solid ${ERP.colors.border}`,
            borderRadius: ERP.radius.md,
            background: "#fff", color: ERP.colors.textSecondary,
            fontSize: 11, fontWeight: 600, fontFamily: F,
            cursor: "pointer",
            display: "flex", alignItems: "center", gap: 5,
            flexShrink: 0,
            transition: "all 0.12s",
          }}
            onMouseEnter={e => {
              e.currentTarget.style.background = ERP.colors.accentPale;
              e.currentTarget.style.color = ERP.colors.accent;
              e.currentTarget.style.borderColor = ERP.colors.accentLight;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "#fff";
              e.currentTarget.style.color = ERP.colors.textSecondary;
              e.currentTarget.style.borderColor = ERP.colors.border;
            }}
          >
            <Clipboard size={12} />
            貼上匯入
          </button>
        </div>

        {/* Empty state */}
        <div style={{
          border: `1.5px dashed ${ERP.colors.border}`,
          borderRadius: ERP.radius.lg,
          background: ERP.colors.pageBg,
          padding: "32px 20px",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          gap: 10, marginBottom: 20,
        }}>
          {/* Animated icon */}
          <div style={{
            width: 52, height: 52, borderRadius: "50%",
            background: ERP.colors.accentPale,
            border: `1.5px solid ${ERP.colors.accentLight}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            animation: "emptyBounce 2.4s ease-in-out infinite",
          }}>
            <GraduationCap size={24} color={ERP.colors.accent} />
          </div>
          <div style={{ textAlign: "center" as const }}>
            <div style={{
              fontSize: 13, fontWeight: 700,
              color: ERP.colors.textSecondary, fontFamily: F,
              marginBottom: 5,
            }}>
              尚未加入學生
            </div>
            <div style={{
              fontSize: 11, color: ERP.colors.textMuted, fontFamily: F,
              lineHeight: 1.6, maxWidth: 240,
            }}>
              點擊「加入學生」搜尋並加入個別學生，
              或使用「貼上匯入」批量匯入學號清單。
            </div>
          </div>
          {/* Quick-add chips hint */}
          <div style={{
            display: "flex", gap: 6, flexWrap: "wrap" as const,
            justifyContent: "center", marginTop: 4,
          }}>
            {["3A全班", "3B全班", "3C全班", "自訂名單"].map(hint => (
              <span key={hint} style={{
                padding: "3px 10px",
                border: `1px solid ${ERP.colors.border}`,
                borderRadius: ERP.radius.full,
                fontSize: 10, fontWeight: 600,
                color: ERP.colors.textMuted, fontFamily: F,
                background: "#fff", cursor: "pointer",
                transition: "all 0.12s",
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = ERP.colors.accentPale;
                  e.currentTarget.style.color = ERP.colors.accent;
                  e.currentTarget.style.borderColor = ERP.colors.accentLight;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "#fff";
                  e.currentTarget.style.color = ERP.colors.textMuted;
                  e.currentTarget.style.borderColor = ERP.colors.border;
                }}
              >
                + {hint}
              </span>
            ))}
          </div>
        </div>

      </div>

      {/* ── Footer ── */}
      <div style={{
        flexShrink: 0,
        padding: "12px 18px",
        borderTop: `1px solid ${ERP.colors.border}`,
        background: ERP.colors.surface,
        display: "flex", gap: 10, justifyContent: "flex-end",
      }}>
        <button
          onClick={onBack}
          style={{
            padding: "8px 18px", borderRadius: ERP.radius.md,
            border: `1px solid ${ERP.colors.border}`, background: "transparent",
            color: ERP.colors.textSecondary, fontSize: 13, fontFamily: F, cursor: "pointer",
            transition: "all 0.12s",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = ERP.colors.surfaceHover;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          取消 Cancel
        </button>
        <button
          onClick={handleCreate}
          style={{
            padding: "8px 22px", borderRadius: ERP.radius.md, border: "none",
            background: ERP.colors.accent, color: "#fff",
            fontSize: 13, fontWeight: 700, fontFamily: F, cursor: "pointer",
            boxShadow: `0 2px 8px ${ERP.colors.accent}40`,
            display: "flex", alignItems: "center", gap: 6,
            transition: "background 0.15s",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = ERP.colors.accentDark)}
          onMouseLeave={e => (e.currentTarget.style.background = ERP.colors.accent)}
        >
          <PlusCircle size={14} />
          建立分組 Create Group
        </button>
      </div>
    </>
  );
};

// ─── RosterPane ───────────────────────────────────────────────────────────────
const RosterPane: React.FC<{
  group:  TeachingGroup;
  onBack: () => void;
  onDone: () => void;
}> = ({ group, onBack, onDone }) => {
  const F = ERP.font.family;
  const MONO = ERP.font.mono;
  const [students,  setStudents]  = useState<RosterStudent[]>(ROSTER_DATA[group.id] ?? []);
  const [search,    setSearch]    = useState("");
  const [addedAnim, setAddedAnim] = useState(false);

  const filtered = students.filter(s =>
    !search || s.name.includes(search) || s.studentId.includes(search)
  );

  const handleRemove = (id: string) => setStudents(prev => prev.filter(s => s.id !== id));

  return (
    <>
      <style>{`
        @keyframes rosterRowIn {
          from { opacity: 0; transform: translateX(12px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes addedPulse {
          0%,100% { box-shadow: none; }
          50%      { box-shadow: 0 0 0 4px rgba(37,99,235,0.18); }
        }
      `}</style>

      {/* ── Roster header ── */}
      <div style={{
        padding: "13px 18px",
        borderBottom: `1px solid ${ERP.colors.border}`,
        background: ERP.colors.surface,
        flexShrink: 0,
      }}>
        {/* Back + close row */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <button
            onClick={onBack}
            style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: "4px 9px",
              border: `1px solid ${ERP.colors.border}`,
              borderRadius: ERP.radius.md,
              background: "transparent",
              fontSize: 11, fontWeight: 600,
              color: ERP.colors.textSecondary,
              cursor: "pointer", fontFamily: F,
              transition: "all 0.12s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = ERP.colors.accentPale;
              e.currentTarget.style.color = ERP.colors.accent;
              e.currentTarget.style.borderColor = ERP.colors.accentLight;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = ERP.colors.textSecondary;
              e.currentTarget.style.borderColor = ERP.colors.border;
            }}
          >
            <ArrowLeft size={12} />
            返回科目設定
          </button>
          <div style={{ flex: 1 }} />
          {/* Live count badge */}
          <div style={{
            padding: "2px 9px", borderRadius: ERP.radius.full,
            background: ERP.colors.accentPale, border: `1px solid ${ERP.colors.accentLight}`,
            fontSize: 10, fontWeight: 700, color: ERP.colors.accent, fontFamily: F,
          }}>
            {students.length} 人
          </div>
        </div>

        {/* Title */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: ERP.radius.sm,
            background: "#FCE7F3",
            border: "1px solid #FBCFE8",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <Users size={14} color="#BE185D" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: ERP.colors.textPrimary, fontFamily: F }}>
              管理名單
            </div>
            <div style={{ fontSize: 11, color: ERP.colors.textMuted, fontFamily: F, marginTop: 1 }}>
              {group.zhTitle}
              <span style={{ color: ERP.colors.textDisabled, margin: "0 4px" }}>·</span>
              <span style={{ fontStyle: "italic" }}>{group.enTitle}</span>
              <span style={{ color: ERP.colors.textDisabled, margin: "0 4px" }}>·</span>
              科目: 視覺藝術
            </div>
          </div>
        </div>
      </div>

      {/* ── Action bar ── */}
      <div style={{
        padding: "10px 16px",
        borderBottom: `1px solid ${ERP.colors.border}`,
        background: ERP.colors.pageBg,
        display: "flex", gap: 7, alignItems: "center",
        flexShrink: 0,
      }}>
        {/* Search */}
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={12} style={{
            position: "absolute", left: 9, top: "50%",
            transform: "translateY(-50%)",
            color: ERP.colors.textMuted, pointerEvents: "none",
          }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜尋學生姓名或學號..."
            style={{
              width: "100%", boxSizing: "border-box" as const,
              height: 32, paddingLeft: 28, paddingRight: 10,
              border: `1px solid ${ERP.colors.border}`,
              borderRadius: ERP.radius.md,
              background: "#fff",
              fontSize: 11.5, fontFamily: F,
              color: ERP.colors.textPrimary, outline: "none",
            }}
          />
        </div>
        {/* Add */}
        <button style={{
          height: 32, padding: "0 10px",
          border: "none", borderRadius: ERP.radius.md,
          background: ERP.colors.accent, color: "#fff",
          fontSize: 11, fontWeight: 700, fontFamily: F,
          cursor: "pointer",
          display: "flex", alignItems: "center", gap: 5,
          flexShrink: 0,
          boxShadow: `0 1px 4px ${ERP.colors.accent}40`,
        }}>
          <UserPlus size={12} />
          加入學生
        </button>
        {/* Paste import */}
        <button style={{
          height: 32, padding: "0 9px",
          border: `1px solid ${ERP.colors.border}`,
          borderRadius: ERP.radius.md,
          background: "#fff", color: ERP.colors.textSecondary,
          fontSize: 11, fontWeight: 600, fontFamily: F,
          cursor: "pointer",
          display: "flex", alignItems: "center", gap: 5,
          flexShrink: 0,
          transition: "all 0.12s",
        }}
          onMouseEnter={e => {
            e.currentTarget.style.background = ERP.colors.accentPale;
            e.currentTarget.style.color = ERP.colors.accent;
            e.currentTarget.style.borderColor = ERP.colors.accentLight;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "#fff";
            e.currentTarget.style.color = ERP.colors.textSecondary;
            e.currentTarget.style.borderColor = ERP.colors.border;
          }}
        >
          <Clipboard size={12} />
          貼上匯入
        </button>
      </div>

      {/* ── Scrollable body ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px 0" }}>

        {/* Cross-class alert */}
        <div style={{
          display: "flex", alignItems: "flex-start", gap: 9,
          padding: "9px 12px",
          background: "#EFF6FF",
          border: "1px solid #BFDBFE",
          borderRadius: ERP.radius.md,
          marginBottom: 12,
        }}>
          <Layers size={13} color={ERP.colors.accent} style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 11, color: "#1E3A8A", fontFamily: F, lineHeight: 1.6 }}>
            此群組包含跨班學生（{group.classes}），目前共 <strong>{students.length} 人</strong>（示例顯示部分名單）。
            <span style={{ color: "#60A5FA", marginLeft: 4 }}>
              Cross-class group · {group.enTitle}
            </span>
          </div>
        </div>

        {/* Table header */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 52px 1fr 60px",
          padding: "6px 10px",
          background: ERP.colors.pageBg,
          border: `1px solid ${ERP.colors.border}`,
          borderRadius: `${ERP.radius.md} ${ERP.radius.md} 0 0`,
          borderBottom: "none",
        }}>
          {[
            { zh: "姓名",    en: "Name"   },
            { zh: "班別",    en: "Class"  },
            { zh: "學號",    en: "ID"     },
            { zh: "操作",    en: "Action" },
          ].map(col => (
            <div key={col.zh} style={{
              fontSize: 10, fontWeight: 700,
              color: ERP.colors.textMuted, fontFamily: F,
              letterSpacing: "0.04em",
            }}>
              {col.zh}
              <span style={{ fontWeight: 400, marginLeft: 3, color: ERP.colors.textDisabled }}>
                {col.en}
              </span>
            </div>
          ))}
        </div>

        {/* Roster rows */}
        <div style={{
          border: `1px solid ${ERP.colors.border}`,
          borderRadius: `0 0 ${ERP.radius.md} ${ERP.radius.md}`,
          overflow: "hidden",
          marginBottom: 16,
        }}>
          {filtered.length === 0 && (
            <div style={{
              padding: "20px 10px", textAlign: "center" as const,
              fontSize: 11, color: ERP.colors.textMuted, fontFamily: F,
            }}>
              {search ? "找不到符合的學生" : "尚未加入任何學生"}
            </div>
          )}
          {filtered.map((s, i) => {
            const badge = CLASS_BADGE[s.cls] ?? { bg: "#F1F5F9", color: "#475569", border: "#CBD5E1" };
            return (
              <div
                key={s.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 52px 1fr 60px",
                  alignItems: "center",
                  padding: "9px 10px",
                  borderBottom: i < filtered.length - 1 ? `1px solid ${ERP.colors.divider}` : "none",
                  background: i % 2 === 0 ? "#fff" : ERP.colors.pageBg,
                  animation: "rosterRowIn 0.22s ease both",
                  animationDelay: `${i * 0.03}s`,
                  transition: "background 0.1s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = ERP.colors.accentPale)}
                onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? "#fff" : ERP.colors.pageBg)}
              >
                {/* Name + avatar */}
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%",
                    background: `${badge.color}18`,
                    border: `1px solid ${badge.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: badge.color, fontFamily: F }}>
                      {s.name.charAt(0)}
                    </span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: ERP.colors.textPrimary, fontFamily: F }}>
                    {s.name}
                  </span>
                </div>
                {/* Class badge */}
                <div>
                  <span style={{
                    display: "inline-flex", alignItems: "center",
                    padding: "2px 7px",
                    background: badge.bg, border: `1px solid ${badge.border}`,
                    borderRadius: ERP.radius.full,
                    fontSize: 10, fontWeight: 800, color: badge.color,
                    fontFamily: F,
                  }}>
                    {s.cls}
                  </span>
                </div>
                {/* Student ID */}
                <div>
                  <span style={{
                    fontSize: 10, color: ERP.colors.textMuted,
                    fontFamily: MONO, letterSpacing: "0.02em",
                  }}>
                    {s.studentId}
                  </span>
                </div>
                {/* Remove */}
                <div>
                  <button
                    onClick={() => handleRemove(s.id)}
                    title="移除學生"
                    style={{
                      display: "flex", alignItems: "center", gap: 3,
                      padding: "3px 7px",
                      border: `1px solid ${ERP.colors.border}`,
                      borderRadius: ERP.radius.sm,
                      background: "transparent",
                      fontSize: 10, fontWeight: 600,
                      color: ERP.colors.textMuted,
                      cursor: "pointer", fontFamily: F,
                      transition: "all 0.12s",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = ERP.colors.errorLight;
                      e.currentTarget.style.color = ERP.colors.error;
                      e.currentTarget.style.borderColor = "#FECACA";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = ERP.colors.textMuted;
                      e.currentTarget.style.borderColor = ERP.colors.border;
                    }}
                  >
                    <Trash2 size={10} />
                    移除
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Load-more hint */}
        {students.length > 0 && (
          <div style={{
            padding: "8px 10px", marginBottom: 12,
            background: ERP.colors.pageBg,
            border: `1px dashed ${ERP.colors.borderStrong}`,
            borderRadius: ERP.radius.md,
            textAlign: "center" as const,
            fontSize: 10.5, color: ERP.colors.textMuted, fontFamily: F,
          }}>
            顯示 {filtered.length} 筆（示例）· 實際群組共 {group.studentCount} 名學生
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div style={{
        flexShrink: 0,
        padding: "12px 16px",
        borderTop: `1px solid ${ERP.colors.border}`,
        background: ERP.colors.surface,
        display: "flex", justifyContent: "flex-end",
      }}>
        <button
          onClick={onDone}
          style={{
            padding: "8px 28px",
            border: "none", borderRadius: ERP.radius.md,
            background: ERP.colors.accent, color: "#fff",
            fontSize: 13, fontWeight: 700, fontFamily: F,
            cursor: "pointer",
            boxShadow: `0 2px 8px ${ERP.colors.accent}40`,
            transition: "background 0.15s",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = ERP.colors.accentDark)}
          onMouseLeave={e => (e.currentTarget.style.background = ERP.colors.accent)}
        >
          完成 Done
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
interface Props { lang?: "en" | "zh-HK" }

export const Screen_Subjects: React.FC<Props> = ({ lang = "zh-HK" }) => {
  const [selectedId,  setSelectedId]  = useState<string | null>("VA");
  const [search,      setSearch]      = useState("");
  const [klaFilter,   setKlaFilter]   = useState("全部");
  const [form,        setForm]        = useState<SubjectForm>(defaultForm(SUBJECTS_DATA.find(s => s.id === "VA")!));
  const [isMobile,    setIsMobile]    = useState(false);
  const [drawerView,  setDrawerView]  = useState<"edit" | "roster" | "create-group" | "weights">("edit");
  const [activeGroup, setActiveGroup] = useState<TeachingGroup | null>(null);
  const [newGroupCreated, setNewGroupCreated] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 900);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const drawerOpen = selectedId !== null;
  const F = ERP.font.family;

  const filtered = SUBJECTS_DATA.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !q || s.code.toLowerCase().includes(q) || s.zhName.includes(search) || s.enName.toLowerCase().includes(q);
    const matchKla = klaFilter === "全部" || s.kla === klaFilter;
    return matchSearch && matchKla;
  });

  const openRoster = (grp: TeachingGroup) => {
    setActiveGroup(grp);
    setDrawerView("roster");
  };

  const backToEdit = () => {
    setDrawerView("edit");
    setActiveGroup(null);
  };

  const handleSelectRow = (s: Subject) => {
    setSelectedId(s.id === selectedId ? null : s.id);
    setDrawerView("edit");
    setActiveGroup(null);
    if (s.id !== selectedId) setForm(defaultForm(s));
  };

  const toggleLevel = (l: string) =>
    setForm(f => ({ ...f, levels: f.levels.includes(l) ? f.levels.filter(x => x !== l) : [...f.levels, l] }));

  const toggleAcorn = (key: string) =>
    setForm(f => ({ ...f, acorn: f.acorn.includes(key) ? f.acorn.filter(x => x !== key) : [...f.acorn, key] }));

  const DRAWER_W = isMobile ? window.innerWidth : 440;

  return (
    <div style={{
      display: "flex",
      height: isMobile ? "auto" : "100%",
      minHeight: isMobile ? "100%" : undefined,
      overflow: isMobile ? "visible" : "hidden",
      background: ERP.colors.pageBg, fontFamily: F,
      flexDirection: isMobile ? "column" : "row",
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
                Subject Management · AY 2025/26 · {SUBJECTS_DATA.length} 個科目
              </p>
            </div>
            <button style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 14px", borderRadius: ERP.radius.md,
              border: "none", background: ERP.colors.accent,
              color: "#fff", fontSize: 13, fontWeight: 600, fontFamily: F, cursor: "pointer",
            }}>
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
                {KLA_OPTIONS.map(k => <option key={k} value={k}>{k}</option>)}
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
                  const klaStyle = KLA_COLOR[s.kla] ?? { bg: ERP.colors.accentPale, color: ERP.colors.accent };
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
                  minWidth: 520, display: "grid",
                  gridTemplateColumns: "90px 1fr 90px 160px 80px 80px",
                  background: ERP.colors.pageBg, borderBottom: `1px solid ${ERP.colors.border}`,
                  padding: "0 16px",
                }}>
                  {["科目代碼", "科目名稱", "學習領域", "開設級別", "狀態", "操作"].map((h, i) => (
                    <div key={i} style={{ padding: "11px 8px 11px 0", fontSize: 11, fontWeight: 700, color: ERP.colors.textMuted, letterSpacing: "0.5px", textTransform: "uppercase" as const }}>{h}</div>
                  ))}
                </div>
                {filtered.map((s, idx) => {
                  const isSelected = selectedId === s.id;
                  const klaStyle = KLA_COLOR[s.kla] ?? { bg: ERP.colors.accentPale, color: ERP.colors.accent };
                  return (
                    <div
                      key={s.id}
                      onClick={() => handleSelectRow(s)}
                      style={{
                        minWidth: 520, display: "grid",
                        gridTemplateColumns: "90px 1fr 90px 160px 80px 80px",
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
              <span style={{ fontSize: 12, color: ERP.colors.textMuted }}>顯示 {filtered.length} / {SUBJECTS_DATA.length} 個科目</span>
              {selectedId && (
                <span style={{ fontSize: 11, color: ERP.colors.accent, background: ERP.colors.accentPale, padding: "1px 8px", borderRadius: ERP.radius.full, fontWeight: 600 }}>
                  已選取：{SUBJECTS_DATA.find(s => s.id === selectedId)?.zhName}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT DRAWER ────────────────────────────────────────────────── */}
      <div style={{
        width: drawerOpen ? DRAWER_W : 0,
        transition: "width 0.22s cubic-bezier(0.4,0,0.2,1)",
        overflow: "hidden",
        flexShrink: 0,
        borderLeft: drawerOpen ? `1px solid ${ERP.colors.border}` : "none",
        boxShadow: drawerOpen ? "-4px 0 16px rgba(0,0,0,0.06)" : "none",
      }}>
        {/* Slide-track: three panels side-by-side, translated on view change */}
        <div style={{ width: DRAWER_W, height: "100%", overflow: "hidden", position: "relative" }}>
        <div style={{
          display: "flex", height: "100%",
          transform: drawerView === "edit"
            ? "translateX(0)"
            : drawerView === "roster"
            ? `translateX(-${DRAWER_W}px)`
            : drawerView === "create-group"
            ? `translateX(-${2 * DRAWER_W}px)`
            : `translateX(-${3 * DRAWER_W}px)`,
          transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
        }}>

        {/* ── Panel 1: Edit form ── */}
        <div style={{ width: DRAWER_W, flexShrink: 0, height: "100%", display: "flex", flexDirection: "column", background: ERP.colors.surface }}>

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
                <span style={{ fontSize: 15, fontWeight: 700, color: ERP.colors.textPrimary }}>編輯科目</span>
                <span style={{ fontFamily: ERP.font.mono, fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: ERP.radius.xs, background: ERP.colors.accentLight, color: ERP.colors.accent }}>{form.code}</span>
              </div>
              <div style={{ fontSize: 11, color: ERP.colors.textMuted, marginTop: 3, marginLeft: 36 }}>
                Edit Subject · 修改科目資料
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
                  value={form.kla}
                  onChange={e => setForm(f => ({ ...f, kla: e.target.value }))}
                  style={{ ...inputStyle, paddingRight: 32, appearance: "none" as const, cursor: "pointer" }}
                >
                  {KLA_OPTIONS.map(k => <option key={k} value={k}>{k}</option>)}
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

            {/* Divider */}
            <div style={{ borderTop: `1px solid ${ERP.colors.border}`, margin: "20px 0 18px", position: "relative" }}>
              <span style={{ position: "absolute", top: -9, left: 0, background: ERP.colors.surface, paddingRight: 10, fontSize: 11, fontWeight: 700, color: ERP.colors.textMuted, letterSpacing: "0.07em", textTransform: "uppercase" as const, display: "flex", alignItems: "center", gap: 5 }}>
                <ShieldCheck size={11} />ACORN 預設維度綁定 · Default ACORN Binding
              </span>
            </div>

            <p style={{ margin: "0 0 12px", fontSize: 11, color: ERP.colors.textMuted, lineHeight: 1.5 }}>
              選擇此科目自動關聯的 ACORN 評估維度。AI 系統將依據此設定進行成就歸類。
            </p>

            {/* ACORN checkboxes — 3×2 grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 24 }}>
              {ACORN_DIMS.map(dim => {
                const checked = form.acorn.includes(dim.key);
                return (
                  <button
                    key={dim.key}
                    onClick={() => toggleAcorn(dim.key)}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "9px 10px", borderRadius: ERP.radius.md, textAlign: "left" as const,
                      background: checked ? dim.bg : ERP.colors.pageBg,
                      border: `1.5px solid ${checked ? dim.border : ERP.colors.border}`,
                      cursor: "pointer", transition: "all 0.12s", fontFamily: F,
                      boxShadow: checked ? `0 0 0 3px ${dim.bg}` : "none",
                    }}
                  >
                    <div style={{
                      width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                      background: checked ? dim.color : "transparent",
                      border: `2px solid ${checked ? dim.color : ERP.colors.borderStrong}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.12s",
                    }}>
                      {checked && <Check size={10} color="#fff" strokeWidth={3} />}
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: checked ? dim.color : ERP.colors.textPrimary, lineHeight: 1 }}>{dim.key}</div>
                      <div style={{ fontSize: 9, color: ERP.colors.textMuted, marginTop: 2 }}>{dim.enKey}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected summary */}
            {form.acorn.length > 0 && (
              <div style={{ padding: "8px 12px", background: ERP.colors.accentPale, borderRadius: ERP.radius.md, border: `1px solid ${ERP.colors.accentLight}`, marginBottom: 20, display: "flex", gap: 6, flexWrap: "wrap" as const, alignItems: "center" }}>
                <span style={{ fontSize: 11, color: ERP.colors.accent, fontWeight: 600, whiteSpace: "nowrap" as const }}>已綁定：</span>
                {form.acorn.map(k => {
                  const d = ACORN_DIMS.find(d => d.key === k)!;
                  return <span key={k} style={{ fontSize: 11, padding: "1px 7px", borderRadius: 9999, background: d.bg, color: d.color, border: `1px solid ${d.border}`, fontWeight: 600 }}>{k}</span>;
                })}
              </div>
            )}

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
                <div style={{ fontSize: 11, color: "#B45309", marginTop: 2, fontFamily: F }}>Configure assessment component weights per level</div>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                {WEIGHT_COMPONENTS.map(c => (
                  <div key={c.key} title={c.zhLabel} style={{ width: 8, height: 28, borderRadius: 3, background: c.color, opacity: 0.75 }} />
                ))}
              </div>
            </button>

            {/* ── Section 4: Teaching Groups & Rosters ──────────────────── */}
            <div style={{
              borderTop: `1px solid ${ERP.colors.border}`,
              margin: "4px 0 18px",
              position: "relative",
            }}>
              <span style={{
                position: "absolute", top: -9, left: 0,
                background: ERP.colors.surface, paddingRight: 10,
                fontSize: 11, fontWeight: 700, color: ERP.colors.textMuted,
                letterSpacing: "0.07em", textTransform: "uppercase" as const,
                display: "flex", alignItems: "center", gap: 5,
              }}>
                <Layers size={11} />授課分組與學生名單 · Teaching Groups
              </span>
            </div>

            <p style={{ margin: "0 0 14px", fontSize: 11, color: ERP.colors.textMuted, lineHeight: 1.6 }}>
              管理修讀此科目的跨班選修組別及學生名單。
              <span style={{ color: ERP.colors.textDisabled }}> Manage cross-class teaching groups and student enrollments for this subject.</span>
            </p>

            {/* Group cards */}
            {(() => {
              const groups = TEACHING_GROUPS[selectedId ?? ""] ?? [];
              return groups.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 12 }}>
                  {groups.map((grp, gi) => (
                    <div key={grp.id} style={{
                      border: `1px solid ${ERP.colors.border}`,
                      borderRadius: ERP.radius.lg,
                      background: ERP.colors.pageBg,
                      overflow: "hidden",
                      transition: "box-shadow 0.15s",
                    }}
                      onMouseEnter={e => (e.currentTarget.style.boxShadow = ERP.shadow.sm)}
                      onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
                    >
                      {/* Card top accent strip */}
                      <div style={{
                        height: 3,
                        background: gi === 0
                          ? "linear-gradient(90deg, #BE185D, #DB2777)"
                          : "linear-gradient(90deg, #1D4ED8, #6366F1)",
                      }} />

                      <div style={{
                        padding: "10px 13px",
                        display: "flex", alignItems: "center", gap: 10,
                      }}>
                        {/* Icon */}
                        <div style={{
                          width: 34, height: 34, borderRadius: ERP.radius.md,
                          background: gi === 0 ? "#FCE7F3" : ERP.colors.accentPale,
                          border: `1px solid ${gi === 0 ? "#FBCFE8" : ERP.colors.accentLight}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0,
                        }}>
                          <GraduationCap size={16} color={gi === 0 ? "#BE185D" : ERP.colors.accent} />
                        </div>

                        {/* Labels */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: 12.5, fontWeight: 700,
                            color: ERP.colors.textPrimary, fontFamily: F,
                            whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis",
                          }}>
                            {grp.zhTitle}
                          </div>
                          <div style={{
                            fontSize: 10.5, color: ERP.colors.textMuted, fontFamily: F,
                            marginTop: 2,
                          }}>
                            {grp.enTitle}
                          </div>
                          {/* Meta chips */}
                          <div style={{ display: "flex", gap: 6, marginTop: 5, flexWrap: "wrap" as const }}>
                            <span style={{
                              display: "inline-flex", alignItems: "center", gap: 3,
                              padding: "1px 7px",
                              background: "#fff",
                              border: `1px solid ${ERP.colors.border}`,
                              borderRadius: ERP.radius.full,
                              fontSize: 10, color: ERP.colors.textSecondary, fontFamily: F,
                            }}>
                              <span style={{
                                fontSize: 9, fontWeight: 700,
                                color: ERP.colors.textMuted,
                              }}>跨班</span>
                              {grp.classes}
                            </span>
                            <span style={{
                              display: "inline-flex", alignItems: "center", gap: 3,
                              padding: "1px 7px",
                              background: "#fff",
                              border: `1px solid ${ERP.colors.border}`,
                              borderRadius: ERP.radius.full,
                              fontSize: 10, fontWeight: 700,
                              color: ERP.colors.accent, fontFamily: F,
                            }}>
                              <Users size={9} />
                              {grp.studentCount} 人
                            </span>
                          </div>
                        </div>

                        {/* Manage button */}
                        <button
                          onClick={() => openRoster(grp)}
                          style={{
                          display: "flex", alignItems: "center", gap: 5,
                          padding: "6px 10px",
                          border: `1.5px solid ${ERP.colors.border}`,
                          borderRadius: ERP.radius.md,
                          background: "#fff",
                          fontSize: 11, fontWeight: 700,
                          color: ERP.colors.accent,
                          cursor: "pointer", fontFamily: F,
                          whiteSpace: "nowrap" as const,
                          transition: "all 0.12s",
                          flexShrink: 0,
                        }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = ERP.colors.accentPale;
                            e.currentTarget.style.borderColor = ERP.colors.accentLight;
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = "#fff";
                            e.currentTarget.style.borderColor = ERP.colors.border;
                          }}
                        >
                          <Users size={12} />
                          👥 管理名單
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  padding: "14px 16px", marginBottom: 12,
                  background: ERP.colors.pageBg,
                  border: `1px dashed ${ERP.colors.borderStrong}`,
                  borderRadius: ERP.radius.lg,
                  textAlign: "center" as const,
                  fontSize: 11, color: ERP.colors.textMuted, fontFamily: F,
                }}>
                  此科目尚未設立授課分組
                </div>
              );
            })()}

            {/* Create new group — dashed CTA */}
            <button
              onClick={() => setDrawerView("create-group")}
              style={{
              width: "100%", boxSizing: "border-box" as const,
              padding: "10px 16px", marginBottom: 24,
              border: `1.5px dashed ${ERP.colors.accent}`,
              borderRadius: ERP.radius.lg,
              background: ERP.colors.accentPale,
              fontSize: 12, fontWeight: 700,
              color: ERP.colors.accent,
              cursor: "pointer", fontFamily: F,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
              transition: "all 0.15s",
            }}
              onMouseEnter={e => {
                e.currentTarget.style.background = ERP.colors.accentLight;
                e.currentTarget.style.borderColor = ERP.colors.accentDark;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = ERP.colors.accentPale;
                e.currentTarget.style.borderColor = ERP.colors.accent;
              }}
            >
              <PlusCircle size={14} />
              + 建立新授課分組
              <span style={{ fontSize: 11, fontWeight: 400, color: ERP.colors.accentMid }}>
                Create New Teaching Group
              </span>
            </button>

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
              儲存變更 Save Changes
            </button>
          </div>

        </div>{/* end Panel 1 */}

        {/* ── Panel 2: Roster pane ── */}
        <div style={{ width: DRAWER_W, flexShrink: 0, height: "100%", display: "flex", flexDirection: "column", background: ERP.colors.surface }}>
          {activeGroup && (
            <RosterPane
              group={activeGroup}
              onBack={backToEdit}
              onDone={() => { setSelectedId(null); setDrawerView("edit"); setActiveGroup(null); }}
            />
          )}
        </div>

        {/* ── Panel 3: Create Group pane ── */}
        <div style={{ width: DRAWER_W, flexShrink: 0, height: "100%", display: "flex", flexDirection: "column", background: ERP.colors.surface }}>
          <CreateGroupPane
            subjectName={SUBJECTS_DATA.find(s => s.id === selectedId)?.zhName ?? ""}
            onBack={backToEdit}
            onCreate={(name, teacher) => {
              setNewGroupCreated(true);
              backToEdit();
            }}
          />
        </div>

        {/* ── Panel 4: Assessment Weights pane ── */}
        <div style={{ width: DRAWER_W, flexShrink: 0, height: "100%", display: "flex", flexDirection: "column", background: ERP.colors.surface }}>
          {selectedId && (
            <WeightsPanel
              subject={SUBJECTS_DATA.find(s => s.id === selectedId)!}
              onBack={backToEdit}
            />
          )}
        </div>

        </div>{/* end slide-track */}
        </div>{/* end overflow wrapper */}
      </div>
    </div>
  );
};
