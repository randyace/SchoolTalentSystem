// ─────────────────────────────────────────────────────────────────────────────
// Screen_BulkGroupAward.tsx
// 證書批量建立 / 生成 — Canva-style Bulk Certificate Generator
// ERP Module 1.D.4B  ·  Achievements & Certs
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useRef, useEffect, useCallback } from "react";
import { ERP } from "./erpTokens";
import {
  ArrowLeft, ChevronRight, ChevronDown, Upload, Layers,
  X, Plus, Sparkles, FileText, Users, Award,
  GripVertical, Eye, Download, Printer, RotateCcw,
  CheckCircle2, Move, Stamp, PenLine, CalendarDays, User, BookOpen,
  AlignCenter,
} from "lucide-react";

// ── Design tokens ──────────────────────────────────────────────────────────────
const T = {
  bg:          "#F8FAFC",
  surface:     "#FFFFFF",
  border:      "#E2E8F0",
  borderFocus: "#94A3B8",
  text1:  "#0F172A",
  text2:  "#334155",
  text3:  "#64748B",
  text4:  "#94A3B8",
  blue:   "#2563EB",
  bluePale:    "#EFF6FF",
  blueBd:      "#BFDBFE",
  emerald:     "#059669",
  emeraldPale: "#ECFDF5",
  emeraldBd:   "#6EE7B7",
  amber:       "#D97706",
  amberPale:   "#FFFBEB",
  amberBd:     "#FDE68A",
  purple:      "#7C3AED",
  purplePale:  "#F5F3FF",
  purpleBd:    "#C4B5FD",
  red:         "#DC2626",
  redPale:     "#FEF2F2",
  redBd:       "#FECACA",
  shadow:  "0 1px 3px rgba(15,23,42,0.08), 0 1px 2px rgba(15,23,42,0.06)",
  shadowMd:"0 4px 12px rgba(15,23,42,0.10), 0 1px 4px rgba(15,23,42,0.06)",
  radius:  "10px",
  radiusLg: "14px",
  radiusXl: "18px",
  font:    ERP.font.family,
  mono:    "'JetBrains Mono', 'Fira Code', monospace",
};

// ── Mock data ──────────────────────────────────────────────────────────────────
const MOCK_EVENTS = [
  "2026 南區中學校際足球比賽 South District Inter-School Football",
  "2026 全港中學校際籃球比賽 HK Inter-School Basketball",
  "第 14 屆全港青少年 STEM 創新大賽 14th HK Youth STEM Innovation",
  "2025-26 聯校音樂比賽 Joint-School Music Festival",
  "全港中學生辯論比賽 HK Secondary Debate Competition",
];

const MOCK_STUDENTS = [
  { id: "s01", name: "陳大文", nameEn: "Chan Tai Man",   cls: "F3A" },
  { id: "s02", name: "李家豪", nameEn: "Lee Ka Ho",      cls: "F3A" },
  { id: "s03", name: "張俊傑", nameEn: "Cheung Chun Kit", cls: "F2B" },
  { id: "s04", name: "黃子軒", nameEn: "Wong Zi Hin",    cls: "F2B" },
  { id: "s05", name: "林志強", nameEn: "Lam Chi Keung",  cls: "F3A" },
  { id: "s06", name: "劉俊明", nameEn: "Lau Chun Ming",  cls: "F1A" },
  { id: "s07", name: "陳美玲", nameEn: "Chan Mei Ling",  cls: "F2A" },
  { id: "s08", name: "鄭偉宏", nameEn: "Cheng Wai Wang", cls: "F3B" },
  { id: "s09", name: "何嘉倫", nameEn: "Ho Ka Lun",      cls: "F2B" },
  { id: "s10", name: "梁志業", nameEn: "Leung Chi Yip",  cls: "F1B" },
  { id: "s11", name: "吳浩然", nameEn: "Ng Ho Yin",      cls: "F2A" },
  { id: "s12", name: "許明德", nameEn: "Hui Ming Tak",   cls: "F3A" },
];

// ── Variable field definitions ─────────────────────────────────────────────────
interface VarField {
  key: string;
  label: string;
  labelEn: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  border: string;
  defaultW: number; // % of canvas width
  defaultH: number; // % of canvas height
}

const VAR_FIELDS: VarField[] = [
  { key: "studentName", label: "姓名",       labelEn: "Student Name",  icon: <User size={11} />,        color: T.blue,   bg: T.bluePale,   border: T.blueBd,   defaultW: 28, defaultH: 6 },
  { key: "nameEn",      label: "英文姓名",   labelEn: "English Name",  icon: <User size={11} />,        color: "#7C3AED", bg: "#F5F3FF",   border: "#C4B5FD",  defaultW: 30, defaultH: 5 },
  { key: "class",       label: "班別",       labelEn: "Class",         icon: <BookOpen size={11} />,    color: T.emerald, bg: T.emeraldPale, border: T.emeraldBd, defaultW: 12, defaultH: 5 },
  { key: "awardTitle",  label: "獎項名稱",   labelEn: "Award Title",   icon: <Award size={11} />,       color: T.amber,  bg: T.amberPale,  border: T.amberBd,  defaultW: 24, defaultH: 7 },
  { key: "eventName",   label: "活動名稱",   labelEn: "Event Name",    icon: <Layers size={11} />,      color: "#0891B2", bg: "#F0FDFA",   border: "#67E8F9",  defaultW: 38, defaultH: 5 },
  { key: "date",        label: "日期",       labelEn: "Date",          icon: <CalendarDays size={11} />, color: "#DC2626", bg: "#FEF2F2",  border: "#FECACA",  defaultW: 18, defaultH: 5 },
  { key: "sealSpace",   label: "校印位置",   labelEn: "Official Seal", icon: <Stamp size={11} />,       color: T.red,    bg: T.redPale,    border: T.redBd,    defaultW: 14, defaultH: 14 },
  { key: "signSpace",   label: "簽名位置",   labelEn: "Signature",     icon: <PenLine size={11} />,     color: "#92400E", bg: T.amberPale, border: T.amberBd,  defaultW: 20, defaultH: 8 },
  { key: "schoolName",  label: "學校名稱",   labelEn: "School Name",   icon: <AlignCenter size={11} />, color: T.text3,  bg: "#F8FAFC",    border: T.border,   defaultW: 34, defaultH: 5 },
];

// ── Placed canvas field ────────────────────────────────────────────────────────
interface PlacedField {
  id: string;
  varKey: string;
  x: number; // % of canvas
  y: number; // % of canvas
  w: number; // % width
  h: number; // % height
  selected: boolean;
}

const DEFAULT_PLACED: PlacedField[] = [
  { id: "p1", varKey: "studentName", x: 28,  y: 49, w: 26, h: 6.5, selected: false },
  { id: "p2", varKey: "nameEn",      x: 28,  y: 57, w: 30, h: 5.5, selected: false },
  { id: "p3", varKey: "class",       x: 60,  y: 49, w: 14, h: 6.5, selected: false },
  { id: "p4", varKey: "awardTitle",  x: 36,  y: 66, w: 28, h: 7.5, selected: false },
  { id: "p5", varKey: "date",        x: 22,  y: 78, w: 20, h: 5,   selected: false },
  { id: "p6", varKey: "sealSpace",   x: 75,  y: 74, w: 14, h: 16,  selected: false },
  { id: "p7", varKey: "signSpace",   x: 50,  y: 78, w: 22, h: 8,   selected: false },
];

// ── Certificate base template (blank, ornamental only) ─────────────────────────
const CertBaseTemplate: React.FC = () => (
  <svg viewBox="0 0 520 368" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%", display: "block" }}>
    <defs>
      <pattern id="cbt-dots" patternUnits="userSpaceOnUse" width="24" height="24">
        <circle cx="12" cy="12" r="0.9" fill="#D97706" opacity="0.18" />
      </pattern>
      <linearGradient id="cbt-gold" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%"   stopColor="#92400E" />
        <stop offset="40%"  stopColor="#F59E0B" />
        <stop offset="60%"  stopColor="#FDE68A" />
        <stop offset="100%" stopColor="#92400E" />
      </linearGradient>
      <linearGradient id="cbt-header-grad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%"   stopColor="#FFFBEB" />
        <stop offset="100%" stopColor="#FFFDF5" />
      </linearGradient>
    </defs>

    {/* Parchment fill */}
    <rect width="520" height="368" fill="#FFFDF5" />
    <rect width="520" height="368" fill="url(#cbt-dots)" />

    {/* Outer gold frame */}
    <rect x="8"  y="8"  width="504" height="352" fill="none" stroke="url(#cbt-gold)" strokeWidth="3.5" rx="4" />
    <rect x="14" y="14" width="492" height="340" fill="none" stroke="#D97706" strokeWidth="0.9" strokeDasharray="8,4" rx="3" />
    <rect x="19" y="19" width="482" height="330" fill="none" stroke="#FCD34D" strokeWidth="0.6" rx="2" />

    {/* Corner rosettes */}
    {([[26,26],[494,26],[26,342],[494,342]] as [number,number][]).map(([cx,cy],i) => (
      <g key={i}>
        <circle cx={cx} cy={cy} r="9"  fill="#FEF3C7" stroke="#D97706" strokeWidth="1" />
        <circle cx={cx} cy={cy} r="5"  fill="#FCD34D" />
        <circle cx={cx} cy={cy} r="2"  fill="#92400E" />
        <line x1={cx-13} y1={cy} x2={cx+13} y2={cy} stroke="#D97706" strokeWidth="0.6" opacity="0.6" />
        <line x1={cx} y1={cy-13} x2={cx} y2={cy+13} stroke="#D97706" strokeWidth="0.6" opacity="0.6" />
      </g>
    ))}

    {/* Top ornamental band */}
    <rect x="26" y="26" width="468" height="44" rx="2" fill="url(#cbt-header-grad)" opacity="0.7" />
    <line x1="26" y1="70" x2="494" y2="70" stroke="url(#cbt-gold)" strokeWidth="1.5" />

    {/* School logo placeholder circle */}
    <circle cx="76" cy="48" r="18" fill="none" stroke="#FCD34D" strokeWidth="1.5" strokeDasharray="4,2" />
    <text x="76" y="53" textAnchor="middle" fontSize="9" fill="#D97706" fontFamily="system-ui" fontWeight="700">校徽</text>

    {/* School name area (top center) */}
    <rect x="110" y="32" width="300" height="14" rx="2" fill="#FEF3C7" stroke="#FCD34D" strokeWidth="0.5" opacity="0.8" />
    <text x="260" y="43" textAnchor="middle" fontSize="8.5" fill="#92400E" fontFamily="'PingFang SC',system-ui" fontWeight="600">培道書院  Stewards Pooi Tun Secondary School</text>

    <rect x="110" y="50" width="300" height="11" rx="2" fill="none" stroke="#FDE68A" strokeWidth="0.4" opacity="0.7" />
    <text x="260" y="59" textAnchor="middle" fontSize="7" fill="#B45309" fontFamily="system-ui">香港學生活動成就證書  Hong Kong Student Achievement Certificate</text>

    {/* Center trophy emblem */}
    <circle cx="260" cy="110" r="32" fill="#FFFBEB" stroke="#FCD34D" strokeWidth="2" />
    <circle cx="260" cy="110" r="28" fill="none" stroke="#FEF3C7" strokeWidth="1" strokeDasharray="3,2" />
    <text x="260" y="120" textAnchor="middle" fontSize="30" fontFamily="system-ui">🏅</text>

    {/* Certificate title line */}
    <text x="260" y="158" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1E293B" fontFamily="'PingFang SC',system-ui" letterSpacing="2">成 就 證 書  Certificate of Achievement</text>

    {/* Decorative horizontal rule */}
    <line x1="80" y1="168" x2="440" y2="168" stroke="url(#cbt-gold)" strokeWidth="1.2" />
    <circle cx="260" cy="168" r="3" fill="#D97706" />
    <circle cx="190" cy="168" r="1.5" fill="#FCD34D" opacity="0.7" />
    <circle cx="330" cy="168" r="1.5" fill="#FCD34D" opacity="0.7" />

    {/* "This is to certify" intro text */}
    <text x="260" y="186" textAnchor="middle" fontSize="9" fill="#64748B" fontFamily="system-ui" fontStyle="italic">茲證明  This is to certify that</text>

    {/* Data region hint lines (very faint, under ghost boxes) */}
    <line x1="140" y1="204" x2="380" y2="204" stroke="#E2E8F0" strokeWidth="0.8" strokeDasharray="3,3" opacity="0.6" />
    <line x1="140" y1="224" x2="380" y2="224" stroke="#E2E8F0" strokeWidth="0.8" strokeDasharray="3,3" opacity="0.6" />
    <line x1="140" y1="244" x2="380" y2="244" stroke="#E2E8F0" strokeWidth="0.8" strokeDasharray="3,3" opacity="0.6" />

    {/* "has achieved" connector */}
    <text x="260" y="270" textAnchor="middle" fontSize="8.5" fill="#64748B" fontFamily="system-ui" fontStyle="italic">在以下比賽 / 活動中取得  in the event / competition:</text>
    <line x1="100" y1="276" x2="420" y2="276" stroke="#E2E8F0" strokeWidth="0.8" strokeDasharray="3,3" opacity="0.6" />

    {/* Bottom rule */}
    <line x1="80" y1="300" x2="440" y2="300" stroke="url(#cbt-gold)" strokeWidth="1" />
    <circle cx="260" cy="300" r="2.5" fill="#FCD34D" />

    {/* Signature / seal area base lines */}
    <line x1="110" y1="328" x2="210" y2="328" stroke="#CBD5E1" strokeWidth="0.8" />
    <text x="160" y="336" textAnchor="middle" fontSize="7" fill="#94A3B8" fontFamily="system-ui">Principal / 校長</text>

    <line x1="310" y1="328" x2="410" y2="328" stroke="#CBD5E1" strokeWidth="0.8" />
    <text x="360" y="336" textAnchor="middle" fontSize="7" fill="#94A3B8" fontFamily="system-ui">Date / 日期</text>

    {/* Document watermark */}
    <text x="38" y="355" fontSize="7" fill="#94A3B8" fontFamily="monospace" opacity="0.5">TEMPLATE · PREVIEW ONLY</text>
    <text x="482" y="355" textAnchor="end" fontSize="7" fill="#94A3B8" fontFamily="monospace" opacity="0.5">DOC-2026-BULK-XXX</text>
  </svg>
);

// ── Class palette ──────────────────────────────────────────────────────────────
const CLASS_PAL: Record<string, { bg: string; color: string; bd: string }> = {
  F1A: { bg: "#DBEAFE", color: "#1D4ED8", bd: "#BFDBFE" },
  F1B: { bg: "#E0E7FF", color: "#4338CA", bd: "#C7D2FE" },
  F2A: { bg: "#D1FAE5", color: "#065F46", bd: "#6EE7B7" },
  F2B: { bg: "#FCE7F3", color: "#9D174D", bd: "#FBCFE8" },
  F3A: { bg: "#FFEDD5", color: "#9A3412", bd: "#FED7AA" },
  F3B: { bg: "#FEF3C7", color: "#92400E", bd: "#FDE68A" },
};

// ── Main component ─────────────────────────────────────────────────────────────
export const Screen_BulkGroupAward: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 900);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Event linkage
  const [linkedEvent, setLinkedEvent] = useState(MOCK_EVENTS[0]);
  const [eventDropOpen, setEventDropOpen] = useState(false);

  // Template
  const [templateUploaded, setTemplateUploaded] = useState(true); // pre-loaded for demo
  const [tmplDragOver, setTmplDragOver] = useState(false);

  // Canvas fields
  const [placedFields, setPlacedFields] = useState<PlacedField[]>(DEFAULT_PLACED);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);

  // Drag state
  const canvasRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<{ id: string; startMouseX: number; startMouseY: number; startFieldX: number; startFieldY: number } | null>(null);

  const getVarDef = (key: string) => VAR_FIELDS.find(v => v.key === key)!;

  const addFieldToCanvas = (varDef: VarField) => {
    const alreadyPlaced = placedFields.some(f => f.varKey === varDef.key);
    if (alreadyPlaced) return; // don't duplicate
    const newField: PlacedField = {
      id: `p${Date.now()}`,
      varKey: varDef.key,
      x: 20 + Math.random() * 40,
      y: 30 + Math.random() * 40,
      w: varDef.defaultW,
      h: varDef.defaultH,
      selected: false,
    };
    setPlacedFields(prev => [...prev, newField]);
    setSelectedFieldId(newField.id);
  };

  const removeField = (id: string) => {
    setPlacedFields(prev => prev.filter(f => f.id !== id));
    if (selectedFieldId === id) setSelectedFieldId(null);
  };

  const resetCanvas = () => {
    setPlacedFields(DEFAULT_PLACED);
    setSelectedFieldId(null);
  };

  // Mouse-based drag on canvas ghost boxes
  const handleFieldPointerDown = useCallback((e: React.PointerEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedFieldId(id);
    const field = placedFields.find(f => f.id === id);
    if (!field || !canvasRef.current) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    draggingRef.current = {
      id,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startFieldX: field.x,
      startFieldY: field.y,
    };
  }, [placedFields]);

  const handleCanvasPointerMove = useCallback((e: React.PointerEvent) => {
    if (!draggingRef.current || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const { id, startMouseX, startMouseY, startFieldX, startFieldY } = draggingRef.current;
    const dx = ((e.clientX - startMouseX) / rect.width) * 100;
    const dy = ((e.clientY - startMouseY) / rect.height) * 100;
    setPlacedFields(prev => prev.map(f => f.id === id
      ? { ...f, x: Math.max(0, Math.min(100 - f.w, startFieldX + dx)), y: Math.max(0, Math.min(100 - f.h, startFieldY + dy)) }
      : f
    ));
  }, []);

  const handleCanvasPointerUp = useCallback(() => {
    draggingRef.current = null;
  }, []);

  // Students
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(
    new Set(MOCK_STUDENTS.map(s => s.id))
  );

  // Generation
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => { setGenerating(false); setGenerated(true); }, 2200);
  };

  const F = T.font;
  const selectedCount = selectedStudents.size;

  // ── Success screen ────────────────────────────────────────────────────────────
  if (generated) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100%", background: T.bg, fontFamily: F, padding: 24 }}>
        <div style={{ background: T.surface, borderRadius: T.radiusXl, padding: "40px 48px", boxShadow: T.shadowMd, textAlign: "center", maxWidth: 480, width: "100%", border: `1px solid ${T.emeraldBd}` }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🎓</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: T.text1, marginBottom: 8 }}>批量生成完成！</div>
          <div style={{ fontSize: 13, color: T.text3, lineHeight: 1.8, marginBottom: 24 }}>
            已成功生成 <strong style={{ color: T.emerald }}>{selectedCount} 份個人化證書</strong>，<br />
            系統已自動映射學生姓名並保留校印 / 簽名位置。<br />
            <span style={{ color: T.text4, fontSize: 11 }}>System mapped all names and preserved seal/signature zones.</span>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginBottom: 24 }}>
            {[
              { icon: <Eye size={14} />,      label: "預覽",     color: T.blue },
              { icon: <Download size={14} />, label: "下載 ZIP", color: T.emerald },
              { icon: <Printer size={14} />,  label: "列印",     color: T.text2 },
            ].map(btn => (
              <button key={btn.label} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", border: `1px solid ${T.border}`, borderRadius: T.radius, background: T.surface, color: btn.color, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: F }}>
                {btn.icon} {btn.label}
              </button>
            ))}
          </div>
          <button onClick={onBack} style={{ background: T.blue, color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, padding: "11px 28px", cursor: "pointer", fontFamily: F }}>
            返回成就管理
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: isMobile ? "auto" : "100%", minHeight: isMobile ? "100%" : undefined, background: T.bg, fontFamily: F, overflow: isMobile ? "visible" : "hidden" }}>

      {/* ════════════════════════════════════════════════════════════════════
          HEADER
      ════════════════════════════════════════════════════════════════════ */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: `0 ${isMobile ? "16px" : "24px"}`, flexShrink: 0 }}>
        {/* Nav row */}
        <div style={{ height: 48, display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${T.border}` }}>
          <button onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "none", border: `1px solid ${T.border}`, borderRadius: 8, padding: "5px 11px", cursor: "pointer", fontSize: 12, fontWeight: 600, color: T.text3, fontFamily: F }}>
            <ArrowLeft size={13} /> 返回
          </button>
          {!isMobile && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
              <span style={{ color: T.text4 }}>成就與證書</span>
              <ChevronRight size={13} color={T.text4} />
              <span style={{ color: T.text4 }}>批量工具</span>
              <ChevronRight size={13} color={T.text4} />
              <span style={{ fontWeight: 700, color: T.text2 }}>證書批量建立 / 生成</span>
            </div>
          )}
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", background: T.amberPale, color: T.amber, border: `1px solid ${T.amberBd}`, borderRadius: 5 }}>1.D.4B · BULK-GEN</span>
          </div>
        </div>

        {/* Title row */}
        <div style={{ height: 56, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg, #7C3AED, #A855F7)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Layers size={17} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: T.text1, letterSpacing: "-0.3px" }}>
              證書批量建立 / 生成
            </div>
            {!isMobile && <div style={{ fontSize: 11, color: T.text3 }}>Bulk Certificate Generation · Canva-style Template Editor</div>}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          EVENT LINK BANNER — prominent context bar above the editor
      ════════════════════════════════════════════════════════════════════ */}
      <div style={{
        background: "linear-gradient(135deg, #3730A3, #7C3AED)",
        borderBottom: "1px solid #4C1D95",
        padding: isMobile ? "10px 16px" : "12px 24px",
        display: "flex", alignItems: "center", gap: 14, flexShrink: 0,
        flexWrap: "wrap",
      }}>
        {/* Label */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Layers size={14} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.6)", letterSpacing: "0.07em", textTransform: "uppercase", lineHeight: 1 }}>關聯活動 / 比賽</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.45)", lineHeight: 1.2 }}>Link to Event / Competition</div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 32, background: "rgba(255,255,255,0.2)", flexShrink: 0 }} />

        {/* Dropdown trigger — prominent */}
        <div style={{ position: "relative", flex: 1, minWidth: 240, maxWidth: 480 }}>
          <button
            onClick={() => setEventDropOpen(v => !v)}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10,
              padding: "9px 14px",
              background: "rgba(255,255,255,0.12)",
              border: `1.5px solid ${eventDropOpen ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.3)"}`,
              borderRadius: 10, cursor: "pointer", fontFamily: F,
              color: "#fff", fontSize: 13, fontWeight: 700,
              transition: "all 0.15s",
            }}
          >
            <CheckCircle2 size={14} color="#A5F3FC" style={{ flexShrink: 0 }} />
            <span style={{ flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {linkedEvent}
            </span>
            <ChevronDown size={14} color="rgba(255,255,255,0.7)" style={{ flexShrink: 0, transform: eventDropOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
          </button>

          {eventDropOpen && (
            <>
              <div onClick={() => setEventDropOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 199 }} />
              <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radiusLg, boxShadow: T.shadowMd, zIndex: 200, overflow: "hidden" }}>
                {MOCK_EVENTS.map(ev => (
                  <button
                    key={ev}
                    onClick={() => { setLinkedEvent(ev); setEventDropOpen(false); }}
                    style={{
                      width: "100%", textAlign: "left", padding: "11px 16px",
                      border: "none", borderBottom: `1px solid ${T.border}`,
                      background: ev === linkedEvent ? T.purplePale : "transparent",
                      color: ev === linkedEvent ? T.purple : T.text2,
                      fontSize: 13, fontWeight: ev === linkedEvent ? 700 : 400,
                      cursor: "pointer", fontFamily: F,
                      display: "flex", alignItems: "center", gap: 10,
                    }}
                  >
                    {ev === linkedEvent
                      ? <CheckCircle2 size={13} color={T.purple} />
                      : <div style={{ width: 13, height: 13, borderRadius: "50%", border: `1.5px solid ${T.border}` }} />
                    }
                    <span style={{ flex: 1 }}>{ev}</span>
                  </button>
                ))}
                <button
                  onClick={() => setEventDropOpen(false)}
                  style={{ width: "100%", padding: "9px 16px", border: "none", background: "#F8FAFC", color: T.text3, fontSize: 11.5, cursor: "pointer", fontFamily: F, display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}
                >
                  <Plus size={12} /> 新增活動… Add Event
                </button>
              </div>
            </>
          )}
        </div>

        {/* Pill count */}
        <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 999, fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>
          <Users size={11} color="rgba(255,255,255,0.7)" />
          <span>42 位學生將生成證書</span>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          MAIN BODY — 3-column editor layout
      ════════════════════════════════════════════════════════════════════ */}
      <div style={{
        flex: 1, display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "200px 1fr 268px",
        overflow: isMobile ? "visible" : "hidden",
        minHeight: 0,
      }}>

        {/* ── LEFT: Variable Field Palette ──────────────────────────────────── */}
        <div style={{
          background: T.surface, borderRight: isMobile ? "none" : `1px solid ${T.border}`,
          borderBottom: isMobile ? `1px solid ${T.border}` : "none",
          display: "flex", flexDirection: "column", overflow: "hidden",
          flexShrink: 0,
        }}>
          {/* Palette header */}
          <div style={{ padding: "12px 14px 8px", borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: T.text4, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              動態欄位 · Variables
            </div>
            <div style={{ fontSize: 10.5, color: T.text4, marginTop: 2 }}>點擊 → 放置於底圖</div>
          </div>

          {/* Field chips */}
          <div style={{ flex: 1, overflowY: "auto", padding: "10px 10px 14px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {VAR_FIELDS.map(v => {
                const isPlaced = placedFields.some(f => f.varKey === v.key);
                return (
                  <button
                    key={v.key}
                    onClick={() => addFieldToCanvas(v)}
                    disabled={isPlaced}
                    title={isPlaced ? "已放置於底圖" : `點擊放置 [${v.labelEn}]`}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "7px 10px",
                      border: `1.5px ${isPlaced ? "solid" : "dashed"} ${isPlaced ? v.border : v.border}`,
                      borderRadius: 8,
                      background: isPlaced ? v.bg : "transparent",
                      color: v.color, cursor: isPlaced ? "default" : "pointer",
                      fontFamily: F, fontSize: 11.5, fontWeight: 600,
                      opacity: isPlaced ? 0.6 : 1,
                      textAlign: "left",
                      transition: "all 0.12s",
                      position: "relative",
                    }}
                  >
                    <span style={{ flexShrink: 0, opacity: 0.8 }}>{v.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: v.color }}>{v.label}</div>
                      <div style={{ fontSize: 9.5, color: T.text4 }}>{v.labelEn}</div>
                    </div>
                    {isPlaced && (
                      <CheckCircle2 size={11} color={v.color} style={{ flexShrink: 0 }} />
                    )}
                    {!isPlaced && (
                      <Plus size={11} color={v.color} style={{ flexShrink: 0, opacity: 0.6 }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Font / style controls */}
          <div style={{ borderTop: `1px solid ${T.border}`, padding: "10px 12px", flexShrink: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.text4, letterSpacing: "0.05em", marginBottom: 8 }}>STYLE</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              <div>
                <div style={{ fontSize: 10, color: T.text4, marginBottom: 3 }}>字體 Font</div>
                <div style={{ position: "relative" }}>
                  <select style={{ width: "100%", padding: "5px 24px 5px 8px", fontSize: 11, border: `1px solid ${T.border}`, borderRadius: 6, fontFamily: F, color: T.text2, background: T.surface, appearance: "none", cursor: "pointer", outline: "none" }}>
                    <option>PingFang SC</option>
                    <option>Noto Sans TC</option>
                    <option>Times New Roman</option>
                  </select>
                  <ChevronDown size={11} color={T.text4} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                {["B","I","U"].map(s => (
                  <button key={s} style={{ flex: 1, padding: "4px 0", border: `1px solid ${T.border}`, borderRadius: 5, background: "transparent", fontSize: 11, fontWeight: s === "B" ? 900 : 400, fontStyle: s === "I" ? "italic" : "normal", textDecoration: s === "U" ? "underline" : "none", color: T.text2, cursor: "pointer", fontFamily: F }}>{s}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── CENTER: Canvas Editor ──────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", background: "#F1F5F9", overflow: isMobile ? "visible" : "hidden", minHeight: isMobile ? 400 : undefined }}>

          {/* Canvas toolbar */}
          <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: "8px 16px", display: "flex", alignItems: "center", gap: 8, flexShrink: 0, flexWrap: "wrap" }}>
            {/* Upload template */}
            <label style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", border: `1px solid ${T.border}`, borderRadius: 7, background: "transparent", color: T.text2, fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: F }}>
              <Upload size={13} color={T.purple} />
              上傳底圖 Upload Template
              <input type="file" accept=".png,.jpg,.pdf" style={{ display: "none" }} onChange={() => setTemplateUploaded(true)} />
            </label>

            <div style={{ width: 1, height: 20, background: T.border }} />

            {/* View mode chips */}
            {[
              { label: "📐 編輯模式", active: true },
              { label: "👁 預覽", active: false },
            ].map(m => (
              <button key={m.label} style={{ padding: "5px 11px", border: `1px solid ${m.active ? T.purple : T.border}`, borderRadius: 6, background: m.active ? T.purplePale : "transparent", color: m.active ? T.purple : T.text3, fontSize: 11, fontWeight: m.active ? 700 : 400, cursor: "pointer", fontFamily: F }}>
                {m.label}
              </button>
            ))}

            <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
              <button onClick={resetCanvas} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", border: `1px solid ${T.border}`, borderRadius: 6, background: "transparent", color: T.text3, fontSize: 11, cursor: "pointer", fontFamily: F }}>
                <RotateCcw size={12} /> 重置
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 6, background: T.emeraldPale, border: `1px solid ${T.emeraldBd}` }}>
                <CheckCircle2 size={11} color={T.emerald} />
                <span style={{ fontSize: 10.5, fontWeight: 700, color: T.emerald }}>{placedFields.length} 欄位已放置</span>
              </div>
            </div>
          </div>

          {/* Canvas area */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", alignItems: "flex-start", justifyContent: "center" }}>
            {!templateUploaded ? (
              /* Upload drop zone */
              <div
                onDragOver={e => { e.preventDefault(); setTmplDragOver(true); }}
                onDragLeave={() => setTmplDragOver(false)}
                onDrop={e => { e.preventDefault(); setTmplDragOver(false); setTemplateUploaded(true); }}
                style={{
                  width: "100%", maxWidth: 640, minHeight: 360,
                  border: `2.5px dashed ${tmplDragOver ? T.purple : T.borderFocus}`,
                  borderRadius: T.radiusXl, background: tmplDragOver ? T.purplePale : T.surface,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  gap: 14, cursor: "pointer", transition: "all 0.18s", padding: 40,
                }}
              >
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: T.purplePale, border: `1px solid ${T.purpleBd}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Upload size={24} color={T.purple} />
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: T.text1, marginBottom: 4 }}>上傳證書底圖 Upload Base Template</div>
                  <div style={{ fontSize: 12, color: T.text3, lineHeight: 1.7 }}>
                    拖放 PNG / PDF 到此處，或<br />
                    <label style={{ color: T.purple, fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}>
                      點擊選擇檔案
                      <input type="file" accept=".png,.pdf,.jpg" style={{ display: "none" }} onChange={() => setTemplateUploaded(true)} />
                    </label>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 10.5, color: T.text4 }}>支援 PNG · PDF · JPG · 最大 20 MB</div>
                </div>
                <button onClick={() => setTemplateUploaded(true)} style={{ padding: "8px 20px", border: `1px solid ${T.purpleBd}`, borderRadius: 8, background: T.purplePale, color: T.purple, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: F }}>
                  使用示範底圖 Use Demo Template
                </button>
              </div>
            ) : (
              /* Canvas with template + ghost boxes */
              <div style={{ width: "100%", maxWidth: 640, userSelect: "none" }}>
                {/* Canvas hint */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <Move size={12} color={T.text4} />
                  <span style={{ fontSize: 10.5, color: T.text4, fontFamily: F }}>拖動虛線框以調整欄位位置 · Drag ghost boxes to reposition fields</span>
                </div>

                {/* Canvas frame */}
                <div
                  ref={canvasRef}
                  onPointerMove={handleCanvasPointerMove}
                  onPointerUp={handleCanvasPointerUp}
                  onPointerLeave={handleCanvasPointerUp}
                  onClick={() => setSelectedFieldId(null)}
                  style={{ position: "relative", borderRadius: T.radius, boxShadow: "0 8px 32px rgba(15,23,42,0.15)", overflow: "visible", cursor: draggingRef.current ? "grabbing" : "default" }}
                >
                  {/* Certificate base SVG */}
                  <CertBaseTemplate />

                  {/* Ghost field overlays */}
                  {placedFields.map(field => {
                    const vd = getVarDef(field.varKey);
                    if (!vd) return null;
                    const isSelected = selectedFieldId === field.id;
                    const isSeal = field.varKey === "sealSpace";
                    return (
                      <div
                        key={field.id}
                        onPointerDown={e => handleFieldPointerDown(e, field.id)}
                        onClick={e => { e.stopPropagation(); setSelectedFieldId(field.id); }}
                        style={{
                          position: "absolute",
                          left: `${field.x}%`,
                          top:  `${field.y}%`,
                          width: `${field.w}%`,
                          height: `${field.h}%`,
                          border: `2px dashed ${isSelected ? vd.color : vd.color}`,
                          borderRadius: isSeal ? "50%" : 4,
                          background: `${vd.bg}CC`,
                          cursor: "grab",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          overflow: "visible",
                          boxShadow: isSelected ? `0 0 0 2px ${vd.color}40, 0 2px 8px ${vd.color}30` : "none",
                          transition: "box-shadow 0.12s",
                          zIndex: isSelected ? 20 : 10,
                        }}
                      >
                        {/* Field label */}
                        <div style={{ fontSize: 9, fontWeight: 800, color: vd.color, fontFamily: F, lineHeight: 1.2, textAlign: "center", padding: "0 3px", pointerEvents: "none" }}>
                          {`[${vd.label}]`}
                        </div>
                        {!isSeal && (
                          <div style={{ fontSize: 8, color: vd.color, opacity: 0.7, fontFamily: F, pointerEvents: "none" }}>{vd.labelEn}</div>
                        )}

                        {/* Drag handle */}
                        <div style={{ position: "absolute", top: -8, left: "50%", transform: "translateX(-50%)", background: vd.color, borderRadius: 3, padding: "1px 4px", display: "flex", alignItems: "center", opacity: isSelected ? 1 : 0, transition: "opacity 0.12s", pointerEvents: "none" }}>
                          <GripVertical size={8} color="#fff" />
                        </div>

                        {/* Remove button */}
                        <button
                          onPointerDown={e => e.stopPropagation()}
                          onClick={e => { e.stopPropagation(); removeField(field.id); }}
                          style={{
                            position: "absolute", top: -8, right: -8,
                            width: 16, height: 16, borderRadius: "50%",
                            background: vd.color, border: "1.5px solid #fff",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            cursor: "pointer", opacity: isSelected ? 1 : 0,
                            transition: "opacity 0.12s",
                            zIndex: 30,
                          }}
                        >
                          <X size={8} color="#fff" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Canvas footer note */}
                <div style={{ marginTop: 10, display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
                  {[
                    { color: T.blue,   text: "姓名欄位" },
                    { color: T.amber,  text: "獎項欄位" },
                    { color: T.red,    text: "校印/簽名" },
                    { color: T.emerald, text: "其他" },
                  ].map(l => (
                    <div key={l.text} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <div style={{ width: 14, height: 8, border: `2px dashed ${l.color}`, borderRadius: 2, background: `${l.color}20` }} />
                      <span style={{ fontSize: 10, color: T.text4, fontFamily: F }}>{l.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Student list + generation ──────────────────────────────── */}
        <div style={{
          background: T.surface,
          borderLeft: isMobile ? "none" : `1px solid ${T.border}`,
          borderTop: isMobile ? `1px solid ${T.border}` : "none",
          display: "flex", flexDirection: "column",
          overflow: "hidden", flexShrink: 0,
        }}>
          {/* Student list header */}
          <div style={{ padding: "12px 16px 8px", borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <Users size={14} color={T.text3} />
                <span style={{ fontSize: 12, fontWeight: 700, color: T.text2 }}>學生名單 Students</span>
              </div>
              <span style={{ padding: "2px 8px", borderRadius: 999, background: T.purplePale, border: `1px solid ${T.purpleBd}`, fontSize: 10, fontWeight: 800, color: T.purple }}>{selectedCount} 人</span>
            </div>
            <div style={{ fontSize: 10.5, color: T.text4 }}>勾選 / 取消要生成證書的學生</div>
          </div>

          {/* Select all / clear */}
          <div style={{ padding: "6px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", gap: 8, flexShrink: 0 }}>
            <button onClick={() => setSelectedStudents(new Set(MOCK_STUDENTS.map(s => s.id)))} style={{ fontSize: 11, color: T.blue, background: "none", border: "none", cursor: "pointer", fontFamily: F, fontWeight: 600 }}>全選</button>
            <span style={{ color: T.border }}>|</span>
            <button onClick={() => setSelectedStudents(new Set())} style={{ fontSize: 11, color: T.text4, background: "none", border: "none", cursor: "pointer", fontFamily: F }}>全清</button>
          </div>

          {/* Student rows */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {MOCK_STUDENTS.map((s, i) => {
              const selected = selectedStudents.has(s.id);
              const pal = CLASS_PAL[s.cls] ?? { bg: "#F8FAFC", color: T.text3, bd: T.border };
              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedStudents(prev => { const n = new Set(prev); n.has(s.id) ? n.delete(s.id) : n.add(s.id); return n; })}
                  style={{
                    display: "flex", alignItems: "center", gap: 9,
                    padding: "9px 16px",
                    background: selected ? "#F5F3FF" : "transparent",
                    borderBottom: `1px solid ${T.border}`,
                    cursor: "pointer", transition: "background 0.1s",
                  }}
                >
                  {/* Checkbox */}
                  <div style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0, border: `2px solid ${selected ? T.purple : T.borderFocus}`, background: selected ? T.purple : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.12s" }}>
                    {selected && <span style={{ color: "#fff", fontSize: 10, fontWeight: 900, lineHeight: 1 }}>✓</span>}
                  </div>

                  {/* Avatar */}
                  <div style={{ width: 26, height: 26, borderRadius: "50%", flexShrink: 0, background: `linear-gradient(135deg, ${T.purple}, #A855F7)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff" }}>
                    {s.name.slice(0, 1)}
                  </div>

                  {/* Name */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: selected ? T.purple : T.text1 }}>{s.name}</div>
                    <div style={{ fontSize: 10, color: T.text4 }}>{s.nameEn}</div>
                  </div>

                  {/* Class */}
                  <span style={{ padding: "1px 6px", borderRadius: 5, background: pal.bg, border: `1px solid ${pal.bd}`, fontSize: 10, fontWeight: 700, color: pal.color, flexShrink: 0 }}>{s.cls}</span>
                </div>
              );
            })}
          </div>

          {/* Generation CTA */}
          <div style={{ padding: "14px 16px", borderTop: `1px solid ${T.border}`, flexShrink: 0, background: T.surface }}>

            {/* Helper text */}
            <div style={{ display: "flex", gap: 8, padding: "9px 12px", background: T.bluePale, border: `1px solid ${T.blueBd}`, borderRadius: T.radius, marginBottom: 12 }}>
              <FileText size={13} color={T.blue} style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 10.5, color: "#1D4ED8", lineHeight: 1.6 }}>
                <strong>系統將自動映射姓名</strong>並保留校印 / 簽名位置。<br />
                <span style={{ color: "#3B82F6", opacity: 0.9 }}>System will auto-map names and preserve seal/signature zones for physical stamps.</span>
              </div>
            </div>

            {/* Generation progress */}
            {generating && (
              <div style={{ marginBottom: 10, padding: "8px 12px", background: T.purplePale, border: `1px solid ${T.purpleBd}`, borderRadius: T.radius }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
                  <Sparkles size={12} color={T.purple} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: T.purple }}>正在生成中… Generating…</span>
                </div>
                <div style={{ height: 4, background: "#E9D5FF", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", background: `linear-gradient(90deg, ${T.purple}, #A855F7)`, width: "65%", borderRadius: 2, animation: "shimmerBar 1.2s ease-in-out infinite" }} />
                </div>
                <style>{`@keyframes shimmerBar { 0%{width:15%} 50%{width:85%} 100%{width:15%} }`}</style>
              </div>
            )}

            {/* Main generate button */}
            <button
              onClick={handleGenerate}
              disabled={selectedCount === 0 || generating || !templateUploaded}
              style={{
                width: "100%",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
                padding: "13px 0",
                border: "none", borderRadius: T.radiusLg,
                background: (selectedCount > 0 && !generating && templateUploaded)
                  ? "linear-gradient(135deg, #7C3AED 0%, #9333EA 60%, #A855F7 100%)"
                  : T.border,
                color: (selectedCount > 0 && !generating && templateUploaded) ? "#fff" : T.text4,
                fontSize: 13.5, fontWeight: 800, fontFamily: F,
                cursor: (selectedCount > 0 && !generating && templateUploaded) ? "pointer" : "not-allowed",
                boxShadow: (selectedCount > 0 && !generating && templateUploaded) ? "0 4px 18px rgba(124,58,237,0.40)" : "none",
                transition: "all 0.15s",
                letterSpacing: "-0.2px",
              }}
            >
              {generating ? (
                <>
                  <Sparkles size={16} />
                  生成中…
                </>
              ) : (
                <>
                  <Layers size={16} />
                  批量生成 {selectedCount} 份證書
                </>
              )}
            </button>

            {/* Breakdown */}
            <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
              {[
                { label: "證書份數", value: `${selectedCount}`, color: T.purple },
                { label: "放置欄位", value: `${placedFields.length}`, color: T.blue },
                { label: "關聯活動", value: "已設定", color: T.emerald },
              ].map(s => (
                <div key={s.label} style={{ textAlign: "center", padding: "4px 10px", borderRadius: 7, background: T.bg, border: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 9, color: T.text4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
