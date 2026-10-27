// ─────────────────────────────────────────────────────────────────────────────
// Activity Walk-ins — students who QR-scanned but are not on the official roster
// ─────────────────────────────────────────────────────────────────────────────
import React, { useMemo, useState } from "react";
import { ArrowLeft, AlertTriangle, Check, Users } from "lucide-react";
import { ERP } from "./erpTokens";

const F = ERP.font.family;

export type WalkInRow = {
  id: number;
  student_id: string;
  name_zh_hk?: string;
  name_en?: string;
  name?: string;
  last_scanned_at?: string;
  scan_count?: number;
};

type Props = {
  activityId?: number | null;
  activityName?: string;
  walkIns?: WalkInRow[];
  enrollUrl?: string;
  rosterUrl?: string;
  editUrl?: string;
  listUrl?: string;
  flashSuccess?: string;
  flashError?: string;
};

function formatScanTime(raw?: string): string {
  if (!raw) return "—";
  const d = new Date(raw.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleString("zh-HK", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const Screen_ActivityWalkIns: React.FC<Props> = ({
  activityName = "",
  walkIns = [],
  enrollUrl = "",
  rosterUrl = "/activities",
  editUrl = "/activities",
  listUrl = "/activities",
  flashSuccess,
  flashError,
}) => {
  const [selected, setSelected] = useState<Set<number>>(() => new Set(walkIns.map(w => w.id)));
  const allIds = useMemo(() => walkIns.map(w => w.id), [walkIns]);
  const allSelected = walkIns.length > 0 && selected.size === walkIns.length;

  const toggle = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(allIds));
  };

  return (
    <div style={{
      fontFamily: F, background: ERP.colors.pageBg, minHeight: "100%",
      padding: "20px 24px 40px",
    }}>
      <div style={{ maxWidth: 920, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
          <div>
            <a href={editUrl} style={{
              display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12,
              color: ERP.colors.textSecondary, textDecoration: "none", marginBottom: 8,
            }}>
              <ArrowLeft size={13} /> 返回活動編輯
            </a>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: ERP.colors.textPrimary }}>
              🚨 未報名學生 Walk-ins
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: ERP.colors.textMuted }}>
              {activityName || "活動"} · 已簽到但尚未正式報名 · {walkIns.length} 人
            </p>
          </div>
          <a href={rosterUrl} style={{
            display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px",
            borderRadius: ERP.radius.md, border: `1px solid ${ERP.colors.border}`,
            background: ERP.colors.surface, color: ERP.colors.textSecondary,
            fontSize: 12, fontWeight: 700, textDecoration: "none", fontFamily: F,
          }}>
            <Users size={13} /> 管理名單
          </a>
        </div>

        {(flashSuccess || flashError) && (
          <div style={{
            padding: "10px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, marginBottom: 14,
            background: flashSuccess ? "#ECFDF5" : "#FEF2F2",
            color: flashSuccess ? "#065F46" : "#991B1B",
            border: `1px solid ${flashSuccess ? "#6EE7B7" : "#FECACA"}`,
          }}>
            {flashSuccess || flashError}
          </div>
        )}

        <div style={{
          padding: "12px 14px", borderRadius: ERP.radius.lg, marginBottom: 16,
          background: "#FFF7ED", border: "1px solid #FED7AA",
          display: "flex", gap: 10, alignItems: "flex-start",
        }}>
          <AlertTriangle size={16} color="#C2410C" style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 12, color: "#9A3412", lineHeight: 1.5 }}>
            這些學生已透過 QR 簽到成功（Walk-in），但尚未列入正式報名名單。
            勾選後按「正式加入名單」即可寫入報名表；加入後此警示會自動消失。
          </div>
        </div>

        {walkIns.length === 0 ? (
          <div style={{
            background: ERP.colors.surface, border: `1px solid ${ERP.colors.border}`,
            borderRadius: ERP.radius.lg, padding: "40px 20px", textAlign: "center",
            color: ERP.colors.textMuted, fontSize: 13,
          }}>
            目前沒有待處理的未報名簽到。
            <div style={{ marginTop: 12 }}>
              <a href={listUrl} style={{ color: ERP.colors.accent, fontWeight: 700, textDecoration: "none" }}>返回活動列表</a>
            </div>
          </div>
        ) : (
          <form method="post" action={enrollUrl}>
            <div style={{
              background: ERP.colors.surface, border: `1px solid ${ERP.colors.border}`,
              borderRadius: ERP.radius.lg, overflow: "hidden", boxShadow: ERP.shadow.xs,
            }}>
              <div style={{
                display: "grid",
                gridTemplateColumns: "40px 1.2fr 110px 140px 72px",
                gap: 8, padding: "10px 16px",
                background: ERP.colors.pageBg, borderBottom: `1px solid ${ERP.colors.border}`,
                fontSize: 11, fontWeight: 700, color: ERP.colors.textMuted, textTransform: "uppercase" as const,
              }}>
                <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} />
                </label>
                <div>姓名 Name</div>
                <div>學號</div>
                <div>最近簽到</div>
                <div>次數</div>
              </div>
              {walkIns.map((w, idx) => {
                const checked = selected.has(w.id);
                return (
                  <label
                    key={w.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "40px 1.2fr 110px 140px 72px",
                      gap: 8, padding: "12px 16px", alignItems: "center",
                      borderBottom: idx < walkIns.length - 1 ? `1px solid ${ERP.colors.border}` : "none",
                      cursor: "pointer", background: checked ? "#FFF7ED" : ERP.colors.surface,
                    }}
                  >
                    <input
                      type="checkbox"
                      name="student_ids[]"
                      value={w.id}
                      checked={checked}
                      onChange={() => toggle(w.id)}
                    />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: ERP.colors.textPrimary }}>
                        {w.name || w.name_zh_hk || w.name_en || "—"}
                      </div>
                      {w.name_en && w.name_zh_hk ? (
                        <div style={{ fontSize: 11, color: ERP.colors.textMuted }}>{w.name_en}</div>
                      ) : null}
                    </div>
                    <div style={{ fontSize: 12, fontFamily: ERP.font.mono, fontWeight: 600 }}>{w.student_id}</div>
                    <div style={{ fontSize: 12, color: ERP.colors.textSecondary }}>{formatScanTime(w.last_scanned_at)}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: ERP.colors.amber }}>{w.scan_count ?? 1}</div>
                  </label>
                );
              })}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
              <a href={editUrl} style={{
                padding: "10px 16px", borderRadius: ERP.radius.md, border: `1px solid ${ERP.colors.border}`,
                background: ERP.colors.surface, color: ERP.colors.textSecondary,
                fontSize: 13, fontWeight: 600, textDecoration: "none", fontFamily: F,
              }}>
                取消
              </a>
              <button
                type="submit"
                disabled={selected.size === 0}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 7,
                  padding: "10px 18px", border: "none", borderRadius: ERP.radius.md,
                  background: selected.size > 0 ? "#DC2626" : ERP.colors.border,
                  color: selected.size > 0 ? "#fff" : ERP.colors.textMuted,
                  fontSize: 13, fontWeight: 700, fontFamily: F,
                  cursor: selected.size > 0 ? "pointer" : "default",
                  boxShadow: selected.size > 0 ? "0 2px 8px rgba(220,38,38,0.35)" : "none",
                }}
              >
                <Check size={14} /> ✅ 正式加入名單 (Enroll Selected) · {selected.size}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
