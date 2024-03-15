import * as Pages from "@/components/Pages";
import * as Goals from "@/models/goals";

interface LoaderResult {
  goal: Goals.Goal;
  goals: Goals.Goal[];
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    goal: await Goals.getGoal(params.goalId, {
      includeParentGoal: true,
    }),
    goals: await Goals.getGoals(),
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}

export function useRefresh() {
  return Pages.useRefresh();
}
