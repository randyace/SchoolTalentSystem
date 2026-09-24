// ─────────────────────────────────────────────────────────────────────────────
// Screen: 待辦審批 — Achievement & Certificate Approval Inbox  (1.A.3)
// Split-pane: left list (40%) · right quick-preview (60%)
// Scope: Certificates & external achievements only. Leave/attendance removed.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect } from "react";
import {
  Inbox, ChevronRight, ExternalLink,
  CheckCircle, XCircle, Clock, Star, Sparkles,
  Award, FileText, ArrowUpRight,
  CheckCheck, ChevronLeft, Music, Dumbbell,
  BookOpen, Cpu, Heart, Medal,
} from "lucide-react";
import { ERP } from "./erpTokens";

const F    = ERP.font.family;
const MONO = "'JetBrains Mono','Fira Code','SF Mono',monospace";

// ── Certificate categories ────────────────────────────────────────────────────
type CertCategory = "music" | "sports" | "academic" | "stem" | "service";

interface CatDef {
  emoji: string;
  label: string;
  labelEn: string;
  color: string;
  bg: string;
  border: string;
  iconColor: string;
  thumbBg: string;
}

const CATS: Record<CertCategory, CatDef> = {
  music:    { emoji: "🎵", label: "音樂藝術", labelEn: "Music & Arts",   color: "#6D28D9", bg: "#EDE9FE", border: "#C4B5FD", iconColor: "#7C3AED", thumbBg: "#F5F3FF" },
  sports:   { emoji: "🏅", label: "體育運動", labelEn: "Sports",         color: "#1D4ED8", bg: "#DBEAFE", border: "#93C5FD", iconColor: "#2563EB", thumbBg: "#EFF6FF" },
  academic: { emoji: "📚", label: "學術成就", labelEn: "Academic",        color: "#92400E", bg: "#FFFBEB", border: "#FCD34D", iconColor: "#D97706", thumbBg: "#FFFBEB" },
  stem:     { emoji: "💡", label: "STEM 科技", labelEn: "STEM / Tech",   color: "#0E7490", bg: "#ECFEFF", border: "#67E8F9", iconColor: "#0891B2", thumbBg: "#ECFEFF" },
  service:  { emoji: "🤝", label: "服務義工", labelEn: "Service",         color: "#15803D", bg: "#F0FDF4", border: "#86EFAC", iconColor: "#16A34A", thumbBg: "#F0FDF4" },
};

// ── Inbox items ───────────────────────────────────────────────────────────────
interface InboxItem {
  id: string;
  cat: CertCategory;
  time: string;
  studentName: string;
  studentClass: string;
  title: string;
  subtitle?: string;
  read: boolean;
  aiScore?: number;
  approved?: boolean;
  rejected?: boolean;
  // Detail pane extras
  organizer?: string;
  award?: string;
  eventDate?: string;
  certCategory?: string;
  suggestedLevel?: string;
  suggestedType?: string;
  suggestedPts?: number;
  acornTags?: string[];
}

const INITIAL_ITEMS: InboxItem[] = [
  {
    id: "i01", cat: "stem",  time: "10 分鐘前",
    studentName: "陳大文", studentClass: "F1A",
    title: "2026 全港青少年編程大賽 (金獎)",
    subtitle: "🤖 AI 信心指數: 94%。建議: L4 / T4 / +50 分",
    read: false, aiScore: 94,
    organizer: "香港電腦學會 HKCS", award: "🏆 金獎 Gold", eventDate: "2026 年 7 月 18 日",
    certCategory: "個人組 · 中學組", suggestedLevel: "L4 國際 / 全港",
    suggestedType: "T4 獲獎", suggestedPts: 50, acornTags: ["認知", "創意"],
  },
  {
    id: "i02", cat: "music", time: "45 分鐘前",
    studentName: "陳俊彥", studentClass: "F3B",
    title: "英國皇家音樂學院鋼琴八級 (Pass with Merit)",
    subtitle: "ABRSM Grade 8 Piano · 已上載證書掃描本",
    read: false, aiScore: 91,
    organizer: "英國皇家音樂學院 ABRSM", award: "✅ Pass with Merit", eventDate: "2026 年 6 月 05 日",
    certCategory: "鋼琴 · 個人", suggestedLevel: "L3 全港公開",
    suggestedType: "T3 優良", suggestedPts: 30, acornTags: ["藝術", "毅力"],
  },
  {
    id: "i03", cat: "sports", time: "1 小時前",
    studentName: "王小明", studentClass: "F2C",
    title: "全港學界籃球錦標賽男子甲組 (冠軍)",
    subtitle: "學界體育聯會 HKSSF · 代表隊隊長",
    read: false, aiScore: 88,
    organizer: "香港學界體育聯會 HKSSF", award: "🏆 冠軍 Champion", eventDate: "2026 年 7 月 28 日",
    certCategory: "籃球 · 團體", suggestedLevel: "L4 國際 / 全港",
    suggestedType: "T4 獲獎", suggestedPts: 50, acornTags: ["體魄", "協作"],
  },
  {
    id: "i04", cat: "academic", time: "2 小時前",
    studentName: "李美玲", studentClass: "F2B",
    title: "第七十五屆香港校際朗誦節 (粵語散文優良)",
    read: true, aiScore: 85,
    organizer: "香港學校音樂及朗誦協會", award: "⭐ 優良 Merit", eventDate: "2026 年 3 月 22 日",
    certCategory: "粵語散文 · 個人", suggestedLevel: "L3 全港公開",
    suggestedType: "T3 優良", suggestedPts: 30, acornTags: ["語文", "表達"],
  },
  {
    id: "i05", cat: "stem",  time: "3 小時前",
    studentName: "何雅詩", studentClass: "F1B",
    title: "2025 大灣區 STEM 創新發明比賽 (一等獎)",
    read: true, aiScore: 92,
    organizer: "粵港澳大灣區科創教育聯盟", award: "🥇 一等獎 1st Prize", eventDate: "2025 年 12 月 10 日",
    certCategory: "機械人 · 團隊", suggestedLevel: "L4 國際 / 全港",
    suggestedType: "T4 獲獎", suggestedPts: 50, acornTags: ["STEM", "創意"],
  },
  {
    id: "i06", cat: "service", time: "昨天",
    studentName: "吳敏兒", studentClass: "F4D",
    title: "聖約翰救傷隊急救員專業證書",
    read: true,
    organizer: "香港聖約翰救傷隊", award: "✅ 合格 Certified", eventDate: "2026 年 5 月 30 日",
    certCategory: "急救 · 個人", suggestedLevel: "L3 全港公開",
    suggestedType: "T2 完成", suggestedPts: 20, acornTags: ["服務", "責任"],
  },
  {
    id: "i07", cat: "academic", time: "昨天",
    studentName: "梁凱婷", studentClass: "F5A",
    title: "2026 全港青年演講比賽 (優異獎)",
    read: true, aiScore: 87,
    organizer: "香港演講學會", award: "🎖️ 優異 Distinction", eventDate: "2026 年 8 月 01 日",
    certCategory: "英語演講 · 個人", suggestedLevel: "L3 全港公開",
    suggestedType: "T3 優良", suggestedPts: 30, acornTags: ["語文", "領袖"],
  },
  {
    id: "i08", cat: "service", time: "Aug 08",
    studentName: "鄭浩南", studentClass: "F1B",
    title: "香港青年獎勵計劃 銅獎 (Duke of Edinburgh)",
    subtitle: "服務、技能、體能、探險四範疇全達標",
    read: true,
    organizer: "香港青年獎勵計劃", award: "🥉 銅獎 Bronze", eventDate: "2026 年 7 月 15 日",
    certCategory: "綜合發展 · 個人", suggestedLevel: "L3 全港公開",
    suggestedType: "T2 完成", suggestedPts: 25, acornTags: ["服務", "毅力"],
  },
  {
    id: "i09", cat: "sports", time: "Aug 07",
    studentName: "郭志文", studentClass: "F2A",
    title: "全港學界游泳錦標賽男子丁組 100m 蛙式 (季軍)",
    read: true,
    organizer: "香港業餘游泳總會", award: "🥉 季軍 Bronze", eventDate: "2026 年 7 月 20 日",
    certCategory: "游泳 · 個人", suggestedLevel: "L4 國際 / 全港",
    suggestedType: "T3 優良", suggestedPts: 35, acornTags: ["體魄", "毅力"],
  },
  {
    id: "i10", cat: "academic", time: "Aug 07",
    studentName: "黎子健", studentClass: "F1A",
    title: "第十八屆香港數學奧林匹克 (丙組銀獎)",
    read: true, aiScore: 96,
    organizer: "香港數學奧林匹克籌備委員會", award: "🥈 銀獎 Silver", eventDate: "2026 年 3 月 15 日",
    certCategory: "數學 · 個人", suggestedLevel: "L4 國際 / 全港",
    suggestedType: "T4 獲獎", suggestedPts: 45, acornTags: ["認知", "邏輯"],
  },
  {
    id: "i11", cat: "music", time: "Aug 06",
    studentName: "林芷晴", studentClass: "F3A",
    title: "香港中樂團青少年音樂大賽 小提琴組 (亞軍)",
    read: true,
    organizer: "香港中樂團", award: "🥈 亞軍 2nd Place", eventDate: "2026 年 6 月 28 日",
    certCategory: "小提琴 · 個人", suggestedLevel: "L3 全港公開",
    suggestedType: "T4 獲獎", suggestedPts: 40, acornTags: ["藝術", "毅力"],
  },
  {
    id: "i12", cat: "service", time: "Aug 05",
    studentName: "張小雯", studentClass: "F3D",
    title: "社區義工服務證書 (100 小時達標)",
    subtitle: "香港小童群益會義工計劃",
    read: true,
    organizer: "香港小童群益會 BGCA", award: "✅ 100 小時達標", eventDate: "2026 年 7 月 31 日",
    certCategory: "義工服務 · 個人", suggestedLevel: "L2 本地校外",
    suggestedType: "T2 完成", suggestedPts: 15, acornTags: ["服務", "責任"],
  },
];

// ── Category filter config ────────────────────────────────────────────────────
const FILTER_CATS: Array<{ id: "all" | CertCategory; label: string; emoji: string }> = [
  { id: "all",      label: "全部 All",         emoji: "📥" },
  { id: "stem",     label: "STEM 科技",         emoji: "💡" },
  { id: "music",    label: "音樂藝術",           emoji: "🎵" },
  { id: "sports",   label: "體育運動",           emoji: "🏅" },
  { id: "academic", label: "學術成就",           emoji: "📚" },
  { id: "service",  label: "服務義工",           emoji: "🤝" },
];

// ── Certificate thumbnail (detail pane) ───────────────────────────────────────
const CertThumbnail: React.FC<{ item: InboxItem }> = ({ item }) => {
  const cat = CATS[item.cat];
  return (
    <div style={{ position: "relative", borderRadius: ERP.radius.lg, overflow: "hidden" }}>
      <div style={{
        background: "linear-gradient(160deg, #FFFDF4 0%, #FFF8E7 50%, #FEFDF7 100%)",
        border: "2px solid #D97706",
        borderRadius: ERP.radius.lg,
        padding: "18px 20px",
        position: "relative", overflow: "hidden",
      }}>
        {/* Corner ornaments */}
        {[{ top: 6, left: 6 }, { top: 6, right: 6 }, { bottom: 6, left: 6 }, { bottom: 6, right: 6 }].map((pos, i) => (
          <div key={i} style={{
            position: "absolute", ...pos, width: 14, height: 14,
            border: "2px solid #F59E0B", borderRadius: 2, opacity: 0.55,
          }} />
        ))}
        <div style={{
          position: "absolute", inset: 8, border: "1px solid #FCD34D",
          borderRadius: ERP.radius.md, pointerEvents: "none", opacity: 0.5,
        }} />
        {/* Seal */}
        <div style={{ textAlign: "center", marginBottom: 10 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 44, height: 44, borderRadius: "50%",
            background: "radial-gradient(circle, #DC2626, #991B1B)",
            border: "2px solid #FCA5A5", boxShadow: "0 2px 8px rgba(220,38,38,0.4)",
          }}>
            <span style={{ fontSize: 20 }}>{cat.emoji}</span>
          </div>
        </div>
        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: "#92400E", letterSpacing: "0.1em", fontFamily: F }}>
            獎　　　狀
          </div>
          <div style={{ fontSize: 8.5, color: "#B45309", letterSpacing: "0.08em", fontFamily: F, marginTop: 2 }}>
            CERTIFICATE OF AWARD
          </div>
        </div>
        {/* Body */}
        <div style={{ fontSize: 9, color: "#78350F", fontFamily: F, lineHeight: 1.9, textAlign: "center" }}>
          <div>茲証明</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#1D1D1D", letterSpacing: "0.06em" }}>
            {item.studentName}　同　學
          </div>
          <div>參加</div>
          <div style={{ fontSize: 9.5, fontWeight: 600, color: "#1E3A8A" }}>
            {item.title.replace(/[（(].+[）)]$/, "").trim()}
          </div>
          {item.award && (
            <div style={{ marginTop: 4 }}>
              榮獲
              <span style={{ fontWeight: 900, fontSize: 11, color: "#D97706", marginLeft: 4, letterSpacing: "0.06em" }}>
                {item.award.replace(/[🏆🥇🥈🥉🎖️⭐✅]/u, "").trim()}
              </span>
            </div>
          )}
        </div>
        {/* Footer */}
        <div style={{
          display: "flex", justifyContent: "space-between", marginTop: 10, paddingTop: 8,
          borderTop: "1px dashed #FCD34D", fontSize: 8, color: "#B45309", fontFamily: F,
        }}>
          <span>{item.eventDate}</span>
          <span>{item.organizer?.split(" ")[0]}</span>
        </div>
      </div>
    </div>
  );
};

// ── AI data field ─────────────────────────────────────────────────────────────
const DataRow: React.FC<{ label: string; enLabel: string; value: React.ReactNode }> = ({ label, enLabel, value }) => (
  <div style={{ display: "flex", alignItems: "flex-start", padding: "9px 0", borderBottom: `1px solid ${ERP.colors.divider}` }}>
    <div style={{ width: 140, flexShrink: 0 }}>
      <div style={{ fontSize: 11.5, fontWeight: 600, color: ERP.colors.textSecondary, fontFamily: F }}>{label}</div>
      <div style={{ fontSize: 10, color: ERP.colors.textMuted, fontFamily: F }}>{enLabel}</div>
    </div>
    <div style={{ flex: 1, fontSize: 13, color: ERP.colors.textPrimary, fontFamily: F, lineHeight: 1.5 }}>{value}</div>
  </div>
);

// ── Category pill ─────────────────────────────────────────────────────────────
const CatPill: React.FC<{ cat: CertCategory; small?: boolean }> = ({ cat, small }) => {
  const def = CATS[cat];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      padding: small ? "1px 6px" : "2px 8px",
      background: def.bg, border: `1px solid ${def.border}`,
      borderRadius: ERP.radius.full,
      fontSize: small ? 10 : 10.5, fontWeight: 700, color: def.color,
      fontFamily: F, whiteSpace: "nowrap",
    }}>
      {def.emoji} {def.label}
    </span>
  );
};

// ── List item thumbnail icon ──────────────────────────────────────────────────
const CatThumb: React.FC<{ cat: CertCategory }> = ({ cat }) => {
  const def = CATS[cat];
  const Icon =
    cat === "music"    ? Music    :
    cat === "sports"   ? Dumbbell :
    cat === "academic" ? BookOpen :
    cat === "stem"     ? Cpu      : Heart;
  return (
    <div style={{
      width: 36, height: 36, borderRadius: ERP.radius.md, flexShrink: 0,
      background: def.thumbBg, border: `1px solid ${def.border}`,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <Icon size={16} color={def.iconColor} />
    </div>
  );
};

// ── Right pane detail content ─────────────────────────────────────────────────
const DetailPane: React.FC<{
  item: InboxItem;
  onApprove: () => void;
  onReject: () => void;
  isMobile?: boolean;
  onBack?: () => void;
}> = ({ item, onApprove, onReject, isMobile = false, onBack }) => {
  const [hoverApprove, setHoverApprove] = useState(false);
  const [hoverReject,  setHoverReject]  = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>

      {/* Detail header */}
      <div style={{
        padding: isMobile ? "12px 16px" : "14px 22px",
        borderBottom: `1px solid ${ERP.colors.border}`,
        background: ERP.colors.surface,
        display: "flex", alignItems: "center", gap: 10, flexShrink: 0,
      }}>
        {isMobile && onBack && (
          <button onClick={onBack} style={{
            display: "flex", alignItems: "center", gap: 4, padding: "6px 10px",
            border: `1px solid ${ERP.colors.border}`, borderRadius: ERP.radius.md,
            background: "transparent", fontSize: 12, fontWeight: 600,
            color: ERP.colors.textSecondary, cursor: "pointer", fontFamily: F, flexShrink: 0,
          }}>
            <ChevronLeft size={14} />返回
          </button>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: ERP.colors.textPrimary, fontFamily: F }}>
            審批詳情
            {!isMobile && (
              <span style={{ marginLeft: 8, fontSize: 11, color: ERP.colors.textMuted, fontWeight: 400, fontFamily: F }}>
                Certificate Approval Details
              </span>
            )}
          </div>
          <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const }}>
            <CatPill cat={item.cat} small />
            <span style={{ fontSize: 11, color: ERP.colors.textSecondary, fontFamily: F }}>
              {item.studentName}
              <span style={{
                display: "inline-block", marginLeft: 5, padding: "0px 5px",
                background: ERP.colors.accentPale, border: `1px solid ${ERP.colors.accentLight}`,
                borderRadius: ERP.radius.full, fontSize: 10, fontWeight: 700, color: ERP.colors.accent,
              }}>
                {item.studentClass}
              </span>
            </span>
          </div>
        </div>
        {!isMobile && (
          <button style={{
            display: "flex", alignItems: "center", gap: 5, padding: "6px 12px",
            border: `1px solid ${ERP.colors.border}`, borderRadius: ERP.radius.md,
            background: "transparent", fontSize: 12, fontWeight: 600,
            color: ERP.colors.textSecondary, cursor: "pointer", fontFamily: F, transition: "all 0.12s",
          }}
            onMouseEnter={e => { e.currentTarget.style.background = ERP.colors.accentPale; e.currentTarget.style.color = ERP.colors.accent; e.currentTarget.style.borderColor = ERP.colors.accentLight; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = ERP.colors.textSecondary; e.currentTarget.style.borderColor = ERP.colors.border; }}
          >
            <ArrowUpRight size={13} />
            完整開啟學生檔案
          </button>
        )}
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "14px 16px" : "18px 22px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Certificate thumbnail */}
        <CertThumbnail item={item} />

        {/* AI extraction panel */}
        {item.aiScore && (
          <div style={{
            background: "linear-gradient(135deg, #EFF6FF 0%, #EEF2FF 100%)",
            border: "1.5px solid #BFDBFE", borderRadius: ERP.radius.lg, padding: "12px 14px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
              <div style={{
                width: 24, height: 24, borderRadius: ERP.radius.sm,
                background: "linear-gradient(135deg, #4F46E5, #7C3AED)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Sparkles size={13} color="#fff" />
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#1E3A8A", fontFamily: F }}>
                ✨ AI 萃取結果
                <span style={{ fontWeight: 400, color: "#6366F1", marginLeft: 5 }}>AI Extraction Result</span>
              </span>
              <div style={{
                marginLeft: "auto", padding: "2px 9px", borderRadius: ERP.radius.full,
                background: item.aiScore >= 90 ? "#D1FAE5" : ERP.colors.amberLight,
                border: `1px solid ${item.aiScore >= 90 ? "#6EE7B7" : "#FCD34D"}`,
                fontSize: 11, fontWeight: 700,
                color: item.aiScore >= 90 ? "#065F46" : "#92400E", fontFamily: MONO,
              }}>
                {item.aiScore}% 信心
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <DataRow label="活動名稱" enLabel="Event Name"      value={<span style={{ fontWeight: 600 }}>{item.title.replace(/[（(].+[）)]$/, "").trim()}</span>} />
              <DataRow label="主辦機構" enLabel="Organizer"       value={item.organizer} />
              <DataRow label="獲獎等級" enLabel="Award"           value={<span style={{ fontWeight: 800, color: "#D97706", fontSize: 14 }}>{item.award}</span>} />
              <DataRow label="比賽日期" enLabel="Date"            value={item.eventDate} />
              <DataRow label="參賽類別" enLabel="Category"        value={item.certCategory} />
            </div>
          </div>
        )}

        {/* Suggested classification */}
        {item.suggestedLevel && (
          <div style={{
            background: ERP.colors.surface, border: `1px solid ${ERP.colors.border}`,
            borderRadius: ERP.radius.lg, overflow: "hidden",
          }}>
            <div style={{
              padding: "10px 14px", background: ERP.colors.pageBg,
              borderBottom: `1px solid ${ERP.colors.border}`,
              display: "flex", alignItems: "center", gap: 7,
            }}>
              <Star size={12} color={ERP.colors.warning} fill={ERP.colors.warning} />
              <span style={{ fontSize: 12, fontWeight: 700, color: ERP.colors.textPrimary, fontFamily: F }}>
                系統自動分配建議
                <span style={{ fontWeight: 400, color: ERP.colors.textMuted, marginLeft: 5 }}>Suggested Classification & Points</span>
              </span>
            </div>
            <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" as const }}>
                <span style={{ fontSize: 11, color: ERP.colors.textSecondary, fontFamily: F, width: 90, flexShrink: 0 }}>等級 Level</span>
                <div style={{ padding: "4px 12px", borderRadius: ERP.radius.full, background: "#1E3A8A", color: "#BFDBFE", fontSize: 12, fontWeight: 800, fontFamily: MONO, letterSpacing: "0.05em" }}>
                  {item.suggestedLevel}
                </div>
                <div style={{ padding: "4px 12px", borderRadius: ERP.radius.full, background: "#14532D", color: "#BBF7D0", fontSize: 12, fontWeight: 800, fontFamily: MONO, letterSpacing: "0.05em" }}>
                  {item.suggestedType}
                </div>
                {item.suggestedPts && (
                  <div style={{ padding: "4px 12px", borderRadius: ERP.radius.full, background: "linear-gradient(135deg, #D97706, #F59E0B)", color: "#fff", fontSize: 12, fontWeight: 800, fontFamily: MONO }}>
                    + {item.suggestedPts} 分
                  </div>
                )}
              </div>
              {item.acornTags && item.acornTags.length > 0 && (
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: ERP.colors.textSecondary, fontFamily: F, width: 90, flexShrink: 0 }}>ACORN 屬性</span>
                  <div style={{ display: "flex", gap: 6 }}>
                    {item.acornTags.map(tag => {
                      const a = ERP.acornTags[tag as keyof typeof ERP.acornTags];
                      return a ? (
                        <span key={tag} style={{
                          padding: "2px 8px", background: a.bg, border: `1px solid ${a.border}`,
                          borderRadius: ERP.radius.full, fontSize: 10.5, fontWeight: 700, color: a.color, fontFamily: F,
                        }}>
                          {tag}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* No AI score fallback */}
        {!item.aiScore && (
          <div style={{
            background: ERP.colors.pageBg, border: `1px dashed ${ERP.colors.border}`,
            borderRadius: ERP.radius.lg, padding: "14px 16px",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <Clock size={15} color={ERP.colors.textMuted} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: ERP.colors.textSecondary, fontFamily: F }}>
                等待 AI 分析
              </div>
              <div style={{ fontSize: 11, color: ERP.colors.textMuted, fontFamily: F }}>
                Pending AI extraction · 請人工核對證書內容
              </div>
            </div>
          </div>
        )}

        {/* Keyboard shortcut hints — desktop only */}
        {!isMobile && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "center", padding: "8px 0" }}>
            {[
              { key: "⌘ ↵", label: "快速核准", color: ERP.colors.success },
              { key: "⌘ ⌫", label: "退回重交", color: ERP.colors.error },
              { key: "→",   label: "下一項",   color: ERP.colors.textMuted },
            ].map(k => (
              <div key={k.key} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: ERP.colors.textMuted, fontFamily: F }}>
                <span style={{ padding: "1px 5px", background: ERP.colors.pageBg, border: `1px solid ${ERP.colors.borderStrong}`, borderRadius: 3, fontFamily: MONO, fontSize: 9, color: k.color }}>
                  {k.key}
                </span>
                {k.label}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sticky action bar */}
      <div style={{
        flexShrink: 0, padding: isMobile ? "12px 16px" : "12px 22px",
        borderTop: `1px solid ${ERP.colors.border}`, background: ERP.colors.surface,
        boxShadow: "0 -2px 8px rgba(0,0,0,0.05)", display: "flex", gap: 10, alignItems: "center",
      }}>
        <button
          onClick={onReject}
          onMouseEnter={() => setHoverReject(true)}
          onMouseLeave={() => setHoverReject(false)}
          style={{
            flex: 1, height: 42,
            border: `1.5px solid ${hoverReject ? ERP.colors.error : ERP.colors.borderStrong}`,
            borderRadius: ERP.radius.md, background: hoverReject ? "#FEF2F2" : "#fff",
            fontSize: 13, fontWeight: 700,
            color: hoverReject ? ERP.colors.error : ERP.colors.textSecondary,
            cursor: "pointer", fontFamily: F,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            transition: "all 0.15s",
          }}
        >
          <XCircle size={15} />
          ❌ 退回重交
          <span style={{ fontSize: 10, fontWeight: 400, color: ERP.colors.textMuted }}>Reject</span>
        </button>
        <button
          onClick={onApprove}
          onMouseEnter={() => setHoverApprove(true)}
          onMouseLeave={() => setHoverApprove(false)}
          style={{
            flex: 1.6, height: 42, border: "none", borderRadius: ERP.radius.md,
            background: hoverApprove ? "linear-gradient(135deg, #047857, #059669)" : "linear-gradient(135deg, #059669, #10B981)",
            fontSize: 13, fontWeight: 800, color: "#fff",
            cursor: "pointer", fontFamily: F,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            boxShadow: hoverApprove ? "0 4px 16px rgba(5,150,105,0.45)" : "0 2px 10px rgba(5,150,105,0.30)",
            transition: "all 0.15s", letterSpacing: "0.01em",
          }}
        >
          <CheckCircle size={15} />
          ✅ 快速核准
          <span style={{ fontSize: 10, fontWeight: 500, opacity: 0.85 }}>Quick Approve</span>
        </button>
      </div>
    </div>
  );
};

// ── Left list item ────────────────────────────────────────────────────────────
const ListItem: React.FC<{ item: InboxItem; selected: boolean; onClick: () => void }> = ({
  item, selected, onClick,
}) => {
  const [hover, setHover] = useState(false);
  const isUnread = !item.read && !item.approved && !item.rejected;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: "11px 14px",
        background: selected ? "#EFF6FF" : hover ? ERP.colors.surfaceHover : "#fff",
        borderLeft: `3px solid ${selected ? ERP.colors.accent : "transparent"}`,
        borderBottom: `1px solid ${ERP.colors.divider}`,
        cursor: "pointer", transition: "background 0.1s, border-color 0.1s",
        position: "relative", display: "flex", gap: 10, alignItems: "flex-start",
      }}
    >
      {/* Category thumbnail icon */}
      <div style={{ position: "relative", flexShrink: 0, marginTop: 2 }}>
        <CatThumb cat={item.cat} />
        {/* Unread indicator dot on thumb */}
        {isUnread && (
          <div style={{
            position: "absolute", top: -3, right: -3,
            width: 8, height: 8, borderRadius: "50%",
            background: ERP.colors.accent,
            border: "1.5px solid #fff",
            boxShadow: `0 0 5px ${ERP.colors.accent}80`,
          }} />
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Top row: category pill + time */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <CatPill cat={item.cat} small />
          <span style={{ marginLeft: "auto", fontSize: 10, color: ERP.colors.textMuted, fontFamily: F, flexShrink: 0 }}>
            {item.time}
          </span>
        </div>

        {/* Student + class */}
        <div style={{
          fontSize: 12.5,
          fontWeight: isUnread ? 700 : 500,
          color: item.approved ? ERP.colors.textMuted : item.rejected ? ERP.colors.error : ERP.colors.textPrimary,
          fontFamily: F, lineHeight: 1.45,
          textDecoration: item.rejected ? "line-through" : "none",
        }}>
          <span style={{ color: selected ? ERP.colors.accent : ERP.colors.textSecondary, fontWeight: 700, marginRight: 4 }}>
            {item.studentName}
          </span>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: "0px 4px",
            background: selected ? ERP.colors.accentLight : ERP.colors.pageBg,
            border: `1px solid ${selected ? ERP.colors.accent + "60" : ERP.colors.border}`,
            borderRadius: ERP.radius.sm,
            color: selected ? ERP.colors.accent : ERP.colors.textMuted, marginRight: 5,
          }}>
            {item.studentClass}
          </span>
          {item.title}
        </div>

        {item.subtitle && (
          <div style={{ fontSize: 11, color: ERP.colors.textMuted, fontFamily: F, marginTop: 3, lineHeight: 1.4 }}>
            {item.subtitle}
          </div>
        )}
      </div>

      {/* Status badges */}
      {item.approved && (
        <div style={{
          position: "absolute", top: 8, right: 10,
          display: "flex", alignItems: "center", gap: 3, padding: "1px 6px",
          background: ERP.colors.successLight, border: "1px solid #6EE7B7",
          borderRadius: ERP.radius.full, fontSize: 9.5, fontWeight: 700, color: ERP.colors.success, fontFamily: F,
        }}>
          <CheckCheck size={9} /> 已核准
        </div>
      )}
      {item.rejected && (
        <div style={{
          position: "absolute", top: 8, right: 10,
          display: "flex", alignItems: "center", gap: 3, padding: "1px 6px",
          background: ERP.colors.errorLight, border: "1px solid #FCA5A5",
          borderRadius: ERP.radius.full, fontSize: 9.5, fontWeight: 700, color: ERP.colors.error, fontFamily: F,
        }}>
          <XCircle size={9} /> 已退回
        </div>
      )}
    </div>
  );
};

// ── Main screen ───────────────────────────────────────────────────────────────
export const Screen_ApprovalInbox: React.FC = () => {
  const [items, setItems]           = useState<InboxItem[]>(INITIAL_ITEMS);
  const [selectedId, setSelectedId] = useState<string>("i01");
  const [activeFilter, setFilter]   = useState<"all" | CertCategory>("all");
  const [isMobile, setIsMobile]     = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "detail">("list");

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const selectedItem = items.find(i => i.id === selectedId) ?? items[0];

  const visibleItems = activeFilter === "all"
    ? items
    : items.filter(i => i.cat === activeFilter);

  const unread = items.filter(i => !i.read && !i.approved && !i.rejected).length;

  const handleApprove = () => {
    setItems(prev => prev.map(it => it.id === selectedId ? { ...it, approved: true, rejected: false, read: true } : it));
    const next = items.find(it => it.id !== selectedId && !it.approved && !it.rejected);
    if (next) setTimeout(() => setSelectedId(next.id), 300);
  };

  const handleReject = () => {
    setItems(prev => prev.map(it => it.id === selectedId ? { ...it, rejected: true, approved: false, read: true } : it));
    const next = items.find(it => it.id !== selectedId && !it.approved && !it.rejected);
    if (next) setTimeout(() => setSelectedId(next.id), 300);
  };

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setItems(prev => prev.map(it => it.id === id ? { ...it, read: true } : it));
    if (isMobile) setMobileView("detail");
  };

  return (
    <div style={{
      display: "flex", flexDirection: isMobile ? "column" : "row",
      height: "calc(100vh - 56px)", overflow: "hidden",
      background: ERP.colors.pageBg, fontFamily: F,
    }}>

      {/* ════════ LEFT PANE ════════ */}
      {(!isMobile || mobileView === "list") && (
        <div style={{
          width: isMobile ? "100%" : "40%",
          minWidth: isMobile ? 0 : 320,
          display: "flex", flexDirection: "column",
          borderRight: isMobile ? "none" : `1px solid ${ERP.colors.border}`,
          borderBottom: isMobile ? `1px solid ${ERP.colors.border}` : "none",
          background: ERP.colors.surface, overflow: "hidden",
          flex: isMobile ? "1 1 0" : undefined,
        }}>

          {/* Left header */}
          <div style={{ padding: "14px 16px 0", borderBottom: `1px solid ${ERP.colors.border}`, flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: ERP.radius.md, flexShrink: 0,
                background: "linear-gradient(135deg, #1D4ED8, #6366F1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 2px 6px rgba(37,99,235,0.28)",
              }}>
                <Award size={16} color="#fff" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: ERP.colors.textPrimary, display: "flex", alignItems: "center", gap: 7 }}>
                  🏅 成就與證書審批
                  {unread > 0 && (
                    <span style={{ padding: "1px 7px", borderRadius: ERP.radius.full, background: ERP.colors.accent, color: "#fff", fontSize: 10.5, fontWeight: 800 }}>
                      {unread}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 10.5, color: ERP.colors.textMuted, fontFamily: F, marginTop: 1 }}>
                  審批學生上載之證書與校外成就紀錄
                </div>
              </div>
              {/* Progress counter */}
              <div style={{
                textAlign: "center", padding: "4px 9px",
                background: ERP.colors.successLight, border: "1px solid #6EE7B7",
                borderRadius: ERP.radius.md, flexShrink: 0,
              }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: ERP.colors.success }}>
                  {items.filter(i => i.approved).length}/{items.length}
                </div>
                <div style={{ fontSize: 9, color: ERP.colors.success, fontWeight: 600 }}>已完成</div>
              </div>
            </div>

            {/* Subtitle description */}
            <div style={{
              marginBottom: 10, padding: "8px 10px",
              background: "#EFF6FF", border: "1px solid #BFDBFE",
              borderRadius: ERP.radius.md,
              display: "flex", alignItems: "flex-start", gap: 7,
            }}>
              <FileText size={12} color={ERP.colors.accent} style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 10.5, color: "#1E40AF", fontFamily: F, lineHeight: 1.5 }}>
                Review and approve student-uploaded certificates and external achievements.<br />
                <span style={{ opacity: 0.75 }}>此收件匣僅處理成就與證書審批，不含請假或考勤申請。</span>
              </div>
            </div>

            {/* Category filter pills */}
            <div style={{ display: "flex", gap: 5, paddingBottom: 10, overflowX: "auto" }}>
              {FILTER_CATS.map(f => {
                const isActive = activeFilter === f.id;
                const count = f.id === "all"
                  ? items.length
                  : items.filter(i => i.cat === f.id).length;
                return (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id as "all" | CertCategory)}
                    style={{
                      display: "flex", alignItems: "center", gap: 4, padding: "4px 10px",
                      borderRadius: ERP.radius.full,
                      border: `1.5px solid ${isActive ? ERP.colors.accent : ERP.colors.border}`,
                      background: isActive ? ERP.colors.accentPale : "transparent",
                      fontSize: 11, fontWeight: isActive ? 700 : 500,
                      color: isActive ? ERP.colors.accent : ERP.colors.textSecondary,
                      cursor: "pointer", fontFamily: F, whiteSpace: "nowrap",
                      transition: "all 0.12s",
                    }}
                  >
                    {f.emoji} {f.label}
                    <span style={{
                      padding: "0 4px", borderRadius: ERP.radius.full,
                      background: isActive ? ERP.colors.accent : ERP.colors.borderStrong,
                      color: isActive ? "#fff" : ERP.colors.textMuted,
                      fontSize: 9.5, fontWeight: 700, minWidth: 14, textAlign: "center",
                    }}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* List */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {visibleItems.map(item => (
              <ListItem
                key={item.id}
                item={item}
                selected={selectedId === item.id}
                onClick={() => handleSelect(item.id)}
              />
            ))}
            {visibleItems.length === 0 && (
              <div style={{ padding: 32, textAlign: "center", color: ERP.colors.textMuted, fontSize: 12, fontFamily: F }}>
                此類別暫無待辦項目
              </div>
            )}
          </div>

          {/* Bottom stats bar */}
          <div style={{
            flexShrink: 0, padding: "8px 16px",
            borderTop: `1px solid ${ERP.colors.border}`,
            background: ERP.colors.pageBg,
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <span style={{ fontSize: 10, color: ERP.colors.textMuted, fontFamily: F }}>今日效率：</span>
            {[
              { label: "已核准", count: items.filter(i => i.approved).length,               color: ERP.colors.success  },
              { label: "已退回", count: items.filter(i => i.rejected).length,               color: ERP.colors.error    },
              { label: "待處理", count: items.filter(i => !i.approved && !i.rejected).length, color: ERP.colors.textMuted },
            ].map(s => (
              <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: s.color }} />
                <span style={{ fontSize: 10, color: s.color, fontWeight: 700, fontFamily: F }}>{s.count}</span>
                <span style={{ fontSize: 10, color: ERP.colors.textMuted, fontFamily: F }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ════════ RIGHT PANE ════════ */}
      {(!isMobile || mobileView === "detail") && (
        <div style={{
          flex: 1, minWidth: 0, display: "flex", flexDirection: "column",
          background: ERP.colors.pageBg, overflow: "hidden",
        }}>
          {selectedItem ? (
            <DetailPane
              key={selectedItem.id}
              item={selectedItem}
              onApprove={handleApprove}
              onReject={handleReject}
              isMobile={isMobile}
              onBack={() => setMobileView("list")}
            />
          ) : (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: ERP.colors.textMuted, fontSize: 13, fontFamily: F }}>
              選擇左側項目以預覽詳情
            </div>
          )}
        </div>
      )}
    </div>
  );
};
