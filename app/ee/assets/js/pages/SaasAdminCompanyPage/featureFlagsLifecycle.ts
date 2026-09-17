import * as AdminApi from "@/ee/admin_api";
import { QueryClient, useMutation, useQueryClient } from "@tanstack/react-query";

export async function invalidateCompanyQueries(queryClient: QueryClient): Promise<void> {
  await queryClient.invalidateQueries({ queryKey: AdminApi.getCompanyQueryKeyPrefix() });
}

export function useEnableCompanyFeature() {
  const queryClient = useQueryClient();

  return useMutation({
    ...AdminApi.enableFeatureMutationOptions(),
    onSuccess: () => {
      void invalidateCompanyQueries(queryClient);
    },
  });
}

export function useDisableCompanyFeatures() {
  const queryClient = useQueryClient();

  return useMutation({
    ...AdminApi.disableFeaturesMutationOptions(),
    onSuccess: () => {
      void invalidateCompanyQueries(queryClient);
    },
  });
}
