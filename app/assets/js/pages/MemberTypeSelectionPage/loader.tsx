import Api from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";

export async function loader() {
  const companyInput = { includePermissions: true };
  const { company } = await Api.companies.getQuery(companyInput);

  if (!company.permissions?.isAdmin) throw new Response("Not Found", { status: 404 });

  return { companyInput };
}

type LoaderResult = Awaited<ReturnType<typeof loader>>;

export function useLoadedData() {
  const { companyInput } = Pages.useLoadedData<LoaderResult>();
  const { data } = useLoadedQuery(Api.companies.getQueryOptions(companyInput));
  const company = data?.company;

  if (!company) throw new Error("Company administration data is unavailable");
  if (!company.permissions?.isAdmin) throw new Response("Not Found", { status: 404 });

  return { company };
}
