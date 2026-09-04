import Api, { type Json, type SpacesGetResult } from "@/api";
import { compareIds } from "@/routes/paths";
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

export function writeCachedSpaceKanbanState(queryClient: QueryClient, spaceId: string, kanbanState: Json): void {
  queryClient.setQueriesData({ queryKey: Api.spaces.getQueryKeyPrefix() }, (current: SpacesGetResult | undefined) => {
    if (!current?.space || !compareIds(current.space.id, spaceId)) {
      return current;
    }

    return {
      ...current,
      space: {
        ...current.space,
        tasksKanbanState: kanbanState,
      },
    };
  });
}

export function useUpdateSpaceKanban() {
  const queryClient = useQueryClient();

  return useMutation({
    ...Api.spaces.updateKanbanMutationOptions(),
    onSuccess: (_data, variables) => {
      writeCachedSpaceKanbanState(queryClient, variables.spaceId, variables.kanbanState);
      void invalidateSpaceTaskQueries(queryClient, "none");
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
