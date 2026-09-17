import Api from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";

export async function loader() {
  const queryInput = {};
  await Api.spaces.listQuery(queryInput);
  return { queryInput };
}

type LoaderResult = Awaited<ReturnType<typeof loader>>;

export function useLoadedData() {
  const { queryInput } = Pages.useLoadedData<LoaderResult>();
  const { data } = useLoadedQuery(Api.spaces.listQueryOptions(queryInput));

  if (!data) throw new Error("SearchPage data is unavailable");

  return {
    spaces: (data.spaces ?? []).flatMap((space) =>
      space.id && space.name ? [{ id: space.id, name: space.name }] : [],
    ),
  };
}
