import Api from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";

export async function loader({ params }) {
  const spaceInput = {
    id: params.id,
    includeMembers: true,
    includeAccessLevels: true,
    includeUnreadNotifications: true,
    includePermissions: true,
  };
  const toolsInput = { spaceId: params.id };

  await Promise.all([Api.spaces.getQuery(spaceInput), Api.spaces.listToolsQuery(toolsInput)]);

  return { spaceInput, toolsInput };
}

export function useLoadedData() {
  const { spaceInput, toolsInput } = Pages.useLoadedData<Awaited<ReturnType<typeof loader>>>();
  const { data: spaceData } = useLoadedQuery(Api.spaces.getQueryOptions(spaceInput));
  const { data: toolsData } = useLoadedQuery(Api.spaces.listToolsQueryOptions(toolsInput));
  const space = spaceData?.space;

  if (!space?.id) throw new Error(`Space data is unavailable for space "${spaceInput.id}"`);
  if (!toolsData?.tools) throw new Error(`Space tools are unavailable for space "${spaceInput.id}"`);
  if (!space.members) throw new Error("Space members are unavailable");
  if (!space.permissions) throw new Error("Space permissions are unavailable");

  return { space: { ...space, members: space.members, permissions: space.permissions }, tools: toolsData.tools };
}
