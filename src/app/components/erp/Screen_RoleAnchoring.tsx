import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Users, Search, Bell, CheckCircle2, Clock, AlertTriangle, X,
  ChevronDown, Edit3, Download, Shield, Zap, Info, Timer,
} from "lucide-react";
import { ERP } from "./erpTokens";

type RoleTier = "T1" | "T2" | "T3";
type ConfirmStatus = "pending" | "confirmed" | "rejected";
type SubmissionStatus = "not_started" | "draft" | "submitted";

export interface RoleAnchoringMember {
  id: string;
  group_id: number;
  student_pk: number;
  student_id: string;
  name_zh_hk: string;
  name_en: string;
  class_name: string;
  group_name: string;
  group_code: string;
  project_id: number;
  project_title: string;
  role_tier: RoleTier;
  role_label: string;
  role_confirm_status: ConfirmStatus;
  submission_status: SubmissionStatus;
  acorn_score_cached: number;
}

interface RoleAnchoringPayload {
  groups?: Array<{
    id: number;
    group_name: string;
    group_code: string;
    project_title: string;
    member_count?: number;
    members?: RoleAnchoringMember[];
  }>;
  students?: RoleAnchoringMember[];
  filters?: {
    classes?: string[];
    groups?: Array<{ id: number; label: string }>;
  };
  pending_or_rejected?: number;
  academic_year?: string;
  role_options?: Array<{ value: string; label: string }>;
}

const ROLE_META: Record<RoleTier, { label: string; color: string; bg: string; mult: string }> = {
  T3: { label: "組長 (T3)", color: "#7C3AED", bg: "#F5F3FF", mult: "×1.50" },
  T2: { label: "支援 (T2)", color: "#2563EB", bg: "#EFF6FF", mult: "×1.25" },
  T1: { label: "成員 (T1)", color: "#B45309", bg: "#FEF3C7", mult: "×1.00" },
};

const CONFIRM_META: Record<ConfirmStatus, { label: string; color: string; bg: string }> = {
  confirmed: { label: "已確認", color: "#1D4ED8", bg: "#DBEAFE" },
  pending:   { label: "待確認", color: "#64748B", bg: "#F1F5F9" },
  rejected:  { label: "已拒絕", color: "#C2410C", bg: "#FFEDD5" },
};

const SUB_META: Record<SubmissionStatus, { label: string; color: string; bg: string }> = {
  submitted:   { label: "已提報", color: "#059669", bg: "#D1FAE5" },
  draft:       { label: "草稿",   color: "#64748B", bg: "#F1F5F9" },
  not_started: { label: "未開始", color: "#C2410C", bg: "#FFEDD5" },
};

function csrfHeaders(csrfName?: string, csrfHash?: string): HeadersInit {
  const h: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
  };
  if (csrfName && csrfHash) h[csrfName] = csrfHash;
  const meta = typeof document !== "undefined"
    ? document.querySelector('meta[name="csrf-token"]')?.getAttribute("content")
    : null;
  if (meta) h["X-CSRF-TOKEN"] = meta;
  return h;
}

export const Screen_RoleAnchoring: React.FC<{
  academicYear?: string;
  initialGroupId?: number | null;
  initialPayload?: RoleAnchoringPayload | null;
  listUrl?: string;
  updateRoleUrl?: string;
  bulkRoleUrl?: string;
  bulkNotifyUrl?: string;
  exportUrl?: string;
  projectsUrl?: string;
  csrfName?: string;
  csrfHash?: string;
  flashSuccess?: string;
  flashError?: string;
}> = ({
  academicYear = "2025/26",
  initialGroupId = null,
  initialPayload = null,
  listUrl = "/api/pbl/role-anchoring",
  updateRoleUrl = "/api/pbl/role-anchoring/update-role",
  bulkRoleUrl = "/api/pbl/role-anchoring/bulk-role",
  bulkNotifyUrl = "/api/pbl/role-anchoring/bulk-notify",
  exportUrl = "/api/pbl/role-anchoring/export",
  projectsUrl = "/projects",
  csrfName,
  csrfHash,
  flashSuccess,
  flashError,
}) => {
  const [payload, setPayload] = useState<RoleAnchoringPayload>(initialPayload || {});
  const [loading, setLoading] = useState(!initialPayload);
  const [toast, setToast] = useState<string | null>(flashSuccess || null);
  const [error, setError] = useState<string | null>(flashError || null);
  const [busy, setBusy] = useState(false);

  const [classFilter, setClassFilter] = useState("all");
  const [groupFilter, setGroupFilter] = useState(initialGroupId ? String(initialGroupId) : "all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [bulkRole, setBulkRole] = useState<RoleTier>("T1");

  const students = payload.students || [];

  const reload = useCallback(async (gid?: string) => {
    setLoading(true);
    try {
      const g = gid ?? groupFilter;
      const q = new URLSearchParams({ academic_year: academicYear });
      if (g && g !== "all") q.set("group_id", g);
      const res = await fetch(`${listUrl}?${q}`, { credentials: "same-origin" });
      const json = await res.json();
      if (json?.ok && json.data) setPayload(json.data);
      else setError(json?.message || "載入失敗");
    } catch (e) {
      setError(e instanceof Error ? e.message : "載入失敗");
    } finally {
      setLoading(false);
    }
  }, [academicYear, groupFilter, listUrl]);

  useEffect(() => {
    if (!initialPayload) void reload();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(t);
  }, [toast]);

  const filtered = useMemo(() => {
    return students.filter((s) => {
      if (classFilter !== "all" && s.class_name !== classFilter) return false;
      if (groupFilter !== "all" && String(s.group_id) !== groupFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const hay = `${s.name_zh_hk} ${s.name_en} ${s.student_id}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [students, classFilter, groupFilter, searchQuery]);

  const grouped = useMemo(() => {
    const map = new Map<number, { code: string; title: string; name: string; members: RoleAnchoringMember[] }>();
    filtered.forEach((s) => {
      if (!map.has(s.group_id)) {
        map.set(s.group_id, {
          code: s.group_code || s.group_name,
          title: s.project_title,
          name: s.group_name,
          members: [],
        });
      }
      map.get(s.group_id)!.members.push(s);
    });
    return Array.from(map.entries());
  }, [filtered]);

  const conflictGroups = useMemo(() => {
    const leaders: Record<number, number> = {};
    students.forEach((s) => {
      if (s.role_tier === "T3") leaders[s.group_id] = (leaders[s.group_id] || 0) + 1;
    });
    return Object.entries(leaders).filter(([, c]) => c > 1).map(([gid]) => Number(gid));
  }, [students]);

  const stats = useMemo(() => {
    const total = students.length;
    const assigned = students.filter((s) => !!s.role_tier).length;
    const complete = students.filter((s) => s.submission_status === "submitted").length;
    return { total, assigned, conflicts: conflictGroups.length, complete };
  }, [students, conflictGroups]);

  const pendingCount = payload.pending_or_rejected ?? students.filter(
    (s) => s.role_confirm_status === "pending" || s.role_confirm_status === "rejected"
  ).length;

  const drawer = drawerId ? students.find((s) => s.id === drawerId) ?? null : null;

  const patchMember = async (member: RoleAnchoringMember, patch: Partial<RoleAnchoringMember>) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(updateRoleUrl, {
        method: "POST",
        credentials: "same-origin",
        headers: csrfHeaders(csrfName, csrfHash),
        body: JSON.stringify({
          group_id: member.group_id,
          student_pk: member.student_pk,
          role_tier: patch.role_tier ?? member.role_tier,
          role_confirm_status: patch.role_confirm_status ?? member.role_confirm_status,
          submission_status: patch.submission_status ?? member.submission_status,
        }),
      });
      const json = await res.json();
      if (!json?.ok) throw new Error(json?.message || "更新失敗");
      setToast(json.message || "已更新");
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "更新失敗");
    } finally {
      setBusy(false);
    }
  };

  const runBulkRole = async () => {
    if (selected.size === 0) return;
    setBusy(true);
    try {
      const members = students
        .filter((s) => selected.has(s.id))
        .map((s) => ({ group_id: s.group_id, student_pk: s.student_pk }));
      const res = await fetch(bulkRoleUrl, {
        method: "POST",
        credentials: "same-origin",
        headers: csrfHeaders(csrfName, csrfHash),
        body: JSON.stringify({ members, role_tier: bulkRole }),
      });
      const json = await res.json();
      if (!json?.ok) throw new Error(json?.message || "批量失敗");
      setToast(json.message);
      setSelected(new Set());
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "批量失敗");
    } finally {
      setBusy(false);
    }
  };

  const runBulkNotify = async () => {
    if (selected.size === 0) return;
    setBusy(true);
    try {
      const members = students
        .filter((s) => selected.has(s.id))
        .map((s) => ({ group_id: s.group_id, student_pk: s.student_pk }));
      const res = await fetch(bulkNotifyUrl, {
        method: "POST",
        credentials: "same-origin",
        headers: csrfHeaders(csrfName, csrfHash),
        body: JSON.stringify({ members }),
      });
      const json = await res.json();
      if (!json?.ok) throw new Error(json?.message || "通知失敗");
      setToast(json.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : "通知失敗");
    } finally {
      setBusy(false);
    }
  };

  const runExport = () => {
    const ids = selected.size > 0 ? Array.from(selected).join(",") : "";
    const q = new URLSearchParams({ academic_year: academicYear });
    if (groupFilter !== "all") q.set("group_id", groupFilter);
    if (ids) q.set("ids", ids);
    window.location.href = `${exportUrl}?${q}`;
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((s) => s.id)));
  };

  const selectStyle: React.CSSProperties = {
    appearance: "none",
    padding: "7px 28px 7px 12px",
    border: `1px solid ${ERP.colors.borderStrong}`,
    borderRadius: ERP.radius.md,
    fontSize: 12,
    fontWeight: 600,
    background: ERP.colors.surface,
    color: ERP.colors.textPrimary,
    fontFamily: ERP.font.family,
    cursor: "pointer",
  };

  return (
    <div style={{ padding: "20px 24px 80px", fontFamily: ERP.font.family, color: ERP.colors.textPrimary, position: "relative" }}>
      {(toast || error) && (
        <div style={{
          position: "fixed", top: 16, right: 16, zIndex: 100,
          padding: "10px 16px", borderRadius: ERP.radius.md, fontSize: 13, fontWeight: 600,
          background: error ? ERP.colors.errorLight : ERP.colors.successLight,
          color: error ? ERP.colors.error : ERP.colors.success,
          border: `1px solid ${error ? "#FECACA" : "#A7F3D0"}`,
          boxShadow: ERP.shadow.md,
        }}>
          {error || toast}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{
                fontSize: 10, fontWeight: 800, padding: "2px 7px", borderRadius: 4,
                background: ERP.colors.accentPale, color: ERP.colors.accent, letterSpacing: "0.04em",
              }}>1.E.3</span>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>PBL 分組協作角色定錨系統</h1>
            </div>
              <p style={{ margin: 0, fontSize: 13, color: ERP.colors.textSecondary, maxWidth: 720 }}>
              增值模組 B: PBL 分組協作角色定錨 · 於跨學科實作 (PBL) 小組內分配協作崗位，避免重複提報
            </p>
          </div>
          <a href={projectsUrl} style={{
            fontSize: 12, fontWeight: 700, color: ERP.colors.accent, textDecoration: "none",
            padding: "8px 12px", borderRadius: ERP.radius.md, border: `1px solid ${ERP.colors.border}`,
            background: ERP.colors.surface,
          }}>← 分組專題</a>
        </div>
      </div>

      {/* Pending banner */}
      {pendingCount > 0 && (
        <div style={{
          display: "flex", alignItems: "center", gap: 12, marginBottom: 14,
          padding: "12px 16px", borderRadius: ERP.radius.lg,
          background: "#FFFBEB", border: "1px solid #FDE68A",
        }}>
          <Bell size={16} color={ERP.colors.amber} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#92400E" }}>
              ⚠️ {pendingCount} 名學生待確認崗位 — 請提醒學生於提報死線前確認其協作崗位。
            </div>
          </div>
        </div>
      )}

      {/* Conflict banner */}
      {conflictGroups.length > 0 && (
        <div style={{
          display: "flex", alignItems: "center", gap: 12, marginBottom: 14,
          padding: "12px 16px", borderRadius: ERP.radius.lg,
          background: ERP.colors.errorLight, border: "1px solid #FECACA",
        }}>
          <AlertTriangle size={16} color={ERP.colors.error} />
          <div style={{ flex: 1, fontSize: 13 }}>
            <strong>崗位重複偵測：</strong>
            {conflictGroups.length} 個組別出現重複的「組長 (T3)」指派，請即時處理。
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12, marginBottom: 16 }}>
        {[
          { label: "學生總數", value: stats.total, color: ERP.colors.accent },
          { label: "已指派崗位", value: stats.assigned, color: ERP.colors.teal },
          { label: "偵測到衝突", value: stats.conflicts, color: ERP.colors.error },
          { label: "已完成提報", value: stats.complete, color: ERP.colors.success },
        ].map((s) => (
          <div key={s.label} style={{
            background: ERP.colors.surface, border: `1px solid ${ERP.colors.border}`,
            borderRadius: ERP.radius.lg, padding: "14px 16px", boxShadow: ERP.shadow.xs,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: ERP.colors.textMuted, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{loading ? "…" : s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{
        display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center",
        marginBottom: 14, padding: "12px 14px",
        background: ERP.colors.surface, border: `1px solid ${ERP.colors.border}`,
        borderRadius: ERP.radius.lg,
      }}>
        <div style={{ position: "relative", flex: "1 1 200px" }}>
          <Search size={14} color={ERP.colors.textMuted} style={{ position: "absolute", left: 10, top: 9 }} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜尋學生姓名…"
            style={{
              width: "100%", boxSizing: "border-box", padding: "7px 12px 7px 32px",
              border: `1px solid ${ERP.colors.borderStrong}`, borderRadius: ERP.radius.md,
              fontSize: 12, fontFamily: ERP.font.family, outline: "none",
            }}
          />
        </div>
        <div style={{ position: "relative" }}>
          <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} style={selectStyle}>
            <option value="all">所有班別</option>
            {(payload.filters?.classes || []).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <ChevronDown size={12} color={ERP.colors.textMuted} style={{ position: "absolute", right: 10, top: 10, pointerEvents: "none" }} />
        </div>
        <div style={{ position: "relative" }}>
          <select
            value={groupFilter}
            onChange={(e) => {
              setGroupFilter(e.target.value);
              void reload(e.target.value);
            }}
            style={selectStyle}
          >
            <option value="all">所有組別</option>
            {(payload.filters?.groups || []).map((g) => (
              <option key={g.id} value={String(g.id)}>{g.label}</option>
            ))}
          </select>
          <ChevronDown size={12} color={ERP.colors.textMuted} style={{ position: "absolute", right: 10, top: 10, pointerEvents: "none" }} />
        </div>
        <span style={{ fontSize: 11, color: ERP.colors.textMuted, marginLeft: "auto" }}>
          顯示 {filtered.length} 名學生 · {academicYear}
        </span>
      </div>

      {/* Table */}
      <div style={{
        background: ERP.colors.surface, border: `1px solid ${ERP.colors.border}`,
        borderRadius: ERP.radius.lg, overflow: "hidden", boxShadow: ERP.shadow.xs,
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#F8FAFC", borderBottom: `1px solid ${ERP.colors.border}` }}>
              <th style={{ width: 36, padding: "10px 12px" }}>
                <input type="checkbox" checked={filtered.length > 0 && selected.size === filtered.length} onChange={toggleAll} />
              </th>
              {["學生姓名", "班別", "組別", "指派崗位", "崗位確認狀態", "成果提報狀態", "ACORN", "操作"].map((h) => (
                <th key={h} style={{
                  textAlign: "left", padding: "10px 12px", fontSize: 11, fontWeight: 800,
                  color: ERP.colors.textMuted, letterSpacing: "0.04em", whiteSpace: "nowrap",
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={9} style={{ padding: 28, textAlign: "center", color: ERP.colors.textMuted }}>載入中…</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={9} style={{ padding: 28, textAlign: "center", color: ERP.colors.textMuted }}>尚無分組成員。請先於分組專題建立小組。</td></tr>
            )}
            {grouped.map(([gid, g]) => (
              <React.Fragment key={gid}>
                <tr>
                  <td colSpan={9} style={{ padding: "8px 16px", background: "#F3F4F6" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Users size={14} color={ERP.colors.textSecondary} />
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{g.code}</span>
                      <span style={{ fontSize: 12, color: ERP.colors.textSecondary }}>{g.title || g.name}</span>
                      <span style={{
                        marginLeft: "auto", fontSize: 11, color: ERP.colors.textMuted,
                        background: ERP.colors.surface, padding: "2px 8px", borderRadius: 999,
                        border: `1px solid ${ERP.colors.border}`,
                      }}>{g.members.length} 名成員</span>
                    </div>
                  </td>
                </tr>
                {g.members.map((s) => {
                  const rm = ROLE_META[s.role_tier] || ROLE_META.T1;
                  const cm = CONFIRM_META[s.role_confirm_status] || CONFIRM_META.pending;
                  const sm = SUB_META[s.submission_status] || SUB_META.not_started;
                  const isConflict = s.role_tier === "T3" && conflictGroups.includes(s.group_id);
                  return (
                    <tr key={s.id} style={{ borderBottom: `1px solid ${ERP.colors.divider}` }}>
                      <td style={{ padding: "10px 12px" }}>
                        <input
                          type="checkbox"
                          checked={selected.has(s.id)}
                          onChange={() => setSelected((prev) => {
                            const n = new Set(prev);
                            n.has(s.id) ? n.delete(s.id) : n.add(s.id);
                            return n;
                          })}
                        />
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ fontWeight: 700 }}>{s.name_zh_hk || s.name_en || "—"}</div>
                        <div style={{ fontSize: 11, color: ERP.colors.textMuted, fontFamily: ERP.font.mono }}>{s.student_id}</div>
                      </td>
                      <td style={{ padding: "10px 12px" }}>{s.class_name || "—"}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ fontWeight: 600 }}>{g.code}</div>
                        <div style={{ fontSize: 11, color: ERP.colors.textMuted }}>{s.project_title}</div>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <select
                          value={s.role_tier}
                          disabled={busy}
                          onChange={(e) => void patchMember(s, { role_tier: e.target.value as RoleTier, role_confirm_status: "pending" })}
                          style={{
                            ...selectStyle,
                            color: rm.color,
                            background: rm.bg,
                            borderColor: isConflict ? "#FCA5A5" : ERP.colors.borderStrong,
                            fontWeight: 800,
                            minWidth: 120,
                          }}
                        >
                          {(["T3", "T2", "T1"] as RoleTier[]).map((t) => (
                            <option key={t} value={t}>{ROLE_META[t].label}</option>
                          ))}
                        </select>
                        {isConflict && (
                          <div style={{ fontSize: 10, color: ERP.colors.error, marginTop: 4, fontWeight: 700 }}>⚠ 重複組長</div>
                        )}
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 4,
                          fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 999,
                          background: cm.bg, color: cm.color,
                        }}>
                          {s.role_confirm_status === "confirmed" ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                          {cm.label}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 999,
                          background: sm.bg, color: sm.color,
                        }}>{sm.label}</span>
                      </td>
                      <td style={{ padding: "10px 12px", fontFamily: ERP.font.mono, fontWeight: 700 }}>
                        {Number(s.acorn_score_cached ?? 0).toFixed(1)}
                        <span style={{ fontSize: 10, color: ERP.colors.textMuted, marginLeft: 4 }}>{rm.mult}</span>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ display: "inline-flex", gap: 6 }}>
                          <button
                            type="button"
                            title="編輯崗位／狀態"
                            onClick={() => setDrawerId(s.id)}
                            style={iconBtn}
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            type="button"
                            title="發送確認通知"
                            disabled={busy}
                            onClick={() => {
                              setSelected(new Set([s.id]));
                              void (async () => {
                                setBusy(true);
                                try {
                                  const res = await fetch(bulkNotifyUrl, {
                                    method: "POST",
                                    credentials: "same-origin",
                                    headers: csrfHeaders(csrfName, csrfHash),
                                    body: JSON.stringify({
                                      members: [{ group_id: s.group_id, student_pk: s.student_pk }],
                                    }),
                                  });
                                  const json = await res.json();
                                  if (!json?.ok) throw new Error(json?.message || "通知失敗");
                                  setToast(json.message);
                                } catch (e) {
                                  setError(e instanceof Error ? e.message : "通知失敗");
                                } finally {
                                  setBusy(false);
                                }
                              })();
                            }}
                            style={iconBtn}
                          >
                            <Bell size={13} />
                          </button>
                          <a
                            href={`/students/details/${encodeURIComponent(s.student_id)}`}
                            title="預覽學生檔案"
                            style={{ ...iconBtn, textDecoration: "none", color: ERP.colors.accent }}
                          >
                            <Shield size={13} />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Batch bar */}
      {selected.size > 0 && (
        <div style={{
          position: "fixed", left: "50%", bottom: 24, transform: "translateX(-50%)",
          zIndex: 90, display: "flex", alignItems: "center", gap: 10,
          padding: "10px 14px", borderRadius: 999,
          background: "#0F172A", color: "#fff", boxShadow: ERP.shadow.lg,
        }}>
          <span style={{ fontSize: 12, fontWeight: 700, padding: "0 6px" }}>已選取 {selected.size} 項</span>
          <select
            value={bulkRole}
            onChange={(e) => setBulkRole(e.target.value as RoleTier)}
            style={{ ...selectStyle, background: "#1E293B", color: "#fff", borderColor: "#334155" }}
          >
            {(["T3", "T2", "T1"] as RoleTier[]).map((t) => (
              <option key={t} value={t}>{ROLE_META[t].label}</option>
            ))}
          </select>
          <button type="button" disabled={busy} onClick={() => void runBulkRole()} style={batchBtn}>
            <Zap size={12} /> 批量指派崗位
          </button>
          <button type="button" disabled={busy} onClick={() => void runBulkNotify()} style={batchBtn}>
            <Bell size={12} /> 發送確認通知
          </button>
          <button type="button" onClick={runExport} style={batchBtn}>
            <Download size={12} /> 匯出名單
          </button>
          <button type="button" onClick={() => setSelected(new Set())} style={{ ...batchBtn, opacity: 0.7 }}>清除</button>
        </div>
      )}

      {/* Drawer */}
      {drawer && (
        <>
          <div onClick={() => setDrawerId(null)} style={{
            position: "fixed", inset: 0, background: "rgba(15,23,42,0.35)", zIndex: 110,
          }} />
          <aside style={{
            position: "fixed", top: 0, right: 0, bottom: 0, width: 400, maxWidth: "100vw",
            background: ERP.colors.surface, zIndex: 120, boxShadow: ERP.shadow.lg,
            display: "flex", flexDirection: "column",
          }}>
            <div style={{
              padding: "18px 20px", borderBottom: `1px solid ${ERP.colors.border}`,
              background: "linear-gradient(135deg,#0F172A 0%,#1E1B4B 60%,#1A3A6B 100%)", color: "#fff",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>角色定錨詳情</div>
                  <div style={{ fontSize: 18, fontWeight: 800 }}>{drawer.name_zh_hk || drawer.name_en}</div>
                  <div style={{ fontSize: 12, opacity: 0.75, fontFamily: ERP.font.mono }}>{drawer.student_id} · {drawer.class_name}</div>
                </div>
                <button type="button" onClick={() => setDrawerId(null)} style={{
                  background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 6, width: 28, height: 28, color: "#94A3B8", cursor: "pointer",
                }}><X size={14} /></button>
              </div>
            </div>
            <div style={{ padding: 20, overflow: "auto", flex: 1 }}>
              <DrawerSection icon={<Shield size={12} color={ERP.colors.accent} />} label="崗位與閘門">
                <label style={labelStyle}>指派崗位</label>
                <select
                  value={drawer.role_tier}
                  disabled={busy}
                  onChange={(e) => void patchMember(drawer, { role_tier: e.target.value as RoleTier, role_confirm_status: "pending" })}
                  style={{ ...selectStyle, width: "100%", marginBottom: 12 }}
                >
                  {(["T3", "T2", "T1"] as RoleTier[]).map((t) => (
                    <option key={t} value={t}>{ROLE_META[t].label} · {ROLE_META[t].mult}</option>
                  ))}
                </select>
                <label style={labelStyle}>確認狀態</label>
                <select
                  value={drawer.role_confirm_status}
                  disabled={busy}
                  onChange={(e) => void patchMember(drawer, { role_confirm_status: e.target.value as ConfirmStatus })}
                  style={{ ...selectStyle, width: "100%", marginBottom: 12 }}
                >
                  <option value="pending">待確認</option>
                  <option value="confirmed">已確認</option>
                  <option value="rejected">已拒絕</option>
                </select>
                <label style={labelStyle}>提報狀態</label>
                <select
                  value={drawer.submission_status}
                  disabled={busy}
                  onChange={(e) => void patchMember(drawer, { submission_status: e.target.value as SubmissionStatus })}
                  style={{ ...selectStyle, width: "100%", marginBottom: 12 }}
                >
                  <option value="not_started">未開始</option>
                  <option value="draft">草稿</option>
                  <option value="submitted">已提報</option>
                </select>
              </DrawerSection>

              <DrawerSection icon={<Zap size={12} color={ERP.colors.accent} />} label="ACORN 計分預覽">
                <div style={{
                  padding: 14, borderRadius: ERP.radius.lg, background: ERP.colors.accentPale,
                  border: `1px solid ${ERP.colors.accentLight}`,
                }}>
                  <div style={{ fontSize: 11, color: ERP.colors.textSecondary, marginBottom: 6 }}>
                    30 × {ROLE_META[drawer.role_tier].mult} × 閘門
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: ERP.colors.accent }}>
                    {Number(drawer.acorn_score_cached ?? 0).toFixed(1)}
                    <span style={{ fontSize: 13, fontWeight: 600, marginLeft: 6 }}>pts</span>
                  </div>
                  <div style={{ fontSize: 11, color: ERP.colors.textMuted, marginTop: 8, display: "flex", gap: 6, alignItems: "flex-start" }}>
                    <Info size={12} style={{ marginTop: 1, flexShrink: 0 }} />
                    確認且已提報 = 全額；草稿／待確認 = 30%；拒絕或未開始 = 0。六育權重隨崗位偏移（組長偏群育、成員偏智育）。
                  </div>
                </div>
              </DrawerSection>

              <DrawerSection icon={<Timer size={12} color={ERP.colors.accent} />} label="小組資訊" sub={drawer.group_code}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{drawer.group_name}</div>
                <div style={{ fontSize: 12, color: ERP.colors.textSecondary, marginTop: 4 }}>{drawer.project_title}</div>
              </DrawerSection>
            </div>
          </aside>
        </>
      )}
    </div>
  );
};

const batchBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6,
  padding: "7px 12px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.15)",
  background: "rgba(255,255,255,0.08)", color: "#fff", cursor: "pointer",
  fontSize: 12, fontWeight: 700,
};

const iconBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  width: 28, height: 28, borderRadius: 6,
  border: `1px solid ${ERP.colors.border}`, background: ERP.colors.surface,
  cursor: "pointer", color: ERP.colors.textSecondary,
};

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 6,
};

const DrawerSection: React.FC<{
  icon: React.ReactNode; label: string; sub?: string; children: React.ReactNode;
}> = ({ icon, label, sub, children }) => (
  <div style={{ marginBottom: 22 }}>
    <div style={{
      display: "flex", alignItems: "center", gap: 8, paddingBottom: 8, marginBottom: 14,
      borderBottom: `1px solid ${ERP.colors.border}`,
    }}>
      <div style={{
        width: 22, height: 22, borderRadius: ERP.radius.sm, background: ERP.colors.accentPale,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>{icon}</div>
      <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase" }}>{label}</span>
      {sub && <span style={{ fontSize: 10, color: ERP.colors.textMuted }}>{sub}</span>}
    </div>
    {children}
  </div>
);
