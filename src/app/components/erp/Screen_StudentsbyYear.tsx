// ─────────────────────────────────────────────────────────────────────────────
// Screen 1.B.1 — 年度學生名冊 / Student Roster  (v2 Enterprise Redesign)
// Epic 1: PDPO Privacy Masking    Epic 2: Smart Omnibar + Paste List
// Epic 3: Bulk Actions FAB        Epic 4: AI Alert column + enhanced grid
// Frame state: Privacy ON + 2 rows selected
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Search, Download, RefreshCw, Eye, EyeOff,
  ChevronLeft, ChevronRight, AlertTriangle, CheckCircle2,
  Clock, User, Users, BookOpen, Shield, ShieldOff,
  X, ClipboardList, MoreHorizontal, FolderPlus, Trophy,
  Sparkles, SlidersHorizontal, Upload, CloudUpload,
  FileSpreadsheet, FileWarning, ExternalLink, Info,
} from "lucide-react";

// ── Design tokens (8-pt grid, Linear-style neutrals) ─────────────────────────
const DS = {
  blue:          "#2563EB",
  blueHover:     "#1D4ED8",
  bluePale:      "#EFF6FF",
  blueBorder:    "#BFDBFE",
  amber:         "#F59E0B",
  amberPale:     "#FFFBEB",
  amberBorder:   "#FDE68A",
  amberText:     "#92400E",
  emerald:       "#10B981",
  emeraldPale:   "#ECFDF5",
  emeraldBorder: "#6EE7B7",
  emeraldText:   "#065F46",
  red:           "#EF4444",
  redPale:       "#FEF2F2",
  redBorder:     "#FECACA",
  redText:       "#991B1B",
  g50:  "#F8FAFC", g100: "#F1F5F9", g200: "#E2E8F0",
  g300: "#CBD5E1", g400: "#94A3B8", g500: "#64748B",
  g600: "#475569", g700: "#334155", g800: "#1E293B", g900: "#0F172A",
  white:   "#FFFFFF",
  fabBg:   "#1E293B",
  rowRepeat: "#FFFBEB",
  rowSelected: "#EFF6FF",
  font: "'Inter', 'Roboto', system-ui, sans-serif",
  mono: "'JetBrains Mono', 'Fira Code', monospace",
  rowH: 44,
};

// ── Data model ────────────────────────────────────────────────────────────────
interface StudentRow {
  id: string;
  chName: string; enName: string;
  form: string; classCode: string; classNum: number;
  status: "active" | "repeat" | "left" | "suspended";
  isRepeat: boolean;
  pendingAwards: number;
  aiAlert: "none" | "attendance" | "academic" | "both";
}

const MOCK: StudentRow[] = [
  { id:"2025-F1A-001", chName:"陳大文",  enName:"Chan Tai Man",    form:"F1", classCode:"F1A", classNum:1,  status:"active",    isRepeat:false, pendingAwards:2, aiAlert:"none"       },
  { id:"2025-F1A-002", chName:"黃美怡",  enName:"Wong Mei Yi",     form:"F1", classCode:"F1A", classNum:2,  status:"active",    isRepeat:false, pendingAwards:0, aiAlert:"attendance" },
  { id:"2025-F1A-003", chName:"李家豪",  enName:"Lee Ka Ho",       form:"F1", classCode:"F1A", classNum:3,  status:"active",    isRepeat:false, pendingAwards:1, aiAlert:"academic"   },
  { id:"2025-F1A-004", chName:"劉曉峰",  enName:"Lau Hiu Fung",   form:"F1", classCode:"F1A", classNum:4,  status:"active",    isRepeat:false, pendingAwards:0, aiAlert:"none"       },
  { id:"2025-F1A-005", chName:"林詩雅",  enName:"Lam Sze Nga",    form:"F1", classCode:"F1A", classNum:5,  status:"suspended", isRepeat:false, pendingAwards:3, aiAlert:"both"       },
  { id:"2025-F1A-006", chName:"張俊傑",  enName:"Cheung Chun Kit", form:"F1", classCode:"F1A", classNum:6,  status:"active",    isRepeat:false, pendingAwards:0, aiAlert:"none"       },
  { id:"2025-F1A-007", chName:"吳敏兒",  enName:"Ng Man Yi",       form:"F1", classCode:"F1A", classNum:7,  status:"repeat",    isRepeat:true,  pendingAwards:1, aiAlert:"academic"   },
  { id:"2025-F1B-001", chName:"鄭浩南",  enName:"Cheng Ho Nam",   form:"F1", classCode:"F1B", classNum:1,  status:"active",    isRepeat:false, pendingAwards:0, aiAlert:"none"       },
  { id:"2025-F1B-002", chName:"何雅詩",  enName:"Ho Nga Si",       form:"F1", classCode:"F1B", classNum:2,  status:"active",    isRepeat:false, pendingAwards:2, aiAlert:"attendance" },
  { id:"2025-F1B-003", chName:"梁紹基",  enName:"Leung Siu Kei",  form:"F1", classCode:"F1B", classNum:3,  status:"active",    isRepeat:false, pendingAwards:0, aiAlert:"none"       },
  { id:"2025-F1B-004", chName:"蔡天朗",  enName:"Tsoi Tin Long",  form:"F1", classCode:"F1B", classNum:4,  status:"active",    isRepeat:false, pendingAwards:1, aiAlert:"none"       },
  { id:"2025-F1B-005", chName:"馬麗珊",  enName:"Ma Lai San",      form:"F1", classCode:"F1B", classNum:5,  status:"left",      isRepeat:false, pendingAwards:0, aiAlert:"none"       },
  { id:"2025-F1B-006", chName:"鄺子俊",  enName:"Kwong Tsz Chun", form:"F1", classCode:"F1B", classNum:6,  status:"active",    isRepeat:false, pendingAwards:4, aiAlert:"none"       },
  { id:"2025-F2A-001", chName:"謝嘉麗",  enName:"Tse Ka Lai",      form:"F2", classCode:"F2A", classNum:1,  status:"active",    isRepeat:false, pendingAwards:0, aiAlert:"none"       },
  { id:"2025-F2A-002", chName:"彭俊賢",  enName:"Pang Chun Yin",  form:"F2", classCode:"F2A", classNum:2,  status:"active",    isRepeat:false, pendingAwards:2, aiAlert:"academic"   },
  { id:"2025-F2A-003", chName:"徐婉婷",  enName:"Tsui Yuen Ting", form:"F2", classCode:"F2A", classNum:3,  status:"active",    isRepeat:false, pendingAwards:0, aiAlert:"none"       },
  { id:"2025-F2A-004", chName:"盧偉強",  enName:"Lo Wai Keung",   form:"F2", classCode:"F2A", classNum:4,  status:"active",    isRepeat:false, pendingAwards:1, aiAlert:"none"       },
  { id:"2025-F2A-005", chName:"蘇曉彤",  enName:"So Hiu Tung",    form:"F2", classCode:"F2A", classNum:5,  status:"active",    isRepeat:false, pendingAwards:0, aiAlert:"attendance" },
  { id:"2025-F2A-006", chName:"江美琪",  enName:"Kong Mei Ki",    form:"F2", classCode:"F2A", classNum:6,  status:"active",    isRepeat:false, pendingAwards:3, aiAlert:"none"       },
  { id:"2025-F2B-001", chName:"余志遠",  enName:"Yu Chi Yuen",    form:"F2", classCode:"F2B", classNum:1,  status:"active",    isRepeat:false, pendingAwards:0, aiAlert:"none"       },
];

const AY_OPTS     = ["2025/26", "2024/25", "2023/24"];
const FORM_OPTS   = ["全部", "F1", "F2", "F3", "F4", "F5", "F6"];
const CLASS_OPTS  = ["全部", "F1A", "F1B", "F2A", "F2B"];
const STATUS_OPTS = ["全部", "在學", "重讀", "停學", "離校"];
const PAGE_SIZE   = 10;

// ── Masking utilities ─────────────────────────────────────────────────────────
const maskChName = (n: string) => n.slice(0, 1) + "**";
const maskEnName = (n: string) => {
  const p = n.split(" ");
  return p[0].slice(0, 1) + ". " + p.slice(1).map(w => w.slice(0, 1) + ".").join(" ");
};
const maskId = (id: string) => {
  const p = id.split("-");
  return `${p[0]}-${"*".repeat(p[1]?.length ?? 3)}-${"*".repeat(p[2]?.length ?? 3)}`;
};

// ── Sub-components ────────────────────────────────────────────────────────────

const CB: React.FC<{
  checked: boolean; indeterminate?: boolean;
  onChange: (e: React.MouseEvent) => void;
}> = ({ checked, indeterminate, onChange }) => (
  <div
    onClick={onChange}
    style={{
      width: 16, height: 16, borderRadius: 4, cursor: "pointer", flexShrink: 0,
      background: checked || indeterminate ? DS.blue : DS.white,
      border: `1.5px solid ${checked || indeterminate ? DS.blue : DS.g300}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      transition: "all 0.1s", boxSizing: "border-box",
    }}
  >
    {checked && (
      <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
        <path d="M1 3.5L3.5 6L8 1" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )}
    {!checked && indeterminate && (
      <div style={{ width: 7, height: 1.5, background: "#fff", borderRadius: 1 }} />
    )}
  </div>
);

const StatusBadge: React.FC<{ status: StudentRow["status"] }> = ({ status }) => {
  const MAP = {
    active:    { bg: DS.emeraldPale,  color: DS.emeraldText, border: DS.emeraldBorder, label: "在學 Active",     icon: <CheckCircle2 size={10} /> },
    repeat:    { bg: DS.amberPale,    color: DS.amberText,   border: DS.amberBorder,   label: "重讀 Repeat",     icon: <AlertTriangle size={10} /> },
    suspended: { bg: "#FFF7ED",       color: "#9A3412",      border: "#FDBA74",        label: "停學 Suspended",  icon: <AlertTriangle size={10} /> },
    left:      { bg: DS.g100,         color: DS.g600,        border: DS.g300,          label: "離校 Left",       icon: <Clock size={10} /> },
  };
  const s = MAP[status];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 8px", borderRadius: 9999,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      fontSize: 10.5, fontWeight: 600, whiteSpace: "nowrap" as const,
      fontFamily: DS.font,
    }}>
      {s.icon}{s.label}
    </span>
  );
};

const AIAlertCell: React.FC<{ alert: StudentRow["aiAlert"] }> = ({ alert }) => {
  if (alert === "none") return <span style={{ color: DS.g400, fontSize: 13 }}>—</span>;
  const cfg = {
    attendance: { bg: DS.amberPale,  color: DS.amberText, border: DS.amberBorder, label: "出席 ↓", tip: "Attendance Risk" },
    academic:   { bg: DS.redPale,    color: DS.redText,   border: DS.redBorder,   label: "學績 ↓", tip: "Academic Risk"   },
    both:       { bg: DS.redPale,    color: DS.redText,   border: DS.redBorder,   label: "多項 ⚠",  tip: "Multiple Risks"  },
  }[alert];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 8px", borderRadius: 6,
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
      fontSize: 10.5, fontWeight: 700, whiteSpace: "nowrap" as const,
      fontFamily: DS.font,
    }}>
      <AlertTriangle size={9} />
      {cfg.label}
    </span>
  );
};

const PendingBadge: React.FC<{ count: number }> = ({ count }) =>
  count === 0
    ? <span style={{ color: DS.g400, fontSize: 13 }}>—</span>
    : <span style={{
        display: "inline-flex", alignItems: "center", gap: 3,
        padding: "3px 8px", borderRadius: 9999,
        background: DS.bluePale, color: DS.blue, border: `1px solid ${DS.blueBorder}`,
        fontSize: 10.5, fontWeight: 600, fontFamily: DS.font,
      }}>{count} 待審</span>;

// Masked / revealed cell wrapper with hover-to-reveal
const PrivacyCell: React.FC<{
  privacyOn: boolean; cellKey: string;
  revealed: Set<string>; onReveal: (k: string) => void; onHide: (k: string) => void;
  children: React.ReactNode; masked: React.ReactNode;
}> = ({ privacyOn, cellKey, revealed, onReveal, onHide, children, masked }) => {
  const show = !privacyOn || revealed.has(cellKey);
  return (
    <div
      style={{ position: "relative" as const, cursor: privacyOn ? "pointer" : "auto" }}
      onMouseEnter={() => privacyOn && onReveal(cellKey)}
      onMouseLeave={() => privacyOn && onHide(cellKey)}
    >
      {show ? children : (
        <>
          <div style={{ filter: "blur(5px)", userSelect: "none", pointerEvents: "none" }}>
            {masked}
          </div>
          <div style={{
            position: "absolute" as const, inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            opacity: 0.55,
          }}>
            <Eye size={12} color={DS.g500} />
          </div>
        </>
      )}
    </div>
  );
};

// ── Filter dropdown component ─────────────────────────────────────────────────
const FilterSelect: React.FC<{
  label: string; value: string; options: string[];
  onChange: (v: string) => void; width?: number | string;
}> = ({ label, value, options, onChange, width = 108 }) => (
  <div style={{ display: "flex", flexDirection: "column" as const, gap: 3 }}>
    <label style={{ fontSize: 10.5, fontWeight: 600, color: DS.g500, fontFamily: DS.font, letterSpacing: "0.04em" }}>
      {label}
    </label>
    <div style={{ position: "relative" as const }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width, padding: "7px 28px 7px 10px", borderRadius: 8,
          border: `1px solid ${value !== "全部" ? DS.blue : DS.g200}`,
          background: value !== "全部" ? DS.bluePale : DS.white,
          color: value !== "全部" ? DS.blue : DS.g700,
          fontSize: 12.5, fontFamily: DS.font, outline: "none", cursor: "pointer",
          appearance: "none", fontWeight: value !== "全部" ? 600 : 400,
          boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        }}
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <svg width="10" height="6" viewBox="0 0 10 6" style={{ position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
        <path d="M1 1l4 4 4-4" stroke={value !== "全部" ? DS.blue : DS.g400} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      </svg>
    </div>
  </div>
);

// ── Column header cell ────────────────────────────────────────────────────────
const TH: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{
    padding: "0 12px 0 0", display: "flex", alignItems: "center",
    fontSize: 10.5, fontWeight: 700, color: DS.g500, letterSpacing: "0.06em",
    textTransform: "uppercase" as const, whiteSpace: "nowrap" as const,
    fontFamily: DS.font,
  }}>{children}</div>
);

// ── Contextual Import Modal ───────────────────────────────────────────────────
type ImportStep = "idle" | "validating" | "validated";

const ImportModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const F = DS.font;
  const [dragOver,   setDragOver]   = useState(false);
  const [step,       setStep]       = useState<ImportStep>("validated"); // pre-show validation state
  const [confirmed,  setConfirmed]  = useState(false);
  const [showErrLog, setShowErrLog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const FILENAME  = "student_roster_2526.xlsx";
  const TOTAL     = 118;
  const DUP_COUNT = 2;
  const canImport = false; // disabled — errors must be resolved first

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    setStep("validated");
  };

  return (
    <div
      style={{ position:"fixed", inset:0, zIndex:800, display:"flex", alignItems:"center", justifyContent:"center", padding:24,
        background:"rgba(15,23,42,0.72)", backdropFilter:"blur(3px)", WebkitBackdropFilter:"blur(3px)" }}
      onClick={onClose}
    >
      <style>{`
        @keyframes modalIn { from { opacity:0; transform:translateY(14px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes shimmer  { 0%,100% { opacity:0.5; } 50% { opacity:1; } }
        .import-modal { animation: modalIn 0.22s cubic-bezier(0.34,1.56,0.64,1) forwards; }
      `}</style>

      <div
        className="import-modal"
        style={{ background:"#FFFFFF", borderRadius:16, width:"100%", maxWidth:560,
          boxShadow:"0 24px 64px rgba(15,23,42,0.28), 0 4px 16px rgba(15,23,42,0.12)",
          border:"1px solid #E2E8F0", overflow:"hidden", fontFamily:F }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Modal Header ── */}
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between",
          padding:"20px 24px 16px", borderBottom:"1px solid #F1F5F9" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:38, height:38, borderRadius:10, background:"linear-gradient(135deg, #2563EB, #4F46E5)",
              display:"flex", alignItems:"center", justifyContent:"center",
              boxShadow:"0 2px 8px rgba(37,99,235,0.35)", flexShrink:0 }}>
              <Upload size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize:16, fontWeight:800, color:"#0F172A", letterSpacing:"-0.2px" }}>
                大量匯入學生資料
              </div>
              <div style={{ fontSize:11.5, color:"#94A3B8", marginTop:2 }}>
                Bulk Import Students · 年度學生名冊 2025/26
              </div>
            </div>
          </div>
          <button onClick={onClose}
            style={{ background:"none", border:"1px solid #E2E8F0", borderRadius:8, padding:6, cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center", color:"#94A3B8", transition:"all 0.12s" }}
            onMouseEnter={e => { e.currentTarget.style.background="#F1F5F9"; e.currentTarget.style.color="#475569"; }}
            onMouseLeave={e => { e.currentTarget.style.background="none"; e.currentTarget.style.color="#94A3B8"; }}>
            <X size={16} />
          </button>
        </div>

        {/* ── Modal Body ── */}
        <div style={{ padding:"20px 24px", display:"flex", flexDirection:"column", gap:18 }}>

          {/* Step 1 — Template download */}
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:10 }}>
              <div style={{ width:20, height:20, borderRadius:"50%", background:"#2563EB",
                display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <span style={{ fontSize:10, fontWeight:800, color:"#fff" }}>1</span>
              </div>
              <span style={{ fontSize:12.5, fontWeight:700, color:"#334155", fontFamily:F }}>下載標準範本</span>
              <span style={{ fontSize:11, color:"#94A3B8", fontFamily:F }}>Download Template</span>
            </div>

            {/* Info box */}
            <div style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"11px 14px",
              background:"#EFF6FF", border:"1px solid #BFDBFE", borderLeft:"3px solid #2563EB",
              borderRadius:10, marginBottom:12 }}>
              <Info size={14} color="#2563EB" style={{ flexShrink:0, marginTop:1 }} />
              <p style={{ margin:0, fontSize:12.5, color:"#1E40AF", lineHeight:1.65, fontFamily:F }}>
                請先下載標準 Excel 範本，填寫完畢後再上傳，以確保資料格式正確。<br />
                <span style={{ color:"#3B82F6", fontWeight:400 }}>
                  Please download the template first, fill it in, then upload to ensure correct data format.
                </span>
              </p>
            </div>

            <button style={{ display:"inline-flex", alignItems:"center", gap:8,
              padding:"9px 16px", borderRadius:9,
              border:"1px solid #BFDBFE", background:"#EFF6FF",
              color:"#1D4ED8", fontSize:13, fontWeight:700, fontFamily:F,
              cursor:"pointer", transition:"all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.background="#DBEAFE"; e.currentTarget.style.borderColor="#93C5FD"; }}
              onMouseLeave={e => { e.currentTarget.style.background="#EFF6FF"; e.currentTarget.style.borderColor="#BFDBFE"; }}>
              <FileSpreadsheet size={15} color="#16A34A" />
              下載標準範本
              <span style={{ fontSize:11, fontWeight:400, color:"#60A5FA" }}>Template.xlsx</span>
            </button>
          </div>

          {/* Divider */}
          <div style={{ height:1, background:"#F1F5F9", margin:"0 -2px" }} />

          {/* Step 2 — Dropzone */}
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:10 }}>
              <div style={{ width:20, height:20, borderRadius:"50%", background: step === "idle" ? "#94A3B8" : "#2563EB",
                display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"background 0.2s" }}>
                <span style={{ fontSize:10, fontWeight:800, color:"#fff" }}>2</span>
              </div>
              <span style={{ fontSize:12.5, fontWeight:700, color:"#334155", fontFamily:F }}>上傳檔案</span>
              <span style={{ fontSize:11, color:"#94A3B8", fontFamily:F }}>Upload File</span>
            </div>

            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{ border:`2px dashed ${dragOver ? "#2563EB" : "#CBD5E1"}`,
                borderRadius:12, padding:"28px 20px", textAlign:"center" as const,
                background: dragOver ? "#EFF6FF" : "#F8FAFC",
                cursor:"pointer", transition:"all 0.18s",
                display:"flex", flexDirection:"column" as const, alignItems:"center", gap:8 }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor="#93C5FD"; (e.currentTarget as HTMLDivElement).style.background="#F0F7FF"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor=dragOver?"#2563EB":"#CBD5E1"; (e.currentTarget as HTMLDivElement).style.background=dragOver?"#EFF6FF":"#F8FAFC"; }}
            >
              <input ref={fileInputRef} type="file" accept=".xlsx,.csv" style={{ display:"none" }} onChange={() => setStep("validated")} />
              <div style={{ width:44, height:44, borderRadius:12, background:"#E0E7FF",
                display:"flex", alignItems:"center", justifyContent:"center" }}>
                <CloudUpload size={22} color="#4F46E5" />
              </div>
              <div>
                <div style={{ fontSize:13.5, fontWeight:600, color:"#334155", fontFamily:F }}>
                  拖曳檔案至此，或<span style={{ color:"#2563EB", textDecoration:"underline" }}>點擊上傳</span>
                </div>
                <div style={{ fontSize:11.5, color:"#64748B", fontFamily:F, marginTop:2 }}>
                  Drag &amp; drop file here, or click to browse
                </div>
              </div>
              <div style={{ fontSize:11, color:"#94A3B8", fontFamily:F }}>
                支援 .xlsx, .csv 格式 · 最大 10 MB
              </div>
            </div>

            {/* ── Validation state ── */}
            {step === "validated" && (
              <div style={{ marginTop:12, display:"flex", flexDirection:"column" as const, gap:8 }}>

                {/* File chip */}
                <div style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 13px",
                  background:"#F8FAFC", border:"1px solid #E2E8F0", borderRadius:9 }}>
                  <FileSpreadsheet size={16} color="#16A34A" style={{ flexShrink:0 }} />
                  <span style={{ fontSize:12.5, fontWeight:600, color:"#334155", fontFamily:F, flex:1 }}>{FILENAME}</span>
                  <span style={{ fontSize:11, color:"#94A3B8", fontFamily:F }}>34 KB</span>
                  <button onClick={() => setStep("idle")}
                    style={{ background:"none", border:"none", cursor:"pointer", padding:2,
                      display:"flex", color:"#94A3B8" }}
                    onMouseEnter={e => (e.currentTarget.style.color="#EF4444")}
                    onMouseLeave={e => (e.currentTarget.style.color="#94A3B8")}>
                    <X size={13} />
                  </button>
                </div>

                {/* Validation warning banner */}
                <div style={{ padding:"12px 14px", background:"#FFFBEB",
                  border:"1px solid #FDE68A", borderLeft:"3px solid #F59E0B",
                  borderRadius:10 }}>
                  <div style={{ display:"flex", alignItems:"flex-start", gap:9 }}>
                    <FileWarning size={16} color="#D97706" style={{ flexShrink:0, marginTop:1 }} />
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:"#92400E", fontFamily:F }}>
                        成功解析 {TOTAL} 筆資料，發現 {DUP_COUNT} 筆學號重複
                      </div>
                      <div style={{ fontSize:12, color:"#B45309", fontFamily:F, marginTop:3, lineHeight:1.55 }}>
                        Successfully parsed {TOTAL} records — {DUP_COUNT} duplicate Student IDs detected. Please resolve before importing.
                      </div>
                      <div style={{ marginTop:8, display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" as const }}>
                        <div style={{ display:"flex", gap:6 }}>
                          <span style={{ padding:"1px 8px", borderRadius:999, background:"#D1FAE5", border:"1px solid #6EE7B7", fontSize:11, fontWeight:700, color:"#065F46", fontFamily:F }}>
                            ✓ {TOTAL - DUP_COUNT} 筆可匯入
                          </span>
                          <span style={{ padding:"1px 8px", borderRadius:999, background:"#FEE2E2", border:"1px solid #FCA5A5", fontSize:11, fontWeight:700, color:"#991B1B", fontFamily:F }}>
                            ⚠ {DUP_COUNT} 筆衝突
                          </span>
                        </div>
                        <button
                          onClick={() => setShowErrLog(v => !v)}
                          style={{ display:"inline-flex", alignItems:"center", gap:4,
                            background:"none", border:"none", cursor:"pointer", padding:0,
                            fontSize:12, fontWeight:700, color:"#D97706", fontFamily:F, textDecoration:"underline" }}>
                          <ExternalLink size={11} />
                          {showErrLog ? "收起錯誤詳情" : "查看錯誤詳情 View Error Log"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expandable error log */}
                  {showErrLog && (
                    <div style={{ marginTop:12, padding:"10px 12px",
                      background:"rgba(255,255,255,0.70)", borderRadius:8,
                      border:"1px solid #FDE68A", fontFamily:DS.mono, fontSize:11.5 }}>
                      <div style={{ color:"#92400E", fontWeight:700, marginBottom:6, fontFamily:F, fontSize:11 }}>
                        錯誤詳情 Error Log
                      </div>
                      {[
                        { row:14, id:"2025-F1A-007", reason:"學號與第 7 行重複" },
                        { row:63, id:"2025-F2A-004", reason:"學號與現有名冊記錄衝突" },
                      ].map(err => (
                        <div key={err.row} style={{ display:"flex", gap:8, padding:"4px 0",
                          borderBottom:"1px solid #FEF3C7", color:"#92400E" }}>
                          <span style={{ color:"#EF4444", fontWeight:700, minWidth:50 }}>Row {err.row}</span>
                          <span style={{ color:"#1D4ED8", minWidth:120 }}>{err.id}</span>
                          <span>{err.reason}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Modal Footer ── */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"14px 24px", borderTop:"1px solid #F1F5F9", background:"#F8FAFC" }}>
          <span style={{ fontSize:11, color:"#94A3B8", fontFamily:F }}>
            匯入後資料將寫入 2025/26 學年名冊
          </span>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <button onClick={onClose}
              style={{ padding:"8px 18px", borderRadius:9, border:"1px solid #E2E8F0",
                background:"transparent", color:"#475569", fontSize:13, fontFamily:F,
                cursor:"pointer", fontWeight:500, transition:"all 0.12s" }}
              onMouseEnter={e => { e.currentTarget.style.background="#F1F5F9"; }}
              onMouseLeave={e => { e.currentTarget.style.background="transparent"; }}>
              取消 Cancel
            </button>
            <div style={{ position:"relative" as const }}>
              <button
                disabled={!canImport}
                title={canImport ? undefined : "請先解決所有衝突後方可匯入"}
                style={{ display:"inline-flex", alignItems:"center", gap:7,
                  padding:"8px 20px", borderRadius:9, border:"none",
                  background: canImport ? "linear-gradient(135deg, #2563EB, #4F46E5)" : "#CBD5E1",
                  color: canImport ? "#fff" : "#94A3B8",
                  fontSize:13, fontWeight:700, fontFamily:F,
                  cursor: canImport ? "pointer" : "not-allowed",
                  boxShadow: canImport ? "0 2px 8px rgba(37,99,235,0.40)" : "none",
                  transition:"all 0.15s", position:"relative" as const }}>
                {canImport ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                確認並匯入 Confirm Import
              </button>
              {/* Tooltip hint when disabled */}
              {!canImport && (
                <div style={{ position:"absolute", bottom:"calc(100% + 7px)", right:0, whiteSpace:"nowrap" as const,
                  padding:"5px 10px", background:"#1E293B", borderRadius:7, fontSize:11, color:"#F1F5F9",
                  fontFamily:F, pointerEvents:"none", boxShadow:"0 4px 12px rgba(0,0,0,0.25)" }}>
                  請先解決 {DUP_COUNT} 筆衝突後方可匯入
                  <div style={{ position:"absolute", bottom:-4, right:18, width:8, height:4,
                    borderLeft:"4px solid transparent", borderRight:"4px solid transparent",
                    borderTop:"4px solid #1E293B" }} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
interface Props {
  lang?: "en" | "zh-HK";
  onViewStudent?: (studentId: string, ctx?: { classCode?: string }) => void;
}

export const Screen_StudentsbyYear: React.FC<Props> = ({
  lang = "zh-HK",
  onViewStudent,
}) => {
  const [privacyOn,   setPrivacyOn]   = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(["2025-F1A-001", "2025-F1A-002"])  // Epic 3: 2 rows pre-selected
  );
  const [revealedCells, setRevealedCells] = useState<Set<string>>(new Set());

  const [searchQ,      setSearchQ]      = useState("");
  const [filterAY,     setFilterAY]     = useState("2025/26");
  const [filterForm,   setFilterForm]   = useState("全部");
  const [filterClass,  setFilterClass]  = useState("全部");
  const [filterStatus, setFilterStatus] = useState("全部");
  const [page,         setPage]         = useState(1);
  const [isMobile,     setIsMobile]     = useState(false);

  const [showImportModal, setShowImportModal] = useState(false);

  // Epic 2: Paste List state
  const [pasteOpen,  setPasteOpen]  = useState(false);
  const [pasteText,  setPasteText]  = useState("");
  const [pasteChips, setPasteChips] = useState<{ id: string; label: string }[]>([
    { id: "c1", label: "2025-F1A-001" },
    { id: "c2", label: "2025-F1A-005" },
    { id: "c3", label: "林詩雅" },
    { id: "c4", label: "+2 更多" },
  ]);
  const pasteRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 840);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pasteRef.current && !pasteRef.current.contains(e.target as Node)) {
        setPasteOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const statusKeyMap: Record<string, StudentRow["status"] | null> = {
    "全部": null, "在學": "active", "重讀": "repeat", "停學": "suspended", "離校": "left",
  };

  const filtered = useMemo(() => {
    const q = searchQ.toLowerCase();
    return MOCK.filter(s => {
      if (filterForm !== "全部" && s.form !== filterForm) return false;
      if (filterClass !== "全部" && s.classCode !== filterClass) return false;
      const sk = statusKeyMap[filterStatus];
      if (sk && s.status !== sk) return false;
      if (q && !s.chName.includes(searchQ) && !s.enName.toLowerCase().includes(q) && !s.id.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [searchQ, filterForm, filterClass, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const start      = (safePage - 1) * PAGE_SIZE;
  const rows       = filtered.slice(start, Math.min(start + PAGE_SIZE, filtered.length));

  const totalRepeat  = MOCK.filter(s => s.isRepeat).length;
  const totalPending = MOCK.reduce((a, s) => a + s.pendingAwards, 0);
  const totalAlerts  = MOCK.filter(s => s.aiAlert !== "none").length;

  const allChecked  = rows.length > 0 && rows.every(r => selectedIds.has(r.id));
  const someChecked = rows.some(r => selectedIds.has(r.id)) && !allChecked;

  const toggleAll = () => {
    if (allChecked) {
      const next = new Set(selectedIds);
      rows.forEach(r => next.delete(r.id));
      setSelectedIds(next);
    } else {
      const next = new Set(selectedIds);
      rows.forEach(r => next.add(r.id));
      setSelectedIds(next);
    }
  };

  const toggleRow = (id: string) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  };

  const revealCell = (k: string) => setRevealedCells(s => new Set([...s, k]));
  const hideCell   = (k: string) => setRevealedCells(s => { const n = new Set(s); n.delete(k); return n; });

  const removeChip = (id: string) =>
    setPasteChips(prev => prev.filter(c => c.id !== id));

  const applyPaste = () => {
    const raw = pasteText.split(/[\n,\t]+/).map(s => s.trim()).filter(Boolean);
    const chips = raw.slice(0, 3).map((v, i) => ({ id: `p${Date.now()}-${i}`, label: v }));
    if (raw.length > 3) chips.push({ id: `p${Date.now()}-overflow`, label: `+${raw.length - 3} 更多` });
    setPasteChips(chips);
    setPasteText("");
    setPasteOpen(false);
  };

  // ── Grid column template ──────────────────────────────────────────────────
  const COLS = "44px 148px 1fr 84px 52px 130px 80px 104px 104px 128px";

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{
      fontFamily: DS.font, background: DS.g50,
      height: isMobile ? "auto" : "100%",
      minHeight: isMobile ? "100%" : undefined,
      overflowY: isMobile ? "visible" : "auto",
      padding: isMobile ? `16px 16px ${selectedIds.size > 0 ? 88 : 16}px` : 28,
      boxSizing: "border-box" as const,
      display: "flex", flexDirection: "column" as const, gap: 20,
      position: "relative" as const,
    }}>
      {showImportModal && <ImportModal onClose={() => setShowImportModal(false)} />}

      {/* ═══ HEADER ══════════════════════════════════════════════════════════ */}
      <div style={{
        display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        flexWrap: "wrap" as const, gap: 12,
      }}>
        {/* Title */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1 style={{
              margin: 0, fontSize: 22, fontWeight: 700,
              color: DS.g900, letterSpacing: "-0.4px", lineHeight: 1,
            }}>年度學生名冊</h1>
            <span style={{
              fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 5,
              background: DS.bluePale, color: DS.blue, border: `1px solid ${DS.blueBorder}`,
            }}>1.B.1</span>
          </div>
          <p style={{
            margin: "5px 0 0", fontSize: 13, color: DS.g500,
            fontFamily: DS.font,
          }}>
            AY {filterAY} · 全校學生 · {MOCK.length} 名
          </p>
        </div>

        {/* Action cluster */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const }}>

          {/* Epic 1: Privacy Toggle */}
          <div
            onClick={() => setPrivacyOn(v => !v)}
            style={{
              display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
              padding: "8px 14px", borderRadius: 10,
              background: privacyOn ? DS.amberPale : DS.white,
              border: `1.5px solid ${privacyOn ? DS.amber : DS.g200}`,
              transition: "all 0.15s",
              boxShadow: privacyOn ? `0 0 0 3px ${DS.amber}22` : "0 1px 3px rgba(0,0,0,0.06)",
            }}
          >
            {privacyOn
              ? <Shield size={15} color={DS.amber} />
              : <ShieldOff size={15} color={DS.g400} />
            }
            <span style={{
              fontSize: 12, fontWeight: 700,
              color: privacyOn ? DS.amberText : DS.g500,
            }}>隱私遮蔽</span>
            {/* Toggle pill */}
            <div style={{
              width: 38, height: 20, borderRadius: 10, position: "relative" as const,
              background: privacyOn ? DS.amber : DS.g300,
              transition: "background 0.2s", flexShrink: 0,
            }}>
              <div style={{
                position: "absolute" as const,
                top: 2, left: privacyOn ? 20 : 2,
                width: 16, height: 16, borderRadius: "50%", background: DS.white,
                transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.20)",
              }} />
            </div>
            <span style={{
              fontSize: 11, fontWeight: 800, minWidth: 24,
              color: privacyOn ? DS.amber : DS.g400,
            }}>{privacyOn ? "ON" : "OFF"}</span>
          </div>

          <div style={{ width: 1, height: 28, background: DS.g200 }} />

          <button style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 14px", borderRadius: 8,
            border: `1px solid ${DS.g200}`, background: DS.white,
            color: DS.g600, fontSize: 12.5, fontFamily: DS.font,
            cursor: "pointer", fontWeight: 500,
            boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
          }}>
            <RefreshCw size={13} />同步資料
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 14px", borderRadius: 8,
              border: `1px solid ${DS.blueBorder}`, background: DS.bluePale,
              color: DS.blue, fontSize: 12.5, fontFamily: DS.font,
              cursor: "pointer", fontWeight: 600,
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "#DBEAFE"; e.currentTarget.style.borderColor = "#93C5FD"; }}
            onMouseLeave={e => { e.currentTarget.style.background = DS.bluePale; e.currentTarget.style.borderColor = DS.blueBorder; }}
          >
            <Upload size={13} />📥 匯入名單
          </button>
          <button style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 16px", borderRadius: 8,
            border: "none", background: DS.blue,
            color: DS.white, fontSize: 12.5, fontFamily: DS.font,
            cursor: "pointer", fontWeight: 600,
            boxShadow: `0 1px 3px ${DS.blue}50`,
          }}>
            <Download size={13} />匯出名冊
          </button>
        </div>
      </div>

      {/* Epic 1: Privacy Active Banner */}
      {privacyOn && (
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "10px 16px", borderRadius: 10,
          background: DS.amberPale,
          border: `1px solid ${DS.amberBorder}`,
          borderLeft: `4px solid ${DS.amber}`,
        }}>
          <Shield size={14} color={DS.amber} style={{ flexShrink: 0 }} />
          <div>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: DS.amberText }}>
              隱私保護模式已啟動 Privacy Mode Active
            </span>
            <span style={{ fontSize: 11.5, color: "#B45309", marginLeft: 10 }}>
              姓名及學號已遮蔽，滑鼠懸停可臨時檢視 · Names and IDs masked — hover any cell to reveal
            </span>
          </div>
          <button
            onClick={() => setPrivacyOn(false)}
            style={{
              marginLeft: "auto", display: "flex", alignItems: "center", gap: 5,
              padding: "4px 10px", borderRadius: 6,
              border: `1px solid ${DS.amberBorder}`, background: DS.white,
              color: DS.amberText, fontSize: 11, fontFamily: DS.font, cursor: "pointer",
            }}
          >
            <EyeOff size={11} />停用
          </button>
        </div>
      )}

      {/* ═══ KPI CARDS ══════════════════════════════════════════════════════ */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
        gap: 12,
      }}>
        {[
          { label: "總人數", sub: "Total Students",   value: MOCK.length,   icon: Users,         color: DS.blue,    bg: DS.bluePale,    border: DS.blueBorder    },
          { label: "篩選人數", sub: "Filtered Count", value: filtered.length, icon: User,         color: "#7C3AED",  bg: "#EDE9FE",     border: "#C4B5FD"        },
          { label: "重讀人數", sub: "Repeaters",       value: totalRepeat,   icon: AlertTriangle, color: DS.amber,   bg: DS.amberPale,  border: DS.amberBorder   },
          { label: "AI 預警", sub: "AI Alerts",        value: totalAlerts,   icon: Sparkles,      color: DS.red,     bg: DS.redPale,    border: DS.redBorder     },
        ].map(c => (
          <div key={c.label} style={{
            background: DS.white, borderRadius: 12,
            border: `1px solid ${DS.g200}`, padding: "16px 18px",
            display: "flex", alignItems: "center", gap: 14,
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            transition: "box-shadow 0.15s",
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: c.bg, border: `1px solid ${c.border}`,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <c.icon size={18} color={c.color} />
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: DS.g900, lineHeight: 1 }}>{c.value}</div>
              <div style={{ fontSize: 11, color: DS.g500, marginTop: 3, fontWeight: 500 }}>
                {c.label} <span style={{ color: DS.g400 }}>· {c.sub}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ═══ FILTER + OMNIBAR ROW ════════════════════════════════════════════ */}
      <div style={{
        background: DS.white, borderRadius: 12,
        border: `1px solid ${DS.g200}`, padding: "14px 16px",
        display: "flex",
        alignItems: isMobile ? "stretch" : "flex-end" as const,
        flexDirection: isMobile ? "column" : "row" as const,
        gap: isMobile ? 10 : 12,
        flexWrap: isMobile ? "nowrap" : "wrap" as const,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}>
        {/* Filter dropdowns — 2-col grid on mobile, inline row on desktop */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, auto)",
          gap: isMobile ? 8 : 12,
          alignItems: "end",
        }}>
          <FilterSelect label="學年 AY"        value={filterAY}     options={AY_OPTS}     onChange={v => { setFilterAY(v);     setPage(1); }} width={isMobile ? "100%" : 108} />
          <FilterSelect label="年級 Form"      value={filterForm}   options={FORM_OPTS}   onChange={v => { setFilterForm(v);   setPage(1); }} width={isMobile ? "100%" : 100} />
          <FilterSelect label="班別 Class"     value={filterClass}  options={CLASS_OPTS}  onChange={v => { setFilterClass(v);  setPage(1); }} width={isMobile ? "100%" : 100} />
          <FilterSelect label="狀態 Status"    value={filterStatus} options={STATUS_OPTS} onChange={v => { setFilterStatus(v); setPage(1); }} width={isMobile ? "100%" : 108} />
        </div>

        {/* Divider — desktop only */}
        {!isMobile && <div style={{ width: 1, height: 36, background: DS.g200, alignSelf: "flex-end" }} />}

        {/* Epic 2: Smart Omnibar */}
        <div style={{ flex: 1, minWidth: isMobile ? 0 : 240 }} ref={pasteRef}>
          <div style={{ fontSize: 10.5, fontWeight: 600, color: DS.g500, marginBottom: 3, letterSpacing: "0.04em" }}>
            智能搜尋 Smart Search
          </div>
          <div style={{ position: "relative" as const, display: "flex", gap: 0 }}>
            {/* Search icon */}
            <div style={{
              position: "absolute" as const, left: 10, top: "50%", transform: "translateY(-50%)",
              display: "flex", alignItems: "center", pointerEvents: "none",
            }}>
              <Search size={14} color={DS.g400} />
            </div>
            <input
              ref={searchRef}
              value={searchQ}
              onChange={e => { setSearchQ(e.target.value); setPage(1); }}
              placeholder="搜尋姓名、學號或標籤…  Search names, IDs or tags…"
              style={{
                flex: 1, padding: "8px 12px 8px 34px",
                borderRadius: "8px 0 0 8px",
                border: `1.5px solid ${DS.g200}`,
                borderRight: "none",
                background: DS.white, color: DS.g800,
                fontSize: 12.5, fontFamily: DS.font, outline: "none",
                boxShadow: "inset 0 1px 2px rgba(0,0,0,0.03)",
              }}
            />
            {/* Paste List button */}
            <button
              onClick={() => setPasteOpen(v => !v)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 13px",
                borderRadius: "0 8px 8px 0",
                border: `1.5px solid ${pasteOpen ? DS.blue : DS.g200}`,
                background: pasteOpen ? DS.bluePale : DS.g50,
                color: pasteOpen ? DS.blue : DS.g600,
                fontSize: 12, fontFamily: DS.font, cursor: "pointer",
                fontWeight: 600, whiteSpace: "nowrap" as const,
                transition: "all 0.1s",
              }}
            >
              <ClipboardList size={13} />
              貼上名單
            </button>

            {/* Paste popover */}
            {pasteOpen && (
              <div style={{
                position: "absolute" as const, top: "calc(100% + 8px)", right: 0,
                width: 340, background: DS.white,
                border: `1.5px solid ${DS.blueBorder}`,
                borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                zIndex: 500, overflow: "hidden",
              }}>
                <div style={{ padding: "12px 14px 10px", borderBottom: `1px solid ${DS.g100}` }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: DS.g800 }}>貼上批量名單</div>
                  <div style={{ fontSize: 11, color: DS.g500, marginTop: 2 }}>
                    貼上以逗號、Tab 或換行分隔的學號或姓名 · Paste comma/tab/newline-separated IDs or names
                  </div>
                </div>
                <div style={{ padding: "10px 14px" }}>
                  <textarea
                    value={pasteText}
                    onChange={e => setPasteText(e.target.value)}
                    placeholder={"例如：2025-F1A-001, 2025-F1A-003\n陳大文, 黃美怡"}
                    rows={4}
                    style={{
                      width: "100%", padding: "8px 10px", borderRadius: 8,
                      border: `1px solid ${DS.g200}`, background: DS.g50,
                      fontSize: 12, fontFamily: DS.mono, color: DS.g700,
                      outline: "none", resize: "none", boxSizing: "border-box" as const,
                    }}
                  />
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button
                      onClick={applyPaste}
                      style={{
                        flex: 1, padding: "7px 0", borderRadius: 7,
                        background: DS.blue, border: "none", color: DS.white,
                        fontSize: 12, fontWeight: 600, fontFamily: DS.font, cursor: "pointer",
                      }}
                    >套用篩選 Apply Filter</button>
                    <button
                      onClick={() => setPasteOpen(false)}
                      style={{
                        padding: "7px 14px", borderRadius: 7,
                        background: DS.g50, border: `1px solid ${DS.g200}`,
                        color: DS.g600, fontSize: 12, fontFamily: DS.font, cursor: "pointer",
                      }}
                    >取消</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Epic 2: Paste chips row */}
          {pasteChips.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, flexWrap: "wrap" as const }}>
              <span style={{ fontSize: 10.5, color: DS.g500, fontWeight: 600 }}>名單篩選：</span>
              {pasteChips.map(chip => {
                const isOverflow = chip.label.startsWith("+");
                return (
                  <div key={chip.id} style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    padding: "3px 9px", borderRadius: 9999,
                    background: isOverflow ? DS.g100 : DS.bluePale,
                    border: `1px solid ${isOverflow ? DS.g200 : DS.blueBorder}`,
                    fontSize: 11, fontWeight: 600,
                    color: isOverflow ? DS.g600 : DS.blue,
                  }}>
                    {chip.label}
                    {!isOverflow && (
                      <button
                        onClick={() => removeChip(chip.id)}
                        style={{
                          display: "flex", background: "none", border: "none",
                          padding: 0, cursor: "pointer", color: DS.blue, lineHeight: 1,
                        }}
                      ><X size={10} /></button>
                    )}
                  </div>
                );
              })}
              <button
                onClick={() => setPasteChips([])}
                style={{
                  fontSize: 10.5, color: DS.g500, background: "none",
                  border: "none", cursor: "pointer", textDecoration: "underline",
                  fontFamily: DS.font,
                }}
              >清除全部</button>
            </div>
          )}
        </div>

        {/* Filter count indicator */}
        {(filterForm !== "全部" || filterClass !== "全部" || filterStatus !== "全部" || searchQ) && (
          <div style={{
            display: "flex", alignItems: "center", gap: 5, alignSelf: "flex-end",
            padding: "8px 12px", borderRadius: 8,
            background: DS.bluePale, border: `1px solid ${DS.blueBorder}`,
          }}>
            <SlidersHorizontal size={12} color={DS.blue} />
            <span style={{ fontSize: 12, fontWeight: 700, color: DS.blue }}>{filtered.length} 項結果</span>
          </div>
        )}
      </div>

      {/* ═══ DATA TABLE ══════════════════════════════════════════════════════ */}
      <div style={{
        background: DS.white, borderRadius: 12,
        border: `1px solid ${DS.g200}`, overflow: "hidden",
        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
      }}>
        <div style={{ overflowX: isMobile ? "visible" : "auto" as const }}>
          {isMobile ? (
            /* ── Mobile card list ────────────────────────────────────────────── */
            <div>
              {/* Mobile select-all header */}
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "8px 16px",
                background: DS.g50, borderBottom: `1px solid ${DS.g200}`,
              }}>
                <CB checked={allChecked} indeterminate={someChecked} onChange={e => { e.stopPropagation(); toggleAll(); }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: DS.g500, fontFamily: DS.font }}>
                  全選本頁 · Select All
                </span>
              </div>
              {rows.length === 0 ? (
                <div style={{ padding: "52px 20px", textAlign: "center" as const, color: DS.g400, fontSize: 14, fontFamily: DS.font }}>
                  沒有符合條件的學生記錄 · No students match the current filters
                </div>
              ) : rows.map((s, idx) => {
                const isSelected = selectedIds.has(s.id);
                const isRepeat   = s.isRepeat;
                const rowBg = isSelected ? DS.rowSelected : isRepeat ? DS.rowRepeat : DS.white;
                return (
                  <div
                    key={s.id}
                    onClick={() => toggleRow(s.id)}
                    style={{
                      padding: "12px 16px",
                      borderBottom: idx < rows.length - 1 ? `1px solid ${DS.g100}` : undefined,
                      background: rowBg,
                      borderLeft: isSelected ? `3px solid ${DS.blue}` : "3px solid transparent",
                      cursor: "pointer",
                      transition: "background 0.1s",
                    }}
                  >
                    {/* Line 1: checkbox + name + view button */}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <div style={{ paddingTop: 2, flexShrink: 0 }}>
                        <CB checked={isSelected} onChange={e => { e.stopPropagation(); toggleRow(s.id); }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <PrivacyCell
                          privacyOn={privacyOn} cellKey={`${s.id}-name`}
                          revealed={revealedCells} onReveal={revealCell} onHide={hideCell}
                          masked={
                            <>
                              <div style={{ fontSize: 14, fontWeight: 700, color: DS.g700 }}>{maskChName(s.chName)}</div>
                              <div style={{ fontSize: 11, color: DS.g400, marginTop: 1 }}>{maskEnName(s.enName)}</div>
                            </>
                          }
                        >
                          <div style={{ fontSize: 14, fontWeight: 700, color: DS.g900 }}>{s.chName}</div>
                          <div style={{ fontSize: 11, color: DS.g500, marginTop: 1 }}>{s.enName}</div>
                        </PrivacyCell>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); onViewStudent?.(s.id); }}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 5,
                          padding: "5px 10px", borderRadius: 7,
                          border: `1px solid ${DS.blueBorder}`,
                          background: DS.bluePale, color: DS.blue,
                          fontSize: 11.5, fontWeight: 600, fontFamily: DS.font,
                          cursor: "pointer", whiteSpace: "nowrap" as const, flexShrink: 0,
                        }}
                      >
                        <Eye size={11} />檔案
                      </button>
                    </div>
                    {/* Line 2: student ID */}
                    <div style={{ paddingLeft: 26, marginTop: 6 }}>
                      <PrivacyCell
                        privacyOn={privacyOn} cellKey={`${s.id}-id`}
                        revealed={revealedCells} onReveal={revealCell} onHide={hideCell}
                        masked={
                          <span style={{ fontFamily: DS.mono, fontSize: 11, color: DS.g400, letterSpacing: "0.02em" }}>{maskId(s.id)}</span>
                        }
                      >
                        <span style={{ fontFamily: DS.mono, fontSize: 11, color: DS.blue, fontWeight: 600, letterSpacing: "0.02em" }}>{s.id}</span>
                      </PrivacyCell>
                    </div>
                    {/* Line 3: badges */}
                    <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 5, paddingLeft: 26, marginTop: 7 }}>
                      <span style={{
                        padding: "2px 8px", borderRadius: 5,
                        background: DS.bluePale, color: DS.blue,
                        border: `1px solid ${DS.blueBorder}`,
                        fontSize: 11, fontWeight: 700,
                      }}>{s.classCode} · #{s.classNum}</span>
                      <StatusBadge status={s.status} />
                      {s.isRepeat && (
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 3,
                          padding: "2px 7px", borderRadius: 9999,
                          background: DS.amberPale, color: DS.amberText,
                          border: `1px solid ${DS.amberBorder}`,
                          fontSize: 10.5, fontWeight: 700,
                        }}>
                          <AlertTriangle size={9} />重讀
                        </span>
                      )}
                      <AIAlertCell alert={s.aiAlert} />
                      {s.pendingAwards > 0 && <PendingBadge count={s.pendingAwards} />}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ── Desktop grid table ──────────────────────────────────────────── */
            <div style={{ minWidth: 1060 }}>

              {/* Table header */}
              <div style={{
                display: "grid", gridTemplateColumns: COLS,
                padding: "0 16px",
                background: DS.g50,
                borderBottom: `1.5px solid ${DS.g200}`,
                alignItems: "center", height: 40,
              }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <CB checked={allChecked} indeterminate={someChecked} onChange={e => { e.stopPropagation(); toggleAll(); }} />
                </div>
                <TH>學號 Student ID</TH>
                <TH>姓名 Name</TH>
                <TH>班別 Class</TH>
                <TH>班號</TH>
                <TH>學籍狀態 Status</TH>
                <TH>重讀</TH>
                <TH>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Sparkles size={10} color={DS.red} />
                    AI 預警
                  </span>
                </TH>
                <TH>待審成就</TH>
                <TH>操作</TH>
              </div>

              {/* Rows */}
              {rows.length === 0 ? (
                <div style={{
                  padding: "52px 20px", textAlign: "center" as const,
                  color: DS.g400, fontSize: 14, fontFamily: DS.font,
                }}>
                  沒有符合條件的學生記錄 · No students match the current filters
                </div>
              ) : rows.map((s, idx) => {
                const isSelected = selectedIds.has(s.id);
                const isRepeat   = s.isRepeat;
                const rowBg = isSelected ? DS.rowSelected
                            : isRepeat   ? DS.rowRepeat
                            :              DS.white;

                return (
                  <div
                    key={s.id}
                    style={{
                      display: "grid", gridTemplateColumns: COLS,
                      padding: "0 16px",
                      borderBottom: idx < rows.length - 1 ? `1px solid ${DS.g100}` : undefined,
                      background: rowBg,
                      height: DS.rowH, alignItems: "center",
                      borderLeft: isSelected ? `3px solid ${DS.blue}` : "3px solid transparent",
                      transition: "background 0.1s",
                      cursor: "pointer",
                    }}
                    onMouseEnter={e => {
                      if (!isSelected && !isRepeat)
                        (e.currentTarget as HTMLDivElement).style.background = DS.g50;
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLDivElement).style.background = rowBg;
                    }}
                    onClick={() => toggleRow(s.id)}
                  >
                    {/* Checkbox */}
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <CB checked={isSelected} onChange={e => { e.stopPropagation(); toggleRow(s.id); }} />
                    </div>

                    {/* Student ID */}
                    <div>
                      <PrivacyCell
                        privacyOn={privacyOn} cellKey={`${s.id}-id`}
                        revealed={revealedCells} onReveal={revealCell} onHide={hideCell}
                        masked={
                          <span style={{ fontFamily: DS.mono, fontSize: 11.5, color: DS.g400, letterSpacing: "0.02em" }}>
                            {maskId(s.id)}
                          </span>
                        }
                      >
                        <span style={{ fontFamily: DS.mono, fontSize: 11.5, color: DS.blue, fontWeight: 600, letterSpacing: "0.02em" }}>
                          {s.id}
                        </span>
                      </PrivacyCell>
                    </div>

                    {/* Name */}
                    <div>
                      <PrivacyCell
                        privacyOn={privacyOn} cellKey={`${s.id}-name`}
                        revealed={revealedCells} onReveal={revealCell} onHide={hideCell}
                        masked={
                          <>
                            <div style={{ fontSize: 13, fontWeight: 600, color: DS.g700 }}>{maskChName(s.chName)}</div>
                            <div style={{ fontSize: 11, color: DS.g400, marginTop: 1 }}>{maskEnName(s.enName)}</div>
                          </>
                        }
                      >
                        <div style={{ fontSize: 13, fontWeight: 600, color: DS.g900 }}>{s.chName}</div>
                        <div style={{ fontSize: 11, color: DS.g500, marginTop: 1 }}>{s.enName}</div>
                      </PrivacyCell>
                    </div>

                    {/* Class badge */}
                    <div>
                      <span style={{
                        padding: "3px 9px", borderRadius: 6,
                        background: DS.bluePale, color: DS.blue,
                        border: `1px solid ${DS.blueBorder}`,
                        fontSize: 12, fontWeight: 700,
                      }}>{s.classCode}</span>
                    </div>

                    {/* Class number */}
                    <div style={{ fontSize: 13, color: DS.g600, fontWeight: 500 }}>{s.classNum}</div>

                    {/* Status */}
                    <div><StatusBadge status={s.status} /></div>

                    {/* Repeat flag */}
                    <div>
                      {s.isRepeat
                        ? <span style={{
                            display: "inline-flex", alignItems: "center", gap: 3,
                            padding: "3px 8px", borderRadius: 9999,
                            background: DS.amberPale, color: DS.amberText,
                            border: `1px solid ${DS.amberBorder}`,
                            fontSize: 10.5, fontWeight: 700,
                          }}>
                            <AlertTriangle size={9} />重讀
                          </span>
                        : <span style={{ color: DS.g300, fontSize: 13 }}>—</span>
                      }
                    </div>

                    {/* AI Alert */}
                    <div><AIAlertCell alert={s.aiAlert} /></div>

                    {/* Pending Awards */}
                    <div><PendingBadge count={s.pendingAwards} /></div>

                    {/* Row actions */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <button
                        onClick={e => { e.stopPropagation(); onViewStudent?.(s.id); }}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 5,
                          padding: "5px 10px", borderRadius: 7,
                          border: `1px solid ${DS.blueBorder}`,
                          background: DS.bluePale, color: DS.blue,
                          fontSize: 11.5, fontWeight: 600, fontFamily: DS.font,
                          cursor: "pointer", whiteSpace: "nowrap" as const,
                        }}
                      >
                        <Eye size={11} />檔案
                      </button>
                      <button
                        onClick={e => e.stopPropagation()}
                        style={{
                          display: "inline-flex", alignItems: "center", justifyContent: "center",
                          width: 28, height: 28, borderRadius: 7,
                          border: `1px solid ${DS.g200}`, background: DS.white,
                          color: DS.g500, cursor: "pointer", flexShrink: 0,
                        }}
                      >
                        <MoreHorizontal size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination footer */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "11px 20px", borderTop: `1px solid ${DS.g100}`,
          background: DS.g50,
        }}>
          <span style={{ fontSize: 12, color: DS.g500, fontFamily: DS.font }}>
            {filtered.length > 0
              ? `顯示 ${start + 1}–${Math.min(start + PAGE_SIZE, filtered.length)} 項，共 ${filtered.length} 項`
              : "無結果"}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button
              disabled={safePage <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                padding: "6px 11px", borderRadius: 7,
                border: `1px solid ${DS.g200}`,
                background: safePage <= 1 ? DS.g50 : DS.white,
                color: safePage <= 1 ? DS.g300 : DS.g600,
                fontSize: 12, fontFamily: DS.font,
                cursor: safePage <= 1 ? "default" : "pointer",
              }}
            ><ChevronLeft size={13} />上一頁</button>
            <span style={{
              fontSize: 12, color: DS.g600, padding: "5px 10px",
              background: DS.white, border: `1px solid ${DS.g200}`,
              borderRadius: 7, fontWeight: 600,
            }}>
              {safePage} / {totalPages}
            </span>
            <button
              disabled={safePage >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                padding: "6px 11px", borderRadius: 7,
                border: `1px solid ${DS.g200}`,
                background: safePage >= totalPages ? DS.g50 : DS.white,
                color: safePage >= totalPages ? DS.g300 : DS.g600,
                fontSize: 12, fontFamily: DS.font,
                cursor: safePage >= totalPages ? "default" : "pointer",
              }}
            >下一頁<ChevronRight size={13} /></button>
          </div>
        </div>
      </div>

      {/* ═══ EPIC 3: FLOATING BULK ACTION BAR ═══════════════════════════════ */}
      {selectedIds.size > 0 && (
        <div style={isMobile ? {
          position: "fixed" as const, bottom: 0, left: 0, right: 0,
          background: DS.fabBg,
          borderRadius: "12px 12px 0 0",
          padding: "12px 16px 20px",
          display: "flex", alignItems: "center", gap: 4,
          boxShadow: "0 -4px 24px rgba(0,0,0,0.30)",
          zIndex: 9999,
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.10)",
          borderBottom: "none",
          animation: "fabIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
          overflowX: "auto" as const,
        } : {
          position: "fixed" as const, bottom: 32, left: "50%",
          transform: "translateX(-50%)",
          background: DS.fabBg, borderRadius: 9999,
          padding: "12px 20px",
          display: "flex", alignItems: "center", gap: 4,
          boxShadow: "0 8px 40px rgba(0,0,0,0.30), 0 2px 8px rgba(0,0,0,0.20)",
          zIndex: 9999,
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.10)",
          animation: "fabIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}>
          {/* Selection count */}
          <div style={{ display: "flex", alignItems: "center", gap: 7, paddingRight: 12 }}>
            <div style={{
              width: 22, height: 22, borderRadius: "50%",
              background: DS.blue, display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: DS.white }}>
                {selectedIds.size}
              </span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#E2E8F0", whiteSpace: "nowrap" as const }}>
              {selectedIds.size === 1 ? "1 名學生已選取" : `${selectedIds.size} 名學生已選取`}
            </span>
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 22, background: "rgba(255,255,255,0.15)", margin: "0 8px" }} />

          {/* Action buttons */}
          {[
            { icon: <FolderPlus size={14} />, zh: "加至群組", en: "Add to Group",    color: "#93C5FD" },
            { icon: <Trophy       size={14} />, zh: "派發積點", en: "Award Points",   color: "#FCD34D" },
            { icon: <Download     size={14} />, zh: "匯出",     en: "Export",         color: "#6EE7B7" },
          ].map(btn => (
            <button
              key={btn.zh}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "7px 13px", borderRadius: 8,
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: DS.white, fontSize: 12.5, fontFamily: DS.font,
                cursor: "pointer", fontWeight: 600,
                whiteSpace: "nowrap" as const,
                transition: "background 0.1s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
            >
              <span style={{ color: btn.color }}>{btn.icon}</span>
              {btn.zh}
            </button>
          ))}

          {/* Divider */}
          <div style={{ width: 1, height: 22, background: "rgba(255,255,255,0.15)", margin: "0 4px" }} />

          {/* Clear selection */}
          <button
            onClick={() => setSelectedIds(new Set())}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 32, height: 32, borderRadius: "50%",
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#94A3B8", cursor: "pointer",
              transition: "all 0.1s", flexShrink: 0,
            }}
            onMouseEnter={e => {
              (e.currentTarget.style.background = "rgba(239,68,68,0.25)");
              (e.currentTarget.style.color = "#FCA5A5");
            }}
            onMouseLeave={e => {
              (e.currentTarget.style.background = "rgba(255,255,255,0.08)");
              (e.currentTarget.style.color = "#94A3B8");
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* FAB entrance animation keyframe */}
      <style>{`
        @keyframes fabIn {
          from { opacity: 0; transform: translateX(-50%) translateY(12px) scale(0.95); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0)    scale(1);    }
        }
      `}</style>
    </div>
  );
};
