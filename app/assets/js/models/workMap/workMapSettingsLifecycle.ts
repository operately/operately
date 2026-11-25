import Api from "@/api";
import { QueryClient, useMutation, useQueryClient } from "@tanstack/react-query";

export async function invalidateWorkMapSettingsQueries(queryClient: QueryClient): Promise<void> {
  await queryClient.invalidateQueries({ queryKey: Api.work_maps.getSettingsQueryKeyPrefix() });
}

export function useSaveWorkMapSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    ...Api.work_maps.saveLayoutAndHierarchyMutationOptions(),
    onSuccess: () => invalidateWorkMapSettingsQueries(queryClient),
  });
}
