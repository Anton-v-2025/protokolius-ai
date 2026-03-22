"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/common/StatusDot";
import { hoverCard } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface IntegrationCardProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  status: "connected" | "warning" | "error" | "not_configured";
  lastActivity?: string;
}

export function IntegrationCard({
  href, icon, title, description, status, lastActivity
}: IntegrationCardProps) {
  return (
    <motion.div {...hoverCard}>
      <Link
        href={href}
        className={cn(
          "block p-5 rounded-xl border transition-all duration-200 group",
          "hover:border-[var(--surface-border-hover)]"
        )}
        style={{
          background: "var(--glass-bg)",
          backdropFilter: "blur(12px)",
          border: "1px solid var(--glass-border)",
          boxShadow: "var(--shadow-md)",
        }}
      >
        <div className="flex items-start justify-between mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors group-hover:bg-[var(--surface-3)]"
            style={{ background: "var(--surface-2)" }}
          >
            {icon}
          </div>
          <StatusBadge status={status} />
        </div>

        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-[15px] mb-1" style={{ color: "var(--text-primary)" }}>
              {title}
            </h3>
            <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-tertiary)" }}>
              {description}
            </p>
            {lastActivity && (
              <p className="mt-3 text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                {lastActivity}
              </p>
            )}
          </div>
          <ChevronRight size={16} className="mt-0.5 shrink-0" style={{ color: "var(--text-tertiary)" }} />
        </div>
      </Link>
    </motion.div>
  );
}
