import * as Billing from "@/models/billing";

import { Paths } from "@/routes/paths";
import { redirect } from "react-router";
import { isCompanyBillingPaidStatus } from "turboui/CompanyBilling";
import { loader as companyBillingLoader, useLoadedData as useCompanyBillingLoadedData } from "../CompanyBillingPage/loader";

interface LoaderArgs {
  params: {
    companyId: string;
  };
}

interface LoaderResult {
  billing: Billing.BillingOverview;
  limitsEnforced: boolean;
}

export async function loader(args: LoaderArgs): Promise<LoaderResult> {
  await Billing.authorizeBillingManagementPageAccess(args.params.companyId);

  const data = await companyBillingLoader(args);

  if (!isCompanyBillingPaidStatus(data.billing.account.status) || data.billing.account.cancelAtPeriodEnd) {
    throw redirect(new Paths({ companyId: args.params.companyId }).companyBillingPath());
  }

  return data;
}

export function useLoadedData(): LoaderResult {
  return useCompanyBillingLoadedData();
}
