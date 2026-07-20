import * as Billing from "@/models/billing";
import * as Companies from "@/models/companies";
import * as Pages from "@/components/Pages";

import axios from "axios";

import { Paths } from "@/routes/paths";
import { redirect } from "react-router";

interface LoaderResult {
  billing: Billing.BillingOverview;
  limitsEnforced: boolean;
}

interface LoaderArgs {
  params: {
    companyId: string;
  };
}

export async function loader({ params }: LoaderArgs): Promise<LoaderResult> {
  const company = await Billing.authorizeBillingManagementPageAccess(params.companyId);

  try {
    return {
      billing: await Billing.getBilling({}),
      limitsEnforced: Companies.hasFeature(company, "billing"),
    };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 403) {
      throw redirect(new Paths({ companyId: params.companyId }).companyAdminPath());
    }

    throw error;
  }
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
