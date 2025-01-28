import { useMemo } from "react";

import * as GoalCheckIns from "@/models/goalCheckIns";
import * as Comments from "@/models/comments";
import * as Time from "@/utils/time";

import { FormState } from "./form";
import { useComments } from "./useComments";

export function useForGoalCheckIn(update: GoalCheckIns.Update): FormState {
  const form = useComments({ update, parentType: "goal_update" });

  const comments: Comments.CommentItem[] = useMemo(() => {
    if (!form.items) return [];
    if (!update.acknowledged) return form.items;

    const { before, after } = Comments.splitComments(form.items, update.acknowledgedAt!);

    const acknowledgement = {
      type: "acknowledgement",
      insertedAt: Time.parse(update.acknowledgedAt)!,
      value: update.acknowledgingPerson,
    } as Comments.CommentItem;

    return [...before, acknowledgement, ...after];
  }, [form.items, update]);

  return { ...form, items: comments };
}
