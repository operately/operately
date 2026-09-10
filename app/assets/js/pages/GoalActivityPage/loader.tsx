import { invalidateGoalInteractionQueries } from "@/models/goals/goalLifecycle";
import Api, { Activity, Goal } from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";
import * as Activities from "@/models/activities";
import { useQueryClient } from "@tanstack/react-query";

const DISABLED_GOAL_INPUT = { id: "", includeSpace: true, includePermissions: true };
const DISABLED_SUBSCRIPTION_INPUT = { resourceId: "", resourceType: "comment_thread" as const };

export async function loader({ params }) {
  const activityInput = {
    id: params.id,
    includeUnreadGoalNotifications: true,
    includePermissions: true,
    includeSubscriptionsList: true,
    includePotentialSubscribers: true,
  };

  const { activity } = await Api.companies.getActivityQuery(activityInput);

  if (!activity) throw new Error(`Activity data is unavailable for activity "${params.id}"`);
  const embeddedGoal = Activities.getGoal(activity);

  if (!embeddedGoal?.id) throw new Error(`Goal data is unavailable for activity "${params.id}"`);

  const goalInput = embeddedGoal.id
    ? {
        id: embeddedGoal.id,
        includeSpace: true,
        includePermissions: true,
        includeChampion: true,
        includeReviewer: true,
      }
    : null;

  const commentThreadId = activity.commentThread?.id;
  const subscriptionInput = commentThreadId
    ? { resourceId: commentThreadId, resourceType: "comment_thread" as const }
    : null;

  const [resolvedGoalInput] = await Promise.all([
    goalInput
      ? Api.goals
          .getQuery(goalInput)
          .then(() => goalInput)
          .catch(() => null)
      : Promise.resolve(null),
    subscriptionInput ? Api.notifications.isSubscribedQuery(subscriptionInput) : Promise.resolve(),
  ]);

  return { activityInput, goalInput: resolvedGoalInput, subscriptionInput };
}

type LoaderResult = Awaited<ReturnType<typeof loader>>;

export function useLoadedData(): { activity: Activity; goal: Goal; isCurrentUserSubscribed: boolean } {
  const { activityInput, goalInput, subscriptionInput } = Pages.useLoadedData<LoaderResult>();
  const { data: activityData } = useLoadedQuery(Api.companies.getActivityQueryOptions(activityInput));
  const { data: goalData } = useLoadedQuery({
    ...Api.goals.getQueryOptions(goalInput ?? DISABLED_GOAL_INPUT),
    enabled: goalInput != null,
  });
  const { data: subscription } = useLoadedQuery({
    ...Api.notifications.isSubscribedQueryOptions(subscriptionInput ?? DISABLED_SUBSCRIPTION_INPUT),
    enabled: subscriptionInput != null,
  });

  if (!activityData?.activity) {
    throw new Error(`Activity data is unavailable for activity "${activityInput.id}"`);
  }

  const goal = goalData?.goal ?? Activities.getGoal(activityData.activity);
  if (!goal?.id) throw new Error(`Goal data is unavailable for activity "${activityInput.id}"`);

  return {
    activity: activityData.activity,
    goal,
    isCurrentUserSubscribed: subscription?.subscribed ?? false,
  };
}

export function useRefresh() {
  const client = useQueryClient();
  const { activity, goal } = useLoadedData();

  return () =>
    activity.commentThread?.id
      ? invalidateGoalInteractionQueries(client, {
          goalId: goal.id,
          resourceId: activity.commentThread.id,
          resourceType: "goal_discussion",
          activityId: activity.id,
        })
      : Promise.resolve();
}
