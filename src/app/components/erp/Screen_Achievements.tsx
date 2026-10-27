// ─────────────────────────────────────────────────────────────────────────────
// Achievements batch listing — cloned from Frame03_ActivityTable skeleton.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useMemo, useState } from "react";
import { ScanLine, X } from "lucide-react";
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
  csrfName?: string;
  csrfHash?: string;
  flashSuccess?: string;
  flashError?: string;
}> = ({
  batches = [],
  activities = [],
  createUrl = "/achievements/batch/create",
  reviewUrlBase = "/achievements/review",
  csrfName = "csrf_test_name",
  csrfHash = "",
  flashSuccess,
  flashError,
}) => {
  const F = ERP.font.family;
  const [search, setSearch] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);

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

  return (
    <>
      <ListingPageShell
        title="成就與證書"
        subtitle="Achievements & Certificates · 批次上傳證書掃描，於審核工作站完成資料輸入"
        count={batches.length}
        countUnit="個批次"
        primaryLabel="新增批次上傳"
        onPrimary={() => setShowUpload(true)}
        search={search}
        onSearch={setSearch}
        searchPlaceholder="搜尋批次名稱或關聯活動..."
        resultCount={filtered.length}
        flashSuccess={flashSuccess}
        flashError={flashError}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: F }}>
            <thead>
              <tr>
                <ListingTH width="28%">批次名稱</ListingTH>
                <ListingTH width="22%">關聯活動</ListingTH>
                <ListingTH width="10%" align="center">檔案數量</ListingTH>
                <ListingTH width="14%">審核進度</ListingTH>
                <ListingTH width="12%" align="center">狀態</ListingTH>
                <ListingTH width="14%" align="center">操作</ListingTH>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <EmptyRow colSpan={6} text="尚無批次。按右上角「新增批次上傳」開始處理證書。" />
              ) : filtered.map((row) => {
                const total = row.total_files ?? 0;
                const done = row.reviewed_count ?? 0;
                const status = row.status || "pending";
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
                      <GhostAction href={`${reviewUrlBase.replace(/\/$/, "")}/${row.id}`}>
                        <ScanLine size={11} /> 進入審核
                      </GhostAction>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ListingPageShell>

      {showUpload && (
        <div
          onClick={() => setShowUpload(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 80,
            background: "rgba(15,23,42,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: 560,
              background: ERP.colors.surface,
              border: `1px solid ${ERP.colors.border}`,
              borderRadius: ERP.radius.lg,
              boxShadow: ERP.shadow.lg,
              overflow: "hidden",
              fontFamily: F,
            }}
          >
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "14px 18px", borderBottom: `1px solid ${ERP.colors.border}`,
            }}>
              <div style={{ fontSize: 15, fontWeight: 800 }}>新增批次上傳</div>
              <button type="button" onClick={() => setShowUpload(false)} style={{
                border: "none", background: "none", cursor: "pointer", color: ERP.colors.textMuted, padding: 4,
              }}>
                <X size={16} />
              </button>
            </div>
            <form method="POST" action={createUrl} encType="multipart/form-data" style={{ padding: 18 }}>
              {csrfHash ? <input type="hidden" name={csrfName} value={csrfHash} /> : null}
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: ERP.colors.textSecondary, marginBottom: 6 }}>
                批次名稱 Batch Title
              </label>
              <input
                name="title" required maxLength={150} placeholder="例：2026 校際朗誦節證書"
                style={{
                  width: "100%", boxSizing: "border-box", marginBottom: 14,
                  padding: "9px 12px", borderRadius: ERP.radius.md,
                  border: `1px solid ${ERP.colors.border}`, fontSize: 13, fontFamily: F, outline: "none",
                }}
              />
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: ERP.colors.textSecondary, marginBottom: 6 }}>
                關聯活動 Linked Activity（選填）
              </label>
              <select
                name="activity_id"
                style={{
                  width: "100%", boxSizing: "border-box", marginBottom: 14,
                  padding: "9px 12px", borderRadius: ERP.radius.md,
                  border: `1px solid ${ERP.colors.border}`, fontSize: 13, fontFamily: F, outline: "none",
                  background: ERP.colors.surface,
                }}
              >
                <option value="">— 不連結 —</option>
                {activities.map((a) => (
                  <option key={a.id} value={a.id}>{a.label}</option>
                ))}
              </select>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: ERP.colors.textSecondary, marginBottom: 6 }}>
                證書檔案 Certificate Files
              </label>
              <label
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const input = e.currentTarget.querySelector("input[type=file]") as HTMLInputElement | null;
                  if (input && e.dataTransfer.files.length) {
                    input.files = e.dataTransfer.files;
                    setFileNames(Array.from(e.dataTransfer.files).map((f) => f.name));
                  }
                }}
                style={{
                  display: "block", padding: 20, textAlign: "center", cursor: "pointer",
                  border: `1px dashed ${dragOver ? ERP.colors.accent : ERP.colors.borderStrong}`,
                  borderRadius: ERP.radius.md,
                  background: dragOver ? ERP.colors.accentPale : ERP.colors.pageBg,
                }}
              >
                <div style={{ fontSize: 13, color: ERP.colors.textSecondary, marginBottom: 4 }}>拖放影像或 PDF 到此，或點擊選擇</div>
                <div style={{ fontSize: 11, color: ERP.colors.textMuted }}>JPG / PNG / WEBP / GIF / PDF · 單檔 ≤ 15MB · 可多選</div>
                <input
                  type="file" name="cert_files[]" multiple accept="image/*,.pdf,application/pdf"
                  style={{ display: "none" }}
                  onChange={(e) => setFileNames(Array.from(e.target.files || []).map((f) => f.name))}
                />
              </label>
              {fileNames.length > 0 && (
                <ul style={{ margin: "8px 0 0", paddingLeft: 18, fontSize: 12, color: ERP.colors.textSecondary }}>
                  {fileNames.map((n) => <li key={n}>{n}</li>)}
                </ul>
              )}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
                <button type="button" onClick={() => setShowUpload(false)} style={{
                  padding: "8px 14px", borderRadius: ERP.radius.md,
                  border: `1px solid ${ERP.colors.border}`, background: ERP.colors.surface,
                  color: ERP.colors.textSecondary, fontSize: 13, fontFamily: F, cursor: "pointer",
                }}>
                  取消
                </button>
                <button type="submit" style={{
                  padding: "8px 16px", border: "none", borderRadius: ERP.radius.md,
                  background: ERP.colors.accent, color: "#fff",
                  fontSize: 13, fontWeight: 600, fontFamily: F, cursor: "pointer",
                }}>
                  建立批次並開始審核
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
