import * as Pages from "@/components/Pages";
import * as Goals from "@/models/goals";
import * as Projects from "@/models/projects";
import * as Companies from "@/models/companies";

interface LoaderResult {
  company: Companies.Company;
  goals: Goals.Goal[];
  projects: Projects.Project[];
}

export async function loader(): Promise<LoaderResult> {
  return {
    company: await Companies.getCompany(),
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
