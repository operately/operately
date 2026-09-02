import Api, { Goal, ProjectTemplate, Space } from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";

export interface UrlParams {
  goalId?: string;
  spaceId?: string;
  templateId?: string;

  backPath?: string;
  backPathName?: string;
}

const DISABLED_SPACE_INPUT = { id: "" };
const DISABLED_GOAL_INPUT = { id: "" };

export async function loader({ request, params }) {
  const searchParams = new URL(request.url).searchParams;

  const backPath = searchParams.get("backPath") || undefined;
  const backPathName = searchParams.get("backPathName") || undefined;

  validateBackParams(backPath, backPathName);

  const spaceID = params.id || searchParams.get("spaceId") || undefined;
  const goalID = searchParams.get("goalId") || undefined;

  const goalsInput = { includeSpace: true, includeChampion: true };
  const spacesInput = { includeAccessLevels: true, accessLevel: "edit_access" as const };
  const templatesInput = { archiveStatus: "active" as const };
  const spaceInput = spaceID ? { id: spaceID } : null;
  const goalInput = goalID ? { id: goalID } : null;

  await Promise.all([
    Api.goals.listQuery(goalsInput),
    Api.spaces.listQuery(spacesInput),
    Api.project_templates.listQuery(templatesInput),
    spaceInput ? Api.spaces.getQuery(spaceInput) : Promise.resolve(),
    goalInput ? Api.goals.getQuery(goalInput) : Promise.resolve(),
  ]);

  return {
    goalsInput,
    spacesInput,
    templatesInput,
    spaceInput,
    goalInput,
    spaceID,
    backPath,
    backPathName,
  };
}

type LoaderResult = Awaited<ReturnType<typeof loader>>;

export function useLoadedData(): {
  spaceID?: string;
  space?: Space;
  spaces: Space[];
  spaceOptions: { value: string; label: string }[];
  goal?: Goal;
  goals: Goal[];
  templates: ProjectTemplate[];
  backPath?: string;
  backPathName?: string;
} {
  const { goalsInput, spacesInput, templatesInput, spaceInput, goalInput, spaceID, backPath, backPathName } =
    Pages.useLoadedData<LoaderResult>();

  const { data: goalsData } = useLoadedQuery(Api.goals.listQueryOptions(goalsInput));
  const { data: spacesData } = useLoadedQuery(Api.spaces.listQueryOptions(spacesInput));
  const { data: templatesData } = useLoadedQuery(Api.project_templates.listQueryOptions(templatesInput));
  const { data: spaceData } = useLoadedQuery({
    ...Api.spaces.getQueryOptions(spaceInput ?? DISABLED_SPACE_INPUT),
    enabled: spaceInput != null,
  });
  const { data: goalData } = useLoadedQuery({
    ...Api.goals.getQueryOptions(goalInput ?? DISABLED_GOAL_INPUT),
    enabled: goalInput != null,
  });

  if (!goalsData?.goals) {
    throw new Error("Goal list is unavailable");
  }

  if (!spacesData?.spaces) {
    throw new Error("Space list is unavailable");
  }

  if (spaceInput && !spaceData?.space) {
    throw new Error(`Space data is unavailable for space "${spaceInput.id}"`);
  }

  if (goalInput && !goalData?.goal) {
    throw new Error(`Goal data is unavailable for goal "${goalInput.id}"`);
  }

  const spaces = spacesData.spaces;

  return {
    spaceID,
    space: spaceData?.space,
    spaces,
    spaceOptions: spaces.map((space) => ({ value: space.id!, label: space.name! })),
    goal: goalData?.goal,
    goals: goalsData.goals,
    templates: templatesData?.templates ?? [],
    backPath,
    backPathName,
  };
}

function validateBackParams(backPath: string | undefined, backPathName: string | undefined) {
  if (backPath && !backPathName) {
    throw new Error("backPathName is required when backPath is provided");
  }

  if (!backPath && backPathName) {
    throw new Error("backPath is required when backPathName is provided");
  }
}
