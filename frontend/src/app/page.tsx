"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Zap, Bot, Database, FileJson } from "lucide-react";
import { motionConfig, hoverButton } from "@/lib/motion";

const STEPS = [
  {
    icon: FileJson,
    step: "01",
    title: "Загрузка",
    desc: "Read AI отправляет вебхуки. Мы захватываем, нормализуем и сохраняем каждую встречу автоматически.",
    color: "#F59E0B",
  },
  {
    icon: Database,
    step: "02",
    title: "Индексация",
    desc: "Текст разбивается на чанки, векторизуется и записывается в приватную базу знаний компании.",
    color: "#EF4444",
  },
  {
    icon: Bot,
    step: "03",
    title: "Запрос",
    desc: "Ваш Telegram-бот отвечает на вопросы по всем встречам с точностью ИИ в режиме реального времени.",
    color: "#FFC174",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--surface-0)" }}>

      {/* Ambient orbs */}
      <div
        className="fixed top-0 left-1/3 w-[600px] h-[600px] pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(245,158,11,0.07) 0%, transparent 65%)",
          filter: "blur(60px)",
        }}
      />
      <div
        className="fixed bottom-1/4 right-1/4 w-96 h-96 pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(239,68,68,0.05) 0%, transparent 65%)",
          filter: "blur(60px)",
        }}
      />

      {/* Nav */}
      <nav
        className="flex items-center justify-between px-10 py-4 border-b sticky top-0 z-50 relative"
        style={{
          borderColor: "var(--surface-border)",
          background: "rgba(16,14,11,0.88)",
          backdropFilter: "blur(20px)",
        }}
      >
        {/* Left: ESSG logo */}
        <Image src="/essg-logo.svg" alt="ESSG Consulting" width={200} height={31} priority />

        {/* Center: Product name */}
        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-0">
          <span
            className="text-2xl font-black tracking-tight"
            style={{
              background: "var(--brand-gradient)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: "-0.03em",
            }}
          >
            Протоколиус AI
          </span>
        </div>

        {/* Right: CTA */}
        <Link href="/setup">
          <motion.button className="btn-primary text-sm px-5 py-2" {...hoverButton}>
            Начать бесплатно
          </motion.button>
        </Link>
      </nav>

      {/* Hero — asymmetric, editorial */}
      <section className="max-w-6xl mx-auto px-10 pt-28 pb-24 relative">
        <div className="grid grid-cols-2 gap-16 items-center">

          {/* Left: headline */}
          <div>
            <motion.div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-8 tracking-widest uppercase"
              style={{
                background: "var(--brand-glow)",
                border: "1px solid rgba(245,158,11,0.25)",
                color: "var(--brand-400)",
              }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              ИИ-АНАЛИТИКА ВСТРЕЧ
            </motion.div>

            <motion.h1
              className="font-black leading-[1.05] mb-6"
              style={{
                color: "var(--text-primary)",
                fontSize: "clamp(52px, 6vw, 80px)",
                letterSpacing: "-0.03em",
              }}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.55 }}
            >
              Ваши встречи,{" "}
              <br />
              <span className="gradient-text">
                наконец понятны.
              </span>
            </motion.h1>

            <motion.p
              className="text-lg leading-relaxed mb-10"
              style={{ color: "var(--text-secondary)", maxWidth: 440 }}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
            >
              Подключите Read AI, Google Drive и Telegram —
              каждая встреча индексируется, ищется и доступна
              через ИИ в любой момент.
            </motion.p>

            <motion.div
              className="flex items-center gap-3"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Link href="/setup">
                <motion.button className="btn-primary px-7 py-3.5 text-[15px]" {...hoverButton}>
                  Настроить рабочее пространство
                  <ArrowRight size={16} />
                </motion.button>
              </Link>
              <Link href="/dashboard">
                <motion.button className="btn-ghost px-7 py-3.5 text-[15px]" {...hoverButton}>
                  Открыть панель
                </motion.button>
              </Link>
            </motion.div>
          </div>

          {/* Right: floating meeting cards */}
          <motion.div
            className="relative h-[460px]"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25, duration: 0.6 }}
          >
            {/* Card 1 */}
            <motion.div
              className="glass-card p-5 absolute top-0 right-0 w-[320px]"
              style={{ rotate: "1.5deg" }}
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full" style={{ background: "var(--status-success)" }} />
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
                  Еженедельный синк
                </span>
                <span className="ml-auto text-xs" style={{ color: "var(--text-tertiary)" }}>18 мар</span>
              </div>
              <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>
                "Запустить A/B-тест главной страницы до конца спринта. Ответственный — Антон."
              </p>
              <div className="flex gap-2">
                <span className="tag" style={{ background: "rgba(245,158,11,0.12)", color: "var(--brand-400)" }}>
                  3 задачи
                </span>
                <span className="tag" style={{ background: "rgba(16,217,138,0.1)", color: "var(--status-success)" }}>
                  Завершено
                </span>
              </div>
            </motion.div>

            {/* Card 2 */}
            <motion.div
              className="glass-card p-5 absolute top-[150px] left-0 w-[260px]"
              style={{ rotate: "-2deg" }}
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full" style={{ background: "var(--brand-500)" }} />
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
                  Product Review
                </span>
                <span className="ml-auto text-xs" style={{ color: "var(--text-tertiary)" }}>19 мар</span>
              </div>
              <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>
                "Приоритизировать фичи Q2: аналитика, онбординг, мобильное приложение."
              </p>
              <div className="flex gap-2">
                <span className="tag" style={{ background: "rgba(245,158,11,0.12)", color: "var(--brand-400)" }}>
                  5 задач
                </span>
              </div>
            </motion.div>

            {/* Card 3 — AI answer */}
            <motion.div
              className="absolute bottom-4 right-0 w-[260px]"
              style={{ rotate: "0.8deg" }}
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            >
              <div
                className="rounded-2xl p-4"
                style={{
                  background: "linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(239,68,68,0.08) 100%)",
                  border: "1px solid rgba(245,158,11,0.2)",
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={12} style={{ color: "var(--brand-400)" }} />
                  <span className="text-xs font-bold" style={{ color: "var(--brand-400)" }}>ИИ-ответ</span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  "На встрече 18 марта решили запустить A/B-тест. Ответственный: Антон, срок: 25 марта."
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Stats strip */}
        <motion.div
          className="flex items-center gap-16 mt-20 pt-8"
          style={{ borderTop: "1px solid var(--surface-border)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {[
            { value: "< 2с", label: "Время индексации" },
            { value: "∞", label: "Встреч в базе" },
            { value: "RAG", label: "Точность поиска" },
            { value: "100%", label: "Приватно" },
          ].map((s, i) => (
            <div key={i}>
              <div className="text-3xl font-black gradient-text leading-none mb-1">{s.value}</div>
              <div className="text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>{s.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Bento features */}
      <section className="max-w-6xl mx-auto px-10 pb-24">
        <motion.div
          className="mb-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <div
            className="inline-block text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-4"
            style={{ color: "var(--text-tertiary)", border: "1px solid var(--surface-border)" }}
          >
            Как это работает
          </div>
          <h2
            className="font-black"
            style={{
              color: "var(--text-primary)",
              fontSize: "clamp(32px, 4vw, 48px)",
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
            }}
          >
            Три шага до
            <br />
            <span className="gradient-text">ИИ-памяти встреч</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-3 gap-4 relative">
          {/* Connector line */}
          <div
            className="absolute top-10 left-[16.7%] right-[16.7%] h-px hidden md:block"
            style={{ background: "linear-gradient(90deg, transparent, rgba(245,158,11,0.25), rgba(245,158,11,0.25), transparent)" }}
          />

          {STEPS.map((step, i) => (
            <motion.div
              key={step.title}
              className="glass-card p-7 relative"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
            >
              <div
                className="text-5xl font-black mb-5 leading-none"
                style={{ color: step.color, opacity: 0.2 }}
              >
                {step.step}
              </div>
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                style={{
                  background: `${step.color}14`,
                  border: `1px solid ${step.color}28`,
                  boxShadow: `0 0 20px ${step.color}10`,
                }}
              >
                <step.icon size={20} style={{ color: step.color }} />
              </div>
              <h3 className="font-black text-xl mb-3" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-tertiary)" }}>
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA section */}
      <section className="max-w-6xl mx-auto px-10 pb-24">
        <motion.div
          className="rounded-3xl p-14 text-center relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(239,68,68,0.07) 100%)",
            border: "1px solid rgba(245,158,11,0.18)",
          }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.1) 0%, transparent 60%)",
            }}
          />
          <h2
            className="font-black mb-4 relative"
            style={{
              color: "var(--text-primary)",
              fontSize: "clamp(28px, 4vw, 44px)",
              letterSpacing: "-0.03em",
            }}
          >
            Ваша следующая встреча
            <br />
            уже записывается.
          </h2>
          <p className="text-lg mb-10 relative" style={{ color: "var(--text-secondary)" }}>
            Запустите за 5 минут. Без кредитной карты.
          </p>
          <Link href="/setup" className="relative">
            <motion.button
              className="btn-primary px-10 py-4 text-base"
              {...hoverButton}
            >
              Начать бесплатно
              <ArrowRight size={18} />
            </motion.button>
          </Link>
        </motion.div>
      </section>

      {/* ESSG Consulting section */}
      <section className="max-w-6xl mx-auto px-10 pb-20">
        <motion.div
          className="rounded-3xl p-10 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(0,194,255,0.06) 0%, rgba(245,158,11,0.06) 100%)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex-1">
            <div
              className="inline-block text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-4"
              style={{ color: "var(--text-tertiary)", border: "1px solid var(--surface-border)" }}
            >
              О разработчике
            </div>
            <h3
              className="font-black mb-3"
              style={{
                color: "var(--text-primary)",
                fontSize: "clamp(22px, 3vw, 32px)",
                letterSpacing: "-0.02em",
              }}
            >
              Решение ESSG Consulting
            </h3>
            <p className="text-sm leading-relaxed mb-6" style={{ color: "var(--text-secondary)", maxWidth: 480 }}>
              Протоколиус AI — продукт{" "}
              <a href="https://essg.consulting/ai" target="_blank" rel="noopener noreferrer"
                style={{ color: "var(--brand-400)", textDecoration: "underline" }}>
                ESSG Consulting
              </a>
              . Efficient Sustainable Solutions Group — консалтинговая компания, специализирующаяся на внедрении
              AI-решений и цифровой трансформации бизнеса. Мы помогаем командам работать умнее,
              сохраняя и монетизируя знания из каждой встречи.
            </p>
            <a href="https://essg.consulting/ai" target="_blank" rel="noopener noreferrer">
              <motion.button className="btn-ghost px-6 py-2.5 text-sm" {...hoverButton}>
                Узнать об ESSG Consulting →
              </motion.button>
            </a>
          </div>
          {/* Right: logo + highlights */}
          <div className="shrink-0 flex flex-col items-center gap-5 min-w-[260px]">
            <div
              className="w-full rounded-2xl flex items-center justify-center p-6"
              style={{
                background: "linear-gradient(135deg, rgba(72,162,174,0.12) 0%, rgba(21,237,163,0.06) 100%)",
                border: "1px solid rgba(72,162,174,0.2)",
              }}
            >
              <Image src="/essg-logo.svg" alt="ESSG Consulting" width={180} height={28} />
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {["AI-first Consulting", "Digital Transformation", "Strategy & Analytics"].map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-3 py-1.5 rounded-full font-medium"
                  style={{
                    background: "var(--surface-2)",
                    color: "var(--text-secondary)",
                    border: "1px solid var(--surface-border)",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t" style={{ borderColor: "var(--surface-border)" }}>
        <div className="max-w-6xl mx-auto px-10 py-10">
          <div className="flex flex-col md:flex-row justify-between gap-8">
            {/* Left: logo + socials + product name */}
            <div className="flex flex-col gap-4">
              <a href="https://essg.consulting" target="_blank" rel="noopener noreferrer">
                <Image src="/essg-logo.svg" alt="ESSG Consulting" width={180} height={28} />
              </a>
              <div className="flex items-center gap-3">
                {/* Telegram */}
                <a href="https://t.me/ESSG_AI" target="_blank" rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-opacity hover:opacity-70"
                  style={{ background: "var(--surface-2)" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.93 6.686l-1.674 7.89c-.126.56-.453.696-.917.432l-2.538-1.87-1.224 1.178c-.135.135-.249.249-.51.249l.181-2.588 4.71-4.253c.205-.181-.045-.281-.317-.1L7.73 14.391l-2.502-.781c-.544-.17-.554-.544.114-.807l9.77-3.766c.453-.17.851.1.848.649z" fill="#48A2AE"/>
                  </svg>
                </a>
                {/* Instagram */}
                <a href="https://instagram.com/essg.consulting" target="_blank" rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-opacity hover:opacity-70"
                  style={{ background: "var(--surface-2)" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" fill="#48A2AE"/>
                  </svg>
                </a>
                {/* Email */}
                <a href="mailto:diana.malikova@essg.consulting"
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-opacity hover:opacity-70"
                  style={{ background: "var(--surface-2)" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="#48A2AE"/>
                  </svg>
                </a>
              </div>
              <span className="text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>
                Протоколиус AI — продукт ESSG Consulting
              </span>
            </div>

            {/* Right: legal */}
            <div className="flex flex-col gap-2 text-xs" style={{ color: "var(--text-tertiary)" }}>
              <p>* компания Meta признана экстремистской в РФ</p>
              <p>ИП Семенов Сергей Александрович</p>
              <p>ИНН 231516660230</p>
              <a href="https://essg.consulting/privacy" target="_blank" rel="noopener noreferrer"
                className="hover:opacity-70 transition-opacity"
                style={{ color: "var(--brand-400)" }}>
                Политика конфиденциальности
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
