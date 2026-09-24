// ─────────────────────────────────────────────────────────────────────────────
// Screen_SystemAdminHome — 系統設定總覽 / System Admin Overview
// Card-grid layout grouped by category; most-used items first.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from "react";
import {
  Database, Sparkles, Network, BookOpen, Trophy, Sliders, Code2,
  ShieldCheck, Tag, Settings, ChevronRight, CheckCircle2, Clock,
  Zap, Lock,
} from "lucide-react";
import { ERP } from "./erpTokens";

/* ── Types ─────────────────────────────────────────────────────────────────── */
interface AdminCard {
  id: string;
  zhLabel: string;
  enLabel: string;
  description: string;
  icon: React.ReactNode;
  accentColor: string;
  status?: "stable" | "beta" | "low-freq";
}

interface AdminCategory {
  id: string;
  zhTitle: string;
  enTitle: string;
  cards: AdminCard[];
}

/* ── Data ──────────────────────────────────────────────────────────────────── */
const CATEGORIES: AdminCategory[] = [
  {
    id: "general",
    zhTitle: "一般設定",
    enTitle: "General",
    cards: [
      {
        id: "data-import",
        zhLabel: "數據匯入",
        enLabel: "Data Import",
        description: "從 Excel / CSV 批量匯入學生、成績及活動記錄",
        icon: <Database size={22} />,
        accentColor: ERP.colors.accent,
        status: "stable",
      },
      {
        id: "sync-permissions",
        zhLabel: "同步與權限",
        enLabel: "Sync & Permissions",
        description: "管理教師帳號權限及跨系統數據同步設定",
        icon: <Network size={22} />,
        accentColor: "#0891B2",
        status: "stable",
      },
      {
        id: "tier-mapping",
        zhLabel: "成就級別管理",
        enLabel: "Tier Mapping",
        description: "定義 T0–T4 成就等級對應規則與積分換算",
        icon: <Trophy size={22} />,
        accentColor: "#D97706",
        status: "stable",
      },
      {
        id: "conduct-types",
        zhLabel: "行為考勤類別",
        enLabel: "Conduct & Attendance Types",
        description: "自訂行為紀錄類別及出席狀態標籤",
        icon: <Sliders size={22} />,
        accentColor: "#7C3AED",
        status: "stable",
      },
    ],
  },
  {
    id: "ai",
    zhTitle: "AI 工具",
    enTitle: "AI Tools",
    cards: [
      {
        id: "ai-workspace",
        zhLabel: "AI 文案工作站",
        enLabel: "AI Writing Workspace",
        description: "一鍵生成評語、推薦信及活動報告草稿",
        icon: <Sparkles size={22} />,
        accentColor: "#7C3AED",
        status: "stable",
      },
      {
        id: "prompt-portal",
        zhLabel: "AI 提示詞庫",
        enLabel: "Prompt Portal",
        description: "管理全校共用提示詞模板，支援分組與版本控制",
        icon: <Sparkles size={22} />,
        accentColor: "#6366F1",
        status: "stable",
      },
    ],
  },
  {
    id: "api",
    zhTitle: "API 與整合",
    enTitle: "API & Integration",
    cards: [
      {
        id: "api-automation",
        zhLabel: "API 自動化串接",
        enLabel: "API & Automation",
        description: "設定 Webhook、排程任務及第三方平台串接",
        icon: <Zap size={22} />,
        accentColor: "#059669",
        status: "stable",
      },
      {
        id: "api-docs",
        zhLabel: "接口文檔",
        enLabel: "API Docs",
        description: "查閱 REST API 端點規格與認證說明",
        icon: <BookOpen size={22} />,
        accentColor: "#0891B2",
        status: "stable",
      },
      {
        id: "dev-routes",
        zhLabel: "路由標籤元件",
        enLabel: "Dev Route Labels",
        description: "開發用路由偵錯工具及元件展示沙盒",
        icon: <Code2 size={22} />,
        accentColor: "#64748B",
        status: "beta",
      },
    ],
  },
  {
    id: "security",
    zhTitle: "安全與合規",
    enTitle: "Security & Compliance",
    cards: [
      {
        id: "desensitize-audit",
        zhLabel: "脫敏與審計",
        enLabel: "De-sensitize & Audit",
        description: "個人資料脫敏處理及操作日誌審核記錄",
        icon: <ShieldCheck size={22} />,
        accentColor: "#DC2626",
        status: "stable",
      },
    ],
  },
  {
    id: "low-freq",
    zhTitle: "低頻設定",
    enTitle: "Infrequent Settings",
    cards: [
      {
        id: "assessment-weights",
        zhLabel: "測考與權重",
        enLabel: "Assessment Weights",
        description: "調整各科測驗、考試及平時分佔比配置",
        icon: <Sliders size={22} />,
        accentColor: "#64748B",
        status: "low-freq",
      },
      {
        id: "roles-positions",
        zhLabel: "角色與崗位定義",
        enLabel: "Roles & Positions",
        description: "定義學生領導崗位名稱、層級與職責說明",
        icon: <Tag size={22} />,
        accentColor: "#64748B",
        status: "low-freq",
      },
    ],
  },
];

const STATUS_CHIP: Record<string, { label: string; bg: string; color: string }> = {
  stable:   { label: "穩定 Stable",   bg: "#DCFCE7", color: "#166534" },
  beta:     { label: "Beta",          bg: "#EFF6FF", color: ERP.colors.accent },
  "low-freq": { label: "低頻",        bg: "#F1F5F9", color: "#64748B" },
};

/* ── Sub-components ────────────────────────────────────────────────────────── */
const AdminCardTile: React.FC<{
  card: AdminCard;
  onNavigate: (id: string) => void;
}> = ({ card, onNavigate }) => {
  const [hov, setHov] = useState(false);
  const chip = card.status ? STATUS_CHIP[card.status] : null;

  return (
    <button
      onClick={() => onNavigate(card.id)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", flexDirection: "column", gap: 10,
        padding: "16px 18px",
        background: hov ? ERP.colors.accentPale : ERP.colors.surface,
        border: `1px solid ${hov ? ERP.colors.accentLight : ERP.colors.border}`,
        borderRadius: ERP.radius.lg,
        boxShadow: hov ? ERP.shadow.md : ERP.shadow.sm,
        cursor: "pointer", textAlign: "left",
        fontFamily: ERP.font.family,
        transition: "all 0.15s",
        width: "100%",
      }}
    >
      {/* Icon + status chip row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{
          width: 40, height: 40, borderRadius: ERP.radius.md, flexShrink: 0,
          background: card.accentColor + "18",
          border: `1px solid ${card.accentColor}30`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: card.accentColor,
        }}>
          {card.icon}
        </div>
        {chip && (
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: "0.03em",
            background: chip.bg, color: chip.color,
            borderRadius: ERP.radius.full, padding: "2px 7px",
            border: `1px solid ${chip.color}40`,
          }}>
            {chip.label}
          </span>
        )}
      </div>

      {/* Labels */}
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: ERP.colors.textPrimary, lineHeight: 1.2 }}>
          {card.zhLabel}
        </div>
        <div style={{ fontSize: 10, color: ERP.colors.textMuted, marginTop: 2 }}>{card.enLabel}</div>
      </div>

      {/* Description */}
      <div style={{
        fontSize: 11, color: ERP.colors.textSecondary,
        lineHeight: 1.55, flexGrow: 1,
      }}>
        {card.description}
      </div>

      {/* CTA row */}
      <div style={{
        display: "flex", alignItems: "center", gap: 4,
        fontSize: 11, fontWeight: 600,
        color: hov ? card.accentColor : ERP.colors.textMuted,
        transition: "color 0.15s",
      }}>
        <span>進入設定</span>
        <ChevronRight size={12} />
      </div>
    </button>
  );
};

/* ── Main Export ────────────────────────────────────────────────────────────── */
export const Screen_SystemAdminHome: React.FC<{
  onNavigate?: (id: string) => void;
}> = ({ onNavigate }) => {
  const handleNav = (id: string) => onNavigate?.(id);

  return (
    <div style={{
      height: "100%", overflowY: "auto",
      background: ERP.colors.pageBg,
      fontFamily: ERP.font.family,
      padding: "28px 32px",
    }}>

      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div style={{
            width: 36, height: 36, borderRadius: ERP.radius.md,
            background: `linear-gradient(135deg, ${ERP.colors.accent}, #1D4ED8)`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Settings size={18} color="#fff" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: ERP.colors.textPrimary, lineHeight: 1.2 }}>
              系統設定總覽
            </h1>
            <div style={{ fontSize: 11, color: ERP.colors.textMuted, marginTop: 2 }}>
              System Admin Overview · 1.F.0
            </div>
          </div>
        </div>
        <p style={{
          margin: 0, fontSize: 13, color: ERP.colors.textSecondary,
          maxWidth: 620, lineHeight: 1.6,
        }}>
          此頁面整合所有系統管理功能入口，按常用程度排列。建議教師僅在需要時調整低頻設定，以免影響其他班別的數據。
        </p>

        {/* Quick-status bar */}
        <div style={{
          display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" as const,
        }}>
          {[
            { icon: <CheckCircle2 size={13} />, label: "系統正常運行", color: "#059669", bg: "#DCFCE7" },
            { icon: <Clock size={13} />,        label: "上次同步：今日 08:32", color: ERP.colors.accent, bg: ERP.colors.accentPale },
            { icon: <Lock size={13} />,         label: "管理員模式已啟用", color: "#D97706", bg: "#FEF3C7" },
          ].map((item, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "5px 11px",
              background: item.bg,
              border: `1px solid ${item.color}40`,
              borderRadius: ERP.radius.full,
              fontSize: 11, fontWeight: 600, color: item.color,
            }}>
              {item.icon}
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Category sections */}
      <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        {CATEGORIES.map(cat => (
          <section key={cat.id}>
            {/* Section header */}
            <div style={{
              display: "flex", alignItems: "baseline", gap: 8, marginBottom: 14,
              paddingBottom: 8,
              borderBottom: `1px solid ${ERP.colors.border}`,
            }}>
              <span style={{
                fontSize: 13, fontWeight: 700,
                color: ERP.colors.textPrimary,
                letterSpacing: "0.01em",
              }}>{cat.zhTitle}</span>
              <span style={{ fontSize: 10, color: ERP.colors.textMuted }}>{cat.enTitle}</span>
            </div>

            {/* Card grid */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 14,
            }}>
              {cat.cards.map(card => (
                <AdminCardTile key={card.id} card={card} onNavigate={handleNav} />
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Footer note */}
      <div style={{
        marginTop: 36, padding: "14px 18px",
        background: ERP.colors.surface,
        border: `1px solid ${ERP.colors.border}`,
        borderRadius: ERP.radius.md,
        fontSize: 11, color: ERP.colors.textSecondary, lineHeight: 1.6,
      }}>
        <strong style={{ color: ERP.colors.textPrimary }}>注意 Note: </strong>
        低頻設定（如測考權重、角色定義）修改後會影響全系統計算，建議在學年初或學期末進行，並先諮詢同事。
        Changes to infrequent settings (assessment weights, role definitions) affect system-wide calculations — recommend updating at year/term boundaries only.
      </div>
    </div>
  );
};
