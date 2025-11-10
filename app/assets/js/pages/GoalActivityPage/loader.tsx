import * as Pages from "@/components/Pages";
import * as Activities from "@/models/activities";
import * as Goals from "@/models/goals";

interface LoaderResult {
  activity: Activities.Activity;
  goal: Goals.Goal;
}

export async function loader({ params }): Promise<LoaderResult> {
  const activity = await Activities.getActivity({
    id: params.id,
    includeUnreadGoalNotifications: true,
    includePermissions: true,
    includeSubscriptionsList: true,
    includePotentialSubscribers: true,
  });
  let goal = Activities.getGoal(activity);

  try {
    return {
      activity,
      goal: await Goals.getGoal({ id: goal.id, includeSpace: true }).then((d) => d.goal!),
    };
  } catch (e) {
    return { activity, goal };
  }
}

export function useLoaderData() {
  return Pages.useLoadedData<LoaderResult>();
}
