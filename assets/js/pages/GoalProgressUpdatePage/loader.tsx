import * as Pages from "@/components/Pages";
import * as GoalCheckIns from "@/models/goalCheckIns";

interface LoaderResult {
  update: GoalCheckIns.Update;
}

export async function loader({ params }): Promise<LoaderResult> {
  const updatePromise = GoalCheckIns.getGoalProgressUpdate({
    id: params.id,
    includeGoalTargets: true,
    includeAcknowledgedBy: true,
    includeReactions: true,
    includeAuthor: true,
  }).then((data) => data.update!);

  return {
    update: await updatePromise,
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}

export function useRefresh() {
  return Pages.useRefresh();
}
