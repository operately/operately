import Api from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateGoalInteractionQueries } from "@/models/goals/goalLifecycle";

export async function loader({ params }) {
  const queryInput = {
    id: params.id,
    includeGoal: true,
    includeChampion: true,
    includeReviewer: true,
    includeGoalTargets: true,
    includeAcknowledgedBy: true,
    includeReactions: true,
    includeAuthor: true,
    includeSubscriptionsList: true,
    includePotentialSubscribers: true,
    includeUnreadNotifications: true,
    includePermissions: true,
  };
  const subscriptionInput = { resourceId: params.id, resourceType: "goal_update" as const };

  await Promise.all([Api.goals.getCheckInQuery(queryInput), Api.notifications.isSubscribedQuery(subscriptionInput)]);

  return { queryInput, subscriptionInput };
}

export function useLoadedData() {
  const { queryInput, subscriptionInput } = Pages.useLoadedData<Awaited<ReturnType<typeof loader>>>();
  const { data } = useLoadedQuery(Api.goals.getCheckInQueryOptions(queryInput));
  const { data: subscription } = useLoadedQuery(Api.notifications.isSubscribedQueryOptions(subscriptionInput));

  if (!data?.update?.goal) throw new Error(`Check-in data is unavailable for check-in "${queryInput.id}"`);

  return { goal: data.update.goal, update: data.update, isCurrentUserSubscribed: subscription?.subscribed ?? false };
}

export function useRefresh() {
  const client = useQueryClient();
  const { update, goal } = useLoadedData();

  return () =>
    invalidateGoalInteractionQueries(client, { goalId: goal.id, resourceId: update.id, resourceType: "goal_update" });
}
