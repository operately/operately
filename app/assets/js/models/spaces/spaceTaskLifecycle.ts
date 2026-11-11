import Api, { type Json, type TasksGetBoardResult, type SpacesGetResult } from "@/api";
import { compareIds } from "@/routes/paths";
import { QueryClient, useMutation, useQueryClient } from "@tanstack/react-query";

type RefetchType = "active" | "none";

export async function invalidateSpaceTaskQueries(
  queryClient: QueryClient,
  refetchType: RefetchType = "active",
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: Api.tasks.getBoardQueryKeyPrefix(), refetchType }),
    queryClient.invalidateQueries({ queryKey: Api.companies.getFlatWorkMapQueryKeyPrefix(), refetchType }),
    queryClient.invalidateQueries({ queryKey: Api.spaces.getQueryKeyPrefix(), refetchType }),
    queryClient.invalidateQueries({ queryKey: Api.spaces.listTasksQueryKeyPrefix(), refetchType }),
  ]);
}

export function writeCachedSpaceKanbanState(
  queryClient: QueryClient,
  spaceId: string,
  kanbanState: Json,
  boardId: string,
): void {
  queryClient.setQueriesData(
    { queryKey: Api.tasks.getBoardQueryKeyPrefix() },
    (current: TasksGetBoardResult | undefined) => {
      if (!current?.board || !compareIds(current.board.id, boardId)) return current;
      return { ...current, board: { ...current.board, tasksKanbanState: kanbanState } };
    },
  );
  queryClient.setQueriesData({ queryKey: Api.spaces.getQueryKeyPrefix() }, (current: SpacesGetResult | undefined) => {
    if (
      !current?.space ||
      !compareIds(current.space.id, spaceId) ||
      !current.space.defaultTaskBoardId ||
      !compareIds(current.space.defaultTaskBoardId, boardId)
    ) {
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
    onSuccess: (data, variables) => {
      writeCachedSpaceKanbanState(queryClient, variables.spaceId, variables.kanbanState, data.boardId);
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
