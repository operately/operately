import Api from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";

export async function loader({ params }) {
  const queryInput = { id: params.id, includeSpace: true, includeAuthor: true };
  await Api.spaces.getDiscussionQuery(queryInput);
  return { queryInput };
}

export function useLoadedData() {
  const { queryInput } = Pages.useLoadedData<Awaited<ReturnType<typeof loader>>>();
  const { data } = useLoadedQuery(Api.spaces.getDiscussionQueryOptions(queryInput));
  const discussion = data?.discussion;
  if (!discussion?.id) throw new Error(`Discussion data is unavailable for discussion "${queryInput.id}"`);
  if (!discussion.space?.id) throw new Error("Discussion space is unavailable");
  return { discussion: { ...discussion, space: discussion.space } };
}
