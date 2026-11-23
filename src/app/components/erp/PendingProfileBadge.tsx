import React from "react";

/** Subtle amber pill when student names are blank (stub awaiting 後補). */
export function isPendingProfile(nameZh?: string | null, nameEn?: string | null): boolean {
  return !String(nameZh || "").trim() && !String(nameEn || "").trim();
}

export const PendingProfileBadge: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      fontSize: 10,
      fontWeight: 800,
      letterSpacing: "0.02em",
      padding: "2px 7px",
      borderRadius: 999,
      background: "#FEF3C7",
      color: "#92400E",
      border: "1px solid #FDE68A",
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    待補資料
  </span>
);

/** Prefer real name; fall back to student_id when blank. */
export function displayStudentLabel(
  studentId: string,
  nameZh?: string | null,
  nameEn?: string | null,
): { label: string; pending: boolean } {
  const zh = String(nameZh || "").trim();
  const en = String(nameEn || "").trim();
  if (zh || en) return { label: zh || en, pending: false };
  return { label: studentId || "—", pending: true };
}
