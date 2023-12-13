import * as Pages from "@/components/Pages";
import * as Companies from "@/models/companies";
import * as People from "@/models/people";
import * as Groups from "@/models/groups";

interface LoaderResult {
  company: Companies.Company;
  me: People.Person;
  space: Groups.Group;
  spaceID: string;
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    spaceID: params.id,
    company: await Companies.getCompany(),
    space: await Groups.getGroup(params.id),
    me: await People.getMe(),
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
