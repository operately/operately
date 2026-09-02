import Api from "@/api";
import { QueryClient, useMutation, useQueryClient } from "@tanstack/react-query";

export async function invalidateMeQueries(queryClient: QueryClient): Promise<void> {
  await queryClient.invalidateQueries({ queryKey: Api.people.getMeQueryKeyPrefix() });
}

export function useDismissProductRelease() {
  const queryClient = useQueryClient();

  return useMutation({
    ...Api.product_releases.dismissMutationOptions(),
    onSuccess: () => invalidateMeQueries(queryClient),
  });
}
