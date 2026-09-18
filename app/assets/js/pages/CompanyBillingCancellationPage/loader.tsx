import Api from "@/api";
import { queryClient } from "@/api/queryClient";
import { assertPresent } from "@/utils/assertions";

import { Paths } from "@/routes/paths";
import { redirect } from "react-router";
import { isCompanyBillingPaidStatus } from "turboui/CompanyBilling";
import {
  loader as companyBillingLoader,
  useLoadedData as useCompanyBillingLoadedData,
} from "../CompanyBillingPage/loader";

interface LoaderArgs {
  params: {
    companyId: string;
  };
}

type LoaderResult = Awaited<ReturnType<typeof companyBillingLoader>>;

export async function loader(args: LoaderArgs): Promise<LoaderResult> {
  const data = await companyBillingLoader(args);

  const result = queryClient.getQueryData(Api.billing.getQueryOptions(data.queryInput).queryKey);
  assertPresent(result, "Billing is unavailable");

  if (!isCompanyBillingPaidStatus(result.billing.account.status) || result.billing.account.cancelAtPeriodEnd) {
    throw redirect(new Paths({ companyId: args.params.companyId }).companyBillingPath());
  }

  return data;
}

export function useLoadedData() {
  return useCompanyBillingLoadedData();
}
