import * as Pages from "@/components/Pages";
import * as Groups from "@/models/groups";
import * as Companies from "@/models/companies";
import * as Projects from "@/models/projects";

interface LoadedData {
  company: Companies.Company;
  group: Groups.Group;
  projects: Projects.Project[];
}

export async function loader({ params }): Promise<LoadedData> {
  return {
    company: await Companies.getCompany(),
    group: await Groups.getGroup(params.id),
    projects: await Projects.getProjects({
      filters: {
        spaceId: params.id,
      },
      includeContributors: true,
      includeMilestones: true,
      includeLastCheckIn: true,
    }),
  };
}

export function useLoadedData(): LoadedData {
  return Pages.useLoadedData() as LoadedData;
}
