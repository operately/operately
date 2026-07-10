import { useMemo } from "react";

import * as Projects from "@/models/projects";
import * as Comments from "@/models/comments";
import * as Time from "@/utils/time";

import { FormState } from "./form";
import { useComments } from "./useComments";

export function useForProjectRetrospective(retrospective: Projects.ProjectRetrospective): FormState {
  const form = useComments({ retrospective, parentType: "project_retrospective" });

  const comments: Comments.CommentItem[] = useMemo(() => {
    if (!form.items) return [];
    if (!retrospective.acknowledgedAt) return form.items;

    const { before, after } = Comments.splitComments(form.items, retrospective.acknowledgedAt);

    const acknowledgement = {
      type: "acknowledgement",
      insertedAt: Time.parse(retrospective.acknowledgedAt)!,
      value: retrospective.acknowledgedBy,
    } as Comments.CommentItem;

    return [...before, acknowledgement, ...after];
  }, [form.items, retrospective]);

  return { ...form, items: comments };
}
