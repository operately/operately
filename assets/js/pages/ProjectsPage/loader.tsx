import * as Pages from "@/components/Pages";
import * as Projects from "@/models/projects";
import * as Companies from "@/models/companies";

interface LoaderResult {
  company: Companies.Company;
  projects: Projects.Project[];
}

export async function loader(): Promise<LoaderResult> {
  return {
    company: await Companies.getCompany(),
    projects: await Projects.getProjects({
      includeSpace: true,
      includeContributors: true,
      includeMilestones: true,
    }),
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
