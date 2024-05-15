import * as Pages from "@/components/Pages";
import * as Goals from "@/models/goals";
import * as GoalCheckIns from "@/models/goalCheckIns";
import * as People from "@/models/people";

interface LoaderResult {
  goal: Goals.Goal;
  update: GoalCheckIns.GoalCheckIn;
  me: People.Person;
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    goal: await Goals.getGoal({
      id: params.goalId,
      includeTargets: true,
    }),
    update: await GoalCheckIns.getCheckIn(params.id, {}),
    me: await People.getMe({}),
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}

export function useRefresh() {
  return Pages.useRefresh();
}
