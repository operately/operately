import Api from "@/api";
import { QueryClient, useMutation, useQueryClient } from "@tanstack/react-query";

export async function invalidateGoalRetrospectiveQueries(queryClient: QueryClient): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: Api.companies.getActivityQueryKeyPrefix() }),
    queryClient.invalidateQueries({ queryKey: Api.goals.getQueryKeyPrefix() }),
  ]);
}

export function useAcknowledgeGoalRetrospective() {
  const queryClient = useQueryClient();

  return useMutation({
    ...Api.goals.acknowledgeRetrospectiveMutationOptions(),
    onSuccess: () => {
      void invalidateGoalRetrospectiveQueries(queryClient);
    },
  });
}
