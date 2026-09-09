import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Api, { type ProjectCheckIn, type Task, type CommentThread } from "@/api";
import { useLoadedQuery } from "@/api/queryClient";

const EMPTY_TASKS: Task[] = [];
const EMPTY_CHECK_INS: ProjectCheckIn[] = [];
const EMPTY_DISCUSSIONS: CommentThread[] = [];

export function projectContentInputs(projectId: string) {
  return {
    checkInsInput: { projectId, includeAuthor: true },
    discussionsInput: { projectId },
    tasksInput: { projectId },
  };
}

export function useProjectContentQueries({
  checkInsInput,
  discussionsInput,
  tasksInput,
}: ReturnType<typeof projectContentInputs>) {
  const queryClient = useQueryClient();

  // All queries mount immediately, regardless of the selected tab.
  // Missing data is fetched; loader-prefetched data is reused without a second request.
  const checkIns = useLoadedQuery(Api.projects.listCheckInsQueryOptions(checkInsInput));
  const discussions = useLoadedQuery(Api.projects.listDiscussionsQueryOptions(discussionsInput));
  const tasks = useLoadedQuery(Api.tasks.listQueryOptions(tasksInput));

  const refresh = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: Api.tasks.listQueryKey(tasksInput) }),
      queryClient.invalidateQueries({ queryKey: Api.projects.listCheckInsQueryKey(checkInsInput) }),
      queryClient.invalidateQueries({ queryKey: Api.projects.listDiscussionsQueryKey(discussionsInput) }),
    ]);
  }, [queryClient, checkInsInput, discussionsInput, tasksInput]);

  return {
    backendTasks: tasks.data?.tasks ?? EMPTY_TASKS,
    tasksLoaded: tasks.data !== undefined,
    tasksLoading: tasks.isLoading,
    tasksError: tasks.isError,
    retryTasks: () => {
      void tasks.refetch();
    },
    checkIns: checkIns.data?.projectCheckIns ?? EMPTY_CHECK_INS,
    discussions: discussions.data?.discussions ?? EMPTY_DISCUSSIONS,
    checkInsLoading: checkIns.isLoading,
    discussionsLoading: discussions.isLoading,
    checkInsError: checkIns.isError,
    discussionsError: discussions.isError,
    retryCheckIns: () => {
      void checkIns.refetch();
    },
    retryDiscussions: () => {
      void discussions.refetch();
    },
    refresh,
  };
}
