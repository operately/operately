import Api from "@/api";
import { QueryClient, useMutation, useQueryClient } from "@tanstack/react-query";

async function invalidateCompanyQueries(client: QueryClient, refetchType: "active" | "none" = "active") {
  await Promise.all([
    client.invalidateQueries({ queryKey: Api.companies.getQueryKeyPrefix(), refetchType }),
    invalidateCompanyListQueries(client, refetchType),
  ]);
}

export function useEditCompany() {
  const client = useQueryClient();
  return useMutation({
    ...Api.companies.updateMutationOptions(),
    onSuccess: () => invalidateCompanyQueries(client),
  });
}

export function useAddCompanyTrustedEmailDomain() {
  const client = useQueryClient();
  return useMutation({
    ...Api.addCompanyTrustedEmailDomainMutationOptions(),
    onSuccess: () => invalidateCompanyQueries(client),
  });
}

export function useRemoveCompanyTrustedEmailDomain() {
  const client = useQueryClient();
  return useMutation({
    ...Api.companies.deleteTrustedEmailDomainMutationOptions(),
    onSuccess: () => invalidateCompanyQueries(client),
  });
}

export function useDeleteCompany() {
  const client = useQueryClient();
  return useMutation({
    ...Api.deleteCompanyMutationOptions(),
    onSuccess: () => invalidateCompanyQueries(client, "none"),
  });
}

/** Company membership lists are account-wide, including copies cached under company headers. */
export function invalidateCompanyListQueries(client: QueryClient, refetchType: "active" | "none" = "active") {
  const prefix = Api.companies.listQueryKeyPrefix();
  return client.invalidateQueries({
    predicate: ({ queryKey }) => queryKey[0] === prefix[0] && queryKey[1] === prefix[1] && queryKey[3] === prefix[3],
    refetchType,
  });
}

export function useCreateCompany() {
  const client = useQueryClient();
  return useMutation({
    ...Api.companies.createMutationOptions(),
    onSuccess: () => invalidateCompanyListQueries(client),
  });
}
