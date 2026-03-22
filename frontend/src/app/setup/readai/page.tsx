"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, Webhook, RefreshCw } from "lucide-react";
import { CodeBlock } from "@/components/common/CopyButton";
import { useCompany } from "@/lib/hooks/useCompany";
import { useGenerateReadAISecret, useUpdateReadAI } from "@/lib/hooks/useIntegrations";

export default function SetupReadAI() {
  const router = useRouter();
  const { data: company } = useCompany();
  const { mutateAsync: generate, data: generatedData, isPending: generating } = useGenerateReadAISecret();
  const { mutateAsync: save, isPending: saving } = useUpdateReadAI();
  const [secret, setSecret] = useState("");

  useEffect(() => {
    if (generatedData?.webhook_secret) {
      setSecret(generatedData.webhook_secret);
    }
  }, [generatedData]);

  const webhookUrl = company?.webhook_url || "";

  const handleGenerate = async () => {
    try {
      await generate();
      toast.success("Секрет сгенерирован");
    } catch {
      toast.error("Ошибка генерации секрета");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await save({ read_ai_webhook_secret: secret || undefined, read_ai_enabled: true });
      router.push("/setup/drive");
    } catch {
      toast.error("Не удалось сохранить настройки Read AI");
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ background: "var(--brand-glow)", border: "1px solid rgba(0,194,255,0.2)" }}
        >
          <Webhook size={20} style={{ color: "var(--brand-400)" }} />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            Подключить Read AI
          </h1>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            Шаг 2 из 5 — Настройка вебхука
          </p>
        </div>
      </div>

      <div
        className="rounded-xl p-4 mb-6"
        style={{ background: "var(--surface-2)", border: "1px solid var(--surface-border)" }}
      >
        <p className="text-sm font-semibold mb-2.5" style={{ color: "var(--text-primary)" }}>
          Инструкция
        </p>
        <ol className="space-y-1.5 text-sm" style={{ color: "var(--text-secondary)" }}>
          <li>1. Скопируйте URL вебхука ниже</li>
          <li>2. В Read AI → Настройки → Вебхуки вставьте этот URL</li>
          <li>3. Сгенерируйте секрет и вставьте его в поле секрета вебхука Read AI</li>
          <li>4. Сохраните в Read AI и продолжайте здесь</li>
        </ol>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {webhookUrl && (
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
              Ваш URL вебхука
            </label>
            <CodeBlock value={webhookUrl} />
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
              Секрет вебхука
            </label>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-1.5 text-xs font-semibold transition-opacity hover:opacity-75"
              style={{ color: "var(--brand-400)" }}
            >
              <RefreshCw size={12} className={generating ? "animate-spin" : ""} />
              Сгенерировать новый
            </button>
          </div>
          <input
            className="input-base font-mono text-sm"
            placeholder="Введите секрет или сгенерируйте выше"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
          />
          <p className="mt-1.5 text-xs" style={{ color: "var(--text-tertiary)" }}>
            Используется для проверки подлинности вебхука. Держите в секрете.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.push("/setup/company")}
            className="btn-ghost flex-1 py-3"
          >
            Назад
          </button>
          <button type="submit" disabled={saving} className="btn-primary flex-1 py-3">
            {saving ? "Сохранение..." : "Продолжить"}
            <ArrowRight size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}
