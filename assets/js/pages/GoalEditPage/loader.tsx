import * as Pages from "@/components/Pages";
import * as Companies from "@/models/companies";
import * as Goals from "@/models/goals";

interface LoaderResult {
  company: Companies.Company;
  goal: Goals.Goal;
  spaceID: string;
}

export async function loader({ params }): Promise<LoaderResult> {
  const companyPromise = Companies.getCompany({ id: params.companyId }).then((data) => data.company!);

  const goalPromise = Goals.getGoal({
    id: params.goalId,
    includeTargets: true,
    includeChampion: true,
    includeReviewer: true,
    includeSpace: true,
  }).then((data) => data.goal!);

  return {
    spaceID: params.id,
    company: await companyPromise,
    goal: await goalPromise,
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
