// Shared batch-queue / wrong-module / session-ledger / continue-import UI for Data Import wizards.
import React, { useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Loader2, X, XCircle } from "lucide-react";
import { ERP } from "./erpTokens";
import {
  formatBytes,
  MODULE_LABELS,
  type ImportModuleId,
  type QueuedImportFile,
  type QueueFileStatus,
  type SessionImportEntry,
  type WrongModuleHint,
} from "./importUxShared";
import { wizardPrimaryBtn, wizardSecondaryBtn } from "./ImportWizardChrome";

const F = ERP.font.family;
const C = ERP.colors;

const STATUS_PILL: Record<QueueFileStatus, { bg: string; color: string; label: string }> = {
  pending: { bg: "#F1F5F9", color: "#475569", label: "待預覽" },
  previewing: { bg: "#DBEAFE", color: "#1D4ED8", label: "預覽中" },
  ready: { bg: "#E0E7FF", color: "#3730A3", label: "就緒" },
  importing: { bg: "#FEF3C7", color: "#B45309", label: "匯入中" },
  done: { bg: "#DCFCE7", color: "#15803D", label: "✅ 完成" },
  error: { bg: "#FEE2E2", color: "#B91C1C", label: "❌ 失敗" },
};

export const WrongModuleBanner: React.FC<{
  hint: WrongModuleHint;
  onTransfer: () => void;
  onDismiss?: () => void;
}> = ({ hint, onTransfer, onDismiss }) => (
  <div
    role="alert"
    style={{
      background: "#FFFBEB",
      border: "1.5px solid #F59E0B",
      borderRadius: 10,
      padding: 14,
      display: "flex",
      flexDirection: "column",
      gap: 10,
      fontFamily: F,
    }}
  >
    <div style={{ display: "flex", gap: 8, alignItems: "flex-start", color: "#92400E", fontSize: 13, fontWeight: 700 }}>
      <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
      <span>⚠️ {hint.message}</span>
    </div>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      <button type="button" onClick={onTransfer} style={wizardPrimaryBtn(false)}>
        一鍵移至 {hint.targetLabel} →
      </button>
      {onDismiss && (
        <button type="button" onClick={onDismiss} style={wizardSecondaryBtn()}>
          仍在此模組繼續
        </button>
      )}
    </div>
  </div>
);

export const ImportBatchQueuePanel: React.FC<{
  items: QueuedImportFile[];
  busy?: boolean;
  progressLabel?: string | null;
  progressPct?: number;
  onRemove: (id: string) => void;
  onPreviewAll?: () => void;
  onImportAll?: () => void;
  onRetry?: (id: string) => void;
}> = ({
  items,
  busy,
  progressLabel,
  progressPct,
  onRemove,
  onPreviewAll,
  onImportAll,
  onRetry,
}) => {
  if (!items.length) return null;
  const pendingOrReady = items.filter((i) => i.status === "pending" || i.status === "ready" || i.status === "error").length;
  const canImport = items.some((i) => i.status === "ready" || i.status === "pending" || i.status === "error");

  return (
    <div style={{
      marginTop: 12,
      border: `1.5px solid ${C.border}`,
      borderRadius: 10,
      overflow: "hidden",
      background: "#fff",
      fontFamily: F,
    }}>
      <div style={{
        padding: "10px 12px",
        background: "#F8FAFC",
        borderBottom: `1px solid ${C.border}`,
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <strong style={{ fontSize: 13 }}>批次佇列（{items.length} 檔）</strong>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {onPreviewAll && (
            <button type="button" disabled={!!busy} onClick={onPreviewAll} style={wizardSecondaryBtn()}>
              開始預覽全部（{items.length} 檔）
            </button>
          )}
          {onImportAll && (
            <button type="button" disabled={!!busy || !canImport} onClick={onImportAll} style={wizardPrimaryBtn(!!busy || !canImport)}>
              一鍵順序匯入全部（{pendingOrReady || items.length} 檔）
            </button>
          )}
        </div>
      </div>

      {(progressLabel || typeof progressPct === "number") && (
        <div style={{ padding: "10px 12px", borderBottom: `1px solid ${C.border}`, background: "#EFF6FF" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#1D4ED8", marginBottom: 6 }}>
            {progressLabel || "處理中…"}
          </div>
          <div style={{ height: 8, borderRadius: 999, background: "#DBEAFE", overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${Math.max(0, Math.min(100, progressPct ?? 0))}%`,
              background: "#2563EB",
              transition: "width 0.25s ease",
            }} />
          </div>
        </div>
      )}

      <div style={{ maxHeight: 320, overflow: "auto" }}>
        {items.map((item) => {
          const pill = STATUS_PILL[item.status];
          return (
            <div
              key={item.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: 8,
                padding: "10px 12px",
                borderBottom: `1px solid ${C.border}`,
                alignItems: "center",
                fontSize: 12,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                  <span style={{ fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>
                    {item.file.name}
                  </span>
                  <span style={{ color: C.textMuted }}>{formatBytes(item.file.size)}</span>
                  <span style={{
                    fontSize: 10, fontWeight: 800, padding: "2px 7px", borderRadius: 999,
                    background: pill.bg, color: pill.color,
                  }}>{pill.label}</span>
                  {item.duplicate && (
                    <span style={{
                      fontSize: 10, fontWeight: 800, padding: "2px 7px", borderRadius: 999,
                      background: "#FEF3C7", color: "#B45309",
                    }}>⚠️ 本次已匯入過</span>
                  )}
                </div>
                {item.summary && (
                  <div style={{ marginTop: 4, color: C.textSecondary }}>{item.summary}</div>
                )}
                {item.error && (
                  <div style={{ marginTop: 4, color: "#B91C1C", display: "flex", gap: 4, alignItems: "flex-start" }}>
                    <XCircle size={12} style={{ marginTop: 2 }} /> {item.error}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                {item.status === "error" && onRetry && (
                  <button type="button" disabled={!!busy} onClick={() => onRetry(item.id)} style={{ ...wizardSecondaryBtn(), padding: "4px 8px", fontSize: 11 }}>
                    重試
                  </button>
                )}
                {(item.status === "previewing" || item.status === "importing") && (
                  <Loader2 size={14} color={C.accent} style={{ animation: "spin 1s linear infinite" }} />
                )}
                {item.status === "done" && <CheckCircle2 size={14} color="#15803D" />}
                {item.status !== "importing" && item.status !== "previewing" && (
                  <button
                    type="button"
                    aria-label="移除"
                    disabled={!!busy}
                    onClick={() => onRemove(item.id)}
                    style={{
                      border: "none", background: "transparent", cursor: busy ? "not-allowed" : "pointer",
                      color: C.textMuted, padding: 4, borderRadius: 6,
                    }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const SessionImportLedger: React.FC<{
  entries: SessionImportEntry[];
  moduleFilter?: ImportModuleId;
}> = ({ entries, moduleFilter }) => {
  const [open, setOpen] = useState(false);
  const list = moduleFilter ? entries.filter((e) => e.module === moduleFilter) : entries;
  if (!list.length) return null;

  return (
    <div style={{
      marginTop: 12,
      border: `1px solid ${C.border}`,
      borderRadius: 10,
      background: "#F8FAFC",
      fontFamily: F,
      overflow: "hidden",
    }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 12px", border: "none", background: "transparent", cursor: "pointer",
          fontFamily: F, fontSize: 12, fontWeight: 800, color: C.textSecondary,
        }}
      >
        <span>本次已匯入（{list.length} 檔）</span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {open && (
        <div style={{ padding: "0 12px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
          {list.map((e) => (
            <div key={e.id} style={{
              fontSize: 11, padding: "8px 10px", borderRadius: 8,
              background: "#fff", border: `1px solid ${C.border}`, color: C.textSecondary,
            }}>
              <strong style={{ color: C.textPrimary }}>{e.filename}</strong>
              {" · "}
              <span style={{
                fontSize: 10, fontWeight: 800, padding: "1px 6px", borderRadius: 999,
                background: "#EFF6FF", color: "#1D4ED8",
              }}>{e.moduleLabel || MODULE_LABELS[e.module]}</span>
              {e.batchId != null && <> · 批次 #{String(e.batchId)}</>}
              {e.summary ? <> · {e.summary}</> : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const ContinueImportButton: React.FC<{
  moduleLabel: string;
  onClick: () => void;
}> = ({ moduleLabel, onClick }) => (
  <button type="button" onClick={onClick} style={{ ...wizardPrimaryBtn(false), fontSize: 14, padding: "12px 18px" }}>
    ＋ 繼續匯入更多【{moduleLabel}】檔案
  </button>
);

export default ImportBatchQueuePanel;
