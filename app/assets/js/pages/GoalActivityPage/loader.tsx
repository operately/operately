import * as Pages from "@/components/Pages";
import * as Activities from "@/models/activities";
import * as Goals from "@/models/goals";
import { isSubscribedToResource } from "@/models/subscriptions";

interface LoaderResult {
  activity: Activities.Activity;
  goal: Goals.Goal;
  isCurrentUserSubscribed: boolean;
}

export async function loader({ params }): Promise<LoaderResult> {
  const activity = await Activities.getActivity({
    id: params.id,
    includeUnreadGoalNotifications: true,
    includePermissions: true,
    includeSubscriptionsList: true,
    includePotentialSubscribers: true,
  });
  const goal = Activities.getGoal(activity);

  const commentThreadId = activity.commentThread?.id;
  const isCurrentUserSubscribed = commentThreadId
    ? (await isSubscribedToResource({ resourceId: commentThreadId, resourceType: "comment_thread" })).subscribed
    : false;

  try {
    return {
      activity,
      goal: await Goals.getGoal({ id: goal.id, includeSpace: true, includePermissions: true }).then((d) => d.goal!),
      isCurrentUserSubscribed,
    };
  } catch (e) {
    return { activity, goal, isCurrentUserSubscribed };
  }
}

export function useLoaderData() {
  return Pages.useLoadedData<LoaderResult>();
}
