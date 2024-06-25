import * as Pages from "@/components/Pages";
import * as Goals from "@/models/goals";
import * as Projects from "@/models/projects";

interface LoaderResult {
  goal: Goals.Goal;
  goals: Goals.Goal[];
  projects: Projects.Project[];
}

export async function loader({ params }): Promise<LoaderResult> {
  const goalPromise = Goals.getGoal({
    id: params.id,
    includeTargets: true,
    includeProjects: true,
    includeLastCheckIn: true,
    includeParentGoal: true,
  }).then((data) => data.goal!);

  const goalsPromise = Goals.getGoals({
    includeTargets: true,
    includeSpace: true,
    includeLastCheckIn: true,
    includeChampion: true,
    includeReviewer: true,
  }).then((data) => data.goals!);

  const projectsPromise = Projects.getProjects({
    includeGoal: true,
    includeSpace: true,
    includeLastCheckIn: true,
    includeChampion: true,
    includeMilestones: true,
  }).then((data) => data.projects!);

  return {
    goal: await goalPromise,
    goals: await goalsPromise,
    projects: await projectsPromise,
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
