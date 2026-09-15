import Api from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";

export async function loader({ params }) {
  const spaceInput = { id: params.id, includePermissions: true };
  const discussionsInput = { spaceId: params.id, includeAuthor: true, includeMyDrafts: true };
  await Promise.all([Api.spaces.getQuery(spaceInput), Api.spaces.listDiscussionsQuery(discussionsInput)]);

  return { spaceInput, discussionsInput };
}

export function useLoadedData() {
  const { spaceInput, discussionsInput } = Pages.useLoadedData<Awaited<ReturnType<typeof loader>>>();
  const { data: spaceData } = useLoadedQuery(Api.spaces.getQueryOptions(spaceInput));
  const { data: discussionsData } = useLoadedQuery(Api.spaces.listDiscussionsQueryOptions(discussionsInput));

  if (!spaceData?.space?.id) throw new Error(`Space data is unavailable for space "${spaceInput.id}"`);
  if (!discussionsData) throw new Error(`Discussion drafts are unavailable for space "${spaceInput.id}"`);

  return { space: spaceData.space, myDrafts: discussionsData.myDrafts ?? [] };
}
