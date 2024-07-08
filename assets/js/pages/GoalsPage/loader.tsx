import * as Pages from "@/components/Pages";
import * as Goals from "@/models/goals";
import * as Projects from "@/models/projects";
import * as Companies from "@/models/companies";

interface LoaderResult {
  company: Companies.Company;
  goals: Goals.Goal[];
  projects: Projects.Project[];
}

export async function loader({ params }): Promise<LoaderResult> {
  const companyPromise = Companies.getCompany({ id: params.companyId }).then((data) => data.company!);

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
    company: await companyPromise,
    goals: await goalsPromise,
    projects: await projectsPromise,
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
