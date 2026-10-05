// ─────────────────────────────────────────────────────────────────────────────
// Staff / Roles & Positions — staff_accounts CRUD
// ─────────────────────────────────────────────────────────────────────────────
import React, { useMemo, useState } from "react";
import { ERP } from "./erpTokens";
import { Plus, Search, Edit2, Trash2, ArrowLeft, Save } from "lucide-react";

export type StaffRow = {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active?: boolean;
  status?: string;
};

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  padding: "9px 12px", borderRadius: ERP.radius.md,
  border: `1px solid ${ERP.colors.border}`,
  background: ERP.colors.surface, color: ERP.colors.textPrimary,
  fontSize: 13, fontFamily: ERP.font.family, outline: "none",
};

const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  teacher: "Teacher",
  viewer: "Viewer",
};

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: ERP.colors.textSecondary, marginBottom: 6, fontFamily: ERP.font.family }}>
        {label}
        {required && <span style={{ color: ERP.colors.red, marginLeft: 3 }}>*</span>}
        {hint && <span style={{ fontSize: 10, fontWeight: 400, color: ERP.colors.textMuted, marginLeft: 8 }}>{hint}</span>}
      </label>
      {children}
    </div>
  );
}

export const Screen_Staff: React.FC<{
  staff?: StaffRow[];
  openForm?: boolean;
  staffId?: number | null;
  initialStaff?: StaffRow | null;
  storeUrl?: string;
  updateUrl?: string;
  deleteUrl?: string;
  listUrl?: string;
  createUrl?: string;
  editUrlBase?: string;
  flashSuccess?: string;
  flashError?: string;
}> = (props) => {
  const formMode = !!(props.openForm || (props.staffId != null && props.staffId > 0) || props.initialStaff);
  return formMode ? <StaffFormPage {...props} /> : <StaffListPage {...props} />;
};

const StaffListPage: React.FC<{
  staff?: StaffRow[];
  deleteUrl?: string;
  createUrl?: string;
  editUrlBase?: string;
  flashSuccess?: string;
  flashError?: string;
}> = ({
  staff = [],
  deleteUrl = "/staff/delete",
  createUrl = "/staff/create",
  editUrlBase = "/staff/edit",
  flashSuccess,
  flashError,
}) => {
  const F = ERP.font.family;
  const [rows, setRows] = useState(staff);
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState(flashSuccess || "");
  const [err, setErr] = useState(flashError || "");

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return rows;
    return rows.filter(r => [r.name, r.email, r.role].some(v => String(v || "").toLowerCase().includes(n)));
  }, [rows, q]);

  const remove = async (row: StaffRow, e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm(`刪除職員「${row.name}」？`)) return;
    const res = await fetch(`${deleteUrl.replace(/\/$/, "")}/${row.id}`, {
      method: "POST", credentials: "same-origin", headers: { Accept: "application/json" },
    });
    if (res.redirected || res.ok) {
      setRows(prev => prev.filter(r => r.id !== row.id));
      setMsg("已刪除職員帳戶。");
      setErr("");
      if (res.redirected) window.location.href = res.url;
    }
  };

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden", background: ERP.colors.pageBg, fontFamily: F, flexDirection: "column" }}>
      <div style={{ padding: "20px 24px 14px", flexShrink: 0, borderBottom: `1px solid ${ERP.colors.border}`, background: ERP.colors.surface }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>角色與崗位</h1>
            <p style={{ margin: "3px 0 0", fontSize: 12, color: ERP.colors.textMuted }}>Roles & Positions · {filtered.length} 位職員</p>
          </div>
          <a href={createUrl} style={{
            display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px",
            borderRadius: ERP.radius.md, background: ERP.colors.accent, color: "#fff",
            fontSize: 13, fontWeight: 600, fontFamily: F, textDecoration: "none",
          }}>
            <Plus size={14} /> 新增職員
          </a>
        </div>
        <div style={{ position: "relative", maxWidth: 320 }}>
          <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: ERP.colors.textMuted }} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="搜尋姓名、電郵、角色…" style={{ ...inputStyle, paddingLeft: 32, fontSize: 12 }} />
        </div>
        {msg && <p style={{ margin: "10px 0 0", fontSize: 12, color: ERP.colors.success, fontWeight: 600 }}>{msg}</p>}
        {err && <p style={{ margin: "10px 0 0", fontSize: 12, color: ERP.colors.red, fontWeight: 600 }}>{err}</p>}
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: "16px 24px 24px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", background: ERP.colors.surface, borderRadius: ERP.radius.lg, overflow: "hidden", border: `1px solid ${ERP.colors.border}`, fontSize: 13 }}>
          <thead>
            <tr style={{ background: ERP.colors.pageBg, textAlign: "left" }}>
              {["ID", "Name", "Email", "Role", "Status", "Actions"].map(h => (
                <th key={h} style={{ padding: "10px 14px", color: ERP.colors.textSecondary, fontWeight: 700, borderBottom: `1px solid ${ERP.colors.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={6} style={{ padding: 28, textAlign: "center", color: ERP.colors.textMuted }}>尚無職員帳戶。</td></tr>
            )}
            {filtered.map(r => {
              const on = r.is_active !== false && r.status !== "inactive";
              return (
                <tr key={r.id}>
                  <td style={{ padding: "10px 14px", borderBottom: `1px solid ${ERP.colors.border}`, fontFamily: ERP.font.mono }}>{r.id}</td>
                  <td style={{ padding: "10px 14px", borderBottom: `1px solid ${ERP.colors.border}`, fontWeight: 700 }}>{r.name}</td>
                  <td style={{ padding: "10px 14px", borderBottom: `1px solid ${ERP.colors.border}` }}>{r.email}</td>
                  <td style={{ padding: "10px 14px", borderBottom: `1px solid ${ERP.colors.border}` }}>{ROLE_LABEL[r.role] || r.role}</td>
                  <td style={{ padding: "10px 14px", borderBottom: `1px solid ${ERP.colors.border}` }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
                      background: on ? ERP.colors.successLight : ERP.colors.pageBg,
                      color: on ? ERP.colors.success : ERP.colors.textMuted,
                    }}>{on ? "Active" : "Inactive"}</span>
                  </td>
                  <td style={{ padding: "10px 14px", borderBottom: `1px solid ${ERP.colors.border}` }}>
                    <a href={`${editUrlBase.replace(/\/$/, "")}/${r.id}`} style={{ color: ERP.colors.accent, marginRight: 8 }}><Edit2 size={14} /></a>
                    <button type="button" onClick={e => remove(r, e)} style={{ background: "none", border: "none", cursor: "pointer", color: ERP.colors.red, padding: 0 }}><Trash2 size={14} /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const StaffFormPage: React.FC<{
  staffId?: number | null;
  initialStaff?: StaffRow | null;
  storeUrl?: string;
  updateUrl?: string;
  listUrl?: string;
  flashSuccess?: string;
  flashError?: string;
}> = ({
  staffId = null,
  initialStaff = null,
  storeUrl = "/staff/store",
  updateUrl = "/staff/update",
  listUrl = "/staff",
  flashSuccess,
  flashError,
}) => {
  const isEdit = !!(staffId && staffId > 0) || !!(initialStaff && initialStaff.id);
  const id = staffId || initialStaff?.id || 0;
  const F = ERP.font.family;
  const action = isEdit ? `${updateUrl.replace(/\/$/, "")}/${id}` : storeUrl;

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 28px 48px", fontFamily: F }}>
      <a href={listUrl} style={{ display: "inline-flex", alignItems: "center", gap: 6, color: ERP.colors.accent, fontSize: 13, fontWeight: 700, textDecoration: "none", marginBottom: 16 }}>
        <ArrowLeft size={14} /> 返回列表
      </a>
      <h1 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 800 }}>{isEdit ? "編輯職員" : "新增職員"}</h1>
      <p style={{ margin: "0 0 18px", fontSize: 12, color: ERP.colors.textMuted }}>{isEdit ? "Update staff account" : "Create staff account"}</p>
      {(flashSuccess || flashError) && (
        <div style={{
          marginBottom: 14, padding: "10px 14px", borderRadius: ERP.radius.md, fontSize: 13, fontWeight: 600,
          background: flashError ? ERP.colors.redLight : ERP.colors.successLight,
          color: flashError ? ERP.colors.red : ERP.colors.success,
        }}>{flashError || flashSuccess}</div>
      )}
      <form method="POST" action={action} style={{
        background: ERP.colors.surface, border: `1px solid ${ERP.colors.border}`,
        borderRadius: ERP.radius.lg, padding: "20px 22px", boxShadow: ERP.shadow.xs,
      }}>
        <Field label="姓名 Name" required>
          <input name="name" required defaultValue={initialStaff?.name || ""} style={inputStyle} />
        </Field>
        <Field label="電郵 Email" required>
          <input name="email" type="email" required defaultValue={initialStaff?.email || ""} style={inputStyle} />
        </Field>
        <Field label="密碼 Password" required={!isEdit} hint={isEdit ? "留空則不更改" : "至少 8 位"}>
          <input name="password" type="password" required={!isEdit} minLength={isEdit ? undefined : 8} autoComplete="new-password" style={inputStyle} />
        </Field>
        <Field label="角色 Role">
          <select name="role" defaultValue={initialStaff?.role || "teacher"} style={inputStyle}>
            <option value="admin">Admin</option>
            <option value="teacher">Teacher</option>
            <option value="viewer">Viewer</option>
          </select>
        </Field>
        <Field label="狀態 Status">
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <input type="hidden" name="is_active" value="0" />
            <input type="checkbox" name="is_active" value="1" defaultChecked={initialStaff ? initialStaff.is_active !== false && initialStaff.status !== "inactive" : true} />
            Active
          </label>
        </Field>
        <button type="submit" style={{
          display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 16px",
          border: "none", borderRadius: ERP.radius.md, background: ERP.colors.accent, color: "#fff",
          fontSize: 13, fontWeight: 700, fontFamily: F, cursor: "pointer",
        }}>
          <Save size={14} /> 儲存
        </button>
      </form>
    </div>
  );
};
