import * as Pages from "@/components/Pages";
import * as Goals from "@/models/goals";
import * as Projects from "@/models/projects";

interface LoaderResult {
  goal: Goals.Goal;

  goals: Goals.Goal[];
  projects: Projects.Project[];
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    goal: await Goals.getGoal({
      id: params.id,
      includeTargets: true,
      includeProjects: true,
      includeLastCheckIn: true,
      includeParentGoal: true,
    }),

    goals: await Goals.getGoals({
      includeTargets: true,
      includeSpace: true,
      includeLastCheckIn: true,
    }),

    projects: await Projects.getProjects({
      includeGoal: true,
      includeSpace: true,
      includeLastCheckIn: true,
      includeChampion: true,
      includeMilestones: true,
    }).then((data) => data.projects!),
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
