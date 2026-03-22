"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { CheckCircle, ArrowRight, Webhook, HardDrive, Brain, Bot, Link2 } from "lucide-react";
import { useCompany } from "@/lib/hooks/useCompany";
import { useIntegrations } from "@/lib/hooks/useIntegrations";
import { CodeBlock } from "@/components/common/CopyButton";

const CHECKS = [
  { key: "read_ai_enabled", icon: Webhook, label: "Read AI вебхук" },
  { key: "google_drive_enabled", icon: HardDrive, label: "Google Drive" },
  { key: "llm_enabled", icon: Brain, label: "LLM провайдер" },
  { key: "telegram_enabled", icon: Bot, label: "Telegram бот" },
];

export default function SetupDone() {
  const { data: company } = useCompany();
  const { data: integrations } = useIntegrations();

  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 18 }}
        className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
        style={{
          background: "rgba(16,217,160,0.12)",
          border: "2px solid rgba(16,217,160,0.35)",
          boxShadow: "0 0 32px rgba(16,217,160,0.12)",
        }}
      >
        <CheckCircle size={36} style={{ color: "var(--status-success)" }} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
          Рабочее пространство готово!
        </h1>
        <p className="text-sm mb-8" style={{ color: "var(--text-tertiary)" }}>
          {company?.company_name} настроено и готово к обработке встреч.
        </p>
      </motion.div>

      {/* Integration checklist */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-5 mb-5 text-left"
      >
        <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--text-tertiary)" }}>
          Подключённые интеграции
        </p>
        <div className="space-y-3">
          {CHECKS.map((c) => {
            const connected = integrations?.[c.key as keyof typeof integrations] as boolean;
            return (
              <div key={c.key} className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{
                    background: connected ? "rgba(16,217,160,0.1)" : "var(--surface-2)",
                    border: `1px solid ${connected ? "rgba(16,217,160,0.25)" : "var(--surface-border)"}`,
                  }}
                >
                  <c.icon size={14} style={{ color: connected ? "var(--status-success)" : "var(--text-tertiary)" }} />
                </div>
                <span className="text-sm font-medium" style={{ color: connected ? "var(--text-primary)" : "var(--text-tertiary)" }}>
                  {c.label}
                </span>
                {connected ? (
                  <CheckCircle size={14} style={{ color: "var(--status-success)", marginLeft: "auto" }} />
                ) : (
                  <span className="ml-auto text-xs" style={{ color: "var(--text-tertiary)" }}>Не настроено</span>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Workspace URL — permanent access link */}
      {company?.workspace_token && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="mb-5 text-left"
        >
          <div className="flex items-center gap-2 mb-2">
            <Link2 size={14} style={{ color: "var(--brand-400)" }} />
            <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
              Ваша постоянная ссылка
            </p>
          </div>
          <CodeBlock value={`${typeof window !== "undefined" ? window.location.origin : ""}/workspace/${company.workspace_token}`} />
          <p className="mt-1.5 text-xs" style={{ color: "var(--text-tertiary)" }}>
            Отправьте эту ссылку коллегам — они сразу попадут в вашу панель без регистрации.
          </p>
        </motion.div>
      )}

      {/* Webhook URL */}
      {company?.webhook_url && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-7 text-left"
        >
          <p className="text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
            Ваш URL вебхука
          </p>
          <CodeBlock value={company.webhook_url} />
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Link href="/dashboard">
          <button className="btn-primary w-full py-3 text-base font-bold">
            Перейти в панель
            <ArrowRight size={16} />
          </button>
        </Link>
      </motion.div>
    </div>
  );
}
