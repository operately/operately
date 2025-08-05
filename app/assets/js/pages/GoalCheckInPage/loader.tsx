import * as Pages from "@/components/Pages";
import * as GoalCheckIns from "@/models/goalCheckIns";
import * as Goals from "@/models/goals";

import { assertPresent } from "@/utils/assertions";

interface LoaderResult {
  goal: Goals.Goal;
  update: GoalCheckIns.Update;
}

export async function loader({ params }): Promise<LoaderResult> {
  const update = await GoalCheckIns.getGoalProgressUpdate({
    id: params.id,
    includeGoalTargets: true,
    includeAcknowledgedBy: true,
    includeReactions: true,
    includeAuthor: true,
    includeSubscriptionsList: true,
    includePotentialSubscribers: true,
    includeUnreadNotifications: true,
    includePermissions: true,
  }).then((data) => data.update!);

  assertPresent(update.goal, "Goal must be present in update");

  return {
    goal: update.goal!,
    update: update,
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}

export function useRefresh() {
  return Pages.useRefresh();
}
