"use client";

import { motion } from "framer-motion";
import { Webhook, HardDrive, Brain, Bot, ArrowRight } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusDot";
import { useWorkspacePrefix } from "@/lib/hooks/useWorkspace";
import { useStatus } from "@/lib/hooks/useIntegrations";
import { motionConfig } from "@/lib/motion";

const INTEGRATIONS = [
  {
    href: "/integrations/readai",
    key: "readai",
    icon: Webhook,
    iconColor: "var(--brand-400)",
    title: "Read AI",
    description: "Вебхук-эндпоинт для автоматического получения протоколов встреч.",
    tag: "Источник данных",
  },
  {
    href: "/integrations/drive",
    key: "google_drive",
    icon: HardDrive,
    iconColor: "#10D9A0",
    title: "Google Drive",
    description: "Сохраняет нормализованный JSON встречи в папку компании на Google Drive.",
    tag: "Хранилище",
  },
  {
    href: "/integrations/llm",
    key: "llm",
    icon: Brain,
    iconColor: "#F5A623",
    title: "LLM Провайдер",
    description: "Генерация эмбеддингов и AI-ответы Telegram-бота.",
    tag: "ИИ-движок",
  },
  {
    href: "/integrations/telegram",
    key: "telegram",
    icon: Bot,
    iconColor: "#3B9EFF",
    title: "Telegram Бот",
    description: "Запросы к базе знаний встреч через приватного или группового бота.",
    tag: "Интерфейс",
  },
];

export default function IntegrationsPage() {
  const { link } = useWorkspacePrefix();
  const { data: status } = useStatus();

  const getStatus = (key: string) => {
    const s = status?.find((x: { service: string }) => x.service === key);
    return (s?.status || "not_configured") as "connected" | "warning" | "error" | "not_configured";
  };

  return (
    <div className="p-8">
        <PageHeader
          title="Интеграции"
          description="Подключите сервисы для полного конвейера аналитики встреч"
        />

        <motion.div
          className="grid grid-cols-2 gap-4"
          variants={motionConfig.staggerContainer}
          initial="initial"
          animate="animate"
        >
          {INTEGRATIONS.map((int) => {
            const st = getStatus(int.key);
            const Icon = int.icon;
            return (
              <motion.div key={int.key} variants={motionConfig.staggerItem}>
                <Link href={link(int.href)}>
                  <div
                    className="glass-card p-6 cursor-pointer group transition-all"
                    style={{ minHeight: 160 }}
                  >
                    {/* Top row */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center"
                          style={{
                            background: `${int.iconColor}12`,
                            border: `1px solid ${int.iconColor}22`,
                          }}
                        >
                          <Icon size={20} style={{ color: int.iconColor }} />
                        </div>
                        <div>
                          <h3 className="font-bold text-base group-hover:text-[var(--brand-400)] transition-colors" style={{ color: "var(--text-primary)" }}>
                            {int.title}
                          </h3>
                          <span
                            className="text-[10px] font-semibold uppercase tracking-wider"
                            style={{ color: "var(--text-tertiary)" }}
                          >
                            {int.tag}
                          </span>
                        </div>
                      </div>
                      <StatusBadge status={st} />
                    </div>

                    <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>
                      {int.description}
                    </p>

                    <div
                      className="flex items-center gap-1 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: "var(--brand-400)" }}
                    >
                      {st === "not_configured" ? "Настроить" : "Открыть настройки"}
                      <ArrowRight size={12} />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
  );
}
