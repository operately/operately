import * as Pages from "@/components/Pages";
import * as GoalCheckIns from "@/models/goalCheckIns";
import * as Goals from "@/models/goals";
import { isSubscribedToResource } from "@/models/subscriptions";

interface LoaderResult {
  goal: Goals.Goal;
  update: GoalCheckIns.Update;
  isCurrentUserSubscribed: boolean;
}

export async function loader({ params }): Promise<LoaderResult> {
  const [update, subscriptionStatus] = await Promise.all([
    GoalCheckIns.getGoalProgressUpdate({
      id: params.id,
      includeGoalTargets: true,
      includeAcknowledgedBy: true,
      includeReactions: true,
      includeAuthor: true,
      includeSubscriptionsList: true,
      includePotentialSubscribers: true,
      includeUnreadNotifications: true,
      includePermissions: true,
    }).then((data) => data.update),
    isSubscribedToResource({
      resourceId: params.id,
      resourceType: "goal_update",
    }),
  ]);

  return {
    goal: update.goal!,
    update: update,
    isCurrentUserSubscribed: subscriptionStatus.subscribed,
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}

export function useRefresh() {
  return Pages.useRefresh();
}
