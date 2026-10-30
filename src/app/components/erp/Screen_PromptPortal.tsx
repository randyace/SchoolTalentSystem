// ─────────────────────────────────────────────────────────────────────────────
// 1.F.3 AI 提示詞 — Prompt Portal (n8n Webhook Orchestration)
// Authentic layout from Screen06_PromptTuning + live GB10 save/test wiring.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Webhook, Cpu, Zap, CheckCircle2, Save, TestTube2, Plus, Server, MemoryStick,
} from "lucide-react";
import {
  DS, Card, Btn, SectionHeader, SelectField, ToggleSwitch,
} from "../lalp/DesignSystem";

export type PromptProfile = {
  id?: number;
  profile_key: string;
  label?: string;
  system_prompt: string;
  tones: string[];
  bloom_level: string;
  context_variables: string[];
  primary_model: string;
  fallback_model: string;
  use_local_ollama: boolean;
  enable_rag: boolean;
  target_node: string;
  max_tokens: number;
  temperature: number;
  is_active?: boolean;
  updated_at?: string | null;
};

export type ScreenPromptPortalProps = {
  profiles?: PromptProfile[];
  serverStatus?: { connected?: boolean; model?: string; endpoint?: string };
  listUrl?: string;
  /** Base for GET /api/admin/ai-prompts/:profile_key */
  profileUrl?: string;
  saveUrl?: string;
  testUrl?: string;
  statusUrl?: string;
  csrfName?: string;
  csrfHash?: string;
};

/** Map UI webhook keys → API aliases accepted by backend. */
const PROFILE_API_ALIAS: Record<string, string> = {
  pedagogical_writing: "webhook_a_writing",
  data_assistant: "webhook_b_data",
  certificate_ocr: "webhook_c_ocr",
};

const WEBHOOKS = [
  { key: "pedagogical_writing", label: "Webhook A", sub: "AI 教學與文案工作站" },
  { key: "data_assistant", label: "Webhook B", sub: "AI 數據助手 NL2SQL" },
  { key: "certificate_ocr", label: "Webhook C", sub: "證書 OCR 萃取" },
] as const;

const TONE_CHIPS = ["Socratic", "Encouraging", "Analytical", "Bilingual", "Strict Data-Only"];

const BLOOM_LEVELS = [
  { id: "L1", label: "Remember", desc: "Students recall facts and basic concepts." },
  { id: "L2", label: "Understand", desc: "Students explain ideas or concepts." },
  { id: "L3", label: "Apply", desc: "Students apply knowledge to solve problems in new contexts." },
  { id: "L4", label: "Analyze", desc: "Students draw connections among ideas." },
  { id: "L5", label: "Evaluate", desc: "Students justify a decision or course of action." },
  { id: "L6", label: "Create", desc: "Students produce new or original work." },
];

const DEFAULT_PROMPT_A = `You are an adaptive learning assistant for Hong Kong secondary school students. Context: {class_context}. Learning objective: {bloom_level}. Student profile: {student_data}. Tone: Encouraging but academically rigorous. Language: Bilingual (English/Traditional Chinese).

Instructions:
- Always scaffold responses using Socratic questioning before providing direct answers.
- Reference Hong Kong curriculum standards (HKDSE/EDB guidelines).
- Adapt complexity based on student Bloom's taxonomy level: {bloom_level}.
- If student shows misconception, gently redirect with evidence-based correction.
- Generate follow-up prompts to deepen understanding.
- Include bilingual key terms where appropriate (English / 中文).
- Output format: structured hints, not direct solutions.`;

function emptyProfile(key: string): PromptProfile {
  const meta = WEBHOOKS.find((w) => w.key === key);
  return {
    profile_key: key,
    label: meta ? `${meta.label} · ${meta.sub}` : key,
    system_prompt: key === "pedagogical_writing" ? DEFAULT_PROMPT_A : "",
    tones: key === "data_assistant" ? ["Strict Data-Only", "Analytical"] : ["Socratic", "Bilingual"],
    bloom_level: key === "data_assistant" ? "L4" : "L3",
    context_variables: ["{class_context}", "{student_data}", "{bloom_level}"],
    primary_model: "qwen3.5-flash-next",
    fallback_model: "Llama3.1-8B",
    use_local_ollama: true,
    enable_rag: key === "pedagogical_writing",
    target_node: key === "data_assistant" ? "n8n-node-data" : key === "certificate_ocr" ? "n8n-node-ocr" : "n8n-node-001",
    max_tokens: key === "data_assistant" ? 2200 : key === "certificate_ocr" ? 800 : 2048,
    temperature: key === "data_assistant" ? 0.1 : key === "certificate_ocr" ? 0 : 0.7,
  };
}

function jsonHeaders(csrfName?: string, csrfHash?: string): HeadersInit {
  const h: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  };
  if (csrfName && csrfHash) h[csrfName] = csrfHash;
  return h;
}

export const Screen_PromptPortal: React.FC<ScreenPromptPortalProps> = ({
  profiles: initialProfiles = [],
  serverStatus: initialStatus,
  listUrl = "/api/admin/ai-prompts",
  profileUrl = "/api/admin/ai-prompts",
  saveUrl = "/api/admin/ai-prompts/save",
  testUrl = "/api/admin/ai-prompts/test",
  statusUrl = "/api/admin/ai-prompts/status",
  csrfName,
  csrfHash,
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [activeKey, setActiveKey] = useState<string>(WEBHOOKS[0].key);
  const [byKey, setByKey] = useState<Record<string, PromptProfile>>(() => {
    const map: Record<string, PromptProfile> = {};
    for (const w of WEBHOOKS) map[w.key] = emptyProfile(w.key);
    for (const p of initialProfiles) {
      if (p?.profile_key) {
        // Prefer local clean label — never trust mojibake from a bad seed.
        const base = emptyProfile(p.profile_key);
        map[p.profile_key] = { ...base, ...p, label: base.label };
      }
    }
    return map;
  });
  const [newVarInput, setNewVarInput] = useState("");
  const [status, setStatus] = useState(initialStatus || { connected: false, model: "qwen3.5-flash-next" });
  const [busy, setBusy] = useState<"save" | "test" | "load" | null>(null);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);
  const [testReply, setTestReply] = useState<string | null>(null);

  const profile = byKey[activeKey] || emptyProfile(activeKey);
  const displayLabel = useMemo(() => {
    const meta = WEBHOOKS.find((w) => w.key === activeKey);
    return meta ? `${meta.label} · ${meta.sub}` : (profile.label || activeKey);
  }, [activeKey, profile.label]);

  const mergeProfile = useCallback((p: PromptProfile) => {
    if (!p?.profile_key) return;
    setByKey((prev) => {
      const base = emptyProfile(p.profile_key);
      return {
        ...prev,
        [p.profile_key]: {
          ...base,
          ...p,
          // Keep UI label in clean UTF-8 from local WEBHOOKS map
          label: base.label,
        },
      };
    });
  }, []);

  const fetchProfile = useCallback(async (key: string) => {
    const alias = PROFILE_API_ALIAS[key] || key;
    const base = profileUrl.replace(/\/$/, "");
    const urls = [`${base}/${encodeURIComponent(alias)}`, `${base}/${encodeURIComponent(key)}`];
    for (const url of urls) {
      try {
        const res = await fetch(url, {
          credentials: "same-origin",
          headers: { Accept: "application/json; charset=utf-8" },
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.ok && data.profile) {
          mergeProfile(data.profile as PromptProfile);
          return true;
        }
      } catch {
        /* try next */
      }
    }
    return false;
  }, [profileUrl, mergeProfile]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setBusy("load");
      try {
        const res = await fetch(listUrl, {
          credentials: "same-origin",
          headers: { Accept: "application/json; charset=utf-8" },
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.ok && data.ok && Array.isArray(data.profiles)) {
          for (const p of data.profiles as PromptProfile[]) mergeProfile(p);
        }
        if (data.serverStatus) setStatus(data.serverStatus);
        // Always refresh the active webhook from its dedicated endpoint
        await fetchProfile(activeKey);
      } catch {
        /* keep seeded defaults */
      } finally {
        if (!cancelled) setBusy(null);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load only
  }, [listUrl]);

  const patch = useCallback((partial: Partial<PromptProfile>) => {
    setByKey((prev) => ({
      ...prev,
      [activeKey]: { ...(prev[activeKey] || emptyProfile(activeKey)), ...partial },
    }));
  }, [activeKey]);

  const selectedTones = useMemo(() => new Set(profile.tones || []), [profile.tones]);

  const toggleTone = (tone: string) => {
    const next = new Set(selectedTones);
    next.has(tone) ? next.delete(tone) : next.add(tone);
    patch({ tones: Array.from(next) });
  };

  const handleAddVar = () => {
    const trimmed = newVarInput.trim();
    if (!trimmed) return;
    const token = trimmed.startsWith("{") ? trimmed : `{${trimmed}}`;
    if ((profile.context_variables || []).includes(token)) return;
    patch({ context_variables: [...(profile.context_variables || []), token] });
    setNewVarInput("");
  };

  const bloomMeta = BLOOM_LEVELS.find((b) => b.id === profile.bloom_level) || BLOOM_LEVELS[2];
  const varsDetected = (profile.system_prompt.match(/\{[^}]+\}/g) || []).length;

  const showToast = (ok: boolean, text: string) => {
    setToast({ ok, text });
    window.setTimeout(() => setToast(null), 4200);
  };

  const onSave = async () => {
    setBusy("save");
    setTestReply(null);
    try {
      const res = await fetch(saveUrl, {
        method: "POST",
        credentials: "same-origin",
        headers: jsonHeaders(csrfName, csrfHash),
        body: JSON.stringify({
          profile_key: profile.profile_key,
          system_prompt: profile.system_prompt,
          tones: profile.tones,
          bloom_level: profile.bloom_level,
          context_variables: profile.context_variables,
          primary_model: profile.primary_model,
          fallback_model: profile.fallback_model,
          use_local_ollama: profile.use_local_ollama,
          enable_rag: profile.enable_rag,
          target_node: profile.target_node,
          max_tokens: Number(profile.max_tokens) || 2048,
          temperature: Number(profile.temperature) || 0,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.message || `HTTP ${res.status}`);
      if (data.profile) {
        patch({ ...data.profile });
      }
      showToast(true, "已儲存並部署 — GB10 將使用此設定");
      // refresh status
      fetch(statusUrl, { credentials: "same-origin", headers: { Accept: "application/json" } })
        .then((r) => r.json())
        .then((d) => { if (d?.status) setStatus(d.status); })
        .catch(() => undefined);
    } catch (e) {
      showToast(false, e instanceof Error ? e.message : "儲存失敗");
    } finally {
      setBusy(null);
    }
  };

  const onTest = async () => {
    setBusy("test");
    setTestReply(null);
    try {
      const res = await fetch(testUrl, {
        method: "POST",
        credentials: "same-origin",
        headers: jsonHeaders(csrfName, csrfHash),
        body: JSON.stringify({
          profile_key: profile.profile_key,
          system_prompt: profile.system_prompt,
          primary_model: profile.primary_model,
          temperature: Number(profile.temperature) || 0,
          max_tokens: Math.min(512, Number(profile.max_tokens) || 256),
          bloom_level: profile.bloom_level,
          test_prompt: "用兩句繁體中文確認你已載入系統提示詞，並說明你的角色（不要輸出 SQL）。",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.message || `HTTP ${res.status}`);
      const reply = String(data.result?.reply || "");
      setTestReply(reply);
      showToast(true, `測試成功 · ${data.result?.latency_ms ?? "—"} ms · ${data.result?.model || ""}`);
    } catch (e) {
      showToast(false, e instanceof Error ? e.message : "測試失敗");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div
      style={{
        background: DS.colors.background,
        minHeight: "100%",
        fontFamily: DS.font.family,
        padding: isMobile ? "16px" : "24px",
        position: "relative",
      }}
    >
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 72,
            right: 24,
            zIndex: 50,
            background: toast.ok ? "#065F46" : "#991B1B",
            color: "#fff",
            padding: "10px 16px",
            borderRadius: DS.radius.md,
            fontSize: 13,
            fontWeight: 600,
            boxShadow: DS.shadow.lg,
            maxWidth: 360,
          }}
        >
          {toast.text}
        </div>
      )}

      {/* Top Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #92400E 0%, #B45309 50%, #D97706 100%)",
          borderRadius: DS.radius.lg,
          padding: isMobile ? "14px 16px" : "16px 24px",
          marginBottom: "24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          boxShadow: DS.shadow.md,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              background: "rgba(255,255,255,0.15)",
              borderRadius: DS.radius.md,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Webhook size={20} color="#FEF3C7" />
          </div>
          <div>
            <div style={{ fontSize: isMobile ? "14px" : "16px", fontWeight: 700, color: "#FEF3C7" }}>
              n8n Webhook Orchestration
            </div>
            {!isMobile && (
              <div style={{ fontSize: "12px", color: "#FDE68A", marginTop: "2px" }}>
                Pedagogical Prompt Tuning · 模組六：提示詞控制門戶
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: isMobile ? "8px" : "12px", alignItems: "center", flexWrap: "wrap" }}>
          {WEBHOOKS.map((wh) => {
            const active = activeKey === wh.key;
            return (
              <button
                key={wh.key}
                type="button"
                onClick={() => {
                  setActiveKey(wh.key);
                  setTestReply(null);
                  setBusy("load");
                  void fetchProfile(wh.key).finally(() => setBusy(null));
                }}
                title={wh.sub}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  background: active ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.12)",
                  padding: isMobile ? "4px 10px" : "6px 14px",
                  borderRadius: DS.radius.full,
                  border: active ? "1px solid rgba(254,243,199,0.85)" : "1px solid rgba(255,255,255,0.2)",
                  cursor: "pointer",
                  fontFamily: DS.font.family,
                }}
              >
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: active ? "#34D399" : "#6B7280",
                    boxShadow: active ? "0 0 6px #34D399" : "none",
                    flexShrink: 0,
                    display: "inline-block",
                  }}
                />
                <span style={{ fontSize: isMobile ? "11px" : "13px", fontWeight: 600, color: "#FEF3C7" }}>
                  {wh.label}
                </span>
                {!isMobile && (
                  <span style={{ fontSize: "11px", color: active ? "#6EE7B7" : "#9CA3AF" }}>
                    {active ? "Active" : "Idle"}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ marginBottom: 12, fontSize: 12, color: DS.colors.textSecondary }}>
        目前編輯：<strong style={{ color: DS.colors.textPrimary }}>{displayLabel}</strong>
        {busy === "load" && <span style={{ marginLeft: 8, color: DS.colors.textMuted }}>載入中…</span>}
      </div>

      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "24px", alignItems: "flex-start" }}>
        {/* LEFT */}
        <div style={{ flex: isMobile ? "1 1 auto" : "0 0 60%", width: isMobile ? "100%" : undefined, display: "flex", flexDirection: "column", gap: "20px" }}>
          <Card style={{ padding: "20px" }}>
            <SectionHeader
              title="System Prompt Context"
              subtitle="Define the AI assistant's behavior — saved prompts inject into GB10"
              badge={
                <span
                  style={{
                    fontSize: "11px",
                    background: "#D1FAE5",
                    color: "#065F46",
                    padding: "2px 8px",
                    borderRadius: DS.radius.full,
                    fontWeight: 600,
                  }}
                >
                  Live
                </span>
              }
            />
            <textarea
              value={profile.system_prompt}
              onChange={(e) => patch({ system_prompt: e.target.value })}
              rows={9}
              style={{
                width: "100%",
                background: "#1E293B",
                color: "#E2E8F0",
                border: "1px solid #334155",
                borderRadius: DS.radius.md,
                padding: "14px 16px",
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
                fontSize: "13px",
                lineHeight: "1.6",
                resize: "vertical",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
              <span style={{ fontSize: "11px", color: DS.colors.textMuted }}>
                {profile.system_prompt.length} characters · {profile.system_prompt.split("\n").length} lines
              </span>
              <span style={{ fontSize: "11px", color: DS.colors.primary }}>
                Variables detected: {varsDetected}
              </span>
            </div>
          </Card>

          <Card style={{ padding: "20px" }}>
            <SectionHeader title="Tone Configuration" subtitle="Select active communication styles for responses" />
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {TONE_CHIPS.map((tone) => {
                const isSelected = selectedTones.has(tone);
                return (
                  <button
                    key={tone}
                    type="button"
                    onClick={() => toggleTone(tone)}
                    style={{
                      padding: "8px 20px",
                      borderRadius: DS.radius.full,
                      border: isSelected ? `2px solid ${DS.colors.primary}` : `2px solid ${DS.colors.border}`,
                      background: isSelected ? DS.colors.primaryLight : DS.colors.surface,
                      color: isSelected ? DS.colors.primary : DS.colors.textSecondary,
                      fontSize: "14px",
                      fontWeight: isSelected ? 700 : 500,
                      cursor: "pointer",
                      fontFamily: DS.font.family,
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    {isSelected && <CheckCircle2 size={14} />}
                    {tone}
                  </button>
                );
              })}
            </div>
          </Card>

          <Card style={{ padding: "20px" }}>
            <SectionHeader
              title="Bloom's Taxonomy Level"
              subtitle="Select the target cognitive level for AI-generated responses"
            />
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {BLOOM_LEVELS.map((level) => {
                const isSelected = profile.bloom_level === level.id;
                return (
                  <button
                    key={level.id}
                    type="button"
                    onClick={() => patch({ bloom_level: level.id })}
                    style={{
                      padding: "9px 16px",
                      borderRadius: DS.radius.md,
                      border: isSelected ? `2px solid ${DS.colors.primary}` : `2px solid ${DS.colors.border}`,
                      background: isSelected ? DS.colors.primary : DS.colors.surface,
                      color: isSelected ? "#fff" : DS.colors.textSecondary,
                      fontSize: "13px",
                      fontWeight: isSelected ? 700 : 500,
                      cursor: "pointer",
                      fontFamily: DS.font.family,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "2px",
                      minWidth: "80px",
                      boxShadow: isSelected ? "0 2px 8px rgba(26,86,219,0.3)" : DS.shadow.sm,
                    }}
                  >
                    <span style={{ fontSize: "11px", opacity: 0.8 }}>{level.id}</span>
                    <span>{level.label}</span>
                  </button>
                );
              })}
            </div>
            <div
              style={{
                marginTop: "12px",
                padding: "10px 14px",
                background: DS.colors.primaryLight,
                borderRadius: DS.radius.md,
                fontSize: "13px",
                color: DS.colors.primary,
              }}
            >
              <strong>Current Level:</strong> {bloomMeta.id} {bloomMeta.label} — {bloomMeta.desc}
            </div>
          </Card>

          <Card style={{ padding: "20px" }}>
            <SectionHeader title="Context Variables" subtitle="Dynamic variables injected into prompts at runtime" />
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
              {(profile.context_variables || []).map((v) => (
                <span
                  key={v}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 12px",
                    background: "#1E293B",
                    color: "#7DD3FC",
                    borderRadius: DS.radius.md,
                    fontSize: "13px",
                    fontFamily: "'Courier New', monospace",
                    fontWeight: 600,
                    border: "1px solid #334155",
                  }}
                >
                  <span style={{ color: "#FCD34D" }}>&#123;</span>
                  {v.replace(/[{}]/g, "")}
                  <span style={{ color: "#FCD34D" }}>&#125;</span>
                  <button
                    type="button"
                    onClick={() => patch({ context_variables: (profile.context_variables || []).filter((x) => x !== v) })}
                    style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", padding: 0, fontSize: 14 }}
                  >
                    ×
                  </button>
                </span>
              ))}
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <input
                  value={newVarInput}
                  onChange={(e) => setNewVarInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddVar()}
                  placeholder="new_variable"
                  style={{
                    padding: "6px 10px",
                    border: `1px solid ${DS.colors.border}`,
                    borderRadius: DS.radius.md,
                    fontSize: "13px",
                    fontFamily: "'Courier New', monospace",
                    width: "130px",
                    outline: "none",
                    color: DS.colors.textPrimary,
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddVar}
                  style={{
                    width: "30px",
                    height: "30px",
                    background: DS.colors.primary,
                    border: "none",
                    borderRadius: DS.radius.md,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Plus size={16} color="#fff" />
                </button>
              </div>
            </div>
          </Card>
        </div>

        {/* RIGHT */}
        <div style={{ flex: isMobile ? "1 1 auto" : "0 0 40%", width: isMobile ? "100%" : undefined, display: "flex", flexDirection: "column", gap: "20px" }}>
          <Card style={{ padding: "20px" }}>
            <SectionHeader
              title="LLM Model Selection"
              subtitle="Configure primary and fallback language models"
              badge={<Cpu size={16} color={DS.colors.primary} />}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <SelectField
                label="Primary Model"
                value={profile.primary_model}
                onChange={(v) => patch({ primary_model: v })}
                options={[
                  { value: "qwen3.5-flash-next", label: "qwen3.5-flash-next (GB10 Active)" },
                  { value: "qwen3.8-flash-next", label: "qwen3.8-flash-next" },
                  { value: "Qwen2.5-72B", label: "Qwen2.5-72B (Recommended)" },
                  { value: "Qwen2.5-14B", label: "Qwen2.5-14B" },
                  { value: "Llama3.1-70B", label: "Llama3.1-70B" },
                  { value: "Llama3.1-8B", label: "Llama3.1-8B" },
                ]}
              />
              <SelectField
                label="Fallback Model"
                value={profile.fallback_model}
                onChange={(v) => patch({ fallback_model: v })}
                options={[
                  { value: "Llama3.1-8B", label: "Llama3.1-8B" },
                  { value: "Qwen2.5-14B", label: "Qwen2.5-14B" },
                  { value: "Mistral-7B", label: "Mistral-7B" },
                ]}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <ToggleSwitch
                  checked={!!profile.use_local_ollama}
                  onChange={(v) => patch({ use_local_ollama: v })}
                  label="Use Local Ollama Server"
                />
                <ToggleSwitch
                  checked={!!profile.enable_rag}
                  onChange={(v) => patch({ enable_rag: v })}
                  label="Enable RAG Context"
                />
              </div>

              <div
                style={{
                  background: "#0F172A",
                  borderRadius: DS.radius.md,
                  padding: "14px 16px",
                  border: "1px solid #1E293B",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Server size={14} color={status.connected ? "#34D399" : "#F87171"} />
                  <span style={{ fontSize: "13px", color: status.connected ? "#34D399" : "#F87171", fontWeight: 600 }}>
                    Ollama Server:
                  </span>
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: status.connected ? "#34D399" : "#F87171",
                      boxShadow: status.connected ? "0 0 8px #34D399" : "none",
                      display: "inline-block",
                    }}
                  />
                  <span style={{ fontSize: "13px", color: status.connected ? "#34D399" : "#F87171", fontWeight: 700 }}>
                    {status.connected ? "Connected" : "Unreachable"}
                  </span>
                </div>
                <div style={{ fontSize: "12px", color: "#94A3B8", fontFamily: "'Courier New', monospace" }}>
                  Model Loaded: <span style={{ color: "#7DD3FC" }}>{status.model || profile.primary_model}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <MemoryStick size={12} color="#F59E0B" />
                  <span style={{ fontSize: "12px", color: "#94A3B8", fontFamily: "'Courier New', monospace" }}>
                    VRAM: <span style={{ color: "#FCD34D" }}>—</span>
                    <span style={{ color: "#475569" }}> / GB10 local</span>
                  </span>
                </div>
                <div style={{ marginTop: "2px" }}>
                  <div style={{ height: "4px", background: "#1E293B", borderRadius: "2px", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: status.connected ? "62%" : "8%",
                        background: "linear-gradient(90deg, #F59E0B, #FCD34D)",
                        borderRadius: "2px",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card style={{ padding: "20px" }}>
            <SectionHeader
              title="Webhook Target Node"
              subtitle="Configure request routing and generation parameters"
              badge={<Zap size={16} color="#F59E0B" />}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <SelectField
                label="Target Node"
                value={profile.target_node}
                onChange={(v) => patch({ target_node: v })}
                options={[
                  { value: "n8n-node-001", label: "n8n-node-001 (Hint Gen)" },
                  { value: "n8n-node-002", label: "n8n-node-002 (Portfolio)" },
                  { value: "n8n-node-003", label: "n8n-node-003 (Report)" },
                  { value: "n8n-node-data", label: "n8n-node-data (Data Assistant)" },
                  { value: "n8n-node-ocr", label: "n8n-node-ocr (Certificate OCR)" },
                ]}
              />

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: DS.colors.textSecondary, fontFamily: DS.font.family }}>
                  Max Tokens
                </label>
                <input
                  type="number"
                  value={profile.max_tokens}
                  onChange={(e) => patch({ max_tokens: Number(e.target.value) || 0 })}
                  style={{
                    padding: "8px 12px",
                    border: `1px solid ${DS.colors.border}`,
                    borderRadius: DS.radius.md,
                    fontSize: "14px",
                    color: DS.colors.textPrimary,
                    background: DS.colors.surface,
                    outline: "none",
                    fontFamily: DS.font.family,
                  }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: DS.colors.textSecondary, fontFamily: DS.font.family }}>
                    Temperature
                  </label>
                  <span style={{ fontSize: "14px", fontWeight: 700, color: DS.colors.primary, fontFamily: "'Courier New', monospace" }}>
                    {Number(profile.temperature).toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={Number(profile.temperature)}
                  onChange={(e) => patch({ temperature: parseFloat(e.target.value) })}
                  style={{ width: "100%", accentColor: DS.colors.primary, cursor: "pointer" }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: DS.colors.textMuted }}>
                  <span>0.0 Precise</span>
                  <span>0.5 Balanced</span>
                  <span>1.0 Creative</span>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", paddingTop: "4px" }}>
                <Btn
                  variant="ghost"
                  icon={<TestTube2 size={15} />}
                  style={{ flex: 1, border: `1px solid ${DS.colors.border}`, opacity: busy ? 0.7 : 1 }}
                  onClick={onTest}
                  disabled={!!busy}
                >
                  {busy === "test" ? "Testing…" : "Test Webhook"}
                </Btn>
                <Btn
                  variant="primary"
                  icon={<Save size={15} />}
                  style={{ flex: 1, opacity: busy ? 0.7 : 1 }}
                  onClick={onSave}
                  disabled={!!busy}
                >
                  {busy === "save" ? "Saving…" : "Save & Deploy"}
                </Btn>
              </div>

              {testReply && (
                <div
                  style={{
                    marginTop: 4,
                    padding: "12px 14px",
                    background: "#0F172A",
                    color: "#E2E8F0",
                    borderRadius: DS.radius.md,
                    fontSize: 12,
                    lineHeight: 1.55,
                    fontFamily: "'JetBrains Mono', monospace",
                    whiteSpace: "pre-wrap",
                    maxHeight: 200,
                    overflow: "auto",
                    border: "1px solid #334155",
                  }}
                >
                  {testReply}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Screen_PromptPortal;
