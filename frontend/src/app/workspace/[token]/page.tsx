"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle, AlertCircle, Lock, ArrowRight } from "lucide-react";
import { getWorkspaceInfo, verifyWorkspacePin } from "@/lib/api";

type Stage = "loading" | "pin" | "verifying" | "success" | "error";

export default function WorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [stage, setStage] = useState<Stage>("loading");
  const [companyName, setCompanyName] = useState("");
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");

  useEffect(() => {
    if (!token) return;
    getWorkspaceInfo(token)
      .then((data) => {
        setCompanyName(data.company_name);
        if (!data.has_pin) {
          return verifyWorkspacePin(token, "").then((res) => {
            localStorage.setItem("api_key", res.api_key);
            localStorage.setItem("workspace_token", token);
            setStage("success");
            setTimeout(() => router.push(`/w/${token}/dashboard`), 1000);
          });
        } else {
          setStage("pin");
        }
      })
      .catch(() => setStage("error"));
  }, [token, router]);

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin || pin.length < 4) return;
    setStage("verifying");
    setPinError("");
    try {
      const res = await verifyWorkspacePin(token, pin);
      localStorage.setItem("api_key", res.api_key);
            localStorage.setItem("workspace_token", token);
      setStage("success");
      setTimeout(() => router.push(`/w/${token}/dashboard`), 800);
    } catch {
      setStage("pin");
      setPinError("Неверный PIN. Попробуй ещё раз.");
      setPin("");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--surface-0)" }}>
      <div
        className="fixed top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 65%)", filter: "blur(60px)" }}
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-10 text-center max-w-sm w-full mx-4 relative"
      >
        <AnimatePresence mode="wait">
          {stage === "loading" && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Loader2 size={40} className="animate-spin mx-auto mb-4" style={{ color: "var(--brand-400)" }} />
              <p className="font-semibold" style={{ color: "var(--text-primary)" }}>Загрузка…</p>
            </motion.div>
          )}
          {(stage === "pin" || stage === "verifying") && (
            <motion.div key="pin" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
                style={{ background: "var(--brand-glow)", border: "1px solid rgba(245,158,11,0.25)" }}
              >
                <Lock size={22} style={{ color: "var(--brand-400)" }} />
              </div>
              <p className="text-lg font-bold mb-1" style={{ color: "var(--text-primary)" }}>{companyName}</p>
              <p className="text-sm mb-6" style={{ color: "var(--text-tertiary)" }}>Введите PIN для входа</p>
              <form onSubmit={handlePinSubmit} className="space-y-4">
                <input
                  className="input-base font-mono text-center text-2xl tracking-[0.4em]"
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="••••"
                  value={pin}
                  onChange={(e) => { setPin(e.target.value.replace(/\D/g, "").slice(0, 6)); setPinError(""); }}
                  autoFocus
                  disabled={stage === "verifying"}
                />
                {pinError && <p className="text-xs" style={{ color: "var(--status-error)" }}>{pinError}</p>}
                <button type="submit" disabled={pin.length < 4 || stage === "verifying"} className="btn-primary w-full py-3">
                  {stage === "verifying" ? <Loader2 size={16} className="animate-spin" /> : <><span>Войти</span><ArrowRight size={15} /></>}
                </button>
              </form>
            </motion.div>
          )}
          {stage === "success" && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 280, damping: 18 }}>
                <CheckCircle size={48} className="mx-auto mb-4" style={{ color: "var(--status-success)" }} />
              </motion.div>
              <p className="text-lg font-bold mb-1" style={{ color: "var(--text-primary)" }}>{companyName}</p>
              <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>Переход в панель…</p>
            </motion.div>
          )}
          {stage === "error" && (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <AlertCircle size={48} className="mx-auto mb-4" style={{ color: "var(--status-error)" }} />
              <p className="font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Пространство не найдено</p>
              <p className="text-sm mb-6" style={{ color: "var(--text-tertiary)" }}>Ссылка недействительна или пространство было удалено.</p>
              <a href="/" style={{ color: "var(--brand-400)" }} className="text-sm underline">На главную</a>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
