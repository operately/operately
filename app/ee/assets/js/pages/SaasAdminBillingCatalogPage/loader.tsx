import * as AdminApi from "@/ee/admin_api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";
import { redirect } from "react-router";

export async function loader() {
  if (!window.appConfig.billingEnabled) throw redirect("/admin");

  const queryInput = {};
  await Promise.all([
    AdminApi.listBillingProductsQuery(queryInput),
    AdminApi.listBillingPlanDefinitionsQuery(queryInput),
  ]);

  return { queryInput };
}

export function useLoadedData() {
  const { queryInput } = Pages.useLoadedData<Awaited<ReturnType<typeof loader>>>();
  const { data } = useLoadedQuery(AdminApi.listBillingProductsQueryOptions(queryInput));
  const { data: plansData } = useLoadedQuery(AdminApi.listBillingPlanDefinitionsQueryOptions(queryInput));

  return { products: data?.products ?? [], planDefinitions: plansData?.planDefinitions ?? [] };
}
