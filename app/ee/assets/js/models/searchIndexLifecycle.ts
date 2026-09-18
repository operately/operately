import * as AdminApi from "@/ee/admin_api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

export function useRefreshSearchIndex() {
  const client = useQueryClient();
  return useCallback(
    () => client.invalidateQueries({ queryKey: AdminApi.getSearchIndexStatusQueryKeyPrefix() }),
    [client],
  );
}

export function useStartSearchIndexMaintenance() {
  const client = useQueryClient();
  return useMutation({
    ...AdminApi.startSearchIndexMaintenanceMutationOptions(),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: AdminApi.getSearchIndexStatusQueryKeyPrefix(), refetchType: "none" }),
  });
}
