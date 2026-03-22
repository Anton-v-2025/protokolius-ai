"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, createContext, useContext } from "react";
import AppShell from "@/components/layout/AppShell";

const WorkspaceContext = createContext<string>("");

export function useWorkspaceToken() {
  return useContext(WorkspaceContext);
}

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  useEffect(() => {
    // Store token for navigation
    if (token) {
      localStorage.setItem("workspace_token", token);
    }
  }, [token]);

  useEffect(() => {
    // Check if API key exists, otherwise redirect to workspace entry
    const apiKey = localStorage.getItem("api_key");
    if (!apiKey) {
      router.replace(`/workspace/${token}`);
    }
  }, [token, router]);

  return (
    <WorkspaceContext.Provider value={token}>
      <AppShell workspaceToken={token}>{children}</AppShell>
    </WorkspaceContext.Provider>
  );
}
