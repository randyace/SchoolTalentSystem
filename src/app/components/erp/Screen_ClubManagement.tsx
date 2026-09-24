// ─────────────────────────────────────────────────────────────────────────────
// Screen 1.D.8  學會管理 / Club & Society Management
// Two connected frames: Club List (grid) → Club Roster (drill-down)
// Many-to-many: one student can join multiple clubs.
// UX Guardrails: Friction · State Sync · Foolproofing · Routing & Immersion
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useRef } from "react";
import { ERP } from "./erpTokens";
import {
  Users, CalendarDays, ChevronRight, Search, Copy, UserPlus,
  ArrowLeft, Trash2, Check, ChevronDown, Home, RefreshCw,
  Shield, Star, Award, Zap, Music2, Camera, Monitor,
  Leaf, Heart, Dumbbell, X, AlertTriangle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ClubInfo {
  id:           string;
  zhName:       string;
  enName:       string;
  category:     "arts" | "tech" | "sports" | "service" | "academic" | "culture";
  teacher:      string;
  memberCount:  number;
  ongoingEvents:number;
  founded:      string;
}

interface ClubMember {
  id:        string;
  chName:    string;
  enName:    string;
  studentId: string;
  classCode: string;
  role:      "主席" | "副主席" | "幹事" | "會員";
  joinDate:  string;
  status:    "active" | "suspended" | "withdrawn";
}

// ─── Static Data ──────────────────────────────────────────────────────────────
const CLUBS: ClubInfo[] = [
  { id:"photo",   zhName:"攝影學會",   enName:"Photography Club",   category:"arts",     teacher:"陳嘉樂", memberCount:28, ongoingEvents:2, founded:"2019" },
  { id:"cs",      zhName:"電腦學會",   enName:"Computer Society",   category:"tech",     teacher:"黃志聰", memberCount:45, ongoingEvents:3, founded:"2015" },
  { id:"music",   zhName:"音樂學會",   enName:"Music Society",      category:"arts",     teacher:"李雅詩", memberCount:32, ongoingEvents:1, founded:"2012" },
  { id:"debate",  zhName:"辯論學會",   enName:"Debate Society",     category:"academic", teacher:"張曉雯", memberCount:18, ongoingEvents:2, founded:"2017" },
  { id:"green",   zhName:"環保學會",   enName:"Green Earth Society",category:"service",  teacher:"陳美儀", memberCount:22, ongoingEvents:1, founded:"2020" },
  { id:"vol",     zhName:"義工服務隊", enName:"Volunteer Team",     category:"service",  teacher:"黎志明", memberCount:35, ongoingEvents:0, founded:"2016" },
  { id:"drama",   zhName:"戲劇學會",   enName:"Drama Society",      category:"culture",  teacher:"張曉琳", memberCount:24, ongoingEvents:1, founded:"2014" },
  { id:"sports",  zhName:"體育學會",   enName:"Sports Association", category:"sports",   teacher:"林偉業", memberCount:56, ongoingEvents:4, founded:"2010" },
];

const CLUB_ROSTERS: Record<string, ClubMember[]> = {
  photo: [
    { id:"cm-001", chName:"陳大文", enName:"Chan Tai Man",    studentId:"2025-F1A-001", classCode:"F1A", role:"主席",   joinDate:"2024-09-01", status:"active" },
    { id:"cm-002", chName:"黃美怡", enName:"Wong Mei Yi",     studentId:"2025-F1A-002", classCode:"F1A", role:"副主席", joinDate:"2024-09-01", status:"active" },
    { id:"cm-003", chName:"李家豪", enName:"Lee Ka Ho",       studentId:"2025-F1A-003", classCode:"F1A", role:"幹事",   joinDate:"2024-09-15", status:"active" },
    { id:"cm-004", chName:"劉曉峰", enName:"Lau Hiu Fung",   studentId:"2025-F1B-004", classCode:"F1B", role:"幹事",   joinDate:"2024-10-01", status:"active" },
    { id:"cm-005", chName:"林詩雅", enName:"Lam Sze Nga",    studentId:"2025-F2A-005", classCode:"F2A", role:"會員",   joinDate:"2024-10-15", status:"active" },
    { id:"cm-006", chName:"張俊傑", enName:"Cheung Chun Kit",studentId:"2025-F1B-003", classCode:"F1B", role:"會員",   joinDate:"2024-11-01", status:"active" },
    { id:"cm-007", chName:"吳敏兒", enName:"Ng Man Yi",      studentId:"2025-F2B-006", classCode:"F2B", role:"會員",   joinDate:"2024-11-15", status:"suspended" },
    { id:"cm-008", chName:"鄭博文", enName:"Cheng Pok Man",  studentId:"2025-F1A-008", classCode:"F1A", role:"會員",   joinDate:"2025-01-10", status:"active" },
    { id:"cm-009", chName:"何紫晴", enName:"Ho Tsz Ching",   studentId:"2025-F2A-009", classCode:"F2A", role:"會員",   joinDate:"2025-01-20", status:"active" },
  ],
  cs: [
    { id:"cs-001", chName:"梁嘉駿", enName:"Leung Ka Chun",  studentId:"2025-F1A-010", classCode:"F1A", role:"主席",   joinDate:"2024-09-01", status:"active" },
    { id:"cs-002", chName:"鄭浩南", enName:"Cheng Ho Nam",   studentId:"2025-F1B-001", classCode:"F1B", role:"副主席", joinDate:"2024-09-01", status:"active" },
    { id:"cs-003", chName:"謝嘉麗", enName:"Tse Ka Lai",     studentId:"2025-F2A-001", classCode:"F2A", role:"幹事",   joinDate:"2024-09-10", status:"active" },
  ],
  debate: [
    { id:"db-001", chName:"彭俊賢", enName:"Pang Chun Yin",  studentId:"2025-F2A-002", classCode:"F2A", role:"主席",   joinDate:"2024-09-01", status:"active" },
    { id:"db-002", chName:"徐婉婷", enName:"Tsui Yuen Ting", studentId:"2025-F2A-003", classCode:"F2A", role:"幹事",   joinDate:"2024-09-01", status:"active" },
  ],
};

const ROLE_OPTIONS: { role: ClubMember["role"]; tier: string; color: string; bg: string; bd: string }[] = [
  { role:"主席",   tier:"T3", color:"#7C3AED", bg:"#EDE9FE", bd:"#C4B5FD" },
  { role:"副主席", tier:"T3", color:"#4F46E5", bg:"#EEF2FF", bd:"#A5B4FC" },
  { role:"幹事",   tier:"T2", color:"#0891B2", bg:"#E0F2FE", bd:"#7DD3FC" },
  { role:"會員",   tier:"T1", color:"#475569", bg:"#F1F5F9", bd:"#CBD5E1" },
];

const STATUS_OPTIONS: { status: ClubMember["status"]; zhLabel: string; color: string; bg: string; bd: string }[] = [
  { status:"active",    zhLabel:"活躍",   color:"#065F46", bg:"#D1FAE5", bd:"#6EE7B7" },
  { status:"suspended", zhLabel:"暫停",   color:"#92400E", bg:"#FEF3C7", bd:"#FCD34D" },
  { status:"withdrawn", zhLabel:"已退會", color:"#991B1B", bg:"#FEE2E2", bd:"#FCA5A5" },
];

const ADD_POOL = [
  { id:"2025-F2B-001", chName:"余志遠", enName:"Yu Chi Yuen",  classCode:"F2B" },
  { id:"2025-F2B-002", chName:"劉嘉欣", enName:"Lau Ka Yan",   classCode:"F2B" },
  { id:"2025-F2B-003", chName:"黃紫嫣", enName:"Wong Tsz Yin", classCode:"F2B" },
  { id:"2025-F1B-005", chName:"馬麗珊", enName:"Ma Lai San",   classCode:"F1B" },
];

// ─── Design helpers ───────────────────────────────────────────────────────────
const CATEGORY_STYLE: Record<ClubInfo["category"], { bg: string; color: string; icon: React.ReactNode; accent: string }> = {
  arts:     { bg:"#FFF7ED", color:"#C2410C", icon:<Camera   size={22} />, accent:"#F97316" },
  tech:     { bg:"#EFF6FF", color:"#1D4ED8", icon:<Monitor  size={22} />, accent:"#3B82F6" },
  sports:   { bg:"#ECFDF5", color:"#065F46", icon:<Dumbbell size={22} />, accent:"#10B981" },
  service:  { bg:"#F0FDF4", color:"#15803D", icon:<Heart    size={22} />, accent:"#22C55E" },
  academic: { bg:"#EDE9FE", color:"#5B21B6", icon:<Star     size={22} />, accent:"#7C3AED" },
  culture:  { bg:"#FDF4FF", color:"#86198F", icon:<Music2   size={22} />, accent:"#A21CAF" },
};

function roleConfig(role: ClubMember["role"]) {
  return ROLE_OPTIONS.find(r => r.role === role) ?? ROLE_OPTIONS[3];
}
function statusConfig(status: ClubMember["status"]) {
  return STATUS_OPTIONS.find(s => s.status === status) ?? STATUS_OPTIONS[0];
}

// ─── Batch Paste Modal ────────────────────────────────────────────────────────
const BatchPasteModal: React.FC<{ clubName: string; onClose: () => void }> = ({ clubName, onClose }) => {
  const [text, setText] = useState("");
  const F = ERP.font.family;
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.60)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:24 }} onClick={onClose}>
      <div style={{ background:ERP.colors.surface, borderRadius:ERP.radius.xl, width:"100%", maxWidth:520, boxShadow:ERP.shadow.xl, overflow:"hidden" }} onClick={e => e.stopPropagation()}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 24px", borderBottom:`1px solid ${ERP.colors.border}` }}>
          <div>
            <div style={{ fontSize:16, fontWeight:700, color:ERP.colors.textPrimary, fontFamily:F }}>批量貼上名單</div>
            <div style={{ fontSize:12, color:ERP.colors.textMuted, marginTop:3, fontFamily:F }}>Batch Paste — {clubName}</div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:`1px solid ${ERP.colors.border}`, borderRadius:ERP.radius.sm, padding:5, cursor:"pointer", display:"flex" }}><X size={15} color={ERP.colors.textMuted} /></button>
        </div>
        <div style={{ padding:"20px 24px" }}>
          <p style={{ margin:"0 0 12px", fontSize:12.5, color:ERP.colors.textSecondary, fontFamily:F, lineHeight:1.6 }}>
            每行一名學生，格式：<code style={{ background:ERP.colors.pageBg, padding:"1px 5px", borderRadius:4, fontFamily:ERP.font.mono, fontSize:11 }}>學號 姓名 職銜</code>
          </p>
          <div style={{ padding:"8px 12px", background:"#EFF6FF", border:"1px solid #BFDBFE", borderRadius:ERP.radius.md, marginBottom:14, display:"flex", alignItems:"flex-start", gap:7 }}>
            <Shield size={13} color="#1D4ED8" style={{ flexShrink:0, marginTop:1 }} />
            <span style={{ fontSize:11.5, color:"#1D4ED8", fontFamily:F, fontWeight:600 }}>系統將自動過濾重複名單 · Duplicates will be auto-filtered</span>
          </div>
          <textarea value={text} onChange={e => setText(e.target.value)} placeholder={"2025-F1A-001 陳大文 主席\n2025-F1B-002 李美玲 會員\n2025-F2A-003 張偉明 幹事"} rows={7}
            style={{ width:"100%", boxSizing:"border-box" as const, padding:"10px 12px", border:`1px solid ${ERP.colors.border}`, borderRadius:ERP.radius.md, resize:"vertical" as const, fontFamily:ERP.font.mono, fontSize:12.5, color:ERP.colors.textPrimary, outline:"none" }} />
          <div style={{ fontSize:11, color:ERP.colors.textMuted, marginTop:4, fontFamily:F }}>{text.length} 字元</div>
        </div>
        <div style={{ display:"flex", gap:10, justifyContent:"flex-end", padding:"14px 24px", borderTop:`1px solid ${ERP.colors.border}`, background:ERP.colors.pageBg }}>
          <button onClick={onClose} style={{ padding:"8px 18px", border:`1px solid ${ERP.colors.border}`, borderRadius:ERP.radius.md, background:"transparent", color:ERP.colors.textSecondary, fontSize:13, fontFamily:F, cursor:"pointer" }}>取消 Cancel</button>
          <button style={{ padding:"8px 20px", border:"none", borderRadius:ERP.radius.md, background:ERP.colors.accent, color:"#fff", fontSize:13, fontWeight:700, fontFamily:F, cursor:"pointer", boxShadow:`0 2px 8px ${ERP.colors.accent}40` }}>
            <Check size={13} style={{ display:"inline", marginRight:5, verticalAlign:"middle" }} />匯入預覽
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Add Member Modal ─────────────────────────────────────────────────────────
const AddMemberModal: React.FC<{ clubName: string; onClose: () => void; onAdd: (m: typeof ADD_POOL[0]) => void }> = ({ clubName, onClose, onAdd }) => {
  const [search, setSearch] = useState("");
  const F = ERP.font.family;
  const filtered = ADD_POOL.filter(s => !search || s.chName.includes(search) || s.id.includes(search));
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.60)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:24 }} onClick={onClose}>
      <div style={{ background:ERP.colors.surface, borderRadius:ERP.radius.xl, width:"100%", maxWidth:480, boxShadow:ERP.shadow.xl, overflow:"hidden" }} onClick={e => e.stopPropagation()}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 24px", borderBottom:`1px solid ${ERP.colors.border}` }}>
          <div>
            <div style={{ fontSize:16, fontWeight:700, color:ERP.colors.textPrimary, fontFamily:F }}>加入學生</div>
            <div style={{ fontSize:12, color:ERP.colors.textMuted, marginTop:3, fontFamily:F }}>Add Student to {clubName}</div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:`1px solid ${ERP.colors.border}`, borderRadius:ERP.radius.sm, padding:5, cursor:"pointer", display:"flex" }}><X size={15} color={ERP.colors.textMuted} /></button>
        </div>
        <div style={{ padding:"16px 24px" }}>
          <div style={{ position:"relative", marginBottom:12 }}>
            <Search size={13} style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:ERP.colors.textMuted, pointerEvents:"none" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜尋學生姓名或學號…" style={{ width:"100%", boxSizing:"border-box" as const, padding:"8px 10px 8px 30px", border:`1px solid ${ERP.colors.border}`, borderRadius:ERP.radius.md, fontSize:13, fontFamily:F, outline:"none" }} />
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:1, maxHeight:220, overflowY:"auto" }}>
            {filtered.map(s => (
              <div key={s.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 12px", borderRadius:ERP.radius.md, transition:"background 0.1s", cursor:"pointer" }}
                onMouseEnter={e => (e.currentTarget.style.background = ERP.colors.accentPale)}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                <div>
                  <span style={{ fontWeight:600, fontSize:13.5, color:ERP.colors.textPrimary, fontFamily:F }}>{s.chName}</span>
                  <span style={{ marginLeft:8, fontSize:11, color:ERP.colors.textMuted, fontFamily:F }}>{s.classCode}</span>
                  <div style={{ fontSize:10.5, color:ERP.colors.textMuted, fontFamily:ERP.font.mono, marginTop:1 }}>{s.id}</div>
                </div>
                <button onClick={() => onAdd(s)} style={{ padding:"5px 14px", border:"none", borderRadius:ERP.radius.sm, background:ERP.colors.accent, color:"#fff", fontSize:12, fontWeight:700, fontFamily:F, cursor:"pointer" }}>加入</button>
              </div>
            ))}
            {filtered.length === 0 && <div style={{ padding:"20px 0", textAlign:"center" as const, color:ERP.colors.textMuted, fontSize:13, fontFamily:F }}>找不到符合的學生</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Club Card ────────────────────────────────────────────────────────────────
const ClubCard: React.FC<{ club: ClubInfo; onOpen: () => void }> = ({ club, onOpen }) => {
  const F = ERP.font.family;
  const cs = CATEGORY_STYLE[club.category];
  const roster = CLUB_ROSTERS[club.id] ?? [];
  const president = roster.find(m => m.role === "主席");

  return (
    <div
      style={{ background:ERP.colors.surface, borderRadius:ERP.radius.xl, border:`1px solid ${ERP.colors.border}`, overflow:"hidden", boxShadow:ERP.shadow.sm, display:"flex", flexDirection:"column", transition:"box-shadow 0.15s, transform 0.15s", cursor:"pointer" }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = ERP.shadow.md; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = ERP.shadow.sm; (e.currentTarget as HTMLDivElement).style.transform = "none"; }}
      onClick={onOpen}
    >
      {/* Top accent strip */}
      <div style={{ height:4, background:`linear-gradient(90deg, ${cs.accent}, ${cs.accent}88)` }} />

      <div style={{ padding:"18px 20px", flex:1, display:"flex", flexDirection:"column", gap:14 }}>
        {/* Header */}
        <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
          <div style={{ width:48, height:48, borderRadius:ERP.radius.lg, background:cs.bg, color:cs.color, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            {cs.icon}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:16, fontWeight:700, color:ERP.colors.textPrimary, fontFamily:F }}>{club.zhName}</div>
            <div style={{ fontSize:11.5, color:ERP.colors.textMuted, marginTop:2, fontFamily:F }}>{club.enName}</div>
            <div style={{ fontSize:10, color:ERP.colors.textDisabled, marginTop:2, fontFamily:F }}>成立 {club.founded}</div>
          </div>
        </div>

        {/* Metrics */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
          {[
            { icon:<Users size={12} />,       label:"成員人數", value:`${club.memberCount} 人`,   color:ERP.colors.accent  },
            { icon:<Award size={12} />,       label:"負責導師", value:club.teacher,               color:"#0891B2"          },
            { icon:<CalendarDays size={12} />, label:"進行中活動",value:`${club.ongoingEvents} 項`, color: club.ongoingEvents > 0 ? "#059669" : ERP.colors.textMuted },
          ].map((m, i) => (
            <div key={i} style={{ background:ERP.colors.pageBg, borderRadius:ERP.radius.md, padding:"9px 10px", border:`1px solid ${ERP.colors.divider}` }}>
              <div style={{ display:"flex", alignItems:"center", gap:4, color:m.color, marginBottom:4 }}>{m.icon}<span style={{ fontSize:9.5, fontWeight:600, color:ERP.colors.textMuted, fontFamily:F, textTransform:"uppercase" as const, letterSpacing:"0.04em" }}>{m.label}</span></div>
              <div style={{ fontSize:13, fontWeight:700, color:ERP.colors.textPrimary, fontFamily:F, whiteSpace:"nowrap" as const, overflow:"hidden", textOverflow:"ellipsis" }}>{m.value}</div>
            </div>
          ))}
        </div>

        {/* President chip */}
        {president && (
          <div style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 10px", background:"#EDE9FE", borderRadius:ERP.radius.full, border:"1px solid #C4B5FD", alignSelf:"flex-start" as const }}>
            <Shield size={11} color="#7C3AED" />
            <span style={{ fontSize:11, fontWeight:700, color:"#5B21B6", fontFamily:F }}>主席：{president.chName}</span>
          </div>
        )}
      </div>

      {/* Card footer CTA */}
      <div style={{ borderTop:`1px solid ${ERP.colors.border}`, padding:"12px 20px" }}>
        <button
          onClick={e => { e.stopPropagation(); onOpen(); }}
          style={{ width:"100%", padding:"9px 0", border:"none", borderRadius:ERP.radius.md, background:`linear-gradient(135deg, ${cs.accent}, ${cs.accent}CC)`, color:"#fff", fontSize:13, fontWeight:700, fontFamily:F, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:7, boxShadow:`0 2px 8px ${cs.accent}40`, transition:"opacity 0.15s" }}
          onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")}
          onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
        >
          開啟學會名冊 <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};

// ─── Club Roster View (Frame 2) ───────────────────────────────────────────────
const ClubRosterView: React.FC<{ club: ClubInfo; onBack: () => void }> = ({ club, onBack }) => {
  const F = ERP.font.family;
  const cs = CATEGORY_STYLE[club.category];

  const [search,           setSearch]           = useState("");
  const [showPaste,        setShowPaste]         = useState(false);
  const [showAddModal,     setShowAddModal]      = useState(false);
  const [confirmRemoveId,  setConfirmRemoveId]   = useState<string | null>(null);
  const [toastMsg,         setToastMsg]          = useState<string | null>(null);
  const [openRoleId,       setOpenRoleId]        = useState<string | null>("cm-001"); // pre-open first row for UX demo
  const [openStatusId,     setOpenStatusId]      = useState<string | null>(null);
  const [syncTs,           setSyncTs]            = useState("剛剛");
  const [members, setMembers] = useState<ClubMember[]>(() => [...(CLUB_ROSTERS[club.id] ?? [])]);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(null), 2200); };

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenRoleId(null);
        setOpenStatusId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleRoleChange = (memberId: string, newRole: ClubMember["role"]) => {
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m));
    setOpenRoleId(null);
    setSyncTs("剛剛");
    showToast(`✓ 職銜已更新為「${newRole}」`);
  };

  const handleStatusChange = (memberId: string, newStatus: ClubMember["status"]) => {
    const label = STATUS_OPTIONS.find(s => s.status === newStatus)?.zhLabel ?? newStatus;
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, status: newStatus } : m));
    setOpenStatusId(null);
    setSyncTs("剛剛");
    showToast(`✓ 狀態已更新為「${label}」`);
  };

  const handleRemove = (memberId: string) => {
    const name = members.find(m => m.id === memberId)?.chName ?? "";
    setMembers(prev => prev.filter(m => m.id !== memberId));
    setConfirmRemoveId(null);
    setSyncTs("剛剛");
    showToast(`✓ ${name} 已從學會移除`);
  };

  const handleAdd = (candidate: typeof ADD_POOL[0]) => {
    setMembers(prev => [...prev, {
      id: `new-${Date.now()}`, chName: candidate.chName, enName: candidate.enName,
      studentId: candidate.id, classCode: candidate.classCode,
      role: "會員", joinDate: new Date().toISOString().slice(0, 10), status: "active",
    }]);
    setShowAddModal(false);
    setSyncTs("剛剛");
    showToast(`✓ ${candidate.chName} 已加入${club.zhName}`);
  };

  const filtered = members.filter(m => {
    const q = search.toLowerCase();
    return !q || m.chName.includes(search) || m.enName.toLowerCase().includes(q) || m.studentId.toLowerCase().includes(q);
  });

  const presidentCount = members.filter(m => m.role === "主席").length;

  return (
    <div style={{ fontFamily:F, background:ERP.colors.pageBg, height:"100%", overflowY:"auto", padding:28, display:"flex", flexDirection:"column", gap:20, position:"relative", boxSizing:"border-box" as const }}>

      {/* Modals */}
      {showPaste   && <BatchPasteModal clubName={club.zhName} onClose={() => setShowPaste(false)} />}
      {showAddModal && <AddMemberModal  clubName={club.zhName} onClose={() => setShowAddModal(false)} onAdd={handleAdd} />}

      {/* Toast */}
      {toastMsg && (
        <div style={{ position:"fixed", bottom:28, left:"50%", transform:"translateX(-50%)", zIndex:9999, pointerEvents:"none" }}>
          <div style={{ padding:"9px 20px", background:"#1E293B", borderRadius:999, color:"#F8FAFC", fontSize:12.5, fontWeight:600, boxShadow:"0 8px 28px rgba(15,23,42,0.28)", border:"1px solid rgba(255,255,255,0.08)", whiteSpace:"nowrap" }}>{toastMsg}</div>
        </div>
      )}

      {/* ── Breadcrumbs ── */}
      <div style={{ display:"flex", alignItems:"center", gap:5, flexWrap:"wrap" as const }}>
        {[
          { label:"首頁",        icon:<Home size={11} /> },
          { label:"活動與人才"  },
          { label:"學會列表"    },
          { label:club.zhName, active:true },
        ].map((crumb, i, arr) => (
          <React.Fragment key={i}>
            {i > 0 && <ChevronRight size={11} color={ERP.colors.textDisabled} />}
            <span style={{ display:"flex", alignItems:"center", gap:4, fontSize:11.5, fontWeight: crumb.active ? 700 : 400, color: crumb.active ? cs.accent : ERP.colors.textMuted, fontFamily:F, cursor: crumb.active ? "default" : "pointer", transition:"color 0.12s" }}
              onMouseEnter={e => { if (!crumb.active) (e.currentTarget as HTMLSpanElement).style.color = ERP.colors.textPrimary; }}
              onMouseLeave={e => { if (!crumb.active) (e.currentTarget as HTMLSpanElement).style.color = ERP.colors.textMuted; }}>
              {crumb.icon}{crumb.label}
            </span>
          </React.Fragment>
        ))}
      </div>

      {/* ── Header ── */}
      <div>
        {/* Back button */}
        <button onClick={onBack} style={{ display:"inline-flex", alignItems:"center", gap:6, background:"none", border:"none", cursor:"pointer", color:cs.accent, fontSize:13, fontFamily:F, fontWeight:500, padding:"0 0 10px 0" }}>
          <ArrowLeft size={14} />
          <span>學會列表</span>
          <span style={{ fontSize:10.5, color:ERP.colors.textMuted, fontWeight:400, marginLeft:2 }}>(保留篩選狀態)</span>
        </button>

        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap" as const, gap:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            {/* Club icon */}
            <div style={{ width:52, height:52, borderRadius:ERP.radius.lg, background:cs.bg, color:cs.color, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, border:`2px solid ${cs.accent}33` }}>
              {cs.icon}
            </div>
            <div>
              <h1 style={{ margin:0, fontSize:22, fontWeight:700, color:ERP.colors.textPrimary }}>{club.zhName}名冊</h1>
              <p style={{ margin:"4px 0 0", fontSize:13, color:ERP.colors.textSecondary }}>
                {club.enName} · 負責導師：{club.teacher}
                <span style={{ margin:"0 8px", color:ERP.colors.textDisabled }}>·</span>
                目前 <strong>{members.length}</strong> 名成員
                {presidentCount > 1 && (
                  <span style={{ marginLeft:8, padding:"1px 7px", background:"#FEF3C7", border:"1px solid #FCD34D", borderRadius:999, fontSize:11, color:"#92400E", fontWeight:600 }}>
                    ⚠ 主席超過一位
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display:"flex", flexDirection:"column" as const, alignItems:"flex-end", gap:6 }}>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" as const }}>
              <div style={{ display:"flex", flexDirection:"column" as const, alignItems:"flex-start", gap:3 }}>
                <button onClick={() => setShowPaste(true)} style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"8px 14px", borderRadius:ERP.radius.md, border:`1px solid ${ERP.colors.border}`, background:ERP.colors.surface, color:ERP.colors.textSecondary, fontSize:13, fontFamily:F, cursor:"pointer", transition:"all 0.12s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = ERP.colors.accentLight; e.currentTarget.style.color = ERP.colors.accent; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = ERP.colors.border; e.currentTarget.style.color = ERP.colors.textSecondary; }}>
                  <Copy size={14} />批量貼上名單 Paste Excel
                </button>
                <span style={{ fontSize:10.5, color:ERP.colors.textMuted, fontFamily:F, paddingLeft:2 }}>
                  🛡 系統將自動過濾重複名單
                </span>
              </div>
              <button onClick={() => setShowAddModal(true)} style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"8px 16px", borderRadius:ERP.radius.md, border:"none", background:`linear-gradient(135deg, ${cs.accent}, ${cs.accent}CC)`, color:"#fff", fontSize:13, fontWeight:700, fontFamily:F, cursor:"pointer", boxShadow:`0 2px 10px ${cs.accent}40`, alignSelf:"flex-start" as const }}>
                <UserPlus size={14} />+ 加入學生 Add Student
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Search ── */}
      <div style={{ position:"relative", maxWidth:340 }}>
        <Search size={14} style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:ERP.colors.textMuted, pointerEvents:"none" }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜尋成員姓名、學號…" style={{ width:"100%", padding:"8px 10px 8px 32px", boxSizing:"border-box" as const, borderRadius:ERP.radius.md, border:`1px solid ${ERP.colors.border}`, background:ERP.colors.surface, color:ERP.colors.textPrimary, fontSize:13, fontFamily:F, outline:"none" }} />
      </div>

      {/* ── Table ── */}
      <div style={{ background:ERP.colors.surface, borderRadius:ERP.radius.lg, border:`1px solid ${ERP.colors.border}`, overflow:"hidden", boxShadow:ERP.shadow.xs }} ref={dropdownRef}>
        <div style={{ overflowX:"auto" }}>

          {/* Table header */}
          <div style={{ minWidth:760, display:"grid", gridTemplateColumns:"160px 1fr 170px 130px 1fr", background:ERP.colors.pageBg, borderBottom:`1px solid ${ERP.colors.border}`, padding:"0 20px" }}>
            {["職銜 Role", "姓名 Name", "學號 Student ID", "加入日期 Joined", "操作 Actions"].map((h, i) => (
              <div key={i} style={{ padding:"11px 8px 11px 0", fontSize:11, fontWeight:600, color:ERP.colors.textMuted, letterSpacing:"0.4px", textTransform:"uppercase" as const }}>{h}</div>
            ))}
          </div>

          {filtered.map((m, idx) => {
            const rc  = roleConfig(m.role);
            const sc  = statusConfig(m.status);
            const isRoleOpen   = openRoleId   === m.id;
            const isStatusOpen = openStatusId === m.id;
            const isRemoving   = confirmRemoveId === m.id;

            return (
              <div key={m.id} style={{ minWidth:760, display:"grid", gridTemplateColumns:"160px 1fr 170px 130px 1fr", padding:"0 20px", borderBottom: idx < filtered.length - 1 ? `1px solid ${ERP.colors.divider}` : "none", background: isRemoving ? "#FEF2F2" : ERP.colors.surface, transition:"background 0.12s", position:"relative" as const, zIndex: (isRoleOpen || isStatusOpen) ? 20 : 1 }}>

                {/* ── Role cell — inline dropdown ── */}
                <div style={{ padding:"12px 8px 12px 0", alignSelf:"center", position:"relative" as const }}>
                  <button
                    onClick={e => { e.stopPropagation(); setOpenRoleId(isRoleOpen ? null : m.id); setOpenStatusId(null); setConfirmRemoveId(null); }}
                    style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"5px 9px", borderRadius:ERP.radius.md, border:`1.5px solid ${isRoleOpen ? rc.color : rc.bd}`, background: isRoleOpen ? rc.bg : rc.bg, color:rc.color, fontSize:12, fontWeight:700, fontFamily:F, cursor:"pointer", transition:"all 0.12s", boxShadow: isRoleOpen ? `0 0 0 3px ${rc.color}20` : "none" }}>
                    <span style={{ fontSize:9.5, padding:"1px 5px", borderRadius:4, background:`${rc.color}18`, color:rc.color, fontWeight:800 }}>{rc.tier}</span>
                    {m.role}
                    <ChevronDown size={11} color={rc.color} style={{ transform: isRoleOpen ? "rotate(180deg)" : "none", transition:"transform 0.15s" }} />
                  </button>

                  {/* Role dropdown */}
                  {isRoleOpen && (
                    <div style={{ position:"absolute", top:"calc(100% - 6px)", left:0, zIndex:50, background:ERP.colors.surface, border:`1px solid ${ERP.colors.border}`, borderRadius:ERP.radius.lg, boxShadow:ERP.shadow.xl, overflow:"hidden", minWidth:190 }}>
                      <div style={{ padding:"8px 12px 6px", fontSize:10, fontWeight:700, color:ERP.colors.textMuted, letterSpacing:"0.06em", textTransform:"uppercase" as const, borderBottom:`1px solid ${ERP.colors.divider}`, fontFamily:F }}>
                        選擇職銜 · Select Role
                      </div>
                      {ROLE_OPTIONS.map(opt => (
                        <button key={opt.role} onClick={() => handleRoleChange(m.id, opt.role)}
                          style={{ width:"100%", textAlign:"left" as const, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"9px 14px", background: m.role === opt.role ? opt.bg : "transparent", border:"none", cursor:"pointer", fontFamily:F, transition:"background 0.1s" }}
                          onMouseEnter={e => { if (m.role !== opt.role) e.currentTarget.style.background = ERP.colors.pageBg; }}
                          onMouseLeave={e => { if (m.role !== opt.role) e.currentTarget.style.background = "transparent"; }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                            <span style={{ fontSize:9.5, padding:"1px 6px", borderRadius:4, background:`${opt.color}18`, color:opt.color, fontWeight:800 }}>{opt.tier}</span>
                            <span style={{ fontSize:13, fontWeight: m.role === opt.role ? 700 : 500, color: m.role === opt.role ? opt.color : ERP.colors.textPrimary }}>{opt.role}</span>
                          </div>
                          {m.role === opt.role && <Check size={13} color={opt.color} />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── Name cell ── */}
                <div style={{ padding:"12px 8px 12px 0", alignSelf:"center" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ width:30, height:30, borderRadius:"50%", background:rc.bg, border:`1.5px solid ${rc.bd}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <span style={{ fontSize:11, fontWeight:800, color:rc.color }}>{m.chName.charAt(0)}</span>
                    </div>
                    <div>
                      <div style={{ fontSize:14, fontWeight:600, color:ERP.colors.textPrimary, fontFamily:F }}>{m.chName}</div>
                      <div style={{ fontSize:11, color:ERP.colors.textMuted, fontFamily:F }}>{m.enName}
                        <span style={{ marginLeft:6, padding:"0px 5px", background:sc.bg, border:`1px solid ${sc.bd}`, borderRadius:ERP.radius.full, fontSize:9.5, color:sc.color, fontWeight:700 }}>{sc.zhLabel}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Student ID cell ── */}
                <div style={{ padding:"12px 8px 12px 0", alignSelf:"center" }}>
                  <span style={{ fontFamily:ERP.font.mono, fontSize:12, color:ERP.colors.accent, fontWeight:600 }}>{m.studentId}</span>
                  <div style={{ fontSize:10.5, color:ERP.colors.textMuted, marginTop:1, fontFamily:F }}>{m.classCode}</div>
                </div>

                {/* ── Join Date cell ── */}
                <div style={{ padding:"12px 8px 12px 0", alignSelf:"center" }}>
                  <span style={{ fontSize:12.5, color:ERP.colors.textSecondary, fontFamily:F }}>{m.joinDate}</span>
                </div>

                {/* ── Actions cell ── */}
                <div style={{ padding:"10px 0", alignSelf:"center", display:"flex", alignItems:"center", gap:5, position:"relative" as const }} onClick={e => e.stopPropagation()}>

                  {/* Change Status */}
                  <div style={{ position:"relative" as const }}>
                    <button onClick={e => { e.stopPropagation(); setOpenStatusId(isStatusOpen ? null : m.id); setOpenRoleId(null); setConfirmRemoveId(null); }}
                      style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"4px 9px", borderRadius:ERP.radius.sm, border:`1px solid ${isStatusOpen ? "#7DD3FC" : "#BAE6FD"}`, background: isStatusOpen ? "#E0F2FE" : "#F0F9FF", color:"#0891B2", fontSize:11.5, fontFamily:F, cursor:"pointer", fontWeight:600, transition:"all 0.15s" }}>
                      <Zap size={12} />變更狀態
                      <ChevronDown size={10} style={{ transform: isStatusOpen ? "rotate(180deg)" : "none", transition:"transform 0.15s" }} />
                    </button>
                    {isStatusOpen && (
                      <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, zIndex:50, background:ERP.colors.surface, border:`1px solid ${ERP.colors.border}`, borderRadius:ERP.radius.lg, boxShadow:ERP.shadow.xl, overflow:"hidden", minWidth:160 }}>
                        {STATUS_OPTIONS.map(opt => (
                          <button key={opt.status} onClick={() => handleStatusChange(m.id, opt.status)}
                            style={{ width:"100%", textAlign:"left" as const, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"9px 14px", background: m.status === opt.status ? opt.bg : "transparent", border:"none", cursor:"pointer", fontFamily:F }}
                            onMouseEnter={e => { if (m.status !== opt.status) e.currentTarget.style.background = ERP.colors.pageBg; }}
                            onMouseLeave={e => { if (m.status !== opt.status) e.currentTarget.style.background = "transparent"; }}>
                            <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                              <div style={{ width:7, height:7, borderRadius:"50%", background:opt.color }} />
                              <span style={{ fontSize:13, fontWeight: m.status === opt.status ? 700 : 400, color: m.status === opt.status ? opt.color : ERP.colors.textPrimary }}>{opt.zhLabel}</span>
                            </div>
                            {m.status === opt.status && <Check size={12} color={opt.color} />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Remove — with inline confirm */}
                  {isRemoving ? (
                    <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                      <span style={{ fontSize:10.5, color:"#B91C1C", fontWeight:600, fontFamily:F, whiteSpace:"nowrap" as const }}>確定移除？</span>
                      <button onClick={() => handleRemove(m.id)} style={{ display:"inline-flex", alignItems:"center", gap:3, padding:"3px 8px", borderRadius:ERP.radius.sm, border:"none", background:"#DC2626", color:"#fff", fontSize:11, fontFamily:F, cursor:"pointer", fontWeight:700 }}>
                        <Check size={11} />確認
                      </button>
                      <button onClick={() => setConfirmRemoveId(null)} style={{ display:"inline-flex", alignItems:"center", gap:3, padding:"3px 8px", borderRadius:ERP.radius.sm, border:`1px solid ${ERP.colors.border}`, background:ERP.colors.surface, color:ERP.colors.textSecondary, fontSize:11, fontFamily:F, cursor:"pointer" }}>
                        取消
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmRemoveId(m.id)}
                      style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"4px 9px", borderRadius:ERP.radius.sm, border:"1px solid #FCA5A5", background:"#FEF2F2", color:"#DC2626", fontSize:11.5, fontFamily:F, cursor:"pointer", fontWeight:600, transition:"all 0.15s" }}
                      onMouseEnter={e => { e.currentTarget.style.background = "#FEE2E2"; e.currentTarget.style.borderColor = "#F87171"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "#FEF2F2"; e.currentTarget.style.borderColor = "#FCA5A5"; }}>
                      <Trash2 size={12} />移除
                    </button>
                  )}
                </div>

              </div>
            );
          })}

          {/* Empty state */}
          {filtered.length === 0 && (
            <div style={{ padding:"40px 0", textAlign:"center" as const, fontSize:13, color:ERP.colors.textMuted, fontFamily:F }}>
              {search ? "找不到符合的成員" : "此學會暫無成員記錄"}
            </div>
          )}
        </div>

        {/* ── Table footer: count + sync indicator ── */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"9px 20px", borderTop:`1px solid ${ERP.colors.border}`, background:ERP.colors.pageBg }}>
          <span style={{ fontSize:12, color:ERP.colors.textMuted, fontFamily:F }}>
            顯示 {filtered.length} / {members.length} 名成員
            <span style={{ marginLeft:8, padding:"1px 7px", background:ERP.colors.accentPale, color:ERP.colors.accent, borderRadius:999, fontSize:11, fontWeight:600 }}>
              {members.filter(m => m.role === "主席").length} 主席 · {members.filter(m => m.role === "幹事").length} 幹事 · {members.filter(m => m.role === "會員").length} 會員
            </span>
          </span>
          {/* 🟢 State Sync indicator */}
          <div style={{ display:"flex", alignItems:"center", gap:5 }}>
            <div style={{ width:7, height:7, borderRadius:"50%", background:"#10B981", boxShadow:"0 0 0 2px #D1FAE5" }} />
            <span style={{ fontSize:11.5, color:ERP.colors.textSecondary, fontFamily:F }}>
              最後同步：<strong style={{ color:ERP.colors.textPrimary }}>{syncTs}</strong>
            </span>
            <button onClick={() => setSyncTs("剛剛")} title="重新同步" style={{ display:"flex", alignItems:"center", padding:3, background:"none", border:"none", cursor:"pointer", color:ERP.colors.textMuted, borderRadius:4, transition:"color 0.12s" }}
              onMouseEnter={e => (e.currentTarget.style.color = ERP.colors.accent)}
              onMouseLeave={e => (e.currentTarget.style.color = ERP.colors.textMuted)}>
              <RefreshCw size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Export — Club List (Frame 1) ────────────────────────────────────────
export const Screen_ClubManagement: React.FC = () => {
  const F = ERP.font.family;
  const [activeClub, setActiveClub] = useState<ClubInfo | null>(null);
  const [search,     setSearch]     = useState("");
  const [catFilter,  setCatFilter]  = useState<string>("全部");
  const [isMobile,   setIsMobile]   = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 900);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // ── Frame 2: Roster drill-down ──
  if (activeClub) {
    return (
      <div style={{ height: isMobile ? "auto" : "100%", minHeight: isMobile ? "100%" : undefined, overflow: isMobile ? "visible" : "hidden", background: ERP.colors.pageBg, fontFamily: F }}>
        <ClubRosterView club={activeClub} onBack={() => setActiveClub(null)} />
      </div>
    );
  }

  const CAT_OPTIONS = ["全部", "arts", "tech", "sports", "service", "academic", "culture"];
  const CAT_ZH: Record<string, string> = { 全部:"全部", arts:"藝術", tech:"科技", sports:"體育", service:"服務", academic:"學術", culture:"文化" };

  const filtered = CLUBS.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q || c.zhName.includes(search) || c.enName.toLowerCase().includes(q) || c.teacher.includes(search);
    const matchCat = catFilter === "全部" || c.category === catFilter;
    return matchSearch && matchCat;
  });

  return (
    <div style={{ height: isMobile ? "auto" : "100%", minHeight: isMobile ? "100%" : undefined, overflowY: isMobile ? "visible" : "auto", background: ERP.colors.pageBg, fontFamily: F, padding: isMobile ? 16 : 28, boxSizing: "border-box" as const, display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── Page header ── */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap" as const, gap:12 }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:"linear-gradient(135deg, #F97316, #EF4444)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 2px 8px rgba(249,115,22,0.40)", flexShrink:0 }}>
              <Users size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize:isMobile ? 16 : 20, fontWeight:800, color:ERP.colors.textPrimary, letterSpacing:"-0.3px" }}>學會管理</div>
              <div style={{ fontSize:11, color:ERP.colors.textMuted }}>Club & Society Management · AY 2025/26 · {CLUBS.length} 個學會</div>
            </div>
          </div>
        </div>
        <button style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"9px 18px", border:"none", borderRadius:ERP.radius.md, background:"linear-gradient(135deg, #F97316, #EF4444)", color:"#fff", fontSize:13, fontWeight:700, fontFamily:F, cursor:"pointer", boxShadow:"0 2px 10px rgba(249,115,22,0.40)" }}>
          <UserPlus size={14} />新增學會
        </button>
      </div>

      {/* ── Stats banner ── */}
      <div style={{ display:"grid", gridTemplateColumns:`repeat(${isMobile ? 2 : 4}, 1fr)`, gap:12 }}>
        {[
          { label:"學會總數",       value:CLUBS.length,                                 color:"#F97316", bg:"#FFF7ED", bd:"#FED7AA" },
          { label:"總成員人數",     value:CLUBS.reduce((s, c) => s + c.memberCount, 0), color:"#1D4ED8", bg:"#EFF6FF", bd:"#BFDBFE" },
          { label:"進行中活動",     value:CLUBS.reduce((s, c) => s + c.ongoingEvents, 0),color:"#059669", bg:"#ECFDF5", bd:"#6EE7B7" },
          { label:"學會類別",       value:new Set(CLUBS.map(c => c.category)).size,     color:"#7C3AED", bg:"#EDE9FE", bd:"#C4B5FD" },
        ].map(stat => (
          <div key={stat.label} style={{ background:stat.bg, border:`1px solid ${stat.bd}`, borderRadius:ERP.radius.lg, padding:"13px 16px" }}>
            <div style={{ fontSize:22, fontWeight:800, color:stat.color, lineHeight:1 }}>{stat.value}</div>
            <div style={{ fontSize:11.5, fontWeight:600, color:ERP.colors.textSecondary, marginTop:3, fontFamily:F }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ── Search + category filter ── */}
      <div style={{ display:"flex", gap:10, flexWrap:"wrap" as const, alignItems:"center" }}>
        <div style={{ position:"relative", flex:1, minWidth:200 }}>
          <Search size={13} style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:ERP.colors.textMuted, pointerEvents:"none" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜尋學會名稱或負責導師…" style={{ width:"100%", boxSizing:"border-box" as const, padding:"8px 10px 8px 32px", border:`1px solid ${ERP.colors.border}`, borderRadius:ERP.radius.md, background:ERP.colors.surface, color:ERP.colors.textPrimary, fontSize:13, fontFamily:F, outline:"none" }} />
        </div>
        <div style={{ display:"flex", gap:5, flexWrap:"wrap" as const }}>
          {CAT_OPTIONS.map(cat => (
            <button key={cat} onClick={() => setCatFilter(cat)} style={{ padding:"6px 12px", borderRadius:ERP.radius.full, border:`1.5px solid ${catFilter === cat ? "#F97316" : ERP.colors.border}`, background: catFilter === cat ? "#FFF7ED" : ERP.colors.surface, color: catFilter === cat ? "#C2410C" : ERP.colors.textSecondary, fontSize:12, fontWeight: catFilter === cat ? 700 : 400, cursor:"pointer", fontFamily:F, transition:"all 0.15s" }}>
              {CAT_ZH[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* ── Club grid ── */}
      <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(300px, 1fr))", gap:16 }}>
        {filtered.map(club => (
          <ClubCard key={club.id} club={club} onOpen={() => setActiveClub(club)} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ padding:"48px 0", textAlign:"center" as const, color:ERP.colors.textMuted, fontSize:14, fontFamily:F }}>
          找不到符合條件的學會
        </div>
      )}

    </div>
  );
};
