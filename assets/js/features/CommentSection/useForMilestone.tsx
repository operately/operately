import { useState } from "react";

import * as Milestones from "@/models/milestones";
import * as Comments from "@/models/comments";
import * as People from "@/models/people";
import * as Time from "@/utils/time";

import { assertPresent } from "@/utils/assertions";
import { FormState } from "./form";
import { useEditComment } from "./utils";

export function useForMilestone(milestone: Milestones.Milestone): FormState {
  assertPresent(milestone.comments, "comments must be present in milestone");

  const [items, setItems] = useParseComments(milestone.comments);

  const [post, { loading: submittingPost }] = Milestones.usePostMilestoneComment();
  const { editComment, loading: submittingEdit } = useEditComment({
    comments: items,
    setComments: setItems,
    parentType: "milestone",
  });

  const postComment = async (content: string) => {
    await post({
      milestoneId: milestone.id,
      content: JSON.stringify(content),
      action: "none",
    });
  };

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
  const [items, setItems] = useState(parseComments(comments));

  return [items, setItems] as const;
}

//
// Helpers
//

function parseComments(comments: Milestones.MilestoneComment[]): Comments.CommentItem[] {
  return comments.map(({ action, comment }) => {
    assertPresent(comment, "comment must be present in commentMilestone");

    if (action === "none") {
      return { type: "comment" as Comments.ItemType, insertedAt: Time.parse(comment.insertedAt)!, value: comment };
    }

    if (action === "complete") {
      return {
        type: "milestone-completed" as Comments.ItemType,
        insertedAt: Time.parse(comment.insertedAt)!,
        value: comment,
      };
    }

    if (action === "reopen") {
      return {
        type: "milestone-reopened" as Comments.ItemType,
        insertedAt: Time.parse(comment.insertedAt)!,
        value: comment,
      };
    }

    throw new Error("Invalid comment action " + action);
  });
}
