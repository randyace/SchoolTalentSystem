// ─────────────────────────────────────────────────────────────────────────────
// Screen 1.B.3 / 1.B.4  班別列表 / Class List + Roster
// P0 — Teacher Portal — Students & Classes group
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect } from "react";
import { ERP } from "./erpTokens";
import {
  Users, BookOpen, Activity, ChevronRight, X, Copy,
  ClipboardList, Search, ArrowLeft, UserPlus, ArrowRightLeft,
  Trash2, AlertTriangle, Check,
} from "lucide-react";

// ─── Mock Data ───────────────────────────────────────────────────────────────

interface ClassInfo {
  id: string;
  classCode: string;
  form: string;
  formTeacher: string;
  headcount: number;
  activeActivities: number;
  room: string;
}

interface RosterStudent {
  classNum: number;
  id: string;
  chName: string;
  enName: string;
  status: "active" | "repeat";
}

const CLASSES: ClassInfo[] = [
  { id:"f1a", classCode:"F1A", form:"F1", formTeacher:"陳嘉樂",  headcount:30, activeActivities:4, room:"1A室" },
  { id:"f1b", classCode:"F1B", form:"F1", formTeacher:"李雅詩",  headcount:28, activeActivities:3, room:"1B室" },
  { id:"f2a", classCode:"F2A", form:"F2", formTeacher:"黃志聰",  headcount:31, activeActivities:5, room:"2A室" },
  { id:"f2b", classCode:"F2B", form:"F2", formTeacher:"張曉雯",  headcount:29, activeActivities:2, room:"2B室" },
];

const ROSTERS: Record<string, RosterStudent[]> = {
  f1a: [
    { classNum:1,  id:"2025-F1A-001", chName:"陳大文", enName:"Chan Tai Man",    status:"active" },
    { classNum:2,  id:"2025-F1A-002", chName:"黃美怡", enName:"Wong Mei Yi",     status:"active" },
    { classNum:3,  id:"2025-F1A-003", chName:"李家豪", enName:"Lee Ka Ho",       status:"active" },
    { classNum:4,  id:"2025-F1A-004", chName:"劉曉峰", enName:"Lau Hiu Fung",    status:"active" },
    { classNum:5,  id:"2025-F1A-005", chName:"林詩雅", enName:"Lam Sze Nga",     status:"active" },
    { classNum:6,  id:"2025-F1A-006", chName:"張俊傑", enName:"Cheung Chun Kit", status:"active" },
    { classNum:7,  id:"2025-F1A-007", chName:"吳敏兒", enName:"Ng Man Yi",       status:"repeat" },
    { classNum:8,  id:"2025-F1A-008", chName:"鄭博文", enName:"Cheng Pok Man",   status:"active" },
    { classNum:9,  id:"2025-F1A-009", chName:"何紫晴", enName:"Ho Tsz Ching",    status:"active" },
    { classNum:10, id:"2025-F1A-010", chName:"梁嘉駿", enName:"Leung Ka Chun",   status:"active" },
  ],
  f1b: [
    { classNum:1,  id:"2025-F1B-001", chName:"鄭浩南", enName:"Cheng Ho Nam",    status:"active" },
    { classNum:2,  id:"2025-F1B-002", chName:"何雅詩", enName:"Ho Nga Si",       status:"active" },
    { classNum:3,  id:"2025-F1B-003", chName:"梁紹基", enName:"Leung Siu Kei",   status:"active" },
    { classNum:4,  id:"2025-F1B-004", chName:"蔡天朗", enName:"Tsoi Tin Long",   status:"active" },
    { classNum:5,  id:"2025-F1B-005", chName:"馬麗珊", enName:"Ma Lai San",      status:"active" },
    { classNum:6,  id:"2025-F1B-006", chName:"鄺子俊", enName:"Kwong Tsz Chun", status:"active" },
    { classNum:7,  id:"2025-F1B-007", chName:"羅雪盈", enName:"Lo Suet Ying",   status:"active" },
    { classNum:8,  id:"2025-F1B-008", chName:"許志豪", enName:"Hui Chi Ho",     status:"active" },
  ],
  f2a: [
    { classNum:1,  id:"2025-F2A-001", chName:"謝嘉麗", enName:"Tse Ka Lai",     status:"active" },
    { classNum:2,  id:"2025-F2A-002", chName:"彭俊賢", enName:"Pang Chun Yin",  status:"active" },
    { classNum:3,  id:"2025-F2A-003", chName:"徐婉婷", enName:"Tsui Yuen Ting", status:"active" },
    { classNum:4,  id:"2025-F2A-004", chName:"盧偉強", enName:"Lo Wai Keung",   status:"active" },
    { classNum:5,  id:"2025-F2A-005", chName:"蘇曉彤", enName:"So Hiu Tung",    status:"active" },
    { classNum:6,  id:"2025-F2A-006", chName:"江美琪", enName:"Kong Mei Ki",    status:"active" },
    { classNum:7,  id:"2025-F2A-007", chName:"陳偉傑", enName:"Chan Wai Kit",   status:"active" },
    { classNum:8,  id:"2025-F2A-008", chName:"林子俊", enName:"Lam Tsz Chun",  status:"active" },
    { classNum:9,  id:"2025-F2A-009", chName:"張佩珊", enName:"Cheung Pui San", status:"active" },
  ],
  f2b: [
    { classNum:1,  id:"2025-F2B-001", chName:"余志遠", enName:"Yu Chi Yuen",    status:"active" },
    { classNum:2,  id:"2025-F2B-002", chName:"劉嘉欣", enName:"Lau Ka Yan",     status:"active" },
    { classNum:3,  id:"2025-F2B-003", chName:"黃紫嫣", enName:"Wong Tsz Yin",   status:"active" },
    { classNum:4,  id:"2025-F2B-004", chName:"蕭健文", enName:"Siu Kin Man",    status:"active" },
    { classNum:5,  id:"2025-F2B-005", chName:"鄧梓浩", enName:"Tang Tsz Ho",    status:"active" },
    { classNum:6,  id:"2025-F2B-006", chName:"吳詩琪", enName:"Ng Si Kei",      status:"active" },
    { classNum:7,  id:"2025-F2B-007", chName:"葉嘉怡", enName:"Yip Ka Yi",      status:"active" },
  ],
};

// ─── Batch Paste Modal ────────────────────────────────────────────────────────

const BatchPasteModal: React.FC<{ classCode: string; onClose: () => void; lang: "en" | "zh-HK" }> = ({
  classCode, onClose, lang,
}) => {
  const [text, setText] = useState("");
  const F = ERP.font.family;
  const T = lang === "zh-HK"
    ? { title: `批量貼上 — ${classCode}`, subtitle: "每行一名學生，格式：班號 中文姓名 英文姓名", placeholder: "1 陳大文 Chan Tai Man\n2 黃美怡 Wong Mei Yi\n3 李家豪 Lee Ka Ho", importBtn: "匯入預覽", cancelBtn: "取消", charCount: (n: number) => `${n} 字元` }
    : { title: `Batch Paste — ${classCode}`, subtitle: "One student per line: No. Chinese_Name English_Name", placeholder: "1 陳大文 Chan Tai Man\n2 黃美怡 Wong Mei Yi\n3 李家豪 Lee Ka Ho", importBtn: "Preview Import", cancelBtn: "Cancel", charCount: (n: number) => `${n} chars` };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, padding: 24,
    }}
      onClick={onClose}
    >
      <div
        style={{
          background: ERP.colors.surface, borderRadius: ERP.radius.xl,
          width: "100%", maxWidth: 520, boxShadow: ERP.shadow.xl,
          overflow: "hidden",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 24px", borderBottom: `1px solid ${ERP.colors.border}`,
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: ERP.colors.textPrimary, fontFamily: F }}>
              {T.title}
            </div>
            <div style={{ fontSize: 12, color: ERP.colors.textMuted, marginTop: 2, fontFamily: F }}>
              {T.subtitle}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: ERP.colors.textMuted }}
          >
            <X size={18} />
          </button>
        </div>
        {/* Textarea */}
        <div style={{ padding: 24 }}>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={T.placeholder}
            rows={8}
            style={{
              width: "100%", boxSizing: "border-box" as const,
              padding: 12, borderRadius: ERP.radius.md,
              border: `1px solid ${ERP.colors.border}`,
              fontFamily: ERP.font.mono, fontSize: 13, color: ERP.colors.textPrimary,
              background: ERP.colors.pageBg, outline: "none", resize: "vertical",
            }}
          />
          <div style={{ fontSize: 11, color: ERP.colors.textMuted, marginTop: 4, textAlign: "right" as const, fontFamily: F }}>
            {T.charCount(text.length)}
          </div>
        </div>
        {/* Footer */}
        <div style={{
          display: "flex", justifyContent: "flex-end", gap: 10,
          padding: "14px 24px", borderTop: `1px solid ${ERP.colors.border}`,
        }}>
          <button onClick={onClose} style={{
            padding: "8px 16px", borderRadius: ERP.radius.md,
            border: `1px solid ${ERP.colors.border}`, background: ERP.colors.surface,
            color: ERP.colors.textSecondary, fontSize: 13, fontFamily: F, cursor: "pointer",
          }}>
            {T.cancelBtn}
          </button>
          <button style={{
            padding: "8px 18px", borderRadius: ERP.radius.md,
            border: "none", background: ERP.colors.accent,
            color: "#fff", fontSize: 13, fontFamily: F, cursor: "pointer", fontWeight: 600,
          }}>
            {T.importBtn}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Add Student Modal ────────────────────────────────────────────────────────

const ADD_CANDIDATE_POOL = [
  { id: "2025-F3A-011", chName: "方子晴", enName: "Fong Tsz Ching",  class: "F3A" },
  { id: "2025-F3B-008", chName: "曾俊朗", enName: "Tsang Chun Long", class: "F3B" },
  { id: "NEW-001",      chName: "黎美琪", enName: "Lai Mei Ki",       class: "— 新生" },
  { id: "NEW-002",      chName: "謝嘉恩", enName: "Tse Ka Yan",      class: "— 新生" },
  { id: "NEW-003",      chName: "潘志明", enName: "Poon Chi Ming",   class: "— 新生" },
];

const AddStudentModal: React.FC<{
  classCode: string;
  onClose: () => void;
  onAdd: (student: typeof ADD_CANDIDATE_POOL[0]) => void;
}> = ({ classCode, onClose, onAdd }) => {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const F = ERP.font.family;
  const filtered = ADD_CANDIDATE_POOL.filter(s =>
    !q || s.chName.includes(q) || s.enName.toLowerCase().includes(q.toLowerCase()) || s.id.includes(q)
  );
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 24 }} onClick={onClose}>
      <div style={{ background: ERP.colors.surface, borderRadius: ERP.radius.xl, width: "100%", maxWidth: 480, boxShadow: ERP.shadow.xl, overflow: "hidden" }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: `1px solid ${ERP.colors.border}` }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: ERP.colors.textPrimary, fontFamily: F, display: "flex", alignItems: "center", gap: 7 }}>
              <UserPlus size={16} color={ERP.colors.accent} /> 加入學生 — {classCode}
            </div>
            <div style={{ fontSize: 11, color: ERP.colors.textMuted, marginTop: 2, fontFamily: F }}>Add Student to Class Roster</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: ERP.colors.textMuted }}><X size={18} /></button>
        </div>
        {/* Search */}
        <div style={{ padding: "14px 22px 0" }}>
          <div style={{ position: "relative" }}>
            <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: ERP.colors.textMuted, pointerEvents: "none" }} />
            <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="搜尋學生姓名或學號 / Search name or ID…"
              style={{ width: "100%", boxSizing: "border-box" as const, padding: "8px 10px 8px 30px", borderRadius: ERP.radius.md, border: `1px solid ${ERP.colors.border}`, background: ERP.colors.pageBg, fontSize: 13, fontFamily: F, outline: "none", color: ERP.colors.textPrimary }} />
          </div>
        </div>
        {/* Candidate list */}
        <div style={{ maxHeight: 240, overflowY: "auto", padding: "10px 14px 14px" }}>
          {filtered.length === 0 && <div style={{ padding: "20px 0", textAlign: "center", fontSize: 12, color: ERP.colors.textMuted, fontFamily: F }}>找不到符合的學生</div>}
          {filtered.map(s => (
            <div key={s.id} onClick={() => setSelected(s.id === selected ? null : s.id)}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: ERP.radius.md, cursor: "pointer", marginBottom: 2, background: selected === s.id ? ERP.colors.accentPale : "transparent", border: `1px solid ${selected === s.id ? ERP.colors.accentLight : "transparent"}`, transition: "all 0.12s" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, background: `linear-gradient(135deg, ${ERP.colors.accent}, #6366F1)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#fff" }}>{s.chName[0]}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: ERP.colors.textPrimary, fontFamily: F }}>{s.chName} <span style={{ fontWeight: 400, color: ERP.colors.textMuted, fontSize: 11 }}>{s.enName}</span></div>
                <div style={{ fontSize: 10, color: ERP.colors.textMuted, fontFamily: F, marginTop: 1 }}>{s.id} · 現班：{s.class}</div>
              </div>
              {selected === s.id && <Check size={15} color={ERP.colors.accent} />}
            </div>
          ))}
        </div>
        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "14px 22px", borderTop: `1px solid ${ERP.colors.border}` }}>
          <button onClick={onClose} style={{ padding: "8px 16px", borderRadius: ERP.radius.md, border: `1px solid ${ERP.colors.border}`, background: ERP.colors.surface, color: ERP.colors.textSecondary, fontSize: 13, fontFamily: F, cursor: "pointer" }}>取消 Cancel</button>
          <button disabled={!selected} onClick={() => { const s = ADD_CANDIDATE_POOL.find(x => x.id === selected); if (s) onAdd(s); }}
            style={{ padding: "8px 18px", borderRadius: ERP.radius.md, border: "none", background: selected ? ERP.colors.accent : ERP.colors.border, color: selected ? "#fff" : ERP.colors.textMuted, fontSize: 13, fontFamily: F, cursor: selected ? "pointer" : "default", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
            <UserPlus size={14} /> 加入此班 Add
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Transfer Modal ───────────────────────────────────────────────────────────

const TransferModal: React.FC<{
  student: RosterStudent;
  currentClassId: string;
  onClose: () => void;
  onTransfer: (targetClassId: string) => void;
}> = ({ student, currentClassId, onClose, onTransfer }) => {
  const [targetId, setTargetId] = useState<string | null>(null);
  const F = ERP.font.family;
  const options = CLASSES.filter(c => c.id !== currentClassId);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 24 }} onClick={onClose}>
      <div style={{ background: ERP.colors.surface, borderRadius: ERP.radius.xl, width: "100%", maxWidth: 420, boxShadow: ERP.shadow.xl, overflow: "hidden" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: `1px solid ${ERP.colors.border}` }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: ERP.colors.textPrimary, fontFamily: F, display: "flex", alignItems: "center", gap: 7 }}>
              <ArrowRightLeft size={15} color="#D97706" /> 調班 Transfer — {student.chName}
            </div>
            <div style={{ fontSize: 11, color: ERP.colors.textMuted, marginTop: 2, fontFamily: F }}>選擇目標班別 Select Target Class</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: ERP.colors.textMuted }}><X size={18} /></button>
        </div>
        <div style={{ padding: "14px 22px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
          {options.map(cls => (
            <div key={cls.id} onClick={() => setTargetId(cls.id)}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: ERP.radius.md, border: `1.5px solid ${targetId === cls.id ? ERP.colors.accent : ERP.colors.border}`, background: targetId === cls.id ? ERP.colors.accentPale : ERP.colors.pageBg, cursor: "pointer", transition: "all 0.12s" }}>
              <div style={{ width: 36, height: 36, borderRadius: ERP.radius.md, background: ERP.colors.accentPale, border: `1px solid ${ERP.colors.accentLight}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: ERP.colors.accent, fontFamily: F, flexShrink: 0 }}>{cls.classCode}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: ERP.colors.textPrimary, fontFamily: F }}>{cls.classCode} · {cls.room}</div>
                <div style={{ fontSize: 11, color: ERP.colors.textMuted, fontFamily: F }}>班主任: {cls.formTeacher} · {cls.headcount} 名學生</div>
              </div>
              {targetId === cls.id && <Check size={15} color={ERP.colors.accent} />}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "14px 22px", borderTop: `1px solid ${ERP.colors.border}` }}>
          <button onClick={onClose} style={{ padding: "8px 16px", borderRadius: ERP.radius.md, border: `1px solid ${ERP.colors.border}`, background: ERP.colors.surface, color: ERP.colors.textSecondary, fontSize: 13, fontFamily: F, cursor: "pointer" }}>取消</button>
          <button disabled={!targetId} onClick={() => targetId && onTransfer(targetId)}
            style={{ padding: "8px 18px", borderRadius: ERP.radius.md, border: "none", background: targetId ? "#D97706" : ERP.colors.border, color: targetId ? "#fff" : ERP.colors.textMuted, fontSize: 13, fontFamily: F, cursor: targetId ? "pointer" : "default", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
            <ArrowRightLeft size={14} /> 確認調班
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Roster View ──────────────────────────────────────────────────────────────

const RosterView: React.FC<{
  cls: ClassInfo; lang: "en" | "zh-HK"; isMobile: boolean;
  onBack: () => void; onViewStudent?: (id: string, classCode: string) => void;
}> = ({ cls, lang, onBack, onViewStudent, isMobile }) => {
  const [search,          setSearch]          = useState("");
  const [hoveredBtnId,    setHoveredBtnId]    = useState<string | null>(null);
  const [showPaste,       setShowPaste]       = useState(false);
  const [showAddModal,    setShowAddModal]    = useState(false);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [showTransferId,  setShowTransferId]  = useState<string | null>(null);
  const [toastMsg,        setToastMsg]        = useState<string | null>(null);
  const [localRows, setLocalRows] = useState<RosterStudent[]>(() => ROSTERS[cls.id] || []);
  const F = ERP.font.family;
  const rows = localRows;

  const showToast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(null), 2200); };

  const handleRemove = (id: string) => {
    setLocalRows(prev => prev.filter(r => r.id !== id));
    setConfirmRemoveId(null);
    showToast("✓ 學生已從本班移除");
  };

  const handleTransfer = (studentId: string, targetClassId: string) => {
    setLocalRows(prev => prev.filter(r => r.id !== studentId));
    const targetClass = CLASSES.find(c => c.id === targetClassId);
    setShowTransferId(null);
    showToast(`↔ 已調往 ${targetClass?.classCode ?? targetClassId}`);
  };

  const handleAdd = (student: typeof ADD_CANDIDATE_POOL[0]) => {
    const nextNum = Math.max(...localRows.map(r => r.classNum), 0) + 1;
    setLocalRows(prev => [...prev, { classNum: nextNum, id: student.id, chName: student.chName, enName: student.enName, status: "active" }]);
    setShowAddModal(false);
    showToast(`✓ ${student.chName} 已加入 ${cls.classCode}`);
  };
  const T = lang === "zh-HK"
    ? {
        back: "班別列表", title: `${cls.classCode} 班名冊`,
        subtitle: `班主任：${cls.formTeacher}　·　${cls.headcount} 名學生`, searchPlaceholder: "搜尋學生…",
        batchPaste: "批量貼上", addStudent: "+ 加入學生",
        colNum: "班號", colName: "姓名", colId: "學號", colStatus: "狀態", colAction: "操作",
        viewProfile: "查看", statusActive: "在學", statusRepeat: "重讀",
        remove: "移除", transfer: "調班",
        confirmRemove: "確定移除？", confirmYes: "確認", confirmNo: "取消",
      }
    : {
        back: "Class List", title: `${cls.classCode} Class Roster`,
        subtitle: `Form Teacher: ${cls.formTeacher} · ${cls.headcount} Students`, searchPlaceholder: "Search student…",
        batchPaste: "Batch Paste", addStudent: "+ Add Student",
        colNum: "No.", colName: "Name", colId: "Student ID", colStatus: "Status", colAction: "Action",
        viewProfile: "View", statusActive: "Active", statusRepeat: "Repeat",
        remove: "Remove", transfer: "Transfer",
        confirmRemove: "Confirm remove?", confirmYes: "Yes", confirmNo: "No",
      };

  const filtered = rows.filter(r => {
    const q = search.toLowerCase();
    return !q || r.chName.includes(search) || r.enName.toLowerCase().includes(q) || r.id.toLowerCase().includes(q);
  });

  const transferStudent = localRows.find(r => r.id === showTransferId) ?? null;

  return (
    <div style={{ fontFamily: F, background: ERP.colors.pageBg, minHeight: "100%", padding: isMobile ? 16 : ERP.layout.contentPad, display: "flex", flexDirection: "column", gap: isMobile ? 14 : 20, position: "relative" }}>
      {showPaste && <BatchPasteModal classCode={cls.classCode} onClose={() => setShowPaste(false)} lang={lang} />}
      {showAddModal && <AddStudentModal classCode={cls.classCode} onClose={() => setShowAddModal(false)} onAdd={handleAdd} />}
      {showTransferId && transferStudent && (
        <TransferModal student={transferStudent} currentClassId={cls.id} onClose={() => setShowTransferId(null)} onTransfer={id => handleTransfer(showTransferId, id)} />
      )}

      {/* Toast */}
      {toastMsg && (
        <div style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", zIndex: 9999, pointerEvents: "none" }}>
          <div style={{ padding: "9px 20px", background: "#1E293B", borderRadius: 999, color: "#F8FAFC", fontSize: 12.5, fontWeight: 600, boxShadow: "0 8px 28px rgba(15,23,42,0.28)", border: "1px solid rgba(255,255,255,0.08)", whiteSpace: "nowrap" }}>{toastMsg}</div>
        </div>
      )}

      {/* Header */}
      <div>
        <button
          onClick={onBack}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "none", border: "none", cursor: "pointer",
            color: ERP.colors.accent, fontSize: 13, fontFamily: F, fontWeight: 500,
            padding: "0 0 8px 0",
          }}
        >
          <ArrowLeft size={14} />{T.back}
        </button>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: ERP.colors.textPrimary }}>{T.title}</h1>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: ERP.colors.textSecondary }}>{T.subtitle} · 目前 {localRows.length} 名</p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
            <button
              onClick={() => setShowPaste(true)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "8px 14px", borderRadius: ERP.radius.md,
                border: `1px solid ${ERP.colors.border}`, background: ERP.colors.surface,
                color: ERP.colors.textSecondary, fontSize: 13, fontFamily: F, cursor: "pointer",
              }}
            >
              <Copy size={14} />{T.batchPaste}
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "8px 16px", borderRadius: ERP.radius.md,
                border: "none",
                background: `linear-gradient(135deg, ${ERP.colors.accent}, #6366F1)`,
                color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: F, cursor: "pointer",
                boxShadow: `0 2px 10px ${ERP.colors.accent}40`,
              }}
            >
              <UserPlus size={14} />{T.addStudent}
            </button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: "relative", maxWidth: 320 }}>
        <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: ERP.colors.textMuted, pointerEvents: "none" }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={T.searchPlaceholder}
          style={{
            width: "100%", padding: "8px 10px 8px 32px", boxSizing: "border-box" as const,
            borderRadius: ERP.radius.md, border: `1px solid ${ERP.colors.border}`,
            background: ERP.colors.surface, color: ERP.colors.textPrimary,
            fontSize: 13, fontFamily: F, outline: "none",
          }}
        />
      </div>

      {/* Table */}
      <div style={{ background: ERP.colors.surface, borderRadius: ERP.radius.lg, border: `1px solid ${ERP.colors.border}`, overflow: "hidden", boxShadow: ERP.shadow.xs }}>
      <div style={{ overflowX: "auto" }}>
        {/* Table header */}
        <div style={{ minWidth: 640, display: "grid", gridTemplateColumns: "60px 1fr 160px 90px 220px", background: ERP.colors.pageBg, borderBottom: `1px solid ${ERP.colors.border}`, padding: "0 20px" }}>
          {[T.colNum, T.colName, T.colId, T.colStatus, T.colAction].map((h, i) => (
            <div key={i} style={{ padding: "12px 8px 12px 0", fontSize: 11, fontWeight: 600, color: ERP.colors.textMuted, letterSpacing: "0.4px", textTransform: "uppercase" as const }}>{h}</div>
          ))}
        </div>

        {filtered.map((r, idx) => (
          <div
            key={r.id}
            onClick={() => onViewStudent?.(r.id, cls.classCode)}
            style={{
              minWidth: 640, display: "grid", gridTemplateColumns: "60px 1fr 160px 90px 220px",
              padding: "0 20px", borderBottom: idx < filtered.length - 1 ? `1px solid ${ERP.colors.divider}` : "none",
              background: confirmRemoveId === r.id
                ? "#FEF2F2"
                : hoveredBtnId === r.id
                  ? ERP.colors.accentPale
                  : r.status === "repeat" ? "#FFFBEB" : ERP.colors.surface,
              cursor: "pointer", transition: "background 0.12s",
            }}
          >
            <div style={{ padding: "13px 8px 13px 0", alignSelf: "center", fontSize: 13, color: ERP.colors.textSecondary }}>{r.classNum}</div>
            <div style={{ padding: "13px 8px 13px 0", alignSelf: "center" }}>
              <div style={{ fontSize: 14, fontWeight: hoveredBtnId === r.id ? 700 : 600, color: hoveredBtnId === r.id ? ERP.colors.accent : ERP.colors.textPrimary, transition: "color 0.12s" }}>{r.chName}</div>
              <div style={{ fontSize: 11, color: ERP.colors.textMuted }}>{r.enName}</div>
            </div>
            <div style={{ padding: "13px 8px 13px 0", alignSelf: "center" }}>
              <span style={{ fontFamily: ERP.font.mono, fontSize: 12, color: ERP.colors.accent, fontWeight: 600 }}>{r.id}</span>
            </div>
            <div style={{ padding: "13px 8px 13px 0", alignSelf: "center" }}>
              <span style={{
                padding: "2px 8px", borderRadius: 9999, fontSize: 11, fontWeight: 600,
                background: r.status === "repeat" ? "#FEF3C7" : "#D1FAE5",
                color: r.status === "repeat" ? "#92400E" : "#065F46",
                border: `1px solid ${r.status === "repeat" ? "#FCD34D" : "#6EE7B7"}`,
              }}>
                {r.status === "repeat" ? T.statusRepeat : T.statusActive}
              </span>
            </div>

            {/* ── Action cell ─────────────────────────────────────────────── */}
            <div style={{ padding: "10px 0", alignSelf: "center", display: "flex", alignItems: "center", gap: 5 }} onClick={e => e.stopPropagation()}>

              {/* View profile */}
              <button
                onClick={e => { e.stopPropagation(); onViewStudent?.(r.id, cls.classCode); }}
                onMouseEnter={() => setHoveredBtnId(r.id)}
                onMouseLeave={() => setHoveredBtnId(null)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "4px 10px", borderRadius: ERP.radius.sm,
                  border: `1px solid ${hoveredBtnId === r.id ? ERP.colors.accentDark : ERP.colors.accentLight}`,
                  background: hoveredBtnId === r.id ? ERP.colors.accent : ERP.colors.accentPale,
                  color: hoveredBtnId === r.id ? "#fff" : ERP.colors.accent,
                  fontSize: 11.5, fontFamily: F, cursor: "pointer", fontWeight: 600,
                  transition: "all 0.15s",
                }}
              >
                {T.viewProfile}
              </button>

              {/* Transfer button */}
              <button
                onClick={e => { e.stopPropagation(); setConfirmRemoveId(null); setShowTransferId(r.id); }}
                title={T.transfer}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "4px 9px", borderRadius: ERP.radius.sm,
                  border: `1px solid #FDE68A`,
                  background: "#FFFBEB",
                  color: "#D97706",
                  fontSize: 11.5, fontFamily: F, cursor: "pointer", fontWeight: 600,
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "#FEF3C7"; e.currentTarget.style.borderColor = "#F59E0B"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#FFFBEB"; e.currentTarget.style.borderColor = "#FDE68A"; }}
              >
                <ArrowRightLeft size={12} /> {T.transfer}
              </button>

              {/* Remove — with inline confirm */}
              {confirmRemoveId === r.id ? (
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 10.5, color: "#B91C1C", fontWeight: 600, fontFamily: F, whiteSpace: "nowrap" }}>{T.confirmRemove}</span>
                  <button onClick={() => handleRemove(r.id)} style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "3px 8px", borderRadius: ERP.radius.sm, border: "none", background: "#DC2626", color: "#fff", fontSize: 11, fontFamily: F, cursor: "pointer", fontWeight: 700 }}>
                    <Check size={11} /> {T.confirmYes}
                  </button>
                  <button onClick={() => setConfirmRemoveId(null)} style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "3px 8px", borderRadius: ERP.radius.sm, border: `1px solid ${ERP.colors.border}`, background: ERP.colors.surface, color: ERP.colors.textSecondary, fontSize: 11, fontFamily: F, cursor: "pointer" }}>
                    {T.confirmNo}
                  </button>
                </div>
              ) : (
                <button
                  onClick={e => { e.stopPropagation(); setConfirmRemoveId(r.id); }}
                  title={T.remove}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    padding: "4px 9px", borderRadius: ERP.radius.sm,
                    border: `1px solid #FCA5A5`,
                    background: "#FEF2F2",
                    color: "#DC2626",
                    fontSize: 11.5, fontFamily: F, cursor: "pointer", fontWeight: 600,
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#FEE2E2"; e.currentTarget.style.borderColor = "#F87171"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "#FEF2F2"; e.currentTarget.style.borderColor = "#FCA5A5"; }}
                >
                  <Trash2 size={12} /> {T.remove}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>{/* end overflow-x */}

      {/* Empty state */}
      {filtered.length === 0 && (
        <div style={{ padding: "32px 0", textAlign: "center", fontSize: 13, color: ERP.colors.textMuted, fontFamily: F }}>
          {search ? "找不到符合的學生" : "此班暫無學生記錄"}
        </div>
      )}
      </div>
    </div>
  );
};

// ─── Class Card ───────────────────────────────────────────────────────────────

const ClassCard: React.FC<{
  cls: ClassInfo; lang: "en" | "zh-HK";
  onOpen: () => void;
}> = ({ cls, lang, onOpen }) => {
  const F = ERP.font.family;
  const T = lang === "zh-HK"
    ? { formTeacher: "班主任", headcount: "學生人數", activeActs: "進行中活動", openRoster: "開啟名冊" }
    : { formTeacher: "Form Teacher", headcount: "Students", activeActs: "Active Activities", openRoster: "Open Roster" };

  const formColors: Record<string, { bg: string; color: string }> = {
    F1: { bg: "#DBEAFE", color: "#1D4ED8" },
    F2: { bg: "#EDE9FE", color: "#6D28D9" },
    F3: { bg: "#FCE7F3", color: "#BE185D" },
    F4: { bg: "#DCFCE7", color: "#15803D" },
    F5: { bg: "#FEF3C7", color: "#92400E" },
    F6: { bg: "#CCFBF1", color: "#0F766E" },
  };
  const fc = formColors[cls.form] ?? { bg: ERP.colors.accentPale, color: ERP.colors.accent };

  return (
    <div style={{
      background: ERP.colors.surface, borderRadius: ERP.radius.xl,
      border: `1px solid ${ERP.colors.border}`, padding: "20px 24px",
      display: "flex", flexDirection: "column", gap: 16,
      boxShadow: ERP.shadow.sm, cursor: "pointer", transition: "box-shadow 0.15s, transform 0.15s",
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = ERP.shadow.md; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = ERP.shadow.sm; (e.currentTarget as HTMLDivElement).style.transform = "none"; }}
      onClick={onOpen}
    >
      {/* Card header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{
          width: 52, height: 52, borderRadius: ERP.radius.lg,
          background: fc.bg, color: fc.color,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, fontWeight: 800, fontFamily: F, flexShrink: 0,
        }}>
          {cls.classCode}
        </div>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: ERP.colors.textPrimary, fontFamily: F }}>
            {cls.classCode}
          </div>
          <div style={{ fontSize: 12, color: ERP.colors.textMuted, marginTop: 2, fontFamily: F }}>
            {cls.room}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 0, borderTop: `1px solid ${ERP.colors.divider}`, paddingTop: 14 }}>
        {[
          { icon: Users, label: T.headcount, value: cls.headcount },
          { icon: BookOpen, label: T.formTeacher, value: cls.formTeacher },
          { icon: Activity, label: T.activeActs, value: cls.activeActivities },
        ].map((item, idx) => (
          <div key={idx} style={{
            flex: 1, display: "flex", flexDirection: "column", gap: 3,
            paddingRight: idx < 2 ? 12 : 0,
            borderRight: idx < 2 ? `1px solid ${ERP.colors.divider}` : "none",
            paddingLeft: idx > 0 ? 12 : 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <item.icon size={12} color={ERP.colors.textMuted} />
              <span style={{ fontSize: 10, color: ERP.colors.textMuted, fontFamily: F }}>{item.label}</span>
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: ERP.colors.textPrimary, fontFamily: F }}>
              {item.value}
            </div>
          </div>
        ))}
      </div>

      {/* Open roster button */}
      <button
        onClick={e => { e.stopPropagation(); onOpen(); }}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          padding: "9px 16px", borderRadius: ERP.radius.md,
          border: `1px solid ${ERP.colors.accentLight}`, background: ERP.colors.accentPale,
          color: ERP.colors.accent, fontSize: 13, fontWeight: 600, fontFamily: F,
          cursor: "pointer", width: "100%",
        }}
      >
        <ClipboardList size={14} />{T.openRoster}<ChevronRight size={13} />
      </button>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  lang?: "en" | "zh-HK";
  onViewStudent?: (studentId: string, classCode: string) => void;
}

export const Screen_ClassList: React.FC<Props> = ({
  lang = "zh-HK",
  onViewStudent,
}) => {
  const [openClassId, setOpenClassId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const F = ERP.font.family;

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const T = lang === "zh-HK"
    ? {
        pageTitle: "班別列表",
        subtitle: "AY 2025/26 · 全校班別",
        colClasses: "個班級",
        totalStudents: "名學生",
        activeActs: "項進行中活動",
      }
    : {
        pageTitle: "Class List",
        subtitle: "AY 2025/26 · All Classes",
        colClasses: "Classes",
        totalStudents: "Students",
        activeActs: "Active Activities",
      };

  const openClass = openClassId ? CLASSES.find(c => c.id === openClassId) : null;

  if (openClass) {
    return (
      <RosterView
        cls={openClass}
        lang={lang}
        isMobile={isMobile}
        onBack={() => setOpenClassId(null)}
        onViewStudent={onViewStudent}
      />
    );
  }

  const totalStudents = CLASSES.reduce((acc, c) => acc + c.headcount, 0);
  const totalActs = CLASSES.reduce((acc, c) => acc + c.activeActivities, 0);

  return (
    <div style={{
      fontFamily: F, background: ERP.colors.pageBg,
      minHeight: "100%", padding: isMobile ? 16 : ERP.layout.contentPad,
      display: "flex", flexDirection: "column", gap: isMobile ? 14 : 20,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: ERP.colors.textPrimary, letterSpacing: "-0.3px" }}>
            {T.pageTitle}
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: ERP.colors.textSecondary }}>
            {T.subtitle}
          </p>
        </div>
        {/* Summary chips */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {[
            { val: CLASSES.length, label: T.colClasses, color: ERP.colors.accent },
            { val: totalStudents, label: T.totalStudents, color: ERP.colors.teal },
            { val: totalActs, label: T.activeActs, color: ERP.colors.green },
          ].map((chip, i) => (
            <div key={i} style={{
              padding: "6px 14px", borderRadius: ERP.radius.full,
              background: chip.color + "12", border: `1px solid ${chip.color}30`,
              display: "flex", alignItems: "center", gap: 5,
            }}>
              <span style={{ fontWeight: 700, color: chip.color, fontSize: 14 }}>{chip.val}</span>
              <span style={{ color: ERP.colors.textSecondary, fontSize: 12 }}>{chip.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Class Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {CLASSES.map(cls => (
          <ClassCard key={cls.id} cls={cls} lang={lang} onOpen={() => setOpenClassId(cls.id)} />
        ))}
      </div>
    </div>
  );
};
