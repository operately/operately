import * as Pages from "@/components/Pages";
import * as Companies from "@/models/companies";
import * as People from "@/models/people";

interface LoaderResult {
  company: Companies.Company;
  people: People.Person[];
}

export async function loader({ params }): Promise<LoaderResult> {
  const companyPromise = Companies.getCompany({ id: params.companyId }).then((d) => d.company!);
  const peoplePromise = People.getPeople({}).then((d) => People.sortByName(d.people!));

  return {
    company: await companyPromise,
    people: await peoplePromise,
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
