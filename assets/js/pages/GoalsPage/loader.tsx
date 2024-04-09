import * as Pages from "@/components/Pages";
import * as Goals from "@/models/goals";
import * as Companies from "@/models/companies";

interface LoaderResult {
  company: Companies.Company;
  goals: Goals.Goal[];
}

export async function loader(): Promise<LoaderResult> {
  return {
    company: await Companies.getCompany(),
    goals: await Goals.getGoals({
      includeTargets: true,
      includeSpace: true,
      includeLastCheckIn: true,
    }),
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
