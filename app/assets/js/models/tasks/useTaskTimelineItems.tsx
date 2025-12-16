import * as React from "react";

import Api from "@/api";
import { TASK_ACTIVITY_TYPES } from "@/models/activities/feed";
import * as Activities from "@/models/activities";
import * as Comments from "@/models/comments";

export function useTaskTimelineItems(taskId: string | null, commentEntityType: Comments.CommentParentType) {
  const [activities, setActivities] = React.useState<Activities.Activity[]>([]);
  const [comments, setComments] = React.useState<Comments.Comment[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (!taskId) {
      setActivities([]);
      setComments([]);
      setIsLoading(false);
      return;
    }

    let canceled = false;
    setIsLoading(true);

    Promise.all([
      Api.getActivities({
        scopeId: taskId,
        scopeType: "task",
        actions: TASK_ACTIVITY_TYPES,
      }).then((d) => d.activities ?? []),
      Api.getComments({
        entityId: taskId,
        entityType: commentEntityType,
      }).then((d) => d.comments ?? []),
    ])
      .then(([nextActivities, nextComments]) => {
        if (canceled) return;
        setActivities(nextActivities);
        setComments(nextComments);
      })
      .catch(() => {
        if (canceled) return;
        setActivities([]);
        setComments([]);
      })
      .finally(() => {
        if (canceled) return;
        setIsLoading(false);
      });

    return () => {
      canceled = true;
    };
  }, [taskId, commentEntityType]);

  return { activities, comments, isLoading };
}
