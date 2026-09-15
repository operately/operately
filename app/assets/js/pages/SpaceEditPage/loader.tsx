import Api, { Space } from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";

export async function loader({ params }) {
  const queryInput = { id: params.id };

  await Api.spaces.getQuery(queryInput);

  return { queryInput };
}

type LoaderResult = Awaited<ReturnType<typeof loader>>;

export function useLoadedData(): { space: Space } {
  const { queryInput } = Pages.useLoadedData<LoaderResult>();
  const { data } = useLoadedQuery(Api.spaces.getQueryOptions(queryInput));

  if (!data?.space) {
    throw new Error(`Space data is unavailable for space "${queryInput.id}"`);
  }

  return { space: data.space };
}
