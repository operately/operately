import Api from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import { useMemo } from "react";
import { assertPresent } from "@/utils/assertions";
import * as Billing from "@/models/billing";
import * as Pages from "@/components/Pages";

import axios from "axios";

import { Paths } from "@/routes/paths";
import { redirect } from "react-router";

interface LoaderResult {
  queryInput: {};
}

interface LoaderArgs {
  params: {
    companyId: string;
  };
}

export async function loader({ params }: LoaderArgs): Promise<LoaderResult> {
  await Billing.authorizeBillingManagementPageAccess(params.companyId);

  try {
    const queryInput = {};
    await Billing.fetchBilling(queryInput);

    return { queryInput };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 403) {
      throw redirect(new Paths({ companyId: params.companyId }).companyAdminPath());
    }

    throw error;
  }
}

export function useLoadedData() {
  const { queryInput } = Pages.useLoadedData<LoaderResult>();

  // Navigation can change company headers before this page unmounts.
  const options = useMemo(() => Api.billing.getQueryOptions(queryInput), [queryInput]);
  const { data } = useLoadedQuery(options);

  assertPresent(data, "Billing is unavailable");

  return { billing: data.billing };
}
