import * as Billing from "@/models/billing";
import * as Pages from "@/components/Pages";

import axios from "axios";

import { Paths } from "@/routes/paths";
import { redirect } from "react-router-dom";

interface LoaderResult {
  billing: Billing.BillingOverview;
}

interface LoaderArgs {
  params: {
    companyId: string;
  };
}

export async function loader({ params }: LoaderArgs): Promise<LoaderResult> {
  await Billing.authorizeBillingManagementPageAccess(params.companyId);

  try {
    return {
      billing: await Billing.getBilling({}),
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
