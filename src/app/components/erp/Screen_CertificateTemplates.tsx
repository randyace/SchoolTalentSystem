// ─────────────────────────────────────────────────────────────────────────────
// Screen 1.D.4B — 證書範本管理 / Certificate Templates
// Skeleton cloned from Frame03_ActivityTable via ListingPageShell.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useMemo, useState } from "react";
import { Copy, Pencil, Trash2 } from "lucide-react";
import { ERP } from "./erpTokens";
import {
  EmptyRow, GhostAction, ListingPageShell, ListingTH, listingTD,
} from "./ListingPageShell";

export interface CertTemplateRow {
  id: number;
  title: string;
  activity_label?: string;
  updated_at?: string;
}

export interface ScreenCertificateTemplatesProps {
  templates?: CertTemplateRow[];
  storeUrl?: string;
  editUrlBase?: string;
  cloneUrlBase?: string;
  deleteUrlBase?: string;
  csrfName?: string;
  csrfHash?: string;
  flashSuccess?: string;
  flashError?: string;
}

export const Screen_CertificateTemplates: React.FC<ScreenCertificateTemplatesProps> = ({
  templates = [],
  storeUrl = "/certificates/store",
  editUrlBase = "/certificates/edit",
  cloneUrlBase = "/certificates/clone",
  deleteUrlBase = "/certificates/delete",
  csrfName = "csrf_test_name",
  csrfHash = "",
  flashSuccess,
  flashError,
}) => {
  const F = ERP.font.family;
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return templates;
    return templates.filter((t) =>
      [t.title, t.activity_label, t.updated_at].some((v) =>
        String(v || "").toLowerCase().includes(needle),
      ),
    );
  }, [templates, q]);

  const appendCsrf = (form: HTMLFormElement) => {
    if (!csrfHash) return;
    const csrfInput = document.createElement("input");
    csrfInput.type = "hidden";
    csrfInput.name = csrfName;
    csrfInput.value = csrfHash;
    form.appendChild(csrfInput);
  };

  const handleNewTemplate = () => {
    const title = window.prompt("範本名稱 (Template Title)：", "新證書範本");
    if (title === null) return;
    const form = document.createElement("form");
    form.method = "POST";
    form.action = storeUrl;
    const titleInput = document.createElement("input");
    titleInput.type = "hidden";
    titleInput.name = "title";
    titleInput.value = (title || "").trim();
    form.appendChild(titleInput);
    appendCsrf(form);
    document.body.appendChild(form);
    form.submit();
  };

  const submitClone = (id: number) => {
    const form = document.createElement("form");
    form.method = "POST";
    form.action = `${cloneUrlBase.replace(/\/$/, "")}/${id}`;
    appendCsrf(form);
    document.body.appendChild(form);
    form.submit();
  };

  const submitDelete = (id: number) => {
    if (!confirm("確定要刪除此證書範本嗎？此動作無法復原。")) return;
    const form = document.createElement("form");
    form.method = "POST";
    form.action = `${deleteUrlBase.replace(/\/$/, "")}/${id}`;
    appendCsrf(form);
    document.body.appendChild(form);
    form.submit();
  };

  return (
    <ListingPageShell
      title="證書範本管理"
      subtitle="Certificate Templates · 儲存、複製與編輯證書底圖與欄位配置"
      count={templates.length}
      countUnit="個範本"
      primaryLabel="新增範本"
      onPrimary={handleNewTemplate}
      search={q}
      onSearch={setQ}
      searchPlaceholder="搜尋範本名稱或關聯活動..."
      resultCount={filtered.length}
      flashSuccess={flashSuccess}
      flashError={flashError}
    >
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: F }}>
          <thead>
            <tr>
              <ListingTH width="32%">範本名稱</ListingTH>
              <ListingTH width="28%">關聯活動</ListingTH>
              <ListingTH width="20%">最後修改</ListingTH>
              <ListingTH width="20%" align="center">操作</ListingTH>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <EmptyRow colSpan={4} text="尚無範本。按右上角「新增範本」建立第一個證書設計。" />
            ) : filtered.map((row) => (
              <tr key={row.id}>
                <td style={listingTD}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{row.title}</div>
                  <div style={{ fontSize: 11, color: ERP.colors.textMuted }}>#{row.id}</div>
                </td>
                <td style={{ ...listingTD, color: ERP.colors.textSecondary }}>{row.activity_label || "—"}</td>
                <td style={{ ...listingTD, fontFamily: ERP.font.mono, fontSize: 12, color: ERP.colors.textSecondary }}>
                  {row.updated_at || "—"}
                </td>
                <td style={{ ...listingTD, textAlign: "center" }}>
                  <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
                    <GhostAction href={`${editUrlBase.replace(/\/$/, "")}/${row.id}`}>
                      <Pencil size={11} /> 編輯
                    </GhostAction>
                    <GhostAction onClick={() => submitClone(row.id)}>
                      <Copy size={11} /> 複製
                    </GhostAction>
                    <button
                      type="button"
                      className="btn btn-sm btn-link text-danger text-decoration-none btn-delete-template"
                      data-id={row.id}
                      onClick={() => submitDelete(row.id)}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        padding: "4px 9px",
                        border: `1px solid ${ERP.colors.border}`,
                        borderRadius: ERP.radius.sm,
                        background: "transparent",
                        color: ERP.colors.red,
                        cursor: "pointer",
                        fontSize: 11,
                        fontWeight: 600,
                        fontFamily: F,
                        whiteSpace: "nowrap",
                        textDecoration: "none",
                      }}
                    >
                      <Trash2 size={11} /> 刪除
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ListingPageShell>
  );
};
