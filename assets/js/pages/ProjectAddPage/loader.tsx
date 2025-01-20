import * as Pages from "@/components/Pages";
import * as Companies from "@/models/companies";
import * as Spaces from "@/models/spaces";
import * as Goals from "@/models/goals";

export interface UrlParams {
  goalId?: string;
  spaceId?: string;

  backPath?: string;
  backPathName?: string;
}

interface LoaderResult {
  company: Companies.Company;

  space?: Spaces.Space;
  spaceID?: string;
  spaces?: Spaces.Space[];

  goal?: Goals.Goal;
  goals: Goals.Goal[];

  backPath?: string;
  backPathName?: string;

  spaceOptions: { value: string; label: string }[];
}

export async function loader({ request, params }): Promise<LoaderResult> {
  const searchParams = new URL(request.url).searchParams;

  const backPath = searchParams.get("backPath") || undefined;
  const backPathName = searchParams.get("backPathName") || undefined;

  validateBackParams(backPath, backPathName);

  const spaceID = params.id || searchParams.get("spaceId") || undefined;

  const goalID = searchParams.get("goalId") || undefined;
  const goal = goalID ? await Goals.getGoal({ id: goalID }).then((data) => data.goal!) : undefined;

  const company = await Companies.getCompany({ id: params.companyId }).then((data) => data.company!);
  const goals = await Goals.getGoals({ includeSpace: true, includeChampion: true }).then((data) => data.goals!);

  const spaces = await Spaces.getSpaces({ includeAccessLevels: true });
  const space = spaceID ? await Spaces.getSpace({ id: spaceID }) : undefined;
  const spaceOptions = spaces.map((space) => ({ value: space.id!, label: space.name! }));

  return { company, spaceID, space, spaces, goal, goals, spaceOptions, backPath, backPathName };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}

function validateBackParams(backPath: string | undefined, backPathName: string | undefined) {
  if (backPath && !backPathName) {
    throw new Error("backPathName is required when backPath is provided");
  }

  if (!backPath && backPathName) {
    throw new Error("backPath is required when backPathName is provided");
  }
}
