"use client";

import { use, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronLeft, ExternalLink, RefreshCw, Users, Calendar, Clock, CheckSquare } from "lucide-react";
import { useWorkspacePrefix } from "@/lib/hooks/useWorkspace";
import { useMeeting, useReprocessMeeting, useMeetingLogs } from "@/lib/hooks/useMeetings";
import { formatDate, formatDuration, STATUS_LABELS, STATUS_COLORS } from "@/lib/utils";
import { toast } from "sonner";

const PIPELINE_STEPS = ["received", "processing", "normalized", "drive_saved", "indexed", "completed"];

const TAB_LABELS: Record<string, string> = {
  notes: "Заметки",
  transcript: "Транскрипт",
  actions: "Задачи",
  json: "JSON",
};

export default function MeetingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { link } = useWorkspacePrefix();
  const { data: meeting, isLoading } = useMeeting(id);
  const { data: logs } = useMeetingLogs(id);
  const { mutateAsync: reprocess, isPending: reprocessing } = useReprocessMeeting();
  const [activeTab, setActiveTab] = useState<"notes" | "transcript" | "actions" | "json">("notes");

  const TABS = ["notes", "transcript", "actions", "json"] as const;

  if (isLoading) {
    return (
        <div className="p-8">
          <div className="skeleton h-8 w-64 mb-6" />
          <div className="grid grid-cols-3 gap-6">
            <div className="skeleton h-48 rounded-xl" />
            <div className="col-span-2 skeleton h-96 rounded-xl" />
          </div>
        </div>
    );
  }

  if (!meeting) {
    return (
        <div className="p-8">
          <p style={{ color: "var(--text-tertiary)" }}>Встреча не найдена</p>
        </div>
    );
  }

  const currentStep = PIPELINE_STEPS.indexOf(meeting.status);

  return (
    <div className="p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href={link("/meetings")}>
            <button className="btn-ghost py-2 px-3"><ChevronLeft size={16} /></button>
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
              {meeting.meeting_title || "Без названия"}
            </h1>
            <div className="flex items-center gap-4 mt-1">
              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: `${STATUS_COLORS[meeting.status]}18`, color: STATUS_COLORS[meeting.status] }}>
                {STATUS_LABELS[meeting.status]}
              </span>
              {meeting.meeting_date && (
                <span className="text-xs flex items-center gap-1" style={{ color: "var(--text-tertiary)" }}>
                  <Calendar size={11} /> {formatDate(meeting.meeting_date)}
                </span>
              )}
              {meeting.duration_seconds && (
                <span className="text-xs flex items-center gap-1" style={{ color: "var(--text-tertiary)" }}>
                  <Clock size={11} /> {formatDuration(meeting.duration_seconds)}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {meeting.drive_file_url && (
              <a href={meeting.drive_file_url} target="_blank" rel="noreferrer">
                <button className="btn-ghost py-2 px-3 text-sm"><ExternalLink size={14} /> Drive</button>
              </a>
            )}
            <button
              onClick={async () => {
                await reprocess(id);
                toast.success("Встреча поставлена на повторную обработку");
              }}
              disabled={reprocessing}
              className="btn-ghost py-2 px-3 text-sm"
            >
              <RefreshCw size={14} className={reprocessing ? "animate-spin" : ""} />
              Перезапустить
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Left: meta panel */}
          <div className="space-y-4">
            {/* Participants */}
            <div className="glass-card p-4">
              <p className="text-xs font-semibold uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: "var(--text-tertiary)" }}>
                <Users size={12} /> Участники ({meeting.participants_json?.length || 0})
              </p>
              <div className="space-y-2">
                {(meeting.participants_json || []).map((p: { name: string; email?: string }, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ background: "var(--brand-glow)", color: "var(--brand-400)" }}>
                      {p.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{p.name}</p>
                      {p.email && <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{p.email}</p>}
                    </div>
                  </div>
                ))}
                {!meeting.participants_json?.length && (
                  <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Участники не указаны</p>
                )}
              </div>
            </div>

            {/* Pipeline status */}
            <div className="glass-card p-4">
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-tertiary)" }}>
                Конвейер
              </p>
              <div className="space-y-2">
                {PIPELINE_STEPS.map((step, i) => {
                  const done = i <= currentStep && meeting.status !== "failed";
                  const failed = meeting.status === "failed" && i === currentStep;
                  return (
                    <div key={step} className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        style={{
                          background: failed ? "var(--status-error)" : done ? "var(--status-success)" : "var(--surface-3)",
                          color: done || failed ? "white" : "var(--text-tertiary)",
                        }}>
                        {done && !failed ? "✓" : i + 1}
                      </div>
                      <span className="text-xs capitalize" style={{ color: done ? "var(--text-secondary)" : "var(--text-tertiary)" }}>
                        {STATUS_LABELS[step] || step}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Logs */}
            {logs && logs.length > 0 && (
              <div className="glass-card p-4">
                <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-tertiary)" }}>
                  Последние события
                </p>
                <div className="space-y-2">
                  {logs.slice(-5).map((log: { id: string; event_type: string; status: string; error_message?: string }) => (
                    <div key={log.id} className="text-xs">
                      <span className="font-mono" style={{ color: log.status === "failed" ? "var(--status-error)" : "var(--text-tertiary)" }}>
                        [{log.status}]
                      </span>{" "}
                      <span style={{ color: "var(--text-secondary)" }}>{log.event_type}</span>
                      {log.error_message && (
                        <p className="text-xs mt-0.5 truncate" style={{ color: "var(--status-error)" }}>{log.error_message}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Center: tabs */}
          <div className="col-span-2">
            <div className="flex gap-1 p-1 rounded-xl mb-4 w-fit" style={{ background: "var(--surface-2)", border: "1px solid var(--surface-border)" }}>
              {TABS.map((t) => (
                <button key={t} onClick={() => setActiveTab(t)}
                  className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
                  style={{ background: activeTab === t ? "var(--surface-3)" : "transparent", color: activeTab === t ? "var(--text-primary)" : "var(--text-tertiary)" }}>
                  {TAB_LABELS[t]}
                </button>
              ))}
            </div>

            <motion.div key={activeTab} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
              {activeTab === "notes" && (
                <div className="glass-card p-5">
                  {meeting.summary && (
                    <div className="mb-6 p-4 rounded-lg" style={{ background: "var(--surface-2)" }}>
                      <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-tertiary)" }}>Резюме</p>
                      <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{meeting.summary}</p>
                    </div>
                  )}
                  <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-tertiary)" }}>Полные заметки</p>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>
                    {meeting.meeting_notes_full || "Заметки для этой встречи отсутствуют."}
                  </p>
                </div>
              )}

              {activeTab === "transcript" && (
                <div className="glass-card p-5">
                  <pre className="text-xs leading-relaxed whitespace-pre-wrap font-mono overflow-auto max-h-[600px]" style={{ color: "var(--text-secondary)" }}>
                    {meeting.transcript_full || "Транскрипт для этой встречи отсутствует."}
                  </pre>
                </div>
              )}

              {activeTab === "actions" && (
                <div className="glass-card p-5">
                  {(meeting.action_items_json || []).length === 0 ? (
                    <div className="text-center py-8">
                      <CheckSquare size={24} className="mx-auto mb-3" style={{ color: "var(--text-tertiary)" }} />
                      <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>Задачи для этой встречи не найдены</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(meeting.action_items_json || []).map((item: { task: string; owner?: string; due_date?: string }, i: number) => (
                        <div key={i} className="flex gap-3 p-3 rounded-lg" style={{ background: "var(--surface-2)", border: "1px solid var(--surface-border)" }}>
                          <div className="w-5 h-5 rounded border-2 mt-0.5 shrink-0" style={{ borderColor: "var(--brand-400)" }} />
                          <div>
                            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{item.task}</p>
                            <div className="flex gap-4 mt-1">
                              {item.owner && <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>👤 {item.owner}</p>}
                              {item.due_date && <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>📅 {item.due_date}</p>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "json" && (
                <div className="glass-card p-5">
                  <pre className="text-xs leading-relaxed font-mono overflow-auto max-h-[600px]" style={{ color: "var(--brand-400)" }}>
                    {JSON.stringify(meeting.normalized_json || meeting, null, 2)}
                  </pre>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
  );
}
