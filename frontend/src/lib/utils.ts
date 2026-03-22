import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function maskKey(key: string | null | undefined): string {
  if (!key) return "";
  if (key.length <= 8) return "••••";
  return key.slice(0, 6) + "••••" + key.slice(-4);
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    return format(new Date(dateStr), "d MMM yyyy · HH:mm", { locale: ru });
  } catch {
    return dateStr;
  }
}

export function formatDateShort(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    return format(new Date(dateStr), "d MMM yyyy", { locale: ru });
  } catch {
    return dateStr;
  }
}

export function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: ru });
  } catch {
    return dateStr;
  }
}

export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}ч ${m}м`;
  return `${m}м`;
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export const STATUS_LABELS: Record<string, string> = {
  received: "Получено",
  processing: "Обработка",
  normalized: "Нормализовано",
  drive_saved: "Сохранено в Drive",
  indexed: "Проиндексировано",
  completed: "Завершено",
  failed: "Ошибка",
  skipped: "Пропущено",
};

export const STATUS_COLORS: Record<string, string> = {
  received: "var(--status-info)",
  processing: "var(--brand-400)",
  normalized: "var(--status-info)",
  drive_saved: "var(--brand-400)",
  indexed: "var(--brand-400)",
  completed: "var(--status-success)",
  failed: "var(--status-error)",
  skipped: "var(--status-idle)",
};

export const INTEGRATION_STATUS_COLORS: Record<string, string> = {
  connected: "var(--status-success)",
  warning: "var(--status-warning)",
  error: "var(--status-error)",
  not_configured: "var(--status-idle)",
};

export const LLM_PROVIDERS = [
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
  { value: "gemini", label: "Google Gemini" },
  { value: "openai-compatible", label: "OpenAI-совместимый (custom)" },
];

export const LLM_MODELS: Record<string, { value: string; label: string }[]> = {
  openai: [
    { value: "gpt-4o", label: "GPT-4o" },
    { value: "gpt-4o-mini", label: "GPT-4o Mini" },
    { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
    { value: "o1-mini", label: "o1-mini" },
  ],
  anthropic: [
    { value: "claude-opus-4-6", label: "Claude Opus 4.6" },
    { value: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
    { value: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5" },
  ],
  gemini: [
    { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
    { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
  ],
  "openai-compatible": [
    { value: "custom", label: "Пользовательская модель" },
  ],
};
