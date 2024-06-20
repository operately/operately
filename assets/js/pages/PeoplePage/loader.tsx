import * as Pages from "@/components/Pages";
import * as Companies from "@/models/companies";
import * as People from "@/models/people";

interface LoaderResult {
  company: Companies.Company;
  people: People.Person[];
}

export async function loader(): Promise<LoaderResult> {
  return {
    company: await Companies.getCompany(),
    people: await People.getPeople({}).then((data) => People.sortByName(data.people!)),
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
