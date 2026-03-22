"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Loader2, Play, Code, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/common/EmptyState";
import { testIngest, testQuery, getSamplePayload } from "@/lib/api";
import { motionConfig } from "@/lib/motion";
import { toast } from "sonner";

interface ChatMessage {
  role: "user" | "bot";
  content: string;
  meta?: { chunks: number; latency: number };
}

export default function TestPage() {
  const [activeTab, setActiveTab] = useState<"ingest" | "query">("ingest");

  const [payload, setPayload] = useState("");
  const [ingesting, setIngesting] = useState(false);
  const [ingestResult, setIngestResult] = useState<{ status: string; task_id: string } | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [querying, setQuerying] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadSamplePayload = async () => {
    try {
      const sample = await getSamplePayload();
      setPayload(JSON.stringify(sample, null, 2));
    } catch {
      toast.error("Не удалось загрузить пример");
    }
  };

  const handleIngest = async () => {
    setIngesting(true);
    try {
      let parsed: object | undefined;
      if (payload.trim()) {
        parsed = JSON.parse(payload);
      }
      const result = await testIngest(parsed);
      setIngestResult(result);
      toast.success("Встреча поставлена в очередь обработки");
    } catch (err) {
      if (err instanceof SyntaxError) {
        toast.error("Некорректный JSON");
      } else {
        toast.error("Ошибка загрузки");
      }
    } finally {
      setIngesting(false);
    }
  };

  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || querying) return;

    const q = question.trim();
    setQuestion("");
    setMessages((prev) => [...prev, { role: "user", content: q }]);
    setQuerying(true);

    try {
      const result = await testQuery({ question: q, top_k: 5 });
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          content: result.answer,
          meta: { chunks: result.chunks_used, latency: result.latency_ms },
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "bot", content: "Ошибка: не удалось выполнить запрос к базе знаний. Убедитесь, что LLM настроен." },
      ]);
    } finally {
      setQuerying(false);
    }
  };

  return (
    <div className="p-8">
        <PageHeader
          title="Тест и симуляция"
          description="Тестирование загрузки вебхуков и запросы к базе знаний"
        />

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl mb-6 w-fit" style={{ background: "var(--surface-2)", border: "1px solid var(--surface-border)" }}>
          <button
            onClick={() => setActiveTab("ingest")}
            className="px-5 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: activeTab === "ingest" ? "var(--surface-3)" : "transparent",
              color: activeTab === "ingest" ? "var(--text-primary)" : "var(--text-tertiary)",
            }}
          >
            Тест загрузки
          </button>
          <button
            onClick={() => setActiveTab("query")}
            className="px-5 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: activeTab === "query" ? "var(--surface-3)" : "transparent",
              color: activeTab === "query" ? "var(--text-primary)" : "var(--text-tertiary)",
            }}
          >
            Симулятор бота
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "ingest" ? (
            <motion.div key="ingest" {...motionConfig.fadeIn} className="max-w-2xl">
              <div className="glass-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    Данные встречи (JSON)
                  </p>
                  <button
                    onClick={loadSamplePayload}
                    className="flex items-center gap-1.5 text-xs font-semibold transition-opacity hover:opacity-75"
                    style={{ color: "var(--brand-400)" }}
                  >
                    <Code size={12} /> Загрузить пример
                  </button>
                </div>
                <textarea
                  className="input-base font-mono text-xs"
                  rows={16}
                  placeholder="Вставьте вебхук-данные Read AI, или оставьте пустым для использования примера"
                  value={payload}
                  onChange={(e) => setPayload(e.target.value)}
                />

                <button onClick={handleIngest} disabled={ingesting} className="btn-primary w-full py-3">
                  {ingesting ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                  {ingesting ? "Обработка..." : "Отправить на обработку"}
                </button>

                {ingestResult && (
                  <div
                    className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
                    style={{
                      background: "rgba(16,217,160,0.07)",
                      border: "1px solid rgba(16,217,160,0.2)",
                      color: "var(--status-success)",
                    }}
                  >
                    ✓ Успешно поставлено в очередь · Task: <code className="font-mono text-xs">{ingestResult.task_id}</code>
                  </div>
                )}

                <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  Встреча будет обработана асинхронно. Проверьте страницы Встречи и Журнал для просмотра статуса.
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div key="query" {...motionConfig.fadeIn} className="max-w-2xl">
              <div className="glass-card flex flex-col overflow-hidden" style={{ height: "62vh" }}>
                {/* Chat header */}
                <div
                  className="px-5 py-4 border-b flex items-center gap-3"
                  style={{ borderColor: "var(--surface-border)" }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{
                      background: "linear-gradient(135deg, rgba(0,194,255,0.15), rgba(0,102,224,0.1))",
                      border: "1px solid rgba(0,194,255,0.2)",
                    }}
                  >
                    <Bot size={16} style={{ color: "var(--brand-400)" }} />
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Бот знаний встреч</p>
                    <p className="text-xs flex items-center gap-1" style={{ color: "var(--text-tertiary)" }}>
                      <Sparkles size={10} />
                      Спросите что угодно о ваших встречах
                    </p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {messages.length === 0 && (
                    <div className="text-center py-10">
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                        style={{
                          background: "var(--brand-glow)",
                          border: "1px solid rgba(0,194,255,0.15)",
                        }}
                      >
                        <Bot size={22} style={{ color: "var(--brand-400)" }} />
                      </div>
                      <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                        Попробуйте: «Какие задачи были на последней встрече?»
                      </p>
                    </div>
                  )}
                  <AnimatePresence>
                    {messages.map((msg, i) => (
                      <motion.div
                        key={i}
                        {...motionConfig.chatMessage}
                        className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                      >
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                          style={{
                            background: msg.role === "user"
                              ? "var(--brand-gradient)"
                              : "var(--surface-3)",
                          }}
                        >
                          {msg.role === "user"
                            ? <User size={12} className="text-white" />
                            : <Bot size={12} style={{ color: "var(--brand-400)" }} />
                          }
                        </div>
                        <div className={`max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
                          <div
                            className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                            style={{
                              background: msg.role === "user"
                                ? "linear-gradient(135deg, #00C2FF, #0066E0)"
                                : "var(--surface-2)",
                              color: msg.role === "user" ? "white" : "var(--text-primary)",
                              borderBottomRightRadius: msg.role === "user" ? 4 : 16,
                              borderBottomLeftRadius: msg.role === "user" ? 16 : 4,
                              border: msg.role === "bot" ? "1px solid var(--surface-border)" : "none",
                            }}
                          >
                            {msg.content}
                          </div>
                          {msg.meta && (
                            <p className="text-xs px-1 font-mono" style={{ color: "var(--text-tertiary)" }}>
                              {msg.meta.chunks} чанков · {msg.meta.latency}мс
                            </p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {querying && (
                    <div className="flex gap-3">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "var(--surface-3)" }}>
                        <Bot size={12} style={{ color: "var(--brand-400)" }} />
                      </div>
                      <div
                        className="px-4 py-3 rounded-2xl"
                        style={{ background: "var(--surface-2)", borderBottomLeftRadius: 4, border: "1px solid var(--surface-border)" }}
                      >
                        <Loader2 size={14} className="animate-spin" style={{ color: "var(--text-tertiary)" }} />
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleQuery} className="px-5 py-4 border-t flex gap-3" style={{ borderColor: "var(--surface-border)" }}>
                  <input
                    className="input-base flex-1"
                    placeholder="Задайте вопрос о ваших встречах..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    disabled={querying}
                  />
                  <button type="submit" disabled={querying || !question.trim()} className="btn-primary px-4 py-2">
                    <Send size={15} />
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
  );
}
