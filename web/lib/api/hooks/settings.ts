"use client";

import { useQuery, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { apiFetch, apiMutate } from "../client";
import type { ProfileResponse } from "../types";

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: () =>
      apiFetch<{ profile: ProfileResponse }>("/api/settings").then(
        (r) => r.profile
      ),
  });
}

export function useSuspenseProfile() {
  return useSuspenseQuery({
    queryKey: ["profile"],
    queryFn: () =>
      apiFetch<{ profile: ProfileResponse }>("/api/settings").then(
        (r) => r.profile
      ),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { display_name?: string; country?: string }) =>
      apiMutate<ProfileResponse>("/api/settings/profile", "PATCH", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });
}

export function useUpdateCurrency() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { currency: string }) =>
      apiMutate<{ base_currency: string }>(
        "/api/settings/currency",
        "POST",
        data
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

export function useDeleteUserAccount() {
  return useMutation({
    mutationFn: () =>
      apiMutate<void>("/api/settings/account", "DELETE", {
        confirm: "DELETE",
      }),
  });
}

export function useExportData() {
  return useMutation({
    mutationFn: async (format: "csv" | "json") => {
      const res = await fetch("/api/settings/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Export failed");
      }
      // Trigger file download
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="?(.+?)"?$/);
      const filename = match?.[1] ?? `charlie-export.${format}`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    },
  });
}
