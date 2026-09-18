import { assertPresent } from "@/utils/assertions";
import Api from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";

export async function loader() {
  const accountInput = {};
  const companiesInput = { includeMemberCount: true };
  await Promise.all([Api.people.getAccountQuery(accountInput), Api.companies.listQuery(companiesInput)]);

  return { accountInput, companiesInput };
}

type LoaderResult = Awaited<ReturnType<typeof loader>>;

export function useLoadedData() {
  const { accountInput, companiesInput } = Pages.useLoadedData<LoaderResult>();
  const { data: accountData } = useLoadedQuery(Api.people.getAccountQueryOptions(accountInput));
  const { data: companiesData } = useLoadedQuery(Api.companies.listQueryOptions(companiesInput));

  assertPresent(accountData?.account, "Account is unavailable");

  return { account: accountData.account, companies: companiesData?.companies ?? [] };
}
