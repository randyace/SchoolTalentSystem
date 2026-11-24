/** Shared academic-year helpers — keep /students ↔ /classes in sync via localStorage. */
const STORAGE_KEY = "sts.preferredAcademicYear";

export function readPreferredAcademicYear(): string | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v && /^\d{4}\/\d{2}$/.test(v) ? v : null;
  } catch {
    return null;
  }
}

export function writePreferredAcademicYear(year: string): void {
  if (!year || !/^\d{4}\/\d{2}$/.test(year)) return;
  try {
    localStorage.setItem(STORAGE_KEY, year);
  } catch {
    /* ignore quota / private mode */
  }
}

/** Prefer bridge year → localStorage → fallback. */
export function resolveClientAcademicYear(
  bridgeYear?: string | null,
  years?: string[] | null,
  fallback = "2025/26",
): string {
  const fromBridge = (bridgeYear || "").trim();
  if (fromBridge && fromBridge !== "all") return fromBridge;
  const preferred = readPreferredAcademicYear();
  if (preferred && (!years?.length || years.includes(preferred))) return preferred;
  if (years && years.length > 0) return years[0];
  return fallback;
}
