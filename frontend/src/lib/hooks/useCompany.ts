"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCompany, createCompany, updateCompany } from "@/lib/api";
import { useState, useEffect } from "react";

export function useApiKey() {
  const [apiKey, setApiKeyState] = useState<string | null>(null);

  useEffect(() => {
    setApiKeyState(localStorage.getItem("api_key"));
  }, []);

  const setApiKey = (key: string) => {
    localStorage.setItem("api_key", key);
    setApiKeyState(key);
  };

  const clearApiKey = () => {
    localStorage.removeItem("api_key");
    setApiKeyState(null);
  };

  return { apiKey, setApiKey, clearApiKey, isAuthenticated: !!apiKey };
}

export function useCompany() {
  return useQuery({
    queryKey: ["company"],
    queryFn: getCompany,
    retry: false,
  });
}

export function useCreateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { company_name: string; company_slug: string; pin?: string }) =>
      createCompany(data),
    onSuccess: (data) => {
      localStorage.setItem("api_key", data.api_key);
      localStorage.setItem("workspace_token", data.workspace_token);
      qc.setQueryData(["company"], data);
    },
  });
}

export function useUpdateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateCompany,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["company"] }),
  });
}
