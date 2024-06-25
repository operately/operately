import * as Pages from "@/components/Pages";
import * as Companies from "@/models/companies";
import * as Goals from "@/models/goals";

interface LoaderResult {
  company: Companies.Company;
  goal: Goals.Goal;
  spaceID: string;
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    spaceID: params.id,
    company: await Companies.getCompany(),
    goal: await Goals.getGoal({ id: params.goalId, includeTargets: true }).then((data) => data.goal!),
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
