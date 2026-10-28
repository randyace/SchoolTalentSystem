/** Shared types + fetch helpers for AI Copywriting Workspace (Chunk 2). */

export type OutputType = "letter" | "comment" | "promo";

export type WorkspaceDocType = "recommendation" | "report_comment" | "campus_pr";

export type TargetGroupCode = "ALL_STUDENTS" | "ALL_PARENTS" | "ALL_STAFF";

export const GROUP_TARGET_LABELS: Record<
  TargetGroupCode,
  { label: string; icon: string; bg: string; color: string; border: string }
> = {
  ALL_STUDENTS: { label: "全校學生", icon: "👥", bg: "#EFF6FF", color: "#2563EB", border: "#BFDBFE" },
  ALL_PARENTS:  { label: "全體家長", icon: "👨‍👩‍👧", bg: "#ECFEFF", color: "#0891B2", border: "#A5F3FC" },
  ALL_STAFF:    { label: "全體教職員", icon: "🏫", bg: "#F1F5F9", color: "#475569", border: "#CBD5E1" },
};

export type GenRecord = {
  id: string;
  documentId: number;
  type: string;
  student: string;
  studentId: number | null;
  /** Group chip code when document targets an audience group (not a student). */
  targetGroup: TargetGroupCode | null;
  studentNameZh?: string;
  scenario: string;
  words: number;
  ts: string;
  version: string;
  status: string;
  docType: WorkspaceDocType;
};

export type DocVersion = {
  id: number;
  document_id: number;
  version_num: number;
  version_label: string;
  content: string;
  word_count: number;
  generation_type: string;
  created_at: string;
  parameters_json?: Record<string, unknown> | null;
};

export type StudentHit = {
  id: number;
  text: string;
  name_zh: string;
  name_en: string;
  class_name: string;
  student_code: string;
};

export type StudentContext = {
  student: {
    id: number;
    name_zh: string;
    name_en: string;
    display_name: string;
    class_name: string;
    student_no: string;
  } | null;
  acorn: Array<{ code: string; name_zh_hk: string; name_en: string; score: number }>;
  achievements: Array<{
    achievement_title: string;
    tier_role: string;
    environment_level: string;
  }>;
  badges: Array<{ kind: string; label: string; value: number; tone: string }>;
  highlights: string[];
};

export type UploadedContext = {
  filename: string;
  bytes: number;
  confidence: number;
  summary: string;
  text: string;
  label: string;
  /** document = PDF/DOCX/TXT parse; ocr = GB10 Vision image extract */
  source?: "document" | "ocr";
};

/** Allowed External Context formats — no macro Office (.docm/.xlsm). */
const CONTEXT_FILE_EXTS = new Set([
  "pdf", "docx", "xlsx", "csv", "md", "txt", "jpg", "jpeg", "png",
]);

const CONTEXT_IMAGE_EXTS = new Set(["jpg", "jpeg", "png"]);

const BLOCKED_MACRO_EXTS = new Set(["docm", "xlsm", "pptm", "dotm", "xltm"]);

export function isAllowedContextFile(file: File): boolean {
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (BLOCKED_MACRO_EXTS.has(ext)) return false;
  if (CONTEXT_FILE_EXTS.has(ext)) return true;
  const mime = (file.type || "").toLowerCase();
  return (
    mime === "application/pdf" ||
    mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mime === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mime === "text/csv" ||
    mime === "text/markdown" ||
    mime === "text/plain" ||
    mime === "image/jpeg" ||
    mime === "image/png"
  );
}

export function isContextImageFile(file: File): boolean {
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (CONTEXT_IMAGE_EXTS.has(ext)) return true;
  const mime = (file.type || "").toLowerCase();
  return mime === "image/jpeg" || mime === "image/png";
}

export type WorkspaceStats = {
  total_docs: number;
  generated_this_week: number;
  pending_review: number;
};

export type AiMetadataCategory = "scenario" | "tone" | "audience" | "output_type";

export type AiMetadataOption = {
  id: number;
  category: AiMetadataCategory | string;
  label_zh: string;
  icon?: string | null;
  code?: string | null;
  is_default: boolean;
  created_at?: string | null;
};

export type AiMetadataGrouped = {
  scenario: AiMetadataOption[];
  tone: AiMetadataOption[];
  audience: AiMetadataOption[];
  output_type: AiMetadataOption[];
};

function mapMetadataList(raw: unknown): AiMetadataOption[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((r: Record<string, unknown>) => ({
      id: Number(r.id) || 0,
      category: String(r.category || ""),
      label_zh: String(r.label_zh || ""),
      icon: r.icon != null && String(r.icon) !== "" ? String(r.icon) : null,
      code: r.code != null && String(r.code) !== "" ? String(r.code) : null,
      is_default: Boolean(r.is_default),
      created_at: r.created_at != null ? String(r.created_at) : null,
    }))
    .filter((o) => o.label_zh);
}

export async function fetchAiMetadata(url: string): Promise<AiMetadataGrouped> {
  const res = await fetch(url, {
    headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
    credentials: "same-origin",
  });
  if (!res.ok) throw new Error(`ai-metadata HTTP ${res.status}`);
  const data = await res.json();
  const opts = data.options || {};
  return {
    scenario: mapMetadataList(data.scenario ?? opts.scenario),
    tone: mapMetadataList(data.tone ?? opts.tone),
    audience: mapMetadataList(data.audience ?? opts.audience),
    output_type: mapMetadataList(data.output_type ?? opts.output_type),
  };
}

export async function createAiMetadata(
  url: string,
  category: AiMetadataCategory,
  labelZh: string,
  csrfName?: string,
  csrfHash?: string,
  icon?: string,
): Promise<AiMetadataOption> {
  const body: Record<string, string> = { category, label_zh: labelZh.trim() };
  if (icon) body.icon = icon;
  const res = await fetch(url, {
    method: "POST",
    credentials: "same-origin",
    headers: jsonHeaders(csrfName, csrfHash),
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok || !data.option) {
    throw new Error(data.message || `ai-metadata create HTTP ${res.status}`);
  }
  const o = data.option as Record<string, unknown>;
  return {
    id: Number(o.id) || 0,
    category: String(o.category || category),
    label_zh: String(o.label_zh || labelZh),
    icon: o.icon != null && String(o.icon) !== "" ? String(o.icon) : null,
    code: o.code != null && String(o.code) !== "" ? String(o.code) : null,
    is_default: Boolean(o.is_default),
    created_at: o.created_at != null ? String(o.created_at) : null,
  };
}

export async function deleteAiMetadata(
  url: string,
  id: number,
  csrfName?: string,
  csrfHash?: string,
): Promise<{ deleted_id: number; category: string }> {
  const res = await fetch(`${url.replace(/\/$/, "")}/${id}`, {
    method: "DELETE",
    credentials: "same-origin",
    headers: jsonHeaders(csrfName, csrfHash),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    throw new Error(data.message || `ai-metadata delete HTTP ${res.status}`);
  }
  return {
    deleted_id: Number(data.deleted_id ?? id),
    category: String(data.category || ""),
  };
}

/** Map metadata output_type code → workspace OutputType used by paper UI. */
export function codeToOutputType(code?: string | null): OutputType {
  if (!code) return "letter";
  return API_TO_OUTPUT[code] || "letter";
}

export function outputTypeToCode(ot: OutputType): WorkspaceDocType {
  return OUTPUT_TO_API[ot];
}

export const OUTPUT_TO_API: Record<OutputType, WorkspaceDocType> = {
  letter: "recommendation",
  comment: "report_comment",
  promo: "campus_pr",
};

export const API_TO_OUTPUT: Record<string, OutputType> = {
  recommendation: "letter",
  report_comment: "comment",
  campus_pr: "promo",
};

export const DOC_TYPE_LABEL: Record<WorkspaceDocType, string> = {
  recommendation: "推薦信",
  report_comment: "成績表評語",
  campus_pr: "校園宣傳稿",
};

export function jsonHeaders(csrfName?: string, csrfHash?: string): HeadersInit {
  const h: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  };
  if (csrfName && csrfHash) {
    h["X-CSRF-TOKEN"] = csrfHash;
    h[csrfName] = csrfHash;
  }
  return h;
}

export async function fetchDocuments(url: string): Promise<{
  stats: WorkspaceStats;
  documents: GenRecord[];
}> {
  const res = await fetch(url, {
    headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
    credentials: "same-origin",
  });
  if (!res.ok) throw new Error(`documents HTTP ${res.status}`);
  const data = await res.json();
  const docs = Array.isArray(data.documents) ? data.documents : [];
  const documents: GenRecord[] = docs.map((d: Record<string, unknown>) => {
    const docType = String(d.doc_type || "recommendation") as WorkspaceDocType;
    const groupRaw = String(d.target_group || "").toUpperCase();
    const targetGroup = (groupRaw in GROUP_TARGET_LABELS
      ? groupRaw
      : null) as TargetGroupCode | null;
    const zh = String(d.student_name_zh || "").trim();
    return {
      id: String(d.id),
      documentId: Number(d.id) || 0,
      type: String(d.doc_type_label || DOC_TYPE_LABEL[docType] || docType),
      student: String(d.student_name || "—"),
      studentId: d.student_id != null ? Number(d.student_id) : null,
      targetGroup,
      studentNameZh: zh || undefined,
      scenario: String(d.scenario || "—") || "—",
      words: Number(d.latest_word_count || 0),
      ts: String(d.ts || ""),
      version: String(d.version_label || `V${d.current_version_num || 1}`),
      status: String(d.status || "draft"),
      docType,
    };
  });
  const stats = data.stats || {};
  return {
    stats: {
      total_docs: Number(stats.total_docs ?? documents.length),
      generated_this_week: Number(stats.generated_this_week ?? 0),
      pending_review: Number(stats.pending_review ?? 0),
    },
    documents,
  };
}

export async function deleteDocument(
  baseUrl: string,
  id: number,
  csrfName?: string,
  csrfHash?: string,
): Promise<{ ok: boolean; deleted_id: number; stats: WorkspaceStats; message?: string }> {
  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/${id}`, {
    method: "DELETE",
    credentials: "same-origin",
    headers: jsonHeaders(csrfName, csrfHash),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    throw new Error(data.message || `delete HTTP ${res.status}`);
  }
  const stats = data.stats || {};
  return {
    ok: true,
    deleted_id: Number(data.deleted_id ?? id),
    stats: {
      total_docs: Number(stats.total_docs ?? 0),
      generated_this_week: Number(stats.generated_this_week ?? 0),
      pending_review: Number(stats.pending_review ?? 0),
    },
    message: typeof data.message === "string" ? data.message : undefined,
  };
}

export async function fetchDocumentDetail(
  baseUrl: string,
  id: number,
): Promise<{
  document: Record<string, unknown>;
  versions: DocVersion[];
  current_version: DocVersion | null;
  student_context: StudentContext;
}> {
  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/${id}`, {
    headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
    credentials: "same-origin",
  });
  if (!res.ok) throw new Error(`document HTTP ${res.status}`);
  const data = await res.json();
  return {
    document: data.document || {},
    versions: Array.isArray(data.versions) ? data.versions : [],
    current_version: data.current_version || null,
    student_context: data.student_context || {
      student: null,
      acorn: [],
      achievements: [],
      badges: [],
      highlights: [],
    },
  };
}

export async function fetchStudentContext(
  baseUrl: string,
  studentId: number,
): Promise<StudentContext> {
  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/${studentId}`, {
    headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
    credentials: "same-origin",
  });
  if (!res.ok) throw new Error(`student-context HTTP ${res.status}`);
  const data = await res.json();
  return (
    data.context || {
      student: null,
      acorn: [],
      achievements: [],
      badges: [],
      highlights: [],
    }
  );
}

export async function searchStudents(
  url: string,
  q: string,
): Promise<StudentHit[]> {
  if (!q.trim()) return [];
  const res = await fetch(`${url}?q=${encodeURIComponent(q.trim())}`, {
    headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
    credentials: "same-origin",
  });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data.results) ? data.results : [];
}

export function readWorkspaceRoute(): {
  view: "list" | "editor";
  docId: number | null;
  isNew: boolean;
} {
  const path = window.location.pathname.replace(/\/+$/, "");
  const editMatch = path.match(/\/ai-workspace\/edit\/(\d+)$/);
  if (editMatch) {
    return { view: "editor", docId: Number(editMatch[1]), isNew: false };
  }
  if (path.endsWith("/ai-workspace/new") || path.endsWith("/ai-workspace/edit/new")) {
    return { view: "editor", docId: null, isNew: true };
  }
  const sp = new URLSearchParams(window.location.search);
  const docRaw = sp.get("doc");
  const docId = docRaw ? parseInt(docRaw, 10) : NaN;
  if (Number.isFinite(docId) && docId > 0) {
    return { view: "editor", docId, isNew: false };
  }
  if (sp.get("new") === "1") {
    return { view: "editor", docId: null, isNew: true };
  }
  return { view: "list", docId: null, isNew: false };
}

export function pushWorkspaceRoute(next: {
  view: "list" | "editor";
  docId?: number | null;
  isNew?: boolean;
}): void {
  const url = new URL(window.location.href);
  // Keep base path under /ai-workspace (strip /edit/…)
  url.pathname = url.pathname.replace(/\/ai-workspace(?:\/.*)?$/, "/ai-workspace");
  if (!url.pathname.includes("ai-workspace")) {
    url.pathname = "/ai-workspace";
  }
  url.searchParams.delete("doc");
  url.searchParams.delete("new");
  if (next.view === "editor") {
    if (next.docId && next.docId > 0) {
      url.searchParams.set("doc", String(next.docId));
    } else {
      url.searchParams.set("new", "1");
    }
  }
  const nextUrl = url.pathname + (url.search || "");
  if (nextUrl !== window.location.pathname + window.location.search) {
    window.history.pushState({ aiWorkspace: true }, "", nextUrl);
  }
}

export function badgeStyle(tone: string, index: number): {
  bg: string;
  color: string;
  bd: string;
  sub: string;
} {
  if (tone === "green" || index === 0) {
    return { bg: "#D1FAE5", color: "#065F46", bd: "#6EE7B7", sub: "ACORN" };
  }
  if (tone === "yellow" || index === 1) {
    return { bg: "#DBEAFE", color: "#1E3A8A", bd: "#93C5FD", sub: "ACORN" };
  }
  const palette = [
    { bg: "#EDE9FE", color: "#4C1D95", bd: "#C4B5FD", sub: "Role" },
    { bg: "#FEF3C7", color: "#92400E", bd: "#FDE68A", sub: "Award" },
    { bg: "#FCE7F3", color: "#9D174D", bd: "#F9A8D4", sub: "ERP" },
  ];
  return palette[index % palette.length];
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
