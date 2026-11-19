import Api from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";

export async function loader({ params }) {
  const spaceQueryInput = { id: params.id, includePermissions: true };
  const toolsQueryInput = { spaceId: params.id };

  const boardsQueryInput = { spaceId: params.id, archiveStatus: "all" as const };
  const hubsQueryInput = { spaceId: params.id };

  await Promise.all([
    Api.spaces.getQuery(spaceQueryInput),
    Api.spaces.listToolsQuery(toolsQueryInput),
    Api.tasks.listBoardsQuery(boardsQueryInput),
    Api.resource_hubs.listQuery(hubsQueryInput),
  ]);

  return { spaceQueryInput, toolsQueryInput, boardsQueryInput, hubsQueryInput };
}

type LoaderResult = Awaited<ReturnType<typeof loader>>;

export function useLoadedData() {
  const { spaceQueryInput, toolsQueryInput, boardsQueryInput, hubsQueryInput } = Pages.useLoadedData<LoaderResult>();
  const { data: spaceData } = useLoadedQuery(Api.spaces.getQueryOptions(spaceQueryInput));
  const { data: toolsData } = useLoadedQuery(Api.spaces.listToolsQueryOptions(toolsQueryInput));

  const { data: boardsData } = useLoadedQuery(Api.tasks.listBoardsQueryOptions(boardsQueryInput));
  const { data: hubsData } = useLoadedQuery(Api.resource_hubs.listQueryOptions(hubsQueryInput));

  if (!spaceData?.space) {
    throw new Error(`Space data is unavailable for space "${spaceQueryInput.id}"`);
  }

  if (!toolsData?.tools) {
    throw new Error(`Tool settings are unavailable for space "${toolsQueryInput.spaceId}"`);
  }

  return {
    spaceId: spaceQueryInput.id,
    space: spaceData.space,
    tools: toolsData.tools,
    boards: boardsData?.boards ?? [],
    hubs: hubsData?.hubs ?? [],
  };
}
