"use client";

import { useParams } from "next/navigation";

export function useWorkspacePrefix() {
  const params = useParams();
  const token = params?.token as string | undefined;
  const prefix = token ? `/w/${token}` : "";
  return { token, prefix, link: (path: string) => `${prefix}${path}` };
}
