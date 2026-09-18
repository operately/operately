import Api from "@/api";
import { queryClient, useLoadedQuery } from "@/api/queryClient";
import { hashKey, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { assertPresent } from "@/utils/assertions";

interface CompanyQueryContext {
  basePath: string;
  headers: Record<string, string>;
}

export function companyLayoutInputs() {
  const context: CompanyQueryContext = {
    basePath: Api.default.getBasePath(),
    headers: { ...Api.default.getHeaders() },
  };

  return {
    context,
    companyInput: { includeOwners: true, includePermissions: true },
    spacesInput: { accessLevel: "edit_access" as const },
    siteMessagesInput: {},
    billingInput: window.appConfig.billingEnabled ? {} : null,
  };
}

type CompanyLayoutInputs = ReturnType<typeof companyLayoutInputs>;

function isCurrentContext(context: CompanyQueryContext) {
  return (
    context.basePath === Api.default.getBasePath() && hashKey([context.headers]) === hashKey([Api.default.getHeaders()])
  );
}

/** Keep outgoing layout observers on their cached company until navigation commits. */
function scopedOptions<T extends { queryKey: readonly unknown[] }>(options: T, context: CompanyQueryContext) {
  return {
    ...options,
    queryKey: [options.queryKey[0], context.basePath, context.headers, ...options.queryKey.slice(3)] as T["queryKey"],
    // The loader already fetched this key, including when the mounted layout changes company.
    staleTime: Infinity,
    refetchOnWindowFocus: "always" as const,
    refetchOnReconnect: "always" as const,
    retryOnMount: false,
    // Evaluated at fetch time, including focus and invalidation before React rerenders.
    enabled: () => isCurrentContext(context),
  };
}

function companyLayoutOptions(inputs: CompanyLayoutInputs) {
  return {
    company: scopedOptions(Api.companies.getQueryOptions(inputs.companyInput), inputs.context),
    spaces: scopedOptions(Api.spaces.countByAccessLevelQueryOptions(inputs.spacesInput), inputs.context),
    siteMessages: scopedOptions(Api.site_messages.listActiveQueryOptions(inputs.siteMessagesInput), inputs.context),
    billing: {
      ...scopedOptions(Api.billing.getAccessStateQueryOptions(inputs.billingInput ?? {}), inputs.context),
      enabled: () => inputs.billingInput !== null && isCurrentContext(inputs.context),
    },
  };
}

export async function prefetchCompanyLayout(inputs: CompanyLayoutInputs) {
  const options = companyLayoutOptions(inputs);
  const [{ company }] = await Promise.all([
    queryClient.fetchQuery(options.company),
    queryClient.fetchQuery(options.spaces),
    queryClient.fetchQuery(options.siteMessages).catch(() => undefined),
  ]);

  // An interrupted navigation must not fetch billing with the destination's headers.
  if (inputs.billingInput !== null && isCurrentContext(inputs.context)) {
    await queryClient.fetchQuery(options.billing).catch(() => undefined);
  }

  return company.id;
}

export function useCompanyLayoutQueries(inputs: CompanyLayoutInputs) {
  const options = useMemo(() => companyLayoutOptions(inputs), [inputs]);
  const company = useLoadedQuery(options.company);
  const spaces = useLoadedQuery(options.spaces);
  const siteMessages = useLoadedQuery(options.siteMessages);
  const billing = useLoadedQuery(options.billing);
  assertPresent(company.data?.company, "Company is unavailable");

  return {
    company: company.data.company,
    canAddProject: (spaces.data?.count ?? 0) > 0,
    canAddGoal: (spaces.data?.count ?? 0) > 0,
    siteMessages: siteMessages.isError ? [] : (siteMessages.data?.messages ?? []),
    billingAccessState: inputs.billingInput === null || billing.isError ? null : (billing.data?.accessState ?? null),
  };
}

export function useRefreshCompanyLayout(inputs: CompanyLayoutInputs) {
  const client = useQueryClient();

  return useCallback(async () => {
    const options = companyLayoutOptions(inputs);
    const queries = [options.company, options.spaces, options.siteMessages];
    const keys: QueryKey[] = queries.map(({ queryKey }) => queryKey);
    if (inputs.billingInput !== null) {
      keys.push(options.billing.queryKey);
      // Router revalidation also refreshed the billing page on webhook updates.
      keys.push(scopedOptions(Api.billing.getQueryOptions({}), inputs.context).queryKey);
    }

    await Promise.all(
      keys.map((queryKey) =>
        client.invalidateQueries({
          queryKey,
          exact: true,
          refetchType: isCurrentContext(inputs.context) ? "active" : "none",
        }),
      ),
    );
  }, [client, inputs]);
}
