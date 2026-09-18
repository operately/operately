import { assertPresent } from "@/utils/assertions";
import Api from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";
import { useMemo } from "react";

export async function loader() {
  const accountInput = {};
  const companiesInput = { includeMemberCount: true };
  await Promise.all([Api.people.getAccountQuery(accountInput), Api.companies.listQuery(companiesInput)]);

  return { accountInput, companiesInput };
}

type LoaderResult = Awaited<ReturnType<typeof loader>>;

export function useLoadedData() {
  const { accountInput, companiesInput } = Pages.useLoadedData<LoaderResult>();

  // Keep the prefetched keys: the destination loader changes company headers before this page unmounts.
  const accountOptions = useMemo(() => Api.people.getAccountQueryOptions(accountInput), [accountInput]);
  const companiesOptions = useMemo(() => Api.companies.listQueryOptions(companiesInput), [companiesInput]);
  const { data: accountData } = useLoadedQuery(accountOptions);
  const { data: companiesData } = useLoadedQuery(companiesOptions);

  assertPresent(accountData?.account, "Account is unavailable");

  return { account: accountData.account, companies: companiesData?.companies ?? [] };
}
