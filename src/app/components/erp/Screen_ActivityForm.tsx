// ─────────────────────────────────────────────────────────────────────────────
// Activity Create / Edit — full-page form (replaces cramped offcanvas drawer)
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft, Calendar, Check, ChevronDown, Layers, Plus,
  Save, UserCog, X, Trophy, Sliders, Users, Sparkles, Zap, Upload, ClipboardPaste, QrCode,
} from "lucide-react";
import { ERP, type AcornTagKey } from "./erpTokens";
import { AttendanceScanner } from "./AttendanceScanner";

const F = ERP.font.family;

type TeacherOpt = {
  id: number | string;
  name?: string;
  name_en?: string;
  name_zh_hk?: string;
  role?: string;
  label?: string;
};
type Stage = { id: string; dbId?: number; label: string; labelEn: string; date: string };

type AchievementLevel = {
  id: number;
  code: string;
  name_en: string;
  name_zh_hk: string;
  base_points?: number;
  label?: string;
  sub?: string;
};

type ClubOpt = {
  id: number;
  zhName?: string;
  enName?: string;
  label?: string;
  achievementLevelId?: number | null;
};

type InitialActivity = {
  id?: number;
  name_en?: string;
  name_zh_hk?: string;
  category?: string;
  academic_year?: string;
  club_id?: number | null;
  teacher_ids?: number[];
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
  organizer?: string;
  co_organizer?: string;
  competition_track?: string;
  venue?: string;
  external_url?: string;
  issue_date?: string;
  signatory_name_title?: string;
};

function parseScheduleLocal(text: string): Stage[] {
  const lines = text.split(/\r?\n+/).map(l => l.trim()).filter(Boolean);
  const out: Stage[] = [];
  for (const line of lines) {
    if (/^(階段|stage|日期|date)/i.test(line)) continue;
    const parts = line.split(/[\t|,;]+/).map(p => p.trim()).filter(Boolean);
    if (!parts.length) continue;
    let date = "";
    let zh = "";
    let en = "";
    for (const p of parts) {
      if (/^\d{4}[-\/]\d{1,2}[-\/]\d{1,2}$/.test(p) || /^\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}$/.test(p)) {
        date = p.replace(/\//g, "-");
        const m = date.match(/^(\d{1,2})-(\d{1,2})-(\d{2,4})$/);
        if (m) {
          let y = Number(m[3]);
          if (y < 100) y += 2000;
          date = `${String(y).padStart(4, "0")}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
        }
        continue;
      }
      if (!zh && /[\u4e00-\u9fff]/.test(p)) { zh = p; continue; }
      if (!en) en = p;
    }
    if (!zh && !en) zh = parts[0];
    out.push({
      id: `s${Date.now()}-${out.length}`,
      label: zh || en,
      labelEn: en || zh,
      date,
    });
  }
  return out;
}

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
  clubs?: ClubOpt[];
  academicYears?: string[];
  targetForms?: string[];
  achievementLevels?: AchievementLevel[];
  enrollmentCount?: number;
  walkInCount?: number;
  walkInsUrl?: string;
  attendanceUrl?: string;
  rosterUrl?: string;
  storeUrl?: string;
  listUrl?: string;
  ocrUrl?: string;
  parseScheduleUrl?: string;
  parseDocumentUrl?: string;
  activityId?: number | null;
  initialActivity?: InitialActivity | null;
  scanUrl?: string;
  flashSuccess?: string;
  flashError?: string;
}> = ({
  teachers = [],
  clubs = [],
  academicYears = DEFAULT_YEARS,
  targetForms = DEFAULT_FORMS,
  achievementLevels = [],
  enrollmentCount = 0,
  walkInCount = 0,
  walkInsUrl = "",
  attendanceUrl = "",
  rosterUrl = "",
  storeUrl = "/activities/store",
  listUrl = "/activities",
  ocrUrl = "/activity/ocr",
  parseScheduleUrl = "/activities/parse-schedule",
  parseDocumentUrl = "/activities/parse-document",
  activityId = null,
  initialActivity = null,
  scanUrl = "/api/attendance/scan",
  flashSuccess,
  flashError,
}) => {
  const isEdit = !!activityId && activityId > 0;
  const fileRef = useRef<HTMLInputElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const [nameZh, setNameZh] = useState(initialActivity?.name_zh_hk || "");
  const [nameEn, setNameEn] = useState(initialActivity?.name_en || "");
  const [category, setCategory] = useState(initialActivity?.category || "比賽");
  const [year, setYear] = useState(initialActivity?.academic_year || academicYears[0] || "2025/26");
  const [clubId, setClubId] = useState<string>(
    initialActivity?.club_id ? String(initialActivity.club_id) : ""
  );
  const [teacherIds, setTeacherIds] = useState<string[]>(() => {
    if (initialActivity?.teacher_ids?.length) return initialActivity.teacher_ids.map(String);
    if (initialActivity?.teacher_in_charge_id) return [String(initialActivity.teacher_in_charge_id)];
    return [];
  });
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
    // One-off / new activities: empty schedule list — never seed 初賽/決賽.
    return src.map((s, i) => {
      const dbId = typeof s.id === "number" && s.id > 0 ? s.id : undefined;
      return {
        id: dbId ? `db-${dbId}` : `s${i}-${Date.now()}`,
        dbId,
        label: s.stage_name_zh_hk || "",
        labelEn: s.stage_name_en || "",
        date: s.date || "",
      };
    });
  });
  const [deletedSchedules, setDeletedSchedules] = useState<number[]>([]);
  const [schedulePaste, setSchedulePaste] = useState("");
  const [organizer, setOrganizer] = useState(initialActivity?.organizer || "");
  const [coOrganizer, setCoOrganizer] = useState(initialActivity?.co_organizer || "");
  const [competitionTrack, setCompetitionTrack] = useState(initialActivity?.competition_track || "");
  const [venue, setVenue] = useState(initialActivity?.venue || "");
  const [externalUrl, setExternalUrl] = useState(initialActivity?.external_url || "");
  const [issueDate, setIssueDate] = useState(initialActivity?.issue_date || "");
  const [signatory, setSignatory] = useState(initialActivity?.signatory_name_title || "");
  const [aiBusy, setAiBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(flashError || null);
  const [okMsg, setOkMsg] = useState<string | null>(flashSuccess || null);
  const [qrOpen, setQrOpen] = useState(false);

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

  const applyClubLink = (nextClubId: string) => {
    setClubId(nextClubId);
    if (!nextClubId) return;
    const club = clubs.find(c => String(c.id) === nextClubId);
    if (club?.achievementLevelId) {
      setLevelId(String(club.achievementLevelId));
      setOkMsg("已連結學會並繼承其成就環境級別 (L1–L4)。");
    } else {
      setOkMsg("已連結學會 — 儲存後可同步參與名單（名冊同步 API 待接）。");
    }
  };

  const toggleTeacher = (id: string) => {
    setTeacherIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSmartParseSchedule = async () => {
    const local = parseScheduleLocal(schedulePaste);
    if (local.length > 0) {
      setStages(local);
      setOkMsg(`已智能解析 ${local.length} 個賽程階段。`);
      setMsg(null);
      return;
    }
    try {
      const res = await fetch(parseScheduleUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ text: schedulePaste }),
      });
      const json = await res.json().catch(() => ({}));
      const stagesRaw = (json.stages || []) as Array<{ stage_name_zh_hk?: string; stage_name_en?: string; date?: string }>;
      if (!stagesRaw.length) {
        setMsg("未能解析賽程，請確認每行包含階段名稱與日期。");
        return;
      }
      setStages(stagesRaw.map((s, i) => ({
        id: `s${Date.now()}-${i}`,
        label: s.stage_name_zh_hk || "",
        labelEn: s.stage_name_en || "",
        date: s.date || "",
      })));
      setOkMsg(`已解析 ${stagesRaw.length} 個賽程階段。`);
    } catch {
      setMsg("賽程解析失敗，請重試。");
    }
  };

  const handleAiDocument = async (file?: File | null) => {
    if (!file) {
      // Demo auto-fill when no file selected
      setNameZh(prev => prev || "全港科學創意大賽（AI 預填示例）");
      setNameEn(prev => prev || "HKACE Science Competition (AI Demo)");
      setCategory("比賽");
      setAcornTags(["認知", "創意", "協作"]);
      rebalanceEvenly(["認知", "創意", "協作"]);
      // Demo only — do not persist unless user keeps rows and saves.
      setStages([
        { id: `s${Date.now()}-1`, label: "初賽", labelEn: "Heats", date: "" },
        { id: `s${Date.now()}-2`, label: "決賽", labelEn: "Finals", date: "" },
      ]);
      setDeletedSchedules([]);
      setOkMsg("✨ AI 預填示例已套用（正式上傳將呼叫 OCR / 文件解析 API）。");
      return;
    }
    setAiBusy(true);
    setMsg(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(parseDocumentUrl || ocrUrl, {
        method: "POST",
        body: fd,
        headers: { Accept: "application/json" },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.ok === false) {
        setMsg(json.message || "AI 文件解析失敗");
        return;
      }
      const ex = json.extracted || {};
      const title = String(ex.title || ex.name_zh_hk || "");
      if (title) {
        setNameZh(title);
        if (!nameEn) setNameEn(String(ex.name_en || title));
      }
      if (ex.category) setCategory(String(ex.category));
      const tags = (ex.acorn_tags || []) as AcornTagKey[];
      const validTags = tags.filter(t => ALL_ACORN_TAGS.includes(t));
      if (validTags.length) {
        setAcornTags(validTags);
        rebalanceEvenly(validTags);
      }
      const st = (ex.stages || []) as Array<{ stage_name_zh_hk?: string; stage_name_en?: string; date?: string }>;
      if (st.length) {
        setStages(st.map((s, i) => ({
          id: `ai-${Date.now()}-${i}`,
          label: s.stage_name_zh_hk || "",
          labelEn: s.stage_name_en || "",
          date: s.date || "",
        })));
      }
      setOkMsg("✨ 已以 AI 解析結果預填表單，請核對後儲存。");
    } catch {
      setMsg("AI 文件解析失敗，請重試。");
    } finally {
      setAiBusy(false);
    }
  };

  const removeStage = (ev: Stage) => {
    if (ev.dbId && ev.dbId > 0) {
      setDeletedSchedules(prev => (prev.includes(ev.dbId!) ? prev : [...prev, ev.dbId!]));
    }
    setStages(p => p.filter(s => s.id !== ev.id));
  };

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
          club_id: clubId === "" ? null : Number(clubId),
          teacher_ids: teacherIds.map(Number).filter(n => n > 0),
          forms,
          stages: stages.map(s => ({
            id: s.dbId || undefined,
            stage_name_zh_hk: s.label,
            stage_name_en: s.labelEn,
            date: s.date,
          })),
          deleted_schedules: deletedSchedules,
          acorn_tags: acornTags,
          acorn_weights: acornWeights,
          achievement_level_id: levelId === "" ? null : Number(levelId),
          status,
          organizer: organizer.trim(),
          co_organizer: coOrganizer.trim(),
          competition_track: competitionTrack.trim(),
          venue: venue.trim(),
          external_url: externalUrl.trim(),
          issue_date: issueDate.trim(),
          signatory_name_title: signatory.trim(),
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

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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
          {isEdit && (
            <button
              type="button"
              onClick={() => setQrOpen(true)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "8px 14px", borderRadius: ERP.radius.md,
                border: "1px solid #99F6E4", background: "#F0FDFA",
                color: "#0F766E", fontWeight: 700, fontSize: 13,
                cursor: "pointer", fontFamily: F,
              }}
            >
              <QrCode size={15} /> 📱 QR 簽到
            </button>
          )}
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

        {/* Global AI Document Parse Dropzone */}
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
          onDrop={e => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) handleAiDocument(f);
          }}
          style={{
            marginBottom: 16, padding: "18px 20px", borderRadius: ERP.radius.lg, cursor: "pointer",
            border: `1.5px dashed ${ERP.colors.accent}`,
            background: "linear-gradient(135deg, #EEF2FF 0%, #F0FDF4 100%)",
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" as const,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 42, height: 42, borderRadius: ERP.radius.md, background: "#fff",
              border: `1px solid ${ERP.colors.accentLight}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Sparkles size={18} color={ERP.colors.accent} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: ERP.colors.textPrimary }}>
                ✨ 上載活動通告 (AI 智能解析預填)
              </div>
              <div style={{ fontSize: 11, color: ERP.colors.textMuted, marginTop: 2 }}>
                Upload Circular for AI Auto-fill · Name / ACORN / Schedule
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              disabled={aiBusy}
              onClick={e => { e.stopPropagation(); handleAiDocument(null); }}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 12px",
                borderRadius: ERP.radius.md, border: `1px solid ${ERP.colors.border}`,
                background: "#fff", fontSize: 12, fontWeight: 700, fontFamily: F, cursor: "pointer",
              }}
            >
              <Sparkles size={13} /> 模擬預填
            </button>
            <button
              type="button"
              disabled={aiBusy}
              onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 12px",
                borderRadius: ERP.radius.md, border: "none",
                background: ERP.colors.accent, color: "#fff", fontSize: 12, fontWeight: 700, fontFamily: F, cursor: "pointer",
              }}
            >
              <Upload size={13} /> {aiBusy ? "解析中…" : "選擇檔案"}
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
            style={{ display: "none" }}
            onChange={e => handleAiDocument(e.target.files?.[0] || null)}
          />
        </div>

        <Section label="基本資訊" sub="Basic Info">
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>
            <Field label="活動名稱（中）" hint="必填">
              <input value={nameZh} onChange={e => setNameZh(e.target.value)} placeholder="例：全港科學創意大賽" style={inputStyle} />
            </Field>
            <Field label="活動名稱（英）">
              <input value={nameEn} onChange={e => setNameEn(e.target.value)} placeholder="e.g. HKACE Science Competition" style={inputStyle} />
            </Field>
          </div>

          <Field label="連結學會 Linked Club" hint="Optional">
            <div style={{ position: "relative" }}>
              <select
                name="club_id"
                value={clubId}
                onChange={e => applyClubLink(e.target.value)}
                style={{ ...inputStyle, paddingRight: 28, appearance: "none" as const, cursor: "pointer" }}
              >
                <option value="">— 不連結學會 —</option>
                {clubs.map(c => (
                  <option key={c.id} value={String(c.id)}>
                    {c.label || c.zhName || c.enName || `Club #${c.id}`}
                  </option>
                ))}
              </select>
              <ChevronDown size={13} color={ERP.colors.textMuted} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            </div>
            <div style={{ fontSize: 11, color: ERP.colors.textMuted, marginTop: 8 }}>
              選擇學會將可同步參與名單並繼承其 L1-L4 環境級別 (Link a club to auto-sync roster and inherit achievement levels).
            </div>
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>
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
          </div>

          <Field label="負責教師（可多選）" hint="Teachers in Charge">
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <UserCog size={13} color={ERP.colors.textMuted} />
              <span style={{ fontSize: 11, color: ERP.colors.textMuted }}>已選 {teacherIds.length} 位 · 按住 Ctrl/Cmd 或點擊 chip 多選</span>
            </div>
            <select
              name="teacher_ids[]"
              multiple
              value={teacherIds}
              onChange={e => setTeacherIds(Array.from(e.target.selectedOptions).map(o => o.value))}
              style={{ ...inputStyle, minHeight: 110 }}
            >
              {teacherOpts.map(t => (
                <option key={t.id} value={String(t.id)}>{t.label}</option>
              ))}
            </select>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
              {teacherOpts.map(t => {
                const id = String(t.id);
                const on = teacherIds.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleTeacher(id)}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 10px",
                      borderRadius: ERP.radius.full, fontSize: 11, fontWeight: 700, fontFamily: F, cursor: "pointer",
                      border: `1.5px solid ${on ? ERP.colors.accent : ERP.colors.border}`,
                      background: on ? ERP.colors.accentPale : ERP.colors.pageBg,
                      color: on ? ERP.colors.accent : ERP.colors.textSecondary,
                    }}
                  >
                    {on && <Check size={10} />}
                    {t.label}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="開放參與級別 Eligible Forms" hint="F1–F6 / All · 不是班別">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {(targetForms.length ? targetForms : formOptions).map(code => {
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
              可參與年級（Form），例如 F3 涵蓋 3A / 3B / 3C。已選：{forms.join("、") || "（無）"}
            </div>
          </Field>
        </Section>

        <Section label="外部 / 官方資料" sub="External / Official Details">
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>
            <Field label="主辦機構 Organizer" hint="必填（校外比賽）">
              <input
                value={organizer}
                onChange={e => setOrganizer(e.target.value)}
                placeholder="例：香港科技創新協會"
                style={inputStyle}
              />
            </Field>
            <Field label="協辦機構 Co-organizer" hint="Optional">
              <input
                value={coOrganizer}
                onChange={e => setCoOrganizer(e.target.value)}
                placeholder="例：教育局"
                style={inputStyle}
              />
            </Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>
            <Field label="比賽組別 / 項目 Competition Track" hint="Optional">
              <input
                value={competitionTrack}
                onChange={e => setCompetitionTrack(e.target.value)}
                placeholder="例：初中組 · STEM 發明"
                style={inputStyle}
              />
            </Field>
            <Field label="地點 Venue">
              <input
                value={venue}
                onChange={e => setVenue(e.target.value)}
                placeholder="例：香港會議展覽中心"
                style={inputStyle}
              />
            </Field>
          </div>
          <Field label="官方網址 External URL" hint="Optional">
            <input
              type="url"
              value={externalUrl}
              onChange={e => setExternalUrl(e.target.value)}
              placeholder="https://"
              style={inputStyle}
            />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>
            <Field label="證書簽發日期 Issue Date">
              <input
                type="date"
                value={issueDate}
                onChange={e => setIssueDate(e.target.value)}
                style={inputStyle}
              />
            </Field>
            <Field label="簽發人姓名及職銜 Signatory" hint="Optional">
              <input
                value={signatory}
                onChange={e => setSignatory(e.target.value)}
                placeholder="例：陳大文 主席"
                style={inputStyle}
              />
            </Field>
          </div>
        </Section>

        <Section label="賽程 / 日程" sub="Sub-events & Schedule">
          <div style={{
            marginBottom: 14, padding: 14, borderRadius: ERP.radius.md,
            border: `1px solid ${ERP.colors.border}`, background: ERP.colors.pageBg,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Zap size={14} color="#D97706" />
              <span style={{ fontSize: 12, fontWeight: 800 }}>賽程/日程 快速貼上區</span>
              <span style={{ fontSize: 11, color: ERP.colors.textMuted }}>Paste Schedule from Excel/Word</span>
            </div>
            <textarea
              value={schedulePaste}
              onChange={e => setSchedulePaste(e.target.value)}
              rows={3}
              placeholder={"初賽\tPreliminary\t2025-10-01\n決賽, Final, 2025-10-15"}
              style={{
                ...inputStyle, resize: "vertical", fontFamily: ERP.font.mono, fontSize: 12,
                background: "#FAFBFC", minHeight: 72,
              }}
            />
            <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" as const }}>
              <button
                type="button"
                onClick={() => navigator.clipboard.readText().then(t => setSchedulePaste(t)).catch(() => {})}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 12px",
                  borderRadius: ERP.radius.md, border: `1px solid ${ERP.colors.border}`,
                  background: "#fff", fontSize: 12, fontWeight: 700, fontFamily: F, cursor: "pointer",
                }}
              >
                <ClipboardPaste size={13} /> 貼上
              </button>
              <button
                type="button"
                onClick={handleSmartParseSchedule}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 12px",
                  borderRadius: ERP.radius.md, border: "1px solid #FDE68A",
                  background: "#FFFBEB", color: "#92400E", fontSize: 12, fontWeight: 700, fontFamily: F, cursor: "pointer",
                }}
              >
                <Zap size={13} /> ⚡ 智能解析 (Smart Parse)
              </button>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {/* Track DB schedule deletions for backend sync */}
            {deletedSchedules.map(id => (
              <input key={`del-${id}`} type="hidden" name="deleted_schedules[]" value={id} />
            ))}
            {stages.length === 0 && (
              <div style={{
                padding: "14px 12px", textAlign: "center" as const, fontSize: 12,
                color: ERP.colors.textMuted, border: `1px dashed ${ERP.colors.border}`,
                borderRadius: ERP.radius.md, background: "#FAFBFC",
              }}>
                尚未設定賽程階段（單次活動可留空）。可新增階段，或貼上文字後智能解析。
              </div>
            )}
            {stages.map((ev, idx) => (
              <div
                key={ev.id}
                className="schedule-row row gx-2 align-items-center flex-nowrap flex-md-wrap"
                data-schedule-id={ev.dbId || ""}
                style={{
                  display: "flex",
                  flexDirection: isMobile ? "column" : "row",
                  alignItems: isMobile ? "stretch" : "center",
                  flexWrap: isMobile ? "wrap" : "nowrap",
                  gap: 8,
                  padding: "10px 12px",
                  background: ERP.colors.pageBg,
                  border: `1px solid ${ERP.colors.border}`,
                  borderRadius: ERP.radius.md,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, width: isMobile ? "100%" : "auto", flexShrink: 0 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: ERP.radius.sm, flexShrink: 0,
                    background: ERP.colors.accentPale, border: `1px solid ${ERP.colors.accentLight}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, fontWeight: 800, color: ERP.colors.accent,
                  }}>{idx + 1}</div>
                  <input
                    value={ev.label}
                    placeholder="階段名"
                    onChange={e => setStages(p => p.map(s => s.id === ev.id ? { ...s, label: e.target.value } : s))}
                    style={{ ...inputStyle, flex: isMobile ? 1 : "0 0 96px", minWidth: isMobile ? 0 : 96, padding: "6px 8px" }}
                  />
                </div>
                <input
                  value={ev.labelEn}
                  placeholder="English name"
                  onChange={e => setStages(p => p.map(s => s.id === ev.id ? { ...s, labelEn: e.target.value } : s))}
                  style={{ ...inputStyle, flex: 1, minWidth: 0, padding: "6px 8px", width: isMobile ? "100%" : undefined }}
                />
                <div style={{
                  display: "flex", alignItems: "center", gap: 5,
                  width: isMobile ? "100%" : "auto", flexShrink: 0,
                }}>
                  <Calendar size={12} color={ERP.colors.textMuted} />
                  <input
                    type="date"
                    value={ev.date}
                    onChange={e => setStages(p => p.map(s => s.id === ev.id ? { ...s, date: e.target.value } : s))}
                    style={{
                      ...inputStyle,
                      flex: 1,
                      minWidth: 140,
                      width: isMobile ? "100%" : 150,
                      maxWidth: "100%",
                      padding: "6px 8px",
                      boxSizing: "border-box",
                    }}
                  />
                  <button type="button" onClick={() => removeStage(ev)} title="刪除階段" style={{
                    width: isMobile ? 36 : 28, height: isMobile ? 36 : 28,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    border: `1px solid ${ERP.colors.border}`, borderRadius: ERP.radius.sm,
                    background: "transparent", color: ERP.colors.textMuted, cursor: "pointer", flexShrink: 0,
                  }}><X size={12} /></button>
                </div>
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
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
                  <a href={rosterUrl} style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
                    width: "100%", boxSizing: "border-box", padding: "9px 14px",
                    borderRadius: ERP.radius.md, border: `1px solid ${ERP.colors.accentLight}`,
                    background: ERP.colors.accentPale, color: ERP.colors.accent,
                    fontSize: 13, fontWeight: 700, fontFamily: F, textDecoration: "none",
                  }}>
                    <Users size={14} /> 管理名單
                  </a>
                  {walkInCount > 0 && walkInsUrl && (
                    <a
                      href={walkInsUrl}
                      className="btn btn-danger"
                      style={{
                        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
                        width: "100%", boxSizing: "border-box", padding: "9px 14px",
                        borderRadius: ERP.radius.md, border: "1px solid #FECACA",
                        background: "#DC2626", color: "#fff",
                        fontSize: 13, fontWeight: 800, fontFamily: F, textDecoration: "none",
                        boxShadow: "0 2px 8px rgba(220,38,38,0.35)",
                        animation: "walkInPulse 1.6s ease-in-out infinite",
                      }}
                    >
                      🚨 未報名學生 ({walkInCount})
                    </a>
                  )}
                  {attendanceUrl && (
                    <a
                      href={attendanceUrl}
                      className="btn btn-outline-success w-100 mt-2"
                      style={{
                        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
                        width: "100%", boxSizing: "border-box", padding: "9px 14px", marginTop: 0,
                        borderRadius: ERP.radius.md, border: "1.5px solid #6EE7B7",
                        background: "#ECFDF5", color: "#047857",
                        fontSize: 13, fontWeight: 800, fontFamily: F, textDecoration: "none",
                      }}
                    >
                      📅 簽到紀錄 (Attendance Records)
                    </a>
                  )}
                </div>
              ) : (
                <div style={{ marginTop: 8, fontSize: 11, color: ERP.colors.textMuted }}>儲存活動後即可管理參與名單。</div>
              )}
              <style>{`@keyframes walkInPulse { 0%,100%{ transform:scale(1); } 50%{ transform:scale(1.015); } }`}</style>
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

      {isEdit && activityId != null && activityId > 0 && (
        <AttendanceScanner
          open={qrOpen}
          onClose={() => setQrOpen(false)}
          entityType="activity"
          entityId={activityId}
          entityLabel={nameZh || nameEn || `活動 #${activityId}`}
          scanUrl={scanUrl}
          schedulesUrl={`/api/attendance/schedules/${activityId}`}
        />
      )}
    </div>
  );
};
