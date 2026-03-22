"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Plug, FileText, Activity, FlaskConical, ScrollText, Settings
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { motionConfig } from "@/lib/motion";

const NAV_ITEMS = [
  { path: "/dashboard", icon: LayoutDashboard, label: "Сводка" },
  { path: "/integrations", icon: Plug, label: "Интеграции" },
  { path: "/meetings", icon: FileText, label: "Встречи" },
  { path: "/status", icon: Activity, label: "Статус" },
  { path: "/test", icon: FlaskConical, label: "Тест и симуляция" },
  { path: "/logs", icon: ScrollText, label: "Журнал" },
];

function NavItem({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
  const pathname = usePathname();
  // Match on the path suffix (after /w/[token])
  const pathSuffix = pathname.replace(/^\/w\/[^/]+/, "");
  const hrefSuffix = href.replace(/^\/w\/[^/]+/, "");
  const active = pathSuffix.startsWith(hrefSuffix) && hrefSuffix !== "";

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative group",
        active
          ? "text-[var(--brand-400)]"
          : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
      )}
    >
      {active && (
        <motion.div
          layoutId="nav-active"
          className="absolute inset-0 rounded-xl"
          style={{
            background: "linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(239,68,68,0.06) 100%)",
            border: "1px solid rgba(245,158,11,0.2)",
          }}
          transition={{ type: "spring", stiffness: 400, damping: 35 }}
        />
      )}
      {!active && (
        <span
          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: "rgba(255,220,150,0.03)" }}
        />
      )}
      <Icon
        size={15}
        className={cn(
          "relative shrink-0 transition-colors",
          active ? "text-[var(--brand-400)]" : "text-current"
        )}
      />
      <span className="relative">{label}</span>
      {active && (
        <motion.div
          layoutId="nav-accent"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full"
          style={{ background: "var(--brand-gradient)" }}
          transition={{ type: "spring", stiffness: 400, damping: 35 }}
        />
      )}
    </Link>
  );
}

interface AppShellProps {
  children: React.ReactNode;
  workspaceToken?: string;
}

export default function AppShell({ children, workspaceToken }: AppShellProps) {
  const prefix = workspaceToken ? `/w/${workspaceToken}` : "";

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--surface-0)" }}>
      {/* Sidebar */}
      <aside
        className="w-60 shrink-0 flex flex-col border-r relative"
        style={{
          borderColor: "var(--surface-border)",
          background: "var(--surface-1)",
          boxShadow: "inset -1px 0 0 rgba(245,158,11,0.04)",
        }}
      >
        <div
          className="absolute top-0 right-0 w-32 h-32 pointer-events-none"
          style={{
            background: "radial-gradient(circle at 100% 0%, rgba(245,158,11,0.07) 0%, transparent 70%)",
          }}
        />

        {/* Logo */}
        <div className="px-5 py-5 border-b relative" style={{ borderColor: "var(--surface-border)" }}>
          <Link href={`${prefix}/dashboard`} className="flex items-center gap-3">
            <div className="flex flex-col gap-0.5">
              <Image src="/essg-logo.svg" alt="ESSG Consulting" width={150} height={23} priority />
              <span className="text-[11px] font-semibold" style={{ color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
                Протоколиус AI
              </span>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.path} href={`${prefix}${item.path}`} icon={item.icon} label={item.label} />
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t" style={{ borderColor: "var(--surface-border)" }}>
          <Link
            href={`${prefix}/integrations`}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group"
            style={{ color: "var(--text-tertiary)" }}
          >
            <Settings size={13} className="group-hover:rotate-45 transition-transform duration-300" />
            <span className="group-hover:text-[var(--text-secondary)] transition-colors">Настройки подключений</span>
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <motion.div
          {...motionConfig.page}
          className="min-h-full"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
