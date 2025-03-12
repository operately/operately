import * as Pages from "@/components/Pages";
import * as Goals from "@/models/goals";
import * as Activities from "@/models/activities";
import { Person } from "@/models/people";

interface LoaderResult {
  goal: Goals.Goal;
  activities: Activities.Activity[];
  contributors: Person[];
}

export async function loader({ params }): Promise<LoaderResult> {
  const [goal, activities, contributors] = await Promise.all([
    Goals.getGoal({
      id: params.id,
      includeChampion: true,
      includeReviewer: true,
      includeTargets: true,
      includePermissions: true,
      includeUnreadNotifications: true,
    }).then((data) => data.goal!),
    Activities.getActivities({
      scopeType: "goal",
      scopeId: params.id,
      actions: Goals.GOAL_ACTIVITIES,
    }),
    Goals.listGoalContributors({ goalId: params.id }).then((res) => res.contributors!),
  ]);

  return { goal, activities, contributors };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
