import Api, { Activity, Comment, ProjectChildrenCount, Task } from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";
import { TASK_ACTIVITY_TYPES } from "@/models/activities/feed";
import { useQueryClient } from "@tanstack/react-query";

export async function loader({ params }) {
  const taskInput = {
    id: params.id,
    includeProject: true,
    includeMilestone: true,
    includeAssignees: true,
    includeCreator: true,
    includeProjectSpace: true,
    includePermissions: true,
    includeSubscriptionList: true,
    includeAvailableStatuses: true,
  };
  const childrenCountInput = { id: params.id, useTaskId: true };
  const activitiesInput = {
    scopeId: params.id,
    scopeType: "task" as const,
    actions: TASK_ACTIVITY_TYPES,
  };
  const commentsInput = {
    entityId: params.id,
    entityType: "project_task" as const,
  };

  await Promise.all([
    Api.tasks.getQuery(taskInput),
    Api.projects.countChildrenQuery(childrenCountInput),
    Api.companies.listActivitiesQuery(activitiesInput),
    Api.comments.listQuery(commentsInput),
  ]);

  return { taskInput, childrenCountInput, activitiesInput, commentsInput };
}

type LoaderResult = Awaited<ReturnType<typeof loader>>;

export function useLoadedData(): {
  task: Task;
  childrenCount: ProjectChildrenCount;
  activities: Activity[];
  comments: Comment[];
} {
  const { taskInput, childrenCountInput, activitiesInput, commentsInput } = Pages.useLoadedData<LoaderResult>();
  const { data: taskData } = useLoadedQuery(Api.tasks.getQueryOptions(taskInput));
  const { data: childrenCountData } = useLoadedQuery(Api.projects.countChildrenQueryOptions(childrenCountInput));
  const { data: activitiesData } = useLoadedQuery(Api.companies.listActivitiesQueryOptions(activitiesInput));
  const { data: commentsData } = useLoadedQuery(Api.comments.listQueryOptions(commentsInput));

  if (!taskData?.task) {
    throw new Error(`Task data is unavailable for task "${taskInput.id}"`);
  }

  if (!childrenCountData || !activitiesData || !commentsData) {
    throw new Error(`Supporting data is unavailable for task "${taskInput.id}"`);
  }

  return {
    task: taskData.task,
    childrenCount: childrenCountData.childrenCount,
    activities: activitiesData.activities,
    comments: commentsData.comments,
  };
}

export function useRefresh(): () => Promise<void> {
  const queryClient = useQueryClient();
  const { taskInput, childrenCountInput, activitiesInput, commentsInput } = Pages.useLoadedData<LoaderResult>();

  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: Api.tasks.getQueryKey(taskInput) }),
      queryClient.invalidateQueries({ queryKey: Api.projects.countChildrenQueryKey(childrenCountInput) }),
      queryClient.invalidateQueries({ queryKey: Api.companies.listActivitiesQueryKey(activitiesInput) }),
      queryClient.invalidateQueries({ queryKey: Api.comments.listQueryKey(commentsInput) }),
    ]);
  };
}
