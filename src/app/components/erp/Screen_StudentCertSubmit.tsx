// ─────────────────────────────────────────────────────────────────────────────
// Screen: 學生證書自助上載 — Student Certificate Self-Upload Portal
// Used standalone (/student-portal) and as modal inside 1.A.3 / 1.D.4
// ─────────────────────────────────────────────────────────────────────────────
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Upload, X, CheckCircle2, Clock, XCircle, RefreshCw,
  Sparkles, Lock, FileImage, GraduationCap,
} from "lucide-react";
import { ERP } from "./erpTokens";

const F = ERP.font.family;

export type PortalStudent = {
  id: number;
  label: string;
  name?: string;
  className?: string;
};

export type PortalSubmission = {
  id: string;
  title: string;
  status?: string;
  approved?: boolean;
  rejected?: boolean;
  rejectReason?: string | null;
  suggestedPts?: number;
  organizer?: string | null;
  eventDate?: string | null;
  cat?: string;
  time?: string;
};

type CategoryKey = "stem" | "music" | "sports" | "academic" | "service";

const CAT_OPTIONS: { id: CategoryKey; label: string; tag: string }[] = [
  { id: "stem", label: "STEM 科技", tag: "STEM" },
  { id: "music", label: "音樂藝術", tag: "Music" },
  { id: "sports", label: "體育運動", tag: "Sports" },
  { id: "academic", label: "學術成就", tag: "Academic" },
  { id: "service", label: "服務義工", tag: "Service" },
];

const DEMO_STUDENTS: PortalStudent[] = [
  { id: 0, label: "陳大文 · F1A", name: "陳大文", className: "F1A" },
  { id: 0, label: "陳俊傑 · F3B", name: "陳俊傑", className: "F3B" },
  { id: 0, label: "王小明 · F2C", name: "王小明", className: "F2C" },
  { id: 0, label: "李美玲 · F2B", name: "李美玲", className: "F2B" },
];

async function postJson(url: string, body: Record<string, unknown>, csrfName?: string, csrfHash?: string) {
  const payload = { ...body };
  if (csrfName && csrfHash) payload[csrfName] = csrfHash;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    body: JSON.stringify(payload),
  });
  try {
    return await res.json();
  } catch {
    return { ok: res.ok, message: res.ok ? "OK" : "Request failed" };
  }
}

export const Screen_StudentCertSubmit: React.FC<{
  open?: boolean;
  onClose?: () => void;
  asModal?: boolean;
  submitUrl?: string;
  mySubmissionsUrl?: string;
  studentsSearchUrl?: string;
  csrfName?: string;
  csrfHash?: string;
  initialStudents?: PortalStudent[];
  onSubmitted?: () => void;
}> = ({
  open = true,
  onClose,
  asModal = false,
  submitUrl = "/api/student-portal/submit-certificate",
  mySubmissionsUrl = "/api/student-portal/my-submissions",
  studentsSearchUrl = "/achievements/students/search",
  csrfName,
  csrfHash,
  initialStudents,
  onSubmitted,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [students, setStudents] = useState<PortalStudent[]>(initialStudents?.length ? initialStudents : DEMO_STUDENTS);
  const [studentId, setStudentId] = useState<number>(0);
  const [studentQuery, setStudentQuery] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [organizer, setOrganizer] = useState("");
  const [award, setAward] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [group, setGroup] = useState("個人組 · 中學組");
  const [cat, setCat] = useState<CategoryKey>("stem");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [history, setHistory] = useState<PortalSubmission[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const estimatedPts = useMemo(() => {
    const map: Record<CategoryKey, number> = { stem: 50, music: 30, sports: 40, academic: 35, service: 20 };
    return map[cat];
  }, [cat]);

  const loadStudents = useCallback(async (q: string) => {
    if (!studentsSearchUrl) return;
    try {
      const url = `${studentsSearchUrl}?q=${encodeURIComponent(q || "")}`;
      const res = await fetch(url, { headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" } });
      const data = await res.json();
      const rows = Array.isArray(data?.results) ? data.results
        : Array.isArray(data?.students) ? data.students
          : Array.isArray(data) ? data : [];
      const mapped: PortalStudent[] = rows.slice(0, 30).map((r: any) => ({
        id: Number(r.id || r.student_id || r.pk || 0),
        label: String(r.text || r.label || r.name_zh_hk || r.chName || r.name || `#${r.id}`),
        name: String(r.name_zh_hk || r.chName || r.name || ""),
        className: String(r.class_name || r.classCode || r.class || ""),
      })).filter((s: PortalStudent) => s.id > 0);
      if (mapped.length) {
        setStudents(mapped);
        if (!studentId) setStudentId(mapped[0].id);
      }
    } catch {
      // keep demo list
    }
  }, [studentsSearchUrl, studentId]);

  const loadHistory = useCallback(async (sid: number) => {
    if (!sid || !mySubmissionsUrl) return;
    try {
      const res = await fetch(`${mySubmissionsUrl}?student_id=${sid}`, {
        headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
      });
      const data = await res.json();
      const items = Array.isArray(data?.items) ? data.items : [];
      setHistory(items.map((it: any) => ({
        id: String(it.id),
        title: String(it.title || ""),
        status: it.status,
        approved: !!it.approved,
        rejected: !!it.rejected,
        rejectReason: it.rejectReason || it.reject_reason || null,
        suggestedPts: it.suggestedPts,
        organizer: it.organizer,
        eventDate: it.eventDate,
        cat: it.cat,
        time: it.time,
      })));
    } catch {
      setHistory([]);
    }
  }, [mySubmissionsUrl]);

  useEffect(() => {
    void loadStudents("");
  }, [loadStudents]);

  useEffect(() => {
    if (studentId > 0) void loadHistory(studentId);
  }, [studentId, loadHistory]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  if (!open) return null;

  const onPickFile = (f: File | null) => {
    if (!f) return;
    setFile(f);
    if (f.type.startsWith("image/")) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    } else {
      setPreview(null);
    }
    if (!title) {
      const base = f.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ");
      setTitle(base.slice(0, 80));
    }
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!studentId) {
      setToast("請先選擇學生");
      return;
    }
    if (!title.trim()) {
      setToast("請填寫活動名稱");
      return;
    }
    setBusy(true);
    try {
      let result: any;
      if (file) {
        const fd = new FormData();
        fd.append("certificate", file);
        fd.append("student_id", String(studentId));
        fd.append("achievement_title", title.trim());
        fd.append("organizer", organizer.trim());
        fd.append("award_details", award.trim());
        fd.append("event_date", eventDate);
        fd.append("participant_category", group.trim());
        fd.append("category_tag", CAT_OPTIONS.find((c) => c.id === cat)?.tag || "STEM");
        fd.append("suggested_points", String(estimatedPts));
        fd.append("ai_confidence", "86");
        if (csrfName && csrfHash) fd.append(csrfName, csrfHash);
        const res = await fetch(submitUrl, {
          method: "POST",
          headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
          body: fd,
        });
        result = await res.json().catch(() => ({ ok: res.ok }));
      } else {
        result = await postJson(submitUrl, {
          student_id: studentId,
          achievement_title: title.trim(),
          organizer: organizer.trim(),
          award_details: award.trim(),
          event_date: eventDate,
          participant_category: group.trim(),
          category_tag: CAT_OPTIONS.find((c) => c.id === cat)?.tag || "STEM",
          suggested_points: estimatedPts,
          ai_confidence: 82,
        }, csrfName, csrfHash);
      }
      if (!result?.ok) {
        setToast(result?.message || "提交失敗");
        return;
      }
      setToast(result.message || "已提交，等待老師審批");
      setStep(3);
      setFile(null);
      setPreview(null);
      await loadHistory(studentId);
      onSubmitted?.();
    } catch (e: any) {
      setToast(e?.message || "提交失敗");
    } finally {
      setBusy(false);
    }
  };

  const body = (
    <div style={{
      display: "flex", flexDirection: "column", height: asModal ? "100%" : "calc(100vh - 56px)",
      background: ERP.colors.pageBg, fontFamily: F, minHeight: 0,
    }}>
      <div style={{
        padding: "14px 18px", borderBottom: `1px solid ${ERP.colors.border}`,
        background: ERP.colors.surface, display: "flex", alignItems: "center", gap: 10, flexShrink: 0,
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10,
          background: "linear-gradient(135deg, #2563EB, #7C3AED)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <GraduationCap size={16} color="#fff" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: ERP.colors.textPrimary }}>🎓 學生證書上載</div>
          <div style={{ fontSize: 11, color: ERP.colors.textMuted }}>Student Certificate Self-Upload · 防刷分審批流程</div>
        </div>
        {asModal && onClose && (
          <button type="button" onClick={onClose} style={{
            border: `1px solid ${ERP.colors.border}`, background: "#fff", borderRadius: 8,
            padding: 6, cursor: "pointer", display: "flex",
          }}>
            <X size={15} color={ERP.colors.textMuted} />
          </button>
        )}
      </div>

      <div style={{
        display: "flex", gap: 6, padding: "10px 16px", background: ERP.colors.surface,
        borderBottom: `1px solid ${ERP.colors.border}`, flexShrink: 0,
      }}>
        {([
          { id: 1 as const, label: "① 上載證書" },
          { id: 2 as const, label: "② AI 預檢確認" },
          { id: 3 as const, label: "③ 我的上載紀錄" },
        ]).map((s) => (
          <button key={s.id} type="button" onClick={() => setStep(s.id)} style={{
            flex: 1, padding: "8px 6px", borderRadius: 8, border: "none", cursor: "pointer",
            background: step === s.id ? ERP.colors.accentPale : "transparent",
            color: step === s.id ? ERP.colors.accent : ERP.colors.textMuted,
            fontSize: 11, fontWeight: 700, fontFamily: F,
          }}>
            {s.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Student picker */}
        <div style={{
          background: ERP.colors.surface, border: `1px solid ${ERP.colors.border}`,
          borderRadius: 12, padding: 14, display: "flex", flexDirection: "column", gap: 8,
        }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: ERP.colors.textSecondary }}>學生選擇（Demo / 測試）</div>
          <input
            value={studentQuery}
            onChange={(e) => {
              setStudentQuery(e.target.value);
              void loadStudents(e.target.value);
            }}
            placeholder="搜尋學生姓名 / 學號…"
            style={{
              padding: "8px 10px", borderRadius: 8, border: `1px solid ${ERP.colors.border}`,
              fontSize: 13, fontFamily: F,
            }}
          />
          <select
            value={studentId || ""}
            onChange={(e) => setStudentId(Number(e.target.value))}
            style={{
              padding: "8px 10px", borderRadius: 8, border: `1px solid ${ERP.colors.border}`,
              fontSize: 13, fontFamily: F, background: "#fff",
            }}
          >
            <option value="">— 請選擇學生 —</option>
            {students.map((s) => (
              <option key={`${s.id}-${s.label}`} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>

        {step === 1 && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files?.[0];
              if (f) onPickFile(f);
            }}
            style={{
              background: dragOver ? ERP.colors.accentPale : ERP.colors.surface,
              border: `2px dashed ${dragOver ? ERP.colors.accent : ERP.colors.border}`,
              borderRadius: 14, padding: 28, textAlign: "center",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
            }}
          >
            <div style={{
              width: 52, height: 52, borderRadius: 14, background: "#EFF6FF",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Upload size={22} color={ERP.colors.accent} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, color: ERP.colors.textPrimary }}>上載證書圖片 / PDF</div>
            <div style={{ fontSize: 12, color: ERP.colors.textMuted }}>支援 JPG、PNG、PDF · 亦可使用手機相機拍攝</div>
            <label style={{
              marginTop: 6, display: "inline-flex", alignItems: "center", gap: 6,
              padding: "10px 16px", borderRadius: 10, background: ERP.colors.accent, color: "#fff",
              fontSize: 13, fontWeight: 700, cursor: "pointer",
            }}>
              <FileImage size={14} /> 選擇檔案
              <input type="file" accept="image/*,.pdf" hidden onChange={(e) => onPickFile(e.target.files?.[0] || null)} />
            </label>
            <button
              type="button"
              onClick={() => { setStep(2); setToast("已進入表單確認（無檔案 Demo）"); }}
              style={{
                marginTop: 4, background: "none", border: "none", color: ERP.colors.accent,
                fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: F, textDecoration: "underline",
              }}
            >
              略過上載，直接填寫表單（Demo）
            </button>
          </div>
        )}

        {step === 2 && (
          <>
            {(preview || file) && (
              <div style={{
                background: ERP.colors.surface, border: `1px solid ${ERP.colors.border}`,
                borderRadius: 12, padding: 12, display: "flex", gap: 12, alignItems: "center",
              }}>
                {preview ? (
                  <img src={preview} alt="preview" style={{ width: 72, height: 90, objectFit: "cover", borderRadius: 8, border: `1px solid ${ERP.colors.border}` }} />
                ) : (
                  <div style={{ width: 72, height: 90, borderRadius: 8, background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>📄</div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: ERP.colors.textPrimary }}>{file?.name || "證書預覽"}</div>
                  <div style={{ fontSize: 11, color: ERP.colors.textMuted, marginTop: 4 }}>AI 將自動萃取活動名稱、主辦機構與獲獎等級</div>
                </div>
              </div>
            )}

            <div style={{
              background: "linear-gradient(135deg, #EFF6FF, #EEF2FF)",
              border: "1px solid #BFDBFE", borderRadius: 12, padding: 14,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, fontSize: 12, fontWeight: 800, color: "#1E3A8A" }}>
                <Sparkles size={13} /> ✨ AI 預檢與表單確認
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { label: "活動名稱", value: title, set: setTitle, ph: "例如：2026 全港青少年編程大賽" },
                  { label: "主辦機構", value: organizer, set: setOrganizer, ph: "例如：香港電腦學會 HKCS" },
                  { label: "獲獎等級", value: award, set: setAward, ph: "例如：金獎 Gold" },
                  { label: "比賽日期", value: eventDate, set: setEventDate, ph: "YYYY-MM-DD", type: "date" },
                  { label: "參賽組別", value: group, set: setGroup, ph: "個人組 · 中學組" },
                ].map((f) => (
                  <label key={f.label} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: ERP.colors.textSecondary }}>{f.label}</span>
                    <input
                      type={(f as any).type || "text"}
                      value={f.value}
                      onChange={(e) => f.set(e.target.value)}
                      placeholder={f.ph}
                      style={{
                        padding: "8px 10px", borderRadius: 8, border: `1px solid ${ERP.colors.border}`,
                        fontSize: 13, fontFamily: F, background: "#fff",
                      }}
                    />
                  </label>
                ))}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: ERP.colors.textSecondary, marginBottom: 6 }}>類別</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {CAT_OPTIONS.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setCat(c.id)}
                        style={{
                          padding: "6px 10px", borderRadius: 999, cursor: "pointer", fontSize: 11, fontWeight: 700, fontFamily: F,
                          border: `1px solid ${cat === c.id ? ERP.colors.accent : ERP.colors.border}`,
                          background: cat === c.id ? ERP.colors.accentPale : "#fff",
                          color: cat === c.id ? ERP.colors.accent : ERP.colors.textSecondary,
                        }}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div style={{
              display: "flex", alignItems: "flex-start", gap: 8, padding: "12px 14px",
              background: "#FFFBEB", border: "1px solid #FCD34D", borderRadius: 12,
              fontSize: 12, color: "#92400E", lineHeight: 1.55,
            }}>
              <Lock size={14} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                🔒 等級評定與 ACORN 加分（預估 <strong>+{estimatedPts} 分</strong>）將由系統建議並交由負責老師最終審批，防止刷分。
                學生不可自行調高 L1–L4 / 分數。
              </div>
            </div>

            <button
              type="button"
              disabled={busy}
              onClick={() => void handleSubmit()}
              style={{
                height: 44, border: "none", borderRadius: 10, cursor: busy ? "wait" : "pointer",
                background: "linear-gradient(135deg, #059669, #10B981)", color: "#fff",
                fontSize: 14, fontWeight: 800, fontFamily: F, opacity: busy ? 0.7 : 1,
              }}
            >
              {busy ? "提交中…" : "送出審批 Submit for Approval"}
            </button>
          </>
        )}

        {step === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: ERP.colors.textPrimary }}>我的上載紀錄</div>
            {history.length === 0 && (
              <div style={{
                padding: 24, textAlign: "center", color: ERP.colors.textMuted, fontSize: 12,
                background: ERP.colors.surface, borderRadius: 12, border: `1px dashed ${ERP.colors.border}`,
              }}>
                尚無上載紀錄
              </div>
            )}
            {history.map((h) => {
              const approved = !!h.approved || h.status === "approved" || h.status === "reviewed";
              const rejected = !!h.rejected || h.status === "rejected" || h.status === "discarded";
              return (
                <div key={h.id} style={{
                  background: ERP.colors.surface, border: `1px solid ${ERP.colors.border}`,
                  borderRadius: 12, padding: 12, display: "flex", flexDirection: "column", gap: 6,
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: ERP.colors.textPrimary }}>{h.title}</div>
                  <div style={{ fontSize: 11, color: ERP.colors.textMuted }}>
                    {[h.organizer, h.eventDate, h.time].filter(Boolean).join(" · ")}
                  </div>
                  {approved && (
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: 5, alignSelf: "flex-start",
                      padding: "3px 8px", borderRadius: 999, background: "#D1FAE5", color: "#065F46",
                      fontSize: 11, fontWeight: 700,
                    }}>
                      <CheckCircle2 size={12} /> ✅ 已批核{h.suggestedPts ? ` (+${h.suggestedPts} ACORN 分數已入帳)` : ""}
                    </div>
                  )}
                  {rejected && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <div style={{
                        display: "inline-flex", alignItems: "center", gap: 5, alignSelf: "flex-start",
                        padding: "3px 8px", borderRadius: 999, background: "#FEE2E2", color: "#991B1B",
                        fontSize: 11, fontWeight: 700,
                      }}>
                        <XCircle size={12} /> ❌ 已退回重交
                      </div>
                      {h.rejectReason && (
                        <div style={{ fontSize: 11, color: "#991B1B" }}>原因：{h.rejectReason}</div>
                      )}
                      <button
                        type="button"
                        onClick={() => { setStep(1); setTitle(h.title); }}
                        style={{
                          alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 4,
                          padding: "6px 10px", borderRadius: 8, border: `1px solid ${ERP.colors.border}`,
                          background: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: F,
                        }}
                      >
                        <RefreshCw size={11} /> 🔄 重新上載
                      </button>
                    </div>
                  )}
                  {!approved && !rejected && (
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: 5, alignSelf: "flex-start",
                      padding: "3px 8px", borderRadius: 999, background: "#FEF3C7", color: "#92400E",
                      fontSize: 11, fontWeight: 700,
                    }}>
                      <Clock size={12} /> ⏳ 待老師審批 (Pending Approval)
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {toast && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 300,
          padding: "10px 16px", borderRadius: 999, background: "#0F172A", color: "#fff",
          fontSize: 12, fontWeight: 700, boxShadow: ERP.shadow.lg, maxWidth: "90vw",
        }}>
          {toast}
        </div>
      )}
    </div>
  );

  if (!asModal) return body;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 220, background: "rgba(15,23,42,0.45)", display: "flex", justifyContent: "flex-end" }}>
      <div style={{
        width: "min(480px, 100vw)", height: "100%", background: ERP.colors.pageBg,
        boxShadow: "-8px 0 28px rgba(15,23,42,0.25)",
      }}>
        {body}
      </div>
    </div>
  );
};
