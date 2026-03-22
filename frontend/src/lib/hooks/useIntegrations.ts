"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getIntegrations, updateReadAI, generateReadAISecret,
  updateGoogleDrive, updateLLM, testLLM, updateTelegram,
  verifyTelegramToken, getStatus,
} from "@/lib/api";

export function useIntegrations() {
  return useQuery({
    queryKey: ["integrations"],
    queryFn: getIntegrations,
    retry: false,
  });
}

export function useUpdateReadAI() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateReadAI,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["integrations"] }),
  });
}

export function useGenerateReadAISecret() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: generateReadAISecret,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["integrations"] }),
  });
}

export function useUpdateLLM() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateLLM,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["integrations"] });
      qc.invalidateQueries({ queryKey: ["status"] });
    },
  });
}

export function useTestLLM() {
  return useMutation({ mutationFn: testLLM });
}

export function useUpdateTelegram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateTelegram,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["integrations"] });
      qc.invalidateQueries({ queryKey: ["status"] });
    },
  });
}

export function useVerifyTelegram() {
  return useMutation({ mutationFn: verifyTelegramToken });
}

export function useStatus() {
  return useQuery({
    queryKey: ["status"],
    queryFn: getStatus,
    refetchInterval: 30000,
    retry: false,
  });
}
