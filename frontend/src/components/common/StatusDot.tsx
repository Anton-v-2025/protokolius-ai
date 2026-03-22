"use client";

import { motion } from "framer-motion";
import { INTEGRATION_STATUS_COLORS } from "@/lib/utils";

interface StatusDotProps {
  status: "connected" | "warning" | "error" | "not_configured";
  size?: "sm" | "md";
  pulse?: boolean;
}

const STATUS_LABELS = {
  connected: "Подключено",
  warning: "Предупреждение",
  error: "Ошибка",
  not_configured: "Не настроено",
};

export function StatusDot({ status, size = "sm", pulse = true }: StatusDotProps) {
  const color = INTEGRATION_STATUS_COLORS[status] || "var(--status-idle)";
  const dim = size === "sm" ? 8 : 10;

  return (
    <span className="relative inline-flex items-center justify-center" style={{ width: dim, height: dim }}>
      <span
        className="absolute inset-0 rounded-full"
        style={{ background: color, opacity: 0.2 }}
      />
      {pulse && status === "connected" ? (
        <motion.span
          className="relative block rounded-full"
          style={{ width: dim - 2, height: dim - 2, background: color }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.85, 1, 0.85] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        />
      ) : (
        <span
          className="relative block rounded-full"
          style={{ width: dim - 2, height: dim - 2, background: color }}
        />
      )}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const st = status as "connected" | "warning" | "error" | "not_configured";
  const color = INTEGRATION_STATUS_COLORS[st] || "var(--status-idle)";
  const label = STATUS_LABELS[st] || status;

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{
        background: `${color}14`,
        color,
        border: `1px solid ${color}28`,
      }}
    >
      <StatusDot status={st} size="sm" />
      {label}
    </span>
  );
}
