import { useMemo } from "react";

import * as GoalCheckIns from "@/models/goalCheckIns";
import * as Comments from "@/models/comments";

import { FormState } from "./form";
import { useComments } from "./useComments";

export function useForGoalCheckIn(update: GoalCheckIns.Update): FormState {
  const form = useComments({ update, parentType: "goal_update" });

  const comments: Comments.CommentItem[] = useMemo(() => {
    if (!form.items) return [];
    if (!update.acknowledged || !update.acknowledgedAt) return form.items;

    return Comments.insertAcknowledgement(form.items, update.acknowledgedAt, update.acknowledgingPerson);
  }, [form.items, update]);

  return { ...form, items: comments };
}
