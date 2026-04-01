"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function DashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("workspace_token");
    if (token) {
      router.replace(`/w/${token}/dashboard`);
    } else {
      router.replace("/setup");
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--surface-0)" }}>
      <Loader2 size={32} className="animate-spin" style={{ color: "var(--brand-400)" }} />
    </div>
  );
}
