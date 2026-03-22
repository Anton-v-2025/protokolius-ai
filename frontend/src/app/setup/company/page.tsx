"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, Building2, Lock, CheckCircle, Copy, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCreateCompany } from "@/lib/hooks/useCompany";

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50);
}

export default function SetupCompany() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const { mutateAsync, isPending } = useCreateCompany();

  // Success state
  const [created, setCreated] = useState(false);
  const [workspaceUrl, setWorkspaceUrl] = useState("");
  const [workspaceToken, setWorkspaceToken] = useState("");
  const [copied, setCopied] = useState(false);

  const handleNameChange = (v: string) => {
    setName(v);
    if (!slugEdited) setSlug(slugify(v));
  };

  const pinMismatch = pin.length > 0 && pinConfirm.length > 0 && pin !== pinConfirm;
  const pinValid = !pin || (pin.length >= 4 && pin === pinConfirm);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim() || !pinValid) return;
    try {
      const result = await mutateAsync({ company_name: name.trim(), company_slug: slug, pin: pin || undefined });
      const token = result.workspace_token;
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const url = `${origin}/w/${token}/dashboard`;
      setWorkspaceToken(token);
      setWorkspaceUrl(url);
      setCreated(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Ошибка создания компании";
      toast.error(msg);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(workspaceUrl);
    setCopied(true);
    toast.success("Ссылка скопирована");
    setTimeout(() => setCopied(false), 2000);
  };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  return (
    <div>
      <AnimatePresence mode="wait">
        {created ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            {/* Success header */}
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)" }}
              >
                <CheckCircle size={22} style={{ color: "#22c55e" }} />
              </div>
              <div>
                <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                  Пространство создано!
                </h1>
                <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                  {name} — готово к настройке
                </p>
              </div>
            </div>

            {/* Workspace URL */}
            <div className="rounded-xl p-5 space-y-3" style={{ background: "var(--surface-2)", border: "1px solid var(--surface-border)" }}>
              <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
                Ваша персональная ссылка
              </p>
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                Сохраните эту ссылку — по ней вы и ваши коллеги будут входить в рабочее пространство.
              </p>
              <div
                className="flex items-center gap-2 rounded-lg p-3 font-mono text-sm break-all"
                style={{ background: "var(--surface-0)", border: "1px solid var(--surface-border)" }}
              >
                <span className="flex-1" style={{ color: "var(--brand-400)" }}>{workspaceUrl}</span>
                <button
                  onClick={handleCopy}
                  className="shrink-0 p-2 rounded-lg transition-all hover:scale-105"
                  style={{ background: copied ? "rgba(34,197,94,0.15)" : "var(--surface-2)" }}
                  title="Скопировать"
                >
                  {copied ? (
                    <CheckCircle size={16} style={{ color: "#22c55e" }} />
                  ) : (
                    <Copy size={16} style={{ color: "var(--text-tertiary)" }} />
                  )}
                </button>
              </div>
            </div>

            {/* Webhook URL */}
            <div className="rounded-xl p-4 text-xs" style={{ background: "var(--surface-2)", border: "1px solid var(--surface-border)" }}>
              <p className="font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>Webhook для Read AI</p>
              <p className="font-mono break-all" style={{ color: "var(--brand-400)" }}>
                {apiUrl}/webhook/readai/{slug}
              </p>
            </div>

            {/* Continue button */}
            <button
              onClick={() => router.push(`/w/${workspaceToken}/integrations`)}
              className="btn-primary w-full py-3"
            >
              Настроить интеграции
              <ArrowRight size={16} />
            </button>

            {/* Open in new tab */}
            <button
              onClick={() => window.open(workspaceUrl, "_blank")}
              className="w-full py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
              style={{ color: "var(--text-tertiary)", border: "1px solid var(--surface-border)" }}
            >
              <ExternalLink size={14} />
              Открыть в новой вкладке
            </button>
          </motion.div>
        ) : (
          <motion.div key="form" exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            <div className="flex items-center gap-3 mb-8">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ background: "var(--brand-glow)", border: "1px solid rgba(245,158,11,0.2)" }}
              >
                <Building2 size={20} style={{ color: "var(--brand-400)" }} />
              </div>
              <div>
                <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                  Создайте рабочее пространство
                </h1>
                <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>Шаг 1 из 5 — Данные компании</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
                  Название компании
                </label>
                <input
                  className="input-base"
                  placeholder="Acme Corp"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
                  ID рабочего пространства (slug)
                </label>
                <input
                  className="input-base font-mono text-sm"
                  placeholder="acme"
                  value={slug}
                  onChange={(e) => { setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")); setSlugEdited(true); }}
                  required
                  title="Строчные буквы, цифры и дефисы, 3–50 символов"
                />
                <p className="mt-1.5 text-xs" style={{ color: "var(--text-tertiary)" }}>
                  Используется в URL вебхука Read AI
                </p>
              </div>

              {slug && (
                <div className="rounded-xl p-3.5 text-xs font-mono break-all" style={{ background: "var(--surface-2)", border: "1px solid var(--surface-border)" }}>
                  <span style={{ color: "var(--text-tertiary)" }}>Вебхук: </span>
                  <span style={{ color: "var(--brand-400)" }}>{apiUrl}/webhook/readai/{slug}</span>
                </div>
              )}

              {/* PIN */}
              <div className="rounded-xl p-4 space-y-3" style={{ background: "var(--surface-2)", border: "1px solid var(--surface-border)" }}>
                <div className="flex items-center gap-2">
                  <Lock size={14} style={{ color: "var(--brand-400)" }} />
                  <span className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>PIN-код для входа</span>
                  <span className="text-xs ml-auto" style={{ color: "var(--text-tertiary)" }}>необязательно</span>
                </div>
                <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  Без PIN — любой с вашей ссылкой видит панель. С PIN — нужен код при каждом входе.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input
                      className="input-base font-mono text-center text-lg tracking-widest"
                      placeholder="1234"
                      type="password"
                      inputMode="numeric"
                      maxLength={6}
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    />
                    <p className="mt-1 text-xs text-center" style={{ color: "var(--text-tertiary)" }}>PIN</p>
                  </div>
                  <div>
                    <input
                      className="input-base font-mono text-center text-lg tracking-widest"
                      placeholder="повтор"
                      type="password"
                      inputMode="numeric"
                      maxLength={6}
                      value={pinConfirm}
                      onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    />
                    <p className="mt-1 text-xs text-center" style={{ color: "var(--text-tertiary)" }}>повтор</p>
                  </div>
                </div>
                {pinMismatch && <p className="text-xs" style={{ color: "var(--status-error)" }}>PIN не совпадает</p>}
                {pin && pinConfirm && !pinMismatch && <p className="text-xs" style={{ color: "var(--status-success)" }}>PIN совпадает</p>}
              </div>

              <button
                type="submit"
                disabled={isPending || !name || !slug || !pinValid}
                className="btn-primary w-full py-3"
              >
                {isPending ? "Создание..." : "Продолжить"}
                <ArrowRight size={16} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
