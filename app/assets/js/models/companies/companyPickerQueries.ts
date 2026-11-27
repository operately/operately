import Api from "@/api";
import { queryClient, useLoadedQuery } from "@/api/queryClient";
import { assertPresent } from "@/utils/assertions";
import { captureCompanyQueryContext, scopeCompanyQuery } from "./companyQueryContext";

export function companyPickerInputs() {
  return {
    context: captureCompanyQueryContext(),
    accountInput: {},
    companiesInput: { includeMemberCount: true },
  };
}

type CompanyPickerInputs = ReturnType<typeof companyPickerInputs>;

function companyPickerOptions({ context, accountInput, companiesInput }: CompanyPickerInputs) {
  return {
    account: scopeCompanyQuery(Api.people.getAccountQueryOptions(accountInput), context),
    companies: scopeCompanyQuery(Api.companies.listQueryOptions(companiesInput), context),
  };
}

export async function prefetchCompanyPicker(inputs: CompanyPickerInputs) {
  const options = companyPickerOptions(inputs);
  const [, { companies }] = await Promise.all([
    queryClient.fetchQuery({ ...options.account, staleTime: Infinity }),
    queryClient.fetchQuery({ ...options.companies, staleTime: Infinity }),
  ]);
  return companies;
}

export function useCompanyPickerState(inputs: CompanyPickerInputs) {
  const options = companyPickerOptions(inputs);
  const account = useLoadedQuery(options.account);
  const companies = useLoadedQuery(options.companies);
  if (account.isPending || companies.isPending) return null;

  assertPresent(account.data?.account, "Account is unavailable");
  assertPresent(companies.data?.companies, "Company list is unavailable");

  return { account: account.data.account, companies: companies.data.companies };
}
