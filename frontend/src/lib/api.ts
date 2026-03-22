import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: `${API_BASE}/api/v1`,
  headers: { "Content-Type": "application/json" },
});

// Inject API key from localStorage on every request
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const apiKey = localStorage.getItem("api_key");
    if (apiKey) {
      config.headers["X-API-Key"] = apiKey;
    }
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      const isSetup = window.location.pathname.startsWith("/setup");
      const isWorkspace = window.location.pathname.startsWith("/workspace");
      if (!isSetup && !isWorkspace) {
        localStorage.removeItem("api_key");
        localStorage.removeItem("workspace_token");
        window.location.href = "/";
      }
    }
    return Promise.reject(err);
  }
);

// ─── Company ──────────────────────────────────────────────────────
export const createCompany = (data: { company_name: string; company_slug: string; pin?: string }) =>
  api.post("/companies", data).then((r) => r.data);

export const getWorkspaceInfo = (token: string) =>
  api.get(`/companies/workspace/${token}`).then((r) => r.data);

export const verifyWorkspacePin = (token: string, pin: string) =>
  api.post(`/companies/workspace/${token}/verify`, { pin }).then((r) => r.data);

export const getCompany = () => api.get("/companies/me").then((r) => r.data);

export const updateCompany = (data: { company_name?: string }) =>
  api.patch("/companies/me", data).then((r) => r.data);

// ─── Integrations ────────────────────────────────────────────────
export const getIntegrations = () => api.get("/integrations").then((r) => r.data);

export const updateReadAI = (data: { read_ai_webhook_secret?: string; read_ai_enabled: boolean }) =>
  api.patch("/integrations/readai", data).then((r) => r.data);

export const generateReadAISecret = () =>
  api.post("/integrations/readai/generate-secret").then((r) => r.data);

export const updateGoogleDrive = (data: { google_drive_folder_id?: string; google_credentials_json?: object }) =>
  api.patch("/integrations/google-drive", data).then((r) => r.data);

export const getGoogleDriveAuthUrl = () =>
  api.get("/integrations/google-drive/auth").then((r) => r.data);

export const updateLLM = (data: {
  llm_provider?: string;
  llm_model?: string;
  llm_api_key?: string;
  llm_base_url?: string;
  llm_embedding_model?: string;
  assistant_prompt?: string;
}) => api.patch("/integrations/llm", data).then((r) => r.data);

export const testLLM = () => api.post("/integrations/llm/test").then((r) => r.data);

export const updateTelegram = (data: { telegram_bot_token?: string; assistant_prompt?: string }) =>
  api.patch("/integrations/telegram", data).then((r) => r.data);

export const verifyTelegramToken = (token: string) =>
  api.post(`/integrations/telegram/verify?token=${encodeURIComponent(token)}`).then((r) => r.data);

// ─── Status ───────────────────────────────────────────────────────
export const getStatus = () => api.get("/status").then((r) => r.data);

// ─── Meetings ────────────────────────────────────────────────────
export const getMeetings = (params?: { page?: number; per_page?: number; status?: string }) =>
  api.get("/meetings", { params }).then((r) => r.data);

export const getMeeting = (id: string) => api.get(`/meetings/${id}`).then((r) => r.data);

export const reprocessMeeting = (id: string) =>
  api.post(`/meetings/${id}/reprocess`).then((r) => r.data);

export const deleteMeeting = (id: string) => api.delete(`/meetings/${id}`);

// ─── Logs ────────────────────────────────────────────────────────
export const getLogs = (params?: { page?: number; per_page?: number }) =>
  api.get("/logs", { params }).then((r) => r.data);

export const getMeetingLogs = (meetingId: string) =>
  api.get(`/logs/${meetingId}`).then((r) => r.data);

// ─── Test ────────────────────────────────────────────────────────
export const testIngest = (payload?: object) =>
  api.post("/test/ingest", payload).then((r) => r.data);

export const testQuery = (data: { question: string; top_k?: number }) =>
  api.post("/test/query", data).then((r) => r.data);

export const getSamplePayload = () => api.get("/test/sample-payload").then((r) => r.data);
