import Api from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";
import * as People from "@/models/people";

export async function loader() {
  const companyInput = {};
  const peopleInput = {};
  await Promise.all([Api.companies.getQuery(companyInput), Api.people.listQuery(peopleInput)]);

  return { companyInput, peopleInput };
}

type LoaderResult = Awaited<ReturnType<typeof loader>>;

export function useLoadedData() {
  const { companyInput, peopleInput } = Pages.useLoadedData<LoaderResult>();
  const { data: companyData } = useLoadedQuery(Api.companies.getQueryOptions(companyInput));
  const { data: peopleData } = useLoadedQuery(Api.people.listQueryOptions(peopleInput));

  if (!companyData?.company || !peopleData) throw new Error("People page data is unavailable");

  return { company: companyData.company, people: People.sortByName(peopleData.people ?? []) };
}
