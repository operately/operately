import * as Pages from "@/components/Pages";
import * as Spaces from "@/models/spaces";
import * as Companies from "@/models/companies";

import { Company } from "@/gql/generated";

interface LoadedData {
  company: Company;
  space: Spaces.Space;
  loadedAt: Date;
}

export async function loader({ params }): Promise<LoadedData> {
  return {
    company: await Companies.getCompany(),
    space: await Spaces.getSpace({ id: params.id, includeMembers: true }),
    loadedAt: new Date(),
  };
}

export function useLoadedData(): LoadedData {
  return Pages.useLoadedData() as LoadedData;
}

export function useRefresh() {
  return Pages.useRefresh();
}
