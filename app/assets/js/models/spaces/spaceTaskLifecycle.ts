import Api from "@/api";
import { QueryClient, useMutation, useQueryClient } from "@tanstack/react-query";

type RefetchType = "active" | "none";

export async function invalidateSpaceTaskQueries(
  queryClient: QueryClient,
  refetchType: RefetchType = "active",
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: Api.spaces.getQueryKeyPrefix(), refetchType }),
    queryClient.invalidateQueries({ queryKey: Api.spaces.listTasksQueryKeyPrefix(), refetchType }),
  ]);
}

export function useUpdateSpaceKanban() {
  const queryClient = useQueryClient();

  return useMutation({
    ...Api.spaces.updateKanbanMutationOptions(),
    onSuccess: () => {
      void invalidateSpaceTaskQueries(queryClient);
    },
  });
}

export function useUpdateSpaceTaskStatuses() {
  const queryClient = useQueryClient();

  return useMutation({
    ...Api.spaces.updateTaskStatusesMutationOptions(),
    onSuccess: () => {
      void invalidateSpaceTaskQueries(queryClient);
    },
  });
}
