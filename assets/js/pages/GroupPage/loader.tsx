import * as Pages from "@/components/Pages";
import * as Groups from "@/models/groups";
import * as Companies from "@/models/companies";

import { Company, Group } from "@/gql/generated";

interface LoadedData {
  company: Company;
  group: Group;
  loadedAt: Date;
}

export async function loader({ params }): Promise<LoadedData> {
  return {
    company: await Companies.getCompany(),
    group: await Groups.getGroup(params.id, {
      includeMembers: true,
    }),
    loadedAt: new Date(),
  };
}

export function useLoadedData(): LoadedData {
  return Pages.useLoadedData() as LoadedData;
}

export function useRefresh() {
  return Pages.useRefresh();
}
