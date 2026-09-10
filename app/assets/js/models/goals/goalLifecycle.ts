import Api, { type CompaniesGetActivityResult } from "@/api";
import { compareIds } from "@/routes/paths";
import {
  invalidateGoalPageQueries,
  invalidateGoalActivityQueries,
  invalidateGoalResourceQueries,
} from "./goalPageQueries";
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

type GoalInteractionContext = {
  goalId: string;
  resourceId: string;
  resourceType: "goal_update" | "goal_discussion";
  activityId?: string;
};

export async function invalidateGoalInteractionQueries(
  client: QueryClient,
  context: GoalInteractionContext,
  refetchType: "active" | "none" = "active",
) {
  const { resourceId, resourceType, activityId, goalId } = context;
  const commentsPrefix = Api.comments.listQueryKeyPrefix();
  const subscriptionPrefix = Api.notifications.isSubscribedQueryKeyPrefix();

  await Promise.all([
    client.invalidateQueries({
      queryKey: commentsPrefix,
      refetchType,
      predicate: (query) => {
        const input = query.queryKey[commentsPrefix.length] as { entityId?: string; entityType?: string } | undefined;
        return input?.entityType === resourceType && compareIds(input.entityId, resourceId);
      },
    }),
    client.invalidateQueries({
      queryKey: subscriptionPrefix,
      refetchType,
      predicate: (query) => {
        const input = query.queryKey[subscriptionPrefix.length] as
          | { resourceId?: string; resourceType?: string }
          | undefined;
        return (
          input?.resourceType === (resourceType === "goal_update" ? "goal_update" : "comment_thread") &&
          compareIds(input.resourceId, resourceId)
        );
      },
    }),
    resourceType === "goal_update"
      ? invalidateGoalCheckInActivities(client, resourceId, refetchType)
      : Promise.resolve(),
    resourceType === "goal_update"
      ? invalidateGoalResourceQueries(client, Api.goals.getCheckInQueryKeyPrefix(), "id", resourceId, refetchType)
      : activityId
        ? invalidateGoalActivityQueries(client, activityId, refetchType)
        : Promise.resolve(),
    invalidateGoalResourceQueries(
      client,
      resourceType === "goal_update"
        ? Api.goals.listCheckInsQueryKeyPrefix()
        : Api.goals.listDiscussionsQueryKeyPrefix(),
      "goalId",
      goalId,
      refetchType,
    ),
    client.invalidateQueries({ queryKey: Api.companies.listActivitiesQueryKeyPrefix(), refetchType }),
  ]);
}

export async function invalidateGoalCheckInActivities(
  client: QueryClient,
  checkInId: string,
  refetchType: "active" | "none" = "active",
) {
  const activityIds = new Set<string>();
  for (const query of client.getQueryCache().findAll({ queryKey: Api.companies.getActivityQueryKeyPrefix() })) {
    const activity = (query.state.data as CompaniesGetActivityResult | undefined)?.activity;
    const content = activity?.content;
    if (!activity?.id || !content) continue;
    const relatedId = "update" in content ? content.update?.id : "checkInId" in content ? content.checkInId : undefined;
    if (compareIds(relatedId, checkInId)) activityIds.add(activity.id);
  }
  await Promise.all([...activityIds].map((id) => invalidateGoalActivityQueries(client, id, refetchType)));
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
