import * as Pages from "@/components/Pages";
import * as Goals from "@/models/goals";
import * as GoalCheckIns from "@/models/goalCheckIns";

interface LoaderResult {
  goal: Goals.Goal;
  update: GoalCheckIns.Update;
}

export async function loader({ params }): Promise<LoaderResult> {
  const goalPromise = Goals.getGoal({
    id: params.goalId,
    includeTargets: true,
    includePermissions: true,
  }).then((data) => data.goal!);
  const updatePromise = GoalCheckIns.getGoalProgressUpdate({ id: params.id }).then((data) => data.update!);

  return {
    goal: await goalPromise,
    update: await updatePromise,
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}

export function useRefresh() {
  return Pages.useRefresh();
}
