import Api, { Goal, Space } from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";

const DISABLED_SPACE_INPUT = { id: "" };
const DISABLED_GOAL_INPUT = { id: "" };

export async function loader({ request }) {
  const searchParams = new URL(request.url).searchParams;
  const spaceId = searchParams.get("spaceId");
  const parentGoalId = searchParams.get("parentGoalId");
  const spaceInput = spaceId ? { id: spaceId } : null;
  const parentGoalInput = parentGoalId ? { id: parentGoalId } : null;

  await Promise.all([
    spaceInput ? Api.spaces.getQuery(spaceInput) : Promise.resolve(),
    parentGoalInput ? Api.goals.getQuery(parentGoalInput) : Promise.resolve(),
  ]);

  return { spaceInput, parentGoalInput };
}

type LoaderResult = Awaited<ReturnType<typeof loader>>;

export function useLoadedData(): { space: Space | null; parentGoal: Goal | null } {
  const { spaceInput, parentGoalInput } = Pages.useLoadedData<LoaderResult>();
  const { data: spaceData } = useLoadedQuery({
    ...Api.spaces.getQueryOptions(spaceInput ?? DISABLED_SPACE_INPUT),
    enabled: spaceInput != null,
  });
  const { data: parentGoalData } = useLoadedQuery({
    ...Api.goals.getQueryOptions(parentGoalInput ?? DISABLED_GOAL_INPUT),
    enabled: parentGoalInput != null,
  });

  if (spaceInput && !spaceData?.space) {
    throw new Error(`Space data is unavailable for space "${spaceInput.id}"`);
  }
  if (parentGoalInput && !parentGoalData?.goal) {
    throw new Error(`Goal data is unavailable for goal "${parentGoalInput.id}"`);
  }

  return {
    space: spaceInput ? (spaceData?.space ?? null) : null,
    parentGoal: parentGoalInput ? (parentGoalData?.goal ?? null) : null,
  };
}
