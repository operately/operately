import * as Pages from "@/components/Pages";
import * as Goals from "@/models/goals";
import * as GoalCheckIns from "@/models/goalCheckIns";

interface LoaderResult {
  goal: Goals.Goal;
  checkIn: GoalCheckIns.GoalCheckIn;
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    goal: await Goals.getGoal({
      id: params.goalId,
      includeTargets: true,
    }),
    checkIn: await GoalCheckIns.getCheckIn(params.id, {}),
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}

export function useRefresh() {
  return Pages.useRefresh();
}
