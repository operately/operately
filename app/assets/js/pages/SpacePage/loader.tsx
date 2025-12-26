import * as Pages from "@/components/Pages";
import * as Spaces from "@/models/spaces";

interface LoadedData {
  space: Spaces.Space;
  tools: Spaces.SpaceTools;
  loadedAt: Date;
}

export async function loader({ params }): Promise<LoadedData> {
  const [space, tools] = await Promise.all([
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
