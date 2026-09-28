import * as AdminApi from "@/ee/admin_api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

interface AccountActionOptions {
  currentAccountId?: string;
}

export function useGetCompanies() {
  return useQuery(AdminApi.getCompaniesQueryOptions({}));
}

export function useGetAccounts() {
  return useQuery(AdminApi.getAccountsQueryOptions({}));
}

export function useGetActiveCompanies() {
  return useQuery(AdminApi.getActiveCompaniesQueryOptions({}));
}

export function usePromoteAccountToSiteAdmin() {
  const client = useQueryClient();
  return useMutation({
    ...AdminApi.promoteAccountToSiteAdminMutationOptions(),
    onSuccess: async (result) => {
      if (!result.success) return;
      await client.invalidateQueries({ queryKey: AdminApi.getAccountsQueryKeyPrefix() });
    },
  });
}

export function useDemoteAccountFromSiteAdmin({ currentAccountId }: AccountActionOptions = {}) {
  const client = useQueryClient();
  return useMutation({
    ...AdminApi.demoteAccountFromSiteAdminMutationOptions(),
    onSuccess: async (result, { accountId }) => {
      if (!result.success) return;
      const refetchType = accountId === currentAccountId ? "none" : "active";
      await client.invalidateQueries({ queryKey: AdminApi.getAccountsQueryKeyPrefix(), refetchType });
    },
  });
}

export function useDeleteAccount({ currentAccountId }: AccountActionOptions = {}) {
  const client = useQueryClient();
  return useMutation({
    ...AdminApi.deleteAccountMutationOptions(),
    onSuccess: async (result, { accountId }) => {
      if (!result.success) return;
      const refetchType = accountId === currentAccountId ? "none" : "active";
      // Deletion suspends linked people and anonymizes owners. The response does not identify their companies.
      const prefixes = [
        AdminApi.getAccountsQueryKeyPrefix(),
        AdminApi.getCompaniesQueryKeyPrefix(),
        AdminApi.getActiveCompaniesQueryKeyPrefix(),
        AdminApi.getCompanyQueryKeyPrefix(),
      ];
      await Promise.all(prefixes.map((queryKey) => client.invalidateQueries({ queryKey, refetchType })));
    },
  });
}
