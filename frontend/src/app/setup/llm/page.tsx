"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, Brain, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { SecretInput } from "@/components/common/SecretInput";
import { useUpdateLLM, useTestLLM } from "@/lib/hooks/useIntegrations";
import { LLM_PROVIDERS, LLM_MODELS } from "@/lib/utils";

export default function SetupLLM() {
  const router = useRouter();
  const { mutateAsync: save, isPending: saving } = useUpdateLLM();
  const { mutateAsync: test, isPending: testing } = useTestLLM();

  const [provider, setProvider] = useState("openai");
  const [model, setModel] = useState("gpt-4o");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [embeddingModel, setEmbeddingModel] = useState("text-embedding-3-small");
  const [assistantPrompt, setAssistantPrompt] = useState("");
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const models = LLM_MODELS[provider] || LLM_MODELS["openai"];

  const handleProviderChange = (p: string) => {
    setProvider(p);
    setModel(LLM_MODELS[p]?.[0]?.value || "");
  };

  const handleTest = async () => {
    try {
      await save({ llm_provider: provider, llm_model: model, llm_api_key: apiKey, llm_base_url: baseUrl, llm_embedding_model: embeddingModel, assistant_prompt: assistantPrompt });
      const result = await test();
      setTestResult({
        ok: result.status === "connected",
        msg: result.status === "connected" ? "Подключено. Модель отвечает." : (result.error || "Тест не прошёл"),
      });
    } catch {
      setTestResult({ ok: false, msg: "Тест не прошёл" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await save({ llm_provider: provider, llm_model: model, llm_api_key: apiKey, llm_base_url: baseUrl, llm_embedding_model: embeddingModel, assistant_prompt: assistantPrompt });
      router.push("/setup/telegram");
    } catch {
      toast.error("Не удалось сохранить настройки LLM");
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(245,166,35,0.12)", border: "1px solid rgba(245,166,35,0.25)" }}
        >
          <Brain size={20} style={{ color: "#F5A623" }} />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            Настроить LLM
          </h1>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            Шаг 4 из 5 — Настройки AI-провайдера
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold mb-3" style={{ color: "var(--text-secondary)" }}>
            Провайдер
          </label>
          <div className="grid grid-cols-2 gap-2">
            {LLM_PROVIDERS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => handleProviderChange(p.value)}
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
          <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
            Модель
          </label>
          <select className="input-base" value={model} onChange={(e) => setModel(e.target.value)}>
            {models.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
            API Ключ
          </label>
          <SecretInput value={apiKey} onChange={setApiKey} placeholder="sk-..." />
        </div>

        {provider === "openai-compatible" && (
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
              Base URL
            </label>
            <input
              className="input-base"
              placeholder="https://api.example.com/v1"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
            Модель эмбеддингов
          </label>
          <input
            className="input-base"
            placeholder="text-embedding-3-small"
            value={embeddingModel}
            onChange={(e) => setEmbeddingModel(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
            Инструкции ассистента{" "}
            <span className="font-normal" style={{ color: "var(--text-tertiary)" }}>(необязательно)</span>
          </label>
          <textarea
            className="input-base"
            rows={3}
            placeholder="Вы — полезный ассистент для базы знаний встреч компании Acme..."
            value={assistantPrompt}
            onChange={(e) => setAssistantPrompt(e.target.value)}
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
          <button
            type="button"
            onClick={handleTest}
            disabled={testing || !apiKey}
            className="btn-ghost flex-1 py-3 text-sm"
          >
            {testing && <Loader2 size={14} className="animate-spin" />}
            Тест подключения
          </button>
          <button type="button" onClick={() => router.push("/setup/drive")} className="btn-ghost py-3 px-4 text-sm">
            Назад
          </button>
        </div>

        <button type="submit" disabled={saving} className="btn-primary w-full py-3">
          {saving ? "Сохранение..." : "Продолжить"}
          <ArrowRight size={16} />
        </button>

        <button
          type="button"
          onClick={() => router.push("/setup/telegram")}
          className="block w-full text-center text-sm py-2"
          style={{ color: "var(--text-tertiary)" }}
        >
          Пропустить
        </button>
      </form>
    </div>
  );
}
