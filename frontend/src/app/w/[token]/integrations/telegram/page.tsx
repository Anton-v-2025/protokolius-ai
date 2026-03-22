"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Bot, CheckCircle, Loader2, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "@/components/common/StatusDot";
import { SecretInput } from "@/components/common/SecretInput";
import { useWorkspacePrefix } from "@/lib/hooks/useWorkspace";
import { useIntegrations, useUpdateTelegram, useVerifyTelegram } from "@/lib/hooks/useIntegrations";

export default function TelegramIntegration() {
  const { link } = useWorkspacePrefix();
  const { data: integrations } = useIntegrations();
  const { mutateAsync: save, isPending: saving } = useUpdateTelegram();
  const { mutateAsync: verify, isPending: verifying } = useVerifyTelegram();

  const [token, setToken] = useState("");
  const [botInfo, setBotInfo] = useState<{ username?: string; first_name?: string } | null>(null);
  const [assistantPrompt, setAssistantPrompt] = useState("");

  useEffect(() => {
    if (integrations?.assistant_prompt) setAssistantPrompt(integrations.assistant_prompt);
  }, [integrations]);

  const handleVerify = async () => {
    try {
      const info = await verify(token);
      setBotInfo(info);
      toast.success(`@${info.username} подтверждён`);
    } catch {
      toast.error("Неверный токен бота");
    }
  };

  const handleSave = async () => {
    try {
      await save({ telegram_bot_token: token || undefined, assistant_prompt: assistantPrompt });
      toast.success("Telegram-бот сохранён");
    } catch {
      toast.error("Не удалось сохранить");
    }
  };

  const status = integrations?.telegram_enabled ? "connected" : "not_configured";

  return (
    <div className="p-8 max-w-2xl">
        <Link href={link("/integrations")} className="flex items-center gap-1.5 text-sm mb-6 transition-opacity hover:opacity-75" style={{ color: "var(--text-tertiary)" }}>
          <ChevronLeft size={15} /> Назад к интеграциям
        </Link>

        <div className="flex items-center gap-4 mb-8">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(59,158,255,0.12)", border: "1px solid rgba(59,158,255,0.25)" }}
          >
            <Bot size={22} style={{ color: "#3B9EFF" }} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Telegram Бот</h1>
              <StatusBadge status={status as "connected" | "not_configured"} />
            </div>
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
              {integrations?.telegram_bot_username ? `@${integrations.telegram_bot_username}` : "Не настроено"}
            </p>
          </div>
        </div>

        <div className="glass-card p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
              Токен бота
              {integrations?.telegram_bot_username && (
                <span className="font-normal text-xs ml-2" style={{ color: "var(--text-tertiary)" }}>
                  (текущий: @{integrations.telegram_bot_username})
                </span>
              )}
            </label>
            <SecretInput value={token} onChange={setToken} placeholder="Оставьте пустым для сохранения текущего токена" />
          </div>

          {botInfo && (
            <div
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
              style={{
                background: "rgba(16,217,160,0.07)",
                border: "1px solid rgba(16,217,160,0.2)",
                color: "var(--status-success)",
              }}
            >
              <CheckCircle size={15} /> @{botInfo.username} · {botInfo.first_name}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
              Инструкции ассистента
            </label>
            <textarea
              className="input-base"
              rows={4}
              value={assistantPrompt}
              onChange={(e) => setAssistantPrompt(e.target.value)}
              placeholder="Вы — полезный ассистент для базы знаний встреч компании..."
            />
          </div>

          <div className="flex gap-3">
            <button onClick={handleVerify} disabled={verifying || !token} className="btn-ghost flex-1 py-2.5 text-sm">
              {verifying && <Loader2 size={14} className="animate-spin" />}
              Проверить токен
            </button>
            <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 py-2.5 text-sm">
              {saving ? "Сохранение..." : "Сохранить"}
            </button>
          </div>

          <div
            className="text-sm p-4 rounded-xl space-y-2.5"
            style={{ background: "var(--surface-2)", border: "1px solid var(--surface-border)", color: "var(--text-secondary)" }}
          >
            <p className="font-bold" style={{ color: "var(--text-primary)" }}>Команды бота</p>
            <p><code className="font-mono text-xs" style={{ color: "var(--brand-400)" }}>/start</code> — Приветственное сообщение</p>
            <p><code className="font-mono text-xs" style={{ color: "var(--brand-400)" }}>/latest</code> — Сводка последней встречи</p>
            <p><code className="font-mono text-xs" style={{ color: "var(--brand-400)" }}>/actions</code> — Все открытые задачи</p>
            <p style={{ color: "var(--text-tertiary)" }}>Или просто задайте вопрос в свободном тексте!</p>
          </div>
        </div>
      </div>
  );
}
