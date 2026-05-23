import * as Billing from "@/models/billing";
import * as Pages from "@/components/Pages";

import axios from "axios";

import { Paths } from "@/routes/paths";
import { redirectIfFeatureNotEnabled } from "@/routes/redirectUtils";

interface LoaderResult {
  billing: Billing.BillingOverview;
}

export async function loader({ params }): Promise<LoaderResult> {
  await redirectIfFeatureNotEnabled(params, {
    feature: "billing",
    path: new Paths({ companyId: params.companyId }).companyAdminPath(),
  });

  try {
    return {
      billing: await Billing.getBilling({}),
    };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 403) {
      throw new Response("Not Found", { status: 404 });
    }

    throw error;
  }
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
