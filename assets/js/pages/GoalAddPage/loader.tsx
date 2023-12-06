import * as Pages from "@/components/Pages";
import * as Companies from "@/models/companies";
import * as People from "@/models/people";

interface LoaderResult {
  company: Companies.Company;
  me: People.Person;
  spaceID: string;
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    spaceID: params.id,
    company: await Companies.getCompany(),
    me: await People.getMe(),
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
