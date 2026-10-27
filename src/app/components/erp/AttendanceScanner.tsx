// ─────────────────────────────────────────────────────────────────────────────
// Universal QR Attendance Scanner — Continuous Mode
// Teacher-facing camera scanner with context picker (activity stages / club).
// Uses html5-qrcode via CDN (no npm dep).
// ─────────────────────────────────────────────────────────────────────────────
import React, { useCallback, useEffect, useRef, useState } from "react";
import { QrCode, X, CheckCircle2, AlertTriangle, Camera, RotateCcw } from "lucide-react";
import { ERP } from "./erpTokens";

const F = ERP.font.family;
const HTML5_QRCODE_CDN = "https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js";

export type AttendanceEntityType = "activity" | "club";

type ScheduleOpt = {
  id: number;
  label: string;
  label_en?: string;
  date?: string;
};

type ScanStatus =
  | { kind: "idle"; text: string }
  | { kind: "scanning"; text: string }
  | { kind: "success"; text: string }
  | { kind: "walk_in"; text: string }
  | { kind: "dup"; text: string }
  | { kind: "error"; text: string };

type Html5QrcodeLike = {
  start: (
    cameraIdOrConfig: string | { facingMode: string },
    config: { fps: number; qrbox?: { width: number; height: number }; aspectRatio?: number },
    onSuccess: (decoded: string) => void,
    onFailure?: (err: string) => void
  ) => Promise<void>;
  pause: (shouldPauseVideo?: boolean) => void;
  resume: () => void;
  stop: () => Promise<void>;
  isScanning?: boolean;
  clear?: () => void;
};

declare global {
  interface Window {
    Html5Qrcode?: new (elementId: string) => Html5QrcodeLike;
  }
}

let cdnPromise: Promise<void> | null = null;

function loadHtml5Qrcode(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.Html5Qrcode) return Promise.resolve();
  if (cdnPromise) return cdnPromise;
  cdnPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${HTML5_QRCODE_CDN}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("CDN load failed")));
      if (window.Html5Qrcode) resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = HTML5_QRCODE_CDN;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load html5-qrcode"));
    document.head.appendChild(s);
  });
  return cdnPromise;
}

function playSuccessBeep() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.value = 0.08;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    osc.stop(ctx.currentTime + 0.2);
    setTimeout(() => ctx.close().catch(() => undefined), 300);
  } catch {
    /* ignore audio errors */
  }
}

export type AttendanceScannerProps = {
  open: boolean;
  onClose: () => void;
  entityType: AttendanceEntityType;
  entityId: number;
  entityLabel?: string;
  scanUrl?: string;
  schedulesUrl?: string;
  sessionCountUrl?: string;
  /** Pre-known schedules (skips fetch). Empty array = no stages. Undefined = fetch. */
  schedules?: ScheduleOpt[] | null;
};

export const AttendanceScanner: React.FC<AttendanceScannerProps> = ({
  open,
  onClose,
  entityType,
  entityId,
  entityLabel = "",
  scanUrl = "/api/attendance/scan",
  schedulesUrl,
  sessionCountUrl = "/api/attendance/session-count",
  schedules: schedulesProp,
}) => {
  const [step, setStep] = useState<"context" | "scanner">("context");
  const [schedules, setSchedules] = useState<ScheduleOpt[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [scheduleId, setScheduleId] = useState(0);
  const [stageLabel, setStageLabel] = useState("今日簽到");
  const [continuous, setContinuous] = useState(true);
  const [scanCount, setScanCount] = useState(0);
  const [status, setStatus] = useState<ScanStatus>({ kind: "idle", text: "準備掃描…" });
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [awaitingNext, setAwaitingNext] = useState(false);

  const scannedSet = useRef<Set<string>>(new Set());
  const processingRef = useRef(false);
  const scannerRef = useRef<Html5QrcodeLike | null>(null);
  const continuousRef = useRef(true);
  const readerId = useRef(`qr-reader-${Math.random().toString(36).slice(2, 9)}`);

  continuousRef.current = continuous;

  const schedulesEndpoint =
    schedulesUrl ||
    (entityType === "activity" && entityId > 0
      ? `/api/attendance/schedules/${entityId}`
      : "");

  // Reset when opened
  useEffect(() => {
    if (!open) return;
    scannedSet.current = new Set();
    processingRef.current = false;
    setContinuous(true);
    setScanCount(0);
    setStatus({ kind: "idle", text: "準備掃描…" });
    setCameraReady(false);
    setCameraError(null);
    setAwaitingNext(false);
    setScheduleId(0);
    setStageLabel(entityType === "club" ? "今日例會簽到" : "今日簽到");

    const goGenericSignIn = (label: string) => {
      setSchedules([]);
      setScheduleId(0);
      setStageLabel(label);
      // No stages → skip context picker, open camera for today's sign-in.
      setStep("scanner");
    };

    if (entityType === "club") {
      goGenericSignIn("今日例會簽到");
      return;
    }

    if (schedulesProp !== undefined && schedulesProp !== null) {
      const list = schedulesProp;
      setSchedules(list);
      if (list.length === 0) {
        goGenericSignIn("今日簽到");
      } else {
        setStep("context");
      }
      return;
    }

    if (!schedulesEndpoint) {
      goGenericSignIn("今日簽到");
      return;
    }

    setLoadingSchedules(true);
    setStep("context");
    const ctrl = new AbortController();
    fetch(schedulesEndpoint, {
      credentials: "same-origin",
      headers: { Accept: "application/json" },
      signal: ctrl.signal,
    })
      .then((r) => r.json())
      .then((json) => {
        const list = Array.isArray(json?.schedules) ? (json.schedules as ScheduleOpt[]) : [];
        setSchedules(list);
        if (list.length === 0) {
          setScheduleId(0);
          setStageLabel("今日簽到");
          setStep("scanner");
        } else {
          setStep("context");
        }
      })
      .catch(() => {
        setSchedules([]);
        setScheduleId(0);
        setStageLabel("今日簽到");
        setStep("scanner");
      })
      .finally(() => setLoadingSchedules(false));

    return () => ctrl.abort();
  }, [open, entityType, entityId, schedulesEndpoint, schedulesProp]);

  const stopCamera = useCallback(async () => {
    const s = scannerRef.current;
    scannerRef.current = null;
    if (!s) return;
    try {
      await s.stop();
    } catch {
      /* already stopped */
    }
    try {
      s.clear?.();
    } catch {
      /* ignore */
    }
    setCameraReady(false);
  }, []);

  const handleClose = useCallback(async (opts?: { refresh?: boolean }) => {
    await stopCamera();
    onClose();
    if (opts?.refresh && typeof window !== "undefined") {
      // Let walk-in badges / roster counts catch up after a session with scans.
      window.setTimeout(() => window.location.reload(), 120);
    }
  }, [onClose, stopCamera]);

  const handleFinishSignIn = useCallback(() => {
    void handleClose({ refresh: scanCount > 0 });
  }, [handleClose, scanCount]);

  const resumeScanner = useCallback(() => {
    try {
      scannerRef.current?.resume();
    } catch {
      /* ignore */
    }
    processingRef.current = false;
  }, []);

  const pauseScanner = useCallback(() => {
    try {
      scannerRef.current?.pause(true);
    } catch {
      /* ignore */
    }
  }, []);

  const postScan = useCallback(
    async (qrCode: string) => {
      const res = await fetch(scanUrl, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({
          qr_code: qrCode,
          entity_type: entityType,
          entity_id: entityId,
          schedule_id: scheduleId,
        }),
      });
      const json = await res.json().catch(() => ({}));
      return { res, json };
    },
    [scanUrl, entityType, entityId, scheduleId]
  );

  const onDecoded = useCallback(
    async (decoded: string) => {
      const code = String(decoded || "").trim();
      if (!code || processingRef.current) return;
      processingRef.current = true;
      pauseScanner();

      const key = code.toUpperCase();
      if (scannedSet.current.has(key)) {
        setStatus({ kind: "dup", text: `⚠ 本機已掃過：${code}` });
        setTimeout(() => {
          setStatus({ kind: "scanning", text: "掃描中…" });
          resumeScanner();
        }, 700);
        return;
      }

      setStatus({ kind: "scanning", text: `核對中：${code}…` });

      try {
        const { res, json } = await postScan(code);
        if (res.status === 200 && json?.ok) {
          scannedSet.current.add(key);
          const name = json.student?.name || json.student?.name_zh_hk || code;
          const sid = json.student?.student_id || code;
          const count = typeof json.scan_count === "number" ? json.scan_count : scanCount + 1;
          setScanCount(count);
          const isWalkIn = json.status === "walk_in" || json.is_walk_in === true || json.is_walk_in === 1;
          if (isWalkIn) {
            setStatus({
              kind: "walk_in",
              text: json.message || `⚠️ 成功簽到 (未報名) ${name} (${sid})`,
            });
          } else {
            setStatus({ kind: "success", text: `✅ ${name} (${sid}) 成功` });
          }
          playSuccessBeep();

          if (continuousRef.current) {
            setTimeout(() => {
              setStatus({ kind: "scanning", text: "掃描中…" });
              resumeScanner();
            }, isWalkIn ? 1100 : 600);
          } else {
            setAwaitingNext(true);
            processingRef.current = false;
          }
          return;
        }

        if (res.status === 409) {
          scannedSet.current.add(key);
          const name = json.student?.name || code;
          setStatus({ kind: "dup", text: `❌ ${name} — 此學生已簽到` });
          setTimeout(() => {
            if (continuousRef.current) {
              setStatus({ kind: "scanning", text: "掃描中…" });
              resumeScanner();
            } else {
              setAwaitingNext(true);
              processingRef.current = false;
            }
          }, 900);
          return;
        }

        setStatus({
          kind: "error",
          text: `❌ ${json?.message || `簽到失敗 (${res.status})`}`,
        });
        setTimeout(() => {
          if (continuousRef.current) {
            setStatus({ kind: "scanning", text: "掃描中…" });
            resumeScanner();
          } else {
            setAwaitingNext(true);
            processingRef.current = false;
          }
        }, 1000);
      } catch {
        setStatus({ kind: "error", text: "❌ 網絡錯誤，請重試" });
        setTimeout(() => {
          if (continuousRef.current) {
            setStatus({ kind: "scanning", text: "掃描中…" });
            resumeScanner();
          } else {
            setAwaitingNext(true);
            processingRef.current = false;
          }
        }, 1000);
      }
    },
    [pauseScanner, resumeScanner, postScan, scanCount]
  );

  // Start camera when entering scanner step
  useEffect(() => {
    if (!open || step !== "scanner") return;
    let cancelled = false;

    (async () => {
      try {
        await loadHtml5Qrcode();
        if (cancelled || !window.Html5Qrcode) return;
        await stopCamera();
        const scanner = new window.Html5Qrcode(readerId.current);
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          { fps: 8, qrbox: { width: 250, height: 250 }, aspectRatio: 1 },
          (decoded) => {
            void onDecoded(decoded);
          },
          () => undefined
        );
        if (cancelled) {
          await scanner.stop().catch(() => undefined);
          return;
        }
        setCameraReady(true);
        setStatus({ kind: "scanning", text: "掃描中…" });

        // Seed counter from server
        try {
          const q = new URLSearchParams({
            entity_type: entityType,
            entity_id: String(entityId),
            schedule_id: String(scheduleId),
          });
          const r = await fetch(`${sessionCountUrl}?${q}`, {
            credentials: "same-origin",
            headers: { Accept: "application/json" },
          });
          const j = await r.json();
          if (typeof j?.scan_count === "number") setScanCount(j.scan_count);
        } catch {
          /* ignore */
        }
      } catch (e) {
        if (!cancelled) {
          setCameraError(e instanceof Error ? e.message : "無法開啟相機");
          setStatus({ kind: "error", text: "無法開啟相機，請允許權限後重試" });
        }
      }
    })();

    return () => {
      cancelled = true;
      void stopCamera();
    };
    // onDecoded intentionally omitted — uses refs for continuous; remount on step/schedule change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, step, scheduleId, entityType, entityId, sessionCountUrl, stopCamera]);

  if (!open) return null;

  const statusBg =
    status.kind === "success"
      ? "#ECFDF5"
      : status.kind === "walk_in"
        ? "#FFF7ED"
        : status.kind === "dup"
          ? "#FEF3C7"
          : status.kind === "error"
            ? "#FEF2F2"
            : "#F8FAFC";
  const statusColor =
    status.kind === "success"
      ? "#065F46"
      : status.kind === "walk_in"
        ? "#C2410C"
        : status.kind === "dup"
          ? "#92400E"
          : status.kind === "error"
            ? "#991B1B"
            : ERP.colors.textSecondary;

  const startWithSchedule = (id: number, label: string) => {
    setScheduleId(id);
    setStageLabel(label);
    setStep("scanner");
  };

  return (
    <>
      <div
        onClick={() => void handleClose()}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15,23,42,0.72)",
          zIndex: 800,
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          width: "min(520px, 96vw)",
          maxHeight: "min(92vh, 900px)",
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
          zIndex: 810,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          fontFamily: F,
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #0F766E 0%, #115E59 100%)",
            padding: "16px 18px",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <QrCode size={18} color="#fff" />
              <span style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>📱 QR 簽到</span>
            </div>
            <div style={{ fontSize: 12, color: "#99F6E4" }}>
              {entityLabel || (entityType === "club" ? "學會例會" : "活動")}
              {step === "scanner" ? ` · ${stageLabel}` : ""}
            </div>
          </div>
          <button
            type="button"
            onClick={() => void handleClose()}
            aria-label="關閉"
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              border: "none",
              background: "rgba(255,255,255,0.18)",
              color: "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 18, overflowY: "auto", flex: 1 }}>
          {step === "context" && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: ERP.colors.textPrimary, marginBottom: 6 }}>
                選擇簽到情境
              </div>
              <div style={{ fontSize: 12, color: ERP.colors.textMuted, marginBottom: 14 }}>
                {entityType === "club"
                  ? "學會例會沒有階段，將記錄為今日簽到。"
                  : "若活動有多個階段（初賽／決賽等），請先選擇要簽到的場次。"}
              </div>

              {loadingSchedules ? (
                <div style={{ padding: 24, textAlign: "center", color: ERP.colors.textMuted, fontSize: 13 }}>
                  載入階段中…
                </div>
              ) : entityType === "club" || schedules.length === 0 ? (
                <button
                  type="button"
                  onClick={() => startWithSchedule(0, entityType === "club" ? "今日例會簽到" : "今日簽到")}
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    borderRadius: 12,
                    border: `1px solid ${ERP.colors.accentLight}`,
                    background: ERP.colors.accentPale,
                    color: ERP.colors.accent,
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: "pointer",
                    fontFamily: F,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <Camera size={16} /> 確認 — 開啟相機簽到
                </button>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {schedules.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => startWithSchedule(s.id, s.label)}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "12px 14px",
                        borderRadius: 12,
                        border: `1px solid ${ERP.colors.border}`,
                        background: ERP.colors.surface,
                        cursor: "pointer",
                        fontFamily: F,
                      }}
                    >
                      <div style={{ fontSize: 14, fontWeight: 700, color: ERP.colors.textPrimary }}>{s.label}</div>
                      <div style={{ fontSize: 11, color: ERP.colors.textMuted, marginTop: 2 }}>
                        {[s.label_en, s.date].filter(Boolean).join(" · ") || `階段 #${s.id}`}
                      </div>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => startWithSchedule(0, "今日簽到（不指定階段）")}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: 10,
                      border: `1px dashed ${ERP.colors.border}`,
                      background: "transparent",
                      color: ERP.colors.textSecondary,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: F,
                    }}
                  >
                    不指定階段 — 今日簽到
                  </button>
                </div>
              )}
            </div>
          )}

          {step === "scanner" && (
            <div>
              {/* Continuous toggle + counter */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  marginBottom: 12,
                  flexWrap: "wrap",
                }}
              >
                <label
                  htmlFor="continuousScanToggle"
                  className="form-check form-switch"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 10,
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 600,
                    color: ERP.colors.textPrimary,
                    margin: 0,
                    userSelect: "none",
                  }}
                >
                  <span
                    style={{
                      position: "relative",
                      width: 48,
                      height: 28,
                      flexShrink: 0,
                      borderRadius: 999,
                      background: continuous ? "#0D9488" : "#CBD5E1",
                      transition: "background 0.2s ease",
                      boxShadow: continuous ? "inset 0 0 0 1px rgba(13,148,136,0.35)" : "inset 0 0 0 1px #94A3B8",
                    }}
                  >
                    <input
                      id="continuousScanToggle"
                      className="form-check-input"
                      type="checkbox"
                      role="switch"
                      aria-checked={continuous}
                      checked={continuous}
                      onChange={(e) => setContinuous(e.target.checked)}
                      style={{
                        position: "absolute",
                        inset: 0,
                        opacity: 0,
                        width: "100%",
                        height: "100%",
                        margin: 0,
                        cursor: "pointer",
                        zIndex: 2,
                      }}
                    />
                    <span
                      aria-hidden
                      style={{
                        position: "absolute",
                        top: 3,
                        left: continuous ? 23 : 3,
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        background: "#fff",
                        boxShadow: "0 1px 4px rgba(15,23,42,0.25)",
                        transition: "left 0.2s ease",
                        pointerEvents: "none",
                      }}
                    />
                  </span>
                  <span className="form-check-label mb-0">連續掃描模式 (Continuous Scan)</span>
                </label>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 800,
                    color: ERP.colors.accent,
                    background: ERP.colors.accentPale,
                    border: `1px solid ${ERP.colors.accentLight}`,
                    borderRadius: 999,
                    padding: "4px 12px",
                  }}
                >
                  已簽到: {scanCount} 人
                </div>
              </div>

              {/* Camera */}
              <div
                id={readerId.current}
                style={{
                  width: "100%",
                  maxWidth: 500,
                  margin: "0 auto",
                  borderRadius: 12,
                  overflow: "hidden",
                  background: "#0f172a",
                  minHeight: 240,
                }}
              />

              {cameraError && (
                <div
                  style={{
                    marginTop: 10,
                    padding: "10px 12px",
                    borderRadius: 10,
                    background: "#FEF2F2",
                    color: "#991B1B",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {cameraError}
                </div>
              )}

              {/* Status */}
              <div
                style={{
                  marginTop: 12,
                  padding: "12px 14px",
                  borderRadius: 12,
                  background: statusBg,
                  color: statusColor,
                  fontSize: 13,
                  fontWeight: 700,
                  minHeight: 44,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {status.kind === "success" && <CheckCircle2 size={16} />}
                {status.kind === "walk_in" && <AlertTriangle size={16} />}
                {status.kind === "dup" && <AlertTriangle size={16} />}
                <span>{status.text}</span>
              </div>

              {!continuous && awaitingNext && (
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <button
                    type="button"
                    onClick={() => void handleClose()}
                    style={{
                      flex: 1,
                      padding: "11px",
                      borderRadius: 10,
                      border: `1px solid ${ERP.colors.border}`,
                      background: "transparent",
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: "pointer",
                      fontFamily: F,
                    }}
                  >
                    關閉 Close
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAwaitingNext(false);
                      setStatus({ kind: "scanning", text: "掃描中…" });
                      resumeScanner();
                    }}
                    style={{
                      flex: 2,
                      padding: "11px",
                      borderRadius: 10,
                      border: "none",
                      background: ERP.colors.accent,
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: "pointer",
                      fontFamily: F,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    <RotateCcw size={14} /> 掃描下一個 Scan Next
                  </button>
                </div>
              )}

              {cameraReady && continuous && (
                <div style={{ marginTop: 10, fontSize: 11, color: ERP.colors.textMuted, textAlign: "center" }}>
                  連續模式已開啟 — 掃完一位會自動繼續，重複學生會即時提示。
                </div>
              )}

              <button
                type="button"
                id="btnFinishScan"
                className="btn btn-primary w-100 mt-3 py-2 fs-5 text-white fw-bold"
                onClick={handleFinishSignIn}
                style={{
                  width: "100%",
                  marginTop: 16,
                  padding: "14px 16px",
                  borderRadius: 12,
                  border: "none",
                  background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
                  color: "#fff",
                  fontSize: 16,
                  fontWeight: 800,
                  fontFamily: F,
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(37,99,235,0.35)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  minHeight: 52,
                }}
              >
                ✅ 完成簽到
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
