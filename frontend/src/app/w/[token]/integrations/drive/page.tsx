"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { HardDrive, ExternalLink, ChevronLeft, Upload, CheckCircle, FolderOpen } from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "@/components/common/StatusDot";
import { useWorkspacePrefix } from "@/lib/hooks/useWorkspace";
import { useIntegrations } from "@/lib/hooks/useIntegrations";
import { getGoogleDriveAuthUrl, updateGoogleDrive } from "@/lib/api";

export default function DriveIntegration() {
  const { link } = useWorkspacePrefix();
  const { data: integrations } = useIntegrations();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"oauth" | "service">("oauth");
  const [jsonText, setJsonText] = useState("");
  const [folderId, setFolderId] = useState("");

  useEffect(() => {
    if (integrations?.google_drive_folder_id) setFolderId(integrations.google_drive_folder_id);
  }, [integrations]);

  const handleOAuth = async () => {
    setLoading(true);
    try {
      const data = await getGoogleDriveAuthUrl();
      window.location.href = data.auth_url;
    } catch {
      toast.error("Не удалось запустить OAuth"); setLoading(false);
    }
  };

  const handleServiceAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const json = JSON.parse(jsonText);
      await updateGoogleDrive({ google_credentials_json: json, google_drive_folder_id: folderId || undefined });
      toast.success("Google Drive подключён");
    } catch (err) {
      toast.error(err instanceof SyntaxError ? "Некорректный JSON" : "Не удалось сохранить");
    }
  };

  const status = integrations?.google_drive_enabled ? "connected" : "not_configured";

  return (
    <div className="p-8 max-w-2xl">
        <Link
          href={link("/integrations")}
          className="flex items-center gap-1.5 text-sm mb-6 transition-opacity hover:opacity-75"
          style={{ color: "var(--text-tertiary)" }}
        >
          <ChevronLeft size={15} /> Назад к интеграциям
        </Link>

        <div className="flex items-center gap-4 mb-8">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.25)" }}
          >
            <HardDrive size={22} style={{ color: "#34D399" }} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Google Drive</h1>
              <StatusBadge status={status as "connected" | "not_configured"} />
            </div>
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>Хранилище JSON-файлов встреч</p>
          </div>
        </div>

        {/* Mode tabs */}
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
          <div className="glass-card p-6 space-y-5">
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Подключите свой Google-аккаунт. Протоколы встреч будут сохраняться в папку{" "}
              <code className="font-mono text-xs px-1.5 py-0.5 rounded" style={{ color: "var(--brand-400)", background: "var(--brand-glow)" }}>
                /НазваниеКомпании/Meetings/ГГГГ/ММ/
              </code>
            </p>

            {integrations?.google_drive_enabled && (
              <div
                className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
                style={{
                  background: "rgba(16,217,160,0.07)",
                  border: "1px solid rgba(16,217,160,0.2)",
                  color: "var(--status-success)",
                }}
              >
                <CheckCircle size={15} />
                Google Drive подключён
              </div>
            )}

            <button onClick={handleOAuth} disabled={loading} className="btn-primary w-full py-3">
              <ExternalLink size={16} />
              {loading ? "Перенаправление..." : "Войти через Google"}
            </button>
          </div>
        ) : (
          <form onSubmit={handleServiceAccount} className="glass-card p-6 space-y-5">
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
                Скачайте JSON-ключ в Google Cloud Console → IAM → Сервисные аккаунты.
              </p>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
                ID корневой папки{" "}
                <span className="font-normal" style={{ color: "var(--text-tertiary)" }}>(необязательно)</span>
              </label>
              <div className="relative">
                <FolderOpen size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-tertiary)" }} />
                <input
                  className="input-base pl-8"
                  placeholder="ID папки Google Drive"
                  value={folderId}
                  onChange={(e) => setFolderId(e.target.value)}
                />
              </div>
            </div>
            <button type="submit" className="btn-primary w-full py-2.5 text-sm">
              <Upload size={16} /> Сохранить сервисный аккаунт
            </button>
          </form>
        )}

        {/* File structure info */}
        <div
          className="mt-6 text-sm p-4 rounded-xl space-y-2.5"
          style={{ background: "var(--surface-2)", border: "1px solid var(--surface-border)", color: "var(--text-secondary)" }}
        >
          <p className="font-bold" style={{ color: "var(--text-primary)" }}>Структура файлов</p>
          <code className="font-mono text-xs block" style={{ color: "var(--brand-400)" }}>
            /НазваниеКомпании/Meetings/ГГГГ/ММ/meetingId_v1.json
          </code>
          <p style={{ color: "var(--text-tertiary)" }}>
            Каждая встреча сохраняется как версионированный JSON. Предыдущие версии сохраняются.
          </p>
        </div>
      </div>
  );
}
