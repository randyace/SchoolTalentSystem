// ─────────────────────────────────────────────────────────────────────────────
// Screen 1.E.1b  管理分組 / Manage Project Groups
// Dual-panel: create groups + Smart Import / Form-Class tab grid + overview
// ─────────────────────────────────────────────────────────────────────────────
import React, { useMemo, useState } from "react";
import {
  ArrowLeft, Check, ClipboardPaste, Layers, Plus, Trash2, Users, Zap,
} from "lucide-react";
import { ERP } from "./erpTokens";

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
  academicYear?: string;
  groups?: ProjectGroupCard[];
  eligibleTabs?: EligibleTab[];
  assignedIds?: number[];
  listUrl?: string;
  createGroupUrl?: string;
  assignUrl?: string;
  removeUrl?: string;
  flashSuccess?: string;
  flashError?: string;
}> = ({
  projectId = null,
  projectTitle = "專題",
  form = "F3",
  academicYear = "2025/26",
  groups = [],
  eligibleTabs = [],
  assignedIds = [],
  listUrl = "/projects",
  createGroupUrl = "",
  assignUrl = "",
  removeUrl = "",
  flashSuccess,
  flashError,
}) => {
  const pid = projectId && projectId > 0 ? projectId : 0;
  const postAssign = assignUrl || (pid ? `/projects/groups/${pid}/assign` : "");
  const postCreate = createGroupUrl || (pid ? `/projects/groups/${pid}/create` : "");
  const postRemove = removeUrl || (pid ? `/projects/groups/${pid}/remove` : "");

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
        <a href={listUrl} style={{ display: "inline-flex", alignItems: "center", gap: 6, color: ERP.colors.accent, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
          <ArrowLeft size={14} /> 返回專題看板
        </a>
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 18, flexWrap: "wrap" as const }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: ERP.colors.textPrimary }}>{projectTitle}</div>
          <div style={{ fontSize: 12, color: ERP.colors.textMuted, marginTop: 4 }}>
            管理分組 · Manage Groups · AY {academicYear} · 目標級別 {form || "—"}
          </div>
        </div>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "6px 12px", borderRadius: ERP.radius.full,
          background: ERP.colors.accentPale, border: `1px solid ${ERP.colors.accentLight}`,
          color: ERP.colors.accent, fontSize: 13, fontWeight: 800,
        }}>
          <Users size={14} /> {groups.length} 組 · {assignedIds.length} 已分配
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
            {groups.map(g => (
              <option key={g.id} value={String(g.id)}>
                {g.group_name}（{g.students.length} 人）
              </option>
            ))}
          </select>
          {groups.length === 0 && (
            <div style={{ fontSize: 11, color: ERP.colors.textMuted }}>請先新增至少一個組別，再分配學生。</div>
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

      {/* ── Bottom: Group overview ── */}
      <div style={{ marginBottom: 10, fontSize: 13, fontWeight: 800 }}>目前分組概覽 Current Grouping</div>
      {groups.length === 0 ? (
        <div style={{
          padding: 32, textAlign: "center", color: ERP.colors.textMuted, fontSize: 13,
          background: ERP.colors.surface, border: `1px solid ${ERP.colors.border}`, borderRadius: ERP.radius.lg,
        }}>
          尚未建立組別。請在上方新增第一個組別。
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
          {groups.map(g => (
            <div key={g.id} style={{
              background: ERP.colors.surface, border: `1px solid ${ERP.colors.border}`,
              borderRadius: ERP.radius.lg, overflow: "hidden", boxShadow: ERP.shadow.xs,
            }}>
              <div style={{
                padding: "12px 14px", borderBottom: `1px solid ${ERP.colors.border}`,
                background: ERP.colors.pageBg, display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <span style={{ fontSize: 14, fontWeight: 800 }}>{g.group_name}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: ERP.colors.accent }}>{g.students.length} 人</span>
              </div>
              <div style={{ padding: "8px 10px", maxHeight: 260, overflowY: "auto" }}>
                {g.students.length === 0 && (
                  <div style={{ padding: "16px 8px", textAlign: "center", fontSize: 12, color: ERP.colors.textMuted }}>尚無成員</div>
                )}
                {g.students.map(s => (
                  <div key={s.id} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
                    padding: "8px 6px", borderBottom: `1px solid ${ERP.colors.divider}`,
                  }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{s.name_zh_hk || s.name_en || s.student_id}</div>
                      <div style={{ fontSize: 10, color: ERP.colors.textMuted, fontFamily: ERP.font.mono }}>
                        {s.student_id}{s.class_name ? ` · ${s.class_name}` : ""}
                      </div>
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
                        <Trash2 size={11} /> 移除
                      </button>
                    </form>
                  </div>
                ))}
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
