import { useMemo } from "react";

import * as Activities from "@/models/activities";
import * as Comments from "@/models/comments";
import * as Goals from "@/models/goals";
import * as Time from "@/utils/time";

import { FormState } from "./form";
import { useComments } from "./useComments";

export function useForGoalRetrospective(activity: Activities.Activity, goal: Goals.Goal): FormState {
  const form = useComments({ thread: activity.commentThread!, goal, parentType: "goal_discussion" });

  const comments: Comments.CommentItem[] = useMemo(() => {
    if (!form.items) return [];
    if (!activity.commentThread?.acknowledgedAt) return form.items;

    const { before, after } = Comments.splitComments(form.items, activity.commentThread.acknowledgedAt);

    const acknowledgement = {
      type: "acknowledgement",
      insertedAt: Time.parse(activity.commentThread.acknowledgedAt)!,
      value: activity.commentThread.acknowledgedBy,
    } as Comments.CommentItem;

    return [...before, acknowledgement, ...after];
  }, [form.items, activity.commentThread]);

  return { ...form, items: comments };
}
