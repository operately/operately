import * as Pages from "@/components/Pages";
import * as Companies from "@/models/companies";
import * as Spaces from "@/models/spaces";
import * as Goals from "@/models/goals";

interface LoaderResult {
  company: Companies.Company;

  space?: Spaces.Space;
  spaceID?: string;
  spaces?: Spaces.Space[];
  goal?: Goals.Goal;
  goals: Goals.Goal[];

  allowSpaceSelection: boolean;
  spaceOptions: { value: string; label: string }[];
}

// There are two ways we can end up on this page:
// 1. We are navigating to a specific space, and we have the space ID in the URL.
// 2. We are navigating to /projects/new, and we need to pick a space.

export async function loader({ request, params }): Promise<LoaderResult> {
  const spaceID = params.id;
  const searchParams = new URL(request.url).searchParams;
  const goalID = searchParams.get("goalId") || undefined;
  const goal = goalID ? await Goals.getGoal({ id: goalID }).then((data) => data.goal!) : undefined;

  const company = await Companies.getCompany({ id: params.companyId }).then((data) => data.company!);
  const goals = await Goals.getGoals({
    includeSpace: true,
    includeChampion: true,
  }).then((data) => data.goals!);

  let space: Spaces.Space | undefined;
  let spaces: Spaces.Space[] | undefined;
  let allowSpaceSelection: boolean;
  let spaceOptions: { value: string; label: string }[] = [];

  if (spaceID) {
    space = await Spaces.getSpace({ id: spaceID });
    allowSpaceSelection = false;
    spaceOptions = [{ value: space.id!, label: space.name! }];
  } else {
    spaces = await Spaces.getSpaces({});
    allowSpaceSelection = true;
    spaceOptions = spaces.map((space) => ({ value: space.id!, label: space.name! }));
  }

  return { company, spaceID, space, spaces, allowSpaceSelection, goal, goals, spaceOptions };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
