/**
 * Screen07_PortfolioLibrary.tsx
 * Git submodule: ui/portfolio-library
 * Tender: Module 6b — Exemplar & Portfolio Library
 *
 * Architecture:
 *  - <Screen07_PortfolioLibrary>  — orchestrator, owns all UI state
 *  - <PortfolioRow>               — pure presentational card row
 *  - <StudentDetailDrawer>        — pure presentational slide-out panel
 *    Props contract is the single boundary; no component fetches its own data.
 */

import React, { useState } from "react";
import {
  Search, Download, Archive, Share2, Sparkles, Upload, Star,
  ChevronDown, X, FileText, Clock, CheckCircle2, User, AlertCircle,
  Send, ShieldAlert, Link, Eye, RefreshCw,
} from "lucide-react";
import {
  DS, Card, Btn, SectionHeader, StatCard, FloatingBatchActionBar,
  StatusBadge, DataPrivacyShield,
} from "./DesignSystem";

// ═══════════════════════════════════════════════════════════════════════════
// §1  TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface TimelineEntry {
  label: string;
  time: string;
  status: "done" | "pending" | "waiting";
  icon?: React.ReactNode;
}

interface ArtifactItem {
  filename: string;
  fileType: string;
  version: string;
  sizeMb: string;
  status: "draft" | "final" | "under-review";
  uploadedAt: string;
}

export interface DrawerData {
  studentToken: string;
  group: string;
  currentRole: string;
  roleStatus: "pending" | "confirmed" | "rejected";
  timeline: TimelineEntry[];
  artifacts: ArtifactItem[];
  syncTimestamp: string;
  portalUrl: string;
}

interface PortfolioItem {
  id: number;
  subject: string;
  subjectColor: string;
  headerBg: string;
  studentName: string;
  title: string;
  score: number;
  skills: string[];
  submitted: string;
  extraContent?: string;
  drawer: DrawerData;
}

// ═══════════════════════════════════════════════════════════════════════════
// §2  MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════

const PORTFOLIO_ITEMS: PortfolioItem[] = [
  {
    id: 1,
    subject: "Mathematics",
    subjectColor: DS.colors.primary,
    headerBg: DS.colors.primaryLight,
    studentName: "S. Chan 陳**",
    title: "Polynomial Functions — Graphical Analysis",
    score: 92,
    skills: ["Calculus", "Graph Theory", "Critical Thinking"],
    submitted: "Jan 15, 2026",
    extraContent: "Demonstrated strong command of polynomial transformations with clear visual representations and step-by-step workings.",
    drawer: {
      studentToken: "Student #SCH-2201",
      group: "B",
      currentRole: "Leader",
      roleStatus: "confirmed",
      timeline: [
        { label: "Assigned by Tr. T. Chan", time: "Aug 1, 08:45", status: "done", icon: <User size={11} /> },
        { label: "Notification Read by Student", time: "Aug 1, 09:10", status: "done", icon: <CheckCircle2 size={11} /> },
        { label: "Role Accepted by Student", time: "Aug 1, 09:22", status: "done", icon: <CheckCircle2 size={11} /> },
      ],
      artifacts: [
        { filename: "Polynomial_Analysis_Final.pdf", fileType: "PDF", version: "v2", sizeMb: "1.8 MB", status: "final", uploadedAt: "Jan 15, 14:22" },
      ],
      syncTimestamp: "2026-08-01 14:35:44 HKT",
      portalUrl: "knowledgegraph://portfolio/SCH-2201-MATH-001",
    },
  },
  {
    id: 2,
    subject: "English",
    subjectColor: DS.colors.secondary,
    headerBg: DS.colors.secondaryLight,
    studentName: "W. Lam 林**",
    title: "Environmental Essay Draft — Climate Policy",
    score: 88,
    skills: ["Academic Writing", "Argumentation"],
    submitted: "Jan 18, 2026",
    drawer: {
      studentToken: "Student #WLM-4490",
      group: "C",
      currentRole: "Researcher",
      roleStatus: "confirmed",
      timeline: [
        { label: "Assigned by Tr. T. Chan", time: "Aug 1, 08:45", status: "done", icon: <User size={11} /> },
        { label: "Notification Read by Student", time: "Aug 1, 09:55", status: "done", icon: <CheckCircle2 size={11} /> },
        { label: "Role Accepted by Student", time: "Aug 1, 10:30", status: "done", icon: <CheckCircle2 size={11} /> },
      ],
      artifacts: [
        { filename: "Climate_Policy_Essay_v3.docx", fileType: "DOCX", version: "v3", sizeMb: "0.6 MB", status: "final", uploadedAt: "Jan 18, 11:05" },
      ],
      syncTimestamp: "2026-08-01 14:35:44 HKT",
      portalUrl: "knowledgegraph://portfolio/WLM-4490-ENG-001",
    },
  },
  {
    // Row 3 — Wong Ka Yan · Group A · Presenter (Pending) — default open
    id: 3,
    subject: "Chemistry",
    subjectColor: DS.colors.warning,
    headerBg: DS.colors.warningLight,
    studentName: "W.K.Y. Wong 王**",
    title: "Acid-Base Titration Lab Report",
    score: 95,
    skills: ["Lab Skills", "Data Analysis", "Scientific Writing", "Precision"],
    submitted: "Jan 12, 2026",
    extraContent: "Outstanding experimental design with excellent error analysis. Calculations verified against theoretical values.",
    drawer: {
      studentToken: "Student #WKY-1029",
      group: "A",
      currentRole: "Presenter",
      roleStatus: "pending",
      timeline: [
        { label: "Assigned by Tr. T. Chan", time: "Aug 1, 09:00", status: "done",    icon: <User size={11} /> },
        { label: "Notification Read by Student", time: "Aug 1, 10:15", status: "done",    icon: <CheckCircle2 size={11} /> },
        { label: "Pending Acceptance…",          time: "",            status: "pending", icon: <Clock size={11} /> },
      ],
      artifacts: [
        { filename: "Climate_Change_Slides_v1.pdf", fileType: "PDF", version: "v1", sizeMb: "2.4 MB", status: "draft", uploadedAt: "Aug 1, 08:30" },
      ],
      syncTimestamp: "2026-08-01 14:35:46 HKT",
      portalUrl: "knowledgegraph://portfolio/WKY-1029-CHEM-001",
    },
  },
  {
    id: 4,
    subject: "Chinese",
    subjectColor: "#DC2626",
    headerBg: "#FEE2E2",
    studentName: "H. Ng 吳**",
    title: "古典文學賞析 — 蘇軾詞研究",
    score: 91,
    skills: ["文學分析", "古典漢語", "批判性思維"],
    submitted: "Jan 20, 2026",
    drawer: {
      studentToken: "Student #HNG-3380",
      group: "D",
      currentRole: "Recorder",
      roleStatus: "confirmed",
      timeline: [
        { label: "Assigned by Tr. T. Chan", time: "Aug 1, 08:45", status: "done", icon: <User size={11} /> },
        { label: "Notification Read by Student", time: "Aug 1, 09:30", status: "done", icon: <CheckCircle2 size={11} /> },
        { label: "Role Accepted by Student", time: "Aug 1, 09:45", status: "done", icon: <CheckCircle2 size={11} /> },
      ],
      artifacts: [
        { filename: "Su_Shi_Analysis_Final.pdf", fileType: "PDF", version: "v2", sizeMb: "1.1 MB", status: "final", uploadedAt: "Jan 20, 16:00" },
      ],
      syncTimestamp: "2026-08-01 14:35:44 HKT",
      portalUrl: "knowledgegraph://portfolio/HNG-3380-CHI-001",
    },
  },
  {
    id: 5,
    subject: "Physics",
    subjectColor: DS.colors.primary,
    headerBg: DS.colors.primaryLight,
    studentName: "T. Ho 何**",
    title: "Newton's Laws — Motion Simulation Study",
    score: 87,
    skills: ["Simulation", "Physics", "Report Writing"],
    submitted: "Jan 22, 2026",
    extraContent: "Used GeoGebra to model projectile motion. Results aligned with theoretical predictions within 2% margin.",
    drawer: {
      studentToken: "Student #THO-5571",
      group: "B",
      currentRole: "Support",
      roleStatus: "confirmed",
      timeline: [
        { label: "Assigned by Tr. T. Chan", time: "Aug 1, 08:45", status: "done", icon: <User size={11} /> },
        { label: "Notification Read by Student", time: "Aug 1, 10:00", status: "done", icon: <CheckCircle2 size={11} /> },
        { label: "Role Accepted by Student", time: "Aug 1, 10:12", status: "done", icon: <CheckCircle2 size={11} /> },
      ],
      artifacts: [
        { filename: "Newton_Motion_Sim_v2.pdf", fileType: "PDF", version: "v2", sizeMb: "3.1 MB", status: "final", uploadedAt: "Jan 22, 12:30" },
      ],
      syncTimestamp: "2026-08-01 14:35:44 HKT",
      portalUrl: "knowledgegraph://portfolio/THO-5571-PHY-001",
    },
  },
  {
    id: 6,
    subject: "Biology",
    subjectColor: DS.colors.secondary,
    headerBg: DS.colors.secondaryLight,
    studentName: "C. Yip 葉**",
    title: "Cell Division — Mitosis vs Meiosis Comparative",
    score: 84,
    skills: ["Cell Biology", "Comparison", "Diagram"],
    submitted: "Jan 25, 2026",
    drawer: {
      studentToken: "Student #CYP-6612",
      group: "C",
      currentRole: "Researcher",
      roleStatus: "confirmed",
      timeline: [
        { label: "Assigned by Tr. T. Chan", time: "Aug 1, 08:45", status: "done", icon: <User size={11} /> },
        { label: "Notification Read by Student", time: "Aug 1, 11:00", status: "done", icon: <CheckCircle2 size={11} /> },
        { label: "Role Accepted by Student", time: "Aug 1, 11:20", status: "done", icon: <CheckCircle2 size={11} /> },
      ],
      artifacts: [
        { filename: "Cell_Division_Diagram.pdf", fileType: "PDF", version: "v1", sizeMb: "0.9 MB", status: "final", uploadedAt: "Jan 25, 09:15" },
      ],
      syncTimestamp: "2026-08-01 14:35:44 HKT",
      portalUrl: "knowledgegraph://portfolio/CYP-6612-BIO-001",
    },
  },
  {
    id: 7,
    subject: "Mathematics",
    subjectColor: DS.colors.warning,
    headerBg: DS.colors.warningLight,
    studentName: "R. Cheung 張**",
    title: "Statistics & Probability — Binomial Distribution",
    score: 79,
    skills: ["Statistics", "Problem Solving"],
    submitted: "Jan 28, 2026",
    extraContent: "Applied binomial theorem to real-world data sets. Showed clear understanding of expected value concepts.",
    drawer: {
      studentToken: "Student #RCH-7745",
      group: "D",
      currentRole: "Observer",
      roleStatus: "confirmed",
      timeline: [
        { label: "Assigned by Tr. T. Chan", time: "Aug 1, 08:45", status: "done", icon: <User size={11} /> },
        { label: "Notification Read by Student", time: "Aug 1, 13:00", status: "done", icon: <CheckCircle2 size={11} /> },
        { label: "Role Accepted by Student", time: "Aug 1, 13:22", status: "done", icon: <CheckCircle2 size={11} /> },
      ],
      artifacts: [
        { filename: "Binomial_Analysis_v2.xlsx", fileType: "XLSX", version: "v2", sizeMb: "0.4 MB", status: "final", uploadedAt: "Jan 28, 15:40" },
      ],
      syncTimestamp: "2026-08-01 14:35:44 HKT",
      portalUrl: "knowledgegraph://portfolio/RCH-7745-MATH-002",
    },
  },
  {
    id: 8,
    subject: "History",
    subjectColor: "#7C3AED",
    headerBg: "#EDE9FE",
    studentName: "M. Fung 馮**",
    title: "Cold War Era — Hong Kong's Political Landscape",
    score: 93,
    skills: ["Historical Analysis", "Research", "Primary Sources", "Citation"],
    submitted: "Jan 10, 2026",
    drawer: {
      studentToken: "Student #MFG-8830",
      group: "A",
      currentRole: "Leader",
      roleStatus: "confirmed",
      timeline: [
        { label: "Assigned by Tr. T. Chan", time: "Aug 1, 08:45", status: "done", icon: <User size={11} /> },
        { label: "Notification Read by Student", time: "Aug 1, 09:05", status: "done", icon: <CheckCircle2 size={11} /> },
        { label: "Role Accepted by Student", time: "Aug 1, 09:15", status: "done", icon: <CheckCircle2 size={11} /> },
      ],
      artifacts: [
        { filename: "HK_ColdWar_Research_v3.pdf", fileType: "PDF", version: "v3", sizeMb: "4.2 MB", status: "final", uploadedAt: "Jan 10, 10:50" },
      ],
      syncTimestamp: "2026-08-01 14:35:44 HKT",
      portalUrl: "knowledgegraph://portfolio/MFG-8830-HIS-001",
    },
  },
  {
    id: 9,
    subject: "ICT",
    subjectColor: "#0891B2",
    headerBg: "#E0F2FE",
    studentName: "J. Liu 廖**",
    title: "Database Design — School Library System ERD",
    score: 96,
    skills: ["SQL", "ERD Design", "Normalization"],
    submitted: "Feb 01, 2026",
    extraContent: "Fully normalized schema to 3NF with comprehensive ER diagram. Includes stored procedures and trigger definitions.",
    drawer: {
      studentToken: "Student #JLU-9920",
      group: "B",
      currentRole: "Presenter",
      roleStatus: "confirmed",
      timeline: [
        { label: "Assigned by Tr. T. Chan", time: "Aug 1, 08:45", status: "done", icon: <User size={11} /> },
        { label: "Notification Read by Student", time: "Aug 1, 09:02", status: "done", icon: <CheckCircle2 size={11} /> },
        { label: "Role Accepted by Student", time: "Aug 1, 09:10", status: "done", icon: <CheckCircle2 size={11} /> },
      ],
      artifacts: [
        { filename: "Library_ERD_v2.pdf", fileType: "PDF", version: "v2", sizeMb: "1.6 MB", status: "final", uploadedAt: "Feb 01, 08:55" },
        { filename: "Library_Schema.sql", fileType: "SQL", version: "v1", sizeMb: "0.1 MB", status: "final", uploadedAt: "Feb 01, 09:00" },
      ],
      syncTimestamp: "2026-08-01 14:35:44 HKT",
      portalUrl: "knowledgegraph://portfolio/JLU-9920-ICT-001",
    },
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// §3  STUDENT DETAIL DRAWER — Pure Presentational
// ═══════════════════════════════════════════════════════════════════════════

interface StudentDetailDrawerProps {
  item: PortfolioItem;
  onClose: () => void;
  onSendReminder: () => void;
  onForceConfirm: () => void;
  reminderSent: boolean;
  forceConfirmed: boolean;
}

const FILE_TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  PDF:  { bg: "#FEE2E2", color: "#DC2626" },
  DOCX: { bg: "#DBEAFE", color: "#1D4ED8" },
  XLSX: { bg: "#D1FAE5", color: "#065F46" },
  SQL:  { bg: "#F3E8FF", color: "#6D28D9" },
  PPTX: { bg: "#FEF3C7", color: "#92400E" },
};

const ARTIFACT_STATUS_CONFIG = {
  draft:        { label: "Draft",        color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
  final:        { label: "Final",        color: "#059669", bg: "#ECFDF5", border: "#A7F3D0" },
  "under-review":{ label: "Under Review", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE" },
};

const StudentDetailDrawer: React.FC<StudentDetailDrawerProps> = ({
  item, onClose, onSendReminder, onForceConfirm, reminderSent, forceConfirmed,
}) => {
  const { drawer } = item;
  const isPending  = drawer.roleStatus === "pending";
  const scoreColor = item.score >= 90 ? DS.colors.secondary : item.score >= 80 ? DS.colors.primary : DS.colors.warning;

  return (
    <>
      {/* ── Dim overlay ────────────────────────────────────────────────── */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15,23,42,0.45)",
          backdropFilter: "blur(2px)",
          zIndex: 400,
          cursor: "pointer",
        }}
      />

      {/* ── Slide-out drawer ────────────────────────────────────────────── */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "480px",
          background: DS.colors.surface,
          boxShadow: "-8px 0 32px rgba(0,0,0,0.18)",
          zIndex: 500,
          display: "flex",
          flexDirection: "column",
          animation: "drawerSlideIn 0.28s cubic-bezier(0.22,1,0.36,1)",
          borderLeft: `1px solid ${DS.colors.border}`,
        }}
      >
        <style>{`
          @keyframes drawerSlideIn {
            from { transform: translateX(100%); opacity: 0.6; }
            to   { transform: translateX(0);    opacity: 1;   }
          }
          @keyframes pendingPulse {
            0%,100% { opacity: 1; } 50% { opacity: 0.3; }
          }
          @keyframes timelineDrop {
            from { opacity:0; transform:translateY(-6px); }
            to   { opacity:1; transform:translateY(0);    }
          }
        `}</style>

        {/* ══ HEADER ══════════════════════════════════════════════════════ */}
        <div style={{
          padding: "18px 20px 14px",
          borderBottom: `1px solid ${DS.colors.border}`,
          background: `linear-gradient(135deg,#0F172A 0%,#1E1B4B 60%,#1A3A6B 100%)`,
          flexShrink: 0,
        }}>
          {/* Top row: breadcrumb + close */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "10px", fontWeight: 800, padding: "2px 6px", background: item.subjectColor, color: "#fff", borderRadius: "3px", fontFamily: DS.font.family }}>
                {item.subject}
              </span>
              <span style={{ fontSize: "10px", color: "#64748B", fontFamily: DS.font.family }}>
                / Group {drawer.group} / Student Detail
              </span>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "6px",
                width: "28px", height: "28px",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "#94A3B8",
                transition: "background 0.15s",
              }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Token + shield */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#F1F5F9", margin: 0, fontFamily: DS.font.family }}>
              {drawer.studentToken}
            </h2>
            <DataPrivacyShield label="PDPO Cl.6.1 🛡️" />
          </div>

          {/* Submission title */}
          <div style={{ marginTop: "8px", fontSize: "12px", color: "#94A3B8", fontFamily: DS.font.family, lineHeight: 1.4 }}>
            {item.title}
          </div>

          {/* Score + role chips */}
          <div style={{ marginTop: "10px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, padding: "3px 10px", background: `${scoreColor}22`, color: scoreColor, border: `1px solid ${scoreColor}40`, borderRadius: DS.radius.full, fontFamily: DS.font.family, display: "flex", alignItems: "center", gap: "4px" }}>
              <Star size={11} fill={scoreColor} color={scoreColor} /> {item.score}/100
            </span>
            <span style={{
              fontSize: "12px", fontWeight: 700, padding: "3px 10px",
              background: isPending ? "#FEF3C7" : "#D1FAE5",
              color: isPending ? "#92400E" : "#065F46",
              border: `1px solid ${isPending ? "#FDE68A" : "#6EE7B7"}`,
              borderRadius: DS.radius.full, fontFamily: DS.font.family,
              display: "flex", alignItems: "center", gap: "4px",
            }}>
              {isPending ? <AlertCircle size={11} /> : <CheckCircle2 size={11} />}
              {drawer.currentRole} · {isPending ? "Pending" : "Confirmed"}
            </span>
          </div>
        </div>

        {/* ══ SCROLLABLE BODY ═════════════════════════════════════════════ */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0" }}>

          {/* ── SECTION 1: Role Status & Audit Trail ─────────────────── */}
          <div style={{ padding: "18px 20px", borderBottom: `1px solid ${DS.colors.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
              <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: DS.colors.primaryLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <User size={12} color={DS.colors.primary} />
              </div>
              <div>
                <div style={{ fontSize: "12px", fontWeight: 800, color: DS.colors.textPrimary, fontFamily: DS.font.family }}>
                  Section 1 — Role Status & Audit Trail
                </div>
                <div style={{ fontSize: "10px", color: DS.colors.textMuted, fontFamily: DS.font.family }}>
                  Module B · Role Anchoring · Clause 6 verified
                </div>
              </div>
              <div style={{ marginLeft: "auto" }}>
                <StatusBadge
                  variant={isPending ? "pending" : "synced"}
                  label={isPending ? "Pending" : "Confirmed"}
                  size="sm"
                />
              </div>
            </div>

            {/* Role card */}
            <div style={{
              padding: "10px 14px",
              background: isPending ? "#FFFBEB" : "#F0FDF4",
              border: `1px solid ${isPending ? "#FDE68A" : "#A7F3D0"}`,
              borderRadius: DS.radius.md,
              marginBottom: "16px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div>
                <div style={{ fontSize: "10px", color: DS.colors.textMuted, fontFamily: DS.font.family, marginBottom: "2px" }}>
                  Current Role Assignment
                </div>
                <div style={{ fontSize: "16px", fontWeight: 800, color: DS.colors.textPrimary, fontFamily: DS.font.family }}>
                  {drawer.currentRole}
                </div>
              </div>
              <span style={{
                fontSize: "11px", fontWeight: 700,
                padding: "4px 10px",
                background: isPending ? "#FEF3C7" : "#D1FAE5",
                color: isPending ? "#92400E" : "#065F46",
                border: `1px solid ${isPending ? "#FDE68A" : "#6EE7B7"}`,
                borderRadius: DS.radius.full, fontFamily: DS.font.family,
              }}>
                {isPending ? "⏳ Pending Acceptance" : "✓ Confirmed"}
              </span>
            </div>

            {/* Vertical timeline */}
            <div style={{ paddingLeft: "8px" }}>
              {drawer.timeline.map((entry, i) => {
                const isLast    = i === drawer.timeline.length - 1;
                const isPend    = entry.status === "pending";
                const dotColor  = entry.status === "done" ? DS.colors.secondary : isPend ? DS.colors.warning : DS.colors.border;
                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      gap: "12px",
                      position: "relative",
                      paddingBottom: isLast ? "0" : "16px",
                      animation: `timelineDrop 0.3s ease-out ${i * 0.08}s both`,
                    }}
                  >
                    {/* Connector line */}
                    {!isLast && (
                      <div style={{
                        position: "absolute",
                        left: "9px",
                        top: "20px",
                        bottom: "0",
                        width: "2px",
                        background: entry.status === "done" ? `${DS.colors.secondary}40` : "#E5E7EB",
                        borderRadius: "1px",
                      }} />
                    )}
                    {/* Dot */}
                    <div style={{
                      width: "20px", height: "20px", borderRadius: "50%",
                      background: entry.status === "done" ? DS.colors.secondary : isPend ? DS.colors.warning + "22" : "#F3F4F6",
                      border: `2px solid ${dotColor}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, zIndex: 1,
                      animation: isPend ? "pendingPulse 1.8s ease-in-out infinite" : "none",
                    }}>
                      <span style={{ color: entry.status === "done" ? "#fff" : dotColor }}>
                        {entry.icon}
                      </span>
                    </div>
                    {/* Content */}
                    <div style={{ paddingTop: "1px", flex: 1 }}>
                      <div style={{
                        fontSize: "13px",
                        fontWeight: entry.status === "done" ? 500 : 700,
                        color: isPend ? DS.colors.warning : DS.colors.textPrimary,
                        fontFamily: DS.font.family,
                        display: "flex", alignItems: "center", gap: "6px",
                      }}>
                        {entry.label}
                        {isPend && (
                          <span style={{ display: "inline-flex", gap: "2px" }}>
                            {[0, 1, 2].map(d => (
                              <span key={d} style={{ width: "4px", height: "4px", borderRadius: "50%", background: DS.colors.warning, animation: `pendingPulse 1.4s ease-in-out ${d * 0.25}s infinite`, display: "inline-block" }} />
                            ))}
                          </span>
                        )}
                      </div>
                      {entry.time && (
                        <div style={{ fontSize: "11px", color: DS.colors.textMuted, fontFamily: DS.font.family, marginTop: "1px", display: "flex", alignItems: "center", gap: "4px" }}>
                          <Clock size={10} /> {entry.time}
                          {entry.status === "done" && <span style={{ color: DS.colors.secondary, fontWeight: 700 }}>✓ Logged</span>}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── SECTION 2: Artifact Preview (Module B) ───────────────── */}
          <div style={{ padding: "18px 20px", borderBottom: `1px solid ${DS.colors.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
              <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#EDE9FE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <FileText size={12} color="#7C3AED" />
              </div>
              <div>
                <div style={{ fontSize: "12px", fontWeight: 800, color: DS.colors.textPrimary, fontFamily: DS.font.family }}>
                  Section 2 — Artifact Preview
                </div>
                <div style={{ fontSize: "10px", color: DS.colors.textMuted, fontFamily: DS.font.family }}>
                  Module B · Submission Artifacts · {drawer.artifacts.length} file{drawer.artifacts.length !== 1 ? "s" : ""}
                </div>
              </div>
            </div>

            {drawer.artifacts.map((artifact, i) => {
              const ftc = FILE_TYPE_COLORS[artifact.fileType] ?? { bg: "#F3F4F6", color: "#6B7280" };
              const asc = ARTIFACT_STATUS_CONFIG[artifact.status];
              return (
                <div
                  key={i}
                  style={{
                    border: `1px solid ${DS.colors.border}`,
                    borderRadius: DS.radius.lg,
                    overflow: "hidden",
                    background: DS.colors.surface,
                    boxShadow: DS.shadow.sm,
                    marginBottom: i < drawer.artifacts.length - 1 ? "10px" : "0",
                  }}
                >
                  {/* File thumbnail / preview area */}
                  <div style={{
                    height: "88px",
                    background: `linear-gradient(135deg,${ftc.bg} 0%,${ftc.bg}88 100%)`,
                    borderBottom: `1px solid ${DS.colors.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    position: "relative",
                    gap: "12px",
                  }}>
                    {/* Big file icon */}
                    <div style={{
                      width: "52px", height: "64px", borderRadius: "4px",
                      background: DS.colors.surface,
                      border: `1px solid ${DS.colors.border}`,
                      boxShadow: DS.shadow.sm,
                      display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "space-between",
                      padding: "6px 4px 4px",
                      position: "relative",
                    }}>
                      {/* Dog-ear fold */}
                      <div style={{ position: "absolute", top: 0, right: 0, width: 0, height: 0, borderStyle: "solid", borderWidth: "0 10px 10px 0", borderColor: `transparent ${ftc.bg} transparent transparent` }} />
                      <FileText size={22} color={ftc.color} />
                      <span style={{ fontSize: "8px", fontWeight: 900, color: ftc.color, letterSpacing: "0.05em" }}>{artifact.fileType}</span>
                    </div>
                    {/* File name + meta */}
                    <div>
                      <div style={{ fontSize: "12px", fontWeight: 700, color: DS.colors.textPrimary, fontFamily: DS.font.family, marginBottom: "3px", maxWidth: "280px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {artifact.filename}
                      </div>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "10px", color: DS.colors.textMuted, fontFamily: DS.font.family }}>{artifact.version}</span>
                        <span style={{ fontSize: "10px", color: DS.colors.textMuted, fontFamily: DS.font.family }}>·</span>
                        <span style={{ fontSize: "10px", color: DS.colors.textMuted, fontFamily: DS.font.family }}>{artifact.sizeMb}</span>
                        <span style={{ fontSize: "10px", color: DS.colors.textMuted, fontFamily: DS.font.family }}>·</span>
                        <span style={{ fontSize: "10px", fontWeight: 700, color: asc.color, background: asc.bg, padding: "1px 6px", borderRadius: "3px", border: `1px solid ${asc.border}`, fontFamily: DS.font.family }}>
                          {asc.label}
                        </span>
                      </div>
                    </div>
                    {/* Uploaded timestamp */}
                    <div style={{ position: "absolute", bottom: "6px", right: "10px", fontSize: "10px", color: DS.colors.textMuted, fontFamily: DS.font.family }}>
                      Uploaded {artifact.uploadedAt}
                    </div>
                  </div>

                  {/* Action row */}
                  <div style={{ padding: "8px 14px", display: "flex", gap: "8px", alignItems: "center" }}>
                    <button style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "5px 12px", background: DS.colors.primaryLight, border: `1px solid #BFDBFE`, borderRadius: DS.radius.sm, fontSize: "11px", fontWeight: 600, color: DS.colors.primary, cursor: "pointer", fontFamily: DS.font.family }}>
                      <Eye size={11} /> Preview
                    </button>
                    <button style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "5px 12px", background: "transparent", border: `1px solid ${DS.colors.border}`, borderRadius: DS.radius.sm, fontSize: "11px", color: DS.colors.textSecondary, cursor: "pointer", fontFamily: DS.font.family }}>
                      <Download size={11} /> Download
                    </button>
                    <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "4px" }}>
                      <DataPrivacyShield label="De-id ✓" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Knowledge Graph link ─────────────────────────────────── */}
          <div style={{ padding: "12px 20px", background: "#F8FAFC", borderBottom: `1px solid ${DS.colors.border}` }}>
            <div style={{ fontSize: "10px", color: DS.colors.textMuted, fontFamily: DS.font.family, marginBottom: "4px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>
              Knowledge Graph URI
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Link size={11} color={DS.colors.primary} />
              <span style={{ fontSize: "11px", color: DS.colors.primary, fontFamily: "'Courier New', monospace", wordBreak: "break-all" }}>
                {drawer.portalUrl}
              </span>
            </div>
          </div>
        </div>

        {/* ══ FOOTER — Actions + Audit Timestamps ══════════════════════════ */}
        <div style={{
          borderTop: `2px solid ${DS.colors.border}`,
          padding: "16px 20px 14px",
          background: DS.colors.surface,
          flexShrink: 0,
        }}>
          {/* Action buttons */}
          <div style={{ display: "flex", gap: "10px", marginBottom: "14px" }}>
            {/* Secondary — Send Reminder */}
            <button
              onClick={onSendReminder}
              disabled={reminderSent || !isPending}
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "7px",
                padding: "10px 0",
                background: reminderSent ? DS.colors.secondaryLight : DS.colors.surface,
                border: `1px solid ${reminderSent ? DS.colors.secondary : DS.colors.border}`,
                borderRadius: DS.radius.md,
                fontSize: "13px", fontWeight: 600,
                color: reminderSent ? DS.colors.secondary : isPending ? DS.colors.textPrimary : DS.colors.textMuted,
                cursor: reminderSent || !isPending ? "not-allowed" : "pointer",
                fontFamily: DS.font.family,
                opacity: !isPending ? 0.5 : 1,
                transition: "all 0.15s",
              }}
            >
              <Send size={13} />
              {reminderSent ? "Reminder Sent ✓" : "Send Reminder Ping"}
            </button>

            {/* Primary — Force Confirm */}
            <button
              onClick={onForceConfirm}
              disabled={forceConfirmed || !isPending}
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "7px",
                padding: "10px 0",
                background: forceConfirmed ? DS.colors.secondary : isPending ? "#312E81" : "#9CA3AF",
                border: "none",
                borderRadius: DS.radius.md,
                fontSize: "13px", fontWeight: 700,
                color: "#fff",
                cursor: forceConfirmed || !isPending ? "not-allowed" : "pointer",
                fontFamily: DS.font.family,
                boxShadow: forceConfirmed || !isPending ? "none" : "0 3px 10px rgba(49,46,129,0.32)",
                transition: "all 0.15s",
              }}
            >
              <ShieldAlert size={13} />
              {forceConfirmed ? "Override Applied ✓" : "Force Confirm Role (Override)"}
            </button>
          </div>

          {/* Audit Timestamps */}
          <div style={{
            padding: "10px 12px",
            background: "#F8FAFC",
            border: `1px solid ${DS.colors.border}`,
            borderRadius: DS.radius.md,
          }}>
            <div style={{ fontSize: "9px", fontWeight: 800, color: DS.colors.textMuted, fontFamily: DS.font.family, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
              <RefreshCw size={9} /> Audit Timestamps
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "10px", color: DS.colors.textSecondary, fontFamily: DS.font.family }}>
                  Modal data last synced
                </span>
                <span style={{ fontSize: "10px", fontWeight: 700, color: DS.colors.textPrimary, fontFamily: "'Courier New', monospace" }}>
                  {drawer.syncTimestamp}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "10px", color: DS.colors.textSecondary, fontFamily: DS.font.family }}>
                  Drawer render timestamp
                </span>
                <span style={{ fontSize: "10px", fontWeight: 700, color: DS.colors.textPrimary, fontFamily: "'Courier New', monospace" }}>
                  2026-08-01 14:36:02 HKT
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// §4  MAIN SCREEN — orchestrator
// ═══════════════════════════════════════════════════════════════════════════

export const Screen07_PortfolioLibrary: React.FC = () => {
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set([1, 3, 8]));
  const [searchQuery, setSearchQuery]     = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [levelFilter, setLevelFilter]     = useState("all");
  const [sortBy, setSortBy]               = useState("score-desc");

  // Drawer state — default open on Row 3 (Wong Ka Yan) per spec
  const [drawerItemId, setDrawerItemId]   = useState<number | null>(3);
  const [reminderSent, setReminderSent]   = useState(false);
  const [forceConfirmed, setForceConfirmed] = useState(false);

  const drawerItem = PORTFOLIO_ITEMS.find(p => p.id === drawerItemId) ?? null;

  const toggleItem = (id: number) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const openDrawer = (id: number) => {
    setDrawerItemId(id);
    setReminderSent(false);
    setForceConfirmed(false);
  };

  const closeDrawer = () => setDrawerItemId(null);

  const filteredItems = PORTFOLIO_ITEMS.filter(item => {
    if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !item.studentName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (subjectFilter !== "all" && item.subject !== subjectFilter) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === "score-desc") return b.score - a.score;
    if (sortBy === "score-asc")  return a.score - b.score;
    return 0;
  });

  return (
    <div style={{ background: DS.colors.background, minHeight: "100vh", fontFamily: DS.font.family, padding: "24px", position: "relative" }}>

      {/* Page header */}
      <div style={{ marginBottom: "20px" }}>
        <SectionHeader
          title="Exemplar & Portfolio Library"
          subtitle="模組六: 優秀成果課件庫 · Browse, manage and export student portfolios · Click any row to inspect"
          actions={
            <>
              <Btn variant="ghost" icon={<Upload size={15} />} style={{ border: `1px solid ${DS.colors.border}` }}>
                Import from eClass
              </Btn>
              <Btn variant="primary" icon={<Sparkles size={15} />}>
                Generate New Portfolio
              </Btn>
            </>
          }
        />
      </div>

      {/* Filter Bar */}
      <Card style={{ padding: "14px 20px", marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: "1 1 200px" }}>
            <Search size={15} color={DS.colors.textMuted} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }} />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search portfolios or students..."
              style={{ width: "100%", paddingLeft: "32px", paddingRight: "12px", paddingTop: "8px", paddingBottom: "8px", border: `1px solid ${DS.colors.border}`, borderRadius: DS.radius.md, fontSize: "14px", fontFamily: DS.font.family, outline: "none", color: DS.colors.textPrimary, boxSizing: "border-box" }}
            />
          </div>
          {[
            { value: subjectFilter, onChange: setSubjectFilter, opts: [["all","All Subjects"],["Mathematics","Mathematics"],["English","English"],["Chemistry","Chemistry"],["Physics","Physics"],["Biology","Biology"],["Chinese","Chinese"],["History","History"],["ICT","ICT"]] },
            { value: levelFilter,   onChange: setLevelFilter,   opts: [["all","All Levels"],["F1","Form 1"],["F2","Form 2"],["F3","Form 3"],["F4","Form 4"],["F5","Form 5"],["F6","Form 6"]] },
            { value: sortBy,        onChange: setSortBy,        opts: [["score-desc","Sort: Highest Score"],["score-asc","Sort: Lowest Score"],["newest","Sort: Newest First"]] },
          ].map((sel, i) => (
            <div key={i} style={{ position: "relative" }}>
              <select value={sel.value} onChange={e => sel.onChange(e.target.value)} style={{ padding: "8px 32px 8px 12px", border: `1px solid ${DS.colors.border}`, borderRadius: DS.radius.md, fontSize: "14px", fontFamily: DS.font.family, color: DS.colors.textPrimary, background: DS.colors.surface, cursor: "pointer", outline: "none", appearance: "none" }}>
                {sel.opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <ChevronDown size={14} color={DS.colors.textMuted} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            </div>
          ))}
        </div>
      </Card>

      {/* Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
        <StatCard label="Total Portfolios" value="347" delta="+12 this week" positive icon={<Archive size={18} color={DS.colors.primary} />} color={DS.colors.primary} />
        <StatCard label="Avg Quality Score" value="87.3" delta="+2.1 vs last term" positive icon={<Star size={18} color={DS.colors.warning} />} color={DS.colors.warning} />
        <StatCard label="Shared to Cloud" value="128" icon={<Share2 size={18} color={DS.colors.secondary} />} color={DS.colors.secondary} />
        <StatCard label="Pending Review" value="23" icon={<Download size={18} color={DS.colors.error} />} color={DS.colors.error} />
      </div>

      {/* Full-width card list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
        {filteredItems.map(item => {
          const isSelected  = selectedItems.has(item.id);
          const isDrawerOpen = drawerItemId === item.id;
          const scoreColor  = item.score >= 90 ? DS.colors.secondary : item.score >= 80 ? DS.colors.primary : DS.colors.warning;
          const isPending   = item.drawer.roleStatus === "pending";

          return (
            <div
              key={item.id}
              onClick={() => openDrawer(item.id)}
              style={{
                background: DS.colors.surface,
                borderRadius: DS.radius.lg,
                border: isDrawerOpen
                  ? `2px solid ${item.subjectColor}`
                  : isSelected
                    ? `2px solid ${DS.colors.primary}`
                    : `1px solid ${DS.colors.border}`,
                boxShadow: isDrawerOpen
                  ? `0 0 0 4px ${item.subjectColor}18, ${DS.shadow.md}`
                  : isSelected
                    ? `0 0 0 3px ${DS.colors.primaryLight}, ${DS.shadow.sm}`
                    : DS.shadow.sm,
                overflow: "hidden",
                transition: "box-shadow 0.15s, border-color 0.15s",
                display: "flex",
                width: "100%",
                cursor: "pointer",
                opacity: drawerItemId !== null && !isDrawerOpen ? 0.55 : 1,
                transform: isDrawerOpen ? "translateX(-3px)" : "translateX(0)",
              }}
            >
              {/* Left accent stripe */}
              <div style={{ width: "5px", background: item.subjectColor, flexShrink: 0 }} />

              {/* Checkbox */}
              <div
                style={{ display: "flex", alignItems: "center", padding: "0 14px", borderRight: `1px solid ${DS.colors.border}`, background: isSelected ? `${item.subjectColor}08` : DS.colors.background, flexShrink: 0 }}
                onClick={e => { e.stopPropagation(); toggleItem(item.id); }}
              >
                <input type="checkbox" checked={isSelected} onChange={() => toggleItem(item.id)} style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: item.subjectColor }} />
              </div>

              {/* Subject + score */}
              <div style={{ width: "130px", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px", padding: "16px 12px", borderRight: `1px solid ${DS.colors.border}`, background: item.headerBg }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: item.subjectColor, background: `${item.subjectColor}18`, padding: "4px 10px", borderRadius: DS.radius.full, border: `1px solid ${item.subjectColor}30`, letterSpacing: "0.04em", textAlign: "center" }}>
                  {item.subject}
                </span>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                  <span style={{ fontSize: "22px", fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{item.score}</span>
                  <span style={{ fontSize: "10px", color: DS.colors.textMuted }}>/100</span>
                  <Star size={13} color={scoreColor} fill={scoreColor} />
                </div>
              </div>

              {/* Main content */}
              <div style={{ flex: 1, padding: "14px 20px", minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", marginBottom: "8px" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: "11px", color: DS.colors.textMuted, marginBottom: "3px", display: "flex", alignItems: "center", gap: "8px" }}>
                      {item.studentName}
                      {/* PDPO token hint on the row */}
                      <span style={{ fontSize: "10px", fontWeight: 600, color: DS.colors.textMuted, background: "#F8FAFC", border: `1px solid ${DS.colors.border}`, padding: "1px 5px", borderRadius: "3px", fontFamily: "'Courier New', monospace" }}>
                        {item.drawer.studentToken}
                      </span>
                      <span style={{ fontSize: "10px", fontWeight: 700, color: "#475569", background: "#F1F5F9", padding: "1px 5px", borderRadius: "3px" }}>
                        Grp {item.drawer.group}
                      </span>
                    </div>
                    <div style={{ fontSize: "15px", fontWeight: 700, color: DS.colors.textPrimary, lineHeight: "1.35" }}>
                      {item.title}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px", flexShrink: 0 }}>
                    <span style={{ fontSize: "11px", color: DS.colors.textMuted, whiteSpace: "nowrap" }}>
                      {item.submitted}
                    </span>
                    {/* Role + status micro-badge */}
                    <span style={{
                      fontSize: "10px", fontWeight: 700, padding: "2px 7px",
                      background: isPending ? "#FEF3C7" : "#D1FAE5",
                      color: isPending ? "#92400E" : "#065F46",
                      border: `1px solid ${isPending ? "#FDE68A" : "#6EE7B7"}`,
                      borderRadius: DS.radius.full, fontFamily: DS.font.family,
                      display: "flex", alignItems: "center", gap: "3px", whiteSpace: "nowrap",
                    }}>
                      {isPending ? "⏳" : "✓"} {item.drawer.currentRole} · {isPending ? "Pending" : "Confirmed"}
                    </span>
                  </div>
                </div>

                {item.extraContent && (
                  <div style={{ fontSize: "12px", color: DS.colors.textSecondary, lineHeight: "1.55", background: DS.colors.background, padding: "8px 12px", borderRadius: DS.radius.sm, borderLeft: `3px solid ${item.subjectColor}`, marginBottom: "10px" }}>
                    {item.extraContent}
                  </div>
                )}

                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {item.skills.map(skill => (
                    <span key={skill} style={{ fontSize: "11px", padding: "3px 9px", background: DS.colors.background, border: `1px solid ${DS.colors.border}`, borderRadius: DS.radius.full, color: DS.colors.textSecondary, fontWeight: 500 }}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action column */}
              <div
                style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: "8px", padding: "16px 18px", borderLeft: `1px solid ${DS.colors.border}`, flexShrink: 0 }}
                onClick={e => e.stopPropagation()}
              >
                <button onClick={() => openDrawer(item.id)} style={{ background: item.subjectColor, border: "none", borderRadius: DS.radius.sm, padding: "6px 16px", fontSize: "12px", fontWeight: 600, cursor: "pointer", color: "#fff", fontFamily: DS.font.family, whiteSpace: "nowrap" }}>
                  {isDrawerOpen ? "Viewing ›" : "View"}
                </button>
                <button style={{ background: "none", border: `1px solid ${DS.colors.border}`, borderRadius: DS.radius.sm, padding: "6px 16px", fontSize: "12px", cursor: "pointer", color: DS.colors.textSecondary, fontFamily: DS.font.family, whiteSpace: "nowrap" }}>
                  Export
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Batch Action Bar */}
      <FloatingBatchActionBar
        selectedCount={selectedItems.size}
        onClear={() => setSelectedItems(new Set())}
        actions={[
          { label: "Batch Export PDFs", icon: <Download size={14} />, onClick: () => {}, variant: "primary" },
          { label: "Archive to Library", icon: <Archive size={14} />, onClick: () => {}, variant: "secondary" },
          { label: "Share Selected", icon: <Share2 size={14} />, onClick: () => {}, variant: "secondary" },
        ]}
      />

      {/* Slide-out Drawer (portal-style, fixed position) */}
      {drawerItem && (
        <StudentDetailDrawer
          item={drawerItem}
          onClose={closeDrawer}
          onSendReminder={() => setReminderSent(true)}
          onForceConfirm={() => setForceConfirmed(true)}
          reminderSent={reminderSent}
          forceConfirmed={forceConfirmed}
        />
      )}
    </div>
  );
};
