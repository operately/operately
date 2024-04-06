import * as Pages from "@/components/Pages";
import * as People from "@/models/people";
import * as Goals from "@/models/goals";

interface LoaderResult {
  person: People.Person;
  goals: Goals.Goal[];
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    person: await People.getPerson({ id: params.id }),
    goals: await Goals.getGoals({
      includeTargets: true,
      includeSpace: true,
      includeProjects: true,
      includeLastCheckIn: true,
    }),
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
