import * as Pages from "@/components/Pages";
import * as Goals from "@/models/goals";

interface LoaderResult {
  goal: Goals.Goal;
  goals: Goals.Goal[];
}

export async function loader({ params }): Promise<LoaderResult> {
  const goalPromise = Goals.getGoal({ id: params.goalId, includeParentGoal: true });
  const goalsPromise = Goals.getGoals({
    includeTargets: true,
    includeSpace: true,
    includeLastCheckIn: true,
    includeChampion: true,
    includeReviewer: true,
  }).then((data) => data.goals!);

  return {
    goal: await goalPromise,
    goals: await goalsPromise,
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}

export function useRefresh() {
  return Pages.useRefresh();
}
