import Api from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";

export async function loader({ params }) {
  const queryInput = { id: params.id, includePotentialSubscribers: true };
  await Api.spaces.getQuery(queryInput);

  return { queryInput };
}

export function useLoadedData() {
  const { queryInput } = Pages.useLoadedData<Awaited<ReturnType<typeof loader>>>();
  const { data } = useLoadedQuery(Api.spaces.getQueryOptions(queryInput));

  if (!data?.space?.id) throw new Error(`Space data is unavailable for space "${queryInput.id}"`);

  return { space: data.space };
}
