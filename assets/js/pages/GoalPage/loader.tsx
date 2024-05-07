import * as Pages from "@/components/Pages";
import * as Goals from "@/models/goals";
import * as CommentThreads from "@/models/commentThreads";

interface LoaderResult {
  goal: Goals.Goal;
  threads: CommentThreads.CommentThread[];
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    goal: await Goals.getGoal({
      id: params.id,
      includeTargets: true,
      includeProjects: true,
      includeLastCheckIn: true,
      includeParentGoal: true,
    }),

    threads: await CommentThreads.getCommentThreads({
      scopeType: "goal",
      scopeId: params.id,
    }),
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
