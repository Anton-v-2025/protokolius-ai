"use client";

import { motion } from "framer-motion";
import { Activity, RefreshCw, Webhook, HardDrive, Brain, Bot, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { PageHeader } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusDot";
import { useStatus } from "@/lib/hooks/useIntegrations";
import { motionConfig } from "@/lib/motion";
import Link from "next/link";

const SERVICE_ICONS: Record<string, React.ElementType> = {
  readai: Webhook,
  google_drive: HardDrive,
  llm: Brain,
  telegram: Bot,
};

const SERVICE_NAMES: Record<string, string> = {
  readai: "Read AI",
  google_drive: "Google Drive",
  llm: "LLM Провайдер",
  telegram: "Telegram Бот",
};

const SERVICE_CONFIG_LINKS: Record<string, string> = {
  readai: "/integrations/readai",
  google_drive: "/integrations/drive",
  llm: "/integrations/llm",
  telegram: "/integrations/telegram",
};

const SERVICE_COLORS: Record<string, string> = {
  readai: "var(--brand-400)",
  google_drive: "#10D9A0",
  llm: "#F5A623",
  telegram: "#3B9EFF",
};

export default function StatusPage() {
  const { data: status, isLoading, refetch, isFetching } = useStatus();

  const allConnected = status?.every((s: { status: string }) => s.status === "connected");
  const hasErrors = status?.some((s: { status: string }) => s.status === "error");

  const bannerConfig = allConnected
    ? { color: "var(--status-success)", icon: CheckCircle, text: "Все системы работают штатно" }
    : hasErrors
    ? { color: "var(--status-error)", icon: XCircle, text: "Обнаружены ошибки в интеграциях" }
    : { color: "var(--status-warning)", icon: AlertTriangle, text: "Некоторые интеграции не настроены" };

  return (
    <div className="p-8">
        <PageHeader
          title="Состояние системы"
          description="Статус интеграций и подключений"
          action={
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="btn-ghost py-2 px-4 text-sm"
            >
              <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
              Обновить
            </button>
          }
        />

        {/* Overall status banner */}
        {status && (
          <motion.div
            {...motionConfig.fadeIn}
            className="flex items-center gap-3 px-5 py-4 rounded-xl mb-8"
            style={{
              background: `${bannerConfig.color}0A`,
              border: `1px solid ${bannerConfig.color}22`,
            }}
          >
            <bannerConfig.icon size={18} style={{ color: bannerConfig.color }} />
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {bannerConfig.text}
            </span>
            <span
              className="ml-auto text-xs font-medium px-2.5 py-1 rounded-full"
              style={{ background: `${bannerConfig.color}14`, color: bannerConfig.color }}
            >
              {status?.filter((s: { status: string }) => s.status === "connected").length}/{status?.length} подключено
            </span>
          </motion.div>
        )}

        {/* Service cards */}
        <motion.div
          className="grid grid-cols-2 gap-4"
          variants={motionConfig.staggerContainer}
          initial="initial"
          animate="animate"
        >
          {isLoading
            ? [1, 2, 3, 4].map((i) => (
                <div key={i} className="glass-card p-6">
                  <div className="skeleton h-5 w-36 mb-3" />
                  <div className="skeleton h-4 w-full mb-2" />
                  <div className="skeleton h-4 w-2/3" />
                </div>
              ))
            : status?.map((s: { service: string; status: string; message: string; last_checked?: string }) => {
                const Icon = SERVICE_ICONS[s.service] || Activity;
                const configLink = SERVICE_CONFIG_LINKS[s.service];
                const iconColor = SERVICE_COLORS[s.service] || "var(--text-secondary)";
                return (
                  <motion.div key={s.service} variants={motionConfig.staggerItem} className="glass-card p-6">
                    <div className="flex items-start justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{
                            background: `${iconColor}12`,
                            border: `1px solid ${iconColor}20`,
                          }}
                        >
                          <Icon size={18} style={{ color: iconColor }} />
                        </div>
                        <div>
                          <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                            {SERVICE_NAMES[s.service] || s.service}
                          </p>
                          {s.last_checked && (
                            <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                              Проверено в {new Date(s.last_checked).toLocaleTimeString("ru")}
                            </p>
                          )}
                        </div>
                      </div>
                      <StatusBadge status={s.status as "connected" | "warning" | "error" | "not_configured"} />
                    </div>

                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{s.message}</p>

                    {s.status !== "connected" && configLink && (
                      <Link href={configLink}>
                        <button className="mt-4 btn-ghost w-full py-2 text-xs font-semibold">
                          Настроить →
                        </button>
                      </Link>
                    )}
                  </motion.div>
                );
              })}
        </motion.div>
      </div>
  );
}
