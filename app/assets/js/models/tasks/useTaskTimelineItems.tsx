import Api, { type Activity, type Comment } from "@/api";
import { QueryClient, useQuery } from "@tanstack/react-query";
import { TASK_ACTIVITY_TYPES } from "@/models/activities/feed";

type CommentEntityType = "project_task" | "space_task";
const EMPTY_ACTIVITIES: Activity[] = [];
const EMPTY_COMMENTS: Comment[] = [];

function timelineQueries(taskId: string, commentEntityType: CommentEntityType) {
  return {
    activities: Api.companies.listActivitiesQueryOptions({
      scopeId: taskId,
      scopeType: "task",
      actions: TASK_ACTIVITY_TYPES,
    }),
    comments: Api.comments.listQueryOptions({ entityId: taskId, entityType: commentEntityType }),
  };
}

export async function invalidateTaskTimelineQueries(
  queryClient: QueryClient,
  taskId: string,
  commentEntityType: CommentEntityType,
) {
  const queries = timelineQueries(taskId, commentEntityType);
  await Promise.all(
    Object.values(queries).map(({ queryKey }) => queryClient.invalidateQueries({ queryKey, exact: true })),
  );
}

export function useTaskTimelineItems(taskId: string | null, commentEntityType: CommentEntityType) {
  const queries = timelineQueries(taskId ?? "", commentEntityType);
  const activities = useQuery({ ...queries.activities, enabled: Boolean(taskId) });
  const comments = useQuery({ ...queries.comments, enabled: Boolean(taskId) });

  return {
    activities: taskId ? (activities.data?.activities ?? EMPTY_ACTIVITIES) : EMPTY_ACTIVITIES,
    comments: taskId ? (comments.data?.comments ?? EMPTY_COMMENTS) : EMPTY_COMMENTS,
    isLoading: Boolean(taskId) && (activities.isLoading || comments.isLoading),
  };
}
