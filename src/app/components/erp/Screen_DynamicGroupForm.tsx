// ─────────────────────────────────────────────────────────────────────────────
// Dynamic Group Create / Edit — Subject-driven roster tabs
// ─────────────────────────────────────────────────────────────────────────────
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft, BookOpen, ClipboardPaste, Info, Layers,
  Plus, Save, Search, Trash2, UserCog, Users, X, Zap, AlertTriangle,
} from "lucide-react";
import { ERP } from "./erpTokens";

const F = ERP.font.family;

type SubjectOpt = {
  id: number;
  code: string;
  name_en: string;
  name_zh_hk: string;
  kla: string;
  label: string;
  allow_dynamic_grouping?: boolean;
  offered_forms?: string[];
};

type TeacherOpt = { id: string; name_en: string; name_zh_hk: string; label: string };

type RosterStudent = {
  pk: number;
  student_id: string;
  name: string;
  name_zh_hk?: string;
  name_en?: string;
  class_name: string;
  form?: string;
  source: "manual" | "import" | "tab";
};

type FormTab = {
  form: string;
  label: string;
  count: number;
  classes: Record<string, RosterStudent[]>;
  students: RosterStudent[];
};

type InitialGroup = {
  id: number;
  name: string;
  form: string;
  academic_year: string;
  subject_area: string;
  teacher_en: string;
  teacher_zh_hk: string;
};

interface Props {
  lockedForm?: string;
  forms?: string[];
  academicYear?: string;
  subjects?: SubjectOpt[];
  teachers?: TeacherOpt[];
  studentsByFormUrl?: string;
  subjectFormsUrl?: string;
  validateMembersUrl?: string;
  storeUrl?: string;
  listUrl?: string;
  groupId?: number | null;
  initialGroup?: InitialGroup | null;
  initialMembers?: Array<{
    pk: number;
    student_id: string;
    name: string;
    name_zh_hk?: string;
    name_en?: string;
    class_name: string;
    form?: string;
  }>;
  flashSuccess?: string;
  flashError?: string;
}

const selectCss: React.CSSProperties = {
  width: "100%", height: 38, padding: "0 12px",
  border: `1.5px solid ${ERP.colors.border}`,
  borderRadius: ERP.radius.md, fontSize: 13, fontFamily: F,
  color: ERP.colors.textPrimary, background: "#fff", outline: "none",
  boxSizing: "border-box",
};

const CLASS_PAL: Record<string, { bg: string; color: string; border: string }> = {
  "1A": { bg: "#DBEAFE", color: "#1D4ED8", border: "#93C5FD" },
  "1B": { bg: "#EDE9FE", color: "#6D28D9", border: "#C4B5FD" },
  "1C": { bg: "#DCFCE7", color: "#15803D", border: "#86EFAC" },
  "2A": { bg: "#DBEAFE", color: "#1D4ED8", border: "#93C5FD" },
  "2B": { bg: "#EDE9FE", color: "#6D28D9", border: "#C4B5FD" },
  "2C": { bg: "#DCFCE7", color: "#15803D", border: "#86EFAC" },
  "3A": { bg: "#DBEAFE", color: "#1D4ED8", border: "#93C5FD" },
  "3B": { bg: "#EDE9FE", color: "#6D28D9", border: "#C4B5FD" },
  "3C": { bg: "#DCFCE7", color: "#15803D", border: "#86EFAC" },
  "4A": { bg: "#DBEAFE", color: "#1D4ED8", border: "#93C5FD" },
  "4B": { bg: "#EDE9FE", color: "#6D28D9", border: "#C4B5FD" },
  "4C": { bg: "#DCFCE7", color: "#15803D", border: "#86EFAC" },
};

function pal(cls: string) {
  return CLASS_PAL[cls] ?? { bg: "#F1F5F9", color: "#475569", border: "#CBD5E1" };
}

/** Derive F-form from class code (3A→F3, F4B→F4) or existing form field. */
function resolveStudentForm(r: { form?: string; class_name?: string }): string {
  const explicit = (r.form || "").trim().toUpperCase();
  if (/^F[1-6]$/.test(explicit)) return explicit;
  const cls = (r.class_name || "").trim().toUpperCase();
  const m = cls.match(/^[FS]?([1-6])/);
  return m ? `F${m[1]}` : "?";
}

const FORM_PAL: Record<string, { bg: string; color: string; border: string }> = {
  F1: { bg: "#DBEAFE", color: "#1D4ED8", border: "#93C5FD" },
  F2: { bg: "#EDE9FE", color: "#6D28D9", border: "#C4B5FD" },
  F3: { bg: "#DCFCE7", color: "#15803D", border: "#86EFAC" },
  F4: { bg: "#FEF3C7", color: "#92400E", border: "#FCD34D" },
  F5: { bg: "#FFEDD5", color: "#9A3412", border: "#FDBA74" },
  F6: { bg: "#CFFAFE", color: "#0E7490", border: "#67E8F9" },
};

function formPal(form: string) {
  return FORM_PAL[form] ?? { bg: "#F1F5F9", color: "#475569", border: "#CBD5E1" };
}

export const Screen_DynamicGroupForm: React.FC<Props> = ({
  lockedForm = "F3",
  forms = ["F1", "F2", "F3", "F4"],
  academicYear = "2025/26",
  subjects = [],
  teachers = [],
  studentsByFormUrl = "/students/by-form",
  subjectFormsUrl = "/dynamic-group/subject-forms",
  validateMembersUrl = "/dynamic-group/validate-members",
  storeUrl = "/dynamic-group/store",
  listUrl = "/dynamic-group",
  groupId = null,
  initialGroup = null,
  initialMembers = [],
  flashSuccess,
  flashError,
}) => {
  const [groupForm, setGroupForm] = useState((initialGroup?.form || lockedForm || "F3").toUpperCase());
  const [groupName, setGroupName] = useState(
    initialGroup?.name
      || (lockedForm === "F3"
        ? "25/26 中三視覺藝術選修組 (F3 Visual Arts Elective)"
        : `25/26 ${lockedForm} 選修組`)
  );
  const [subjectCode, setSubjectCode] = useState(() => {
    if (!initialGroup?.subject_area || subjects.length === 0) {
      return subjects.find(s => s.code === "VA")?.code
        || subjects.find(s => s.allow_dynamic_grouping)?.code
        || subjects[0]?.code
        || "";
    }
    const hit = subjects.find(
      s => s.name_en === initialGroup.subject_area
        || s.name_zh_hk === initialGroup.subject_area
        || s.code === initialGroup.subject_area
    );
    return hit?.code || subjects[0]?.code || "";
  });
  const [teacherId, setTeacherId] = useState(() => {
    if (!initialGroup) return teachers[0]?.id || "";
    const hit = teachers.find(
      t => t.name_en === initialGroup.teacher_en
        || t.name_zh_hk === initialGroup.teacher_zh_hk
        || t.label.includes(initialGroup.teacher_en)
    );
    return hit?.id || teachers[0]?.id || "";
  });

  const [roster, setRoster] = useState<RosterStudent[]>(() =>
    (initialMembers || []).map(m => {
      const row = {
        pk: m.pk,
        student_id: m.student_id,
        name: m.name || m.name_zh_hk || m.name_en || "",
        name_zh_hk: m.name_zh_hk,
        name_en: m.name_en,
        class_name: m.class_name,
        form: m.form,
        source: "manual" as const,
      };
      return { ...row, form: resolveStudentForm(row) };
    })
  );

  const [pasteText, setPasteText] = useState("");
  const [parseMsg, setParseMsg] = useState<string | null>(null);
  const [pickerQ, setPickerQ] = useState("");
  const [pickerHits, setPickerHits] = useState<RosterStudent[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [tabs, setTabs] = useState<FormTab[]>([]);
  const [tabsLoading, setTabsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("");
  const [subjectAllowsDyn, setSubjectAllowsDyn] = useState(false);
  /** Selected Roster filter: "all" | form code (e.g. "F3") */
  const [rosterFormTab, setRosterFormTab] = useState<string>("all");

  const selectedTeacher = teachers.find(t => t.id === teacherId);
  const selectedSubject = subjects.find(s => s.code === subjectCode);
  const rosterIds = useMemo(() => new Set(roster.map(r => r.pk)), [roster]);

  /** Distinct FORMS present in Selected Roster (F3, F4…) — not admin classes. */
  const rosterFormTabs = useMemo(() => {
    const counts: Record<string, number> = {};
    roster.forEach(r => {
      const form = resolveStudentForm(r);
      counts[form] = (counts[form] || 0) + 1;
    });
    return Object.entries(counts)
      .sort(([a], [b]) => a.localeCompare(b, "en", { numeric: true }))
      .map(([form, count]) => ({ form, count }));
  }, [roster]);

  /** Visible rows for the active Selected Roster form tab (mixes 3A/3B/3C under F3). */
  const rosterVisible = useMemo(() => {
    if (rosterFormTab === "all") return roster;
    return roster.filter(r => resolveStudentForm(r) === rosterFormTab);
  }, [roster, rosterFormTab]);

  // If active form tab empties, fall back to All
  useEffect(() => {
    if (rosterFormTab === "all") return;
    if (!rosterFormTabs.some(t => t.form === rosterFormTab)) {
      setRosterFormTab("all");
    }
  }, [rosterFormTabs, rosterFormTab]);

  const addToRoster = useCallback((rows: RosterStudent[]) => {
    setRoster(prev => {
      const map = new Map(prev.map(r => [r.pk, r]));
      rows.forEach(r => {
        if (r.pk > 0) {
          map.set(r.pk, { ...r, form: resolveStudentForm(r) });
        }
      });
      return Array.from(map.values()).sort((a, b) => {
        const fa = resolveStudentForm(a);
        const fb = resolveStudentForm(b);
        return fa.localeCompare(fb) || a.class_name.localeCompare(b.class_name) || a.student_id.localeCompare(b.student_id);
      });
    });
  }, []);

  const removeFromRoster = (pk: number) => {
    setRoster(prev => prev.filter(r => r.pk !== pk));
  };
  const toggleTabStudent = (s: RosterStudent, checked: boolean) => {
    if (checked) {
      // Multi-form roster allowed (Selected Roster tabs group by Form)
      addToRoster([{ ...s, form: resolveStudentForm(s), source: "tab" }]);
    } else {
      removeFromRoster(s.pk);
    }
  };

  // Load subject tabs when subject changes
  useEffect(() => {
    if (!subjectCode) {
      setTabs([]);
      setSubjectAllowsDyn(false);
      return;
    }
    const ctrl = new AbortController();
    setTabsLoading(true);
    const params = new URLSearchParams({
      subject_code: subjectCode,
      academic_year: academicYear,
    });
    fetch(`${subjectFormsUrl}?${params}`, { signal: ctrl.signal, headers: { Accept: "application/json" } })
      .then(r => r.json())
      .then(json => {
        const allow = !!json.allow_dynamic_grouping;
        setSubjectAllowsDyn(allow);
        const nextTabs: FormTab[] = (json.tabs || []).map((t: any) => ({
          form: t.form,
          label: t.label,
          count: t.count,
          classes: Object.fromEntries(
            Object.entries(t.classes || {}).map(([cls, list]) => [
              cls,
              (list as any[]).map(s => ({
                pk: s.pk || s.id,
                student_id: s.student_id,
                name: s.name || s.name_zh_hk || s.name_en,
                name_zh_hk: s.name_zh_hk,
                name_en: s.name_en,
                class_name: s.class_name || cls,
                form: t.form,
                source: "tab" as const,
              })),
            ])
          ),
          students: (t.students || []).map((s: any) => ({
            pk: s.pk || s.id,
            student_id: s.student_id,
            name: s.name || s.name_zh_hk || s.name_en,
            name_zh_hk: s.name_zh_hk,
            name_en: s.name_en,
            class_name: s.class_name,
            form: t.form,
            source: "tab" as const,
          })),
        }));
        // Prefer tabs that have students
        const usable = nextTabs.filter(t => t.count > 0);
        setTabs(usable.length ? usable : nextTabs);
        const prefer = usable.find(t => t.form === groupForm)
          || usable[0]
          || nextTabs[0];
        setActiveTab(prefer?.form || "");
        if (prefer && !initialGroup) {
          setGroupForm(prefer.form);
        }
      })
      .catch(() => { setTabs([]); setSubjectAllowsDyn(false); })
      .finally(() => setTabsLoading(false));
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectCode, academicYear, subjectFormsUrl]);

  // Fallback manual picker AJAX (when subject does not allow dyn grouping)
  useEffect(() => {
    if (subjectAllowsDyn || !pickerOpen) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setPickerLoading(true);
      try {
        const params = new URLSearchParams({
          form: groupForm,
          academic_year: academicYear,
          q: pickerQ.trim(),
          limit: "60",
        });
        const res = await fetch(`${studentsByFormUrl}?${params}`, {
          signal: ctrl.signal,
          headers: { Accept: "application/json" },
        });
        const json = await res.json();
        setPickerHits((json.data || []).map((s: any) => ({
          pk: s.pk || s.id,
          student_id: s.student_id,
          name: s.name || s.name_zh_hk || s.name_en,
          name_zh_hk: s.name_zh_hk,
          name_en: s.name_en,
          class_name: s.class_name || s.class_code || "",
          form: groupForm,
          source: "manual" as const,
        })));
      } catch { /* noop */ }
      finally { setPickerLoading(false); }
    }, 220);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [pickerQ, groupForm, academicYear, studentsByFormUrl, pickerOpen, subjectAllowsDyn]);

  const onFormChange = (next: string) => {
    const f = next.toUpperCase();
    if (roster.length > 0
      && !window.confirm(`切換年級至 ${f} 將清空已選學生。繼續？`)) {
      return;
    }
    setGroupForm(f);
    setRoster([]);
    setActiveTab(f);
  };

  const onSubjectChange = (code: string) => {
    if (roster.length > 0
      && !window.confirm("更換科目將重新載入可選年級名冊，並清空已選學生。繼續？")) {
      return;
    }
    setSubjectCode(code);
    setRoster([]);
    setParseMsg(null);
  };

  const switchTab = (form: string) => {
    if (form === activeTab) return;
    // Keep Selected Roster across form picker tabs (aggregate by Form below)
    setActiveTab(form);
    setGroupForm(form);
  };

  const handleSmartParse = async () => {
    const lines = pasteText.split(/\n+/).map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      setParseMsg("請先貼上學生名單。");
      return;
    }
    setParseMsg("解析中…");
    try {
      const params = new URLSearchParams({
        form: groupForm,
        academic_year: academicYear,
        limit: "200",
      });
      const res = await fetch(`${studentsByFormUrl}?${params}`);
      const json = await res.json();
      const pool: any[] = json.data || [];
      const matched: RosterStudent[] = [];
      let unmatched = 0;
      for (const line of lines) {
        const parts = line.split(/[,;\t]/).map(p => p.trim()).filter(Boolean);
        const token = parts[0] || "";
        const nameHint = parts[1] || "";
        let hit = pool.find(s => s.student_id === token);
        if (!hit && nameHint) {
          hit = pool.find(s => s.name_zh_hk === nameHint || s.name_en?.toLowerCase() === nameHint.toLowerCase());
        }
        if (hit) {
          matched.push({
            pk: hit.pk || hit.id,
            student_id: hit.student_id,
            name: hit.name || hit.name_zh_hk || hit.name_en,
            class_name: hit.class_name || "",
            form: groupForm,
            source: "import",
          });
        } else unmatched++;
      }
      await fetch(validateMembersUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ form: groupForm, academic_year: academicYear, student_ids: matched.map(m => m.pk) }),
      });
      addToRoster(matched);
      setParseMsg(`接受 ${matched.length} 名 ${groupForm} 學生` + (unmatched ? `；未能配對 ${unmatched} 行` : "") + "。");
    } catch {
      setParseMsg("解析失敗，請重試。");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    if (roster.length === 0) {
      e.preventDefault();
      setParseMsg("請至少勾選一名學生。");
      return;
    }
    if (!subjectCode) {
      e.preventDefault();
      setParseMsg("請選擇科目 / KLA。");
      return;
    }
    setSaving(true);
  };

  const activeTabData = tabs.find(t => t.form === activeTab);

  return (
    <form
      method="post"
      action={storeUrl}
      onSubmit={handleSubmit}
      style={{
        minHeight: "100%", background: ERP.colors.pageBg, fontFamily: F,
        display: "flex", flexDirection: "column",
      }}
    >
      {/* Persistent payload — outside visual tab panes so re-renders never drop IDs */}
      <div id="dg-roster-payload" aria-hidden="true" style={{ display: "none" }}>
        <input type="hidden" name="academic_year" value={academicYear} />
        <input type="hidden" name="form" value={groupForm} />
        <input type="hidden" name="name" value={groupName} />
        <input type="hidden" name="subject_code" value={subjectCode} />
        <input type="hidden" name="subject_area" value={selectedSubject?.name_en || ""} />
        <input type="hidden" name="teacher_id" value={teacherId} />
        <input type="hidden" name="teacher_en" value={selectedTeacher?.name_en || ""} />
        <input type="hidden" name="teacher_zh_hk" value={selectedTeacher?.name_zh_hk || ""} />
        {groupId ? <input type="hidden" name="group_id" value={groupId} /> : null}
        {roster.map(r => (
          <input key={`payload-${r.pk}`} type="hidden" name="student_ids[]" value={r.student_id} />
        ))}
      </div>

      {/* Sticky header — sole Save control */}
      <div style={{
        position: "sticky", top: 0, zIndex: 100,
        background: ERP.colors.surface, borderBottom: `1px solid ${ERP.colors.border}`,
        padding: "12px 28px 14px", boxShadow: ERP.shadow.xs,
      }}>
        <a href={listUrl} style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          fontSize: 12, color: ERP.colors.textMuted, textDecoration: "none", marginBottom: 8,
        }}>
          <ArrowLeft size={13} /> 動態分組管理
        </a>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
              {groupId ? "編輯群組 Edit Group" : "建立新群組 Create Group"}
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 12.5, color: ERP.colors.textSecondary }}>
              {selectedSubject ? `${selectedSubject.name_zh_hk || selectedSubject.name_en}` : "科目"}
              {" · "}Form 鎖定 {groupForm} · AY {academicYear}
              {" · "}已選 {roster.length} 人
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <a href={listUrl} style={{
              height: 36, padding: "0 16px", display: "inline-flex", alignItems: "center", gap: 6,
              border: `1.5px solid ${ERP.colors.borderStrong}`, borderRadius: ERP.radius.md,
              background: "#fff", fontSize: 13, fontWeight: 600, color: ERP.colors.textSecondary,
              textDecoration: "none",
            }}>
              <X size={14} /> 取消
            </a>
            <button type="submit" disabled={saving} style={{
              height: 36, padding: "0 18px", border: "none", borderRadius: ERP.radius.md,
              background: "linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)",
              fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: F,
              display: "inline-flex", alignItems: "center", gap: 7,
              boxShadow: "0 2px 8px rgba(37,99,235,0.28)", opacity: saving ? 0.7 : 1,
            }}>
              <Save size={14} /> {saving ? "儲存中…" : "儲存群組 Save Group"}
            </button>
          </div>
        </div>
      </div>

      <div style={{
        flex: 1, padding: "22px 28px 40px", maxWidth: 980, width: "100%",
        boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 16,
        // Allow dropdowns to escape card stacking contexts
        overflow: "visible",
        position: "relative",
        zIndex: 1,
      }}>
        {(flashSuccess || flashError || parseMsg) && (
          <div style={{
            padding: "10px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600,
            background: flashError ? ERP.colors.redLight : "#ECFDF5",
            color: flashError ? ERP.colors.red : "#065F46",
            border: `1px solid ${flashError ? ERP.colors.red : "#6EE7B7"}44`,
          }}>
            {flashError || flashSuccess || parseMsg}
          </div>
        )}

        <div style={{
          background: "linear-gradient(135deg, #EFF6FF 0%, #EDE9FE 100%)",
          border: "1px solid #C7D2FE", borderRadius: ERP.radius.lg,
          padding: "11px 18px", display: "flex", gap: 10, alignItems: "flex-start",
        }}>
          <Info size={15} color="#4F46E5" style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 12, color: "#3730A3", lineHeight: 1.6 }}>
            選擇已啟用「允許動態分組」的科目後，系統會依科目<strong>開設級別</strong>產生年級分頁，勾選學生即可入組（嚴格單一年級）。
          </div>
        </div>

        {/* Section 1 */}
        <Card icon={<BookOpen size={15} color={ERP.colors.accent} />} title="群組基本資訊" subtitle="Section 1 · Basic Group Information" accent={ERP.colors.accent}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
            <Field label="群組名稱" en="Group Name" required>
              <input value={groupName} onChange={e => setGroupName(e.target.value)} required style={selectCss} placeholder="輸入群組名稱…" />
            </Field>
            <Field label="所屬年級 Form（鎖定）" en="Form Lock" required>
              <select
                value={groupForm}
                onChange={e => onFormChange(e.target.value)}
                style={{ ...selectCss, borderColor: ERP.colors.accent, background: ERP.colors.accentPale, fontWeight: 700, color: ERP.colors.accent }}
              >
                {(subjectAllowsDyn && tabs.length
                  ? tabs.map(t => t.form)
                  : forms
                ).map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </Field>
            <Field label="所屬學習領域 / 科目" en="KLA / Subject" required>
              <div style={{ position: "relative" }}>
                <BookOpen size={13} style={{ position: "absolute", left: 10, top: 12, color: ERP.colors.textMuted }} />
                <select
                  value={subjectCode}
                  onChange={e => onSubjectChange(e.target.value)}
                  required
                  style={{ ...selectCss, paddingLeft: 30 }}
                >
                  <option value="" disabled>選擇科目…</option>
                  {subjects.map(s => (
                    <option key={s.code} value={s.code}>{s.label}</option>
                  ))}
                </select>
              </div>
            </Field>
            <Field label="負責教師" en="Teacher in Charge">
              <div style={{ position: "relative" }}>
                <UserCog size={13} style={{ position: "absolute", left: 10, top: 12, color: ERP.colors.textMuted }} />
                <select value={teacherId} onChange={e => setTeacherId(e.target.value)} style={{ ...selectCss, paddingLeft: 30 }}>
                  <option value="">選擇教師…</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>
            </Field>
          </div>
          <div style={{
            marginTop: 12, padding: "10px 12px", background: "#FFFBEB",
            border: "1px solid #FDE68A", borderRadius: ERP.radius.md,
            fontSize: 12, color: "#92400E", display: "flex", gap: 8,
          }}>
            <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>
              <strong>嚴格年級邊界：</strong>單一群組僅能含 <strong>{groupForm}</strong> 學生。
              {subjectAllowsDyn
                ? " 請在下方年級分頁勾選修讀此科目的學生。"
                : " 此科目未啟用動態分組，請使用手動搜尋（僅鎖定年級）。"}
            </span>
          </div>
        </Card>

        {/* Smart import (compact) */}
        <Card icon={<Zap size={15} color="#D97706" />} title="智能名單匯入" subtitle="Optional · paste student IDs" accent="#D97706">
          <textarea
            value={pasteText}
            onChange={e => setPasteText(e.target.value)}
            rows={3}
            placeholder={`S00007, 陳大明\n…（僅 ${groupForm}）`}
            style={{
              width: "100%", boxSizing: "border-box", padding: 12,
              border: `1.5px solid ${ERP.colors.borderStrong}`, borderRadius: ERP.radius.lg,
              fontFamily: ERP.font.mono, fontSize: 13, resize: "vertical", outline: "none", background: "#FAFBFC",
            }}
          />
          <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
            <button type="button" onClick={() => navigator.clipboard.readText().then(t => setPasteText(t)).catch(() => {})} style={btnSecondary}>
              <ClipboardPaste size={14} /> 貼上
            </button>
            <button type="button" onClick={handleSmartParse} style={btnWarn}>
              <Zap size={14} /> 智能解析
            </button>
          </div>
        </Card>

        {/* Subject-driven tabs OR fallback manual picker */}
        {subjectAllowsDyn ? (
          <Card
            icon={<Layers size={15} color={ERP.colors.teal} />}
            title="科目開設級別 · 勾選學生"
            subtitle={tabsLoading ? "載入中…" : `依 ${selectedSubject?.name_zh_hk || subjectCode} 開設級別分頁`}
            accent={ERP.colors.teal}
            overflowVisible
          >
            {tabsLoading ? (
              <div style={{ padding: 24, textAlign: "center", color: ERP.colors.textMuted }}>載入年級名冊…</div>
            ) : tabs.length === 0 ? (
              <div style={{ padding: 24, textAlign: "center", color: ERP.colors.textMuted }}>
                此科目開設級別在本學年尚無對應學生（或級別超出本校 F1–F4）。
              </div>
            ) : (
              <>
                {/* Tabs */}
                <div style={{
                  display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14,
                  borderBottom: `1px solid ${ERP.colors.border}`, paddingBottom: 10,
                }}>
                  {tabs.map(t => {
                    const active = t.form === activeTab;
                    return (
                      <button
                        key={t.form}
                        type="button"
                        onClick={() => switchTab(t.form)}
                        style={{
                          padding: "8px 14px", borderRadius: 10, fontFamily: F, cursor: "pointer",
                          border: active ? `1.5px solid ${ERP.colors.accent}` : `1px solid ${ERP.colors.border}`,
                          background: active ? ERP.colors.accentPale : "#fff",
                          color: active ? ERP.colors.accent : ERP.colors.textSecondary,
                          fontWeight: active ? 800 : 600, fontSize: 13,
                        }}
                      >
                        {t.label}
                        <span style={{
                          marginLeft: 8, padding: "1px 7px", borderRadius: 999, fontSize: 11,
                          background: active ? ERP.colors.accent : ERP.colors.pageBg,
                          color: active ? "#fff" : ERP.colors.textMuted,
                        }}>{t.count}</span>
                      </button>
                    );
                  })}
                </div>

                {activeTabData && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {Object.keys(activeTabData.classes).sort().map(cls => {
                      const list = activeTabData.classes[cls] || [];
                      const p = pal(cls);
                      const allChecked = list.every(s => rosterIds.has(s.pk));
                      return (
                        <div key={cls} style={{
                          border: `1px solid ${ERP.colors.border}`, borderRadius: 12, overflow: "hidden",
                        }}>
                          <div style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "8px 12px", background: p.bg, borderBottom: `1px solid ${p.border}`,
                          }}>
                            <span style={{ fontWeight: 800, fontSize: 13, color: p.color }}>{cls} · {list.length} 人</span>
                            <button
                              type="button"
                              onClick={() => {
                                if (allChecked) {
                                  list.forEach(s => removeFromRoster(s.pk));
                                } else {
                                  setGroupForm(activeTabData.form);
                                  addToRoster(list.map(s => ({ ...s, form: activeTabData.form, source: "tab" as const })));
                                }
                              }}
                              style={{
                                border: `1px solid ${p.border}`, background: "#fff", borderRadius: 8,
                                padding: "4px 10px", fontSize: 11, fontWeight: 700, color: p.color,
                                cursor: "pointer", fontFamily: F,
                              }}
                            >
                              {allChecked ? "取消全選" : "全選本班"}
                            </button>
                          </div>
                          <div style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                            gap: 0,
                          }}>
                            {list.map(s => {
                              const checked = rosterIds.has(s.pk);
                              return (
                                <label
                                  key={s.pk}
                                  style={{
                                    display: "flex", alignItems: "center", gap: 8,
                                    padding: "9px 12px", cursor: "pointer", fontFamily: F,
                                    borderBottom: `1px solid ${ERP.colors.divider}`,
                                    background: checked ? "#EFF6FF" : "#fff",
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={e => toggleTabStudent(
                                      { ...s, form: activeTabData.form, source: "tab" },
                                      e.target.checked
                                    )}
                                    style={{ width: 15, height: 15, accentColor: ERP.colors.accent }}
                                  />
                                  <span style={{ fontFamily: ERP.font.mono, fontSize: 11, color: ERP.colors.textMuted }}>
                                    {s.student_id}
                                  </span>
                                  <span style={{ fontSize: 13, fontWeight: 600, color: ERP.colors.textPrimary }}>
                                    {s.name}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </Card>
        ) : (
          <Card
            icon={<Search size={15} color={ERP.colors.teal} />}
            title="手動加入學生 Manual Student Selection"
            subtitle={`僅 ${groupForm} · AY ${academicYear}`}
            accent={ERP.colors.teal}
            overflowVisible
            elevate
          >
            <div style={{ position: "relative", zIndex: 50 }}>
              <Search size={14} style={{ position: "absolute", left: 12, top: 12, color: ERP.colors.textMuted, zIndex: 2 }} />
              <input
                value={pickerQ}
                onChange={e => { setPickerQ(e.target.value); setPickerOpen(true); }}
                onFocus={() => setPickerOpen(true)}
                placeholder={`搜尋 ${groupForm} 學生…`}
                style={{ ...selectCss, height: 40, paddingLeft: 36 }}
              />
              {pickerOpen && (
                <div style={{
                  position: "absolute", zIndex: 9999, left: 0, right: 0, top: 44,
                  background: "#fff", border: `1px solid ${ERP.colors.border}`,
                  borderRadius: 10, boxShadow: "0 12px 40px rgba(15,23,42,0.18)",
                  maxHeight: 280, overflowY: "auto",
                }}>
                  <div style={{
                    padding: "8px 12px", fontSize: 11, fontWeight: 700, color: ERP.colors.textMuted,
                    borderBottom: `1px solid ${ERP.colors.border}`, background: ERP.colors.pageBg,
                    display: "flex", justifyContent: "space-between", position: "sticky", top: 0,
                  }}>
                    <span>{pickerLoading ? "載入中…" : `${pickerHits.length} 名 ${groupForm} 學生`}</span>
                    <button type="button" onClick={() => setPickerOpen(false)} style={{ border: "none", background: "none", cursor: "pointer" }}>
                      <X size={14} />
                    </button>
                  </div>
                  {pickerHits.length === 0 && !pickerLoading ? (
                    <div style={{ padding: 16, fontSize: 12.5, color: ERP.colors.textMuted, textAlign: "center" }}>無符合結果</div>
                  ) : pickerHits.map(s => {
                    const taken = rosterIds.has(s.pk);
                    const p = pal(s.class_name);
                    return (
                      <button
                        key={s.pk}
                        type="button"
                        disabled={taken}
                        onClick={() => { addToRoster([s]); setPickerQ(""); }}
                        style={{
                          width: "100%", textAlign: "left", padding: "10px 14px",
                          border: "none", borderBottom: `1px solid ${ERP.colors.divider}`,
                          background: taken ? ERP.colors.pageBg : "#fff",
                          cursor: taken ? "default" : "pointer", fontFamily: F,
                          display: "flex", alignItems: "center", gap: 10, opacity: taken ? 0.55 : 1,
                        }}
                      >
                        <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: p.bg, color: p.color, border: `1px solid ${p.border}` }}>{s.class_name || "—"}</span>
                        <span style={{ fontFamily: ERP.font.mono, fontSize: 12 }}>{s.student_id}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{s.name}</span>
                        {taken ? <span style={{ fontSize: 11, color: ERP.colors.success, fontWeight: 700 }}>已加入</span> : (
                          <span style={{ fontSize: 11, color: ERP.colors.accent, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 3 }}>
                            <Plus size={12} /> 加入
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <p style={{ margin: "10px 0 0", fontSize: 11.5, color: ERP.colors.textMuted }}>
              此科目未啟用「允許動態分組」。可在科目管理開啟後改用年級分頁勾選。
            </p>
          </Card>
        )}

        {/* Selected Roster — FORM-level tabs (F3/F4); Class column still shown per row */}
        <Card
          icon={<Users size={15} color={ERP.colors.success} />}
          title="已選名冊 Selected Roster"
          subtitle="按年級（Form）分頁 · 班別欄位仍顯示行政班"
          accent={ERP.colors.success}
        >
          {roster.length === 0 ? (
            <div style={{
              padding: 28, textAlign: "center", color: ERP.colors.textMuted, fontSize: 13,
              border: `1px dashed ${ERP.colors.borderStrong}`, borderRadius: ERP.radius.lg,
            }}>
              尚未加入學生。請在上方年級分頁勾選，或使用智能匯入。
            </div>
          ) : (
            <>
              <div
                role="tablist"
                aria-label="Selected roster by form"
                style={{
                  display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14,
                  paddingBottom: 12, borderBottom: `1px solid ${ERP.colors.border}`,
                }}
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={rosterFormTab === "all"}
                  onClick={() => setRosterFormTab("all")}
                  style={rosterTabStyle(rosterFormTab === "all", ERP.colors.accent, ERP.colors.accentPale)}
                >
                  <Layers size={12} />
                  All Students 全部
                  <span style={rosterTabCount(rosterFormTab === "all")}>{roster.length}</span>
                </button>
                {rosterFormTabs.map(({ form, count }) => {
                  const p = formPal(form);
                  const active = rosterFormTab === form;
                  return (
                    <button
                      key={form}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setRosterFormTab(form)}
                      style={rosterTabStyle(active, p.color, p.bg, p.border)}
                    >
                      {form}
                      <span style={{
                        ...rosterTabCount(active),
                        background: active ? p.color : "#fff",
                        color: active ? "#fff" : p.color,
                        border: `1px solid ${p.border}`,
                      }}>{count}</span>
                    </button>
                  );
                })}
              </div>

              <div
                role="tabpanel"
                aria-label={
                  rosterFormTab === "all"
                    ? "All selected students"
                    : `Form ${rosterFormTab}`
                }
              >
                <div style={{
                  marginBottom: 10, fontSize: 12, fontWeight: 600, color: ERP.colors.textSecondary,
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  {rosterFormTab === "all" ? (
                    <>顯示全部 {rosterVisible.length} 名學生（跨年級）</>
                  ) : (
                    <>
                      顯示年級{" "}
                      <span style={{
                        padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 800,
                        background: formPal(rosterFormTab).bg, color: formPal(rosterFormTab).color,
                        border: `1px solid ${formPal(rosterFormTab).border}`,
                      }}>{rosterFormTab}</span>
                      {" "}— {rosterVisible.length} 人（含該年級各行政班）
                    </>
                  )}
                </div>

                <SelectedRosterTable
                  rows={rosterVisible}
                  onRemove={removeFromRoster}
                />
              </div>
            </>
          )}
        </Card>
      </div>
    </form>
  );
};

/** Shared table for All / form-specific Selected Roster panes (Class column preserved). */
const SelectedRosterTable: React.FC<{
  rows: RosterStudent[];
  onRemove: (pk: number) => void;
}> = ({ rows, onRemove }) => (
  <div style={{ border: `1px solid ${ERP.colors.border}`, borderRadius: ERP.radius.lg, overflow: "hidden" }}>
    <div style={{
      display: "grid", gridTemplateColumns: "1.2fr 1.4fr 0.8fr 0.8fr 0.6fr",
      background: ERP.colors.pageBg, borderBottom: `1px solid ${ERP.colors.border}`,
      padding: "10px 14px", fontSize: 11, fontWeight: 700, color: ERP.colors.textMuted,
    }}>
      <span>學生編號</span><span>姓名</span><span>班別 Class</span><span>來源</span><span>操作</span>
    </div>
    {rows.length === 0 ? (
      <div style={{ padding: 20, textAlign: "center", fontSize: 13, color: ERP.colors.textMuted }}>
        此年級暫無已選學生
      </div>
    ) : rows.map((r, i) => {
      const p = pal(r.class_name);
      return (
        <div key={r.pk} style={{
          display: "grid", gridTemplateColumns: "1.2fr 1.4fr 0.8fr 0.8fr 0.6fr",
          padding: "10px 14px", alignItems: "center",
          borderBottom: i < rows.length - 1 ? `1px solid ${ERP.colors.divider}` : "none",
          background: i % 2 ? ERP.colors.pageBg : "#fff", fontSize: 13,
        }}>
          <span style={{ fontFamily: ERP.font.mono, fontSize: 12 }}>{r.student_id}</span>
          <span style={{ fontWeight: 600 }}>{r.name}</span>
          <span>
            <span style={{
              padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700,
              background: p.bg, color: p.color, border: `1px solid ${p.border}`,
            }}>{r.class_name || "—"}</span>
          </span>
          <span style={{ fontSize: 11, color: ERP.colors.textMuted }}>
            {r.source === "import" ? "智能匯入" : r.source === "tab" ? "分頁勾選" : "手動"}
          </span>
          <button
            type="button"
            onClick={() => onRemove(r.pk)}
            style={{
              border: `1px solid ${ERP.colors.border}`, background: "#fff",
              borderRadius: 8, padding: "5px 8px", cursor: "pointer",
              color: ERP.colors.red, display: "inline-flex", alignItems: "center", gap: 4,
              fontSize: 12, fontWeight: 600, fontFamily: F, width: "fit-content",
            }}
          >
            <Trash2 size={12} /> 刪除
          </button>
        </div>
      );
    })}
  </div>
);

function rosterTabStyle(
  active: boolean,
  color: string,
  bg: string,
  border?: string,
): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    padding: "7px 12px",
    borderRadius: 10,
    border: `1.5px solid ${active ? (border || color) : ERP.colors.border}`,
    background: active ? bg : "#fff",
    color: active ? color : ERP.colors.textSecondary,
    fontWeight: active ? 800 : 600,
    fontSize: 12.5,
    fontFamily: F,
    cursor: "pointer",
    transition: "all 0.12s",
  };
}

function rosterTabCount(active: boolean): React.CSSProperties {
  return {
    marginLeft: 2,
    padding: "1px 7px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 800,
    background: active ? ERP.colors.accent : ERP.colors.pageBg,
    color: active ? "#fff" : ERP.colors.textMuted,
  };
}

const Card: React.FC<{
  icon: React.ReactNode; title: string; subtitle?: string; accent: string;
  children: React.ReactNode; overflowVisible?: boolean; elevate?: boolean;
}> = ({ icon, title, subtitle, accent, children, overflowVisible, elevate }) => (
  <div style={{
    background: ERP.colors.surface, border: `1px solid ${ERP.colors.border}`,
    borderRadius: ERP.radius.xl, boxShadow: ERP.shadow.card,
    overflow: overflowVisible ? "visible" : "hidden",
    position: "relative",
    zIndex: elevate ? 20 : 1,
  }}>
    <div style={{
      padding: "14px 22px", borderBottom: `1px solid ${ERP.colors.border}`,
      display: "flex", alignItems: "center", gap: 10, background: ERP.colors.pageBg,
      borderRadius: overflowVisible ? `${ERP.radius.xl} ${ERP.radius.xl} 0 0` : undefined,
    }}>
      <div style={{
        width: 30, height: 30, borderRadius: ERP.radius.md, background: accent + "18",
        border: `1px solid ${accent}30`, display: "flex", alignItems: "center", justifyContent: "center",
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 11, color: ERP.colors.textMuted, marginTop: 1 }}>{subtitle}</div>}
      </div>
    </div>
    <div style={{ padding: "20px 22px", overflow: overflowVisible ? "visible" : undefined, position: "relative" }}>
      {children}
    </div>
  </div>
);

const Field: React.FC<{ label: string; en: string; required?: boolean; children: React.ReactNode }> = ({
  label, en, required, children,
}) => (
  <div>
    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: ERP.colors.textSecondary, marginBottom: 7 }}>
      {label} <span style={{ color: ERP.colors.textMuted, fontWeight: 400 }}>{en}</span>
      {required && <span style={{ color: ERP.colors.error }}> *</span>}
    </label>
    {children}
  </div>
);

const btnSecondary: React.CSSProperties = {
  height: 36, padding: "0 14px", border: `1.5px solid ${ERP.colors.borderStrong}`,
  borderRadius: ERP.radius.md, background: "#fff", fontSize: 13, fontWeight: 600,
  color: ERP.colors.textSecondary, cursor: "pointer", fontFamily: F,
  display: "inline-flex", alignItems: "center", gap: 7,
};

const btnWarn: React.CSSProperties = {
  height: 36, padding: "0 16px", border: "none", borderRadius: ERP.radius.md,
  background: "linear-gradient(135deg, #EA580C 0%, #F59E0B 100%)",
  fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: F,
  display: "inline-flex", alignItems: "center", gap: 7,
};

export default Screen_DynamicGroupForm;
