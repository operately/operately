import * as Pages from "@/components/Pages";
import * as Companies from "@/models/companies";
import * as People from "@/models/people";
import * as Groups from "@/models/groups";
import * as Goals from "@/models/goals";

interface LoaderResult {
  company: Companies.Company;
  me: People.Person;

  space?: Groups.Group;
  spaceID?: string;
  spaces?: Groups.Group[];

  allowSpaceSelection: boolean;
  parentGoal?: Goals.Goal;

  goals?: Goals.Goal[];

  isCompanyWide?: boolean;
}

// There are two ways we can end up on this page:
// 1. We are navigating to a specific space, and we have the space ID in the URL.
// 2. We are navigating to /goals/new, and we need to pick a space.

export async function loader({ request, params }): Promise<LoaderResult> {
  const searchParams = new URL(request.url).searchParams;

  const parentGoalId = searchParams.get("parentGoalId") || undefined;
  const isCompanyWide = searchParams.get("company-wide") === "true";

  const spaceID = params.id;
  const company = await Companies.getCompany();
  const me = await People.getMe({});
  const allowSpaceSelection = !spaceID;

  let loadedData: LoaderResult = { company, me, allowSpaceSelection, spaceID, isCompanyWide };

  if (spaceID) {
    loadedData.space = await Groups.getGroup(spaceID);
  } else {
    loadedData.spaces = await Groups.getGroups();
  }

  if (parentGoalId) {
    loadedData.parentGoal = await Goals.getGoal({ id: parentGoalId });
  }

  loadedData.goals = await Goals.getGoals({});

  return loadedData;
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
