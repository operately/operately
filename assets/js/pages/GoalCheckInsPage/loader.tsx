import client from "@/graphql/client";

import * as Pages from "@/components/Pages";
import * as Goals from "@/models/goals";
import * as Updates from "@/graphql/Projects/updates";

interface LoaderResult {
  goal: Goals.Goal;
  updates: Updates.Update[];
}

export async function loader({ params }): Promise<LoaderResult> {
  let updatesData = await client.query({
    query: Updates.LIST_UPDATES,
    variables: {
      filter: {
        goalId: params.goalId,
        type: "goal_check_in",
      },
    },
    fetchPolicy: "network-only",
  });

  return {
    goal: await Goals.getGoal(params.goalId, {
      includeTargets: true,
    }),
    updates: updatesData.data.updates,
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
