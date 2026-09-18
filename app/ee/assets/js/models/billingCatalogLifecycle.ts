import * as AdminApi from "@/ee/admin_api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import Api from "@/api";

export function useRefreshBillingCatalog() {
  const client = useQueryClient();
  return useCallback(
    () =>
      Promise.all([
        client.invalidateQueries({ queryKey: AdminApi.listBillingProductsQueryKeyPrefix() }),
        client.invalidateQueries({ queryKey: AdminApi.listBillingPlanDefinitionsQueryKeyPrefix() }),
      ]),
    [client],
  );
}

function useCatalogInvalidation() {
  const client = useQueryClient();
  return () => {
    const billingPrefixes = [Api.billing.getCatalogQueryKeyPrefix(), Api.billing.getQueryKeyPrefix()];

    // Existing success callbacks refresh the admin lists; other cached views refresh on their next visit.
    return Promise.all([
      client.invalidateQueries({ queryKey: AdminApi.listBillingProductsQueryKeyPrefix(), refetchType: "none" }),
      client.invalidateQueries({ queryKey: AdminApi.listBillingPlanDefinitionsQueryKeyPrefix(), refetchType: "none" }),
      client.invalidateQueries({
        predicate: ({ queryKey }) =>
          billingPrefixes.some(
            (prefix) => queryKey[0] === prefix[0] && queryKey[1] === prefix[1] && queryKey[3] === prefix[3],
          ),
        refetchType: "none",
      }),
    ]);
  };
}

export function useCreateBillingProduct() {
  const invalidate = useCatalogInvalidation();
  return useMutation({ ...AdminApi.createBillingProductMutationOptions(), onSuccess: invalidate });
}

export function useUpdateBillingProduct() {
  const invalidate = useCatalogInvalidation();
  return useMutation({ ...AdminApi.updateBillingProductMutationOptions(), onSuccess: invalidate });
}

export function useArchiveBillingProduct() {
  const invalidate = useCatalogInvalidation();
  return useMutation({ ...AdminApi.archiveBillingProductMutationOptions(), onSuccess: invalidate });
}

export function useSetActiveBillingProduct() {
  const invalidate = useCatalogInvalidation();
  return useMutation({ ...AdminApi.setActiveBillingProductMutationOptions(), onSuccess: invalidate });
}

export function useSyncBillingProductsFromPolar() {
  const invalidate = useCatalogInvalidation();
  return useMutation({ ...AdminApi.syncBillingProductsFromPolarMutationOptions(), onSuccess: invalidate });
}

export function useCreateBillingPlanDefinition() {
  const invalidate = useCatalogInvalidation();
  return useMutation({ ...AdminApi.createBillingPlanDefinitionMutationOptions(), onSuccess: invalidate });
}

export function useUpdateBillingPlanDefinition() {
  const invalidate = useCatalogInvalidation();
  return useMutation({ ...AdminApi.updateBillingPlanDefinitionMutationOptions(), onSuccess: invalidate });
}

export function useArchiveBillingPlanDefinition() {
  const invalidate = useCatalogInvalidation();
  return useMutation({ ...AdminApi.archiveBillingPlanDefinitionMutationOptions(), onSuccess: invalidate });
}

export function useUnarchiveBillingPlanDefinition() {
  const invalidate = useCatalogInvalidation();
  return useMutation({ ...AdminApi.unarchiveBillingPlanDefinitionMutationOptions(), onSuccess: invalidate });
}
