import { useEffect, useState } from "react";

import { useDiscussionCommentsChangeSignal } from "@/models/comments";
import * as Milestones from "@/models/milestones";
import * as People from "@/models/people";

import { assertPresent } from "@/utils/assertions";
import { FormState } from "./form";
import { parseMilestoneComments, useCreateComment, useEditComment } from "./utils";

export function useForMilestone(milestone: Milestones.Milestone, refresh: () => void): FormState {
  assertPresent(milestone.comments, "comments must be present in milestone");

  const [items, setItems] = useParseComments(milestone.comments);
  useDiscussionCommentsChangeSignal(refresh, { discussionId: milestone.id! });

  const { postComment, loading: submittingPost } = useCreateComment({
    setComments: setItems,
    entityId: milestone.id!,
    entityType: "milestone",
  });
  const { editComment, loading: submittingEdit } = useEditComment({
    comments: items,
    setComments: setItems,
    parentType: "milestone",
  });

  const res = {
    items,
    postComment,
    editComment,
    submitting: submittingPost || submittingEdit,
    mentionSearchScope: { type: "project", id: milestone.project!.id } as People.SearchScope,
  };

  return res;
}

function useParseComments(comments: Milestones.MilestoneComment[]) {
  const [items, setItems] = useState(parseMilestoneComments(comments));

  useEffect(() => {
    if (!comments) return;

    setItems(parseMilestoneComments(comments));
  }, [comments]);

  return [items, setItems] as const;
}
