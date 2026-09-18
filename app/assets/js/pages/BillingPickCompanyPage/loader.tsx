import Api from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";
import { fetchBillingCompanies } from "@/models/billing";
import { useMemo } from "react";

export async function loader() {
  const queryInput = { includeMemberCount: true, canManageBilling: true };
  await fetchBillingCompanies(queryInput);

  return { queryInput };
}

export function useLoadedData() {
  const { queryInput } = Pages.useLoadedData<Awaited<ReturnType<typeof loader>>>();

  // The selected company's loader changes headers before the picker unmounts.
  const options = useMemo(() => Api.companies.listQueryOptions(queryInput), [queryInput]);
  const { data } = useLoadedQuery(options);

  return { companies: data?.companies ?? [] };
}
