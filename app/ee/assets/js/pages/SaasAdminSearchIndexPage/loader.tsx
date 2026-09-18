import * as AdminApi from "@/ee/admin_api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";

export async function loader() {
  const queryInput = {};
  await AdminApi.getSearchIndexStatusQuery(queryInput);

  return { queryInput };
}

export function useLoadedData() {
  const { queryInput } = Pages.useLoadedData<Awaited<ReturnType<typeof loader>>>();
  const { data } = useLoadedQuery(AdminApi.getSearchIndexStatusQueryOptions(queryInput));

  return { sources: data?.sources ?? [] };
}
