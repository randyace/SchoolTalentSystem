// ─────────────────────────────────────────────────────────────────────────────
// Screen_BatchOCR — 證書批次上傳與審核 (Batch Certificate Upload & Review)
// ERP v3.0 · zh-HK / EN bilingual
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Sparkles, CheckCircle2, Star, User, Search, Trash2,
  ChevronRight, ChevronLeft, Save, ArrowRight,
  AlertCircle, FileCheck, Layers, Upload, Link2,
  ChevronDown, Plus, X, ScanLine, Clock,
} from "lucide-react";
import { ERP } from "./erpTokens";

const C = ERP.colors;
const R = ERP.radius;
const S = ERP.shadow;
const F = ERP.font.family;

// ── Mock events for the event linkage selectbox ───────────────────────────────
const MOCK_EVENTS = [
  "（未關聯活動）— No linked event",
  "2024-25 南區中學校際足球賽 (South District Football)",
  "2024-25 全港 STEM 創新大賽 (HK STEM Innovation Challenge)",
  "2024-25 全港中學生辯論比賽 (HK Secondary Debate)",
  "2024-25 聯校音樂比賽 (Joint-School Music Festival)",
  "2024-25 視覺藝術創作展 (Visual Arts Exhibition)",
];

// ── OCR mock fill data for simulated new uploads ──────────────────────────────
const OCR_MOCK_FILL: Omit<CertData, "id">[] = [
  { studentZh: "吳嘉欣", studentEn: "Ng Ka Yan",   classCode: "F3A",
    event: "Joint-School Music Festival", award: "Gold Award",
    level: "L3 District", tier: "T4 Award", date: "2025-03-10", hours: "22",
    confidence: 92.3, matchConf: 96 },
  { studentZh: "楊浩然", studentEn: "Yeung Ho Yin", classCode: "F3B",
    event: "HK STEM Innovation Challenge", award: "Merit Prize",
    level: "L4 Regional", tier: "T3 Finalist", date: "2025-02-18", hours: "30",
    confidence: 88.1, matchConf: 91 },
  { studentZh: "馮紫晴", studentEn: "Fung Zi Ching", classCode: "F2A",
    event: "Visual Arts Exhibition", award: "Best in Show",
    level: "L3 District", tier: "T4 Award", date: "2025-04-05", hours: "16",
    confidence: 95.4, matchConf: 98 },
];

// ── Mock batch data ───────────────────────────────────────────────────────────
interface CertData {
  id:              number;
  studentZh:       string;
  studentEn:       string;
  classCode:       string;
  event:           string;
  award:           string;
  level:           string;
  tier:            string;
  date:            string;
  hours:           string;
  confidence:      number;
  matchConf:       number;
}

const BATCH_CERTS: CertData[] = [
  { id: 1, studentZh: "陳大文", studentEn: "Chan Tai Man",  classCode: "F1A",
    event: "Regional Science Competition", award: "Gold Award",
    level: "L4 Regional", tier: "T4 Award", date: "2025-11-15", hours: "24",
    confidence: 94.7, matchConf: 98 },
  { id: 2, studentZh: "李小明", studentEn: "Li Siu Ming",   classCode: "F2B",
    event: "Robotics Olympiad HK",         award: "Silver Award",
    level: "L4 Regional", tier: "T4 Award", date: "2025-10-22", hours: "36",
    confidence: 87.2, matchConf: 92 },
  { id: 3, studentZh: "黃美玲", studentEn: "Wong Mei Ling", classCode: "F3C",
    event: "Creative Writing Contest",     award: "First Prize",
    level: "L3 District", tier: "T4 Award", date: "2025-09-08", hours: "18",
    confidence: 91.5, matchConf: 95 },
  { id: 4, studentZh: "張志豪", studentEn: "Cheung Chi Ho", classCode: "F1D",
    event: "Mathematics Competition",      award: "Merit Award",
    level: "L2 School", tier: "T3 Finalist", date: "2025-12-01", hours: "12",
    confidence: 78.9, matchConf: 88 },
  { id: 5, studentZh: "劉詩雯", studentEn: "Lau Sze Man",   classCode: "F2A",
    event: "Public Speaking Competition",  award: "Best Speaker",
    level: "L4 Regional", tier: "T4 Award", date: "2025-11-28", hours: "20",
    confidence: 96.1, matchConf: 99 },
];

// ── Thumbnail ─────────────────────────────────────────────────────────────────
const Thumbnail: React.FC<{
  cert:      CertData;
  index:     number;
  active:    boolean;
  saved:     boolean;
  discarded: boolean;
  scanning?: boolean;
  onClick:   () => void;
}> = ({ cert, index, active, saved, discarded, scanning, onClick }) => (
  <button
    onClick={onClick}
    style={{
      flexShrink: 0,
      width: 72, height: 90,
      border: active ? `2px solid ${C.accent}` : `1px solid ${C.border}`,
      borderRadius: R.md,
      background: scanning ? "#F0FDF4" : discarded ? C.errorLight : saved ? C.greenLight : active ? C.accentPale : C.surface,
      cursor: scanning ? "default" : "pointer",
      padding: 0,
      position: "relative",
      opacity: discarded ? 0.55 : active ? 1 : 0.75,
      boxShadow: active ? `0 0 0 3px ${C.accentLight}, ${S.sm}` : S.xs,
      transition: "all 0.18s ease",
      overflow: "hidden",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 3,
    }}
  >
    {scanning ? (
      <>
        {/* Scan line animation */}
        <style>{`
          @keyframes scanMove { 0%{top:10%} 100%{top:85%} }
          @keyframes scanPulse { 0%,100%{opacity:0.5} 50%{opacity:1} }
        `}</style>
        <div style={{ fontSize: 16, opacity: 0.4 }}>📄</div>
        <div style={{
          position: "absolute", left: 0, right: 0, height: 2,
          background: "linear-gradient(90deg, transparent, #38BDF8, #818CF8, transparent)",
          animation: "scanMove 1.1s linear infinite",
          boxShadow: "0 0 6px #38BDF8",
        }} />
        <div style={{
          fontSize: 7.5, fontWeight: 800, letterSpacing: "0.04em",
          color: "#0369A1", fontFamily: F, marginTop: 28,
          animation: "scanPulse 1.1s ease-in-out infinite",
        }}>OCR 掃瞄中…</div>
      </>
    ) : (
      <>
        <div style={{ fontSize: 20 }}>🏆</div>
        <div style={{
          fontSize: 9, color: C.textSecondary, fontFamily: F,
          lineHeight: 1.2, textAlign: "center", padding: "0 4px",
        }}>
          {cert.studentZh}
        </div>
        <div style={{
          fontSize: 8, fontFamily: F, fontWeight: 700,
          color: active ? C.accent : C.textMuted,
          background: active ? C.accentLight : C.divider,
          padding: "1px 5px", borderRadius: R.xs,
        }}>
          {cert.classCode}
        </div>
        <div style={{ fontSize: 9, color: C.textMuted, fontFamily: F }}>
          #{index + 1}
        </div>
      </>
    )}
    {saved && !scanning && (
      <div style={{ position: "absolute", top: 4, right: 4 }}>
        <CheckCircle2 size={12} color={C.success} />
      </div>
    )}
    {discarded && (
      <div style={{ position: "absolute", top: 3, right: 4, fontSize: 11, color: C.error, fontWeight: 700 }}>✕</div>
    )}
    {active && !scanning && (
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: C.accent }} />
    )}
  </button>
);

// ── Certificate Preview ───────────────────────────────────────────────────────
const CertPreview: React.FC<{ cert: CertData }> = ({ cert }) => (
  <div style={{
    background: "linear-gradient(135deg, #EBF2FF 0%, #F0FDF4 100%)",
    border: "3px dashed #93C5FD",
    borderRadius: R.lg,
    padding: "24px 20px",
    textAlign: "center",
    flex: 1,
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    gap: 9, fontFamily: F, position: "relative",
    minHeight: 200,
  }}>
    <div style={{
      position: "absolute", inset: 8,
      border: "2px solid #BFDBFE", borderRadius: R.md, pointerEvents: "none",
    }} />
    <div style={{ fontSize: 32 }}>🏆</div>
    <div style={{
      fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase",
      color: C.accentMid, fontWeight: 700,
    }}>
      Certificate of Achievement
    </div>
    <div style={{ fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
      This is to certify that
    </div>
    <div style={{
      fontSize: 15, fontWeight: 800, color: C.textPrimary,
      borderBottom: "2px solid #93C5FD", paddingBottom: 4, lineHeight: 1.3,
    }}>
      {cert.studentEn} {cert.studentZh}
    </div>
    <div style={{ fontSize: 11, color: C.textSecondary }}>has demonstrated excellence in</div>
    <div style={{
      fontSize: 12, fontWeight: 700, color: C.accent,
      background: C.accentLight, padding: "4px 12px", borderRadius: R.full,
    }}>
      {cert.event}
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <Star size={12} color="#F59E0B" fill="#F59E0B" />
      <span style={{ fontSize: 13, fontWeight: 700, color: "#D97706" }}>{cert.award}</span>
      <Star size={12} color="#F59E0B" fill="#F59E0B" />
    </div>
    <div style={{ fontSize: 10, color: C.textMuted }}>{cert.date}</div>
  </div>
);

// ── Confidence Bar ────────────────────────────────────────────────────────────
const ConfidenceBar: React.FC<{ label: string; value: number }> = ({ label, value }) => {
  const color = value >= 92 ? C.success : value >= 80 ? C.amber : C.error;
  return (
    <div style={{ fontFamily: F }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span style={{ fontSize: 11, color: C.textSecondary }}>{label}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color }}>{value}%</span>
      </div>
      <div style={{ height: 5, background: C.border, borderRadius: R.full }}>
        <div style={{
          height: "100%", width: `${value}%`,
          background: color, borderRadius: R.full, transition: "width 0.4s ease",
        }} />
      </div>
    </div>
  );
};

// ── Form Helpers ──────────────────────────────────────────────────────────────
const FormLabel: React.FC<{ zh: string; en: string }> = ({ zh, en }) => (
  <div style={{ marginBottom: 5 }}>
    <span style={{ fontSize: 12, fontWeight: 700, color: C.textPrimary, fontFamily: F }}>{zh}</span>
    <span style={{ fontSize: 11, color: C.textMuted, fontFamily: F }}> · {en}</span>
  </div>
);

const inputBase: React.CSSProperties = {
  width: "100%", height: 36, padding: "0 10px",
  border: `1px solid ${C.border}`, borderRadius: R.md,
  fontSize: 13, color: C.textPrimary, fontFamily: F,
  background: C.surface, boxSizing: "border-box", outline: "none",
};

const selectBase: React.CSSProperties = {
  ...inputBase, cursor: "pointer",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center",
  paddingRight: 28, appearance: "none" as React.CSSProperties["appearance"],
};

// ── Main Component ────────────────────────────────────────────────────────────
export const Screen_BatchOCR: React.FC = () => {
  const [activeIdx,    setActiveIdx]    = useState(0);
  const [saved,        setSaved]        = useState<Set<number>>(new Set());
  const [discarded,    setDiscarded]    = useState<Set<number>>(new Set());
  const [submitDone,   setSubmitDone]   = useState(false);
  const [isMobile,     setIsMobile]     = useState(false);
  const [linkedEvent,  setLinkedEvent]  = useState(MOCK_EVENTS[0]);
  const [eventOpen,    setEventOpen]    = useState(false);
  const [dragOver,     setDragOver]     = useState(false);
  const [dynCerts,     setDynCerts]     = useState<CertData[]>(BATCH_CERTS);
  const [scanningIds,  setScanningIds]  = useState<Set<number>>(new Set());
  const ocrFillIdx = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Simulate OCR processing for newly dropped files
  const processDroppedFiles = useCallback((files: FileList | File[]) => {
    const fileArr = Array.from(files);
    fileArr.forEach((file, i) => {
      const newId = Date.now() + i;
      // Placeholder cert while scanning
      const placeholder: CertData = {
        id: newId, studentZh: "掃瞄中…", studentEn: file.name.replace(/\.[^.]+$/, ""),
        classCode: "—", event: "—", award: "—", level: "—", tier: "—",
        date: "", hours: "0", confidence: 0, matchConf: 0,
      };
      setDynCerts(prev => [...prev, placeholder]);
      setScanningIds(prev => new Set([...prev, newId]));

      // After 1.8s, replace with OCR-filled data
      setTimeout(() => {
        const fill = OCR_MOCK_FILL[ocrFillIdx.current % OCR_MOCK_FILL.length];
        ocrFillIdx.current += 1;
        const filled: CertData = { ...fill, id: newId };
        setDynCerts(prev => prev.map(c => c.id === newId ? filled : c));
        setScanningIds(prev => { const n = new Set(prev); n.delete(newId); return n; });
        setForms(prev => [
          ...prev,
          { level: fill.level, tier: fill.tier, title: fill.event, award: fill.award, hours: fill.hours, date: fill.date },
        ]);
        // Auto-select the newly finished cert
        setActiveIdx(prev => prev); // keep current selection or jump: setActiveIdx(dynCerts.length)
      }, 1800 + i * 600);
    });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) processDroppedFiles(e.dataTransfer.files);
  }, [processDroppedFiles]);

  const [forms, setForms] = useState(
    BATCH_CERTS.map(c => ({
      level: c.level, tier: c.tier, title: c.event,
      award: c.award, hours: c.hours, date: c.date,
    }))
  );

  const cert        = dynCerts[activeIdx] ?? dynCerts[0];
  const form        = forms[activeIdx] ?? forms[0];
  const savedCount  = saved.size + discarded.size;
  const allDone     = savedCount === dynCerts.length && dynCerts.length > 0 && scanningIds.size === 0;
  const isSaved     = saved.has(activeIdx);
  const isDiscarded = discarded.has(activeIdx);
  const isScanning  = scanningIds.has(cert?.id);

  const updateField = (field: keyof typeof form, val: string) => {
    setForms(prev => {
      const next = [...prev];
      next[activeIdx] = { ...next[activeIdx], [field]: val };
      return next;
    });
  };

  const nextPending = (from: number, newSaved: Set<number>, newDisc: Set<number>) => {
    const after = dynCerts.findIndex((_, i) => i > from && !newSaved.has(i) && !newDisc.has(i));
    if (after !== -1) return after;
    const any   = dynCerts.findIndex((_, i) => i !== from && !newSaved.has(i) && !newDisc.has(i));
    return any !== -1 ? any : from;
  };

  const handleSaveNext = () => {
    const ns = new Set([...saved, activeIdx]);
    setSaved(ns);
    setActiveIdx(nextPending(activeIdx, ns, discarded));
  };

  const handleDiscard = () => {
    const nd = new Set([...discarded, activeIdx]);
    setDiscarded(nd);
    setActiveIdx(nextPending(activeIdx, saved, nd));
  };

  const handleSubmitAll = () => {
    if (allDone && !submitDone) setSubmitDone(true);
  };

  const ENV_OPTIONS  = ["L1 Personal","L2 School","L3 District","L4 Regional","L5 National","L6 Asia-Pacific","L7 International"];
  const TIER_OPTIONS = ["T1 Member","T2 Participant","T3 Finalist","T4 Award"];
  const totalCerts   = dynCerts.length;

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: isMobile ? "auto" : "calc(100vh - 56px)",
      minHeight: isMobile ? "100%" : undefined,
      fontFamily: F, background: C.pageBg,
      overflow: isMobile ? "visible" : "hidden",
    }}>

      {/* ── Page Header ── */}
      <div style={{
        flexShrink: 0,
        background: C.surface, borderBottom: `1px solid ${C.border}`,
        display: "flex", alignItems: "center",
        padding: isMobile ? "10px 16px" : "0 24px",
        height: isMobile ? "auto" : 52,
        gap: 12, flexWrap: "wrap",
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: R.md,
          background: C.accentLight, display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <Layers size={15} color={C.accent} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.textPrimary, lineHeight: 1.2 }}>
            證書批次上傳與審核
          </div>
          {!isMobile && <div style={{ fontSize: 11, color: C.textMuted }}>Batch Certificate Upload & Review</div>}
        </div>
        {/* Status summary pills */}
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          {[
            { label: isMobile ? `${saved.size} 核准` : `${saved.size} 已核准`, bg: C.greenLight,  color: C.success,  border: `${C.success}30`  },
            { label: isMobile ? `${discarded.size} 捨棄` : `${discarded.size} 已捨棄`, bg: C.errorLight, color: C.error,   border: `${C.error}30`   },
            { label: isMobile ? `${totalCerts - savedCount} 待審` : `${totalCerts - savedCount} 待審核`, bg: C.amberLight, color: C.amber,   border: `${C.amber}30`   },
          ].map(p => (
            <div key={p.label} style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: "3px 8px", background: p.bg,
              border: `1px solid ${p.border}`, borderRadius: R.full,
              fontSize: 11, fontWeight: 700, color: p.color, whiteSpace: "nowrap",
            }}>
              {p.label}
            </div>
          ))}
        </div>
      </div>

      {/* ── Event Linkage Bar ── */}
      <div style={{
        flexShrink: 0,
        background: "linear-gradient(135deg, #1E3A8A, #2563EB)",
        borderBottom: "1px solid #1D4ED8",
        padding: isMobile ? "10px 16px" : "10px 24px",
        display: "flex", alignItems: "center", gap: 14,
        flexWrap: "wrap",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Link2 size={13} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.6)", letterSpacing: "0.07em", textTransform: "uppercase", lineHeight: 1 }}>關聯活動 / 比賽</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)" }}>Link to Event / Competition</div>
          </div>
        </div>

        <div style={{ width: 1, height: 28, background: "rgba(255,255,255,0.2)", flexShrink: 0 }} />

        {/* Event dropdown */}
        <div style={{ position: "relative", flex: 1, minWidth: 220, maxWidth: 480 }}>
          <button
            onClick={() => setEventOpen(v => !v)}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 8,
              padding: "8px 13px",
              background: "rgba(255,255,255,0.12)",
              border: `1.5px solid ${eventOpen ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.28)"}`,
              borderRadius: 9, cursor: "pointer", fontFamily: F,
              color: "#fff", fontSize: 12.5, fontWeight: 600,
              transition: "all 0.14s",
            }}
          >
            <CheckCircle2 size={13} color={linkedEvent === MOCK_EVENTS[0] ? "rgba(255,255,255,0.4)" : "#6EE7B7"} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", opacity: linkedEvent === MOCK_EVENTS[0] ? 0.55 : 1 }}>
              {linkedEvent}
            </span>
            <ChevronDown size={13} color="rgba(255,255,255,0.65)" style={{ flexShrink: 0, transform: eventOpen ? "rotate(180deg)" : "none", transition: "transform 0.14s" }} />
          </button>

          {eventOpen && (
            <>
              <div onClick={() => setEventOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 199 }} />
              <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, background: C.surface, border: `1px solid ${C.border}`, borderRadius: R.lg, boxShadow: "0 8px 24px rgba(0,0,0,0.14)", zIndex: 200, overflow: "hidden" }}>
                {MOCK_EVENTS.map(ev => (
                  <button
                    key={ev}
                    onClick={() => { setLinkedEvent(ev); setEventOpen(false); }}
                    style={{
                      width: "100%", textAlign: "left", padding: "10px 15px",
                      border: "none", borderBottom: `1px solid ${C.border}`,
                      background: ev === linkedEvent ? C.accentPale : "transparent",
                      color: ev === linkedEvent ? C.accent : C.textSecondary,
                      fontSize: 12.5, fontWeight: ev === linkedEvent ? 700 : 400,
                      cursor: "pointer", fontFamily: F,
                      display: "flex", alignItems: "center", gap: 10,
                    }}
                  >
                    {ev === linkedEvent
                      ? <CheckCircle2 size={12} color={C.accent} />
                      : <div style={{ width: 12, height: 12, borderRadius: "50%", border: `1.5px solid ${C.border}` }} />
                    }
                    <span style={{ flex: 1 }}>{ev}</span>
                  </button>
                ))}
                <button
                  onClick={() => setEventOpen(false)}
                  style={{ width: "100%", padding: "8px 15px", border: "none", background: "#F8FAFC", color: C.textMuted, fontSize: 11, cursor: "pointer", fontFamily: F, display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}
                >
                  <Plus size={11} /> 新增活動… Add Event
                </button>
              </div>
            </>
          )}
        </div>

        {/* Cert count pill */}
        {linkedEvent !== MOCK_EVENTS[0] && (
          <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 5, padding: "4px 11px", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 999, fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.8)" }}>
            <Layers size={10} color="rgba(255,255,255,0.7)" />
            {totalCerts} 份證書將關聯至此活動
          </div>
        )}
      </div>

      {/* ── Two-panel body ── */}
      <div style={{
        flex: isMobile ? "none" : 1,
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        overflow: isMobile ? "visible" : "hidden",
      }}>

        {/* ════ LEFT PANE (45%) ════ */}
        <div style={{
          flex: isMobile ? "none" : "0 0 42%",
          minWidth: isMobile ? 0 : 360,
          maxWidth: isMobile ? "none" : 520,
          display: "flex", flexDirection: "column",
          borderRight: isMobile ? "none" : `1px solid ${C.border}`,
          borderBottom: isMobile ? `1px solid ${C.border}` : "none",
          background: C.surface,
          overflow: isMobile ? "visible" : "hidden",
        }}>
          {/* Left header */}
          <div style={{
            padding: isMobile ? "10px 16px" : "12px 20px",
            borderBottom: `1px solid ${C.border}`,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexShrink: 0,
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary }}>批量處理</div>
              <div style={{ fontSize: 11, color: C.textMuted }}>Batch Processing</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {scanningIds.size > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: R.full, background: "#F0FDF4", border: "1px solid #A7F3D0", fontSize: 10, fontWeight: 700, color: "#065F46" }}>
                  <Clock size={9} color="#059669" />
                  OCR 處理中 {scanningIds.size} 份
                </div>
              )}
              <div style={{
                padding: "3px 10px", borderRadius: R.full,
                background: C.accentPale, border: `1px solid ${C.accentLight}`,
                fontSize: 11, fontWeight: 700, color: C.accent,
              }}>
                {totalCerts} 份文件
              </div>
            </div>
          </div>

          {/* ── Upload Drop Zone ── */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(false); }}
            onDrop={handleDrop}
            style={{
              margin: "10px 14px 4px",
              padding: dragOver ? "14px 12px" : "12px",
              border: `2px dashed ${dragOver ? C.accent : C.border}`,
              borderRadius: R.lg,
              background: dragOver ? C.accentPale : "#FAFBFC",
              display: "flex", alignItems: "center", gap: 10,
              cursor: "pointer",
              transition: "all 0.18s",
              flexShrink: 0,
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".png,.jpg,.jpeg,.pdf"
              style={{ display: "none" }}
              onChange={e => { if (e.target.files) processDroppedFiles(e.target.files); e.target.value = ""; }}
            />
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: dragOver ? C.accentLight : C.border,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.18s",
            }}>
              <Upload size={16} color={dragOver ? C.accent : C.textMuted} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: dragOver ? C.accent : C.textPrimary, lineHeight: 1.2 }}>
                {dragOver ? "放開以上傳文件" : "拖放或點擊上傳證書"}
              </div>
              <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>
                支援 PNG · JPG · PDF · 可多選 · OCR 自動識別
              </div>
            </div>
            <div style={{
              flexShrink: 0, padding: "4px 10px", borderRadius: R.full,
              border: `1px solid ${dragOver ? C.accent : C.border}`,
              background: dragOver ? C.accentPale : C.surface,
              fontSize: 10, fontWeight: 700,
              color: dragOver ? C.accent : C.textMuted,
            }}>
              選擇文件
            </div>
          </div>

          {/* Thumbnail Strip */}
          <div style={{
            padding: isMobile ? "8px 16px 8px" : "8px 14px 8px",
            borderBottom: `1px solid ${C.divider}`,
            display: "flex", gap: 8,
            overflowX: "auto",
            flexShrink: 0,
          }}>
            {dynCerts.map((c, i) => (
              <Thumbnail
                key={c.id}
                cert={c} index={i}
                active={i === activeIdx}
                saved={saved.has(i)}
                discarded={discarded.has(i)}
                scanning={scanningIds.has(c.id)}
                onClick={() => !scanningIds.has(c.id) && setActiveIdx(i)}
              />
            ))}
          </div>

          {/* Certificate Preview + Confidence */}
          <div style={{
            flex: isMobile ? "none" : 1,
            overflowY: isMobile ? "visible" : "auto",
            overflowX: "hidden",
            padding: isMobile ? "12px 16px" : "16px 20px",
            display: "flex", flexDirection: "column", gap: 12,
          }}>
            <CertPreview cert={cert} />

            {/* AI Confidence Pill */}
            <div>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "5px 12px",
                background: cert.confidence >= 90 ? "#D1FAE5" : "#FEF3C7",
                border: `1px solid ${cert.confidence >= 90 ? "#A7F3D0" : "#FCD34D"}`,
                borderRadius: R.full,
                fontSize: 12, fontWeight: 700,
                color: cert.confidence >= 90 ? "#065F46" : "#92400E",
              }}>
                <CheckCircle2 size={12} color={cert.confidence >= 90 ? C.success : C.amber} />
                🟢 AI Confidence Score: {cert.confidence}%
              </span>
            </div>

            {/* Field-level confidence */}
            <div style={{
              padding: 14, background: C.pageBg,
              borderRadius: R.md, border: `1px solid ${C.border}`,
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.textSecondary, marginBottom: 10 }}>
                欄位置信度 · Field Confidence
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <ConfidenceBar label="Student Name 學生姓名"  value={cert.matchConf} />
                <ConfidenceBar label="Award Level 獎項級別"   value={Math.min(99, Math.round(cert.confidence + 3))} />
                <ConfidenceBar label="Event Title 活動名稱"   value={Math.round(cert.confidence - 1)} />
                <ConfidenceBar label="Event Date 日期"        value={Math.round(cert.confidence - 4)} />
              </div>
            </div>
          </div>
        </div>

        {/* ════ RIGHT PANE (55%) ════ */}
        <div style={{
          flex: isMobile ? "none" : "1 1 0",
          minWidth: isMobile ? 0 : 420,
          display: "flex", flexDirection: "column",
          background: C.pageBg,
          overflow: isMobile ? "visible" : "hidden",
        }}>
          {/* Right header */}
          <div style={{
            padding: isMobile ? "10px 16px" : "12px 24px",
            borderBottom: `1px solid ${C.border}`,
            background: C.surface,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexShrink: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Sparkles size={14} color={C.accentMid} />
              <span style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary }}>
                ✨ Auto-Extracted Data
              </span>
              <span style={{ fontSize: 11, color: C.textMuted }}>自動萃取數據</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button
                onClick={() => setActiveIdx(Math.max(0, activeIdx - 1))}
                disabled={activeIdx === 0}
                style={{
                  width: 26, height: 26, borderRadius: R.sm,
                  border: `1px solid ${C.border}`, background: C.surface,
                  cursor: activeIdx === 0 ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  opacity: activeIdx === 0 ? 0.4 : 1,
                }}
              >
                <ChevronLeft size={13} color={C.textSecondary} />
              </button>
              <div style={{
                padding: "3px 12px", borderRadius: R.full,
                background: C.accentPale, border: `1px solid ${C.accentLight}`,
                fontSize: 11, fontWeight: 700, color: C.accent,
              }}>
                文件 {activeIdx + 1} / {totalCerts}
              </div>
              <button
                onClick={() => setActiveIdx(Math.min(totalCerts - 1, activeIdx + 1))}
                disabled={activeIdx === totalCerts - 1}
                style={{
                  width: 26, height: 26, borderRadius: R.sm,
                  border: `1px solid ${C.border}`, background: C.surface,
                  cursor: activeIdx === totalCerts - 1 ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  opacity: activeIdx === totalCerts - 1 ? 0.4 : 1,
                }}
              >
                <ChevronRight size={13} color={C.textSecondary} />
              </button>
            </div>
          </div>

          {/* Scrollable form area — Y-axis only; X is clipped */}
          <div style={{
            flex: isMobile ? "none" : 1,
            overflowY: isMobile ? "visible" : "auto",
            overflowX: "hidden",
            padding: isMobile ? "12px 16px" : "16px 24px",
            display: "flex", flexDirection: "column", gap: 12,
          }}>

            {/* AI notice banner */}
            {isScanning ? (
              <div style={{
                padding: "20px 14px", textAlign: "center",
                background: "#F0FDF4", border: "1px solid #A7F3D0",
                borderRadius: R.md,
              }}>
                <style>{`@keyframes ocrSpin{to{transform:rotate(360deg)}}`}</style>
                <div style={{ fontSize: 28, marginBottom: 10 }}>🔍</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#065F46", fontFamily: F }}>OCR 掃瞄中… Scanning</div>
                <div style={{ fontSize: 11, color: "#047857", marginTop: 4, fontFamily: F }}>AI 正在識別證書內容，請稍候…</div>
                <div style={{ display: "flex", justifyContent: "center", gap: 5, marginTop: 12 }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#059669", animation: `ocrSpin 0.9s ease-in-out ${i * 0.18}s infinite alternate`, opacity: 0.7 }} />
                  ))}
                </div>
              </div>
            ) : (
              <div style={{
                padding: "9px 14px",
                background: "#EFF6FF", border: "1px solid #BFDBFE",
                borderRadius: R.md, fontSize: 12, color: "#1E40AF", fontWeight: 500,
              }}>
                ✨ 以下欄位由 OCR 自動填寫，請審核後確認。Fields were auto-populated by AI — please review before saving.
              </div>
            )}

            {/* Form sections — hidden while OCR is in progress */}
            {!isScanning && (<>

            {/* ── SECTION 1: Student Association ── */}
            <div style={{
              background: C.surface, borderRadius: R.lg,
              border: `1px solid ${C.border}`, boxShadow: S.xs, overflow: "hidden",
            }}>
              <div style={{
                padding: "9px 16px",
                background: "linear-gradient(to right, #EFF6FF, #F0FDF4)",
                borderBottom: `1px solid ${C.border}`,
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <User size={13} color={C.accent} />
                <span style={{ fontSize: 12, fontWeight: 700, color: C.textPrimary }}>學生綁定</span>
                <span style={{ fontSize: 11, color: C.textMuted }}>· Student Association</span>
                <div style={{ flex: 1 }} />
                <span style={{
                  padding: "2px 8px", borderRadius: R.full, fontSize: 10, fontWeight: 700,
                  background: "#D1FAE5", color: "#065F46", border: "1px solid #A7F3D0",
                }}>
                  ✓ CRITICAL
                </span>
              </div>

              <div style={{ padding: "14px 16px" }}>
                <FormLabel zh="關聯學生" en="Linked Student" />

                {/* AI-matched student chip inside search box */}
                <div style={{
                  border: `2px solid ${C.accent}`,
                  borderRadius: R.md, background: C.surface,
                  padding: "7px 12px",
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <Search size={13} color={C.textMuted} style={{ flexShrink: 0 }} />

                  {/* Verified chip */}
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "3px 10px",
                    background: "#EFF6FF", border: `1px solid ${C.accentLight}`,
                    borderRadius: R.full,
                    fontSize: 12, fontWeight: 600, color: C.accentDark,
                  }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: "50%",
                      background: C.accentLight,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11,
                    }}>👤</div>
                    {cert.studentZh} {cert.studentEn} ({cert.classCode})
                    <CheckCircle2 size={11} color={C.success} />
                  </div>

                  <div style={{ flex: 1 }} />
                  <button style={{
                    fontSize: 11, color: C.accent, background: "none",
                    border: "none", cursor: "pointer", fontFamily: F, padding: 0,
                    fontWeight: 600,
                  }}>
                    更改
                  </button>
                </div>

                {/* AI helper text */}
                <div style={{
                  marginTop: 6, display: "flex", alignItems: "center", gap: 5,
                  fontSize: 11, color: "#7C3AED",
                }}>
                  <Sparkles size={10} color="#7C3AED" />
                  <span>
                    ✨ AI 根據證書姓名自動匹配 · Auto-matched by AI ({cert.matchConf}% confidence)
                  </span>
                </div>
              </div>
            </div>

            {/* ── SECTION 2: Extracted Data ── */}
            <div style={{
              background: C.surface, borderRadius: R.lg,
              border: `1px solid ${C.border}`, boxShadow: S.xs, overflow: "hidden",
            }}>
              <div style={{
                padding: "9px 16px",
                background: C.pageBg, borderBottom: `1px solid ${C.border}`,
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <FileCheck size={13} color={C.textSecondary} />
                <span style={{ fontSize: 12, fontWeight: 700, color: C.textPrimary }}>萃取數據</span>
                <span style={{ fontSize: 11, color: C.textMuted }}>· Extracted Data</span>
              </div>

              <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>

                <div>
                  <FormLabel zh="環境等級" en="Environment Level" />
                  <select
                    value={form.level}
                    onChange={e => updateField("level", e.target.value)}
                    style={selectBase}
                  >
                    {ENV_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>

                <div>
                  <FormLabel zh="參與層次" en="Tier Role" />
                  <select
                    value={form.tier}
                    onChange={e => updateField("tier", e.target.value)}
                    style={selectBase}
                  >
                    {TIER_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>

                <div>
                  <FormLabel zh="成就名稱" en="Achievement Title" />
                  <input
                    value={form.title}
                    onChange={e => updateField("title", e.target.value)}
                    style={inputBase}
                  />
                </div>

                <div>
                  <FormLabel zh="獎項詳情" en="Award Details" />
                  <input
                    value={form.award}
                    onChange={e => updateField("award", e.target.value)}
                    style={inputBase}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <FormLabel zh="時數" en="Hours Dimension" />
                    <input
                      type="number"
                      value={form.hours}
                      onChange={e => updateField("hours", e.target.value)}
                      style={inputBase}
                    />
                  </div>
                  <div>
                    <FormLabel zh="活動日期" en="Event Date" />
                    <input
                      type="date"
                      value={form.date}
                      onChange={e => updateField("date", e.target.value)}
                      style={inputBase}
                    />
                  </div>
                </div>

                {/* Saved state feedback */}
                {isSaved && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "10px 14px", background: C.greenLight,
                    border: "1px solid #A7F3D0", borderRadius: R.md,
                  }}>
                    <CheckCircle2 size={14} color={C.success} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#065F46", fontFamily: F }}>
                      ✓ 此記錄已儲存，等候批量寫入 · Queued for batch submission
                    </span>
                  </div>
                )}

                {/* Discarded state feedback */}
                {isDiscarded && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "10px 14px", background: C.errorLight,
                    border: "1px solid #FECACA", borderRadius: R.md,
                  }}>
                    <AlertCircle size={14} color={C.error} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.error, fontFamily: F }}>
                      此份已捨棄，不會寫入系統 · Discarded from batch
                    </span>
                  </div>
                )}
              </div>
            </div>

            </>)} {/* end !isScanning */}

            <div style={{ height: 8 }} />
          </div>

          {/* ════ STICKY BOTTOM ACTION BAR ════ */}
          <div style={{
            flexShrink: 0,
            borderTop: `1px solid ${C.border}`,
            background: C.surface,
            padding: isMobile ? "12px 16px" : "11px 20px 11px 24px",
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "stretch" : "center",
            gap: isMobile ? 10 : 16,
            boxShadow: "0 -2px 10px rgba(0,0,0,0.07)",
          }}>

            {/* ── Progress section ── */}
            <div style={{ flex: isMobile ? "none" : "1 1 180px", minWidth: isMobile ? 0 : 180, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.textPrimary }}>
                  正在審核 {activeIdx + 1} / {totalCerts}
                </span>
                {!isMobile && (
                  <span style={{ fontSize: 11, fontWeight: 400, color: C.textMuted }}>
                    Reviewing {activeIdx + 1} of {totalCerts}
                  </span>
                )}
              </div>
              <div style={{ marginTop: 5, height: 4, background: C.border, borderRadius: R.full }}>
                <div style={{
                  height: "100%",
                  width: `${totalCerts > 0 ? (savedCount / totalCerts) * 100 : 0}%`,
                  background: allDone ? C.success : C.accent,
                  borderRadius: R.full, transition: "width 0.3s ease",
                }} />
              </div>
              <div style={{ marginTop: 3, fontSize: 10, color: C.textMuted }}>
                {saved.size} 已核准 · {discarded.size} 已捨棄 · {totalCerts - savedCount} 待審核
                {scanningIds.size > 0 && ` · ${scanningIds.size} OCR 中`}
              </div>
            </div>

            {/* ── Button group ── */}
            <div style={{
              flex: "0 0 auto",
              display: "flex", alignItems: "center",
              gap: 8,
              flexDirection: isMobile ? "column" : "row",
            }}>
              {/* Discard + Save row on mobile */}
              <div style={{ display: "flex", gap: 8, width: isMobile ? "100%" : "auto" }}>
                {/* Discard */}
                <button
                  onClick={handleDiscard}
                  disabled={isDiscarded || isScanning}
                  style={{
                    flex: isMobile ? 1 : undefined,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                    padding: "8px 14px",
                    border: `1px solid ${C.error}50`,
                    borderRadius: R.md, background: "transparent",
                    cursor: (isDiscarded || isScanning) ? "not-allowed" : "pointer",
                    fontSize: 12, fontWeight: 600, color: C.error,
                    fontFamily: F, opacity: (isDiscarded || isScanning) ? 0.4 : 1,
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={e => !isDiscarded && (e.currentTarget.style.background = C.errorLight)}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <Trash2 size={13} />
                  捨棄此份
                </button>

                {/* Save & Next */}
                <button
                  onClick={handleSaveNext}
                  disabled={isSaved || isDiscarded || isScanning}
                  style={{
                    flex: isMobile ? 1 : undefined,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                    padding: "8px 16px",
                    border: `1.5px solid ${C.accent}`,
                    borderRadius: R.md, background: C.accentPale,
                    cursor: (isSaved || isDiscarded || isScanning) ? "not-allowed" : "pointer",
                    fontSize: 12, fontWeight: 600, color: C.accent,
                    fontFamily: F, opacity: (isSaved || isDiscarded || isScanning) ? 0.45 : 1,
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={e => !(isSaved || isDiscarded) && (e.currentTarget.style.background = C.accentLight)}
                  onMouseLeave={e => (e.currentTarget.style.background = C.accentPale)}
                >
                  <Save size={13} />
                  儲存並下一份
                  <ArrowRight size={12} />
                </button>
              </div>

              {/* Submit All */}
              <button
                onClick={handleSubmitAll}
                disabled={!allDone || submitDone}
                style={{
                  width: isMobile ? "100%" : undefined,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  padding: "8px 18px",
                  borderRadius: R.md, border: "none",
                  background: submitDone
                    ? C.greenLight
                    : allDone
                      ? `linear-gradient(135deg, ${C.accent}, ${C.accentDark})`
                      : C.borderStrong,
                  cursor: (!allDone || submitDone) ? "not-allowed" : "pointer",
                  fontSize: 12, fontWeight: 700,
                  color: submitDone ? C.success : allDone ? "#fff" : C.textDisabled,
                  fontFamily: F,
                  boxShadow: allDone && !submitDone ? "0 2px 10px rgba(37,99,235,0.35)" : "none",
                  transition: "all 0.2s",
                  whiteSpace: "nowrap",
                }}
              >
                {submitDone
                  ? <><CheckCircle2 size={13} /> 批量寫入成功！</>
                  : <>🚀 批量寫入 {allDone ? saved.size : totalCerts} 筆紀錄</>
                }
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Success toast ── */}
      {submitDone && (
        <div style={{
          position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
          padding: "12px 24px", background: C.success, borderRadius: R.lg,
          color: "#fff", fontSize: 13, fontWeight: 700, boxShadow: S.lg,
          display: "flex", alignItems: "center", gap: 8, zIndex: 9999,
        }}>
          <CheckCircle2 size={16} color="#fff" />
          批量寫入成功！{saved.size} 筆紀錄已提交至學生檔案 · {saved.size} records submitted.
        </div>
      )}
    </div>
  );
};
