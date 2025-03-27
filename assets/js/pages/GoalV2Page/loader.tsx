import * as Pages from "@/components/Pages";
import * as Goals from "@/models/goals";
import * as Projects from "@/models/projects";
import * as Activities from "@/models/activities";
import { Person } from "@/models/people";

interface LoaderResult {
  goal: Goals.Goal;
  activities: Activities.Activity[];
  contributors: Person[];
  goals: Goals.Goal[];
  projects: Projects.Project[];
}

export async function loader({ params }): Promise<LoaderResult> {
  const [goal, activities, contributors, goals, projects] = await Promise.all([
    Goals.getGoal({
      id: params.id,
      includeSpace: true,
      includeChampion: true,
      includeReviewer: true,
      includeTargets: true,
      includePermissions: true,
      includeUnreadNotifications: true,
      includeLastCheckIn: true,
      includeAccessLevels: true,
      includePrivacy: true,
    }).then((data) => data.goal!),
    Activities.getActivities({
      scopeType: "goal",
      scopeId: params.id,
      actions: Goals.GOAL_ACTIVITIES,
    }),
    Goals.listGoalContributors({ goalId: params.id }).then((res) => res.contributors ?? []),
    Goals.getGoals({
      includeSpace: true,
      includeLastCheckIn: true,
      includeChampion: true,
      includeReviewer: true,
    }).then((data) => data.goals ?? []),
    Projects.getProjects({
      includeGoal: true,
      includeSpace: true,
      includeLastCheckIn: true,
      includeMilestones: true,
      includeContributors: true,
    }).then((data) => data.projects ?? []),
  ]);

  return { goal, activities, contributors, goals, projects };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}

export function useRefresh() {
  return Pages.useRefresh();
}
