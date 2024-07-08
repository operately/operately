import * as Pages from "@/components/Pages";
import * as Spaces from "@/models/spaces";
import * as Companies from "@/models/companies";

interface LoadedData {
  company: Companies.Company;
  space: Spaces.Space;
  loadedAt: Date;
}

export async function loader({ params }): Promise<LoadedData> {
  const companyPromise = Companies.getCompany({ id: params.companyId }).then((d) => d.company!);
  const spacePromise = Spaces.getSpace({ id: params.id, includeMembers: true });

  return {
    company: await companyPromise,
    space: await spacePromise,
    loadedAt: new Date(),
  };
}

export function useLoadedData(): LoadedData {
  return Pages.useLoadedData() as LoadedData;
}

export function useRefresh() {
  return Pages.useRefresh();
}
