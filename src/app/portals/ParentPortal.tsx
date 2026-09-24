// Parent Portal page — shown at /parent
import React from "react";
import { useNavigate } from "react-router";
import { ERP } from "../components/erp/erpTokens";

export const ParentPortal: React.FC = () => {
  const navigate = useNavigate();
  const C = ERP.colors;
  const R = ERP.radius;
  const F = ERP.font.family;

  return (
    <div style={{
      height: "100vh", display: "flex", flexDirection: "column",
      background: C.pageBg, fontFamily: F,
    }}>
      <div style={{
        height: 56, background: C.surface,
        borderBottom: `1px solid ${C.border}`,
        display: "flex", alignItems: "center", padding: "0 24px", gap: 12,
      }}>
        <button
          onClick={() => navigate("/")}
          style={{
            background: "none", border: `1px solid ${C.border}`,
            borderRadius: R.md, padding: "5px 12px",
            color: C.textSecondary, fontSize: 12, cursor: "pointer", fontFamily: F,
          }}
        >
          ← 返回
        </button>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.textPrimary }}>家長專區</div>
        <div style={{
          fontSize: 11, padding: "2px 8px", borderRadius: R.full,
          background: C.purple + "15", border: `1px solid ${C.purple}30`, color: C.purple,
        }}>
          Parent Portal — 即將推出
        </div>
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{
          maxWidth: 440, textAlign: "center", padding: 40,
          background: C.surface, borderRadius: R.xl,
          border: `2px dashed ${C.border}`, boxShadow: ERP.shadow.sm,
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: R.xl,
            background: C.purple + "15", margin: "0 auto 20px",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: 28 }}>👨‍👩‍👧</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.textPrimary, marginBottom: 8 }}>
            家長專區
          </div>
          <div style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.7, marginBottom: 20 }}>
            家長可查閱子女的學習成就、活動參與記錄及學習歷程報告。<br />
            <span style={{ color: C.textMuted, fontSize: 12 }}>
              Parent Portal — view your child's achievements, activities, and portfolio reports.
            </span>
          </div>
          <div style={{
            padding: "10px 16px", borderRadius: R.md,
            background: C.warningLight, border: `1px solid ${C.warning}30`,
            fontSize: 12, color: C.warning, fontWeight: 600,
          }}>
            Phase 2 開發中 · Coming in Phase 2
          </div>
        </div>
      </div>
    </div>
  );
};
