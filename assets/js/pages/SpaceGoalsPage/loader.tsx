import * as Pages from "@/components/Pages";
import * as Spaces from "@/models/spaces";
import * as Goals from "@/models/goals";
import * as Projects from "@/models/projects";

interface LoadedData {
  space: Spaces.Space;
  goals: Goals.Goal[];
  projects: Projects.Project[];
}

export async function loader({ params }): Promise<LoadedData> {
  const spacePromise = Spaces.getSpace({ id: params.id });

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
    space: await spacePromise,
    goals: await goalsPromise,
    projects: await projectsPromise,
  };
}

export function useLoadedData(): LoadedData {
  return Pages.useLoadedData() as LoadedData;
}
