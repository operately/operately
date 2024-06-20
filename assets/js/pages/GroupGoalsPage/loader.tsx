import * as Pages from "@/components/Pages";
import * as Spaces from "@/models/spaces";
import * as Goals from "@/models/goals";
import * as Projects from "@/models/projects";
import * as Companies from "@/models/companies";

import { Company } from "@/gql/generated";

interface LoadedData {
  company: Company;
  space: Spaces.Space;
  goals: Goals.Goal[];
  projects: Projects.Project[];
}

export async function loader({ params }): Promise<LoadedData> {
  return {
    company: await Companies.getCompany(),
    space: await Spaces.getSpace({ id: params.id }),

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

export function useLoadedData(): LoadedData {
  return Pages.useLoadedData() as LoadedData;
}
