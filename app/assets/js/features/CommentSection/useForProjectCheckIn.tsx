import { useMemo } from "react";

import * as ProjectCheckIns from "@/models/projectCheckIns";
import * as Comments from "@/models/comments";
import * as Time from "@/utils/time";

import { FormState } from "./form";
import { useComments } from "./useComments";

export function useForProjectCheckIn(checkIn: ProjectCheckIns.ProjectCheckIn): FormState {
  const form = useComments({ checkIn, parentType: "project_check_in" });

  const comments: Comments.CommentItem[] = useMemo(() => {
    if (!form.items) return [];
    if (!checkIn.acknowledgedAt) return form.items;

    const { before, after } = Comments.splitComments(form.items, checkIn.acknowledgedAt);

    const acknowledgement = {
      type: "acknowledgement",
      insertedAt: Time.parse(checkIn.acknowledgedAt)!,
      value: checkIn.acknowledgedBy,
    } as Comments.CommentItem;

    return [...before, acknowledgement, ...after];
  }, [form.items, checkIn]);

  return { ...form, items: comments };
}
