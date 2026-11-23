// Shared battle-tested file dropzone for Data Import (1.F.1) wizards.
// onDragOver / onDragEnter always preventDefault so the browser never navigates away.
import React, { useCallback, useEffect, useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { ERP } from "./erpTokens";

const C = ERP.colors;
const R = ERP.radius;

const DEFAULT_ACCEPT = ".csv,.xls,.xlsx";

function parseAccept(accept: string): string[] {
  return accept
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .map((s) => (s.startsWith(".") ? s : `.${s}`));
}

function fileMatches(file: File, exts: string[]): boolean {
  if (!exts.length) return true;
  const name = (file.name || "").toLowerCase();
  const dot = name.lastIndexOf(".");
  if (dot < 0) return false;
  return exts.includes(name.slice(dot));
}

export type FileDropZoneProps = {
  /** Comma-separated extensions, e.g. ".csv,.xls,.xlsx" */
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  busy?: boolean;
  /** Primary label when idle (overridden while dragging). */
  label?: React.ReactNode;
  /** Secondary hint under the label. */
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  /** Called with validated File[] — same path as native <input onChange>. */
  onFiles: (files: File[]) => void;
  style?: React.CSSProperties;
  className?: string;
  /** Optional reject callback when dropped files fail extension check. */
  onReject?: (reason: string) => void;
};

export const FileDropZone: React.FC<FileDropZoneProps> = ({
  accept = DEFAULT_ACCEPT,
  multiple = false,
  disabled = false,
  busy = false,
  label,
  hint,
  icon,
  onFiles,
  style,
  className,
  onReject,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragDepth = useRef(0);
  const exts = parseAccept(accept);

  // Prevent browser tab hijack (navigate/open file) while this zone is mounted.
  useEffect(() => {
    const block = (e: DragEvent) => {
      // Only intercept when files are being dragged.
      if (!e.dataTransfer?.types?.includes("Files")) return;
      e.preventDefault();
    };
    window.addEventListener("dragover", block);
    window.addEventListener("drop", block);
    return () => {
      window.removeEventListener("dragover", block);
      window.removeEventListener("drop", block);
    };
  }, []);

  const emitFiles = useCallback(
    (list: FileList | File[] | null | undefined) => {
      if (disabled || busy) return;
      const raw = Array.from(list || []);
      if (!raw.length) return;
      const valid = raw.filter((f) => fileMatches(f, exts));
      if (!valid.length) {
        onReject?.(`僅支援 ${exts.join(" / ")} 檔案`);
        return;
      }
      const picked = multiple ? valid : valid.slice(0, 1);
      onFiles(picked);
    },
    [busy, disabled, exts, multiple, onFiles, onReject],
  );

  const onDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled || busy) return;
    if (!e.dataTransfer?.types?.includes("Files")) return;
    dragDepth.current += 1;
    setIsDragging(true);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled || busy) return;
    if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Avoid flicker when moving over children: only clear when leaving the zone.
    const related = e.relatedTarget as Node | null;
    if (related && e.currentTarget.contains(related)) return;
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepth.current = 0;
    setIsDragging(false);
    if (disabled || busy) return;
    emitFiles(e.dataTransfer?.files);
  };

  const openPicker = () => {
    if (disabled || busy) return;
    const el = inputRef.current;
    if (!el) return;
    // Reset so re-selecting the same file still fires onChange.
    el.value = "";
    el.click();
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    emitFiles(e.target.files);
    // Reset after read so the next identical selection works.
    e.target.value = "";
  };

  const idleLabel = label ?? (multiple ? "拖放或點擊上傳一個或多個檔案" : "拖放或點擊上傳檔案");
  const activeLabel = busy ? "處理中…" : isDragging ? "放開滑鼠以上傳檔案" : idleLabel;

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      className={className}
      aria-disabled={disabled || busy}
      onClick={openPicker}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openPicker();
        }
      }}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: 28,
        border: `2px dashed ${isDragging ? C.accent : C.border}`,
        borderRadius: R.lg,
        background: isDragging ? C.accentPale : "#F8FAFC",
        cursor: disabled || busy ? "not-allowed" : "pointer",
        outline: isDragging ? `2px solid ${C.accent}` : "none",
        outlineOffset: 2,
        transition: "border-color 0.12s, background 0.12s",
        opacity: disabled ? 0.55 : 1,
        ...style,
      }}
    >
      {icon ?? <UploadCloud size={28} color={isDragging ? C.accent : C.accent} />}
      <span style={{
        fontSize: 13, fontWeight: 700,
        color: isDragging ? C.accent : C.textPrimary,
        textAlign: "center",
        fontFamily: ERP.font.family,
      }}>
        {activeLabel}
      </span>
      {hint && !isDragging && (
        <span style={{ fontSize: 11, color: C.textMuted, textAlign: "center", fontFamily: ERP.font.family }}>
          {hint}
        </span>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        hidden
        disabled={disabled || busy}
        onChange={onInputChange}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
};

export default FileDropZone;
