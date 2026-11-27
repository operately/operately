import Api from "@/api";
import { hashKey } from "@tanstack/react-query";

export interface CompanyQueryContext {
  basePath: string;
  headers: Record<string, string>;
}

export function captureCompanyQueryContext(): CompanyQueryContext {
  return {
    basePath: Api.default.getBasePath(),
    headers: { ...Api.default.getHeaders() },
  };
}

export function isCurrentContext(context: CompanyQueryContext) {
  return (
    context.basePath === Api.default.getBasePath() && hashKey([context.headers]) === hashKey([Api.default.getHeaders()])
  );
}

export function scopeCompanyQuery<T extends { queryKey: readonly unknown[] }>(
  options: T,
  context: CompanyQueryContext,
) {
  return {
    ...options,
    queryKey: [options.queryKey[0], context.basePath, context.headers, ...options.queryKey.slice(3)] as T["queryKey"],
    // An outgoing page can still observe its cached data after navigation changes the headers.
    enabled: () => isCurrentContext(context),
  };
}
