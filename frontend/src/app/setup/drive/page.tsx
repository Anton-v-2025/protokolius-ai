"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, HardDrive, Upload } from "lucide-react";
import { getGoogleDriveAuthUrl, updateGoogleDrive } from "@/lib/api";

export default function SetupDrive() {
  const router = useRouter();
  const [mode, setMode] = useState<"oauth" | "service">("oauth");
  const [jsonText, setJsonText] = useState("");
  const [folderId, setFolderId] = useState("");
  const [loading, setLoading] = useState(false);

  const handleOAuth = async () => {
    setLoading(true);
    try {
      const data = await getGoogleDriveAuthUrl();
      window.location.href = data.auth_url;
    } catch {
      toast.error("Не удалось запустить авторизацию Google");
      setLoading(false);
    }
  };

  const handleServiceAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const json = JSON.parse(jsonText);
      await updateGoogleDrive({ google_credentials_json: json, google_drive_folder_id: folderId || undefined });
      toast.success("Google Drive подключён");
      router.push("/setup/llm");
    } catch (err: unknown) {
      const msg = err instanceof SyntaxError ? "Некорректный JSON" : "Не удалось сохранить";
      toast.error(msg);
    }
  };

  const handleSkip = () => router.push("/setup/llm");

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.25)" }}
        >
          <HardDrive size={20} style={{ color: "#34D399" }} />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            Подключить Google Drive
          </h1>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            Шаг 3 из 5 — Хранилище JSON встреч
          </p>
        </div>
      </div>

      {/* Mode selector */}
      <div
        className="flex gap-1 p-1 rounded-xl mb-6"
        style={{ background: "var(--surface-2)", border: "1px solid var(--surface-border)" }}
      >
        {(["oauth", "service"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: mode === m ? "var(--surface-3)" : "transparent",
              color: mode === m ? "var(--text-primary)" : "var(--text-tertiary)",
              boxShadow: mode === m ? "var(--shadow-sm)" : "none",
            }}
          >
            {m === "oauth" ? "Google OAuth" : "Сервисный аккаунт"}
          </button>
        ))}
      </div>

      {mode === "oauth" ? (
        <div className="space-y-5">
          <div
            className="rounded-xl p-4"
            style={{ background: "var(--surface-2)", border: "1px solid var(--surface-border)" }}
          >
            <p className="text-sm font-semibold mb-2.5" style={{ color: "var(--text-primary)" }}>
              Инструкция
            </p>
            <ol className="space-y-1.5 text-sm" style={{ color: "var(--text-secondary)" }}>
              <li>1. Нажмите «Войти через Google» ниже</li>
              <li>2. Выберите Google-аккаунт и разрешите доступ к Drive</li>
              <li>3. Вы будете перенаправлены обратно автоматически</li>
            </ol>
          </div>
          <button
            onClick={handleOAuth}
            disabled={loading}
            className="btn-primary w-full py-3"
          >
            {loading ? "Перенаправление..." : "Войти через Google"}
            <ArrowRight size={16} />
          </button>
        </div>
      ) : (
        <form onSubmit={handleServiceAccount} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
              JSON сервисного аккаунта
            </label>
            <textarea
              className="input-base font-mono text-xs"
              rows={8}
              placeholder='{"type": "service_account", ...}'
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              required
            />
            <p className="mt-1.5 text-xs" style={{ color: "var(--text-tertiary)" }}>
              Google Cloud Console → IAM → Сервисные аккаунты → Создать ключ (JSON)
            </p>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
              ID корневой папки{" "}
              <span className="font-normal" style={{ color: "var(--text-tertiary)" }}>(необязательно)</span>
            </label>
            <input
              className="input-base"
              placeholder="ID папки Google Drive"
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary w-full py-3">
            <Upload size={16} />
            Сохранить и продолжить
          </button>
        </form>
      )}

      <div className="flex gap-3 mt-4">
        <button onClick={() => router.push("/setup/readai")} className="btn-ghost flex-1 py-2.5 text-sm">
          Назад
        </button>
        <button onClick={handleSkip} className="btn-ghost flex-1 py-2.5 text-sm">
          Пропустить
        </button>
      </div>
    </div>
  );
}
