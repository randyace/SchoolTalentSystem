// 404 catch-all route
import React from "react";
import { NavLink, useLocation } from "react-router";
import { MapPin } from "lucide-react";
import { ERP } from "./erpTokens";

const C = ERP.colors;
const R = ERP.radius;
const F = ERP.font.family;

export const NotFoundPage: React.FC = () => {
  const location = useLocation();
  return (
    <div style={{
      height: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: F, background: C.pageBg,
    }}>
      <div style={{
        maxWidth: 440, width: "100%",
        background: C.surface, borderRadius: R.xl,
        border: `2px dashed ${C.border}`,
        padding: "40px 44px", textAlign: "center",
        boxShadow: ERP.shadow.sm,
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: R.xl,
          background: C.amberLight, margin: "0 auto 20px",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <MapPin size={24} color={C.amber} />
        </div>
        <div style={{
          display: "inline-block", padding: "3px 12px", borderRadius: R.full,
          background: C.errorLight, border: `1px solid ${C.error}30`,
          fontSize: 11, fontWeight: 700, color: C.error,
          letterSpacing: "0.06em", marginBottom: 14,
        }}>
          404 · 頁面不存在
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: C.textPrimary, marginBottom: 8 }}>
          找不到頁面
        </div>
        <div style={{ fontSize: 12, color: C.textSecondary, lineHeight: 1.7, marginBottom: 6 }}>
          路由{" "}
          <code style={{
            fontFamily: ERP.font.mono, background: C.pageBg,
            padding: "2px 8px", borderRadius: R.sm, color: C.accent, fontSize: 12,
          }}>
            {location.pathname}
          </code>{" "}
          未在系統中定義。
        </div>
        <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 28 }}>
          Page Not Found — this route is not defined in the router.
        </div>
        <NavLink
          to="/"
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "10px 24px",
            background: `linear-gradient(135deg, ${C.accent}, ${C.accentDark})`,
            borderRadius: R.md, border: "none",
            fontSize: 13, fontWeight: 700, color: "#fff", textDecoration: "none",
            boxShadow: "0 2px 8px rgba(37,99,235,0.3)",
          }}
        >
          ← 返回登入頁
        </NavLink>
      </div>
    </div>
  );
};
