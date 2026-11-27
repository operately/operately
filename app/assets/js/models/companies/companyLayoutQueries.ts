import Api from "@/api";
import { queryClient, useLoadedQuery } from "@/api/queryClient";
import { useQueryClient, type QueryKey } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { assertPresent } from "@/utils/assertions";

import {
  captureCompanyQueryContext,
  isCurrentContext,
  scopeCompanyQuery,
  type CompanyQueryContext,
} from "./companyQueryContext";

export function companyLayoutInputs() {
  return {
    context: captureCompanyQueryContext(),
    companyInput: { includeOwners: true, includePermissions: true },
    spacesInput: { accessLevel: "edit_access" as const },
    siteMessagesInput: {},
    billingInput: window.appConfig.billingEnabled ? {} : null,
  };
}

type CompanyLayoutInputs = ReturnType<typeof companyLayoutInputs>;

/** Keep outgoing layout observers on their cached company until navigation commits. */
function layoutQueryOptions<T extends { queryKey: readonly unknown[] }>(options: T, context: CompanyQueryContext) {
  return {
    ...scopeCompanyQuery(options, context),
    // The loader already fetched this key, including when the mounted layout changes company.
    staleTime: Infinity,
    refetchOnWindowFocus: "always" as const,
    refetchOnReconnect: "always" as const,
    retryOnMount: false,
  };
}

function companyLayoutOptions(inputs: CompanyLayoutInputs) {
  return {
    company: layoutQueryOptions(Api.companies.getQueryOptions(inputs.companyInput), inputs.context),
    spaces: layoutQueryOptions(Api.spaces.countByAccessLevelQueryOptions(inputs.spacesInput), inputs.context),
    siteMessages: layoutQueryOptions(
      Api.site_messages.listActiveQueryOptions(inputs.siteMessagesInput),
      inputs.context,
    ),
    billing: {
      ...layoutQueryOptions(Api.billing.getAccessStateQueryOptions(inputs.billingInput ?? {}), inputs.context),
      enabled: () => inputs.billingInput !== null && isCurrentContext(inputs.context),
    },
  };
}

export async function fetchCompany() {
  const { company } = await queryClient.fetchQuery(companyLayoutOptions(companyLayoutInputs()).company);
  return company;
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

export function useCompanyLayoutState(inputs: CompanyLayoutInputs) {
  const options = useMemo(() => companyLayoutOptions(inputs), [inputs]);
  const company = useLoadedQuery(options.company);
  const spaces = useLoadedQuery(options.spaces);
  const siteMessages = useLoadedQuery({ ...options.siteMessages, throwOnError: false });
  const billing = useLoadedQuery({ ...options.billing, throwOnError: false });
  if (company.isPending || spaces.isPending) return null;

  assertPresent(company.data?.company, "Company is unavailable");

  return {
    company: company.data.company,
    canAddProject: (spaces.data?.count ?? 0) > 0,
    canAddGoal: (spaces.data?.count ?? 0) > 0,
    siteMessages: siteMessages.isError ? [] : (siteMessages.data?.messages ?? []),
    billingAccessState: inputs.billingInput === null || billing.isError ? null : (billing.data?.accessState ?? null),
  };
}

export function useCompanyLayoutQueries(inputs: CompanyLayoutInputs) {
  const companyLayout = useCompanyLayoutState(inputs);
  assertPresent(companyLayout, "Company layout is not ready");
  return companyLayout;
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
      keys.push(layoutQueryOptions(Api.billing.getQueryOptions({}), inputs.context).queryKey);
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
