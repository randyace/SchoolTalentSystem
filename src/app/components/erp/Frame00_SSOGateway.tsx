// ─────────────────────────────────────────────────────────────────────────────
// Frame 0.0 — SSO Auth & Role Gateway (登入與權限中樞)
// Responsive: desktop split-screen + mobile single-column
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect } from "react";
import { GraduationCap, Users, BookOpen, UserCheck, ShieldCheck, Check } from "lucide-react";
import { ERP } from "./erpTokens";

type RoleId = "teacher" | "student" | "parent";

interface RoleOption {
  id:          RoleId;
  zhLabel:     string;
  enLabel:     string;
  icon:        React.ReactNode;
  description: string;
  accentColor: string;
}

const ROLE_OPTIONS: RoleOption[] = [
  { id: "teacher", zhLabel: "教職員", enLabel: "Teacher & Admin",
    icon: <Users size={20} />, description: "課堂記錄、成績管理、PBL 協作、行政管理",
    accentColor: ERP.colors.accent },
  { id: "student", zhLabel: "學生",   enLabel: "Student",
    icon: <BookOpen size={20} />, description: "成就上傳、同儕標注、學習歷程",
    accentColor: ERP.colors.teal },
  { id: "parent",  zhLabel: "家長",   enLabel: "Parent / Guardian",
    icon: <UserCheck size={20} />, description: "查閱子女成績、活動參與及成就記錄",
    accentColor: ERP.colors.purple },
];

// ── Viewport hook ─────────────────────────────────────────────────────────────
function useIsMobile(breakpoint = 768): boolean {
  const [mobile, setMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < breakpoint : false
  );
  useEffect(() => {
    const handler = () => setMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [breakpoint]);
  return mobile;
}

// ── Shared sub-components ─────────────────────────────────────────────────────
const GoogleLogo: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
    <path fill="#4285F4" d="M47.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h13.2c-.6 3-2.3 5.5-4.9 7.2v6h7.9c4.6-4.3 7.3-10.5 7.3-17.2z"/>
    <path fill="#34A853" d="M24 48c6.5 0 12-2.2 16-5.8l-7.9-6c-2.2 1.5-5 2.3-8.1 2.3-6.2 0-11.5-4.2-13.4-9.9H2.5v6.2C6.4 42.7 14.6 48 24 48z"/>
    <path fill="#FBBC05" d="M10.6 28.6c-.5-1.5-.8-3-.8-4.6s.3-3.1.8-4.6v-6.2H2.5C.9 16.6 0 20.2 0 24s.9 7.4 2.5 10.8l8.1-6.2z"/>
    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.8-6.8C35.9 2.3 30.4 0 24 0 14.6 0 6.4 5.3 2.5 13.2l8.1 6.2C12.5 13.7 17.8 9.5 24 9.5z"/>
  </svg>
);

const DotGrid: React.FC = () => (
  <div style={{
    position: "absolute", inset: 0,
    backgroundImage: "radial-gradient(rgba(255,255,255,0.07) 1.5px, transparent 1.5px)",
    backgroundSize: "28px 28px", pointerEvents: "none",
  }} />
);

// ── Desktop sub-components ────────────────────────────────────────────────────
const SSOButton: React.FC<{
  label: string; sublabel: string; textColor: string;
  borderColor: string; bgColor: string; logo: React.ReactNode;
}> = ({ label, sublabel, textColor, borderColor, bgColor, logo }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: 12,
        padding: "12px 20px",
        background: hovered ? bgColor + "ee" : bgColor,
        border: `1.5px solid ${hovered ? borderColor : borderColor + "80"}`,
        borderRadius: ERP.radius.md, cursor: "pointer",
        transition: "all 0.15s ease",
        transform: hovered ? "translateY(-1px)" : "none",
        boxShadow: hovered ? ERP.shadow.md : ERP.shadow.xs,
        fontFamily: ERP.font.family,
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: ERP.radius.sm, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {logo}
      </div>
      <div style={{ textAlign: "left" }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: textColor, lineHeight: 1.3 }}>{label}</div>
        <div style={{ fontSize: 11, color: textColor + "99", lineHeight: 1.3, marginTop: 1 }}>{sublabel}</div>
      </div>
    </button>
  );
};

const RoleCard: React.FC<{
  role: RoleOption; selected: boolean; onSelect: () => void;
}> = ({ role, selected, onSelect }) => {
  const [hovered, setHovered] = useState(false);
  const active = selected || hovered;
  return (
    <button
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
        padding: "14px 8px",
        background: selected ? role.accentColor + "10" : hovered ? "#F8FAFC" : ERP.colors.surface,
        border: `1.5px solid ${selected ? role.accentColor : active ? role.accentColor + "60" : ERP.colors.border}`,
        borderRadius: ERP.radius.md, cursor: "pointer",
        transition: "all 0.15s ease", position: "relative",
        fontFamily: ERP.font.family,
        boxShadow: selected ? `0 0 0 3px ${role.accentColor}20` : "none",
      }}
    >
      {selected && (
        <div style={{
          position: "absolute", top: 6, right: 6,
          width: 16, height: 16, background: role.accentColor,
          borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Check size={10} color="#fff" strokeWidth={3} />
        </div>
      )}
      <div style={{
        width: 40, height: 40, borderRadius: ERP.radius.md,
        background: selected ? role.accentColor : `${role.accentColor}15`,
        color: selected ? "#fff" : role.accentColor,
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 8, transition: "all 0.15s",
      }}>
        {role.icon}
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: selected ? role.accentColor : ERP.colors.textPrimary, marginBottom: 2 }}>
        {role.zhLabel}
      </div>
      <div style={{ fontSize: 10, color: ERP.colors.textMuted, textAlign: "center", lineHeight: 1.4 }}>
        {role.enLabel}
      </div>
    </button>
  );
};

// ── Mobile-only: Segmented Control ────────────────────────────────────────────
const SegmentedControl: React.FC<{
  selected:   RoleId;
  onSelect:   (id: RoleId) => void;
}> = ({ selected, onSelect }) => (
  <div style={{
    display: "flex",
    background: "#EEF2F7",
    borderRadius: ERP.radius.full,
    padding: 3,
    height: 44,
    gap: 2,
  }}>
    {ROLE_OPTIONS.map(role => {
      const active = selected === role.id;
      return (
        <button
          key={role.id}
          onClick={() => onSelect(role.id)}
          style={{
            flex: 1,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            background: active ? "#FFFFFF" : "transparent",
            borderRadius: ERP.radius.full,
            border: "none",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: active ? 700 : 500,
            color: active ? ERP.colors.textPrimary : ERP.colors.textMuted,
            fontFamily: ERP.font.family,
            boxShadow: active ? "0 1px 4px rgba(0,0,0,0.13), 0 0 0 0.5px rgba(0,0,0,0.04)" : "none",
            transition: "all 0.18s ease",
            whiteSpace: "nowrap",
          }}
        >
          {active && (
            <span style={{ color: role.accentColor, display: "flex", alignItems: "center" }}>
              {React.cloneElement(role.icon as React.ReactElement, { size: 13 })}
            </span>
          )}
          {role.zhLabel}
        </button>
      );
    })}
  </div>
);

// ── Main Export ───────────────────────────────────────────────────────────────
interface Frame00Props {
  onPortalSelect?: (portal: "teacher" | "student" | "parent") => void;
}

export const Frame00_SSOGateway: React.FC<Frame00Props> = ({ onPortalSelect }) => {
  const [selectedRole, setSelectedRole] = useState<RoleId>("teacher");
  const isMobile = useIsMobile();

  // ── MOBILE LAYOUT ──────────────────────────────────────────────────────────
  if (isMobile) {
    const activeRole = ROLE_OPTIONS.find(r => r.id === selectedRole)!;
    return (
      <div style={{
        display: "flex", flexDirection: "column",
        height: "100dvh",          // dvh = dynamic viewport height (handles mobile chrome)
        width: "100%",
        fontFamily: ERP.font.family,
        background: "#F8FAFC",
        overflow: "hidden",        // no bounce scroll on outer container
      }}>

        {/* ── Compact Branding Header (~120px) ─────────────────────────── */}
        <div style={{
          flexShrink: 0,
          height: 120,
          background: "linear-gradient(160deg, #060E1C 0%, #0C1D3A 50%, #122B58 100%)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          gap: 8, position: "relative", overflow: "hidden",
          padding: "0 24px",
        }}>
          <DotGrid />
          {/* Subtle glow */}
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%,-50%)",
            width: 200, height: 200,
            background: "radial-gradient(circle, rgba(37,99,235,0.2) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />
          {/* Logo + Name row */}
          <div style={{
            position: "relative", zIndex: 1,
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: "50%",
              background: "linear-gradient(135deg, #1D4ED8 0%, #2563EB 60%, #3B82F6 100%)",
              border: "1.5px solid rgba(255,255,255,0.15)",
              boxShadow: "0 0 0 4px rgba(37,99,235,0.15), 0 4px 12px rgba(0,0,0,0.4)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <GraduationCap size={22} color="#fff" strokeWidth={1.5} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#F8FAFC", lineHeight: 1.2 }}>
                Stewards Pooi Tun Secondary School
              </div>
              <div style={{ fontSize: 12, color: "#93C5FD", marginTop: 2 }}>
                香港神託會培敦中學
              </div>
            </div>
          </div>
          {/* LALP pill */}
          <div style={{
            position: "relative", zIndex: 1,
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "rgba(37,99,235,0.22)",
            border: "1px solid rgba(59,130,246,0.35)",
            borderRadius: ERP.radius.full,
            padding: "3px 12px",
          }}>
            <div style={{
              width: 5, height: 5, borderRadius: "50%",
              background: "#60A5FA", boxShadow: "0 0 5px #60A5FA",
            }} />
            <span style={{ fontSize: 10, color: "#BFDBFE", letterSpacing: "0.06em" }}>
              Local Adaptive Learning Platform
            </span>
          </div>
        </div>

        {/* ── Login Form (fills remaining height, no scroll) ────────────── */}
        <div style={{
          flex: 1, minHeight: 0,
          display: "flex", flexDirection: "column",
          padding: "28px 24px 24px",
          background: "#FFFFFF",
          // Safe area inset for devices with home indicator
          paddingBottom: "max(24px, env(safe-area-inset-bottom, 24px))",
        }}>

          {/* Title */}
          <div style={{ marginBottom: 20 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              background: ERP.colors.accentPale, border: `1px solid ${ERP.colors.accentLight}`,
              borderRadius: ERP.radius.full, padding: "3px 10px", marginBottom: 10,
            }}>
              <ShieldCheck size={11} color={ERP.colors.accent} />
              <span style={{ fontSize: 10, fontWeight: 700, color: ERP.colors.accent, letterSpacing: "0.06em" }}>
                ERP 管理後台 · SSO 單一登入
              </span>
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: ERP.colors.textPrimary, lineHeight: 1.25 }}>
              登入您的帳戶
            </div>
          </div>

          {/* Google SSO Button */}
          <button style={{
            width: "100%", height: 48,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            background: "#FFFFFF",
            border: `1.5px solid #E5E7EB`,
            borderRadius: ERP.radius.md,
            cursor: "pointer", fontFamily: ERP.font.family,
            fontSize: 14, fontWeight: 600, color: "#1F2937",
            boxShadow: ERP.shadow.sm,
            marginBottom: 20,
          }}>
            <GoogleLogo />
            以 Google Workspace 登入
          </button>

          {/* Divider */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10, marginBottom: 16,
          }}>
            <div style={{ flex: 1, height: 1, background: ERP.colors.border }} />
            <span style={{ fontSize: 11, color: ERP.colors.textMuted, whiteSpace: "nowrap" }}>
              或選擇工作身份
            </span>
            <div style={{ flex: 1, height: 1, background: ERP.colors.border }} />
          </div>

          {/* Role label */}
          <div style={{
            fontSize: 11, fontWeight: 700, color: ERP.colors.textSecondary,
            letterSpacing: "0.06em", textTransform: "uppercase",
            marginBottom: 8,
          }}>
            選擇工作身份 · Role
          </div>

          {/* Segmented Control — replaces the 3 vertical cards */}
          <SegmentedControl selected={selectedRole} onSelect={setSelectedRole} />

          {/* Active role accent strip — one-liner hint, no bulky card */}
          <div style={{
            marginTop: 10, marginBottom: 24,
            display: "flex", alignItems: "center", gap: 8,
            padding: "8px 12px",
            background: activeRole.accentColor + "0D",
            border: `1px solid ${activeRole.accentColor}30`,
            borderRadius: ERP.radius.md,
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: ERP.radius.sm,
              background: activeRole.accentColor + "20",
              color: activeRole.accentColor,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              {React.cloneElement(activeRole.icon as React.ReactElement, { size: 15 })}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: ERP.colors.textPrimary }}>
                {activeRole.zhLabel} · {activeRole.enLabel}
              </div>
              <div style={{
                fontSize: 11, color: ERP.colors.textMuted,
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>
                {activeRole.description}
              </div>
            </div>
          </div>

          {/* Spacer pushes button + footer to lower portion */}
          <div style={{ flex: 1 }} />

          {/* Continue Button — primary CTA, 52px, always visible */}
          <button
            onClick={() => onPortalSelect?.(selectedRole)}
            style={{
              width: "100%", height: 52,
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: 8,
              background: `linear-gradient(135deg, ${ERP.colors.accent}, ${ERP.colors.accentDark})`,
              border: "none", borderRadius: ERP.radius.md,
              fontSize: 16, fontWeight: 700, color: "#fff",
              cursor: "pointer", fontFamily: ERP.font.family,
              letterSpacing: "0.02em",
              boxShadow: `0 4px 16px ${ERP.colors.accent}55`,
              marginBottom: 16,
            }}
          >
            繼續登入
            <span style={{ fontSize: 13, fontWeight: 400, opacity: 0.85 }}>/ Continue</span>
          </button>

          {/* Footer — PDPO statement */}
          <div style={{
            textAlign: "center", fontSize: 11,
            color: ERP.colors.textMuted, lineHeight: 1.6,
          }}>
            登入即代表同意學校個人資料收集聲明<br />
            <span style={{ color: ERP.colors.textDisabled }}>
              Personal Data Collection Statement · PDPO 2025
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ── DESKTOP LAYOUT (unchanged) ─────────────────────────────────────────────
  return (
    <div style={{
      display: "flex", height: "100vh", width: "100%",
      fontFamily: ERP.font.family, overflow: "hidden",
    }}>

      {/* LEFT: School Branding Panel */}
      <div style={{
        flex: "0 0 52%",
        background: "linear-gradient(160deg, #060E1C 0%, #0C1D3A 40%, #122B58 75%, #1A3A72 100%)",
        display: "flex", flexDirection: "column",
        justifyContent: "center", alignItems: "center",
        position: "relative", overflow: "hidden", padding: 48,
      }}>
        <DotGrid />
        <div style={{
          position: "absolute", top: "35%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: 360, height: 360,
          background: "radial-gradient(circle, rgba(37,99,235,0.18) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{
            width: 96, height: 96, borderRadius: "50%",
            border: "2px solid rgba(255,255,255,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "linear-gradient(135deg, #1D4ED8 0%, #2563EB 60%, #3B82F6 100%)",
            boxShadow: "0 0 0 6px rgba(37,99,235,0.12), 0 8px 32px rgba(0,0,0,0.4)",
            marginBottom: 28,
          }}>
            <GraduationCap size={44} color="#fff" strokeWidth={1.5} />
          </div>
          <div style={{ textAlign: "center", maxWidth: 360 }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: "#F8FAFC", lineHeight: 1.25, letterSpacing: "0.01em" }}>
              Stewards Pooi Tun
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: "#F8FAFC", lineHeight: 1.25, letterSpacing: "0.01em", marginBottom: 10 }}>
              Secondary School
            </div>
            <div style={{ fontSize: 17, fontWeight: 500, color: "#93C5FD", letterSpacing: "0.04em", marginBottom: 20 }}>
              香港神託會培敦中學
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.15)" }} />
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                est. 1968
              </div>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.15)" }} />
            </div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "rgba(37,99,235,0.25)", border: "1px solid rgba(59,130,246,0.4)",
              borderRadius: ERP.radius.full, padding: "6px 16px",
            }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#60A5FA", boxShadow: "0 0 6px #60A5FA" }} />
              <span style={{ fontSize: 12, color: "#BFDBFE", letterSpacing: "0.06em" }}>
                Local Adaptive Learning Platform
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 24, marginTop: 48 }}>
            {[
              { label: "學年", value: "2025/26" },
              { label: "學期", value: "第二學期" },
              { label: "班別", value: "F1–F6" },
            ].map(item => (
              <div key={item.label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#BFDBFE" }}>{item.value}</div>
                <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{
          position: "absolute", bottom: 24,
          fontSize: 11, color: "#334155", letterSpacing: "0.04em", zIndex: 1,
        }}>
          LALP Framework v3.0 · 教育局認可系統
        </div>
      </div>

      {/* RIGHT: Login Panel */}
      <div style={{
        flex: 1, background: "#FAFBFC",
        display: "flex", flexDirection: "column",
        justifyContent: "center", alignItems: "center",
        padding: "40px 48px", overflowY: "auto",
      }}>
        <div style={{ width: "100%", maxWidth: 380 }}>

          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: ERP.colors.accentPale, border: `1px solid ${ERP.colors.accentLight}`,
            borderRadius: ERP.radius.full, padding: "4px 12px", marginBottom: 20,
          }}>
            <ShieldCheck size={12} color={ERP.colors.accent} />
            <span style={{ fontSize: 11, fontWeight: 700, color: ERP.colors.accent, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              ERP 管理後台 · 單一登入入口
            </span>
          </div>

          <div style={{ fontSize: 26, fontWeight: 700, color: ERP.colors.textPrimary, lineHeight: 1.2, marginBottom: 6 }}>
            登入您的帳戶
          </div>
          <div style={{ fontSize: 14, color: ERP.colors.textSecondary, marginBottom: 28, lineHeight: 1.5 }}>
            選擇學校身份驗證方式繼續。本系統受 PDPO 第 4 條款保護。
          </div>

          <div style={{ marginBottom: 24 }}>
            <SSOButton
              label="以 Google Workspace 登入"
              sublabel="學校 G Suite 帳戶 · @sptss.edu.hk"
              bgColor="#FFFFFF" textColor="#1F2937" borderColor="#E5E7EB"
              logo={<GoogleLogo />}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <div style={{ flex: 1, height: 1, background: ERP.colors.border }} />
            <span style={{ fontSize: 12, color: ERP.colors.textMuted, whiteSpace: "nowrap" }}>或選擇工作身份</span>
            <div style={{ flex: 1, height: 1, background: ERP.colors.border }} />
          </div>

          <div style={{ marginBottom: 28 }}>
            <div style={{
              fontSize: 12, fontWeight: 700, color: ERP.colors.textSecondary,
              letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10,
            }}>
              選擇工作身份 (Role Switch)
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              {ROLE_OPTIONS.map(role => (
                <RoleCard
                  key={role.id} role={role}
                  selected={selectedRole === role.id}
                  onSelect={() => setSelectedRole(role.id)}
                />
              ))}
            </div>
            <div style={{
              marginTop: 10, padding: "8px 12px",
              background: ERP.colors.accentPale, borderRadius: ERP.radius.sm,
              borderLeft: `3px solid ${ERP.colors.accent}`,
              fontSize: 12, color: ERP.colors.textSecondary,
            }}>
              {ROLE_OPTIONS.find(r => r.id === selectedRole)?.description}
            </div>
          </div>

          <button
            onClick={() => onPortalSelect?.(selectedRole)}
            style={{
              width: "100%", padding: "13px 24px",
              background: `linear-gradient(135deg, ${ERP.colors.accent}, ${ERP.colors.accentDark})`,
              border: "none", borderRadius: ERP.radius.md,
              fontSize: 15, fontWeight: 700, color: "#fff",
              cursor: "pointer", fontFamily: ERP.font.family,
              letterSpacing: "0.02em",
              boxShadow: `0 4px 14px ${ERP.colors.accent}50`,
            }}
          >
            繼續登入 / Continue
          </button>

          <div style={{
            marginTop: 24, textAlign: "center",
            fontSize: 11, color: ERP.colors.textMuted, lineHeight: 1.6,
          }}>
            登入即代表同意學校的個人資料收集聲明<br />
            Personal Data Collection Statement · PDPO 2025
          </div>
        </div>
      </div>
    </div>
  );
};
