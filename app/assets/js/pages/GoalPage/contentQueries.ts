import Api, { type GoalProgressUpdate, type GoalDiscussion } from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import type { WorkMapItem } from "@/models/workMap";

const EMPTY_WORK_MAP: WorkMapItem[] = [];
const EMPTY_CHECK_INS: GoalProgressUpdate[] = [];
const EMPTY_DISCUSSIONS: GoalDiscussion[] = [];

export function goalContentInputs(goalId: string) {
  return {
    workMapInput: { parentGoalId: goalId, includeAssignees: true },
    checkInsInput: { goalId },
    discussionsInput: { goalId },
  };
}

export function useGoalContentQueries({
  workMapInput,
  checkInsInput,
  discussionsInput,
}: ReturnType<typeof goalContentInputs>) {
  // Mount every query immediately; reuse loader-prefetched content without refetching.
  const workMap = useLoadedQuery(Api.companies.getWorkMapQueryOptions(workMapInput));
  const checkIns = useLoadedQuery(Api.goals.listCheckInsQueryOptions(checkInsInput));
  const discussions = useLoadedQuery(Api.goals.listDiscussionsQueryOptions(discussionsInput));

  return {
    workMap: workMap.data?.workMap ?? EMPTY_WORK_MAP,
    relatedWorkLoading: workMap.isLoading,
    relatedWorkError: workMap.isError,
    retryRelatedWork: () => {
      void workMap.refetch();
    },
    checkIns: checkIns.data?.checkIns ?? EMPTY_CHECK_INS,
    checkInsLoading: checkIns.isLoading,
    checkInsError: checkIns.isError,
    retryCheckIns: () => {
      void checkIns.refetch();
    },
    discussions: discussions.data?.discussions ?? EMPTY_DISCUSSIONS,
    discussionsLoading: discussions.isLoading,
    discussionsError: discussions.isError,
    retryDiscussions: () => {
      void discussions.refetch();
    },
  };
}
