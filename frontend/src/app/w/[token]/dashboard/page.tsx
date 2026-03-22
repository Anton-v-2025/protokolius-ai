"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Database, FileText, Layers, MessageSquare, ArrowRight, Plus, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusDot";
import { useWorkspacePrefix } from "@/lib/hooks/useWorkspace";
import { useCompany } from "@/lib/hooks/useCompany";
import { useStatus } from "@/lib/hooks/useIntegrations";
import { useMeetings } from "@/lib/hooks/useMeetings";
import { motionConfig } from "@/lib/motion";
import { formatDate, STATUS_LABELS, STATUS_COLORS } from "@/lib/utils";

function StatCard({ icon: Icon, label, value, color, sub }: {
  icon: React.ElementType; label: string; value: string | number; color: string; sub?: string;
}) {
  return (
    <motion.div
      variants={motionConfig.staggerItem}
      className="glass-card p-6 relative overflow-hidden"
    >
      {/* Background glow */}
      <div
        className="absolute top-0 right-0 w-20 h-20 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 100% 0%, ${color}10 0%, transparent 70%)`,
        }}
      />
      <div className="flex items-center justify-between mb-4">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: `${color}14`, border: `1px solid ${color}22` }}
        >
          <Icon size={16} style={{ color }} />
        </div>
        <TrendingUp size={13} style={{ color: "var(--text-tertiary)" }} />
      </div>
      <motion.div
        className="text-4xl font-black mb-1"
        style={{ color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {value}
      </motion.div>
      <p className="text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>{label}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color }}>{sub}</p>}
    </motion.div>
  );
}

export default function DashboardPage() {
  const { link } = useWorkspacePrefix();
  const { data: company } = useCompany();
  const { data: status } = useStatus();
  const { data: meetings } = useMeetings({ per_page: 8 });

  const completedCount = meetings?.items?.filter((m: { status: string }) => m.status === "completed").length || 0;
  const totalActionItems = meetings?.items?.reduce((acc: number, m: { action_items_count: number }) => acc + (m.action_items_count || 0), 0) || 0;
  const connectedCount = status?.filter((s: { status: string }) => s.status === "connected").length || 0;

  return (
    <div className="p-8">
        <PageHeader
          title={`Добро пожаловать${company?.company_name ? `, ${company.company_name}` : ""}`}
          description="База знаний встреч — общий обзор"
          action={
            <Link href={link("/test")}>
              <button className="btn-primary text-sm px-4 py-2">
                <Plus size={14} />
                Тест загрузки
              </button>
            </Link>
          }
        />

        {/* Stats */}
        <motion.div
          className="grid grid-cols-4 gap-4 mb-8"
          variants={motionConfig.staggerContainer}
          initial="initial"
          animate="animate"
        >
          <StatCard
            icon={FileText}
            label="Встреч проиндексировано"
            value={meetings?.total || 0}
            color="var(--brand-400)"
          />
          <StatCard
            icon={Database}
            label="Завершено"
            value={completedCount}
            color="var(--status-success)"
          />
          <StatCard
            icon={Layers}
            label="Задач из встреч"
            value={totalActionItems}
            color="#F5A623"
          />
          <StatCard
            icon={MessageSquare}
            label="Активных интеграций"
            value={`${connectedCount}/4`}
            color="#3B9EFF"
            sub={connectedCount === 4 ? "Всё работает" : undefined}
          />
        </motion.div>

        <div className="grid grid-cols-3 gap-6">
          {/* Meetings feed */}
          <div className="col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-base" style={{ color: "var(--text-primary)" }}>
                Последние встречи
              </h2>
              <Link
                href={link("/meetings")}
                className="text-xs flex items-center gap-1 font-medium transition-colors hover:opacity-80"
                style={{ color: "var(--brand-400)" }}
              >
                Все встречи <ArrowRight size={12} />
              </Link>
            </div>

            <div className="space-y-2">
              {meetings?.items?.length === 0 && (
                <div
                  className="glass-card p-10 text-center"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  <FileText size={28} className="mx-auto mb-3 opacity-40" />
                  <p className="text-sm">Встреч пока нет. Настройте Read AI для начала работы.</p>
                  <Link href={link("/integrations/readai")}>
                    <button className="btn-primary text-xs px-4 py-2 mt-4">
                      Настроить Read AI
                    </button>
                  </Link>
                </div>
              )}
              {meetings?.items?.map((m: {
                id: string;
                meeting_title: string;
                meeting_date: string;
                status: string;
                participants_count: number;
                action_items_count: number;
              }) => (
                <motion.div
                  key={m.id}
                  variants={motionConfig.staggerItem}
                  className="glass-card px-4 py-3.5 flex items-center gap-4 transition-all cursor-pointer group"
                >
                  <Link href={link(`/meetings/${m.id}`)} className="flex-1 flex items-center gap-4">
                    <div
                      className="w-1.5 h-8 rounded-full shrink-0"
                      style={{ background: STATUS_COLORS[m.status] || "var(--status-idle)", opacity: 0.8 }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate group-hover:text-[var(--brand-400)] transition-colors" style={{ color: "var(--text-primary)" }}>
                        {m.meeting_title || "Без названия"}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                        {formatDate(m.meeting_date)} · {m.participants_count} участников
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {m.action_items_count > 0 && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: "rgba(245,166,35,0.12)", color: "#F5A623" }}
                        >
                          {m.action_items_count} задач
                        </span>
                      )}
                      <span
                        className="text-xs px-2.5 py-0.5 rounded-full font-semibold"
                        style={{
                          background: `${STATUS_COLORS[m.status]}14`,
                          color: STATUS_COLORS[m.status],
                        }}
                      >
                        {STATUS_LABELS[m.status] || m.status}
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Integration status sidebar */}
          <div>
            <h2 className="font-bold text-base mb-4" style={{ color: "var(--text-primary)" }}>
              Статус интеграций
            </h2>
            <div className="space-y-2.5">
              {(status || []).map((s: { service: string; status: string; message: string }) => (
                <div key={s.service} className="glass-card p-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-semibold capitalize" style={{ color: "var(--text-primary)" }}>
                      {s.service === "google_drive" ? "Google Drive" : s.service.replace("_", " ")}
                    </span>
                    <StatusBadge status={s.status as "connected" | "warning" | "error" | "not_configured"} />
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--text-tertiary)" }}>
                    {s.message}
                  </p>
                </div>
              ))}
              {!status && (
                <>
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="glass-card p-4">
                      <div className="skeleton h-4 w-2/3 mb-2" />
                      <div className="skeleton h-3 w-full" />
                    </div>
                  ))}
                </>
              )}
            </div>
            <Link href={link("/integrations")}>
              <button className="btn-ghost w-full mt-3 py-2.5 text-sm">
                Управление интеграциями
                <ArrowRight size={14} />
              </button>
            </Link>
          </div>
        </div>
      </div>
  );
}
