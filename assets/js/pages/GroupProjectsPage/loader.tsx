import * as Pages from "@/components/Pages";
import * as Spaces from "@/models/spaces";
import * as Companies from "@/models/companies";
import * as Projects from "@/models/projects";

interface LoadedData {
  company: Companies.Company;
  space: Spaces.Space;
  projects: Projects.Project[];
}

export async function loader({ params }): Promise<LoadedData> {
  return {
    company: await Companies.getCompany(),
    space: await Spaces.getSpace({ id: params.id }),
    projects: await Projects.getProjects({
      spaceId: params.id,
      includeContributors: true,
      includeMilestones: true,
      includeLastCheckIn: true,
    }).then((data) => data.projects!),
  };
}

export function useLoadedData(): LoadedData {
  return Pages.useLoadedData() as LoadedData;
}
