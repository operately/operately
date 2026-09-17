import Api from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";
import * as People from "@/models/people";

export async function loader() {
  const companyInput = { includePermissions: true };
  const peopleInput = {
    includeManager: true,
    includeCompanyAccessLevels: true,
    includeInviteLink: true,
    includeAccount: true,
  };
  const { company } = await Api.companies.getQuery(companyInput);

  if (!company.permissions?.isAdmin) throw new Response("Not Found", { status: 404 });

  await Api.people.listQuery(peopleInput);

  return { companyInput, peopleInput };
}

type LoaderResult = Awaited<ReturnType<typeof loader>>;

export function useLoadedData() {
  const { companyInput, peopleInput } = Pages.useLoadedData<LoaderResult>();
  const { data } = useLoadedQuery(Api.companies.getQueryOptions(companyInput));
  const { data: peopleData } = useLoadedQuery(Api.people.listQueryOptions(peopleInput));
  const company = data?.company;

  if (!company || !peopleData) throw new Error("Company administration data is unavailable");
  if (!company.permissions?.isAdmin) throw new Response("Not Found", { status: 404 });

  const { invitedPeople, currentMembers, guests } = People.separatePeople(peopleData.people);

  return {
    company,
    invitedPeople: People.sortByName(invitedPeople),
    currentMembers: People.sortByName(currentMembers),
    guests: People.sortByName(guests),
  };
}
