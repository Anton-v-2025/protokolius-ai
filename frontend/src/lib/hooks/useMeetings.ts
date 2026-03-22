"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMeetings, getMeeting, reprocessMeeting, deleteMeeting, getLogs, getMeetingLogs } from "@/lib/api";

export function useMeetings(params?: { page?: number; per_page?: number; status?: string }) {
  return useQuery({
    queryKey: ["meetings", params],
    queryFn: () => getMeetings(params),
    retry: false,
  });
}

export function useMeeting(id: string) {
  return useQuery({
    queryKey: ["meeting", id],
    queryFn: () => getMeeting(id),
    enabled: !!id,
  });
}

export function useReprocessMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: reprocessMeeting,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meetings"] }),
  });
}

export function useDeleteMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteMeeting,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meetings"] }),
  });
}

export function useLogs(params?: { page?: number; per_page?: number }) {
  return useQuery({
    queryKey: ["logs", params],
    queryFn: () => getLogs(params),
    refetchInterval: 10000,
    retry: false,
  });
}

export function useMeetingLogs(meetingId: string) {
  return useQuery({
    queryKey: ["meeting-logs", meetingId],
    queryFn: () => getMeetingLogs(meetingId),
    enabled: !!meetingId,
  });
}
