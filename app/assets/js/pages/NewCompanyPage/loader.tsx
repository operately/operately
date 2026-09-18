import { assertPresent } from "@/utils/assertions";
import Api from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";
import { useMemo } from "react";

export async function loader() {
  const queryInput = {};
  await Api.billing.getCatalogQuery(queryInput);

  return { queryInput };
}

type LoaderResult = Awaited<ReturnType<typeof loader>>;

export function useLoadedData() {
  const { queryInput } = Pages.useLoadedData<LoaderResult>();

  // Navigation sets the new company's headers before this form unmounts.
  const options = useMemo(() => Api.billing.getCatalogQueryOptions(queryInput), [queryInput]);
  const { data } = useLoadedQuery(options);

  assertPresent(data, "Billing catalog is unavailable");

  return { billingCatalog: { plans: data.plans ?? [], catalogProducts: data.catalogProducts ?? [] } };
}
