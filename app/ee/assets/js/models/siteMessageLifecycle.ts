import * as AdminApi from "@/ee/admin_api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

export function useRefreshSiteMessages() {
  const client = useQueryClient();
  return useCallback(() => client.invalidateQueries({ queryKey: AdminApi.listSiteMessagesQueryKeyPrefix() }), [client]);
}

export function useSiteMessageCompanies() {
  return useQuery(AdminApi.getCompaniesQueryOptions({}));
}

export function useCreateSiteMessage() {
  const client = useQueryClient();
  return useMutation({
    ...AdminApi.createSiteMessageMutationOptions(),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: AdminApi.listSiteMessagesQueryKeyPrefix(), refetchType: "none" }),
  });
}

export function useUpdateSiteMessage() {
  const client = useQueryClient();
  return useMutation({
    ...AdminApi.updateSiteMessageMutationOptions(),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: AdminApi.listSiteMessagesQueryKeyPrefix(), refetchType: "none" }),
  });
}

export function useDeleteSiteMessage() {
  const client = useQueryClient();
  return useMutation({
    ...AdminApi.deleteSiteMessageMutationOptions(),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: AdminApi.listSiteMessagesQueryKeyPrefix(), refetchType: "none" }),
  });
}
