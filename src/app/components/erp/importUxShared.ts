// Shared UX helpers for Data Import (`/roster`): URL/session state, wrong-module
// detection, batch-queue types, and in-tab import ledger.

export type ImportModuleId =
  | "students"
  | "classes"
  | "scores"
  | "activities"
  | "clubs"
  | "projects";

export type QueueFileStatus =
  | "pending"
  | "previewing"
  | "ready"
  | "importing"
  | "done"
  | "error";

export type QueuedImportFile = {
  id: string;
  file: File;
  status: QueueFileStatus;
  summary?: string;
  previewData?: Record<string, unknown>;
  result?: Record<string, unknown>;
  error?: string;
  warning?: string;
  duplicate?: boolean;
};

export type SessionImportEntry = {
  id: string;
  filename: string;
  module: ImportModuleId;
  moduleLabel: string;
  academicYear: string;
  batchId?: string | number;
  summary: string;
  at: number;
};

export type WrongModuleHint = {
  target: ImportModuleId;
  targetLabel: string;
  message: string;
};

export const MODULE_LABELS: Record<ImportModuleId, string> = {
  students: "學生檔案",
  classes: "班級與動態分組",
  scores: "測考成績與大分紙",
  activities: "活動、比賽與證書",
  clubs: "學會與崗位名冊",
  projects: "跨學科分組專題",
};

const STORAGE_KEY = "sts_import_ux_v1";
const LEDGER_KEY = "sts_import_ledger_v1";

/** Map URL `module=` aliases → internal ModuleId. */
export function parseModuleParam(raw: string | null | undefined): ImportModuleId | null {
  const v = String(raw || "").trim().toLowerCase();
  if (!v) return null;
  if (v === "students" || v === "student") return "students";
  if (v === "groups" || v === "classes" || v === "group" || v === "class") return "classes";
  if (v === "scores" || v === "score" || v === "broadsheet") return "scores";
  if (v === "activities" || v === "activity") return "activities";
  if (v === "clubs" || v === "club") return "clubs";
  if (v === "pbl" || v === "projects" || v === "project") return "projects";
  return null;
}

/** External URL-friendly module slug. */
export function moduleToUrlSlug(id: ImportModuleId): string {
  if (id === "classes") return "groups";
  if (id === "projects") return "pbl";
  return id;
}

export function formatBytes(n: number): string {
  if (!Number.isFinite(n) || n < 0) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function newQueueId(): string {
  return `q_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export type ImportUrlState = {
  module: ImportModuleId | null;
  mode: string | null;
  year: string | null;
};

export function readImportUrlState(): ImportUrlState {
  try {
    const sp = new URLSearchParams(window.location.search);
    const fromUrl: ImportUrlState = {
      module: parseModuleParam(sp.get("module")),
      mode: sp.get("mode"),
      year: sp.get("year") || sp.get("academic_year"),
    };
    if (fromUrl.module || fromUrl.mode || fromUrl.year) return fromUrl;

    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return fromUrl;
    const j = JSON.parse(raw) as Partial<ImportUrlState>;
    return {
      module: parseModuleParam(j.module as string) || fromUrl.module,
      mode: (j.mode as string) || fromUrl.mode,
      year: (j.year as string) || fromUrl.year,
    };
  } catch {
    return { module: null, mode: null, year: null };
  }
}

export function writeImportUrlState(next: {
  module: ImportModuleId;
  mode?: string | null;
  year?: string | null;
}): void {
  try {
    const sp = new URLSearchParams(window.location.search);
    sp.set("module", moduleToUrlSlug(next.module));
    if (next.mode) sp.set("mode", String(next.mode));
    else sp.delete("mode");
    if (next.year) sp.set("year", String(next.year));
    else sp.delete("year");
    const qs = sp.toString();
    const url = `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash || ""}`;
    window.history.replaceState(null, "", url);
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        module: next.module,
        mode: next.mode || null,
        year: next.year || null,
      }),
    );
  } catch {
    /* ignore */
  }
}

export function loadSessionLedger(): SessionImportEntry[] {
  try {
    const raw = sessionStorage.getItem(LEDGER_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? (arr as SessionImportEntry[]) : [];
  } catch {
    return [];
  }
}

export function appendSessionLedger(entry: Omit<SessionImportEntry, "id" | "at"> & { id?: string; at?: number }): SessionImportEntry[] {
  const full: SessionImportEntry = {
    id: entry.id || newQueueId(),
    filename: entry.filename,
    module: entry.module,
    moduleLabel: entry.moduleLabel || MODULE_LABELS[entry.module],
    academicYear: entry.academicYear,
    batchId: entry.batchId,
    summary: entry.summary,
    at: entry.at || Date.now(),
  };
  const prev = loadSessionLedger();
  const next = [full, ...prev].slice(0, 40);
  try {
    sessionStorage.setItem(LEDGER_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}

export function isDuplicateInLedger(
  filename: string,
  module: ImportModuleId,
  academicYear: string,
): boolean {
  const name = filename.trim().toLowerCase();
  return loadSessionLedger().some(
    (e) =>
      e.filename.trim().toLowerCase() === name &&
      e.module === module &&
      e.academicYear === academicYear,
  );
}

/** Lightweight filename heuristics for cross-module mistakes. */
export function detectSuggestedModule(filename: string): ImportModuleId | null {
  const n = filename || "";
  if (/activity[_ ]?participant|活動參與|活動名單|比賽名單/i.test(n)) return "activities";
  if (/club[_ ]?member|學會|社團名冊/i.test(n)) return "clubs";
  if (/大分紙|broadsheet|成績表|成績|[\b_](UT|Exam|Mock)[\b_]/i.test(n)) return "scores";
  if (/中文|英文|數學|選修|修讀科目|分組|教學組|elective|streaming/i.test(n)) return "classes";
  if (/學生名冊|mark.?sheet|座位表|班級名冊|student.?list|roster/i.test(n)) return "students";
  if (/專題|PBL|project/i.test(n)) return "projects";
  return null;
}

export function wrongModuleHint(
  current: ImportModuleId,
  filename: string,
): WrongModuleHint | null {
  const suggested = detectSuggestedModule(filename);
  if (!suggested || suggested === current) return null;

  const messages: Partial<Record<ImportModuleId, string>> = {
    classes:
      "偵測到此檔案疑似為「教學分組 / 選修科名單」，建議在 Step 2 匯入以免污染學生主檔。",
    scores:
      "偵測到此檔案疑似為「測考成績 / 大分紙」，建議在 Step 3 匯入。",
    activities:
      "偵測到此檔案疑似為「活動參與名單」，建議在 Step 4 匯入。",
    clubs:
      "偵測到此檔案疑似為「學會名冊」，建議在 Step 5 匯入。",
    students:
      "偵測到此檔案疑似為「學生名冊 / 座位表」，建議在 Step 1 匯入。",
    projects:
      "偵測到此檔案疑似為「專題分組」，建議在 Step 6 匯入。",
  };

  return {
    target: suggested,
    targetLabel: MODULE_LABELS[suggested],
    message: messages[suggested] || `建議改至「${MODULE_LABELS[suggested]}」匯入。`,
  };
}

export function makeQueuedFiles(
  files: File[],
  module: ImportModuleId,
  academicYear: string,
): QueuedImportFile[] {
  return files.map((file) => ({
    id: newQueueId(),
    file,
    status: "pending" as const,
    duplicate: isDuplicateInLedger(file.name, module, academicYear),
    warning: isDuplicateInLedger(file.name, module, academicYear)
      ? "本次已匯入過"
      : undefined,
  }));
}

export async function parseFetchJson(res: Response): Promise<Record<string, unknown>> {
  const rawText = await res.text();
  let json: Record<string, unknown> = {};
  try {
    json = rawText ? (JSON.parse(rawText) as Record<string, unknown>) : {};
  } catch {
    const snippet = rawText.replace(/\s+/g, " ").slice(0, 180);
    throw new Error(
      `伺服器回應不是有效 JSON（HTTP ${res.status}${res.statusText ? " " + res.statusText : ""}）。${snippet ? " 內容：" + snippet : ""}`,
    );
  }
  if (!res.ok) {
    const msg = String(json.message || json.error || `HTTP ${res.status}`);
    const errs = Array.isArray(json.errors) ? (json.errors as unknown[]).map(String).join("；") : "";
    throw new Error(errs ? `${msg} — ${errs}` : msg);
  }
  return json;
}
