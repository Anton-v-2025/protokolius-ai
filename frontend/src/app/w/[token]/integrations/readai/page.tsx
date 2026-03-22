"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Webhook, RefreshCw, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "@/components/common/StatusDot";
import { CodeBlock } from "@/components/common/CopyButton";
import { useWorkspacePrefix } from "@/lib/hooks/useWorkspace";
import { useCompany } from "@/lib/hooks/useCompany";
import { useIntegrations, useUpdateReadAI, useGenerateReadAISecret } from "@/lib/hooks/useIntegrations";

export default function ReadAIIntegration() {
  const { link } = useWorkspacePrefix();
  const { data: company } = useCompany();
  const { data: integrations } = useIntegrations();
  const { mutateAsync: update, isPending } = useUpdateReadAI();
  const { mutateAsync: generate, isPending: generating } = useGenerateReadAISecret();
  const [secret, setSecret] = useState("");

  useEffect(() => {
    if (integrations?.read_ai_webhook_secret) {
      setSecret(integrations.read_ai_webhook_secret);
    }
  }, [integrations]);

  const handleSave = async () => {
    try {
      await update({ read_ai_webhook_secret: secret, read_ai_enabled: true });
      toast.success("Настройки Read AI сохранены");
    } catch {
      toast.error("Не удалось сохранить");
    }
  };

  const handleGenerate = async () => {
    try {
      const data = await generate();
      setSecret(data.webhook_secret);
      toast.success("Новый секрет сгенерирован");
    } catch {
      toast.error("Ошибка генерации");
    }
  };

  const status = integrations?.read_ai_enabled ? "connected" : "not_configured";

  return (
    <div className="p-8 max-w-2xl">
        <Link href={link("/integrations")} className="flex items-center gap-1.5 text-sm mb-6 transition-opacity hover:opacity-75" style={{ color: "var(--text-tertiary)" }}>
          <ChevronLeft size={15} />
          Назад к интеграциям
        </Link>

        <div className="flex items-center gap-4 mb-8">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: "var(--brand-glow)", border: "1px solid rgba(0,194,255,0.25)" }}
          >
            <Webhook size={22} style={{ color: "var(--brand-400)" }} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Read AI</h1>
              <StatusBadge status={status as "connected" | "not_configured"} />
            </div>
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>Вебхук-эндпоинт для получения встреч</p>
          </div>
        </div>

        <div className="space-y-5">
          {company?.webhook_url && (
            <div className="glass-card p-5">
              <p className="text-sm font-semibold mb-2" style={{ color: "var(--text-primary)" }}>URL вебхука</p>
              <p className="text-xs mb-3" style={{ color: "var(--text-tertiary)" }}>
                Добавьте этот URL в Read AI → Настройки → Вебхуки
              </p>
              <CodeBlock value={company.webhook_url} />
            </div>
          )}

          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Секрет вебхука</p>
              <button
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
              className="input-base font-mono text-sm mb-4"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Введите или сгенерируйте секрет вебхука"
            />
            <button onClick={handleSave} disabled={isPending} className="btn-primary w-full py-2.5 text-sm">
              {isPending ? "Сохранение..." : "Сохранить настройки"}
            </button>
          </div>

          <div
            className="glass-card p-5 text-sm space-y-2.5"
            style={{ color: "var(--text-secondary)" }}
          >
            <p className="font-bold" style={{ color: "var(--text-primary)" }}>Как это работает</p>
            <p>1. Read AI отправляет POST-запрос на ваш URL после каждой встречи</p>
            <p>2. Мы проверяем HMAC-SHA256 подпись с помощью вашего секрета</p>
            <p>3. Встреча парсится, нормализуется, индексируется и сохраняется в Drive</p>
          </div>
        </div>
      </div>
  );
}
