import { useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Api from "@/api";
import { match } from "ts-pattern";
import { goalContentInputs } from "./contentQueries";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";
import { invalidateGoalPageQueries } from "@/models/goals/goalPageQueries";
import { prefetchResourceHubDocs, resourceHubDocsInputs } from "@/models/resourceHubs/docsQueries";

export async function loader({ params, request }: { params: { id: string }; request?: Request }) {
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
  const childrenInput = { id: params.id };
  const contentInputs = goalContentInputs(params.id);
  const tab = (request ? new URL(request.url).searchParams.get("tab") : null) || "overview";

  const selectedContent = match(tab)
    .with("overview", () => Api.companies.getWorkMapQuery(contentInputs.workMapInput))
    .with("check-ins", () => Api.goals.listCheckInsQuery(contentInputs.checkInsInput))
    .with("discussions", () => Api.goals.listDiscussionsQuery(contentInputs.discussionsInput))
    .otherwise(() => Promise.resolve());

  const core = Api.goals.getQuery(goalInput).then(async ({ goal }) => {
    if (!goal) throw new Error(`Goal data is unavailable for goal "${params.id}"`);

    if (tab !== "docs-and-files") return;

    if (!goal.resourceHub?.id) {
      // The page falls back to Overview, where related work errors remain recoverable.
      await Api.companies.getWorkMapQuery(contentInputs.workMapInput).catch(() => undefined);
      return;
    }

    // Keep docs errors recoverable inside the tab.
    await prefetchResourceHubDocs(resourceHubDocsInputs(goal.resourceHub.id)).catch(() => undefined);
  });

  // Tab queries retain errors in the cache so their sections can render Retry.
  await Promise.all([core, Api.goals.countChildrenQuery(childrenInput), selectedContent.catch(() => undefined)]);

  return { goalInput, childrenInput, ...contentInputs };
}

type LoaderInputs = Awaited<ReturnType<typeof loader>>;

export function useLoadedData() {
  const inputs = Pages.useLoadedData<LoaderInputs>();
  const goalQuery = useLoadedQuery(Api.goals.getQueryOptions(inputs.goalInput));
  const childrenQuery = useLoadedQuery(Api.goals.countChildrenQueryOptions(inputs.childrenInput));

  const data = useMemo(() => {
    const goal = goalQuery.data?.goal;

    if (!goal?.permissions || !goal.privacy || !goal.accessLevels) {
      throw new Error(`Goal data is unavailable for goal "${inputs.goalInput.id}"`);
    }

    if (!childrenQuery.data?.childrenCount) {
      throw new Error(`Goal content is unavailable for goal "${inputs.goalInput.id}"`);
    }

    return {
      goal: { ...goal, permissions: goal.permissions, privacy: goal.privacy, accessLevels: goal.accessLevels },
      childrenCount: childrenQuery.data.childrenCount,
    };
  }, [goalQuery.data, childrenQuery.data, inputs.goalInput.id]);

  return { ...inputs, data };
}

export function useRefresh() {
  const client = useQueryClient();
  const { goalInput } = Pages.useLoadedData<LoaderInputs>();

  return useCallback(() => invalidateGoalPageQueries(client, goalInput.id), [client, goalInput.id]);
}
