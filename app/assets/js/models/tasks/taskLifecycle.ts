import Api from "@/api";
import { QueryClient, type UseMutationOptions, useMutation, useQueryClient } from "@tanstack/react-query";

type RefetchType = "active" | "none";

export async function invalidateTaskLifecycleQueries(
  queryClient: QueryClient,
  refetchType: RefetchType = "active",
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: Api.tasks.getQueryKeyPrefix(), refetchType }),
    queryClient.invalidateQueries({ queryKey: Api.comments.listQueryKeyPrefix(), refetchType }),
    queryClient.invalidateQueries({ queryKey: Api.companies.listActivitiesQueryKeyPrefix(), refetchType }),
    queryClient.invalidateQueries({ queryKey: Api.projects.countChildrenQueryKeyPrefix(), refetchType }),
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

export function useDeleteTask(refetchType: RefetchType = "none") {
  return useTaskMutation(Api.tasks.deleteMutationOptions(), refetchType);
}

export function useMoveTask() {
  return useTaskMutation(Api.tasks.moveMutationOptions(), "none");
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
