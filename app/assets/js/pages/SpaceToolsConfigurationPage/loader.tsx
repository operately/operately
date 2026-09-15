import Api from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";

export async function loader({ params }) {
  const spaceQueryInput = { id: params.id };
  const toolsQueryInput = { spaceId: params.id };

  await Promise.all([Api.spaces.getQuery(spaceQueryInput), Api.spaces.listToolsQuery(toolsQueryInput)]);

  return { spaceQueryInput, toolsQueryInput };
}

type LoaderResult = Awaited<ReturnType<typeof loader>>;

export function useLoadedData() {
  const { spaceQueryInput, toolsQueryInput } = Pages.useLoadedData<LoaderResult>();
  const { data: spaceData } = useLoadedQuery(Api.spaces.getQueryOptions(spaceQueryInput));
  const { data: toolsData } = useLoadedQuery(Api.spaces.listToolsQueryOptions(toolsQueryInput));

  if (!spaceData?.space) {
    throw new Error(`Space data is unavailable for space "${spaceQueryInput.id}"`);
  }

  if (!toolsData?.tools) {
    throw new Error(`Tool settings are unavailable for space "${toolsQueryInput.spaceId}"`);
  }

  return { spaceId: spaceQueryInput.id, space: spaceData.space, tools: toolsData.tools };
}
