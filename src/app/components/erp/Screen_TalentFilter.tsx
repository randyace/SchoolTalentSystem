// ─────────────────────────────────────────────────────────────────────────────
// Screen_TalentFilter.tsx
// 人才篩選與匯出 — Talent Pool & Filtering
// ERP Module 1.D.5  ·  Activities & Talent
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useMemo, useCallback } from "react";
import * as XLSX from "xlsx";
import { ERP } from "./erpTokens";
import {
  Search, ChevronDown, FileSpreadsheet,
  X, Check, ExternalLink,
  ChevronUp, Users, Sparkles,
  Trophy, BookOpen, Palette, Heart, Cpu, Star,
  Filter, ArrowUpDown, Loader2,
} from "lucide-react";

// ── Tokens ─────────────────────────────────────────────────────────────────────
const T = {
  bg:      "#F8FAFC",
  surface: "#FFFFFF",
  border:  "#E2E8F0",
  borderStrong: "#CBD5E1",
  text1:   "#0F172A",
  text2:   "#334155",
  text3:   "#64748B",
  text4:   "#94A3B8",
  blue:    "#2563EB",  bluePale: "#EFF6FF",  blueBd: "#BFDBFE",
  emerald: "#059669",  emeraldPale: "#ECFDF5", emeraldBd: "#6EE7B7",
  purple:  "#7C3AED",  purplePale: "#F5F3FF",  purpleBd: "#C4B5FD",
  amber:   "#D97706",  amberPale: "#FFFBEB",   amberBd: "#FDE68A",
  cyan:    "#0891B2",  cyanPale: "#F0FDFA",    cyanBd: "#67E8F9",
  red:     "#DC2626",  redPale: "#FEF2F2",     redBd: "#FECACA",
  shadow:  "0 1px 3px rgba(15,23,42,0.08)",
  shadowMd:"0 4px 12px rgba(15,23,42,0.10)",
  radius:  "8px",
  radiusLg:"12px",
  font:    ERP.font.family,
  mono:    ERP.font.mono,
};

// ── Category definitions ────────────────────────────────────────────────────────
type CatKey = "sports" | "academic" | "arts" | "service" | "stem" | "leadership";

const CATS: Record<CatKey, { label: string; labelEn: string; icon: React.ReactNode; color: string; bg: string; bd: string }> = {
  sports:     { label: "體育",   labelEn: "Sports",     icon: <Trophy size={10} />,    color: T.blue,    bg: T.bluePale,    bd: T.blueBd },
  academic:   { label: "學術",   labelEn: "Academic",   icon: <BookOpen size={10} />,  color: T.emerald, bg: T.emeraldPale, bd: T.emeraldBd },
  arts:       { label: "藝術",   labelEn: "Arts",        icon: <Palette size={10} />,   color: T.purple,  bg: T.purplePale,  bd: T.purpleBd },
  service:    { label: "服務",   labelEn: "Service",     icon: <Heart size={10} />,     color: T.amber,   bg: T.amberPale,   bd: T.amberBd },
  stem:       { label: "STEM",   labelEn: "STEM",        icon: <Cpu size={10} />,       color: T.cyan,    bg: T.cyanPale,    bd: T.cyanBd },
  leadership: { label: "領導",   labelEn: "Leadership",  icon: <Star size={10} />,      color: T.red,     bg: T.redPale,     bd: T.redBd },
};

const CAT_KEYS = Object.keys(CATS) as CatKey[];

/** API Chinese acorn tag → UI CatKey */
const TAG_ZH_TO_KEY: Record<string, CatKey> = {
  體育: "sports",
  學術: "academic",
  藝術: "arts",
  服務: "service",
  STEM: "stem",
  領導: "leadership",
};

const yearUiToApi = (y: string) => y.replace("-", "/");

// ── Student data ────────────────────────────────────────────────────────────────
interface TalentStudent {
  id: string;
  nameZh: string;
  nameEn: string;
  class: string;
  cats: CatKey[];
  acornTagsZh: string[];
  activityCount: number;
  pts: number;
  latestActivity: string;
  yearJoined: string;
}

interface TalentPoolApiRow {
  id: number | string;
  name_zh?: string;
  name_en?: string;
  class_code?: string;
  acorn_tags?: string[];
  activity_count?: number;
  total_points?: number;
  latest_activity?: string;
  academic_year?: string;
}

function mapApiStudent(row: TalentPoolApiRow): TalentStudent {
  const tagsZh = Array.isArray(row.acorn_tags) ? row.acorn_tags : [];
  const cats = tagsZh
    .map((t) => TAG_ZH_TO_KEY[t])
    .filter((k): k is CatKey => Boolean(k));
  const yearRaw = String(row.academic_year || "").replace("/", "-");
  return {
    id: String(row.id),
    nameZh: String(row.name_zh || ""),
    nameEn: String(row.name_en || ""),
    class: String(row.class_code || "—"),
    cats,
    acornTagsZh: tagsZh,
    activityCount: Number(row.activity_count || 0),
    pts: Number(row.total_points || 0),
    latestActivity: String(row.latest_activity || "—"),
    yearJoined: yearRaw || "",
  };
}

// ── Class color palette ─────────────────────────────────────────────────────────
const CLS_PAL: Record<string, { bg: string; color: string; bd: string }> = {
  F1A: { bg: "#DBEAFE", color: "#1D4ED8", bd: "#BFDBFE" },
  F1B: { bg: "#E0E7FF", color: "#4338CA", bd: "#C7D2FE" },
  F2A: { bg: "#D1FAE5", color: "#065F46", bd: "#6EE7B7" },
  F2B: { bg: "#FCE7F3", color: "#9D174D", bd: "#FBCFE8" },
  F3A: { bg: "#FFEDD5", color: "#9A3412", bd: "#FED7AA" },
  F3B: { bg: "#FEF3C7", color: "#92400E", bd: "#FDE68A" },
  F4A: { bg: "#CFFAFE", color: "#164E63", bd: "#67E8F9" },
  F4B: { bg: "#E0E7FF", color: "#312E81", bd: "#A5B4FC" },
  F5A: { bg: "#F0FDF4", color: "#14532D", bd: "#86EFAC" },
  F5B: { bg: "#FDF4FF", color: "#581C87", bd: "#E9D5FF" },
};

const YEAR_OPTIONS = ["2025-26", "2024-25", "2023-24"];

// ── Category tag pill ───────────────────────────────────────────────────────────
const CatTag: React.FC<{ cat: CatKey; size?: "sm" | "md" }> = ({ cat, size = "sm" }) => {
  const c = CATS[cat];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: size === "sm" ? 3 : 4,
      padding: size === "sm" ? "2px 7px" : "3px 9px",
      background: c.bg, border: `1px solid ${c.bd}`,
      borderRadius: 999, fontSize: size === "sm" ? 10 : 11,
      fontWeight: 700, color: c.color, whiteSpace: "nowrap",
      fontFamily: T.font,
    }}>
      {c.icon}
      {c.label}
    </span>
  );
};

// ── All-rounder indicator ───────────────────────────────────────────────────────
const BreadthBar: React.FC<{ cats: CatKey[] }> = ({ cats }) => (
  <div style={{ display: "flex", gap: 2, alignItems: "center" }} title={`${cats.length} 個類別 categories`}>
    {CAT_KEYS.map(k => (
      <div key={k} style={{ width: 6, height: 6, borderRadius: "50%", background: cats.includes(k) ? CATS[k].color : T.border, flexShrink: 0, transition: "background 0.12s" }} />
    ))}
  </div>
);

// ── Export button (SheetJS) ─────────────────────────────────────────────────────
const ExportButton: React.FC<{ onExport: () => void; disabled?: boolean }> = ({ onExport, disabled }) => {
  const [exported, setExported] = useState(false);

  const handleClick = () => {
    if (disabled) return;
    onExport();
    setExported(true);
    setTimeout(() => setExported(false), 2800);
  };

  return (
    <div style={{ position: "relative" }}>
      {exported && (
        <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, background: "#0F172A", color: "#fff", fontSize: 11, fontWeight: 600, padding: "7px 14px", borderRadius: T.radius, whiteSpace: "nowrap", zIndex: 300, boxShadow: T.shadowMd, display: "flex", alignItems: "center", gap: 6 }}>
          <Check size={12} color="#4ADE80" /> Excel 匯出完成
        </div>
      )}

      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        title="⬇️ 匯出 Excel"
        style={{
          display: "flex", alignItems: "center", gap: 7,
          padding: "8px 16px",
          background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
          border: "none", borderRadius: T.radius,
          color: "#fff", fontSize: 13, fontWeight: 700,
          cursor: disabled ? "not-allowed" : "pointer", fontFamily: T.font,
          boxShadow: "0 2px 8px rgba(5,150,105,0.35)",
          transition: "all 0.12s",
          opacity: disabled ? 0.55 : 1,
        }}
      >
        <FileSpreadsheet size={15} />
        ⬇️ 匯出 Excel
      </button>
    </div>
  );
};

// ── Main component ──────────────────────────────────────────────────────────────
export interface ScreenTalentFilterProps {
  studentsUrl?: string;
}

export const Screen_TalentFilter: React.FC<ScreenTalentFilterProps> = ({
  studentsUrl = "/api/talent-pool/students",
}) => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Filters
  const [yearFilter, setYearFilter]           = useState<string>("2025-26");
  const [yearOpen, setYearOpen]               = useState(false);
  const [activeCategories, setActiveCategories] = useState<CatKey[]>([]);
  const [filterLogic, setFilterLogic]         = useState<"OR" | "AND">("OR");
  const [search, setSearch]                   = useState("");
  const [minPoints, setMinPoints]             = useState(0);
  const [sortCol, setSortCol]                 = useState<"name" | "pts" | "count" | "breadth">("pts");
  const [sortAsc, setSortAsc]                 = useState(false);

  // Live data — selection starts empty (no mock pre-seed)
  const [students, setStudents]         = useState<TalentStudent[]>([]);
  const [loading, setLoading]           = useState(true);
  const [loadError, setLoadError]       = useState<string | null>(null);
  const [selectedIds, setSelectedIds]   = useState<Set<string>>(new Set());

  const toggleCat = (k: CatKey) => setActiveCategories(prev =>
    prev.includes(k) ? prev.filter(c => c !== k) : [...prev, k]
  );

  // Fetch talent pool when academic year changes
  useEffect(() => {
    let cancelled = false;
    const ctrl = new AbortController();

    (async () => {
      setLoading(true);
      setLoadError(null);
      setSelectedIds(new Set());
      try {
        const url = new URL(studentsUrl, window.location.origin);
        url.searchParams.set("academic_year", yearUiToApi(yearFilter));
        const res = await fetch(url.toString(), {
          headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
          credentials: "same-origin",
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (cancelled) return;
        if (json?.status === "error") {
          throw new Error(String(json.message || "載入失敗"));
        }
        const rows: TalentPoolApiRow[] = Array.isArray(json?.data) ? json.data : [];
        setStudents(rows.map(mapApiStudent));
      } catch (err) {
        if (cancelled || (err as Error)?.name === "AbortError") return;
        setStudents([]);
        setLoadError(err instanceof Error ? err.message : "無法載入人才名單");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      ctrl.abort();
    };
  }, [studentsUrl, yearFilter]);

  // Client-side: category (OR/AND), search, min points + sort
  const filteredStudents = useMemo(() => {
    const searchQuery = search.trim();
    let list = students.filter(student => {
      const matchSearch = !searchQuery ||
        student.nameZh.includes(searchQuery) ||
        student.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.class.toLowerCase().includes(searchQuery.toLowerCase());

      const matchPoints = student.pts >= minPoints;

      let matchCategory = true;
      if (activeCategories.length > 0) {
        if (filterLogic === "OR") {
          matchCategory = activeCategories.some(tag => student.cats.includes(tag));
        } else {
          matchCategory = activeCategories.every(tag => student.cats.includes(tag));
        }
      }

      return matchSearch && matchPoints && matchCategory;
    });

    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortCol === "pts")     cmp = a.pts - b.pts;
      if (sortCol === "count")   cmp = a.activityCount - b.activityCount;
      if (sortCol === "breadth") cmp = a.cats.length - b.cats.length;
      if (sortCol === "name")    cmp = a.nameZh.localeCompare(b.nameZh, "zh");
      return sortAsc ? cmp : -cmp;
    });

    return list;
  }, [students, search, minPoints, activeCategories, filterLogic, sortCol, sortAsc]);

  const filtered = filteredStudents;
  const selectedRowKeys = useMemo(() => Array.from(selectedIds), [selectedIds]);

  const activeCategory = useMemo(() => {
    if (activeCategories.length === 0) return "全部";
    const tags = activeCategories.map(k => CATS[k].label).join("+");
    return activeCategories.length > 1 ? `${tags}_${filterLogic}` : tags;
  }, [activeCategories, filterLogic]);

  const handleExportExcel = useCallback(() => {
    const dataToExport = selectedRowKeys.length > 0
      ? filteredStudents.filter(s => selectedRowKeys.includes(s.id))
      : filteredStudents;

    if (dataToExport.length === 0) {
      alert("沒有可匯出的資料");
      return;
    }

    const excelData = dataToExport.map((student, index) => ({
      排名: index + 1,
      班別: student.class,
      中文姓名: student.nameZh,
      英文姓名: student.nameEn,
      參與類別: (student.acornTagsZh.length
        ? student.acornTagsZh
        : student.cats.map(c => CATS[c].label)
      ).join(", "),
      活動總數: student.activityCount,
      總積分: student.pts,
      最近活動: student.latestActivity,
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "學生人才庫");

    const today = new Date().toISOString().split("T")[0];
    XLSX.writeFile(workbook, `STS_人才匯出_${activeCategory}_${today}.xlsx`);
  }, [selectedRowKeys, filteredStudents, activeCategory]);

  const allSelected   = filtered.length > 0 && filtered.every(s => selectedIds.has(s.id));
  const someSelected  = !allSelected && filtered.some(s => selectedIds.has(s.id));

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(prev => { const n = new Set(prev); filtered.forEach(s => n.delete(s.id)); return n; });
    } else {
      setSelectedIds(prev => { const n = new Set(prev); filtered.forEach(s => n.add(s.id)); return n; });
    }
  };

  const handleSort = (col: typeof sortCol) => {
    if (sortCol === col) setSortAsc(v => !v);
    else { setSortCol(col); setSortAsc(false); }
  };

  // Summary echoes ONLY user-selected categories (not all tags in the result set)
  const activeCatCounts = useMemo(() =>
    activeCategories.map(k => ({
      key: k,
      count: filteredStudents.filter(s => s.cats.includes(k)).length,
    })),
  [activeCategories, filteredStudents]);

  const F = T.font;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: isMobile ? "auto" : "100%", minHeight: isMobile ? "100%" : undefined, background: T.bg, fontFamily: F, overflow: isMobile ? "visible" : "hidden" }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* ══════════════════════════════════════════════════════════════════
          PAGE HEADER
      ══════════════════════════════════════════════════════════════════ */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: `0 ${isMobile ? "16px" : "24px"}`, flexShrink: 0 }}>
        <div style={{ minHeight: 56, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", paddingTop: isMobile ? 8 : 0, paddingBottom: isMobile ? 8 : 0 }}>
          {/* Icon + title */}
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg, #2563EB, #7C3AED)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Users size={17} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: T.text1, letterSpacing: "-0.3px" }}>人才篩選與匯出</div>
            {!isMobile && <div style={{ fontSize: 11, color: T.text3 }}>Talent Pool & Filtering · {filtered.length} 名學生</div>}
          </div>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Export button */}
          <ExportButton onExport={handleExportExcel} disabled={loading || filtered.length === 0} />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          FILTER BAR
      ══════════════════════════════════════════════════════════════════ */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: `10px ${isMobile ? "16px" : "24px"}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>

          {/* Search */}
          <div style={{ position: "relative", flex: isMobile ? "1 1 100%" : "0 0 200px" }}>
            <Search size={13} color={T.text4} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="搜尋學生姓名或班別…"
              style={{ width: "100%", boxSizing: "border-box", paddingLeft: 32, paddingRight: search ? 28 : 10, paddingTop: 7, paddingBottom: 7, border: `1px solid ${T.border}`, borderRadius: T.radius, fontSize: 12.5, fontFamily: F, color: T.text1, background: T.bg, outline: "none" }}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                <X size={12} color={T.text4} />
              </button>
            )}
          </div>

          {/* Academic year dropdown */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <button onClick={() => setYearOpen(v => !v)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 12px", border: `1px solid ${T.border}`, borderRadius: T.radius, background: T.surface, color: T.text2, fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: F, whiteSpace: "nowrap" }}>
              <span style={{ fontSize: 10, color: T.text4, fontWeight: 400 }}>學年</span>
              {yearFilter}
              <ChevronDown size={13} color={T.text4} style={{ transition: "transform 0.15s", transform: yearOpen ? "rotate(180deg)" : "none" }} />
            </button>
            {yearOpen && (
              <>
                <div onClick={() => setYearOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 100 }} />
                <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radiusLg, boxShadow: T.shadowMd, zIndex: 150, overflow: "hidden", minWidth: 140 }}>
                  {YEAR_OPTIONS.map(y => (
                    <button key={y} onClick={() => { setYearFilter(y); setYearOpen(false); }} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 14px", border: "none", borderBottom: `1px solid ${T.border}`, background: y === yearFilter ? T.bluePale : "transparent", color: y === yearFilter ? T.blue : T.text2, fontSize: 12.5, fontWeight: y === yearFilter ? 700 : 400, cursor: "pointer", fontFamily: F }}>
                      {y}
                      {y === yearFilter && <Check size={12} color={T.blue} />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Min points */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <span style={{ fontSize: 10.5, color: T.text4, fontWeight: 600, whiteSpace: "nowrap" }}>最低積點</span>
            <input
              type="number"
              min={0}
              step={10}
              value={minPoints}
              onChange={e => setMinPoints(Math.max(0, Number(e.target.value) || 0))}
              style={{ width: 64, padding: "6px 8px", border: `1px solid ${T.border}`, borderRadius: T.radius, fontSize: 12.5, fontFamily: F, color: T.text1, background: T.bg, outline: "none" }}
            />
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 24, background: T.border, flexShrink: 0 }} />

          {/* Category toggle chips + AND/OR logic */}
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 10.5, color: T.text4, fontWeight: 600, whiteSpace: "nowrap" }}>類別篩選：</span>

            {/* AND/OR segmented control (empty activeCategories = All) */}
            <div
              role="group"
              aria-label="類別邏輯"
              style={{
                display: "inline-flex", alignItems: "stretch",
                border: `1px solid ${T.border}`, borderRadius: 999,
                overflow: "hidden", background: T.bg, flexShrink: 0,
                boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
                opacity: activeCategories.length < 2 ? 0.55 : 1,
              }}
              title={activeCategories.length < 2 ? "選取兩個或以上類別後，AND/OR 才會生效" : undefined}
            >
              {([
                { id: "OR" as const, label: "滿足任一 (OR)" },
                { id: "AND" as const, label: "滿足全部 (AND)" },
              ]).map((opt, i) => {
                const on = filterLogic === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setFilterLogic(opt.id)}
                    style={{
                      padding: "4px 11px",
                      border: "none",
                      borderLeft: i > 0 ? `1px solid ${T.border}` : "none",
                      background: on ? T.blue : "transparent",
                      color: on ? "#fff" : T.text3,
                      fontSize: 10.5, fontWeight: on ? 700 : 500,
                      cursor: "pointer", fontFamily: F, whiteSpace: "nowrap",
                      transition: "all 0.12s",
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            <div style={{ width: 1, height: 18, background: T.border, flexShrink: 0, margin: "0 2px" }} />

            {CAT_KEYS.map(k => {
              const c = CATS[k];
              const active = activeCategories.includes(k);
              return (
                <button
                  key={k}
                  onClick={() => toggleCat(k)}
                  style={{
                    display: "flex", alignItems: "center", gap: 4,
                    padding: "4px 10px", borderRadius: 999,
                    border: `1.5px solid ${active ? c.color : T.border}`,
                    background: active ? c.bg : "transparent",
                    color: active ? c.color : T.text3,
                    fontSize: 11, fontWeight: active ? 700 : 400,
                    cursor: "pointer", fontFamily: F, transition: "all 0.12s",
                    whiteSpace: "nowrap",
                  }}
                >
                  {c.icon}
                  {c.label}
                  {active && <X size={9} style={{ marginLeft: 1 }} />}
                </button>
              );
            })}
          </div>

          {/* Active filter count badge */}
          {activeCategories.length > 0 && (
            <button onClick={() => setActiveCategories([])} style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 999, border: `1px solid ${T.borderStrong}`, background: T.bg, color: T.text3, fontSize: 10.5, fontWeight: 600, cursor: "pointer", fontFamily: F, whiteSpace: "nowrap" }}>
              <X size={10} /> 清除 {activeCategories.length} 個篩選
            </button>
          )}
        </div>

        {/* Filter confirmation summary — subdued; only echoes activeCategories */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
          marginTop: 8, padding: "7px 10px",
          background: T.bg, borderRadius: T.radius,
          border: `1px solid ${T.border}`,
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: T.text3, whiteSpace: "nowrap" }}>
            顯示 {filteredStudents.length} 人
            {activeCategories.length > 0 && (
              <span style={{ fontWeight: 500, color: T.text4, marginLeft: 4 }}>
                （{filterLogic === "AND" ? "需滿足全部選取類別" : "需滿足任一選取類別"}）
              </span>
            )}
          </span>

          {activeCategories.length === 0 ? (
            <span style={{ fontSize: 10.5, color: T.text4 }}>顯示全部類別</span>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
              <span style={{ fontSize: 10.5, color: T.text4, whiteSpace: "nowrap" }}>已套用篩選結果分佈：</span>
              {activeCatCounts.map(({ key: k, count }) => {
                const c = CATS[k];
                return (
                  <span
                    key={k}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      padding: "2px 8px", borderRadius: 999,
                      background: c.bg, border: `1px solid ${c.bd}`,
                      fontSize: 10, fontWeight: 700, color: c.color,
                    }}
                  >
                    {c.icon} {c.label} {count}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          TABLE
      ══════════════════════════════════════════════════════════════════ */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: isMobile ? 600 : undefined }}>

          {/* Table head */}
          <thead>
            <tr style={{ background: "#F8FAFC", borderBottom: `2px solid ${T.border}`, position: "sticky", top: 0, zIndex: 10 }}>
              {/* Checkbox — Select All (with indeterminate state) */}
              <th style={{ width: 44, padding: "10px 16px", textAlign: "center" }}>
                <div
                  onClick={toggleAll}
                  title={allSelected ? "取消全選 Deselect All" : "全選 Select All"}
                  style={{
                    width: 18, height: 18, borderRadius: 4,
                    border: `2px solid ${allSelected || someSelected ? T.blue : "#94A3B8"}`,
                    background: allSelected ? T.blue : someSelected ? T.blue : "#FFFFFF",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", margin: "0 auto", transition: "all 0.12s",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                  }}
                >
                  {allSelected && <Check size={11} color="#fff" strokeWidth={3} />}
                  {someSelected && <div style={{ width: 8, height: 2, background: "#fff", borderRadius: 1 }} />}
                </div>
              </th>

              {/* No. */}
              <th style={{ width: 36, padding: "10px 4px", textAlign: "center", fontSize: 10, color: T.text4, fontWeight: 700 }}>#</th>

              {/* Student */}
              <th style={{ padding: "10px 12px", textAlign: "left", minWidth: 160 }}>
                <button onClick={() => handleSort("name")} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", fontSize: 11, fontWeight: 700, color: sortCol === "name" ? T.blue : T.text3, fontFamily: F }}>
                  學生 Student
                  {sortCol === "name" ? (sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : <ArrowUpDown size={11} color={T.text4} />}
                </button>
              </th>

              {/* Category tags */}
              <th style={{ padding: "10px 12px", textAlign: "left", minWidth: 240 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: T.text3 }}>類別標籤 Tags</span>
              </th>

              {/* Breadth */}
              <th style={{ padding: "10px 12px", textAlign: "center", width: 100 }}>
                <button onClick={() => handleSort("breadth")} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", fontSize: 11, fontWeight: 700, color: sortCol === "breadth" ? T.blue : T.text3, fontFamily: F, margin: "0 auto" }}>
                  廣度
                  {sortCol === "breadth" ? (sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : <ArrowUpDown size={11} color={T.text4} />}
                </button>
              </th>

              {/* Activity count */}
              <th style={{ padding: "10px 12px", textAlign: "center", width: 80 }}>
                <button onClick={() => handleSort("count")} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", fontSize: 11, fontWeight: 700, color: sortCol === "count" ? T.blue : T.text3, fontFamily: F, margin: "0 auto" }}>
                  活動
                  {sortCol === "count" ? (sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : <ArrowUpDown size={11} color={T.text4} />}
                </button>
              </th>

              {/* Points */}
              <th style={{ padding: "10px 12px", textAlign: "center", width: 80 }}>
                <button onClick={() => handleSort("pts")} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", fontSize: 11, fontWeight: 700, color: sortCol === "pts" ? T.blue : T.text3, fontFamily: F, margin: "0 auto" }}>
                  積點
                  {sortCol === "pts" ? (sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : <ArrowUpDown size={11} color={T.text4} />}
                </button>
              </th>

              {/* Latest activity */}
              {!isMobile && (
                <th style={{ padding: "10px 12px", textAlign: "left", minWidth: 180 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: T.text3 }}>最近活動</span>
                </th>
              )}

              {/* Action */}
              <th style={{ padding: "10px 16px", width: 60 }} />
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} style={{ padding: "64px 0", textAlign: "center", color: T.text4, fontSize: 13, fontFamily: F }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                    <Loader2 size={28} color={T.blue} style={{ animation: "spin 0.8s linear infinite" }} />
                    <div>載入人才名單中…</div>
                  </div>
                </td>
              </tr>
            ) : loadError ? (
              <tr>
                <td colSpan={9} style={{ padding: "48px 0", textAlign: "center", color: T.red, fontSize: 13, fontFamily: F }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                    <Filter size={32} color={T.redBd} />
                    <div>載入失敗：{loadError}</div>
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: "48px 0", textAlign: "center", color: T.text4, fontSize: 13, fontFamily: F }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                    <Filter size={32} color={T.border} />
                    <div>找不到符合條件的學生</div>
                    <div style={{ fontSize: 11 }}>請調整篩選條件或清除搜尋內容</div>
                  </div>
                </td>
              </tr>
            ) : filtered.map((s, idx) => {
              const isSelected = selectedIds.has(s.id);
              const cls = CLS_PAL[s.class] ?? { bg: T.bg, color: T.text3, bd: T.border };
              const isAllRounder = s.cats.length >= 4;

              return (
                <tr
                  key={s.id}
                  style={{
                    background: isSelected ? T.bluePale : idx % 2 === 0 ? T.surface : "#FAFBFC",
                    borderBottom: `1px solid ${T.border}`,
                    transition: "background 0.1s",
                  }}
                >
                  {/* Checkbox */}
                  <td style={{ padding: "12px 16px", textAlign: "center" }}>
                    <div
                      onClick={() => setSelectedIds(prev => { const n = new Set(prev); n.has(s.id) ? n.delete(s.id) : n.add(s.id); return n; })}
                      title={isSelected ? "取消選擇" : "選擇此學生"}
                      style={{
                        width: 18, height: 18, borderRadius: 4,
                        border: `2px solid ${isSelected ? T.blue : "#94A3B8"}`,
                        background: isSelected ? T.blue : "#FFFFFF",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", margin: "0 auto", transition: "all 0.12s",
                        boxShadow: isSelected ? `0 0 0 3px ${T.blue}22` : "0 1px 2px rgba(0,0,0,0.08)",
                      }}
                    >
                      {isSelected && <Check size={11} color="#fff" strokeWidth={3} />}
                    </div>
                  </td>

                  {/* Row number */}
                  <td style={{ padding: "12px 4px", textAlign: "center", fontSize: 11, color: T.text4, fontFamily: T.mono }}>{idx + 1}</td>

                  {/* Student */}
                  <td style={{ padding: "12px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {/* Avatar */}
                      <div style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, background: `linear-gradient(135deg, ${T.blue}, ${T.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff" }}>
                        {s.nameZh.slice(0, 1)}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>{s.nameZh}</span>
                          {isAllRounder && (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "1px 6px", borderRadius: 999, background: "linear-gradient(90deg, #EFF6FF, #F5F3FF)", border: `1px solid ${T.purpleBd}`, fontSize: 9, fontWeight: 800, color: T.purple }}>
                              <Sparkles size={8} /> 全才
                            </span>
                          )}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                          <span style={{ fontSize: 10.5, color: T.text4 }}>{s.nameEn}</span>
                          <span style={{ padding: "1px 6px", borderRadius: 4, background: cls.bg, border: `1px solid ${cls.bd}`, fontSize: 10, fontWeight: 700, color: cls.color }}>{s.class}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Category tags */}
                  <td style={{ padding: "12px 12px" }}>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
                      {s.cats.map(c => <CatTag key={c} cat={c} />)}
                    </div>
                  </td>

                  {/* Breadth indicator */}
                  <td style={{ padding: "12px 12px", textAlign: "center" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                      <BreadthBar cats={s.cats} />
                      <span style={{ fontSize: 9.5, color: T.text4, fontFamily: T.mono }}>{s.cats.length}/6</span>
                    </div>
                  </td>

                  {/* Activity count */}
                  <td style={{ padding: "12px 12px", textAlign: "center" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: "50%", background: T.bluePale, border: `1px solid ${T.blueBd}`, fontSize: 12, fontWeight: 800, color: T.blue }}>
                      {s.activityCount}
                    </span>
                  </td>

                  {/* Points */}
                  <td style={{ padding: "12px 12px", textAlign: "center" }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: s.pts >= 250 ? T.amber : T.text2 }}>
                      {s.pts}
                    </div>
                    <div style={{ fontSize: 9.5, color: T.text4 }}>pts</div>
                  </td>

                  {/* Latest activity */}
                  {!isMobile && (
                    <td style={{ padding: "12px 12px" }}>
                      <div style={{ fontSize: 11.5, color: T.text2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }} title={s.latestActivity}>
                        {s.latestActivity}
                      </div>
                    </td>
                  )}

                  {/* Profile link */}
                  <td style={{ padding: "12px 16px" }}>
                    <button style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 9px", border: `1px solid ${T.border}`, borderRadius: T.radius, background: "transparent", color: T.text3, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: F, whiteSpace: "nowrap" }}>
                      <ExternalLink size={11} /> 檔案
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          STICKY FOOTER
      ══════════════════════════════════════════════════════════════════ */}
      {selectedIds.size > 0 && (
        <div style={{ position: "sticky", bottom: 0, background: T.text1, borderTop: `1px solid #1E293B`, padding: `10px ${isMobile ? "16px" : "24px"}`, display: "flex", alignItems: "center", gap: 12, zIndex: 50, flexShrink: 0, boxShadow: "0 -4px 20px rgba(15,23,42,0.25)" }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: T.blue, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Check size={14} color="#fff" />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>已選取 <strong style={{ color: "#60A5FA" }}>{selectedIds.size}</strong> 位學生</span>
          <div style={{ flex: 1 }} />
          <button onClick={() => setSelectedIds(new Set())} style={{ fontSize: 12, color: "#94A3B8", background: "none", border: "none", cursor: "pointer", fontFamily: F }}>取消選取</button>
          <button
            type="button"
            onClick={handleExportExcel}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: T.emerald, border: "none", borderRadius: T.radius, color: "#fff", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: F, boxShadow: "0 2px 8px rgba(5,150,105,0.4)" }}
          >
            <FileSpreadsheet size={14} /> ⬇️ 匯出已選 {selectedIds.size} 人
          </button>
        </div>
      )}
    </div>
  );
};
