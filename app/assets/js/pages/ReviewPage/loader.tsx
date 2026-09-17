import Api from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";

export async function loader() {
  const queryInput = {};
  await Api.people.listAssignmentsQuery(queryInput);

  return { queryInput };
}

type LoaderResult = Awaited<ReturnType<typeof loader>>;

export function useLoadedData() {
  const { queryInput } = Pages.useLoadedData<LoaderResult>();
  const { data } = useLoadedQuery(Api.people.listAssignmentsQueryOptions(queryInput));

  if (!data) throw new Error("ReviewPage data is unavailable");

  return data;
}
