import * as Billing from "@/models/billing";
import * as Companies from "@/models/companies";
import * as People from "@/models/people";

import { includesId, Paths } from "@/routes/paths";
import { redirectIfFeatureNotEnabled } from "@/routes/redirectUtils";
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
  await redirectIfFeatureNotEnabled(args.params, {
    feature: "billing",
    path: new Paths({ companyId: args.params.companyId }).companyAdminPath(),
  });

  const [company, me] = await Promise.all([
    Companies.getCompany({ includeOwners: true }).then((res) => res.company!),
    People.getMe({}).then((res) => res.me),
  ]);

  if (!includesId(company.owners?.map((owner) => owner.id) || [], me?.id)) {
    throw redirect(new Paths({ companyId: args.params.companyId }).companyAdminPath());
  }

  const data = await companyBillingLoader(args);

  if (!Billing.canManagePaidSubscription(data.billing.account.status) || data.billing.account.cancelAtPeriodEnd) {
    throw redirect(new Paths({ companyId: args.params.companyId }).companyBillingPath());
  }

  return data;
}

export function useLoadedData(): LoaderResult {
  return useCompanyBillingLoadedData();
}
