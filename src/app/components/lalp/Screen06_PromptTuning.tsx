import React, { useState } from "react";
import {
  Webhook, Cpu, Zap, CheckCircle2, Circle, Save, TestTube2, ChevronDown, Plus, Server, MemoryStick,
} from "lucide-react";
import {
  DS, Card, Btn, SectionHeader, SelectField, ToggleSwitch,
} from "./DesignSystem";

const SYSTEM_PROMPT_DEFAULT = `You are an adaptive learning assistant for Hong Kong secondary school students. Context: {class_context}. Learning objective: {bloom_level}. Student profile: {student_data}. Tone: Encouraging but academically rigorous. Language: Bilingual (English/Traditional Chinese).

Instructions:
- Always scaffold responses using Socratic questioning before providing direct answers.
- Reference Hong Kong curriculum standards (HKDSE/EDB guidelines).
- Adapt complexity based on student Bloom's taxonomy level: {bloom_level}.
- If student shows misconception, gently redirect with evidence-based correction.
- Generate follow-up prompts to deepen understanding.
- Include bilingual key terms where appropriate (English / 中文).
- Output format: structured hints, not direct solutions.`;

const TONE_CHIPS = ["Socratic", "Encouraging", "Analytical", "Bilingual"];
const BLOOM_LEVELS = [
  { id: "L1", label: "Remember", color: "#E5E7EB", textColor: "#6B7280" },
  { id: "L2", label: "Understand", color: "#E5E7EB", textColor: "#6B7280" },
  { id: "L3", label: "Apply", color: DS.colors.primary, textColor: "#FFFFFF" },
  { id: "L4", label: "Analyze", color: "#E5E7EB", textColor: "#6B7280" },
  { id: "L5", label: "Evaluate", color: "#E5E7EB", textColor: "#6B7280" },
  { id: "L6", label: "Create", color: "#E5E7EB", textColor: "#6B7280" },
];

export const Screen06_PromptTuning: React.FC = () => {
  const [systemPrompt, setSystemPrompt] = useState(SYSTEM_PROMPT_DEFAULT);
  const [selectedTones, setSelectedTones] = useState<Set<string>>(new Set(["Socratic", "Bilingual"]));
  const [selectedBloom, setSelectedBloom] = useState("L3");
  const [contextVars, setContextVars] = useState(["{class_context}", "{student_data}", "{bloom_level}"]);
  const [newVarInput, setNewVarInput] = useState("");
  const [primaryModel, setPrimaryModel] = useState("Qwen2.5-72B");
  const [fallbackModel, setFallbackModel] = useState("Llama3.1-8B");
  const [useOllama, setUseOllama] = useState(true);
  const [enableRAG, setEnableRAG] = useState(true);
  const [targetNode, setTargetNode] = useState("n8n-node-001");
  const [maxTokens, setMaxTokens] = useState("2048");
  const [temperature, setTemperature] = useState(0.7);

  const toggleTone = (tone: string) => {
    setSelectedTones((prev) => {
      const next = new Set(prev);
      next.has(tone) ? next.delete(tone) : next.add(tone);
      return next;
    });
  };

  const handleAddVar = () => {
    const trimmed = newVarInput.trim();
    if (trimmed && !contextVars.includes(trimmed)) {
      setContextVars((prev) => [...prev, trimmed.startsWith("{") ? trimmed : `{${trimmed}}`]);
      setNewVarInput("");
    }
  };

  return (
    <div
      style={{
        background: DS.colors.background,
        minHeight: "100vh",
        fontFamily: DS.font.family,
        padding: "24px",
      }}
    >
      {/* Top Banner: n8n Webhook Orchestration */}
      <div
        style={{
          background: "linear-gradient(135deg, #92400E 0%, #B45309 50%, #D97706 100%)",
          borderRadius: DS.radius.lg,
          padding: "16px 24px",
          marginBottom: "24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: DS.shadow.md,
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
            }}
          >
            <Webhook size={20} color="#FEF3C7" />
          </div>
          <div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#FEF3C7" }}>
              n8n Webhook Orchestration
            </div>
            <div style={{ fontSize: "12px", color: "#FDE68A", marginTop: "2px" }}>
              Pedagogical Prompt Tuning · 模組六: 提示詞控制門戶
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {[
            { label: "Webhook A", status: "active" },
            { label: "Webhook B", status: "active" },
            { label: "Webhook C", status: "idle" },
          ].map((wh) => (
            <div
              key={wh.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "rgba(255,255,255,0.12)",
                padding: "6px 14px",
                borderRadius: DS.radius.full,
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: wh.status === "active" ? "#34D399" : "#6B7280",
                  boxShadow: wh.status === "active" ? "0 0 6px #34D399" : "none",
                  flexShrink: 0,
                  display: "inline-block",
                }}
              />
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#FEF3C7" }}>
                {wh.label}
              </span>
              <span
                style={{
                  fontSize: "11px",
                  color: wh.status === "active" ? "#6EE7B7" : "#9CA3AF",
                  textTransform: "capitalize",
                }}
              >
                {wh.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main 2-col layout */}
      <div style={{ display: "flex", gap: "24px", alignItems: "flex-start" }}>
        {/* LEFT 60% */}
        <div style={{ flex: "0 0 60%", display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* System Prompt Context */}
          <Card style={{ padding: "20px" }}>
            <SectionHeader
              title="System Prompt Context"
              subtitle="Define the AI assistant's behavior for adaptive learning"
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
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
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
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "8px",
              }}
            >
              <span style={{ fontSize: "11px", color: DS.colors.textMuted }}>
                {systemPrompt.length} characters · {systemPrompt.split("\n").length} lines
              </span>
              <span style={{ fontSize: "11px", color: DS.colors.primary }}>
                Variables detected: {(systemPrompt.match(/\{[^}]+\}/g) || []).length}
              </span>
            </div>
          </Card>

          {/* Tone Configuration */}
          <Card style={{ padding: "20px" }}>
            <SectionHeader title="Tone Configuration" subtitle="Select active communication styles for responses" />
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {TONE_CHIPS.map((tone) => {
                const isSelected = selectedTones.has(tone);
                return (
                  <button
                    key={tone}
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
                      transition: "all 0.15s",
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

          {/* Bloom's Taxonomy */}
          <Card style={{ padding: "20px" }}>
            <SectionHeader
              title="Bloom's Taxonomy Level"
              subtitle="Select the target cognitive level for AI-generated responses"
            />
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {BLOOM_LEVELS.map((level) => {
                const isSelected = selectedBloom === level.id;
                return (
                  <button
                    key={level.id}
                    onClick={() => setSelectedBloom(level.id)}
                    style={{
                      padding: "9px 16px",
                      borderRadius: DS.radius.md,
                      border: isSelected
                        ? `2px solid ${DS.colors.primary}`
                        : `2px solid ${DS.colors.border}`,
                      background: isSelected ? DS.colors.primary : DS.colors.surface,
                      color: isSelected ? "#fff" : DS.colors.textSecondary,
                      fontSize: "13px",
                      fontWeight: isSelected ? 700 : 500,
                      cursor: "pointer",
                      fontFamily: DS.font.family,
                      transition: "all 0.15s",
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
              <strong>Current Level:</strong> L3 Apply — Students apply knowledge to solve problems in new contexts.
            </div>
          </Card>

          {/* Context Variables */}
          <Card style={{ padding: "20px" }}>
            <SectionHeader
              title="Context Variables"
              subtitle="Dynamic variables injected into prompts at runtime"
            />
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
              {contextVars.map((v) => (
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
                    onClick={() => setContextVars((prev) => prev.filter((x) => x !== v))}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#94A3B8",
                      cursor: "pointer",
                      padding: "0",
                      fontSize: "14px",
                      lineHeight: 1,
                    }}
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

        {/* RIGHT 40% */}
        <div style={{ flex: "0 0 40%", display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* LLM Model Selection */}
          <Card style={{ padding: "20px" }}>
            <SectionHeader
              title="LLM Model Selection"
              subtitle="Configure primary and fallback language models"
              badge={<Cpu size={16} color={DS.colors.primary} />}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <SelectField
                label="Primary Model"
                value={primaryModel}
                onChange={setPrimaryModel}
                options={[
                  { value: "Qwen2.5-72B", label: "Qwen2.5-72B (Recommended)" },
                  { value: "Qwen2.5-14B", label: "Qwen2.5-14B" },
                  { value: "Llama3.1-70B", label: "Llama3.1-70B" },
                  { value: "Llama3.1-8B", label: "Llama3.1-8B" },
                  { value: "Mistral-7B", label: "Mistral-7B" },
                ]}
              />
              <SelectField
                label="Fallback Model"
                value={fallbackModel}
                onChange={setFallbackModel}
                options={[
                  { value: "Llama3.1-8B", label: "Llama3.1-8B" },
                  { value: "Qwen2.5-14B", label: "Qwen2.5-14B" },
                  { value: "Mistral-7B", label: "Mistral-7B" },
                ]}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <ToggleSwitch
                  checked={useOllama}
                  onChange={setUseOllama}
                  label="Use Local Ollama Server"
                />
                <ToggleSwitch
                  checked={enableRAG}
                  onChange={setEnableRAG}
                  label="Enable RAG Context"
                />
              </div>

              {/* Status Card */}
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
                  <Server size={14} color="#34D399" />
                  <span style={{ fontSize: "13px", color: "#34D399", fontWeight: 600 }}>
                    Ollama Server:
                  </span>
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: "#34D399",
                      boxShadow: "0 0 8px #34D399",
                      display: "inline-block",
                    }}
                  />
                  <span style={{ fontSize: "13px", color: "#34D399", fontWeight: 700 }}>Connected</span>
                </div>
                <div style={{ fontSize: "12px", color: "#94A3B8", fontFamily: "'Courier New', monospace" }}>
                  Model Loaded: <span style={{ color: "#7DD3FC" }}>Qwen2.5:72b</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <MemoryStick size={12} color="#F59E0B" />
                  <span style={{ fontSize: "12px", color: "#94A3B8", fontFamily: "'Courier New', monospace" }}>
                    VRAM: <span style={{ color: "#FCD34D" }}>48.2 GB</span>
                    <span style={{ color: "#475569" }}> / 80.0 GB</span>
                  </span>
                </div>
                <div style={{ marginTop: "2px" }}>
                  <div
                    style={{
                      height: "4px",
                      background: "#1E293B",
                      borderRadius: "2px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: "60.25%",
                        background: "linear-gradient(90deg, #F59E0B, #FCD34D)",
                        borderRadius: "2px",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Webhook Target Node */}
          <Card style={{ padding: "20px" }}>
            <SectionHeader
              title="Webhook Target Node"
              subtitle="Configure request routing and generation parameters"
              badge={<Zap size={16} color="#F59E0B" />}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <SelectField
                label="Target Node"
                value={targetNode}
                onChange={setTargetNode}
                options={[
                  { value: "n8n-node-001", label: "n8n-node-001 (Hint Gen)" },
                  { value: "n8n-node-002", label: "n8n-node-002 (Portfolio)" },
                  { value: "n8n-node-003", label: "n8n-node-003 (Report)" },
                ]}
              />

              {/* Max Tokens */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: DS.colors.textSecondary,
                    fontFamily: DS.font.family,
                  }}
                >
                  Max Tokens
                </label>
                <input
                  type="number"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(e.target.value)}
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

              {/* Temperature Slider */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <label
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: DS.colors.textSecondary,
                      fontFamily: DS.font.family,
                    }}
                  >
                    Temperature
                  </label>
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: 700,
                      color: DS.colors.primary,
                      fontFamily: "'Courier New', monospace",
                    }}
                  >
                    {temperature.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  style={{ width: "100%", accentColor: DS.colors.primary, cursor: "pointer" }}
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "11px",
                    color: DS.colors.textMuted,
                  }}
                >
                  <span>0.0 Precise</span>
                  <span>0.5 Balanced</span>
                  <span>1.0 Creative</span>
                </div>
              </div>

              {/* Actions */}
              <div
                style={{ display: "flex", gap: "10px", paddingTop: "4px" }}
              >
                <Btn
                  variant="ghost"
                  icon={<TestTube2 size={15} />}
                  style={{ flex: 1, border: `1px solid ${DS.colors.border}` }}
                >
                  Test Webhook
                </Btn>
                <Btn
                  variant="primary"
                  icon={<Save size={15} />}
                  style={{ flex: 1 }}
                >
                  Save &amp; Deploy
                </Btn>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
