import * as Goals from "@/models/goals";
import * as Pages from "@/components/Pages";

interface LoaderResult {
  goal: Goals.Goal;
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    goal: await Goals.getGoal({
      id: params.id,
      includeSpace: true,
      includeTargets: true,
      includeProjects: true,
      includeLastCheckIn: true,
      includePermissions: true,
      includeUnreadNotifications: true,
    }).then((data) => data.goal!),
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}

