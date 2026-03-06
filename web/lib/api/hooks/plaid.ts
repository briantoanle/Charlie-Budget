"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiMutate } from "../client";

export function useSyncPlaidItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { plaid_item_id: string }) =>
      apiMutate<{ added: number; modified: number; removed: number }>(
        "/api/plaid/sync",
        "POST",
        data
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useDisconnectPlaidItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      plaid_item_id,
      action,
    }: {
      plaid_item_id: string;
      action: "archive" | "delete";
    }) => apiMutate<void>(`/api/plaid/items/${plaid_item_id}?action=${action}`, "DELETE"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
      qc.invalidateQueries({ queryKey: ["budget"] });
    },
  });
}
