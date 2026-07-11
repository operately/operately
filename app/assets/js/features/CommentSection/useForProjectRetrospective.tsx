import { useMemo } from "react";

import * as Projects from "@/models/projects";
import * as Comments from "@/models/comments";

import { FormState } from "./form";
import { useComments } from "./useComments";

export function useForProjectRetrospective(retrospective: Projects.ProjectRetrospective): FormState {
  const form = useComments({ retrospective, parentType: "project_retrospective" });

  const comments: Comments.CommentItem[] = useMemo(() => {
    if (!form.items) return [];
    if (!retrospective.acknowledgedAt) return form.items;

    return Comments.insertAcknowledgement(form.items, retrospective.acknowledgedAt, retrospective.acknowledgedBy);
  }, [form.items, retrospective]);

  return { ...form, items: comments };
}
