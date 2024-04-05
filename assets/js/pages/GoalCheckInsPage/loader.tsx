import * as Pages from "@/components/Pages";
import * as Goals from "@/models/goals";
import * as GoalCheckIns from "@/models/goalCheckIns";

interface LoaderResult {
  goal: Goals.Goal;
  updates: GoalCheckIns.GoalCheckIn[];
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    goal: await Goals.getGoal({
      id: params.goalId,
      includeTargets: true,
    }),
    updates: await GoalCheckIns.getCheckIns(params.goalId),
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
