import { queryOptions } from "@tanstack/react-query";
import Api, { getLanguageQueryOptions, type GetLanguageResult } from "@/api";

/** Resolve each navigation independently of cached responses and stale company headers. */
export function routeLanguageQueryOptions(companyId: string | undefined, navigationKey: string) {
  const { queryKey } = getLanguageQueryOptions({ companyId });
  const [namespace, basePath, requestHeaders, path, input] = queryKey;
  const headers = { ...requestHeaders };
  delete headers["x-company-id"];

  return queryOptions({
    queryKey: [namespace, basePath, headers, path, input, navigationKey] as const,
    queryFn: (): Promise<GetLanguageResult> => Api.default.queryRequest(path, input, basePath, headers),
    staleTime: 0,
    gcTime: 0,
    retry: false,
    refetchOnMount: "always",
  });
}
