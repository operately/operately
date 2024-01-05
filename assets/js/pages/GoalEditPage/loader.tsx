import * as Pages from "@/components/Pages";
import * as Companies from "@/models/companies";
import * as People from "@/models/people";
import * as Goals from "@/models/goals";

interface LoaderResult {
  company: Companies.Company;
  me: People.Person;
  goal: Goals.Goal;
  spaceID: string;
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    spaceID: params.id,
    company: await Companies.getCompany(),
    goal: await Goals.getGoal(params.goalId, { includeTargets: true }),
    me: await People.getMe(),
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
