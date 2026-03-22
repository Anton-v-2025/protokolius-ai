"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ScrollText, ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/common/EmptyState";
import { useLogs } from "@/lib/hooks/useMeetings";
import { motionConfig } from "@/lib/motion";
import { timeAgo } from "@/lib/utils";

const LOG_STATUS_COLORS: Record<string, string> = {
  started: "var(--status-info)",
  success: "var(--status-success)",
  failed: "var(--status-error)",
  skipped: "var(--status-idle)",
  duplicate: "var(--status-warning)",
};

const LOG_STATUS_LABELS: Record<string, string> = {
  started: "Запущено",
  success: "Успешно",
  failed: "Ошибка",
  skipped: "Пропущено",
  duplicate: "Дубликат",
};

const EVENT_LABELS: Record<string, string> = {
  webhook_received: "вебхук получен",
  parse: "парсинг",
  normalize: "нормализация",
  drive_upload: "загрузка в Drive",
  chunk_embed: "чанкинг + эмбеддинг",
  finalize: "финализация",
};

export default function LogsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useLogs({ page, per_page: 50 });

  return (
    <div className="p-8">
        <PageHeader
          title="Журнал загрузки"
          description="События конвейера обработки в реальном времени"
        />

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => <div key={i} className="skeleton h-12 rounded-xl" />)}
          </div>
        ) : !data?.items?.length ? (
          <EmptyState
            icon={ScrollText}
            title="Журнал пуст"
            description="Записи появятся здесь после обработки первой встречи."
          />
        ) : (
          <motion.div
            className="glass-card overflow-hidden"
            variants={motionConfig.staggerContainer}
            initial="initial"
            animate="animate"
          >
            {/* Header */}
            <div
              className="grid grid-cols-12 px-5 py-3 text-xs font-bold uppercase tracking-wider border-b"
              style={{ borderColor: "var(--surface-border)", color: "var(--text-tertiary)" }}
            >
              <div className="col-span-3">Событие</div>
              <div className="col-span-2">Статус</div>
              <div className="col-span-3">ID встречи</div>
              <div className="col-span-2">Ошибка</div>
              <div className="col-span-2 text-right">Время</div>
            </div>

            {data?.items?.map((log: {
              id: string;
              event_type: string;
              status: string;
              external_meeting_id?: string;
              error_message?: string;
              duration_ms?: number;
              created_at: string;
            }) => (
              <motion.div
                key={log.id}
                variants={motionConfig.staggerItem}
                className="grid grid-cols-12 px-5 py-3.5 border-b items-center transition-colors"
                style={{
                  borderColor: "var(--surface-border)",
                  cursor: "default",
                }}
                whileHover={{ backgroundColor: "rgba(255,255,255,0.015)" }}
              >
                <div className="col-span-3 font-mono text-xs flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
                  <span
                    className="w-1 h-4 rounded-full shrink-0"
                    style={{ background: LOG_STATUS_COLORS[log.status] || "var(--status-idle)", opacity: 0.6 }}
                  />
                  {EVENT_LABELS[log.event_type] || log.event_type}
                </div>
                <div className="col-span-2">
                  <span
                    className="text-xs px-2.5 py-0.5 rounded-full font-semibold"
                    style={{
                      background: `${LOG_STATUS_COLORS[log.status]}14`,
                      color: LOG_STATUS_COLORS[log.status],
                    }}
                  >
                    {LOG_STATUS_LABELS[log.status] || log.status}
                  </span>
                </div>
                <div className="col-span-3 font-mono text-xs truncate" style={{ color: "var(--text-tertiary)" }}>
                  {log.external_meeting_id || "—"}
                </div>
                <div className="col-span-2 text-xs truncate" style={{ color: log.error_message ? "var(--status-error)" : "var(--text-tertiary)" }}>
                  {log.error_message || "—"}
                </div>
                <div className="col-span-2 text-xs text-right font-mono" style={{ color: "var(--text-tertiary)" }}>
                  {timeAgo(log.created_at)}
                  {log.duration_ms && (
                    <span
                      className="ml-1.5 px-1.5 py-0.5 rounded text-[10px]"
                      style={{ background: "var(--surface-2)", color: "var(--text-tertiary)" }}
                    >
                      {log.duration_ms}мс
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {data && data.total > 50 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
              {data.total} событий всего
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost py-2 px-3 text-sm">
                <ChevronLeft size={15} />
              </button>
              <button onClick={() => setPage((p) => p + 1)} disabled={page * 50 >= data.total} className="btn-ghost py-2 px-3 text-sm">
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
  );
}
