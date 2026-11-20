import { assertPresent } from "@/utils/assertions";
import Api from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";
import { Paths } from "@/routes/paths";
import { useMemo } from "react";
import { redirect } from "react-router";

export async function loader() {
  const accountInput = {};
  const companiesInput = { includeMemberCount: true };
  const [, { companies }] = await Promise.all([
    Api.people.getAccountQuery(accountInput),
    Api.companies.listQuery(companiesInput),
  ]);

  const [company] = companies;
  if (companies.length === 1 && company) {
    return redirect(Paths.companyHomePath(company.id));
  }

  return { accountInput, companiesInput };
}

type LoaderResult = Exclude<Awaited<ReturnType<typeof loader>>, Response>;

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
