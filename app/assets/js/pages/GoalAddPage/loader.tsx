import * as Pages from "@/components/Pages";
import * as Companies from "@/models/companies";
import * as Goals from "@/models/goals";
import * as Spaces from "@/models/spaces";
import { Paths } from "@/routes/paths";

import { redirectIfFeatureEnabled } from "../../routes/redirectIfFeatureEnabled";

interface LoaderResult {
  company: Companies.Company;

  space?: Spaces.Space;
  spaceID?: string;
  spaces?: Spaces.Space[];

  allowSpaceSelection: boolean;
  parentGoal?: Goals.Goal;

  goals?: Goals.Goal[];

  isCompanyWide?: boolean;
}

// There are two ways we can end up on this page:
// 1. We are navigating to a specific space, and we have the space ID in the URL.
// 2. We are navigating to /goals/new, and we need to pick a space.

export async function loader({ request, params }): Promise<LoaderResult> {
  const paths = new Paths({ companyId: params.companyId });
  await redirectIfFeatureEnabled(params, { feature: "new-goal-add-page", path: paths.goalNewPathV2({}) });

  const searchParams = new URL(request.url).searchParams;

  const parentGoalId = searchParams.get("parentGoalId") || undefined;
  const isCompanyWide = searchParams.get("companyWide") === "true";

  const spaceID = params.id || searchParams.get("spaceId") || undefined;
  const company = await Companies.getCompany({ id: params.companyId }).then((data) => data.company!);
  const allowSpaceSelection = !spaceID;

  let loadedData: LoaderResult = { company, allowSpaceSelection, spaceID, isCompanyWide };

  if (spaceID) {
    loadedData.space = await Spaces.getSpace({ id: spaceID });
  } else {
    loadedData.spaces = await Spaces.getSpaces({});
  }

  if (parentGoalId) {
    loadedData.parentGoal = await Goals.getGoal({ id: parentGoalId }).then((data) => data.goal!);
  }

  loadedData.goals = await Goals.getGoals({
    includeProjects: true,
    includeLastCheckIn: true,
    includeChampion: true,
    includeSpace: true,
  }).then((data) => data.goals!);

  return loadedData;
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
