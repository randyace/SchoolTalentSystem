import React, { useState } from "react";
import { Upload, Sparkles, Lock, CheckCircle2, Star } from "lucide-react";
import {
  DS, Card, Btn, SectionHeader, InputField, SelectField,
} from "./DesignSystem";

// ─── Confidence Bar ───────────────────────────────────────────────────────────
const ConfidenceBar: React.FC<{ label: string; value: number }> = ({ label, value }) => {
  const color = value >= 95 ? DS.colors.secondary : value >= 85 ? DS.colors.primary : DS.colors.warning;
  return (
    <div style={{ fontFamily: DS.font.family }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
        <span style={{ fontSize: "12px", color: DS.colors.textSecondary, fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: "12px", fontWeight: 700, color }}>{value}%</span>
      </div>
      <div style={{ height: "6px", background: DS.colors.background, borderRadius: DS.radius.full }}>
        <div
          style={{
            height: "100%",
            width: `${value}%`,
            background: color,
            borderRadius: DS.radius.full,
            transition: "width 0.6s ease",
          }}
        />
      </div>
    </div>
  );
};

// ─── OCR Progress Bar ─────────────────────────────────────────────────────────
const OcrProgressBar: React.FC<{ value: number }> = ({ value }) => (
  <div style={{ fontFamily: DS.font.family }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
      <span style={{ fontSize: "12px", color: DS.colors.textSecondary }}>OCR Processing</span>
      <span style={{ fontSize: "12px", fontWeight: 700, color: DS.colors.secondary }}>{value}%</span>
    </div>
    <div style={{ height: "8px", background: "#D1FAE5", borderRadius: DS.radius.full }}>
      <div
        style={{
          height: "100%",
          width: `${value}%`,
          background: `linear-gradient(90deg, ${DS.colors.secondary}, #34D399)`,
          borderRadius: DS.radius.full,
          boxShadow: "0 0 8px rgba(16,185,129,0.4)",
        }}
      />
    </div>
  </div>
);

// ─── Mock Certificate ─────────────────────────────────────────────────────────
const MockCertificate: React.FC = () => (
  <div
    style={{
      background: "linear-gradient(135deg, #EBF2FF 0%, #F0FDF4 100%)",
      border: "3px dashed #93C5FD",
      borderRadius: DS.radius.lg,
      padding: "28px 20px",
      textAlign: "center",
      minHeight: "220px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "10px",
      fontFamily: DS.font.family,
      position: "relative",
    }}
  >
    {/* Certificate watermark border */}
    <div
      style={{
        position: "absolute",
        inset: "8px",
        border: "2px solid #BFDBFE",
        borderRadius: DS.radius.md,
        pointerEvents: "none",
      }}
    />
    <div style={{ fontSize: "36px" }}>🏆</div>
    <div
      style={{
        fontSize: "11px",
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        color: "#3B82F6",
        fontWeight: 700,
      }}
    >
      Certificate of Achievement
    </div>
    <div
      style={{
        fontSize: "10px",
        color: DS.colors.textMuted,
        textTransform: "uppercase",
        letterSpacing: "0.1em",
      }}
    >
      This is to certify that
    </div>
    <div
      style={{
        fontSize: "18px",
        fontWeight: 800,
        color: DS.colors.textPrimary,
        borderBottom: "2px solid #93C5FD",
        paddingBottom: "4px",
        lineHeight: 1.3,
      }}
    >
      Chan Tai Man 陳大文
    </div>
    <div style={{ fontSize: "12px", color: DS.colors.textSecondary, maxWidth: "220px", lineHeight: 1.5 }}>
      has demonstrated excellence in
    </div>
    <div
      style={{
        fontSize: "14px",
        fontWeight: 700,
        color: DS.colors.primary,
        background: DS.colors.primaryLight,
        padding: "4px 12px",
        borderRadius: DS.radius.full,
      }}
    >
      Regional Science Competition 2025
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <Star size={14} color="#F59E0B" fill="#F59E0B" />
      <span style={{ fontSize: "13px", fontWeight: 700, color: "#D97706" }}>Gold Award</span>
      <Star size={14} color="#F59E0B" fill="#F59E0B" />
    </div>
    <div style={{ fontSize: "10px", color: DS.colors.textMuted }}>
      15 November 2025
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export const Screen04_OCRWizard: React.FC = () => {
  const [envLevel,     setEnvLevel]     = useState("L4 Regional");
  const [tierRole,     setTierRole]     = useState("T4 Award");
  const [achievTitle,  setAchievTitle]  = useState("Regional Science Competition");
  const [awardDetails, setAwardDetails] = useState("Gold Award");
  const [hours,        setHours]        = useState("24");
  const [eventDate,    setEventDate]    = useState("2025-11-15");
  const [locked,       setLocked]       = useState(false);

  const envOptions = [
    { value: "L1 Personal",       label: "L1 Personal" },
    { value: "L2 School",         label: "L2 School" },
    { value: "L3 District",       label: "L3 District" },
    { value: "L4 Regional",       label: "L4 Regional" },
    { value: "L5 National",       label: "L5 National" },
    { value: "L6 Asia-Pacific",   label: "L6 Asia-Pacific" },
    { value: "L7 International",  label: "L7 International" },
  ];

  const tierOptions = [
    { value: "T1 Member",    label: "T1 Member" },
    { value: "T2 Participant", label: "T2 Participant" },
    { value: "T3 Finalist",  label: "T3 Finalist" },
    { value: "T4 Award",     label: "T4 Award" },
  ];

  return (
    <div
      style={{
        fontFamily: DS.font.family,
        background: DS.colors.background,
        minHeight: "100vh",
        padding: "24px",
      }}
    >
      {/* Page header */}
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 800, color: DS.colors.textPrimary, margin: 0 }}>
          3D OCR Extraction Wizard
        </h1>
        <p style={{ fontSize: "13px", color: DS.colors.textSecondary, margin: "4px 0 0" }}>
          模組四：自主成就提報 · AI-powered certificate recognition and auto-fill
        </p>
      </div>

      {/* Two-panel split */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {/* LEFT: Certificate Upload */}
        <Card style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <SectionHeader
            title="Certificate Upload"
            subtitle="Drag & drop or click to upload a certificate image"
          />

          <MockCertificate />

          {/* Upload button */}
          <button
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "12px",
              border: `2px dashed ${DS.colors.border}`,
              borderRadius: DS.radius.md,
              background: DS.colors.background,
              cursor: "pointer",
              color: DS.colors.textSecondary,
              fontFamily: DS.font.family,
              fontSize: "13px",
              fontWeight: 500,
              transition: "border-color 0.15s",
            }}
          >
            <Upload size={16} color={DS.colors.primary} />
            Drag &amp; drop or click to upload
          </button>

          {/* AI Confidence Badge */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "5px 12px",
                background: DS.colors.secondaryLight,
                border: `1px solid #A7F3D0`,
                borderRadius: DS.radius.full,
                fontSize: "12px",
                fontWeight: 700,
                color: "#065F46",
              }}
            >
              <CheckCircle2 size={13} color={DS.colors.secondary} />
              AI Confidence Score: 94.7%
            </span>
            <span style={{ fontSize: "11px", color: DS.colors.textMuted }}>
              High confidence — ready to confirm
            </span>
          </div>

          {/* OCR Progress */}
          <OcrProgressBar value={100} />

          {/* Field confidence indicators */}
          <div
            style={{
              padding: "14px",
              background: DS.colors.background,
              borderRadius: DS.radius.md,
              border: `1px solid ${DS.colors.border}`,
            }}
          >
            <div style={{ fontSize: "12px", fontWeight: 700, color: DS.colors.textSecondary, marginBottom: "10px" }}>
              Field-level Confidence
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <ConfidenceBar label="Award Level" value={98} />
              <ConfidenceBar label="Student Name" value={96} />
              <ConfidenceBar label="Competition Title" value={93} />
              <ConfidenceBar label="Date" value={91} />
            </div>
          </div>
        </Card>

        {/* RIGHT: AI Auto-filled Form */}
        <Card style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <Sparkles size={18} color={DS.colors.primary} />
            <h2 style={{ fontSize: "16px", fontWeight: 700, color: DS.colors.textPrimary, margin: 0 }}>
              Auto-Extracted Data
            </h2>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "3px 8px",
                background: DS.colors.secondaryLight,
                border: `1px solid #A7F3D0`,
                borderRadius: DS.radius.full,
                fontSize: "11px",
                fontWeight: 700,
                color: "#065F46",
              }}
            >
              <Sparkles size={10} color={DS.colors.secondary} />
              AI-Assisted
            </span>
          </div>

          {/* AI notice bar */}
          <div
            style={{
              padding: "10px 14px",
              background: DS.colors.primaryLight,
              border: `1px solid #BFDBFE`,
              borderRadius: DS.radius.md,
              fontSize: "12px",
              color: "#1E40AF",
              fontWeight: 500,
            }}
          >
            ✨ Fields below were auto-populated by OCR. Please review and confirm before locking.
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              opacity: locked ? 0.7 : 1,
              pointerEvents: locked ? "none" : "auto",
            }}
          >
            <SelectField
              label="Environment Level"
              value={envLevel}
              onChange={setEnvLevel}
              options={envOptions}
              hint="Determines the competitive scope of the achievement"
            />

            <SelectField
              label="Tier Role"
              value={tierRole}
              onChange={setTierRole}
              options={tierOptions}
              hint="T4 Award = highest recognition tier"
            />

            <InputField
              label="Achievement Title"
              value={achievTitle}
              onChange={setAchievTitle}
              placeholder="Enter competition or event name"
            />

            <InputField
              label="Award Details"
              value={awardDetails}
              onChange={setAwardDetails}
              placeholder="e.g. Gold Award, First Place"
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <InputField
                label="Hours Dimension"
                value={hours}
                onChange={setHours}
                type="number"
                hint="Estimated preparation hours"
              />
              <InputField
                label="Event Date"
                value={eventDate}
                onChange={setEventDate}
                type="date"
              />
            </div>
          </div>

          {locked && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 14px",
                background: DS.colors.secondaryLight,
                border: `1px solid #A7F3D0`,
                borderRadius: DS.radius.md,
              }}
            >
              <CheckCircle2 size={16} color={DS.colors.secondary} />
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#065F46", fontFamily: DS.font.family }}>
                Data locked and submitted to student record
              </span>
            </div>
          )}

          <Btn
            variant="primary"
            size="lg"
            fullWidth
            icon={<Lock size={16} />}
            onClick={() => setLocked(true)}
            style={{ marginTop: "auto" }}
          >
            {locked ? "Data Locked 🔒" : "Confirm & Lock Data 🔒"}
          </Btn>
        </Card>
      </div>
    </div>
  );
};
