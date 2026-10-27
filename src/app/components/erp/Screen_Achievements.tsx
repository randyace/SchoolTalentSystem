// ─────────────────────────────────────────────────────────────────────────────
// Achievements batch listing — draft batch → Review Workstation dropzone.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useMemo, useRef, useState } from "react";
import { ScanLine, Trash2 } from "lucide-react";
import { ERP } from "./erpTokens";
import {
  EmptyRow, GhostAction, ListingPageShell, ListingTH, listingTD, StatusPill,
} from "./ListingPageShell";

export type AchievementBatchRow = {
  id: number;
  title: string;
  activity_label?: string;
  total_files?: number;
  reviewed_count?: number;
  status?: string;
};

export type ActivityOption = { id: number; label: string };

export const Screen_Achievements: React.FC<{
  batches?: AchievementBatchRow[];
  activities?: ActivityOption[];
  createUrl?: string;
  reviewUrlBase?: string;
  deleteUrl?: string;
  csrfName?: string;
  csrfHash?: string;
  flashSuccess?: string;
  flashError?: string;
}> = ({
  batches: batchesProp = [],
  createUrl = "/achievements/batch/draft",
  reviewUrlBase = "/achievements/review",
  deleteUrl = "/achievements/batch/delete",
  csrfName = "csrf_test_name",
  csrfHash = "",
  flashSuccess,
  flashError,
}) => {
  const F = ERP.font.family;
  const [batches, setBatches] = useState(batchesProp);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [msg, setMsg] = useState(flashSuccess || "");
  const [err, setErr] = useState(flashError || "");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const draftFormRef = useRef<HTMLFormElement>(null);

  const filtered = useMemo(() => {
    const n = search.trim().toLowerCase();
    if (!n) return batches;
    return batches.filter((b) =>
      [b.title, b.activity_label, b.status].some((v) => String(v || "").toLowerCase().includes(n)),
    );
  }, [batches, search]);

  const statusTone = (status: string) => {
    if (status === "completed") return "success" as const;
    if (status === "processing") return "warning" as const;
    return "muted" as const;
  };

  const startNewBatch = () => {
    if (creating) return;
    setCreating(true);
    draftFormRef.current?.submit();
  };

  const removeBatch = async (row: AchievementBatchRow, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!deleteUrl) return;
    if (!window.confirm(`確定刪除批次「${row.title}」？\n此操作會一併刪除該批次內的證書記錄與上傳檔案。`)) {
      return;
    }
    setDeletingId(row.id);
    setErr("");
    try {
      const res = await fetch(`${deleteUrl.replace(/\/$/, "")}/${row.id}`, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
          ...(csrfHash ? { "X-CSRF-TOKEN": csrfHash } : {}),
        },
        body: csrfHash && csrfName
          ? new URLSearchParams({ [csrfName]: csrfHash })
          : undefined,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.ok === false) {
        setErr(json?.message || "刪除失敗");
        return;
      }
      setBatches(prev => prev.filter(b => b.id !== row.id));
      setMsg(json?.message || `已刪除批次 #${row.id}`);
    } catch {
      setErr("刪除失敗，請重試。");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      {/* Hidden draft form — creates empty batch then redirects to review */}
      <form ref={draftFormRef} method="POST" action={createUrl} style={{ display: "none" }}>
        {csrfHash ? <input type="hidden" name={csrfName} value={csrfHash} /> : null}
      </form>

      <ListingPageShell
        title="成就與證書"
        subtitle="Achievements & Certificates · 建立批次後直接進入審核工作站，拖放證書即自動上傳與 AI 萃取"
        count={batches.length}
        countUnit="個批次"
        primaryLabel={creating ? "建立中…" : "新增批次上傳"}
        onPrimary={startNewBatch}
        search={search}
        onSearch={setSearch}
        searchPlaceholder="搜尋批次名稱或關聯活動..."
        resultCount={filtered.length}
        flashSuccess={msg || undefined}
        flashError={err || undefined}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: F }}>
            <thead>
              <tr>
                <ListingTH width="26%">批次名稱</ListingTH>
                <ListingTH width="20%">關聯活動</ListingTH>
                <ListingTH width="10%" align="center">檔案數量</ListingTH>
                <ListingTH width="14%">審核進度</ListingTH>
                <ListingTH width="12%" align="center">狀態</ListingTH>
                <ListingTH width="18%" align="center">操作</ListingTH>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <EmptyRow colSpan={6} text="尚無批次。按右上角「新增批次上傳」進入審核工作站開始拖放證書。" />
              ) : filtered.map((row) => {
                const total = row.total_files ?? 0;
                const done = row.reviewed_count ?? 0;
                const status = row.status || "pending";
                const busy = deletingId === row.id;
                return (
                  <tr key={row.id}>
                    <td style={listingTD}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{row.title}</div>
                      <div style={{ fontSize: 11, color: ERP.colors.textMuted }}>#{row.id}</div>
                    </td>
                    <td style={{ ...listingTD, color: ERP.colors.textSecondary }}>{row.activity_label || "—"}</td>
                    <td style={{ ...listingTD, textAlign: "center", fontFamily: ERP.font.mono }}>{total}</td>
                    <td style={listingTD}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: "2px 8px",
                        borderRadius: ERP.radius.full, background: ERP.colors.pageBg,
                        border: `1px solid ${ERP.colors.border}`, color: ERP.colors.textSecondary,
                      }}>
                        {done} / {total}
                      </span>
                      <span style={{ fontSize: 11, color: ERP.colors.textMuted, marginLeft: 6 }}>已審核</span>
                    </td>
                    <td style={{ ...listingTD, textAlign: "center" }}>
                      <StatusPill label={status} tone={statusTone(status)} />
                    </td>
                    <td style={{ ...listingTD, textAlign: "center" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                        <GhostAction href={`${reviewUrlBase.replace(/\/$/, "")}/${row.id}`}>
                          <ScanLine size={11} /> 進入審核
                        </GhostAction>
                        <button
                          type="button"
                          disabled={busy || !deleteUrl}
                          onClick={(e) => removeBatch(row, e)}
                          title="刪除批次"
                          style={{
                            display: "inline-flex", alignItems: "center", gap: 4,
                            padding: "5px 9px",
                            border: `1px solid ${ERP.colors.red}44`,
                            borderRadius: ERP.radius.md,
                            background: ERP.colors.redLight,
                            color: ERP.colors.red,
                            fontSize: 11, fontWeight: 700, fontFamily: F,
                            cursor: busy ? "wait" : "pointer",
                            opacity: busy ? 0.6 : 1,
                          }}
                        >
                          <Trash2 size={11} /> {busy ? "…" : "刪除"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ListingPageShell>
    </>
  );
};
