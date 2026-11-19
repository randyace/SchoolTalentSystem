/**
 * Shared Mobile RWD primitives for STS ERP screens (inline-style architecture).
 * Desktop (>= breakpoint) layouts must remain unchanged when helpers are used correctly.
 */
import React, { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { ERP } from "./erpTokens";

export const RWD_BREAKPOINT = 768;

/** SSR/hydration-safe mobile detection (false until mounted + measured). */
export function useIsMobile(breakpoint: number = RWD_BREAKPOINT): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const apply = () => setIsMobile(window.innerWidth < breakpoint);
    apply();
    mq.addEventListener("change", apply);
    window.addEventListener("resize", apply);
    return () => {
      mq.removeEventListener("change", apply);
      window.removeEventListener("resize", apply);
    };
  }, [breakpoint]);

  return isMobile;
}

export function rwdGrid(
  isMobile: boolean,
  desktopCols: string,
  mobileCols = "1fr",
  gapDesktop = "16px",
  gapMobile = "10px",
): CSSProperties {
  return {
    display: "grid",
    gridTemplateColumns: isMobile ? mobileCols : desktopCols,
    gap: isMobile ? gapMobile : gapDesktop,
  };
}

/** 4 KPI cards → 2×2 on mobile so columns never squash to ~90px. */
export function rwdKpiGrid4(isMobile: boolean): CSSProperties {
  return rwdGrid(
    isMobile,
    "repeat(4, minmax(0, 1fr))",
    "repeat(2, minmax(0, 1fr))",
    "12px",
    "10px",
  );
}

export const ResponsiveTableWrapper: React.FC<{
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}> = ({ children, style, className }) => (
  <div
    className={className}
    style={{
      width: "100%",
      maxWidth: "100%",
      overflowX: "auto",
      WebkitOverflowScrolling: "touch",
      ...style,
    }}
  >
    {children}
  </div>
);

export function responsiveBulkBarStyle(isMobile: boolean): CSSProperties {
  if (!isMobile) {
    return {
      position: "sticky",
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 50,
      display: "flex",
      alignItems: "center",
      gap: 12,
      flexWrap: "nowrap",
      padding: "10px 24px",
      background: "#0F172A",
      borderTop: "1px solid #1E293B",
      boxShadow: "0 -4px 20px rgba(15,23,42,0.25)",
    };
  }
  return {
    position: "fixed",
    bottom: 12,
    left: "50%",
    transform: "translateX(-50%)",
    width: "calc(100vw - 24px)",
    maxWidth: 420,
    zIndex: 60,
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    padding: "10px 12px",
    background: "#0F172A",
    border: "1px solid #1E293B",
    borderRadius: 14,
    boxShadow: "0 8px 28px rgba(15,23,42,0.45)",
    boxSizing: "border-box",
  };
}

export const ResponsiveBulkBar: React.FC<{
  isMobile: boolean;
  children: ReactNode;
  style?: CSSProperties;
}> = ({ isMobile, children, style }) => (
  <div style={{ ...responsiveBulkBarStyle(isMobile), ...style }}>
    {children}
  </div>
);

/** Touch-friendly button min height for mobile bulk / form actions. */
export function rwdTouchBtn(isMobile: boolean, extra?: CSSProperties): CSSProperties {
  return {
    minHeight: isMobile ? 38 : undefined,
    fontFamily: ERP.font.family,
    ...extra,
  };
}
