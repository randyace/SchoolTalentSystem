// ─────────────────────────────────────────────────────────────────────────────
// ERP Design System Tokens v3.0
// Local Adaptive Learning Platform (LALP) — Master Layout System
// Language: Traditional Chinese (zh-HK)
// ─────────────────────────────────────────────────────────────────────────────

export const ERP = {
  colors: {
    // ── Brand Blue ─────────────────────────────────────────────────────────
    accent:      "#2563EB",   // Blue-600  — primary interactive
    accentDark:  "#1D4ED8",   // Blue-700  — hover state
    accentDeep:  "#1E3A8A",   // Blue-900  — sidebar active bg
    accentLight: "#DBEAFE",   // Blue-100  — light tint
    accentMid:   "#3B82F6",   // Blue-500  — icon highlight
    accentPale:  "#EFF6FF",   // Blue-50   — subtle tint

    // ── Secondary Tones ────────────────────────────────────────────────────
    cyan:        "#0891B2",   // Cyan-600
    cyanLight:   "#CFFAFE",   // Cyan-100
    purple:      "#7C3AED",   // Violet-600
    purpleLight: "#EDE9FE",   // Violet-100
    pink:        "#DB2777",   // Pink-600
    pinkLight:   "#FCE7F3",   // Pink-100
    teal:        "#0D9488",   // Teal-600
    tealLight:   "#CCFBF1",   // Teal-100
    orange:      "#EA580C",   // Orange-600
    orangeLight: "#FFEDD5",   // Orange-100
    green:       "#16A34A",   // Green-600
    greenLight:  "#DCFCE7",   // Green-100
    amber:       "#D97706",   // Amber-600
    amberLight:  "#FEF3C7",   // Amber-100
    red:         "#DC2626",   // Red-600
    redLight:    "#FEE2E2",   // Red-100

    // ── Surfaces ───────────────────────────────────────────────────────────
    pageBg:       "#F1F5F9",  // Slate-100 — page background
    surface:      "#FFFFFF",  // White — card/panel surface
    surfaceHover: "#F8FAFC",  // Slate-50  — hover tint
    border:       "#E2E8F0",  // Slate-200 — default border
    borderStrong: "#CBD5E1",  // Slate-300 — emphasis border
    divider:      "#F1F5F9",  // subtle separator

    // ── Sidebar (Dark Navy) ────────────────────────────────────────────────
    sidebar:         "#0F172A",              // Slate-950
    sidebarSection:  "#080F1C",              // deeper header bg
    sidebarHover:    "#1E293B",              // Slate-800
    sidebarActive:   "rgba(37,99,235,0.18)", // blue tint active bg
    sidebarBorder:   "#1E293B",              // Slate-800 border
    sidebarText:     "#CBD5E1",              // Slate-300 item text
    sidebarMuted:    "#475569",              // Slate-600 secondary text
    sidebarGroupNum: "#60A5FA",              // Blue-400 section number
    sidebarIcon:     "#64748B",              // Slate-500 default icon
    sidebarIconActive: "#93C5FD",            // Blue-300 active icon

    // ── Text ───────────────────────────────────────────────────────────────
    textPrimary:   "#0F172A",  // Slate-950
    textSecondary: "#475569",  // Slate-600
    textMuted:     "#94A3B8",  // Slate-400
    textDisabled:  "#CBD5E1",  // Slate-300
    textInverse:   "#F8FAFC",  // Slate-50
    textLink:      "#2563EB",  // Blue-600

    // ── Semantic ───────────────────────────────────────────────────────────
    success:      "#059669",
    successLight: "#D1FAE5",
    warning:      "#D97706",
    warningLight: "#FEF3C7",
    error:        "#DC2626",
    errorLight:   "#FEE2E2",
    info:         "#0891B2",
    infoLight:    "#CFFAFE",
  },

  font: {
    family: "-apple-system, 'PingFang TC', 'Hiragino Sans GB', 'Noto Sans TC', 'Microsoft JhengHei', BlinkMacSystemFont, 'Segoe UI', sans-serif",
    mono:   "'SF Mono', 'Fira Code', 'JetBrains Mono', 'Courier New', monospace",
  },

  radius: {
    xs:   "3px",
    sm:   "5px",
    md:   "8px",
    lg:   "12px",
    xl:   "16px",
    xxl:  "20px",
    full: "9999px",
  },

  shadow: {
    xs: "0 1px 2px rgba(0,0,0,0.05)",
    sm: "0 1px 4px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
    md: "0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.03)",
    lg: "0 8px 24px rgba(0,0,0,0.10), 0 4px 8px rgba(0,0,0,0.04)",
    xl: "0 20px 48px rgba(0,0,0,0.14), 0 8px 16px rgba(0,0,0,0.05)",
    sidebar: "4px 0 24px rgba(0,0,0,0.18)",
    card:    "0 2px 8px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
  },

  layout: {
    sidebarWidth:       260,
    sidebarHeaderH:     64,
    topHeaderH:         56,
    contentPad:         24,
    tableRowH:          52,
    tableHeaderH:       44,
  },

  // ACORN 六維屬性標籤 color map
  acornTags: {
    認知: { bg: "#DBEAFE", color: "#1D4ED8", border: "#BFDBFE", label: "認知" },
    社群: { bg: "#FCE7F3", color: "#BE185D", border: "#FBCFE8", label: "社群" },
    創意: { bg: "#FFEDD5", color: "#C2410C", border: "#FED7AA", label: "創意" },
    協作: { bg: "#DCFCE7", color: "#15803D", border: "#BBF7D0", label: "協作" },
    領導: { bg: "#EDE9FE", color: "#6D28D9", border: "#DDD6FE", label: "領導" },
    體適能: { bg: "#CCFBF1", color: "#0F766E", border: "#99F6E4", label: "體適能" },
  } as Record<string, { bg: string; color: string; border: string; label: string }>,

  // Status chip map (Chinese labels)
  statusMap: {
    active:    { bg: "#D1FAE5", color: "#065F46", border: "#6EE7B7", label: "進行中" },
    planning:  { bg: "#FEF3C7", color: "#92400E", border: "#FCD34D", label: "籌備中" },
    completed: { bg: "#E2E8F0", color: "#475569", border: "#CBD5E1", label: "已完結" },
    paused:    { bg: "#FEE2E2", color: "#991B1B", border: "#FECACA", label: "暫停" },
  } as Record<string, { bg: string; color: string; border: string; label: string }>,
} as const;

export type AcornTagKey = keyof typeof ERP.acornTags;
export type StatusKey   = keyof typeof ERP.statusMap;
