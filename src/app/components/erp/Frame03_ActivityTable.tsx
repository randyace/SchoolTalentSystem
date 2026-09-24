// ─────────────────────────────────────────────────────────────────────────────
// Frame 3.0 — 全校活動總表 with Edit Drawer
// Frame 1: standardised ghost-icon action buttons on every row
// Frame 2: right slide-out drawer (40% width) for editing
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect } from "react";
import {
  Search, ChevronDown, ChevronLeft, ChevronRight,
  Plus, Download, Filter, Pencil, Eye, X, Users,
  Save, ChevronRight as CRight, SlidersHorizontal,
  Upload, FileUp, Calendar, QrCode, Sparkles,
} from "lucide-react";
import { ERP, type AcornTagKey, type StatusKey } from "./erpTokens";

/* ── Types ───────────────────────────────────────────────────────────────── */
interface Activity {
  id: string;
  name: string;
  nameEn: string;
  category: string;
  pic: string;
  linkedClasses: string[];
  acornTags: AcornTagKey[];
  status: StatusKey;
  startDate: string;
  participants: number;
}

type LevelCode = "L4" | "L3" | "L2" | "L1";

interface SubEvent {
  id: string;
  label: string;
  labelEn: string;
  date: string;
}

interface MockStudent { id: string; nameZh: string; nameEn: string; class: string; no: number; yearHash: string; }
interface DisambigItem {
  id: string;
  rawName: string;
  matches: MockStudent[];
  resolved: boolean;
  resolvedId?: string;
}

interface UploadedFile {
  name: string;
  size: string;
  status: "scanning" | "done" | "error";
}

interface EditForm {
  name: string;
  category: string;
  pic: string;
  acornTags: AcornTagKey[];
  level: LevelCode;
  status: StatusKey;
}

/* ── Mock Data ───────────────────────────────────────────────────────────── */
const ACTIVITIES: Activity[] = [
  {
    id: "ACT-001", name: "全港科學創意大賽", nameEn: "HKACE Science Competition",
    category: "比賽", pic: "陳 Sir", linkedClasses: ["F3A", "F3B"],
    acornTags: ["認知", "創意"], status: "active", startDate: "2026-08-05", participants: 24,
  },
  {
    id: "ACT-002", name: "班際足球聯賽", nameEn: "Inter-Class Football League",
    category: "體育", pic: "林 Sir", linkedClasses: ["F1A", "F2A", "F3A"],
    acornTags: ["體適能", "協作"], status: "active", startDate: "2026-07-20", participants: 72,
  },
  {
    id: "ACT-003", name: "中文詩詞朗誦比賽", nameEn: "Chinese Poetry Recitation",
    category: "文藝", pic: "王老師", linkedClasses: ["F2B", "F2C"],
    acornTags: ["認知", "社群"], status: "planning", startDate: "2026-09-12", participants: 32,
  },
  {
    id: "ACT-004", name: "數學思維挑戰賽", nameEn: "Math Thinking Challenge",
    category: "學術", pic: "黃 Sir", linkedClasses: ["F4A", "F4B", "F5A"],
    acornTags: ["認知"], status: "active", startDate: "2026-08-01", participants: 45,
  },
  {
    id: "ACT-005", name: "義工服務日", nameEn: "Volunteer Service Day",
    category: "服務", pic: "李老師", linkedClasses: ["全校"],
    acornTags: ["社群", "協作", "領導"], status: "planning", startDate: "2026-10-03", participants: 420,
  },
  {
    id: "ACT-006", name: "英語戲劇表演", nameEn: "English Drama Performance",
    category: "文藝", pic: "Taylor T.", linkedClasses: ["F5A", "F6A"],
    acornTags: ["創意", "社群"], status: "completed", startDate: "2026-06-15", participants: 28,
  },
  {
    id: "ACT-007", name: "STEM 機械人工作坊", nameEn: "STEM Robotics Workshop",
    category: "學術", pic: "陳 Sir", linkedClasses: ["F3C"],
    acornTags: ["創意", "認知"], status: "active", startDate: "2026-08-10", participants: 18,
  },
  {
    id: "ACT-008", name: "校際音樂節", nameEn: "Inter-school Music Festival",
    category: "文藝", pic: "何老師", linkedClasses: ["F1B", "F2A"],
    acornTags: ["創意"], status: "paused", startDate: "2026-09-28", participants: 36,
  },
];

const CATEGORIES = ["全部類別", "比賽", "體育", "文藝", "學術", "服務"];
const EDIT_CATEGORIES = ["比賽", "體育", "文藝", "學術", "服務"];
const YEARS = ["2025/26", "2024/25", "2023/24"];
const STATUSES: { key: StatusKey; label: string }[] = [
  { key: "active",    label: "進行中" },
  { key: "planning",  label: "籌備中" },
  { key: "completed", label: "已完結" },
  { key: "paused",    label: "暫停"   },
];
const ALL_ACORN_TAGS: AcornTagKey[] = ["認知", "社群", "創意", "協作", "領導", "體適能"];
const LEVEL_OPTIONS: { code: LevelCode; label: string; sub: string }[] = [
  { code: "L4", label: "L4", sub: "國際 / 全港" },
  { code: "L3", label: "L3", sub: "校際"       },
  { code: "L2", label: "L2", sub: "全校"       },
  { code: "L1", label: "L1", sub: "班級 / 學會" },
];
const PAGE_SIZE = 8;

/* ── Mock Students ───────────────────────────────────────────────────────── */
const MOCK_STUDENTS = [
  { id: "2024001", nameZh: "陳大文", nameEn: "Chan Tai Man",    class: "F3A", no: 1,  yearHash: "24A-01" },
  { id: "2024002", nameZh: "李美玲", nameEn: "Lee Mei Ling",    class: "F3A", no: 2,  yearHash: "24A-02" },
  { id: "2024003", nameZh: "黃志豪", nameEn: "Wong Chi Ho",     class: "F3A", no: 3,  yearHash: "24A-03" },
  { id: "2024004", nameZh: "張詩敏", nameEn: "Cheung Sze Man",  class: "F3A", no: 4,  yearHash: "24A-04" },
  { id: "2024005", nameZh: "林俊傑", nameEn: "Lam Chun Kit",    class: "F3A", no: 5,  yearHash: "24A-05" },
  { id: "2024006", nameZh: "吳嘉欣", nameEn: "Ng Ka Yan",       class: "F3A", no: 6,  yearHash: "24A-06" },
  { id: "2024007", nameZh: "鄭宇翔", nameEn: "Cheng Yu Cheung", class: "F3B", no: 1,  yearHash: "24B-01" },
  { id: "2024008", nameZh: "梁慧雯", nameEn: "Leung Wai Man",   class: "F3B", no: 2,  yearHash: "24B-02" },
  { id: "2024009", nameZh: "何建明", nameEn: "Ho Kin Ming",     class: "F3B", no: 3,  yearHash: "24B-03" },
  { id: "2024010", nameZh: "劉佩珊", nameEn: "Lau Pui Shan",    class: "F3B", no: 4,  yearHash: "24B-04" },
  { id: "2024011", nameZh: "楊浩然", nameEn: "Yeung Ho Yin",    class: "F3B", no: 5,  yearHash: "24B-05" },
  { id: "2024012", nameZh: "蔡曉彤", nameEn: "Choi Hiu Tung",   class: "F3B", no: 6,  yearHash: "24B-06" },
  { id: "2024013", nameZh: "許志遠", nameEn: "Hui Chi Yuen",    class: "F1A", no: 1,  yearHash: "26A-01" },
  { id: "2024014", nameZh: "羅雅雯", nameEn: "Lo Nga Man",      class: "F1A", no: 2,  yearHash: "26A-02" },
  { id: "2024015", nameZh: "謝家豪", nameEn: "Tse Ka Ho",       class: "F2A", no: 1,  yearHash: "25A-01" },
  { id: "2024016", nameZh: "馮紫晴", nameEn: "Fung Zi Ching",   class: "F2A", no: 2,  yearHash: "25A-02" },
  // Name-collision entries — used to demo the disambiguation flow
  { id: "2024017", nameZh: "陳志明", nameEn: "Chan Chi Ming",   class: "F4A", no: 3,  yearHash: "23A-03" },
  { id: "2024018", nameZh: "陳美兒", nameEn: "Chan Mei Yi",     class: "F4B", no: 7,  yearHash: "23B-07" },
  { id: "2024019", nameZh: "李明峰", nameEn: "Lee Ming Fung",   class: "F5A", no: 4,  yearHash: "22A-04" },
  { id: "2024020", nameZh: "李明達", nameEn: "Lee Ming Tat",    class: "F5B", no: 11, yearHash: "22B-11" },
];

const TIER_OPTIONS = [
  { value: "",   label: "— 未設定 Unset —" },
  { value: "T0", label: "T0 — 掛名/選拔 Shadow/Selection" },
  { value: "T1", label: "T1 — 參與 Participant" },
  { value: "T2", label: "T2 — 核心 Core Member" },
  { value: "T3", label: "T3 — 領導 Leader" },
  { value: "T4", label: "T4 — 卓越 Outstanding" },
];

/* ── Atoms ───────────────────────────────────────────────────────────────── */
const AcornChip: React.FC<{ tag: AcornTagKey }> = ({ tag }) => {
  const s = ERP.acornTags[tag];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "2px 7px", background: s.bg, color: s.color,
      border: `1px solid ${s.border}`, borderRadius: ERP.radius.full,
      fontSize: "10px", fontWeight: 700, letterSpacing: "0.02em", whiteSpace: "nowrap",
    }}>{s.label}</span>
  );
};

const StatusBadge: React.FC<{ status: StatusKey }> = ({ status }) => {
  const cfg = ERP.statusMap[status];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      padding: "3px 10px", background: cfg.bg, color: cfg.color,
      border: `1px solid ${cfg.border}`, borderRadius: ERP.radius.full,
      fontSize: "11px", fontWeight: 700, whiteSpace: "nowrap",
    }}>
      <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: cfg.color, display: "inline-block", flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
};

const ClassChip: React.FC<{ label: string }> = ({ label }) => (
  <span style={{
    display: "inline-flex", padding: "2px 6px",
    background: ERP.colors.pageBg, color: ERP.colors.textSecondary,
    border: `1px solid ${ERP.colors.border}`, borderRadius: ERP.radius.xs,
    fontSize: "10px", fontWeight: 700, whiteSpace: "nowrap",
  }}>{label}</span>
);

const FilterSelect: React.FC<{
  value: string; onChange: (v: string) => void;
  options: string[]; width?: number | string;
}> = ({ value, onChange, options, width = 140 }) => (
  <div style={{ position: "relative", flexShrink: 0 }}>
    <select value={value} onChange={(e) => onChange(e.target.value)} style={{
      width: typeof width === "number" ? `${width}px` : width, padding: "7px 28px 7px 10px",
      border: `1px solid ${ERP.colors.border}`, borderRadius: ERP.radius.md,
      fontSize: "13px", fontFamily: ERP.font.family,
      color: ERP.colors.textPrimary, background: ERP.colors.surface,
      outline: "none", appearance: "none", cursor: "pointer",
    }}>
      {options.map((o) => <option key={o}>{o}</option>)}
    </select>
    <ChevronDown size={12} color={ERP.colors.textMuted} style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
  </div>
);

const TH: React.FC<{ children: React.ReactNode; width?: string; align?: "left" | "center" | "right" }> = ({
  children, width, align = "left",
}) => (
  <th style={{
    padding: "10px 14px", textAlign: align, fontSize: "11px", fontWeight: 700,
    color: ERP.colors.textSecondary, letterSpacing: "0.06em",
    textTransform: "uppercase", whiteSpace: "nowrap", width,
    background: "#F8FAFC", borderBottom: `2px solid ${ERP.colors.border}`,
  }}>
    {children}
  </th>
);

const Pagination: React.FC<{
  page: number; total: number; pageSize: number; onPage: (p: number) => void;
}> = ({ page, total, pageSize, onPage }) => {
  const totalPages = Math.ceil(total / pageSize);
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "12px 20px", borderTop: `1px solid ${ERP.colors.border}`, background: ERP.colors.surface,
    }}>
      <div style={{ fontSize: "13px", color: ERP.colors.textMuted }}>
        共 <strong style={{ color: ERP.colors.textPrimary }}>{total}</strong> 條記錄，
        顯示第 <strong style={{ color: ERP.colors.textPrimary }}>
          {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)}
        </strong> 條
      </div>
      <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
        <button onClick={() => onPage(page - 1)} disabled={page === 1} style={{
          display: "flex", alignItems: "center", gap: "4px", padding: "5px 10px",
          border: `1px solid ${ERP.colors.border}`, borderRadius: ERP.radius.sm,
          background: page === 1 ? ERP.colors.pageBg : ERP.colors.surface,
          color: page === 1 ? ERP.colors.textDisabled : ERP.colors.textSecondary,
          cursor: page === 1 ? "not-allowed" : "pointer", fontSize: "13px", fontFamily: ERP.font.family,
        }}>
          <ChevronLeft size={14} /> 上一頁
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button key={p} onClick={() => onPage(p)} style={{
            width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center",
            border: `1px solid ${p === page ? ERP.colors.accent : ERP.colors.border}`,
            borderRadius: ERP.radius.sm,
            background: p === page ? ERP.colors.accent : ERP.colors.surface,
            color: p === page ? "#fff" : ERP.colors.textSecondary,
            cursor: "pointer", fontSize: "13px", fontWeight: p === page ? 700 : 400,
            fontFamily: ERP.font.family,
          }}>{p}</button>
        ))}
        <button onClick={() => onPage(page + 1)} disabled={page === totalPages} style={{
          display: "flex", alignItems: "center", gap: "4px", padding: "5px 10px",
          border: `1px solid ${ERP.colors.border}`, borderRadius: ERP.radius.sm,
          background: page === totalPages ? ERP.colors.pageBg : ERP.colors.surface,
          color: page === totalPages ? ERP.colors.textDisabled : ERP.colors.textSecondary,
          cursor: page === totalPages ? "not-allowed" : "pointer", fontSize: "13px", fontFamily: ERP.font.family,
        }}>
          下一頁 <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};

/* ── Drawer Form Section Header ──────────────────────────────────────────── */
const DrawerSection: React.FC<{ label: string; sub?: string; children: React.ReactNode }> = ({ label, sub, children }) => (
  <div style={{ marginBottom: "24px" }}>
    <div style={{
      display: "flex", alignItems: "baseline", gap: "8px",
      paddingBottom: "8px", marginBottom: "14px",
      borderBottom: `1px solid ${ERP.colors.border}`,
    }}>
      <span style={{ fontSize: "12px", fontWeight: 800, color: ERP.colors.textPrimary, letterSpacing: "0.04em", textTransform: "uppercase" }}>
        {label}
      </span>
      {sub && <span style={{ fontSize: "11px", color: ERP.colors.textMuted }}>{sub}</span>}
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      {children}
    </div>
  </div>
);

/* ── Drawer Field Wrapper ─────────────────────────────────────────────────── */
const Field: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({ label, hint, children }) => (
  <div>
    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
      <label style={{ fontSize: "12px", fontWeight: 700, color: ERP.colors.textSecondary, letterSpacing: "0.02em" }}>
        {label}
      </label>
      {hint && <span style={{ fontSize: "10px", color: ERP.colors.textMuted, background: ERP.colors.pageBg, border: `1px solid ${ERP.colors.border}`, borderRadius: ERP.radius.xs, padding: "1px 5px" }}>{hint}</span>}
    </div>
    {children}
  </div>
);

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 10px",
  border: `1px solid ${ERP.colors.border}`,
  borderRadius: ERP.radius.md, fontSize: "13px",
  fontFamily: ERP.font.family, color: ERP.colors.textPrimary,
  background: ERP.colors.surface, outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.15s",
};

/* ── Weight Matrix ───────────────────────────────────────────────────────── */
// Safe ASCII class names for slider thumb CSS
const ACORN_SAFE: Record<string, string> = {
  "認知": "renzhi", "社群": "shequn", "創意": "chuangyi",
  "協作": "xiezuo", "領導": "lingdao", "體適能": "tishinen",
};

const WeightMatrix: React.FC<{
  tags:     AcornTagKey[];
  weights:  Record<string, number>;
  onChange: (tag: AcornTagKey, newVal: number) => void;
}> = ({ tags, weights, onChange }) => {
  if (tags.length === 0) return null;

  const total    = tags.reduce((s, t) => s + (weights[t] ?? 0), 0);
  const isExact  = total === 100;
  const F        = ERP.font.family;
  const MONO     = ERP.font.mono;

  // Build per-tag thumb CSS
  const thumbCss = tags.map(t => {
    const cls = ACORN_SAFE[t] ?? t;
    const col = ERP.acornTags[t]?.color ?? ERP.colors.accent;
    return `
      .wm-${cls}::-webkit-slider-thumb {
        -webkit-appearance: none; appearance: none;
        width: 15px; height: 15px; border-radius: 50%;
        background: ${col}; cursor: pointer;
        border: 2.5px solid #fff;
        box-shadow: 0 0 0 1.5px ${col}60, 0 1px 3px rgba(0,0,0,0.18);
        transition: transform 0.12s;
      }
      .wm-${cls}:hover::-webkit-slider-thumb { transform: scale(1.15); }
      .wm-${cls}::-moz-range-thumb {
        width: 15px; height: 15px; border-radius: 50%;
        background: ${col}; cursor: pointer;
        border: 2.5px solid #fff;
        box-shadow: 0 0 0 1.5px ${col}60;
      }
      .wm-${cls} { outline: none; }
    `;
  }).join("");

  return (
    <div style={{
      background: "#F8FAFC",
      border: `1px solid ${ERP.colors.border}`,
      borderRadius: ERP.radius.lg,
      overflow: "hidden",
    }}>
      <style>{`
        .wm-range { -webkit-appearance: none; appearance: none; width: 100%;
          height: 6px; border-radius: 3px; outline: none; cursor: pointer; }
        ${thumbCss}
      `}</style>

      {/* Matrix header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "9px 14px",
        background: "#fff",
        borderBottom: `1px solid ${ERP.colors.border}`,
      }}>
        <SlidersHorizontal size={12} color={ERP.colors.textMuted} />
        <span style={{ fontSize: 11, fontWeight: 700, color: ERP.colors.textSecondary, fontFamily: F }}>
          動態權重分配矩陣
        </span>
        <span style={{ fontSize: 10, color: ERP.colors.textMuted, fontFamily: F }}>
          Weight Distribution
        </span>
        <div style={{ flex: 1 }} />
        {/* Total badge */}
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          padding: "2px 9px", borderRadius: ERP.radius.full,
          background: isExact ? ERP.colors.successLight : ERP.colors.warningLight,
          border: `1px solid ${isExact ? "#6EE7B7" : "#FCD34D"}`,
          fontSize: 11, fontWeight: 700,
          color: isExact ? ERP.colors.success : ERP.colors.warning,
          fontFamily: F, transition: "all 0.2s",
        }}>
          {isExact ? "✓" : "⚠"} 總計: {total}%
        </span>
      </div>

      {/* Progress bar strip */}
      <div style={{ height: 4, display: "flex", overflow: "hidden" }}>
        {tags.map(t => (
          <div key={t} style={{
            height: "100%",
            width: `${weights[t] ?? 0}%`,
            background: ERP.acornTags[t]?.color ?? ERP.colors.accent,
            transition: "width 0.22s ease",
          }} />
        ))}
      </div>

      {/* Weight rows */}
      {tags.map((tag, rowIdx) => {
        const dim = ERP.acornTags[tag];
        const val = weights[tag] ?? 0;
        const cls = `wm-range wm-${ACORN_SAFE[tag] ?? tag}`;
        const trackBg = `linear-gradient(to right, ${dim.color} 0%, ${dim.color} ${val}%, #E2E8F0 ${val}%, #E2E8F0 100%)`;

        return (
          <div key={tag} style={{
            display: "grid",
            gridTemplateColumns: "90px 1fr 64px",
            alignItems: "center",
            gap: 12,
            padding: "11px 14px",
            borderBottom: rowIdx < tags.length - 1 ? `1px solid ${ERP.colors.divider}` : "none",
            background: "#fff",
          }}>
            {/* Tag label */}
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                padding: "3px 8px",
                background: dim.bg, border: `1px solid ${dim.border}`,
                borderRadius: ERP.radius.full,
                fontSize: 11, fontWeight: 700, color: dim.color,
                fontFamily: F, width: "fit-content",
              }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: dim.color, flexShrink: 0 }} />
                {tag}
              </span>
              <span style={{ fontSize: 9, color: ERP.colors.textMuted, fontFamily: F, paddingLeft: 2 }}>
                {dim.label}
              </span>
            </div>

            {/* Slider */}
            <input
              type="range"
              min={0} max={100} step={1}
              value={val}
              className={cls}
              onChange={e => onChange(tag, parseInt(e.target.value))}
              style={{ background: trackBg }}
            />

            {/* Pill value input */}
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <input
                type="number"
                min={0} max={100}
                value={val}
                onChange={e => onChange(tag, Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                style={{
                  width: 64, boxSizing: "border-box",
                  padding: "4px 20px 4px 8px",
                  border: `1.5px solid ${dim.border}`,
                  borderRadius: ERP.radius.full,
                  background: dim.bg,
                  color: dim.color,
                  fontSize: 12, fontWeight: 800,
                  textAlign: "center",
                  outline: "none",
                  fontFamily: MONO,
                  MozAppearance: "textfield",
                } as React.CSSProperties}
              />
              <span style={{
                position: "absolute", right: 8,
                fontSize: 10, fontWeight: 700, color: dim.color,
                pointerEvents: "none",
              }}>%</span>
            </div>
          </div>
        );
      })}

      {/* Footer note */}
      <div style={{
        padding: "7px 14px",
        background: ERP.colors.pageBg,
        borderTop: `1px solid ${ERP.colors.border}`,
        fontSize: 10, color: ERP.colors.textMuted, fontFamily: F,
      }}>
        拖動滑桿調整權重，系統將按比例重新分配其他維度，確保總計維持 100%。
      </div>
    </div>
  );
};

/* ── Main Export ─────────────────────────────────────────────────────────── */
export const Frame03_ActivityTable: React.FC = () => {
  const [search, setSearch]                   = useState("");
  const [year, setYear]                       = useState(YEARS[0]);
  const [category, setCategory]               = useState(CATEGORIES[0]);
  const [page, setPage]                       = useState(1);
  const [selectedIds, setSelectedIds]         = useState<Set<string>>(new Set());
  const [editingId, setEditingId]             = useState<string | null>(null);
  const [hoveredRow, setHoveredRow]           = useState<string | null>(null);
  const [hoveredBtn, setHoveredBtn]           = useState<string | null>(null);
  const [isMobile, setIsMobile]               = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [participantSearch, setParticipantSearch] = useState("");
  const [participantIds, setParticipantIds]   = useState<Set<string>>(
    new Set(["2024001", "2024003", "2024005", "2024007", "2024009", "2024011"])
  );

  // Roster panel tabs & paste flow
  const [rosterTab, setRosterTab]           = useState<"add" | "roles">("add");
  const [addMode, setAddMode]               = useState<"search" | "paste">("search");
  const [pasteText, setPasteText]           = useState("");
  const [disambigQueue, setDisambigQueue]   = useState<DisambigItem[]>([]);
  const [rosterRoles, setRosterRoles]       = useState<Record<string, { title: string; tier: string }>>({});

  // Sub-events / stages
  const [subEvents, setSubEvents] = useState<SubEvent[]>([
    { id: "s1", label: "初賽", labelEn: "Preliminary", date: "2026-10-15" },
    { id: "s2", label: "決賽", labelEn: "Final",       date: "2026-11-20" },
  ]);

  // OCR upload zone
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([
    { name: "2026_programming_gold.pdf", size: "1.2 MB", status: "done" },
  ]);
  const [dragOver, setDragOver] = useState(false);

  // QR Sign-in modal
  const [qrActive, setQrActive]           = useState(false);
  const [qrStageLabel, setQrStageLabel]   = useState("");

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Edit form state — seeded from ACT-001 (全港科學創意大賽)
  const [form, setForm] = useState<EditForm>({
    name: "全港科學創意大賽",
    category: "比賽",
    pic: "陳 Sir",
    acornTags: ["認知", "創意"],
    level: "L4",
    status: "active",
  });

  // ACORN weight state — must always sum to 100
  const [acornWeights, setAcornWeights] = useState<Record<string, number>>({
    "認知": 60, "創意": 40,
  });

  const filtered = ACTIVITIES.filter((a) => {
    if (search && !a.name.includes(search) && !a.nameEn.toLowerCase().includes(search.toLowerCase())) return false;
    if (category !== CATEGORIES[0] && a.category !== category) return false;
    return true;
  });
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSelect = (id: string) => setSelectedIds((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const toggleAll = () => {
    if (selectedIds.size === paginated.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(paginated.map((a) => a.id)));
  };

  const openEdit = (act: Activity) => {
    const tags = [...act.acornTags];
    setForm({ name: act.name, category: act.category, pic: act.pic, acornTags: tags, level: "L2", status: act.status });
    const base = Math.floor(100 / tags.length);
    const rem  = 100 - base * tags.length;
    const w: Record<string, number> = {};
    tags.forEach((t, i) => { w[t] = base + (i === 0 ? rem : 0); });
    setAcornWeights(w);
    setEditingId(act.id);
  };

  const openNew = () => {
    setForm({ name: "", category: "比賽", pic: "", acornTags: [], level: "L2", status: "planning" });
    setAcornWeights({});
    setParticipantIds(new Set());
    setEditingId("NEW");
  };

  // Redistribute weights evenly across `tags`, rounding to integers summing to 100
  const rebalanceEvenly = (tags: AcornTagKey[]) => {
    if (tags.length === 0) { setAcornWeights({}); return; }
    const base = Math.floor(100 / tags.length);
    const rem  = 100 - base * tags.length;
    const w: Record<string, number> = {};
    tags.forEach((t, i) => { w[t] = base + (i === 0 ? rem : 0); });
    setAcornWeights(w);
  };

  const toggleAcornTag = (tag: AcornTagKey) => {
    setForm(f => {
      const isSelected = f.acornTags.includes(tag);
      const newTags = isSelected
        ? f.acornTags.filter(t => t !== tag)
        : [...f.acornTags, tag];
      rebalanceEvenly(newTags);
      return { ...f, acornTags: newTags };
    });
  };

  // Drag one slider → adjust others proportionally so total stays 100
  const handleWeightChange = (changedTag: AcornTagKey, newVal: number) => {
    const clamped   = Math.max(0, Math.min(100, newVal));
    const others    = form.acornTags.filter(t => t !== changedTag);
    if (others.length === 0) { setAcornWeights({ [changedTag]: 100 }); return; }

    const remaining     = 100 - clamped;
    const othersOldSum  = others.reduce((s, t) => s + (acornWeights[t] ?? 0), 0);
    const newW: Record<string, number> = { [changedTag]: clamped };

    let distributed = 0;
    others.forEach((t, i) => {
      if (i < others.length - 1) {
        const share = othersOldSum > 0
          ? Math.round((acornWeights[t] ?? 0) / othersOldSum * remaining)
          : Math.round(remaining / others.length);
        newW[t]      = share;
        distributed += share;
      } else {
        newW[t] = Math.max(0, remaining - distributed);
      }
    });
    setAcornWeights(newW);
  };

  const parsePaste = () => {
    const rawLines = pasteText.split(/[\n,，\t]/).map(s => s.trim()).filter(Boolean);
    const autoAdd: string[] = [];
    const newQueue: DisambigItem[] = [];
    rawLines.forEach((rawName, i) => {
      const candidates = MOCK_STUDENTS.filter(s =>
        s.nameZh === rawName ||
        s.nameEn.toLowerCase() === rawName.toLowerCase() ||
        s.nameZh.includes(rawName) ||
        s.nameEn.toLowerCase().includes(rawName.toLowerCase())
      );
      if (candidates.length === 1) {
        autoAdd.push(candidates[0].id);
      } else {
        newQueue.push({ id: `dq-${i}-${rawName}`, rawName, matches: candidates, resolved: false });
      }
    });
    if (autoAdd.length > 0) {
      setParticipantIds(prev => { const n = new Set(prev); autoAdd.forEach(id => n.add(id)); return n; });
    }
    setDisambigQueue(newQueue);
    if (newQueue.length === 0) { setPasteText(""); setRosterTab("roles"); }
  };

  const addFiles = (files: File[]) => {
    const newEntries: UploadedFile[] = files.map(f => ({
      name: f.name,
      size: `${(f.size / 1024 / 1024).toFixed(1)} MB`,
      status: "scanning",
    }));
    setUploadedFiles(prev => [...prev, ...newEntries]);
    setTimeout(() => {
      setUploadedFiles(prev => prev.map(u => u.status === "scanning" ? { ...u, status: "done" } : u));
    }, 1800);
  };

  const openQr = (stageLabel: string) => {
    setQrStageLabel(stageLabel);
    setQrActive(true);
  };

  const statusCounts = {
    active:    ACTIVITIES.filter(a => a.status === "active").length,
    planning:  ACTIVITIES.filter(a => a.status === "planning").length,
    completed: ACTIVITIES.filter(a => a.status === "completed").length,
    paused:    ACTIVITIES.filter(a => a.status === "paused").length,
  };

  const isNewMode = editingId === "NEW";
  const editingActivity = editingId && !isNewMode ? ACTIVITIES.find(a => a.id === editingId) : null;
  const drawerOpen = !!editingId;

  return (
    <>
    <div style={{
      position: "relative", fontFamily: ERP.font.family,
      height: isMobile ? "auto" : "100%",
      minHeight: isMobile ? "100%" : undefined,
      overflow: isMobile ? "visible" : "hidden",
    }}>

      {/* ── Main content area ─────────────────────────────────────────────── */}
      <div style={{
        padding: isMobile ? "16px" : `${ERP.layout.contentPad}px`,
        paddingBottom: isMobile && selectedIds.size > 0 ? "96px" : undefined,
        transition: "opacity 0.2s, filter 0.2s",
        opacity: drawerOpen ? 0.45 : 1,
        filter: drawerOpen ? "blur(1px)" : "none",
        pointerEvents: drawerOpen ? "none" : "auto",
        minHeight: "100%",
      }}>

        {/* Page Header */}
        <div style={{
          display: "flex", alignItems: "flex-start",
          justifyContent: "space-between",
          flexDirection: isMobile ? "column" : "row",
          marginBottom: "16px", gap: "12px",
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
              <h1 style={{ fontSize: isMobile ? "18px" : "22px", fontWeight: 800, color: ERP.colors.textPrimary, lineHeight: 1 }}>
                全校活動總表
              </h1>
              <span style={{
                fontSize: "11px", fontWeight: 700,
                background: ERP.colors.accentLight, color: ERP.colors.accentDark,
                border: `1px solid ${ERP.colors.accent}40`,
                borderRadius: ERP.radius.full, padding: "2px 10px",
              }}>
                {ACTIVITIES.length} 個活動
              </span>
            </div>
            {!isMobile && (
              <p style={{ fontSize: "13px", color: ERP.colors.textSecondary, lineHeight: 1.4 }}>
                2.0 校園活動引擎 · All Campus Activities · 學年 {year}
              </p>
            )}
          </div>
          <div style={{ display: "flex", gap: "8px", flexShrink: 0, width: isMobile ? "100%" : "auto" }}>
            <button style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "8px 14px", flex: isMobile ? 1 : undefined,
              justifyContent: isMobile ? "center" : undefined,
              border: `1px solid ${ERP.colors.border}`, borderRadius: ERP.radius.md,
              background: ERP.colors.surface, color: ERP.colors.textSecondary,
              cursor: "pointer", fontSize: "13px", fontFamily: ERP.font.family,
            }}>
              <Download size={14} /> 匯出
            </button>
            <button
              onClick={openNew}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "8px 16px", flex: isMobile ? 1 : undefined,
                justifyContent: isMobile ? "center" : undefined,
                border: "none", borderRadius: ERP.radius.md,
                background: ERP.colors.accent, color: "#fff",
                cursor: "pointer", fontSize: "13px", fontWeight: 600, fontFamily: ERP.font.family,
                boxShadow: `0 2px 8px ${ERP.colors.accent}40`,
              }}
            >
              <Plus size={15} /> 新增活動
            </button>
          </div>
        </div>

        {/* Status Summary Bar */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, auto)",
          gap: "8px", marginBottom: "16px",
        }}>
          {[
            { label: "進行中", count: statusCounts.active,    color: ERP.colors.success, bg: ERP.colors.successLight },
            { label: "籌備中", count: statusCounts.planning,  color: ERP.colors.warning, bg: ERP.colors.warningLight },
            { label: "已完結", count: statusCounts.completed, color: ERP.colors.textSecondary, bg: ERP.colors.pageBg },
            { label: "暫停",   count: statusCounts.paused,    color: ERP.colors.red,     bg: ERP.colors.redLight },
          ].map((item) => (
            <div key={item.label} style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "8px 12px", background: ERP.colors.surface,
              border: `1px solid ${ERP.colors.border}`, borderRadius: ERP.radius.md, cursor: "pointer",
            }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: item.color, flexShrink: 0 }} />
              <span style={{ fontSize: "13px", color: ERP.colors.textSecondary }}>{item.label}</span>
              <span style={{
                fontSize: "14px", fontWeight: 700, color: item.color,
                background: item.bg, borderRadius: ERP.radius.full, padding: "0 7px",
                marginLeft: "auto",
              }}>{item.count}</span>
            </div>
          ))}
        </div>

        {/* Filter Bar */}
        <div style={{
          display: "flex", flexDirection: "column", gap: "8px",
          padding: "12px 16px", background: ERP.colors.surface,
          border: `1px solid ${ERP.colors.border}`,
          borderRadius: `${ERP.radius.md} ${ERP.radius.md} 0 0`, borderBottom: "none",
        }}>
          {/* Search row */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Search size={14} color={ERP.colors.textMuted} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }} />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="搜尋活動名稱..."
                style={{
                  width: "100%", paddingLeft: "32px", paddingRight: "12px",
                  paddingTop: "7px", paddingBottom: "7px",
                  border: `1px solid ${ERP.colors.border}`, borderRadius: ERP.radius.md,
                  fontSize: "13px", fontFamily: ERP.font.family,
                  outline: "none", color: ERP.colors.textPrimary,
                  background: ERP.colors.pageBg, boxSizing: "border-box",
                }}
              />
            </div>
            {!isMobile && (
              <>
                <FilterSelect value={year}     onChange={setYear}     options={YEARS}       width={120} />
                <FilterSelect value={category} onChange={(v) => { setCategory(v); setPage(1); }} options={CATEGORIES} width={140} />
                <button style={{
                  display: "flex", alignItems: "center", gap: "5px", padding: "7px 12px",
                  border: `1px solid ${ERP.colors.border}`, borderRadius: ERP.radius.md,
                  background: ERP.colors.surface, color: ERP.colors.textSecondary,
                  cursor: "pointer", fontSize: "13px", fontFamily: ERP.font.family, whiteSpace: "nowrap",
                }}>
                  <Filter size={13} /> 進階篩選
                </button>
              </>
            )}
            <span style={{ fontSize: "12px", color: ERP.colors.textMuted, whiteSpace: "nowrap", marginLeft: isMobile ? undefined : "auto" }}>
              {filtered.length} 條
            </span>
          </div>
          {/* Mobile filter dropdowns */}
          {isMobile && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <FilterSelect value={year}     onChange={setYear}     options={YEARS}       width="100%" />
              <FilterSelect value={category} onChange={(v) => { setCategory(v); setPage(1); }} options={CATEGORIES} width="100%" />
            </div>
          )}
        </div>

        {/* Data Table */}
        <div style={{
          background: ERP.colors.surface,
          border: `1px solid ${ERP.colors.border}`,
          borderRadius: `0 0 ${ERP.radius.md} ${ERP.radius.md}`,
          overflow: "hidden", boxShadow: ERP.shadow.card,
        }}>
          {isMobile ? (
            <div>
              {/* Mobile select-all header */}
              <div style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "10px 16px", borderBottom: `1px solid ${ERP.colors.border}`,
                background: "#F8FAFC",
              }}>
                <input
                  type="checkbox"
                  checked={selectedIds.size === paginated.length && paginated.length > 0}
                  onChange={toggleAll}
                  style={{ cursor: "pointer", accentColor: ERP.colors.accent }}
                />
                <span style={{ fontSize: "11px", fontWeight: 700, color: ERP.colors.textSecondary, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                  全選 ({paginated.length})
                </span>
              </div>
              {paginated.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center", color: ERP.colors.textMuted, fontSize: "14px" }}>
                  沒有符合條件的活動
                </div>
              ) : paginated.map((act) => {
                const isSelected = selectedIds.has(act.id);
                const isEditing  = editingId === act.id;
                return (
                  <div
                    key={act.id}
                    style={{
                      padding: "12px 16px",
                      background: isEditing ? ERP.colors.accentPale : isSelected ? "#EFF6FF" : ERP.colors.surface,
                      borderBottom: `1px solid ${ERP.colors.border}`,
                      outline: isEditing ? `2px solid ${ERP.colors.accent}` : "none",
                      outlineOffset: "-1px",
                    }}
                  >
                    {/* Row 1: checkbox + name + id badge + action buttons */}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(act.id)}
                        style={{ cursor: "pointer", accentColor: ERP.colors.accent, marginTop: "3px", flexShrink: 0 }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginBottom: "2px" }}>
                          <span style={{ fontSize: "14px", fontWeight: 600, color: ERP.colors.textPrimary }}>
                            {act.name}
                          </span>
                          <span style={{
                            fontSize: "9px", fontWeight: 700, color: ERP.colors.textMuted,
                            background: ERP.colors.pageBg, border: `1px solid ${ERP.colors.border}`,
                            borderRadius: ERP.radius.xs, padding: "1px 4px", whiteSpace: "nowrap",
                          }}>
                            {act.id}
                          </span>
                        </div>
                        <div style={{ fontSize: "11px", color: ERP.colors.textMuted, marginBottom: "8px" }}>
                          {act.nameEn} · {act.participants} 人參與
                        </div>
                        {/* Row 2: teacher + class chips + status + date */}
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginBottom: "6px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <div style={{
                              width: "18px", height: "18px", borderRadius: "50%",
                              background: `linear-gradient(135deg, ${ERP.colors.accent}, ${ERP.colors.cyan})`,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: "8px", fontWeight: 700, color: "#fff", flexShrink: 0,
                            }}>
                              {act.pic.slice(0, 1)}
                            </div>
                            <span style={{ fontSize: "11px", color: ERP.colors.textSecondary, whiteSpace: "nowrap" }}>{act.pic}</span>
                          </div>
                          <span style={{ color: ERP.colors.borderStrong, fontSize: "10px" }}>·</span>
                          {act.linkedClasses.map((cls) => <ClassChip key={cls} label={cls} />)}
                          <span style={{ color: ERP.colors.borderStrong, fontSize: "10px" }}>·</span>
                          <span style={{ fontSize: "11px", color: ERP.colors.textMuted, fontFamily: ERP.font.mono }}>{act.startDate}</span>
                        </div>
                        {/* Row 3: ACORN tags + status badge */}
                        <div style={{ display: "flex", alignItems: "center", gap: "5px", flexWrap: "wrap" }}>
                          <StatusBadge status={act.status} />
                          {act.acornTags.map((tag) => <AcornChip key={tag} tag={tag} />)}
                        </div>
                      </div>
                      {/* Action buttons */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "5px", flexShrink: 0 }}>
                        <button
                          onClick={() => openEdit(act)}
                          style={{
                            display: "inline-flex", alignItems: "center", gap: "4px",
                            padding: "4px 9px",
                            border: `1px solid ${isEditing ? ERP.colors.accent : ERP.colors.border}`,
                            borderRadius: ERP.radius.sm,
                            background: isEditing ? ERP.colors.accentPale : "transparent",
                            color: isEditing ? ERP.colors.accent : ERP.colors.textSecondary,
                            cursor: "pointer", fontSize: "11px", fontWeight: 600,
                            fontFamily: ERP.font.family, whiteSpace: "nowrap",
                          }}
                        >
                          <Pencil size={11} /> 編輯
                        </button>
                        <button
                          style={{
                            display: "inline-flex", alignItems: "center", gap: "4px",
                            padding: "4px 9px",
                            border: `1px solid ${ERP.colors.border}`,
                            borderRadius: ERP.radius.sm, background: "transparent",
                            color: ERP.colors.textSecondary,
                            cursor: "pointer", fontSize: "11px", fontWeight: 600,
                            fontFamily: ERP.font.family, whiteSpace: "nowrap",
                          }}
                        >
                          <Eye size={11} /> 查看
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: ERP.font.family }}>
              <thead>
                <tr>
                  <th style={{ padding: "10px 16px", width: "40px", background: "#F8FAFC", borderBottom: `2px solid ${ERP.colors.border}` }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.size === paginated.length && paginated.length > 0}
                      onChange={toggleAll}
                      style={{ cursor: "pointer", accentColor: ERP.colors.accent }}
                    />
                  </th>
                  <TH width="25%">活動名稱</TH>
                  <TH width="9%">負責教師</TH>
                  <TH width="14%">連結班別</TH>
                  <TH width="20%"><span title="ACORN 六維能力屬性標籤">ACORN 屬性標籤</span></TH>
                  <TH width="10%" align="center">狀態</TH>
                  <TH width="9%">開始日期</TH>
                  <TH width="13%" align="center">操作</TH>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: "40px", textAlign: "center", color: ERP.colors.textMuted, fontSize: "14px" }}>
                      沒有符合條件的活動
                    </td>
                  </tr>
                ) : paginated.map((act) => {
                  const isSelected = selectedIds.has(act.id);
                  const isHovered  = hoveredRow === act.id;
                  const isEditing  = editingId === act.id;
                  return (
                    <tr
                      key={act.id}
                      onMouseEnter={() => setHoveredRow(act.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      style={{
                        background: isEditing
                          ? ERP.colors.accentPale
                          : isSelected
                          ? "#EFF6FF"
                          : isHovered ? ERP.colors.surfaceHover
                          : ERP.colors.surface,
                        borderBottom: `1px solid ${ERP.colors.border}`,
                        transition: "background 0.1s",
                        outline: isEditing ? `2px solid ${ERP.colors.accent}` : "none",
                        outlineOffset: "-1px",
                      }}
                    >
                      {/* Checkbox */}
                      <td style={{ padding: "12px 16px" }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(act.id)}
                          style={{ cursor: "pointer", accentColor: ERP.colors.accent }}
                        />
                      </td>

                      {/* Activity Name */}
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontSize: "14px", fontWeight: 600, color: ERP.colors.textPrimary }}>
                              {act.name}
                            </span>
                            <span style={{
                              fontSize: "9px", fontWeight: 700,
                              color: ERP.colors.textMuted, background: ERP.colors.pageBg,
                              border: `1px solid ${ERP.colors.border}`,
                              borderRadius: ERP.radius.xs, padding: "1px 4px",
                            }}>
                              {act.id}
                            </span>
                          </div>
                          <div style={{ fontSize: "11px", color: ERP.colors.textMuted }}>
                            {act.nameEn} · {act.category} · {act.participants} 人參與
                          </div>
                        </div>
                      </td>

                      {/* PIC */}
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <div style={{
                            width: "24px", height: "24px", borderRadius: "50%",
                            background: `linear-gradient(135deg, ${ERP.colors.accent}, ${ERP.colors.cyan})`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "9px", fontWeight: 700, color: "#fff", flexShrink: 0,
                          }}>
                            {act.pic.slice(0, 1)}
                          </div>
                          <span style={{ fontSize: "13px", color: ERP.colors.textPrimary, whiteSpace: "nowrap" }}>
                            {act.pic}
                          </span>
                        </div>
                      </td>

                      {/* Linked Classes */}
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                          {act.linkedClasses.map((cls) => <ClassChip key={cls} label={cls} />)}
                        </div>
                      </td>

                      {/* ACORN Tags */}
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                          {act.acornTags.map((tag) => <AcornChip key={tag} tag={tag} />)}
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: "12px 14px", textAlign: "center" }}>
                        <StatusBadge status={act.status} />
                      </td>

                      {/* Date */}
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{ fontSize: "12px", color: ERP.colors.textSecondary, fontFamily: ERP.font.mono }}>
                          {act.startDate}
                        </span>
                      </td>

                      {/* ── Actions: always-visible ghost icon buttons ── */}
                      <td style={{ padding: "10px 14px", textAlign: "center" }}>
                        <div style={{ display: "flex", gap: "6px", justifyContent: "center", alignItems: "center" }}>
                          {/* Edit button */}
                          <button
                            onClick={() => openEdit(act)}
                            onMouseEnter={() => setHoveredBtn(`edit-${act.id}`)}
                            onMouseLeave={() => setHoveredBtn(null)}
                            style={{
                              display: "inline-flex", alignItems: "center", gap: "4px",
                              padding: "4px 9px",
                              border: `1px solid ${hoveredBtn === `edit-${act.id}` || isEditing ? ERP.colors.accent : ERP.colors.border}`,
                              borderRadius: ERP.radius.sm,
                              background: hoveredBtn === `edit-${act.id}` || isEditing ? ERP.colors.accentPale : "transparent",
                              color: hoveredBtn === `edit-${act.id}` || isEditing ? ERP.colors.accent : ERP.colors.textSecondary,
                              cursor: "pointer",
                              fontSize: "11px", fontWeight: 600,
                              fontFamily: ERP.font.family,
                              transition: "all 0.13s",
                              whiteSpace: "nowrap",
                            }}
                          >
                            <Pencil size={11} />
                            編輯
                          </button>
                          {/* View button */}
                          <button
                            onMouseEnter={() => setHoveredBtn(`view-${act.id}`)}
                            onMouseLeave={() => setHoveredBtn(null)}
                            style={{
                              display: "inline-flex", alignItems: "center", gap: "4px",
                              padding: "4px 9px",
                              border: `1px solid ${hoveredBtn === `view-${act.id}` ? ERP.colors.accent : ERP.colors.border}`,
                              borderRadius: ERP.radius.sm,
                              background: hoveredBtn === `view-${act.id}` ? ERP.colors.accentPale : "transparent",
                              color: hoveredBtn === `view-${act.id}` ? ERP.colors.accent : ERP.colors.textSecondary,
                              cursor: "pointer",
                              fontSize: "11px", fontWeight: 600,
                              fontFamily: ERP.font.family,
                              transition: "all 0.13s",
                              whiteSpace: "nowrap",
                            }}
                          >
                            <Eye size={11} />
                            查看
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          )}

          <Pagination
            page={page} total={filtered.length} pageSize={PAGE_SIZE}
            onPage={(p) => setPage(Math.max(1, Math.min(p, Math.ceil(filtered.length / PAGE_SIZE))))}
          />
        </div>

        {/* Batch Action Bar */}
        {selectedIds.size > 0 && (
          isMobile ? (
            <div style={{
              position: "fixed", bottom: 0, left: 0, right: 0,
              background: ERP.colors.textPrimary,
              borderRadius: "12px 12px 0 0",
              padding: "14px 16px",
              boxShadow: ERP.shadow.xl, zIndex: 400, fontFamily: ERP.font.family,
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>
                  已選取 {selectedIds.size} 個活動
                </span>
                <button onClick={() => setSelectedIds(new Set())} style={{
                  padding: "4px 10px", border: "1px solid rgba(255,255,255,0.3)",
                  borderRadius: ERP.radius.md, background: "transparent",
                  color: "rgba(255,255,255,0.7)", cursor: "pointer", fontSize: "12px",
                  fontFamily: ERP.font.family,
                }}>清除</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                {["批量修改狀態", "匯出選取", "刪除"].map((label, i) => (
                  <button key={label} style={{
                    padding: "8px 0", border: "none", borderRadius: ERP.radius.md,
                    background: i === 0 ? ERP.colors.accent : i === 2 ? ERP.colors.red : "rgba(255,255,255,0.12)",
                    color: "#fff", cursor: "pointer", fontSize: "12px", fontWeight: 600,
                    fontFamily: ERP.font.family,
                  }}>{label}</button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{
              position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)",
              background: ERP.colors.textPrimary, borderRadius: ERP.radius.xl,
              padding: "12px 20px", display: "flex", alignItems: "center", gap: "12px",
              boxShadow: ERP.shadow.xl, zIndex: 400, fontFamily: ERP.font.family,
            }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>
                已選取 {selectedIds.size} 個活動
              </span>
              <div style={{ width: "1px", height: "20px", background: "rgba(255,255,255,0.2)" }} />
              {["批量修改狀態", "匯出選取項目", "刪除"].map((label, i) => (
                <button key={label} style={{
                  padding: "6px 14px", border: "none", borderRadius: ERP.radius.md,
                  background: i === 0 ? ERP.colors.accent : i === 2 ? ERP.colors.red : "rgba(255,255,255,0.12)",
                  color: "#fff", cursor: "pointer", fontSize: "12px", fontWeight: 600,
                  fontFamily: ERP.font.family,
                }}>{label}</button>
              ))}
              <button onClick={() => setSelectedIds(new Set())} style={{
                padding: "5px 12px", border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: ERP.radius.md, background: "transparent",
                color: "rgba(255,255,255,0.7)", cursor: "pointer", fontSize: "12px",
                fontFamily: ERP.font.family,
              }}>清除</button>
            </div>
          )
        )}
      </div>

      {/* ── Dim overlay (click-to-close) ──────────────────────────────────── */}
      {drawerOpen && (
        <div
          onClick={() => setEditingId(null)}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(15, 23, 42, 0.35)",
            zIndex: 490,
            cursor: "pointer",
          }}
        />
      )}

      {/* ── Participant Management Panel ─────────────────────────────────── */}
      {showParticipants && (
        <>
          {/* Backdrop */}
          <div onClick={() => setShowParticipants(false)} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", zIndex: 550 }} />

          {/* Panel */}
          <div style={{
            position: "fixed",
            ...(isMobile ? { bottom: 0, left: 0, right: 0, height: "92vh", borderRadius: "16px 16px 0 0" }
                        : { top: 0, right: 0, width: "min(560px, 46vw)", height: "100vh", borderLeft: `1px solid ${ERP.colors.border}` }),
            background: ERP.colors.surface, boxShadow: ERP.shadow.xl,
            zIndex: 600, display: "flex", flexDirection: "column", overflow: "hidden",
          }}>

            {/* ── Header ── */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 20px", height: 60, flexShrink: 0, borderBottom: `1px solid ${ERP.colors.border}`, background: ERP.colors.surface }}>
              <div style={{ width: 32, height: 32, borderRadius: ERP.radius.md, background: ERP.colors.accentPale, border: `1px solid ${ERP.colors.accentLight}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Users size={15} color={ERP.colors.accent} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: ERP.colors.textMuted, letterSpacing: "0.04em", textTransform: "uppercase" as const }}>名單管理 / 動態分組</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: ERP.colors.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{editingActivity?.name ?? "新增活動"}</div>
              </div>
              <span style={{ padding: "2px 10px", borderRadius: ERP.radius.full, background: ERP.colors.accent, color: "#fff", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                {participantIds.size} 人已加入
              </span>
              {disambigQueue.filter(q => !q.resolved).length > 0 && (
                <span style={{ padding: "2px 8px", borderRadius: ERP.radius.full, background: "#FEF3C7", border: "1px solid #FDE68A", color: "#92400E", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                  ⚠️ {disambigQueue.filter(q => !q.resolved).length} 撞名
                </span>
              )}
              <button onClick={() => setShowParticipants(false)} style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${ERP.colors.border}`, borderRadius: ERP.radius.md, background: "transparent", color: ERP.colors.textMuted, cursor: "pointer", flexShrink: 0, marginLeft: 4 }}>
                <X size={14} />
              </button>
            </div>

            {/* ── Tab bar ── */}
            <div style={{ display: "flex", borderBottom: `1px solid ${ERP.colors.border}`, padding: "0 20px", flexShrink: 0, background: ERP.colors.surface }}>
              {([
                { key: "add" as const,   label: "加入學生 Add",       badge: undefined },
                { key: "roles" as const, label: "名單與職銜 Roles",   badge: participantIds.size > 0 ? participantIds.size : undefined },
              ]).map(tab => (
                <button key={tab.key} onClick={() => setRosterTab(tab.key)} style={{ padding: "11px 16px", border: "none", background: "none", fontSize: 12, fontWeight: rosterTab === tab.key ? 700 : 500, color: rosterTab === tab.key ? ERP.colors.accent : ERP.colors.textSecondary, cursor: "pointer", fontFamily: ERP.font.family, borderBottom: rosterTab === tab.key ? `2px solid ${ERP.colors.accent}` : "2px solid transparent", marginBottom: -1, display: "flex", alignItems: "center", gap: 6, transition: "all 0.12s" }}>
                  {tab.label}
                  {tab.badge !== undefined && (
                    <span style={{ padding: "1px 6px", borderRadius: ERP.radius.full, background: rosterTab === tab.key ? ERP.colors.accent : ERP.colors.pageBg, border: rosterTab === tab.key ? "none" : `1px solid ${ERP.colors.border}`, color: rosterTab === tab.key ? "#fff" : ERP.colors.textMuted, fontSize: 10, fontWeight: 800 }}>{tab.badge}</span>
                  )}
                </button>
              ))}
            </div>

            {/* ── Disambiguation Queue (shown above both tabs when active) ── */}
            {disambigQueue.filter(q => !q.resolved).length > 0 && (
              <div style={{ margin: "10px 16px 0", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: ERP.radius.lg, overflow: "hidden", flexShrink: 0 }}>
                {/* Banner */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", borderBottom: "1px solid #FDE68A" }}>
                  <span style={{ fontSize: 16 }}>⚠️</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#92400E", fontFamily: ERP.font.family }}>
                      撞名待解決 Name Conflicts — {disambigQueue.filter(q => !q.resolved).length} 項
                    </div>
                    <div style={{ fontSize: 10.5, color: "#B45309", fontFamily: ERP.font.family }}>系統無法自動指派，請手動確認每位學生身份</div>
                  </div>
                </div>
                {/* Items */}
                <div style={{ maxHeight: 230, overflowY: "auto" }}>
                  {disambigQueue.filter(q => !q.resolved).map(item => (
                    <div key={item.id} style={{ padding: "11px 14px", borderBottom: "1px solid #FEF3C7" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#92400E", fontFamily: ERP.font.family, marginBottom: 8 }}>
                        貼上名稱：「<span style={{ fontFamily: ERP.font.mono }}>{item.rawName}</span>」
                        {item.matches.length > 0 ? ` — 找到 ${item.matches.length} 個可能匹配` : " — 找不到匹配學生"}
                      </div>
                      {item.matches.length > 0 ? (
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {item.matches.map(s => (
                            <div key={s.id} style={{ display: "flex", flexDirection: "column", gap: 6, padding: "10px 12px", background: "#fff", border: "1px solid #FDE68A", borderRadius: ERP.radius.md, minWidth: 140, flex: "1 1 140px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{ width: 28, height: 28, borderRadius: "50%", background: `linear-gradient(135deg, ${ERP.colors.accent}, ${ERP.colors.cyan})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{s.nameZh.slice(0, 1)}</div>
                                <div>
                                  <div style={{ fontSize: 12, fontWeight: 700, color: ERP.colors.textPrimary, fontFamily: ERP.font.family }}>{s.nameZh}</div>
                                  <div style={{ fontSize: 10, color: ERP.colors.textMuted, fontFamily: ERP.font.family }}>{s.nameEn}</div>
                                </div>
                              </div>
                              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                                {[s.class, `#${s.id}`, s.yearHash].map(chip => (
                                  <span key={chip} style={{ padding: "1px 6px", background: ERP.colors.pageBg, border: `1px solid ${ERP.colors.border}`, borderRadius: ERP.radius.xs, fontSize: 10, color: ERP.colors.textSecondary, fontFamily: ERP.font.mono }}>{chip}</span>
                                ))}
                              </div>
                              <button
                                onClick={() => {
                                  setParticipantIds(prev => { const n = new Set(prev); n.add(s.id); return n; });
                                  setDisambigQueue(prev => prev.map(q => q.id === item.id ? { ...q, resolved: true, resolvedId: s.id } : q));
                                }}
                                style={{ padding: "5px 10px", border: "none", borderRadius: ERP.radius.sm, background: ERP.colors.accent, color: "#fff", fontSize: 11, fontWeight: 700, fontFamily: ERP.font.family, cursor: "pointer" }}
                              >
                                ✓ 選取 Select
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "#FEE2E2", borderRadius: ERP.radius.sm }}>
                          <span style={{ fontSize: 13 }}>❌</span>
                          <span style={{ fontSize: 11, color: "#991B1B", fontFamily: ERP.font.family }}>找不到符合的學生，請手動搜尋後勾選</span>
                          <button onClick={() => { setDisambigQueue(prev => prev.map(q => q.id === item.id ? { ...q, resolved: true } : q)); setParticipantSearch(item.rawName); setAddMode("search"); setRosterTab("add"); }} style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, color: ERP.colors.accent, background: "none", border: "none", cursor: "pointer", fontFamily: ERP.font.family, textDecoration: "underline" }}>跳至搜尋</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Tab body ── */}
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", minHeight: 0 }}>

              {/* Tab: 加入學生 */}
              {rosterTab === "add" && (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>

                  {/* Mode toggle */}
                  <div style={{ padding: "12px 20px 0", flexShrink: 0 }}>
                    <div style={{ display: "inline-flex", padding: 3, background: ERP.colors.pageBg, border: `1px solid ${ERP.colors.border}`, borderRadius: ERP.radius.md, gap: 2, marginBottom: 12 }}>
                      {([
                        { key: "search" as const, icon: "🔍", label: "搜尋 Search" },
                        { key: "paste"  as const, icon: "📋", label: "貼上名單 Paste" },
                      ]).map(m => (
                        <button key={m.key} onClick={() => setAddMode(m.key)} style={{ padding: "6px 14px", border: "none", borderRadius: ERP.radius.sm, background: addMode === m.key ? ERP.colors.accent : "transparent", color: addMode === m.key ? "#fff" : ERP.colors.textSecondary, fontSize: 12, fontWeight: 600, fontFamily: ERP.font.family, cursor: "pointer", transition: "all 0.12s" }}>
                          {m.icon} {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Search mode */}
                  {addMode === "search" && (
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>
                      <div style={{ padding: "0 20px 8px", flexShrink: 0 }}>
                        <div style={{ position: "relative", marginBottom: 10 }}>
                          <Search size={13} color={ERP.colors.textMuted} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                          <input value={participantSearch} onChange={e => setParticipantSearch(e.target.value)} placeholder="搜尋學生姓名或學號…" style={{ width: "100%", boxSizing: "border-box" as const, paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8, border: `1px solid ${ERP.colors.border}`, borderRadius: ERP.radius.md, fontSize: 13, fontFamily: ERP.font.family, color: ERP.colors.textPrimary, background: ERP.colors.pageBg, outline: "none" }} />
                        </div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ fontSize: 11, color: ERP.colors.textMuted, fontFamily: ERP.font.family }}>共 {MOCK_STUDENTS.length} 位學生 · {participantIds.size} 人已加入</span>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button onClick={() => setParticipantIds(new Set(MOCK_STUDENTS.map(s => s.id)))} style={{ fontSize: 11, color: ERP.colors.accent, background: "none", border: "none", cursor: "pointer", fontFamily: ERP.font.family, fontWeight: 600 }}>全選</button>
                            <span style={{ color: ERP.colors.border }}>|</span>
                            <button onClick={() => setParticipantIds(new Set())} style={{ fontSize: 11, color: ERP.colors.textMuted, background: "none", border: "none", cursor: "pointer", fontFamily: ERP.font.family }}>全清</button>
                          </div>
                        </div>
                      </div>
                      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px" }}>
                        {(() => {
                          const keyword = participantSearch.toLowerCase();
                          const visible = MOCK_STUDENTS.filter(s => !keyword || s.nameZh.includes(participantSearch) || s.nameEn.toLowerCase().includes(keyword) || s.id.includes(participantSearch) || s.class.toLowerCase().includes(keyword));
                          if (visible.length === 0) return <div style={{ padding: "32px 0", textAlign: "center", color: ERP.colors.textMuted, fontSize: 13, fontFamily: ERP.font.family }}>找不到符合條件的學生</div>;
                          const byClass: Record<string, typeof visible> = {};
                          visible.forEach(s => { if (!byClass[s.class]) byClass[s.class] = []; byClass[s.class].push(s); });
                          return Object.entries(byClass).map(([cls, students]) => (
                            <div key={cls} style={{ marginBottom: 4 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0 5px", fontSize: 10.5, fontWeight: 800, color: ERP.colors.textMuted, letterSpacing: "0.07em", textTransform: "uppercase" as const, fontFamily: ERP.font.family, borderBottom: `1px solid ${ERP.colors.divider}`, marginBottom: 2 }}>
                                <span style={{ padding: "1px 7px", borderRadius: ERP.radius.xs, background: ERP.colors.pageBg, border: `1px solid ${ERP.colors.border}`, color: ERP.colors.textSecondary, fontFamily: ERP.font.mono, fontSize: 10 }}>{cls}</span>
                                <span>{students.length} 人</span>
                                <span style={{ color: ERP.colors.accent, marginLeft: "auto" }}>{students.filter(s => participantIds.has(s.id)).length} 已加入</span>
                              </div>
                              {students.map(student => {
                                const enrolled = participantIds.has(student.id);
                                return (
                                  <div key={student.id} onClick={() => setParticipantIds(prev => { const next = new Set(prev); next.has(student.id) ? next.delete(student.id) : next.add(student.id); return next; })} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 8px", borderRadius: ERP.radius.md, background: enrolled ? ERP.colors.accentPale : "transparent", cursor: "pointer", transition: "background 0.1s", marginBottom: 1 }}>
                                    <div style={{ width: 18, height: 18, borderRadius: 4, flexShrink: 0, border: `2px solid ${enrolled ? ERP.colors.accent : ERP.colors.borderStrong}`, background: enrolled ? ERP.colors.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.12s" }}>
                                      {enrolled && <span style={{ color: "#fff", fontSize: 11, lineHeight: 1, fontWeight: 900 }}>✓</span>}
                                    </div>
                                    <div style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0, background: `linear-gradient(135deg, ${ERP.colors.accent}, ${ERP.colors.cyan})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff" }}>{student.nameZh.slice(0, 1)}</div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ fontSize: 13, fontWeight: 600, color: enrolled ? ERP.colors.accent : ERP.colors.textPrimary, fontFamily: ERP.font.family }}>{student.nameZh}</div>
                                      <div style={{ fontSize: 10.5, color: ERP.colors.textMuted, fontFamily: ERP.font.family }}>{student.nameEn}</div>
                                    </div>
                                    <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
                                      <div style={{ fontSize: 11, fontWeight: 700, color: ERP.colors.textSecondary, fontFamily: ERP.font.mono }}>{student.class}</div>
                                      <div style={{ fontSize: 10, color: ERP.colors.textMuted, fontFamily: ERP.font.family }}>No. {student.no}</div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ));
                        })()}
                        <div style={{ height: 12 }} />
                      </div>
                    </div>
                  )}

                  {/* Paste mode */}
                  {addMode === "paste" && (
                    <div style={{ padding: "0 20px 16px", display: "flex", flexDirection: "column", gap: 14 }}>
                      <div style={{ padding: "10px 14px", background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: ERP.radius.md }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#1D4ED8", fontFamily: ERP.font.family, marginBottom: 4 }}>📋 Excel 快速貼上 Smart Paste</div>
                        <div style={{ fontSize: 11, color: "#3B82F6", fontFamily: ERP.font.family, lineHeight: 1.7 }}>
                          每行一個名字，或用逗號 / Tab 分隔。唯一比對自動加入；撞名須手動確認。<br />
                          Each name on a new line, or comma/tab separated. Unique matches auto-enroll; conflicts require manual confirmation.
                        </div>
                      </div>
                      <textarea
                        value={pasteText}
                        onChange={e => setPasteText(e.target.value)}
                        placeholder={"陳大文\n李美玲\n黃志豪\n…或從 Excel 直接貼上"}
                        rows={8}
                        style={{ width: "100%", boxSizing: "border-box" as const, padding: "12px 14px", border: `1.5px solid ${ERP.colors.border}`, borderRadius: ERP.radius.md, fontSize: 13, fontFamily: ERP.font.mono, color: ERP.colors.textPrimary, background: ERP.colors.pageBg, outline: "none", resize: "vertical" as const, lineHeight: 1.8 }}
                      />
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={parsePaste}
                          disabled={!pasteText.trim()}
                          style={{ flex: 1, padding: "10px 16px", border: "none", borderRadius: ERP.radius.md, background: pasteText.trim() ? ERP.colors.accent : ERP.colors.border, color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: ERP.font.family, cursor: pasteText.trim() ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.12s" }}
                        >
                          <Sparkles size={14} /> 解析名單 Parse List
                        </button>
                        <button onClick={() => { setPasteText(""); setDisambigQueue([]); }} style={{ padding: "10px 14px", border: `1px solid ${ERP.colors.border}`, borderRadius: ERP.radius.md, background: "transparent", color: ERP.colors.textSecondary, fontSize: 12, fontWeight: 600, fontFamily: ERP.font.family, cursor: "pointer" }}>清除</button>
                      </div>
                      <div style={{ padding: "8px 12px", background: ERP.colors.pageBg, border: `1px dashed ${ERP.colors.border}`, borderRadius: ERP.radius.sm }}>
                        <div style={{ fontSize: 10.5, color: ERP.colors.textMuted, fontFamily: ERP.font.family, lineHeight: 1.7 }}>
                          💡 <strong>Demo：</strong>試貼「陳」或「李明」可觸發撞名處理流程 · Paste "陳" or "李明" to demo the disambiguation flow
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: 名單與職銜 */}
              {rosterTab === "roles" && (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
                  {participantIds.size === 0 ? (
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, color: ERP.colors.textMuted, fontFamily: ERP.font.family }}>
                      <Users size={36} color={ERP.colors.border} />
                      <div style={{ fontSize: 13, fontWeight: 600 }}>尚未加入任何學生</div>
                      <div style={{ fontSize: 11 }}>請先在「加入學生」分頁選擇或貼上學生名單</div>
                      <button onClick={() => setRosterTab("add")} style={{ marginTop: 4, padding: "8px 18px", border: `1px solid ${ERP.colors.accent}`, borderRadius: ERP.radius.md, background: ERP.colors.accentPale, color: ERP.colors.accent, fontSize: 12, fontWeight: 600, fontFamily: ERP.font.family, cursor: "pointer" }}>
                        前往加入學生 →
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Column headers */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 130px 158px 76px", gap: 8, padding: "8px 20px", background: ERP.colors.pageBg, borderBottom: `1px solid ${ERP.colors.border}`, flexShrink: 0 }}>
                        {[
                          { zh: "學生 Student", en: "" },
                          { zh: "自訂職銜", en: "Custom Title" },
                          { zh: "系統級別", en: "System Tier" },
                          { zh: "狀態", en: "Status" },
                        ].map(col => (
                          <div key={col.zh}>
                            <div style={{ fontSize: 10.5, fontWeight: 800, color: ERP.colors.textMuted, fontFamily: ERP.font.family, letterSpacing: "0.04em" }}>{col.zh}</div>
                            {col.en && <div style={{ fontSize: 9.5, color: ERP.colors.textMuted, fontFamily: ERP.font.family, opacity: 0.7 }}>{col.en}</div>}
                          </div>
                        ))}
                      </div>

                      {/* Enrolled student rows */}
                      <div style={{ flex: 1, overflowY: "auto" }}>
                        {MOCK_STUDENTS.filter(s => participantIds.has(s.id)).map(student => {
                          const role = rosterRoles[student.id] ?? { title: "", tier: "" };
                          const isAssigned = !!role.tier;
                          return (
                            <div key={student.id} style={{ display: "grid", gridTemplateColumns: "1fr 130px 158px 76px", gap: 8, alignItems: "center", padding: "10px 20px", borderBottom: `1px solid ${ERP.colors.divider}`, background: isAssigned ? "#F0FDF4" : ERP.colors.surface, transition: "background 0.15s" }}>

                              {/* Student info */}
                              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                                <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, background: `linear-gradient(135deg, ${ERP.colors.accent}, ${ERP.colors.cyan})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff" }}>
                                  {student.nameZh.slice(0, 1)}
                                </div>
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ fontSize: 12, fontWeight: 600, color: ERP.colors.textPrimary, fontFamily: ERP.font.family, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{student.nameZh}</div>
                                  <div style={{ fontSize: 10, color: ERP.colors.textMuted, fontFamily: ERP.font.mono }}>{student.class} · #{student.id}</div>
                                </div>
                              </div>

                              {/* Custom title */}
                              <input
                                value={role.title}
                                onChange={e => setRosterRoles(prev => ({ ...prev, [student.id]: { ...role, title: e.target.value } }))}
                                placeholder="如 Captain…"
                                style={{ width: "100%", boxSizing: "border-box" as const, padding: "5px 8px", border: `1px solid ${ERP.colors.border}`, borderRadius: ERP.radius.sm, fontSize: 11, fontFamily: ERP.font.family, color: ERP.colors.textPrimary, background: "#fff", outline: "none" }}
                              />

                              {/* System tier dropdown */}
                              <div style={{ position: "relative" }}>
                                <select
                                  value={role.tier}
                                  onChange={e => setRosterRoles(prev => ({ ...prev, [student.id]: { ...role, tier: e.target.value } }))}
                                  style={{ width: "100%", boxSizing: "border-box" as const, padding: "5px 22px 5px 8px", border: `1px solid ${role.tier ? ERP.colors.accent : ERP.colors.border}`, borderRadius: ERP.radius.sm, fontSize: 11, fontFamily: ERP.font.family, color: role.tier ? ERP.colors.accent : ERP.colors.textSecondary, background: role.tier ? ERP.colors.accentPale : "#fff", outline: "none", appearance: "none" as const, cursor: "pointer", fontWeight: role.tier ? 700 : 400 }}
                                >
                                  {TIER_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                                <ChevronDown size={11} color={ERP.colors.textMuted} style={{ position: "absolute", right: 7, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                              </div>

                              {/* Status badge */}
                              <div>
                                {isAssigned ? (
                                  <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "3px 7px", borderRadius: ERP.radius.full, background: "#D1FAE5", border: "1px solid #6EE7B7", fontSize: 9.5, fontWeight: 700, color: ERP.colors.success, fontFamily: ERP.font.family, whiteSpace: "nowrap" }}>✓ 已設定</span>
                                ) : (
                                  <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "3px 7px", borderRadius: ERP.radius.full, background: "#FEF3C7", border: "1px solid #FDE68A", fontSize: 9.5, fontWeight: 700, color: "#92400E", fontFamily: ERP.font.family, whiteSpace: "nowrap" }}>⏳ 待設定</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        <div style={{ height: 12 }} />
                      </div>

                      {/* Tier summary bar */}
                      <div style={{ padding: "8px 20px", borderTop: `1px solid ${ERP.colors.border}`, background: ERP.colors.pageBg, display: "flex", gap: 10, alignItems: "center", flexShrink: 0, flexWrap: "wrap" }}>
                        {["T0","T1","T2","T3","T4"].map(tier => {
                          const count = Object.values(rosterRoles).filter(r => r.tier === tier).length;
                          return count > 0 ? (
                            <span key={tier} style={{ fontSize: 10.5, fontFamily: ERP.font.family, color: ERP.colors.textSecondary }}>
                              <strong style={{ color: ERP.colors.accent }}>{tier}</strong> × {count}
                            </span>
                          ) : null;
                        })}
                        <span style={{ fontSize: 10.5, color: ERP.colors.textMuted, fontFamily: ERP.font.family, marginLeft: "auto" }}>
                          {Object.values(rosterRoles).filter(r => r.tier).length} / {participantIds.size} 已設定級別
                        </span>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* ── Footer ── */}
            <div style={{ padding: "14px 20px", borderTop: `1px solid ${ERP.colors.border}`, background: ERP.colors.surface, display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
              <div style={{ flex: 1, fontSize: 12, color: ERP.colors.textMuted, fontFamily: ERP.font.family }}>
                已選取 <strong style={{ color: ERP.colors.accent }}>{participantIds.size}</strong> 位學生
                {disambigQueue.filter(q => !q.resolved).length > 0 && (
                  <span style={{ marginLeft: 8, color: "#92400E" }}>· ⚠️ {disambigQueue.filter(q => !q.resolved).length} 撞名未解決</span>
                )}
              </div>
              <button onClick={() => setShowParticipants(false)} style={{ padding: "9px 18px", border: `1px solid ${ERP.colors.border}`, borderRadius: ERP.radius.md, background: "transparent", color: ERP.colors.textSecondary, fontSize: 13, fontWeight: 600, fontFamily: ERP.font.family, cursor: "pointer" }}>取消</button>
              <button onClick={() => setShowParticipants(false)} style={{ padding: "9px 22px", border: "none", borderRadius: ERP.radius.md, background: ERP.colors.accent, color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: ERP.font.family, cursor: "pointer", boxShadow: `0 2px 8px ${ERP.colors.accent}40`, display: "flex", alignItems: "center", gap: 6 }}>
                <Users size={13} /> 確認名單
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Right Slide-out Edit Drawer (Frame 2) ─────────────────────────── */}
      <div style={{
        position: "fixed",
        ...(isMobile ? {
          bottom: 0, left: 0, right: 0,
          height: drawerOpen ? "85vh" : 0,
          width: "100%",
          borderTop: `1px solid ${ERP.colors.border}`,
          borderRadius: "16px 16px 0 0",
          transition: "height 0.28s cubic-bezier(0.4, 0, 0.2, 1)",
        } : {
          top: 0, right: 0,
          width: drawerOpen ? "min(560px, 44vw)" : 0,
          height: "100vh",
          borderLeft: `1px solid ${ERP.colors.border}`,
          transition: "width 0.28s cubic-bezier(0.4, 0, 0.2, 1)",
        }),
        background: ERP.colors.surface,
        boxShadow: drawerOpen ? ERP.shadow.xl : "none",
        overflow: "hidden",
        zIndex: 500,
        display: "flex",
        flexDirection: "column",
      }}>
        {/* Only render content when open to avoid layout flash */}
        {drawerOpen && (isNewMode || editingActivity) && (
          <>
            {/* Drawer Header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "0 20px",
              height: "60px", flexShrink: 0,
              borderBottom: `1px solid ${ERP.colors.border}`,
              background: ERP.colors.surface,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                <div style={{
                  width: "32px", height: "32px", borderRadius: ERP.radius.md,
                  background: isNewMode ? ERP.colors.successLight : ERP.colors.accentPale,
                  border: `1px solid ${isNewMode ? "#6EE7B7" : ERP.colors.accentLight}`,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  {isNewMode ? <Plus size={15} color={ERP.colors.success} /> : <Pencil size={15} color={ERP.colors.accent} />}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: "11px", color: ERP.colors.textMuted, letterSpacing: "0.04em", textTransform: "uppercase" as const, marginBottom: "1px" }}>
                    {isNewMode ? "新增活動" : "編輯活動"}
                  </div>
                  <div style={{
                    fontSize: "14px", fontWeight: 700, color: ERP.colors.textPrimary,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {isNewMode ? "填寫活動資料" : editingActivity!.name}
                  </div>
                </div>
              </div>
              {/* Breadcrumb pill — edit mode only */}
              {!isNewMode && editingActivity && (
                <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
                  <span style={{ fontSize: "10px", color: ERP.colors.textMuted }}>活動總表</span>
                  <CRight size={10} color={ERP.colors.textMuted} />
                  <span style={{ fontSize: "10px", color: ERP.colors.accent, fontWeight: 600 }}>{editingActivity.id}</span>
                </div>
              )}
              <button
                onClick={() => setEditingId(null)}
                style={{
                  width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center",
                  border: `1px solid ${ERP.colors.border}`, borderRadius: ERP.radius.md,
                  background: "transparent", color: ERP.colors.textMuted, cursor: "pointer",
                  flexShrink: 0, marginLeft: "8px",
                }}
              >
                <X size={14} />
              </button>
            </div>

            {/* Drawer Body — scrollable */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 0" }}>

              {/* ── Section 1: 基本資訊 ───────────────────────────────── */}
              <DrawerSection label="基本資訊" sub="Basic Info">

                <Field label="活動名稱">
                  <input
                    value={form.name}
                    onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                    style={inputStyle}
                  />
                </Field>

                <Field label="活動類別">
                  <div style={{ position: "relative" }}>
                    <select
                      value={form.category}
                      onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
                      style={{ ...inputStyle, paddingRight: "28px", appearance: "none", cursor: "pointer" }}
                    >
                      {EDIT_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                    <ChevronDown size={13} color={ERP.colors.textMuted} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                  </div>
                </Field>

                <Field label="負責教師" hint="可搜尋">
                  <div style={{ position: "relative" }}>
                    <Search size={13} color={ERP.colors.textMuted} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }} />
                    <input
                      value={form.pic}
                      onChange={(e) => setForm(f => ({ ...f, pic: e.target.value }))}
                      placeholder="搜尋教師姓名..."
                      style={{ ...inputStyle, paddingLeft: "30px" }}
                    />
                  </div>
                </Field>
              </DrawerSection>

              {/* ── Section 2: 賽程 / 日程管理 ───────────────────────── */}
              <DrawerSection label="賽程 / 日程管理" sub="Sub-events & Schedule">
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {subEvents.map((ev, idx) => (
                    <div key={ev.id} style={{
                      display: "flex", alignItems: "center", gap: "8px",
                      padding: "10px 12px",
                      background: ERP.colors.pageBg,
                      border: `1px solid ${ERP.colors.border}`,
                      borderRadius: ERP.radius.md,
                    }}>
                      {/* Stage number badge */}
                      <div style={{
                        width: "22px", height: "22px", borderRadius: ERP.radius.sm, flexShrink: 0,
                        background: ERP.colors.accentPale, border: `1px solid ${ERP.colors.accentLight}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "10px", fontWeight: 800, color: ERP.colors.accent,
                      }}>
                        {idx + 1}
                      </div>

                      {/* Editable fields */}
                      <div style={{ flex: 1, display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center", minWidth: 0 }}>
                        <input
                          value={ev.label}
                          onChange={e => setSubEvents(prev => prev.map(s => s.id === ev.id ? { ...s, label: e.target.value } : s))}
                          placeholder="階段名"
                          style={{ ...inputStyle, flex: "0 0 68px", padding: "5px 8px", fontSize: "12px" }}
                        />
                        <input
                          value={ev.labelEn}
                          onChange={e => setSubEvents(prev => prev.map(s => s.id === ev.id ? { ...s, labelEn: e.target.value } : s))}
                          placeholder="English name"
                          style={{ ...inputStyle, flex: "1 1 100px", padding: "5px 8px", fontSize: "12px", minWidth: "90px" }}
                        />
                        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                          <Calendar size={12} color={ERP.colors.textMuted} style={{ flexShrink: 0 }} />
                          <input
                            type="date"
                            value={ev.date}
                            onChange={e => setSubEvents(prev => prev.map(s => s.id === ev.id ? { ...s, date: e.target.value } : s))}
                            style={{ ...inputStyle, flex: "0 0 140px", padding: "5px 8px", fontSize: "12px" }}
                          />
                        </div>
                      </div>

                      {/* Per-stage QR button */}
                      <button
                        onClick={() => openQr(ev.label || `第 ${idx + 1} 階段`)}
                        title="啟動此階段 QR 簽到"
                        style={{
                          display: "flex", alignItems: "center", gap: "4px",
                          padding: "4px 9px",
                          border: `1px solid ${ERP.colors.accent}`,
                          borderRadius: ERP.radius.sm,
                          background: ERP.colors.accentPale, color: ERP.colors.accent,
                          cursor: "pointer", fontSize: "10px", fontWeight: 700,
                          fontFamily: ERP.font.family, whiteSpace: "nowrap", flexShrink: 0,
                          transition: "all 0.12s",
                        }}
                      >
                        <QrCode size={11} /> QR
                      </button>

                      {/* Delete stage */}
                      <button
                        onClick={() => setSubEvents(prev => prev.filter(s => s.id !== ev.id))}
                        style={{
                          width: "24px", height: "24px", flexShrink: 0,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          border: `1px solid ${ERP.colors.border}`, borderRadius: ERP.radius.sm,
                          background: "transparent", color: ERP.colors.textMuted,
                          cursor: "pointer",
                        }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}

                  {/* Add stage button */}
                  <button
                    onClick={() => setSubEvents(prev => [...prev, { id: `s${Date.now()}`, label: "", labelEn: "", date: "" }])}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "7px",
                      padding: "9px 12px",
                      border: `1.5px dashed ${ERP.colors.border}`,
                      borderRadius: ERP.radius.md,
                      background: "transparent", color: ERP.colors.textSecondary,
                      cursor: "pointer", fontSize: "12px", fontWeight: 600,
                      fontFamily: ERP.font.family, transition: "all 0.13s",
                    }}
                  >
                    <Plus size={13} color={ERP.colors.accent} />
                    新增階段 Add Stage (+)
                  </button>
                </div>

                {/* Reverse sign-in info note */}
                <div style={{
                  display: "flex", gap: "8px", alignItems: "flex-start",
                  padding: "9px 12px",
                  background: "#FFF7ED", border: "1px solid #FED7AA",
                  borderRadius: ERP.radius.md,
                }}>
                  <span style={{ fontSize: "14px", flexShrink: 0 }}>🔄</span>
                  <p style={{ margin: 0, fontSize: "11px", lineHeight: 1.7, color: "#7C2D12", fontFamily: ERP.font.family }}>
                    <strong>逆向簽到 Reverse Sign-in：</strong>
                    未在名單內的學生掃碼後，系統將自動申請加入本活動，待負責老師批准後正式記錄出席。
                  </p>
                </div>
              </DrawerSection>

              {/* ── Section 3: OCR 文件上傳 ───────────────────────────── */}
              <DrawerSection label="上傳成就證明 / 相關文件" sub="OCR Document Upload">

                {/* Drop zone */}
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => {
                    e.preventDefault(); setDragOver(false);
                    addFiles(Array.from(e.dataTransfer.files));
                  }}
                  style={{
                    border: `2px dashed ${dragOver ? ERP.colors.accent : ERP.colors.border}`,
                    borderRadius: ERP.radius.lg,
                    padding: "24px 16px",
                    textAlign: "center",
                    background: dragOver ? ERP.colors.accentPale : ERP.colors.pageBg,
                    transition: "all 0.18s",
                    cursor: "pointer",
                  }}
                >
                  <div style={{
                    width: "44px", height: "44px", borderRadius: ERP.radius.full,
                    background: dragOver ? ERP.colors.accentPale : "#F1F5F9",
                    border: `1px solid ${dragOver ? ERP.colors.accentLight : ERP.colors.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 12px",
                  }}>
                    <Upload size={20} color={dragOver ? ERP.colors.accent : ERP.colors.textMuted} />
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: dragOver ? ERP.colors.accent : ERP.colors.textPrimary, fontFamily: ERP.font.family, marginBottom: "4px" }}>
                    上傳成就證明 / 相關文件
                  </div>
                  <div style={{ fontSize: "11px", color: ERP.colors.textMuted, fontFamily: ERP.font.family, lineHeight: 1.6, marginBottom: "12px" }}>
                    Drag and drop images or PDFs here to auto-extract student data and awards.<br />
                    支援格式：PDF · JPG · PNG · 最大 20 MB / 檔
                  </div>
                  <label style={{
                    display: "inline-flex", alignItems: "center", gap: "6px",
                    padding: "7px 16px",
                    border: `1px solid ${ERP.colors.border}`, borderRadius: ERP.radius.md,
                    background: ERP.colors.surface, color: ERP.colors.textSecondary,
                    cursor: "pointer", fontSize: "12px", fontWeight: 600,
                    fontFamily: ERP.font.family,
                  }}>
                    <FileUp size={13} /> 選擇檔案 Browse
                    <input
                      type="file" accept=".pdf,.jpg,.jpeg,.png" multiple
                      style={{ display: "none" }}
                      onChange={e => { addFiles(Array.from(e.target.files ?? [])); e.target.value = ""; }}
                    />
                  </label>
                </div>

                {/* Uploaded file list */}
                {uploadedFiles.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {uploadedFiles.map((f, i) => (
                      <div key={i} style={{
                        display: "flex", alignItems: "center", gap: "10px",
                        padding: "9px 12px",
                        background: f.status === "done" ? "#F0FDF4" : f.status === "scanning" ? "#F0F9FF" : "#FEF2F2",
                        border: `1px solid ${f.status === "done" ? "#A7F3D0" : f.status === "scanning" ? "#BAE6FD" : "#FECACA"}`,
                        borderRadius: ERP.radius.md,
                      }}>
                        <span style={{ fontSize: "18px", flexShrink: 0 }}>
                          {f.name.toLowerCase().endsWith(".pdf") ? "📄" : "🖼️"}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "12px", fontWeight: 600, color: ERP.colors.textPrimary, fontFamily: ERP.font.family, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {f.name}
                          </div>
                          <div style={{ fontSize: "10px", color: ERP.colors.textMuted, fontFamily: ERP.font.family, marginTop: "2px" }}>
                            {f.size} ·{" "}
                            {f.status === "scanning" ? (
                              <span style={{ color: "#0369A1" }}>🔄 OCR 分析中…</span>
                            ) : f.status === "done" ? (
                              <span style={{ color: ERP.colors.success }}>✅ OCR 完成 · 資料已萃取至審批佇列</span>
                            ) : (
                              <span style={{ color: ERP.colors.error }}>❌ 處理失敗，請重新上傳</span>
                            )}
                          </div>
                        </div>
                        {f.status === "done" && (
                          <div style={{ display: "flex", alignItems: "center", gap: "3px", padding: "2px 7px", background: "#D1FAE5", border: "1px solid #6EE7B7", borderRadius: ERP.radius.full, fontSize: "9px", fontWeight: 700, color: ERP.colors.success, flexShrink: 0 }}>
                            <Sparkles size={9} /> AI 已萃取
                          </div>
                        )}
                        <button
                          onClick={() => setUploadedFiles(prev => prev.filter((_, j) => j !== i))}
                          style={{ width: "22px", height: "22px", display: "flex", alignItems: "center", justifyContent: "center", border: "none", background: "transparent", color: ERP.colors.textMuted, cursor: "pointer", flexShrink: 0 }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </DrawerSection>

              {/* ── Section 4: 能力加乘與 AI 標籤 ────────────────────── */}
              <DrawerSection label="能力加乘與 AI 標籤" sub="Tender Bindings">

                {/* ACORN multi-select badges */}
                <Field label="ACORN 屬性標籤" hint="M3">
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "2px" }}>
                    {ALL_ACORN_TAGS.map((tag) => {
                      const s = ERP.acornTags[tag];
                      const selected = form.acornTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          onClick={() => toggleAcornTag(tag)}
                          style={{
                            display: "inline-flex", alignItems: "center", gap: "4px",
                            padding: "4px 10px",
                            background: selected ? s.bg : ERP.colors.pageBg,
                            color: selected ? s.color : ERP.colors.textMuted,
                            border: `1.5px solid ${selected ? s.border : ERP.colors.border}`,
                            borderRadius: ERP.radius.full,
                            fontSize: "11px", fontWeight: 700,
                            cursor: "pointer", transition: "all 0.13s",
                            fontFamily: ERP.font.family,
                          }}
                        >
                          {selected && (
                            <span style={{
                              width: "5px", height: "5px", borderRadius: "50%",
                              background: s.color, display: "inline-block", flexShrink: 0,
                            }} />
                          )}
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ fontSize: "10px", color: ERP.colors.textMuted, marginTop: "6px" }}>
                    點擊標籤以選取 / 取消選取。目前已選：{form.acornTags.join("、") || "（無）"}
                  </div>
                </Field>

                {/* ── Weight Allocation Matrix ── */}
                {form.acornTags.length >= 1 && (
                  <Field label="動態權重分配" hint="自動重新平衡">
                    <WeightMatrix
                      tags={form.acornTags}
                      weights={acornWeights}
                      onChange={handleWeightChange}
                    />
                  </Field>
                )}

                {/* Level radio cards */}
                <Field label="成就環境級別" hint="Level">
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    {LEVEL_OPTIONS.map(({ code, label, sub }) => {
                      const active = form.level === code;
                      return (
                        <button
                          key={code}
                          onClick={() => setForm(f => ({ ...f, level: code }))}
                          style={{
                            display: "flex", alignItems: "center", gap: "10px",
                            padding: "10px 12px",
                            border: `1.5px solid ${active ? ERP.colors.accent : ERP.colors.border}`,
                            borderRadius: ERP.radius.md,
                            background: active ? ERP.colors.accentPale : ERP.colors.surface,
                            cursor: "pointer", textAlign: "left",
                            transition: "all 0.13s",
                            fontFamily: ERP.font.family,
                          }}
                        >
                          {/* Radio dot */}
                          <div style={{
                            width: "16px", height: "16px", borderRadius: "50%", flexShrink: 0,
                            border: `2px solid ${active ? ERP.colors.accent : ERP.colors.borderStrong}`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            {active && <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: ERP.colors.accent }} />}
                          </div>
                          <div>
                            <div style={{ fontSize: "12px", fontWeight: 700, color: active ? ERP.colors.accent : ERP.colors.textPrimary }}>
                              {label}
                            </div>
                            <div style={{ fontSize: "10px", color: ERP.colors.textMuted, marginTop: "1px" }}>
                              {sub}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </Field>

                {/* System governance alert — read-only, replaces manual points slider */}
                <div style={{
                  display: "flex", gap: "10px", alignItems: "flex-start",
                  padding: "11px 13px",
                  background: "#F0F9FF",
                  border: "1px solid #BAE6FD",
                  borderRadius: ERP.radius.md,
                }}>
                  <span style={{ fontSize: "14px", flexShrink: 0, lineHeight: 1.4 }}>💡</span>
                  <p style={{
                    margin: 0, fontSize: "11px", lineHeight: 1.7,
                    color: "#0C4A6E", fontFamily: ERP.font.family,
                  }}>
                    系統將根據所選之<strong>環境級別 (Level)</strong>，結合後續分配的學生<strong>協作崗位 (T1–T3)</strong>，由底層引擎自動計算並派發對應之自主積點。
                    <span style={{ display: "block", marginTop: "3px", color: "#0369A1", fontSize: "10px" }}>
                      System auto-calculates reward points based on Level and Roles to prevent inflation.
                    </span>
                  </p>
                </div>
              </DrawerSection>

              {/* ── Section 5: 狀態與名單 ─────────────────────────────── */}
              <DrawerSection label="狀態與名單" sub="Status">

                <Field label="活動狀態">
                  <div style={{ position: "relative" }}>
                    <select
                      value={form.status}
                      onChange={(e) => setForm(f => ({ ...f, status: e.target.value as StatusKey }))}
                      style={{ ...inputStyle, paddingRight: "28px", appearance: "none", cursor: "pointer" }}
                    >
                      {STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                    </select>
                    <ChevronDown size={13} color={ERP.colors.textMuted} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                  </div>
                  {/* Live status preview */}
                  <div style={{ marginTop: "6px" }}>
                    <StatusBadge status={form.status} />
                  </div>
                </Field>

                <Field label="參與名單">
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                    <button
                      onClick={() => setShowParticipants(true)}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: "7px",
                        padding: "8px 16px",
                        border: `1px solid ${ERP.colors.accent}`,
                        borderRadius: ERP.radius.md,
                        background: ERP.colors.accentPale,
                        color: ERP.colors.accent,
                        cursor: "pointer", fontSize: "13px", fontWeight: 600,
                        fontFamily: ERP.font.family,
                        boxShadow: ERP.shadow.xs,
                        transition: "all 0.15s",
                      }}
                    >
                      <Users size={14} color={ERP.colors.accent} />
                      管理名單
                      <span style={{
                        fontSize: "10px", fontWeight: 700,
                        background: ERP.colors.accent, color: "#fff",
                        borderRadius: ERP.radius.full, padding: "1px 7px",
                      }}>
                        {participantIds.size} 人
                      </span>
                    </button>
                  </div>
                </Field>

                {/* QR Sign-in launcher */}
                <Field label="QR 簽到">
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <button
                      onClick={() => openQr(subEvents.length > 0 ? subEvents[0].label || "主活動" : form.nameZh || "主活動")}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                        padding: "12px 18px",
                        border: "none", borderRadius: ERP.radius.md,
                        background: "linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)",
                        color: "#fff",
                        cursor: "pointer", fontSize: "13px", fontWeight: 700,
                        fontFamily: ERP.font.family,
                        boxShadow: "0 4px 14px rgba(124,58,237,0.35)",
                        transition: "all 0.18s",
                        width: "100%",
                      }}
                    >
                      <QrCode size={18} />
                      啟動 QR 簽到 Launch QR Sign-in
                      {subEvents.length > 0 && (
                        <span style={{ fontSize: "10px", fontWeight: 500, opacity: 0.85 }}>
                          · {subEvents.length} 個階段
                        </span>
                      )}
                    </button>

                    {/* Stage selector for multi-stage QR */}
                    {subEvents.length > 1 && (
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        {subEvents.map((ev, idx) => (
                          <button
                            key={ev.id}
                            onClick={() => openQr(ev.label || `第 ${idx + 1} 階段`)}
                            style={{
                              display: "inline-flex", alignItems: "center", gap: "5px",
                              padding: "5px 11px",
                              border: "1px solid #C4B5FD",
                              borderRadius: ERP.radius.full,
                              background: "#F5F3FF", color: "#5B21B6",
                              cursor: "pointer", fontSize: "11px", fontWeight: 600,
                              fontFamily: ERP.font.family,
                              transition: "all 0.12s",
                            }}
                          >
                            <QrCode size={10} />
                            {ev.label || `第 ${idx + 1} 階段`}
                          </button>
                        ))}
                      </div>
                    )}

                    <div style={{ fontSize: "11px", color: ERP.colors.textMuted, fontFamily: ERP.font.family, lineHeight: 1.6 }}>
                      🔄 <strong>逆向簽到：</strong>學生掃碼後自動申請加入名單，無需事先登記。
                    </div>
                  </div>
                </Field>
              </DrawerSection>

              {/* Spacer so last section clears the footer */}
              <div style={{ height: "12px" }} />
            </div>

            {/* Drawer Footer — sticky */}
            <div style={{
              padding: "14px 20px",
              borderTop: `1px solid ${ERP.colors.border}`,
              background: ERP.colors.surface,
              display: "flex", gap: "10px", alignItems: "center",
              flexShrink: 0,
            }}>
              <button
                onClick={() => setEditingId(null)}
                style={{
                  flex: 1,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "7px",
                  padding: "10px 0",
                  border: "none", borderRadius: ERP.radius.md,
                  background: ERP.colors.accent, color: "#fff",
                  cursor: "pointer", fontSize: "13px", fontWeight: 700,
                  fontFamily: ERP.font.family,
                  boxShadow: `0 2px 8px ${ERP.colors.accent}40`,
                }}
              >
                <Save size={14} />
                儲存變更
              </button>
              <button
                onClick={() => setEditingId(null)}
                style={{
                  padding: "10px 18px",
                  border: `1px solid ${ERP.colors.border}`,
                  borderRadius: ERP.radius.md,
                  background: "transparent", color: ERP.colors.textSecondary,
                  cursor: "pointer", fontSize: "13px", fontWeight: 600,
                  fontFamily: ERP.font.family,
                }}
              >
                取消
              </button>
            </div>
          </>
        )}
      </div>
    </div>

    {/* ── QR Sign-in Modal ─────────────────────────────────────────── */}
    {qrActive && (
      <>
        {/* Backdrop */}
        <div
          onClick={() => setQrActive(false)}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.65)",
            zIndex: 700,
          }}
        />

        {/* Modal card */}
        <div style={{
          position: "fixed",
          top: "50%", left: "50%",
          transform: "translate(-50%,-50%)",
          width: "min(440px, 92vw)",
          background: "#fff",
          borderRadius: "20px",
          boxShadow: "0 24px 60px rgba(0,0,0,0.3)",
          zIndex: 710,
          overflow: "hidden",
        }}>
          {/* Purple header */}
          <div style={{
            background: "linear-gradient(135deg, #7C3AED 0%, #4C1D95 100%)",
            padding: "20px 24px 18px",
            display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "9px", marginBottom: "4px" }}>
                <QrCode size={20} color="#fff" />
                <span style={{ fontSize: "17px", fontWeight: 800, color: "#fff", fontFamily: ERP.font.family }}>
                  QR 簽到啟動中
                </span>
                <span style={{ fontSize: "10px", fontWeight: 600, color: "#C4B5FD", background: "rgba(255,255,255,0.15)", padding: "2px 8px", borderRadius: "999px" }}>
                  LIVE
                </span>
              </div>
              <div style={{ fontSize: "12px", color: "#DDD6FE", fontFamily: ERP.font.family }}>
                {qrStageLabel} · 請將此 QR code 投影給學生掃描
              </div>
            </div>
            <button
              onClick={() => setQrActive(false)}
              style={{
                width: "28px", height: "28px", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "rgba(255,255,255,0.15)", border: "none",
                borderRadius: "50%", color: "#fff", cursor: "pointer",
              }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: "24px", display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" }}>

            {/* Simulated QR code grid */}
            <div style={{
              width: "200px", height: "200px",
              border: "4px solid #1E1B4B",
              borderRadius: "12px",
              padding: "12px",
              background: "#fff",
              position: "relative",
              boxShadow: "0 8px 24px rgba(124,58,237,0.18)",
            }}>
              {/* Finder pattern corners */}
              {[
                { top: 0, left: 0 },
                { top: 0, right: 0 },
                { bottom: 0, left: 0 },
              ].map((pos, i) => (
                <div key={i} style={{
                  position: "absolute",
                  width: "44px", height: "44px",
                  ...pos,
                  border: "6px solid #1E1B4B",
                  borderRadius: "6px",
                }}>
                  <div style={{ position: "absolute", inset: "6px", background: "#1E1B4B", borderRadius: "2px" }} />
                </div>
              ))}

              {/* Simulated data modules — pseudo-random grid */}
              <div style={{
                position: "absolute",
                top: "16px", left: "16px", right: "16px", bottom: "16px",
                display: "grid",
                gridTemplateColumns: "repeat(13, 1fr)",
                gridTemplateRows: "repeat(13, 1fr)",
                gap: "1px",
              }}>
                {Array.from({ length: 169 }).map((_, k) => {
                  const col = k % 13, row = Math.floor(k / 13);
                  const inFinder = (col < 4 && row < 4) || (col > 8 && row < 4) || (col < 4 && row > 8);
                  const on = !inFinder && ((k * 1103515245 + 12345) & 0x1) === 0;
                  return (
                    <div key={k} style={{
                      background: on ? "#1E1B4B" : "transparent",
                      borderRadius: "1px",
                    }} />
                  );
                })}
              </div>

              {/* Centre logo overlay */}
              <div style={{
                position: "absolute",
                top: "50%", left: "50%",
                transform: "translate(-50%,-50%)",
                width: "36px", height: "36px",
                background: "#7C3AED", borderRadius: "8px",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 2px 8px rgba(124,58,237,0.5)",
              }}>
                <QrCode size={18} color="#fff" />
              </div>
            </div>

            {/* Stage label */}
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "16px", fontWeight: 800, color: "#1E1B4B", fontFamily: ERP.font.family }}>
                {qrStageLabel}
              </div>
              <div style={{ fontSize: "12px", color: ERP.colors.textMuted, fontFamily: ERP.font.family, marginTop: "3px" }}>
                使用學校 App 掃描上方 QR Code 即可簽到
              </div>
            </div>

            {/* Reverse sign-in info box */}
            <div style={{
              width: "100%",
              background: "#F5F3FF", border: "1px solid #C4B5FD",
              borderRadius: "12px", padding: "14px 16px",
              display: "flex", gap: "12px", alignItems: "flex-start",
            }}>
              <span style={{ fontSize: "22px", flexShrink: 0 }}>🔄</span>
              <div>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#4C1D95", fontFamily: ERP.font.family, marginBottom: "4px" }}>
                  逆向簽到 Reverse Sign-in 已啟用
                </div>
                <div style={{ fontSize: "11px", color: "#6D28D9", fontFamily: ERP.font.family, lineHeight: 1.7 }}>
                  不在名單上的學生掃碼後，系統會自動產生「加入申請」。
                  負責老師批准後即正式計入出席紀錄，無需手動新增。
                </div>
              </div>
            </div>

            {/* Action row */}
            <div style={{ display: "flex", gap: "10px", width: "100%" }}>
              <button
                onClick={() => setQrActive(false)}
                style={{
                  flex: 1, padding: "11px",
                  border: `1px solid ${ERP.colors.border}`, borderRadius: "10px",
                  background: "transparent", color: ERP.colors.textSecondary,
                  cursor: "pointer", fontSize: "13px", fontWeight: 600,
                  fontFamily: ERP.font.family,
                }}
              >
                關閉 Close
              </button>
              <button
                style={{
                  flex: 2, padding: "11px",
                  border: "none", borderRadius: "10px",
                  background: "linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)", color: "#fff",
                  cursor: "pointer", fontSize: "13px", fontWeight: 700,
                  fontFamily: ERP.font.family,
                  boxShadow: "0 4px 14px rgba(124,58,237,0.35)",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                }}
              >
                <QrCode size={15} /> 全螢幕顯示 Fullscreen
              </button>
            </div>
          </div>
        </div>
      </>
    )}
    </>
  );
};
