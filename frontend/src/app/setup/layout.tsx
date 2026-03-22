"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { Check } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const STEPS = [
  { href: "/setup/company", label: "Компания", short: "1" },
  { href: "/setup/readai", label: "Read AI", short: "2" },
  { href: "/setup/drive", label: "Google Drive", short: "3" },
  { href: "/setup/llm", label: "LLM Провайдер", short: "4" },
  { href: "/setup/telegram", label: "Telegram Бот", short: "5" },
  { href: "/setup/done", label: "Готово", short: "6" },
];

export default function SetupLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentIndex = STEPS.findIndex((s) => s.href === pathname);

  return (
    <div className="min-h-screen flex" style={{ background: "var(--surface-0)" }}>
      {/* Left panel */}
      <aside
        className="w-64 shrink-0 flex flex-col border-r p-6 relative"
        style={{ borderColor: "var(--surface-border)", background: "var(--surface-1)" }}
      >
        {/* Ambient glow */}
        <div
          className="absolute top-0 right-0 w-40 h-40 pointer-events-none"
          style={{ background: "radial-gradient(circle at 100% 0%, rgba(0,194,255,0.05) 0%, transparent 70%)" }}
        />

        <Link href="/" className="flex flex-col gap-1 mb-10 relative">
          <Image src="/essg-logo.svg" alt="ESSG Consulting" width={160} height={25} priority />
          <span className="text-[12px] font-semibold" style={{ color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
            Протоколиус AI
          </span>
        </Link>

        <p className="text-xs font-bold uppercase tracking-widest mb-6 relative" style={{ color: "var(--text-tertiary)" }}>
          Настройка рабочего пространства
        </p>

        <div className="space-y-0.5 relative">
          {STEPS.map((step, i) => {
            const done = i < currentIndex;
            const active = i === currentIndex;

            return (
              <div key={step.href} className="flex items-center gap-3 py-2.5 px-2 rounded-xl relative">
                {/* Connector line */}
                {i < STEPS.length - 1 && (
                  <div
                    className="absolute left-[18px] top-full w-px h-0.5"
                    style={{
                      background: done ? "var(--status-success)" : "var(--surface-border)",
                      height: "4px",
                    }}
                  />
                )}

                <motion.div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{
                    background: done
                      ? "var(--status-success)"
                      : active
                      ? "var(--brand-gradient)"
                      : "var(--surface-3)",
                    color: done || active ? "white" : "var(--text-tertiary)",
                    boxShadow: active ? "var(--shadow-glow-sm)" : "none",
                  }}
                  animate={{ scale: active ? 1.08 : 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  {done ? <Check size={12} /> : step.short}
                </motion.div>

                <span
                  className="text-sm font-medium"
                  style={{
                    color: active ? "var(--text-primary)" : done ? "var(--text-secondary)" : "var(--text-tertiary)",
                  }}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </aside>

      {/* Right panel */}
      <main className="flex-1 flex items-start justify-center py-16 px-8 overflow-y-auto">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-xl"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
