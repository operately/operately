import Api, { type McpGrant } from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";

const EMPTY_GRANTS: McpGrant[] = [];

export async function loader() {
  const queryInput = {};
  await Api.mcp_grants.listQuery(queryInput);

  return { queryInput };
}

type LoaderResult = Awaited<ReturnType<typeof loader>>;

export function useLoadedData() {
  const { queryInput } = Pages.useLoadedData<LoaderResult>();
  const { data } = useLoadedQuery(Api.mcp_grants.listQueryOptions(queryInput));

  return { mcpGrants: data?.mcpGrants ?? EMPTY_GRANTS };
}
