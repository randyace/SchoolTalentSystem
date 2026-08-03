import React, { useState } from "react";
import { ArrowRight, X, Plus, Calendar, Settings2 } from "lucide-react";
import {
  DS, Card, Btn, SectionHeader, InputField, SelectField, ToggleSwitch, DateRangePicker,
} from "./DesignSystem";

/* ─── Tag Input Component ─────────────────────────────────────────────────── */
interface TagInputProps {
  label: string;
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
  hint?: string;
  placeholder?: string;
}

const TagInput: React.FC<TagInputProps> = ({ label, tags, onAdd, onRemove, hint, placeholder }) => {
  const [inputVal, setInputVal] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === ",") && inputVal.trim()) {
      e.preventDefault();
      onAdd(inputVal.trim().replace(/,/g, ""));
      setInputVal("");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontFamily: DS.font.family }}>
      <label style={{ fontSize: "13px", fontWeight: 600, color: DS.colors.textSecondary }}>{label}</label>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "6px",
          padding: "8px 10px",
          border: `1px solid ${DS.colors.border}`,
          borderRadius: DS.radius.md,
          background: DS.colors.surface,
          minHeight: "42px",
          alignItems: "center",
        }}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "3px 10px",
              background: DS.colors.primaryLight,
              color: DS.colors.primary,
              borderRadius: DS.radius.full,
              fontSize: "12px",
              fontWeight: 600,
              border: `1px solid #BFDBFE`,
            }}
          >
            {tag}
            <button
              onClick={() => onRemove(tag)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: DS.colors.primary,
                padding: "0",
                display: "flex",
                alignItems: "center",
                lineHeight: 1,
              }}
            >
              <X size={11} />
            </button>
          </span>
        ))}
        <input
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || "Type and press Enter..."}
          style={{
            border: "none",
            outline: "none",
            fontSize: "13px",
            fontFamily: DS.font.family,
            color: DS.colors.textPrimary,
            background: "transparent",
            flex: "1 1 100px",
            minWidth: "80px",
          }}
        />
      </div>
      {hint && <span style={{ fontSize: "11px", color: DS.colors.textMuted }}>{hint}</span>}
    </div>
  );
};

/* ─── Checklist Item ─────────────────────────────────────────────────────── */
interface ChecklistItemProps {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

const ChecklistItem: React.FC<ChecklistItemProps> = ({ label, checked, onChange }) => (
  <label
    style={{
      display: "flex",
      alignItems: "center",
      gap: "10px",
      cursor: "pointer",
      padding: "8px 0",
      borderBottom: `1px solid ${DS.colors.border}`,
      fontFamily: DS.font.family,
    }}
  >
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: DS.colors.primary }}
    />
    <span style={{ fontSize: "14px", color: DS.colors.textPrimary, fontWeight: checked ? 500 : 400 }}>
      {label}
    </span>
    {checked && (
      <span
        style={{
          marginLeft: "auto",
          fontSize: "11px",
          color: DS.colors.secondary,
          fontWeight: 600,
          background: DS.colors.secondaryLight,
          padding: "2px 8px",
          borderRadius: DS.radius.full,
        }}
      >
        Required
      </span>
    )}
  </label>
);

/* ─── Screen08_EventConfig ───────────────────────────────────────────────── */
export const Screen08_EventConfig: React.FC = () => {
  const [eventName, setEventName] = useState("Inter-school Science Competition 2026");
  const [organizer, setOrganizer] = useState("Science Department");
  const [activityStart, setActivityStart] = useState("2026-03-15");
  const [activityEnd, setActivityEnd] = useState("2026-03-20");
  const [regStart, setRegStart] = useState("2026-02-28");
  const [regEnd, setRegEnd] = useState("2026-02-28");
  const [venue, setVenue] = useState("School Hall + Lab 3");
  const [targetForms, setTargetForms] = useState(["F1", "F2", "F3"]);
  const [targetClasses, setTargetClasses] = useState(["1A", "1B", "2A", "2B", "2C"]);
  const [maxParticipants, setMaxParticipants] = useState("120");
  const [minGroup, setMinGroup] = useState("2");
  const [maxGroup, setMaxGroup] = useState("5");

  // Toggles
  const [autoApprove, setAutoApprove] = useState(true);
  const [confirmEmail, setConfirmEmail] = useState(true);
  const [allowLate, setAllowLate] = useState(false);
  const [teacherEndorse, setTeacherEndorse] = useState(true);
  const [googleCalendar, setGoogleCalendar] = useState(false);

  // Scoring
  const [achievementCategory, setAchievementCategory] = useState("STEM");
  const [acornWeight, setAcornWeight] = useState(1.5);
  const [portfolioGen, setPortfolioGen] = useState(true);
  const [aiReview, setAiReview] = useState(true);

  // Checklist
  const [certUpload, setCertUpload] = useState(true);
  const [photoEvidence, setPhotoEvidence] = useState(true);
  const [videoSubmission, setVideoSubmission] = useState(false);
  const [teacherSig, setTeacherSig] = useState(true);
  const [externalVerify, setExternalVerify] = useState(false);

  return (
    <div style={{ background: DS.colors.background, minHeight: "100vh", fontFamily: DS.font.family, padding: "24px" }}>
      {/* Page Header */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              background: DS.colors.primaryLight,
              borderRadius: DS.radius.md,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Settings2 size={20} color={DS.colors.primary} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 800, color: DS.colors.textPrimary }}>
              Event Configuration
            </h1>
            <p style={{ margin: 0, fontSize: "13px", color: DS.colors.textSecondary, marginTop: "2px" }}>
              增值模組: 活動設定 · Replace legacy dropdown interfaces with modern controls
            </p>
          </div>
        </div>
      </div>

      {/* Main 2-col layout */}
      <div style={{ display: "flex", gap: "24px", alignItems: "flex-start" }}>
        {/* LEFT col 60% */}
        <div style={{ flex: "0 0 60%", display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* Basic Information Card */}
          <Card style={{ padding: "20px" }}>
            <SectionHeader
              title="Basic Information"
              subtitle="Core event details and scheduling"
              badge={<Calendar size={16} color={DS.colors.primary} />}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <InputField
                label="Event Name"
                value={eventName}
                onChange={setEventName}
                placeholder="Enter event name"
              />
              <InputField
                label="Organizer"
                value={organizer}
                onChange={setOrganizer}
                placeholder="Enter organizing department or person"
              />
              <div>
                <DateRangePicker
                  label="Activity Period"
                  startDate={activityStart}
                  endDate={activityEnd}
                  onChange={(s, e) => { setActivityStart(s); setActivityEnd(e); }}
                />
              </div>
              <div>
                <DateRangePicker
                  label="Registration Deadline"
                  startDate={regStart}
                  endDate={regEnd}
                  onChange={(s, e) => { setRegStart(s); setRegEnd(e); }}
                />
              </div>
              <InputField
                label="Venue"
                value={venue}
                onChange={setVenue}
                placeholder="Enter venue location"
              />
            </div>
          </Card>

          {/* Target Participants Card */}
          <Card style={{ padding: "20px" }}>
            <SectionHeader
              title="Target Participants"
              subtitle="Define who can register for this event"
            />
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <TagInput
                label="Target Forms"
                tags={targetForms}
                onAdd={(t) => setTargetForms((prev) => prev.includes(t) ? prev : [...prev, t])}
                onRemove={(t) => setTargetForms((prev) => prev.filter((x) => x !== t))}
                hint="Add form groups (e.g. F4A, F4B)"
                placeholder="Add form..."
              />
              <TagInput
                label="Target Classes"
                tags={targetClasses}
                onAdd={(t) => setTargetClasses((prev) => prev.includes(t) ? prev : [...prev, t])}
                onRemove={(t) => setTargetClasses((prev) => prev.filter((x) => x !== t))}
                placeholder="Add class..."
              />
              <InputField
                label="Max Participants"
                value={maxParticipants}
                onChange={setMaxParticipants}
                type="number"
              />
              <div>
                <label style={{ fontSize: "13px", fontWeight: 600, color: DS.colors.textSecondary, display: "block", marginBottom: "8px" }}>
                  Group Size Range
                </label>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <div style={{ flex: 1 }}>
                    <input
                      type="number"
                      value={minGroup}
                      onChange={(e) => setMinGroup(e.target.value)}
                      placeholder="Min"
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        border: `1px solid ${DS.colors.border}`,
                        borderRadius: DS.radius.md,
                        fontSize: "14px",
                        color: DS.colors.textPrimary,
                        fontFamily: DS.font.family,
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                    <span style={{ fontSize: "11px", color: DS.colors.textMuted, marginTop: "3px", display: "block" }}>Min group size</span>
                  </div>
                  <span style={{ color: DS.colors.textMuted, fontWeight: 600, paddingTop: "4px" }}>/</span>
                  <div style={{ flex: 1 }}>
                    <input
                      type="number"
                      value={maxGroup}
                      onChange={(e) => setMaxGroup(e.target.value)}
                      placeholder="Max"
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        border: `1px solid ${DS.colors.border}`,
                        borderRadius: DS.radius.md,
                        fontSize: "14px",
                        color: DS.colors.textPrimary,
                        fontFamily: DS.font.family,
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                    <span style={{ fontSize: "11px", color: DS.colors.textMuted, marginTop: "3px", display: "block" }}>Max group size</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* RIGHT col 40% */}
        <div style={{ flex: "0 0 40%", display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* Automation Settings Card */}
          <Card style={{ padding: "20px" }}>
            <SectionHeader title="Automation Settings" subtitle="Configure automatic workflows for this event" />
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <ToggleSwitch checked={autoApprove} onChange={setAutoApprove} label="Auto-Approve Registrations" />
              <ToggleSwitch checked={confirmEmail} onChange={setConfirmEmail} label="Send Confirmation Email" />
              <ToggleSwitch checked={allowLate} onChange={setAllowLate} label="Allow Late Submissions" />
              <ToggleSwitch checked={teacherEndorse} onChange={setTeacherEndorse} label="Require Teacher Endorsement" />
              <ToggleSwitch checked={googleCalendar} onChange={setGoogleCalendar} label="Export to Google Calendar" />
            </div>
          </Card>

          {/* Scoring & Weighting Card */}
          <Card style={{ padding: "20px" }}>
            <SectionHeader title="Scoring & Weighting" subtitle="ACORN points and portfolio integration" />
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <SelectField
                label="Achievement Category"
                value={achievementCategory}
                onChange={setAchievementCategory}
                options={[
                  { value: "Academic", label: "Academic" },
                  { value: "Arts", label: "Arts" },
                  { value: "Sports", label: "Sports" },
                  { value: "Community", label: "Community" },
                  { value: "STEM", label: "STEM" },
                ]}
              />

              {/* ACORN Weight Slider */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: DS.colors.textSecondary, fontFamily: DS.font.family }}>
                    ACORN Weight Multiplier
                  </label>
                  <span
                    style={{
                      fontSize: "15px",
                      fontWeight: 800,
                      color: DS.colors.primary,
                      fontFamily: "'Courier New', monospace",
                      background: DS.colors.primaryLight,
                      padding: "2px 10px",
                      borderRadius: DS.radius.md,
                    }}
                  >
                    {acornWeight.toFixed(1)}x
                  </span>
                </div>
                <input
                  type="range"
                  min={1.0}
                  max={3.0}
                  step={0.1}
                  value={acornWeight}
                  onChange={(e) => setAcornWeight(parseFloat(e.target.value))}
                  style={{ width: "100%", accentColor: DS.colors.primary, cursor: "pointer" }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: DS.colors.textMuted }}>
                  <span>1.0x Base</span>
                  <span>2.0x Double</span>
                  <span>3.0x Triple</span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px", paddingTop: "4px" }}>
                <ToggleSwitch checked={portfolioGen} onChange={setPortfolioGen} label="Portfolio Generation" />
                <ToggleSwitch checked={aiReview} onChange={setAiReview} label="AI Evidence Review" />
              </div>
            </div>
          </Card>

          {/* Submission Requirements Card */}
          <Card style={{ padding: "20px" }}>
            <SectionHeader title="Submission Requirements" subtitle="Mandatory items students must provide" />
            <div>
              <ChecklistItem label="Certificate Upload" checked={certUpload} onChange={setCertUpload} />
              <ChecklistItem label="Photo Evidence" checked={photoEvidence} onChange={setPhotoEvidence} />
              <ChecklistItem label="Video Submission" checked={videoSubmission} onChange={setVideoSubmission} />
              <ChecklistItem label="Teacher Signature" checked={teacherSig} onChange={setTeacherSig} />
              <div style={{ borderBottom: "none" }}>
                <ChecklistItem label="External Verification" checked={externalVerify} onChange={setExternalVerify} />
              </div>
            </div>
            <div
              style={{
                marginTop: "12px",
                padding: "8px 12px",
                background: DS.colors.background,
                borderRadius: DS.radius.md,
                fontSize: "12px",
                color: DS.colors.textSecondary,
              }}
            >
              {[certUpload, photoEvidence, videoSubmission, teacherSig, externalVerify].filter(Boolean).length} of 5 requirements enabled
            </div>
          </Card>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div
        style={{
          marginTop: "24px",
          background: DS.colors.surface,
          border: `1px solid ${DS.colors.border}`,
          borderRadius: DS.radius.lg,
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: "12px",
          boxShadow: DS.shadow.sm,
        }}
      >
        <span style={{ fontSize: "13px", color: DS.colors.textMuted, marginRight: "auto" }}>
          Last saved: 3 minutes ago
        </span>
        <Btn variant="secondary">Save Draft</Btn>
        <Btn variant="ghost" style={{ border: `1px solid ${DS.colors.border}` }}>
          Preview Form
        </Btn>
        <Btn variant="primary" icon={<ArrowRight size={15} />}>
          Publish Event
        </Btn>
      </div>
    </div>
  );
};
