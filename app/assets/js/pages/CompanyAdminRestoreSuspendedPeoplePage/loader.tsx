import Api from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";

export async function loader() {
  const companyInput = { includeOwners: true };
  const peopleInput = { onlySuspended: true };

  await Promise.all([Api.companies.getQuery(companyInput), Api.people.listQuery(peopleInput)]);

  return { companyInput, peopleInput };
}

type LoaderResult = Awaited<ReturnType<typeof loader>>;

export function useLoadedData() {
  const { companyInput, peopleInput } = Pages.useLoadedData<LoaderResult>();
  const { data } = useLoadedQuery(Api.companies.getQueryOptions(companyInput));
  const { data: peopleData } = useLoadedQuery(Api.people.listQueryOptions(peopleInput));
  const company = data?.company;

  if (!company || !peopleData) throw new Error("Company administration data is unavailable");

  return {
    company,
    ownerIds: (company.owners ?? []).map((owner) => owner.id),
    suspendedPeople: peopleData.people ?? [],
  };
}
