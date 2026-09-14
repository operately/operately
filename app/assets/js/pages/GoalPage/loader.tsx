import { useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Api from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";
import { invalidateGoalPageQueries } from "@/models/goals/goalPageQueries";
import { prefetchResourceHubDocs, resourceHubDocsInputs } from "@/models/resourceHubs/docsQueries";

export async function loader({ params }: { params: { id: string } }) {
  const goalInput = {
    id: params.id,
    includeSpace: true,
    includeChampion: true,
    includeReviewer: true,
    includePermissions: true,
    includeUnreadNotifications: true,
    includeLastCheckIn: true,
    includeAccessLevels: true,
    includePrivacy: true,
    includeRetrospective: true,
    includeChecklist: true,
    includeResourceHub: true,
  };
  const workMapInput = { parentGoalId: params.id, includeAssignees: true };
  const checkInsInput = { goalId: params.id };
  const discussionsInput = { goalId: params.id };
  const childrenInput = { id: params.id };

  const core = Api.goals.getQuery(goalInput).then(async ({ goal }) => {
    if (!goal) throw new Error(`Goal data is unavailable for goal "${params.id}"`);

    // Docs errors belong to the Docs & Files tab, not the entire goal page.
    await prefetchResourceHubDocs(resourceHubDocsInputs(goal.resourceHub?.id)).catch(() => undefined);
  });

  await Promise.all([
    core,
    Api.companies.getWorkMapQuery(workMapInput),
    Api.goals.listCheckInsQuery(checkInsInput),
    Api.goals.listDiscussionsQuery(discussionsInput),
    Api.goals.countChildrenQuery(childrenInput),
  ]);

  return { goalInput, workMapInput, checkInsInput, discussionsInput, childrenInput };
}

type LoaderInputs = Awaited<ReturnType<typeof loader>>;

export function useLoadedData() {
  const inputs = Pages.useLoadedData<LoaderInputs>();
  const goalQuery = useLoadedQuery(Api.goals.getQueryOptions(inputs.goalInput));
  const workMapQuery = useLoadedQuery(Api.companies.getWorkMapQueryOptions(inputs.workMapInput));
  const checkInsQuery = useLoadedQuery(Api.goals.listCheckInsQueryOptions(inputs.checkInsInput));
  const discussionsQuery = useLoadedQuery(Api.goals.listDiscussionsQueryOptions(inputs.discussionsInput));
  const childrenQuery = useLoadedQuery(Api.goals.countChildrenQueryOptions(inputs.childrenInput));

  const data = useMemo(() => {
    const goal = goalQuery.data?.goal;

    if (!goal?.permissions || !goal.privacy || !goal.accessLevels) {
      throw new Error(`Goal data is unavailable for goal "${inputs.goalInput.id}"`);
    }

    if (
      !workMapQuery.data?.workMap ||
      !checkInsQuery.data?.checkIns ||
      !discussionsQuery.data?.discussions ||
      !childrenQuery.data?.childrenCount
    ) {
      throw new Error(`Goal content is unavailable for goal "${inputs.goalInput.id}"`);
    }

    return {
      goal: { ...goal, permissions: goal.permissions, privacy: goal.privacy, accessLevels: goal.accessLevels },
      workMap: workMapQuery.data.workMap,
      checkIns: checkInsQuery.data.checkIns,
      discussions: discussionsQuery.data.discussions,
      childrenCount: childrenQuery.data.childrenCount,
    };
  }, [
    goalQuery.data,
    workMapQuery.data,
    checkInsQuery.data,
    discussionsQuery.data,
    childrenQuery.data,
    inputs.goalInput.id,
  ]);

  return { data };
}

export function useRefresh() {
  const client = useQueryClient();
  const { goalInput } = Pages.useLoadedData<LoaderInputs>();

  return useCallback(() => invalidateGoalPageQueries(client, goalInput.id), [client, goalInput.id]);
}
