// ─────────────────────────────────────────────────────────────────────────────
// Screen_QRSignIn.tsx
// 現場活動 QR Code 無縫簽到 — Continuous QR Sign-in  (Showcase Screen)
// Target: Mobile / iPad portrait  · ERP Tender Module 1.D.QR
//
// Design spec:
//   • Full-screen simulated camera view (dark, bokeh, reticle)
//   • No blocking modals — float-toast only feedback
//   • Auto-demo cycles 5 remaining students, ~2.4 s/student
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect } from "react";
import {
  ArrowLeft, Flashlight, FlashlightOff, Keyboard, CheckCircle2,
  ScanQrCode, Vibrate, X, Delete,
} from "lucide-react";

// ── Demo data ─────────────────────────────────────────────────────────────────
const TOTAL = 50;
const INITIAL_SIGNED = 45;
const EVENT_TITLE = "中一級科學環保專題";
const EVENT_SUBTITLE = "集合點名";

const DEMO_QUEUE = [
  { name: "陳大文", classLabel: "F1A-01", id: "2025-F1A-001" },
  { name: "林詩雅", classLabel: "F1A-02", id: "2025-F1A-002" },
  { name: "黃志豪", classLabel: "F1B-03", id: "2025-F1B-003" },
  { name: "鄭美琪", classLabel: "F1A-04", id: "2025-F1A-004" },
  { name: "李建國", classLabel: "F1B-05", id: "2025-F1B-005" },
];

type ScanPhase = "idle" | "scanning" | "success";

// ── Inline QR code SVG (decorative — represents a real QR code visually) ─────
const MockQR: React.FC<{ dimmed?: boolean }> = ({ dimmed = false }) => (
  <svg width="88" height="88" viewBox="0 0 11 11" style={{ opacity: dimmed ? 0.18 : 0.9, display: "block" }}>
    <rect width="11" height="11" fill="white" />
    {/* top-left finder */}
    <rect x="1" y="1" width="3" height="3" fill="black" />
    <rect x="1.5" y="1.5" width="2" height="2" fill="white" />
    <rect x="2" y="2" width="1" height="1" fill="black" />
    {/* top-right finder */}
    <rect x="7" y="1" width="3" height="3" fill="black" />
    <rect x="7.5" y="1.5" width="2" height="2" fill="white" />
    <rect x="8" y="2" width="1" height="1" fill="black" />
    {/* bottom-left finder */}
    <rect x="1" y="7" width="3" height="3" fill="black" />
    <rect x="1.5" y="7.5" width="2" height="2" fill="white" />
    <rect x="2" y="8" width="1" height="1" fill="black" />
    {/* data modules */}
    <rect x="5" y="1" width="1" height="1" fill="black" />
    <rect x="5" y="3" width="1" height="1" fill="black" />
    <rect x="7" y="5" width="1" height="1" fill="black" />
    <rect x="5" y="5" width="2" height="1" fill="black" />
    <rect x="1" y="5" width="1" height="2" fill="black" />
    <rect x="3" y="5" width="1" height="1" fill="black" />
    <rect x="5" y="7" width="1" height="1" fill="black" />
    <rect x="7" y="7" width="1" height="2" fill="black" />
    <rect x="9" y="7" width="1" height="1" fill="black" />
    <rect x="9" y="9" width="1" height="1" fill="black" />
    <rect x="7" y="9" width="1" height="1" fill="black" />
    <rect x="5" y="9" width="2" height="1" fill="black" />
    <rect x="3" y="9" width="1" height="1" fill="black" />
    <rect x="3" y="7" width="1" height="1" fill="black" />
  </svg>
);

// ── Number pad for manual entry ────────────────────────────────────────────────
const NUMPAD = ["1","2","3","4","5","6","7","8","9","*","0","⌫"];

// ── Main Component ─────────────────────────────────────────────────────────────
export const Screen_QRSignIn: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [signedCount, setSignedCount] = useState(INITIAL_SIGNED);
  const [phase, setPhase] = useState<ScanPhase>("idle");
  const [toastStudent, setToastStudent] = useState<typeof DEMO_QUEUE[0] | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [manualConfirmed, setManualConfirmed] = useState(false);
  const [demoIdx, setDemoIdx] = useState(0);
  const [successPulse, setSuccessPulse] = useState(false);

  // ── Auto-demo: cycles through DEMO_QUEUE ────────────────────────────────────
  useEffect(() => {
    if (demoIdx >= DEMO_QUEUE.length) return;
    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(setTimeout(() => setPhase("scanning"), 500));
    timers.push(setTimeout(() => {
      setPhase("success");
      setSuccessPulse(true);
      const student = DEMO_QUEUE[demoIdx];
      setToastStudent(student);
      setToastVisible(true);
      setSignedCount(c => c + 1);
    }, 1700));
    timers.push(setTimeout(() => { setPhase("idle"); setSuccessPulse(false); }, 2300));
    timers.push(setTimeout(() => setToastVisible(false), 3400));
    timers.push(setTimeout(() => setDemoIdx(i => i + 1), 2700));

    return () => timers.forEach(clearTimeout);
  }, [demoIdx]);

  // ── Manual entry confirm ─────────────────────────────────────────────────────
  const handleNumpad = (key: string) => {
    if (key === "⌫") { setManualInput(v => v.slice(0, -1)); return; }
    if (key === "*") return;
    if (manualInput.length < 12) setManualInput(v => v + key);
  };

  const handleManualConfirm = () => {
    if (!manualInput) return;
    setManualConfirmed(true);
    setShowManual(false);
    const mockStudent = { name: "手動 — " + manualInput, classLabel: "Manual", id: manualInput };
    setToastStudent(mockStudent);
    setToastVisible(true);
    setSignedCount(c => Math.min(c + 1, TOTAL));
    setTimeout(() => { setToastVisible(false); setManualConfirmed(false); setManualInput(""); }, 3000);
  };

  // ── Reticle corner color ─────────────────────────────────────────────────────
  const cornerColor = phase === "success" ? "#10B981" : phase === "scanning" ? "#F59E0B" : "rgba(255,255,255,0.85)";
  const cornerGlow  = phase === "success" ? "0 0 12px #10B981" : phase === "scanning" ? "0 0 10px #F59E0B88" : "none";
  const progress = Math.round((signedCount / TOTAL) * 100);

  return (
    <div style={{
      width: "100%", height: "100vh",
      background: "#000",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif",
      overflow: "hidden",
    }}>

      {/* ── Injected keyframe animations ──────────────────────────────────── */}
      <style>{`
        @keyframes scanLine {
          0%   { top: 6%;  opacity: 1; }
          48%  { top: 90%; opacity: 0.85; }
          50%  { top: 90%; opacity: 0.85; }
          98%  { top: 6%;  opacity: 1; }
          100% { top: 6%;  opacity: 1; }
        }
        @keyframes toastIn {
          from { transform: translateX(-50%) translateY(20px); opacity: 0; }
          to   { transform: translateX(-50%) translateY(0px);  opacity: 1; }
        }
        @keyframes toastOut {
          from { transform: translateX(-50%) translateY(0px);  opacity: 1; }
          to   { transform: translateX(-50%) translateY(-14px); opacity: 0; }
        }
        @keyframes hapticBounce {
          0%,100% { transform: scale(1)    rotate(0deg);  }
          20%     { transform: scale(1.25) rotate(-8deg); }
          40%     { transform: scale(1.20) rotate(6deg);  }
          60%     { transform: scale(1.15) rotate(-4deg); }
          80%     { transform: scale(1.10) rotate(2deg);  }
        }
        @keyframes successPulse {
          0%   { transform: translate(-50%,-50%) scale(0.5); opacity: 0.7; }
          100% { transform: translate(-50%,-50%) scale(2.8); opacity: 0;   }
        }
        @keyframes reticleFadeIn {
          from { opacity: 0; transform: scale(0.92); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes counterPop {
          0%   { transform: scale(1); }
          40%  { transform: scale(1.30); }
          100% { transform: scale(1); }
        }
        @keyframes flashPulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(255,255,255,0); }
          50%     { box-shadow: 0 0 0 6px rgba(255,255,255,0.15); }
        }
        @keyframes bokehFloat1 {
          0%,100% { transform: translateY(0px); }
          50%     { transform: translateY(-18px); }
        }
        @keyframes bokehFloat2 {
          0%,100% { transform: translateY(0px); }
          50%     { transform: translateY(14px); }
        }
      `}</style>

      {/* ══════════════════════════════════════════════════════════════════════
          PHONE FRAME — centered on desktop, full-screen on mobile
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{
        position: "relative",
        width: "min(420px, 100vw)",
        height: "min(900px, 100vh)",
        maxHeight: "100vh",
        overflow: "hidden",
        borderRadius: "min(48px, 0px)",
        boxShadow: "0 32px 80px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.08)",
      }}>

        {/* ──────────────────────────────────────────────────────────────────
            LAYER 0: SIMULATED CAMERA BACKGROUND
        ────────────────────────────────────────────────────────────────── */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg, #05080F 0%, #0B1120 35%, #0E1829 70%, #0A1020 100%)",
        }}>
          {/* Ambient bokeh lights — simulates classroom background */}
          <div style={{ position: "absolute", top: "8%",  left: "12%",  width: 160, height: 160, borderRadius: "50%", background: "radial-gradient(circle, rgba(63,120,246,0.14) 0%, transparent 70%)", filter: "blur(24px)", animation: "bokehFloat1 8s ease-in-out infinite" }} />
          <div style={{ position: "absolute", top: "15%", right: "8%",  width: 120, height: 120, borderRadius: "50%", background: "radial-gradient(circle, rgba(245,158,11,0.10) 0%, transparent 70%)",  filter: "blur(20px)", animation: "bokehFloat2 6s ease-in-out infinite" }} />
          <div style={{ position: "absolute", top: "60%", left: "5%",   width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)", filter: "blur(28px)", animation: "bokehFloat2 10s ease-in-out infinite" }} />
          <div style={{ position: "absolute", top: "55%", right: "3%",  width: 140, height: 140, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.09) 0%, transparent 70%)", filter: "blur(22px)", animation: "bokehFloat1 7s ease-in-out infinite" }} />
          <div style={{ position: "absolute", bottom: "18%", left: "25%", width: 100, height: 100, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.11) 0%, transparent 70%)", filter: "blur(16px)" }} />

          {/* Very faint horizontal scan lines (CRT feel) */}
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.012) 3px, rgba(255,255,255,0.012) 4px)",
            pointerEvents: "none",
          }} />

          {/* Vignette overlay */}
          <div style={{
            position: "absolute", inset: 0,
            background: "radial-gradient(ellipse at 50% 50%, transparent 42%, rgba(0,0,0,0.68) 100%)",
            pointerEvents: "none",
          }} />

          {/* Flashlight highlight overlay */}
          {flashOn && (
            <div style={{
              position: "absolute", inset: 0,
              background: "radial-gradient(ellipse at 50% 38%, rgba(255,255,240,0.18) 0%, transparent 62%)",
              pointerEvents: "none",
            }} />
          )}
        </div>

        {/* ──────────────────────────────────────────────────────────────────
            LAYER 1: TOP HEADER OVERLAY
        ────────────────────────────────────────────────────────────────── */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, zIndex: 50,
          background: "linear-gradient(180deg, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.60) 80%, transparent 100%)",
          backdropFilter: "blur(0px)",
          padding: "14px 18px 28px",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          {/* Back button */}
          <button
            onClick={onBack}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.18)",
              borderRadius: 999, color: "#fff", fontSize: 12, fontWeight: 600,
              padding: "7px 13px", cursor: "pointer", backdropFilter: "blur(10px)",
              flexShrink: 0, whiteSpace: "nowrap",
            }}
          >
            <ArrowLeft size={13} /> 結束簽到
          </button>

          {/* Event title — center */}
          <div style={{ flex: 1, textAlign: "center", minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#F8FAFC", letterSpacing: "-0.2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {EVENT_TITLE}
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", marginTop: 1 }}>{EVENT_SUBTITLE}</div>
          </div>

          {/* Counter chip */}
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            background: "rgba(0,0,0,0.50)", border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 12, padding: "6px 12px", flexShrink: 0,
            backdropFilter: "blur(10px)",
          }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
              <span style={{
                fontSize: 20, fontWeight: 900, color: "#10B981", lineHeight: 1,
                animation: phase === "success" ? "counterPop 0.35s ease-out" : "none",
              }}>
                {signedCount}
              </span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 500 }}> / {TOTAL}</span>
            </div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.45)", marginTop: 1, letterSpacing: "0.04em" }}>已簽到</div>
          </div>
        </div>

        {/* ──────────────────────────────────────────────────────────────────
            LAYER 2: PROGRESS BAR (thin, under header)
        ────────────────────────────────────────────────────────────────── */}
        <div style={{ position: "absolute", top: 74, left: 0, right: 0, zIndex: 49, height: 3, background: "rgba(255,255,255,0.06)" }}>
          <div style={{
            height: "100%", width: `${progress}%`,
            background: "linear-gradient(90deg, #059669, #10B981)",
            transition: "width 0.5s ease",
            boxShadow: "0 0 8px #10B98180",
          }} />
        </div>

        {/* ──────────────────────────────────────────────────────────────────
            LAYER 3: QR RETICLE (center of screen)
        ────────────────────────────────────────────────────────────────── */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 20,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            position: "relative",
            width: 220, height: 220,
            animation: "reticleFadeIn 0.5s ease-out",
          }}>
            {/* Subtle dark tint inside reticle */}
            <div style={{
              position: "absolute", inset: 0,
              background: phase === "success"
                ? "rgba(16,185,129,0.08)"
                : "rgba(255,255,255,0.025)",
              borderRadius: 8,
              transition: "background 0.25s",
            }} />

            {/* Success pulse ring */}
            {successPulse && (
              <div style={{
                position: "absolute",
                top: "50%", left: "50%",
                width: 220, height: 220,
                borderRadius: 8,
                border: "3px solid #10B981",
                animation: "successPulse 0.7s ease-out forwards",
                pointerEvents: "none",
              }} />
            )}

            {/* QR code visual — appears during scanning/success */}
            <div style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              opacity: phase === "idle" ? 0 : 1,
              transition: "opacity 0.3s",
              borderRadius: 6, overflow: "hidden",
              boxShadow: phase === "success" ? "0 0 20px #10B98144" : "none",
            }}>
              <MockQR />
            </div>

            {/* ── Corner Brackets ─────────────────────────────────────────── */}
            {/* Top-left */}
            <svg style={{ position: "absolute", top: -2, left: -2, filter: cornerGlow !== "none" ? `drop-shadow(0 0 6px ${cornerColor})` : "none", transition: "all 0.25s" }} width="36" height="36" viewBox="0 0 36 36"><path d="M2 22 L2 2 L22 2" fill="none" stroke={cornerColor} strokeWidth="3.5" strokeLinecap="round" style={{ transition: "stroke 0.25s" }} /></svg>
            {/* Top-right */}
            <svg style={{ position: "absolute", top: -2, right: -2, filter: cornerGlow !== "none" ? `drop-shadow(0 0 6px ${cornerColor})` : "none", transition: "all 0.25s" }} width="36" height="36" viewBox="0 0 36 36"><path d="M14 2 L34 2 L34 22" fill="none" stroke={cornerColor} strokeWidth="3.5" strokeLinecap="round" style={{ transition: "stroke 0.25s" }} /></svg>
            {/* Bottom-left */}
            <svg style={{ position: "absolute", bottom: -2, left: -2, filter: cornerGlow !== "none" ? `drop-shadow(0 0 6px ${cornerColor})` : "none", transition: "all 0.25s" }} width="36" height="36" viewBox="0 0 36 36"><path d="M2 14 L2 34 L22 34" fill="none" stroke={cornerColor} strokeWidth="3.5" strokeLinecap="round" style={{ transition: "stroke 0.25s" }} /></svg>
            {/* Bottom-right */}
            <svg style={{ position: "absolute", bottom: -2, right: -2, filter: cornerGlow !== "none" ? `drop-shadow(0 0 6px ${cornerColor})` : "none", transition: "all 0.25s" }} width="36" height="36" viewBox="0 0 36 36"><path d="M34 14 L34 34 L14 34" fill="none" stroke={cornerColor} strokeWidth="3.5" strokeLinecap="round" style={{ transition: "stroke 0.25s" }} /></svg>

            {/* ── Scanning laser line ──────────────────────────────────────── */}
            {phase === "scanning" && (
              <div style={{
                position: "absolute", left: 8, right: 8,
                height: 2,
                background: "linear-gradient(90deg, transparent 0%, #F59E0B 15%, #FCD34D 50%, #F59E0B 85%, transparent 100%)",
                borderRadius: 2,
                boxShadow: "0 0 10px #F59E0B, 0 0 24px #F59E0B66",
                animation: "scanLine 1.4s linear infinite",
              }} />
            )}

            {/* ── Success checkmark ────────────────────────────────────────── */}
            {phase === "success" && (
              <div style={{
                position: "absolute", top: "50%", left: "50%",
                transform: "translate(-50%, -50%)",
                background: "rgba(16,185,129,0.18)", borderRadius: "50%",
                width: 56, height: 56,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <CheckCircle2 size={32} color="#10B981" />
              </div>
            )}
          </div>
        </div>

        {/* ──────────────────────────────────────────────────────────────────
            LAYER 4: SCAN STATUS HINT (below reticle)
        ────────────────────────────────────────────────────────────────── */}
        <div style={{
          position: "absolute", left: 0, right: 0, zIndex: 21,
          top: "calc(50% + 130px)",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
        }}>
          <div style={{
            fontSize: 12, fontWeight: 600,
            color: phase === "success" ? "#10B981" : phase === "scanning" ? "#F59E0B" : "rgba(255,255,255,0.55)",
            transition: "color 0.25s",
          }}>
            {phase === "success" ? "✅ 簽到成功" : phase === "scanning" ? "⚡ 偵測中…" : "請將 QR Code 對準框內"}
          </div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.28)" }}>
            {phase === "idle" ? "Align QR Code within the frame" : phase === "scanning" ? "Detecting…" : "Checked In"}
          </div>
        </div>

        {/* ──────────────────────────────────────────────────────────────────
            LAYER 5: FLOATING TOAST NOTIFICATION (non-blocking)
        ────────────────────────────────────────────────────────────────── */}
        {toastVisible && toastStudent && (
          <div style={{
            position: "absolute", bottom: 108, left: "50%",
            transform: "translateX(-50%)",
            zIndex: 80,
            animation: `toastIn 0.32s cubic-bezier(0.34,1.56,0.64,1) forwards`,
            whiteSpace: "nowrap",
          }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              background: "linear-gradient(135deg, #065F46 0%, #047857 100%)",
              border: "1px solid rgba(16,185,129,0.50)",
              borderRadius: 999,
              padding: "10px 18px 10px 14px",
              boxShadow: "0 8px 28px rgba(16,185,129,0.45), 0 2px 8px rgba(0,0,0,0.5)",
              backdropFilter: "blur(16px)",
            }}>
              {/* Haptic/vibrate indicator */}
              <div style={{ animation: "hapticBounce 0.55s ease-out" }}>
                <Vibrate size={17} color="#6EE7B7" />
              </div>

              {/* Check icon */}
              <CheckCircle2 size={16} color="#34D399" />

              {/* Student info */}
              <div>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#ECFDF5" }}>
                  {toastStudent.name}
                </span>
                <span style={{ fontSize: 12, color: "rgba(209,250,229,0.75)", marginLeft: 6 }}>
                  ({toastStudent.classLabel})
                </span>
                <span style={{ fontSize: 12, color: "#A7F3D0", marginLeft: 6 }}>
                  已簽到
                </span>
              </div>

              {/* Timestamp */}
              <div style={{
                fontSize: 10, color: "rgba(167,243,208,0.55)",
                borderLeft: "1px solid rgba(167,243,208,0.25)", paddingLeft: 10,
              }}>
                {new Date().toLocaleTimeString("zh-HK", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </div>
            </div>
          </div>
        )}

        {/* ──────────────────────────────────────────────────────────────────
            LAYER 6: BOTTOM ACTION BAR
        ────────────────────────────────────────────────────────────────── */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 60,
          background: "linear-gradient(0deg, rgba(0,0,0,0.90) 0%, rgba(0,0,0,0.70) 80%, transparent 100%)",
          padding: "28px 24px 28px",
          display: "flex", gap: 14,
        }}>
          {/* Flashlight button */}
          <button
            onClick={() => setFlashOn(v => !v)}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              background: flashOn ? "rgba(253,224,71,0.18)" : "rgba(255,255,255,0.08)",
              border: `1px solid ${flashOn ? "rgba(253,224,71,0.50)" : "rgba(255,255,255,0.15)"}`,
              borderRadius: 16, color: flashOn ? "#FDE047" : "rgba(255,255,255,0.75)",
              fontSize: 13, fontWeight: 700, padding: "14px 10px",
              cursor: "pointer",
              boxShadow: flashOn ? "0 0 16px rgba(253,224,71,0.25)" : "none",
              transition: "all 0.2s",
              backdropFilter: "blur(12px)",
            }}
          >
            {flashOn
              ? <Flashlight size={18} color="#FDE047" />
              : <FlashlightOff size={18} color="rgba(255,255,255,0.65)" />
            }
            <span>{flashOn ? "補光燈：開啟" : "開啟補光燈"}</span>
          </button>

          {/* Manual entry button */}
          <button
            onClick={() => { setShowManual(true); setManualInput(""); }}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 16, color: "rgba(255,255,255,0.75)",
              fontSize: 13, fontWeight: 700, padding: "14px 10px",
              cursor: "pointer",
              backdropFilter: "blur(12px)",
              transition: "all 0.2s",
            }}
          >
            <Keyboard size={18} color="rgba(255,255,255,0.65)" />
            手動輸入學號
          </button>
        </div>

        {/* ──────────────────────────────────────────────────────────────────
            LAYER 7: MANUAL ENTRY MODAL (slides up)
        ────────────────────────────────────────────────────────────────── */}
        {showManual && (
          <div style={{
            position: "absolute", inset: 0, zIndex: 100,
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(8px)",
            display: "flex", alignItems: "flex-end",
          }}>
            <div style={{
              width: "100%",
              background: "linear-gradient(180deg, #111827 0%, #0D1424 100%)",
              borderTop: "1px solid rgba(255,255,255,0.10)",
              borderRadius: "24px 24px 0 0",
              padding: "20px 20px 32px",
            }}>
              {/* Modal header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#F8FAFC" }}>手動輸入學號</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.40)", marginTop: 2 }}>Manual Student ID Entry</div>
                </div>
                <button
                  onClick={() => setShowManual(false)}
                  style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.15)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", color: "#94A3B8",
                  }}
                >
                  <X size={15} color="#94A3B8" />
                </button>
              </div>

              {/* ID display */}
              <div style={{
                background: "rgba(255,255,255,0.05)",
                border: "1.5px solid rgba(255,255,255,0.12)",
                borderRadius: 14, padding: "14px 18px",
                marginBottom: 16,
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <span style={{ fontSize: 22, fontWeight: 900, color: manualInput ? "#F8FAFC" : "rgba(255,255,255,0.22)", letterSpacing: 2, fontFamily: "'JetBrains Mono', monospace" }}>
                  {manualInput || "學號 / ID…"}
                </span>
                {manualInput && (
                  <button onClick={() => setManualInput("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748B", padding: 4 }}>
                    <Delete size={16} color="#64748B" />
                  </button>
                )}
              </div>

              {/* Number pad */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
                {NUMPAD.map(key => (
                  <button
                    key={key}
                    onClick={() => handleNumpad(key)}
                    style={{
                      background: key === "⌫" ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.06)",
                      border: `1px solid ${key === "⌫" ? "rgba(239,68,68,0.25)" : "rgba(255,255,255,0.10)"}`,
                      borderRadius: 12, color: key === "⌫" ? "#F87171" : "#E2E8F0",
                      fontSize: key === "⌫" ? 13 : 20, fontWeight: 700, padding: "16px 8px",
                      cursor: key === "*" ? "default" : "pointer",
                      opacity: key === "*" ? 0 : 1,
                    }}
                  >
                    {key === "⌫" ? "⌫" : key}
                  </button>
                ))}
              </div>

              {/* Confirm */}
              <button
                onClick={handleManualConfirm}
                disabled={!manualInput}
                style={{
                  width: "100%", padding: "16px",
                  background: manualInput ? "linear-gradient(135deg, #059669, #10B981)" : "rgba(255,255,255,0.06)",
                  border: "none", borderRadius: 16,
                  color: manualInput ? "#fff" : "rgba(255,255,255,0.25)",
                  fontSize: 15, fontWeight: 800,
                  cursor: manualInput ? "pointer" : "not-allowed",
                  transition: "all 0.2s",
                  boxShadow: manualInput ? "0 4px 20px rgba(16,185,129,0.45)" : "none",
                }}
              >
                ✅ 確認簽到 Confirm Check-in
              </button>
            </div>
          </div>
        )}

        {/* ──────────────────────────────────────────────────────────────────
            LAYER 8: DEMO COMPLETE OVERLAY
        ────────────────────────────────────────────────────────────────── */}
        {demoIdx >= DEMO_QUEUE.length && signedCount >= TOTAL && (
          <div style={{
            position: "absolute", inset: 0, zIndex: 90,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.72)", backdropFilter: "blur(10px)",
          }}>
            <div style={{
              background: "linear-gradient(145deg, #022C22 0%, #064E3B 100%)",
              border: "1.5px solid rgba(16,185,129,0.40)",
              borderRadius: 24, padding: "32px 36px",
              textAlign: "center",
              boxShadow: "0 16px 48px rgba(16,185,129,0.30)",
            }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>✅</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#ECFDF5", marginBottom: 6 }}>點名完成！</div>
              <div style={{ fontSize: 13, color: "#6EE7B7", marginBottom: 4 }}>All students checked in</div>
              <div style={{
                fontSize: 32, fontWeight: 900, color: "#10B981",
                margin: "14px 0 6px",
              }}>{TOTAL} / {TOTAL}</div>
              <div style={{ fontSize: 12, color: "rgba(167,243,208,0.65)", marginBottom: 20 }}>100% 出席率 · Attendance Rate</div>
              <button
                onClick={onBack}
                style={{
                  background: "linear-gradient(135deg, #059669, #10B981)",
                  border: "none", borderRadius: 12, color: "#fff",
                  fontSize: 14, fontWeight: 700, padding: "12px 28px",
                  cursor: "pointer",
                  boxShadow: "0 4px 16px rgba(16,185,129,0.45)",
                }}
              >
                返回活動管理
              </button>
            </div>
          </div>
        )}

      </div>{/* /phone frame */}
    </div>
  );
};
