import * as Pages from "@/components/Pages";
import * as Projects from "@/models/projects";
import * as Companies from "@/models/companies";

interface LoaderResult {
  company: Companies.Company;
  project: Projects.Project;
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    company: await Companies.getCompany(),
    project: await Projects.getProject(params.id, {
      includeSpace: true,
      includeGoal: true,
      includePermissions: true,
      includeContributors: true,
      includeKeyResources: true,
      includeMilestones: true,
      includeLastCheckIn: true,
    }),
  };
}

export function useLoadedData() {
  return Pages.useLoadedData() as LoaderResult;
}
