import Api from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";

export async function loader() {
  const companyInput = {};

  await Api.companies.getQuery(companyInput);

  return { companyInput };
}

type LoaderResult = Awaited<ReturnType<typeof loader>>;

export function useLoadedData() {
  const { companyInput } = Pages.useLoadedData<LoaderResult>();
  const { data } = useLoadedQuery(Api.companies.getQueryOptions(companyInput));
  const company = data?.company;

  if (!company) throw new Error("Company administration data is unavailable");

  return { company };
}
