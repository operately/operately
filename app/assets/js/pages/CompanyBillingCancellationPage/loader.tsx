import * as Billing from "@/models/billing";

import { Paths } from "@/routes/paths";
import { redirect } from "react-router-dom";
import {
  loader as companyBillingLoader,
  useLoadedData as useCompanyBillingLoadedData,
} from "../CompanyBillingPage/loader";

interface LoaderArgs {
  params: {
    companyId: string;
  };
}

interface LoaderResult {
  billing: Billing.BillingOverview;
}

export async function loader(args: LoaderArgs): Promise<LoaderResult> {
  const data = await companyBillingLoader(args);

  if (!Billing.canManagePaidSubscription(data.billing.account.status) || data.billing.account.cancelAtPeriodEnd) {
    throw redirect(new Paths({ companyId: args.params.companyId }).companyBillingPath());
  }

  return data;
}

export function useLoadedData(): LoaderResult {
  return useCompanyBillingLoadedData();
}
