"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FileText, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/common/EmptyState";
import { useWorkspacePrefix } from "@/lib/hooks/useWorkspace";
import { useMeetings } from "@/lib/hooks/useMeetings";
import { motionConfig } from "@/lib/motion";
import { formatDate, STATUS_LABELS, STATUS_COLORS } from "@/lib/utils";

const STATUS_FILTERS = [
  { value: "all", label: "Все" },
  { value: "completed", label: "Завершено" },
  { value: "processing", label: "Обработка" },
  { value: "failed", label: "Ошибка" },
];

export default function MeetingsPage() {
  const { link } = useWorkspacePrefix();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");

  const { data, isLoading } = useMeetings({
    page,
    per_page: 20,
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  return (
    <div className="p-8">
        <PageHeader
          title="Встречи"
          description={`${data?.total || 0} встреч проиндексировано`}
        />

        {/* Filters */}
        <div className="flex gap-1 p-1 rounded-xl mb-6 w-fit" style={{ background: "var(--surface-2)", border: "1px solid var(--surface-border)" }}>
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => { setStatusFilter(f.value); setPage(1); }}
              className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: statusFilter === f.value ? "var(--surface-3)" : "transparent",
                color: statusFilter === f.value ? "var(--text-primary)" : "var(--text-tertiary)",
                boxShadow: statusFilter === f.value ? "var(--shadow-sm)" : "none",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card px-5 py-4 flex items-center gap-4">
                <div className="skeleton h-5 w-1.5 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-56" />
                  <div className="skeleton h-3 w-36" />
                </div>
              </div>
            ))}
          </div>
        ) : !data?.items?.length ? (
          <EmptyState
            icon={FileText}
            title="Встреч пока нет"
            description="Настройте вебхук Read AI для автоматического получения протоколов встреч."
            action={
              <Link href={link("/integrations/readai")}>
                <button className="btn-primary">Настроить Read AI</button>
              </Link>
            }
          />
        ) : (
          <motion.div
            className="space-y-2"
            variants={motionConfig.staggerContainer}
            initial="initial"
            animate="animate"
          >
            {data?.items?.map((m: {
              id: string;
              meeting_title: string;
              meeting_date: string;
              status: string;
              participants_count: number;
              action_items_count: number;
              drive_file_url: string;
              version: number;
              external_meeting_id: string;
            }) => (
              <motion.div
                key={m.id}
                variants={motionConfig.staggerItem}
                className="glass-card px-5 py-4 flex items-center gap-4 transition-all group"
                style={{ cursor: "pointer" }}
              >
                <div
                  className="w-1 h-9 rounded-full shrink-0"
                  style={{ background: STATUS_COLORS[m.status] || "var(--status-idle)", opacity: 0.75 }}
                />

                <Link href={link(`/meetings/${m.id}`)} className="flex-1 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-semibold truncate group-hover:text-[var(--brand-400)] transition-colors"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {m.meeting_title || "Без названия"}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                      {formatDate(m.meeting_date)} · {m.participants_count} участников
                      {m.version > 1 && ` · v${m.version}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {m.action_items_count > 0 && (
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold" style={{ background: "rgba(245,166,35,0.12)", color: "#F5A623" }}>
                        {m.action_items_count} задач
                      </span>
                    )}
                    <span
                      className="text-xs px-2.5 py-0.5 rounded-full font-semibold"
                      style={{ background: `${STATUS_COLORS[m.status]}14`, color: STATUS_COLORS[m.status] }}
                    >
                      {STATUS_LABELS[m.status] || m.status}
                    </span>
                  </div>
                </Link>

                {m.drive_file_url && (
                  <a href={m.drive_file_url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                    <ExternalLink size={14} className="opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: "var(--text-tertiary)" }} />
                  </a>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Pagination */}
        {data && data.total > 20 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
              Показано {(page - 1) * 20 + 1}–{Math.min(page * 20, data.total)} из {data.total}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost py-2 px-3 text-sm">
                <ChevronLeft size={15} />
              </button>
              <button onClick={() => setPage((p) => p + 1)} disabled={page * 20 >= data.total} className="btn-ghost py-2 px-3 text-sm">
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
  );
}
