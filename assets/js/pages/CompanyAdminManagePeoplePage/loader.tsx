import * as Pages from "@/components/Pages";
import * as Companies from "@/models/companies";
import * as People from "@/models/people";

interface LoaderResult {
  company: Companies.Company;
  invitedPeople: People.Person[];
  currentMembers: People.Person[];
}

export async function loader({ params }): Promise<LoaderResult> {
  const company = await Companies.getCompany({ id: params.companyId, includePeople: true }).then((d) => d.company!);

  return {
    company: company,
    invitedPeople: People.sortByName(company.people!.filter((person) => person!.hasOpenInvitation)),
    currentMembers: People.sortByName(company.people!.filter((person) => !person!.hasOpenInvitation)),
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
