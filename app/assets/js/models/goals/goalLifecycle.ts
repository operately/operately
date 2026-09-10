import Api, { type CompaniesGetActivityResult } from "@/api";
import { compareIds } from "@/routes/paths";
import { invalidateGoalPageQueries } from "./goalPageQueries";
import { QueryClient, useMutation, useQueryClient } from "@tanstack/react-query";

export async function invalidateGoalRetrospectiveQueries(
  queryClient: QueryClient,
  goalId: string,
  activityId: string,
): Promise<void> {
  const activityPrefix = Api.companies.getActivityQueryKeyPrefix();

  await Promise.all([
    invalidateGoalPageQueries(queryClient, goalId),
    queryClient.invalidateQueries({
      queryKey: activityPrefix,
      predicate: (query) => {
        // The query key is an array of strings. The last element is the input object.
        const input = query.queryKey[activityPrefix.length] as { id?: string } | undefined;
        return compareIds(input?.id, activityId);
      },
    }),
  ]);
}

export async function invalidateGoalLifecycleQueries(
  queryClient: QueryClient,
  goalId: string | null | undefined,
  parentGoalId?: string | null,
): Promise<void> {
  await Promise.all([
    goalId ? invalidateGoalPageQueries(queryClient, goalId) : Promise.resolve(),
    parentGoalId ? invalidateGoalPageQueries(queryClient, parentGoalId) : Promise.resolve(),
    queryClient.invalidateQueries({ queryKey: Api.goals.listQueryKeyPrefix() }),
    queryClient.invalidateQueries({ queryKey: Api.companies.getWorkMapQueryKeyPrefix() }),
    queryClient.invalidateQueries({ queryKey: Api.companies.listActivitiesQueryKeyPrefix() }),
  ]);
}

export async function invalidateClosedGoalQueries(
  queryClient: QueryClient,
  goalId: string,
  parentGoalId?: string | null,
): Promise<void> {
  await Promise.all([
    invalidateGoalLifecycleQueries(queryClient, goalId, parentGoalId),
    queryClient.invalidateQueries({
      queryKey: Api.companies.getActivityQueryKeyPrefix(),
      predicate: (query) => {
        const result = query.state.data as CompaniesGetActivityResult | undefined;
        const content = result?.activity?.content;
        return !!content && "goal" in content && compareIds(content.goal?.id, goalId);
      },
    }),
  ]);
}

export function useAcknowledgeGoalRetrospective() {
  const queryClient = useQueryClient();

  return useMutation({
    ...Api.goals.acknowledgeRetrospectiveMutationOptions(),
    onSuccess: ({ activity }, { goalId }) => {
      void invalidateGoalRetrospectiveQueries(queryClient, goalId, activity.id);
    },
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    ...Api.goals.createMutationOptions(),
    onSuccess: ({ goal }, { parentGoalId }) => {
      void invalidateGoalLifecycleQueries(queryClient, goal?.id, parentGoalId);
    },
  });
}

export function useCloseGoal(parentGoalId?: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    ...Api.goals.closeMutationOptions(),
    onSuccess: (_result, { goalId }) => {
      void invalidateClosedGoalQueries(queryClient, goalId, parentGoalId);
    },
  });
}

export function useReopenGoal(parentGoalId?: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    ...Api.goals.reopenMutationOptions(),
    onSuccess: (_result, { id }) => {
      void invalidateClosedGoalQueries(queryClient, id, parentGoalId);
    },
  });
}
