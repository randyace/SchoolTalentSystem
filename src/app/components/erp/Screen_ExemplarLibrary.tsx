import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search, Upload, Sparkles, Download, Archive, Share2, Eye,
  X, Zap, CheckCircle2, Clock, ChevronDown, RefreshCw,
} from "lucide-react";
import { ERP } from "./erpTokens";

type RoleStatus = "confirmed" | "pending" | "rejected";

export interface ExemplarEvent {
  id: number;
  student_id: number;
  student_name_zh: string;
  student_name_en: string;
  student_code: string;
  class_name: string;
  form_level: string;
  source_type: string;
  source_id: number;
  subject_or_category: string;
  group_or_level_tag: string;
  event_title: string;
  event_narrative: string;
  raw_score: number | null;
  acorn_delta: number;
  dimension_deltas: Record<string, number>;
  tags: string[];
  role_badge_text: string;
  role_status: RoleStatus;
  event_date: string;
  is_shared_cloud: boolean;
  source_url?: string;
}

interface ExemplarPayload {
  events?: ExemplarEvent[];
  pagination?: { page: number; per_page: number; total: number };
  kpis?: {
    total_events: number;
    avg_quality_score: number;
    shared_to_cloud: number;
    pending_review_count: number;
  };
  filters?: { subjects?: string[]; forms?: string[] };
}

const SUBJECT_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  ICT: { bg: "#EFF6FF", color: "#1D4ED8", border: "#BFDBFE" },
  Chemistry: { bg: "#FEF3C7", color: "#B45309", border: "#FDE68A" },
  History: { bg: "#F5F3FF", color: "#6D28D9", border: "#C4B5FD" },
  Mathematics: { bg: "#ECFEFF", color: "#0E7490", border: "#A5F3FC" },
  Chinese: { bg: "#FFF1F2", color: "#BE123C", border: "#FECDD3" },
  English: { bg: "#ECFDF5", color: "#047857", border: "#A7F3D0" },
  Award: { bg: "#FFFBEB", color: "#D97706", border: "#FCD34D" },
  "PBL 專題": { bg: "#EEF2FF", color: "#4338CA", border: "#C7D2FE" },
  "STEM 競賽": { bg: "#FFF7ED", color: "#C2410C", border: "#FED7AA" },
};

const DIM_ICON: Record<string, string> = {
  德育: "🧭", 智育: "🧠", 體育: "💪", 群育: "🤝", 美育: "🎨", 靈育: "✨",
};

function subjectStyle(s: string) {
  return SUBJECT_STYLE[s] || { bg: "#F1F5F9", color: "#475569", border: "#CBD5E1" };
}

function formatDate(d: string) {
  if (!d) return "—";
  const dt = new Date(d + (d.length <= 10 ? "T00:00:00" : ""));
  if (Number.isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

function csrfHeaders(csrfName?: string, csrfHash?: string): HeadersInit {
  const h: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
  };
  if (csrfName && csrfHash) h[csrfName] = csrfHash;
  return h;
}

export const Screen_ExemplarLibrary: React.FC<{
  initialPayload?: ExemplarPayload | null;
  listUrl?: string;
  createUrl?: string;
  bulkUrl?: string;
  syncUrl?: string;
  csrfName?: string;
  csrfHash?: string;
}> = ({
  initialPayload = null,
  listUrl = "/api/exemplar-library/list",
  createUrl = "/api/exemplar-library/create",
  bulkUrl = "/api/exemplar-library/bulk-action",
  syncUrl = "/api/exemplar-library/sync",
  csrfName,
  csrfHash,
}) => {
  const [payload, setPayload] = useState<ExemplarPayload>(initialPayload || {});
  const [loading, setLoading] = useState(!initialPayload);
  const [q, setQ] = useState("");
  const [sourceType, setSourceType] = useState("all");
  const [subject, setSubject] = useState("all");
  const [formLevel, setFormLevel] = useState("all");
  const [sort, setSort] = useState("latest_date");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [drawer, setDrawer] = useState<ExemplarEvent | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const events = payload.events || [];
  const kpis = payload.kpis || {
    total_events: 0, avg_quality_score: 0, shared_to_cloud: 0, pending_review_count: 0,
  };

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q, source_type: sourceType, subject, form_level: formLevel, sort, per_page: "50",
      });
      const res = await fetch(`${listUrl}?${params}`, { credentials: "same-origin" });
      const json = await res.json();
      if (json?.ok && json.data) setPayload(json.data);
    } catch {
      setToast("載入失敗");
    } finally {
      setLoading(false);
    }
  }, [listUrl, q, sourceType, subject, formLevel, sort]);

  useEffect(() => {
    if (!initialPayload) void reload();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const t = window.setTimeout(() => { void reload(); }, 280);
    return () => window.clearTimeout(t);
  }, [q, sourceType, subject, formLevel, sort]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(t);
  }, [toast]);

  const runBulk = async (action: "archive" | "share" | "export_csv") => {
    if (selected.size === 0) return;
    setBusy(true);
    try {
      const res = await fetch(bulkUrl, {
        method: "POST",
        credentials: "same-origin",
        headers: csrfHeaders(csrfName, csrfHash),
        body: JSON.stringify({ action, ids: Array.from(selected) }),
      });
      if (action === "export_csv") {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "exemplar-library.csv";
        a.click();
        URL.revokeObjectURL(url);
        setToast("已匯出 CSV");
      } else {
        const json = await res.json();
        if (!json?.ok) throw new Error(json?.message || "操作失敗");
        setToast(json.message);
        setSelected(new Set());
        await reload();
      }
    } catch (e) {
      setToast(e instanceof Error ? e.message : "操作失敗");
    } finally {
      setBusy(false);
    }
  };

  const runSync = async () => {
    setBusy(true);
    try {
      const res = await fetch(syncUrl, {
        method: "POST",
        credentials: "same-origin",
        headers: csrfHeaders(csrfName, csrfHash),
        body: "{}",
      });
      const json = await res.json();
      if (!json?.ok) throw new Error(json?.message || "同步失敗");
      setToast(json.message);
      await reload();
    } catch (e) {
      setToast(e instanceof Error ? e.message : "同步失敗");
    } finally {
      setBusy(false);
    }
  };

  const selectStyle: React.CSSProperties = {
    appearance: "none",
    padding: "8px 28px 8px 12px",
    border: `1px solid ${ERP.colors.borderStrong}`,
    borderRadius: ERP.radius.md,
    fontSize: 12,
    fontWeight: 600,
    background: ERP.colors.surface,
    color: ERP.colors.textPrimary,
    fontFamily: ERP.font.family,
    cursor: "pointer",
  };

  const toggleAll = () => {
    if (selected.size === events.length) setSelected(new Set());
    else setSelected(new Set(events.map((e) => e.id)));
  };

  return (
    <div style={{ padding: "20px 24px 90px", fontFamily: ERP.font.family, color: ERP.colors.textPrimary, background: ERP.colors.pageBg, minHeight: "100%" }}>
      {toast && (
        <div style={{
          position: "fixed", top: 16, right: 16, zIndex: 200,
          padding: "10px 14px", borderRadius: ERP.radius.md, fontSize: 13, fontWeight: 700,
          background: ERP.colors.successLight, color: ERP.colors.success, border: "1px solid #A7F3D0",
          boxShadow: ERP.shadow.md,
        }}>{toast}</div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 18 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{
              fontSize: 10, fontWeight: 800, padding: "2px 7px", borderRadius: 4,
              background: ERP.colors.accentPale, color: ERP.colors.accent,
            }}>1.D.7</span>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Exemplar & Portfolio Library</h1>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: ERP.colors.textSecondary, maxWidth: 780 }}>
            模組六：優秀成果課件與 ACORN 成長事件庫 · 追蹤每位學生的關鍵表現與 ACORN 指數變動紀錄（點擊任一列檢視算式與詳情）
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          <button type="button" disabled={busy} onClick={() => void runSync()} style={hdrBtn}>
            <RefreshCw size={14} /> Sync ACORN Events
          </button>
          <button type="button" style={hdrBtn} onClick={() => setToast("eClass 匯入即將開放")}>
            <Upload size={14} /> Import from eClass
          </button>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            style={{ ...hdrBtn, background: ERP.colors.accent, color: "#fff", borderColor: ERP.colors.accent }}
          >
            <Sparkles size={14} /> Generate New Portfolio
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 12, marginBottom: 16 }}>
        {[
          { label: "Total ACORN Events / Portfolios", value: kpis.total_events, color: ERP.colors.accent, bg: ERP.colors.accentPale },
          { label: "Avg Quality Score", value: kpis.avg_quality_score.toFixed(1), color: "#B45309", bg: "#FFFBEB" },
          { label: "Shared to Cloud / Verified", value: kpis.shared_to_cloud, color: ERP.colors.success, bg: ERP.colors.successLight },
          { label: "Pending Review", value: kpis.pending_review_count, color: ERP.colors.error, bg: ERP.colors.errorLight },
        ].map((k) => (
          <div key={k.label} style={{
            background: ERP.colors.surface, border: `1px solid ${ERP.colors.border}`,
            borderRadius: ERP.radius.lg, padding: "14px 16px", boxShadow: ERP.shadow.xs,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: ERP.colors.textMuted, marginBottom: 6 }}>{k.label}</div>
            <div style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              minWidth: 48, padding: "4px 10px", borderRadius: 8, background: k.bg,
              fontSize: 22, fontWeight: 800, color: k.color,
            }}>{loading ? "…" : k.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{
        display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 14,
        padding: "12px 14px", background: ERP.colors.surface, border: `1px solid ${ERP.colors.border}`,
        borderRadius: ERP.radius.lg,
      }}>
        <div style={{ position: "relative", flex: "1 1 260px" }}>
          <Search size={14} color={ERP.colors.textMuted} style={{ position: "absolute", left: 10, top: 10 }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜尋學生姓名、學號、事件名稱或標籤..."
            style={{
              width: "100%", boxSizing: "border-box", padding: "8px 12px 8px 32px",
              border: `1px solid ${ERP.colors.borderStrong}`, borderRadius: ERP.radius.md,
              fontSize: 12, fontFamily: ERP.font.family, outline: "none",
            }}
          />
        </div>
        <FilterSelect value={sourceType} onChange={setSourceType} style={selectStyle} options={[
          { value: "all", label: "All Event Types（所有事件類型）" },
          { value: "certificate", label: "證書獲獎" },
          { value: "pbl_project", label: "PBL 專題" },
          { value: "assessment", label: "學科優異成績" },
          { value: "activity", label: "活動參與" },
        ]} />
        <FilterSelect value={subject} onChange={setSubject} style={selectStyle} options={[
          { value: "all", label: "All Subjects（所有科目/領域）" },
          ...(payload.filters?.subjects || []).map((s) => ({ value: s, label: s })),
        ]} />
        <FilterSelect value={formLevel} onChange={setFormLevel} style={selectStyle} options={[
          { value: "all", label: "All Levels（所有級別）" },
          ...(payload.filters?.forms || []).map((s) => ({ value: s, label: s })),
        ]} />
        <FilterSelect value={sort} onChange={setSort} style={selectStyle} options={[
          { value: "latest_date", label: "Sort: Latest Date" },
          { value: "highest_score", label: "Sort: Highest Score" },
          { value: "highest_acorn_delta", label: "Sort: Highest ACORN Impact" },
        ]} />
      </div>

      {/* Select all */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <input type="checkbox" checked={events.length > 0 && selected.size === events.length} onChange={toggleAll} />
        <span style={{ fontSize: 12, color: ERP.colors.textMuted }}>
          {loading ? "載入中…" : `顯示 ${events.length} / ${payload.pagination?.total ?? events.length} 筆事件`}
        </span>
      </div>

      {/* Event rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {!loading && events.length === 0 && (
          <div style={{
            padding: 36, textAlign: "center", color: ERP.colors.textMuted,
            background: ERP.colors.surface, borderRadius: ERP.radius.lg, border: `1px solid ${ERP.colors.border}`,
          }}>尚無 ACORN 成長事件。請按 Sync 或 Generate New Portfolio。</div>
        )}
        {events.map((ev) => {
          const ss = subjectStyle(ev.subject_or_category);
          const confirmed = ev.role_status === "confirmed";
          return (
            <div
              key={ev.id}
              onClick={() => setDrawer(ev)}
              style={{
                display: "flex", gap: 14, alignItems: "stretch",
                background: ERP.colors.surface, border: `1px solid ${ERP.colors.border}`,
                borderRadius: ERP.radius.lg, padding: "14px 16px", cursor: "pointer",
                boxShadow: ERP.shadow.xs,
              }}
            >
              <div style={{ paddingTop: 6 }} onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={selected.has(ev.id)}
                  onChange={() => setSelected((prev) => {
                    const n = new Set(prev);
                    n.has(ev.id) ? n.delete(ev.id) : n.add(ev.id);
                    return n;
                  })}
                />
              </div>

              <div style={{
                width: 92, flexShrink: 0, borderRadius: ERP.radius.md, background: ss.bg,
                border: `1px solid ${ss.border}`, padding: "10px 8px", textAlign: "center",
              }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: ss.color, marginBottom: 6 }}>{ev.subject_or_category || "Event"}</div>
                {ev.raw_score != null ? (
                  <div style={{ fontSize: 20, fontWeight: 800, color: ss.color, lineHeight: 1 }}>
                    {Math.round(ev.raw_score)}
                    <span style={{ fontSize: 11, fontWeight: 600, color: ERP.colors.textMuted }}> /100</span>
                  </div>
                ) : (
                  <div style={{ fontSize: 12, fontWeight: 700, color: ss.color }}>—</div>
                )}
                <div style={{
                  marginTop: 8, display: "inline-flex", alignItems: "center", gap: 3,
                  fontSize: 10, fontWeight: 800, padding: "2px 6px", borderRadius: 999,
                  background: "#EEF2FF", color: "#4338CA",
                }}>
                  <Zap size={10} /> ACORN +{ev.acorn_delta.toFixed(1)}
                </div>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: ERP.colors.textSecondary, marginBottom: 4 }}>
                  <strong style={{ color: ERP.colors.textPrimary }}>{ev.student_name_zh || "—"}</strong>
                  {ev.student_name_en ? ` ${ev.student_name_en}` : ""}
                  {" · "}Student #{ev.student_code || "—"}
                  {ev.class_name ? ` · ${ev.class_name}` : ""}
                  {ev.group_or_level_tag ? ` · ${ev.group_or_level_tag}` : ""}
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 8 }}>{ev.event_title}</div>
                {ev.event_narrative && (
                  <div style={{
                    fontSize: 12, color: ERP.colors.textSecondary, lineHeight: 1.55,
                    borderLeft: `3px solid ${ss.border}`, paddingLeft: 10, marginBottom: 10,
                  }}>{ev.event_narrative}</div>
                )}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {Object.entries(ev.dimension_deltas || {}).map(([k, v]) => (
                    <span key={k} style={{
                      fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 999,
                      background: "#F8FAFC", border: `1px solid ${ERP.colors.border}`, color: ERP.colors.textSecondary,
                    }}>{DIM_ICON[k] || "•"} {k} +{Number(v).toFixed(1)}</span>
                  ))}
                  {(ev.tags || []).map((t) => (
                    <span key={t} style={{
                      fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 999,
                      background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`,
                    }}>{t}</span>
                  ))}
                </div>
              </div>

              <div style={{ width: 150, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }} onClick={(e) => e.stopPropagation()}>
                <div style={{ fontSize: 12, color: ERP.colors.textMuted, fontFamily: ERP.font.mono }}>{formatDate(ev.event_date)}</div>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  fontSize: 11, fontWeight: 700, padding: "4px 8px", borderRadius: 999,
                  background: confirmed ? "#D1FAE5" : "#FEF3C7",
                  color: confirmed ? "#047857" : "#B45309",
                }}>
                  {confirmed ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                  {ev.role_badge_text || (confirmed ? "Confirmed" : "Pending")}
                </span>
                <div style={{ display: "flex", gap: 6, marginTop: "auto" }}>
                  <button type="button" onClick={() => setDrawer(ev)} style={miniBtn}><Eye size={12} /> View</button>
                  <button type="button" onClick={() => { setSelected(new Set([ev.id])); void runBulk("export_csv"); }} style={miniBtn}>
                    <Download size={12} /> Export
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bulk bar */}
      {selected.size > 0 && (
        <div style={{
          position: "fixed", left: "50%", bottom: 24, transform: "translateX(-50%)", zIndex: 120,
          display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 999,
          background: "#0F172A", color: "#fff", boxShadow: ERP.shadow.lg,
        }}>
          <span style={{ fontSize: 12, fontWeight: 700 }}>{selected.size} items selected</span>
          <button type="button" disabled={busy} onClick={() => void runBulk("export_csv")} style={batchBtn}>
            <Download size={12} /> Batch Export CSV
          </button>
          <button type="button" disabled={busy} onClick={() => void runBulk("archive")} style={batchBtn}>
            <Archive size={12} /> Archive to Library
          </button>
          <button type="button" disabled={busy} onClick={() => void runBulk("share")} style={batchBtn}>
            <Share2 size={12} /> Share Selected
          </button>
          <button type="button" onClick={() => setSelected(new Set())} style={{ ...batchBtn, opacity: 0.7 }}>Clear</button>
        </div>
      )}

      {/* Drawer */}
      {drawer && (
        <>
          <div onClick={() => setDrawer(null)} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", zIndex: 140 }} />
          <aside style={{
            position: "fixed", top: 0, right: 0, bottom: 0, width: 440, maxWidth: "100vw",
            background: ERP.colors.surface, zIndex: 150, boxShadow: ERP.shadow.lg,
            display: "flex", flexDirection: "column",
          }}>
            <div style={{
              padding: "18px 20px", color: "#fff",
              background: "linear-gradient(135deg,#0F172A 0%,#1E3A8A 70%)",
              borderBottom: `1px solid ${ERP.colors.border}`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>ACORN Impact Inspection</div>
                  <div style={{ fontSize: 17, fontWeight: 800 }}>{drawer.event_title}</div>
                  <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
                    {drawer.student_name_zh} {drawer.student_name_en} · #{drawer.student_code} · {drawer.class_name}
                  </div>
                </div>
                <button type="button" onClick={() => setDrawer(null)} style={{
                  background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 6, width: 28, height: 28, color: "#94A3B8", cursor: "pointer",
                }}><X size={14} /></button>
              </div>
            </div>
            <div style={{ padding: 20, overflow: "auto", flex: 1 }}>
              <Section label="事件資訊">
                <Row k="日期" v={formatDate(drawer.event_date)} />
                <Row k="類型" v={drawer.source_type} />
                <Row k="科目／領域" v={drawer.subject_or_category} />
                <Row k="組別／層級" v={drawer.group_or_level_tag || "—"} />
                <Row k="成績" v={drawer.raw_score != null ? `${drawer.raw_score} / 100` : "—"} />
                <Row k="角色狀態" v={drawer.role_badge_text} />
              </Section>

              <Section label="ACORN Impact Formula">
                <div style={{
                  padding: 14, borderRadius: ERP.radius.lg, background: ERP.colors.accentPale,
                  border: `1px solid ${ERP.colors.accentLight}`, marginBottom: 12,
                }}>
                  <div style={{ fontSize: 11, color: ERP.colors.textSecondary, marginBottom: 6 }}>
                    Base × Environment × Role Tier → Total Delta
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: ERP.colors.accent }}>
                    +{drawer.acorn_delta.toFixed(1)}
                    <span style={{ fontSize: 13, marginLeft: 6, fontWeight: 600 }}>pts</span>
                  </div>
                  <div style={{ fontSize: 12, color: ERP.colors.textSecondary, marginTop: 8, lineHeight: 1.5 }}>
                    {drawer.event_narrative || "此事件已寫入學生 ACORN 成長事件總帳本。"}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {Object.entries(drawer.dimension_deltas || {}).map(([k, v]) => {
                    const max = Math.max(...Object.values(drawer.dimension_deltas || { x: 1 }), 1);
                    const pct = Math.round((Number(v) / max) * 100);
                    return (
                      <div key={k}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                          <span>{DIM_ICON[k] || "•"} {k}</span>
                          <strong>+{Number(v).toFixed(1)}</strong>
                        </div>
                        <div style={{ height: 8, background: "#F1F5F9", borderRadius: 999, overflow: "hidden" }}>
                          <div style={{ width: `${pct}%`, height: "100%", background: ERP.colors.accent, borderRadius: 999 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Section>

              {drawer.source_url && (
                <a href={drawer.source_url} style={{
                  display: "inline-flex", alignItems: "center", gap: 6, marginTop: 8,
                  fontSize: 12, fontWeight: 700, color: ERP.colors.accent, textDecoration: "none",
                }}>→ 開啟來源紀錄</a>
              )}
            </div>
          </aside>
        </>
      )}

      {/* Simple create modal */}
      {showCreate && (
        <CreateModal
          createUrl={createUrl}
          csrfName={csrfName}
          csrfHash={csrfHash}
          onClose={() => setShowCreate(false)}
          onCreated={async (msg) => {
            setShowCreate(false);
            setToast(msg);
            await reload();
          }}
        />
      )}
    </div>
  );
};

const FilterSelect: React.FC<{
  value: string; onChange: (v: string) => void; style: React.CSSProperties;
  options: Array<{ value: string; label: string }>;
}> = ({ value, onChange, style, options }) => (
  <div style={{ position: "relative" }}>
    <select value={value} onChange={(e) => onChange(e.target.value)} style={style}>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
    <ChevronDown size={12} color={ERP.colors.textMuted} style={{ position: "absolute", right: 10, top: 11, pointerEvents: "none" }} />
  </div>
);

const Section: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ marginBottom: 22 }}>
    <div style={{
      fontSize: 11, fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase",
      color: ERP.colors.textMuted, marginBottom: 10, paddingBottom: 6,
      borderBottom: `1px solid ${ERP.colors.border}`,
    }}>{label}</div>
    {children}
  </div>
);

const Row: React.FC<{ k: string; v: string }> = ({ k, v }) => (
  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 12, marginBottom: 6 }}>
    <span style={{ color: ERP.colors.textMuted }}>{k}</span>
    <span style={{ fontWeight: 700, textAlign: "right" }}>{v}</span>
  </div>
);

const CreateModal: React.FC<{
  createUrl: string; csrfName?: string; csrfHash?: string;
  onClose: () => void; onCreated: (msg: string) => void | Promise<void>;
}> = ({ createUrl, csrfName, csrfHash, onClose, onCreated }) => {
  const [studentId, setStudentId] = useState("1239");
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("ICT");
  const [score, setScore] = useState("90");
  const [delta, setDelta] = useState("10");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      const res = await fetch(createUrl, {
        method: "POST",
        credentials: "same-origin",
        headers: csrfHeaders(csrfName, csrfHash),
        body: JSON.stringify({
          student_id: Number(studentId),
          event_title: title || "Manual Portfolio Entry",
          subject_or_category: subject,
          raw_score: Number(score),
          acorn_delta: Number(delta),
          event_narrative: `教師手動登錄之成果課件，ACORN 增量 +${delta} pts。`,
          dimension_deltas: { 智育: Number(delta) * 0.7, 群育: Number(delta) * 0.3 },
          tags: [subject, "Manual"],
          role_badge_text: "Manual · Confirmed",
          role_status: "confirmed",
          source_type: "assessment",
        }),
      });
      const json = await res.json();
      if (!json?.ok) throw new Error(json?.message || "建立失敗");
      await onCreated(json.message);
    } catch (e) {
      alert(e instanceof Error ? e.message : "建立失敗");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 160 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 170,
        width: 420, maxWidth: "92vw", background: "#fff", borderRadius: ERP.radius.lg,
        boxShadow: ERP.shadow.lg, padding: 20, fontFamily: ERP.font.family,
      }}>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 14 }}>Generate New Portfolio</div>
        {[
          { label: "Student PK (students.id)", value: studentId, set: setStudentId },
          { label: "Event Title", value: title, set: setTitle },
          { label: "Subject", value: subject, set: setSubject },
          { label: "Score", value: score, set: setScore },
          { label: "ACORN Delta", value: delta, set: setDelta },
        ].map((f) => (
          <label key={f.label} style={{ display: "block", marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 4 }}>{f.label}</div>
            <input value={f.value} onChange={(e) => f.set(e.target.value)} style={{
              width: "100%", boxSizing: "border-box", padding: "8px 10px",
              border: `1px solid ${ERP.colors.borderStrong}`, borderRadius: ERP.radius.md, fontSize: 13,
            }} />
          </label>
        ))}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
          <button type="button" onClick={onClose} style={miniBtn}>取消</button>
          <button type="button" disabled={busy} onClick={() => void submit()} style={{
            ...miniBtn, background: ERP.colors.accent, color: "#fff", borderColor: ERP.colors.accent,
          }}>{busy ? "…" : "建立"}</button>
        </div>
      </div>
    </>
  );
};

const hdrBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6,
  padding: "8px 12px", borderRadius: ERP.radius.md,
  border: `1px solid ${ERP.colors.border}`, background: ERP.colors.surface,
  fontSize: 12, fontWeight: 700, cursor: "pointer", color: ERP.colors.textPrimary,
  fontFamily: ERP.font.family,
};

const miniBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 4,
  padding: "6px 9px", borderRadius: 6, border: `1px solid ${ERP.colors.border}`,
  background: ERP.colors.surface, fontSize: 11, fontWeight: 700, cursor: "pointer",
  color: ERP.colors.textSecondary, fontFamily: ERP.font.family,
};

const batchBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6,
  padding: "7px 12px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.15)",
  background: "rgba(255,255,255,0.08)", color: "#fff", cursor: "pointer",
  fontSize: 12, fontWeight: 700,
};
