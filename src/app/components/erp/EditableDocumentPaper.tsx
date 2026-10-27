import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Loader2, RefreshCw, Sparkles, Info } from "lucide-react";
import { jsonHeaders, type OutputType } from "./aiWorkspaceApi";

const FONT = "-apple-system, 'PingFang TC', 'Hiragino Sans GB', 'Noto Sans TC', 'Microsoft JhengHei', sans-serif";

type ToolbarAction =
  | "polish"
  | "expand"
  | "shorten"
  | "translate"
  | "bullet_points"
  | "proofread"
  | "regenerate";

type ToolbarItem =
  | { type: "action"; action: ToolbarAction; label: string; color: string }
  | { type: "divider" };

type FloatingState = {
  visible: boolean;
  top: number;
  left: number;
  selectedText: string;
  start: number;
  end: number;
};

const TOOLBAR_ITEMS: ToolbarItem[] = [
  { type: "action", action: "polish", label: "✨ 潤飾語氣", color: "#C4B5FD" },
  { type: "action", action: "expand", label: "➕ 加入細節", color: "#6EE7B7" },
  { type: "action", action: "shorten", label: "➖ 縮短", color: "#FCA5A5" },
  { type: "divider" },
  { type: "action", action: "translate", label: "🌐 中英互譯", color: "#7DD3FC" },
  { type: "action", action: "bullet_points", label: "📝 轉為列點", color: "#FCD34D" },
  { type: "action", action: "proofread", label: "✅ 校對糾錯", color: "#86EFAC" },
  { type: "divider" },
  { type: "action", action: "regenerate", label: "🔄 重新生成", color: "#94A3B8" },
];

const ACTION_TOAST: Record<ToolbarAction, string> = {
  polish: "✨ 語氣潤飾完成",
  expand: "➕ 已擴展段落細節",
  shorten: "➖ 段落已精簡",
  translate: "🌐 中英互譯完成",
  bullet_points: "📝 已轉為列點",
  proofread: "✅ 校對糾錯完成",
  regenerate: "🔄 段落已重新生成",
};

/** Convert HTML <ul>/<li> (or plain text) into editor-friendly bullet lines. */
function normalizeBulletReplacement(raw: string): string {
  const text = raw.trim();
  if (!/<li[\s>]/i.test(text)) return text;
  try {
    const tmp = document.createElement("div");
    tmp.innerHTML = text;
    const items = Array.from(tmp.querySelectorAll("li"))
      .map((li) => (li.textContent || "").trim())
      .filter(Boolean)
      .map((line) => (line.startsWith("•") || line.startsWith("-") || line.startsWith("－") ? line : `• ${line}`));
    if (items.length) return items.join("\n");
  } catch {
    /* fall through */
  }
  return text;
}

function unwrapProcessingSpans(root: HTMLElement): void {
  root.querySelectorAll("span.ai-processing-text").forEach((span) => {
    const parent = span.parentNode;
    if (!parent) return;
    while (span.firstChild) parent.insertBefore(span.firstChild, span);
    parent.removeChild(span);
    parent.normalize();
  });
}

/** Wrap the current selection offsets in a shimmer span; returns the span or null. */
function wrapSelectionWithShimmer(root: HTMLElement, start: number, end: number): HTMLSpanElement | null {
  unwrapProcessingSpans(root);
  const range = setSelectionByOffsets(root, start, end);
  if (!range) return null;
  const span = document.createElement("span");
  span.className = "ai-processing-text";
  try {
    range.surroundContents(span);
  } catch {
    // Partial node selection — extract + reinsert
    try {
      const contents = range.extractContents();
      span.appendChild(contents);
      range.insertNode(span);
    } catch {
      return null;
    }
  }
  // Keep a collapsed caret inside the span so ::selection pulse is secondary
  const sel = window.getSelection();
  if (sel) {
    const keep = document.createRange();
    keep.selectNodeContents(span);
    sel.removeAllRanges();
    sel.addRange(keep);
  }
  return span;
}

function countOffsetInEditable(root: HTMLElement, targetNode: Node, targetOffset: number): number {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let count = 0;
  let node = walker.nextNode();
  while (node) {
    if (node === targetNode) {
      return count + targetOffset;
    }
    count += (node.textContent || "").length;
    node = walker.nextNode();
  }
  return count;
}

function setSelectionByOffsets(root: HTMLElement, start: number, end: number): Range | null {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let pos = 0;
  let startNode: Text | null = null;
  let startOff = 0;
  let endNode: Text | null = null;
  let endOff = 0;
  let node = walker.nextNode() as Text | null;
  while (node) {
    const len = (node.textContent || "").length;
    if (!startNode && pos + len >= start) {
      startNode = node;
      startOff = start - pos;
    }
    if (!endNode && pos + len >= end) {
      endNode = node;
      endOff = end - pos;
      break;
    }
    pos += len;
    node = walker.nextNode() as Text | null;
  }
  if (!startNode || !endNode) return null;
  const range = document.createRange();
  range.setStart(startNode, Math.max(0, Math.min(startOff, startNode.length)));
  range.setEnd(endNode, Math.max(0, Math.min(endOff, endNode.length)));
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
  return range;
}

export type EditableDocumentPaperProps = {
  content: string;
  /** Remount / resync when version or document changes */
  contentKey: string;
  outputType: OutputType;
  outputIcon: string;
  outputZh: string;
  outputEn: string;
  bannerMeta: string;
  showBanner: boolean;
  floatingEnabled: boolean;
  rewritePartialUrl: string;
  tone: string;
  documentId?: number | null;
  csrfName?: string;
  csrfHash?: string;
  isMobile?: boolean;
  onContentChange: (plain: string) => void;
  onToast: (msg: string) => void;
};

export const EditableDocumentPaper: React.FC<EditableDocumentPaperProps> = ({
  content,
  contentKey,
  outputType,
  outputIcon,
  outputZh,
  outputEn,
  bannerMeta,
  showBanner,
  floatingEnabled,
  rewritePartialUrl,
  tone,
  documentId,
  csrfName,
  csrfHash,
  isMobile,
  onContentChange,
  onToast,
}) => {
  const bodyRef = useRef<HTMLDivElement>(null);
  const signRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [floating, setFloating] = useState<FloatingState>({
    visible: false, top: 0, left: 0, selectedText: "", start: 0, end: 0,
  });
  const [busyAction, setBusyAction] = useState<ToolbarAction | null>(null);
  const [pulse, setPulse] = useState(false);
  const savedRangeRef = useRef<{ start: number; end: number; text: string } | null>(null);
  const syncingRef = useRef(false);

  // Sync external content only when version/document epoch changes (preserve caret while typing)
  useLayoutEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    syncingRef.current = true;
    el.innerText = content || "";
    syncingRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- content read once per contentKey
  }, [contentKey]);

  const emitContent = useCallback(() => {
    if (syncingRef.current) return;
    const text = (bodyRef.current?.innerText || "").replace(/\r\n/g, "\n");
    onContentChange(text);
  }, [onContentChange]);

  const hideFloating = useCallback(() => {
    setFloating((f) => (f.visible ? { ...f, visible: false } : f));
  }, []);

  const isProcessing = busyAction !== null;

  const updateSelectionToolbar = useCallback(() => {
    if (!floatingEnabled) {
      hideFloating();
      return;
    }
    // Friction guardrail: freeze toolbar geometry while an AI action runs
    if (busyAction) return;

    const root = bodyRef.current;
    if (!root) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
      hideFloating();
      return;
    }
    const range = sel.getRangeAt(0);
    if (!root.contains(range.commonAncestorContainer)) {
      hideFloating();
      return;
    }
    const selectedText = sel.toString().replace(/\r\n/g, "\n");
    if (selectedText.trim().length < 4) {
      hideFloating();
      return;
    }
    // Ignore selection that is only inside toolbar
    if (toolbarRef.current?.contains(range.commonAncestorContainer)) return;

    const start = countOffsetInEditable(root, range.startContainer, range.startOffset);
    const end = countOffsetInEditable(root, range.endContainer, range.endOffset);
    const rect = range.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      hideFloating();
      return;
    }
    const toolbarW = 720;
    const left = Math.min(
      Math.max(12, rect.left + rect.width / 2 - toolbarW / 2),
      window.innerWidth - toolbarW - 12,
    );
    // position:fixed → use viewport coords (no scrollY)
    const top = Math.max(8, rect.top - 52);
    savedRangeRef.current = { start: Math.min(start, end), end: Math.max(start, end), text: selectedText };
    setFloating({
      visible: true,
      top,
      left,
      selectedText,
      start: Math.min(start, end),
      end: Math.max(start, end),
    });
  }, [floatingEnabled, busyAction, hideFloating]);
  useEffect(() => {
    const onSel = () => updateSelectionToolbar();
    document.addEventListener("selectionchange", onSel);
    return () => document.removeEventListener("selectionchange", onSel);
  }, [updateSelectionToolbar]);

  useEffect(() => {
    if (!floatingEnabled) hideFloating();
  }, [floatingEnabled, hideFloating]);

  const runRewrite = useCallback(async (action: ToolbarAction) => {
    const root = bodyRef.current;
    const saved = savedRangeRef.current;
    if (!root || !saved || saved.text.trim().length < 4) {
      onToast("請先選取至少 4 個字");
      return;
    }
    // Prevent concurrent API calls (double-click / multi-action)
    if (busyAction) return;

    const fullText = root.innerText.replace(/\r\n/g, "\n");
    setBusyAction(action);
    setPulse(true);
    // Non-blocking shimmer on the selected fragment
    wrapSelectionWithShimmer(root, saved.start, saved.end);

    try {
      const res = await fetch(rewritePartialUrl, {
        method: "POST",
        credentials: "same-origin",
        headers: jsonHeaders(csrfName, csrfHash),
        body: JSON.stringify({
          document_id: documentId || undefined,
          full_text: fullText,
          selected_text: saved.text,
          action,
          tone,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        throw new Error(data.message || `rewrite HTTP ${res.status}`);
      }
      let replacement = String(data.replacement_text ?? "").trim();
      if (!replacement) throw new Error("AI 回傳空白內容");
      if (action === "bullet_points") {
        replacement = normalizeBulletReplacement(replacement);
      }

      const shimmer = root.querySelector("span.ai-processing-text");
      if (shimmer) {
        const textNode = document.createTextNode(replacement);
        shimmer.parentNode?.replaceChild(textNode, shimmer);
        emitContent();
      } else {
        // Fallback: restore offsets then insert via execCommand (undo-friendly)
        const range = setSelectionByOffsets(root, saved.start, saved.end);
        if (!range) {
          const next =
            fullText.slice(0, saved.start) + replacement + fullText.slice(saved.end);
          syncingRef.current = true;
          root.innerText = next;
          syncingRef.current = false;
          onContentChange(next);
        } else {
          try {
            const ok = document.execCommand("insertText", false, replacement);
            if (!ok) {
              range.deleteContents();
              range.insertNode(document.createTextNode(replacement));
            }
          } catch {
            range.deleteContents();
            range.insertNode(document.createTextNode(replacement));
          }
          emitContent();
        }
      }
      hideFloating();
      window.getSelection()?.removeAllRanges();
      onToast(ACTION_TOAST[action]);
    } catch (e) {
      unwrapProcessingSpans(root);
      onToast("局部改寫失敗：" + (e instanceof Error ? e.message : "錯誤"));
      // Keep original text — re-select original range for clarity
      setSelectionByOffsets(root, saved.start, saved.end);
    } finally {
      setBusyAction(null);
      setPulse(false);
    }
  }, [
    busyAction, rewritePartialUrl, csrfName, csrfHash, documentId, tone,
    onContentChange, onToast, emitContent, hideFloating,
  ]);
  const empty = !(content || "").trim() && !(bodyRef.current?.innerText || "").trim();

  return (
    <div style={{ width: "100%", maxWidth: 720, background: "#fff", borderRadius: 12, boxShadow: "0 2px 8px rgba(15,23,42,0.07), 0 6px 24px rgba(15,23,42,0.05)", border: "1px solid #E2E8F0", overflow: "visible", position: "relative" }}>
      <style>{`
        @keyframes aiSelPulse {
          0%,100% { background: rgba(99,102,241,0.12); }
          50% { background: rgba(99,102,241,0.28); }
        }
        @keyframes shimmer-text {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .ai-processing-text {
          background: linear-gradient(90deg, #ede9fe 15%, #c4b5fd 35%, #bfdbfe 55%, #e0e7ff 75%, #ede9fe 100%);
          background-size: 200% 100%;
          animation: shimmer-text 1.5s infinite linear;
          color: transparent;
          -webkit-background-clip: text;
          background-clip: text;
          border-radius: 2px;
          box-decoration-break: clone;
          -webkit-box-decoration-break: clone;
        }
        .ai-edit-body:focus { outline: none; }
        .ai-edit-body::selection { background: rgba(99,102,241,0.22); }
        .ai-edit-body.ai-pulse::selection { animation: aiSelPulse 1s ease infinite; background: rgba(99,102,241,0.35); }
        .ai-floating-toolbar button:disabled { cursor: wait; }
      `}</style>

      {showBanner && (
        <div style={{ padding: "8px 24px", background: "linear-gradient(90deg, #EEF2FF, #F5F3FF, #ECFDF5)", borderBottom: "1px solid #C7D2FE", display: "flex", alignItems: "center", gap: 8 }}>
          <Sparkles size={12} color="#6366F1" />
          <span style={{ fontSize: 11, fontWeight: 700, color: "#6366F1" }}>AI 生成內容</span>
          <span style={{ fontSize: 10, color: "#7C3AED" }}>{bannerMeta}</span>
          <span style={{ marginLeft: "auto", fontSize: 10, color: "#94A3B8", display: "flex", alignItems: "center", gap: 4 }}>
            <Info size={10} color="#94A3B8" /> 請覆核後使用 · 可直接編輯
          </span>
        </div>
      )}

      <div style={{ padding: isMobile ? "20px 18px 28px" : "40px 52px 48px", position: "relative" }}>
        {/* Letterhead */}
        <div style={{ textAlign: "center", marginBottom: 28, paddingBottom: 18, borderBottom: "2px solid #F1F5F9" }} contentEditable={false}>
          <div style={{ fontSize: 16, fontWeight: 900, color: "#0F172A", letterSpacing: "0.04em", marginBottom: 4, fontFamily: FONT }}>香港神託會培敦中學</div>
          <div style={{ fontSize: 11.5, color: "#475569", marginBottom: 8, fontFamily: FONT }}>Stewards Pooi Tun Secondary School</div>
          <div style={{ display: "inline-block", padding: "3px 16px", background: "#EEF2FF", border: "1px solid #C7D2FE", borderRadius: 999, fontSize: 11, fontWeight: 700, color: "#6366F1", fontFamily: FONT }}>
            {outputIcon} {outputZh} / {outputEn}
          </div>
        </div>

        {!showBanner && empty ? (
          <div style={{ textAlign: "center", padding: "48px 16px", color: "#94A3B8" }} contentEditable={false}>
            <Sparkles size={28} color="#C7D2FE" style={{ margin: "0 auto 12px" }} />
            <div style={{ fontSize: 14, fontWeight: 700, color: "#475569", marginBottom: 6 }}>尚未生成草稿</div>
            <div style={{ fontSize: 12, lineHeight: 1.6 }}>於左側設定參數後，點擊「✨ 生成草稿」由 GB10 產出內容。</div>
          </div>
        ) : (
          <>
            <div
              ref={bodyRef}
              className={`ai-edit-body${pulse ? " ai-pulse" : ""}`}
              contentEditable={!isProcessing}
              suppressContentEditableWarning
              spellCheck
              role="textbox"
              aria-multiline="true"
              aria-busy={isProcessing}
              aria-label="文件正文"
              onInput={emitContent}
              onMouseUp={updateSelectionToolbar}
              onKeyUp={updateSelectionToolbar}
              onBlur={() => {
                // Delay so toolbar click can fire first
                setTimeout(() => {
                  if (toolbarRef.current?.contains(document.activeElement)) return;
                  // keep floating if selection still valid
                  updateSelectionToolbar();
                }, 180);
              }}
              style={{
                minHeight: 160,
                fontSize: 14,
                lineHeight: 2.05,
                color: "#0F172A",
                fontFamily: FONT,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                cursor: isProcessing ? "wait" : "text",
              }}
            />

            {outputType === "letter" && (
              <div
                ref={signRef}
                contentEditable
                suppressContentEditableWarning
                onInput={() => { /* signatory local only — body drives word count */ }}
                style={{
                  marginTop: 20,
                  padding: "18px 20px",
                  background: "#FAFAFA",
                  border: "1px solid #E2E8F0",
                  borderRadius: 10,
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                  gap: 16,
                  fontFamily: FONT,
                  outline: "none",
                }}
              >
                <div>
                  <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 6 }} contentEditable={false}>簽署人 / Signatory</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#0F172A" }}>陳 志 明 老師</div>
                  <div style={{ fontSize: 11.5, color: "#475569" }}>副校長（學術）· Vice Principal (Academic)</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 6 }} contentEditable={false}>聯絡方式 / Contact</div>
                  <div style={{ fontSize: 11.5, color: "#1E293B", lineHeight: 1.8 }}>(852) 2345-6789{"\n"}cmchan@spoitun.edu.hk</div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Expanded Floating AI Toolbar — fixed above selection; locked while isProcessing */}
      {floating.visible && floatingEnabled && (
        <div
          ref={toolbarRef}
          className="ai-floating-toolbar shadow-lg"
          style={{
            position: "fixed",
            top: floating.top,
            left: floating.left,
            zIndex: 80,
            background: "#1E293B",
            borderRadius: 999,
            padding: "6px 10px",
            display: "flex",
            alignItems: "center",
            gap: 2,
            boxShadow: "0 8px 28px rgba(15,23,42,0.28), 0 2px 8px rgba(15,23,42,0.18)",
            border: "1px solid rgba(255,255,255,0.08)",
            whiteSpace: "nowrap",
            pointerEvents: "auto",
            maxWidth: "calc(100vw - 24px)",
            overflowX: "auto",
          }}
          onMouseDown={(e) => e.preventDefault()}
          aria-busy={isProcessing}
        >
          <div style={{ position: "absolute", bottom: -6, left: "50%", transform: "translateX(-50%)", width: 12, height: 6, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: "6px solid #1E293B" }} />
          {TOOLBAR_ITEMS.map((item, i) => {
            if (item.type === "divider") {
              return (
                <div
                  key={`divider-${i}`}
                  className="vr"
                  style={{ width: 1, height: 18, background: "rgba(148,163,184,0.45)", margin: "0 6px", flexShrink: 0 }}
                />
              );
            }
            const btn = item;
            return (
              <button
                key={btn.action}
                type="button"
                disabled={isProcessing}
                onClick={() => void runRewrite(btn.action)}
                style={{
                  background: busyAction === btn.action ? "rgba(255,255,255,0.12)" : "none",
                  border: "none",
                  cursor: isProcessing ? "wait" : "pointer",
                  padding: "4px 10px",
                  borderRadius: 7,
                  color: btn.color,
                  fontSize: 11.5,
                  fontWeight: 600,
                  fontFamily: FONT,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  opacity: isProcessing && busyAction !== btn.action ? 0.45 : 1,
                  flexShrink: 0,
                }}
              >
                {busyAction === btn.action ? <Loader2 size={11} color={btn.color} style={{ animation: "spin 0.8s linear infinite" }} /> : null}
                {btn.action === "regenerate" && busyAction !== btn.action ? <RefreshCw size={11} color={btn.color} /> : null}
                {btn.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export function countDocChars(text: string): number {
  const stripped = (text || "").replace(/\s+/gu, "");
  return Math.max(0, Array.from(stripped.replace(/[\p{P}\p{S}]+/gu, "")).length);
}

export function buildExportHtml(opts: {
  titleZh: string;
  titleEn: string;
  docLabel: string;
  body: string;
  includeSignatory: boolean;
}): string {
  const bodyHtml = (opts.body || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br/>");
  const sign = opts.includeSignatory
    ? `<div style="margin-top:28px;padding-top:16px;border-top:1px solid #e2e8f0">
        <div style="font-weight:800">陳 志 明 老師</div>
        <div>副校長（學術）· Vice Principal (Academic)</div>
        <div style="margin-top:8px">(852) 2345-6789 · cmchan@spoitun.edu.hk</div>
      </div>`
    : "";
  return `<!DOCTYPE html><html lang="zh-Hant"><head><meta charset="UTF-8"/><title>${opts.docLabel}</title>
    <style>
      body{font-family:"PingFang TC","Noto Sans TC","Microsoft JhengHei",serif;color:#0f172a;line-height:2;max-width:720px;margin:40px auto;padding:0 24px}
      h1{font-size:20px;margin:0;text-align:center;letter-spacing:.04em}
      .en{text-align:center;color:#475569;font-size:12px;margin:4px 0 16px}
      .badge{text-align:center;margin-bottom:28px;font-size:12px;color:#4f46e5}
      .body{font-size:14px;white-space:pre-wrap}
      @media print{body{margin:0}}
    </style></head><body>
    <h1>${opts.titleZh}</h1>
    <div class="en">${opts.titleEn}</div>
    <div class="badge">${opts.docLabel}</div>
    <div class="body">${bodyHtml}</div>
    ${sign}
    </body></html>`;
}
