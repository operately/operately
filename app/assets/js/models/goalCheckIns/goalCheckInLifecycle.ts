import Api from "@/api";
import { QueryClient, useMutation, useQueryClient } from "@tanstack/react-query";
import { invalidateGoalLifecycleQueries, invalidateGoalCheckInActivities } from "@/models/goals/goalLifecycle";
import { invalidateGoalResourceQueries } from "@/models/goals/goalPageQueries";

export async function invalidateGoalCheckInQueries(client: QueryClient, goalId: string, checkInId?: string) {
  await Promise.all([
    invalidateGoalLifecycleQueries(client, goalId),
    invalidateGoalResourceQueries(client, Api.goals.listCheckInsQueryKeyPrefix(), "goalId", goalId),
    ...(checkInId
      ? [
          invalidateGoalResourceQueries(client, Api.goals.getCheckInQueryKeyPrefix(), "id", checkInId),
          invalidateGoalCheckInActivities(client, checkInId),
        ]
      : []),
  ]);
}

export function usePostGoalProgressUpdate() {
  const client = useQueryClient();
  return useMutation({
    ...Api.goals.createCheckInMutationOptions(),
    onSuccess: ({ update }, { goalId }) => invalidateGoalCheckInQueries(client, goalId, update?.id),
  });
}

export function useEditGoalProgressUpdate(goalId: string) {
  const client = useQueryClient();
  return useMutation({
    ...Api.goals.updateCheckInMutationOptions(),
    onMutate: () => ({ goalId }),
    onSuccess: (_result, { id }, context: { goalId: string }) =>
      invalidateGoalCheckInQueries(client, context.goalId, id),
  });
}

export function useDeleteGoalProgressUpdate(goalId: string) {
  const client = useQueryClient();
  return useMutation({
    ...Api.goals.deleteCheckInMutationOptions(),
    onMutate: () => ({ goalId }),
    onSuccess: (_result, { id }, context: { goalId: string }) =>
      invalidateGoalCheckInQueries(client, context.goalId, id),
  });
}

export function useAcknowledgeGoalProgressUpdate(goalId: string) {
  const client = useQueryClient();
  return useMutation({
    ...Api.goals.acknowledgeCheckInMutationOptions(),
    onMutate: () => ({ goalId }),
    onSuccess: (_result, { id }, context: { goalId: string }) =>
      invalidateGoalCheckInQueries(client, context.goalId, id),
  });
}
