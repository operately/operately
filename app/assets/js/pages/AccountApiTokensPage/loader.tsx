import Api, { type ApiToken } from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";

const EMPTY_TOKENS: ApiToken[] = [];

export async function loader() {
  const queryInput = {};
  await Api.api_tokens.listQuery(queryInput);

  return { queryInput };
}

type LoaderResult = Awaited<ReturnType<typeof loader>>;

export function useLoadedData() {
  const { queryInput } = Pages.useLoadedData<LoaderResult>();
  const { data } = useLoadedQuery(Api.api_tokens.listQueryOptions(queryInput));

  return { apiTokens: data?.apiTokens ?? EMPTY_TOKENS };
}
