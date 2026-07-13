import { useMemo } from "react";

import * as ProjectCheckIns from "@/models/projectCheckIns";
import * as Comments from "@/models/comments";

import { FormState } from "./form";
import { useComments } from "./useComments";

export function useForProjectCheckIn(checkIn: ProjectCheckIns.ProjectCheckIn): FormState {
  const form = useComments({ checkIn, parentType: "project_check_in" });

  const comments: Comments.CommentItem[] = useMemo(() => {
    if (!form.items) return [];
    if (!checkIn.acknowledgedAt) return form.items;

    return Comments.insertAcknowledgement(form.items, checkIn.acknowledgedAt, checkIn.acknowledgedBy);
  }, [form.items, checkIn]);

  return { ...form, items: comments };
}
