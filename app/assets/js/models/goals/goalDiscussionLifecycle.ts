import Api from "@/api";
import { QueryClient, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  invalidateGoalActivityQueries,
  invalidateGoalPageQueries,
  invalidateGoalResourceQueries,
} from "./goalPageQueries";

export async function invalidateGoalDiscussionQueries(client: QueryClient, goalId: string, activityId: string) {
  await Promise.all([
    invalidateGoalPageQueries(client, goalId),
    invalidateGoalResourceQueries(client, Api.goals.listDiscussionsQueryKeyPrefix(), "goalId", goalId),
    invalidateGoalActivityQueries(client, activityId),
    client.invalidateQueries({ queryKey: Api.companies.listActivitiesQueryKeyPrefix() }),
  ]);
}

export function useCreateGoalDiscussion() {
  const client = useQueryClient();
  return useMutation({
    ...Api.goals.createDiscussionMutationOptions(),
    onSuccess: ({ activityId }, { goalId }) => invalidateGoalDiscussionQueries(client, goalId, activityId),
  });
}

export function useEditGoalDiscussion(goalId: string) {
  const client = useQueryClient();
  return useMutation({
    ...Api.goals.updateDiscussionMutationOptions(),
    onMutate: () => ({ goalId }),
    onSuccess: (_result, { activityId }, context: { goalId: string }) =>
      invalidateGoalDiscussionQueries(client, context.goalId, activityId),
  });
}
