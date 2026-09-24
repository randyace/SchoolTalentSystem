// ─────────────────────────────────────────────────────────────────────────────
// Screen: 動態群組管理 — 建立新群組 (Dynamic Group Builder)
// Module: Student & Class Management → Dynamic Groups
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect } from "react";
import {
  ChevronRight, Home, Users, PlusCircle, Save, X,
  ChevronDown, ClipboardPaste, Zap, CheckCircle2,
  AlertTriangle, BookOpen, UserCog, Info,
  Layers, School, ArrowRight,
} from "lucide-react";
import { ERP } from "./erpTokens";

// ── Responsive hook ──────────────────────────────────────────────────────────
function useIsMobile(bp = 768) {
  const [mobile, setMobile] = useState(
    typeof window !== "undefined" && window.innerWidth < bp
  );
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < bp);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, [bp]);
  return mobile;
}

// ── Local Design Tokens ──────────────────────────────────────────────────────
const F = ERP.font.family;

const CLASS_PALETTE: Record<string, { bg: string; color: string; border: string }> = {
  F4A: { bg: "#DBEAFE", color: "#1D4ED8",  border: "#93C5FD" },
  F4B: { bg: "#EDE9FE", color: "#6D28D9",  border: "#C4B5FD" },
  F4C: { bg: "#DCFCE7", color: "#15803D",  border: "#86EFAC" },
  F4D: { bg: "#FEF3C7", color: "#92400E",  border: "#FCD34D" },
};

interface ParsedStudent {
  id:    string;
  rawId: string;
  name:  string;
  cls:   string;
  ok:    boolean;
}

const PARSED: ParsedStudent[] = [
  { id: "r1", rawId: "2023-F4A-05", name: "陳大明", cls: "F4A", ok: true },
  { id: "r2", rawId: "2023-F4B-12", name: "李美玲", cls: "F4B", ok: true },
  { id: "r3", rawId: "2023-F4C-02", name: "張志強", cls: "F4C", ok: true },
  { id: "r4", rawId: "2023-F4D-18", name: "王小華", cls: "F4D", ok: true },
];

const PASTE_TEXT =
  `2023-F4A-05, 陳大明\n2023-F4B-12, 李美玲\n2023-F4C-02, 張志強\n2023-F4D-18, 王小華`;

// ── Sub-components ────────────────────────────────────────────────────────────

const SectionCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  accent?: string;
  isMobile?: boolean;
  children: React.ReactNode;
}> = ({ icon, title, subtitle, accent = ERP.colors.accent, isMobile = false, children }) => (
  <div style={{
    background: ERP.colors.surface,
    border: `1px solid ${ERP.colors.border}`,
    borderRadius: ERP.radius.xl,
    boxShadow: ERP.shadow.card,
    overflow: "hidden",
  }}>
    {/* Card header strip */}
    <div style={{
      padding: isMobile ? "12px 16px" : "14px 22px",
      borderBottom: `1px solid ${ERP.colors.border}`,
      display: "flex", alignItems: "center", gap: 10,
      background: ERP.colors.pageBg,
    }}>
      <div style={{
        width: 30, height: 30, borderRadius: ERP.radius.md,
        background: accent + "18",
        border: `1px solid ${accent}30`,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: ERP.colors.textPrimary, fontFamily: F }}>
          {title}
        </div>
        {subtitle && (
          <div style={{
            fontSize: 11, color: ERP.colors.textMuted, fontFamily: F, marginTop: 1,
            ...(isMobile ? { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } : {}),
          }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
    <div style={{ padding: isMobile ? "16px" : "20px 22px" }}>
      {children}
    </div>
  </div>
);

const FormField: React.FC<{
  label: string;
  enLabel: string;
  required?: boolean;
  children: React.ReactNode;
  flex?: number;
}> = ({ label, enLabel, required, children, flex = 1 }) => (
  <div style={{ flex, minWidth: 0 }}>
    <label style={{
      display: "block",
      fontSize: 12, fontWeight: 600,
      color: ERP.colors.textSecondary,
      marginBottom: 7, fontFamily: F,
    }}>
      {label}
      <span style={{ color: ERP.colors.textMuted, fontWeight: 400, marginLeft: 4 }}>
        {enLabel}
      </span>
      {required && <span style={{ color: ERP.colors.error, marginLeft: 3 }}>*</span>}
    </label>
    {children}
  </div>
);

const TextInput: React.FC<{
  value: string;
  placeholder?: string;
  onChange?: (v: string) => void;
}> = ({ value, placeholder, onChange }) => (
  <input
    type="text"
    value={value}
    placeholder={placeholder}
    onChange={e => onChange?.(e.target.value)}
    style={{
      width: "100%", boxSizing: "border-box",
      height: 38, padding: "0 12px",
      border: `1.5px solid ${ERP.colors.border}`,
      borderRadius: ERP.radius.md,
      fontSize: 13, fontFamily: F,
      color: ERP.colors.textPrimary,
      background: "#fff",
      outline: "none",
      transition: "border-color 0.15s",
    }}
    onFocus={e => (e.target.style.borderColor = ERP.colors.accent)}
    onBlur={e => (e.target.style.borderColor = ERP.colors.border)}
  />
);

const SelectField: React.FC<{ value: string; icon?: React.ReactNode }> = ({ value, icon }) => (
  <div style={{
    position: "relative", display: "flex", alignItems: "center",
    border: `1.5px solid ${ERP.colors.border}`,
    borderRadius: ERP.radius.md, background: "#fff",
    height: 38, padding: "0 12px",
    cursor: "pointer",
    userSelect: "none",
  }}>
    {icon && (
      <span style={{ marginRight: 7, display: "flex", alignItems: "center", opacity: 0.55 }}>
        {icon}
      </span>
    )}
    <span style={{ flex: 1, fontSize: 13, fontFamily: F, color: ERP.colors.textPrimary }}>
      {value}
    </span>
    <ChevronDown size={14} color={ERP.colors.textMuted} />
  </div>
);

// ── Parsed Line component (textarea line highlight simulation) ────────────────
const ParsedLine: React.FC<{ line: string }> = ({ line }) => {
  const parts = line.split(",");
  const idPart   = parts[0]?.trim() ?? "";
  const namePart = parts.slice(1).join(",").trim();
  return (
    <div style={{ lineHeight: 1.9 }}>
      <span style={{
        fontFamily: ERP.font.mono,
        color: "#2563EB", fontSize: 13,
        background: "#EFF6FF", borderRadius: 3,
        padding: "1px 4px",
      }}>
        {idPart}
      </span>
      {namePart && (
        <>
          <span style={{ color: ERP.colors.textMuted, margin: "0 4px" }}>,</span>
          <span style={{ fontSize: 13, color: ERP.colors.textPrimary, fontFamily: F }}>
            {namePart}
          </span>
        </>
      )}
    </div>
  );
};

// ── Cross-class distribution mini-chart ──────────────────────────────────────
const CrossClassDistribution: React.FC<{ students: ParsedStudent[] }> = ({ students }) => {
  const classCounts: Record<string, number> = {};
  students.forEach(s => { classCounts[s.cls] = (classCounts[s.cls] || 0) + 1; });
  const entries = Object.entries(classCounts);
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
    }}>
      <span style={{ fontSize: 11, color: ERP.colors.textMuted, fontFamily: F, marginRight: 2 }}>
        跨班組成：
      </span>
      {entries.map(([cls, count]) => {
        const pal = CLASS_PALETTE[cls] ?? { bg: "#F1F5F9", color: "#475569", border: "#CBD5E1" };
        return (
          <div key={cls} style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "3px 9px",
            background: pal.bg,
            border: `1px solid ${pal.border}`,
            borderRadius: ERP.radius.full,
          }}>
            <span style={{
              width: 7, height: 7, borderRadius: "50%",
              background: pal.color, flexShrink: 0,
            }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: pal.color, fontFamily: F }}>
              {cls}
            </span>
            <span style={{ fontSize: 11, color: pal.color, opacity: 0.7, fontFamily: F }}>
              {count}人
            </span>
          </div>
        );
      })}
      <div style={{
        marginLeft: 4, display: "flex", alignItems: "center", gap: 4,
        padding: "3px 9px",
        background: ERP.colors.accentPale,
        border: `1px solid ${ERP.colors.accentLight}`,
        borderRadius: ERP.radius.full,
      }}>
        <Layers size={10} color={ERP.colors.accent} />
        <span style={{ fontSize: 11, fontWeight: 700, color: ERP.colors.accent, fontFamily: F }}>
          {entries.length} 班混合
        </span>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
export const Screen_DynamicGroupBuilder: React.FC = () => {
  const [groupName,  setGroupName]  = useState("25/26 中四歷史科選修組 (F4 History Elective)");
  const [parsed,     setParsed]     = useState(false);
  const [pasteText,  setPasteText]  = useState(PASTE_TEXT);
  const [hoverSave,  setHoverSave]  = useState(false);
  const [hoverParse, setHoverParse] = useState(false);
  const [hoverPaste, setHoverPaste] = useState(false);
  const [saved,      setSaved]      = useState(false);
  const isMobile = useIsMobile(768);

  const handleParse = () => setParsed(true);
  const handleSave  = () => { if (parsed) setSaved(true); };

  return (
    <div style={{
      minHeight: "100%",
      background: ERP.colors.pageBg,
      fontFamily: F,
      display: "flex", flexDirection: "column",
    }}>

      {/* ── Top Header ────────────────────────────────────────────────────── */}
      <div style={{
        background: ERP.colors.surface,
        borderBottom: `1px solid ${ERP.colors.border}`,
        padding: isMobile ? "0 16px" : "0 28px",
        boxShadow: ERP.shadow.xs,
        flexShrink: 0,
      }}>
        {/* Breadcrumb */}
        <div style={{
          display: "flex", alignItems: "center", gap: 5,
          padding: "10px 0 6px",
          fontSize: 11.5, color: ERP.colors.textMuted,
          overflow: "hidden",
          flexWrap: "nowrap",
        }}>
          <Home size={11} color={ERP.colors.textMuted} style={{ flexShrink: 0 }} />
          {isMobile ? (
            /* Mobile: show only last two crumbs */
            <>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                動態分組管理
              </span>
              <ChevronRight size={10} style={{ flexShrink: 0 }} />
              <span style={{ color: ERP.colors.textPrimary, fontWeight: 600, whiteSpace: "nowrap" }}>
                建立新群組
              </span>
            </>
          ) : (
            <>
              <span>首頁</span>
              <ChevronRight size={10} />
              <span>學生與班級</span>
              <ChevronRight size={10} />
              <span>動態分組管理</span>
              <ChevronRight size={10} />
              <span style={{ color: ERP.colors.textPrimary, fontWeight: 600 }}>建立新群組</span>
            </>
          )}
        </div>

        {/* Title row */}
        <div style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "stretch" : "center",
          gap: isMobile ? 10 : 14,
          padding: isMobile ? "8px 0 12px" : "8px 0 14px",
          borderTop: `1px solid ${ERP.colors.divider}`,
        }}>
          {/* Icon + title block */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
            <div style={{
              width: isMobile ? 34 : 40, height: isMobile ? 34 : 40,
              borderRadius: ERP.radius.lg,
              background: "linear-gradient(135deg, #1D4ED8 0%, #2563EB 60%, #0891B2 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 8px rgba(37,99,235,0.30)",
              flexShrink: 0,
            }}>
              <Users size={isMobile ? 17 : 20} color="#fff" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: isMobile ? 15 : 18, fontWeight: 800,
                color: ERP.colors.textPrimary,
                display: "flex", alignItems: "center", gap: 8,
                flexWrap: "wrap",
              }}>
                👥 建立跨班 / 選修群組
                {!isMobile && (
                  <span style={{
                    fontSize: 11, fontWeight: 600, letterSpacing: "0.04em",
                    padding: "2px 8px", borderRadius: ERP.radius.full,
                    background: ERP.colors.accentPale,
                    border: `1px solid ${ERP.colors.accentLight}`,
                    color: ERP.colors.accent,
                  }}>
                    Create Dynamic Group
                  </span>
                )}
              </div>
              <div style={{
                fontSize: 12, color: ERP.colors.textMuted, marginTop: 2,
                ...(isMobile ? {
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                } : {}),
              }}>
                跨越行政班界，為選修科目或特殊活動建立靈活的學生群組
                {!isMobile && (
                  <>
                    <span style={{ color: ERP.colors.textDisabled, margin: "0 4px" }}>·</span>
                    Bypass admin classes to create flexible cross-class groups
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{
            display: "flex", gap: 8, flexShrink: 0,
            ...(isMobile ? { width: "100%" } : {}),
          }}>
            <button style={{
              height: 36,
              padding: isMobile ? "0 14px" : "0 16px",
              border: `1.5px solid ${ERP.colors.borderStrong}`,
              borderRadius: ERP.radius.md,
              background: "#fff",
              fontSize: 13, fontWeight: 600, color: ERP.colors.textSecondary,
              cursor: "pointer", fontFamily: F,
              display: "flex", alignItems: "center", gap: 6,
              ...(isMobile ? { flex: 1, justifyContent: "center" } : {}),
            }}>
              <X size={14} />
              取消 {!isMobile && "Cancel"}
            </button>
            <button
              onClick={handleSave}
              onMouseEnter={() => setHoverSave(true)}
              onMouseLeave={() => setHoverSave(false)}
              style={{
                height: 36,
                padding: isMobile ? "0 14px" : "0 18px",
                border: "none",
                borderRadius: ERP.radius.md,
                background: saved
                  ? "linear-gradient(135deg, #059669, #16A34A)"
                  : hoverSave
                  ? "linear-gradient(135deg, #1D4ED8 0%, #1e60e8 100%)"
                  : "linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)",
                fontSize: 13, fontWeight: 700, color: "#fff",
                cursor: "pointer", fontFamily: F,
                display: "flex", alignItems: "center", gap: 7,
                boxShadow: "0 2px 8px rgba(37,99,235,0.28)",
                transition: "background 0.18s",
                ...(isMobile ? { flex: 2, justifyContent: "center" } : {}),
              }}
            >
              {saved ? <CheckCircle2 size={14} /> : <Save size={14} />}
              {saved ? "✅ 已儲存！" : `💾 儲存${isMobile ? "" : "並建立群組"}`}
            </button>
          </div>
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div style={{
        flex: 1,
        padding: isMobile ? "16px 16px 32px" : "24px 28px 40px",
        display: "flex", flexDirection: "column", gap: isMobile ? 14 : 20,
        maxWidth: 960, width: "100%",
        boxSizing: "border-box",
      }}>

        {/* ── Cross-class info banner ──────────────────────────────────────── */}
        <div style={{
          background: "linear-gradient(135deg, #EFF6FF 0%, #EDE9FE 100%)",
          border: `1px solid #C7D2FE`,
          borderRadius: ERP.radius.lg,
          padding: isMobile ? "10px 14px" : "11px 18px",
          display: "flex", alignItems: "flex-start", gap: 10,
        }}>
          <Info size={15} color="#4F46E5" style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: isMobile ? 11.5 : 12, color: "#3730A3", fontFamily: F, lineHeight: 1.6 }}>
            <strong>跨班群組功能</strong>允許您從多個行政班抽調學生，建立選修科、補底班等彈性分組，完全不影響現有行政班資料。
            {!isMobile && (
              <span style={{ color: "#6366F1", marginLeft: 6 }}>
                Cross-class groups override administrative class boundaries without modifying any existing records.
              </span>
            )}
          </div>
        </div>

        {/* ── Section 1: Group Info ────────────────────────────────────────── */}
        <SectionCard
          icon={<BookOpen size={15} color={ERP.colors.accent} />}
          title="群組基本資訊"
          subtitle="Section 1 · Basic Group Information"
          accent={ERP.colors.accent}
          isMobile={isMobile}
        >
          {/* Fields — single column on mobile, flex row on desktop */}
          <div style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            gap: isMobile ? 14 : 16,
          }}>
            <FormField label="群組名稱" enLabel="Group Name" required flex={isMobile ? undefined : 2.2}>
              <TextInput
                value={groupName}
                onChange={setGroupName}
                placeholder="輸入群組名稱..."
              />
            </FormField>
            <FormField label="所屬學習領域 / 科目" enLabel="KLA / Subject" required flex={isMobile ? undefined : 2}>
              <SelectField
                value="個人、社會及人文教育 / 歷史科"
                icon={<BookOpen size={13} />}
              />
            </FormField>
            <FormField label="負責教師" enLabel="Teacher in Charge" flex={isMobile ? undefined : 1}>
              <SelectField
                value="李老師"
                icon={<UserCog size={13} />}
              />
            </FormField>
          </div>

          {/* Group type tags */}
          <div style={{
            marginTop: 16, paddingTop: 14,
            borderTop: `1px dashed ${ERP.colors.border}`,
          }}>
            <span style={{
              display: "block",
              fontSize: 11, color: ERP.colors.textMuted, fontFamily: F,
              marginBottom: 8,
            }}>
              群組類型 Group Type：
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {[
                { label: "選修科目", en: "Elective",    active: true,  bg: ERP.colors.purpleLight, color: ERP.colors.purple, border: "#DDD6FE" },
                { label: "跨班分組", en: "Cross-class", active: true,  bg: ERP.colors.accentPale,  color: ERP.colors.accent, border: ERP.colors.accentLight },
                { label: "精英培訓", en: "Elite",       active: false, bg: ERP.colors.pageBg,       color: ERP.colors.textMuted, border: ERP.colors.border },
                { label: "補底支援", en: "Support",     active: false, bg: ERP.colors.pageBg,       color: ERP.colors.textMuted, border: ERP.colors.border },
              ].map(t => (
                <button key={t.label} style={{
                  padding: "4px 11px",
                  borderRadius: ERP.radius.full,
                  border: `1.5px solid ${t.active ? t.border : ERP.colors.border}`,
                  background: t.active ? t.bg : ERP.colors.pageBg,
                  color: t.active ? t.color : ERP.colors.textMuted,
                  fontSize: 11, fontWeight: t.active ? 700 : 500,
                  cursor: "pointer", fontFamily: F,
                  transition: "all 0.15s",
                  whiteSpace: "nowrap" as const,
                }}>
                  {t.active && "✓ "}{t.label}
                  {!isMobile && <span style={{ opacity: 0.6, marginLeft: 3 }}>({t.en})</span>}
                </button>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* ── Section 2: Smart Roster Import ──────────────────────────────── */}
        <SectionCard
          icon={<Zap size={15} color="#D97706" />}
          title="智能名單匯入區"
          subtitle="Section 2 · Smart Roster Import — Paste from Excel / CSV"
          accent="#D97706"
          isMobile={isMobile}
        >
          <style>{`
            @keyframes parsePulse {
              0%   { box-shadow: 0 0 0 0 rgba(37,99,235,0.35); }
              70%  { box-shadow: 0 0 0 8px rgba(37,99,235,0); }
              100% { box-shadow: 0 0 0 0 rgba(37,99,235,0); }
            }
          `}</style>

          <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row" as const, gap: 16, alignItems: "flex-start" }}>
            {/* Left: textarea */}
            <div style={{ flex: 1 }}>
              <label style={{
                display: "flex", alignItems: "center", gap: 7,
                fontSize: 12, fontWeight: 600,
                color: ERP.colors.textSecondary, marginBottom: 8, fontFamily: F,
              }}>
                <span>快速匯入名單</span>
                <span style={{ color: ERP.colors.textMuted, fontWeight: 400 }}>Quick Import List</span>
                <span style={{
                  marginLeft: 4, padding: "1px 7px",
                  background: ERP.colors.amberLight,
                  border: `1px solid #FCD34D`,
                  borderRadius: ERP.radius.full,
                  fontSize: 10, fontWeight: 700, color: "#92400E",
                }}>
                  支援多格式 Multi-format
                </span>
              </label>

              {/* Fake "rich" textarea — lines rendered with ID highlighting */}
              <div style={{
                border: `2px solid ${parsed ? ERP.colors.success : ERP.colors.borderStrong}`,
                borderRadius: ERP.radius.lg,
                background: "#FAFBFC",
                overflow: "hidden",
                transition: "border-color 0.25s",
                boxShadow: parsed ? `0 0 0 3px ${ERP.colors.success}18` : "none",
              }}>
                {/* Textarea header bar */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "7px 14px",
                  background: "#F1F5F9",
                  borderBottom: `1px solid ${ERP.colors.border}`,
                  fontSize: 10, color: ERP.colors.textMuted, fontFamily: ERP.font.mono,
                }}>
                  <div style={{ display: "flex", gap: 5 }}>
                    {["#FF5F57","#FEBC2E","#28C840"].map(c => (
                      <div key={c} style={{ width: 9, height: 9, borderRadius: "50%", background: c }} />
                    ))}
                  </div>
                  <span style={{ marginLeft: 4 }}>{isMobile ? "paste_buffer" : "paste_buffer.txt"}</span>
                  <span style={{ marginLeft: "auto" }}>
                    {pasteText.split("\n").filter(Boolean).length} lines{!isMobile && " · UTF-8"}
                  </span>
                </div>

                {/* Lines */}
                <div style={{
                  padding: "14px 16px",
                  fontFamily: ERP.font.mono,
                  fontSize: 13,
                  minHeight: 110,
                }}>
                  {pasteText.split("\n").map((line, i) =>
                    line.trim() ? (
                      <ParsedLine key={i} line={line} />
                    ) : null
                  )}
                </div>

                {/* Placeholder overlay if empty */}
                {!pasteText.trim() && (
                  <div style={{
                    padding: "14px 16px",
                    color: ERP.colors.textDisabled,
                    fontSize: 13, fontFamily: ERP.font.mono,
                    pointerEvents: "none",
                  }}>
                    Paste student IDs, names, or email addresses from Excel/CSV...
                  </div>
                )}
              </div>

              {/* Format hints */}
              <div style={{
                marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap",
              }}>
                {[
                  "2023-F4A-05, 陳大明",
                  "chan.tai.ming@school.edu.hk",
                  "陳大明 F4A",
                ].map(hint => (
                  <span key={hint} style={{
                    padding: "2px 8px",
                    background: ERP.colors.pageBg,
                    border: `1px solid ${ERP.colors.border}`,
                    borderRadius: ERP.radius.sm,
                    fontSize: 10, fontFamily: ERP.font.mono,
                    color: ERP.colors.textMuted,
                  }}>
                    {hint}
                  </span>
                ))}
                <span style={{ fontSize: 10, color: ERP.colors.textMuted, fontFamily: F, alignSelf: "center" }}>
                  ...等格式均可識別
                </span>
              </div>
            </div>

            {/* Right: how-it-works diagram — desktop only */}
            {!isMobile && <div style={{
              width: 200, flexShrink: 0,
              background: ERP.colors.pageBg,
              border: `1px solid ${ERP.colors.border}`,
              borderRadius: ERP.radius.lg,
              padding: "14px 14px 12px",
            }}>
              <div style={{
                fontSize: 10, fontWeight: 700, color: ERP.colors.textMuted,
                letterSpacing: "0.07em", textTransform: "uppercase",
                marginBottom: 12, fontFamily: F,
              }}>
                跨班映射示意
              </div>

              {/* Source classes → group */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
                  {Object.entries(CLASS_PALETTE).map(([cls, pal]) => (
                    <div key={cls} style={{
                      display: "flex", alignItems: "center", gap: 5,
                      padding: "4px 8px",
                      background: pal.bg, border: `1px solid ${pal.border}`,
                      borderRadius: ERP.radius.sm,
                    }}>
                      <School size={10} color={pal.color} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: pal.color, fontFamily: F }}>
                        {cls}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Arrow */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  {[0,1,2,3].map(i => (
                    <ArrowRight key={i} size={12} color={ERP.colors.accent} strokeWidth={2} />
                  ))}
                </div>

                {/* Target group */}
                <div style={{
                  flex: 1,
                  padding: "12px 8px",
                  background: "linear-gradient(135deg, #EFF6FF, #EDE9FE)",
                  border: `1.5px solid #C7D2FE`,
                  borderRadius: ERP.radius.md,
                  textAlign: "center",
                }}>
                  <Users size={16} color={ERP.colors.accent} style={{ margin: "0 auto 4px" }} />
                  <div style={{ fontSize: 10, fontWeight: 700, color: ERP.colors.accent, fontFamily: F, lineHeight: 1.4 }}>
                    歷史選修<br />群組
                  </div>
                </div>
              </div>

              <div style={{
                marginTop: 10,
                fontSize: 10, color: ERP.colors.textMuted,
                fontFamily: F, lineHeight: 1.5, textAlign: "center",
              }}>
                原有行政班紀錄<br />完全不受影響
              </div>
            </div>}
          </div>

          {/* Action Row */}
          <div style={{
            marginTop: 16,
            display: "flex",
            flexDirection: isMobile ? "column" : "row" as const,
            alignItems: isMobile ? "stretch" : "center" as const,
            gap: 10,
            paddingTop: 14, borderTop: `1px dashed ${ERP.colors.border}`,
          }}>
            <button
              onMouseEnter={() => setHoverPaste(true)}
              onMouseLeave={() => setHoverPaste(false)}
              style={{
                height: 38, padding: "0 16px",
                border: `1.5px solid ${ERP.colors.borderStrong}`,
                borderRadius: ERP.radius.md,
                background: hoverPaste ? ERP.colors.pageBg : "#fff",
                fontSize: 13, fontWeight: 600,
                color: ERP.colors.textSecondary,
                cursor: "pointer", fontFamily: F,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                transition: "background 0.15s",
              }}
            >
              <ClipboardPaste size={14} />
              {isMobile ? "📋 貼上剪貼簿" : "📋 貼上剪貼簿內容 Paste from Clipboard"}
            </button>

            <button
              onClick={handleParse}
              onMouseEnter={() => setHoverParse(true)}
              onMouseLeave={() => setHoverParse(false)}
              style={{
                height: 38, padding: "0 20px",
                border: "none",
                borderRadius: ERP.radius.md,
                background: parsed
                  ? "linear-gradient(135deg, #059669, #16A34A)"
                  : hoverParse
                  ? "linear-gradient(135deg, #D97706, #F59E0B)"
                  : "linear-gradient(135deg, #EA580C 0%, #F59E0B 100%)",
                fontSize: 13, fontWeight: 700, color: "#fff",
                cursor: "pointer", fontFamily: F,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                boxShadow: parsed
                  ? "0 2px 8px rgba(5,150,105,0.28)"
                  : "0 2px 8px rgba(234,88,12,0.28)",
                animation: !parsed ? "parsePulse 2s infinite" : "none",
                transition: "background 0.18s",
              }}
            >
              {parsed ? <CheckCircle2 size={14} /> : <Zap size={14} />}
              {parsed ? "✅ 已完成解析" : isMobile ? "⚡ 智能解析" : "⚡ 系統智能解析 Parse Data"}
            </button>

            {!isMobile && (
              <span style={{ fontSize: 11, color: ERP.colors.textMuted, fontFamily: F }}>
                {parsed
                  ? "系統已從 4 個行政班中識別學生"
                  : "點擊以自動識別格式並比對學生資料庫"}
              </span>
            )}
          </div>
        </SectionCard>

        {/* ── Section 3: Parsed Result Preview ────────────────────────────── */}
        {parsed && (
          <SectionCard
            icon={<CheckCircle2 size={15} color={ERP.colors.success} />}
            title="解析結果預覽"
            subtitle="Section 3 · Parsed Result Preview — Cross-class Mapping"
            accent={ERP.colors.success}
            isMobile={isMobile}
          >
            {/* Success alert */}
            <div style={{
              display: "flex", alignItems: "flex-start", gap: 12,
              padding: "12px 16px",
              background: ERP.colors.successLight,
              border: `1.5px solid #6EE7B7`,
              borderRadius: ERP.radius.lg,
              marginBottom: 16,
            }}>
              <CheckCircle2 size={18} color={ERP.colors.success} style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 13, fontWeight: 700,
                  color: "#065F46", fontFamily: F,
                  marginBottom: 4,
                }}>
                  ✅ 成功識別 {PARSED.length} 名學生（Successfully parsed {PARSED.length} students）
                </div>
                <div style={{ fontSize: 12, color: "#047857", fontFamily: F }}>
                  系統已從 <strong>4 個不同行政班</strong>（F4A、F4B、F4C、F4D）中識別並核實所有學生，跨班群組建立就緒。
                  <span style={{ color: "#059669", marginLeft: 6 }}>
                    All students verified across 4 different administrative classes. Ready to create cross-class group.
                  </span>
                </div>
              </div>
              {/* Stats */}
              <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
                {[
                  { n: PARSED.length,    label: "已識別", sub: "Identified" },
                  { n: PARSED.length,    label: "已核實", sub: "Verified"   },
                  { n: Object.keys(PARSED.reduce((a,s) => ({...a,[s.cls]:1}),{})).length, label: "班別",   sub: "Classes"    },
                ].map(s => (
                  <div key={s.label} style={{
                    textAlign: "center", padding: "6px 12px",
                    background: "rgba(255,255,255,0.70)",
                    border: `1px solid #A7F3D0`,
                    borderRadius: ERP.radius.md,
                  }}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: ERP.colors.success, fontFamily: F }}>
                      {s.n}
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#065F46", fontFamily: F }}>{s.label}</div>
                    <div style={{ fontSize: 9, color: "#6EE7B7", fontFamily: F }}>{s.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cross-class distribution */}
            <div style={{
              marginBottom: 14, padding: "10px 14px",
              background: ERP.colors.pageBg,
              border: `1px solid ${ERP.colors.border}`,
              borderRadius: ERP.radius.md,
            }}>
              <CrossClassDistribution students={PARSED} />
            </div>

            {/* Table */}
            <div style={{
              border: `1px solid ${ERP.colors.border}`,
              borderRadius: ERP.radius.lg,
              overflow: "hidden",
            }}>
              {/* Table header */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "2fr 2fr 1.2fr 1.2fr",
                background: ERP.colors.pageBg,
                borderBottom: `1px solid ${ERP.colors.border}`,
              }}>
                {[
                  { zh: "姓名",    en: "Name"       },
                  { zh: "學號",    en: "Student ID"  },
                  { zh: "原行政班", en: "Admin Class" },
                  { zh: "狀態",    en: "Status"      },
                ].map(col => (
                  <div key={col.zh} style={{
                    padding: "10px 16px",
                    fontSize: 11, fontWeight: 700,
                    color: ERP.colors.textSecondary,
                    fontFamily: F,
                    letterSpacing: "0.03em",
                  }}>
                    {col.zh}
                    <span style={{ color: ERP.colors.textDisabled, fontWeight: 400, marginLeft: 4 }}>
                      {col.en}
                    </span>
                  </div>
                ))}
              </div>

              {/* Rows */}
              {PARSED.map((s, i) => {
                const pal = CLASS_PALETTE[s.cls] ?? { bg: "#F1F5F9", color: "#475569", border: "#CBD5E1" };
                return (
                  <div key={s.id} style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 2fr 1.2fr 1.2fr",
                    borderBottom: i < PARSED.length - 1 ? `1px solid ${ERP.colors.divider}` : "none",
                    background: i % 2 === 0 ? "#fff" : ERP.colors.pageBg,
                    transition: "background 0.12s",
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = ERP.colors.surfaceHover)}
                    onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? "#fff" : ERP.colors.pageBg)}
                  >
                    {/* Name */}
                    <div style={{
                      padding: "12px 16px",
                      display: "flex", alignItems: "center", gap: 9,
                    }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: "50%",
                        background: `linear-gradient(135deg, ${pal.color}22, ${pal.color}44)`,
                        border: `1.5px solid ${pal.border}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                      }}>
                        <span style={{
                          fontSize: 12, fontWeight: 800,
                          color: pal.color, fontFamily: F,
                        }}>
                          {s.name.charAt(0)}
                        </span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: ERP.colors.textPrimary, fontFamily: F }}>
                        {s.name}
                      </span>
                    </div>

                    {/* Student ID */}
                    <div style={{
                      padding: "12px 16px",
                      display: "flex", alignItems: "center",
                    }}>
                      <span style={{
                        fontFamily: ERP.font.mono, fontSize: 12,
                        color: ERP.colors.textSecondary,
                        background: ERP.colors.pageBg,
                        border: `1px solid ${ERP.colors.border}`,
                        padding: "2px 8px", borderRadius: ERP.radius.sm,
                      }}>
                        {s.rawId}
                      </span>
                    </div>

                    {/* Admin Class Badge */}
                    <div style={{
                      padding: "12px 16px",
                      display: "flex", alignItems: "center",
                    }}>
                      <div style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        padding: "4px 10px",
                        background: pal.bg,
                        border: `1.5px solid ${pal.border}`,
                        borderRadius: ERP.radius.full,
                      }}>
                        <div style={{
                          width: 6, height: 6, borderRadius: "50%",
                          background: pal.color, flexShrink: 0,
                        }} />
                        <span style={{ fontSize: 12, fontWeight: 800, color: pal.color, fontFamily: F }}>
                          {s.cls}
                        </span>
                      </div>
                    </div>

                    {/* Status */}
                    <div style={{
                      padding: "12px 16px",
                      display: "flex", alignItems: "center", gap: 6,
                    }}>
                      <div style={{
                        width: 8, height: 8, borderRadius: "50%",
                        background: ERP.colors.success,
                        boxShadow: `0 0 5px ${ERP.colors.success}80`,
                      }} />
                      <span style={{
                        fontSize: 12, fontWeight: 700,
                        color: ERP.colors.success, fontFamily: F,
                      }}>
                        🟢 已核實
                      </span>
                      <span style={{ fontSize: 11, color: ERP.colors.textMuted, fontFamily: F }}>
                        Verified
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom action hint */}
            <div style={{
              marginTop: 14, display: "flex", alignItems: "center",
              gap: 8, justifyContent: "flex-end",
            }}>
              <span style={{ fontSize: 12, color: ERP.colors.textMuted, fontFamily: F }}>
                確認名單無誤後，點擊右上方「💾 儲存並建立群組」以完成建立。
              </span>
              <button
                onClick={handleSave}
                style={{
                  height: 32, padding: "0 14px",
                  border: "none", borderRadius: ERP.radius.md,
                  background: saved
                    ? "linear-gradient(135deg, #059669, #16A34A)"
                    : "linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)",
                  fontSize: 12, fontWeight: 700, color: "#fff",
                  cursor: "pointer", fontFamily: F,
                  display: "flex", alignItems: "center", gap: 6,
                  boxShadow: "0 2px 6px rgba(37,99,235,0.25)",
                }}
              >
                {saved ? <CheckCircle2 size={13} /> : <Save size={13} />}
                {saved ? "已建立！" : "💾 立即建立群組"}
              </button>
            </div>
          </SectionCard>
        )}

        {/* ── Warning when not yet parsed ──────────────────────────────────── */}
        {!parsed && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "12px 16px",
            background: ERP.colors.amberLight,
            border: `1px solid #FCD34D`,
            borderRadius: ERP.radius.lg,
          }}>
            <AlertTriangle size={15} color="#D97706" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "#92400E", fontFamily: F }}>
              請先點擊「⚡ 系統智能解析 Parse Data」以識別學生名單，才可預覽及儲存群組。
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
