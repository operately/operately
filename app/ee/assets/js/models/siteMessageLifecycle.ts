import Api from "@/api";
import * as AdminApi from "@/ee/admin_api";
import { hashKey, useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

async function invalidateSiteMessages(client: QueryClient) {
  const prefix = Api.site_messages.listActiveQueryKeyPrefix();
  await Promise.all([
    client.invalidateQueries({ queryKey: AdminApi.listSiteMessagesQueryKeyPrefix(), refetchType: "none" }),
    // Admin edits can change the audience, so mark every company's banner stale.
    client.invalidateQueries({
      predicate: ({ queryKey }) => queryKey[0] === prefix[0] && queryKey[1] === prefix[1] && queryKey[3] === prefix[3],
      refetchType: "none",
    }),
  ]);
  await client.refetchQueries({
    queryKey: prefix,
    type: "active",
    predicate: ({ queryKey }) => hashKey(queryKey.slice(0, prefix.length)) === hashKey(prefix),
  });
}

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
    onSuccess: () => invalidateSiteMessages(client),
  });
}

export function useUpdateSiteMessage() {
  const client = useQueryClient();
  return useMutation({
    ...AdminApi.updateSiteMessageMutationOptions(),
    onSuccess: () => invalidateSiteMessages(client),
  });
}

export function useDeleteSiteMessage() {
  const client = useQueryClient();
  return useMutation({
    ...AdminApi.deleteSiteMessageMutationOptions(),
    onSuccess: () => invalidateSiteMessages(client),
  });
}
