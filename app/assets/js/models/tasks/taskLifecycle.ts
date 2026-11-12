import { useCallback } from "react";
import axios from "axios";
import Api, { type TaskStatus } from "@/api";
import type { TaskPage } from "turboui";
import { QueryClient, type UseMutationOptions, useMutation, useQueryClient } from "@tanstack/react-query";

type RefetchType = "active" | "none";

export async function invalidateTaskLifecycleQueries(
  queryClient: QueryClient,
  refetchType: RefetchType = "active",
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: Api.tasks.getBoardQueryKeyPrefix(), refetchType }),
    queryClient.invalidateQueries({ queryKey: Api.companies.getFlatWorkMapQueryKeyPrefix(), refetchType }),
    queryClient.invalidateQueries({ queryKey: Api.projects.getQueryKeyPrefix(), refetchType }),
    queryClient.invalidateQueries({ queryKey: Api.tasks.listQueryKeyPrefix(), refetchType }),
    queryClient.invalidateQueries({ queryKey: Api.tasks.getQueryKeyPrefix(), refetchType }),
    queryClient.invalidateQueries({ queryKey: Api.comments.listQueryKeyPrefix(), refetchType }),
    queryClient.invalidateQueries({ queryKey: Api.companies.listActivitiesQueryKeyPrefix(), refetchType }),
    queryClient.invalidateQueries({ queryKey: Api.projects.countChildrenQueryKeyPrefix(), refetchType }),
    queryClient.invalidateQueries({ queryKey: Api.projects.getMilestoneQueryKeyPrefix(), refetchType }),
    queryClient.invalidateQueries({ queryKey: Api.projects.listMilestoneTasksQueryKeyPrefix(), refetchType }),
    queryClient.invalidateQueries({ queryKey: Api.spaces.getQueryKeyPrefix(), refetchType }),
    queryClient.invalidateQueries({ queryKey: Api.spaces.listTasksQueryKeyPrefix(), refetchType }),
  ]);
}

export function useCreateTask() {
  return useTaskMutation(Api.tasks.createMutationOptions());
}

export function useUpdateTaskName() {
  return useTaskMutation(Api.tasks.updateNameMutationOptions());
}

export function useUpdateTaskDescription() {
  return useTaskMutation(Api.tasks.updateDescriptionMutationOptions());
}

export function useUpdateTaskArchive() {
  return useTaskMutation(Api.tasks.updateArchiveMutationOptions());
}

export function useUpdateTaskStatus() {
  return useTaskMutation(Api.tasks.updateStatusMutationOptions());
}

export function useUpdateTaskDueDate() {
  return useTaskMutation(Api.tasks.updateDueDateMutationOptions());
}

export function useUpdateTaskReminders() {
  return useTaskMutation(Api.tasks.updateRemindersMutationOptions());
}

export function useUpdateTaskAssignee() {
  return useTaskMutation(Api.tasks.updateAssigneeMutationOptions());
}

export function useUpdateTaskMilestone() {
  return useTaskMutation(Api.tasks.updateMilestoneMutationOptions());
}

export function useUpdateTaskMilestoneAndOrdering() {
  return useTaskMutation(Api.tasks.updateMilestoneAndOrderingMutationOptions());
}

export function useDeleteTask(refetchType: RefetchType = "none") {
  return useTaskMutation(Api.tasks.deleteMutationOptions(), refetchType);
}

export function useMoveTask() {
  return useTaskMutation(Api.tasks.moveMutationOptions(), "none");
}

export function useTaskMoveBoards() {
  const queryClient = useQueryClient();

  return useCallback(
    async (spaceId: string) => {
      const result = await queryClient.fetchQuery({
        ...Api.tasks.listBoardsQueryOptions({ spaceId, archiveStatus: "active" }),
        staleTime: 0,
        retry: false,
      });
      return result.boards;
    },
    [queryClient],
  );
}

type MoveError = {
  details?: {
    code?: string;
    task_statuses?: Pick<TaskStatus, "id" | "label">[];
  };
};

export function taskMoveErrorResult(error: unknown): TaskPage.MoveTaskResult {
  if (!axios.isAxiosError<MoveError>(error)) return false;

  const details = error.response?.data?.details;
  if (details?.code === "task_board_status_mapping_required" && Array.isArray(details.task_statuses)) {
    return { status: "status_mapping_required", statuses: details.task_statuses };
  }
  if (details?.code === "task_board_archived") return { status: "board_unavailable" };

  return false;
}

function useTaskMutation<TData, TError, TVariables, TContext>(
  mutationOptions: UseMutationOptions<TData, TError, TVariables, TContext>,
  refetchType: RefetchType = "active",
) {
  const queryClient = useQueryClient();

  return useMutation({
    ...mutationOptions,
    onSuccess: () => {
      void invalidateTaskLifecycleQueries(queryClient, refetchType);
    },
  });
}
