import * as Pages from "@/components/Pages";
import * as People from "@/models/people";
import * as Companies from "@/models/companies";

interface LoaderResult {
  company: Companies.Company;
  me: People.Person;
}

export async function loader(): Promise<LoaderResult> {
  return {
    company: await Companies.getCompany({ include: ["people"] }),
    me: await People.getMe(),
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
