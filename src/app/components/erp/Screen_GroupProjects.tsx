// ─────────────────────────────────────────────────────────────────────────────
// Screen 1.E.1  分組專題 / Group Projects
// UI Pattern: Kanban Board + PBL Create Modal
// Mod M6a: AI 鷹架指令 (AI Scaffold Prompt) — prominent textarea
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useRef } from "react";
import { ERP } from "./erpTokens";
import {
  Plus, X, Calendar, Users, BookOpen, ChevronDown,
  Sparkles, Columns, MoreHorizontal, Clock,
  CheckCircle2, Circle, AlertCircle, Tag, Send, Loader2, Sliders,
} from "lucide-react";
import { AcornBinding, DEFAULT_ACORN_ITEMS, normalizeAcornTagKeys } from "./AcornBinding";

// ─── Types ────────────────────────────────────────────────────────────────────
type KanbanStatus = "draft" | "active" | "completed";
type GroupMode    = "teacher" | "system" | "student";

export interface Project {
  id:         string | number;
  name:       string;
  subjects:   string[];
  subjectIds?: number[];
  groupMode:  GroupMode;
  deadline:   string;
  teamCount:  number;
  status:     KanbanStatus;
  acornDims:  string[];
  acornIds?:  number[];
  acornWeights?: Record<string, number>;
  acorn_weights?: Record<string, number>;
  scaffold:   string;
  form?:      string;
  targetForms?: string[];
  target_forms?: string[];
  teacherIds?: number[];
  teachers?: Array<{ id: number; name: string }>;
  academic_year?: string;
}

export type ProjectSubjectOpt = { id: number; label: string; name_zh_hk?: string; code?: string };
export type ProjectAcornOpt = { id: number; code: string; name_en: string; name_zh_hk: string };
export type ProjectTeacherOpt = { id: number; name: string; label?: string; role?: string };

// ─── Mock Data ────────────────────────────────────────────────────────────────
const SUBJECT_OPTIONS = ["數學", "英語文學", "中國語文", "物理", "化學", "生物", "歷史", "地理", "視覺藝術", "音樂"];

const MOCK_PROJECTS: Project[] = [
  {
    id: "p1", name: "STEM 橋樑承重挑戰",
    subjects: ["物理", "數學"],
    groupMode: "teacher", deadline: "2026-09-30", teamCount: 6, status: "draft",
    acornDims: ["創意", "協作"],
    scaffold: "你認為橋樑能承受多大力量？請從材料特性出發，提出你的假設並設計實驗驗證。",
  },
  {
    id: "p2", name: "全球暖化政策辯論",
    subjects: ["地理", "英語文學"],
    groupMode: "system", deadline: "2026-10-15", teamCount: 4, status: "draft",
    acornDims: ["社群", "領導"],
    scaffold: "如果你是政府官員，你會如何在經濟發展與環保之間取得平衡？請先收集證據，再建構你的論點。",
  },
  {
    id: "p3", name: "社區口述歷史記錄計劃",
    subjects: ["歷史", "中國語文"],
    groupMode: "student", deadline: "2026-11-01", teamCount: 5, status: "active",
    acornDims: ["社群", "認知"],
    scaffold: "在訪問長者前，你需要問哪些關鍵問題？你如何確保敘述的準確性及尊重性？",
  },
  {
    id: "p4", name: "可持續校園設計提案",
    subjects: ["地理", "視覺藝術", "數學"],
    groupMode: "teacher", deadline: "2026-09-15", teamCount: 7, status: "active",
    acornDims: ["創意", "協作", "社群"],
    scaffold: "一個理想的可持續校園需要具備什麼元素？請參考聯合國可持續發展目標，提出你的設計願景。",
  },
  {
    id: "p5", name: "數位音樂創作工作坊",
    subjects: ["音樂", "視覺藝術"],
    groupMode: "student", deadline: "2026-08-30", teamCount: 3, status: "active",
    acornDims: ["創意", "體適能"],
    scaffold: "音樂如何傳遞情感？請嘗試創作一段能表達你個人故事的原創樂段，並解釋你的創作選擇。",
  },
  {
    id: "p6", name: "S1 入學適應研究報告",
    subjects: ["中國語文"],
    groupMode: "system", deadline: "2026-06-30", teamCount: 4, status: "completed",
    acornDims: ["社群", "認知"],
    scaffold: "新生在適應中學生活時面臨哪些挑戰？你如何透過問卷及訪談收集數據？",
  },
  {
    id: "p7", name: "古詩詞現代詮釋展覽",
    subjects: ["中國語文", "視覺藝術"],
    groupMode: "teacher", deadline: "2026-05-20", teamCount: 5, status: "completed",
    acornDims: ["創意", "認知"],
    scaffold: "古代詩人如何用意象傳達情感？你會選擇哪首詩作為創作靈感，原因是什麼？",
  },
];

const GROUP_MODE_CFG: Record<GroupMode, { label: string; enLabel: string; color: string; bg: string }> = {
  teacher: { label: "教師手動",  enLabel: "Teacher-assigned", color: "#1D4ED8", bg: "#DBEAFE" },
  system:  { label: "系統隨機",  enLabel: "System random",    color: "#6D28D9", bg: "#EDE9FE" },
  student: { label: "學生自由",  enLabel: "Student free",     color: "#15803D", bg: "#DCFCE7" },
};

const KANBAN_CFG: Record<KanbanStatus, { label: string; enLabel: string; icon: React.ReactNode; accent: string; bg: string; border: string }> = {
  draft:     { label: "草稿",   enLabel: "Draft",      icon: <Circle size={13} />,       accent: "#64748B", bg: "#F8FAFC", border: "#E2E8F0" },
  active:    { label: "進行中", enLabel: "In Progress", icon: <AlertCircle size={13} />,  accent: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE" },
  completed: { label: "已完結", enLabel: "Completed",   icon: <CheckCircle2 size={13} />, accent: "#15803D", bg: "#F0FDF4", border: "#BBF7D0" },
};

const ACORN_DIMS = Object.keys(ERP.acornTags);
const DEADLINE_MIN = "2026-08-08";

// ─── AI Scaffold placeholder ───────────────────────────────────────────────────
const AI_SCAFFOLD_PLACEHOLDER = `（Mod M6a — 蘇格拉底式提問鷹架）

請以開放式問題引導學生，例如：
• 你認為這個問題的核心假設是什麼？
• 你會如何設計實驗來驗證你的想法？
• 如果你的假設被推翻了，你下一步會怎麼做？

AI 將根據此指令，在學生提交成果時提供個人化回饋。`;

// ─── Sub-components ───────────────────────────────────────────────────────────
const AcornChip: React.FC<{ dim: string; small?: boolean }> = ({ dim, small }) => {
  const t = ERP.acornTags[dim] ?? { bg: ERP.colors.accentPale, color: ERP.colors.accent, border: ERP.colors.accentLight, label: dim };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: small ? "1px 5px" : "2px 7px",
      borderRadius: 9999, fontSize: small ? 9 : 10, fontWeight: 700,
      background: t.bg, color: t.color, border: `1px solid ${t.border}`,
      fontFamily: ERP.font.family,
    }}>{t.label || dim}</span>
  );
};

const ProjectCard: React.FC<{ project: Project; onEdit: () => void; groupsUrl?: string }> = ({ project, onEdit, groupsUrl }) => {
  const gm = GROUP_MODE_CFG[project.groupMode];
  const F  = ERP.font.family;
  return (
    <div style={{
      background: ERP.colors.surface, borderRadius: ERP.radius.lg,
      border: `1px solid ${ERP.colors.border}`, marginBottom: 10,
      padding: "14px 16px", cursor: "pointer",
      boxShadow: ERP.shadow.xs, transition: "box-shadow 0.1s",
    }}
      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.boxShadow = ERP.shadow.sm}
      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.boxShadow = ERP.shadow.xs}
      onClick={onEdit}
    >
      {/* Title row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: ERP.colors.textPrimary, fontFamily: F, flex: 1, paddingRight: 8, lineHeight: 1.4 }}>{project.name}</div>
        <button onClick={e => { e.stopPropagation(); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: ERP.colors.textMuted, display: "flex", flexShrink: 0 }}>
          <MoreHorizontal size={14} />
        </button>
      </div>

      {/* Subjects */}
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" as const, marginBottom: 8 }}>
        {project.subjects.map(s => (
          <span key={s} style={{ fontSize: 10, padding: "1px 6px", borderRadius: ERP.radius.xs, background: ERP.colors.accentPale, color: ERP.colors.accent, fontWeight: 600 }}>{s}</span>
        ))}
        {(project.targetForms || project.target_forms || (project.form ? [project.form] : [])).map(f => (
          <span key={f} style={{ fontSize: 10, padding: "1px 6px", borderRadius: ERP.radius.xs, background: "#FEF3C7", color: "#92400E", fontWeight: 700, border: "1px solid #FCD34D" }}>{f}</span>
        ))}
      </div>

      {/* ACORN dims */}
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" as const, marginBottom: 10 }}>
        {project.acornDims.map(d => <AcornChip key={d} dim={d} small />)}
      </div>

      {/* Meta row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: 6, marginBottom: groupsUrl ? 10 : 0 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10, color: ERP.colors.textMuted, fontFamily: F }}>
            <Users size={10} /> {project.teamCount} 組
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10, color: ERP.colors.textMuted, fontFamily: F }}>
            <Calendar size={10} /> {project.deadline ? project.deadline.slice(5) : "—"}
          </span>
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 9999, background: gm.bg, color: gm.color }}>{gm.label}</span>
      </div>

      {groupsUrl && (
        <a
          href={groupsUrl}
          onClick={e => e.stopPropagation()}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            width: "100%", boxSizing: "border-box", padding: "7px 10px",
            borderRadius: ERP.radius.md, border: `1px solid ${ERP.colors.accent}55`,
            background: ERP.colors.accentPale, color: ERP.colors.accent,
            fontSize: 12, fontWeight: 700, fontFamily: F, textDecoration: "none",
          }}
        >
          <Users size={13} /> 管理分組 Manage Groups
        </a>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
interface Props {
  lang?: "en" | "zh-HK";
  projects?: Project[];
  subjects?: ProjectSubjectOpt[];
  acorns?: ProjectAcornOpt[];
  teachers?: ProjectTeacherOpt[];
  academicYear?: string;
  openForm?: boolean;
  projectId?: number | null;
  initialProject?: Project | null;
  storeUrl?: string;
  updateUrl?: string;
  listUrl?: string;
  groupsUrlBase?: string;
  generateScaffoldUrl?: string;
  flashSuccess?: string;
  flashError?: string;
}

const FORM_OPTIONS = ["F1", "F2", "F3", "F4", "F5", "F6"];

function initialTargetForms(p?: Project | null): string[] {
  const raw = p?.targetForms || p?.target_forms;
  if (Array.isArray(raw) && raw.length) return raw.map(String);
  if (p?.form) return [String(p.form)];
  return ["F3"];
}

function initialAcornTags(p?: Project | null): string[] {
  const dims = normalizeAcornTagKeys(p?.acornDims || []);
  if (dims.length) return dims;
  const w = p?.acornWeights || p?.acorn_weights || {};
  return normalizeAcornTagKeys(Object.keys(w).filter(k => (w as Record<string, number>)[k] > 0));
}

function evenWeights(tags: string[]): Record<string, number> {
  if (!tags.length) return {};
  const base = Math.floor(100 / tags.length);
  const rem = 100 - base * tags.length;
  const out: Record<string, number> = {};
  tags.forEach((t, i) => { out[t] = base + (i < rem ? 1 : 0); });
  return out;
}

export const Screen_GroupProjects: React.FC<Props> = ({
  lang = "zh-HK",
  projects: projectsProp,
  subjects: subjectsProp,
  acorns: acornsProp,
  teachers: teachersProp,
  academicYear = "2025/26",
  openForm = false,
  projectId = null,
  initialProject = null,
  storeUrl = "/projects",
  updateUrl = "/projects/update",
  listUrl = "/projects",
  groupsUrlBase = "/projects/groups",
  generateScaffoldUrl = "/projects/generate-scaffold",
  flashSuccess,
  flashError,
}) => {
  const live = Array.isArray(projectsProp);
  const [projects, setProjects]   = useState<Project[]>(() => live ? (projectsProp || []) : MOCK_PROJECTS);
  const [modalOpen, setModalOpen] = useState(!!openForm || !!initialProject);
  const [editId,    setEditId]    = useState<string | null>(initialProject ? String(initialProject.id) : (projectId ? String(projectId) : null));
  const [isMobile,  setIsMobile]  = useState(false);
  const [saving, setSaving] = useState<"draft" | "publish" | null>(null);
  const [scaffoldBusy, setScaffoldBusy] = useState(false);
  const [scaffoldFlash, setScaffoldFlash] = useState(false);
  const scaffoldRef = useRef<HTMLTextAreaElement | null>(null);

  const subjectOptions = subjectsProp && subjectsProp.length
    ? subjectsProp.map(s => ({ id: s.id, label: s.label || s.name_zh_hk || s.code || String(s.id) }))
    : SUBJECT_OPTIONS.map((label, i) => ({ id: i + 1, label }));
  const acornOptions = acornsProp && acornsProp.length
    ? acornsProp
    : ACORN_DIMS.map((zh, i) => ({ id: i + 1, code: "", name_en: zh, name_zh_hk: zh }));
  const teacherOptions = teachersProp && teachersProp.length
    ? teachersProp
    : [
        { id: 1, name: "陳老師", label: "陳老師 (teacher)" },
        { id: 2, name: "李老師", label: "李老師 (teacher)" },
        { id: 3, name: "王老師", label: "王老師 (teacher)" },
      ];

  // Form state
  const [fName,      setFName]      = useState(initialProject?.name || "");
  const [fForms,     setFForms]     = useState<string[]>(() => initialTargetForms(initialProject));
  const [fTeacherIds, setFTeacherIds] = useState<number[]>(initialProject?.teacherIds || []);
  const [fSubjectIds, setFSubjectIds] = useState<number[]>(initialProject?.subjectIds || []);
  const [fGroupMode, setFGroupMode] = useState<GroupMode>(initialProject?.groupMode || "teacher");
  const [fDeadline,  setFDeadline]  = useState(initialProject?.deadline || "");
  const [fScaffold,  setFScaffold]  = useState(initialProject?.scaffold || "");
  const [fAcornTags, setFAcornTags] = useState<string[]>(() => initialAcornTags(initialProject));
  const [fAcornWeights, setFAcornWeights] = useState<Record<string, number>>(() => {
    const w = initialProject?.acornWeights || initialProject?.acorn_weights || {};
    const tags = initialAcornTags(initialProject);
    return Object.keys(w).length ? { ...w } : evenWeights(tags);
  });
  const [fSubOpen,   setFSubOpen]   = useState(false);
  const [fTeachOpen, setFTeachOpen] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (live) setProjects(projectsProp || []);
  }, [live, projectsProp]);

  const F = ERP.font.family;

  const openCreate = () => {
    setEditId(null);
    setFName(""); setFForms(["F3"]); setFTeacherIds([]); setFSubjectIds([]); setFGroupMode("teacher");
    setFDeadline(""); setFScaffold(""); setFAcornTags([]); setFAcornWeights({});
    setModalOpen(true);
  };

  const openEdit = (p: Project) => {
    setEditId(String(p.id));
    setFName(p.name);
    setFForms(initialTargetForms(p));
    setFTeacherIds([...(p.teacherIds || (p.teachers || []).map(t => t.id))]);
    setFSubjectIds([...(p.subjectIds || [])]);
    setFGroupMode(p.groupMode);
    setFDeadline(p.deadline);
    setFScaffold(p.scaffold);
    const tags = initialAcornTags(p);
    setFAcornTags(tags);
    const w = p.acornWeights || p.acorn_weights || {};
    setFAcornWeights(Object.keys(w).length ? { ...w } : evenWeights(tags));
    if ((!p.subjectIds || p.subjectIds.length === 0) && p.subjects?.length) {
      const ids = p.subjects
        .map(name => subjectOptions.find(s => s.label === name)?.id)
        .filter((x): x is number => typeof x === "number");
      setFSubjectIds(ids);
    }
    setModalOpen(true);
  };

  const toggleAcornTag = (value: string) => {
    setFAcornTags(prev => {
      const next = prev.includes(value) ? prev.filter(t => t !== value) : [...prev, value];
      setFAcornWeights(evenWeights(next));
      return next;
    });
  };

  const handleWeightChange = (tag: string, val: number) => {
    setFAcornWeights(prev => {
      const others = fAcornTags.filter(t => t !== tag);
      const remaining = Math.max(0, 100 - val);
      const othersOldSum = others.reduce((s, t) => s + (prev[t] ?? 0), 0);
      const next: Record<string, number> = { ...prev, [tag]: val };
      if (others.length === 0) return next;
      let allocated = 0;
      others.forEach((t, i) => {
        if (i === others.length - 1) {
          next[t] = Math.max(0, remaining - allocated);
        } else {
          const share = othersOldSum > 0
            ? Math.round((prev[t] ?? 0) / othersOldSum * remaining)
            : Math.floor(remaining / others.length);
          next[t] = share;
          allocated += share;
        }
      });
      return next;
    });
  };

  const generateScaffold = async () => {
    if (scaffoldBusy) return;
    setScaffoldBusy(true);
    try {
      const subjectNames = fSubjectIds
        .map(id => subjectOptions.find(s => s.id === id)?.label || "")
        .filter(Boolean);
      const res = await fetch(generateScaffoldUrl, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          title: fName || "未命名專題",
          subjects: subjectNames,
          classes: fForms,
          target_forms: fForms,
          acorn_virtues: fAcornTags,
          acorn_dims: fAcornTags,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok || !data?.prompt) {
        throw new Error(data?.message || "GB10 產生失敗");
      }
      setFScaffold(String(data.prompt));
      setScaffoldFlash(true);
      window.setTimeout(() => setScaffoldFlash(false), 1200);
      scaffoldRef.current?.focus();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "GB10 產生失敗";
      window.alert(msg);
    } finally {
      setScaffoldBusy(false);
    }
  };

  const persist = (publish: boolean) => {
    if (live) {
      setSaving(publish ? "publish" : "draft");
      const action = editId ? `${updateUrl}/${editId}` : storeUrl;
      const fd = document.createElement("form");
      fd.method = "POST";
      fd.action = action;
      const fields: Record<string, string> = {
        title: fName || "未命名專題",
        form: fForms[0] || "F3",
        academic_year: academicYear,
        assignment_method: GROUP_MODE_CFG[fGroupMode].enLabel,
        groupMode: fGroupMode,
        deadline: fDeadline,
        ai_scaffold_prompt: fScaffold,
        status: publish ? "in_progress" : "draft",
        publish: publish ? "1" : "0",
        acorn_weights: JSON.stringify(fAcornWeights),
      };
      if (editId) fields.id = editId;
      Object.entries(fields).forEach(([k, v]) => {
        const i = document.createElement("input");
        i.type = "hidden"; i.name = k; i.value = v; fd.appendChild(i);
      });
      fForms.forEach(f => {
        const i = document.createElement("input");
        i.type = "hidden"; i.name = "target_forms[]"; i.value = f; fd.appendChild(i);
      });
      fTeacherIds.forEach(id => {
        const i = document.createElement("input");
        i.type = "hidden"; i.name = "teacher_ids[]"; i.value = String(id); fd.appendChild(i);
      });
      fSubjectIds.forEach(id => {
        const i = document.createElement("input");
        i.type = "hidden"; i.name = "subject_ids[]"; i.value = String(id); fd.appendChild(i);
      });
      fAcornTags.forEach(tag => {
        const i = document.createElement("input");
        i.type = "hidden"; i.name = "acorn_tags[]"; i.value = tag; fd.appendChild(i);
        const aid = acornOptions.find(a => a.name_zh_hk === tag || normalizeAcornTagKeys([a.name_zh_hk])[0] === tag)?.id;
        if (aid) {
          const j = document.createElement("input");
          j.type = "hidden"; j.name = "acorn_ids[]"; j.value = String(aid); fd.appendChild(j);
        }
      });
      document.body.appendChild(fd);
      fd.submit();
      return;
    }

    const subjectNames = fSubjectIds.map(id => subjectOptions.find(s => s.id === id)?.label || "").filter(Boolean);
    const newProject: Project = {
      id: editId ?? `p-${Date.now()}`,
      name: fName || "未命名專題",
      subjects: subjectNames.length ? subjectNames : SUBJECT_OPTIONS.filter((_, i) => fSubjectIds.includes(i + 1)),
      subjectIds: fSubjectIds,
      teacherIds: fTeacherIds,
      targetForms: fForms,
      form: fForms[0],
      groupMode: fGroupMode,
      deadline: fDeadline, scaffold: fScaffold,
      acornDims: fAcornTags,
      acornWeights: fAcornWeights,
      teamCount: 0,
      status: publish ? "active" : "draft",
    };
    if (editId) {
      setProjects(ps => ps.map(p => String(p.id) === editId ? newProject : p));
    } else {
      setProjects(ps => [newProject, ...ps]);
    }
    setModalOpen(false);
  };

  const toggleSubject = (id: number) => setFSubjectIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleTeacher = (id: number) => setFTeacherIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleForm = (f: string) => setFForms(prev => {
    if (prev.includes(f)) return prev.length <= 1 ? prev : prev.filter(x => x !== f);
    return [...prev, f];
  });

  const byStatus = (status: KanbanStatus) => projects.filter(p => p.status === status);
  const selectedSubjectLabels = fSubjectIds.map(id => subjectOptions.find(s => s.id === id)?.label).filter(Boolean) as string[];
  const selectedTeacherLabels = fTeacherIds.map(id => teacherOptions.find(t => t.id === id)?.label || teacherOptions.find(t => t.id === id)?.name).filter(Boolean) as string[];
  const weightTotal = Object.values(fAcornWeights).reduce((a, b) => a + b, 0);

  const inputStyle: React.CSSProperties = {
    width: "100%", boxSizing: "border-box",
    padding: "9px 12px", borderRadius: ERP.radius.md,
    border: `1px solid ${ERP.colors.border}`, background: ERP.colors.surface,
    color: ERP.colors.textPrimary, fontSize: 13, fontFamily: F, outline: "none",
  };

  const FieldLabel: React.FC<{ label: string; sub?: string }> = ({ label, sub }) => (
    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: ERP.colors.textSecondary, marginBottom: 6, fontFamily: F }}>
      {label}
      {sub && <span style={{ fontSize: 10, fontWeight: 400, color: ERP.colors.textMuted, marginLeft: 6 }}>{sub}</span>}
    </label>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", background: ERP.colors.pageBg, fontFamily: F }}>

      {/* ── Top Bar ──────────────────────────────────────────────────────── */}
      <div style={{ padding: "16px 24px 14px", flexShrink: 0, borderBottom: `1px solid ${ERP.colors.border}`, background: ERP.colors.surface, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: ERP.colors.textPrimary, letterSpacing: "-0.3px" }}>分組專題</h1>
          <p style={{ margin: "3px 0 0", fontSize: 12, color: ERP.colors.textMuted }}>Group Projects · 1.E.1 · PBL 協作學習管理 · AY {academicYear}</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", background: ERP.colors.pageBg, borderRadius: ERP.radius.sm, border: `1px solid ${ERP.colors.border}` }}>
            <Columns size={13} color={ERP.colors.textMuted} />
            <span style={{ fontSize: 11, color: ERP.colors.textMuted }}>看板檢視</span>
          </div>
          <button onClick={openCreate} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 16px", borderRadius: ERP.radius.md,
            border: "none", background: ERP.colors.accent,
            color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: F, cursor: "pointer",
            boxShadow: `0 2px 8px ${ERP.colors.accent}40`,
          }}>
            <Plus size={15} /> 新增專題
          </button>
        </div>
      </div>

      {(flashSuccess || flashError) && (
        <div style={{
          margin: "10px 24px 0", padding: "10px 14px", borderRadius: ERP.radius.md, fontSize: 13, fontWeight: 600,
          background: flashError ? "#FEE2E2" : "#ECFDF5",
          color: flashError ? "#B91C1C" : "#065F46",
          border: `1px solid ${flashError ? "#FCA5A5" : "#6EE7B7"}`,
        }}>
          {flashError || flashSuccess}
        </div>
      )}

      {/* ── Stats Strip ──────────────────────────────────────────────────── */}
      <div style={{ padding: "10px 24px", flexShrink: 0, display: "flex", gap: 16, borderBottom: `1px solid ${ERP.colors.divider}` }}>
        {(["draft", "active", "completed"] as KanbanStatus[]).map(s => {
          const cfg = KANBAN_CFG[s];
          return (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: cfg.accent }}>{cfg.icon}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: cfg.accent }}>{byStatus(s).length}</span>
              <span style={{ fontSize: 11, color: ERP.colors.textMuted }}>{cfg.label}</span>
            </div>
          );
        })}
      </div>

      {/* ── Kanban Board ─────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: "auto", padding: "16px 24px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 16, minWidth: isMobile ? undefined : 720 }}>
          {(["draft", "active", "completed"] as KanbanStatus[]).map(status => {
            const cfg  = KANBAN_CFG[status];
            const cols = byStatus(status);
            return (
              <div key={status}>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "8px 12px", borderRadius: `${ERP.radius.md} ${ERP.radius.md} 0 0`,
                  background: cfg.bg, border: `1px solid ${cfg.border}`, borderBottom: "none",
                  marginBottom: 0,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ color: cfg.accent }}>{cfg.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: cfg.accent }}>{cfg.label}</span>
                    <span style={{ fontSize: 11, color: cfg.accent, opacity: 0.7 }}>{cfg.enLabel}</span>
                  </div>
                  <span style={{
                    width: 20, height: 20, borderRadius: "50%", background: cfg.accent, color: "#fff",
                    fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center",
                  }}>{cols.length}</span>
                </div>

                <div style={{
                  minHeight: 120, padding: 12,
                  background: cols.length === 0 ? cfg.bg : ERP.colors.pageBg,
                  border: `1px solid ${cfg.border}`, borderRadius: `0 0 ${ERP.radius.lg} ${ERP.radius.lg}`,
                  borderTop: `2px solid ${cfg.accent}`,
                }}>
                  {cols.map(p => (
                    <ProjectCard
                      key={String(p.id)}
                      project={p}
                      onEdit={() => openEdit(p)}
                      groupsUrl={live ? `${groupsUrlBase}/${p.id}` : undefined}
                    />
                  ))}
                  {cols.length === 0 && (
                    <div style={{ textAlign: "center" as const, padding: "24px 0", color: ERP.colors.textMuted, fontSize: 12 }}>
                      暫無專題
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Modal ─────────────────────────────────────────────────────────── */}
      {modalOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: isMobile ? 0 : "40px 20px", overflow: "auto" }}
          onClick={e => { if (e.target === e.currentTarget) { setModalOpen(false); if (live && openForm) window.location.href = listUrl; } }}
        >
          <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", backdropFilter: "blur(2px)", zIndex: -1 }} />

          <div style={{
            width: "100%", maxWidth: 600,
            background: ERP.colors.surface, borderRadius: isMobile ? 0 : ERP.radius.xl,
            boxShadow: ERP.shadow.xl,
            display: "flex", flexDirection: "column",
            maxHeight: isMobile ? "100dvh" : "90vh",
            overflow: "hidden",
          }}>

            <div style={{ padding: "18px 20px 14px", borderBottom: `1px solid ${ERP.colors.border}`, flexShrink: 0, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 30, height: 30, borderRadius: ERP.radius.md, background: ERP.colors.accentPale, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <BookOpen size={15} color={ERP.colors.accent} />
                  </div>
                  <span style={{ fontSize: 16, fontWeight: 700, color: ERP.colors.textPrimary }}>
                    {editId ? "編輯專題" : "新增專題"}
                  </span>
                </div>
                <p style={{ margin: "4px 0 0 38px", fontSize: 11, color: ERP.colors.textMuted }}>{editId ? "Edit Project" : "Create PBL Project"}</p>
              </div>
              <button onClick={() => { setModalOpen(false); if (live && openForm) window.location.href = listUrl; }} style={{ background: "none", border: `1px solid ${ERP.colors.border}`, cursor: "pointer", padding: 6, borderRadius: ERP.radius.sm, color: ERP.colors.textMuted, display: "flex" }}>
                <X size={15} />
              </button>
            </div>

            <div style={{ flex: 1, overflow: "auto", padding: 20 }}>

              <div style={{ marginBottom: 16 }}>
                <FieldLabel label="專題名稱" sub="Project Title" />
                <input value={fName} onChange={e => setFName(e.target.value)} placeholder="輸入專題名稱…" style={inputStyle} />
              </div>

              <div style={{ marginBottom: 16 }}>
                <FieldLabel label="負責老師" sub="Teacher(s) in Charge" />
                <div style={{ position: "relative" }}>
                  <button type="button" onClick={() => { setFTeachOpen(o => !o); setFSubOpen(false); }} style={{
                    ...inputStyle, display: "flex", alignItems: "center", justifyContent: "space-between",
                    cursor: "pointer", textAlign: "left" as const, background: ERP.colors.surface,
                  }}>
                    <span style={{ color: selectedTeacherLabels.length ? ERP.colors.textPrimary : ERP.colors.textMuted, fontSize: 13 }}>
                      {selectedTeacherLabels.length ? selectedTeacherLabels.join("、") : "選擇負責老師…"}
                    </span>
                    <ChevronDown size={13} color={ERP.colors.textMuted} />
                  </button>
                  {fTeachOpen && (
                    <div style={{
                      position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
                      background: ERP.colors.surface, border: `1px solid ${ERP.colors.border}`,
                      borderRadius: ERP.radius.md, boxShadow: ERP.shadow.md, zIndex: 10,
                      maxHeight: 200, overflow: "auto",
                    }}>
                      {teacherOptions.map(t => (
                        <div key={t.id} onClick={() => toggleTeacher(t.id)} style={{
                          display: "flex", alignItems: "center", gap: 10, padding: "8px 14px",
                          cursor: "pointer", fontSize: 13, fontFamily: F,
                          color: ERP.colors.textPrimary,
                          background: fTeacherIds.includes(t.id) ? ERP.colors.accentPale : "transparent",
                        }}>
                          <div style={{ width: 14, height: 14, borderRadius: 3, border: `2px solid ${fTeacherIds.includes(t.id) ? ERP.colors.accent : ERP.colors.borderStrong}`, background: fTeacherIds.includes(t.id) ? ERP.colors.accent : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {fTeacherIds.includes(t.id) && <span style={{ color: "#fff", fontSize: 9, fontWeight: 900 }}>✓</span>}
                          </div>
                          {t.label || t.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <FieldLabel label="適用班級／級別" sub="Target Classes / Forms" />
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
                  {FORM_OPTIONS.map(f => {
                    const on = fForms.includes(f);
                    return (
                      <button type="button" key={f} onClick={() => toggleForm(f)} style={{
                        padding: "7px 14px", borderRadius: ERP.radius.md, cursor: "pointer",
                        fontSize: 12, fontWeight: 700, fontFamily: F,
                        border: `2px solid ${on ? ERP.colors.accent : ERP.colors.border}`,
                        background: on ? ERP.colors.accentPale : ERP.colors.surface,
                        color: on ? ERP.colors.accent : ERP.colors.textSecondary,
                      }}>{f}</button>
                    );
                  })}
                </div>
                <div style={{ marginTop: 6, fontSize: 11, color: ERP.colors.textMuted }}>分組學生池將由此級別抽取。</div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <FieldLabel label="關聯科目" sub="Subject Links (multi-select)" />
                <div style={{ position: "relative" }}>
                  <button type="button" onClick={() => { setFSubOpen(o => !o); setFTeachOpen(false); }} style={{
                    ...inputStyle, display: "flex", alignItems: "center", justifyContent: "space-between",
                    cursor: "pointer", textAlign: "left" as const, background: ERP.colors.surface,
                  }}>
                    <span style={{ color: selectedSubjectLabels.length ? ERP.colors.textPrimary : ERP.colors.textMuted, fontSize: 13 }}>
                      {selectedSubjectLabels.length ? selectedSubjectLabels.join("、") : "選擇科目…"}
                    </span>
                    <ChevronDown size={13} color={ERP.colors.textMuted} />
                  </button>
                  {fSubOpen && (
                    <div style={{
                      position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
                      background: ERP.colors.surface, border: `1px solid ${ERP.colors.border}`,
                      borderRadius: ERP.radius.md, boxShadow: ERP.shadow.md, zIndex: 10,
                      maxHeight: 200, overflow: "auto",
                    }}>
                      {subjectOptions.map(s => (
                        <div key={s.id} onClick={() => toggleSubject(s.id)} style={{
                          display: "flex", alignItems: "center", gap: 10, padding: "8px 14px",
                          cursor: "pointer", fontSize: 13, fontFamily: F,
                          color: ERP.colors.textPrimary,
                          background: fSubjectIds.includes(s.id) ? ERP.colors.accentPale : "transparent",
                        }}>
                          <div style={{ width: 14, height: 14, borderRadius: 3, border: `2px solid ${fSubjectIds.includes(s.id) ? ERP.colors.accent : ERP.colors.borderStrong}`, background: fSubjectIds.includes(s.id) ? ERP.colors.accent : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {fSubjectIds.includes(s.id) && <span style={{ color: "#fff", fontSize: 9, fontWeight: 900 }}>✓</span>}
                          </div>
                          {s.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <FieldLabel label="分組模式" sub="Group Assignment Method" />
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
                  {(Object.entries(GROUP_MODE_CFG) as [GroupMode, typeof GROUP_MODE_CFG[GroupMode]][]).map(([key, cfg]) => (
                    <button type="button" key={key} onClick={() => setFGroupMode(key)} style={{
                      padding: "7px 14px", borderRadius: ERP.radius.md, cursor: "pointer",
                      fontSize: 12, fontWeight: 700, fontFamily: F, border: `2px solid ${fGroupMode === key ? cfg.color : ERP.colors.border}`,
                      background: fGroupMode === key ? cfg.bg : ERP.colors.surface,
                      color: fGroupMode === key ? cfg.color : ERP.colors.textSecondary,
                      transition: "all 0.1s",
                    }}>
                      {cfg.label}
                      <div style={{ fontSize: 9, fontWeight: 400, marginTop: 1, opacity: 0.75 }}>{cfg.enLabel}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <FieldLabel label="ACORN 維度綁定" sub="德智體群美靈 · Weighted Binding" />
                <AcornBinding
                  items={DEFAULT_ACORN_ITEMS}
                  selectedValues={fAcornTags}
                  onToggle={toggleAcornTag}
                  inputName="acorn_tags[]"
                  summaryMode="always"
                  hintText="選擇維度並分配權重（合計須為 100%），供 Engagement Index 計算。"
                />
                {fAcornTags.length > 0 && (
                  <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${ERP.colors.border}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                      <Sliders size={13} color={ERP.colors.accent} />
                      <span style={{ fontSize: 12, fontWeight: 800 }}>權重分配 Weight Distribution</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {fAcornTags.map(tag => {
                        const s = ERP.acornTags[tag as keyof typeof ERP.acornTags] ?? { color: ERP.colors.accent, label: tag };
                        const val = fAcornWeights[tag] ?? 0;
                        return (
                          <div key={tag}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{s.label || tag}</span>
                              <span style={{ fontSize: 12, fontWeight: 800 }}>{val}%</span>
                            </div>
                            <input type="range" min={0} max={100} value={val}
                              onChange={e => handleWeightChange(tag, Number(e.target.value))}
                              style={{ width: "100%", accentColor: s.color }} />
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ marginTop: 8, fontSize: 11, fontWeight: 700, color: weightTotal === 100 ? ERP.colors.success : ERP.colors.red }}>
                      合計 {weightTotal}%
                    </div>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: 16 }}>
                <FieldLabel label="提交期限" sub="Submission Deadline" />
                <div style={{ position: "relative" }}>
                  <Calendar size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: ERP.colors.textMuted, pointerEvents: "none" }} />
                  <input type="date" value={fDeadline} min={DEADLINE_MIN} onChange={e => setFDeadline(e.target.value)}
                    style={{ ...inputStyle, paddingLeft: 30 }} />
                </div>
              </div>

              <div style={{ marginBottom: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <div style={{ width: 22, height: 22, borderRadius: ERP.radius.sm, background: "linear-gradient(135deg, #6366F1, #8B5CF6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Sparkles size={12} color="#fff" />
                  </div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#6D28D9", fontFamily: F }}>
                    AI 鷹架指令
                    <span style={{ fontSize: 10, fontWeight: 600, color: "#8B5CF6", marginLeft: 6 }}>Scaffold Prompt · Mod M6a</span>
                  </label>
                </div>
                <div style={{ padding: "10px 14px", background: "#F5F3FF", borderRadius: `${ERP.radius.md} ${ERP.radius.md} 0 0`, border: "1.5px solid #C4B5FD", borderBottom: "none" }}>
                  <p style={{ margin: 0, fontSize: 11, color: "#7C3AED", lineHeight: 1.5 }}>
                    AI 將依此指令，在學生提交成果時提供個人化蘇格拉底式回饋。建議使用開放式問題引導批判性思維。
                  </p>
                </div>
                <textarea
                  ref={scaffoldRef}
                  name="scaffold_prompt"
                  value={fScaffold}
                  onChange={e => setFScaffold(e.target.value)}
                  placeholder={AI_SCAFFOLD_PLACEHOLDER}
                  rows={6}
                  style={{
                    ...inputStyle,
                    borderRadius: `0 0 ${ERP.radius.md} ${ERP.radius.md}`,
                    border: scaffoldFlash ? "2px solid #8B5CF6" : "1.5px solid #C4B5FD",
                    borderTop: "1px dashed #DDD6FE",
                    background: scaffoldFlash ? "#EDE9FE" : "#FDFAFF",
                    boxShadow: scaffoldFlash ? "0 0 0 3px rgba(139,92,246,0.25)" : "none",
                    transition: "background 0.35s, box-shadow 0.35s, border-color 0.35s",
                    resize: "vertical" as const,
                    lineHeight: 1.6, padding: 14,
                    color: fScaffold ? ERP.colors.textPrimary : ERP.colors.textMuted,
                  }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}>
                <button type="button" disabled={scaffoldBusy} onClick={() => void generateScaffold()}
                  style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: scaffoldBusy ? "wait" : "pointer", fontSize: 11, color: "#7C3AED", fontFamily: F, padding: "2px 0", opacity: scaffoldBusy ? 0.7 : 1 }}>
                  {scaffoldBusy ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                  {scaffoldBusy ? "GB10 產生中…" : "✨ 使用預設蘇格拉底式提示"}
                </button>
              </div>

            </div>

            <div style={{ padding: "14px 20px", borderTop: `1px solid ${ERP.colors.border}`, flexShrink: 0, display: "flex", gap: 10, justifyContent: "flex-end", background: ERP.colors.surface }}>
              <button type="button" onClick={() => { setModalOpen(false); if (live && openForm) window.location.href = listUrl; }} style={{ padding: "9px 18px", borderRadius: ERP.radius.md, border: `1px solid ${ERP.colors.border}`, background: "transparent", color: ERP.colors.textSecondary, fontSize: 13, fontFamily: F, cursor: "pointer" }}>
                取消
              </button>
              <button type="button" disabled={!!saving} onClick={() => persist(false)} style={{ padding: "9px 18px", borderRadius: ERP.radius.md, border: `1px solid ${ERP.colors.border}`, background: "transparent", color: ERP.colors.accent, fontSize: 13, fontWeight: 600, fontFamily: F, cursor: "pointer" }}>
                <Clock size={12} style={{ marginRight: 5, verticalAlign: "middle" }} />{saving === "draft" ? "儲存中…" : "儲存草稿"}
              </button>
              <button type="button" disabled={!!saving} onClick={() => persist(true)} style={{
                padding: "9px 20px", borderRadius: ERP.radius.md, border: "none",
                background: ERP.colors.accent, color: "#fff", fontSize: 13, fontWeight: 700,
                fontFamily: F, cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                boxShadow: `0 2px 8px ${ERP.colors.accent}40`,
              }}>
                <Send size={13} /> {saving === "publish" ? "發佈中…" : "發佈專題 Publish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
