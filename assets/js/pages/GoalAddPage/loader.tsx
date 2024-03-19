import * as Pages from "@/components/Pages";
import * as Companies from "@/models/companies";
import * as People from "@/models/people";
import * as Groups from "@/models/groups";

interface LoaderResult {
  company: Companies.Company;
  me: People.Person;

  space?: Groups.Group;
  spaceID?: string;
  spaces?: Groups.Group[];

  allowSpaceSelection: boolean;

  parentGoalId?: string;
}

// There are two ways we can end up on this page:
// 1. We are navigating to a specific space, and we have the space ID in the URL.
// 2. We are navigating to /goals/new, and we need to pick a space.

export async function loader({ request, params }): Promise<LoaderResult> {
  const searchParams = new URL(request.url).searchParams;

  const spaceID = params.id;
  const parentGoalId = searchParams.get("parentGoalId") || undefined;
  const company = await Companies.getCompany();
  const me = await People.getMe();

  if (spaceID) {
    const space = await Groups.getGroup(params.id);

    return { company, me, spaceID, space, allowSpaceSelection: false, parentGoalId };
  } else {
    const spaces = await Groups.getGroups();
    return { company, me, spaces, allowSpaceSelection: true, parentGoalId };
  }
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
