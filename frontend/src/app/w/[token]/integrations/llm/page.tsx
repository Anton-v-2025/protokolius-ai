"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Brain, Loader2, CheckCircle, XCircle, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "@/components/common/StatusDot";
import { SecretInput } from "@/components/common/SecretInput";
import { useWorkspacePrefix } from "@/lib/hooks/useWorkspace";
import { useIntegrations, useUpdateLLM, useTestLLM } from "@/lib/hooks/useIntegrations";
import { LLM_PROVIDERS, LLM_MODELS } from "@/lib/utils";

export default function LLMIntegration() {
  const { link } = useWorkspacePrefix();
  const { data: integrations } = useIntegrations();
  const { mutateAsync: save, isPending: saving } = useUpdateLLM();
  const { mutateAsync: test, isPending: testing } = useTestLLM();

  const [provider, setProvider] = useState("openai");
  const [model, setModel] = useState("gpt-4o");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [embeddingModel, setEmbeddingModel] = useState("text-embedding-3-small");
  const [assistantPrompt, setAssistantPrompt] = useState("");
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    if (integrations) {
      if (integrations.llm_provider) setProvider(integrations.llm_provider);
      if (integrations.llm_model) setModel(integrations.llm_model);
      if (integrations.llm_base_url) setBaseUrl(integrations.llm_base_url);
      if (integrations.llm_embedding_model) setEmbeddingModel(integrations.llm_embedding_model);
      if (integrations.assistant_prompt) setAssistantPrompt(integrations.assistant_prompt);
    }
  }, [integrations]);

  const models = LLM_MODELS[provider] || LLM_MODELS["openai"];

  const handleSave = async () => {
    try {
      await save({
        llm_provider: provider,
        llm_model: model,
        llm_api_key: apiKey || undefined,
        llm_base_url: baseUrl || undefined,
        llm_embedding_model: embeddingModel,
        assistant_prompt: assistantPrompt,
      });
      toast.success("Настройки LLM сохранены");
    } catch {
      toast.error("Не удалось сохранить");
    }
  };

  const handleTest = async () => {
    try {
      await handleSave();
      const r = await test();
      setTestResult({
        ok: r.status === "connected",
        msg: r.status === "connected" ? "Подключено. Модель отвечает." : (r.error || "Тест не прошёл"),
      });
    } catch {
      setTestResult({ ok: false, msg: "Тест не прошёл" });
    }
  };

  const status = integrations?.llm_enabled ? "connected" : "not_configured";

  return (
    <div className="p-8 max-w-2xl">
        <Link href={link("/integrations")} className="flex items-center gap-1.5 text-sm mb-6 transition-opacity hover:opacity-75" style={{ color: "var(--text-tertiary)" }}>
          <ChevronLeft size={15} /> Назад к интеграциям
        </Link>

        <div className="flex items-center gap-4 mb-8">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(245,166,35,0.12)", border: "1px solid rgba(245,166,35,0.25)" }}
          >
            <Brain size={22} style={{ color: "#F5A623" }} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>LLM Провайдер</h1>
              <StatusBadge status={status as "connected" | "not_configured"} />
            </div>
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
              {integrations?.llm_provider && integrations?.llm_model
                ? `${integrations.llm_provider} / ${integrations.llm_model}`
                : "Не настроено"}
            </p>
          </div>
        </div>

        <div className="glass-card p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold mb-3" style={{ color: "var(--text-secondary)" }}>Провайдер</label>
            <div className="grid grid-cols-2 gap-2">
              {LLM_PROVIDERS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => { setProvider(p.value); setModel(LLM_MODELS[p.value]?.[0]?.value || ""); }}
                  className="py-2.5 px-4 rounded-xl text-sm font-semibold transition-all text-left"
                  style={{
                    background: provider === p.value ? "var(--brand-glow)" : "var(--surface-2)",
                    border: `1px solid ${provider === p.value ? "rgba(0,194,255,0.35)" : "var(--surface-border)"}`,
                    color: provider === p.value ? "var(--brand-400)" : "var(--text-secondary)",
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>Модель</label>
            <select className="input-base" value={model} onChange={(e) => setModel(e.target.value)}>
              {models.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
              API Ключ
              {integrations?.llm_api_key_masked && (
                <span className="font-normal text-xs ml-2" style={{ color: "var(--text-tertiary)" }}>
                  (текущий: {integrations.llm_api_key_masked})
                </span>
              )}
            </label>
            <SecretInput value={apiKey} onChange={setApiKey} placeholder="Оставьте пустым для сохранения текущего ключа" />
          </div>

          {provider === "openai-compatible" && (
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>Base URL</label>
              <input className="input-base" placeholder="https://api.example.com/v1" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>Модель эмбеддингов</label>
            <input className="input-base" value={embeddingModel} onChange={(e) => setEmbeddingModel(e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
              Инструкции ассистента <span className="font-normal" style={{ color: "var(--text-tertiary)" }}>(необязательно)</span>
            </label>
            <textarea
              className="input-base"
              rows={3}
              value={assistantPrompt}
              onChange={(e) => setAssistantPrompt(e.target.value)}
              placeholder="Системный промпт для Telegram-бота..."
            />
          </div>

          {testResult && (
            <div
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
              style={{
                background: testResult.ok ? "rgba(16,217,160,0.07)" : "rgba(255,71,87,0.07)",
                border: `1px solid ${testResult.ok ? "rgba(16,217,160,0.2)" : "rgba(255,71,87,0.2)"}`,
                color: testResult.ok ? "var(--status-success)" : "var(--status-error)",
              }}
            >
              {testResult.ok ? <CheckCircle size={15} /> : <XCircle size={15} />}
              {testResult.ok ? `Подключено: ${testResult.msg}` : testResult.msg}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={handleTest} disabled={testing} className="btn-ghost flex-1 py-2.5 text-sm">
              {testing && <Loader2 size={14} className="animate-spin" />}
              Тест подключения
            </button>
            <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 py-2.5 text-sm">
              {saving ? "Сохранение..." : "Сохранить"}
            </button>
          </div>
        </div>
      </div>
  );
}
