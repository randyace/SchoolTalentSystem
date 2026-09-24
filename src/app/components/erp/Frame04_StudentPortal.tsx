// ─────────────────────────────────────────────────────────────────────────────
// Frame 4.0 — Student Agency Portal (學生自主端 — Upload & Tagging Layout)
// 3.0 學生自主端: Certificate Upload + Peer Role Tagging
// Standalone layout — no admin sidebar. PDPO-tokenized identity.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from "react";
import {
  GraduationCap, ShieldCheck, Upload, FileText, CheckCircle,
  Clock, ChevronDown, Bell, LogOut, Users, X, AlertCircle,
} from "lucide-react";
import { ERP } from "./erpTokens";

/* ── PDPO Shield Icon ───────────────────────────────────────────────────── */
const DataShield: React.FC = () => (
  <span
    title="PDPO 第 4 條款合規 · Personal Data protected"
    style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: "18px", height: "18px",
      background: `linear-gradient(135deg, ${ERP.colors.success}, #34D399)`,
      borderRadius: "50%",
      flexShrink: 0,
    }}
  >
    <ShieldCheck size={11} color="#fff" strokeWidth={2.5} />
  </span>
);

/* ── Types ───────────────────────────────────────────────────────────────── */
type PeerRole = "組長" | "支援者" | "組員";
type UploadStatus = "submitted" | "pending" | "draft";

interface PeerEntry {
  token: string;
  initials: string;
  zhName: string;
  enName: string;
  role: PeerRole;
  color: string;
}

interface UploadRecord {
  id: string;
  filename: string;
  type: string;
  sizeMb: string;
  uploadedAt: string;
  status: UploadStatus;
}

/* ── Module-scope Mock Data ──────────────────────────────────────────────── */
const PEERS: PeerEntry[] = [
  { token: "#CSM-1001", initials: "CS", zhName: "陳小明",  enName: "Chan Siu Ming",  role: "組長",  color: ERP.colors.purple },
  { token: "#LWK-1003", initials: "LW", zhName: "林慧琪",  enName: "Lam Wai Kei",   role: "組員",  color: ERP.colors.teal },
  { token: "#HTK-1007", initials: "HT", zhName: "何芷君",  enName: "Ho Tsz Kwan",   role: "組員",  color: ERP.colors.amber },
];

const UPLOAD_HISTORY: UploadRecord[] = [
  { id: "UPL-003", filename: "Climate_Change_Slides_v1.pdf",  type: "PDF",  sizeMb: "2.4 MB",  uploadedAt: "2026-08-01 08:30", status: "submitted" },
  { id: "UPL-002", filename: "Research_Notes_Draft.docx",     type: "DOCX", sizeMb: "0.8 MB",  uploadedAt: "2026-07-28 14:15", status: "pending"   },
  { id: "UPL-001", filename: "Group_Photo_Evidence.jpg",      type: "JPG",  sizeMb: "3.1 MB",  uploadedAt: "2026-07-20 10:00", status: "submitted" },
];

const ROLE_OPTIONS: PeerRole[] = ["組長", "支援者", "組員"];

/* ── Upload Status Badge ─────────────────────────────────────────────────── */
const UploadBadge: React.FC<{ status: UploadStatus }> = ({ status }) => {
  const map = {
    submitted: { label: "已提交", bg: ERP.colors.successLight, color: ERP.colors.success, icon: <CheckCircle size={11} /> },
    pending:   { label: "待審核", bg: ERP.colors.amberLight,   color: ERP.colors.amber,   icon: <Clock size={11} /> },
    draft:     { label: "草稿",   bg: ERP.colors.pageBg,       color: ERP.colors.textMuted, icon: <FileText size={11} /> },
  };
  const cfg = map[status];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "4px",
      padding: "2px 8px",
      background: cfg.bg, color: cfg.color,
      border: `1px solid ${cfg.color}40`,
      borderRadius: ERP.radius.full,
      fontSize: "11px", fontWeight: 700,
    }}>
      {cfg.icon} {cfg.label}
    </span>
  );
};

/* ── File Type Icon ──────────────────────────────────────────────────────── */
const FileTypeIcon: React.FC<{ type: string }> = ({ type }) => {
  const colorMap: Record<string, string> = {
    PDF: "#DC2626", DOCX: "#2563EB", JPG: "#D97706", PNG: "#059669",
  };
  const color = colorMap[type] ?? ERP.colors.textMuted;
  return (
    <div style={{
      width: "32px", height: "32px",
      background: color + "18",
      border: `1px solid ${color}30`,
      borderRadius: ERP.radius.xs,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
    }}>
      <span style={{ fontSize: "8px", fontWeight: 800, color, letterSpacing: "-0.3px" }}>{type}</span>
    </div>
  );
};

/* ── Peer Role Row ───────────────────────────────────────────────────────── */
const PeerRoleRow: React.FC<{
  peer: PeerEntry;
  onRoleChange: (token: string, role: PeerRole) => void;
}> = ({ peer, onRoleChange }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", gap: "12px",
        padding: "10px 14px",
        background: hovered ? ERP.colors.surfaceHover : ERP.colors.surface,
        borderBottom: `1px solid ${ERP.colors.border}`,
        transition: "background 0.1s",
      }}
    >
      {/* Avatar */}
      <div style={{
        width: "36px", height: "36px", borderRadius: "50%",
        background: `linear-gradient(135deg, ${peer.color}CC, ${peer.color})`,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#fff", fontSize: "12px", fontWeight: 700,
        flexShrink: 0,
      }}>
        {peer.initials}
      </div>

      {/* Name */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "13px", fontWeight: 600, color: ERP.colors.textPrimary }}>
            {peer.zhName}
          </span>
          <DataShield />
          <span style={{
            fontSize: "10px", color: ERP.colors.textMuted,
            fontFamily: ERP.font.mono,
          }}>
            {peer.token}
          </span>
        </div>
        <div style={{ fontSize: "11px", color: ERP.colors.textMuted, marginTop: "1px" }}>
          {peer.enName}
        </div>
      </div>

      {/* Role Dropdown */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <select
          value={peer.role}
          onChange={(e) => onRoleChange(peer.token, e.target.value as PeerRole)}
          style={{
            padding: "5px 26px 5px 10px",
            border: `1.5px solid ${peer.color}40`,
            borderRadius: ERP.radius.md,
            fontSize: "12px", fontWeight: 700,
            color: peer.color,
            background: `${peer.color}10`,
            outline: "none",
            appearance: "none",
            cursor: "pointer",
            fontFamily: ERP.font.family,
          }}
        >
          {ROLE_OPTIONS.map((r) => <option key={r}>{r}</option>)}
        </select>
        <ChevronDown size={11} color={peer.color} style={{ position: "absolute", right: "7px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
      </div>
    </div>
  );
};

/* ── Main Export ─────────────────────────────────────────────────────────── */
export const Frame04_StudentPortal: React.FC = () => {
  const [peers, setPeers] = useState<PeerEntry[]>(PEERS);
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileUploaded, setFileUploaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleRoleChange = (token: string, role: PeerRole) => {
    setPeers((prev) => prev.map((p) => p.token === token ? { ...p, role } : p));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    setFileUploaded(true);
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      minHeight: "100vh",
      background: "#F0F6FF",
      fontFamily: ERP.font.family,
    }}>

      {/* ── STUDENT TOP NAV ─────────────────────────────────────────────── */}
      <header style={{
        height: "56px",
        background: ERP.colors.sidebar,
        display: "flex", alignItems: "center",
        padding: "0 24px", gap: "12px",
        flexShrink: 0,
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{
            width: "30px", height: "30px", borderRadius: ERP.radius.sm,
            background: "linear-gradient(135deg, #1D4ED8, #3B82F6)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <GraduationCap size={16} color="#fff" />
          </div>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "#E2E8F0" }}>LALP 學生端</span>
          <span style={{
            fontSize: "10px", color: "#475569",
            borderLeft: "1px solid #1E293B", paddingLeft: "8px", marginLeft: "4px",
          }}>
            3.0 學生自主端
          </span>
        </div>

        <div style={{ flex: 1 }} />

        {/* PDPO Identity Badge */}
        <div style={{
          display: "flex", alignItems: "center", gap: "8px",
          padding: "5px 12px",
          background: "rgba(37,99,235,0.2)",
          border: "1px solid rgba(37,99,235,0.4)",
          borderRadius: ERP.radius.full,
        }}>
          <DataShield />
          <span style={{ fontSize: "13px", fontWeight: 700, color: "#93C5FD", fontFamily: ERP.font.mono }}>
            Student #WKY-1029
          </span>
        </div>

        {/* Bell */}
        <button style={{
          background: "transparent", border: "none", cursor: "pointer",
          padding: "6px", color: "#475569", display: "flex",
        }}>
          <Bell size={17} />
        </button>

        {/* Logout */}
        <button style={{
          display: "flex", alignItems: "center", gap: "5px",
          padding: "5px 10px",
          background: "transparent",
          border: "1px solid #1E293B",
          borderRadius: ERP.radius.md,
          cursor: "pointer",
          fontSize: "12px", color: "#64748B",
          fontFamily: ERP.font.family,
        }}>
          <LogOut size={13} /> 登出
        </button>
      </header>

      {/* ── PAGE CONTENT ───────────────────────────────────────────────── */}
      <div style={{ flex: 1, padding: "28px 32px", maxWidth: "1100px", margin: "0 auto", width: "100%" }}>

        {/* Welcome Header */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <h1 style={{ fontSize: "22px", fontWeight: 800, color: ERP.colors.textPrimary, lineHeight: 1 }}>
              我的學習成就提報
            </h1>
            <span style={{
              fontSize: "11px", fontWeight: 700,
              background: ERP.colors.accentLight, color: ERP.colors.accentDark,
              border: `1px solid ${ERP.colors.accent}40`,
              borderRadius: ERP.radius.full, padding: "2px 10px",
            }}>
              AY 2025/26 · S2
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "13px", color: ERP.colors.textSecondary }}>
              組別 A · 氣候變化研究 (Climate Change Study)
            </span>
            <span style={{ fontSize: "12px", color: ERP.colors.textMuted }}>·</span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: ERP.colors.textMuted }}>
              <Users size={13} /> 4 名組員
            </span>
          </div>

          {/* Pending role confirmation alert */}
          <div style={{
            display: "flex", alignItems: "center", gap: "10px",
            padding: "10px 14px",
            background: "#FFF7ED",
            border: `1px solid #FED7AA`,
            borderRadius: ERP.radius.md,
            marginTop: "12px",
          }}>
            <AlertCircle size={15} color={ERP.colors.orange} />
            <span style={{ fontSize: "13px", color: "#92400E", fontWeight: 600 }}>
              待確認崗位：您的 Presenter 協作崗位尚未確認，請於截止日期前確認。
            </span>
            <button style={{
              marginLeft: "auto", flexShrink: 0,
              padding: "4px 12px",
              background: ERP.colors.orange,
              border: "none", borderRadius: ERP.radius.sm,
              color: "#fff", fontSize: "12px", fontWeight: 700,
              cursor: "pointer", fontFamily: ERP.font.family,
            }}>
              立即確認
            </button>
          </div>
        </div>

        {/* ── Two-Column Layout ─────────────────────────────────────────── */}
        <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>

          {/* ── LEFT COLUMN: Upload Zone ─────────────────────────────── */}
          <div style={{ flex: "0 0 55%", display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Upload Zone Card */}
            <div style={{
              background: ERP.colors.surface,
              border: `1px solid ${ERP.colors.border}`,
              borderRadius: ERP.radius.lg,
              overflow: "hidden",
              boxShadow: ERP.shadow.card,
            }}>
              {/* Card Header */}
              <div style={{
                padding: "14px 20px",
                borderBottom: `1px solid ${ERP.colors.border}`,
                background: ERP.colors.accentPale,
                display: "flex", alignItems: "center", gap: "8px",
              }}>
                <Upload size={16} color={ERP.colors.accent} />
                <div>
                  <div style={{ fontSize: "15px", fontWeight: 700, color: ERP.colors.textPrimary }}>
                    成就證書上傳
                  </div>
                  <div style={{ fontSize: "11px", color: ERP.colors.textSecondary }}>
                    Certificate Upload · 支援 PDF、JPG、PNG、DOCX
                  </div>
                </div>
              </div>

              {/* Drag & Drop Zone */}
              <div style={{ padding: "20px" }}>
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  style={{
                    minHeight: "180px",
                    border: `2px dashed ${isDragOver ? ERP.colors.accent : fileUploaded ? ERP.colors.success : ERP.colors.borderStrong}`,
                    borderRadius: ERP.radius.lg,
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    gap: "12px",
                    background: isDragOver
                      ? ERP.colors.accentPale
                      : fileUploaded
                      ? ERP.colors.successLight
                      : "#FAFBFC",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    position: "relative",
                  }}
                  onClick={() => setFileUploaded(true)}
                >
                  {fileUploaded ? (
                    <>
                      <div style={{
                        width: "52px", height: "52px", borderRadius: "50%",
                        background: ERP.colors.successLight,
                        border: `2px solid ${ERP.colors.success}40`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <CheckCircle size={28} color={ERP.colors.success} />
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "14px", fontWeight: 600, color: ERP.colors.success }}>
                          檔案已選擇
                        </div>
                        <div style={{ fontSize: "12px", color: ERP.colors.textSecondary, marginTop: "2px" }}>
                          Climate_Change_Slides_v2.pdf · 2.8 MB
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setFileUploaded(false); }}
                        style={{
                          position: "absolute", top: "10px", right: "10px",
                          background: "transparent", border: "none", cursor: "pointer",
                          color: ERP.colors.textMuted, padding: "2px",
                        }}
                      >
                        <X size={14} />
                      </button>
                    </>
                  ) : (
                    <>
                      <div style={{
                        width: "52px", height: "52px", borderRadius: "50%",
                        background: isDragOver ? ERP.colors.accentLight : ERP.colors.pageBg,
                        border: `2px solid ${isDragOver ? ERP.colors.accent : ERP.colors.border}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.15s",
                      }}>
                        <Upload size={24} color={isDragOver ? ERP.colors.accent : ERP.colors.textMuted} />
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "14px", fontWeight: 600, color: isDragOver ? ERP.colors.accent : ERP.colors.textPrimary }}>
                          拖放或點擊上傳
                        </div>
                        <div style={{ fontSize: "12px", color: ERP.colors.textSecondary, marginTop: "3px" }}>
                          Drag & Drop or Click to Upload
                        </div>
                        <div style={{ fontSize: "11px", color: ERP.colors.textMuted, marginTop: "4px" }}>
                          PDF · JPG · PNG · DOCX · 最大 20 MB
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Upload tags */}
                <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
                  {["活動：全港科學創意大賽", "類型：成就證書", "學年：2025/26"].map((tag) => (
                    <span key={tag} style={{
                      fontSize: "11px",
                      padding: "3px 10px",
                      background: ERP.colors.pageBg,
                      border: `1px solid ${ERP.colors.border}`,
                      borderRadius: ERP.radius.full,
                      color: ERP.colors.textSecondary,
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Upload History */}
            <div style={{
              background: ERP.colors.surface,
              border: `1px solid ${ERP.colors.border}`,
              borderRadius: ERP.radius.lg,
              overflow: "hidden",
              boxShadow: ERP.shadow.card,
            }}>
              <div style={{
                padding: "12px 16px",
                borderBottom: `1px solid ${ERP.colors.border}`,
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <span style={{ fontSize: "13px", fontWeight: 700, color: ERP.colors.textPrimary }}>
                  上傳記錄 (Upload History)
                </span>
                <span style={{ fontSize: "12px", color: ERP.colors.accent, cursor: "pointer" }}>
                  查看全部
                </span>
              </div>
              {UPLOAD_HISTORY.map((rec) => (
                <div key={rec.id} style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  padding: "10px 16px",
                  borderBottom: `1px solid ${ERP.colors.border}`,
                }}>
                  <FileTypeIcon type={rec.type} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "13px", fontWeight: 500, color: ERP.colors.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {rec.filename}
                    </div>
                    <div style={{ fontSize: "11px", color: ERP.colors.textMuted, marginTop: "1px" }}>
                      {rec.sizeMb} · {rec.uploadedAt}
                    </div>
                  </div>
                  <UploadBadge status={rec.status} />
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT COLUMN: Peer Role Tagging ──────────────────────── */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Peer Tagging Card */}
            <div style={{
              background: ERP.colors.surface,
              border: `1px solid ${ERP.colors.border}`,
              borderRadius: ERP.radius.lg,
              overflow: "hidden",
              boxShadow: ERP.shadow.card,
            }}>
              {/* Card Header */}
              <div style={{
                padding: "14px 20px",
                borderBottom: `1px solid ${ERP.colors.border}`,
                background: "#F0FDF4",
                display: "flex", alignItems: "center", gap: "8px",
              }}>
                <Users size={16} color={ERP.colors.teal} />
                <div>
                  <div style={{ fontSize: "15px", fontWeight: 700, color: ERP.colors.textPrimary }}>
                    分組協作同儕標註
                  </div>
                  <div style={{ fontSize: "11px", color: ERP.colors.textSecondary }}>
                    Peer Role Tagging · 組別 A · {peers.length} 位同儕
                  </div>
                </div>
              </div>

              {/* Info Note */}
              <div style={{
                padding: "8px 14px",
                background: "#F0F9FF",
                borderBottom: `1px solid ${ERP.colors.border}`,
                fontSize: "12px", color: ERP.colors.textSecondary,
                display: "flex", gap: "6px", alignItems: "flex-start",
              }}>
                <ShieldCheck size={13} color={ERP.colors.teal} style={{ marginTop: "1px", flexShrink: 0 }} />
                <span>
                  以下顯示去識別化學號 (Tokenized ID)。標注角色後將同步至教師端進行角色定錨驗證。
                </span>
              </div>

              {/* Peer Rows */}
              <div>
                {peers.map((peer) => (
                  <PeerRoleRow
                    key={peer.token}
                    peer={peer}
                    onRoleChange={handleRoleChange}
                  />
                ))}
              </div>

              {/* Role Legend */}
              <div style={{
                padding: "10px 14px",
                background: ERP.colors.surfaceHover,
                borderTop: `1px solid ${ERP.colors.border}`,
              }}>
                <div style={{ fontSize: "11px", color: ERP.colors.textMuted, marginBottom: "6px", fontWeight: 600 }}>
                  崗位說明 (Role Guide)
                </div>
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  {[
                    { role: "組長",  desc: "統籌全組工作",   color: ERP.colors.purple },
                    { role: "支援者", desc: "協助資料整理",  color: ERP.colors.teal },
                    { role: "組員",  desc: "執行分配任務",   color: ERP.colors.amber },
                  ].map((item) => (
                    <div key={item.role} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: item.color, flexShrink: 0 }} />
                      <span style={{ fontSize: "11px", fontWeight: 700, color: item.color }}>{item.role}</span>
                      <span style={{ fontSize: "11px", color: ERP.colors.textMuted }}>{item.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Submission Status Card */}
            <div style={{
              background: ERP.colors.surface,
              border: `1px solid ${ERP.colors.border}`,
              borderRadius: ERP.radius.lg,
              overflow: "hidden",
              boxShadow: ERP.shadow.card,
            }}>
              <div style={{ padding: "14px 16px", borderBottom: `1px solid ${ERP.colors.border}` }}>
                <div style={{ fontSize: "13px", fontWeight: 700, color: ERP.colors.textPrimary, marginBottom: "10px" }}>
                  提報進度 (Submission Progress)
                </div>
                {[
                  { label: "上傳證書",     done: true  },
                  { label: "同儕崗位標注", done: false },
                  { label: "教師審批",     done: false },
                ].map((step, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                    <div style={{
                      width: "22px", height: "22px", borderRadius: "50%",
                      background: step.done ? ERP.colors.success : ERP.colors.border,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      {step.done
                        ? <CheckCircle size={13} color="#fff" />
                        : <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: ERP.colors.textMuted, display: "block" }} />
                      }
                    </div>
                    <span style={{
                      fontSize: "13px",
                      color: step.done ? ERP.colors.success : ERP.colors.textSecondary,
                      fontWeight: step.done ? 600 : 400,
                    }}>
                      {step.label}
                    </span>
                    {step.done && <span style={{ fontSize: "11px", color: ERP.colors.textMuted, marginLeft: "auto" }}>完成</span>}
                  </div>
                ))}
              </div>
              <div style={{ padding: "10px 16px" }}>
                <div style={{ fontSize: "11px", color: ERP.colors.textMuted, marginBottom: "2px" }}>提報截止日期</div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: ERP.colors.orange }}>
                  2026年8月31日 (星期一)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom Submit Bar ──────────────────────────────────────────── */}
        <div style={{
          marginTop: "24px",
          padding: "16px 20px",
          background: ERP.colors.surface,
          border: `1px solid ${ERP.colors.border}`,
          borderRadius: ERP.radius.lg,
          display: "flex", alignItems: "center", gap: "16px",
          boxShadow: ERP.shadow.card,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: ERP.colors.textPrimary }}>
              上傳完成後，提交整個提報包
            </div>
            <div style={{ fontSize: "12px", color: ERP.colors.textSecondary, marginTop: "2px" }}>
              提交後教師將收到通知進行審批。提交後可修改至截止日期。
            </div>
          </div>
          <button
            onClick={() => setSubmitting(!submitting)}
            style={{
              padding: "10px 24px",
              border: "none", borderRadius: ERP.radius.md,
              background: submitting
                ? `linear-gradient(135deg, ${ERP.colors.success}, #34D399)`
                : `linear-gradient(135deg, ${ERP.colors.accent}, ${ERP.colors.accentDark})`,
              color: "#fff",
              cursor: "pointer",
              fontSize: "14px", fontWeight: 700,
              fontFamily: ERP.font.family,
              boxShadow: submitting
                ? `0 4px 14px ${ERP.colors.success}50`
                : `0 4px 14px ${ERP.colors.accent}50`,
              transition: "all 0.2s",
              display: "flex", alignItems: "center", gap: "8px",
              flexShrink: 0,
            }}
          >
            {submitting ? <><CheckCircle size={16} /> 已提交！</> : <>提交成就提報包</>}
          </button>
        </div>
      </div>
    </div>
  );
};
