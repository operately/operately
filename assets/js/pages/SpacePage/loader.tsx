import * as Pages from "@/components/Pages";
import * as Spaces from "@/models/spaces";
import * as Companies from "@/models/companies";

interface LoadedData {
  company: Companies.Company;
  space: Spaces.Space;
  tools: Spaces.SpaceTools;
  loadedAt: Date;
}

export async function loader({ params }): Promise<LoadedData> {
  const [company, space, tools] = await Promise.all([
    Companies.getCompany({ id: params.companyId }).then((d) => d.company!),
    Spaces.getSpace({
      id: params.id,
      includeMembers: true,
      includeAccessLevels: true,
      includeUnreadNotifications: true,
      includePermissions: true,
    }),
    Spaces.listSpaceTools({ spaceId: params.id }).then((data) => data.tools!),
  ]);

  return {
    company,
    space,
    tools,
    loadedAt: new Date(),
  };
}

export function useLoadedData(): LoadedData {
  return Pages.useLoadedData() as LoadedData;
}

export function useRefresh() {
  return Pages.useRefresh();
}
