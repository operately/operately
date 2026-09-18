import Api from "@/api";
import { useMutation, useQueryClient, type QueryClient, type QueryKey } from "@tanstack/react-query";

function invalidateAccountAccessQueries(client: QueryClient, prefix: QueryKey) {
  // Tokens and grants belong to the account, regardless of the company in the request headers.
  return client.invalidateQueries({
    predicate: ({ queryKey }) => queryKey[0] === prefix[0] && queryKey[1] === prefix[1] && queryKey[3] === prefix[3],
  });
}

export function useCreateApiToken() {
  const client = useQueryClient();
  return useMutation({
    ...Api.api_tokens.createMutationOptions(),
    onSuccess: () => invalidateAccountAccessQueries(client, Api.api_tokens.listQueryKeyPrefix()),
  });
}

export function useDeleteApiToken() {
  const client = useQueryClient();
  return useMutation({
    ...Api.api_tokens.deleteMutationOptions(),
    onSuccess: () => invalidateAccountAccessQueries(client, Api.api_tokens.listQueryKeyPrefix()),
  });
}

export function useSetApiTokenReadOnly() {
  const client = useQueryClient();
  return useMutation({
    ...Api.api_tokens.setReadOnlyMutationOptions(),
    onSuccess: () => invalidateAccountAccessQueries(client, Api.api_tokens.listQueryKeyPrefix()),
  });
}

export function useUpdateApiTokenName() {
  const client = useQueryClient();
  return useMutation({
    ...Api.api_tokens.updateNameMutationOptions(),
    onSuccess: () => invalidateAccountAccessQueries(client, Api.api_tokens.listQueryKeyPrefix()),
  });
}

export function useRevokeMcpGrant() {
  const client = useQueryClient();
  return useMutation({
    ...Api.mcp_grants.revokeMutationOptions(),
    onSuccess: () => invalidateAccountAccessQueries(client, Api.mcp_grants.listQueryKeyPrefix()),
  });
}
