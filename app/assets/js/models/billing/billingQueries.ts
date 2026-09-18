import Api, { type BillingGetInput, type CompaniesListInput } from "@/api";
import { queryClient } from "@/api/queryClient";
import { Paths } from "@/routes/paths";
import { redirect } from "react-router";

/** Billing routes need current permissions and subscription state on every entry. */
export function fetchBilling(input: BillingGetInput) {
  return queryClient.fetchQuery({ ...Api.billing.getQueryOptions(input), staleTime: 0 });
}

export function fetchBillingCompanies(input: CompaniesListInput) {
  return queryClient.fetchQuery({ ...Api.companies.listQueryOptions(input), staleTime: 0 });
}

export async function authorizeBillingManagementPageAccess(companyId: string) {
  const { company } = await queryClient.fetchQuery({
    ...Api.companies.getQueryOptions({ includePermissions: true }),
    staleTime: 0,
  });

  if (!window.appConfig.billingEnabled || !company?.permissions?.canManageBilling) {
    throw redirect(new Paths({ companyId }).companyAdminPath());
  }

  return company;
}
