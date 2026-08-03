import React, { useState, useEffect, useRef } from "react";
import {
  QrCode, CheckCircle2, Clock, Users, Sparkles, ChevronRight,
  AlertCircle, Database, Shield, Link, User, ArrowRight,
  Zap, Brain, FileText, Camera, CameraOff, Play, Pause,
  BarChart3, BookOpen, Lock,
} from "lucide-react";
import { DS, StatusBadge, DataPrivacyShield, Card, Btn } from "./DesignSystem";

// ─── Types ────────────────────────────────────────────────────────────────────
type FlowFrame = 1 | 2 | 3;

interface Student {
  id: string;
  initials: string;
  nameZh: string;
  group: number;
  role?: "Leader" | "Researcher" | "Presenter" | "Recorder";
  score: number;
  status: "present" | "absent" | "pending";
  scannedAt?: string;
}

interface GroupData {
  id: number;
  name: string;
  task: string;
  progress: number;
  alertLevel: "normal" | "attention" | "critical";
}

interface AuditTimestamp {
  label: string;
  labelZh: string;
  value: string;
  icon: React.ReactNode;
  verified: boolean;
}

// ─── Seed Data ────────────────────────────────────────────────────────────────
const ALL_STUDENTS: Student[] = [
  { id: "S001", initials: "CW",  nameZh: "陳偉",  group: 1, role: "Leader",     score: 88, status: "pending" },
  { id: "S002", initials: "LH",  nameZh: "李雄",  group: 1, role: "Researcher", score: 74, status: "pending" },
  { id: "S003", initials: "ZM",  nameZh: "張明",  group: 1, role: "Recorder",   score: 81, status: "pending" },
  { id: "S004", initials: "WT",  nameZh: "吳婷",  group: 1, role: "Presenter",  score: 79, status: "pending" },
  { id: "S005", initials: "HJ",  nameZh: "黃俊",  group: 2, role: "Leader",     score: 91, status: "pending" },
  { id: "S006", initials: "LB",  nameZh: "劉冰",  group: 2, role: "Researcher", score: 85, status: "pending" },
  { id: "S007", initials: "ZX",  nameZh: "趙霞",  group: 2, role: "Recorder",   score: 77, status: "pending" },
  { id: "S008", initials: "FL",  nameZh: "馮蘭",  group: 2, role: "Presenter",  score: 83, status: "pending" },
  { id: "S009", initials: "ZH",  nameZh: "鄭惠",  group: 3, role: "Leader",     score: 72, status: "pending" },
  { id: "S010", initials: "WA",  nameZh: "王濤",  group: 3, role: "Researcher", score: 65, status: "pending" },
  { id: "S011", initials: "SL",  nameZh: "孫麗",  group: 3, role: "Recorder",   score: 58, status: "pending", },
  { id: "S012", initials: "ZF",  nameZh: "周鳳",  group: 3, role: "Presenter",  score: 70, status: "pending" },
  { id: "S013", initials: "YS",  nameZh: "楊松",  group: 4, role: "Leader",     score: 86, status: "pending" },
  { id: "S014", initials: "XM",  nameZh: "許梅",  group: 4, role: "Researcher", score: 80, status: "pending" },
  { id: "S015", initials: "GP",  nameZh: "謝平",  group: 4, role: "Recorder",   score: 76, status: "pending" },
  { id: "S016", initials: "HQ",  nameZh: "韓琪",  group: 4, role: "Presenter",  score: 82, status: "pending" },
];

const GROUPS: GroupData[] = [
  { id: 1, name: "Group 1",  task: "Plastic Waste Life-cycle",         progress: 72, alertLevel: "normal"    },
  { id: 2, name: "Group 2",  task: "Climate Change Cause & Effect",    progress: 54, alertLevel: "attention" },
  { id: 3, name: "Group 3",  task: "Biodiversity Loss Mapping",        progress: 38, alertLevel: "critical"  },
  { id: 4, name: "Group 4",  task: "Renewable Energy Transition",      progress: 81, alertLevel: "normal"    },
];

// Scan sequence — who gets scanned in which order and at what interval (ms)
const SCAN_SEQUENCE: Array<{ studentId: string; delay: number; time: string }> = [
  { studentId: "S001", delay: 600,  time: "14:30:02" },
  { studentId: "S005", delay: 1100, time: "14:30:03" },
  { studentId: "S009", delay: 1700, time: "14:30:04" },
  { studentId: "S013", delay: 2200, time: "14:30:05" },
  { studentId: "S002", delay: 2700, time: "14:30:06" },
  { studentId: "S006", delay: 3200, time: "14:30:07" },
  { studentId: "S010", delay: 3700, time: "14:30:08" },
  { studentId: "S014", delay: 4200, time: "14:30:09" },
  { studentId: "S003", delay: 4700, time: "14:30:09" },
  { studentId: "S007", delay: 5100, time: "14:30:10" },
  { studentId: "S011", delay: 5600, time: "14:30:11" },
  { studentId: "S015", delay: 6000, time: "14:30:11" },
  { studentId: "S004", delay: 6500, time: "14:30:12" },
  { studentId: "S008", delay: 6900, time: "14:30:13" },
  { studentId: "S016", delay: 7400, time: "14:30:14" },
  // S012 absent — never scanned
];

const GENERATED_HINT = `Your group has identified 3 primary causes of climate change. Now consider: what patterns emerge when you trace the *second-order* effects?

If deforestation leads to soil erosion — what does soil erosion lead to next? Does that secondary effect eventually circle back to accelerate deforestation itself?

Try rebuilding your diagram as a feedback loop rather than a linear chain. Which node, if removed, would break the entire cycle?`;

const NOW_DATE = "2026-08-01";

const AUDIT_TIMESTAMPS: AuditTimestamp[] = [
  {
    label: "Assessing Teacher",
    labelZh: "評估教師",
    value: "Mr. T. Chan · Staff ID: TC-0047",
    icon: <User size={13} />,
    verified: true,
  },
  {
    label: "Learning Timestamp",
    labelZh: "學習時間戳",
    value: `${NOW_DATE} 14:35:44 HKT · Class 1A Science`,
    icon: <Clock size={13} />,
    verified: true,
  },
  {
    label: "Data Logging Timestamp",
    labelZh: "數據記錄時間戳",
    value: `${NOW_DATE} 14:35:46 HKT · Δ 2s latency`,
    icon: <Database size={13} />,
    verified: true,
  },
  {
    label: "Portfolio URL",
    labelZh: "作品集連結",
    value: "knowledgegraph://portfolio/G2-CLIMATE-001",
    icon: <Link size={13} />,
    verified: true,
  },
];

// ─── Sub-Component: Journey Step Indicator ────────────────────────────────────
const JourneyStepIndicator: React.FC<{ current: FlowFrame; onStep: (f: FlowFrame) => void }> = ({
  current, onStep,
}) => {
  const steps: { frame: FlowFrame; label: string; sub: string; icon: React.ReactNode }[] = [
    { frame: 1, label: "Scan & Attend",       sub: "0.5s QR Ingestion",         icon: <QrCode size={14} />   },
    { frame: 2, label: "Observe Groups",      sub: "Matrix Selection",           icon: <Users size={14} />    },
    { frame: 3, label: "AI Scaffolding",      sub: "鷹架引導 · Audit",          icon: <Sparkles size={14} /> },
  ];

  return (
    <div
      style={{
        background: DS.colors.surface,
        border: `1px solid ${DS.colors.border}`,
        borderRadius: DS.radius.lg,
        padding: "16px 24px",
        marginBottom: "20px",
        display: "flex",
        alignItems: "center",
        gap: "0",
        boxShadow: DS.shadow.sm,
      }}
    >
      {/* Module badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginRight: "28px",
          paddingRight: "28px",
          borderRight: `1px solid ${DS.colors.border}`,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: "36px", height: "36px",
            borderRadius: DS.radius.md,
            background: `linear-gradient(135deg, ${DS.colors.primary}, #7C3AED)`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <Video_ size={18} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: "12px", fontWeight: 800, color: DS.colors.textPrimary, fontFamily: DS.font.family }}>
            Module 5
          </div>
          <div style={{ fontSize: "10px", color: DS.colors.textMuted, fontFamily: DS.font.family }}>
            實時表現記錄器
          </div>
        </div>
      </div>

      {/* Steps */}
      <div style={{ display: "flex", alignItems: "center", flex: 1, gap: "0" }}>
        {steps.map((s, idx) => {
          const isActive   = s.frame === current;
          const isComplete = s.frame < current;
          const isClickable = s.frame <= current;
          return (
            <React.Fragment key={s.frame}>
              <button
                onClick={() => isClickable && onStep(s.frame)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "8px 14px",
                  borderRadius: DS.radius.md,
                  border: isActive ? `2px solid ${DS.colors.primary}` : "2px solid transparent",
                  background: isActive ? DS.colors.primaryLight : isComplete ? "#F0FDF4" : "transparent",
                  cursor: isClickable ? "pointer" : "default",
                  transition: "all 0.2s",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: "28px", height: "28px",
                    borderRadius: "50%",
                    background: isActive ? DS.colors.primary : isComplete ? DS.colors.secondary : DS.colors.border,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff",
                    flexShrink: 0,
                    transition: "background 0.2s",
                  }}
                >
                  {isComplete ? <CheckCircle2 size={14} /> : s.icon}
                </div>
                <div style={{ textAlign: "left" }}>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? DS.colors.primary : isComplete ? DS.colors.secondary : DS.colors.textSecondary,
                      fontFamily: DS.font.family,
                    }}
                  >
                    Frame {s.frame}: {s.label}
                  </div>
                  <div style={{ fontSize: "10px", color: DS.colors.textMuted, fontFamily: DS.font.family }}>
                    {s.sub}
                  </div>
                </div>
              </button>
              {idx < steps.length - 1 && (
                <div
                  style={{
                    flex: 1,
                    height: "2px",
                    background: isComplete ? DS.colors.secondary : DS.colors.border,
                    margin: "0 4px",
                    transition: "background 0.3s",
                    minWidth: "24px",
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Timer */}
      <div
        style={{
          marginLeft: "24px",
          paddingLeft: "24px",
          borderLeft: `1px solid ${DS.colors.border}`,
          flexShrink: 0,
          textAlign: "right",
        }}
      >
        <div style={{ fontSize: "11px", color: DS.colors.textMuted, fontFamily: DS.font.family }}>
          Class Duration
        </div>
        <div style={{ fontSize: "16px", fontWeight: 800, color: DS.colors.primary, fontFamily: DS.font.family, fontVariantNumeric: "tabular-nums" }}>
          35:00
        </div>
        <div style={{ fontSize: "10px", color: DS.colors.secondary, fontFamily: DS.font.family }}>
          ● Live
        </div>
      </div>
    </div>
  );
};

// ─── Local Icon alias (Video from lucide) ─────────────────────────────────────
const Video_: React.FC<{ size: number; color?: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="23 7 16 12 23 17 23 7" />
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </svg>
);

// ─── Frame 1: Scanning & Attendance ──────────────────────────────────────────
const Frame1_Scanning: React.FC<{
  students: Student[];
  onComplete: () => void;
  scanActive: boolean;
  setScanActive: (v: boolean) => void;
  lastScanned: Student | null;
}> = ({ students, onComplete, scanActive, setScanActive, lastScanned }) => {
  const presentStudents = students.filter((s) => s.status === "present");
  const totalStudents = ALL_STUDENTS.length;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "20px", alignItems: "start" }}>

      {/* ── LEFT: Camera Viewport (50% screen) ── */}
      <Card
        style={{
          overflow: "hidden",
          border: scanActive ? `2px solid ${DS.colors.secondary}` : `2px solid ${DS.colors.border}`,
          transition: "border-color 0.3s",
          position: "relative",
        }}
      >
        {/* Camera feed dark backdrop */}
        <div
          style={{
            background: "#0F172A",
            minHeight: "440px",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {/* Grid overlay texture */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: "linear-gradient(rgba(26,86,219,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(26,86,219,0.05) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />

          {/* Scan line animation */}
          {scanActive && (
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                height: "2px",
                background: "linear-gradient(90deg, transparent, #10B981, transparent)",
                animation: "scanLine 1.8s ease-in-out infinite",
                zIndex: 3,
              }}
            />
          )}

          {/* QR Frame corners */}
          <div style={{ position: "relative", width: "220px", height: "220px", zIndex: 4 }}>
            {/* Corner TL */}
            <div style={{ position: "absolute", top: 0, left: 0, width: "28px", height: "28px", borderTop: `4px solid ${scanActive ? "#10B981" : "#4B5563"}`, borderLeft: `4px solid ${scanActive ? "#10B981" : "#4B5563"}`, transition: "border-color 0.3s" }} />
            {/* Corner TR */}
            <div style={{ position: "absolute", top: 0, right: 0, width: "28px", height: "28px", borderTop: `4px solid ${scanActive ? "#10B981" : "#4B5563"}`, borderRight: `4px solid ${scanActive ? "#10B981" : "#4B5563"}`, transition: "border-color 0.3s" }} />
            {/* Corner BL */}
            <div style={{ position: "absolute", bottom: 0, left: 0, width: "28px", height: "28px", borderBottom: `4px solid ${scanActive ? "#10B981" : "#4B5563"}`, borderLeft: `4px solid ${scanActive ? "#10B981" : "#4B5563"}`, transition: "border-color 0.3s" }} />
            {/* Corner BR */}
            <div style={{ position: "absolute", bottom: 0, right: 0, width: "28px", height: "28px", borderBottom: `4px solid ${scanActive ? "#10B981" : "#4B5563"}`, borderRight: `4px solid ${scanActive ? "#10B981" : "#4B5563"}`, transition: "border-color 0.3s" }} />

            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px" }}>
              <QrCode size={64} color={scanActive ? "#10B981" : "#4B5563"} strokeWidth={1} style={{ transition: "color 0.3s" }} />
              <div style={{ fontSize: "13px", fontWeight: 600, color: scanActive ? "#10B981" : "#6B7280", fontFamily: DS.font.family, letterSpacing: "0.06em" }}>
                {scanActive ? "SCANNING..." : "SCANNER OFF"}
              </div>
            </div>
          </div>

          {/* Last scanned toast */}
          {lastScanned && scanActive && (
            <div
              style={{
                position: "absolute",
                bottom: "16px",
                left: "50%",
                transform: "translateX(-50%)",
                background: "rgba(16,185,129,0.15)",
                border: "1px solid #10B981",
                borderRadius: DS.radius.lg,
                padding: "8px 16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                zIndex: 10,
                animation: "fadeInUp 0.3s ease-out",
              }}
            >
              <div
                style={{
                  width: "28px", height: "28px", borderRadius: "50%",
                  background: DS.colors.primary,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontSize: "10px", fontWeight: 700, fontFamily: DS.font.family,
                  flexShrink: 0,
                }}
              >
                {lastScanned.initials}
              </div>
              <div>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#10B981", fontFamily: DS.font.family }}>
                  ✓ {lastScanned.nameZh} · {lastScanned.initials}
                </div>
                <div style={{ fontSize: "10px", color: "#6EE7B7", fontFamily: DS.font.family }}>
                  Group {lastScanned.group} · {lastScanned.scannedAt}
                </div>
              </div>
              <div style={{ fontSize: "10px", fontWeight: 800, color: "#10B981", marginLeft: "4px" }}>
                0.4s
              </div>
            </div>
          )}

          {/* Status overlay top-left */}
          <div
            style={{
              position: "absolute",
              top: "12px",
              left: "12px",
              display: "flex",
              gap: "8px",
              alignItems: "center",
              zIndex: 10,
            }}
          >
            <div
              style={{
                background: "rgba(15,23,42,0.8)",
                border: `1px solid ${scanActive ? "#10B981" : "#374151"}`,
                borderRadius: DS.radius.md,
                padding: "4px 10px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <div
                style={{
                  width: "7px", height: "7px", borderRadius: "50%",
                  background: scanActive ? "#10B981" : "#6B7280",
                  animation: scanActive ? "pulse 1.5s infinite" : "none",
                }}
              />
              <span style={{ fontSize: "11px", fontWeight: 700, color: scanActive ? "#10B981" : "#9CA3AF", fontFamily: DS.font.family }}>
                {scanActive ? "LIVE" : "IDLE"}
              </span>
            </div>
          </div>

          {/* Speed indicator */}
          <div
            style={{
              position: "absolute",
              top: "12px",
              right: "12px",
              background: "rgba(15,23,42,0.8)",
              border: "1px solid #374151",
              borderRadius: DS.radius.md,
              padding: "4px 10px",
              zIndex: 10,
            }}
          >
            <span style={{ fontSize: "11px", color: "#F59E0B", fontWeight: 700, fontFamily: DS.font.family }}>
              ⚡ 0.5s target
            </span>
          </div>
        </div>

        {/* Camera controls */}
        <div
          style={{
            padding: "16px 20px",
            borderTop: `1px solid ${DS.colors.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#F8FAFC",
          }}
        >
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => setScanActive(!scanActive)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                background: scanActive ? "#FEF3C7" : DS.colors.secondary,
                border: "none",
                borderRadius: DS.radius.md,
                fontSize: "13px",
                fontWeight: 600,
                color: scanActive ? "#92400E" : "#fff",
                cursor: "pointer",
                fontFamily: DS.font.family,
              }}
            >
              {scanActive ? <Pause size={14} /> : <Play size={14} />}
              {scanActive ? "Pause Scanner" : "Start Scanner"}
            </button>
          </div>
          <div style={{ fontSize: "12px", color: DS.colors.textMuted, fontFamily: DS.font.family }}>
            {presentStudents.length}/{totalStudents} students registered
          </div>
        </div>
      </Card>

      {/* ── RIGHT: Attendance Tally Sidebar ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

        {/* Attendance counter */}
        <Card style={{ padding: "16px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: DS.colors.textPrimary, fontFamily: DS.font.family }}>
                Attendance Tally
              </div>
              <div style={{ fontSize: "11px", color: DS.colors.textMuted, fontFamily: DS.font.family }}>
                Real-time ingestion
              </div>
            </div>
            <StatusBadge variant={scanActive ? "active" : "pending"} label={scanActive ? "Scanning" : "Paused"} size="sm" />
          </div>

          {/* Progress bar */}
          <div style={{ marginBottom: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <span style={{ fontSize: "11px", color: DS.colors.textSecondary, fontFamily: DS.font.family }}>
                Present
              </span>
              <span style={{ fontSize: "11px", fontWeight: 700, color: DS.colors.textPrimary, fontFamily: DS.font.family }}>
                {presentStudents.length} / {totalStudents}
              </span>
            </div>
            <div style={{ height: "8px", background: DS.colors.background, borderRadius: DS.radius.full, overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${(presentStudents.length / totalStudents) * 100}%`,
                  background: DS.colors.secondary,
                  borderRadius: DS.radius.full,
                  transition: "width 0.4s ease-out",
                }}
              />
            </div>
          </div>

          {/* Mini group counts */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
            {GROUPS.map((g) => {
              const gPresent = presentStudents.filter((s) => s.group === g.id).length;
              const gTotal = ALL_STUDENTS.filter((s) => s.group === g.id).length;
              return (
                <div
                  key={g.id}
                  style={{
                    background: DS.colors.background,
                    borderRadius: DS.radius.sm,
                    padding: "6px 8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ fontSize: "11px", color: DS.colors.textSecondary, fontFamily: DS.font.family }}>
                    Grp {g.id}
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: gPresent === gTotal ? DS.colors.secondary : DS.colors.warning,
                      fontFamily: DS.font.family,
                    }}
                  >
                    {gPresent}/{gTotal}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Student list */}
        <Card style={{ padding: "16px 20px", maxHeight: "300px", overflowY: "auto" }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: DS.colors.textSecondary, marginBottom: "10px", fontFamily: DS.font.family, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Registered Students
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {ALL_STUDENTS.map((s) => {
              const isPresent = presentStudents.some((p) => p.id === s.id);
              const isAbsent = s.id === "S012"; // known absent student
              return (
                <div
                  key={s.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "5px 6px",
                    borderRadius: DS.radius.sm,
                    background: isPresent ? "#F0FDF4" : "transparent",
                    transition: "background 0.3s",
                  }}
                >
                  <div
                    style={{
                      width: "26px", height: "26px", borderRadius: "50%",
                      background: isPresent ? DS.colors.secondary : isAbsent ? DS.colors.error : DS.colors.border,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#fff", fontSize: "9px", fontWeight: 700,
                      fontFamily: DS.font.family, flexShrink: 0,
                      transition: "background 0.3s",
                    }}
                  >
                    {s.initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: DS.colors.textPrimary, fontFamily: DS.font.family }}>
                      {s.nameZh}
                    </div>
                    <div style={{ fontSize: "10px", color: DS.colors.textMuted, fontFamily: DS.font.family }}>
                      Group {s.group} · {s.role}
                    </div>
                  </div>
                  {isPresent && (
                    <StatusBadge variant="present" label="✓" size="sm" />
                  )}
                  {isAbsent && (
                    <StatusBadge variant="absent" label="ABS" size="sm" />
                  )}
                  {!isPresent && !isAbsent && (
                    <StatusBadge variant="pending" label="—" size="sm" />
                  )}
                  {isPresent && (
                    <span style={{ fontSize: "9px", color: DS.colors.textMuted, fontFamily: DS.font.family, flexShrink: 0 }}>
                      {s.scannedAt}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Transition CTA */}
        <button
          onClick={onComplete}
          disabled={presentStudents.length < 12}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            padding: "12px 20px",
            background: presentStudents.length >= 12 ? DS.colors.primary : DS.colors.border,
            border: "none",
            borderRadius: DS.radius.lg,
            color: presentStudents.length >= 12 ? "#fff" : DS.colors.textMuted,
            fontSize: "14px",
            fontWeight: 700,
            fontFamily: DS.font.family,
            cursor: presentStudents.length >= 12 ? "pointer" : "not-allowed",
            boxShadow: presentStudents.length >= 12 ? "0 4px 14px rgba(26,86,219,0.3)" : "none",
            transition: "all 0.2s",
          }}
        >
          <CameraOff size={16} />
          Close Scanner → Observe Groups
          <ArrowRight size={16} />
        </button>
        <div style={{ fontSize: "11px", color: DS.colors.textMuted, textAlign: "center", fontFamily: DS.font.family }}>
          {presentStudents.length < 12
            ? `Scanning... (${presentStudents.length}/12 minimum)`
            : `${presentStudents.length} students logged — ready to proceed`}
        </div>
      </div>
    </div>
  );
};

// ─── Frame 2: Group Matrix Observation ───────────────────────────────────────
const Frame2_GroupMatrix: React.FC<{
  students: Student[];
  selectedGroup: number | null;
  onSelectGroup: (g: number) => void;
  onProceed: () => void;
}> = ({ students, selectedGroup, onSelectGroup, onProceed }) => {
  const alertColors: Record<GroupData["alertLevel"], { border: string; bg: string; badge: string }> = {
    normal:    { border: DS.colors.border,   bg: DS.colors.surface,  badge: DS.colors.secondary },
    attention: { border: "#F59E0B",           bg: "#FFFBEB",          badge: DS.colors.warning    },
    critical:  { border: DS.colors.error,    bg: "#FFF5F5",          badge: DS.colors.error      },
  };
  const scoreColor = (score: number) =>
    score >= 80 ? DS.colors.secondary : score >= 65 ? DS.colors.warning : DS.colors.error;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Collapsed scanner pill */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "6px 14px",
          background: "#1F2937",
          borderRadius: DS.radius.full,
          alignSelf: "flex-start",
        }}
      >
        <CameraOff size={13} color="#9CA3AF" />
        <span style={{ fontSize: "12px", color: "#9CA3AF", fontFamily: DS.font.family }}>
          Scanner closed
        </span>
        <span style={{ fontSize: "12px", fontWeight: 700, color: "#10B981", fontFamily: DS.font.family }}>
          15 / 16 present
        </span>
        <div style={{ width: "6px", height: "6px", background: "#10B981", borderRadius: "50%" }} />
      </div>

      {/* Instruction banner */}
      <div
        style={{
          background: DS.colors.primaryLight,
          border: `1px solid #BFDBFE`,
          borderRadius: DS.radius.md,
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <Users size={16} color={DS.colors.primary} />
        <span style={{ fontSize: "13px", color: DS.colors.primary, fontWeight: 600, fontFamily: DS.font.family }}>
          Select a group to focus on. The AI scaffold panel will open for your selected group.
        </span>
      </div>

      {/* Group matrix grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
        {GROUPS.map((group) => {
          const groupStudents = students.filter((s) => s.group === group.id);
          const allStudents   = ALL_STUDENTS.filter((s) => s.group === group.id);
          const isSelected    = selectedGroup === group.id;
          const cfg           = alertColors[group.alertLevel];

          return (
            <div
              key={group.id}
              onClick={() => onSelectGroup(group.id)}
              style={{
                background: isSelected ? DS.colors.primaryLight : cfg.bg,
                border: `2px solid ${isSelected ? DS.colors.primary : cfg.border}`,
                borderRadius: DS.radius.xl,
                padding: "20px",
                cursor: "pointer",
                transition: "all 0.2s",
                boxShadow: isSelected ? `0 0 0 4px rgba(26,86,219,0.15)` : DS.shadow.sm,
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Selected ring glow */}
              {isSelected && (
                <div
                  style={{
                    position: "absolute",
                    top: "-2px", left: "-2px", right: "-2px", bottom: "-2px",
                    borderRadius: DS.radius.xl,
                    background: "transparent",
                    border: `2px solid ${DS.colors.primary}`,
                    pointerEvents: "none",
                  }}
                />
              )}

              {/* Group header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div
                    style={{
                      width: "32px", height: "32px", borderRadius: DS.radius.md,
                      background: isSelected ? DS.colors.primary : "#E5E7EB",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <Users size={15} color={isSelected ? "#fff" : DS.colors.textSecondary} />
                  </div>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 800, color: isSelected ? DS.colors.primary : DS.colors.textPrimary, fontFamily: DS.font.family }}>
                      {group.name}
                    </div>
                    <div style={{ fontSize: "10px", color: DS.colors.textMuted, fontFamily: DS.font.family, maxWidth: "140px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {group.task}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                  {isSelected && (
                    <span
                      style={{
                        fontSize: "10px", fontWeight: 800,
                        padding: "2px 8px",
                        background: DS.colors.primary, color: "#fff",
                        borderRadius: DS.radius.full,
                        fontFamily: DS.font.family,
                      }}
                    >
                      ● SELECTED
                    </span>
                  )}
                  {group.alertLevel === "attention" && !isSelected && (
                    <span style={{ fontSize: "10px", fontWeight: 700, color: DS.colors.warning, fontFamily: DS.font.family }}>
                      ⚠ Needs check
                    </span>
                  )}
                  {group.alertLevel === "critical" && !isSelected && (
                    <span style={{ fontSize: "10px", fontWeight: 700, color: DS.colors.error, fontFamily: DS.font.family }}>
                      🔴 At risk
                    </span>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ marginBottom: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ fontSize: "10px", color: DS.colors.textSecondary, fontFamily: DS.font.family }}>
                    Task Progress
                  </span>
                  <span style={{ fontSize: "10px", fontWeight: 700, color: DS.colors.textPrimary, fontFamily: DS.font.family }}>
                    {group.progress}%
                  </span>
                </div>
                <div style={{ height: "5px", background: "#E5E7EB", borderRadius: DS.radius.full }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${group.progress}%`,
                      background: group.alertLevel === "critical" ? DS.colors.error : group.alertLevel === "attention" ? DS.colors.warning : DS.colors.secondary,
                      borderRadius: DS.radius.full,
                    }}
                  />
                </div>
              </div>

              {/* Student cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px" }}>
                {allStudents.map((s) => {
                  const isPresent = groupStudents.some((gs) => gs.id === s.id);
                  return (
                    <div
                      key={s.id}
                      style={{
                        background: isSelected ? "rgba(26,86,219,0.08)" : "rgba(0,0,0,0.04)",
                        borderRadius: DS.radius.md,
                        padding: "8px 4px",
                        textAlign: "center",
                        border: `1px solid ${isSelected ? "rgba(26,86,219,0.2)" : "transparent"}`,
                      }}
                    >
                      <div
                        style={{
                          width: "28px", height: "28px", borderRadius: "50%",
                          background: isPresent ? scoreColor(s.score) : DS.colors.border,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "#fff", fontSize: "9px", fontWeight: 700,
                          fontFamily: DS.font.family, margin: "0 auto 4px",
                          opacity: isPresent ? 1 : 0.5,
                        }}
                      >
                        {s.initials}
                      </div>
                      <div style={{ fontSize: "9px", color: DS.colors.textMuted, fontFamily: DS.font.family }}>
                        {s.role?.slice(0, 4)}
                      </div>
                      {isPresent && (
                        <div style={{ fontSize: "9px", fontWeight: 700, color: scoreColor(s.score), fontFamily: DS.font.family }}>
                          {s.score}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating action bar for selected group */}
      {selectedGroup !== null && (
        <div
          style={{
            position: "sticky",
            bottom: "16px",
            background: "#1F2937",
            borderRadius: DS.radius.xl,
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            gap: "16px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.28)",
            zIndex: 50,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
            <div
              style={{
                width: "36px", height: "36px", borderRadius: DS.radius.md,
                background: DS.colors.primary,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <Users size={16} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#fff", fontFamily: DS.font.family }}>
                Group {selectedGroup} selected
              </div>
              <div style={{ fontSize: "11px", color: "#9CA3AF", fontFamily: DS.font.family }}>
                {GROUPS.find((g) => g.id === selectedGroup)?.task}
              </div>
            </div>
          </div>
          <div style={{ width: "1px", height: "28px", background: "#374151" }} />
          <button
            onClick={onProceed}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "10px 18px",
              background: DS.colors.primary,
              border: "none",
              borderRadius: DS.radius.md,
              fontSize: "13px",
              fontWeight: 700,
              color: "#fff",
              cursor: "pointer",
              fontFamily: DS.font.family,
              boxShadow: "0 2px 8px rgba(26,86,219,0.4)",
            }}
          >
            <Sparkles size={14} />
            Generate AI Scaffold for Group {selectedGroup}
            <ArrowRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Frame 3: AI Scaffolding Generation ──────────────────────────────────────
const Frame3_AIScaffold: React.FC<{
  selectedGroup: number;
  students: Student[];
  onConfirm: () => void;
  confirmed: boolean;
}> = ({ selectedGroup, students, onConfirm, confirmed }) => {
  const [generating, setGenerating]   = useState(false);
  const [hintVisible, setHintVisible] = useState(false);
  const [bloomLevel, setBloomLevel]   = useState(4);
  const group = GROUPS.find((g) => g.id === selectedGroup)!;
  const groupStudents = ALL_STUDENTS.filter((s) => s.group === selectedGroup);
  const presentInGroup = students.filter((s) => s.group === selectedGroup);

  const bloomLabels = ["—", "Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"];
  const bloomColors = ["","#6B7280","#3B82F6","#10B981","#8B5CF6","#F59E0B","#EF4444"];

  const handleGenerate = () => {
    if (hintVisible) return;
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setHintVisible(true);
    }, 1800);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: "20px", alignItems: "start" }}>

      {/* ── LEFT: Dimmed group matrix ── */}
      <div style={{ opacity: 0.55, pointerEvents: "none", transition: "opacity 0.3s" }}>
        <div
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: DS.colors.textSecondary,
            marginBottom: "12px",
            fontFamily: DS.font.family,
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <Brain size={13} />
          Class Overview — focus locked on Group {selectedGroup}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
          {GROUPS.map((g) => {
            const isTarget = g.id === selectedGroup;
            return (
              <div
                key={g.id}
                style={{
                  background: isTarget ? DS.colors.primaryLight : DS.colors.surface,
                  border: `2px solid ${isTarget ? DS.colors.primary : DS.colors.border}`,
                  borderRadius: DS.radius.lg,
                  padding: "14px",
                }}
              >
                <div style={{ fontSize: "13px", fontWeight: 700, color: DS.colors.textPrimary, fontFamily: DS.font.family, marginBottom: "4px" }}>
                  {g.name} {isTarget && "🎯"}
                </div>
                <div style={{ fontSize: "11px", color: DS.colors.textMuted, fontFamily: DS.font.family, marginBottom: "8px" }}>
                  {g.task}
                </div>
                <div style={{ display: "flex", gap: "4px" }}>
                  {ALL_STUDENTS.filter((s) => s.group === g.id).map((s) => (
                    <div
                      key={s.id}
                      style={{
                        width: "24px", height: "24px", borderRadius: "50%",
                        background: g.alertLevel === "critical" ? DS.colors.error : g.alertLevel === "attention" ? DS.colors.warning : DS.colors.secondary,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#fff", fontSize: "8px", fontWeight: 700, fontFamily: DS.font.family,
                      }}
                    >
                      {s.initials}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── RIGHT: AI Scaffold Side Panel ── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          animation: "slideInRight 0.35s ease-out",
        }}
      >
        {/* Panel header */}
        <div
          style={{
            background: `linear-gradient(135deg, ${DS.colors.primary}, #7C3AED)`,
            borderRadius: DS.radius.xl,
            padding: "16px 20px",
            color: "#fff",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <Sparkles size={18} color="#E0E7FF" />
            <div style={{ fontSize: "15px", fontWeight: 800, fontFamily: DS.font.family }}>
              AI Scaffolding Panel
            </div>
            <span
              style={{
                fontSize: "10px", fontWeight: 700,
                padding: "2px 7px",
                background: "rgba(255,255,255,0.2)",
                borderRadius: DS.radius.full,
                fontFamily: DS.font.family,
              }}
            >
              鷹架引導
            </span>
          </div>
          {/* Group context */}
          <div
            style={{
              background: "rgba(255,255,255,0.12)",
              borderRadius: DS.radius.md,
              padding: "10px 12px",
            }}
          >
            <div style={{ fontSize: "12px", fontWeight: 700, color: "#E0E7FF", marginBottom: "2px", fontFamily: DS.font.family }}>
              Group {selectedGroup} · {group.task}
            </div>
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              {groupStudents.map((s) => (
                <div
                  key={s.id}
                  style={{
                    width: "22px", height: "22px", borderRadius: "50%",
                    background: "rgba(255,255,255,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "8px", fontWeight: 700, color: "#fff", fontFamily: DS.font.family,
                  }}
                  title={`${s.nameZh} — ${s.role}`}
                >
                  {s.initials}
                </div>
              ))}
              <span style={{ fontSize: "10px", color: "#C7D2FE", marginLeft: "4px", fontFamily: DS.font.family }}>
                {presentInGroup.length}/{groupStudents.length} present
              </span>
            </div>
          </div>
        </div>

        {/* Bloom's level selector */}
        <Card style={{ padding: "14px 16px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: DS.colors.textSecondary, marginBottom: "8px", fontFamily: DS.font.family, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Bloom's Taxonomy Target Level
          </div>
          <div style={{ display: "flex", gap: "4px" }}>
            {[1,2,3,4,5,6].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setBloomLevel(lvl)}
                style={{
                  flex: 1,
                  padding: "5px 2px",
                  background: bloomLevel === lvl ? bloomColors[lvl] : "#F3F4F6",
                  border: "none",
                  borderRadius: DS.radius.sm,
                  fontSize: "9px",
                  fontWeight: 700,
                  color: bloomLevel === lvl ? "#fff" : DS.colors.textMuted,
                  cursor: "pointer",
                  fontFamily: DS.font.family,
                  textAlign: "center",
                  transition: "all 0.15s",
                }}
              >
                L{lvl}
                <br />
                <span style={{ fontSize: "8px", fontWeight: 400 }}>
                  {bloomLabels[lvl].slice(0, 4)}
                </span>
              </button>
            ))}
          </div>
          <div style={{ fontSize: "11px", color: bloomColors[bloomLevel], fontWeight: 600, marginTop: "6px", fontFamily: DS.font.family }}>
            Target: L{bloomLevel} — {bloomLabels[bloomLevel]}
          </div>
        </Card>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={generating || hintVisible}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            padding: "13px 20px",
            background: hintVisible ? DS.colors.secondary : generating ? "#6366F1" : DS.colors.primary,
            border: "none",
            borderRadius: DS.radius.lg,
            fontSize: "14px",
            fontWeight: 700,
            color: "#fff",
            cursor: generating || hintVisible ? "not-allowed" : "pointer",
            fontFamily: DS.font.family,
            boxShadow: generating ? "none" : "0 4px 14px rgba(26,86,219,0.35)",
            transition: "all 0.2s",
          }}
        >
          {generating ? (
            <>
              <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span>
              Generating Scaffolded Hint...
            </>
          ) : hintVisible ? (
            <>
              <CheckCircle2 size={16} />
              Hint Generated ✓
            </>
          ) : (
            <>
              <Sparkles size={16} />
              Generate Scaffolded Hint ✨
            </>
          )}
        </button>

        {/* AIFeedbackCard */}
        {hintVisible && (
          <div
            style={{
              background: DS.colors.surface,
              border: `2px solid #A5B4FC`,
              borderRadius: DS.radius.xl,
              overflow: "hidden",
              animation: "fadeInUp 0.4s ease-out",
              boxShadow: "0 4px 20px rgba(99,102,241,0.15)",
            }}
          >
            {/* Card header */}
            <div
              style={{
                padding: "12px 16px",
                background: "#EEF2FF",
                borderBottom: "1px solid #C7D2FE",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Brain size={15} color="#4338CA" />
              <span style={{ fontSize: "12px", fontWeight: 800, color: "#3730A3", fontFamily: DS.font.family }}>
                AI Scaffolded Hint — Socratic Method
              </span>
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: "10px",
                  fontWeight: 700,
                  padding: "2px 7px",
                  background: bloomColors[bloomLevel],
                  color: "#fff",
                  borderRadius: DS.radius.full,
                  fontFamily: DS.font.family,
                }}
              >
                L{bloomLevel} {bloomLabels[bloomLevel]}
              </span>
            </div>

            {/* Hint text */}
            <div style={{ padding: "14px 16px", borderBottom: "1px solid #E0E7FF" }}>
              {GENERATED_HINT.split("\n\n").map((para, i) => (
                <p
                  key={i}
                  style={{
                    fontSize: "13px",
                    color: DS.colors.textPrimary,
                    lineHeight: "1.7",
                    margin: i > 0 ? "10px 0 0" : "0",
                    fontFamily: DS.font.family,
                  }}
                  dangerouslySetInnerHTML={{
                    __html: para.replace(/\*(.*?)\*/g, `<em style="color:${DS.colors.primary};font-style:normal;font-weight:600">$1</em>`),
                  }}
                />
              ))}
            </div>

            {/* ── 4 Mandatory Audit Timestamps ── */}
            <div
              style={{
                padding: "12px 16px",
                background: "#F8FAFC",
                borderBottom: "1px solid #E5E7EB",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  marginBottom: "10px",
                }}
              >
                <Lock size={12} color="#6366F1" />
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 800,
                    color: "#4338CA",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    fontFamily: DS.font.family,
                  }}
                >
                  Compliance Audit Trail — 4 Mandatory Timestamps
                </span>
                <DataPrivacyShield label="PDPO ✓" />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {AUDIT_TIMESTAMPS.map((ts, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      padding: "8px 10px",
                      background: DS.colors.surface,
                      borderRadius: DS.radius.md,
                      border: `1px solid ${DS.colors.border}`,
                    }}
                  >
                    {/* Index */}
                    <div
                      style={{
                        width: "20px", height: "20px", borderRadius: "50%",
                        background: "#4338CA",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#fff", fontSize: "10px", fontWeight: 800,
                        fontFamily: DS.font.family, flexShrink: 0,
                      }}
                    >
                      {i + 1}
                    </div>

                    {/* Label */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "1px" }}>
                        <span style={{ color: "#6366F1" }}>{ts.icon}</span>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            color: "#4338CA",
                            fontFamily: DS.font.family,
                          }}
                        >
                          {ts.label}
                        </span>
                        <span
                          style={{
                            fontSize: "10px",
                            color: DS.colors.textMuted,
                            fontFamily: DS.font.family,
                          }}
                        >
                          · {ts.labelZh}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: DS.colors.textSecondary,
                          fontFamily: "'Courier New', monospace",
                          wordBreak: "break-all",
                        }}
                      >
                        {ts.value}
                      </div>
                    </div>

                    {/* Verified badge */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "3px",
                        background: "#D1FAE5",
                        border: "1px solid #6EE7B7",
                        borderRadius: DS.radius.full,
                        padding: "2px 7px",
                        flexShrink: 0,
                      }}
                    >
                      <CheckCircle2 size={10} color="#065F46" />
                      <span style={{ fontSize: "10px", fontWeight: 700, color: "#065F46", fontFamily: DS.font.family }}>
                        Verified
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Confirm CTA */}
            <div style={{ padding: "14px 16px" }}>
              <button
                onClick={onConfirm}
                disabled={confirmed}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "12px 20px",
                  background: confirmed ? DS.colors.secondary : "#312E81",
                  border: "none",
                  borderRadius: DS.radius.lg,
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#fff",
                  cursor: confirmed ? "not-allowed" : "pointer",
                  fontFamily: DS.font.family,
                  boxShadow: confirmed ? "none" : "0 4px 14px rgba(49,46,129,0.4)",
                  transition: "all 0.2s",
                }}
              >
                {confirmed ? (
                  <>
                    <CheckCircle2 size={15} />
                    Written to Knowledge Graph ✓
                  </>
                ) : (
                  <>
                    <Database size={15} />
                    Confirm & Write to Knowledge Graph
                  </>
                )}
              </button>
              {confirmed && (
                <div
                  style={{
                    marginTop: "10px",
                    background: "#F0FDF4",
                    border: "1px solid #86EFAC",
                    borderRadius: DS.radius.md,
                    padding: "10px 12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    animation: "fadeInUp 0.3s ease-out",
                  }}
                >
                  <CheckCircle2 size={14} color="#15803D" />
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "#15803D", fontFamily: DS.font.family }}>
                      Record committed · knowledgegraph://portfolio/G2-CLIMATE-001
                    </div>
                    <div style={{ fontSize: "11px", color: "#166534", fontFamily: DS.font.family }}>
                      Portfolio updated · Audit log entry created · GSheet synced
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Keyframe injection ───────────────────────────────────────────────────────
const KEYFRAMES = `
  @keyframes scanLine {
    0%   { top: 20%;  opacity: 0.8; }
    50%  { top: 80%;  opacity: 1;   }
    100% { top: 20%;  opacity: 0.8; }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.3; }
  }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0);   }
  }
  @keyframes slideInRight {
    from { opacity: 0; transform: translateX(24px); }
    to   { opacity: 1; transform: translateX(0);    }
  }
  @keyframes spin {
    from { transform: rotate(0deg);   }
    to   { transform: rotate(360deg); }
  }
`;

// ─── Main Orchestrator ────────────────────────────────────────────────────────
export const Screen05_Module5Flow: React.FC = () => {
  const [frame, setFrame]                 = useState<FlowFrame>(1);
  const [students, setStudents]           = useState<Student[]>(ALL_STUDENTS);
  const [scanActive, setScanActive]       = useState(true);
  const [lastScanned, setLastScanned]     = useState<Student | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<number | null>(2);
  const [confirmed, setConfirmed]         = useState(false);
  const scanTimers                        = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Trigger the scan sequence when frame=1 and scanner is active
  useEffect(() => {
    if (frame !== 1 || !scanActive) return;

    // Reset any pending timers before starting
    scanTimers.current.forEach(clearTimeout);
    scanTimers.current = [];

    SCAN_SEQUENCE.forEach(({ studentId, delay, time }) => {
      const t = setTimeout(() => {
        setStudents((prev) => {
          const already = prev.find((s) => s.id === studentId && s.status === "present");
          if (already) return prev;
          return prev.map((s) =>
            s.id === studentId ? { ...s, status: "present", scannedAt: time } : s
          );
        });
        setLastScanned((prev) => {
          const found = ALL_STUDENTS.find((s) => s.id === studentId);
          return found ? { ...found, status: "present", scannedAt: time } : prev;
        });
      }, delay);
      scanTimers.current.push(t);
    });

    return () => scanTimers.current.forEach(clearTimeout);
  }, [frame, scanActive]);

  const handleFrameTransition = (target: FlowFrame) => {
    if (target <= frame) {
      setFrame(target);
      return;
    }
    setFrame(target);
  };

  const presentStudents = students.filter((s) => s.status === "present");

  return (
    <div style={{ fontFamily: DS.font.family, background: DS.colors.background, minHeight: "100vh", padding: "24px" }}>
      {/* Inject keyframes */}
      <style>{KEYFRAMES}</style>

      {/* Journey Step Indicator */}
      <JourneyStepIndicator current={frame} onStep={handleFrameTransition} />

      {/* Frame content */}
      {frame === 1 && (
        <Frame1_Scanning
          students={students}
          onComplete={() => handleFrameTransition(2)}
          scanActive={scanActive}
          setScanActive={setScanActive}
          lastScanned={lastScanned}
        />
      )}

      {frame === 2 && (
        <Frame2_GroupMatrix
          students={presentStudents}
          selectedGroup={selectedGroup}
          onSelectGroup={setSelectedGroup}
          onProceed={() => selectedGroup !== null && handleFrameTransition(3)}
        />
      )}

      {frame === 3 && selectedGroup !== null && (
        <Frame3_AIScaffold
          selectedGroup={selectedGroup}
          students={presentStudents}
          onConfirm={() => setConfirmed(true)}
          confirmed={confirmed}
        />
      )}
    </div>
  );
};
