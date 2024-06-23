import * as Pages from "@/components/Pages";
import * as People from "@/models/people";
import * as Goals from "@/models/goals";
import * as Projects from "@/models/projects";

interface LoaderResult {
  person: People.Person;
  goals: Goals.Goal[];
  projects: Projects.Project[];
}

export async function loader({ params }): Promise<LoaderResult> {
  const personPromise = People.getPerson({ id: params.id }).then((data) => data.person!);

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
    person: await personPromise,
    goals: await goalsPromise,
    projects: await projectsPromise,
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
