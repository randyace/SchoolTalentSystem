// ─────────────────────────────────────────────────────────────────────────────
// Frame 3.0 — 全校活動總表
// Edit / Create navigate to dedicated full-page routes (no offcanvas).
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
  academic_year?: string;
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
    category: "比賽", pic: "陳 Sir", linkedClasses: ["F3"],
    acornTags: ["認知", "創意"], status: "active", startDate: "2026-08-05", participants: 24,
  },
  {
    id: "ACT-002", name: "班際足球聯賽", nameEn: "Inter-Class Football League",
    category: "體育", pic: "林 Sir", linkedClasses: ["F1", "F2", "F3"],
    acornTags: ["體適能", "協作"], status: "active", startDate: "2026-07-20", participants: 72,
  },
  {
    id: "ACT-003", name: "中文詩詞朗誦比賽", nameEn: "Chinese Poetry Recitation",
    category: "文藝", pic: "王老師", linkedClasses: ["F2"],
    acornTags: ["認知", "社群"], status: "planning", startDate: "2026-09-12", participants: 32,
  },
  {
    id: "ACT-004", name: "數學思維挑戰賽", nameEn: "Math Thinking Challenge",
    category: "學術", pic: "黃 Sir", linkedClasses: ["F4", "F5"],
    acornTags: ["認知"], status: "active", startDate: "2026-08-01", participants: 45,
  },
  {
    id: "ACT-005", name: "義工服務日", nameEn: "Volunteer Service Day",
    category: "服務", pic: "李老師", linkedClasses: ["All"],
    acornTags: ["社群", "協作", "領導"], status: "planning", startDate: "2026-10-03", participants: 420,
  },
  {
    id: "ACT-006", name: "英語戲劇表演", nameEn: "English Drama Performance",
    category: "文藝", pic: "Taylor T.", linkedClasses: ["F5", "F6"],
    acornTags: ["創意", "社群"], status: "completed", startDate: "2026-06-15", participants: 28,
  },
  {
    id: "ACT-007", name: "STEM 機械人工作坊", nameEn: "STEM Robotics Workshop",
    category: "學術", pic: "陳 Sir", linkedClasses: ["F3"],
    acornTags: ["創意", "認知"], status: "active", startDate: "2026-08-10", participants: 18,
  },
  {
    id: "ACT-008", name: "校際音樂節", nameEn: "Inter-school Music Festival",
    category: "文藝", pic: "何老師", linkedClasses: ["F1", "F2"],
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
export const Frame03_ActivityTable: React.FC<{
  activities?: Activity[];
  createUrl?: string;
  editUrlBase?: string;
}> = ({
  activities,
  createUrl = "/activities/create",
  editUrlBase = "/activities/edit",
}) => {
  const catalog = activities !== undefined ? activities : ACTIVITIES;

  const [search, setSearch]                   = useState("");
  const [year, setYear]                       = useState(YEARS[0]);
  const [category, setCategory]               = useState(CATEGORIES[0]);
  const [page, setPage]                       = useState(1);
  const [selectedIds, setSelectedIds]         = useState<Set<string>>(new Set());
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

  const filtered = catalog.filter((a) => {
    if (search && !a.name.includes(search) && !a.nameEn.toLowerCase().includes(search.toLowerCase())) return false;
    if (category !== CATEGORIES[0] && a.category !== category) return false;
    if (a.academic_year && a.academic_year !== year) return false;
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

  const goEdit = (act: Activity) => {
    window.location.href = `${editUrlBase}/${act.id}`;
  };

  const goCreate = () => {
    window.location.href = createUrl;
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
    active:    catalog.filter(a => a.status === "active").length,
    planning:  catalog.filter(a => a.status === "planning").length,
    completed: catalog.filter(a => a.status === "completed").length,
    paused:    catalog.filter(a => a.status === "paused").length,
  };

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
                {catalog.length} 個活動
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
              onClick={goCreate}
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
                const isEditing  = false;
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
                          onClick={() => goEdit(act)}
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
                  <TH width="14%">連結級別</TH>
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
                  const isEditing  = false;
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
                            onClick={() => goEdit(act)}
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
    </div>
    </>
  );
};
