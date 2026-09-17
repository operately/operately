import Api from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";

export async function loader() {
  const queryInput = { includeManager: true };
  await Api.people.listQuery(queryInput);

  return { queryInput };
}

export function useLoadedData() {
  const { queryInput } = Pages.useLoadedData<Awaited<ReturnType<typeof loader>>>();
  const { data } = useLoadedQuery(Api.people.listQueryOptions(queryInput));

  if (!data) throw new Error("Org chart data is unavailable");

  return { people: data.people ?? [] };
}
