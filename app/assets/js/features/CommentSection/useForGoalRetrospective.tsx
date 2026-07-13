import { useMemo } from "react";

import * as Activities from "@/models/activities";
import * as Comments from "@/models/comments";
import * as Goals from "@/models/goals";

import { FormState } from "./form";
import { useComments } from "./useComments";

export function useForGoalRetrospective(activity: Activities.Activity, goal: Goals.Goal): FormState {
  const form = useComments({ thread: activity.commentThread!, goal, parentType: "goal_discussion" });

  const comments: Comments.CommentItem[] = useMemo(() => {
    if (!form.items) return [];
    if (!activity.commentThread?.acknowledgedAt) return form.items;

    return Comments.insertAcknowledgement(
      form.items,
      activity.commentThread.acknowledgedAt,
      activity.commentThread.acknowledgedBy,
    );
  }, [form.items, activity.commentThread]);

  return { ...form, items: comments };
}
