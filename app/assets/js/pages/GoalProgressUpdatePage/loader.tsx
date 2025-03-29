import * as Pages from "@/components/Pages";
import * as GoalCheckIns from "@/models/goalCheckIns";

import { Paths } from "@/routes/paths";
import { redirectIfFeatureEnabled } from "@/routes/redirectIfFeatureEnabled";

interface LoaderResult {
  update: GoalCheckIns.Update;
}

export async function loader({ params }): Promise<LoaderResult> {
  await redirectIfFeatureEnabled(params, {
    feature: "new_goal_check_ins",
    path: Paths.goalCheckInPath(params.id),
  });

  const updatePromise = GoalCheckIns.getGoalProgressUpdate({
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

  return {
    update: await updatePromise,
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}

export function useRefresh() {
  return Pages.useRefresh();
}
