// ─────────────────────────────────────────────────────────────────────────────
// Screen_TalentFilter.tsx
// 人才篩選與匯出 — Talent Pool & Filtering
// ERP Module 1.D.5  ·  Activities & Talent
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useMemo } from "react";
import { ERP } from "./erpTokens";
import {
  Search, ChevronDown, Download, FileSpreadsheet,
  SlidersHorizontal, X, Check, ExternalLink,
  ChevronUp, ChevronRight, Users, Sparkles,
  Trophy, BookOpen, Palette, Heart, Cpu, Star,
  FileDown, Filter, ArrowUpDown, Layers,
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

// ── Student data ────────────────────────────────────────────────────────────────
interface TalentStudent {
  id: string;
  nameZh: string;
  nameEn: string;
  class: string;
  cats: CatKey[];
  activityCount: number;
  pts: number;
  latestActivity: string;
  latestActivityEn: string;
  yearJoined: "2025-26" | "2024-25" | "2023-24";
}

const STUDENTS: TalentStudent[] = [
  { id: "t01", nameZh: "陳大文", nameEn: "Chan Tai Man",    class: "F3A", cats: ["sports","academic"],            activityCount: 6,  pts: 220, latestActivity: "南區中學校際足球賽",      latestActivityEn: "South District Football",     yearJoined: "2025-26" },
  { id: "t02", nameZh: "李美玲", nameEn: "Lee Mei Ling",    class: "F3A", cats: ["arts","service"],               activityCount: 5,  pts: 180, latestActivity: "聯校音樂比賽",            latestActivityEn: "Joint-School Music Festival", yearJoined: "2025-26" },
  { id: "t03", nameZh: "黃志豪", nameEn: "Wong Chi Ho",     class: "F3A", cats: ["sports","stem"],                activityCount: 4,  pts: 160, latestActivity: "全港 STEM 創新大賽",      latestActivityEn: "HK STEM Innovation Challenge",yearJoined: "2025-26" },
  { id: "t04", nameZh: "張詩敏", nameEn: "Cheung Sze Man",  class: "F3A", cats: ["academic","leadership","service"],activityCount:7,  pts: 290, latestActivity: "全港中學生辯論比賽",      latestActivityEn: "HK Secondary Debate",         yearJoined: "2025-26" },
  { id: "t05", nameZh: "林俊傑", nameEn: "Lam Chun Kit",    class: "F3A", cats: ["sports"],                       activityCount: 3,  pts: 90,  latestActivity: "校際籃球比賽",            latestActivityEn: "Inter-School Basketball",     yearJoined: "2025-26" },
  { id: "t06", nameZh: "吳嘉欣", nameEn: "Ng Ka Yan",       class: "F3A", cats: ["arts","academic"],              activityCount: 5,  pts: 200, latestActivity: "視覺藝術創作展",          latestActivityEn: "Visual Arts Exhibition",      yearJoined: "2025-26" },
  { id: "t07", nameZh: "鄭宇翔", nameEn: "Cheng Yu Cheung", class: "F3B", cats: ["stem","academic"],              activityCount: 6,  pts: 240, latestActivity: "程式設計金獎",            latestActivityEn: "Programming Gold Award",      yearJoined: "2025-26" },
  { id: "t08", nameZh: "梁慧雯", nameEn: "Leung Wai Man",   class: "F3B", cats: ["service","leadership"],         activityCount: 8,  pts: 310, latestActivity: "學生會主席",              latestActivityEn: "Student Union President",     yearJoined: "2025-26" },
  { id: "t09", nameZh: "何建明", nameEn: "Ho Kin Ming",     class: "F3B", cats: ["sports","service"],             activityCount: 4,  pts: 130, latestActivity: "社區服務義工計劃",        latestActivityEn: "Community Service Programme", yearJoined: "2025-26" },
  { id: "t10", nameZh: "劉佩珊", nameEn: "Lau Pui Shan",    class: "F3B", cats: ["arts","leadership","service"],  activityCount: 6,  pts: 250, latestActivity: "戲劇表演",                latestActivityEn: "Drama Performance",           yearJoined: "2025-26" },
  { id: "t11", nameZh: "楊浩然", nameEn: "Yeung Ho Yin",    class: "F3B", cats: ["stem","sports"],                activityCount: 5,  pts: 195, latestActivity: "機械人比賽",              latestActivityEn: "Robotics Competition",        yearJoined: "2025-26" },
  { id: "t12", nameZh: "蔡曉彤", nameEn: "Choi Hiu Tung",   class: "F3B", cats: ["academic","arts"],              activityCount: 4,  pts: 170, latestActivity: "全港中學作文比賽",        latestActivityEn: "HK Essay Competition",        yearJoined: "2025-26" },
  { id: "t13", nameZh: "許志遠", nameEn: "Hui Chi Yuen",    class: "F1A", cats: ["academic"],                     activityCount: 2,  pts: 60,  latestActivity: "數學奧林匹克",            latestActivityEn: "Mathematics Olympiad",        yearJoined: "2025-26" },
  { id: "t14", nameZh: "羅雅雯", nameEn: "Lo Nga Man",      class: "F1A", cats: ["arts","service"],               activityCount: 3,  pts: 100, latestActivity: "合唱比賽",                latestActivityEn: "Choir Competition",           yearJoined: "2025-26" },
  { id: "t15", nameZh: "謝家豪", nameEn: "Tse Ka Ho",       class: "F2A", cats: ["sports","leadership"],          activityCount: 5,  pts: 185, latestActivity: "體育委員",                latestActivityEn: "Sports Prefect",              yearJoined: "2025-26" },
  { id: "t16", nameZh: "馮紫晴", nameEn: "Fung Zi Ching",   class: "F2A", cats: ["academic","stem","arts"],       activityCount: 7,  pts: 300, latestActivity: "科學展覽優異獎",          latestActivityEn: "Science Fair Merit Award",    yearJoined: "2025-26" },
  { id: "t17", nameZh: "陳志明", nameEn: "Chan Chi Ming",   class: "F4A", cats: ["sports","service","leadership"],activityCount: 9,  pts: 340, latestActivity: "校隊隊長",                latestActivityEn: "School Team Captain",         yearJoined: "2024-25" },
  { id: "t18", nameZh: "陳美兒", nameEn: "Chan Mei Yi",     class: "F4B", cats: ["arts","academic"],              activityCount: 4,  pts: 145, latestActivity: "鋼琴比賽銀獎",            latestActivityEn: "Piano Competition Silver",    yearJoined: "2024-25" },
  { id: "t19", nameZh: "李明峰", nameEn: "Lee Ming Fung",   class: "F5A", cats: ["stem","academic","leadership"], activityCount: 8,  pts: 320, latestActivity: "IEEE 青年工程師獎",       latestActivityEn: "IEEE Young Engineer Award",   yearJoined: "2024-25" },
  { id: "t20", nameZh: "李明達", nameEn: "Lee Ming Tat",    class: "F5B", cats: ["service","leadership"],         activityCount: 6,  pts: 210, latestActivity: "義工領袖培訓計劃",        latestActivityEn: "Volunteer Leadership Prog.",  yearJoined: "2024-25" },
  { id: "t21", nameZh: "鄭家樂", nameEn: "Cheng Ka Lok",    class: "F2B", cats: ["sports","arts"],                activityCount: 3,  pts: 110, latestActivity: "田徑比賽",                latestActivityEn: "Athletics Meet",              yearJoined: "2025-26" },
  { id: "t22", nameZh: "黃美儀", nameEn: "Wong Mei Yee",    class: "F4A", cats: ["academic","service"],           activityCount: 5,  pts: 190, latestActivity: "化學奧林匹克",            latestActivityEn: "Chemistry Olympiad",          yearJoined: "2024-25" },
];

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

// ── Export dropdown ─────────────────────────────────────────────────────────────
const ExportButton: React.FC<{ selectedCount: number; totalCount: number }> = ({ selectedCount, totalCount }) => {
  const [open, setOpen] = useState(false);
  const [exported, setExported] = useState<string | null>(null);

  const doExport = (label: string) => {
    setOpen(false);
    setExported(label);
    setTimeout(() => setExported(null), 2800);
  };

  return (
    <div style={{ position: "relative" }}>
      {exported && (
        <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, background: "#0F172A", color: "#fff", fontSize: 11, fontWeight: 600, padding: "7px 14px", borderRadius: T.radius, whiteSpace: "nowrap", zIndex: 300, boxShadow: T.shadowMd, display: "flex", alignItems: "center", gap: 6 }}>
          <Check size={12} color="#4ADE80" /> {exported} 匯出完成
        </div>
      )}

      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: "flex", alignItems: "center", gap: 7,
          padding: "8px 16px",
          background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
          border: "none", borderRadius: T.radius,
          color: "#fff", fontSize: 13, fontWeight: 700,
          cursor: "pointer", fontFamily: T.font,
          boxShadow: "0 2px 8px rgba(5,150,105,0.35)",
          transition: "all 0.12s",
        }}
      >
        <FileSpreadsheet size={15} />
        匯出 Excel
        <ChevronDown size={13} style={{ transition: "transform 0.15s", transform: open ? "rotate(180deg)" : "none" }} />
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 200 }} />
          <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radiusLg, boxShadow: T.shadowMd, zIndex: 250, minWidth: 220, overflow: "hidden" }}>
            {[
              { label: `匯出全部 ${totalCount} 人`, icon: <FileDown size={13} />, sub: "Export All Students" },
              { label: `匯出已選 ${selectedCount} 人`, icon: <Check size={13} />, sub: "Export Selected" },
              { label: "匯出為 CSV", icon: <FileSpreadsheet size={13} />, sub: "Export as CSV" },
            ].map((opt, i) => (
              <button
                key={opt.label}
                onClick={() => doExport(opt.label)}
                disabled={opt.label.includes("已選") && selectedCount === 0}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "11px 16px", border: "none", borderBottom: i < 2 ? `1px solid ${T.border}` : "none", background: "transparent", color: selectedCount === 0 && opt.label.includes("已選") ? T.text4 : T.text1, cursor: selectedCount === 0 && opt.label.includes("已選") ? "not-allowed" : "pointer", fontFamily: T.font, textAlign: "left" }}
              >
                <span style={{ color: T.emerald, flexShrink: 0 }}>{opt.icon}</span>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600 }}>{opt.label}</div>
                  <div style={{ fontSize: 10, color: T.text4 }}>{opt.sub}</div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ── Main component ──────────────────────────────────────────────────────────────
export const Screen_TalentFilter: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Filters
  const [yearFilter, setYearFilter]     = useState<string>("2025-26");
  const [yearOpen, setYearOpen]         = useState(false);
  const [activeCats, setActiveCats]     = useState<Set<CatKey>>(new Set());
  const [search, setSearch]             = useState("");
  const [sortCol, setSortCol]           = useState<"name" | "pts" | "count" | "breadth">("pts");
  const [sortAsc, setSortAsc]           = useState(false);

  // Selection — pre-seeded to demonstrate working checkbox logic
  const [selectedIds, setSelectedIds]   = useState<Set<string>>(new Set(["t04", "t08", "t17"]));

  // Filter panel (mobile)
  const [showFilters, setShowFilters]   = useState(false);

  const toggleCat = (k: CatKey) => setActiveCats(prev => {
    const n = new Set(prev);
    n.has(k) ? n.delete(k) : n.add(k);
    return n;
  });

  // Derived filtered + sorted list
  const filtered = useMemo(() => {
    let list = STUDENTS.filter(s => {
      if (s.yearJoined !== yearFilter && yearFilter !== "all") {
        // keep students from selected year or later (cumulative view)
        const yrs = YEAR_OPTIONS;
        const idx = yrs.indexOf(yearFilter as string);
        const sIdx = yrs.indexOf(s.yearJoined);
        if (sIdx > idx) return false;
      }
      if (activeCats.size > 0 && !s.cats.some(c => activeCats.has(c))) return false;
      if (search.trim()) {
        const kw = search.trim().toLowerCase();
        if (!s.nameZh.includes(search) && !s.nameEn.toLowerCase().includes(kw) && !s.class.toLowerCase().includes(kw)) return false;
      }
      return true;
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
  }, [yearFilter, activeCats, search, sortCol, sortAsc]);

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

  // Category stats for the summary bar
  const catCounts = useMemo(() =>
    CAT_KEYS.map(k => ({ key: k, count: filtered.filter(s => s.cats.includes(k)).length })),
  [filtered]);

  const F = T.font;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: isMobile ? "auto" : "100%", minHeight: isMobile ? "100%" : undefined, background: T.bg, fontFamily: F, overflow: isMobile ? "visible" : "hidden" }}>

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
          <ExportButton selectedCount={selectedIds.size} totalCount={filtered.length} />
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

          {/* Divider */}
          <div style={{ width: 1, height: 24, background: T.border, flexShrink: 0 }} />

          {/* Category toggle chips */}
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 10.5, color: T.text4, fontWeight: 600, whiteSpace: "nowrap" }}>類別：</span>

            {/* All chip */}
            <button
              onClick={() => setActiveCats(new Set())}
              style={{
                padding: "4px 11px", border: `1.5px solid ${activeCats.size === 0 ? T.text2 : T.border}`,
                borderRadius: 999, fontSize: 11, fontWeight: activeCats.size === 0 ? 700 : 500,
                background: activeCats.size === 0 ? T.text1 : "transparent",
                color: activeCats.size === 0 ? "#fff" : T.text3,
                cursor: "pointer", fontFamily: F, transition: "all 0.12s",
              }}
            >
              全部 All
            </button>

            {CAT_KEYS.map(k => {
              const c = CATS[k];
              const active = activeCats.has(k);
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
          {activeCats.size > 0 && (
            <button onClick={() => setActiveCats(new Set())} style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 999, border: `1px solid ${T.borderStrong}`, background: T.bg, color: T.text3, fontSize: 10.5, fontWeight: 600, cursor: "pointer", fontFamily: F, whiteSpace: "nowrap" }}>
              <X size={10} /> 清除 {activeCats.size} 個篩選
            </button>
          )}
        </div>

        {/* Category distribution summary */}
        <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 10, color: T.text4 }}>顯示 {filtered.length} 人：</span>
          {catCounts.filter(c => c.count > 0).map(({ key: k, count }) => {
            const c = CATS[k];
            return (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 4, padding: "1px 8px", borderRadius: 999, background: c.bg, border: `1px solid ${c.bd}`, fontSize: 10, fontWeight: 700, color: c.color }}>
                {c.icon} {c.label} {count}
              </div>
            );
          })}
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
            {filtered.length === 0 ? (
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
                      <div style={{ fontSize: 10, color: T.text4, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }}>
                        {s.latestActivityEn}
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
          <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: T.emerald, border: "none", borderRadius: T.radius, color: "#fff", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: F, boxShadow: "0 2px 8px rgba(5,150,105,0.4)" }}>
            <FileSpreadsheet size={14} /> 匯出已選 {selectedIds.size} 人
          </button>
          <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "#7C3AED", border: "none", borderRadius: T.radius, color: "#fff", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: F }}>
            <Layers size={14} /> 批量生成證書
          </button>
        </div>
      )}
    </div>
  );
};
