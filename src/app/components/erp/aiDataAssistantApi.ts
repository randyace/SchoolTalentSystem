/** API helpers for AI Data Assistant (GB10 NL→SQL). */

export type AssistantSession = {
  id: number | string;
  title: string;
  summary?: string;
  preview?: string;
  pinned?: boolean;
  is_pinned?: boolean;
  msgCount?: number;
  msg_count?: number;
  date?: string;
  type?: "data" | "export" | "filter" | "report";
  model_name?: string;
  updated_at?: string;
};

export type AssistantStructuredData = {
  columns?: Array<{ key: string; label?: string } | string>;
  rows?: Array<Record<string, string | number | null>>;
  total_count?: number;
  export_title?: string;
  preview_rows?: number;
};

export type AssistantMessage = {
  id: number | string;
  role: "user" | "assistant" | "system" | "ai";
  content: string;
  sql_query?: string | null;
  structured_data?: AssistantStructuredData | null;
  suggested_actions?: string[];
  created_at?: string | null;
};

function jsonHeaders(csrfName?: string, csrfHash?: string): HeadersInit {
  const h: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  };
  if (csrfName && csrfHash) h[csrfName] = csrfHash;
  return h;
}

export async function fetchSessions(url: string): Promise<AssistantSession[]> {
  const res = await fetch(url, { credentials: "same-origin", headers: { Accept: "application/json" } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) throw new Error(data.message || `sessions HTTP ${res.status}`);
  return (data.sessions || []) as AssistantSession[];
}

export async function fetchSessionDetail(
  sessionsUrl: string,
  id: number | string,
): Promise<{ session: AssistantSession; messages: AssistantMessage[] }> {
  const base = sessionsUrl.replace(/\/$/, "");
  const res = await fetch(`${base}/${id}`, {
    credentials: "same-origin",
    headers: { Accept: "application/json" },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) throw new Error(data.message || `session HTTP ${res.status}`);
  return { session: data.session, messages: data.messages || [] };
}

export async function createSession(
  sessionsUrl: string,
  csrfName?: string,
  csrfHash?: string,
): Promise<AssistantSession> {
  const res = await fetch(sessionsUrl, {
    method: "POST",
    credentials: "same-origin",
    headers: jsonHeaders(csrfName, csrfHash),
    body: "{}",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) throw new Error(data.message || `create HTTP ${res.status}`);
  return data.session as AssistantSession;
}

export type ProcessedAttachments = {
  extracted_text: string;
  images: string[];
  items?: Array<Record<string, unknown>>;
};

/** Upload chat attachments for Vision / text pre-processing before send. */
export async function uploadChatContext(
  uploadUrl: string,
  files: File[],
  csrfName?: string,
  csrfHash?: string,
): Promise<ProcessedAttachments> {
  if (!files.length) {
    return { extracted_text: "", images: [] };
  }
  const fd = new FormData();
  for (const f of files) {
    fd.append("files[]", f);
  }
  if (csrfName && csrfHash) fd.append(csrfName, csrfHash);

  const res = await fetch(uploadUrl, {
    method: "POST",
    credentials: "same-origin",
    headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
    body: fd,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    throw new Error(data.message || `upload-context HTTP ${res.status}`);
  }
  return {
    extracted_text: String(data.extracted_text || ""),
    images: Array.isArray(data.images) ? data.images.filter((u: unknown) => typeof u === "string") : [],
    items: Array.isArray(data.items) ? data.items : [],
  };
}

export async function sendPrompt(
  sendUrl: string,
  prompt: string,
  sessionId: number | string | null,
  csrfName?: string,
  csrfHash?: string,
  attachments?: ProcessedAttachments | null,
): Promise<{
  session: AssistantSession;
  user_message: AssistantMessage;
  assistant_message: AssistantMessage;
}> {
  const body: Record<string, unknown> = {
    prompt,
    session_id: sessionId ? Number(sessionId) : 0,
  };
  if (attachments && (attachments.extracted_text || (attachments.images && attachments.images.length))) {
    body.attachments = {
      extracted_text: attachments.extracted_text || "",
      images: attachments.images || [],
    };
  }
  const res = await fetch(sendUrl, {
    method: "POST",
    credentials: "same-origin",
    headers: jsonHeaders(csrfName, csrfHash),
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) throw new Error(data.message || `send HTTP ${res.status}`);
  return data;
}

export async function archiveSession(
  sessionsUrl: string,
  id: number | string,
  csrfName?: string,
  csrfHash?: string,
): Promise<void> {
  const base = sessionsUrl.replace(/\/$/, "");
  const res = await fetch(`${base}/${id}/archive`, {
    method: "POST",
    credentials: "same-origin",
    headers: jsonHeaders(csrfName, csrfHash),
    body: "{}",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) throw new Error(data.message || "archive failed");
}

export async function pinSession(
  sessionsUrl: string,
  id: number | string,
  csrfName?: string,
  csrfHash?: string,
): Promise<boolean> {
  const base = sessionsUrl.replace(/\/$/, "");
  const res = await fetch(`${base}/${id}/pin`, {
    method: "POST",
    credentials: "same-origin",
    headers: jsonHeaders(csrfName, csrfHash),
    body: "{}",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) throw new Error(data.message || "pin failed");
  return Boolean(data.is_pinned);
}

export async function importSessionPackage(
  importUrl: string,
  file: File,
  csrfName?: string,
  csrfHash?: string,
): Promise<{ session: AssistantSession; messages: AssistantMessage[] }> {
  const fd = new FormData();
  fd.append("package", file);
  if (csrfName && csrfHash) fd.append(csrfName, csrfHash);
  const res = await fetch(importUrl, {
    method: "POST",
    credentials: "same-origin",
    headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
    body: fd,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) throw new Error(data.message || "import failed");
  return { session: data.session, messages: data.messages || [] };
}

export function exportDataHref(exportDataUrl: string, messageId: number | string, format: string): string {
  const base = exportDataUrl.replace(/\/$/, "");
  return `${base}/${messageId}?format=${encodeURIComponent(format)}`;
}

export function exportSessionHref(exportSessionUrl: string, sessionId: number | string, mode: "package" | "report"): string {
  const base = exportSessionUrl.replace(/\/$/, "");
  return `${base}/${sessionId}?mode=${mode}`;
}
