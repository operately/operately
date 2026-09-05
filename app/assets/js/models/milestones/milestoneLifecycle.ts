import Api from "@/api";
import { QueryClient, type UseMutationOptions, useMutation, useQueryClient } from "@tanstack/react-query";

type RefetchType = "active" | "none";

export async function invalidateMilestoneLifecycleQueries(
  queryClient: QueryClient,
  refetchType: RefetchType = "active",
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: Api.projects.getMilestoneQueryKeyPrefix(), refetchType }),
    queryClient.invalidateQueries({ queryKey: Api.projects.listMilestoneTasksQueryKeyPrefix(), refetchType }),
    queryClient.invalidateQueries({ queryKey: Api.projects.countChildrenQueryKeyPrefix(), refetchType }),
    queryClient.invalidateQueries({ queryKey: Api.companies.listActivitiesQueryKeyPrefix(), refetchType }),
  ]);
}

export function useUpdateMilestoneTitle() {
  return useMilestoneMutation(Api.projects.updateMilestoneTitleMutationOptions());
}

export function useUpdateMilestoneDescription() {
  return useMilestoneMutation(Api.projects.updateMilestoneDescriptionMutationOptions());
}

export function useUpdateMilestoneDueDate() {
  return useMilestoneMutation(Api.projects.updateMilestoneDueDateMutationOptions());
}

export function useCreateMilestoneComment() {
  return useMilestoneMutation(Api.projects.createMilestoneCommentMutationOptions());
}

export function useDeleteMilestone() {
  return useMilestoneMutation(Api.projects.deleteMilestoneMutationOptions(), "none");
}

function useMilestoneMutation<TData, TError, TVariables, TContext>(
  mutationOptions: UseMutationOptions<TData, TError, TVariables, TContext>,
  refetchType: RefetchType = "active",
) {
  const queryClient = useQueryClient();

  return useMutation({
    ...mutationOptions,
    onSuccess: () => {
      void invalidateMilestoneLifecycleQueries(queryClient, refetchType);
    },
  });
}
