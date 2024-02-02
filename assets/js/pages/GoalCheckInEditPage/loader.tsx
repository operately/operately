import client from "@/graphql/client";

import * as Pages from "@/components/Pages";
import * as Goals from "@/models/goals";
import * as Updates from "@/graphql/Projects/updates";

interface LoaderResult {
  goal: Goals.Goal;
  checkIn: Updates.Update;
}

export async function loader({ params }): Promise<LoaderResult> {
  let updateData = await client.query({
    query: Updates.GET_STATUS_UPDATE,
    variables: { id: params.id },
    fetchPolicy: "network-only",
  });

  return {
    goal: await Goals.getGoal(params.goalId, {
      includeTargets: true,
    }),
    checkIn: updateData.data.update,
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}

export function useRefresh() {
  return Pages.useRefresh();
}
