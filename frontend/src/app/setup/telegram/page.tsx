"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, Bot, CheckCircle, Loader2 } from "lucide-react";
import { SecretInput } from "@/components/common/SecretInput";
import { useUpdateTelegram, useVerifyTelegram } from "@/lib/hooks/useIntegrations";

export default function SetupTelegram() {
  const router = useRouter();
  const { mutateAsync: save, isPending: saving } = useUpdateTelegram();
  const { mutateAsync: verify, isPending: verifying } = useVerifyTelegram();

  const [token, setToken] = useState("");
  const [botInfo, setBotInfo] = useState<{ username?: string; first_name?: string } | null>(null);

  const handleVerify = async () => {
    try {
      const info = await verify(token);
      setBotInfo(info);
      toast.success(`Бот подтверждён: @${info.username}`);
    } catch {
      toast.error("Неверный токен. Создайте бота через @BotFather.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await save({ telegram_bot_token: token });
      router.push("/setup/done");
    } catch {
      toast.error("Не удалось сохранить настройки Telegram");
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(59,158,255,0.12)", border: "1px solid rgba(59,158,255,0.25)" }}
        >
          <Bot size={20} style={{ color: "#3B9EFF" }} />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            Подключить Telegram-бот
          </h1>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            Шаг 5 из 5 — Бот для запросов к базе знаний
          </p>
        </div>
      </div>

      <div
        className="rounded-xl p-4 mb-6"
        style={{ background: "var(--surface-2)", border: "1px solid var(--surface-border)" }}
      >
        <p className="text-sm font-semibold mb-2.5" style={{ color: "var(--text-primary)" }}>
          Создайте бота
        </p>
        <ol className="space-y-1.5 text-sm" style={{ color: "var(--text-secondary)" }}>
          <li>1. Откройте Telegram → найдите{" "}
            <code className="font-mono text-xs" style={{ color: "var(--brand-400)" }}>@BotFather</code>
          </li>
          <li>2. Отправьте{" "}
            <code className="font-mono text-xs" style={{ color: "var(--brand-400)" }}>/newbot</code>{" "}
            и следуйте инструкциям
          </li>
          <li>3. Скопируйте токен бота и вставьте его ниже</li>
        </ol>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
            Токен бота
          </label>
          <SecretInput
            value={token}
            onChange={setToken}
            placeholder="1234567890:AABBCCDDEEFFaabbccddeeff..."
          />
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
            <CheckCircle size={15} />
            @{botInfo.username} · {botInfo.first_name}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleVerify}
            disabled={verifying || !token}
            className="btn-ghost flex-1 py-3 text-sm"
          >
            {verifying && <Loader2 size={14} className="animate-spin" />}
            Проверить токен
          </button>
          <button type="button" onClick={() => router.push("/setup/llm")} className="btn-ghost py-3 px-4 text-sm">
            Назад
          </button>
        </div>

        <button type="submit" disabled={saving || !token} className="btn-primary w-full py-3">
          {saving ? "Сохранение..." : "Завершить настройку"}
          <ArrowRight size={16} />
        </button>

        <button
          type="button"
          onClick={() => router.push("/setup/done")}
          className="block w-full text-center text-sm py-2"
          style={{ color: "var(--text-tertiary)" }}
        >
          Пропустить
        </button>
      </form>
    </div>
  );
}
