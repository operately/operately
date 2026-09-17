import Api from "@/api";
import { QueryClient, useMutation, useQueryClient } from "@tanstack/react-query";

async function invalidateCompanyQueries(client: QueryClient, refetchType: "active" | "none" = "active") {
  await Promise.all([
    client.invalidateQueries({ queryKey: Api.companies.getQueryKeyPrefix(), refetchType }),
    client.invalidateQueries({ queryKey: Api.companies.listQueryKeyPrefix(), refetchType }),
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
