import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";

export const metadata: Metadata = {
  title: "Протоколиус AI — ИИ-аналитика встреч от ESSG Consulting",
  description: "Решение ESSG Consulting: подключите Read AI, Google Drive и Telegram — каждая встреча индексируется и доступна через ИИ в любой момент.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
