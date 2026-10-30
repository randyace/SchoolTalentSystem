// ─────────────────────────────────────────────────────────────────────────────
// Screen 1.E.1b  管理分組 / Manage Project Groups
// Dual-panel: create groups + Smart Import / Form-Class tab grid + overview
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft, Check, ClipboardPaste, Dices, Layers, Loader2, Plus, Trash2, Users, Zap,
} from "lucide-react";
import { ERP } from "./erpTokens";

declare global {
  interface Window {
    Sortable?: {
      create: (el: HTMLElement, opts: Record<string, unknown>) => { destroy: () => void };
    };
  }
}

function loadSortableJs(): Promise<void> {
  if (window.Sortable) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector("script[data-sortablejs]");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("SortableJS load failed")));
      return;
    }
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/sortablejs@1.15.2/Sortable.min.js";
    s.async = true;
    s.dataset.sortablejs = "1";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("SortableJS load failed"));
    document.head.appendChild(s);
  });
}

const ROLE_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  T3: { bg: "#F5F3FF", color: "#7C3AED", label: "組長 (T3)" },
  T2: { bg: "#EFF6FF", color: "#2563EB", label: "支援 (T2)" },
  T1: { bg: "#FEF3C7", color: "#B45309", label: "成員 (T1)" },
};

const CONFIRM_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  confirmed: { bg: "#DBEAFE", color: "#1D4ED8", label: "已確認" },
  pending:   { bg: "#F1F5F9", color: "#64748B", label: "待確認" },
  rejected:  { bg: "#FFEDD5", color: "#C2410C", label: "已拒絕" },
};

const F = ERP.font.family;

export type RosterStudent = {
  id: number;
  pk?: number;
  student_id: string;
  name_zh_hk?: string;
  name_en?: string;
  name?: string;
  class_name: string;
  class_number?: number;
  form?: string;
};

export type EligibleTab = {
  form: string;
  label: string;
  count: number;
  classes: Record<string, RosterStudent[]>;
};

export type GroupMember = {
  id: number;
  student_id: string;
  name_zh_hk?: string;
  name_en?: string;
  class_name?: string;
  role?: string;
  role_tier?: string;
  role_label?: string;
  role_confirm_status?: string;
  submission_status?: string;
};

export type ProjectGroupCard = {
  id: number;
  group_name: string;
  students: GroupMember[];
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
  "5A": { bg: "#DBEAFE", color: "#1D4ED8", border: "#93C5FD" },
  "5B": { bg: "#EDE9FE", color: "#6D28D9", border: "#C4B5FD" },
  "6A": { bg: "#DBEAFE", color: "#1D4ED8", border: "#93C5FD" },
  "6B": { bg: "#EDE9FE", color: "#6D28D9", border: "#C4B5FD" },
};

function pal(cls: string) {
  return CLASS_PAL[cls] ?? { bg: "#F1F5F9", color: "#475569", border: "#CBD5E1" };
}

function pkOf(s: RosterStudent): number {
  return s.pk || s.id;
}

export const Screen_ProjectGroups: React.FC<{
  projectId?: number | null;
  projectTitle?: string;
  form?: string;
  targetForms?: string[];
  academicYear?: string;
  groups?: ProjectGroupCard[];
  eligibleTabs?: EligibleTab[];
  assignedIds?: number[];
  listUrl?: string;
  createGroupUrl?: string;
  assignUrl?: string;
  removeUrl?: string;
  randomizeUrl?: string;
  moveStudentUrl?: string;
  flashSuccess?: string;
  flashError?: string;
}> = ({
  projectId = null,
  projectTitle = "專題",
  form = "F3",
  targetForms = [],
  academicYear = "2025/26",
  groups = [],
  eligibleTabs = [],
  assignedIds = [],
  listUrl = "/projects",
  createGroupUrl = "",
  assignUrl = "",
  removeUrl = "",
  randomizeUrl = "",
  moveStudentUrl = "",
  flashSuccess,
  flashError,
}) => {
  const pid = projectId && projectId > 0 ? projectId : 0;
  const postAssign = assignUrl || (pid ? `/projects/groups/${pid}/assign` : "");
  const postCreate = createGroupUrl || (pid ? `/projects/groups/${pid}/create` : "");
  const postRemove = removeUrl || (pid ? `/projects/groups/${pid}/remove` : "");
  const postRandomize = randomizeUrl || (pid ? `/projects/groups/${pid}/randomize` : "");
  const postMove = moveStudentUrl || (pid ? `/projects/groups/${pid}/move` : "");
  const formsLabel = (targetForms?.length ? targetForms : (form ? [form] : [])).join("、") || "—";

  const enrolledIds = useMemo(() => new Set(assignedIds), [assignedIds]);
  const pool = useMemo(() => {
    const all: RosterStudent[] = [];
    eligibleTabs.forEach(t => {
      Object.values(t.classes || {}).forEach(list => all.push(...list));
    });
    return all;
  }, [eligibleTabs]);

  const [activeTab, setActiveTab] = useState(eligibleTabs[0]?.form || form || "");
  const [selected, setSelected] = useState<Set<number>>(() => new Set());
  const [targetGroupId, setTargetGroupId] = useState<string>(groups[0] ? String(groups[0].id) : "");
  const [newGroupName, setNewGroupName] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [randomizing, setRandomizing] = useState(false);
  const [localGroups, setLocalGroups] = useState<ProjectGroupCard[]>(groups);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const sortablesRef = useRef<Array<{ destroy: () => void }>>([]);

  useEffect(() => { setLocalGroups(groups); }, [groups]);

  useEffect(() => {
    let cancelled = false;
    const setup = async () => {
      sortablesRef.current.forEach(s => s.destroy());
      sortablesRef.current = [];
      if (!boardRef.current || !postMove) return;
      try {
        await loadSortableJs();
      } catch {
        return;
      }
      if (cancelled || !window.Sortable || !boardRef.current) return;
      const lists = boardRef.current.querySelectorAll<HTMLElement>("[data-group-list]");
      lists.forEach(listEl => {
        const sortable = window.Sortable!.create(listEl, {
          group: "pbl-groups",
          animation: 150,
          ghostClass: "pbl-sortable-ghost",
          onAdd: async (evt: { item: HTMLElement; to: HTMLElement; from: HTMLElement }) => {
            const studentId = Number(evt.item.dataset.studentId || 0);
            const toGroupId = Number(evt.to.dataset.groupId || 0);
            const fromGroupId = Number(evt.from.dataset.groupId || 0);
            const role = String(evt.item.dataset.role || "T1");
            if (!studentId || !toGroupId) return;
            try {
              const res = await fetch(postMove, {
                method: "POST",
                credentials: "same-origin",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify({
                  student_id: studentId,
                  to_group_id: toGroupId,
                  from_group_id: fromGroupId,
                  role,
                }),
              });
              const data = await res.json().catch(() => ({}));
              if (!res.ok || data?.ok === false) {
                window.alert(data?.message || "移動失敗");
                window.location.reload();
              }
            } catch {
              window.alert("移動失敗");
              window.location.reload();
            }
          },
        });
        sortablesRef.current.push(sortable);
      });
    };
    void setup();
    return () => {
      cancelled = true;
      sortablesRef.current.forEach(s => s.destroy());
      sortablesRef.current = [];
    };
  }, [localGroups, postMove]);

  const handleRandomize = async () => {
    if (!postRandomize || randomizing) return;
    const raw = window.prompt("每組人數為？ (Students per group?)", "4");
    if (raw === null) return;
    const size = Number.parseInt(raw, 10);
    if (!Number.isFinite(size) || size < 2 || size > 20) {
      window.alert("請輸入 2–20 的整數。");
      return;
    }
    const hasGroups = localGroups.length > 0;
    let mode: "unassigned_only" | "reset_all" = "reset_all";
    if (hasGroups) {
      const onlyUnassigned = window.confirm(
        "現有組別已存在。\n\n按「確定」：僅分配尚未入組的學生（安全預設 unassigned_only）\n按「取消」：進入「清空重建」確認。"
      );
      if (onlyUnassigned) {
        mode = "unassigned_only";
      } else {
        const wipe = window.confirm(
          "確認清空並重建所有組別？\n此操作會移除現有組員分配且不可復原（reset_all）。\n\n按「確定」繼續，按「取消」中止。"
        );
        if (!wipe) return;
        mode = "reset_all";
      }
    }
    setRandomizing(true);
    try {
      const res = await fetch(postRandomize, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ group_size: size, mode }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) {
        throw new Error(data?.message || "隨機分組失敗");
      }
      window.location.reload();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "隨機分組失敗");
    } finally {
      setRandomizing(false);
    }
  };

  const moveViaSelect = async (studentId: number, fromGroupId: number, toGroupId: number, role: string) => {
    if (!postMove || toGroupId === fromGroupId) return;
    try {
      const res = await fetch(postMove, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          student_id: studentId,
          to_group_id: toGroupId,
          from_group_id: fromGroupId,
          role,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) {
        window.alert(data?.message || "移動失敗");
        return;
      }
      window.location.reload();
    } catch {
      window.alert("移動失敗");
    }
  };
  const [parseMsg, setParseMsg] = useState<string | null>(null);

  const activeTabData = eligibleTabs.find(t => t.form === activeTab) || eligibleTabs[0];

  const toggle = (id: number, on: boolean) => {
    if (enrolledIds.has(id)) return;
    setSelected(prev => {
      const next = new Set(prev);
      if (on) next.add(id); else next.delete(id);
      return next;
    });
  };

  const selectClass = (list: RosterStudent[], allOn: boolean) => {
    setSelected(prev => {
      const next = new Set(prev);
      list.forEach(s => {
        const id = pkOf(s);
        if (enrolledIds.has(id)) return;
        if (allOn) next.add(id); else next.delete(id);
      });
      return next;
    });
  };

  const handleSmartParse = () => {
    const lines = pasteText.split(/\n+/).map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      setParseMsg("請先貼上學生名單。");
      return;
    }
    let matched = 0;
    let unmatched = 0;
    let already = 0;
    const next = new Set(selected);
    for (const line of lines) {
      const parts = line.split(/[,;\t ]+/).map(p => p.trim()).filter(Boolean);
      const token = parts[0] || "";
      const nameHint = parts[1] || "";
      const hit = pool.find(s =>
        s.student_id === token
        || String(pkOf(s)) === token
        || (!!nameHint && (s.name_zh_hk === nameHint || s.name === nameHint || s.name_en?.toLowerCase() === nameHint.toLowerCase()))
      );
      if (!hit) { unmatched++; continue; }
      const id = pkOf(hit);
      if (enrolledIds.has(id)) { already++; continue; }
      next.add(id);
      matched++;
    }
    setSelected(next);
    setParseMsg(`配對 ${matched} 名可加入學生` + (already ? `；已在分組 ${already}` : "") + (unmatched ? `；未能配對 ${unmatched} 行` : "") + "。");
  };

  const handleAssignSubmit = (e: React.FormEvent) => {
    if (!targetGroupId) {
      e.preventDefault();
      setParseMsg("請先選擇目標組別。");
      return;
    }
    if (selected.size === 0) {
      e.preventDefault();
      setParseMsg("請勾選或匯入至少一名學生。");
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 28px 64px", fontFamily: F }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <a href={listUrl} style={{ display: "inline-flex", alignItems: "center", gap: 6, color: ERP.colors.accent, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
            <ArrowLeft size={14} /> 返回專題看板
          </a>
          <a href="/role-anchoring" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: ERP.colors.teal, fontSize: 12, fontWeight: 700, textDecoration: "none", padding: "6px 10px", borderRadius: ERP.radius.md, border: `1px solid ${ERP.colors.border}`, background: ERP.colors.surface }}>
            角色定錨 1.E.3 →
          </a>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 18, flexWrap: "wrap" as const }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: ERP.colors.textPrimary }}>{projectTitle}</div>
          <div style={{ fontSize: 12, color: ERP.colors.textMuted, marginTop: 4 }}>
            管理分組 · Manage Groups · AY {academicYear} · 目標級別 {formsLabel}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" as const }}>
          <button
            type="button"
            onClick={() => void handleRandomize()}
            disabled={!postRandomize || randomizing}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "8px 14px", borderRadius: ERP.radius.md,
              border: "1px solid #C4B5FD", background: "linear-gradient(135deg,#F5F3FF,#EDE9FE)",
              color: "#6D28D9", fontSize: 13, fontWeight: 800, fontFamily: F,
              cursor: randomizing ? "wait" : "pointer", opacity: !postRandomize ? 0.5 : 1,
            }}
          >
            {randomizing ? <Loader2 size={14} className="animate-spin" /> : <Dices size={14} />}
            {randomizing ? "分組中…" : "🎲 系統隨機分組 System Randomize"}
          </button>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "6px 12px", borderRadius: ERP.radius.full,
            background: ERP.colors.accentPale, border: `1px solid ${ERP.colors.accentLight}`,
            color: ERP.colors.accent, fontSize: 13, fontWeight: 800,
          }}>
            <Users size={14} /> {localGroups.length} 組 · {assignedIds.length} 已分配
          </div>
        </div>
      </div>

      {(flashSuccess || flashError || parseMsg) && (
        <div style={{
          marginBottom: 14, padding: "10px 14px", borderRadius: ERP.radius.md, fontSize: 13, fontWeight: 600,
          background: flashError ? ERP.colors.redLight : ERP.colors.successLight,
          color: flashError ? ERP.colors.red : ERP.colors.success,
          border: `1px solid ${flashError ? ERP.colors.red : ERP.colors.success}33`,
        }}>
          {flashError || flashSuccess || parseMsg}
        </div>
      )}

      {/* ── Top: Create group + target selector ── */}
      <div style={{
        background: ERP.colors.surface, border: `1px solid ${ERP.colors.border}`,
        borderRadius: ERP.radius.lg, padding: "18px 20px", marginBottom: 16, boxShadow: ERP.shadow.xs,
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16,
      }}>
        <form method="POST" action={postCreate} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 800, display: "flex", alignItems: "center", gap: 6 }}>
            <Plus size={14} color={ERP.colors.accent} /> 新增組別 Add Group
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              name="group_name"
              value={newGroupName}
              onChange={e => setNewGroupName(e.target.value)}
              placeholder="例如 Group A / 第一組"
              required
              style={{
                flex: 1, padding: "9px 12px", borderRadius: ERP.radius.md,
                border: `1px solid ${ERP.colors.border}`, fontFamily: F, fontSize: 13, outline: "none",
              }}
            />
            <button type="submit" style={{
              display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 14px",
              border: "none", borderRadius: ERP.radius.md, background: ERP.colors.accent, color: "#fff",
              fontSize: 13, fontWeight: 700, fontFamily: F, cursor: "pointer", whiteSpace: "nowrap",
            }}>
              <Plus size={14} /> 新增
            </button>
          </div>
        </form>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 800 }}>目標組別 Target Group</div>
          <select
            value={targetGroupId}
            onChange={e => setTargetGroupId(e.target.value)}
            style={{
              padding: "9px 12px", borderRadius: ERP.radius.md,
              border: `1px solid ${ERP.colors.border}`, fontFamily: F, fontSize: 13,
            }}
          >
            <option value="">— 請選擇組別 —</option>
            {localGroups.map(g => (
              <option key={g.id} value={String(g.id)}>
                {g.group_name}（{g.students.length} 人）
              </option>
            ))}
          </select>
          {localGroups.length === 0 && (
            <div style={{ fontSize: 11, color: ERP.colors.textMuted }}>請先新增至少一個組別，或使用系統隨機分組。</div>
          )}
        </div>
      </div>

      {/* ── Middle: Smart import + tabbed grid ── */}
      <form method="POST" action={postAssign} onSubmit={handleAssignSubmit}>
        <input type="hidden" name="group_id" value={targetGroupId} />
        {Array.from(selected).map(id => (
          <input key={id} type="hidden" name="student_ids[]" value={String(id)} />
        ))}

        <div style={{
          background: ERP.colors.surface, border: `1px solid ${ERP.colors.border}`,
          borderRadius: ERP.radius.lg, padding: "18px 20px", marginBottom: 16, boxShadow: ERP.shadow.xs,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <Zap size={15} color="#D97706" />
            <span style={{ fontSize: 13, fontWeight: 800 }}>智能名單匯入</span>
            <span style={{ fontSize: 11, color: ERP.colors.textMuted }}>Smart Roster Import · {form} students</span>
          </div>
          <textarea
            value={pasteText}
            onChange={e => setPasteText(e.target.value)}
            rows={3}
            placeholder={"S00007, 陳大明\n…（僅限本專題目標級別）"}
            style={{
              width: "100%", boxSizing: "border-box", padding: 12, marginTop: 10,
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
        </div>

        <div style={{
          background: ERP.colors.surface, border: `1px solid ${ERP.colors.border}`,
          borderRadius: ERP.radius.lg, padding: "18px 20px", marginBottom: 16, boxShadow: ERP.shadow.xs,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Layers size={15} color={ERP.colors.teal} />
            <span style={{ fontSize: 13, fontWeight: 800 }}>{form} 班級 · 勾選學生</span>
            <span style={{ fontSize: 11, color: ERP.colors.textMuted }}>已選 {selected.size} 人 · 已分配者已灰顯</span>
          </div>

          {eligibleTabs.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: ERP.colors.textMuted }}>
              此專題尚未設定目標級別，或該級別本學年沒有學生。請先在專題編輯中選擇 Form。
            </div>
          ) : (
            <>
              <div style={{
                display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14,
                borderBottom: `1px solid ${ERP.colors.border}`, paddingBottom: 10,
              }}>
                {eligibleTabs.map(t => {
                  const active = t.form === (activeTabData?.form || activeTab);
                  return (
                    <button
                      key={t.form}
                      type="button"
                      onClick={() => setActiveTab(t.form)}
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
                <div style={{ display: "flex", flexDirection: "column", gap: 14, maxHeight: 420, overflowY: "auto" }}>
                  {Object.keys(activeTabData.classes || {}).sort().map(cls => {
                    const list = activeTabData.classes[cls] || [];
                    const p = pal(cls);
                    const addable = list.filter(s => !enrolledIds.has(pkOf(s)));
                    const allChecked = addable.length > 0 && addable.every(s => selected.has(pkOf(s)));
                    return (
                      <div key={cls} style={{ border: `1px solid ${ERP.colors.border}`, borderRadius: 12, overflow: "hidden" }}>
                        <div style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "8px 12px", background: p.bg, borderBottom: `1px solid ${p.border}`,
                        }}>
                          <span style={{ fontWeight: 800, fontSize: 13, color: p.color }}>{cls} · {list.length} 人</span>
                          <button
                            type="button"
                            onClick={() => selectClass(list, !allChecked)}
                            style={{
                              border: `1px solid ${p.border}`, background: "#fff", borderRadius: 8,
                              padding: "4px 10px", fontSize: 11, fontWeight: 700, color: p.color,
                              cursor: "pointer", fontFamily: F,
                            }}
                          >
                            {allChecked ? "取消全選" : "全選本班"}
                          </button>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
                          {list.map(s => {
                            const id = pkOf(s);
                            const enrolled = enrolledIds.has(id);
                            const checked = enrolled || selected.has(id);
                            return (
                              <label
                                key={id}
                                style={{
                                  display: "flex", alignItems: "center", gap: 8,
                                  padding: "9px 12px", cursor: enrolled ? "default" : "pointer", fontFamily: F,
                                  borderBottom: `1px solid ${ERP.colors.divider}`,
                                  background: enrolled ? ERP.colors.pageBg : checked ? "#EFF6FF" : "#fff",
                                  opacity: enrolled ? 0.55 : 1,
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  disabled={enrolled}
                                  onChange={e => toggle(id, e.target.checked)}
                                  style={{ width: 15, height: 15, accentColor: ERP.colors.accent }}
                                />
                                <span style={{ fontFamily: ERP.font.mono, fontSize: 11, color: ERP.colors.textMuted }}>{s.student_id}</span>
                                <span style={{ fontSize: 13, fontWeight: 600 }}>{s.name || s.name_zh_hk || s.name_en}</span>
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

          <div style={{
            position: "sticky", bottom: 0, marginTop: 16, paddingTop: 12,
            borderTop: `1px solid ${ERP.colors.border}`, background: ERP.colors.surface,
            display: "flex", justifyContent: "flex-end",
          }}>
            <button
              type="submit"
              disabled={!postAssign || !targetGroupId}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "10px 18px", border: "none", borderRadius: ERP.radius.md,
                background: selected.size && targetGroupId ? ERP.colors.accent : ERP.colors.border,
                color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: F,
                cursor: selected.size && targetGroupId ? "pointer" : "not-allowed",
              }}
            >
              <Check size={15} /> 分配至選定組別 · {selected.size}
            </button>
          </div>
        </div>
      </form>

      {/* ── Bottom: Group overview (drag between groups or use dropdown) ── */}
      <div style={{ marginBottom: 10, display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" as const }}>
        <div style={{ fontSize: 13, fontWeight: 800 }}>目前分組概覽 Current Grouping</div>
        <div style={{ fontSize: 11, color: ERP.colors.textMuted }}>可拖曳學生至其他組，或使用下拉選單調整</div>
      </div>
      {localGroups.length === 0 ? (
        <div style={{
          padding: 32, textAlign: "center", color: ERP.colors.textMuted, fontSize: 13,
          background: ERP.colors.surface, border: `1px solid ${ERP.colors.border}`, borderRadius: ERP.radius.lg,
        }}>
          尚未建立組別。請使用「系統隨機分組」或上方手動新增。
        </div>
      ) : (
        <div ref={boardRef} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
          {localGroups.map(g => (
            <div key={g.id} style={{
              background: ERP.colors.surface, border: `1px solid ${ERP.colors.border}`,
              borderRadius: ERP.radius.lg, overflow: "hidden", boxShadow: ERP.shadow.xs,
            }}>
              <div style={{
                padding: "12px 14px", borderBottom: `1px solid ${ERP.colors.border}`,
                background: ERP.colors.pageBg, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" as const,
              }}>
                <span style={{ fontSize: 14, fontWeight: 800 }}>{g.group_name}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: ERP.colors.accent }}>{g.students.length} 人</span>
                  <a
                    href={`/role-anchoring?group_id=${g.id}`}
                    title="前往角色定錨"
                    style={{
                      fontSize: 11, fontWeight: 800, textDecoration: "none",
                      padding: "4px 8px", borderRadius: 6,
                      border: `1px solid ${ERP.colors.border}`, background: ERP.colors.surface,
                      color: ERP.colors.teal, whiteSpace: "nowrap",
                    }}
                  >⚓ 前往角色定錨</a>
                </div>
              </div>
              <div
                data-group-list
                data-group-id={g.id}
                style={{ padding: "8px 10px", minHeight: 80, maxHeight: 320, overflowY: "auto" }}
              >
                {g.students.length === 0 && (
                  <div style={{ padding: "16px 8px", textAlign: "center", fontSize: 12, color: ERP.colors.textMuted }}>尚無成員 · 可拖入學生</div>
                )}
                {g.students.map(s => {
                  const role = (s.role_tier || s.role || "T1").toUpperCase();
                  const rs = ROLE_STYLE[role] || ROLE_STYLE.T1;
                  const confirm = (s.role_confirm_status || "pending").toLowerCase();
                  const cs = CONFIRM_STYLE[confirm] || CONFIRM_STYLE.pending;
                  return (
                    <div
                      key={s.id}
                      data-student-id={s.id}
                      data-role={role}
                      style={{
                        display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8,
                        padding: "8px 6px", borderBottom: `1px solid ${ERP.colors.divider}`,
                        cursor: "grab", background: ERP.colors.surface,
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" as const }}>
                          <span style={{ fontSize: 13, fontWeight: 700 }}>{s.name_zh_hk || s.name_en || s.student_id}</span>
                          <span style={{
                            fontSize: 10, fontWeight: 800, padding: "1px 6px", borderRadius: 9999,
                            background: rs.bg, color: rs.color,
                          }}>{s.role_label || rs.label}</span>
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 9999,
                            background: cs.bg, color: cs.color,
                          }}>{cs.label}</span>
                        </div>
                        <div style={{ fontSize: 10, color: ERP.colors.textMuted, fontFamily: ERP.font.mono, marginTop: 2 }}>
                          {s.student_id}{s.class_name ? ` · ${s.class_name}` : ""}
                        </div>
                        {localGroups.length > 1 && (
                          <select
                            value={String(g.id)}
                            onChange={e => void moveViaSelect(s.id, g.id, Number(e.target.value), role)}
                            style={{
                              marginTop: 6, width: "100%", fontSize: 11, fontFamily: F,
                              padding: "4px 6px", borderRadius: 6, border: `1px solid ${ERP.colors.border}`,
                              background: ERP.colors.pageBg, color: ERP.colors.textSecondary,
                            }}
                          >
                            {localGroups.map(opt => (
                              <option key={opt.id} value={String(opt.id)}>
                                {opt.id === g.id ? `目前：${opt.group_name}` : `移至 ${opt.group_name}`}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                      <form method="POST" action={postRemove} onSubmit={e => { if (!window.confirm("確定移除此學生？")) e.preventDefault(); }}>
                        <input type="hidden" name="group_id" value={g.id} />
                        <input type="hidden" name="student_id" value={s.id} />
                        <button type="submit" title="移除" style={{
                          display: "inline-flex", alignItems: "center", gap: 3,
                          padding: "4px 8px", borderRadius: 6, border: `1px solid ${ERP.colors.red}44`,
                          background: ERP.colors.redLight, color: ERP.colors.red,
                          fontSize: 11, fontWeight: 700, fontFamily: F, cursor: "pointer",
                        }}>
                          <Trash2 size={11} />
                        </button>
                      </form>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const btnSecondary: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6,
  padding: "7px 12px", borderRadius: ERP.radius.md,
  border: `1px solid ${ERP.colors.border}`, background: "#fff",
  fontSize: 12, fontWeight: 700, fontFamily: F, cursor: "pointer", color: ERP.colors.textSecondary,
};
const btnWarn: React.CSSProperties = {
  ...btnSecondary,
  border: "1px solid #FDE68A", background: "#FFFBEB", color: "#92400E",
};
