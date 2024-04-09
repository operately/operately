import * as Pages from "@/components/Pages";
import * as Groups from "@/models/groups";
import * as Goals from "@/models/goals";
import * as Projects from "@/models/projects";
import * as Companies from "@/models/companies";

import { Company, Group } from "@/gql/generated";

interface LoadedData {
  company: Company;
  group: Group;
  goals: Goals.Goal[];
  projects: Projects.Project[];
}

export async function loader({ params }): Promise<LoadedData> {
  return {
    company: await Companies.getCompany(),
    group: await Groups.getGroup(params.id),

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
    }),
  };
}

export function useLoadedData(): LoadedData {
  return Pages.useLoadedData() as LoadedData;
}
