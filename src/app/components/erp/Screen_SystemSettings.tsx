// ─────────────────────────────────────────────────────────────────────────────
// System Settings (branding) — header cloned from Frame03; cards cloned from
// Screen_Staff form surface (border + radius + padding), not Bootstrap sts-card.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { ERP } from "./erpTokens";

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  padding: "9px 12px", borderRadius: ERP.radius.md,
  border: `1px solid ${ERP.colors.border}`,
  background: ERP.colors.surface, color: ERP.colors.textPrimary,
  fontSize: 13, fontFamily: ERP.font.family, outline: "none",
};

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{
        display: "block", fontSize: 12, fontWeight: 700,
        color: ERP.colors.textSecondary, marginBottom: 6, fontFamily: ERP.font.family,
      }}>
        {label}
        {hint && <span style={{ fontSize: 10, fontWeight: 400, color: ERP.colors.textMuted, marginLeft: 8 }}>{hint}</span>}
      </label>
      {children}
    </div>
  );
}

function FormCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: ERP.colors.surface,
      border: `1px solid ${ERP.colors.border}`,
      borderRadius: ERP.radius.lg,
      padding: "20px 22px",
      boxShadow: ERP.shadow.card,
      flex: 1,
      minWidth: 280,
    }}>
      <h2 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 800, color: ERP.colors.textPrimary }}>{title}</h2>
      <p style={{ margin: "0 0 16px", fontSize: 12, color: ERP.colors.textMuted, lineHeight: 1.5 }}>{subtitle}</p>
      {children}
    </div>
  );
}

export const Screen_SystemSettings: React.FC<{
  schoolName?: string;
  principalName?: string;
  principalTitle?: string;
  logoUrl?: string;
  logoPath?: string;
  updateUrl?: string;
  overviewUrl?: string;
  csrfName?: string;
  csrfHash?: string;
  flashSuccess?: string;
  flashError?: string;
}> = ({
  schoolName = "",
  principalName = "",
  principalTitle = "",
  logoUrl = "",
  logoPath = "",
  updateUrl = "/settings/update",
  overviewUrl = "/admin/settings",
  csrfName = "csrf_test_name",
  csrfHash = "",
  flashSuccess,
  flashError,
}) => {
  const F = ERP.font.family;
  const [preview, setPreview] = useState(logoUrl);

  return (
    <div style={{ position: "relative", fontFamily: F, height: "100%", overflow: "auto" }}>
      <div style={{ padding: ERP.layout.contentPad, minHeight: "100%" }}>
        <div style={{
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          marginBottom: 16, gap: 12, flexWrap: "wrap",
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: ERP.colors.textPrimary, lineHeight: 1 }}>
                系統設定
              </h1>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: ERP.colors.textSecondary, lineHeight: 1.4 }}>
              System Settings · 全域品牌資產與校長資料 — 供證書產生器等模組讀取
            </p>
          </div>
          <a href={overviewUrl} style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "8px 14px",
            border: `1px solid ${ERP.colors.border}`, borderRadius: ERP.radius.md,
            background: ERP.colors.surface, color: ERP.colors.textSecondary,
            fontSize: 13, fontFamily: F, textDecoration: "none",
          }}>
            <ArrowLeft size={14} /> 系統設定總覽
          </a>
        </div>

        {(flashSuccess || flashError) && (
          <div style={{
            marginBottom: 16, padding: "10px 14px", borderRadius: ERP.radius.md,
            fontSize: 13, fontWeight: 600,
            background: flashError ? ERP.colors.redLight : ERP.colors.successLight,
            color: flashError ? ERP.colors.red : ERP.colors.success,
          }}>
            {flashError || flashSuccess}
          </div>
        )}

        <form method="POST" action={updateUrl} encType="multipart/form-data">
          {csrfHash ? <input type="hidden" name={csrfName} value={csrfHash} /> : null}

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
            <FormCard title="學校資產" subtitle="校徽用於證書預覽與批量產出。建議透明 PNG，邊長 ≥ 256px。">
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 16 }}>
                <div style={{
                  width: 88, height: 88, flexShrink: 0,
                  border: `1px solid ${ERP.colors.border}`, borderRadius: ERP.radius.md,
                  background: ERP.colors.pageBg, overflow: "hidden",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {preview ? (
                    <img src={preview} alt="School logo" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                  ) : (
                    <span style={{ fontSize: 11, color: ERP.colors.textMuted }}>尚無校徽</span>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Field label="校徽上載 Upload School Logo" hint="PNG / JPG / WEBP / GIF · 上限 5MB">
                    <input
                      type="file" name="school_logo"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      style={inputStyle}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setPreview(URL.createObjectURL(file));
                      }}
                    />
                  </Field>
                  {logoPath ? (
                    <div style={{ fontSize: 11, color: ERP.colors.textMuted, marginTop: -8, fontFamily: ERP.font.mono }}>
                      {logoPath}
                    </div>
                  ) : null}
                </div>
              </div>
              <Field label="學校名稱 School Name">
                <input name="school_name" defaultValue={schoolName} placeholder="例：香港神託會培敦中學" style={inputStyle} />
              </Field>
            </FormCard>

            <FormCard title="學校高層" subtitle="校長姓名與職銜會顯示於證書簽名區。">
              <Field label="校長姓名 Principal Name">
                <input name="principal_name" defaultValue={principalName} placeholder="例：陳校長 Chan Principal" style={inputStyle} />
              </Field>
              <Field label="校長職銜 Principal Title">
                <input name="principal_title" defaultValue={principalTitle} placeholder="例：校長 Principal" style={inputStyle} />
              </Field>
            </FormCard>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <a href="/dashboard" style={{
              display: "inline-flex", alignItems: "center", padding: "9px 16px",
              border: `1px solid ${ERP.colors.border}`, borderRadius: ERP.radius.md,
              background: ERP.colors.surface, color: ERP.colors.textSecondary,
              fontSize: 13, fontFamily: F, textDecoration: "none",
            }}>
              取消
            </a>
            <button type="submit" style={{
              display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 16px",
              border: "none", borderRadius: ERP.radius.md, background: ERP.colors.accent, color: "#fff",
              fontSize: 13, fontWeight: 700, fontFamily: F, cursor: "pointer",
              boxShadow: `0 2px 8px ${ERP.colors.accent}40`,
            }}>
              <Save size={14} /> 儲存設定
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
